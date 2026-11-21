import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";

type Curriculum = {
  languageId: string;
  stageId: string;
  lessonId: string;
};

/**
 * H7 (UI): el moderador graba una seña con la cámara falsa y guarda los landmarks.
 *
 * El clip NO se versiona: debe mostrar a una persona con cuerpo y mano visibles
 * (la seña necesita ambos para que MediaPipe detecte pose y manos). Se indica con
 * SIGN_RECORDING_Y4M, por ejemplo: SIGN_RECORDING_Y4M=/ruta/local/clip.y4m
 * Lo que se guarda en la base son los landmarks, no el video.
 */
const signRecordingVideo = process.env.SIGN_RECORDING_Y4M;

test.use({
  launchOptions: {
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: [
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${signRecordingVideo ?? "e2e/fixtures/hand.y4m"}`,
    ],
  },
});

test("moderator records a sign with the fake camera and saves the landmarks", async ({
  moderatorPage,
}) => {
  test.skip(
    !signRecordingVideo,
    "Falta SIGN_RECORDING_Y4M: ruta local a un .y4m con persona y mano visibles (no se versiona).",
  );
  // MediaPipe (pose heavy + manos) en Chromium headless tarda ~3-6 s por frame:
  // 12 frames necesitan más de un minuto.
  test.setTimeout(240_000);
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as Curriculum;
  const origin = String(test.info().project.use.baseURL);
  await moderatorPage.context().grantPermissions(["camera"], { origin });
  const signName = `Rec ${Date.now()}`;
  const created = await moderatorPage
    .context()
    .request.post("/api/sign-record/sign", {
      headers: { Origin: origin },
      data: {
        name: signName,
        languageId: curriculum.languageId,
        lessonId: curriculum.lessonId,
        detectionType: "static",
      },
    });
  expect(created.status()).toBe(201);

  await moderatorPage.goto("/admin/sign-studio");
  await moderatorPage.locator("#language").selectOption(curriculum.languageId);
  await moderatorPage.locator("#stage").selectOption(curriculum.stageId);
  await moderatorPage.locator("#lesson").selectOption(curriculum.lessonId);
  await moderatorPage
    .getByRole("button", { name: `Grabar seña ${signName}` })
    .click();

  await moderatorPage.getByRole("button", { name: "Encender Cámara" }).click();
  await expect(
    moderatorPage.getByRole("button", { name: "Empezar Nueva Captura" }),
  ).toBeEnabled({ timeout: 20_000 });
  await moderatorPage
    .getByRole("button", { name: "Empezar Nueva Captura" })
    .click();

  // La captura estática pasa sola a revisión al juntar 12 frames con mano.
  const confirm = moderatorPage.getByRole("button", {
    name: "Confirmar y Enviar",
  });
  await expect(confirm).toBeVisible({ timeout: 180_000 });
  await expect(moderatorPage.getByText(/Replay \d+\/12 frames/)).toBeVisible();

  const saved = moderatorPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/sign-record/landmarks") &&
      response.request().method() === "POST",
  );
  await confirm.click();
  expect((await saved).status()).toBe(201);
});
