import { join } from "https://deno.land/std@0.127.0/path/mod.ts";
import { AxonParser } from "../axon-lang/parser.ts";

export class Note {
  name: string;
  dpath: string;
  fpath: string;

  constructor(dpath: string, name: string) {
    this.dpath = dpath;
    this.name = name;
    this.fpath = join(dpath, name);
  }

  async read() {
    return Deno.readTextFile(this.fpath);
  }

  async parse() {
    const content = await this.read();

    return AxonParser.parse(content);
  }
}
