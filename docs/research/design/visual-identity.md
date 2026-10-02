# Visual identity: colour, type, illustration, icons, motion and tokens for Taxila

**Date:** 2026-10-02 · **Scope:** child surfaces (Classes 1-9, bands B1-B4) plus the brand marks; the parent surface keeps its own tokens (`parent-experience.md` §13) and is only aligned here.
**Builds on (read first, not repeated):** `learning-science.md` (no reward economies, no streak guilt, parent sees all), `gurukul.md` §6 (4-state rule, one "your turn" highlight, 11 px floor, motion and contrast gates, copy gate; archival palette unsuitable for kids), `kids-ux-ages.md` (bands, status colours §4.3, size and timing tokens §4.1, Devanagari rules §8.2), `lesson-arc.md` §3 (stage regions, 2D teacher), `parent-experience.md` §13.
**Evidence tags:** **[V]** read this session in the primary source · **[X]** measured this session by a script in this folder (deterministic, re-runnable) · **[S]** secondary · **[M]** prior knowledge, not re-checked · **[I]** design inference, with a named test in §11.

**Method and limits.** This session's WebSearch budget was already spent, so evidence comes from direct fetches of primary pages: Duolingo blog, Khan Academy, StoryWeaver FAQ, Pratham Books, W3C WCAG 2.2 Understanding pages, Material 2 dark theme, the AOSP `fonts.xml`, the androidx `MotionTokens.kt` and the google/fonts DESCRIPTION files. Three measurement scripts were run:
- `visual-identity-fonts.py` downloads the exact woff2 files Google Fonts serves an Android Chrome. It measures payload, vertical metrics, Devanagari headline height against Latin x-height, the ink extent of shaped matra and conjunct stress strings (HarfBuzz), and OpenType features. Raw output is in `visual-identity-fonts-2026-10-02.json`.
- `visual-identity-contrast.py` computes WCAG contrast for every pair the identity uses, then the colour-vision-deficiency (CVD) separation of the diagram palette (Machado 2009 simulation, CIEDE2000).
- A specimen sheet was rendered and inspected by eye (scratchpad, not kept).

**Not reachable:** kutuki.com (and per `india-incumbents.md`, the app is dormant since 2025-04), Tulika's site (no text served), the retired design.duolingo.com brand site (the Wayback Machine is blocked here). Statements about those products are [M] or [U].

---

## 0. The answer in fourteen lines

1. **Concept: "a sunlit Indian classroom, drawn by hand, built precisely."** The motifs come from everyday school life that every Indian child shares across religion, region and class: chalkboard and chalk, the slate (*pati*), the ruled copy notebook, the matka, block-print repeats and the kolam dot grid. They do not come from temples, flags, heritage ruins or "exotic India" (§2, §6.6).
2. **The status palette from kids-ux stays exactly as measured.** Marigold `turn` with its ring, leaf `done`, sky `listen`, slate `think`, brick `stop` (errors only). The identity adds colours *around* it and never re-uses those tokens for decoration (§3.3).
3. **Brand colour is jamun (`#5B2E91`, 8.87:1 on cream) [X].** It is purple, so it sits at least 45° of hue away from every status colour and carries no political or religious coding [I]. It is *not* marigold: marigold is reserved for the one "your turn" signal, and a marigold brand would put a second one on every screen.
4. **The whiteboard strip becomes a chalkboard.** Board `#1F3B30` with chalk `#F5F2E8` measures 10.86:1 [X]. It is the signature surface: Indian, warm, and high-contrast without being loud. In dark mode the board gets a wooden frame, because the bare board measures only 1.67:1 against the dark background [X].
5. **Diagrams use their own four colours, chosen for colour-blind children:** neel `#2A72C6`, matka `#C2410C`, neem `#0B5E50`, baingan `#3F2272`. The minimum pairwise CIEDE2000 is 29.5 for normal vision, 19.1 protan, 20.1 deutan and 15.7 tritan, and every mark is ≥3.7:1 even on the dark-mode canvas [X]. About 8% of boys have red-green CVD [V], which is roughly "one in every classroom".
6. **NCERT's green/red integer tokens need care.** A naive green/red pair collapses to ΔE 6.8 under deuteranopia. Neem/matka keeps 29.6 [X], and the tokens always carry + / − glyphs. Ochre was rejected as a core colour because it merges with matka under deuteranopia (ΔE 1.6) [X].
7. **Type is two Ek Type families.** **Baloo 2** handles display (≥ 22 sp, weight 600-700). **Mukta** handles text. They share an x-height (0.469 vs 0.470 em) and a Devanagari headline (0.61 vs 0.63 em) [X], so mixing them never makes sizes jump. **Andika** (single-storey ɑ and g, the only candidate with them [X]) is used for English early-reading tasks.
8. **Payload is measured.** Baloo 2 variable (all weights) costs 148 KB and Mukta 400+600 costs 156 KB for Hindi plus Latin, Andika 13 KB: about 317 KB in total [X]. The fallback, Noto Sans Devanagari VF, ships on Android as the system Devanagari font [V], so text is never invisible while fonts load.
9. **Baloo 2 is never used for small or very bold text.** At 800 weight and 16 px its Devanagari counters fill in (ध, ख) [X, specimen]. Hind is excluded from maths: it has neither `tnum` nor tabular digits, so columns cannot align [X].
10. **Devanagari needs room.** Shaped stress strings (र्कि, ङ्क्ष, कृ, कँ) span 1.17-1.36 em of ink [X]. Single-line boxes are ≥ 1.3 em tall and never clip. Set `lang="hi"` so `locl` picks Hindi rather than Marathi forms, since Baloo 2 and Mukta ship both [X].
11. **Illustration is flat, rounded and exaggerated, with "the fewest details needed to get the point across"** (Duolingo [V]). Detail rises by band, from chunky outlines (B1) to editorial (B4). Text is never baked into images (StoryWeaver's rule [V] and `science-engines.md`).
12. **Skin tones are a token ramp, not an artist's default.** The teacher sits at the Indian median, not the light end. Tones never change with theme, filter or "beauty". Colourism is the most likely stereotype failure in Indian children's art [I], so it is audited (G-VI-7).
13. **Folk and tribal styles (Warli, Gond, Madhubani, Pattachitra) are commissioned from artists of that tradition, credited and paid. Forge never generates them, and never generates "in the style of" a living illustrator** [I, ethics].
14. **Motion is calm.** UI transitions are ≤ 300 ms and use transform and opacity only. The teacher's idle loop pauses with the lesson (WCAG 2.2.2's 5-second rule [V]). Nothing flashes more than 3 times a second [V]. Under reduced motion she keeps her lip-sync and blinks; everything else becomes cross-fades.

---

## 1. What the reference products teach

| reference | what it does visually | take | do not take | tag |
|---|---|---|---|---|
| **Duolingo** | since 2018 "bold, bouncy, and bright"; vectors; "fewest details needed"; exaggeration "almost to the point of caricature"; *craft* framed as how learning feels; refreshed tabs with "a minimal number of" type styles and whitespace instead of containers. World Characters are Rive state machines with **20+ mouths each**, idle "head nods, blinking, and eyebrows", and stop speaking when the learner finishes early | shape economy, exaggerated acting, small type system, Rive viseme pipeline, interruptible speech animation | the reward and streak economy (gems, leagues, owl guilt): rejected in learning-science and gurukul §3.2 | [V] blog; palette names and Feather typeface [M] |
| **Khan Academy Kids** | "minimizes written language in favor of clear, child-friendly icons and animations"; Kodi Bear's gestures carry feedback; "every text element" tap-to-hear; language-agnostic ding/bong; animated walkthroughs; "five whimsical characters" | icon + animation first, a character's body as feedback, tap-to-hear | sparkles flying to a delivery truck (reward economy) | [V]; made with Duck Duck Moose [M] |
| **Kutuki** | preschool, 9 Indian languages, Indian-context stories; parents call it "relatable" | Indian-context settings and names are a stated parent value | n/a (site unreachable, app dormant) | [V] via india-incumbents; style [U] |
| **Pratham Books / StoryWeaver** | 34,000 books in 296 languages; deliberately many illustration styles; illustrations uploaded "without any text embedded"; open image bank | text-free art with labels as overlays; Indian settings "children can recognise"; a reusable CC-licensed image bank for story modules | importing the variety of styles into UI chrome (it breaks identity; contain it in a book frame, §6.5) | [V] |
| **Tulika / Tara Books** | multilingual Indian picture books; Tara works with named Gond, Warli and Patua artists | credit and pay traditional artists by name; publish multilingual editions as equals | "folk style" as generic decoration | [M] |
| **Google Read Along** | reading buddy Diya; stars and badges; 11 languages including Hindi | a named Indian guide character works | stars and badges | [V] |
| **NCERT Ganita Prakash** | green and red integer tokens, Bela's building lift, everyday Indian contexts | keep NCERT's colour *semantics* so school and app agree | NCERT's exact hues where they fail CVD | [V] via maths-engines |

