# Round 4 · kinetic · SPEC: the Taal system

**Date:** 2026-10-09 · **Live reference:** `index.html` (every token below is defined in its `:root`) · **Why:** `RESEARCH.md`

The child-safety floor and NEVER MANIPULATE sit above every rule here: no streaks, no FOMO, no loot or variable-ratio
rewards, no fake urgency, no timers, the teacher is a teacher, and the face shows knowledge states, never emotions or
verdicts.

---

## 1. The idea in five rules

1. **Every screen is a poster on its own deep colour field.** One hero element per screen (a greeting, a number, a
   chapter name, the teacher's sentence, the parent's one capability), set huge.
2. **Two characters, two colours.** Marigold (*genda*) is the teacher: her speaking ring, her current word, her atoms on
   the board. Rani pink is the child: their turn, their voice, their primary action. Nothing else is saturated.
3. **Devanagari and Latin are equals.** Same family (Anek), same size, same weight, stacked or side by side, never one
   as a footnote to the other.
4. **Weight, not bounce.** Things arrive fast and settle heavily, buttons are slabs with real depth, and the only
   springs follow the child's own act.
5. **The child's act is the only thing that moves with force.** Chrome settles; the stage performs; the game's juice is
   caused by and proportional to what the child did.

---

## 2. Colour

Child screens are dark-first by design (a single committed look, not a theme toggle). The parent corner is a light
paper look by default because parents read it in daylight. Each child screen takes one ground; grounds are never mixed
on one screen.

| token | hex | role |
|---|---|---|
| `--kajal` / `-2` / `-3` | `#0E0B12` / `#1A1420` / `#261E2D` | lesson ground, raised surfaces, chrome |
| `--jamun` / `-2` / `-3` | `#2A0F35` / `#3A1648` / `#4B1F5C` | first run and home ground, panels, teacher cards |
| `--neel` / `-2` / `-3` / `-edge` | `#0E1748` / `#18245F` / `#2A3A9A` / `#070C2C` | game ground, keys, number blocks, block extrusion |
| `--mor` / `-2` | `#052E2C` / `#0B403D` | map ground (peacock), map cards |
| `--ink` / `-2` / `-3` | `#FFF5EA` / `#DCCFC6` / `#A89BA3` | text on deep grounds (ink-3 only ≥ 14 px, never on mor-2) |
| `--genda` / `-edge` | `#FFB000` / `#B87A00` | **the teacher**: speaking ring, current caption word, atoms, ink stations |
| `--rani` / `--rani-text` / `-edge` | `#FF2E88` / `#FF6AA8` / `#A3104F` | **the child**: primary slab, "your move", their voice, chosen card, today's station |
| `--mint` | `#3FE0A0` | "got it", always with a **tick** |
| `--sky` | `#7CD3FF` | "look again", always with a **magnifier**. Same brightness as mint, so neither verdict outshouts the other. Red never marks a wrong answer. |
| `--paper` / `-2`, `--p-ink` / `-2`, `--rani-deep`, `--genda-soft`, `--p-mint` | `#F7F2F0` / `#FFF`, `#1C1020` / `#574A5A`, `#B0105A`, `#FFD978`, `#0B7D55` | parent corner |

**Contrast (WCAG 2.x, computed from the tokens; script: `contrast.py` logic reproduced in the table):**

| text on ground | ratio | | text on ground | ratio |
|---|---|---|---|---|
| ink on kajal | 18.14 | | ink on neel | 15.79 |
| ink-3 on kajal | 7.33 | | ink-3 on neel-2 | 5.41 |
| genda on kajal | 10.66 | | genda on neel | 9.28 |
| rani-text on kajal | 7.33 | | ink on mor | 13.60 |
| kajal on rani (slab label) | 5.58 | | ink-3 on mor | 5.50 |
| kajal on genda (slab label, ticket) | 10.66 | | genda on mor | 8.00 |
| ink on jamun | 16.01 | | rani-text on mor | 5.50 |
| ink-3 on jamun | 6.47 | | ink-3 on mor-2 | **4.34 (not used for text)** |
| genda on jamun | 9.41 | | p-ink on paper | 16.53 |
| ink-3 on jamun-3 (card labels) | 4.78 | | p-ink-2 on paper | 7.47 |
| mint / sky on kajal | 11.51 / 11.74 | | p-mint on white (pill) | 5.15 |
| kajal on mint / sky (badge glyph) | 11.51 / 11.74 | | rani-deep on paper | 6.17 |

Every text pair used in the prototype is ≥ 4.5:1. `genda-edge` on white (3.61) is used only for graphic state icons.

**Hue rules:** marigold and rani never swap roles. No other token within 12° of either hue on a child screen (this
inherits `ds-rejected-chalk-mark-gold`). Subject colour is never a ground; if subjects need marks, they use a small shape
plus a label.

