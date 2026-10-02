#!/bin/bash
# 3 replicates x 4 arms, two sessions at a time (4 in parallel hit response failures at ~minute 5)
cd "$(dirname "$0")"
set -a; . /home/user/Taxila/.env.local; set +a
go() { NODE_USE_ENV_PROXY=1 timeout 2700 node ctxgrowth.mjs --arm $1 --run $2 --minutes 30 > logs/$1-$2.log 2>&1; }
for run in 1 2 3; do
  go A $run & go D $run & wait
  go B $run & go C $run & wait
done
echo ALLDONE
