import { expect, test } from "./fixtures/roles";

// El build de producción va en PLAYWRIGHT_PROD_BASE_URL; sin esto, el test corre contra el dev server.
test.use({
  baseURL: process.env.PLAYWRIGHT_PROD_BASE_URL ?? "http://127.0.0.1:4174",
});

const CSP_OR_WASM = /Content Security Policy|WebAssembly|wasm/i;

/**
 * H9: MediaPipe con la CSP de producción. Vite dev no aplica la CSP de nginx, así que este
 * test corre solo contra el build de producción (ver e2e/README.md, sección "CSP de producción").
 */
test.skip(
  !process.env.PLAYWRIGHT_PROD_BASE_URL,
  "Requires the production build served by nginx (PLAYWRIGHT_PROD_BASE_URL)",
);

// La práctica no carga MediaPipe sin modelo entrenado; Sign Studio sí lo carga.
test("Sign Studio loads MediaPipe WASM and models under the production CSP", async ({
  moderatorPage: studentPage,
}) => {
  const violations: string[] = [];
  studentPage.on("console", (message) => {
    if (
      (message.type() === "error" || message.type() === "warning") &&
      CSP_OR_WASM.test(message.text())
    ) {
      violations.push(message.text());
    }
  });
  studentPage.on("pageerror", (error) => {
    if (CSP_OR_WASM.test(error.message)) violations.push(error.message);
  });

  const wasm = studentPage.waitForResponse(
    (response) =>
      response.url().includes("/mediapipe/wasm/") &&
      response.url().endsWith(".wasm"),
    { timeout: 20000 },
  );
  await studentPage.goto("/admin/sign-studio");
  await expect(studentPage.getByRole("main")).toBeVisible({ timeout: 15000 });

  expect((await wasm).status()).toBe(200);
  // Los modelos .task no se piden al cargar Sign Studio (solo al usar la cámara o la práctica
  // con un modelo entrenado), así que se comprueba que nginx los sirve con 200.
  for (const file of ["pose_landmarker_heavy.task", "hand_landmarker.task"]) {
    const served = await studentPage.request.get(`/mediapipe/models/${file}`);
    expect(served.status(), file).toBe(200);
  }
  expect(violations).toEqual([]);
});
