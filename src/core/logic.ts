import { AxonEntities } from "../commons/constants.ts";
import { Triple } from "../commons/model.ts";

export class Subsumptions {
  graph: Record<string, Set<string>>;
  conceptNames: Set<string> = new Set();

  constructor() {
    this.graph = {};
  }

  concepts(instance: string) {
    const visited = new Set<string>();
    const queue = [instance];

    const concepts = new Set<string>();
    const start = Date.now()

    while (queue.length > 0) {
      let curr = queue.pop();

      if (!curr || visited.has(curr)) {
        continue;
      }

      if ((Date.now() - start) > 2_000) {
        console.log(curr)
      }

      if (curr !== instance) {
        concepts.add(curr);
      }

      const neighbours = this.graph.hasOwnProperty(curr)
        ? this.graph[curr]
        : new Set<string>();

      for (const neighbour of Array.from(neighbours)) {
        if (!visited.has(neighbour)) {
          queue.push(neighbour);
        }
      }
    }

    concepts.add(AxonEntities.TOP_TYPE);

    return concepts;
  }

  add(triples: Triple[]) {
    for (const triple of triples) {
      const { relname, src, tgt } = triple;

      if (relname !== "is" && relname !== "includes") {
        continue;
      }

      if (relname === "is") {
        this.conceptNames.add(tgt);

        if (this.graph.hasOwnProperty(src)) {
          this.graph[src].add(tgt);
        } else {
          this.graph[src] = new Set<string>([tgt, AxonEntities.TOP_TYPE]);
        }
      }

      if (relname === "includes") {
        this.conceptNames.add(src);

        if (this.graph.hasOwnProperty(tgt)) {
          this.graph[tgt].add(src);
        } else {
          this.graph[tgt] = new Set<string>([src, AxonEntities.TOP_TYPE]);
        }
      }
    }
  }
}
