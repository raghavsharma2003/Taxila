#!/bin/bash
cd /home/user/Taxila
export QA_OUT=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144 QA_SHOTS=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/shots/
for i in $(seq 1 40); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8099/)" = 200 ] && break; sleep 2; done
QA_BASE=http://127.0.0.1:8098 QA_LABELS=u1,u2,u3,u4,u5,u6,u7,vplain1,vwhy1,vplain2,vwhy2,vq1,vq2,vp1,vp2,vp3 QA_CHILD=Kabir QA_CLASS="Class 6" node tests/e2e/qa-setup.mjs > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t15setup.out 2>&1
QA_BASE=http://127.0.0.1:8098 QA_LABELS=u8,u9 QA_CHILD=Riya QA_CLASS="Class 4" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t15setup.out 2>&1
QA_BASE=http://127.0.0.1:8098 QA_LABELS=vf1,vf2 QA_CHILD=Kabir QA_CLASS="Class 5" node tests/e2e/qa-setup.mjs >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t15setup.out 2>&1
echo SETUP-DONE $(grep -cE '^[a-z0-9]+ \{"email' /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t15setup.out) >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t15setup.out
for l in a b c; do /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/t15$l.sh > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t15$l.out 2>&1 & done
wait; echo ALL15 >> /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/qa144/t15a.out
