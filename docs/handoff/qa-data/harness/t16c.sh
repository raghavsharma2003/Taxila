#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
NK='50 m aur 30 m|50 aur 30|total nikaal|50[^]*30'
PK='50[^]*30|30[^]*50|Total kitna|kitna hoga|calculate|perimeter kitna'
for i in 1 2 3; do agrun yn$i Y-NAHI-$i $P "[[\"$NK\",\"nahi nahi, 160\",\"nahinahi\"]]" 10; cls Y-NAHI-$i | grep -E "CHILD|classify"; done
for i in 1 2; do agrun yq$i Y-Q-$i $P "[[\"$PK\",\"160?\",\"q1\"],[\"$PK\",\"160\",\"q2\"]]" 10; cls Y-Q-$i | grep -E "CHILD|classify"; done
agrun yp1 Y-PLAIN $P "[[\"$PK\",\"160 metre\",\"plain\"]]" 10; cls Y-PLAIN | grep -E "CHILD|classify"
echo DONE16C
