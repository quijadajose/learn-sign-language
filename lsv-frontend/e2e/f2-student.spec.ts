import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

type Curriculum = {
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

test("student enrolls in a regional curriculum, studies, and earns best quiz score", async ({
  browser,
  baseURL,
}) => {
  const curriculum = await getCurriculum();
  const context = await browser.newContext({
    baseURL,
    storageState: "e2e/.auth/student.json",
  });
  const page = await context.newPage();

  await page.goto("/dashboard");
  await page.getByText(curriculum.languageName, { exact: true }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
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
  await page
    .locator("#leaderboard-language")
    .selectOption(curriculum.languageId);
  await expect(
    page.getByText("Playwright Student", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("100")).toBeVisible();
  await context.close();
});
