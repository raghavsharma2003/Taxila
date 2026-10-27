cd /home/user/Taxila
run() { env TAXILA_TURN_PREFETCH=on TAXILA_EXACT_SPEC=on TAXILA_ACK_AT_MS=1000 $2 node --env-file=.env.local --import ./tests/prod/r4-timeline/preload.mjs evals/relational-human/first-sound.mjs --lessons 3 --turns 20 --ack --prefetch --label "$3" --out docs/design/round4/build/latency/runs/$1.json > /tmp/claude-0/-home-user-Taxila/3c94468e-313b-5df4-a797-6f6b39405d88/scratchpad/$1.log 2>&1; echo "$1 exit=$?"; }
run reply-luna-a DEPLOY_REPLY=taxila-gpt6-luna "r4-latency reply-model arm (a): DEPLOY_REPLY=taxila-gpt6-luna; AFTER config (prefetch on, EXACT on, ACK 1000); merged tree 620a0a0e; 3 lessons; load label r4-latency"
run reply-control-c X=1 "r4-latency reply-model arm CONTROL (c): DEPLOY_REPLY default (taxila-fast); AFTER config; merged tree 620a0a0e; interleaved between luna runs"
run reply-luna-b DEPLOY_REPLY=taxila-gpt6-luna "r4-latency reply-model arm (b): DEPLOY_REPLY=taxila-gpt6-luna; AFTER config; merged tree 620a0a0e"
run reply-control-d X=1 "r4-latency reply-model arm CONTROL (d): DEPLOY_REPLY default (taxila-fast); AFTER config; merged tree 620a0a0e"
echo ALLDONE
