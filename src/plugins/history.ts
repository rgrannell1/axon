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

import { readLines } from "https://deno.land/std/io/bufio.ts";
import { parse } from "https://deno.land/std@0.95.0/flags/mod.ts";
import { id } from "../../mod.ts";

const HISTORY_FORMAT = /\: (?<time>[0-9]{10})\:[0-9]+;(?<command>.+)/;
const SANITISERS = [
  /neo4j.+ -p (?<blank>.+)/g,
  /PASSWORD=(?<blank>.+)/gi,
  /PASS=(?<blank>.+)/gi,
  /KEY=(?<blank>.+)/gi,
  /token=(?<blank>.+)/gi,
];

async function getLastUpdate(fpath: string) {
  const file = await Deno.stat(fpath);

  if (file.isFile) {
    return file.mtime?.toLocaleString() ?? Date.now().toLocaleString();
  } else {
    throw `history importer: ${fpath} is not a file`;
  }
}

const sanitise = (command: string) => {
  for (const sanitiser of SANITISERS) {
    const matches = sanitiser.exec(command);
    if (matches) {
      for (const match of matches) {
        command = command.replaceAll(match, "*****");
      }
    }
  }
  return command;
};

async function getHistory(fpath: string) {
  const conn = await Deno.open(fpath, { read: true });

  for await (const line of readLines(conn)) {
    const matches = HISTORY_FORMAT.exec(line);
    if (!matches) {
      continue;
    }

    const { groups } = matches;
    if (!groups || !groups.time || !groups.command) {
      continue;
    }

    console.log(JSON.stringify({
      id: id(groups.time, groups.command),
      is: "ShellHistoryEntry",
      created_at: [[
        new Date(parseInt(groups.time) * 1e3).toLocaleString(),
        "Date",
      ]],
      command: [[sanitise(groups.command), "ShellCommand"]],
    }));
  }
}

const main = async () => {
  const flags = parse(Deno.args);

  const fpath = flags.fpath;
  const last_update_time = await getLastUpdate(fpath);

  const plugin = {
    id: "History Import Plugin",
    is: [
      "Axon/Plugin/Importer",
    ],
    cache_key: [last_update_time, "Identifier"],
    date: [new Date().toISOString(), "Date"],
    schemas: [],
  };

  if (flags.plugin) {
    console.log(JSON.stringify(plugin));
  } else if (flags.fetch) {
    console.log(JSON.stringify(plugin));
    await getHistory(flags.fpath);
  } else {
    console.log(JSON.stringify(Deno.args));
    Deno.exit(1);
  }
};

main().catch((err) => {
  console.error(err);
  Deno.exit(1);
});
