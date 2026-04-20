import { command as helpCommand } from "../src/commands/help.js";
import {
  formatCommandUsage,
  renderCommandHelp,
  renderCommandList,
  renderGeneralHelp,
  renderPlatformMetadata,
  renderPlatformVersion,
  renderStatusLine
} from "../src/output.js";
import type { ICommand } from "../src/types.js";
import { describe, expect, it } from "vitest";

const ansiPattern = new RegExp(String.raw`\u001B\[[0-9;]*m`, "g");

function stripAnsi(value: string): string {
  return value.replace(ansiPattern, "");
}

describe("output renderers", () => {
  it("prefers explicit usage strings and falls back to the command name", () => {
    const commandWithoutUsage: ICommand = {
      metadata: {
        name: "list",
        description: "List commands"
      },
      execute() {}
    };

    expect(formatCommandUsage(helpCommand)).toBe("help [command]");
    expect(formatCommandUsage(commandWithoutUsage)).toBe("list");
  });

  it("renders general help from command metadata", () => {
    const helpText = renderGeneralHelp(
      [
        {
          metadata: {
            name: "version",
            description: "Display the platform name and version"
          },
          execute() {}
        },
        helpCommand
      ],
      {
        name: "modular-cli-platform",
        version: "1.0.0",
        description: "Presentation-ready modular CLI"
      }
    );

    expect(helpText).toContain("Usage: modular-cli-platform [options] <command> [args]");
    expect(helpText).toContain("Presentation-ready modular CLI Version 1.0.0.");
    expect(helpText).toContain("help [command]");
    expect(helpText).toContain("display help for command");
  });

  it("renders command help with optional examples", () => {
    expect(renderCommandHelp(helpCommand)).toContain("Examples:");
    expect(renderCommandHelp(helpCommand)).toContain("modular-cli-platform help doctor");
  });

  it("omits the examples section when command metadata has no examples", () => {
    const helpText = renderCommandHelp({
      metadata: {
        name: "list",
        description: "List commands"
      },
      execute() {}
    });

    expect(helpText).not.toContain("Examples:");
  });

  it("renders command lists in a stable tab-delimited format", () => {
    const output = renderCommandList([
      {
        metadata: {
          name: "help",
          description: "Display help for a command"
        },
        execute() {}
      },
      {
        metadata: {
          name: "version",
          description: "Display the platform name and version"
        },
        execute() {}
      }
    ]);

    expect(output).toBe(
      ["help\tDisplay help for a command", "version\tDisplay the platform name and version"].join(
        "\n"
      )
    );
  });

  it("renders platform metadata and version lines for terminal output", () => {
    const metadata = {
      name: "modular-cli-platform",
      version: "1.0.0",
      description: "Presentation-ready modular CLI",
      nodeVersion: ">=20"
    };

    expect(stripAnsi(renderPlatformVersion(metadata))).toBe("modular-cli-platform 1.0.0");
    expect(stripAnsi(renderPlatformMetadata(metadata))).toContain("Node: >=20");
  });

  it("renders explicit OK and FAIL status lines", () => {
    expect(
      stripAnsi(
        renderStatusLine({
          label: "Node.js >=20",
          detail: "Current v20.20.0",
          passed: true
        })
      )
    ).toBe("OK Node.js >=20: Current v20.20.0");

    expect(
      stripAnsi(
        renderStatusLine({
          label: "Platform version",
          detail: "missing",
          passed: false
        })
      )
    ).toBe("FAIL Platform version: missing");
  });
});
