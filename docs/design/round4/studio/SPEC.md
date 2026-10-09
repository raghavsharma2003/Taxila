# Round 4 · studio · SPEC: the "Instrument" system

**Status:** a proposal with a working prototype (`index.html`). Nothing in `src/` was changed. **Date:** 2026-10-09.
Every number below is either a token the prototype uses, or a measurement with its method. Where something is not
measured, it says so.

---

## 0. The system on one page

1. **Material:** graphite surfaces lit by one soft, warm light from above. Depth comes from a 1 px top highlight, a
   bottom shadow and travel on press, never from cartoon outlines or saturated fills.
2. **One signal colour:** **ember `#FF6B2C`** means "your move" and nothing else. At most one ember element per state.
3. **One presence colour:** **her light `#F3D9A6`**: the teacher's line, her name, the prime "atoms", secure skills.
   Warm light = knowledge that has settled.
4. **Verdicts by shape first:** tick (`got` mint) for right, magnifier (`look` periwinkle) for "look again". Never red,
   never a cross. Right and wrong get the same timing.
5. **Type:** Inter (optical sizes) for everything the child reads; Geist Mono for engraved labels and the facts strip;
   Instrument Serif only for the teacher's name and the parent's headlines; Noto Sans Devanagari for Hindi captions and
   Tiro Devanagari Hindi for the parent's Hindi headline.
6. **Motion is physics:** springs defined by (duration, bounce); UI settles critically damped; only the child's own act
   (a split, a drop, a dial flick) gets a little bounce. Nothing loops for decoration.
7. **The teacher is a portrait drawn in light.** Adult proportions, a few precise lines, a lit face; she shows
   knowledge states (speaking, your turn, listening, thinking), never emotions.
8. **Two registers:** Night for the child (instrument), Day for the parent (an editorial report). Same tokens, same
   components.

## 1. Colour tokens and measured contrast

WCAG 2.x relative-luminance contrast, computed from the hex values (script in the session scratchpad, 2026-10-09).

### 1.1 Night (child, default)

| token | hex | role | on `bg` #0A0B0D | on `bg-2` #17181C | on `bg-3` #1E2025 |
|---|---|---|---|---|---|
| `ink` | #F2EFE9 | primary text | 17.16 | 15.46 | 14.20 |
| `ink-2` | #ABA8A2 | secondary text | 8.30 | 7.48 | 6.87 |
| `ink-3` | #8C8A85 | labels, captions ≥ 14 px | 5.71 | 5.14 | 4.73 |
| `her` | #F3D9A6 | teacher line, atoms, secure | 14.33 | 12.91 | 11.86 |
| `ember` | #FF6B2C | your move only | 6.93 | 6.24 | 5.74 |
| `got` | #5FE0A8 | tick, right | 11.92 | 10.74 | 9.87 |
| `look` | #A3ACFF | magnifier, look again | 9.28 | 8.36 | 7.69 |

