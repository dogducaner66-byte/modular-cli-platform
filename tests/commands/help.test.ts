import { command as helpCommand } from "../../src/commands/help.js";
import { command as listCommand } from "../../src/commands/list.js";
import { command as versionCommand } from "../../src/commands/version.js";
import { CommandRegistry } from "../../src/registry.js";
import { afterEach, describe, expect, it, vi } from "vitest";

function createContext() {
  const registry = new CommandRegistry([helpCommand, listCommand, versionCommand]);

  return {
    registry,
    context: {
      cwd: process.cwd(),
      metadata: {
        name: "modular-cli-platform",
        version: "1.0.0",
        description: "Presentation-ready modular CLI",
        nodeVersion: ">=20"
      },
      registry
    }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("help command", () => {
  it("renders general help when no command is provided", async () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      output.push(String(message ?? ""));
    });
    const { context } = createContext();

    await helpCommand.execute([], context);

    expect(output.join("\n")).toContain("Usage: modular-cli-platform [options] <command> [args]");
    expect(output.join("\n")).toContain("help [command]");
  });

  it("renders command-specific help for known commands", async () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      output.push(String(message ?? ""));
    });
    const { context } = createContext();

    await helpCommand.execute(["version"], context);

    expect(output.join("\n")).toContain("Usage: version");
    expect(output.join("\n")).toContain("Display the platform name and version");
  });

  it("rejects unknown help targets", () => {
    const { context } = createContext();

    expect(() => helpCommand.execute(["missing"], context)).toThrow(/unknown help topic 'missing'/);
  });

  it("rejects more than one positional argument", () => {
    const { context } = createContext();

    expect(() => helpCommand.execute(["version", "extra"], context)).toThrow(
      /accepts at most one command name/
    );
  });
});
