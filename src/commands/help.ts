import { CliUsageError } from "../core/errors.js";
import { renderCommandHelp, renderGeneralHelp } from "../output.js";
import type { ICommand } from "../types.js";

const metadata = {
  name: "help",
  description: "Display help for a command",
  usage: "help [command]",
  examples: ["modular-cli-platform help", "modular-cli-platform help doctor"]
} as const;

export const command: ICommand = {
  metadata,
  execute(args, context): void {
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
};
