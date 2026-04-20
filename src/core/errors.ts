export class CliUsageError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "CliUsageError";
    this.exitCode = exitCode;
  }
}

export function validateNoArguments(commandName: string, args: readonly string[]): void {
  if (args.length === 0) {
    return;
  }

  throw new CliUsageError(`error: command '${commandName}' does not accept arguments`, 1);
}
