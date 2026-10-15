# lamp2 (painted keys) results, gate by gate

Date: 2026-10-10. Branch `claude/r4-asha-rig2`. One teacher, the grown-up Asha: face option 4 "Lamplight flat",
terracotta-rust open cardigan over a teal block-print kurta, from the approved Stage B rig front (`rig-b`).

**Verdict: lamp2 FAILS on premium. v3 passes uncanny in every round, but premium stays 0.2-0.8 below r8 in every run.
The time box is spent, the kill rule applies, and lamp2 stays a HELD look.** Two passes were made:
- **v2** (J1-Jfinal, polish P1-P3): uncanny 3, 2, 0, 2, 2, 2 /5; premium 2.4-2.8.
- **v3** (K1-K3, the main session's follow-up): one mouth model sheet, a breathing / shoulder life layer, rigid head
  translation and a glance lean. Uncanny **1, 1, 0 /5** (2/15 pooled, every round inside the bar). Premium **2.6, 2.8,
  2.8**, against r8's **3.4, 3.0, 3.2** in the same runs (bar: at least r8's same-run score).

The final build is v3 K3. Same person 5/5, childish 0/5, rest SSIM, pack size, fps, bilabials, the safety face and the
lip-sync median all pass. The lip-sync spread misses the >= 80% target: 67% of lines within +-50 ms on the original
estimator, 76% with its lag search limited to half a syllable. r8 stays the live face; nothing here flips a default.

Honesty notes:
- The judges are models (3 x gpt-5.6-sol + 2 x Kimi K2.6 per run), advisory, not people.
- Run-to-run noise at n = 5 is large: the SAME images scored uncanny 0/5 in J3 and 2/5 in J3b, and r8 itself scored
  0-1/5 uncanny and 3.0-3.6 premium.
- fps is headless Chromium, not a phone.
- No child has seen her.

## v3 (K1-K3), what changed and what it measured

| round | change | uncanny | moving photo | premium | r8 same run: uncanny / premium |
|---|---|---|---|---|---|
| K1 | (a) ONE mouth model sheet: ee, ltd, fv, oo repainted FROM the aa master (eh, oh already were), so all seven open mouths share aa's teeth and interior; (c) a new up-glance (both irises measured < 1 px apart); (b) breathing 0.0022 -> 0.005 (shoulders rise ~0.6 px, the head rides it); 30 ms crossfade | **1/5** | 1/5 | 2.6 | 0/5 / 3.4 |
| K2 | the mouth region fitted just outside the largest lips (the skin round them is the front's); more head TRANSLATION (nod 3.5 px, sway 3.5 px), roll still capped at 1.2 deg; a side glance wins over the up-glance | **1/5** | 3/5 | 2.8 | 1/5 / 3.0 |
| K3 | the body carries 40% of each nod (K2: "the jaw stretches" over a still neck); the figure leans toward a glance; a slow whole-figure drift (+-0.8 px) | **0/5** | 3/5 | 2.8 | 1/5 / 3.2 |

Tried and dropped in v3 (evidence kept):
- **A pixel transplant of one shared interior into every opening** (`scripts/character/puppet2d/lamp2/interior.py`):
  fine on the wide mouths, but jagged teeth and stray dark bits on the thin ones (ee, ltd, fv) and teeth inside oo.
  Repainting each mouth from the master key did the job instead.
- **Painted 3-degree head-turn keys** (b): the repaints moved and rescaled the whole head by ~40 px and redrew its
  features (two bindis in a 50% mix), so no swap or dissolve can hide the change (`evidence/v3-turnkeys-dissolve.webp`).
  The breathing / translation layer replaced them.
- **(d) a flat vector rig of the option-4 front**: an automatic flattening (mean-shift + Lab k-means, 16 and 28 colours)
  turns her soft painted planes into blotchy posterised patches, cheaper rather than more premium
  (`evidence/armD-flat-probe.webp`). A real flat vector rig needs hand-drawn art; it was not built or judged.

What K3's judges still name: "add natural head / upper-body motion" (3 of 5: the rig's motion is translation and a
1.2 deg roll, which reads as little), a "pop" when the eyes change direction while the head stays put, and mouth
shapes changing between consecutive frames. Premium is held down by the method's motion budget: every round that
added rigid motion of the painting raised "moving photo" (K2 and K3 3/5) or uncanny (J2, J4).

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
  every layer and key. 32 image calls, USD 7.09 (`ledger.json`).
- **Runtime** (`src/face-puppet/rig-keys/`): `KeyRig`, a Canvas 2D rig the unchanged `PuppetDriver` drives (it is a
  `RigLike`), plus the stage surface (R.dpr, view, stats, warm, dispose). Every layer is resampled once per canvas
  size; a frame is at most 7 blits. `schedule.ts` (pure, unit-tested): viseme -> painted mouth, 30 ms eased crossfade,
  70 ms minimum hold (a seal lands at once), our own blink schedule (four held cels, ~16-19 a minute, pulled to
  pauses), gaze as eye-key swaps with hysteresis, brows from the expression channels, rigid motion only (roll at most
  1.2 deg about the neck, sway and nod at most 3.5 native px shared with the body, a +-0.8 px drift, breath a ~0.6 px
  shoulder rise). Research behind the rules:
  `RESEARCH.md`.

