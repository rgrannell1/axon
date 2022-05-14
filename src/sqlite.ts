/*
 * Sqlite database access. This is used to
 *
 */

import { DB } from "https://deno.land/x/sqlite/mod.ts";
import * as Models from "./models.ts";
import * as Constants from "./constants.ts";

async function init(fpath: string): Promise<DB> {
  const db = new DB(fpath, {});

  const tables = [
    `create table if not exists ${Constants.Tables.CACHE} (
      topic         text not null,
      value         text not null,

      primary key(topic)
    )`,
    `create table if not exists ${Constants.Tables.STATE} (
      topic         text not null,
      state         text not null,

      primary key(topic)
    )`,
    `create table if not exists topics (
      topic         text not null,

      primary key(topic)
    )`,
    `
    create table if not exists ${Constants.Tables.CONTENT} (
      content    text not null unique,
      mid        integer primary key
    )`,
    `
    create table if not exists ${Constants.Tables.RELATIONS} (
      src_id    integer not null,
      rel_id    integer not null,
      tgt_id    integer not null,

      foreign key(src_id) references ${Constants.Tables.CONTENT} (mid),
      foreign key(rel_id) references ${Constants.Tables.CONTENT} (mid),
      foreign key(tgt_id) references ${Constants.Tables.CONTENT} (mid)
    )`,
    `create unique index if not exists mid_index on ${Constants.Tables.CONTENT} (mid)`,
    `create unique index if not exists content_index on ${Constants.Tables.CONTENT} (content)`,

    `create index if not exists src_id_index on ${Constants.Tables.RELATIONS} (src_id)`,
    `create index if not exists rel_id_index on ${Constants.Tables.RELATIONS} (rel_id)`,
    `create index if not exists tgt_id_index on ${Constants.Tables.RELATIONS} (tgt_id)`,
  ];

  for (const table of tables) {
    await db.query(table);
  }

  return db;
}

export async function readCache(
  fpath: string,
): Promise<Record<string, string>> {
  const db = await init(fpath);

  try {
    const cache: Record<string, string> = {};
    for (
      const [topic, value] of db.query(
        `select topic, value from ${Constants.Tables.CACHE}`,
      )
    ) {
      cache[topic as string] = value as string;
    }

    return cache;
  } finally {
    db.close();
  }
}

export async function writeCache(
  fpath: string,
  topic: string,
  value: string,
): Promise<void> {
  const db = await init(fpath);

  try {
    await db.query(
      `insert or replace into ${Constants.Tables.CACHE} (topic, value) values (?, ?)`,
      [topic, value],
    );

    await db.query(
      `insert or replace into topics (topic) values (?)`,
      [topic],
    );
  } finally {
    db.close();
  }
}

export async function writeState(
  fpath: string,
  topic: string,
  state: any,
): Promise<void> {
  const db = await init(fpath);

  try {
    await db.query(
      `insert or replace into ${Constants.Tables.STATE} (topic, state) values (?, ?)`,
      [topic, state],
    );

    await db.query(
      `insert or ignore into topics (topic) values (?)`,
      [topic],
    );
  } finally {
    db.close();
  }
}

export async function readState(
  fpath: string,
  topic: string,
): Promise<string | undefined> {
  const db = await init(fpath);

  try {
    const [match] = db.query(
      `select topic, state from ${Constants.Tables.STATE} where topic = ?`,
      [topic],
    );

    if (match) {
      const [_, state] = match;
      return state as string;
    }
  } finally {
    db.close();
  }
}

async function insertTriple(
  db: DB,
  tripleBuffer: Models.Triple[],
) {
  const insertContents = db.prepareQuery(
    `insert or ignore into ${Constants.Tables.CONTENT} (content) values (:src), (:rel), (:tgt)`,
  );
  const insertRelations = db.prepareQuery(`
  insert or ignore into ${Constants.Tables.RELATIONS} (src_id, rel_id, tgt_id)
  values (
    (select mid from ${Constants.Tables.CONTENT} where content = :src),
    (select mid from ${Constants.Tables.CONTENT} where content = :rel),
    (select mid from ${Constants.Tables.CONTENT} where content = :tgt))
  `);

  db.transaction(() => {
    for (const triple of tripleBuffer) {
      insertContents.execute({
        src: triple.src,
        rel: triple.rel,
        tgt: triple.tgt,
      });

      insertRelations.execute({
        src: triple.src,
        rel: triple.rel,
        tgt: triple.tgt,
      });
    }
  });

  insertContents.finalize();
}

/**
 * @export
 * @param {string} fpath
 * @param {string} topic
 * @param {Models.Knowledge} _
 * @param {Models.ThingStream} things
 */
export async function writeTopic(
  fpath: string,
  topic: string,
  _: Models.Knowledge,
  things: Models.ThingStream,
) {
  const db = await init(fpath);

  let cacheKey, state;
  let tripleBuffer: Models.Triple[] = [];

  try {
    // write all things from the input stream
    for await (const thing of things) {
      // pull the cache-key from the importer, if present.
      if (thing.parents().has("Axon/Plugin/Importer")) {
        cacheKey = thing.get("cache_key")[0][0];
      }

      if (thing.parents().has("Axon/PluginState")) {
        state = thing.get("state")[0];
      }

      for (const triple of thing.triples()) {
        tripleBuffer.push(triple);

        if (tripleBuffer.length > Constants.TRIPLE_BUFFER_SIZE) {
          await insertTriple(db, tripleBuffer);
          tripleBuffer = [];
        }
      }
    }

    if (cacheKey) {
      await writeCache(fpath, topic, cacheKey);
    }

    // write plugin state to storage
    if (state) {
      await writeState(fpath, topic, state);
    }

    // final write
    await insertTriple(db, tripleBuffer);
  } finally {
    db.close(true);
  }
}

export async function* ReadTriples(
  fpath: string,
  knowlege: Models.Knowledge
) {
  const db = await init(fpath);

  const triples = Constants.Tables.RELATIONS;
  const search = db.prepareQuery<[string, string, string]>(`
  select
    content0.content as src,
    content1.content as rel,
    content2.content as tgt
  from ${triples}
  join content content0 on content0.mid = ${triples}.src_id
  join content content1 on content1.mid = ${triples}.rel_id
  join content content2 on content2.mid = ${triples}.tgt_id
  order by src
  `);

  try {
    for await (const [src, rel, tgt] of search.iter()) {
      const triple = new Models.Triple(src, rel, tgt);

      yield triple
      for await (const derived of knowlege.addTriple(triple)) {
        yield derived
      }
    }
  } finally {
    search.finalize();
    db.close();
  }
}

export async function* ReadThings(
  fpath: string,
  knowledge: Models.Knowledge
) {
  let lastSrc: string | undefined = undefined;
  let triples = [];

  for await (const triple of ReadTriples(fpath, knowledge)) {
    triples.push(triple);

    if (triple.src !== lastSrc) {
      yield Models.Thing.fromTriples(triples);
      triples = [];
    }

    lastSrc = triple.src;
  }
}
