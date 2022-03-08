import { Triple } from "../commons/model.ts";
import { Search } from "./types.ts";

export const Filter = (search: Search) => {
  return () => {
    return search;
  };
};

export const SelfReferential = Filter((triple: Triple) => {
  return triple.src === triple.tgt;
});

export const All = Filter((_: Triple) => {
  return true;
});

export const None = Filter((_: Triple) => {
  return false;
});
