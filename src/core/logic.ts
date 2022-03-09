import { AxonEntities } from "../commons/constants.ts";
import { Triple } from "../commons/model.ts";

export class Subsumptions {
  graph: Record<string, Set<string>>;
  concepts: Set<string> = new Set();

  constructor() {
    this.graph = {};
  }

  classes(instance: string) {
    const visited = new Set<string>();
    const queue = [instance];

    const classes = new Set<string>();

    while (queue.length > 0) {
      let curr = queue.pop();

      if (!curr || visited.has(curr)) {
        continue;
      }

      if (curr !== instance) {
        classes.add(curr);
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

    classes.add(AxonEntities.TOP_TYPE);

    return classes;
  }

  add(triples: Triple[]) {
    for (const triple of triples) {
      const { relname, src, tgt } = triple;

      if (relname !== "is") {
        continue;
      }

      this.concepts.add(tgt);

      if (this.graph.hasOwnProperty(src)) {
        this.graph[src].add(tgt);
      } else {
        this.graph[src] = new Set<string>([tgt, AxonEntities.TOP_TYPE]);
      }
    }
  }
}
