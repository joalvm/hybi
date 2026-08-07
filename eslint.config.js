import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import local from "./tools/eslint/index.js";

export default tseslint.config(
  { ignores: ["out/**", "dist/**", "release/**", "coverage/**", ".rescue/**"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Domain shapes are type aliases on purpose: they compose into unions and
      // intersections that `interface` cannot express as cleanly.
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Only `src/`. A test file is a list of cases and grows by addition, not by
    // taking on responsibilities; splitting one to satisfy a number would scatter
    // a suite across files that have to be read together anyway.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // The size rule the repo used to keep in prose and broke six times. It
      // counts code, not the documentation blocks this codebase writes on
      // purpose: a file that spends twenty lines explaining itself is the point,
      // not the debt.
      "max-lines": ["error", { max: 225, skipComments: true, skipBlankLines: true }],
    },
  },
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat["recommended-latest"]],
    plugins: { local },
    rules: {
      // Every visible string comes from `src/lang`, so a second language is a
      // directory rather than a sweep through the components.
      "local/no-literal-ui-text": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='style']",
          message: "Use Tailwind classes instead of the JSX style prop.",
        },
      ],
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
