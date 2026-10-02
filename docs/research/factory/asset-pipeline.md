# Asset pipeline for generated games and lessons: style, characters, Indian context, audio, moderation, storage, cost

Date: 2026-10-02 · Status: research and design, partly probed, nothing built · Scope: Forge's asset stage (the
`s1_assets` step of LG §7 and the `assets/` folder of the `tgk@1` GamePackage), plus the shared asset library that
lessons, stories, engines and the scene DSL draw from.

**Question.** How does Forge get art, sound and voice for a generated game or lesson that (a) looks like one product,
(b) keeps the tutor and the protégé recognisably the same person everywhere, (c) shows India the way Indian children
live it, without stereotype, (d) is safe for a 6-year-old, (e) loads on a ₹10k phone, and (f) costs cents per game,
on Azure first-party services only?

**What this builds on (read first, not repeated).**
- `llm-game-generation.md` §6 (LG): the first asset table (gpt-image-2 sprites, ZzFX, procedural music, TTS lines).
  This document goes deeper and **corrects two of its assumptions with measurements** (§1).
- `multimodal-orchestration.md` (MO): the source ladder (MO4), core × skin × fill keys (MO5), "no raster carries
  text", per-child images never live, the content budget lines.
- `auto-validation-qa.md` §4.9 (QA): the S1-S8 safety layers. §8 here specifies the image path (S5) in detail.
- `game-kit-frameworks.md` (GK): the GamePackage `assets[]` field, sprite budget ≤ 150 kB WebP per game.
- `content/game-mechanics.md` G12: ≤ 6 non-semantic sprites, schematic flat art, no faces on game pieces.
- `design/visual-identity.md` (VI): the skin ramp `skin-1..6`, shape language by band, the representation matrix,
  cultural motifs, the folk-art rule, "no text in images".
- `avatar/character-creation.md` (CC): the 3D tutor cast and the colourism gate.
- `context/decisions.md`: `taxila-image` quota is **4 RPM**; Claude deployments were removed (Azure first-party
  only, CLAUDE.md), so every model call here is an Azure OpenAI deployment.

Evidence tags (house style): **[V]** verified today from source · **[M]** measured here, with n · **[S]**
secondary · **[U]** unmeasured design assumption · **[I]** inference.

**Probes run today (all re-runnable; outputs beside this file).**

| script | what | n |
|---|---|---|
| `asset-probe.mjs` → `asset-probe-2026-10-02.json` | gpt-image-2 on Azure: transparency, chroma key, character sheet, edits with reference, style-only reference, Indian family unguided vs cast-spec, rupee prompts, Content Safety on each output | 13 images |
| `asset-probe2.mjs` → `asset-probe2-2026-10-02.json` | edit + transparency, 2×2 walk-cycle sheet, `n=4` batching, two-reference edit | 4 calls, 7 images |
| `asset-postprocess-probe.py` → `asset-postprocess-probe-2026-10-02.json` | deterministic post: alpha snap, adaptive chroma key, trim, palette quantise, WebP sizes | 5 images |
| `svg-sprite-probe.mjs` → `svg-sprite-probe-2026-10-02.json` | LLM-drawn SVG sprites in the house style, 3 models × 6 Indian props | 18 SVGs |
| `asset-vlm-gate-probe.mjs` → `asset-vlm-gate-probe-2026-10-02.json` | taxila-brain as (a) blind recogniser of the SVG props, (b) child-art checklist on rasters | 18 + 8 |
| `sfx-bank-probe.mjs` → `sfx-bank-probe-2026-10-02.json` | ZzFX preset bank rendered offline: size, peak, loudness | 12 sounds |

Images themselves were kept in the session scratchpad (not committed); the JSON files carry every number quoted.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| AP1 | **Assets are a library, not a per-game product.** A game *requests* assets by semantic key from an `AssetManifest`. Forge generates only on a library miss, and the result enters the library for everyone. Per-child images are never generated (MO4) | 4 RPM image quota = 240 images/h for the whole company [V decisions.md]. 13-53 s per image [M]. A library amortises review, which is the real cost | A per-child bespoke image beats the library image on a delayed outcome, at a cost the tier can carry |
| AP2 | **Style is data: a versioned `StylePack` (reference sheet images + palette tokens + outline spec + prompt slots), and every generation call carries its reference images.** Text style anchors alone are not enough | Text-only "flat vector" anchor: the cast-spec family scene came back as hatched comic linework, not flat vector [M, n=2]. With the character sheet as reference, 6/6 edits kept outline, palette and proportions [M, n=6, eyeball] | A text-only anchor matches reference-conditioned output on the style gate (§3.5) over ≥ 50 images |
| AP3 | **Transparency: request `background:"transparent"` natively; keep the adaptive magenta key only as fallback.** | Azure's doc says transparency is gpt-image-1-only [V doc], but `taxila-image` returned real RGBA on every request that asked: 5 generated images (2 requests) and 3 edits [M]: 56-77% alpha 0, ≤ 1.2% partial edge pixels. Alpha peaks at 254, not 255, so the post step snaps ≥ 250 → 255 | Azure removes the behaviour (a deployment upgrade), detected by the post step's colour-type check, which then switches the route to magenta + key automatically |
| AP4 | **Never rely on a background-removal model's default.** If one is needed, pin `birefnet-general` (MIT) or `isnet-general-use` explicitly | rembg's *default* model is now `bria-rmbg`, "released under a BRIA license that requires a paid agreement for commercial use" [V rembg README]. LG §6's "MIT `rembg`" is true of the code, not the default weights | n/a (licence fact) |
| AP5 | **Characters are canonical sheets; every pose is an edit from the sheet, never a fresh generation.** The tutor's 2D sheet is rendered *from* the 3D/Rive master, not invented by the image model | Edits from one sheet kept clothes, hair, colours and proportions across wave, think (×2), jump, walk (×4 frames), sit-and-eat [M, 6 edits, eyeball]. Walk-cycle frame heights varied 472-477 px (1%), baselines 7 px [M] | A VLM identity judge scores fresh generations as consistent as edits (≥ 0.9 agreement over 40 pairs) |
| AP6 | **Skin tone is enforced after generation, not requested in words.** The post step recolours the skin cluster to the cast member's `skin-n` token | Asked for "medium-brown (warm tan, not light)", the model drew a saturated orange-tan (median #DF8939), CIE76 ΔE ≈ 26 from the nearest ramp token `skin-3`. Sheet → edit drift was tiny (ΔE ≈ 1) [M, n=2 measurable of 4]. So the model is *consistent* but not *on token*; the token must be applied | Measured skin-cluster ΔE to token ≤ 5 without recolouring on ≥ 30 images |
| AP7 | **Words, numerals and ₹ are never pixels.** Every label, price, numeral and currency symbol is host text over the art | The unguided family scene baked Devanagari and English wall text in 2/2 images; the cast-spec prompt (which never mentions signs) had 0/2 [M]. The S3 goat batch put "+ ÷" glyphs on a book in 1/4 [M]. Sora misspelled Devanagari (MO9) [M] | OCR + VLM text check fails < 1% of library images *and* the strings pass native-speaker review in pixels (not expected) |
| AP8 | **Indian money is a house "play money" design. Real banknotes, the RBI name, the State Emblem and real portraits are never drawn.** | "A ten rupee coin and a fifty rupee note" produced a near-facsimile ₹50 note: "RESERVE BANK OF INDIA", a Gandhi portrait, the State Emblem, a serial "4AB 123456" and a signature [M, n=1]. Content Safety scored it 0/0/0/0 [M]. The State Emblem's use is restricted by statute (State Emblem of India (Prohibition of Improper Use) Act 2005) [S]; banknote facsimiles risk the counterfeiting provisions [U, legal] | Counsel signs off on a specific facsimile treatment (e.g. "SPECIMEN" overprint at a non-legal size) for Class 2-3 money units |
| AP9 | **LLM SVG is for geometry, not for culture.** Use it for coins, plates, kites, tiles, arrows, diagram parts and UI props. Use reviewed raster art for food, vehicles, clothes and places | 18/18 SVGs parsed, rendered and stayed in palette (syntax is solved) [M]. Recognition is the failure: blind VLM naming got 11/18; the mango was "orange" 3/3 and the rotis "cookies" 3/3 across all three models [M]; author's eye: luna 5/6, sol 4/6, codex 2/6 [M, 1 rater] | A blind child-recognition test (n ≥ 20 children) on LLM SVG props reaches ≥ 90% for food and vehicles |
| AP10 | **Content Safety is necessary, cheap and blind to what matters most here.** The image gate is layered: Azure filter → Content Safety image → OCR → VLM checklist → human sample → in-production quarantine | Content Safety: 13/13 outputs severity 0, 0.49-0.98 s each [M], including the facsimile banknote and two text-baked scenes. It scores harm, not IP, emblems, text or stereotype | Content Safety custom categories (rapid, images) are shown to catch emblem, currency and text cases at ≥ 95% recall |
| AP11 | **Sound is procedural first.** SFX from a reviewed ZzFX preset bank (params are 25-45 bytes each); music from a commissioned loop library plus procedural beats; voice lines in the teacher's own voice via gpt-4o-mini-tts, cached by text hash | Azure has no music or SFX model; third-party generation APIs are research-only under the Azure-only directive (CLAUDE.md). 12 presets render in ≤ 8 ms each, 0.3-3.5 kB as Opus [M] | An Azure first-party music/SFX model appears and passes the ear test |
| AP12 | **Storage is content-addressed and immutable; style changes make new keys, never purges.** `assetId = sha256(bytes)`; `recipeKey = sha256(canonical recipe incl. styleVersion, castVersion, model, promptShape)`; served from Blob through Azure Front Door Standard with `Cache-Control: public, max-age=31536000, immutable` | Front Door caps TTL at 366 days and validates only with `Last-Modified` (no ETag) [V]; versioned URLs make purges unnecessary. Classic Azure CDN retires 2027-09-30 and accepts no new profiles [V], so the CDN is Front Door Standard ($35/month base) [V] | Front Door egress for India exceeds the per-child content budget (not plausible: §12) |

