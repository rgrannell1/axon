#!/usr/bin/env bash

source "./bs/env.sh"

deno run \
  --config tsconfig.json \
  --allow-read \
  --allow-write \
  --allow-net \
  --allow-env \
  --no-check=remote \
  index.ts export neo4j --dpath ~/Drive/Axon
