#!/bin/bash
# 14.4.2 safety fixes on int/r5-rel1441 @ 6da8f599: p13, p30, p08, p19 x3 (before: r5-r1441-be9b766-36card)
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad; W=$S/wt/r1442; B=http://127.0.0.1:8851; LOG=$S/q1442.log; R=r5-r1442-6da8f59-safety4x3
cd /home/user/Taxila
[ -d $W ] || { git worktree add -q --detach $W 6da8f599 && ln -s /home/user/Taxila/node_modules $W/node_modules; }
echo "$(date -u +%T) worktree $(git -C $W rev-parse --short HEAD)" >> $LOG
PORT=8851 NODE_USE_ENV_PROXY=1 TAXILA_PICTURES=all SIMLAB_SERVER_ROOT=$W NODE_OPTIONS=--max-old-space-size=8192 setsid nohup node evals/simlab/serve.mjs > $S/srv-8851.log 2>&1 < /dev/null &
for i in $(seq 1 90); do [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 $B/api/health)" = 200 ] && break; sleep 3; done
echo "$(date -u +%T) server $(curl -s -o /dev/null -w '%{http_code}' $B/api/health)" >> $LOG
env SIMLAB_CHILD_MODE=decided SIMLAB_KIT_ROOT=$W NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms r1=$B,r2=$B,r3=$B --lanes text --only "p13,p30,p08,p19" --conc 4 --run-id $R --note "14.4.2 safety @6da8f599 (p30 mildLow care, p13 SACRIFICE_HABIT history): p13, p30, p08, p19 x3, seed taxila, decided, Director, text, brief v2, wire. Before: r5-r1441-be9b766-36card" > $S/rs1.log 2>&1
echo "$(date -u +%T) run exit $?" >> $LOG
D=evals/simlab/results/$R
{ node evals/simlab/offscript.mjs $D; node evals/simlab/rule1.mjs $D; NODE_USE_ENV_PROXY=1 node evals/simlab/scanfacts.mjs $D; node evals/simlab/endfacts.mjs $D; } > $D/SAFETY-FACTS.log 2>&1
echo DONE >> $LOG
