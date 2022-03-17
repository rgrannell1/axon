/*
 * Constants used application-wide
 *
 */

import { join } from "https://deno.land/std/path/mod.ts";

const __dirname = new URL('.', import.meta.url).pathname;

export const AXON_DB = "./AXON_DB.sqlite";
export const AXON_SCHEMAS = [
  join(__dirname, "../../schemas/axon.yaml")
];
