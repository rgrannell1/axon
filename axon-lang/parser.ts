import "https://unpkg.com/parsimmon@1.18.1/build/parsimmon.umd.min.js";
import { NoteContext } from "../notes/note.ts";

const P = (window as any).Parsimmon;
const AxonLanguage = (ctx: NoteContext) => {
  const Atoms = {
    String(): any {
      return P.regexp(/\"[^"]+\"/).desc("string");
    },
    Symbol(): any {
      return P.regexp(/[a-zA-Z0-9\$][a-zA-Z0-9\-_\/]*/).desc("symbol");
    },
  };

  const OPEN_PAREN = "(";
  const CLOSE_PAREN = ")";

  const Types = {
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
      return P.alt(rules.Type, rules.Typelist).desc("TypeDeclaration");
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

  const Relationships = {
    RelationshipEntityPairs(rules: any): any {
      const pair = P.seq(
        rules.EntityName.trim(P.optWhitespace),
        rules.TypeDeclaration.trim(P.optWhitespace),
      ).trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("InnerPair");

      return P.seq(
        P.alt(
          rules.RelationshipName,
          pair,
        ),
      ).trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("RelationshipEntityPairs");
    },
    TwoPartRelationship(rules: any): any {
      return P.seq(
        rules.RelationshipName.trim(P.optWhitespace),
        rules.EntityName.trim(P.optWhitespace),
      ).trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("TwoPartRelationship").map((entity: string[]) => {
          return [entity[0], entity[1], 'Entity'];
        });
    },

    ThreePartRelationship(rules: any): any {
      return P.seq(
        rules.RelationshipName,
        rules.EntityName,
        rules.Type,
      ).trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("ThreePartRelationship");
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
        rules.ThreePartRelationship,
        rules.NestedNameRelationship,
      ).desc("Relationship");
    },
  };

  const Entities = {
    OnePartEntity(rules: any): any {
      return rules.EntityName
        .trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("OnePartEntity");
    },
    TwoPartEntity(rules: any): any {
      return P.seq(
        rules.EntityName.trim(P.optWhitespace),
        rules.TypeDeclaration.trim(P.optWhitespace),
      )
        .trim(P.optWhitespace)
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("TwoPartEntity");
    },
    FullEntity(rules: any): any {
      return P.seq(
        rules.EntityName.trim(P.optWhitespace),
        rules.TypeDeclaration.trim(P.optWhitespace),
        rules.Relationship.trim(P.optWhitespace).many(),
      )
        .wrap(P.string(OPEN_PAREN), P.string(CLOSE_PAREN)).desc("FullEntity");
    },
    Entity(rules: any): any {
      return P.alt(
        rules.OnePartEntity,
        rules.TwoPartEntity,
        rules.FullEntity,
      ).desc("Entity");
    },
  };

  return P.createLanguage({
    ...Types,
    ...Names,
    ...Atoms,
    ...Relationships,
    ...Entities,

    Program(rules: any): any {
      return rules.Entity.trim(P.optWhitespace).many().desc("Program");
    },
  });
}

const test = `
($filename (Note)
  (describes ProgrammingLanguage))

(Golang (ProgrammingLanguage)
  (produces Binary))
(Rust (ProgrammingLanguage)
  (produces Binary))
(OCaml (ProgrammingLanguage)
  (produces Binary))
(Haskell (ProgrammingLanguage)
  (produces Binary))
(Nim (ProgrammingLanguage)
  (produces Binary))
(Crystal (ProgrammingLanguage)
  (produces Binary))

(Deno (ProgrammingLanguage)
  (produces Binary))

(Javascript (ProgrammingLanguage))

(Node (ProgrammingLanguage)
  (related-to Javascript))

(Typescript (ProgrammingLanguage)
  (related-to Javascript))

(Bash (ShellLanguage))
(Python (ProgrammingLanguage))

(ProgrammingLanguages-Ref-1 (Description)
  (describes Bash))

(ProgrammingLanguages-Ref-2 (Description)
  (describes Python))

(UseDeno Goal)
`;

export class AxonParser {
  static parse(context: NoteContext, content: string) {
    const ast = AxonLanguage(context).Program.tryParse(test);
    console.log(ast)
  }
}
