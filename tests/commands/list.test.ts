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
        description: "unused",
        nodeVersion: ">=20"
      },
      registry
    }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("list command", () => {
  it("prints the registered commands in registry order", async () => {
    const output: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((message?: unknown) => {
      output.push(String(message ?? ""));
    });
    const { context } = createContext();

    await listCommand.execute([], context);

    expect(logSpy).toHaveBeenCalledOnce();
    expect(output.join("\n").trim()).toBe(
      [
        "help\tDisplay help for a command",
        "list\tList the available commands",
        "version\tDisplay the platform name and version"
      ].join("\n")
    );
  });

  it("rejects unexpected arguments", () => {
    const { context } = createContext();

    expect(() => listCommand.execute(["extra"], context)).toThrow(
      /command 'list' does not accept arguments/
    );
  });
});
