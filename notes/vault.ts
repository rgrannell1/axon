import { Note } from "./note.ts";

export class Vault {
  dpath: string;
  constructor(dpath: string) {
    this.dpath = dpath;
  }

  async *listNotes() {
    for await (const entry of Deno.readDir(this.dpath)) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        yield new Note(this.dpath, entry.name);
      }
    }
  }
}
