#!/bin/bash
# stream 2's 12 off-kit steer cards x2 on 9ad86661 (main, 18:00): AFTER the 9ad86661 queue. Waits on its DONE line, not a process.
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad
W=$S/wt/rel144e; B=http://127.0.0.1:8845; LOG=$S/qoffkit.log; R=r5-rel144-9ad8666-offkit
cd /home/user/Taxila
until grep -q DONE $S/q9ad.log 2>/dev/null; do sleep 60; done
echo "$(date -u +%T) start, server $(curl -s -o /dev/null -w '%{http_code}' $B/api/health)" >> $LOG
SIMLAB_CHILD_MODE=decided SIMLAB_KIT_ROOT=$W NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --cards evals/simlab/cards/offkit-14.4.1.json --arms r1=$B,r2=$B --lanes text --only ok --conc 4 --run-id $R --note "14.4 @9ad86661: stream 2's 12 off-kit steer cards (b8ae92ac) x2, decided, Director, text, brief v2: baseline for census F1/F3 before 4A/stream 2 fixes" > $S/rok.log 2>&1
echo "$(date -u +%T) offkit exit $?" >> $LOG
{ node evals/simlab/steerfacts.mjs evals/simlab/results/$R evals/simlab/cards/offkit-14.4.1.json; node evals/simlab/offscript.mjs evals/simlab/results/$R; } > $S/qoffkit-facts.log 2>&1
echo "$(date -u +%T) DONE" >> $LOG
