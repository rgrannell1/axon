import "https://unpkg.com/parsimmon@1.18.1/build/parsimmon.umd.min.js";

const P = (window as any).Parsimmon;
import {
  Header,
  CodeBlockBody,
  Paragraph
} from "./model.ts";

export const MarkdownLanguage = P.createLanguage({
  Header(rules: any): any {
    return P.regexp(/^[#]{1,6}.+/).desc("Header").map((header: string) => {
      const text = header.replace(/^[#]+/, "").trim();
      const level = header.match(/^[#]+/);

      if (!level) {
        throw new Error("level not found");
      }

      return new Header(level[0].length, text);
    });
  },
  CodeBlockBody(rules: any) {
    return P.regex(/```(.+?)```/s, 1)
      .trim(P.optWhitespace)
      .map((text: string) => {
        return new CodeBlockBody(undefined, text);
      });
  },
  Paragraph(rules: any): any {
    return P.regex(/\n[^\n]+\n/s)
      .map((text: string) => {
        return new Paragraph(text);
      })
      .desc('Paragraph');
  },
  Components(rules: any): any {
    return P.alt(
      rules.Header,
      rules.CodeBlockBody,
      rules.Paragraph
    );
  },
  Body(rules: any): any {
    return rules.Components
      .trim(P.optWhitespace)
      .many();
  }
});
