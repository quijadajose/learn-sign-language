import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";
import { selectLanguageCard } from "./fixtures/language-picker";

type Curriculum = {
  languageId: string;
  languageName: string;
  stageId: string;
  regionId: string;
  regionName: string;
};

/**
 * H6 (vista del alumno): una lección creada por el admin en la etapa del currículo
 * aparece para el alumno inscrito en ese idioma.
 */
test("student sees a lesson the admin created in the curriculum stage", async ({
  adminPage,
  studentPage,
  baseURL,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const name = `F4 Student ${Date.now()}`;
  const created = await adminPage.context().request.post("/api/lesson", {
    headers: { Origin: baseURL! },
    data: {
      name,
      description: "F4 student view fixture",
      content: "Contenido para el alumno",
      languageId: curriculum.languageId,
      stageId: curriculum.stageId,
    },
  });
  expect(created.status()).toBe(201);
  const lessonId = (await created.json()).id as string;

  // El alumno ve variantes regionales, no lecciones base: se crea una para la región del alumno.
  const variantName = `${name} (variante)`;
  const variant = await adminPage
    .context()
    .request.post(`/api/lesson/${lessonId}/variants`, {
      headers: { Origin: baseURL! },
      data: {
        name: variantName,
        description: "F4 student view variant",
        content: "Contenido regional",
        regionId: curriculum.regionId,
        isRegionalSpecific: true,
      },
    });
  expect(variant.status()).toBe(201);

  // "Ver Lecciones" pasa el idioma en el estado de navegación; el dashboard muestra el progreso
  // del idioma guardado en localStorage (selectedLanguageId).
  await studentPage.goto("/dashboard");
  await studentPage.evaluate((languageId) => {
    localStorage.setItem("selectedLanguageId", JSON.stringify(languageId));
  }, curriculum.languageId);
  await studentPage.reload();
  const progress = studentPage.getByRole("heading", {
    name: `Progreso en ${curriculum.languageName}`,
  });
  // Si el alumno aún no está inscrito (prueba aislada), se inscribe como en F2.
  const alreadyEnrolled = await progress
    .waitFor({ state: "visible", timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!alreadyEnrolled) {
    await selectLanguageCard(studentPage, curriculum.languageName);
    await studentPage.getByRole("button", { name: "Siguiente" }).click();
    const enrolled = studentPage.waitForResponse(
      (response) =>
        response.url().endsWith("/api/users/enroll") &&
        response.request().method() === "POST",
    );
    await studentPage
      .getByText(curriculum.regionName, { exact: true })
      .dispatchEvent("click");
    expect((await enrolled).ok()).toBe(true);
  }
  await expect(progress).toBeVisible({ timeout: 15000 });
  await studentPage.getByRole("button", { name: "Ver Lecciones" }).click();
  await expect(studentPage).toHaveURL(
    new RegExp(`/lessons/stage/${curriculum.stageId}`),
  );
  // La tarjeta muestra el nombre de la lección base; la variante regional sigue en "Próximamente"
  // en corridas completas, así que la comprobación es la lección que creó el admin.
  // Espera a que la lista de lecciones termine de cargar antes de buscar la tarjeta.
  await expect(
    studentPage.getByRole("heading", {
      name: "Lecciones disponibles",
      exact: false,
    }),
  ).toBeVisible({ timeout: 30000 });
  // La lista muestra la variante ("<nombre> (variante)") o la lección base: basta con que contenga el nombre.
  await expect(
    studentPage.getByRole("heading", { name: name }).first(),
  ).toBeVisible({ timeout: 30000 });
});
