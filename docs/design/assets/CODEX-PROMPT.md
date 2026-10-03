# CODEX-PROMPT.md: the one prompt that generates Taxila's image pack

**Date:** 2026-10-03 · **For:** the owner, to paste into OpenAI Codex once · **Built from:**
`docs/design/assets/MANIFEST.json` by `docs/design/assets/build-manifest.mjs`, which writes this file from
`codex-prompt.template.md`. Edit the template or the generator, never this file.

**What it makes:** 399 files on branch `claude/blissful-mayer-icwe2j` of `raghavsharma2003/Taxila`:
- 242 shipped UI images under `public/assets/gen/**`. 4 of them are made by script,
  with no image model.
- 157 teacher concept and texture references under `art/gen/teacher/**`. That path never ships
  (TEACHER-VISUAL §14.3).
- `public/assets/gen/INDEX.json`, plus a `provenance.json` per folder.

**What it does not make:** the 18 teacher stills under `public/assets/gen/teacher/**`. They are
rendered from the 3D rig by `scripts/teacher-stills.mjs`, so that every screen shows the same person.

**How to use it:**
1. Open Codex on the repo with write access. It needs push rights to the branch, the image tool, Python 3 and
   network access for `pip`.
2. Paste everything between the two marker lines.
3. If the run stops (usage limit, crash, timeout), paste the same prompt again. Codex reads `INDEX.json` and
   continues from the first pending image, so nothing is redone.

**Scale:** about 395 image generations before retries, in 14 resumable batches (B00 to B13), with a commit and
push after each batch. Expect the master files to come to roughly 150 MB. The teacher references are the large
part.

**After the run:**
- review the human checklist in PRODUCT-DESIGN-V2 §12;
- B2 then builds `scripts/gen-assets.mjs`, which converts the masters to shipped 1×/2× WebP and enforces the byte
  budgets.

===== BEGIN CODEX PROMPT =====

# Task: generate the Taxila image pack

You are generating every image for Taxila, a calm, premium AI-tutor app for Indian children aged 6 to 15. The
art shows one warm Indian home:
- a sunlit courtyard for ages 6–9;
- the same home's rooftop at dusk for ages 10–15.

The UI sits on top of the art: paper, ink and one reserved signal colour. The art must never compete with it.

You will create 399 files, using your image-generation tool and a small Python helper. Each file goes
to an exact path at an exact pixel size, in batches. You commit and push after every batch, and you keep
`public/assets/gen/INDEX.json` current so the run can resume.

## 0. Hard boundaries (read first)

- **Repository:** `raghavsharma2003/Taxila`. **Branch:** `claude/blissful-mayer-icwe2j`. Never use another branch.
  Never force-push. Never rewrite history.
- **Where you may write:**
  - `public/assets/gen/**`;
  - `art/gen/teacher/**`;
  - scratch files under `/tmp/taxila-gen/`.

  Do not create, edit, format or delete any other file. Do not run the app, the build, `npm install` or the tests.
  The working tree may already contain uncommitted changes that belong to someone else. Leave them alone, and
  stage only your own paths by name.
- **Do not generate** anything under `public/assets/gen/teacher/`. Those stills are rendered from the 3D rig by
  another tool.
- **No text in any image, ever.** That means no letters, digits, symbols, logos, signage, watermarks or
  signatures, in any script.

## 1. Set-up (run once per session; safe to repeat)

```bash
git fetch origin claude/blissful-mayer-icwe2j
git switch claude/blissful-mayer-icwe2j          # or: git checkout -b claude/blissful-mayer-icwe2j origin/claude/blissful-mayer-icwe2j
git pull --ff-only origin claude/blissful-mayer-icwe2j
mkdir -p /tmp/taxila-gen public/assets/gen art/gen/teacher
python3 -c "import PIL" 2>/dev/null || pip install --quiet pillow
python3 -c "import numpy" 2>/dev/null || pip install --quiet numpy || true
```

Write the helper to `/tmp/taxila-gen/assetkit.py` exactly as given in §9, and the asset list to
`/tmp/taxila-gen/assets.md` exactly as given in §10 (the lines from `### B00` to the end of §10). Then:

```bash
python3 /tmp/taxila-gen/assetkit.py init /tmp/taxila-gen/assets.md   # creates or MERGES INDEX.json; never resets finished items
python3 /tmp/taxila-gen/assetkit.py status                            # what is done, what is next
```

**Resuming.** If `INDEX.json` already exists, `init` keeps every finished item. `status` returns any "done" item
whose file is missing to pending. Always continue from the first pending item in batch order (B00 → B13). Never
regenerate an item marked `done` unless its file fails `check`.

## 2. The per-image loop

For each pending item, in list order inside its batch:

1. **Read the line.** Run `python3 /tmp/taxila-gen/assetkit.py show /tmp/taxila-gen/assets.md <id>` to get the
   path, exact size, format, flags (`alpha`, `skin`, `script`, `tile`, `wrap`), references and subject.
2. **Build the image prompt** in this order:
   1. the style block for the item's category (§4), plus, for teacher items, the character block (§5);
   2. the framing for that category (§4);
   3. `Subject: ` and the subject from the line;
   4. the absolute rules (§3).

   Save that exact text to `/tmp/taxila-gen/prompt.txt`. It is recorded in provenance.
3. **Attach the references.** Every id under `ref:` must already be `done`. If your image tool accepts input or
   reference images, pass those files and say: "match the style, palette, light and (for characters) the identity
   of the reference images exactly". If it does not, paste the reference's subject text into the prompt as
   "Match this established look:", then compare the result with the reference file by eye.
4. **Generate on the native canvas** closest to the target aspect, at the tool's largest size for that aspect:
   - square 1024×1024;
   - landscape 1536×1024;
   - portrait 1024×1536.
   - **Transparent items (`alpha`):** ask for a transparent background with PNG output if the tool supports it.
     Otherwise generate the subject on a perfectly flat pure magenta `#FF00FF` background, with no shadow and no
     gradient, then key it (step 5). Never accept a painted grey-and-white checkerboard. That is fake
     transparency.
5. **Post-process to the exact size and format:**
   - plain item: `python3 /tmp/taxila-gen/assetkit.py fit RAW DST WxH [--alpha]`. It centre-crops to the aspect,
     then resizes with Lanczos.
   - magenta background: `assetkit.py key RAW /tmp/taxila-gen/keyed.png`, then `fit` with `--alpha`.
   - `tile` (only `bg/garden-panorama`):
     1. generate three landscape panels, each an edit of the previous one so the scene continues to the right;
     2. run `assetkit.py stitch /tmp/taxila-gen/pano.webp P1 P2 P3 --w 4800 --h 1200`;
     3. run `assetkit.py wrap /tmp/taxila-gen/pano.webp DST`.
   - `wrap` on each character's `detail/fabric`: after `fit`, run `assetkit.py wrap DST DST --both`.
   - **Edge subjects:** when the subject line puts the subject on one edge (for example "everything on the RIGHT
     edge" in `bg/onboarding-edge`), compose it on that edge and add `--gravity right` (or `left`, `top`,
     `bottom`) to `fit`, so the centre crop never cuts it off.
   - **Teacher references** (`teacher-ref/*`): add `--q 95` to `fit` (MANIFEST conventions: WebP quality 95).
   - The extension in the line decides the format. `fit` writes WebP for `.webp` and PNG for `.png`; never save
     PNG data under a `.webp` name or the reverse.
   - `script` (no image model):
     - `brand/adaptive-background`: `assetkit.py solid DST 1024x1024 24346E --grain`;
     - `brand/monochrome`: `assetkit.py mono public/assets/gen/brand/adaptive-foreground.png DST`;
     - `brand/splash-light`: `assetkit.py place public/assets/gen/brand/mark.png DST 2732x2732 F6F3EC 640`;
     - `brand/splash-dark`: `assetkit.py place public/assets/gen/brand/mark.png DST 2732x2732 121418 640`.
6. **Machine check.** Run `python3 /tmp/taxila-gen/assetkit.py check DST WxH [--alpha] [--wrap] --lint "<lint>"`,
   using the `lint` value from `show`. It must print `"ok": true`. On a skin item, a high lamp-hue share is
   reported as a `note`, not as a problem. That is expected.
