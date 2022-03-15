import { IExporter, INote } from "../interfaces.ts";
import { FolderCache } from "../folder_cache.ts";
import { State } from "../state.ts";
import { IImporter, ITripleSource } from "../interfaces.ts";

const CACHE_PATH_MOVE_TO_CFG = "/home/rg/Code/deno-axon/.cache";

export class Plugins {
  fpaths: string[]
  scope: Record<string, any> = {}

  constructor(fpaths: string[]) {
    this.fpaths = fpaths
  }

  async init() {
    let custom = {};
    for (
      const exportList of await Promise.all(this.fpaths.map((fpath) => import(fpath)))
    ) {
      custom = { ...exportList };
    }

    this.scope = {...custom};
  }
}


export class Backend {
  plugins: Record<string, any> = {};

  state: State = new State(new FolderCache(CACHE_PATH_MOVE_TO_CFG));
  sources: ITripleSource[];
  clients: Record<string, any>;

  constructor(sources: ITripleSource[], clients: Record<string, any>, plugins: string[]) {
    this.sources = sources;
    this.clients = clients;
    this.plugins = new Plugins(plugins)
  }

  async init() {
    await this.plugins.init();

    for (const client of Object.values(this.clients)) {
      await client.init();
    }
  }

  async search(name: string) {
    const search = this.plugins.scope[name];

    if (!search) {
      throw new Error("No search passed to backend");
    }

    return search(this.state.subsumptions, () => this.triples(this.state));
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
      () => this.triples(this.state),
    );
  }

  async import(importer: IImporter) {
    await importer.init();
    await importer.sync(this.state);
  }

  // TODO REMOVE TEST CODE
  async template() {
    const pinboard = this.clients.pinboard;
    const vault = this.clients.vault;

    const content = await pinboard.template(this.state);
    await vault.writeNote('Pinboard Bookmarks.md', content);
  }
}
