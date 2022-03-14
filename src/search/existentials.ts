import { Search, TripleStream } from "./types.ts";
import * as Fetchers from "./fetchers.ts";
import * as Composers from "./composers.ts";
import { Subsumptions } from "../core/logic.ts";

/*
 * Determine whether all or at least one triple matches a pattern
 */
export const Forall = (search: Search) => {
  return async (subsumptions: Subsumptions, $: TripleStream) => {
    for await (
      const _ of Fetchers.All(Composers.Not(search))(subsumptions, $)
    ) {
      return false;
    }

    return true;
  };
};
export const Some = (search: Search) => {
  return async (subsumptions: Subsumptions, $: TripleStream) => {
    for await (const _ of Fetchers.All(search)(subsumptions, $)) {
      return true;
    }

    return false;
  };
};

export const Count = (search: Search) => {
  return async (subsumptions: Subsumptions, $: TripleStream) => {
    let count = 0;
    for await (const _ of Fetchers.All(search)(subsumptions, $)) {
      count++;
    }

    return count;
  };
};
