#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
PK='50[^]*30|30[^]*50'
for x in "why|160, kyunki chaaron sides jodte hain" "or|160 ya 130" "nahinahi|nahi nahi, 160" "toh|toh answer 160 hai"; do l=${x%%|*}; a=${x#*|}; agrun g$l G-$l $P "[[\"$PK\",\"$a\",\"$l\"]]" 10; cls G-$l | grep -E "CHILD|classify"; done
agrun gq G-q $P "[[\"$PK\",\"160?\",\"q1\"],[\"$PK\",\"160\",\"q2\"]]" 10; cls G-q | grep -E "CHILD|classify"
FADE='[["7 hundreds|700 ÷ 7|7 ÷ 7","1","h"],["3 tens|30 ÷ 7|3 ÷ 7","0","t"],["35 ones|35 ÷ 7|35","5","o"],["Answer ___|735 ÷ 7 =","105","a"]]'
for i in 1 2; do QA_REPEAT=1 QA_NUDGES='["samajh nahi aaya, ek example se samjhao","pata nahi","pata nahi","pata nahi","theek hai, aage"]' agrun gf$i G-FADE-$i c5-maths-ch09-t01 "$FADE" 14; cls G-FADE-$i | grep -E "CHILD|classify|item="; done
echo DONE14C
