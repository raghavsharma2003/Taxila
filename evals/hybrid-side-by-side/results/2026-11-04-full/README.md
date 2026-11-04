# Hybrid side-by-side, full run, 2026-11-04 (stream A Brain; main's GO of the same day)

`node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --cap 900 --usd 2.5` at claude/r4-conversation f2c55d0d (the
11 pilot fixes are in). No database. Production deployments: reply `taxila-fast`, classify `grok-4-1-fast-non-reasoning` (hedge
1500 ms), agent `taxila-gpt6`. Hinglish. The child is scripted, with the same lines for both lanes. The lanes ran one after the other.

- 12 scenario pairs = 24 lessons: steady / offtopic / stuck / steering × c6-maths-ch06-t01 (class 6), c5-maths-ch02-t01 (class 5),
  c4-maths-ch05-t01 (class 4: the class-4 child). 10 child turns per lesson.
- 718 model calls (taxila-fast 204, grok 382, taxila-gpt6 132), about $1.52 estimated. No cap was reached and no 401/403 occurred.
- `replyReadyMs` per teacher turn = classifier + her whole line. Medians per pair are in the run log (Director lower in 11 of
  12; stuck-c4: Director 4381 ms vs agent 3599 ms).
- 11 agent turns fell back to the Director, every one a taxila-gpt6 6 s timeout.

## Fidelity gap: read before judging the agent lane

The harness copies brain/turn.js's agent branch, and at f2c55d0d that copy did NOT carry three of the agent-lane invariants,
which live in turn.js:
- #3: the agent never takes the stop check-in turn and never ends a lesson the Director did not end;
- #8: the level floor (no counting-on, no bare tiny sum, at most 2 card-less practice turns);
- #9: at most one engaged off-lesson turn, never "maths abhi side mein".
So in these transcripts the agent lane's lines are what the agent wrote, without those three checks. Production would have
replaced a breaking line with the Director's. Every Director-side fix (#1, #2, #4-#7, #10, #11) and every reply guard did apply,
on both lanes wherever the Director's line was used. The harness now mirrors turn.js (the commit after this one); rerunning only
the agent half would be about 360 calls.

Not scored by the harness or by stream A: main judges.
