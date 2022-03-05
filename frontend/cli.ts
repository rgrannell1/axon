import { Vault } from "../notes/vault.ts";
import { AXON_CLI } from "../commons/constants.ts";
import { parse } from "https://deno.land/std@0.127.0/flags/mod.ts";
import { Neo4jDB } from "../database/neo4j.ts";

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

    const db = new Neo4jDB(
      "bolt://localhost:7687",
      Deno.env.get("AXON_USER"),
      Deno.env.get("AXON_PASSWORD"),
    );

    for await (const note of vault.listNotes()) {
      for (const fact of await note.parse()) {
        await db.addTriple(fact);
      }
    }

    db.driver.close();
  }
}
