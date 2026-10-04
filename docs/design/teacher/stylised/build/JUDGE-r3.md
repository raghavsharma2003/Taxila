# Judge round 3: style-C stylised teacher

Date: 2026-10-04. Judge: harsh art director (main-loop judge agent). This round had one candidate, so there is no A/B.

## Verdict

**Winner: A (the only candidate). Score: 2/5. Not ready. The 3D route is failing.**

Base of record stays `art/character/stylised/polish-r2/teacher.glb`.

Under the round-1 kill rule (TECH-PLAN section 10), the owner needs to hear this plainly: the SDF-built 3D teacher does not meet the bar after the polish loop. The fallback the owner already named is a high-quality 2D puppet of the same character C, and that is now the default next step. It has **not** been started. That is the owner's call.

## What was judged

Polish round 3 produced **no new asset**. The builder stopped correctly because the round-2 fix list made the halt its blocking item. So this round re-judges the round-2 renders:

- `docs/design/teacher/stylised/build/polish-r2/contact-sheet.webp`
- `docs/design/teacher/stylised/build/polish-r2/expressions-sheet.webp`
- `docs/design/teacher/stylised/build/polish-r2/thumb-compare.webp`

These were compared with `concepts/c-front.webp` and the c-happy panel, at thumbnail and full size.

## My own eye

- **128 px:** it reads as the same character. The cues are all there: centre-parted dark hair, bindi, thick brows, winged liner, catchlight, teal kurta with orange piping, and a low bun.
- **Full size:** it is clearly "cheap game". The problems, roughly in order of how much they hurt:
  1. **Mouth.** A painted pink stripe with no lip volume. In happy, aa, O and U the teeth are floating white bars. In U the tooth corners poke out through the lips.
  2. **Nose.** Almost gone from the front. In profile it is a lump on a concave face. c-front has a clear button nose with a shadow under it.
  3. **Skin surface.** Lumpy and faceted, with dents under and beside the eyes and on the cheeks and temples. Flat orange plastic, with no warm terminator and no blush.
  4. **Eyes.** Too big and bulging, which gives a startled stare. The outer-corner lids are pinched and the lash flick is jagged.
  5. **Hair.** A helmet with a pinched part and a crown seam. The back is a shapeless dome, the bun is a lumpy ball, and the loose locks are uniform tubes.
  6. **Proportion.** The face is too wide and flat through the cheeks and jaw. c-front tapers to a small rounded chin.
- **What works:** the palette, the identity cues, the catchlights, the tri budget (24,583 tris for H), and the 82 shapes present.

## Independent blind opinion (Foundry)

- **Setup:** `DEPLOY_BRAIN`, served as gpt-5.6-sol-2026-07-09. The prompt described X only as "a 3D render of an attempt" and did not say where it came from. This was a fresh replicate with a different view mix from round 2.
- **Script:** `scripts/character/stylised/judge/r3/judge_r3.py`.
- **Raw replies:** `docs/design/teacher/stylised/build/judge-r3-blind.json`.

| trial | same character | Memoji quality | uncanny/cheap | score |
|---|---|---|---|---|
| front + 3/4 @1024 | yes | no | yes | 2 |
| front @128 | yes | no | yes | 3 |

Its named defects match mine: a faceted, seamed helmet of hair with a broken part; oversized doll-stare eyes; an under-sculpted nose, lips and cheeks ("melted and generic"); dirty patches under the eyes; a head too wide and squat; and a crude bun.

**How the scores add up across rounds.** Round 2's blind run scored 2, 3, 2 and 2 (n=4). This round adds 2 and 3, so the blind mean is 2.33 (n=6, one judge family). The builder's own section-8 run scored 2.17 (n=18, two families). Every blind trial said "same character: yes" and also "Memoji: no" and "uncanny/cheap: yes".

**Caveat.** This is one judge family and two new trials on an unchanged asset. It replicates round 2; it is not new evidence about a new build.

## Why

Silhouette and identity have converged. What is left is surface craft: lip volume, nose form, smooth convex planes, eye seating and hair masses.

The parametric SDF-plus-conform method causes exactly those defects, because blended primitives leave dents, facets and seams. Two polish rounds did not move the score above about 2.2. More tuning of the same method is very unlikely to reach 4.

## Prioritised fixes

1. **Owner decision, blocking.** 3D is failing. Default next step: the 2D puppet of character C. Do not run another SDF polish loop.
2. **Carry over into 2D unchanged:** the HeadRig seam, the ARKit-52 + 15 visemes + 3 Hindi tongue keys name contract, flag `face.rig`, and gates G1-G6 and G-partial.
3. **Only if the owner explicitly asks for one last 3D attempt,** change the method. Build a scripted Blender subdivision cage of about 2.5k quads, with edge loops around the eyes and mouth and Catmull-Clark level 2 at export. Fit it to the c-front outline and the c-sheet profile, narrow the face by 6-8%, and keep a convex profile from brow to chin.
4. **Mouth (3D retry).** Real lip volume: a thin upper crescent, a fuller lower pillow and corner pockets. One curved upper tooth row plus a tongue, and a soft dark gradient inside the mouth. No tooth may poke through in any viseme.
5. **Nose (3D retry).** A button tip with soft alae, 6-8 mm proud in profile, with a terminator shadow under the tip.
6. **Eyes (3D retry).** Eyeball 8-10% smaller. A flat or concave iris under a separate glossy cornea. A lid thickness ring that wraps the eyeball. One smooth tapered lash flick.
7. **Hair (3D retry).** 5-6 broad sculpted lock masses per side, a clean parting, a back that flows into a rounded bun, and tapered ribbon loose locks.
8. **Shader (3D retry).** Warm, red-shifted wrap terminator, faint cheek blush, gentle rim, matte-soft specular, AO lifted under the chin, and no neck streaks.
9. **Brows (3D retry).** Match c-front thickness: rounded head, tapered tail, anti-aliased edges.
10. **Gates (either route).** Run the full section-8 judge at 128 and 1024 px. Pass requires a mean of at least 3.5 and "same character" in at least 90% of trials at both sizes. Pairwise against c-front.
11. **Budget (3D).** Tier H at or under 25k tris, B+ at 10-11k tris, at most 7 draw calls. Measure fps on a real Mali-G52-class phone before calling anything shippable.
12. **Logging.** Merge `context/inbox/stylised-polish-r3-halt.json` and record the 6-trial blind replicate (mean 2.33) as a measurement.

## Spend and housekeeping

- **GPU:** none used this round. The ledger total is unchanged at $1.953.
- **Live instance:** one, `i-0ae8a44d0fd704042` (run `voice-v3-open-20261004-115139-533b`, about $0.58 so far, 180-minute self-termination cap). It belongs to the voice workstream, so I left it alone.
- **Foundry:** 2 vision calls.
- **Disk:** 7.2 GB free.
- Nothing is committed.
