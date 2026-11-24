#!/bin/bash
cd /home/user/Taxila; Q=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144
QA_BASE=http://127.0.0.1:8095 QA_OUT=$Q QA_SHOTS=$Q/shots/ QA_LABELS=zv2,zl1,zl2,e1,e2,e3,e4,e5 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > $Q/t8setup.out 2>&1
/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t8.sh > $Q/t8.out 2>&1
