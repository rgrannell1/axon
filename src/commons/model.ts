import { IContext } from "../interfaces.ts"

/**
 * A data-triple, containing a src, relationship, and target. The core unit of data in Axon.
 *
 * @export
 * @class Triple
 */
export class Triple {
  relname: string;
  src: string;
  tgt: string;

  constructor(relname: string, src: string, tgt: string) {
    this.relname = relname;
    this.src = src;
    this.tgt = tgt;
  }


  /**
   * Apply note-context to a triple, replacing contextual values
   *
   * @param {IContext} ctx a context containing bindings for contextual variables
   * @return {Triple}
   * @memberof Triple
   */
  applyCtx(ctx: IContext):Triple {
    this.relname = ctx.replace(this.relname);
    this.src = ctx.replace(this.src);
    this.tgt = ctx.replace(this.tgt);
    return this;
  }
}
