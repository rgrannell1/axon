import { INote } from "../interfaces.ts";
import { Note } from "./note.ts";
import { join } from "https://deno.land/std@0.63.0/path/mod.ts";
import { State } from "../state.ts";
import { ITripleSource } from "../interfaces.ts";
import { Triple } from "../commons/model.ts";

export class Vault implements ITripleSource {
  dpath: string;

  constructor(dpath: string) {
    this.dpath = dpath;
  }

  async init() {}

  async writeNote(fname: string, content: string) {
    const fpath = join(this.dpath, fname);
    await Deno.writeTextFile(
      fpath,
      content,
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

  async *triples(state: State) {
    for await (const note of this.listNotes()) {
      for await (const triple of state.getCtxNotes(note)) {
        yield triple;
      }
    }
  }

  async *processTriples(state: State, note: INote) {
    await note.init();
    const ctx = note.context();

    let isCached = false;

    for await (const triple of state.getTriples(ctx.id())) {
      isCached = true;
      yield triple;
    }

    if (isCached) {
      return;
    }

    const triples: Triple[] = [];

    for await (const triple of await note.triples()) {
      triples.push(triple);
    }

    await state.addTriples(ctx.id(), triples);

    for (const triple of triples) {
      yield triple;
    }
  }
}
