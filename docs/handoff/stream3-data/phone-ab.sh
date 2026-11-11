cd /home/user/Taxila
for r in 1 2 3; do
  node evals/latency/start-phone.mjs --n 10 --root /tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad/base --label base-r$r --out docs/design/round5/results/latency/start-phone-base-r$r.json > docs/design/round5/results/latency/start-phone-base-r$r.log 2>&1
  node evals/latency/start-phone.mjs --n 10 --label head-r$r --out docs/design/round5/results/latency/start-phone-head-r$r.json > docs/design/round5/results/latency/start-phone-head-r$r.log 2>&1
done
echo DONE
