import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";

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

test("admin creates a stage from the language workspace", async ({
  adminPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { languageId: string };
  const stageName = `F4 Stage ${Date.now()}`;
  await adminPage.goto(`/admin/languages/${curriculum.languageId}`);
  await adminPage.getByText("Etapas", { exact: true }).first().click();
  await expect(adminPage).toHaveURL(/\/admin\/stages/);

  // Sin etapas el botón es el del estado vacío; con etapas, "Añadir etapa".
  await adminPage
    .getByRole("button", { name: /Crear etapa personalizada|Añadir etapa/ })
    .first()
    .click();
  await adminPage.locator("#name").fill(stageName);
  await adminPage.locator("#description").fill("F4 stage fixture");
  const created = adminPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/stage") &&
      response.request().method() === "POST",
  );
  await adminPage.getByRole("button", { name: "Crear Etapa" }).click();
  expect((await created).status()).toBe(201);
  await expect(adminPage.getByText(stageName, { exact: true })).toBeVisible();
});

test("admin creates a region with an ISO division", async ({ adminPage }) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { languageId: string; languageName: string };
  // Visitar el espacio de trabajo deja el idioma seleccionado para el formulario de regiones.
  await adminPage.goto(`/admin/languages/${curriculum.languageId}`);
  await adminPage.goto("/admin/regions");
  await adminPage
    .getByRole("button", { name: /Crear Nueva Región|Crear primera región/ })
    .first()
    .click();

  // Las divisiones dependen del país del idioma elegido: se selecciona el idioma en el formulario.
  await adminPage
    .locator("#create-language input")
    .fill(curriculum.languageName);
  await adminPage
    .getByText(curriculum.languageName, { exact: true })
    .last()
    .click();
  // #create-division es el contenedor de react-select; el texto va en su input interno.
  const divisionInput = adminPage.locator("#create-division input");
  await divisionInput.fill("Alaska");
  await adminPage.getByText("Alaska", { exact: false }).last().click();
  await adminPage.locator("#create-description").fill("F4 region fixture");

  const created = adminPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/region") &&
      response.request().method() === "POST",
  );
  await adminPage.getByRole("button", { name: "Crear Región" }).click();
  expect((await created).status()).toBe(201);
  await expect(
    adminPage.getByText("Región creada exitosamente", { exact: true }),
  ).toBeVisible();
});
