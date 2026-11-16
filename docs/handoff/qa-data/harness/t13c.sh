#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
PK='50[^]*30|30[^]*50|park|boundary|fenc|perimeter'
agrun g1 G-WHY $P "[[\"$PK\",\"160, kyunki chaaron sides jodte hain\",\"why\"]]"
agrun g2 G-OR $P "[[\"$PK\",\"160 ya 130\",\"or\"]]"
agrun g3 G-NAHI $P "[[\"$PK\",\"nahi nahi, 160\",\"nahinahi\"]]"
agrun g4 G-TOH $P "[[\"$PK\",\"toh answer 160 hai\",\"toh\"]]"
agrun g5 G-Q $P "[[\"$PK\",\"160?\",\"q1\"],[\"$PK\",\"160\",\"q2\"]]"
agrun g6 G-FADE5 c5-maths-ch09-t01 "[[\"35 ones|35[^]*7[^]*_\",\"5\",\"fade5\"]]" 14
agrun g7 G-FADE5b c5-maths-ch09-t01 "[[\"35 ones|35[^]*7[^]*_\",\"5\",\"fade5\"]]" 14
echo DONE13C
