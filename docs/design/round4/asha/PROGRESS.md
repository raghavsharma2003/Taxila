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

## Stage B: DONE (2026-10-10 ~07:20Z)
- Rig front: `images/rig-b.webp` (o6 + one more age step; blind ages 25-36, n = 5). Pick: `evidence/rig-pick.txt`.
- Expression edits of rig-b: x-speak (aa), x-listen (tilt), x-think (eyes up-aside, brows level), x-warm, x-blink, + x-mid
  lid and x-yawL / x-yawR (~30 deg keys for the turn field). Registered (ORB + RANSAC): `evidence/register-B.json`.
- Skin: graded half-way to MST 6 (kC 0.7262, dL -3.35): mean L* 61.8 -> 58.4, C* 65.3 -> 46.4 (target 55.1 / 27.9);
  4 patches, `evidence/skin-B.json` (also measured in the old jharokha grade; that frame is gone now).
- Blind identity check, n = 5 (3 gpt-5.6-sol + 2 Kimi K2.6) on a 3 x 2 grid: same person 5/5, identity 5,5,4,5,5,
  nothing childish / uncanny / disapproving: `evidence/idcheck-B-{brain,kimi}.json`.
- Ledger after Stage B: 18 images, USD 3.56.

## Stage C: DONE, gate FAILED, kill rule applied (2026-10-10 ~09:35Z)
- Rig space = crop (162,0)-(862,700) of the 1024 front x 1.4629 (`rigspace.py`, frames in scratch `rs/`).
- Cutter `layers.py` -> lid keys `lidkeys.py` -> turn keyform field `keyfield.py` -> `pack.py` (per-face constants block
  `geom.face`, read by the runtime's `face.js`). Runtime = r8's, derived by `make-runtime.py` with asserted replacements
  (every c-front constant reads F; defaults = c-front). r8 pack through it: pixel-identical, 12 poses (`evidence/r8-parity.json`).
- Pack `art/character/puppet2d/lamp1/`: 156.8 KB wire / 183 KB raw + poster `rest.webp` 50.7 KB (gate <= 250 KB).
- Rest gate: head SSIM 0.9734 (1024) / 0.9741 (720), gate >= 0.97 (`evidence/rest-ssim-*.json`).
- Slots (app audit shots, 1x CSS px): desk window 325x316 / 375x405 / 440x440; speech row circle 80; Home 319x172 /
  319x240 / 279x312; Meet 220x222; Summary ~78x100. Views: 4-element regions fitted contain-centred.
- Demo `art/character/puppet2d/lamp1/demo.html` (836 KB, self-contained, interactive smoke-tested at 360 and 1366: no
  errors, no horizontal scroll). Clips `clips/asha-{360,412,1366}.mp4` + `asha-412-calm.mp4` (15.2 s, H.264 + her line).
  Frame sheets `evidence/frames-{360,412,1366}.webp`. Logs `evidence/stageC-log-*.json`.
- Measured: bilabials 9/9 with the text rule (5/9 from Azure alone); blink reads (closed frame at 5.0 s); blinks 46/min
  while speaking (production behaviour); nods 10.75 / 11.77 s; safety calm smile 0, no nods; fps 80 px row 57.3 at 4x
  (headless SwiftShader), desk 375x405 10.5 at 4x (software raster).
- Blind judges (n = 5 per round, 3 gpt-5.6-sol + 2 Kimi K2.6): same person 5/5, childish 0/5 every round; UNCANNY
  4, 5, 3, 4 /5 over C1-C4 (gate <= 1/5); premium 2.4-2.6. Shipped r8 through the same protocol: uncanny 0/5, premium 3.6.
  Without the eval turn: uncanny 5/5. `evidence/judge-live-tally.md`. Three polish rounds used; kill rule: stopped.

## Stage D: DONE (prepared, not applied), 2026-10-10 ~09:40Z
- `integrate/APPLY.md` + 7 patches: 01 look switch (default r8), 02 runtime, 03 pack (binary), 04 default lamp1 (HOLD:
  Stage C failed), 05 + 05b one teacher, 06 bilabials from text. All `git apply --check` clean on the base; applied in
  order to a fresh copy = the tested tree (tsc clean, vite build OK, the listed tests pass).
- `CONTEXT-PROPOSED.md` written.
