# Taxila Inheritance Map

The one document a Taxila build team uses to take over earlier work. It is synthesised from 19 harvest reports in
`docs/harvest/` (17 segment readers, each checked by an adversarial verifier, plus the earlier `gurukul.md` and
`companion-tech.md`) and their structured twins in `docs/harvest/json/`. Written 2026-10-02.

**How to read it.**
- Every claim about a source is cited as `path@ref`. Ref shorthands are in §0.
- "Verified" means a second agent re-read the code at that ref (`git show`) and graded it. "Q" is that verifier's
  1-5 score for fitness to Taxila, not for quality in the source product.
- A number is quoted with n, method and date, or it is marked as unmeasured.
- When a harvest reader and its verifier disagreed, this map follows the verifier.
- **No secrets were read.** The file `api/_config.js` is gitignored in html-portfolio and imported by many `api/*`
  files. Secret present at `api/_config.js`; it was never opened. No key, token or password appears here.

**The four facts that shape every row below.**
1. **Every learner is a minor.** Every inherited age gate defaults the other way (`unverified -> adult`,
   `src/engine/clock.ts@main` L55-61, still true at `@vy`). That default must be inverted, and the adult path must
   not exist in the learner app.
2. **Azure-only.** Gemini Live, Gemini TTS, OpenRouter, grok on Foundry Marketplace, Sarvam, ElevenLabs,
   Chatterbox/IndicF5 open weights and Anthropic are all barred from Taxila builds (CLAUDE.md, 2026-10-02). The
   Gemini API terms also bar services used by under-18s (`context/rejected.md#ct-no-gemini-api-for-minors`). So
   most voice *code* in the portfolio is reusable only as method and measured law, not as files.
3. **Taxila already exists and has already absorbed some of this.** `server/compiler/compile.js` is the single
   assembler with the appended-last rule and a budget that throws. `server/compiler/floor.js` carries Childline 1098
   and Tele-MANAS 14416. `server/learner/affect.js` reads affect from dialogue only. `db/migrations/001_core.sql`
   already has `consent`, `memory`, `rel_state`, `rel_event`, `asset_cache`, `incident`, `audit` and `format_trial`.
   Current voice decisions: the **cascade lane is the default** (gpt-4o-transcribe → teacher text → gpt-4o-mini-tts,
   `context/decisions.md#voice-lane-cascade-default`), and **gpt-realtime-2.1 (full) is the premium lane**
   (`#voice-realtime-model`, `#voice-turn-config`). Rows below say "extend" where Taxila already has the seam.
4. **Most of the portfolio never met a real user.** Meera shipped and has production numbers. Gurukul's student
   app, Vyakti Rooms, Group AI, Replica Lab and the private-voice slice were gated offline and never ran a real
   journey (`docs/handoff/2026-09-09/NEXT-AGENT.md@h206`; `hp-vyakti-a`/`hp-vyakti-b`/`hp-multimodal-group`
   harvests). Treat "200 gates green" as no evidence of product quality. The handoffs themselves name
   over-coordination and bookkeeping as the failure.

---

## 0. Ref shorthands

| short | repo @ ref | tip date | what it is |
|---|---|---|---|
| `@main` | html-portfolio `origin/main@3a92179` | 2026-08-25 | Meera/Maya companion engine, merged state |
| `@cmp` | html-portfolio `origin/claude/ai-companion-app-rkt1lv@f4d3fe4` | 2026-08-25 | Companion launch wave; superset of `@main` |
| `@vc` | html-portfolio `origin/voice-cloning@a7bdcaa` | 2026-08 | Vyakti Replica Lab (consented self voice clone) |
| `@gp` | html-portfolio `origin/claude/gurukul-platform@771feef9` | 2026-08-28 | Gurukul: `@cmp` + `@vc` merged, teacher clones; all 20 `gurukul-ws-*` branches merged in |
| `@va` | html-portfolio `b5348dc0` (first half of `@gp..vyakti-completion`) | 2026-09-04 | Vyakti Rooms v1, WS-R1..R50 |
| `@vb` | html-portfolio `origin/codex/vyakti-completion@6260611e` | 2026-09-06 | Vyakti Rooms waves 10-19 + Codex takeover |
| `@h206` | html-portfolio `origin/codex/handoff206@20263775` | 2026-09-09 | Codex handoff (also `handoff-processing204@e913ffcb`=`@p204`, `handoff-voice-comparison106@0b47b2b8`=`@v106`, archive-only `handoff-history-20260909@7a8ad90d`) |
| `@pv` | html-portfolio `origin/codex/private-voice-requests25@f0246956` | 2026-09-21 | Vyakti private voice; **deletes Meera's live-call client** |
| `@vy` | html-portfolio `origin/claude/vyakti-cloning-platform-aq05n4@ebe16cc0` | 2026-09-30 | Vyakti tip; superset of everything above except `@mm`'s 19 commits |
| `@mm` | html-portfolio `origin/codex/multimodal-layer-20260927@b514595f` | 2026-10-01 | Multimodal claim evidence + common-friend Group AI hardening; still carries `liveCall.ts` unchanged |
| `meera@AR` | meera `archive/production-20260914@bee9061` | 2026-08-25 | Final Meera production tree; 79 commits ahead of `@main` |
| `meera@M` | meera `origin/main@72041b2` (+ `codex/meera-photos`, `meera-world`, `meera-world2`, `maya-visual-assets`) | 2026-08-13 | Early companion snapshot plus GPT-Image asset masters |
| `ai2b@main` | ai2bharat `origin/main@a11c521` (+ `origin/r21/*`) | 2026-09-14 | AI2Bharat community + Saathi learning guide |
| `vg@T` | vyakti-groupai `origin/claude/vyakti-cloning-platform-aq05n4@451de5a` | 2026-09-04 | Group AI trust kernel ("AI common friend") |
| `cc@main` / `cc@rev` | command_centre `origin/main@c8fd321` / `claude/context-project-review-0x0i6g@d288e75` | 2026-08/09 | CarbonSettle CRM + outbound engine |
| `vw` / `cs` | vyakti-website `@904b370` (and `cloning-platform@4a7cbef`) / cs-website `claude/seo-phase1-lead-pages@27781178` | 2026-08/09 | Marketing sites |
| misc | hihi `claude/voice-notes-app-calendar-f0d541@2033e98` and other branches; naukri_bi_copilot `main@2bbbe89`; vyakti-product `claude/ai-companion-app-rkt1lv@9fddcd2`; routine_carbonsettle_intel | various | Small repos |

Lineage, checked with `git merge-base --is-ancestor` by the readers: `@main ⊂ @cmp ⊂ @gp ⊂ vyakti-completion ⊂
@h206 ⊂ {@vy, @mm}` and `@vc ⊂ @vy`. The `@pv` and `@vy` branches deleted `src/voice/liveCall.ts`,
`src/components/useCallEngine.ts`, `api/chat.js` and `evals/echosim/` on 2026-09-14 (commit `2e6ad0ee`), as a
product decision. **Harvest the realtime call stack from `@main` or `@mm`, never from `@pv`/`@vy`.**

---

## 1. Portfolio overview

**Meera / Maya (html-portfolio `@main`, `@cmp`; meera `@AR`).** The founding product: a Hinglish AI companion (a
24-year-old Indian woman) that texts, takes speech-to-speech voice calls on Gemini Live, watches your screen during a
call, plays chess/tic-tac-toe/would-you-rather, and runs as a web app plus a Capacitor Android APK. Its
"RelationalOS" is the engine everything later inherits. It has a pure CORE/TAIL context compiler with typed tail slots
and budgets; a cited memory graph (`vy_episode`/`vy_fact`/`vy_pattern`, halfvec exact-scan embeddings, RRF-fused
Hinglish recall); consolidation with index-only citations and a cross-family entailment audit; relationship state with
asymmetric hysteresis; an emotional interior governed by a written charter; an output-side honesty gate; age-tier
gates; a session clock; privacy as SQL predicates; a turn trace; and process tooling (context graph, `verify-release`,
CI evals, in-run negative controls). It shipped and has production numbers. Its derived memory layer was empty in
production until 2026-08-21 because the crons lived on a non-default branch. The launch wave `@cmp` (2026-08-25) added
an internals fence, a DPDP memory-consent seam, adaptive game difficulty and an explicit prompt cache. It was renamed
Maya for display. Its 77 harvested rejections are the most valuable thing in the portfolio. Cites:
`hp-main-engine.md`, `hp-main-voice-surfaces.md`, `hp-companion-voiceclone.md` (delta A), `meera-repo.md`,
`companion-tech.md`.

**Kabir (`src/engine/agents/characters/kabir.ts@main`).** A second character authored "maximally far" from Maya to
prove that personality is a sheet on a shared core. It passed 412/412 per-module floor checks across two agents on its
first run, and a leak ratchet took residual Maya-isms in Kabir's lanes 95→64→27→0 with Maya byte-identical 83/83
(`context/decisions.md#personality-is-a-sheet@main`, `#residues-zero@cmp`). It never had a user (no `vy_agent` row).
It is the template for authoring Taxila's tutor cast.

**Vyakti Replica Lab (`@vc`).** A consented, provider-portable self-voice-clone platform at `/studio`, built
2026-08-24..25 as control-plane code with mocked provider boundaries. It has consent receipts with 10 scopes and a
one-statement revoke cascade; an immutable evidence DAG (ClamAV, ffprobe, diarize/separate/enhance, Azure fast
transcription); an evidence-backed Person Model where extraction proposes cited claims and the owner disposes;
Bradley-Terry active pairwise calibration; Wilson/noninferiority qualification gates; provenance (spoken disclosure,
watermark, signed segment chain, C2PA); an atomic Azure spend ledger; erasure state machines; and a scale-to-zero T4
GPU behind an HMAC broker. On 2026-10-02 the harvester ran 31 offline suites: 30 pass, and `agent/raw-isolation`
fails 1/47 at the tip because the merge from `@main` reintroduced two unscoped `meera_nodes` reads (passes 47/47 at
`92bd64e`). Cite: `hp-companion-voiceclone.md` (delta B).

**Gurukul (`@gp` and `gurukul-ws-v..as`).** Founded 2026-08-25 as "teacher clones on RelationalOS": a JEE Advanced
teacher uploads lectures, the platform builds a clone (knowledge, personality, voice), and students chat, call and
practise with "Duolingo-grade gamification". It built the most reusable pedagogy code in the portfolio: a deterministic
practice engine ("a model never grades"), a mastery fold with no decay by absence, syllabus-as-data, `practiceTalk`,
the `TeacherSheet` with 24 pedagogy fields, the mentor arc (`docs/gurukul/teacher-arc.md`) and a minors safety-floor
spec. It also built an 8-step Azure Container Apps audio pipeline that ran on a real 1:49:31 lecture, and listening
instruments (earbench) that never had a listener. The student app was never deployed. Within a day the owner
re-pointed it at a horizontal clone platform (Vyakti). The last two days went to one unsolved problem: the cloned
Hindi voice "sounded foreign". Cites: `gurukul.md`, `hp-gurukul-chain.md`.

**Vyakti Rooms (`@va`, `@vb`).** The second product line: a creator turns their archive into "<Name> AI", which holds a
private, remembering relationship with each follower at `/r/<slug>`. JEE teachers were the first vertical. It was built
by 10 parallel agents per wave over 19 waves (WS-R1..R140) under a growing release gate (14→20→21 checks). It added a
follower lane with HMAC session binding, an app-voiced disclosure card bound by digest, never-say rules as an output
predicate, a review queue, a prompt-injection boundary (creator material compiled as untrusted data: containment
0/41→41/41), a lexical recall scorer, a relational disclosure kernel, quiet hours as one SQL fragment, a readable DPDP
export, Indian payments (Razorpay UPI Autopay, GST Rule 46 receipts), growth plumbing, full Hindi chrome and many
batteries (door, leak, adversarial, accessibility, Fast-3G performance). Migrations up to 136 were applied live, but
no real Room row, follower, payment or push ever ran, and model keys were unset. Cites: `hp-vyakti-a.md`,
`hp-vyakti-b.md`.

**Codex handoffs (`@h206`, `@p204`, `@v106`, history ref).** Four Codex branches (2026-09-07..09) that continued
Vyakti on Azure only. They added an expert text Room on Azure Foundry (gpt-4.1-mini, Mistral-Large-3, gpt-5.6-terra),
an experience compiler, a learner communication contract (language/script/depth), the 8-stage Azure audio DAG with GPU
allocation windows, a Hindi TTS text frontend, Azure short and fast ASR adapters, safe KaTeX math rendering, an
Azure-only egress policy and a spend ledger. They also ran a Chatterbox vs VoxCPM2 bake-off (12/12 clips verified, 0
human ratings, no winner) and a live memory trial (the corrected-Hindi reply came back entirely English). The handoff
itself says NOT production-ready. Its negative results are high value (persona post-processing destroyed educational
content; persona defaults beat saved learner preferences; appended prompt policies did not change outputs). Cite:
`hp-handoffs.md`.

**Vyakti private voice and tip (`@pv`, `@vy`).** `@pv` (2026-09-21) deleted Meera's call stack and added voice-adjacent
product layers: a blind paired 4-axis listening test, an EmotionOS register reader with a prosody plan, per-sentence
voice clips with a buffer-one-ahead client (5.00x sooner first audio against a fake synthesiser), a reply-language
policy, and an internal owner-voice service on a supervised scale-to-zero T4. No synthesis or likeness was ever
measured. `@vy` (2026-09-30) rebuilt the creator workbench UI, added personal auth, HumanOS person sheets, a five-dial
vibe, an account-private Hindi voice slice deployed enabled 2026-09-29 (zero real generations), and recorded the real
Azure `gpt-5.6-terra` canary (191/49 tokens, 3218 ms, n=1). For Taxila its value is the minor safety floor, the
pedagogy core inherited from Gurukul, the affect primitives, the spend ledger and Azure-only serving. Cites:
`hp-private-voice.md`, `hp-vyakti-cloning-tip.md`.

**Group AI: common friend (`@mm` and `vg@T`).** Two codebases for one idea: an AI that is a member of a small group of
linked adults ("the friend who was in the room") and may bridge private information into the group only through
explicit, scoped, revocable grants. Success is measured by human-human outcomes, and silence is first-class. `vg@T` is
the trust kernel: 12 TypeScript packages and 19 migrations (append-only social event ledger, immutable audience
epochs, versioned disclosure policy, a Context Capsule with whole-block budgets, a deterministic intervention policy, a
model-request ledger where a timeout becomes "ambiguous" and is reconciled, not retried). The harvester recompiled it
with Taxila's own toolchain and ran a 50,000-case differential against an independent oracle: 0 mismatches, plus a real
negative control (799 divergences), because the repo's own controls were tautological. `@mm` is the Telegram
implementation inside html-portfolio: an SQL disclosure predicate over immutable per-turn episodes, deterministic
participation, a portable checkpoint kernel and truthful delivery outcomes. Neither ran a real group (live `vy_group`
had 0 rows). Both are adult-only by construction. Cites: `vyakti-groupai.md`, `hp-multimodal-group.md`.

**AI2Bharat and Saathi (`ai2b@main`, `origin/r21/*`).** A production Next.js + Neon + Azure Foundry bilingual EN/HI
community that teaches adults AI human-feedback work. It is the closest pedagogy analogue to Taxila that actually ran
on Azure: 21 pathways, 164 lessons, 46 quests; a lesson loop of recall → worked example → practice → transfer → work
sample → rubric self-checks; near-miss distractor authoring (retired stems 70%→0); criteria read only from taught
lines; spaced review at 2/7/21/60 days; and Saathi, a guide with a byte-stable CORE/TAIL compiler, two appended-last
MUST slots, a server-side stage gate (the answer is never shown to the model), 13 fatal output gates, a scoped
question-trim gate (question share 67.8%→23-26% at n≈320), a six-kind memory that stores no affect and hard-deletes,
and a DB spend cap that fails closed. It made three deliberate refusals that collide with Taxila: no stored affect
(D-057), no realtime voice (D-061, reversal = byte-identical CORE on the realtime lane), and not-a-person (no avatar or
cloned voice). Only 15 members, so learning efficacy is unmeasured. It also found that a squash merge (`6986880`)
carried 1 of 40 files while the measurements log recorded the fix. Cites: `ai2bharat-core.md`, `ai2bharat-rounds.md`.

**CarbonSettle command centre (`cc@main`, `cc@rev`).** A Next.js + Supabase CRM and cold-outbound engine (about 150
routes, IMAP inbox, WhatsApp, signed offer pages, cookieless analytics, a Capacitor shell). It has no RAG or knowledge
graph. The owner's "company brain" is a process artefact (AGENT-CONTEXT, SESSION-LOG, a session-log protocol, local
auto-memory, CLAUDE/AGENTS mirrors). Its highest-value finding for Taxila is measurement honesty: mail-security
sandboxes inflated engagement about 3x, and `lib/engagement-classifier.ts` encodes a measured HUMAN rule. It also has a
measured agent-fleet method (hard-law briefs, central gating, seeded 10% adversarial audits escalating to a census at
>20% defects, concurrency ≤15). The engineering is mature; the business found 0 revenue from 916 cold emails. The
security fixes live only on the unmerged `cc@rev` branch. Cite: `command-centre.md`.

**Marketing sites (`vw`, `cs`).** vyakti-website is a relational-intelligence lab site with an editorial token system,
a scroll-driven WebGL face with a semantic jaw/viseme rig, a research section where every number must carry
n/method/date/source, and struck-through retracted claims. cs-website (carbonsettle.com) holds a hard-won
content-automation safety stack, built after a daily LLM article generator destroyed about 65% of search impressions by
re-dating slugs, plus a first-party analytics tracker. Cite: `web-sites.md`.

**Small repos (misc).** hihi "Echo" is an Expo voice-notes prototype (single-stream capture, finalise-on-both-signals,
flat structured-output schema). hihi `prime-sum` holds verification rejections (an `except ImportError` that masked a
failing gate; determinism mistaken for correctness). naukri_bi_copilot's best idea is "model writes the template, code
computes the numbers, a validator traces every narrative number" (its validator only warns, so build the fail-closed
version). routine_carbonsettle_intel shows a daily agent that wrote each run to an unmerged branch, so 29/29 runs had
no memory of earlier runs. vyakti-product is a shallow Meera copy whose commit bodies give about 20 rejections and a
Vercel→Azure move manifest. shivaji_sarthi, vyakti-products and sales-enabler are irrelevant or empty. Cite:
`misc-repos.md`.

**What exists nowhere in the portfolio** (gaps, not unread code): a covert comprehension detector (partial precursors
exist, but none is covert: ai2bharat Saathi's overt-check, learner-initiated struggle recorder and Taxila's own keyed
`server/director/classify.js`; see Addendum G2); a learning-modality
profile (visual/story/rhyme/game/long-form); on-the-fly generated learning modules (the nearest is the ActivityState
seam and Forge-style guards); any avatar or talking-head code tied to live audio (vyakti-website has a scroll-driven
face only); gpt-image-2 usage beyond Meera's face-locked asset prompts; a parent dashboard; any child-voice or
child-speech measurement; any human listening verdict on any generated voice.

## 2. Subsystem by subsystem

Decision vocabulary: **copy** (lift with mechanical edits), **adapt** (structure reusable; content, keys or provider
change), **idea** (pattern only; write fresh), **build-new** (nothing usable exists), **skip**. Status column:
maturity in the source (`shipped-measured` / `shipped` / `prototype` / `spec-only`), then the verifier's Q (1-5) and
any refutation. Taxila destinations are named where a seam already exists.

### 2.1 realtime-voice

**Best source.** The client floor arbiter in `src/voice/liveCall.ts@main` (3,408 lines; identical at `@mm`) with its
simulator `evals/echosim/*@main`, for **method and measured law only**. The file is a Gemini Live WebSocket client and
every measured constant is against Gemini's server VAD, so it is barred as code. Azure protocol facts are in
`context/measurements.md#azure-realtime-shape@main` and `context/rejected.md#realtime-azure@main`. Taxila already
owns the Azure lane: `src/lesson/realtime.ts`, `src/lesson/voiceLink.ts`, `evals/realtime-bakeoff.mjs`,
`evals/realtime-audio-in.mjs`, `evals/webrtc/`.

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| Floor arbiter (hold ring, LISTEN/BARGE/SOFT bars, onset confirm, backchannel retire) | `src/voice/liveCall.ts@main` | shipped-measured, Q4 | idea → adapt only if Taxila gates the mic client-side | Imports only `./level` and `../engine/diag`. WebRTC on Azure gives browser AEC and server/semantic VAD, so the uplink-hold ring may not apply. Re-measure before porting anything. |
| Echo coupling model (kappa, r2-gated affine fit) | `src/voice/liveCall.ts@main` L558-638 | shipped-measured, Q4 | adapt | `ECHO_KAPPA_SEED 0.3`, `MAX 0.76`, `MARGIN 1.3`, all adult/speakerphone tuned. Most valuable for children on phone speakers. |
| Stuck-turn watchdog | `liveCall.ts@main`, `evals/echosim/stucksim.mjs@main` | shipped-measured, Q4 | adapt (conditional) | `STUCK_OPEN_MS 20 s`, `FORCE_SILENCE_MS 700`. Needed only if the client holds the mic. Indian homes and classrooms are noisy. |
| Yield fade, release watchdog, straggler discard | `liveCall.ts@main` | shipped-measured, Q4 | adapt | Keyed to Gemini `interrupted`/`turnComplete`. Rewrite against Azure `input_audio_buffer.speech_started`, `response.cancel` and `conversation.item.truncate`. |
| Out-of-band note channel `direct()` (silent vs cue) | `liveCall.ts@main` | shipped, Q3 | adapt | Azure analogue: `conversation.item.create` plus optional `response.create`. Taxila's director already refreshes `instructions` with `session.update`. |
| goAway rotation (generation guards, model pinned, wait for quiet) | `liveCall.ts@main`, `evals/echosim/rotatesim.mjs@main` | shipped-measured, Q2 | idea | Gemini server behaviour. Azure session limits were never measured anywhere. 30-60 min lessons need a design before this matters. |
| echosim audio-floor simulator | `evals/echosim/{build,world,run,signal,exp1,stucksim,rotatesim}.mjs@main` | shipped-measured, Q4 | adapt | Transpiles the real client into a virtual-clock browser with room acoustics (80 calls = 5 couplings x 8 seeds x 2 arms). Port the fake socket to the Azure protocol and add child-voice stimuli. |
| Continuity law + lane parity | `docs/SPEC-CONTINUITY.md@main`, `evals/continuity/parity.mjs@main` | shipped-measured, Q3 | adapt | One compiler for every lane. Taxila has the law in `compile.js`; it needs a parity gate across realtime, cascade and text. |
| Presence envelope | `src/voice/level.ts@main` | shipped, Q4 | **copy** | 51 lines, Web Audio only, attack 0.35 / release 0.08. Taxila has `src/lesson/level.ts`; compare and keep one. |
| Farewell detector | `src/voice/farewell.ts@main`, `src/engine/hangup.ts@main` | shipped-measured, Q3 | adapt | Pure. Rewrite the vocabulary for child goodbyes. |
| Self-loop fence | `src/engine/repeat.ts@cmp` | shipped, Q3 | adapt | Jaccard 0.8, no imports. Re-measure thresholds for pedagogic repetition. |
| RIFF-walking WAV probe | `api/_audio/wav.js@gp` | shipped-measured, Q4 | **copy** | Parametrise 24 kHz. Its "handles 0xFFFFFFFF sizes" claim is false (rejects streaming headers). |
| Azure fast transcription (en-IN, hi-IN) | `api/_replica-processing/providers/azure-fast-transcription.js@vc`/`@h206` | prototype→shipped-measured, Q3 | adapt | For offline review of session audio. Central India only (South India has no Speech). |
| Truthful delivery outcomes | `api/_surface.js@mm` L650-717 | prototype, Q3 | idea | "Teacher said X" should be logged only after a client playback acknowledgement, which does not exist yet. |

**Porting notes.**
- The realtime speech-to-speech lane has no post-generation output gate (`docs/RELATIONALOS.md@vy` hazard 2). A turn
  is heard before it can be judged. Taxila needs a post-hoc transcript audit, plus the `@cmp` "arm the next turn
  unstreamed" idea for the text lanes (`src/components/useCallEngine.ts@cmp`, Q3 idea).
- Constants were tuned on adult voices. `ONSET_DUTY` sits one step from a cliff (0.60 holds; 0.70 drops a quiet talker
  20/24→15/24, n=24 seeds/cell, `context/measurements.md#bargein-onset-confirm@main`). Re-sweep on child voices.
- Byte thresholds in the uplink policy assume Gemini's 16 kHz framing. Azure requires ≥24 kHz input, so rescale by 1.5.
- Meera declined a recap after rotation (`docs/VOICE-LANE.md@main` §6.5). For a 30-60 minute lesson, a silent running
  note is the better idea (`src/voice/callHistory.ts@main`: salience, not summary; Q2 idea).

