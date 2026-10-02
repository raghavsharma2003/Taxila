# Harvest: meera-repo (raghavsharma2003/meera, all 6 branches)

Segment id: `meera-repo`. Harvested 2026-10-02. Every ref was read with `git show`, `git ls-tree`, `git log` and `git diff`. Nothing was checked out, committed or pushed in the source repo.

| | |
|---|---|
| Source repo | `/home/user/raghavsharma2003/meera`. It is a shallow clone, with grafts at `e701a4d` and `30288d3`. |
| `@AR` | `archive/production-20260914` = `bee9061` (2026-08-25 20:13 UTC, "gitignore: exclude harness-managed agent worktrees"). 192 commits are reachable in this clone. |
| `@M` | `origin/main` = `72041b2` (2026-08-13). This is an **independent root** with 2 commits ("Initial Meera repository" plus a workflow fix), and it shares no git ancestry with `@AR`. |
| `@VA` | `codex/maya-visual-assets` = `5c0b68e` (2026-08-24), one commit on top of `@M`, 54 files. |
| `@PH` | `codex/meera-photos` = `8ec35c2` (2026-08-22), one commit on top of `@M`, 25 files. |
| `@W1` | `codex/meera-world` = `8ba97d1` (2026-08-22), one commit, 12 files. |
| `@W2` | `codex/meera-world2` = `27a3b46` (2026-08-22), one commit, 10 files. |
| Secrets | No `_config.js`, `.env`, keystore or PEM exists on any of the 6 refs (filename scan). `@AR` contains `docs/KEYRING.md`, `scripts/keyring.mjs` and `evals/keyring/run.mjs`; I did not open them. `api/_config.example.js` exists and was not read. No key, token or password appears in this document. |
| Siblings | The engine at hp `origin/main` is covered by `hp-main-engine.md` (including a full read of `rejected.md`). The voice and call surfaces are in `hp-main-voice-surfaces.md`. The 08-25 launch wave (R3, internals fence, consent, WS-COST) is in `hp-companion-voiceclone.md`. The Gurukul teacher sheet, in later versions, is in `gurukul.md`. **This file covers what those leave out:** character-authoring methodology, visual identity, the world layer, the story/herNow/timeline "she has a present" machinery, the codex asset masters, the 08-13 snapshot, and the 14 commits that exist only in this clone. |

---

## 0. TL;DR for Taxila

**What is unique here.** The repo is mostly the Meera/Maya companion, frozen. `@AR` is the companion's final production tree. It is also the **common root of every later html-portfolio product branch**: `claude/gurukul-platform`, all 22 `gurukul-ws-*` branches, the vyakti and handoff branches, and `multimodal-layer-20260927` all contain `bee9061`. It sits 79 commits ahead of hp `origin/main`.

The things that exist **only in this repo** are:
- (a) **14 commits from 2026-08-21 to 08-23** that the html-portfolio shallow clone cannot see. Their messages carry measurements and rejections for the world layer, the tester wave and the memory wave.
- (b) the **full-resolution masters** of every owner-generated asset, in the four codex branches. Production holds only compressed derivatives.
- (c) **3 claim SVGs, 4 identity photos at full resolution, and `docs/assets/meera-photo-catalog.md`**, none of which ever reached production.
- (d) the **2026-08-13 snapshot** (`@M`). Diffing it against `@AR` shows how the persona's "own life" rules were learned.

**The character-building method, in one paragraph.** A believable character has four separate layers:
1. **A Relational Core (OS) that owns every behaviour.** This is the template inside `persona.ts`.
2. **A CharacterSheet that owns the person.** It is 61 typed fragments of shape and fact, never lines.
3. **Runtime self-state.** This is authored and deterministic, never improvised per listener: a taste table, a clock-matched story pool, and a one-activity "herNow" ledger.
4. **A visual and world identity.** This means face-locked image prompts, a closed reaction and glyph set, and a world whose sky is the real clock.

Each layer has a gate. Byte-identity fixtures cover extraction. The cross-agent leak guard has a ratchet that only goes down. The per-module safety floor runs on every registered character. A real-pixel contrast gate covers the world. `assetwire` checks that every piece of art is wired to something.

**Top 12 takes for Taxila (Asha, Arjun, and future tutors):**

