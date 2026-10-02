#!/bin/bash
# 3 replicates x 4 arms, two sessions at a time (4 in parallel produced failed responses from ~minute 5).
# A session that crashes (no "end" row) is moved to runs/crashed/ and re-run once at the end.
cd "$(dirname "$0")"
set -a; . /home/user/Taxila/.env.local; set +a
mkdir -p runs/crashed logs
go() { NODE_USE_ENV_PROXY=1 timeout 2700 node ctxgrowth.mjs --arm $1 --run $2 --minutes 30 > logs/$1-$2.log 2>&1;
       grep -q '"kind":"end"' runs/$1-$2.jsonl || { mv runs/$1-$2.jsonl runs/crashed/$1-$2.$(date +%s).jsonl; echo "$1 $2" >> logs/todo; }; }
for run in 1 2 3; do
  go A $run & go D $run & wait
  go B $run & go C $run & wait
done
if [ -f logs/todo ]; then while read a r; do go $a $r; done < <(cat logs/todo; rm logs/todo); fi
echo ALLDONE
