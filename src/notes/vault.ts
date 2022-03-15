import { INote } from "../interfaces.ts";
import { Note } from "./note.ts";
import { join } from "https://deno.land/std@0.63.0/path/mod.ts";
import { State } from "../state.ts";
import { ITripleSource } from "../interfaces.ts";


/**
 * Represents the Axon Vault; a folder (presumed flat) containing all axon-format markdown notes.
 *
 * @export
 * @class Vault
 * @implements {ITripleSource}
 */
export class Vault implements ITripleSource {
  dpath: string;

  constructor(dpath: string) {
    this.dpath = dpath;
  }

  async init() {}

  async writeNote(fname: string, content: string) {
    const fpath = join(this.dpath, fname);
    await Deno.writeTextFile(fpath, content);
    return fpath;
  }

  /**
   * List markdown files in a vault
   *
   * @return {*}  {AsyncGenerator<INote, void, unknown>}
   * @memberof Vault
   */
  async *listNotes(): AsyncGenerator<INote, void, unknown> {
    for await (const entry of Deno.readDir(this.dpath)) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        yield new Note(this.dpath, entry.name);
      }
    }
  }


  /**
   * Read triples from each note in a vault, leaning on the state-cache to
   * provide cached values where possible.
   *
   * @param {State} state
   * @memberof Vault
   */
  async *triples(state: State) {
    for await (const note of this.listNotes()) {
      for await (const triple of state.getCtxNotes(note)) {
        yield triple;
      }
    }
  }
}
