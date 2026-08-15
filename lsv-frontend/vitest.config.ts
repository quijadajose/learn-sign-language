import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/i18n.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["src/utils/**/*.ts", "src/services/**/*.ts"],
      thresholds: {
        statements: 25,
        branches: 15,
        functions: 15,
        lines: 25,
      },
    },
  },
});
