# VERDICT: polished-teacher round (2026-10-04)

Sheet: `COMPARE.png`, built by `scripts/character/polished/compare.py`. It has one row per candidate, c1 to c4, with
the current GNM teal as a reference row at the bottom. The columns are front neutral, warm, delighted, concerned,
viseme `aa` and 3/4 view. Every row uses the H tier, our own viewer, rig and stage light. Each row is labelled with its
licence and cost. Two framing caveats:
- The c2 and c3 face camera is tighter than the c1 and c4 one.
- The reference front cell is a face crop of its idle bust. Its 3/4 cell is the yaw090 profile, because no 3/4
  render exists for GNM teal.

**Bottom line: none of the four clears the owner's bar ("clean, polished, human-like, not weird").** Each scout pick
was blocked on an owner action, so all four builds are free stand-ins. c1, c2 and c4 are Microsoft Rocketbox, MIT.
c3 is a pixiv VRoid sample under VRM PL 1.0. They did their job: they prove a professional base drops into our
contract (ARKit 52, 15 visemes and tongue keys, tiers H, B+ and B-lite inside budget, our rig and compositor) with
$0 spent. They also prove that a free, licence-clean source is not a premium source. Every build passed every
numeric gate again. The numeric gates still measure nothing about appeal; only the owner's eye does.

## 1. Ranking (harsh art-director read)

The criterion is clean, polished, human-like, not weird, and appealing to an Indian child and a parent.

| rank | row | verdict in one line | what an art director sees |
|---|---|---|---|
| 1 | **c1**: Rocketbox Female_Adult_11, with the face texture from Female_Adult_10 | A real-looking woman, warm and calm. Reads as a 2010-era game NPC. | **Good:** the most coherent warm-brown skin on the sheet, sensible proportions, believable eyes, a modest non-glamour look, and an `aa` mouth that reads with teeth.<br>**Bad:** a faceted jaw and cheek line, and a painted helmet-cap hair with a hard hairline. The eyes are a little lifeless. Warm, delighted and concerned are nearly the same face. The face reads only broadly South Asian. |
| 2 | **c4**: Rocketbox Female_Adult_07 | The same family as c1, but stern. | A very high forehead under scraped-back cap hair makes her look severe and older. The olive-grey cast and the heavy shadow beside the nose make her harsh. Expressions barely change between columns. Clean teeth and nothing grotesque, but not inviting. |
| 3 | **c3**: VRoid sample, toon | The cleanest image on the sheet and the wrong register. | No uncanniness, no seams, tidy mouth and hair. But it is an anime teenager: huge eyes, a near-absent nose, a tiny mouth and waist-length hair with a fringe. A parent will not see a mid-30s Indian teacher, and the style is Japanese anime, not Indian. Expressions are almost invisible. It shows the stylised route is safe from uncanniness, but this base is not the right design. |
| 4 | **c2**: Rocketbox Business_Female_01 | The most "cheap" of the four. | A green-olive cast makes the skin look unwell. The helmet hair is heavy and the under-eyes are blotchy. The `aa` viseme is a black void with grey upper-lip shading. Her structure is mixed-ethnicity, and recolouring does not make it read Indian. |
| ref | **GNM teal** (current, rejected) | Still the worst. | Photo-real skin with blotchy projection and a seam across the forehead. Gappy teeth on "delighted" read as a grimace. This is the uncanny valley the owner called scary. |

All four candidates beat the reference on "not scary". None of them reaches "polished".

## 2. Recommendation

1. **Do not ship any of c1-c4 as the teacher.** c1 is the licence-clean **floor**. If the owner wants something less
   frightening than GNM teal on screen *now*, c1 can replace teal behind the look flag. Put it in front of the owner
   first, because the owner's eye is the gate.