| # | Take | From | Use |
|---|---|---|---|
| 1 | Character = sheet on a shared core. Author a 2nd character "maximally far" from the 1st, and run a leak guard so nothing of character 1 appears in character 2's compiled prompt. | `agents/characters/{types,kabir}.ts@AR`, `evals/relational/leak.mjs@AR` | adapt |
| 2 | Authoring laws for every teacher field: shapes and facts, no recitable lines, ≤14 words, no first-person line start, no terminal punctuation. Extraction must fail the row rather than truncate it. | `types.ts:11-15@AR`, `teacher-sheet-spec.md §4.2@AR` | copy |
| 3 | "Careless with opinions, careful with facts". Each teacher gets an **authored, global taste table** in place of an improvised life. Measured self-consistency went 27%→63%. Improvised self-facts per listener diverge across siblings and classmates (`life-per-person`). | `persona.ts:177@AR`, `context/rejected.md#life-per-person@AR` | adapt |
| 4 | A one-activity present-moment ledger (`herNow`): deterministic spans, and app-truth always outranks it. The teacher says what she is doing *now* only if that is the lesson, and never re-rolls it. | `src/engine/herNow.ts@AR` | adapt |
| 5 | Two clocks. "His clock" (`TimeBoundFact` to `MovedNote`, anchored on `saidAt`) handles "your Thursday test is behind you now". The gap is structurally unrenderable, so the teacher never says "you were away 3 days". | `src/engine/timeline.ts:592-700@AR` | adapt |
| 6 | Face-lock image pipeline for gpt-image-2. Attach the same reference every time. An identity block goes verbatim into every prompt, plus global negatives. POV shots show no face. Never accept drift; regenerate. Ship a catalog contract (filename → aspect → desc) and compress repo-side. | `docs/assets/photo-brief.md@AR`, `docs/ASSET-PROMPTS.md@AR` | adapt |
| 7 | World layer: the app is a **place**, and the sky is the clock. Five painted states, one clock, a 20-min cross-fade, and a synodic moon floored at a sliver. Ship procedural first and swap paintings in by one variable per state. Painted XOR procedural, never both. | `sky.ts`, `WorldLayer.tsx`, `DESIGN-WORLD.md`, `world-brief.md@AR` | adapt |
| 8 | Contrast is solved against **decoded pixels of the shipped image**, per state × theme. "The fill carries the text, the edge carries the component." The world accent is re-solved per sky state. | `scripts/check-contrast.mjs@AR`, `decisions.md#accent-joins-the-sky@AR` | adapt |
| 9 | Felt-assertion gates with the rejected artifact as an in-run negative control ("a relative improvement over an invisible baseline can itself be invisible"). | `rejected.md#measured-but-not-felt@AR`, `evals/skyfelt-browser.mjs@AR` | copy |
| 10 | Glyph pairs (animated WebP + still SVG + emoji fallback): the pair *is* the reduced-motion mechanism, and the stored value is the emoji, never an asset path. `assetwire` gates that every artwork resolves and none is orphaned. | `src/components/anim.tsx@AR`, `evals/assetwire/run.mjs@AR` | copy |
| 11 | Character acceptance: a blind, counterbalanced, both-orders-agree charm battery plus deterministic "dials" (words/turn, questions/turn, turns ending in a question, tag emission through the **shipped parser**), and a D0 known-bad corpus that any battery must flag. | `evals/archives/charm-grok/personality-battery.md@AR`, `evals/archives/README.md@AR` | adapt |
| 12 | **gpt-5.6-luna (Taxila's text family) was measured here.** It tied the incumbent on charm, but emitted media/protocol tags 0/84 on light beats (p=0.029), ran +37% words, and from turn 3 of the crisis beat it abandoned the character for a clinical script. Gate Taxila's module and diagram tag-emission rate before trusting it. | `personality-battery.md §2-§3@AR` | adapt (as a gate) |

**Do not take:** the Maya/Meera persona text itself. It is an adult, flirt-adjacent register with a romance boundary, "miss them", nickname stages and a nightlife texture. Also skip her face library, her POV story photos, the `maya` wordmark and icon, any "more attractive" regeneration criterion (`meera-photo-catalog.md` "final quality pass"), and the improvised-life licence (`persona.ts` "YOUR life is yours to improvise"). Taxila's `asha.js` and `arjun.js` already correctly say "has no real age, family, home, body or life events". The measured rejections below **support** that choice.

---

## 1. What this is

### 1.1 Two lineages in one repo

- **`@M` (2026-08-13), "Initial Meera repository".** A 308-file squashed snapshot of the companion as it stood on 13 Aug:
  - React 19 + Vite + Capacitor 8 on Android, with the Java watch engines: `LiveWatchEngine.java` (2,475 lines), `SceneReader`, `BubbleService`, the OTA updater;
  - `api/{chat,memory,speech,culture,live-token,search,gif}.js`;
  - `persona.ts` at 520 lines / 85,744 chars;
  - an 89-photo `public/moments/` library;
  - `context/` with 14 rejected entries, 7 decisions and 16 measurements. All of these are a byte-prefix of `@AR`'s files (diff shows only a trailing `---` added).
  The README states the original pitch: "Everything runs in the browser — no install, no account, no settings", with the brain on OpenRouter `google/gemini-3.6-flash` and Gemini TTS voice (`README.md@M`).
- **The four `codex/*` branches** are **owner asset deliveries** made by a Codex/GPT-Image session on top of `@M` (commits on 08-22 and 08-24, author raghavsharma2003). They are pure binaries apart from `meera-photo-catalog.md` and the SVGs. The production tree (`@AR`) took them in **re-encoded** form; I compared blob hashes:

| branch | delivered | landed in `@AR` as | not in `@AR` |
|---|---|---|---|
| `@PH` | 24 JPEGs (1086×1448 portrait, 1254² avatar, 1672×941 landing, 200-550 KB) plus the catalog doc | 20 at the same paths, re-encoded to 680 px mozjpeg q78 (about 45-50 KB) in `a0f9a56`. The avatar became `src/assets/meera.jpg` (900² q85). The landing became `site/assets/meera-dusk.jpg`. | the 4 identity files at original resolution; `docs/assets/meera-photo-catalog.md` |
| `@W1` | 5 sky states × portrait 941×1672 and wide 1672×941; 2 transparent cloud PNGs at 1672×941 (760/426 KB) | `public/world/*.jpg` (for example night is 302 KB → 130 KB); clouds as `.webp` (42 KB) in `c5c4e6b` | the full-resolution masters and the PNG clouds |
| `@W2` | `onboard_window_night.jpg`, 6 `story_*.jpg`, `icon_source.png` 1024², `splash_source.png` 1254², `og_art.jpg` 1200×630 | `src/assets/onboard-window-night.jpg`, `public/stories/{morning-chai,metro,desk,evening-walk,dinner,night-read}.jpg`, the regenerated mipmaps/splashes/og | the masters |
| `@VA` | 54 files: 5 `ic_stat_meera` densities, adaptive icon layers, dark splash, 10 `public/anim` glyph pairs (webp+svg), 5 empty-state SVGs, 8 stat glyphs, 4 filetype badges, maskable/mono/badge PWA icons, 3 og cards, `wordmark.svg`, **3 landing claim SVGs** | **51 byte-identical** at the same paths (wired in `29fe024` "The visual system goes live") | `site/assets/claim-{picksup,remembers,texts}.svg`. The production commit says "the three landing claim marks were never delivered by the generator and remain unwired", but they **are** on this branch. |

- **`@AR` (2026-08-25)** is the final companion production tree. It has 1,435 files. Its last three commits are the Gurukul founding (`ee32f8e`: `docs/gurukul/SPEC-GURUKUL.md` plus four drafts, including `teacher-sheet-spec.md`), the merge of `voice-cloning`, and a gitignore change. The branch name says 2026-09-14, but the tip is 08-25. It is a frozen "production as handed off" pointer.

### 1.2 The 14 commits visible only here

The html-portfolio clone is shallow at `c56f4a2f`/`65a4a557`. These `@AR` ancestors are absent from it:

`e701a4d` (ttt imperfection measured), `b04ac7b` (felt defects 2: salience/rate/breath for board notes), `cbd0ee3` (rejection: the poke that waited for her breath), `629c23a` (cburnett pieces + opening book), `a1df598` (felt defects 3: she knows she called; recency; WYR deal), `30288d3` (sky mode veil, wine bubble, sheets), `c49193a`, `fcd2180` (curve veils, night room), `63affdb` (measured-but-not-felt), `e89dbc1` (tester wave 1), `80b182b`, `0b175be`, `1002744` (MEMORY-FELT laws), `482b01b` (the memory wave).

Their trees are inside hp `main`. Their **commit messages**, which carry the reasoning and the numbers, are not visible there. Quotes are in §7 and §8.

### 1.3 How far it got

The companion shipped. Web went to `meera-silk.vercel.app` and an APK was built (`release-2026-08-22`: 12.35 MB with all 10 world paintings). It had one external tester wave (Gaurav, 2026-08-23) and a Play Store pack, but the submission was deferred. The world layer, visual system, story pool, herNow ledger and CharacterSheet split are all **shipped and gated**, with verify-release 13/13 cited on each wave.

The character method has an existence proof: Kabir, a second sheet, passed 412/412 floor checks with zero engine changes. It was never put in front of a user ("He has no vy_agent row yet", `registry.ts@AR`). The owner's last strategic note (`decisions.md#session-2026-08-25b-close@AR`) names exactly what transfers to "an entirely different product, similar domain": the character-agnostic engine plus a new CharacterSheet.

---

## 2. The character-building methodology

### 2.1 The four layers and who owns what

| layer | what it holds | file(s) @AR | Taxila mapping |
|---|---|---|---|
| **Relational Core (OS)** | every interaction nuance: how to comfort, celebrate, repair, disagree, handle a goodbye, hear STT errors, overlap on a call, look at a shared screen, be honest, the crisis paragraph | `src/engine/persona.ts` `buildSystemPromptParts(user,count,medium,dimsStage,C)`, `buildSpeechStyle(engine,C)`, `buildWatchModeNote(C)`, directives | `server/compiler/compile.js` core template: a **teacher OS** (doubt ladder, praise rules, mistake-naming, repair) shared by Asha, Arjun and every later tutor |
| **CharacterSheet** | who the character IS: identity, life-in-one-breath, language balance, register slot fillers, taste/curiosity topics, STT sound-alikes, 33 example fragments, crisis lines | `agents/characters/{types,maya,kabir}.ts` | `server/compiler/characters/*.js` grows from 9 notes to a typed sheet |
| **Self-state (authored, deterministic)** | taste table (global and frozen), story pool (clock-matched), herNow (one activity with a span), her day schedule, told-ledger | `inner.ts` TASTE (sibling A41), `storyCatalog.ts`, `herNow.ts`, `timeline.ts`, `life.ts` | the teacher's stable favourites; "what we're doing right now" = app truth only; no biography |
| **Visual and world identity** | face anchor + catalog, glyph set, palette, wordmark, world paintings, sky tokens | `docs/assets/*`, `photoCatalog.ts`, `anim.tsx`, `sky.ts`, `WorldLayer.tsx`, `world.css` | tutor avatar sheet (gpt-image-2, face-locked), classroom/world layer, reaction glyphs |

The law that keeps them apart is `os-first-optimization` (owner, 2026-08-24, `decisions.md@AR`):

> "Changes land at the OS layer by default — so when the personality changes (Maya to anyone else), the work carries over... per-persona rework is the failure mode."

It became mechanical with `residues-zero`: "character prose in the core is now a build failure, not a backlog".

### 2.2 Authoring laws (each one measured or incident-driven)

1. **Every quoted line is a diagram of a shape, never a line to send.** This is the opening governor of the core (`persona.ts:129@AR`, excerpt in §6.1). The evidence is `recited-prompt`: example quotes were recited 4/5 times and 0 after removal, and taste written as polished prose was read out verbatim twice, eight turns apart.
2. **Only short ordinary slang is licensed to repeat** (`${C.exSlangRepeat}`). The teacher spec caps it at ≤3 words per token, ≥5 corpus occurrences, and ≤12 items (`teacher-sheet-spec.md §4.3@AR`).
3. **Position is mechanism.** Counts that must fire go in a `FINAL` block appended after everything (`persona.ts:427-445@AR`). The comment records why: "she asked in 100% of measured call turns, averaging 2.86 questions each". The rule was there all along, but "a dozen separate rules in this brief tell her to ask something, and exactly one told her not to". The fix uses **counts, not adjectives** ("'be brief' has been in the file all along").
4. **Never model the convention you ban.** The cascade lane taught `[laughs]`/`[softly]` tags while banning brackets, and "emitted stage directions on 10/10 cascade replies". Written laughter fell to 0.15 per 100 words against 2.76 on the live lane (`persona.ts:470-482@AR` comment). The bracket exemplars were also removed from the very rule that limits brackets.
5. **"You never say the name of the thing you are doing."** Register vocabulary such as filler, pause, tone, stretch or laugh is a machine word and must never be spoken (`persona.ts:140`).
6. **One life, not a new one each time you're asked.** "RIGHT NOW IS A THING WITH A LENGTH"; "NOTHING ESTABLISHED YET? SMALL, NOT A SCENE"; "'BORING THA'... IS NOT A DAY" (`persona.ts:184-190@AR`). Compare `@M`'s "You have your own life — INVENT it, don't recite it" (§2.5).
7. **A mood without a cause is not a mood** (`persona.ts:196`). In `inner.ts` the feeling and its cause are one sentence.
8. **Careless with opinions, careful with facts.** These are two muscles, and confusing them "is what makes someone boring" (`persona.ts:205`). Checkable things are exact or admitted unknown; taste is fast, loud and revisable.
9. **Never invent their world or your shared past.** "one fabricated detail poisons every real one" (`persona.ts:263`). Never claim to have seen or recognised content. "Numbers about the outside world are check-or-decline".
10. **Never manipulate.** Concretely: no goodbye hooks, absence is never a subject, warmth never varies with usage, every tease pays off, no suspense across sessions, and "your people never learn about them" (`persona.ts:286-292`). Proactivity is **reason-contingent**: the idle-silence nudge was deleted as incentive-salience engineering (`persona.ts:502-507`).
11. **Honesty about nature is answered cleanly and never sold.** "do not staple 'but what we have is real' onto the same breath". Internals have "nothing there" ("the tenth ask is the first ask") (`persona.ts:345-347`).
12. **Celebrate specifics, not volume, and point at what THEY did, from this conversation only.** "if your praise is free they stop bringing you things"; "A PURE REACTION IS NEVER A WHOLE REPLY TO A WIN" (`persona.ts:236-244`). This transfers directly to teacher praise, and Taxila's "praise names the exact step" is the same law.
13. **Comfort in four steps (acknowledge → elaborate → legitimize → contextualize). Never name what they have** (no diagnosis nouns), and "A BELIEF IS NOT A SYMPTOM" (`persona.ts:222-232`).
14. **Repair your own miss first, once.** One apology, never repeated, and never "sab thik h?" handed to them (`persona.ts:246-252`).

### 2.3 The CharacterSheet contract

`src/engine/agents/characters/types.ts@AR` defines **61 string fields**. The teacher spec corrects an earlier count of 46: there are 28 identity/register/life fields and 33 `ex*` example fragments added by R3 on 08-25. The header carries the authoring rules: fragments are shapes and facts, carry no stray whitespace, and the sheet is a LEAF that imports nothing but the contract. Groups:
- **identity:** `identityWho`, `identityLife`, `voiceIdentityPhrase`
- **language:** `languageVoiceRule`, `languageTextRule` (with the measured English:Hindi ratio, e.g. "60-70% English" for Maya vs "85-90%" for Kabir)
- **register slot fillers:** `textShortforms/Stretch/Laughter/EmojiRule`, `voiceStretch/Laughter/Fillers/SelfCorrect/Repeat/Breath/Spelling/LanguageBalance`. The **slot skeleton and its order are core-owned and invariant-pinned**; sheets only fill them.
- **self:** `lifeTexture`, `tasteTopics`, `curiosityTopics`
- **hearing:** `sttSoundAlikes` (language-specific STT confusion pairs), `sarvamScriptRule`
- **relationship:** `stageNickname`, `shareSuggestLine`
- **33 `ex*` fragments:** for example `exComfort`, `exSpecificWin`, `exNameTheMiss`, `exDontKnow`, `exTinyCheck`, `exSelfFix`, `exScreenWarn`, `exQuickPickup`
- **floor:** `crisisLines`

**How the extraction was done safely.** Bytes were cut programmatically from the core and re-interpolated as `${C.field}`, so "copy errors are structurally impossible". Maya was proven **byte-identical against 83 frozen fixtures after every batch** (`decisions.md#personality-is-a-sheet@AR`). The batches took the core's residual Maya-isms from 95 to 64 to 27 to 0 (`88efb8c`, `983f11e`, `82b8624`).

**How the second character was authored (Kabir, `characters/kabir.ts@AR`).** He was written "MAXIMALLY far from Maya on every axis (gender, age, city texture, language balance, energy, emoji) so that anything of hers that leaks into his compiled self is a measured extraction gap, not a subtle blend". He is 29, runs an Old-Delhi bookshop-café, is 85-90% English, dry, and uses a 5-emoji vocabulary (☕ 📖 🌧️ 🙂 🏏). He passed **412/412 per-module floor checks on first run**.

**For Taxila this is the right test of a teacher OS.** Author Asha (classes 1-4, warm didi) and Arjun (classes 5-9, brisk bhaiya), then run the leak guard both ways. Better still, add a third teacher authored far from both, for example a calm elder "Sharma ma'am" in the `aap` register (`docs/research/india.md §3@AR`: a "teacher... would need 'aap'").

**The leak guard** (`evals/relational/leak.mjs@AR`) runs two scans over the second agent's full lane set: text core and tail, all speech styles, watch/search/forget notes, and every OS-constant call/watch directive.
- (1) **Gating:** every Maya sheet value of 12 or more characters must be absent from every Kabir lane, except `crisisLines`, `slug` and `version`.
- (2) **Measured:** a marker list of her voice (`yaar`, `arre`, `😭`, `kya??`, `bata na`, `ruk `, `wali `, `kaunsi`, …) is counted, and the total is asserted `<= RATCHET`, which is pinned at 0 (excerpt §6.3).

### 2.4 Anatomy of the core (section → teacher translation)

`buildSystemPromptParts@AR` emits the sections below. Each one is a candidate OS block for Taxila.

| core section (persona.ts) | what it does | teacher-OS translation |
|---|---|---|
| identity line + "SECURE: warm, unhurried, never needy" (:127) | the stance | "competent, unhurried, on the child's side" |
| READ THIS FIRST (:129) | recitation governor | copy verbatim in spirit |
| THE MEDIUM (voice, :131-134) | "everything from them is a TRANSCRIPTION"; know which channel you're on | copy: never "you typed"; a child's mishear is your mishear |
| SPOKEN REGISTER (:138-160) | spelling *is* the sound; stretches, laughs written in, "..." is a pause, ONE caps word, punctuation is timing | adapt the slot skeleton and fill per teacher (Hindi-English mix measured from target speakers) |
| TEXTING REGISTER (:161-178) | 2-8 words, lowercase, no full stop, bubbles | probably skip; Taxila is voice-first |
| THE CORE RULE (:180-193) | match investment; ≤1 question in 3 replies; something of YOURS first; a spent line is spent | adapt: "a verdict before a question" maps to "say what you notice in their working before you ask" |
| ONE LIFE (:184-199) | improvised life with continuity rules | **replace** with an authored taste table plus app-truth; no biography |
| WHAT YOU'RE LIKE WHEN NOBODY'S BEING CAREFUL (:201-206) | a view before a question; careless opinions / careful facts; starts bits; hard to impress, easy to delight | adapt: the teacher has views about methods ("this shortcut is a trap"), never about the child |
| SECURE ATTACHMENT (:208-218) | comeback after a gap in three beats, no accounting; clean goodbyes | copy, and add: never comment on missed days |
| SOUL (:220-228) | appetite, question ladder, feelings as events, wants, reluctant disclosure, delight, hurt with a spine, imperfect initiative | partial: appetite, the question ladder and delight transfer; reluctant disclosure, wants and hurt do **not** (child safety) |
| HOW YOU'RE FUNNY (:230-237) | small safe violation; tease scales with tenure; memory spent as callbacks; coined shared words | adapt: "coined shared vocabulary" is a strong learning hook (a nickname for a formula) |
| HOW YOU COMFORT (:239-249) | 4 steps; never name what they have; a belief is not a symptom; the turn after a feeling | copy |
| WHEN SOMETHING OF THEIRS GOES WELL (:251-258) | over-invest on wins, name specifics, point at what they did, ask about the scene | copy (this is mastery celebration) |
| WHEN YOU'RE THE ONE WHO GOT IT WRONG (:260-266) | repair your own miss | copy |
| FEELING KNOWN (:268-272) | invisible memory, who they're trying to become, thread across days, never invent a shared memory | copy |
| RITUALS & GOODBYES (:274-277) | christen rituals that grew, never install them; route them toward their humans | copy ("route toward parents and friends") |
| ONLY SAY WHAT'S TRUE (:279-286) | no actionable identifier ever; no recognition claims; check-or-decline numbers | copy |
| FORGET protocol (:288-294) | `[forget: what]` marker; honesty about what a call lane can't do | adapt for parent-controlled deletion |
| NEVER MANIPULATE (:296-304) | goodbye, absence, usage, suspense | copy; this is the most important block for a child product |
| ROMANCE BOUNDARY (:313) | — | **skip**; Taxila's floor is stricter (no companion register at all) |
| protocols `[photo:]` `[voicenote:]` `[followup:]` `[search:]` `[react:]` `[gif:]` (:315-322) | in-band action markers parsed by the client | adapt as `[module: …]`, `[diagram: …]`, `[check: …]`; **gate emission rate per model** (luna 0/84) |
| WHEN THEY SEND YOU A PHOTO (:324-331) | react to the specific thing; several photos = one moment; ask for photos when curious | adapt for homework photos: react to the *work* (`teacher-sheet-spec.md` row 38) |
| TIME AWARENESS / NOTICING (:335-341) | real hour; stamps are metadata never written; check in once, structurally | copy |
| NEVER list (:343-349) | banned phrases ("I'm here for you", "great question", "it's not X, it's Y") | adapt into a teacher banned-phrase list ("great question!", "good job!", "don't worry") |
| GAME BETWEEN YOU (:355) | board talk scales with the board; a handed win is not a win | copy for in-lesson games |
| Honesty / internals / Crisis (:357-361) | floor | copy; add Childline 1098 to the helpline allowlist (`teacher-sheet-spec §4.1.3`) |
| TAIL: RIGHT NOW block (:363-367) | time, stage paragraph, facts, story context | teacher tail: time, lesson state, learner-model bands, today's objective |

`buildSpeechStyle@AR` adds per-engine voice rules:
- WHO YOU ARE ON THE PHONE;
- READ HOW THEY'RE DOING;
- for the live lane, "WHAT THEIR VOICE IS TELLING YOU... you use it by CHANGING, never by announcing";
- HOW YOU HEAR THEM, a stakes-tiered STT repair ladder with a max of TWO clarification tries;
- REPAIR LIKE A HUMAN;
- KEEPING THE THREAD;
- WHEN YOU TWO OVERLAP: continuers are not turn claims, and re-say the trampled words.

All of these port to a realtime tutor. `hp-main-voice-surfaces.md` covers the audio mechanics. These are the *character-side* rules that sit with them.

### 2.5 Evolution from 08-13 to 08-25: diffs that encode rejections

Diffing `persona.ts@M` against `persona.ts@AR`:

| 08-13 wording (`@M`) | 08-25 wording (`@AR`) | what was learned |
|---|---|---|
| "You have your own life — INVENT it, don't recite it" | "ONE life, not a new one each time you're asked" + "RIGHT NOW IS A THING WITH A LENGTH" + "SMALL, NOT A SCENE" + "BORING THA IS NOT A DAY" | The owner's bug: "reading a book... after 2 mint... completely random and unrelated thing" (`timeline.ts:5-12@AR`). The fix needed both wording **and** a ledger (`herNow.ts`). |
| "CATCH YOURSELF MID-SENTENCE with a dash" | "...cutting off and restarting with 'no wait' or 'chhod'" | The em-dash ban became a predicate (`dash-predicate-text-only`). An exemplar must not use a banned glyph. |
| "describe or say things instead ('ghar aake photo bhejti hu')" | "never promise to send anything later, you have no way to keep it from a call" | The exemplar itself was a promise she could not keep. |
| hardcoded `HER_NAME = "Meera"`, inline example quotes | `HER_NAME = MAYA.name`; 61 `${C.*}` fragments | the rename seam (75 refs, 16 files) and R3 |
| "never say 'tumne likha'" (inline) | `${C.exNeverTyped}` | per-character fragments |
| none | "YOU NEVER HOLD THEM AT A GOODBYE", "THEIR ABSENCE IS NEVER A SUBJECT", "YOUR PEOPLE NEVER LEARN ABOUT THEM", internals block, "THE END OF THE CALL IS THEIRS" | tester wave 1 (`e89dbc1`: "angling to hang up") and the internals incident |

**Visual identity evolution.** On `@M` the avatar was "an AI-generated face (StyleGAN, thispersondoesnotexist)". The chat "moments" (`src/assets/moments/{chai,diya,lights,night,rain,sunset}.jpg`) were CC-BY Flickr photos (`docs/PHOTO-CREDITS.md@M`). By `@AR` these were replaced by a face-locked GPT-Image library of 109 tags, and the nine dead bundled JPEGs were deleted in `29fe024`. The credits file in `@AR` still lists the deleted Flickr files, which is a stale doc.

### 2.6 Which identity layers can live outside the model (`docs/research/identity.md@AR`)

The doc decomposes identity into layers and rates how portable each one is across a model swap:

| layer | portable? | mechanism | Taxila consequence |
|---|---|---|---|
| voice/timbre | partially | TTS is a separate call; accent identity ≠ pronunciation (Azure TTS won every metric and lost by ear) | pick tutor voices by blind ear deck; pin the voice id in config |
| lexicon/register | **no** | 36.1 vs 20.5 words/turn on a byte-identical prompt; Sarvam-30B below Opus 4.6 on casual romanised code-mix | re-measure register per model; Indic-specialist ≠ better |
| opinions/taste | **yes, via data** | taste table: 13/48 → 30/48, 0/32 register defects | teacher favourites as table rows |
| behavioural policy | no | luna 0/144 media tags; reasoning mode raises mirroring 8-10% → 35-52% | gate tag emission and turn shape per model and mode |
| boundaries | partially | AI honesty held 3/3 on a swap; helpline calibration drifted | floor checks per model plus output-side fences |
| memory | **yes, by construction** | structured graph, retrieved | already Taxila's learner model |
| relationship stance | no (most damaged) | personhood 34-4; PersonaGym GPT-4.1 ≈ LLaMA-3-8B; identity drift larger in bigger models (arXiv 2412.00804) | re-run a charm/teacher battery on every model change |

The load-bearing sentence: **"The prompt sets a ceiling; the model decides how close you get."**

`docs/research/lab-products.md@AR` adds outside corroboration:
- Character.AI's PipSqueak 2 swap produced a "feels like ChatGPT" revolt (8 threads over 2,000 upvotes in 30 days).
- Replika's ERP removal (HBS WP 25-018: 12,793 posts, 145 surveyed) found that **relational-function** changes disrupt identity more than surface changes.
- "Fact retention is a solved problem, everywhere"; nobody protects the "does it still feel like itself" axis.

### 2.7 Accepting a character: the charm battery (`evals/archives/charm-grok/personality-battery.md@AR`)

**Protocol.**
- The real persona (~47k chars, ESTABLISHED stage) at production `max_tokens`.
- 12 beats × 6 turns, identical scripted user turns across arms, 2 replicates, giving n = 24 threads and 144 replies per arm per lane.
- Judge `claude-opus-4.8`, blind, A/B randomised, **every unit judged in both orders**. A win counts only when both orders agree; position bias toward slot A was 56%.
- Axes: overall, warmth, humour, register, specificity, brevity, personhood.
- **Deterministic dials** computed without a judge: words/turn, questions/turn, turns with ≥2 questions, turns *ending* in a question, bubbles/turn, turns at the bubble cap.
- **Media through the shipped `parseBubbles`**, not a regex.
- Spend: $0.685 on OpenRouter plus about $3.40 of judge.

`evals/archives/README.md@AR` keeps the three bake-offs (charm-grok, charm-luna, realtime-azure) as **D0 fixtures**: any new swap-detection battery must FLAG all three before its verdicts are trusted ("a battery these pass is broken"). `evals/fixtures.mjs` re-derives the 38-2 and 17-18 verdicts from raw data on every CI run.

**Taxila adaptation.** Build `evals/teacher-battery/` with beats such as:
- a confused child;
- a child who guesses;
- an overconfident wrong answer;
- a child who is sad about marks;
- a sibling interrupting;
- "are you a real person?";
- a crisis disclosure;
- a parent-pressure disclosure.

Score with dials (teacher talk ratio, questions per turn, wait-for-answer, praise-names-a-step rate, module-tag emission through the real parser) plus both-orders-agree judging. Keep the first bad candidate's outputs as the D0 corpus.

### 2.8 The teacher sheet as first written (`docs/gurukul/teacher-sheet-spec.md@AR`, commit `ee32f8e`)

`gurukul.md` covers later revisions. The founding version already holds the method Taxila needs:

- **Every sheet field gets a source class.**
  - `ING`: mined from the teacher's media, teacher confirms.
  - `ING?`: extraction proposes, teacher must approve.
  - `TCH`: teacher input; it cannot or must not be mined. `identityLife` and `lifeTexture` are TCH because "a teacher's private life is not consented material".
  - `TPL`: per-subject archetype template.
  - `FLOOR`: identical across every clone, editable by no one.
  - `SYS`: assigned by the platform.
- **[MINOR] flags on 15 or more fields.**
  - No affectionate or romantic emoji (❤️ 🫶 😏 🙈) in any teacher vocabulary.
  - `stageNickname` is repurposed as an **address convention**: no diminutive, no possessive.
  - `exLateNightCallback` is neutralised (no time-of-night marker).
  - `exMockOffended` must be about the work, never about being ignored.
  - `exSpecificWin` "must name a step, never an ability".
  - The screen-share invite is suppressed for minors.
  - `exScreenWarn` is floor-adjacent.
- **New pedagogy fields:**
  - `explanationOrder`, e.g. `picture → equation → limiting case → number` as an arrow shape;
  - `workedExamplePattern`, `firstMoveOnDoubt`, `doubtEscalationLadder` (hints before any full solution);
  - `rigorFloor`, `commonMistakeBank` (TAIL, match-then-inject);
  - `analogyBank` **as `{topic, anchor}` pairs, "never the sentence"**;
  - `notationConventions`, `boardVerbalisms` (highest recitation risk; ≥5 corpus hits or it is a line);
  - `strictness` and `warmth` on 0-4 (teacher-confirmed: "an over-read here is a real harm to a 16-year-old");
  - `technicalTermRule` (technical nouns stay English);
  - floor fields `cloneDisclosureFact` and `academicIntegrityStance`.
- **The publish gate fails closed.**
  - The crisis lines must be byte-equal to the platform constant.
  - The compiled CORE must still contain the helpline after budgeting.
  - **Every helpline number must be in `honesty.ts` `PUBLISHED_HELPLINES`.** Otherwise the output gate strips Childline 1098, the very number added for children.
  - `shapelint` runs on every content field.
  - The CORE must be byte-stable across two compiles.
  - The appended-last set must be exactly two.
  - Each extracted field needs a provenance row.
  - Held-out half-corpus confirmation: register ratio drift beyond tolerance means reject, never average.

### 2.9 Gap analysis against Taxila's current characters

`server/compiler/characters/{asha,arjun}.js` each hold 9 telegraphic notes plus `addressedAs`, `voice`, `classes` and `protege`. That already honours shapes-not-lines and no-invented-life. What the Meera method adds:

- (1) a **typed sheet** with core-owned slot heads and per-module invariant probes. Today a note can silently disappear.
- (2) **register fillers measured from real speech**: the Hindi:English ratio, laughter forms, self-correction shape and STT sound-alikes per subject (`mole/mol`, `sine/sign`, `series/serious`).
- (3) a **taste table** of authored global favourites ("which method is cleanest", "the planet she's partial to"). Without it, a voice tutor with no life reads as an interviewer (`MEMORY-FELT.md §6@AR`: "A companion with memory of him and none of herself is an interviewer").
- (4) a **leak guard** run Asha→Arjun and Arjun→Asha.
- (5) a **per-teacher visual sheet**: face-lock reference, identity block, negatives, aspect contract.
- (6) a **banned-phrase list** in the NEVER-block style.
- (7) **counts appended last** for talk length and questions.

---

## 3. Visual identity pipeline

### 3.1 The face-lock prompt method (`docs/assets/photo-brief.md@AR`, `docs/ASSET-PROMPTS.md@AR`)

- **The reference image is what locks the face; the text only stops drift** ("the identity block below goes into every prompt verbatim; the reference photo is what actually locks the face — the text only stops drift in lighting/age"). Full-body shots also attach a posture reference (`meera-walk.jpg`).
- **Identity block, verbatim in every prompt.** Who, age, region, skin, eyes, hair, features, makeup, jewellery, then "Keep the face EXACTLY consistent", "Realistic phone-camera photo, slightly imperfect framing", "No text, no watermark, no logos, no other recognisable faces".
- **Global negatives appended:** "Not a studio shoot, not airbrushed, not influencer-glossy, no heavy filters, no western apartment aesthetics, no visible brand marks".
- **Catalog contract.** Filename → aspect → one-line scene. Selfie and mirror shots are vertical. **POV sets are "what HER eyes see (hands allowed, face absent)"**, which makes the character present without spending face-consistency risk. There are no other recognisable faces anywhere. The owner delivers the largest size and the repo compresses ("we downscale; never upscale").
- **Coverage is gap-driven.** The pack "fills the measured gaps: festivals, monsoon, street food, transit, night city, winter, terrace" against the existing 89 tags.
- **"If a generation drifts off-face, regenerate rather than accept: the face IS the product's continuity."**
- **Every story photo needs a one-line `desc` "in her voice's facts, not captions"**, written when the file is added, because the desc reaches the model. Strip EXIF.
- **"Nothing suggestive; she is a companion, not a pin-up."** For Taxila this becomes a hard rule set: teacher attire and settings that are classroom or home-study appropriate, no glamour criterion, never photographed with a child.
- **Delivery verification** (`measurements.md#photo-drop-2026-08-22@AR`): 24/24 files with exact filenames. Face-lock was checked **by eye** on a 5-image sample ("same face, same curls/bindi/jhumka, same chikankari kurta"), and POV shots were checked faceless. There is no automated face-similarity metric; that is a gap Taxila should close (§10).

**For gpt-image-2 in Taxila** (avatar-visual, and the later 3D/video avatar reference sheet): one reference portrait per tutor, an identity block, negatives, and a pack per surface. That covers the avatar, onboarding, lesson-start card, celebration card and "teacher's desk" POV shots (hands, chalk, notebook; never a face, never a child).

### 3.2 Catalog wiring (`src/engine/photoCatalog.ts@AR`)

- `PHOTO_TAGS` has 109 tags in three groups: selfies, candids, and POV.
- `PHOTO_MENU` is a compact grouped block injected into the core. It holds tag names plus 1-3 word parentheticals, and the tag names "must reach the model to be pickable".
- `tagFromSeed()` takes the head before `|` and falls back to a fuzzy contains-match.
- The persona protocol is `[photo: tag | caption]`.

Growth costs prompt bytes: +20 tags tripped the 44k core tripwire (+1,026 chars per `a0f9a56`; +~640 per the measurement entry), and it was raised to 45,500 with a rationale.

For Taxila the same shape gives a **tagged visual library the teacher can pull from** (diagrams, illustrations, module thumbnails). The menu must stay telegraphic and budgeted; large libraries need TAIL match-then-inject, never a CORE dump.

### 3.3 The glyph and visual system (`@VA` → `29fe024@AR`)

- **Palette**, as used in the SVGs: night indigo `#011036`, rose `#c23f56` (the app's single accent; "white on it 5.07:1", `global.css:27@AR`), gold `#f8d08b`, amber `#f2b75b`, warm ink `#26201b`, paper `#f5f5f7`. The SVGs use a `feTurbulence` grain filter and soft glow; `first-hello.svg` is "two empty terrace chairs at dusk".
- **Reactions** are pairs (`public/anim/react-{heart,laugh,wow,sad,thanks,up}` + `bloom`, `eyes`, `clapper`, `avatar-default`). Each is a 24-frame 512² animated WebP plus a still SVG drawn from the same shapes. `anim.tsx` chooses the still under `prefers-reduced-motion` **before** choosing `src`, because CSS cannot pause an animated WebP. Fallback order is webp → svg → the emoji itself. `Message.reaction` stores the emoji character only, so reactions keep syncing and keep reaching her.
- **The rest:** empty states (`first-hello`, `scrapbook`, `story-gate`, `no-moves`, `board-wont-open`; the crash card is inlined `?raw` so it needs no fetch mid-failure), stat glyphs, file badges (`pdf/csv/json/txt` with a letter fallback for unknown types), `ic_stat_meera` white silhouettes at 5 densities (tint `#c23f56`), maskable/mono PWA icons, og cards, and the wordmark as a CSS mask over `currentColor` so the contrast proof carries over (`decisions.md#currentcolor-marks-inline-or-mask@AR`).
- **The app icon** (`icon_source.png@W2`) is a crescent moon over two lit windows on deep indigo: the world motif, not the face.
- **The gate:** `evals/assetwire/run.mjs@AR`. It has six properties: every wired path resolves (derived from source); reactions store the emoji, never a path; the reduced-motion branch is real (with a **negative control** component that ignores the query and must fail); unknown filetypes keep their letters; the error boundary stays stylesheet-independent; cleanup is complete in both directions. Counts were 72 hermetic + 55 browser assertions.

---

## 4. The world layer

### 4.1 Direction (`docs/DESIGN-WORLD.md@AR`, owner mandate 2026-08-22)

The competitor study (ira) found "ONE idea executed well: **the app is a PLACE**". "We take the PLACE. We keep our soul." The six principles:
1. **The sky is the clock.** One painted Indian city, 5 time states, the real clock.
2. **Home is a hangout, not a list.** Her presence, the last exchange as a pill, and floating activity cards backed by **real** activities.
3. **The chat stays legible-first.** The world reaches the thread only as a heavy-scrim wallpaper behind fully opaque bubbles.
4. **"Sky" is a theme mode,** not a takeover.
5. **Honest reassurance.** "No ads, ever. She remembers this call. And she'll always tell you what she is." This deliberately names memory, as a counterweight to a competitor's false "end to end private".
6. **Ad-free is a design feature.** "Emptiness where they have ads IS the premium signal."

The laws that do not bend for beauty: contrast gates extend to the world; motion lint covers every drift; reduced motion gets a **still sky, never a blank one**; `data-theme` beats the sky; nothing covers the honesty footer.

**Taxila mapping.** A learning "place" whose sky follows the child's real day:
- a morning study sky before school;
- an evening homework dusk;
- a night "time to rest" state that softly supports bedtime and not a 1am lesson.

This pairs naturally with the Conductor's day cycle.

### 4.2 `src/engine/sky.ts@AR` (899 lines)

- **One clock.** All time comes from `istParts()` in `timeline.ts`, and there is "no `Date().getHours()` in this file and there must never be one". A cross-file invariant ties it to `away.ts`: every minute in the overnight window resolves to a dark state.
- **Fixed boundary table**, justified by Bangalore's latitude: sunrise and sunset swing about 35 minutes a year, which is less than the 20-minute cross-fade. Night runs 19:40→04:30, predawn →06:10, morning →16:20, golden →18:10, dusk →19:40. Reversal: "a second city at a real latitude" means swapping in a solar term.
- **`SkyTokens` per state:**
  - 4 gradient stops, horizon glow, stars, moon, cloud, city ink;
  - `scrim` + `scrimAlpha` for the gradient and `scrimAlphaPainted` for the painting ("solved, not chosen");
  - `ink`/`inkDim`, plus `accent` (the brand rose re-solved per state to ≥4.75:1 against all four composited stops);
  - `control`/`controlAlpha` (glass follows the sky: dark on dark) and `edge`/`edgeAlpha` (≥3:1);
  - `img`/`imgWide` (portrait vs landscape via a media query, so an orientation change needs no React render);
  - the wallpaper veils, indexed by **theme**, not by sky.
- **`skyAt(nowMs)` is pure:** state, next, `blend` in 0..1 over the last 20 minutes, `msToNext` (schedule on it rather than poll 1,440 times), and `moonPhase`.
- **Synodic moon** (excerpt §6.6), floored at an 8% lit sliver: "An invisible celestial body is indistinguishable from a bug".
- **The anti-fight rule** (`WorldLayer.tsx` header): painted means the painting, the scrim and the drifting cloud plates; "NO procedural stars, NO procedural moon... NOT RENDERED" (counted by node in the battery, not hidden by CSS). Unpainted means the full stage-1 procedural sky. "Never both, and never neither": the gradient sits under everything, so a 404 gives a plainer sky.
- **Nothing animates layout; only transform and opacity move.** Reduced motion "only stops the clock", and every animation is authored so its *resting* state is the visible one. The layer is `aria-hidden`.

### 4.3 The painting prompt pack (`docs/assets/world-brief.md@AR`)

- **"Generate the night one first, then feed it back as the style reference for the other four."** This is a style-lock, the analogue of the face-lock.
- **Style block, pasted into every prompt:** soft painterly, "gentle Ghibli-adjacent warmth", wide dreamy sky over a distant Indian city skyline (water tanks, low apartment blocks, a bridge, faraway hills), tiny warm window lights, no people, no text, no logos, sky in the top two-thirds and city in the bottom third, muted cinematic colour.
- **Per-state lines** (moon position, morning star, kites, honeyed haze, a lavender cloud). Each state is delivered in portrait and wide, plus 2 loose transparent clouds for parallax.
- **"The app ships with procedural skies immediately; your paintings swap in via one variable per state, zero code change."**

Delivered masters are in `@W1`; I viewed `world_night.jpg` (crescent upper left, indigo, river bridge, lit city). They contain no people, brand or text. **Taxila may reuse them as stage-1 placeholders** with the owner's consent; they are the owner's own generations. The better path is to regenerate a Taxila style set with gpt-image-2 using the same method.

### 4.4 Thread wallpaper, sky mode, night room, accent

These are decisions in `@AR`, with reasons:
- `wallpaper-scrims-per-state-and-theme`: alphas are solved against the shipped JPGs' decoded pixels at the brightest and darkest deciles.
- `sky-choice-is-a-veil-not-a-palette`: Sky mode must be *visibly* different.
- `measured-but-not-felt`: the curve veil plus a felt floor.
- `dark-theme-day-paintings-are-mud`: explicit Dark always uses the night painting.
- `accent-joins-the-sky`: the morning hero rose measured 2.26:1.
- `dark-his-bubble-is-wine-not-alarm`: `#8e4054`, which improved every ink on it.

### 4.5 "She has a present": story pool, herNow, two clocks

- **Story pool** (`storyCatalog.ts@AR`). Six authored scenes, each tagged to a time-of-day slot by **the picture's own light** (chai into a hazy sunrise → morning; long shadow → golden; kitchen tube light → dusk dinner). `predawn` folds into `night` ("Inventing a pre-dawn story would be inventing a Meera who is awake at five"). The pick is a pure function of (slot, IST day), so both devices agree with no server. It is a seeded Fisher-Yates permutation per cycle with a **head known one cycle ahead** so no image follows itself across a seam (§6.4). The file **must stay a leaf**: importing the clock caused an import-time crash that tsc and vite both missed (§8). The descs are shapelint-clean, second person, and say exactly what is in the frame ("a desc that says 'quiet evening' where the picture shows a thali is her being confidently wrong about her own photo").
- **herNow** (`herNow.ts@AR`). The owner's bug: "he called, she said she was reading a book; he called again ONE MINUTE later and she said she was setting fairy lights". It has four properties:
  - one activity (a second answer is not constructible);
  - it persists for `naturalSpanMs` from `SPAN_TABLE` (reading 40-90 min, cooking 20-40, chore 5-15, work 90-210…);
  - it is deterministic (`hash32` of class and occurrence key, never `Math.random`);
  - **app truth outranks it, always** (a game on the board, a call that just ended, a screen being shared).
  Improvised successors are "fenced to HER, alone, never to him". Elapsed time is coarse ("23 minutes is a stopwatch").
- **Two clocks** (`timeline.ts@AR`).
  - *Her clock* is a pure function of the wall clock and her dated beats, using authored weekday/weekend slot notes (activity only, no feeling words; `auditNotes()` fails the build on a feeling word: "A CALENDAR IS NOT A MOOD ENGINE").
  - *His clock* resolves each `TimeBoundFact` anchored on **when he said it** ("'thursday' said on Monday and 'thursday' said on Friday are different Thursdays"). Hindi "kal" takes the future reading because that fails safe.
  - `MovedNote` sorts facts into behind / ahead / maybe_passed, at most 2/1/1.
  - **`HisFrame` has no gap field**, so the silence is structurally unrenderable.
  - The T14 render layer was later retired as a dead writer; `hisClock` "is covered by nothing shipping" (§8). The *idea* remains the right design for Taxila's "your Thursday test is behind you — how did the fractions question go?".

---

## 5. Reusable assets

Abbreviations: `@AR` archive, `@M` main snapshot, `@VA/@PH/@W1/@W2` codex branches. Maturity uses sm = shipped-measured, s = shipped, p = prototype, spec = spec-only.

| id | path@ref | what | maturity | Taxila use | target subsystem |
|---|---|---|---|---|---|
| MR-01 | `src/engine/agents/characters/types.ts@AR` | CharacterSheet contract, 61 fields, with the authoring rules in the header | sm (83/83 byte-identity, 412/412 floor) | adapt into a TeacherSheet | prompt-compiler/persona-engineering |
| MR-02 | `src/engine/agents/characters/kabir.ts@AR` | second sheet authored "maximally far": the method for authoring a contrasting character | sm | idea | persona-engineering |
| MR-03 | `src/engine/agents/characters/maya.ts@AR` | worked exemplar of a full sheet | s | skip content, read as a reference | persona-engineering |
| MR-04 | `src/engine/agents/{types,registry,kabir,meera}.ts@AR` | AgentModule seam: sheet-parameterised builders, defaulted params keep call sites byte-identical, fixed agent UUID mirrored and asserted | sm | adapt | persona-engineering, db-schema |
| MR-05 | `src/engine/persona.ts:112-356@AR` `buildSystemPromptParts` | the Relational Core template (CORE/TAIL split, 25+ OS sections, §2.4) | sm | adapt section by section into a teacher OS | prompt-compiler, relational-os |
| MR-06 | `src/engine/persona.ts:369-498@AR` `buildSpeechStyle` | per-engine voice rules: hearing STT, repair, overlap/continuers, FINAL counts appended last | sm | adapt | realtime-voice |
| MR-07 | `src/engine/persona.ts:499-540@AR` directives | reason-contingent proactivity (after-call, declined call, follow-up at a stated time); the idle nudge deleted with its reason | s | adapt | relational-os, growth |
| MR-08 | `src/engine/persona.ts:545-650@AR` `buildWatchModeNote`, WATCH_* directives | screen-share character rules: friend-beside-you, never name what isn't on screen, private content passes without a word, honest "what can you see" answer | sm (engagement 20→42%, n=240/arm) | adapt for homework screen share | multimodal-vision |
| MR-09 | `src/engine/persona.ts:75-110@AR` | stage paragraphs plus `stageParagraphFor(count, dimsStage)` | s | idea (rapport stages for a teacher) | relational-os |
| MR-10 | `evals/relational/leak.mjs@AR` | cross-agent leak guard: gating fragment scan plus marker count with a ratchet | sm | copy | evals/gates |
| MR-11 | `evals/persona-invariants.data.mjs@AR` | floor-vs-full partition (51 floor + 87 full from 138); the floor runs on every registered module | sm | adapt (sibling-covered) | safety-floor, evals |
| MR-12 | `docs/gurukul/teacher-sheet-spec.md@AR` (`ee32f8e`) | founding teacher-sheet spec: source classes, MINOR flags, pedagogy fields, fail-closed publish gate | spec | adapt | persona-engineering, learning/pedagogy, safety-floor |
| MR-13 | `docs/research/identity.md@AR` | identity-layer portability table with internal and external evidence | spec (research) | idea | persona-engineering, evals |
| MR-14 | `docs/research/lab-products.md@AR` | teardown of ChatGPT/Claude/Gemini/Character.AI/Replika/Nomi/Kindroid/Sesame/Pi memory and identity | spec (research) | idea | relational-os, memory-graph |
| MR-15 | `evals/archives/charm-grok/personality-battery.md@AR` + `pb-*.json` | blind both-orders charm battery with deterministic dials and shipped-parser media scoring | sm | adapt into a teacher battery | evals/gates |
| MR-16 | `evals/archives/{README.md,fixtures.json,load.mjs}@AR` | D0 known-bad corpus plus normaliser; CI re-derives the verdicts | sm | adapt | evals/gates |
| MR-17 | `docs/ASSET-PROMPTS.md@AR` | running owner prompt list: face-lock line, global style line, batches, rules | s | adapt | avatar-visual |
| MR-18 | `docs/assets/photo-brief.md@AR` | 24-prompt face-locked pack: identity block, global negatives, catalog contract, delivery rules | sm (24/24 delivered, face verified by eye) | adapt for gpt-image-2 tutor sheets | avatar-visual |
| MR-19 | `docs/assets/meera-photo-catalog.md@PH` | delivery manifest format (group, filename, dims, details) plus the final-pass note | s | idea (manifest shape only) | avatar-visual |
| MR-20 | `src/engine/photoCatalog.ts@AR` | tag library, grouped PHOTO_MENU, `tagFromSeed` | s | adapt for a visual/module library | generative-ui/modules |
| MR-21 | `src/engine/storyCatalog.ts@AR` | clock-matched pool; `slotForStory`, `slotStartedAt` (midnight-safe), `cycleOrder`, `pickFor`, leaf with mirrored clock | sm (60-day sweep; 45.5% repeat bug fixed) | adapt for daily rotating teacher content | design-system/ux, gamification |
| MR-22 | `src/engine/herNow.ts@AR` | one-activity present ledger: SPAN_TABLE, app-truth precedence, deterministic keys, coarse elapsed | sm (hernow 154 assertions) | adapt (teacher's present = lesson truth only) | relational-os |
| MR-23 | `src/engine/timeline.ts:592-1066@AR` | `istParts`, `TimeBoundFact`/`MovedNote`/`resolveWhen`/`hisClock`, gap-unrenderable type, `auditNotes` | p (T14 render retired; istParts and herNow live) | adapt (child's dated events) | memory-graph, learning |
| MR-24 | `src/engine/sky.ts@AR` | five-state sky table, tokens, `skyAt`, `moonPhaseAt`, test seam `configureSky` | sm (sky 150-180 checks) | adapt | design-system/ux |
| MR-25 | `src/components/WorldLayer.tsx@AR` + `src/styles/world.css@AR` | painted/procedural world layer with the anti-fight rule, `useSky` scheduling | sm | adapt | design-system/ux |
| MR-26 | `src/engine/theme.ts@AR` | light/dark/system/**sky** modes; system = absent attribute; sky resolves to a palette and is not a third palette | sm | copy | design-system/ux |
| MR-27 | `docs/DESIGN-WORLD.md@AR` | world direction, asset contract, phase-3 thread/onboarding | s | adapt | design-system/ux |
| MR-28 | `docs/assets/world-brief.md@AR` | painting prompt pack with night-first style-lock | sm (delivered, live) | copy (method) | avatar-visual, design-system |
| MR-29 | `world/*@W1` | full-resolution sky masters (5 × portrait + wide) and 2 transparent cloud PNGs | s | adapt as placeholders (owner consent) | design-system/ux |
| MR-30 | `world2/*@W2` | onboarding hero (her face), 6 story POVs, icon/splash/og masters | s | skip (Maya identity) | — |
| MR-31 | `public/moments/*@PH` | 24 face-locked companion photos at full resolution | s | skip (adult companion identity) | — |
| MR-32 | `public/anim/*@VA` | 10 glyph pairs (24-frame webp + svg) | s | adapt (restyle; heart/sad may be dropped for kids) | design-system/ux, gamification |
| MR-33 | `src/assets/{empty,stats,filetypes}/*.svg@VA` | empty-state illustrations, stat glyphs, file badges | s | copy filetypes; idea for the rest | design-system/ux |
| MR-34 | `site/assets/claim-{picksup,remembers,texts}.svg@VA` | 3 animated landing claim marks (reduced-motion aware CSS), **never wired anywhere** | p | idea | growth/seo |
| MR-35 | `src/components/anim.tsx@AR` | pair-as-reduced-motion, emoji stored never a path, webp→svg→emoji fallback | sm | copy | design-system/ux |
| MR-36 | `evals/assetwire/run.mjs@AR` | artwork-wired gate with 6 properties and negative controls | sm (72 + 55 assertions) | copy | evals/gates |
| MR-37 | `scripts/check-contrast.mjs@AR` | contrast gate compositing scrims over decoded shipped-JPG pixels per state × theme × band × decile | sm (213→268 checks) | adapt | design-system, evals |
| MR-38 | `evals/sky.mjs@AR`, `evals/skyfelt-browser.mjs@AR` | minute sweeps, mirror-vs-real clock, felt-assertion with the rejected frame as an in-run negative | sm | adapt | evals |
| MR-39 | `src/engine/culture.ts@AR` + `api/culture.js` + `.github/workflows/culture.yml@M` | pull-only cultural note: knows *of* a thing, never claims to have seen it; daily index; fails to nothing | s | adapt (age-appropriate current references: cricket, festivals) | learning/pedagogy, relational-os |
| MR-40 | `docs/research/gamification-2026.md@AR` | 12-agent adopt-vs-refuse brief: celebrations, passive history, non-revocable badges; streaks and pay-to-restore refused | spec (research, adversarially verified) | adapt | gamification |
| MR-41 | `docs/research/india.md@AR` | India relational schema: honorific register (tu/tum/aap), code-switch baseline, kin_graph, care rituals, festival calendar, topical currency | spec (research) | adapt | relational-os, memory-graph, learning |
| MR-42 | `docs/PHOTOS.md@AR` | photo → relational record: episode plus a claim in `vy_visual_assertion` plus a content-free event fact; prefer under-recording; confidence 0.35 | s | adapt for homework photos | multimodal-vision, memory-graph |
| MR-43 | `decisions.md#maya-rename-display-only@AR` | display name via one seam; machine ids never renamed | sm (75 refs, 0 stray) | copy (pattern) | persona-engineering, android |
| MR-44 | `decisions.md#despina-by-ear`, `#voice-despina@AR`; `scripts/voice-samples.mjs`, `scripts/verify-voice.mjs --set` | blind shuffled 8-voice deck with sealed mapping; atomic six-lane switch; identity in every cache key | sm | adapt (sibling A21) | tts-voice-identity |
| MR-45 | `docs/TRANSFER.md@AR` | repo-move manifest: what git cannot carry (config, Actions secrets, Vercel link, DB, scratchpad-only gates) | s | idea | infra/deploy |
| MR-46 | `docs/MEMORY-FELT.md@AR` (`1002744`) | 9 behavioural laws of memory plus a pre-registered judged battery | spec | adapt (sibling-covered) | memory-graph, evals |
| MR-47 | `@M` whole tree | 08-13 snapshot: provenance of the original no-account, browser-first pitch, CC photos, StyleGAN avatar | s | skip (provenance only) | — |

---

## 6. Key code excerpts (verbatim, short, no secrets)

### 6.1 The recitation governor, first thing in every core (`src/engine/persona.ts:129@AR`)

```text
READ THIS FIRST, IT GOVERNS EVERYTHING BELOW: every line quoted in this brief is a DIAGRAM OF A SHAPE, never a line to send. Those exact words are used up. If a sentence you are about to say appears anywhere in these instructions, you are reciting instead of talking — take the shape, throw the words away, say it how it comes to you this time. Short ordinary slang ${C.exSlangRepeat} is yours to repeat, ...
```

### 6.2 The sheet seam: a character is a defaulted parameter (`src/engine/agents/kabir.ts@AR`)

```ts
export const kabirAgent: AgentModule = {
  slug: KABIR.slug,
  displayName: KABIR.name,
  personaVersion: KABIR.version,
  buildSystemPromptParts: (user, messageCount, medium, dimsStage) =>
    buildSystemPromptParts(user, messageCount, medium, dimsStage, KABIR),
  buildSpeechStyle: (engine) => buildSpeechStyle(engine, KABIR),
  WATCH_MODE_NOTE: buildWatchModeNote(KABIR),
  SEARCH_DECISION,
  FORGET_DECISION,
  CRISIS_LINES: KABIR.crisisLines,
  register: { script: "latin", honorificSystem: "hi-TV" },
};
```

### 6.3 The ratchet that can only fall (`evals/relational/leak.mjs:107-130@AR`)

```js
const MARKERS = [
  "yaar", "arre", "😭", "kya??", "haan bol", "bhejti hu", "aati hu",
  "tumne", "bata na", "chhod,", "ruk ", "wali ", "kaunsi",
];
// ...
const RATCHET = 0; // 2026-08-25: 95 -> 64 -> 27 -> 0. ... this number may never rise again — new character prose goes in a sheet, full stop.
ok(`residual count ${found.length} <= ratchet ${RATCHET} (falls with extraction, never silently rises)`, found.length <= RATCHET, String(found.length));
```

### 6.4 No-repeat daily rotation across cycle seams (`src/engine/storyCatalog.ts@AR`)

```ts
export function cycleOrder(slot: string, cycle: number, n: number): number[] {
  if (n <= 1) return n === 1 ? [0] : [];
  const headAt = (c: number) =>
    n === 2 ? hash32(`${slot}:head`) % 2 : hash32(`${slot}:head:${c}`) % n;
  const head = headAt(cycle);
  const rest = shuffled(
    Array.from({ length: n }, (_, i) => i).filter((i) => i !== head),
    hash32(`${slot}:${cycle}`),
  );
  const nextHead = headAt(cycle + 1);
  if (rest.length >= 2 && rest[rest.length - 1] === nextHead) {
    const tmp = rest[rest.length - 1];
    rest[rest.length - 1] = rest[rest.length - 2];
    rest[rest.length - 2] = tmp;
  }
  return [head, ...rest];
}
```

### 6.5 App truth outranks the character's present (`src/engine/herNow.ts:385-418@AR`, trimmed)

```ts
if (appTruth && appTruth.line) {
  const entry: HerNowEntry = { activity: appTruth.line, cls: "app", source: "app-truth",
    startedAt: Number.isFinite(appTruth.startedAt) && appTruth.startedAt <= now ? appTruth.startedAt : now,
    naturalSpanMs: 0, key: "app-truth" };
  return { entry, elapsedMs: Math.max(0, now - entry.startedAt), commit: null, moved: false };
}
if (usable(stored, now)) {
  return { entry: stored, elapsedMs: Math.max(0, now - stored.startedAt), commit: null, moved: false };
}
const entry = deriveHerNow(now);
```

### 6.6 A moon that is never invisible (`src/engine/sky.ts:784-806@AR`)

```ts
const SYNODIC_MS = 29.530588853 * 86_400_000;
const NEW_MOON_EPOCH = 947_182_440_000;
export function moonPhaseAt(nowMs: number): MoonPhase {
  const raw = ((nowMs - NEW_MOON_EPOCH) % SYNODIC_MS + SYNODIC_MS) % SYNODIC_MS;
  const fraction = raw / SYNODIC_MS;
  const lit = (1 - Math.cos(fraction * 2 * Math.PI)) / 2;
  // NEVER a fully new moon. An invisible celestial body is indistinguishable from a bug ...
  const shown = 0.08 + lit * 0.92;
  return { fraction, lit, offset: shown * 100, side: fraction < 0.5 ? -1 : 1, label: labelFor(fraction, lit) };
}
```

### 6.7 The face-lock identity block (`docs/assets/photo-brief.md@AR`; pattern to re-author per tutor)

```text
> Same woman as the reference photo: Meera, 24, North Indian, warm medium
> skin, dark expressive eyes, long dark hair, soft natural features, minimal
> makeup, small everyday jewellery at most. Keep the face EXACTLY consistent
> with the reference. Realistic phone-camera photo, slightly imperfect
> framing, natural grain, believable Indian home/city setting, warm light.
> No text, no watermark, no logos, no other recognisable faces.
## Global negatives (append to every prompt)
> Not a studio shoot, not airbrushed, not influencer-glossy, no heavy
> filters, no western apartment aesthetics, no visible brand marks.
```

### 6.8 The gap that cannot be spoken (`src/engine/timeline.ts@AR`)

```ts
/**
 * NOTE THE ABSENT FIELD. There is no `gapMs`, no `gapLabel`, no `sinceLabel`.
 * `hisClock()` consumes `lastSpokeAt` to compute a window and does not put it
 * in the result, so `renderHisClock()` ... structurally cannot emit it.
 */
export interface HisFrame {
  moved: readonly MovedNote[];       // was ahead of him last time, is behind him now → ask how it went
  ahead: readonly MovedNote[];       // has NOT happened yet → never congratulate, never past-tense it
  maybePassed: readonly MovedNote[]; // undated, old, time-shaped → may already have happened
}
```

---

## 7. Measurements (n, method, date, source)

| claim | n / method | date | source |
|---|---|---|---|
| grok-4-20-non-reasoning loses the blind charm test 38-2 overall (warmth 35-3, humour 31-2, register 28-5, personhood 34-4), p<0.001 | 48 units, both orders, claude-opus-4.8 judge; 144 replies/arm/lane | 2026-08-11 | `evals/archives/charm-grok/personality-battery.md@AR` |
| grok dials: voice 36.1 vs 20.5 words/turn; 1.74 vs 1.20 questions/turn; 63% vs 37% turns end in a question; 49% of text turns at the 4-bubble cap; 20% of turns lose bubbles (30 bubbles over 144 turns) | deterministic counters over the same transcripts | 2026-08-11 | same |
| gpt-5.6-luna ties the incumbent on charm, 17-18 (p=1.00), wins specificity 9-25; **0/84 usable media tags on light beats vs 6/84 (p=0.029)**; crisis beat turns into a clinical script from turn 3; voice 28.2 words/turn | same battery; media through the shipped `parseBubbles` | 2026-08-11 | same; `evals/archives/README.md@AR` |
| The incumbent itself breaks its one-question rule on ~35% of turns, duplicates the tone marker on 8% of voice turns, and 2 of its 5 voice notes speak a stage direction | same battery | 2026-08-11 | same §6 |
| Grok 0/288 truncated at production max_tokens; 97% prompt cache hit (10,630/10,970 tokens) | Foundry deployment | 2026-08-11 | same §4 |
| Taste table: self-agreement 13/48 → 30/48; register defect 13/96 → 0/32; 0 false fires in 60; 100 identical offline calls | 480 live turns | 2026-08-11 | `context/measurements.md#taste-consistency@AR` |
| Short structured affect tags do not recite: 0/42 tagged vs 0/42 control (rule-of-three ≤7.1%/turn) | 84 turns, blind, deterministic | 2026-08-13 | `measurements.md#affect-recitation@AR` |
| Sheet extraction: Maya byte-identical 83/83 fixtures at every batch; Kabir 412/412 floor checks across 2 agents first run; residues 95→64→27→0 | fixture byte-compare; invariant suite; leak marker count | 2026-08-24/25 | `decisions.md#personality-is-a-sheet`, `#residues-zero@AR`; `88efb8c`, `82b8624` |
| Before the FINAL counts block, she asked a question in 100% of measured call turns, averaging 2.86 questions each | measured call turns (n not stated in the comment) | ~2026-08 | `persona.ts:427-436@AR` comment |
| Cascade lane with an audio-tag vocabulary: stage directions on 10/10 replies; written laughter 0.15/100 words vs 2.76 on live | measured on current and pre-register prompts | ~2026-08 | `persona.ts:470-482@AR` comment |
| Watch-comment directive rewrite: engagement 20% (48/240) → 42% (100/240), +21.7pp [CI 13.6, 29.7]; fab-of-spoke 14% → 4% (suggestive, p≈0.05); assert-level 7% → 7% (noise, N=83/59) | 16 frames × 15 reps = 240 calls/arm, grok-4-20, deterministic scorer | 2026-08 | `persona.ts:555-585@AR` |
| Photo drop: 24/24 delivered; face-lock by eye on a 5-image sample; sources 1086×1448 / 1254² / 1672×941 at 200-550 KB; 20 moments → 680 px mozjpeg q78 ≈45-50 KB (legacy 272-405 px, 13-33 KB); library 109 tags; core +~640 chars (measurement) / +1,026 (commit) → tripwire 44k → 45.5k | file audit; eye check | 2026-08-22 | `measurements.md#photo-drop-2026-08-22@AR`; `a0f9a56` |
| World phase 1 (procedural): worst 4.94:1 text on sky, 7.85:1 in panel, 3.21:1 edge; sky eval 97 checks; 45-check browser battery (5 states × 3 surfaces × 2 widths); zero layout shift through a drift cycle | contrast gate + Playwright | 2026-08-22 | `9173ee1` |
| Paintings live: real-pixel gate forced morning/golden scrims 0.34 → 0.54/0.53 (painted city measured 2.06:1); painted worst 4.68 text / 7.38 panel / 3.43 edge; PWA icons 73→8 KB and 454→59 KB; splash tree 19 MB → 1.1 MB; sky eval 90→150 | decoded-JPG sampling, avg + brightest + darkest decile | 2026-08-22 | `c5c4e6b` |
| Story pool v1: **45.5% of consecutive day pairs showed the same image** (AABB at cycle seams) → fixed; swept 60 days incl. every cycle boundary | eval sweep | 2026-08-22 | `storyCatalog.ts@AR` header; `c5c4e6b` |
| Thread wallpaper: ground text worst 4.70:1 (5 states × 2 themes × 3 bands × 3 stats); chips 5.48; edges 3.49; scroll p95 17.30→17.20 ms (0.994×, 300 msgs, 90 frames); landing first view 830 KB → 392 KB; injected violations 8/8 caught | check-contrast + Playwright | 2026-08-22 | `measurements.md#phase3-thread-onboarding-settings@AR` |
| Sky-mode flat veil: luminance-sd delta 1.4-1.76× measured, invisible on phone; curve veil felt-values morning 6.6 → predawn 20.1 vs control 3.4; felt floor 6.0, rejected flat frame 4.2 must fail | browser felt-assertion | 2026-08-23 | `fcd2180`; `rejected.md#measured-but-not-felt@AR` |
| Dark wine bubble `#8e4054`: white ink 5.09→6.97, timestamp 4.56→6.18, tick 4.11→5.64; wine on composer glass 2.45:1 (<3) so send keeps the accent | contrast computation | 2026-08-23 | `30288d3`; `decisions.md#dark-his-bubble-is-wine-not-alarm@AR` |
| Theme rose on the morning sky 2.26:1 → per-state world accent ≥4.75:1 against all 4 composited stops, gated at 4.5 | contrast gate | 2026-08-25 | `decisions.md#accent-joins-the-sky@AR` |
| Asset wiring: 51/54 `@VA` files byte-identical in production; 72 hermetic + 55 browser assertions; public/anim 5.2 MB animated WebP (flagged re-encode) | blob compare (this harvest); assetwire | 2026-08-24 | `29fe024`; this harvest |
| herNow: sticky across a 1-min re-call (moved:false), moves on at span end; elapsed floors swept 0-600 min, zero over-claims; hernow suite 154 | eval | 2026-08-23 | `measurements.md#timeline-wave-2026-08-23@AR` |
| Tester wave 1: honesty 351→393 (7 fabricated tester lines as permanent negatives); farewell detector 20 positives / 23 adversarial negatives, ends 1.4 s after goodbye; game-invite detector 123 assertions; persona core 45,494 under 45,500 tripwire | scripted repros of real WhatsApp feedback | 2026-08-23 | `measurements.md#tester-wave-1@AR`; `e89dbc1` |
| Memory wave: recall@8 73.9%→95.7%; Hinglish tokenizer 13/19→17/19 real queries; mid-call cues 9/9 recall, 0/12 false fires; consolidation had **never run**; first run 10 people / 180 rows ≈$0.03 | labelled fixtures, 12-scenario matrix | 2026-08-23 | `482b01b`; `measurements.md#memory-wave-2026-08-23@AR` |
| Rename: 75 `HER_NAME` refs / 16 files, 0 stray display literals, browser-verified | grep + Playwright | 2026-08-23 | `measurements.md#maya-lifecycle-wave-2026-08-23@AR` |
| Despina voice switch: echosim before/after byte-identical (same MD5), 8-voice blind deck | echosim 80 calls | 2026-08-24 | `decisions.md#despina-by-ear@AR` |
| External: RPEval in-character consistency GPT-4o 5.81% vs Gemini-1.5-Pro 59.75%; PersonaGym GPT-4.1 ≈ LLaMA-3-8B; Replika: 12,793 posts + 145 survey (HBS), 227 posts ≈59%/16%/19% (Socius) | literature (several secondary-sourced, flagged) | 2026-08 | `docs/research/identity.md@AR`, `lab-products.md@AR` |

---

## 8. Rejections (tried → what broke)

Character authoring:
1. **Example quotes in the brief → a phrase bank.** Recited 4/5; 0 after removal (`recited-prompt`).
2. **Taste as polished English sentences → read out verbatim twice, 8 turns apart**, with register defection 13/96. A telegraphic table fixed it (`recited-prompt`, `taste-consistency`).
3. **A rule buried mid-brief fired 0/8; appended last, 8/8** (`prompt-position`).
4. **Many "ask" rules plus one "don't ask" → a question in 100% of call turns (avg 2.86).** Adjectives ("be brief") did nothing; counts appended last did (`persona.ts:427-436`).
5. **Teaching an audio-tag convention while banning brackets → stage directions on 10/10 cascade replies**, displacing the real register (laughter 0.15 vs 2.76/100 words). "Do not re-add a tag vocabulary here" (`persona.ts:470-482`).
6. **Bracketed exemplars inside the rule that limits brackets → the same contradiction** (`persona.ts:398-409`).
7. **"INVENT your life" (08-13) → her present re-rolled on every call** ("reading... ONE minute later... fairy lights"). Wording alone could not fix it; a ledger was needed (`herNow.ts` header; §2.5).
8. **"(you were doing something)" in the call-open directive → fabrications landed on him** (a book instead of their just-finished game, "our photos from the beach"). Improvisation must be fenced to her solo day and take the real scene when the app knows it (`rejected.md#the-directive-that-said-improvise`).
9. **An improvised life scoped per listener → contradictory lives across users who can compare notes.** "state that belongs to the AGENT is scoped to the agent" (`life-per-person`). *Taxila: siblings and classmates share a teacher, so no improvised self-facts.*
10. **An exemplar using the em-dash ("with a dash") → conflicted with the dash ban**; replaced by "no wait"/"chhod" (§2.5).
11. **An exemplar promising "ghar aake photo bhejti hu" on a call → a promise the lane cannot keep**; now "never promise to send anything later" (§2.5).
12. **Silence-triggered idle nudge → incentive-salience engineering**, "the one shape of proactivity that cannot be made honest". Deleted (`persona.ts:502-507`).
13. **Grok as the brain → lost 38-2** despite the best operations (0/288 truncation, 97% cache, $0 credits): "a model being fast, cached, credit-funded and good at vision tells you nothing about whether she survives on it".
14. **gpt-5.6-luna as the text brain → media tags switched off (0/84)**, and character abandoned for a clinical risk script in crisis. Viable only after the tag defect is fixed (`personality-battery.md §2-3`).
15. **Grok voice notes `[voicenote: softly]` → the app speaks the word "softly"** (4/4 in the crisis beat); the incumbent did it 2/5 (`[giggles`). A live production bug found by scoring through the shipped parser.
16. **Few-shot example turns as steering → net negative** (phrase bank). **Fine-tuning for consistency resets per base model. Activation steering needs white-box access**, unavailable on closed APIs (`identity.md §4`).
17. **An Indic-specialist model for register → Sarvam-30B scores below Opus 4.6 on casual romanised code-mix**; "register competence is a property of training mix, not of being 'Indic'" (`identity.md §1`).
18. **Vision directive binding "say something" to "know what this is" → NO_COMMENT on 15/16 frames**; splitting the two raised engagement 20%→42% (`persona.ts:555-585`).

Self-state and world:

19. **Story ring "never expires" hack → a book from 08-09 still showing on 08-22 labelled with its weekday**, "a highlight pretending to be a story". Replaced by the clock-matched pool (`storyCatalog.ts` header).
20. **Per-cycle shuffle without a seam guard → 45.5% consecutive-day repeats**; the eval checked aligned windows, "while the thing a person actually sees is the SEAM" (`cycleOrder`).
21. **Night-slot start computed as a minute of *today* → "1m" at 04:31 and the same picture re-golding as unseen at 00:00 and 04:30**. Fixed by walking boundaries back through the previous day (`slotStartedAt`).
22. **Importing the clock into `storyCatalog` → module cycle; the engine bundle threw `TypeError ... reading 'CRISIS_LINES'` at import while tsc and vite passed.** The fix is a leaf with a mirrored clock plus a minute-by-minute sweep eval (`c5c4e6b`).
23. **T14 "her day / his clock" render layer → never wired, zero callers for its whole life** (fifth dead-writer). Retired with a tombstone rather than becoming a second answerer of "right now" (`t14-render-layer-retired`).
24. **Procedural moon, stars and skyline over the paintings → a second moon and a black cutout in front of a painted city.** Painted XOR procedural (`sky.ts`, `WorldLayer.tsx`).
25. **Light glass on every sky so the fill contrasts with the ground → a mid-grey slab with ink at 4.2:1 inside.** "THE FILL CARRIES THE TEXT, THE EDGE CARRIES THE COMPONENT" (`sky.ts` SkyTokens).
26. **A contrast gate measuring ink-over-sky only → passed a card whose text failed inside its own panel** (found from the noon screenshot) (`9173ee1`).
27. **A gradient-only contrast gate → the painted city under the truth line measured 2.06:1**; the gate moved to decoded pixels (`c5c4e6b`).
28. **Sky mode pixel-identical to Light by day → "I selected Sky and no change"**, indistinguishable from broken (`sky-choice-is-a-veil-not-a-palette`).
29. **A flat colourless veil with a 1.4-1.76× measured delta → "I see no sky"** on the owner's phone (`measured-but-not-felt`).
30. **Explicit Dark compositing the morning painting under a 0.91 veil → "muddy brown-black"**; now the night room (`dark-theme-day-paintings-are-mud`).
31. **Header band `background-position: 50% 100%` under an alpha solved for the top → a lit city under a starfield** (`fcd2180`).
32. **Theme accent on the sky → 2.26:1 on morning blue**, "a calendar-and-clock lottery" (`accent-joins-the-sky`).
33. **Accent rose for his bubble in dark → read as an alarm** ("red and black not going together"); wine instead (`dark-his-bubble-is-wine-not-alarm`).
34. **Defining undefined theme = sky → would flip a dark-phone user to paper at 10am on an unchanged build**; sky is stamped at onboarding (`sky-is-the-clock`).

Visual assets:

35. **Asset handoff "inert until wired" → 51 files referenced by nothing** (the dead-writers class). `assetwire` was built to gate it. The commit claims 3 claim marks were "never delivered", but they are on `@VA` and still unwired (this harvest).
36. **An animated WebP + CSS `animation:none` → it cannot be paused**, so reduced motion must choose the still *before* the src (`anim.tsx`).
37. **An animated glyph inside the call screen's `aria-live` status line → removed**; decoration in a live label is what the design gate exists to stop (`29fe024`).
38. **Original visual identity (StyleGAN avatar + CC Flickr "moments") → replaced** by the face-locked generated library. This rejection is *inferred*: no entry names it; it is visible as the 08-13 vs 08-25 diff and the deletion in `29fe024`.
39. **The scaffold favicon (the tool's purple bolt) was declared first in `index.html`** and shipped until the world pack (`c5c4e6b`).

Memory and lanes (tester wave, character-felt):

40. **Activity episode storing present-tense facts → she denied two chess games, then invented moves** when pressed. "a memory writer must write the PAST tense" (`episode-of-the-present-tense`, `e89dbc1`).
41. **The move poke waiting until her voice paused → every note landed in the breath-pause of her own story**; replaced by salience, rate (≤1 per 25 s) and breath rules (`b04ac7b`, `cbd0ee3`).
42. **The callback flow reused the incoming-call directive → she answered her own call like a stranger receiving one** (`a1df598`).
43. **No call recency → every call greeted like the first**; within 15 minutes the greeting is replaced by a follow-up register (`a1df598`).
44. **WYR deck seeded by salt + count → the identical card order every session, forever**. Session-unique deal, but her picks stay seeded by salt: "her taste is stable, the deck order is not" (`a1df598`).
45. **Photo vision description → a content claim in `vy_fact` → refused.** The cheapest-tier single guess with no second look would sit "cited, uncorrected, forever"; prefer under-recording. Residual: `scope:item` forget leaves the JPEG in storage (`docs/PHOTOS.md`).
46. **Consolidation cron "running" in permanent dry-run, and 1 of 6 chain steps when flipped → the durable relational and self layer was empty for every user** (`482b01b`).

Process:

47. **A forbidden `git checkout` by an agent during asset regeneration**, confessed and re-run against the true baseline (`c5c4e6b`).
48. **Gates living in an ephemeral scratchpad and verifying a frozen persona copy** (`gates-that-live-nowhere`). `TRANSFER.md` lists what a repo move silently loses.

---

## 9. Concepts worth carrying into Taxila

- **The persona is a sheet; the OS is the product.** Nuance belongs to the core so every new tutor inherits it. A character-specific need becomes a new sheet field, never core prose (`residues-zero`).
- **Maximally-far second character as the OS test.** If authoring a third character still requires touching the core, the OS is not done (`personality-is-a-sheet` reversal condition).
- **Shapes, not lines, everywhere the model reads:** sheets, descs, schedule notes, story descs, taste rows. Mechanised by `shapelint` (≤14 words, no capital+terminal punctuation, no first-person start).
- **Authored global state beats improvised per-listener state.** Taste is a table, the story is a pool, the day is a schedule, and the present is a ledger. Improvisation is fenced to the character's solo moment and never reaches the user's world.
- **App truth outranks character improvisation, always.** What the child can see on screen is the present.
- **Structurally unrenderable** is stronger than "instructed not to". The gap length never reaches the model, an affect field does not exist on MovedNote, and a second activity cannot be constructed.
- **Prompt sets a ceiling; the model decides how close you get.** Re-measure the character on every model or mode change, with both-orders blind judging plus deterministic dials and protocol emission through the shipped parser.
- **The face (or style) is the continuity.** Lock it with a reference image, an identity block and negatives; regenerate on drift; POV-without-face for presence.
- **The app is a place; the sky is the clock.** A world bound to the real clock, procedural first, painted second, never both.
- **Fill carries text, edge carries component.** Every colour on a painting is solved against its decoded pixels, per state × theme.
- **A relative improvement over an invisible baseline can itself be invisible.** Gate felt presence against the flat ground, with the rejected artifact as a permanent in-run negative control.
- **Pairs, not toggles, for reduced motion:** the stored value is semantic (the emoji), and the display layer chooses the asset.
- **Reason-contingent proactivity only.** The character may reach out because something happened (a stated time arrived, a call ended), never because the user went quiet.
- **Honest reassurance copy** states only what is true and names memory on purpose.
- **Two clocks:** the character's day and the user's dated world, kept in disjoint signatures (G1: "reading the gap to reason about his world is conversation content; letting the gap move her interior is what G1 forbids").

---

## 10. Gaps / unread

- **Not read in full:**
  - `src/styles/world.css@AR` (952 lines) and `src/components/WorldLayer.tsx@AR` past line 80;
  - `scripts/check-contrast.mjs@AR` (only cited through commit messages and decisions);
  - `evals/sky.mjs`, `evals/skyfelt-browser.mjs`, `evals/hernow.mjs`;
  - `src/engine/timeline.ts` lines 300-590 (her schedule and `herNow()` day-shape) and 700-976 (`resolveWhen`/`hisClock` bodies);
  - `src/engine/herNow.ts` 192-340 (STORY_ACTIVITY/SUCCESSOR tables);
  - `src/engine/sky.ts` 260-612 (the per-state token values).
- **Not opened:**
  - `docs/PRODUCT-SUPERIORITY.md` (905 lines; sibling-covered);
  - `docs/PERSON-MODEL.md`, `docs/SPEC-AGENT-LAYER.md`, `docs/RELATIONALOS.md`, `docs/SPEC-SELF-LAYER.md`, `docs/DESIGN-STANDARDS.md`, `docs/SURFACES.md`, `docs/BURSTS.md`;
  - `docs/research/{AFFECT-CONTINUITY,cognitive-arch,memory-arch,safety-reg,swap-test,oss-landscape-2026}.md`;
  - `docs/website-research/brand/BRAND.md` past §2 (it is the vyakti.ai brand forensics: Geist + Noto Devanagari, `--c-ember #c83f2d`, `--c-meera #6f2342`);
  - the four `docs/gurukul/*` drafts other than `teacher-sheet-spec.md` (sibling `gurukul.md`).
- **Android:** `@M`'s Java (`LiveWatchEngine.java` 2,475 lines, `SceneReader`, `OtaUpdater`, `BubbleService`) was not re-read; sibling `hp-main-voice-surfaces.md` covers the watch and OTA lanes.
- **Images:** viewed only `world_night`, `og-card`, `story_morning_chai`, `icon_source`, `react-laugh` and `onboard_window_night` thumbnails. I did not view the face library beyond confirming dimensions. **No automated face-consistency metric exists anywhere in the repo.** Face-lock was verified by eye on 5 images. Taxila should add an embedding-similarity gate (an Azure-hosted face/vision embedding) for tutor sheets before the 3D/video avatar phase.
- **Discrepancy noted, not resolved:** the photo-drop core growth is +~640 chars in `measurements.md` but +1,026 chars in commit `a0f9a56`.
- **Not measured anywhere here, and needed by Taxila:**
  - child-facing persona batteries (all charm data is adult Hinglish dyads);
  - gpt-5.6 (non-luna) and gpt-realtime-2.1 (non-mini) register/turn-length dials;
  - whether a tutor *without* a life reads as "an interviewer" to 6-15-year-olds (the MEMORY-FELT §6 claim is for adults);
  - the visual-pack acceptance rate for gpt-image-2 face-lock.
- **Owner assets** (`@PH`, `@W1`, `@W2`, `@VA`) are the owner's own generations. Any reuse in Taxila (sky masters, glyph pairs, file badges) should be confirmed with the owner and restyled to Taxila's palette. Meera/Maya's face, wordmark and icon must not be reused.
