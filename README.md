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
npm run dev -- list
npm run dev -- help doctor
npm run dev -- info
npm run dev -- doctor
npm run build
node dist/index.js --help
node dist/index.js --debug version
node dist/index.js version
node dist/index.js list
node dist/index.js help doctor
node dist/index.js info
node dist/index.js doctor
```

## Available Commands

| Command | Purpose |
| --- | --- |
| `version` | Prints the platform name and version from `package.json`. |
| `list` | Prints the registry-backed command inventory in a stable order using command metadata rather than hardcoded help text. |
| `help [command]` | Prints either the general CLI help surface or command-specific help resolved by command name through the registry. Unknown help targets return exit code `1`. |
| `info` | Shows the platform name, version, description, and supported Node version with a short loading spinner. |
| `doctor` | Runs runtime diagnostics for Node.js support plus platform name and version metadata, returning exit code `0` on success and `1` when any check fails. |

## Global Options

| Option | Purpose |
| --- | --- |
| `--debug` | Prints the full stack trace for unexpected failures instead of the user-facing error message, including CLI parsing failures such as unknown commands. |
| `-h`, `--help` | Routes to the built-in `help` command and prints the registry-driven help surface. |
| `-V`, `--version` | Routes to the built-in `version` command. |

## Validation

```bash
npm run lint
npm run typecheck
npm test -- tests/core/registry.test.ts tests/cli.test.ts
npm run build
```

The verification flow keeps the test scope tight: it exercises the registry contract plus the CLI command surface directly, then builds the distributable. That covers the metadata-driven built-ins (`version`, `list`, `help`), explicit exit-code behavior for unknown commands and unknown help targets, and the existing `info` and `doctor` commands without relying on ad-hoc Commander wiring.

## Exit Codes

The CLI returns exit code `0` for successful command execution. Unknown commands, unknown help targets, and invalid command arguments exit with code `1`. Unhandled failures also exit with code `1`, and `doctor` returns exit code `1` when any diagnostic check reports `FAIL`.

## Architecture Summary

The platform centers on a typed command contract plus a registry that resolves command metadata by name and keeps the CLI entrypoint focused on dispatch rather than command logic:

```ts
export interface ICommand {
  readonly name: string;
  readonly description: string;
  readonly usage?: string;
  execute(args: readonly string[], context: ICommandContext): Promise<number | void> | number | void;
}

export class CommandRegistry {
  list(): readonly ICommand[];
  resolve(name: string): ICommand | undefined;
}
```

`src/cli.ts` parses POSIX-style global flags, resolves command names through `CommandRegistry`, and implements the built-in `version`, `list`, and `help` commands from the same metadata the registry exposes. `src/index.ts` stays as the executable wrapper, while individual command modules own their runtime behavior.

## Adding New Commands

1. Create a new module under `src/commands` that implements `ICommand`.
2. Register the command from `createCommands()` in `src/cli.ts`.
3. Add a targeted test for the command behavior and update the CLI surface coverage when the command changes command metadata or dispatch rules.
