import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { CommandRegistry, type ICommand } from "./core/registry.js";

interface ICliMetadata {
  name: string;
  version: string;
}

function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : "An unknown error occurred.";
  console.error(message);
  process.exit(1);
}

function createCommands(): readonly ICommand[] {
  return [];
}

function getPackageJsonPath(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json");
}

function readCliMetadata(packageJsonPath = getPackageJsonPath()): ICliMetadata {
  let packageJsonContent: string;

  try {
    packageJsonContent = readFileSync(packageJsonPath, "utf8");
  } catch (error) {
    console.error(`Failed to read CLI metadata from ${packageJsonPath}.`);
    throw error;
  }

  let parsedPackageJson: Partial<ICliMetadata>;

  try {
    parsedPackageJson = JSON.parse(packageJsonContent) as Partial<ICliMetadata>;
  } catch (error) {
    console.error(`Failed to parse CLI metadata from ${packageJsonPath}.`);
    throw error;
  }

  if (
    typeof parsedPackageJson.name !== "string" ||
    typeof parsedPackageJson.version !== "string"
  ) {
    throw new Error("package.json must include string name and version fields.");
  }

  return {
    name: parsedPackageJson.name,
    version: parsedPackageJson.version
  };
}

export function createProgram(commands: readonly ICommand[] = createCommands()): Command {
  const metadata = readCliMetadata();
  const program = new Command();

  program
    .name(metadata.name)
    .description(`A modular CLI platform scaffold. Version ${metadata.version}.`)
    .version(metadata.version);

  const registry = new CommandRegistry(commands);

  registry.register(program);
  return program;
}

export function main(): void {
  try {
    createProgram().parse(process.argv);
  } catch (error) {
    handleError(error);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
