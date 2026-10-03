# Direction: Child-First Wonder ("The Courtyard")

**Date:** 2026-10-03 · **Status:** one of the competing v2 product-design directions written for the owner's
2026-10-03 design directive (`context/decisions.md#owner-design-v2-directive`). It is a proposal, not a decision. It
is written to be built from: every screen, state, string, token and image it names is specified here.
**Angle:** a warm, playful, illustrated world in which the teacher stands at the centre of a living stage. The child
feels they are visiting a place and a person. Delight and visible progress bring them back, and the place carries no
reward economy.
**Reads (and does not repeat):** `docs/design/audit/AUDIT.md` (what is broken today, 25 ranked problems) ·
`docs/design/teacher/TEACHER-VISUAL.md` (the 3D teacher, rig, emotions, tiers, why not live video) ·
`docs/research/design/PRODUCT-DESIGN.md` (the v1 contract: dp budgets, four-state floor, ReactionGate, ledger,
parent PX rules) · `context/rejected.md` · `context/decisions.md`.
**Evidence tags:** [V] verified source · [X] computed here (`scratchpad/pal.py` hue and contrast figures are quoted
inline) · [I] design inference whose replacing measurement is named in §10 · [U] untested.
**Honest limits:** no child, parent, TalkBack user or budget phone has seen anything in this file. Every timing and
size is a starting value. The UI strings in this file are **UI copy**. They must never be pasted into `compile()`,
a persona or any prompt (repo law: anything sentence-shaped in a prompt gets recited).

---

## 0. The direction on one page

1. **Taxila is a place.** The child does not open an app. They walk into a sunlit **Courtyard** (ages 6-9) or up
   onto a **Rooftop** at dusk (ages 10-15). Their teacher lives there. Every child screen is a location in that one
   painted world: the gate (who is learning), the courtyard (home), the veranda classroom (lesson), the practice
   slate, the garden or the sky (progress), the notebook shelf. Nothing is a bare list on a bare background.
2. **She is the centre of the stage, and she is always the same person.** One chosen teacher (Asha or Arjun at
   launch) appears, with the same face, name and pronoun, on the landing page, in onboarding, on the gate, at home,
   in every lesson, on the summary, in the parent corner and in the WhatsApp report. The lesson face is the 3D S3h
   character from TEACHER-VISUAL in every tier that can run it, and the D plate rendered from that same rig
   elsewhere. The 2D clip-art face is retired everywhere.
3. **"Lights down" means the lesson has started.** Entering a lesson dims the courtyard to a deep-blue evening
   veranda in 300 ms, and she stands in a warm pool of light. This makes the marigold YOUR TURN ring the only hot
   colour on the screen (7.26:1 against the dusk [X]), and it tells a six-year-old with no words that this is now
   the lesson.
4. **The question never disappears.** When she hands the turn over, the caption line lifts into a pinned
   **Question Card** that carries her face and the question she just asked, word for word, from the same Director
   move that produced her voice and the board. It stays until the child answers. This fixes audit problems 1 and 6
   at the root.
5. **Whose turn is carried by six signals at once:** her body, a word you can see, the shape of the Talk button,
   a sound, a haptic tick and the Question Card. Colour is the seventh signal and is never needed. The words
   "Your turn", "Listening", "Thinking" and "Asha is talking" are visible at every age.
6. **Nothing fails silently, and no answer is ever lost.** Every answer goes to an outbox before it is sent. Every
   failure has her face, a plain English sentence, an action and a promise about the answer ("Your answer is
   saved").
7. **Wonder comes from the idea, not from a counter.** The delight is the roti tearing into halves, the frog landing
   on 14, the moon turning in her hands, her remembering what you made last week, and the garden that grows only
   because you learned something. There are no points, coins, streaks, badges or trophies. That rule is unchanged,
   and §6.7 says what replaces them.
8. **English chrome, her own voice.** Every label, button, heading and image is English and free of text. She
   speaks Hindi, English or Hinglish as the family chose, and the captions show exactly what she says.

---

## 1. Product principles

Each principle has the rule that enforces it and the audit problem it closes.

**P1. A person in a place.** Every child surface is a location in one illustrated world, and she is present in it,
or absent for a stated reason (resting, voice-only by choice).
- *Rule:* no child screen ships with a flat background or an empty container. Every empty state has an illustration
  and a sentence from the copy deck (§5.20).
- *Closes:* audit 5, 9 and 23 (empty boxes, the empty navy map, desktop as a stretched phone).

**P2. Whose turn is never a puzzle.** Exactly one floor state is shown at a time. It is carried redundantly, and
the question is pinned whenever it is the child's turn.
- *Rule:* gate WD-G1 (§3.9) renders every state in greyscale, at 3 m viewing distance and with audio off, and a
  child panel must name the state.
- *Closes:* audit 1, 2, 17 and 22.

**P3. Nothing on screen that she is not talking about.** Her voice, the board and the canvas come from one Director
move. If a lesson phase has no module, the canvas does not exist. She uses a big chalkboard instead.
- *Rule:* gate WD-G2 (ask parity, §3.9) and gate WD-G3 (no placeholder string reaches a child route, ever).
- *Closes:* audit 5 and 6.

**P4. Fail loud, recover warm.** Every failure is detected within 3 s and shown with her concerned-calm face, one
plain sentence, one action and the state of the child's answer. Recovery is automatic wherever it can be.
- *Rule:* gate WD-G4 (the chaos battery, §3.6).
- *Closes:* audit 3 and 18.

**P5. Wonder from the concept, never from the counter.** Delight is triggered by insight, effort and discovery
(Director tags `affect: insight | effort`, verified engine outcomes), and it plays as a concept-shaped payoff. Her
face never keys to a correct-answer count. Progress is the child's world growing from ledger facts and from
nothing else.
- *Rule:* the six motivation tests T1-T6 (PRODUCT-DESIGN §8.1) apply to every new mechanic in this direction, and
  §6.7 lists the replacements for badges.
- *Closes:* audit 12 and 13 (feedback exists, it is honest, and it is not a slot machine).

**P6. One teacher, one truth.** One character record (`shared/tutors.js`) is the only source for her name, pronoun,
look and voice on every surface. Parent and child choices (address register, interests, teacher) are honoured on
the first frame, or the surface does not render.
- *Rule:* gate WD-G5 (identity parity across 12 surfaces, §9).
- *Closes:* audit 4 and 7.

**P7. English chrome, her voice, no text in pixels.** UI strings are English only. Images contain no letters or
digits. Captions are whatever she actually said, in the script of the child's schooling.
- *Rule:* gate WD-G6 (no Devanagari code points in any chrome string table; OCR on every generated image returns
  nothing).
- *Closes:* audit 8.

---

## 2. User-flow map

### 2.1 The whole map

```
                 PARENT                                                   CHILD
 ┌──────────────────────────────────────┐
 │ Landing  /                           │
 │  hear Asha, hear Arjun · see a real  │
 │  lesson clip · promises · price      │
 └──────────────┬───────────────────────┘
                ▼
 ┌──────────────────────────────────────┐
 │ Setup (parent, about 3 min)          │
 │ S1 Language they speak at home       │
 │ S2 Meet the teachers (both, 10 s)    │
 │ S3 Our promises (before any ask)     │
 │ S4 Hold to continue (adult gate)     │
 │ S5 Phone + code (WhatsApp)           │
 │ S6 Permissions (unbundled)           │
 │ S7 Your child (name, class, board,   │
 │    likes, needs)                     │
 │ S8 Safe settings (PIN, time, hours)  │
 │ S9 Hand over: Now | Later            │──── Now ───────────────────┐
 └──────────────┬───────────────────────┘                            ▼
                │ Later                              ┌──────────────────────────────┐
                ▼                                    │ The Gate /who                │
 ┌──────────────────────────────────────┐            │ (picture profiles, her wave) │
 │ Parent corner /parent  (PIN)         │◄─ door ────┤                              │
 │ Home · Progress · Lessons · More     │            └──────┬───────────────────────┘
 └──────────────┬───────────────────────┘                   │ first time        │ returning
                │                                           ▼                   ▼
 ┌──────────────┴───────────────────────┐   ┌───────────────────────┐  ┌──────────────────────┐
 │ WhatsApp: weekly report, milestone   │   │ First visit (C1-C7)   │  │ Courtyard / Rooftop  │
 │ (≤1/wk), safety, account, payment    │   │ hello → who sees →    │─►│ home: ONE next thing │
 └──────────────────────────────────────┘   │ pick teacher → likes  │  └──┬──┬──┬──┬──┬──────┘
                                            │ → first puzzle → show │     │  │  │  │  │
                                            └───────────────────────┘     │  │  │  │  └─ Me
                                                     ┌────────────────────┘  │  │  └──── Notebook
                                                     ▼                       │  └─────── Garden / Sky
                                            ┌─────────────────────┐          └────────── Practice slate
                                            │ Lesson (veranda)    │          (Older: + Ask a question)
                                            │ arrive · warm-up ·  │
                                            │ goal+guess · learn ·│
                                            │ try · teach back ·  │
                                            │ wrap                │
                                            └─────────┬───────────┘
                                                      ▼
                                            home in "done" state (no ring) or the Gate if a sibling exists
```

### 2.2 Parent first run (Setup, S1-S9)

The order changes from today's P0-P8: the promises come **before** the account (audit 24), language is asked **once**
(audit 24), and the parent does not choose the teacher. The child does, at C3 (`avatar-tutor-selection`).

| step | the parent's question | what they do | exit | edge cases |
|---|---|---|---|---|
| S1 Language | "Will she speak our language?" | taps Hindi, Hinglish or English. Each tile plays 3 s of the teacher speaking that mix | Continue enables on pick. The disabled button says why: "Pick one to continue" | audio blocked: each tile shows a speaker button. Silent mode: captions show under the tile |
| S2 Meet the teachers | "Who is this?" | sees Asha and Arjun side by side (hero stills of the 3D rig), taps either to hear 10 s. The first sentence says she is an AI teacher | "Next". No auto-advance | a toddler mashing the screen cannot commit anything here |
| S3 Our promises | "Can I trust this?" | reads 3 promises, each with a speaker button: no sales calls, no loans or EMI, delete anything any time. "Read the full promise" opens `/trust` | "I'm ready" | none |
| S4 Hold to continue | adult gate | holds a 2 s ring. Copy and duration agree. A haptic tick at the start and end | releases at 2 s | motor need: "Can't hold? Answer a question instead" opens a 3-digit sum gate |
| S5 Phone + code | identity for reports | +91 number, then a 6-digit code (manual entry first, WhatsApp/SMS autofill as help, resend at 20 s, "Send to another phone") | auto-continues on a valid code | wrong code: the field says "That code didn't match. Check the latest message." The code expired: "That code has expired. We sent a new one." Network down: the step stays and retries on reconnect, with typed digits kept |
| S6 Permissions | what is kept | up to 5 rows, nothing preselected, each with a speaker. "Lessons" is required and says so | "Continue" stays disabled until every row has an answer. The bar above the button says how many rows are left: "2 more to answer" | none |
| S7 Your child | profile | name (with a "Hear it" preview), class tiles 1-9, board, school medium, likes (pictures), optional "Bigger text or a calmer screen", optional "Hard to hear" | "Next" | the step opens scrolled to the top (audit 11). A second child starts here |
| S8 Safe settings | safety | set a 4-digit parent PIN on a full-screen keypad with no footer, then confirm the prefilled time per day and hours | "Looks good" sits above the keypad only after the PIN is set (audit 19) | the PIN mismatch says "Those didn't match. Try again." |
| S9 Hand over | now or later | two equal tiles: "Start now with {name}" and "Later" | Now → the Gate with the child's tile lit. Later → the parent corner | Later never skips the child's first visit: C1-C7 runs the first time the child opens their tile (audit 16) |

### 2.3 Child first visit (C1-C7)

| step | Young (6-9) | Older (10-15) | why |
|---|---|---|---|
| C1 Hello | the courtyard gate opens (1.2 s cinematic), and the welcome clip says the child's name (cached TTS ≤ 1 s from the tap). The child picks their own profile picture from 3 painted animals (no text) | the rooftop door opens. The welcome clip uses the name. No profile picture step: they pick a colour badge for their tile | the first sound is hers, in the first second (audit 16) |
| C2 Who I am, who sees | she says she is an AI teacher, a computer program, and that a grown-up at home can see what they learn. The screen shows two icon cards: computer-teacher and eye-with-grown-up. "Hear again" replays | the same in plain text and voice, plus "What your parent can see" as a link | fixed reviewed copy, never improvised |
| C3 Pick your teacher | two live faces side by side (B+ tier warmed), each says a 3 s hello on tap. Order is shuffled and nothing is preselected. "Pick for me" picks at random | 2-4 faces with one style line each | `avatar-tutor-selection` |
| C4 How should she talk to you? | two buttons, "Friendly" and "Respectful". Each has a speaker, and tapping it plays her greeting both ways. The parent's choice is preselected and labelled "Your grown-up picked this" | the same, and the child's choice wins | it fixes audit 7 without Hindi words in chrome |
| C5 What do you like? | 6 picture tiles, with the parent's picks already lit (audit 7). She says each one on tap | 6 tiles and "Something else" (say it or type it) | |
| C6 First puzzle | the placement as a story (one class below, picture-first, ends on a real win), with her live | honest framing: "Let's find what you already know, so I don't waste your time. Nobody sees a score." | PRODUCT-DESIGN §2.4 C4-C5 |
| C7 Show someone | "Show a grown-up what you did?" with "Show" and "Not now" | skipped unless chosen | never recorded as not shown |

C7 leads straight into the courtyard home in the `done` state. **There is no second "touch to start" gate**
(audit 10): the tap on the profile tile unlocks audio for the whole session, and every later lesson starts with her
first sound ≤ 1 s after the child taps "Start".

### 2.4 The daily loop

```
open app → the Gate (her wave clip, profile tiles)
   → tap own tile → [picture PIN if set] → Courtyard home
       her greeting clip (≤ 6 words, says the child's name, never mentions time away)
       ONE ringed tile: "Today's lesson: {topic picture}"     ← set by the Conductor's plan only
       quiet tiles: Garden · Practice · Notebook   (Older: Continue · Ask · Practice · Sky · Notes)
   → Start → lights down → lesson (10-45 min by class)
   → Wrap: "What you did today" card (3 real things) → Finish
   → home in `done` state: no ring; today's artefact card sits in the lesson slot;
     the Garden thumbnail shows today's plant at its true stage
   → (sibling on the device) → the Gate
```

Rules carried from v1 and kept: no "one more" offer, no "come back tomorrow", no countdown, the child may ask for
another lesson by tapping her (PRODUCT-DESIGN §2.5.1(c)), and the server decides.

### 2.5 The lesson flow (phases and what the child sees)

| phase | geometry (§5.8) | the child's experience | signature moment |
|---|---|---|---|
| Arrive | Face | lights down; she turns to the child and says hello | the dim: courtyard → veranda in 300 ms |
| Warm-up | Teach or Board | 2-4 quick questions about earlier lessons; the first one cites something the child made | "Remember the shape you built on Tuesday?" (a shape of line, voiced by her; never a prompt line) |
| Goal + guess | Face + Choice | she says what they'll be able to do, then asks for one guess with 2-3 picture cards | the guess becomes a chalk chip that waits on the board |
| Learn | Work or Board | she teaches with the module or the board; she points with chalk marks | the guess resolves: chalk arrow from the guess to what happened |
| Try | Work | 3-8 items, hint ladder, concept payoffs | the payoff: the idea itself moves |
| Teach back | Duo (Young) / Explain panel (Older) | the child teaches the protégé or explains for a friend who missed class | the protégé gets it because of the child |
| Wrap | Close | one real success item; "What you did today" card; Finish | her re-voicing of the child's own words |

### 2.6 Practice (the Practice Slate)

Short sets of 4-8 items from the due queue or a chosen chapter. It works offline, and she is present as pre-rendered
clips on the D plate. It ends after the set with "That's the set." and a Finish button. There is no "one more",
no timer and no score. Each item still gets the honest feedback channel in §3.5.

### 2.7 Doubt ("Ask a question", ages 10-15)

```
Older home → "Ask a question" → choose source:
   [Type it] [Say it] [From my textbook → book → chapter → exercise]
 → her acknowledgement appears IMMEDIATELY on screen: the question echoed in a Question Card,
   "Got your question. Let's work on it." (fixes audit 10: the question never vanishes)
 → lights down → Work geometry with the problem on the board → she teaches toward the method
 → one similar problem the child solves alone → Wrap
```
Edge: the question is outside the syllabus or unsafe → she says what she can help with and offers the textbook
picker. Off-topic personal chat → one friendly redirect, then the textbook picker.

### 2.8 Map (Garden for 6-9, Sky for 10-15)

Opened from home. Young: a horizontal panorama of garden beds in the courtyard. Each bed is a chapter, drawn as a
picture of what the chapter is about. Each plant is a skill, and its stage carries the ledger state (§6.7). Tapping
a plant makes her say what the child can do and shows the thing they made. Older: the rooftop at night. Each
constellation is a chapter, each star a skill, and edges are real prerequisites. "Your class is here" marks the
school's chapter. A **List** toggle is always present and is the source of truth.

### 2.9 Milestones (what replaces rewards)

Only the five ledger milestones of PRODUCT-DESIGN §8.8 exist: Secure, first Secure ever, comeback, bridge crossed,
goal done (Older). Each plays **once**, inside the lesson in which it happened, as a change in the world (a fruit
appears, a star gains its ring), with her delighted face at constant intensity, ≤ 1.5 s, interruptible. The parent
may get one milestone message a week. Nothing is collected, counted or displayed in a case.

### 2.10 Parent corner

```
Parent door (top-right of the Gate and of home; small, dull) → PIN → Parent home
  Home      : {child} switcher · "This week" (one can-do + one still-tricky, each with "How do we know?")
              · "One thing to try at home" · "More"
  Progress  : chapters for the class → skills → state chip → evidence sheet
  Lessons   : list → lesson card (what they did, a quote, next check)
  More      : How {Teacher} teaches {child} · Monthly talk with {Teacher} · Controls · Family · Plan ·
              Data and privacy · Help
```
Entries that do not work yet are **not shown** (audit 20). The corner re-locks when the app goes to the background
or on a full reload. On re-lock it says "Locked to keep {child} out. Enter your PIN."

### 2.11 Notifications

| to | channel | what | cap | first line (lock-screen safe) |
|---|---|---|---|---|
| child | none | **No push notification ever reaches a child.** The app icon carries no badge | | |
| parent | WhatsApp utility template | weekly report | 1 / week | "{child}'s weekly report from Taxila is ready." |
| parent | WhatsApp | milestone (parent opted in, ≤ 1 / week, 08:00-20:00) | 1 / week | "Something {child} can now do." |
| parent | WhatsApp + in-app | safety (crisis, disclosure, moderation) | none | "Please open Taxila when you can. It's about {child}'s lesson today." |
| parent | WhatsApp | account security (new device, PIN reset, export, delete) | per event | "A change was made to your Taxila account." |
| parent | WhatsApp | payment (renewal 3 days ahead, failure) | per event | "Your Taxila plan renews on {date}." |
| never | | absence, "we miss you", streaks, "your teacher is waiting", offers | | |

Text bodies are English (directive). The weekly voice note is in the parent's chosen spoken language.

### 2.12 Edge-case flows

**No microphone (denied, broken, or the parent chose tap-and-type).** The lesson runs at full fidelity in tap mode
from the first turn. The Talk button becomes "Tap to answer" (finger glyph). Every item has a tap, keypad, build or
draw path (PD-G9). One quiet line on the first YOUR TURN ("No microphone, so we'll tap today") and never again in
that lesson. The parent card says "Answered by tapping today" as a plain fact. Asking for permission again lives
only in parent Controls.

**Poor network.** The voice ladder (PRODUCT-DESIGN §7.4) is kept. What the child sees at each rung is in §3.6.
The rule this direction adds: the face, the Question Card and the Talk button never freeze. The face rig is local,
the card is local, and the outbox is local.

**Child stuck (silent, or wrong twice).**
```
YOUR TURN begins (Talk button ringed, card pinned)
 +4 s   ring glow deepens; she does a small expectant lean (no words)
 +8 s   (Young; +12 s Older) she re-asks, narrower, in fewer words; the card updates to the narrower ask
 +15 s  (Young) answer tiles slide up; "Or tap one" appears under the Talk button
 wrong once → "Let's look again": her hint step appears on the board
 wrong twice → "Let's do it together": a worked step with her chalk; the child completes the last move
 still stuck → "Let's come back to this one." The item returns later through the scheduler; no mark is shown
 any time → tap her face (Young) or Hint (Older) = help, counted as help, never as a miss
```
She never says "you're stuck", never names the silence and never raises her voice.

**Child distressed.** The crisis predicate runs on every input path (PRODUCT-DESIGN §3.14). On a hit:
1. She stops teaching. Her face goes to the calm concern variant (smile 0, soft gaze), and she speaks the reviewed,
   pre-rendered safety clip.
2. The **Help sheet** rises over the stage: "You're not in trouble. Let's get help." It shows "Talk to a grown-up at
   home" (picture card), "Call Childline 1098" and "Call Tele-MANAS 14416" as big call buttons [re-verify the
   numbers at launch], and "Back to the lesson" in small type at the bottom.
