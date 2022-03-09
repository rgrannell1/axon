import { join } from "https://deno.land/std@0.63.0/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

export class Config {
  plugins: string[] = [];

  static base(): string | undefined {
    const base = Deno.env.get("XDG_CONFIG_HOME");
    if (base) {
      return base;
    }

    const home = Deno.env.get("HOME");

    if (!home) {
      return;
    }

    return join(home, ".local");
  }

  static path(): string | undefined {
    const base = this.base();
    if (!base) {
      return;
    }

    return join(base, "axon", "axon.cfg");
  }

  async load() {
    const fpath = Config.path();

    if (!fpath) {
      return;
    }

    if (await exists(fpath)) {
      const content = await Deno.readTextFile(fpath);
      const cfg = JSON.parse(content);

      this.plugins = cfg;
    }

    return this;
  }
}
