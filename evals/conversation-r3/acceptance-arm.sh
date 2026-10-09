#!/bin/sh
# Round 3 conversation: the per-arm acceptance after the battery, single lane per arm (rj-integ-parallel-battery-lanes:
# lanes sharing one server are not a valid measurement). Usage: acceptance-arm.sh <arm-name> <base-url>
# Writes evals/conversation-r3/results/<arm>-acceptance/<script>.txt and the owner JSON beside it.
set -u
ARM="$1"; BASE="$2"
cd /home/user/Taxila || exit 2
OUT="evals/conversation-r3/results/$ARM-acceptance"
mkdir -p "$OUT"
run() { name="$1"; shift; echo "[$ARM] $name start $(date -u +%H:%M:%S)"; env NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt TAXILA_BASE="$BASE" timeout 3600 node --env-file=.env.local "$@" > "$OUT/$name.txt" 2>&1; echo "[$ARM] $name exit $? $(date -u +%H:%M:%S) $(tail -n 1 "$OUT/$name.txt")"; }
run owner-2 tests/prod/owner-2-no-confusion.mjs --sessions 6 --turns 14 --seed 157001 --judge model --out "$OUT/owner-2"
run owner-4 tests/prod/owner-4-steering.mjs --seed 157001 --out "$OUT/owner-4"
run round3-conversation tests/prod/round3-conversation.mjs
run round2-conversation tests/prod/round2-conversation.mjs
run owner-1 tests/prod/owner-1-grading.mjs --seed 13666 --no-browser --out "$OUT/owner-1"
echo "[$ARM] all done"
