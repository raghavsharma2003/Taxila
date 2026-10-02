#!/bin/bash
# Re-run of B-3 and C-3: the first attempts were killed at lesson minute ~23 when the previous agent session ended (19:56).
cd "$(dirname "$0")"
set -a; . /home/user/Taxila/.env.local; set +a
go() { NODE_USE_ENV_PROXY=1 timeout 2700 node ctxgrowth.mjs --arm $1 --run $2 --minutes 30 > logs/$1-$2.log 2>&1; }
go B 3 & go C 3 & wait
echo ALLDONE
