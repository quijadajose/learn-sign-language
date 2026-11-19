import { test as base, type Page } from "@playwright/test";

type RoleFixtures = { adminPage: Page; moderatorPage: Page; studentPage: Page };

export const test = base.extend<RoleFixtures>({
  adminPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      baseURL,
      storageState: "e2e/.auth/admin.json",
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture callback, not a React component.
    await use(await context.newPage());
    await context.close();
  },
  studentPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      baseURL,
      storageState: "e2e/.auth/student.json",
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture callback, not a React component.
    await use(await context.newPage());
    await context.close();
  },
  moderatorPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      baseURL,
      storageState: "e2e/.auth/moderator.json",
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture callback, not a React component.
    await use(await context.newPage());
    await context.close();
  },
});

export { expect } from "@playwright/test";
