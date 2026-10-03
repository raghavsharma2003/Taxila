# Teacher face bake-off: verdict (art director, 2026-10-03)

**Decision: a combination.** The face becomes **ai-portrait-wrap's identity** (the reference-fitted head shape and the
projected, de-lit skin) built on **procedural-v3's** expression system, hair and garments. **stylised-premium is
rejected as a direction.** Two parts of it carry over: re-scoring the presets on each new face, and its added gate
checks. Nothing ships yet. This combined build has not been made, and nothing here measures it.

Evidence sheet: `docs/design/teacher/bakeoff/COMPARE.png` has one row for the baseline and one per approach. Each row
shows the same 9 emotions at H, the 3/4 turn and the B+ tier. Under each emotion is its blind-judge score out of 6, red
below the 70% bar. Built by `python3 scripts/character/bakeoff/verdict/compare.py` from each approach's own renders: same renderer, same stage light,
teal only.

## What I looked at

- Each approach's `renders/teal/contact.png`, next to `docs/design/teacher/renders/teal/contact.png`. Each sheet has
  the turntable, 9 emotions, 7 states, 15 visemes plus the tongue keys, the tiers and the lip-sync strip from the same TTS
  sentence.
- The single emotion PNGs at full resolution: ai-portrait-wrap warm, v3 and stylised delighted, ai-portrait-wrap yaw000.
- Every `emotion-check*.json` (per-emotion confusions), every `measure*.json`, the three bake-off docs and
  `art/character/LICENSES.md`.

## Scores (1 = 2012 game NPC, 5 = ship it; my eye unless marked [M])

| criterion | baseline it.2 | procedural-v3 | ai-portrait-wrap | stylised-premium |
|---|---|---|---|---|
| wow factor, visual quality | 1 | 2 | **3.5** | 1.5 |
| appeal, warmth (teacher register) | 1.5 | 2.5 | **3.5** | 2 |
| emotion legibility, vision judge [M] | 43% (same-day re-run; 37% originally) | **85%** (8/9 pass) | 57% (5/9) | **86% pooled, n=12** (8/9) |
| emotion legibility, my eye | 1 | 3.5 | 2.5 | 3 (two poses cheat, see below) |
| lip-sync: closures on aligned visemes [M] | 9/9 | 9/9 | 9/9 | 9/9 |
| lip-sync: G5 lip gap / G6 teeth outside lips [M] | pass / – | 0.13-0.15 mm / 3→4 | 0.24-0.25 mm / **4→12 FAIL** | 0.12-0.14 mm / – |
| uncanny-valley risk (5 = low risk) | 3 | 3.5 | 3 | **2** |
| consistency across looks (all built teal only) | 3 looks | blocked: no curls, bun or pallu generators | ~1 h per look, `--look` | blocked (copies v3) |
| B+ budget and speed [M, SwiftShader, loaded host] | – | 1.74 MB, 16.8k tris, 5 draws | 2.17 MB (cap 2.2), 17.0k, 5 | 1.81 MB, 17.3k, 5 |
| licence cleanliness | CC0 + ours | CC0 + ours | CC0 + ours + Azure image output (customer-owned) + Apache-2.0 at build time; **a likeness review is owed** | CC0 + ours |
| distance from shipping | far | far: face is the ceiling | far, but on the right axis | far: wrong axis |

B+ frame times: SwiftShader p50 of 129-213 ms/frame across all three, each on a differently loaded host
(load average 2.9-10.1). Triangle and draw counts are equal, so I read no performance difference between them. None of
these is a phone number.

## Why

1. **Only ai-portrait-wrap looks like a person.** Put the four rows of COMPARE.png side by side. Baseline, v3 and
   stylised are the same MakeHuman face with three different finishes. ai-portrait-wrap is a specific, believable Indian
   woman in her thirties. She has real brow mass, lid folds, nasolabial structure and skin that varies across the face.
   The owner's bar ("crazy level", human, children connect with her) is about the face itself. The other two say so
   themselves: v3's "the face is the ceiling" and stylised's "more shader work won't close the gap". The expression
   tricks cannot raise that ceiling.
