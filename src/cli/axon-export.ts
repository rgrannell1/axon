#!/bin/sh
//bin/true; exec /home/rg/.deno/bin/deno run -A "$0" "$@"

export const AXON_CLI = `
Usage:
  axon export --entities [--yaml|--json|--jsonl] (--topics <str>)
  axon export --triples [--yaml|--json|--jsonl|--csv|--nq] (--topics <str>)
  axon (-h|--help)

Description:
  Perform a complete import or update from an external data-source into a Sqlite triple-store.

Targets:
  Enties or triples can be exported  to the following formats.

  * Csv files
  * Json files
  * Jsonl files
  * Yaml files

Options:
  --triples         Export in triple-format
  --entities        Export in entity-format
  --yaml            Write entities or triples as yaml
  --json            Write entities or triples as json
  --jsonl           Write entities or triples as jsonl
  --csv             Write triples as csv
  --nq              Write triples as N-Quads
  --topics <src>    A SQL search for entities to return.
`;

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import { stringify as yamlStringify } from "https://deno.land/std@0.82.0/encoding/yaml.ts";
import { CSVWriter } from "https://deno.land/x/csv/mod.ts";

import { fileFormat } from "../utils.ts";
import { Constants, Readers, Models, Sqlite } from "../../mod.ts";

const { FileFormats } = Constants;

/**
 * Import entities into a data-sink
 *
 * @export
 * @param {string[]} argv
 */
export async function main(argv: string[]) {
  const args = docopt(AXON_CLI, { argv, allowExtra: true });

  let fmt = fileFormat(args);

  const knowledge = new Models.Knowledge();

  for (const fpath of ['/home/rg/Drive/Obsidian/axon-ontology.yaml']) {
    for await (const thing of Readers.read(fpath, {'--yaml': true}, knowledge)) {

      for (const triple of thing.triples()) {
        for await (const _ of knowledge.addTriple(triple)) {};
      }
    }
  }

  if (args["--triples"]) {
    await printTriples(fmt, knowledge, args);
  } else {
    await printEntities(fmt, knowledge, args);
  }
}

async function printTriples(fileFormat: any, knowledge: Models.Knowledge, args: { [k: string]: any }) {
  if (fileFormat === FileFormats.JSON) {
    console.log("[");
  }

  let first = true;
  const writer = new CSVWriter(Deno.stdout);

  let idx = 0;

  const pid = setInterval(() => {
    console.error("\u001Bc");
    console.error(`\raxon: exported triple #${idx}`);
  }, 200);

  const escapeCsvCell = (content: string) => {
    return content.replace(/\n/g, "\\n");
  };

  for await (
    const triple of Sqlite.ReadTriples(Constants.AXON_DB, knowledge, args["--topics"])
  ) {
    idx++;

    if (fileFormat === FileFormats.NQ) {
      console.log(
        [
          JSON.stringify(triple.src),
          JSON.stringify(triple.rel),
          JSON.stringify(triple.tgt),
          ".",
        ].join(" "),
      );
    }

    if (fileFormat === FileFormats.JSONL) {
      console.log(JSON.stringify(triple));
    }

    if (fileFormat === FileFormats.JSON) {
      first
        ? console.log(JSON.stringify(triple))
        : console.log("," + JSON.stringify(triple));
    }

    if (fileFormat === FileFormats.YAML) {
      console.log(yamlStringify([triple] as any));
    }

    if (fileFormat === FileFormats.CSV) {
      await writer.writeCell(escapeCsvCell(triple.src), { forceQuotes: true });
      await writer.writeCell(escapeCsvCell(triple.rel), { forceQuotes: true });
      await writer.writeCell(escapeCsvCell(triple.tgt), { forceQuotes: true });
      await writer.nextLine();
    }

    first = false;
  }

  clearInterval(pid);

  if (fileFormat === FileFormats.JSON) {
    console.log("]");
  }
}

/*
 * Print entities
 */
async function printEntities(fileFormat: any, knowledge: Models.Knowledge, args: { [k: string]: any }) {
  if (fileFormat === FileFormats.JSON) {
    console.log("[");
  }
  let first = true;

  if (fileFormat === FileFormats.CSV) {
    throw new Error(
      `axon-export: Cannot export things in csv format; try exporting with --triples instead`,
    );
  }

  for await (
    const thing of Sqlite.ReadThings(Constants.AXON_DB, knowledge, args["--topics"])
  ) {
    if (fileFormat === FileFormats.JSONL) {
      console.log(JSON.stringify(thing.data));
    }

    if (fileFormat === FileFormats.JSON) {
      first
        ? console.log(JSON.stringify(thing.data))
        : console.log("," + JSON.stringify(thing.data));
    }

    if (fileFormat === FileFormats.YAML) {
      console.log(yamlStringify([thing.data] as any));
    }

    first = false;
  }

  if (fileFormat === FileFormats.JSON) {
    console.log("]");
  }
}
