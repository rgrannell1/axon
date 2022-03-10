import { Triple } from "../commons/model.ts";
import { Config } from "../config/config.ts";
import { IBackend, IExporter, INote, IVaultCache } from "../interfaces.ts";
import { Vault } from "../notes/vault.ts";
import { Subsumptions } from "./logic.ts";
import { FolderCache } from "../cache/folder_cache.ts";

export class Backend implements IBackend {
  dpath: string;
  subsumptions: Subsumptions;

  cfg?: Config;
  plugins: Record<string, any> = {};
  cache: IVaultCache;
  vault: Vault;

  constructor(dpath: string) {
    this.vault = new Vault(dpath);
    this.dpath = dpath;
    this.subsumptions = new Subsumptions();
    this.cache = new FolderCache("/home/rg/Code/deno-axon/.cache");
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

  async *noteTriples(note: INote) {
    await note.load();
    const hash = note.hash as string;

    // attempt to load cached triples & subsumptions
    const cachedTriples = await this.cache.storedTriples(note.fpath, hash);
    if (cachedTriples) {
      for (const triple of cachedTriples) {
        yield triple;
      }

      return;
    }

    // not cached, compute them and store
    const noteTriples = await note.triples();
    this.cache.storeTriples(note.fpath, hash, noteTriples);

    this.subsumptions.add(noteTriples);
    for (const triple of noteTriples) {
      yield triple;
    }
  }

  async *triples() {
    const vault: Vault = new Vault(this.dpath);

    for await (const note of vault.listNotes()) {
      for await (const triple of this.noteTriples(note)) {
        yield triple;
      }
    }
  }

  async init(plugins: string[]) {
    this.plugins = await this.loadPlugins(plugins);
  }

  async newFile(name: string) {
    console.log(await this.vault.newFile(name));
  }

  async search(name: string) {
    const search = this.plugins[name];

    if (!search) {
      throw new Error("No search passed to backend");
    }

    return search(this.triples());
  }

  async export(exporter: IExporter) {
    await exporter.init();
    await exporter.export(this.subsumptions, this.triples());
  }
}
