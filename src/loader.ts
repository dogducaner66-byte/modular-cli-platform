import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadCliConfig } from "./config.js";
import { CommandRegistry } from "./registry.js";
import type { ICommand, ILoadedCommand, ICommandModule, IResolvedCliConfig } from "./types.js";

const SUPPORTED_COMMAND_EXTENSIONS = new Set([".js", ".mjs", ".ts"]);

function isCommandCandidate(value: unknown): value is ICommand {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ICommand;

  return (
    typeof candidate.execute === "function" &&
    typeof candidate.metadata?.name === "string" &&
    typeof candidate.metadata?.description === "string"
  );
}

function validateCommandModule(
  modulePath: string,
  moduleExports: Partial<ICommandModule> & { readonly default?: unknown }
): ICommand {
  const candidate = moduleExports.command ?? moduleExports.default;

  if (!isCommandCandidate(candidate)) {
    throw new Error(
      `Command module '${modulePath}' must export a 'command' object or default export with metadata and execute().`
    );
  }

  return candidate;
}

async function importCommandModule(modulePath: string): Promise<ICommand> {
  try {
    const importedModule = (await import(pathToFileURL(modulePath).href)) as ICommandModule & {
      readonly default?: unknown;
    };
    return validateCommandModule(modulePath, importedModule);
  } catch (error) {
    console.error(`Failed to load command module from ${modulePath}.`);
    throw error;
  }
}

export async function loadCommandsFromDirectory(
  directoryPath: string,
  source: ILoadedCommand["source"]
): Promise<readonly ILoadedCommand[]> {
  let entries: readonly string[];

  try {
    entries = (await readdir(directoryPath)).sort((left, right) => left.localeCompare(right));
  } catch (error) {
    console.error(`Failed to read command directory ${directoryPath}.`);
    throw error;
  }

  const modules: ILoadedCommand[] = [];

  for (const entry of entries) {
    const extension = path.extname(entry);

    if (!SUPPORTED_COMMAND_EXTENSIONS.has(extension) || entry.endsWith(".d.ts")) {
      continue;
    }

    const sourcePath = path.join(directoryPath, entry);
    const command = await importCommandModule(sourcePath);
    modules.push({ command, source, sourcePath });
  }

  return modules;
}

export async function loadCommandsFromModulePaths(
  modulePaths: readonly string[],
  source: ILoadedCommand["source"]
): Promise<readonly ILoadedCommand[]> {
  const modules: ILoadedCommand[] = [];

  for (const modulePath of modulePaths) {
    if (!existsSync(modulePath)) {
      throw new Error(`Configured plugin module not found: ${modulePath}.`);
    }

    const command = await importCommandModule(modulePath);
    modules.push({ command, source, sourcePath: modulePath });
  }

  return modules;
}

export async function loadCommandCatalog(
  config?: IResolvedCliConfig
): Promise<readonly ILoadedCommand[]> {
  const resolvedConfig = config ?? (await loadCliConfig());
  const builtInCommands = await loadCommandsFromDirectory(resolvedConfig.builtInCommandDirectory, "builtin");
  const pluginCommands = await loadCommandsFromModulePaths(resolvedConfig.pluginModulePaths, "plugin");

  return [...builtInCommands, ...pluginCommands];
}

export async function loadRegistry(projectRoot = process.cwd()): Promise<CommandRegistry> {
  const config = await loadCliConfig(projectRoot);
  const catalog = await loadCommandCatalog(config);
  return new CommandRegistry(catalog.map((entry) => entry.command));
}
