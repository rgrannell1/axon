
import { INoteContext } from "../interfaces.ts";

export class Triple {
  relname: string;
  src: string;
  tgt: string;

  constructor(relname: string, src: string, tgt: string) {
    this.relname = relname;
    this.src = src;
    this.tgt = tgt;
  }

  applyCtx(ctx: INoteContext) {
    this.relname = ctx.replace(this.relname);
    this.src = ctx.replace(this.src);
    this.tgt = ctx.replace(this.tgt);
    return this;
  }
}
