# BUILD-SPEC · Kaksha, the gamified child app (with a Nagar settlement layer)

**Date:** 2026-10-10. **Author:** stream U1 (`claude/r4-app-design`).

**Status:** the main session picked Kaksha as the owner's delegate (`dc-r4-app-kaksha`, provisional until the owner
overrides). The four questions in §12 were answered on 2026-10-10 (`dc-r4-kaksha-k-o-answers`). Slice K0 is built on
`claude/r4-app-design`; see `docs/design/round4/build/kaksha/RESULTS.md`. This spec maps it onto the code at base `db33615f`. If the owner picks Nagar or Chhaap instead, the same
structure is kept and only §2 (tokens), §4 (world) and §6 (motion) are re-targeted.

**Read with:**
- the prototype `docs/design/round4/app/kaksha/index.html` (the reference for look and motion; its `src.html` is
  readable);
- `COMPARE.md`;
- `docs/design/round4/BUILD-PLAN.md` §4-§5 and `BUILD-PLAN-V2.md`;
- `docs/design/round4/build/games-core/CORE-API.md` (G1, on `claude/r4-games-core`);
- `docs/research/round4/tutor/TUTOR-MODEL.md` §2.

**Honesty:** no child has used Kaksha. Its evidence is a blind model-judge ranking: first in 10 of 10, both
families, advisory. The build's acceptance (§11) re-measures on the real product.

---

## 0. What the build is, in one paragraph

The child side of Taxila becomes a dark, premium game client called **Kaksha**:
- **Home** is her face, her name and one Start.
- The **session** opens with her asking what happened at school, maps the answer to the syllabus, and agrees a plan.
- The **Desk** (lesson) is the same layout, reskinned as a mission board, inking beat by beat.
- **Games** launch from a briefing that shows the level was built from this lesson. They run in G1's and G2's
  engines; Kaksha owns no game code.
- The **session end** names what was done, what became secure and what it opened.
- The **world** is the child's planet: secured skills dock as stations on subject orbits, the night side lights up,
  and (the Nagar layer) a small settlement on the planet raises one structure per secured skill.
- **Collections** (the Hangar) are opened only by secured skills.
- The **parent view** stays an adult surface with the safety floor unchanged.

**Not touched:** truth, grading, safety, the teacher's words, game logic and the ledger. Kaksha is a shell and a
skin over existing seams.

---

## 1. Decisions this spec rests on, and conflicts it surfaces

**Standing decisions it relies on:**

| decision | what it gives the build |
|---|---|
| `dc-r4-app-kaksha` | direction A, plus the Nagar settlement as a secondary layer, earned only by secured skills |
| `dc-r4-gamification-b` | allowed: a world that changes, collections opened by secured skills, avatar/look choice, in-run scores. Banned: carried points, streaks, leagues, lives, random drops, countdowns on new skills, absence punishment |
| `dc-r4-tutor-model-switches` (4) | Home is Start-only; the topic moves to the parent view |
| `dc-r4-games-o-g` | dressed 3D worlds, music ducking, the "daago" verb at non-living targets only |
| `dc-r4-prakash-dropped-asha-only` | one teacher, Asha |
| Rejected items | no locks (`rj-world-locked-places`), no "N of M" (`rj-world-collection-counter`), verdict-neutral face (`design-v2-rejected-correctness-face`), no symbolic wait indicators (`rj-symbolic-wait-indicator`) |

**Two conflicts the build must not resolve on its own.** Both go to the main session and the owner:

- **C1. Chrome language.**
  - Today's rule G-EN-1 (decisions.md: "UI chrome and labels are English only … reverse if Hindi-medium children
    can't navigate English chrome") is enforced by `scripts/lint-ui.mjs` (L-DEVA, L-HING) and
    `tests/ui-v2-b2.test.mjs`.
  - The U1 brief and the prototypes carry Hinglish / हिंदी / English labels.
  - **This spec builds the labels as one three-column table behind a switch whose default keeps G-EN-1**
    (`chromeLang = "en"`). The Hinglish and Hindi columns are written, tested for size and fit, and shown only when
    the owner reverses G-EN-1 for the cohort.
  - Her speech and captions already follow `language_pref` and are unaffected.
  - Owner decision **K-O1**.
- **C2. Dark for young children.**
  - `ChildShell` keeps the young family (classes 1-4) light-only (`ds-band-fork-older`).
  - `design-v2-rejected-full-lights-down` rejected a full dusk screen for young children.
  - Kaksha's dark space is therefore built for the **older family (classes 5-9) by default**.
  - Classes 1-4 get **Kaksha Dawn**: the same structure, components and motion, on a light dawn-sky token set
    (§2.2). It is built and judged, never forced dark.
  - The `dc-r4-app-kaksha` reversal condition (a child pilot with classes 1-3) is exactly the test that could
    change this.
  - Owner decision **K-O2**.

---

## 2. Tokens

### 2.1 Where they live (reuse, not a third system)

