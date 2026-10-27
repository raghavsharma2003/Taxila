#!/bin/bash
# Sim lab queue (one run's lessons at a time, ≤4 parallel): after the a978ae27 re-check →
# stream 3 continuer arm @63bf58d6 → rep3 remainder (709b vs d71fb40e) → 24a47daf vs 14.2 c61f728c board battery.
cd /home/user/Taxila
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad
waitjudging() { sleep 60; until grep -q "^judging" "$1" 2>/dev/null; do sleep 30; done; }
up() { for i in $(seq 1 40); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$1/api/health)" = 200 ] && return 0; sleep 3; done; return 1; }

waitjudging $S/a978.log

# 1. stream 3 continuer gate (tuned) — voice, TEST cohort on this TEST server only (never printed)
COH=$(node -e 'const P=require("./evals/simlab/personas.json"); const s=P.filter(p=>p.safetyEvent), r=P.filter(p=>!p.safetyEvent&&!p.petEvent); console.log([...s,...r.slice(0,28)].map(p=>`simlab+${p.id}-lat63v-k1015@taxila.test`).join(","))')
PORT=8828 NODE_USE_ENV_PROXY=1 SIMLAB_SERVER_ROOT=$S/wt/lat63 TAXILA_ACK_CONTINUER_FOR="$COH" NODE_OPTIONS=--max-old-space-size=8192 nohup node evals/simlab/serve.mjs > $S/srv-8828.log 2>&1 &
up 8828
NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms lat63v=http://127.0.0.1:8828 --lanes voice --ack --email-key k1015 --n 32 --conc 4 --run-id r5-lat-63bf58d-voice-cont --note "Stream 3 claude/r4-latency @63bf58d6 (the continuer gate tuned after the 14.2 voice arm's over-refusal report), Director lane, VOICE with the device's turn-ack ask (continuer:true), TEST cohort in TAXILA_ACK_CONTINUER_FOR on this TEST server only; same 32 cards as r5-rel142-f058080-voice-cont; free child; lessons capped at 4. Pass bar (main): 0 continuers on safety / leaving / relational turns, ordinary coverage toward ~25%, ack_natural ≥ 3.75 (grok)." > $S/lat63.log 2>&1 &
waitjudging $S/lat63.log

# 2. rep3 remainder (stream 2)
A=http://127.0.0.1:8822 B=http://127.0.0.1:8819
NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms c709b_1=$A,c709b_2=$A,c709b_3=$A,cd71fb_1=$B,cd71fb_2=$B,cd71fb_3=$B --only p49,p50,p51,p52,p53,p54,p55,p56,p25,p16,p24,p15,p29,p31,p07 --conc 4 --resume --run-id r5-board-rep3-709b-vs-d71fb4 --note "Board repeats for stream 2: claude/r4-content @709b6acb vs @d71fb40e, 3 runs per arm (arms _1.._3 pooled), 15 board cards: the 8 visual-ask cards + every card that drew a compare/flow/cycle library board in earlier runs (p25 p16 p24 p15 p29 p31 p07); text lane, 14 child turns. Lead with BOARDFACTS.json (code), then judge channel_truth against the A/A band." > $S/rep3b.log 2>&1 &
waitjudging $S/rep3b.log

# 3. stream 2 sync rule head vs plain 14.2
PORT=8827 NODE_USE_ENV_PROXY=1 SIMLAB_SERVER_ROOT=$S/wt/content5 NODE_OPTIONS=--max-old-space-size=8192 nohup node evals/simlab/serve.mjs > $S/srv-8827.log 2>&1 &
up 8827
NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms base142=http://127.0.0.1:8820,c24a47=http://127.0.0.1:8827 --only p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27,p28,p29,p30,p31,p43,p49,p50,p51,p52,p53,p54,p55,p56 --conc 4 --run-id r5-board-142-vs-24a47d --note "Board battery for stream 2: claude/r4-content @24a47daf (14.2 c61f728c + the sync rule: a NEW page only when its writing shares a content word or number with her line; asked-for boards exempt) vs base int/r5-rel142 @c61f728c, same 40 cards (32 base + 8 visual-ask), same time, text lane, free child, 14 child turns, lessons capped at 4. Lead with BOARDFACTS.json (code); A/A band r5-board-aa-709b." > $S/b24a.log 2>&1
wait
for d in r5-lat-63bf58d-voice-cont r5-board-rep3-709b-vs-d71fb4 r5-board-142-vs-24a47d; do node evals/simlab/facts.mjs evals/simlab/results/$d > /dev/null; node evals/simlab/boardfacts.mjs evals/simlab/results/$d > /dev/null; done
echo QUEUE2 DONE