3. The lesson pauses. The parent gets the safety alert (§2.11), unless the safeguarding branch suppresses it.
4. Nothing about it ever appears on the child's home, map or notebook.

Low-level frustration ("this is boring", "I can't do this") is not a crisis. She uses the gentle-concern face,
offers a choice (a break, an easier one, a different way), and logs it as a preference.

**Parent locked out.**
| situation | what happens |
|---|---|
| forgot the PIN | "Forgot PIN?" → a code to the guardian's number. If that number is on this same phone, the reset waits 24 h, and WhatsApp tells the guardian the reset was asked for ("A PIN reset was requested. If this wasn't you, reply STOP."). OTP autofill is off on the reset screen |
| 5 wrong PINs | "Too many tries. Wait 15 minutes, or reset your PIN." The guardian gets a WhatsApp notice. Child-facing copy, if the child is holding the phone: "This door is for grown-ups." |
| changed phone number | "Lost access to your number?" → help contact with the account email if one was given. Never an in-app override |
| two parents | the co-parent joins by a WhatsApp link with their own PIN; consent-grade actions stay with the owner |
| delete my account | must exist before launch (audit cleanup note: there is no endpoint today). Data and privacy → "Delete account" → explain → hold 2 s → code → done, with a receipt |

---
## 3. The signalling system

### 3.1 The vocabulary: one floor, one affect, one overlay

Three independent layers, so they never fight (this extends TEACHER-VISUAL §7.1 to the whole screen):

- **Floor** (whose turn; exactly one at a time): `arriving` · `speaking` · `yielding` · `your_turn` · `listening` ·
  `heard` · `thinking` · `showing`.
- **Affect** (how she feels; her face only, inside the TEACHER-VISUAL §7.3 matrix): warm · encouraging · curious ·
  focus · playful · surprised · delighted · concerned.
- **Overlay** (the lesson is not running normally; it suspends the floor): `paused` · `cant_hear` · `trouble` ·
  `recorded` · `help` · `resting`.

Two floor states are new against v1's four:
- **`heard`** (0-600 ms after the child commits): the receipt. The child must see that their answer arrived before
  anything else happens. Today a spoken answer gets no receipt at all, and a typed one gets a dashed bubble that
  looks like a failure (audit 3).
- **`showing`**: she is demonstrating in the module and the child should watch, not act. It is SPEAKING plus a
  canvas that holds attention, and it needs its own sign. Otherwise children tap the canvas and nothing happens.

`yielding` (her last 250 ms of speech on a hand-over turn) exists so that the face, card and button all change on
the **same frame** as her voice ends, not 400 ms later.

**State source (code alignment).** `src/lesson/status.ts` `statusOf()` today returns `your_turn` whenever nothing is
pending. It must return `thinking` unless the last teacher turn carried `ui.handover ≠ chain` (PRODUCT-DESIGN §3.9
already requires a `handoverPending` flag). Add `heard` (entered on `child_speech_end` or a typed or tap commit,
left on the first of `response_start` or +600 ms) and `showing` (entered on `ui.cues.program = demo`, left at
`teacher_audio_end`).

### 3.2 The master signal table