`src/ui-v3/` already holds an unrouted dark child system:
- `tokens.css` scoped to `.v3` (Night: `--bg #0A0C12`, Bricolage Grotesque and Geist Mono);
- primitives (`Button`, `Chip`, `Card`, `StageFrame`, `TurnIndicator`), `FaceSlot`, `Scheduler`;
- a lint (`src/ui-v3/lint/rules.mjs`: WORDS, MASCOT, EMOJI, candy colours);
- the `ui.v3` flag.

No round-4 stream owns it. **The Kaksha stream (K) takes ownership of `src/ui-v3/**` and evolves it into Kaksha.**
It does not start a fourth token system:
- **Retune** `src/ui-v3/tokens.css` and `tokens.ts` to the Kaksha palette below. `tests/ui-v3-lint.test.mjs` keeps
  them in sync.
- **Keep** the primitives and FaceSlot; restyle them.
- **Keep** the v3 lint, and add the Kaksha rules from §8.

`src/styles/tokens.css` (the v2 light Desk tokens) stays frozen and untouched. It still serves the parent and
adult surfaces.

### 2.2 The palette (from the prototype, contrast-checked: 0 fails over 48 states)

| token | Kaksha (older, default) | Kaksha Dawn (young) | use |
|---|---|---|---|
| `--k-void` | `#05060A` | `#F3F1FA` | page ground |
| `--k-deep` | `#0A0D16` | `#E8E6F5` | panel ground |
| `--k-panel` | `rgba(16,20,34,.78)` | `rgba(255,255,255,.82)` | glass panels |
| `--k-line` / `--k-line2` | `rgba(150,170,255,.16 / .30)` | `rgba(40,50,110,.14 / .28)` | hairlines |
| `--k-ink` / `--k-ink2` / `--k-ink3` | `#EEF1F8` / `#B9C0D4` / `#9AA3BC` | `#141833` / `#3A4066` / `#4A5070` | text |
| `--k-move` (plasma: your move; the only CTA and lamp colour) | `#3EE6FF` → `#0FB8D6` | `#0B6F86` | Start, the dock lamp, the checkpoint, the hint |
| `--k-her` (kesar: her speech, her caption word) | `#FFB547` | `#A35A00` | the current word, her comms rim |
| `--k-secure` | `#7CF5B5` | `#0A7A55` | secured skill, "opened" |
| `--k-look` (look again: never red) | `#B3A6FF` | `#5B4BD0` | wrong-place mark, parts count |

The ring colours, one per subject, are reserved hues: Ganit plasma, Vigyan secure-mint, Bhasha kesar, with EVS and
SST added as `#FF8FB1` and `#9BE3FF`. A ring hue is never a learning-object hue inside a game (O-G1).

**Type:**
- Latin: **Space Grotesk** (display and UI). Add `public/fonts/space-grotesk-latin.woff2`, about 22 KB, OFL.
- Numerals and labels: **Geist Mono**, already in `src/ui-v3/fonts`. The prototype's JetBrains Mono is dropped.
- Devanagari: **Mukta**, already shipped in `public/fonts`. The prototype's Anek variable font cost 700 KB, so it is
  dropped.

**Sizes:**
- Body text 16 px. Labels 15 px, never under 14 px. Devanagari never under 16 px.
- Board numerals at least 18 px rendered (the prototype refits the board's coordinate space below 700 px; the Desk
  already sizes in dp).

**Shape:**
- Chamfered corners: `clip-path` 12 px, 16-18 px on hero frames. No pills.
- Hairline borders. Corner ticks on the comms frame.
- Buttons are at least 48 px tall; segmented controls at least 46 px.

---

## 3. Screens, mapped onto the real routes

**Child mode** stays `src/app/routes.tsx` → `<ChildMode>` → `src/child/routes.tsx` under `ChildShell` (`/c/:cid/...`).
- Kaksha mounts **inside `ChildShell`** behind the flag `ui.kaksha`:
  - `?ui=kaksha`, localStorage `tx.flag.ui.kaksha`, `VITE_UI_KAKSHA`, and the server cohort flag
    `TAXILA_UI_KAKSHA`;
  - default **off** until §11 passes.
- `ChildShell` keeps its jobs: the `/api/me` load, band and family, `data-theme`, `data-motion` and the
  `TeacherNameProvider`.
- Kaksha replaces the **screen elements**, not the route tree.

