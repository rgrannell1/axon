#!/usr/bin/env bash

source 'bs/env.sh'

PINBOARD_PLUGIN=/home/rg/Code/deno-axon/src/plugins/pinboard.ts
AIB_PLUGIN=/home/rg/Code/axon-transactions/index.ts

deno run -A src/cli/axon.ts import --topic 'aib_transactions' --from "$AIB_PLUGIN"
deno run -A src/cli/axon.ts import --topic 'pinboard' --from "$PINBOARD_PLUGIN"
