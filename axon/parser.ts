import { Triple } from "../commons/model.ts";
import { AxonEntities, AxonRels } from "../commons/constants.ts";

/*
  * Any special variables that can be injected into
  * opening frontmatter
  */
export class NoteContext {
  substitutions: Record<string, string>;
  constructor(substitutions: Record<string, string>) {
    this.substitutions = substitutions;
  }
  replace(name: string): string {
    for (const [candidate, replacement] of Object.entries(this.substitutions)) {
      if (name === candidate) {
        return replacement;
      }
    }

    return name;
  }
}

/*
 *  Parser axon frontmatter
 */
export class AxonLanguage {
  ctx: NoteContext;

  constructor(ctx: NoteContext) {
    this.ctx = ctx;
  }

  parse(data: Record<string, any>): Triple[] {
    const triples = [];

    for (const [entsym, rels] of Object.entries(data)) {
      const entname = this.ctx.replace(entsym);

      for (const [relsym, tgt] of Object.entries(rels)) {
        const relname = this.ctx.replace(relsym);

        if (typeof tgt === "string") {
          triples.push(new Triple(relname, entname, tgt));
          continue;
        }

        if (Array.isArray(tgt)) {
          for (const subtgt of tgt) {
            if (typeof subtgt === "string") {
              const subname = this.ctx.replace(subtgt);
              triples.push(
                new Triple(AxonRels.IS, subtgt, AxonEntities.ENTITY),
              );
              triples.push(new Triple(relname, entname, subname));
            }

            // declares entity with a type
            if (Array.isArray(subtgt)) {
              const [tgtname, tgttype] = subtgt;
              triples.push(
                new Triple(
                  AxonRels.IS,
                  this.ctx.replace(tgtname),
                  this.ctx.replace(tgttype),
                ),
              );
              triples.push(relname, entname, tgtname);
            }
          }

          continue;
        }
      }
    }

    return triples;
  }
}
