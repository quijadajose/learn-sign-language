import { request, type FullConfig } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { seedCurriculum } from "./seed.mjs";

async function login(
  baseURL: string,
  email: string,
  password: string,
  statePath: string,
) {
  const context = await request.newContext({ baseURL });
  const response = await context.post("/api/auth/login", {
    data: { email, password },
  });
  if (!response.ok())
    throw new Error(`API login failed with status ${response.status()}`);
  const token = (await context.storageState()).cookies.find(
    (cookie) => cookie.name === "lsv_access",
  )?.value;
  if (!token) throw new Error("Admin login did not provide lsv_access");
  await context.storageState({ path: statePath });
  return { context, token };
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0].use.baseURL);
  const states = resolve("e2e/.auth");
  await mkdir(states, { recursive: true });
  const adminEmail = process.env.API_ADMIN_EMAIL;
  const adminPassword = process.env.API_ADMIN_PASSWORD;
  const userEmail = process.env.API_USER_EMAIL;
  const userPassword = process.env.API_USER_PASSWORD;
  if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
    throw new Error("Set test role credentials in the local environment");
  }
  const admin = await login(
    baseURL,
    adminEmail,
    adminPassword,
    resolve(states, "admin.json"),
  );
  const curriculum = await seedCurriculum(`${baseURL}/api`, admin.token);
  const suffix = Date.now();
  const modEmail = `pw-moderator-${suffix}@example.com`;
  const modPassword = userPassword;
  const bearer = { Authorization: `Bearer ${admin.token}` };
  const register = await admin.context.post("/api/auth/register", {
    headers: bearer,
    data: {
      email: modEmail,
      password: modPassword,
      firstName: "Playwright",
      lastName: "Moderator",
      age: 25,
      isRightHanded: true,
    },
  });
  if (!register.ok())
    throw new Error(
      `Moderator registration failed with status ${register.status()}`,
    );
  const find = await admin.context.get(
    `/api/admin/moderators/users/search?q=${encodeURIComponent(modEmail)}`,
    { headers: bearer },
  );
  if (!find.ok())
    throw new Error(`Moderator lookup failed with status ${find.status()}`);
  const users = await find.json();
  const moderatorId = users.data?.[0]?.id ?? users[0]?.id;
  if (!moderatorId)
    throw new Error("Registered moderator was not found through the admin API");
  const assigned = await admin.context.post("/api/admin/moderators", {
    headers: bearer,
    data: {
      userId: moderatorId,
      scope: "language",
      targetId: curriculum.languageId,
    },
  });
  if (!assigned.ok())
    throw new Error(
      `Moderator permission assignment failed with status ${assigned.status()}`,
    );
  const studentRegistration = await admin.context.post("/api/auth/register", {
    headers: bearer,
    data: {
      email: userEmail,
      password: userPassword,
      firstName: "Playwright",
      lastName: "Student",
      age: 25,
      isRightHanded: true,
    },
  });
  if (!studentRegistration.ok())
    throw new Error(
      `Student registration failed with status ${studentRegistration.status()}`,
    );
  await admin.context.dispose();
  await login(
    baseURL,
    userEmail,
    userPassword,
    resolve(states, "student.json"),
  ).then(({ context }) => context.dispose());
  await login(
    baseURL,
    modEmail,
    modPassword,
    resolve(states, "moderator.json"),
  ).then(({ context }) => context.dispose());
}
