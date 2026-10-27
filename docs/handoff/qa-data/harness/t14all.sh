#!/bin/bash
cd /home/user/Taxila
export QA_OUT=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144 QA_SHOTS=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/shots/
QA_BASE=http://127.0.0.1:8098 QA_LABELS=q1,q2,q3,q4,q5,k1,k2,k3,k4,k5,k6,k7,k8,k9,k10,k11,gwhy,gor,gnahinahi,gtoh,gq,p1,p2,p3,p4 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t14setup.out 2>&1
QA_BASE=http://127.0.0.1:8098 QA_LABELS=q6,q7 QA_CHILD=Riya QA_CLASS="Class 4" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t14setup.out 2>&1
QA_BASE=http://127.0.0.1:8098 QA_LABELS=gf1,gf2 QA_CHILD=Kabir QA_CLASS="Class 5" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t14setup.out 2>&1
echo SETUP-DONE $(grep -cE '^[a-z0-9]+ \{"email' /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t14setup.out) >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t14setup.out
for l in a b c d; do /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t14$l.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t14$l.out 2>&1 & done
wait; echo ALL14 >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t14a.out
