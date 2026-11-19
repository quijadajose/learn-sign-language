import { expect, test } from "./fixtures/roles";
import {
  extractResetToken,
  messageHtml,
  waitForMail,
} from "./fixtures/mailpit";

test("registration completes both steps and creates a usable account", async ({
  page,
}) => {
  const email = `pw-register-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Nombre").fill("Playwright");
  await page.getByLabel("Apellido").fill("Account");
  await page.getByLabel("Edad").fill("25");
  await page.getByRole("button", { name: "Siguiente" }).click();

  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("Test-password-9081");
  await page.getByLabel("Repita la Contraseña").fill("Test-password-9081");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel(/correo electrónico|email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill("Test-password-9081");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("login reports invalid credentials and Google button targets local OAuth", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByLabel(/correo electrónico|email/i)
    .fill(`missing-${Date.now()}@example.com`);
  await page.getByLabel(/contraseña|password/i).fill("Wrong-password-9081");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText(/invalid|incorrect|inválid|incorrect/i),
  ).toBeVisible();

  const google = page.getByRole("button", {
    name: /sign in with google|iniciar sesión con google/i,
  });
  await expect(google).toBeVisible();
  await expect(google).toHaveAttribute("type", "button");
  await page.route("**/api/auth/google", (route) =>
    route.fulfill({ status: 204 }),
  );
  const oauthRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/auth/google"),
  );
  await google.click();
  await oauthRequest;
});

test("student can update profile details and see the persisted value", async ({
  studentPage,
}) => {
  // El alumno es compartido entre specs (F2 busca su nombre en el leaderboard):
  // se restaura el nombre original al final aunque una aserción falle.
  await studentPage.goto("/profile");
  await studentPage.getByRole("button", { name: "Editar Perfil" }).click();
  const originalName = await studentPage.getByLabel("Nombre").inputValue();
  const updatedName = `Student ${Date.now()}`;
  try {
    await studentPage.getByLabel("Nombre").fill(updatedName);
    await studentPage.getByRole("button", { name: "Guardar Cambios" }).click();
    await expect(studentPage.getByLabel("Nombre")).toHaveValue(updatedName);
    await studentPage.reload();
    await expect(studentPage.getByLabel("Nombre")).toHaveValue(updatedName);
  } finally {
    await studentPage.goto("/profile");
    await studentPage.getByRole("button", { name: "Editar Perfil" }).click();
    await studentPage.getByLabel("Nombre").fill(originalName);
    await studentPage.getByRole("button", { name: "Guardar Cambios" }).click();
    await expect(studentPage.getByLabel("Nombre")).toHaveValue(originalName);
  }
});

test("password reset works end to end through the mail server", async ({
  page,
  request,
  baseURL,
}) => {
  // Usuario propio: cambiar la contraseña sube tokenVersion y cerraría la sesión del alumno compartido.
  const email = `pw-reset-${Date.now()}@example.com`;
  const oldPassword = "Old-password-9081";
  const newPassword = "New-password-9082";
  const registered = await request.post("/api/auth/register", {
    data: {
      email,
      password: oldPassword,
      firstName: "Reset",
      lastName: "Flow",
      age: 30,
      isRightHanded: true,
    },
  });
  expect(registered.status()).toBe(201);

  await page.goto("/forgotPassword");
  await page.locator("#email").fill(email);
  await page.locator('form button[type="submit"]').click();

  const mail = await waitForMail(email, "Restablecer");
  const token = extractResetToken(await messageHtml(mail.ID));

  await page.goto(`/reset-password#token=${encodeURIComponent(token)}`);
  const confirmed = page.waitForResponse(
    (response) =>
      response.url().includes("/password/reset/confirm") &&
      response.request().method() === "POST",
  );
  await page.locator("#newPassword").fill(newPassword);
  await page.locator("#confirmPassword").fill(newPassword);
  await page.locator('form button[type="submit"]').click();
  expect((await confirmed).ok()).toBe(true);

  const withNew = await request.post("/api/auth/login", {
    data: { email, password: newPassword },
    headers: { Origin: baseURL! },
  });
  expect(withNew.status()).toBe(200);
  const withOld = await request.post("/api/auth/login", {
    data: { email, password: oldPassword },
    headers: { Origin: baseURL! },
  });
  expect(withOld.status()).toBe(401);

  // BE-12: el enlace es de un solo uso.
  const reused = await request.post("/api/auth/password/reset/confirm", {
    data: { token, newPassword: "Another-9083" },
    headers: { Origin: baseURL! },
  });
  expect(reused.status()).toBe(400);
});
