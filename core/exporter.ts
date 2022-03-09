import { Triple } from "../commons/model.ts";
import { Subsumptions } from "./logic.ts";

export interface IExporter {
  init(): Promise<void>;
  export(subsumptions: Subsumptions, triples: Triple[]): Promise<void>;
}
