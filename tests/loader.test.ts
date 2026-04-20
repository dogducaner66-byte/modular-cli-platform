import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  loadCommandsFromDirectory,
  loadCommandsFromModulePaths,
  loadRegistry
} from "../src/loader.js";
import { describe, expect, it } from "vitest";

function createTempProject(): string {
  return mkdtempSync(path.join(os.tmpdir(), "modular-cli-loader-"));
}

function writeCommandModule(
  directoryPath: string,
  fileName: string,
  commandName: string,
  exportName: "command" | "default" = "command"
): void {
  mkdirSync(directoryPath, { recursive: true });
  const exportPrefix = exportName === "default" ? "export default" : "export const command =";
  writeFileSync(
    path.join(directoryPath, fileName),
    [
      `${exportPrefix} {`,
      `  metadata: { name: "${commandName}", description: "${commandName} command" },`,
      "  execute() {}",
      "};"
    ].join("\n")
  );
}

describe("loader", () => {
  it("loads modules in deterministic filename order", async () => {
    const projectRoot = createTempProject();
    const commandDirectory = path.join(projectRoot, "src", "commands");

    try {
      writeCommandModule(commandDirectory, "b-second.mjs", "second");
      writeCommandModule(commandDirectory, "a-first.mjs", "first");

      const catalog = await loadCommandsFromDirectory(commandDirectory, "builtin");

      expect(catalog.map((entry) => entry.command.metadata.name)).toEqual(["first", "second"]);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("loads default exports and ignores unsupported files", async () => {
    const projectRoot = createTempProject();
    const commandDirectory = path.join(projectRoot, "src", "commands");

    try {
      writeCommandModule(commandDirectory, "default-export.mjs", "defaulted", "default");
      writeFileSync(path.join(commandDirectory, "README.md"), "# ignored");
      writeFileSync(path.join(commandDirectory, "types.d.ts"), "export {};");

      const catalog = await loadCommandsFromDirectory(commandDirectory, "builtin");

      expect(catalog.map((entry) => entry.command.metadata.name)).toEqual(["defaulted"]);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("rejects malformed command exports", async () => {
    const projectRoot = createTempProject();
    const commandDirectory = path.join(projectRoot, "src", "commands");

    try {
      mkdirSync(commandDirectory, { recursive: true });
      writeFileSync(path.join(commandDirectory, "broken.mjs"), "export const nope = true;");

      await expect(loadCommandsFromDirectory(commandDirectory, "builtin")).rejects.toThrow(
        /must export a 'command' object or default export/
      );
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("surfaces missing directories deterministically", async () => {
    const projectRoot = createTempProject();

    try {
      await expect(
        loadCommandsFromDirectory(path.join(projectRoot, "src", "commands"), "builtin")
      ).rejects.toThrow(/ENOENT/);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("rejects configured plugin modules that do not exist", async () => {
    await expect(
      loadCommandsFromModulePaths([path.join(process.cwd(), "missing-plugin.mjs")], "plugin")
    ).rejects.toThrow(/Configured plugin module not found/);
  });

  it("combines built-ins and configured plugin commands", async () => {
    const projectRoot = createTempProject();
    const builtInDirectory = path.join(projectRoot, "src", "commands");
    const pluginDirectory = path.join(projectRoot, "plugins");

    try {
      writeCommandModule(builtInDirectory, "help.mjs", "help");
      writeCommandModule(pluginDirectory, "plugin.mjs", "plugin");
      writeFileSync(
        path.join(projectRoot, ".clirc.json"),
        JSON.stringify({ plugins: [path.join("plugins", "plugin.mjs")] }, null, 2)
      );

      const registry = await loadRegistry(projectRoot);

      expect(registry.resolve("help")?.metadata.name).toBe("help");
      expect(registry.resolve("plugin")?.metadata.name).toBe("plugin");
      expect(registry.list().map((command) => command.metadata.name)).toEqual(["help", "plugin"]);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("rejects duplicate names across built-ins and plugins", async () => {
    const projectRoot = createTempProject();
    const builtInDirectory = path.join(projectRoot, "src", "commands");
    const pluginDirectory = path.join(projectRoot, "plugins");

    try {
      writeCommandModule(builtInDirectory, "help.mjs", "shared");
      writeCommandModule(pluginDirectory, "plugin.mjs", "shared");
      writeFileSync(
        path.join(projectRoot, ".clirc.json"),
        JSON.stringify({ plugins: [path.join("plugins", "plugin.mjs")] }, null, 2)
      );

      await expect(loadRegistry(projectRoot)).rejects.toThrow(
        /Duplicate command registration for 'shared'/
      );
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });
});
