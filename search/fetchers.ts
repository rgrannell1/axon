import { Search, TripleStream } from "./types.ts";

/*
 * Decide if a subpart of a triple should be returned.
 */
export const All = (search: Search) => {
  return function* ($: TripleStream) {
    for (const triple of $) {
      if (search(triple)) {
        yield triple;
      }
    }
  };
};

export const Take = (search: Search, limit: number) => {
  return function* ($: TripleStream) {
    let yielded = 0;

    for (const triple of $) {
      if (search(triple)) {
        if (yielded < limit) {
          yield triple;
          yielded++;
        }
      }
    }
  };
};