2. **ai-portrait-wrap's low emotion score comes from presets that can be swapped.** It used the iteration-2
   `presets.js` and the pipeline's face units unchanged (its doc, lines 36 and 88). v3 had the same face and the same
   judge, and went from 37% to 85%. Most of that gain came from the expression layer: the MakeHuman CC0 muscle units,
   the cheek, nasolabial and crow's-feet bunching, open-mouth delighted, and per-emotion poses. That layer is a stage of
   the build, not part of the face, so it can move to the wrapped head. Its delighted and playful are already the two
   emotions v3 fixed. **Whether the 85% transfers is a guess.** stylised measured that unchanged presets on a reshaped
   face fall to 67%, so the merge has to re-score them (step 3 below).
3. **Why stylised-premium is rejected:**
   - **Uncanny.** Enlarged doll eyes and flat two-tone skin sit next to a realistic nose and lips. The result is a doll,
     not a cartoon. The two-tone ramp barely shows under the contract light, which the approach admits.
   - **Two of its high scores are cheats.** Its listening pose turns the head about 40° away, so the judge reads the turn,
     not the face. v3's listening does the same, so both approaches' listening scores measure the pose. Its playful wink shows an eyelid artifact at the right eye.
   - **Its delighted reads as a grimace.** v3 has this too: a big dark mouth with gappy lower teeth. For a child, that is
     the most frightening frame on either sheet.
   - **Overfit risk.** Its poses were chosen against the same judge that grades them, by testing variants until each
     scored 6/6. A held-out judge has to confirm them.
4. **What v3 gives the merge:** the hair (clumped cards, baby hairs, a ponytail with a band, no helmet), the garments
   (relaxed cloth, collar, placket, 0 penetration), the subdivided H mouth and lids, and the expression stage. Next to
   it, ai-portrait-wrap still has MakeHuman card hair with a skin-coloured wedge at the parting. That wedge is the first
   thing you see on its sheet (COMPARE.png, row 3). It also still has offset-skin garments with 27 poke-throughs.

## What must be true before the merged teal ships (in order)

