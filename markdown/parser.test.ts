import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.127.0/testing/asserts.ts";
import { MarkdownLanguage } from "./parser.ts";
import { CodeBlockBody, Header } from "./model.ts";

const Lang = MarkdownLanguage;

const astMessage = (got: any, expected: any): string => {
  return `got ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`;
};

Deno.test("Header", () => {
  const pairs: any = [
    ["### This is a Header", new Header(3, "This is a Header")],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.Header.tryParse(tcase);

    assert(ast instanceof Header);
    assert(result.equals(ast));
  }
});

Deno.test("CodeBlockBody", () => {
  const delim = "```";
  const src = `
${delim}
this is a test
 test test test
     more test
${delim}
`;
const tgt = `
this is a test
 test test test
     more test
`

  const pairs: any = [
    [src, new CodeBlockBody(undefined, tgt)],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.CodeBlockBody.tryParse(tcase);

    assert(ast instanceof CodeBlockBody);
    assert(result.equals(ast), astMessage(ast, result));
  }
});

// covers most markdown features to cover
const document = `
# Heading

short paragraph

longer paragraph
split across sentences

-----------------------

- this
- is
- a
- list

- [ ] an todo
- [ ] a todo two

> a quote

> a much
> longer quote

1. foo
2. bar
3. baz

![bing](baz)

testing [foo](bar)

[test][1]

[1]: foobar
`

Deno.test("Body", () => {
  const pairs: any = [
    [document, 10],
  ];

  for (const [tcase, result] of pairs) {
    const ast = Lang.Body.tryParse(tcase);
  }
});
