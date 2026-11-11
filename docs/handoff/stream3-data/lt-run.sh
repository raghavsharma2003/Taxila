cd /home/user/Taxila
S=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad
export TAXILA_TURN_PREFETCH=on TAXILA_EXACT_SPEC=on TAXILA_ACK_AT_MS=1000
tests/prod/r4-timeline/serve.sh 5190 $S/web-lt.log web & W=$!
tests/prod/r4-timeline/serve.sh 5191 $S/worker-lt.log worker & K=$!
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-timeline/driver.mjs > $S/driver-lt.log 2>&1 & D=$!
until curl -s -o /dev/null http://127.0.0.1:5190/ ; do sleep 1; done; sleep 5
cd tests/prod/r4-timeline
./r "$(node openchild.mjs plain kabir lt1 phone360 '/c/{cid}/lesson/new')" >/dev/null 2>&1; sleep 6
./r '{"op":"click","sid":"lt1","sel":"[data-testid=\"tap-to-hear\"]"}' >/dev/null 2>&1; sleep 15
node $S/longtask.mjs lt1 > $S/lt.jsonl 2>&1
kill -9 $W $K $D
pgrep -f "server/serve.mjs|server/worker.mjs" | while read p; do ps -p $p -o args= | grep -q "^node" && kill -9 $p; done
echo LTDONE
