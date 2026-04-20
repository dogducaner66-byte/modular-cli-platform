import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { command as versionCommand } from "../../src/commands/version.js";
import { CommandRegistry } from "../../src/registry.js";

interface IPackageJson {
  name: string;
  version: string;
}

function stripAnsi(text: string): string {
  return text.replace(/\u001B\[[0-9;]*m/g, "");
}

test("version command prints the package name and version", async () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;
  const output: string[] = [];
  const originalLog = console.log;

  console.log = (...arguments_: unknown[]) => {
    output.push(arguments_.join(" "));
  };

  try {
    const registry = new CommandRegistry([versionCommand]);
    const command = registry.resolve("version");

    await command?.execute([], {
      cwd: process.cwd(),
      metadata: {
        name: packageJson.name,
        version: packageJson.version,
        description: "unused",
        nodeVersion: ">=20"
      },
      registry
    });
  } finally {
    console.log = originalLog;
  }

  assert.equal(stripAnsi(output.join("\n")).trim(), `${packageJson.name} ${packageJson.version}`);
});
