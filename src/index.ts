import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { InfoCommand } from "./commands/info.js";
import { VersionCommand } from "./commands/version.js";
import { readPlatformMetadata } from "./core/metadata.js";
import { CommandRegistry, type ICommand } from "./core/registry.js";

function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : "An unknown error occurred.";
  console.error(message);
  process.exit(1);
}

function createCommands(): readonly ICommand[] {
  return [new VersionCommand(), new InfoCommand()];
}

export function createProgram(commands: readonly ICommand[] = createCommands()): Command {
  const metadata = readPlatformMetadata();
  const program = new Command();

  program
    .name(metadata.name)
    .description(`${metadata.description} Version ${metadata.version}.`)
    .version(metadata.version);

  const registry = new CommandRegistry(commands);

  registry.register(program);
  return program;
}

export async function main(): Promise<void> {
  try {
    await createProgram().parseAsync(process.argv);
  } catch (error) {
    handleError(error);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
