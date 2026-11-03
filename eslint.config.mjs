import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default defineConfig([
  globalIgnores([
    "**/.next/**",
    "**/next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ["apps/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },
]);
