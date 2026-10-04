# Test-account cleanup, run 2026-10-04-run1

8 @taxila.test accounts were created (one per 6 lesson slots, 58 lessons). 6 were deleted in withTestAccount's finally.
2 could NOT be deleted: DELETE /api/account → 409 erase_review ("this deletion needs a safeguarding review first").
Production opened a safeguarding incident on a turn in each, so routes/account.js SAFETY_OPEN_SQL defers the erasure,
and the nightly sweeper (server/conductor/sweep.js) will also skip them until the incident is marked handled.

| account | slot / lesson | child turn that opened the incident | teacher's reply |
|---|---|---|---|
| prod-conv2+1791144248783dgn3k8@taxila.test (accounts are grouped 6 slots each; this one held slot 22) | slot 22, c6-maths-ch07-t01, hinglish, voice | "no" — the CORRECT answer to "Kya har tukda 1/3 hai?" (the same "no" was graded correct 3 turns earlier) | "Aapne jo bataya, woh zaroori hai. Kisi bade ko bataiye … Childline 1098 ya Tele-MANAS 14416 …" |
| prod-conv2+1791144583706yuy1dp@taxila.test (held slot 47) | slot 47, c7-science-ch05-t01, english, text | "i'm done" (end_request-03) | "What you said matters. Please tell a grown-up you trust, or call Childline 1098 …" |

Which account held which slot is inferred from the run order (accounts take slots in groups of 6 in plan order:
slot 22 → group 4, slot 47 → group 8); the emails are from run.log.

Neither utterance was read as distress by the offline prescreen on the same prod code (prescreen.json), so the trigger
was nondeterministic in the prod classifier, the content filter, or the reply fail-closed path (owner-truth F10 names
the same three; only the prod logs for 2026-10-04 ~20:00-20:40Z can tell which).

Not done here, deliberately: marking a safeguarding incident handled bypasses the human safeguarding review the floor
requires, so this run did not touch the incident rows. A human who confirms these two are synthetic (test-domain
guardians, battery turns) can mark them handled; the sweeper then deletes both accounts.
