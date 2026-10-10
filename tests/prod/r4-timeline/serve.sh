#!/bin/bash
# usage: serve.sh <port> <logfile> [web|worker]
PORT=$1; LOG=$2; WHAT=${3:-web}
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../../.." || exit 1
export PORT NODE_USE_ENV_PROXY=1 NODE_ENV=production ACCESS_LOG=off NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
ENTRY=server/serve.mjs; [ "$WHAT" = worker ] && ENTRY=server/worker.mjs
exec node --env-file=.env.local --import "$HERE/preload.mjs" $ENTRY > "$LOG" 2>&1
