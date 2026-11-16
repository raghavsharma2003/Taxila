cd /home/user/Taxila
S=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad
for pat in "tests/prod/r4-timeline/driver.mjs" "server/serve.mjs" "server/worker.mjs"; do pgrep -f "$pat" | while read p; do ps -p $p -o args= | grep -q "^node" && kill -9 $p; done; done
npx vite build >/dev/null 2>&1
tests/prod/r4-timeline/serve.sh 5190 $S/web-sc.log web & W=$!
tests/prod/r4-timeline/serve.sh 5191 $S/worker-sc.log worker & K=$!
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/prod/r4-timeline/driver.mjs > $S/driver-sc.log 2>&1 & D=$!
until curl -s -o /dev/null http://127.0.0.1:5190/ ; do sleep 1; done; sleep 5
cd tests/prod/r4-timeline && node $S/startclock.mjs 20 sc > $S/startclock.jsonl 2> $S/startclock.err
kill -9 $W $K $D
pgrep -f "server/serve.mjs|server/worker.mjs" | while read p; do ps -p $p -o args= | grep -q "^node" && kill -9 $p; done
echo SCDONE
