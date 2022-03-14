import { Triple } from "./commons/model.ts";
import { Subsumptions } from "./core/logic.ts";
import { NoteContext } from "./notes/context.ts";
import { State } from "./state.ts";

/*
 * Gives a context id (like filename_filehash) that can be associated with
 * a set of triples. Used to cache triples
 */
export interface IIdentifiable {
  id(): string;
}

// Reads in triples from some third-party source.
export interface IImporter {
  init(): Promise<void>;
  sync(state: State): Promise<void>;
  id(): string;
}

// A thing that can export subsumptions and triples
export interface IExporter {
  init(): Promise<void>;
  export(
    subsumptions: Subsumptions,
    triples: AsyncGenerator<Triple, void, any>,
  ): Promise<void>;
}

// A cache that stores triples and subsumptions
export interface IVaultCache {
  cached(id: string): Promise<boolean>;
  storedTriples(id: string): AsyncGenerator<Triple, void, any>;
  storeTriples(id: string, triples: Triple[]): Promise<void>;
}

export interface INoteSource {
  init(): Promise<void>;
  id(): string;
  triples(state: State): AsyncGenerator<Triple, any, unknown>;
}

// A Note
export interface INote {
  fpath: string;
  hash?: string;

  init(): Promise<void>;
  id(): string;
  context(): NoteContext;
  triples(): AsyncGenerator<Triple, any, unknown>;
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

export interface ITripleSource {
  triples(state: State): AsyncGenerator<Triple, void, any>;
}

export interface ITemplate {
  template(): string;
}
