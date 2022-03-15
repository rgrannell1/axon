
import {
  Interfaces,
  Triple,
  Logic
} from '../../../lib.ts'
import { Neo4jDB } from "./db.ts";


/**
 * Export knowledge-base to Neo4j.
 *
 * @export
 * @class Neo4jExporter
 * @implements {Interfaces.IExporter}
 */
export class Neo4jExporter implements Interfaces.IExporter {
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


  /**
   * Export stored knowledge-base to Neo4j
   *
   * @param {Logic.Subsumptions} subsumptions information about class-subsumptions
   * @param {Interfaces.TripleStream} triples
   * @memberof Neo4jExporter
   */
  async export(subsumptions: Logic.Subsumptions, triples: () => Interfaces.TripleStream) {
    const session = this.db.driver.session();

    console.log("export | clearing database");

    await this.db.clear(session);

    console.log("export | adding triples");

    let tripleCount = 0
    for await (const triple of triples()) {
      await this.db.addTriple(session, triple);
      tripleCount++
    }

    console.log("export | adding labels");
    let idx = 0
    for await (const triple of triples()) {
      console.log(idx, tripleCount)
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
