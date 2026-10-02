# Taxila product design spec (build-ready, v1)

**Date:** 2026-10-02 · **Status:** the design contract for the UI build workstreams. Where this file and a sibling doc disagree, this file wins, and §0.2 says why.
**Scope:** every surface of Taxila: landing, parent onboarding and consent, child picker, child first run, child home, live lesson, practice, progress, parent corner, WhatsApp report, settings, system screens. Web (PWA) and Android (Capacitor APK), portrait budget phones first, landscape tablets and laptops second. Classes 1-9, ages ~6-15, Hindi / Hinglish / English, shared family phones, Helio G35-class devices, patchy data.

**Synthesised from (read for evidence; this file does not repeat it):**
`kids-ux-ages.md` (bands, targets, timeouts, S1-S10) · `lesson-arc.md` (phases P0-P7, four-state floor model, Director `ui` contract) · `ui-teardown.md` (call-screen anatomy, dp budgets, pointer deixis, landscape split) · `visual-identity.md` (colour, type, illustration, motion, tokens) · `motivation-without-rewards.md` (Bagiya, Aasmaan, protégé, milestones) · `parent-experience.md` (PX rules, WhatsApp report, PTM, controls) · `onboarding-flow.md` (P0-P8, C1-C6, R1-R2) · `low-end-offline.md` (tiers, budgets, voice ladder, packs, shared phone). Each sibling ends with a `## Critique`; every MUST/BLOCKER item in those critiques is applied here or explicitly overruled in §0.2. Upstream: `../learning-science.md` (no reward economies, no streak guilt, choice offers, teach-back, retrieval openers, place by level, parent sees all) and `../../harvest/gurukul.md` §6 (4-state rule, one "your turn", 11 px floor for adult text, motion and contrast gates, copy gate, honest waits).

**Evidence tags:** **[V]** primary source read (here or in the sibling, which is named) · **[X]** computed by a script in this folder · **[S]** secondary · **[M]** prior knowledge, verify before it gates · **[I]** design inference; every [I] number that matters names the measurement that replaces it (§10) · **[U]** untested assumption.
**New this pass:** `product-design-contrast.py` (0 failures; ring, focus, caption bar, chip, status-pair CVD checks) [X], and WCAG 2.2 normative text for 1.4.2, 1.4.4, 1.4.11, 2.1.4, 2.2.1, 2.4.11, 2.4.13, 2.5.2, 2.5.7, 2.5.8 [V w3.org], Android 14 non-linear font scaling up to 200% [V developer.android.com], Android 48 dp touch-target guidance [V developer.android.com], WhatsApp template header types (text, image, video, GIF, document, location; **no audio**), body ≤ 1,024 chars, ≤ 10 buttons [V developers.facebook.com].
**Honest limits:** nothing here has been seen by a child, a parent, a TalkBack user or a real budget phone. Every size, timer and duration is a starting value. Copy notes are **shapes, never lines**: anything sentence-shaped in a prompt gets recited (repo law), so nothing in this file may be pasted into `compile()`.

---

## 0. The spec on one page

1. **One product, two people, three channels.** The child uses child mode (the APK's default). The parent uses WhatsApp (primary, push), the Parent corner (depth, pull, PIN-gated), and a monthly voice PTM. Web mirrors both.
2. **The lesson is a classroom, not a phone call.** She is already present when the lesson opens. There is no ring, no self-view camera, no red hang-up. One living teacher, one module canvas, one chalk ledge, one caption line, one control bar.
3. **Geometry changes only at phase boundaries** (P0, P2 and the break use Face; P1 uses Teach; P3 and P5 use Work; P6 uses Duo; P7 uses Close). Within a phase, state changes, never layout. Budgets are in dp and solved for a **584 dp floor** (360 × 640 phone) and a 744 dp comfortable case (§3.3).
4. **Four states, carried four ways.** YOUR TURN, LISTENING, THINKING, SPEAKING are derived from events. Each state has a teacher pose, a glyph, a sound rule and an accessible name; colour is the last carrier, never the only one. The marigold ring appears only in YOUR TURN, on exactly one element, with a darkened `#7A4800` ring (4.23:1 against its own fill [X]).
5. **Tap-to-talk is the default for every band** on a loudspeaker. Open mic is opt-in for B3-B4 and only on a headset or after an echo probe passes. "Tap instead" is present from turn one. "Phir se" (say it again) is one tap, always.
6. **Captions follow reading level, and are always available.** R0: an icon strip (replay, slower). R1: one or two words lit at her pace. R2: a plain one-line subtitle, on by default. A child-reachable captions-always switch overrides all of it.
7. **Human in voice, timing and memory; illustrated in face.** The 2D teacher is the launch face for every band. The `StageFrame` holds a 3D head later, gated by a stylised-vs-realistic test with a pre-registered stop rule. Older children may shrink or hide the face from day one.
8. **Two families of looks.** Young (B1 6-7, B2 8-9): rounded, picture-first, spoken-first, no text-only anything. Older (B3 10-12, B4 13-15): a flatter, quieter fork with Mukta display type, no press ledge, an optional board skin, explainer notes instead of a protégé creature, and real numbers. The child may move up a band, never down.
9. **No reward economy and no meters.** No points, coins, badges, streaks, unlocks, calendars or in-lesson progress bars. Progress is a monotone, absence-invariant map of the same ledger the parent sees (Bagiya garden for Young, Aasmaan sky for Older, with a list view as the source of truth).
10. **The teacher's face never keys to correctness.** Warm-attentive for right and wrong alike; delight only on insight and effort events, at constant magnitude. The verdict is in her words and in the concept-shaped payoff.
11. **The parent sees evidence, not reassurance.** Every claim has "Kaise pata?". State words are gender-neutral and Devanagari-first: अभी नहीं · अभ्यास में · आ गया · पक्का. Home shows three things. The WhatsApp body carries the full facts; the image is a convenience.
12. **The floor phone is the design target.** Tier C (Helio G35, 4 GB) gets the same teacher drawn as a flipbook, the same meanings, a 120 KB cold path, a 1 s local first sound, and a voice ladder where every rung is still her voice. Cellular defaults to data saver until bytes are measured.
13. **Accessibility is a contract, not a section.** Tap twins for every drag, pointer-up commit with pointer-down feedback, two-tone focus, 200% text survival, a full tap-and-type-only lesson, captions-always, haptic YOUR TURN, a timing multiplier (§7.1).
14. **Safety is on every rung.** The helpline sheet (Childline 1098, Tele-MANAS 14416 [M: re-verify at launch]) is pre-rendered in every pack, reachable from the pause sheet on every voice rung including offline, and raised automatically by the crisis predicate.

### 0.1 What this spec does not decide
- Teacher name, wordmark script (तक्षशिला vs टैक्सिला) and price: owner calls.
- Legal-mode gating (DPDP Rule 10 VPC): built behind `vpc.enabled=false` per the 2026-10-02 owner directive; not designed further here.
- Pedagogy inside a phase (Director moves): `voice/indian-teacher-discourse.md` and `lesson-arc.md` §5 own it.

### 0.2 Resolution ledger (sibling conflicts and how this spec settles them)

| # | conflict | settled as | why |
|---|---|---|---|
| R1 | lesson-arc §3 layout shares in % vs ui-teardown §5 dp budgets at 744 dp | dp budgets solved at 584 dp (floor) and 744 dp; interpolation rule; micro layout under 584 (§3.3) | the % table sums to ~117% of 800 dp [X arithmetic, lesson-arc critique C1]; 744 is a best case (ui-teardown critique C1) |
| R2 | L2↔L3 switch every micro-cycle (lesson-arc) vs "hold one layout per phase" (critique) | geometry changes only at phase boundaries; P3 teaches in Work (L3) so her pointing lands on a large canvas | reflow jank on tier C; pointing needs canvas area (Pi et al. 2019 via ui-teardown) |
| R3 | B1-B2 single tap auto-closing at the 900 ms endpoint, B3-B4 open mic (kids-ux, lesson-arc) vs tap-to-talk for all on speakerphone (three critiques) | tap-to-toggle default for all bands on loudspeaker; end-of-speech ramp Young 3 s / Older 2 s with a visible draining ring; open mic opt-in on headset or after EchoProbe (§3.9) | echo and siblings on shared loudspeaker phones; children pause mid-thought; `voice-turn-config` 900 ms was synthetic, n=1 |
| R4 | karaoke captions on by default for Young (kids-ux) vs off for R0 (kids-ux critique) vs on for every band (ui-teardown and lesson-arc critiques) | defaults by reading level (R0 icon strip, R1 word highlight, R2 subtitle on); captions-always is one child tap away and set at onboarding | text is noise for R0 readers; captions are an access need for deaf children and noisy rooms; both hold |
| R5 | exact karaoke timing (kids-ux) vs no word timestamps on the WebRTC lane (ui-teardown) | word highlight ships only if the transcript-lead experiment E-8 shows ≥ 150 ms lead, or the lane moves to Voice Live; otherwise a static phrase line | a highlight that drifts from her voice teaches the wrong word |
| R6 | evaluative faces in her next turn (ui-teardown, visual-identity) vs correctness-keyed affect is a social reward (two critiques) | `ReactionGate`: same face program for right and wrong; delight only on insight and effort events, constant magnitude | farmable face, and a face change leaks the covert check |
| R7 | progress stones in the lesson top bar (kids-ux, lesson-arc, ui-teardown) vs collection meter (four critiques) | no in-lesson progress meter. Young: nothing (she says where we are). Older: the current phase word beside the skill name | a filling path is a goal-gradient bar; TIDRC advises against progress bars for the young |
| R8 | parent gate: 4-digit PIN (parent-experience) vs device credential (kids-ux) | guardian PIN is the default; "use phone lock" is an option; consent-grade actions re-authenticate by OTP with an off-device or 24 h delayed recovery (§6.2) | on shared phones children often know the unlock pattern; the OTP lands on the child's device |
| R9 | auth: email + password (ARCHITECTURE §2) vs phone + OTP (onboarding, parent-experience) | phone + OTP primary, manual code entry first-class, WhatsApp/SMS autofill as enhancement, "send to another phone" fallback; email optional for receipts | WhatsApp is the parent channel; 85 of 256 BYJU'S low-star reviews mention OTP [V script] |
| R10 | "Mehnat" counted effort (parent-experience) vs NM-9 and the Goodhart critique | one descriptive sentence about one real, cited event per week; no tallies, no week-on-week effort deltas | a counted effort row is a hidden points system |
| R11 | state words "Seekh rahi / kar sakti hai" (parent-experience) | gender-neutral set: Abhi nahi · Abhyaas mein · Aa gaya · Pakka, Devanagari-first per the language tile; a re-check date on the Aa gaya chip | "seekh rahi" is wrong Hindi for a boy; low maternal literacy favours Devanagari and voice |
| R12 | child sees state words (motivation: "4 of 6 pakka") vs child surfaces never render them (lesson-arc critique) | Young never sees the words (plant shapes only). Older sees the same words as the parent on its own PIN-able map | teens audit their own evidence (respect framing); young children would collect them |
| R13 | review-due bird from FSRS retrievability (motivation) vs absence invariance | bird and re-check ring render only from a server-written `recheck_scheduled` row | R depends on elapsed time, which breaks T2 and gate MW-G2 |
| R14 | protégé capability props, bed name boards, "Mummy ne dekha" chip (motivation) | dropped from v1; reactions relayed once in speech at the next lesson start; no persistent chip | surprise drops, badges in disguise, visible absence of approval |
| R15 | protégé creature for every band (lesson-arc) vs babyish for 10-15 | B1-B2 protégé; B3 opt-in; B4 explainer notes ("for a friend who missed class") with text, voice or draw | mockability for Class 7-9 |
| R16 | Baloo 2 display in every band (visual-identity) vs Older fork (critique) | Young display Baloo 2; Older display Mukta 700; tier C/D use Mukta only | a children's-app face at 14; saves 148 KB on the Older path |
| R17 | `chalk-mark #F2CF6B` underline for the newest ledge chip | removed; a white chalk underline (shape, not hue) | it is a pale marigold, ΔE 6.7 from `turn` under deuteranopia [X sibling probe] |
| R18 | parent surface on Noto Sans "zero bytes" (parent-experience) | parent surface uses Mukta 400/600, already bundled for the child surface; `sans-serif` + `lang="hi"` fallback | system fonts are not reliably addressable from a WebView; no new bytes needed |
| R19 | minSdk 29 hard block with an "update WebView" page (low-end) | APK minSdk 29; Android 8/9 and old WebViews get the PWA lite bundle (older syntax target, tier D defaults) as a supported path | the hand-me-down phone group is the target group |
| R20 | FrameGovernor never steps up mid-lesson (low-end) | steps down on p90 > 25 ms for 3 s twice within 30 s (system overlays excluded); may step back up at an item boundary after 20 s under 16 ms | one GC pause should not cost a whole lesson |
| R21 | camera for doubts (lesson-arc critique: photo of a textbook problem) vs no camera in v1 (ui-teardown) | v1 doubts are typed, spoken, or picked from the NCERT exercise index; a parent-enabled notebook still photo is v2 | no child camera stream; DPDP §9(3) risk |
| R22 | memory consent row preselected (onboarding P5) | explicit equal-weight choice, never preselected | the trust page has just promised the opposite of a dark pattern |
| R23 | Class 5-9 transcripts "on request" vs "parents see all" | parents always see all learning evidence including ≤ 25-word quotes; only the verbatim full transcript sits behind a request for Class 5-9, and opening it is disclosed to the child | removes the contradiction while keeping teen candour |

---

## 1. Information architecture and route map

### 1.1 Surfaces and modes

```
CHILD MODE (APK default, web /who)            PARENT CORNER (PIN)              WHATSAPP (push)          VOICE / PRINT
/who  profile picker                           /parent  Home (3 things)         weekly report (utility)  monthly PTM call
/c/:cid  home ── lesson ── practice           ├─ child switcher (one at a time) milestone ≤ 1/week      printable monthly card (PDF)
        ├─ map (Bagiya | Aasmaan | list)       ├─ syllabus · evidence · lessons  safety / account /
        ├─ notes (notebook | explainer)        ├─ PTM · controls · family        payment (never off)
        ├─ doubt (B3-B4)                       ├─ data · saved lessons · plan
        └─ me (settings, what parents see)     └─ help, grievance, helplines
PUBLIC (web): /  landing · /trust · /privacy · /leaving (bridge page)
FIRST RUN: /start/*  parent onboarding (P0-P8) → handover → /c/:cid/hello (C1-C6) → /start/summary (R1-R2)
```

- **One APK, two modes.** Child mode is the default after setup. The Parent corner sits behind the guardian gate (§6.2). The parent's door is a small, dull icon top-right on child screens (Sesame: non-enticing) [V via kids-ux].
- **Identity is a child-scoped token, never the URL.** `:cid` routes the view; the server checks that the token's child id matches. A profile tap mints the token (§7.6).
- **Navigation depth:** Young ≤ 1 level below home (every child screen has a house icon home); Older ≤ 2; Parent corner uses a bottom tab bar on phones (Home · Syllabus · Lessons · More) and a left rail on desktop.

### 1.2 Route map

| route | screen (§) | who | gate | offline | notes |
|---|---|---|---|---|---|
| `/` | Landing (§2.1) | visitor parent | none | static, cached | web only; the APK opens `/who` or `/start` |
| `/trust`, `/privacy` | Trust page, notice | anyone | none | bundled | reachable from every parent screen |
| `/start/lang` → `meet` → `taste`? → `phone` → `trust` → `verify`* → `consent` → `child` → `controls` → `handover` | Parent onboarding P0-P8 (§2.2) | parent | slide-and-hold at `phone` | P0-P1 bundled | *`verify` exists only with `vpc.enabled`; state persisted per field |
| `/start/student` | teen-installed edge flow | child 13+ | none | n/a | ends at a parent WhatsApp link |
| `/start/summary` | R1 placement summary + R2 report day | parent | (still in setup) | cached | first WhatsApp card sent here |
| `/who` | Child picker (§2.3) | child | picture-PIN (B1-B2, optional) / 4-digit PIN (B3-B4, optional) | yes | shown on cold start and after > 5 min in background |
| `/c/:cid/hello` | Child first run C1-C6 (§2.4) | child | token | diagnostic pack | band-skinned |
| `/c/:cid` | Child home (§2.5) | child | token | cached | Young: "Aaj ka paath"; Older: study home |
| `/c/:cid/lesson/:lid` | Live lesson (§3) | child | token | degrades to L3/L4 | the core screen |
| `/c/:cid/practice/:sid` | Practice, "Abhyaas" (§2.6) | child | token | yes (pack) | tap/typed; clips; local grading |
| `/c/:cid/doubt` | Doubt (§2.7) | B3-B4 | token | no | typed/spoken or NCERT exercise picker |
| `/c/:cid/map`, `/c/:cid/map/:skill` | Bagiya / Aasmaan / list, skill detail (§8) | child | token (+ child PIN) | cached fold | list view always available |
| `/c/:cid/notes` | Protégé notebook (Young) / Explainer notes (Older) (§8.6) | child | token | cached | |
| `/c/:cid/me` | Child settings + "what your parent can see" (§2.8) | child | token | yes | captions-always, quiet mode, look, world, PIN |
| `/parent` | Parent Home (§6.3) | parent | guardian gate | last-good cache | deep links from WhatsApp land here |
| `/parent/:cid/syllabus`, `/parent/:cid/skill/:skill` | Syllabus map, Kaise pata? (§6.4-6.5) | parent | gate | cache | evidence sheet is deep-linkable |
| `/parent/:cid/lessons`, `.../lessons/:lid` | Lessons, per-lesson card (§6.6) | parent | gate | cache | spoken summary first |
| `/parent/ptm` | Monthly PTM (§6.8) | parent | gate | no | live voice, AI-disclosed |
| `/parent/controls`, `/parent/family`, `/parent/plan` | Controls, Family, Plan & billing (§6.9) | parent | gate; consent-grade rows re-auth | cache | |
| `/parent/data` | View, export, delete (§6.9) | parent | gate + OTP re-auth | no | hold-to-confirm + OTP |
| `/parent/saved` | Saved lessons, data use, storage (§6.9) | parent | gate | yes | never importable from child routes |
| `/parent/help` | Help, grievance, helplines | parent | gate (helplines also outside it) | bundled | |
| `/leaving?to=` | "You are leaving Taxila" bridge | anyone | parent gate for child mode | n/a | every external link |
| native `errorPath` | WebView too old → "use Taxila in your browser" (§2.9) | child, then parent | none | bundled | first screen is one picture + a spoken hand-to-a-grown-up shape |

### 1.3 Entry and re-entry rules
- **Cold start** → `/who` (or `/start` if no guardian). **Backgrounded > 5 min** → `/who`, regardless of token TTL. **Child token TTL** = the parent's daily cap plus 30 min [I] (replaces the 12 h TTL; low-end critique C-22).
- **Mid-lesson background, phone call or audio-focus loss** → the lesson pauses (mic closed, response cancelled, timers stopped); return shows the resume card (§2.9).
- **Outside allowed hours or past the daily cap** → the child home shows the calm "teacher is resting" state. No countdown, no "come back at", no lock icon.
- **WhatsApp deep link** → `/parent/...` behind the gate; on web it asks for OTP.

### 1.4 API seams per surface (extends ARCHITECTURE §2)
`POST /api/auth/otp/start|verify` (replaces email + password) · `GET/POST /api/children` · `POST /api/lesson/start|turn|end` (`turn` carries the `ui` contract in §3.15) · `POST /api/realtime/token` (minted on `pointerdown` of the profile tile) · `WS /api/lesson/relay` (L1/L2) · `GET /api/packs/:chapter/manifest` (signed) · `POST /api/evidence/sync` (idempotent event ids) · `GET /api/parent/overview` (Home payload ≤ 100 KB) · `GET /api/parent/evidence/:skill` · `POST /api/parent/reaction` · `POST /api/parent/ptm/token` · `POST /api/whatsapp/webhook` (button replies, STOP).

---

## 2. Screens

Each block: **purpose · layout (portrait phone; desktop/landscape) · components · states · copy notes.** Child screens obey the band tokens (§4.2) and the accessibility contract (§7.1); parent screens obey the parent tokens and PX rules (§6.12). "One your-turn" applies everywhere: at most one marigold element per screen.

### 2.1 Landing (`/`, web)
- **Purpose:** let a parent hear her, understand what a lesson is and what they will see, and see the price and the promises, then install or start in the browser. Trust before ask.
- **Layout (phone):** (1) hero: her illustrated face, a large "hear her" button (no autoplay; web needs a gesture), the language switch हिन्दी · Hinglish · English as spoken tiles; (2) "a lesson, in three pictures": warm-up, teaching with a module, the child teaching back, each a still frame with a one-line caption and a 10 s tap-to-hear clip; (3) "what you will see": one sample Kaise pata? card, visibly labelled as an example; (4) price in rupees, what is free, cancel in 2 taps; (5) three promises as icon + line (no sales calls, no loans or EMI, delete anything); (6) primary CTA "Get the app" (Play) and secondary "Use in browser"; footer with grievance contact, privacy, helplines. **Desktop:** two-column hero (face and voice left, promise and CTA right), sections in a 960 px measure.
- **Components:** `VoiceTile`, `ClipCard`, `SampleEvidenceCard` (fixed demo data, "example" label), `PricePanel`, `PromiseRow`, `InstallCTA`.
- **States:** audio blocked (play button only), offline (cached shell with the CTA), Play present on device (CTA says open).
- **Rules:** no testimonials, ratings or outcome numbers until they exist and are consented; no "replaces tutors" claim until delayed-retention results exist; no countdown offers; ≤ 600 KB critical path, ≤ 6 requests [low-end §3].
- **Copy notes:** *aap*, one idea per section, what she does and how the parent will know, plain AI disclosure in the first line of the hero audio.

### 2.2 Parent onboarding (`/start/*`, P0-P8)
Order and timings follow `onboarding-flow.md` §4 and §7 (parent setup p50 ≈ 3 min with VPC off [I, M-ONB-1]). Changes from that doc are in bold.

| step | purpose | layout and components | states and rules |
|---|---|---|---|
| P0 Language + her voice | first audio ≤ 5 s, before any field | 3 `VoiceTile`s; teacher face; small "I am a student" link | **APK autoplay ≤ 3 s once, respects silent mode (else a "tap to hear her" state), visible stop** (WCAG 1.4.2 [V]); **tiles commit on pointer-up, feedback on pointer-down** (2.5.2 [V]); bundled Opus clips |
| P1 Meet her | AI disclosure in sentence 1, to the parent | `TeacherIntro` (clip + transcript + replay); primary "start for my child", secondary "talk to her first (1 min)" | ≤ 20 s; **no auto-advance**; safe for a toddler tapping (no data, no commitments) |
| P1b Parent taste (optional) | value before trust; an adult grants the mic | `TasteSession` with an 8 s connect budget, else the recorded demo, **labelled as a recording** | **offered live only on a good network until M-ONB-1 measures connect p90**; `MicAsk` here |
| P2 Number + OTP | identity for reports | **slide-and-hold "I am the parent" to enter** (stops a young child); +91 field; `NoCallsPromise` beside it; `OtpField` with **manual entry first**, WhatsApp auth template and SMS Retriever as autofill, resend at 20 s, voice call, **"send to another phone"** | number always editable; never clears typed digits; **state persisted per field, restored after process death** (G-ONB-6) |
| P3 Trust page | the promises on record before effort | 3 icon + line promises (price and cancel, no sales calls, delete anything), full text one tap deeper, speaker | reachable from every later screen |
| P4 Verify adult | DPDP Rule 10 slot | `VpcCard` | **off at launch** (`vpc.enabled=false`); G-ONB-1 runs in CI anyway |
| P5 Consent rows | unbundled purposes | ≤ 5 `ConsentRow`s (sentence + speaker + toggle): lessons (required); remember learning across days (**equal-weight yes / only this session, nothing preselected**); remember things she says she likes (off); research (off); report channel (primary "WhatsApp", secondary "app only") | voice-clip retention lives in Controls, off |
| P6 Child profile | six taps, no free text | `NameSayer` (TTS preview, "sahi hai / badlo"); class 1-9 tiles (3 × 3, ≥ 48 dp); board; school medium; home language; *tum / aap* (**parent default *aap* for Class 5-9; the child may override from B3 up**); optional first subject; **optional one-tap "needs larger text or a calmer screen"** (sets comfort mode, never names a condition); **optional "hard to hear" → captions-always** | diagnostic pack (≤ 1.5 MB) downloads now; name greeting cached |
| P7 Controls | safe defaults | one card: guardian PIN (default) or phone lock; daily time and hours prefilled by class; **first-day cap ≥ the length of the child path** | primary accept, secondary change |
| P8 Handover | now or later, both first-class | `HandoverCard` "Abhi" / "Baad mein"; on cellular, a plain MB estimate for the first lesson | "Abhi" warms the realtime session; "Baad mein" leaves the profile on the picker with **no "ready" badge** |

- **Desktop:** a centred 480 px column; the same steps; OTP via WebOTP where supported [M].
- **Edge flows:** teen installs alone → greeting only, then a parent link (`/start/student`); second child → P6 → P8 only; grandparent or guardian → same path.
- **Copy notes:** *aap*; a why-line before every ask (number, mic, verify); rupees and minutes, never %; promises only if the product can keep them.

### 2.3 Child picker (`/who`)
- **Purpose:** the right child on the right profile, every session, in under 2 s.
- **Layout:** a grid of profile tiles (Young size if any profile in the house is Young: ≥ 112 dp), each the child's own chosen picture plus their name; the last child is pre-selected with a confirm step still present. Tapping plays the name aloud with a tick / cross pair (Sesame) [V via kids-ux]. "Add a child" sits behind the parent gate. Parent door top-right, dull. **Desktop:** the same grid, centred, max 4 per row.
- **Components:** `ProfileTile`, `PicturePin` (B1-B2 optional: 3 pictures in order), `ChildPin` (B3-B4 optional, 4 digits, privacy not security), `ParentDoor`.
- **States:** one profile (still shown, so a sibling cannot inherit a session); PIN wrong (no counter, no lockout copy aimed at the child; after 5 tries the tile asks for a grown-up); offline (works; live voice joins later).
- **Rules:** token mint and realtime warm-up start on `pointerdown` of the tile; her first sound is a local pack clip ≤ 1 s after the tap [low-end §3]; a switch tears down the previous child's session, peer connection and socket (G-LE-5). No "ready" badges, counts or progress on tiles.

### 2.4 Child first run (`/c/:cid/hello`, C1-C6)
Two skins on one rung engine (onboarding critique A1, D1).

| step | Young skin (B1-B2) | Older skin (B3-B4) |
|---|---|---|
| C1 hello | she says the child's name from the cached clip ≤ 5 s; the child picks a picture (2 or 3, fixed, never unlockable) | no avatar step; name only; she offers *tum / aap* (the child's answer wins) |
| C2 who I am, who sees | fixed disclosure: a computer teacher, not a person, plus "ghar ke bade can see" as an icon strip (teacher-is-computer badge, eye + adult); one tap on her replays it | fixed plain disclosure and a one-line "what your parent can see" with a link to §2.8 |
| C3 first exchange | interest picture tiles (gender-neutral vetted set, order randomised, no festival or religion tiles) by voice or tap; mic pre-permission card for the parent if not yet granted | 3-4 plain options in text + voice plus "something else, say it" |
| C4 placement | story-framed, ASER-shaped (start one class below for Classes 3-9; the child picks 1 of 2 items; ±1 rung; **one same-skill retry before dropping a rung**; ends on a real success); **numeracy items language-light (`reading_load` none/low below Class 4)**; reading strand with captions suppressed on target text; caps 4 / 6 min | **honest purpose framing**: finding what you already know so she does not waste your time; not marked; nobody sees a score. Real chapter-chain problems; caps 8 / 10 min |
| C5 first win | worked → faded → solo on the first failed rung's smallest step; concept-shaped payoff | same engine, Class 6-9 contexts (money, speed, data) |
| C6 show someone | an invitation to show a grown-up, with a graceful no; never recorded as "did not show" | optional, audience-free ("show whoever is around, or tell me"); the teach-back to her is the evidence |

