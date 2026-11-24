#!/bin/bash
cd /home/user/Taxila
export QA_BASE=http://127.0.0.1:8098 QA_OUT=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144 QA_SHOTS=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/shots/
QA_LABELS=r1,r2,r3,r4,r5,s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,g1,g2,g3,g4,g5 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13setup.out 2>&1
QA_LABELS=r6,r7 QA_CHILD=Riya QA_CLASS="Class 4" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13setup.out 2>&1
QA_LABELS=g6,g7 QA_CHILD=Kabir QA_CLASS="Class 5" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13setup.out 2>&1
echo SETUP-DONE $(grep -cE '^[rsg][0-9]+ \{"email' /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13setup.out) >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13setup.out
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13a.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13a.out 2>&1 &
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13b.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13b.out 2>&1 &
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t13c.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13c.out 2>&1 &
wait; echo ALL13 >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t13a.out
