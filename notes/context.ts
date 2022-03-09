import { INoteContext } from "../interfaces.ts";

/*
  * Any special variables that can be injected into
  * opening frontmatter
  */
export class NoteContext implements INoteContext {
  substitutions: Record<string, string>;

  constructor(substitutions: Record<string, string>) {
    this.substitutions = substitutions;
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
    return this.substitutions['$filepath']
  }
}
