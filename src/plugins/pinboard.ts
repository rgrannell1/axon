#!/bin/sh
//bin/true; exec deno run -A "$0" "$@"

/*
 * An axon plugin. Accepts
 *
 * --plugin               Prints plugin information as JSON
 *
 * --fetch=<cache-date>   Accepts a previous cache-date and returns anything added after that
 *                          date.
 */

import { parse } from "https://deno.land/std@0.95.0/flags/mod.ts";
import { id } from "../../mod.ts";

/**
 * Get the last date a bookmark was added
 *
 * @param {string} key
 * @return {*}  {Promise<string>}
 */
async function getLastUpdate(key: string): Promise<string> {
  const jsonResponse = await fetch(
    `https://api.pinboard.in/v1/posts/update?format=json&auth_token=${key}`,
  );
  const jsonData = await jsonResponse.json();
  return jsonData.update_time;
}

/**
 * Retrieve all bookmarks
 *
 * @param {string} key
 * @return {*}  {Promise<void>}
 */
async function getBookmarks(key: string): Promise<void> {
  let offset = 0;
  const size = 50;

  while (true) {
    const jsonResponse = await fetch(
      `https://api.pinboard.in/v1/posts/all?start=${offset}&results=${size}&format=json&&auth_token=${key}`,
    );
    const jsonData = await jsonResponse.json();

    for (const bookmark of jsonData) {
      const entity = {
        id: id(bookmark.href, bookmark.time),
        from: ["Pinboard", "BookmarkSource"],
        is: "PinboardBookmark",
        url: [bookmark.href, "URL"],
        description: [bookmark.description, "Description"],
        hash: [bookmark.hash, "Hash"],
        date: [bookmark.time, "Date"],
      };

      console.log(JSON.stringify(entity));
    }
break
    if (jsonData.length === 0) {
      break;
    }

    offset += size;
  }
}

const main = async () => {
  const flags = parse(Deno.args);

  const PINBOARD_API_KEY = Deno.env.get("PINBOARD_API_KEY");
  if (!PINBOARD_API_KEY) {
    throw new Error("pinboard_key missing");
  }

  const last_update_time = await getLastUpdate(PINBOARD_API_KEY);
  const plugin = {
    id: "Pinboard Import Plugin",
    is: [
      "Axon/Plugin/Importer",
    ],
    cache_key: [last_update_time, "Identifier"],
    date: [new Date().toISOString(), "Date"],
    schemas: [
      ['/home/rg/Code/deno-axon/src/plugins/pinboard.yaml', "URL"]
    ]
  };

  if (flags.plugin) {
    console.log(JSON.stringify(plugin));
  } else if (flags.fetch) {
    await getBookmarks(PINBOARD_API_KEY);
  } else {
    console.log (JSON.stringify(Deno.args));
    Deno.exit(1);
  }
};

main().catch((err) => {
  throw err;
});