## Gates (the final build, v3 K3)

| gate | bar | result | n, method | evidence |
|---|---|---|---|---|
| uncanny (blind) | at most 1/5 | **pass**: K3 0/5 (K1 1/5, K2 1/5; v3 pooled 2/15) | n = 5 per run, 3 gpt-5.6-sol + 2 Kimi K2.6, lamp1's `judge-live.mjs` prompt verbatim, desk window 375 x 405 at 412; r8 calibration in the SAME run each time | `evidence/judge-*.json`, `judge-tally.txt` |
| premium (blind) | at least r8's same-run score (3.6 in the brief) | **FAIL**: 2.8 vs r8 3.2 (K3); 2.8 vs 3.0 (K2); 2.6 vs 3.4 (K1) | as above | same |
| same person | at least 4/5 (5/5 in v3) | **pass**: 5/5 in every one of the 9 lamp2 runs | as above | same |
| childish | at most 1/5 (0/5 in v3) | **pass**: 0/5 in every lamp2 run | as above | same |
| moving photo (diagnostic) | (lamp1's bar, at most 1/5) | 3/5 (K3), 3/5 (K2), 1/5 (K1) | as above | same |
| rest SSIM vs the approved front | at least 0.97 | **pass**: head 0.989 | the live KeyRig rest frame (t = 0.5 s) in headless Chromium vs the graded front, native px, lamp1's SSIM (gaussian 1.5) | `evidence/rest-ssim.json` |
| key registration | SSIM outside each region at least 0.995 | **pass**: 1.0000 for all 17 keys; max abs difference outside 0/255 (by construction) | `keys.py` | `evidence/keys.json` |
| pack on the wire | at most 250 KB | **pass**: 129.2 KB (19 WebP + geom.json; WebP is the wire form); + poster 22 KB | `pack.py` | `art/character/puppet2d/lamp2/pack-report.json` |
| fps, 80 px speech row, 4x CPU throttle | at least 50 | **pass**: 59.9 fps (p95 16.8 ms, 600 frames / 10 s; 160 x 160 canvas at dpr 2). Desk 375 x 405 (750 x 810): 59.9 at 4x in this run (49.3 in v2's run; lamp1 10.5) | HEADLESS Chromium, CDP throttle, real-time scene loop; not a phone | `evidence/fps-row80.json`, `fps-desk412.json` |
| bilabials seal, 24-line battery | all (the brief: 9/9) | **pass**: 132/132 bilabial words with the lamp2 text rule (lamp1's rule 123/132, Azure's visemes alone 81/132 at v3's timing). The scene line: 11/11 (lamp1's 9 words + 2) | offline: the stored Diya battery (`evals/face-puppet/out/diya`), the product timing path (VisemeScheduler lead, resolveVisemes, weightsAt) into MouthKeys at 60 fps; sealed = the mbp key at >= 0.9 within [word - 80 ms, word end] | `evidence/battery-24.json`, `evidence/scene-412.json` |
| calm safety face | no smile while speaking, no nods | **pass**: the smile key never shows while speaking, max smile channel 0, the calm key at every closed-mouth moment, brows neutral; listening head pitch -1.7..-0.1 deg, nod -0.8..-0.3 px (normal scene: 8.7 deg, 3.2 px) | 412 capture with `calm=1`, 913 driver ticks | `evidence/scene-412-calm.json`, `clips/asha-412-calm.mp4` |
| lip-sync offset | median within -125..+45 ms (decisions E-P8); share within +-50 ms >= 80% (the main session's v3 target; the p2-face product path measured 89%) | **median pass, share FAIL**: key mouth minus the judged (forced-alignment) timing median +5 ms (IQR -15..+40), 67% of lines within +-50 ms. With the lag search limited to +-150 ms (the +-300 ms search locks five lines onto the neighbouring syllable): median +10 ms, 76% | E3 estimator (lipsync-offset.mjs), 21 lines with a CTC track, 35 ms key lead, 30 ms crossfade (a sweep of hold / fade / lead: best 67% / 76%) | `evidence/battery-24.json` |
| blinks | about 15-20 a minute, at pauses | long-run 16.0 / 18.7 per minute (quiet / speaking, 10 simulated minutes); the 15 s scene 6 blinks (23.7/min: two pulled to its phrase ends, one gaze-evoked) | `tests/r4-asha-rig2.test.mjs`, scene logs | same |

Clips (15.2 s, H.264 + her line, AAC): `clips/asha-360.mp4`, `asha-412.mp4`, `asha-1366.mp4`, `asha-412-calm.mp4`, every
app slot at once (lesson desk window, 80 px speech row, child home, onboarding meet, lesson summary; sizes from the
app audit as lamp1). Frame sheets: `evidence/frames-{360,412,1366,412-calm}.webp`. Demo: `art/character/puppet2d/lamp2/demo.html`
(self-contained; the same page renders the r8 pack through the shipped r8 runtime for calibration).

## v2: the judged rounds (kill rule: at most 3 polish rounds after the first judged clip)

| round | build | uncanny | moving photo | premium (mean) | r8 same run: uncanny / premium |
|---|---|---|---|---|---|
| J1 | first full build (60 ms fades, roll cap 2 deg) | 3/5 | 4/5 | 2.6 | 1/5 / 3.4 |
| J2 | P1: `eh`, `oh` repainted from `aa`, `ltd` from `ee` (one set of teeth per family); a parallel look-up glance; 45 ms fades | 2/5 | 2/5 | 2.8 | 0/5 / 3.0 |
| J3 | P2: brow regions widened + a low-passed boundary fill (no brow ghost); roll halved (cap 1.2 deg) | **0/5** | 1/5 | 2.6 | 0/5 / 3.6 |
| J4 | P3: a fuller `aa` interior, brow flashes at phrase onsets, roll cap 1.5 deg + a sway toward glances | 2/5 | 4/5 | 2.4 | 0/5 / 3.4 |
| J3b | P2 again, the IDENTICAL judge images (confirmation, no change) | 2/5 | 2/5 | 2.8 | 0/5 / 3.4 |
| Jfinal | the deliverable: P2 + the 35 ms key lead and the bilabial extension (timing only) | 2/5 | 2/5 | 2.8 | 1/5 / 3.2 |

P3 regressed ("proportions swim" again under the extra motion; "teeth a flat block") and was reverted. v2's
deliverable was P2 plus two timing-only fixes (the lip-sync lead and the seal rule), judged once more as Jfinal; v3
started from it.

What v2's judges named on its final build, by frequency: the thinking glance (eyes shift while the head stays still);
the teeth and mouth interior changing between consecutive frames at 15 fps (each painted mouth renders its teeth a
little differently); the open mouth read as a dark void (Kimi); "static, add head / brow motion" (gpt-5.6-sol). The
last two pull against each other and against uncanny: more rigid motion of the painting (P3) brought "swimming" back.

## Why it fails (reading, after v2 and v3)

1. **Premium is the binding gate, not uncanny.** v3 matches r8 on uncanny (1, 1, 0 /5) but never passes 2.8 on
   premium; r8 sits at 3.0-3.6 in the same runs. The judges' reasons: limited articulation (painted mouths
   swap, they do not shape), a mostly still head (the budget this method can afford), and mouth interiors that do not
   match from key to key. A studio solves the last one with an artist painting every mouth on one model sheet; an image
   model repaints each from scratch, and the family trick (P1) only partly fixed it.
2. **Rigid motion of a painted head reads as swimming above ~1.2 degrees** (J2, J4). The method's motion budget is
   therefore smaller than what the premium judges want.
3. **n = 5 is noisy.** J3 and J3b scored the identical images 0/5 and 2/5. A 1/5 bar at n = 5 cannot separate a 10%
   from a 20% true rate; I report the pooled 2/10 and did not count J3 alone as a pass.

## What would have to change (for whoever picks this up; not done here)

- Head motion is the premium gap now, and image-model turn keys cannot deliver it (v3: a "3 degree" repaint is a
  different painting). An artist-made head turn (2-3 keys drawn on one model sheet, cut-swapped on a blink), or a 3D or
  2.5D head built for the option-4 look, is the next method to try, not another polish of this rig.
- An artist-drawn mouth sheet would remove the last mouth complaints; v3's master-key family only partly does.
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
- v3 probes: `scripts/character/puppet2d/lamp2/interior.py` (the dropped pixel transplant),
  `scripts/character/puppet2d/lamp3/flatbase.py` (the arm-D flattening probe).
- Image spend: 32 calls, USD 7.09 in all (v3: 7 calls, USD 1.55).
- Gates for code: `npx tsc -b` clean, `npx vite build` OK, face-puppet tests (`tests/avatar-*`, `tests/p2-face-*`,
  `tests/r4-asha-*`) 96/96 on this branch; the patch on stream 5's tree: tsc clean, 112/112. The full `npm test` in this
  container fails identically on the untouched base (1829 failed / 703 cancelled there; here the same set plus this
  branch's 7 new tests): `node --test tests/` runs the files in one process and a browser hook needs Playwright build 1243
  while the container ships 1194, so every later test fails its hook. Environment only; the same tests pass standalone.
- Context: `context/inbox/r4-asha-rig2.json` (rejection, 4 measurements, component, constraint, open).