| prototype screen | route (today) | today's component | Kaksha component (owner) | data (existing unless marked) |
|---|---|---|---|---|
| Open | `/c/:cid` (index) | `child/screens/Home.tsx` | `ui-v3/screens/Home.tsx`, rebuilt (K) | `GET /api/child/plan` states start / first / resume / done / capped / resting / safety_hold / offline (`src/child/plan.ts`) |
| Intake | `/c/:cid/lesson/new` (no `?topic`) | `child/lesson/LessonScreen.tsx` → Desk | the Desk's intake mode (K skin, 2 owns the Desk) | **4A's session-first server path**: intake turns, then a mapped topic and plan (§3.2) |
| Lesson | `/c/:cid/lesson/:lid` | Desk | Desk under `data-skin="kaksha"` (2 owns, K styles) | unchanged runtime (`src/lesson/**`) |
| Game launch / play | inside the Desk WorkTray (Studio stage) | `PlayStudioRenderer` → `PlaySession` → `PlayStage` | **Briefing** card (K) in front of G1's engine mount | G1's `DressedSpec` and level params (§3.4) |
| End | inside the lesson (`Summary` when the lesson ends) | `child/lesson/Summary.tsx` | `ui-v3/screens/EndOfLesson.tsx`, rebuilt as Debrief (K, mounted by 2's `LessonScreen`) | `GET /api/lesson/summary` plus the ledger's secure transitions (§3.5) |
| World | `/c/:cid/map` | `child/screens/Map.tsx` (Garden / Sky) | `ui-v3/screens/World.tsx` (new, K) | `GET /api/child/map` (`MapState`), no server change (§4) |
| Hangar | `/c/:cid/map` (sheet) or `/c/:cid/hangar` (new child route) | none | `ui-v3/screens/Hangar.tsx` (new, K) | derived from the secure set and `data/kaksha/unlocks.json` (new, K) |
| Notebook, Ask, Me | `/c/:cid/{notebook,ask,me}` | as today | restyled under the skin (K, CSS only) | as today |
| Parent | `/parent/*` | `src/parent/**` | stays the adult light surface, with two additive cards (§3.7) | `GET /api/parent/overview` and others |

### 3.1 Open (Home)

**Layout:**
- Her comms window: 300 × 350 on a phone, 400 × 460 at 1366.
- The greeting. One CTA: Start, or **Continue** when the plan says resume.
- A small dock below with two buttons: *Meri Kaksha* (World) and *Bade log / Grown-ups* (the existing `GrownUps`
  gate).
- No plan card and no topic name (`dc-r4-tutor-model-switches` (4)). The topic is the parent's.

**States map from `PlanState`:**

| state | what Home shows |
|---|---|
| `start`, `first` | Start |
| `resume` | Continue (`/lesson/<id>`) |
| `done` | Start stays. Her line acknowledges today's session; a second session is allowed unless `capped` |
| `capped`, `resting` | no CTA. Her face at rest and one calm line. The World stays reachable |
| `safety_hold` | the existing hold screen, unchanged (`home.hold.lines`, 1098 / 14416) |
| `offline` | the existing offline line |

**Kept from today:**
- the `hello` redirect for a first-time child;
- the `data-testid` hooks `primary-card`, `start-lesson`, `continue-lesson` and `grownups`, so the e2e harnesses
  `e2e-design-b2` and `child-routes-db` keep passing.

### 3.2 Intake: "aaj school mein kya hua?"

**The flow** (TUTOR-MODEL §2): arrive (1 turn) → intake (≤ 3 child turns, ≤ 90 s) → decide (code) → plan.

**UI states, all in the Desk's Face layout** (`TeacherWindow` large):
1. **asking:** her caption, word-lit.
2. **listening:** the duplex meter from 4B's `src/duplex/**` state, and the label "Listening". Three quiet fallback
   chips: today's two timetable subjects, "Test hai" and "Homework". A typed field is always reachable.
3. **heard:** the child's words as a right-aligned "you" panel. This is the existing `AnswerTray` text, restyled.
4. **mapped:** the *school se joda* card shows the trail (class · subject · today) and the topic title in a lock-on
   frame.
5. **plan:** 3 nodes with **no titles on the agenda strip** (TUTOR-MODEL: 3 dots, no titles). The prototype's node
   labels Samjho / Tum karo / Khelo become the spoken plan only. The chips are "Haan, chalo" and one alternative.

**What K needs from 4A** (an additive `// r4-4A` block in `shared/contracts.ts` `UiDirectives`, which 4A owns):

```
intake?: { phase: "ask"|"listen"|"heard"|"mapped"|"plan";
           mapped?: { topicId: string; title: string; trail: string[] };
           plan?: { segments: Array<{ purpose: string }> };
           chips?: string[] }
```

- The title and trail come from the syllabus graph, never from a model's free text.
- Until 4A lands, the intake card stays hidden and the Desk behaves as today.

### 3.3 Lesson (the Desk under the Kaksha skin)

**Stream 2 owns `src/child/lesson/**`.** K never edits it. K needs one patch (K-P2 below): Desk adds
`data-skin={skin}` on its root and `data-zone` attributes on the four zones. Kaksha then styles it from
`src/ui-v3/skin/desk.kaksha.css`, which targets only those attributes.

| Desk zone | Kaksha look |
|---|---|
| `TeacherWindow` (Face layout) | the comms frame: chamfered, kesar rim while she speaks, lit warm ground (§5) |
| `SpeechRow` (Work layout, 80 px) | the compact comms frame: 92 × 108 on a phone |
| `Caption` | Space Grotesk 19-22 px; the current word in `--k-her` (phrase-level, as today) |
| `WorkTray` / `Board` | the mission board: dark panel, a 32 px grid masked to the centre, ink in `--k-ink`, her arcs in `--k-her`, the child's mark in `--k-move` / `--k-secure` / `--k-look` |
| `AnswerDock` | the only lamp carrier (L-LAMP), in `--k-move` |
| step progress | segment bar of beats (stream 2's beat plan), with the checkpoint segment in plasma. Beats only, no score |

**The checkpoint chip:**
- It is the announced checkpoint from SketchMind (`r4p-sketchmind-checkpoints-binary`): take the chip, not the
  binary check.
- It needs a board card kind `checkpoint` from stream 2 (its card vocabulary).
- The grading stays covert and typed against verified keys. The chip is presentation only.

**Look-again:**
- The mark turns `--k-look` and the parts count up 1-2-3.
- No red, no buzzer. The face stays verdict-neutral.

### 3.4 Game launch (Briefing) and play: the G1 and G2 engines, no duplicate game code

**Path today:** WorkTray Studio stage → `PlayStudioRenderer` → `PlaySession` → `PlayStage`.
- G1 adds `src/play/engines/registry.ts` and `core3d` (`mountStage3D`) with E1 Antariksh.
- G2 adds `src/play/engines/khand/**`.

**Kaksha adds a single pre-mount Briefing card**, with no engine code:
- **Title:** the engine name (Antariksh / Khand) and the mode in mono (for example "Mine sweep · number line").
- **Build recipe** (3 lines). Each line is read from data the engine already has, never invented:
  - "starts where you slipped: marks or parts" ← `level.focusMal` (law generator, G1);
  - "lines in 3, 4 and 6 parts" ← the level params summary;
  - "look: blue nebula · pace: calm" ← `DressedSpec` (G1 dress delta).
- **Hold-to-launch:** a 650 ms fill. Releasing early drains it. Enter or Space launches at once (accessible).
- **The warp:** about 900 ms of star streaks plus a flash, then the engine's first frame. With reduced motion it is a
  200 ms fade (CORE-API §7).
- **A next tile** (for example Khand) only when the plan already holds it. It is never a menu.

**Where the Briefing lives** (K-P3 patch to G1): `PlayStudioRenderer` takes an optional
`briefing?: (spec, start) => ReactNode` slot.
- When it is present, it renders the Briefing in the same box before `PlaySession` mounts the engine.
- `prefetch(ids)` warms the engine chunk during the Briefing.
- When it is absent, behaviour is today's.

**In play:**
- Her **micro-face pip** (64 × 72) and caption sit in a HUD strip at the top of the box, using the existing play
  caption (`CORE-API §3`) and FaceSlot `size="pip"`.
- The engine's DOM labels, controls (`commit` → "Daago" / "Fire") and audio bus are G1's. Kaksha styles none of
  them beyond the play art pack G1 owns.

### 3.5 End (Debrief)

**Data:**
- **"What you did":** up to 3 lines from `GET /api/lesson/summary` (the best moments it already returns), each
  with a mint tick.
- **"Now secure":** only skills that crossed to `secure` in the ledger **this session**. In practice that is a
  delayed re-check that passed, never today's first success (the delayed check is the truth).
  - The source is the same truth the map uses (`server/reports/truth.js` `loadTruth`). It is read through
    `GET /api/child/map` after the lesson ends and diffed against the map fetched at lesson start; this is the
    v1 client diff.
  - A server field is better and is patch K-P5 to main: `secure_since` per skill on `/api/child/map`.
- **"Opened":** the Hangar item and settlement structure that skill opens (§4), with the dock / rise animation.
- **"Tomorrow":** the re-check line ("2 minutes: is 2/3 still there?"), from the plan's due reviews.
- **Her closing line:** from the runtime's last teacher turn. Nothing is scripted by K.

**No points anywhere.** The session minutes count up as a fact (from the summary), not as a score.

### 3.6 World ("Meri Kaksha") and the Nagar settlement: see §4

### 3.7 Parent

The parent surfaces stay **adult and light** on `src/styles/tokens.css`. The game skin is the child's, and the
parent's job is evidence.
- **Unchanged:** `Gate`, `Home` with "How do we know?", `Progress`, `Lessons`, `Report`, `Controls`, and the safety
  lines in `src/parent/Pages.tsx:395-407` (1098 / 14416) and `src/app/Shell.tsx:24-25`.
- **Two additive cards on `Home`** (patches to the parent file owners, K-P6). Both are optional and hidden when the
  data is absent:
  1. **"What happened at school, in Riya's words"**: the child's intake utterance and the mapped topic (shown to the
     parent per `dc-r4-tutor-model-switches` (4)). Needs `overview.lastIntake` from 4A or main (server patch,
     consent-gated like memory).
  2. **"Riya made"**: Khand build artefacts (G2 persists builds as artefacts). Shown as a thumbnail.
- Parent copy stays English (G-EN-1). The safety strings are not touched.

---

## 4. World: the orbit, the settlement, the Hangar

**Truth source:** `GET /api/child/map` returns `MapState` per skill: `not_started | practising | got_it | secure`.
- When `learning_profile` consent is off, it returns `hidden: true`. The World then shows the planet and the Hangar
  only, with no stations: identity without the academic record.
- **The World is a pure function of the map:** `world = f(mapSkills, catalog)`. The same input always draws the
  same world, so nothing can be lost.

### 4.1 Orbit layer

- One ring per subject, in the subject's ring hue. Each `secure` skill is a **station** (a diamond) on its ring.
- `got_it` skills show as a faint moving point on the ring, never a station. `practising` and `not_started` are
  invisible: no locks, no empty slots, no counters.
- **The night side's city lights** are proportional to the count of secure skills: 9 lights per station, with a
  deterministic seed per skill id.
- **"Aaj / Kal":** "Kal" is `secure_since < today`; "Aaj" adds today's secured skills with the dock animation
  (1.4 s ease-out scale-in plus a mint label).
- **Tap a station** to open a sheet: the skill name, when it became secure, and what it opened.

### 4.2 Settlement layer (the Nagar idea, folded in)

**On the planet's day side,** an isometric settlement on a small plateau (the Nagar engine from
`docs/design/round4/app/nagar/src.html`: `iso()`, `box()`, `dome()`, `building()`, ported to TypeScript, about
6 KB). Each secured skill raises **one structure that embodies the idea**.

