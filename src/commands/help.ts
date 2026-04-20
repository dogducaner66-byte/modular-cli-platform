import type { ICommand, ICommandContext } from "../core/registry.js";
import { CliUsageError } from "../core/errors.js";

function formatCommandUsage(command: ICommand): string {
  return command.usage ?? command.name;
}

export function renderGeneralHelp(
  commands: readonly ICommand[],
  metadata: { readonly name: string; readonly description: string; readonly version: string }
): string {
  const lines = commands
    .map((command) => `  ${formatCommandUsage(command).padEnd(14)} ${command.description}`)
    .join("\n");

  return [
    `Usage: ${metadata.name} [options] [command]`,
    "",
    `${metadata.description} Version ${metadata.version}.`,
    "",
    "Options:",
    "  -h, --help     display help for command",
    "  -V, --version  output the version number",
    "  --debug        Print stack traces for unexpected failures",
    "",
    "Commands:",
    lines
  ].join("\n");
}

export function renderCommandHelp(command: ICommand): string {
  return [
    `Usage: ${formatCommandUsage(command)}`,
    "",
    command.description
  ].join("\n");
}

export class HelpCommand implements ICommand {
  readonly name = "help";
  readonly description = "Display help for a command";
  readonly usage = "help [command]";

  execute(args: readonly string[], context: ICommandContext): void {
    if (args.length > 1) {
      throw new CliUsageError("error: command 'help' accepts at most one command name", 1);
    }

    if (args.length === 0) {
      console.log(renderGeneralHelp(context.registry.list(), context.metadata));
      return;
    }

    const targetName = args[0];

    if (typeof targetName !== "string") {
      throw new CliUsageError("error: command 'help' accepts at most one command name", 1);
    }

    const target = context.registry.resolve(targetName);

    if (!target) {
      throw new CliUsageError(`error: unknown help topic '${targetName}'`, 1);
    }

    console.log(renderCommandHelp(target));
  }
}