---

## 2. Identity concept and principles

**Concept.** The feeling of the best classroom a child has been in: morning light on a cream wall, a green chalkboard, a teacher who is pleased you came. The rendering should look **handmade in warmth and machine-precise in function**.

**Material sources (shared across India's regions and religions):** chalkboard and chalk; the slate, *pati*, which becomes the scratchpad surface; the ruled copy notebook, with blue lines and a red margin, for writing modules; matka terracotta; block-print *buti* repeats; the kolam/rangoli dot grid, which is literally a geometry algorithm and already a maths engine (`maths-engines.md`); jaali lattice; seasonal light (monsoon grey, winter fog, summer glare) for the Conductor's day cycle.

**Five principles [I]:**
1. **Signal colours are sacred.** Status colours mean one thing each, everywhere, forever (gurukul: "a colour that looked urgent for three minutes would be a lie told in paint").
2. **The content is the hero, the chrome is quiet.** The cream page, ink and one brand accent. The module canvas and the teacher carry the colour.
3. **Concrete over abstract.** Real Indian objects, icons that depict things, no metaphor-only glyphs for B1-B2.
4. **Everyone belongs.** Skin, gender, region, family, ability and setting vary incidentally, never as a "diversity moment".
5. **Cheap to render, cheap to download.** Flat fills, no blur-heavy effects, a 320 KB font budget, transform/opacity motion (low-end devices: kids-ux §8.4).

---

## 3. Colour system

### 3.1 Roles

| family | tokens | where | may carry meaning? |
|---|---|---|---|
| neutrals | `bg` cream, `surface`, `ink`, `ink-2`, `tile-border`, `dusk` (dark-mode canvas) | everything | no |
| **status** (kids-ux §4.3, unchanged) | `turn` + `turn-ring`, `done`, `listen`, `think`, `stop` | the 4-state machine, the mic, the single your-turn element | **yes: the only colours that do** |
| brand | `jamun`, `jamun-soft` | wordmark, app icon, splash, selected nav, teacher's scarf, brand illustrations | no (identity only) |
| material | `board`, `chalk`, `chalk-2`, `chalk-mark`, `board-frame`, notebook lines | whiteboard strip, scratch slate, writing modules | no |
| diagram | core `d1_neel`, `d2_matka`, `d3_neem`, `d4_baingan`; extended `d5_haldi`, `d6_kajal` | inside the module canvas only | yes, but **never alone**: label, shape or pattern always too |
| illustration | skin ramp `skin-1..6`, plus the diagram hues at tints | characters and scenes | no |

### 3.2 Token values and measured contrast (WCAG 2; [X] `visual-identity-contrast.py`, 0 failures)

| token | light | measured | dark | measured | note |
|---|---|---|---|---|---|
| `bg` / `surface` | `#FFF8EE` / `#FFFFFF` | | `#16140F` / `#221F19` (`surface-2` `#2C2821`) | | warm, never pure black |
| `ink` / `ink-2` | `#1F1A14` / `#5A5148` | 16.37 / 7.36 on bg | `#F6F1E8` / `#BDB4A6` | 16.36 / 8.98 | kids-ux |
| `jamun` | `#5B2E91` | 8.87 on bg; white on it 9.36 | `#C3A6F5` | 8.85 on bg | brand |
| `jamun-soft` | `#EFE6FA` | ink on it 14.28; jamun on it 7.74 | (use `surface-2`) | | brand tint fills |
| `board` / `chalk` | `#1F3B30` / `#F5F2E8` | 10.86; `chalk-2` `#BFD3C6` 7.73; `chalk-mark` `#F2CF6B` 8.06 | `#22423A` / same chalk | 9.82; chalk-2 6.99 | chalk-mark = a chalk highlight, **not** a your-turn signal |
| `board-frame` | `#8C6B4A` | 4.61 on bg | `#A07E5A` | 4.93 on bg | fixes dark board 1.67:1 |
| `dusk` (canvas in dark mode) | `#E9E1D2` | ink 13.29, ink-2 5.98 | (same) | | §3.5 |
| `turn` + ring | `#FFB21E` + 3 px `#9A5B00` | fill alone 1.71 **fails**; ring 5.15; ink on fill 9.57 | `#FFB21E` | 10.20 | ring kept in dark mode too, for shape constancy (stricter than kids-ux) |
| diagram core | neel `#2A72C6`, matka `#C2410C`, neem `#0B5E50`, baingan `#3F2272` | on bg 4.61 / 4.91 / 7.29 / 11.83; on dusk 3.74 / 3.99 / 5.92 / 9.60; white label on each ≥ 4.61 | same (drawn on dusk) | | §3.4 |
| diagram extended | haldi `#946B0E`, kajal `#3A3631` | on dusk 3.70 / 9.23 | same | | haldi only with redundancy |

### 3.3 Reservation rules (lint-enforced, G-VI-1)
- `turn` is rendered only by `YourTurn`, at most once per screen (kids-ux G4). No marigold ring or glow on any illustration or decoration. Yellow *objects* such as the sun or a mango are fine, because the signal is ring + pulse + interactivity, not hue [I].
- `stop` (brick) is never used for a wrong answer, a lower level or a parent learning state (kids-ux, parent-experience PX2).
- Diagram colours never leave the module canvas, so chrome never borrows a meaning.
- **No saffron-white-green triad.** Brand oranges and yellows stay ≥ 9° of hue away from flag saffron `#FF9933` (30°). Measured: `turn` 39.5°, matka 17.5°, chalk-mark 44.4°, haldi 41.6° [X]. Marigold, cream and leaf are never stacked as three horizontal bands. No flag or national emblem anywhere; commercial use is restricted by the Emblems and Names Act 1950 [M]. Gurukul rejected saffron for its "political weight", and that holds here.
- **Few colours per B1 screen:** chrome plus at most one module palette (TIDRC: avoid many colours, ages 2-7 [V via kids-ux]).
- **No gendered colour coding** (pink for girls, blue for boys) in avatars, profiles or characters [I].

### 3.4 Diagram palette and colour-vision deficiency
- **Method [X]:** Machado, Oliveira & Fernandes (2009) severity-1.0 protan, deutan and tritan matrices applied in linear sRGB, then CIEDE2000 between every pair. Candidates came from a constrained search (≥ 3:1 on `dusk`, white text ≥ 4.5:1, saturation ≤ 0.8), then hand-tuning. The matrix digits are reproduced from the paper as widely re-published [M]; re-check them before this becomes a `context/` entry.
- **Results:** the core four's minimum ΔE is 29.5 (normal), 19.1 (protan, matka vs neem), 20.1 (deutan, neel vs baingan) and 15.7 (tritan, neel vs neem). Adding haldi drops the deutan minimum to 1.6, which is why haldi is extended-only.
- **Rules.** A module uses ≤ 4 colour categories with meaning. A 5th or 6th category needs a pattern (hatch, dots), a shape or a direct label. Area fills use the hue at 15-25% tint with a full-strength outline. Legends sit next to the marks, never in a separate box.
- **Integers and algebra tiles** (NCERT semantics): positive = neem with "+", negative = matka with "−". Luminance contrast is 1.48 and deutan ΔE 29.6, against 6.8 for a naive `#2E9E44`/`#D62828` pair [X]. The glyph is mandatory, because hue alone fails grayscale.
- **Sky `listen` (`#2563C9`) and neel (`#2A72C6`) are close.** Acceptable, because they never share a region (mic vs canvas). If a module ever places a mic inside the canvas, use the mic's ring rather than neel [I].

### 3.5 Dark mode
- **Who gets it.** B1-B2: light only in the child UI; the parent may set a "night" dim (warmer, darker chrome). B3-B4: follow the OS setting, with a toggle in settings. Teens prefer it and phones are used at night (kids-ux) [I].
- **Why light stays the default:** dark text on a light background reads better for people with normal vision (Piepenbrock et al. 2013, positive-polarity advantage) [M].
- **Chrome goes dark; content does not.** Modules, diagrams, illustrations and the teacher render on the `dusk` paper canvas `#E9E1D2`. This keeps one diagram palette, keeps NCERT colour semantics, keeps reading content in positive polarity, and guarantees **skin tones and illustrations never change with theme** [I]. Never invert or filter an illustration.
- Elevation comes from surface steps (`surface` → `surface-2`) plus a 1 px `rgba(246,241,232,.08)` border, not shadows. Material: avoid pure black and use desaturated accents [V].
- **Risk:** `dusk` is still bright at night (relative luminance ≈ 0.76). Measure glare complaints and brightness changes in B3-B4 night sessions (D-VI-3).

### 3.6 Skin, hair and cast colours (illustration tokens)
- `skin-1..6`: `#F3D2B3`, `#E2B48C`, `#C99366`, `#A9744A`, `#8A5634`, `#5F3A22`. Each has one shade tone (same hue, L* −12) and no blush gradients. Hair: `#1F1A14` with a `#4A3A30` highlight so the shape still reads against kajal outlines.
- **The teacher defaults to `skin-3`.** Each lesson pack's cast is drawn from the whole ramp, weighted to the middle (`skin-3`/`skin-4`). Heroes are never lightened, and wrongdoers are never darker [I]. The audit is G-VI-7.

---

## 4. Typography

### 4.1 Candidates, measured [X] (Google Fonts woff2 served to Android Chrome, 2026-10-02)

| family (licence OFL) | Hindi page payload (deva + latin, 400) | other weights | Latin x-height (em) | Deva headline (em) / ÷ x-height | stress-ink span (em) | tnum / tabular digits | Hindi locl | notes |
|---|---|---|---|---|---|---|---|---|
| **Baloo 2** (Ek Type) | 115 + 33 = **148 KB** (variable 400-800, all weights) | included | 0.469 | 0.610 / 1.30 | 1.197 | `tnum` yes / no | HIN + MAR | display: "affable", "carefree yet confident" [V]; counters clog at 800/16 px |
| **Mukta** (Ek Type) | 62 + 13.5 = **75 KB** per weight (static) | 600: 67 + 14 KB | 0.470 | 0.630 / 1.34 | 1.207 | `tnum` yes / no | HIN + MAR | "humanist, mono-linear", one family across Indian scripts [V] |
| Hind (ITF) | 38 + 8.6 = **47 KB** per weight | 600 ≈ same | 0.508 | 0.642 / 1.26 | 1.288 | **no / no** | none | built for UI; Devanagari "94% as tall as the Latin uppercase" [V]; lightest |
| Noto Sans Devanagari | 121 + 25 = 146 KB (variable) | included | 0.536 | 0.622 / 1.16 | 1.170 | yes / **yes** (Noto Sans Latin) | MAR, NEP, SAN | **Android system font, 0 bytes on device** [V fonts.xml] |
| Annapurna SIL | 36 + 13.5 = 49 KB | n/a | 0.453 | 0.645 / 1.42 | 1.262 | no / yes | NEP, NEW | calligraphic primer feel |
| Kalam (ITF) | 53 + 14 = 67 KB | n/a | 0.511 | 0.645 / 1.26 | 1.362 | no / no | none | handwriting, slanted |
| Andika (SIL) | Latin only, 12.8 KB | n/a | 0.498 | | | no / yes | | **single-storey ɑ and g by default**; "designed especially for literacy use" [V] |
| Atkinson Hyperlegible Next | Latin only, 34 KB | variable | 0.496 | | | yes / no | | double-storey a; heavier |

Two more measured facts. `₹` (U+20B9) is only in the **Devanagari** subset's unicode-range, and `?`, digits and spaces are only in the Latin subset [X]. So every Hindi screen downloads both files, and an English screen showing ₹ silently downloads the Devanagari file.

### 4.2 Decisions (roles and stacks)

| role | family | weights | where | stack |
|---|---|---|---|---|
| `font-display` | **Baloo 2** | 600, 700 (800 only ≥ 32 sp) | titles, big numerals in modules, chalkboard chips, the wordmark | `"Baloo 2", "Mukta", "Mukta-fb", sans-serif` |
| `font-text` | **Mukta** | 400, 600 | captions (karaoke), labels, body, buttons | `"Mukta", "Mukta-fb", sans-serif` |
| `font-reader` | **Andika** (Latin) + Mukta (Devanagari) | 400 | English-medium early-reading and tracing tasks in B1-B2 (letters as children are taught to write them) | `"Andika", "Mukta", sans-serif` |
| `font-parent` | Noto Sans + Noto Sans Devanagari | 400, 600 | parent surface (unchanged, parent-experience §13) | as specified there |

- **Fallback metrics [X]:** `Mukta-fb` is two `@font-face` rules with `unicode-range`. Latin → `local("Roboto")` with `size-adjust: 89%` (x-height 0.528 → 0.470). Devanagari → `local("Noto Sans Devanagari")` with `size-adjust: 101%`. Whether `local()` matches Android system fonts by name is [U]; verify on Android 10-14 Chrome.
- **Kalam and Annapurna are not adopted.** Kalam's slant and inconsistent forms are wrong for early readers. Annapurna is a candidate only if M-VI-1 shows children read primer-like forms better.
- **Hind is not adopted** despite being lightest: no `tnum` and proportional digits break column arithmetic [X].

### 4.3 Type scale (sp; Latin / Devanagari; extends kids-ux §4.1, whose caption, label and title values are kept)

| token | font | B1 | B2 | B3 | B4 | weight | leading (Latin / Deva) |
|---|---|---|---|---|---|---|---|
| `type.display` | Baloo 2 | 36 / 38 | 32 / 34 | 28 / 30 | 26 / 28 | 700 | 1.2 / 1.45 |
| `type.title` | Baloo 2 | 28 / 30 | 26 / 28 | 24 / 26 | 22 / 24 | 600 | 1.25 / 1.5 |
| `type.numeral` (modules) | Baloo 2 + `tnum` | 40 | 36 | 32 | 28 | 700 | 1.1 |
| `type.board` (chalk chips) | Baloo 2 | 28 / 30 | 26 / 28 | 22 / 24 | 20 / 22 | 600 | 1.3 / 1.5 |
| `type.caption` (karaoke) | Mukta | 22 / 24 | 20 / 22 | 18 / 20 | 16 / 18 | 500 lit word / 400 | 1.35 / 1.6 |
| `type.body` | Mukta | 20 / 22 | 19 / 21 | 17 / 19 | 16 / 18 | 400 | 1.4 / 1.6 |
| `type.label` | Mukta | 20 / 22 | 18 / 20 | 16 / 18 | 15 / 17 | 600 | 1.3 / 1.5 |
| `type.reader` (B1-B2 English reading) | Andika | 28 | 24 | | | 400 | 1.5 |

- Child floor: 16 sp Latin / 18 sp Devanagari (kids-ux). The 11 px floor (gurukul) is for parent and legal text only.
- **What the measurement adds:** in Ek Type fonts the Devanagari headline sits at the Latin cap height (Baloo 0.995×, Mukta 1.0× [X]). At equal px the Devanagari body is already ~1.3× the Latin x-height. The +2 sp Devanagari bump is therefore about **matra detail** (the ि loop, ं dot, nukta), not overall size. Keep it, and test "equal vs +2" in M-VI-1.

### 4.4 Devanagari and numeral rules (G-VI-5)
- `lang="hi"` on every Hindi node, so `locl` selects Hindi letterforms (Baloo 2 and Mukta ship both HIN and MAR systems [X]). Mixed Hinglish captions mark spans by script.
- No `letter-spacing`, justification, faux italic or underline on Devanagari (Alphabettes [V via kids-ux]). Emphasis uses weight or the `chalk-mark` highlight.
- Single-line boxes ≥ 1.3 em plus padding (ink spans measure 1.17-1.36 em [X]). No `overflow: hidden` on text. The screenshot test strings are the stress set in `visual-identity-fonts.py`.
- Maths numerals: `font-variant-numeric: tabular-nums` always; `frac` for typeset fractions only where the engine does not draw them. Digits are international 1 2 3 by default (kids-ux §8.1).
- Preload the Devanagari subset on every screen (Hindi is always present, and it also holds ₹).

### 4.5 Loading on patchy data
- **APK:** bundle Baloo 2 (variable) + Mukta 400/600 + Andika, ≈ 317 KB, with zero network cost.
- **Web:** `font-display: swap` with the metric-matched fallback; `preload` only Mukta 400 Devanagari + Latin (75 KB); Baloo 2 loads after first paint; a service worker caches everything. The first lesson must never wait on a font [I].
- **Budget gate G-VI-4:** ≤ 320 KB of fonts total, and adding a family requires a budget change.

---

## 5. Iconography
- **Two tiers.** (a) **Young (B1-B2): illustrated object icons**, 40-48 dp on a 64 dp hit target, flat fill + kajal outline, depicting things (house = home, ear = hear again, pencil = write, eraser = undo, because children used an eraser but not undo arrows: NN/g via kids-ux [V]). (b) **Older and parent: Material Symbols Rounded** [M, Apache-2.0], 24 dp grid, 2 dp stroke, rounded terminals to rhyme with Baloo.
- **Every icon has a label.** Spoken on tap for Young, as text for Older. Icon-only controls are limited to mic, pause and home, each with an accessible name.
- **Banned for Young:** hamburger, kebab, gear (parent only, deliberately dull per Sesame [V via kids-ux]), share, undo/redo arrows, abstract arrows without an object.
- **No reward iconography:** no stars, coins, trophies, medals, flames or streak counters on child surfaces (learning-science rule 27). Completion is shown by the concept itself (the shared pizza) or a filled stepping stone.
- **Cultural screen [M, verify with the parent panel in M-VI-7]:** no religious symbols as decoration; no flags; no hand gestures whose meaning varies (the OK ring, palm-in V); a thumbs-up is fine. **Maps of India only with Survey of India-compliant external boundaries** [M], because incorrect depictions are legally sensitive in India.
- The status ring, listening pulse and thinking dots are motion components (§7), not icons.

---

## 6. Illustration guidance

### 6.1 Shape language by band (extends kids-ux `illustration` token)

| | B1 (6-7) | B2 (8-9) | B3 (10-12) | B4 (13-15) |
|---|---|---|---|---|
| construction | circles and rounded rectangles, every corner rounded | same, more parts | mixed rounded and straight, some angles | near-natural shapes |
| outline (at 360 dp width) | 3 dp kajal, uniform | 2.5 dp | 1.5-2 dp, or none on backgrounds | none, or a 1 dp accent |
| shading | flat + 1 shade tone | flat + 1 shade | 2 tones + simple cast shadow | 2-3 tones, light texture |
| characters, head : body | 1 : 3 | 1 : 3.5 | 1 : 5 | 1 : 6.5 |
| eyes and expressions | large eyes (≤ 1/5 face height), exaggerated acting (under-6s miss subtle cues: NN/g [V via kids-ux]) | large, exaggerated | natural size, clear acting | subtle, realistic |
| detail | "the fewest details needed" (Duolingo [V]); ≤ 6 hues + skin + neutrals per scene | ≤ 8 hues | graphic-novel | editorial |
| backgrounds | 30% lower contrast than foreground; nothing that looks tappable unless it is (Sesame [V via kids-ux]) | same | same | same |

- **Never:** gradients (low-end rendering and print reuse), glossy 3D, photo collage, mascots with "guilt" acting, sarcasm aimed at the child.
- **Mistakes:** show thinking, never failure (no red X on the child's work, no crying character). Humour targets objects and situations, never the learner (Duolingo-style exaggeration, minus guilt).

### 6.2 The teacher (character sheet brief for Rive; illustrated face per kids-ux §11 and lesson-arc §3)
- **Read:** mid-20s, a warm "didi" for Young bands and a respected older cousin for Older bands. **The same person** re-drawn per band, the way one character is drawn differently in picture books and in comics.
- **Identity anchors** (constant across bands and tutor variants of her): face shape; a side plait; `skin-3`; a jamun scarf or dupatta with a matka block-print border; a chalk stick or pencil in hand for pointing at the module.
- **Clothing:** everyday contemporary Indian (kurta with jeans or salwar, a cardigan in winter packs). No default religious markers; bindi, hijab and turban appear as cast variants, never as her "type".
- **Non-sexualised by spec:** realistic proportions, modest cut, no makeup emphasis, no beauty filter, no fairness glow. This is a child-safety floor item, not a style preference (no romance or companion register: CLAUDE.md).
- **States:** idle, listening (lean in), thinking (eyes up, chalk to chin), speaking, delighted, plus a gentle "hmm" for wrong answers. **20+ mouth shapes** (Duolingo [V]). The visemes are acoustic (HeadAudio or amplitude: tech-and-market §2), so Hindi needs no special set: retroflex and aspiration are not visible [I].
- **Hands do work:** she points at the anchor (kids-ux S2), holds up "one moment" during waits, and claps only when the payoff is concept-earned.

### 6.3 Supporting cast and animals
- **Protégé for teach-back** (kids-ux S7): a younger *human* cousin for B1-B2 (child-like guides help: TIDRC [V via kids-ux]); a classmate who missed class for B3-B4.
- **Animal choices carry Indian idioms [M].** Avoid the owl as a "clever" symbol (*ullu* means fool). Avoid the parrot for anything about understanding (*tota-ratant* means rote learning). Avoid cow and pig as playful characters (religious sensitivities), and the monkey as a comic stand-in for a person. Squirrels, tortoises, goats, sparrows, fish, dogs and cats are fine. Elephants are fine but never Ganesha-like.

### 6.4 Representation matrix (Forge cast generator, logged per pack)
- Protagonists: gender 50/50; skin across the ramp, weighted to the middle; names drawn from regional pools across Indian languages and communities, without religious or caste markers as "types".
- Settings rotate: village, small town, metro flat, hills, coast, desert, the Northeast; government and private schools in uniform.
- Families: joint, nuclear, single-parent, grandparents caring.
- Work: mothers at work, fathers cooking; no caste-coded occupations.
- Disability appears incidentally (glasses, hearing aid, wheelchair) in ≥ 1 of 10 scenes [I].
- **Not shown:** "fair = good", poverty as backdrop, exotica (snake charmers, palaces, Taj-as-India), regional caricature, Bollywood glamour, deities or places of worship as generic "India". Festivals appear only in seasonal content, rotating across communities.

### 6.5 Where images come from
1. **Commissioned house style:** the teacher, the cast and the UI illustrations, built from Rive and SVG source.
2. **StoryWeaver image bank for story and reading modules.** The FAQ states CC-BY 4.0 ("distribute, remix … even commercially, as long as they credit you") and text-free uploads [V]. Pratham's own about page says CC0 [V]. Because the two conflict, **always attribute** and check each asset's licence. Show the many styles inside a "book" frame so UI identity stays stable.
3. **Forge generation (gpt-image-2 on Azure, first-party):**
   - generate against the band's style reference sheet and quantise to the illustration palette;
   - state the skin-tone token for each character from the cast list;
   - **no text in images** (labels are SVG overlays);
   - **no "in the style of" a living artist or a living folk tradition**;
   - log the seed and prompt;
   - human review of a sample of every batch against the G-VI-7 checklist.

### 6.6 Cultural motifs: use and avoid

| use (secular, shared, everyday) | how | avoid | why |
|---|---|---|---|
| kolam / rangoli dot grid | loading and think patterns, symmetry modules, P7 wrap art | religious rangoli motifs (Om, swastika, deities) | religious marking |
| block-print *buti* repeats | ≤ 6% opacity texture on non-reading areas, scarf borders | full-strength busy prints behind text | legibility |
| chalkboard, chalk, slate, copy notebook | whiteboard strip, scratchpad, writing modules | sepia "nostalgia" filters | dated, not warm |
| matka, roti, kites, monsoon, everyday food | module contexts (volume, fractions, angles, water cycle) | food or dress as regional caricature | stereotype |
| commissioned Warli / Gond / Madhubani units | special story units, artist named and paid | AI pastiche; folk art as generic décor | appropriation; Madhubani and Warli are GI-tagged [M] |
| the name *Taxila* as "a great place of learning" | wordmark only | Gandhara ruins and "ancient glory" heritage imagery | Taxila lies in present-day Pakistan and its art is Buddhist; heritage nationalism is off-brand [I] |

---

## 7. Motion

### 7.1 UI motion tokens (gurukul and kids-ux values kept; easings from Material 3 `MotionTokens.kt` [V])

| token | value | use |
|---|---|---|
| `motion.press` | 100 ms; Young `scale(0.94)` + 4 dp ledge push, Older `scale(0.97)` | pointer-down feedback (≤ 100 ms: kids-ux row 11) |
| `motion.fast` | 140-160 ms, accelerate `cubic-bezier(0.3,0,1,1)` | exits, chip changes |
| `motion.base` | 240 ms (Young) / 160 ms (Older), decelerate `cubic-bezier(0,0,0,1)` | enters, tiles appearing |
| `motion.layout` | 300 ms, standard `cubic-bezier(0.2,0,0,1)` | layout-mode changes L1 → L3 (the cap is 300 ms) |
| `motion.spring` | damping 1.0, response 0.35 s, interruptible | drag snap, magnetic drop |
| `motion.turn-pulse` | ring steady + glow opacity 0.6 ↔ 1.0, 1.6 s period (0.6 Hz) | the single your-turn element; **no bounce or scale** |
| `motion.listen` | ring width follows input level, 60-80 ms smoothing | the mic while listening |
| `motion.payoff` | 600-1200 ms, once, concept-shaped (the pizza actually splits) | the end of a solved item; never a loop |
| reduced | all `motion.*` → 1 ms cross-fade | `prefers-reduced-motion` (gurukul) |

### 7.2 Character motion (the teacher in Rive)
- Blink 120-160 ms at random 2-6 s intervals; a breathing loop of 4 s at 1-2% amplitude; listening lean-in 300 ms; state cross-fade 200 ms; lip-sync on the playback clock (companion-tech); "delighted" 700 ms. Her speech animation stops when she is interrupted (Duolingo [V]).
- **She is still while the child thinks.** Idle sway is reduced in YOUR TURN, so attention moves to the ringed element [I].

### 7.3 Limits (G-VI-6)
- Nothing flashes more than 3 times in any 1 s, or it stays under WCAG's general and red flash thresholds (25% of a 10° visual field) [V]. The turn pulse is 0.6 Hz.
- WCAG 2.2.2: auto-started motion lasting > 5 s alongside other content must be pausable [V]. **The teacher's idle loop and any ambient module animation stop on pause** (⏸ in kids-ux S2).
- WCAG 2.3.3: interaction-triggered motion can be disabled [V]. Under reduced motion she keeps lip-sync and blink, which carry speech information, and drops sway, bounces and camera moves. Payoffs become their end state with a sound.
- Transform and opacity only. At most 2 animated layers besides the teacher on the B1 stage. No parallax. Frame-time gate on a 2-3 GB device (kids-ux G9).

---

## 8. Token set (single source; CSS custom properties, mirrored to Android resources by a build step)

```css
:root {
  /* colour: neutrals + status (kids-ux 4.3, unchanged) */
  --bg:#FFF8EE; --surface:#FFFFFF; --ink:#1F1A14; --ink-2:#5A5148; --tile-border:#8C8478;
  --turn:#FFB21E; --turn-ring:#9A5B00; --done:#1F7A4D; --listen:#2563C9; --think:#5B6470; --stop:#B3261E;
  /* brand + material */
  --jamun:#5B2E91; --jamun-soft:#EFE6FA; --board:#1F3B30; --board-frame:#8C6B4A;
  --chalk:#F5F2E8; --chalk-2:#BFD3C6; --chalk-mark:#F2CF6B; --dusk:#E9E1D2;
  --note-line:#C9DCEB; --note-margin:#E58C8C;               /* decorative only, never text */
  /* diagram (module canvas only) */
  --d1-neel:#2A72C6; --d2-matka:#C2410C; --d3-neem:#0B5E50; --d4-baingan:#3F2272; --d5-haldi:#946B0E; --d6-kajal:#3A3631;
  --int-pos:var(--d3-neem); --int-neg:var(--d2-matka);      /* always with + / - glyph */
  /* skin ramp (illustration; never themed) */
  --skin-1:#F3D2B3; --skin-2:#E2B48C; --skin-3:#C99366; --skin-4:#A9744A; --skin-5:#8A5634; --skin-6:#5F3A22;
  /* type */
  --font-display:"Baloo 2","Mukta","Mukta-fb",sans-serif; --font-text:"Mukta","Mukta-fb",sans-serif;
  --font-reader:"Andika","Mukta",sans-serif;
  /* space: 4 dp base */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:24px; --space-6:32px; --space-7:48px; --space-8:64px;
  --gutter-young:20px; --gutter-older:16px;
  /* radii (tile radius per band from kids-ux: 24/20/16/12) */
  --radius-xs:6px; --radius-sm:10px; --radius-md:16px; --radius-lg:24px; --radius-xl:32px; --radius-pill:999px;
  --radius-tile-b1:24px; --radius-tile-b2:20px; --radius-tile-b3:16px; --radius-tile-b4:12px;
  /* elevation: blur-free "ledge" for tactile tiles, one soft shadow for cards */
  --ledge-surface:#E6DCCB; --ledge-turn:#C98500; --ledge-jamun:#3E1F66;
  --elev-press:0 4px 0 var(--ledge-surface);                /* Young tiles; Older 0 2px 0 */
  --elev-card:0 1px 2px rgba(31,26,20,.10),0 2px 8px rgba(31,26,20,.08);
  --elev-sheet:0 -4px 16px rgba(31,26,20,.12);
  /* motion */
  --dur-press:100ms; --dur-fast:150ms; --dur-base:240ms; --dur-base-older:160ms; --dur-layout:300ms;
  --ease-standard:cubic-bezier(.2,0,0,1); --ease-enter:cubic-bezier(0,0,0,1); --ease-exit:cubic-bezier(.3,0,1,1);
  --turn-ring-width:3px; --turn-pulse-period:1.6s; --focus-ring:3px solid var(--ink); --focus-offset:3px;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* Older bands only */
  --bg:#16140F; --surface:#221F19; --surface-2:#2C2821; --ink:#F6F1E8; --ink-2:#BDB4A6;
  --done:#4CC38A; --listen:#7FB0FF; --think:#9AA3AF; --stop:#FF8A80; --jamun:#C3A6F5;
  --board:#22423A; --board-frame:#A07E5A; --elev-card:none; --elev-sheet:none; --elev-press:0 3px 0 #0E0D0A;
  /* --dusk, diagram, skin: unchanged. Modules and illustrations sit on --dusk. */ } }
:root[data-theme="dark"] { /* same values as the block above */ }
@media (prefers-reduced-motion: reduce) { :root { --dur-press:1ms; --dur-fast:1ms; --dur-base:1ms; --dur-base-older:1ms; --dur-layout:1ms; } }
```

Band-specific sizes (hit targets, tiles, mic, timeouts) remain in kids-ux §4.1. The type scale is §4.3. Parent tokens are in parent-experience §13. `--ledge-*` are hand-picked darker tones of each fill [I]; they are decorative, so the 3:1 rule applies to the tile border, not the ledge. The `--elev-press` ledge is the Duolingo-style tactile button: cheap (no blur) and it reads as pressable [M].

---

## 9. Where the identity shows up (component notes; extends kids-ux §6 and lesson-arc §3)
- **Wordmark:** Baloo 2 800, custom-tightened, jamun on cream; Devanagari lock-up below. Open question: तक्षशिला (heritage spelling) or टैक्सिला (transliteration) (§13).
- **App icon:** must be findable by a 6-year-old among 30+ icons on a shared phone. Candidates: the teacher's face on jamun; a chalk kolam knot on board-green; a "T" in chalk on jamun. Decide by M-VI-3.
- **Splash and first launch:** cream page, the teacher waving, the wordmark small. The audio greeting carries the brand (onboarding-flow).
- **WhiteboardStrip → chalkboard:** `board` fill, `board-frame` 3 dp edge (always in dark mode, optional in light), chips in `type.board` chalk, the newest chip underlined in `chalk-mark`.
- **AnswerTile:** `surface` with `tile-border` and the `--elev-press` ledge. It is inert (desaturated, no ledge) while she speaks (kids-ux S2). The ringed tile is the only marigold on screen.
- **ModuleCanvas:** `bg`, or `dusk` in dark mode, with a `radius-lg` frame. Diagram palette only inside it. Its manifest declares which redundant cue backs each colour category.
- **CaptionStrip:** Mukta; lit word in 500 weight with a `jamun-soft` underlay (not marigold, which would be a second your-turn).
- **Payoff:** the concept completes itself, and one chalk-sparkle draw-on is allowed (≤ 600 ms, no confetti loop).
- **Book frame** for StoryWeaver and commissioned folk-art units: cream page, `radius-md`, attribution line in `ink-2` at 13 sp.

---

## 10. Visual-tone and copy notes (shapes, never lines; repo law: sentence-shaped prompt text gets recited)
- The look should say "pleased you came", never "hurry up" or "you are behind". Warmth comes from light, colour and the teacher's face, not from exclamation marks.
- Older bands: fewer outlines, more white space, no baby round-ness on chrome (tile radius drops by band). Respect reads as restraint.
- Microcopy beside visuals follows kids-ux §7: Young labels ≤ 4 words with a picture; no "kid/kids/bachcho" for Older; copy gate (no dashes, no filler verbs).
- Colour names stay internal (neel, matka, neem, baingan). The child never sees a colour name used as a judgment.

---

## 11. Gates and measurements

**Build gates** (each with a negative control, as in gurukul's `check-*.mjs`):
- **G-VI-1 token lint:** no raw hex in components; `turn` only in `YourTurn`; `stop` never in learning feedback; diagram tokens only under `ModuleCanvas`. Negative control: a fixture using `--turn` on a card must fail.
- **G-VI-2 contrast:** `visual-identity-contrast.py` (port to `.mjs` for CI) must report 0 failures. Negative control: `turn` on `bg` without the ring must fail.
- **G-VI-3 CVD:** core-four minimum ΔE ≥ 15 under protan, deutan and tritan. Every colour-coded module manifest declares a redundant cue. Negative control: adding `d5_haldi` to the core must fail.
- **G-VI-4 font budget:** ≤ 320 KB web, ≤ 400 KB APK, measured by the fonts script.
- **G-VI-5 Devanagari:** `lang` set on script spans; no `letter-spacing` on Devanagari selectors; `tabular-nums` in maths modules; single-line text boxes ≥ 1.3 em; screenshot diff of the stress set at every type token (with kids-ux G8).
- **G-VI-6 motion:** reduced-motion audit; flash detector (no luminance alternation > 3 Hz over > 25% of a 10° field); auto-motion > 5 s has a pause path.
- **G-VI-7 illustration audit:** a sampled checklist on every Forge batch. Checks: skin token matches the cast list; no text baked in; no religious or flag motifs; gender, setting and family balance against the matrix (§6.4); no "fair = good" pattern.
- **G-VI-8 theme invariance:** teacher and cast pixels are identical in light and dark (skin never themed).

**Measurements before launch** (log n, method and date in `context/measurements.md`):

| id | question | method | n | decides |
|---|---|---|---|---|
| M-VI-1 (with kids-ux M-UX-7) | Devanagari legibility: Mukta vs Noto Sans Devanagari vs Hind (vs Annapurna) at equal size and +2 sp | oral reading speed and errors on matched passages, Class 2-4 Hindi-medium, budget phones | 24-36 | `font-text`, the +2 sp rule |
| M-VI-2 (with M-UX-5) | "who is this app for?" across 3 illustration treatments per band | card sort | 8 per band | §6.1 band edges |
| M-VI-3 | app icon findability | time to tap Taxila among 24 icons on a home-screen mock, B1-B2, 3 candidates | 30 | app icon |
| M-VI-4 | CVD in practice | integer tokens and core-four diagrams with Ishihara-screened CVD boys vs controls; error rate on colour-coded items | 10 + 10 | §3.4 |
| M-VI-5 | parent perception of the brand | semantic differential (premium, trustworthy, right age for my child), jamun vs a teal alternative, Hindi-belt and metro parents | 40 | D-VI-1 |
| M-VI-6 | stereotype audit | panel of parents and teachers from 4 regions rates 50 Forge images on a checklist + free text | 12 raters | G-VI-7 thresholds |
| M-VI-7 | night glare | B3-B4 dark-mode sessions after 20:00: brightness changes, early exits, comments | 30 sessions | D-VI-3 |

---

## 12. Proposed `context/` entries (for the main loop to merge; this workflow writes only to docs/)

**Decisions (each with a reversal condition):**
- **D-VI-1 Brand = jamun purple, not marigold.** Reverse if M-VI-5 shows a teal or other alternative wins on trust or premium by ≥ 0.5 points on a 7-point scale, or children confuse jamun chrome with `listen`.
- **D-VI-2 Baloo 2 display + Mukta text (+ Andika reader).** Reverse to system Noto Sans Devanagari for text (0 bytes on Android) if M-VI-1 shows Mukta is not faster or more accurate (difference within noise), or if web first-lesson time on 3G regresses by > 1 s because of fonts.
- **D-VI-3 Dark mode darkens chrome only; content stays on `dusk`.** Reverse if M-VI-7 shows glare complaints or brightness-down events in > 25% of night sessions; then design a dimmed diagram palette and re-run the CVD gate.
- **D-VI-4 Core-four diagram palette with mandatory redundancy.** Reverse if M-VI-4 shows CVD children's colour-item error rate exceeds controls by > 5 points.
- **D-VI-5 Folk and tribal art only by commission, never generated.** Reverse only if a tradition's artist collective licenses generative use with consent and royalties.
- **D-VI-6 `turn` ring kept in dark mode too.** Reverse if it tests as visual noise without helping turn-taking (lesson-arc M-ARC-1 data).

**Rejections (tried this session, and what broke):**
- **Naive green/red integer tokens** (`#2E9E44`/`#D62828`): deutan ΔE 6.8. Replaced by neem/matka (29.6) + glyphs [X].
- **Ochre/haldi as a core diagram colour:** merges with matka under deuteranopia (ΔE 1.6) [X].
- **Baloo 2 for body text or at 800 below 32 sp:** Devanagari counters fill in at 16 px [X, specimen].
- **Hind as text face:** proportional digits, no `tnum`, so maths columns cannot align [X].
- **Dark chalkboard without a frame:** 1.67:1 against the dark background [X].
- **Kalam for captions:** slanted handwriting forms, wrong for early readers [X, specimen; I].
- **Requesting Google Fonts without explicit weights:** serves a static 400 instance, not the variable file; a measurement or loading pitfall [X].

---

## 13. Open questions
1. **Devanagari name:** तक्षशिला (meaning-rich, heritage) vs टैक्सिला (sound-matched to the English mark). This is the owner's call; test with parents in M-VI-5.
2. **NCERT textbook typefaces** for Hindi-medium primers are unknown [U]. If they use a markedly different ka/jha/la form, `font-reader` may need a Devanagari primer face (Annapurna is the candidate).
3. **Tutor selection (later 3D tutor):** the identity anchors (§6.2) must survive into 3D. The uncanny-valley risk from age 9 (kids-ux §11) still applies.
4. **Regional scripts beyond Devanagari:** Baloo 2 and Mukta both cover several Indian scripts (Baloo 2: 9 [V]), which favours this pairing if Taxila expands beyond Hindi. Re-measure payload per script.
5. **Duolingo palette, Khan Kids art and Kutuki style** are [M]/[U] here. Re-walk them on a budget Android phone before quoting them in a pitch.

---

## 14. Sources
- Duolingo blog: [Shape language, Duolingo's art style](https://blog.duolingo.com/shape-language-duolingos-art-style/) · [World character visemes (Rive)](https://blog.duolingo.com/world-character-visemes/) · [Core tabs redesign](https://blog.duolingo.com/core-tabs-redesign/) · [Design hub](https://blog.duolingo.com/hub/design/)
- Khan Academy: [Khan Academy Kids](https://www.khanacademy.org/kids) · [Supporting English language acquisition with Khan Academy Kids](https://blog.khanacademy.org/?p=19410)
- Pratham Books: [About](https://prathambooks.org/about-us/) · StoryWeaver [FAQs (CC-BY 4.0, text-free illustrations)](https://storyweaver.org.in/en/faqs)
- Google: [Read Along](https://readalong.google/intl/en_in/) · AOSP [fonts.xml](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/data/fonts/fonts.xml) · androidx [MotionTokens.kt](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/MotionTokens.kt) · [Material dark theme](https://m2.material.io/design/color/dark-theme.html)
- Fonts (google/fonts DESCRIPTION files and the CSS2 API): [Mukta](https://raw.githubusercontent.com/google/fonts/main/ofl/mukta/DESCRIPTION.en_us.html) · [Hind](https://raw.githubusercontent.com/google/fonts/main/ofl/hind/DESCRIPTION.en_us.html) · [Baloo 2](https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/DESCRIPTION.en_us.html) · [EkType/Baloo2](https://github.com/EkType/Baloo2) · [Noto Sans Devanagari](https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/DESCRIPTION.en_us.html) · [Andika](https://raw.githubusercontent.com/google/fonts/main/ofl/andika/DESCRIPTION.en_us.html) · [Google Fonts CSS2 API](https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800)
- W3C WCAG 2.2 Understanding: [2.3.1 Three flashes](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) · [2.3.3 Animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) · [2.2.2 Pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [Colour Blind Awareness: prevalence](https://www.colourblindawareness.org/colour-blindness/)
- Not re-checked [M]: Machado, Oliveira & Fernandes (2009) *IEEE TVCG* 15(6), CVD simulation matrices · Piepenbrock, Mayr, Mund & Buchner (2013) *Ergonomics*, positive polarity advantage · Okabe & Ito (2008), colour-universal design · Emblems and Names (Prevention of Improper Use) Act 1950 · Survey of India map-boundary requirements · GI registrations for Madhubani and Warli painting.
- Measurements in this folder: `visual-identity-fonts.py` → `visual-identity-fonts-2026-10-02.json`; `visual-identity-contrast.py` (stdout).


---

## Critique

**Critic:** senior children's product designer pass, 2026-10-02. **Method:** read the whole file, then re-ran its own colour helpers on pairs the document never tested (`visual-identity-critique-probe.py`, deterministic, stdout below). Machado matrices are reused from `visual-identity-contrast.py` and carry the same [M] caveat. Where a point is judgement rather than measurement it is tagged [J].

**Verdict.** The craft is real: measured contrast, a CVD-checked diagram palette, Devanagari ink-span checks and a font budget. But every claim in it is a claim about **pixels, not children**. Nothing here has been seen by a child, a Class 9 student, a TalkBack user or a ₹6,000 phone. Ten fixes follow; C1-C4 are blocking.

Probe output (contrast, then CIEDE2000 normal / protan / deutan / tritan):
```
tile-border on bg 3.50 | on surface 3.69 | bg vs surface 1.05 | jamun-soft vs bg 1.15
focus ink on board 1.42 | focus ink on jamun 1.85
done vs stop 59.7/14.1/13.0/58.6   turn vs chalk-mark 11.6/7.9/6.7/9.0   turn vs haldi 26.2/25.7/26.2/23.6
jamun vs listen 21.5/14.8/10.4/34.8   listen vs neel 5.6/4.5/3.8/4.2   think vs listen 15.9/19.7/19.2/14.4
```

### A. Blocking

**C1. The status palette was never CVD-tested, and it is the one that matters most.** §0 point 2 says the status colours "stay exactly as measured", but measured only for contrast. `done` leaf vs `stop` brick is the classic red-green pair: 13.0 under deutan and 14.1 under protan, below the 15 floor G-VI-3 sets for the diagram palette. G-VI-3 covers only the "core four", so the gate does not apply to the tokens that carry the 4-state rule. About 1 in 12 boys is affected (§0 point 5's own figure).
- Fix: extend G-VI-3 to every status pair. Give each state a **non-colour carrier**: `done` = a check drawn on the object plus a rising two-note earcon; `stop` = a shape (hexagon outline or "hold" hand) plus a low earcon; `turn` = the ring (already shape); `listen` = animated waveform arc; `think` = three dots. State the carrier in the token table, not only in kids-ux prose.
- `stop` is "errors only" and "never a wrong answer", so it should almost never appear in a lesson. Say so, and test it as a system-error colour only.

**C2. `chalk-mark` quietly breaks the "one marigold" law.** `#F2CF6B` is a pale marigold (hue 44.4°, §3.3). On the chalkboard the newest chip is underlined with it, on the same screen as the ringed `turn` tile. Measured: ΔE vs `turn` is 6.7 under deutan, so a CVD child sees two gold highlights and cannot tell which is "your turn". It also fails the document's own principle that signal colours are sacred. Haldi (`#946B0E`) is the same hue family.
- Fix: the chalk highlight is a **white hand-drawn underline in `chalk`**, 3 dp, distinguished by shape not hue. Remove `chalk-mark` from the token set (or rename `chalk-mark` to a non-gold chalk, for example a chalk pink at ≥ 7:1 on `board`, and re-run the gate).
- Add to G-VI-1: no token within 12° of `turn`'s hue may appear on a screen that renders `YourTurn`, except inside illustration pixels.

**C3. Karaoke "lit word" is invisible, and it shifts the layout.** §9 says the lit word uses weight 500 against 400 plus a `jamun-soft` underlay. The underlay is 1.15:1 against `bg` and the weight step is barely perceptible in Devanagari. Changing weight also changes glyph advance widths, so words jump as the highlight moves, exactly the reflow a 6-8 year old decoder loses their place on.
- Fix: lit word = the same weight, a **3:1+ underline bar or pill** (`jamun` at 2 dp under the word, or a `jamun-soft` pill with a `jamun` 1.5 dp edge), no weight change, fixed box. This also cannot be `turn`.
- Captions in B1 are a different problem, see C7.

**C4. Dark theme / chalkboard focus rings fail.** `--focus-ring: 3px solid var(--ink)` measures 1.42:1 against `board` and 1.85:1 against `jamun`. WCAG 2.4.11/2.4.13 want 3:1 for focus indicators [M, not re-checked here]. Keyboard and switch access is a real path for children with motor disability and for Android external keyboards.
- Fix: a **two-tone ring** (2 dp `ink` inside, 2 dp `chalk`/`surface` outside) that clears 3:1 on any ground; `--focus-ring` becomes a pair. Also handle `forced-colors` (box-shadow ledges and glows vanish; the `turn` ring must be `outline`/`border`, not `box-shadow`) and `prefers-contrast: more` (tile border to `ink`, drop the cream/white step: `bg` vs `surface` is 1.05:1, so on a dim cheap LCD tiles separate only by a 3.5:1 border).

### B. Babyish for 10-15 (and the identity contradicting itself)

**C5. Band 3-4 chrome still wears the B1 costume.** §10 says "no baby round-ness on chrome" for Older bands, but:
- `font-display` is **Baloo 2 for every band**, including the B4 title at 26 sp and the wordmark. Baloo is chosen for being "affable, carefree" (§4.1). A 14-year-old sees a children's-app face. [J]
- `--elev-press` (a Duolingo-style ledge) is kept for Older bands at 2-3 dp, which is a game-button look.
- The teacher is "the same person" in all bands with a plait and a jamun scarf; only the proportions change. The chalkboard, slate and copy-notebook motifs are the *school furniture* a Class 8-9 student is trying to escape for a "tutor" (the product thesis says replacing tutors, not replacing the classroom). [J]
- Radii at B4 are 12 px; still a soft card look next to Instagram/YouTube-grade chrome.
- Fix (a **type and surface fork at B3**): B3-B4 `font-display` becomes Mukta 700 (one family, saves 148 KB, no Baloo load on the Older path); the wordmark has a quieter B3-B4 lockup; the press ledge is dropped for a flat tile with a 1.5 dp border and a 2% darken on press; B4 radii 8-10; the chalkboard becomes an optional "board" skin (default: a flat `ink-on-surface` strip) for B4; the teacher gets a B4 variant with no side plait and no "didi" cues (older-cousin read), and a **male and a gender-neutral teacher option** at launch, not later: a single young woman as the default teacher is a stereotype of care work [J], and the product claims to replace *all* tutors.
- Test, not opinion: add M-VI-8 "would you be embarrassed if a friend saw this over your shoulder?" (3-point scale + free text), 8 children per band at B3 and B4 across 3 treatments. M-VI-2's "who is this app for" card sort with n = 8 per band is a start but does not measure embarrassment.
- A borrowed fact to avoid: the claim "teens prefer dark mode" (§3.5) is [I] and unevidenced. Offer it, do not default to it.

**C6. The identity has no personalisation axis, but the product thesis is personalisation.** The learning profile adapts formats, but the look is fixed per band. Learning-science's "choice offers" rule implies child-chosen surface. Add a **"my corner" choice of 3-4 pre-vetted accent themes and a teacher variant**, set in the first session, changeable any time, never unlocked, never priced in time or effort. Themes may recolour `jamun` and the board only; status, diagram and skin tokens are frozen. Re-run the contrast and CVD gates per theme (the gate harness is cheap: the script already loops over pairs).

### C. Reward-economy creep (watch list)

The document is mostly clean (no stars, coins, flames, §5). Creep risks that remain:
- **C7a. Teacher affect is the reward.** The "delighted" state (700 ms) plus clapping (§6.2) is a contingent reward by character acting: correct answers produce the big smile, so the child learns to farm the face. Rule: delight is keyed to **insight and effort events** (a self-corrected step, a teach-back landed), at **constant magnitude**, never escalating by streak or count; a wrong-then-fixed answer earns the same delight as first-try. Add to the character brief as a hard rule and to a new lint **G-VI-9**: no animation state is selected from a correct-count or streak variable.
- **C7b. "Filled stepping stone" as completion** (§5) is a progress map. If unfilled stones show, they are visible debt ("3 of 8"). Rule: only the stones already passed are drawn; there is no count, no ghost slots, no locked or greyed future. Same for kolam art that "completes".
- **C7c. Cast and seasonal packs, teacher variants and costumes** (§6.2, §6.4) become a cosmetic shop in the first product review. Declare them **never unlockable**: all variants available from the first launch, picked by the child (see C6).
- **C7d. Sound is missing from the identity entirely.** Khan's Kids ding/bong (§1) is the tool that turns feedback into a slot-machine. An earcon set is part of the identity: a small fixed set (turn, listening, done, hold, error, payoff), no escalating-pitch chains, no sound for "streak", reduced-sound mode, and a rule that a payoff earcon plays once. Specify before any sound designer starts.
- The chalk-sparkle draw-on (§9) is a decorative reward. Keep it only if it draws the concept (the finished shape sparkles), never on a generic "correct", and never twice per module.

### D. Too text-heavy for 6-9

**C8. The B1/B2 type scale assumes the child reads the screen.** `type.caption` 22/24, `type.body` 20/22 and `type.reader` 28 (§4.3) for B1, and "karaoke caption on by default" (§9) build a text surface under the teacher. The kids-ux critique already recorded that R0 children cannot read captions and for them the strip is noise competing with the anchor. The identity file did not absorb that.
- Fix: say it in this document. In B1 **type is a label, not a medium**: a title and chips ≤ 4 words each, spoken on tap; at most 2 text regions visible (kids-ux G11); the caption strip is **off by default for R0, on for R1** (decided by the oral-reading probe, not by class). The caption box must be sized for R1 pace, not speech pace: speech runs about 2-3 words per second, a Class 1 decoder reads well below that [J], so lit-word tracking should be a **follow-along** cue at the teacher's pace with tap-to-replay per word, not a promise to be read at speed.
- Missing deliverable: the **B1 pictogram set** (§5 states the principle but gives no inventory). Ship a list of ~30 core object icons (home, ear, pencil, eraser, mic, pause, hand, book, help…) and test comprehension without labels (≥ 85% recognition at a 5-second glance, the usual ISO pictogram bar [M]) in a new M-VI-9, n = 20 children aged 6-7.
- Remove "13 sp attribution at `ink-2`" in the book frame (§9) from child surfaces: the child floor is 16/18 sp (§4.3); attribution belongs in a parent-reachable credits page or a tap-to-open sheet.
- Hinglish captions in Devanagari for R1: conjunct-heavy words (the stress strings of §4.4) are the real barrier for a 6-year-old, not font size. Keep conjunct-heavy words out of B1 *labels* where a plainer word exists, and use the stress set in G-VI-5 on B1 labels at 320 dp width with Android font scale 1.3 (see C9).

### E. Breaks on low-end Android

**C9. Font scale and system settings are not in the type system.** The type table uses fixed sp tokens plus 1.3 em single-line boxes but never says what happens at Android "largest" font scale or display size "large", common on shared parent phones (kids-ux critique §7 MUST). Rule: layouts survive fontScale 1.3 and "large" display size with no clipped matras and no off-screen mic; sp tokens are capped at 1.5×; WCAG 1.4.4 (200% zoom on web) is a stated test; add both to G-VI-5.

**C10. The performance contract is a font budget plus a slogan.** Specific gaps:
1. **Rive/riv size and runtime cost are un-budgeted.** G-VI-4 caps fonts at 320 KB while the largest asset in the app (the Rive runtime, the 20+-mouth teacher, band variants) has no number. The "transform and opacity only" rule (§7.3) does not govern a canvas/WASM renderer. Fix per kids-ux critique §7: a median frame time ≤ 16 ms / p95 ≤ 33 ms over 60 s on the reference 2-3 GB device, **a runtime fallback of a static pose plus a 4-5-mouth sprite swap**, chosen by a measured frame-drop counter, not a user-agent string. Add an asset budget gate G-VI-10 (`.riv` bytes per variant, illustration bytes per module, image format: WebP only, because AVIF decode needs a recent Chrome [M]).
2. **`size-adjust` and `local()` fallbacks may silently do nothing.** `size-adjust` needs a recent Chrome (≈ 92 [M]); Capacitor uses the *system WebView*, which stays old on cheap phones that never update. The document marks `local()` matching as [U] and does not name a support floor. Fix: declare a **minimum WebView version** (and test matrix: Android 8, 9, 10; Chrome WebView 80 and current), and make the design survive the fallback failing, i.e. headings must not reflow the first lesson screen when Baloo arrives. The simplest fix is C5's: in the low-end tier skip Baloo entirely and use Mukta 600/700 (or system Noto) for display.
3. **Glow and blur.** The `turn` pulse is a "glow opacity" and `--elev-card` is an 8 px blur shadow (§7.1, §8). Blur repaints are expensive on mali-400-class GPUs [J]. Make the pulse a ring-width/opacity change on a promoted layer with no blur, and use border-only cards on the low tier (`--elev-card: none` + 1 px border is already the dark-mode value, so the code path exists).
4. **No degrade ladder.** Define three tiers by measured frame time and memory (not model name): *full*, *lite* (no idle sway, no blink loop, 3-mouth swap, no blur), *static* (poses only, audio plays, cross-fades). The identity must look intentional in all three, and the tier is part of the screenshot gate.
5. **Shared-phone identity.** Nothing says how a child recognises *their* profile on a family phone. A profile marker should be the child's own chosen picture and spoken name (C6 choice), not a colour or a reward badge.
6. **Dark mode assumes `prefers-color-scheme`.** Old WebViews ignore it; the default must be light and the toggle must write `data-theme`; do not depend on the media query for correctness.

### F. Evidence and process notes
- **Self-referential measurement.** "0 failures" in §3.2 means "the author's tokens pass the author's contrast script". It is useful as a regression gate, not as evidence of legibility to children. The only test of children is M-VI-1..7, none run; sample sizes are small for 4 fonts × 2 sizes (n = 24-36 needs a within-subject Latin-square design stated in the method, otherwise it is underpowered).
- **[M] items that carry weight must be re-checked** before they gate anything: Machado matrices, Piepenbrock 2013 (also measured on adults; do not transfer to a 7-year-old), the Emblems Act, the Survey of India rule, the animal-idiom list (§6.3: *ullu*, *tota-ratant*; have two native speakers per region confirm), and the claim that Warli and Madhubani are GI-tagged.
- **Illustration palette limits** (§6.1: "≤ 6 hues per B1 scene") are a rule without an owner. Add a lint on generated assets (hue-count after quantisation) in G-VI-7.
- **Single-source tokens**: `--ledge-*` and `--note-*` are "hand-picked" and untested; decorative is fine, but mark them `decorative: true` in the token file so G-VI-1 can reject them from text or borders.

### G. Corrections list (for the main loop to merge)
1. Extend G-VI-3 to all status pairs; add non-colour carriers per state (done vs stop is 13.0 deutan, 14.1 protan).
2. Remove `chalk-mark`; use a white chalk underline; add a "no gold within 12° of `turn` on a YourTurn screen" lint.
3. Karaoke lit word: same weight, a 3:1 bar or pill, fixed box; no weight change.
4. Two-tone focus ring (≥ 3:1 on any ground), `forced-colors` and `prefers-contrast: more` tokens; `turn` ring as outline.
5. Fork B3-B4: Mukta display, no press ledge, flatter tiles, smaller radii, optional board skin; teacher variants (including male and neutral) at launch.
6. Add a "my corner" choice of themes and teacher, never unlockable; gate each theme.
7. Teacher delight keyed to insight events at constant magnitude; G-VI-9 lint; no ghost stepping stones, no counts; never-unlockable cast; write the earcon spec.
8. B1 type is a label: caption off for R0, follow-along not read-at-speed for R1; ship the ~30-icon B1 pictogram inventory and test it (M-VI-9); child surfaces never below 16/18 sp.
9. Support fontScale 1.3 and large display size, cap sp at 1.5×, 200% web zoom.
10. Budget Rive and image weight (G-VI-10), three-tier degrade ladder chosen by measured frame time, declared minimum WebView version, no dependency on `size-adjust`, `local()` or `prefers-color-scheme`; low tier uses Mukta only; profile marker for shared phones.
11. Add M-VI-8 (embarrassment test, B3-B4) and M-VI-9 (pictogram recognition, B1); state the Latin-square design for M-VI-1.

**Sources for this critique:** the file above and its sibling `kids-ux-ages.md` (its own critique sections §7 and the notes on R0 captions, fontScale, Rive budgets); the probe `visual-identity-critique-probe.py`. WCAG 2.4.11/2.4.13, ISO pictogram recognition bars, Chrome `size-adjust` support and the Capacitor system-WebView behaviour are [M] and were not fetched in this pass; verify before they become gates.
