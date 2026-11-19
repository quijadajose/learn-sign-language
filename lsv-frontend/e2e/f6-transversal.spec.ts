import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { expect, test } from "./fixtures/roles";
import { ensureStudentEnrolled } from "./fixtures/enrollment";

const curriculum = JSON.parse(
  await readFile("e2e/.auth/curriculum.json", "utf8"),
) as {
  lessonId: string;
  quizId: string;
  languageName: string;
  regionName: string;
};

async function seriousA11y(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations.filter((item) =>
    ["serious", "critical"].includes(item.impact ?? ""),
  );
}

test("i18n renders login in Spanish and English", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.addInitScript(() => localStorage.setItem("lsv.uiLocale", "es"));
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Iniciar sesión" }),
  ).toBeVisible();
  const englishContext = await browser.newContext({ baseURL });
  await englishContext.addInitScript(() =>
    localStorage.setItem("lsv.uiLocale", "en"),
  );
  const englishPage = await englishContext.newPage();
  await englishPage.goto("/login");
  await expect(
    englishPage.getByRole("heading", { name: "Sign in" }),
  ).toBeVisible();
  await expect(englishPage.locator("html")).toHaveAttribute("lang", "en");
  await englishContext.close();
});

test("mobile login and landing have no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("nested learner routes survive refresh and a new tab", async ({
  studentPage,
  browser,
  baseURL,
}) => {
  await ensureStudentEnrolled(studentPage, curriculum);
  const route = `/lesson/${curriculum.lessonId}`;
  await studentPage.goto(route);
  await expect(
    studentPage.getByRole("heading", { name: /lesson pw-/i }),
  ).toBeVisible();
  await studentPage.reload();
  await expect(
    studentPage.getByRole("heading", { name: /lesson pw-/i }),
  ).toBeVisible();
  const tab = await browser.newPage({
    baseURL,
    storageState: "e2e/.auth/student.json",
  });
  await tab.goto(route);
  await expect(tab.getByRole("heading", { name: /lesson pw-/i })).toBeVisible();
  await tab.close();
});

test("API outage leaves a clear terminal message", async ({ studentPage }) => {
  await ensureStudentEnrolled(studentPage, curriculum);
  await studentPage.route("**/api/**", (route) => route.abort());
  await studentPage.goto(`/lesson/${curriculum.lessonId}`);
  await expect(
    studentPage.getByRole("alert").getByText(/no responde|not responding/i),
  ).toBeVisible();
});

test("nonexistent lesson shows a not-found message", async ({
  studentPage,
}) => {
  await ensureStudentEnrolled(studentPage, curriculum);
  await studentPage.unrouteAll();
  await studentPage.goto("/lesson/00000000-0000-4000-8000-000000000000");
  await expect(
    studentPage.getByText(/no encontrada|not found/i).first(),
  ).toBeVisible();
});

test("login has no serious or critical WCAG A/AA violations (AF-F6-01)", async ({
  page,
}) => {
  await page.goto("/login");
  const findings = await seriousA11y(page);
  expect(
    findings.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("dashboard, lesson, quiz and leaderboard: serious or critical WCAG A/AA checks", async ({
  studentPage,
}) => {
  await ensureStudentEnrolled(studentPage, curriculum);
  const violations: unknown[] = [];
  const append = async (
    screen: string,
    target: import("@playwright/test").Page,
  ) => {
    const findings = await seriousA11y(target);
    for (const { id, impact, description, nodes } of findings) {
      violations.push({
        screen,
        id,
        impact,
        description,
        selectors: nodes.map((node) => node.target),
      });
    }
  };
  await studentPage.goto("/dashboard");
  await append("dashboard", studentPage);
  await studentPage.goto(`/lesson/${curriculum.lessonId}`);
  await append("lesson", studentPage);
  await studentPage.goto(`/quiz/${curriculum.lessonId}`);
  await append("quiz", studentPage);
  await studentPage.goto("/leaderboard");
  await append("leaderboard", studentPage);
  expect(violations).toEqual([]);
});

test("student quiz and practice have no horizontal overflow on a phone", async ({
  studentPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { lessonId: string };
  await studentPage.setViewportSize({ width: 375, height: 812 });
  const noOverflow = () =>
    studentPage.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );

  await studentPage.goto(`/quiz/${curriculum.lessonId}`);
  await expect(studentPage.getByRole("main")).toBeVisible();
  expect(await noOverflow()).toBe(true);

  await studentPage.goto(`/lesson/${curriculum.lessonId}/practice`);
  await expect(studentPage.getByRole("main")).toBeVisible();
  expect(await noOverflow()).toBe(true);
});

test("a stalled lesson request ends with the timeout message after 10 s", async ({
  studentPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { lessonId: string };
  // Reloj falso: el timeout por defecto (10 s) se dispara sin esperar en tiempo real.
  await studentPage.clock.install();
  await studentPage.route(`**/api/lesson/${curriculum.lessonId}**`, () => {
    // Respuesta que nunca llega: la petición queda pendiente hasta el timeout.
  });
  await studentPage.goto(`/lesson/${curriculum.lessonId}`);
  await studentPage.clock.runFor(10_500);
  await expect(
    studentPage
      .getByRole("alert")
      .getByText(/no responde|not responding|tiempo límite|timed out/i),
  ).toBeVisible({ timeout: 10000 });
});
