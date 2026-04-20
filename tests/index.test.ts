import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createProgram } from "../src/index.js";

interface IPackageJson {
  name: string;
  version: string;
}

test("createProgram help includes the CLI name and version from package metadata", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;

  const helpText = createProgram().helpInformation();

  assert.match(helpText, new RegExp(`Usage: ${packageJson.name} \\[options\\]`));
  assert.match(helpText, new RegExp(`Version ${packageJson.version}\\.`));
  assert.match(helpText, /-V, --version\s+output the version number/);
});
