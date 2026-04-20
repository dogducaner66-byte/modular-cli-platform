import assert from "node:assert/strict";
import test from "node:test";
import { command as helpCommand } from "../src/commands/help.js";
import { command as infoCommand } from "../src/commands/info.js";
import { command as versionCommand } from "../src/commands/version.js";
import { renderCommandHelp } from "../src/output.js";
import { CommandRegistry } from "../src/registry.js";
import type { ICommand } from "../src/types.js";

test("CommandRegistry lists commands in registration order", () => {
  const commands: readonly ICommand[] = [
    {
      metadata: {
        name: "hello",
        description: "Hello command"
      },
      execute() {}
    },
    {
      metadata: {
        name: "goodbye",
        description: "Goodbye command"
      },
      execute() {}
    }
  ];

  const registry = new CommandRegistry(commands);

  assert.deepEqual(
    registry.list().map((command) => command.metadata.name),
    ["hello", "goodbye"]
  );
});

test("CommandRegistry resolves command aliases to the original command", () => {
  const registry = new CommandRegistry([
    {
      metadata: {
        name: "hello",
        aliases: ["hi"],
        description: "Hello command"
      },
      execute() {}
    }
  ]);

  assert.equal(registry.resolve("hello")?.metadata.name, "hello");
  assert.equal(registry.resolve("hi")?.metadata.name, "hello");
});

test("CommandRegistry returns undefined for unknown commands", () => {
  const registry = new CommandRegistry([]);

  assert.equal(registry.resolve("missing"), undefined);
});

test("CommandRegistry rejects duplicate command names and aliases", () => {
  assert.throws(
    () =>
      new CommandRegistry([
        {
          metadata: {
            name: "hello",
            aliases: ["hi"],
            description: "Hello command"
          },
          execute() {}
        },
        {
          metadata: {
            name: "hi",
            description: "Conflicting command"
          },
          execute() {}
        }
      ]),
    /Duplicate command registration for 'hi'/
  );
});

test("CommandRegistry exposes built-in command metadata through shared contracts", () => {
  const registry = new CommandRegistry([versionCommand, helpCommand, infoCommand]);

  assert.deepEqual(registry.listMetadata(), [
    {
      name: "version",
      description: "Display the platform name and version",
      examples: ["modular-cli-platform version"]
    },
    {
      name: "help",
      description: "Display help for a command",
      usage: "help [command]",
      examples: ["modular-cli-platform help", "modular-cli-platform help doctor"]
    },
    {
      name: "info",
      description: "Display platform metadata and runtime requirements",
      examples: ["modular-cli-platform info"]
    }
  ]);
});

test("renderCommandHelp includes optional examples from command metadata", () => {
  assert.match(renderCommandHelp(helpCommand), /Examples:/);
  assert.match(renderCommandHelp(helpCommand), /modular-cli-platform help doctor/);
});
