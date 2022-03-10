import { Triple } from "./commons/model.ts";
import { Subsumptions } from "./core/logic.ts";
import { NoteContext } from "./notes/context.ts";

export interface IImportState {
}

// Reads in triples from some third-party source.
export interface IImporter {
  init(): Promise<void>;
  sync(): Promise<void>;
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
  cached(ctx: NoteContext): Promise<boolean>;
  storedTriples(ctx: NoteContext): Promise<Triple[] | undefined>;
  storeTriples(ctx: NoteContext, triples: Triple[]): Promise<void>;
}

// A Note
export interface INote {
  fpath: string;
  hash?: string;

  load(): Promise<void>;
  context(): NoteContext;
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