**The catalogue `data/kaksha/structures.json`** maps a skill id or family to a structure kind:

| skill (family) | structure | why it embodies the idea |
|---|---|---|
| equivalent fractions | baoli (stepwell) | equal steps |
| angles | jantar | a ramp at a measured angle |
| primes | minar | indivisible |
| multiples | bazaar rows | rows in a pattern |
| fractions on a line | pul (bridge) | equal spans |
| magnets | windmill | the force drives it |
| summary (language) | pustakalaya (library) | the idea held in a book |

- The full table is authored per family by K and reviewed by the main session.
- A skill not in the catalogue raises a plain house in its subject's hue.

**Rules, enforced by test (§8):**
- A structure exists if and only if its skill is `secure`.
- Placement is deterministic by skill id (a fixed grid order), so the settlement never rearranges.
- Nothing decays, and absence changes nothing.

**On a phone,** the settlement is a second view of the World (a segmented "Kaksha / Basti" switch), not a squeeze of
both into 360 px. At 1366 they sit side by side.

### 4.3 Hangar (collections)

- **`data/kaksha/unlocks.json`** maps each skill to one cosmetic: a ship hull, a jet trail, a board theme, or the
  comms-frame rim.
- An item is **opened** if and only if its skill is `secure`. It is never bought, never random and never taken away.
- **Not-yet items** show as greyed silhouettes with "Opens when secure: <skill>". There are no padlock icons and no
  totals.
