#!/bin/bash
cd /home/user/Taxila
PORT=${PORT:-8811} NODE_ENV=production NODE_USE_ENV_PROXY=1 exec node --env-file=.env.local --import /tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/e2e-review/preload.mjs "$@"
