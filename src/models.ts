/*
 * Things this module uses, like Entity, Knowledge, Subsumption
 *
 */

// check json schema using
import Ajv from 'https://esm.sh/ajv';
import axonSchema from "../schemas/axon.json" assert { type: "json" };


export class Entity {
  id: string;
  parents = new Set<string>();
  static pseudorelationships = new Set(["is", "id"]);
  relationships: Record<string, any> = {};

  static axonSchema = (new Ajv({
    allowMatchingProperties: true
  })).addSchema(axonSchema, 'axon');

  static schema = Entity.axonSchema.getSchema('axon#Axon/Thing');

  constructor(val: { id: string }) {
    this.id = val.id;

    for (const [relname, rels] of Object.entries(val)) {
      const relVals = Array.isArray(rels) ? rels : [rels];
      if (relname === "is") {
        for (const parent of relVals) {
          this.parents.add(parent as string);
        }
      }

      if (Entity.pseudorelationships.has(relname)) {
        continue;
      }

      this.relationships[relname] = relVals;
    }
  }

  is(concept: string): boolean {
    return this.parents.has(concept);
  }

  static from(val: any): Entity {
    const validate =  Entity.schema as any;
    const valid = validate(val);

    if (!valid) {
      console.error(validate.errors)
      throw new Error('failed to validate entity, see error above.')
    }

    return new Entity(val);
  }
}

// Schema
const Concept = function (schema: AxonSchema) {
  const keys = new Set<string>(Object.keys(schema.patterns));

  const newConceptClass = class extends Entity {
    static fromEntity(entity: Entity) {
      const thing = new this({ id: entity.id });

      thing.parents = new Set(Array.from(entity.parents));

      for (const [rel, relval] of Object.entries(entity.relationships)) {
        if (!keys.has(rel)) {
          thing.relationships[rel] = relval;
        }
      }

      for (const rel of keys) {
        (thing as any)[rel] = entity.relationships[rel];
      }

      return thing;
    }
  };

  Object.defineProperty(newConceptClass, "name", {
    value: schema.id,
  });

  return newConceptClass;
};

class AxonSchema extends Entity {
  patterns: Record<string, any> = {};
  forall: string[] = [];

  static assertValidForall(entity: Entity) {
    if (!entity.relationships.forall) {
      throw new TypeError("Axon/Schema requires relationship forall");
    }

    for (const concept of entity.relationships.forall) {
      if (typeof concept !== "string") {
        throw new TypeError(
          "Axon/Schema requires relationship forall to be a list of strings",
        );
      }
    }
  }

  static fromEntity(entity: Entity): AxonSchema {
    AxonSchema.assertValidForall(entity);

    const schema = new AxonSchema({ id: entity.id });
    schema.id = entity.id;
    schema.parents = new Set(Array.from(entity.parents));
    schema.forall = entity.relationships.forall;

    for (const [relname, pattern] of Object.entries(entity.relationships)) {
      if (relname !== "forall") {
        schema.patterns[relname] = pattern;
      }
    }

    return schema;
  }

  test(entity: Entity, subsumptions: Subsumptions) {
    const match = this.forall.some((concept: string) => {
      return subsumptions.is(entity.id, concept);
    });

    if (!match) {
      return;
    }

    for (const [rel, pattern] of Object.entries(this.patterns)) {
      if (!entity.relationships.hasOwnProperty(rel)) {
        throw new TypeError(
          `entity ${entity.id} is required by ${this.id} to have relationship "${rel}"`,
        );
      }

      const candidate = entity.relationships[rel];

      const candidateNested = Array.isArray(candidate[0])
        ? candidate
        : [candidate];

      const nested = Array.isArray(pattern[0]) ? pattern : [pattern];

      for (const partialPattern of nested) {
        const [src, tgt] = partialPattern;

        const matched = candidateNested.some((relPart: any) => {
          if (relPart.length !== 2) {
            return false;
          }

          return (src === relPart[0] || src === "_") &&
            (tgt === "_" || subsumptions.is(relPart[1], tgt));
        });

        if (!matched) {
          throw new TypeError(
            `entity ${entity.id} is required by ${this.id} to match pattern, but failed to match ${rel} ${
              JSON.stringify(candidate)
            } onto ${partialPattern}`,
          );
        }
      }
    }
  }
}

export class Subsumptions {
  graph: Record<string, Set<string>>;
  constructor() {
    this.graph = {};
  }

  add(child: string, parent: string) {
    this.graph.hasOwnProperty(child)
      ? this.graph[child].add(parent)
      : this.graph[child] = new Set<string>([parent]);
  }

  record(entity: Entity) {
    for (const parent of entity.parents) {
      this.add(entity.id, parent);
    }
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
}

export class Knowledge {
  schemas: Record<string, AxonSchema> = {};
  subsumptions = new Subsumptions();

  constructor() {
  }

  addEntity(entity: Entity) {
    this.subsumptions.record(entity);

    for (const schema of Object.values(this.schemas)) {
      schema.test(entity, this.subsumptions);
    }

    if (this.subsumptions.is(entity.id, "Axon/Schema")) {
      this.schemas[entity.id] = AxonSchema.fromEntity(entity);
    }
  }

  concept(name: string) {
    const schema = this.schemas[name];

    if (typeof schema === "undefined") {
      throw new TypeError(
        `schema ${name} is not present in the knowledge base. List of present schemas [${Object.keys(this.schemas)}]`,
      );
    }

    return Concept(schema);
  }
}

export type EntityStream = AsyncGenerator<Entity, any, any>
