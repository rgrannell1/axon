
import { IBackend, IExporter, INote } from "../interfaces.ts";
import { Vault } from "../notes/vault.ts";
import { FolderCache } from "../cache/folder_cache.ts";
import { State } from "../state.ts";

export class Backend implements IBackend {
  dpath: string;

  state: State = new State(new FolderCache('/home/rg/Code/deno-axon/.cache'));
  plugins: Record<string, any> = {};
  vault: Vault;

  constructor(dpath: string) {
    this.dpath = dpath;
    this.vault = new Vault(dpath);
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

  async *processTriples(note: INote) {
    await note.load();
    const ctx = note.context()

    let isCached = false;

    for await (const triple of this.state.getTriples(ctx)) {
      isCached = true;
      yield triple
    }

    if (isCached) {
      return
    }

    const triples = await note.triples();
    await this.state.addTriples(ctx, triples)

    for (const triple of triples) {
      yield triple;
    }
  }

  async *triples() {
    const vault: Vault = new Vault(this.dpath);

    for await (const note of vault.listNotes()) {
      for await (const triple of this.processTriples(note)) {
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
    await exporter.export(this.state.subsumptions, this.triples());
  }
}