---

## 1. What the probes found (and what they correct)

| finding | number | tag | consequence |
|---|---|---|---|
| gpt-image-2 transparency works on Azure, contrary to the Azure doc | 8/8 RGBA (5 generated in 2 requests + 3 edits); mango: 55.7% alpha 0, 43.0% alpha 250-254, 1.2% partial | [M] vs [V doc] | AP3. LG §6's "Azure parity unverified" is now verified on this deployment, today. Re-check on every deployment change |
| alpha never reaches 255 | max 254 | [M] | post step snaps ≥ 250 → 255, or overlapping sprites look faintly see-through |
| "flat solid #FF00FF" is not flat | border mean (245, 6, 231), sd up to 5.9 | [M, n=5] | a fixed-key chroma key left 25-72% of pixels semi-transparent; an adaptive key (background colour measured from the border) gave ≤ 0.3% partial and no visible fringe, because the thick dark outline acts as a matte [M] |
| low-quality 1024² costs 196 output tokens; medium 1024² 1,756; medium 1536×1024 1,372 | at $30/M image output → $0.0059 / $0.053 / $0.041 | [M] + [V price, TM §4] | §12 cost table |
| every reference image is billed as image input tokens, about 1 token per 1,024 px² (the 1536×1024 sheet = 1,536; a 1024² ref ≈ 1,024), whatever `input_fidelity` says | high and low both 1,536 | [M, n=7 edits] | $0.008-0.012 per reference per edit at $8/M; `input_fidelity` appears to be a no-op on gpt-image-2 (both gave equally faithful edits by eye, n=1 pair) [M] |
| `n=4` costs the same wall time as `n=1` | 22.7 s for 4 low images (781 tokens) vs 13-23 s for 1 | [M, n=1] | variant picking is latency-free; batch 4 and let the gate choose (§5.4). Whether quota counts requests or images is [U] |
| latency | low gen 13-23 s; low edit 15-25 s; medium sheet 28 s; medium 2×2 sheet 53 s | [M, n=17 calls] | never on the live path (MO4 holds); night and race lanes only |
| the 2×2 walk-cycle sheet is usable | 4 frames, no figure crossing a cell border, heights 472-477 px, baselines 481-488 px, centre x 250-293 px | [M, n=1] | slice by alpha bbox, then re-anchor by feet (§5.2) |
| text-only style anchor drifts on complex scenes | 2/2 cast-spec family scenes in hatched comic style, not flat vector | [M] | AP2 |
| style-only reference drifts on props | the roti plate kept outline and palette, but added metallic gradients and bread texture | [M, n=1] | palette quantisation + a gradient check in the style gate (§3.5) |
| unguided "Indian family" art | 2/2: nuclear family of four, near-identical medium skin on everyone, mother in saree (with bindi in 1), baked wall text (Hindi and English) | [M, n=2] | the cast spec is mandatory (§6.2). The 2023 Midjourney failure mode ("Indian person" → 99/100 men, mostly elderly, 92/100 in turbans [S, Rest of World]) did not appear, but the defaults are still narrow |
| cast-spec "Indian family" art | 2/2 followed every slot: working mother, father serving, grandmother, girl with glasses, varied skin, no religious markers, no text | [M, n=2] | the representation matrix works when it is written into the prompt as slots |
| facsimile banknote from a plain prompt | RBI name, portrait, State Emblem, serial number | [M, n=1] | AP8 |
| Content Safety image API on the AIServices endpoint, same key | 13/13 HTTP 200, 493-983 ms, all severity 0 | [M] | AP10: wire it, but never as the only image gate |
| LLM SVG | 18/18 valid and in palette; 1.9-18 s; 289-2,541 bytes; 2-20 elements; blind-named correctly 11/18 (mango 0/3, roti 0/3) | [M] | AP9 |
| VLM checklist (`taxila-brain`) | 8/8 verdicts as expected on rasters; but it noted uniform skin without escalating; SVG yes/no agreed with the author 11/18; one call took 74.9 s | [M] | §8.3: code computes the verdict; recognition is a reject signal, not a ship gate |
| ZzFX bank | build 0.1-8 ms per sound; 25-45 bytes of params; Opus 289-3,453 bytes | [M, n=12] | AP11. EBU R128 *integrated* loudness gates out sounds under 400 ms (reported −70 LUFS for 10/12), so the SFX lint uses peak and short-window RMS instead |

---

## 2. Which asset comes from where

The rule of thumb: **the more a thing must be *correct*, the less it may be generated pixels.** Correctness lives in
code, DOM and SVG; mood lives in raster art.

| asset class | source, in order | why | generated live? |
|---|---|---|---|
| words, numerals, ₹, units, labels, equations | host DOM / Phaser text from verified strings tables (MO8.1), KaTeX | verifiable, translatable, language switch without re-render | yes (it is text) |
| diagrams, graphs, number lines, fraction bars, maps | engines and scene DSL → SVG (MO, genui) ; maps only from the bundled Survey of India asset | MMMG: best model 50.2 on knowledge images [S] | yes (deterministic) |
| geometric props (coins, plates, tiles, arrows, blocks, kites, shapes, counters) | house SVG kit (hand-made) → LLM SVG in palette (§5.5) → raster | small, scalable, recolourable, cheap | LLM SVG only off the live path; served from library |
| everyday Indian objects (food, vessels, vehicles, clothes, plants, animals) | **India Everyday Kit** library (§6.3): reviewed raster sprites → generate on miss (night) | culture is where SVG and unguided prompts fail [M] | never |
| backgrounds and scenes | skin packs (MO, LG §6) → night generation from the StylePack | mood, low correctness risk | never |
| recurring characters (tutor, protégé, cast) | canonical sheet + pose library (§4) → edit-from-sheet on miss | identity must hold across months | never |
| the child's own avatar | parts kit (SVG layers: face shape, skin token, hair, glasses, clothes colour) picked by the child | no photos, no generation, no likeness risk (DPDP; CC §0.7) | assembled at runtime from parts |
| photographs of real things | Wikimedia Commons with licence metadata (TM §3) | authenticity for SST and science | never |
| folk and tribal art (Warli, Gond, Madhubani) | commissioned, credited, paid (VI rule 13) | GI-tagged traditions; AI pastiche is appropriation | never generated |
| SFX | ZzFX preset bank (§7.1) → CC0 libraries (Kenney audio) | 0 network, < 1 kB | rendered on device from params |
| music | commissioned loop library + procedural beat (§7.2) | no Azure music model | procedural only |
| voice lines (solo play) | gpt-4o-mini-tts in the tutor's voice, cached by hash (§7.3) | the live teacher speaks the teaching | pre-rendered at publish |
| video | library-only phenomenon hooks (MO9) | | never |

