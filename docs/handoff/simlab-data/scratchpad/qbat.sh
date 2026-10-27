#!/bin/bash
# 14.4.1 release battery on int/r5-rel1441 @ be9b766a (gate green 3606/3610): 36 cards wire, p16s voice x2, p26h x2, ok03 x2
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad; B=http://127.0.0.1:8850; W=$S/wt/r1441c; LOG=$S/qbat.log; P=r5-r1441-be9b766-
cd /home/user/Taxila
E="SIMLAB_CHILD_MODE=decided SIMLAB_KIT_ROOT=$W NODE_USE_ENV_PROXY=1"
CARDS="p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27,p28,p29,p30,p31,p43,p65,p66,p67,p68"
env $E node evals/simlab/loop.mjs --arms director=$B --lanes text --only "$CARDS" --conc 4 --run-id ${P}36card --note "14.4.1 release battery @be9b766a: same 36 cards, seed taxila, decided, Director, text, brief v2, Studio wire (wait = reply chars/14 s, 4-15 s). Before: r5-r1441-b7413e5-36card-wire" > $S/rq1.log 2>&1
echo "$(date -u +%T) 36card exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --cards evals/simlab/cards/pinned-14.4.json --arms r1=$B,r2=$B --lanes voice --only p16s --conc 4 --run-id ${P}p16s-voice --note "14.4.1 battery @be9b766a: p16s voice x2 (pinned oxygen / CO2 science lines)" > $S/rq2.log 2>&1
echo "$(date -u +%T) p16s exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --cards evals/simlab/cards/pinned-14.4.json --arms r1=$B,r2=$B --lanes text --only p26h --conc 4 --run-id ${P}p26h --note "14.4.1 battery @be9b766a: p26h x2 (pinned British-rule 'race' history answer at turn 3)" > $S/rq3.log 2>&1
echo "$(date -u +%T) p26h exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --cards evals/simlab/cards/offkit-14.4.1.json --arms r1=$B,r2=$B --lanes text --only ok03 --conc 4 --run-id ${P}ok03 --note "14.4.1 battery @be9b766a: ok03 x2" > $S/rq4.log 2>&1
echo "$(date -u +%T) ok03 exit $?" >> $LOG
for d in 36card p16s-voice p26h ok03; do R=evals/simlab/results/$P$d; { echo "== $d"; node evals/simlab/offscript.mjs $R; node evals/simlab/rule1.mjs $R; } >> $S/qbat-facts.log 2>&1; done
echo DONE >> $LOG
