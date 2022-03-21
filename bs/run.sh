#!/usr/bin/env bash

source 'bs/env.sh'

deno run -A src/cli/axon.ts import --from /home/rg/Code/axon-transactions/index.ts --to out.jsonl
