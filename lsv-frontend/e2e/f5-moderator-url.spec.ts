import { expect, test } from "./fixtures/roles";

/**
 * H7 (UI): un moderador que abre por URL directa el espacio de otro idioma no ve su
 * contenido. La API ya responde 403 (f5-moderator-scope); aquí se comprueba la pantalla.
 */
test("moderator opening another language by URL sees none of its content", async ({
  adminPage,
  moderatorPage,
  baseURL,
}) => {
  const origin = baseURL!;
  const name = `F5 url ${Date.now()}`;
  const other = await adminPage.context().request.post("/api/languages", {
    headers: { Origin: origin },
    data: {
      name,
      description: "F5 URL isolation fixture",
      countryCode: "US",
    },
  });
  expect(other.status()).toBe(201);
  const otherId = (await other.json()).id as string;

  await moderatorPage.goto(`/admin/languages/${otherId}`);
  // La pantalla no está rota: la barra de navegación sigue cargada.
  await expect(moderatorPage.getByRole("navigation").first()).toBeVisible();
  await expect(moderatorPage.getByText(name, { exact: true })).toHaveCount(0);
  await expect(moderatorPage.getByText("F5 URL isolation fixture")).toHaveCount(
    0,
  );
});
