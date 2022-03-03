
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

Deno.test("TwoPartRelationship", () => {
  const pairs = [
    ['(foo BAR)', [
      ['is', 'BAR', 'Entity'],
      ['foo', 'BAR', 'Entity']]
    ],
    ['(foo "bar")', [
      ['is', 'bar', 'Entity'],
      ['foo', 'bar', 'Entity']]
    ]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.TwoPartRelationship.tryParse(tcase)
    assert(Array.isArray(ast))
    assert(ast.length === result.length, `mismatch of ast, result length: ${JSON.stringify(ast, null, 2)}`)
    assert(Array.isArray(ast[0]))

    for (let idx = 0; idx < result[0].length; idx++) {
      assertEquals(result[0][idx], ast[0][idx])
    }
  }
});

Deno.test("TwoPartRelationship", () => {
  const pairs = [
    ['(foo BAR)', [
      ['is', 'BAR', 'Entity'],
      ['foo', 'BAR']]
    ],
    ['(foo "bar")', [
      ['is', 'bar', 'Entity'],
      ['foo', 'bar']]
    ]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.TwoPartRelationship.tryParse(tcase)
    assert(Array.isArray(ast))
    assert(ast.length === result.length, `mismatch of ast, result length: ${JSON.stringify(ast, null, 2)}`)
    assert(Array.isArray(ast[0]))

    for (let idx = 0; idx < result[0].length; idx++) {
      assertEquals(result[0][idx], ast[0][idx])
    }
  }
});

Deno.test("ThreePartRelationship", () => {
  const pairs = [
    ['(foo BAR baz)', [
      ['is', 'BAR', 'baz'],
      ['foo', 'BAR']]
    ],
    ['(foo BAR (baz bing))', [
      ['is', 'BAR', 'baz'],
      ['is', 'BAR', 'bing'],
      ['foo', 'BAR']]
    ]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.ThreePartRelationship.tryParse(tcase)
    assert(Array.isArray(ast))
    assert(ast.length === result.length, `mismatch of ast, result length: ${JSON.stringify(ast, null, 2)}`)
    assert(Array.isArray(ast[0]))

    for (let idx = 0; idx < result[0].length; idx++) {
      assertEquals(result[0][idx], ast[0][idx])
    }
  }
});

Deno.test("OnePartEntity", () => {
  const pairs = [
    ['(foo)', [
      ['is', 'foo', 'Entity']
    ]]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.OnePartEntity.tryParse(tcase)
    assert(Array.isArray(ast))
    assert(ast.length === result.length, `mismatch of ast, result length: ${JSON.stringify(ast, null, 2)}`)
    assert(Array.isArray(ast[0]))

    for (let idx = 0; idx < result[0].length; idx++) {
      assertEquals(result[0][idx], ast[0][idx])
    }
  }
});

Deno.test("TwoPartEntity", () => {
  const pairs = [
    ['(foo bar)', [
      ['is', 'foo', 'bar']
    ]],
    ['(foo (bar baz))', [
      ['is', 'foo', 'bar'],
      ['is', 'foo', 'baz']
    ]]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.TwoPartEntity.tryParse(tcase)
    assert(Array.isArray(ast))
    assert(ast.length === result.length, `mismatch of ast, result length: ${JSON.stringify(ast, null, 2)}`)
    assert(Array.isArray(ast[0]))

    for (let idx = 0; idx < result[0].length; idx++) {
      assertEquals(result[0][idx], ast[0][idx])
    }
  }
});


Deno.test("FullEntity", () => {
  const src0 = `(entname enttype
  (relname0 "reltgt0" reltype0)
  (relname1 reltgt1))`

  const pairs = [
    [src0, [
      ['is', 'entname', 'enttype'],
      ['is', 'reltgt0', 'reltype0'],
      ['relname0', 'entname', 'reltgt0'],
      ['is', 'reltgt1', 'Entity'],
      ['relname1', 'entname', 'reltgt1'],
    ]]
  ]

  for (const [tcase, result] of pairs) {
    const ast = Lang.FullEntity.tryParse(tcase)
    assert(Array.isArray(ast))
    assert(ast.length === result.length, `mismatch of ast, result length: ${JSON.stringify(ast, null, 2)}`)

    for (const subarray of ast) {
      assert(Array.isArray(subarray))
    }

    for (let idx = 0; idx < result.length; idx++) {
      for (let jdx = 0; jdx < result[idx].length; jdx++) {
        assertEquals(result[idx][jdx], ast[idx][jdx])
      }
    }
  }
});
