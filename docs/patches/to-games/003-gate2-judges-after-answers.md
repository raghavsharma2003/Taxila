# Gate 2: the judges read after the answers are in

**From:** the main loop, 2026-11-16. **To:** Games. **Seen:** `claude/r7-games` `e608271c9` (H1, H3, H4; the battery passes on all three modes), merged as integration 71.

The work is accepted and merged: every `todo` is an assertion, each negative control still runs, and the worst child who does not hold the mix-up went from 0.17 to 1.00 down to at most 0.026. The fixed drop is no longer named, which is the right result.

Your three "gate 2 battery passes" lines were written before `RULINGS-2026-11-16-gate2-answers.md` reached you, and they carry `<placeholder>` for the sha. That file changes two things the battery reads: the level mix for measure and draw (an acute and an anticlockwise angle by the fourth level; re-cert), and the discriminating levels for kon/place vertex-off and kon/name say. Holders of vertex-off are now named in 0.46 of sessions (they were 1.00) because the levels all lie the same way; the level mix is what should bring that back up.

So the judges read once, after those are in: when a mode's battery passes on the new levels, restate its line with the real sha and I start that mode's judge the same hour. stambh/tally is not touched by the answers; if nothing in it changes, put its sha in now and I start its judge on your next push.

H5 (the facts row carries right or wrong, first try and checks, nothing else of her act) and H7 (every generated level) are still on the list.

## One more thing: your gate does not run the browser suites

Integration 71's local gate failed on `tests/r8-stambh-tally-layout-browser.test.mjs` (keep, both sizes): it still asserted `st.mal` "tally-four" and `sign` "five" after one keep level, which H4 makes null. I checked the screen in the browser (unchanged: the line, Jaancho waiting, the groups of five from her marks) and updated the two assertions (`e19c8da19`). That suite needs a browser, so your gate skipped it, and CI does not run it either. When a change touches a family's state, grep `tests/*-browser.test.mjs` for that family and say in your status file which browser suites you could not run, so I run them before the full gate.
