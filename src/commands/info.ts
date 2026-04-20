import chalk from "chalk";
import type { Command } from "commander";
import ora from "ora";
import { setTimeout as delay } from "node:timers/promises";
import { readPlatformMetadata } from "../core/metadata.js";
import type { ICommand } from "../core/registry.js";

export class InfoCommand implements ICommand {
  register(program: Command): void {
    program
      .command("info")
      .description("Display platform metadata and runtime requirements")
      .action(async () => {
        const spinner = ora({
          text: "Loading platform metadata...",
          discardStdin: false
        }).start();

        try {
          const metadata = readPlatformMetadata();

          await delay(120);
          spinner.succeed(chalk.green("Platform metadata loaded."));

          console.log(
            [
              `${chalk.bold("Name:")} ${chalk.cyan(metadata.name)}`,
              `${chalk.bold("Version:")} ${chalk.green(metadata.version)}`,
              `${chalk.bold("Description:")} ${metadata.description}`,
              `${chalk.bold("Node:")} ${metadata.nodeVersion}`
            ].join("\n")
          );
        } catch (error) {
          spinner.fail(chalk.red("Failed to load platform metadata."));
          console.error("Unable to display platform information.");
          throw error;
        }
      });
  }
}
