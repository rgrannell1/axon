export type RelationshipName = string;
export type EntityName = string;

export class Triple {
  relname: RelationshipName;
  srcname: EntityName | undefined;
  tgtname: EntityName;

  constructor(relname: string, srcname: string | undefined, tgtname: string) {
    this.relname = relname;
    this.srcname = srcname;
    this.tgtname = tgtname;
  }

  equals(triple: Triple): boolean {
    return this.relname === triple.relname &&
      this.srcname === triple.srcname &&
      this.tgtname === triple.tgtname;
  }
}

export class Facts {
  triples: Triple[];
  constructor(triples: Triple[]) {
    this.triples = triples;
  }
}
