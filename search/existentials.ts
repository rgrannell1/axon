import { Search, TripleStream } from "./types.ts";
import * as Fetchers from "./fetchers.ts";
import * as Composers from "./composers.ts";

/*
 * Determine whether all or at least one triple matches a pattern
 */
export const Forall = (search: Search) => {
  return ($: TripleStream) => {
    for (const _ of Fetchers.All(Composers.Not(search))($)) {
      return false;
    }

    return true;
  };
};
export const Some = (search: Search) => {
  return ($: TripleStream) => {
    for (const _ of Fetchers.All(search)($)) {
      return true;
    }

    return false;
  };
};

export const Count = (search: Search) => {
  return ($: TripleStream) => {
    let count = 0;
    for (const _ of Fetchers.All(search)($)) {
      count++;
    }

    return count;
  };
};
