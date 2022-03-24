/*
 * Constants used application-wide
 *
 */

import { join } from "https://deno.land/std/path/mod.ts";

const __dirname = new URL(".", import.meta.url).pathname;

const home = Deno.env.get("HOME") as string

export const AXON_DB = join(home, ".axon.sqlite");
export const AXON_SCHEMAS = [
  join(__dirname, "../schemas/axon.yaml"),
];

export enum FileFormats {
  YAML = "yaml",
  JSON = "json",
  JSONL = "jsonl",
  CSV = "csv",
}
