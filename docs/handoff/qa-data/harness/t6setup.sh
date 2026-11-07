#!/bin/bash
S=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad; Q=$S/qa144
cd /home/user/Taxila
export QA_BASE=http://127.0.0.1:8095 QA_OUT=$Q QA_SHOTS=$Q/shots/
QA_LABELS=y4a,y1b,yg1,yg2,yg3,yg4,yg5,yc1,ys1,yv1,y4b,yp30,yb,ye,yc2,ys1b,yn1,yd1,yd2 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs 2>&1 | grep -E "FAILED|^y[a-z0-9]+ \{\"email" | cut -c1-60
QA_LABELS=ys2c7 QA_CHILD=Kabir QA_CLASS="Class 7" node tests/e2e/qa-setup.mjs 2>&1 | grep -E "FAILED|^y[a-z0-9]+ \{\"email" | cut -c1-60
echo SETUP-DONE
