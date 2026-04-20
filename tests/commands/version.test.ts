import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { Command } from "commander";
import { VersionCommand } from "../../src/commands/version.js";

interface IPackageJson {
  name: string;
  version: string;
}

function stripAnsi(text: string): string {
  return text.replace(/\u001B\[[0-9;]*m/g, "");
}

test("VersionCommand prints the package name and version", async () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;
  const program = new Command();
  const output: string[] = [];
  const originalLog = console.log;

  console.log = (...arguments_: unknown[]) => {
    output.push(arguments_.join(" "));
  };

  try {
    new VersionCommand().register(program);
    await program.parseAsync(["version"], { from: "user" });
  } finally {
    console.log = originalLog;
  }

  assert.equal(stripAnsi(output.join("\n")).trim(), `${packageJson.name} ${packageJson.version}`);
});
