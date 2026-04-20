import type { IPlatformMetadata } from "./core/metadata.js";
import type { CommandRegistry } from "./registry.js";

export interface ICommandMetadata {
  readonly name: string;
  readonly description: string;
  readonly usage?: string;
  readonly aliases?: readonly string[];
  readonly examples?: readonly string[];
}

export interface ICommandContext {
  readonly cwd: string;
  readonly metadata: IPlatformMetadata;
  readonly registry: CommandRegistry;
}

export interface ICommand {
  readonly metadata: ICommandMetadata;
  execute(args: readonly string[], context: ICommandContext): Promise<number | void> | number | void;
}

export interface ICommandModule {
  readonly command: ICommand;
}

export interface ICliConfig {
  readonly plugins?: readonly string[];
}

export interface IResolvedCliConfig {
  readonly builtInCommandDirectory: string;
  readonly configPath?: string;
  readonly pluginModulePaths: readonly string[];
  readonly projectRoot: string;
}

export interface ILoadedCommand {
  readonly command: ICommand;
  readonly source: "builtin" | "plugin";
  readonly sourcePath: string;
}
