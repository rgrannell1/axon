import { Triple } from "../commons/model.ts";
import { Subsumptions } from "../core/logic.ts";
import { Search } from "./types.ts";

/*
 * Combine multiple combinators together
 */
export const Not = (search: Search) => {
  return (subsumptions: Subsumptions, triple: Triple) => {
    return !search(subsumptions, triple);
  };
};

export const All = (...searches: Search[]) => {
  return (subsumptions: Subsumptions, triple: Triple) => {
    return searches.every((search) => search(subsumptions, triple));
  };
};

export const Some = (...searches: Search[]) => {
  return (subsumptions: Subsumptions, triple: Triple) => {
    return searches.some((search) => search(subsumptions, triple));
  };
};
