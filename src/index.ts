import path from "node:path";
import { fileURLToPath } from "node:url";
export {
  createCommands,
  createContext,
  createRegistry,
  dispatch,
  handleError,
  main,
  parseDispatchPlan,
  resolveArgv
} from "./cli.js";
export { CliUsageError } from "./core/errors.js";
export { renderCommandHelp, renderGeneralHelp } from "./commands/help.js";
import { main } from "./cli.js";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