- **Equipping** an item is identity, not reward:
  - v1 keeps the equipped choice in `src/child/prefs.ts` (device);
  - v2 is a server pref (main-only patch, a `child_prefs` column).
- **Equipped hulls and trails reach Antariksh** through G1's dress: K-P4 adds a `cosmetics?: { hull?, trail? }`
  field read by the Antariksh view only. **It never changes the law, the level or the grade.**

---

## 5. The Asha slot contract

Kaksha mounts her only through the existing `<Teacher>` (`src/ui/teacher/Teacher.tsx`, owned by stream 5) or the v3
`FaceSlot` adapter (`src/face-puppet/adapter.tsx`, owned by stream 5). **Kaksha never imports `src/face-puppet/**`
internals.**

| slot | size, phone / 1366 | framing | `<Teacher>` props |
|---|---|---|---|
| Home comms window | 300 × 350 / 400 × 460 | medium | `floor="idle"`, `label="none"` (Kaksha draws the name and "AI teacher" tag), `ground="lit"`, `lights="up"` |
| Intake | 100% × min(38 vh, 300) → 22 vh once mapped | medium | `floor` from the runtime |
| Lesson SpeechRow | 92 × 108 / 300 × 340 | close | `floor` from the runtime |
| Play pip | 64 × 72 | close | `form="live"` on tier 3d, `"still"` on 3d-lite and 2d |
| Debrief | 72 × 84 | close | `floor` from the runtime |

**Rules:**
1. **One live face at a time.** Off-screen and hidden slots render the still poster (`form="still"`). The prototype
   ran five live rigs; the product must not.
2. **The lit ground.** Both packs (`r8` today, `lamp1` behind `TAXILA_FACE_LOOK`) were cut against a cream clear
   colour, so on a dark ground their edge halos show.
   - Kaksha always sets the comms window's ground to a warm lit gradient (`#F4D3A0` → `#D9A877` → `#9C6E55`).
   - This needs **K-P1**, a patch to stream 5: `ground?: "lit"` on `<Teacher>` and on `FaceSlot`, which sets the
     rig's clear colour to match.
   - Until 5's look switch lands, r8 is live and lamp1 stays on hold behind its switch. Kaksha works with both and
     is screenshot-tested with both.
3. **Status is the runtime's floor** (`faceStatusOf`: speaking / listening / thinking / your_turn). Kaksha adds no
   status.
   - The kesar rim appears while `floor ∈ {speaking, showing}`.
   - The face itself stays verdict-neutral; the frame never celebrates a right answer.
4. **The "AI teacher" tag is always visible** wherever her name shows (safety floor: never deny being an AI).

---

