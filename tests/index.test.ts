import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createProgram, resolveArgv } from "../src/index.js";

interface IPackageJson {
  name: string;
  version: string;
  description: string;
}

test("createProgram help includes the CLI name and version from package metadata", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;

  const helpText = createProgram().helpInformation();

  assert.match(helpText, new RegExp(`Usage: ${packageJson.name} \\[options\\]`));
  assert.match(
    helpText,
    new RegExp(`${packageJson.description} Version\\s+${packageJson.version}\\.`)
  );
  assert.match(helpText, /-V, --version\s+output the version number/);
  assert.match(helpText, /info\s+Display platform metadata and runtime requirements/);
  assert.match(helpText, /version\s+Display the platform name and version/);
  assert.match(helpText, /help \[command\]\s+display help for command/);
});

test("resolveArgv appends help when the CLI is invoked without a command", () => {
  assert.deepEqual(resolveArgv(["node", "dist/index.js"]), ["node", "dist/index.js", "--help"]);
});

test("resolveArgv preserves explicit CLI arguments", () => {
  assert.deepEqual(resolveArgv(["node", "dist/index.js", "version"]), ["node", "dist/index.js", "version"]);
});
