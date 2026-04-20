import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface IPackageJsonMetadata {
  name?: string;
  version?: string;
  description?: string;
  engines?: {
    node?: string;
  };
}

export interface IPlatformMetadata {
  name: string;
  version: string;
  description: string;
  nodeVersion: string;
}

export function getPackageJsonPath(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
}

export function readPlatformMetadata(packageJsonPath = getPackageJsonPath()): IPlatformMetadata {
  let packageJsonContent: string;

  try {
    packageJsonContent = readFileSync(packageJsonPath, "utf8");
  } catch (error) {
    console.error(`Failed to read platform metadata from ${packageJsonPath}.`);
    throw error;
  }

  let parsedPackageJson: IPackageJsonMetadata;

  try {
    parsedPackageJson = JSON.parse(packageJsonContent) as IPackageJsonMetadata;
  } catch (error) {
    console.error(`Failed to parse platform metadata from ${packageJsonPath}.`);
    throw error;
  }

  if (
    typeof parsedPackageJson.name !== "string" ||
    typeof parsedPackageJson.version !== "string" ||
    typeof parsedPackageJson.description !== "string" ||
    typeof parsedPackageJson.engines?.node !== "string"
  ) {
    throw new Error(
      "package.json must include string name, version, description, and engines.node fields."
    );
  }

  return {
    name: parsedPackageJson.name,
    version: parsedPackageJson.version,
    description: parsedPackageJson.description,
    nodeVersion: parsedPackageJson.engines.node
  };
}
