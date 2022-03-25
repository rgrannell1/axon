#!/bin/sh
//bin/true; exec /home/rg/.deno/bin/deno run -A "$0" "$@"

export const AXON_CLI = `
Usage:
  axon import (--from <src>) [--topic <src>] [options] [--] [<suboptions>...]
  axon import [--topic <src>] [options] [--] - [<suboptions>...]
  axon (-h|--help)

Description:
  Perform a complete import or update from an external data-source into a Sqlite triple-store.

Sources:
  Information sources include:

  * Executable scripts that respond to the flags '--plugin' (returning basic plugin information & caching instructions) and '--fetch',
  which yields instances from the script over standard-output. Note; do not log additional message like debugging information to standard-output,
  this will interfere with transmission of data.
  * JSON files in instance format
  * JSONL files in instance format
  * Standard input, in JSON, JSONL, or Yaml.

Arguments:
  Additonal options can be provided to subprocesses as an K=V argument "importer.filepath='some-value'", which will be received by
  the subprocess as a --filepath='some-value' flag.

Options:
  --yaml             Read entities as yaml
  --json             Read entities as json
  --jsonl            Read entities as jsonl
  --topic <src>      A regular expression for matching topics. [Default: .+]
  --from <src>       An importable data-source. Will attempt to infer file-type from extension if no format is explicitly
                       mentioned. Alternatively, use '-' for stdin.
`;

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import { Constants, Models, Readers, Sqlite } from "../../mod.ts";

/**
 * Import entities into a data-sink
 *
 * @export
 * @param {string[]} argv
 */
export async function main(argv: string[]) {
  const args = docopt(AXON_CLI, { argv, allowExtra: true });
  const from = args["-"] ? "/dev/stdin" : args["--from"];

  const knowledge = new Models.Knowledge();

  for (const fpath of Constants.AXON_SCHEMAS) {
    for await (const thing of Readers.read(fpath, args, knowledge)) {
      knowledge.addThing(thing);
    }
  }

  return Sqlite.writeTopic(
    Constants.AXON_DB,
    args["--topic"],
    knowledge,
    Readers.read(from, args, knowledge),
  );
}
