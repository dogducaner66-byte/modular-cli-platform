import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadCliConfig } from "../src/config.js";
import { describe, expect, it } from "vitest";

function createTempProject(): string {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), "modular-cli-config-"));
  mkdirSync(path.join(projectRoot, "src", "commands"), { recursive: true });
  writeFileSync(path.join(projectRoot, "package.json"), JSON.stringify({ type: "module" }, null, 2));
  return projectRoot;
}

describe("loadCliConfig", () => {
  it("defaults to the built-in src commands directory", async () => {
    const projectRoot = createTempProject();

    try {
      const config = await loadCliConfig(projectRoot);

      expect(config.projectRoot).toBe(projectRoot);
      expect(config.builtInCommandDirectory).toBe(path.join(projectRoot, "src", "commands"));
      expect(config.pluginModulePaths).toEqual([]);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("resolves plugin paths from .clirc.json", async () => {
    const projectRoot = createTempProject();

    try {
      writeFileSync(
        path.join(projectRoot, ".clirc.json"),
        JSON.stringify({ plugins: ["plugins", path.join("plugins", "hello.mjs")] }, null, 2)
      );

      const config = await loadCliConfig(projectRoot);

      expect(config.configPath).toBe(path.join(projectRoot, ".clirc.json"));
      expect(config.pluginModulePaths).toEqual([
        path.join(projectRoot, "plugins"),
        path.join(projectRoot, "plugins", "hello.mjs")
      ]);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("loads plugin entries from cli.config.js", async () => {
    const projectRoot = createTempProject();

    try {
      writeFileSync(
        path.join(projectRoot, "cli.config.js"),
        `export default { plugins: [${JSON.stringify(path.join("plugins", "analytics.mjs"))}] };`
      );

      const config = await loadCliConfig(projectRoot);

      expect(config.configPath).toBe(path.join(projectRoot, "cli.config.js"));
      expect(config.pluginModulePaths).toEqual([path.join(projectRoot, "plugins", "analytics.mjs")]);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("rejects ambiguous config files", async () => {
    const projectRoot = createTempProject();

    try {
      writeFileSync(path.join(projectRoot, ".clirc.json"), JSON.stringify({ plugins: [] }));
      writeFileSync(path.join(projectRoot, "cli.config.js"), "export default { plugins: [] };");

      await expect(loadCliConfig(projectRoot)).rejects.toThrow(/Ambiguous CLI config/);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("rejects malformed plugin declarations", async () => {
    const projectRoot = createTempProject();

    try {
      writeFileSync(path.join(projectRoot, ".clirc.json"), JSON.stringify({ plugins: [123] }));

      await expect(loadCliConfig(projectRoot)).rejects.toThrow(
        /must declare plugins as a string array/
      );
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("rejects invalid JSON config content", async () => {
    const projectRoot = createTempProject();

    try {
      writeFileSync(path.join(projectRoot, ".clirc.json"), "{");

      await expect(loadCliConfig(projectRoot)).rejects.toThrow(SyntaxError);
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });

  it("rejects JavaScript configs that do not export an object", async () => {
    const projectRoot = createTempProject();

    try {
      writeFileSync(path.join(projectRoot, "cli.config.js"), "export default null;");

      await expect(loadCliConfig(projectRoot)).rejects.toThrow(
        /must export a default object or named 'config'/
      );
    } finally {
      rmSync(projectRoot, { force: true, recursive: true });
    }
  });
});
