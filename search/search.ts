import { Triple } from "../commons/model.ts";

export * as Composers from "./composers.ts";
export * as Existentials from "./existentials.ts";
export * as Fetchers from "./fetchers.ts";
export * as Filters from "./filters.ts";
export * as Parts from "./parts.ts";
export * as SubFilters from "./subfilters.ts";
export * as Transformers from "./transformers.ts";

/*
 * Construct a stream from a fixed triples array.
 */
export function* Q(triples: Triple[]) {
  for (const triple of triples) {
    yield triple;
  }
}
