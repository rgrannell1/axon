#!/usr/bin/env bash

source "./bs/env.sh"

deno run \
  --allow-read \
  --allow-net \
  --allow-env \
  index.ts --dpath ~/Drive/Axon