---

## 3. Style as data: the StylePack

### 3.1 What a StylePack is

A StylePack is one immutable, versioned bundle. Everything Forge draws for a band and a skin is conditioned on it.

| part | content | who makes it |
|---|---|---|
| `refs.master[]` | 3-6 reference sheets: one cast sheet, one prop sheet (6-9 everyday props), one background swatch, one "do not" sheet kept for the judge only | commissioned illustrator draws the first; Forge expands; art director signs |
| `palette` | 12-16 hex tokens (VI §3 diagram palette, skin ramp, neutrals, the kajal outline `#3A2A1E`) | VI tokens; never invented per pack |
| `outline` | width in px at 1024, colour token, join | VI §6.1 per band (B1 3 dp … B4 none) |
| `shading` | `flat+1` / `flat+2` / `2-3 tones` | VI §6.1 |
| `promptSlots` | the structured slots of §3.3 (never sentences the model could copy into the scene) | Forge |
| `gate` | thresholds for §3.5 (max colours, ΔE to palette, gradient score, outline coverage) | Forge, tuned on the pack's own sheets |
| `version` | `style@<band>.<skin>.<n>` | bumps on any change; old versions stay servable |

**Why reference images and not only words.** gpt-image-2 accepts up to 16 input images per edit [V doc]. Today's
probe: with the sheet as reference, every edit kept the look; with words only, the complex scene drifted (§1). This is
the same lesson the repo already learned in text ("position is mechanism"): the strongest conditioning channel wins,
and for images that channel is pixels.

**Cost of carrying references.** A 1536×1024 reference sheet is 1,536 input tokens = $0.012 [M]. Two references (sheet + style)
plus a low output ≈ $0.026 per image [M: 2,644 input tokens on S4]. Cheaper than one rejected-and-regenerated image.

### 3.2 How a StylePack is made (once per band × skin, ≈ 34 packs at launch)

1. **Anchor:** the commissioned master sheets for the four bands (VI §6.1). These are the only hand-made raster art
   the factory depends on. Budget [U]: 4 bands × 3 sheets.
2. **Expansion:** for each skin theme (cricket, kitchen, monsoon village, space, trains, animals, festivals-seasonal,
   generic; MO8.1 lists 8), Forge edits the band's prop sheet into the theme's props and one background swatch,
   `n=4` per request, keeps the best by the §3.5 gate, at medium quality.
3. **Human review** of every sheet (≈ 34 packs × 3 sheets ≈ 100 images, a day of art direction) against the G-VI-7
   checklist. A pack is `approved` only after review; unapproved packs never serve.
4. **Freeze:** sheets are content-addressed; the StylePack JSON names them by `assetId`.

### 3.3 Prompt structure (slots, not lines)

The inherited law — sentence-shaped prompt text gets recited — has an image twin: descriptive sentences leak into the
picture as *props* (the goat batch added books and a pencil because the prompt said "for a children's maths game"
[M]). So prompts are assembled from slots, and context words that are not visual are never sent.

```
[ROLE]        image index → meaning ("image 1 = character sheet of <castId>", "image 2 = house style")
[SUBJECT]     one noun phrase from the asset key (no purpose clauses, no subject-matter words like "maths")
[POSE/STATE]  from a closed vocabulary (idle, wave, think, point, jump, walk-n, sit, eat, celebrate-small, hmm)
[VIEW]        front | three-quarter | side-right | top-down | iso
[CAST]        only for scenes: per-person slots from §6.2 (role, age band, skin token name, clothing class, prop)
[STYLE]       outline <w>px <token>; fills flat+<k>; no gradients; no texture; palette = image 2
[NEGATIVE]    no text, no letters, no numerals, no logos, no religious symbols, no currency, no real people
[CANVAS]      size; background:"transparent"; subject centred; ≥ 4% margin; nothing touching edges
```

The slots are filled by code from the `AssetReq` (LG §7) and the cast registry. The builder agent never writes a free
prompt; it writes an `AssetReq`, and an unknown pose or subject becomes a library request reviewed at night.

### 3.4 Deterministic post-processing (worker, CPU; pure Python measured 3.3-4.7 s per 1024² image [M], libvips expected < 0.5 s [U])

1. **Alpha:** native RGBA → snap alpha ≥ 250 to 255 and ≤ 5 to 0. RGB → adaptive magenta key (background colour
   measured from the border; opaque at ≤ 30% of its magenta-ness, clear at ≥ 80%), then despill.
   *Constraint:* when keying is the route, magenta, pink and purple are banned from the subject palette (they would
   be keyed out). Native transparency removes this constraint, which is another reason it is the default.
2. **Trim** to the alpha bbox + 4% pad; record the **pivot** (feet centre for characters, centre for props).
3. **Skin recolour** (characters only): seed from the skin colour sampled once on the approved cast sheet, segment
   pixels within ΔE 12 of the seed (or of its shade tone), and map them onto `skin-n` and `skin-n shade` (VI §3.6).
   Hair and outline untouched. A fixed hue band is not enough: it found too few skin pixels in 2 of 4 probe images [M].
4. **Palette quantise** to the StylePack palette (k ≤ 16), Floyd-Steinberg *off* (dither reads as texture).
5. **Encode** WebP q82 at 512 and 256 px. Measured: mango 8.9 kB at 256 px and 19.8 kB at 512 px;
   a full 3-view sheet 14.3 kB at 256 px [M]. GK's ≤ 150 kB per game therefore holds ~12-16 sprites at 512 px.
6. **Hashes:** sha256 of the final bytes (`assetId`) and a 64-bit perceptual hash (dHash) for near-duplicate search
   and for matching against the quarantine list.

Code: `sharp` (libvips, Apache-2.0) in the Node worker for steps 2, 4 and 5; Pillow for the probe. No AGPL code
(LG §6: never `@imgly/background-removal`).

### 3.5 The style gate (cheap, deterministic, before any VLM)

| check | metric | threshold (tune per pack on its own approved sheets) |
|---|---|---|
| colour count | distinct colours after quantise covering 99% of opaque pixels | ≤ pack `maxColours` (12 for B1-B2) |
| palette distance | mean ΔE₀₀ from each opaque pixel to its nearest palette token, before quantise | ≤ 6 [U] |
| gradient score | share of opaque pixels whose 3×3 neighbourhood has a smooth luminance ramp (not an edge, not flat) | ≤ 3% for `flat+1` packs [U]; catches the metallic-plate drift [M] |
| outline coverage | share of alpha-boundary pixels whose inward 3-px band is the outline token | ≥ 85% for B1-B3 [U] |
| silhouette | the alpha mask is one connected component (props) or ≤ 3 (characters); no hole touching the edge | hard |
| margins | bbox touches no canvas edge | hard |
| text | Azure AI Vision OCR (Read) returns no word longer than 2 characters | hard (AP7) |
| size | final WebP bytes ≤ 40 kB at 512 px | hard |

Only images that pass this go to Content Safety and the VLM checklist (§8), so the expensive judges never see the
easy failures.

---

## 4. Character consistency: the tutor, the protégé and the cast

### 4.1 The cast registry

```ts
export interface CastMember {
  castId: string;                    // "tutor.anaya", "protege.golu.B1", "cast.dadi.01"
  role: "tutor" | "protege" | "recurring" | "extra";
  version: string;                   // "cast@golu.3": bumps when the sheet changes; old poses keep the old version
  bands: ("B1" | "B2" | "B3" | "B4")[];   // the same person re-drawn per band (VI §6.2)
  skinToken: `skin-${1|2|3|4|5|6}`;  // enforced in post (§3.4 step 3), never left to the prompt
  anchors: string[];                 // identity anchors from VI §6.2 / CC §3: "side plait", "jamun dupatta with matka border"
  sheetAssetIds: string[];           // front / 3/4 / side turnaround (+ expression sheet for tutor and protégé)
  poseLibrary: Record<PoseId, string /* assetId */>;   // pre-generated, reviewed
  forbidden: string[];               // "no religious marker unless authored", "no glamour", "no lighter skin"
  source: "3d-master-render" | "commissioned" | "generated-reviewed";
}
export type PoseId = "idle" | "wave" | "think" | "point" | "hmm" | "celebrate-small" | "listen" | "walk-1" | "walk-2"
  | "walk-3" | "walk-4" | "sit" | "jump" | "hold-item" | "sad-not" /* never used; mistakes show thinking, not failure */;
```

