import { readFileSync } from "node:fs";
import path from "node:path";
import { command as versionCommand } from "../../src/commands/version.js";
import { CommandRegistry } from "../../src/registry.js";
import { afterEach, describe, expect, it, vi } from "vitest";

interface IPackageJson {
  name: string;
  version: string;
}

const ansiPattern = new RegExp(String.raw`\u001B\[[0-9;]*m`, "g");

function stripAnsi(text: string): string {
  return text.replace(ansiPattern, "");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("version command", () => {
  it("prints the package name and version", async () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;
    const output: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      output.push(String(message ?? ""));
    });
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

    expect(logSpy).toHaveBeenCalledOnce();
    expect(stripAnsi(output.join("\n")).trim()).toBe(`${packageJson.name} ${packageJson.version}`);
  });

  it("rejects unexpected arguments", () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;
    const registry = new CommandRegistry([versionCommand]);

    expect(() =>
      versionCommand.execute(["extra"], {
        cwd: process.cwd(),
        metadata: {
          name: packageJson.name,
          version: packageJson.version,
          description: "unused",
          nodeVersion: ">=20"
        },
        registry
      })
    ).toThrow(/command 'version' does not accept arguments/);
  });
});
