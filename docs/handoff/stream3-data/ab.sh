cd /home/user/Taxila
for i in 1 2 3 4 5; do
  for arm in branch base; do
    root=/home/user/Taxila; [ $arm = base ] && root=/tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad/basewt
    node --env-file=.env.local --import ./tests/prod/r4-timeline/preload.mjs evals/relational-human/first-sound.mjs --root $root --lessons 3 --turns 5 --ack --prefetch --start-audio --label "r4-latency start+reply A/B arm=$arm round $i; prod routing (prod-routing.env); merged tree 7f50319b vs base 4f92408c; US container" --out /tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad/ab/$arm-$i.json > /tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad/ab/$arm-$i.log 2>&1
    echo "$arm $i exit=$?"
  done
done
echo ABDONE
