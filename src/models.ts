/*
 * Things this module uses, like thing, Knowledge, Subsumption
 *
 */

// check json schema using
import Ajv from "https://esm.sh/ajv";
import axonSchema from "../schemas/axon.json" assert { type: "json" };
import { id } from "./utils.ts";

type entityType = string | number | (string | number | (string | number)[])[];

const axonSchemaAvj = (new Ajv({
  allowMatchingProperties: true,
})).addSchema(axonSchema, "axon");

export class Triple {
  src: any;
  rel: any;
  tgt: any;

  constructor(src: any, rel: any, tgt: any) {
    for (const bit of [src, rel, tgt]) {
      if (Array.isArray(bit)) {
        throw new TypeError(
          `triple cannot contain array ${JSON.stringify([src, rel, tgt])}`,
        );
      }
    }

    this.src = src;
    this.rel = rel;
    this.tgt = tgt;
  }

  hash() {
    return id(this.src, this.rel, this.tgt);
  }
}

const axonThingChecker: any = axonSchemaAvj.getSchema("axon#Axon/Thing");

/**
 * Things; they have an id, a schema optionally, and relationships to other things.
 *
 * @export
 * @class Thing
 */
export class Thing {
  data: Record<string, entityType>;
  constructor(data: any) {
    if (typeof data !== "object") {
      throw new TypeError("attempted to convert string, requires object");
    }

    const valid = axonThingChecker(data);

    if (!valid) {
      console.error(axonThingChecker.errors);
      console.error(JSON.stringify(data, null, 2));
      throw new TypeError("invalid thing");
    }

    this.data = data;
  }

  static fromTriples(triples: Triple[]): any {
    const data: Record<string, any> = {};

    for (const triple of triples) {
      data.id = triple.src;

      if (!data.hasOwnProperty(triple.rel)) {
        data[triple.rel] = [triple.tgt];
      } else {
        if (triple.rel === "id") {
          continue;
        }
        data[triple.rel].push(triple.tgt);
      }
    }

    return new Thing(data);
  }

  get(prop: string): any {
    const val = this.data[prop];

    if (typeof val === "string") {
      return [val];
    } else {
      return val;
    }
  }

  has(prop: string): boolean {
    return this.data.hasOwnProperty(prop);
  }

  get id(): string {
    return this.data.id as string;
  }

  parents() {
    return new Set(this.get("is") as string[]);
  }

  *triples() {
    for (const [rel, tgt] of Object.entries(this.data)) {
      if (Array.isArray(tgt)) {
        for (const bit of tgt) {
          if (Array.isArray(bit)) {
            yield new Triple(bit[0], "is", bit[1]);
            yield new Triple(this.id, rel, bit[0]);
          } else {
            yield new Triple(this.id, rel, bit);
          }
        }
      } else {
        yield new Triple(this.id, rel, tgt);
      }
    }
  }
}

/**
 * Learn about subsumptions from provided things
 *
 * @export
 * @class Subsumptions
 */
export class Subsumptions {
  graph: Record<string, Set<string>>;
  schemas: Record<string, string>;

  constructor() {
    this.graph = {};
    this.schemas = {
      "Axon/Thing": "#Axon/Thing",
    };
  }

  add(child: string, parent: string) {
    this.graph.hasOwnProperty(child)
      ? this.graph[child].add(parent)
      : this.graph[child] = new Set<string>([parent]);
  }

  addSchema(child: string, schema: string[]) {
    if (schema.length > 0) {
      this.schemas[child] = schema[0];
    }
  }

  record(thing: Thing) {
    for (const parent of thing.parents()) {
      this.add(thing.id, parent);
    }

    if (thing.has("schema")) {
      this.addSchema(thing.id, thing.get("schema"));
    }

    return this.subsumedBy(thing.id);
  }

  is(src: string, tgt: string) {
    if (src === tgt) {
      return true;
    }

    const visited = new Set<string>();
    const queue = [src];

    while (queue.length > 0) {
      let curr = queue.pop();

      if (!curr) {
        break;
      }
      if (visited.has(curr)) {
        continue;
      }

      const parents = this.graph.hasOwnProperty(curr)
        ? this.graph[curr]
        : new Set<string>();

      for (const parent of Array.from(parents)) {
        if (!visited.has(parent)) {
          if (parent === tgt) {
            return true;
          }

          queue.push(parent);
        }
      }
    }

    return false;
  }

