#!/bin/bash
# after the 47ba26c7 wire check: ok10x x4 kept on b7413e5f, then 36 cards wire on / wire off (same seed)
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad; B=http://127.0.0.1:8849; LOG=$S/qwire.log
cd /home/user/Taxila
until grep -q "^wrote " $S/wc.log 2>/dev/null; do sleep 10; done
echo "$(date -u +%T) wire-check done" >> $LOG
E="SIMLAB_CHILD_MODE=decided SIMLAB_KIT_ROOT=$S/wt/r1441b NODE_USE_ENV_PROXY=1"
env $E SIMLAB_KEEP_FILE=$S/kept-ok10.jsonl node evals/simlab/loop.mjs --cards evals/simlab/cards/ok10-replay.json --arms r1=$B,r2=$B,r3=$B,r4=$B --lanes text --only ok10x --conc 4 --run-id r5-r1441-b7413e5-ok10x-kept --note "14.4.1 @b7413e5f (motion word before jaana padega keeps the turn in the lesson): ok10x exact replay x4, TEST accounts KEPT; before = r5-r1441-47ba26c-ok10x-kept (4/4 wrap at #3)" > $S/rb1.log 2>&1
echo "$(date -u +%T) ok10x exit $?" >> $LOG
CARDS="p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27,p28,p29,p30,p31,p43,p65,p66,p67,p68"
env $E node evals/simlab/loop.mjs --arms director=$B --lanes text --only "$CARDS" --conc 4 --run-id r5-r1441-b7413e5-36card-wire --note "14.4.1 @b7413e5f: same 36 cards, seed taxila, decided, Director, text, brief v2, WITH the Studio wire (child's screen follows /api/studio/stream + slot like the phone). A/B partner: r5-r1441-b7413e5-36card-nowire" > $S/rb2.log 2>&1
echo "$(date -u +%T) 36 wire exit $?" >> $LOG
env $E SIMLAB_WIRE=off node evals/simlab/loop.mjs --arms director=$B --lanes text --only "$CARDS" --conc 4 --run-id r5-r1441-b7413e5-36card-nowire --note "14.4.1 @b7413e5f: same 36 cards, seed taxila, decided, Director, text, brief v2, SIMLAB_WIRE=off (old harness: turn slot only). A/B partner: r5-r1441-b7413e5-36card-wire" > $S/rb3.log 2>&1
echo "$(date -u +%T) 36 nowire exit $?" >> $LOG
echo DONE >> $LOG
