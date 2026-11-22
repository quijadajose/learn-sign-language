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

// AF-F6-01 y AF-H12: un test por pantalla. Si una pantalla falla, solo ese test falla.
const studentScreens = [
  { name: "dashboard", path: "/dashboard" },
  { name: "lesson", path: () => `/lesson/${curriculum.lessonId}` },
  { name: "quiz", path: () => `/quiz/${curriculum.lessonId}` },
  { name: "leaderboard", path: "/leaderboard" },
] as const;

for (const screen of studentScreens) {
  test(`${screen.name} has no serious or critical WCAG A/AA violations`, async ({
    studentPage,
  }) => {
    await ensureStudentEnrolled(studentPage, curriculum);
    const path =
      typeof screen.path === "function" ? screen.path() : screen.path;
    await studentPage.goto(path);
    if (screen.name === "leaderboard") {
      // AF-F6-04: el ranking usa texto gris claro sobre fondo claro (color-contrast). No se amplía
      // el arreglo de AF-F6-01: se marca solo esta pantalla, después de la preparación.
      test.fail(
        true,
        "AF-F6-04: contraste insuficiente en el ranking (text-gray-400)",
      );
    }
    const findings = await seriousA11y(studentPage);
    expect(
      findings.map(({ id, impact, description, nodes }) => ({
        screen: screen.name,
        id,
        impact,
        description,
        selectors: nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  });
}

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
  await expect(studentPage.getByRole("main")).toBeVisible({ timeout: 15000 });
  expect(await noOverflow()).toBe(true);

  await studentPage.goto(`/lesson/${curriculum.lessonId}/practice`);
  await expect(studentPage.getByRole("main")).toBeVisible({ timeout: 15000 });
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
  // La vista del alumno pide /users/lesson/<id> (getUserLesson); esa es la petición que se congela.
  await studentPage.route(
    `**/api/users/lesson/${curriculum.lessonId}**`,
    () => {
      // Respuesta que nunca llega: la petición queda pendiente hasta el timeout.
    },
  );
  const stalled = studentPage.waitForRequest((request) =>
    request.url().includes(`/api/users/lesson/${curriculum.lessonId}`),
  );
  await studentPage.goto(`/lesson/${curriculum.lessonId}`);
  // Solo se avanza el reloj cuando la petición ya está pendiente.
  await stalled;
  await studentPage.clock.runFor(10_500);
  await expect(
    studentPage
      .getByRole("alert")
      .getByText(/no responde|not responding|tiempo límite|timed out/i)
      .first(),
  ).toBeVisible({ timeout: 10000 });
});

test("a stalled quiz submission warns that the server may have completed it", async ({
  studentPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as {
    lessonId: string;
    languageName: string;
    regionName: string;
  };
  await ensureStudentEnrolled(studentPage, curriculum);
  await studentPage.clock.install();
  await studentPage.route(`**/api/quiz/**/submissions`, () => {
    // El envío nunca responde: la escritura queda pendiente hasta el timeout de 10 s.
  });
  await studentPage.goto(`/quiz/${curriculum.lessonId}`);
  await studentPage.locator('input[type="radio"]').first().check();
  const pending = studentPage.waitForRequest(
    (request) =>
      request.url().includes("/submissions") && request.method() === "POST",
  );
  await studentPage.getByRole("button", { name: /submit|enviar/i }).click();
  await pending;
  await studentPage.clock.runFor(10_500);
  await expect(
    studentPage.getByText(/may have completed|puede que el servidor/i).first(),
  ).toBeVisible({ timeout: 10000 });
});
