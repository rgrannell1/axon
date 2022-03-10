import { Triple } from "../commons/model.ts";
import { IConfig, IImporter } from "../interfaces.ts";

export class PinboardImporter implements IImporter {
  key: string;

  constructor() {
    const key = Deno.env.get("PINBOARD_API_KEY");
    if (!key) {
      throw new Error("pinboard key missing");
    }
    this.key = key;
  }

  cached() {
  }

  import() {
    // retrieve all things not saved locally somewhere. assume full copy if dates match.
  }

  asTriple() {
  }
}
