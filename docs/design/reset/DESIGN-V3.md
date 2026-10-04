# DESIGN V3 — Taxila for ages 9-15

Status: proposal for the owner reset (`owner-reset-2026-10-04`). Written 2026-10-04. Binding inputs:
`docs/design/OWNER-RESET-2026-10-04.md` (15 + 1 requirements, cited below as **R1…R16**), `context/rejected.md`,
`docs/research/duplex/ARCHITECTURE.md`, `docs/design/superhuman/LIVE-STUDIO.md`. The child-safety floor outranks
everything here.

Working mockups: `prototypes/reset/design-v3/index.html` (gallery) and eight screens beside it. They are live HTML, not
pictures. Nothing in `prototypes/` is imported by `src/`, and no product code was changed for this spec.

Supersedes `docs/design/PRODUCT-DESIGN-V2.md` wherever V2 designs for ages 6-9 or uses the "Lamp and Paper, painted
world" identity (V2 §7, §9.1, §10, §12). §13 lists exactly what changes and what is kept.

---

## 0. The answer on one page

1. **Who it is for.** Classes 4-7, ages 9-15, with the reference child a **12-year-old in class 6**. The class-4 child
   (age 9) gets the same product and the same look. They want to look older, not younger. Nothing on any screen may
   read as "for small kids": no mascots, no cartoon animals, no stars, coins, confetti or bubbly type.
2. **What it feels like.** A premium app a 13-year-old would show a friend. It borrows from the apps they already
   respect (Spotify, Discord, Valorant, Brilliant, CRED), not from kids' apps. It is dark by default and calm. It has
   one bright accent, and its motion has weight and is never cute. **The teacher is the warmth; the UI is the
   instrument.**
3. **Colour.** A near-black ink ground (`#0A0C12`), the brand indigo **ion** (`#8B98FF`) for the teacher and
   identity, and **volt** lime (`#CBFF4D`). Volt marks one thing per screen: "your move". Verdicts use **shape before
   colour**: a tick in mint for "got it", a magnifier in amber for "look again". Red never marks a wrong answer. A Day
   theme exists: the child can opt in, and it is the parent default. Every text pair was measured at ≥ 5:1 (§14 M2).
4. **Type.** Bricolage Grotesque for display, Atkinson Hyperlegible Next for UI and reading, Geist Mono for data,
   labels and HUD, Mukta for Devanagari. All four load from Google Fonts. Body text is ≥ 15 px and stage labels are
   ≥ 12 px at the floor phone (§14 M4).
5. **Lesson screen.** It is built for **hands-free duplex voice** (R10, R16). On wide screens the **stage** is on the
   left and a **side column** on the right holds the teacher tile, a short live transcript and the dock. On phones the
   stage is on top, with the teacher as a picture-in-picture in the stage's reserved corner, two transcript lines
   and the dock below. There is no click-to-speak. The mic is a state readout ("Speak anytime · she pauses for you").
   It is not a button you hold.
6. **Stage contract.** Every artifact (board, animation, game, image, simulation) renders into one slot.
   - The slot has a fixed aspect, scales to fit with letterboxing and never scrolls.
   - It keeps clear of a reserved PiP corner and a 62 px HUD rail at the bottom.
   - Minimum label size is defined in canvas units, so text stays readable at 326 × 334 px.
   - Measured: 0 overflows across 3 lesson screens × 5 viewports (§14 M1).
7. **Copy.** Respectful, short, dry-witty. It talks to them like a capable person, which is what adolescents are
   most sensitive to (Yeager et al. 2018). It never uses "Yay!", "Great job, superstar!", "Oopsie" or exclamation
   chains. Chrome stays English. The teacher's speech follows the family's language (Hindi / Hinglish / English).
   Steer chips use the words a child would actually say.
8. **Onboarding.** A welcome, then 5 steps in ≤ 7 taps if the defaults are kept:
   1. class (4-7) + board;
   2. name + how she talks, with a live sample line;
   3. pick a teacher by hearing them;
   4. a **real scheduler**: day toggles, a quick-pick row, a 15-minute time rail with ‹ › steppers, a length setting
      and a plain-English summary. It uses no native date/time pickers, which fixes R11;
   5. parent hand-off (here now / send a link).
9. **Home and progress.** There are **no streaks, no points and no leaderboards**.
   - Home leads with *one* next lesson built from what the child asked, a teacher note about the child's own
     thinking, and the questions they parked.
   - Progress is **mastery**: chapter → skill states drawn as shapes (secure / working on it / met / ahead / check-in
     due). "Secure" means right again days later without warning. Progress also shows "then and now" lines and the
     hardest thing the child cracked.
10. **Hard moments are designed.**
    - **Diversion** (R6): she notices, says so, and parks the question visibly in a **Later** tray. It comes back at
      wrap-up.
    - **"End the lesson"** (R7): she acknowledges it and offers a break or a two-minute wrap-up. Nothing is lost and
      parent limits apply.
    - **Build failures** (R9): invisible. There is no "making this for you" caption, no skeleton label and no error
      card.
11. **Parent corner.** Day theme with English chrome. The report language can switch to Hindi. It shows:
    - **one capability per week**, with "How do we know?" evidence (date, on their own or with a hint, the child's
      own words);
    - a 5-minute home task;
    - what was made for the child and why;
    - a working reschedule (a 14-day date strip and a time grid that disables times outside lesson hours and clashes);
    - limits, and safety in plain words.
    The parent sees learning, not a recording.

---

## 1. What 9-15-year-olds love, trust and reject (research)

Method: a desk review of usability research, adolescent-psychology research and product teardowns (2026-10-04,
sources in §17). These are claims from the literature. **None of it has been measured on Taxila children yet.** The
experiments that would measure it are in §15.

### 1.1 Findings that bind the design

