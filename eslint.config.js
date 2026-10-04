import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  // `dist` was the only entry, but vite builds to `www` (see vite.config.ts),
  // so the committed build output was being linted as source.
  globalIgnores(["dist", "www", "android", "ios", "**/*.test.{ts,tsx}"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "react-hooks/incompatible-library": "off",

      // `_name` is the established convention here for a parameter that exists
      // only to satisfy an interface.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Demoted to warnings rather than silenced: each is a real signal, but the
      // existing code leans on all three, so leaving them as errors would mean a
      // permanently red lint that nobody runs. They stay visible as a backlog.
      // See docs/AUDIT.md B-01.
      "@typescript-eslint/no-explicit-any": "warn",
      "react-refresh/only-export-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // `ThunderSDK.useCaching` is an SDK method, not a React hook; the rule only
    // matches it because of the `use` prefix.
    files: ["src/core/endpoints/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
])
