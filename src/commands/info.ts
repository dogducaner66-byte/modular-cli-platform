import chalk from "chalk";
import ora from "ora";
import { setTimeout as delay } from "node:timers/promises";
import { validateNoArguments } from "../core/errors.js";
import { renderPlatformMetadata } from "../output.js";
import type { ICommand } from "../types.js";

const metadata = {
  name: "info",
  description: "Display platform metadata and runtime requirements",
  examples: ["modular-cli-platform info"]
} as const;

export const command: ICommand = {
  metadata,
  async execute(args, context): Promise<void> {
    validateNoArguments(metadata.name, args);

    const spinner = ora({
      text: "Loading platform metadata...",
      discardStdin: false
    }).start();

    try {
      await delay(120);
      spinner.succeed(chalk.green("Platform metadata loaded."));

      console.log(renderPlatformMetadata(context.metadata));
    } catch (error) {
      spinner.fail(chalk.red("Failed to load platform metadata."));
      console.error("Unable to display platform information.");
      throw error;
    }
  }
};
