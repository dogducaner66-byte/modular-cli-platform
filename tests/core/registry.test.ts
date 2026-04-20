import assert from "node:assert/strict";
import test from "node:test";
import { Command } from "commander";
import { CommandRegistry, type ICommand } from "../../src/core/registry.js";

test("CommandRegistry registers all provided commands on the program", () => {
  const program = new Command();
  const registeredCommands: string[] = [];

  const commands: readonly ICommand[] = [
    {
      register(commandProgram) {
        registeredCommands.push("hello");
        commandProgram.command("hello").description("Hello command");
      }
    },
    {
      register(commandProgram) {
        registeredCommands.push("goodbye");
        commandProgram.command("goodbye").description("Goodbye command");
      }
    }
  ];

  const registry = new CommandRegistry(commands);

  const result = registry.register(program);

  assert.equal(result, program);
  assert.deepEqual(registeredCommands, ["hello", "goodbye"]);
  assert.deepEqual(
    program.commands.map((command) => command.name()),
    ["hello", "goodbye"]
  );
});

test("CommandRegistry leaves the program unchanged when no commands are provided", () => {
  const program = new Command();
  const registry = new CommandRegistry([]);

  const result = registry.register(program);

  assert.equal(result, program);
  assert.equal(program.commands.length, 0);
});
