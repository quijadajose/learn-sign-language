import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintPluginTailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  js.configs.recommended,
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
      complexity: ["warn", 12],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  eslintPluginTailwindcss.configs.recommended,
  {
    settings: {
      tailwindcss: {
        cssConfigPath: "./src/index.css",
        callees: ["twMerge", "createTheme"],
        classRegex: "^(class(Name)|theme)?$",
        whitelist: [
          "mirror",
          "snow",
          "scrollbar-hide",
          "quill-flowbite",
          "dark",
        ],
      },
    },
    rules: {
      // Ordering is handled by prettier-plugin-tailwindcss.
      "tailwindcss/classnames-order": "off",
      "tailwindcss/enforces-shorthand": "off",
    },
  },
  eslintConfigPrettier,
);
