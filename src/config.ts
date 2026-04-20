import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ICliConfig, IResolvedCliConfig } from "./types.js";

const JSON_CONFIG_NAME = ".clirc.json";
const JS_CONFIG_NAME = "cli.config.js";

function validatePluginEntries(plugins: unknown, configPath: string): readonly string[] {
  if (plugins === undefined) {
    return [];
  }

  if (!Array.isArray(plugins) || plugins.some((plugin) => typeof plugin !== "string" || !plugin.trim())) {
    throw new Error(`CLI config '${configPath}' must declare plugins as a string array.`);
  }

  return plugins;
}

function resolveBuiltInCommandDirectory(projectRoot: string): string {
  const sourceDirectory = path.join(projectRoot, "src", "commands");
  const runtimeExtension = path.extname(fileURLToPath(import.meta.url));
  const candidateDirectories =
    runtimeExtension === ".js"
      ? [path.join(projectRoot, "dist", "commands"), sourceDirectory]
      : [sourceDirectory, path.join(projectRoot, "dist", "commands")];

  for (const candidateDirectory of candidateDirectories) {
    if (existsSync(candidateDirectory)) {
      return candidateDirectory;
    }
  }

  throw new Error(
    `Unable to locate built-in command modules. Expected ${candidateDirectories.join(" or ")}.`
  );
}

function readJsonConfig(configPath: string): ICliConfig {
  let rawConfig: string;

  try {
    rawConfig = readFileSync(configPath, "utf8");
  } catch (error) {
    console.error(`Failed to read CLI config from ${configPath}.`);
    throw error;
  }

  let parsedConfig: unknown;

  try {
    parsedConfig = JSON.parse(rawConfig);
  } catch (error) {
    console.error(`Failed to parse CLI config from ${configPath}.`);
    throw error;
  }

  if (!parsedConfig || typeof parsedConfig !== "object") {
    throw new Error(`CLI config '${configPath}' must contain an object.`);
  }

  return parsedConfig as ICliConfig;
}

async function readJavaScriptConfig(configPath: string): Promise<ICliConfig> {
  try {
    const importedModule = (await import(pathToFileURL(configPath).href)) as {
      readonly config?: ICliConfig;
      readonly default?: ICliConfig;
    };
    const resolvedConfig = importedModule.default ?? importedModule.config;

    if (!resolvedConfig || typeof resolvedConfig !== "object") {
      throw new Error(`CLI config '${configPath}' must export a default object or named 'config'.`);
    }

    return resolvedConfig;
  } catch (error) {
    console.error(`Failed to load CLI config module from ${configPath}.`);
    throw error;
  }
}

export async function loadCliConfig(projectRoot = process.cwd()): Promise<IResolvedCliConfig> {
  const jsonConfigPath = path.join(projectRoot, JSON_CONFIG_NAME);
  const jsConfigPath = path.join(projectRoot, JS_CONFIG_NAME);
  const hasJsonConfig = existsSync(jsonConfigPath);
  const hasJsConfig = existsSync(jsConfigPath);

  if (hasJsonConfig && hasJsConfig) {
    throw new Error(
      `Ambiguous CLI config. Found both ${JSON_CONFIG_NAME} and ${JS_CONFIG_NAME} in ${projectRoot}.`
    );
  }

  let configPath: string | undefined;
  let rawConfig: ICliConfig = {};

  if (hasJsonConfig) {
    configPath = jsonConfigPath;
    rawConfig = readJsonConfig(jsonConfigPath);
  } else if (hasJsConfig) {
    configPath = jsConfigPath;
    rawConfig = await readJavaScriptConfig(jsConfigPath);
  }

  const pluginEntries = validatePluginEntries(rawConfig.plugins, configPath ?? JSON_CONFIG_NAME);

  return {
    builtInCommandDirectory: resolveBuiltInCommandDirectory(projectRoot),
    configPath,
    pluginModulePaths: pluginEntries.map((plugin) => path.resolve(projectRoot, plugin)),
    projectRoot
  };
}
