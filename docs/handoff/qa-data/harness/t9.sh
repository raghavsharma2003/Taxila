#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t6common.sh
export QA_BASE=http://127.0.0.1:8097
run f1 F-LM-1 $P "$LM"
run f2 F-LM-2 $P "$LM"
run f3 F-LM-3 $P "$LM"
echo DONE9
