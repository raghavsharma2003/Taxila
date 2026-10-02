#!/bin/bash
# Arm F (stable CORE+CHILD in session instructions + per-turn sections in a tail system item + B's prune/recap,
# recap row in the session prefix). Added after runs 1-2 showed arms A-C cache only 576-704 tokens per turn.
cd "$(dirname "$0")"
set -a; . /home/user/Taxila/.env.local; set +a
go() { NODE_USE_ENV_PROXY=1 timeout 3300 node ctxgrowth.mjs --arm F --run $1 --minutes 30 > logs/F-$1.log 2>&1; }
for r in "$@"; do go $r; done
echo ALLDONE
