# Journey audit fixes by stream 5 (2026-10-11): before / after

The main session routed these audit rows to stream 5. The code changes are patch requests 09-13 in
`docs/design/round4/build/asha/patches/` (the files belong to other owners), applied on `claude/r4-asha` as
`[patch-request]` commits. Shots are in `fixes/`. Every shot is a local production build in headless Chromium.

| row | change | evidence |
|---|---|---|
| #11 | A child's first lesson after set-up opens at any hour; the hours hold from the second lesson; the cap and a safety hold still apply. The default hours are 06:30-21:30 (was 07:00-20:30) in the parent controls, the Conductor's limits and the set-up screen. A proposed migration (`09b`) moves the column defaults. | `tests/r4-asha-hours.test.mjs` (2); existing hours tests 127 / 127 |
| #12 (now) | The promises step's 2-s hold gate is above the fold. "Full text" moves under the gate, and the doubled list gap goes. | 360 × 800: gate top/bottom 808/856 → **708/756**. 1366 × 768: 715/763 → 615/663. `fixes/promises-{before,after}-{360,1366}.webp` |
| #12 (cut) | A ≤ 5-step set-up: proposed to the main session, waiting for its OK before building. | the send_message proposal |
| #15 | The Hello cards after the greeting show her whole face: a centred 168 × 168 square, not a 328 × 168 strip of forehead. | `fixes/hello-{before,after}-{360,1366}.webp` |
| #15 | The page error "Cannot close a closed AudioContext." is root-caused and fixed. The set-up mic test's `end()` ran twice: once when the test finished, again from Continue. | Browser (fake mic, test → Continue): page errors before 2, after 0 |
| #15 | Parent home: the tip starts with a capital; the bottom tabs are 14 px (were 13). "Riya had a first lesson" is unchanged: the second visit is labelled "Short visit, not counted as a lesson", and the count is honest. | The journey's real account: `fixes/parent-{before,after}-{360,1366}.webp` (tip "ask Riya…" → "Ask Riya…", tabs 13 → 14 px) |
