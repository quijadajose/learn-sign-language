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

test("admin sees an API-created stage in the list and renames it (AF-F4-01)", async ({
  adminPage,
  baseURL,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { languageId: string };
  const admin = adminPage.context().request;
  const stageName = `F4 Edit ${Date.now()}`;
  const created = await admin.post("/api/stage", {
    headers: { Origin: baseURL! },
    data: {
      name: stageName,
      description: "F4 edit fixture",
      languageId: curriculum.languageId,
    },
  });
  expect(created.status()).toBe(201);

  await adminPage.goto(`/admin/languages/${curriculum.languageId}`);
  await adminPage.getByText("Etapas", { exact: true }).first().click();
  await expect(adminPage).toHaveURL(/\/admin\/stages/);
  const row = adminPage.getByRole("row", { name: stageName });
  await expect(row).toBeVisible({ timeout: 15000 });

  const renamed = `${stageName} (editada)`;
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await adminPage.locator("#edit-name").fill(renamed);
  const saved = adminPage.waitForResponse(
    (response) =>
      response.url().includes("/api/stage/") &&
      response.request().method() === "PUT",
  );
  await adminPage.getByRole("button", { name: "Guardar Cambios" }).click();
  expect((await saved).ok()).toBe(true);
  await expect(adminPage.getByText(renamed, { exact: true })).toBeVisible();
});

test("admin creates a region with an ISO division", async ({ adminPage }) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { languageId: string; languageName: string };
  // El código ISO de la división es único en toda la base: en corridas sin limpiar, una división
  // ya usada devuelve 409. El selector pide al menos 2 caracteres; se prueba con varias búsquedas
  // y, por cada una, sus opciones hasta que una se cree (201).
  const QUERIES = ["an", "ar", "er", "or", "al", "ca", "ta", "la"];
  const MAX_OPTIONS_PER_QUERY = 3;
  let status = 0;
  let attempts = 0;
  for (const query of QUERIES) {
    for (
      let index = 0;
      index < MAX_OPTIONS_PER_QUERY && status !== 201;
      index++
    ) {
      attempts++;
      // Visitar el espacio de trabajo deja el idioma seleccionado para el formulario de regiones.
      await adminPage.goto(`/admin/languages/${curriculum.languageId}`);
      await adminPage.goto("/admin/regions");
      await adminPage
        .getByRole("button", {
          name: /Crear Nueva Región|Crear primera región/,
        })
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
      await adminPage.locator("#create-division input").fill(query);
      const options = adminPage.locator(".react-select__option");
      const found = await options
        .nth(index)
        .waitFor({ state: "visible", timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      if (!found) break;
      await options.nth(index).click();
      await adminPage.locator("#create-description").fill("F4 region fixture");

      const created = adminPage.waitForResponse(
        (response) =>
          response.url().endsWith("/api/region") &&
          response.request().method() === "POST",
      );
      await adminPage.getByRole("button", { name: "Crear Región" }).click();
      status = (await created).status();
      if (status !== 201) {
        expect(status).toBe(409);
      }
    }
    if (status === 201) break;
  }
  expect(status, `sin división libre tras ${attempts} intentos`).toBe(201);
  await expect(
    adminPage.getByText("Región creada exitosamente", { exact: true }),
  ).toBeVisible();
});

test("admin creates a quiz whose option is an image (BE-08 path)", async ({
  adminPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { lessonId: string };
  const question = `F4 image question ${Date.now()}`;
  await adminPage.goto(`/admin/lessons/${curriculum.lessonId}/quizzes`);
  await adminPage.getByRole("button", { name: "Crear quiz" }).click();

  await adminPage.locator("#question-0").fill(question);
  await adminPage
    .getByPlaceholder("Texto de la opción...")
    .nth(0)
    .fill("Opción A");
  await adminPage
    .getByPlaceholder("Texto de la opción...")
    .nth(1)
    .fill("Opción B");
  await adminPage
    .getByRole("radio", { name: "Marcar opción 1 como respuesta correcta" })
    .click();

  // Subida de imagen a la opción 2: el servidor genera el id y autoriza por lessonId.
  const uploaded = adminPage.waitForResponse(
    (response) =>
      response.url().includes("/api/images/upload/quiz") &&
      response.request().method() === "POST",
  );
  await adminPage
    .locator("#file-input-0-1")
    .setInputFiles("e2e/fixtures/hand.png");
  expect((await uploaded).status()).toBe(201);

  const created = adminPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/quiz") &&
      response.request().method() === "POST",
  );
  await adminPage.getByRole("button", { name: "Crear Quiz" }).click();
  const saved = await created;
  expect(saved.status()).toBe(201);
  // La opción con imagen guarda la URL servida por /images/quiz (el texto de la opción).
  expect(JSON.stringify(await saved.json())).toContain("/images/quiz/");
});

test("admin edits one quiz option and removes another", async ({
  adminPage,
  baseURL,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { lessonId: string };
  const question = `F4 option edit ${Date.now()}`;
  const created = await adminPage.context().request.post("/api/quiz", {
    headers: { Origin: baseURL! },
    data: {
      lessonId: curriculum.lessonId,
      questions: [
        {
          text: question,
          options: [
            { text: "Opción A", isCorrect: true },
            { text: "Opción B", isCorrect: false },
            { text: "Opción C", isCorrect: false },
          ],
        },
      ],
    },
  });
  expect(created.status()).toBe(201);
  const quizId = (await created.json()).id as string;

  await adminPage.goto(`/admin/lessons/${curriculum.lessonId}/quizzes`);
  // La tarjeta del quiz: su título, y después sus botones en orden (editar, borrar).
  const heading = adminPage.getByRole("heading", {
    name: `Quiz #${quizId.slice(-8)}`,
  });
  await expect(heading).toBeVisible();
  await heading.locator("xpath=following::button[1]").click();

  const modal = adminPage.getByRole("dialog");
  await expect(modal.getByText("Editar Quiz")).toBeVisible();
  const optionInputs = modal.getByPlaceholder("Texto de la opción...");
  const optionValues = () =>
    optionInputs.evaluateAll((els) =>
      els.map((el) => (el as HTMLInputElement).value),
    );
  // El orden de las opciones no está garantizado por la API (AF-F4-03): se compara sin orden
  // y cada opción se localiza por su texto.
  const sorted = async () => (await optionValues()).slice().sort();
  await expect.poll(sorted).toEqual(["Opción A", "Opción B", "Opción C"]);

  const indexOf = async (text: string) => (await optionValues()).indexOf(text);
  await optionInputs.nth(await indexOf("Opción A")).fill("Opción A editada");
  // Quitar "Opción B": el botón de borrar de su fila (sólo aparece con más de 2 opciones).
  await optionInputs
    .nth(await indexOf("Opción B"))
    .locator("xpath=ancestor::div[.//button][1]")
    .getByRole("button")
    .last()
    .click();
  await expect.poll(sorted).toEqual(["Opción A editada", "Opción C"]);

  const updated = adminPage.waitForResponse(
    (response) =>
      response.url().includes(`/api/quiz/${quizId}`) &&
      response.request().method() !== "GET",
  );
  await modal.getByRole("button", { name: "Actualizar Quiz" }).click();
  expect((await updated).ok()).toBe(true);

  // Al reabrir, la opción editada está y la borrada ya no.
  await heading.locator("xpath=following::button[1]").click();
  await expect.poll(sorted).toEqual(["Opción A editada", "Opción C"]);
});

test("admin uploads a flag for a language", async ({ adminPage }) => {
  // Idioma propio del test: no se toca el del currículo compartido.
  const name = `F4 Flag ${Date.now()}`;
  const created = await adminPage.context().request.post("/api/languages", {
    headers: { Origin: String(test.info().project.use.baseURL) },
    data: { name, description: "F4 flag fixture", countryCode: "VE" },
  });
  expect(created.status()).toBe(201);

  await adminPage.goto("/admin/languages");
  const row = adminPage.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Editar" }).click();

  const uploaded = adminPage.waitForResponse(
    (response) =>
      response.url().includes("/api/images/upload/languages") &&
      response.request().method() === "POST",
  );
  await adminPage
    .locator("#edit-dropzone-file")
    .setInputFiles("e2e/fixtures/hand.png");
  await adminPage.getByRole("button", { name: "Guardar Cambios" }).click();
  expect((await uploaded).status()).toBe(201);
});

test("admin deletes an empty language from the table", async ({
  adminPage,
}) => {
  const name = `F4 Delete ${Date.now()}`;
  const created = await adminPage.context().request.post("/api/languages", {
    headers: { Origin: String(test.info().project.use.baseURL) },
    data: { name, description: "F4 delete fixture", countryCode: "VE" },
  });
  expect(created.status()).toBe(201);

  await adminPage.goto("/admin/languages");
  const row = adminPage.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Eliminar" }).click();
  const deleted = adminPage.waitForResponse(
    (response) =>
      response.url().includes("/api/languages/") &&
      response.request().method() === "DELETE",
  );
  await adminPage.getByRole("button", { name: "Sí, eliminar" }).click();
  expect((await deleted).status()).toBeLessThan(300);
  await expect(
    adminPage.getByRole("row").filter({ hasText: name }),
  ).toHaveCount(0);
});

test("admin sees how much content deleting a language removes (AF-F4-02)", async ({
  adminPage,
}) => {
  const origin = String(test.info().project.use.baseURL);
  const name = `F4 Impact ${Date.now()}`;
  const language = await adminPage.context().request.post("/api/languages", {
    headers: { Origin: origin },
    data: { name, description: "F4 impact fixture", countryCode: "VE" },
  });
  expect(language.status()).toBe(201);
  const { id: languageId } = (await language.json()) as { id: string };
  const stage = await adminPage.context().request.post("/api/stage", {
    headers: { Origin: origin },
    data: { name: `${name} stage`, description: "F4 impact stage", languageId },
  });
  expect(stage.status()).toBe(201);

  await adminPage.goto("/admin/languages");
  const row = adminPage.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Eliminar" }).click();

  const dialog = adminPage.getByRole("dialog");
  await expect(dialog.getByText("Etapas que se eliminarán: 1")).toBeVisible();
  await expect(dialog.getByText("Lecciones que se eliminarán: 0")).toBeVisible();
  await expect(dialog.getByText("Quizzes que se eliminarán: 0")).toBeVisible();

  // Solo se comprueba el aviso: se cancela y el idioma sigue en la tabla.
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(row).toBeVisible();
});

test("admin inserts an image into a lesson with the Quill editor", async ({
  adminPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { languageId: string; stageId: string };
  const origin = String(test.info().project.use.baseURL);
  const name = `F4 Quill ${Date.now()}`;
  const created = await adminPage.context().request.post("/api/lesson", {
    headers: { Origin: origin },
    data: {
      name,
      description: "F4 quill fixture",
      content: "Contenido inicial",
      languageId: curriculum.languageId,
      stageId: curriculum.stageId,
    },
  });
  expect(created.status()).toBe(201);

  await adminPage.goto(`/admin/languages/${curriculum.languageId}`);
  await adminPage.getByText("Lecciones", { exact: true }).first().click();
  await expect(adminPage).toHaveURL(/\/admin\/lessons/);
  const row = adminPage.getByRole("row").filter({ hasText: name }).first();
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.getByRole("button", { name: /Editar/ }).click();

  const uploaded = adminPage.waitForResponse(
    (response) =>
      response.url().includes("/api/images/upload/lesson") &&
      response.request().method() === "POST",
  );
  const chooser = adminPage.waitForEvent("filechooser");
  await adminPage.locator(".ql-image").first().click();
  await (await chooser).setFiles("e2e/fixtures/hand.png");

  expect((await uploaded).status()).toBe(201);
  await expect(adminPage.locator(".ql-editor img").first()).toBeVisible();
});
