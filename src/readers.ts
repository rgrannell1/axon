/*
 * Read things & triples from a variety of input formats. Yield them as
 * async generators to be consumed by other functions.
 *
 */

import { parse as yamlParse } from "https://deno.land/std@0.82.0/encoding/yaml.ts";
import { readAll } from "https://deno.land/std/streams/conversion.ts";
import { readLines } from "https://deno.land/std/io/bufio.ts";

import { fileFormat } from "./utils.ts";
import * as Models from "./models.ts";
import * as Sqlite from "./sqlite.ts";
import * as Constants from "./constants.ts";

export async function* readJson(reader: Deno.Reader): Models.ThingStream {
  throw new Error("not implemented");
}

export async function* readJsonStream(
  reader: Deno.Reader,
): Models.ThingStream {
  for await (const line of readLines(reader)) {
    try {
      var parsed = JSON.parse(line);
    } catch (err) {
      throw new Error(`axon-reader: failed to parse following line\n${line}`);
    }
    yield new Models.Thing(parsed);
  }
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
 * @param {string[]}
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

  console.error(`axon-readers: reading triples from plugin ${fpath}`);

  let count = 0;
  const enc = (str: string) => new TextEncoder().encode(str);

  const pid = setInterval(async () => {
    await Deno.stdout.write(enc(`read entity #${count}\r`));
  }, 100);

  for await (const line of readLines(plugin.stdout)) {
    try {
      var lineObject = JSON.parse(line);
    } catch (err) {
      console.error(
        `axon-readers: failed to parse following thing as JSON`,
      );
      console.error(line);
      throw err;
    }

    if (line.trim().length > 0) {
      try {
        const thing = new Models.Thing(lineObject);
        yield thing;
      } catch (err) {
        clearInterval(pid);
        console.error(`axon-readers: failed to validate following thing`);
        console.error(line);
        throw err;
      }
    }

    count++;
  }
  console.log("");

  const code = await plugin.status();
  const rawErr = await plugin.stderrOutput();

  clearInterval(pid);

  if (code.code !== 0) {
    const errorString = new TextDecoder().decode(rawErr);
    console.error(errorString);
    throw new Error(`axon-reader: plugin exited with status ${code.code}`);
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

  const [pluginKey] = plugin.get("cache_key")[0];

  // yes, this import is already stored in the exporter (unless the cache is lying)
  if (cacheKey === pluginKey && !args["--force"]) {
    console.error(`axon-reader: results for ${topic} already up to date.`);
    return;
  }

  const state = await Sqlite.readState(Constants.AXON_DB, topic);
  const opts = importerOpts.concat(`--fetch`);

  opts.push(state ? state : "{}");

  // not stored, invoke the importer and retreive and store results
  for await (
    const thing of readExecutable(fpath, opts)
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
  if (typeof fpath !== "string") {
    console.error(`read: invalid --from argument provided`);
    Deno.exit(1);
  }

  try {
    var stat = await Deno.stat(fpath);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(`axon-readers: could not find ${fpath}`);
    } else {
      throw err;
    }
  }

  if (!stat.isFile && fpath !== "/dev/stdin") {
    throw new Error(
      `axon-readers: can only import files, ${fpath} was not a file.`,
    );
  }

  const fmt = fileFormat(args, fpath);

  if (stat.mode && stat.mode & 0o100) {
    for await (const thing of readPlugin(fpath, args, knowledge)) {
      yield thing;
    }
  } else {
    const srcConn = await Deno.open(fpath);

    try {
      if (fmt === Constants.FileFormats.YAML) {
        for await (const thing of readYaml(srcConn)) {
          yield thing;
        }
      } else if (fmt === Constants.FileFormats.JSONL) {
        for await (const thing of readJsonStream(srcConn)) {
          yield thing;
        }
      } else if (fmt === Constants.FileFormats.JSON) {
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
