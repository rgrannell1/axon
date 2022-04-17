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
    `create unique index if not exists mid_index on ${Constants.Tables.CONTENT} (mid)`,
    `create unique index if not exists content_index on ${Constants.Tables.CONTENT} (content)`,
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

export async function addTopic(fpath: string, topic: string): Promise<void> {
  const db = await init(fpath);

  try {
    await db.query(`create table if not exists ${topic} (
      src_id    number not null,
      rel_id    number not null,
      tgt_id    number not null,

      primary key(src_id, rel_id, tgt_id),
      foreign key(src_id) references content(mid),
      foreign key(rel_id) references content(mid),
      foreign key(tgt_id) references content(mid)
    )`);
  } finally {
    db.close();
  }
}

async function insertTriple(
  db: DB,
  topic: string,
  tripleBuffer: Models.Triple[],
) {
  const insertQuery = db.prepareQuery(
    `insert or ignore into ${Constants.Tables.CONTENT} (content) values (:src), (:rel), (:tgt)`,
  );
  const insertTopicQuery = db.prepareQuery(`
  insert or ignore into ${topic} (src_id, rel_id, tgt_id)
  values (
    (select mid from ${Constants.Tables.CONTENT} where content = :src),
    (select mid from ${Constants.Tables.CONTENT} where content = :rel),
    (select mid from ${Constants.Tables.CONTENT} where content = :tgt))
  `);

  db.transaction(() => {
    for (const triple of tripleBuffer) {
      insertQuery.execute({
        src: triple.src,
        rel: triple.rel,
        tgt: triple.tgt,
      });

      insertTopicQuery.execute({
        src: triple.src,
        rel: triple.rel,
        tgt: triple.tgt,
      });
    }
  });

  insertQuery.finalize();
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
  await addTopic(fpath, topic);

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
          await insertTriple(db, topic, tripleBuffer);
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
    await insertTriple(db, topic, tripleBuffer);
  } finally {
    db.close(true);
  }
}

async function addTopicView(db: DB, topics: Set<string>) {
  const parts = Array.from(topics).map(topic => `select src_id, rel_id, tgt_id from ${topic}`).join('\nunion\n')

  db.execute(
    `create temp view if not exists ${Constants.Views.TOPICS}(src_id, rel_id, tgt_id) as
     ${parts}`,
  );
}

export async function* ReadTriples(
  fpath: string,
  topics: string,
) {
  const db = await init(fpath);
  const matches = matchingTopics(db, topics);

  await addTopicView(db, matches);

  const view = Constants.Views.TOPICS;
  const search = db.prepareQuery<[string, string, string]>(`
  select
    content0.content as src,
    content1.content as rel,
    content2.content as tgt
  from ${view}
  join content content0 on content0.mid = ${view}.src_id
  join content content1 on content1.mid = ${view}.rel_id
  join content content2 on content2.mid = ${view}.tgt_id
  `);

  try {
    for await (const [src, rel, tgt] of search.iter()) {
      yield new Models.Triple(src, rel, tgt);
    }
  } finally {
    search.finalize();
    db.close();
  }
}

export function matchingTopics(db: DB, topics: string) {
  const tables = db.query(`select name from sqlite_schema where
    type ='table' AND
    name NOT LIKE 'sqlite_%';`);

  const tableRe = new RegExp(topics, "i");
  const ignored = new Set<string>([
    Constants.Tables.CACHE,
    Constants.Tables.STATE,
    Constants.Tables.TOPICS,
    Constants.Tables.CACHE,
    Constants.Tables.CONTENT,
  ]);

  const tableSet = new Set<string>();
  for (const [table] of tables) {
    const tab = table as string;

    if (!ignored.has(tab) && tableRe.test(tab)) {
      tableSet.add(tab);
    }
  }

  return tableSet;
}

export async function* ReadThings(
  fpath: string,
  topics: string,
) {
  const db = await init(fpath);

  const searches: string[] = [];

  for (const topic of matchingTopics(db, topics)) {
    searches.push(`
      select src, rel, tgt from ${topic}
      union
      select tgt as src, 'id' as rel, tgt from ${topic}
      `);
  }

  let previous: string | undefined = undefined;
  let triples = [];

  const search = db.prepareQuery<[string, string, string]>(
    searches.join("\nunion\n"),
  );

  try {
    for await (const [src, rel, tgt] of search.iter()) {
      const triple = new Models.Triple(src, rel, tgt);

      triples.push(triple);

      if (triple.src !== previous) {
        yield Models.Thing.fromTriples(triples);
        triples = [];
      }

      previous = triple.src;
    }
  } finally {
    search.finalize();
    db.close();
  }
}