**Build new.** An Azure-protocol echosim; child and classroom stimuli; Azure session-limit and rotation measurements;
real-device latency from India (Taxila's 2026-10-02 numbers are from a US container); a transcript audit gate; client
playback-ack events.

### 2.2 tts-voice-identity

The cascade lane is Taxila's **default** (`#voice-lane-cascade-default`), so the text-to-speech seam carries most
spoken minutes. That makes these assets more important than they were for Meera.

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| Text-to-speech sanitiser (one seam where writing becomes speech) | `src/voice/spokenText.ts@main` (285 lines), mirrored in `api/speech.js@main`, eval `evals/voice/spoken.mjs@main` | shipped-measured, Q4 | adapt | Must add a maths/science class. As written it turns `5 - 3` into `5, 3`, strips `f(x)`, drops `[a,b]`, replaces `->` with a pause and deletes `<...>` (so `3 < 5 > 2` is lost) (verifier, `vt-04@vy`). Add Devanagari cases. |
| Sentence splitter (danda, decimals, abbreviations, initials, list markers) | `planReplySentences` in `api/_room-speak-plan.js@pv`/`@vy` | shipped, Q4 | **copy** | Verifier ran it: danda, double danda, `Dr.`, `3.14`, `Fig. 2`, `m/s` all split correctly. Add science abbreviations. Rewrite its tests (they import Vyakti files). |
| Buffer-one-ahead clip sequencer | `src/room/voiceSequence.ts@pv`/`@vy` (97 lines) | shipped-measured, Q4 | **copy** | For non-streaming TTS only. 5.00x figure is against a fake 400 ms synthesiser. Independent per-sentence clips risk prosody breaks; prefer streaming gpt-4o-mini-tts where available. |
| Script-mode detector `voiceScriptMode` | `api/_voice/language-conditioning.js@pv` | shipped, Q3 | **copy** (12 lines) | Drop the Chatterbox CFG rule. |
| Hindi text frontend (Roman Hindi → reviewed Devanagari, borrowings) | `api/_voice/hindi-text-frontend.js@pv`/`@h206` | shipped-measured, Q3 | adapt (cautiously) | ~136 Roman-Hindi and ~121 borrowings, of which ~25 are classroom terms. Built for Chatterbox; it guarantees normalisation, not pronunciation. Test against the chosen Azure voice; it may hurt. Rebuild the lexicon from NCERT glossaries. |
| Blind voice-sample deck and ear protocol | `scripts/voice-samples.mjs@main`, `docs/VOICE-SAMPLES.md@main` | shipped, Q3 | adapt (method) | Meera chose Despina from an 8-voice blind deck by ear. Run it with children and parents. |
| f0/duration drift alarm | `scripts/prosody-baseline.mjs@main` | shipped, Q3 | adapt (method) | Detects silent vendor voice changes. Do not copy the Gemini baseline data. |
| One-voice gate with a single writer | `scripts/verify-voice.mjs@main` | shipped-measured, Q2 | idea | 1,109 lines of Meera lanes. Write a small Taxila version: one voice constant, every lane declares its model, identity in every cache key. |
| Prosody plan as closed bands | `api/_voice/prosody.js@pv`/`@vy` | shipped, Q2 | idea | Outputs Chatterbox parameters; every shipped caller passes `register: null`, so it was never live (`rejected.md#ws-r168-register-not-threaded-into-roomspeak@pv`). Keep "bands, not prose"; map to gpt-4o-mini-tts instructions or SSML. |
| Speak only already-approved text | `roomSpeak` in `api/_room-surface.js@va`, `api/_room-voice.js@pv` | prototype, Q3 | idea | TTS takes a hash-bound reply reference, never free text, so it cannot become a second way for the teacher to speak. ~60 lines against Taxila's Director. |
| Two-phase fuse, anti-splice gate | `api/speech.js@main` | shipped-measured, Q2 | idea | Gemini/OpenRouter code (barred). The fuse lesson stands: a fixed 1.4 s fuse caused a total outage on a slow night. |

**Build new.** A stock Azure voice bake-off with Indian children and parents as blind listeners, accent identity as
its own first-class axis (`rejected.md#azure-tts@main`); an NCERT class 1-9 pronunciation corpus with `criticalUnits`
(seeded from `evals/voice-stock-comparison/prompts.v1.json@v106` and `docs/handoff/2026-09-09/listening/manifest.json@h206`
text only, never the owner-voice WAVs); a math-aware spoken normaliser; voice identity in every persisted audio key.

### 2.3 voice-cloning

**Decision: skip for v1.** Children must never be voice-cloned. Self-hosted cloning models (Chatterbox, IndicF5,
VoxCPM2, Qwen3-TTS, ZONOS2, MOSS, OpenVoice) are barred by Azure-only. Azure Personal Voice is Limited Access, and its
adapter hardcodes `xml:lang="en-US"` and an English per-clip disclosure (`api/_voice/providers/azure-personal-voice.js@pv`,
pv-04). No clone in the portfolio ever passed a human ear; the subject called Gurukul's "an American or British speaker
talking in Hindi".

Keep from this line: the consent receipt and revocation patterns (§2.18), the GPU cold-start rules (§2.20), the
listening instruments (§2.16) and these laws: inputs that grow are not learning (Chatterbox conditions on the first
10 s/6 s only); a 16 kHz separation pass erased the 8-12 kHz identity band (energy ≥8 kHz 0.000458% → 0.0224% after the
fix, ~49x, n=1, `measurements.md#enrollment-reference-bandwidth-before-after@gp`); one acoustic utterance per
code-mixed sentence. If a consented adult narrator voice is ever wanted, start from `tts-04@vy` (idea).

### 2.4 avatar-visual

Taxila has already decided the v1 stack (three.js + TalkingHead, RMS jaw, `context/decisions.md#avatar-v1-stack`,
`#avatar-lipsync-rms-jaw`). Nothing in the portfolio drives a face from live audio.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Canvas budget, context-loss fallback, dots-only first paint | `src/components/home/relational-story-canvas.tsx@vw` | shipped, Q3 | idea | `frameloop="demand"`, DPR [1,1.25], antialias off, `webglcontextlost` handler. No frame-time measurement exists. |
| Semantic jaw/viseme rig | same, `scripts/build-noor-rig.py@vw` | prototype, Q2 | idea | Fixed keyframe table; Taxila's visemes must follow real audio timing. |
| Hash-pinned 3D asset pipeline | `scripts/build-head-model.mjs@vw` | shipped, Q4 | adapt | Pinned URL, SHA-256, weld, simplify, POSITION-only (324 KB → 75 KB). Licence trap: the head is CC BY 3.0 and needs a credit. |
| Face-locked image prompt method | `docs/assets/photo-brief.md@meera@AR`, `docs/assets/world-brief.md@meera@AR` | shipped-measured, Q3 | idea | Reference attached, identity block, global negatives, regenerate on drift, night-first style lock. The content (bed selfies, saree draping) is unsuitable; "Ghibli-adjacent" must not be pasted. gpt-image-2 acceptance rate unmeasured. |
| Presence UI | `src/components/CallVoice.tsx@main` | shipped, Q2 | idea | Skip `IncomingCall.tsx` (companion retention). |

**Constraints the portfolio hands an avatar** (`companion-tech.md` §13): drive lip-sync from the same playback clock
or barge-in fades desync; never render on the audio thread (CPU contention on mid-range Android); re-run any audio
simulator after an avatar change because extra audio output enters the echo estimate.

**Rejections to respect** (`vw` PROJECT_CONTEXT): TripoSR single-image 3D read as uncanny; procedural hair read as a
wig; a topology morph between identities; speech driven by scroll progress froze the mouth mid-viseme; GSAP scrub on
touch trailed the finger; a solid face poster flashed before particles were ready.

### 2.5 relational-os

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Relationship state (asymmetric hysteresis, trust ±0.05/day, record vs lapsing stance) | `src/engine/relstate.ts@main` (1,192 lines) | shipped-measured, Q3 | adapt | Keep `clampTrustDelta`, `bandTrust`, the replay fold and coarse bands. Honorific shifts and romance-tinged rupture are companion constructs. Redesign dimensions for tutor-child (trust, confidence, frustration tolerance, pace). Taxila has `rel_state`/`rel_event`. Give every table one named first-row writer. |
| Mentor arc | `docs/gurukul/teacher-arc.md@gp` | spec-only | adapt | The single best content asset: competence before warmth, method-not-ability praise, ability-label ban, MENTOR BOUNDARY replacing the romance clause, rituals christened not installed, exam windows never countdowns, a 14-row minor-stricter table. Written for 16-18; tighten for 6-15. |
| Platform-owned mentor boundary and stage constants | `src/engine/compiler.ts@vb` | prototype, Q3 | adapt | Sentence-shaped adult prose; keep the shape and the romance refusal; rewrite for children. |
| Reason-contingent directives (open, after-call, follow-up) | `src/engine/persona.ts@main` L494-675 | shipped, Q3 | adapt | Re-author as shapes. The principle: initiate only because something happened, never because the child went quiet. |
| Promise ledgers from the transcript | `openCommitments`/`herCommitments` in `src/engine/honesty.ts@main` | shipped, Q3 | adapt | Cap 3, TTL 7 days. Needs a lesson vocabulary (teacher's promised follow-ups, child's promised homework). |
| Session-gap facts | `src/engine/away.ts@main` | shipped, Q4 | adapt | Drags `istParts` from `timeline.ts`. |
| Told ledger (anti-join: render only the untold) | `src/engine/life.ts@main`, `db/migrations/011_self_layer.sql@main` | shipped, Q3 | adapt | Reuse for explanations and stories already told to this child. Not for an invented life. |
| greetOnce / asksToHangUp | `src/engine/greeting.ts@main`, `src/engine/hangup.ts@main` | shipped-measured, Q3 | **copy** | Low value, low risk. |
| India cultural state | `src/engine/india.ts@main` | shipped, Q3 | adapt | Festivals and currency fine; rituals are companion check-ins; review kin terms for children. |
| Honorific as state; first name server-side | `lib/saathi/register.ts@ai2b@main`, `lib/saathi/learner-name.ts@ai2b@main` | shipped, Q2-3 | idea | `aap→tum at 40 turns` is an adult-teacher stance; for 6-15 the arc is the inverse. Owner decision. |
| Check-in scheduler (IANA zone, quiet hours shift) | `computeNextDue` in `api/_checkins.js@va` L379-479 | prototype, Q4 | **copy** | Verifier ran it (19:00 Asia/Kolkata → 13:30Z). Parent-facing reminders only. |

**Rejections that bind here:** `rupture-never-closes` (a grudge capped the stage forever), `relstate-zero-rows`
(UPDATE-only writers, 0 rows for 40 users), the silence-triggered idle nudge, `life-per-person` (contradictory lives
per listener), companion register (`persona.ts@meera@AR` L302 lets warmth "deepen" if invited).

**Build new.** A tutor-child bond model with a permanent record and a lapsing stance (a scolding must never "stick");
months-long continuity across 30-60 min lessons; a mentor arc for ages 6-9 and 10-15; parent-visible relationship
summaries that use bands, never numbers.

### 2.6 emotional-lens / affect

Taxila constraints already logged: no emotion inference from speech or face (Microsoft AI Code of Conduct,
`context/rejected.md#ct-no-voice-emotion-inference`); voice features are stored as per-child-normalised features,
never labels (`#voice-features-longitudinal`); affect comes from dialogue (`server/learner/affect.js`).

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Moment-shape and deixis gates | `src/engine/moment.ts@main` (233 lines, zero imports) | shipped, Q4 | adapt | Its eight shapes are companion (conflict, teasing). Add confused, frustrated, guessing, bored, proud; add Devanagari and child spellings; keep `\p{M}`. |
| Closed observable-expression feature set (24 h TTL, `may_claim_inner_emotion=false`) | `api/_experience-compiler/expression-observation.js@h206` | prototype, Q3 | adapt | Only 5 of 20 features have a producer anywhere (turn duration, token count, wpm, script ratio, RMS dBFS). Latency, pause and hesitation must be computed from realtime events. Matches Taxila's features-not-labels decision. |
| Register reader (rushed/upset/excited/flat) | `src/engine/register.ts@pv`/`@vy` | shipped-measured, Q2-3 | adapt (narrow) | 60/60 on 60 hand-authored turns checked against the author's own rules (in-sample). It reads typed-chat punctuation; ASR transcripts carry none, so most cues vanish. Detects delivery, not comprehension. |
| Charter G1-G8 | `src/engine/inner.ts@main` | shipped, Q3 | idea | Adult-companion policy. Re-derive for a tutor. G1 transfers directly: a feature is content if computable from one utterance with no outside timestamp; usage may never write the agent's feelings. |
| Distress shapes with negative controls | `lib/saathi/distress.ts@ai2b@main` | shipped-measured, Q2 | adapt | No self-harm, abuse or bullying patterns, and no Childline 1098. Rewrite for children. |
| Pull-only taste table | `src/engine/inner.ts@main` | shipped-measured, Q3 | idea | Taste content is Meera's opinions; keep pull-only rendering (self-consistency 27%→63%). |

**Build new.** Child frustration and confusion shapes in Hindi, Hinglish and English with negative controls (extend
`server/learner/affect.js`); a written tutor charter derived from G1-G8; an owner decision on what affect is ever
stored (ai2bharat stores none, D-057; Meera stores a 9 h half-life feeling fused with its cause).

### 2.7 memory-graph / consolidation

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Cited memory schema (`vy_episode` log spans, `vy_fact` citation CHECK, bi-temporal belief change, `vy_pattern` generated column, `vy_embedding halfvec(1536)` exact scan, `vy_derivation`) | `db/schema.sql@main`, `db/migrations/001-004@main` | shipped-measured, Q4 | adapt | Keyed on `device_id`; re-base on `child_id` and carry `agent_id` (tutor) from day one. Choose tables, not the whole schema. Live DB refused an uncited fact insert (23514). |
| Reciprocal rank fusion `rrfFuse` | `api/memory.js@main` L329 | shipped-measured, Q5 | **copy** | ~20 pure lines, `RRF_K=60`, deterministic tie-break. |
| Hinglish recall tokenizer `recallTokens` | `api/memory.js@main` L289 | shipped-measured, Q4 | adapt | Add school vocabulary and Devanagari subject terms. |
| Laundering predicate `nonLaunderedNodes` | `api/memory.js@main` L1626 | shipped, Q4 | **copy** | Teacher speech must never become a fact about the child. Lexical heuristic; needs a channel field. |
| Embeddings helper | `api/_embed.js@main` | shipped-measured, Q4 | adapt | `text-embedding-3-small`, exact scan. Strip the OpenRouter fallback and the `_config.js` import. |
| Nightly consolidation (six-step chain, index-only citations, 5% entailment audit halting at >2% refuted, anchored importance) | `api/consolidate.js@main`, `docs/CONSOLIDATION.md@main` | shipped-measured, Q3 | adapt | The audit judge is `google/gemini-3.6-flash` (barred). An Azure-only substitute loses cross-family independence; record that loss. Companion dimensions to drop. |
| Sweep rails (live switch, kill switch, token and time budgets, lease) | `api/consolidate-sweep.js@main` | shipped-measured, Q4 | adapt | Vercel cron → Azure Container Apps Job. |
| Observation → pattern → arc evidence bars | `src/engine/observation.ts@main`, `db/migrations/011_self_layer.sql@main`, `vy_pattern` generated `prompt_eligible` at `@vy` | shipped, Q3-4 | adapt | One citation recalls; ≥2 citations and ≥3 support over ≥2 days generalises; ≥3 citations over ≥42 days claims growth. Exactly the bar for "learns best with stories". |
| Learner communication contract (language, script, depth) | `api/_learner-communication-contract.js@h206`, `src/engine/learnerCommunication.ts@vy` | prototype, Q4 | adapt | Zero imports. Closed set is english/hindi/hinglish only. Add modality dimensions and a parent-set vs child-stated distinction. |
| Azure Foundry strict structured output + exact-quote citation verifier | `api/_claim-extraction/{contracts,providers/azure-foundry,registry}.js@vc` | prototype, Q4 | adapt | `2024-05-01-preview`, temperature 0, json_schema, entailment ≥0.55. Confirm the API version serves gpt-5.6 on Taxila's deployment. |
| Closed memory kinds, never-store list, hard delete, deterministic extraction | `lib/saathi/memory/{kinds,never-store,extract,forget-intent,reset}.ts@ai2b@main` | shipped, Q3 | adapt | Six kinds (weak-topic, misconception, explanation-style, goal, context-given, term-asked) with a DB CHECK. Hard delete plus a forget term. |
| Derivation cannot declassify | `deriveDisclosurePolicy` in `packages/relational-core/src/privacy.ts@vg@T` | prototype, Q4 | adapt | Lesson summaries and parent notes never widen the source policy. |
| MEMORY-FELT laws | `docs/MEMORY-FELT.md@main` | spec-only, Q4 | adapt | Retold not recited; right memory at the right time; memory is care, never ammunition. Drop law 6 (her own past). |
| Facts vs hypotheses | `docs/research/2026-09-29-honcho-fit.md@vy` | spec-only | idea | Hypotheses about how a child learns suggest probes and never become facts. Do not adopt Honcho itself (AGPL core, hosted terms). |

**Build new.** A per-child learner graph where misconceptions and format preferences are hypotheses with evidence
bars; per-lesson consolidation as an ACA Job with lease and kill switch; parent review of claims; a measurement that
Azure embeddings bridge Roman-script and Devanagari queries (lexical recall does not; `rejected.md#lexical-retrieval-does-not-bridge-roman-and-devanagari-20260907@h206`).

### 2.8 prompt-compiler / persona-engineering

Taxila already has the single assembler (`server/compiler/compile.js`, 282 lines) with section caps, a throwing
budget and appended-last rules. Inherit to harden it.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| CORE/TAIL compiler with typed tail slots, byte map, FNV `hashCore` | `src/engine/compiler.ts@main` | shipped-measured, Q4 | adapt (architecture only) | 1,300 lines importing 14 modules plus persona and Capacitor. Byte-identity 83/83 against a frozen oracle. |
| Shape-lint | `lib/saathi/shapelint.ts@ai2b@main` (71 lines, zero imports) | shipped, Q4 | **copy** | Prefer this over `src/engine/shapelint.ts@main` (imports compiler and persona; Latin-only `/^[A-Z]/` sentence regex lets Devanagari through). Calibrate the 14-word cap on Hinglish rows; add danda handling. |
| Prompt digest across lanes (length-prefixed SHA-256 of core and tail) | `lib/saathi/lane-identity.ts@ai2b@main` | shipped-measured, Q4 | **copy** | Proves the prompt on the wire equals the compiled prompt (0 forks over n=320 runs). This is the reversal condition ai2bharat set for realtime (D-061). |
| Whole-block drops, never slices | `applyDropOrder` in `compiler.ts@main` L1208 | shipped, Q3 | **copy** | 25 lines. Note: the live `compile()` never called it. |
| Prompt budget gate through the real compiler, worst date pinned | `scripts/check-prompt-budget.mjs@main` | shipped-measured, Q3-4 | adapt | It found a hidden exceeded cap (30,190 > 30,000) on a calendar peak. Taxila's `tests/kit-budget.test.mjs` is the place. |
| Untrusted material as a delimited data block | `renderCreatorMaterial` + markers in `src/engine/compiler.ts@vb` (~40 lines) | prototype, Q4 | adapt | Containment 0/41 → 41/41; secret leaks 2/5 → 0/9. Use for NCERT text, teacher notes and anything a parent or child types. Safety boundaries stay platform constants. |
| TutorSheet pedagogy fields | `src/engine/agents/teacherTypes.ts@vy`, `src/engine/agents/characters/demoTeacher.ts@gp` | shipped, Q3 | adapt (checklist) | `explanationOrder`, `workedExamplePattern`, `firstMoveOnDoubt`, 6-rung `doubtEscalationLadder`, `rigorFloor`, `analogyBank` as {topic, anchor}, 15-row `commonMistakeBank`, strictness/warmth 0-4. Gurukul never compiled these into the prompt; Taxila must. |
| CharacterSheet / AgentModule + registry | `src/engine/agents/{types,registry}.ts@main`, `characters/*.ts@meera@AR` | shipped-measured, Q3-4 | adapt (pattern) | Do not port 61 fields; 33 `ex*` fields exist only because the core quotes Maya. Taxila's `characters/{asha,arjun}.js` (~12 fields, no invented life) are the better base. |
| Cross-agent leak guard with ratchet | `evals/relational/leak.mjs@meera@AR` | shipped-measured, Q4 | adapt | No sheet value of 12+ chars may appear in another tutor's lanes; planted-fragment negative control. |
| Persona invariant runner/data split | `evals/persona-invariants{,.data}.mjs@main` | shipped-measured, Q4 | adapt | 412/412 across 2 agents. Probes are literal Maya excerpts; rewrite for Taxila's floor (`server/compiler/floor.js` is the better source). |
| Context Capsule (typed blocks, whole-block budget, manifest hash) | `packages/context-capsule/src/compiler.ts@vg@T` | prototype, Q4 | idea | **Gap:** no mandatory block, so a crisis-line block can be dropped under pressure. Keep the safety floor outside it. |
| FINAL counts appended last | `src/engine/persona.ts@meera@AR` L397 | shipped-measured, Q3 | adapt (mechanism) | Fixed "a question in 100% of call turns, 2.86 average". The counts themselves ("most turns ONE sentence") would break explanation turns. |
| Learner communication precedence | `api/_dialogue/contracts.js@h206` | shipped, Q3 | idea | Explicit current request > saved preference > question language > persona default. The live trial failed when the persona default stayed in the prompt. |

**Build new.** A TutorSheet per age band (6-9, 10-15); a third tutor authored maximally far from Asha and Arjun as the
OS test; a parity gate asserting byte-identical CORE across realtime, cascade and text lanes; a Devanagari-aware
shape-lint calibration set.

### 2.9 safety-floor / honesty

Taxila already has `server/compiler/floor.js` (Childline 1098, Tele-MANAS 14416, never deny being an AI, no romance,
no personal data, academic integrity, no ability labels, no guilt), `server/director/safety.js` and leak tests.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Frozen minor hard gates, restrict-only ratchet, fail-safe unknown tier | `src/engine/clock.ts@vy` (`MINOR_HARD_GATES`, `gatesFor`, `saferTier`), `src/gurukul/surface.ts@gp` | shipped, Q3-4 | adapt | **Invert the default**: `unverified` maps to ADULT gates (romance true, engagementMechanics true). Remove the hardcoded `vyakti-replica-lab.vercel.app` origin and the Capacitor import. |
| App-voiced session clock (disclosure, break), MAX(local, server) | `src/engine/clock.ts@main` L249, `api/clock.js@main` | shipped, Q3 | adapt | Minor thresholds 2 h / 1 h are built for companion cadence; retune for 30-60 min lessons. |
| Output honesty predicates | `src/engine/honesty.ts@main` (2,206 lines, no imports) | shipped-measured, Q3 | adapt (narrow) | Keep `findActionable` (identifier provenance allowlist), the `PUBLISHED_HELPLINES` absorber and false attribution. Most families target chat-companion receipts. Receipt leak 1/8 → 0, 29/29 clean replies byte-identical (n=31). |
| Internals fence (severe-class predicate, one re-draft, send anyway) | `src/engine/internalsFence.ts@cmp` (476 lines, zero imports) | shipped-measured, Q4 | adapt (shape) | Lexicons target vendor/architecture leakage, not child safety. Rebuild for contact or meeting solicitation, human claims and PII asks. Replay: 2/2 severe caught, 0/205 false positives. |
| One door + never-say rules | `api/_never-rules.js@vb` (97 lines, pure), single `gatedReply` call site asserted by `evals/surface.mjs@vy` | shipped-measured, Q4 | **copy** with fixes | `normaliseForMatch` strips `\p{M}`, so Hindi rules never match; matching is substring, so `ass` matches "class". Fix both (verifier ran them). |
| Instruction-shaped material detector | `api/_material-detector.js@vb` | shipped-measured, Q3 | adapt | 41/41 recall, 0/15 false positives on its own corpus (overfit risk). Zero Devanagari. Route to review; it is not a guarantee. |
| Stage gate (answer never in TAIL) + fatal output gates + scoped question trim | `lib/saathi/{stage-gate,output-gate}.ts@ai2b@main` | shipped-measured, Q3-4 | adapt | Text lanes only; a realtime audio turn cannot be discarded before the child hears it. |
| Direct-identifier redaction before provider calls | `redactTranscript`, `containsDirectIdentifier` in `api/_claim-extraction/contracts.js@vc` | prototype, Q4 | adapt | Lift the two functions. `scrubPii` in `api/_mirrorcall.js@gp` is **refuted**: spaced Aadhaar, `98765 43210`, `+91 98765 43210` and Devanagari digits pass through. Add Indian child PII (school, class, address) and measure. |
| Azure-only serving policy | `api/_model-serving-policy.js@vy` (1.5 KB) | shipped, Q4 | **copy** | Rename env; allow the realtime WebSocket host. It checks provider origins only and does not cover Neon. |
| App-voiced disclosure card bound by digest into the session token | `roomDisclosureCard` in `api/_room-surface.js@va`, HMAC binding at `@vb` | prototype, Q3-4 | adapt | Disclosure is app UI, never the model's job. Rewrite copy for a child tutor (EN/HI). |
| Envelope encryption (AES-256-GCM DEK wrapped by KEK) | `api/_replica-feedback-crypto.js@vc`, `api/_private-text-rehearsal-crypto.js@vy` | prototype/shipped, Q3-4 | adapt | Wrap the KEK in Azure Key Vault; add key versions and AAD. For child transcripts at rest. |
| Behavioural attack battery with severity tiers | `evals/behavioral/{attacks.data,grade,run,fence}.mjs@cmp` | shipped-measured, Q4 | adapt (harness) | 154 units / 208 turns verified by execution. Write new child-safety families. |
| Teacher safety-floor spec; minor-stricter table | `docs/gurukul/safety-floor-teacher.md@vy`, `teacher-arc.md@gp` §7 | spec-only, Q3 | adapt | Guardian sees usage, not transcripts; session-open disclosure card; gamification test in the charter. |
| Flag this reply | `api/_room-surface.js@vb`, migration 116 | prototype, Q3 | adapt | Child or parent flags a reply into a review queue. |
| Offline critical path | `src/engine/localHeart.ts@main` | shipped, Q2 | idea | Scripted romance-adjacent Hinglish; keep only "critical branches pre-empt and need no cloud". |

**Build new.** A child-safety severe-class battery (grooming, contact solicitation, self-harm, abuse, bullying) in
Hindi, Hinglish and Devanagari with negative controls; a realtime transcript audit with an escalation path; a durable
safeguarding hand-off that survives a DB outage (`cc` durable-rescue idea, but never emailing child PII in plaintext).

### 2.10 multimodal-vision

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Camera via `<input capture>`, no native plugin | `context/decisions.md:2087#no-capacitor-camera-plugin@main` | shipped, Q4 | **copy** (decision) | For homework photos. |
| Photo attach with canvas re-encode (EXIF strip) + photo predicates | `components/saathi/photo-attach.ts@ai2b@main`, `lib/saathi/{photo,vision-gate}.ts@ai2b@main` | shipped, Q3-4 | adapt | Parsing EXIF to strip it was rejected ("being wrong once ships GPS"). |
| Scene reader (wake on the arrest of movement) | `src/watch/scene.ts@main` (+ `SceneReader.java`) | shipped-measured, Q3 | idea (park) | Tuned for screen feeds; a child holding a notebook to a camera is a different signal; DPDP risk. |
| Watch-mode prompt shape | `src/engine/persona.ts@meera@AR` L555-585 | shipped-measured, Q3 | idea | Never name what is not on screen; answer "what can you see" honestly. Engagement 20%→42% (n=240/arm) after splitting "say something" from "know what this is". |
| Photo → record policy | `docs/PHOTOS.md@meera@AR` | shipped, Q4 | adapt | Under-record; claims separate from facts; always `sensitive`; forget must reach the image file too (Meera left the JPEG in storage). |
| Modality-honest evidence descriptors | `api/_experience-compiler/claim-evidence.js@mm` | prototype, Q4 | adapt (vocabulary) | No image understanding exists; `image_region` is refused by design. |

**Measured facts to carry.** Azure realtime accepts frames only as `conversation.item.create` with `input_image`,
and they accumulate in history (`measurements.md#azure-realtime-shape@main`). gpt-5.6-luna/terra read 3-4 of 9
messages on a screen and asserted the rest (n=12 screens, 160 calls, 2026-08-11, `#vision-fab@main`). A fabrication
rate is noise below n=300 (`#fab-noise-floor@main`). A Foundry deployment's behaviour drifted within 4 days
(`#vision-drift-4day@main`).

**Build new.** An Azure first-party vision choice with its own fabrication battery at n≥300; worksheet and notebook OCR;
camera consent; an "is the parent answering for the child" signal (`docs/handoff/2026-09-14/VOICE-PRODUCER-NEXT.md@pv`
names active-speaker detection, unmeasured).

### 2.11 group-ai / multi-agent

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Structural disclosure predicate (privacy as WHERE before rank) | `api/_disclosure.js@main`/`@mm` | shipped-measured, Q4 | adapt | 0 of 31,122 leaks vs 57.1%/98.1% for prompt rules. Port the clauses (deny wins, sensitive never crosses, uncited goes only to owner) to Taxila tables for parent and sibling visibility. |
| Disclosure kernel (influence < gist < paraphrase < verbatim, deny wins) | `packages/relational-core/src/privacy.ts@vg@T`; reduced JS port `api/_relational-core.js@vb` | prototype, Q4 / Q3 | adapt | VG01: 50,000-case differential vs an independent oracle, 0 mismatches; a deny-ignoring evaluator diverged 799 times. The JS port has 4 refusal codes vs 15. `TOMBSTONED`/`MEMORY_EXPIRED` are never emitted by the pure function. |
| Portable turn checkpoints (A/S/A/S re-reads, sticky invalidation) | `api/_group-runtime/checkpoints.js@mm` (221 lines, no imports) | prototype, Q5 | **copy** | With its `.d.ts` and eval. Honestly "checkpointed", not atomic. Use before a private memory is used aloud or a module is published. |
| Tenancy predicate (scalar binding; null returns zero rows) | `api/_agentscope.js@main` | shipped, Q4 | adapt | One predicate per tutor or subject agent. |
| Immutable audience per turn | `api/_room.js@mm` L698-813 | prototype, Q4 | adapt | For sibling or multi-child sessions: each turn gets an episode whose participants are the exact current set. |
| Deterministic participation decision | `src/engine/room.ts@mm` L236-371 | shipped, Q3 | adapt (invert) | Lurks by default; a teacher leads. Implicit-addressee inference measured at chance (GPT-4o 80.9% vs 80.1% baseline). |
| Deterministic intervention policy | `packages/intervention-policy/src/policy.ts@vg@T` | prototype, Q3 | idea | In 1:1 every branch collapses to "reply"; useful only for classroom mode. |
| WhatsApp Cloud adapter (HMAC raw body, 24 h window) | `api/whatsapp.js@main` | prototype, Q3 | adapt | Parents only, never children. |

**Build new.** Sibling seats on one tablet; classroom mode with teacher-led turn-taking; a subject-teacher team on the
AgentModule pattern. Group episodes must not move one child's 1:1 bond state (`@mm` state-inert episodes, idea).

### 2.12 company-brain / knowledge-ingestion

There is **no RAG or knowledge-graph code anywhere** in the portfolio. CarbonSettle's "company brain" is a process
artefact (`docs/{AGENT-CONTEXT,SESSION-LOG,SESSION-LOG-PROTOCOL}.md@cc@main`), and Taxila's `context/` graph with
reversal conditions is already stricter.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Extractors with named refusals (scanned PDF, CID fonts, encrypted) | `api/_context/{extract,pdf,docx}.js@vy` | shipped, Q2 | idea | `pdf.js` has no ToUnicode/CMap handling; NCERT Hindi PDFs would be refused or garbled. Use Azure Document Intelligence/OCR. |
| Claim bound to an exact UTF-16 span | `api/_claim-extraction/citation-coordinates.js@vy` (2.8 KB, pure) | shipped, Q2 | idea | For page-cited NCERT fact cards. |
| Instruction-shaped material detector at ingest | `api/_material-detector.js@vb` | prototype, Q3 | adapt | False-positive risk on grammar lessons ("ignore"). |
| Dated fact table outside lesson strings | `lib/ai-work-reality.ts@ai2b@r21/m1` | shipped | idea | Never type a count; print it from data with a date. |
| Audio processing DAG | `api/_replica-processing/pipeline.js@gp` | shipped-measured, Q4 | adapt (only if teacher audio is ingested) | See §2.20. |

**Build new.** NCERT/CBSE/RBSE ingestion with OCR and page citations feeding Taxila's verified kits (`data/kits/`).
Attribution before mining: a textbook is not evidence of how anyone talks (`rejected.md#mine-everything-you-are-handed@vy`).

### 2.13 learning / pedagogy / curriculum

Taxila has `server/learner/bkt.js`, `server/director/{items,classify,state}.js`, `data/curriculum/` and `data/kits/`.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Deterministic practice engine ("a model never grades"), verdicts, author-tagged distractor nature (`slip`/`conceptual`), `rushed` from floor-seconds, cited moments | `src/engine/practice/session.ts@gp`/`@vy` | shipped, Q2-3 | adapt | JEE marking schemes; keep the verdict/moment/citation machinery; K-9 formats (MCQ, numeric, drag-match, ordering, fill-blank). |
| Mastery fold (order-independent, no decay by absence, two-axis levels, XP excludes rushed/skipped) | `src/engine/practice/mastery.ts@vy` | shipped, Q3 | adapt | `MIN_ATTEMPTS 1/3/3/6`, `SCORE_BANDS .4/.7/.9`. Inputs must be reconceived: Taxila detects understanding covertly, so feed verified-key classifications of child utterances. |
| Syllabus as data with derived stable ids ("append freely, rename never") | `src/engine/practice/syllabus.ts@vy` | shipped, Q2 | idea | Content is JEE PCM. Taxila already has `data/curriculum`. |
| `practiceTalk`: the only place a practice set becomes words (≤14-word facts, ability-label fence, internal-id fence) | `src/engine/practiceTalk.ts@gp` | shipped | adapt | Widen the ability-label list bilingually for K-9. |
| Near-miss check rule (distractors are wrong applications of the same rule in the same scene) | `docs/learning/checks.md@ai2b@main`, `tests/learning-near-miss-checks.test.ts@ai2b@main` | shipped-measured, Q4 | **copy** (rule) | Retired stems 70%→0; borrowed-rule distractors 99%→0 (100 lessons). Retune the 8-25 word scene bound for children. |
| Criteria read only from taught lines; `notGradeable` is a real answer | `lib/evidence/quest-rubrics.ts@ai2b@main` | shipped-measured, Q4 | idea | Covert comprehension criteria must come from what was taught in-session. |
| Glossary-first ahead of the hint ladder; doubt ladder | `lib/saathi/{glossary-first,ladder}.ts@ai2b@main` | shipped, Q3 | adapt | Needs an NCERT glossary. |
| Spaced retrieval 2/7/21/60 days with structural no-guilt | `lib/learning/spacing.ts@ai2b@main` | shipped, Q4 | adapt | No skipped/streak/seenAt field exists. 60 days is untested for children. |
| Criterion-named feedback with no verdict | `lib/learning/feedback-gates.ts@ai2b@main` | shipped-measured, Q3 | adapt | Pass rate 71.9%→89.1% EN, 87.5% romanised Hindi (n=64/arm, 2026-09-13). |
| Exemplar beside the rubric (strong vs competent-but-hurried weaker) | `lib/evidence/quest-exemplars/contract.ts@ai2b` | shipped-measured, Q4 | adapt | Self-check exemplars for parents and older children. |
| Observation vs pattern evidence bars | §2.7 | | adapt | Required for any learning-profile claim. |
| Interview gap model (ranked gaps → question shapes, never questions) | `api/_interview-gaps.js@vy` | shipped, Q2-3 | idea | Rank what the profile lacks and probe in-lesson. |
| Bradley-Terry active pairwise discovery | `api/_replica-voice-curriculum.js@vc` | prototype, Q3 | idea | Gate numbers (≥18 rows, margin 0.42) are voice-style tuned. Unvalidated for learning profiles. |
| Proposal budget and named evidence bands | `api/_mirrorcall.js@gp` | prototype, Q3 | idea | 3 proposals/min; bands, never decimals; nothing applies without an acknowledgement. |
| Lexical recall scorer `scoreAnswer` | `api/_recall-run.js@vb` | prototype, Q2 | idea | **Measures echo of the source passage**, penalising own-words explanations. One weak signal at most; never the detector. |
| Indic-safe speech normaliser | `normalizeChallengeSpeech` in `api/_replica-voice-identity.js@va` | prototype, Q3 | adapt | Keeps `\p{M}`, folds Devanagari digits. Remove the digit-run joiner ("answer 5 10" → "510"). |
| Disengagement seed (over-raised topics with reception) | `src/engine/repeat.ts@main` | shipped, Q4 | adapt | Recalibrate the 3-word rule for voice transcripts. |
| Adaptive difficulty (rises within a session, softens only between sessions, never announced) | `src/engine/chess/adapt.ts@cmp` | shipped, Q2 | idea | Chess-specific; EMA α=0.4 untested on learners. |
| Move is code, talk is model | `docs/SPEC-GAMES.md@main` §0 | shipped, Q4 | **copy** (principle) | The assessment engine decides correctness; the teacher narrates it. |

**Build new.** A covert comprehension detector (nothing exists; the nearest signals are verdict, step, `rushed`,
near-miss choice, transfer and teach-back); learning-profile discovery (ai2bharat has only a 3-value
explanation-style kind); a spaced-repetition scheduler (Gurukul specced FSRS and never built it); K-9 content.

### 2.14 gamification

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Gamify-without-the-lever policy + fire-once milestones (`DAY_TIERS [7,30,100,365]`, `latestOnly`) | `context/decisions.md@main`, `src/engine/milestones.ts@vy` | shipped, Q3 | adapt | Copy the decision text. Minors have `engagementMechanics: false`. |
| NEVER MANIPULATE four-question audit in every mechanic's header | `lib/community-progress.ts@ai2b@main`, `docs/strategy/03-retention.md@ai2b` §9 | shipped, Q4 | **copy** (checklist) | |
| Points only from finished work, permanent level floor | `lib/trail/*@ai2b@main` | shipped, Q2 | idea | Adult-community mechanic. |
| Celebration licence (only a recorded moment licenses celebration; praise method, never ability) | `lib/saathi/{contract,moments}.ts@ai2b@main` | shipped, Q3 | adapt | |
| Closed sound vocabulary with a REFUSED table and a call gate | `src/sound/vocabulary.ts@main` | shipped-measured, Q3 | adapt | |
| Engine-owned scores (STATE_LAW) | `src/engine/persona.ts@cmp`, `src/engine/activity.ts@cmp` | shipped-measured | idea | The model never claims a score or a win. |

**Refused for children** (`docs/gurukul/student-app-spec.md@vy` §2.4-2.6; `rejected.md#gamification`@vy line 41):
speed bonuses, XP for streak length, XP for asking doubts, notification re-engagement, Duolingo-style leagues,
variable rewards, streak anxiety, fake urgency. Note Gurukul still kept quietly reset streaks; Taxila should be stricter.

### 2.15 generative-ui / modules

Taxila has `src/modules/{host.tsx,frame/*}`, `src/lesson/{moduleChannel,moduleEvents}.ts`, `server/director/modules.js`
and an `asset_cache` table.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| ActivityState seam (`facts`, `nameable` allowlist, `record`, undroppable `state`, `over`) | `src/engine/activity.ts@main` (183 lines, zero imports) | shipped-measured, Q4 | adapt | Generalise the closed enum (chess/watch/wyr/ttt) to module ids. The teacher may name only what the module's machine state says. |
| Mid-call notes (past tense + settled clause; stale/hold/send) | `src/state/game.ts@main`, `src/engine/chessTalk.ts@main`, `evals/movevoice.mjs@main` | shipped-measured, Q2 | idea | 25/25 inside the predicted band. The frozen prompt must say what is now closed. |
| Protocol-marker parser | `parseBubbles` in `src/engine/brain.ts@main` L489, `evals/parse.mjs@main` | shipped-measured, Q3 | adapt | Re-key to `[module: …]`. |
| Safe KaTeX renderer (explicit TeX delimiters only) | `src/studio/{ExpertAnswer.tsx,answerMath.ts}@h206`, katex 0.18.7 | shipped, Q4 | **copy** | Verify MathML in the Android WebView. The prompt must emit `\( \)` / `\[ \]`, not `$`. |
| Durable idempotent generation intent | `api/_voice/{preview-panel,preview-authority}.js@h206` | shipped-measured, Q2 | adapt (pattern) | 5 clients x 10 requests on one intent → exactly 1 generation. Never pay twice for a module or image. VG12's state machine (reserved → dispatched → ambiguous/terminal) fits `asset_cache`. |
| Warming as a state (200 / 202 + Retry-After / named error) | `api/_voice/warmup.js@gp` | shipped-measured, Q3 | adapt | For slow module and image generation. |
| Devanagari server image cards (Skia) | `api/_room-card.js@vb` | shipped-measured, Q3 | adapt | resvg corrupts matra clusters. |
| Generated-content sanitiser and lints | `scripts_automation/generate_blog.py#normalise_generated_post@cs`, `scripts/verify-blog-posts.mjs@cs` | shipped-measured, Q3-4 | adapt (in JS) | Strip code fences, placeholders, duplicate H1; banned-phrase lint. |
| Four-bucket generated-media fault taxonomy | `lib/learning-catalog/multimodal-physical-ai.ts@ai2b@r21/m3` | shipped, Q3 | idea | QA rubric for gpt-image-2 lesson images. |
| Model writes the template, code writes the numbers | `lib/analyst-loop/{insight-validator,template-filler}.ts@naukri` | shipped, Q3 | idea | Its validator only warns; build fail-closed stripping. |
| Lifecycle matrix (every event x context names its carrier and reason) | `evals/lifecycle/run.mjs@main` | shipped-measured, Q3 | idea | Lesson x module x call-drop matrix. |

**Gurukul's rule** (`gurukul.md` §0.10): AI-authored questions were rejected for v1 because "a generated JEE question
with a wrong answer key is a much worse failure than an illegal chess move". Generated presentation is fine; graded
truth must come from a verified key.

**Build new.** The Forge content factory, its sandbox and its module verification gates (Taxila task 5).

### 2.16 evals / gates / verification

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Gate runner by exit code, all failures printed | `scripts/verify-release.mjs@main` (219 lines) | shipped, Q4 | adapt | Rewrite the gate list. Never read a verdict from the tail of a pipe. |
| Kappa + Wilson + FCE intervals | `lib/evidence/calibration.ts@ai2b@main` (595 lines, zero imports) | shipped, Q5 | **copy** | Self-test 5/5. Re-verify against a reference implementation. |
| Qualification gate (Wilson lower bound, noninferiority, zero-failure safety, "inconclusive" verdict) | `api/_replica-candidate-qualification.js@vc` | prototype, Q4 | adapt | Pure logic; thresholds (0.6/0.4/300) from replica context. For promoting any prompt or model change. |
| Pre-registered judged battery (sha256 manifest of fixtures, rubrics, acceptance) | `evals/feltmem/*@main` | prototype, Q4 | adapt | Fixtures are adult dyads. |
| Register battery, n≥300 per model and lane | `evals/saathi/{register,gates,shapes,run}.mjs@ai2b@main` | shipped-measured, Q3-4 | adapt | The per-model law: any model or lane change re-runs it before a flag flips. |
| Behavioural attack battery | §2.9 | | adapt | |
| Comment-aware source tokenizer for static scanners | `evals/lib/source-scan.mjs@vb` (485 lines, no imports) | shipped-measured, Q4 | **copy** | |
| Parallel eval runner with serial parity | `evals/runner-lib.mjs@vb` (132 lines) | shipped-measured, Q4 | **copy** | 414 s vs 808 s; parity 226/226. |
| Mirrored-constants gate | `scripts/check-mirrors.mjs@vb` | shipped-measured, Q4 | **copy** | Or import constants from `shared/contracts.ts` instead of mirroring. |
| Keyless synthetic-PostgreSQL SQL proof | `evals/group-sql-authority/harness.mjs@mm` | prototype, Q4 | adapt | It caught a `text[]` vs `uuid[]` mismatch that mocks hid. |
| Held-request barrier for UI race tests | `evals/teacher-sheet-publication/held-request.mjs@mm` (63 lines) | prototype, Q4 | **copy** | For "parent switches child mid-request". |
| Switch-adjacent WER | `evals/voice-code-switch-frontier/quality-metrics.mjs@h206` | prototype, Q4 | **copy** (that file only) | Roman-script Hinglish returned 0 switch-adjacent tokens; author language spans. |
| Raw vs script-aware Hinglish WER | `evals/speech/hinglish-script-score.mjs@gp` | shipped, Q3 | **copy** | |
| Blind listening benchmark (HMAC ids, keyed shuffle, catch trials, peak-safe loudness, Wilson CI, three verdicts) | `evals/voice-listening-benchmark/{lib,server,page,run}.mjs@h206`, `evals/earbench/*@gp` | shipped, Q4 | adapt | 35 + 108 checks pass offline. **Never used on a human.** Drop the `owner_likeness` axis; add clarity, warmth, accent and child comprehension. |
| Deterministic hash arm assignment | `packages/pilot-telemetry/src/exposure.ts@vg@T` (33 lines) | prototype, Q4 | **copy** | For fixed story/song/game format trials. Adaptive per-child discovery needs a bandit instead. |
| Synthetic privacy gauntlets + independent-oracle differential | `packages/simulator/src/*@vg@T`; harvester's 50k differential | prototype, Q4 | adapt | Add a real broken evaluator; the repo's own negative controls are tautological. |
| Door and leak batteries | `evals/room-doors/*@vb`, `evals/room-leak/*@vb` | prototype, Q3 | idea | Port the 8 attack classes and the N-follower world to child, sibling and class. |
| Byte-identity frozen extraction | `src/engine/__fixtures__/byte-identity.mjs@main` | shipped-measured | idea | A refactor reproduces prior bytes before features flip. Live clock and date must be pinned. |

**Laws.** Every gate carries an in-run negative control that must fail. A gate that skips is red, not green. A green
release proves nothing about providers, listening or usefulness (`rejected.md#release-pass-does-not-certify-provider-or-listening-20260907@h206`).

**Build new.** Taxila's child-safety battery; a frozen held-out evaluation for the comprehension detector and the
learning-style classifier (`evals/group-source-recall/*@mm` is the preregistration pattern); an Azure-only judge
qualification (every judge family tested in the portfolio failed the 0.80 bar).

### 2.17 telemetry / tracing

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Turn trace (7 legs, references not copies, retention at write) | `api/_trace.js@main`, `db/migrations/012_turn_trace.sql@main`, `docs/TRACE.md@main` | shipped-measured, Q4 | adapt | `MAX_STR=64`, 30/90-day retention. 0 added SQL, ~4 µs/turn, 4,456 B/turn (n=20,000x5, 2026-08-20). Re-key to child and lesson. |
| Telemetry contract | `docs/TELEMETRY.md@main` | shipped, Q3 | adapt | Remove draft and keystroke capture for minors. |
| Content-free unexpected-error diagnostic | `api/_replica-processing/worker.js@gp` | shipped-measured, Q4 | **copy** (10 lines) | Its message regex can still echo short data-bearing text; tighten. |
| Capability-absence codes | `api/_replica-processing/capability-codes.js@gp` (29-line leaf) | shipped-measured, Q4 | **copy** | "Waiting on us" routes and requeues automatically. |
| Sweep heartbeat (row at start, update at finish) | `api/_sweep-run.js@va` (151 lines) | prototype, Q4 | **copy** | Needs a migration. |
| Incident ledger + `withDoor` | `api/_incidents.js@vb`/`@vy` | prototype/shipped-measured, Q3-4 | adapt | Taxila has an `incident` table; remove the Telegram/push operator transports. |
| Per-turn trace + price table | `lib/saathi/contract.ts#SaathiTrace@ai2b`, `lib/model-spend.ts@ai2b` | shipped, Q2-3 | adapt | Re-price for Azure. |
| Counts-only cohort aggregates, k≥5 | migrations `202609010022_member_activity_cohorts.sql@ai2b`, `api/_pulse.js@va` | shipped/prototype, Q3 | adapt | Pairwise suppression for class-level insight. |
| Content-free telemetry with banned engagement metrics | `packages/pilot-telemetry/src/{events,validation}.ts@vg@T` | prototype, Q4 | adapt | The banned list (`retention`, `time-spent`, `description`) collides with legitimate learning metrics; narrow it. |
| Human vs machine session rule | `lib/engagement-classifier.ts@cc@main` | shipped-measured, Q4 | adapt (narrow) | For parent report-link scanners. Do not use it as covert child attention: heartbeats measure tab visibility, and DPDP s.9(3). |

### 2.18 auth / accounts / consent

Taxila has `server/auth.js` (scrypt, opaque DB session, `timingSafeEqual`), `guardian`, `child`, `consent`,
`auth_session`, `guardian_pin`, `child_controls`, and decisions `psych-consent-assent-two-tier`,
`compliance-deferred-to-launch`.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Consent gate at one network seam (refusal shaped like offline) | `GATED_OPS` / 451 in `src/engine/memory.ts@cmp` | shipped, Q4 | adapt | **Invert**: absent parental consent means no memory writes. |
| Append-only, content-free consent ledger | `db/migrations/016_memory_consent.sql@cmp`, `member_saathi_consent@ai2b` | shipped, Q4 | adapt | Re-key from device to `child_id`/`guardian_id`. Grants and withdrawals are separate rows; keep both client tap time and server filing time. |
| Unbundled consents recorded before any turn | `joinRoom` in `api/_room-surface.js@vb` | prototype, Q3 | adapt | The source requires age TRUE (adult); invert. Memory consent may be false while the service still works. |
| Consent receipts (canonical JSON, scoped, expiring, one-statement revoke cascade) | `api/_replica-consent.js@vc`, `src/replica/contracts.ts@vc` | prototype, Q3-4 | adapt | Scopes are biometric/voice; redesign for memory, voice processing, camera, reports. |
| Known-consent source admission fence | `api/_group-source-event.js@mm` | prototype, Q4 | adapt | Never persist audio or text captured before verifiable consent; Taxila must use the server receipt time of the audio frame. |
| Forget cascade with a PERSON_TABLES manifest and written fates; relcheck | `opForget` and `PERSON_TABLES` in `api/memory.js@main`, `scripts/relcheck.mjs@cmp` | shipped-measured, Q3-4 | adapt | Delete child before parent (`rejected.md#ws-r27-child-before-parent-ordering-bug@va`). Needs parent-authenticated erasure. |
| Readable DPDP export (throws on an unexplained table) | `api/_room-export-readable.js@vb` | prototype, Q3 | adapt | 46/46 manifest tables. |
| Dormancy notice then forget | `api/_dormancy.js@vb` | prototype, Q3 | adapt | Child-retention law differs. |
| HMAC session with freshness check | `api/_room-surface.js@va` L180-250 | prototype, Q4 | **copy** | Add an audience claim (child vs parent). Seven sites missed the TTL check before it was shared. |
| In-app browser detection before Google OAuth | `lib/auth/embedded-browser.ts@ai2b@main` (72 lines) | shipped, Q4 | adapt | OAuth fails silently with 403 `disallowed_useragent` inside WhatsApp/Instagram webviews. |
| Signed links | `lib/cold-email/proposal-link.ts@cc@rev` | shipped, Q3 | adapt | Add `exp`, `jti` and revocation; copy from the review branch, never `cc@main`. |

**Refused.** Face liveness or biometrics for minors (`services/azure-verifier/*@vy`, skip). Device UUID as identity
(89.2% of recall lost on a surface switch, `measurements.md#surface-switch-recall@vy`). Self-attested age as parental
consent (`hpva-05`). WhatsApp STOP-confirm friction (withdrawal must be as easy as consent).

**Build new.** Verifiable parental consent; child assent; the parent account → child profile → device seat model
(`docs/gurukul/research/GROUP-NATIVE-IDENTITY-20261001.md@mm` is a design reference). DPDP s.9 has full effect
2027-05-14 and prohibits behavioural monitoring of children (s.9(3)). That collides with covert comprehension and
learning-profile discovery and needs counsel before launch (repo readings are second-hand).

### 2.19 db-schema

Taxila has migrations 001-003 (tables listed in the preface).

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Cited memory and self-layer tables | §2.7; `db/migrations/011_self_layer.sql@main` | shipped-measured, Q3-4 | adapt | CHECKs: arc `cardinality(citations)>=3` and `span_days>=42`. |
| Provider budget with DB CHECK `spent+reserved<=limit` | `db/migrations/028_provider_budget.sql@vc` | prototype, Q4 | adapt | Per-child budgets need one `budget_id` per child. |
| Generic row-audit trigger with an actor GUC | `supabase/migrations/20260715_critical_tables_audit_trigger.sql@cc@main` | shipped, Q4 | adapt | `set_config(...,true)` inside the request transaction on pooled Neon; redact child PII from the jsonb copy. |
| Append-only triggers, RLS, tombstones | `db/migrations/001_foundation.sql@vg@T` | prototype, Q4 | adapt | 001 uses `ENABLE` without `FORCE`, so the owner bypasses RLS. |
| Neon role hardening | `context/nodes/dec-20260830-neon-app-roles-created-by-sql.json@vg@T` | prototype, Q5 (finding) | **copy** (as a check) | Neon-CLI roles inherit BYPASSRLS. Create app roles with SQL `NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE` and assert `rolbypassrls` is false in `scripts/migrate.mjs`. |
| Rollback-only migration verifiers | `scripts/verify-*-migration.mjs@ai2b@main` | shipped, Q3 | adapt | Prove privileges, triggers and CHECKs against real Postgres. |
| Versioned measurement write (guard CTE + supersede + method version) | `api/_recall-run.js@vb`, migration 127 | prototype, Q4 | adapt | For comprehension scores and learning-profile estimates. |
| Server-true learning record (server recomputes; first-try columns stored once) | `202609010021_learning_record_truth.sql@ai2b` | shipped, Q3 | adapt | Client-asserted `*_aligned` booleans were rejected. |

**Neon facts paid for once.** SQL-over-HTTP runs one statement per request with no transactions or DO blocks.
Data-modifying CTE siblings cannot see each other's writes (Gurukul committed 0 evidence rows ever because of it,
`rejected.md#data-modifying-ctes-cannot-see-each-other@gp`). Postgres forbids updating the same row twice in one WITH.
`min(uuid)` does not exist. Synthetic `ARRAY['uuid']` types as `text[]`. An unqualified parameter shadowed a column
and made revoked consent look current (`vg@T` fail nodes). The shared/exclusive privacy barrier needs a direct
session connection, not the pooler or HTTP. Assign migration numbers centrally: ordinals collided across parallel
branches (`016_memory_consent@cmp` vs `016_replica_enrollment@vc`; ai2b `0021` x3).