- Text on ember: `#1A0B04` on `#FF6B2C` = 6.76 (5.88 at the gradient's darker end).
- Look-again chip text `#A3ACFF` on `#1F2130` = 7.51. Atom label `her` on the atom core `#251C14` = 12.18; block
  label `ink` on the block top `#2E3137` = 11.36.
- Graphics: dial "secure" mark 13.51; dial "not yet" dashed mark 4.22; tray placeholder text 6.47.
- Surfaces: `bg` #0A0B0D · `bg-1` #111215 · `bg-2` #17181C · `bg-3` #1E2025 · `bg-4` #282A30. Hairlines: white at
  7.5 / 13 / 22 %.

### 1.2 Day (parent corner)

| token | hex | on `bg` #F2F1ED | on `bg-1` #FFFFFF | on `bg-3` #ECEBE6 |
|---|---|---|---|---|
| `ink` | #131417 | 16.30 | 18.42 | 15.43 |
| `ink-2` | #4E5056 | 7.13 | 8.06 | 6.75 |
| `ink-3` | #64666C | 5.08 | 5.74 | 4.81 |
| `her` | #8A5A1E | 5.22 | 5.90 | 4.94 |
| `ember` | #B23A0A | 5.30 | 6.00 | 5.02 |
| `got` | #08704A | 5.42 | 6.13 | 5.13 |
| `look` | #3E4BC4 | 6.18 | 6.98 | 5.85 |

White on the Day ember button: 5.21 (`#C2400D`) to 6.57 (`#A83608`).

### 1.3 Colour rules

- **One ember per state.** Home: Start lesson. Lesson: the mic in YOUR TURN (or the Send key while typing; the
  child's own waveform while listening). Game: the selected block's outline, or the Next key after a win.
- Ember is "you": the child's own number entering the tree gets a brief ember ring, then hands over to the normal style.
- No hue within 12° of ember on any child screen (the one-turn-colour law from `ds-status-carriers`).
- Subject colour is a 7 px rotated-square marker inside a chip, never a screen tint.

## 2. Type

All from Google Fonts with real fallbacks:
`Inter, "Noto Sans Devanagari", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` ·
`"Geist Mono", ui-monospace, Menlo, Consolas, monospace` · `"Instrument Serif", Georgia, serif` ·
`"Noto Sans Devanagari", Inter, sans-serif` · `"Tiro Devanagari Hindi", "Noto Sans Devanagari", serif`.
Google serves each family by `unicode-range`, so the Devanagari files download only when Devanagari is on screen.

| role | phone | laptop | family / weight / tracking |
|---|---|---|---|
| display (greeting) | 32 / 36 | 44 / 48 | Inter 600, −0.028 em |
| h1 | 26 / 31 | 32 / 38 | Inter 600, −0.022 em |
| card title | 26 / 30 | 34 / 38 | Inter 600, −0.024 em |
| caption (her live words) | 17–19 / 25–28 | 20–24 / 30–34 | Inter 400 |
| body | 16 / 24 | 16–18 / 24–27 | Inter 400 |
| small, meta | 14 / 20 | 14–15 / 20–22 | Inter 400–500 |
| eyebrow / engraved label | 14 / 18, uppercase, +0.06 em | same | Geist Mono 500 |
| facts strip (`60 = 2 × 2 × 3 × 5`) | 18–19 | 22 | Geist Mono, tabular |
| game numerals | 20 (×1–1.55 stage scale) | up to 31 | Inter 600 tabular |
| teacher name | 30–40 | 38–56 | Instrument Serif italic |
| parent headline | 31 / 35 | 46 / 50 | Instrument Serif 400 |
| Devanagari caption | 17–19 / 25–30 | 20–24 / 30–34 | Noto Sans Devanagari 400 |
| Devanagari parent headline | 27 / 40 | 36 / 54 | Tiro Devanagari Hindi |

- **Floor:** nothing below 14 px rendered, anywhere (measured, §10). Classes 4–5: captions and body at 16 px minimum
  (the caption tokens above are already ≥ 17 px).
- Devanagari gets about 10 % more line height than Latin at the same size (matras above and below).
- Numbers are always tabular (`font-variant-numeric: tabular-nums`) so a changing value never jitters.

## 3. Space, radii, elevation, light

- **Spacing:** 4-pt grid: 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56. Phone gutters 12–16 px; laptop 24–40.
- **Radii:** 10 (chips), 14 (buttons, keys, inputs), 20 (cards), 24 (stage, board), 28 (teacher window), 36 (hero
  portrait). Full pills are not used: they read soft and childish next to machined parts.
- **Elevation is light, not shadow-soup.** A raised surface = a vertical gradient (`bg-2` → `bg-1`) + a 1 px inner top
  highlight (white 7 %) + a 1 px contact shadow + one long soft shadow (`0 18px 40px −24px`). A key adds a 3 px
  "skirt" (`0 3px 0 #0B0C0E`) that disappears on press (translateY 3 px): real travel.
- **The light that follows the finger:** `.lit` surfaces carry a 420 × 260 px radial highlight (warm white at 7 %)
  that tracks the pointer. Off under reduced motion.
- **Board and stage:** a darker plate (`#141519` → `#0F1013`), a 22 px dot grid at 6 % white, masked to fade at the
  edges, and a faint warm glow from the top.

## 4. Iconography and illustration

- Icons: inline SVG, 24-unit grid, 1.75 px stroke, round caps and joins, no fills (except play). 32 symbols cover the
  six screens. No emoji anywhere in the UI.
- **Illustration is the content, never decoration.** The home card's art is the actual idea (two factor trees of 36
  landing on the same atoms); the map is the syllabus; the board is the tree. No stock imagery, no mascots, no text
  baked into images.
- The brand mark is the Taxila arch with an ember point.

## 5. Motion

### 5.1 Springs (Apple's model: stiffness = (2π/d)², damping = 4π(1−b)/d, mass 1)

| preset | duration d | bounce b | settles in | used for |
|---|---|---|---|---|
| `snappy` | 0.32 s | 0 | ≈ 0.45 s | state changes, presses, list swaps |
| `smooth` | 0.50 s | 0 | ≈ 0.7 s | screen transitions, sheets, shared elements |
| `settle` | 0.55 s | 0.16 | ≈ 0.75 s | **the child's own act landing**: split pieces, tray atoms, dial detent, picked card |
| `soft` | 0.80 s | 0.06 | ≈ 1 s | large calm moves (the dial's arrival turn) |

The prototype compiles each preset into a CSS `linear()` easing (40 samples of the closed-form spring) for
transitions and View Transitions, and runs a 240 Hz semi-implicit integrator for interactive values (tree nodes, dial,
tray, teacher pose), so a value interrupted mid-flight keeps its velocity.

### 5.2 What moves, and why

| moment | motion | timing |
|---|---|---|
| screen change | View Transition: old screen fades/scales to 0.988 in 220 ms (exit is faster than entry); new screen rises 22 px on `smooth`; the teacher window and the board/stage are **shared elements** that fly between screens | ≈ 0.7 s |
| first meeting | the portrait's lines draw themselves in (stroke-dashoffset, staggered), then the tones fade in | 2.1 s, once |
| she speaks | lips follow visemes derived from the spoken line; a soft aura breathes with amplitude; captions appear word by word, numbers lit in her colour | per word 0.2–0.72 s |
| your turn | she leans in (pitch + 1.6 px, brows held), the mic turns ember, a single breath ring, a two-note chime and one 20 ms haptic tick | one event, same frame |
| listening | head tilt 3.8°, continuer nods every ≈ 1.3 s, an ember ring around her window, the child's waveform in the mic | live |
| heard → thinking | "Got it" receipt within 420 ms; then gaze aversion up-left at +300 ms; no spinner, no dots | 950 ms, **identical for right and wrong** |
| verdict | tick or magnifier springs in on the question card; right: the child's number joins the tree; wrong: a dotted chip shows what the answer does (`2 × 16 = 32`) | same duration both ways |
| board draws | nodes spring out of their parent, bonds draw in 520 ms, primes ring once | at the clause that names them |
| game split | squash, a crack of light across the block, six specks of dust, hit-stop feel, pieces fly to their places on `settle`, atoms ring and drop into the tray | ≈ 0.6 s |
| refused split | the crack runs half-way and bounces back, a ≤ 6 px spring shake, the leftover shows (`7 × 8 + 4`) | ≈ 0.6 s + 1.9 s label |
| win | atoms pulse left to right with rising pitches, the tray atoms jump, the root gets a mint ring, the facts strip becomes `60 = 2² × 3 × 5 ✓` | ≈ 1 s |
| dial | follows the finger, coasts with exponential friction, snaps to a chapter on `settle`, detent click + 5 ms haptic per chapter | physical |

### 5.3 When NOT to animate

- Nothing loops for decoration. Idle life is only her blink, micro-saccades and breathing (≤ 0.7 px).
- Nothing new enters the board while the child is speaking.
- No celebration on an ungraded answer; no motion that previews a verdict during "thinking".
- **Reduced motion** (`prefers-reduced-motion`): every transition becomes a ≤ 1 ms change, springs jump to their
  target, the draw-in, dust, rings, blink, saccades and breathing are off, and View Transitions are skipped. Lip-sync
  and captions stay, because they carry meaning. Measured: the full lesson and a full game level complete with no
  errors under `reducedMotion: 'reduce'` (`shots/states`, run 2026-10-09).

## 6. Sound and haptics (readiness)

All synthesised with WebAudio at a low master gain (0.42 into a compressor), only after the first tap, toggleable on
every screen with sound. Every sound is caused by the child's act: key thock, detent click, split crack, prime bell
(pitch by prime: 2 → C5, 3 → E5, 5 → G5, 7 → A♯5 …, so a factorisation is a chord), refused "tok", your-turn chime,
"heard" blip. Haptics (`navigator.vibrate`, Android) mirror them at 5–20 ms and are gated until the first user tap. The
production voice (Azure TTS) would replace the silent lip-sync driver; the viseme interface stays the same.

## 7. The teacher: a portrait drawn in light

- **Construction.** One 240 × 300 SVG per teacher, about 40 paths: a warm skin glow on an opaque base, hair as a dark
  gradient mass with a rim-light line, the face as 1.5–2.3 px lines in `her`, irises as small dark discs with a light
  ring and catch-light. Adult proportions: eyes at half the head height, iris ≈ 9 % of face width.
  Asha: middle parting, hair falling behind the shoulders, small studs, a small bindi, teal kurta with a dupatta line.
  Arjun: short hair, rounded-rectangle glasses, open collar, indigo overshirt.
- **States (knowledge only, never emotion).** speaking (visemes, aura with amplitude) · your turn (lean-in, held brow,
  eyes on the child) · listening (tilt, nods, ember ring) · thinking (gaze up-left, lips pressed) · idle (blink every
  2.4–5.6 s, micro-saccades, breath). Each state also has a word ("Asha is listening") and a glyph, so greyscale and
  muted screenshots still say whose turn it is.
- **Lip-sync.** Visemes from the spoken (Roman) line: a → open, e → mid-wide, i → wide, o → round, u → tight round,
  m/b/p → closed, f/v → teeth; mouth geometry is one parametric path (open, width, smile) driven by springs.
- **Tiers.** Hero (300 px), window (92–330 px), mini (44 px, face crop). Landscape windows letterbox the portrait in
  the lit field instead of zooming into the face.
- **Always labelled AI:** "AI TEACHER" next to her name, an "AI" badge on the lesson window, and she says it in her
  first sentence.
- **Why this is the aesthetic risk.** Every other route (cartoon, 3D, video avatar) fights the uncanny valley or reads
  young. A drawn-in-light portrait is unusual in edtech and may feel too abstract to some children; that is the test
  in §11.

## 8. How the game families and the live boards adopt the system

One rule: **every family is an instrument built from the same parts** (graphite blocks, lit atoms, keycaps, a
facts strip in mono, a tray), on the same plate, through the same `PlayStyle` interface round 3 defined. Only one
family is built here; the others are specified.

| family | instrument | parts | the law made visible |
|---|---|---|---|
| **Todo-Jodo · atoms** (built) | a factor press | composite = machined block; prime = lit disc; divisor keycaps (primes in her colour); the atom tray | a key that does not divide bounces and shows the leftover (`7 × 8 + 4`); ÷1 or ÷itself releases a "1" that evaporates; Done with a composite leaf makes it hum; any route fills the tray with the same atoms |
| Todo-Jodo · strips | gauge blocks | fraction strips as anodised bars that wring together; re-cut is a fine engraving | pieces of different sizes do not seat: a visible gap, never a red mark |
| Taraazu | analytical balance | a needle and an engraved scale; cubes as weights; the mystery bag as a sealed canister | the beam angle is computed from L − R; the canister will not open off-level |
| Nishana | vernier rule | a ruler with major and minor engravings and a sliding cursor | the true flag rises at the exact value; "lagbhag" when the gap is not a simple fraction |
| Kyun-Lab | lab bench | two set-ups under the same light, condition chips as labelled switches, a time dial | the fair-test meter lights every difference; outcomes come only from the causal model |

**Live-built boards** (the forge) render on the same plate with the same pieces: a board is a declarative scene of
blocks, atoms, bonds, strips and labels in a fixed design canvas, scaled by one factor `k = clamp(min(W/400,
(H − margins)/300), 1, 1.55)` so a laptop board is bigger, never denser. Labels are ≥ 14 px at k = 1 (checked by the
audit in §10); nothing is ever drawn in a corner of an empty slate, because the layout centres the scene's bounding box.

## 9. On a Rs 10k phone

**Budget:** first render ≤ 150 KB of HTML/JS/CSS before fonts (the prototype is ≈ 150 KB, one file, uncompressed);
fonts ≈ 200 KB for the Latin set and only when needed for Devanagari; animation on `transform`/`opacity` and SVG
attributes only; no `backdrop-filter`, no blur filters, no video, no WebGL.

**Measured** (headless Chromium, 412 × 915 at DPR 2, rAF intervals, `Emulation.setCPUThrottlingRate`, 2026-10-09;
software rendering, so this is indicative, **not** a real budget phone):

| scene | CPU ×1 p50 / p95 / max (ms) | CPU ×4 p50 / p95 / max (ms) | long tasks |
|---|---|---|---|
| lesson: speaking + board drawing (6 s) | 16.7 / 16.8 / 16.8 | 16.7 / 16.8 / 49.9 | 0 |
| game: 5 splits incl. a refusal (5 s) | 16.7 / 16.8 / 33.3 | 16.7 / **33.3** / 50.0 | 0 |
| dial: drag, coast, detent (4 s) | 16.7 / 16.7 / 16.8 | 16.7 / 16.8 / 16.8 | 0 |

At 4× the game drops frames during a split (p95 33 ms). **Degrade ladder** (by a frame-time governor): 1) drop the dust
specks and ring pulses, 2) drop the pointer light, 3) step the teacher's idle life down to blink only, 4) replace View
Transitions with a 120 ms cross-fade. The law, the sounds and the receipts never degrade.

