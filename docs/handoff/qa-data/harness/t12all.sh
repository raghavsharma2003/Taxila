#!/bin/bash
cd /home/user/Taxila
QA_BASE=http://127.0.0.1:8098 QA_OUT=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144 QA_LABELS=h1,h2,h3,h4,h5,h6 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t12setup.out 2>&1
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t12a.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t12a.out 2>&1 &
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t12b.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t12b.out 2>&1 &
wait; echo ALL12 >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t12a.out
