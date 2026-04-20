import chalk from "chalk";
import type { IPlatformMetadata } from "./core/metadata.js";
import type { ICommand } from "./types.js";

interface IStatusLine {
  readonly detail: string;
  readonly label: string;
  readonly passed: boolean;
}

export function formatCommandUsage(command: ICommand): string {
  return command.metadata.usage ?? command.metadata.name;
}

export function renderGeneralHelp(
  commands: readonly ICommand[],
  metadata: Pick<IPlatformMetadata, "description" | "name" | "version">
): string {
  const lines = commands
    .map((command) => `  ${formatCommandUsage(command).padEnd(18)} ${command.metadata.description}`)
    .join("\n");

  return [
    `Usage: ${metadata.name} [options] <command> [args]`,
    "",
    `${metadata.description} Version ${metadata.version}.`,
    "",
    "Options:",
    "  -h, --help       display help for command",
    "  -V, --version    output the version number",
    "  --debug          print stack traces for unexpected failures",
    "",
    "Commands:",
    lines
  ].join("\n");
}

export function renderCommandHelp(command: ICommand): string {
  const examples = command.metadata.examples?.length
    ? ["", "Examples:", ...command.metadata.examples.map((example) => `  ${example}`)]
    : [];

  return [
    `Usage: ${formatCommandUsage(command)}`,
    "",
    command.metadata.description,
    ...examples
  ].join("\n");
}

export function renderCommandList(commands: readonly ICommand[]): string {
  return commands
    .map((command) => `${command.metadata.name}\t${command.metadata.description}`)
    .join("\n");
}

export function renderPlatformVersion(metadata: Pick<IPlatformMetadata, "name" | "version">): string {
  return `${chalk.cyan(metadata.name)} ${chalk.green(metadata.version)}`;
}

export function renderPlatformMetadata(metadata: IPlatformMetadata): string {
  return [
    `${chalk.bold("Name:")} ${chalk.cyan(metadata.name)}`,
    `${chalk.bold("Version:")} ${chalk.green(metadata.version)}`,
    `${chalk.bold("Description:")} ${metadata.description}`,
    `${chalk.bold("Node:")} ${metadata.nodeVersion}`
  ].join("\n");
}

export function renderStatusLine(status: IStatusLine): string {
  const prefix = status.passed ? chalk.green("OK") : chalk.red("FAIL");
  return `${prefix} ${status.label}: ${status.detail}`;
}
