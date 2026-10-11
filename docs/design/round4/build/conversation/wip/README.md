# 4A audit items — stopped by the owner (2026-10-10), kept as a patch

Preservation only: not applied, not for release. `4a-audit-items-stopped.patch` is one `git format-patch` commit
made on top of `7565adf1` (claude/r4-conversation, the release-9 pin). Apply with `git am` on a branch that has 7565adf1.

What it holds (stream 5's journey audit items, main's 19:45 work order, stopped by the 20:0x "no new features" decision):
- (b) grading truth — `classify.js`: `equationTail` ("2/3 × 3/4 = 6/12" graded as the result), `quantitySequence` (an
  ordering answer in kg/g graded in code), `numeric_mismatch_partial` (a different number is never partial on a one-number
  key: A24-03 "2000 g"); `targetFor` marks `posed` when she handed the floor back for an answer, and `say.js verdictFor`
  makes a non-answer to her own question "unverified", so "Bilkul, …" is caught (A22-03; owner-2 session seed 7 s3 t13).
- (c) the break as a choice — `state.js`/`shapes.js`: a break request gets `tiredOffer`/`breakYes` plus chips (short
  break · keep going · stop for today); a rest waits on "Back to the lesson" (A-06 "Bas, ab main thak gayi").
- (e) continuity — `state.js beforeOf` + `shapes.greet`: a topic with outcomes from earlier lessons opens from last time,
  never "have you learnt this?" (A-05).
- the patch-13 shadow computation wrapped in try/catch (as main's amendment).
- tests: r4-grading-truth, r4-tired-break, r4-continuity, r4-item-setaside (+1).

State: targeted tests pass (143/143 over the touched suites); the full gate was NOT run on this combination; no
owner-2 before/after was run. (d) the "0." card fix shipped separately in 7565adf1; (f) the running example was not started.
