import { DB } from "https://deno.land/x/sqlite/mod.ts";

export enum Tables {
  CACHE = "ImportCache",
}

async function init(fpath: string): Promise<DB> {
  const db = new DB(fpath);

  const tables = [
    // when result are retreived, ret
    `create table if not exists ${Tables.CACHE} (
      pluginName    text not null,
      exportPath    text not null,
      value         text not null,

      primary key(pluginName, exportPath)
    )`,
  ];

  for (const table of tables) {
    await db.query(table);
  }

  return db;
}

export async function readCache(
  fpath: string,
): Promise<Record<string, Record<string, string>>> {
  const db = await init(fpath);

  try {
    const cache: Record<string, Record<string, string>> = {};
    for (
      const [pluginName, exportPath, value] of db.query(
        `select pluginName, exportPath, value from ${Tables.CACHE}`,
      )
    ) {
      if (!cache.hasOwnProperty(pluginName as string)) {
        cache[pluginName as string] = {
          [exportPath as string]: value as string,
        };
      } else {
        cache[pluginName as string][exportPath as string] = value as string;
      }
    }

    return cache;
  } finally {
    db.close();
  }
}

export async function writeCache(
  fpath: string,
  pluginName: string,
  value: string,
): Promise<void> {
  const db = await init(fpath);

  try {
    await db.query(
      `insert or replace into ${Tables.CACHE} (pluginName, value) values (?)`,
      [pluginName, value],
    );
  } finally {
    db.close();
  }
}
