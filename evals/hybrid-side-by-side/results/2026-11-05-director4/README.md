# director4: the Director walks the lesson scripts, 2026-11-05 (stream A Brain; main's GO of 2026-11-05)

The Director lane alone, the same matrix as director3: `TAXILA_R7_SCRIPT=on node --env-file=.env.local
evals/hybrid-side-by-side.mjs --matrix --director-only --cap 450 --usd 0.4`. That is 4 scenarios (steady, offtopic, stuck,
steering) × 3 pilot topics (c4-maths-ch05-t01, c5-maths-ch02-t01, c6-maths-ch06-t01), with the same scripted child as
director2 and director3. No DB was used, and the env was loaded only with `node --env-file`.

## Code and data

- **Code:** claude/r4-conversation e18c27ad, which merges int/r6 83985a8d into my branch.
  - int/r6 83985a8d is integration 6 at c6c9ab91c plus one commit that changes only OWNER.md.
  - It includes my T2–T4 (245c9f65) and Studio's patch 010 (2b991812, itemOpen).
  - It includes Studio's intent.boardRef → preselect wiring and fraction-line@1 (9000e469).
- **Scripts:** `data/lesson-scripts/` is taken from Learning's **ec40168a3** (PR #51, the four c4 board fixes).
  - validateTopicScript: c4 3/3, c5 3/3, c6 3/3 walkable.
- **Not in this run:** Studio's 011 (a scene ref in script beats), so this run measures only the script walk.

## Run

- 12 of 12 lessons.
- 375 model calls, all `taxila-fast`, ~$0.204 estimated (meter.json).
- No 401/403 and no cap reached.
- Ready p50 per lesson was 2.34–3.65 s (director3: 2.67–3.63 s).

## Per turn (the .json rows, and in the .md header of each teacher line)

- **`beat`:** `<skill>:<kind>:<beatId>` of the script beat the move rendered, or nothing on a non-scripted move.
- **`boardRef`:** the script beat's board ref as sent on Studio's ask (`intent.boardRef`). `screen` is what Studio's
  board-first pick put up for it, which the .md shows as `> screen: board <template> {facts} · ref {…}`.
- **`boardUp`:** whether a board or game was on screen that turn.
- **`scene`:** always null. Studio's code-built scenes (M5a) are not simulated in-process by this harness.
- **`check`:** the card on screen: `itemId`, whether it is a script check (`script:` ids), misses on it, and whether its answer was given.
- **`replyMs` / `replyReadyMs`:** as in director3.

## What the walk did (counts only, not a judgement)

- 132 teacher turns; 57 of them rendered a script beat:
  - hook 12;
  - explain 35;
  - worked 5;
  - check 3;
  - remediation 2.
- 43 turns carried a board ref; a board was on screen on 39 turns.
- Beats reached per lesson (each lesson is 11 child turns):
  - **steady:**
    - c4: hook, e1–e4, worked, c1;
    - c5: hook, e1–e3, worked, c1, then the remediation for m-count-marks;
    - c6: hook, e1–e3, worked, c1, then the remediation for m-missing-sides.
  - **steering:**
    - c4: hook, e1–e4;
    - c5 and c6: hook, e1–e3, worked.
  - **stuck:** hook, e1–e3 (all three topics).
  - **offtopic:** hook, e1, e2 (all three topics).
- With 3–4 explain beats before the worked example, an 11-turn lesson reaches the first check only in the steady lessons.
- Turns with a caught first draft: 41 of 132. 0 fell back.

Transcripts are for main's judging (three judges, one per class). The run is unscored here.
