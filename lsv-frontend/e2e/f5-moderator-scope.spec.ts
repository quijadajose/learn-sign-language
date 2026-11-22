import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";

type Curriculum = { languageId: string; lessonId: string; stageId: string };

const json = (headers: Record<string, string>, origin: string) => ({
  ...headers,
  Origin: origin,
});

test("moderator cannot create signs in a language it does not manage", async ({
  moderatorPage,
  adminPage,
  baseURL,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const origin = baseURL!;
  // Idioma ajeno al moderador, creado por el admin.
  const other = await adminPage.context().request.post("/api/languages", {
    headers: json({}, origin),
    data: {
      name: `F5 other ${Date.now()}`,
      description: "F5 isolation fixture",
      countryCode: "US",
    },
  });
  expect(other.status()).toBe(201);
  const otherId = (await other.json()).id as string;

  const forbidden = await moderatorPage
    .context()
    .request.post("/api/sign-record/sign", {
      headers: json({}, origin),
      data: {
        name: `Cross ${Date.now()}`,
        languageId: otherId,
        lessonId: curriculum.lessonId,
        detectionType: "static",
      },
    });
  expect(forbidden.status()).toBe(403);

  // La pantalla de su propio idioma sigue funcionando (control positivo).
  await moderatorPage.goto("/admin/sign-studio");
  await expect(moderatorPage.getByText(/Sign Studio/i).first()).toBeVisible({
    timeout: 15000,
  });
});

test("revoking a moderator's last permission takes effect without a new login", async ({
  browser,
  baseURL,
  adminPage,
}) => {
  const origin = baseURL!;
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const email = `pw-revoke-${Date.now()}@example.com`;
  const password = "Revoke-password-9084";
  const admin = adminPage.context().request;

  const registered = await admin.post("/api/auth/register", {
    headers: json({}, origin),
    data: {
      email,
      password,
      firstName: "Revoke",
      lastName: "Flow",
      age: 30,
      isRightHanded: true,
    },
  });
  expect(registered.status()).toBe(201);

  const userContext = await browser.newContext({ baseURL });
  const login = await userContext.request.post("/api/auth/login", {
    headers: json({}, origin),
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  const userId = (await login.json()).data.user.id as string;

  const assigned = await admin.post("/api/admin/moderators", {
    headers: json({}, origin),
    data: { userId, scope: "language", targetId: curriculum.languageId },
  });
  expect(assigned.status()).toBe(201);
  const permissionId = (await assigned.json()).id as string;

  const signBody = {
    name: `Revoke ${Date.now()}`,
    languageId: curriculum.languageId,
    lessonId: curriculum.lessonId,
    detectionType: "static",
  };
  const before = await userContext.request.post("/api/sign-record/sign", {
    headers: json({}, origin),
    data: signBody,
  });
  expect(before.status()).toBe(201);

  const revoked = await admin.delete(`/api/admin/moderators/${permissionId}`, {
    headers: json({}, origin),
  });
  expect(revoked.status()).toBe(200);

  const after = await userContext.request.post("/api/sign-record/sign", {
    headers: json({}, origin),
    data: { ...signBody, name: `Revoke after ${Date.now()}` },
  });
  expect(after.status()).toBe(403);
  await userContext.close();
});
