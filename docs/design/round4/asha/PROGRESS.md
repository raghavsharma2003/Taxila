# Asha round 4 (option 4 "Lamplight flat"): progress log

Brief: `/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-briefs/ASHA.md`.
Scratch: `/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha/` (raw/ holds every PNG; the
face agent's original `w1-flat.png` was copied there from `../r4-face/raw/`).
Scripts: `scripts/character/puppet2d/lamp1/` (imgapi.mjs = ledger + USD 23 hard stop; run.mjs + jobs.mjs = image jobs;
blind-outfit.mjs, lineup-outfit.mjs, tally-outfit.py = judges; slots.py, build_outfit_page.py, shoot-page.mjs).

## Stage A: DONE (2026-10-10 06:56Z) — READY-OUTFIT created
- RESEARCH.md: sources and reasoning.
- Age front: `age-b` (edit of w1-flat: fuller, settled face, natural lips, one lock per side). Pick recorded before any
  judge: `evidence/age-pick.txt`.
- Outfits: o1-print, o2-denim, o3-shirt, o4-cardigan (round 1); o5-denim-print, o6-cardigan-print (round 2, after the
  lineup). Images in `images/*.webp`; raw PNG in scratch.
- Blind single-image, n = 5 per front (3 gpt-5.6-sol + 2 Kimi K2.6): `evidence/blind-outfit-{brain,kimi}.json`.
  Lineups (2 x 2, shuffled), n = 5 each: `evidence/lineup-outfit-*.json`, `evidence/lineup2-outfit-*.json`.
  Tally: `evidence/tally-outfit.{json,md}`.
- **Pick: o6-cardigan-print** (overall 5/5 in lineup 2; cardigan friendliest 10/10; professional 5.0; Indian 5/5).
  Runner-up for "cool": o5-denim-print. `evidence/outfit-pick.txt`.
- Page: `outfit/index.html` (1.0 MB; contract checks pass at 360/412/1366, `outfit/shots/checks.json`).
- Ledger after Stage A: 8 images, USD 1.78.

## DIRECTION CHANGE (owner via coordinator, 2026-10-10 ~07:20Z)
"lets not care even a bit about prakash and lets focus on only 1 teacher that is asha (new grown up version)".
- Outfit CONFIRMED: o6-cardigan-print.
- Prakash world UI will NOT be built: Asha must work in TODAY's app. Keep face, outfit, plain background, flat lamplight
  look. Judge/demo her at the slots she occupies in the current product (src/face-puppet, src/avatar TutorFace, child
  home, lesson desk, play/game), at 360x800, 412x915, 1366x768. Jharokha framing no longer required (plain rounded frame
  like today's UI).
- Stage D targets the current app: lamp1 pack into src/face-puppet behind a look switch (then default); ONE teacher only
  (Asha), Arjun and every teacher-choice step removed (shared/tutors.js, onboarding/picker, copy, parent corner, tests).
  Still patches + APPLY.md only; round 3 is deploying.

## Stage B: in progress
- Rig front = o6 with one more age step (age reads 25-35 on every outfit), flat bg, mouth closed neutral, eyes open.
- Edits of the rig front: speak aa, listen tilt, think (eyes up-aside, brows LEVEL), warm, blink, + mid lid; register (DIS).
- Skin: half-way grade to Monk 6, measured inside the jharokha grade.
- Identity check (blind n = 5) across frames.

## Stage C / D: not started
