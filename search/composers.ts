import { Triple } from "../commons/model.ts";
import { Search } from "./types.ts";

/*
 * Combine multiple combinators together
 */
export const Not = (search: Search) => {
  return (triple: Triple) => {
    return !search(triple);
  };
};

export const All = (...searches: Search[]) => {
  return (triple: Triple) => {
    return searches.every((search) => search(triple));
  };
};

export const Some = (...searches: Search[]) => {
  return (triple: Triple) => {
    return searches.some((search) => search(triple));
  };
};
