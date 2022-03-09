import { Triple } from "../commons/model.ts";
import { Config } from "../config/config.ts";
import { IBackend, IExporter, IVaultCache } from "../interfaces.ts";
import { Vault } from "../notes/vault.ts";
import { Subsumptions } from "./logic.ts";
import { FolderCache } from "../cache/folder_cache.ts";

export class Backend implements IBackend {
  _triples: Triple[] = [];
  dpath: string;
  subsumptions: Subsumptions;

  cfg?: Config;
  plugins: Record<string, any> = {};
  cache: IVaultCache

  constructor(dpath: string) {
    this.dpath = dpath;
    this.subsumptions = new Subsumptions();
    this.cache = new FolderCache('/home/rg/Code/deno-axon/.cache');
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
    const vault: Vault = new Vault(this.dpath);
    const triples: Triple[] = [];

    for await (const note of vault.listNotes()) {
      await note.load()
      if (typeof note.hash === 'undefined') {
        throw new TypeError('hash undefined')
      }

      // attempt to load cached triples & subsumptions
      const cachedTriples = await this.cache.storedTriples(note.fpath, note.hash)
      if (cachedTriples) {
        triples.push(...cachedTriples);
        continue
      }

      // not cached, compute them and store
      const batch = await note.triples();
      this.cache.storeTriples(note.fpath, note.hash, batch)

      this.subsumptions.add(batch);
      triples.push(...batch);
    }

    return triples;
  }

  async init(plugins: string[]) {
    this.plugins = await this.loadPlugins(plugins);
  }

  async triples() {
    if (this._triples.length > 0) {
      return this._triples;
    }

    this._triples = await this.readTriples();
    return this._triples;
  }

  async search(name: string) {
    const search = this.plugins[name];

    if (!search) {
      throw new Error("No search passed to backend");
    }

    return search(await this.triples());
  }

  async export(exporter: IExporter) {
    const triples = await this.triples();
    await exporter.init();
    await exporter.export(this.subsumptions, triples);
  }
}
