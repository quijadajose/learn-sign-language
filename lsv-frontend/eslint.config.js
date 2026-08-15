import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintPluginTailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "**/*.generated.ts", "public/mediapipe/**"] },
  js.configs.recommended,
  {
    files: ["public/**/*.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        localStorage: "readonly",
        window: "readonly",
      },
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Classic hooks rules only (React Compiler rules in v7 recommended are too noisy here).
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  eslintPluginTailwindcss.configs.recommended,
  {
    settings: {
      tailwindcss:
        /** @type {import("eslint-plugin-tailwindcss").PluginSettings} */
        ({
          cssConfigPath: "./src/index.css",
          // `cn` wraps clsx/twMerge; linting those callees flags the `inputs` param as a class.
          functions: ["cn", "createTheme"],
        }),
    },
    rules: {
      // Ordering is handled by prettier-plugin-tailwindcss.
      "tailwindcss/classnames-order": "off",
      "tailwindcss/enforces-shorthand": "off",
      // Suggests e.g. scale-1.01, which is not a real utility (no-custom-classname then flags it).
      "tailwindcss/no-unnecessary-arbitrary-value": "off",
      "tailwindcss/no-custom-classname": [
        "warn",
        {
          whitelist: [
            "dark",
            "font-inherit",
            "mirror",
            "quill-flowbite",
            "quill-seamless",
            "react-select-container",
            "scrollbar-hide",
            "snow",
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
);
