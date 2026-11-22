import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";
import { validLandmarkFrames } from "./fixtures/landmarks";

type Curriculum = {
  languageId: string;
  stageId: string;
  lessonId: string;
  lessonVariantId: string;
};

/**
 * H7 (UI): con grabaciones validadas, "Entrenar lección" en Sign Studio pone el entrenamiento
 * en cola (POST /api/sign-record/train/<lessonVariantId> con 201).
 */
test("moderator queues the lesson training from Sign Studio", async ({
  moderatorPage,
}) => {
  test.setTimeout(90_000);
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const request = moderatorPage.context().request;
  const origin = String(test.info().project.use.baseURL);

  const sign = await request.post("/api/sign-record/sign", {
    headers: { Origin: origin },
    data: {
      name: `TrainUI ${Date.now()}`,
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
  }

  await moderatorPage.goto("/admin/sign-studio");
  await moderatorPage.locator("#language").selectOption(curriculum.languageId);
  await moderatorPage.locator("#stage").selectOption(curriculum.stageId);
  await moderatorPage.locator("#lesson").selectOption(curriculum.lessonId);

  const queued = moderatorPage.waitForResponse(
    (response) =>
      response.url().includes("/api/sign-record/train/") &&
      response.request().method() === "POST",
  );
  await moderatorPage
    .getByRole("button", { name: "Entrenar lección", exact: true })
    .first()
    .click();
  const response = await queued;
  expect(response.status()).toBe(201);
  // La pantalla usa el endpoint de entrenamiento por selección/lección; aquí se verifica
  // que lo acepta (201). El estado en cola lo cubre f5-training.spec.ts por API.
  expect(response.url()).toContain("/api/sign-record/train/");
});
