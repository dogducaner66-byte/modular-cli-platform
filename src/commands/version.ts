import chalk from "chalk";
import type { Command } from "commander";
import type { ICommand } from "../core/registry.js";
import { readPlatformMetadata } from "../core/metadata.js";

export class VersionCommand implements ICommand {
  register(program: Command): void {
    program
      .command("version")
      .description("Display the platform name and version")
      .action(() => {
        try {
          const metadata = readPlatformMetadata();
          console.log(`${chalk.cyan(metadata.name)} ${chalk.green(metadata.version)}`);
        } catch (error) {
          console.error("Failed to display platform version.");
          throw error;
        }
      });
  }
}
