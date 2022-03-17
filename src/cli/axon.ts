export const AXON_CLI = `
Usage:
  axon <command> [options] [<args>...]
  axon (-h|--help)

Commands:
  import             Import triples from an external resource or script int
`;

const commands: Record<string, string> = {
  import: "./axon-import.ts",
};

const command = Deno.args[0];

if (commands.hasOwnProperty(command)) {
  const mod = await import(commands[command]);
  await mod.main();
} else {
  console.log(AXON_CLI);
  Deno.exit(1);
}
