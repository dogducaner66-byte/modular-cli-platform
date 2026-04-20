import type { IPlatformMetadata } from "./metadata.js";

export interface ICommandContext {
  readonly metadata: IPlatformMetadata;
  readonly registry: CommandRegistry;
}

export interface ICommand {
  readonly name: string;
  readonly description: string;
  readonly usage?: string;
  readonly aliases?: readonly string[];
  execute(args: readonly string[], context: ICommandContext): Promise<number | void> | number | void;
}

export class CommandRegistry {
  readonly #commands: readonly ICommand[];
  readonly #commandsByName = new Map<string, ICommand>();

  constructor(commands: readonly ICommand[]) {
    this.#commands = [...commands];

    for (const command of this.#commands) {
      this.#registerName(command.name, command);

      for (const alias of command.aliases ?? []) {
        this.#registerName(alias, command);
      }
    }
  }

  #registerName(name: string, command: ICommand): void {
    if (this.#commandsByName.has(name)) {
      throw new Error(`Duplicate command registration for '${name}'.`);
    }

    this.#commandsByName.set(name, command);
  }

  list(): readonly ICommand[] {
    return this.#commands;
  }

  resolve(name: string): ICommand | undefined {
    return this.#commandsByName.get(name);
  }
}
