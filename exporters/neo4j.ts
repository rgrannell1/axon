import { Triple } from "../commons/model.ts";
import { Subsumptions } from "../core/logic.ts";
import { Neo4jDB } from "../database/neo4j.ts";
import { IExporter } from "../interfaces.ts";

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
