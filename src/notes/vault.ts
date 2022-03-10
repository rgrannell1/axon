import { INote } from "../interfaces.ts";
import { Note } from "./note.ts";
import { join } from "https://deno.land/std@0.63.0/path/mod.ts";

export class Vault {
  dpath: string;

  constructor(dpath: string) {
    this.dpath = dpath;
  }

  getPrefix() {
    let date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const ms = date.getMilliseconds().toString().padStart(4, "0");

    return `${year}${month}${day}${ms} - `;
  }

  async newFile(name: string) {
    const fpath = join(this.dpath, `${this.getPrefix()}${name}.md`);
    await Deno.writeTextFile(
      fpath,
      [
        "---",
        "- id: $filepath",
        `  describes: "${name}"`,
        "",
        `- id: "${name}"`,
        "---",
        "",
        `# ${name}`,
      ].join("\n"),
    );
    return fpath;
  }

  async *listNotes(): AsyncGenerator<INote, void, unknown> {
    for await (const entry of Deno.readDir(this.dpath)) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        yield new Note(this.dpath, entry.name);
      }
    }
  }
}
