export const AXON_CLI = `
Usage:
  axon --dpath <dir>
  axon (-h|--help)

Description:
  Axon CLI
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
  NOTE_NAME = "Axon/NoteName"
}
