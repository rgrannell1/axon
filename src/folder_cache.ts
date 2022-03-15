import { Triple } from "./commons/model.ts";
import { ICache } from "./interfaces.ts";
import { join } from "https://deno.land/std@0.63.0/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

export class FolderCache implements ICache {
  dpath: string;

  constructor(dpath: string) {
    this.dpath = dpath;
  }

  fpath(id: string) {
    return join(this.dpath, id);
  }

  async cached(id: string): Promise<boolean> {
    return await exists(this.fpath(id));
  }

  async invalidate(id: string) {
    console.log("invalidating cache");
    if (await this.cached(id)) {
      await Deno.remove(this.fpath(id));
    }
  }

  async *storedTriples(id: string): AsyncGenerator<Triple, any, unknown> {
    if (await this.cached(id)) {
      try {
        for await (
          const triple of JSON.parse(await Deno.readTextFile(this.fpath(id)))
        ) {
          yield triple;
        }
      } catch (err) {
        await this.invalidate(id);
      }
    }
  }

  async storeTriples(id: string, triples: Triple[]): Promise<void> {
    if (triples.length === 0) {
      throw new Error("attempting to store no triples in context.");
    }
    await Deno.writeTextFile(this.fpath(id), JSON.stringify(triples));
  }
}
