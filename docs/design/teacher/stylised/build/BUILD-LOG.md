# Style C teacher: build log

Plan: `TECH-PLAN.md`. Judge rounds: `JUDGE-r1.md` to `JUDGE-r4.md`. Arm write-ups: `armA/README.md`,
`polish-r2/README.md`. Proposed graph entries: `context/inbox/stylised-teacher-build.json` (merge after
`stylised-polish-r4-halt.json`).

## Context log, 2026-10-04

**Bottom line.** The in-house 3D build of style C does not meet the owner's bar. At 128 px it reads as the same
character. At full size it looks like a cheap game. The score stayed at about 2.0-2.3 out of 5 for four judge rounds.
The default next step is the 2D puppet of the same character. It has not been started, and starting it is the owner's
decision.

### Decisions

- **`stylised-c-owner-directive`.** The owner's directive of 2026-10-04 has five parts:
  - The teacher is concept C, a Memoji/Bitmoji-style 3D cartoon human (`concepts/c-*.webp`).
  - She is built in-house: no artist, no outsourcing, and no bought characters or paid assets.
  - The build can use AWS GPU (capped at USD 150 for this workflow), Foundry for reference images and judging, and
    open-source models whose licences allow commercial use.
  - 3D comes first. If 3D fails the bar after the polish loop, the fallback is a high-quality 2D puppet of the same
    character, on the same rig contract.
  - The bar: next to c-front at thumbnail and at full size, a person says "same character, rendered in 3D,
    Memoji-quality".

  It supersedes these earlier entries:
  - `teacher-stylised-face-commissioned` (commission an artist);
  - `character-built-in-house` (no contracted artist, building from MakeHuman/MPFB base meshes);
  - the realistic-face line: `teacher-human-first-gpu`, `teacher-bakeoff-verdict` and `gnm-adopted-identity-base`;
  - `teacher-polished-verdict` (a purchased base);
  - `teacher-stylised-3d-glb` (a blend of concepts b and c);
  - `open-stylised-panel` (a panel before choosing the look).

  It would be reversed if the owner names a different concept, accepts a commissioned or bought asset, or also
  rejects the 2D puppet of C. In that last case the look itself is reopened, not just the build route.

- **`stylised-c-two-arm-method`.** We made 19 reference images by editing c-front. c-front is the authority; the side
  views are only soft guides. Two arms ran:
  - **Arm A:** a procedural Blender script builds an SDF head from rounded forms. Our own quad mesh, with named rings
    around the eyes and mouth, is fitted to it using about 60 shape settings.
  - **Arm B:** Hunyuan3D sculpts, run on AWS, are used only as a shape target. Our own template mesh is wrapped onto
    them.

  In both arms every shipped vertex comes from our own mesh. The 82 shape keys are made by posing a rig and baking each
  pose. The kill rule is TECH-PLAN §10. This method would be replaced by any method that reaches the bar faster.

- **`stylised-c-arm-a-wins`.**
  - Round 1 picked Arm A. It scored 2.0 by eye against Arm B's 1.5, and the vision model chose A as closer to c-front
    in 4 of 4 trials.
  - The lid push-out and the product-rule correctives were ported from Arm B.
  - The base of record is `art/character/stylised/polish-r2/teacher.glb`.
  - This would be reversed by a new build of either arm that beats polish-r2 on a section-8 run.

- **`stylised-c-3d-failing-verdict`.** After 4 rounds, 3D fails the bar.
  - At full size: the mouth is a flat painted stripe and the teeth are slabs (they poke through the lips in
    viseme_U), the nose has vanished, the skin is faceted, the eyes stare, the hair is a helmet with a seam, the face is
    too wide, and the neckline piping is doubled.
  - No more SDF polish rounds will run. A 3D retry happens only if the owner asks for one, and it must change method to
    a scripted subdivision cage of about 2.5k quads.
  - This would be reversed if the owner, looking at `polish-r2/owner-sheet.webp`, accepts the result. It would also be
    reversed if a cage retry scores a mean of at least 3.5, with "same character" in at least 90% of trials at both
    sizes, on two judge families.

### Measurements

All are dated 2026-10-04. Each judge round used one art-director judge plus one vision model (Foundry `DEPLOY_BRAIN`,
gpt-5.6-sol, blind to which arm made each image). All evidence renders are Blender Cycles, not the three.js runtime.

