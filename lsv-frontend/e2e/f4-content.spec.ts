import { expect, test } from "./fixtures/roles";

test("admin creates and edits a language in the content panel", async ({
  adminPage,
}) => {
  const suffix = Date.now();
  const initialName = `F4 Language ${suffix}`;
  const editedName = `${initialName} edited`;
  await adminPage.goto("/admin/languages");
  await expect(
    adminPage.getByRole("heading", { name: "Lenguajes" }).first(),
  ).toBeVisible();

  await adminPage.getByRole("button", { name: "Añadir Idioma" }).click();
  await adminPage.getByText("País *").click();
  await adminPage.locator("#add-country input").fill("Chile");
  await adminPage.getByText("Chile", { exact: true }).last().click();
  await adminPage.locator("#add-name").fill(initialName);
  await adminPage.locator("#add-description").fill("F4 browser audit fixture");
  const createResponse = adminPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/languages") &&
      response.request().method() === "POST",
  );
  await adminPage.getByRole("button", { name: "Crear Idioma" }).click();
  const created = await createResponse;
  expect(created.status()).toBe(201);
  await expect(adminPage).toHaveURL(/\/admin\/languages\/[^/]+$/);

  await adminPage.goto("/admin/languages");
  const languageRow = adminPage
    .getByRole("row")
    .filter({ hasText: initialName });
  await expect(languageRow).toBeVisible();
  await languageRow.getByRole("button", { name: "Editar" }).click();
  await adminPage.locator("#edit-name").fill(editedName);
  await adminPage
    .locator("#edit-description")
    .fill("F4 edited browser audit fixture");
  const updateResponse = adminPage.waitForResponse(
    (response) =>
      response.url().includes("/api/languages/") &&
      response.request().method() === "PUT",
  );
  await adminPage.getByRole("button", { name: "Guardar Cambios" }).click();
  expect((await updateResponse).status()).toBe(200);
  await expect(
    adminPage.getByRole("row").filter({ hasText: editedName }),
  ).toBeVisible();
});

test("admin can open the content workspace and inspect its setup guidance", async ({
  adminPage,
}) => {
  await adminPage.goto("/admin/languages");
  const row = adminPage
    .getByRole("row")
    .filter({ hasText: "Playwright pw-" })
    .first();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Abrir panel" }).click();
  await expect(adminPage).toHaveURL(/\/admin\/languages\/[^/]+$/);
  await expect(
    adminPage.getByText(/Gestión|Etapas|Regiones|Lecciones/).first(),
  ).toBeVisible();
});
