import type { Page } from "@playwright/test";

const MAX_PAGES = 20;
const FIRST_WAIT_MS = 10_000;

/**
 * Hace clic en la tarjeta de un idioma del selector del dashboard (`main`), esperando a que
 * la lista cargue y recorriendo las páginas del componente de paginación si el idioma no
 * está en la primera (8 idiomas por página, ordenados por nombre).
 *
 * Sin esto, un idioma creado en una corrida anterior o en otro test puede quedar en la
 * página 2 y el test falla de forma intermitente (ver H2 en plan-implementacion-funcional.md).
 */
export async function selectLanguageCard(page: Page, languageName: string) {
  const main = page.locator("main");
  const card = main.getByText(languageName, { exact: true }).first();

  await card
    .waitFor({ state: "visible", timeout: FIRST_WAIT_MS })
    .catch(() => undefined);
  if (await card.isVisible()) {
    await card.click();
    return;
  }

  const pagination = main.getByRole("navigation");
  for (let page_ = 1; page_ < MAX_PAGES; page_++) {
    if ((await pagination.count()) === 0) break;
    const next = pagination
      .getByRole("button", { name: /next|siguiente/i })
      .first();
    if ((await next.count()) === 0 || (await next.isDisabled())) break;
    await next.click();
    if (
      await card
        .waitFor({ state: "visible", timeout: 3_000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await card.click();
      return;
    }
  }
  throw new Error(
    `Language "${languageName}" not found in the dashboard picker`,
  );
}
