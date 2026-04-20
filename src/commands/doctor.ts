import chalk from "chalk";
import { validateNoArguments } from "../core/errors.js";
import type { IPlatformMetadata } from "../core/metadata.js";
import type { ICommand, ICommandContext } from "../core/registry.js";

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
  readonly name = "doctor";
  readonly description = "Run runtime and metadata diagnostics";

  execute(args: readonly string[], context: ICommandContext): number | void {
    validateNoArguments(this.name, args);

    try {
      const checks = evaluateDoctorChecks(context.metadata);

      for (const check of checks) {
        const status = check.passed ? chalk.green("OK") : chalk.red("FAIL");
        console.log(`${status} ${check.label}: ${check.detail}`);
      }

      if (checks.some((check) => !check.passed)) {
        return 1;
      }
    } catch (error) {
      console.error("Failed to run platform diagnostics.");
      throw error;
    }
  }
}
