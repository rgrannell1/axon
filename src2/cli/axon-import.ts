export const AXON_CLI = `
Usage:
  axon import [options] [<args>...]
  axon (-h|--help)

Commands:
  import             Import triples from an external resource or script.

Sources:
  Information sources include:

  * Executable scripts that respond to the flags '--plugin' (returning basic plugin information) and '--fetch'
  * JSON files in triple or instance format
  * JSONL files in triple instance format

Target:


Options:
  --from <src>       A data-source
  --to <tgt>         A store
`;

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import * as Readers from "../readers.ts";

import { Models } from "../../little-lib.ts";
const { Entity, Knowledge } = Models;

// -- normally in constants ig?
const schemaPaths = [
  "/home/rg/Code/deno-axon/axon.yaml",
  "/home/rg/Code/deno-axon/src2/plugins/pinboard.yaml",
];

export async function main(argv: string[]) {
  const args = docopt(AXON_CLI, { argv });
  const from = args["--from"];

  const knowledge = new Knowledge();

  for (const fpath of schemaPaths) {
    const conn = await Deno.open(fpath);
    for await (const entity of Readers.readYaml(conn)) {
      knowledge.addEntity(entity);
    }

    Deno.close(conn.rid);
  }

  try {
    var stat = await Deno.stat(from);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      console.error(`axon-import: could not find ${from}`);
    } else {
      console.error(err);
    }
    Deno.exit(1);
  }

  if (!stat.isFile) {
    console.error(
      `axon-import: can only import files, ${from} was not a file.`,
    );
    Deno.exit(1);
  }

  if (stat.mode && stat.mode & 0o100) {
    let plugin = undefined;

    for await (const entity of Readers.readExecutable(from)) {
      knowledge.addEntity(entity);
      const AxonPluginImporter = knowledge.concept("PluginImporterSchema");

      if (knowledge.subsumptions.is(entity.id, "Axon/Plugin/Importer")) {
        plugin = AxonPluginImporter.fromEntity(entity);
      }

      if (typeof plugin === "undefined") {
        throw new Error(
          `axon-importer: expected first entity returned from plugin to a "Axon/Plugin/Importer" definition`,
        );
      }

      // an importer plugin was retrieved; check if we have things cached, if not pull in stuff into some store
      console.log(plugin)

    }
  } else {
    const conn = await Deno.open(from);

    if (from.toLowerCase().endsWith(".yaml" || ".yml")) {
      await Readers.readYaml(conn);
    } else if (from.toLowerCase().endsWith(".jsonl")) {
      await Readers.readJsonStream(conn);
    } else if (from.toLowerCase().endsWith(".json")) {
      await Readers.readJson(conn);
    }
  }
}
