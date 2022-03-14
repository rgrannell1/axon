import { createHash } from "https://deno.land/std/hash/mod.ts";
import { IImporter, ITripleSource } from "../../interfaces.ts";
import { State } from "../../state.ts";
import { Triple } from "../../commons/model.ts";
import {
  BookmarkFields,
  PinboardBookmark,
  PinboardClient,
  PinboardEntities,
} from "../api/pinboard.ts";
import { Subsumptions } from "../../core/logic.ts";
import { Fetchers, Parts } from "../../search/search.ts";
import { render } from "https://deno.land/x/mustache_ts@v0.4.1.1/mustache.ts";

// The template to create a file
const PINBOARD_TEMPLATE = `
---
- id: $filepath
  describes: "Pinboard Bookmarks"

{{#bookmarks}}

- id: "{{{href}}}"
  imported-from: ${PinboardEntities.PLUGIN}
  is:
  - ${PinboardEntities.BOOKMARK}
  - ${PinboardEntities.BOOKMARK_URL}
  has:
  - ["{{{description}}}", ${PinboardEntities.BOOKMARK_DESCRIPTION}]
  - ["{{{hash}}}", ${PinboardEntities.BOOKMARK_HASH}]
  - ["{{{time}}}", ${PinboardEntities.BOOKMARK_DATE}]

{{/bookmarks}}

---

# Pinboard Bookmarks
`;

const fromTriples = async function* (
  subsumptions: Subsumptions,
  triples: AsyncGenerator<Triple, void, any>,
) {
  const bookmarks: Record<string, BookmarkFields> = {};

  for await (const triple of Fetchers.All(Parts.True)(subsumptions, triples)) {
    const srcConcepts = subsumptions.concepts(triple.src);
    const tgtConcepts = subsumptions.concepts(triple.tgt);

    if (srcConcepts.has("Pinboard_Bookmark")) {
      if (!bookmarks.hasOwnProperty(triple.src)) {
        bookmarks[triple.src] = {
          href: triple.src,
          description: "",
          hash: "",
          time: "",
        };
      }

      if (tgtConcepts.has("Pinboard_Bookmark_Hash")) {
        bookmarks[triple.src].hash = triple.tgt;
      }

      if (tgtConcepts.has("Pinboard_Bookmark_Date")) {
        bookmarks[triple.src].time = triple.tgt;
      }

      if (tgtConcepts.has("Pinboard_Bookmark_Description")) {
        bookmarks[triple.src].description = triple.tgt;
      }
    }
  }

  for (const bookmark of Object.values(bookmarks)) {
    yield bookmark;
  }
};

/*
 * Pinboard plugin
 *
 */
export class PinboardPlugin implements IImporter, ITripleSource {
  client: PinboardClient;
  lastUpdated?: string;

  constructor() {
    const key = Deno.env.get("PINBOARD_API_KEY");
    if (!key) {
      throw new Error("pinboard key missing");
    }

    this.client = new PinboardClient(key);
  }

  async init() {
    this.lastUpdated = await this.client.getLastUpdate();
  }

  id() {
    if (!this.lastUpdated) {
      throw new TypeError("lastUpdated not present");
    }

    return `${createHash("sha1").update("pinboard").toString()}_${
      createHash("sha1").update(this.lastUpdated).toString()
    }`;
  }

  async sync(state: State) {
    if (await state.hasTriples(this.id())) {
      return;
    }

    let triples: Triple[] = [];
    for await (const bookmark of this.client.getBookmarks()) {
      for await (const triple of bookmark.triples()) {
        triples = triples.concat(triple);
      }
    }

    await state.addTriples(this.id(), triples);
  }

  async *triples(state: State): AsyncGenerator<Triple, any, unknown> {
    for await (const triple of state.getCtxNotes(this)) {
      yield triple;
    }
  }

  async *fromTriples(
    subsumptions: Subsumptions,
    triples: AsyncGenerator<Triple, void, any>,
  ): AsyncGenerator<PinboardBookmark, any, unknown> {
    for await (const bookmark of fromTriples(subsumptions, triples)) {
      yield new PinboardBookmark(bookmark);
    }
  }

  async template(state: State) {
    const bookmarks = [];

    const sanitise = (text: string) => {
      return text.replace(/"/g, "'");
    };

    for await (
      const bookmark of this.fromTriples(
        state.subsumptions,
        this.triples(state),
      )
    ) {
      bookmarks.push({
        href: sanitise(bookmark.data.href),
        description: sanitise(bookmark.data.description),
        hash: sanitise(bookmark.data.hash),
        time: sanitise(bookmark.data.time),
      });
    }

    return render(PINBOARD_TEMPLATE, {
      bookmarks,
    });
  }
}
