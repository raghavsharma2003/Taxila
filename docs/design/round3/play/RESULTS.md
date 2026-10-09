# Play · RESULTS (round 3, stream play, 2026-10-09)

Everything here was measured in this sandbox on 2026-10-09 unless a line says otherwise. **Nothing here has met a child.**
Every browser number is headless Chromium on a shared 4-core host (load average 15-40 from other agents during the
runs), on the play dev harness built from the working tree, not on a phone. Every "simulated" number is synthetic
learners. Model-judge numbers are advisory (`rj-holistic-model-judge-gate`). The design is `DESIGN.md`; the contract is
`GRAMMAR.md` + `shared/play.ts`; the hot-file patches are `APPLY.md`.

## 1. What exists

| piece | where | state |
|---|---|---|
| grammar `play@1` (levels, acts, grades, moments, seams, art, world, tokens) | `shared/play.ts`, `GRAMMAR.md` | built |
| 4 families, 16 game modes: Todo-Jodo (atoms: primes / factor trees / HCF-LCM; strips: equal parts, compare, add; bundles: regroup-subtract), Taraazu (balance: solve, equality), Nishana (place, compare, round), Kyun-Lab (predict, fair test, Golu's unfair test) | `src/play/families/**` | built; pure law + solver + shortcut search + mal-rules + view per mode |
| 12 Kyun-Lab labs with causal models and drawn apparatus (ankur, sukhao, jhoola, jang, parchhai, rang, tairna, barf, chumbak, bijli, phaphoond, patta) | `kyun-lab/labs.ts`, `scenes.ts` | built |
| 4 art directions (kagaz, chalk, blueprint, raat) through one Painter; no colour literal in any family (lint) | `src/play/core/styles.ts`, `tests/play-style-lint.test.mjs` | built |
| stage runtime: canvas at the real box, floor audit every frame (text, targets, clipped labels), adaptive DPR, partial repaint | `src/play/core/stage.ts` | built |
| server: admit by skill, code-built proven levels, replay grading, claims stripped, HMAC sessions, reaction bank with guards, world | `server/play/**`, `data/play/**` | built; mounted only by patch 01 |
| signed evidence + seam tokens → lesson turn → ledger (`via: "game"`, never the check) | `server/play/evidence.js`, patches 02 + 03 | built; patches unapplied |
| embedded play mode in the Desk, module-event bridge | `src/play/PlayStudioRenderer.tsx`, `lessonBridge.ts`, patch 04 | built; patch unapplied; depends on forge's renderer glob |
| voice as a verb (closed grammar), utterance dispatch | `src/play/core/voice.ts`, patch 05 | built; patch unapplied |
| world map (pencil / ink stations, cited routes; phone layout) | `server/play/world.js`, `src/play/world/PlayMap.tsx` | built |
| micro-reaction TTS pre-synthesis | — | NOT built (captions only; the seam turn speaks) |
| coverage: 47 / 250 class 4-7 topics (maths 32/141, science 13/69, EVS 2/40), 57 entries, 146 skills, 71 kit misconceptions mapped | `data/play/coverage.json` | 36 topics earlier the same day |

## 2. Engineering bars (DESIGN.md §11)

| bar | target | measured | n / method / where | verdict |
|---|---|---|---|---|
| P-O1 solver correctness | 100% | every generated level of every mode is solved by its own solver and grades solved + clean; an independent per-family verifier agrees whenever the law says "goal met" | `tests/play-logic.test.mjs` (pure, local) | met (independent verifier, not brute-force enumeration) |
| P-O2 generator latency | p95 ≤ 50 ms | picker CPU p95 22.4 ms; wall p95 59.4 ms | n = 171 picks (every coverage entry × every fade), one process, `tests/play-server.test.mjs`, host load ≈ 30 on 4 cores | met on CPU time; the wall number measures the neighbours (`rj-r3p-picker-wall-clock-gate`) |
| P-O3 shortcut-free served levels | 100% | 100% (the server serves only levels `proveLevel` accepts) | same test, all entries | met |
| P-O4 grading truth | 0 wrong grades, ≥ 2000 random acts per family, 0 forged claims | 0 wrong; ≥ 2000 acts per MODE; claims stripped and tampered/mismatched acts refused | `tests/play-logic.test.mjs`, `tests/play-server.test.mjs`; `tests/prod/round3-play.mjs` P3/P4 on the local server | met |
| P-O5 fit | 0 overflow, text ≥ 14 px, targets ≥ 44 px, 3 viewports × every mode × art | **192 / 192** pass: smallest canvas text 14 px (16 for class 4-5 modes), smallest target 44 px, smallest button 44 px, 0 labels clipped, 0 buttons clipped, 0 text out of box, 0 horizontal overflow, 0 page errors; the 16 mistake-state screens 16 / 16 | `harness/shots.mjs --shots --all-arts`, dev harness, headless Chromium, DPR 1; files `shots/all/*.jpg`, `shots/all/report-all.json` | met on the dev harness (final run 14:02 UTC on the final build); not measured inside the lesson Desk or on a phone |
| P-O6 frame rate | ≥ 50 fps median, 4× CPU throttle, 412 × 915 | 6 / 16 modes ≥ 50 (strips-compare 56.3, strips-add 56.0, equality 53.1, lab-golu 52.3, lab-magnet 51.8, line-round 51.5); the rest 40.1-49.0 (lab-predict 40.1, lab-mould 40.7, line-place 42.8, line-compare 43.4, lab-ice 45.2, lab-leaf 45.5, atoms-hcf 46.9, bundles 47.4, balance 48.3, atoms 49.0) | median of 3 runs × 6 s of scripted drag/run per mode, DPR 2, headless SOFTWARE raster, host load 17-28 on 4 cores; `shots/report-fps.json`, `report-fps-line.json` | **short on 10 / 16** under this proxy; no real phone measured |
| P-O7 reaction guards | 0 verdict words, 0 unrevealed keys, 0 floor violations | 0 / 0 / 0 over the whole bank × every moment × sample facts | `tests/play-react.test.mjs`; P6 on the local server | met |
| P-O8 world | absence invariance at +365 days; every route cites an edge | byte-identical; 100% cited (18 / 1 / 6 / 1 routes for the 4 families on the test account) | `tests/play-server.test.mjs`; P7 on the local server | met |
| P-O9 diagnosis (SIMULATED) | picker ≤ 0.50 × random's levels | 0.60 mean over 17 topics (EIG optimum also 0.60); 0.50 over the 13 topics where random needs ≥ 2 levels; correct classification 1905 / 2040 vs 1749 / 2040 random | synthetic learners (one mal-rule or none, ε 0.1), n = 120 per topic per policy, stop at posterior 0.9, max 12 levels; `harness/diagnose-sim.mjs`, `results/diagnose-sim-2026-10-09.json` | **short** (0.60 > 0.50); 4 topics at ceiling, c5 strips/equal cannot separate its two mal-rules (6.6 levels, 60 / 120 for every policy), 5 topics skipped (< 2 discriminable) |
| P-J judges | reported as measured | §5 | §5 | advisory |

## 3. The in-lesson loop (end to end, local)

`tests/prod/round3-play.mjs` against a local production server (`node server/serve.mjs`, NODE_ENV=production) on a copy of
the working tree with patches 01-05 applied, Neon TEST branch: **93 / 93** on the final code (14:21 UTC); six runs today
(`results/prod-local-2026-10-09.json` history): four 93 / 93, one 92 / 93 (the global count of test accounts on the shared
TEST branch rose while other streams ran theirs; this run deleted its own) and one 88 / 89 (P8 `fetch failed` while a
screenshot run loaded the host: lesson start took 9.2 s). The P8 block
starts a lesson, starts play inside it, solves a level through the server grade, receives the signed evidence and the
level-end seam, posts them as module events on `POST /api/lesson/turn`, and reads the database:

- the teacher took a full turn at the level end (move `celebrate`) grounded in the verified PLAY row, one reply per passing
  run, e.g. "Riya, aapne composite number ko prime factors mein todkar 2·2·5·13 tak pahunchaya; ab isi method ka naam
  bataiye." (2.6 s) · "Riya, aapne 250 ko prime factors mein toda: 2 × 5 × 5 × 5. Ab isi method se 150 ko todkar
  likhiye." (2.2 s) · "Riya, aapne composite number ko prime factors mein todkar 2·2·5·13 likha; ab isi method ka ek
  chhota check kijiye: 260 ko dobara multiply karke dikhaiye." (1.9 s, final code);
- exactly one `kt_evidence` row `via: "game"` for the level; the same level again and a forged token folded nothing;
- latency (local server, this sandbox, host shared): play start p90 196-528 ms (n 8 per run), act p90 118-199 ms (n 38-41
  per run); final run 231 / 124 ms.

**taxila.dev today: 0 / 1** (P0: `/api/play/*` is 404 because patch 01 is not applied), re-checked 2026-10-09 12:46 UTC. The
India-side latency and the deployed loop are unmeasured.

## 4. Before / after on the same harness

`harness/shots.mjs --before-after` (2026-10-09 12:47 UTC, on the build of that hour; `shots/report-before-after.json`, shots `shots/before-*.png`):
the shipped studio-v2 engine (a local production build of HEAD's `src/studio-v2/gallery`) against the play family on the
same idea, all on a 360 × 800 page, DPR 2. "Tray" is the box production gave the engine (181 × 113 CSS px, measured by
live-tech §1.1); "full box" is the same engine given the play world's own 360 × 576 box (it keeps its fixed 16:10 stage,
so it draws 360 × 225 of it). Text sizes are every `fillText` on screen, in CSS px. fps: one 6 s scripted drag per cell,
4× CPU throttle, host load 25-40: indicative only.

| idea | before · tray: box, text min / median, fps | before · full box: text min / median, fps | after · play: box, text min / median, smallest target, fps |
|---|---|---|---|
| fractions (slice-at → strips compare) | 181 × 113 · 2.7 / 8.7 px · 59 | 5.4 / 17.3 px · 58 | 360 × 564 · 16 / 16 px · 84 px · 60 |
| place value (vault-heist → bundles) | 181 × 113 · 6.9 / 7.2 px · 56 | 13.7 / 14.4 px · 36 | 360 × 508 · 16 / 19.7 px · 81 px · 60 |
| balance (balance-beam → balance) | 181 × 113 · 6.9 / 6.9 px · 37 | 13.7 / 13.7 px · 53 | 360 × 447 · 18.5 / 20 px · 44 px · 54 |
| number line (catch-on-line → line place) | 181 × 113 · 6.9 / 8.0 px · 46 | 13.7 / 15.8 px · 43 | 360 × 510 · 16 / 17 px · 58 px · 49 |
| science (shadow-play → lab predict) | 181 × 113 · 6.9 / 6.9 px · 58 | 13.7 / 13.7 px · 33 | 360 × 508 · 14 / 15 px · 52 px · 58 |

The world grew from 20,453 to 160,920-203,040 CSS px² (8-10×); the smallest text went from 2.7-6.9 px (unreadable) to
14-18.5 px (at or above the floor on every cell). The old engines given the big box still draw text under 14 px and keep
their 16:10 stage: the box was the first defect, not the only one. The old engines' tap targets were not instrumented.

Other before → after pairs inside this round, same harness each time:
- coverage 36 → 47 topics (`build-coverage.mjs`, same scope of 250);
- the number-line gap label: "1/3 ka farak" printed for a 0.18 gap → "lagbhag" unless the gap is an exact simple fraction
  (`rj-r3p-gap-label-exact`);
- picker wall p95 72.6 ms → 56-59 ms after capping the atoms candidate sample at 64 (CPU p95 22-22.4 ms after; the CPU
  time was not recorded before the cap, so only the wall pair is a before/after, and it is host-bound);
- clipped labels in lab chips ("band dabb"): 0 after `Painter.textFit` (audited per frame, in every shot above);
- `POST /api/play/*` body read twice → `{}` → every POST failed "childId required" (first local run) → fixed, 93 / 93;
- the gap label's first fix still printed "lagbhag 1/3" for 0.18 on a thirds line → "lagbhag 1/6" (caught by a judge);
- refusal and misconception lines said in the wrong mode ("these pieces are different sizes" for a place-value refusal;
  "does not share equally" for a one-sided removal) → 0 after shape conditions, enforced by a test over the whole bank;
- the place-value refusal said "hundreds" in a Hinglish line under a column labelled "sau" → "Sau mein sirf 0 hain.";
- "no air" drawn as a sealed box and "no CO2" as a bare jar → air pumped out, and a jar with a dish of KOH;
- a wrong "which is smaller" left no consequence on screen → the line draws its own answer (arrow + "baayein wala chhota");
- judges' code verdict 6 / 16 (pass 1) → 5 / 16 (pass 2, new screens exposed new defects) → 7 / 16 (pass 3, after the
  fixes); "feedback that teaches" 1.92 / 2.50 → 3.06 / 3.64 (brain / grok).

