import { Triple } from "./commons/model.ts";
import { Subsumptions } from "./core/logic.ts";
import { IVaultCache } from "./interfaces.ts";
import { NoteContext } from "./notes/context.ts";

export class Associations {
  context: NoteContext;
  triples: Triple[];

  constructor(ctx: NoteContext, triples: Triple[]) {
    this.context = ctx;
    this.triples = triples;
  }
}

export class State {
  cache: IVaultCache;
  associations: Associations[];
  subsumptions: Subsumptions

  constructor(cache: IVaultCache) {
    this.cache = cache;
    this.associations = [];
    this.subsumptions = new Subsumptions()
  }

  async *getTriples(ctx: NoteContext) {
    const cachedTriples = await this.cache.storedTriples(ctx);

    if (cachedTriples) {
      for (const triple of cachedTriples) {
        yield triple;
      }
    }
  }

  async addTriples(ctx: NoteContext, triples: Triple[]) {
    this.subsumptions.add(triples);
    await this.cache.storeTriples(ctx, triples);
  }
}
