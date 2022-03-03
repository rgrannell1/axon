import { join } from "https://deno.land/std@0.127.0/path/mod.ts";
import { AxonNoteParser } from "./parser.ts";

export class NoteContext {
  substitutions: Record<string, string>;
  constructor(substitutions: Record<string, string>) {
    this.substitutions = substitutions;
  }
  replace(name: string): string {
    for (const [candidate, replacement] of Object.entries(this.substitutions)) {
      if (name === candidate) {
        return replacement;
      }
    }

    return name;
  }
}

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
    const ctx = new NoteContext({
      $filename: this.fpath,
    });

    return AxonNoteParser.parse(ctx, content);
  }
}
