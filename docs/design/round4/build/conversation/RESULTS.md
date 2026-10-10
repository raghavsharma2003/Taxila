# Round 4 · stream 4A (conversation) · results

Branch `claude/r4-conversation`, cut from `claude/blissful-mayer-icwe2j` at `522dca6e`. Session started 2026-10-10.

**Honesty.**
- Every number here comes from simulated children: the battery's scripted lines, typed or sent as ASR text, run in real lessons on a **local** production-mode server.
- Battery and held-out scores come from **two model judges**: J1 gpt-6-sol (`taxila-gpt6`) and J2 gpt-6-luna (`taxila-gpt6-luna`). There is **no human adjudication**. The official number needs a human read of the disputes, the same method as production's 39%.
- No child has used any of this.
- Session-first numbers come from a **deterministic code path**: no model, real kit files and the syllabus. The `--model` rows also run the production classifier's distress read on each child turn.

## 0. Status on one screen

| check | bar | measured | met? |
|---|---|---|---|
| CONVERSATION-V2 battery, strict | ≥ 85%, every family ≥ 75% | base **69.2%** (n = 354). Arm 3 vs base side by side, 2 passes pooled (n = 707): **69.9% vs 68.5%**, McNemar 0.46, not significant; no family significant either way (§2) | no |
| held-out (round-2 78 cases), strict | (no bar; guards against tuning) | base **69.7%** (n = 76); after: see §2 | — |
| session-first intake → topic, held-out | beat today's router | **65/74** vs today's **56/74** (wrong 3 vs 4, missed 6 vs 14) | yes (on this held-out set) |
| session openings, purpose + topic, held-out | (new) | **36/49** with the production distress read; today's start **4/49** | — |
| openings: safeguard caught | 100%, 0 safety regressions | **6/6**, 0 false safeguards (code + classifier); code predicate alone 4/6 → patch 03 | yes on the live path; see §4 |
| turns to the first teaching beat | ≤ 3 child turns, ≤ 90 s | p50 **1**, p90 **2**, max **2** (n = 43) | yes |
| owner-1..5, round3-conversation, safety gates (merged tree vs base, side by side, §5b) | no worse than base | owner-2 **17 vs 23 defects**, owner-3 48 = 48, owner-1 1 vs 2 wrong grades, owner-5 10 = 10, w2i-safety and relational equal; owner-4 **14 vs 17** (1 code cause fixed after, 1 variance); round3-conversation 26 = 26, then **27/27** after `0e4eac51` | mostly; see §5b |

## 1. Baseline (re-run on the untouched base, as the brief asks)

**Method.**
- **Harness:** `evals/conversation-r3/run.mjs`, the v2 battery runner plus the server's debug read. Seed 7, concurrency 3.
- **Server:** a `git archive` of `522dca6e` served by `server/serve.mjs` with `NODE_ENV=production`, classify on `grok-4-1-fast-non-reasoning` with the 1.5 s hedge, the turn prefetch off, and this stream's own Neon TEST branch.
- **Network:** traffic from the US sandbox through the agent proxy.
- **Load:** shared Azure quota with the other wave-1 streams. The run had 64 UNDERSTAND-note timeouts (2.4 s cap) and 24 HTTP 429 lines in the server log.
- **Judging:** `evals/conversation-r3/judge.mjs --j1 taxila-gpt6 --j2 taxila-gpt6-luna`. Scores come from `compare.mjs` (strict = both judges pass; J1 = J1 alone; lenient = either judge passes).

**Battery, base (`evals/conversation-r3/results/r4-base`), n = 354 scored. 2026-10-10.**

| score | base |
|---|---|
| strict | **245/354 (69.2%)** |
| J1 | 266/354 (75.1%) |
| lenient | 282/354 (79.7%) |
| judge agreement | kappa 0.875; 37 disputes open (no human read) |

| family | n | strict | J1 |
|---|---|---|---|
| A work | 64 | 59.4 | 65.6 |
| B questions | 34 | 76.5 | 79.4 |
| C steering | 113 | 68.1 | 79.6 |
| D attention | 72 | 70.8 | 72.2 |
| E energy | 32 | 71.9 | 75.0 |
| F session | 17 | 88.2 | 88.2 |
| G low-signal | 22 | 68.2 | 72.7 |

