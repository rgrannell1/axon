
export const AXON_CLI = `
Usage:
  axon search --dpath <dir> (--plugin <fpath> ...) [--json|--csv] <name>
  axon import --dpath <dir> <name>
  axon export neo4j --dpath <dir>
  axon export sqlite
  axon template --dpath <dir>

  axon (-h|--help)

Description:
  Axon CLI

Commands
  search              retrieve search-results from Axon
  export              output
  new file

Arguments:
  <name>              File name

Options:
  --name              The name of the search to run. The search is defined in a loaded plugin.
  --json              Display output as JSON.
  --csv               Display output as CSV.
  --dpath <dir>       Axon note directory.
  --plugin <fpath>    A CSV of Typescript plugins for Axon.
`;

import { Backend, Plugins } from "../core/backend.ts";

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import { Neo4jExporter } from "../plugins/exporters/neo4j.ts";
import { PinboardPlugin } from "../plugins/pinboard/plugin.ts";
import { Vault } from "../notes/vault.ts";

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
      return (value as any)?.toString();
    }
  }

  async report<T>(stream: AsyncGenerator<T, unknown, unknown>): Promise<void> {
    for await (const value of stream) {
      console.log(this.formatValue(value));
    }
  }
}

type Args = {
  search: boolean;
  import: boolean;
  export: boolean;
  template: string;
  dpath: string;
  plugins: string[];
  csv: boolean;
  json: boolean;
  neo4j: boolean;
  sqlite: boolean;
  name?: string;
  newFile: boolean;
};

export class CLI {
  static reportError(message: string) {
    console.error(`Axon: ${message}`);
  }

  static readArgs(): Args {
    const args = docopt(AXON_CLI);

    return {
      search: args.search,
      import: args.import,
      export: args.export,
      template: args.template,
      dpath: args["--dpath"],
      plugins: args["--plugin"],
      csv: args["--csv"],
      json: args["--json"],
      neo4j: args["neo4j"],
      sqlite: args["sqlite"],
      name: args["<name>"],
      newFile: args["new-file"],
    };
  }

  static async export(backend: Backend, args: any): Promise<void> {
    if (args.neo4j) {
      backend.export(new Neo4jExporter());
    }
    if (args.sqlite) {
    }
  }

  static async import(backend: Backend, args: any): Promise<void> {
    if (args.name === "pinboard") {
      backend.import(new PinboardPlugin());
    }
  }

  static async newFile(backend: Backend, args: any): Promise<void> {
    if (args.newFile) {
      //await backend.vault.newFile(args.name);
      // todo
    }
  }

  static async template(backend: Backend, args: any): Promise<void> {
    backend.template();
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

    await backend.init();

    const reporter = new Reporter(fmt);
    await reporter.report(await backend.search(args.name));
  }

  static async start(): Promise<void> {
    const args = CLI.readArgs();

    // bad factoring!z
    const clients = {
      pinboard: new PinboardPlugin(),
      vault: new Vault(args.dpath),
    };

    const sources = [
      new Vault(args.dpath),
      new PinboardPlugin(),
    ];

    const backend = new Backend(sources, clients, args.plugins);
    await backend.init();

    for (const candidate of ['search', 'export', 'import', 'template']) {
      if ((args as any)[candidate]) {
        return (this as any)[candidate](backend, args);
      }
    }
  }
}
