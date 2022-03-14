import { Triple } from "../../commons/model.ts";
import { Subsumptions } from "../../core/logic.ts";
import { Neo4jDB } from "../database/neo4j.ts";
import { IExporter } from "../../interfaces.ts";

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
  async export(subsumptions: Subsumptions, $triples: any) {
    const session = this.db.driver.session();

    console.log("export | clearing database");

    await this.db.clear(session);

    console.log("export | adding triples");

    const triples = [];
    for await (const triple of $triples) {
      triples.push(triple);
      await this.db.addTriple(session, triple);
    }

    console.log("export | adding labels");
    let idx = 0
    for (const triple of triples) {
      console.log(idx, triples.length)
      idx++
      const src: string[] = Array.from(subsumptions.concepts(triple.src));
      const tgt: string[] = Array.from(subsumptions.concepts(triple.tgt));

      await this.db.labelTriple(session, triple, src, tgt);
    }

    console.log('done')
    session.close();

    this.db.driver.close();
  }
}
