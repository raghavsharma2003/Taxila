# Journey audit fixes by stream 5 (2026-10-11): before / after

The main session routed these audit rows to stream 5. The code changes are patch requests 09-14 in
`docs/design/round4/build/asha/patches/` (the files belong to other owners), applied on `claude/r4-asha` as
`[patch-request]` commits. Shots are in `fixes/`. Every shot is a local production build in headless Chromium.

| row | change | evidence |
|---|---|---|
| #11 | A child's first lesson after set-up opens at any hour; the hours hold from the second lesson; the cap and a safety hold still apply. The default hours are 06:30-21:30 (was 07:00-20:30) in the parent controls, the Conductor's limits and the set-up screen. Migration 028 (number from the main session) moves the column defaults; it rides with patch 14. | `tests/r4-asha-hours.test.mjs` (2); existing hours tests 127 / 127 |
| #12 (now) | The promises step's 2-s hold gate is above the fold. "Full text" moves under the gate, and the doubled list gap goes. | 360 × 800: gate top/bottom 808/856 → **708/756**. 1366 × 768: 715/763 → 615/663. `fixes/promises-{before,after}-{360,1366}.webp` |
| #12 (cut) | **The 5-step set-up** (owner-approved): class + board + language · promises + 2-s hold · account · consent · the child's name + PIN + "Give the phone to {child}". The other answers start from defaults the parent changes in the Parent corner. In Hello she picks what she likes when the parent chose none, and says hi to Asha (the mic check, with Skip). The AI-disclosure card and the honesty promise are word for word unchanged and still first. | Scripted run, production build + TEST branch, headless, n=2 per arm (fixed waits, so time is relative): **steps 9 → 5, taps 28 → 22, fields 4 → 4, time to her first sound 26.1 / 25.3 s → 20.1 / 20.6 s at 360 and 26.2 / 25.2 s → 20.3 / 20.3 s at 1366** (`setup-journey.json`). Her Hello gains two cards, after her first sound (interests when none were chosen; say hi). `fixes/setup-{class,child}-{before,after}-{360,1366}.webp`, the removed `setup-{controls,check,handover}-before-*`, `fixes/hello-{change,sayhi}-after-*`. `tests/r4-asha-setup-cut.test.mjs` (6) |
| #15 | The Hello cards after the greeting show her whole face: a centred 168 × 168 square, not a 328 × 168 strip of forehead. | `fixes/hello-{before,after}-{360,1366}.webp` |
| #15 | The page error "Cannot close a closed AudioContext." is root-caused and fixed. The set-up mic test's `end()` ran twice: once when the test finished, again from Continue. | Browser (fake mic, test → Continue): page errors before 2, after 0 |
| #15 | Parent home: the tip starts with a capital; the bottom tabs are 14 px (were 13). "Riya had a first lesson" is unchanged: the second visit is labelled "Short visit, not counted as a lesson", and the count is honest. | The journey's real account: `fixes/parent-{before,after}-{360,1366}.webp` (tip "ask Riya…" → "Ask Riya…", tabs 13 → 14 px) |

## Steps to see the cut

1. Open the site signed out, tap "Start free set-up".
2. Step 1: a class, a board, a language (▶ plays her sample). Continue.
3. Step 2: hold "Hold to continue" for 2 s (or type "parent").
4. Step 3: name, email, password. Step 4: the three consent choices, "Agree and continue".
5. Step 5: the child's first name, a 4-digit PIN twice (Next, OK), "Give the phone to {name}". Her greeting plays.
6. Hello: Got it (the AI card) → a picture → what she likes (if none were chosen) → "Say hi" or Skip → lesson 1.
7. The Parent corner (PIN) holds the defaults: 06:30-21:30, the minutes by class, Casual/Respectful, captions.
