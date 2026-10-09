# Round 4 · studio · RESEARCH: "Instrument"

**Direction:** Taxila as a premium instrument. **Key:** `studio`. **Date:** 2026-10-09.
**Prototype:** `index.html` (this folder). **System:** `SPEC.md`. **Proof:** `shots/`.

The thesis in one line: **Taxila should feel like a precision instrument for thinking, with a teacher drawn in light.**
Calm graphite surfaces, one warm light, one signal colour that means "your move", motion that behaves like physics,
and game pieces a 13-year-old would be proud to hold. No mascots, no cartoon face, no stickers.

Honesty note: everything below is a desk review plus my own design reading of the products named. No child, parent
or budget phone has seen this direction. Where I could not find a source, I say so.

---

## 1. References, and exactly what I take from each

| reference | what I take | where it shows up in the prototype |
|---|---|---|
| **Apple: springs as the motion model** (WWDC23 "Animate with springs") | Two parameters, duration and bounce, instead of hand-tuned curves. Stiffness = (2π / duration)², damping = 4π(1 − bounce) / duration. Bounce 0 for UI state, a small bounce only for things the user threw or dropped. Springs keep velocity, so an interrupted motion never jumps. | `springFn` / `springEase` in the prototype generate CSS `linear()` easings and a rAF integrator from exactly those two numbers. Four presets (SPEC §5). The dial's coast-then-detent, the tree's split, the atoms landing in the tray, the shared-element screen transitions all use them. |
| **Linear** (2024 redesign; "A calmer interface for a product in motion") | Reduce visual noise; not every element gets equal weight; warmer greys instead of blue-greys; perceptually even colour (they rebuilt themes on LCH). | Warm graphite neutrals (`#0A0B0D` → `#282A30`), hairlines at 7.5–22 % white instead of boxes, one bold thing per screen. |
| **Things 3** (Cultured Code; Apple Design Award 2017) | Restraint and typographic hierarchy doing the work that colour usually does; one primary action per view; delight in small, exact motions (a checkbox that feels like paper). | Home has exactly one ember element (Start lesson). Hierarchy comes from size and weight (Inter 600 at −0.028 em for titles; mono eyebrows), not from coloured panels. |
| **Braun / Dieter Rams** colour coding by function | Bodies stay achromatic; one strong colour marks the control you must find fast (Rams Foundation describes FM buttons in "blood orange" on the regie 500). | **Ember `#FF6B2C`** is used only for "your move": the Start button, the live mic in YOUR TURN, the child's own voice waveform, the child's own number in the tree, the Next key. It is never decoration and never a verdict. |
| **Machinist and lab instruments** (gauge blocks, keycaps, analytical balances, verniers) | Depth from light and material: a top highlight, a bottom shadow, a press that travels 3 px. Engraved, tabular numerals. Nothing cute. | Number blocks are machined graphite ingots; primes "crystallise" into lit discs; the chisel pad is a row of keycaps with real travel; the board is a dark plate with a dot grid. |
| **Jantar Mantar, Jaipur** (UNESCO: an ensemble of masonry instruments for naked-eye astronomy) | An Indian precedent for "a beautiful precision instrument" that is neither Western-corporate nor folk-decorative. | The mastery map is a **dial**: ten chapters on a bezel, skills as marks, a fixed index window, a "your class at school" marker. It turns with inertia and stops on detents. |
| **Apple Watch Digital Crown / click wheels** | Detents you can feel and hear; inertia you can flick. | Dial physics: drag, coast with exponential friction, snap to the nearest chapter with a settle spring, a detent click and a 5 ms haptic tick per chapter crossed. |
| **Brilliant** (learn by doing; their animations are state machines that respond to the learner, per Rive's case study) | The interactive thing is the lesson, not an illustration next to it. I could not find an official write-up of a 2024 Brilliant redesign: only app release notes ("design updates, new fonts", v7.32.0, April 2024) and third-party summaries, so I take only the principle, not a look. | The board in the lesson and the game use **one** tree component (`AtomTree`), so what Asha draws is literally the instrument the child then plays. |

## 2. What 9–15-year-olds read as "for little kids" versus "for me"

Evidence, strongest first:

1. **The owner's own verdict (2026-10-09):** today's product is "childish and basic". This is the primary data point
   for this round, and the screenshots in §3 show why.
2. **Teens reject condescending tone, babyish visuals and pointless multimedia; they want interactivity and small
   chunks** (NN/g, *Teenager's UX*, 100 participants aged 13–17 across 3 rounds). → One idea per surface; motion only
   when it explains or answers the child.
3. **Tweens reject primary colours, exaggerated animation and "playful" UI, and admire grown-up apps: clean lines,
   dark mode, modern type** (bitskingdom on Gen Alpha preteens; ustwo; cited in `docs/design/reset/DESIGN-V3.md` F4).
4. **Adolescents are unusually sensitive to status and respect; interventions that feel condescending fail, ones that
   grant respect work** (Yeager, Dahl & Dweck 2018, *Perspectives on Psychological Science*). → A teacher who looks like
   an adult professional, copy that talks to a capable person, controls that feel like real tools.
5. **Indian context:** WhatsApp is the dominant messenger for India's Gen Z (TCS, 71 %); YouTube is the top platform
   (Think with Google APAC); BGMI is the most-played mobile game (cited in DESIGN-V3 F11). The things these children
   respect are dark, dense and confident, not pastel.

**Gap, stated plainly:** my search (2026-10-09) found **no India-specific study** of what 9–15-year-olds call
"kiddish" in an app. Points 2–4 are mostly US/European samples. Nothing here has been tested on Taxila children; the
test that would settle it is DESIGN-V3's X1 (5-second test, n ≥ 24, split 9–11 / 12–15).

**My lint, derived from the above** (a screen fails if it has anything in the left column):

| reads as "for little kids" | reads as "for me" |
|---|---|
| big-eyed, child-proportioned cartoon face; mascots; faces on objects | an adult teacher drawn with restraint (adult proportions: eyes at half head height, small irises) |
| cream paper, rounded pills everywhere, storybook serif in the child UI | graphite, hairlines, 14 px radii, Inter, mono labels |
| text buttons as game controls ("Bag kholo", "◀−1") | keycaps, dials, blocks that look machined and move with weight |
| confetti, stars, coins, streaks, "+10" | the law of the idea responding (a block that will not split shows its leftover) |
| chalkboard as the only drawing surface | one board/instrument surface shared by lesson and game |
| bouncy overshoot on everything | critically damped UI; a little bounce only on what the child dropped |

## 3. What I reject in today's Taxila, and why

| what (evidence) | why it reads childish or basic | what Instrument does instead |
|---|---|---|
| The r8 face puppet (`public/face-puppet/r8/rest-medium.webp`): big glossy eyes, oversized head, toy-like skin | Child proportions on an adult teacher read as "cartoon for small kids", the single strongest age cue on the screen | The teacher is a **portrait drawn in light**: adult proportions, a few precise lines, a lit face. Lip-sync and knowledge states are cheap and never uncanny (SPEC §7). |
| The 3D plates (`public/assets/teacher/{teal,slate}/1/plate-*.webp`) | Low-poly skin and hair under flat light land in the uncanny valley | Line-light avoids photorealism entirely, so there is no valley to fall into. |
| Cream paper, Literata, pill buttons, clip-art circle avatars (live `taxila.dev` landing, `shots/reject-live-landing-412.png`; `docs/design/round3/forge/audit/before/*/01-ask-*.png`) | "School workbook", and the same look as many kids' apps | Graphite instrument UI for the child; a daylight editorial register only for the parent, where trust matters more than cool. |
| One green chalkboard for every visual ask (forge audit: 12/12 the same chalkboard) | Monotone and nostalgic; "particular style only" (owner, 2026-10-09) | A graphite plate with a dot grid; the same machined pieces in the board and the game. |
| Round-3 game controls as labelled text buttons (`docs/design/round3/play/shots/all/balance-p360-raat.jpg`, `strips-compare-p360-kagaz.jpg`) | They feel like a form, not a tool. The engine underneath (the law runs, no lose state) is right. | Keycaps with travel and sound; pieces that crack, bounce, crystallise and land in a tray, all driven by the same exact law. |
| An empty node diagram as the world map (`docs/design/round3/play/shots/world-map-p360-kagaz.png`) | Reads as a wireframe | The dial: the year's syllabus on one instrument face, with every skill's true state. |
| HUD pills "CHAIN ×0", "ACCURACY 0%" (forge audit §3) | A streak and a percentage on a child's screen | No counters outside the facts strip of the instrument itself (`60 = 2 × 2 × 3 × 5`). |

What I **keep** from earlier directions because it is right: the one-turn-colour law (`ds-status-carriers`, DESIGN-V3
volt rule), verdicts by shape before colour, the question pinned on screen, equal timing for right and wrong, no
streaks, English chrome with the teacher speaking Hinglish/Hindi/English, and "How do we know?" evidence for parents.
What I change from DESIGN-V3: its volt lime and Bricolage read as "gamer hype" to me; Instrument uses a Braun-style
ember accent, Inter with optical sizing, Geist Mono for engraved labels and Instrument Serif only for the parent's
headlines and the teacher's name.

## 4. Sources

- Apple, WWDC23 session 10158 *Animate with springs*: https://developer.apple.com/videos/play/wwdc2023/10158/ (notes: https://wwdcnotes.com/notes/wwdc23/10158)
- Linear, *How we redesigned the Linear UI*: https://linear.app/now/how-we-redesigned-the-linear-ui ; *Behind the latest design refresh*: https://linear.app/now/behind-the-latest-design-refresh
- Cultured Code, *Back from WWDC* (Things 3 Apple Design Award 2017): https://culturedcode.com/things/blog/2017/06/back-from-wwdc/
- Rams Foundation on Braun colour coding: https://rams-foundation.org/?p=7213 and https://rams-foundation.org/?p=5229
- UNESCO evaluation, Jantar Mantar, Jaipur: https://whc.unesco.org/document/152416 ; https://en.wikipedia.org/wiki/Jantar_Mantar,_Jaipur
- Brilliant app release notes (v7.32.0, April 2024): https://www.apkmirror.com/apk/brilliant-org/brilliant/ ; Rive, *How Brilliant.org motivates learners with Rive animations*: https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations
- Nielsen Norman Group, *Teenager's UX*: https://www.nngroup.com/articles/usability-of-websites-for-teenagers/
- Yeager, Dahl & Dweck (2018): https://doi.org/10.1177/1745691617722620
- bitskingdom, *UX for Gen Alpha preteens*: https://bitskingdom.com/blog/ux-design-gen-alpha-preteens/
- TCS, *Ten things to know about India's Generation Z*: https://www.tcs.com/who-we-are/newsroom/press-release/ten-things-to-know-about-india-generation-z
- Internal: `docs/design/reset/DESIGN-V3.md` (F1–F12), `docs/design/round3/play/DESIGN.md` (Todo-Jodo atoms law), `docs/design/round3/forge/audit/README.md`, `data/curriculum/c6-maths.json` and `data/kits/c6-maths.json` (Ganita Prakash ch. 5 "Prime Time", topic t04, misconception `m-stop-composite`, hook "Break 360").
