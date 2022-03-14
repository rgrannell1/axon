import "https://unpkg.com/parsimmon@1.18.1/build/parsimmon.umd.min.js";
const P = (window as any).Parsimmon;

class FreeVariable {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class ExistentialOperator {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class ConjunctionOperator {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class ExactMatch {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class ConceptCall {
  concept: string;
  arg: any;
  constructor(concept: string, arg: any) {
    this.concept = concept;
    this.arg = arg;
  }
}

class RoleCall {
  rel: any;
  src: any;
  tgt: any;
  constructor(src: any, rel: any, tgt: any) {
    this.rel = rel;
    this.src = src;
    this.tgt = tgt;
  }
}

class Group {
  expr: any;
  constructor(expr: any) {
    this.expr = expr;
  }
}

export class Frame {
}

type Rules = Record<string, any>;

const _ = P.optWhitespace;

const Tbox = P.createLanguage({
  Variable() {
    return P.regexp(/\$[a-z]/)
      .map((match: string) => new FreeVariable(match))
      .desc("Variable");
  },
  Name() {
    return P.regexp(/[a-zA-Z0-9\-\_$]+/)
      .map((match: string) => new ExactMatch(match))
      .desc("Name");
  },
  ConceptArgument(rules: Rules) {
    return P.alt(rules.Variable, rules.Name)
      .desc("ConceptArgument");
  },
  Concept(rules: Rules) {
    return P.seq(
      rules.Name,
      P.string("("),
      rules.ConceptArgument,
      P.string(")"),
    )
      .map((result: string[]) => {
        return new ConceptCall(result[0], result[2]);
      })
      .desc("Concept");
  },
  RoleArgument(rules: Rules) {
    return P.alt(rules.Concept, rules.Variable, rules.Name)
      .desc("RoleArgument");
  },
  Role(rules: Rules) {
    return P.seq(
      rules.RoleArgument,
      P.string("."),
      rules.RoleArgument,
      P.string("("),
      rules.RoleArgument,
      P.string(")"),
    )
      .map((result: string[]) => {
        return new RoleCall(result[0], result[2], result[4]);
      })
      .desc("Role");
  },
  Declaration(rules: Rules) {
    return rules.Variable
      .many()
      .desc("Declaration");
  },
  ConjunctionOperator() {
    return P.alt(
      P.string("AND"),
      P.string("OR"),
    )
      .map((match: string) => new ConjunctionOperator(match))
      .desc("ConjunctionOperator");
  },
  Filter(rules: Rules) {
    return P.seq(
      rules.ExistentialOperator.times(0, 1),
      _,
      P.alt(rules.Role, rules.Concept),
      _,
      P.seq(rules.ConjunctionOperator, rules.Filter).many(),
    )
      .wrap(P.string("("), P.string(")"));
  },
  ExistentialOperator() {
    return P.alt(P.string("NONE"), P.string("SOME"), P.string("ALL"))
      .map((match: string) => new ExistentialOperator(match))
      .desc("ExistentialOperator");
  },
  Return(rules: Rules) {
    return rules.Variable
      .desc("Return");
  },
  Expression(rules: Rules) {
    return P.seq(
      rules.Declaration,
      P.string("|"),
      rules.Filter,
      P.string("|"),
      rules.Return,
    )
      .desc("Expression");
  },
});

export class Equivalence {
  parse() {
    Tbox.Concept.tryParse("PrivateInformation($x)");
    Tbox.Role.tryParse("$x.adjacent($y)");
    //Tbox.Role.tryParse("$x.adjacent(PrivateInformation($y))");

    //console.log(Tbox.Filter.tryParse("(NOT    $x.adjacent(PrivateInformation($y))) AND NOT PrivateInformation($x)"));
    console.log("---");
  }
}