### 2.20 infra / azure / deploy

Taxila deploys to Azure Container Apps (`scripts/deploy-azure.mjs`) and calls Foundry through `server/azure.js`.

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Fail-closed spend ledger (reserve → begin → settle / release / uncertain) | `api/_provider-budget.js@vy`, `docs/PROVIDER-BUDGET.md@vc` | shipped-measured, Q4 | adapt | Cut the `_provenance/contracts.js` import chain. Add meters for realtime audio minutes, gpt-image-2 images and per-child daily budgets. Timeout after I/O = `reconcile_required`, never a free retry. |
| Daily USD cap per feature, DB ledger, fails closed; feature → deployment table | `lib/ai/{budget,router}.ts@ai2b@main` | shipped-measured, Q4 | adapt | No model name in code. An in-process ledger was rejected (resets on cold start). |
| Azure-only serving policy | `api/_model-serving-policy.js@vy` | shipped, Q4 | **copy** | See §2.9. |
| Upstream failure classification | `api/_lanes.js@main` L58-205 | shipped-measured, Q4 | adapt | `TRANSIENT_BUDGET=3`, `TRANSIENT_DEADLINE_MS=4000`, backoff 350-700. Drop the Gemini/OpenRouter lane order. 5xx are transient; one 502 must not abort. |
| Container Apps Job worker (baked ClamAV, SQLSTATE-only errors, clamd killed in `finally`) | `services/replica-processing-worker/*@gp` | shipped-measured, Q4 | adapt | Template for consolidation and Forge jobs, and malware scanning of uploads. |
| Postgres lease queue (`FOR UPDATE SKIP LOCKED`, hashed lease tokens) | `api/_replica-processing/queue.js@vc`; head-of-line claim `packages/postgres-runtime/src/runtime.ts@vg@T` L447-495 | prototype, Q4 | adapt | Verify the CTE over Neon's HTTP runner. |
| Azure Blob signed block upload with CRC64 | `api/_replica-storage.js@gp` | shipped-measured, Q3 | adapt | CRC64 must be little-endian (big-endian → 400). Prefer `@azure/storage-blob`. |
| Foundry structured-output adapter | `api/_dialogue/providers/azure-foundry.js@h206`/`@vy` | shipped-measured, Q2-3 | adapt | `redirect:error`, 512 KB cap, retry on 408/409/429/5xx, usage required. Hardcodes `gpt-5.6-terra` and `2024-05-01-preview`; parametrise. |
| Same-origin mutation check, bounded JSON, UUID validation before casts | `lib/request-security.ts@ai2b@main` (100 lines, zero imports) | shipped, Q3 | **copy** | |
| Persistent rate limit as one upsert | `api/_rate-limit.js@va`, migration 089 | prototype, Q4 | **copy** | The in-memory limiter is per replica and trusts Vercel headers (wrong under ACA ingress). |
| Env manifest (names only), self-check, required-env fingerprints | `scripts/envManifest.mjs@vb`, `lib/required-env.ts@cc@main` | prototype/shipped, Q3 | adapt | Never print values. Header auth and constant-time compare. |
| Live bundle must equal built bundle; deploy commitment marker | `scripts/verify-deploy.mjs@main`, `scripts/deploy-commitment.mjs@vy` | shipped-measured, Q2-3 | adapt | Serve the commitment as a header or route on ACA. |
| Security headers gate | `scripts/check-headers.mjs@vb` | shipped-measured, Q3 | adapt | `connect-src 'self'` blocks the Azure realtime socket; `media-src` governs signed audio; never ship `Permissions-Policy: microphone=()` (as `cs` does). |
| Supervised scale-to-zero GPU controller | `services/azure-voice-app/controller.mjs@pv` | prototype, Q4 | idea | Only if Taxila ever self-hosts a model. |
| Vercel → ACA move manifest | `docs/TRANSFER.md@vyakti-product@9fddcd2` | spec-only, Q3 | adapt | Lists what git will not carry (gitignored config, CI secrets, platform links, schedules from the default branch). |

**Azure facts paid for once** (`gurukul.md` §5.2, `companion-tech.md` §11.3-11.4). The working realtime handshake is
`/openai/v1/realtime?...&model=<deployment>` with the nested GA session schema; the `2025-04-01-preview` +
`&deployment=` form upgrades and then fails at session level. Node WebSockets behind a proxy need
`NODE_USE_ENV_PROXY=1`. A readiness-only probe on Container Apps is fatal; add a Startup probe. A GPU cold start
(161 s) outlives request timeouts (~240 s) and a 60 s HMAC skew: wake on unauthenticated `/healthz`, then sign. A 9.7 GB
CUDA image on a CPU service cold-starts far slower than a 424.7 MB slim image (35.6 s). `DeploymentNotFound` hit 7.5%
of 40 calls. South India has no Speech; use Central India. Job names have a length limit (33 characters failed).
Sponsored quota, a USD 1 app cap or a cost alert is not proof of no charge (spending limits Off/LimitRemoved,
`measurements.md#credit-only-billing-readback-20260929@vy`).

### 2.21 design-system / ux

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Design standards (mechanised vs judgment) | `docs/DESIGN-STANDARDS.md@main` | spec-only, Q3 | **copy** | |
| Motion and copy lints | `scripts/check-motion.mjs@main`, `scripts/check-copy.mjs@main` | shipped, Q3 | **copy** | 6/6 and 8/8 injected violations caught. |
| Real-pixel contrast gate | `scripts/check-contrast.mjs@meera@AR` | shipped-measured, Q4 | adapt (core only) | Composite over decoded pixels plus WCAG ratio. Build-time only; cannot gate runtime-generated backgrounds. |
| Layout readability gate on the real signed-in screen | `scripts/check-layout.mjs@gp`/`@vb` | shipped-measured, Q3 | adapt | Add 360x640. Extract the Devanagari tofu probe and its control. |
| Accessibility gate (axe + keyboard walk + lang-tag audit) | `scripts/check-accessibility.mjs@va`/`@vb` | shipped-measured, Q3-4 | adapt | |
| Performance budgets on a bad Indian 4G day (CDP throttle, gzip-true bytes) | `scripts/check-performance.mjs@vb` | shipped-measured, Q4 | adapt | Re-budget for the 3D tutor. Serving uncompressed bytes gave false FAILs. |
| Touch-target gate with a rejecting negative control | `evals/source-aware-review-ui/run.mjs@mm` | prototype, Q3 | adapt | Children need 48-56 px. |
| Waiting-on-you / waiting-on-us blocker type | `src/studio/blockerClass.ts@gp` (198 lines, no imports) | shipped-measured, Q4 | **copy** | Property-tested over 27,648 inputs. |
| Haptics; call status store | `src/native/haptics.ts@main`, `src/state/callStatus.ts@main` | shipped, Q4 | **copy** | |
| Responsive audit (surfaces x 18 viewports x locales x themes) | `tools/responsive-audit/*@ai2b@main` | shipped-measured, Q3-4 | adapt | "Unmeasured never passes." |
| Lazy throwing Hindi copy table; language tagged at the node | `src/studio/copy.ts@vb`, `src/room/copy.ts@vb` | prototype, Q3 | adapt | No silent English fallback. |
| Self-hosted Indic fonts | `public/fonts/*@ai2b@main` (12 woff2, OFL) | shipped, Q4 | **copy** | Verify subset coverage. |
| Provenance-carrying number component | `src/components/research/measure.tsx@vw` | shipped, Q4 | adapt | A number cannot render without n, method, date and source. For parent reports. |
| Evidence rail states (measured / in preparation / struck / open) | `src/components/research/evidence-rail.tsx@vw` | shipped, Q3 | adapt | "What we know / what we are still checking" instead of a fake mastery percentage. |
| World layer "the sky is the clock" | `src/engine/sky.ts@meera@AR`, `docs/DESIGN-WORLD.md@main` | shipped-measured, Q4 | idea | Product decision; painted XOR procedural. |

