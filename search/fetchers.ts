import { Search, TripleStream } from "./types.ts";

/*
 * Decide if a subpart of a triple should be returned.
 */
export const All = (search: Search) => {
  return async function* ($: TripleStream) {
    for await (const triple of $) {
      if (search(triple)) {
        yield triple;
      }
    }
  };
};

export const Take = (search: Search, limit: number) => {
  return async function* ($: TripleStream) {
    let yielded = 0;

    for await (const triple of $) {
      if (search(triple)) {
        if (yielded < limit) {
          yield triple;
          yielded++;
        }
      }
    }
  };
};