7. **Visual check.** Open the final file and look at it. Then run the per-image QA (§7). Any failure means a new
   generation, with the failure named in the prompt ("the previous attempt had letters on the book; the pages must
   be blank").
8. **Retries.** Allow at most **3 attempts** per item. After 3 failures:
   - run `assetkit.py record <id> failed --attempts 3 --notes "<what kept failing>"`;
   - keep the best attempt at `/tmp/taxila-gen/failed/<id>.png` (it is not committed);
   - move on.
9. **Record.** On success:
   - run `assetkit.py record <id> done --attempts N --model "<image model name>" --ocr <tesseract|visual>`;
   - then run `assetkit.py prov <id> --prompt-file /tmp/taxila-gen/prompt.txt --model "<image model name>"
     --attempts N`.
10. **Skip.** Skip an item only when it is impossible as specified (for example, the tool cannot produce it at
    all). Run `assetkit.py record <id> skipped --notes "<why>"`. Never skip because an item is slow or hard.

## 3. Absolute rules (append to every image prompt; reject and regenerate any image that breaks one)

- NO text, letters, numbers, digits, symbols, logos, brand marks, signage, labels, watermarks or signatures of
  any kind, in ANY script: Latin, Devanagari or any other.
  - No writing on chalkboards, slates, books, packets, screens, walls, clothes or vehicles.
  - Clocks have no numerals and no tick marks.
  - Pages and screens are blank, or carry only soft abstract marks.
- NO currency notes or coins. NO counted quantities meant to be read. NO diagrams, charts, maps or labels.
- NO religious symbols, idols, temples, deities, sacred plants shown as sacred, flags, maps of India or national
  emblems. Nothing political, and no festival-specific imagery.
- NO real people, celebrities, brands or copyrighted characters. No resemblance to any real person.
- NO owls, parrots, cows or pigs as characters. NO coins, trophies, medals, crowns, gems, stars-as-rewards, flames
  or streak symbols.
- NO scary, sad, crying or angry characters. No wilting or dead plants.
- **The reserved colour.** NEVER use marigold, saffron, amber, gold, brass, mustard, bright yellow or yellow-orange
  anywhere: no hue between 28° and 52° at more than low saturation. The app reserves that colour for one signal.
  - Sunlight is warm CREAM, never yellow.
  - Wood is greyed walnut or weathered teak, desaturated, never honey or golden.
  - Metal is steel or iron, never brass or gold.
  - No neon. No gradients used as decoration.
  - The only exception is the teacher references (`art/gen/teacher/**`), which follow their character block.
- **Prompt text is never drawn.** Hex colour codes, ids, paths and words in these instructions are guidance
  only. Never render a hex code, a word or a label from this prompt inside the image.
- **Shipped UI images (`public/assets/gen/**`):** NO adult teacher figure, anywhere. Where an item needs a place
  for the teacher, leave that area empty and calm.

## 4. Style blocks and framing (one per category)

**GLOBAL WORLD STYLE** (the base for every `public/assets/gen/**` image except `brand/*`):
- **Medium:** matte gouache-and-pencil digital painting on warm paper grain, with soft edges. Visible brush texture
  on large images; simpler and flatter on small icons, avatars and pictograms.
- **Light:** one soft key light from the UPPER LEFT, always, with gentle fill and calm late-afternoon warmth.
  Light is cream, never yellow.
- **Palette anchors:**
  - warm paper `#F6F3EC`;
  - deep ink blue `#24346E`;
  - teal `#0B7285`;
  - terracotta `#B5532E`;
  - leaf green `#2E7D32`;
  - neem green `#2F6B4F`;
  - dusty rose `#B4466A`;
  - day sky `#A9D8E8`;
  - stone `#C9C6BE`;
  - dusk blue `#26304A`;
  - night `#0F1A33`;
  - chalkboard green `#1F3B30`;
  - natural Indian skin tones from `#F3D2B3` through `#C99366` and `#8A5634` to `#5F3A22`, weighted to the middle.
- **Objects:** everyday, specific, unglamorous modern Indian home and school life. Steel tumbler, steel tiffin,
  cloth-bound notebooks, geometry box, slate, school bag on a hook, ceiling-fan shadow, window with neem leaves,
  matka, charpai, white kolam dots, terracotta pots, bougainvillea, rooftop water tank, rooftop rail, city lights.
- **Composition:** detail lives at the EDGES. Keep the CENTRE THIRD calm and low in detail, because text and a face
  go there.
- **People** (only where an item asks):
  - Indian children and adults of varied skin tone, mostly medium, with varied hair; some wear glasses.
  - Modest everyday clothes with no logos. Friendly, never stereotyped.
  - Never make a hero lighter-skinned.
- **By age:** ages 6–9 items are rounder and brighter, with a few more objects. Ages 10–15 items are editorial and
  muted, with more empty space, and no cartoon faces on objects.

**Framing per category** (add after the style block):
- `bg/*-wide` (2560×1440): a full-bleed landscape scene. Detail sits at the left and right edges, and the centre
  third stays calm.
- `bg/*-phone` (1440×2560): the SAME scene, camera and objects as its `-wide` reference, recomposed tall. The
  subject band sits in the top 40%, and the lower 60% is calm, low-contrast ground for UI cards.
- `bg/stage-*`: soft-focus, low detail, with a smooth plain centre. No person.
- `bg/*` (all): full-bleed and opaque, with nothing transparent. The scene runs edge to edge, with no frame and no
  vignette to white.
- **world-young** (`home-young*`, `who`, `practice`, `garden-panorama`, `stage-young`): sunlit courtyard
  morning, rounder and brighter.
- **world-older** (`home-older*`, `ask`, `sky-panel`, `landing-hero`, `stage-older`): dusk rooftop or study, muted
  and editorial, with an indigo sky. A horizon glow is rose-violet, never orange. City lights are cool white and
  soft rose, never orange.
- `avatars/*`: one subject centred on a painted circular paper disc in the named tint, matte with paper grain. The
  disc fills 92% of the frame; outside it is fully transparent. Friendly, not cartoonish. Animals may have gentle
  faces; objects never have faces.
- `interests/*`, `home/*`, `topics/*`, `garden/watering-can`, `garden/sunbird`: one object or a small scene,
  centred, filling about 85% of the frame, on full transparency. No ground plane and no cast shadow outside the
  object.
  - `topics/*` are for ages 6–9: rounder and brighter. They are evocative still life, never an instructional
    diagram.
- `subjects/*`: still life, centred, on full transparency; editorial and muted for ages 10–15.
- `states/*`, `onboarding/*`, `promises/*`: a calm small scene with generous empty space. Its edges fade softly
  into full transparency, with no rectangle and no hard frame.
- `garden/<kind>-<stage>`: one plant growing from a small mound of dark soil, bottom-centred. The mound has the
  SAME size and position in all 12 plant images, so the stages swap in place. Keep a consistent scale across
  kinds. No rings, glows or sparkles.
- `garden/chapter-seal`, `sky/chapter-seal`: a small emblem object, centred, on full transparency. It is a state
  of the map, not a medal: no ribbon, no rays, no star points.
- `picto/*`: ONE bold object, centred, filling about 80% of the frame, with a thick soft warm-dark outline
  (`#3A2A1E`, about 7 px at 256 px). Flat-ish gouache fill with little texture, readable at 48 px, on full
  transparency. All pictograms must look like one set: same outline weight, same light, same level of
  simplification.
- `protege/*`: an obviously fictional, friendly creature with simple dot eyes and no human features, full body,
  standing, centred, on full transparency. Its three variants share scale, position and colours, and only the
  expression and pose change.
- `landing/*`: a full-bleed, editorial, warm dusk scene with a calm centre third, opaque.
- `brand/*`: **not** gouache. A flat, crisp, hand-finished vector-like mark in deep ink blue `#24346E` and paper
  cream `#F6F3EC` only. Simple shapes, readable at 48 px, no texture, no gradients. NO letters, no lamp, no
  yellow.

**Inclusion across the set:** the child in `landing/listening` uses a wheelchair, and the child in
`states/talk-to-grown-up` wears a behind-the-ear hearing aid. Both are shown naturally, never as the subject.

## 5. Teacher references (`teacher-ref/*` → `art/gen/teacher/**`): style and character lock

**TEACHER STYLE** (used instead of the world style for every teacher reference):
- A photoreal-leaning stylised 3D character, like a high-end real-time game cinematic. It is clearly an
  illustration-to-3D concept, not a photograph.
- Real adult proportions with a very slightly large head (about 3%). Natural, readable facial planes: cheekbone,
  nasolabial region, lid crease.
- Physically built eyes with visible iris depth, a wet line and a catch-light from the upper left. Eyes are only
  very slightly enlarged (×1.03–1.06), never cartoon eyes.
- Real skin with a soft subsurface glow and faint pores, slightly softened. No beauty filter, no heavy make-up,
  with a natural 3–8% facial asymmetry.
- Lighting: a soft key from the upper left, gentle fill, a subtle rim light.
- Background: plain warm-grey studio `#E9E1D6`, unless the item names a stage or classroom.
- An adult Indian teacher with a warm presence. They must not resemble any real person or celebrity.
- **Register lock (child-safety floor; reject any image that breaks it):** a teacher at work, for children aged 6 to
  15. Professional, modest, approachable everyday clothes, as in the character block. Never glamorous, model-like,
  seductive, coy, flirtatious, romantic or "date" styled: no wink, no smirk, no pout, no bedroom eyes, no glossy
  lips, no hair-flip, no hand-to-lips or hand-to-cheek pose (the `one-moment` finger is the only hand near the
  face), no bare shoulders, no over-the-shoulder look back at the camera. Framing is never tighter than head and
  shoulders except the technical `visemes/*` and `detail/*` sheets, which are evenly lit and clinical.
- No text, letters, numbers, logos or watermarks.

**Identity lock (the most important rule in this section):**
1. Generate `teacher-ref/<c>/turnaround/front` first. It is the identity anchor.
2. Every later image of that character MUST use the front turnaround as a reference image, and must keep these
   IDENTICAL:
   - face shape and proportions;
   - skin tone (the hex below);
   - eye colour;
   - hair colour and style;
   - the signature accessory;
   - the outfit and its colours.

   Only expression, pose, framing and camera change.
3. After each image, put it beside the front turnaround and ask: "Is this unmistakably the same person, in the same
   clothes?" If not, regenerate.
4. Never lighten or darken the skin between images.

**Character blocks** (paste the matching one after TEACHER STYLE):

- **asha** (B11; live; teaches classes 1-4 (Young)). An Indian woman, apparent age 24, Monk Skin Tone 6: skin #C99366 (shadow #B07E55). Hair #2A1C14, high ponytail with a few flyaway strands. Iris #4A2E1C. Lips #9A4E44. Outfit: teal (#3E7C74, shade #32665F) cotton kurti with a thin rust (#C2410C) neckline piping, under a light faded denim jacket. Signature accessory: small gold stud earrings (the TV §4.3 identity anchor; tiny, below the hue lint). Face: oval face, lively expressive brows, a faint dimple on her LEFT cheek when she smiles, dark brown eyes, no glasses, no bindi or religious markers. Signature colour #3E7C74.
- **arjun** (B12; live; teaches classes 5-9 (Older)). An Indian man, apparent age 26, Monk Skin Tone 7: skin #A9744A (shadow #93633D). Hair #1F1712, short dense curls in clumps. Iris #3A2416. Lips #7E4636. Outfit: slate-blue (#44607F, shade #384F69) check shirt worn open over a plain off-white (#E9E4D8) tee. Signature accessory: round thin-rim glasses with a dark metal rim. Face: friendly open face, light stubble texture (not a beard), dark brown eyes, no religious markers. Signature colour #44607F.
- **uma** (B13; draft (name uma vs nandini unsettled, TV §14.4); teaches classes 7-9 (Older)). An Indian woman, apparent age 34, Monk Skin Tone 8: skin #8A5634 (shadow #764829). Hair #241812, low bun at the nape. Iris #2E1C10. Lips #6E3A30. Outfit: plum (#7A4A6E, shade #653C5B) handloom cotton saree with a thin contrasting rust (#C2410C) border and a cream (#EADFC8) blouse, pallu over the left shoulder. Signature accessory: the pallu drape and border. Face: calm brows, fine lower-lid detail, composed warm expression, no bindi or religious markers. Signature colour #7A4A6E.

**Framing for teacher sheets:**
- `turnaround/*` and `emotions/*`: head and shoulders.
- `visemes/*`: the lower face only, from the nose tip to the chin, front view.
- `detail/*`: an extreme close-up of the named region, evenly lit. `detail/iris-flat` is a perfectly front-on flat
  iris disc. `detail/fabric` is a flat, tileable swatch.
- `poses/*`: waist-up, unless the subject says head and shoulders.
- `stage/on-stage`: the character in front of the named stage background (`bg/stage-young` for Asha,
  `bg/stage-older` for Arjun and Uma). Use that stage image as a second reference.
- `stage/classroom-wide`: a soft-focus warm Indian classroom with a blank green board.
- `cast/lineup`: all three, matching their own front turnarounds.

**Emotion intent:** these sheets drive the expression sculpts.
- Every smile carries a cheek raise and a lower-lid raise.
- `gentle-concern` is kind, never sad.
- `your-turn` is patient, never impatient.
- `got-it-nod` is identical for any answer: neutral-warm, never approving or disapproving.

## 6. Batches, commits and pushes

Work strictly batch by batch: B00, B01 … B10, then B11 (asha), B12 (arjun), B13 (uma, then the cast lineup).

**B00 are the style keys:**
- `bg/home-young-wide` is the world anchor;
- `avatars/red-panda` is the small-sprite anchor;
- `picto/home` is the pictogram anchor.

Before going on, look at these three together and confirm that they read as one family. Later images reference
them.

After the last item of each batch:

```bash
python3 /tmp/taxila-gen/assetkit.py status
git add public/assets/gen art/gen/teacher                      # your paths only; never `git add -A` or `git add .`
git commit -m "assets: batch <Bxx> <title> (<n done>, <n failed>, <n skipped>)"
git pull --rebase origin claude/blissful-mayer-icwe2j            # if this conflicts outside your paths, stop and report
git push origin HEAD:claude/blissful-mayer-icwe2j
```

- Commit even when some items failed. `INDEX.json` says which, and a later run retries `failed` items only if you
  are asked to.
- If the push is rejected for permissions, keep committing locally batch by batch, and say so in the final
  report.
- If a single file is over 25 MB, re-save it (WebP quality 90, PNG optimise) before committing.

## 7. QA checklist (you must self-verify; `check` covers what a script can, your eyes cover the rest)

**Per image** (every item before `record … done`):

| check | how |
|---|---|
| exact pixel size | `check` reports `size` equal to the line's WxH |
| correct format and path | the extension and path match the line exactly, with lowercase ids |
| real transparency where `alpha` | `check`: alpha channel present, all four corners fully transparent, ≥ 10% fully transparent pixels, no painted checkerboard |
| opaque where not `alpha` | `check`: no transparent pixels in backgrounds and scenes |
| no text, digits, logos, watermarks or signatures | look at the whole image at 100%, including the corners and every book, screen, board, packet and vehicle. `check` also runs `tesseract` when it is installed: 3 or more OCR characters is a failure to inspect |
| no reserved colour | `check` lamp-hue share ≤ 1.5% (skin items: reported, not failed). Visually: no gold, yellow, amber, brass or orange lights |
| style match | the item matches its B00 anchor: medium, outline weight (pictos), light from the upper left, palette |
| subject correct | everything in the subject is present; nothing banned in §3 is present |
| calm centre | backgrounds and scenes keep the centre third low in detail |
| no teacher figure | no adult teacher figure in any `public/assets/gen/**` image |
| characters consistent | teacher references match the front turnaround (§5); protégé and garden variants match their first variant |
| teacher register | teacher references pass the §5 register lock: a professional teacher, never glamour, flirtation or romance; nothing in a pose a parent would find odd for a children's teacher |
| tiling (`wrap`) | `check --wrap` passes, and the seam is not visible when the image is placed beside itself |

**Per batch:** open all of the batch's images together as a contact sheet and look for an odd one out (style,
light, saturation, outline weight, scale). Regenerate the outlier before committing.

