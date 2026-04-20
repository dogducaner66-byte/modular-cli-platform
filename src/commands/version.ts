import chalk from "chalk";
import { validateNoArguments } from "../core/errors.js";
import type { ICommand, ICommandContext } from "../core/registry.js";

export class VersionCommand implements ICommand {
  readonly name = "version";
  readonly description = "Display the platform name and version";

  execute(args: readonly string[], context: ICommandContext): void {
    validateNoArguments(this.name, args);
    console.log(`${chalk.cyan(context.metadata.name)} ${chalk.green(context.metadata.version)}`);
  }
}
