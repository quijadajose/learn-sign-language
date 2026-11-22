import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";

test("language moderator creates individual and bulk signs", async ({
  moderatorPage,
}) => {
  test.setTimeout(60000);
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { languageId: string; stageId: string; lessonId: string };

  await moderatorPage.goto("/admin/sign-studio");
  await expect(moderatorPage.getByText(/Sign Studio|Sign Studio/i)).toBeVisible(
    { timeout: 15000 },
  );
  const stageResponse = moderatorPage.waitForResponse((response) =>
    response.url().includes(`/api/stage/${curriculum.languageId}`),
  );
  await moderatorPage.locator("#language").selectOption(curriculum.languageId);
  const stageResult = await stageResponse;
  if (!stageResult.ok()) {
    throw new Error(`Stage list returned ${stageResult.status()}`);
  }
  // El idioma puede tener varias etapas (F4 crea una): basta con que exista la del currículo.
  await expect(
    moderatorPage.locator(`#stage option[value="${curriculum.stageId}"]`),
  ).toHaveCount(1);
  await moderatorPage.locator("#stage").selectOption(curriculum.stageId);
  await moderatorPage.locator("#lesson").selectOption(curriculum.lessonId);

  const singleName = `Moderator ${Date.now()}`;
  await moderatorPage.getByRole("button", { name: "Nueva Seña" }).click();
  await moderatorPage.getByLabel(/Nombre de la seña/).fill(singleName);
  const createResponse = moderatorPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/sign-record/sign") &&
      response.request().method() === "POST",
  );
  await moderatorPage.getByRole("button", { name: "Crear Seña" }).click();
  const created = await createResponse;
  if (!created.ok()) {
    throw new Error(
      `Sign creation returned ${created.status()}: ${await created.text()}`,
    );
  }
  await expect(moderatorPage.getByText(singleName)).toBeVisible();

  const bulkName = `Bulk${Date.now()}`;
  await moderatorPage.getByRole("button", { name: "Nueva Seña" }).click();
  await moderatorPage.getByRole("button", { name: "Varias" }).click();
  await moderatorPage
    .getByPlaceholder(/Hola, Casa Gracias/)
    .fill(`${bulkName}One ${bulkName}Two`);
  await moderatorPage
    .getByRole("button", { name: "Agregar", exact: true })
    .click();
  const bulkResponse = moderatorPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/sign-record/signs") &&
      response.request().method() === "POST",
  );
  await moderatorPage
    .getByRole("button", { name: /Crear catálogo \(2\)/ })
    .click({ noWaitAfter: true });
  const bulkResult = await bulkResponse;
  if (!bulkResult.ok()) {
    throw new Error(
      `Bulk sign creation returned ${bulkResult.status()}: ${await bulkResult.text()}`,
    );
  }
  await expect(moderatorPage.getByText(`${bulkName}One`)).toBeVisible();
  await expect(moderatorPage.getByText(`${bulkName}Two`)).toBeVisible();
});
