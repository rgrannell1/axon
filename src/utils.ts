
import { createHash } from "https://deno.land/std/hash/mod.ts";
import * as Constants from "./constants.ts"

export const id = (...args: string[]) => {
  return `sha256-${createHash("sha256").update(args.join(".")).toString()}`;
};

export function fileFormat (args: {[k: string]: any}, fpath: string = '') {
  if (args["--yaml"]) {
    return Constants.FileFormats.YAML;
  } else if (args["--json"]) {
    return Constants.FileFormats.JSON;
  } else if (args["--jsonl"]) {
    return Constants.FileFormats.JSONL;
  } else if (args["--csv"]) {
    return Constants.FileFormats.CSV;
  }

  if (fpath.toLowerCase().endsWith(".yaml" || ".yml")) {
    return Constants.FileFormats.YAML;
  }

  if (fpath.toLowerCase().endsWith(".json")) {
    return Constants.FileFormats.JSON;
  }

  if (fpath.toLowerCase().endsWith(".jsonl")) {
    return Constants.FileFormats.JSONL;
  }

  if (fpath.toLowerCase().endsWith(".csv")) {
    return Constants.FileFormats.CSV;
  }

  return Constants.FileFormats.JSONL;
}
