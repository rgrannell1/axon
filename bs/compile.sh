#!/usr/bin/env bash

source "./bs/env.sh"

deno compile --allow-read --allow-write --allow-net --allow-env index.ts
