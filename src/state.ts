import { Triple } from "./commons/model.ts";
import { Subsumptions } from "./core/logic.ts";
import { INoteSource, IVaultCache } from "./interfaces.ts";

/*
 * Stored application-state.
 *
 */
export class State {
  cache: IVaultCache;
  subsumptions: Subsumptions;

  constructor(cache: IVaultCache) {
    this.cache = cache;
    this.subsumptions = new Subsumptions();
  }

  async hasTriples(id: string) {
    return await this.cache.cached(id);
  }

  async *getTriples(id: string) {
    if (await this.cache.cached(id)) {
      for await (const triple of this.cache.storedTriples(id)) {
        this.subsumptions.add([triple]);
        yield triple;
      }
    }
  }

  async addTriples(id: string, triples: Triple[]) {
    this.subsumptions.add(triples);
    await this.cache.storeTriples(id, triples);
  }

  async *getCtxNotes(src: INoteSource) {
    await src.init();
    const id = src.id();

    let isCached = false;

    for await (const triple of this.getTriples(id)) {
      isCached = true;
      yield triple;
    }

    if (isCached) {
      return;
    }

    let triplesArray: Triple[] = [];

    for await (const triple of src.triples(this)) {
      triplesArray.push(triple);
    }
    this.subsumptions.add(triplesArray);

    await this.addTriples(id, triplesArray);

    for (const triple of triplesArray) {
      yield triple;
    }
  }
}
