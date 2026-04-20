import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const configRoot = path.dirname(fileURLToPath(import.meta.url));
const tsGlob = path.join("**", "*.ts").replaceAll(path.sep, "/");
const mjsGlob = path.join("**", "*.mjs").replaceAll(path.sep, "/");

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: [tsGlob],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: configRoot
      }
    }
  },
  {
    files: [mjsGlob],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node
    }
  }
);
