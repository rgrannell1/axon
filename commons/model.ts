export class Triple {
  relname: string;
  src: string;
  tgt: string;

  constructor(relname: string, src: string, tgt: string) {
    this.relname = relname;
    this.src = src;
    this.tgt = tgt;
  }
}
