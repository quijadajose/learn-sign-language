import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";
import type { APIRequestContext } from "@playwright/test";

type Curriculum = { quizId: string };
type AdminQuiz = {
  questions: { id: string; options: { id: string; isCorrect: boolean }[] }[];
};

const RATE_LIMIT_WAIT_MS = 13_000;

/** Repite la petición si la API limita (5 por minuto en registro y login). */
async function withRateLimit<T extends { status(): number }>(
  request: () => Promise<T>,
): Promise<T> {
  let response = await request();
  for (let attempt = 0; attempt < 5 && response.status() === 429; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
    response = await request();
  }
  return response;
}

async function scoredStudent(
  browser: import("@playwright/test").Browser,
  baseURL: string,
  quizId: string,
  answers: { questionId: string; optionId: string }[],
): Promise<string> {
  const context = await browser.newContext({ baseURL });
  const request: APIRequestContext = context.request;
  const email = `pw-page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const password = "Paging-password-9085";
  const registered = await withRateLimit(() =>
    request.post("/api/auth/register", {
      headers: { Origin: baseURL },
      data: {
        email,
        password,
        firstName: "Page",
        lastName: "Student",
        age: 25,
        isRightHanded: true,
      },
    }),
  );
  expect(registered.status()).toBe(201);
  const login = await withRateLimit(() =>
    request.post("/api/auth/login", {
      headers: { Origin: baseURL },
      data: { email, password },
    }),
  );
  expect(login.status()).toBe(200);
  const userId = (await login.json()).data.user.id as string;
  const submitted = await request.post(`/api/quiz/${quizId}/submissions`, {
    headers: { Origin: baseURL },
    data: { answers },
  });
  expect(submitted.status()).toBe(201);
  await context.close();
  return userId;
}

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

  const first = await scoredStudent(browser, baseURL!, quizId, answers);
  const second = await scoredStudent(browser, baseURL!, quizId, answers);

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
