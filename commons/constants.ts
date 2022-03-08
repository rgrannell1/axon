export const AXON_CLI = `
Usage:
  axon search --dpath <dir> (--plugin <fpath> ...) [--json|--csv]
  axon export neo4j --dpath <dir>
  axon export sqlite
  axon (-h|--help)

Description:
  Axon CLI

Commands
  search              retrieve search-results from Axon

Options:
  --name              The name of the search to run. The search is defined in a loaded plugin.
  --json              Display output as JSON.
  --csv               Display output as CSV.
  --dpath <dir>       Axon note directory.
  --plugin <fpath>    A CSV of Typescript plugins for Axon.
`;

export enum AxonRels {
  IS = "is",
}

export enum AxonEntities {
  BLOCK_ID = "Axon/BlockId",
  TEXT = "Axon/Text",
  CODE_BLOCK = "Axon/CodeBlock",
  HEADING = "Axon/Heading",
  HEADING_DEPTH = "Axon/HeadingDepth",
  NOTE = "Axon/Note",
  NOTE_NAME = "Axon/NoteName",
  NOTE_HASH = "Axon/NoteHash",
  TOP_TYPE = "Axon/Thing",
  BOTTOM_TYPE = "Axon/Nothing",
}
