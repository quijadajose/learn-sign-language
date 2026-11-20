import type { APIRequestContext, Browser } from "@playwright/test";
import { expect } from "@playwright/test";

const RATE_LIMIT_WAIT_MS = 13_000;

export type Answer = { questionId: string; optionId: string };

/** Repite la petición si la API limita (5 por minuto en registro y login). */
export async function withRateLimit<T extends { status(): number }>(
  request: () => Promise<T>,
): Promise<T> {
  let response = await request();
  for (let attempt = 0; attempt < 5 && response.status() === 429; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
    response = await request();
  }
  return response;
}

/**
 * Crea un alumno nuevo por API, lo inicia sesión y envía cada lista de respuestas
 * de `attempts` a `quizId`, en orden. Devuelve su id y el puntaje de cada envío.
 */
export async function createScoredStudent(
  browser: Browser,
  baseURL: string,
  quizId: string,
  attempts: Answer[][],
  firstName: string,
): Promise<{ userId: string; scores: number[] }> {
  const context = await browser.newContext({ baseURL });
  const request: APIRequestContext = context.request;
  const email = `pw-${firstName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const password = "Scored-password-9085";
  const registered = await withRateLimit(() =>
    request.post("/api/auth/register", {
      headers: { Origin: baseURL },
      data: {
        email,
        password,
        firstName,
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
  const scores: number[] = [];
  for (const answers of attempts) {
    const submitted = await request.post(`/api/quiz/${quizId}/submissions`, {
      headers: { Origin: baseURL },
      data: { answers },
    });
    expect(submitted.status()).toBe(201);
    scores.push(((await submitted.json()) as { score: number }).score);
  }
  await context.close();
  return { userId, scores };
}
