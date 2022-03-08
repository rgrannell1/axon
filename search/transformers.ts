import { Triple } from "../commons/model.ts";

import * as Parts from "./parts.ts";
import { TripleStream } from "./types.ts";

export const GroupBy = (equivalence: (val: Triple) => string) => {
  return (vals: TripleStream) => {
    const pairs: Record<string, Triple[]> = {};

    for (const val of vals) {
      const equiv = equivalence(val);

      if (equiv in pairs) {
        pairs[equiv].push(val);
      } else {
        pairs[equiv] = [val];
      }
    }

    return pairs;
  };
};

export const BySrc = GroupBy(Parts.Src);
export const ByTgt = GroupBy(Parts.Tgt);
export const ByRel = GroupBy(Parts.Rel);
