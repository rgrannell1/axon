import { Triple } from "../commons/model.ts";

abstract class Search {
  abstract search(triples: Triple[]): IterableIterator<any>;
}

export class Plugin {
  included: Record<string, Search>;

  constructor() {
    this.included = {};
  }

  includes(name: string, thing: Search) {
    this.included[name] = thing;
  }
}