### 4.2 The tutor in 2D comes from her master, not from the image model

The tutor is an authored 3D (CC) or Rive (VI §6.2) character with a fixed voice. Her 2D appearances in games and
stories (a thumbnail in a level map, a pointing hand on a board, a "well done" card) must be the same person.

- **Reference = renders of the master.** Render the 3D/Rive tutor in the canonical turnaround and 8 expressions
  under the neutral QA light, flatten to the band's outline style (toon shader + outline pass in Blender, CC §5), and
  use those renders as `image[]` references. The image model then only restyles and re-poses; it never invents her.
- **Her face is never edited by a free prompt in a live or per-child path.** Tutor poses are a closed library
  generated at night, reviewed once, and versioned with her `cast@` version.
- **Colourism gate (CC G9, VI G-VI-7):** the skin cluster's mean L* must sit in her MST/skin band on every pose.
  The post-recolour makes this a check that should never fire; when it fires, the recolour step is broken.

### 4.3 The protégé (teach-back partner)

The protégé (VI §6.3: a younger cousin for B1-B2, a classmate for B3-B4) is the character the child *teaches*, so it
appears in many games. Today's probe used a draft protégé ("Golu", 7, B1-B2) and measured the path end to end:
medium turnaround sheet 28 s → wave, think (two fidelity settings), jump, sit-eating-mango, a 2×2 walk cycle,
each 15-53 s, all recognisably the same boy, all RGBA when asked [M, 6 edits]. **Gender and region rotate**: launch with
two protégés per band (one girl, one boy), chosen by the child, never by the system (MO10 choice rule).

### 4.4 Identity check (automated, before human review)

- **Deterministic:** palette histogram distance between the pose and the sheet's same-view crop (clothes colours
  must match within ΔE 5); skin-cluster ΔE ≤ 3 to the token after recolour; height ratio head:body within ±8% of the
  band's VI ratio.
- **VLM pairwise:** `taxila-brain` sees (sheet, pose) and answers a closed schema `{sameCharacter, mismatches[]}`
  (hair shape, clothes, accessory, face shape). Measure its agreement with the art director on 40 pairs before
  trusting it (the repo's `vision-fab` harvest: cheaper models "read part, assert the rest") [U].

### 4.5 The child's own avatar

Never generated, never from a photo. A parts kit (SVG layers: 6 face shapes × 6 skin tokens × 12 hair × glasses ×
hearing aid × 8 clothing colours; patka, hijab and dastaar as hair-layer options authored with community review, CC
§3.1.4) assembled on device. It costs 0, cannot be a likeness of a real child, and is DPDP-safe because nothing
about the child's face ever leaves the phone.

---

## 5. Sprites, sheets, animation, SVG

### 5.1 Transparent PNG

| route | when | measured |
|---|---|---|
| native `background:"transparent"` + `output_format:"png"` | default, gen and edit | 8/8 RGBA; edges clean [M] |
| magenta + adaptive key | if the native path returns RGB (detected by PNG colour type 2) | ≤ 0.3% partial, 0 fringe on outlined art [M, n=4] |
| BiRefNet (`birefnet-general`, MIT) via rembg in the worker | photos, or un-outlined art | not run; ~58-97 ms per 1024² image on an RTX 4090 [V README]; CPU on Container Apps is [U] (budget 2-5 s) |

Note: Azure returns PNG or JPEG only; WEBP output is not supported [V doc], so WebP is always produced in post.

### 5.2 Sprite sheets and atlases

1. **Frames:** for 2-4 frame loops (walk, idle-breathe, wave), request a 2×2 grid in one edit at medium quality
   (53 s, $0.065 incl. the reference) [M]. Slice by **alpha connected components**, not by fixed cell boxes (centres
   varied 43 px across cells [M]). Re-anchor every frame on its pivot (feet centre), normalise height to the median
   (heights were within 1%), and reject the sheet if any frame's height deviates > 4% or a component crosses the
   midlines.
2. **Prefer procedural motion.** Squash-stretch, bob, rotate, tint and particles on one sprite cost 0 and never drift
   (LG §6; AVR-Agent: models gain no win rate from richer assets [S]). Frames are for characters only.
3. **Atlas packing** at publish: `maxrects-packer` (MIT, zero dependencies; `smart`, `pot`, `border`, `tag` options)
   [V README] → one 1024² or 2048² WebP atlas per game + a Phaser 3 `atlas` JSON (frame rects + pivots). One atlas
   means one texture upload on low-end GPUs (GK §7).
4. **Budget:** the GK V0 gate (≤ 150 kB sprites per game) is checked on the atlas, not per file.

### 5.3 Backgrounds and tiles

Backgrounds: 1536×1024 medium ($0.041, 28 s [M]) from the skin's background swatch as reference, 30% lower contrast
than foreground (VI §6.1). Tiles: Kenney CC0 sets ("public domain licensed (CC0) … even in commercial projects",
attribution optional) [V kenney.nl] recoloured to the palette, auto-tiled in code (LG §6, OpenGame's 47-tile blob
bitmask). Layout that matters for correctness stays in code, never in a painted background.

### 5.4 Variant picking (`n=4`)

Each generation asks for 4 variants at low quality (same wall time as 1 [M]); the §3.5 gate prunes, the VLM picks
among survivors on the asset key's rubric, and only the winner gets a medium re-render if the asset is for a
library pack. This turns the ~30% "close but wrong" rate (props added, wrong pose) into a selection problem instead
of a retry loop [U: rate to be measured, M-AP3].

### 5.5 SVG by LLM

- **Where it wins:** coins (no numerals; the host draws "₹5"), plates, kites, matka-like simple vessels, fraction
  pieces, counters, arrows, tiles, badges, UI props. 289-2,541 bytes, recolourable by token, crisp at every DPR,
  generated in 1.9-18 s [M].
- **Where it loses:** objects whose identity is cultural detail. Blind VLM naming called every model's mango an
  "orange" and every model's rotis "cookies" (6/6 failures), and codex's coin a "bangle" [M]. By the author's eye,
  sol's and codex's auto-rickshaws read as a taxi and a jeep. `taxila-codex` was the fastest (1.9-4.1 s) and the
  least recognisable; `taxila-fast` (luna, 7.5-15 s) was the best by eye.
- **Contract:** `viewBox 0 0 256 256`; ≤ 40 elements; fills and strokes only from the palette list; no `<text>`,
  `<script>`, `href`, `style`, gradients, filters, patterns, masks or images. The probe's lint enforced all of these
  and the models complied 18/18 when the rules were in the system prompt [M]. Sanitise anyway (DOMPurify SVG
  profile, TM §3) and re-serialise through a whitelist parser; the lint is the gate, the prompt is a hint.
- **Recognition gate:** a blind VLM "what is this?" is a *reject* signal (if it names something else, regenerate).
  It is not a ship signal: its strict yes/no agreed with a human on only 11/18 (§8.3). An LLM SVG enters the library
  only after a human looks at it.

---

## 6. Indian context without stereotypes

### 6.1 The evidence

- **Rest of World (2023), Midjourney, 100 images per prompt:** "an Indian person" gave 99/100 men, nearly all over
  60, 92/100 in turbans; "Indian house" drifted toward temples; "Indian food" collapsed to thalis on silver
  platters [S].
- **Ghosh, Venkit, Gautam, Wilson & Caliskan (AIES 2024)**, five focus groups across Indian subcultures: T2I output
  showed "exoticism and cultural misappropriation", misrepresentation and marginalisation [S].
- **Today, gpt-image-2, n=2 per arm** [M]: the 2023 extremes did not appear, but the *defaults* did — one family
  shape, one skin band, one mother costume, and wall slogans in pixels. A slot-structured cast spec removed every one
  of those in 2/2 images. Small n: this is a mechanism check, not a bias estimate (M-AP4 measures the rates).

### 6.2 The cast spec generator (code, not prose)

The representation matrix (VI §6.4) becomes a sampler. For any scene with people, code draws the cast and writes
each person as a slot; the model never chooses who appears.

```ts
export interface CastSlot {
  role: "parent" | "grandparent" | "child" | "teacher" | "shopkeeper" | "farmer" | "doctor" | "driver" | "friend";
  ageBand: "child" | "teen" | "adult" | "elder"; gender: "f" | "m";
  skinToken: `skin-${1|2|3|4|5|6}`;            // sampled across the ramp, weighted to skin-3/4; hero never lightest
  clothing: "kurta-jeans" | "salwar" | "saree-cotton" | "shirt-trousers" | "school-uniform" | "tee-shorts" | "sweater";
  markers: ("glasses" | "hearing-aid" | "wheelchair" | "patka" | "hijab" | "dastaar" | "bindi")[];   // only from the scene's authored quota, never as "type"
  doing: string;                                 // closed verb list; work and care roles rotated by gender
}
export interface SceneSpec {
  setting: "village" | "small-town" | "metro-flat" | "hills" | "coast" | "desert" | "north-east" | "school-govt" | "school-private" | "market";
  family?: "joint" | "nuclear" | "single-parent" | "grandparents-care";
  cast: CastSlot[]; props: ObjectKey[];          // props from the India Everyday Kit only
  season?: "summer" | "monsoon" | "winter";      // festivals only in seasonal packs, rotating communities (VI §6.4)
}
// The sampler logs the drawn matrix per pack (G-VI-7 audit): gender split, skin histogram, settings, families, roles.
```

Hard rules in the sampler: no caste-coded occupations; no "fair = good" (heroes never the lightest token, wrongdoers
never the darkest); poverty is never a backdrop; no deity, place of worship, Taj-as-India or palace as generic
"India"; animals per VI §6.3 (no owl-as-clever, no parrot-as-understanding, no cow or pig as comic characters).

### 6.3 The India Everyday Kit (the object library)

A reviewed, versioned library of ~300 everyday objects, each with a canonical sprite per band, alt text in en/hi,
and a correctness note. It is the first place any game looks, and the place SVG and unguided prompts fail most.

| family | examples | correctness notes the reviewer checks |
|---|---|---|
| food | roti, rice, dal, sabzi, idli, dosa, poha, paratha, fruit (mango, banana, guava, jamun), milk, chai | regional rotation (north, south, east, west, NE); roti is not a cookie; no "curry" stand-in |
| vessels and home | steel plate, katori, tumbler, matka, pressure cooker, tiffin, broom, bucket, ceiling fan | everyday, not antique; mixed income |
| money | house play-money coins and notes (§6.4), piggy bank, price tag (host text) | never real designs |
| transport | auto-rickshaw (three wheels!), bus, train, cycle, scooter, bullock cart (rural only, never as "India") | three wheels; no brand marks |
| places | school (govt and private), kirana shop, market, park, field, railway station, PHC clinic | no temples or monuments as generic places |
| nature | neem, banyan, peepal, monsoon cloud, paddy, wheat, tortoise, sparrow, goat, dog, cat, squirrel | VI §6.3 animal idioms |
| school | slate, chalk, copy notebook, geometry box, uniform, school bag, mid-day meal plate | |

Cost: 300 objects × 4 bands ≈ 1,200 sprites at the library-grade unit cost of §12 (≈ $0.15: `n=4` low with two
references, a medium re-render of the winner, gates) ≈ **$180 for the kit** [M prices, U counts]; the cost that
matters is review (§8.5).

### 6.4 Money

- **Coins:** a house coin family (₹1, 2, 5, 10, 20 as plain discs of distinct size and colour). The denomination is
  **host text** on top of the disc, never pixels. Children learn value from the numeral and the size, which is what
  NCERT Class 1-3 money units ask [I].
- **Notes:** house play notes with a wave pattern, a blank oval, colour by denomination, and the denomination as host
  text. No RBI wording, no portrait, no emblem, no serial number, no signature, no real colour-size pairing.
- **The ₹ symbol** is a Unicode glyph (U+20B9) rendered by the font stack (Baloo 2 / Mukta, VI §4).
- **Prompt lint:** `rupee`, `RBI`, `banknote`, `Gandhi`, `emblem`, `Ashoka` in an image prompt are rewritten to the
  play-money asset key or rejected. The VLM checklist carries `real_currency_or_state_emblem` (§8.3).

### 6.5 Other no-draw lists

Maps (Survey of India boundaries only, bundled asset; GK §8); the national flag (only as a host SVG from the
official construction sheet, never generated, never on the floor or as clothing); the State Emblem; real people
(leaders, cricketers, film stars: the Q8 blocklist); brands, IPL team colours, franchise characters; religious symbols
as decoration; school-uniform logos of real schools.

---

## 7. Sound: SFX, music, voice lines

### 7.1 SFX: a reviewed procedural bank

- **ZzFX** (MIT; "less than 1 kilobyte when compressed"; 21 parameters; offline WAV export in its designer) [V].
  Today's draft bank of 12 kid-safe presets (correct.soft, correct.big, tryagain.gentle, pop, whoosh, jump, land,
  levelup, unlock, tick, pick, drop.snap) built in 0.1-8 ms each, 0.03-0.72 s long, 25-45 bytes of parameters,
  289-3,453 bytes as 32 kbps Opus [M].
