#!/bin/bash
# chips.sh <tag> <qa-dir> <acc> <line>
S=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad; Q=$S/$2
export QA_BASE=http://127.0.0.1:8095 QA_OUT=$Q QA_SHOTS=$Q/shots/
cd /home/user/Taxila
timeout 300 env QA_ACC="$3" QA_TAG="$1" QA_LINE="$4" node $S/sg.mjs > $S/qa13/y-$1.log 2>&1
node -e "const d=require('fs').readFileSync('$S/qa13/y-$1.log','utf8');const i=d.indexOf('{');if(i<0){console.log('$1 FAIL',d.slice(0,200));process.exit()}const j=JSON.parse(d.slice(i));
const s=j.steps.filter(x=>!x.closeSheet)[0]||{};console.log('== $1 ['+'$3'+'] lesson',j.start.lessonId,(j.afterCarry?'(carried check-in first)':''),'\n   move',s.move,'| chips',JSON.stringify(s.chips),'\n   reply:',(s.reply||'').slice(0,200))"
