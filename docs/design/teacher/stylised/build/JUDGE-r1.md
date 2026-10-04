# Judge round 1: Style C, Arm A vs Arm B

Date: 2026-10-04. Judge: art-director pass by eye, plus one blind Foundry vision opinion.

## Verdict

| | Arm A (procedural Blender) | Arm B (Hunyuan3D-2mv sculpt + our skin) |
|---|---|---|
| My score (1-5) | **2.0** | **1.5** |
| Foundry judge score, 4 trials | 2, 3, 2, 2 (mean 2.25) | 2, 2, 2, 2 (mean 2.0) |
| Foundry forced choice: closer to c-front | **4/4 trials** | 0/4 |
| Items 1-3 (same character / Memoji register / not uncanny) | 1: 0/4, 2: 2/4, 3: 1/4 | 1: 0/4, 2: 0/4, 3: 0/4 |
| Ready to ship | no | no |

- **Winner: A.** Its base is `art/character/stylised/armA/teacher.glb`.
- A few named parts are ported from B. These are engineering parts, not looks; see fixes 11 and 12.
- **Not ready.** The best score is 2, against a bar of 4.
- **Is the 3D route failing?** Not yet, by the plan's own rule: the polish loop L1-L3 has not run and the owner has not seen a sheet. But the gap is large.
  - A is "recognisable, not shippable": it shows the right design but has the wrong surfaces.
  - If one full polish iteration on fixes 1-6 does not reach 3+ from both me and the judge, say plainly to the owner that 3D is failing. Then move to the 2D puppet.

## What I see, by eye (c-front vs renders, at thumbnail and full size)

**Arm A.**
- At thumbnail it reads as the right design: centre parting, bindi, brows, liner wing, catchlight, teal and orange, studs, low bun.
- At full size it reads as a balloon-faced mannequin, not Memoji:
  - The cheeks are wide and flat, and there are no apple-cheek volumes. The face does not taper to the concept's small rounded chin.
  - The nose is a long ridge that runs down from the brow, not a soft button.
  - The mouth is a small pursed bar with almost no smile. The concept's warmth is entirely in its smile and cheeks, and both are missing.
  - There are dents and creases around the eye rings, which give her a tired, aged look under the eyes.
  - The hair is a tall, regular-ridged helmet. It reads almost like a turban, and the back has a V seam.
  - The neck is long and thin, with dark shading under the chin. The judge flagged the neck in 4/4 trials.
- Expressions: blink and surprised read. Happy is weak because the smile is too small. Thinking reads only through the eyes.
- Visemes: clean, apart from a dark notch at the centre of the upper teeth in TH/CH/O/U.

**Arm B.** It fails harder.
- The hairline is crusty and wavy, with dark sculpt debris around the ears.
- The face is long and realistic, and the head is small on a long neck.
- The mouth is a flat, slack, slightly open line.
- The eyes have a glassy stare. The judge called them "dead, glassy doll eyes", "uncanny" and "cheap game" in 4/4 trials.
- B does have slightly better cheek and nose volume in the 3/4 view. Even so, its face is the wrong shape, so it is not a good prior. Use c-front and c-sheet directly.

**The Foundry judge agrees** on every major point:
- A: neck, pinched mouth, helmet hair, nose bridge, under-eye creases.
- B: dead eyes, crude edges, waxy skin, long face.

## Judge method and caveats

- Script: `scripts/character/stylised/judge/judge.py` and `prompt.txt`. Raw replies: `judge-r1.json`.
- Model: `DEPLOY_BRAIN` (gpt-5.6-sol).
- Stimuli: REF = c-front, plus X/Y = the front renders of each arm, cropped from the contact sheets. They were shown at 1024 px and 128 px, with the order swapped across 4 trials. The model was not told which image came from which arm, or that either was ours.
- It used a subset of the §8.2 rubric items (1-9, 12, 16), plus a 1-5 score and a forced choice.
- **Not a full §8 run.** It used one judge family, not two. The sanity battery was not run. Only front-neutral stimuli were used: no smile, 3/4 or expression pairs. The renders are Cycles, not three.js.
- Treat it as advisory. It agrees with my eye, which is the actual gate.

