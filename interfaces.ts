import { Triple } from "./commons/model.ts";
import { Subsumptions } from "./core/logic.ts";

// A thing that can export subsumptions and triples
export interface IExporter {
  init(): Promise<void>;
  export(subsumptions: Subsumptions, triples: Triple[]): Promise<void>;
}

// A cache that stores triples and subsumptions
export interface IVaultCache {
  cached(fpath: string, hash: string): Promise<boolean>
  triples(fpath: string, hash: string): Promise<Triple[] | undefined>
  store(fpath: string, hash: string, triples: Triple[]): Promise<void>
}

// Note context
export interface INoteContext {
  replace(name: string): string
  fpath(): string
}

// A Note
export interface INote {
  context(content: string): INoteContext
  triples(): Promise<Triple[]>;
}

export interface IConfig {
}

export interface IFrontend {
  init(): Promise<void>;
  start(): any;
}

export interface ISearch {
}

export interface IBackend {
  search(name: string): Promise<any>;
}

export interface IPlugin {
}
