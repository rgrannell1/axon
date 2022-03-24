export const AXON_CLI = `
Usage:
  axon import [options] [--] [<suboptions>...]
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

Arguments:
  Additonal options can be provided to subprocesses in the format "importer.some-long-flag-name=some-value" and "exporter.
  some-long-flag-name=some-value" respectively.

Options:
  --topic <src>      A topic.
  --from <src>       An importable data-source.
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
  const from = args["--from"];

  const knowledge = new Models.Knowledge();

  for (const fpath of Constants.AXON_SCHEMAS) {
    for await (const thing of Readers.read(fpath, args, knowledge)) {
      knowledge.addThing(thing);
    }
  }

  return Sqlite.writeTopic(
    Constants.AXON_DB,
    args["--topic"],
    Readers.read(from, args, knowledge),
  );
}