- **The LLM picks a preset id per event, never parameters** (LG §6). The bank is authored by a person with the
  ZzFX designer and reviewed by ear on a ₹10k phone speaker.
- **Lint (publish gate):** feedback sounds ≤ 0.8 s; sample peak between −18 and −9 dBFS across the bank (today's
  drafts: −18.5 to −10.5 [M]); `tryagain.*` uses sine or triangle shapes, no noise component, falling pitch ≤ 2
  semitones (gentle, never a buzzer: kids-ux); nothing above 4 kHz dominant for B1 [U]. EBU R128 integrated loudness
  is **not usable** for sub-400 ms sounds (gated to −70 LUFS for 10/12 drafts [M]); use peak plus 100 ms RMS.
- **Libraries:** Kenney's CC0 packs as a seed (licence verified for the site's assets [V]; check each audio pack's
  bundled licence file). Any CC-BY asset carries attribution metadata in its `AssetRecord`; CC-BY-NC is banned.

### 7.2 Music

- **No Azure first-party music model exists**, and third-party generators are research-only under the Azure-only
  directive. For the record [V]: ElevenLabs Music (`music_v2_5`, 3 s-5 min, "cleared for nearly all commercial
  uses"); Stable Audio Open 1.0 (Stability AI Community License, ≤ 47 s, "performs better with sound effects than
  music", acknowledges cultural under-representation); Meta MusicGen/AudioGen (code MIT, **weights CC-BY-NC 4.0**:
  unusable commercially even if self-hosted).
- **So:** a commissioned library of ~40 short loops (8-16 bars, 70-100 BPM, Indian instruments where natural:
  tabla, dholak, flute, harmonium, santoor; plus neutral), each with stems, delivered as Opus 48 kbps (≈ 60-90 kB per
  30 s) [U]. Procedural beats (ZzFXM, a WebAudio step sequencer) for the chant engine (LS-engines §8: the teacher
  chants over a beat, < 2 kB).
- **Rules:** music defaults off for anxious or young profiles and under any teacher speech; ducks −12 dB under voice
  lines; never during an open probe (G12).

### 7.3 Voice lines

- **The live teacher speaks the teaching** (MO rule). Games voice only short fixed lines: instructions, "your turn",
  celebrations, level names, solo-play hints (GK `voice: Record<CueKey, VoiceLine>`).
- **Same voice as the teacher.** gpt-4o-mini-tts shares the realtime voice family (`marin`, `cedar`, …) [V via
  voices-hindi §3.2], so a game line can be the tutor's voice. Whether `marin`(TTS) and `marin`(realtime) sound like
  one person is an ear test already queued in voices-hindi. Fallback: Azure Speech hi-IN voices
  (`hi-IN-Kavya:MAI-Voice-2`, preview, with styles such as `happy`, `hopeful`, `softvoice`) [V].
