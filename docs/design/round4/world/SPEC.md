# Round 4 · world · SPEC: Prakash, the system

**Direction:** Prakash, a game-native world ("prakash" means light; the class 6 maths book is *Ganita Prakash*).
**Prototype:** `index.html` (one file, 650 KB, six screens, live). **Proof:** `shots/`. **Research:** `RESEARCH.md`.
**Contrast:** `contrast.py` → `contrast.json` (24 pairs, 0 fails). **Status:** a design direction. No child has seen it.
Nothing below is measured on a Rs 10k phone. The one performance number is a headless proxy, labelled as such (§8).

---

## 0. The direction on one page

1. **Taxila is one continuous place.** Every child screen is a location in a single Indian world drawn in one light
   model: the gate at dawn (first run), the terrace at dusk (home), the pavilion at lamplight (lesson), the stone yard
   (game), the valley at night (world map). The parent corner is the same world by day, drawn as an engraving.
   **Every place has its hour.**
2. **Moving between screens is a camera move.** The camera pushes through the gate, into Asha's lit window, down onto
   the board, out over the valley. These are not page slides.
3. **The teacher is your guide in this world, and she lives in the light.** Asha (the owner's style-C face, running on
   the production puppet rig) always appears inside a lamplit arched window (a *jharokha*). The cream that her painted
   layers were cut against becomes the lamplight of that window, graded by the scene's own light.
4. **Light is the only reward.** The world map is a valley of stone mesas at night. A topic is a pavilion. Its stage
   is a pure view of the learner ledger: a chalk plan (not yet) → a bamboo scaffold (working on it) → a lit scaffold
   (got it) → carved stone with a lamp that stays lit (secure). That warm light is the only reward in the product. No
   points, coins, streaks, XP, badges, timers or locks. Nothing fades.
5. **The idea is the controller, and every act has weight.** In the game you crack sandstone blocks with brass chisel
   tokens. You get anticipation, a hit-stop, a crack, dust, a spring, and a bell when a prime crystallises. The law
   answers in under 100 ms. The weight follows the child's own act, never the clock.
6. **The aesthetic risk: dusk as the brand ground.** The product does not sit on cream paper (calm-mastery) or near
   black (DESIGN-V3). It sits on **a violet-to-saffron dusk** with coloured shadows and one hot accent, lamp gold. The
   accent means two things only: "your move" and "understood". A dusk world could read as moody to a 9-year-old. That
   is the bet, and RESEARCH §4 names the test that would settle it.

---

## 1. Colour

### 1.1 The child world (dark, dusk)

| token | value | role |
|---|---|---|
| `--ink` | `#F7F0E6` | primary text on glass (warm white, never pure white) |
| `--ink-2` | `#D3C8E0` | secondary text |
| `--ink-3` | `#ADA2C2` | labels; ≥ 14 px only |
| `--glass` | `rgba(21,18,42,.84)` | panels over scenes |
| `--glass-2` | `rgba(33,28,62,.90)` | solid panels (dialogue, today card, sheets) |
| `--hair` / `--hair-2` | `rgba(236,196,128,.46)` / `.22` | the brass hairline on every frame |
| **`--lamp`** | `#FFC24D` (hi `#FFE2A1`, lo `#EE9F35`) | **the one hot colour**: the primary action, the YOUR TURN mic, the lit lamp of understanding. At most one lamp-filled control per screen state |
| `--lamp-ink` | `#2A1607` | text on lamp |
| `--listen` | `#63D6CB` | the child holds the floor (listening). Lifted from Asha's teal kurta |
| `--look` | `#86C9F6` | "look again". Cool, calm, **never red** |
| `--known` | `#FFD27A` | prime / true / understood (gold on slate) |
| materials | sandstone `#E7B184 / #CF9468 / #B4735A`, shadow `#6B3D4F`, plaster `#F1E4D1`, brass `#D9A54E`, slate `#1C1F33`, chalk `#F4E7C9` | the world's materials, also the game families' materials (§6) |

**Light per place ("every place has its hour").** Each scene has one sun and stops that the build reuses:
- *Dawn (gate):* `#666DA4 → #A08FBA → #DBADB4 → #F5C9A9 → #FCE3C4`, backlit gate `#47294A–#5A3856`.
- *Dusk (terrace):* `#16133A → #2C2454 → #5A3A68 → #A3566C → #E2845F → #F6B466`, structures rim-lit `#F0A673` on the
  sun side and violet `#5C3A62` on the shadow side.