- **Feedback during C4:** her own varied, content-aware acknowledgement; no fixed chime after every answer (an operant cue). If a "received" earcon is kept for Young it is identical after right and wrong and is A/B tested against none (M-ONB-6).
- **Banned in child copy:** test, exam, pariksha, score, marks for Young; Older strings must include the honest-purpose shape instead (G-ONB-2 split by band).

### 2.5 Child home (`/c/:cid`)
- **Young home ("Aaj ka paath"):** her figure, small and idle; one large ringed tile to start today's lesson (the only marigold); two secondary picture tiles: Bagiya (garden) and Abhyaas (practice, only if a pack is ready). Parent door top-right. No counts, no dates, no "ready" badges, no greeting that names time away. **Desktop/tablet:** the same three tiles in a row under her.
- **Older home (a study tool, not a lesson home; kids-ux critique C1.2):** a header line with the subject and "your class is on" chapter; primary "Continue" with a choose-1-of-3 next topic sheet; secondary rows: Ask a doubt, Quick practice, My map, My notes, and (Class 8-9, when a parent or the child sets a test week) "Test week" as a window, never a countdown. B4 uses a flat list with 8-10 dp radii; B3 may keep card tiles. **Desktop:** two columns (continue + doubt left, map preview right).
- **States:** teacher resting (allowed hours or cap): calm picture, no countdown; offline: lesson tile becomes "practice without internet" if a pack exists, else a neutral note to the parent corner; first day after setup: same home, nothing special.
- **Copy notes:** Young ≤ 4-word labels with a picture, spoken on tap; Older dry and respectful, no "kids", "champ", "topper".

### 2.6 Practice, "Abhyaas" (`/c/:cid/practice/:sid`)
- **Purpose:** short self-paced sets (4-8 items) for offline days, data saver, short slots and siblings waiting. Items come from the due queue or a chosen chapter; never "drill for points".
- **Layout:** the live-lesson Work geometry (§3.3 L3) with her flipbook or still pose and pre-rendered clips, the ledge, the canvas and tiles; no mic glyph when offline; the `recorded` badge.
- **Rules:** graded locally against the pack's verified key (inherited law: a model never grades); evidence queued as `offline-tap`; hint ladder from pack clips; ends after the set or on "stop", with no "one more" offer; counts against the daily cap; for R0/R1, items without clips are not shipped in the pack (pack lint) and the parent sees "audio-only, not ready offline" instead of a silent skip.

### 2.7 Doubt (`/c/:cid/doubt`, B3-B4)
- **Purpose:** what teenagers use tutors for: "help with this problem". A child-initiated short P3-P5 loop on one item.
- **Layout:** step 1 picks the source (type it, say it, or NCERT book → chapter → exercise number from `data/curriculum`); step 2 is the lesson Work geometry with the problem on the ledge; she teaches toward the method, never just the answer (academic-integrity floor); ends with one isomorphic item the child solves alone.
- **Rules:** no camera in v1 (R21); the retrieval opener is skipped but still owed by the scheduler; logged as a child-initiated lesson for the parent card.

### 2.8 Child settings and "what your parent can see" (`/c/:cid/me`)
- **Rows (big, spoken for Young; plain for Older):** captions (always / by reading level), sound effects (Young on, Older off by default), quiet mode (type or tap, earphones; Older), talk mode (tap / open mic when a headset is in; Older), look (2-4 pre-vetted themes and teacher choice, never unlocked: visual-identity critique C6), world (Bagiya / Aasmaan, one tap, ledger kept), face size (Older: face / small / voice and board only), my PIN (Older), comfort (larger text, calmer screen).
- **"What your parent can see"** (Older; also shown at C2): skills and the evidence behind them, short quotes, what you got right and what you are still working on, time spent, and whether full transcripts are visible. Plain list; no secret monitoring.

### 2.9 System screens
| screen | when | design |
|---|---|---|
| Resume card | after a call drop, process death, phone call, > 5 min away (after the picker) | her picture; **continue and stop tiles of equal size and weight**; Older wording is a neutral pause/continue; no praise-guilt shape |
| Leave guard | back gesture or house tap mid-lesson | Young: full-screen tick / cross with the question spoken (≤ 4 words); Older: a standard dialog; never a sad face; exits use `ink`, never red |
| Tap to start | web, audio locked by autoplay policy | one big tile with her face; the tap unlocks one shared `AudioContext` |
| Mic denied | permission denied or permanently denied | the lesson continues in full tap mode with no nag; one later chance in parent settings (deep link to app settings) |
| No sound | speaker dead or volume 0 on the call stream | big volume picture (no numbers) and captions-always switches on for the session |
| Teacher resting | outside hours or over the cap | calm still; no timer |
| WebView too old | native WebView below the floor | screen 1: one picture + a spoken hand-to-a-grown-up shape; screen 2 (parent): open Taxila in the browser (PWA lite), or update "Android System WebView" |
| Help sheet | pause sheet first row; crisis predicate; any rung | helpline numbers as big call buttons, a talk-to-a-grown-up picture, pre-rendered clip in her voice; never behind the connection chip |
| Storage / data (parent only) | free space < 500 MB, cap reached | parent corner cards S-LE4/5/6; nothing on child surfaces |

---

## 3. The live-lesson screen in detail (`/c/:cid/lesson/:lid`)

