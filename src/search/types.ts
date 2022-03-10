import { Triple } from "../commons/model.ts";

export type Search = (triple: Triple) => boolean;
export type SubSearch = (part: string) => boolean;
export type TripleStream = AsyncGenerator<Triple, void, void>;