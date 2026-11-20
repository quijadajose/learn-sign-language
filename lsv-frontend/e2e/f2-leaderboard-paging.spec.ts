import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";
import { createScoredStudent } from "./fixtures/students";

type Curriculum = { quizId: string };
type AdminQuiz = {
  questions: { id: string; options: { id: string; isCorrect: boolean }[] }[];
};

test("leaderboard pages do not repeat users and keep the score order", async ({
  adminPage,
  browser,
  baseURL,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const quizId = curriculum.quizId;
  const admin = adminPage.context().request;

  const quiz = await admin.get(`/api/quiz/admin/${quizId}`);
  expect(quiz.status()).toBe(200);
  const body = (await quiz.json()) as AdminQuiz;
  const answers = body.questions.map((question) => ({
    questionId: question.id,
    optionId: question.options.find((option) => option.isCorrect)!.id,
  }));

  const first = (
    await createScoredStudent(
      browser,
      baseURL!,
      quizId,
      [answers],
      `Page${Math.random().toString(36).slice(2, 8)}`,
    )
  ).userId;
  const second = (
    await createScoredStudent(
      browser,
      baseURL!,
      quizId,
      [answers],
      `Page${Math.random().toString(36).slice(2, 8)}`,
    )
  ).userId;

  const page = async (n: number, limit: number) =>
    (await (
      await admin.get(`/api/leaderboard?page=${n}&limit=${limit}`)
    ).json()) as {
      data: { userId: string; totalScore: number }[];
      total: number;
    };
  const one = await page(1, 1);
  const two = await page(2, 1);
  expect(one.total).toBeGreaterThanOrEqual(2);
  expect(one.data).toHaveLength(1);
  expect(two.data).toHaveLength(1);
  expect(one.data[0].userId).not.toBe(two.data[0].userId);
  expect(one.data[0].totalScore).toBeGreaterThanOrEqual(two.data[0].totalScore);

  // Ambos alumnos aparecen en algún página del ranking completo.
  const everyone = await page(1, one.total);
  const ids = everyone.data.map((row) => row.userId);
  expect(ids).toEqual(expect.arrayContaining([first, second]));
});
