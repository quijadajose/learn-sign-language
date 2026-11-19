import { expect, test } from "@playwright/test";
import { selectLanguageCard } from "./fixtures/language-picker";
import { readFile } from "node:fs/promises";

type Curriculum = {
  studentName: string;
  languageName: string;
  regionName: string;
  stageName: string;
  lessonName: string;
  variantName: string;
  languageId: string;
  regionId: string;
  stageId: string;
  lessonId: string;
  lessonVariantId: string;
  quizId: string;
};

async function getCurriculum(): Promise<Curriculum> {
  return JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
}

test("student studies a regional curriculum and earns best quiz score", async ({
  browser,
  baseURL,
}) => {
  const curriculum = await getCurriculum();
  const { studentName } = curriculum;
  const context = await browser.newContext({
    baseURL,
    storageState: "e2e/.auth/student.json",
  });
  const page = await context.newPage();

  await page.goto("/dashboard");
  await selectLanguageCard(page, curriculum.languageName);
  await page.getByRole("button", { name: "Siguiente" }).click();
  const enrollmentResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/users/enroll") &&
      response.request().method() === "POST",
  );
  await page
    .getByText(curriculum.regionName, { exact: true })
    .dispatchEvent("click");
  expect((await enrollmentResponse).ok()).toBe(true);
  await expect(
    page.getByRole("heading", {
      name: `Progreso en ${curriculum.languageName}`,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(curriculum.stageName, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver Lecciones" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/lessons/stage/${curriculum.stageId}`),
  );
  await expect(
    page.getByText(curriculum.variantName, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/lesson/${curriculum.lessonVariantId}`),
  );
  await expect(
    page.getByText(curriculum.variantName, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Fixture regional lesson")).toBeVisible();

  const quizUrl = `/quiz/${curriculum.lessonId}?regionId=${curriculum.regionId}`;
  await page.goto(quizUrl);
  await expect(page.getByText("Regional question")).toBeVisible();
  await page.getByLabel("Regional other").check();
  await page.getByRole("button", { name: /submit|enviar/i }).click();
  await expect(page.getByText(/0\.00/)).toBeVisible();

  await page.goto(quizUrl);
  await page.getByLabel("Regional correct").check();
  await page.getByRole("button", { name: /submit|enviar/i }).click();
  await expect(page.getByText(/100\.00/)).toBeVisible();

  await page.goto("/leaderboard");
  await expect(page.locator("#leaderboard-language")).toHaveValue("global");
  await expect(page.getByText(studentName, { exact: true })).toBeVisible();
  const studentRow = page
    .getByRole("heading", { name: studentName, exact: true })
    .locator("../..");
  await expect(studentRow.getByText("100", { exact: true })).toBeVisible();
  await context.close();
});

test("leaderboard language filter shows the student under its language", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    storageState: "e2e/.auth/student.json",
  });
  const studentPage = await context.newPage();
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;

  await studentPage.goto("/leaderboard");
  const selector = studentPage.locator("#leaderboard-language");
  await expect(selector).toHaveValue("global");
  await expect(
    studentPage.getByRole("heading", {
      name: curriculum.studentName,
      exact: true,
    }),
  ).toBeVisible();

  const byLanguage = studentPage.waitForResponse(
    (response) =>
      response.url().includes("/leaderboard") &&
      response.url().includes(curriculum.languageId),
  );
  await selector.selectOption(curriculum.languageId);
  expect((await byLanguage).ok()).toBe(true);
  await expect(selector).toHaveValue(curriculum.languageId);
  await expect(
    studentPage.getByRole("heading", {
      name: curriculum.studentName,
      exact: true,
    }),
  ).toBeVisible();
  await context.close();
});