## 6. Motion spec

**General rules:**
- Every motion has a reduced-motion form (`prefers-reduced-motion`, the child's Me setting, `data-motion`). The
  learning consequence still shows.
- **Easing:** `--e-out: cubic-bezier(.16,1,.3,1)` and `--e-snap: cubic-bezier(.3,1.4,.4,1)`.
- **View Transitions:** `document.startViewTransition` where supported, with a plain swap otherwise. One shared
  element name, `asha`, and only one live at a time.

| moment | spec | reduced motion |
|---|---|---|
| boot (Home) | rise 18 px + blur 6 → 0, 900 ms, 80 ms stagger over 4 items | fade 150 ms |
| screen change | old: 350 ms fade, scale .985, blur 4. New: 550 ms rise 14 px | crossfade 150 ms |
| Asha's window between screens | VT group `asha`, 700 ms `--e-out` (Home → Intake → Lesson) | instant |
| camera (starfield) | 3 parallax layers (z .15 / .35 / .7) ease toward the per-screen offset at 4% per frame | static stars |
| CTA | 2 px key travel on press (120 ms); a light sweep every 3.6 s, Home only | no sweep |
| caption | per-word opacity .18 → 1 in time with her audio clause onsets (`stagecraft/reveal.ts`); the current word in kesar | words appear whole |
| board ink | stroke-dash draw 0.3-1.1 s per stroke, pop-in 550 ms spring for labels, in step with the beat's cue | strokes appear drawn |
| checkpoint chip | rise 500 ms; the square blinks at 1.2 s steps(2) while waiting | static |
| plan lock-on | corner brackets 12 px → 8 px, 500 ms; nodes fill one by one, 260 ms apart | static |
| hold-to-launch | 650 ms linear fill; release drains in 220 ms | press = launch |
| warp | 220 streaks, about 950 ms, a white flash in the last 25% | 200 ms fade |
| dock (World / Debrief) | scale .3 → 1 over 1.4 s; the new lights pulse mint for 3 s | appear |
| settlement raise | scaleY 0 → 1 with a spring over 1.6 s, 10 sparks, scaffold fading at 55% | appear |
| sheet | translateY 110% → 0 over 450 ms | instant |
| sound | procedural, ≤ 400 ms, success-proportional; nothing plays under her voice (G1 audio bus ducking) | unchanged (sound is not motion) |

---

## 7. Performance budgets (a ₹10k Android phone)

**Reference:** the owner's phone (O-R4) when it is named. Until then a Helio G35-class proxy at 360 × 800, DPR 2,
CPU ×4 throttled, labelled as a proxy.

| budget | bar |
|---|---|
| Kaksha shell JS added to the child bundle | ≤ 45 KB gzip (World and Hangar lazy, ≤ 30 KB more) |
| fonts added | Space Grotesk latin ≤ 25 KB; nothing else (Geist Mono and Mukta already ship) |
| Home first paint of Start | ≤ 1.5 s on 4G (cold, cached shell ≤ 0.8 s) |
| screen transition | ≤ 600 ms end to end; ≥ 50 fps p50 during it on the proxy |
| starfield | ≤ 2 ms JS per frame p95. 120 stars at DPR ≤ 1.5 on low tiers (260 on high). **Paused** in Lesson and Play (the Desk and the engine own the frame) and whenever `document.hidden` |
| World canvas (orbit) | ≤ 4 ms per frame p95 at 360 px; drops to 30 fps after 10 s idle; stopped when the screen is not visible |
| settlement SVG | ≤ 600 nodes; static after the raise animation (no rAF loop) |
| backdrop-filter | only on tier `3d`; tiers `3d-lite` and `2d` (G1 `detectTier`) use opaque panels (`--k-panel` at .94) |
| live faces | 1 at a time (§5) |
| memory | the shell adds ≤ 25 MB JS heap on the proxy |

**The governor:** reuse G1's tier (`detectTier`) and the face's tier (`src/avatar/tier.ts`). Kaksha steps the
starfield and blur down by the same ratchet. It never steps back up in a session.

---

## 8. Strings, i18n and lint

- **One table:** `src/ui-v3/copy.ts` `K(hinglish, en, hi)`, the same shape as `src/play/copy.ts` `L(...)`.
  - It is chosen by `chromeLang`: `"en"` by default (G-EN-1), Hinglish and Hindi when K-O1 reverses it.
  - Her spoken words and captions never come from this table. They come from the runtime in `language_pref`.
- **Kaksha's own nouns** (Kaksha, Hangar, the station, the structure names) are labels in all three columns.
  - In English mode, the Hindi nouns (Kaksha, baoli, jantar) stay as proper nouns in Latin script. That passes
    L-HING only if the main session adds them to its allowlist (**K-P7**, `scripts/lint-ui.mjs` is main-only).
  - Otherwise use English: "My orbit", "stepwell".
- **The v3 WORDS list already bans "Grown-ups" and "garden"**, which today's child copy uses. Kaksha uses
  "Bade log" in Hinglish and "For parents" in English, and has no garden.
- **New Kaksha lint rules** in `src/ui-v3/lint/rules.mjs`, owned by K:
  - **K-NOLOCK:** no padlock glyph or `lock` icon name in `src/ui-v3/screens/{World,Hangar}`.
  - **K-NOCOUNT:** no "N of M", "x/y" or percent near a collection or settlement.
  - **K-ECON:** no points, coins, XP, streak or level-up words. This extends WORDS and the logic lint in §8.1.
- **Floors:** text ≥ 14 px, Devanagari ≥ 16 px, targets ≥ 44 px. Checked by K's port of
  `docs/design/round4/app/_src/lint.mjs` into `tests/r4-kaksha-lint.test.mjs`, a Playwright harness kept out of
  `npm test` like the other e2e harnesses. A unit-level size check stays in `npm test`.

### 8.1 Economy logic lint (over logic, not copy; `dc-r4-gamification-b`)

`tests/r4-kaksha-economy.test.mjs` checks:
- `world(map)`, `opened(map)` and `structures(map)` are pure. A property test over random maps checks
  monotonicity: removing a non-secure skill or adding time never removes a station, item or structure.
- No `Date.now()` or time arithmetic in the unlock or world modules (no decay, no absence effects).
- No randomness except a skill-id seed (no `Math.random` in unlock or world paths).
- Equipping is free and reversible, and never gates a lesson or a game.

---

## 9. What changes and what stays

**Changes** (behind `ui.kaksha`, default off until §11):
- Child Home, the World and Map, the new Hangar, the end screen, the Briefing and in-play HUD styling, the skin of
  the Desk, Notebook, Ask and Me, the fonts, and the tokens in `src/ui-v3`.

**Stays:**
- The router tree. `ChildShell`, band and family logic. The Desk layout solver (`deskLayout.ts`) and every zone's
  behaviour.
- The lesson runtime (`src/lesson/**`), duplex (`src/duplex/**`) and the face runtime.
- Play truth: laws, the server grade, signed evidence and the ledger.
- The safety strings and floor: `server/director/safety.js`, `server/compiler/floor.js`,
  `src/lesson/safetyStrings.ts`, HelpSheet, Pause and the hold screen.
- The parent surfaces, except the two additive cards. Onboarding, except styling of the child-facing steps.

**Retired when the flag goes to 100%:** `child/screens/Home.tsx`'s tile grids (`YoungTiles` / `OlderTiles`,
`MadeForShelf` moved to the parent) and the Garden / Sky map (`child/progress/{Garden,SkyMap}`), kept as the
`ui.kaksha=off` path until then.

