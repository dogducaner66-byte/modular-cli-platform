import type { Command } from "commander";

export interface ICommand {
  register(program: Command): void;
}

export class CommandRegistry {
  readonly #commands: readonly ICommand[];

  constructor(commands: readonly ICommand[]) {
    this.#commands = commands;
  }

  register(program: Command): Command {
    for (const command of this.#commands) {
      command.register(program);
    }

    return program;
  }
}
