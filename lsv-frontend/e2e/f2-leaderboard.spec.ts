import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";
import { createScoredStudent, type Answer } from "./fixtures/students";

type Curriculum = { quizId: string };
type AdminQuiz = {
  questions: { id: string; options: { id: string; isCorrect: boolean }[] }[];
};

const PAGE_SIZE = 10;

async function quizAnswers(
  admin: import("@playwright/test").APIRequestContext,
  quizId: string,
): Promise<{ correct: Answer[]; wrong: Answer[] }> {
  const quiz = await admin.get(`/api/quiz/admin/${quizId}`);
  expect(quiz.status()).toBe(200);
  const body = (await quiz.json()) as AdminQuiz;
  return {
    correct: body.questions.map((question) => ({
      questionId: question.id,
      optionId: question.options.find((option) => option.isCorrect)!.id,
    })),
    wrong: body.questions.map((question) => ({
      questionId: question.id,
      optionId: question.options.find((option) => !option.isCorrect)!.id,
    })),
  };
}

test("a repeated quiz counts only its best attempt on the leaderboard", async ({
  adminPage,
  browser,
  baseURL,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const admin = adminPage.context().request;
  const { correct, wrong } = await quizAnswers(admin, curriculum.quizId);

  // Un alumno: 0 aciertos, luego todos, luego todos otra vez.
  const { userId, scores } = await createScoredStudent(
    browser,
    baseURL!,
    curriculum.quizId,
    [wrong, correct, correct],
    "Best",
  );
  const [worst, best, repeat] = scores;
  expect(best).toBeGreaterThan(worst);
  expect(repeat).toBe(best);

  // Con una lista completa del ranking, su total es el mejor puntaje y no la suma.
  const size = (
    await (await admin.get("/api/leaderboard?page=1&limit=1")).json()
  ).total as number;
  const everyone = (await (
    await admin.get(`/api/leaderboard?page=1&limit=${size}`)
  ).json()) as { data: { userId: string; totalScore: number }[] };
  const row = everyone.data.find((entry) => entry.userId === userId);
  expect(row?.totalScore).toBe(best);
});

test("leaderboard pages show distinct students across pages", async ({
  adminPage,
  browser,
  baseURL,
  studentPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  // La paginación de la UI tiene que cruzar de página: hacen falta más de una página.
  test.setTimeout(10 * 60_000);
  const admin = adminPage.context().request;
  const { correct } = await quizAnswers(admin, curriculum.quizId);
  const countOf = async () =>
    (await (await admin.get("/api/leaderboard?page=1&limit=1")).json())
      .total as number;

  const needed = PAGE_SIZE + 1 - (await countOf());
  const suffix = Date.now().toString(36);
  for (let i = 0; i < Math.max(0, needed); i++) {
    await createScoredStudent(
      browser,
      baseURL!,
      curriculum.quizId,
      [correct],
      `Pager${suffix}${i}`,
    );
  }
  const total = await countOf();
  expect(total).toBeGreaterThan(PAGE_SIZE);

  await studentPage.goto("/leaderboard");
  const names = async () =>
    (
      await studentPage.getByRole("heading", { level: 3 }).allTextContents()
    ).map((name) => name.trim());

  await expect(studentPage.getByRole("heading", { level: 3 })).toHaveCount(
    PAGE_SIZE,
  );
  const firstPage = await names();

  await studentPage.getByRole("button", { name: "Siguiente" }).click();
  const expectedSecond = Math.min(PAGE_SIZE, total - PAGE_SIZE);
  await expect(studentPage.getByRole("heading", { level: 3 })).toHaveCount(
    expectedSecond,
  );
  const secondPage = await names();

  const repeated = firstPage.filter((name) => secondPage.includes(name));
  expect(repeated).toEqual([]);
  expect(new Set([...firstPage, ...secondPage]).size).toBe(
    firstPage.length + secondPage.length,
  );
});
