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
import { Constants, Sqlite } from "../../mod.ts";

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

  if (args["--triples"]) {
    await printTriples(fmt, args);
  } else {
    await printEntities(fmt, args);
  }
}

async function printTriples(fileFormat: any, args: { [k: string]: any }) {
  if (fileFormat === FileFormats.JSON) {
    console.log("[");
  }

  let first = true;
  const writer = new CSVWriter(Deno.stdout);

  let idx = 0;

  const pid = setInterval(() => {
    console.error('\u001Bc')
    console.error(`\raxon: exported triple #${idx}`);
  }, 200);

  for await (
    const triple of Sqlite.ReadTriples(Constants.AXON_DB, args["--topics"])
  ) {
    idx++;

    if (fileFormat === FileFormats.NQ) {
      console.log(
        [
          `</${encodeURIComponent(triple.src)}>`,
          `</${encodeURIComponent(triple.rel)}>`,
          `</${encodeURIComponent(triple.tgt)}>`,
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
      await writer.writeCell(triple.src);
      await writer.writeCell(triple.rel);
      await writer.writeCell(triple.tgt);
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
async function printEntities(fileFormat: any, args: { [k: string]: any }) {
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
    const thing of Sqlite.ReadThings(Constants.AXON_DB, args["--topics"])
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