---

## 3. Type

Google Fonts only; one request:
`family=Anek+Devanagari:wdth,wght@75..125,100..800&family=Eczar:wght@400..800`.

| role | family | Latin | Devanagari | notes |
|---|---|---|---|---|
| display (posters) | Anek Devanagari, wdth 125, wght 800 | clamp(52 px, 17cqw, 124 px) greeting; up to 180 px for hero numerals; −0.025 em | same size; line-height 1.12; **no letter-spacing** | titles "land" from wdth 75 to 125 |
| title | Anek, wdth 112, wght 750 | 24 px (phone) / 30 px (wide), −0.01 em | 24 px | `text-wrap: balance` |
| caption (her live words) | Anek, wdth 100, wght 520; stressed word animates to wdth 125 / wght 800 and rests at 114 / 780 | 21 px phone, 28 px wide, line-height 1.24 | same, line-height ≥ 1.3 | the largest running text on the lesson screen |
| body | Anek, wdth 100, wght 450 | 16-17 px, line-height 1.5 | 16-17 px, line-height 1.6 | ≤ 60 ch |
| label / eyebrow / state | Anek, wdth 75-80, wght 650, uppercase, +0.1 em | 14 px | 15 px, no uppercase, no tracking, line-height 1.5 | NTC-style condensed caps |
| numerals | Anek, `tabular-nums lining-nums` | as role | — | readouts never jitter |
| parent headline | Eczar 700 | clamp(32 px, 9.4cqw, 58 px), line-height 1.04 | same, line-height 1.3 | the child's quoted words are Eczar too |

**Devanagari rules learned building this:** (1) never letter-space Devanagari, it breaks the shirorekha; (2) never put
Devanagari in an `overflow: hidden` box with line-height under 1.4: the o-matra hook of तोड़ो was clipped this way in
the first build; (3) set both scripts at the same font size, not "Hindi smaller".

**Class 4-5:** every label moves from 14 to 16 px and body from 16 to 17 px; captions stay 21 px. **Floor everywhere:
14 px**; the audit in `shots/audit.json` found no visible text under 14 px at 360, 412 or 1366 wide.

---

## 4. Space, shape, light

- **Spacing:** 4-px grid; screen gutter 16 px (phone), 48 px (wide); panel padding 16 px; gaps 8 / 12 / 14 / 18 px.
- **Radii:** 2 px slabs and keys (sharp, sporty), 4 px cards and blocks, 6 px panels and tickets, 50 % only for faces,
  atoms and station markers. No pill buttons.
- **Elevation is extrusion, never blur.** A slab's depth (`--d`, 4-5 px) is drawn as two skewed edge faces in a darker
  shade; pressing translates the face by `--d` in 90 ms. Number blocks use a 4 px hard offset in `--neel-edge`. Glows,
  drop-shadow blurs and `backdrop-filter` are not used (they are the most expensive thing a budget GPU can be asked for).
- **Texture:** a 96-px noise tile drawn once at load, 7 % overlay on the jamun and mor grounds. Static, never animated.
- **Tickets:** the home lesson card is a ticket (notches cut with a CSS mask at the perforation), a nod to CRED and to
  the "ticket to today" idea.

---

## 5. Motion

| token | ms | easing | used for |
|---|---|---|---|
| `--m-press` | 90 | linear | slab press |
| `--m-quick` | 160 | heavy | chips, toggles |
| `--m-base` | 260 | heavy | state colour changes, cards |
| `--m-land` | 460 | heavy | blocks sliding to new tree positions, bonds re-routing |
| `--m-stage` | 640 | heavy | teacher steps from the stage to the caption row; a word flying to the board |
| screen wipe | 380 in + 440 out | swing `cubic-bezier(.7,0,.2,1)` | the next screen's colour sweeps up with a slanted leading edge |
| exits | ×0.75 | `cubic-bezier(.5,0,.9,.3)` | things leaving go faster than things arriving |

