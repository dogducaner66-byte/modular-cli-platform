import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { CliUsageError } from "../src/core/errors.js";
import { renderGeneralHelp } from "../src/commands/help.js";
import { handleError, parseDispatchPlan, resolveArgv } from "../src/cli.js";
import { createRegistry } from "../src/index.js";
import { evaluateDoctorChecks } from "../src/commands/doctor.js";

interface IPackageJson {
  name: string;
  version: string;
  description: string;
}

function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;]*m/g, "");
}

function runCli(args: readonly string[]): SpawnSyncReturns<string> {
  return spawnSync(
    process.execPath,
    ["--loader", "ts-node/esm", path.join(process.cwd(), "src", "index.ts"), ...args],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_NO_WARNINGS: "1"
      }
    }
  );
}

test("renderGeneralHelp includes metadata, built-ins, and feature commands", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as IPackageJson;
  const helpText = renderGeneralHelp(createRegistry().list(), packageJson);

  assert.match(helpText, new RegExp(`Usage: ${packageJson.name} \\[options\\] \\[command\\]`));
  assert.match(
    helpText,
    new RegExp(`${packageJson.description} Version ${packageJson.version.replace(".", "\\.")}\\.`)
  );
  assert.match(helpText, /version\s+Display the platform name and version/);
  assert.match(helpText, /list\s+List the available commands/);
  assert.match(helpText, /help \[command\]\s+Display help for a command/);
  assert.match(helpText, /doctor\s+Run runtime and metadata diagnostics/);
  assert.match(helpText, /info\s+Display platform metadata and runtime requirements/);
});

test("resolveArgv removes the node and script segments", () => {
  assert.deepEqual(resolveArgv(["node", path.join("dist", "index.js")]), []);
  assert.deepEqual(resolveArgv(["node", path.join("dist", "index.js"), "version"]), ["version"]);
});

test("parseDispatchPlan routes global help, version, and debug flags predictably", () => {
  assert.deepEqual(parseDispatchPlan([]), {
    debugEnabled: false,
    commandName: "help",
    commandArgs: []
  });
  assert.deepEqual(parseDispatchPlan(["--help"]), {
    debugEnabled: false,
    commandName: "help",
    commandArgs: []
  });
  assert.deepEqual(parseDispatchPlan(["--version"]), {
    debugEnabled: false,
    commandName: "version",
    commandArgs: []
  });
  assert.deepEqual(parseDispatchPlan(["--debug", "list"]), {
    debugEnabled: true,
    commandName: "list",
    commandArgs: []
  });
});

test("handleError preserves explicit CLI usage exit codes", () => {
  const originalConsoleError = console.error;
  const loggedMessages: string[] = [];

  console.error = ((message?: unknown) => {
    loggedMessages.push(String(message));
  }) as typeof console.error;

  try {
    const exitCode = handleError(new CliUsageError("error: unknown command 'missing-command'", 1), false);

    assert.equal(exitCode, 1);
  } finally {
    console.error = originalConsoleError;
  }

  assert.deepEqual(loggedMessages, ["error: unknown command 'missing-command'"]);
});

test("doctor command reports successful diagnostics and exits with code 0", () => {
  const result = runCli(["doctor"]);
  const output = stripAnsi(result.stdout);

  assert.equal(result.status, 0);
  assert.match(output, /OK Node\.js >=20: Current v20\./);
  assert.match(output, /OK Platform name: modular-cli-platform/);
  assert.match(output, /OK Platform version: 1\.0\.0/);
});

test("default invocation renders general help to stdout and exits with code 0", () => {
  const result = runCli([]);
  const output = stripAnsi(result.stdout);

  assert.equal(result.status, 0);
  assert.match(output, /Usage: modular-cli-platform \[options\] \[command\]/);
  assert.match(output, /help \[command\]\s+Display help for a command/);
});

test("list command enumerates registered commands in a stable order", () => {
  const result = runCli(["list"]);
  const output = stripAnsi(result.stdout).trim().split(/\r?\n/);

  assert.equal(result.status, 0);
  assert.deepEqual(output, [
    "version\tDisplay the platform name and version",
    "list\tList the available commands",
    "help\tDisplay help for a command",
    "info\tDisplay platform metadata and runtime requirements",
    "doctor\tRun runtime and metadata diagnostics"
  ]);
});

test("help for a known command prints command-specific usage", () => {
  const result = runCli(["help", "version"]);
  const output = stripAnsi(result.stdout);

  assert.equal(result.status, 0);
  assert.match(output, /^Usage: version/m);
  assert.match(output, /Display the platform name and version/);
});

test("unknown commands exit with code 1 and preserve the user-facing error contract", () => {
  const result = runCli(["missing-command"]);
  const errorOutput = stripAnsi(result.stderr);

  assert.equal(result.status, 1);
  assert.equal(errorOutput.trim(), "error: unknown command 'missing-command'");
});

test("unknown help targets exit with code 1 and preserve the user-facing error contract", () => {
  const result = runCli(["help", "missing-command"]);
  const errorOutput = stripAnsi(result.stderr);

  assert.equal(result.status, 1);
  assert.equal(errorOutput.trim(), "error: unknown help topic 'missing-command'");
});

test("debug mode prints a stack trace for CLI usage errors", () => {
  const result = runCli(["--debug", "missing-command"]);
  const errorOutput = stripAnsi(result.stderr);

  assert.equal(result.status, 1);
  assert.match(errorOutput, /CliUsageError: error: unknown command 'missing-command'/);
  assert.match(errorOutput, /\n\s+at /);
});

test("doctor checks fail when Node.js is below the supported major version", () => {
  const checks = evaluateDoctorChecks(
    {
      name: "modular-cli-platform",
      version: "1.0.0",
      description: "test",
      nodeVersion: ">=20"
    },
    "18.19.0"
  );

  assert.equal(checks[0]?.passed, false);
  assert.equal(checks[0]?.detail, "Current v18.19.0");
  assert.equal(checks[1]?.passed, true);
  assert.equal(checks[2]?.passed, true);
});
