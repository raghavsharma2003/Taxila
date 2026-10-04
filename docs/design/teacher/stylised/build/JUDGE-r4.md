# Judge round 4: stylised teacher (concept C)

**Verdict: winner A (the only candidate), score 2/5, not ready.** 3D is failing the owner's bar. The default next step is the 2D puppet of character C, and that is the owner's call. It has not been started.

## Candidate

- GLB: `art/character/stylised/polish-r2/teacher.glb`. This is still the base of record: 24,583 tris for tier H, with 82 shapes.
- Renders: `build/polish-r2/contact-sheet.webp` and `build/polish-r2/expressions-sheet.webp`.
- Polish round 4 produced no new asset. The builder stopped correctly on the blocking item from round 3. This is the second unchanged round in a row.

## My own eye (at 128 px and full size, against c-front and c-happy)

- **Thumbnail:** it reads as the same character. The identity cues are all there: centre part, bindi, thick brows, liner and catchlight, gold studs, low bun, loose locks, and the teal kurta with orange piping.
- **Full size: it looks like a "cheap game".** Nothing has changed since round 3:
  - **Mouth:** a flat pink stripe with no lip volume.
  - **Teeth:** floating white slabs, and they break through the lips in viseme_U.
  - **Happy expression:** a boxy opening with pinched corners, and the cheeks do not lift.
  - **Nose:** close to invisible from the front.
  - **Skin:** faceted and lumpy, with dents under the eyes and flat orange plastic shading.
  - **Eyes:** oversized and staring, with pinched outer lids and jagged lashes.
  - **Hair:** a helmet with a crown seam, a domed back and a lumpy bun.
  - **Face:** too wide.
  - **Kurta neckline:** doubled vertical piping, where c-front has a single clean split.
- **What holds:** the palette, the identity cues and the runtime budget.

## Independent blind opinion

I made one call to DEPLOY_BRAIN (gpt-5.6-sol-2026-07-09) on 2026-10-04.
- **Inputs:** REF front and REF happy (c-front, c-happy), plus the X front and X happy renders, all at 1024 px.
- **Blinding:** X was described only as "a 3D render of an attempt".
- **Result:** same character **yes**, Memoji quality **no**, uncanny or cheap **yes**, score **2**.
- **Defects it named:**
  - The face is flat and broad, with no soft oval and no cheek or muzzle volume.
  - The eyes give a lifeless doll stare, with lids that do not wrap and harsh liner.
  - The happy mouth is boxy, with pinched corners, slab teeth and no cheek lift.
  - The hair is lumpy, with a crown seam and an angular hairline.
  - The neckline piping is wrong (floating and doubled).
- **Raw reply:** `build/judge-r4-blind.json`.
- **Script:** `scripts/character/stylised/judge/r4/judge_r4.py`.

**Running blind tally:** n=7 trials across rounds 2-4, all from one judge family. Same character 7/7, Memoji quality 0/7, mean score 2.29.

**Caveat:** this is a replicate on an unchanged asset. It adds no evidence about any new build. It adds one new axis, expression craft on happy versus c-happy, and that axis also fails.

## Why it is failing

Identity and silhouette have converged. What remains is surface craft, and the SDF-blend method tops out at about 2.2. More polish rounds on this method are wasted spend.

## Fix list (prioritised)

1. **Owner decision (blocking).** Tell the owner plainly that 3D has failed. The score has stayed at about 2.2-2.3 across 3 judged rounds. Under the TECH-PLAN section 10 kill rule, the default is the high-quality 2D puppet of character C. Do not run another SDF polish loop. Do not re-judge the unchanged asset again; round 5 would be pure waste.
2. **Carry these into 2D unchanged:** the HeadRig seam, the name contract (ARKit-52 + 15 visemes + 3 Hindi tongue keys), the `face.rig` flag, and gates G1-G6 and G-partial. The Director and lip-sync code then stay as they are.
3. **Only if the owner explicitly asks for one last 3D attempt, change the method.**
   - Build a scripted Blender subdivision cage of about 2.5k quads, with edge loops around the eyes and mouth, and apply Catmull-Clark level 2 at export.
   - Fit it to the c-front outline and the c-sheet profile.
   - Narrow the face by 6-8%, give it a soft oval with cheek and muzzle volume, and keep the profile convex from brow to chin.
4. **Mouth (3D retry).**
   - Give the lips real volume: a thin upper crescent, a fuller lower pillow and corner pockets.
   - Use one curved upper tooth row, a tongue and a soft dark gradient inside the mouth.
   - No tooth may poke through in any viseme (viseme_U does today).
   - The happy smile needs a smooth arc, cheek lift and nasolabial compression, not a boxy opening.
5. **Nose (3D retry).** A button tip with soft alae, standing 6-8 mm proud in profile, with a terminator shadow under the tip so it reads from the front.
6. **Eyes (3D retry).**
   - Shrink the eyeball by 8-10%.
   - Put a flat or concave iris under a separate glossy cornea.
   - Add a lid thickness ring that wraps the eyeball.
   - Remove the outer-corner pinch, and make the lash flick one smooth tapered shape.
7. **Hair (3D retry).**
   - Use 5-6 broad sculpted lock masses per side.
   - Make a clean parting with no crown seam, and soften the hairline.
   - The back should flow into a rounded bun, not a dome.
   - The loose locks should be tapered ribbons.
8. **Shader (3D retry).**
   - A warm, red-shifted wrap terminator, a faint cheek blush, a gentle rim and a matte-soft specular.
   - Lift the AO under the chin, and remove the neck streaks and the dirty patches under the eyes.
9. **Brows and costume (3D retry).**
   - Brows: match the c-front thickness, with a rounded head, a tapered tail and anti-aliased edges.
   - Kurta neckline: a single orange-edged split that matches c-front, with no doubled or floating piping.
10. **Gates (either route).**
    - Run the full section-8 judge at 128 px and 1024 px, pairwise against c-front, plus expression pairs against c-happy, c-talking, c-listening and c-thinking.
    - To pass, the mean must be at least 3.5 and "same character" must pass in at least 90% of trials at both sizes.
    - Add a second judge family to the panel, so the result is not a single-family measurement.
11. **Budget (3D).**
    - Tier H at or under 25k tris, B+ at 10-11k tris, at most 7 draw calls.
    - Measure fps on a real Mali-G52-class phone before calling anything shippable.
12. **Logging.**
    - Merge `context/inbox/stylised-polish-r4-halt.json`; it replaces the round-3 halt.
    - Record the blind replicate measurement: DEPLOY_BRAIN, n=7 across rounds 2-4, mean 2.29, same character 7/7, Memoji quality 0/7, dated 2026-10-04, method as in this file.

## Spend and housekeeping

- **GPU:** none used this round. The AWS ledger is unchanged at $1.953.
- **Foundry:** 1 call this round.
- **Live instance:** `scripts/gpu/status.py` shows one live instance, i-0ae8a44d0fd704042. It belongs to the voice workstream and was 39 min into its 180-min self-termination cap. It is not this workstream's, so I left it alone.
- **Disk:** 7.2 GB free.
- **Git:** nothing is committed.
