#!/bin/bash
cd /home/user/Taxila; Q=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144
QA_BASE=http://127.0.0.1:8096 QA_OUT=$Q QA_LABELS=b1,b2,b3,b4 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > $Q/t11setup.out 2>&1
for i in 1 2 3 4; do echo "== B$i"; timeout 700 env QA_BASE=http://127.0.0.1:8096 QA_OUT=$Q QA_SHOTS=$Q/shots/ QA_ACC=b$i QA_TAG=b6c-$i QA_ANSWER="130 metre" QA_ANSWER2="samajh nahi aaya" node /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/stay.mjs 2>&1 | tail -1 | cut -c1-600; done
echo DONE11
