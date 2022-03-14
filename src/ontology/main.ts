import { Logic, Search, Triple } from "../../lib.ts";
import { PinboardPlugin } from "../plugins/plugins/pinboard.ts";

const {
  Fetchers,
  Parts,
} = Search;

export const All = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
    yield triple;
  }
};

export const DistinctRels = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const relSet = new Set();

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
    if (!relSet.has(triple.relname)) {
      relSet.add(triple.relname);
      yield triple.relname;
    }
  }
};

export const DistinctValue = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const values = new Set();

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
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
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const entities = new Set();

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
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
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const src = new Set();

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
    if (!src.has(triple.src)) {
      src.add(triple.src);
      yield triple.src;
    }
  }
};

export const DistinctTgt = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const tgt = new Set();

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
    if (!tgt.has(triple.tgt)) {
      tgt.add(triple.tgt);
      yield triple.tgt;
    }
  }
};

export const PinboardBookmarks = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const pinboard = new PinboardPlugin();
  await pinboard.init();

  for await (
    const bookmark of pinboard.fromTriples(subsumptions, triples)
  ) {
    yield bookmark;
  }
};

/*
 * Find all things with no properties. Indicates underdocumented things.
 *
 */
export const UnlinkedThings = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const withoutRels = new Set<any>();
  const removed = new Set<any>();

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
    removed.add(triple.src);
    withoutRels.add(triple.tgt);
  }

  for (const entity of removed) {
    withoutRels.delete(entity);
  }
  for (const entity of Array.from(withoutRels).sort()) {
    yield entity;
  }
};

export const Concepts = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  for await (const triple of triples) {}
  const names = new Set()
  for (const concept of subsumptions.conceptNames) {
    names.add(concept)
  }

  for (const concept of Array.from(names).sort()) {
    yield concept
  }
};

export const Associations = async function* (
  subsumptions: Logic.Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {

  const ids: Record<string, Record<string, any>> = {}

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
    if (triple.relname === 'is' && triple.tgt === 'Association') {
      ids[triple.src] = {
        id: triple.src,
        boundRelationships: [] as string[],
        bindings: {} as Record<string, any[]>
      }
    }

    if (triple.relname === 'binds_rel') {
      ids[triple.src].boundRelationships.push(triple.tgt)
    }

    if (ids.hasOwnProperty(triple.src)) {
      const tgt = ids[triple.src]

      for (const rel of tgt.boundRelationships) {
        if (triple.relname === `binds_${rel}`) {
          if (!tgt.bindings[rel]) {
            tgt.bindings[rel] = []
          }

          tgt.bindings[rel].push(triple.tgt)
        }
      }
    }
  }

  console.log(JSON.stringify(ids, null, 4))
};
