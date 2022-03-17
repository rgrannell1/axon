import { createHash } from "https://deno.land/std/hash/mod.ts";

export const id = (...args: string[]) => {
  return `sha256-${createHash("sha256").update(args.join(".")).toString()}`;
};

export * as Models from "./src/models.ts";
export * as Constants from "./src/constants.ts";
export * as Readers from "./src/readers.ts";
