# CODEX-PROMPT.md: the one prompt that generates Taxila's image pack

**Date:** 2026-10-03 · **For:** the owner, to paste into OpenAI Codex once · **Built from:**
`docs/design/assets/MANIFEST.json` by `docs/design/assets/build-manifest.mjs`, which writes this file from
`codex-prompt.template.md`. Edit the template or the generator, never this file.

**What it makes:** {{CODEX_COUNT}} files on branch `claude/blissful-mayer-icwe2j` of `raghavsharma2003/Taxila`:
- {{SHIPPED_CODEX}} shipped UI images under `public/assets/gen/**`. {{COMPOSITE_COUNT}} of them are made by script,
  with no image model.
- {{REF_COUNT}} teacher concept and texture references under `art/gen/teacher/**`. That path never ships
  (TEACHER-VISUAL §14.3).
- `public/assets/gen/INDEX.json`, plus a `provenance.json` per folder.

**What it does not make:** the {{RIG_COUNT}} teacher stills under `public/assets/gen/teacher/**`. They are
rendered from the 3D rig by `scripts/teacher-stills.mjs`, so that every screen shows the same person.

**How to use it:**
1. Open Codex on the repo with write access. It needs push rights to the branch, the image tool, Python 3 and
   network access for `pip`.
2. Paste everything between the two marker lines.
3. If the run stops (usage limit, crash, timeout), paste the same prompt again. Codex reads `INDEX.json` and
   continues from the first pending image, so nothing is redone.

**Scale:** about {{IMAGE_MODEL_COUNT}} image generations before retries, in 14 resumable batches (B00 to B13), with a commit and
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

You will create {{CODEX_COUNT}} files, using your image-generation tool and a small Python helper. Each file goes
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

{{CHARACTER_BLOCKS}}

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
2. `INDEX.json` `summary` counts add up to {{CODEX_COUNT}}.
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
{{HELPER}}
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

{{ASSET_LIST}}

===== END CODEX PROMPT =====
