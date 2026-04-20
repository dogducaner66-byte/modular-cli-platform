import { validateNoArguments } from "../core/errors.js";
import type { IPlatformMetadata } from "../core/metadata.js";
import { renderStatusLine } from "../output.js";
import type { ICommand } from "../types.js";

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

const metadata = {
  name: "doctor",
  description: "Run runtime and metadata diagnostics",
  examples: ["modular-cli-platform doctor"]
} as const;

export const command: ICommand = {
  metadata,
  execute(args, context): number | void {
    validateNoArguments(metadata.name, args);

    try {
      const checks = evaluateDoctorChecks(context.metadata);

      for (const check of checks) {
        console.log(renderStatusLine(check));
      }

      if (checks.some((check) => !check.passed)) {
        return 1;
      }
    } catch (error) {
      console.error("Failed to run platform diagnostics.");
      throw error;
    }
  }
};
