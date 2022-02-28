import "https://unpkg.com/parsimmon@1.18.1/build/parsimmon.umd.min.js";

const P = (window as any).Parsimmon;

export const MarkdownLanguage = P.createLanguage({
  Heading(rules: any): any {
    return P.regexp(/^[#]{1,6}.+/);
  },
  CodeBlockBody(rules: any) {
    return P.regexp(/.+(?!^```)/s);
  },
  CodeBlock(rules: any) {
    return rules.CodeBlockBody.wrap(P.string("```"), P.string("```"));
  },
  Components(rules: any): any {
    return P.alt(rules.Heading, rules.CodeBlock);
  },
  Body(rules: any): any {
    return rules.Components.trim(P.optWhitespace).many();
  },
});