## 5. Model judges (advisory)

Two vision judges of different families, blind (never told what made a screen), on the written rubric (`RUBRIC.md`):
`taxila-brain` (OpenAI gpt-5.6-sol, reasoning medium) and `grok-4-20-reasoning` (xAI), both Azure AI Foundry deployments.
Atomic yes/no checks first; the pass/fail verdict is computed in code (B1, B2, B3, B6, B8 yes on both judges); the 1-5
scores are reported as given. Still screenshots only: no judge played a level, heard a sound or saw motion. Raw answers:
`judge/results-2026-10-09-pass1.json` (the screens judged are archived in `shots/judge-pass1/`), `-pass2.json` and
`-pass3.json` (pass 3 judged the final `shots/all/` and `shots/mistake/`; the pass-2 screens were overwritten by the
final run).

### Pass 1 (16 games × 2 judges × 3 screens; 5 blind pairs × 2 variants × 2 judges × 2 orders)

| | taxila-brain | grok-4-20 | both agree |
|---|---|---|---|
| B1 text readable | 16/16 | 16/16 | 16/16 |
| B2 targets clear and big | 15/16 | 16/16 | 15/16 |
| B3 the act is the idea (not a pick from a list) | 12/16 | 8/16 | 12/16 |
| B4 a visible consequence | 10/16 | 8/16 | 10/16 |
| B5 symbol beside the picture | 16/16 | 14/16 | 14/16 |
| B6 no points / coins / streaks / timers / ads | 16/16 | 16/16 | 16/16 |
| B7 one product across arts | 16/16 | 16/16 | 16/16 |
| B8 nothing factually wrong | 14/16 | 16/16 | 14/16 |
| **code verdict (B1 B2 B3 B6 B8 on both)** | | | **6/16** (atoms, atoms-hcf, strips-add, bundles, line-compare, lab-leaf) |

