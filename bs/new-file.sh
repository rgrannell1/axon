#!/usr/bin/env bash

source "./bs/env.sh"

deno run --allow-read --allow-write --allow-net --allow-env index.ts new-file --dpath ~/Drive/Axon "$1"

