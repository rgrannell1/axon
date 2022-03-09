import { Triple } from "../commons/model.ts";

export const True = () => true;
export const False = () => false;

/*
 *
 */
export const Equal = (val: string) => {
  return (other: string) => {
    return val === other;
  };
};

export const Rel = (triple: Triple) => {
  return triple.relname;
};

export const Src = (triple: Triple) => {
  return triple.src;
};

export const Tgt = (triple: Triple) => {
  return triple.tgt;
};
