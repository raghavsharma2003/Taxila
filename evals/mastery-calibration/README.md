# Mastery-calibration simulator

`sim.mjs` runs SIMULATED children through the real lesson pipeline offline (its header says how; `analyze.mjs` reads the
JSON it writes; `power.mjs` sizes a comparison). Results by date are under `results/`.

**Reading a run made with learner params kt-r3 (2026-11-10) or later.** From kt-r3 on, a "why" or a teach-back answer moves
mastery only once its blind grade arrives (audit LEARN-05: an answer folded without its verdict is held on K). This sim has
no blind grader, so every why and teach-back is held. Its children therefore never reach "learned today", and its
certification numbers drop for that reason alone. That drop is not a regression in the learner model. To compare with
runs made before kt-r3, add a grader to the sim, as `evals/learner-pilot-replay/replay.mjs` does with
`comprehension/later.js gradeLater`.
