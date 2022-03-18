/*
 * Things this module uses, like thing, Knowledge, Subsumption
 *
 */

// check json schema using
import Ajv from 'https://esm.sh/ajv';
import axonSchema from "../schemas/axon.json" assert { type: "json" };

const axonSchemaAvj = (new Ajv({
    allowMatchingProperties: true
})).addSchema(axonSchema, 'axon');

const axonThingChecker: any = axonSchemaAvj.getSchema('axon#Axon/Thing');

// Axon/Thing.
export type AxonThing = {
  id: string,
  is?: string | [string[]],
  includes?: [string[]],
  forall?: string,
} & {
  [key: string]: string | string[] | (string | [string] | [string, string])[]
  [method: symbol]: any
}

let get = Symbol('get')
let parents = Symbol('parents')

const axonThingMethods = {
  [get] (field: string) {
    if (!(field in this)) {
      return []
    }

    if (Array.isArray(this[field as any])) {
      return this[field as any]
    } else {
      return [this[field as any]];
    }
  },
  [parents] (): Set<string> {
    const part:any = this[get]('is')
    return new Set(part)
  }
}

export const Thing = (val: any): AxonThing => {
  const valid = axonThingChecker(val)

  if (!valid) {
    console.error(valid.errors)
    throw new TypeError('invalid thing')
  }

  // assign a few methods to the object
  return Object.assign(Object.create(axonThingMethods), val)
}


// TODO re-add axonschema

export class Subsumptions {
  graph: Record<string, Set<string>>;
  schemas: Record<string, string>;

  constructor() {
    this.graph = {};
    this.schemas = {
      'Axon/Thing': '#Axon/Thing'
    };
  }

  add(child: string, parent: string) {
    this.graph.hasOwnProperty(child)
      ? this.graph[child].add(parent)
      : this.graph[child] = new Set<string>([parent]);
  }

  addSchema(child: string, schema: string[]) {
    if (schema.length > 0) {
      this.schemas[child] = schema[0]
    }
  }

  record(thing: AxonThing) {
    for (const parent of thing[parents]()) {
      this.add(thing.id, parent);
    }

    this.addSchema(thing.id, thing[get]('schema'))

    return this.subsumedBy(thing.id)
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
    const concepts = new Set<string>(['Axon/Thing']);

    while (queue.length > 0) {
      let curr = queue.pop();

      if (!curr) {
        break;
      }
      if (visited.has(curr)) {
        continue;
      }
      if (src !== curr) {
        concepts.add(curr)
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

export class Knowledge {
//  schemas: Record<string, AxonSchema> = {};
  subsumptions = new Subsumptions();

  schemas(concepts: Set<string>) {
    const joined = {

      allOf: [] as any[]
    }
    for (const concept of concepts) {
      const ref = this.subsumptions.schemas[concept]

      if (ref && ref.startsWith('#')) {
        const data = axonSchemaAvj.getSchema(`axon${ref}`) // TODO security
        if (data?.schema) {
          joined.allOf.push(data.schema)
        } else {
          throw new TypeError(`failed to retrieve schema for ${ref} (concept ${concept})`)
        }
      }

      return joined
    }
  }

  addEntity(thing: AxonThing) {
    const concepts = this.subsumptions.record(thing);

    this.schemas(concepts)


    //
    //    for (const schema of Object.values(this.schemas)) {
//      schema.test(thing, this.subsumptions);
//    }

//    if (this.subsumptions.is(thing.id, "Axon/Schema")) {
//      this.schemas[thing.id] = AxonSchema.fromthing(thing);
//    }
  }
}

export type EntityStream = AsyncGenerator<AxonThing, any, any>
