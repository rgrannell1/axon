/*
 * Sqlite database access. This is used to
 *
 */

import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Models } from "../mod.ts";

export enum Tables {
  CACHE = "ImportCache",
}

async function init(fpath: string): Promise<DB> {
  const db = new DB(fpath);

  const tables = [
    `create table if not exists ${Tables.CACHE} (
      topic         text not null,
      value         text not null,

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
        `select topic, value from ${Tables.CACHE}`,
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
      `insert or replace into ${Tables.CACHE} (topic, value) values (?, ?)`,
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

export async function addTopic(fpath: string, topic: string): Promise<void> {
  const db = await init(fpath);

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
}

export async function writeTopic(
  fpath: string,
  topic: string,
  things: Models.ThingStream,
) {
  await addTopic(fpath, topic);

  const db = await init(fpath);
  const hashSet: Set<string> = new Set([]);

  let cacheKey;

  for await (const thing of things) {
    if (thing.parents().has("Axon/Plugin/Importer")) {
      cacheKey = thing.get("cache_key");
    }

    for (const triple of thing.triples()) {
      const hash = triple.hash();
      hashSet.add(hash);

      const result = await db.query(
        `select count(*) as present from ${topic} where ${topic}.hash = ?`,
        [hash],
      );
      if (result[0][0] === 0) {
        // insert missing data into database
        await db.query(
          `insert into ${topic} (hash, src, rel, tgt, insert_date) values (?, ?, ?, ?, ?)`,
          [
            hash,
            triple.src,
            triple.rel,
            triple.tgt,
            Date.now(),
          ],
        );
      }
    }
  }

  if (cacheKey) {
    await writeCache(fpath, topic, cacheKey[0]);
  }
}

export async function* ReadTriples(
  fpath: string,
  search: string,
) {
  const db = await init(fpath);

  for await (const row of db.query(search)) {
    yield new Models.Triple(row[1], row[2], row[3]);
  }
}

export function* matchingTopics(db: DB, topics: string) {
  const tables = db.query(`select name from sqlite_schema where
    type ='table' AND
    name NOT LIKE 'sqlite_%';`);

  const re = new RegExp(topics, "i");

  for (const [table] of tables) {
    if (table !== "ImportCache" && re.test(table as string)) {
      yield table;
    }
  }
}

export async function* ReadThings(
  fpath: string,
  topics: string,
) {
  const db = await init(fpath);
  const searches = [];

  for (const topic of matchingTopics(db, topics)) {
    searches.push(`
    select src,rel,tgt from ${topic}
    union
    select tgt as src,'id' as rel,tgt from ${topic}
    `);
  }

  const search = searches.join("\nunion\n") + `group by src`;

  let previous: string | undefined = undefined;
  let triples = [];
  for await (const row of db.query(search)) {
    const triple = new Models.Triple(row[0], row[1], row[2]);

    triples.push(triple);

    if (triple.src !== previous) {
      yield Models.Thing.fromTriples(triples);
      triples = [];
    }

    previous = triple.src;
  }
}
