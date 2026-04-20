import { inspect } from "node:util";
import { DoctorCommand } from "./commands/doctor.js";
import { HelpCommand } from "./commands/help.js";
import { InfoCommand } from "./commands/info.js";
import { ListCommand } from "./commands/list.js";
import { VersionCommand } from "./commands/version.js";
import { CliUsageError } from "./core/errors.js";
import { readPlatformMetadata } from "./core/metadata.js";
import { CommandRegistry, type ICommand, type ICommandContext } from "./core/registry.js";

const DEBUG_FLAG = "--debug";
const HELP_FLAGS = new Set(["-h", "--help"]);
const VERSION_FLAGS = new Set(["-V", "--version"]);

interface IDispatchPlan {
  readonly debugEnabled: boolean;
  readonly commandName: string;
  readonly commandArgs: readonly string[];
}

export function createCommands(): readonly ICommand[] {
  return [
    new VersionCommand(),
    new ListCommand(),
    new HelpCommand(),
    new InfoCommand(),
    new DoctorCommand()
  ];
}

export function createRegistry(commands: readonly ICommand[] = createCommands()): CommandRegistry {
  return new CommandRegistry(commands);
}

export function resolveArgv(argv: readonly string[] = process.argv): readonly string[] {
  return argv.slice(2);
}

export function createContext(registry: CommandRegistry): ICommandContext {
  return {
    metadata: readPlatformMetadata(),
    registry
  };
}

export function parseDispatchPlan(args: readonly string[]): IDispatchPlan {
  if (args.length === 0) {
    return {
      debugEnabled: false,
      commandName: "help",
      commandArgs: []
    };
  }

  let debugEnabled = false;
  let index = 0;

  while (index < args.length) {
    const argument = args[index];

    if (typeof argument !== "string") {
      break;
    }

    if (argument === DEBUG_FLAG) {
      debugEnabled = true;
      index += 1;
      continue;
    }

    if (argument && HELP_FLAGS.has(argument)) {
      return {
        debugEnabled,
        commandName: "help",
        commandArgs: []
      };
    }

    if (argument && VERSION_FLAGS.has(argument)) {
      return {
        debugEnabled,
        commandName: "version",
        commandArgs: []
      };
    }

    if (argument?.startsWith("-")) {
      throw new CliUsageError(`error: unknown option '${argument}'`, 1);
    }

    return {
      debugEnabled,
      commandName: argument,
      commandArgs: args.slice(index + 1)
    };
  }

  return {
    debugEnabled,
    commandName: "help",
    commandArgs: []
  };
}

export async function dispatch(
  args: readonly string[],
  registry = createRegistry()
): Promise<{ readonly debugEnabled: boolean; readonly exitCode: number }> {
  const plan = parseDispatchPlan(args);
  const command = registry.resolve(plan.commandName);

  if (!command) {
    throw new CliUsageError(`error: unknown command '${plan.commandName}'`, 1);
  }

  const context = createContext(registry);
  const exitCode = (await command.execute(plan.commandArgs, context)) ?? 0;

  return {
    debugEnabled: plan.debugEnabled,
    exitCode
  };
}

export function handleError(error: unknown, debugEnabled: boolean): number {
  if (debugEnabled) {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : inspect(error, { depth: null })
    );
  } else if (error instanceof CliUsageError) {
    console.error(error.message);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("An unknown error occurred.");
  }

  return error instanceof CliUsageError ? error.exitCode : 1;
}

export async function main(argv: readonly string[] = process.argv): Promise<void> {
  const args = resolveArgv(argv);
  const debugEnabled = args.includes(DEBUG_FLAG);

  try {
    const result = await dispatch(args);
    process.exitCode = result.exitCode;
  } catch (error) {
    process.exitCode = handleError(error, debugEnabled);
  }
}
