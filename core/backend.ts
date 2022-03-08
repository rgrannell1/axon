import { Triple } from "../commons/model.ts";
import { Vault } from "../notes/vault.ts";
import { Subsumptions } from "./logic.ts";

export class Backend {
  _triples: Triple[] = [];
  dpath: string;
  subsumptions: Subsumptions

  constructor(dpath: string) {
    this.dpath = dpath;
    this.subsumptions = new Subsumptions()
  }

  async loadPlugins(fpaths: string[]): Promise<Record<string, any>> {
    let custom = {};
    for (
      const exports of await Promise.all(fpaths.map((fpath) => import(fpath)))
    ) {
      custom = { ...exports };
    }

    return custom;
  }

  async readTriples() {
    const vault = new Vault(this.dpath);
    const triples: Triple[] = [];

    for await (const note of vault.listNotes()) {
      const batch = await note.parse()

      this.subsumptions.add(batch)

      triples.push(...batch);
    }

    return triples;
  }

  async triples() {
    if (this._triples.length > 0) {
      return this._triples;
    }

    this._triples = await this.readTriples();
    return this._triples;
  }

  async search(search: any) {
    return search(await this.triples());
  }
}