  subsumedBy(src: string): Set<string> {
    const visited = new Set<string>();
    const queue = [src];
    const concepts = new Set<string>(["Axon/Thing"]);

    while (queue.length > 0) {
      let curr = queue.pop();

      if (!curr) {
        break;
      }
      if (visited.has(curr)) {
        continue;
      }
      if (src !== curr) {
        concepts.add(curr);
      }

      const parents = this.graph.hasOwnProperty(curr)
        ? this.graph[curr]
        : new Set<string>();

      for (const parent of Array.from(parents)) {
        if (!visited.has(parent)) {
          queue.push(parent);
        }
      }
    }

    return concepts;
  }
}

/**
 * Check things against their schemas, and learn about their
 * subsumption hierarchy (i.e inheritance chain)
 *
 * @export
 * @class Knowledge
 */
export class Knowledge {
  subsumptions = new Subsumptions();

  schemas(concepts: Set<string>) {
    const relevantSchemas: any[] = [];

    for (const concept of concepts) {
      const ref = this.subsumptions.schemas[concept];

      if (ref && ref.startsWith("#")) {
        const data = axonSchemaAvj.getSchema(`axon${ref}`);
        if (data?.schema) {
          relevantSchemas.push(data);
        } else {
          throw new TypeError(
            `failed to retrieve schema for ${ref} (concept ${concept})`,
          );
        }
      }
    }

    return relevantSchemas;
  }

  addThing(thing: Thing) {
    const concepts = this.subsumptions.record(thing);

    for (const schema of this.schemas(concepts)) {
      const valid = schema(thing.data);
      if (!valid) {
        console.error(schema.errors);
        throw new TypeError(
          `thing with concepts [${concepts}] did not match schema, see above errors.`,
        );
      }
    }
  }

  parents: Record<string, Set<string>> = {};
  commutativeRelationships = new Set<string>();
  invertibleRelationships: Record<string, Set<string[]>> = {};

  async *addTriple(triple: Triple) {
    const {src, rel, tgt} = triple

    // order sensitive; load ontology first!

    // add role knowledge
    if (rel === 'is') {
      if (!this.parents[src]) {
        this.parents[src] = new Set();
      }
      this.parents[src].add(tgt)

    } else if (rel === 'includes') {
      if (!this.parents[tgt]) {
        this.parents[tgt] = new Set();
      }
      this.parents[tgt].add(src)
    }

    // add commutative relationships
    if (rel === 'is' && tgt === 'Axon_Commutative_Relationship') {
      this.commutativeRelationships.add(src);
      return
    }
    if (rel === 'includes' && src === 'Axon_Commutative_Relationship') {
      this.commutativeRelationships.add(tgt);
      return
    }
    // add invertible relationships
    if (rel === 'is' && tgt === 'Axon_Invertible_Relationship') {
      if (!this.invertibleRelationships[src]) {
        this.invertibleRelationships[src] = new Set<string[]>();
      }
      return
    }
    if (rel === 'includes' && src === 'Axon_Invertible_Relationship') {
      if (!this.invertibleRelationships[tgt]) {
        this.invertibleRelationships[tgt] = new Set<string[]>();
      }
      return
    }

    if (rel === 'inverse') {
      if (!this.invertibleRelationships[src]) {
        this.invertibleRelationships[src] = new Set<string[]>();
      }

      this.invertibleRelationships[src].add(tgt)
      return
    }

    if (this.commutativeRelationships.has(rel)) {
      yield new Triple(tgt, rel, src);
    }

    if (this.invertibleRelationships[rel]) {
      for (const inverse of this.invertibleRelationships[rel]) {
        yield new Triple(tgt, inverse, src)
      }
    }
  }
}

/*
 * Plugin state, which can be stored in Axon
 *
 */
export class State {
  data: any;
  constructor(data: string) {
    try {
      this.data = JSON.parse(data);
    } catch (err) {
      throw new Error(`failed to parse plugin state as JSON\n${data}`);
    }
  }

  static load(data: string) {
    return new State(data);
  }

  json() {
    return JSON.stringify(this.data);
  }
}

export type ThingStream = AsyncGenerator<Thing, any, any>;
