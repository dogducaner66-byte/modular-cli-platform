import { validateNoArguments } from "../core/errors.js";
import { renderCommandList } from "../output.js";
import type { ICommand } from "../types.js";

const metadata = {
  name: "list",
  description: "List the available commands",
  examples: ["modular-cli-platform list"]
} as const;

export const command: ICommand = {
  metadata,
  execute(args, context): void {
    validateNoArguments(metadata.name, args);
    console.log(renderCommandList(context.registry.list()));
  }
};
