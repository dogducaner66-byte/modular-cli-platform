import path from "node:path";
import { defineConfig } from "tsup";

function entryPath(...segments: readonly string[]): string {
  return path.join(...segments).replaceAll(path.sep, "/");
}

export default defineConfig({
  bundle: false,
  clean: true,
  dts: true,
  entry: {
    cli: entryPath("src", "cli.ts"),
    config: entryPath("src", "config.ts"),
    loader: entryPath("src", "loader.ts"),
    output: entryPath("src", "output.ts"),
    registry: entryPath("src", "registry.ts"),
    types: entryPath("src", "types.ts"),
    "core/errors": entryPath("src", "core", "errors.ts"),
    "core/metadata": entryPath("src", "core", "metadata.ts"),
    "core/registry": entryPath("src", "core", "registry.ts"),
    "commands/doctor": entryPath("src", "commands", "doctor.ts"),
    "commands/help": entryPath("src", "commands", "help.ts"),
    "commands/info": entryPath("src", "commands", "info.ts"),
    "commands/list": entryPath("src", "commands", "list.ts"),
    "commands/version": entryPath("src", "commands", "version.ts")
  },
  format: ["esm"],
  outDir: "dist",
  shims: false,
  sourcemap: true,
  splitting: false,
  target: "node20"
});
