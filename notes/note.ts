import { join } from "https://deno.land/std@0.127.0/path/mod.ts";
import { basename } from "https://deno.land/std@0.110.0/path/mod.ts";
import {
  BlockLexer,
  TokenType,
} from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import { AxonLanguage, NoteContext } from "../axon/parser.ts";
import { Triple } from "../commons/model.ts";
import { AxonEntities } from "../commons/constants.ts";

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

export class Note {
  name: string;
  dpath: string;
  fpath: string;

  static NAME = /[0-9]{12} - (.+)\.md/;

  constructor(dpath: string, name: string) {
    this.dpath = dpath;
    this.name = name;
    this.fpath = join(dpath, name);
  }

  async read() {
    return Deno.readTextFile(this.fpath);
  }

  lex(content: string, ctx: NoteContext) {
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
    const base = basename(this.fpath);
    const matches = base.match(Note.NAME);

    if (matches) {
      return matches[1];
    } else {
      throw new Error("could not extract basename.");
    }
  }

  headingFacts(token: Record<string, any>) {
    return [
      new Triple("is", token.text, AxonEntities.HEADING),
      new Triple("is", token.depth, AxonEntities.HEADING_DEPTH),
      new Triple("has", token.text, token.depth),
    ];
  }

  facts(tokens: Record<string, any>[], ctx: NoteContext): Triple[] {
    const triples: Triple[] = [];
    const filename = ctx.substitutions["$filename"];
    const filepath = ctx.substitutions["$filepath"];

    triples.push(
      new Triple("is", filepath, AxonEntities.NOTE),
      new Triple("is", filename, AxonEntities.NOTE_NAME),
      new Triple("has", filepath, filename),
    );

    let blockId = null;
    const state: Record<string, any[]> = {};

    for (const token of tokens) {
      // push the heading
      if (token.type === "heading") {
        tokens.push(...this.headingFacts(token));
        continue;
      }

      // we want to save this content of this block as axon facts
      if (token.type === AxonEntities.BLOCK_ID) {
        if (token.tag === "open") {
          blockId = token.id;
          triples.push(new Triple("is", token.id, AxonEntities.BLOCK_ID));
          triples.push(new Triple("has", filepath, token.id));
        }

        if (token.tag === "close") {
          blockId = null;
        }
        continue;
      }

      // if a lock is present, push content into state to store later
      if (blockId) {
        if (!(blockId in state)) {
          state[blockId] = [];
        }

        state[blockId].push(token);
      }
    }

    for (const [ref, tokens] of Object.entries(state)) {
      for (const token of tokens) {
        // attach code-blocks
        if (token.type === "code") {
          triples.push(new Triple("is", token.text, AxonEntities.CODE_BLOCK));
          triples.push(new Triple("has", ref, token.text));

          if (token.lang) {
            triples.push(new Triple("written-in", token.text, token.lang));
          }
          continue;
        }

        if (token.type === "text") {
          triples.push(new Triple("is", token.text, AxonEntities.TEXT));
          triples.push(new Triple("has", ref, token.text));
          continue;
        }

        //todo add lists etc
        //console.error('cannot store token' + JSON.stringify(token))
      }
    }

    return triples;
  }

  async parse() {
    const content = await this.read();
    const ctx = new NoteContext({
      $filepath: this.fpath,
      $filename: this.fname(),
    });

    const { frontmatter, tokens } = this.lex(content, ctx);
    const noteFacts = this.facts(tokens, ctx);

    const lang = new AxonLanguage(ctx);
    const triples = lang.parse(frontmatter);

    return triples.concat(noteFacts);
  }
}
