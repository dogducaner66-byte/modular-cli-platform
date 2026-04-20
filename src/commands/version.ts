import { validateNoArguments } from "../core/errors.js";
import { renderPlatformVersion } from "../output.js";
import type { ICommand } from "../types.js";

const metadata = {
  name: "version",
  description: "Display the platform name and version",
  examples: ["modular-cli-platform version"]
} as const;

export const command: ICommand = {
  metadata,
  execute(args, context): void {
    validateNoArguments(metadata.name, args);
    console.log(renderPlatformVersion(context.metadata));
  }
};
