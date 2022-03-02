import "https://unpkg.com/parsimmon@1.18.1/build/parsimmon.umd.min.js";
import { NoteContext } from "../notes/note.ts";

const P = (window as any).Parsimmon;
export const AxonLanguage = (ctx: NoteContext) => {
  const Atoms = {
    String(): any {
      return P.regexp(/[^"]+/)
      .wrap(P.string('"'), P.string('"'))
      .desc("string");
    },
    Symbol(): any {
      return P.regexp(/[a-zA-Z0-9\$][a-zA-Z0-9\-_\/]*/).desc("symbol");
    },
  };

  const OPEN_PAREN = "(";
  const CLOSE_PAREN = ")";

  const Types = {
    optSpacing(rules: any): any {
      return P.regexp(/\s*/s)
    },

    // type definition
    Typelist(rules: any): any {
      return rules.Type.trim(P.optWhitespace)
        .many()
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("TypeList");
    },
    Type(rules: any): any {
      return P.alt(
        rules.Symbol,
        rules.String,
      ).desc("Type");
    },
    TypeDeclaration(rules: any): any {
      return P.alt(rules.Type, rules.Typelist).desc("TypeDeclaration").map((types: any) => {
        return Array.isArray(types) ? types : [types]
      });
    },
  };

  const Names = {
    // relationship definition
    RelationshipName(rules: any): any {
      return P.alt(rules.Symbol, rules.String)
        .desc("RelationshipName")
        .map((str: string) => ctx.replace(str));
    },

    // entity definition
    EntityName(rules: any): any {
      return P.alt(rules.Symbol, rules.String)
        .desc("EntityName")
        .map((str: string) => ctx.replace(str));
    },
  };

  /*
   * (abc)
   */
  const Relationships = {
    TwoPartRelationship(rules: any): any {
      return P.seq(
        rules.RelationshipName.trim(P.optWhitespace),
        rules.EntityName.trim(P.optWhitespace),
      ).trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("TwoPartRelationship").map((rel: string[]) => {
          return [
            ['is', rel[1], 'Entity'],
            [rel[0], rel[1]]
          ]
        });
    },

    ThreePartRelationship(rules: any): any {
      return P.seq(
        rules.RelationshipName.trim(P.optWhitespace),
        rules.EntityName.trim(P.optWhitespace),
        rules.TypeDeclaration,
      ).trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN))
        .desc("ThreePartRelationship")
        .map((rel: any[]) => {
          const types = rel[2]

          return [
            ...types.map((type: string) => ['is', rel[1], type]),
            [rel[0], rel[1]]
          ]
        })
    },

    NestedNameRelationship(rules: any): any {
      return P.seq(
        rules.RelationshipName,
        rules.RelationshipEntityPairs,
      ).trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("NestedNameRelationship");
    },

    Relationship(rules: any): any {
      return P.alt(
        rules.TwoPartRelationship,
        rules.ThreePartRelationship // add nested
      ).desc("Relationship");
    },
  };

  const Entities = {
    OnePartEntity(rules: any): any {
      return rules.EntityName
        .trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN))
        .desc("OnePartEntity").map((entity: any) => {
          return [['is', entity, 'Entity']]
        });
    },
    TwoPartEntity(rules: any): any {
      return P.seq(
        rules.EntityName.trim(P.optWhitespace),
        rules.TypeDeclaration.trim(P.optWhitespace),
      )
        .trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("TwoPartEntity").map((entity: any[]) => {
          return entity[1].map((subtype: string) => ['is', entity[0], subtype])
        });
    },
    FullEntity(rules: any): any {
      return P.seq(
        rules.EntityName.trim(P.optWhitespace),
        rules.TypeDeclaration.trim(P.optWhitespace),
        rules.Relationship.trim(P.optWhitespace).times(1, Infinity),
      )
        .trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN))
        .desc("FullEntity")
        .map((entity: any) => {
          let facts = []

          const name = entity[0]
          const types = entity[1]
          const rels = entity.slice(2)

          for (const rel of rels) {
            for (const fact of rel) {
              facts.push([fact[0], name, fact[1]])
            }
          }

          for (const type of types) {
            facts.push(['is', name, type])
          }

          return facts
        });
    },
    Entity(rules: any): any {
      return P.alt(
        rules.OnePartEntity,
        rules.TwoPartEntity,
        rules.FullEntity,
      ).desc("Entity").trim(P.optWhitespace);
    },
  };

  return P.createLanguage({
    ...Types,
    ...Names,
    ...Atoms,
    ...Relationships,
    ...Entities,

    Program(rules: any): any {
      return rules.Entity.trim(P.optWhitespace).many().desc("Program").map((entities: any) => {
        return [].concat(...entities)
      });
    },
  });
}

export class AxonParser {
  static parse(context: NoteContext, content: string) {

  }
}
