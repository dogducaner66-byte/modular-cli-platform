# Modular CLI Platform

Modular CLI Platform is a presentation-ready TypeScript command-line application scaffold built to demonstrate clean command composition, deterministic metadata handling, and a maintainable registration model for future CLI features.

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev -- --help
npm run dev -- version
npm run dev -- info
```

## Available Commands

| Command | Purpose |
| --- | --- |
| `version` | Prints the platform name and version from `package.json`. |
| `info` | Shows the platform name, version, description, and supported Node version with a short loading spinner. |

## Architecture Summary

The platform centers on a small command contract and a registry that keeps the CLI entrypoint focused on composition rather than command logic:

```ts
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
```

`src/index.ts` reads platform metadata once, builds the Commander program, and hands command registration to `CommandRegistry`. Each command module owns its own Commander wiring and runtime behavior, which keeps new features isolated and easy to test.

## Adding New Commands

1. Create a new module under `src/commands` that implements `ICommand`.
2. Register the command from `createCommands()` in `src/index.ts`.
3. Add a targeted test for the command behavior and update help coverage if the command changes the CLI surface.