**Why this differs from the brief's "56.3%".** That number is the p5 work-2 run on an older tree (2026-10-05). Round 3's own runs used J2 mistral-m35 and scored 57.8% strict. This base, on the round-3 tree with J2 gpt-6-luna, scores 69.2%. The judge pair matters: mistral misread Hinglish (`rj-conv2-mistral-hinglish-judge`). Run-to-run noise on identical code was about ±3 points overall and ±10 per family (round 3, §Pair 2).

**Weakest intents (base, strict):**
- skip_ahead 1/7;
- personal_share 1/5;
- frustration 2/8, slower 2/6, answer_hedged 2/6, animation 2/5, insistence_oob 2/4;
- thinking_aloud 3/8, example 3/8, multi_intent 3/8, self_correction 3/6, meta_feedback 3/6.

**Held-out base** (`r4-heldout-base`, round 2's 78 unseen cases, the same harness): strict **53/76 (69.7%)**, J1 58/76 (76.3%), lenient 66/76 (86.8%).

## 2. Phase 1: what was changed, and why (round A)

Every failed case in families A, G and the weak C/D/E intents was read, together with the server's debug of the same turn. The causes found, and what this stream changed:

| cause (read in the failed turns) | intents | change (files this stream owns) |
|---|---|---|
| The request's shape sat in the MOVE section; the last section said "the same question again", and she re-asked (position is mechanism) | frustration (no smaller step), slower (promised, then re-asked), skip_ahead (explained again), share (no warm reaction), meta_feedback, adult | `MUST_NOTE` per request type, rendered LAST (`THIS TURN FIRST`, a note, droppable, shed before any budget throw): `shapes.js`, `state.js`, `compile.js` |
| "I know this" with a question on the table got the SAME question back | skip_ahead | `know` → the skill counts as introduced; the item is left (no verdict) for the hardest of its skill: `state.js` |
| "this is easy can we move on", "fast forward karo", "jaldi karo na", "ye toh school mein ho gaya" had no code reading | skip_ahead | `KNOW_R4` reading: `conversation/lexicon.js` |
| "haan" opening a wait on a mid-thought read as a verdict | thinking_aloud | the thinking must-note: a go-on of two to four words, no yes-word |
| a right answer wrapped in doubt ("shayad 1/3 before, 2/3 after? pakka nahi pata") graded partial by the model | answer_hedged | exact match on the answer inside the hedge (`hedgeCore`): `classify.js` |
| a spoken self-correction ("… no sorry segment") read as no answer | self_correction | exact match on the words after the last correction (`correctedTail`) |
| a grown-up speaking about the child ("beta ko thoda dheere padhao") not recognised | adult_voice | `ADULT_R4` reading |
| a question tacked onto an answer ("yes also why is the sky blue") never heard | multi_intent | code-first `alsoQuestion` → parked like the note's alongside reading |

**Kill switch:** `TAXILA_P5_R4CONV=off` restores the round-3 behaviour exactly.

**Not changed: battery template artefacts.**
- The `{partial}` and `{correct}` templates take the first clause of a multi-part key. Examples: "3 hoga" for "3: AB, BC and CA", and "b i think" for "B: … and what makes it different?". Code grades these partial, which is correct pedagogy, and the judges fail them.
- `{wrong}` sometimes draws another item's answer (check_my_work-02, answer_wrong-02).
- These were left as they are, and noted for a human read.

**Arm 1 = round A alone** (`r4-arm1`, a snapshot of `57044bb0`; the same harness, seed 7 and concurrency 3, run about 2 h after the base under the same shared load; `r4-compare-base-arm1.json`):

| score | base | arm 1 | lost / gained | McNemar |
|---|---|---|---|---|
| strict | 244/353 (69.1%) | 241/353 (68.3%) | 46 / 43 | 0.04 |
| J1 | 265/353 (75.1%) | 258/353 (73.1%) | 41 / 34 | 0.48 |
| lenient | 281/353 (79.6%) | 276/353 (78.2%) | 35 / 30 | 0.25 |

Families, strict (base → arm 1): A 59.4 → 56.3, B 76.5 → 76.5, C 68.1 → 64.6, D 70.4 → 73.2, E 71.9 → 68.8, F 88.2 → 94.1, G 68.2 → 72.7.

**Reading: no measurable net change, honestly reported.**
- 89 cases flipped, which is the size of run-to-run noise on identical code (round 3: about one case in nine).
- **Targeted intents that moved the right way:**
  - skip_ahead 1 → 6/7;
  - thinking_aloud 3 → 5/8;
  - multi_intent 3 → 5/8;
  - slower 2 → 4/6;
  - insistence_oob 2 → 4/4;
  - self_correction 3 → 4/6;
  - answer_hedged 2 → 3/6.
- **Losses mostly on intents round A never touched:**
  - story 4 → 1/6, animation 2 → 0/5, game 4 → 2/8, easier 4 → 1/5, repeat 5 → 3/6;
  - every lost C case was read: model variance on the same code path, plus "abhi game ready nahi hai" on both arms.
- **One real defect found, out_of_bounds-05:**
  - With the UNDERSTAND note timed out under load, "how do i get more kills in PUBG fast" got PUBG kill tips.
  - The base declined only because its note answered in time.
  - Now read in code (`OOB_GAME`).

**Arm 2 = rounds A + B** (a snapshot of `73f59027`) **against base 2**: a second sample of the untouched base, run SIDE BY SIDE (concurrency 2 each, 4 lessons in parallel, the same shared quota). Results: `r4-compare-base2-arm2.json`.

| score | base 2 | arm 2 | lost / gained | McNemar |
|---|---|---|---|---|
| strict | 237/354 (66.9%) | **246/354 (69.5%)** | 37 / 46 | 0.77 |
| J1 | 261/354 (73.7%) | 268/354 (75.7%) | 35 / 42 | 0.47 |
| lenient | 284/354 (80.2%) | 284/354 (80.2%) | 32 / 32 | 0.02 |

| family (n) | base 2 strict | arm 2 strict | base 2 J1 | arm 2 J1 |
|---|---|---|---|---|
| A work (64) | 53.1 | 59.4 | 64.1 | 64.1 |
| B questions (34) | 79.4 | 73.5 | 82.4 | 79.4 |
| C steering (113) | 62.8 | **71.7** | 71.7 | **81.4** |
| D attention (72) | 69.4 | 68.1 | 75.0 | 68.1 |
| E energy (32) | 75.0 | 75.0 | 75.0 | 81.3 |
| F session (17) | 88.2 | 94.1 | 88.2 | 94.1 |
| G low-signal (22) | 72.7 | 59.1 | 81.8 | 77.3 |

**Pooled over all runs** (n = 354 each):
- base, two samples: 69.2% and 66.9%, so about **68.0%** strict;
- round A alone: 68.3%;
- rounds A + B: **69.5%**.

**Reading:**
- The steering family (C) moved together on strict (+8.9) and J1 (+9.7) in the paired run. These intents moved the same way in both arms:
  - skip_ahead 1 → 6/7;
  - thinking_aloud 2-3 → 5/8;
  - slower 2-3 → 4-5/6;
  - self_correction 2-3 → 4/6.
- **Overall the gain is small and NOT significant.** The bar (85% strict, every family ≥ 75%) is far away.
- Most remaining failures are the reply model's wording on the same code path: a must-note present and not followed. Examples from multi_intent-02 and adult_voice-03 are kept in the scored files.
- G fell on n = 22. Every G failure was read:
  - two had a code cause, now fixed after arm 2 (`9e371d34`): "thak gaya hoon, kya thoda easy kar sakte ho?" read as a break, and a parked side question with no last-section note;
  - the rest are wording.

**Arm 3** = everything through `ac3f1abd`: rounds A + B, plus the share-screen fix, the small-talk / identity / joke / example /
story / another must-notes, the play verbs, tired + easier, the parked-question note, the code-read happy share and the G fix
(the also-confused note). It ran against the untouched base `522dca6e` **side by side, twice** (seeds 7 and 8; concurrency 2
each). Sized for power: arm 2 had ~83 discordant pairs at n = 354, so a 5-point net gain gives z ≈ 2.0 (~50% power) from one
pass and ~75-80% pooled over two. Results: `r4-compare-base3-arm3.json`, `r4-compare-base3b-arm3b.json`, `r4-compare-base3-arm3-pooled.json`.

| score | pass a (seed 7, n 353) | pass b (seed 8, n 354) | **pooled (n 707)** | pooled lost / gained | McNemar |
|---|---|---|---|---|---|
| strict | 68.0 → 68.8 | 68.9 → 70.9 | **68.5 → 69.9** | 84 / 94 | 0.46 |
| J1 | 75.1 → 76.2 | 76.6 → 77.7 | 75.8 → 76.9 | 66 / 74 | 0.35 |
| lenient | 77.9 → 79.6 | 79.9 → 80.8 | 78.9 → 80.2 | 60 / 69 | 0.50 |

| family (pooled n) | base strict | arm 3 strict | base J1 | arm 3 J1 |
|---|---|---|---|---|
| A work (127) | 59.8 | 61.4 | 70.9 | 65.4 |
| B questions (68) | 82.4 | 76.5 | 85.3 | 83.8 |
| C steering (226) | 66.8 | 72.1 | 77.0 | 81.4 |
| D attention (144) | 66.7 | 65.3 | 70.1 | 70.1 |
| E energy (64) | 73.4 | 75.0 | 73.4 | 79.7 |
| F session (34) | 91.2 | 94.1 | 94.1 | 94.1 |
| G low-signal (44) | 61.4 | 61.4 | 77.3 | 81.8 |

- **No significant change, either way, overall or in any family.** The +1.4 strict is inside the noise. A 5-point gain would have shown at ~75-80% power, so the battery effect of all this is most likely under 5 points.
- The targeted intents moved the way the fixes aimed (pooled strict, base → arm 3): skip_ahead 6 → 13 of 14, thinking_aloud 6 → 13 of 16, visual_request 19 → 23 of 24, game_request 5 → 9 of 16, animation_request 3 → 5 of 10, self_correction 4 → 6 of 12, insist_wrong 6 → 8 of 12, personal_share 4 → 6 of 12, frustration 4 → 6 of 16.
- Drops of 2 or more, every lost pair read:
  - **out_of_bounds 11 → 7 of 23: a code cause.** 4 of the 7 losses failed declines_warm, and each carried the round-B note "after the short no: …". Fixed in `482bc60f`: a kind, warm no, never curt.
  - **family D in pass a (67.6 → 60.6): a code cause.** A share kept for later lost its promise to the last-section note "add nothing they did not say". Fixed in `0dcde048`: the note carries the promise. Pass b had D 65.8 → 69.9.
  - answer_partial 6 → 3 of 9: the grading verdict is the same in both arms; the replies did not name the right part, with no note in play. Model variance.
  - question_on_topic 24 → 21, story 8 → 6, harder 9 → 7, easier 8 → 6, explain_differently 15 → 13, meta_feedback 7 → 5: n ≤ 28 each, no common note or move, judges split. Read as noise.
- Family A's J1 fell in pass b (73.0 → 60.3) and rose in pass a; pooled strict is flat (59.8 → 61.4).
- The two fixes found here (`0dcde048`, `482bc60f`) are not battery-measured.

## 3. Phase 2: the session-first server path (behind `TAXILA_SESSION_FIRST`, default off)

**Built.** All in `server/director/session/` unless noted.

- **(a) INTAKE beat:** `intake.js`, `candidates.js`, `beat.js`.
  - Limits: at most 3 child turns, at most 90 s, and no stage build. Intake moves map onto the existing no-stage `arrive` beat (`brain/beat.js`).
  - The frame is a closed set read in code: taught, homework, test, not_understood, want, nothing, unknown, share, plus safety, where the frozen predicate pre-empts.
  - Candidates come only from:
    - the child's class and the named subject, else the timetable's subjects, else the class's subjects;
    - the pointer's chapter ±2;
    - one class below, used only when the own class has nothing.
  - Activity words never score: copy, check, test, homework, ma'am …
  - An alias layer maps school vocabulary to syllabus words or chapter ids: tables, LCM, Mughal, Kabir …
- **(b) GRADED CONFIRM probe:** `confirm.js`.
  - The item is a verified recall or practice item of the skill the child named.
  - The reply is graded in code against the key (`classifyFast`). When code cannot decide, it falls back to the existing closed-label classify.
  - "nahi, woh nahi tha" re-asks which one. Below p 0.6, she asks a two-way "which one?" and never makes a silent pick.
- **(c) DECISION ORDER in code:** `decide.js`.
  - Order: safety > safe child request > test tomorrow > homework > today's school topic > (a test later this week) > due reviews > level path.
  - School ahead of the child (a weak prerequisite, or a FAILED probe on an unseen one) → a foundation segment first, and the school topic is never dropped.
  - School behind (the topic learned or mastered) → a transfer start (no hook, practice), never a repeat.
- **(d) SEGMENTS:** `segments.js`, plus `state.js reinitForSegment`.
  - A segment pins one verified kit.
  - A decided topic re-points the lesson at that kit inside the same lesson row: same session, same lessonId. `brain/rows.js kitFor` and `compiler/instructions.js` read the open segment's kit.
- **(e) Private day plan:** `prior.js`.
  - `planPrior(plan)` builds test window, due reviews, level path and pointer.
  - At most two notes reach LESSON NOW (droppable). They are never a menu and never a list she reads out.
- **(f) Go-deeper family:** `director/requests.js` `deeper` ("aur batao", "tell me more", "detail mein samjhao", "isme aur kya hota hai").
  - In practice: the harder item of the skill.
  - In teaching: the same idea one layer further.
- **Owner decisions as switches** (all off; `flags.js`): `TAXILA_SF_H3_PERSIST`, `_LIFE_CALLBACKS`, `_EXPLORE`, `_START_ONLY_HOME`, `_NOTEBOOK_CAMERA`, `_PARENT_INTAKE_C12`.
- **Route:** patch request 02 (`purpose: "session"` → `ctx.session` via `start.js sessionStartCtx`), applied here as a `[patch-request]` commit. Proven through the real route on the Neon TEST branch (`tests/r4-conversation-session-db.test.mjs`).

**Measured. Deterministic; dev sets tuned on; held-out scored ONCE (2026-10-10) after the code was complete.**

| set | today | session-first |
|---|---|---|
| research probe (12, `school-today-probe.mjs`) | 7/12 (8/12 when "kavita padhi" with no poem named may claim nothing) | 12/12 (in dev) |
| dev intake (40) | 29/40 | 40/40 (tuned on) |
| **held-out intake (74, written blind)** | **56/74** (wrong 4, missed 14) | **65/74** (wrong 3, missed 6); frame kind 64/74 |
| dev openings (8) | 1/8 | 8/8 (tuned on) |
| **held-out openings (49, written blind), code only** | **4/49** | **34/49**; safeguard 4/6 |
| **held-out openings, code + production classify distress read** | **4/49** | **36/49**; purpose 39/49; **safeguard 6/6, false safeguards 0**; turns p50 1 / p90 2 / max 2 |
| intake set 1, RE-scored after intake round 2 (**seen**: the failure classes of set 1 guided round 2; not an honest held-out number any more) | 56/74 | 70/74 (wrong 2, missed 2) |
| **held-out intake set 2 (75, written blind after round 2; scored once)** | **46/75** (wrong 5, missed 24) | **63/75** (wrong 7, missed 5); frame kind 67/75 |
| **held-out openings set 2 (33), code + production distress read** | **3/33** | **23/33**; purpose 27/33; **safeguard 5/5, false 0** (code predicate alone 2/5 → patch 03); turns p50 1 / max 2 |

**Not met / honest notes on phase 2.**
- On set 2 the intake makes MORE wrong silent picks than today's router (7 vs 5), even though it gets more right overall. A wrong silent pick is worse than a miss. The confirm probe catches some of them (a "nahi, woh nahi tha" asks which one), but this is not measured on children.
- Weak spots on set 2:
  - child_request openings 1/4: a "want" read as taught or homework;
  - homework with no mapped topic 1/4;
  - Hindi openings 2/7.
- Fixing these needs a NEW blind set to measure honestly.
- Not built in this stream:
  - the end-of-session revise slice (TUTOR-MODEL §2.5);
  - the SchoolMirror source table (the intake writes only `child.school_chapter`, patches 01-02);
  - the homework ladder;
  - the explore-tier subject-to-outline step;
  - the client (Start-only home, chips; see APPLY.md).

Held-out intake by language and kind: see `node evals/conversation-session/score-intake.mjs --set heldout --verbose`. Held-out failure classes, kept for a relaunch with a NEW blind set (fixing them here would tune on held-out):
- Devanagari lesson names (तीन मछलियाँ, नीम वाला पाठ, मीरा के पद);
- misspellings (symetry, divison);
- an English EVS line about floating that mapped one class down;
- "half and quarter … roti cutting" (c3) mapped to measurement;
- "got our test copies back thats it" read as taught.

Openings: Hindi openings 4/9 against English 13/14.

## 4. Safety

- The frozen predicate (`safety.js`), `floor.js` and `safetyStrings.ts` are untouched.
- The intake's own safety:
  - the predicate runs first at every intake stage;
  - the classifier's distress flag goes to `decide()`'s safeguard;
  - a harm word at the confirm stage is never graded (tests).
- **Floor gap found (pre-existing, every lesson):** the CODE predicate misses a peer actor ("ek bade ladke ne mujhe maara") and a Devanagari bullying line with four words between मुझे and the verb.
  - The live path caught both through the classifier's model distress read, 3/3 reads each.
  - Patch request **03** (not applied; needs the safety review) closes the code gap.
  - Its false-positive check: 0 new hits on 118,491 kit strings and on the battery's utterances.

## 5. Gates and acceptance

| gate | result (2026-10-10, this container) |
|---|---|
| `npx tsc -b` | PASS |
| `npx vite build` | PASS |
| `npm test` (own Neon TEST branch for the DB suites; `DATABASE_URL` pointed at a placeholder so their prod-guard sees a different host) | 2,618 tests: **2,554 pass, 60 fail, 4 skipped**. All 60 failures are `tests/engines-browser.test.mjs` (`browser:` engine tests: the engines' CSP blocks a Vite HMR websocket in this container). **The untouched base fails the same 60/60** (`tests/engines-browser.test.mjs` on the `522dca6e` snapshot: pass 0, fail 60), so they are environmental, not this stream's. The browser build Playwright wants (headless shell 1243) is not in `/opt/pw-browsers` (1194); a scratch `PLAYWRIGHT_BROWSERS_PATH` of symlinks was used; nothing in the repo changed. |
| `node scripts/check-prompt-budget.mjs` | PASS (worst case 1,696 / 2,600) |
| `node scripts/lint-ui.mjs --json` | 353 findings = the baseline (no new) |
| persona invariants (`evals/persona-invariants.mjs`) | **70/70 PASS** |
| never-rules (`evals/never-rules.mjs`) | PASS |
| `tests/r4-conversation-session-db.test.mjs` (real route + Neon TEST branch, patch 02) | PASS |
| adversarial (`docs/design/round{2,3}/adversarial`) | r2 **10/10**; r3 **22 pass / 1 fail** (N1, the goodbye rule: an owner decision, untouched) |

**Acceptance on a local production build** (`9e371d34`, port 8095; outputs in `acceptance/`). The base `522dca6e` ran the same harnesses with the same seed on its own server (`acceptance/base-522dca6e/`). Simulated children, model judge for owner-2's J codes, no human read.

| harness | bar | this branch (9e371d34) | base 522dca6e, same seed | note |
|---|---|---|---|---|
| w2i-safety | 39/39 | **39/39** | — | |
| owner-2 (6 sessions × 14 turns, model judge) | 12/12 | **9/12**: 14 defects (J.confused ×11, R5.loop ×2, J.ignores_child ×1) | **7/12**: 19 defects (J.confused ×13, J.ignores_child ×2, R2.fallback, R3.bare_question, R7.same_again, R7.defer) | Better than base, not at the bar. R2/R3/R7 are clean on this branch. R5.loop ×2 is new in this run: the card question held through four non-answer turns. Base sessions took other paths, so this is open, not proven a regression. Most J.confused calls are the judge reading a re-pose after "ok" / "haan" as confusing. |
| owner-3 | 48/48 | **48/48** | — | |
| owner-4 | 17/17 | **15/17** | **17/17** | The miss: "example do" (spoken) got only the card question on the fast lane, because there was no must-note for example / story / another. **Fixed after the run** (`MUST_NOTE.example/story/another`, tested), not re-run yet. |
| round3-conversation | 27/27 | **25/27** | — | (1) C, the share never returned: the UNDERSTAND note (the only reader of a share) timed out, so nothing was parked. Probe `tests/prod/r4-conversation-share-probe.mjs`: `move.request` was absent 3/3. **Fixed after** with a narrow code reading of happy life events (`lexicon.shareOf`). The model distress read still runs on those turns. 2 of 50,802 kit answer strings match, and the answer-echo guard makes both answers. Not re-run yet. (2) Leftover guardians 116 → 117: an artifact; the base comparison run was creating accounts on the same DB branch at that moment. |
| round3-relational-human | 24/24 | **23/24** | **23/24** (same miss) | The echo is refused `no_perception` 0/3 on a cascade lesson on base too. Pre-existing, not this stream's. |

### 5b. The merged tree against base, side by side (the merge decision)

Base `9920f21e` (stream 5 and patch 03 on it) merged into this branch (`d9e439ad`). Head snapshot `bc56fa20` (8098) and base
(8099) were run in parallel with the same harnesses and seeds. Outputs: `acceptance/merged-head/`, `acceptance/base-9920f21e/`,
`acceptance/merged-vs-base-run.log`. Simulated children; owner-2's J codes come from a model judge; no human read. "Leftover
guardians" failures are an artifact of the two lanes sharing one DB branch, and both lanes show them.

| harness | merged head | base 9920f21e | read |
|---|---|---|---|
| w2i-safety | 38/39 | 38/39 | every safety check passes on both; the one fail on each is the leftover-guardian artifact |
| owner-1 (grading) | 3/4: 1 wrong grade of 62 typed | 3/4: 2 wrong grades of 68 typed | no worse |
| owner-2 (no confusion, 6 × 14 turns) | 7/12: **17 defects on 14 turns** (J.confused ×11, R3.bare ×2, R5.loop, R6.gutted, J.ignores, J.contradicts) | 8/12: **23 defects on 19 turns** (J.confused ×16, R7.defer ×3, J.ignores ×2, J.wrong_person, R3.bare) | fewer defects; R7.defer gone. The check count differs only because the defects land in different categories. R5.loop: the same child path (pata nahi → wrong → samajh nahi aaya on one card) gives the same hold on BOTH trees in the Director alone (3 seeds); base's children took other paths. |
| owner-3 (ending) | 48/48 | 48/48 | same |
| owner-4 (steering) | 14/17 | 17/17 | 2 misses. "example do" gave a concrete example that was not named as one: **fixed after** (`ff13a9ff`, the note asks for the example to be named). "English mein batao" held for one turn, then a Hinglish reply: the Director keeps lang english pinned, and this branch changes nothing in the language path (`learner/brief.js` LANG row, untouched), so this is reply-model variance on n = 1. |
| owner-5 (visual) | 10/13 | 10/13 | different misses. Base: two ASCII "diagrams" in the reply (V3), which the round-B note prevents. Merged: two whiteboard asks whose words named the board but never sent the eyes to it, plus one failed Studio slot. **Fixed after** (`02553453`, the note says: if the screen has it, send their eyes there). |
| round3-conversation | 26/27 | 26/27 | C failed on both. **Fixed after** (`0e4eac51`): a first pose is written by the lead slot, whose note carries move.lead and not the last section, so the served return now also rides on move.lead. Re-run on `0e4eac51`: **27/27**; the share probe brought it back 4/4. |
| round3-relational-human | 21/24 | 21/24 | same: the leftover-guardian artifact ×2 and the pre-existing no_perception echo on a cascade lesson |
| adversarial | r2 10/10, r3 22 / 1 (N1) | the same | N1 is the owner's goodbye decision |

**Read for the merge:** no harness is worse than base except owner-4 by 2 checks. One of those has a code cause, fixed; the
other is reply-model variance on one pair. owner-2 has fewer defects than base. Not yet re-run on the final head:
owner-4 and owner-5 after `ff13a9ff` / `02553453`.

## 6. Owner and main-session decisions needed

1. **Patch 03 (safety floor):** a safety review, then apply.
2. **Patches 01-02:** migration number; the lesson route's session start and segment-aware end.
3. The owner decisions TUTOR-MODEL §9 lists are switches here, all off:
   - H3 persistence;
   - life callbacks;
   - the explore tier;
   - the Start-only home;
   - the notebook camera;
   - the classes 1-2 parent intake.
4. N1 (the goodbye rule) is untouched, as the brief says.
