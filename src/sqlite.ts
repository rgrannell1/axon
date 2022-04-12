/*
 * Sqlite database access. This is used to
 *
 */

import { DB } from "https://deno.land/x/sqlite/mod.ts";
import * as Models from "./models.ts";
import * as Constants from "./constants.ts";

async function init(fpath: string): Promise<DB> {
  const db = new DB(fpath);

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
      `insert or replace into topics (topic) values (?)`,
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
      hash          text not null,
      src           text not null,
      rel           text not null,
      tgt           text not null,
      insert_date   text not null,

      primary key(hash)
    )`);

    await db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ${topic}_hash ON ${topic} (hash);`,
    );
  } finally {
    db.close();
  }
}

export async function writeTopic(
  fpath: string,
  topic: string,
  knowledge: Models.Knowledge,
  things: Models.ThingStream,
) {
  await addTopic(fpath, topic);

  const db = await init(fpath);
  const now = Date.now(); // here so we have a consistent timestamp for this write

  let cacheKey;
  let state;

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
        const hash = triple.hash();

        const result = await db.query(
          `select count(*) as present from ${topic} where ${topic}.hash = ?`,
          [hash],
        );
        if (result[0][0] === 0) {
          // merge things not presently in this topic into the topic
          try {
            await db.query(
              `insert into ${topic} (hash, src, rel, tgt, insert_date) values (?, ?, ?, ?, ?)`,
              [
                hash,
                triple.src,
                triple.rel,
                triple.tgt,
                now,
              ],
            );
          } catch (err) {
            console.error(
              `failed to insert triple ${JSON.stringify(triple, null, 2)}`,
            );
            throw err;
          }
        }
      }

      // TODO write all subsumption knowledge
    }

    if (cacheKey) {
      await writeCache(fpath, topic, cacheKey);
    }

    // write plugin state to storage
    if (state) {
      await writeState(fpath, topic, state);
    }
  } finally {
    db.close();
  }
}

export async function* ReadTriples(
  fpath: string,
  topics: string,
) {
  const db = await init(fpath);

  const matches = matchingTopics(db, topics);

  const searches = [];
  for (const topic of matches) {
    searches.push(`select src, rel,tgt from ${topic}`);
  }
  const search = db.prepareQuery<[string, string, string]>(
    searches.join("\nunion\n"),
  );

  try {
    for await (const [src, rel, tgt] of search.iter()) {
      yield new Models.Triple(src, rel, tgt);
    }
  } finally {
    db.close();
  }
}

export function* matchingTopics(db: DB, topics: string) {
  const tables = db.query(`select name from sqlite_schema where
    type ='table' AND
    name NOT LIKE 'sqlite_%';`);

  const re = new RegExp(topics, "i");

  const ignored = new Set([
    Constants.Tables.CACHE,
    Constants.Tables.STATE,
    Constants.Tables.TOPICS,
    "ImportCache",
  ]);
  for (const [table] of tables) {
    if (!ignored.has(table as any) && re.test(table as string)) {
      yield table;
    }
  }
}

export async function* ReadThings(
  fpath: string,
  topics: string,
) {
  const db = await init(fpath);

  const searches: string[] = [];
  const matches = matchingTopics(db, topics);

  for (const topic of matches) {
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
    db.close();
  }
}