- *Lamplight (pavilion):* interior `#2A1B2C → #140D1A`, lamp pool `#FFB766` at 42 %.
- *Night (valley):* `#090B24 → #151840 → #2A2458`. Mesa faces are moonlit `#3B3F7C` and shadowed `#23265A`. The only
  warm colour on the map is understanding (`#FFC874` pools, `#FFE2A1` lamps).

Rules: shadows are coloured (violet), never black. Far layers blend toward the sky stop behind them. No colour carries
meaning alone: every state also has a shape and a word (§9).

### 1.2 The parent corner (day)

`--p-bg #F4EDE2`, `--p-card #FFFCF7`, `--p-ink #1D1A28`, `--p-ink-2 #554D63`, `--p-rule #E3D7C5`, `--p-brass #855614`
(labels and links), `--p-teal #1D6870` (still practising), `--p-ok #24644A` (safety). It uses no lamp gold except
inside the engraving, where it marks the places the child understands. The parent never gets the child's "your move"
colour.

### 1.3 Contrast (measured, `contrast.json`, 2026-10-09)

WCAG 2 relative luminance. Each glass panel is alpha-composited over the **brightest** scene stop that can sit behind
it (worst case).

| pair | ratio | need |
|---|---|---|
| ink on glass over the dusk horizon | 11.72 | 4.5 |
| ink-2 / ink-3 on glass (worst) | 8.28 / 5.51 | 4.5 |
| lamp gold text on glass | 8.26 | 4.5 |
| lamp-ink on the darkest lamp stop | 7.93 | 4.5 |
| listen teal on glass | 7.58 | 4.5 |
| chalk / known gold on slate | 13.20 / 11.38 | 4.5 |
| look blue on slate | 9.02 | 3.0 (glyphs) |
| hello title / lede on the gate ground | 15.59 / 12.82 | 3.0 / 4.5 |
| pick heading / meta on the valley floor | 5.47 / ≥ 4.5 | 3.0 / 4.5 |
| p-ink on p-bg · p-ink-2 · p-brass · p-teal on p-card | 14.67 · 7.81 · 6.15 · 6.28 | 4.5 |

The first run failed one pair: the pick meta `#4A3650` at 3.97. It was darkened to `#2F1E36`, and the table was
re-run with 0 fails.

---

## 2. Type

Families (Google Fonts only, `display=swap`, real fallbacks):
- **Eczar** (Rosetta; Latin and Devanagari drawn as one design), weights 500-800, for places, titles, numerals and
  the board. Fallback: `"Noto Serif Devanagari", Georgia, serif`.
- **Mukta** (Ek Type; Latin and Devanagari), weights 400-700, for everything read fast: UI, captions, body, labels.
  Fallback: `"Noto Sans Devanagari", system-ui, sans-serif`.

| role | Latin | Devanagari | notes |
|---|---|---|---|
| hero | Eczar 800 · 64 px phone / 104 px laptop · 0.92 lh · +0.06 em | (not used for heroes) | one per screen |
| place banner | Eczar 700 · 34 px · +0.06 em, between brass rules | same family | the region reveal on entering a place |
| display | Eczar 700 · 27-30 px · 1.08 | Eczar 700 · 27 px · **1.34** | screen titles, parent headline |
| h2 | Eczar 700 · 21-23 px · 1.15 | Eczar 700 · 21 px · 1.36 | panel titles |
| caption (teacher speech) | Mukta 500 · 18 px · 1.42 (19 px laptop) | Mukta 500 · 18 px · 1.6 | phrase-level, never word-lit |
| body | Mukta 400 · 16 px · 1.5 | Mukta 400 · 16 px · 1.7 | |
| label / eyebrow | Mukta 600 · 14 px · caps +0.14 em | Mukta 600 · 14 px · **no caps, no tracking** | |
| board numerals | Eczar 700 · 22 px (27 px for the root) in SVG units | | operators `× = ≠ ÷` are always set in Mukta 600: Eczar's × reads as an asterisk |

Hard rules: text ≥ 14 px everywhere; class 4-5 copy ≥ 16 px. **Never letter-space or upper-case Devanagari**: tracking
breaks conjuncts (it was visible in the first parent Hindi render, "क क्षा", and was fixed). Tabular numerals are not
needed: no number on a child screen ever counts.

---

## 3. Space, shape and light

- **Space:** 4-px base (`--s1`…`--s8` = 4, 8, 12, 16, 20, 24, 32, 40). Phone gutter 12-16 px; laptop 20-32 px.
- **Shape: the chamfer.** Every frame is a rectangle with 10 px cut corners (7 px on buttons). It is drawn with
  `clip-path` and carries a brass hairline gradient. Cut corners read as a premium game frame (Hades, Genshin). Rounded
  pills read as a kids' app. Exceptions: the mic orb and the chisel tokens are round, because they are physical
  objects.
