import { AxonLanguage } from "../axon-lang/parser.ts";
import { MarkdownLanguage } from "../markdown/parser.ts";
import { AxonLangParser } from '../axon-lang/parser.ts';

// compose languages
import "https://unpkg.com/parsimmon@1.18.1/build/parsimmon.umd.min.js";
import { NoteContext } from "../notes/note.ts";

const P = (window as any).Parsimmon;
export const AxonNoteLanguage = (ctx: NoteContext) => {
  const axonLang = AxonLanguage(ctx);

  return P.createLanguage({
    ...axonLang,
    Sep: function (): any {
      return P.regexp(/^[\-]{3}\n/);
    },
    Any: function (): any {
      return P.regexp(/.+/);
    },
    Note: function (rules: any): any {
      const { Program, Sep, Any } = rules;
      return P.seq(
        Program,
        Sep,
        Any,
      );
    },
  });
};

export class AxonNoteParser {
  static parse(context: NoteContext, content: string) {
    const lang = AxonNoteLanguage(context)

    return lang.Note.tryParse(content)
  }
}
