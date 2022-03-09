import * as neo4j from "https://deno.land/x/neo4j_lite_client@4.4.1-preview2/mod.ts";
import { Triple } from "../commons/model.ts";
import { IExporter } from "../core/exporter.ts";
import { Subsumptions } from "../core/logic.ts";

export class Neo4jDB {
  driver: neo4j.Driver;

  constructor(
    url: string,
    username: string | undefined,
    password: string | undefined,
  ) {
    if (!username) {
      throw new Error("username not provided");
    }
    if (!password) {
      throw new Error("password not provided");
    }

    this.driver = neo4j.driver(url, neo4j.auth.basic(username, password));
  }

  async clear(session: any) {
    await session.run(`match (x) detach delete x`);
  }

  async addTriple(session: any, triple: Triple) {
    if (typeof triple !== "object") {
      return;
    }
    if (!triple.tgt) {
      return;
    }

    const name = triple.relname.replace("-", "_");

    if (name === "id") {
      await session.run(
        `
    merge (src {name: $srcname})
    `,
        {
          srcname: triple.src,
        },
      );
    } else {
      await session.run(
        `
    merge (src {name: $srcname})
    merge (tgt {name: $tgtname})

    merge (src)-[:${name}]-(tgt)
    `,
        {
          srcname: triple.src,
          tgtname: triple.tgt,
        },
      );
    }
  }

  async labelTriple(
    session: any,
    triple: Triple,
    srcConcepts: string[],
    tgtConcepts: string[],
  ) {
    if (typeof triple !== "object") {
      return;
    }

    if (!triple.tgt) {
      return;
    }

    await session.run(
      `
    match (x)
      where x.name = $srcname
      set x:${srcConcepts.join(":")}
    with x
    match (y)
      where y.name = $tgtname
      set y:${tgtConcepts.join(":")}
    `,
      {
        srcname: triple.src,
        tgtname: triple.tgt,
      },
    );
  }
}

export class Neo4jExporter implements IExporter {
  db: Neo4jDB;

  constructor() {
    this.db = new Neo4jDB(
      "bolt://localhost:7687",
      Deno.env.get("AXON_USER"),
      Deno.env.get("AXON_PASSWORD"),
    );
  }
  async init() {
  }
  async export(subsumptions: Subsumptions, triples: Triple[]) {
    const session = this.db.driver.session();

    await this.db.clear(session);

    for (const triple of triples) {
      await this.db.addTriple(session, triple);
    }

    for (const triple of triples) {
      const src: string[] = Array.from(subsumptions.classes(triple.src));
      const tgt: string[] = Array.from(subsumptions.classes(triple.tgt));

      await this.db.labelTriple(session, triple, src, tgt);
    }

    session.close();

    this.db.driver.close();
  }
}
