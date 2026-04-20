import { Command } from "commander";
import { CommandRegistry, type ICommand } from "./core/registry.js";

function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : "An unknown error occurred.";
  console.error(message);
  process.exit(1);
}

function createCommands(): readonly ICommand[] {
  return [];
}

function main(): void {
  try {
    const program = new Command();

    program
      .name("modular-cli-platform")
      .description("A modular CLI platform scaffold.")
      .version("1.0.0");

    const registry = new CommandRegistry(createCommands());

    registry.register(program);
    program.parse(process.argv);
  } catch (error) {
    handleError(error);
  }
}

main();
