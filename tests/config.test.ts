import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCliConfig } from "../src/config.js";

function createTempProject(): string {
  const projectRoot = mkdtempSync(path.join(os.tmpdir(), "modular-cli-config-"));
  mkdirSync(path.join(projectRoot, "src", "commands"), { recursive: true });
  writeFileSync(path.join(projectRoot, "package.json"), JSON.stringify({ type: "module" }, null, 2));
  return projectRoot;
}

test("loadCliConfig defaults to the built-in src commands directory", async (t) => {
  const projectRoot = createTempProject();
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  const config = await loadCliConfig(projectRoot);

  assert.equal(config.projectRoot, projectRoot);
  assert.equal(config.builtInCommandDirectory, path.join(projectRoot, "src", "commands"));
  assert.deepEqual(config.pluginModulePaths, []);
});

test("loadCliConfig resolves plugin paths from .clirc.json", async (t) => {
  const projectRoot = createTempProject();
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  writeFileSync(
    path.join(projectRoot, ".clirc.json"),
    JSON.stringify({ plugins: ["plugins", path.join("plugins", "hello.mjs")] }, null, 2)
  );

  const config = await loadCliConfig(projectRoot);

  assert.equal(config.configPath, path.join(projectRoot, ".clirc.json"));
  assert.deepEqual(config.pluginModulePaths, [
    path.join(projectRoot, "plugins"),
    path.join(projectRoot, "plugins", "hello.mjs")
  ]);
});

test("loadCliConfig loads plugin entries from cli.config.js", async (t) => {
  const projectRoot = createTempProject();
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  writeFileSync(
    path.join(projectRoot, "cli.config.js"),
    'export default { plugins: ["plugins/analytics.mjs"] };'
  );

  const config = await loadCliConfig(projectRoot);

  assert.equal(config.configPath, path.join(projectRoot, "cli.config.js"));
  assert.deepEqual(config.pluginModulePaths, [path.join(projectRoot, "plugins", "analytics.mjs")]);
});

test("loadCliConfig rejects ambiguous config files", async (t) => {
  const projectRoot = createTempProject();
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  writeFileSync(path.join(projectRoot, ".clirc.json"), JSON.stringify({ plugins: [] }));
  writeFileSync(path.join(projectRoot, "cli.config.js"), "export default { plugins: [] };");

  await assert.rejects(() => loadCliConfig(projectRoot), /Ambiguous CLI config/);
});

test("loadCliConfig rejects malformed plugin declarations", async (t) => {
  const projectRoot = createTempProject();
  t.after(() => rmSync(projectRoot, { force: true, recursive: true }));

  writeFileSync(path.join(projectRoot, ".clirc.json"), JSON.stringify({ plugins: [123] }));

  await assert.rejects(() => loadCliConfig(projectRoot), /must declare plugins as a string array/);
});