2. **The route to the bar is the owner-gated one the scout ranked first. Do both in parallel:**
   - **B, ThreeDee stylised (a purchase):** the high-end, Pixar-adjacent stylised look of modern professional
     avatars. Its main advantage: the three.js shading quality we can afford does not produce uncanniness on a
     stylised face, which is what sank every realistic attempt. It needs no third-party service, so there is no
     conflict with the Azure-only directive. The licence has no clause about protecting the file format. The products
     list "ARKit 52 blendshapes" and lip-sync, and ship as GLB, FBX and .blend. **This is my primary
     recommendation.**
   - **A, MetaHuman (free, realistic premium):** worth running as the realistic arm. It needs:
     - an Epic account login;
     - counsel's read of the UE EULA MetaHuman and Distribution sections for a browser-delivered GLB;
     - an Azure-only exception for the Epic-cloud autorig step;
     - about $12-20 of AWS GPU, capped at $60 with `--max-minutes` and the reaper.

     Risk: a realistic face is only as good as our skin and eye shading, which has failed four times now.
3. **Avaturn and MetaPerson (C and D)** stay deprioritised. Both need third-party uploads at authoring time, both
   keep IP terms with the vendor, and MetaPerson has unpublished credit prices for avatars 2 and 3.

## 3. Purchases needed (owner only; nothing was bought)

ThreeDee prices were re-checked on the live product pages on 2026-10-04. Re-check them at checkout.

