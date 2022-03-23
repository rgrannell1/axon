/*
 * Read things & triples from a variety of input formats. Yield them as
 * async generators to be consumed by other functions.
 *
 */

import { parse as yamlParse } from "https://deno.land/std@0.82.0/encoding/yaml.ts";
import { readAll } from "https://deno.land/std/streams/conversion.ts";

import * as Models from "./models.ts";
import * as Sqlite from "./sqlite.ts";
import * as Constants from "./constants.ts";

export async function* readJson(reader: Deno.Reader): Models.ThingStream {
  throw new Error("not implemented");
}

export async function* readJsonStream(
  reader: Deno.Reader,
): Models.ThingStream {
  throw new Error("not implemented");
}

/**
 * Read YAML from a file, allowing a single yaml thing to be
 * returned, or an array or things.
 *
 * @export
 * @param {Deno.Reader} reader
 */
export async function* readYaml(reader: Deno.Reader): Models.ThingStream {
  const content = new TextDecoder().decode(await readAll(reader));
  const result = await yamlParse(content);

  for (const val of Array.isArray(result) ? result : [result]) {
    yield new Models.Thing(val);
  }
}

/**
 * Read things from an executable, without any specific knowledge about flags being passed in
 *
 * @export
 * @param {string} fpath the file-path supplying things
 * @param {string[]} [flags=[]]
 */
async function* readExecutable(
  fpath: string,
  flags: string[] = [],
): Models.ThingStream {
  const plugin = Deno.run({
    cmd: [fpath].concat(flags),
    stdout: "piped",
    stderr: "piped",
  });

  const [code, rawOutput, rawError] = await Promise.all([
    plugin.status(),
    plugin.output(),
    plugin.stderrOutput(),
  ]);

  const errorString = new TextDecoder().decode(rawError);
  console.log(errorString);

  console.error(`axon-readers: reading triples from plugin ${fpath}`);

  if (code.code === 0) {
    const content = new TextDecoder().decode(rawOutput);

    for (const line of content.split("\n")) {
      if (line.trim().length > 0) {
        try {
          var lineObject = JSON.parse(line);
        } catch (err) {
          console.error(
            `axon-readers: failed to parse following thing as JSON`,
          );
          console.error(line);
          throw err;
        }

        try {
          const thing = new Models.Thing(lineObject);
          yield thing;
        } catch (err) {
          console.error(`axon-readers: failed to validate following thing`);
          console.error(line);
          throw err;
        }
      }
    }
  } else {
    const errorString = new TextDecoder().decode(rawError);
    console.log(errorString);
  }
}

/**
 * Read things from an importer plugin. Check we are dealing with a plugin, retreive
 * plugin information, check if we've already cached things and can skip this process. When
 * we've retrieved plugin information, read in things and yield them asyncronously
 *
 * @export
 * @param {string} fpath the file-path supplying things
 * @param {*} args all provided cli arguments
 * @param {Models.Knowledge} knowledge knowledge-base containing information on all read things
 *
 * @return {*}  {AsyncGenerator<Models.Thing, any, any>}
 */
export async function* readPlugin(
  fpath: string,
  args: any,
  knowledge: Models.Knowledge,
): Models.ThingStream {
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
  let count = 0;
  for await (
    const thing of readExecutable(
      fpath,
      importerOpts.concat("--plugin"),
    )
  ) {
    ++count;
    knowledge.addThing(thing);
    if (knowledge.subsumptions.is(thing.id, "Axon/Plugin/Importer")) {
      plugin = thing;
    }

    if (typeof plugin === "undefined") {
      throw new Error(
        `axon-importer: expected first thing returned from plugin to a "Axon/Plugin/Importer" definition`,
      );
    }
  }

  if (count === 0) {
    throw new Error(
      `axon-importer: no things printed by executable ${fpath}`,
    );
  }

  if (typeof plugin === "undefined") {
    throw new Error(
      `axon-importer: expected first thing returned from plugin to a "Axon/Plugin/Importer" definition`,
    );
  }

  // check if the current thing is cached
  const topic = args["--topic"];
  const importCache = await Sqlite.readCache(Constants.AXON_DB);
  const cacheKey = importCache[topic];

  // yes, this import is already stored in the exporter (unless the cache is lying)
  if (cacheKey) {
    console.error(`axon-reader: results for ${topic} already up to date.`);
    return;
  }

  // not stored, invoke the importer and retreive and store results
  for await (
    const thing of readExecutable(
      fpath,
      importerOpts.concat(`--fetch`),
    )
  ) {
    knowledge.addThing(thing);
    yield thing;
  }
}

/**
 * Read anything we understand into a stream of things.
 *
 * @export
 * @param {string} fpath the file-path supplying things
 * @param {*} args all provided cli arguments
 * @param {Models.Knowledge} knowledge knowledge-base containing information on all read things
 *
 * @return {*}  {ThingStream}
 */
export async function* read(
  fpath: string,
  args: any,
  knowledge: Models.Knowledge,
): Models.ThingStream {
  try {
    var stat = await Deno.stat(fpath);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(`axon-readers: could not find ${fpath}`);
    } else {
      throw err;
    }
  }

  if (!stat.isFile) {
    throw new Error(
      `axon-readers: can only import files, ${fpath} was not a file.`,
    );
  }

  if (stat.mode && stat.mode & 0o100) {
    for await (const thing of readPlugin(fpath, args, knowledge)) {
      yield thing;
    }
  } else {
    const srcConn = await Deno.open(fpath);

    try {
      if (fpath.toLowerCase().endsWith(".yaml" || ".yml")) {
        for await (const thing of readYaml(srcConn)) {
          yield thing;
        }
      } else if (fpath.toLowerCase().endsWith(".jsonl")) {
        for await (const thing of readJsonStream(srcConn)) {
          yield thing;
        }
      } else if (fpath.toLowerCase().endsWith(".json")) {
        for await (const thing of readJson(srcConn)) {
          yield thing;
        }
      } else {
        throw new Error(
          `axon-readers: do not know how to import from ${fpath}`,
        );
      }
    } finally {
      Deno.close(srcConn.rid);
    }
  }
}
