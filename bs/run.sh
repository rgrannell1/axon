#!/usr/bin/env bash

source "./bs/env.sh"

deno run \
  --config tsconfig.json \
  --allow-read \
  --allow-write \
  --allow-net \
  --allow-env \
  --no-check=remote \
  index.ts search \
  --dpath ~/Drive/Axon \
  --plugin ~/Code/deno-axon/src/my-searches/main.ts "$1"
