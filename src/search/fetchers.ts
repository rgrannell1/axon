import { Subsumptions } from "../core/logic.ts";
import { Search, TripleStream } from "./types.ts";

/*
 * Decide if a subpart of a triple should be returned.
 */
export const All = (search: Search) => {
  return async function* (subsumptions: Subsumptions, $: TripleStream) {
    for await (const triple of $) {
      if (search(subsumptions, triple)) {
        yield triple;
      }
    }
  };
};

export const Take = (search: Search, limit: number) => {
  return async function* (subsumptions: Subsumptions, $: TripleStream) {
    let yielded = 0;

    for await (const triple of $) {
      if (search(subsumptions, triple)) {
        if (yielded < limit) {
          yield triple;
          yielded++;
        }
      }
    }
  };
};
