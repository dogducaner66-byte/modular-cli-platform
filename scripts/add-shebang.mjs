import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const shebang = "#!/usr/bin/env node";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const cliOutputPath = path.join(repositoryRoot, "dist", "cli.js");
const cliOutput = readFileSync(cliOutputPath, "utf8");

if (!cliOutput.startsWith(shebang)) {
  writeFileSync(cliOutputPath, `${shebang}\n${cliOutput}`);
}
