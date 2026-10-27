cd /home/user/Taxila
O=docs/design/round5/results/latency
for r in 1 2 3; do
  node evals/latency/start-phone.mjs --n 10 --query puppet=0 --root /tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad/base --label base-r$r --out $O/start-phone-base-r$r.json > $O/start-phone-base-r$r.log 2>&1
  node evals/latency/start-phone.mjs --n 10 --query puppet=0 --label head-r$r --out $O/start-phone-head-r$r.json > $O/start-phone-head-r$r.log 2>&1
done
echo DONE