| item | URL | price | for |
|---|---|---|---|
| Business Office Cartoon Woman | https://www.threedee.design/products/3d-models/business-office-cartoon-woman/ | **$68** | mid-30s woman (the most teacher-like wardrobe) |
| Doctor Cartoon Female (alternative or second woman) | https://www.threedee.design/products/3d-models/doctor-cartoon-female/ | **$62** | mid-30s woman, alternative base |
| Doctor Cartoon Male | https://www.threedee.design/products/3d-models/doctor-cartoon-male-character/ | **$48** | man, late 30s |
| Older Indian woman | ThreeDee custom 3D service (contact via site), or a CharacterZ "Unclez & Auntz" / "Elderz" pack (https://characterz.design/) | custom work **on quote**; CharacterZ **$59-79 per pack, $299 bundle** | older woman. ThreeDee's catalogue has no older woman. ThreeDee's site footer lists "Characterz" as one of its own lines, so the ThreeDee licence probably covers it. Confirm in writing before buying |

- **Phase 1 (evaluate first): $116.** Business Office woman ($68) plus Doctor male ($48).
- **All three looks:** about $175-195 plus one elder pack, or the custom quote.
- Optional services from the scout, not needed on this route: Polywink $299 per model, Riya $10.

**ThreeDee licence** (verbatim from https://www.threedee.design/license/, fetched 2026-10-04):

> What You Can Do: Use resources royalty-free for personal and commercial projects. Modify resources according to
> your requirements. Use in unlimited personal and commercial projects.
>
> What You Cannot Do: Redistribute or resell the original files. Lease, license, or sub-license to third parties.
> Claim ownership of the original files.
>
> Important Notes: Ownership of all original files remains with ThreeDee. You are granted a license to use these
> files under the specified conditions. For extended licensing options or special use cases, please contact us
> directly.

What the licence means for us:
- A modified, re-toned, decimated and compressed GLB inside a paid app is not "the original files".
- It has no extraction or protected-format clause.
- It does not mention children or web delivery. Ask ThreeDee for a one-line written confirmation covering a paid
  children's web and Android-WebView app, using the "special use cases" contact.

Free-licence terms for the built candidates are in `art/character/LICENSES.md`:
- **c1, c2, c4:** MIT, "Copyright (c) 2020 Microsoft",
  https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md. The only obligation is the notice in the
  app's third-party notices.
- **c3:** VRM Public License 1.0, https://vrm.dev/en/licenses/1.0/. Corporate commercial use and modification are
  allowed, and DRM is forbidden. Open question for counsel: the licence is written about VRM files, and we ship GLB.

## 4. Path to the other two looks (man late 30s, older woman)

| look | primary (paid, ThreeDee route) | realistic arm (MetaHuman) | free floor (Rocketbox, MIT) |
|---|---|---|---|
| man, late 30s | Doctor Cartoon Male, $48. Re-tone to the TEACHER-VISUAL Indian palette, a kurta or shirt, and `slate` design cues (glasses, optional) | Creator, South-Asian male preset. Same pipeline as the woman | A Rocketbox adult male through `scripts/character/candidates/c1/chain.sh` (the c1 fork). Expect the same "2010 NPC" ceiling |
| older woman | ThreeDee custom commission (quote), or a CharacterZ elder pack ($59-79) once the licence is confirmed | Creator age and skin presets. This is MetaHuman's strongest case | Weak: Rocketbox has little older South-Asian representation, and ageing by texture is what produced "weird" before. Not recommended |

All three looks must come from the **same source family**. A cast that mixes a stylised woman with a realistic man
looks broken in the picker.

## 5. Integration into `src/avatar` (for whichever base wins)

These steps follow the runtime contract in CHARACTER-PIPELINE.md §4. c1 and c4 already follow it end to end, and so
does `runtime.json`.

1. **Assets.** Land the winner at `public/assets/teacher/<look>/{H,Bplus,Blite}.glb`, plus `runtime.json` and
   `plate/{plate,mouth,blink}.webp` with `plate.json` for tier D.
   - c1 has all of these.
   - c4 has no `plate/`.
   - c2 and c3 have no `runtime.json` or `plate/`. Generate them with the c1 fork's `runtime-json.mjs` and
     `plates.py` before they can drop in.
2. **Look map.** Add `lookId` to `shared/tutors.js` (asha → teal today). Point it at the new look id. The tutor
   points at the look, never the reverse.
3. **Rig port.** Port the winner's `viewer/rig.js`, `shaders.js` and `presets.js` into `src/avatar/three/` behind
   `head.ts`'s `HeadRig` (`apply`, `dispose`, `stats`). Take the candidate's fork, not `scripts/character/viewer/`:
   - **c1:** its fork adds mouth lighting that scales with how far each viseme opens, and a warm interior. Without
     them, open vowels render as a black void.
   - **c3:** its fork carries a toon shader.
   - **A ThreeDee base:** this will need the TaxilaSkin `TIER_LITE` or a toon variant, not the realistic skin
     shader.
4. **Contract items still open in `src/avatar` (CHARACTER-PIPELINE.md §4.4):**
   - **Opaque canvas:** `src/avatar/three/stage3d.ts` line 98 still passes `alpha: true`. Create the WebGL2 context
     by hand with `{alpha:false}` and pass `{canvas, context}`.
   - **Lighting:** load `runtime.json.lighting` as the light rig.
   - **Jaw clamp:** clamp `jawOpen` to `runtime.json.jawCeiling`.
   - **Loader:** set up GLTFLoader with KTX2Loader and MeshoptDecoder.
5. **Lip driver.** This is the biggest quality gap that is not the face. Every candidate closes 9/9 (or 5/5) of the
   aligned /p b m/ sounds when driven by aligned visemes, but only 1/9 (or 1/5) on the loudness driver we ship. Before
   the owner sees a talking teacher, two things must land in `src/avatar/lip.ts`:
   - the closure expander;
   - HeadAudio viseme classes driving `viseme_*` on H and `visemeFold` on B+.
6. **Tiers.** Keep the `src/avatar/tier.ts` mapping: B → B+, Blite → B-lite, D → plate, E → voice-only, and H on
   allow-list devices only. In the SpeechRow (160 px or less), load B+.
7. **Gates before ship.** Run `npx tsc -b && npx vite build && npm test`. Then test FPS on a real phone (all FPS
   above is SwiftShader and relative only). Then a **blind owner side-by-side**, which is the actual gate.
8. **Notices.** Add the licence notice for the shipped source to the app's third-party notices: the MIT text for
   Rocketbox, or a ThreeDee attribution if their written confirmation asks for one.

## 6. Spend and state

- $0 spent this round: no purchases and no GPU launched, so nothing is running.
- Nothing was committed or pushed.
- Candidate GLBs are in `public/assets/teacher-candidates/c{1..4}/`. Renders are in `docs/design/teacher/polished/c{1..4}/`.
