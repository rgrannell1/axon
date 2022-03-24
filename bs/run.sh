#!/usr/bin/env bash

source 'bs/env.sh'


PINBOARD_PLUGIN="$HOME/Code/deno-axon/src/plugins/pinboard.ts"
AIB_PLUGIN="$HOME/Code/axon-transactions/index.ts"
HISTORY_PLUGIN="$HOME/Code/deno-axon/src/plugins/history.ts"

AXON="deno run -A src/cli/axon.ts"

$AXON import --topic 'aib_transactions' --from "$AIB_PLUGIN"
#$AXON import --topic 'pinboard' --from "$PINBOARD_PLUGIN"
$AXON import --topic 'zsh_history' --from "$HISTORY_PLUGIN" "importer.fpath=$HOME/.zsh_history"

#$AXON export --jsonl --search 'select * from zsh_history'
