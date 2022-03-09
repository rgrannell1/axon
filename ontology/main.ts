import { Search, Triple } from "../lib.ts";
//import {Search,Triple} from "https://raw.githubusercontent.com/rgrannell1/deno-axon/main/lib.ts";

const {
  Composers,
  Fetchers,
  Filters,
  Parts,
  Q,
  SubFilters,
} = Search;

export const All = async function* (
  triples: AsyncGenerator<Triple, void, any>,
) {
  for await (const triple of Fetchers.All(Parts.True)(triples)) {
    yield triple;
  }
};

export const DistinctRels = async function* (
  triples: AsyncGenerator<Triple, void, any>,
) {
  const relSet = new Set();

  for await (const triple of Fetchers.All(Parts.True)(triples)) {
    if (!relSet.has(triple.relname)) {
      relSet.add(triple.relname);
      yield triple.relname;
    }
  }
};

export const DistinctValue = async function* (
  triples: AsyncGenerator<Triple, void, any>,
) {
  const values = new Set();

  for await (const triple of Fetchers.All(Parts.True)(triples)) {
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

export const DistinctEntities = async function* (
  triples: AsyncGenerator<Triple, void, any>,
) {
  const entities = new Set();

  for await (const triple of Fetchers.All(Parts.True)(triples)) {
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

export const DistinctSrc = async function* (
  triples: AsyncGenerator<Triple, void, any>,
) {
  const src = new Set();

  for await (const triple of Fetchers.All(Parts.True)(triples)) {
    if (!src.has(triple.src)) {
      src.add(triple.src);
      yield triple.src;
    }
  }
};

export const DistinctTgt = async function* (
  triples: AsyncGenerator<Triple, void, any>,
) {
  const tgt = new Set();

  for await (const triple of Fetchers.All(Parts.True)(triples)) {
    if (!tgt.has(triple.tgt)) {
      tgt.add(triple.tgt);
      yield triple.tgt;
    }
  }
};
