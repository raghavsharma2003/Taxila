cd /home/user/Taxila
S=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad
pgrep -f "server/serve.mjs|server/worker.mjs" | while read p; do ps -p $p -o args= | grep -q "^node" && kill -9 $p; done
PORT=5190 NODE_USE_ENV_PROXY=1 NODE_ENV=production ACCESS_LOG=off NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node --env-file=.env.local --import ./tests/prod/r4-timeline/preload.mjs server/serve.mjs > $S/r12-web.log 2>&1 & W=$!
until curl -s -o /dev/null http://127.0.0.1:5190/api/health ; do sleep 1; done
node --env-file=.env.local evals/relational-human/first-sound.mjs --base http://127.0.0.1:5190 --lessons 1 --turns 6 --ack --prefetch --keep-account --label "r12 T-server evidence: packaged production build (serve.mjs, NODE_ENV=production) against TEST" --out $S/r12-ev.json > $S/r12-ev.log 2>&1
echo "fs exit=$?"
sleep 3
kill -9 $W
echo EVDONE
