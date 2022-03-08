#!/usr/bin/env bash

source "./bs/env.sh"

deno run \
  --config tsconfig.json \
  --allow-read \
  --allow-net \
  --allow-env \
  --no-check=remote \
  index.ts \
  --dpath ~/Drive/Axon \
  --plugin ~/Code/deno-axon/ontology/main.ts
