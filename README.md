# Modular CLI Platform

Modular CLI Platform is a presentation-ready TypeScript command-line application scaffold built to demonstrate clean command composition, deterministic metadata handling, and a maintainable registration model for future CLI features.

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev -- --help
npm run dev -- --debug version
npm run dev -- version
npm run dev -- info
npm run dev -- doctor
npm run build
node dist/index.js --help
node dist/index.js --debug version
node dist/index.js version
node dist/index.js info
node dist/index.js doctor
```

## Available Commands

| Command | Purpose |
| --- | --- |
| `version` | Prints the platform name and version from `package.json`. |
| `info` | Shows the platform name, version, description, and supported Node version with a short loading spinner. |
| `doctor` | Runs runtime diagnostics for Node.js support plus platform name and version metadata, returning exit code `0` on success and `1` when any check fails. |

## Global Options

| Option | Purpose |
| --- | --- |
| `--debug` | Prints the full stack trace for unexpected failures instead of the user-facing error message. |

## Validation

```bash
npm run lint
npm run typecheck
npm test -- tests/index.test.ts
npm run build
npm run verify:commands
```

The CI workflow runs the same contract: install dependencies, lint, type-check, execute the targeted command-surface regression test, build the distributable, then smoke-test `version`, `info`, and `--help` from `dist`. The `doctor` command is covered by the targeted CLI surface tests.

## Exit Codes

The CLI returns exit code `0` for successful command execution. Unhandled failures exit with code `1`, and `doctor` also exits with code `1` when any diagnostic check reports `FAIL`.

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