Every row is carried by at least five channels. "Word" is visible text under the Talk button at **every** band (the
audit's hidden `.tx-sr` words are the single cheapest fix in this file). `{T}` is the teacher's name.

| state | her face and body (3D rig; TEACHER-VISUAL §6-§8) | word (visible, 16 sp, `ink-2`) | Talk button (shape · glyph · fill) | Question Card | sound | haptic | motion (UI) | stage light |
|---|---|---|---|---|---|---|---|---|
| **arriving** | turns from the board to the child, warm smile, one breath in | none | hidden, slides in when she finishes | hidden | her first clip ≤ 1 s from the tap | none | lights-down dim 300 ms | dim from day to dusk |
| **speaking** | lip-sync on the playback clock, prosody nods, re-gaze 0.75 s after onset | "{T} is talking" | circle, 72 % size, `surface` fill, mouth-with-sound glyph, **tappable** (interrupts her) | **caption mode:** her current phrase, phrase-level, never word-lit karaoke on this lane (`karaoke-from-transcript-estimate` is rejected) | her voice | none | caption phrase cross-fades 150 ms per phrase; no flicker re-render | warm key on her |
| **showing** | gaze to the canvas, hand points, chalk mark draws on the part she names | "Watch" | same as speaking, plus an eye glyph | caption mode | her voice | none | canvas border gains a thin `chalk` hairline; nothing on the canvas looks tappable | a soft second pool on the canvas |
| **yielding** (last 250 ms) | final-rise head tilt, brows held 0.14, gaze locks on the child | changes to "Your turn" on her offset frame | starts its grow | starts its lift | none yet | none | | |
| **your_turn** | lean-in (pitch −3°, forward), stillness ×0.5, expectant held brow, gaze at the ringed element. No impatience ever | **"Your turn"** plus a mode line: "Say it, or tap" / "Tap one" / "Type it" | circle, 100 % size, **`turn` fill + 3 dp `turn-ring` outline**, mic glyph, glow 0.6 Hz. This is the one ringed element, unless the ring is on the tile group or the module, and then the button shows "Or say it" unringed | **lifts into Question mode:** her face thumbnail + the exact ask (`ui.ask`) + the answer-mode icon + ↻ "Hear it again". Pinned until commit | Young: the two-note turn earcon (E5 → A5, 180 ms). Older: off by default | one 20 ms tick | button scale 0.72 → 1.0, 240 ms, enter easing; card rises 4 dp with a 1 dp shadow | unchanged |
| **listening** | tilt 4°, attentive soft face, continuer nods on the child's pauses (≥ 300 ms pause after ≥ 0.7 s of speech, ≤ 1 per 3 s), never an approval smile or a frown | **"Listening… tap when you're done"** | circle, `listen` fill with a 2 dp `kolam` outline (the blue alone is 2.31:1 on dusk [X]; the outline is 12.05:1), **ear glyph, and a live level arc around it**, plus an end-of-speech ring that drains over 3 s (Young) / 2 s (Older) of silence | Question mode stays pinned | a 40 ms soft "open" click on the mic opening | 10 ms on open | level arc follows input with 60-80 ms smoothing | unchanged |
| **heard** (0-600 ms) | a small "got it" nod (one 2° nod, verdict-neutral, identical for every answer) | **"Got it"** | button collapses to a pill with a tick-in-a-speech-bubble glyph (this is a receipt, not a verdict) | the child's answer lands on the card under the ask: Older see the text (the "heard" line, tap to fix); Young see a speech-bubble chip with a sound wave (no text echo); typed and tap answers show what was entered | "received" earcon, a wooden tok (identical for every answer; A/B against none, M-ONB-6) | 10 ms | the answer chip flies from the button to the card, 240 ms | unchanged |
| **thinking** | forced `focus`: cognitive gaze aversion (up 45 % / side 35 % / down 20 %) at +0.3 s, lips lightly pressed; then a chalk-to-chin or board glance at +1.2 s; verdict-neutral, identical for right and wrong (I1) | **"Thinking"** | pill, `think` fill, three dots that breathe (not spin) | Question mode, with the child's answer, stays | none until +2.0 s (see §3.4) | none | dots breathe 1.2 s | unchanged |
| **paused** (overlay) | eyes soft, relaxed idle, idle loop stops after 5 s (WCAG 2.2.2) | sheet title **"Paused"** | disabled | hidden behind the sheet | a soft low chime | none | sheet up 240 ms | stage dims 20 % further |
| **cant_hear** (overlay) | gentle-concern face (calm variant), a small apologetic head tilt | **"I couldn't hear that"** | becomes **"Tap to answer"** (finger glyph, `surface` fill) and the answer tiles slide up | Question mode stays, with a small ear-slash glyph | her pre-rendered clip, once per lesson: a "let's tap this time" shape | 2 × 15 ms | tiles up 240 ms | unchanged |
| **trouble** (overlay; network or server) | gentle concern, then patient idle; never frozen, because the rig is local | **"Connection is slow"** → after 8 s **"Still trying… your answer is saved"** | becomes **"Try again"** (retry glyph, `surface-2` fill, `ink` glyph); auto-retry runs underneath | the child's answer stays on the card with a "Not sent yet" tag (clock glyph, `ink-2`), never deleted | her pre-rendered "connection" clip, once | 2 × 15 ms | a neutral veil over the canvas only, never over her face | unchanged |
| **recorded** (overlay; > 20 s offline) | D plate in her pre-rendered clips | "Practice without internet" | tap-only; the mic is hidden | items come from the pack | her clip explains once | none | | the lights stay down; a small cloud-slash badge in the top bar |
| **help** (overlay; crisis) | calm concern, smile 0 | sheet title **"Let's get help"** | hidden | hidden | the reviewed safety clip | none | sheet up 240 ms | stage dims |
| **resting** (home, outside hours or over the cap) | the "resting" still: she is reading under the neem tree | "{T} is resting now" | n/a | n/a | none | none | none | the courtyard is in late-afternoon light |

**The one-ring rule holds.** In `your_turn` exactly one element carries the marigold `turn` fill and ring: the Talk
button, the answer-tile group frame, the choice-card group or the module frame. The Question Card is never
marigold. It uses `jamun` for its ask glyph. Tested by PD-G2.

### 3.3 The Question Card: the one new component that fixes the most

```
 360 dp wide, Young, your_turn                       360 dp wide, Older, your_turn
┌──────────────────────────────────────┐           ┌──────────────────────────────────────┐
│ (face 48)  Ab batao, bada kaun hai?   │ 72 dp     │ (face 64) What is 7 × 8?           ↻ │ 80 dp
│  ↻ Hear it again          (mic)(tap)  │           │           heard: "fifty six"   [fix] │
└──────────────────────────────────────┘           └──────────────────────────────────────┘
```
- **Content.** The ask is `ui.ask`, a new required field on every Director turn whose `handover ≠ chain`. It is the
  written form of the question she just spoke, in the lesson's language and the child's school script, generated
  from **the same move** as her speech and the board cue. Gate WD-G2 (ask parity) runs on every turn in eval: the
  spoken reply must contain the ask's content tokens (numbers, named options, the key noun), otherwise the turn is
  re-rendered before audio is synthesised. The negative control is a reply that asks for 72,000 in words while
  the ask says numerals (the audit's real case).
- **Captions vs card.** It is one element with two modes, so the text region budget for Young (≤ 2 text regions,
  PD-G11) is unchanged. In `speaking` it shows her current phrase (caption mode). On `yielding` it switches to
  question mode and stays there through `listening`, `heard` and `thinking`, until her next turn's first audio frame.
- **For R0 non-readers.** The question line still shows (a grown-up may read it), but the ↻ button is 64 dp, and
  where the item has a picture (`ui.ask.picture`), the picture leads the line.
- **Hear it again.** One tap replays her question audio from the client buffer (the exact clip, instant, offline).
  A second tap within 10 s asks for the slower, simpler version (a REPEAT-SLOW move, PRODUCT-DESIGN §3.11).
- **Her face on the card.** A 48 dp (Young) / 64 dp (Older) live crop of the same 3D render (a second camera on the
  same scene; no second rig) in the card's left slot. On the D plate it is the plate crop. The child sees who is
  asking. For Older in Work geometry this is her *only* on-screen presence, which removes the PiP that covers the
  module today (audit 5).

### 3.4 Latency masking: the 2-3 s while she thinks

The measured turn path today is about 1.4-3.8 s from the child's commit to her first audio (Director median 1,422 ms
single-draft; DS41 cascade median 3,783 ms, both in `context/rejected.md`). A silent, frozen 3 s reads as broken to
a 7-year-old. The rule: **something true happens at every beat, and nothing fakes a verdict.**

| time after commit | what the child sees and hears | what is real behind it |
|---|---|---|
| 0-100 ms | Talk button collapses to the "Got it" pill; 10 ms haptic; the answer chip starts its flight to the card | local pointer-up or end-of-speech; the answer enters the outbox (§3.6) |
| 100-300 ms | her one verdict-neutral "got it" nod; the received tok | local |
| 300 ms | "Thinking"; she looks up and away (cognitive gaze aversion) | the turn POST is in flight |
| 600 ms | the answer chip settles on the card (Older: the "heard" text line; tap to fix) | ASR final arrives in this window on the cascade lane |
| 1.2 s | she glances at the board, and **the child's answer is chalked onto the board** (write-on 400 ms): the number they said, the tile they picked, the shape they built | real: it is the child's own answer, placed where the next turn will talk about it. It works for right and wrong alike |
| 2.0 s | if no audio has started: one short **pre-rendered acknowledgement** in her voice (a breathy "hmm", "okay", "accha" family; 300-600 ms; a bank of 12 per language per character, rendered once with the live TTS voice) | budgeted: ≤ 1 per 3 turns, never two in a row, never on a crisis-predicate turn, and identical in distribution after right and wrong answers (a test, not a hope: WD-G7) |
| 4.0 s | Young: her "one moment" hand + the word "One moment"; Older: "Thinking… 4 s" | PRODUCT-DESIGN §3.12 |
| 8.0 s | the `trouble` overlay (§3.2); the item switches to tap tiles from the pack | the link supervisor |
| 20 s | `recorded` mode | voice ladder bottom rung |

Banned during the wait: a spinner, a progress bar, a "loading" word, a smile or frown that previews the verdict,
filler that says anything evaluative ("good", "hmm, not quite"), and any filler line in a prompt (the
acknowledgement clips are audio assets chosen by the client, never text the model sees).

### 3.5 Feedback: right, wrong, "I know it", hint

The audit found no feedback channel at all (problem 13). ReactionGate (PRODUCT-DESIGN §3.5) still holds: **her face
never keys to correctness.** The verdict therefore needs a channel that is not her face. That channel is the board,
the card and the concept itself:

| outcome (from the verified key; a model never grades) | board / card | the concept payoff | her words | sound | never |
|---|---|---|---|---|---|
| **right** | a hand-drawn chalk tick appears beside the child's chalked answer on the board (white chalk shape; the card's answer chip gains the same tick) | the engine plays its payoff once, 600-1200 ms: the frog lands on 14, the fraction bar snaps into halves, the circuit bulb lights | specific: names the step or strategy ("you counted on from the bigger number" shape) | Young: the payoff sound (concept-shaped, ≤ 600 ms); Older: off by default | a star, a "+1", a score, confetti, a sound keyed to a streak |
| **wrong** | the child's chalked answer gets a dotted chalk underline (shape only, never red, never a cross) and the hint step appears next to it: "Let's look" | the engine shows what the child's answer **does**: the frog lands on 13, and the gap is visible | names what is sensible about the error, then the next rung | none | red, a buzzer, a cross, "wrong", a sad face, a head shake |
| **right after a struggle** (Director tags `affect: effort`) | as right | as right | specific about the effort | as right | delight more than once per 5 turns |
| **insight** (self-correction, new strategy, caught her planted mistake) | as right, plus a small chalk spark mark | as right | names the insight | as right | |
| **"I know it"** (Older chip) | the chip lights, and two quick items appear in sequence: "Two quick ones, then we move on." | | she acknowledges first, then asks (fixes the audit's silent jump to practice) | | a silent skip |
| **hint** (child asks, or the ladder) | the hint draws on the board as one visible step, numbered by chalk dots (1, 2, 3 dots: shape, not digits) | | the rung's words | none | a hint count shown to the child |
| **covert check** (a why-probe, a planted mistake, the guess) | no tick and no underline until the resolution turn | | the resolution turn always runs | | any verdict before the resolution |

Her face after any commit runs the same warm-attentive program. The only affect that may differ is the Director's
`insight | effort` delight, which is about the child's thinking, not about being right.

### 3.6 Errors and recovery

**The outbox.** Every child answer (spoken transcript, typed text, tap, module build) is written to an IndexedDB
outbox with the lesson uuid and turn id **before** it is sent. It is removed only when the server acknowledges the
turn. On failure: auto-retry at 1 s, 3 s and 6 s, then the `trouble` state with "Try again". On reconnect the
outbox flushes in order, and the lesson resumes at that turn. Evidence from a retried turn is marked as such. This
directly fixes audit 3 ("the answer is lost").

| condition | detected by | what the child sees and hears | the action offered | what happens to the answer | parent sees |
|---|---|---|---|---|---|
| turn POST fails or times out (> 8 s) | runtime watchdog | `trouble`: "Connection is slow", then "Still trying… your answer is saved" | "Try again" (and auto-retry) | kept in the outbox, sent on reconnect | "Connection dropped twice; the lesson continued" on the lesson card |
| offline > 20 s | link supervisor | `recorded`: "Practice without internet", her pack clips, tap tiles | Continue practising · Stop for now | queued, synced later | the lesson card, after sync |
| speech recognition channel unavailable (today's silent push-to-talk fallback) | cascade link | `cant_hear` once: "I couldn't hear that." The tiles come up, and the Talk button becomes "Tap to answer" for the rest of the item; the mic returns at the next item if the channel recovers | Tap to answer | the tap is the answer | "Answered by tapping today because listening had trouble" |
| ASR low confidence (< `ASR_MIN`) | grader gate | she asks once, narrower ("say just the number" shape). A second miss → tiles | Tap to answer | not graded (no evidence on a low-confidence turn) | nothing |
| microphone permission denied | `getUserMedia` | no nag: full tap mode, one line on the first turn | none | n/a | Controls shows "Microphone is off" with a fix link |
| no sound (volume 0, output dead) | output level probe | a big speaker picture (no numbers) and the captions switch on: "Turn the sound up, or read along" | "I can hear now" | n/a | nothing |
| web audio locked (autoplay) | `AudioContext.state` | never a second gate: the profile tap unlocks audio. If it is still locked, one big "Tap to hear {T}" with her face | Tap | n/a | nothing |
| the 3D face loses its GL context or the device runs hot | tier governor (`src/avatar/tier.ts`) | the face cross-fades to the D plate rendered from the same rig in 300 ms; nothing else changes; no message | none | n/a | nothing (logged; the reason text in `tier.ts` must name the real signal, a defect noted in TEACHER-VISUAL) |
| server error on lesson start | API | the courtyard stays lit; she says one clip ("let's try that again" shape) and the Start tile comes back with "Try again" | Try again | n/a | nothing unless repeated |
| session expired (token TTL) | 401 | "Let's sign in again": back to the Gate with the child's tile selected | the tile | the outbox is kept and sent after the new token | nothing |
| a parent-side form error | API | **field-level**, next to the field, in sentences: "Enter your phone number." "The PIN needs 4 digits." Never a raw API string (audit 18) | | | |

### 3.7 Progress signalling

| where | what the child sees | what drives it | banned |
|---|---|---|---|
| inside a lesson (Young) | the goal chip on the board ("today: halves", as a picture); the board fills with the chips of what they built today; she says where we are when the child taps the goal chip | Director phase | stepping stones, fills, counts, "3 of 5" |
| inside a lesson (Older) | the phase word in the top bar: "Warm-up", "Learn", "Try", "Explain", "Wrap", next to the topic name | Director phase | a bar or a percentage |
| the wrap | **"What you did today"**: three real things from the turn log, each a picture or a quote of the child's own words: "You built 3/4 with strips", "You explained why 0.5 = 1/2", "You caught my mistake". Never a score | ledger events of this lesson | "You got 7/10", time spent |
| home, `done` | today's artefact card in the lesson slot; the Garden or Sky thumbnail shows today's plant or star at its true stage | ledger fold | a "new" dot, a glow, a counter |
| Garden / Sky | plants and stars by stage (§6.7); one seed bed ahead; "your class is here" | ledger | wilting, fading, empty-plot counts, dates |
| notebook | a page per idea the child taught, with their own picture or words | teach-back events | page counts, blank pages waiting |
| milestone | once, in the lesson, as a change in the world (§2.9) | ledger milestone | anything collected |
| parent | state chips (Not yet · Practising · Got it today · Secure), evidence sheets, lesson cards, the weekly report | ledger | verdicts that contradict their own evidence (audit 20: gate WD-G8) |

### 3.8 Turn-taking timing tokens

| token | B1 (6-7) | B2 (8-9) | B3 (10-12) | B4 (13-15) | basis |
|---|---|---|---|---|---|
| yield window | 250 ms | 250 ms | 250 ms | 250 ms | TEACHER-VISUAL §7 offset ≥ 250 ms |
| heard (receipt) hold | 600 ms | 600 ms | 400 ms | 400 ms | [I] |
| glow deepen / re-ask / tiles | 4 / 8 / 15 s | 4 / 10 / 15 s | 6 / 12 s / on request | same | PRODUCT-DESIGN §4.2 |
| end-of-speech ramp | 3 s | 3 s | 2 s | 2 s | `ds-mic-tap-default` |
| ack clip at | 2.0 s | 2.0 s | 2.0 s | 2.5 s | [I] WD-M3 |
| "one moment" | 4 s | 4 s | 4 s | 4 s | PRODUCT-DESIGN §3.12 |
| trouble | 8 s | 8 s | 8 s | 8 s | |
| recorded mode | 20 s | 20 s | 20 s | 20 s | |
| timing multiplier | ×1 / 1.5 / 2 (parent sets; adapts from the child's own latency) | | | | |

### 3.9 Signalling gates (each with a negative control)

| id | gate | negative control |
|---|---|---|
| WD-G1 | **State legibility.** Screenshots of all floor and overlay states × Young/Older × light conditions, in greyscale and with deuteranopia, protanopia and tritanopia simulation: each state differs from every other in at least two non-colour channels (glyph, word, shape). Child panel version in §10 | make `your_turn` and `listening` differ only in fill |
| WD-G2 | **Ask parity.** On every hand-over turn the spoken text contains the `ui.ask` content tokens, and the board cue's tokens are a subset of the ask's or the module's | an ask in numerals with speech asking in words |
| WD-G3 | **No placeholders.** No child-route render contains a string from the placeholder list ("coming soon", "jald aa rahi", "TODO", "not available") or an empty module frame | mount a module id that has no engine |
| WD-G4 | **Chaos battery.** Playwright on the real signed-in lesson: cut the network at each of 8 turn phases, kill ASR, deny the mic, mute output, lose the GL context, expire the token. Pass: a visible state within 3 s each time, and zero lost answers after reconnect | remove the outbox write |
| WD-G7 | **Verdict-neutral waiting.** Over 200 simulated turns, the distribution of ack clips, nod timing and thinking duration does not differ between right and wrong answers (χ² p > 0.2) | play the ack only after right answers |
| WD-G5 | **Identity parity.** On 12 surfaces (landing, S2, Gate, C3, home, lesson, Wrap, Garden, Me, parent header, lesson card, WhatsApp image) the name, pronoun, portrait source and signature colour all come from the same `shared/tutors.js` record for the child's teacher | hard-code "she" in a parent string while the child's teacher is Arjun |
| WD-G6 | **English chrome, text-free art.** No Devanagari code point (U+0900-U+097F) in any chrome string table or route title; OCR finds no text in any file under `public/assets/gen/` | add "Abhyaas" as a tile label; add a generated image with a signboard |
| WD-G8 | **Parent verdicts match evidence.** Every "Still tricky" or "can now" claim on Parent Home has a supporting evidence row (a miss or hinted attempt in 14 days, or (a)+(b) respectively) | the audit's case: "Still tricky" over a sheet whose only row is "Right · On their own" |

---

## 4. Information architecture and navigation

### 4.1 The world as the IA

```
PUBLIC (web)                  SETUP (parent, once)         CHILD (the world)                     PARENT CORNER (PIN)
/            Landing          /start/language   S1         /who            The Gate              /parent            Home
/trust       Our promises     /start/meet       S2         /c/:cid/hello   First visit C1-C7     /parent/:cid/progress  Progress
/privacy     Privacy          /start/promises   S3         /c/:cid         Courtyard | Rooftop   /parent/:cid/skill/:id Evidence sheet
/help        Help, helplines  /start/hold       S4         /c/:cid/lesson/:lid  The veranda      /parent/:cid/lessons   Lessons
/signin      Sign in          /start/phone      S5         /c/:cid/practice     Practice slate   /parent/:cid/lessons/:lid Lesson card
                              /start/permissions S6        /c/:cid/ask          Ask (10-15)      /parent/:cid/teaching  How {T} teaches {child}
                              /start/child      S7         /c/:cid/map          Garden | Sky     /parent/talk           Monthly talk
                              /start/safe       S8         /c/:cid/notebook     Notebook         /parent/controls       Controls
                              /start/handover   S9         /c/:cid/me           Me               /parent/family         Family
                                                           /c/:cid/teacher      My teacher       /parent/plan           Plan
                                                                                                 /parent/data           Data and privacy
                                                                                                 /parent/help           Help
```

Renames against today: `/doubt` → `/ask`, `/notes` → `/notebook`, `/parent/:cid/syllabus` → `/progress`,
`/parent/ptm` → `/parent/talk`. Old paths redirect.

### 4.2 Navigation rules

- **Young (6-9): one level deep.** Every child screen except the lesson has a large house button (64 dp) top-left
  that returns to the Courtyard. No back arrows, no hamburger, no tabs, no scrolling on the home or the stage. The
  Garden scrolls sideways with 64 dp arrow buttons as tap twins for the swipe.
- **Older (10-15): two levels deep.** Home is a study hub. A back arrow plus the topic name in the top bar.
  Vertical scrolling outside the stage is fine.
- **The lesson has no navigation**: house (with a leave check), pause and the "AI teacher" label. Leaving goes
  through the Leave check (§5.14).
- **The parent door** is a small, low-contrast grown-up silhouette (32 dp visual, 48 dp hit) at the top-right of
  the Gate and the home. It is labelled "Grown-ups" for screen readers and visible text on hover only on desktop.
  It is deliberately dull (Sesame "non-enticing" [V via kids-ux]).
- **Parent corner:** phone = bottom tabs (Home · Progress · Lessons · More), desktop = a 240 px left rail. A child
  switcher at the top of Home, one child at a time.
- **Deep links:** WhatsApp "Full report" → `/parent` behind the PIN (the web asks for a code).
- **Re-entry:** cold start → the Gate. More than 5 minutes in the background → the Gate. A lesson interrupted → the
  Resume card after the Gate.

### 4.3 Where "the teacher" is, per destination (summary; full staging in §8)

| destination | is she there? | as what |
|---|---|---|
| Landing | yes | hero stills and a 20 s rendered clip of both teachers |
| Setup S2 | yes | both hero stills, tap to hear |
| Gate | yes | a small waving clip of the last-used child's teacher, at the gate arch |
| Home | yes, the **top** of the screen (audit: she was below the fold) | live D plate or B+ face at the veranda door, greeting |
| Lesson | yes, centre stage | the 3D face, full staging |
| Practice | yes | D plate clips |
| Garden / Sky | yes, small, walking the garden or holding the telescope | an illustrated pose still rendered from the rig |
| Notebook | yes, small | rendered still |
| Me / My teacher | yes | live face in the picker |
| Parent corner | yes, named | a rendered portrait in the header and in "How {T} teaches {child}" |

---

## 5. Screen-by-screen specification

Conventions. **360** means a 360 × 640 phone (584 dp usable after the status and gesture bars; also the ~650 dp web
viewport). **1280** means a 1280 × 800 laptop (about 720 px of content height after browser chrome). Every dp column
below sums to its height. `{child}`, `{T}` (teacher name), `{they}` (the teacher's pronoun) are filled from the
records, never hard-coded. Copy in quotes is the exact English UI string.

### 5.1 Landing `/`

- **Purpose:** a parent hears the teachers, sees a real lesson and the parent view, reads the promises and the
  price, and starts. Trust before the ask.
- **360:** (1) **Hero, 0-560 dp** (the CTA is above the fold, audit 25): painted courtyard backdrop
  `bg/landing-courtyard`, the two teacher hero stills side by side at 160 dp, headline, two speaker buttons, the
  primary CTA. (2) "A lesson, 30 seconds": a rendered clip of a real lesson (screen capture of the v2 lesson with
  her live, captions on, muted until tapped). (3) "What you will see": a real parent evidence sheet, labelled
  "Example". (4) Price. (5) Promises. (6) Footer.
- **1280:** two-column hero (teachers and the speaker buttons on the left at 400 px, headline and CTA on the right),
  then sections in a 1040 px measure, with the lesson clip at 720 × 405.
- **Components:** `TeacherDuo`, `HearButton`, `LessonClip`, `SampleEvidence`, `PricePanel`, `PromiseRow`,
  `InstallCTA`.
- **Copy:** headline "A teacher who talks with your child." · sub "Asha and Arjun teach classes 1 to 9, out loud, in
  Hindi, English or Hinglish. They are AI teachers, and they say so." · buttons "Hear Asha", "Hear Arjun" ·
  primary CTA "Get started, it's free to try" (only if true at launch; otherwise "Get started") · secondary "Use in
  your browser" · section heads "See a real lesson" · "What you will see as a parent" · "Price" · "Our promises" ·
  promises "No sales calls. Ever." · "No loans, no EMI." · "Delete anything, any time." · footer "Help and
  helplines" · "Privacy" · "Our promises".
- **States:** audio blocked (buttons only, no autoplay) · offline (cached shell) · app installed (CTA "Open
  Taxila").
- **Removed:** the Devanagari state words, the Devanagari "Hindi" language tile and "Her face here is a drawing".

### 5.2 Setup S1-S9 `/start/*`

**Shared layout.** 360: top bar 56 (back, step dots, "Our promises" shield link) · content scroll · **footer 88**
holding one primary button, which never overlaps an input. When the keyboard or the PIN pad is open, the footer
hides and the primary action moves into the content. Each step opens at scroll top (`scrollTo(0,0)` on route
change; audit 11). 1280: a centred 520 px card on the painted courtyard backdrop, at 30 % saturation so it stays
calm. Errors appear next to their field, in sentences, with `aria-describedby`.

| step | 360 layout | copy (title · body · primary · other) | states |
|---|---|---|---|
| S1 Language | three 96 dp tiles stacked, each with a speaker and a 3 s clip | "Which language do you speak at home?" · "She'll speak the same way with your child. You can change this later." · tiles "Hindi", "Hinglish", "English" · "Continue" | disabled reason "Pick one to continue" |
| S2 Meet the teachers | two portrait cards 156 × 220 dp side by side, a name under each, tap to hear 10 s | "Meet the teachers" · "Your child will pick one. Both are AI teachers." · "Next" | while playing, the card's face is the rendered clip, not a still |
| S3 Our promises | 3 rows, icon + line + speaker | "Our promises, before you share anything" · rows as §5.1 · "Read the full promise" · "I'm ready" | |
| S4 Hold to continue | a 160 dp ring button, centred | "This part is for grown-ups" · "Press and hold for 2 seconds." · alt link "Can't hold? Answer a question instead" | holding: the ring fills and a tick lands at 2 s with a 20 ms haptic |
| S5 Phone + code | +91 field, then a 6-box code field | "Your phone number" · "We send reports on WhatsApp. No sales calls." · "Send code" · then "Enter the 6-digit code" · "Resend code (20 s)" · "Send to another phone" | errors per §3.6 |
| S6 Permissions | up to 5 cards; each has a sentence, a speaker and two equal buttons | "What Taxila may keep" · rows: "Lessons and what {child} learns (needed)" · "Remember learning across days" with "Yes" / "Only this session" · "Remember what {child} says they like" "Yes" / "No" · "Help improve Taxila (research)" "Yes" / "No" · "Send reports on" "WhatsApp" / "Only in the app" · "Continue" | the remaining count above the button: "2 more to answer" |
| S7 Your child | name + "Hear it", class 3 × 3 tiles, board chips, school-medium chips, likes picture grid, two optional toggles | "About your child" · labels "First name", "Class", "Board", "School teaches in", "Things they like", "Bigger text or a calmer screen", "Hard to hear" · "Next" | the name preview plays her voice saying the name with "That's right" / "Change it" |
| S8 Safe settings | the full-screen PIN pad first (no footer), then one card with the prefilled time and hours | "Set a parent PIN" · "4 digits. Your child shouldn't know it." · "Confirm PIN" · card "Lesson time each day: 30 minutes" "Lesson hours: 7:00 am to 8:30 pm" with "Change" · "Looks good" | the time card says "She never shows a countdown." |
| S9 Hand over | two equal 144 dp tiles | "Ready for {child}?" · "Start now with {child}" with "Hand the phone to {child}" · "Later" with "{child} can start from their picture" | on cellular: "The first lesson uses about {n} MB." |

### 5.3 The Gate `/who`

- **Purpose:** the right child on the right profile in under 2 s.
- **360:** painted courtyard gate `bg/gate-day` (Older-only household: `bg/gate-dusk`). The teacher of the last
  child waves from the arch (a 2 s rendered clip, then a still), 160 dp tall. Profile tiles below: each 120 dp
  (Young size if any Young child is in the house) with the child's painted animal or colour badge and their name.
  Parent door top-right.
- **1280:** the same scene wide (`bg/gate-day-wide`); tiles in a row of up to 4 at 160 dp.
- **Copy:** "Who's learning today?" · tile labels = names · parent door "Grown-ups".
- **States:** tap a tile → her voice says the child's name and the tile shows "That's me" / "Not me" (Sesame [V via
  kids-ux]); picture PIN for Young (3 pictures in order) or a 4-digit PIN for Older if set; 5 wrong tries → "Ask a
  grown-up to help." No counters, badges or progress on the tiles.

### 5.4 First visit C1-C7 `/c/:cid/hello`

One full-screen scene per step, no scroll, her live face (B+ or D) at the centre in Face geometry.
- C1: Young "Hi {child}! Pick your picture." with 3 painted animals (`avatar/child-*`), 112 dp each. Older: "Hi
  {child}. Pick a colour for your tile." with 6 swatches.
- C2: two 128 dp icon cards, "I'm a computer teacher" and "A grown-up at home can see what you learn", and "Hear
  again". Next button "Okay" (labelled, never an empty arrow, audit 17).
- C3: "Pick your teacher" with the live faces and "Pick for me".
- C4: "How should {T} talk to you?" with "Friendly" and "Respectful", each with a speaker that plays the greeting
  both ways. A small note under the parent's pick: "Your grown-up picked this."
- C5: "What do you like?" (Older: "What are you into?") with 6 picture tiles, the parent's picks lit, and Older
  "Something else".
- C6: the first puzzle, in lesson geometry, lights down.
- C7: "Show a grown-up what you did?" with "Show" and "Not now".
- **1280:** the same steps, with her on the left at 480 px and the choices on the right.

### 5.5 My teacher `/c/:cid/teacher`

Opened from Me. The live picker (`TutorPicker`) with 2-4 faces, the current one marked "Your teacher". "Switch to
{T2}" opens a confirm sheet: "{T2} will teach your next lesson. {T2} will know what you've learned." Switching is
allowed only between lessons. Parent policy may be "Ask a grown-up", which shows the parent door. **The picker shows
one consistent face per character** (the third face in today's picker is removed, audit 4).

### 5.6 Courtyard home (ages 6-9) `/c/:cid`

```
360 × 584 dp, Young, default state
┌──────────────────────────────────────┐
│ (me 48)                     (grown-ups)│ 56   top bar over the sky band
│ ┌────────────────────────────────────┐ │
│ │  painted courtyard, neem tree,     │ │
│ │  veranda door: {T} (live, 200 dp)  │ │ 240  she greets: "Hi {child}!" (≤ 6 words, her voice)
│ │  waves, then idles                 │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ (topic picture)  Today's lesson  ▶ │ │ 128  the ONE ringed tile (turn fill + ring)
│ └────────────────────────────────────┘ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ (garden) │ │ (slate)  │ │ (book)   │ │ 136  picture tiles, 104 dp, spoken on tap
│ │ Garden   │ │ Practice │ │ Notebook │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                        │ 24
└──────────────────────────────────────┘   56 + 240 + 128 + 136 + 24 = 584
```
- **1280:** the courtyard as a full-bleed painting (`bg/courtyard-day-wide`, 1920 × 1080 source). She stands at the
  veranda door at the left third (480 px tall). The lesson tile and the three tiles sit in a frosted `kolam` panel
  on the right third, 420 px wide. The garden beds are visible in the painting and are themselves tappable (they
  open the Garden).
- **Components:** `WorldBackdrop`, `TeacherAtDoor`, `LessonTile` (ringed), `PlaceTile` × 3, `ParentDoor`, `MeButton`.
- **States:**
  - *default:* as drawn; the lesson tile shows the topic picture from the plan.
  - *first lesson ever:* the same, and the lesson tile's subline reads "Our first lesson".
  - *done:* no ring anywhere; the lesson slot holds **today's artefact card** (a framed still of what the child made,
    label "What you made"; tap = her re-voice clip); the Garden tile thumbnail shows today's plant at its true stage.
  - *resting:* she is reading under the neem tree, late-afternoon light; the lesson slot reads "{T} is resting now"
    with no time; Practice is hidden if the cap is reached.
  - *offline:* the lesson tile becomes "Practice without internet" if a pack is ready; otherwise the tile reads
    "We need the internet for lessons" with a cloud-slash picture, and no ring.
  - *plan missing* (today's production 404): **never an empty tile.** The client falls back to `lesson/new`, which
    the server resolves to the next planned topic. If that fails too, the slot reads "Start a lesson" with her
    choose-a-topic sheet. This is a server bug to fix; the screen must survive it.
- **Copy:** "Today's lesson" · "Our first lesson" · "Garden" · "Practice" · "Notebook" · "What you made" · "{T} is
  resting now" · "Practice without internet" · "We need the internet for lessons".

### 5.7 Rooftop home (ages 10-15) `/c/:cid`

```
360 × 584 dp, Older, default
┌──────────────────────────────────────┐
│ Maths ▾                 (me)(grown-ups)│ 48   subject switcher
│ ┌────────────────────────────────────┐ │
│ │ rooftop at dusk, {T} by the        │ │ 176  her face B+ or D at 120 dp; one greeting line
│ │ telescope; "Your class is on:      │ │      under it in text: "Your class is on Fractions."
│ │ Fractions"                         │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Continue: Comparing fractions    ▶ │ │ 88   the ONE ringed row; tap → choose 1 of 3 topics
│ └────────────────────────────────────┘ │
│  Ask a question                      › │ 56
│  Quick practice                      › │ 56
│  My sky                              › │ 56
│  My notes                            › │ 56
│                                        │ 48
└──────────────────────────────────────┘   48 + 176 + 88 + 56 × 4 + 48 = 584
```
- **1280:** the rooftop painting full-bleed (`bg/rooftop-dusk-wide`). Left column 520 px: her face, the greeting
  and the Continue row. Right column 560 px: a live preview of My sky (the current constellation), plus the four
  rows.
- **States:** *done* (Continue loses its ring and reads "Next: {topic you picked}"); *resting*; *offline*; *test
  week* (Class 8-9 when set: a "Test week: revise Chapters 3-5" row, shown as a window, never a countdown).
- **Copy:** "Your class is on {chapter}." · "Continue: {topic}" · "Ask a question" · "Quick practice" · "My sky" · "My
  notes" · "Next: {topic}" · "Test week".

### 5.8 The lesson: the veranda `/c/:cid/lesson/:lid`

**Layers, back to front.** (1) The veranda backdrop, painted, **static**, in the lights-down palette (`bg/veranda-
dusk`, `bg/veranda-dusk-wide`). (2) Her stage: the 3D face in a warm light pool. (3) The **board** (the chalk
ledge, now a real painted chalkboard frame), which overlays the bottom of her stage in portrait. (4) The canvas
(module host), only when the phase has content. (5) The Question Card. (6) The Talk bar. (7) Overlays.

**Young (6-9) geometries at 584 / 744 dp.** The ledge row is the board.

| region | Face 584 / 744 | Face + Choice 584 / 744 | Board 584 / 744 | Work 584 / 744 | Duo 584 / 744 | Close 584 / 744 |
|---|---|---|---|---|---|---|
| top bar | 56 / 56 | 56 / 56 | 56 / 56 | 56 / 56 | 56 / 56 | 56 / 56 |
| her stage | 320 / 432 | 184 / 256 | 200 / 264 | 152* / 208 | 152* / 208 | 200 / 280 |
| board | 0 / 0 | 0 / 0 | 152 / 208 | (48 overlaid)* / 56 | (48 overlaid)* / 56 | 0 / 0 |
| Question Card | 104 / 128 | 72 / 80 | 72 / 80 | 72 / 80 | 72 / 80 | 0 / 0 |
| choices / canvas | 0 / 0 | 168 / 224 | 0 / 0 | 200 / 232 | 200 / 232 | wrap card 224 / 280 |
| Talk bar | 104 / 128 | 104 / 128 | 104 / 136 | 104 / 112 | 104 / 112 | 104 / 128 |
| **sum** | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 |

\* Below 680 dp the board overlays the bottom 48 dp of her stage (a board in front of her); her face zone is the
top 104 dp, above `stage.faceMin` 96.

- **Board geometry is new.** It is used whenever a Learn or Try phase has no module: she writes on a big board
  instead (numbers, pictures, the child's chalked answers). The canvas region does not exist in it, so there is no
  dead zone (audit 5). The Director declares the phase's content at the phase boundary, and the layout is picked
  then (geometry changes only at phase boundaries, `ds-layout-dp-budget`).
- **Face + Choice** is the Goal + guess phase: two 112 dp picture cards (B1) or three 96 dp cards (B2).

**Older (10-15) geometries at 584 / 744 dp.**

| region | Face 584 / 744 | Board 584 / 744 | Work 584 / 744 | Explain 584 / 744 | Close 584 / 744 |
|---|---|---|---|---|---|
| top bar | 48 / 48 | 48 / 48 | 48 / 48 | 48 / 48 | 48 / 48 |
| her stage | 312 / 424 | 168 / 224 | 0 (face lives in the card) | 120 / 160 | 200 / 280 |
| board | 0 / 0 | 168 / 240 | 48 / 56 | 48 / 56 | 0 / 0 |
| Question Card | 112 / 152 | 88 / 104 | 80 / 88 | 80 / 88 | 0 / 0 |
| canvas / explain panel | 0 / 0 | 0 / 0 | 296 / 424 | 176 / 272 | wrap card 224 / 296 |
| chips row | 48 / 56 | 48 / 56 | 48 / 56 | 48 / 56 | 48 / 56 |
| input row | 64 / 64 | 64 / 72 | 64 / 72 | 64 / 64 | 64 / 64 |
| **sum** | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 |

- In Work geometry her face is the 64 dp live crop on the left of the Question Card (§3.3), so nothing covers the
  module. "Face size" in Me can set Large (she keeps 120 dp in Work, the canvas shrinks to 176 / 304), Small (the
  default above) or Voice only (no face; her name and "AI teacher" in the top bar).
- **Keyboard open:** top 48 + card 72 (face chip 40) + canvas 152 + input 56 = 328 dp above a ~256 dp keyboard.
  Chips hide until the keyboard closes.

**1280 split (all bands).**
```
1280 × 720 content, Work geometry
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⌂  Comparing fractions · Try                                 Asha · AI teacher       (❚❚) │ 56
├──────────────────────────────┬─────────────────────────────────────────────────────────────┤
│                              │  board: [3/4] [2/3] [your guess: 3/4]                       │ 64
│   her stage 480 × 384        ├─────────────────────────────────────────────────────────────┤
│   (H or B+ tier; she turns   │                                                             │
│   three-quarters toward the  │   canvas 776 × 520 (module, or her big board in Board       │
│   canvas and points into it) │   geometry; tiles in its bottom band)                       │
├──────────────────────────────┤                                                             │
│ Question Card 480 × 136      │                                                             │
│ (face 64) Which is bigger?   │                                                             │
├──────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Talk zone 480 × 144          │  chips (Older): Hint · Show me why · I know it · More       │ 80
│ (mic 88) "Your turn"         │                                                             │
└──────────────────────────────┴─────────────────────────────────────────────────────────────┘
 left: 56 + 384 + 136 + 144 = 720       right: 56 + 64 + 520 + 80 = 720 (24 px gutters)
```
- In Face geometry the left column widens to 60 % and the canvas column holds the Question Card at 32 sp. The
  caption is never 15 px on desktop again (audit 23): the card is 24 sp minimum at 1280.
- Keyboard shortcuts as PRODUCT-DESIGN §3.4 (Space talk, 1-4 choose, Enter send, R hear again, H hint, Esc pause),
  with no single-key shortcut while a text field has focus.

**Top bar.** Young: house (64 dp hit) · goal chip (the topic picture; tap = she says where we are) · computer-teacher
badge · pause. Older: back/house · "{topic} · {phase word}" (truncated with the phase word kept; audit: "Numbers in
t…") · "{T} · AI teacher" as a **non-interactive** label (no pill border; audit 17) · pause.

**Talk bar (Young).** Left: "Tap instead" (finger glyph, 64 dp, label "Tap"). Centre: the Talk button (96 dp B1 /
88 dp B2) with its state word under it. Right: "Hear again" (ear-with-arrow glyph, 64 dp, label "Again"). Every
icon button has a visible one-word label (audit 17). **Older:** chips row "Hint" · "Show me why" · "I know it" ·
"More" (Explain differently · Slower · Skip for now); input row: text field "Type your answer" (min 160 dp wide, it
never shrinks below that, audit 17) · send (labelled "Send") · Talk button 64 dp · "Again".

**Canvas.** Exists only with content. While she speaks, it shows a small "Watch" eye badge and is inert; when it
holds the ring it gets the marigold frame and "Your turn". Tiles render inside it. No PiP ever sits on it.

**States of the screen** are the §3.2 table. **Copy:** all strings in §3.2 and §3.6, plus "Tap", "Again", "Hint",
"Show me why", "I know it", "More", "Explain it another way", "Slower, please", "Skip for now", "Type your answer",
"Send".

### 5.9 Wrap: "What you did today" (Close geometry)

- **Young 360:** her stage 200 (warm smile, the protégé beside her if it was a teach-back day) · wrap card 224:
  three rows, each a picture of the thing (module snapshot, the chalked answer, the protégé's notebook page) and a
  ≤ 6-word line in her voice on tap · Talk bar 104 with one big **"Finish"** button (a door-opening-to-courtyard
  glyph, not an exit door; audit 12).
- **Older 360:** the same card with text rows (≤ 12 words each), "Next time: {plain preview}", and "Finish".
- **1280:** her on the left, the card at 680 px on the right with larger pictures.
- **Copy:** title "What you did today" · row shapes from the turn log ("You built three quarters", "You explained
  why", "You found my mistake") · "Next time: {topic}" (Older) · "Finish" · Young before Finish: "Show a grown-up?"
  with "Show" / "Not now".
- **Rules:** rows come from ledger and turn-log facts only (lint PX1). Never a score, minutes, count or comparison.

### 5.10 Practice slate `/c/:cid/practice`

- **Young 360:** the same lesson Work geometry, but the backdrop is the **practice corner** (a painted slate on an
  easel in the courtyard, `bg/practice-slate`), the stage holds her D-plate clips, and the top bar adds a quiet
  "Practice" title.
- **Older 360:** Work geometry with the text-first item card.
- **1280:** split as the lesson.
- **Copy:** "Practice" · end "That's the set." · "Finish" · offline badge "No internet needed".
- **States:** offline (the default use) · item has no clip for an R0 reader → not shipped in the pack (pack lint).
  Removed: the fresh "Namaste {child}! Aaj hum…" intro every time (audit 9). Practice opens straight on item 1 with
  a ≤ 3-word clip.

### 5.11 Ask a question `/c/:cid/ask` (10-15)

- **360:** top bar "Ask a question" · three 88 dp source cards ("Type it", "Say it", "From my textbook") · after
  choosing, a full-width input or the book → chapter → exercise picker · "Ask {T}". On submit, the **Question Card
  appears immediately** with the child's question and "Got your question." Then lights down into Work geometry.
- **1280:** the three cards in a row; the picker as a two-pane list.
- **Copy:** "Ask a question" · "Type it" · "Say it" · "From my textbook" · "Which book?" · "Which chapter?" · "Which
  exercise?" · "Ask {T}" · "Got your question." · out-of-scope "{T} can help with your school subjects. Try your
  textbook?"
- **States:** empty input disables "Ask {T}" with the reason "Type your question first" · offline "Questions need
  the internet."

### 5.12 Garden (6-9) and Sky (10-15) `/c/:cid/map`

- **Garden 360:** a horizontal panorama of the courtyard garden (`bg/garden-panorama`, 3 × screen width). Each
  chapter is a bed with a painted sign picture (no text). Each skill is a plant at its stage (seed packet, sprout,
  flower, fruit with a ring; §6.7), with ≥ 112 dp hits. One seed bed ahead. 64 dp arrows left and right. A "List"
  toggle top-right (64 dp, list glyph + "List").
- **Sky 360:** the night sky panel `#0F1A33` behind the rooftop rail. Constellations per chapter, stars per skill
  (ring, dot, 4-point star, star in a ticked ring), "Your class is here" marker, a "List" toggle, and "Fractions · 4
  of 6 secure" under the selected constellation.
- **1280:** Garden fills the window with the panorama at 1.5 screens wide; Sky shows two constellations and a side
  panel for the selected star (her capability line, "How do we know?", the then-and-now card).
- **Tap a plant / star:** a sheet with her rendered pose, the skill in child words, the thing the child made, and
  "Hear {T}". Older also gets the state word and "How do we know?" (the same evidence rows the parent sees,
  captioned "This shows what you've shown so far").
- **States:** brand-new child → one bed with seed packets and her line "Let's plant our first one." · offline → the
  last-known garden, unchanged, with nothing apologetic.
- **Copy:** "Garden" · "My sky" · "List" · "Your class is here" · "{n} of {m} secure" (Older only) · "How do we
  know?" · "Hear {T}" · "This shows what you've shown so far".

### 5.13 Notebook `/c/:cid/notebook`

- **Young:** a painted notebook on the shelf (`ui/notebook-cover`). Each page is a concept the child taught the
  protégé: the child's picture or the module snapshot, and her re-voice on tap. Pages turn with 64 dp arrows. A
  corrected explanation shows the fixed version with "Fixed together".
- **Older ("My notes"):** a list of explainer notes ("for a friend who missed class"), each with the child's own
  text, voice or drawing, usable as a revision sheet.
- **Empty state:** Young "Your notebook fills up when you teach {protégé name}." Older "Notes you write for a friend
  will appear here." with `empty/notebook`.
- Removed: the raw list of board strings and curriculum-objective text (audit 9).

### 5.14 Overlays: Pause, Help, Leave check, Resume

| overlay | 360 layout | copy | rules |
|---|---|---|---|
| **Pause** | bottom sheet 320 dp: title, two 88 dp buttons, a quiet help row at the bottom | "Paused" · "Keep going" · "Stop for today" · help row "Need help? Talk to a grown-up" | her idle stops after 5 s; Esc opens it; **helplines are not the headline** (audit 14); the help row opens the Help sheet |
| **Help** | full sheet: title, a picture card, two call buttons 72 dp, a back link | "Let's get help" · "You're not in trouble." · "Talk to a grown-up at home" · "Call Childline 1098" · "Call Tele-MANAS 14416" · "Back to the lesson" | pre-rendered in every pack; reachable on every rung; raised by the crisis predicate |
| **Leave check** | Young: full screen with tick and cross pictures, the question spoken; Older: a dialog | Young "Stop the lesson?" with "Yes, stop" / "No, keep going"; Older "End the lesson now?" with "End lesson" / "Keep going" | never a sad face; exit buttons use `ink`, never red |
| **Resume** | her face, two equal tiles | "Welcome back." · "Keep going" · "Stop for today" | after a call drop, an app switch, or > 5 min away (after the Gate) |
| **Connection trouble** | §3.2 `trouble` | "Connection is slow" · "Still trying… your answer is saved" · "Try again" | the veil covers the canvas only |
| **Can't hear** | §3.2 | "I couldn't hear that" · "Tap to answer" | once per item |
| **No sound** | full-width card over the canvas | "Turn the sound up, or read along" · "I can hear now" | captions turn on for the session |
| **Tap to hear** | only if audio is still locked after the profile tap | "Tap to hear {T}" | never a second start gate otherwise |

### 5.15 Me `/c/:cid/me`

The audit found a developer panel here (problem 21). v2 is a small room with big rows, spoken on tap for Young:

| row | Young | Older | control |
|---|---|---|---|
| My teacher | ✓ | ✓ | opens §5.5 |
| Words on screen | "Always show words" | "Captions: always / when needed" | toggle |
| Sounds | "Sounds" | "Sound effects" | toggle |
| Talking | none | "Talk mode: tap to talk / open mic (headphones only)" | segmented |
| Face size | none | "Teacher: large / small / voice only" | segmented |
| Look | "Courtyard or Rooftop" (world, one tap, nothing lost) | same plus "Light / Dark / Match phone" | picker |
| Calmer screen | "Calmer screen" | "Calmer screen" (less motion, bigger text) | toggle |
| My PIN | none | "Lock my tile with a PIN" | opens PIN |
| Who can see | an icon strip: computer teacher + eye + grown-up, "A grown-up at home can see what you learn." | "What your parent can see" → the plain list (PRODUCT-DESIGN §2.8) | sheet |

Every toggle announces its name and state ("Sounds, on"; audit 17: today's checkboxes are named "on").

### 5.16 Parent gate, forgot PIN, locked

- **360:** full-screen PIN pad (no footer), title "Grown-ups only", "Enter your parent PIN", 4 dots, the pad,
  "Forgot PIN?" under it. **1280:** a 400 px card.
- Wrong PIN: the dots shake once (reduced motion: no shake, the text changes), "That PIN didn't match."
- 5 wrong: "Too many tries. Wait 15 minutes or reset your PIN." with "Reset PIN".
- Reset flow: "We'll send a code to {masked number}." → code → new PIN. Same-phone case: "For safety, your new PIN
  will work in 24 hours. We've told you on WhatsApp."
- Re-lock note at the top on return: "Locked to keep {child} out."

### 5.17 Parent Home `/parent`

```
360 × 640 (scrolls)
┌──────────────────────────────────────┐
│ [Riya ▾] Class 5 · CBSE   (Asha 32) 🔊│ 56   child switcher; her portrait; "Listen to this page"
├──────────────────────────────────────┤
│ This week                            │
│ Riya can now: write 6-digit numbers  │      one can-do + one still-tricky, plain words
│ in words.                            │
│ Still tricky: commas in big numbers. │
│                   How do we know? ›  │ 168
├──────────────────────────────────────┤
│ ▌One thing to try at home     2 min  │      the only highlighted block (parent accent, not the
│ ▌Ask Riya to read the number on a    │      child's marigold: --p-accent jamun-soft)
│ ▌₹500 note and a ₹2,000 price tag.   │
│ ▌A good answer sounds like: "five    │
│ ▌hundred; two thousand".             │
│ ▌[Done]          [Not this week]     │ 216
├──────────────────────────────────────┤
│ Lessons this week: 2 · 38 minutes    │ 48   facts, one level down, never the headline
│ More ›                               │ 48
└──────────────────────────────────────┘
 bottom tabs 64: Home · Progress · Lessons · More
```
- **1280:** left rail 240 · centre column 560 (as above) · right column 400 with the chapter list and its chips.
- **Rules that close audit 20:** "Still tricky" may name a skill only if its own evidence sheet holds a miss or a
  hint-dependent attempt in the last 14 days (gate WD-G8; the negative control is the audit's case of "Still
  tricky" over a sheet whose only row is "Right · On their own"). With fewer than 3 evidence rows, the block reads
  "Too early to say. After a few more lessons you'll see what's going well and what's tricky." Skill names are in
  parent words, mapped from NCERT outcomes, never the raw objective string. The parent-side highlight is
  `--p-accent` (jamun-soft), never the child's `turn` marigold, and "YOUR TURN" is not a parent label. Times show in
  the device's local time (audit: "5:00 am" was UTC). Pronoun and name come from the child's teacher record ("How
  Arjun teaches Riya").
- **Copy:** "This week" · "{child} can now: {can-do}" · "Still tricky: {tricky}" · "How do we know?" · "One thing to
  try at home" · "A good answer sounds like:" · "Done" · "Not this week" · "Lessons this week: {n} · {m} minutes" ·
  "More" · "Listen to this page".
- **Empty state (no lesson yet):** her portrait and "{child}'s first lesson will appear here." with
  `empty/parent-first`.

### 5.18 The rest of the parent corner

| screen | 360 layout | key copy | states and rules |
|---|---|---|---|
| **Evidence sheet** `/parent/:cid/skill/:id` (the strongest screen today; kept) | bottom sheet: skill in parent words, state chip, one row per piece of evidence (date, the kind of check in plain words, the child's own words ≤ 25, help used, next check date) | "How do we know?" · state words "Not yet", "Practising", "Got it today", "Secure", "Secure · check again soon" · kinds "Explained it in their own words", "Still right {n} days later", "Found the teacher's deliberate mistake", "With a hint", "On their own" | rows are ledger facts only; never red |
| **Progress** `/parent/:cid/progress` | the class's chapters as cards, each with its skills and chips; a header "Chapters started: 3 · Skills secure: 5 of 74" | "Progress" · "Chapters started" · "Skills secure" · level bridge "Building the foundation: {step} → {step} → {this year's chapter}" | never "behind", never a grade equivalent (`grade-equivalent-parent-band` rejected) |
| **Lessons** `/parent/:cid/lessons` | reverse-chronological list; each row: date, topic in parent words, one line | "Lessons" · row "{topic} · {n} min" · a doubt shows as "Question: {topic}", not "lesson" (audit 20) | Class 1-4: a "Listen" button per lesson plays a 20 s summary |
| **Lesson card** | 3 short lines before the fold, skill chips, one quote, next check | "What {child} did" · "In {child}'s words" · "Next check: {day}" · fallback line "Answered by tapping today because listening had trouble" | in-app only, never pushed |
| **How {T} teaches {child}** `/parent/:cid/teaching` | as PRODUCT-DESIGN §6.13, English | "How {T} teaches {child}" | shown only when the mode allows |
| **Monthly talk** `/parent/talk` | her portrait, "Talk with {T} about {child}'s month", a big Start button, the month's card | "Monthly talk" · "About 6 minutes. {T} is an AI teacher." · "Start" | hidden until it works (audit 20) |
| **Controls** | grouped cards with a save bar that only appears on change and never covers the last card (audit 19) | "Lesson time each day" · "Lesson hours" · "How {T} talks to {child}: Friendly / Respectful" · "Words on screen" · "Tap and type only" · "Extra time to answer: normal / more / most" · "Sounds" · "Data saver" · "Teacher choice: free / ask me / locked" | consent-grade changes ask for the code |
| **Family** | owner, co-parents, viewers | "Family" · "Invite on WhatsApp" | hidden until it works |
| **Plan** | price, renewal, cancel in 2 taps | "Your plan" · "Cancel plan" | hidden until billing exists |
| **Data and privacy** | view, export, delete lesson, delete child, delete account | "Download everything" · "Delete this lesson" · "Delete {child}'s profile" · "Delete my account" | hold 2 s + code; a receipt |
| **Help** | helplines (also outside the gate), grievance contact, FAQ | "Help" · "Helplines" · "Contact us" | |

### 5.19 Public system screens

- `/trust`: "Our promises" in full, with a speaker per section. `/privacy`: the notice (honest placeholder until
  written). `/help`: helplines as `tel:` buttons first. 404: her rendered "lost in the courtyard" pose
  (`empty/404`), "This page isn't here." and "Go home". WebView too old: one picture and "Ask a grown-up to help.",
  then the parent screen "Open Taxila in your browser" with the link.

### 5.20 Copy deck: empty states and system strings (English only)

| key | string | image |
|---|---|---|
| `empty.garden.new` | "Let's plant our first one." | `empty/garden-new` |
| `empty.sky.new` | "Your first star appears after your first lesson." | `empty/sky-new` |
| `empty.notebook` | Young "Your notebook fills up when you teach {protégé}." · Older "Notes you write for a friend will appear here." | `empty/notebook` |
| `empty.parent.first` | "{child}'s first lesson will appear here." | `empty/parent-first` |
| `home.resting` | "{T} is resting now" | `pose/resting-tree` |
| `home.offline` | "We need the internet for lessons" | `empty/offline-courtyard` |
| `lesson.trouble.1` | "Connection is slow" | none (her face) |
| `lesson.trouble.2` | "Still trying… your answer is saved" | none |
| `lesson.cant_hear` | "I couldn't hear that" | none |
| `lesson.no_mic` | "No microphone, so we'll tap today" | none |
| `lesson.no_sound` | "Turn the sound up, or read along" | `ui/speaker-big` |
| `lesson.paused` | "Paused" | none |
| `lesson.help.title` | "Let's get help" | `ui/grown-up-card` |
| `error.generic` | "Something went wrong on our side. Let's try again." | `empty/oops` |
| `error.signin` | "Let's sign in again" | none |
| `parent.too_early` | "Too early to say. After a few more lessons you'll see what's going well and what's tricky." | none |
| `parent.locked` | "Locked to keep {child} out." | none |

Style rules for every string: sentence case; no exclamation marks in parent copy; Young labels ≤ 3 words; no
"kids", "champ", "genius", "smart"; no dashes in UI strings; numbers as digits; rupees as "₹" (rendered from an SVG
glyph in chrome so an English screen does not pull the Devanagari font subset, §6.2).

---

## 6. Visual identity

### 6.1 Concept: a painted courtyard, a lit stage

The world is **painted gouache over paper-cut shapes**: flat colour fields with two shade tones each, a soft paper
grain baked into the bitmap, and warm window light from the upper left. Think of a well-made Indian picture book
(the everyday warmth of a Pratham StoryWeaver page) lit like a stage play. The teacher is the one fully modelled,
fully lit figure in it. The style contrast is deliberate: the world is painted, the person is alive. That keeps her
the centre of attention without making the background compete, and it lets the backgrounds be cheap bitmaps on a
₹10k phone.

Two times of day carry the two age bands:
- **Courtyard, day (6-9):** limewash walls, terracotta pots, a neem tree, a charpai, a chalkboard on the veranda,
  kolam dots on the floor, sky blue overhead. Bright, safe, small-world.
- **Rooftop, dusk to night (10-15):** a flat Indian roof with a water tank, a rail, a telescope, strings of
  unlit bulbs, the city's lights below, deep indigo sky. Grown-up, calm, a place to think.

The **lesson** is the same veranda for both bands, with the house lights down: deep blue dusk around her, a warm
pool of light on her and the board. Lights down is the signal that the lesson has begun.

### 6.2 Palette tokens

The existing status and neutral tokens from PRODUCT-DESIGN §4.1 are **kept unchanged** (their contrast and colour
vision checks are measured). This direction adds world tokens and fixes one existing defect.

```css
:root {
  /* kept: neutrals and status (PRODUCT-DESIGN §4.1; measured there) */
  --bg:#FFF8EE; --surface:#FFFFFF; --surface-2:#F1E8D9; --ink:#1F1A14; --ink-2:#5A5148;
  --turn:#FFB21E; --turn-ring:#7A4800; --listen:#2563C9; --think:#5B6470; --done:#1F7A4D; --stop:#B3261E;
  --jamun:#5B2E91; --jamun-soft:#EFE6FA; --board:#1F3B30; --board-frame:#8C6B4A; --chalk:#F5F2E8;

  /* new: the world (illustration and backdrops; never text colours except where a ratio is given) */
  --world-limewash:#FBF5E8;   /* card surface over art; ink on it 15.89:1 [X] */
  --world-wall:#E9B89C;       /* courtyard wall; ink on it 9.70:1 [X] */
  --world-terracotta:#B5532E; /* pots, roof tiles; limewash on it 4.56:1 [X] (large text only) */
  --world-neem:#2F6B4F;       /* leaves, bed borders; limewash on it 5.79:1 [X] */
  --world-sky-day:#A9D8E8;    /* courtyard sky; ink on it 11.24:1 [X] */
  --world-peacock:#0E6E7E;    /* accents: tiles, the charpai weave */
  --world-rose:#B4466A;       /* bougainvillea; flowers in the garden */
  --world-stone:#6E6A7C;      /* rooftop parapet */
  --world-night:#0F1A33;      /* = sky panel; chalk on it 15.42:1 [X] */

  /* new: the lesson stage, lights down */
  --stage-dusk:#26304A;       /* the veranda at dusk; turn on it 7.26:1, chalk 11.69:1, limewash 12.05:1 [X] */
  --stage-pool:radial-gradient(60% 55% at 50% 38%, rgba(255,214,170,.22), rgba(38,48,74,0) 70%);
                              /* the warm light pool behind her; drawn on the backdrop layer only */

  /* new: parent accent (never the child's marigold; the audit found "YOUR TURN" reused for parents) */
  --p-accent:#5B2E91; --p-accent-soft:#EFE6FA;

  /* type (§6.3) */
  --font-display:"Baloo 2", system-ui, sans-serif;            /* Young display, Latin subset only */
  --font-text:"Mukta","Mukta-fb", sans-serif;                 /* body, labels, captions (Latin + Devanagari) */
  --font-reader:"Andika","Mukta", sans-serif;                 /* early-reading tasks */
}
:root[data-band="b3"], :root[data-band="b4"] { --font-display:"Mukta","Mukta-fb",sans-serif; } /* ds-band-fork-older */
```

**Colour rules.**
- **One warm hot spot.** The marigold `turn` is the only saturated warm colour inside the lesson viewport. The
  backdrop is in the dusk palette, and every illustration placed inside the lesson (module art, Forge images,
  board pictures) is checked by the existing hue lint (no saturated token within 12° of `turn`'s hue on a screen
  that renders YourTurn, from `ds-rejected-chalk-mark-gold`).
- **The hue lint needs a saturation floor.** As written it also flags the near-neutrals `bg`, `ink`, `ink-2` and
  `chalk` (hue 33-46°, but desaturated) [X `pal.py`]. Apply it only to colours with HSL saturation ≥ 35 % and
  lightness 20-85 %.
- **Existing defect found:** the diagram token `--d5-haldi:#946B0E` is hue 41.6°, 2.2° from `turn` [X]. It is
  allowed in modules today and will put a second gold on a YOUR TURN screen. Replace it with `--world-rose
  #B4466A` (hue 340°, 59° away) for diagram category 5.
- **Courtyard home is warm and bright** (it carries no turn colour except the one ringed lesson tile). The ringed
  tile sits on a `world-limewash` panel so the marigold reads against cream, as measured (7.23:1 ring vs bg).
- **Skin ramp** unchanged (`skin-1..6`), the teacher defaults per `shared/tutors.js`, casts weighted to the middle,
  never lightened heroes.

### 6.3 Type pairing (Google Fonts)

| role | family | weights | where | bytes on the wire [X from `visual-identity-fonts-2026-10-02.json`] |
|---|---|---|---|---|
| Young display | **Baloo 2** (Ek Type, OFL) | 600, 700 (variable) | titles, the board chips, big numerals, the wordmark | **33 KB Latin subset only.** English chrome means the 115 KB Devanagari subset is never needed for display |
| Text, labels, captions | **Mukta** (Ek Type, OFL) | 400, 600 | everything else, including her captions | 14 KB Latin per weight; the 62-67 KB Devanagari subset loads **only** when the lesson language is Hindi in Devanagari script |
| Older display | **Mukta** 700 | 700 | Older titles | 14 KB Latin |
| Early reading | **Andika** (SIL, OFL) | 400 | English-medium letter and tracing tasks, B1-B2 | 13 KB |

- **The pairing:** Baloo 2's soft, rounded, slightly bouncy letters are the courtyard's voice; Mukta's calm
  humanist strokes are the teacher's handwriting and the parent's page. They are from the same foundry and share
  metrics, so they sit together without fighting.
- **Byte win from the English-only directive:** the Young cold path falls from ≈ 317 KB of fonts to ≈ 74 KB for an
  English or Roman-Hinglish child (Baloo Latin 33 + Mukta 400/600 Latin 28 + Andika 13) [X]. A Hindi-medium child
  adds the Mukta Devanagari subsets (≈ 128 KB for two weights) for captions.
- **₹ trap:** `₹` lives only in the Devanagari subset's unicode-range [X `visual-identity.md` §4.1], so a single ₹
  in English chrome silently downloads it. Chrome renders ₹ from an inline SVG glyph; captions use the font.
- **Scale:** PRODUCT-DESIGN §4.3 sizes are kept, with two changes. The Question Card ask is `type.title` (B1 28 sp /
  B4 22 sp) on phone and never below 24 sp at 1280 (audit 23). State words under the Talk button are 16 sp `ink-2`
  at every band (a visible label, never screen-reader-only).
- **Board chalk:** Baloo 2 600 in `chalk` on `board`, with a 1 px chalk-dust texture mask on tier A-B (none on C-D).

### 6.4 Iconography

- **Young (6-9): painted object icons.** Each is a small gouache object matching the world (a clay house for home,
  a cupped hand for "your turn", an ear for listening, a tortoise for "slower", a slate for practice, a seed packet,
  a watering can, a notebook), 48 dp on a ≥ 64 dp target, with a 2.5 dp dark outline so it holds against both the
  day courtyard and the dusk stage. Every icon is spoken on tap. Supplied as 256 px PNG/WebP with alpha
  (`public/assets/gen/icons/young/*`).
- **Older (10-15) and parent:** Material Symbols Rounded, weight 500, grade 0, optical size 24, on a 24 dp grid.
  Older status glyphs (mic, ear, three dots, mouth-sound) are custom SVGs drawn on the same grid so they morph
  inside the Talk button.
- **Status glyphs are SVG for every band** (they animate: the level arc, the draining ring, the breathing dots).
- **Icon-only controls** are limited to mic, pause, home and "again", and each carries a visible one-word label
  underneath at all bands.
- **Banned on child surfaces:** stars as rewards, coins, trophies, medals, flames, streak counters, crowns, gems,
  hamburgers, kebabs, gears (Young), share icons. The 4-point star in the Sky is a *skill* shape with a meaning
  (PRODUCT-DESIGN §8.5), never a reward.
- **Replaced today:** the paper-plane send (Older keeps it with the word "Send"), the ear-with-arrow without a label,
  the raised-palm "now" icon (it reads as stop; audit 24), the exit-door "done" icon (audit 12).

### 6.5 Illustration style

| rule | value |
|---|---|
| medium | gouache-look painting over paper-cut flat shapes; 2 shade tones per colour field; soft paper grain (≤ 6 % luminance noise) baked in |
| light | one warm key from the upper left, always; the 3D teacher's key light matches it (a constant in the renderer, `keyDir = (-0.45, 0.62, 0.64)`) |
| line | Young: a 2.5-3 dp warm dark outline (`#3A2A1E`) on characters and icons, none on backdrops; Older: no outlines, editorial flat shapes |
| proportions | Young cast head:body 1:3.5; Older 1:6; the teacher is never drawn, always rendered from her rig |
| detail | backdrops are detailed at the edges and calm in the centre third (where she stands and where text sits) |
| culture | everyday Indian school and home: kolam dots, block-print at ≤ 6 % opacity, slates, steel tiffins, matkas, neem, bougainvillea. No religious iconography, flags, maps of India, heritage "ancient glory", festival-specific scenes, gendered colour coding, owls as "clever", parrots for rote learning, cows or pigs as cute characters |
| people | the representation matrix of PRODUCT-DESIGN §4.7; heroes never lightened; no wrongdoer darker |
| text in pixels | **never.** No letters, digits, signs, labels or logos inside any image. Labels are SVG overlays (`generated-media-carries-facts` is rejected) |
| curriculum facts | **never carried by generated pixels.** Generated art is world, mood, icons and empty states only. Diagrams come from the engines and SVG |
| format | WebP (lossy q 80) for backdrops; PNG/WebP with alpha for icons and characters; every backdrop has a 360-wide and a 1920-wide crop; ≤ 60 KB per phone backdrop, ≤ 180 KB per wide one |

### 6.6 Motion language: "breath, not bounce"

Everything in the world moves like breathing: slow in, slow out, never springy for its own sake. Five signature
motions, and nothing else moves:

| motion | what | timing | reduced motion |
|---|---|---|---|
| **Lights down / lights up** | courtyard → dusk veranda at lesson start; back at Finish | 300 ms, standard easing; the backdrop cross-fades, her light pool fades in 150 ms later | an instant cut |
| **Card lift** | the caption becomes the Question Card at the hand-over | 240 ms, 4 dp rise, shadow in | instant swap |
| **Chalk write-on** | the board writes the child's answer, her marks, the tick or the dotted underline | 240-400 ms stroke draw | appears without drawing |
| **Talk button morph** | circle ↔ pill, glyph cross-morph, the level arc, the draining ring | 240 ms morph; arc 60-80 ms smoothing; glow 1.6 s cycle | a static 5 dp ring, no glow; the arc stays (it is information) |
| **Grow** | a plant moves up a stage, a star gains its ring | ≤ 1,500 ms, once, interruptible, only after the ledger acknowledges | a 150 ms cross-fade |

Ambient life is allowed on the **home and Garden screens only**, at most two layers (neem leaves stir every 6-10 s,
one bird crosses every 40-60 s), tier A-B only, paused when reduced motion is on or the battery saver is active.
The lesson backdrop never moves (PRODUCT-DESIGN §3.1). No parallax, no device-tilt effects, nothing flashes more
than 3 times a second, transform and opacity only.

### 6.7 What replaces badges: the world, the artefacts, the moments

The computed brief lists "badges" among the images to generate. **This direction generates none.** Badges per
completion, stars as currency and collectibles are banned on child surfaces by `ds-progress-no-meters` and the
motivation tests (T1-T6), and nothing in the owner's 2026-10-03 directive reverses that. What fills that role
instead, and what the image pack therefore contains:

| replacement | what the child sees | ledger source |
|---|---|---|
| **Plants (6-9)** | seed packet (Not yet) → two-leaf sprout (Practising) → flower (Got it today) → fruit with a ring (Secure). The child picks the plant kind per bed (flower, vegetable or fruit tree), so there are 3 kinds × 4 stages of art | `display` 0-3 |
| **Stars (10-15)** | outline ring → dot → 4-point star → star in a ticked ring | `display` 0-3 |
| **The bird** | a painted sunbird perched by a plant, meaning "{T} will check this one next time" | `recheck_scheduled` row only |
| **Artefacts** | the child's own made thing, framed: a module snapshot, a drawing, an explainer note | lesson events |
| **Milestone moments** | the fruit appears with her delighted face and one earcon, once, in the lesson | §2.9 |
| **The gate opening** | a 1.2 s rendered clip on the very first visit only | first visit |

**Reversal condition:** if MW-M1 / MW-M7 (PRODUCT-DESIGN §10) show that a ledger-backed keepsake shelf (one object
per Secure skill, never per lesson, absence-invariant) raises free-choice return with delayed retention unchanged,
add the shelf as an enhancement of the Garden, still without counts or rarity.

### 6.8 Sound design

| sound | when | character | default | length and size |
|---|---|---|---|---|
| **turn** | entering `your_turn` | two soft rising wooden-marimba notes, E5 → A5 | Young on, Older off | 180 ms, ≤ 12 KB Opus |
| **listen-open** | the mic opens | a soft felt click | on | 40 ms |
| **received** | `heard` | a single wooden "tok", identical for every answer | A/B against none (M-ONB-6) | 60 ms |
| **payoff** | a verified solved item's concept payoff | concept-shaped: the roti tearing, the frog's plop, the bulb's hum, the abacus bead clack | Young on, Older off | ≤ 600 ms |
| **milestone** | a ledger milestone, once | a three-note bell-like rise on the same marimba | Young on, Older quiet card only | ≤ 900 ms |
| **pause / resume** | sheet open / close | a low soft chime down / up | on | 200 ms |
| **trouble** | the `trouble` and `cant_hear` overlays | two low soft notes falling (never a buzzer) | on | 240 ms |
| **lights down** | lesson start | a gentle whoosh-and-settle, like a curtain | Young on, Older off | 400 ms |
| **ambient** | home and Garden only | courtyard birds and leaves at −30 LUFS | **off by default**, A/B (WD-M5) | looped 20 s, 40 KB |

Rules: one sound family (wood and felt, warm, acoustic), no escalating pitch chains, no sound keyed to counts or
streaks, no background music, the device's silent mode is respected, every sound has a visual twin, and all
earcons are pre-decoded at lesson start (WebView audio latency is 100-300 ms [M]; the visual is the 100 ms path).
Her **acknowledgement clips** (§3.4) are a separate bank in her TTS voice, 12 per language per character.

---

## 7. Age-band variants: 6-9 vs 10-15

The same world and the same signalling system, with a different time of day, density and register. The child may
move up a band from Me, never down. Content level is independent of the visual band (a Class 7 child on Class 3
fractions sees the Rooftop and Older art; Forge takes `visualBand` as an input).

| dimension | 6-9 (B1 6-7, B2 8-9): the Courtyard | 10-15 (B3 10-12, B4 13-15): the Rooftop |
|---|---|---|
| world | sunlit courtyard, garden, veranda | rooftop at dusk, sky, telescope |
| home | one ringed "Today's lesson" tile + 3 picture places | a study hub: Continue + Ask + Practice + Sky + Notes |
| teacher on home | at the top, 200-240 dp, greets by name | 120 dp face beside one line of text |
| lesson stage | big face, exaggerated but human acting (band scale 1.0 / 0.9) | smaller, calmer (0.7 / 0.55); Work puts her in the Question Card |
| state words | "Your turn", "Listening…", "Thinking", "{T} is talking" with pictograms | the same words, smaller, plus the phase word in the top bar |
| Question Card | picture-first; ↻ at 64 dp; text in her language | text-first; the "heard" line with tap-to-fix |
| answer modes | talk, tap tiles (2 for B1, 3 for B2), build, trace; typing never required (a 7-year-old cannot type "seventy two thousand", audit) | talk, type, tiles (3-4), keypad, build, draw |
| captions | B1 off (icon strip), B2 phrase line; "Always show words" one tap away | phrase line on |
| hints | she offers after the timeout; tapping her = help | "Hint", "Show me why", "I know it", "More" |
| earcons | on | off by default |
| feedback | chalk tick + the payoff + specific words; wrong = dotted underline + "Let's look" | the same, quieter; the payoff sound off |
| teach back | protégé (a painted creature the child names, 3 designs) | "Explain it for a friend who missed class" (text, voice or draw); protégé opt-in for B3 |
| progress | Garden: plants, no words, no numbers | Sky: stars, words and real counts ("4 of 6 secure"), then-and-now |
| icons | painted objects | Material Symbols Rounded |
| type | Baloo 2 display, Mukta text | Mukta 700 display, Mukta text |
| radii | tiles 24 (B1) / 20 (B2), press ledge on tiles | 16 (B3) / 10 (B4), flat bordered tiles |
| copy | ≤ 3 words per label (≤ 4 for B2), spoken on tap | dry and respectful; no "kids", no cheerleading |
| dark mode | no (light only; the lesson stage is dusk regardless) | system / light / dark |
| session | 10-min micro sessions (B1), 30 min or 2 × 15 (B2) | 30 or 45 min |
| embarrassment test | n/a | every B4 screen passes M-VI-8: "would you mind if a friend saw this over your shoulder?" |

---

## 8. How the teacher is staged on each screen

One character record, one rig, four render forms (TEACHER-VISUAL §10): **H** live (capable phones, desktops), **B+**
live (the ₹10k phone), **D plate** (rendered from B+, so it is the same person), and **hero stills and clips**
(offline Blender renders of the H rig). The 2D SVG `TeacherFace` (`src/ui/TeacherFace.tsx`) and the
`src/stage/characters.ts` drawings are retired.

| screen | form | framing and size (360 / 1280) | gaze and acting | light |
|---|---|---|---|---|
| Landing | hero still + a 20 s rendered clip | medium shot, 160 dp each, side by side / 400 px | at camera, warm smile | courtyard day |
| Setup S2 | hero still → rendered 10 s clip on tap | medium close-up, 156 × 220 dp / 240 × 320 | at camera | studio warm |
| Gate | 2 s rendered wave clip, then a still | full figure at the arch, 160 dp / 320 px | waves toward the tiles | day or dusk |
| First visit | live B+ (warmed on the Gate tap) or D | medium close-up, 320 dp / 480 px | at the child; nods on their taps | dusk stage |
| C3 picker | live B+ faces side by side | close-up, 156 dp / 280 px | each looks at the child when tapped | studio |
| Home (Young) | live D plate (B+ on tier A) at the veranda door | medium shot, 240 dp / 480 px | greets, then idles with a glance at the lesson tile every 7 s | day |
| Home (Older) | live D plate | close-up, 120 dp / 240 px | calm, at the child | dusk |
| Lesson Face | live H / B+ | medium close-up, eye line at 40 % of the stage, 320 dp / 480 × 384 | full floor × affect program (§3.2) | warm pool on dusk |
| Lesson Board | live | medium close-up, 200 dp, turned three-quarters to the board | writes and points at the board | |
| Lesson Work (Young) | live | close-up, face zone 104 dp at 584 | gaze leads her chalk mark by 200 ms | |
| Lesson Work (Older) | live crop in the Question Card | 64 dp head crop | the same program, at a smaller scale; at this size H drops to B+ shading (TEACHER-VISUAL §10.1) | |
| Duo / Explain | live, beside the protégé or above the explain panel | medium close-up 152 dp / 120 dp | looks from the child to the protégé | |
| Wrap | live | medium shot, 200 dp | re-voices the child's words with a warm smile | lights come up at Finish |
| Practice | D plate clips | close-up 152 dp | pre-rendered | slate corner |
| Garden / Sky | rendered pose stills (watering can; telescope) | 120 dp in the scene | | |
| Notebook | rendered still | 96 dp beside the page | | |
| Resting | rendered still: reading under the neem tree | in the scene | eyes down on her book | late afternoon |
| Help sheet | live, calm concern variant | close-up 120 dp at the sheet's top | soft, steady, smile 0 | |
| Parent corner | hero portrait | 32 dp in the header; 160 dp on "How {T} teaches {child}" | at camera | studio |
| WhatsApp report | hero portrait in the optional header image | 1080 × 1350 card | | |

**Identity anchors that never vary across forms:** face shape, skin tone, hair, the signature colour of the outfit
(`shared/tutors.js look.signatureColor`), one accessory (Asha's gold studs; Arjun's round glasses), the voice, the
name and the pronoun. Gate WD-G5 checks them across all 12 surfaces with a "same teacher?" panel (target in §10).

**The "AI teacher" label goes with her everywhere:** the computer-teacher badge on her stage corner (Young), "{T} ·
AI teacher" in the Older top bar, the hero stills' caption in the parent corner, and C2PA provenance plus the label
on every rendered clip (MeitY synthetic-media rules [R via TEACHER-VISUAL §13]).

---

## 9. Accessibility

Everything in PRODUCT-DESIGN §7.1 stays (tap twins for every drag, pointer-up commit with pointer-down feedback,
two-tone focus, 200 % text survival, a full tap-and-type lesson, captions-always, haptic YOUR TURN, the timing
multiplier). This direction adds:

| need | provision |
|---|---|
| **turn state without sight** | every floor change sets the Talk button's accessible name ("Your turn. Say it, or tap.", "Listening", "Thinking", "{T} is talking. Double tap to interrupt.") and announces `your_turn` once, politely, with the ask: "Your turn. {ask}". Focus moves to the ringed element |
| **turn state without hearing** | the six visual channels of §3.2; captions-always; the haptic tick; "Hear it again" has a visual twin (the Question Card text) |
| **turn state without colour** | glyph + word + shape differ for every state (WD-G1); the ring is an outline, not a shadow, so forced-colours keeps it |
| **the stale live region** (audit) | one polite live region per lesson; it is written once per phrase at `audio_end` and cleared at the next turn; never word by word |
| **labels** | no icon-only button without a visible word; every toggle names itself and its state; no `button ""` (audit 17) |
| **motor** | Young targets ≥ 64 dp with 16 dp gaps; the hold gate has a non-hold alternative; no long-press for Young; the holdover guard after screen changes |
| **cognitive load** | Young ≤ 2 text regions (the Question Card is one region in two modes); one ringed element; one idea per screen; no timers shown |
| **reading** | R0 children get pictures-first asks, ↻ at 64 dp and the icon strip; nothing requires reading to proceed |
| **low vision** | "Bigger text or a calmer screen" (comfort mode): text ×1.25, motion off, ambient off, borders thicker |
| **motion sensitivity** | `prefers-reduced-motion` and "Calmer screen": all UI motion becomes cross-fades; her lips and blinks stay; head and expression amplitudes ×0.3 (TEACHER-VISUAL gentle face) |
| **screen readers in the lesson** | the board chips and canvas parts carry accessible names; her chalk cues update the target's description; the 3D canvas is `aria-hidden` with her state exposed through the Talk button |
| **keyboards and switches** | Space, 1-4, Enter, R, H, Esc on desktop; remappable, off while typing; every module operable by keyboard and switch |
| **contrast** | all new text pairs ≥ 4.5:1 (`ink` on `world-limewash` 15.89, `ink` on `world-wall` 9.70, `chalk` on `stage-dusk` 11.69, `limewash` on `stage-dusk` 12.05 [X]); `limewash` on `world-terracotta` is 4.56:1, so it is used only for large text |
| **languages** | `lang` on every caption span; captions in the child's school script; English chrome with a reversal condition (`owner-design-v2-directive`) |
| **parents with low literacy** | "Listen to this page" on every parent screen; every evidence row and the home task have a speaker; the weekly report has a voice note |

---

## 10. What success looks like, measurably

Each target names its method, n and owner surface. Log every result to `context/measurements.md` with n, method
and date.

| id | outcome | metric | target | method and n |
|---|---|---|---|---|
| WD-M1 | children know whose turn it is | at a random frozen frame during a lesson, the child says or points to "whose turn" correctly | ≥ 90 % for 6-9, ≥ 95 % for 10-15 | in-person panel, 20 per band, 10 frames each, in greyscale and in colour |
| WD-M2 | the question is always there | share of YOUR TURN windows in which the Question Card shows a non-empty `ui.ask` that passes WD-G2 | 100 % in eval; ≥ 99.5 % in production logs | eval battery 500 turns; production telemetry |
| WD-M3 | waits do not feel broken | share of turns with commit → first audio > 2 s in which the child taps, re-asks or leaves before she speaks | ≤ 5 % (today: unmeasured) | production telemetry, 2 weeks, ≥ 1,000 turns |
| WD-M4 | nothing fails silently | failures with no visible state within 3 s; answers lost after reconnect | 0 and 0 | WD-G4 chaos battery on every release; production outbox audit |
| WD-M5 | missed turns | YOUR TURN windows that reach the verbal re-entry without the child starting | ≤ 15 % (the `ds-status-carriers` reversal trigger) | telemetry |
| WD-M6 | one teacher | "Is this the same teacher?" across landing, home, lesson, Wrap and the parent corner | ≥ 90 % "same" (M-SEL-11 floor 85 %) | panel, 20 children per band + 20 parents |
| WD-M7 | no dead zones | lesson seconds with an empty canvas region on screen, or a placeholder string | 0 | WD-G3 render lint + telemetry |
| WD-M8 | English chrome | Devanagari code points in chrome string tables; OCR text found in generated images | 0 and 0 | WD-G6 CI lint |
| WD-M9 | first sound | Gate tap → her first audio | p90 ≤ 1.0 s (local clip) | device lab, 3 phones × 20 runs |
| WD-M10 | first turn | lesson start → first YOUR TURN | p50 ≤ 25 s for Young | telemetry |
| WD-M11 | delight (child-reported) | the P7 self-check: share choosing the happiest face (Young) or "I liked it" (Older) | ≥ 70 %, never shown as a goal to the child | in-lesson self-check, at most weekly, n ≥ 200 |
| WD-M12 | **return driven by wanting, not by nagging** | share of children who open the app on ≥ 3 days in week 4, with zero child notifications and no streaks | ≥ 45 % week-4, against the v1 arm | pilot A/B, ≥ 60 children per arm |
| WD-M13 | free-choice return | child-initiated opens on days with no planned lesson, and `child_request` lessons | rises against the v1 arm, with delayed retention not lower | pilot A/B |
| WD-M14 | learning is not traded for delight | delayed retention (produce-form, ≥ 7 days) | non-inferior to v1 (margin 3 pp) | pilot A/B |
| WD-M15 | parent trust | parents who can say, after one week, one thing their child can now do and how they know | ≥ 70 % | 5-minute interview, n = 20 |
| WD-M16 | parent verdicts never contradict evidence | "Still tricky" claims without a supporting row (WD-G8) | 0 | CI lint over fixtures + production audit |
| WD-M17 | lights down reads as "lesson time" | children 6-9 who say the lesson has started when the stage dims, with no words on screen | ≥ 80 % | panel n = 20 |
| WD-M18 | performance | lesson screen on the ₹10k phone (Helio G85 class): face at 30 fps with the Question Card and module live; backdrop decode ≤ 40 ms | p90 frame ≤ 33 ms over 10 min | device lab |

**What would make this direction wrong** (the reversal conditions, so it is not dogma):
- WD-M1 is below 80 % for 6-9 after two iterations → the signal system is too subtle; add a full-screen "Your
  turn" moment (her hand gesture plus the word at 48 sp) for B1.
- WD-M17 fails, or the dusk stage lowers WD-M11 against a lit-classroom arm → keep the lesson lit (a day veranda)
  and carry "lesson time" by the board appearing instead.
- WD-M12 or WD-M13 do not beat the v1 arm → the world is decoration, not motivation; strip ambient life and spend
  the art budget on modules.
- WD-M14 is inferior → roll back whichever delight element correlates with the drop (payoff length, ack clips,
  milestone moments) one at a time.

---

## Appendix A. Image pack: the Codex prompt and the asset manifest

The owner generates images in bulk with Codex and saves them in the repo (`owner-design-v2-directive`: shipped art
goes under `public/assets/gen/`). The teacher concept references are **not** in this pack: they are TEACHER-VISUAL
Appendix A, saved under `art/gen/teacher/` so they never ship. Codex output is concept art and world art; the
teacher's shipped pixels are always renders of her rig.

### A.1 The prompt to paste into Codex

```
You are generating the illustration pack for "Taxila", a children's learning app set in one painted world: a sunlit
Indian home courtyard (for ages 6-9) and the same home's rooftop at dusk and night (for ages 10-15).

Read the manifest table in docs/design/directions/child-first-wonder.md, Appendix A.3. For EVERY row, generate one
image and save it at exactly the path given, at exactly the size given, as WebP (quality 80) unless the row says
PNG. Rows marked "alpha" need a transparent background. Rows marked "wide" are 1920x1080; "phone" are 720x1280
unless a size is given. After each image, append a line to public/assets/gen/provenance.jsonl with
{path, prompt, date, tool, model}.

GLOBAL STYLE (applies to every image):
- Gouache-look painting over paper-cut flat shapes, two shade tones per colour field, a soft paper grain.
- One warm key light from the upper left, always.
- Palette anchored on: limewash #FBF5E8, courtyard wall #E9B89C, terracotta #B5532E, neem green #2F6B4F,
  day sky #A9D8E8, peacock #0E6E7E, bougainvillea rose #B4466A, rooftop stone #6E6A7C, dusk #26304A, night #0F1A33.
- AVOID saturated yellow, amber, gold and orange anywhere (hue 28-52 degrees, saturation above 35 percent). The
  app reserves marigold for one signal. Sunlight is shown as warm cream light, never as yellow.
- Everyday modern Indian home and school life: kolam dot patterns, steel tiffins, matkas, slates, a charpai, a
  neem tree, everyday potted plants (never sacred plants such as tulsi), bougainvillea, a water tank on the roof, a rooftop rail, city lights.
- Calm centre third: keep the middle third of every backdrop low in detail; detail lives at the edges.
- People (only where a row asks): Indian children and adults of varied skin tones from light brown to deep brown,
  modest everyday clothes, no school uniform logos, friendly, never stereotyped.

ABSOLUTE RULES (reject and regenerate any image that breaks one):
- NO text, letters, numbers, digits, signs, labels, logos, watermarks or writing of any kind, in any script. No
  writing on any chalkboard, book, slate, packet or wall.
- NO religious symbols, idols, temples, flags, maps of India, political imagery, festival-specific decoration.
- NO real people, celebrities, brands or copyrighted characters.
- NO owls, parrots, cows or pigs as characters.
- NO coins, trophies, medals, crowns, stars-as-rewards, gems, treasure chests, flames.
- NO scary, sad or crying characters; no wilting or dead plants.
- NO teacher character in any image (the teacher is rendered separately in 3D). Where a row needs her place,
  leave that area empty and calm.

After the pack, run an OCR pass (any OCR tool) over every image and list any image where text was detected, then
regenerate those images.
```

### A.2 Naming and technical rules

- Paths are under `public/assets/gen/`. Lower-case, kebab-case. Backdrops: `bg/<name>-phone.webp` (720 × 1280)
  and `bg/<name>-wide.webp` (1920 × 1080). Icons: 256 × 256 PNG with alpha. Characters and objects: 512 × 512 PNG
  with alpha unless stated.
- The build step (not Codex) makes the 360-dp crops and the 2× / 1× variants, and enforces the size caps (≤ 60 KB
  phone backdrop, ≤ 180 KB wide, ≤ 12 KB per icon at 96 px).
- Every image passes the WD-G6 OCR check and the PRODUCT-DESIGN illustration audit (skin ramp, representation)
  before it ships. Codex output terms need the legal read that TEACHER-VISUAL §14 already asks for.

### A.3 Manifest (96 images)

**Backdrops (each as `-phone` and `-wide`: 15 scenes, 30 images)**

| path stem (`bg/…`) | scene | notes |
|---|---|---|
| `courtyard-day` | the home courtyard in morning light: limewash walls, a neem tree at the right, a veranda door at the left (empty, where the teacher will stand), kolam dots on the floor, two terracotta pots, a sky band at the top | calm centre and lower third for UI tiles |
| `courtyard-afternoon` | the same courtyard in late-afternoon cream light, longer soft shadows | the `resting` state |
| `veranda-dusk` | the veranda classroom with the house lights down: deep blue dusk, a large empty green chalkboard on the wall (no writing), a wooden frame, a warm pool of light at centre where the teacher will stand | the lesson stage; the light pool is at 50 % x, 38 % y |
| `rooftop-dusk` | the flat roof at dusk: water tank, rail, a telescope on a tripod, an unlit string of bulbs, city lights below, indigo sky with the first stars | Older home |
| `rooftop-night` | the same at night, deeper sky, more stars, the telescope pointed up | Sky map frame |
| `gate-day` | the courtyard gate from outside: an open wooden gate, a path, the courtyard visible beyond, an arch where the teacher will wave (empty) | the Gate |
| `gate-dusk` | the same gate at dusk | Older-only households |
| `garden-panorama` | a long garden strip along the courtyard wall: empty raised beds with brick borders, a watering can, a low wall; tileable left-to-right; 4320 × 1280 for phone, 5760 × 1080 for wide | beds stay empty: plants are separate sprites |
| `practice-slate` | a corner of the courtyard with a big slate on an easel (blank), a mat on the floor, a steel tiffin | Practice |
| `notebook-shelf` | a wooden shelf with a few closed blank notebooks and a small plant | Notebook |
| `landing-courtyard` | a wider, brighter version of `courtyard-day` with space on the left and right for two teacher stills | landing hero |
| `me-room` | a cosy corner with a window, a cushion and a small mirror (no reflection of a person) | Me |
| `ask-desk` | a study desk on the rooftop at dusk with an open blank textbook and a pencil | Ask a question |
| `help-calm` | a soft, plain warm room corner with a lamp, very calm, almost abstract | Help sheet background |
| `parent-calm` | a quiet limewash wall with a single plant and soft light, very low detail | parent corner header |

**Young icons (`icons/young/…`, 256 × 256 PNG alpha, painted objects with a 2.5 dp dark warm outline: 24 images)**
`home` (a small clay house) · `pause` (a cupped resting hand) · `mic` (a round wooden-handled microphone) · `again`
(an ear with a curved arrow) · `slower` (a tortoise) · `your-turn` (an open hand, palm up) · `listening` (an ear) ·
`thinking` (three pebbles in a row) · `speaking` (a mouth with sound lines) · `tap` (a finger tapping) · `write` (a
pencil) · `undo` (an eraser) · `yes` (a hand-drawn tick made of a twig) · `no` (two crossed twigs, never red) ·
`who-sees` (an eye beside a grown-up silhouette) · `ai-teacher` (a small friendly computer screen with a face of
two dots and a smile, no text) · `grown-up` (a grown-up silhouette) · `help` (a phone with a grown-up silhouette) ·
`sound-on` · `sound-off` · `words` (speech lines in a bubble, no letters) · `garden` (a watering can) · `practice`
(a slate) · `notebook` (a closed notebook).

**Garden sprites (`garden/…`, 512 × 512 PNG alpha: 15 images)**
For each plant kind `flower`, `vegetable`, `fruit-tree`: `<kind>-1-seed` (a seed packet stuck in soil, blank packet)
· `<kind>-2-sprout` (two-leaf sprout) · `<kind>-3-bloom` (in flower) · `<kind>-4-fruit` (with fruit or a full
head; a thin green ring is added in code, not painted). Plus `bird-sunbird` (a perched purple sunbird) ·
`watering-can` · `bed-sign-blank` (a small blank wooden sign on a stick; the chapter picture is overlaid in code).

**Sky sprites (`sky/…`, 256 × 256 PNG alpha: 4 images)**
`star-0-ring` · `star-1-dot` · `star-2-star` · `star-3-ringed`, all soft-glow, cool white on transparent, drawn as
shapes (the state shapes of PRODUCT-DESIGN §8.5).

**Child profile pictures (`avatar/child-…`, 512 × 512 PNG alpha, friendly painted animals in a round frame: 9 images)**
`elephant` · `tiger` · `peacock` · `squirrel` · `turtle` · `rabbit` · `fish` · `butterfly` · `deer` (no owl,
parrot, cow or pig).

**Protégé designs (`protege/…`, 512 × 512 PNG alpha: 3 images)**
`sprout-sprite` (a small leaf-creature) · `cloud-pup` (a small cloud with paws) · `pebble-friend` (a round smooth
stone creature). Obviously fictional, friendly, no human features beyond simple eyes and a smile.

**Empty states and moments (`empty/…`, 720 × 720 PNG alpha or WebP: 9 images)**
`garden-new` (one empty bed with a seed packet and a watering can) · `sky-new` (an empty night sky with one faint
star) · `notebook` (an open blank notebook with a pencil) · `parent-first` (a calm empty chair beside a small
plant) · `offline-courtyard` (the courtyard with a cloud over the gate) · `oops` (a toppled pot of pencils, nothing
broken) · `404` (an empty winding garden path) · `first-gate` (the gate swinging open with light behind it, 1920 ×
1080) · `milestone-fruit` (a single glowing fruit on a branch, soft light).

**Parent and landing (`landing/…` and `parent/…`: 2 images)**
`landing/promises-strip` (three small painted objects in a row: a phone with a gentle cross line, a closed purse, an
open hand) · `parent/home-task-objects` (a roti, a plain paper note shape with no numbers or symbols, a steel cup, a
measuring tape with no numbers, laid on a cloth).

Total: 30 + 24 + 15 + 4 + 9 + 3 + 9 + 2 = 96 images.

---

## Appendix B. How this direction settles conflicts with existing documents

| # | conflict | settled as | why |
|---|---|---|---|
| B1 | TEACHER-VISUAL §7.2: "celebrating" enters on `answer.correct` (verified key) vs PRODUCT-DESIGN `ReactionGate`: the face never keys to correctness | ReactionGate wins. Delight fires on Director `affect: insight | effort` and on engine `goal_met` after visible effort, never on a plain correct answer. The verdict channel is the board, the card and the payoff (§3.5) | a correctness-keyed face is farmable and leaks covert checks; the audit's need for feedback is met without it |
| B2 | computed brief: generate badges vs `ds-progress-no-meters` | no badges; §6.7 replacements | the directive does not reverse the motivation decision |
| B3 | the v1 four-state floor vs this direction's eight floor states | additive: `arriving`, `yielding`, `heard`, `showing` refine SPEAKING and THINKING; the one-ring rule and "colour is the last carrier" are unchanged | the audit's silent receipts and frozen waits |
| B4 | v1 L1-L5 geometries vs the new Board and Face + Choice geometries | Board replaces the empty canvas when a phase has no module; geometry still changes only at phase boundaries | audit 5 |
| B5 | v1 Older PiP in Work (96 × 120 inside the canvas) vs the face in the Question Card | the face moves into the card (64 dp); Large and Voice-only remain options | the PiP covered module content (audit 5) |
| B6 | v1 "launch face: the 2D Rive teacher for every band" | the 3D S3h rig in the lesson on every tier that can run it, and the D plate rendered from it elsewhere | TEACHER-VISUAL decision; owner directive |
| B7 | v1 state words Devanagari-first; Hindi copy tables in `src/child/copy.ts`, `Hello.tsx`, `shared/tutors.js` | English chrome; the Hindi and Devanagari variants are deleted from chrome tables (they stay only where they are the teacher's speech) | owner directive; reversal per `owner-design-v2-directive` |
| B8 | v1 "parent picks the teacher at P6" (already amended by `avatar-tutor-selection`) | the child picks at C3; the parent sees both at S2 and can set a policy in Controls | keeps the amended decision |
| B9 | v1 onboarding order (account before promises) | promises (S3) before the hold gate and the phone (S4-S5) | the trust page's title was false (audit 24) |
| B10 | v1 Young: no text echo of a spoken answer | Young gets a non-text receipt (a speech-bubble chip with a sound wave); Older keeps the "heard" line | a receipt is required (audit 3) without reading load |

## Appendix C. Proposed `context/` entries (for the main loop to merge; this workflow writes only to `docs/`)

- **decision `wd-question-card`:** at every hand-over the caption lifts into a pinned Question Card holding her
  face and `ui.ask`, generated from the same Director move as her speech, gated by ask parity (WD-G2). *Reverse
  if* WD-M1 shows no gain over a caption-only arm at n ≥ 20 per band.
- **decision `wd-lights-down`:** the lesson stage is the dusk veranda (`stage-dusk #26304A`), making marigold the
  only warm hot spot (7.26:1). *Reverse if* WD-M17 < 80 % or a lit-classroom arm scores higher on WD-M11.
- **decision `wd-floor-heard-showing`:** add `heard` (receipt, ≤ 600 ms) and `showing` (watch) floor states;
  `statusOf()` returns `thinking` without a pending hand-over. *Reverse if* WD-M1 shows the extra states confuse.
- **decision `wd-outbox`:** every child answer is written to an IndexedDB outbox before sending; retries 1/3/6 s,
  then `trouble`; zero lost answers is a release gate (WD-G4). *Reverse if* never: this is a correctness floor.
- **decision `wd-board-geometry`:** a phase with no module uses the Board geometry; no empty canvas or placeholder
  ever reaches a child (WD-G3). *Reverse if* a pilot shows children want the canvas region reserved.
- **measurement:** palette hue distances and contrasts computed 2026-10-03 (`pal.py`, n = 24 tokens, 20 pairs),
  including `--d5-haldi` at 2.2° from `turn` (a lint defect) and the need for a saturation floor in the hue lint.
- **rejection candidate `wd-badges`:** badge and collectible art proposed in the computed brief, not generated,
  because of `ds-progress-no-meters`; recorded so it is not re-proposed without new evidence.

## Appendix D. Build order (smallest change that fixes the most first)

1. **Week 1, no new art needed:** visible state words; the Question Card with `ui.ask` and WD-G2; the outbox and
   the `trouble` / `cant_hear` states; `statusOf()` fix; remove the second start gate; delete placeholder strings
   and mount the Board geometry; English chrome strings; Pause without helplines as the headline; field-level
   parent errors; scroll reset; footers that never cover inputs; hide dead parent entries; "Still tricky" lint.
2. **Week 2-3:** one teacher record everywhere (retire the 2D faces; the D plate and hero stills from the M0 rig as
   a stopgap until S3h); the Talk button morphs, earcons and haptics; the latency choreography and ack clips; the
   feedback channel (chalk tick, dotted underline, payoffs on the existing engines).
3. **Week 3-4, with the Codex pack:** the world backdrops, lights down, the Courtyard and Rooftop homes, the Garden
   and Sky art, the Gate, empty states, Young icons.
4. **With TEACHER-VISUAL's pipeline:** S3h in the lesson at H and B+, cinematic moments (gate opening, chapter
   openers), the live face crop in the Question Card.
5. **Then measure:** WD-M1, M6, M9, M17 in the first panel; M12-M14 in the pilot.
