#!/bin/bash
. /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t6common.sh
export QA_BASE=http://127.0.0.1:8098
QA_LABELS=w1,w2 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > $Q/t10setup.out 2>&1
run w1 G-W2b-1 $P "$LM||pata nahi"
run w2 G-W2b-2 $P "$LM||pata nahi"
echo DONE10