- **Elevation is light, not shadow.** Depth comes from the scene: atmospheric layers, a one-sun light model and
  coloured shadows. A panel shows its elevation only through its hairline and a 7 % inner top highlight. Glow
  (a radial lamp gradient) is reserved for "lit" things: the lamp button, prime medallions, lit pavilions, Asha's
  window.

---

## 4. Motion

**Principle: motion means something happened, and it follows the child's act.** The world arrives (camera), the
teacher's state changes (face), the board draws when she names a step (board), the law answers (game). Nothing loops
for decoration.

| token | ms | easing | used for |
|---|---|---|---|
| press | 90 | `--e-out` (.22,.8,.2,1) | button press: 1 px down, scale .985 |
| quick | 160 | out | toggles, chips |
| base | 280 | out | panels rising, sheets |
| **camera** | 760 | `--e-cam` (.65,0,.2,1) | every screen change. Forward: the old place scales to 1.6 **around the thing you tapped** (Asha's window, the world card, the board) and fades; the new place settles from 0.94 with brightness 0.6 → 1. Back: the reverse |
| parallax settle | 1500 + depth × 600 | out | on arrival, far layers settle last (the camera landing) |
| place banner | 2600 | out | region reveal |
| board stroke | 520 per line, 420 per node | (.4,.1,.2,1); nodes spring (.3,1.4,.5,1) | chalk-light drawn at her clause |
| verdict | 900, **identical for right and look-again** | | tick drawn vs crack plus dotted underline; the same wait (1,300 ms) before either |
| game spring | k 260, c 22 (ζ ≈ 0.68) | physics | blocks finding their place in the tree |
| game hit | 80 squash → 55 hit-stop → crack → 240 shake (≤ 3 px) | | a valid split |
| prime crystallise | 520 | (.3,1.5,.5,1) | scale .7 → 1.16 → 1, sparks, a bell |

**When not to animate:** never while the child holds the floor (nothing new enters the board while they speak or
type). Never on chrome for decoration. Never a countdown or a pulsing urgency ring: the YOUR TURN mic breathes **once**
on entry, then holds. **Reduced motion** (`prefers-reduced-motion`): camera moves become 200 ms cross-fades, parallax
and settles stop, board strokes appear instantly, particles and shake are off, and the place banner simply shows and
fades. The game keeps working: its feedback becomes state (a dashed outline marks a block that can still split).

**The teacher's states are motion, not text (but the word is always there too).** Speaking: lips on the voice
(production LipDriver or Azure visemes). YOUR TURN: lean-in plus the lamp on the mic plus a two-note bell plus a 20 ms
haptic, all fired on the same frame. Listening: head tilt, teal mic ring following the level. Thinking: gaze aversion,
and "Thinking" appears only after 600 ms. Knowledge states only. Never emotions about the child's answer: the face is
verdict-neutral and the verdict lives on the work.

---

## 5. Iconography and illustration

- **Icons:** 24-unit grid, 1.75 stroke, round caps and joins, no fills (one exception: the play triangle). There are
  four floor glyphs that carry state by shape: speaking (sound bars), your turn (open hand), listening (ear),
  thinking (three still dots). No emoji.
- **Illustration = places, never objects.** Every image is a location in the one world, built as 4-6 SVG layers:
  sky, sun or moon, far ridge with silhouettes, mid ridge, near ridge, then the foreground architecture. One sun per
  scene. Far layers fade to the sky. Shadows are violet.
- **The architectural vocabulary** (the only shapes the world is made of): ogee arch (the brand mark), chhatri,
  shikhara, fort wall with bastions, jaali (pierced screen), stepwell, bamboo scaffold, diya, neem tree, brass, slate.
  The world uses no mascots, animals, smiling objects, stock props or text in images.
- **To draw a new place:** pick its hour from §1.1, compose it so the important thing sits in the middle 60 % (phones
  crop the sides of a 1200-wide scene), leave a dark or quiet band where the UI will sit, and give it one warm light.

---

## 6. The teacher

- **Face:** the owner's directive style-C Asha on the shipped puppet (`src/face-puppet`, polish r8 rig and
  `PuppetDriver`), bundled unchanged into the prototype with rolldown (104 KB) plus the 132 KB pack. It drives judged
  blinks, gaze, listening tilt, thinking aversion, and lip-sync from her real recorded voice (hello clip, 12 s) or from
  visemes. In the prototype the lesson lines are silent: their visemes are generated from the caption text.