- **`meas-stylised-c-refs-2026-10-04`.**
  - All 19 Foundry gpt-image-2 edit calls succeeded, one image per view. By eye, the identity holds in all 19.
  - Defects: the bun drifts between views, the skull depth differs between the two profiles, the F/V mouth is weak,
    the T/L mouth shows no tongue, and the "top" view came out as a head tilted down.

| round | asset | judge (eye) | vision model | notes |
|---|---|---|---|---|
| r1 `meas-stylised-c-judge-r1` | Arm A / Arm B | A 2.0 / B 1.5 | A 2,3,2,2 (2.25) / B 2,2,2,2 (2.0), n=4 | forced choice A 4/4 |
| r2 `meas-stylised-c-judge-r2` | polish-r2 | 2 | 2,3,2,2 (2.25), n=4 | builder's section-8 run: 2.17 (n=18; GPT 2.42, Grok 1.67); same character 17%, Memoji register 28%, not uncanny 0% |
| r3 `meas-stylised-c-judge-r3` | unchanged (halt) | 2 | 2,3 (2.5), n=2 | replicate |
| r4 `meas-stylised-c-judge-r4` | unchanged (halt) | 2 | 2, n=1 | blind tally n=7: mean 2.29, same character 7/7, Memoji quality 0/7 |

The r4 tally supersedes the n=6 figure in `meas-stylised-polish-r2-blind-replicate`.

- **`meas-stylised-c-budget-2026-10-04`.**
  - Tier H: Arm A 24,512 tris; Arm B 23,499 tris; polish-r2 24,583 tris across 7 meshes, 1.31 MB. All are under the
    25k cap.
  - Tier B+: Arm B 13,203 tris, over the 10-11k target; polish-r2 10,604 tris.
  - FPS on a Mali-G52-class phone was **not measured**.

- **`meas-stylised-c-gates-2026-10-04`.**
  - Arm A: mirror error 0.0 mm. At blink, 0% of rays reach the eyeball. At rest and on PP, 0% of rays reach the mouth
    interior. At jaw 0.3 plus close 0.3, 1.5% of rays get through, against a bar of 0. This item is still open.
  - Arm B: lip gaps of 0.24, 1.56 and 2.0 mm (rest, PP, and jaw 0.3 plus close 0.3). G4 was not run.

- **`meas-stylised-c-spend-2026-10-04`.**
  - AWS: one job, `stylised3d-20261004-074736-d124` (g6.2xlarge spot, 57 min), cost USD 0.92 against the USD 150 cap.
  - Everything else used no GPU.
  - The status.py ledger shows USD 1.953 in total, which includes the earlier face3d runs.
  - At the end, no stylised instance was running. One voice-workstream instance was live under its own 180-minute
    self-termination cap.

### Rejections

- **`rj-stylised-c-arm-b-sculpt-target`.** Arm B lost because the sculpt brings in realistic proportions.
  - The sculpt gave a long face, a small chin, a long nose bridge and a slack mouth.
  - It also gave a crusty hairline with sculpt debris around the ears, smooth hair with no grooves, and glassy doll
    eyes.
  - The shape target fights the stylisation instead of supplying it.

- **`rj-stylised-c-sdf-surface-ceiling`.** The SDF-blend head reaches the right identity and silhouette but tops out
  at about 2.2 on surface craft.
  - The outlines fit within about 3 mm. The surfaces between the fitted outlines are not controlled: the cheek planes,
    nose, lips and mouth profile.
  - It adds new evidence for `rj-agent-authored-stylised-face`.
  - Do not run another SDF polish loop.

- **`rj-stylised-c-arm-a-traps`.**
  1. Sphere tracing does not converge on this SDF; use a fixed step plus bisection.
  2. Ring patches need angle-matched, monotone parameters, or the rings fold.
  3. Cycles needs light linking for the cornea catchlight, and the world must render black for glossy rays.
  4. mouthClose must carry the lower-lip part of the jawOpen move, or about 26% of rays leak.
  5. A hard sign(x) breaks the mirror at midline vertices that sit at x = -0.0.

- **`rj-stylised-c-arm-b-traps`.**
  1. Single-view Hunyuan3D-2.1 puts the bun on one side of the head. 2mv, with four views, places it correctly.
  2. Linear lid morphs cut through the eyeball at half weight unless the closed lid is pushed outward.
