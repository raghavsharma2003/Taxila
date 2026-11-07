cd /home/user/Taxila
O=docs/design/round5/results/latency
for r in 1 2 3; do
  node evals/latency/start-phone.mjs --n 5 --query puppet=0 --storage tx.flag.latency.startAudio=0 --label startaudio-off-r$r --out $O/startaudio-off-r$r.json > $O/startaudio-off-r$r.log 2>&1
  node evals/latency/start-phone.mjs --n 5 --query puppet=0 --storage tx.flag.latency.startAudio=1 --label startaudio-on-r$r --out $O/startaudio-on-r$r.json > $O/startaudio-on-r$r.log 2>&1
done
echo DONE
