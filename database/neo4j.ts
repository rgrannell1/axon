import * as neo4j from "https://deno.land/x/neo4j_lite_client@4.4.1-preview2/mod.ts";
import { Triple } from "../commons/model.ts";

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

  async addTriple(triple: Triple, srcConcept: boolean, tgtConcept: boolean) {
    if (typeof triple !== "object") {
      return;
    }
    const session = this.driver.session();

    const srcLabel = srcConcept ? 'Concept' : 'Thing'
    const tgtLabel = tgtConcept ? 'Concept' : 'Thing'

    const name = triple.relname.replace("-", "_");

    await session.run(
    `
    merge (src:${srcLabel} {name: $srcname})
    merge (tgt:${tgtLabel} {name: $tgtname})

    merge (src)-[:${name}]-(tgt)
    `,
      {
        srcname: triple.src,
        tgtname: triple.tgt,
      },
    );

    session.close();
  }
}