### 3.1 Layers, back to front
1. **Room:** a static, low-detail classroom corner in `bg`; never animated; Older B4 uses a plain surface.
2. **Teacher stage** (`StageFrame`, §3.5), with the **chalk ledge** (§3.7) at its base in portrait, or above the canvas in landscape.
3. **Module canvas** (`ModuleHost` iframe, §3.6). Answer tiles render here as content, not in the control bar.
4. **Pointer overlay:** transient chalk marks on the canvas (drawn inside the module's own canvas where possible, to save a composited layer).
5. **Turn ring:** the single `YourTurn` element (mic, tile group, choice-card group or module frame).
6. **Caption line** (§3.8).
7. **Control bar:** mic, status glyph, phir-se, tap-instead; for Older also the chip row and the typed field (§3.9-3.11).
8. **Overlays, outside the four states:** pause sheet (with help), leave guard, connection chip and veil (canvas only, never over her face), resume card, system error (the only use of `stop`).

### 3.2 Phase → geometry → ring (the state table the client implements)

Geometry changes **only** at these boundaries (R2). Transitions use `motion.layout` (300 ms, transform/opacity).

| phase (lesson-arc) | geometry | dominant cycle | ring target | mic | ledge | notes |
|---|---|---|---|---|---|---|
| P0 Arrive | L1 Face | S → YT → L | mic (tap-instead beside it) | per mode | hidden | first sound is a local clip ≤ 1 s; full greeting once a day, a short neutral resume if back within the hour |
| P1 Warm-up | L2 Teach | (S → YT → L → T) × 2-4 items | tile group or mic, per item | per mode | item anchor | one cited callback to lesson content; the opener doubles as the identity check |
| P2 Goal + choice | L1 Face | S → YT(cards) | choice-card group | accepts a spoken pick | goal chip | module pre-mounts hidden (tier A-B only); images and video requested here |
| P3 Teach | L3 Work | S ↔ YT, micro-cycles | mic, tile group, or module frame | per mode; "available, unringed" when the ring is on the module | accumulating symbols | she points into the canvas; prediction resolved here |
| Break (B1-B2 required ≥ 20 min; Older offered) | L1 Face | S → YT(ready) | one large ready tile | closed | kept | a seated alternative always; never mid-item; parent may skip for motor needs; no evidence |
| P5 Practice | L3 Work | YT(module) → T → S(short) | module frame; chips never ringed | available, unringed | kept | success band 80-90% Young / 75-85% Older |
| P6 Teach-back | L4 Duo (B1-B2; B3 if chosen) · L3 Work with an "explain" panel (B4, B3 default) | S(protégé clip) → YT → L → T | mic or show-me area | per mode | kept | B4: "for a friend who missed class", text, voice or draw |
| P7 Wrap | L5 Close | S → YT(finish) | finish tile | per mode | hidden | one real success item; her re-voice of the child's words; plain preview |
| Doubt (B3-B4) | L3 Work | short P3-P5 loop | as P3/P5 | per mode | the problem | §2.7 |

S = SPEAKING, YT = YOUR TURN, L = LISTENING, T = THINKING. "Available, unringed": the mic accepts speech but the ring is on the module, because the expected act is a touch. A spoken answer during a TRY-THIS is still an answer and is routed to the Director for that item.

### 3.3 Portrait phone budgets (dp; every column sums to its height)

**Reference heights:** **584** = floor (360 × 640 phone after a 32 dp status bar and 24 dp gesture bar, also the 360 × 650 web viewport after Chrome's bar, rounded down) · **744** = comfortable (360 × 800). Fixed rows grow slightly between them; caption and ledge heights are `min-content` in sp so they survive font scale (§3.8).

**Young (B1-B2).** Fixed rows: top bar 56 (64 dp hit areas reach 8 dp into the inert stage), caption 48 (0 when off, the canvas takes it), control bar 104 at 584 → 120 at 744 (mic hit ≥ 96 dp in both).

| region | L1 Face 584 / 744 | L2 Teach 584 / 744 | L3 Work 584 / 744 | L4 Duo 584 / 744 | L5 Close 584 / 744 |
|---|---|---|---|---|---|
| top bar | 56 / 56 | 56 / 56 | 56 / 56 | 56 / 56 | 56 / 56 |
| teacher stage | 248 / 392 | 168 / 248 | 192* / 168 | 192* / 168 | 192 / 280 |
| chalk ledge | 0 / 0 | 56 / 72 | (56 overlaid)* / 72 | (56 overlaid)* / 72 | 0 / 0 |
| caption | 48 / 48 | 48 / 48 | 48 / 48 | 48 / 48 | 48 / 48 |
| canvas | 128 / 128 | 152 / 200 | 184 / 280 | 184 / 280 | 184 / 240 |
| control bar | 104 / 120 | 104 / 120 | 104 / 120 | 104 / 120 | 104 / 120 |
| **sum** | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 |

\* Below 680 dp the ledge overlays the bottom 56 dp of the stage (a board in front of her); her face zone is the top 136 dp, enough for a close-up face ≥ 96 dp (`stage.faceMin`). From 680 dp the ledge takes its own row.

**Older (B3-B4).** Fixed rows: top bar 48 (skill name · phase word · "AI teacher" label · pause), caption 40, control bar 112 (chip row 48 + input row 56 + 8).

| region | L1 584 / 744 | L2 584 / 744 | L3 584 / 744 | L4 584 / 744 | L5 584 / 744 |
|---|---|---|---|---|---|
| top bar | 48 / 48 | 48 / 48 | 48 / 48 | 48 / 48 | 48 / 48 |
| teacher stage | 240 / 400 | 136 / 216 | 0 (PiP 96 × 120 in the canvas) / 0 | 144 / 200 | 200 / 300 |
| chalk ledge | 0 / 0 | 48 / 56 | 48 / 56 | 48 / 56 | 0 / 0 |
| caption | 40 / 40 | 40 / 40 | 40 / 40 | 40 / 40 | 40 / 40 |
| canvas | 144 / 144 | 200 / 272 | 336 / 488 | 192 / 288 | 184 / 244 |
| control bar | 112 / 112 | 112 / 112 | 112 / 112 | 112 / 112 | 112 / 112 |
| **sum** | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 | 584 / 744 |

**Solver rules (`LayoutStage`):**
- Between 584 and 744, every region interpolates linearly between its two values, rounded to 4 dp, remainder to the canvas. Above 744: the stage gains up to +64 dp, then the canvas. Width ≥ 600 dp in portrait (tablet): the canvas caps at 4:3 and extra height goes to the canvas.
- **Minimums never broken:** targets and tiles at band size, mic hit, caption line, Young canvas 184 (L3) / 152 (L2), Older canvas 192 (L4) / 200 (L2), `stage.faceMin`. When a minimum cannot hold, the stage tightens framing first, then the micro layout takes over.
- **While a choice is live in Young L3** the module collapses to a 56 dp anchor thumbnail and the tile row takes the rest of the canvas (two tiles of 112 dp for B1 plus a 16 dp gap fit the 184 dp floor canvas).
- **Micro layout (container height 480-583 dp, e.g. 320 × 568 phones, split-screen):** top bar 48; canvas fills; the teacher becomes a PiP close-up inside the canvas corner (Young 120 × 144, Older 96 × 120); the ledge becomes a vertical chip rail at the canvas's left edge; the caption becomes a pill over the canvas bottom; when a choice is live the tiles replace the mic in a 104 dp control row. Below 480 dp: rotate prompt (Older) or a "make the window bigger" still (web).
- **Keyboard open (Older typed answer):** the stage collapses to a 40 dp face chip in the top bar; ledge and caption merge into one 48 dp row; the canvas keeps ≥ 144 dp; the input row sits on the keyboard; chips hide until it closes. At 584 dp with a ~280 dp keyboard: 48 + 48 + 152 + 56 = 304 [I].
- **Font scale:** text heights are sp and `min-content`. Up to 1.5× the stage gives up height to the caption and ledge; above 1.5× the stage switches to the large-text layout (teacher PiP, caption two lines). Nothing clips; the mic never leaves the screen (gate PD-G4).

```
L3 Work · Young (B2) · 744 dp                     L3 Work · Older (B3) · 744 dp
┌──────────────────────────────────┐ 56          ┌──────────────────────────────────┐ 48
│ ⌂                         [⏸]    │             │ ← Fractions · seekhna   AI   [⏸] │  phase word, not a meter
│ ┌──────────────────────────────┐ │ 168         │ ┌ ledge  1/3   1/4   >  ───────┐ │ 56
│ │ TEACHER close-up, eye line   │ │             │ └──────────────────────────────┘ │
│ │ 40%, hand points down     [▣]│ │             │  caption line (on by default)    │ 40
│ ├──────────────────────────────┤ │ 72          │ ┌──────────────────────────────┐ │ 488
│ │ ledge  [½]  [roti]           │ │             │ │ MODULE              ┌──────┐ │ │
│ └──────────────────────────────┘ │             │ │ chalk circle on the │ PiP  │ │ │
│  आधा ▁▁ रोटी    (R1 word bar)     │ 48          │ │ part she names      └──────┘ │ │
│ ┌──────────────────────────────┐ │ 280         │ │ ring on the frame = try it   │ │
│ │ CANVAS: module, or           │ │             │ └──────────────────────────────┘ │
│ │ [ tile ≥ 96 ]  [ tile ≥ 96 ] │ │             │ [Hint] [Show me why] [I know] [⋯]│ 48
│ └──────────────────────────────┘ │             │ [type or speak…]  (↻) (mic) ⌨   │ 56
│  (☝ tap)    ( MIC 88 )   (↻)     │ 120         └──────────────────────────────────┘
└──────────────────────────────────┘             ↻ = phir se · status glyph sits on the mic's left
ring on the mic OR the tile group, never both    ▣ = the computer-teacher badge (Young stage corner)
```

### 3.4 Landscape tablet and laptop (split), compact, breakpoints
- **Split (container aspect ≥ 1.0, height ≥ 480 dp):** teacher column left (stage · caption ≤ 2 lines · mic zone 120 dp; chips and typed field for Older), work column right (ledge above the canvas, tiles in the canvas's bottom band), top bar full width. She faces three-quarters right and points into the canvas. A **mirror layout** setting flips it for left-handed children (M-UT-3).

| mode | Young teacher column | Older teacher column |
|---|---|---|
| L1 Face | 60% | 55% |
| L2 Teach | 40% | 34% |
| L3 Work | 30% (min 320 dp) | 24% (min 280 dp) |
| L4 Duo | 30%, her above the protégé | 26% |
| L5 Close | 45% | 40% |

- **Compact split (height < 480 dp: phones in landscape on the web, Older modules that request landscape in the app):** teacher column 28% with a close-up stage ≥ 144 dp; ledge as a vertical chip rail on the canvas's left edge; caption as one pill over the canvas bottom; mic floating bottom-right of the teacher column (Young 88, Older 56); top bar 40.
- **Large screens (> 1600 × 1000):** the stage caps at 1600 × 1000 and the room letterboxes.
- **Family selection:** a `ResizeObserver` on the lesson container writes `data-family="stacked|tablet|split|compact|micro"`; CSS keys off the attribute. Container queries are an optional enhancement only, because the PWA lite path runs on WebViews older than container-query support (ui-teardown critique C7.3). Never viewport media queries for the stage (gurukul rejection: viewport queries cannot see a narrow container).
- **Rotation** mid-lesson re-flows within 300 ms, keeps state and ring target, never restarts her audio. The APK keeps B1-B2 in portrait.
- **Laptop keyboard:** Space = mic toggle, 1-4 = choose a tile, Enter = submit typed answer, R = phir se, H = hint, C = captions, Esc = pause. Single-key shortcuts work only when no text field has focus, and can be turned off or remapped in settings (WCAG 2.1.4 [V]). Hover never reveals anything a touch user cannot reach.

### 3.5 Teacher stage (`StageFrame`)
- **Human in voice, timing and memory; illustrated in face** (kids-ux §0.11, Brink 2019: uncanny feelings emerge after ~9 [V via kids-ux]). Launch face: the 2D Rive teacher for every band. The 3D head (task #6) slots into the same frame on tier A, behind **M-UX-6 with a pre-registered stop rule**: if a realistic variant does not beat the illustrated face on likeability and trust for B3-B4 by the pre-registered margin, the illustrated face ships and the realistic arm closes.
- **Launch cast:** two teacher characters, one woman and one man, each drawn in a Young register (warm older sibling) and an Older register (respected older cousin), each with one fixed voice. B1-B2: the parent picks at P6 with equal weight; B3-B4: the child picks at C1 and can change in settings. A gender-neutral third design follows after the stereotype panel (M-VI-6). Identity anchors per character are constant across bands and tiers (face shape, `skin-3` default for the woman, scarf with the matka block-print border, chalk in hand); non-sexualised by spec (child-safety floor).
- **Framing tightens as the stage shrinks:** medium (L1, L5), medium close-up (L2), close-up (L3, L4, PiP). Eye line at 40% of stage height. `stage.faceMin` (chin to hairline): Young 96 dp, Older 64 dp [I, M-UT-5]. A pointing-hand safe zone faces the canvas.
- **Named gaze targets:** `child`, `canvas`, `ledge`, `protege`, `down-think`, resolved to directions by the layout (canvas = down in portrait, screen-right in split), so neither the Director nor the face programs touch geometry.
- **Older presentation modes (from day one; ui-teardown critique C4):** face · small (PiP in every geometry) · voice and board only (no face; the status glyph and her name with "AI teacher" in the top bar carry presence). The choice is logged as a preference (M-UT-6 then reads real choices).
- **Aliveness:** ≥ 6 head × 6 body idle clips, blinks at random 2-6 s, a 4 s breath; idle sway −50% in YOUR TURN; speech animation stops on the frame of interruption; she performs thinking (eyes up, chalk to chin), never a spinner; the rig is local so she never freezes on bad data.
- **Disclosure, always:** spoken in the first lesson and whenever asked (fixed reviewed copy, never improvised); a persistent non-verbal "computer teacher" badge in the stage corner for Young; the "AI teacher" label in the Older top bar. Not conditional on any test result.
- **Memory and register:** callbacks cite lesson content (a thing made or said in a lesson), never the child's personal life; register is set by band and topic, never widened by rapport or session count (ui-teardown critique C3.2-3.3).

**`ReactionGate` (face programs allowed per state; exhaustive test PD-G7):**

| state | allowed | forbidden |
|---|---|---|
| SPEAKING | lip-sync on the playback clock; prosody beats and brow flashes; armed cues (point, gaze); warm-attentive; **delight only when the Director tags the move `affect: insight | effort`** (self-correction, a new strategy, a teach-back that landed, a comeback), at one fixed intensity, ≤ 1 per 5 turns | any face chosen from correctness, a correct-count or a streak; sad, disappointed or "missed you" faces; expressions improvised from text |
| YOUR TURN | lean-in, expectant stillness, gaze at the ringed element | evaluative faces; pacing loops |
| LISTENING | nods and an attentive face timed to the child's pauses and energy (backchannels), never to content | approval smile, frown, doubtful "hmm" (each leaks a verdict before commit) |
| THINKING | eyes up, chalk to chin; "one moment" hand past 4 s | spinner; any verdict face |
| interrupted | stop on the frame; small attentive reset | finishing the sentence visually |

The same face program plays after a correct and an incorrect commit; the verdict lives in her words and the concept-shaped payoff.

**Pointer deixis (`ui.cues`, ui-teardown §4.3):** when she names a module part, a hand-drawn chalk mark draws on it (draw 240 ms; **holds until her sentence ends or the child acts**, then fades 300 ms; **4-6 px stroke with a 2 px halo**, ≥ 3:1 against every canvas surface, never marigold); her gaze leads it by ~200 ms. Sync source, best first: Voice Live word timestamps → transcript-offset estimate (only if E-8 lead ≥ 150 ms) → fire at audio start. The engine's persistent `highlight` is always the second cue, so the pointer is never the only one. Reduced motion: the mark appears without the draw-on. Each cue also updates the target's accessible description.

### 3.6 Module canvas (`ModuleHost`)

| kind | made by | tiers | budget | must have | offline |
|---|---|---|---|---|---|
| T1 engine (number line, fraction bars, place value, collections, sims) | `src/modules` | all (DOM/SVG ≤ 30 movers, else Canvas2D) | ≤ 30 KB br each | accessible names per part; a tap twin for every drag; keyboard/switch operation; keep-out rect for the PiP; `reading_load` per item | in the pack |
| kit game (Forge) | `factory/` kit | B+ at 30-60 fps; C at a 30 fps cap with heavy archetypes swapped for a T1 engine; never D | runtime ≤ 340 KB gz, precached, never on the cold path | the game action is the skill; runs unskinned for A/B; no points, coins, timers | downloaded into app files |
| diagram / labelled image | SVG, or Forge image (gpt-image-2 on Azure) | all | WebP ≤ 1,024 px (~40 KB) | labels as SVG overlays, never baked in; alt text; diagram palette with a label, shape or pattern per category | cached |
| animation | engine state sequence (Lottie-light on B+) | all (C: stepped states) | | reduced motion → end states; pausable if > 5 s (WCAG 2.2.2) | in the pack |
| video (Forge, Sora) | Forge | B+, never in data saver | ≤ 30 s, ≤ 480p, ≤ 400 kbps | caption track; pause; a non-video fallback for the same idea | only if prefetched |
| story / book page | StoryWeaver (attributed) or commissioned art | all | | book frame; attribution on a parent-reachable credits page | in the pack |

- **Timing:** module and layout changes apply on her first played audio frame of the turn that names them (`apply: at_next_audio`). Images and video are requested at P2 (image generation measured at 23 s [V measurements.md]) and never sit on a spoken turn's critical path; a missing asset is replaced by the engine version, silently.
- **Freeze interaction, not appearance:** while she speaks (Young), the canvas keeps full colour and shows a small hand-off icon; it is inert until it holds the ring or she hands over. Nothing looks tappable unless it is (Sesame) [V via kids-ux].
- **Feedback:** module-local pointer-down feedback ≤ 100 ms in any live state; **commit on pointer-up** inside the hit area (sliding off cancels; WCAG 2.5.2 [V]); correctness only after commit, in her next turn or as the engine's concept-shaped payoff (once, 600-1200 ms, never a loop).
- **Mounting:** tiers A-B pre-mount one reused iframe during P2; tiers C-D mount at the phase boundary and unmount the previous engine (one engine alive at a time).
- **Format offers:** a format may be offered as a cheap choice ("see it or do it", shapes not lines), logged as a preference only; the learning profile adapts formats from delayed outcomes, never from stated preference (learning-science §2.6). **Forge takes `visualBand` as a required input** alongside topic and level, so a Class 7 child on Class 3 fractions gets Older art and contexts (kids-ux critique C1.1).

### 3.7 Chalk ledge (`ChalkLedge`, lesson-arc's whiteboard strip)
- The persistent anchor of the current idea: 1-3 chips, newest on the right, survives turns, carries from P3 into P5, clears at P1→P2 and P6→P7.
- **Young:** first-exposure chips are pictures or numerals; the word appears only after the child has produced it; one script per chip; chips are Baloo 2 `type.board` in chalk on the board.
- **Older:** B3 board by default; **B4 default is a flat strip** (`ink` on `surface`, 1 px `tile-border`), board as an optional skin; Mukta 600.
- **Newest chip:** a white hand-drawn chalk underline (shape, not hue; 10.86:1 on the board [X]). `chalk-mark` gold is removed (R17).
- **Tap a chip:** replays her line about it from the client's teacher-audio buffer (§3.11). Child audio is never buffered.
- Dark mode: board `#22423A` always inside the wooden `board-frame` (the bare board is 1.67:1 on the dark background [X sibling]).

### 3.8 Captions (`CaptionLine`)

| reading level (measured, not class) | default | what shows | timing |
|---|---|---|---|
| R0 not yet reading | captions off | an icon strip: ↻ phir se, 🐢 slower (pictograms, not emoji, in the build) | n/a |
| R1 decoding | on | the current phrase in the school-medium script with **one or two words lit at her pace** (a follow-along cue, not a read-at-speed promise) | word timing per R5; otherwise a static phrase line |
| R2 fluent | on (B3-B4 included) | plain one-line subtitle, current phrase only | phrase-level |
| any + captions-always (child CC icon, onboarding "hard to hear", or parent) | on | the phrase line at the band's caption size | as above |

- **Defaults by band before measurement:** B1 R0 · B2 R1 · B3-B4 R2; downgrade silently (more audio) on evidence, upgrade only on evidence (kids-ux §1). Nothing announces "reading help is on".
- **Script:** the child's school medium (Devanagari for Hindi-medium, Roman for English-medium), English technical terms in Roman inside Devanagari lines, after a script-normalisation step (ASR returns Devanagari for English words; gurukul §3.6). Hinglish lines keep one script per word span, marked with `lang`.
- **Lit word:** same weight as its neighbours, a 2 dp `jamun` bar under the word (8.87:1 on cream, 8.85 on dark [X]), fixed box, no reflow, never marigold (a second your-turn).
- **Line fitting:** current phrase only; the client splits long phrases at clause boundaries from transcript punctuation so a 24 sp Devanagari line never wraps mid-word in portrait. A second line appears only at font scale > 1.3 or in landscape.
- **Text budget, Young:** ≤ 2 text regions on screen at once (caption + one label set; PD-G11). For R1 the caption hides while the module holds the ring, unless captions-always is on.
- **Accessibility:** the visual line is `aria-hidden`; the complete phrase goes once to a polite live region at `audio_end` when a screen reader is active, never word by word.
- **No scrolling transcript on the stage.** The transcript belongs to the parent area. Older bands get a 1-line "heard" chip after their turn (her normalised transcript of what the child said), **persisting until her next turn begins**, tap to fix by typing; Young gets no text echo.

### 3.9 Mic and the four-state status

**The floor model (lesson-arc §4):** either the system holds the floor (THINKING, SPEAKING) or the child does (YOUR TURN, LISTENING). Exactly one state is shown. States come from events, never from literals or timers; timers only escalate inside YOUR TURN.

| state | entered on | teacher body | glyph (beside the mic) | ring | sound | haptic | accessible behaviour |
|---|---|---|---|---|---|---|---|
| **YOUR TURN** | her playback ended on a turn whose `handover` ≠ `chain` | lean-in, gaze at the ringed element, stillness | open hand | marigold `turn` fill + 3 dp `#7A4800` ring (4.23:1 vs fill, 7.23:1 vs cream [X]) + steady glow 0.6 Hz, on **one** element | Young: soft two-note turn earcon; Older: off by default | one 20 ms tick where supported (parent can turn off) | polite announcement of the turn and its target shape ("your turn, pick one" style); focus moves to the ringed element |
| **LISTENING** | `speech_started`, a mic tap, or pointer-down on the ringed element | nods timed to the child's pauses | ear + a level arc whose width follows input level | removed | none | none | mic state "listening" (no announcement) |
| **THINKING** | endpoint/commit, or an answer committed in a module | eyes up, chalk to chin; "one moment" hand past 4 s | three dots | none | none (an optional "received" tick for Young is identical after right and wrong, A/B vs none) | none | state only; past 4 s announce "one moment" once |
| **SPEAKING** | her first audio frame **played on device** | mouth on the playback clock | mouth with a sound mark | none | her voice | none | her phrase announced once at `audio_end` (screen reader only) |

- **Overlays outside the four states:** pause, connection trouble, recorded mode, system error (`stop` brick, hexagon glyph, errors only). Network trouble uses neutral `surface-2` / `ink-2`, never `turn` or `stop`.
- **Status words:** Young, glyph and body only; Older, glyph + one word by default (hideable). Parent replays label every state in words.
- **Why glyphs are mandatory:** `done` vs `stop` is only 13.0 / 14.1 CIEDE2000 under deutan / protan, `listen` vs `think` 14.4 under tritan, `listen` vs brand `jamun` 10.4 under deutan [X]. Colour can never be the carrier.
- **Code alignment:** `src/lesson/status.ts` currently returns `your_turn` whenever nothing is pending. Add a `handoverPending` flag set from `ui.handover` at `teacher_audio_end`; with no pending hand-over the honest state is THINKING (she is about to continue).

**Mic modes**

| mode | who | open | close | realtime config |
|---|---|---|---|---|
| **Tap-to-talk (default, all bands on loudspeaker)** | everyone | one tap (pointer-up) | a second tap, or a local end-of-speech ramp: **Young 3 s, Older 2 s**, extended by 1.5 s after a filler or rising tone, shown as a ring that drains around the mic; hard cap 30 s Young / 60 s Older | `turn_detection: null`; clear on open; `commit` + `response.create` on close (L0-T) |
| Open mic (opt-in) | B3-B4 | always open | server VAD | `voice-turn-config` (threshold 0.6, 900 ms, pending real child audio) |
| Hold-to-talk | never required | | | long-press is banned for Young; hold is optional for Older only |

- **Open mic is offered only** when the output route is a wired or Bluetooth headset, or after a 10 s `EchoProbe` (her clip played on speaker with the mic open; pass if no self-transcript) [I, M-LE-6]. Two `EchoGuard` flags in a lesson drop to tap-to-talk for the rest of it.
- **Barge-in:** tap mode: tapping the mic while she speaks stops her (cancel + truncate) and enters LISTENING. Open mode: `speech_started` interrupts (measured 7-260 ms cancel [V measurements]).
- **"Tap instead" is always present** (a finger-tap pictogram left of the mic, every band, from turn one). It brings up the item's tiles or the typed field. Using it is a modality preference, never a miss, and never down-weights evidence. After one misrecognition the tiles appear by themselves; she never says she did not understand twice.
- **YOUR TURN escalation** (× the child's timing multiplier 1 / 1.5 / 2, set by the parent and adapted from the child's own latency; × the LinkSupervisor amber stretch):

| band | glow intensifies | verbal re-entry (narrows, never louder, never names the silence) | tap options |
|---|---|---|---|
| B1 | 4 s | 8 s | ~15 s |
| B2 | 4 s | 10 s | ~15 s |
| B3-B4 | 6 s | ~12 s, only if the child has not started | on request or after one miss |

At most two verbal re-entries. The 8 s vs 5-6 s disagreement between sibling docs is settled by M-UX-4, with code-switching children analysed separately.

- **Holdover guard:** ignore a tap that lands where the previous button was within `max(400 ms Young / 250 ms Older, 2 × the device's measured input-to-paint latency)` after a screen change.
- **No mic at all** (denied, broken, or parent-set tap-and-type profile): the full lesson runs in tap mode at full fidelity; every step has a no-mic completion path (PD-G9).

### 3.10 Choice offers and Older chips
- **`ChoiceOffer` (P2 and elsewhere):** 2 (B1), 3 (B2), 3-4 (B3-B4) options, picture-first for Young, spoken; the ring sits on the **group frame** (one element); a spoken pick is accepted. Choices are cheap and real (context skin, protégé on first use, sub-goal order, pace, next topic of 3), 2-4 across a lesson, each logged as a preference, never evidence. Core content is never a choice ("skip review?" is banned).
- **Older chip row (never ringed, ≥ 48 dp):** `Hint` (next ladder rung, child-initiated) · `Show me why` · `I know this` (starts a 2-item check, never a silent skip) · `⋯` (Explain differently · Slower · Skip for now; skipped items return through the scheduler). Max 4 visible chips.
- **Young:** no chip row; hints come from her after the timeout; a single "help" gesture is tapping her.

### 3.11 Phir se (say it again)
- **Control:** the ↻ ear-arrow pictogram in the control bar (all bands; also the verbal request, which the Director handles as a REPEAT move).
- **First tap:** exact replay of her last turn from the client's teacher-audio ring buffer, instant, works offline. Buffer: last 3 turns, ≤ 60 s and ≤ 2 MB on tier C, oldest dropped first [I]. Teacher audio only; child audio is never buffered or replayed.
- **Second tap within 10 s:** "slower and simpler": a Director REPEAT-SLOW move in her own voice with fewer words (live rungs), or the slower pack clip (L3/L4). Never a pitch-shifted playback of her voice.
- **Status during replay:** SPEAKING (replay); the mic is tappable to interrupt; YOUR TURN timers restart after it ends.
- **Ledge chips** replay her line about that chip. In R0 the caption strip's ↻ and 🐢 icons are this control.
- Replays are a passive signal only: never shown to the parent as a count and never lower mastery alone.

### 3.12 Waits, stalls and the voice ladder (UX side; engineering in §7.4)

| elapsed with no audio | what the child sees |
|---|---|
| < 1 s | nothing |
| 1-4 s | THINKING pose |
| 4-8 s | Young: her "one moment" hand + soft earcon; Older: a named phase with elapsed time counting up |
| 8-20 s | the current item switches to tap mode from the pack (offline card) while the link recovers |
| > 20 s, or the link is dead | recorded mode (L3/L4): the `recorded` badge, her pack clips, tap tiles, no mic glyph; a pre-rendered clip in her voice explains once |

- The connection veil covers the canvas only, never her face. Rung changes happen only at a turn boundary, never while SPEAKING, except when the link is dead.
- **Connection chip** (L2 and below only): `surface-2` fill, `ink-2` glyph + a text word + her clip; Young also gets a picture; Older never gets toy art (no walkie-talkie). Copy names our connection, never the child, the phone or the plan.

### 3.13 Interruptions, leaving, ending
- **Audio-focus loss, backgrounding, incoming call:** the pause overlay; the Director clock and YOUR TURN timers stop; mic closed; response cancelled; resume at the last turn boundary; evidence in the interrupted window is marked low-confidence. No background microphone service, ever.
- **Leaving early:** "I have to go", or house + confirm → one skippable closing line card and stop, even mid-derivation. She never offers "one more"; a child's own request for one more is allowed within the cap. Next time resumes through retrieval, never "where we left off" suspense.
- **Daily cap reached mid-lesson:** finish the current item, then a neutral pause in her voice that never names the child's usage.
- **Profile mix-up:** "I didn't do that" during P1 → she asks once who is there (a shape, not a line); a "not me" action sits on the lesson's first screen; evidence in the first 2 minutes is low-confidence until the opener passes.

### 3.14 Safety on the stage
- The pause sheet's first row is **help**: helpline call buttons, a talk-to-a-grown-up picture, and a pre-rendered clip in her voice. It exists on every rung, including L4 offline, and is never behind the connection chip.
- The crisis predicate runs on every input path (L0 realtime tool + server predicate; L1/L2 on the decoded transcript; L2-C on STT output; L3 on typed input; L4 none, the static sheet only) and raises the help sheet itself (PD-G24).
- She never promises secrecy; safety alerts go to the parent path in §6.10, suppressed for the family-member branch by the safeguarding rule.

### 3.15 Director ↔ client contract (extends `/api/lesson/turn` `ui`, lesson-arc §8 and ui-teardown §4.3)

```ts
ui: {
  phase: 'P0'|'P1'|'P2'|'P3'|'BREAK'|'P5'|'P6'|'P7'|'DOUBT';   // set only by the Director
  layout: 'L1'|'L2'|'L3'|'L4'|'L5';                            // changes only when phase changes (PD-G3)
  handover: 'question'|'choice'|'try'|'cued'|'invite'|'chain'; // → ring target, client-computed
  affect?: 'neutral'|'insight'|'effort';                       // ReactionGate input; never 'correct'|'wrong'
  whiteboard: { id; kind: 'symbol'|'term'|'number'|'picture'; text?; picture?; script; replayTurnId }[];
  choices?: { id; picture; label; audio }[];                   // ≤ choices.max for the band
  cues?: { when: 'audio_start'|'word'|'audio_end'; match?: string[]; act: 'point'|'gaze'|'face';
           target?: string; style?: 'circle'|'underline'|'arrow'; program?: string }[];
  protege?: { clipId; pose };                                  // pre-rendered kit clip, never generated text
  apply: 'at_next_audio'|'now';
  budget: { phaseElapsed; phaseMax; lessonCap };               // the Director, not the client, moves on
}
```
- **Client owns:** event → state machine, ring placement from `handover` + state, YOUR TURN escalation, pointer-down feedback and pointer-up commit, holdover guard, layout solver and family, device tier, caption mode, phir-se buffer, offline card, EchoGuard.
- **Director owns:** phase, layout, items, probe schedule, success band, break placement, wrap, `affect` tags, REPEAT moves, spoken-turn caps (`speech.turn.maxWords` 15 / 20 / 30 / 40 **and** seconds caps 6 / 8 / 12 / 15 s by band, checked per turn on the transcript, PD-G21).

---

## 4. Design tokens, typography, motion, sound, icons

### 4.1 Token file (single source: `src/styles/tokens.css`, mirrored to Android resources by a build step; raw hex lives only here, PD-G13)

```css
:root {
  color-scheme: light;
  /* neutrals (kids-ux 4.3) + a light surface-2 (new, 6.39:1 for ink-2 [X]) */
  --bg:#FFF8EE; --surface:#FFFFFF; --surface-2:#F1E8D9; --ink:#1F1A14; --ink-2:#5A5148;
  --tile-border:#8C8478; --dusk:#E9E1D2;
  /* status: the only colours that carry meaning, always with a glyph (3.9) */
  --turn:#FFB21E; --turn-ring:#7A4800;            /* ring darkened from #9A5B00: 4.23 vs fill, 7.23 vs bg [X] */
  --listen:#2563C9; --think:#5B6470; --done:#1F7A4D; --stop:#B3261E;   /* stop = system errors only */
  /* brand + material (chalk-mark removed, R17) */
  --jamun:#5B2E91; --jamun-soft:#EFE6FA; --board:#1F3B30; --board-frame:#8C6B4A; --chalk:#F5F2E8; --chalk-2:#BFD3C6;
  /* diagram: ModuleHost only; every category also has a label, shape or pattern */
  --d1-neel:#2A72C6; --d2-matka:#C2410C; --d3-neem:#0B5E50; --d4-baingan:#3F2272; --d5-haldi:#946B0E; --d6-kajal:#3A3631;
  --int-pos:var(--d3-neem); --int-neg:var(--d2-matka);          /* always with the + / - glyph */
  /* skin ramp: illustration only, never themed, never filtered */
  --skin-1:#F3D2B3; --skin-2:#E2B48C; --skin-3:#C99366; --skin-4:#A9744A; --skin-5:#8A5634; --skin-6:#5F3A22;
  /* progress worlds (motivation 12): shape carries state, colour second */
  --grow-plot:#8C8478; --grow-leaf:#2F7A3E; --grow-flower:#A8326E; --grow-fruit:#5B2E91; --grow-ring:#1F7A4D; --grow-visitor:#2563C9;
  --sky-panel:#0F1A33; --sky-star-0:#7383A6; --sky-star-1:#8FA6D6; --sky-star-2:#C9D8FF; --sky-star-3:#FFFFFF;
  --sky-edge:#6276A3; --sky-label:#F6F1E8;
  /* focus: two-tone ring, best tone >= 3:1 on every ground tested [X] */
  --focus-inner:#1F1A14; --focus-outer:#FFFFFF; --focus-w:2px; --focus-offset:2px;
  /* pointer deixis */
  --pointer-w:5px; --pointer-halo:2px; --pointer-draw:240ms; --pointer-fade:300ms; --gaze-lead:200ms;
  /* families (4.3) */
  --font-display:"Baloo 2","Mukta","Mukta-fb",sans-serif;  /* Young */
  --font-text:"Mukta","Mukta-fb",sans-serif;
  --font-reader:"Andika","Mukta",sans-serif;
  /* space: 4 dp base */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:24px; --space-6:32px; --space-7:48px; --space-8:64px;
  /* radii */
  --radius-xs:6px; --radius-sm:10px; --radius-md:16px; --radius-lg:24px; --radius-pill:999px;
  /* elevation: blur-free */
  --ledge-surface:#E6DCCB; --elev-press:0 4px 0 var(--ledge-surface);      /* Young tiles only; decorative */
  --elev-card:0 1px 2px rgba(31,26,20,.10), 0 2px 8px rgba(31,26,20,.08); /* tier A-B only; C-D use a 1px border */
  /* motion */
  --dur-press:100ms; --dur-fast:150ms; --dur-base:240ms; --dur-layout:300ms; --turn-pulse:1.6s; --milestone-max:1500ms;
  --ease-standard:cubic-bezier(.2,0,0,1); --ease-enter:cubic-bezier(0,0,0,1); --ease-exit:cubic-bezier(.3,0,1,1);
  /* net + ptt (low-end 12) */
  --net-chip-bg:var(--surface-2); --net-chip-fg:var(--ink-2);
}
/* band tokens: written by the app as data-band on <html>; values in 4.2 */
:root[data-band="b1"] { --hit-min:64px; --tile-min:112px; --gap:16px; --mic:96px; --radius-tile:24px; --dur-base:240ms; }
:root[data-band="b2"] { --hit-min:64px; --tile-min:96px;  --gap:16px; --mic:88px; --radius-tile:20px; --dur-base:240ms; }
:root[data-band="b3"] { --hit-min:48px; --tile-min:64px;  --gap:8px;  --mic:64px; --radius-tile:16px; --dur-base:160ms;
                        --font-display:"Mukta","Mukta-fb",sans-serif; --elev-press:none; }
:root[data-band="b4"] { --hit-min:48px; --tile-min:64px;  --gap:8px;  --mic:56px; --radius-tile:10px; --dur-base:160ms;
                        --font-display:"Mukta","Mukta-fb",sans-serif; --elev-press:none; }
/* dark: Older bands only, chrome only; default light; the in-app toggle writes data-theme (old WebViews ignore the media query) */
@media (prefers-color-scheme: dark) { :root:is([data-band="b3"],[data-band="b4"]):not([data-theme="light"]) {
  color-scheme: dark; --bg:#16140F; --surface:#221F19; --surface-2:#2C2821; --ink:#F6F1E8; --ink-2:#BDB4A6;
  --done:#4CC38A; --listen:#7FB0FF; --think:#9AA3AF; --stop:#FF8A80; --jamun:#C3A6F5; --board:#22423A; --board-frame:#A07E5A;
  --elev-card:none; --elev-press:none; /* --dusk, diagram, skin, sky unchanged: modules and art stay on --dusk */ } }
:root:is([data-band="b3"],[data-band="b4"])[data-theme="dark"] { /* same values as the block above */ }
@media (prefers-reduced-motion: reduce) { :root { --dur-press:1ms; --dur-fast:1ms; --dur-base:1ms; --dur-layout:1ms;
  --pointer-draw:1ms; /* the turn ring becomes a static 5px ring, no glow: the cue survives */ } }
@media (prefers-contrast: more) { :root { --tile-border:var(--ink); --surface:var(--bg); } }
@media (forced-colors: active) { /* rings and ledges are outline/border, never box-shadow, so they survive */ }
/* parent surface (parent-experience 13, ratios computed there); font switched to Mukta (R18) */
[data-surface="parent"] { --p-bg:#FFFBF5; --p-ink:#1F1B16; --p-ink-2:#5A5148; --p-ink-3:#6B6158; --p-pakka:#1E6B47;
  --p-learning:#2F5DA8; --p-yourturn-text:#8A4B00; --p-yourturn-fill:#FFD27A; --p-alert:#B3261E; --font-text:"Mukta",sans-serif; }
```
- The `turn` ring is drawn with `outline` or `border`, never `box-shadow`, so forced-colours mode keeps it; it stays in dark mode for shape constancy.
- `--ledge-*` and `--elev-press` are decorative and flagged so lint rejects them for text or borders.
- Parent `--p-yourturn-fill` and child `--turn` never share a screen (ΔE 8.4-10.5 [X]).

### 4.2 Band size and timing tokens (kids-ux §4.1 values; [I] rows are provisional until the named measurement)

| token | B1 | B2 | B3 | B4 | basis / replaced by |
|---|---|---|---|---|---|
| `hit.min` (dp) | 64 | 64 | 48 | 48 | Anthony 2013, NN/g [V]; M-UX-1 |
| `tile.answer.min` | 112 | 96 | 64 | 64 | [I] M-UX-1 |
| `gap.target` | 16 | 16 | 8 | 8 | Sesame [V] |
| `mic.size` (visual; hit ≥ `hit.min`, Young hit ≥ 96) | 96 | 88 | 64 | 56 | [I] |
| `radius.tile` | 24 | 20 | 16 | 10 | [I] M-UX-5 (a hypothesis, not a finding) |
| `choices.max` | 2 | 3 | 4 | 4 | [I] |
| `speech.turn.maxWords` / `maxSeconds` | 15 / 6 | 20 / 8 | 30 / 12 | 40 / 15 | [T] 41-53 words unprompted; [I] seconds |
| `timeout.glow` / `reprompt` / `tapOptions` (s, × multiplier) | 4 / 8 / 15 | 4 / 10 / 15 | 6 / 12 / n/a | 6 / 12 / n/a | Sesame 3-8 s [V]; M-UX-4 |
| `eos.ramp` (end-of-speech, s) | 3 | 3 | 2 | 2 | [I] M-LE-15 |
| `holdover.guard` (ms) | max(400, 2 × input latency) | same | max(250, 2 ×) | same | Anthony heuristic [V]; M-UX-2 |
| `press.maxTap` | 5 s | 5 s | 5 s | 5 s | TIDRC [V] |
| `stage.faceMin` | 96 | 96 | 64 | 64 | [I] M-UT-5 |
| `ledge.h` / `caption.h` / `topbar.h` | 72 / 48 / 56 | same | 56 / 40 / 48 | same | ui-teardown [I] |
| `motion.base` | 240 ms | 240 ms | 160 ms | 160 ms | gurukul tokens |
| `session.default` | 10 min micro (hard stop 12) | 30 min or 2 × 15 | 30 or 45 | 30 or 45 | [I] M-ARC-1, M-ARC-7 |

### 4.3 Typography

**Roles.** Young display: **Baloo 2** 600-700 (800 only ≥ 32 sp). Older display: **Mukta 700** (R16). Text, everywhere including the parent surface: **Mukta** 400/600. English early-reading tasks in B1-B2: **Andika** (single-storey a and g). Hind is excluded from maths (no `tnum`); Kalam and Annapurna are not adopted (visual-identity §4.2) [X].

| token | B1 | B2 | B3 | B4 | weight | leading (Latin / Deva) |
|---|---|---|---|---|---|---|
| `type.display` | 36 / 38 | 32 / 34 | 28 / 30 | 26 / 28 | 700 | 1.2 / 1.45 |
| `type.title` | 28 / 30 | 26 / 28 | 24 / 26 | 22 / 24 | 600 (Older 700) | 1.25 / 1.5 |
| `type.numeral` (modules, `tnum`) | 40 | 36 | 32 | 28 | 700 | 1.1 |
| `type.board` (ledge chips) | 28 / 30 | 26 / 28 | 22 / 24 | 20 / 22 | 600 | 1.3 / 1.5 |
| `type.caption` | 22 / 24 | 20 / 22 | 18 / 20 | 16 / 18 | 400; the lit word keeps 400 | 1.35 / 1.6 |
| `type.body` | 20 / 22 | 19 / 21 | 17 / 19 | 16 / 18 | 400 | 1.4 / 1.6 |
| `type.label` | 20 / 22 | 18 / 20 | 16 / 18 | **16 / 18** (kids-ux had 15 / 17, below its own floor) | 600 | 1.3 / 1.5 |
| `type.reader` (Andika) | 28 | 24 | | | 400 | 1.5 |
| parent body / meta | 16 / 18 · meta 13 Latin, 14 Devanagari (dates, state chips and the home task stay at body size) | | | | 400 / 600 | 1.5 / 1.6 |

- **Floors:** child text ≥ 16 sp Latin / 18 sp Devanagari; parent body 16 / 18; gurukul's 11 px is not used anywhere in Taxila.
- **Devanagari rules (PD-G14):** `lang="hi"` on every Hindi span (Baloo 2 and Mukta ship Hindi and Marathi forms) [X]; no letter-spacing, justification, faux italic or underline; single-line boxes ≥ 1.3 em with no `overflow: hidden` (stress strings span 1.17-1.36 em [X]); maths numerals always `tabular-nums`; international digits by default; avoid conjunct-heavy words in B1 labels where a plainer word exists.
- **Font scale:** text sizes and line heights in sp (Android 14 scales text non-linearly up to 200%; sp for text and line height, never for padding [V developer.android.com]). The native shell passes the system font scale into the WebView text zoom [M: verify `WebSettings.setTextZoom` behaviour on Android 10-15]. The lesson stage adapts as in §3.3; every other screen honours up to 200% (WCAG 1.4.4 [V]).
- **Loading:** the APK bundles Baloo 2 VF (148 KB), Mukta 400/600/700 (≈ 237 KB [I, re-measure with `visual-identity-fonts.py`]) and Andika (13 KB): ≈ 398 KB, inside the 400 KB APK cap. Web loads per band: the Young path ≈ 317 KB, the Older path skips Baloo (≈ 237 KB). `font-display: swap` with metric-matched fallbacks; preload the Devanagari subset on every screen (it also holds ₹) [X]. The design must survive the fallback failing (old WebViews may ignore `size-adjust` and `local()` [M]): first-lesson headings never reflow when display fonts arrive. Tier C/D use Mukta only.

### 4.4 Motion
| token | value | use |
|---|---|---|
| `motion.press` | 100 ms; Young `scale(0.94)` + 4 dp ledge push; Older `scale(0.97)`, flat | pointer-down feedback |
| `motion.fast` | 150 ms, exit easing | exits, chip changes |
| `motion.base` | 240 ms Young / 160 ms Older, enter easing | enters |
| `motion.layout` | 300 ms, standard easing (the cap) | geometry changes at phase boundaries |
| `motion.spring` | damping 1.0, response 0.35 s, interruptible | drag snap |
| `motion.turn-pulse` | steady ring + glow opacity 0.6 ↔ 1.0 at 1.6 s (0.6 Hz), no bounce or scale; tier C-D: ring opacity only, no blur | the single YOUR TURN element |
| `motion.listen` | ring width follows input level, 60-80 ms smoothing | mic while listening |
| `motion.payoff` | once, 600-1200 ms, concept-shaped | after a solved item |
| `motion.milestone` | ≤ 1 per lesson, ≤ 1,500 ms, interruptible | §8.7 |

- **Character:** blinks 120-160 ms at random 2-6 s; breath 4 s at 1-2%; lean-in 300 ms; state cross-fade 200 ms; lip-sync on the playback clock.
- **Limits (PD-G15):** transform and opacity only in UI; ≤ 2 animated layers besides the teacher on the B1 stage; no parallax; nothing flashes more than 3 times per second; auto-started motion > 5 s is pausable, and the teacher's idle loop stops on pause (WCAG 2.2.2).
- **Reduced motion** (`prefers-reduced-motion` and an in-app "kam halchal" switch; the Android animator scale maps to the FrameGovernor visual level): all UI motion → 1 ms cross-fades; she keeps lip-sync and blink; the turn ring becomes a static 5 px ring; payoffs show their end state with a sound; growth animations become a 150 ms cross-fade.

### 4.5 Sound (missing from the sibling identity; visual-identity critique C7d)
| earcon | when | default | rule |
|---|---|---|---|
| turn | entering YOUR TURN | Young on, Older off | two soft rising notes; identical every time |
| received | after a commit, optional | A/B against none (M-ONB-6) | identical for right and wrong; never a verdict |
| payoff | a solved item's payoff, once | Young on, Older off | concept-shaped (the roti tearing), ≤ 600 ms |
| system error | the `stop` overlay only | on | low two notes |
| connection change | never | | her pre-rendered clip explains instead |

- No escalating pitch chains, no sounds keyed to counts or streaks, no background music by default. Each earcon ≤ 20 KB Opus, pre-decoded at lesson start. **Visual feedback is the 100 ms path**; audio is best effort (budget WebView audio latency 100-300 ms [M]). Respects the device's silent mode; every earcon has a visual equivalent (PD-G10).

### 4.6 Icons and the B1 pictogram inventory
- **Young:** illustrated object icons 40-48 dp on a ≥ 64 dp target, flat fill + kajal outline, each spoken on tap. **Older and parent:** Material Symbols Rounded on a 24 dp grid. Icon-only controls are limited to mic, pause, home and phir se, each with an accessible name. Banned for Young: hamburger, kebab, gear, share, undo arrows. Banned everywhere on child surfaces: stars, coins, trophies, medals, flames, streak counters. Maps of India only with Survey of India-compliant boundaries [M].
- **B1 inventory to draw and test (M-VI-9: ≥ 85% cold recognition at a 5 s glance, n = 20 aged 6-7):** house (home) · pause hand · mic · ear-arrow (phir se) · tortoise (slower) · open hand (your turn) · ear (listening) · three dots (thinking) · mouth-sound (speaking) · finger tap (tap instead) · eraser (undo) · pencil (write) · tick (yes) · cross in ink (no) · eye + grown-up (who can see) · computer-teacher badge · grown-up silhouette (give to a grown-up) · phone + grown-up (help) · speaker on / off · speech lines (captions) · seed packet · sprout · flower · fruit · bird (she will check this) · book (notebook) · garden gate (to the class chapter) · cloud-slash (no internet) · tape-speaker (recorded) · door (finish) · water and stretch (break).

### 4.7 Illustration and the teacher (summary of visual-identity §6, with the critique applied)
- Flat fills + one shade tone, rounded primitives, "the fewest details needed" [V Duolingo via visual-identity]; no gradients, no glossy 3D, no text baked into images (labels are SVG overlays).
- Detail rises by band: B1 3 dp outline, head:body 1:3 · B2 2.5 dp, 1:3.5 · B3 1.5-2 dp, 1:5 · B4 no outline, 1:6.5, editorial.
- Skin ramp `skin-1..6`; the teacher defaults to `skin-3`; casts weighted to the middle; heroes never lightened, wrongdoers never darker; audited per Forge batch (G-VI-7 inside PD-G13's illustration audit).
- Motifs from everyday school and home life (kolam dot grid, block-print at ≤ 6% opacity, slate, notebook, matka); no religious iconography, flags, heritage "ancient glory", exotica or gendered colour coding. Avoid the owl as "clever" (*ullu*), the parrot for understanding (*tota-ratant*), cow or pig as playful characters [M: two native speakers per region confirm]. Folk and tribal styles only by paid, credited commission; Forge never generates them.
- Mistakes show thinking, never failure: no red X on the child's work, no crying character.

---

## 5. Age-band variants

### 5.1 Three axes, not one age (kids-ux §1)
- **Visual band** (B1-B4) follows age and class; the child may move up one band from settings, never down. **Reading support** (R0-R2) follows measured reading. **Content level** follows TaRL placement. A Class 7 child at Class 3 maths who reads at R1 gets Older visuals, R1 caption and audio support, and Class 3 content. **Never show a class label below the child's own class**; show skill names.
- Forge takes `visualBand` as a required input so module art follows the band and content follows the level (§3.6).

### 5.2 The band table

| dimension | B1 (6-7) | B2 (8-9) | B3 (10-12) | B4 (13-15) |
|---|---|---|---|---|
| look | rounded, chunky, picture-first, press ledge | same, more detail | flatter, Mukta display, no ledge, board ledge | flat, editorial, 10 dp radii, flat strip ledge, board optional |
| reading default | R0 | R1 | R2 | R2 |
| talk mode | tap-to-talk | tap-to-talk | tap-to-talk; open mic opt-in on headset | same |
| instructions | spoken + shown; a single imperative + a demo (ghost hand); action word last | goal + how, spoken + shown | spoken + short text; goal once | may stack two steps |
| on-screen text | labels ≤ 3 words; ≤ 2 text regions | labels ≤ 4 words; ≤ 2 text regions; one script per element | chunks ≤ 2 lines at a 6th-grade level | same |
| captions default | icon strip | word follow-along | subtitle line on | subtitle line on |
| targets | 64 dp / tiles 112 | 64 / 96 | 48 / 64 | 48 / 64 |
| gestures | tap; drag with snap and partial credit; trace; each with a tap twin; no double-tap, long-press, pinch, rotate, swipe-only | same | tap, drag, slider, swipe with a visible affordance and a tap twin; no hidden gestures | same |
| navigation | ≤ 1 level; house always; no scrolling on the stage | same | ≤ 2 levels; scrolling outside the stage | same |
| first run | C1-C6 Young skin, story placement | same | Older skin, honest purpose framing | same |
| YOUR TURN timers | 4 / 8 / 15 s | 4 / 10 / 15 s | 6 / 12 s | 6 / 12 s |
| earcons | on | on | off (setting) | off |
| wrong answers | 3-step ladder: name gently → restate goal + hint → highlight the path + a fresh isomorphic item; never red, never a buzzer | same | same in words, plus "show me why" and hint-first on request | same |
| payoff | concept-shaped, short | same | quiet, specific acknowledgement | same |
| in-lesson position | none (she says where we are) | none | phase word in the top bar | same |
| progress world | Bagiya (switchable) | Bagiya (switchable) | Aasmaan (switchable) | Aasmaan, route-map skin offered |
| choices per offer | 2 | 3 | 3-4 | 3-4 |
| teacher on stage | large, exaggerated acting | large | smaller, PiP in Work; face / small / voice-only modes | same, calmer motion, no mascot moves |
| status words | glyph + body only | glyph + body | glyph + one word | same |
| autonomy | picture choices inside the lesson | + next topic of 2, warm-up order | goal card, next of 3, "I know this", pace, quiet mode, look, teacher choice | + "straight to my doubt" (the warm-up item stays owed) |
| teach-back | protégé, choose-or-fix | protégé, choose-or-complete | explainer notes default; protégé opt-in | explainer notes ("for a friend who missed class": text, voice or draw) |
| social | show a grown-up (invitation, graceful no) | same | optional share to family; honest "many students find this tricky" from real aggregates | same |
| transparency | spoken disclosure + stage badge; "ghar ke bade can see" icon strip | same | told once at C2 and in settings; "what your parent can see" | same |
| session | 10 min micro, hard stop 12 | 30 min or 2 × 15 | 30 or 45 | 30 or 45 |
| home | "Aaj ka paath" + garden + practice | same | study home: continue, doubt, practice, map, notes | study-tool list; test-week window |
| theme | light only (parent may set a warm night dim) | light only | OS or toggle | OS or toggle |
| sibling privacy | optional picture-PIN | optional picture-PIN | optional 4-digit PIN | optional 4-digit PIN |
| teacher register | warm older sibling; ≤ 15 words, ≤ 6 s | ≤ 20 words, ≤ 8 s | respected older cousin; ≤ 30 words, ≤ 12 s; dry humour, never "kids" | ≤ 40 words, ≤ 15 s |
| address | parent sets *tum / aap* | parent sets | child owns it (parent default *aap*) | child owns it |

### 5.3 B4 is not B3 (kids-ux critique C1.2)
B4 gets no mascot-style teacher motion (no bounce, no exaggerated acting), no default earcons, text-first tiles, a study-tool home, the flat strip ledge, 10 dp radii, the route-map skin offer, explainer notes only, an exam-week mode for Class 8-9 (retrieval-heavy lessons across the chapter list, shown as a window), and a "test me" path in one tap ("I know this" from the home sheet). Every B4 visual decision is checked by the embarrassment test M-VI-8 ("would you mind if a friend saw this over your shoulder?").

### 5.4 Band edges
- The band comes from the class at setup; the age chip (optional) only settles edge cases. Re-evaluate at each class change.
- The child may move up one band and may switch progress world in one tap at any band; neither changes content or the ledger.
- The 9-to-10 edge is tested with 9-11-year-olds in both worlds (MW-M5), not only 13-15.

---

## 6. Parent app

### 6.1 Surfaces
- **WhatsApp (primary, push):** the weekly report, an optional milestone (≤ 1 / week), and the safety, account and payment messages. Nothing open-ended: Meta has banned general-purpose AI assistants on the Business API since 15 Jan 2026 [S via parent-experience], so questions go to the in-app PTM.
- **Parent corner (depth, pull):** in the APK behind the gate; on the web at `/parent` with OTP. Phone: bottom tabs Home · Syllabus · Lessons · More. Desktop: a left rail, two columns.
- **Voice:** the monthly PTM (5-8 min, AI-disclosed). **Print:** the monthly progress card (PDF), safe to show a school teacher.

### 6.2 Guardian gate and account security (R8)
- **Default:** a 4-6 digit guardian PIN set at P7. **Option:** "use phone lock instead" (Android `BiometricPrompt` with `BIOMETRIC_STRONG | DEVICE_CREDENTIAL` on API 30+, `KeyguardManager` on 29) [V via kids-ux]; recommended only when the child does not know the unlock. Never a maths puzzle.
- **Consent-grade actions** (consent changes, export, deletion, adding a co-parent, PIN reset) re-authenticate with an OTP to the guardian number. **PIN recovery** needs a factor off the shared device (OTP to a second registered number, or WhatsApp on a different phone) or, failing that, a 24 h delay with a WhatsApp notice to the guardian; OTP autofill is disabled on the reset screen (parent-experience critique B20).
- After 5 wrong PINs the gate waits 15 min and notifies the guardian; the child-facing copy blames nobody.

### 6.3 Parent Home (three things; parent-experience critique S17)

```
┌───────────────────────────────────────────┐   desktop: left rail · this column · skills column
│ [Riya ▾]  Class 4 · CBSE            (🔊)   │   one child at a time; never side by side
├───────────────────────────────────────────┤
│ IS HAFTE                            (🔊)   │   one sentence: one capability + one tricky bit,
│ shape: [can now do X] · [still tricky: Y]  │   each with Kaise pata? ; spoken version first
│                         Kaise pata? >      │
├───────────────────────────────────────────┤
│ ▌GHAR PAR EK KAAM               your turn  │   the only marigold block on the screen
│ ▌pick one: [roti] [₹10 note] [paper]       │   the parent picks the household object
│ ▌one question · what a good answer sounds  │   doable without knowing the maths
│ ▌[Ho gaya]        [Is hafte nahi]          │   both are fine answers; 48 dp, 8 dp apart
├───────────────────────────────────────────┤
│ Aur dekhein >                              │   skills · syllabus · lessons · teacher's note · PTM
│ last updated 10:42 (if shown from cache)   │
└───────────────────────────────────────────┘
```
- **Payload ≤ 100 KB JSON**, rendered from the last good copy offline with a "last updated" line; "Ho gaya" and consent toggles queue offline.
- **No time facts in the headline.** Minutes and lessons sit one level down as plain facts. No week-on-week deltas, no effort tallies (R10).

### 6.4 Evidence: "Kaise pata?" and the state words
- **Evidence sheet** (bottom sheet, deep-linkable `/parent/:cid/skill/:skill`): the skill in NCERT outcome words; one row per piece of evidence: date · what kind of check in plain words (explained it in their own words, spotted the teacher's deliberate mistake, still right a week later) · the child's own words (≤ 25 words, transcript excerpt) · help used (hint depth) · the next re-check date. A play button only if voice moments are on.
- **State words (R11), gender-neutral, Devanagari-first by the language tile:**

| ledger state | हिन्दी | Hinglish | English | chip (shape carries state; survives greyscale) | colour |
|---|---|---|---|---|---|
| unseen | अभी नहीं | Abhi nahi | Not yet | dashed outline | `--p-ink-3` |
| practising | अभ्यास में | Abhyaas mein | Practising | half-filled | `--p-learning` |
| learned today | आ गया | Aa gaya | Got it today | solid outline + the re-check date on the chip | `--p-learning` |
| mastered (delayed re-check passed) | पक्का | Pakka | Secure | filled + tick | `--p-pakka` |

- **Pakka only after a delayed re-check in a later session** (parent-experience §0.4). "Aa gaya" always shows its re-check date so it is not read as finished (M6 tests the four words with ≥ 4 parents with ≤ Class 8 schooling).
- **Misconceptions** in kitchen-table words with the child's reasoning, showing the mistake is sensible, never careless.

### 6.5 Syllabus map, level bridge, school sync
- School chapters for the class and board from `data/curriculum/*.json`, each topic with its chip; a header with chapters touched and topics pakka (coverage, never charted over time).
- **Level bridge** where the placed level is below class: a 3-step route (earlier step · earlier step · this year's chapter), told as building the foundation, never "behind", in lessons, never years.
- **School sync:** the parent picks "what school is teaching now" from the chapter list (a diary photo with OCR is v2); test dates render as a test-week window, never a countdown.

### 6.6 Lessons
- Reverse-chronological list: date, topic as outcome text, one line. **Class 1-4 default view is a 20 s spoken summary per lesson** (her voice, from ledger facts) with the transcript one tap deeper; Class 5-9 per §6.11.
- **Per-lesson card** (in-app, never pushed): 2-3 action sentences (explained it in their own words; fixed the teacher's planted mistake; tried again after a mistake), skill chips with Kaise pata?, one quote ≤ 25 words per the visibility policy, the next re-check date, and any fallback in plain words (answered by tapping today because our listening had trouble). Three short lines before the fold at a Class 3 reading level (the child may read it). Delete per lesson.

### 6.7 Weekly WhatsApp report (utility template)
- **Category:** utility (₹0.1150 + GST vs ₹0.8631 marketing [S]); zero promotional content, ever; ≈ ₹1.2 per parent per month with the voice note [S].
- **Lock-screen safe:** the notification's first line is neutral (a weekly-report-ready shape); no performance detail on line 1, because the child may hold the phone (parent-experience critique B21).
- **Body carries the full facts** (≤ 5 short lines, ≤ 1,024 chars [V]): name and week facts · 1-2 can-now-do · 1 working-on · the home task · the AI-teacher footer. Language and script follow the parent's tile.
- **Header image optional:** 1080 × 1350, ≤ 300 KB, a forwardable convenience; never the only carrier.
- **Buttons (3):** *Suno* (quick reply → the 60-90 s voice note as a service message in the 24 h window; audio is not a template header type [V]) · *Poori report* (URL → `/parent`) · *Ghar ka kaam ho gaya* (quick reply; logs nothing visible to the child; never a KPI or reminder trigger).
- **Voice note:** opens with the AI disclosure; one concrete thing the child did → what is pakka → what is tricky in kitchen-table words → the home task with the exact question and what a good answer sounds like. Generated from ledger facts only and linted (PX4, PX5, PX9) before sending.
- **Cadence:** ≤ 2 learning messages a week; send window 08:00-20:00; quiet hours 20:30-08:00 except safety; a zero-lesson week still gets its report, plainly, with nothing to fix. "STOP / Band karo" ends reports after one confirmation.

### 6.8 Monthly PTM (voice)
- *PTM karo* any time or by booking; 5-8 min in the parent's language with the month's card on screen; disclosed as AI at the start.
- Agenda shape: 3 can-do with evidence · 1-2 tricky bits · school chapter vs what is pakka · one home task · the parent's questions. Answers come **only from the ledger**. She declines predicted marks, rank, comparisons and "is my child intelligent", offering skills pakka out of total, the child's own past month, and the method that is helping. She never promises a human will follow up.
- Ends with a utility summary on WhatsApp and a saved card. The printable monthly card (PDF) uses HPC-compatible competency rows, chapter counts and the teacher's note; no transcripts, no misconception detail.

### 6.9 Controls, data, family, plan, saved lessons

| control | default | notes |
|---|---|---|
| daily lesson time | Class 1-2: 20 min (B1 micro-sessions, two a day ≥ 2 h apart) · 3-5: 30 · 6-9: 45 [I] | the first day's cap ≥ the child path; at the limit she closes at the next natural stop; +10 min needs the gate |
| allowed hours | 07:00-20:30 | outside: "teacher is resting" |
| language mix and script | from P0; Hindi-heavy · mix · English-heavy; Devanagari · Roman | |
| captions-always; hard to hear | off; set at P6 | also child-reachable |
| tap-and-type only profile | off | a full-fidelity lesson; never down-weighted |
| timing multiplier | 1× (adapts from the child's own latency) | 1 / 1.5 / 2 × on every YOUR TURN timer |
| comfort mode | off | larger text, calmer screen, extra line and word spacing (never Devanagari letter spacing) |
| teacher (B1-B2) | chosen at P6 | B3-B4 the child chooses |
| mirror layout | off | left-handed children on tablets |
| sound effects | Young on, Older off | |
| data saver | **on for cellular until M-LE-3** | MB shown, never % |
| saved lessons | prefetch 2 lessons on Wi-Fi | Wi-Fi-only switch; remove; never shown to the child |
| school sync + test week | off until set | |
| learning memory | from P5 | off = session only |
| voice moments (keep child audio) | off | 30-day auto-delete [M: legal] |
| notebook still photo | off (v2) | parent-enabled, a deliberate still, never a stream |
| interest tags | learned in lessons | view, edit, delete; sensitive categories never stored |
| reports | weekly on, milestone on (≤ 1 / week), voice note on | day, time, language, channel |
| family | owner only | co-parent (full) or viewer (weekly report only) by WhatsApp link |
| data | | view all · export (PDF + JSON) · delete a lesson · delete transcripts · reset learning profile · delete child · delete account: plain statement, hold-to-confirm 2 s + OTP, synchronous revocation, async purge retried until done, content-free receipt |

- **Plan & billing:** monthly rupee price, cancel in 2 taps, full refund policy, no EMI or loans, never an auto-renewal from a free period into paid without a fresh affirmative act.

### 6.10 Alerts

| class | trigger | channel | cap | can the parent turn it off? |
|---|---|---|---|---|
| safety | crisis, self-harm, abuse disclosure, moderation flag | WhatsApp (neutral wording, detail behind the gate) + in-app | none | no |
| account security | new device, PIN reset, export or deletion requested | WhatsApp | per event | no |
| payment | renewal 3 days ahead; failure | WhatsApp | per event | no |
| milestone | a skill turned Pakka that the parent asked about, or a chapter all pakka | WhatsApp | ≤ 1 / week | yes |
| weekly report | schedule | WhatsApp | 1 / week | yes |
| absence, streaks, "come back", "your teacher is waiting" | **never** | | | |

- **Safety alerts** never quote the child, include the helplines [M: re-verify numbers at launch], and point to the Parent corner. A safeguarding-expert-defined branch suppresses parent notification when the disclosure concerns a family member and routes to Childline. Whether WhatsApp is used at all for safety on shared-device households is the safeguarding expert's call [M]. The child is never promised secrecy.
- **No notification speaks for the teacher's feelings** (kids-ux critique C3.6).

### 6.11 Visibility policy by age (R23)

| | Class 1-4 (≈ 6-9) | Class 5-9 (≈ 10-15) |
|---|---|---|
| skills, evidence, ≤ 25-word quotes, summaries | always | always |
| full verbatim transcripts | visible; spoken summary first | on parent request; opening them that week is disclosed to the child [U: test effect on disclosure] |
| what the child is told | at C2 and by a small "ghar ke bade can see" icon strip on their settings screen | once at C2, once in settings ("what your parent can see"); no persistent chip |
| safety transcripts | shared on escalation unless suppressed (§6.10) | same |
| live listen-in | no | no |

### 6.12 Parent copy rules (PX1-PX11)
PX1 evidence or silence (a ledger row behind every sentence) · PX2 the four words, never colour alone, never red · PX3 one your-turn per screen · PX4 no ability or style labels (bilingual lint: weak/kamzor, slow, tez, dimaag, nalayak, careless, lazy, "visual learner") · PX5 no affect claims, only behaviour · PX6 no comparison (no rank, percentile, sibling view) · PX7 no pressure (no absence alerts, fear copy, countdowns, streaks, offers) · PX8 written as if the child will read it · PX9 honest AI (no string implies a human reviewed or will call) · PX10 read-aloud first (every report spoken, every control with a speaker) · **PX11 child-visible text** on shared screens is spoken first and ≤ 6 words for ages 6-9.
- **Register:** a respectful school teacher at a PTM, *aap*, concrete nouns over adjectives, uncertainty said plainly ("still checking", "re-check on Thursday"). Never "falling behind", "don't miss", "only N days left", "upgrade", exclamation-mark hype, emoji hearts, or dashes in UI strings.

---

## 7. Accessibility and low-end rules

### 7.1 Accessibility contract (every surface; WCAG 2.2 criteria quoted from the normative text [V])

| # | rule | reference |
|---|---|---|
| A1 | Every teacher utterance can be captioned; captions-always is one child tap away (the CC pictogram on the stage) and settable at onboarding and by the parent | live captions; sibling critiques |
| A2 | No instruction, cue, state or error is carried by audio alone or by colour alone: each state has a glyph, each earcon a visual equivalent, each colour category a label, shape or pattern | WCAG 1.4.1 [M]; §3.9 |
| A3 | Screen readers: YOUR TURN is announced once, politely, with its target; other states are exposed as the mic's state, not announced; her phrase is announced once at `audio_end`, never word by word; stage reading order is top bar → caption → canvas → controls, with one YOUR TURN focus target | kids-ux critique C2.2 |
| A4 | Every drag and trace has a single-pointer alternative (tap the piece, tap the place); every module engine declares accessible names and keyboard/switch operation | 2.5.7 Dragging Movements (AA): "can be achieved by a single pointer without dragging" [V] |
| A5 | Pointer-down gives visual feedback within 100 ms; the action commits on pointer-up inside the target and cancels if the finger slides off | 2.5.2 Pointer Cancellation (A) [V]; Sesame "register on touch" for feedback [V via kids-ux] |
| A6 | Child targets per band (≥ 64 / 48 dp); adult targets ≥ 48 dp with 8 dp spacing; nothing anywhere below 24 × 24 CSS px | Android: "at least 48dp x 48dp" [V]; 2.5.8 Target Size (Minimum) 24 × 24 (AA) [V] |
| A7 | Text ≥ 4.5:1; non-text (rings, borders, glyphs, chart marks) ≥ 3:1 against adjacent colours, including the ring against its own fill | 1.4.11 Non-text Contrast (AA) [V]; `product-design-contrast.py` [X] |
| A8 | Focus is a two-tone ring (2 px ink inside, 2 px white outside, 2 px offset), ≥ 3:1 on every ground; focused items are never fully hidden by the PiP, sheets or the keyboard | 2.4.13 Focus Appearance (AAA: ≥ 2 px perimeter, ≥ 3:1) [V]; 2.4.11 Focus Not Obscured (AA) [V] |
| A9 | Single-character keyboard shortcuts act only when no text field has focus and can be turned off or remapped | 2.1.4 Character Key Shortcuts (A) [V] |
| A10 | Every time limit adjusts: the per-child timing multiplier (1 / 1.5 / 2 ×) applies to every YOUR TURN timer; no flow times out into a different state; the pointer and the heard chip persist until the next turn | 2.2.1 Timing Adjustable (A) [V] |
| A11 | Reduced motion keeps every cue (static 5 px ring, glyphs, lip-sync and blink); auto motion > 5 s is pausable; ≤ 3 flashes per second | 2.2.2, 2.3.1 [V via visual-identity] |
| A12 | No autoplay audio over 3 s without a stop; the APK's first greeting is ≤ 3 s, respects silent mode and shows a stop | 1.4.2 Audio Control (A) [V] |
| A13 | Text survives 200% (web zoom and Android font scale up to 200%) without loss; the stage switches to its large-text layout above 1.5 × | 1.4.4 Resize Text (AA) [V]; Android 14 non-linear scaling [V] |
| A14 | Devanagari never clips; `lang` on every script span | PD-G14 |
| A15 | A full tap-and-type-only lesson exists at full fidelity; tap instead is present from turn one; using it is never evidence of anything | §3.9 |
| A16 | Deaf and hard-of-hearing children: captions-always, visual equivalents for every earcon, a haptic tick on YOUR TURN | kids-ux critique C2.3 |
| A17 | Speech differences (stammer, speech delay, strong accent): a parent profile flag with no label shows tiles from the first miss and extends the end-of-speech ramp; low ASR confidence is never evidence | learning-science fusion rule 3 |
| A18 | Low vision: pointer 4-6 px with a halo plus the persistent highlight; map state by silhouette ≥ 16 dp; a list view for every map | §8.5-8.6 |
| A19 | Comfort mode: larger text, calmer screen, extra line and word spacing; a placement made under it is marked provisional for the parent; no condition is named | onboarding critique B7 |
| A20 | Cognitive load: one idea per screen; Young ≤ 2 text regions; one script per element; no hidden gestures in any band | PD-G11 |
| A21 | Every icon has a spoken (Young) or text (Older) label; icon-only controls limited to mic, pause, home, phir se, each with an accessible name | visual-identity §5 |

### 7.2 Device tiers and the single degrade ladder

| tier | detected as [U until M-LE-1/2] | teacher | modules | progress surfaces | DPR cap | frame caps |
|---|---|---|---|---|---|---|
| A | ≥ 6 GB and big cores | 3D head when it ships (behind M-UX-6), else Rive 2D | everything; kit games at 60 | full (halo, motion) | 2 | teacher 30, UI 60 |
| B | 4-6 GB with some big cores (G85/G88/G99 class) | Rive 2D | T1 at 60; kit 30-60 | full | 2 | teacher 30 |
| **C (floor)** | little cores only (Helio G35/G36/G25) or 3-4 GB, or below the microbench line | **flipbook from the same art**: WebP sprite sheet (idle, listen, think, speak + 5 mouths) driven by the RMS jaw value | T1 Canvas2D/SVG at 60; kit capped at 30 with heavy archetypes swapped for a T1 engine | static SVG states, no halo, no growth motion | 1.5 | 30 (24 when hot) |
| D (lite) | ≤ 2 GB, Android Go, thermal severe, or the PWA lite path | still pose + 2-frame mouth from the same art | T1 engines only, no video | list view only | 1.25 | 15 |

- **Same person on every tier.** The flipbook and the still pose come from the same face, wardrobe and palette as the Rive rig, so a child moving between phones sees the same teacher at a lower frame rate (M-LE-13 blind test with 10-15-year-olds). Meanings (the four poses, glyphs, ring) never change with tier. The tier name and any "lite" wording never reach the child.
- **Detection:** native signals (`totalMem`, `isLowRamDevice`, `SOC_MODEL`, per-core max frequency) or `navigator.deviceMemory` on the web, then the median of three ≤ 300 ms microbench launches; stored with a timestamp; re-checked after an OS or WebView update; the parent corner offers one "try better quality" re-test. The tier is a hardware fact and never keys child data.
- **FrameGovernor (R20):** step down one visual level (60 → 30 fps, then DPR 1.5 → 1.25, then flipbook → still) when rAF p90 > 25 ms for 3 s twice within 30 s, excluding system overlays and the notification shade; step back up at an item boundary after 20 s under 16 ms. **ThermalWatch:** headroom > 0.95 steps down one level; > 1.0 goes to tier D.

### 7.3 Budgets (consolidated; PD-G16, PD-G17)

| budget | value | status |
|---|---|---|
| cold-path JS (boot → picker) | ≤ 120 KB brotli | 85.4 KB today [M low-end] |
| lesson route JS | ≤ +150 KB br, lazy | 11.2 KB today [M] |
| one T1 engine | ≤ 30 KB br | 2.9 KB (`fractionBars`) [M] |
| game kit runtime | ≤ 340 KB gz, precached, never on the cold path | [P] |
| Rive runtime + rig | runtime 88 KB br JS + 285 KB WASM [M]; ≤ 800 KB `.riv` per teacher variant [I]; tier A-B only | G-VI-10 |
| flipbook sheet | ≤ 400 KB WebP per character register [I] | |
| fonts | web ≤ 320 KB per band path; APK ≤ 400 KB (≈ 398 planned) | [X]/[I] |
| Bagiya atlas | ≤ 300 KB gz for the whole garden (SVG `<use>` recolour); ledger fold ≤ 5 KB per child | [I] |
| earcons | ≤ 20 KB each | [I] |
| PWA first visit to the picker | ≤ 600 KB br, ≤ 6 critical requests | |
| profile tap → her first sound | ≤ 1.0 s (local clip) | M-LE-1 |
| profile tap → live voice (India, tier C) | ≤ 4 s p50 | M-LE-1, M-LE-4 |
| frames (teacher + module + audio, 60 s) | median ≤ 16 ms, p95 ≤ 33 ms on the gate devices | M-LE-2 |
| main thread while LISTENING/SPEAKING | no task > 50 ms; ≤ 10 ms JS per frame | |
| memory, tier C | app + WebView renderer PSS ≤ 400 MB with WhatsApp and a game in the background [U]; tier D ≤ 250 MB [U] | M-LE-2 |
| battery / heat, tier C | ≤ 8% per 30 min; ≤ 6 °C over 45 min [U] | |
| APK download | target 15 MB, hard cap 25 MB [U] | |
| chapter pack / child overlay | ≤ 1.5 MB / ≤ 50 KB (targets until the first real chapter build) | |
| data per 30-min lesson | ≤ 12 MB default; ≤ 3 MB data saver; L0 defaults measured by arithmetic at ≈ 23 MB [I] | M-LE-3 |
| parent Home payload | ≤ 100 KB JSON | |

**Gate devices:** a Helio G35 4 GB phone (tier C floor), a 2 GB Android Go phone (tier D), a G85/G99 phone (tier B), plus the PWA lite build on an Android 9 phone.

### 7.4 Network and the voice ladder (low-end §7; UX in §3.12)

| rung | transport | her voice | child input | when |
|---|---|---|---|---|
| L0 | WebRTC to Azure realtime | realtime voice | tap-to-talk (default) or open mic | default |
| L0-T | same session, `turn_detection: null` | same | tap-to-talk | default on loudspeaker; after 2 echo flags |
| L1 relay | WebSocket (TCP 443) via `taxila-web` to the same session | same voice | streamed Opus 16 kbps | UDP blocked, or L0 red |
| L2 walkie-talkie | whole utterance uploaded as Opus | same voice at 20 kbps re-encode | tap to talk | L1 red or < ~60 kbps sustained |
| L2-C cascade | STT → text model → TTS | TTS voice **only if** the blind ABX says it is the same person (M-LE-10), else skipped | as L2 | realtime unavailable |
| L3 text + clips | `TextLink` | pack clips; her words on the ledge for R2 only | taps, choice chips | voice unusable, some data |
| L4 offline | `PackLink` | pack clips | taps only, mic closed | no network |

- **Same-voice law:** no rung lets a different voice speak as her. **LinkSupervisor** samples `getStats()` every 2 s: amber (RTT 400-800 ms, loss 3-10%, concealment 2-8%) stretches timers and pre-opens the relay; red over 6 s (RTT > 800 ms, loss > 10%, concealment > 8%, or THINKING > 8 s with no audio) steps down at the next turn boundary; dead (ICE failed, or no audio for 5 s) switches now with a pack clip; recovery needs 60 s green, a phase boundary, and at most one step up per 5 min. Every switch re-seeds the session from the Director.
- **Data saver** (Android Data Saver, metered network + the parent's choice, `Save-Data`, or the parent's cap; **default on for cellular until M-LE-3**): uplink capped at 16 kbps (or L1 at 20 kbps), TTS re-encoded to 16-20 kbps Opus (served at 70.7 kbps [M]), packs on Wi-Fi only, no live image generation, no video. The parent sees MB per lesson, never %.

### 7.5 WebView and Capacitor rules (low-end §5, with R19)
- `RendererRecovery` returns `true` from `onRenderProcessGone`, rebuilds the WebView and resumes at the same item (Capacitor's default lets the app crash [V via low-end]).
- APK: Vite build target and `android.minWebViewVersion` are one number (`chrome111`); minSdk 29; `androidScheme` and hostname pinned forever; edge-to-edge padded with `env(safe-area-inset-*)`; no service worker in the native build; Wake Lock with a native keep-screen-on fallback.
- **Below the floor** (Android 8/9 or an old WebView): the native error page hands over to the PWA lite bundle (older syntax target, tier D defaults), which is a supported product path, not a dead end. The real share of Android 8/9 families is measured in beta before launch.
- Background means pause: no background microphone foreground service, ever.

### 7.6 Shared family phone
- The guardian refresh token lives in Keystore-backed secure storage (web: httpOnly cookie). A profile tap mints a **child-scoped token** (TTL = the daily cap + 30 min [I]). The device is never the identity.
- A profile switch closes the realtime session, peer connection and relay socket, flushes the evidence queue, clears in-memory learner state and drops the token (G-LE-5 in PD-G23). One IndexedDB per child; a shared content DB deduplicated by hash.
- The picker re-appears on cold start and after > 5 min in the background. A "not me" action sits on the lesson's first screen; wrong-child evidence can be moved by the parent ("this lesson was \<other child\>"), audited.
- Notifications are addressed to the parent and reveal no performance on the lock screen; no child name or protégé name appears in notifications.
- Optional picture-PIN (B1-B2) and 4-digit PIN (B3-B4) keep siblings out; they are privacy, not security.

### 7.7 Offline packs
- **Chapter pack** (shared, content-addressed, signed with Ed25519, key in the APK): engine configs, the item bank with verified keys, hint steps, pre-rendered clips (prompts, ladder rungs, protégé lines, connection, resume and **help** clips), WebP images, captions in both scripts. **Child overlay** (≤ 50 KB): today's plan, due items, interest variants, the name clip id.
- Native packs live in app-private files; PWA packs in Cache Storage with `persist()`. Download by hash with resume, verify, swap atomically. Prefetch the next 2 lessons on Wi-Fi or at lesson end with honest progress (parent corner only); stop prefetching below 500 MB free; evict LRU but keep the current chapter.
- Offline grading is a deterministic check against the verified key; evidence events carry idempotent uuids and `modality: offline-tap`, are re-scored on sync, and use server time. Checkpoints are written as two alternating IndexedDB records; restore picks the newest valid one.
- **Offline is tap-only:** Azure Embedded Speech has no hi-IN STT [V via low-end]. A recording is never presented as live (`recorded` badge, no mic glyph).

---

## 8. Progress and motivation UX

### 8.1 The six tests every mechanic must pass (motivation §3)
T1 fear-and-obligation (remove every fear and obligation: is it still intact?) · T2 absence (nothing visible gets worse because time passed; render identical at t + 365 days) · T3 evidence (every visible change has a ledger row the child or parent can open) · T4 comparison (never against another child, a sibling or an invented average) · T5 toll (learning is never the price of unrelated fun) · T6 purchase (nothing grows, unlocks or looks better because someone paid).

### 8.2 Banned and allowed (child surfaces)

| banned | allowed instead |
|---|---|
| points, XP, coins, gems, stars as currency, badges per completion, unlockable cosmetics, chests, surprise drops, spin wheels | a specific, true, cited capability statement + a concept-shaped payoff |
| streaks, freezes, day counters, **calendar grids, heatmaps, day-dot rows** | a lesson journal ordered by lesson, never by date |
| leagues, leaderboards, ranks, "ahead of X%", sibling views | comparison with the child's own past only |
| hearts, lives, energy, item timers, speed bonuses, countdowns | unlimited tries and the hint ladder; exam windows for B4 parents only |
| wilting, fading, a sad or hungry protégé, "we miss you", "your teacher is waiting" | review-due as an invitation the teacher acts on |
| % bars for Young; in-lesson progress meters for anyone | Young: nothing; Older: the phase word |
| the protégé's capability props, name boards, "bed complete" cards, persistent family-reaction chips (R14) | the spoken capability line plus the child's own artefact |

### 8.3 Inside a lesson (R7)
No stepping stones, no fill, no counts. Young children hear where they are from her; Older children see the phase word next to the skill name. At P7 the day's skill quietly appears in the child's world at its true ledger state (a sprout or flower; a lit star), with no ceremony unless §8.7 allows one.

### 8.4 Bagiya, ages 6-9 (B1-B2)

```
┌────────────────────────────────────┐   360 × 744 dp, light only
│ ⌂                         (parent) │   parent door dull, behind the gate
│      (teacher, small, pointing)    │   tap her: a garden walk (≤ 3 turns), offered every 4th
│                                    │   lesson by lesson count, never by days
│  ┌──────── (bed picture) ────────┐ │   bed identity = a picture of what the skill is about;
│  │  [plot]  [sprout]  [flower]   │ │   its name is spoken on tap, never a class label
│  │  [fruit◯]  [fruit◯ + bird]    │ │   shapes carry state; ≥ 112 dp hits, 16 dp gaps
│  └───────────────────────────────┘ │
│  ◀                              ▶  │   64 dp arrows = tap twins for the swipe
│  ┌──────────────────────────────┐  │
│  │      ▶  Aaj ka paath          │  │   the ONE ringed element
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```
- **State by silhouette** (never colour alone): empty plot with a seed packet (Abhi nahi) · two-leaf sprout (practising) · flower (got it today) · fruit with a `done` ring (Pakka). The word appears only in the parent view.
- **Monotone and absence-invariant:** the plant shows the highest stage reached; only two consecutive delayed misses demote, told plainly in the lesson, with no wilting animation.
- **The bird** (a silhouette, not a hue) appears only when the server has written a `recheck_scheduled` row (R13): it means she will check this one next time. Never pushed, never counted, never framed as the child's chore. If MW-M2 interviews show "I have to feed it" readings, the cue moves to her side ("she has a question saved").
- **Visible beds:** the current chapter, finished ones, and one seed-packet bed ahead; no count of empty plots, no "x of y beds".
- **Plant kind per bed:** a cheap picture choice (2 for B1, 3 for B2: flower, vegetable, fruit tree); never marigold, never sacred plants.
- **Tap a plant:** B1 hears one spoken clause plus sees the artefact (no date); B2 gets the three-part capability shape (skill + how we know + one thing the child did). "Then vs now" for Young is two pictures with a gesture, not words.
- Navigation is a horizontal panorama (no vertical scroll). Growth animates only after the ledger acknowledges (≤ 2 s optimistic hold); offline, it grows next time with no apology copy.

### 8.5 Aasmaan, ages 10-15 (B3-B4)

```
┌────────────────────────────────────┐
│ Maths ▾              [goal] [notes]│
│ ┌────────────────────────────────┐ │   sky panel #0F1A33 in both themes
│ │  ○──●        ✦══✦              │ │   edges = real prerequisites (3.82:1)
│ │      \      //   \\            │ │   silhouettes: ring · dot · 4-point star ·
│ │   ○   ●───✦      ✦⊙  re-check  │ │   4-point star in a ticked ring; ≥ 16 dp drawn,
│ │        Fractions   ▲ your class│ │   ≥ 48 dp hit; the state word shows beside the
│ └────────────────────────────────┘ │   selected star
│ Fractions · 4 of 6 pakka · 1 ready │   counts, never %; "shows what you have shown so far"
│ ┌────────────────────────────────┐ │
│ │ then → now (two cited attempts │ │   ThenNowCard: same skill, ≥ 7 days apart
│ │ on the same skill, ≥ 7 d apart)│ │
│ └────────────────────────────────┘ │
│ [ Next: choose 1 of 3 ]            │   the ONE ringed element
└────────────────────────────────────┘
```
- Real numbers, own-referenced; never percentile, rank or time as a virtue. Older skins may show plain words and a ticked ring instead of a glowing halo (motivation critique C10). Exam proximity appears only as a window in the parent view.
- **"Your class is here"** marks the chapter the school is on; a child placed below sees the path of stars leading to it (the level bridge as a route). "I know this" on an unlit star runs a 2-item check; a pass lights it to Aa gaya; Pakka still needs a later session.
- **Skins** (chosen, never earned): sky (default), metro route map, workshop blueprint (B3, motivation critique C8).
- **Goal card (HPC vocabulary, Aug 2025 [V via motivation]):** pick 1 of 3 suggested goals or "my own"; "important to me because"; first steps picked from a list, **undated**; one active goal; closes only on a ledger condition; a missed goal is re-set, never failed.
- Optional "stretch" items framed as puzzles with no reward (challenge as motivation for B3).

### 8.6 List view (the source of truth)
Every map has a built-in list: chapter → skill → state (shape + word for Older; shape + spoken name for Young) → its evidence. It is the TalkBack reading order, the tier D surface, and the fallback when the canvas cannot render. The map is an enhancement of the list, never the reverse.

### 8.7 Notebook (Young) and explainer notes (Older)
- **Protégé (B1-B2; B3 opt-in):** chosen from 3 designs and named by the child; obviously fictional; never a classmate; speaks only pre-rendered kit clips; never claims feelings; never grades; no needs (no hunger, sadness, waiting, shrinking); nothing about it reads a clock. Its notebook gains a page per concept the child taught: B1 pages are the child's picture or module snapshot with her re-voicing the idea from pre-rendered clauses (the child's own audio only if the parent turned voice moments on); B2 pages add the child's phrase (≤ 12 words) with the original one tap away; a wrong explanation shows its corrected version marked "fixed together". No page counts, no blank pages waiting, no props in v1.
- **"Protégé tries, child judges"** in a later warm-up (Aa gaya+ skills only, misconceptions always resolved) doubles as delayed retrieval and error-spotting.
- **Explainer notes (B4 default, B3 default with the protégé off):** the child's own explanations, framed for a friend who missed class, usable as a revision sheet before tests.

### 8.8 Milestones (corrected)

| milestone | trigger (ledger) | child surface | parent surface |
|---|---|---|---|
| Pakka | a delayed re-check passed in a later session | the plant fruits / the star gains its ring **during the warm-up item that proved it**; her spoken capability line | weekly report row; optional milestone message (≤ 1 / week) |
| first Pakka ever | first mastered state | she explains once what the fruit or ring means | milestone message |
| comeback | a skill with ≥ 2 earlier misses reaches Pakka | then vs now (two pictures Young; ThenNowCard Older) | report row with both dates |
| bridge crossed | the placement gap closes | the garden path reaches the gate to "the chapter your class is on" / the "your class" marker is reached | the level bridge line |
| goal done (B3-B4) | the goal card's ledger condition | the goal card closes in the child's own words | report row |

- **Never milestones:** lessons, days, minutes, correct-answer counts, "1st in", purchases, anniversaries.
- **Ceremony:** at most one per lesson, ≤ 1.5 s, interruptible, reduced-motion safe; Young gets her delight pose (an insight event, §8.11) plus one earcon; Older a quiet card, no sound unless enabled. A skipped ceremony is never queued for later; the absence of a ceremony is never visible.

### 8.9 Autonomy (choices that change something visible; all available from day one, never earned)

| choice | B1 | B2 | B3-B4 |
|---|---|---|---|
| plant kind / map skin | 2 pictures | 3 pictures | sky · metro · blueprint |
| protégé design and name | 3 | 3 | opt-in |
| which due item first | 2 | 2-3 | 3 |
| next topic | she picks | 2 | 3 |
| "I know this" | no | no | 2-item check |
| goal | no | a picture goal | goal card |
| look (teacher, theme, garden decor) | all available | all available | all available |
| world (Bagiya / Aasmaan) | switchable | switchable | switchable |

Never a choice between the evidence-based core and fluff (learning-science rule 26).

### 8.10 Relatedness and the family-reaction relay
- She remembers the child's work, not her feelings about them: every progress callback carries an evidence id; banned shapes are missing or waiting for the child, pride as a feeling claim, exclusivity, comparisons, anything about time away.
- **Reaction relay (R14):** the milestone message offers the parent two optional pictures (clap, heart), default no action, never requested. At the child's next P0 she relays it once, in speech: [family member] + [saw] + [the specific thing]. No persistent chip, no "show me tonight". For B3-B4 a milestone is shared only if the child chose to share it. If no reaction comes, nothing is shown or said.

### 8.11 Competence feedback and teacher affect
- Feedback is about the task and process, never the person ("smart", "genius", "you're a maths kid" are banned shapes); specific and true (name the step, the strategy, the representation); never inflated; big acknowledgement only after real difficulty, calibrated to the item's predicted difficulty; comparisons only with the child's own past; struggle normalised only with real aggregates.
- **Her face follows `ReactionGate` (§3.5):** the same warm-attentive program for right and wrong; delight only on insight and effort events, constant magnitude, ≤ 1 per 5 turns.
- **Self-check at P7, at most weekly:** B1 three faces; B2 pictures (easy / tricky); B3-B4 one line. Logged as preference, never evidence.

### 8.12 Lexicon and lint scope (PD-G18)
The bilingual banned list (streak, din lagataar, XP, coins as reward, level up, unlock, inaam, rank, topper, percentile, "ahead of", jaldi, "last chance", "don't lose", miss / yaad aayi about absence, intezaar, kamzor, slow, tez as praise, hoshiyaar as praise, genius) applies to **progress chrome, child UI strings, notifications, P7 close turns and protégé lines**, with whole-word matching in both scripts. Lesson content has an allow-list (sikke and rupaye in money chapters, "slow" in a physics module, ruko as an instruction). Negative controls: "frank" passes, "sikke" in a money lesson passes, "streak" in Bagiya fails.

---

## 9. Build gates (consolidated; each needs a negative control; replaces the per-doc lists)

| id | gate | negative control | replaces |
|---|---|---|---|
| PD-G1 | Layout fit: every band × geometry × container (320 × 480, 360 × 584, 360 × 650, 360 × 744, 412 × 860, 800 × 1232, 1280 × 752, 1366 × 657, 760 × 330) × font scale 1.0 / 1.3 / 2.0 × keyboard open: regions sum, minimums hold, no clipped control, rendered on the **real signed-in lesson** | raise `ledge.h` Young to 120 | G-UT-1, G-UT-6, G-ARC-6, kids-ux G5 |
| PD-G2 | One ring: exhaustive phase (9) × geometry (5) × status (4) × band (4) × handover (6) × mic mode (2) × overlay (3) ⇒ ≤ 1 `turn` element, only in YOUR TURN | ring the mic and tiles together | kids-ux G4, G-UT-2, G-ARC-1, MW-G5, PX3 |
| PD-G3 | Geometry stability: replayed lesson logs change layout only on a phase change | a fixture toggling L2/L3 inside P3 | lesson-arc critique C6c |
| PD-G4 | Large text: screenshots at font scale 1.3 / 1.5 / 2.0 and 200% web zoom; no clipped matras; the mic on screen | fixed 40 dp caption with `overflow:hidden` | kids-ux critique C5.1 |
| PD-G5 | Status from events: replay realtime + module logs (barge-in, endpoint without speech, dropped audio); YOUR TURN only when `handover` ≠ `chain` | set a state from a literal | G-ARC-2 |
| PD-G6 | Status carriers: every state renders its glyph and accessible name; greyscale and protan / deutan / tritan screenshots distinguish all four | remove a glyph | G-ARC-8, G-VI-3 status extension |
| PD-G7 | ReactionGate: exhaustive state × face program; the same program after correct and incorrect commits; no program selected from a correct-count or streak variable | enqueue praise in LISTENING; key delight to `correct` | G-UT-3, G-VI-9 |
| PD-G8 | Targets and gestures: hits ≥ band minimum; adult ≥ 48 dp; no double-tap, long-press, pinch or rotate handlers in Young components; every swipe and drag has a tap twin | a 40 dp tile; a drag without a twin | kids-ux G1, G2, G-ARC-9 |
| PD-G9 | No-mic completion: every lesson phase, onboarding and practice completes in tap-only mode in CI | an item with a voice-only answer | onboarding critique B8 |
| PD-G10 | Audio and caption coverage: every Young or R0-R1 text node has audio; every fixed teacher line has a caption; every earcon has a visual equivalent | a label without audio | kids-ux G3, G-ONB-5 |
| PD-G11 | Text budget: Young ≤ 2 text regions, labels ≤ 4 words (B1 ≤ 3), one script per element; no kid / kids / bachcho in Older strings | a third text region on the Young stage | kids-ux G11 (proposed), G-ARC-7, G7 |
| PD-G12 | Contrast and CVD: the four contrast scripts in this folder report 0 failures in CI; ring vs fill ≥ 3:1; diagram core four ΔE ≥ 15 under all CVD types | `turn` without its ring; haldi in the core four | kids-ux G6, G-VI-2, G-VI-3, MW-G7, G-LE-11, G-UT-7 |
| PD-G13 | Token lint: no raw hex in components; `turn` only in `YourTurn`; `stop` only in system errors and never on exits; diagram tokens only under `ModuleHost`; no gold within 12° of `turn` on a YourTurn screen; decorative tokens never on text or borders; illustration audit per Forge batch | `--turn` on a card; `stop` on the house icon | G-VI-1, G-UT-4, G-VI-7 |
| PD-G14 | Devanagari: `lang` on spans; no letter-spacing; boxes ≥ 1.3 em; no `overflow:hidden` on text; `tabular-nums` in maths; stress-string screenshots at every type token on 320 dp | a Devanagari selector with letter-spacing | kids-ux G8, G-VI-5, G-UT-9 |
| PD-G15 | Motion: reduced-motion audit with every cue surviving; flash detector; auto motion > 5 s pausable; UI transitions transform/opacity only | an animated `width` in UI | G-VI-6, gurukul `check-motion` |
| PD-G16 | Frames and memory per tier on the gate devices (§7.3) | disable the 30 fps face cap | kids-ux G9, G-UT-8, G-ARC-10 |
| PD-G17 | Bundle and asset budgets (§7.3) measured over `dist/` and the APK | import Rive on the cold path | G-LE-1, G-VI-4, G-VI-10 |
| PD-G18 | Copy and lexicon (§8.12) plus the gurukul copy gate (no dashes, filler verbs, version stamps, codenames) | "streak" in Bagiya; an em dash in a button | G7, G-ARC-4, MW-G1, PX4 |
| PD-G19 | Absence invariance: home, Bagiya, Aasmaan and notebook render identically at t and t + 365 d; the bird only from `recheck_scheduled`; protégé state is a pure function of teach-back events | read `Date.now` in `ProtegeNotebook` | MW-G2, MW-G6 |
| PD-G20 | No meters, no time grids, no parent-corner imports in child routes (import-boundary test) | import a calendar component into `/c/` | MW-G4, G-LE-12 |
| PD-G21 | Spoken-turn caps (words and seconds) per band on transcripts | a 25-word B1 turn | G-ARC-5 |
| PD-G22 | Director properties: no P6 before an independent correct attempt; P2 prediction resolved before P5; mastery never from a yes/no; P7 reachable in one turn; no phase past its max | mastery from "samjha? haan" | G-ARC-3 |
| PD-G23 | Shared phone: a profile switch closes the session; nothing of child A readable as child B; picker after > 5 min background; token TTL | a switch that keeps the peer connection | G-LE-5 |
| PD-G24 | Safety on every rung: help assets in every pack and the L3/L4 builds; a crisis fixture routes to the help sheet on each rung | strip the help clip from a pack | G-LE-13 |
| PD-G25 | Onboarding: no child field before a VPC row when the flag is on; no `POST_NOTIFICATIONS`; first-audio asset in the APK and timed; process-kill resume at every step | kill at P6, lose the class tile | G-ONB-1, 3, 4, 6 |
| PD-G26 | Resilience: renderer recovery; build target = WebView floor; pinned scheme; offline e2e with idempotent replay and alternating checkpoints; LinkSupervisor traces (no switch while SPEAKING); EchoGuard fixtures; pack signature; render-loop bans; holdover guard | a tampered pack file | G-LE-2…10, kids-ux G10 |
| PD-G27 | No camera in v1: no `getUserMedia({video})` under `src/lesson/`, no CAMERA permission | add a camera call | G-UT-5 |

Plus the inherited audio floor: port Meera's echosim approach before any change to the audio path (inherited law; low-end §6).

---

## 10. Measurements before launch (prioritised; each logged with n, method and date)

**Ethics route for every child-facing test:** guardian consent, the child's own picture-assent, no child audio kept beyond the session unless the voice-moments row is on, everything recorded visible to the parent, stop at any time.

| priority | id | question | n (min) | decides |
|---|---|---|---|---|
| 0 (device lab, no children) | M-LE-1, M-ONB-1 | cold start, profile tap → clip, → live voice; realtime connect p50 / p90 by network | 30 runs per device per network | §7.3 clocks; whether P1b ships live |
| 0 | M-LE-2 | frames, memory (with background apps), heat, battery per tier | 3 SoCs × 3 runs | tier lines, governor |
| 0 | M-LE-3 | bytes per rung; are Opus fmtp preferences honoured | 10 lessons per rung | data-saver default |
| 0 | M-LE-6, EchoProbe | self-interrupt rate on loudspeaker vs wired per device class | 30 lessons per class | open-mic eligibility |
| 1 (pilot) | M-LE-15 | end-of-speech ramp (3 s / 2 s) on real child audio: cut-offs (child resumed within 2 s) | 40 children per band family | `eos.ramp` |
| 1 | M-UX-3 | tap-to-talk vs open mic (headset) for B3-B4 | 20 | open-mic default |
| 1 | M-UX-1, M-UX-2 | miss and holdover rates by tile size | 12 per band, 200+ taps each | `hit.min`, `tile.min`, guard |
| 1 | M-UX-4 | answer latency after her questions, by band, code-switching analysed separately | 30 lessons per band | YOUR TURN timers |
| 1 | M-ARC-1 | real phase durations, completion, YOUR TURN timeouts, interrogation feel | 20 per band × 3 lessons | durations; D-ARC-3 |
| 1 | M-ONB-5, M-ONB-6 | placement agreement within one rung with a trained ASER-style tester; comfort with neutral ack vs feedback vs none | 60; 40 per band | rung rules, earcon |
| 1 | M-UT-7 | do B1-B2 know she is a computer (after lessons 1 and 5) | 50 | disclosure strength (disclosure itself is unconditional) |
| 1 | M-UX-6 | illustrated vs realistic face for B3-B4, pre-registered margin and stop rule | 15 per band | the 3D head |
| 1 | M-VI-8, M-UX-5, MW-M5 | "would you mind if a friend saw this", "who is this app for", both worlds with 9-11-year-olds | 8-15 per band | Older fork, band edges |
| 1 | M-VI-9, MW-M2 | pictogram recognition; plant-stage reading | 20 aged 6-7; 20 per band | icons, stage shapes |
| 1 | M-UX-8 | caption modes for R0 / R1: delayed recall and word recognition | 40 | caption defaults |
| 1 | M-ARC-12 | accessibility pilot: captions-only, tap-only, screen-reader and switch users | 8-12 | the A-contract |
| 1 | M-LE-13 | tier A vs tier C teacher reads as the same person (10-15 raters) | 20 | flipbook art |
| 1 | M-UT-1 | chalk pointer + gaze lead vs none | 40 per band family | deixis |
| 1 (launch gate) | MW-M1, MW-M7 | does the progress layer change free-choice persistence; does learning (Pakka rate, delayed transfer) hold when engagement moves | as designed in motivation §14 | keep or strip the worlds; stop rule if delayed retention drops vs a minimal end card |
| 1 (parents) | M6 + state words | after the voice note, can the parent state one thing the child can do and the home task; do the four words read correctly | 12 (≥ 4 with ≤ Class 8 schooling), Hindi and English | PX2 words, report shape |
| 1 (parents) | M-ONB-2, M-ONB-9 | OTP success by channel and by device-has-SIM; placement shock | 500 sends; 15 parents | OTP order; R1 copy |
| 1 (parents) | M-UX-9 | child entries into the parent corner on shared phones | 20 families, 1 week | PIN-default decision |
| 2 (scale) | M-ARC-6, MW-M3, MW-M4, M3 | wrapper vs plain items; notebook read as a collection; reaction relay rate; home task vs none on delayed retention | per sibling docs | the matching decisions |

---

## 11. Decisions, open questions and risks

**Proposed `context/` entries** are in `context/inbox/design.json` (decisions `ds-layout-dp-budget`, `ds-mic-tap-default`, `ds-status-carriers`, `ds-captions-by-reading-level`, `ds-band-fork-older`, `ds-progress-no-meters`, `ds-parent-gate-pin-default`; rejections `ds-rejected-percentage-layout`, `ds-rejected-chalk-mark-gold`; measurement `design-token-contrast-2026-10-02`). The sibling docs' own proposed decisions (D-ARC-*, D-VI-*, `mw-*`, `px-*`, `onb-*`, `le-*`, ui-teardown §12) stand where §0.2 does not change them, and should be merged with the R-numbers above as `supersedes` edges where they do.

**Open questions (owner or measurement):**
1. **"Exactly human" vs the uncanny valley.** The owner's goal is an exactly human teacher; the evidence predicts a near-human face creeps out children from about age 9. This spec makes her human in voice, timing and memory and keeps the face illustrated until M-UX-6 says otherwise, with a stop rule. If the owner overrides, the `StageFrame` and tier A already hold a realistic head; the disclosure rules and the ReactionGate apply unchanged.
2. **Retention cost of a reward-free product.** Every competitor uses a reward layer; Mindspark's Indian evidence comes with points [M]. Accept a DAU gap if delayed-retention learning holds (MW-M7); reverse only on learning evidence.
3. **Second teacher character and voice:** which Azure realtime voice pairs with the male character, and whether the TTS ladder rung can match it (M-LE-10 per character).
4. **Word timing for captions and pointer cues:** the WebRTC lane has no word timestamps; E-8 or a move to Voice Live decides whether word highlights and word-timed pointing ship at all.
5. **Azure-only vs messaging:** check Azure Communication Services coverage for Indian SMS and WhatsApp before choosing a BSP; the owner rules on any exception (onboarding §13.6).
6. **Shared-device safety alerts:** whether WhatsApp carries safety alerts at all on households where the child holds the parent's phone is a safeguarding-expert decision.
7. **Android 8/9 share** in the target families: measured in beta, decides how much the PWA lite path must carry.

**Risks:** the spec's numbers are starting values, and the biggest unknowns sit in the first minute (connect time, ASR on real children, echo on loudspeakers). The device lab and the first pilot (§10 priority 0-1) come before any visual polish.

---

## 12. Sources

**Sibling design docs (this folder), each with its own source list:** `kids-ux-ages.md` · `lesson-arc.md` · `ui-teardown.md` · `visual-identity.md` · `motivation-without-rewards.md` · `parent-experience.md` · `onboarding-flow.md` · `low-end-offline.md`. Scripts and data: `kids-ux-contrast.py`, `visual-identity-contrast.py`, `visual-identity-critique-probe.py`, `visual-identity-fonts.py` (+ JSON), `motivation-contrast.py`, `low-end-cascade-probe.mjs` (+ JSON), `low-end-data-budget.py`, `onboarding_reviews.py`, `onboarding_login_themes.py`, `ui_teardown_reviews.py` (+ JSON), and **`product-design-contrast.py`** (this pass; 0 failures).

**Upstream repo docs:** `docs/research/learning-science.md` · `docs/harvest/gurukul.md` §4.7, §6 · `docs/ARCHITECTURE.md` §1-§2 · `context/decisions.md` (`voice-realtime-model`, `voice-turn-config`, `azure-only-compute`) · `context/measurements.md` (`infra-smoke-2026-10-02`, `realtime-audio-in-2026-10-02`) · `src/lesson/status.ts`.

**Fetched this pass [V], 2026-10-02:**
- W3C, Web Content Accessibility Guidelines 2.2 (normative text for 1.4.2, 1.4.4, 1.4.11, 2.1.4, 2.2.1, 2.4.11, 2.4.13, 2.5.2): https://www.w3.org/TR/WCAG22/
- W3C, Understanding SC 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- W3C, Understanding SC 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Android 14 features, non-linear font scaling to 200%: https://developer.android.com/about/versions/14/features#non-linear-font-scaling
- Android, make apps more accessible (48 dp touch targets, content descriptions): https://developer.android.com/guide/topics/ui/accessibility/apps
- Meta, WhatsApp message template components (header types, body and button limits): https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components
