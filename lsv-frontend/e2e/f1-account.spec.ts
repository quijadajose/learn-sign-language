import { expect, test } from "./fixtures/roles";

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
  await studentPage.goto("/profile");
  await studentPage.getByRole("button", { name: "Editar Perfil" }).click();
  const updatedName = `Student ${Date.now()}`;
  await studentPage.getByLabel("Nombre").fill(updatedName);
  await studentPage.getByRole("button", { name: "Guardar Cambios" }).click();
  await expect(studentPage.getByLabel("Nombre")).toHaveValue(updatedName);
  await studentPage.reload();
  await expect(studentPage.getByLabel("Nombre")).toHaveValue(updatedName);
});

test("password reset request accepts the test account email", async ({
  page,
}) => {
  await page.goto("/forgotPassword");
  await page
    .getByLabel(/correo electrónico|email/i)
    .fill(process.env.API_USER_EMAIL!);
  await page.getByRole("button", { name: /enviar|send/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 7000 });
});