| # | finding | source | what V3 does with it |
|---|---|---|---|
| F1 | Teens reject "condescending or babyish" tone, dense text and **pointless multimedia**. They want interactive elements and small chunks. 100 participants (13-17), 210 sites + 30 apps, 3 rounds, 2004-2019. | NN/g, *Teenager's UX* | One idea per surface. Motion only when it explains or answers the child. Interactivity (game, draggable board) over decoration. |
| F2 | Teens give up quickly and blame the design. Slow loading is a deal-breaker. | NN/g (same) | Zero visible waiting (R9). The stage always has something real in it. No spinners on child screens. |
| F3 | Teens read below adult level. Write at ~6th-grade level or lower. Highlighting helps. | NN/g (same) | Captions ≤ 2 lines on phones. Key term highlighted (volt underline or bold). Body ≥ 15 px. |
| F4 | Tweens (9-12) reject anything that looks childish (primary colours, exaggerated animation, playful UI), immediately and often permanently. They admire grown-up apps: clean lines, dark mode, modern type. | bitskingdom (Gen Alpha preteens), ustwo, UXmatters | Dark default, neutral grounds, one accent, grown-up type. Even the class-4 child gets this. Nobody gets a "kids mode". |
| F5 | Adolescents are more sensitive than children to **status and respect**. Interventions fail when they feel condescending and work when they grant respect and autonomy. Respectfully framed asks roughly doubled compliance in Yeager's studies. | Yeager, Dahl & Dweck 2018 (*Perspectives on Psych. Science*); Scientific American summary | The copy rules (§7). Always give a choice ("Your call"). Explain *why* when asking for effort. The teacher admits limits. |
| F6 | Streaks run on loss aversion. They drive "performative learning" and anxiety, and the remedy (streak freezes) is itself a monetised anxiety reliever. | Decision Lab ("Streak creep"); UX Magazine; screenwise parent guide; arXiv 2411.12083 (engagement-prolonging designs teens meet) | **No streaks.** The weekly schedule row shows planned days and done days, with no count, no flame and no "don't break it". |
| F7 | Pre-teens care about identity and autonomy (avatar making, choosing). They experiment with identity and are socially self-conscious. | ACM CHI 2025 "Children's avatar making" (arXiv 2502.18705); screenwise | The child picks and names the teacher, picks how she talks, sets the schedule. Their own words appear on the end card and in progress. No rankings against peers. |
| F8 | Brilliant teaches by doing. Placement uses real problems, and state-machine animation (Rive) responds to the learner's actions instead of playing canned clips. | Rive case study; screensdesign Brilliant teardown | Board and stage pieces are interactive ("try to break it: slide the top point"). Motion is driven by state, not timed reels. |
| F9 | Photomath's trusted pattern: answer first, then expandable steps, each step animated to show exactly one move. | Photomath app pages; screensdesign teardown | The whiteboard draws one move per teacher clause. "Show again" replays the last move, not the lesson. |
| F10 | Game UIs that teens respect (Clash Royale, Valorant) are readable at a glance: strong hierarchy, high contrast, bold simple shapes, one call to action, colour-blind-safe status. Valorant's redesign pushed contrast and simplified shapes *because* players missed vague status cues. | Rookies Clash Royale breakdown; Riot "future of VALORANT's interface"; Tandera case study | The game HUD lives in a reserved rail. It uses mono numerals, one target readout and shape-coded hits. Nothing in the HUD is decorative. |
| F11 | Indian Gen Z: YouTube is the #1 platform (79% daily Google/YouTube use), WhatsApp is the messenger (71%), and BGMI is the most-played game (240 M+ downloads). Indian youth brands with cultural pull (Zomato, CRED) use witty, present-tense, Hinglish-aware copy and a premium dark aesthetic. | Think with Google APAC; TCS Gen Z study; Outlook Respawn 2025; afaqs on Zomato copy; CRED design case studies | The diversion example uses BGMI because that is what they will actually bring up. Parent invites go by WhatsApp. Copy may be lightly witty. The premium dark look reads as "CRED-level", not "school app". |
| F12 | Khan Academy shows mastery as levels (attempted → familiar → proficient → mastered) and is moving to "skills to proficient" as its outcome measure. | Khan Academy help centre + blog | Progress is skill states, with "secure" requiring delayed re-success (the existing learner-model rule). There is no percentage and no XP. |

### 1.2 Babyish vs grown-up: the lint list

A screen fails review if it has **any** item in the left column. This is a design-review checklist. A future
`tests/visual` lint can catch most of it automatically (colour count, font list, emoji regex, banned-word regex).

| reads as babyish (banned) | reads as grown-up (use) |
|---|---|
| mascots, cartoon animals, smiling suns or books, a talking owl | the teacher as a real-looking person (stylised painterly portrait or the 3D/2D rig); abstract geometry |
| primary red/yellow/blue blocks, rainbow gradients, pastel candy | near-black or near-white grounds, one indigo, one lime accent, subject hues only as small markers |
| rounded "bubbly" display fonts (Fredoka, Baloo-style, Comic) | grotesque display (Bricolage), hyperlegible UI (Atkinson), mono for data |
| stars, coins, gems, trophies, confetti, "+10 XP", streak flames | mastery states, then-and-now, your own words quoted back, the hardest thing you cracked |
| "Yay!", "Awesome job, superstar!", "Oopsie!", "Let's learn!", "!!" | "Got it.", "That's the whole proof. In your words.", "Your call." |
| bouncy overshoot on everything, wobble, jelly buttons | weighted ease-out; spring only on a child-initiated drop; cinematic motion only inside the stage |
| click-to-talk, "Tap the mic to speak!" | hands-free: "Speak anytime · she pauses for you" |
| quiz-in-costume "games" (pick an option, type a number) | real-time games with physics, timing or strategy that teach the concept (R3) |
| spinners, "Loading your lesson…", "AI is generating…" | the teacher keeps teaching; the piece arrives when it is ready (R9) |
| big friendly emoji reactions | the verdict on the work (tick on the answer, the area readout stays 20 cm²) |

---

## 2. Positioning

**For the child:** *"A teacher who actually listens."*
- She talks with you like a person.
- She builds the lesson around what you asked.
- She makes you a game when you're ready to test an idea.

**For the parent:** *"Proof, not points."* Every claim on the parent screen links to the attempt that earned it.

**Against:**
- the YouTube coaching channels (PhysicsWallah, Magnet Brains), which are one-way;
- Byju's-style animated video, which you passively watch;
- Duolingo-style gamified apps, which are shallow and streak-driven;
- the old Taxila (R1-R4).

**What makes it unusual:** a real conversation plus a stage that changes *because of what you just said*. Nothing on
the screen is generic.

---

## 3. Visual language

### 3.1 Colour (tokens in `prototypes/reset/design-v3/v3.css`)