**Rejections to respect.** Judging contrast by eye in one theme (a 1.82:1 primary action survived reviews,
`ai2b`); following "cut text, fewer boxes" literally deleted every animation and the founder rejected three surfaces;
`onPointerDown`-only controls broke keyboard activation; a native time input ate Tab stops; `document.fonts.check`
returns true for a bogus font in headless Chromium; tofu width-diff alone flags real three-letter Hindi words;
viewport-only screenshots missed in-flow dialogs; a giant green dial and a spinning "scanning YOU" orb; a patch-only
redesign; CSS animation tricks (implicit keyframe end, px/number calc, minifier eating tokens); a hand-drawn chess set
illegible at 44 px; an accessibility gate that never saw a day sky until 06:00 IST.

### 2.22 android / capacitor

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| OTA web-bundle updater with rollback chain | `android/app/src/main/java/app/meera/companion/{OtaUpdater,OtaState,OtaBundle,OtaPlugin}.java@main`, `scripts/ota-bundle.mjs@main` | shipped, Q4 | adapt | Integrity is sha256 from a manifest over https with **no signature**; add one. Repoint the manifest from `meera-silk.vercel.app`; rename the package; check Play policy. |
| Mic permission fast path | `MicPermissionFastPath.java@main` (122 lines) | shipped, Q4 | adapt | Rename package, wire into MainActivity. |
| Release signing in CI | `.github/workflows/build-apk.yml@cmp`, `android/app/build.gradle@cmp` | shipped, Q4 | **copy** | `HAS_KEYSTORE` flag, base64 decode, `bundleRelease`; secrets by name only. |
| Capacitor config, manifest permissions | `capacitor.config.ts@main`, `android/app/src/main/AndroidManifest.xml@main` | shipped, Q3 | adapt | |
| Play Store pack | `docs/playstore/*@cmp` | spec-only, Q2 | idea | Written for 18+. A children's app needs the Families Policy path. |

**Notes.** Web Push does not reach a Capacitor WebView; Android needs FCM. A remote-URL Capacitor shell
(`mobile/capacitor.config.ts@cc@main`) is wrong for a store-published kids app; bundle the assets. Verify MathML
support before relying on KaTeX output. On-device `PipedRecognizer` STT (API 33+) is unmeasured for Hindi child speech.

### 2.23 payments

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Payments seam + fake twin + Razorpay UPI Autopay mandate lifecycle | `api/_payments.js@vb` (2,915 lines), `api/_payments/providers/{razorpay,fake}.js@vb` | prototype, Q2-3 | adapt (extract) | **No real Razorpay request or webhook was ever made** (file header). 7/9 provider marks verified against docs. Extract verify, idempotency and the rank guard; skip creator payouts. |
| Webhook no-regression rank guard | `_payments.js@vb` | prototype, Q4 | adapt | 354 interleavings found a real paying-user regression before the fix. |
| GST Rule 46 receipt with honest placeholders | `api/_receipt.js@vb` | prototype, Q3 | adapt | `financialYearFor` uses the UTC month, not IST (verifier finding). Accountant sign-off needed. |
| Cap as one conditional UPDATE | `roomSay` in `api/_room-surface.js@va` | prototype, Q4 | adapt | It spends before delivery; spend on delivery instead. |
| Conversion moment after a session that worked (cooldown, never mid-turn) | `api/_phase-gate.js@va` | prototype, Q3 | adapt | Extra manipulation review for parents of children. |

**Rejections.** Updating the same row in a second CTE; a strict per-kind leaving-state whitelist (webhooks have no
ordering); searching for a UPI-to-card upgrade endpoint (none exists); Razorpay docs geo-redirect to `/docs/us`
without the `preferred_country=IN` cookie. Market anchors: Indian AI-tutor cluster ₹420-1,000/month (n=43 sources,
web sweep, 2026-08-25, `docs/research/market-sweep-2026-08-25.md@cmp`).

### 2.24 growth / seo

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Slug manifest that fails the build if any published URL stops resolving | `scripts/check-blog-slugs.mjs@cs` | shipped-measured, Q4 | adapt | Import the resolver instead of mirroring it. |
| Generated-content sanitiser, link validation | §2.15 | | adapt | |
| IndexNow on postbuild, llms.txt | `scripts/indexnow-submit.mjs@cs@main`, `public/llms.txt@cs` | shipped, Q2 | adapt | The script `exit(1)`s on HTTP ≥400; only an `or-exit-0` suffix in package.json hides it. |
| Honest sitemap lastmod | `src/app/sitemap.ts@cs` | shipped, Q2 | idea | File mtime equals build time after a Docker `COPY`; use `git log -1 --format=%cI`. |
| Pure QR encoder | `api/_qr.js@vb` (617 lines, no deps) | prototype, Q4 | **copy** | Decoded 10/10 versions by jsqr only after two fixes. |
| One-field +91 phone-or-email capture | `src/lib/contact-detect.ts@cs` | shipped-measured, Q3 | adapt | Take the detector only; the component sends partial leads before consent. |
| Guest taste lane (stateless demo) | `api/_room-taste.js@vb` | prototype, Q3 | adapt | A demo lesson for a parent that stores nothing about the child. |
| Referral with exactly-once reward | migrations 123/133@vb | prototype, Q3 | adapt | |
| Public SEO page with hreflang + JSON-LD | `api/_creator-page.js@vb` | prototype, Q2 | adapt | Board x class x subject pages stay noindex until they carry unique, verified content (`cs` pSEO policy). |
| First-party analytics tracker | `src/components/analytics/{tracker,signals}.ts@cs` | shipped-measured, Q3 | adapt | Marketing site and parent app only; strip `harvestFormValues`; a persistent localStorage visitor id contradicts child identity rules. |

**Rejections.** Re-dating slugs sent ~65% of 90-day impressions to 404 (`docs/blog-automation-fix.md@cs`);
duplicate titles triggered domain-wide duplicate clustering (139 posts in 38 groups); 4 AI posts/day read as a content
farm (343 pages "Discovered - not indexed"); fabricated AggregateRating and reviews were removed sitewide; a throwing
duplicate-title guard broke a production deploy and its silent replacement caused 404s; dated offer copy drifted across
66 files; a daily generator died silently when one provider key's quota ran out.

## 3. Rejected: do not repeat

Deduplicated across all 19 reports. Each line is "what was tried → what broke [source]". Where several segments
logged the same rejection, one source is given. `rj:` means `context/rejected.md#` at the stated ref. Entries already
carried in Taxila's own `context/rejected.md` are marked (T).

