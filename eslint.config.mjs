import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import css from "@eslint/css";
import next from "@next/eslint-plugin-next";
import { defineConfig } from "eslint/config";

export default defineConfig(
  [
    {
      files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      plugins: { js },
      extends: ["js/recommended"],
      languageOptions: {
        globals: { ...globals.browser, ...globals.node },
      },
    },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    next,
    {
      files: ["**/*.json"],
      plugins: { json },
      language: "json/json",
      extends: ["json/recommended"],
    },
    {
      files: ["**/*.jsonc"],
      plugins: { json },
      language: "json/jsonc",
      extends: ["json/recommended"],
    },
    {
      files: ["**/*.css"],
      plugins: { css },
      language: "css/css",
      extends: ["css/recommended"],
      // Empêcher les règles React de s’appliquer au CSS
      rules: {
        "react/display-name": "off",
      },
    },
  ],
  {
    ignores: ["node_modules", ".next", "dist"],
    // Spécifie la version React à détecter pour eslint-plugin-react
    settings: {
      react: {
        version: "detect",
      },
    },
  }
);