---

## 10. Ownership: stream K (on `claude/r4-app-design`) and its patches

### 10.1 Stream K owns (may edit)

- `src/ui-v3/**`: tokens, primitives, screens (Home, World, Hangar, EndOfLesson / Debrief, Briefing), skin CSS
  (`skin/desk.kaksha.css` and the play HUD), `copy.ts`, flag, lint. This takes over the unowned folder.
- `data/kaksha/**` (K0 ships one `catalog.json` holding both the structures and the Hangar items)
- `public/fonts/space-grotesk-latin.woff2` (+ the OFL notice line)
- `tests/r4-kaksha-*.test.mjs`, `tests/prod/r4-kaksha-*.mjs`
- `docs/design/round4/app/**` (this spec and its successors), `docs/design/round4/build/kaksha/**`,
  `context/inbox/r4-kaksha.json`

### 10.2 Patch requests K sends

Each goes to `docs/design/round4/build/kaksha/patches/NN-*.diff` with an `APPLY.md` line.

| # | file (owner) | change | proved by |
|---|---|---|---|
| K-P1 | `src/ui/teacher/Teacher.tsx`, `src/face-puppet/adapter.tsx` / `stage.ts` (5) | `ground?: "lit"`; the rig clear colour follows it | shots r8 and lamp1 on `--k-void`, no halo (pixel test on the alpha edge) |
| K-P2 | `src/child/lesson/Desk.tsx` and `LessonScreen.tsx` (2) | `data-skin` on the Desk root, `data-zone` on its 4 zones; `LessonScreen` mounts the Debrief component when `ui.kaksha` is on | `tests/round3-fix` and `ui-v2-*` unchanged; Kaksha desk shots |
| K-P3 | `src/play/PlayStudioRenderer.tsx` (G1) | optional `briefing` slot before mount, plus `prefetch` during it | play tests unchanged; Briefing → engine first frame ≤ 1.2 s after launch on the proxy |
| K-P4 | `src/play/engines/antariksh/**` (G1) | read-only `cosmetics` in the dress for hull and trail tint | law, level and grade replay byte-identical with and without cosmetics |
| K-P5 | `server/routes/child.js` (main) | `secure_since` per skill on `/api/child/map` | a unit test on `buildMap` |
| K-P6 | `src/parent/Home.tsx` (no stream owns it, so main) and `server/routes/parent.js` (main) | the "in her words" intake card and the "made" card, consent-gated | `e2e-design-b3-parent` and `w2a-parent-truth` unchanged |
| K-P7 | `scripts/lint-ui.mjs` (main) | allow `src/ui-v3/tokens.css` raw hex; the K-O1 chrome switch; the Kaksha proper nouns in L-HING | `tests/ui-v2-lint` |
| K-P8 | `src/child/routes.tsx` (5) | `/hangar` route and the `ui.kaksha` element switch on index and `map` | `child-routes-db`, `e2e-design-b2` |
| K-P10 | `server/routes/account.js` + `server/ui/kaksha-cohort.js` (main) | the server-side owner cohort (`TAXILA_UI_KAKSHA`) on /api/me; production clients honour `?ui=kaksha` only inside it | `tests/r4-kaksha-cohort.test.mjs` |
| K-P9 | `src/app/routes.tsx` (main) | nothing if K-P8 suffices; otherwise mount `V3Root` inside `ChildMode` behind the flag (cf. the unapplied `docs/design/reset/prework/rs1/patches/01-router-ui-v3.patch`) | route tests |

