#!/bin/bash
# 14.4 @1b3bb12c (main, 18:55; 2b37740d + one wording revert): after the off-kit run (waits on its DONE line), ≤4 lessons at a
# time, brief v2. p68 and p16 use the pinned cards (cards/pinned-14.4.json): p68p adds a later-ask at turn 7, p16s scripts the
# oxygen / 'jee nahi sakte' science answer at turns 1 and 6.
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad
W=$S/wt/rel144g; B=http://127.0.0.1:8846; LOG=$S/q1b3.log; P=r5-rel144-1b3bb12; PIN=evals/simlab/cards/pinned-14.4.json
cd /home/user/Taxila
until grep -q DONE $S/qoffkit.log 2>/dev/null; do sleep 60; done
[ -d $W ] || git worktree add --detach $W 1b3bb12c >> $LOG 2>&1
[ -e $W/node_modules ] || ln -s /home/user/Taxila/node_modules $W/node_modules
PORT=8846 NODE_USE_ENV_PROXY=1 TAXILA_PICTURES=all SIMLAB_SERVER_ROOT=$W NODE_OPTIONS=--max-old-space-size=8192 nohup node evals/simlab/serve.mjs > $S/srv-8846.log 2>&1 &
for i in $(seq 100); do curl -sf -o /dev/null $B/api/health && break; sleep 3; done
echo "$(date -u +%T) start on $(git -C $W rev-parse --short HEAD), server $(curl -s -o /dev/null -w '%{http_code}' $B/api/health)" >> $LOG
E="SIMLAB_CHILD_MODE=decided SIMLAB_KIT_ROOT=$W NODE_USE_ENV_PROXY=1"
CARDS="p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27,p28,p29,p30,p31,p43,p65,p66,p67,p68"
env $E node evals/simlab/loop.mjs --arms director=$B --lanes text --only "$CARDS" --conc 4 --run-id $P-36card --note "14.4 @1b3bb12c: same 36 cards, seed taxila, decided, Director, text, brief v2. Before: r5-rel144-9ad8666-36card, r5-rel144-cdac90c-tiered2-36card" > $S/rc1.log 2>&1
echo "$(date -u +%T) 36card exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --arms r1=$B,r2=$B --lanes text --only p66 --turns 30 --conc 4 --run-id $P-p66-long --note "14.4 @1b3bb12c: p66 x2 --turns 30" > $S/rc2.log 2>&1
echo "$(date -u +%T) p66 exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --cards $PIN --arms r1=$B,r2=$B --lanes text --only p68p --turns 50 --conc 4 --run-id $P-p68p-long --note "14.4 @1b3bb12c: p68p x2 --turns 50 (pinned: dog bark at 4, later-ask 'lesson ke end mein bataoge' at 7): is the promise kept at the wrap?" > $S/rc3.log 2>&1
echo "$(date -u +%T) p68p exit $?" >> $LOG
env $E node evals/simlab/loop.mjs --cards $PIN --arms r1=$B,r2=$B --lanes voice --only p16s --conc 4 --run-id $P-p16s-voice --note "14.4 @1b3bb12c: p16s voice x2 (pinned: 'bina oxygen ke jee nahi sakte' at 1, 'bina carbon dioxide ke jee nahi sakte' at 6)" > $S/rc4.log 2>&1
echo "$(date -u +%T) p16s exit $?" >> $LOG
for d in 36card p66-long p68p-long p16s-voice; do
  R=evals/simlab/results/$P-$d
  { echo "== $d"; node evals/simlab/scanfacts.mjs $R; node evals/simlab/rule1.mjs $R; node evals/simlab/offscript.mjs $R; } >> $S/q1b3-facts.log 2>&1
done
echo "$(date -u +%T) DONE" >> $LOG