Mean scores (1-5), brain / grok: D1 act is the idea 3.77 / 2.88 · D2 feedback that teaches 1.92 / 2.50 · D3 legibility 3.91 /
4.30 · D4 craft 3.65 / 3.53 · D5 world and style 3.60 / 3.28 · D6 path to the symbol 4.13 / 3.26. Placement against the
references, counted over every dimension of every game (brain n = 96 each; grok n = 95-96, Duolingo 42 because grok often
left it out): vs **DragonBox**
better 0 / 0, about equal 11 / 30, worse 85 / 65 · vs **Brilliant** better 5 / 3, equal 37 / 45, worse 54 / 48 · vs
**Prodigy** better 44 / 66, equal 24 / 17, worse 28 / 13 · vs **Duolingo** better 41 / 25, equal 14 / 15, worse 41 / 2.

What the failures were, read against the screens:
- **B3** (8 games on at least one judge): every mode whose last step is a choice reads as a pick from a list: compare
  ("A zyada / Barabar / B zyada"), lab predict ("A pehle / Barabar / B pehle"), round ("↓ 1,000 / 2,000 ↑"), and the
  equality keypad. The judges are right that the commit step is a choice; the operations before it (cutting strips, setting
  conditions, placing on the line) did not register on stills. Not fixed this round.
