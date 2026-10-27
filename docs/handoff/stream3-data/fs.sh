#!/bin/bash
# usage: fs.sh <out.json> [first-sound args...]  -- prod routing via the r4-timeline preload, own Neon branch only
cd /home/user/Taxila
OUT=$1; shift
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt NODE_ENV=production ACCESS_LOG=off \
  node --env-file=.env.local --import ./tests/prod/r4-timeline/preload.mjs evals/relational-human/first-sound.mjs --out "$OUT" "$@" 2>&1 \
  | grep -E '^\s*\[L[0-9]\] (turn|lesson)|^stage|^[a-zA-Z]+ +[0-9]+ +[0-9]|^ack |^prefetch|^azure|failed|SKIPPED|Error'
