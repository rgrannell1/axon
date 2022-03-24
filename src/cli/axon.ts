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

const commands: Record<string, string> = {
  import: "./axon-import.ts",
  export: "./axon-export.ts",
};

const [command] = Deno.args;

if (commands.hasOwnProperty(command)) {
  const mod = await import(commands[command]);
  await mod.main();
} else {
  console.log(AXON_CLI);
  Deno.exit(1);
}
