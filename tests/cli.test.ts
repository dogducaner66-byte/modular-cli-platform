import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { command as doctorCommand, evaluateDoctorChecks } from "../src/commands/doctor.js";
import { CliUsageError, handleError, parseDispatchPlan, resolveArgv } from "../src/cli.js";
import { loadRegistry } from "../src/loader.js";
import { renderGeneralHelp } from "../src/output.js";
import { CommandRegistry } from "../src/registry.js";
import { afterEach, describe, expect, it, vi } from "vitest";

interface IPackageJson {
  name: string;
  version: string;
  description: string;
}

const ansiPattern = new RegExp(String.raw`\u001B\[[0-9;]*m`, "g");

function stripAnsi(value: string): string {
  return value.replace(ansiPattern, "");
}

function runCli(args: readonly string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ["--import", "tsx", path.join(process.cwd(), "src", "cli.ts"), ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_NO_WARNINGS: "1"
    }
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cli module", () => {
  it("renders general help from loaded registry metadata", async () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;
    const helpText = renderGeneralHelp((await loadRegistry(process.cwd())).list(), packageJson);

    expect(helpText).toMatch(new RegExp(`Usage: ${packageJson.name} \\[options\\] <command> \\[args\\]`));
    expect(helpText).toMatch(
      new RegExp(`${packageJson.description} Version ${packageJson.version.replace(".", "\\.")}\\.`)
    );
    expect(helpText).toMatch(/version\s+Display the platform name and version/);
    expect(helpText).toMatch(/list\s+List the available commands/);
    expect(helpText).toMatch(/help \[command\]\s+Display help for a command/);
    expect(helpText).toMatch(/doctor\s+Run runtime and metadata diagnostics/);
    expect(helpText).toMatch(/info\s+Display platform metadata and runtime requirements/);
  });

  it("resolveArgv removes the node and script segments", () => {
    expect(resolveArgv(["node", path.join("dist", "cli.js")])).toEqual([]);
    expect(resolveArgv(["node", path.join("dist", "cli.js"), "version"])).toEqual(["version"]);
  });

  it("parseDispatchPlan routes global help, version, and debug flags predictably", () => {
    expect(parseDispatchPlan([])).toEqual({
      debugEnabled: false,
      commandName: "help",
      commandArgs: []
    });
    expect(parseDispatchPlan(["--help"])).toEqual({
      debugEnabled: false,
      commandName: "help",
      commandArgs: []
    });
    expect(parseDispatchPlan(["--version"])).toEqual({
      debugEnabled: false,
      commandName: "version",
      commandArgs: []
    });
    expect(parseDispatchPlan(["--debug", "list"])).toEqual({
      debugEnabled: true,
      commandName: "list",
      commandArgs: []
    });
  });

  it("handleError preserves explicit CLI usage exit codes", () => {
    const loggedMessages: string[] = [];
    vi.spyOn(console, "error").mockImplementation((message?: unknown) => {
      loggedMessages.push(String(message ?? ""));
    });

    const exitCode = handleError(new CliUsageError("error: unknown command 'missing-command'", 1), false);

    expect(exitCode).toBe(1);
    expect(loggedMessages).toEqual(["error: unknown command 'missing-command'"]);
  });

  it("doctor command returns exit code 0 for a healthy context", async () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      output.push(String(message ?? ""));
    });
    const registry = new CommandRegistry([doctorCommand]);
    const exitCode = await doctorCommand.execute([], {
      cwd: process.cwd(),
      metadata: {
        name: "modular-cli-platform",
        version: "1.0.0",
        description: "unused",
        nodeVersion: ">=20"
      },
      registry
    });

    expect(exitCode).toBeUndefined();
    expect(stripAnsi(output.join("\n"))).toContain("OK Node.js >=20");
  });

  it("default invocation renders general help to stdout and exits with code 0", () => {
    const result = runCli([]);
    const output = stripAnsi(result.stdout);

    expect(result.status).toBe(0);
    expect(output).toMatch(/Usage: modular-cli-platform \[options\] <command> \[args\]/);
    expect(output).toMatch(/help \[command\]\s+Display help for a command/);
  });

  it("list command enumerates registered commands in a stable order", () => {
    const result = runCli(["list"]);
    const output = stripAnsi(result.stdout).trim().split(/\r?\n/);

    expect(result.status).toBe(0);
    expect(output).toEqual([
      "doctor\tRun runtime and metadata diagnostics",
      "help\tDisplay help for a command",
      "info\tDisplay platform metadata and runtime requirements",
      "list\tList the available commands",
      "version\tDisplay the platform name and version"
    ]);
  });

  it("help for a known command prints command-specific usage", () => {
    const result = runCli(["help", "version"]);
    const output = stripAnsi(result.stdout);

    expect(result.status).toBe(0);
    expect(output).toMatch(/^Usage: version/m);
    expect(output).toMatch(/Display the platform name and version/);
  });

  it("unknown commands exit with code 1 and preserve the user-facing error contract", () => {
    const result = runCli(["missing-command"]);
    const errorOutput = stripAnsi(result.stderr);

    expect(result.status).toBe(1);
    expect(errorOutput.trim()).toBe("error: unknown command 'missing-command'");
  });

  it("unknown help targets exit with code 1 and preserve the user-facing error contract", () => {
    const result = runCli(["help", "missing-command"]);
    const errorOutput = stripAnsi(result.stderr);

    expect(result.status).toBe(1);
    expect(errorOutput.trim()).toBe("error: unknown help topic 'missing-command'");
  });

  it("debug mode prints a stack trace for CLI usage errors", () => {
    const result = runCli(["--debug", "missing-command"]);
    const errorOutput = stripAnsi(result.stderr);

    expect(result.status).toBe(1);
    expect(errorOutput).toMatch(/CliUsageError: error: unknown command 'missing-command'/);
    expect(errorOutput).toMatch(/\n\s+at /);
  });

  it("doctor checks fail when Node.js is below the supported major version", () => {
    const checks = evaluateDoctorChecks(
      {
        name: "modular-cli-platform",
        version: "1.0.0",
        description: "test",
        nodeVersion: ">=20"
      },
      "18.19.0"
    );

    expect(checks[0]?.passed).toBe(false);
    expect(checks[0]?.detail).toBe("Current v18.19.0");
    expect(checks[1]?.passed).toBe(true);
    expect(checks[2]?.passed).toBe(true);
  });
});
