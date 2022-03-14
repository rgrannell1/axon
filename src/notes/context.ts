/*
 * Note context provides metadata like filename, hash about a set of triples.
 */

import { createHash } from "https://deno.land/std/hash/mod.ts";
import { IIdentifiable } from "../interfaces.ts";

type NoteContextArgs = {
  $filepath: string;
  $filename: string;
  $dirpath: string;
  $hash: string;
};

/*
  * Any special variables that can be injected into
  * opening frontmatter
  */
export class NoteContext implements IIdentifiable {
  substitutions: Record<string, string>;

  constructor(substitutions: NoteContextArgs) {
    this.substitutions = substitutions;
  }

  id(): string {
    const fpath = this.substitutions.$filepath;
    const hash = this.substitutions.$hash;

    const fpathHash = createHash("sha1").update(fpath).toString();
    return `${fpathHash}_${hash}`;
  }

  replace(name: string): string {
    for (const [candidate, replacement] of Object.entries(this.substitutions)) {
      if (name === candidate) {
        return replacement;
      }
    }

    return name;
  }

  fpath() {
    return this.substitutions["$filepath"];
  }
}
