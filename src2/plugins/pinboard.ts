#!/bin/sh
//bin/true; exec deno run -A "$0" "$@"

import { parse } from "https://deno.land/std@0.95.0/flags/mod.ts";
import { id } from "../../little-lib.ts";

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
        is: "PinboardBookmark",
        has: [
          [bookmark.href, "PinboardBookmark/URL"],
          [bookmark.description, "PinboardBookmark/Description"],
          [bookmark.hash, "PinboardBookmark/Hash"],
          [bookmark.time, "PinboardBookmark/Date"],
        ],
      };

      console.log(JSON.stringify(entity));
    }

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
    cache_key: [last_update_time, "Axon/Thing"],
    date: [new Date().toISOString(), "Date"],
  };

  if (flags.plugin) {
    console.log(JSON.stringify(plugin));
  } else if (flags.fetch) {
    console.log(JSON.stringify(plugin));
    await getBookmarks(PINBOARD_API_KEY);
  } else {
    Deno.exit(1);
  }
};

main().catch((err) => {
  throw err;
});
