import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCommandsFromDirectory, loadRegistry } from "../src/loader.js";

function createTempProject(): string {
  return mkdtempSync(path.join(os.tmpdir(), "modular-cli-loader-"));
}

function writeCommandModule(directoryPath: string, fileName: string, commandName: string): void {
  mkdirSync(directoryPath, { recursive: true });
  writeFileSync(
    path.join(directoryPath, fileName),
    [
      "export const command = {",
      `  metadata: { name: "${commandName}", description: "${commandName} command" },`,
      "  execute() {}",
      "};"
    ].join("\n")
  );
}

test("loadCommandsFromDirectory loads modules in deterministic filename order", async (t) => {
  const projectRoot = createTempProject();
  const commandDirectory = path.join(projectRoot, "src", "commands");
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  writeCommandModule(commandDirectory, "b-second.mjs", "second");
  writeCommandModule(commandDirectory, "a-first.mjs", "first");

  const catalog = await loadCommandsFromDirectory(commandDirectory, "builtin");

  assert.deepEqual(
    catalog.map((entry) => entry.command.metadata.name),
    ["first", "second"]
  );
});

test("loadCommandsFromDirectory rejects malformed command exports", async (t) => {
  const projectRoot = createTempProject();
  const commandDirectory = path.join(projectRoot, "src", "commands");
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  mkdirSync(commandDirectory, { recursive: true });
  writeFileSync(path.join(commandDirectory, "broken.mjs"), "export const nope = true;");

  await assert.rejects(
    () => loadCommandsFromDirectory(commandDirectory, "builtin"),
    /must export a 'command' object or default export/
  );
});

test("loadCommandsFromDirectory surfaces missing directories deterministically", async (t) => {
  const projectRoot = createTempProject();
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  await assert.rejects(
    () => loadCommandsFromDirectory(path.join(projectRoot, "src", "commands"), "builtin"),
    /ENOENT/
  );
});

test("loadRegistry combines built-ins and configured plugin commands", async (t) => {
  const projectRoot = createTempProject();
  const builtInDirectory = path.join(projectRoot, "src", "commands");
  const pluginDirectory = path.join(projectRoot, "plugins");
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  writeCommandModule(builtInDirectory, "help.mjs", "help");
  writeCommandModule(pluginDirectory, "plugin.mjs", "plugin");
  writeFileSync(
    path.join(projectRoot, ".clirc.json"),
    JSON.stringify({ plugins: [path.join("plugins", "plugin.mjs")] }, null, 2)
  );

  const registry = await loadRegistry(projectRoot);

  assert.equal(registry.resolve("help")?.metadata.name, "help");
  assert.equal(registry.resolve("plugin")?.metadata.name, "plugin");
  assert.deepEqual(
    registry.list().map((command) => command.metadata.name),
    ["help", "plugin"]
  );
});

test("loadRegistry rejects duplicate names across built-ins and plugins", async (t) => {
  const projectRoot = createTempProject();
  const builtInDirectory = path.join(projectRoot, "src", "commands");
  const pluginDirectory = path.join(projectRoot, "plugins");
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  writeCommandModule(builtInDirectory, "help.mjs", "shared");
  writeCommandModule(pluginDirectory, "plugin.mjs", "shared");
  writeFileSync(
    path.join(projectRoot, ".clirc.json"),
    JSON.stringify({ plugins: [path.join("plugins", "plugin.mjs")] }, null, 2)
  );

  await assert.rejects(() => loadRegistry(projectRoot), /Duplicate command registration for 'shared'/);
});
