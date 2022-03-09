import { AXON_CLI } from "../commons/constants.ts";
import { Backend } from "../core/backend.ts";

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import { Neo4jExporter } from "../exporters/neo4j.ts";

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

type Args = {
  search: boolean;
  export: boolean;
  dpath: string;
  plugins: string[];
  csv: boolean;
  json: boolean;
  neo4j: boolean;
  sqlite: boolean;
};

export class CLI {
  static reportError(message: string) {
    console.error(`Axon: ${message}`);
  }

  static readArgs(): Args {
    const args = docopt(AXON_CLI);

    return {
      search: args.search,
      export: args.export,
      dpath: args["--dpath"],
      plugins: args["--plugin"],
      csv: args["--csv"],
      json: args["--json"],
      neo4j: args["neo4j"],
      sqlite: args["sqlite"],
    };
  }

  static async export(backend: Backend, args: any): Promise<void> {
    if (args.neo4j) {
      backend.export(new Neo4jExporter());
    }
    if (args.sqlite) {
    }
  }

  static async search(backend: Backend, args: any): Promise<void> {
    let fmt: FormatOptions;

    if (args.json) {
      fmt = FormatOptions.JSON;
    } else if (args.csv) {
      fmt = FormatOptions.CSV;
    } else {
      fmt = FormatOptions.Text;
    }

    await backend.init(args.plugins);

    const reporter = new Reporter(fmt);
    reporter.report(await backend.search("All"));
  }

  static async start(): Promise<void> {
    const args = CLI.readArgs();

    const backend = new Backend(args.dpath);
    await backend.init(args.plugins);

    if (args.search) {
      await this.search(backend, args);
    } else if (args.export) {
      await this.export(backend, args);
    }
  }
}
