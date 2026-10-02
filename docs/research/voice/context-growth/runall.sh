#!/bin/bash
# 3 rounds x 4 arms in parallel (arms see the same load within a round)
cd "$(dirname "$0")"
set -a; . /home/user/Taxila/.env.local; set +a
for run in 1 2 3; do
  for arm in A B C D; do
    NODE_USE_ENV_PROXY=1 timeout 2400 node ctxgrowth.mjs --arm $arm --run $run --minutes 30 > logs/$arm-$run.log 2>&1 &
  done
  wait
done
echo ALLDONE