### 10.3 Where K sits in the merge order

The order is **5a → 2 → G1 → G2 → 4A → 4B → 3 → 5b → K**. K starts now on the current base with the flag off. It
can land early slices, because each slice depends only on merged seams:

| slice | what | needs merged first | ships |
|---|---|---|---|
| K0 | tokens, fonts, primitives, Home (Start only), World orbit and settlement, Hangar (pure over `/api/child/map`), lint and economy tests | nothing new (5a for the single teacher) | flag off, owner cohort |
| K1 | the Desk skin (K-P2) plus Debrief | 2 | owner cohort |
| K2 | Briefing, play HUD, cosmetics (K-P3, K-P4) | G1 (and G2 for Khand) | owner cohort |
| K3 | intake UI (§3.2) and the duplex listening state | 4A (intake directives), 4B (duplex state) | owner cohort |
| K4 | lit-ground face (K-P1), lamp1 shots, perf pass on the reference phone | 5b / the look switch, O-R4 | everyone, after §11 |

---

## 11. Acceptance (for flipping `ui.kaksha` beyond the owner cohort)

1. **Lint:** `tests/r4-kaksha-lint` (Playwright, 360 × 800, 412 × 915, 1366 × 768, both families, both themes, all
   `chromeLang` columns that are on) finds 0 text < 14 px, 0 Devanagari < 16 px, 0 targets < 44 px, 0 contrast
   fails and 0 overflow. `scripts/lint-ui.mjs` adds no finding over its baseline (353).
2. **Economy:** `tests/r4-kaksha-economy` is green (§8.1). The copy lint is green.
3. **Safety:** a scan test shows the 1098 / 14416 lines still present on HelpSheet, Pause, the hold screen, the
   parent pages and the adult footer, and identical to base. The "AI teacher" tag sits on every slot that shows her
   name. `w2i-safety` and the adversarial suite are unchanged.
4. **Truth:** Debrief's "Now secure" equals the ledger diff on 20 scripted sessions with real delayed checks.
   0 false "secure" (`tests/prod/r4-kaksha-truth.mjs` on a TEST branch).
5. **Perf:** §7 budgets on the proxy (labelled), then on the owner's phone (O-R4).
6. **Look:** the same blind two-family judge harness as U1 (`docs/design/round4/app/_src/judge.mjs`) on the
   **product's** screens. Bars, as model judges, advisory:
   - childish ≤ 1 on both families;
   - cool ≥ 4 on both;
   - ranked against the U1 prototype no worse than 5 / 10.
7. **People:** the owner looks at it on the owner's phone and says go. If the owner approves it, the five-second child test
   (TEARDOWN §3.2, 20 class 4-5 and 20 class 7-8, girls included) runs before 100%. Its result can fire the
   `dc-r4-app-kaksha` reversal.

---

## 12. Owner decisions: answered 2026-10-10 (`dc-r4-kaksha-k-o-answers`)

- **K-O1:** G-EN-1 stands.
  - `CHROME_LANG` is fixed to `"en"` in code, and there is no child-facing language switch.
  - The Hinglish and Hindi columns may sit dormant in `copy.ts`.
  - Kaksha, Antariksh, Khand and Asha are allowed proper nouns.
  - Structure names and verbs are English: stepwell, Settlement, For parents, Fire.
- **K-O2:** Kaksha Dawn for the Young family, dark for the Older family. Keyed on the band **family**
  (`src/child/band.ts`), never the raw class.
- **K-O3:** the reference phone stays the owner's call. Every performance number is labelled a G35-class proxy
  until then.
- **K-O4:** `ui.kaksha` never goes beyond the owner cohort without the five-second child test. The owner arranges the
  children and consent.
- **§4.3:** the equipped choice stays per child, keyed by cid. The server pref lands before 100%.

**K0 deviations from this spec, each recorded in RESULTS.md:**
- **Tokens:** a scoped layer (`src/ui-v3/kaksha/tokens.{ts,css}`, root `.v3.kx`) rather than a retune of the v3
  Night/Day tokens. The unrouted v3 screens and their tests keep working, and the one-volt lint stays per system.
- **Catalogue:** one `data/kaksha/catalog.json` instead of two files.
