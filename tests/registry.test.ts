import { command as helpCommand } from "../src/commands/help.js";
import { command as listCommand } from "../src/commands/list.js";
import { command as versionCommand } from "../src/commands/version.js";
import { CommandRegistry } from "../src/registry.js";
import type { ICommand } from "../src/types.js";
import { describe, expect, it } from "vitest";

function createCommand(name: string, description: string, aliases: readonly string[] = []): ICommand {
  return {
    metadata: {
      name,
      description,
      aliases
    },
    execute() {}
  };
}

describe("CommandRegistry", () => {
  it("lists commands in registration order", () => {
    const registry = new CommandRegistry([
      createCommand("hello", "Hello command"),
      createCommand("goodbye", "Goodbye command")
    ]);

    expect(registry.list().map((command) => command.metadata.name)).toEqual(["hello", "goodbye"]);
  });

  it("resolves aliases to the original command", () => {
    const registry = new CommandRegistry([createCommand("hello", "Hello command", ["hi"])]);

    expect(registry.resolve("hello")?.metadata.name).toBe("hello");
    expect(registry.resolve("hi")?.metadata.name).toBe("hello");
  });

  it("returns metadata for built-in commands through the shared contract", () => {
    const registry = new CommandRegistry([versionCommand, helpCommand, listCommand]);

    expect(registry.listMetadata()).toEqual([
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
        name: "list",
        description: "List the available commands",
        examples: ["modular-cli-platform list"]
      }
    ]);
  });

  it("returns undefined for unknown commands", () => {
    const registry = new CommandRegistry([]);

    expect(registry.resolve("missing")).toBeUndefined();
  });

  it("rejects duplicate command names and aliases", () => {
    expect(() =>
      new CommandRegistry([
        createCommand("hello", "Hello command", ["hi"]),
        createCommand("hi", "Conflicting command")
      ])
    ).toThrow(/Duplicate command registration for 'hi'/);
  });

  it("rejects blank command names and aliases", () => {
    expect(() => new CommandRegistry([createCommand("   ", "Invalid command")])).toThrow(
      /must be non-empty strings/
    );
    expect(() => {
      new CommandRegistry([createCommand("hello", "Hello command", [""])]);
    }).toThrow(/must be non-empty strings/);
  });
});