| item | from | bar |
|---|---|---|
| parting wedge gone | ai-portrait-wrap defect 1 | 0 scalp texels with skin albedo inside the hairline mask; checked by eye in the turntable |
| eye pass in the shared `shaders.js` (lid occlusion, sclera tint from the reference) and thinner H brow cards over projected brows | ai-portrait-wrap defects 2, 5 | eyes stop reading brighter than the skin |
| G6 teeth back to baseline | ai-portrait-wrap | no increase (it went 4→12) |
| colour: references generated or exposure-solved to MST 6 before projection | ai-portrait-wrap defect 6 | G9 ±3 L\* / ±4 C\* without the olive-grey cast |
| 3/4 lower face length: true 90° and 45° references, plus a silhouette term in `fitloop.py` | ai-portrait-wrap | likeness NME at yaw 24° at most 1.5× the front value |
| presets re-scored on the merged face, with a held-out judge | stylised-premium lesson | ≥ 70% per emotion, n ≥ 12, encouraging excepted (next row); confirmed by a second judge or a human panel |
| encouraging judged on a 1-2 s clip with the nod | v3 + stylised (0/108 on ~29 still designs) | ≥ 70% on the clip judge |
| delighted mouth: no visible gap in the lower teeth, mouth interior not a black hole | my eye | an art-director pass on the contact sheet |
| budgets | all | H ≤ 6 MB (v3 hair + 1536² projected face maps: drop v3's micro-detail tile on the face, as stylised did), B+ ≤ 2.2 MB, H head ≤ 16k tris (v3 is at 17.5k) |
| all existing gates | all | G1-G5, G9, garment penetration 0, lip closures ≥ 90%, run on all three tiers |
| likeness review per generated identity | ai-portrait-wrap licence row | a reverse-image / lookalike check passes before any child sees her |

## Reversal condition

Go back to v3-only (the MakeHuman face with v3's expressions) in either of these cases:

- **The merged teal, after re-scoring, cannot hold both bars at once.** One bar is the likeness of the reference:
  front NME ≤ 1.2%, against 0.96% now. The other is ≥ 70% per emotion on 8 of 9 stills at n = 12 under a held-out judge.
  If a face that reads its emotions loses the likeness, the wrap costs expressiveness.
- **The owner's eye test or a child panel (E-T4) prefers the v3 or stylised face for warmth.**

Revisit stylisation, but with a designed stylised base, never a fielded MakeHuman, only if child-panel evidence shows
that children connect more with a stylised teacher than a realistic one. Revisit an outside artist for the hero tier
only, per `character-built-in-house`, if the merged build fails the owner's eye test.

## Plan: the merged build to all three looks, then into `src/avatar`

Work happens in `scripts/character/bakeoff/merged/` and `art/character/bakeoff/merged/`, with output to
`public/assets/teacher-bakeoff/merged/<look>/`. `public/assets/teacher/**` is replaced only once the gates above pass.

1. **Main-pipeline fixes first** (measured by ai-portrait-wrap, not yet fixed in `scripts/character/`):
   - write the resting smile into the mesh vertices, not only the Basis;
   - pick the mouth corner for `expression_correctives` by vertex id, not by the outermost x;
   - add stylised's G5 partial-close seal and its eyeball-radius check after any edit to the eye region.
2. **Fork v3's `build.mjs` and add ai-portrait-wrap's hooks** (`fork.mjs` style, explicit string replacement):
   - `wrap.py` and `fitloop.py`: after the identity sculpt, before the face units, visemes, correctives and lip seal. All
     82 keys, v3's MakeHuman expression units included, are then built on the wrapped basis.
   - `project.py`: after v3's texture stage, on the final UVs of the subdivided H face.
   - The v3 `rig.js`, `shaders.js` and `presets.js` are the shared runtime files. ai-portrait-wrap needs no runtime change
     of its own.
   - Teal compute is about 26 min (v3) plus about 1 h (wrap, fit loop, two projection passes) on 4 vCPU.
3. **Teal to the bar** (the table above).
   - Move stylised's `variants.mjs` into the merged folder. Add a clip mode to `emotion-check.mjs` for encouraging: a
     6-frame strip of the nod.
   - Add a held-out judge: a second Foundry model from the Azure-direct list, chosen by bake-off.
4. **Generators slate and plum need:**
   - v3 hair: slate's curls with real clumps, plum's low side bun;
   - a plum saree pallu as a skinned garment;
   - a garment normal map for twill and weave;
   - the hair groom fitted to the reference silhouette (ai-portrait-wrap's next-step 5).
   This is the critical path for consistency across looks.
5. **slate and plum references** from `taxila-image`, in the teal style, at MST 7 and MST 8 against a swatch:
   - slate's references without glasses, with the existing lens mesh added after the wrap, so frames do not throw the
     landmarks;
   - no names in prompts or assets;
   - a likeness review per identity;
   - then about 1.5 h per look, all gates, the standard evidence set and COMPARE rows for all three looks.
6. **Into `src/avatar`** (CHARACTER-PIPELINE §4, which stays the contract):
   - port the merged `rig.js`, `shaders.js` and `presets.js` into `src/avatar/three/` behind `HeadRig`;
   - land the §4.4 changes: a hand-made opaque WebGL2 context, `runtime.json.lighting` as the rig, `jawCeiling`, the
     `_strand` and `_region` attributes, the mouth-interior uniforms, and v3's two optional texture slots;
   - land the lip-driver expander plus the HeadAudio viseme classes (§4.4.5). Until then, closures measure 1/9 on the
     RMS arm;
   - loader: GLTF + KTX2 + meshopt;
   - map tiers H / B+ / B-lite / D in `tier.ts`;
   - the tutor-to-look map stays in `shared/tutors.js`.
   - Gate: `npx tsc -b && npx vite build && npm test`, then B+ measured on a real G85-class phone (E-T2 / E-T7). No
     SwiftShader number counts as acceptance.
7. **Child panel (E-T4) and the owner's eye test** on all three looks, then the reversal check above.

Disk: about 3.5 GB free at the time of writing. The merged build should delete its intermediate `.blend` files per look,
as v3 and ai-portrait-wrap did. Once the merged build reproduces the bake-off assets, the three bake-off asset folders
(8-8.5 MB each) can go.