- **The jharokha window:** an ogee-arched frame with a brass line and a dark sandstone outer line. The cream behind
  her painted layers becomes the window's lamplight. A multiply grade (warm vignette) and a screen rim light (the
  scene's sun side) tie her into each place's light.
- **Sizes:**

  | surface | size | crop |
  |---|---|---|
  | pick | 150-250 px wide | head and shoulders |
  | home | the window of the pavilion in the scene (≈ 90 × 116 px on a phone) | head |
  | lesson, phone | 90 × 117 px rising out of the dialogue panel (Hades-style) | head |
  | lesson, laptop | 380 × 250 px at the top of the side column | face |
  | game micro-reaction | 38 × 48 px still | face |

- **One live face per page.** The single canvas moves between slots; every other slot shows the still of the same
  face.
- **Arjun:** his face is not at the owner's bar yet (`stylised-c-3d-failing-verdict`; `p2f-arjun-keeps-tutorface`).
  The pick shows him honestly, as a silhouette behind a chik blind, labelled "Face still being made". The world, the
  window and the states are the same for any teacher: the slot does not care whose face it holds.
- **Never:** a face as a giant sticker, a face reacting to right or wrong, a companion register.

---

## 7. How the four game families and the live boards join the world

One world, one material language. **Each family is a different place, never a different art style.** This replaces
round 3's four unrelated looks (kagaz, chalk, blueprint, raat).

| meaning | material / shape | where it shows |
|---|---|---|
| a quantity, a whole, a thing you can work on | **sandstone** (warm, rough, carved Eczar numerals) | Todo-Jodo blocks, Taraazu cubes, Nishana distance stones |
| law-confirmed, atomic, true | **brass and gold**; the **octagon** is "can't split further" | prime medallions, a level balance, the true flag on the line, the board's primes |
| notation, the symbol | **chalk-light on slate** (Eczar numerals, Mukta operators) | the pavilion board, every family's fade-2 symbol strip |
| the child's own input | **teal**, the listening colour | the child's marker, the typed or spoken answer chip |
| look again | **cool blue**: a magnifier, a crack line, a dotted underline | composite leaves, a misplaced marker; never red |
| not yet | **dashed chalk plan** | unbuilt pavilions, unplaced items |

