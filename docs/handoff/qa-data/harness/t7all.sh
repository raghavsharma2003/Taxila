#!/bin/bash
cd /home/user/Taxila; Q=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144
QA_BASE=http://127.0.0.1:8095 QA_OUT=$Q QA_SHOTS=$Q/shots/ QA_LABELS=z4a,zh2,zr1,zg1,zg2,zg3,zg4,zg5,zs1,z4b,zr2,z1b,zp30,zb,ze,zc,zn,zv QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > $Q/t7setup.out 2>&1
QA_BASE=http://127.0.0.1:8095 QA_OUT=$Q QA_SHOTS=$Q/shots/ QA_LABELS=zs2c7 QA_CHILD=Kabir QA_CLASS="Class 7" node tests/e2e/qa-setup.mjs >> $Q/t7setup.out 2>&1
echo SETUP-DONE $(grep -c '^z[a-z0-9]* {"email' $Q/t7setup.out) >> $Q/t7setup.out
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t7a.sh > $Q/t7a.out 2>&1 &
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t7b.sh > $Q/t7b.out 2>&1 &
wait; echo ALLDONE >> $Q/t7a.out