- **Measured:** 6 Hinglish lines, 805-1,111 ms per call, 10.9 ± 1.1 characters per second of audio (`tts-segment-probe`)
  [M]. A 40-character line ≈ 3.7 s ≈ $0.0009 at $0.015/min [S price].
- **Cache key:** `sha256(text NFC + lang + voice + instructionsVersion + model)`; the audio is shared across every game
  that uses the line. The child's name is never voiced into a shared clip; the host splices a separately cached name
  clip only if the child opted in [U].
- **Gate:** QA S7 round-trip (transcribe → WER ≤ 15%), loudness-normalised to −16 LUFS (lines are > 400 ms, so R128
  works), trimmed silence ≤ 120 ms.

---

## 8. Moderation of generated images for children

### 8.1 Layers, in order of cost

| # | layer | catches | cost / latency | measured today |
|---|---|---|---|---|
| L0 | prompt lint (code) | forbidden subjects (currency, emblem, real people, brands, deities, weapons), purpose words that leak props | 0 | — |
| L1 | Azure OpenAI built-in filter (on by default; photoreal minors blocked by default) [V doc] | sexual, violent, hateful prompts and outputs | included | did not block the facsimile banknote [M] |
| L2 | style gate (§3.5), incl. OCR | text in pixels, off-style, gradients, edge-touching | CPU ms; OCR ~0.5 s [U] | — |
| L3 | Content Safety image `image:analyze` (AIServices endpoint, same key) | sexual, violence, hate, self-harm severity 0/2/4/6; fail at ≥ 2 (QA S5) | ~$1.5/1k [U]; 0.49-0.98 s [M] | 13/13 severity 0, incl. banknote and text-baked scenes [M] |
| L4 | VLM checklist (`taxila-brain`, strict JSON) | text, currency/emblem, religious symbols, real likeness, skin uniformity, stereotype, scariness, pose/identity | ≈ 3-7 s, long tail (§8.3) | §8.3 |
| L5 | perceptual-hash match | re-appearance of anything quarantined; near-duplicates in a pack | ms | — |
| L6 | human review | every StylePack sheet, every cast pose, a sample of every batch (§8.5) | minutes per batch | — |
| L7 | production signals | child or parent "report this picture", teacher-visible flag, quarantine within one release | — | — |

Any failure → the asset never enters the library; the builder sees only `SAFETY.<layer>.<code>` (QA §4.9).

### 8.2 Severity policy (child threshold)

Fail at Content Safety severity ≥ 2 in any category (QA S5). Note "You can't use Azure AI Content Safety to detect
illegal child exploitation images" [V overview]: that risk is handled upstream by never generating photoreal humans
(cartoon style only, enforced by the prompt template and the L4 checklist) and never accepting uploaded images into
generation. Azure blocks photoreal minors by default, but "Enterprise-tier customers [are] automatically approved"
[V doc], so the product cannot rely on that default staying on.

### 8.3 The VLM gate, measured

`asset-vlm-gate-probe.mjs`, `taxila-brain` (gpt-5.6-sol), strict JSON schema output [M]:

**V2, child-art checklist on 8 rasters.** The verdicts matched the author's expected verdict on **8/8**:
- both unguided family scenes failed on baked text (Devanagari "घर ही खुशी है"; English "Together is our favorite
  place to be"), and one was flagged for "the mother is the only person visibly serving food";
- the facsimile banknote failed with `real_currency_or_state_emblem: true`, listed "RESERVE BANK OF INDIA", the serial
  and the Gandhi likeness;
- the goat with "+ ÷" on a book failed on text;
- both cast-spec scenes, the generic play money and the protégé sheet passed.

One mechanism lesson: for both unguided scenes it *wrote* "all four people have similar medium-brown skin tones" but
did not choose `human_review` for that (the text failure decided the verdict). So **the verdict is computed in code
from the fields, never taken from the model's `verdict`** (the inherited law: a model never grades; classify, then a
predicate decides). 3.4-7.3 s per image.

**V1, SVG recognition (18 props).** Blind naming matched the intended object on **11/18**. Both culturally specific
foods failed for every model: the mango was named "orange" 3/3 and the rotis "cookies" 3/3; codex's coin was named a
"bangle". The strict yes/no judge agreed with the author's eye on only **11/18** (7 both-yes, 4 both-no, 5 judge-no
where the author said yes, 2 judge-yes where the author said no). Disagreements ran both ways: the judge was harsher
on round fruit and plain coins ("without markings … a child may not recognise it"), more lenient on two vehicles and
vessels. Median 5.3 s for the two calls, one outlier at **74.9 s**.

What this means for the gate:
- the checklist role (text, currency, emblem, likeness, scariness, stereotype hints) is usable now, as a *filter*
  in front of human review, with code computing the verdict;
- the recognition role is not yet a ship gate: two raters (one human, one model) agree only 61% on n=18. Until
  M-AP7 measures children, LLM-SVG food and vehicles stay out of the library (AP9), and blind naming is used as a
  cheap *reject* signal only (if the model names something else, regenerate);
- calls need a 20 s timeout and one retry; the tail is long.

### 8.4 Moderation of audio

TTS lines come only from S1-cleared strings (QA S7). SFX and music come only from reviewed banks, so they need no
runtime moderation. A new bank entry is reviewed by ear.

### 8.5 Human review: what a person looks at

| what | sample | reviewer | time [U] |
|---|---|---|---|
| StylePack sheets, cast sheets and every cast pose | 100% | art director | 1-2 min each |
| India Everyday Kit objects | 100% at creation | reviewer from the object's region (rotating) | 20-30 s each |
| night-generated pack images | 10% random + 100% of VLM `human_review` + 100% of anything with people | trained reviewer | 15-30 s each |
| religious, community or regional markers | 100% | a person from that community (CC §9) | — |

The review UI shows the image on the band's background at phone size, the recipe slots, the gate scores and the
checklist; the reviewer answers the same closed checklist the VLM answers, so every review is also a label for the
VLM's agreement metric (M-AP5).

---

## 9. Storage and CDN

### 9.1 Two keys

- **`assetId = sha256(final bytes)`**: what the CDN serves; immutable; dedupes identical outputs.
- **`recipeKey = sha256(canonicalJSON(AssetRecipe))`** (§10): what the library *looks up*. It includes
  `styleVersion`, `castVersion`, `model` (deployment + model version), `promptShapeVersion`, the slot values, the
  reference `assetId`s, `size`, `quality`, `background`. A recipe hit returns the approved `assetId` without a call.

A style or cast bump changes every recipe key under it, so old games keep their old art and new games get new art,
with no purge and no mixed-style screens. This is the image twin of MO5's core × skin × fill rule.

### 9.2 Layout

```
taxilaforge (Storage account; the forge container is public-read behind unguessable hashes, MO §8.4)
  forge/a/<aa>/<assetId>.webp            final assets (sprites, bgs, atlases), immutable
  forge/a/<aa>/<assetId>.opus            audio
  forge/style/<styleVersion>.json        StylePack (names its refs by assetId)
  forge/cast/<castVersion>.json          CastMember
  forge/game/<buildSha>/asset-manifest.json   per game: semantic key → assetId, pivot, atlas frame
  forge-src (private container)          originals (PNG from the model), probe outputs, review evidence, rejected images (quarantine), 180 days
```

Index rows in Neon: `asset(asset_id pk, kind, bytes, mime, phash, w, h, licence, source, status, created_at)`,
`asset_recipe(recipe_key pk, asset_id, recipe jsonb, style_version, cast_version, approved_by, approved_at)`,
`asset_gate(asset_id, layer, pass, detail jsonb, at)`, `asset_use(asset_id, build_sha)`. Child-specific data never
appears in any of these (MO §8.1 rule 2).

### 9.3 Delivery

- **Azure Front Door Standard** in front of Blob. Classic Azure CDN accepts no new profiles since 2025-08-15 and retires
  2027-09-30; Front Door (classic) retires 2027-03-31 [V]. Standard is $35/month base; India egress in Microsoft's
  own example is $0.109/GB for the first 10 TB, requests $0.0108 per 10k [V example prices].
- **Headers:** `Cache-Control: public, max-age=31536000, immutable` (Front Door caps at 366 days [V]); correct
  `Content-Type`; Front Door compresses SVG and JSON (not WebP or Opus, which are already compressed) [V list for
  classic; Standard configurable].
