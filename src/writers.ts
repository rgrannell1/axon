/*
 * Read things & triples from a variety of input formats. Yield them as
 * async generators to be consumed by other functions.
 *
 */

import { Models } from "../mod.ts";
import { stringify as yamlStringify } from "https://deno.land/std@0.82.0/encoding/yaml.ts";

type Writer = (things: Models.ThingStream) => Promise<void>

export async function writeYaml(
  things: Models.ThingStream,
  writer: Deno.Writer,
) {
  for await (const thing of things) {
    const encodedThing = yamlStringify([thing] as any);
    const encoded = new TextEncoder().encode(`\n${encodedThing}`);

    await writer.write(encoded)
  }
}

export async function writeJsonl(
  things: Models.ThingStream,
  writer: Deno.Writer,
) {
  for await (const thing of things) {
    const encodedThing = JSON.stringify(thing as any);
    const encoded = new TextEncoder().encode(`\n${encodedThing}`);

    await writer.write(encoded)
  }
}

/**
 * Write a stream of things to an interface.
 *
 * @export
 * @param {string} fpath the file-path supplying things
 * @param {*} args all provided cli arguments
 * @param {Models.Knowledge} knowledge knowledge-base containing information on all read things
 *
 * @return {*}  {ThingStream}
 */
export async function write(
  fpath: string,
  things: Models.ThingStream
) {
  const conn = await Deno.open(fpath, {
    create: true,
    write: true
  });

  if (fpath.toLowerCase().endsWith(".yaml" || ".yml")) {
    await writeYaml(things, conn)
  } else if (fpath.toLowerCase().endsWith(".jsonl")) {
    await writeJsonl(things, conn)
  }  else {
    throw new Error(`not sure how to write ${fpath}`)
  }
}
