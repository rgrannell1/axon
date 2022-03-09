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
