#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
export {
  createContext,
  dispatch,
  handleError,
  main,
  parseDispatchPlan,
  resolveArgv
} from "./cli.js";
export { CliUsageError } from "./core/errors.js";
export { loadCliConfig } from "./config.js";
export { loadCommandCatalog, loadCommandsFromDirectory, loadCommandsFromModulePaths, loadRegistry } from "./loader.js";
export { renderCommandHelp, renderCommandList, renderGeneralHelp, renderPlatformMetadata, renderPlatformVersion, renderStatusLine } from "./output.js";
export { CommandRegistry } from "./registry.js";
export type {
  ICliConfig,
  ICommand,
  ICommandContext,
  ICommandMetadata,
  ICommandModule,
  ILoadedCommand,
  IResolvedCliConfig
} from "./types.js";
import { main } from "./cli.js";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