- **Validators:** Front Door uses only `Last-Modified`, not ETag [V]; immutable content-addressed paths make this moot.
- **No query strings in asset URLs** (the cache key would split); versions live in the path.
- **On device:** the sandbox origin's service worker precaches the kit and the India Everyday Kit atlas for the band;
  the APK bundles B1-B2 core packs (LE offline packs). A game's own atlas is fetched once and cached by `assetId`.

### 9.4 Cost of serving

A game's assets ≈ 150 kB atlas + ≤ 60 kB audio ≈ 0.2 MB. At $0.109/GB that is **$0.00002 per cold game load**; 1M
cold loads ≈ $22. Storage for a 20k-asset library at ~40 kB ≈ 0.8 GB, a few cents a month [S Blob hot pricing].
The $35/month Front Door base fee is the largest serving line until roughly 300k cold loads a month [I].

---

## 10. Interfaces (TypeScript, for `shared/contracts.ts` once approved)

```ts
export type AssetKind = "sprite" | "sheet" | "bg" | "tile" | "svg" | "atlas" | "sfx" | "music" | "voice";
export interface StylePack {
  version: string;                         // "style@B1.kitchen.2"
  band: "B1" | "B2" | "B3" | "B4"; skin: SkinTheme;
  refs: { master: string[]; props: string; bgSwatch: string; dontJudgeOnly?: string };   // assetIds
  palette: string[]; outline: { px1024: number; token: string }; shading: "flat+1" | "flat+2" | "tones-3";
  gate: { maxColours: number; maxMeanDeltaE: number; maxGradientShare: number; minOutlineCoverage: number; maxWebpKB512: number };
  status: "draft" | "approved" | "superseded"; supersededBy?: string;
}
export interface AssetRecipe {                // hashed → recipeKey
  kind: AssetKind; key: string;              // semantic key: "obj.food.roti", "cast.protege.golu.B1:think", "bg.kitchen.morning"
  styleVersion: string; castVersion?: string;
  model: { deployment: "taxila-image"; modelVersion: string } | { deployment: "taxila-fast" | "taxila-brain"; svg: true } | { deployment: "gpt-4o-mini-tts"; voice: string; instructionsVersion: string } | { procedural: "zzfx@1.3"; preset: string };
  promptShapeVersion: string;                // the §3.3 slot template version
  slots: Record<string, string | string[]>;  // filled by code, never by the builder
  refs: string[];                            // assetIds sent as image[]
  render: { size: string; quality: "low" | "medium" | "high"; background: "transparent" | "opaque"; n: 1 | 2 | 4 };
}
export interface AssetRecord {
  assetId: string; recipeKey: string; kind: AssetKind; mime: "image/webp" | "image/svg+xml" | "audio/ogg" | "application/json";
  w?: number; h?: number; pivot?: [number, number]; durMs?: number; bytes: number; phash?: string;
  alt: { en: string; hi: string };           // every image has alt text for the a11y mirror (GK §7)
  licence: "house" | "CC0" | "CC-BY-4.0" | "commissioned"; attribution?: string;
  gates: { layer: "L2" | "L3" | "L4" | "L5" | "L6"; pass: boolean; score?: number; by?: string; at: string }[];
  status: "candidate" | "approved" | "quarantined" | "superseded";
}
export interface AssetManifest {             // per game build, written at publish
  buildSha: string; styleVersion: string;
  atlas?: { assetId: string; frames: Record<string, { x: number; y: number; w: number; h: number; pivot: [number, number] }> };
  images: Record<string, string>; audio: Record<string, string>; voice: Record<CueKey, string>;   // semantic key → assetId
  totalBytes: number;                        // V0 budget check
}
export interface AssetJob {
  jobId: string; recipe: AssetRecipe; lane: "race" | "night" | "pack";
  priority: number; deadlineAt?: string; fallbackKey: string;   // what the game uses if the job is late (always exists)
  state: "queued" | "generating" | "post" | "gating" | "review" | "approved" | "rejected" | "fell_back";
  attempts: number; costUsd: number; ms: Record<"gen" | "post" | "gate" | "review", number>;
}
```

The builder agent's tool surface (harnesses doc) gets exactly two asset tools: `asset.find(key) → AssetRecord | null`
and `asset.request(AssetReq) → { key, fallbackKey }`. It never sees prompts, never calls the image model and never
writes into `assets/` directly; the publish step writes the manifest.

---

## 11. Running it on Azure

### 11.1 Components

```
Forge orchestrator ──asset.request──► Neon asset_recipe lookup ── hit ──► manifest
                                          │ miss
                                          ▼
                              Storage Queue "asset-jobs" (lane, priority)
                                          │
                 ┌────────────────────────┴───────────────────────┐
                 ▼                                                ▼
   asset-worker (Container App, Node 22 + sharp + Python/Pillow + ffmpeg + onnxruntime BiRefNet, 2 vCPU/4 GiB, 0-N replicas, KEDA queue scaler)
   1 token-bucket client for taxila-image (4 RPM, shared) ─► gpt-image-2 gen/edit (n=4) ─► post (§3.4) ─► L2 ─► L3 ─► L4 ─► review queue / approve
   TTS client ─► gpt-4o-mini-tts ─► loudnorm ─► WER round trip
```

- **The 4 RPM quota is the binding constraint**, not compute. One shared token bucket (in Neon or a Redis-free
  lease row) with lanes: `race` (in-lesson H2/H3 misses) holds 1 RPM in reserve; `night` and `pack` take the rest.
  240 images/hour; with `n=4` per request, up to 960 candidates/hour if quota counts requests [U].
- **Raise it:** request a quota increase on `taxila-image`; add a second deployment in another region from the
  supported list (TM §4: eastus2, polandcentral, swedencentral, uaenorth, westus3); gpt-image-2.5-flare is GA at the
  same price [V doc, TM §4] and may carry its own quota.
- **Latency budget for a G2 build's asset stage** (LG §8: 60-90 s in parallel with the build): 4 new sprites in one
  round of 4 parallel requests is impossible at 4 RPM if other jobs are queued, so G2 builds use library assets for
  everything except at most **2** new sprites, and the build proceeds on `fallbackKey` art while they generate.

### 11.2 The night pass (the asset half of DC §9)

1. Collect tomorrow's predicted asset keys from planned G2 cores, stories and engines (MO H1).
2. Subtract library hits. Rank misses by demand × reuse / cost (MO §7.3).
3. Generate within the night quota (≈ 7 h × 240 = 1,680 requests), post, gate, queue for review.
4. Morning: reviewers clear the queue; only `approved` assets serve.

---

## 12. Cost per game

Prices: gpt-image-2 image output $30/M, image input $8/M, text input $5/M [V, TM §4]; token counts measured today
[M]; Content Safety ~$1.5/1k images [U]; `taxila-brain` VLM call ≈ $0.01 [U price, measured §8.3]; TTS
$0.015/min [S]; codex $14/M output [S].

| unit | composition | $ |
|---|---|---|
| sprite, generated, library-grade | n=4 low with 2 refs (≈ 2,600 in + 781 out) + medium re-render of the winner with 2 refs (≈ 2,600 in + 1,756 out) + L3 ×5 + L4 ×2 | ≈ 0.044 + 0.074 + 0.008 + 0.02 ≈ **$0.15** |
| sprite, quick (race lane, no medium re-render) | n=4 low with 2 refs + L3 + L4 | ≈ **$0.06** |
| background 1536×1024 medium | 1 ref + 1,372 out + gates | ≈ **$0.07** |
| 4-frame sheet, medium | 1 ref + 1,756 out + gates | ≈ **$0.08** |
| LLM SVG prop | ~500-1,000 output tokens + 2 VLM checks | ≈ **$0.01-0.03** |
| voice line (≈ 4 s) | TTS + transcribe round trip | ≈ **$0.002** |
| SFX | preset id | **$0** |

