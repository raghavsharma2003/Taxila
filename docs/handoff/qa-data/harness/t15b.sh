#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
PK='50[^]*30|30[^]*50|Total kitna|kitna hoga|calculate|perimeter kitna'
for i in 1 2; do for x in "plain|160 metre" "why|160, kyunki chaaron sides jodte hain"; do l=${x%%|*}; a=${x#*|}; agrun v$l$i V-$l-$i $P "[[\"$PK\",\"$a\",\"$l\"]]" 10; cls V-$l-$i | grep -E "CHILD|classify"; done; done
for i in 1 2; do agrun vq$i V-q-$i $P "[[\"$PK\",\"160?\",\"q1\"],[\"$PK\",\"160\",\"q2\"]]" 10; cls V-q-$i | grep -E "CHILD|classify"; done
echo DONE15B
