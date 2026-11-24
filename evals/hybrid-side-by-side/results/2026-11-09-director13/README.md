# director13: script walk v6.4 on integration 16 (2026-11-09)

**Run by main** (Brain's container lost its .env.local overnight).

## Run details

- **Tree:** int/r6 **0dd31feb1** (integration 16), which contains:
  - Brain v6.4 (716635a9: P2, K1, Q1, H2″, T1″, L1, R3, harness);
  - Studio S4–S6 (04cf99ac) with patch 015;
  - Learning D6–D7 (e3ba1d7fc);
  - Games naap.

  Its runtime is identical to Brain's 82244526, which only drops a test exemption.
- **Command:**

  ```
  CI=1 DATABASE_URL= TEST_DATABASE_URL= TAXILA_R7_SCRIPT=on node --env-file=<main's env> evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1500 --usd 1.00 --out evals/hybrid-side-by-side/results/2026-11-09-director13
  ```
- **The run happened in two parts:**
  - Part 1 stopped at the USD cap after 15 of 16 lessons (1,470 calls, ~$1.001; `meter-part1.json`).
  - Part 2 ran only `steering-c6-ch06-t01`, using `--skip` for the other three c6 lessons, `--cap 160 --usd 0.12` (72 calls, ~$0.046; `meter-part2.json`).
- **Total:** 1,542 calls, ~$1.047, which is $0.047 over the nominal $1.00 cap. That spend was a deliberate choice, so the judges see all 16 lessons.
- **Dry count:** 998 calls. director12 was 974 dry and 1,380 live.
- **Reply ready, p50 per lesson (ms, sorted):** 2433 2674 2728 2734 2814 2863 2938 3023 3091 3120 3145 3165 3171 3197 3405 3886. The median of the per-lesson p50s is ~3.06 s (director12 run p50: 2.64 s).
- **scripts/:** the four v2.3 scripts as walked, copied from data/lesson-scripts at 0dd31feb1.

## Code proxies (Brain, offline)

Every count below is a **code proxy**, not a judgement: main's judges count by hand, on 0-based rows. Both runs are counted by the same
script, `evals/hybrid-side-by-side/proxies-v64.mjs`, so the two columns are directly comparable:

```
node evals/hybrid-side-by-side/proxies-v64.mjs evals/hybrid-side-by-side/results/2026-11-08-director12 evals/hybrid-side-by-side/results/2026-11-09-director13
```

The script was cross-checked against earlier counts:
- On director12 it reproduces that README's numbers: contradictions 20, unpaged 4, picture 8, nothingNew 2, two-close turns 9.
- It also reproduces v6.4's replay predicates: 29 unanswered cards, 2 carried closes after a probe reply.

### Gate counts (corrected verdictSeg checker, primary)

| | director13 | director12 |
|---|---|---|
| Teacher turns | 544 | 544 |
| Verdicts given / graded answers | **212 / 213** (one miss, below) | 205 / 205 |
| Right called wrong / wrong called right | **0 / 0** | 0 / 0 |
| False keys | **0** | 0 |
| **Contradictions, all kinds** | **17** | 20 |
| … c4 / c5-t01 / c5-t02 / c6 | 6 / 3 / 5 / 3 | 2 / 4 / 10 / 4 |
| … `gate.v6` verdictSeg | 0 | 0 |
| … `gate.v6` unpaged | **0** | 4 |
| … `gate.v6` nothingNew | **0** | 2 |
| … `gate.v6` picture line naming an undrawn thing (per page) | 7 | 8 |
| … `gate.v6` borrowed why | 0 | 0 |
| **`gate.v6` droppedPages** (new; reported, not counted as a contradiction) | **3 pages on 3 turns** | – (no field) |
| Turns over 60 words | 73 | 78 |
| Longest turn | 98 words | 93 |
| Lessons whose walk reaches a second skill (cards from 2+ skills) | 11 of 16 | 9 of 16 |

**Notes on this table:**
- **The missed verdict (stuck c4, row 22):** the child answered "3/1", and her line opened "Pichhle sawaal ka jawab 3/4 tha, kyunki …". That is a give-up with no verdict sentence before it.
- **droppedPages:** the 3 turns are offtopic c4 56 and steady c4 56 and 60. All three are a close and the next card in one turn, two fraction-parts or wholes pages; pagesBoard dropped the later page, so its words were said over the page before.

### v6.4 proxies (text patterns over her lines)

| | director13 | director12 | What it matches |
|---|---|---|---|
| **P2** orphan parts | **0** | 5 | A sentence that is a bare name or starts with ke/ki/ka/se/mein/ko/ne, or the "tulna karo kar" join |
| **K1** unanswered cards | **1** | 29 | A scripted card posed that never gets a right verdict, or a give-up or reveal stating its answer, before the walk leaves it (the card live at the end is not counted) |
| **Q1** "Yaad karo" on a live card | **0** | 10 | "Yaad karo" on a turn that carries a card |
| **T1″** two-close turns | **0** | 9 | A verdict with "kyunki", then "Toh poora jawab", or a carried "Aur pehle wale sawaal ka jawab" |
| **T1″** carried "Pichhle sawaal" after a probe reply | **0** | 2 | "Pichhle sawaal ka jawab" on a turn that answered no card, right after her "Haan, sahi …" |
| … all "Pichhle sawaal ka jawab" lines | 11 | 7 | Give-ups on the card just missed, said as "the last question" because the next card follows |
| **H2″** aside returns (first aside per lesson) | **9** | 10 | Her sentence naming the aside after its park line |
| … on time (after the promised card) | **9 / 9** | 10 / 10 | |
| … reuse a word of theirs | **9 / 9** | 10 / 10 | |
| … the old template ("Aur X ki baat:", "sunke bahut achha laga", "tumne mujhse … poocha tha") | **0 / 9** | 10 / 10 | |
| **H2″** canned aside facts | **4** | 0 | "ek over mein chhe ball", "Virat Kohli India ke liye …", "… cover drive … kaafi mashhoor hai" |
| **H2″** talk about an aside outside its park, return or same-turn reaction | 10 (listed below) | 12 (all the old template) | Approximate; it also catches returns to a second aside |
| **L1** Hindi requests: the next turn says the switch | **16 / 16** | 7 / 16 | First sentence names Hindi and is not a bare "Zaroor." |
| **L1** her next turns with English teaching words (key words excepted) | **0** | 4 | fraction, part, side, perimeter, total, mark, line, equal, answer, step |
| **R3** a card re-posed word for word, bare | **0** | 17 | Her turn equals the card, and her previous turn already said it |
| **R3** a turn the same as her previous one (over 40 characters) | 1 | 9 | |
| **R3** "ab samajh aaya tumne kaise socha" | **0** | 6 | |
| "Ab agla kadam dekhte hain" | 18 | 11 | |
| Register join "tulna karo kiya / kar" | 1 (steady c5-t02 56) | 0 | |

### What the proxies point at

**All 9 aside returns in director13**
- offtopic c4 30 · offtopic c4 46 · offtopic c5-t02 44 · steady c5-t01 44 · steering c4 26 · steering c5-t01 26 · steering c5-t02 30 · stuck c4 56 · stuck c5-t02 40.
- Every one is one line, at a boundary, with a word of theirs.
- Seven of the nine are her own preference: "Mujhe bhi cricket pasand hai …" ×4, "Haan, mujhe Virat pasand hai — woh bahut mehnati cricketer hain" ×3. The judges may want to rule on whether she should claim personal likes.

**The 4 canned facts and the aside talk**
- The canned facts are said on a card, outside a return:
  - "Virat ke cover drive kaafi mashhoor hai" (steady c5-t02 50, on the verdict turn);
  - "Virat ke cricket shots aur cover drive kaafi mashhoor hain" (steady c5-t02 46);
  - "Virat ke cover drives aur timing …" (offtopic c6 8);
  - "Virat ke cover drive ki timing …" (stuck c6 38).
- These come from her draft, not the old code line. My guess is that the aside was not open on the Later list on those turns, so H2′'s "open aside" filter did not drop them. That is not yet checked against the replay.
- The aside-talk list also holds:
  - "Sixer maara — wah …" reactions on the turn after (offtopic c4 10, offtopic c5-t01 16, offtopic c5-t02 16 and 30, offtopic c6 40, steady c4 38);
  - "Haan, mujhe Virat pasand hai" answers to a second aside (offtopic c6 12, stuck c6 42);
  - "Sixer ke baad dobara check karna …" (steering c6 28).

**Unanswered card (1)**
- offtopic c5-t02 e2 (posed at row 58): the then-card was answered right at 64, then the child left ("ab main jaati hoon, bye"). The K1 re-pose never came because the lesson stopped.

**"Ab agla kadam" 11 → 18**
- More worked steps reached: lessons reaching a second skill went 9 → 11 on this proxy.

**c4's contradictions 2 → 6**
- They fall on 4 turns: steady 14, steering 14 and 16, stuck 18.
- 2 of those turns are picture lines (steering 14, stuck 18), where c4 now gets Studio's new round/example second views.
- The 3 dropped pages are c4 as well.
- Per-turn contradiction rows for the other topics:
  - c5-t01: offtopic 26 (picture), steady 18, stuck 18;
  - c5-t02: offtopic 32, steady 22, steering 14 (picture), steering 32, stuck 42;
  - c6: offtopic 26, steady 18, stuck 18, all three picture lines.

## Gates on Brain's 82244526 (same runtime as 0dd31feb1)

- tsc and vite: clean.
- test:all: 5909 / 5923 pass, **0 failures**, 13 skipped. Integration 16 skips the DB and browser suites when no TEST_DATABASE_URL is set.
- Single-process `DATABASE_URL= npm test`: 5909 / 5923 pass, 0 failures. The only open item is the RCA-4b TODO.
- The test-branch migration (041, 044–047) has not been applied. Brain's container has no secrets.

The hand judgement is in docs/design/round7/judgements/.