## Prioritised fix list for the builder (base: Arm A)

1. **Cheeks and lower face.**
   - Add two apple-cheek volumes in `sdf.py`/`params.json`: soft ellipsoids under the outer third of each eye, pushed forward about 4-6 mm.
   - Narrow the jaw below them so the face tapers to a small, rounded, slightly receding chin. Raise the chin so the face is shorter.
   - Fit to the c-front outline AND the c-sheet profile. Profile check: forehead, then a soft nose bump, then full cheeks, then a small chin.
2. **Nose.**
   - Remove the bridge ridge between the eyes. The bridge must fade to nothing above the lower lid line.
   - The nose becomes a small ball tip with barely-there alae, and its shading should come from the tip only.
   - Reduce how far it sticks out in profile.
3. **Resting smile and lips.**
   - Bake a resting smile into the neutral base mesh, not into a morph default. The corners go up and out and the cheek is pushed up. Aim for the c-front smile curvature.
   - Width: about the distance between the pupils.
   - Upper lip: a thin soft crescent. Lower lip: a fuller pillow with a soft shadow crease under it.
   - No pucker and no flat bar. Re-check that the visemes still mix correctly on the new base.
4. **Eye surrounds.**
   - Relax the inset ring transition and lower its offset until there are no dents or creases under or around the eyes. The under-eye should be one smooth convex surface.
   - Widen the gap between the eyes slightly.
   - Make the upper liner thicker with a crisp outer flick. Keep the lower liner minimal.
5. **Neck and bust.**
   - Shorten the neck by about 30-35% and thicken it to about 0.45 times the face width.
   - Widen and lower the shoulders to the c-front proportions, and bring the kurta neckline up to the concept.
   - Remove the dark under-chin band with a fill/AO lift in the shader.
6. **Hair.**
   - Lower the crown by about 10% and pull the side volume in, so it hugs the skull as in c-front.
   - Use 5-7 broad, soft, rounded grooves per side, sweeping from the parting back to the bun. No regular ridges.
   - Close the back V seam. The hairline should be one smooth curve over the temples.
7. **Brows.** Make them fatter pill shapes with a rounded head and a softly tapered tail, at the c-front thickness. The judge called them "thin, angular strips" in 2/4 trials.
8. **Eye life.**
   - Make the iris larger in the opening (about 60% of the aperture height) and show less sclera.
   - Let the upper lid rest slightly over the top of the iris, to remove the stare.
   - Keep one strong catchlight on the cornea through the view-space shader, not a render-only disc.
9. **Skin shader.**
   - Build TaxilaToon (S3) in three.js: warm wrap/terminator softening, a gentle rim, faint cheek blush and no grey muddiness around the eyes and mouth.
   - From the next round on, render all judge evidence in three.js, not Cycles.
10. **Artefacts.**
    - Remove the dark notch at the centre of the upper teeth (in the TH/CH/O/U visemes).
    - Close the leak at jaw 0.3 + close 0.3 (1.5%, bar 0).
    - Re-run the gates after fixes 1-4, because they move every ring.
11. **Port from B:**
    - the G-partial lid push, so the iris never shows through the lid at half blink;
    - the B+ LOD export (target 10-11k tris);
    - the KTX2 + quantize finish;
    - the shoulder bones.
12. **Next judge round (r2) must be a real §8 run:**
    - 6 stimuli: neutral, smile (vs c-happy), aa, listening, thinking, 3/4;
    - 128 and 1024 px;
    - two judge families, after the sanity battery passes;
    - then the owner sheet.
    - Pass to the owner only if my eye says 3.5+ and items 1-3 pass at 90% or more.

## GPU / spend

- This judging step used no GPU; only Foundry tokens.
- `scripts/gpu/status.py`: 0 live instances. The ledger total for the workflow is about $1.95.
