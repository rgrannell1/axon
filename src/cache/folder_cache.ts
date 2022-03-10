import { Triple } from "../commons/model.ts";
import { IVaultCache } from "../interfaces.ts";
import { join } from "https://deno.land/std@0.63.0/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import { NoteContext } from "../notes/context.ts";

export class FolderCache implements IVaultCache {
  dpath: string;

  constructor(dpath: string) {
    this.dpath = dpath;
  }

  fpath(ctx: NoteContext) {
    return join(this.dpath, ctx.id());
  }

  async cached(ctx: NoteContext): Promise<boolean> {
    return await exists(this.fpath(ctx));
  }

  async invalidate(ctx: NoteContext) {
    if (await this.cached(ctx)) {
      await Deno.remove(this.fpath(ctx));
    }
  }

  async storedTriples(ctx: NoteContext): Promise<Triple[] | undefined> {
    if (await this.cached(ctx)) {
      try {
        return JSON.parse(await Deno.readTextFile(this.fpath(ctx)));
      } catch (err) {
        await this.invalidate(ctx);
      }
    }
  }

  async storeTriples(ctx: NoteContext, triples: Triple[]): Promise<void> {
    await Deno.writeTextFile(this.fpath(ctx), JSON.stringify(triples));
  }
}
