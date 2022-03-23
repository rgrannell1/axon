export const AXON_CLI = `
Usage:
  axon export [--triples|--entities] [--yaml|--json|--jsonl|--csv] (--search <str>)
  axon (-h|--help)

Description:
  Perform a complete import or update from an external data-source into a Sqlite triple-store.

Targets:
  Enties or triples can be exported  to the following formats.

  * Yaml files
  * Json files
  * Jsonl files
  * Csv files

Options:
  --triples         Export in triple-format
  --entities        Export in entity-format
  --yaml            Write entities or triples as yaml
  --json            Write entities or triples as json
  --jsonl           Write entities or triples as jsonl
  --csv             Write entities or triples as csv
  --search <src>    A SQL search for entities to return.
`;

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import {stringify as yamlStringify} from 'https://deno.land/std@0.82.0/encoding/yaml.ts';

import { Constants, Models, Sqlite } from "../../mod.ts";
const { FileFormats, EntityFormat } = Constants;

const DBPATH = "./AXON_DB.sqlite";

/**
 * Import entities into a data-sink
 *
 * @export
 * @param {string[]} argv
 */
export async function main(argv: string[]) {
  const args = docopt(AXON_CLI, { argv, allowExtra: true });

  let fileFormat = FileFormats.JSONL;
  if (args["--yaml"]) {
    fileFormat = FileFormats.YAML;
  } else if (args["--json"]) {
    fileFormat = FileFormats.JSON;
  } else if (args["--jsonl"]) {
    fileFormat = FileFormats.JSONL;
  } else if (args["--csv"]) {
    fileFormat = FileFormats.CSV;
  }

  let entityFormat = EntityFormat.ENTITIES;
  if (args["--triples"]) {
    entityFormat = EntityFormat.TRIPLES;
  } else if (args["--entities"]) {
    entityFormat = EntityFormat.ENTITIES;
  }

  // print out data

  if (fileFormat === FileFormats.JSON) {
    console.log('[')
  }
  let first = true

  if (fileFormat === FileFormats.CSV) {
    console.log(['src', 'rel', 'tgt'].join(','))
  }

  for await (const triple of Sqlite.Read(DBPATH, args["--search"])) {
    if (fileFormat === FileFormats.JSONL) {
      console.log(JSON.stringify(triple))
    }

    if (fileFormat === FileFormats.JSON) {
      first
      ? console.log(JSON.stringify(triple))
      : console.log(',' + JSON.stringify(triple))
    }

    if (fileFormat === FileFormats.YAML) {
      console.log(yamlStringify([triple] as any))
    }

    if (fileFormat === FileFormats.CSV) {
      console.log([`"${triple.src}"`, `"${triple.rel}"`, `"${triple.tgt}"`].join(','))
    }

    first = false
  }

  if (fileFormat === FileFormats.JSON) {
    console.log(']')
  }
}
