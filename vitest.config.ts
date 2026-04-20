import path from "node:path";
import { defineConfig } from "vitest/config";

const testIncludePattern = path.join("tests", "**", "*.test.ts").replaceAll(path.sep, "/");

export default defineConfig({
  test: {
    environment: "node",
    include: [testIncludePattern]
  }
});
