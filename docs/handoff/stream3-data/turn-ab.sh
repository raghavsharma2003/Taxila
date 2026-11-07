cd /home/user/Taxila
O=docs/design/round5/results/latency
for r in 1 2; do
  TAXILA_UNDERSTAND_DEPLOY=taxila-gpt6 TAXILA_DB=test node --env-file=tests/prod/prod-routing.env evals/relational-human/first-sound.mjs --prefetch --ack --turns 15 --label "before-gpt6-r$r" --out $O/turn-before-r$r.json > $O/turn-before-r$r.log 2>&1
  TAXILA_DB=test node --env-file=tests/prod/prod-routing.env evals/relational-human/first-sound.mjs --prefetch --ack --turns 15 --label "after-race-r$r" --out $O/turn-after-r$r.json > $O/turn-after-r$r.log 2>&1
done
echo DONE
