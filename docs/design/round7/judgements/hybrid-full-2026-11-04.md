# Hybrid full run: Director vs agent (judged 2026-11-04)

How the run was set up:
- Code and data:
  - stream A's harness on claude/r4-conversation;
  - Director half from `evals/hybrid-side-by-side/results/2026-11-04-full/` (run on f2c55d0d, with the 11 pilot fixes in);
  - agent half from `…/2026-11-04-full-agent2/` (rerun on b022df8a with the production agent invariants applied).
- Topics, all Hinglish with scripted child lines:
  - c6 perimeter;
  - c5 fractions on the number line;
  - c4 fractions as equal shares.
- Scenarios: steady, offtopic, stuck, steering.
- 23 lessons: 12 Director and 11 agent (the agent's steering-c4 hit the spend cap).
- Spend: about 1,052 model calls, about $2.72 in total.

How it was judged:
- Three Claude judges, one per class, read every turn against OWNER-RESET-2026-10-04 and the 11 pilot defects.
- The main loop then combined their findings.
- The judges were not blind: each knew which lane was which.

## Latency: reply ready (classifier plus her whole line), p50

| | Director | Agent |
|---|---|---|
| All lessons | **2195 ms** (n=120) | **3941 ms** (n=110) |
| c6 | 2273 | 3969 |
| c5 | 2207 | 3877 |
| c4 | 2129 | 3965 |

The agent misses the ~3.5 s bar in dc-r7-hybrid-brain. The slowest turns are Director 9676 ms and agent 9748 ms.

## Which lane was better, scenario by scenario

| | steady | offtopic | stuck | steering |
|---|---|---|---|---|
| c6 | Director | Director (narrowly) | Director | Director |
| c5 | agent (narrowly) | agent | agent (narrowly; both fail) | agent |
| c4 | Director | Director (narrowly) | agent | Director only (no agent run) |

- **Director.** It explains before it tests, reaches the class's level of content, and is 1.7 s faster.
- **Agent.** It listens better, grades honestly, and honours "chhota / Hindi / khud try" more often. But it collapses into counting lessons, sometimes at class-1 level ("2 se aage teen gino", "do balls haath mein hain toh kitni uthayi?"). Its spoken question and the card on screen disagree. It tells children "Game yahan nahi hai". Its level-floor regexes are too narrow to catch any of this.

## The 11 pilot defects after the fixes

**Fixed everywhere:**
- #2: "kuch aur baat" is no longer read as "explain differently".
- #3: every stop gets a check-in. Three of these were rewritten by a guard.

**Mostly fixed:**
- #4: no false "didn't hear", except one left in FALLBACK.other.

**Still present:**
- #1: English card text, in the Director lane, c4 and c5.
- #5: worked examples missing their givens.
- #7: abandoned items. This is the most frequent defect, in both lanes.
- #8: level collapse. Worst in the agent lane; in the Director lane, "Rectangle mein kitni sides" at class 6.
- #10: choices ignored.
- #11: game claims. Director c5 says "Game ne 3 jumps register kiye".

**Partial:**
- #9: return happens, but nothing is parked and brought back.

**New and critical:**
- A wrong answer was affirmed. c5 stuck: "5?" got "haan, wahi sahi hai".
- A game-menu pick was graded as correct.

None of the 23 lessons meets the owner's bar. Diversions are handed to a button, not parked and returned. Picture requests get talk, but the harness has no Studio; check this on production.

## Decision: dc-r7-hybrid-director-default

- The Director is the default lane.
- The agent lane is frozen behind its flag.
- Its strengths are to be ported into the Director's wording: listening to what the child actually says, honest grading, honouring requests, and engaging with the child's topic. After that, the lane is deleted.
- Brain's next block is these defects as Director invariants, ordered as in the message to stream A:
  1. affirming wrong answers;
  2. English cards;
  3. language persistence;
  4. abandoned items;
  5. givens in worked examples;
  6. level floor;
  7. park and return;
  8. choices and promises;
  9. FALLBACK.other;
  10. game claims;
  11. repetition.
- Then rerun the Director half.

Reverse if a later side-by-side, run after the port, shows the agent at least as good as the Director with p50 ≤ 3.5 s.
