import { AXON_CLI } from "../commons/constants.ts";
import { Backend } from "../core/backend.ts";

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";

export class CLI {
  static reportError(message: string) {
    console.error(`Axon: ${message}`);
  }

  static readArgs() {
    const args = docopt(AXON_CLI);

    console.log(args)
    return {
      dpath: args["--dpath"],
      plugins: args['--plugin']
    };
  }

  static async start(): Promise<void> {
    const args = CLI.readArgs();

    const backend = new Backend(args.dpath);
    const Searches = await backend.loadPlugins(args.plugins);

    for (const x of await backend.search(Searches.DistinctValue)) {
      console.log(x);
    }
  }
}
