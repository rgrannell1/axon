import { IBackend, IExporter, INote } from "../interfaces.ts";
import { FolderCache } from "../cache/folder_cache.ts";
import { State } from "../state.ts";
import { IImporter, ITripleSource } from "../interfaces.ts";

const CACHE_PATH_MOVE_TO_CFG = "/home/rg/Code/deno-axon/.cache";

// remove
export class Backend implements IBackend {
  plugins: Record<string, any> = {};

  state: State = new State(new FolderCache(CACHE_PATH_MOVE_TO_CFG));
  sources: ITripleSource[];
  clients: Record<string, any>;

  constructor(sources: ITripleSource[], clients: Record<string, any>) {
    this.sources = sources;
    this.clients = clients;
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

  async init(plugins: string[]) {
    this.plugins = await this.loadPlugins(plugins);

    for (const client of Object.values(this.clients)) {
      await client.init();
    }
  }

  async search(name: string) {
    const search = this.plugins[name];

    if (!search) {
      throw new Error("No search passed to backend");
    }

    return search(this.state.subsumptions, this.triples(this.state));
  }

  async *triples(state: State) {
    for (const source of this.sources) {
      for await (const triple of source.triples(state)) {
        yield triple;
      }
    }
  }

  async export(exporter: IExporter) {
    await exporter.init();
    await exporter.export(
      this.state.subsumptions,
      this.triples(this.state),
    );
  }

  async import(importer: IImporter) {
    await importer.init();
    await importer.sync(this.state);
  }

  async template() {
    const pinboard = this.clients.pinboard;
    const vault = this.clients.vault;

    const content = await pinboard.template(this.state);
    await vault.writeNote(content);
  }
}
