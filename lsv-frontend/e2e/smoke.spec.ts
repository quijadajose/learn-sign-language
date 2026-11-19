import { expect, test } from "./fixtures/roles";

test("landing loads and admin session can sign out", async ({ adminPage }) => {
  await adminPage.goto("/");
  await expect(adminPage.locator("body")).not.toBeEmpty();
  await adminPage.goto("/dashboard");
  await expect(
    adminPage.getByRole("heading", { name: /quiero aprender/i }),
  ).toBeVisible();
  await adminPage
    .getByRole("button", { name: /user settings|configuración de usuario/i })
    .click();
  await expect(adminPage.getByText(process.env.API_ADMIN_EMAIL!)).toBeVisible();
  await adminPage.getByText(/sign out|cerrar sesión/i).click();
  await expect(adminPage).toHaveURL(/\/login/);
});
