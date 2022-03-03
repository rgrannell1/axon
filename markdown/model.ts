export class Header {
  level: number;
  text: string;

  constructor(level: number, text: string) {
    this.level = level;
    this.text = text;
  }

  equals(header: Header): boolean {
    return this.level === header.level && this.text === header.text;
  }
}

export class CodeBlockBody {
  language: string | undefined;
  text: string;

  constructor(language: string | undefined, text: string) {
    this.language = language;
    this.text = text;
  }

  equals(block: CodeBlockBody): boolean {
    return this.language === block.language && this.text === block.text;
  }
}

export class Paragraph {
  text: string
  constructor(text: string) {
    this.text = text
  }
}

export class BlockQuote {

}
