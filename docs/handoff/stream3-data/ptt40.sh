#!/bin/bash
# tap-to-talk page-clock run, n = 4 lessons x 12 lines, plain account, Done 0.7 s after speech
cd /home/user/Taxila
S=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad
for pat in "tests/prod/r4-timeline/driver.mjs" "server/serve.mjs" "server/worker.mjs"; do pgrep -f "$pat" | while read p; do ps -p $p -o args= | grep -q "^node" && kill $p; done; done
sleep 2
export TAXILA_TURN_PREFETCH=on TAXILA_EXACT_SPEC=on TAXILA_ACK_AT_MS=1000
tests/prod/r4-timeline/serve.sh 5190 $S/web40.log web &
tests/prod/r4-timeline/serve.sh 5191 $S/worker40.log worker &
(PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers nohup node tests/prod/r4-timeline/driver.mjs > $S/driver40.log 2>&1 &)
until curl -s -o /dev/null http://127.0.0.1:5190/ ; do sleep 1; done; sleep 5
cd tests/prod/r4-timeline
: > $S/tl-ptt40.jsonl
for k in 1 2 3 4; do
  sid=p$k
  ./r "$(node openchild.mjs plain kabir $sid phone360 '/c/{cid}/lesson/new')" >/dev/null 2>&1; sleep 6
  ./r "{\"op\":\"click\",\"sid\":\"$sid\",\"sel\":\"[data-testid=\\\"tap-to-hear\\\"]\"}" >/dev/null 2>&1; sleep 15
  for line in "Mujhe batting pasand hai." "Haan, samajh gaya." "Do bata teen." "Mujhe nahi pata, ek baar aur batao na." "Teen bata chaar." "Half ka half ek chauthai hota hai." "Haan didi." "Chhe bata baarah." "Mujhe lagta hai answer ek bata do hai." "Achha, aage batao." "Paanch bata aath." "Kyunki maine multiply kiya."; do
    curl -sS -m 200 -X POST http://127.0.0.1:5199/ -d "{\"op\":\"say\",\"sid\":\"$sid\",\"text\":\"$line\",\"doneAfterMs\":700}" | LESSON=$k node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let j={};try{j=JSON.parse(s)}catch{};const t=j.tl||{};console.log(JSON.stringify({lesson:+process.env.LESSON,sent:t.sent,final:t.endToFinal,post:t.endToTurnPost,turn:t.turnMs,pf:t.prefetch,ack:t.ackStatus,ackAt:t.endToAck,tts:t.endToTts,sound:t.endToReplySound,first:t.endToFirstSound,move:j.last?.move,verdict:j.last?.verdict,err:j.error}))})' >> $S/tl-ptt40.jsonl
  done
  ./r "{\"op\":\"close\",\"sid\":\"$sid\"}" >/dev/null 2>&1
done
echo PTTDONE
