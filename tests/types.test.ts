import { command as helpCommand } from "../src/commands/help.js";
import { command as infoCommand } from "../src/commands/info.js";
import { command as versionCommand } from "../src/commands/version.js";
import { renderCommandHelp } from "../src/output.js";
import { CommandRegistry } from "../src/registry.js";
import type { ICommand } from "../src/types.js";
import { describe, expect, it } from "vitest";

describe("shared command contracts", () => {
  it("accept registration-ordered commands", () => {
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

    expect(registry.list().map((command) => command.metadata.name)).toEqual(["hello", "goodbye"]);
  });

  it("resolve aliases to the original command", () => {
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

    expect(registry.resolve("hello")?.metadata.name).toBe("hello");
    expect(registry.resolve("hi")?.metadata.name).toBe("hello");
  });

  it("expose built-in metadata through the shared contract", () => {
    const registry = new CommandRegistry([versionCommand, helpCommand, infoCommand]);

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
        name: "info",
        description: "Display platform metadata and runtime requirements",
        examples: ["modular-cli-platform info"]
      }
    ]);
  });

  it("render command help from optional examples", () => {
    expect(renderCommandHelp(helpCommand)).toContain("Examples:");
    expect(renderCommandHelp(helpCommand)).toContain("modular-cli-platform help doctor");
  });
});
