import chalk from "chalk";
import ora from "ora";
import { setTimeout as delay } from "node:timers/promises";
import { validateNoArguments } from "../core/errors.js";
import type { ICommand, ICommandContext } from "../core/registry.js";

export class InfoCommand implements ICommand {
  readonly name = "info";
  readonly description = "Display platform metadata and runtime requirements";

  async execute(args: readonly string[], context: ICommandContext): Promise<void> {
    validateNoArguments(this.name, args);

    const spinner = ora({
      text: "Loading platform metadata...",
      discardStdin: false
    }).start();

    try {
      await delay(120);
      spinner.succeed(chalk.green("Platform metadata loaded."));

      console.log(
        [
          `${chalk.bold("Name:")} ${chalk.cyan(context.metadata.name)}`,
          `${chalk.bold("Version:")} ${chalk.green(context.metadata.version)}`,
          `${chalk.bold("Description:")} ${context.metadata.description}`,
          `${chalk.bold("Node:")} ${context.metadata.nodeVersion}`
        ].join("\n")
      );
    } catch (error) {
      spinner.fail(chalk.red("Failed to load platform metadata."));
      console.error("Unable to display platform information.");
      throw error;
    }
  }
}
