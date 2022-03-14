import { Triple } from "../../commons/model.ts";
import { ITripleSource } from "../../interfaces.ts";

export type BookmarkFields = {
  description: string;
  hash: string;
  href: string;
  time: string;
};

// Pinboard Plugin entities
export enum PinboardEntities {
  PLUGIN = "Pinboard_Plugin",
  BOOKMARK = "Pinboard_Bookmark",
  BOOKMARK_URL = "Pinboard_Bookmark_URL",
  BOOKMARK_DESCRIPTION = "Pinboard_Bookmark_Description",
  BOOKMARK_HASH = "Pinboard_Bookmark_Hash",
  BOOKMARK_DATE = "Pinboard_Bookmark_Date",
}

export class PinboardBookmark implements ITripleSource {
  data: BookmarkFields;

  constructor(data: BookmarkFields) {
    this.data = data;
  }

  async *triples(): AsyncGenerator<Triple, any, unknown> {
    const $ = this.data;
    const facts: [string, string, string][] = [
      ["id", $.href, $.href],
      ["is", $.href, PinboardEntities.BOOKMARK],
      ["is", $.href, PinboardEntities.BOOKMARK_URL],

      ["is", $.description, PinboardEntities.BOOKMARK_DESCRIPTION],
      ["has", $.href, $.description],

      ["is", $.hash, PinboardEntities.BOOKMARK_HASH],
      ["has", $.href, $.hash],

      ["is", $.time, PinboardEntities.BOOKMARK_DATE],
      ["has", $.href, $.time],
    ];

    for (
      const triple of facts.map((fact) => new Triple(fact[0], fact[1], fact[2]))
    ) {
      yield triple;
    }
  }
}

export class PinboardClient {
  key: string;

  constructor(key: string) {
    this.key = key;
  }

  async getLastUpdate(): Promise<string> {
    const jsonResponse = await fetch(
      `https://api.pinboard.in/v1/posts/update?format=json&auth_token=${this.key}`,
    );
    const jsonData = await jsonResponse.json();

    return jsonData.update_time;
  }

  async *getBookmarks() {
    let offset = 0;
    const size = 50;
    while (true) {
      const jsonResponse = await fetch(
        `https://api.pinboard.in/v1/posts/all?start=${offset}&results=${size}&format=json&&auth_token=${this.key}`,
      );
      const jsonData = await jsonResponse.json();

      for (const bookmark of jsonData) {
        yield new PinboardBookmark(bookmark as any);
      }

      if (jsonData.length === 0) {
        break;
      }

      offset += size;
    }
  }
}