- **B8**: one real defect, one misreading. Real: line-place labelled a 0.18 gap "lagbhag 1/3" on a thirds line (fixed;
  `rj-r3p-gap-label-exact`). Misread: brain took the live "x + 1 < 11" readout of a tipped scale for the level's goal.
- **B2**: brain read the "Socho =" readout pill as a 30 px button (readouts restyled as plain text).
- **D2 1.9 / 2.5**: neither judge could see a wrong move on mid-play stills and both said "cannot tell"; pass 2 adds a
  mistake-state screen (`r3p-judge-stills-need-a-mistake`). Building those screens exposed two more real defects:
  family-wide reaction lines said in the wrong mode (`rj-r3p-unconditioned-reaction-shapes`) and an English place name in
  a Hinglish line; both fixed before pass 2.
- Laptop: "a narrow sidebar with a large empty middle, the question far from its controls" (brain on 14 of 16 games, grok
  on 5). The question now sits just above the controls, and atoms blocks grow to 96 px on a laptop. Grok on 3 games: "three
  art directions look like three prototypes" (B7 was still yes on both judges).

Part B (blind pairs, a judge's pick counts only when it names the same screen in both orders):

| variant | judge | legible after / before / position-driven | idea | craft | overall |
|---|---|---|---|---|---|
| tray (as shipped) | brain | 5 / 0 / 0 | 5 / 0 / 0 | 5 / 0 / 0 | 5 / 0 / 0 |
| tray | grok | 2 / 0 / 3 | 2 / 1 / 2 | 2 / 0 / 3 | 2 / 0 / 3 |
| full box | brain | 4 / 1 / 0 | 3 / 1 / 1 | 3 / 1 / 1 | 4 / 1 / 0 |
| full box | grok | 1 / 2 / 2 | 1 / 2 / 2 | 0 / 3 / 2 | 0 / 2 / 3 |

Against what a child actually saw (the tray), no consistent vote went to the old screen. Against the old engines given the
same box, brain still prefers the play family 4 / 5 overall; grok prefers the old engine 2 / 5 overall and 3 / 5 on craft
("its sci-fi wrapper is more premium") and flips with position on 2-3 of 5. Craft is contested; the size win is not.

### Pass 2 (a fourth screen per game: the 412 × 915 phone right after a typical mistake)

The mistake is the first of the level's own mal-rules, replayed as a child holding it would play it (two families whose
beliefs show as a refused move get that move: taking 5 hundreds from 0, pouring unlike pieces together);
`shots/mistake/`, `harness/shots.mjs --mistakes`.

