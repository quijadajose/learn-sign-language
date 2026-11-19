import { request, type FullConfig } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
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
  const cookie = response
    .headers()
    ["set-cookie"]?.match(/lsv_access=([^;,]+)/)?.[1];
  if (!cookie) throw new Error("Admin login did not provide lsv_access");
  const token = decodeURIComponent(cookie);
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
  const bearer = { Authorization: `Bearer ${admin.token}` };
  const quizVariant = await admin.context.post("/api/quiz-variants", {
    headers: bearer,
    data: {
      lessonVariantId: curriculum.lessonVariantId,
      questions: [
        {
          question: "Regional question",
          options: [
            { text: "Regional correct", isCorrect: true },
            { text: "Regional other", isCorrect: false },
          ],
        },
      ],
    },
  });
  if (!quizVariant.ok())
    throw new Error(
      `Quiz variant setup failed with status ${quizVariant.status()}`,
    );
  const suffix = Date.now();
  const modEmail = `pw-moderator-${suffix}@example.com`;
  const modPassword = userPassword;
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
  const studentEmail = `pw-student-${suffix}@example.com`;
  const studentRegistration = await admin.context.post("/api/auth/register", {
    headers: bearer,
    data: {
      email: studentEmail,
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
  const student = await login(
    baseURL,
    studentEmail,
    userPassword,
    resolve(states, "student.json"),
  );
  await student.context.dispose();
  await login(
    baseURL,
    modEmail,
    modPassword,
    resolve(states, "moderator.json"),
  ).then(({ context }) => context.dispose());
  await writeFile(
    resolve(states, "curriculum.json"),
    JSON.stringify(curriculum),
  );
}
