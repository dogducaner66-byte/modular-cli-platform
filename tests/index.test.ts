import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { CommanderError } from "commander";
import { evaluateDoctorChecks } from "../src/commands/doctor.js";
import { createProgram, handleError, resolveArgv } from "../src/index.js";

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
  assert.match(helpText, /--debug\s+Print stack traces for unexpected failures/);
  assert.match(helpText, /doctor\s+Run runtime and metadata diagnostics/);
  assert.match(helpText, /info\s+Display platform metadata and runtime requirements/);
  assert.match(helpText, /version\s+Display the platform name and version/);
  assert.match(helpText, /help \[command\]\s+display help for command/);
});

test("resolveArgv appends help when the CLI is invoked without a command", () => {
  assert.deepEqual(resolveArgv(["node", "dist/index.js"]), ["node", "dist/index.js", "--help"]);
});

test("resolveArgv preserves explicit CLI arguments", () => {
  assert.deepEqual(resolveArgv(["node", "dist/index.js", "version"]), [
    "node",
    "dist/index.js",
    "version"
  ]);
});

test("handleError prints the user-facing message and exits with code 1 by default", () => {
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;
  const exitSignal = new Error("process.exit");
  const loggedMessages: string[] = [];
  let exitCode: number | undefined;

  console.error = ((message?: unknown) => {
    loggedMessages.push(String(message));
  }) as typeof console.error;
  process.exit = ((code?: number) => {
    exitCode = code;
    throw exitSignal;
  }) as typeof process.exit;

  try {
    assert.throws(
      () => handleError(new Error("Boom."), false),
      (error: unknown) => error === exitSignal
    );
  } finally {
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  }

  assert.equal(exitCode, 1);
  assert.deepEqual(loggedMessages, ["Boom."]);
});

test("handleError prints the full stack trace and exits with code 1 when debug is enabled", () => {
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;
  const exitSignal = new Error("process.exit");
  const loggedMessages: string[] = [];
  let exitCode: number | undefined;
  const error = new Error("Boom.");

  error.stack = "Error: Boom.\n    at debug-stack-frame";

  console.error = ((message?: unknown) => {
    loggedMessages.push(String(message));
  }) as typeof console.error;
  process.exit = ((code?: number) => {
    exitCode = code;
    throw exitSignal;
  }) as typeof process.exit;

  try {
    assert.throws(
      () => handleError(error, true),
      (thrownError: unknown) => thrownError === exitSignal
    );
  } finally {
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  }

  assert.equal(exitCode, 1);
  assert.deepEqual(loggedMessages, ["Error: Boom.\n    at debug-stack-frame"]);
});

test("handleError does not duplicate Commander parsing errors when debug is disabled", () => {
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;
  const exitSignal = new Error("process.exit");
  const loggedMessages: string[] = [];
  let exitCode: number | undefined;

  console.error = ((message?: unknown) => {
    loggedMessages.push(String(message));
  }) as typeof console.error;
  process.exit = ((code?: number) => {
    exitCode = code;
    throw exitSignal;
  }) as typeof process.exit;

  try {
    assert.throws(
      () =>
        handleError(
          new CommanderError(
            1,
            "commander.unknownCommand",
            "error: unknown command 'nonexistent-command'"
          ),
          false
        ),
      (error: unknown) => error === exitSignal
    );
  } finally {
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  }

  assert.equal(exitCode, 1);
  assert.deepEqual(loggedMessages, []);
});

test("doctor command reports successful diagnostics and exits with code 0", () => {
  const result = runCli(["doctor"]);
  const output = stripAnsi(result.stdout);

  assert.equal(result.status, 0);
  assert.match(output, /OK Node\.js >=20: Current v20\./);
  assert.match(output, /OK Platform name: modular-cli-platform/);
  assert.match(output, /OK Platform version: 1\.0\.0/);
});

test("debug mode without a command prints help and exits with code 0", () => {
  const result = runCli(["--debug"]);
  const errorOutput = stripAnsi(result.stderr);

  assert.equal(result.status, 0);
  assert.match(errorOutput, /Usage: modular-cli-platform \[options\] \[command\]/);
  assert.match(errorOutput, /doctor\s+Run runtime and metadata diagnostics/);
});

test("unknown commands exit with code 1 and keep the user-facing error contract", () => {
  const result = runCli(["nonexistent-command"]);
  const errorOutput = stripAnsi(result.stderr);

  assert.equal(result.status, 1);
  assert.equal(errorOutput.trim(), "error: unknown command 'nonexistent-command'");
});

test("debug mode prints a stack trace for unknown commands", () => {
  const result = runCli(["--debug", "nonexistent-command"]);
  const errorOutput = stripAnsi(result.stderr);

  assert.equal(result.status, 1);
  assert.match(errorOutput, /error: unknown command 'nonexistent-command'/);
  assert.match(errorOutput, /CommanderError: error: unknown command 'nonexistent-command'/);
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
