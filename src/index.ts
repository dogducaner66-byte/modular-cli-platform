import path from "node:path";
import { inspect } from "node:util";
import { fileURLToPath } from "node:url";
import { Command, CommanderError } from "commander";
import { DoctorCommand } from "./commands/doctor.js";
import { InfoCommand } from "./commands/info.js";
import { VersionCommand } from "./commands/version.js";
import { readPlatformMetadata } from "./core/metadata.js";
import { CommandRegistry, type ICommand } from "./core/registry.js";

const DEBUG_FLAG = "--debug";
const COMMANDER_SUCCESS_EXIT_CODES = new Set(["commander.help", "commander.helpDisplayed", "commander.version"]);

function isCommanderError(error: unknown): error is CommanderError {
  return error instanceof CommanderError;
}

function isCommanderSuccessExit(error: unknown): error is CommanderError {
  return isCommanderError(error) && COMMANDER_SUCCESS_EXIT_CODES.has(error.code);
}

export function handleError(error: unknown, debugEnabled: boolean): never {
  if (debugEnabled) {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : inspect(error, { depth: null })
    );
  } else if (!isCommanderError(error)) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(message);
  }

  process.exit(1);
}

function createCommands(): readonly ICommand[] {
  return [new VersionCommand(), new InfoCommand(), new DoctorCommand()];
}

export function resolveArgv(argv: readonly string[] = process.argv): string[] {
  return argv.length > 2 ? [...argv] : [...argv, "--help"];
}

export function createProgram(commands: readonly ICommand[] = createCommands()): Command {
  const metadata = readPlatformMetadata();
  const program = new Command();

  program
    .name(metadata.name)
    .description(`${metadata.description} Version ${metadata.version}.`)
    .option(DEBUG_FLAG, "Print stack traces for unexpected failures")
    .version(metadata.version);

  const registry = new CommandRegistry(commands);

  registry.register(program);
  return program;
}

export async function main(argv: readonly string[] = process.argv): Promise<void> {
  const resolvedArgv = resolveArgv(argv);
  const program = createProgram();

  program.exitOverride();

  try {
    await program.parseAsync(resolvedArgv);
  } catch (error) {
    if (isCommanderSuccessExit(error)) {
      return;
    }

    handleError(error, resolvedArgv.includes(DEBUG_FLAG));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
