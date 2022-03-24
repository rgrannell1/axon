#! /usr/bin/env bash

# create dist
rm -rf dist || echo 'dist/ not present, creating...'
mkdir dist

# bundle to tmpfiles
deno bundle src/cli/axon.ts        dist/axon-import.tmp
deno bundle src/cli/axon-export.ts dist/axon-export.tmp
deno bundle src/cli/axon.ts        dist/axon.tmp

# create shebangs
echo '#!/bin/sh'                                                 | tee -a dist/shebang.tmp
echo '//bin/true; exec /home/rg/.deno/bin/deno run -A "$0" "$@"' | tee -a dist/shebang.tmp

# combine shebang and bundles
cat dist/shebang.tmp dist/axon-import.tmp >> dist/axon-import
cat dist/shebang.tmp dist/axon-export.tmp >> dist/axon-export
cat dist/shebang.tmp dist/axon.tmp        >> dist/axon

# remove tempfiles
rm dist/*.tmp


# chmod
chmod +x dist/axon-import
chmod +x dist/axon-export
chmod +x dist/axon

echo '🧠 axon bundled.'
