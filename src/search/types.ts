import { Triple } from "../commons/model.ts";
import { Subsumptions } from "../core/logic.ts";

export type Search = (subsumptions: Subsumptions, triple: Triple) => boolean;
export type SubSearch = (part: string) => boolean;
export type TripleStream = AsyncGenerator<Triple, void, void>;
