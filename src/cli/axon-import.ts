export const AXON_CLI = `
Usage:
  axon import [options] [--] [<suboptions>...]
  axon (-h|--help)

Description:
  Perform a complete import or update from an external data-source into a data-sync

Sources:
  Information sources include:

  * Executable scripts that respond to the flags '--plugin' (returning basic plugin information & caching instructions) and '--fetch',
  which yields instances from the script over standard-output. Note; do not log additional message like debugging information to standard-output,
  this will interfere with transmission of data.
  * JSON files in triple or instance format
  * JSONL files in triple instance format

Target:
  * Sqlite database

Arguments:
  Additonal options can be provided to subprocesses in the format "importer.some-long-flag-name=some-value" and "exporter.
  some-long-flag-name=some-value" respectively.

Options:
  --from <src>       An importable data-source.
  --to <tgt>         An exportable data-sink. Optional, defaults to Axon's own sqlite database
`;

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import * as Readers from "../readers.ts";
import { Models } from "../../mod.ts";


const AXON_SCHEMAS = [
  "/home/rg/Code/deno-axon/axon.yaml"
];


/**
 * Import entities into a data-sink
 *
 * @export
 * @param {string[]} argv
 */
export async function main(argv: string[]) {
  const args = docopt(AXON_CLI, { argv, allowExtra: true });
  const from = args["--from"];

  const knowledge = new Models.Knowledge();

  for (const fpath of AXON_SCHEMAS) {
    for await (const entity of Readers.read(fpath, args, knowledge)) {
      knowledge.addEntity(entity);
    }
  }

  // grab entities using a generic reader to try extract entities from the file
  for await (const entity of Readers.read(from, args, knowledge)) {
    console.log(entity);
  }
}
