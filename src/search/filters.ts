import { Triple } from "../commons/model.ts";
import { Subsumptions } from "../core/logic.ts";
import { Search } from "./types.ts";

export const Filter = (search: Search) => {
  return () => {
    return search;
  };
};

export const SelfReferential = Filter((_: Subsumptions, triple: Triple) => {
  return triple.src === triple.tgt;
});

export const All = Filter((subsumptions: Subsumptions, _: Triple) => {
  return true;
});

export const None = Filter((subsumptions: Subsumptions, _: Triple) => {
  return false;
});
