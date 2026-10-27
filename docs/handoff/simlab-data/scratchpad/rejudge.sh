cd /home/user/Taxila
for R in r5-rel144-c142e87-36card r5-rel144-b8285b2-tiered-36card; do NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --rejudge evals/simlab/results/$R > /tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad/rj-$R.log 2>&1; done
