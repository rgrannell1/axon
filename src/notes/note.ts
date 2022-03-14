import { join } from "https://deno.land/std@0.127.0/path/mod.ts";
import { basename } from "https://deno.land/std@0.110.0/path/mod.ts";
import {
  BlockLexer,
  TokenType,
} from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { AxonLanguage } from "./parser.ts";
import { AxonEntities } from "../commons/constants.ts";
import { createHash } from "https://deno.land/std/hash/mod.ts";
import { Triple } from "../commons/model.ts";
import { INote } from "../interfaces.ts";
import { NoteContext } from "./context.ts";

/*
 * BlockId
 */
class BlockId {
  static PATTERN_OPEN = /\{#(.+)\}/;
  static PATTERN_CLOSE = /\{\/(.+)\}/;
  static BLOCK_ID = AxonEntities.BLOCK_ID;
  static OPEN = "open";
  static CLOSE = "close";

  static parse(content: string | undefined) {
    if (!content) {
      return;
    }

    const openMatch = content.match(BlockId.PATTERN_OPEN);
    if (openMatch) {
      return {
        type: BlockId.BLOCK_ID,
        id: openMatch[1],
        tag: BlockId.OPEN,
      };
    }

    const closeMatch = content.match(BlockId.PATTERN_CLOSE);
    if (closeMatch) {
      return {
        type: BlockId.BLOCK_ID,
        id: closeMatch[1],
        tag: BlockId.CLOSE,
      };
    }
  }
}

// TODO less tightly couple this, other versions might be nice
export class Note implements INote {
  name: string;
  dpath: string;
  fpath: string;
  content?: string;
  hash?: string;

  static NAME = /[0-9]{12} - (.+)\.md/;

  constructor(dpath: string, name: string) {
    this.dpath = dpath;
    this.name = name;
    this.fpath = join(dpath, name);
  }

  async init() {
    this.content = await this.read();
    this.hash = createHash("sha1").update(this.content).toString();
  }

  async read() {
    return Deno.readTextFile(this.fpath);
  }

  lex(content: string) {
    const lex = BlockLexer.lex(content);
    const tokens = lex.tokens.map((token: Record<string, any>) => {
      const blockToken = BlockId.parse(token.text);
      if (blockToken) {
        return blockToken;
      }

      token.type = TokenType[token.type];
      return token;
    });

    return {
      tokens,
      frontmatter: lex.meta,
    };
  }

  fname(): string {
    return basename(this.fpath);
  }

  headingFacts(token: Record<string, any>) {
    return {
      "@type": "MarkdownNote/Heading",
      "depth": token.depth,
      "text": token.text,
    };
  }

  parseText(tokens: Record<string, any>[], ctx: NoteContext) {
    const filename = ctx.substitutions["$filename"];
    const filepath = ctx.substitutions["$filepath"];
    const dpath = ctx.substitutions["$dirpath"];
    const hash = ctx.substitutions["$hash"];

    const note: any = {
      is: ["MarkdownNote", "AxonNote"],
      hash,
      dpath,
      path: filepath,
      name: filename,
      blocks: [],
      frontmatter: [],
      contents: [],
    };

    let prev = note.contents;
    let tgt = note.contents;

    for (const token of tokens) {
      // push the heading
      if (token.type === "heading") {
        tgt.push(this.headingFacts(token));
        continue;
      }

      // we want to save this content of this block as axon facts
      if (token.type === AxonEntities.BLOCK_ID) {
        if (token.tag === "open") {
          const block = {
            is: "MarkdownNote/BlockId",
            id: token.id,
            contents: [],
          };
          note.blocks.push(token.id);
          tgt.push(block);

          tgt = block.contents;
        }

        if (token.tag === "close") {
          tgt = prev;
        }
        continue;
      }

      if (token.type === "code") {
        tgt.push({
          is: "MarkdownNote/CodeBlock",
          text: token.text,
          lang: token.lang ?? "unknown",
        });
        continue;
      }

      if (token.type === "text") {
        tgt.push({
          is: "MarkdownNote/Text",
          text: token.text,
        });
        continue;
      }

      if (token.type === "space") {
        continue;
      }

      tgt.push({
        is: "MarkdownNote/" + token.type,
        text: token.text,
      });
    }

    return note;
  }

  textTriples(note: any) {
    const facts: [any, any, any][] = [];

    facts.push(["id", note.dpath, AxonEntities.VAULT]);
    facts.push(["is", note.dpath, AxonEntities.VAULT]);

    facts.push(["id", note.path, AxonEntities.NOTE]);
    facts.push(["is", note.path, AxonEntities.NOTE]);
    facts.push(["named", note.path, note.name]);
    facts.push(["is", note.name, AxonEntities.NOTE_NAME]);
    facts.push(["part-of", note.path, note.dpath]);

    facts.push(["is", note.hash, AxonEntities.NOTE_HASH]);
    facts.push(["has", note.path, note.hash]);

    return facts.map((fact) => new Triple(fact[0], fact[1], fact[2]));
  }

  id(): string {
    return this.context().id();
  }

  context(): NoteContext {
    if (typeof this.hash === "undefined") {
      throw new TypeError("hash was undefined; was load-called?");
    }

    return new NoteContext({
      $filepath: this.fpath,
      $filename: this.fname(),
      $dirpath: this.dpath,
      $hash: this.hash,
    });
  }

  async *triples() {
    const ctx = this.context();

    // if the file is unchanged, yield previous triples

    try {
      var { frontmatter, tokens } = this.lex(this.content ?? "");
      var noteFacts = this.textTriples(this.parseText(tokens, ctx));
    } catch (err) {
      console.error("file://" + this.fpath);
      throw err;
    }

    const lang = new AxonLanguage(ctx);
    const frontmatterFacts = lang.parse(frontmatter);

    for (const triple of frontmatterFacts.concat(noteFacts)) {
      yield triple;
    }
  }
}
