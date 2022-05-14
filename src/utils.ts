import { createHash } from "https://deno.land/std/hash/mod.ts";
import * as Constants from "./constants.ts";

export const id = (...args: string[]) => {
  return `sha256-${createHash("sha256").update(args.join(".")).toString()}`;
};

export function fileFormat(args: { [k: string]: any }, fpath: string = "") {
  const ff = Constants.FileFormats;
  if (args["--yaml"]) {
    return ff.YAML;
  } else if (args["--json"]) {
    return ff.JSON;
  } else if (args["--jsonl"]) {
    return ff.JSONL;
  } else if (args["--csv"]) {
    return ff.CSV;
  } else if (args["--nq"]) {
    return ff.NQ;
  } else if (args["--jsonld"]) {
    return ff.JSONLD;
  }

  if (fpath.toLowerCase().endsWith(".yaml" || ".yml")) {
    return ff.YAML;
  }

  if (fpath.toLowerCase().endsWith(".json")) {
    return ff.JSON;
  }

  if (fpath.toLowerCase().endsWith(".jsonl")) {
    return ff.JSONL;
  }

  if (fpath.toLowerCase().endsWith(".csv")) {
    return ff.CSV;
  }

  return ff.JSONL;
}