- **Todo-Jodo (built and playable): the stone yard.** Composite numbers are sandstone blocks. A valid split gives a
  squash, a hit-stop, a crack, dust and two blocks springing to their places. A non-divisor gives a wobble, a tock and
  a floating "72 ÷ 5 = 14, 2 left" (the law answers). Primes crystallise into brass-inlaid octagon medallions with a
  bell. "Done" with a composite leaf left makes that block hum (the `m-stop-composite` consequence). Solved: the atoms
  gather in a row and multiply back up to the number, a four-note close plays, and the scaffold appears on the
  terrace "in pencil". Asha's lines come from the authored bank (`data/play/reactions.json`), only at turn points.
  Two doors, both reward-free: In band (72) and Harder (360, the chapter's own hook).
- **Taraazu: the bazaar balance under a chhatri.** A brass taraazu on a sandstone plinth, sandstone cubes, a cloth
  bag for x tied with a red-brown thread (never red as a verdict). The beam angle is the law. A level beam glints once
  in brass. The live equation is chalk on a slate tablet hung from the plinth.
- **Nishana: the ghat steps.** The number line is a long sandstone ledge with carved ticks running along river
  steps. The child's marker is a teal diya. The true position rises as a brass flag. The gap is labelled in chalk,
  exactly or "lagbhag".
- **Kyun-Lab: the courtyard garden lab.** Terracotta pots, brass vessels and a jaali shade screen whose angle sets
  the light. Factors are physical objects on a stone bench. The prediction is a chalk mark on a slate before the run.
- **Live-built boards (Studio):** always the pavilion slate. The layout is an Eczar heading and a date in the top
  rule, then chalk-light strokes drawn **at the clause that names them**. Composites are outlined squares; primes are
  gold octagons with a soft glow. The child's own answer goes on the board at once as the receipt. Verdict: a gold
  tick drawn for right; a cool crack and a dotted underline for look-again, with the same timing. The board
  vocabulary is limited to these shapes, so nothing a model composes can look off-brand.

---

## 8. A Rs 10k phone: budget, degradation and what was measured

**Budget (design targets, not yet verified on a device):**

| item | target |
|---|---|
| first paint of a screen | ≤ 1.5 s on 4G from cache-cold, ≤ 0.5 s warm |
| payload | ≤ 700 KB for the shell (this file is 650 KB including the face) plus fonts (Eczar variable + Mukta 3 weights, both subsets, ≈ 250 KB, swap) |
| chrome | transform and opacity only; no blur or `backdrop-filter`; no CSS filters except on transient feedback |
| scenes | static SVG, one composited layer each (`contain: strict`); parallax only translates layers |
| map pan | one `will-change: transform` layer translated; the sky is a separate, almost still layer |
| game | ≤ 20 blocks as DOM layers, ≤ 80 particles on one canvas, springs in one rAF loop that stops when settled |
| face | the production governor (60 fps while speaking, 30 fps in holds; DPR 2 → 1.5 → 1; then 20 fps; then the still) |

**Degradation ladder:** first parallax and settles go, then particles and shake, then the camera moves become
cross-fades. After that the face drops to 30 fps, then to the still (the same face). Last, the scenes swap to a flat
two-stop gradient of the same hour. The game, the board and every signal keep working at every rung.

**Measured: a proxy, not a phone** (`shots/perf.json`, `shots/perf.log`, 2026-10-09). Method: headless Chromium 1194
(Playwright 1.63), **software WebGL (SwiftShader)**, CDP CPU throttle 1× and 4×, 360 × 800 at DPR 2, rAF intervals
while each screen does its heaviest work: the face talking with the board drawing, two game splits, and a map drag.
Three runs per cell. The per-run numbers are in `perf.log`. The lesson held a 16.7 ms median frame in every run. The
game and the map had median frames of 16.7-36 ms, with p95 spikes of 33-183 ms on the split and drag moments. Software
rasterising at DPR 2 is the likely cause, and a phone GPU composites those layers in hardware, **but that is a guess
until the device run**. Two fixes cut the spikes during this work: bonds updated in place instead of rebuilt (game),
and a promoted sky layer (map p95 at 4×: 166 → 67 ms, n = 1 each). **The test that settles it:** this file on a
Mali-G52-class phone (for example a Redmi or Realme at Rs 10k), 20 fps p95 as the floor for the map and the game.

---

## 9. Accessibility

- **Targets ≥ 44 px, text ≥ 14 px, no horizontal scroll at 360.** Checked by the harness on every screen and state
  at 360 × 800, 412 × 915 and 1366 × 768 (`shots/report.json`, `shots/flow/`). Map labels are SVG and scale with the
  map, so the List view is the accessible source of truth.
- **Contrast AA:** §1.3.
- **State never by colour alone:** every floor state is carried by a word ("Talking", "Your turn", "Listening…",
  "Thinking"), a glyph, the face, a sound and a haptic. Every mastery state is carried by a shape (plan, scaffold, lit
  scaffold, stone) and a word. Verdicts are carried by a tick or a magnifier, never by red.
- **Screen readers:** chapter mesas are focusable buttons with full labels. The game's blocks are real buttons
  ("72: tap to split", "7, prime: it will not split"). The board has an `aria-label`. Captions are `aria-live="polite"`.
- **Reduced motion:** §4.
- **Devanagari:** Mukta and Eczar Devanagari at ≥ 16 px, line-height 1.6-1.7, no tracking or caps. The parent report
  switches fully between English and Hindi.
- **Mic-free path:** every answer can be typed. The game is tap-only.

---

## 10. What Prakash rejects

- Cream paper with rounded white cards as the child's ground (a form reads as homework).
- Near-black with a lime accent as the brand (cold, generic, no place to grow).
- Stock-object illustration, mascots, animals, smiling objects, emoji.
- Games in a box in a corner; games styled as forms (keypads, "Wapas", "Ho gaya" button grids).
- Four unrelated art directions for games.
- A flowchart as a world map.
- Any counter, streak, coin, XP, timer, lock, decay, variable reward or "come back" nudge.
- The face as a sticker; the face as the verdict.
- Pulsing urgency; looping decoration; bounce on chrome.
- Letter-spaced or upper-cased Devanagari.

---

## 11. What this prototype does not do (honest limits)

- **Asha's voice in the lesson is silent.** Only the 12-second hello clip is her real voice. Lesson lip-sync is
  generated from caption text, while the product drives it from Azure TTS visemes. No TTS was called for this
  prototype.
- **The mic is simulated.** Tapping it plays a sample spoken answer (labelled on screen). No speech recognition runs:
  the browser recogniser would be a third-party AI service.
- **Arjun has no face here** (his face is not at the owner's bar).
- **Only Todo-Jodo is playable.** Taraazu, Nishana and Kyun-Lab are specified in §7, not built.
- **The performance numbers are a SwiftShader proxy**, not a phone.
- **No child has seen it.** RESEARCH §4 lists the tests.