| role | Night (child default) | Day (child opt-in, parent default) | rule |
|---|---|---|---|
| ground `--bg` / `--bg-1` / `--bg-2` / `--bg-3` | `#0A0C12` / `#10131B` / `#161A24` / `#1F2431` | `#F5F6F8` / `#FFF` / `#FFF` / `#EEF0F4` | depth by lightness steps, never by shadow alone |
| ink `--ink` / `--ink-2` / `--ink-3` | `#F2F4F8` / `#A9B0C0` / `#848CA0` | `#0E1116` / `#4A5263` / `#5E6677` | ink-3 only for labels ≥ 12 px |
| **ion** (brand, teacher, links, focus) | `#8B98FF` | `#3F4FD8` | the teacher's speaking ring and the brand mark |
| **volt** ("your move") | `#CBFF4D` on `#0A0C12` | `#C2F542` on `#0E1116` | **at most one volt element per screen state**: the primary CTA *or* the your-move cue *or* the child's own voice waveform. It inherits the one-turn-colour law from `ds-status-carriers` and `ds-rejected-chalk-mark-gold`. No other token within 12° of volt's hue on a screen that shows it. |
| mint (got it) | `#3DDC97` | `#0B7D55` | always with a **tick** shape |
| amber (look again / check-in due) | `#FFB547` | `#A86200` | always with a **magnifier** or dot shape; never red, never a cross |
| rose | `#FF6B81` | `#C2334D` | destructive and safety UI only, **never** a verdict |
| subject markers | maths `#8B98FF`, science `#2FD3C7`, social `#5AB8FF`, English `#FF8A7A`, Hindi `#C69BFF` | darker equivalents | an 8 px rotated-square marker + mono label. Subjects never tint whole screens |

Why dark by default:
- F4: tweens read dark mode as grown-up.
- The stage content glows against it, cinema-style.
- It costs nothing on OLED budget phones.

The Day theme is a real theme, not an afterthought. The parent corner uses it by default because parents read it in
daylight on the go.

### 3.2 Type

| role | family | size (phone → wide) | notes |
|---|---|---|---|
| hero | Bricolage Grotesque 700 | clamp(30 px, 8 vw, 48 px), −0.035 em | the single headline of a screen |
| h1 / h2 | Bricolage 700 / 650 | 28 / 22 px | |
| UI + reading | Atkinson Hyperlegible Next 400-700 | 15-16 px body, 14 px secondary | chosen for letterform distinction (Il1, 0O). Keeps the measured legibility rationale of `design-v2-type-atkinson-literata` |
| data, labels, HUD, timestamps | Geist Mono 500-600 | 11-13 px, uppercase eyebrows +0.06-0.08 em | gives the "instrument" feel teens read as pro tools |
| Devanagari | Mukta 500-600 | matches UI size | used when the family picks Hindi |
| tabular numerals | everywhere (`font-variant-numeric: tabular-nums`) | | HUD and clock numbers don't jitter |