**Final** (after B13):
1. Every item in `INDEX.json` is `done`, `failed` or `skipped`. None is `pending`.
2. `INDEX.json` `summary` counts add up to 399.
3. `public/assets/gen/<category>/provenance.json` and `art/gen/teacher/<c>/provenance.json` hold one row per
   done file.
4. Nothing was written outside `public/assets/gen/**` and `art/gen/teacher/**`: `git status --porcelain`, ignoring
   pre-existing changes.
5. Write your final report as a short message, with:
   - the counts;
   - the list of failed and skipped ids with reasons;
   - any item you are unsure about (for a human to review);
   - the image model used;
   - whether the push succeeded.

## 8. INDEX.json (written by the helper; do not hand-edit except `notes`)

`public/assets/gen/INDEX.json` holds:
- `version`, `branch`, `startedAt`, `updatedAt`;
- `summary` (pending / done / skipped / failed);
- `skipped` (every id not done after the run: failed and skipped);
- `items`. Each item has `path`, `size`, `alpha`, `flags`, `lint`, `batch`, `references` and `status`. Done items
  add `width`, `height`, `bytes`, `sha256`, `lampHueShare`, `attempts`, `model`, `ocr` and `date`.

## 9. The helper: write this file verbatim to `/tmp/taxila-gen/assetkit.py`

