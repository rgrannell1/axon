import { Triple } from "../commons/model.ts";
import logic from "https://raw.githubusercontent.com/rgrannell1/LogicTS/master/logic.ts";
const $lvar = logic.lvar;

const $or = logic.or;
const $and = logic.and;
const $eq = logic.eq;

export class Facts {
  triples: Triple[];

  constructor(triples: Triple[]) {
    this.triples = triples;
  }

  /*
   * Encode all triples as logic bindings.
   *
   */
  fromTriples($rel: any, $src: any, $tgt: any) {
    return $or(...this.triples.map((triple) => {
      return $and(
        $eq($rel, triple.relname),
        $eq($src, triple.src),
        $eq($tgt, triple.tgt),
      );
    }));
  }

  /*
   * Enumerates all triples given variable bindings.
   *
   */
  all($rel: any, $src: any, $tgt: any): [string, string, string][] {
    return this.fromTriples($rel, $src, $tgt);
  }

  is($src: any, $tgt: any) {
    return this.fromTriples("is", $src, $tgt);
  }

  has($src: any, $tgt: any) {
    return this.fromTriples("has", $src, $tgt);
  }

  rels($rel) {
    return $or(...this.triples.map((triple) => {
      return $eq($rel, triple.relname);
    }));
  }
}

/*
 * Search
 */
export class Search {
  facts: Facts;

  constructor(facts: Facts) {
    this.facts = facts;
  }

  /*
   * List relationships
   */
  rels(): string[] {
    const $rel = $lvar();
    const rels = logic.run(this.facts.rels($rel), [$rel]);

    const set: Set<string> = new Set(rels.map((bindings) => bindings[0]));

    return Array.from(set).sort();
  }

  /*
   * List entities
   */
  entities(): string[] {
    const $rel = $lvar();
    const $src = $lvar();
    const $tgt = $lvar();
    const entities = logic.run(this.facts.all($rel, $src, $tgt), [$src, $tgt]);

    const names: Set<string> = new Set();

    for (const entity of entities) {
      names.add(entity[0]);
      names.add(entity[1]);
    }

    return Array.from(names).sort();
  }
}
