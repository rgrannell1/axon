
import { assertEquals, assert } from "https://deno.land/std@0.127.0/testing/asserts.ts";
import {AxonLanguage} from './parser.ts'
import { NoteContext } from "../notes/note.ts";

const Lang = AxonLanguage(new NoteContext({
  $filename: 'test-file'
}))

// Compact form: name and function
Deno.test("String", () => {
  const ast = Lang.String.tryParse('"abc"');
  assertEquals(ast, "abc");
});

Deno.test("Symbol", () => {
  const pairs = [
    ["$filename", "$filename"],
    ["foo/bar", "foo/bar"]
  ]

  for (const [tcase, result] of pairs) {
    assertEquals(Lang.Symbol.tryParse(tcase), result)
  }
});

Deno.test("Type", () => {
  const pairs = [
    ['"$filename"', "$filename"],
    ["foo/bar", "foo/bar"]
  ]

  for (const [tcase, result] of pairs) {
    assertEquals(Lang.Type.tryParse(tcase), result)
  }
});

Deno.test("Typelist", () => {
  const pairs = [
    ['("foo/bar" Test)', ["foo/bar", "Test"]]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.Typelist.tryParse(tcase)

    assert(Array.isArray(ast))
    assert(ast.length === result.length)
    for (let idx = 0; idx < result.length; ++idx) {
      assertEquals(ast[idx], result[idx])
    }
  }
});

Deno.test("TypeDeclaration", () => {
  const pairs = [
    ['foo', ['foo']],
    ['("foo/bar" Test)', ["foo/bar", "Test"]]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.TypeDeclaration.tryParse(tcase)

    assert(Array.isArray(ast))
    assert(ast.length === result.length)
    for (let idx = 0; idx < result.length; ++idx) {
      assertEquals(ast[idx], result[idx])
    }
  }
});

Deno.test("RelationshipName", () => {
  const pairs = [
    ['foo', 'foo'],
    ['"foo"', 'foo'],
    ["$filename", "test-file"],
    ['$filename', "test-file"]
  ]

  for (const [tcase, result] of pairs) {
    for (const [tcase, result] of pairs) {
      assertEquals(Lang.RelationshipName.tryParse(tcase), result)
    }
  }
});

Deno.test("EntityName", () => {
  const pairs = [
    ['foo', 'foo'],
    ['"foo"', 'foo'],
    ["$filename", "test-file"],
    ['$filename', "test-file"]
  ]

  for (const [tcase, result] of pairs) {
    for (const [tcase, result] of pairs) {
      assertEquals(Lang.EntityName.tryParse(tcase), result)
    }
  }
});

Deno.test("RelationshipEntityPairs", () => {
  const pairs: any[] = [
    ['((foo (bar baz)))', ['foo', ['bar', 'baz']]],
    ['((foo bar))', ['foo', ['bar']]],
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.RelationshipEntityPairs.tryParse(tcase)
    console.log(ast)
    throw 'xx'
  }
})
