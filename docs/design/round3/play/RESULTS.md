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
| P-O5 fit | 0 overflow, text ≥ 14 px, targets ≥ 44 px, 3 viewports × every mode × art | {{FIT}} | `harness/shots.mjs --shots --all-arts`, dev harness, headless Chromium, DPR 1; files `shots/all/*.jpg`, `shots/all/report-all.json` | {{FITV}} |
| P-O6 frame rate | ≥ 50 fps median, 4× CPU throttle, 412 × 915 | 6 / 16 modes ≥ 50 (strips-compare 56.3, strips-add 56.0, equality 53.1, lab-golu 52.3, lab-magnet 51.8, line-round 51.5); the rest 40.1-49.0 (lab-predict 40.1, lab-mould 40.7, line-place 42.8, line-compare 43.4, lab-ice 45.2, lab-leaf 45.5, atoms-hcf 46.9, bundles 47.4, balance 48.3, atoms 49.0) | median of 3 runs × 6 s of scripted drag/run per mode, DPR 2, headless SOFTWARE raster, host load 17-28 on 4 cores; `shots/report-fps.json`, `report-fps-line.json` | **short on 10 / 16** under this proxy; no real phone measured |
| P-O7 reaction guards | 0 verdict words, 0 unrevealed keys, 0 floor violations | 0 / 0 / 0 over the whole bank × every moment × sample facts | `tests/play-react.test.mjs`; P6 on the local server | met |
| P-O8 world | absence invariance at +365 days; every route cites an edge | byte-identical; 100% cited (18 / 1 / 6 / 1 routes for the 4 families on the test account) | `tests/play-server.test.mjs`; P7 on the local server | met |
| P-O9 diagnosis (SIMULATED) | picker ≤ 0.50 × random's levels | 0.60 mean over 17 topics (EIG optimum also 0.60); 0.50 over the 13 topics where random needs ≥ 2 levels; correct classification 1905 / 2040 vs 1749 / 2040 random | synthetic learners (one mal-rule or none, ε 0.1), n = 120 per topic per policy, stop at posterior 0.9, max 12 levels; `harness/diagnose-sim.mjs`, `results/diagnose-sim-2026-10-09.json` | **short** (0.60 > 0.50); 4 topics at ceiling, c5 strips/equal cannot separate its two mal-rules (6.6 levels, 60 / 120 for every policy), 5 topics skipped (< 2 discriminable) |
| P-J judges | reported as measured | §5 | §5 | advisory |

## 3. The in-lesson loop (end to end, local)

`tests/prod/round3-play.mjs` against a local production server (`node server/serve.mjs`, NODE_ENV=production) on a copy of
the working tree with patches 01-05 applied, Neon TEST branch: **93 / 93**, run twice (12:03 and 12:44 UTC). The P8 block
starts a lesson, starts play inside it, solves a level through the server grade, receives the signed evidence and the
level-end seam, posts them as module events on `POST /api/lesson/turn`, and reads the database:

- the teacher took a full turn at the level end (move `celebrate`) grounded in the verified PLAY row, n = 2 (one per run):
  "Riya, aapne composite number ko prime factors mein todkar 2·2·5·13 tak pahunchaya; ab isi method ka naam bataiye."
  (2.6 s) · "Riya, aapne 250 ko prime factors mein toda: 2 × 5 × 5 × 5. Ab isi method se 150 ko todkar likhiye." (2.2 s);
- exactly one `kt_evidence` row `via: "game"` for the level; the same level again and a forged token folded nothing;
- latency (local server, this sandbox): play start p90 380 / 528 ms (n 8 / 8), act p90 199 / 196 ms (n 41 / 40).

**taxila.dev today: 0 / 1** (P0: `/api/play/*` is 404 because patch 01 is not applied), re-checked 2026-10-09 12:46 UTC. The
India-side latency and the deployed loop are unmeasured.

## 4. Before / after on the same harness

`harness/shots.mjs --before-after` (2026-10-09 12:47 UTC; `shots/report-before-after.json`, shots `shots/before-*.png`):
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
- `POST /api/play/*` body read twice → `{}` → every POST failed "childId required" (first local run) → fixed, 93 / 93.

## 5. Model judges (advisory)

{{JUDGES}}

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