| | brain pass 1 → 2 | grok pass 1 → 2 |
|---|---|---|
| B3 the act is the idea | 12 → 14 /16 | 8 → 7 /16 |
| B4 a visible consequence | 10 → 16 /16 | 8 → 14 /16 |
| B8 nothing factually wrong | 14 → 12 /16 | 16 → 16 /16 |
| D1 / D2 / D3 / D4 / D5 / D6 | 4.02 / **2.90** / 4.03 / 3.73 / 3.64 / 4.25 | 2.98 / **3.52** / 4.36 / 3.65 / 3.39 / 3.44 |
| code verdict (both) | 5/16 | |

The four B8 flags in pass 2: three were real and are fixed (germination "no air" drawn as a sealed box, which still holds
air → "air pumped out", model 0; photosynthesis "no CO2" drawn as a bare jar → a jar with a dish of KOH, the NCERT set-up;
a wrong "which is smaller" left on screen with only the two placement ticks, which brain read as approval → the line now
draws its own answer under the pods and the teacher says a compare-specific noticing line), and one was the same
misreading as pass 1 (the tipped scale's live "x + 1 < 11"). `rj-r3p-lab-setups-that-lie`, `rj-r3p-silent-wrong-order`.

### Pass 3 (final build, same protocol as pass 2)

| | taxila-brain | grok-4-20 | both agree |
|---|---|---|---|
| B1 text readable | 16/16 | 16/16 | 16/16 |
| B2 targets clear and big | 16/16 | 16/16 | 16/16 |
| B3 the act is the idea | 13/16 | 9/16 | 8/16 |
| B4 a visible consequence | 15/16 | 14/16 | 15/16 |
| B5 symbol beside the picture | 16/16 | 16/16 | 16/16 |
| B6 no points / coins / streaks / timers / ads | 16/16 | 16/16 | 16/16 |
| B7 one product across arts | 16/16 | 16/16 | 16/16 |
| B8 nothing factually wrong | 15/16 | 16/16 | 15/16 |
| **code verdict (B1 B2 B3 B6 B8 on both)** | | | **7/16** (atoms, atoms-hcf, bundles, line-place, lab-predict, lab-leaf, lab-mould) |

Mean scores, brain / grok: D1 4.06 / 3.24 · D2 3.06 / 3.64 · D3 4.03 / 4.42 · D4 3.72 / 3.73 · D5 3.71 / 3.45 · D6 4.24 /
3.58. Placement against the references over all dimension × game answers (brain n = 96; grok n = 96, Duolingo 78):
**DragonBox** better 0 / 1, equal 12 / 36, worse 84 / 59 · **Brilliant** better 2 / 3, equal 47 / 63, worse 47 / 30 ·
**Prodigy** better 49 / 76, equal 18 / 8, worse 29 / 12 · **Duolingo** better 49 / 67, equal 13 / 11, worse 34 / 0.

Read honestly: both judges put this work clearly above Prodigy and Duolingo Math on most dimensions, around Brilliant (an
even split on brain, "about equal" most often on grok), and **below DragonBox** on nearly every dimension, with the biggest
gaps on D1 (the act is the idea) and D2 (feedback that teaches). The remaining code-verdict failures are all B3 except one:
compare, predict, round and the equality keypad end in a choice, and the judges count a choice as "picking from a list"
(fair: the commit step is a choice); the exception is brain's B8 on the balance, the same misreading of the tipped
scale's "x + 1 < 11" for the third time, which is now treated as a legibility signal (a child could read it the same way)
and left open. Line-round B4 failed on both judges: its mistake shows a hint, not a consequence.

Part B, pass 3 (picks that hold in both orders; after / before / position-driven):

| variant | judge | legible | idea | craft | overall |
|---|---|---|---|---|---|
| tray | brain | 5 / 0 / 0 | 5 / 0 / 0 | 5 / 0 / 0 | 5 / 0 / 0 |
| tray | grok | 4 / 0 / 1 | 2 / 1 / 2 | 3 / 0 / 2 | 3 / 0 / 2 |
| full box | brain | 4 / 0 / 1 | 4 / 1 / 0 | 4 / 0 / 1 | 4 / 0 / 1 |
| full box | grok | 1 / 0 / 4 | 1 / 2 / 2 | 0 / 4 / 1 | 0 / 1 / 4 |

Grok flips with screen order on most full-box pairs and, when consistent, prefers the old engines' dark sci-fi chrome on
craft (4 / 5). Brain prefers the play families on every criterion in both variants. Nobody should read Part B as more than
"against what a child saw, the new screens win; against the old engines at the same size, craft is contested."

## 6. What is short of the bar, and why

1. **Nothing has met a child.** Fun, learning and the teacher-in-the-play claim are design hypotheses; the pilot design is
   in DESIGN.md §11 (within-child crossover + teacher ablation, ~105 completers).
2. **Not live.** Patches 01-05 touch hot files this stream does not own; until the main loop applies them (and forge's
   renderer glob lands) taxila.dev serves none of this (P0 404).
3. **Frame rate** is short on 10 / 16 modes under a pessimistic proxy (headless software raster, 4× throttle, a host at load
   17-40). Draw JS is small; caching static layers did not move the proxy beyond noise (`rj-r3p-rows-cache-and-band`). A
   real mid-range Android phone over USB is the measurement that decides it; none was available here.
4. **Diagnosis** 0.60 vs the 0.50 bar (simulated). The level pools of several topics cannot separate their mal-rules
   (c5 strips/equal; 5 topics have < 2 discriminable mal-rules); that is a generator-grammar gap, not a picker gap (the
   picker equals the EIG optimum).
5. **Coverage** 47 / 250 topics; EVS 2 / 40 is the weakest.
6. **Screens are the dev harness**, not the lesson Desk: the embedded play mode is proven by the layout test in patch 04
   (box ≥ 300 × 440 on phones ≥ 690 px tall) and by the module-event path, not by screenshots of a live lesson.
7. **Sound and juice** are built but were not judged (a still cannot show them); TTS for micro-reactions is not built.
8. **Below DragonBox on the judges' rubric.** The commit step of compare, predict, round and the equality keypad is a
   choice between buttons; both judges count it as "picking from a list" (B3 fails on 9 of 16 games on at least one
   judge). The next step is a commit made on the object itself (tap the longer strip, drag the pod to the nearer
   landmark, drop blocks into the box), not a new family.
9. **Feedback that teaches is noticing, not explaining** (D2 3.1 / 3.6 of 5). By design the micro-line points at the
   world and the explanation comes in the teacher's full turn at the seam, which no still shows. Round's mistake shows a
   hint, not a consequence (B4 fails on both judges); the balance's live "x + 1 < 11" after a one-sided move was read as
   an inequality task by one judge three times running and is left open as a legibility risk.
10. **Two instances of this stream ran at once from 13:28 to about 13:40 UTC** (the workflow resumed the agent while it was
    still running). Both wrote to the same screenshot folders and inbox file for about ten minutes. Every number above was
    re-measured after that window on the final build: screens 14:02, judges pass 3, local acceptance 14:21. The pass-2
    judge screens were overwritten.
