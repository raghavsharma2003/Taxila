#!/bin/bash
# restart the local QA server on :8090
cd /home/user/Taxila
for p in $(pgrep -f "node --env-file=.env.local --env-file=tests/prod/prod-routing.env server/serve.mjs"); do kill $p; done
sleep 1
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt PORT=${PORT:-8090} TAXILA_DIST=${DIST:-dist} nohup node --env-file=.env.local --env-file=tests/prod/prod-routing.env server/serve.mjs > /tmp/claude-0/-home-user-Taxila/9217c10b-ccf3-5b3e-ae56-20087ae0d8a1/scratchpad/server.log 2>&1 &
for i in $(seq 1 50); do curl -s localhost:${PORT:-8090}/api/health >/dev/null && break; sleep 0.2; done
curl -s localhost:${PORT:-8090}/api/health
