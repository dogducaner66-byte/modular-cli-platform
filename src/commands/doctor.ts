import chalk from "chalk";
import type { Command } from "commander";
import type { IPlatformMetadata } from "../core/metadata.js";
import { readPlatformMetadata } from "../core/metadata.js";
import type { ICommand } from "../core/registry.js";

const MINIMUM_SUPPORTED_NODE_MAJOR = 20;

export interface IDoctorCheck {
  readonly label: string;
  readonly detail: string;
  readonly passed: boolean;
}

export function evaluateDoctorChecks(
  metadata: IPlatformMetadata,
  nodeVersion = process.versions.node
): readonly IDoctorCheck[] {
  const nodeMajor = Number.parseInt(nodeVersion.split(".")[0] ?? "", 10);
  const normalizedNodeVersion = nodeVersion.startsWith("v") ? nodeVersion : `v${nodeVersion}`;

  return [
    {
      label: `Node.js >=${MINIMUM_SUPPORTED_NODE_MAJOR}`,
      detail: `Current ${normalizedNodeVersion}`,
      passed: Number.isInteger(nodeMajor) && nodeMajor >= MINIMUM_SUPPORTED_NODE_MAJOR
    },
    {
      label: "Platform name",
      detail: metadata.name,
      passed: metadata.name.trim().length > 0
    },
    {
      label: "Platform version",
      detail: metadata.version,
      passed: metadata.version.trim().length > 0
    }
  ];
}

export class DoctorCommand implements ICommand {
  register(program: Command): void {
    program
      .command("doctor")
      .description("Run runtime and metadata diagnostics")
      .action(() => {
        try {
          const metadata = readPlatformMetadata();
          const checks = evaluateDoctorChecks(metadata);

          for (const check of checks) {
            const status = check.passed ? chalk.green("OK") : chalk.red("FAIL");
            console.log(`${status} ${check.label}: ${check.detail}`);
          }

          if (checks.some((check) => !check.passed)) {
            process.exitCode = 1;
          }
        } catch (error) {
          console.error("Failed to run platform diagnostics.");
          throw error;
        }
      });
  }
}
