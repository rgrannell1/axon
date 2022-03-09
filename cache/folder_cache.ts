import { Triple } from "../commons/model.ts"
import { IVaultCache } from "../interfaces.ts"
import { createHash } from "https://deno.land/std/hash/mod.ts";
import { join } from "https://deno.land/std@0.63.0/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

export class FolderCache implements IVaultCache {
  dpath: string

  constructor (dpath: string) {
    this.dpath = dpath
  }

  tgtname(fpath: string, hash: string) {
    const fname = createHash("sha1").update(fpath).toString();
    return join(this.dpath, `${fname}_${hash}`)
  }

  async cached(fpath: string, hash: string): Promise<boolean> {
    const tgtname = this.tgtname(fpath, hash)
    return await exists(tgtname)
  }

  async invalidate(fpath: string, hash: string) {
    if (await this.cached(fpath, hash)) {
      await Deno.remove(fpath)
    }
  }

  async storedTriples(fpath: string, hash: string): Promise<Triple[] | undefined> {
    const tgtname = this.tgtname(fpath, hash)

    if (await this.cached(fpath, hash)) {
      try {
        return JSON.parse(await Deno.readTextFile(tgtname))
      } catch (err) {
        await this.invalidate(fpath, hash)
      }
    }
  }

  async storeTriples(fpath: string, hash: string, triples: Triple[]): Promise<void> {
    await Deno.writeTextFile(this.tgtname(fpath, hash), JSON.stringify(triples))
  }
}
