#!/bin/bash
cd /home/user/Taxila; Q=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144
QA_BASE=http://127.0.0.1:8097 QA_OUT=$Q QA_SHOTS=$Q/shots/ QA_LABELS=f1,f2,f3 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > $Q/t9setup.out 2>&1
# start the LM lane when the confirm lane reaches f0cb84c8, so both load :8097 together
until grep -q "e8723394 confirm" $Q/t8.out; do sleep 5; done
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t9.sh > $Q/t9.out 2>&1
