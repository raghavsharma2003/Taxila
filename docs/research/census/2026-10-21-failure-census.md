# Failure census, 15 production lessons (2026-10-21)

Phase 0 of the understanding programme: before building anything new, code what actually goes wrong in real lessons.

**Method.** 15 lesson exports from production (the flight recorder's turn rows and trace, real lesson ids, read-only),
coded by three parallel agents (lessons 1-5, 6-10, 11-15) against one fixed taxonomy (below), one finding per defect,
each with turns, severity and a root-cause hypothesis that names the code path. Each agent read the code to check its
hypothesis and marked `verified` only when it reproduced the cause in code (for example, running the predicate on the
exact line). Child words stay in the container: this file holds codes, counts and causes only. The raw coding is in the
session scratchpad (`census/out-{1,2,3}.json`) and is not committed.

**Taxonomy.** F1 topic not followed · F2 repetition · F3 screen ≠ speech · F4 option ≠ action · F5 fragment / unheard
· F6 misheard · F7 false safeguard · F7b the safeguard hold outlasts its trigger · F8 abstract teaching (nothing a child
of that class can picture) · F9 visuals missing or repeated · F10 latency, timeout, fallback line · F11 confusion not
acted on · F12 relational (robotic, no warmth, apology without change) · F13 grading wrong · F14 other.
Severity: P0 breaks the session or the child's trust; P1 clearly bad teaching or experience; P2 minor.

**Totals.** 151 findings (27 P0, 78 P1, 46 P2); a root cause was verified in code for 73 of them (48%).

## Pareto (weight P0 = 3, P1 = 2, P2 = 1)

| rank | code | failure | findings | P0/P1/P2 | lessons (of 15) | cause verified | weight | cumulative |
|---|---|---|---|---|---|---|---|---|
| 1 | F1 | topic not followed | 14 | 1/13/0 | 7 | 12/14 | 29 | 10% |
| 2 | F3 | screen ≠ speech | 13 | 4/6/3 | 8 | 8/13 | 27 | 20% |
| 3 | F8 | abstract teaching | 14 | 1/9/4 | 9 | 3/14 | 25 | 29% |
| 4 | F14 | other | 16 | 1/7/8 | 9 | 5/16 | 25 | 37% |
| 5 | F2 | repetition | 13 | 3/5/5 | 9 | 8/13 | 24 | 46% |
| 6 | F12 | relational | 13 | 1/9/3 | 11 | 3/13 | 24 | 54% |
| 7 | F10 | latency / timeout / fallback line | 12 | 1/4/7 | 9 | 8/12 | 18 | 61% |
| 8 | F9 | visuals missing / repeated | 11 | 0/6/5 | 9 | 3/11 | 17 | 67% |
| 9 | F6 | misheard | 8 | 2/5/1 | 8 | 2/8 | 17 | 73% |
| 10 | F4 | option ≠ action | 9 | 2/3/4 | 6 | 6/9 | 16 | 78% |
| 11 | F5 | fragment / unheard | 8 | 2/4/2 | 5 | 1/8 | 16 | 84% |
| 12 | F11 | confusion not acted on | 5 | 3/2/0 | 5 | 4/5 | 13 | 89% |
| 13 | F7 | false safeguard | 4 | 4/0/0 | 4 | 4/4 | 12 | 93% |
| 14 | F13 | grading wrong | 8 | 0/4/4 | 7 | 3/8 | 12 | 97% |
| 15 | F7b | hold outlasts the trigger | 3 | 2/1/0 | 3 | 3/3 | 8 | 100% |

Read it two ways. By weight, the top six (topic, screen ≠ speech, abstract teaching, other, repetition, relational)
are 54% of the harm, and 11 of 15 lessons show the relational failure. By trust, the false safeguards rank 13th by
weight but every one is P0: F7 + F7b are 6 of the 27 P0s (22%), the largest single P0 group, and the owner's first
complaint.

## Causes confirmed in code (the ones this release acts on are marked ✔)

- ✔ **F7, one misheard word = a disclosure.** `server/safety/fuzzy.js`: the Devanagari word the recogniser also writes
  for "spoke" was a solo bully slot that needs no context, so an ASR garble beside a riddle's answer opened the full
  script and ended the lesson.
- ✔ **F7, a blocked rewrite = a disclosure.** `server/brain/say.js`: a content-filter block on a rewrite or repair
  call went straight to the safeguard, without the words-alone probe every other reply-side block runs; a probe that
  timed out also counted as harm.
- ✔ **F7, one model read = the full script.** `server/director/classify.js` `distressBeside`, OR-ed with the labels:
  a misheard line read as distress opened the disclosure opening and both helplines at once.
- ✔ **F7b, release.** `server/safety/fine.js` had no "no problem", "koi dikkat nahi", "you misheard", "I didn't say
  that"; a bare okay never released (correct after the full script, wrong after a gentle are-you-okay).
- ✔ **F12, scolding on a safeguard turn; F2, helplines twice in one turn.** `server/relational/openings.js`
  `withSafetyOpening` kept every word of the model body after the vetted opening.
- ✔ **F13 / F1 during an episode.** `server/director/state.js` `decide()` returned the safeguard before grading or
  requests, so a right answer earned nothing and "study something else" was ignored.
- **F1, topic.** `server/director/requests.js` switch / topic / visual patterns are Roman-only and miss Devanagari ASR;
  the card stays pinned (`askEnd` makes every turn end on the card question).
- **F2, repetition.** The repeat guard (`server/conversation/guards.js`) removes the pinned question before comparing
  and fires only at ≥ 0.8 overlap; paraphrased same-content hints measured 0.65 and 0.36. "Another way" on a reteach is
  an instruction with no predicate.
- **F3, screen ≠ speech.** Chips, board and practice stay on the kit while her words follow the child; `say.js` still
  carries the "the board draws for you" note.
- **F10.** The request reader (`understand.js`, 2.4 s) timed out 27 times and the reply model (6 s) about 43 times in
  lessons 11-15; 10 turns took ≥ 7.5 s (worst 16.5 s), 6 ended on a fixed fallback line.
- **F5 / F6.** Duplex fragments and phantom empty turns (`src/duplex/live.ts` guards only with the half-duplex flag);
  one dropped topic request during a barge-in merge; a fragment lost its negation (cause unverified).
- **F8.** The prompt carries the topic title only (`compile.js`), not the chapter's own list: two invented chapter
  facts. 10 of 15 lessons were the same topic.

## What would change this ranking

A second census after 14.4 ships, coded with the same taxonomy, by the same method, on 15 new lessons. If F7 / F7b P0s
are not at 0 there, the tiered safeguard did not work as measured offline.