```python
#!/usr/bin/env python3
"""Taxila asset kit: fit, key, stitch, wrap, composite, check and record images for the Codex image run.
Needs Pillow (pip install pillow); numpy is optional (faster checks). Run from the repo root.
  init  LIST.md                         create/merge public/assets/gen/INDEX.json from the prompt's ASSET LIST
  show  LIST.md ID                      print one expanded entry (path, size, flags, refs, subject)
  status                                counts + the next 10 pending ids
  fit   SRC DST WxH [--alpha] [--q 92] [--gravity center|top|bottom|left|right]
  key   SRC DST [--hex FF00FF] [--tol 70]   chroma key a flat background to real alpha
  stitch DST P1 P2 P3 --w 4800 --h 1200 [--overlap 96]
  wrap  SRC DST [--band 96] [--both]      make left/right (and with --both, top/bottom) edges tile
  solid DST WxH HEX [--grain]
  place SRC DST WxH HEX SIZE              SRC (alpha) centred at SIZE px on a flat HEX canvas
  mono  SRC DST                           alpha silhouette -> flat white on transparency
  check PATH WxH [--alpha] [--lint lamp-hue|skin-review|reference-only] [--wrap]
  record ID STATUS [--notes TEXT] [--model M] [--attempts N] [--ocr visual|tesseract]
  prov  ID --prompt-file F [--tool T] [--model M] [--attempts N]   append the provenance row for a done image
"""
import sys, os, re, json, hashlib, argparse, datetime, colorsys, subprocess, warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
from PIL import Image, ImageFilter
try:
    import numpy as np
except Exception:
    np = None

INDEX = "public/assets/gen/INDEX.json"
LAMP_H, LAMP_TOL = 39.5, 12.0


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_index():
    if os.path.exists(INDEX):
        with open(INDEX) as f:
            return json.load(f)
    return {"version": 1, "manifestVersion": 1, "branch": "claude/blissful-mayer-icwe2j", "startedAt": now(), "items": {}}


def save_index(ix):
    ix["updatedAt"] = now()
    items = ix["items"].values()
    ix["summary"] = {s: sum(1 for i in items if i["status"] == s) for s in ("pending", "done", "skipped", "failed")}
    ix["skipped"] = sorted(k for k, v in ix["items"].items() if v["status"] in ("skipped", "failed"))
    os.makedirs(os.path.dirname(INDEX), exist_ok=True)
    tmp = INDEX + ".tmp"
    with open(tmp, "w") as f:
        json.dump(ix, f, indent=2, sort_keys=False)
        f.write("\n")
    os.replace(tmp, INDEX)


def ramp(w, h):
    m = Image.new("L", (w, 1))
    m.putdata([round(255 * i / max(w - 1, 1)) for i in range(w)])
    return m.resize((w, h))


def size(s):
    w, h = s.lower().split("x")
    return int(w), int(h)


def save(img, dst, q=92):
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    ext = dst.rsplit(".", 1)[-1].lower()
    if ext == "webp":
        if img.mode == "RGBA":
            img.save(dst, "WEBP", quality=q, method=6, exact=True)
        else:
            img.convert("RGB").save(dst, "WEBP", quality=q, method=6)
    elif ext == "png":
        img.save(dst, "PNG", optimize=True)
    else:
        raise SystemExit("unsupported extension " + ext)


def fit(a):
    w, h = size(a.size)
    img = Image.open(a.src)
    img = img.convert("RGBA") if a.alpha else img.convert("RGB")
    sw, sh = img.size
    r = w / h
    cw, ch = (sw, round(sw / r)) if sw / sh < r else (round(sh * r), sh)
    cw, ch = min(cw, sw), min(ch, sh)
    g = a.gravity
    x = {"left": 0, "right": sw - cw}.get(g, (sw - cw) // 2)
    y = {"top": 0, "bottom": sh - ch}.get(g, (sh - ch) // 2)
    img = img.crop((x, y, x + cw, y + ch)).resize((w, h), Image.LANCZOS)
    save(img, a.dst, a.q)
    print(json.dumps({"fit": a.dst, "from": [sw, sh], "crop": [cw, ch], "scale": round(max(w / cw, h / ch), 2)}))


def key(a):
    img = Image.open(a.src).convert("RGBA")
    kr, kg, kb = (int(a.hex[i:i + 2], 16) for i in (0, 2, 4))
    px = img.load()
    W, H = img.size
    tol = a.tol
    for yy in range(H):
        for xx in range(W):
            r, g, b, al = px[xx, yy]
            d = ((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5
            if d < tol:
                px[xx, yy] = (r, g, b, 0)
            elif d < tol * 2:
                t = (d - tol) / tol
                # despill: pull the key colour out of edge pixels
                r2 = int(max(0, min(255, (r - kr * (1 - t)) / max(t, 1e-3))))
                g2 = int(max(0, min(255, (g - kg * (1 - t)) / max(t, 1e-3))))
                b2 = int(max(0, min(255, (b - kb * (1 - t)) / max(t, 1e-3))))
                px[xx, yy] = (r2, g2, b2, int(al * t))
    save(img, a.dst)
    print(json.dumps({"keyed": a.dst}))


def stitch(a):
    ov = a.overlap
    n = len(a.panels)
    pw = (a.w + ov * (n - 1)) // n
    panels = []
    for p in a.panels:
        im = Image.open(p).convert("RGB")
        sw, sh = im.size
        r = pw / a.h
        cw, ch = (sw, round(sw / r)) if sw / sh < r else (round(sh * r), sh)
        x, y = (sw - cw) // 2, (sh - ch) // 2
        panels.append(im.crop((x, y, x + cw, y + ch)).resize((pw, a.h), Image.LANCZOS))
    out = Image.new("RGB", (a.w, a.h))
    x = 0
    for i, im in enumerate(panels):
        if i == 0:
            out.paste(im, (0, 0))
        else:
            mask = ramp(ov, a.h)  # 0 (keep what is there) -> 255 (new panel), left to right
            base = out.crop((x, 0, x + ov, a.h))
            blend = Image.composite(im.crop((0, 0, ov, a.h)), base, mask)
            out.paste(im, (x, 0))
            out.paste(blend, (x, 0))
        x += pw - ov
    out = out.crop((0, 0, a.w, a.h))
    save(out, a.dst)
    print(json.dumps({"stitched": a.dst, "panelWidth": pw}))


def wrap_lr(im, b):
    W, H = im.size
    L = im.crop((0, 0, b, H))
    R = im.crop((W - b, 0, W, H))
    half = ramp(b, H).point(lambda v: v // 2)  # 0 at the inner side -> 127 at the outer edge
    # right strip drifts toward the left strip at its outer edge, and vice versa
    newR = Image.composite(L, R, half)
    newL = Image.composite(R, L, half.transpose(Image.FLIP_LEFT_RIGHT))
    im.paste(newR, (W - b, 0))
    im.paste(newL, (0, 0))
    return im


def wrap(a):
    im = Image.open(a.src).convert("RGB")
    im = wrap_lr(im, a.band)
    if a.both:
        im = wrap_lr(im.transpose(Image.ROTATE_90), a.band).transpose(Image.ROTATE_270)
    save(im, a.dst)
    print(json.dumps({"wrapped": a.dst, "both": bool(a.both)}))


def solid(a):
    w, h = size(a.size)
    c = tuple(int(a.hex.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    im = Image.new("RGB", (w, h), c)
    if a.grain:
        noise = Image.effect_noise((w, h), 6).convert("L")
        im = Image.composite(Image.new("RGB", (w, h), tuple(min(255, v + 6) for v in c)), im, noise.point(lambda v: 40 if v > 128 else 0))
    save(im, a.dst)


def place(a):
    w, h = size(a.size)
    c = tuple(int(a.hex.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    canvas = Image.new("RGBA", (w, h), c + (255,))
    src = Image.open(a.src).convert("RGBA")
    src.thumbnail((a.px, a.px), Image.LANCZOS)
    canvas.alpha_composite(src, ((w - src.width) // 2, (h - src.height) // 2))
    save(canvas.convert("RGB"), a.dst)


def mono(a):
    src = Image.open(a.src).convert("RGBA")
    alpha = src.getchannel("A")
    white = Image.new("RGBA", src.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    save(white, a.dst)


def lamp_share(img):
    im = img.convert("RGBA")
    im.thumbnail((768, 768))
    if np is not None:
        arr = np.asarray(im).astype(np.float32) / 255.0
        rgb, al = arr[..., :3], arr[..., 3]
        mx, mn = rgb.max(-1), rgb.min(-1)
        l = (mx + mn) / 2
        d = mx - mn
        s = np.where(d == 0, 0, d / (1 - np.abs(2 * l - 1) + 1e-9))
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        h = np.zeros_like(l)
        m = d > 0
        rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
        h[rm] = ((g - b)[rm] / d[rm]) % 6
        h[gm] = ((b - r)[gm] / d[gm]) + 2
        h[bm] = ((r - g)[bm] / d[bm]) + 4
        h = h * 60
        vis = al > 0.5
        hit = vis & (s >= 0.35) & (l >= 0.20) & (l <= 0.85) & (np.abs(h - LAMP_H) <= LAMP_TOL)
        n = int(vis.sum())
        return round(float(hit.sum()) / max(n, 1) * 100, 2)
    hit = n = 0
    for r, g, b, al in im.getdata():
        if al < 128:
            continue
        n += 1
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if s >= 0.35 and 0.20 <= l <= 0.85 and abs(h * 360 - LAMP_H) <= LAMP_TOL:
            hit += 1
    return round(hit / max(n, 1) * 100, 2)


def checkerboard(img):
    """True if a corner looks like a painted fake-transparency checkerboard."""
    im = img.convert("L")
    W, H = im.size
    for (x, y) in ((0, 0), (W - 64, 0), (0, H - 64), (W - 64, H - 64)):
        c = im.crop((x, y, x + 64, y + 64))
        vals = sorted(set(c.getdata()))
        if 2 <= len(vals) <= 6 and vals[-1] - vals[0] > 12 and vals[0] > 150:
            return True
    return False


def check(a):
    w, h = size(a.size)
    res = {"path": a.path, "ok": True, "problems": []}
    if not os.path.exists(a.path):
        res.update(ok=False, problems=["missing"]); print(json.dumps(res)); return res
    img = Image.open(a.path)
    img.load()
    res["size"] = list(img.size); res["mode"] = img.mode; res["bytes"] = os.path.getsize(a.path)
    if img.size != (w, h):
        res["problems"].append(f"size {img.size[0]}x{img.size[1]} != {w}x{h}")
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    if a.alpha:
        if not has_alpha:
            res["problems"].append("no alpha channel")
        else:
            al = img.convert("RGBA").getchannel("A")
            corners = [al.crop(b) for b in ((0, 0, 16, 16), (w - 16, 0, w, 16), (0, h - 16, 16, h), (w - 16, h - 16, w, h))]
            if max(max(c.getdata()) for c in corners) > 8:
                res["problems"].append("corners not transparent")
            clear = sum(1 for v in al.getdata() if v == 0) / (w * h)
            res["transparentShare"] = round(clear * 100, 1)
            if clear < 0.10:
                res["problems"].append("less than 10% fully transparent")
    else:
        if has_alpha and min(img.convert("RGBA").getchannel("A").getdata()) < 255:
            res["problems"].append("opaque asset has transparent pixels")
    if checkerboard(img):
        res["problems"].append("fake checkerboard transparency painted in")
    if a.lint and "lamp-hue" in a.lint:
        share = lamp_share(img)
        res["lampHueShare"] = share
        if share > 1.5:
            if "skin-review" in a.lint:
                res["note"] = "lamp-hue share above 1.5%; skin-review item: report, a human reviews"
            else:
                res["problems"].append(f"lamp-hue pixels {share}% > 1.5%")
    if a.wrap:
        im = img.convert("RGB")
        lc = im.crop((0, 0, 4, h)).resize((1, 64)); rc = im.crop((w - 4, 0, w, h)).resize((1, 64))
        diff = sum(sum(abs(p - q) for p, q in zip(x, y)) for x, y in zip(lc.getdata(), rc.getdata())) / (64 * 3)
        res["edgeWrapDiff"] = round(diff, 1)
        if diff > 18:
            res["problems"].append(f"left/right edges do not tile (mean diff {diff:.1f})")
    try:
        out = subprocess.run(["tesseract", a.path, "-", "--psm", "11"], capture_output=True, text=True, timeout=60)
        txt = "".join(ch for ch in out.stdout if ch.isalnum())
        res["ocr"] = "tesseract"; res["ocrChars"] = len(txt)
        if len(txt) >= 3:
            res["problems"].append(f"OCR found characters: {txt[:20]!r} (inspect visually)")
    except Exception:
        res["ocr"] = "visual"
    res["ok"] = not res["problems"]
    print(json.dumps(res))
    return res


def record(a):
    ix = load_index()
    it = ix["items"].get(a.id)
    if it is None:
        raise SystemExit(f"unknown id {a.id}: run init first")
    it["status"] = a.status
    it["date"] = now()
    if a.notes: it["notes"] = a.notes
    if a.model: it["model"] = a.model
    if a.attempts: it["attempts"] = a.attempts
    if a.ocr: it["ocr"] = a.ocr
    p = it["path"]
    if a.status == "done":
        if not os.path.exists(p):
            raise SystemExit("cannot mark done: file missing " + p)
        img = Image.open(p)
        it["width"], it["height"] = img.size
        it["bytes"] = os.path.getsize(p)
        it["sha256"] = hashlib.sha256(open(p, "rb").read()).hexdigest()
        if "lamp-hue" in it.get("lint", ""):
            it["lampHueShare"] = lamp_share(img)
    save_index(ix)
    print(json.dumps({a.id: it["status"]}))


CHAR_BATCH = {"asha": ("B11", "young"), "arjun": ("B12", "older"), "uma": ("B13", "older")}
LINE = re.compile(r"^- (\S+) \| (\d+x\d+) (png|webp)((?: [a-z]+)*) \| ref: ([^|]*) \| (.*)$")


def path_of(i, ext):
    if i.startswith("teacher-ref/"):
        return "art/gen/teacher/" + i[len("teacher-ref/"):] + "." + ext
    return "public/assets/gen/" + i + "." + ext


def parse_list(fn):
    out, batch = [], None
    for raw in open(fn, encoding="utf-8"):
        raw = raw.rstrip("\n")
        m = re.match(r"^### (B\d\d)", raw)
        if m:
            batch = m.group(1)
            continue
        m = LINE.match(raw)
        if not m:
            continue
        i, sz, ext, fl, refs, subj = m.groups()
        fl = fl.split()
        refs = [] if refs.strip() == "-" else [r.strip() for r in refs.split(",")]
        chars = CHAR_BATCH.items() if "{c}" in i else [(None, (batch, None))]
        for c, (b, stage) in chars:
            sub = lambda t: t.replace("{c}", c).replace("{stage}", stage) if c else t
            ii = sub(i)
            owner = ii.split("/")[1] if ii.startswith("teacher-ref/") else None
            if owner in CHAR_BATCH:
                c_batch = CHAR_BATCH[owner][0]
            else:
                c_batch = b if c else batch
            lint = "reference-only" if ii.startswith("teacher-ref/") else ("lamp-hue, skin-review" if "skin" in fl else "lamp-hue")
            out.append({"id": ii, "path": path_of(ii, ext), "size": sz, "alpha": "alpha" in fl, "flags": fl, "lint": lint,
                        "batch": c_batch, "references": [sub(r) for r in refs], "subject": sub(subj)})
    return out


def prov_file(p):
    parts = p.split("/")
    if p.startswith("art/gen/teacher/"):
        return "/".join(parts[:4]) + "/provenance.json"
    return "/".join(parts[:4]) + "/provenance.json"   # public/assets/gen/<category>/provenance.json


def prov(a):
    ix = load_index()
    it = ix["items"].get(a.id)
    if it is None:
        raise SystemExit("unknown id " + a.id)
    pf = prov_file(it["path"])
    rows = json.load(open(pf)) if os.path.exists(pf) else []
    rows = [r for r in rows if r.get("id") != a.id]
    rows.append({"file": os.path.relpath(it["path"], os.path.dirname(pf)), "id": a.id, "prompt": open(a.prompt_file, encoding="utf-8").read().strip(),
                 "references": it.get("references", []), "date": now(), "tool": a.tool, "model": a.model, "attempts": a.attempts})
    os.makedirs(os.path.dirname(pf), exist_ok=True)
    with open(pf, "w") as f:
        json.dump(rows, f, indent=2); f.write("\n")
    print(json.dumps({"provenance": pf, "rows": len(rows)}))


def init(a):
    ix = load_index()
    items = parse_list(a.items)
    added = 0
    for it in items:
        if it["id"] not in ix["items"]:
            ix["items"][it["id"]] = {k: it[k] for k in ("path", "size", "alpha", "flags", "lint", "batch", "references")} | {"status": "pending"}
            added += 1
    save_index(ix)
    print(json.dumps({"added": added, "total": len(ix["items"])}))


def show(a):
    for it in parse_list(a.items):
        if it["id"] == a.id:
            print(json.dumps(it, indent=1)); return
    raise SystemExit("not in list: " + a.id)


def status(a):
    ix = load_index()
    items = ix["items"]
    # a done item whose file vanished goes back to pending
    for k, v in items.items():
        if v["status"] == "done" and not os.path.exists(v["path"]):
            v["status"] = "pending"
    save_index(ix)
    order = ["B00","B01","B02","B03","B04","B05","B06","B07","B08","B09","B10","B11","B12","B13"]
    pend = sorted((k for k, v in items.items() if v["status"] == "pending"), key=lambda k: order.index(items[k]["batch"]))
    print(json.dumps({"summary": ix["summary"], "next": pend[:10], "nextBatch": items[pend[0]]["batch"] if pend else None}, indent=1))


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("init"); p.add_argument("items"); p.set_defaults(f=init)
    p = sp.add_parser("prov"); p.add_argument("id"); p.add_argument("--prompt-file", required=True); p.add_argument("--tool", default="codex image tool"); p.add_argument("--model", default="unknown"); p.add_argument("--attempts", type=int, default=1); p.set_defaults(f=prov)
    p = sp.add_parser("show"); p.add_argument("items"); p.add_argument("id"); p.set_defaults(f=show)
    p = sp.add_parser("status"); p.set_defaults(f=status)
    p = sp.add_parser("fit"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("size"); p.add_argument("--alpha", action="store_true"); p.add_argument("--q", type=int, default=92); p.add_argument("--gravity", default="center"); p.set_defaults(f=fit)
    p = sp.add_parser("key"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("--hex", default="FF00FF"); p.add_argument("--tol", type=float, default=70); p.set_defaults(f=key)
    p = sp.add_parser("stitch"); p.add_argument("dst"); p.add_argument("panels", nargs=3); p.add_argument("--w", type=int, default=4800); p.add_argument("--h", type=int, default=1200); p.add_argument("--overlap", type=int, default=96); p.set_defaults(f=stitch)
    p = sp.add_parser("wrap"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("--band", type=int, default=96); p.add_argument("--both", action="store_true"); p.set_defaults(f=wrap)
    p = sp.add_parser("solid"); p.add_argument("dst"); p.add_argument("size"); p.add_argument("hex"); p.add_argument("--grain", action="store_true"); p.set_defaults(f=solid)
    p = sp.add_parser("place"); p.add_argument("src"); p.add_argument("dst"); p.add_argument("size"); p.add_argument("hex"); p.add_argument("px", type=int); p.set_defaults(f=place)
    p = sp.add_parser("mono"); p.add_argument("src"); p.add_argument("dst"); p.set_defaults(f=mono)
    p = sp.add_parser("check"); p.add_argument("path"); p.add_argument("size"); p.add_argument("--alpha", action="store_true"); p.add_argument("--lint", default=""); p.add_argument("--wrap", action="store_true"); p.set_defaults(f=check)
    p = sp.add_parser("record"); p.add_argument("id"); p.add_argument("status", choices=["pending", "done", "skipped", "failed"]); p.add_argument("--notes"); p.add_argument("--model"); p.add_argument("--attempts", type=int); p.add_argument("--ocr"); p.set_defaults(f=record)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
```

## 10. The asset list: write the lines below verbatim to `/tmp/taxila-gen/assets.md`

**Line format:** `- <id> | <W>x<H> <ext> [flags] | ref: <ids or -> | <subject>`