`--e-heavy` is `cubic-bezier(.2,.9,.1,1)`: a fast start and a long, heavy settle. There is no overshoot on chrome. The
only overshoot in the system is the squash of a block the child has just split (and `--e-spring` is reserved for a
child's drop in the families that drag).

**Signature moves**
1. **Stretch-in:** display lines rise from a mask while their width animates 75 % → 125 % (820 ms, 110 ms stagger).
2. **Prosody type:** the word she stresses widens and thickens as she says it (620 ms), then rests slightly wide.
3. **Word to object:** the number she names leaves the caption and lands on the board (640 ms arc), then the block
   squashes once.
4. **Crack:** a hit-stop (the block pulses to 1.07, 150 ms), a white crack draws through it (150 ms), the children slide out
   of the parent's position to their places (460 ms), a 3 px shake (140 ms), and primes ring once (460 ms).
5. **Refusal, same weight:** a wrong divisor shakes the block (600 ms, the same as crack plus landing) and shows the
   exact remainder in a sky note with a magnifier. Wrong feedback is never longer or louder than right feedback.
6. **Multiply back:** when the tree is done, the strip runs the product leaf by leaf (2 → 4 → 12 → 84), each step 300 ms
   with a rising note, then the number lands (420 ms).
7. **Pencil to ink:** the one ceremony on the map (≤ 1.5 s): a ring draws round the station, then it fills.

**When not to animate:** never while the child is speaking (nothing new enters the stage); never under her voice
(no music); no idle loops anywhere (the only repeating motion is her speaking ring, which follows her audio, and the
blink, every 2.6-5.2 s); never to celebrate something the child did not do; never on a timer. **Reduced motion** (OS
setting) turns every transition and animation into an instant state change: captions appear whole, boards appear in
place, the wipe becomes a cut, and the game still works (`shots/reduced-motion-*.png`).

---

## 6. Icons and illustration

- Icons: a 24-unit grid, 2.2 px stroke, **square caps and mitred joins** (sporty and hard-edged, not friendly-round),
  no fills, drawn inline (17 in the prototype). No emoji in the UI.
- Illustration is allowed for exactly two things: **the teacher** and **the subject itself** (blocks, atoms, scales,
  apparatus). No mascots, no decorative scenes, no stars, coins, trophies or confetti.
- The big outline numeral (the level's number, stroked at 7-10 % opacity behind the board or the game) is the only
  decorative device, and it always carries real content.

## 7. The teacher's visual treatment

- **Look:** an editorial poster portrait with adult proportions (eyes on the mid-line of the head, one eye-width apart,
  nose and mouth on the thirds), two flat skin planes (lit and shadow) with a hard edge, and a marigold rim light on the
  lit side. Clothing from the cast data: Asha's teal kurti-jacket with marigold piping, Arjun's slate overshirt and round
  glasses. Drawn in SVG for this prototype (`portraitSVG()` in `index.html`). **For production:** commission an
  illustrator or re-proportion the rig to this brief; the current `c-front` puppet (spherical head, oversized eyes,
  generated for "a 7-year-old") is the most childish element in the product.
- **Framing:** a circle on a deep disc. Lesson, phone: she starts large on the stage with the topic poster and steps into
  the caption row (76 px) when the board appears; wide: 180 px at the top of the side column. Game: 46 px beside her
  micro-reaction. Home: 46 px beside her note.
- **States are knowledge states** (DESIGN-V3 §5.3 mapping kept):

| state | ring | head | eyes and brows | mouth |
|---|---|---|---|---|
| speaking | marigold, scales with her audio amplitude | still | on the child | visemes from her current word (wide / round / small / closed), ~80 ms steps |
| listening (the child's turn) | **rani** (the child's colour) | tilts 3.5° toward the child | slightly down toward the dock; brows lift 1.6 px | closed |
| thinking | dims and dashes | lifts 2° | glance up and aside, one brow up | closed |
| watching (game) | hairline | dips | down at the board | closed |

  The face never smiles more for a right answer and never changes for a wrong one (`design-v2-face-verdict-neutral`).

## 8. How the four game families and the live boards adopt the system

One renderer rule: **the idea is the hero object, drawn large in neel, ink and marigold, on its own ground.**

| family | ground | hero object | child's act and juice | readout strip |
|---|---|---|---|---|
| **Todo-Jodo** (built, playable) | neel, outline level numeral behind | number blocks (neel slabs with hard extrusion) that become marigold atoms | tap a block, choose a divisor slab; crack, squash, ring; a refused divisor shakes and shows the remainder; "1" evaporates | live product of the leaves; multiplies back at the end |
| **Taraazu** | neel | a two-pan beam drawn as one thick ink line on a marigold fulcrum; unit cubes are small neel slabs; the mystery bag is a rani-outlined slab | take from a pan: the beam tilts by the exact difference with a heavy settle (460 ms); the bag opens only on a level beam | the live equation, terms in the same slab style |
| **Nishana** | mor or neel | a full-width number line with condensed numerals; the marker is a rani pin (the child's colour) | drag and commit "yahan!"; the true flag rises in marigold; the gap is labelled exactly or "lagbhag" | the value in both scripts where words are used |
| **Kyun-Lab** | kajal | apparatus drawn flat in ink and marigold, two set-ups side by side | set chips (slabs), commit a prediction (rani), run time; the fair-test meter lights differing conditions with sky dots | the result row, marigold for the measured outcome |
| **Live boards** (lesson) | the lesson's kajal stage | the same objects as the families (the prototype's board is literally the Todo-Jodo renderer in non-interactive mode) | none: the board draws each part at the moment she names it | the summary strip at the bottom |

Round 3's four art directions (Kagaz, Chalk, Blueprint, Raat) collapse into one Taal look per family ground. If the
owner wants variety, vary the **ground** (jamun, neel, mor, kajal) and keep the objects, type and colour roles fixed.
Chalk is retired: it is the most school-coded surface there is.

## 9. Layout

- **Phone first (360 × 800 floor).** Fixed rows summed at the floor height (`ds-layout-dp-budget`): lesson = top bar 52 +
  stage (the rest, ≥ 330) + caption row ~128 + rail 60 + dock ~116; game = top bar 52 + reaction 62 + world (the rest,
  ≥ 390) + strip 52 + keys 116 + actions 60.
- **Wide (container ≥ 900 px):** the stage or world takes the left; a 400-420 px side column holds the teacher, her
  words, the rail, the readouts and the controls. Layout follows the device container (`container-type: size`), so the
  prototype's Phone/Laptop toggle shows the real phone layout inside a laptop browser.
- **Targets:** every interactive element ≥ 44 × 44 px (audited); divisor keys 48 px tall; slabs 46-54 px.
- **Tree layout:** solved at the real box: leaf columns × depth rows, node size `clamp(44 px, min(colW × 0.8, rowH ×
  0.66), 104-112 px)`; 360 = 2·2·2·3·3·5 fits six 44-px atoms across a 360-px phone.

## 10. Performance on a Rs 10k phone

Measured 2026-10-09, headless Chromium 141 (software GL), 360 × 800 at DPR 2, rAF frame intervals and Long Task API,
one run each (n = 1 per condition; indicative only, not a device test):

| scenario | CPU | frames | p50 | p95 | frames > 50 ms | long tasks |
|---|---|---|---|---|---|---|
| home → lesson wipe + first 8 s of the lesson | 1× | 483 | 16.7 ms | 16.8 ms | 0 | 0 |
| same | 4× throttle | 477 | 16.7 ms | 16.8 ms | 1 | 1 (122 ms, the screen swap) |
| game: select 84, split by 2, split 42 by 6 | 4× throttle | 204 | 16.7 ms | 16.7 ms | 0 | 2 (longest 59 ms) |

Budget rules: transform and opacity only on chrome; no blur filters or `backdrop-filter`; one rAF loop (the mic
readout), and only while the lesson is on screen; variable-width animation on one word at a time and **skipped on
devices reporting ≤ 4 cores**; fonts: one Google Fonts request, two families; no images except one 96-px noise tile;
the whole prototype is one ~150 KB file. **What degrades:** ≤ 4 cores → no width animation; reduced motion → no motion;
offline → system fallback stack (Noto Sans Devanagari, Nirmala UI, Mukta, system-ui).

## 11. Accessibility

- Contrast ≥ 4.5:1 for all text (section 2). Verdicts by shape (tick, magnifier) first, colour second.
- Text ≥ 14 px everywhere, 16 px body; class 4-5 bump in section 3. Targets ≥ 44 px.
- `prefers-reduced-motion` honoured (section 5). No horizontal page scroll at 360 px (audited); the only horizontal
  scrollers are chip and card rows, each in its own container.
- Live caption region is `aria-live="polite"` and updates once per sentence, not per word. Teacher cards are a
  radio group with arrow keys. Every icon button has a label. `lang` is set on every Devanagari run (`hi`) and Roman
  Hinglish (`hi-Latn`).
- The AI disclosure is on the first screen as a card ("Your teacher is an AI, not a person"), and in the teacher's own
  sample line. The parent corner states the safeguarding hand-off with Childline 1098 and Tele-MANAS 14416.

## 12. What Taal explicitly rejects

Mascots and cartoon proportions; stars, coins, gems, trophies, XP, confetti, streak flames; pill buttons with heavy
outlines; cream-paper-everywhere; the chalkboard; "Yay!", "superstar", exclamation chains; bouncy overshoot on chrome;
blur-based depth; music under her voice; idle loops; red for wrong; percentages, ranks and "x of y complete" on child
screens; timers and countdowns; a face that rewards correctness; near-black with a lone acid accent (DESIGN-V3's look).

**Checks that would confirm or overturn this direction** (none run yet): (1) a five-second "who is this app for?" test
with 20 Indian children aged 9-15 comparing today's screens with Taal's; (2) caption reading with and without prosody
type (comprehension and distraction, n ≥ 20); (3) the same prototype on a real Rs 10k Android (frame timing over the
lesson and game); (4) a parent trust rating of the parent corner against today's report.
