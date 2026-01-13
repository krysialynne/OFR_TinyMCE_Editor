import eslintjs from "@eslint/js";
import microsoftPowerApps from "@microsoft/eslint-plugin-power-apps";
import pluginPromise from "eslint-plugin-promise";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // Flat-config–level ignore
    // This is REQUIRED for PCF + Flat ESLint
    ignores: [
      "**/generated",
      "assets/**",        // ensures TinyMCE assets are never linted
      "**/*.js"           // prevents JS files from being sent to TS project service
    ],
  },

  eslintjs.configs.recommended,

  // These configs ENABLE type-aware linting
  // They rely on parserOptions.project
  ...typescriptEslint.configs.recommendedTypeChecked,
  ...typescriptEslint.configs.stylisticTypeChecked,

  pluginPromise.configs["flat/recommended"],
  microsoftPowerApps.configs.paCheckerHosted,
  reactPlugin.configs.flat.recommended,

  {
    plugins: {
      "@microsoft/power-apps": microsoftPowerApps,
    },

    // LIMIT ESLint TO TS / TSX FILES ONLY
    // Without this, ESLint still "sees" asset JS files
    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
      globals: {
        ...globals.browser,
        ComponentFramework: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",

        // REMOVE projectService
        // projectService: true,
        //
        // This is what caused:
        // "file was not found by the project service"
        // because ESLint tried to attach asset JS files
        // to the TypeScript program.

        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
