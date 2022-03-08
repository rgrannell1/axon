import { AXON_CLI } from "../commons/constants.ts";
import { Backend } from "../core/backend.ts";

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";

export enum FormatOptions {
  JSON,
  CSV,
  Text,
}

export class Reporter {
  format: FormatOptions;

  constructor(format: FormatOptions) {
    this.format = format;
  }

  formatValue<T>(value: T): string {
    if (this.format === FormatOptions.JSON) {
      return JSON.stringify(value);
    } else if (this.format === FormatOptions.CSV) {
      throw new Error("not implemented");
    } else {
      return (value as any).toString();
    }
  }

  report<T>(stream: Generator<T, unknown, unknown>): void {
    for (const value of stream) {
      console.log(this.formatValue(value));
    }
  }
}

export class CLI {
  static reportError(message: string) {
    console.error(`Axon: ${message}`);
  }

  static readArgs() {
    const args = docopt(AXON_CLI);

    return {
      dpath: args["--dpath"],
      plugins: args["--plugin"],
      csv: args["--csv"],
      json: args["--json"],
    };
  }

  static async start(): Promise<void> {
    const args = CLI.readArgs();

    const backend = new Backend(args.dpath);
    const Searches = await backend.loadPlugins(args.plugins);

    let fmt: FormatOptions;

    if (args.json) {
      fmt = FormatOptions.JSON;
    } else if (args.csv) {
      fmt = FormatOptions.CSV;
    } else {
      fmt = FormatOptions.Text;
    }

    const reporter = new Reporter(fmt);
    reporter.report(await backend.search(Searches.All));
  }
}
