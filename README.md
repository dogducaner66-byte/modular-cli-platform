# Modular CLI Platform

Modular CLI Platform is a presentation-ready TypeScript command-line product that treats command metadata, registry behavior, output rendering, and plugin loading as first-class architecture rather than incidental runner glue.

## Installation

```bash
npm install
npm run build
```

After the build, the published artifact exposes the `modular-cli-platform` binary and ships only the compiled runtime plus its public contracts.

## Usage

```bash
npm run dev -- list
npm run dev -- help doctor
npm run dev -- version
npm run dev -- info
npm run dev -- doctor

npm run build
node dist/cli.js list
node dist/cli.js help version
node dist/cli.js version
node dist/cli.js info
node dist/cli.js doctor
```

## Final Command Surface

| Command | Role | Purpose |
| --- | --- | --- |
| `list` | Core workflow | Enumerates the installed command surface from the registry. |
| `help [command]` | Core workflow | Renders general help or command-specific usage from shared metadata. |
| `version` | Core workflow | Prints the platform name and version from package metadata. |
| `info` | Reference module | Demonstrates richer terminal output for a metadata-driven module. |
| `doctor` | Reference module | Demonstrates deterministic diagnostics through the same command contract. |

`info` and `doctor` remain in the product because they are no longer special-cased core wiring. They are discovered from the same module contract as every other command, which keeps the presentation focused on extensibility rather than bespoke built-ins.

## Additive Command Workflow

Built-in commands live in `src/commands/` during development and are loaded from `dist/commands/` in packaged builds. To add a new built-in command:

1. Create a module in `src/commands/`.
2. Export a `command` object (or default export) that matches the shared `ICommand` contract.
3. Rebuild and the command becomes part of the registry automatically.

External plugins are additive too. Declare them in either `.clirc.json` or `cli.config.js` from the project root and the loader will merge them after built-ins. Duplicate names or malformed exports fail deterministically instead of being silently ignored.

### `.clirc.json`

```json
{
  "plugins": ["./plugins/greet.mjs"]
}
```

### `cli.config.js`

```js
export default {
  plugins: ["./plugins/greet.mjs"]
};
```

## Plugin Authoring

Plugin modules use the same contract as built-ins:

```ts
import type { ICommand } from "modular-cli-platform/types";

export const command: ICommand = {
  metadata: {
    name: "greet",
    description: "Print a friendly greeting",
    usage: "greet [name]",
    examples: ["modular-cli-platform greet Ada"]
  },
  execute(args) {
    const name = args[0] ?? "world";
    console.log(`Hello, ${name}!`);
  }
};
```

The package also exports `registry`, `loader`, `config`, and `output` subpaths so plugin authors can reuse the same contracts and formatting primitives as the core product.

## Validation

```bash
npm run lint
npm test -- tests/types.test.ts tests/config.test.ts tests/loader.test.ts tests/registry.test.ts tests/output.test.ts tests/cli.test.ts tests/commands/version.test.ts tests/commands/list.test.ts tests/commands/help.test.ts
npm run build
npm pack --dry-run
```

That targeted test set is sufficient for this change because it covers the shared contracts (`tests/types.test.ts` and `tests/registry.test.ts`), configuration parsing (`tests/config.test.ts`), module discovery and duplicate handling (`tests/loader.test.ts`), terminal rendering (`tests/output.test.ts`), the CLI-facing command surface (`tests/cli.test.ts`), and the built-in command behaviors plus negative paths (`tests/commands/version.test.ts`, `tests/commands/list.test.ts`, and `tests/commands/help.test.ts`).

## Packaging

The published package now includes:

1. `dist/` runtime JavaScript and declaration files.
2. `README.md` for installation and plugin authoring guidance.
3. A `bin` entry for `modular-cli-platform`.
4. Subpath exports for the public contracts used by plugins.

`npm pack --dry-run` is part of CI so the shipped artifact stays aligned with the documented modular architecture.
