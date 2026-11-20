import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";

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
  await expect(
    studentPage.getByRole("heading", {
      name: `Progreso en ${curriculum.languageName}`,
    }),
  ).toBeVisible({ timeout: 15000 });
  await studentPage.getByRole("button", { name: "Ver Lecciones" }).click();
  await expect(studentPage).toHaveURL(
    new RegExp(`/lessons/stage/${curriculum.stageId}`),
  );
  await expect(studentPage.getByText(variantName, { exact: true })).toBeVisible(
    {
      timeout: 15000,
    },
  );
});
