import { expect, type Page } from "@playwright/test";
import { selectLanguageCard } from "./language-picker";

export async function ensureStudentEnrolled(
  page: Page,
  curriculum: { languageName: string; regionName: string },
) {
  await page.goto("/dashboard");
  const progressHeading = page.getByRole("heading", {
    name: `Progreso en ${curriculum.languageName}`,
  });
  const languageCard = page.getByText(curriculum.languageName, {
    exact: true,
  });
  const alreadyEnrolled = await Promise.race([
    progressHeading
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false),
    languageCard
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => false)
      .catch(() => false),
  ]);
  if (alreadyEnrolled) return;

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
  const response = await enrollmentResponse;
  if (!response.ok()) {
    throw new Error(
      `Student enrollment returned ${response.status()}: ${await response.text()}`,
    );
  }
  await expect(progressHeading).toBeVisible();
}
