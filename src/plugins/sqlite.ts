#!/bin/sh
//bin/true; exec deno run -A "$0" "$@"

/*
 * An axon plugin. Accepts
 *
 * --plugin               Prints plugin information as JSON
 *
 * --fetch=<cache-date>   Accepts a previous cache-date and returns anything added after that
 *                          date.
 *
 * --fpath=<dbpath>       The location of the database
 * --table=<table>        The name of the table to write to or read-from
 *
 */

import { parse } from "https://deno.land/std@0.95.0/flags/mod.ts";

const main = async () => {
  const flags = parse(Deno.args);

  const plugin = {
    id: "Sqlite Plugin",
    is: [
      "Axon/Plugin/Importer",
      "Axon/Plugin/Exporter",
    ],
    cache_key: ["not implemented", "Identifiable"],
    date: [new Date().toISOString(), "Date"],
  };

  if (flags.plugin) {
    console.log(JSON.stringify(plugin));
  } else if (flags.fetch) {
  } else if (flags.write) {
  } else {
    Deno.exit(1);
  }
};

main().catch((err) => {
  throw err;
});
