/*
 * Read entities & triples from a variety of input formats. Yield them as
 * async generators to be consumed by other functions.
 *
 */

import { Models } from "../mod.ts";
import { parse as yamlParse } from "https://deno.land/std@0.82.0/encoding/yaml.ts";
import { readAll } from "https://deno.land/std/streams/conversion.ts";

import * as Sqlite from "./sqlite.ts";
import * as Constants from './constants.ts';

export async function* readJson(reader: Deno.Reader): Models.EntityStream {
  throw new Error('not implemented');
}

export async function* readJsonStream(reader: Deno.Reader): Models.EntityStream {
  throw new Error('not implemented');
}

/**
 * Read YAML from a file, allowing a single yaml entity to be
 * returned, or an array or entities.
 *
 * @export
 * @param {Deno.Reader} reader
 */
export async function* readYaml(reader: Deno.Reader): Models.EntityStream {
  const content = new TextDecoder().decode(await readAll(reader));
  const result = await yamlParse(content);

  for (const val of Array.isArray(result) ? result : [result]) {
    yield Models.Thing(val);
  }
}

/**
 * Read entities from an executable, without any specific knowledge about flags being passed in
 *
 * @export
 * @param {string} fpath the file-path supplying entities
 * @param {string[]} [flags=[]]
 */
async function* readExecutable(fpath: string, flags: string[] = []): Models.EntityStream {
  const plugin = Deno.run({
    cmd: [fpath].concat(flags),
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await plugin.status();
  const rawOutput = await plugin.output();
  const rawError = await plugin.stderrOutput();

  console.error(`axon-inport: calling plugin ${fpath}\n`);

  if (code === 0) {
    const content = new TextDecoder().decode(rawOutput);

    for (const line of content.split('\n')) {
      if (line.trim().length > 0) {
        try {
          const thing = Models.Thing(JSON.parse(line));
          yield thing;
        } catch (err) {
          console.error(`axon-import: failed to parse following entity`)
          console.error(line)
          throw err
        }
      }
    }
  } else {
    const errorString = new TextDecoder().decode(rawError);
    console.log(errorString);
  }
}

/**
 * Read entities from an importer plugin. Check we are dealing with a plugin, retreive
 * plugin information, check if we've already cached things and can skip this process. When
 * we've retrieved plugin information, read in entities and yield them asyncronously
 *
 * @export
 * @param {string} fpath the file-path supplying entities
 * @param {*} args all provided cli arguments
 * @param {Models.Knowledge} knowledge knowledge-base containing information on all read entities
 *
 * @return {*}  {AsyncGenerator<Models.Entity, any, any>}
 */
export async function* readPlugin(fpath: string, args: any, knowledge: Models.Knowledge): Models.EntityStream {
  let plugin = undefined;

  const importerOpts: string[] = [];
  for (const arg of args["<suboptions>"]) {
    if (arg.startsWith("importer.")) {
      const [name, val] = arg.split("=");
      const flag = `--${name.replace(/^importer\./, "")}`;

      importerOpts.push(flag, val);
    }
  }

  // call the plugin script and see if we get an importer plugin in response
  for await (
    const entity of readExecutable(
      fpath,
      importerOpts.concat("--plugin"),
    )
  ) {
    knowledge.addEntity(entity);
    if (knowledge.subsumptions.is(entity.id, "Axon/Plugin/Importer")) {
      plugin = entity;
    }

    if (typeof plugin === "undefined") {
      throw new Error(
        `axon-importer: expected first entity returned from plugin to a "Axon/Plugin/Importer" definition`,
      );
    }
  }

  if (typeof plugin === "undefined") {
    throw new Error(
      `axon-importer: expected first entity returned from plugin to a "Axon/Plugin/Importer" definition`,
    );
  }

  // check if the current thing is cached
  const importCache = await Sqlite.readCache(Constants.AXON_DB);
  const pluginCache = importCache[plugin.id];

  const cacheKey = (plugin as any).cache_key[0]; //fix

  // yes, this import is already stored in the exporter (unless the cache is lying)
  if (pluginCache && pluginCache.hasOwnProperty(cacheKey)) {
    console.log("already present!");
    return;
  }

  // not stored, invoke the importer and retreive and store results
  for await (
    const entity of readExecutable(
      fpath,
      importerOpts.concat(`--fetch`),
    )
  ) {
    knowledge.addEntity(entity);
    yield entity
  }
}


/**
 * Read anything we understand into a stream of entities.
 *
 * @export
 * @param {string} fpath the file-path supplying entities
 * @param {*} args all provided cli arguments
 * @param {Models.Knowledge} knowledge knowledge-base containing information on all read entities
 *
 * @return {*}  {EntityStream}
 */
export async function* read (fpath: string, args: any, knowledge: Models.Knowledge): Models.EntityStream {
  try {
    var stat = await Deno.stat(fpath);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(`axon-import: could not find ${fpath}`);
    } else {
      throw err;
    }
  }

  if (!stat.isFile) {
    throw new Error(`axon-import: can only import files, ${fpath} was not a file.`);
  }

  if (stat.mode && stat.mode & 0o100) {
    for await (const entity of readPlugin(fpath, args, knowledge)) {
      yield entity
    }
  } else {
    const srcConn = await Deno.open(fpath);

    try {
      if (fpath.toLowerCase().endsWith(".yaml" || ".yml")) {
        for await (const entity of readYaml(srcConn)) {
          yield entity
        }
      } else if (fpath.toLowerCase().endsWith(".jsonl")) {
        for await (const entity of readJsonStream(srcConn)) {
          yield entity
        }
      } else if (fpath.toLowerCase().endsWith(".json")) {
        for await (const entity of readJson(srcConn)) {
          yield entity
        }
      } else {
        throw new Error(`axon-import: do not know how to import from ${fpath}`);
      }
    } finally {
      Deno.close(srcConn.rid);
    }
  }
}
