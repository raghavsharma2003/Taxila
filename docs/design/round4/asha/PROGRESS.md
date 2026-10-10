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

## Stage C: in progress (live 2D puppet, r8 arm-P method)
- Rig space = crop (162,0)-(862,700) of the 1024 front x 1.4629 (`rigspace.py`, frames in scratch `rs/`).
- Cutter `layers.py` -> lid keys `lidkeys.py` -> turn keyform field `keyfield.py` -> `pack.py` (per-face constants block
  `geom.face`, read by the runtime's `face.js`). Runtime = r8's, derived by `make-runtime.py` with asserted replacements
  (every c-front constant reads F; defaults = c-front, so an r8 pack renders unchanged). Bundle: `demo/entry.js`
  (production PuppetDriver + lamp1 rig) via rolldown into scratch `demo-build/puppet.js`.
- Pack: `art/character/puppet2d/lamp1/` (geom.json + webp layers). 156.5 KB on the wire (gate <= 250 KB).
- Rest gate (`restssim.py`, harness `harness.mjs`, SwiftShader): head SSIM 0.9734 at 1024, 0.9741 at 720 (gate >= 0.97)
  after: iris circles refit (old centres were 6 px low), catchlights re-centred, painted lid shadow kept (procedural
  shade only once the lid moves), the face overscan no longer painted over the ears / bun, and every pixel within 4 px
  of the flat cream unmixed against it (outlines and pale rims kept). Was 0.9454 before this pass.
- Next: views for today's slots, demo.html, clips, fps, blind judges.

## Stage D: not started
