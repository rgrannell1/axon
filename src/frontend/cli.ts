import { AXON_CLI } from "../commons/constants.ts";
import { Backend } from "../core/backend.ts";

import docopt from "https://deno.land/x/docopt@v1.0.1/dist/docopt.mjs";
import { Neo4jExporter } from "../plugins/exporters/neo4j.ts";
import { PinboardPlugin } from "../plugins/plugins/pinboard.ts";
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

    await backend.init(args.plugins);

    const reporter = new Reporter(fmt);
    await reporter.report(await backend.search(args.name));
  }

  static async start(): Promise<void> {
    const args = CLI.readArgs();

    const plugins = {
      pinboard: new PinboardPlugin(),
      vault: new Vault(args.dpath),
    };

    const sources = [
      new Vault(args.dpath),
      new PinboardPlugin(),
    ];

    const backend = new Backend(sources, plugins);
    await backend.init(args.plugins);

    if (args.search) {
      await this.search(backend, args);
    } else if (args.export) {
      await this.export(backend, args);
    } else if (args.import) {
      await this.import(backend, args);
    } else if (args.newFile) {
      await this.newFile(backend, args);
    } else if (args.template) {
      await this.template(backend, args);
    }
  }
}
