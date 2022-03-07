import { Vault } from "../notes/vault.ts";
import { AXON_CLI } from "../commons/constants.ts";
import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
import { Triple } from "../commons/model.ts";
import { Facts, Search } from "../search/search.ts";

import logic from "https://raw.githubusercontent.com/rgrannell1/LogicTS/master/logic.ts";
const $lvar = logic.lvar;

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
    const triples: Triple[] = [];

    for await (const note of vault.listNotes()) {
      const facts = await note.parse();
      triples.push(...facts);
    }

    const $facts = new Facts(triples);

    const search = new Search($facts);
    console.log(search.entities());

    //    console.log(logic.run(res, [$rel]))
  }
}
