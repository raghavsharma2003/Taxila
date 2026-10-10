# lamp2 (painted keys) results, gate by gate

Date: 2026-10-10. Branch `claude/r4-asha-rig2`. One teacher, the grown-up Asha: face option 4 "Lamplight flat",
terracotta-rust open cardigan over a teal block-print kurta, from the approved Stage B rig front (`rig-b`).

**Verdict: lamp2 FAILS. Kill rule applied after the third polish round; it stays a HELD look.** The painted-key
method fixed what broke lamp1 (no warp, uncanny best round 0/5 against lamp1's best 3/5), but the final build reads
uncanny 2 of 10 blind runs pooled (bar at most 1 in 5) and premium 2.8 against r8's 3.2-3.6 in the same runs. Same
person, not childish, rest SSIM, pack size, fps, bilabials, the safety face and the lip-sync offset median all pass.
r8 stays the live face. Making any other look the default needs the owner's yes; nothing here flips a default.

Honesty notes: the judges are models (3 x gpt-5.6-sol + 2 x Kimi K2.6 per run), advisory, not people, and run-to-run
noise at n = 5 is large (the SAME images scored uncanny 0/5 in J3 and 2/5 in J3b; r8 itself scored 0-1/5). fps is
headless Chromium, not a phone. No child has seen her.

## What lamp2 is

- **Art** (`art/character/puppet2d/lamp2/`, `scripts/character/puppet2d/lamp2/`): 17 painted keys, every one an Azure
  image edit (deployment `DEPLOY_IMAGE`, gpt-image-2, quality high) of the SAME approved front, registered to it and
  composited back ONLY inside its region (ORB + RANSAC similarity outside the region, ECC affine on a window round it,
  gain + offset colour fit on the ring, a low-passed membrane for the leftover step, an inward feather):
  - mouths (10): rest (= the front), mbp, aa, eh, ee, oh, oo, fv, ltd, smile, calm (safety neutral);
  - eyes (5 + open): half and closed (the Stage B `x-mid`, `x-blink` edits), lookL, lookR, lookUp (thinking);
  - brows (2 + neutral): raised (listening), concern (soft, inner ends up).
  Two rigid layers: the body (head area removed, the neck kept under the chin) and the head (cut across the neck with a
  soft band on neck SKIN only, so hair keeps its painted edge). Skin grade: the Stage B half-way-to-MST-6 grade on
  every layer and key. 25 image calls, USD 5.54 (`ledger.json`).
- **Runtime** (`src/face-puppet/rig-keys/`): `KeyRig`, a Canvas 2D rig the unchanged `PuppetDriver` drives (it is a
  `RigLike`), plus the stage surface (R.dpr, view, stats, warm, dispose). Every layer is resampled once per canvas
  size; a frame is at most 7 blits. `schedule.ts` (pure, unit-tested): viseme -> painted mouth, 45 ms eased crossfade,
  70 ms minimum hold (a seal lands at once), our own blink schedule (four held cels, ~16-19 a minute, pulled to
  pauses), gaze as eye-key swaps with hysteresis, brows from the expression channels, rigid motion only (roll at most
  1.2 deg about the neck, sway 3 px, nod 2.2 px, breath a sub-pixel body scale). Research behind the rules:
  `RESEARCH.md`.

## Gates

| gate | bar | result | n, method | evidence |
|---|---|---|---|---|
| uncanny (blind) | at most 1/5 | **FAIL**: final build 2/5 (Jfinal); the judged P2 build 0/5 (J3) then 2/5 on the identical images (J3b): 2/10 pooled for that build, 4/15 over the three runs of it | n = 5 per run, 3 gpt-5.6-sol + 2 Kimi K2.6, lamp1's `judge-live.mjs` prompt verbatim, desk window 375 x 405 at 412; r8 calibration in the SAME run each time | `evidence/judge-*.json`, `judge-tally.txt` |
| premium (blind) | at least 3.6 (r8) | **FAIL**: 2.6 / 2.8 / 2.8 (J3 / J3b / Jfinal); best round 2.8; r8 in the same runs 3.6 / 3.4 / 3.2 | as above | same |
| same person | at least 4/5 | **pass**: 5/5 in every one of the 6 lamp2 runs | as above | same |
| childish | at most 1/5 | **pass**: 0/5 in every run | as above | same |
| moving photo (diagnostic) | (lamp1's bar, at most 1/5) | 1/5 (J3), 2/5 (J3b), 2/5 (Jfinal); J1 4/5 | as above | same |
| rest SSIM vs the approved front | at least 0.97 | **pass**: head 0.9893 (eyes 0.987, mouth 0.988) | live KeyRig rest frame (t = 0.5 s, all weights 0) in headless Chromium vs the graded front, native px, lamp1's SSIM (gaussian 1.5) | `evidence/rest-ssim.json` |
| key registration | SSIM outside each region at least 0.995 | **pass**: 1.0000 for all 17 keys; max abs difference outside the region 0/255 (by construction) | `keys.py` | `evidence/keys.json` |
| pack on the wire | at most 250 KB | **pass**: 133.0 KB (19 WebP + geom.json; WebP is the wire form); + poster 21.8 KB | `pack.py` | `art/character/puppet2d/lamp2/pack-report.json` |
| fps, 80 px speech row, 4x CPU throttle | at least 50 | **pass**: 60.0 fps (p95 16.8 ms, 601 frames / 10 s; canvas 160 x 160 at dpr 2). Desk window 375 x 405 (750 x 810 canvas): 49.3 fps at 4x (lamp1 10.5) | HEADLESS Chromium, CDP throttle, real-time scene loop; not a phone | `evidence/fps-row80.json`, `fps-desk412.json` |
| bilabials seal, 24-line battery | all (the brief: 9/9) | **pass with the lamp2 text rule: 132/132 bilabial words**; with lamp1's rule 121/132; Azure's visemes alone 82/132. The scene line: 11/11 (lamp1's 9 words + 2) | offline: the stored Diya battery (`evals/face-puppet/out/diya`), the product timing path (VisemeScheduler lead, resolveVisemes, weightsAt) into MouthKeys at 60 fps; sealed = mbp key at >= 0.9 within [word - 80 ms, word end] | `evidence/battery-24.json`, `evidence/scene-412.json` |
| calm safety face | no smile while speaking, no nods | **pass**: smile key 0 ticks while speaking, max smile channel 0, the calm key at every closed-mouth moment, brows neutral; listening head pitch -1.7..-0.1 deg, no nod kicks (normal scene: 8.7 deg nods) | 412 capture with `calm=1`, 913 driver ticks | `evidence/scene-412-calm.json`, `clips/asha-412-calm.mp4` |
| lip-sync offset | within -125..+45 ms (decisions E-P8; p2-face product figure median -5 ms, 89% within 50) | **median pass, spread worse**: key mouth minus the judged (forced-alignment) timing median +15 ms (IQR -10..+50), 57% of lines within +-50 ms; the continuous viseme jaw on the same path +10 ms, 95% | E3 estimator (lipsync-offset.mjs), 21 lines with a CTC track, with the 35 ms key lead | `evidence/battery-24.json` |
| blinks | about 15-20 a minute, at pauses | long-run 16.0 / 18.7 per minute (quiet / speaking, 10 simulated minutes); the 15 s scene 6 blinks (23.7/min: two pulled to its phrase ends, one gaze-evoked) | `tests/r4-asha-rig2.test.mjs`, scene logs | same |

Clips (15.2 s, H.264 + her line, AAC): `clips/asha-360.mp4`, `asha-412.mp4`, `asha-1366.mp4`, `asha-412-calm.mp4`, every
app slot at once (lesson desk window, 80 px speech row, child home, onboarding meet, lesson summary; sizes from the
app audit as lamp1). Frame sheets: `evidence/frames-{360,412,1366,412-calm}.webp`. Demo: `art/character/puppet2d/lamp2/demo.html`
(self-contained; the same page renders the r8 pack through the shipped r8 runtime for calibration).

## The judged rounds (kill rule: at most 3 polish rounds after the first judged clip)

| round | build | uncanny | moving photo | premium (mean) | r8 same run: uncanny / premium |
|---|---|---|---|---|---|
| J1 | first full build (60 ms fades, roll cap 2 deg) | 3/5 | 4/5 | 2.6 | 1/5 / 3.4 |
| J2 | P1: `eh`, `oh` repainted from `aa`, `ltd` from `ee` (one set of teeth per family); a parallel look-up glance; 45 ms fades | 2/5 | 2/5 | 2.8 | 0/5 / 3.0 |
| J3 | P2: brow regions widened + a low-passed boundary fill (no brow ghost); roll halved (cap 1.2 deg) | **0/5** | 1/5 | 2.6 | 0/5 / 3.6 |
| J4 | P3: a fuller `aa` interior, brow flashes at phrase onsets, roll cap 1.5 deg + a sway toward glances | 2/5 | 4/5 | 2.4 | 0/5 / 3.4 |
| J3b | P2 again, the IDENTICAL judge images (confirmation, no change) | 2/5 | 2/5 | 2.8 | 0/5 / 3.4 |
| Jfinal | the deliverable: P2 + the 35 ms key lead and the bilabial extension (timing only) | 2/5 | 2/5 | 2.8 | 1/5 / 3.2 |

P3 regressed ("proportions swim" again under the extra motion; "teeth a flat block") and was reverted; the
deliverable is P2 plus two timing-only fixes made after the polish budget was spent (the lip-sync lead and the seal
rule, both gates of their own), judged once more as Jfinal.

What the judges name on the final build, by frequency: the thinking glance (eyes shift while the head stays still);
the teeth and mouth interior changing between consecutive frames at 15 fps (each painted mouth renders its teeth a
little differently); the open mouth read as a dark void (Kimi); "static, add head / brow motion" (gpt-5.6-sol). The
last two pull against each other and against uncanny: more rigid motion of the painting (P3) brought "swimming" back.

## Why it fails (reading)

1. **Premium is the binding gate, not uncanny.** At its best lamp2 matches r8 on uncanny (J3 0/5) but never passes
   2.8 on premium; r8 sits at 3.2-3.6 in the same runs. The judges' reasons: limited articulation (painted mouths
   swap, they do not shape), a mostly still head (the budget this method can afford), and mouth interiors that do not
   match from key to key. A studio solves the last one with an artist painting every mouth on one model sheet; an image
   model repaints each from scratch, and the family trick (P1) only partly fixed it.
2. **Rigid motion of a painted head reads as swimming above ~1.2 degrees** (J2, J4). The method's motion budget is
   therefore smaller than what the premium judges want.
3. **n = 5 is noisy.** J3 and J3b scored the identical images 0/5 and 2/5. A 1/5 bar at n = 5 cannot separate a 10%
   from a 20% true rate; I report the pooled 2/10 and did not count J3 alone as a pass.

## What would have to change (for whoever picks this up; not done here)

- An artist-drawn mouth sheet (one model sheet, 8-10 mouths with identical teeth and interior), or painted mouths
  generated as ONE image (a sheet) so they share teeth; then re-judge. This is the strongest lead on both remaining
  complaints.
- A head turn from painted 3/4 keys cut-swapped (not dissolved; rj-p2d-whole-head-plate) would add the motion premium
  asks for without bending the painting; untested here.
- Reverse condition for the rejection: a painted-key build passes uncanny <= 1/5 AND premium >= r8's same-run score on
  two consecutive rounds of the same panel.

## Files

- `RESEARCH.md` (cited rules R1-R15), `RESULTS.md` (this), `integrate/APPLY.md` + `01-look-lamp2-held.patch`
  (the patch-request for stream 5: lamp2 keyed as a HELD look, stage wiring for the key rig).
- `scripts/character/puppet2d/lamp2/`: `rigspace.py`, `jobs.mjs` (+ `imgapi.mjs`, own ledger, USD 15 hard stop),
  `keys.py`, `pack.py`, `build-demo.mjs` + `demo/`, `capture.mjs`, `fps.mjs`, `judge-sheets.py`, `judge-round.sh`
  (lamp1's `judge-live.mjs` is used as is), `tally.py`, `restssim.{mjs,py}`, `battery.mjs`, `bilabial2.js`,
  `scene-log.py`, `frames-sheet.py`, `poster.mjs`.
- `src/face-puppet/rig-keys/` (`keyrig.ts`, `schedule.ts`, `index.ts`); `tests/r4-asha-rig2.test.mjs` (7 tests).
- Gates for code: `npx tsc -b` clean, `npx vite build` OK, face-puppet tests (`tests/avatar-*`, `tests/p2-face-*`,
  `tests/r4-asha-*`) 96/96 on this branch; the patch on stream 5's tree: tsc clean, 112/112. The full `npm test` in this
  container fails identically on the untouched base (1829 failed / 703 cancelled there; here the same set plus this
  branch's 7 new tests): `node --test tests/` runs the files in one process and a browser hook needs Playwright build 1243
  while the container ships 1194, so every later test fails its hook. Environment only; the same tests pass standalone.
- Context: `context/inbox/r4-asha-rig2.json` (rejection, 4 measurements, component, constraint, open).
