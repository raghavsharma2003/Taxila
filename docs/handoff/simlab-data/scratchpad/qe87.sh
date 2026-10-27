#!/bin/bash
# 14.4 @e8723394 (main, 19:10; hate-only filter block reads clear): after the 1b3bb12c queue (waits on its DONE line).
# ok03 x2 (cycling/race false full script on 9ad86661) and the pinned p26h x2 (British-rule 'race' history answer at turn 3).
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad
W=$S/wt/rel144h; B=http://127.0.0.1:8847; LOG=$S/qe87.log; P=r5-rel144-e872339
cd /home/user/Taxila
until grep -q DONE $S/q1b3.log 2>/dev/null; do sleep 60; done
[ -d $W ] || git worktree add --detach $W e8723394 >> $LOG 2>&1
[ -e $W/node_modules ] || ln -s /home/user/Taxila/node_modules $W/node_modules
PORT=8847 NODE_USE_ENV_PROXY=1 TAXILA_PICTURES=all SIMLAB_SERVER_ROOT=$W NODE_OPTIONS=--max-old-space-size=8192 nohup node evals/simlab/serve.mjs > $S/srv-8847.log 2>&1 &
for i in $(seq 100); do curl -sf -o /dev/null $B/api/health && break; sleep 3; done
echo "$(date -u +%T) start on $(git -C $W rev-parse --short HEAD), server $(curl -s -o /dev/null -w '%{http_code}' $B/api/health)" >> $LOG
E="SIMLAB_CHILD_MODE=decided SIMLAB_KIT_ROOT=$W NODE_USE_ENV_PROXY=1"
env $E node evals/simlab/loop.mjs --cards evals/simlab/cards/offkit-14.4.1.json --arms r1=$B,r2=$B --lanes text --only ok03 --conc 4 --run-id $P-ok03 --note "14.4 @e8723394: ok03 x2 (9ad86661 r1: content_filter HATE on 'race' -> false full script)" > $S/re1.log 2>&1
echo "$(date -u +%T) ok03 exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --cards evals/simlab/cards/pinned-14.4.json --arms r1=$B,r2=$B --lanes text --only p26h --conc 4 --run-id $P-p26h --note "14.4 @e8723394: p26h x2 (pinned British-rule 'race' history answer at turn 3)" > $S/re2.log 2>&1
echo "$(date -u +%T) p26h exit $?" >> $LOG
for d in ok03 p26h; do R=evals/simlab/results/$P-$d; { echo "== $d"; node evals/simlab/scanfacts.mjs $R; node evals/simlab/offscript.mjs $R; } >> $S/qe87-facts.log 2>&1; done
echo "$(date -u +%T) DONE" >> $LOG
