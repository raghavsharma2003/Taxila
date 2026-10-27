#!/bin/bash
# 14.4 @9ad86661 (main, 17:33): runs in order, ≤4 lessons at a time, brief v2. Server on 8845 is already up.
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad
W=$S/wt/rel144e; B=http://127.0.0.1:8845; LOG=$S/q9ad.log; P=r5-rel144-9ad8666
cd /home/user/Taxila
echo "$(date -u +%T) start on $(git -C $W rev-parse --short HEAD), server $(curl -s -o /dev/null -w '%{http_code}' $B/api/health)" >> $LOG
E="SIMLAB_CHILD_MODE=decided SIMLAB_KIT_ROOT=$W NODE_USE_ENV_PROXY=1"
CARDS="p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27,p28,p29,p30,p31,p43,p65,p66,p67,p68"
env $E node evals/simlab/loop.mjs --arms director=$B --lanes text --only "$CARDS" --conc 4 --run-id $P-36card --note "14.4 @9ad86661: same 36 cards, seed taxila, decided, Director, text, brief v2. Before: r5-rel144-cdac90c-tiered2-36card" > $S/r9a.log 2>&1
echo "$(date -u +%T) 36card exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --arms r1=$B,r2=$B --lanes text --only p66 --turns 30 --conc 4 --run-id $P-p66-long --note "14.4 @9ad86661: p66 x2 --turns 30 (r1 on cdac90c3 ended on a false wantsToStop)" > $S/r9b.log 2>&1
echo "$(date -u +%T) p66 exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --arms r1=$B,r2=$B --lanes text --only p68 --turns 50 --conc 4 --run-id $P-p68-long --note "14.4 @9ad86661: p68 x2 --turns 50 so the lesson reaches a wrap: is the parked 'lesson ke end mein wapas aayenge' kept?" > $S/r9c.log 2>&1
echo "$(date -u +%T) p68 exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --arms r1=$B,r2=$B --lanes voice --only p16 --conc 4 --run-id $P-p16voice --note "14.4 @9ad86661: p16 voice x2, the science answer (cdac90c3 r1/voice: predicate on 'bina oxygen ke jee nahi sakte')" > $S/r9d.log 2>&1
echo "$(date -u +%T) p16 exit $?" >> $LOG
for d in 36card p66-long p68-long p16voice; do
  R=evals/simlab/results/$P-$d
  { echo "== $d"; node evals/simlab/scanfacts.mjs $R; node evals/simlab/rule1.mjs $R; node evals/simlab/offscript.mjs $R; } >> $S/q9ad-facts.log 2>&1
done
echo "$(date -u +%T) DONE" >> $LOG
