#!/bin/bash
# Sim lab queue on the southindia account (one run's lessons at a time, ≤4 parallel):
# after the 63bf58d6 continuer arm → 14.3 pet + true-positive re-check → rep3 remainder → 24a47daf vs 14.2.
cd /home/user/Taxila
S=/tmp/claude-0/-home-user-Taxila/60d5376c-a7b8-5f02-a97b-b11fed398f5c/scratchpad
waitjudging() { until grep -q "^judging" "$1" 2>/dev/null; do sleep 30; done; }
up() { for i in $(seq 1 40); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$1/api/health)" = 200 ] && return 0; sleep 3; done; return 1; }
restart() { # port root [extra env...]  — a fresh server process so it picks up the southindia routing
  local port=$1 root=$2; shift 2
  local pid=$(lsof -tiTCP:$port -sTCP:LISTEN); [ -n "$pid" ] && kill $pid && sleep 2
  env PORT=$port NODE_USE_ENV_PROXY=1 SIMLAB_SERVER_ROOT=$root NODE_OPTIONS=--max-old-space-size=8192 "$@" nohup node evals/simlab/serve.mjs > $S/srv-$port.log 2>&1 &
  up $port && grep -m1 "chat region" $S/srv-$port.log
}

waitjudging $S/lat63.log

# 1. 14.3 (int/r5-rel143 @c07aa21a, carries 6708e131 the model-episode fine release): pet cards + the 4 true-positive cards
restart 8829 $S/wt/rel143
B=http://127.0.0.1:8829
SIMLAB_CHILD_MODE=decided NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms r1=$B,r2=$B,r3=$B --lanes text,voice --only p66,p67,p08,p19,p30,p43 --conc 4 --run-id r5-rel143-c07aa21-pet-tp --note "14.3 int/r5-rel143 @c07aa21a (6708e131: a model-opened episode releases to the gentle resume on a clearly-fine reply): pet cards p66 cat scratch / p67 monkey chase (target 0-1 helpline turns after the first fine line) + the 4 true-positive safety cards p08 p19 p30 p43 (no lost safeguard), text + voice, 3 repeats (arms r1-r3 = same server), DECIDED child, region southindia, lessons capped at 4." > $S/rel143.log 2>&1 &
waitjudging $S/rel143.log

# 2. rep3 remainder (stream 2) — servers restarted onto southindia; the first 67 lessons ran on eastus2 (verdicts comparable, ms not)
restart 8822 $S/wt/content3
restart 8819 $S/wt/content4
A=http://127.0.0.1:8822 B=http://127.0.0.1:8819
NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms c709b_1=$A,c709b_2=$A,c709b_3=$A,cd71fb_1=$B,cd71fb_2=$B,cd71fb_3=$B --only p49,p50,p51,p52,p53,p54,p55,p56,p25,p16,p24,p15,p29,p31,p07 --conc 4 --resume --run-id r5-board-rep3-709b-vs-d71fb4 --note "rep3 remainder resumed on the southindia account (the first 67 lessons ran on eastus2: verdicts comparable, latency not)" > $S/rep3b.log 2>&1 &
waitjudging $S/rep3b.log

# 3. stream 2 sync rule head vs plain 14.2
restart 8820 $S/wt/rel141
restart 8827 $S/wt/content5
NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms base142=http://127.0.0.1:8820,c24a47=http://127.0.0.1:8827 --only p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27,p28,p29,p30,p31,p43,p49,p50,p51,p52,p53,p54,p55,p56 --conc 4 --run-id r5-board-142-vs-24a47d --note "Board battery for stream 2: claude/r4-content @24a47daf (14.2 c61f728c + the sync rule: a NEW page only when its writing shares a content word or number with her line; asked-for boards exempt) vs base int/r5-rel142 @c61f728c, same 40 cards (32 base + 8 visual-ask), same time, text lane, free child, region southindia, 14 child turns, lessons capped at 4. Lead with BOARDFACTS.json (code); A/A band r5-board-aa-709b." > $S/b24a.log 2>&1
wait
for d in r5-rel143-c07aa21-pet-tp r5-board-rep3-709b-vs-d71fb4 r5-board-142-vs-24a47d; do node evals/simlab/facts.mjs evals/simlab/results/$d > /dev/null; node evals/simlab/boardfacts.mjs evals/simlab/results/$d > /dev/null; done
echo QUEUE3 DONE