- **Flags:**
  - `alpha`: transparent PNG;
  - `skin`: visible skin (lamp-hue reported, not failed);
  - `script`: made by the helper, no image model;
  - `tile`: a panorama from 3 panels;
  - `wrap`: the edges must tile.
- **Paths:**
  - `public/assets/gen/<id>.<ext>`;
  - except `teacher-ref/<rest>`, which goes to `art/gen/teacher/<rest>.<ext>`.
- **Teacher lines:** `{c}` means asha, arjun and uma, and `{stage}` means young for Asha and older for the other
  two. The helper expands both.

### B00: Style keys: the three anchors every later image is matched against, plus the phone crop of the world anchor (4)

- bg/home-young-wide | 2560x1440 webp | ref: - | A sunlit Indian home courtyard in calm morning light. Limewash walls in warm off-white with soft cream light from the upper left. A neem tree at the right edge with its leaf shadows on the wall. An open wooden veranda doorway at the LEFT, EMPTY and calm inside (the teacher is placed there by the app). White rice-flour kolam dots on the floor near the edges only. Two terracotta pots with leafy plants and a magenta bougainvillea spray. A charpai with teal cotton-tape weave at the far edge. A band of pale day sky (#A9D8E8) at the top. Painted garden beds along the lower right wall edge (bare soil, the app makes them tappable on desktop).
- bg/home-young-phone | 1440x2560 webp | ref: bg/home-young-wide | the same scene as bg/home-young-wide, recomposed tall
- avatars/red-panda | 512x512 png alpha | ref: - | a red panda sitting, rust-red fur (deep rust, not orange), ringed tail curled round; disc tint teal
- picto/home | 256x256 png alpha | ref: avatars/red-panda | a small clay house with a sloped tiled roof

### B01: Young world backgrounds + stage-young + garden panorama (12)

- bg/home-young-rest-wide | 2560x1440 webp | ref: bg/home-young-wide | The SAME courtyard as bg/home-young (same walls, tree, doorway, pots, charpai, same camera) in late-afternoon cream light with longer soft shadows. An open book with blank pages resting on the charpai. The doorway is still empty. Calm, slightly quieter than the morning version.
- bg/home-young-rest-phone | 1440x2560 webp | ref: bg/home-young-wide, bg/home-young-rest-wide | the same scene as bg/home-young-rest-wide, recomposed tall
- bg/home-older-wide | 2560x1440 webp | ref: bg/home-young-wide | A flat Indian rooftop at dusk, editorial and muted. A black plastic water tank on a low brick stand at one edge, a simple painted iron rail, a telescope on a tripod pointing at the sky, a string of UNLIT bulbs on a wire, city lights far below as tiny cool-white and soft-rose points (never orange street lights). Deep indigo sky (#26304A to #0F1A33) with a faint rose-violet glow at the horizon (never orange or gold). Lots of negative space.
- bg/home-older-phone | 1440x2560 webp | ref: bg/home-young-wide, bg/home-older-wide | the same scene as bg/home-older-wide, recomposed tall
- bg/home-older-rest-wide | 2560x1440 webp | ref: bg/home-older-wide | The SAME rooftop as bg/home-older (same tank, rail, telescope, camera) later at night: deeper navy sky (#0F1A33), the telescope pointing straight up, no lit signs below, a few soft city lights. No stars painted (the app owns stars).
- bg/home-older-rest-phone | 1440x2560 webp | ref: bg/home-older-wide, bg/home-older-rest-wide | the same scene as bg/home-older-rest-wide, recomposed tall
- bg/who-wide | 2560x1440 webp | ref: bg/home-young-wide | The same home's courtyard gate seen from outside: an open weathered wooden gate in greyed walnut, a short stone path, the sunlit courtyard visible beyond (same limewash walls and neem tree as bg/home-young), a calm arch over the gate. The lower two-thirds are calm and low-detail for avatar tiles.
- bg/who-phone | 1440x2560 webp | ref: bg/home-young-wide, bg/who-wide | the same scene as bg/who-wide, recomposed tall
- bg/practice-wide | 2560x1440 webp | ref: bg/home-young-wide | A quiet courtyard corner of the same home: a big BLANK black slate on a simple wooden easel at one edge, a woven floor mat, a closed steel tiffin, soft cream light. The centre is calm and empty.
- bg/practice-phone | 1440x2560 webp | ref: bg/home-young-wide, bg/practice-wide | the same scene as bg/practice-wide, recomposed tall
- bg/stage-young | 1600x1600 webp | ref: bg/home-young-wide | A softly out-of-focus veranda at dusk seen behind a head-and-shoulders position: deep dusk blue (#26304A) overall, the edge of a large BLANK green chalkboard (#1F3B30) at one side, a warm soft pool of CREAM light centred at x 50%, y 38%. The centre is plain and smooth (her face goes there). No person.
- bg/garden-panorama | 4800x1200 webp tile wrap | ref: bg/home-young-wide | A long kitchen-garden strip along the courtyard wall of the same home in morning light: a row of low brick-edged beds of BARE dark soil (the app places plants on them), a garden tap with a steel bucket, a neem tree at one end, limewash wall behind. No plants in the beds. The LEFT and RIGHT edges must join seamlessly (it scrolls).

### B02: Older and neutral backgrounds, stage-older, sky, onboarding edge, landing hero, parent header (9)

- bg/ask-wide | 2560x1440 webp | ref: bg/home-older-wide | A study desk on the same rooftop at dusk: an open textbook with BLANK pages, a pencil, a steel tumbler, the rail and indigo sky behind, muted and editorial. The centre third is calm for the text field.
- bg/ask-phone | 1440x2560 webp | ref: bg/home-older-wide, bg/ask-wide | the same scene as bg/ask-wide, recomposed tall
- bg/notebook-shelf-wide | 2560x1440 webp | ref: bg/home-young-wide | A wooden wall shelf in desaturated greyed-walnut wood holding a few CLOSED blank cloth-bound notebooks (teal, rose, leaf, stone covers, no labels) and one small potted plant, soft cream light from the upper left, limewash wall. The centre is calm for the page stack.
- bg/notebook-shelf-phone | 1440x2560 webp | ref: bg/home-young-wide, bg/notebook-shelf-wide | the same scene as bg/notebook-shelf-wide, recomposed tall
- bg/stage-older | 1600x1600 webp | ref: bg/stage-young | A softly out-of-focus study wall in evening light: a bookshelf with BLANK spines, a window with neem leaves, the same dusk blue (#26304A) and the same cream light pool at x 50%, y 38% as bg/stage-young. The centre is plain and smooth. No person.
- bg/sky-panel | 2400x1600 webp | ref: bg/home-older-wide | A calm deep-navy night sky (#0F1A33) with faint painted clouds near the bottom and a far city skyline silhouette with NO lit signs. NO stars, no moon, no planets: the sky is empty for the app's stars.
- bg/onboarding-edge | 1200x2400 webp skin | ref: bg/home-young-wide | A quiet vertical edge strip: a parent's hand resting near a face-down phone on a kitchen table, a steel cup of chai, very low contrast, everything on the RIGHT edge; the left two-thirds are near-empty warm paper (#F6F3EC) tone.
- bg/landing-hero | 2400x1400 webp | ref: bg/home-older-wide | A warm study desk at dusk, editorial: a child's BLANK notebook and a pencil at the lower left, a steel tumbler, a window with dusk indigo sky, soft cream light from the upper left. An EMPTY calm space centre-right where two portraits are composited. No person.
- bg/parent-header | 2400x600 webp | ref: bg/home-young-wide | A quiet limewash wall with a single leafy plant in a terracotta pot at the right edge and soft cream light from the upper left; very low detail, most of the band is plain wall.

### B03: Young pictograms (incl. picture-PIN set) (50)

- picto/pause | 256x256 png alpha | ref: picto/home | a resting open palm enclosed inside a soft circle
- picto/mic | 256x256 png alpha | ref: picto/home | a round microphone with a wooden handle
- picto/ear | 256x256 png alpha | ref: picto/home | a listening ear
- picto/hear-again | 256x256 png alpha | ref: picto/home | an ear with a curved arrow around it
- picto/slower | 256x256 png alpha | ref: picto/home | a tortoise walking
- picto/your-turn | 256x256 png alpha | ref: picto/home | an open hand, palm up, offering
- picto/tap | 256x256 png alpha | ref: picto/home | a finger tapping, pointing UP
- picto/eraser | 256x256 png alpha | ref: picto/home | a pencil eraser
- picto/pencil | 256x256 png alpha | ref: picto/home | a pencil
- picto/captions | 256x256 png alpha | ref: picto/home | speech lines inside a speech bubble, NO letters
- picto/watch | 256x256 png alpha | ref: picto/home | an eye
- picto/hint | 256x256 png alpha | ref: picto/home | a lightbulb of cool white glass, NOT yellow, not lit yellow
- picto/choices | 256x256 png alpha | ref: picto/home | three blank cards fanned
- picto/show-me-how | 256x256 png alpha | ref: picto/home | a hand holding a chalk stick
- picto/yes | 256x256 png alpha | ref: picto/home | a tick made of a twig
- picto/no | 256x256 png alpha | ref: picto/home | two crossed twigs, natural wood colour, never red
- picto/garden | 256x256 png alpha | ref: picto/home | a watering can
- picto/practice | 256x256 png alpha | ref: picto/home | a slate
- picto/notebook | 256x256 png alpha | ref: picto/home | a closed notebook
- picto/help | 256x256 png alpha | ref: picto/home | a child and a grown-up side by side, simple shapes
- picto/call | 256x256 png alpha | ref: picto/home | a phone handset and a grown-up silhouette
- picto/sound-on | 256x256 png alpha | ref: picto/home | a speaker with sound lines
- picto/sound-off | 256x256 png alpha | ref: picto/home | a speaker with a soft line through it
- picto/ai-teacher | 256x256 png alpha | ref: picto/home | a small rounded laptop with a warm cream glow, no face
- picto/who-sees | 256x256 png alpha | ref: picto/home | an eye beside a grown-up silhouette
- picto/list | 256x256 png alpha | ref: picto/home | three stacked blank strips
- picto/arrow-left | 256x256 png alpha | ref: picto/home | a soft arrow pointing left
- picto/arrow-right | 256x256 png alpha | ref: picto/home | a soft arrow pointing right
- picto/water-glass | 256x256 png alpha | ref: picto/home | a steel glass of water
- picto/stretch | 256x256 png alpha | ref: picto/home | a pair of arms stretching up
- picto/finish | 256x256 png alpha | ref: picto/home | a closed notebook with a tick-shaped ribbon
- picto/calmer | 256x256 png alpha | ref: picto/home | a single feather floating, still
- picto/switch-learner | 256x256 png alpha | ref: picto/home | two round picture discs with a curved arrow between them
- picto/more-pictures | 256x256 png alpha | ref: picto/home | three round picture discs fanned
- picto/send | 256x256 png alpha | ref: picto/home | a paper plane
- picto/subject-maths | 256x256 png alpha | ref: picto/home | a compass from a geometry box
- picto/subject-english | 256x256 png alpha | ref: picto/home | a closed cloth-bound book
- picto/subject-hindi | 256x256 png alpha | ref: picto/home | a small blank slate with a chalk stick, no script
- picto/subject-evs | 256x256 png alpha | ref: picto/home | a potted sprout
- picto/subject-science | 256x256 png alpha | ref: picto/home | a magnifying glass
- picto/subject-social-science | 256x256 png alpha | ref: picto/home | a small globe with no borders
- picto/pin-kite | 256x256 png alpha | ref: picto/home | a diamond kite
- picto/pin-boat | 256x256 png alpha | ref: picto/home | a paper boat
- picto/pin-umbrella | 256x256 png alpha | ref: picto/home | an open umbrella
- picto/pin-cup | 256x256 png alpha | ref: picto/home | a steel cup
- picto/pin-fish | 256x256 png alpha | ref: picto/home | a small fish
- picto/pin-leaf | 256x256 png alpha | ref: picto/home | a leaf
- picto/pin-ball | 256x256 png alpha | ref: picto/home | a ball
- picto/pin-bus | 256x256 png alpha | ref: picto/home | a small bus
- picto/pin-flower | 256x256 png alpha | ref: picto/home | a five-petal flower

### B04: Child avatars (23)

- avatars/tiger-cub | 512x512 png alpha | ref: avatars/red-panda | a tiger cub lying with paws forward, fur painted deep rust-terracotta (never bright orange or gold), dark stripes; disc tint rose
- avatars/elephant-calf | 512x512 png alpha | ref: avatars/red-panda | an elephant calf with its trunk curled up, soft grey; disc tint leaf
- avatars/river-dolphin | 512x512 png alpha | ref: avatars/red-panda | a Ganges river dolphin arcing out of water, grey-pink, long slim beak; disc tint sky
- avatars/hornbill | 512x512 png alpha | ref: avatars/red-panda | an Indian grey hornbill on a branch, soft greys, dark grey casque (no yellow casque); disc tint terracotta
- avatars/peacock | 512x512 png alpha | ref: avatars/red-panda | a peacock in profile with its tail folded, teal and blue body, tail shown as a closed sweep (no fan of eyes); disc tint stone
- avatars/turtle | 512x512 png alpha | ref: avatars/red-panda | a small turtle with a leaf-green shell walking; disc tint teal
- avatars/butterfly | 512x512 png alpha | ref: avatars/red-panda | a blue Mormon butterfly, wings open, deep blue and black; disc tint rose
- avatars/squirrel | 512x512 png alpha | ref: avatars/red-panda | an Indian palm squirrel holding a nut, grey-brown with three pale back stripes; disc tint leaf
- avatars/camel | 512x512 png alpha | ref: avatars/red-panda | a young camel sitting, pale greyish-fawn coat (low saturation, never golden sand); disc tint sky
- avatars/rhino | 512x512 png alpha | ref: avatars/red-panda | a one-horned rhino calf, slate grey, gentle; disc tint terracotta
- avatars/snow-leopard | 512x512 png alpha | ref: avatars/red-panda | a snow leopard cub with a thick tail, pale grey with soft rosettes; disc tint stone
- avatars/kite | 512x512 png alpha | ref: avatars/red-panda | a diamond paper kite with a tail, teal and rose, string trailing (no yellow); disc tint teal
- avatars/rocket | 512x512 png alpha | ref: avatars/red-panda | a small rounded rocket with a teal body, cream nose and a soft white puff below; disc tint rose
- avatars/football | 512x512 png alpha | ref: avatars/red-panda | a classic football on grass, white and ink-blue panels, no logo; disc tint leaf
- avatars/cricket-bat | 512x512 png alpha | ref: avatars/red-panda | a cricket bat in pale low-saturation willow with a rose grip and a red ball, no logo, no stickers; disc tint sky
- avatars/mango | 512x512 png alpha | ref: avatars/red-panda | a raw green mango (kairi) with two leaves and a soft rose blush (not ripe yellow); disc tint terracotta
- avatars/sunflower | 512x512 png alpha | ref: avatars/red-panda | a white-petalled sunflower variety with a dark centre (cream-white petals, never yellow); disc tint stone
- avatars/mountain | 512x512 png alpha | ref: avatars/red-panda | a snowy mountain peak with a pine at its foot; disc tint teal
- avatars/sailboat | 512x512 png alpha | ref: avatars/red-panda | a small sailboat with a white sail on calm water; disc tint rose
- avatars/auto-rickshaw | 512x512 png alpha | ref: avatars/red-panda | an Indian auto-rickshaw seen three-quarter, leaf-green body and cream roof, no number plate, no text; disc tint leaf
- avatars/bicycle | 512x512 png alpha | ref: avatars/red-panda | a simple bicycle with a front basket, ink-blue frame; disc tint sky
- avatars/telescope | 512x512 png alpha | ref: avatars/red-panda | a small telescope on a tripod, ink-blue tube, steel fittings (no brass); disc tint terracotta
- avatars/paintbrush | 512x512 png alpha | ref: avatars/red-panda | a paintbrush with a teal handle and a wet rose tip, a small dab of paint; disc tint stone

### B05: Interest tiles and home-task objects (22)

- interests/cricket | 512x512 png alpha | ref: avatars/red-panda | a cricket bat in pale willow, a red ball and three stumps on a patch of grass, no logos
- interests/football | 512x512 png alpha | ref: avatars/red-panda | a football resting on grass beside a small cone
- interests/space | 512x512 png alpha | ref: avatars/red-panda | a ringed planet in teal and rose with a small cream rocket passing it
- interests/animals | 512x512 png alpha | ref: avatars/red-panda | a friendly dog and a cat sitting together
- interests/drawing | 512x512 png alpha | ref: avatars/red-panda | a few crayons (teal, rose, leaf, sky, no yellow) beside a BLANK sketchbook
- interests/music | 512x512 png alpha | ref: avatars/red-panda | a small harmonium in dark wood and a small hand drum
- interests/dance | 512x512 png alpha | ref: avatars/red-panda | a pair of SILVER ankle bells (ghungroo) and a twirling rose scarf in mid-air, no person
- interests/cooking | 512x512 png alpha | ref: avatars/red-panda | a rolling pin and a small steel bowl of flour on a board
- interests/trains | 512x512 png alpha | ref: avatars/red-panda | a blue passenger train crossing a small arched bridge
- interests/stories | 512x512 png alpha | ref: avatars/red-panda | an open book with BLANK pages and a small desk lamp glowing cream-white
- interests/building | 512x512 png alpha | ref: avatars/red-panda | a small tower of wooden blocks painted teal, rose, leaf and stone
- interests/nature | 512x512 png alpha | ref: avatars/red-panda | a green leaf, a red ladybird and a smooth grey pebble
- home/roti | 384x384 png alpha | ref: avatars/red-panda | a single pale wheat roti with a few light-brown spots (low saturation, never golden)
- home/steel-plate | 384x384 png alpha | ref: avatars/red-panda | an empty round steel plate
- home/paper-strip | 384x384 png alpha | ref: avatars/red-panda | a long strip of plain cream paper, slightly curled
- home/bowl-of-grapes | 384x384 png alpha | ref: avatars/red-panda | a small steel bowl of green grapes
- home/matchbox-closed | 384x384 png alpha | ref: avatars/red-panda | a closed plain ink-blue matchbox with NO printing
- home/measuring-cup | 384x384 png alpha | ref: avatars/red-panda | a clear measuring cup with NO markings
- home/water-bottle | 384x384 png alpha | ref: avatars/red-panda | a steel water bottle
- home/rope | 384x384 png alpha | ref: avatars/red-panda | a coiled grey-blue cotton rope (not golden jute)
- home/ladoos-on-plate | 384x384 png alpha | ref: avatars/red-panda | a few pale coconut ladoos on a small steel plate (no yellow or orange sweets)
- home/chocolate-bar-plain-wrapper | 384x384 png alpha | ref: avatars/red-panda | a chocolate bar in a plain dusty-rose wrapper with NO printing

### B06: Subject spots and topic motifs, part 1 (35)

- subjects/maths | 768x768 png alpha | ref: avatars/red-panda | an open steel geometry box with a compass, a clear protractor WITHOUT any markings, and a red-and-black striped pencil (no brand)
- subjects/science | 768x768 png alpha | ref: avatars/red-panda | a glass jar with a sprouting bean, a magnifying glass and a red horseshoe magnet
- subjects/english | 768x768 png alpha | ref: avatars/red-panda | two cloth-bound books (teal and rose covers, no titles) and a fountain pen; blank pages
- subjects/hindi | 768x768 png alpha | ref: avatars/red-panda | a small black slate with a BLANK surface, a white chalk stick and a small steel bell (no script anywhere)
- subjects/evs | 768x768 png alpha | ref: avatars/red-panda | a potted mint plant, a tin watering can and a small house sparrow on the pot rim
- subjects/social-science | 768x768 png alpha | ref: avatars/red-panda | a globe with soft abstract continents in leaf green on sky-blue seas with NO borders and no recognisable country shapes, an old steel compass and a terracotta clay pot
- topics/hide-and-seek | 512x512 png alpha | ref: avatars/red-panda | a curious kitten peeking out from behind a woven basket
- topics/long-and-round | 512x512 png alpha | ref: avatars/red-panda | a long bamboo stick lying beside a rolling ball and a round steel plate standing on its edge
- topics/mango-basket | 512x512 png alpha | ref: avatars/red-panda | a shallow woven basket heaped with raw green mangoes with a rosy blush, too many to count at a glance
- topics/stick-bundles | 512x512 png alpha | ref: avatars/red-panda | bundles of thin sticks tied with teal string beside a small loose pile of sticks; amounts are not countable at a glance
- topics/two-bowls | 512x512 png alpha | ref: avatars/red-panda | two small steel bowls of green peas with a few peas mid-way between them, as if being moved
- topics/vegetable-basket | 512x512 png alpha | ref: avatars/red-panda | a basket of fresh vegetables: a brinjal, a tomato, okra, a cauliflower and a radish
- topics/hand-span | 512x512 png alpha | ref: avatars/red-panda | a child's hand spread flat beside a ribbon laid along a floor tile, and a pair of small footprints
- topics/bead-pattern | 512x512 png alpha | ref: avatars/red-panda | a string of wooden beads in a repeating teal, rose and leaf sequence, loosely coiled
- topics/daily-clock | 512x512 png alpha | ref: avatars/red-panda | a round wall clock with NO numerals and no tick marks, two simple hands, a small cream sun and a small crescent moon on either side
- topics/equal-plates | 512x512 png alpha | ref: avatars/red-panda | a row of identical small steel plates, each holding the same small heap of peanuts
- topics/vegetable-cart | 512x512 png alpha | ref: avatars/red-panda | a wooden vegetable cart with baskets under a cloth awning; no price tags, no money, no signs
- topics/toy-sorting | 512x512 png alpha | ref: avatars/red-panda | toys sorted into three cloth baskets: balls in one, blocks in another, soft toys in the third
- topics/beach-shells | 512x512 png alpha | ref: avatars/red-panda | a beach with scattered shells, a small bucket and gentle waves
- topics/solid-shapes | 512x512 png alpha | ref: avatars/red-panda | a ball, a box, a steel tin and a clay cone arranged together
- topics/shadow-shapes | 512x512 png alpha | ref: avatars/red-panda | a wooden block and a steel tin casting long soft shadows that make clean flat shapes
- topics/paper-shapes | 512x512 png alpha | ref: avatars/red-panda | a scatter of cut coloured-paper shapes: a circle, a triangle, a square and a long strip
- topics/stick-lines | 512x512 png alpha | ref: avatars/red-panda | sticks standing, lying and leaning against a wall, a string stretched between two pegs
- topics/paper-bunting | 512x512 png alpha | ref: avatars/red-panda | a string of triangular paper bunting in teal, rose and leaf with a few paper flowers (not tied to any festival)
- topics/balance-jug | 512x512 png alpha | ref: avatars/red-panda | a simple two-pan balance with a steel jug and a cup beside it
- topics/three-seasons | 512x512 png alpha | ref: avatars/red-panda | an umbrella, a woollen cap and a hand fan together
- topics/fair-wheel | 512x512 png alpha | ref: avatars/red-panda | a small wooden giant wheel and a striped stall awning at a fair, no signs
- topics/pebble-groups | 512x512 png alpha | ref: avatars/red-panda | smooth pebbles placed in neat small groups on a cloth
- topics/frog-stones | 512x512 png alpha | ref: avatars/red-panda | a small green frog mid-jump between flat stepping stones in a line across a pond
- topics/roti-share | 512x512 png alpha | ref: avatars/red-panda | a whole pale roti on a steel plate with a small butter knife beside it (the roti is not cut)
- topics/butterfly-symmetry | 512x512 png alpha | ref: avatars/red-panda | a blue butterfly with wings fully open, perfectly mirrored left and right
- topics/transport-toys | 512x512 png alpha | ref: avatars/red-panda | a toy bus, a toy train engine and a toy boat
- topics/animal-figures | 512x512 png alpha | ref: avatars/red-panda | small carved wooden figurines of an elephant, a tiger and a leopard
- topics/clean-lane | 512x512 png alpha | ref: avatars/red-panda | a tidy lane corner with a grass broom, a lidded dustbin and a potted plant
- topics/chappals-door | 512x512 png alpha | ref: avatars/red-panda | many pairs of chappals of different sizes placed neatly by a doorstep

### B07: Topic motifs, part 2 (29)

- topics/plant-roots | 512x512 png alpha | ref: avatars/red-panda | a young plant lifted from soil showing its roots, a small trowel beside it
- topics/tree-home | 512x512 png alpha | ref: avatars/red-panda | a tree trunk with a squirrel on it, a bird's nest on a branch and an ant trail at the roots
- topics/matka-water | 512x512 png alpha | ref: avatars/red-panda | a terracotta matka with a steel tumbler and a ladle, a few water drops
- topics/thali-food | 512x512 png alpha | ref: avatars/red-panda | a steel thali with small bowls of dal, rice and vegetables and a roti
- topics/healthy-habits | 512x512 png alpha | ref: avatars/red-panda | a toothbrush in a steel cup, a bar of soap and a skipping rope
- topics/materials | 512x512 png alpha | ref: avatars/red-panda | a glass tumbler, a wooden spoon, a steel spoon and a folded cotton cloth side by side
- topics/potter-wheel | 512x512 png alpha | ref: avatars/red-panda | a clay pot on a potter's wheel with wet clay
- topics/reuse-bag | 512x512 png alpha | ref: avatars/red-panda | a cloth shopping bag, a glass jar reused as a pencil holder, and a small compost pot
- topics/lane-shop | 512x512 png alpha | ref: avatars/red-panda | a small neighbourhood lane with a corner shop shutter half open, a red post box with no writing and a parked bicycle
- topics/float-sink | 512x512 png alpha | ref: avatars/red-panda | a tub of water with a paper boat floating and a stone resting at the bottom
- topics/land-forms | 512x512 png alpha | ref: avatars/red-panda | a small diorama: a snowy mountain, pale stone-pink sand dunes, and a strip of coast with a coconut palm
- topics/sun-moon | 512x512 png alpha | ref: avatars/red-panda | a cream-white sun and a crescent moon side by side above a rooftop rail
- topics/open-book | 512x512 png alpha | ref: avatars/red-panda | an open book with BLANK pages and a bookmark ribbon
- topics/singing-bird | 512x512 png alpha | ref: avatars/red-panda | a small bird singing on a branch, beak open
- topics/two-kites | 512x512 png alpha | ref: avatars/red-panda | two kites flying side by side, their strings close together
- topics/rain-clouds | 512x512 png alpha | ref: avatars/red-panda | soft rain clouds over a small pond with rain rings
- topics/envelope-letter | 512x512 png alpha | ref: avatars/red-panda | a closed paper envelope with NO writing and no stamp, tied with string
- topics/garden-snail | 512x512 png alpha | ref: avatars/red-panda | a snail on a broad leaf in a garden
- topics/jungle-friends | 512x512 png alpha | ref: avatars/red-panda | a monkey on a branch, a crow on a fence post and a deer at the edge
- topics/street-games | 512x512 png alpha | ref: avatars/red-panda | a stack of flat lagori stones with a soft ball and a coiled tug rope
- topics/rocket-moon | 512x512 png alpha | ref: avatars/red-panda | a small rocket flying toward a large pale moon
- topics/sweets-plate | 512x512 png alpha | ref: avatars/red-panda | a steel plate of pale sweets: white coconut barfi and rose-pink peda (no yellow or orange sweets)
- topics/grandparents-shawl | 512x512 png alpha | ref: avatars/red-panda | a pair of reading glasses resting on a folded wool shawl beside a walking stick
- topics/paint-palette | 512x512 png alpha | ref: avatars/red-panda | a paint palette with teal, rose, leaf, sky and stone paint and a brush
- topics/bicycle | 512x512 png alpha | ref: avatars/red-panda | a child's bicycle leaning on its stand
- topics/big-tree | 512x512 png alpha | ref: avatars/red-panda | a big neem tree with a wide shady canopy
- topics/farm-field | 512x512 png alpha | ref: avatars/red-panda | a green field with young crop rows, a small hand plough resting at the edge, no person
- topics/swing | 512x512 png alpha | ref: avatars/red-panda | a wooden swing hanging from a tree branch on two ropes
- topics/braille-hand | 512x512 png alpha | ref: avatars/red-panda | fingertips reading raised dots on a blank cream page

### B08: Empty, system and trouble states (16)

- states/notebook-empty | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a closed cloth notebook with a ribbon bookmark, waiting on a desk
- states/garden-empty | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | one bed of bare soil, a BLANK seed packet and a small trowel
- states/sky-empty | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a child's telescope on a windowsill pointing at a dark empty sky, no stars
- states/no-internet | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a paper boat resting on a still pond with a few ripples
- states/mic-off | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a microphone lying on a soft cushion, quiet
- states/sound-off | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a small speaker with a paper flower in front of it
- states/done-for-today | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a closed school bag by a door in evening light, small shoes placed neatly
- states/rest-until-tomorrow | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a desk lamp switched off, a window with a crescent moon (no face on the moon)
- states/something-wrong | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a tangled ball of teal wool with a cat's paw reaching in, gentle and funny
- states/lessons-empty-parent | 1024x768 png alpha skin | ref: avatars/red-panda, bg/home-young-wide | an adult's hand placing a fresh closed notebook on a child's desk
- states/ai-teacher-card | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a friendly rounded laptop on a desk with a soft cream glow and a small potted plant; the screen is BLANK and warm; no face on the screen
- states/talk-to-grown-up | 1024x768 png alpha skin | ref: avatars/red-panda, bg/home-young-wide | a child and a grown-up sitting side by side on a step, seen from behind, the grown-up's arm around the child, the child wearing a small behind-the-ear hearing aid; calm, safe, warm
- states/permission-mic | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | an abstract settings toggle switch on a blank panel, switching on, beside a small microphone shape
- states/volume-keys | 1024x768 png alpha skin | ref: avatars/red-panda, bg/home-young-wide | a hand holding a phone, thumb on the side volume button, the screen blank
- states/404 | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | an empty winding garden path between terracotta pots, inviting, nobody on it
- states/help-calm | 1024x768 png alpha | ref: avatars/red-panda, bg/home-young-wide | a soft, plain warm room corner with a lamp switched on (cream-white light), almost abstract

### B09: Garden, sky seal, protégés (25)

- garden/rose-bush-seed | 512x768 png alpha | ref: avatars/red-panda | a soil mound with a BLANK seed packet on a stick
- garden/rose-bush-sprout | 512x768 png alpha | ref: garden/rose-bush-seed | a soil mound with two small leaves
- garden/rose-bush-bloom | 512x768 png alpha | ref: garden/rose-bush-seed | a small rose bush with dusty-rose flowers
- garden/rose-bush-fruit | 512x768 png alpha | ref: garden/rose-bush-seed | a full rose bush with many open roses and a few rose hips
- garden/tomato-seed | 512x768 png alpha | ref: garden/rose-bush-seed | a soil mound with a BLANK seed packet on a stick
- garden/tomato-sprout | 512x768 png alpha | ref: garden/rose-bush-seed | a soil mound with two small leaves
- garden/tomato-bloom | 512x768 png alpha | ref: garden/rose-bush-seed | a young tomato plant in flower with pale cream blossoms (never yellow)
- garden/tomato-fruit | 512x768 png alpha | ref: garden/rose-bush-seed | a tomato plant with ripe red tomatoes
- garden/guava-tree-seed | 512x768 png alpha | ref: garden/rose-bush-seed | a soil mound with a BLANK seed packet on a stick
- garden/guava-tree-sprout | 512x768 png alpha | ref: garden/rose-bush-seed | a soil mound with two small leaves
- garden/guava-tree-bloom | 512x768 png alpha | ref: garden/rose-bush-seed | a small guava sapling with white flowers
- garden/guava-tree-fruit | 512x768 png alpha | ref: garden/rose-bush-seed | a small guava tree with pale green guavas
- garden/sunbird | 256x256 png alpha | ref: garden/rose-bush-seed | A small purple sunbird perched, looking curious, side view, feet at the bottom edge so it can sit on a plant. Transparent background.
- garden/chapter-seal | 768x768 png alpha | ref: garden/rose-bush-seed | A small woven garden gate of weathered grey-green bamboo with a dark iron bell hanging from its top bar (no brass, no gold), a few leaves twined on it. Transparent background.
- garden/watering-can | 512x512 png alpha | ref: garden/rose-bush-seed | A dented grey tin watering can with a rose spout. Transparent background.
- sky/chapter-seal | 768x768 png alpha | ref: bg/sky-panel | A softly glowing crest made of cool white and pale blue light and dust, like a gentle halo ring with a faint inner weave; no star points, no letters, never gold. Transparent background (the glow fades to full transparency).
- protege/sprout-sprite | 512x512 png alpha | ref: avatars/red-panda | a small leaf creature with a sprout on its head, calm and attentive, simple dot eyes and a small smile
- protege/sprout-sprite-puzzled | 512x512 png alpha | ref: protege/sprout-sprite | a small leaf creature with a sprout on its head, head tilted, one small question-shaped curl of air above it (no question mark glyph), curious, never sad
- protege/sprout-sprite-happy | 512x512 png alpha | ref: protege/sprout-sprite | a small leaf creature with a sprout on its head, delighted, eyes crescent-shaped, arms or paws up
- protege/cloud-pup | 512x512 png alpha | ref: avatars/red-panda | a small soft cloud with four little paws, calm and attentive, simple dot eyes and a small smile
- protege/cloud-pup-puzzled | 512x512 png alpha | ref: protege/cloud-pup | a small soft cloud with four little paws, head tilted, one small question-shaped curl of air above it (no question mark glyph), curious, never sad
- protege/cloud-pup-happy | 512x512 png alpha | ref: protege/cloud-pup | a small soft cloud with four little paws, delighted, eyes crescent-shaped, arms or paws up
- protege/pebble-friend | 512x512 png alpha | ref: avatars/red-panda | a round smooth grey stone creature, calm and attentive, simple dot eyes and a small smile
- protege/pebble-friend-puzzled | 512x512 png alpha | ref: protege/pebble-friend | a round smooth grey stone creature, head tilted, one small question-shaped curl of air above it (no question mark glyph), curious, never sad
- protege/pebble-friend-happy | 512x512 png alpha | ref: protege/pebble-friend | a round smooth grey stone creature, delighted, eyes crescent-shaped, arms or paws up

### B10: Landing, promises, onboarding tiles, brand mark, icons, splash (17)

- onboarding/handover-now | 768x768 png alpha skin | ref: states/talk-to-grown-up | An adult hand passing a phone (blank screen) into a child's two cupped hands, seen close, warm and calm. Transparent background.
- onboarding/handover-later | 768x768 png alpha | ref: onboarding/handover-now | A phone (blank screen) resting face-up on a folded cloth beside a steel cup, quiet, nobody there. Transparent background.
- landing/listening | 1600x1200 webp skin | ref: bg/landing-hero | a 10-year-old Indian child using a wheelchair, at a desk with a phone propped up, listening and smiling (the wheelchair is simply part of the scene, not the subject), a notebook open with BLANK pages, cream-white evening lamp light; the phone screen is blank
- landing/parent-reading | 1600x1200 webp skin | ref: bg/landing-hero | an Indian parent at a kitchen table reading a phone with a calm, pleased expression, a steel cup of chai beside them; the screen is blank light
- landing/notebook | 1600x1200 webp skin | ref: bg/landing-hero | a child's hands drawing in a notebook, soft abstract marks only (no letters, digits or shapes that read as writing)
- landing/og-share | 1200x630 png | ref: bg/landing-hero | The landing-hero desk scene (same desk, notebook, tumbler, dusk window) cropped wide to 1200x630, the calm space kept centre-right. No text, no logo.
- promises/ai-honest | 768x768 png alpha | ref: states/ai-teacher-card | a small rounded laptop with a gentle cream glow beside a child's open hand
- promises/you-see | 768x768 png alpha | ref: states/ai-teacher-card | a grown-up's hand and a child's hand resting together on the same open notebook with blank pages, warm and open, seen from above (sharing, never watching from outside)
- promises/no-ads | 768x768 png alpha | ref: states/ai-teacher-card | a quiet phone face down on a cushion beside a teacup
- promises/delete | 768x768 png alpha | ref: states/ai-teacher-card | a sheet of paper folding into a small paper bird that flies away
- brand/mark | 1024x1024 png alpha | ref: - | the Taxila mark: a stylised open book seen from the front whose centre spine rises into a fountain-pen nib, warm paper cream (#F6F3EC) shapes on deep ink blue (#24346E), simple, geometric-but-hand-painted edges, no letters, no lamp, no yellow, as a rounded-square ink-blue tile with the cream book-and-nib inside, centred, the tile filling 88% of the frame. Transparent outside the tile.
- brand/app-icon | 1024x1024 png | ref: brand/mark | the Taxila mark: a stylised open book seen from the front whose centre spine rises into a fountain-pen nib, warm paper cream (#F6F3EC) shapes on deep ink blue (#24346E), simple, geometric-but-hand-painted edges, no letters, no lamp, no yellow, full-bleed ink-blue square (the OS applies the mask), the cream book-and-nib centred inside the central 66% safe zone. Opaque.
- brand/adaptive-foreground | 1024x1024 png alpha | ref: brand/app-icon | ONLY the cream book-and-nib shape from brand/app-icon, centred inside the central 66% (676 px) safe circle, everything else fully transparent.
- brand/adaptive-background | 1024x1024 png script | ref: brand/app-icon | A flat deep ink blue (#24346E) square with a very faint paper grain. Opaque. May be made by script (no image model needed).
- brand/monochrome | 1024x1024 png alpha script | ref: brand/adaptive-foreground | The book-and-nib silhouette from brand/adaptive-foreground as a single flat white (#FFFFFF) shape on full transparency, same placement. Made by script from the foreground's alpha.
- brand/splash-light | 2732x2732 png script | ref: brand/mark | Flat #F6F3EC canvas with brand/mark composited dead centre at 640x640 px. Nothing else. Made by script (no image model needed).
- brand/splash-dark | 2732x2732 png script | ref: brand/mark | Flat #121418 canvas with brand/mark composited dead centre at 640x640 px. Nothing else. Made by script (no image model needed).

### B11-B13: Teacher references, one pass per character: asha = B11, arjun = B12, uma = B13 (153 lines after expansion: 51 per character × 3; the accessory sheets below make it 156). Expand {c} to the character id.

- teacher-ref/{c}/turnaround/front | 1024x1024 webp | ref: - | Head and shoulders, front view, neutral relaxed face, mouth closed, looking straight at the camera. THIS IS THE IDENTITY ANCHOR: every later image of this character is generated with this image as the reference.
- teacher-ref/{c}/turnaround/three-quarter-left | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Same character, same lighting, head and shoulders turned 45 degrees to the character's right, neutral face.
- teacher-ref/{c}/turnaround/profile-left | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Same character, full profile facing left, neutral face.
- teacher-ref/{c}/turnaround/back | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Same character from directly behind: hair and garment detail.
- teacher-ref/{c}/emotions/warm-smile | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, soft genuine smile, eyes crinkling (Duchenne: cheek raise and lower-lid raise). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/encouraging | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, small smile, brows gently raised, slight forward lean. Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/curious | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, brows raised, head tilted, interested. Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/thinking | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, looking slightly up and to the side, lips lightly pressed, calm (the THINKING floor state). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/listening | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, soft attentive face, head tilted a little (about 4 degrees), faint smile (the LISTENING floor state). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/gentle-concern | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, inner brows slightly raised, kind, NOT sad (used for content difficulty only). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/delighted | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, big open smile, eyes crinkled, joyful. Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/playful | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, a teacher sharing a gentle joke with a class: a small lopsided smile, one eyebrow lifted a little, head tilted; warm and kind, never a smirk, a wink, a coy or a flirtatious look. Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/surprised | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, eyebrows high, eyes wide, mouth slightly open, happy surprise, not fear. Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/speaking | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, mid-sentence on an open vowel, brows animated, engaged, looking at the camera (the SPEAKING floor state). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/your-turn | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, leaning in slightly toward the camera, head pitched down about 3 degrees, direct gaze, brows lightly held up, expectant and patient, never impatient (the YOUR TURN floor state). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/got-it-nod | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, a small 'got it' nod caught mid-motion, chin slightly down, soft closed mouth, neutral-warm (the HEARD receipt; identical for every answer). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/emotions/calm-help | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Head and shoulders, front three-quarter, calm, steady direct gaze, smile 0, relaxed brows, kind and serious (the safety Help sheet face). Same identity, outfit and lighting as the front turnaround.
- teacher-ref/{c}/visemes/sil | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: closed, relaxed. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/PP | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: lips pressed together. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/FF | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: lower lip tucked under the upper teeth. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/TH | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: tongue tip just behind the upper teeth. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/DD | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: teeth slightly apart, tongue tip up. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/kk | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: open, tongue back. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/CH | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: lips slightly rounded forward, teeth close. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/SS | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: teeth nearly together, lips spread. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/nn | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: slightly open, tongue up. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/RR | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: slightly rounded. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/aa | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: wide open 'aa'. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/E | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: mid open, spread. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/I | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: spread, smile-like 'ee'. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/O | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: rounded open 'oh'. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/U | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: small rounded 'oo'. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/tongue-tip-up | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: Hindi dental: mouth slightly open, tongue tip pressed against the back of the upper teeth (as in 'ta' of 'taaraa'). Same skin, lips and lighting.
- teacher-ref/{c}/visemes/tongue-curl | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: Hindi retroflex: mouth slightly open, tongue tip curled back toward the roof of the mouth. Same skin, lips and lighting.
- teacher-ref/{c}/visemes/tongue-wide | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: Hindi open 'aa' with the jaw open and the tongue lying wide and flat. Same skin, lips and lighting.
- teacher-ref/{c}/detail/eye-closeup | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Extreme close-up of one eye: lashes, lid crease, iris texture with depth, the wet line, a catch-light from the upper left. Same character.
- teacher-ref/{c}/detail/iris-flat | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | A perfectly front-on, flat, evenly lit iris and pupil disc filling the frame, no lids, no reflections, for painting the iris texture. Same character.
- teacher-ref/{c}/detail/skin-cheek | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of cheek and nose skin under soft light: natural texture, faint pores, no blemishes painted on, no make-up. Same character.
- teacher-ref/{c}/detail/lips-teeth | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of a natural open smile showing the upper teeth and lips. Same character.
- teacher-ref/{c}/detail/hair | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the hairstyle: strand clumps, flyaways, how the hair catches the key light. Same character.
- teacher-ref/{c}/detail/fabric | 1024x1024 webp wrap | ref: teacher-ref/{c}/turnaround/front | Flat seamless swatch of the outfit's main fabric, evenly lit, tileable, no print text or logos. Same character.
- teacher-ref/{c}/detail/wrinkle-smile | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the eye corner and cheek in a big smile: crow's feet and the cheek fold, for the compress wrinkle map. Same character.
- teacher-ref/{c}/detail/wrinkle-concern | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | Close-up of the brow and glabella in gentle concern: the fine inner-brow knot, for the compress wrinkle map. Same character.
- teacher-ref/{c}/poses/wave | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | waist-up, a single friendly wave with the right hand at shoulder height, warm smile. Same identity, outfit and lighting.
- teacher-ref/{c}/poses/reading | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | waist-up, sitting, reading a closed-cover book held low (no text visible), relaxed. Same identity, outfit and lighting.
- teacher-ref/{c}/poses/watering-can | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | waist-up, holding a tin watering can, looking down at it kindly. Same identity, outfit and lighting.
- teacher-ref/{c}/poses/telescope | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | waist-up, beside a small telescope on a tripod, one hand on it, looking up. Same identity, outfit and lighting.
- teacher-ref/{c}/poses/one-moment | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | waist-up, a small 'one moment' hand gesture (index finger raised softly beside the face), thinking face. Same identity, outfit and lighting.
- teacher-ref/{c}/poses/point-to-tray | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front | head and shoulders, gaze down and to the viewer's right toward an off-frame tray, one hand pointing lightly that way. Same identity, outfit and lighting.
- teacher-ref/{c}/stage/classroom-wide | 1536x1024 webp | ref: teacher-ref/{c}/turnaround/front | The character head-and-shoulders, centred, in a soft-focus warm Indian classroom (blank green board, window light, plants), no writing on the board.
- teacher-ref/{c}/stage/on-stage | 1024x1024 webp | ref: teacher-ref/{c}/turnaround/front, bg/stage-{stage} | The character head-and-shoulders, centred, in front of the dusk stage ground (bg/stage-{stage}: dusk blue #26304A, cream light pool behind the head). This is the colour script for the SH light probe of that stage.

### B11-B13: the one accessory sheet per character (3; each goes in its character's batch)

- teacher-ref/asha/detail/ear-stud | 1024x1024 webp | ref: teacher-ref/asha/turnaround/front | Extreme close-up of her ear with the small stud earring and the flyaway strands of the ponytail near it. Same character.
- teacher-ref/arjun/detail/glasses | 1024x1024 webp | ref: teacher-ref/arjun/turnaround/front | His round thin-rim glasses alone, front view and folded side view on a neutral surface, dark metal rim, clear lenses, no logo. Same character.
- teacher-ref/uma/detail/pallu-drape | 1024x1024 webp | ref: teacher-ref/uma/turnaround/front | The saree pallu drape over the left shoulder and the thin contrasting border, close, showing the weave and how the edge falls. Same character.

### B13 (after uma): cast lineup (1)

- teacher-ref/cast/lineup | 1536x1024 webp | ref: teacher-ref/asha/turnaround/front, teacher-ref/arjun/turnaround/front, teacher-ref/uma/turnaround/front | Asha, Arjun and Uma standing waist-up side by side, front view, neutral warm expressions, same studio background and lighting, each matching their own front turnaround exactly.

===== END CODEX PROMPT =====
