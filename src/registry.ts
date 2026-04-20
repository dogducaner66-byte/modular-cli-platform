import type { ICommand, ICommandMetadata } from "./types.js";

export class CommandRegistry {
  readonly #commands: readonly ICommand[];
  readonly #commandsByName = new Map<string, ICommand>();

  constructor(commands: readonly ICommand[]) {
    this.#commands = [...commands];

    for (const command of this.#commands) {
      this.#registerName(command.metadata.name, command);

      for (const alias of command.metadata.aliases ?? []) {
        this.#registerName(alias, command);
      }
    }
  }

  #registerName(name: string, command: ICommand): void {
    if (!name.trim()) {
      throw new Error("Command names and aliases must be non-empty strings.");
    }

    if (this.#commandsByName.has(name)) {
      throw new Error(`Duplicate command registration for '${name}'.`);
    }

    this.#commandsByName.set(name, command);
  }

  list(): readonly ICommand[] {
    return this.#commands;
  }

  listMetadata(): readonly ICommandMetadata[] {
    return this.#commands.map((command) => command.metadata);
  }

  resolve(name: string): ICommand | undefined {
    return this.#commandsByName.get(name);
  }
}
