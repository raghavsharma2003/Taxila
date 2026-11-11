#!/bin/bash
cd /home/user/Taxila
export QA_OUT=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144 QA_SHOTS=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/shots/ QA_BASE=http://127.0.0.1:8098
QA_LABELS=z1,z2,z3,z4 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t17setup.out 2>&1
QA_LABELS=z5 QA_CHILD=Riya QA_CLASS="Class 4" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t17setup.out 2>&1
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t17.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t17.out 2>&1
