#!/bin/sh
//bin/true; exec /home/rg/.deno/bin/deno run -A "$0" "$@"

export const AXON_CLI = `
Usage:
  axon <command> [options] [<args>...]
  axon (-h|--help)

Description:
  Axon

Commands:
  import             Import entities from an external resource or script into sqlite.
  export             Export triples or entities in multiple formats.
`;

import {main as axonImport} from './axon-import.ts'
import {main as axonExport} from './axon-export.ts'

const commands: Record<string, any> = {
  import: axonImport,
  export: axonExport,
};

const [command] = Deno.args;

if (commands.hasOwnProperty(command)) {
  await commands[command]();
} else {
  console.log(AXON_CLI);
  Deno.exit(1);
}
