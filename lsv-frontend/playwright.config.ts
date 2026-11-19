import { defineConfig, devices } from "@playwright/test";

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4174",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: chromiumExecutable
      ? { executablePath: chromiumExecutable }
      : {},
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 4174",
        url: "http://127.0.0.1:4174",
        reuseExistingServer: true,
        env: {
          VITE_API_PROXY_TARGET:
            process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3001",
        },
      },
  globalSetup: "./e2e/global-setup.ts",
});
