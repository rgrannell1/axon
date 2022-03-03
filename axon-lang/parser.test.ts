import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.127.0/testing/asserts.ts";
import { AxonLanguage } from "./parser.ts";
import { NoteContext } from "../notes/note.ts";
import { Triple } from "./model.ts";

const Lang = AxonLanguage(
  new NoteContext({
    $filename: "test-file",
  }),
);

const astMessage = (got: any, expected: any): string => {
  return `got ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`;
};

// Compact form: name and function
Deno.test("String", () => {
  const ast = Lang.String.tryParse('"abc"');
  assertEquals(ast, "abc");
});

Deno.test("Symbol", () => {
  const pairs = [
    ["$filename", "$filename"],
    ["foo/bar", "foo/bar"],
  ];

  for (const [tcase, result] of pairs) {
    assertEquals(Lang.Symbol.tryParse(tcase), result);
  }
});

Deno.test("Type", () => {
  const pairs = [
    ['"$filename"', "$filename"],
    ["foo/bar", "foo/bar"],
  ];

  for (const [tcase, result] of pairs) {
    assertEquals(Lang.Type.tryParse(tcase), result);
  }
});

Deno.test("Typelist", () => {
  const pairs = [
    ['("foo/bar" Test)', ["foo/bar", "Test"]],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.Typelist.tryParse(tcase);

    assert(Array.isArray(ast));
    assert(ast.length === result.length);
    for (let idx = 0; idx < result.length; ++idx) {
      assertEquals(ast[idx], result[idx]);
    }
  }
});

Deno.test("TypeDeclaration", () => {
  const pairs = [
    ["foo", ["foo"]],
    ['("foo/bar" Test)', ["foo/bar", "Test"]],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.TypeDeclaration.tryParse(tcase);

    assert(Array.isArray(ast));
    assert(ast.length === result.length);
    for (let idx = 0; idx < result.length; ++idx) {
      assertEquals(ast[idx], result[idx]);
    }
  }
});

Deno.test("RelationshipName", () => {
  const pairs = [
    ["foo", "foo"],
    ['"foo"', "foo"],
    ["$filename", "test-file"],
    ["$filename", "test-file"],
  ];

  for (const [tcase, result] of pairs) {
    for (const [tcase, result] of pairs) {
      assertEquals(Lang.RelationshipName.tryParse(tcase), result);
    }
  }
});

Deno.test("EntityName", () => {
  const pairs = [
    ["foo", "foo"],
    ['"foo"', "foo"],
    ["$filename", "test-file"],
    ["$filename", "test-file"],
  ];

  for (const [tcase, result] of pairs) {
    for (const [tcase, result] of pairs) {
      assertEquals(Lang.EntityName.tryParse(tcase), result);
    }
  }
});

Deno.test("TwoPartRelationship", () => {
  const pairs = [
    ["(has baz)", [
      new Triple("is", "baz", "Entity"),
      new Triple("has", undefined, "baz"),
    ]],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.TwoPartRelationship.tryParse(tcase);
    assert(Array.isArray(ast));

    for (let idx = 0; idx < result.length; ++idx) {
      assert(ast[idx] instanceof Triple);
      assert(ast[idx].equals(result[idx]), astMessage(ast[idx], result[idx]));
    }
  }
});

Deno.test("ThreePartRelationship", () => {
  const pairs = [
    ["(foo BAR baz)", [
      new Triple("is", "BAR", "baz"),
      new Triple("foo", undefined, "BAR"),
    ]],
    ["(foo BAR (baz bing))", [
      new Triple("is", "BAR", "baz"),
      new Triple("is", "BAR", "bing"),
      new Triple("foo", undefined, "BAR"),
    ]],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.ThreePartRelationship.tryParse(tcase);
    assert(Array.isArray(ast), "ast not an array");

    for (let idx = 0; idx < result.length; ++idx) {
      assert(ast[idx] instanceof Triple);
      assert(ast[idx].equals(result[idx]), astMessage(ast[idx], result[idx]));
    }
  }
});

Deno.test("OnePartEntity", () => {
  const pairs: any = [
    ["(foo)", [
      new Triple("is", "foo", "Entity"),
    ]],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.OnePartEntity.tryParse(tcase);
    assert(Array.isArray(ast));

    for (let idx = 0; idx < result.length; ++idx) {
      assert(ast[idx] instanceof Triple);
      assert(ast[idx].equals(result[idx]));
    }
  }
});

Deno.test("TwoPartEntity", () => {
  const pairs = [
    ["(foo BAR)", [
      new Triple("is", "foo", "BAR"),
    ]],
    ['(foo "bar")', [
      new Triple("is", "foo", "bar"),
    ]],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.TwoPartEntity.tryParse(tcase);
    assert(Array.isArray(ast));

    for (let idx = 0; idx < result.length; ++idx) {
      assert(ast[idx] instanceof Triple, "not a triple");
      assert(ast[idx].equals(result[idx]), "triple did not match");
    }
  }
});

Deno.test("FullEntity", () => {
  const src0 = `(entname enttype
  (relname0 "reltgt0" reltype0)
  (relname1 reltgt1))`;

  const pairs = [
    [src0, [
      new Triple("is", "entname", "enttype"),
      new Triple("is", "reltgt0", "reltype0"),
      new Triple("relname0", "entname", "reltgt0"),

      new Triple("is", "reltgt1", "Entity"),
      new Triple("relname1", "entname", "reltgt1"),
    ]],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.FullEntity.tryParse(tcase);
    assert(Array.isArray(ast));

    for (let idx = 0; idx < result.length; idx++) {
      assert(ast[idx] instanceof Triple, "not a triple");
      assert(ast[idx].equals(result[idx]), "triple did not match");
    }
  }
});
