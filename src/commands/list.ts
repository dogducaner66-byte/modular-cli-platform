import type { ICommand, ICommandContext } from "../core/registry.js";
import { validateNoArguments } from "../core/errors.js";

export class ListCommand implements ICommand {
  readonly name = "list";
  readonly description = "List the available commands";

  execute(args: readonly string[], context: ICommandContext): void {
    validateNoArguments(this.name, args);
    console.log(
      context.registry
        .list()
        .map((command) => `${command.name}\t${command.description}`)
        .join("\n")
    );
  }
}
