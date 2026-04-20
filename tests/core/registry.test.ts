import assert from "node:assert/strict";
import test from "node:test";
import { HelpCommand } from "../../src/commands/help.js";
import { InfoCommand } from "../../src/commands/info.js";
import { VersionCommand } from "../../src/commands/version.js";
import { CommandRegistry, type ICommand } from "../../src/core/registry.js";

test("CommandRegistry lists commands in registration order", () => {
  const commands: readonly ICommand[] = [
    {
      name: "hello",
      description: "Hello command",
      execute() {}
    },
    {
      name: "goodbye",
      description: "Goodbye command",
      execute() {}
    }
  ];

  const registry = new CommandRegistry(commands);

  assert.deepEqual(
    registry.list().map((command) => command.name),
    ["hello", "goodbye"]
  );
});

test("CommandRegistry resolves command aliases to the original command", () => {
  const registry = new CommandRegistry([
    {
      name: "hello",
      aliases: ["hi"],
      description: "Hello command",
      execute() {}
    }
  ]);

  assert.equal(registry.resolve("hello")?.name, "hello");
  assert.equal(registry.resolve("hi")?.name, "hello");
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
          name: "hello",
          aliases: ["hi"],
          description: "Hello command",
          execute() {}
        },
        {
          name: "hi",
          description: "Conflicting command",
          execute() {}
        }
      ]),
    /Duplicate command registration for 'hi'/
  );
});

test("CommandRegistry exposes the built-in command metadata", () => {
  const registry = new CommandRegistry([new VersionCommand(), new HelpCommand(), new InfoCommand()]);

  assert.deepEqual(
    registry.list().map((command) => ({
      name: command.name,
      description: command.description,
      usage: command.usage
    })),
    [
      {
        name: "version",
        description: "Display the platform name and version",
        usage: undefined
      },
      {
        name: "help",
        description: "Display help for a command",
        usage: "help [command]"
      },
      {
        name: "info",
        description: "Display platform metadata and runtime requirements",
        usage: undefined
      }
    ]
  );
});
