/*
 * Read entities & triples from a variety of input formats
 */

import { Models } from "../little-lib.ts";
import { parse as yamlParse } from "https://deno.land/std@0.82.0/encoding/yaml.ts";
import { readAll } from "https://deno.land/std/streams/conversion.ts";

const { Entity } = Models;

export async function* readJson(reader: Deno.Reader) {
}

export async function* readJsonStream(reader: Deno.Reader) {
}

export async function* readYaml(reader: Deno.Reader) {
  const content = new TextDecoder().decode(await readAll(reader));
  const result = await yamlParse(content);

  for (const val of Array.isArray(result) ? result : [result]) {
    yield Entity.from(val);
  }
}

export async function* readExecutable(fpath: string, flags: string[] = []) {
  const plugin = Deno.run({
    cmd: [fpath, "--plugin"].concat(flags),
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await plugin.status();
  const rawOutput = await plugin.output();
  const rawError = await plugin.stderrOutput();

  console.error(`axon-input: calling plugin ${fpath}\n`);

  if (code === 0) {
    const content = new TextDecoder().decode(rawOutput);
    const plugin = Entity.from(JSON.parse(content));

    yield plugin;
  } else {
    const errorString = new TextDecoder().decode(rawError);
    console.log(errorString);
  }
}
