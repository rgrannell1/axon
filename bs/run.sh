#!/usr/bin/env bash

source 'bs/env.sh'

deno run -A src/cli/axon.ts import --topic 'aib_transactions' --from /home/rg/Code/axon-transactions/index.ts
