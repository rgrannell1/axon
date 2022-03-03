import { Vault } from "../notes/vault.ts";
import { AXON_CLI } from "../commons/constants.ts";
import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";

export class CLI {
  static reportError(message: string) {
    console.error(`Axon: ${message}`);
  }

  static showHelp() {
    console.log(AXON_CLI);
  }

  static readArgs() {
    const args = parse(Deno.args);

    if (args.h || args.help) {
      console.log(AXON_CLI);
      Deno.exit(0);
    }

    if (!args.dpath) {
      CLI.reportError("--dpath was not provided");
      Deno.exit(1);
    }

    return args;
  }
  static async start(): Promise<void> {
    const args = CLI.readArgs();
    const vault = new Vault(args.dpath);

    for await (const note of vault.listNotes()) {
      const res = JSON.stringify(await note.parse(), null, 2);
      console.log(res);
    }
  }
}
