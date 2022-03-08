import { NoteContext } from "../axon/parser.ts";

export class Triple {
  relname: string;
  src: string;
  tgt: string;

  constructor(relname: string, src: string, tgt: string) {
    this.relname = relname;
    this.src = src;
    this.tgt = tgt;
  }

  applyCtx(ctx: NoteContext) {
    this.relname = ctx.replace(this.relname);
    this.src = ctx.replace(this.src);
    this.tgt = ctx.replace(this.tgt);
    return this;
  }
}
