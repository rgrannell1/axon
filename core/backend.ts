import { Triple } from "../commons/model.ts";
import { Config } from "../config/config.ts";
import { Vault } from "../notes/vault.ts";
import { IExporter } from "./exporter.ts";
import { Subsumptions } from "./logic.ts";

export class Backend {
  _triples: Triple[] = [];
  dpath: string;
  subsumptions: Subsumptions;

  cfg?: Config;
  plugins: Record<string, any> = {};

  constructor(dpath: string) {
    this.dpath = dpath;
    this.subsumptions = new Subsumptions();
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
      const batch = await note.parse();

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
