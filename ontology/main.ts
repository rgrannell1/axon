//import { Search, Triple } from "../lib.ts";
import { Search, Triple } from "https://raw.githubusercontent.com/rgrannell1/deno-axon/main/lib.ts";

const {
  Composers,
  Fetchers,
  Filters,
  Parts,
  Q,
  SubFilters,
} = Search;

export const All = function* (triples: Triple[]) {
  const $ = Q(triples);

  for (const triple of Fetchers.All(Parts.True)($)) {
    yield triple;
  }
};

export const DistinctRels = function* (triples: Triple[]) {
  const $ = Q(triples);

  const relSet = new Set();

  for (const triple of Fetchers.All(Parts.True)($)) {
    if (!relSet.has(triple.relname)) {
      relSet.add(triple.relname);
      yield triple.relname;
    }
  }
};

export const DistinctValue = function* (triples: Triple[]) {
  const $ = Q(triples);

  const values = new Set();

  for (const triple of Fetchers.All(Parts.True)($)) {
    if (!values.has(triple.src)) {
      values.add(triple.src);
      yield triple.src;
    }

    if (!values.has(triple.tgt)) {
      values.add(triple.tgt);
      yield triple.tgt;
    }

    if (!values.has(triple.relname)) {
      values.add(triple.relname);
      yield triple.relname;
    }
  }
};

export const DistinctEntities = function* (triples: Triple[]) {
  const $ = Q(triples);

  const entities = new Set();

  for (const triple of Fetchers.All(Parts.True)($)) {
    if (!entities.has(triple.src)) {
      entities.add(triple.src);
      yield triple.src;
    }

    if (!entities.has(triple.tgt)) {
      entities.add(triple.tgt);
      yield triple.tgt;
    }
  }
};

export const DistinctSrc = function* (triples: Triple[]) {
  const $ = Q(triples);

  const src = new Set();

  for (const triple of Fetchers.All(Parts.True)($)) {
    if (!src.has(triple.src)) {
      src.add(triple.src);
      yield triple.src;
    }
  }
};

export const DistinctTgt = function* (triples: Triple[]) {
  const $ = Q(triples);

  const tgt = new Set();

  for (const triple of Fetchers.All(Parts.True)($)) {
    if (!tgt.has(triple.tgt)) {
      tgt.add(triple.tgt);
      yield triple.tgt;
    }
  }
};
