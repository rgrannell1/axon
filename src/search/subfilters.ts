import { Triple } from "../commons/model.ts";
import { SubSearch } from "./types.ts";

/*
 * Decide if a subpart of a triple should be returned.
 */
export const Rel = (search: SubSearch) => {
  return (triple: Triple) => {
    return search(triple.relname);
  };
};

export const Src = (search: SubSearch) => {
  return (triple: Triple) => {
    return search(triple.src);
  };
};

export const Tgt = (search: SubSearch) => {
  return (triple: Triple) => {
    return search(triple.tgt);
  };
};
