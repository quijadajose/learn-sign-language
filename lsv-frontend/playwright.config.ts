import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // The E2E suite shares one generated student; F2 enrolls it before F3/F6 use it.
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4174",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: {
      ...(chromiumExecutable ? { executablePath: chromiumExecutable } : {}),
      args: [
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-video-capture=${resolve("e2e/fixtures/hand.y4m")}`,
      ],
    },
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
