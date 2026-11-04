# Hybrid side-by-side pilot: Director vs agent (judged by the main loop, 2026-11-04)

Source: `evals/hybrid-side-by-side/results/2026-11-04/` on claude/r4-conversation @ 8c42d580, stream A's harness.
- Production deployments: reply taxila-fast, classify grok-4-1-fast-non-reasoning, agent taxila-gpt6. No DB.
- c6-maths-ch06-t01 (perimeter), class 6, Hinglish.
- Scripted child, with the same lines for both lanes.
- n = 2 scenarios (steady, offtopic) × 2 lanes × 10 child turns. `stuck` was not run: the 150-call cap was reached. About $0.26.
- Judged by Claude in the main loop, reading every turn against OWNER-RESET-2026-10-04. Not blind: I knew which lane was which.
  Small n: this is a defect hunt, not a verdict.

## Reply ready, p50 (classifier + her whole line)

| scenario | Director | agent |
|---|---|---|
| steady | 2033 ms | 3818 ms |
| offtopic | 2569 ms | 3183 ms |

One agent turn took 9533 ms: taxila-gpt6 timed out at 6 s, then the Director fallback ran.
dc-r7-hybrid-brain sets about 3.5 s p50 as the agent's bar. It misses on steady.

## What each lane did better

- **Director.** It runs the lesson arc: explain, then worked example, then practice and hint. It honours "ek aur example do" with a fresh example.
  "bas ho gaya" gets the stop check-in (continue / short break / stop), as OWNER-RESET #7 asks. It is faster.
- **Agent.** It honours "kuch aur baat karte hain" and really talks about something else. Its acknowledgements sound natural. One diagnosis was
  excellent: on "3", it said "woh triangle ki sides ki ginti hai, boundary ki lambai nahi". It speaks numbers as words.

## Defects (each is a bug whichever lane wins)

1. **Truncated English kit text spoken in a Hinglish lesson (Director, offtopic).** "Rani runs 3 rounds of a rectangular park
   50 m long and 30 m wide. How far does… Khaali jagah bharo: 3 × 160 = ___ m." The card was read aloud, cut mid-sentence with
   "…", in English, and repeated verbatim as the hint. This breaks OWNER-RESET #9 (zero visible failure) and the lesson language.
   Worst finding.
2. **"kuch aur baat karte hain" read as "explain it differently" (Director).** She offered picture / story / game. OWNER-RESET #6/#8
   asks for this: notice the diversion, say so kindly, park it, and come back to it later; if the child insists and it's within bounds,
   engage briefly. The steer:else chip maps to change_topic, but the SPOKEN words took the repair path.
3. **"bye" ends the lesson at once (both lanes).** It must take the stop check-in like "bas ho gaya"
   (dc-r7-stop-limits). The agent ALSO ended on "bas ho gaya" with no check-in (steady).
4. **A false "I couldn't hear you" (Director, steady).** "8" to a perimeter-or-area question got "tumhara answer mujhe clearly
   sunai nahi diya". The words were heard; they just didn't fit. She must never claim she didn't hear words she did hear.
5. **A worked example with no setup (Director, steady).** "Ek round ka perimeter 2 times 50 plus 30, yani 160 m". The 50 m × 30 m
   park was never stated, and "2 times 50 plus 30" is ambiguous (2×(50+30) or 2×50+30).
6. **An open question graded as a wrong number (Director, steady).** After "Rectangle ki sides kaise jodogi?", the child said "4"
   (probably "4 sides") and got "4 nahi". A how-question has no numeric key: credit what fits, or ask.
7. **An open item abandoned on "theek hai" (Director, steady).** The triangle question was never answered, then a new probe started.
8. **Level collapse (agent, steady).** For a class-6 child, a wrong sum became a counting-on lesson ("paanch se chhe kadam aage
   gino"), then drifted to 5+2 with cricket runs for 6 turns. That is OWNER-RESET #1/#2: wrong age, wrong level. Remediation stays at
   class level (show the sum, move on).
9. **No return from a diversion (agent, offtopic).** It stayed off-topic for 3 turns, came back, then dropped maths again on
   "boring" ("Maths abhi side mein rakhte hain") and never returned. Engage briefly, then win attention back.
10. **An offered choice ignored (Director, offtopic).** She offered "picture puzzle, cricket story, ya speed game"; the child said
    "haan" and got plain practice. Honour the choice, or ask which one.
11. **A game that doesn't exist (Director, offtopic).** "game khelna hai" got a spoken "game rule", then "Game ne 3 ko pehli side
    maana". The harness has no Studio, so this may be harness-only. But she must never describe a game the screen doesn't show
    (screen truth).

## Decision (main loop)

- **No lane is picked from this pilot.** The hybrid plan stands: the LLM words and plans, and code keeps the invariants.
- The pilot shows which invariants are missing:
  - in BOTH lanes: the stop check-in on every goodbye, and park-and-return on change_topic;
  - card text spoken whole and in the lesson language;
  - a level floor on remediation;
  - no false "didn't hear".
- Brain fixes 1-10 as code invariants that apply to both lanes. Then the full run from dc-r7-hybrid-brain:
  12 lessons per lane, with `stuck` and two more scenarios (a class-4 child; a steering-heavy child).
