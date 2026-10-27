#!/bin/bash
cd /home/user/Taxila
export QA_OUT=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144 QA_SHOTS=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/shots/ QA_BASE=http://127.0.0.1:8098
QA_LABELS=w1,w2,w3,w4,w5,w6,w7,w8,w9,w10,w11,w12,w13,x1,x2,x4,x5,x6,x7,x8,x9,x10,x11,yn1,yn2,yn3,yq1,yq2,yp1 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t16setup.out 2>&1
QA_LABELS=x3c5 QA_CHILD=Kabir QA_CLASS="Class 5" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t16setup.out 2>&1
echo SETUP-DONE $(grep -cE '^[a-z0-9]+ \{"email' /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t16setup.out) >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t16setup.out
for l in a b c; do /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t16$l.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t16$l.out 2>&1 & done
wait; echo ALL16 >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t16a.out
