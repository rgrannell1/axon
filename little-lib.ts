import { createHash } from "https://deno.land/std/hash/mod.ts";

export const id = (...args: string[]) => {
  return `sha256-${createHash("sha256").update(args.join(".")).toString()}`;
};

export * as Models from "./src2/models.ts";
