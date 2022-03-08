import { Triple } from "../commons/model.ts";
import { Vault } from "../notes/vault.ts";

export class Backend {
  _triples: Triple[] = [];
  dpath: string;

  constructor(dpath: string) {
    this.dpath = dpath;
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

  async triples() {
    if (this._triples.length > 0) {
      return this._triples;
    }

    const vault = new Vault(this.dpath);
    const triples: Triple[] = [];

    for await (const note of vault.listNotes()) {
      triples.push(...await note.parse());
    }

    this._triples = triples;
    return this._triples;
  }

  async search(search: any) {
    return search(await this.triples());
  }
}
