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
  BLOCK_ID = "Axon_BlockId",
  TEXT = "Axon_Text",
  CODE_BLOCK = "Axon_CodeBlock",
  HEADING = "Axon_Heading",
  HEADING_DEPTH = "Axon_Heading.Depth",
  VAULT = "Axon_Vault",
  NOTE = "Axon_Note",
  NOTE_NAME = "Axon_NoteName",
  NOTE_HASH = "Axon_NoteHash",
  TOP_TYPE = "Axon_Thing",
  BOTTOM_TYPE = "Axon_Nothing",
}
