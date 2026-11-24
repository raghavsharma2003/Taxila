#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13common.sh
export QA_BASE=http://127.0.0.1:8099
run p1 P-KEEP-1 $P "triangle ki picture dikhao||board par ek dinosaur ka skeleton banao||theek hai"; cls P-KEEP-1
run p2 P-KEEP-2 $P "triangle ki picture dikhao||board par rocket engine ka diagram banao||theek hai"; cls P-KEEP-2
run p3 P-REPLACE $P "triangle ki picture dikhao||board par rectangle ka perimeter samjhao"; cls P-REPLACE
run p4 P-SPENT $P "triangle ki picture dikhao||picture dikhao||ek aur picture dikhao||picture dikhao na"; cls P-SPENT
echo DONE14D