Literata (V2's reading serif) is dropped from child screens. It reads as "storybook".

### 3.3 Iconography

- Inline SVG sprite (`sprite.js`), 24-unit grid, **1.75 px stroke**, round caps and joins, geometric, no fills.
  There are 41 icons, which covers every mockup.
- **No emoji anywhere in the UI.** If a child says an emoji in chat, it is shown as they typed it.
- The brand mark is an arch (Taxila's ancient gateway, abstracted) with a lime point. It works at 26 px.

### 3.4 Imagery

- **Generated, never stock. No text in images**, which matches the owner rule and the V2 image rule.
- Two kinds of image are allowed:
  1. **cinematic material renders** (glass geometry, a backlit leaf at macro scale) for heroes and science stages;
  2. **the teacher**.
- Mockup images: 4, generated on 2026-10-04 with the Azure `taxila-image25-flare` deployment at medium quality.
  These are the prototype's only external pixels. The prompts are listed in §16.
- **The teacher's look:** a stylised, painterly, semi-realistic adult in modern clothes (overshirt, hoodie), lit
  cinematically. For production, the stills are rendered from the shipping rig (V2 §8, "one teacher, one person").
  The mockup portraits are stand-ins for that rig.

### 3.5 Surfaces

- Cards: 1 px hairline border and a 20 px radius. On dark there is an inset top highlight (`rgba(255,255,255,.03)`).
- Film grain at 5% (`.grain`) on dark child screens. It gives depth without decoration.
- Glass (`--glass`, 72% plus 10-16 px blur) is used only for overlays on the stage (PiP label, parked card, HUD
  chips), so the artifact stays visible.

---

## 4. Motion system

Principle: **motion means something happened.** Every animation answers one of three questions:
- *what changed* (state);
- *where it went* (spatial continuity, e.g. a parked question flies into the Later tray);
- *what the idea is* (explanatory motion on the stage).

Decorative loops are banned (F1).

| token | ms | easing | used for |
|---|---|---|---|
| `--m-press` | 90 | `--e-std` cubic-bezier(.2,.8,.2,1) | press scale 0.97 |
| `--m-quick` | 160 | std | hover, toggles, chips |
| `--m-base` | 240 | std | cards in, sheet open, tab change |
| `--m-stage` | 420 | std | stage swaps (board → game), PiP move |
| `--m-cine` | 720 | std | explanatory reveals (a line drawn, a piece flipping into place) |
| exit | ×0.75 | `--e-exit` cubic-bezier(.4,0,1,1) | things leaving go faster than things arriving |
| spring | 500 | `--e-spring` cubic-bezier(.34,1.36,.64,1) | **only** for the child's own drop or release (a dragged point, the parked card landing) |

Rules:
1. **UI chrome settles. The stage performs.** Cinematic motion lives inside the stage: stroke-draw boards
   (`stroke-dashoffset`), morphs, camera moves, physics, all paced to the teacher's clause timing. The frame around it
   stays calm.
2. **The teacher's state is motion, not text.**
   - Speaking: a soft ion ring pulse on her tile or PiP, 1.4 s.
   - Listening: the ring off, and the child's waveform lit in volt.
   - Thinking: a cognitive glance (rig) and no spinner.
   - It maps 1:1 onto the floor-manager states in §5.3.
3. **Nothing new enters the stage while the child holds the floor** (duplex §2.5 WHEN_IDLE). A reveal waits for the
   next turn boundary. The only exception is an aid the child asked for, at the next TRP.
4. **Verdict motion is on the work.** A tick draws on the answer (240 ms) and the concept pays off (the area stays 20
   while the point slides). The face stays verdict-neutral (`design-v2-face-verdict-neutral`).
5. **The game is the exception, inside its slot:** particles, screen-flash on a hit or miss (380 ms, mint/amber
   tint, never red) and parallax stars. Game feel ("juice") is allowed *because* it is a real game (R3).
6. **Reduced motion** (OS setting): every animation becomes a ≤ 1 ms cross-fade. Draw-ons become instant. The game
   keeps working, because the motion *is* the game, but loses its particles.
7. **Budget:** transform/opacity only on chrome. The stage gets a 4× CPU-throttle check (LIVE-STUDIO G9).

---

## 5. The lesson screen (hands-free duplex)

### 5.1 Zones

```
PHONE (≤ 899 px, or narrow aspect)            WIDE (≥ 900 px and aspect ≥ 5:4)
┌──────────────────────────────┐              ┌──────────────────────────────────┬──────────────┐
│ ‖  Class 6 · Maths · Topic   …│ top 48-60    │ ‖ Class 6 · Maths · Topic       …│              │
│    WARM-UP LEARN TRY WRAP     │              ├──────────────────────────────────┤ teacher tile │
│ ┌──────────────────────[PiP]┐│              │                                  │ (330 px)     │
│ │ label          [teacher]  ││              │                                  │              │
│ │                           ││              │            STAGE                 │ transcript   │
│ │          STAGE            ││ stage =      │   (slot = stage − rail)          │ (live, last  │
│ │   (slot = stage − rail)   ││ remaining    │                                  │  4-6 lines)  │
│ │                           ││ height       │                                  │              │
│ ├───────────────────────────┤│              ├──────────────────────────────────┤ steer chips  │
│ │ HUD rail 62 px: your move ││              │ HUD rail 62 px                   │ dock         │
│ └───────────────────────────┘│              └──────────────────────────────────┴──────────────┘
│ YOU heard "…"                 │ transcript 2 lines
│ Ira: "…"                      │
│ [Show again][Slower][Another] │ steer (h-scroll)
│ (mic) ····· Speak anytime  [⌨]│ dock
└──────────────────────────────┘
```

Measured zone heights (§14 M3), at the floor phone 360 × 640 (`ds-layout-dp-budget`, never percentages):
- top 52 px, transcript 66-118 px, dock 108 px;
- the stage gets the rest: **362-414 px**, of which the artifact slot is **326 × 334-360 px**;
- the PiP is 68 px at the floor and 84 px above it.

### 5.2 What each zone does

- **Top bar.**
  - Pause (it pauses her and the stage; it does not end the lesson).
  - Subject marker, class and topic, ellipsised.
  - Phase strip WARM-UP · LEARN · TRY · WRAP in mono, current phase bold.
  - A menu with captions on/off, language, "type instead" and report-a-problem.
  - There is no close/X. Leaving is a conversation (§12.2) or the pause sheet.
- **Stage.** One artifact at a time (LIVE-STUDIO §4.1 #5). It shows a type label top-left: BOARD / ANIMATION / GAME /
  EXPLORABLE / IMAGE. Contract in §6.
- **Teacher.**
  - **Wide:** a large tile, which carries her presence and lip-sync. It shows a state tag (Talking / Listening /
    Watching / Thinking) as text plus the ring.
  - **Phone:** a PiP in the stage's reserved top-right zone. The PiP never covers artifact content, because the slot
    keeps clear of it (§6).
  - When a game is running she shows "Watching". She reacts to play at turn boundaries and never mid-manoeuvre.
- **Transcript.**
  - The child's line is prefixed `HEARD` in mono. This is the receipt from V2's "heard" state: it proves she
    listened (R5).
  - Her line is the caption of what she is saying, kept to ≤ 2 lines on phones.
  - Words she is saving for later are shown in ink-3.
  - The **question she asked is not lost**: while it stands it sits in the rail as the your-move cue. This keeps
    `design-v2-ask-pinned` and moves it into the stage rail.
- **Steer chips** (R8). These are what children actually say, as one-tap shortcuts that are *equivalent to saying
  them*. Context-dependent:
  - board: Show again · Slower · Another way · Hindi mein · Show me a diagram;
  - game: Restart · Slower · Harder · Explain it;
  - diversion: Later list · I have a question.
  Each chip sends the same intent as the spoken phrase. It does not open a menu.
- **Dock.**
  - A mute toggle (a privacy control, not push-to-talk).
  - A **mic state readout**: waveform plus a two-line status. Examples: "Speak anytime / She pauses for you",
    "Got it / Hands-free", "Speak anytime / Watching you play".
  - A keyboard button for typing. Typing is a first-class alternative (noisy homes, shy children).

### 5.3 Duplex states → what the screen shows

This follows `docs/research/duplex/ARCHITECTURE.md` §2.6 and the owner correction `owner-duplex-no-silence-gate-2026-10-04`
(continuous engine; silence is not the gate). The UI shows the floor. It never shows the machinery.

| floor state | teacher (tile/PiP) | mic readout | waveform | stage |
|---|---|---|---|---|
| T_SPEAKING | ion ring pulse, tag "Talking" | "Speak anytime · she pauses for you" | ion, animated with her audio | draws in sync with her clauses |
| T_YIELDING | ring fades; lean-in (rig) | same | ion settling | your-move cue fades in on the rail |
| C_WAITING | gaze on the child; tag "Listening" | "Your move" | idle grey | rail cue lit (volt, the screen's one volt) |
| C_SPEAKING | listening tilt; content-blind nods (rig) | "Listening" | **volt**, animated with the child's audio | frozen (no new content) |
| C_PAUSED / C_HOLD_REQUESTED | "still with you" pose | "Take your time" (after a hold request only) | volt, low | frozen |
| COMMITTED → thinking | cognitive glance; tag "Thinking" | "Got it" | settles | nothing (no spinner, ever) |
| OVERLAP (barge-in) | ring off immediately; upper face to listening | "Listening" | volt | frozen. Her caption stops at the last heard clause (`heardUpTo`) |
| SAFETY_ATTEND | calm, no expression change | unchanged | unchanged | non-safety reveals quarantined |

There is no "AI is thinking…" text and no dots animation. A child talking to a person does not see a progress bar.

---

## 6. The stage contract (every artifact fits, never overflows)

The product rule: **the stage owns the box, and the artifact adapts to it.** The child never scrolls, pinches or sees
a cropped label.

1. **One slot.** `.stage-slot` = the stage rect minus the HUD rail (`--rail: 62px`) when the artifact has HUD or
   your-move content. The slot is absolutely positioned. Artifacts mount into it and nothing else.
2. **Fixed design canvas, scaled to fit.**
   - Every artifact declares a canvas: SVG `viewBox`, or a canvas world size. Allowed aspects: 1000×1000, 1000×760,
     1000×625 or 1600×900.
   - It renders with `preserveAspectRatio="xMidYMid meet"`, or an equivalent fit transform for canvas and WebGL.
   - Letterbox bands take the stage background. They are never a different colour.
   - **No artifact ever sets `overflow: auto/scroll`.**
3. **Safe zones inside the canvas.**
   - Top-left 18% × 12% for the type label.
   - Top-right square, 26% of the slot's short side, for the phone PiP.
   - Nothing interactive or labelled may sit in those zones.
   - The QA gate checks the bounding boxes of all `text` and interactive nodes against them.
4. **Minimum sizes in canvas units, sized for the floor slot (326 px wide).**
   - Labels ≥ **38 units** per 1000 of canvas width (≥ 12.4 px rendered at the floor).
   - Primary values ≥ 48 units.
   - Strokes ≥ 4 units.
   - Interactive targets ≥ 130 units (≥ 42 px at the floor).
   - Measured after this spec's fix: smallest board label 16 px glyph box at 360 × 640 (§14 M4). Before the fix it was
     10 px, the only violation found.
5. **The rail is reserved.** The your-move cue, readouts (AREA 20 cm²) and the game HUD live in the rail. The game
   world never draws under it. Coach-marks ("Drag to steer") are transient: they leave on first input or after
   2.6 s, whichever comes first, so they never sit over live play.
6. **Text overflow inside the canvas is a build failure, not a runtime behaviour.**
   - The Studio gate (LIVE-STUDIO §3.6) renders each artifact at the 3 contract viewports.
   - It fails the build if any `text` or interactive node's box leaves the canvas or enters a safe zone, or if any
     label is under the minimum.
   - A failed build never reaches the child (R9). The fallback ladder steps down silently.
7. **Orientation and resize.** The slot is a CSS size container (`container-type: size`). Artifacts re-fit on resize
   without reloading. Game state survives a rotation.
8. **One artifact at a time, with continuity.**
   - A swap is a 420 ms cross-fade with a 0.98 → 1 scale on the incoming piece.
   - The outgoing piece's last frame is held until the new one paints. There is never an empty stage.
9. **Zero visible failure** (R9, supersedes LIVE-STUDIO §4.2's visible caption).
   - The child never sees "{teacher} is making this", a skeleton label, a progress bar or an error card.
   - If a requested piece isn't ready, the teacher draws on the board (a real, always-available artifact) and the
     piece arrives at a later turn boundary if it passes the gate. If it never passes, it never existed.
   - Runtime error after reveal: freeze, then cross-fade to the board version of the same idea with the same values.
     She continues.

Verification: `v3check` (§14 M1) measures, for every lesson mockup at 360×640, 390×844, 768×1024, 1024×768 and
1440×900:
- document scroll;
- artifact nodes outside the slot or under the rail;
- SVG ink outside its viewport;
- dock visibility;
- transcript clipping;
- buttons < 36 px.

A production version of this belongs in `tests/visual`. This spec does not build it, because product code is owned by
Wave 2.

---

## 7. Copy tone

**The voice:** a sharp older cousin who happens to teach brilliantly. It is direct, warm, a little dry, never
performing enthusiasm. It respects their time and their intelligence (F5).

| rule | do | don't |
|---|---|---|
| Talk to a capable person | "4-minute proof, then you try to break it." | "Let's learn about triangles together! 🎉" |
| Verdicts are plain | "Got it." · "Look again: the height." | "Awesome job, superstar!!" · "Oops! Wrong answer 😢" |
| Praise the move, not the kid | "Your 6/8 vs 3/4 instinct was right before you could explain it." | "You're so smart!" |
| Give choices | "Your call." · "Break, or wrap up in two?" | "You must finish the lesson." |
| Explain why effort is asked | "Secure means you got it right again days later, without warning." | "Keep practising to earn stars!" |
| Admit limits | "Not my department." (warm decline) | pretending, or a lecture |
| No exclamation chains, no baby words | one "!" per screen at most, ideally none | "Yay!", "Oopsie", "Let's go, champ!" |
| Numbers as facts, never as scores | "2/2 new problems · 0 hints" | "+50 XP! Level up!" |
| Short | captions ≤ 2 lines on phone; buttons ≤ 3 words | paragraphs on child screens |

- **Language.** UI chrome is English, which keeps V2 §5.3. The teacher speaks the family's choice. Steer chips may be
  Hinglish ("Hindi mein") because they stand for the child's own words.
- **AI honesty.** Every screen that names the teacher says "AI teacher" at least once (tile label, onboarding note,
  parent safety card). This is the safety floor.
- **Recitation law.** The teacher lines in these mockups are **UI illustrations, not prompt text.** They must never
  be pasted into a persona or Director prompt. Sentence-shaped prompt text gets recited (inherited law; see
  `voice-prompt-labels-and-brackets`). Prompts get shapes, not these lines.

---

## 8. Onboarding (screen 01)

Target: from first open to warm-up in **≤ 90 s and ≤ 7 taps with defaults kept**. Taps were counted on the mockup.
The time is a target and has **not** been measured (§15 X3).

| step | what | design notes |
|---|---|---|
| 0 welcome | hero render, "A teacher who actually listens.", Get started / I'm a parent | the parent path skips to the parent setup |
| 1 level | class **4 / 5 / 6 / 7** (big mono numerals) + board segmented (CBSE / RBSE / ICSE / Other) | "She starts at your class level, then adjusts to how you actually do" (R2) |
| 2 you | name/nickname field + how she talks (English / Hinglish / Hindi) with a **live sample line** that updates with the name and language | the child hears and sees the register before committing |
| 3 teacher | two large portrait cards, a "Hear" button on each, selection tick; "Both are AI teachers, not real people. They'll always tell you that if you ask." | the CTA becomes "Choose Ira" / "Choose Kabir" |
| 4 schedule | **day toggles** (7 pills + a WEEKDAYS shortcut) · quick picks (After school 4:30 · Evening 6:00 · After dinner 8:30) · **time rail**: 15-minute slots from 6:00 AM to 9:45 PM, horizontally scrollable, centred on the selection, with ‹ › 15-min steppers and arrow keys · part-of-day label · **length** (15/20/30/45) · live summary: "Mon, Wed, Fri · 5:30 PM — 20 min · done by 5:50 PM · reminder 10 min before" | **no native `<input type=date/time>`**, which is what failed in R11 on Android WebView and desktop. Zero days selected disables Save and says "Pick at least one day". The range narrows to the parent's lesson hours once set. |
| 5 parent | "Parent is here" (hand over, 60 s) / "Send them a link" (WhatsApp or SMS; the child can start the warm-up meanwhile) / Do this later | the parent approves the account and limits. "They see what you learned — not a recording of every word." |
| 6 ready | "You're set, Aarav." + summary card (teacher, class, when) + "Start warm-up" | warm-up: "6 minutes so she knows where you are. No marks. No pass or fail." |

The warm-up is the placement. It is a real conversation with class-calibrated items, which answers R2 ("how many
sides are in a dice" must never happen in class 4+).

---

## 9. Home (screen 02)

Order, top to bottom:
1. Date and time in mono; a greeting by name ("Evening, Aarav.").
2. **Up next**: one large card.
   - Subject marker, class and UP NEXT.
   - A title phrased as the child's own question ("Why the triangle formula has a half").
   - The reason ("You asked this on Tuesday").
   - What's inside, as tags: BOARD · EXPLORABLE · GAME · ~18 MIN.
   - The teacher's face and **Start lesson** (the screen's one volt).
3. **Teacher note**: one line about the child's thinking, not their score.
4. **Made for you**: the games, animations and boards built for them, replayable.
5. **Parked questions**: their own questions with when each comes back.
6. **This week**: planned days and done days. Done days show a tick, no count. Missed days look the same as
   unplanned days. **Nothing to lose.**
7. **Subjects**: chapter + "3 of 6 skills secure".

Tab bar (phone): Home · Progress · Library · You. On wide screens it becomes a two-column layout with no tab bar.

---

## 10. Progress (screen 07)

- **Subject tabs**, then a **headline count with a definition**: "13 of 36 skills secure — Secure means you got it
  right again days later, without warning. Not just once."
- **The chapter map**: each chapter row has a node per skill. States are **shape-coded**:
  - filled = secure;
  - hatched = working on it;
  - outlined = met once;
  - dark = ahead;
  - an amber dot = check-in due.
  This is greyscale-safe, which keeps the `ds-status-carriers` intent. The current chapter is highlighted.
- **The hardest thing you cracked**, with the evidence.
- **Counts that are facts, not scores**: questions you asked, parked and coming up, lessons this month, things made for
  you. There are no totals of right answers and no percentages.
- **Then and now**: two dated lines comparing the child to their past self, never to peers.
- No leaderboard, no level and no XP. In-game numbers (HIT, COMBO, CLEAN) exist **only inside the game's HUD** and are
  never carried out or totalled. They are game state, not rewards. This narrows V2's "no counts" rule rather than
  breaking it.

---

## 11. Parent corner (screen 08)

The theme is Day, with the same tokens and a calmer density. Chrome is English. **Report language**: English or
Hindi (the mockup switches the headline).

1. **This week**: one capability sentence ("Aarav can now *explain why* a triangle's area is half its rectangle"),
   then 3 facts (lessons done, minutes inside limits, questions asked).
2. **Claims with evidence**, keeping V2's G-PARENT-1:
   - "Area of a triangle: secure" (tick);
   - "Still practising: leaning triangles" (magnifier).
   - Each has a **How do we know?** expander showing dated attempts, on their own or with a hint, and the child's own
     words.
3. **Try at home**: one 5-minute activity that needs no subject knowledge.
4. **Made for {child} this week**: each piece, and *why* it was made ("Because he said 6/8 and 3/4 'feel the same' but
   couldn't say why").
5. **Lesson times** with a **working reschedule**:
   - "Move" opens a 14-day date strip ("Today", then weekday + date) and a time grid.
   - Days that already have a lesson are disabled ("Already has a lesson").
   - Times that would run past the lesson-hours limit are disabled, and so are times already past today.
   - The summary reads "Mon 5 Oct · 5:30 PM · Aarav gets a heads-up". The moved row is highlighted.
   - There are no native pickers (R11).
6. **Limits**:
   - daily limit stepper (15-120 min; at the limit she wraps up warmly, she never cuts off);
   - lesson hours end stepper (this also re-validates the time grid);
   - open mic switch (lessons only; audio never stored);
   - a lesson reminder on the child's phone (off by default; neutral copy; never "she's waiting").
7. **What he was curious about**: learning questions only. Off-topic diversions (a game, a film) are **not** reported
   to parents. Teens' trust depends on the parent corner not being surveillance. Safety events go through the safety
   channel, not this list.
8. **Safety, plainly**:
   - an AI teacher that always says so;
   - no friend or romance role;
   - worrying statements get a calm response, Childline 1098 and Tele-MANAS 14416, and an immediate parent alert that
     never names the topic on the lock screen;
   - a transcript only on request, behind the PIN.

Phone: a tab bar (This week · Progress · Lessons · Controls). Wide: a sidebar with "Lock parent corner".

---

## 12. Designed hard moments

### 12.1 Diversion (screen 05, R6)

There are four scenarios, switchable with `?proto=1`. The switcher is labelled prototype-only.

| scenario | child says | she does | screen |
|---|---|---|---|
| **Park** | "btw did you see the new BGMI update? the map is insane" | notices it, names it warmly, parks it with a promise ("leaf first, then it's yours for two minutes at the end") | a parked card rises in the stage, then **flies into the Later tray** (pin chip, count). At wrap-up it returns with "Talk now · 2 min / Skip" (screen 06) |
| **Insists, in bounds** | "no but seriously, why do plants in my room grow towards the window?" | recognises it as on-curriculum and gives a quick detour now, with the full version scheduled | "Quick detour · in bounds" card (ion bolt) |
| **Out of bounds** | "tell me a scary story about a ghost instead" | declines warmly and wins attention back with something genuinely interesting from the lesson | "Not for lessons" card (amber shield), then the lesson continues |
| **"End the lesson"** (R7) | "can we just end the lesson? I'm so tired" | acknowledges it, checks in and offers a **3-min break** or **wrap up in 2**. Progress is saved exactly where they are. Parent limits decide the maximum. | "Your call · nothing lost" card with two buttons. This is the only volt on the screen. |

The routing (park / brief / decline / stop) belongs to the Teacher Brain. This screen only specifies how each outcome
*looks*. Safety-relevant content always takes the safety path, never the diversion path.

### 12.2 End of lesson (screen 06)

- A headline capability in the child's terms ("You can now **prove** why a triangle is half its rectangle"), with 3
  facts.
- **What you said at 4:12**: the child's own words quoted back as the proof ("That's the whole proof. In your words.").
- **How we know**: timestamped evidence rows. Tick rows are for things done. The magnifier row is "worth another
  look" and names *when* it comes back.
- **You parked this**: the promised minutes, as "Talk now · 2 min" (volt) or Skip.
- **Made today**: replayable pieces.
- **Next**: the date, time and topic.
- See progress / Done.

There is no celebration animation, no stars and no score.

### 12.3 Zero visible failure

See §6.9. The stage always holds a real artifact, the board being the floor. A child cannot tell a fallback from a
plan, because the fallback is a plan.

---

## 13. What V3 changes in V2 (and what it keeps)

| V2 | V3 | why |
|---|---|---|
| Two bands (Young 6-9 light / Older 10-15), Young as reference | **one band, 9-15**, reference age 12 | R1; launch classes are 4-7 |
| "Lamp and Paper, painted world" (gouache courtyard/rooftop) | dark instrument UI + cinematic generated material renders; no painted world | F4: painted scenes read as younger. The world is now the stage content |
| Marigold lamp `#FFB21E` as the single turn colour | **volt lime** as the single "your move" colour; the same one-colour law | marigold + paper read as "school"; volt reads as "game/pro". The law (one carrier, no near hues) is kept |
| The Desk: Teacher window / Question card / Work tray / Answer dock | Stage (with rail) + teacher tile/PiP + transcript + dock | duplex voice replaces the answer dock (R10). The ask lives in the rail cue |
| Literata reading serif | dropped on child screens | storybook connotation |
| Garden (6-9) / Sky map (10-15) | mastery map of chapters and skills | F12, F6 |
| Chapter seal ceremony ≤ 1,500 ms | no ceremony; the end card quotes the child's words | F1, F5 |
| "Nothing fails silently": nine designed trouble states shown to the child | **the child never sees a build or generation failure**. Network and mic trouble states remain (those are real-world facts the child must act on) | R9 |
| LIVE-STUDIO §4.2 "{teacher} is making this for you" caption + pencil skeleton | no caption; the skeleton is not shown as "in progress". The teacher draws on the board instead | R9 |
| Click / tap to talk | hands-free, the mic as a state readout, a mute switch for privacy | R10, R16 |

**Kept unchanged:**
- verdict-neutral face (`design-v2-face-verdict-neutral`);
- verdicts by shape before colour;
- English chrome;
- "How do we know?" evidence and G-PARENT-1;
- parent notifications rules (quiet hours, N3 safety);
- no app-icon badge;
- the dp budget at the 360 × 640 floor (`ds-layout-dp-budget`);
- one teacher record everywhere.

---

## 14. Measurements (this session, 2026-10-04)

All were run with Playwright Chromium on `file://` mockups. Google Fonts were routed through Node fetch because the
sandbox proxy breaks Chromium (docs/ops/W1-PROD-RESULTS-2026-10-04.md). The scripts are scratch files, not in the repo.

| id | what | n / method | result |
|---|---|---|---|
| M1 | layout + stage contract | 11 page states × 5 viewports (360×640, 390×844, 768×1024, 1024×768, 1440×900) = 55 renders. Horizontal scroll on all. On the 3 lesson screens (15 renders) also: document scroll, artifact nodes outside slot or under rail, SVG ink outside viewport, dock fully visible, transcript clipped, buttons < 36 px | **0 failures** in all 55 (h-scroll 0/55; lesson doc-scroll 0/15; artifact overflow 0/15; ink outside 0/10 SVG stages; dock hidden 0/15; transcript clipped 0/15; small hits 0/15); page errors 0/55 |
| M2 | token contrast (WCAG 2.x relative luminance) | 20 pairs computed | Night: ink 17.75, ink-2 8.99, ink-3 5.81 (5.17 on bg-2), ion 7.48, on-volt/volt 16.71, mint 11.06, amber 11.13, rose 7.14. Day: ink 17.49, ink-2 7.84, ink-3 5.76 (5.05 on bg-3), ion 6.32, rose 5.42, amber 4.76; mint was **4.36 (fail) → changed to `#0B7D55` = 5.15**; amber on its tint 4.28 is glyph-only (≥ 3:1 non-text) |
| M3 | lesson zone heights | 3 lesson screens × 3 viewports, `getBoundingClientRect` | 360×640: top 52, stage 362-414, slot 326 × 334-360, rail 62, transcript 66-118, dock 108, PiP 68. 390×844: stage 560-598, slot 356 × 515-558. 1440×900: stage 1064 × 824, teacher tile 330 px tall, transcript 328 |
| M4 | rendered stage label size | glyph-box heights of every SVG `text` on the board and animation stages, after the draw-on finished | board at 360×640 **before: 10-17 px (one 10 px label, i.e. ~8.5 px type) → after raising labels to 38/48 units: 16-19 px**; animation 15 px; at 1440×900 39-58 px |
| M5 | onboarding taps with defaults | counted on the mockup | 7 taps from open to "Start warm-up" (plus typing a name if not prefilled) |
| M6 | scripted interaction flows | 1 Playwright run at 390×844, 18 assertions: parent reschedule (open → Fri 9 → 6 PM → save; row updates, editor closes), clash day disabled, lesson hours to 6 PM disables 7 PM, limit stepper, Hindi report toggle, evidence expander; onboarding (zero days disables Save with "Pick at least one day", WEEKDAYS + one step → "Weekdays · 5:45 PM / done by 6:05 PM", carried to the ready card); 4 diversion scenarios render their card | 18/18 as expected, 0 page errors |

**Not measured:**
- whether children aged 9-15 actually find it cool or not babyish;
- onboarding time;
- comprehension of the shape-coded states;
- low-end phone frame rate for the game.

These are §15 experiments. Spend this session: **USD 0** on Azure. The 4 mockup images came from an earlier attempt
of this same task on 2026-10-04 (medium quality, `taxila-image25-flare`). Their exact usage was not recorded; at
list price they are estimated below USD 0.30.

---

## 15. Experiments that would confirm or overturn V3

| id | question | method | pass bar |
|---|---|---|---|
| X1 | Does it read as "for my age" across 9-15? | 5-second test plus forced choice (V3 screens vs V2 vs a kids' app) with n ≥ 24 children, split 9-11 / 12-15, with parental consent | ≥ 80% of each age half pick V3 as "for someone my age or older"; no age half below 70% |
| X2 | Do 9-year-olds cope with the dark instrument UI? | task success (start a lesson, find a parked question, move a lesson) with class-4 children, n ≥ 8 | ≥ 90% success unaided; if not, add Day theme as default for class 4 only (not a kids' theme) |
| X3 | Onboarding time | moderated, n ≥ 10 children + parents | median ≤ 90 s child path; scheduler errors 0 |
| X4 | Hands-free understanding | after a 10-min session: "When can you talk to her?" | ≥ 90% answer "any time" without seeing the mic readout first |
| X5 | Shape-coded mastery legibility | greyscale screenshot, "which skills are secure?" | ≥ 90% correct |
| X6 | Game feel on budget phones | ₹10k Android, 4× throttle, 5 min of Fraction Pilot | p95 frame ≤ 20 ms; no input lag > 100 ms |
| X7 | No-streak retention | A/B over 4 weeks: neutral weekly row vs a streak counter (internal only; decide before any launch) | the neutral row is within 5 pp on lessons/week; if the streak wins by more, the owner decides with the anxiety data, not the retention data alone |

---

## 16. Reversal conditions and proposed context entries

- **Dark default:** reverse to Day default if X1 or X2 fails for class 4-5. The fix would be a theme default, never a
  separate "kids" visual language.
- **Volt as the turn colour:** reverse if colour-blind testing shows volt confused with mint in the same state
  (CIEDE2000 < 12 under deuteranopia or protanopia), or if X4 shows the your-move cue is missed more than 10% of the
  time.
- **No in-UI reward counts outside games:** revisit only if X7 shows a > 5 pp loss *and* no anxiety signal in a
  parent and child survey.
- **Hiding off-topic diversions from parents:** reverse if parents in pilots (n ≥ 20) rate the corner as hiding
  something important. Safety events are never hidden either way.

Proposed graph entries are in `context/inbox/design-v3.json`, for the main loop to merge.

Mockup image prompts (the stand-in teacher portraits and stage renders; all say "no text, no letters, no watermark"):
- `teacher-ira`: head-and-shoulders portrait of a friendly Indian woman teacher in her late twenties, olive overshirt
  over black tee, premium stylised semi-realistic painting, cinematic rim light, dark indigo/teal studio;
- `teacher-kabir`: Indian man around thirty, glasses, charcoal hoodie, same style, indigo/lime light;
- `lesson-leaf`: macro cinematic render of a backlit leaf, veins and stomata texture, dark background;
- `hero-orbit`: glass prism, torus, sphere and cube on orbit lines, indigo and lime light, black ground (described from
  the image; its exact prompt was not kept in the earlier attempt's script).

---

## 17. Sources

- Nielsen Norman Group, *Teenager's UX: Designing for Teens* — https://www.nngroup.com/articles/usability-of-websites-for-teenagers/ ; report *UX Design for Teenagers (13-17)* — https://www.nngroup.com/reports/teenagers-on-the-web/
- bitskingdom, *UX for Gen Alpha Kids: Designing for Preteens* — https://bitskingdom.com/blog/ux-design-gen-alpha-preteens/
- ustwo, *Designing for Kids: UX Testing* — https://ustwo.com/blog/designing-for-kids-part-two/
- UXmatters, *Approaches to User Research When Designing for Children* — https://www.uxmatters.com/mt/archives/2011/03/approaches-to-user-research-when-designing-for-children.php
- Yeager, Dahl & Dweck (2018), *Why Interventions to Influence Adolescent Behavior Often Fail but Could Succeed* — https://doi.org/10.1177/1745691617722620 ; Scientific American summary — https://www.scientificamerican.com/article/adolescent-brains-are-wired-to-want-status-and-respect-thats-an-opportunity-for-teachers-and-parents/
- The Decision Lab, *Streak Creep* — https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification ; UX Magazine on streak design without shame — https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame ; Screenwise, *Duolingo streaks and anxiety in kids* — https://screenwiseapp.com/guides/duolingo-streaks-and-anxiety-in-kids ; *Engagement-prolonging designs teens encounter* — https://arxiv.org/pdf/2411.12083
- *Understanding Children's Avatar Making in Social Online Games* (CHI 2025) — https://arxiv.org/html/2502.18705
- Rive, *How Brilliant.org motivates learners with animations* — https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations ; screensdesign Brilliant teardown — https://screensdesign.com/showcase/brilliant-learn-by-doing
- Photomath app listing (animated steps) — https://apps.apple.com/us/app/photomath/id919087726 ; screensdesign Photomath teardown — https://screensdesign.com/showcase/photomath
- Khan Academy, mastery levels — https://support.khanacademy.org/hc/en-us/articles/5548760867853--How-do-Khan-Academy-s-Mastery-levels-work ; *skills to proficient* — https://blog.khanacademy.org/why-khan-academy-will-be-using-skills-to-proficient-to-measure-learning-outcomes/
- Riot Games, *Preview the future of VALORANT's interface* — https://playvalorant.com/en-us/news/game-updates/preview-the-future-of-valorant-s-interface/ ; Tandera, *Reimagining Valorant's UI* — https://giotandera.com/a-closer-look-reimagining-valorant
- The Rookies, *Clash Royale UX breakdown* — https://www.therookies.co/blog/education/game-design-ux-best-practices-detailed-breakdown-of-clash-royale
- Think with Google APAC, *Gen Z in India* — https://business.google.com/en-all/think/consumer-insights/gen-z-trends-search-behaviour-india/ ; TCS, *10 things about India's Gen Z* — https://www.tcs.com/who-we-are/newsroom/press-release/ten-things-to-know-about-india-generation-z
- Outlook Respawn, *Most downloaded mobile games in India 2025* — https://respawn.outlookindia.com/gaming/gaming-news/top-10-most-downloaded-mobile-games-in-india-in-2025 ; Wikipedia, *Battlegrounds Mobile India* — https://en.wikipedia.org/wiki/Battlegrounds_Mobile_India
- afaqs, *Is Zomato a copywriter's new copy chief?* — https://www.afaqs.com/news/advertising/is-zomato-a-copywriters-new-copy-chief ; CRED design case study — https://bootcamp.uxdesign.cc/from-good-design-to-a-great-salesmanship-cred-design-case-study-70c50478e27a
- Internal: `docs/design/OWNER-RESET-2026-10-04.md`, `docs/research/duplex/ARCHITECTURE.md` §2.4-2.6, `docs/design/superhuman/LIVE-STUDIO.md` §3.8, §4, `docs/design/PRODUCT-DESIGN-V2.md` §0, §3.10-3.12, `context/rejected.md` (`ds-rejected-percentage-layout`, `ds-rejected-chalk-mark-gold`, `design-v2-rejected-*`).
