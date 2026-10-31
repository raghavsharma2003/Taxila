#!/bin/bash
# usage: run1432.sh <tag> <acc> <line> [follow]
S=/tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad; Q=$S/qa13
export QA_BASE=http://127.0.0.1:8095 QA_OUT=$Q QA_SHOTS=$Q/shots/
cd /home/user/Taxila
timeout 300 env QA_ACC="$2" QA_TAG="$1" QA_LINE="$3" QA_FOLLOW="$4" node $S/sg.mjs > $Q/x-$1.log 2>&1
node -e "
const d=require('fs').readFileSync('$Q/x-$1.log','utf8');const i=d.indexOf('{');if(i<0){console.log('$1 FAILED',d.slice(0,200));process.exit()}
const j=JSON.parse(d.slice(i));const L=j.start&&j.start.lessonId;
console.log('== $1 ['+'$2'+'] lesson',L,'| start chips',JSON.stringify(j.start&&j.start.chips),'| carry',j.afterCarry?j.afterCarry.move:'-');
for(const s of j.steps){if(s.closeSheet)continue;console.log('   ['+s.line.slice(0,48)+'] move',s.move,'| sheet',s.ui&&s.ui.sheet,'| board',JSON.stringify(s.wb),'| chips',JSON.stringify(s.chips),'| helpLead',s.helpLead,'\n     reply:',(s.reply||'').slice(0,170));}
require('fs').writeFileSync('$Q/x-$1.lid',L||'');"
L=$(cat $Q/x-$1.lid); [ -n "$L" ] && TAXILA_DB=test timeout 150 node --env-file=.env.local scripts/trace.mjs --session $L 2>&1 | grep -E "safety distress|TURN [0-9]+ move" | cut -c14-170 | sed 's/^/     /'
