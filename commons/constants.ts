export const AXON_CLI = `
Usage:
  axon --dpath <dir> [--plugin <fpath> ...]
  axon (-h|--help)

Description:
  Axon CLI

Options:
  --dpath <dir>       Axon note directory.
  --plugin <fpath>    A CSV of Typescript plugins for Axon.
`;

export enum AxonRels {
  IS = "is",
}

export enum AxonEntities {
  ENTITY = "Entity",
  BLOCK_ID = "Axon/BlockId",
  TEXT = "Axon/Text",
  CODE_BLOCK = "Axon/CodeBlock",
  HEADING = "Axon/Heading",
  HEADING_DEPTH = "Axon/HeadingDepth",
  NOTE = "Axon/Note",
  NOTE_NAME = "Axon/NoteName",
}