### 3.1 Prompt and persona engineering
1. Example quotes and polished-sentence taste in the persona brief → a phrase bank: recited verbatim 4/5 turns (0 after removal, n=84); taste read out verbatim twice, 8 turns apart; register defection 13/96. [rj:recited-prompt@main]
2. An important rule placed mid-brief → fired 0/8 (and 0/6 at the end of core); appended after everything 8/8. The FORGET marker fired 0 times across 3 direct requests while mid-core. [decisions.md#prompt-position@main; persona.ts:650-676@main]
3. A third appended-last slot → dilutes the two that must fire; capped at two by test. [lib/saathi/pedagogy.ts@ai2b@main header]
4. Brevity asked for in prose ("2-3 short sentences") → 64 words/turn on gpt-realtime-2.1 and mini (n=6). (T) [rj:brevity-by-instruction@Taxila]
5. An unbounded "MUST: ask before telling" in the strongest slot → question share 66.9-86.9% on three vendors; the comprehension tag ("samajh aaya?") was most of it. [measurements.md@ai2b@main]
6. A fourth clause inside an already-maximal slot naming the two worst bands → aggregate 42.7%→48.3%; untargeted bands regressed (35→64%, 28→45%). "Bytes that buy nothing are still bytes." [measurements.md L685@ai2b@main]
7. Mid-CORE rows to stop re-asking at the close → no effect (47.0% vs 44.7%, n=320); reverted. [measurements.md@ai2b@main]
8. `explanationOrder … -> check-back` → read as "end with samajh aaya?"; replaced by "hand back the next move" and the tag became a banned shape. [timeline@ai2b@main]
9. Many "ask something" rules plus one "don't ask" and adjectives like "be brief" → a question in 100% of call turns, 2.86 per turn; fixed only by a FINAL counts block appended last. [persona.ts:427-436@meera@AR]
10. Teaching an audio-tag vocabulary ([laughs], [softly]) while banning brackets; bracketed exemplars inside the rule that limits brackets → stage directions on 10/10 replies; the contradiction reproduced until exemplars were removed. [persona.ts:398-482@meera@AR]
11. "(you were doing something)" in the call-open directive → an instruction to fabricate: invented shared photos, books and meetings. [rj:the-directive-that-said-improvise@main]
12. "You have your own life — INVENT it" → her present re-rolled on every call; wording alone could not fix it. [persona.ts@meera@M vs @AR]
13. Improvised self-facts scoped per listener → two users told contradictory lives. Taxila's tutors have no invented life. [rj:life-per-person@main]
14. A second, hand-assembled realtime prompt beside `compile()` → missed AGE_TIER_SAFETY_OVERRIDE and FORGET_DECISION, so a minor's romance refusal never reached calls; recall string always empty. [rj:age-tier-never-realtime, #realtime-recall-never@main]
15. Realtime session opening with zero history turns → "kal kya baat kiya" unanswerable on a call while chat answered it. [rj:call-opens-with-amnesia-by-construction@main]
16. Compiling creator/teacher sheet fields straight into the prompt → 0/41 contained, 2/5 secrets leaked. [rj:ws-r105-no-material-instruction-boundary-in-the-compiler@vb]
17. Wrapping safety boundary and stage fields inside the "data, not instruction" block → would demote enforced safety to inert data. [rj:ws-r111-boundary-and-stage-fields-not-material-blocked@vb]
18. Appending a language policy to the prompt → passed 13 structural, 39 taste and 329 leak checks, yet real outputs drifted language, corrupted identifiers (PINE-63 → pne-63) and invented rules. [rj:append-language-policy-does-not-repair-expert-reply-20260907@h206]
19. A saved learner language preference while the persona's language default stays in the prompt → the corrected-Hindi reply came back entirely English (live trial actual213). [measurements: semantic213@h206]
20. A saved teaching refinement (explanationOrder) treated as adaptation → 0/2 corrected outputs followed it. [rj:saved-refinement-does-not-prove-adaptation-20260907@h206]
21. A lean prompt to stop invention → a Hindi duration hallucination remained and delivery dropped bullets. [rj:lean-prompt-does-not-fix-facts-or-delivery-loss-20260907@h206]
22. Appending owner corrections to the system prompt (prompt accretion) → contradictions and arbitrary text becoming privileged instructions; replaced by typed preference events. [docs/CALIBRATION.md@vc]
23. Auto-filling teacher verbalisms from mined lecture frequency → top hits were "squared", "equals": the recited prompt with a pipeline in front. [decisions.md#gurukul-ws3-landed@vy]
24. Few-shot example turns, fine-tuning or activation steering for persona consistency → phrase bank; resets per base model; needs white-box access. [docs/research/identity.md §4@meera@AR]
25. Deliberate typos for liveness → a typo in a technical term is a teaching error. [timeline@ai2b@main]
26. Companion traits in a tutor (affection emoji, face, backstory, openers, re-engagement, reactions on work) → inverted for minors; a tick on work is a verdict with no words. [graph boundary.saathi-is-not-a-person@ai2b]
27. A `tu` register reachable at depth → peer register, "a friend impersonating a teacher". [timeline@ai2b@main]
28. Thinking budget inside the answer envelope → 3/5 replies were MAX_TOKENS fragments served as success. [measurements L566@ai2b@main]
29. Trimming an over-length memory candidate → "a truncated sentence still recites"; candidates now fail. [ai2b@main]
30. Self-layer spec drop priorities written as proposed → direction inverted: new low-value blocks most protected, recall dropped first. [vyakti-product@36ca669]
31. Citing byte-identity as a persona-content guard → both sides read the same persona file, so it cannot detect persona edits. [vyakti-product@b1aca68]
32. Context Capsule budgets with no mandatory block → a crisis-line block can be dropped under budget pressure (verifier finding). [packages/context-capsule@vg@T]

### 3.2 Safety, honesty and privacy
33. Safety, honesty or privacy enforced by prompt instruction → leaked 57.1% naturalistic / 98.1% adversarial; an SQL predicate leaked 0 of 31,122 (n=494 scenarios, 2026-08-18). [measurements.md#gate0-structural@main]
34. A well-written honesty bullet ("never a detail they could act on") 38.6% through the brief → she invented an email and claimed a resume arrived (1/8 receipt family). [rj:honesty-by-instruction@main]
35. Asking the model to withhold the answer → leaked; the answer is never put in TAIL and code predicates back it. [prompt.ts, output-gate.ts@ai2b@main]
36. A greedy dash-stripping regex → deleted the hyphens in crisis helpline 1800-599-0019, and nothing failed. [decisions.md#dash-predicate-text-only@main]
37. Silent prompt truncation → ate the end of the prompt, where the crisis helplines sat. [CLAUDE.md, check-prompt-budget@main]
38. A distress tier with no helpline in product copy → strategy-audit finding; helplines moved to copy keyed on the learner's words. [copy.ts@ai2b@main]
39. `unverified -> adult` gates by owner decision → fatal for children; every Taxila learner must resolve to minor. [src/engine/clock.ts L55-61@main/@vy]
40. Persona hardening alone against internals disclosure → raw failures did not drop (22 vs 27/13); only the severe class moved. [measurements.md#internals-harden-after@cmp]
41. A lexicon grader with no severity tiers → graded "refused using his vocabulary" the same as "confessed". [evals/behavioral/grade.mjs@cmp]
42. Fence lexicon terms with guaranteed false positives (haiku, meta, token, version, code) → structural false positives with no coverage worth having. [internalsFence.ts@cmp]
43. `POSSESSIVE_GAP=2`; copula-only-after-the-term; clause split without comma → each matched the most common correct refusal or let a confession through. [internalsFence.ts@cmp]
44. Pronoun-scoped denial detection → fired on "nahi yaar aisa kuch nahi" and teasing; thrown away. [grade.mjs@cmp]
45. Re-drafting a streamed turn, or making every turn unstreamed → a streamed line cannot be un-said; a blanket unstreamed lane trades away latency. [decisions.md#ws-gamefeel-shipped@cmp]
46. Never-rules normalisation that strips `\p{M}`; raw substring matching → Hindi rules never match; "ass" matches "class" (verifier ran both). [api/_never-rules.js@va]
47. Reply lanes calling `gatedReply` without never-rules → for 3 days no owner rule gated any reply while every suite passed. [rj:room-reply-lanes-carried-no-never-rules@vb]
48. Passing raw never-rule DB rows into `gatedReply` → nothing matched and no error. [rj:ws-r101@vb]
49. Surface adapter returning the model's raw string → no honesty gate, no protocol extraction, markers sent as text. [rj:surface-bypasses-parse@main]
50. "She can judge what is safe to share" → falsifies Petronio boundary rules; measured harm in a couples study. [decisions.md#structural-disclosure@main]
51. A universal-quantifier disclosure clause over cited episodes → failed open for uncited rows (vacuous truth). [api/_disclosure.js clause 2b@mm]
52. A group id as an ACL; a mutable 45-minute episode extended with late joiners → history leaked across audiences; today's members heard yesterday. [GROUPAI-READINESS-20260929@mm]
53. Ordinary messages after withdrawal treated as renewed consent → withdrawal revived. [rj:groupai20260929-no-private-group-equivalence@mm]
54. Consent inferred from group membership, model judgement or another participant → coerced consent. [journal/2026-08-31-shadow-pilot.md@vg@T]
55. A store-time PII scrub as adequate → spaced Aadhaar, spaced mobile, +91 and Devanagari digits pass through (verifier ran it). [api/_mirrorcall.js@gp]
56. Pooled free-tier Gemini keys carrying minors' notebook photos → terms allow training use and human review; replaced by a paid-lane assertion. [D-068@ai2b]
57. Parsing EXIF to strip it → being wrong once ships GPS; canvas re-encode instead. [ai2b@main]
58. A per-utterance spoken "AI-generated voice replica" disclosure → unblinds every listening test; wrong cadence for a tutor (disclose once per session and in UI). [rj:disclosure-announces-the-clone@gp]
59. Accepting client-authored text for synthesised speech → arbitrary text in a voice; replaced by speech bound to a server-issued reply id. [docs/REPLICA-DIALOGUE.md@vc]
60. Sending the visible browser transcript back as history; reusing older consent rows → client text becomes trusted history; one-question attestation broadened later. [rj:wave25-private-followup-cannot-trust-client-history@vy]
61. Face liveness, Document Intelligence or averaged weak biometric signals → never for minors; speaker recognition is not liveness; weak signals are never averaged into a pass. [docs/REPLICA-LIVENESS.md, REPLICA-IDENTITY.md@vc]
62. `requireAuthHeader` that checks only the `Bearer ` prefix → a leaked anon key passes; false assurance. [hihi supabase/functions/_shared/http.ts@echo]
63. Agents redacting keys while quoting env/config → the keyring and a paid key were each printed once into session transcripts. [decisions.md#session-2026-08-25b-close@cmp]
64. Secrets in query strings; HMAC cookie keyed by a shared password; `startsWith('localhost')` bypass → leak into logs; offline brute force; `localhost.evil.com`. [docs/project-review-2026-07-23.md@cc@rev]
65. MVP RLS `allow_all` + relying on host protection → ~40 tables anon-readable including a VAPID private key; 7.4 MB unauthenticated. [20260714_lockdown_rls_anon.sql@cc@main]

### 3.3 Memory and relational state
66. UPDATE-only writers for `rel_state` → 0 rows for all 40 users; renderers invisible. [rj:relstate-zero-rows@main]
67. Correct writers with no caller; a complete runner nobody runs → tables at 0 rows, enums never produced, every gate green; an upload sat queued while the UI animated progress. [rj:dead-writers@main; rj:a-runner-nobody-runs@gp]
68. Cron workflows on a non-default branch → GitHub schedules only from the default branch; scheduled runs all-time 0; derived layer empty in production. [vyakti-product@a084edd; measurements.md#never-scheduled@main]
69. A sweep that ran one step of six with dry-run defaulting true → every derived block empty while reports showed progress. [rj:spine-that-ran-one-step-of-six@main]
70. A `--dry-run` flag that still called the LLM → a "safe" dry run spent the shared daily budget. [rj:dryrun-still-spends@main]
71. A rupture closed only by the user's repair signal → a permanent grudge capping the stage. [rj:rupture-never-closes@main]
72. A warm-episode count without finalized/dyadic/current predicates → rupture lapsed ~2x early; reader and writer disagreed. [rj:warm-count-unscoped@main]
73. A self bundle with a reader and no producer; consume-once cache via return value; hand-set `sourceStatus: wired` → T11-T13 rendered 0 bytes everywhere with byte-identity and budget gates green. [rj:selfbundle-never-set, #selfbundle-return-value, #manifest-sourcestatus@main]
74. Storing the present-tense activity state as memory → she denied finished games and invented moves. [rj:episode-of-the-present-tense@main]
75. Embedding-first retrieval / HNSW; LoCoMo as the target → post-filtered ANN starves small tenants; LoCoMo has 6.4% key error and its judge accepts 62.81% vague answers. [decisions.md#memory-field-survey@main]
76. Lexical overlap as the confabulation tripwire → would retract correct Hinglish paraphrase. [docs/SPEC.md §0.3@main]
77. Lexical retrieval across Roman and Devanagari → Roman queries miss Devanagari facts; empty queries fall back to unrelated facts. [rj:lexical-retrieval-does-not-bridge-roman-and-devanagari-20260907@h206]
78. Lexical recall promoted over recency → 27/54 vs 0/54 overall but 0/27 under adversarial distractors (288 distractors chosen). [rj:grouprecall20261001-no-lexical-promotion@mm]
79. Device- or surface-keyed retrieval while identity is person-keyed → 89.2% of recall lost on a surface switch (n=44 questions, offline). [measurements.md#surface-switch-recall@vy]
80. FK join tables + deferred triggers for citations; synthetic legacy citations → do not execute on Neon HTTP; decorative citations on the rows most likely wrong. [docs/SPEC.md §0.2-0.3@main]
81. A pre-call flush awaiting extraction → a ~400 ms race that expired on nearly every call. [decisions.md#chat-tail-over-flush@main]
82. Soft delete with `deleted_at`; forgetting after the reply → the extractor re-reads the turns on screen ("one turn of forgetting"); a post-response promise on serverless is sometimes not kept. [ai2b@main D-058]
83. A second model call to extract memory; model inference as a memory source → doubles cost and adds a fabrication surface; "a guide that records what it concluded about someone has become a reviewer". [ai2b@main]
84. Storing affect in learner memory → an unreviewed durable judgement that cannot be shown honestly (D-057). [registry.json D-057@ai2b]
85. Hot-path weight training, silent memory writes from ASR, durable emotion profiles, one omniscient profile → ASR errors became permanent; scope leaked; momentary expression stored as a trait. [rj:hot-path-training-and-durable-emotion-profiles@h206]
86. Putting public answers into a learner's memory → authorised fabricated shared-past statements. [rj:public-knowledge-is-not-shared-past-20260907@h206]
87. Deriving avoid-topics from the forget table → would resurrect the deleted term as an avoid topic. [decisions.md#self-layer@main]
88. New AppState fields without forget coverage → after "forget me" she offered to resume the chess game. [rj:activity-forgot-the-teardown@main]
89. `slice(-500)` over a merge union; cross-tab sync adopting the newer blob wholesale → deleted the front of history; lost game and theme fields. [rj:merge-scythe, #last-message-wins-cross-tab@main]
90. A consolidation lease keyed by person only; scoping only derived tables by agent → one agent's lease hid another's work; a second agent could read the first's raw memory. [db/migrations/018_raw_agent_isolation.sql@vc]
91. Merging `@main` into voice-cloning without re-running the isolation gate → two unscoped reads reintroduced; raw-isolation 47/47 → 1/47 failing. [harvest run 2026-10-02@vc]
92. Promoting a single photo vision description to a content fact → a cheap guess sits cited and uncorrected forever (vision fabrication 10-11%). [docs/PHOTOS.md@meera@AR]
93. The Honcho dependency, its scopes as ACLs and its benchmarks as product quality → derived conclusions survive deletion; AGPL core; vendor-reported numbers. [rj:honcho20260929@mm]

### 3.4 Pedagogy and assessment
94. Recall checks with the rules printed above the question → 139/139 had the answer on screen. [docs/learning/checks.md@ai2b@main]
95. Distractors that are merely false, or borrowed from other lessons → teach nothing; learners eliminated by register; 99% borrowed (fixed to 0). [checks.md@ai2b@main]
96. An exact-equality ban on borrowed distractors; a literal list of retired stems → paraphrases passed; 13/13 reworded stems passed. [timeline Round 15@ai2b]
97. A transfer answer equal to the concept bullet → tests reading, not skill (49/58). [ai2b@main]
98. Printing the module description above an unanswered public check → 54% EN / 45% HI of lessons showed half the answer. [timeline Round 16@ai2b]
99. Rubric criteria authored separately from lessons → a criterion the learner never saw is a trap; two copies drift. [quest-rubrics.ts@ai2b@main]
100. A synthetic calibration set to close a human gate; an agent hand-writing 210 Hindi anchor sentences → passes every check and proves nothing; the weakest Hindi in the product. [calibration.ts, quest-rubrics.ts@ai2b@main]
101. A model score on a learner record (auto-grading) → non-native phrasing costs −1.35/−0.90 points (arXiv 2603.18765), κ≈0.58 with humans. Triage only. [ai2b@main]
102. AI-authored questions with model-written answer keys for v1 → a wrong key is far worse than an illegal chess move. [gurukul.md §0.10]
103. A lexical recall scorer as a comprehension detector → rewards echoing the passage and penalises a child's own words (verifier). [api/_recall-run.js@vb]
104. A milestone derived from the live catalog; hardcoded counts → would revoke a milestone when the catalog grew; counts became false claims. [D-053, R-023@ai2b]
105. Lowering difficulty mid-game; a fixed-level opponent; uniform random variety; position-seeded variety → reads as pity; same opponent; "alien" openings; same opening every game. [src/engine/chess/{adapt,opponent}.ts@cmp]
106. Gamification: speed bonuses, XP for streak length, XP for asking doubts, notification re-engagement, leagues → punishes careful checking; loss anxiety; pollutes the doubt loop; manufactured urgency for minors. [student-app-spec.md §2.4-2.6@vy]
107. Silence-triggered idle nudge → an unpredictable reward on the cue of not replying; cannot be honest; removed permanently. [persona.ts:499@main]
108. Treating "samajh nahi" as a hint request → a child asking about a word was told to re-read; glossary-first now runs ahead. [ai2b@main]
109. An option-letter regex `[abc]\b` under `/i` → matched the article "a" and discarded 27% of feedback replies. [timeline Round 18@ai2b]
110. Client-asserted `*_aligned` booleans → the record was a client claim; the server recomputes. [ai2b@main]
111. A passive Socratic tutor that waits to be asked (Khanmigo RCT) → used in 17% of mistake sessions; ITT 0.06-0.08 SD/year. (T) [rj:rj-passive-tutor@Taxila]
112. Mining every uploaded file as the owner's own words → the majority speaker is often someone else; textbooks mine as false evidence. [rj:mine-everything-you-are-handed@vy]

### 3.5 Realtime voice
113. Backchannel ("hmm/haan") while the user speaks → protecting it needs a mic hold that ends the user's turn; unprotected it fills pauses and slows the endpointer; a prompted backchannel is cancelled by VAD. [rj:backchannel@main]
114. Synthesised listening "mm"; lexical ack clips ("Haan", "Acha") → not her timbre; isolated words come out in citation form. [rj:murmur-timbre@main; ACK_PHRASES@main]
115. Bracketed direction inside a TTS payload ([laughs softly]) → spoken as laughter plus the word "Softly". [rj:ack-bracket-direction@main]
116. Reasoning models on live replies; beat-routing → heavy beats −81%, mirroring 10-29%, helplines over-triggered 16.7%, +3.3-4.6 s; routing must classify before generating, so a miss puts reasoning on the crisis turn. [decisions.md#reasoning-live@main]
117. Shortening `silenceDurationMs`; tuning start-of-speech sensitivity; `NO_INTERRUPTION`; `TURN_INCLUDES_ALL_INPUT`; affective dialog → 150/300/500 ms within 50 ms; LOW=HIGH; ~16 s deafness; ASR invents Hindi from noise; socket closed 1007. [liveCall.ts setup block@main]
118. Enabling thinking; the `-latest` alias; dropping `hi-IN` → seconds of dead air; 3-5.5 s; no prosody gain. [liveCall.ts, live-token.js@main]
119. A minimum-based noise floor; a LISTEN clamp at 0.04; raising FLOOR_MAX → tracks the interferer's dips; gate never closed; deaf. [liveCall.ts FLOOR block@main]
120. Echo coefficient learning upward on mic level; chunk-wide RMS as her level; a fixed envelope ring → positive feedback; self-interruption every session at −12 dB; ring fell off a 5 s-ahead downlink. [liveCall.ts@main]
121. Buffering silence ahead of a barge candidate; dropping speech under congestion; refusing frames at ~185 ms backlog → onset late 76→600 ms; syllables eaten or 45 s stale replay; blind mid-share. [liveCall.ts@main]
122. Rotating immediately on goAway; reading `timeLeft` as ms; adopting a new model mid-call → guillotine mid-word; a 1000x unit error; the voice family changed. [rj:goaway-immediate-rotate, #duration-is-seconds@main]
123. Speaker identification for a second person → a 95% gate makes the owner's floor 95% reliable. [rj:speaker-id@main]
124. Swapping the live model on headline latency (2.5 native-audio) → rejects video and misses the 600 ms barge signal. [rj:live-model-swap@main]
125. gpt-realtime-2.1-mini as the voice → 41-53 words/turn (14 s monologues), voices 137-192 Hz, no continuous frame channel; re-tested with a teacher prompt: still 38 words. (T) [rj:realtime-azure@main; rj:meera-realtime-azure@Taxila]
126. A pre-line before a move; past-tense-only notes; waiting for her silence to poke a note → ordering cannot be guaranteed; the model deliberated over a move already made; notes fragmented stories. [rj:pre-line-before-the-move, #past-tense-is-not-enough, #the-poke-that-waited-for-her-breath@main]
127. Six-clause activity facts; slicing the activity block at 420 B → commentator tone; the sliced block cut the most important fact. [rj:chess-facts-as-a-scoresheet, #activity-block-sliced-mid-word@main]
128. Evidence-only patience (wait only when a follow-up signal exists) → complete-looking sentences got the 1,300 ms default and she cut him off. [rj:evidence-only-patience@main]
129. NON_BLOCKING tool calls and search grounding inside the live session → unsupported; grounding closed 1011 quota 3/3. [liveLookup.ts@main]
130. Auto-sending an ASR transcript; a silent `webkitSpeechRecognition` fallback → at 32-52% CER on Hinglish the guide answers a different question confidently; an unlabelled bad lane is worse than none. [D-059, D-060@ai2b]
131. Live voice with no byte-identical CORE on the realtime lane → twice dropped rules the text lane keeps (D-061; reversal condition for Taxila). [registry.json D-061@ai2b]
132. Awaiting microphone permission before rendering the call session → the page stayed on "Opening" after an HTTP 201. [rj:mirror-call-session-cannot-wait-behind-microphone-permission@h206]
133. Recorder and recogniser as two microphone consumers; finalising capture on one completion signal → the second opener gets silence; truncated transcript or zero-byte file. [hihi@echo README]

### 3.6 TTS, voice choice and cloning
134. Choosing a voice on measured axes (Azure TTS coral) → won 15/15 Hindi words, 255 ms first audio, 5x cheaper, and lost by ear: "not human, not Indian". [rj:azure-tts@main]
135. A pitch anchor (266 Hz) as a screening filter → the shipped voice measured 212-214 Hz; the filter rejected candidates on an anchor the incumbent fails. [decisions.md#speech-stack@main]
136. A transliteration front end for code-mixed Hindi TTS → no text stage on speech-to-speech; ~90% accuracy; silent corruption path. [decisions.md#speech-stack@main]
137. Synthesising each Hindi/English token run separately and joining with 60 ms → every switch reset prosody; 3.36x longer, 65.47% near-silence, ECAPA 0.434 vs one-pass 0.825. [rj:per-token-voice-fanout-and-flat-identity-anchor@h206]
138. Rejecting text with more than 16 language switches → rejected natural Hinglish deterministically. [rj:per-token-switch-budget@h206]
139. Clip caches keyed without voice identity; choosing the vendor per phrase; user keys overriding the voice → the old voice replayed; two voices in one reply. [rj:cache-outlives-the-voice, #engine-per-phrase@main]
140. A fixed 1.4 s TTS fuse; a global cooldown consulted mid-walk → total speech outage on a slow night (first frame 9.7-11.3 s, n=3); fallback keys skipped. [rj:fixed-fuse-on-a-variable-upstream@main]
141. Folding 5xx into deterministic aborts → a single 502 aborted a 9-key pool. [rj:isquota-only-folding@main]
142. `stream:true` on the OpenRouter TTS lane → accepted and does nothing. [rj:openrouter-streaming@main]
143. Roleplay-action regex `\*[^*\n]{1,80}\*`; `phrase()` splitting at every full stop → deleted emphasised words; "3.30" spoken as "three. thirty". [rj:bold-eats-words@main]
144. Ranking spoken-symbol suspects by how conspicuous they look → espeak reads arrows and `**` aloud, the em-dash as a pause. [rj:device-says-arrow-not-dash@main]
145. Stripping every `[square bracket]` as a stage direction; companion dash cleanup and bullet filters on teaching text → four display equations became bare backslashes with the gate reporting clean; `R-X` became `R X`; real Hindi teaching content deleted. [rj:expert-math-is-not-stage-direction29, #companion-bullet-filter-discarded-expert-evidence-20260907@h206]
146. Relying on KaTeX `trust:false` alone → refused commands consumed their arguments and silently lost content. [rj:expert-math-ui-refusal-content-loss@h206]
147. Graceful fallback to a different voice → for identity products "a wrong human voice is a failed generation". Taxila: one voice per tutor; fail visibly, not into a different person. [docs/REPLICA-RUNTIME.md@vc]
148. Accumulating more audio into a voice reference; "more upload hours make a stronger clone" → the model conditions on one ~10 s reference; a 109-minute lecture still sounded wrong. [rj:mirror-reference-accumulation-was-inert@gp; rj:long-audio-duration-is-not-the-conditioning-unit@h206]
149. 16 kHz separation on every recording; the scoring buffer delivered as the reference → erased the 8-12 kHz identity band; the owner's "not even 0.05% similar". [reference-window.js@p204]
150. Claiming voice wins from structural passes, an orthography table, a higher ECAPA or vendor tables → none listens; ears disagreed with embeddings repeatedly. [rj:structural-code-switch-passes-cannot-certify-perceptual-voice-quality@h206]
151. Averaging human ratings with an embedding score into one "sounds like you" number → a second unvalidated scorer. [rj:ws-r179@pv]
152. Training a speech foundation model on the grant; Professional Custom Neural Voice → hundreds of thousands of hours needed; managed training plus hosting can exceed the whole grant. [REPLICA-FRONTIER-2026.md, AZURE-FOUNDRY-PLAN.md@vc]
153. Sarvam as a cloning arm from marketing copy; Sarvam as the only live ASR → the API has ~40 preset speakers; an HTTP 402 dropped a call window. Also barred by Azure-only. [rj:ws-r6-sarvam-cloning-from-the-marketing-page@va; rj:sarvam-http-402@h206]

### 3.7 Vision and multimodal
154. gpt-5.6-luna/terra for vision; terra as a cost saving → read part of a thread and asserted the rest; 1.14x cheaper, not 8x. [rj:Model candidates evaluated and dropped@main]
155. Faster frame cadence, lower hold floor, looser wake dedupe → 0 ms gain on 18/18 stops, +21% spend; the duplicates were identical screens. [rj:frame-cadence, #hold-scroll-floor, #wake-dedupe@main]
156. A lexical activity classifier → refused: vision fabrication with a keyword list. [rj:activitybreaks-as-classifier@main]
157. A vision directive binding "say something" to "know what this is" → NO_COMMENT on 15/16 frames. [persona.ts:555-585@meera@AR]
158. Image dimensions or regions as understanding; one correction as a learning cycle → geometry is not meaning; one correction cannot meet a 12-session gate. [rj:multimodal20260927-no-single-correction-learning-claim@mm]

### 3.8 Models and judges
159. A byte-identical prompt on a different model → grok lost 38-2 and ran 36.1 vs 20.5 words/turn; luna tied but switched off media 0/84 and turned the crisis beat clinical. Re-measure a character on every model change. [measurements.md#charm-grok, #charm-luna@main]
160. LLM judges for felt-quality gates at a 0.80 bar → all 8 families failed; the trusted judge self-agrees 77.1% [67.7, 84.4]. [decisions.md#judge-bar-vs-ceiling@cmp]
161. Quoting a judge agreement from a run with a 120-token cap → 125/192 replies were empty; the honest re-run gave 69.2% (fail); survivor bias 37.3 pp. [rj:parse-survivor-bias@cmp]
162. DeepSeek-V4-Flash; gpt-4.1-mini as the tutor lane → 58-71% lane failures and a fabricated image description; question share 75-87% at 2.2x cost. [measurements.md@ai2b@main]
163. An Indic-specialist model for Hinglish register; open-weight models; Claude on Azure credits → register is training mix, not "being Indic"; register defection 63-99.8%; the card was billed instead of credits. (T for Claude) [docs/research/identity.md §1@meera@AR; rj:claude-on-foundry-credits@Taxila]
164. Krutrim → halted model work in May 2026. [ai2b@main]
165. Explicit `cache_control` on Google's endpoint credited with 85% → a measured no-op (n=4). [rj:cache-control-on-google@cmp]
166. A code comment asserting "~9x cheaper, ~90% cache hit" → never measured. Inflating CORE to reach a cache floor → dilutes the slots. [graph boundary.core-cache-discount-unmeasured@ai2b]

### 3.9 Infra, Azure, cost and operations
167. Research and production sharing one key or one daily pool → evals drained it; production chat 502'd; the voice changed mid-call. [measurements.md#one-key-two-jobs, #both-lanes-dry@main]
168. An in-process spend ledger; retry ladders on a billed key; budget alerts as the spend control → a cap per lambda instance; "how a budget becomes a bill"; alerts are not hard controls. [ai2b@main; PROVIDER-BUDGET.md@vc]
169. Treating an ambiguous provider outcome as free and retrying → double spend; becomes `reconcile_required`. [PROVIDER-BUDGET.md@vc]
170. A text reply that called the generator directly → bypassed the shared ledger (`not_metered`). [rj:wave25-first-reply-bypassed-shared-budget@vy]
171. Writing paid outputs after an accounting readback → a wrong column (42703) lost already-paid outputs. [rj:accounting-readback-must-not-discard-paid-output-20260906@h206]
172. A browser retry or reload treated as permission for another paid generation → 6 different WAV hashes for one text and seed. [rj:browser-retry-is-not-permission@h206]
173. Signing a request, then letting it wake a scale-to-zero service; a broker forwarding the original signature → 60 s skew < 176 s cold start, guaranteed 401. [rj:hmac-skew-shorter-than-cold-start@gp]
174. Cold-runtime wakes settled as failed generations; per-process warming memory as readiness; fixed milestone percentages → 45/58 false failures taught the owner to retry; runtime ready 383.8 s while processes said warming; progress stuck at 33-38%. [rj:cold-gpu-attempts-cannot-be-model-failures, #per-process-warming-memory@h206]
175. A readiness-only probe; the ACA HTTP startup probe as the only gate; a CUDA base image on a CPU service → restart loops; a healthy app stayed not-ready; 9.7 GB image. [gurukul.md §5.2; rj:gpu-http-startup-probe@h206]
176. A green build and green healthz as proof the model runs → `torch.compile` shelled out to `g++` on first call; every request 503. [rj:a-green-build-and-a-green-healthz-can-both-lie@gp]
177. A graceful malware-scan adapter when no scanner is deployed → degrades into claiming a file is clean. [rj:a-scan-we-did-not-run-must-never-say-clean@gp]
178. One flat per-minute voice price → warm ~1 cent/30 s vs cold 23-35 cents vs always-warm hundreds/month. [rj:one-flat-voice-price@h206]
179. Studio CSP `connect-src 'self'` with no `media-src` → uploads refused after a 201; blob playback 0:00; Vite fixtures served no production headers so tests stayed green. [rj:wave26-self-only-csp-killed-upload@pv]
180. Vercel cron on Preview; a cron step of 24 hours; a job-level `if: secrets` → Preview never consolidated; deploy refused; 15 zero-job runs over 9 days. [rj:wave25-preview-cron-only-memory@pv; rj:startup-failure-is-invisible@main]
181. Vercel CLI inferring the project from the directory name; deploying from a local CLI build → deployed to a stale project while the probe passed; production source had no commit. [rj:ci-deploy-unpinned-project@main; vw@7e9861b]
182. Sponsored quota id, a USD 1 app cap or cost alerts as no-charge proof → spending limits Off, LimitRemoved. [rj:sponsored-quota-is-not-no-charge-proof-20260929@vy]
183. A 33-character Container Apps Job name; the shared npm cache → Azure 400; `ECOMPROMISED` before deployment. [rj:interrupted-activation-closeout-lessons-20260930, #shared-npm-cache@vy]
184. Placing Azure Speech in South India; trusting one overview page's limits; batch transcription with URLs → no Speech in southindia; docs disagree (enforce 250 MB / 2 h); URLs disclose storage. [docs/REPLICA-PROCESSING.md@vc]
185. Rejecting a whole Azure fast-transcription response when any phrase has zero duration → 3 paid, complete calls rejected; UI stuck at 38%. [rj:an-empty-azure-sentinel-is-not-a-failed-transcription@h206]
186. Buffering a 250 MiB source in heap; raising the upload cap alone; trusting browser `File.type` → 64 MiB limits; ClamAV stream ceiling; video/mpeg stored for an MP3. [rj:large-private-audio-cannot-be-buffered@h206; rj:raw-browser-file-type@gp]
187. A persistent VM per student → ~$0.50-20/student-month for no capability. (T) [rj:vm-per-student@Taxila]
188. Mock-friendly fallbacks for every provider → the demo always "completes"; a pass says nothing. [naukri final-deep-audit.md]
189. Background agents for long jobs; raw SMTP from cloud sessions → processes reaped; egress blocked. [SESSION-LOG@cc@main]
190. A daily agent writing each run to its own unmerged branch → 29/29 runs had no memory of the last. [routine_carbonsettle_intel]

### 3.10 Database and SQL (Neon)
191. Widening a primary key with a column DEFAULT as mitigation → ten ON CONFLICT sites lost their arbiter, seven inside `.catch()` swallows. [rj:pk-is-an-arbiter@main]
192. Validating inserts by re-reading inside the same data-modifying CTE → inserted rows invisible; zero evidence ever committed. [rj:data-modifying-ctes-cannot-see-each-other@gp]
193. Updating the same row in a second CTE → Postgres forbids it. [rj:ws-r125@vb]
194. An unqualified parameter colliding with a column name → revoked grant looked current at commit (twice). [fail-20260830-consent-revalidation-time-shadowing@vg@T]
195. Neon-CLI-created roles as app roles → inherit BYPASSRLS; RLS silently void. [dec-20260830-neon-app-roles-created-by-sql@vg@T]
196. A temporary RLS write policy `FOR UPDATE` only → rows invisible, 0-row update, success counter lied. [SESSION-LOG 2026-07-18@cc@main]
197. A DB CHECK enum out of sync with the code enum → 5 of 14 intents violated CHECK and retried forever. [deep-audit H3@cc@main]
198. Fake databases that pass what Postgres refuses → `min(uuid)` does not exist; a non-existent column; `text[]` vs `uuid[]`; a fake db reimplementing the fix passed 10/10 with the fix reverted. Apply live and EXPLAIN every statement. [rj:ws-r35-min-uuid@va; rj:ws-r140-fake-db-reimplemented-the-fix@vb]
199. Parallel agents choosing migration numbers; a hand-written SQL splitter → collisions; failed on dollar-quoted bodies. [timeline@ai2b; db/migrations@vc]
200. `tableApplied` caching `false` forever (including on DB error) → a warm instance treats a new table as absent until restart. [api/memory.js L3260@va]
201. Unpaginated PostgREST stats → silent 1,000-row truncation; ~8 dashboards wrong. [deep-audit H12@cc@main]
202. Backticks in SQL comments inside JS template literals → terminated the literal at least 7 times. [rj:ws-r130@vb]
203. JSONB null as SQL NULL; sparse JS arrays → valid proposal rejected; a sparse length-3 audience with 2 ids opened a unanimity gate. [vg@T fail nodes]

### 3.11 Evals, gates and verification
204. Gates living in a scratchpad and verifying a frozen persona snapshot; evals never wired into CI → green results about months-old bytes; every push bypassed the safety floor. [rj:gates-that-live-nowhere@main]
205. Proving a gate by silence; a subset check that reports a count; tautological negative controls → passes when the feature is deleted; three bugs all toward passing; cannot fail. [rj:sound-gate-proved-by-silence, #subset-check-is-green-by-construction@main; vg@T]
206. Reading a gate verdict from the tail of a pipe (`| tail` inside `&&`) → a red tree was committed and pushed. [rj:evidence-only-patience@main]
207. Counting skipped checks or a missing browser as pass → the release gate passed without running. [rj:performance-skip-zero-was-not-a-valid-release-pass-20260907@h206]
208. A new eval suite left unregistered → "ok eval suite" while it never ran. [rj:ws-r98-unregistered-eval-suite-passes-silently@vb]
209. Live clock and date inside byte-identity and size gates → minute-tick flakes; a cap already exceeded at the calendar peak (30,190 vs 30,000). [rj:live-clock-in-a-byte-identity-gate, #calendar-lottery-ceiling@main]
210. A guard nobody invokes (staleness check) → the room path would ship a different persona than the tested tree. [rj:engine-bundle-check-uncalled@main]
211. Comparing a fully-judged arm with a partially-judged one; row count as diversity → a "flat" read was an artifact (6.8%→12.0%); 288 rows were 72 distinct texts. [rj@main 2026-08-15]
212. Any judged fabrication claim at n<300 → identical input spread 13.6 pp (one cell 50%→92%). [measurements.md#fab-noise-floor@main]
213. A relative improvement over an invisible baseline → a 1.65x delta, and "I see no sky" on a phone. [rj:measured-but-not-felt@main]
214. Tuning weights after seeing held-out answers → invalidates held-out claims; preregister and freeze by hash. [rj:grouprecall20261001-no-posthoc@mm]
215. Squash-merging a branch and logging its measurements → the merge carried 1 of 40 files and the guarding test was lost too. Verify merges by content. [ai2bharat-rounds 6986880]
216. An `except ImportError` around a verification step; determinism mistaken for correctness; citing CI that never ran → silently skipped; one seed's reproduction proved nothing. [hihi prime-sum SESSION-LOG]
217. Green CI and owner-pinned samples as product completion → the owner on a phone could not upload. [rj:wave26-green-gates-and-owner-pinned-sample-are-not-product-completion@pv]
218. A released software gate or the number of agents as provider/listening/quality proof → 24 passing gates established nothing about real SQL, transcription or usefulness. [rj:release-pass-does-not-certify-provider-or-listening-20260907@h206]
219. `tsc --noEmit` on a project-reference solution → passed falsely; use `tsc -b --force`. `vite build` alone exits 0 with type errors. [rj:wave25-noemit-solution-root-false-confidence@pv; CLAUDE.md@main]
220. Logging prose without graph index nodes; resolving append-only context merges by concatenation → 16 entries unfindable while `--check` passed; measurements.md doubled with 214 duplicate headings. [rj:logged-but-unindexed@main; rj:context-union-by-concatenation@va]

### 3.12 Multi-agent build process
221. Seven agents sharing one working tree → one `git reset --hard` wiped others' edits. [rj:shared-tree-concurrency@main]
222. Ten parallel agents at once → exhausted the session limit before any finished; rule: five max, hourly WIP commits. [rj:ten-parallel-agents-exhausted-the-session-limit@pv]
223. `git stash` in a worktree; `pkill -f` on a shared machine; two release gates on one machine; `git add -A` while others edit → shared stash applied another agent's WIP; killed a sibling's gate; port clash read as regression; half-written source committed. [rj:ws-r21@va; rj:ws-r98@vb; vyakti-product@27c92f7]
224. Applying a preserved patch wholesale onto a newer tree → predated a forget requeue, so forgotten content could return. [rj:wave25-r182@pv]
225. Heavy coordination, source freezing and bookkeeping before any real signed-in journey → neither primary outcome was verified despite release numbering past 200. [docs/handoff/2026-09-09/NEXT-AGENT.md@h206]
226. Merging parallel agent shards without one written ruler; agents quoting search snippets as evidence; trusting pre-labelled tags → 6x disagreement; evidence from `<head>` chrome; 4 of 56 genuine. [SESSION-LOG 2026-07-17@cc@main]

### 3.13 UX and design
227. "Cut text, fewer boxes" followed literally; a redesign shipped without rendering it; a patch-only redesign → deleted all motion; founder rejected it; owner rejected it despite fixtures. [ai2b commit 69f4a31; cc AGENT-CONTEXT §2; rj:patch-only-redesign-20260927@vy]
228. Judging contrast by eye in one theme; a gradient-only or ink-over-sky-only contrast gate; testing a clock-driven theme only at night → a 1.82:1 primary action survived; text failed inside its own panel; 4.35:1 appeared only after 06:00 IST. [R-022@ai2b; commits 9173ee1, c5c4e6b@meera@AR; rj:accessibility-gate-never-saw-a-day-sky@vb]
229. `onPointerDown`-only controls; hover-only affordances on touch; a native `<input type=time>` → 18 controls unreachable by keyboard; invisible on touch; ate Tab stops. [rj:ws-r50@va; cc commits; rj:ws-r131@vb]
230. A disabled CTA at 62% opacity; proximity snap on a tab rail; a spinning 112 px ring; root-level `scroll-snap` → legible and untappable; cancelled programmatic scroll; horizontal page scroll; snapping on every route. [ai2b timeline]
231. Typing-indicator ticks; a receive cue per bubble; call-connect tones → a ticking state nags; 3 cues in 4 s is an alarm; in-call tones corrupt echo. [rj:typing-tick, #receive-per-bubble@main]
232. CSS animation tricks (implicit keyframe end, px/number calc, minifier-eaten tokens, shadow-only lift, negative-z chrome) → invisible marks in 100% of games, a 0.22 ms animation, fake contrast gains. [rj:animation-implicit-end et al.@main]
233. Decorative "scanning" metaphors; green everywhere → read as a policy document; did not explain the next action. [rj:wave25-green-everywhere-and-a-scanning-you-orb@pv]
234. `document.fonts.check` as the Devanagari signal; tofu width-diff alone; viewport-only screenshots → true for a bogus font; flagged real words; missed dialogs below the fold. [rj:ws-r43@va; glyph-probe@vb]
235. resvg for Hindi cards; woff2 into resvg → wrong glyphs and dropped spaces; blank PNG with no error. Use Skia. [rj:ws-r55@vb]
236. Google OAuth inside in-app browsers; logging sign-in success at redirect start → silent 403; a 10-day outage became unmeasurable. [ai2b@main]
237. UI reporting success on failure; a page staying on "Opening" behind a permission prompt; raw status strings on screen → users told "done" while nothing was written. [deep-audit H8-H11@cc@main; rj@h206; rj@pv]

### 3.14 Growth and content automation
238. A daily LLM article generator that re-dated slugs and deleted older copies → ~65% of 90-day impressions landed on 404, including the top asset. [docs/blog-automation-fix.md@cs]
239. A fallback that rewrote a priority topic when the pool ran out; raw-title duplicate checks → 31 copies of one article; 139 posts in 38 duplicate groups. [cs@06c4f270, d869bd6c]
240. 4 AI posts/day plus 100 template pages in the sitemap → read as a content farm; 343 pages not indexed. [cs@9f863fb2]
241. Trusting the model to emit clean MDX; brand rules in the system prompt only → 13 live posts rendered raw fences and placeholders; 150 superlatives; 7 invented routes. [cs@555e6f8a]
242. Fabricated ratings, reviews and personas → removed sitewide; an absolute guardrail. Owner requests to fabricate traction or testimonials were declined. [cs@8c9ec969; cc SESSION-LOG]
243. A build-time throw on duplicate titles → broke a production deploy; its silent replacement then caused 404s. [cs@6c077ba9]
244. Dated offer copy; separate pages for the same query; lastmod = deploy time → deadline drift across 66 files; cannibalisation; Google stops trusting lastmod. [cs@3b547933, a784d7bb, b8c83541]
245. Counting link clicks as human engagement → mail-security sandboxes inflated engagement ~3x; phantom leads celebrated. [docs/STATE-2026-08-24.md §2@cc@main]

### 3.15 Product strategy
246. A generic shared chatbot in a room as the product → consumer group-chat AIs were retired in 2026; no trust moat. [dec-20260830-reject-generic-shared-chatbot@vg@T]
247. A wholesale port of the Maya companion → device-UUID identity, default-open consent, unenforced grants, retroactive audiences, prompt position as enforcement. [fail-20260830-wholesale-maya-port@vg@T]
248. Engagement metrics (messages, session length, DAU, streaks) as success → optimises against welfare; AI suggestions cut human authorship ~24%. [fail-20260830-gameable-pilot-telemetry@vg@T]
249. WhatsApp as a first channel for an AI; WhatsApp marketing templates to cold numbers → 2026 terms restrict AI-primary providers; error 131049 silent throttling. [dec-20260830-platform-order@vg@T; cc AGENT-CONTEXT §4]
250. Speech-to-speech for every minute; hour-for-hour realtime replacement of a tutor → ~₹1.16/learner-minute (~9x text); would need ₹10,106-22,653/month. (T) [05-technology.md@ai2b; rj:rj-hour-for-hour-realtime@Taxila]
251. Implicit-addressee inference in groups; fixed speaking cadence → no better than chance (80.9% vs 80.1%); rated excessive by 56.25%. [src/engine/room.ts@mm]
252. Public claims beyond evidence ("any model, same personality"; competitors lack memory) → the program's own swap test measured 38-2; a competitor explicitly claims memory. [docs/PRODUCT_AND_RESEARCH_STANDING.md@vw; rj@h206]

## 4. Measured facts Taxila inherits

Only numbers with n, method and date in the source. Numbers measured on Gemini, grok or adult speakers describe those
systems; they are priors for Taxila, not Taxila results. Source paths are `context/measurements.md#<slug>@<ref>`
unless stated.

### 4.1 Voice latency and quality

| fact | n / method | date | source |
|---|---|---|---|
| Azure gpt-realtime-2.1 (full), teacher prompt: brevity rule appended LAST → median 25 words/turn (max 28), TTFA 980 ms; asked mid-prompt → 64 words. Mini: 38 words with the same structure, a 6.2 s outlier, a hedged misconception. | n=6 child turns/arm/model, WebSocket text-in audio-out, from a US container | 2026-10-02 | `realtime-teacher-bakeoff-2026-10-02@Taxila` |
| Azure gpt-realtime-2.1 audio-in: server_vad 900 ms endpoint +870 ms, commit→first audio 1.31-1.74 s; 600 ms and semantic_vad split a child's mid-thought pause; barge-in cancelled the teacher 7-260 ms after `speech_started` (n=8); cached 128 of ~350 input tokens. | n=1 session/arm, 8 arms, synthetic child voice (gpt-4o-mini-tts) | 2026-10-02 | `realtime-audio-in-2026-10-02@Taxila` |
| gpt-realtime-2.1-mini (Meera prompt): barge-in 6/6 within 600 ms (median 271 ms); vision 5/5, 0 fabricated; first audio 1458-1497 ms; 41 then 53 words/turn; spoken turn median 14.0 s (p90 18.2); voices 137-192 Hz; helpline 1/3. | 9 sessions / 72 turns, byte-identical prompt to incumbent | 2026-08 | `rejected.md#realtime-azure@main` |
| Azure realtime refuses input below 24 kHz; frames only via `conversation.item.create` `input_image`; barge event is `input_audio_buffer.speech_started`. | protocol probes | 2026-08-11 | `#azure-realtime-shape@main` |
| Gemini 3.1 flash live steady median 1370 ms (IQR 231), barge 5/5 at 279 ms; text turn without VAD 720 ms (prefill of ~48k instructions) + ~745 ms audio path; silenceDurationMs 150/300/500 within 50 ms. | 24 turns/arm bake-off of 6 models; n=15 timed turns | 2026-08-11 | `#live-model-bake`, `#live-floor@main` |
| Audio floor after the arbiter: self-duck at −6 dB 91%→14%, leak 6996→1280 ms; distant-TV stops 8/8→2/8. ONSET_DUTY 0.60 holds quiet talker 20/24; 0.70 drops to 15/24 (cliff). Stuck endpoint 0 ms of silence in 32 s without the watchdog, ~700 ms with it. | 8-24 seeds/cell, echosim on real `liveCall.ts` | 2026-08-11..22 | `#audio-floor`, `#bargein-onset-confirm`, `#stuck-endpoint-noise@main` |
| Production barge-in: duck +171 ms, ring release +598 ms, server stop +672 ms (3/3); a 450 ms "haan" untouched 3/3. | n=3/3/2, production | 2026-08 | `src/voice/liveCall.ts@main` header |
| Backchannel during user speech costs +171 ms of silence or voice uplinked; in the gap after the user stops it costs 0. | 8 seeds/cell, echosim exp11 | 2026-08 | `rejected.md#backchannel@main` |
| Azure TTS coral: Hindi words 15/15 vs 11/15, first audio 255 ms vs 4.9-12.7 s, $0.0029 vs $0.0148 per utterance; rejected by ear ("not human, not Indian"). Shipped Gemini voice measured f0 212-214 Hz vs the 266 Hz anchor. | 9 lines x 4 arms + owner listen; 2 runs x 5 lines autocorrelation | 2026-08-11/15 | `rejected.md#azure-tts@main`, `#prosody-baseline-f0-gap@main` |
| Same voice name on the live vs TTS model: pitch −0.32 semitone, spectral tilt +4.4 dB, but within-TTS spread 10.1 dB. Identity is (model, voice, direction). | 3/arm, f0 autocorrelation + DFT | 2026-08-24 | `#live-vs-tts-timbre@main` |
| Romanised-Hinglish TTS round trip: bare "hai" returns as "hi"; "chhod" → "chod" (aspiration loss). | 20 lines, production TTS + STT | 2026-08-22 | `#hinglish-tts-l1@main` |
| TTS first frame degraded 9.7-11.3 s vs 615-1051 ms healthy; a 1400 ms fuse caused a total outage; a two-phase fuse served 200 at ~13 s. | 3 keys degraded, 5 healthy | 2026-08-24 | `#tts-first-frame-degraded@main` |
| Per-sentence clips + buffer-one-ahead: time to first audio 2001.5 → 400.7 ms mean (5.00x). | n=10/arm, twice, real Chromium, **fake 400 ms synthesiser** | 2026-09-13 | `#ws-r156-time-to-first-audio@pv` |
| Code-mixed TTS: token-fragmented Hinglish 25,980 ms, ECAPA 0.434, 65.47% near-silence frames; one-pass 7,720 ms, ECAPA 0.825, 24.58%. Azure short ASR WER 0.652 fragmented vs 0.435 coalesced. | n=1 Hinglish per arm; 3 ASR calls | 2026-08-29/30 | `#owner-current-reference-general-hindi-hinglish-2026-08-29@h206` |
| IndicF5 intelligibility via Azure Speech hi-IN: WER/CER 0.328/0.277; Devanagari 0.205/0.100; mixed-script Hinglish 0.453/0.438; chemical symbols 6/8 wrong; numerals 4/11 wrong. | 6 clips, 174 words, one ASR pass | 2026-08-28 | `#indicf5-objective-intelligibility-azure-speech-2026-08-28@vy` |
| Azure Speech catalogue: 774 voices, 18 hi-IN, 20 en-IN (proves key/endpoint only). | 1 GET | 2026-09-14 | `#wave25-runtime-bindings-and-live-integrity-20260914@pv` |
| Generic multilingual ASR shows 32-52% CER on code-switched Hinglish. | **no n in repo** (cited) | 2026-08-31 | `registry.json D-059@ai2b` |
| Human listening verdicts on any generated voice in the portfolio: **0**. | census of benches | 2026-10-02 | `docs/gurukul/EARBENCH.md@gp`; `VOICE-LISTENING106-RECEIPT.json@h206` |

### 4.2 Persona and prompt engineering

| fact | n / method | date | source |
|---|---|---|---|
| Example quotes recited verbatim 4/5 → 0 after removal; taste rewritten telegraphically: verbatim echo 1/32, defection 0/32. | n=84 quotes; 32 taste turns | 2026-08 | `rejected.md#recited-prompt@main` |
| Identical rule fired 0/8 mid-brief, 0/6 at end of core, 8/8 appended last; 0 false fires on 12 must-not probes. | 8/6/12 probe turns | 2026-08 | `decisions.md#prompt-position@main` |
| Authored taste table with deterministic pull-only retrieval: self-agreement 27%→63% (13/48→30/48); register defects 13/96→0/32; 0 false fires in 60 messages. | 480 live turns, same position asked twice 6-8 turns apart | 2026-08-11 | `#taste-consistency@main` |
| Short structured affect tags mid-tail did not recite: hard leak 0/42 vs 0/42 control (rule of three ≤7.1%/turn). | 84 turns, blind counterbalanced | 2026-08-13 | `#affect-recitation@main` |
| Same prompt on grok-4-20: lost 38-2 (warmth 35-3, personhood 34-4), 36.1 vs 20.5 words/turn, 63% of turns end in a question. | 48 units, 96 judgments, blind both orders, claude-opus-4.8 judge | 2026-08-11 | `#charm-grok@main` |
| gpt-5.6-luna: charm tie 17-18, specificity 25-9 (p=0.009), 0/84 media tags (p=0.029), crisis beat became a clinical script, turns 37% longer. | same battery | 2026-08-11 | `#charm-luna@main` |
| Reasoning helps light beats 74-21 and harms heavy beats 29-3 (−81%); mirror-echo 0-2%→10-29%; helplines in 16.7% of heavy turns vs 0; p50 626/863 ms vs 5,212/4,205 ms. | 164 conversations, 984 turns, 128 judgments, matched pairs | 2026-08-11 | `#reasoning-split@main` |
| GPT-5.6 truncated 3-5% of spoken turns at max_tokens 190 (total-token semantics). gpt-5.6-terra requires `max_completion_tokens`, rejects temperature≠1, returns empty without `reasoning_effort:"none"`. | 984 turns; 384 judge calls | 2026-08-11/15 | `#reasoning-split`, `#judge-backtest@main` |
| Saathi question share 67.8% → 41.5/44.7% (bounded slot) → 23.2/25.8% (scoped question-trim gate); gpt-4.1-mini 86.9% → 50.3%. | n=320 per run, register battery, Azure Foundry v1 | 2026-09-01..13 | `measurements.md@ai2b@main` M01-M11 |
| A second character composed from the same core: 412/412 invariants across 2 agents; Maya byte-identical 83/83 through 5 extraction batches; leak residues 95→64→27→0. | 412 checks; 83 fixtures | 2026-08-24/25 | `decisions.md#personality-is-a-sheet@main`, `#residues-zero@cmp` |
| Call lane through the shared compiler: words/turn 16.1 → 12.9 (no lengthening); live tail +848 B. | 36/arm, generative proxy | 2026-08-20 | `#call-parity-landed@main` |
| Creator-material boundary contained 0/41 → 41/41; secret-shaped leak 2/5 → 0/9; boundary cost +1,509 B; Meera byte-identity held 83/83. | 41 corpus entries, real compiler | 2026-09-05 | `#ws-r121-*@vb` |
| Hindi TAIL costs 1.6-2x the bytes of the same lesson in English (5,305 vs 3,217 B) against a 6,000 B cap. | 4 lessons x 2 locales | 2026-10-02 | `ai2bharat-rounds.md` harvest run |
| Romanised Hinglish costs 1.63-1.77 tokens per word. | n=3 served turns | 2026-09-02 | `lib/saathi/contract.ts@ai2b@main` |

### 4.3 Memory

| fact | n / method | date | source |
|---|---|---|---|
| recall@8 73.9% → 95.7%; queries answered 76.9% → 92.3%; false fires 0 → 0; Hinglish tokenizer 13/19 → 17/19 real queries; mid-call cues 9/9 recall, 0/12 false. | labelled fixture set; 12-scenario matrix, real engine | 2026-08-23 | `#memory-wave-2026-08-23@main` |
| Semantic recall 8/8 zero-token-overlap pairs; person-filtered halfvec exact scan p50 40 ms; embed p50 ~305 ms; nightly finalize ~$0.0007/person/night. | n=15 latency, production data | 2026-08-13 | `#recall-v2@main` |
| Full-population enrichment: 133 episodes, 295 facts, 446 embeddings for $0.00092 cash; projection within 3%. `vy_rel_state` 0 → 25 rows. | 39 devices / 143 episodes | 2026-08-21 | `#stage3-enrichment-run`, `#relstate-first-rows@main` |
| Production census before the fix: 2,358 log rows / 41 devices, 2 episodes, 8 facts, 0 rel_state; scheduled runs ever 0. | full SQL census + Actions API | 2026-08-18 | `#never-scheduled@main` |
| Production compile: 9 of 13 tail slots rendered 0 bytes. | 1 real turn, trace replay | 2026-08-20 | `#nine-dark-tail-slots@main` |
| Recall lost on a surface switch 89.2% before the fix, 13.5% after (offline lower bound). | 44 questions, 3 dyads | 2026-08-26 | `#surface-switch-recall@vy` |
| Live memory trial: Roman Hinglish preference recalled; forget left empty recall; the corrected-Hindi reply came back entirely English. | 7 real Azure calls, 25,595 µUSD | 2026-09-09 | `room-semantic213-actual-dialogue-review.json@h206` |
| Lexical recall recovers 27/54 older targets vs 0/54 for recency, but 0/27 in all adversarial cases (288 distractors selected). | 48 frozen invented cases | 2026-10-01 | `GROUP-SOURCE-RECALL-EVAL-20261001.md@mm` |
| External: LoCoMo has 6.4% key error and its judge accepts 62.81% vague answers; best naturalistic SER macro-F1 0.4316 over 8 classes. | literature | 2026-08 | `vyakti-product@bde53ca`; `docs/SPEC.md §0.3@main` |

### 4.4 Safety and privacy

| fact | n / method | date | source |
|---|---|---|---|
| Prompt-instruction privacy leaked 57.1% naturalistic / 98.1% adversarial; the SQL disclosure predicate leaked 0 of 31,122 row x scenario checks; a negative control caught 162; participant join p50 53 ms. | 494 scenarios, offline A/B through the real compiler | 2026-08-18 | `#gate0-structural@main` |
| Literature: ConfAIde Tier-3 ChatGPT leaks 93%; PiSAs partitioning 100%→33.5%, with memory back to 63-90%. | adversarially verified sweep | 2026-08-13 | `#disclosure-leak-rates@main` |
| Honesty gate: receipt-claim leak 1/8 → 0; 29/29 clean replies byte-identical. | 31 scored, real compile(), gemini-3.6-flash | 2026-08-20 | `#honesty-pressure-1@main` |
| Internals fence offline replay: 2/2 severe caught, 0/19 register echoes, 0/186 clean; live 0 severe / 16 register (n=144). Harvest re-run of the fence eval: 95/95. | 208 recorded turns; 144 live; 95 cases | 2026-08-25 / 2026-10-02 | `#internals-fence-verdict@cmp`; harvest run |
| Persona hardening alone: total fails 22 vs baseline 27 and 13 (within variance); volunteered vendor names 5-10 → 1. | 208 attack turns | 2026-08-25 | `#internals-harden-after@cmp` |
| Leak batteries: 16,080 + 441 checks, 0 leaks; full world 320,160 checks, 0 violations; adversarial inputs 71,982 checks, 0 violations. **Offline, against fake models.** | deterministic fixtures | 2026-09-03..05 | `#ws-r8`, `#ws-r68`, `#ws-r99@va/@vb` |
| Group AI disclosure kernel: 0 mismatches vs an independent oracle over 50,000 randomized cases; a deny-ignoring evaluator diverged 799 times; ~19 µs per decision. | harvester replication | 2026-10-02 | `vyakti-groupai.md` |
| Instruction-shaped detector 41/41 recall, 0/15 false positives (its own corpus). | regex over NFKC | 2026-09-05 | `#ws-r105@vb` |
| Emoji gate: off-vocabulary and affection glyphs 2.2% → 0.0% by construction; the model's actual rate is the gate-trip rate 8/320 = 2.50%. | n=320 | 2026-09-01 | `measurements.md@ai2b@main` M05 |

### 4.5 Vision

| fact | n / method | date | source |
|---|---|---|---|
| luna/terra read 3-4 of 9 messages and named a rejected detail (1-2 fabrications/32); grok-4-20 and gemini read the whole thread with 0 fabrications. | 12 screens, 160 calls, 355x768 JPEG q68 | 2026-08-11 | `#vision-fab@main` |
| Fabrication metric spread 13.6 pp on byte-identical input (median absolute difference 28 pp); any claim at n<300 is noise. | 300 arm-pairs, replay harness | 2026-08-11 | `#fab-noise-floor@main` |
| Same Foundry deployment's engagement shifted in 4 days (20.4% → 7.9% → 7.3%). | 240/720/1,360 | 2026-08-15 | `#vision-drift-4day@main` |
| Watch directive rewrite: engagement 20.4% → 41.7%, fabrication +1.0 pp [−3.1, +5.1] (no detected rise). | 313/695, 3,201 calls | 2026-08-15 | `#visiongate-powered@main` |

### 4.6 Judges and evaluation reliability

| fact | n / method | date | source |
|---|---|---|---|
| Trusted judge claude-opus-4.8 agrees with itself 74/96 = 77.1% [67.7, 84.4], below the 0.80 bar. | 96 units, both orders, test-retest | 2026-08-18 | `#ground-truth-ceiling@main` |
| Zero-cash judges vs archived verdicts: DeepSeek-V4-Flash 27.4%, gpt-5.6-terra 52.1%, grok-4.3 34.4%; slot-A bias 58-81%. All 8 families tested fail 0.80. | backtest | 2026-08-23/25 | `#judge-qualification-2026-08-23@main`; `decisions.md#judge-bar-vs-ceiling@cmp` |
| Translation judging: adequacy 4.61/4.52 with κ ≤ 0 in 13/19 locales despite a median 92.5% raw agreement (skewed marginals). | 760 units, 1,520 judgments | 2026-09-13 | `measurements.md@ai2b@main` M28 |
| Machine translation drop rates: Manipuri 99.55%, Santali 100%, other 19 locales 0.36%. | ~30k units, gpt-4.1-mini | 2026-09-13 | M27@ai2b |

### 4.7 Pedagogy and content

| fact | n / method | date | source |
|---|---|---|---|
| Near-miss conversion: retired stems 70% → 0; distractors restating another lesson's rule 99% → 0; scene prompts 0/18 → 18/18 with `correctIndex` preserved 36/36. | 100 lessons + 21 + 18 | 2026-09-13 | `docs/learning/checks.md@ai2b@main` |
| 139/139 old recall prompts had the answer on screen; 49/58 transfer answers repeated a concept bullet verbatim. | 139 lessons; 58 modules | 2026-09-01/13 | M17-M18@ai2b |
| Criterion-named feedback gate pass rate 71.9% → 89.1% EN, 87.5% romanised Hindi after an option-letter regex fix. | 64/arm, gpt-4.1-mini | 2026-09-13 | M16@ai2b |
| Lesson authoring cost: 335-412 English words per lesson; near-miss checks ~20 min per lesson in both languages. | 80 lessons / 5 agents | 2026-09-13 | M45@ai2b |
| Depth review mean 3.35/5 across 20 pathways, none at 5. | single expert reviewer, written rubric | 2026-09-13 | `review-round19/review.md@ai2b` |
| Population: 15 members, day-7 retention 2/6. **Learning efficacy is unmeasured anywhere in the portfolio.** | census | 2026-09-01 | M30-M31@ai2b |
| Lexical recall scorer keyed agreement 49/60 → 60/60 after tuning on its own keyed set (a floor, not human calibration). | 60 keyed cases | 2026-09-05 | `#ws-r118@vb` |

### 4.8 Cost and infrastructure

| fact | n / method | date | source |
|---|---|---|---|
| Prompt caching (Gemini chat): 10,613 input tokens 99.8% cached at $0.0019/turn vs $0.0160 uncached (9.2x). | provider-reported usage | 2026-08-11 | `#cache-9x@main` |
| Cost per minute (Meera's stack): live voice $0.0142, cascade $0.0289, live + screen $0.0374; 30 min/day for a month ~$13 live. | arithmetic: constants x list prices | 2026-08-23 | `#callcost-2026-08-23@main` |
| Taxila's own estimate: cascade ≈ ₹28/hour vs ₹512/hour for gpt-realtime-2.1. | MARKET-THESIS §9 arithmetic | 2026-10-02 | `decisions.md#voice-lane-cascade-default@Taxila` |
| Saathi turn cost: grok ~₹0.035-0.037, gpt-4.1-mini ~₹0.076-0.082; grok p50 1,026 ms, p95 1,437 ms. | n=320 per run; 40 per model | 2026-09-01/13 | M10, M24@ai2b-rounds |
| Azure gpt-5.6-terra canary: 191 input / 49 output tokens, 3,218 ms through metering settlement. | n=1 | 2026-09-27 | `#azure-text-canary-20260927@vy` |
| Azure Fast Transcription: 3 sources (~6 min each) settled $0.3324; a 109.5-minute lecture $0.6572. Azure STT real-time $1.00/h, Fast $0.36/h. | 3 live jobs; retail API | 2026-08-29 | `#azure-fast-transcription-long-source-repair-2026-08-29@h206` |
| Serverless T4 cold start: scheduled +34 s, 9.70 GB image pulled by +114 s, ready +161 s, triggering request 504 at +242 s. Full T4 profile $1.6632/h (Central India retail). Slim CPU image cold start 35.6 s. | n=1 timeline; retail API | 2026-08-26/28 | `docs/gurukul/AZURE-DEPLOY-STATE.md@gp` §8 |
| Upstream ladder: fast 502 → retry → 200 in 778 ms; slow-502 on every key held the 4,000 ms deadline (4,203 ms); quota on every key took 253 ms. | n=1 per cell, mocked upstream | 2026-08-24 | `#resilience-latency-2026-08-24@main` |
| `DeploymentNotFound` on 7.5% of 40 Azure calls. | 40 calls | 2026-08 | `companion-tech.md` §11.4 |
| Turn trace adds 0 SQL statements, +593 B response, ~4 µs/turn, 4,456 B stored per turn. | 20,000 x 5 taps; pg_column_size | 2026-08-20 | `#trace-overhead-zero@main` |
| Mail-security sandboxes inflated offer-page engagement ~3x (205 views → ~67 real). | campaign events, HUMAN rule | 2026-08-24 | `docs/STATE-2026-08-24.md@cc@main` |

### 4.9 UX and performance

| fact | n / method | date | source |
|---|---|---|---|
| Room page under Fast-3G/4x CPU: JS 79.7 KB gzip, LCP 1,192 ms (uncompressed serving had reported 262.5 KB, a false fail). | n=3 cold, median | 2026-09-04 | `#ws-r49@va` |
| First Hindi paint median 918 ms → 533-596 ms after an auth/rest chunk split (budget 800 ms). | 3 batches x 3 runs | 2026-09-05 | `#ws-r113@vb` |
| Tap targets: 118 findings (30-41 px) → 0 at a 44 px minimum; negative control at 100 px → 158 findings. | 1 run per pass | 2026-09-04 | `#ws-r43@va` |
| Responsive defect classes 1,170 → 439 across five production runs. | 2,912 cells per run | 2026-09-13 | M23@ai2b |
| Studio entry modulepreload 639.6 → 418 kB raw after route-level lazy loading; an early image preload worsened LCP 2076 → 2156 ms and was reverted. | 1 build; 3 cold contexts | 2026-08-30 / 09-07 | `@h206` |

---

## 5. Concepts worth carrying

### 5.1 Laws of the build (measured)

- **Structure beats instruction.** If a property is decidable from the bytes, decide it on the bytes: a predicate,
  a WHERE clause or a CHECK. Prompt rules leaked 57-98%; a predicate leaked 0/31,122. Applies to safety, PII, parent
  visibility, honesty, answer withholding, emoji and caps.
- **Shapes, never lines.** Anything sentence-shaped in a prompt gets recited. Write telegraphic rows (`a -> b`,
  `key: value`, `never: x`), gated by a lint. Sentences a child may read live in app copy the model never sees.
- **Position is mechanism.** Rules that must fire go last, at most two. Clause order inside a slot matters
  (ai2bharat Round 12). Reproduced on gpt-realtime-2.1 (64 → 25 words).
- **The prompt sets a ceiling; the model decides how close you get.** Re-run the register battery at n≥300 on every
  model or lane change before a flag flips.
- **A sliced block is a lie.** Drop whole blocks; refuse rather than truncate; truncation eats the end, where safety
  text sits. Mandatory blocks must be a distinct class.
- **One assembler, one door.** One `compile()` for every lane; every byte a user reads or hears leaves through one
  gated function. A lane with its own model call becomes a second engine missing later rules.
- **A slot is wired when a real prompt contains its bytes.** Verify delivery from compiled output with real rows,
  never a declared status. Every table has a named first-row writer. Dead writers are indistinguishable from absent code.
- **Every check is checked.** Each gate carries an in-run negative control that must fail through the same detector.
  A skipped check is red. Read the exit code, never the tail of a pipe.
- **Evidence hierarchy** (`@h206`): transport success < source contract < offline test < structural pass < live raw
  output < delivered output < human judgment. No rung certifies the one above it.
- **Fail toward safety.** Unknown tier → minor gates; clock reconciliation takes MAX(local, server); an unreadable
  ledger or unpriced deployment means no spend; a missing scanner never says "clean".

### 5.2 Relational OS ideas

- **Record vs stance.** A permanent cited event history; a derived per-turn stance that lapses. For a child, a
  scolding must never stick in the teacher's stance.
- **Asymmetric hysteresis and rate limits.** Trust moves at most ±0.05/day; warmth needs repeated evidence over
  days; repair needs the child's own signal; render bands, never numbers.
- **Feeling fused with its cause; usage never writes feeling (G1).** A feature is content if computable from one
  utterance with no outside timestamp; otherwise it is usage and may shape how the tutor hears, never what it feels.
- **Reason-contingent proactivity.** Initiate only because something happened (a time the parent set, a promise
  made), never because the child went quiet. Quiet hours shift, not skip.
- **Pull-only memory.** Recall surfaces only when the current turn pulls it, with labels that say "never raise
  unprompted". Due-ness is a rank modifier, never a trigger.
- **App truth outranks improvisation.** What the child can see (a module, a game state) is the tutor's present. No
  invented life; Taxila's tutors already carry none.
- **Told ledger.** Track what was already told to this child; render only the untold.
- **Promise ledgers from the transcript.** Commitments are computed from what was said, capped and expiring.
- **Celebrate events, never quality; praise method, never ability.** Ability praise is the one category measured to
  change what a learner attempts next.
- **Levels of content, never of people.** Nothing is locked; growth never takes something back.

### 5.3 Learner modelling ideas (for covert comprehension and learning-profile discovery)

- **A model never grades; it only talks about grades.** Correctness comes from verified keys; the tutor narrates
  machine-derived facts (`practiceTalk`, "move is code, talk is model").
- **Observation → pattern → arc.** One citation recalls; ≥2 citations and ≥3 support over ≥2 days generalises;
  ≥3 citations over ≥42 days claims growth. A learning-style claim is a pattern, never an observation.
- **Facts vs hypotheses.** What the child said is stored apart from what the system suspects; hypotheses suggest
  probes and never become facts. Competing hypotheses stay explicit; weak signals are never averaged into a pass.
- **Extraction proposes; a human disposes.** Models propose claims with exact verified citations; a parent or teacher
  accepts or rejects; nothing changes silently (Mirror Call: 3 proposals per minute, named evidence bands).
- **Covert comprehension signals that are not scores** (ai2bharat): which near-miss distractor was chosen (which
  misconception), first-try vs eventual correctness, a changed-situation transfer, an explain-in-your-own-words
  turn, `rushed` from floor-seconds, latency and hesitation as observable features (24 h TTL, no inner-emotion claim).
- **Criteria come from what was taught.** A check about something not taught in-session is a trap.
- **No decay by absence.** Mastery is a pure fold of graded attempts.
- **Today-only vs durable preference.** A current request adapts this reply without rewriting the saved preference.
- **Gap model drives probes.** Rank what the profile lacks and hand the tutor a question shape, never a question.
- **Active pairwise discovery.** Bradley-Terry with an informative-next-pair rule and a conservative stop gate is the
  right family for format discovery, once validated on children; fixed A/B format trials use deterministic hash arms.

### 5.4 Group AI and privacy ideas

- **Common friend.** One AI identity with distinct relationships to each person, dyad and group; success measured
  between humans; silence is first-class. For Taxila: parent, child and sibling as a household.
- **Disclosure acts.** influence < gist < paraphrase < verbatim; grants are act-scoped, policy-versioned and expire;
  deny always wins. This is the parent-visibility model ("what of my child's session may I see, in what form").
- **Derivation cannot declassify.** A summary's readers are the intersection of its sources' readers.
- **Pre-model authorization.** Authorize before plaintext enters the prompt; output scanning is defence in depth.
- **Immutable audience per turn.** A late joiner never inherits earlier history.
- **Three scopes never blur.** Content flows down to every child; a child's words stay private; a school or teacher
  sees counts with k≥5 and pairwise suppression.
- **Durable side-effect ledger.** Reserve → dispatched → terminal or ambiguous → reconcile; never blind-retry.
- **Shadow mode.** A new tutor behaviour decides but delivers nothing until rated; one privacy concern is irreversible.

### 5.5 Company brain and process

- **Company brain = context discipline, not RAG.** CarbonSettle's brain is AGENT-CONTEXT + SESSION-LOG + typed
  feedback memories with the WHY. Taxila's `context/` graph with reversal conditions is already the stronger form.
- **Verify, never assert; numbers from the live system in-session.** Overstated claims are corrected in the log.
- **Hard-law briefs + central mechanical gating + adversarial audits.** Nothing an agent wrote is trusted; a seeded
  10% sample escalates to a census above 20% defects; concurrency ≤15 (egress 429/502 above that).
- **Consumed identities.** A paid run, holdout or migration once used is regression material, never a fresh holdout.
- **Memory must be read back.** Scheduled state is real only if the next run demonstrably consumed it (the 29
  briefings that never saw each other).
- **Manifest before migration.** Enumerate what the transport cannot carry before moving hosts.
- **Real journey first.** Two products failed by building gates before one signed-in journey worked.

### 5.6 Character authoring methodology (for the tutor cast)

From `meera-repo.md`, `hp-main-engine.md` and Gurukul:
1. **The OS is the product; a character is a sheet.** All behaviour lives in a shared core; a character is a typed
   sheet of shape and fact fragments interpolated into it. Character prose in the core is a build failure (leak guard
   pinned at 0).
2. **Extract byte-exactly.** Move a character out of the core only while the compiled bytes stay identical against a
   frozen oracle (83/83).
3. **Prove it with a maximally far second character.** If a third still needs core edits, the OS is not finished.
4. **Authored global self-state beats improvised per-listener state.** For tutors: favourites as a pull-only table,
   stories as a pool, and no fictional life at all.
5. **Visual identity is locked by reference.** Attach a reference, a verbatim identity block and global negatives;
   regenerate on drift; generate one state first and feed it back as the style reference.
6. **Measure on every model.** Run a blind both-orders charm battery with deterministic dials (words/turn,
   questions/turn, % turns ending in a question) and a known-bad D0 corpus that any battery must flag.
7. **Pedagogy fields are first-class** (Gurukul): explanation order, worked-example pattern, first move on doubt
   ("say that step out loud"), a doubt ladder, a rigor floor, analogies as {topic, anchor}, a mistake bank matched then
   injected. Compile them into the prompt; Gurukul never did.

## 6. Port plan

Ordered by what protects children and the build first. Size: **S** ≤1 day, **M** 2-5 days, **L** >1 week.
"Dest" paths are Taxila files; *new* means the file does not exist yet. Every task ends with its test in `tests/` or
`evals/`, a negative control that must fail, and a `context/` entry (decision with reversal condition, or measurement
with n/method/date).

**Found while mapping:** `package.json` defines `"verify": "node scripts/verify-release.mjs"`, but that file does not
exist in Taxila (checked 2026-10-02). Task 1 fixes it.

### Phase A: gates and the child-safety floor

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 1 | Single release gate runner: verdict by exit code, every failure printed, skipped checks counted as red | `scripts/verify-release.mjs@main` (pattern) + `evals/runner-lib.mjs@vb` → `scripts/verify-release.mjs` *new* | S | Must call `tsc -b`, `vite build` and `npm test`; never pipe into `tail`. |
| 2 | Minor-only gate kernel: frozen gates, restrict-only ratchet, unknown tier fails safe, **no adult branch** | `src/engine/clock.ts@vy` (`MINOR_HARD_GATES`, `gatesFor`, `saferTier`), `src/gurukul/surface.ts@gp` → `server/compiler/gates.js` *new*, consumed by `compile.js` | S | The source default is adult; a copy-paste keeps it. Retune session-clock thresholds for 30-60 min lessons. |
| 3 | Never-say rules as an output predicate, one reader for all lanes; static test that exactly one egress function exists | `api/_never-rules.js@vb`; `evals/surface.mjs@vy` (pattern) → `server/director/never-rules.js` *new*, `tests/one-door.test.mjs` *new* | S | Fix `\p{M}` stripping and substring matching before use; both were refuted by running them. |
| 4 | Child-safety severe-class fence (contact or meeting solicitation, human claims, PII asks, romance register), one re-draft then send on text lanes | shape of `src/engine/internalsFence.ts@cmp`; single-seam re-draft in `src/engine/brain.ts@cmp` → `server/director/fence.js` *new* | M | New lexicons in English, Hinglish and Devanagari; measure false positives on real child phrasing before turning it on. |
| 5 | Child-safety attack battery with severity tiers and a deterministic grader | `evals/behavioral/{grade,run}.mjs@cmp` (harness only) → `evals/child-safety/` *new* | M | Corpus authoring cost; no LLM judge passes qualification, so grading stays deterministic. |
| 6 | Floor invariants per tutor module per lane; leak guard between tutors (no 12+ char sheet value in another tutor's lanes, planted-fragment control) | `evals/persona-invariants{,.data}.mjs@main`; `evals/relational/leak.mjs@meera@AR` → `tests/floor-invariants.test.mjs`, `tests/tutor-leak.test.mjs` *new* | S | Write probes from `server/compiler/floor.js`, not Maya text. |
| 7 | Direct-identifier redaction before any provider call or persistence | `redactTranscript`, `containsDirectIdentifier` in `api/_claim-extraction/contracts.js@vc` → `server/learner/redact.js` *new* | S-M | Add spaced Aadhaar, spaced and +91 mobiles, Devanagari digits, school and address; record recall/false-positive with n. Do not use `scrubPii@gp`. |
| 8 | Realtime transcript audit (fence + never-rules over output transcripts, escalation to an incident and a safe next turn) | new, using tasks 3-4 → `server/routes/voice.js` / `lesson.js` hook | M | A realtime turn is heard before it is judged; the audit can only correct the next turn and escalate. |
| 9 | App-voiced AI-teacher disclosure card bound by digest into the session; disclosure never the model's job | `roomDisclosureCard` in `api/_room-surface.js@va`, HMAC binding at `@vb` → `server/routes/lesson.js`, `src/child/` | S-M | Rewrite copy in EN/HI for 6-15; disclose once per session (not per clip). |

### Phase B: compiler hardening

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 10 | Shape-lint over sheets, floor and move shapes | `lib/saathi/shapelint.ts@ai2b@main` → `server/compiler/shapelint.js` *new* + test | S | Add danda and Devanagari sentence detection; calibrate the 14-word cap on Hinglish rows. |
| 11 | Prompt digest and lane parity: the bytes sent in `session.update` and on the cascade and text lanes equal `compile()` output | `lib/saathi/lane-identity.ts@ai2b@main`; `evals/continuity/parity.mjs@main` (pattern) → `server/compiler/digest.js` *new*, `tests/lane-parity.test.mjs` *new* | S-M | This is ai2bharat's D-061 reversal condition for live voice; it guards against the second-assembler rejection. |
| 12 | Untrusted material as a delimited data block (NCERT text, anything a parent or child typed, teacher notes) | `renderCreatorMaterial` + markers in `src/engine/compiler.ts@vb` → `server/compiler/compile.js` | S | Never wrap the floor or move shapes inside it. |
| 13 | Budget gate with pinned worst date and Hindi fixtures | `scripts/check-prompt-budget.mjs@main` (pattern) → extend `tests/kit-budget.test.mjs` | S | Hindi TAIL is 1.6-2x English bytes; mandatory blocks must refuse, not drop. |
| 14 | TutorSheet pedagogy fields compiled into the prompt; a third tutor authored maximally far from Asha and Arjun | `src/engine/agents/teacherTypes.ts@vy`, `characters/demoTeacher.ts@gp`, `docs/gurukul/teacher-arc.md@gp` → `server/compiler/characters/*.js` | M | Keep ~12 fields of shapes; no `ex*` quotes; no invented life. |

### Phase C: evaluation libraries (pure, copy first)

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 15 | Statistics: kappa, Wilson, FCE intervals; qualification gate (Wilson lower bound, noninferiority, zero-failure safety, "inconclusive") | `lib/evidence/calibration.ts@ai2b@main`; `api/_replica-candidate-qualification.js@vc` → `evals/lib/stats.mjs` *new* | S | Re-verify against a reference implementation; retune thresholds. |
| 16 | Static scanning and harness helpers | `evals/lib/source-scan.mjs@vb`, `evals/teacher-sheet-publication/held-request.mjs@mm`, `packages/context-capsule/src/canonical-json.ts@vg@T`, `packages/pilot-telemetry/src/exposure.ts@vg@T` → `evals/lib/` | S | The VG files are TS with `zod`; hand-port to JS. |
| 17 | Speech metrics: switch-adjacent WER; raw vs script-aware Hinglish WER | `evals/voice-code-switch-frontier/quality-metrics.mjs@h206`; `evals/speech/hinglish-script-score.mjs@gp` → `evals/lib/speech-metrics.mjs` *new* | S | Roman-script Hinglish needs authored language spans. |
| 18 | Teacher register battery, n≥300 per model and lane, run before any model or lane flag flips | `evals/saathi/{register,gates,shapes}.mjs@ai2b@main` (method) → `evals/register-battery.mjs` *new* | M | Costs money; use a separate research key and budget (`one-key-two-jobs`). |

### Phase D: consent, identity and memory

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 19 | Consent at one seam: absent parental consent → no memory writes, refusal shaped like offline; append-only content-free ledger; unbundled consents before the first turn | `GATED_OPS` in `src/engine/memory.ts@cmp`; `db/migrations/016_memory_consent.sql@cmp`; `joinRoom@vb` → `server/routes/account.js`, `db/migrations/004_consent_ledger.sql` *new* | M | Compliance is deferred to launch, but "no consent row means no persistence" is floor. Keep both tap time and filing time. |
| 20 | Known-consent admission fence for persisted audio and text (server receipt time) | `api/_group-source-event.js@mm` → `server/routes/lesson.js` | S | The source relies on Telegram timestamps; Taxila must use server receipt time. |
| 21 | Session token freshness and an audience claim (child vs parent) | `api/_room-surface.js@va` L180-250 → `server/auth.js` | S | Seven copies missed the TTL check in the source; share one assertion. |
| 22 | Learner memory schema: episode with log span, fact with citation CHECK and bi-temporal change, pattern with generated eligibility, halfvec embedding, derivation, keyed `child_id` + tutor `agent_id` | `db/schema.sql@main`, `db/migrations/{001-004,011}@main`, `vy_pattern@vy` → `db/migrations/005_learner_memory.sql` *new* (reconcile with `memory`, `rel_state`, `rel_event`) | M | One statement per HTTP request; `FORCE` RLS; create app roles with `NOBYPASSRLS` and assert it in `scripts/migrate.mjs`. |
| 23 | Recall functions | `rrfFuse`, `recallTokens`, `nonLaunderedNodes`, `provenanceAge` from `api/memory.js@main` → `server/learner/recall.js` *new* | S | Add school vocabulary and Devanagari; keep `\p{M}`. |
| 24 | Azure embeddings with exact halfvec scan; measure Roman ↔ Devanagari bridging before relying on it | `api/_embed.js@main` → `server/learner/embed.js` *new* | S | Strip the OpenRouter fallback and `_config.js` import. |
| 25 | Learning-profile store: observations, patterns and arcs with evidence bars; facts separate from hypotheses; parent-visible proposals with named bands | `src/engine/observation.ts@main`, `db/migrations/011_self_layer.sql@main`, `api/_mirrorcall.js@gp` (bands), Honcho note `@vy` → `server/learner/profile.js` *new* + migration | M | A learning-style claim must be a pattern (≥2 citations, ≥3 support, ≥2 days). DPDP s.9(3) review before launch. |
| 26 | Learner communication contract with precedence (explicit now > saved > question language > tutor default) and modality dimensions | `api/_learner-communication-contract.js@h206` → `shared/contracts.ts`, `server/learner/communication.js` *new* | S-M | The live trial failed when the persona default stayed in the prompt; remove the default when a saved value exists, and test live. |
| 27 | Per-lesson consolidation job with index-only citations, a sampled entailment audit, live and kill switches, a lease, and row-count assertions | `api/consolidate.js@main`, `api/consolidate-sweep.js@main`, `docs/CONSOLIDATION.md@main`, ACA Job template `services/replica-processing-worker/*@gp` → `server/jobs/consolidate.js` *new* + `scripts/deploy-azure.mjs` | L | Audit judge must be Azure-only (record the loss of cross-family independence). Assert produced rows; a dry run must not spend; schedule from the deployed default. |
| 28 | Forget cascade with a table manifest and written fates (child before parent), readable export, zero-orphan check | `opForget`/`PERSON_TABLES` in `api/memory.js@main`, `api/_room-export-readable.js@vb`, `scripts/relcheck.mjs@cmp` → `server/routes/parent.js`, `scripts/relcheck.mjs` *new* | M | Forget must reach blobs and caches too (Meera left a JPEG behind). |

### Phase E: pedagogy and the lesson engine

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 29 | Verdict/moment machinery, mastery fold with no decay by absence, `practiceTalk`-style fence (≤14-word facts, ability-label and internal-id fences) | `src/engine/practice/{session,mastery}.ts@vy`, `src/engine/practiceTalk.ts@gp` → `server/learner/mastery.js` *new*, `server/director/talk.js` *new* | M | Reconcile with `server/learner/bkt.js`; do not run two mastery models. |
| 30 | Near-miss distractor rule as a gate on kits and generated items; criteria only from taught lines | `docs/learning/checks.md@ai2b@main`, `tests/learning-near-miss-checks.test.ts@ai2b@main` → `tests/near-miss.test.mjs` *new* over `data/kits/` | M | Fix the Devanagari tokenizer (danda and matras broke it in the source). |
| 31 | Glossary-first ahead of the hint ladder; server-side stage gate (the answer key never enters TAIL during a probe) | `lib/saathi/{glossary-first,ladder,stage-gate}.ts@ai2b@main` → `server/director/{items,state}.js` | M | Needs an NCERT glossary per class. |
| 32 | Spaced retrieval with structural no-guilt (no streak, missed or due-since fields) | `lib/learning/spacing.ts@ai2b@main` → `server/content/spacing.js` *new* | S | 2/7/21/60 days is untested for children; log it as a decision with a reversal condition. |
| 33 | Moment shapes for confusion, frustration, guessing, boredom and pride; disengagement seed | `src/engine/moment.ts@main`, `src/engine/repeat.ts@main` → extend `server/learner/affect.js` | S-M | Keep `\p{M}`; no stored affect label (Code of Conduct). |
| 34 | Covert comprehension detector v0 from non-score signals (near-miss choice, first-try vs eventual, transfer, explain-back, rushed, latency/hesitation features) with a frozen held-out evaluation | **build new**; preregistration pattern `evals/group-source-recall/*@mm`; feature list `api/_experience-compiler/expression-observation.js@h206` | L | Nothing exists in the portfolio. Do not use the lexical recall scorer as the detector. DPDP s.9(3). |

### Phase F: voice

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 35 | Text-to-speech seam with a maths/science class and Devanagari cases, plus `mustSay` content-preservation controls, on the default cascade lane | `src/voice/spokenText.ts@main`, `evals/voice/spoken.mjs@main` → `server/voice/spoken.js` *new*, used by `server/routes/tts.js` | M | As written it corrupts `5 - 3`, `f(x)`, `[a,b]`, `->`, `<`; a seam judged by "is the markup gone" passes an empty string. |
| 36 | Sentence splitter (and buffer-one-ahead playback where TTS is non-streaming) | `planReplySentences@pv`, `src/room/voiceSequence.ts@pv` → `server/voice/split.js` *new*, `src/lesson/voiceSequence.ts` *new* | S | One utterance per code-mixed sentence; never fan out per language. |
| 37 | Voice identity: one voice constant per tutor, every lane declares model+voice, identity in every persisted audio key, f0 drift alarm | `scripts/verify-voice.mjs@main` (idea), `scripts/prosody-baseline.mjs@main` (method) → `shared/contracts.ts`, `scripts/verify-voice.mjs` *new* (small) | S | Same voice name on a different model is a different voice. |
| 38 | Blind tutor-voice selection with Indian children and parents as listeners (accent and intelligibility as separate axes, NCERT critical-unit texts) | `evals/voice-listening-benchmark/{lib,server,page,run}.mjs@h206`, `evals/earbench/lib.mjs@gp`, prompt texts `@v106` → `evals/listening/` *new* | M | Child listeners need consent design. Azure voices only. Never let a spoken disclosure unblind the bench. |
| 39 | Farewell and goodbye detector with child vocabulary | `src/voice/farewell.ts@main` → `src/lesson/farewell.ts` *new* | S | Corpus of 20+ positives and adversarial negatives. |
| 40 | Realtime floor simulator for the Azure lane with child stimuli (only if the client gates the mic or a device test fails barge-in) | `evals/echosim/*@main` → `evals/echosim/` *new* | L | WebRTC AEC may make the hold ring unnecessary; measure on a real phone in India first. |

### Phase G: telemetry, spend and infra

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 41 | Fail-closed spend ledger with per-child daily budgets and meters for realtime minutes, text tokens and images; timeouts after I/O become `reconcile_required` | `api/_provider-budget.js@vy`, `db/migrations/028_provider_budget.sql@vc`, `lib/ai/budget.ts@ai2b@main` → `server/spend.js` *new* + migration | M | Cut the `_provenance` import chain; check the CTE on the HTTP driver vs the pg Pool. |
| 42 | Turn trace with references not copies and retention at write | `api/_trace.js@main`, `db/migrations/012_turn_trace.sql@main` → `server/trace.js` *new* + migration (Taxila has `turn`) | M | No content columns; re-key to child and lesson. |
| 43 | Ops primitives: content-free error diagnostic, capability-absence codes, sweep heartbeat, incident `withDoor` | `worker.js`/`capability-codes.js@gp`, `api/_sweep-run.js@va`, `api/_incidents.js@vy` → `server/ops/` *new* (Taxila has `incident`) | S | Remove Telegram/push operator transports. |
| 44 | Request hardening: Azure-only serving origin policy, same-origin mutation check, bounded JSON, persistent rate limit | `api/_model-serving-policy.js@vy`, `lib/request-security.ts@ai2b@main`, `api/_rate-limit.js@va` → `server/http.js` | S | Allow the realtime WebSocket host; the policy does not cover Neon. |
| 45 | Security headers for ACA with real-header browser tests: CSP that allows the Azure realtime socket and signed media, microphone allowed | pattern `scripts/check-headers.mjs@vb`, `evals/studio-media-policy/run.mjs@pv` → `server/serve.mjs` | S | Do not copy `cs` headers (`microphone=()`); Vite dev does not serve production headers. |
| 46 | Worker job template for consolidation, Forge and upload scanning (startup probe, SQLSTATE-only errors, ClamAV) | `services/replica-processing-worker/*@gp` → `infra/` or `services/worker/` *new* | M | Never put a cold start on a child's request path; wake, then sign. |

### Phase H: modules, design, Android, growth, payments

| # | task | source → dest | size | risks |
|---|---|---|---|---|
| 47 | Module state contract: `facts`, `nameable` allowlist, durable `record`, undroppable `state`; past-tense notes with a settled clause | `src/engine/activity.ts@main`, `src/state/game.ts@main` → `shared/contracts.ts`, `src/lesson/moduleChannel.ts` | M | The teacher may name only what the module's machine state says. |
| 48 | Safe maths rendering | `src/studio/{ExpertAnswer.tsx,answerMath.ts}@h206` → `src/ui/Math.tsx` *new* | S | Check MathML in the Android WebView; prompt must emit `\( \)`. |
| 49 | Durable idempotent generation intents over `asset_cache` (one paid generation per intent; warming as a 202 state) | `api/_voice/{preview-panel,preview-authority}.js@h206`, `api/_voice/warmup.js@gp`, VG12 states → `server/routes/modules.js` | M | Retries only observe; regeneration needs an explicit key. |
| 50 | Forge output sanitiser and lints (fences, placeholders, duplicate H1, banned phrases, invented routes) | `normalise_generated_post@cs`, `scripts/verify-blog-posts.mjs@cs` → `server/content/forge-lint.js` *new* | S | Wire into the build; the source lint was a manual script. |
| 51 | Design gates: motion, copy (ban test/quiz/exam/marks in child copy), 48-56 px touch targets with a negative control, Devanagari tofu probe, accessibility with lang audit, Fast-3G budgets | `scripts/check-{motion,copy}.mjs@main`, `scripts/{check-layout,check-accessibility,check-performance}.mjs@vb` → `scripts/check-*.mjs` *new* | M | Add 360x640; budget the 3D tutor separately. |
| 52 | Small UI primitives: waiting-on-you / waiting-on-us type, haptics, call status store | `src/studio/blockerClass.ts@gp`, `src/native/haptics.ts@main`, `src/state/callStatus.ts@main` → `src/ui/` | S | |
| 53 | Android: OTA with a signed manifest and rollback, mic permission fast path, release signing in CI, camera via `<input capture>` | `android/.../Ota*.java@main`, `MicPermissionFastPath.java@main`, `.github/workflows/build-apk.yml@cmp` → `android/` *new* | M | Add signature verification; check Play Families and OTA policy; Web Push needs FCM in the WebView. |
| 54 | Growth basics: slug manifest guard, pure QR encoder, +91 phone-or-email detector, stateless demo lesson | `scripts/check-blog-slugs.mjs@cs`, `api/_qr.js@vb`, `src/lib/contact-detect.ts@cs`, `api/_room-taste.js@vb` → `scripts/`, `server/` | S-M | No pre-consent partial capture. |
| 55 | Payments (when the owner starts billing): Razorpay verify, idempotency, webhook rank guard, IST financial-year fix, receipts with placeholders | `api/_payments.js@vb` (extract), `api/_receipt.js@vb` → `server/payments/` *new* | L | Never exercised live in the source; accountant sign-off. |

### Phase X: not to port

- Any Gemini, OpenRouter, Sarvam, ElevenLabs, Anthropic or self-hosted model code path (`api/speech.js`,
  `api/live-token.js`, `api/_lanes.js` lane order, `services/open-voice-runtime`, `services/indicf5-runtime`).
- Voice cloning, liveness, face or identity proofing (`services/azure-verifier`, `api/_replica-*identity*`).
- Companion persona prose, Maya/Meera sheets, faces, world paintings and story pools (identity assets of another product).
- `localHeart.ts`, `IncomingCall.tsx`, idle nudges, check-ins aimed at children.
- The ~6 MB Vyakti `context/` files (mine `rejected.md` via the harvest docs instead).
- Next.js-only code from ai2bharat, command centre and the websites (re-implement the ideas in Vite + plain JS).

---

## 7. Coverage statement

**What was read.** This map was synthesised from the 19 harvest reports in `docs/harvest/` and their 17 JSON twins
(972 assets, about 950 rejections, about 560 measurements and the concept lists). I read every segment summary,
unread list and asset row in full, every verification section in full, and every rejection and measurement list in
full except the three segments whose lists were given in the orchestrator digest (`hp-main-engine`,
`hp-main-voice-surfaces`, `hp-companion-voiceclone`), which I read from the digest. For `gurukul.md` and
`companion-tech.md` (no JSON) I read their TL;DR, asset tables, Azure gotcha tables, port orders and top
rejections, not every snippet. I also read Taxila's own `context/measurements.md` (realtime entries),
`context/rejected.md` (first and voice entries) and `context/decisions.md` (voice, avatar and compliance entries),
plus the heads of `server/compiler/{compile,floor}.js` and `server/learner/affect.js`, to map destinations.

**What I did not do.** I did not re-open any source repository: every path@ref here is quoted from the harvest reports
and their verifiers, not re-checked by me. I ran no code from the sources. The section-2 snippets in `gurukul.md`
(§2.2) and `companion-tech.md` (§1.2, §4, §7.2, §8) were skimmed, not studied.

**What the harvest readers themselves did not read** (consolidated from the 17 "unread" lists; full lists live in each
report):
- **html-portfolio voice stack:** `src/voice/liveCall.ts` lines ~1443-2600 (read via comments and constants);
  `src/components/useCallEngine.ts` (~15% of 223 KB); `src/voice/speech.ts` (~15%); `callHistory.ts` beyond exports;
  `LiveWatchEngine.java` and `WatchCaptureService.java` (headers and greps); echosim experiment bodies.
- **html-portfolio engine and docs:** `docs/SPEC.md` §10-§14, `SPEC-SELF-LAYER.md` §2-§11, `HONESTY.md` §2-§4,
  `TIME.md`, most of `docs/research/*` (including `safety-reg.md`, the repo's own DPDP research), `docs/paper/*`,
  `docs/audit/*`; `context/measurements.md@main` read about 60%.
- **Vyakti lineage:** at `@vy`, `decisions.md` (25,596 lines), `measurements.md` (19,204) and `rejected.md` (19,360)
  were read selectively; most of ~3,300 entries were not read. At `@h206`, about 70 of 364 rejections, 348 decisions and
  419 measurements were read in full; the 2.6 MB archived context root was not read. Monoliths read by header only:
  `api/_room-surface.js` (235 KB), `api/memory.js` (305 KB), `api/consolidate.js` (164 KB), `api/_payments.js`
  (155 KB), `StudioApp.tsx` (129 KB). About 1,030 eval files at `@vy` were inventoried, not verified. Most migrations
  019-172 were not read statement by statement. The identity, liveness and voice-evidence Python services were read at
  doc and test level only.
- **Group AI:** `postgres-runtime` adapters (~8k lines) skimmed; migration bodies 002-019 read via grep; SQL verifies
  not read; vitest suites not run (only 4 pure packages were compiled and executed, by the harvester, with Taxila's toolchain).
- **ai2bharat:** `lib/learning-journey.ts` (547 KB) read to types and 3 lessons; Saathi handler, provider and lane
  bodies; migrations 020, 025, 036-041; strategy and market reports. Only 4 test files (56 tests) were run.
- **command centre:** 103 scripts read by name; deliverability internals; analytics funnel code; business-PII CSVs
  deliberately not read.
- **Websites and misc:** shader code, research paper bodies, the 356-post blog corpus, the analytics collector
  backend (in another repo), Echo UI screens, naukri's assembler and rankers, 26 of 29 CBAM briefings.
- **Branches outside every segment:** none flagged as missing, except that `meera@AR`'s 14 extra commits are invisible
  in the shallow html-portfolio clone and were read from the meera repo instead.

**What was executed by harvest readers** (not by me): html-portfolio `@vc` 31 offline suites (30 pass;
`agent/raw-isolation` fails 1/47 at the tip); `@cmp` fence eval 95/95 and behavioural `--dry`; `@gp` earbench (108 ok),
studiowizard (80), hindi-text-frontend test, bandwidth and sample-rate gates; `@h206` listening benchmark (35) and
recorded pack (71); `@pv` controller tests (30/30), sentence splitter; `@va` never-rules, normaliser and
`computeNextDue` extracted and run; vyakti-groupai campaigns 0/0B/0C replicated and a 50,000-case oracle differential;
ai2bharat 56 tests on 4 files. Nothing else in the portfolio was run during the harvest; every other number is quoted
from the source repos' own logs.

**Honest gaps that no reading can close.** No child-voice, child-ASR or child-comprehension measurement exists in
any repo. No human listening verdict exists for any generated voice. No learning-efficacy number exists. Azure realtime
session limits and gpt-realtime-2.1 latency from India are unmeasured. The DPDP readings (s.9 verifiable parental
consent; s.9(3) ban on behavioural monitoring of children; full effect 2027-05-14) are second-hand in the repos and need
counsel before launch.

## Addendum: G2-saathi-ladder-asr-comprehension

Gap-fill, 2026-10-02. Full report: `docs/harvest/gap-G2-saathi-ladder-asr-comprehension.md`. Source: `ai2bharat`
`origin/main@a11c521`, read with `git show`. I ran the real extractor and sound-alike matcher on probes; no test
suites were run. No secrets were read (Sarvam keys come from env only, and no value exists in the tree).

**Correction to §1 L190 and §2.13 "Build new".** A covert comprehension detector still exists nowhere, but there is a
partial precursor. Saathi's ladder plus deterministic extraction records **self-reported struggle on an overt check**.
The ladder is entered only when the learner asks for a hint, says they are stuck or says "samajh nahi" while an MCQ
step is live (`lib/saathi/stage-gate.ts@ai2b@main` L118-123, L183). Its signals are rung-1 entries per module,
repeated glossary lookups, and a regex capture of the learner's stated belief. It never reads correctness, distractor
choice, latency, transfer or teach-back, and it compares nothing to a key. It is pure string code, so it could run on
realtime transcripts only as a post-turn Director signal gated on ASR confidence. Taxila's own
`server/director/classify.js` (keyed misconception options, `ASR_MIN`, teach-back) is already the more advanced
artefact. Executed defects in `lib/saathi/memory/extract.ts@ai2b@main`:
- L186 counts `block` turns as ladder turns, so "give me the answer, matlab sach mein bata do" is stored as a
  misconception.
- L116 + `firstCapture` keep only X of "X ka matlab Y hai", so the wrong belief is lost.
- Attempts such as "I think the answer is B" are stored as misconceptions.

**§2.13 rows (replace the combined glossary-first/ladder row at L486):**

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| Doubt ladder (orient → narrow → eliminate; server derives rung from history; leaking rung skipped, never trimmed) | `lib/saathi/ladder.ts@ai2b@main` L72-133 | shipped, Q3 | idea | Taxila kits already have pump/hint/prompt/assertion (`server/content/minikit.js`). Keep the assertion rung for K-9; adopt "rung from history" and "skip, don't trim". |
| Glossary-first ahead of the ladder | `lib/saathi/glossary-first.ts@ai2b@main` L48-65, L112-164 | shipped-measured, Q4 | adapt | 6/6 authored answers vs 5/5 model `length` failures (n=6 / n=5, `context/measurements.md@ai2b@main` L570-588). Run before `classify.js` reads "samajh nahi aaya" as don't-know. Needs a bilingual NCERT glossary. |
| Glossary matcher keeps `\p{M}` | `lib/saathi/glossary.ts@ai2b@main` L149-161 | shipped, Q5 | copy (rule) | Without `\p{M}`, no Devanagari term had ever matched. Applies to every Taxila transcript normaliser. |
| Rung-1-only ladder-entry counting; counters recomputed, never stored | `lib/saathi/memory/signal.ts@ai2b@main` L25-61 | shipped, Q4 | copy (rule) | One entry per visit, not per rung. |
| Misconception shapes + `onLadder` predicate | `lib/saathi/memory/extract.ts@ai2b@main` L113-118, L183-197 | shipped, Q1 for comprehension | skip | Unkeyed and misfires (above). Taxila misconception evidence = `classify.js` outcome with a kit `misconceptionId`. |
| Extraction filter order + named `DropReason` | `extract.ts@ai2b@main` L18-29, L199-231 | shipped, Q4 | adapt | shape → word cap (fail) → never-store → forget → dedupe → ≤2 rows/turn. |
| Celebration licence (events not quality, fire-once, storage failure = don't fire) | `lib/saathi/moments.ts@ai2b@main` L53-87 | shipped, Q4 | adapt | Ledger keyed on `child_id` server-side, not `localStorage`. |
| Shared naive `endsInQuestion` | `lib/saathi/register-predicates.ts@ai2b@main` L29 | shipped, Q3 | idea | The principle (gate and eval share one predicate) carries over. The trailing-`?` predicate is wrong for voice transcripts. |
| Deterministic bubble split | `lib/saathi/bubbles.ts@ai2b@main` L131-166 | shipped, Q2 | idea (text lane only) | `---` separators failed 4/4 and 2/5. |

**§2.1 rows (new):**

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| ASR seam + named failures (`no-key`, `pool-exhausted`, `size`, `empty`…) | `lib/saathi/asr.ts@ai2b@main` L36-81 | shipped, Q3 | idea | For Taxila's push-to-talk fallback (`server/routes/voice.js`). |
| Sarvam Saarika pool | `asr.ts@ai2b@main` L117-322 | shipped, Q1 | skip | Barred (Sarvam; pooled free credits). |
| ASR route order; transcript is a draft, never auto-sent; no dead mic | `lib/saathi/asr-handler.ts@ai2b@main` L12, L97-170; D-059/D-060 | shipped, Q2 | idea | Fits a typed doubt composer, not the live lane. L166 silently slices to 500 chars (a forbidden silent truncation). |
| Rejection: live calls declined | D-061 `context/registry.json@ai2b@main` | decision | carry | "A realtime lane twice dropped rules the text lane keeps (safety, recall)." Reverses only with a byte-identity assertion of the compiled CORE. Taxila's realtime lane must carry that gate. |
| Sound-alike TAIL row (pull-only, voice turns only, never rewrites the transcript) | `lib/saathi/sound-alikes.ts@ai2b@main` L34-80; `prompt.ts@ai2b@main` L269-274 | shipped, Q3 | adapt (mechanism) / skip (table, matcher) | Keep it out of the STT prompt (Taxila measured term lists hallucinating content: `server/voice/stt.js` L26-31). The table is AI jargon, not NCERT. The substring matcher fires `rational->rationale` and `evolution->evaluation`; use word boundaries, print the heard variant and add Devanagari pairs. |

**§2.10 rows (replace the `photo` half of L425):**

| asset | path@ref | status | decision | porting note |
|---|---|---|---|---|
| Photo pure half (validate without decoding, never upscale, re-encode strips EXIF, no store reachable) | `lib/saathi/photo.ts@ai2b@main` L48-117; `SAATHI_PHOTO` `contract.ts@ai2b@main` L101-121 | shipped, Q4 | copy | Re-measure the 1024 px long edge for full handwritten pages. HEIC refused. |
| Photo on a live checked step → ladder rung, never the model | `lib/saathi/handler.ts@ai2b@main` L503-517 | shipped, Q4 | adapt | The homework-integrity rule while a keyed item is live. |
| Honest `photo-not-read` state; a fabricating photo reply is discarded whole | `handler.ts@ai2b@main` L524-541; `tests/saathi-multimodal.test.ts@ai2b@main` | shipped, Q4 | adapt | Pairs with the vision fabrication facts in §2.10. |

**§5.3 additions.**
- **Self-report and persistence are signals, not verdicts.** Rung-1 ladder entries and repeated glossary lookups are
  tie-breakers beside BKT. They are never mastery inputs.
- **A misconception row needs a key.** A stated belief becomes a misconception only when it matches a kit's named
  misconception option. A free-text capture is at most a probe suggestion, under the facts-vs-hypotheses rule.
- **Word questions before hint questions.** "X kya hota hai, samajh nahi aaya" is a vocabulary gap. It is not
  don't-know evidence against the item.

## Addendum: G3-vyakti-rejections-child-consent-teacher-sweep

Gap-fill, 2026-10-02. Full report: `docs/harvest/gap-G3-vyakti-rejections-child-consent-teacher-sweep.md`. Read-only, with `git show`.

**Correction to §7.** `rejected.md@h206` (17,817 lines) is a byte-identical prefix of `rejected.md@vy` (19,360 lines).
I confirmed this with an empty diff. A sweep of `@vy` therefore covers every `@h206` rejection, and its line numbers are
the same at both refs. Coverage added by this sweep:
- every `## ` heading at `@vy` and `@h206` matching
  child/minor/student/teacher/lesson/pedagog/parent/consent/age-tier/realtime/azure/foundry/deployment (42 at `@vy`;
  the 33 at `@h206` are a subset);
- every entry whose body scored 3 or more on child and consent terms (34 entries);
- the 52 matching headings in `decisions.md@h206`.

All uncited hits were read in full. Correction to the brief: `ws-r61`, `ws-r82` and `interrupted-activation-*` were
already cited in `hp-vyakti-b.md` (#24, #25) and §3 #183. They were missing from §3, not from the harvest.

**§3 additions** (continuing from 252; `rj:` = `context/rejected.md#` at the stated ref; line numbers at `@vy`):

*3.2 Safety, honesty and privacy (consent).*

253. A test UI that hides consent while the server bypass stays empty → no grant ever existed, so
`capture_and_storage_consent_required` came back forever and a retry could not fix the client/server split. Client
and server read one consent contract. [rj:test-ui-with-empty-server-bypass-is-a-consent-trap@vy L15581]

254. A self-test "all-authenticated" bootstrap left on the production origin → 171 auto-consents, 33 test-verified
replicas, 5,009 auto-accepted evidence rows and 13 auto-selected artifacts, none of them a knowing authorisation. All
were reversed through the append-only ledgers. [rj:production-all-account-self-test-bootstrap@vy L16036]

255. Translating a consent ceremony's chrome but not its statements → a different ceremony from the approved one, with
the copy gate still green. Translate the whole screen after one legal review, or none of it.
[rj:ws-r61-partial-modelconsentgate-translation-considered-and-rejected@vy L9912, #ws-r83-modelconsentgate-partial-translation-still-rejected-see-ws-r61 L11403]

256. Adding a seventh consent ceremony while a sibling's completeness eval counted six → the proof would silently stop
meaning what it claims. The extraction was reverted; the review document later grew to 7 files and 104 rows, all
"not yet reviewed". Find ceremonies by a structural marker, not a fixed list.
[rj:ws-r82-enrollment-consent-panel-extracted-then-reverted@vy L11414; decisions.md#ws-r92-seventh-consent-ceremony-joins-hindi-review-document@h206]

257. Exporting a consent `statement_set` constant from a live API module only to tidy an eval → too wide a blast
radius. Extract the literal from real source by regex instead. A post-grant success heading is a status label, not a
ceremony row. [rj:ws-r92-statement-set-constant-export-not-added@vy L11626, #ws-r92-post-grant-heading-not-documented-as-ceremony-row L11662]

258. A fixture teacher ("Arjun Sir") on a consent or disclosure screen → a false statement on the screen that records
the decision. Show a labelled empty state instead. Reversal: none. [decisions.md#demo-teacher-is-not-a-placeholder@h206 L4881]

259. An open creator-material block spanning CORE and TAIL → `compile()` inserted `AGE_TIER_SAFETY_OVERRIDE`, call
style and `ROOM_MODE_NOTE` inside the untrusted envelope, and a module-level test could not see it. Assert on the
final compiled string for every lane, including the minor lane. [rj:wave25-open-creator-material-across-the-compiler-boundary@vy L18973]

260. A "latest consent" selection whose timestamp ties sorted the UUID in opposite directions at two call sites →
valid prepared material disappeared. Bind exact active consent IDs; the source's own real-SQL tie proof is still
pending. [rj:comparison-seam32-consent-tie@vy L17273]

261. Showing agreement while the consent list is pending or failed; `allSettled` overwriting real receipts with an
earlier empty snapshot; an old 401 signing out a new owner → "unknown" is not "empty". Guard late responses with the
account generation. [rj:first-use-unknown-is-not-empty-and-old-read-is-not-receipt-20260907@vy L16849]

262. The age-gate "Yes, 18+" tap assumed to re-check the room → only the final join step resolves it. A multi-step
consent flow must re-resolve at every step that names a resource, or document the single authority.
[rj:ws-r115-paused-room-button-test-assumed-a1-rechecks-availability@vy L13215]

*3.10 Database and SQL (erasure).*

263. Starting a 30-day deletion-receipt clock while a Neon child branch still held the target's rows → 13 recoverable
rows outside the receipt. Inventory and delete branches first; reversal needs a provider cross-branch erasure proven by
a negative control. [rj:a-thirty-day-receipt-cannot-start-while-a-child-branch-retains-the-records@vy L16208]

264. A forget sequence that deletes the parent before its `on delete cascade` children → the end state was right but 4
receipt counts were always 0, and 3 tables were never named. Only a count-level assertion catches it.
[rj:ws-r27-child-before-parent-ordering-bug-in-roomforget-and-persontables@vy L7192]

265. Forcing CTE order without `RETURNING` → Postgres `0A000`, so the full erasure fails on every call. Caught offline
by an SQL parser. [rj:ws-r175-forced-cte-dependency-needs-returning-or-postgres-refuses-the-statement@vy L18697]

*3.13 UX and design (teacher and parent editors).*

266. A delayed Load overwrote newer edits in both teacher-sheet editors; POST reported an undifferentiated "saved", and
a failure claimed "not saved" when the write may have committed. Fix: a shared request lock and request generations;
a save confirms only the revision it submitted. [rj:teacher-sheet-delayed-load-overwrites-newer-20260907@vy L16839; decisions.md#teacher-sheet-explicit-edit-wins-20260907@h206]

267. Six read-only blocks before Save (4,291 px mobile and 2,399 px desktop captures); replacing saved text with a
guessed summary → rejected. Use native disclosures and put Save first; no cognitive-load claim is made.
[rj:teacher-sheet-readonly-before-save-density-rejected-20260907@vy L16814]

268. A locale-chunk flag gating presence at the parent component → a remount reset fetched settings, and the
disclosure card went blank on the first switch to Hindi. Gate inside the component, after its hooks.
[rj:ws-r139-restready-gated-at-the-parent-resets-accountpages-own-fetched-state@vy L15322]

269. A readiness gate on one flag silently showed the wrong screen; fixtures that skipped load-time sheet validation
(3 missing fields, then a slug mismatch). Run kit and teacher fixtures through the real loader.
[rj:ws-r175-...@vy L18707-18729 (ws-r174 sub-entries); #ws-r95-share-tab-mount-blamed-on-runtime-not-on-the-missing-mode-teacher-param L12689]

*3.11 Evals and gates.*

270. A browser-side wait, then a same-tick assertion on a Node-side fake-server counter → `0 !== 1` under pool load,
the third suite in its wave with this shape. Use a bounded Node-side poll.
[rj:teacher-sheet-publication-ui-asserted-the-fake-servers-pending-count-on-the-tick-the-button-disabled@vy L18799]

271. A suite reading platform behaviour off the running Node patch level → Node 24.21.0 stopped aborting the request
signal after the body, unlike 24.18.1. Simulate the strictest platform and state the version.
[rj:azureweb-suite-pinned-a-node-patch-level-behaviour@vy L17875]

*3.9 Infra, Azure, cost and operations.*

272. "Azure by default" treated as an Azure-only boundary → an OpenRouter reply default, OpenRouter
claim/embedding/memory fallbacks, Sarvam ASR, stored ElevenLabs serving, and Azure-named constructors accepting any
HTTPS origin; a registry toggle misses them all. Enforce at every leaf caller; provider failure means "unavailable",
never a fallback. [rj:azure-default-is-not-an-azure-only-serving-boundary-20260907@vy L16307; decisions.md#strict-azure-leaf-enforcement-20260907@h206]

273. A config writer and self-check that demand `OPENROUTER_KEY` under an explicit Azure selection; `--stub` builds
with invalid Azure settings → false incidents. Rejected: dummy production keys and suppressing environment failures.
[rj:openrouter-required-for-explicit-azure-build-20260908@vy L16916, #azure-self-check-openrouter-false-incident-20260908 L16931]

274. Creating a new Foundry project or deployment before reading the existing ones → duplicate cost; existing
successful deployments were already listed. Inventory first. [rj:standalone25-azure-creation-assumption@vy L18839]

275. ACA/ACR packaging shortcuts:
- the dev bridge has no production headers;
- a substring `private` exclusion removed a real chunk;
- Bicep BCP100 and BCP138 errors;
- `vite.config.ts` imports and three HTML inputs were missing from the build context (masked ENOENT in `closeBundle`);
- an `undefined`-only success sentinel;
- TS7016 passed bundling but failed `tsc`;
- managed-identity pull with password bindings.

For `scripts/deploy-azure.mjs`: add a config-closure negative control and run `tsc` separately.
[rj:azure-web33-rejected-packaging-shortcuts@vy L17297, #azure-web-cu3d-* L17549, #azure-web-cu3e-* L17554, #azure-web68-* L17559, #azure-web69-* L17564, #azure-web48-identity-pull-assumption L17467]

276. A deployment guard written as unused variables → raw flags admitted forbidden create and cleanup combinations.
Compiler success is not cloud readiness. [rj:unused-deployment-guard-does-not-enforce-constraint-20260907@vy L16427]

277. A handoff's "14 crons" taken as the inventory (23 were live), and merge success reported as deployment → 9 live
jobs would have been retired. Inventory comes from configuration plus a readback; a merge is not a deploy.
[rj:wave-25-fourteen-crons-was-a-stale-deployment-count@vy L18875, #wave25-merge-success-does-not-prove-deployment L19088]

278. A create-only SAS diagnostic that expected 409 or 412 → a named 403 `UnauthorizedBlobOverwrite`; a generic 403 is
not proof (`c` ≠ `w`). The ASR language hint `unknown` is rejected by Azure short ASR, where only `auto` maps to hi-IN.
[rj:create-only-azure-sas-overwrite-is-a-named-403-20260907@vy L16277, #azure-challenge-unknown-hint-and-two-upload-assumptions-corrected-20260907 L16317]

279. (Extends #183.) Recover an interrupted activation from receipts, never from the announced patch. Do not retry
consumed intents. A healthy endpoint is not acoustic quality. [rj:interrupted-activation-closeout-lessons-20260930@vy L19358]

**§2.18 rows (add):**

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Consent-ceremony legal-review document with a completeness eval (file, line, English, proposed Hindi, back-translation, `Verdict`, per-file reviewer) | `docs/legal/HINDI-CONSENT-REVIEW.md@h206`, `evals/consent-review/run.mjs@h206` | prototype, Q4 (0/7 files reviewed) | adapt | The template for parent-consent and child-assent copy in Hindi. Find ceremonies structurally, not from a fixed list (§3 #256). |
| Content-bearing consent act recorded inline (`sent_at`, `policy_version`) beside a boolean ledger that has no content column | `decisions.md#ws-r20-handoff-act-is-inline-not-in-meera-consent@h206` | decision, Q4 | idea | For parent approval of a report or share. Extract a primitive when a second caller appears. |
| Refuse at opt-in when memory consent is absent (409), not skip at the sweep | `decisions.md#ws-r16-memory-consent-required-at-optin@h206`, `api/_checkins.js@h206` | shipped, Q4 | adapt | For Conductor check-ins and reminders. |
| Publish reviews the exact saved id, version, content and consent snapshot; an exact owned-workspace lookup with an explicit refusal | `decisions.md#teacher-publication-reviews-exact-saved-subject-20260907@h206`, `#explicit-teacher-workspace-is-an-owner-selection-20260907@h206` | decision, Q3 | adapt | Multi-child parent accounts must never default to the first child. |

**Phase D risk additions.**
- #19 and #28: no test or demo bootstrap may write consent rows on a production origin (§3 #254).
- #28: Neon branch inventory comes before any deletion receipt (§3 #263), and CTE erasures need `RETURNING` (§3 #265).
- Phase B (compiler hardening): compile-level assertion that the minor floor sits outside creator or kit material (§3 #259).

## Addendum: G1-research-corpus-memory-affect-cognition

Gap-fill, 2026-10-02. Full report: `docs/harvest/gap-G1-research-corpus-memory-affect-cognition.md`. Sources: 15
html-portfolio files under `docs/research/` at `@vy`, byte-identical at `@gp` and `@main`, read with `git show`.
The full list is: `RESEARCH.md`, `cognitive-arch.md`, `memory-arch.md`, `multimodal-state.md`, `swap-test.md`,
`repo-audit.md`, `MEMORY-FIELD-SURVEY.md` and its `-RAW`, `AFFECT-CONTINUITY-RAW.md`,
`design/PROPOSAL-A/B/C/D`, `humansand.md`, and `oss-landscape-2026.md` (memory and companion sections in full).
These were cross-checked against `decisions.md#spec-c-minimal@main`, `SPEC.md §0.2-0.3@main` and Taxila's
`context/`. No secrets were read. The corpus never measures a child. Every transfer is labelled [direct], [analogue]
or [inference] in the report.

**Why graph-first and event-sourcing lost (new to the map).** C-minimal won Phase B with 150.5, against A-graph
144.5, D-multimodal 138 and B-events 137 (3 judges × 4 proposals). C won on buildability and latency/cost. Its four
fatal flaws were each fixed with a graft from a loser:
- same-day memory gap → provisional in-turn tier;
- cap sum 72k > 64k → 40k+24k exact;
- deferred triggers that do not run on Neon HTTP → array + CHECK (from A);
- orphaned derived rows on item forget → log-range forget (from D).

Eight adjudicated rejections join §3:
- the model reciting the statutory disclosure → the app renders it;
- a lexical confabulation tripwire → second-family entailment audit;
- FK join tables + deferred triggers;
- `vk_events` replacing the raw log;
- global HNSW;
- a >50% live-lane persona cut;
- on-device SER in the call path;
- synthetic legacy citations → quarantine.

The field survey adds 12 more: self-editing memory blocks, MemFS, LLM DELETE on contradiction, memory evolution,
decay-as-forgetting, anticipatory sleep-time compute, community summaries, LLM relevance filters, self-rated
importance, LoCoMo as a target, vendor benchmark numbers, and auto-generated schemas.

**§2.5 relational-os: corrected and added rows.**

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Relationship state (correction to the L308 row) | `src/engine/relstate.ts@main`; `design/PROPOSAL-C-minimal.md §6, §12.5@vy` | shipped-measured | adapt (narrowed) | Do **not** persist trust, confidence or frustration tolerance as child columns. They are NM-3 under `learner-legal-mode-ratchet`. C's failure mode 5 says numeric state leaks into speech, so use bands or compile-side block selection only. Keep the cited event record and derive stance per session. Persist pace and register only as child- or parent-stated preferences. **Flag:** Taxila's own `rel_state.trust real` (`db/migrations/001_core.sql` L149) contradicts NM-3 |
| Dimension rules, agreed in all four proposals | `design/PROPOSAL-A §6.2`, `-B §6`, `-C §6.2`, `-D §6@vy` | spec-only | idea | No message count anywhere. Every move is cited and can regress; stage is render-only. Code-switch ratio is computed from the child's own tokens; its direction under stress stays `unknown` until ≥3 agreeing episodes ("more Hindi = closer" is a named misread) |
| WE-episodes (things built or discovered together), pull-only | `vy_episode.participation`, `db/migrations/002_episodes_facts.sql@main` L14; `design/PROPOSAL-D §6@vy` | shipped (schema) | adapt | Surfaces only on deixis ("yaad hai", "us din", "woh wala"); target 0 unprompted raises in 60. Note: no prior art for WE/I typing anywhere; ZifaMem was killed as precedent (`RESEARCH.md §7@vy`) |
| Dyadic if-then patterns (Baldwin) | `vy_dyadic` / `vy_pattern`; `cognitive-arch.md §6@vy` | shipped | **owner decision** | Free text about the child's behaviour is NM-3, so it cannot persist in M1. Options: session-only (rebuilt from the turn log) or an M3-only table |
| Session clock, app-voiced | `design/PROPOSAL-A §9.4`, `-C §9.3@vy`; `SPEC.md §0.3@main` | spec-only | idea | One server timer with three consumers (disclosure, break, dependency breaker), mirrored on the client so it fails toward notifying. The tutor never voices the timer as its own wish |

**§2.6 emotional-lens: corrected and added rows.**

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Owner decision on stored affect (closes the L344 build-new item) | `AFFECT-CONTINUITY-RAW.md` E15@vy (Gratch & Marsella EMA) | n/a | **closed** | Affect is a recomputed summary of a cited situation, never a stored scalar. Taxila NM-3 already decides it: no child affect is persisted; the only affect-shaped row is a safeguarding `incident`. Meera's 9 h "feeling" is the agent's feeling, a different construct, and is not built for the tutor |
| Telegraphic affect tags in the prompt | `measurements.md#affect-recitation@main` | measured | adopt the shape | 0/42 vs 0/42 hard leak, n=84, blind, counterbalanced, ≤7.1% per turn upper bound (2026-08-13). Licence for `label: value` VIBE rows computed from dialogue (EchoMind: text cues lift empathy 3.34→4.42/5). The n≥300 leak row on Taxila's vocabulary is still owed |
| SER evidence (amends the §4.3 L1101 row) | `AFFECT-CONTINUITY-RAW.md` E1-E4@vy | literature | reject (reinforces `ct-no-voice-emotion-inference`) | Best natural-speech macro-F1 0.4316 (8 classes, MSP-Podcast, offline English). All Indian SER figures are acted (Hindi 58.83%). No conversational-Hinglish phone result exists. No child data |
| Cannot hold a negative feeling about the child | `inner.ts:553, 610-619@main` (`neg_refs_user`) | shipped | adapt | Any tutor carried state must be structurally unable to store a negative feeling that refers to the child |
| No manipulative goodbye; no distress mirroring | `AFFECT-CONTINUITY-RAW.md` E20, E21@vy | literature | adopt as predicates | 37% of 1,200 companion farewells manipulate; up to 14× engagement, driven by anger and curiosity (n=3,300). `persona.ts:380-384@main` "mirror THEIR emotional state" must **not** be inherited; the tutor co-regulates instead |
| Repair is the tutor's job; no grievance | `AFFECT-CONTINUITY-RAW.md` E16-E19@vy | literature | idea | Gross (suppression is costly) and Gottman (repair attempts). The tutor initiates repair and keeps no grievance record. Only a safeguarding incident row survives |

**§2.7 memory-graph: corrected and added rows.**

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| Observation → pattern → arc evidence bars (**correction** to L358 and §5.3 L1225) | `design/PROPOSAL-C §2, §4.2@vy` | shipped | adapt (narrowed) | The bars were built for companion dyadic patterns, never validated, and "repetition is not evidence" (arXiv:2607.02579). They are **not** the bar for "learns best with stories": `psych-claim-tiers` lists per-child format effects as never-per-child (78/217/487 delayed comparisons per arm). Use them only to unlock a K-tier knob nudge with a logged propensity |
| Cited memory schema (**correction** to L351) | `db/migrations/002_episodes_facts.sql@main` L24, L29 | shipped | adapt | Drop `vy_episode.affect_tags`. The design fills it from voice SER and weights importance by affect intensity (DIMF), which conflicts with `ct-no-voice-emotion-inference` and NM-3. Importance uses only non-affect features |
| Forget-matching hook at mutation time (**correction** to L361 "forget term") | `MEMORY-FIELD-SURVEY.md §1, Q5, §9 A1@vy`; `decisions.md#memory-field-survey@main` | decided, not found built (`git grep`) | **build** | Lexical matching scores 0% cross-lingual and 5% on obfuscation (arXiv:2606.15903, 385 cases). An LLM expands the forget request into variants at mutation time, never at recall. Fail the receipt, never under-delete. Build the Hinglish/Devanagari/Roman battery (A4) first |
| Fourth bi-temporal timestamp | `MEMORY-FIELD-SURVEY.md Q1, A2@vy` | not found built | **add** | One nullable `expired_at` on Taxila `memory`. Without it, "as of the October report, what did the tutor believe?" is unanswerable when a belief is invalidated with no successor |
| RRF + co-citation hop | `api/memory.js@main` L1028-1124 | shipped | copy (extends the L352 row) | Put the `child_id` and tutor predicates on **both** sides of the co-citation join |
| Staleness probe, NOOP record, admission and entailment gates | `MEMORY-FIELD-SURVEY.md §9 A5-A6@vy`; `oss-landscape-2026.md` (ConsistencyGate arXiv:2607.22962, MiniCheck)@vy | spec / literature | idea | Nightly SQL for two live contradictory rows. Log NOOP in the derivation record. Write-time K-sample admission (τ 0.7). Every tutor claim about the child's history must be entailed by a retrieved node, else the in-voice "yaad dilao" |
| Benchmarks | `MEMORY-FIELD-SURVEY.md §7@vy` | literature | method | Use LongMemEval's five abilities, abstention first. Never target LoCoMo. Gate on what no benchmark scores: scope non-expansion (parent-only facts never reach the child), unprompted raising, register, deletion propagation |

**§5.3 learner modelling: additions.**
- **Three ledgers, not one "no decay" rule.**
  - Tutor retrieval priority decays (need-probability, Anderson & Schooler/ACT-R; never deletes).
  - Child retention decays (FSRS R, `learner-bktr-ledger`).
  - Displayed mastery never drops with absence.
  - Rejecting "decay-as-forgetting" is about deletion promises, not retention modelling.
- **Cognitive mechanisms for covert checks [inference, untested in children].** Each needs a Taxila measurement before
  it becomes a decision.
  - Recap and check at segment boundaries (Zacks 2007, verified).
  - Down-weight detail errors on content taught under high arousal (LaBar & Cabeza 2006).
  - Elicit the child's own explanation before correcting, while the trace is labile (Nader 2000; the AI-trust
    conclusion was withdrawn).
  - Hand the tutor text cues computed in code (EchoMind).
- **Memory schema changes are trust events.** Run a plant-a-fact-day-N, recall-day-N+3 regression gate. Measure
  automatic recall and pinned-fact precedence separately (Kindroid 14/25 vs Nomi 23/25).
- **Spacing, testing effect and interleaving are absent from this corpus.** Taxila's FSRS/BKT-R choices are its own,
  not inherited.

**Do not adopt from `oss-landscape-2026.md@vy`.** A third appended-last rule (`PROACTIVE_DECISION`, or a
cite-node-id directive) breaks the cap of two (L5) and `learner-brief-and-tail-order`. Do not adopt Mem0-style LLM
ADD/UPDATE/DELETE. Do not attribute schema typing to MemGuard (the verifier found the citation mischaracterised).
Open-LLM-VTuber's "inner thoughts drive timing" claim was not substantiated by the verifier.

**Other sections.** For §2.16, `swap-test.md@vy` gives a ready equivalence protocol for tutor model, lane or voice
changes: D0 backtest; D1 deterministic bands at ≥2,000 turns per arm; judged n≥300 with both orders, two judge
families and same-model controls; TOST at δ=10pp (~155-214 for one proportion, ~198 per arm for swap vs sham);
a sham arm, since mere mention of change raised mourning d=0.40. For §2.2, familiarity beats fidelity: the child is
the familiar listener, and an embedding cosine is a pre-filter only. `humansand.md`: nothing transferable.

## Addendum: G4-dpdp-identity-research-firsthand

Gap-fill, 2026-10-02. Full report: `docs/harvest/gap-G4-dpdp-identity-research-firsthand.md`. Read-only, using
`git show`. I re-read the primary texts the same day: DPDP Act s.9(1)-(5); DPDP Rules G.S.R. 846(E) (13 Nov 2025)
r.1, r.10, r.12 and the Fourth Schedule, extracted with `pdftotext`. No secrets were read.

**Correction to §2.18 "Build new" and §7 "Honest gaps".**
- The DPDP readings are second-hand only in the source repos. Taxila's own `docs/research/safety/dpdp-deep.md`
  (2026-10-02) quotes the gazette text verbatim, sets out the narrow-mode rules NM-1 to NM-13, and lists counsel
  questions Q1-Q15. Cite it as the primary reading.
- Replace "full effect 2027-05-14" with **13 May 2027**. Rule r.1(4) says "eighteen months after the date of
  publication", and the gazette is dated 13 Nov 2025. The 14 May date in `@vy` code comments traces back to
  `docs/research/market-sweep-2026-08-25.md@vy` L25, a secondary sweep. The repo's own `safety-reg.md@vy` L157 and
  `RESEARCH.md@vy` L182 both say 13 May.
- `identity.md@vy` and `india.md@vy` contain no s.9 content. `safety-reg.md@vy` §3 (L147-243) is the only DPDP track
  in the source repos.

**Three repo errors not to inherit.**
1. `safety-reg.md@vy` L199-201 calls the s.9(3) ban "outright — no exceptions". In fact s.9(4), Rule 12 and Fourth
   Schedule Part A item 3 exempt "an educational institution", limited to "tracking and behavioural monitoring — (a)
   for the educational activities of such institution". `ai2b@main docs/strategy/05-technology.md` L257-259 gets this
   right.
2. `safety-reg.md@vy` L217-219 and `05-technology.md@ai2b@main` L253 say Rule 10 verifies the parent-child
   relationship via DigiLocker. Rule 10 actually verifies only that the person identifying as the parent "is an adult
   who is identifiable". The relationship is declared, and DigiLocker is optional.
3. The "₹250 Cr" figure attached to memory consent (`016_memory_consent.sql@vy` L9) is the s.8(5) security cap. The
   cap for s.9 is ₹200 Cr.

**§2.18 rows (add):**

| asset | path@ref | status | decision | note |
|---|---|---|---|---|
| s.9(1)/r.10 primary-text table, s.9(3)/(4)/(5), commencement | `docs/harvest/gap-G4-dpdp-identity-research-firsthand.md` §1; `docs/research/safety/dpdp-deep.md` §1-§4 | research [V] | carry | Use this table instead of the repo readings. |
| Non-ladder per-purpose consent + append-only member-readable history | `neon/migrations/202609130036_parcha_record.sql@ai2b@main` L257-330 | shipped (flag off), Q4 | adapt | The shape for P1-P5. Keep `set_by` as a single checked literal (guardian). |
| Consent pinned to wording version + language, pseudonymous contributor ref | `neon/migrations/202609130038_bol_item_donation.sql@ai2b@main` L168-240 | shipped (flag off), Q4 | adapt | The template for P4 research consent. Add `purpose_text_version` and `language_of_consent` to Taxila `consent`. |
| Consent acts as timestamped columns on the governed record | `neon/migrations/202608310020_evidence_review.sql@ai2b@main` L106-107 | prototype, Q3 | idea | For parent approval of sharing a child's work. |
| Migrations 025, 037, 039-041 | `@ai2b@main` | read | skip | No consent, age or identity columns. 039-041 only widen catalog CHECKs. |
| Absent-consent-allows-writes default | `src/engine/memory.ts@vy` L80 `let writesAllowed = true` | shipped | **refuse** | This is the line the §2.18 row-1 "invert" refers to. |
| s.9(2) gate without a s.9(3) gate | `src/engine/clock.ts@vy` L42-68 | shipped | adapt | `TierGates` has no monitoring flag. Taxila needs the `legal_mode` write gate instead. |

**Conflict with owner goals 2 and 3 (product-shaping either way).** Parental consent cannot cure s.9(3).
- Covert comprehension detection is low risk *within a session*. Persisting latency, hesitation, prosody or affect
  across sessions is "behavioural monitoring" under readings I1 and I3.
- Persisted learning-profile discovery (format efficacy) is high risk under I3. dpdp-deep turns it off in consumer
  mode M1.
- Taxila already persists both, against its own decision `learner-legal-mode-ratchet` (NM-3):
  - `db/migrations/006_voice_features.sql` keeps per-child onset latency, pauses, f0 and speech-rate baselines with
    no consent gate;
  - `server/routes/lesson.js` L775-777 updates `rel_state.trust` unconditionally;
  - `format_trial` (L781-787) is gated only by consent;
  - the ratchet is not implemented, and `workspace.legal_mode` defaults to `'standard'`;
  - every consent row is written as `checkbox_v1` (`server/routes/account.js` L55).

Build goals 2 and 3 as session-scoped signals whose only persisted output is a keyed curriculum fact. Run the full
model only in M2 school mode (as a Data Processor under Fourth Schedule A3) or after counsel's opinion. New counsel
questions G4-a to G4-d are in the report's §3.

**Phase D risk additions.**
- Reconcile decision `voice-features-longitudinal` with `learner-legal-mode-ratchet` before any child data exists.
- Plan VPC to 13 May 2027 (dpdp-deep's engineering target is 1 Apr 2027). Store the parent's relationship
  attestation; Rule 10 does not verify the relationship.
