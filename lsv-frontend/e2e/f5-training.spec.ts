import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";
import { validLandmarkFrames } from "./fixtures/landmarks";

type Curriculum = {
  languageId: string;
  lessonId: string;
  lessonVariantId: string;
};

/**
 * H7 (API): el moderador crea una seña, sube grabaciones con landmarks válidos y dispara el
 * entrenamiento de la lección. La grabación con la cámara falsa no produce landmarks en este
 * entorno, así que esta parte se hace por API (ver hallazgos/funcional.md).
 */
test("moderator records validated signs and queues the lesson training", async ({
  moderatorPage,
}) => {
  test.setTimeout(60000);
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const request = moderatorPage.context().request;
  const origin = String(test.info().project.use.baseURL);

  const sign = await request.post("/api/sign-record/sign", {
    headers: { Origin: origin },
    data: {
      name: `Train ${Date.now()}`,
      languageId: curriculum.languageId,
      lessonId: curriculum.lessonId,
      detectionType: "static",
    },
  });
  expect(sign.status()).toBe(201);
  const signId = (await sign.json()).id as string;

  for (let take = 0; take < 2; take++) {
    const recording = await request.post("/api/sign-record/landmarks", {
      headers: { Origin: origin },
      data: {
        signId,
        landmarks: validLandmarkFrames(2),
        dominantHand: "right",
      },
    });
    expect(recording.status()).toBe(201);
    expect((await recording.json()).isValidated).toBe(true);
  }

  const training = await request.post(
    `/api/sign-record/train/${curriculum.lessonVariantId}`,
    { headers: { Origin: origin } },
  );
  expect(training.status()).toBe(201);
  const body = await training.json();
  expect(body.status).toBe("QUEUED");
  expect(body.jobs.length).toBeGreaterThanOrEqual(1);
});