## 10. Accessibility (measured on the prototype)

Audit script (`shots/audit.json`): six screens (plus the choose-teacher step) × 360 × 800, 412 × 915, 1366 × 768;
every visible text node's rendered size (SVG text included, via its screen matrix), every tappable element's box,
horizontal overflow.

- **Horizontal page scroll:** 0 of 21 renders.
- **Smallest rendered text:** see `audit.json` (target ≥ 14.0 px everywhere; the home illustration and dial labels were
  raised after the first audit found 12.9 px and 13.5 px).
- **Targets:** every button, key, card and input ≥ 44 × 44 px; dial chapter numbers have a 46 px hit circle; the dial
  is also a keyboard `slider` (arrow keys).
- **Contrast:** §1 (all text pairs ≥ 4.5:1; graphics ≥ 3:1).
- **State without colour:** each turn state has a word, a glyph and a pose; verdicts are a tick or a magnifier;
  mastery states are filled / ring / half / dashed.
- **Screen readers:** captions are `aria-live="polite"`, the question card `assertive`; icon buttons have labels; the
  teacher art is `aria-hidden` and her state is text.
- **Devanagari:** captions switch script in place (Aa → अ → EN); Hindi parent report in Tiro Devanagari Hindi.

## 11. What this explicitly rejects

Mascots and big-eyed cartoon teachers; 3D skin; cream paper and storybook serifs on child screens; full-pill
everything; primary-colour blocks; confetti, stars, coins, XP, streaks, "+10"; HUD counters like CHAIN or ACCURACY;
spinners and "thinking…" dots; red crosses or buzzers; bouncy overshoot on UI chrome; decorative loops; text baked into
images; any sound or motion not caused by the child or by the idea itself; a verdict leaking through the waiting time.

## 12. Not done, not measured

- No child, parent or real budget phone has seen it. The tests that would decide it: DESIGN-V3 X1 (age-appropriateness,
  n ≥ 24) with this direction as an arm; a line-portrait legibility test ("is she listening or thinking?", greyscale,
  n ≥ 12); a 4-week look at whether the dial is opened unprompted.
- The voice is silent (lip-sync is driven by text timing); no TTS was called.
- Only Todo-Jodo atoms is playable; strips, Taraazu, Nishana and Kyun-Lab are specified, not built.
- The portraits are hand-drawn SVG by the designer, not a production character pipeline; the owner should judge them
  against the earlier faces by looking.
