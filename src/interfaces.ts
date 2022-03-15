import { Triple } from "./commons/model.ts";
import { Subsumptions } from "./core/logic.ts";
import { NoteContext } from "./notes/context.ts";
import { State } from "./state.ts";

export type Search = (subsumptions: Subsumptions, triple: Triple) => boolean;
export type SubSearch = (part: string) => boolean;
export type TripleStream = AsyncGenerator<Triple, any, unknown>;

export interface IContext {
  replace(name: string): string
}

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
    triples: () => TripleStream,
  ): Promise<void>;
}

// A cache that stores triples and subsumptions
export interface ICache {
  cached(id: string): Promise<boolean>;
  storedTriples(id: string): TripleStream;
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
  triples(state: State): TripleStream;
}

export interface ITemplate {
  template(): string;
}
