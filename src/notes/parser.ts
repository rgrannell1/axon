import { Triple } from "../commons/model.ts";
import { AxonEntities, AxonRels } from "../commons/constants.ts";
import { NoteContext } from "../notes/context.ts";

/*
 *  Parser axon frontmatter
 */
export class AxonLanguage {
  ctx: NoteContext;

  constructor(ctx: NoteContext) {
    this.ctx = ctx;
  }

  parse(data: any): Triple[] {
    const triples: Triple[] = [];

    if (!Array.isArray(data)) {
      const msg = `frontmatter not an array in ${this.ctx.fpath()}`;
      throw new Error(msg);
    }

    for (const rels of data) {
      const id = rels?.id;
      if (!id) {
        throw new Error(`id missing from entity in ${this.ctx.fpath()}: ${rels}`);
      }
      const entname = id;

      for (const [relsym, tgt] of Object.entries(rels)) {
        const relname = relsym;

        if (typeof tgt === "string") {
          triples.push(new Triple(relname, entname, tgt as any));
          continue;
        }

        if (Array.isArray(tgt)) {
          for (const subtgt of (tgt as any)) {
            if (typeof subtgt === "string") {
              const subname = subtgt;
              triples.push(
                new Triple(AxonRels.IS, subtgt, AxonEntities.TOP_TYPE),
              );
              triples.push(new Triple(relname, entname, subname));
            }

            // declares entity with a type
            if (Array.isArray(subtgt)) {
              const [tgtname, tgttype] = subtgt;
              triples.push(
                new Triple(
                  AxonRels.IS,
                  tgtname,
                  tgttype,
                ),
              );

              triples.push(new Triple(relname, entname, tgtname));
            }
          }

          continue;
        }
      }
    }

    return triples.map((triple) => triple.applyCtx(this.ctx));
  }
}