| game | new assets | asset $ | note |
|---|---|---|---|
| **G1 fill** (cached core, cached skin) | 0 images; 0-6 new voice lines | **$0-0.01** | almost every game a child sees (MO S1: 91.7-99.9% core hits) |
| **G2 build, typical** | 2 quick sprites + 12 voice lines; rest from library | **≈ $0.15** | the LG §8 "images $0.2-0.5" line drops because of AP1 |
| **G2 build, new world** | 1 bg + 6 library-grade sprites + 1 sheet + 20 lines | **≈ $1.1** | once per new skin/mechanic, then reused |
| **skin pack** (MO H0) | 3 sheets + 1 bg + ~30 sprites | **≈ $5** + ~1 h review | 34 packs ≈ $170 + ~5 days of review |
| **India Everyday Kit** | 1,200 sprites | **≈ $180** + review | one-off; re-run only on a style bump |
| **story card set** (LS-engines: 6 cards + 12 vocab pictures) | 18 library-grade images | **≈ $2.7** | replaces LS-engines' $1/chapter estimate, which omitted references, variants and gates |

**Per child per day** the asset line is ≈ $0 marginal (MO8: library misses are paid by the library fund, not by the
child), plus serving at $0.00002 per cold game load. The money is in the one-off library and in review time, which
is why AP1 is the first decision.

---

## 13. Measurements to log (each to `context/measurements.md` with n, method, date)

| id | what | n | method | status |
|---|---|---|---|---|
| M-AP1 | gpt-image-2 transparency and token counts on Azure | 20 images | `asset-probe.mjs`, `asset-probe2.mjs` | **done today** (§1) |
| M-AP2 | Content Safety image latency and blindness to IP/text | 13 | same | **done today** |
| M-AP3 | "close but wrong" rate per asset kind, and how often n=4 contains a gate-passing variant | ≥ 200 requests | night pass logs | to do |
| M-AP4 | representation rates: skin histogram, gender roles, text-in-pixels, exotica, unguided vs cast-spec | 100 per arm | VLM + human labels | to do (the n=2 result here is a mechanism check only) |
| M-AP5 | VLM gate agreement with human reviewers per checklist item | ≥ 300 labelled images | review UI double-labels | to do |
| M-AP6 | identity consistency: edit-from-sheet vs fresh generation, VLM pairwise vs art director | 40 pairs | §4.4 | to do |
| M-AP7 | child recognition of LLM SVG vs raster props (food, vehicles) | ≥ 20 children, 12 props | in-app picture-naming probe | to do |
| M-AP8 | quota semantics: does `n=4` count as 1 request or 4 images against 4 RPM? | 10 bursts | 429 timing | to do |
| M-AP9 | CPU post + BiRefNet on Container Apps (2 vCPU) | 50 images | worker logs | to do |
| M-AP10 | the 4 reference phones: atlas decode + first frame at 1024² vs 2048² | 3 phones | GK M-K2 harness | to do |

---

## 14. Proposed `context/` entries (for the main loop to merge; this workflow writes only to docs/)

- **decisions:** AP1-AP12 from §0, each with its reversal condition as written there.
- **measurements:** M-AP1 and M-AP2 (§1), the SVG probe (§5.5), the VLM gate (§8.3), the SFX probe (§7.1). Each JSON
  beside this file carries n, method and date.
- **rejected (what broke):** `bg-removal-default-model` (rembg's default weights need a BRIA commercial licence) ·
  `fixed-key-chroma` (the model's "pure magenta" is (245, 6, 231) ± 6, so a fixed key left 25-72% of pixels
  semi-transparent) · `text-only-style-anchor` (complex scenes left the house style, 2/2) · `llm-svg-for-culture`
  (mango → orange 3/3, roti → cookies 3/3) · `content-safety-as-sole-image-gate` (severity 0 on a facsimile banknote
  and on text-baked scenes) · `vlm-verdict-field` (it saw uniform skin and did not escalate; code decides) ·
  `r128-for-short-sfx` (integrated loudness gated out under 400 ms) · `musicgen-weights` (CC-BY-NC 4.0).
- **corrects:** LG §6 "Azure parity for transparent unverified" → verified (AP3); LG §6 "MIT rembg" → code only (AP4);
  LS-engines "$1 per chapter" of images → ≈ $2.7 per 18-image set once references, variants and gates are counted (§12).

---

## 15. Risks and open questions

1. **The transparency behaviour is undocumented on Azure.** It may change with a model version roll. The post step
   detects it, and the magenta route is ready, but magenta bans pink and purple from keyed subjects.
2. **Quota.** 4 RPM makes the library-first rule mandatory rather than optional. One busy night pass can starve the
   race lane unless the bucket reserves capacity.
3. **The VLM gate's reliability is the weakest number in this design** (§8.3). Until M-AP5 lands, a human sees
   anything with people in it.
4. **Sample sizes.** Representation results here are n=2 per arm; SVG recognisability is one rater. Treat them as
   mechanisms, not rates.
5. **Legal:** the currency and emblem rules are conservative design choices, not legal advice [U]. The folk-art
   commissioning rule (VI) needs a budget line.
6. **The 2D tutor from 3D renders** depends on the CC pipeline producing a toon-outline render pass; until then the
   tutor appears in games only as a commissioned 2D sheet.
7. **Ear tests outstanding:** whether TTS `marin` and realtime `marin` read as one person (voices-hindi), and the
   SFX bank on a ₹10k phone speaker.

---

## Sources

**Primary documentation read today**
- Azure OpenAI image generation (gpt-image-2 / 2.5 models, sizes, quality, `background`, `input_fidelity`, up to 16
  edit images, PNG/JPEG only, 5 images/min default quota, content filter, minors): https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/dall-e **[V]**
- Azure AI Content Safety overview (APIs, rate limits, "can't … detect illegal child exploitation images", language
  support): https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview **[V]**
- Azure CDN Standard from Microsoft (classic) retirement (2027-09-30; no new profiles since 2025-08-15): https://learn.microsoft.com/en-us/azure/cdn/classic-cdn-retirement-faq **[V]**
- Azure Front Door pricing comparison (Standard $35/month; India example egress and request prices): https://learn.microsoft.com/en-us/azure/frontdoor/understanding-pricing **[V]**
- Azure Front Door caching (366-day cap, Last-Modified only, query-string behaviours, compression list): https://learn.microsoft.com/en-us/azure/frontdoor/front-door-caching **[V]**
- Azure Speech language support (hi-IN Neural and MAI-Voice-2 voices, en-IN DragonHD): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts **[V]**

**Open source read today**
- ZzFX README (MIT, < 1 kB, 21 params, WAV export) and `ZzFX.js` source (`buildSamples`): https://github.com/KilledByAPixel/ZzFX **[V]**
- rembg README (MIT code; default `bria-rmbg` needs a paid commercial agreement; BiRefNet and ISNet options): https://github.com/danielgatis/rembg **[V]**
- BiRefNet README (MIT; 57.7-95.8 ms per image on RTX 4090; ONNX): https://github.com/ZhengPeng7/BiRefNet **[V]**
- maxrects-packer README (MIT, options): https://github.com/soimy/maxrects-packer **[V]**
- AudioCraft README (code MIT, weights CC-BY-NC 4.0): https://github.com/facebookresearch/audiocraft **[V]**

**Other**
- Kenney asset licence (CC0, commercial use, attribution optional): https://kenney.nl/support **[V]**
- Stable Audio Open 1.0 model card: https://huggingface.co/stabilityai/stable-audio-open-1.0 **[V]**
- ElevenLabs Music docs: https://elevenlabs.io/docs/capabilities/music **[V]** (research only; not callable under the Azure-only directive)
- Rest of World, "How AI reduces the world to stereotypes" (2023): https://restofworld.org/2023/ai-image-stereotypes/ **[S]**
- Ghosh et al., "Do Generative AI Models Output Harm while Representing Non-Western Cultures", AIES 2024: https://arxiv.org/abs/2407.14779 **[S]**
- State Emblem of India and the 2005 Act (overview): https://en.wikipedia.org/wiki/State_Emblem_of_India **[S]**

**In-repo**
- `docs/research/factory/{llm-game-generation,multimodal-orchestration,auto-validation-qa,game-kit-frameworks}.md`,
  `docs/research/design/visual-identity.md`, `docs/research/avatar/character-creation.md`,
  `docs/research/voice/voices-hindi.md`, `docs/research/content/game-mechanics.md`, `docs/research/tech-and-market.md` §3-4,
  `context/decisions.md`, `context/measurements.md`.
