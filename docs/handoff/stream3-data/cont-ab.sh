cd /home/user/Taxila
O=docs/design/round5/results/latency
for r in 1 2; do
  TAXILA_DB=test node --env-file=tests/prod/prod-routing.env evals/relational-human/first-sound.mjs --prefetch --ack --turns 15 --label "ack-r$r" --out $O/cont-off-r$r.json > $O/cont-off-r$r.log 2>&1
  TAXILA_DB=test node --env-file=tests/prod/prod-routing.env evals/relational-human/first-sound.mjs --prefetch --ack --continuer --turns 15 --label "continuer-r$r" --out $O/cont-on-r$r.json > $O/cont-on-r$r.log 2>&1
done
echo DONE
