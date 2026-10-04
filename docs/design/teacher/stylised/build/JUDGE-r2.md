# JUDGE round 2: style C teacher, polish-r2

Date: 2026-10-04. Candidate: `art/character/stylised/polish-r2/teacher.glb` (24,583 tris, 82 shapes).
Evidence: `build/polish-r2/contact-sheet.webp`, `expressions-sheet.webp` and `thumb-compare.webp`, compared with
`concepts/c-front.webp` and `c-happy.webp`.

## Verdict

**Score: 2 / 5. Not ready. 3D is failing.**

Round 1 set a kill rule: one polish iteration on fixes 1-6 must reach 3+. This round did not; it moved from 2.0 to
2.0-2.25. By the rule in TECH-PLAN §10, the owner should now be told plainly that the 3D route is failing and that
the next step is the 2D puppet of the same character. I have not started the 2D puppet.

## What I saw by eye

**Thumbnail (128 px).** The candidate reads as the same character: centre-parted dark hair, bindi, thick brows,
winged liner, big brown eyes, teal kurta with orange piping and a low bun. It is passable next to c-front at this
size. At 128 px the gap is mostly the flat mouth and the missing nose.

**Full size.** It fails the bar clearly.

- **Mouth.** It is a painted-on pink stripe with no lip volume and no corner construction. In the happy expression
  and in aa/O/U, the teeth are floating white bars in a dark slot. `viseme_U` has the teeth corners poking through
  the lips. This is the single most "cheap game" feature.
- **Nose.** In the front view it has almost disappeared. In profile it is a small blob on a concave face, so the
  profile reads as a different, uglier person.
- **Skin surface.** It is lumpy and faceted, with diagonal dents on the cheeks and temples, uneven shading across the
  cheeks and streaks on the neck. It reads as flat orange plastic with no warm terminator, blush or sense of soft
  volume. c-front has smooth, convex apple cheeks.
- **Eyes.**
  - Too large relative to the face, and the irises bulge, which gives a fixed stare.
  - The lid wrap is crude: there are pinched creases at the outer corners and the lash flicks are sawtoothed.
  - The catchlight is good.
  - Closed lids in the blink read acceptably.
- **Hair.** At full size the front and 3/4 views read as a dark helmet, pinched at the parting with a seam at the
  crown. The back view is a near-shapeless dome. The grooves are muddy rather than the clean, broad sculpted locks
  in c-front. The loose locks are uniform black tubes.
- **Proportion.** The face is now wider and flatter than c-front, and the chin and jaw are soft and lumpy rather than
  a clean rounded taper.
- **What works.** Palette, identity cues, the catchlight, brow placement, the bun now reading from the front, the
  rig gates and the tri budget. The engineering is sound. What fails is the sculpt and surface craft.

## Independent Foundry opinion (blind)

The judge was DEPLOY_BRAIN (gpt-5.6-sol-2026-07-09). It was not told the image was ours; X was described only as "a 3D
render of an attempt at that character". Script: `scripts/character/stylised/judge/r2/judge_r2.py`. Raw replies:
`build/judge-r2-blind.json`.

| trial | same character | Memoji quality | uncanny or cheap | score |
|---|---|---|---|---|
| front @1024 + close-up | yes | no | yes | 2 |
| front @128 | yes | no | yes | 3 |
| happy @1024 vs c-happy | yes | no | yes | 2 |
| front @1024 (repeat) | yes | no | yes | 2 |

The mean is 2.25, from 4 trials with one judge family; this is not a full section-8 run. The builder's own
section-8 run scored 2.17 (n=18, GPT plus Grok). The defects the blind judge named match mine: a slit mouth with no
lips or corners, broken teeth in the happy expression, a staring and uneven eye seat, a barely modelled nose, lumpy
and asymmetric cheeks, helmet hair with a pinched part, jagged lashes, and a flat plastic finish.

## Why 3D is failing (my reading)

Silhouette and feature placement have converged on c-front, and the remaining defects are all surface craft. That
fits the builder's read: the parametric SDF-plus-conform pipeline seems to be at its ceiling. It produces dents,
facets and seams wherever primitives blend, and it cannot give the clean, low-frequency quad surface Memoji depends
on. More parameter tuning of this pipeline is unlikely to reach 4.

A 3D route could still succeed if the method changes: a hand-directed subdivision quad base mesh with proper edge
loops, built by script in Blender. But that is a new build, not a polish pass, and the owner's rule says to go to 2D
next.

## Prioritised actions

1. **Owner decision (blocking).** Report that 3D is failing and that the 2D puppet of character C is the next step
   under the standing rule. Do not run another SDF polish loop.
2. **Keep the reusable runtime contract and gates.** Keep the HeadRig seam, ARKit-52 + 15 visemes + 3 Hindi tongue
   keys, and the G1-G6 gates. The 2D puppet should drive the same names so the Director and lip-sync do not change.
3. **Fixes 3-12 apply only if the owner explicitly asks for one last 3D attempt.** Replace the SDF face with a
   scripted Blender subdivision base mesh: about 2.5k-quad cage, edge loops around the eyes and mouth, Catmull-Clark
   level 2 at export. Fit it to the c-front outline and the c-sheet profile.
4. **Mouth.** Model real lip volumes: a thin upper crescent, a fuller lower pillow and rounded corner pockets. Use one
   upper tooth row on a curved arch plus a tongue, with a soft-dark gradient mouth interior instead of flat black.
   Fix the teeth showing through in `viseme_U`.
5. **Nose.** A small button tip with soft nostril wings, about 6-8 mm proud in profile. Shade it with a terminator
   shadow under the tip so it reads from the front, as it does in c-front.
6. **Cheeks and jaw.** Smooth convex apple cheeks with no dents. Narrow the face about 6-8% so it tapers to a small
   rounded chin. The profile must be convex from brow to chin.
7. **Eyes.**
   - Reduce the eyeball scale about 8-10%.
   - Make the iris flat or concave under a separate glossy cornea, so it no longer bulges.
   - Wrap the lids as a thickness ring that follows the eyeball.
   - Remove the outer-corner creases.
   - Make the lash flick one smooth tapered shape, with no sawtooth.
8. **Hair.** Sculpt solid shapes:
   - Use 5-6 broad, rounded lock masses per side, with clean separations, and smooth the parting with no pinch.
   - Make the back a shaped mass that flows into the bun, not a dome.
   - Make the loose locks tapered ribbons with soft shading, not uniform tubes.
9. **Shader.** Add a soft warm terminator, a red-shifted wrap, faint cheek blush and gentle rim light. Add an AO lift
   under the chin and a matte-soft specular. Remove the streaks on the neck.
10. **Brows.** Keep the c-front thickness, but give them a rounded head and a tapered tail, with antialiased edges.
11. **Retest.** Re-run all gates (G1-G6, G-partial) and the section-8 judge at 128 px and 1024 px. The bar is a mean of
    at least 3.5, with "same character" passing 90% or more at both sizes.
12. **Budget.** Stay at or under 25k tris for H, 10-11k tris for B+, and 7 or fewer draw calls. Measure FPS on a
    Mali-G52-class phone before any score is called shippable.

## Spend and housekeeping

- **AWS.** This judge round used no GPU. The `scripts/gpu/status.py` ledger total is $1.953.
- **Live instance.** One live instance belongs to another workstream: `voice-v3-open-20261004-115139-533b`
  (g6.2xlarge spot, $0.54 so far, 180-minute self-termination cap). I left it alone.
- **Foundry.** 4 vision calls.
- **Disk.** 7.2 GB free.
- **Git.** Nothing committed.
