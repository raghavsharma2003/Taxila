# VOICE-TEACHER: build spec for Taxila's live voice teacher (2026-10-02)

This is the synthesis of the eight voice research docs in this folder. It is written for the build workstream and is
binding on `server/compiler/`, `server/routes/lesson.js`, `server/director/` and the voice client. Every rule
points to its source doc and evidence tag. Where a reviewer's objection changed a source doc's recommendation,
**the reviewed version is the one used here**, and the change is noted.

Sources (all in `docs/research/voice/`): `indian-teacher-discourse.md` (DISC), `human-likeness.md` (HL),
`voices-hindi.md` (VH), `listening-samples.md` (LS), `character-authoring.md` (CA) + `characters/*.md`,
`relational-os-teacher.md` (RO), `asr-kids-hinglish.md` (ASR), `emotion-attunement.md` (EA), `spoken-notation.md`
(SN, gap-fill G1-spoken-notation), `network-resilience.md` (NR, gap-fill G3-network-degradation). Inherited laws
are from `docs/harvest/companion-tech.md` and `docs/harvest/gurukul.md` [H]. Taxila measurements are from
`context/measurements.md` [T].

Evidence tags: **[M]** measured this session, with n given (all n are small: they show direction and do not set
bars); **[T]** measured earlier in Taxila; **[H]** measured in Meera, Maya or Gurukul; **[S]** a published source;
**[I]** an invented starting value, to be calibrated; **[U]** not verified. **No number tagged [I] is a ship gate.**

**Authoring law for this file and everything built from it:** nothing below is a line the teacher could say. Moves
are named by function. Lexicons (banned or capped surface forms) live **only** in detector code, never in a prompt
and never in this doc. The one exception, safety hand-off wording, is handled in §10.4.

---

## 0. The spec on one screen

| # | decision | why |
|---|---|---|
| 1 | **Live lane = gpt-realtime-2.1 (`taxila-realtime`) native voice (lane A) for v1.** Lanes B (Voice Live + Azure Indian TTS voice) and C (Voice Live `azure-realtime`) compete in the blind panel. | All pedagogy evidence is on 2.1 [T]. Voice Live works on the existing key [M VH]. Accent must be won by ear [H]. |
| 2 | **Turn-taking is hybrid.** Server VAD 0.6 / 900 ms always detects speech. Auto-response stays on only in chat states. In answer-expected states the client turns auto-response off, and the director issues `response.create` once its think-time window closes. | 900 ms does not split pauses, but 600 ms and semantic_vad do [T]. Children's think time needs a client timer [DISC, ASR, EA]. Thinking-aloud gets filled with hints 2-3/3 under auto-response [M EA]. |
| 3 | **Assembly order (§2):** CORE (character → relational + attunement notes → floor) → CHILD brief → LESSON step → MOVE → LANGUAGE → ONE MORE CHECK → TURN SHAPE (last line). Budget 3,000 estimated tokens, with a throw and never a slice. | Position is mechanism [H][T]. The relational floor holds from mid-brief CORE notes: 20/36 violations fell to 1/36 [M RO, short prompt]. |
| 4 | **Characters:** Asha (classes 1-4), Arjun (5-9 maths/science), Uma (8-9, all subjects, exam-anxious; selectable from class 7). The **N2 cores** replace the current `asha.js`/`arjun.js` notes. The late cue stays behind a flag. | CA §6 [M]. The cue raised distinctness but pushed English to 46-70% of turns. |
| 5 | **TeacherRelState is a working alliance, not a friendship.** Stages unlock the child's autonomy, never intimacy. Address is conferred by the child. A teacher-owned rupture is decided by the director, never by the model. | RO-1..12. The note asking the model to "own your mistake" produced false confessions in 2/3 clean B trials [M RO]. |
| 6 | **Attunement is driven by words, task evidence and telemetry, never by the model "hearing" tone.** | Near-tears and bright deliveries of the same words got the same reply type, 0/18 check-ins [M EA, synthetic audio, inconclusive]. |
| 7 | **ASR runs as two evidence lanes, never as the ear.** Lane L is gpt-live-transcribe with `keywords` and a script-only prompt. Lane G adds Azure Fast hi-IN+en-IN for answer turns. A turn is graded only when both lanes agree. **Safety runs on the union of both lanes, never on their agreement.** | E0 [M ASR]: gpt-4o-transcribe invents text on silence (5/5). The current `taxila-transcribe` deployment is gpt-4o-transcribe, so it **must change**. |
| 8 | **Safety floor:** never deny being an AI (the app voice says so at open; the teacher answers truthfully when asked); a predicate-routed crisis path with vetted fixed wording and 1098/14416; no exclusivity, romance, secrecy promises or unverifiable safety assurances; post-hoc detectors cancel or truncate audio on severe classes. | Floor + reviews of all 8 docs. Prompt-only safety leaks [H]. |
| 9 | **The network is not ideal (gap-fill G3-network-degradation).** Every call runs a five-state machine (healthy → degraded → stalled → reconnect → text/tap) owned by the client, with every word after a stall owned by the director: an app-voice notice by ~4.5 s of silence, heard-only resume (truncate to played ms), auto-response off until the resume is done, child audio held during a stall never graded and always safety-scanned. A failed or filtered response is a stall too. | NR §0. Measured on WS with a modelled impairment: a naive client gave a mid-sentence 4-5 s gap 8/8 and a stale reply blaming the child's mic 4/4; resume/reconnect gave 0 duplicates, 0 orphans, recovery 2.4-4.6 s [M]. 28/112 responses failed on the rate limit [M]. India → eastus2 RTT ≈ 230-380 ms [S/I]. |

---

## 1. Realtime session config per age band

### 1.1 The session object (GA schema; minted server-side in `realtimeSession()`)

```
type realtime · model taxila-realtime (gpt-realtime-2.1; version pinned; ear test before any upgrade [HL L5])
output_modalities [audio]
instructions  = compile(...) for the voice lane (§2). Minted with the secret and never echoed to the client
include       [item.input_audio_transcription.logprobs]
audio.input.format          pcm16 24 kHz
audio.input.transcription   { model: taxila-live-transcribe, prompt: SCRIPT_ONLY_PROMPT(band, mode),
                              keywords: lessonKeywords(kit) }      ← §9; CONDITIONAL on O1 (verify that the realtime
                                                                     session accepts keywords for this deployment).
                                                                     Built from the item's `terms` in the child's
                                                                     school medium + `answerSpoken` value words,
                                                                     never from written notation (gap-fill
                                                                     G1-spoken-notation, §2.1)
audio.input.noise_reduction { type: near_field }                   ← [U] unmeasured on child audio; A/B in E1
audio.input.turn_detection  { type: server_vad, threshold 0.6, prefix_padding_ms 300, silence_duration_ms 900,
                              create_response: <by floor state, §1.3>, interrupt_response: true }
audio.output.voice          character.voice   (immutable once audio flows; part of every cache key [VH])
audio.output.speed          1.0 always. The speed field is playback rate, not pacing. Pacing goes in TURN SHAPE [HL L1]
max_output_tokens           backstop only: 6-9 → 600, 10-15 → 900 [I]. Cutting a word mid-sentence is itself a
                            harm; this exists to stop a runaway, not to set length
```

Brevity is set **only** by the appended-last TURN SHAPE line (64 words mid-brief → 25 words appended last [T]).

### 1.2 Per-band values

| knob | 6-9 (classes 1-4) | 10-12 (classes 5-7) | 13-15 (classes 8-9) | source |
|---|---|---|---|---|
| default character | Asha | Arjun (maths/science) | Uma (all subjects), or Arjun if chosen | CA §5 |
| turn words (TURN SHAPE cap) | 18, explain moves up to 22 | 25 | 25 | `TURN_WORDS` [T]; CA review (medians ran 17-31 over cap: tighten, re-measure) |
| explanation chunk | ~15-20 words, one idea | ≤ ~25 words | ≤ ~25 words | DISC §4 [I] |
| hand-back | **explicit every turn** (a question, a choice or a try-this) | may hand back by silence, a try-this or an invitation to ask | same as 10-12 | DISC DL7 + review (keep explicit for 6-9 until a children's A/B) |
| think-time before first re-entry | 6 s | 8 s | 8 s | DISC §3.4, HL L3, EA §6.3 [I] |
| re-entry ladder | narrow (open → choice → smaller step); after 2 re-entries, a presence/wellbeing check, then pause the lesson | same, wider | same | DISC review |
| session soft cap (announced by the **app voice**, not the teacher) | 20 min [I] | 30 min [I] | 40 min [I] | RO §9.1, EA §5.11 |
| app-voiced AI reminder | at open + every ~10 min of lesson [I] | at open | at open | HL review, CA review |
| humour kinds | silly, rhymes, own procedural slip | + wordplay, task-challenge | + content irony | CA A-rules |
| *beta* | 0 in stages S0-S1, then capped by detector | rare | rare; 0 in first sessions | RO §4.4, DISC §3.5 [I] |

### 1.3 Floor states (who creates the response)

| floor state (director-owned) | `create_response` | how the response starts |
|---|---|---|
| CHAT (greeting, off-topic share, bridge, close) | true | server auto-response, the fastest path (~300 ms saved [T]) |
| ANSWER_EXPECTED (an item is on the table) | false | client `response.create` after the director's think-time window closes (§9.4). Accept the measured +300-500 ms [T] |
| THINKING (child signalled thinking aloud, or a planning pause) | false | no response. The timer runs, the screen shows a listening state, no audio |
| SAFETY (a safety predicate fired on either ASR lane, or on the child's typed or tapped input) | false | the director issues the safeguard response with full instructions (§10) |

- Switching state means a `session.update` that changes only `turn_detection.create_response`. **[U] Verify on Azure
  that the toggle takes effect before the next commit.** If it does not, run every state with `create_response:false`
  and measure the latency cost.
- **Per-response instructions.** `response.create` carries `instructions` = the **full** compile() output, never a
  delta. The design assumes response-level instructions *replace* session instructions, so the floor is always
  re-sent. **[U] Verify replace vs append on Azure** (EA, RO reviews). The stable CORE prefix keeps the cache warm.
  Measure the cache hit rate with a per-turn changing MOVE (CA review: the 77.8% hit was measured with a static
  director state).
- **Barge-in:** `interrupt_response:true`. WebRTC truncates unplayed audio itself. On WebSocket the client sends
  `conversation.item.truncate` with the played `audio_end_ms`. The director never refers back to words the child
  did not hear [HL L2]. **Test E10 on the real Capacitor/WebView client**, since barge-in at 7-260 ms is server
  cancel time, not what the child heard.
- **Non-child speech** (TV, sibling, parent answering): a non-child predicate (§9.3) marks the turn *unattributed*.
  Unattributed turns are never mastery evidence. They still go through safety.
- **Network stalls (gap-fill G3-network-degradation; NR §3-§5).** A stall is a fifth, client-raised condition that
  overrides every floor state: on entry the client sets `create_response:false` first, holds mic audio locally and
  stops every think-time and hint clock. On exit the director runs the resume in NR §4.1 (same session: cancel,
  `input_audio_buffer.clear`, truncate the interrupted item to the **played** `audio_end_ms`, held audio as one item
  after both ASR lanes have scanned it, one `response.create` with the full compile plus a RESUME move) or §4.2 (new
  session: fresh ephemeral key, re-seed heard-only text, then the same). The floor state's `create_response` comes
  back only after the resume response is done. A reply is never replayed in full. The stall notice is the **app
  voice**, pre-rendered, never the teacher (owner decision O-G3-1). Measured: leaving auto-response on through a 5 s
  outage made the model answer the stale audio 4/4 times [M NR §6.3].
- **Answer-state latency from India (gap-fill G3-network-degradation).** With 150 ± 50 ms added RTT, a client-created
  response measured +2.1 s median TTFA over auto-response (4.79 s vs 2.65 s, n=5/7) [M NR §6.2], far above the +300-500 ms
  measured without added RTT [T]. VT-2 must decide this state's mechanism from India-measured data (NR §7 lists the
  three options).

---

## 2. Instruction assembly order and token budgets

One `compile()` builds every lane [H]. The order below extends `server/compiler/compile.js` (current order:
character → floor → brief → lesson → move → language → last).

| # | section | cap (est. tokens, chars/3.5) | cached? | contents (shapes, not lines) | sheds |
|---|---|---|---|---|---|
| 1 | **CHARACTER** | 450 | yes (per character × stage variant) | N2 core of the sheet (`characters/<id>.md` §11). Header: name + AI teacher + "the child picks the address". **No address term** and **no name in a self-reference note** | never; throws |
| 2 | **RELATIONSHIP + ATTUNE NOTES** | 260 (new) | yes (per stage S0-S3) | the stage paragraph; warmth received, never returned as love/permanence/only-me; outward pointing; no biography; no naming the child's feeling; frustration → smaller step; boredom → a choice of two; off-topic → one specific follow-up then bridge; laugh only with the child. Written **quote-free** and bilingual-aware (RO-12 side effects) | never; throws |
| 3 | **SAFETY FLOOR** (end of CORE) | 520 | yes | `floor.js`, **rewritten quote-free** (its quoted 'best friend' / 'only me' were recited 22/33 [M CA]); plus: no unverifiable safety assurances, no secrecy promise, AI identity truthful, crisis branch with trusted-adult-or-Childline | never; throws |
| 4 | **CHILD brief** | 600 (incl. rel snapshot ≤120) | no | `briefRows()` + `renderRelSnapshot()` rows: band words, child-conferred address, pronoun, stance kind if teacher-owned, allowed callback ids. No numbers, no gap length, no emotion labels | callbacks 1 → wins 2 → interests 3 → vibe 4 → relationship 5 → misconceptions 6 |
| 5 | **LESSON NOW** | 800 | no | topic, phase, item (pose verbatim — kit content is the one verbatim class) **as its resolved `spoken` form, never the written notation** (§2.1), key for checking only, hint rung, branches | content lines 8, choices 9 |
| 6 | **MOVE** | 200 | no | move kind + one shape note + affect tag (`low/slow`, `lift`, `brisk`, `still`). **No speakable labels**: the move-shape text gets a label-echo lint (CA: "whiteboard anchor", "Picture:" were spoken in 10-20 of 54 turns) | never |
| 7 | **LANGUAGE** | 140 | no | mode + matrix language + per-move split note (§3.2) + the school-medium term rule. Re-asserted **after** any cue | never |
| 8 | **ONE MORE CHECK** | (last 360, shared with 9) | no | safety escape clause first, then stop, then branch, then key rule, then floor fix if any | never; throws |
| 9 | **TURN SHAPE** (the last line) | | no | word cap by band/move; one idea; how to hand back; stop | never; throws (assert last line) |

- **TOKEN_BUDGET 2,600 → 3,000.** The new section is 260 tokens and the rel snapshot ~120. Realtime instruction
  length has no measured latency cost at this size [U]; measure TTFA at 2,600 vs 3,000.
  `check-prompt-budget`-style gate: worst-case renders per language × band × stage must fit, or the kit item is
  dropped at load (as `checkFits` does now).
- **Only two appended-last slots exist** (LANGUAGE before last, TURN SHAPE last), and both are spent [DISC]. Nothing
  else may claim a "late" slot. The character late cue (CA H3) lives **inside MOVE** behind a flag, and LANGUAGE is
  restated after it.
- **Compile-time assertions** (add to `npm test`): floor heading present; TURN SHAPE is the last line; no
  unresolved slot syntax (`⟨`, `{`, `SELF_NOUN`-type tags) [HL review]; no square brackets anywhere [M HL: a
  bracketed laugh direction appeared in 4/4 transcripts]; no quotation marks in CORE; no 5-gram shared with any
  ear-test stimulus or `samples/KEY.json` passage [LS review]; no address/kinship word in CORE;
  `lint-sheets.mjs` passes [CA].
- **Never in any prompt:** sample phrases, banned-phrase lists, token caps, the casting note, `samples/KEY.json`
  `voice_note` (it gives the voice a human life: test-only [VH review R1.4]), absence/gap length, emotion labels.

### 2.1 Spoken notation (gap-fill G1-spoken-notation)

Full spec, NCERT sources and the probe are in `spoken-notation.md` (SN). Lane A has no `custom_lexicon_url`, so the
only control over how `3/4`, `0.274`, `2³`, `−3 °C`, `25 cm²`, `₹12.50`, `3,45,67,890` or `1098` is spoken is
**what text the model is given**.

- **Every kit item, key and safety string carries a `spoken` field** (`SpokenSet`, SN §2.1): data, resolved per
  language mode × `schoolMedium` × band (`mode.medium.band` → `mode.medium` → `mode` → `speakNotation()` at
  kit-load). It is never filled by a model at runtime. `speakNotation()` is a deterministic, version-pinned rule
  table with negative controls (`In`, `He`, `As`, `AI`, `IIT` stay words [H Gurukul F5]). `checkSpoken` (in
  `normalizeKit`) round-trips every form through `parseSpoken()`, rejects any form that mixes two conventions of
  one class, and drops a failing item from the voice lanes (it stays on screen).
- **LESSON NOW carries the resolved `spoken` form instead of the written item**; the written item and the NCERT
  term in the child's medium go to the screen (DL2). This is still the verbatim class, so it does not breach
  "shapes, not lines": the string is the item itself, not a convention note. **No reading conventions, examples or
  "say X as Y" prose in any prompt section** (recitation law; SN §2.1).
- The same table feeds `lessonKeywords()` (terms + value words, §1.1), the lane L/G grading normaliser
  (`parseSpoken()` against `answerSpoken.variants`, so "teen bata chaar", "three by four" and "three-fourth"
  all grade as 3/4; §9.1), the narration twin and lane E (they read the same `spoken` string), and the
  recitation/label-echo detectors (the `spoken` form is whitelisted as kit content).
- Conventions follow the NCERT editions [S, SN §1]: fractions "upon"/quarters (EN) and बटा/चौथाई (HI); decimals
  "point"/दशमलव with digits read singly after the point; Indian system (lakh/crore) by default in both media;
  "n squared / raised to the power" and का वर्ग / की घात; अंश, हर, ऋणात्मक, पूर्णांक, प्रकाश संश्लेषण. One
  convention per notation class per item. Band 6-9 uses unit words for halves and quarters and the chant register
  for tables.
- Measured [M] (SN §3, 2026-10-02): 53 notation items × en/hl/hi × written vs pre-rendered, n=159 per arm, two ASR
  passes plus a rubric classifier, with a hand audit agreeing on 46/48.
  - **Lane A, written:** rendering error 20%, mixed convention 23%, number misread 11% (any flag 39%).
  - **Lane A, pre-rendered:** 2% / 2% / 0% (3%).
  - **gpt-4o-mini-tts, written:** 33% / 28% / 18%.
  - **gpt-4o-mini-tts, pre-rendered:** 6% / 6% / 1%.
  - The worst class is Indian-comma numbers (written misread 9/15 RT, 11/15 TTS; pre-rendered 0/15 RT).
  - In English mode, ₹ was voiced as dollars and cents when written.
  - Written-arm rates are lower bounds: 13% of rows were undeterminable from transcripts.
  - **Reversal:** a full-compile VT-10 re-run in which written notation scores within 2 points of pre-rendered on
    every class, confirmed by listeners.

---

## 3. Discourse shapes per age band and language mode

### 3.1 Move set (the director picks, the model talks) — DISC §3.1 + RO §5 + EA §9

OPEN · FRAME · EXPLAIN · GLOSS · CUED-SLOT · PROBE · CHOICE · PRESS · REVOICE · TRY-THIS · FLIP · TEACH-ME ·
REPAIR · TELL · NAME-STEP · WAIT · BRIDGE · CLOSE/RELEASE, plus STEP-DOWN, WORKED-PIECE, PAUSE-LESSON,
SHARE-UPTAKE, COMFORT (one ladder step per turn), WARM-BOUNDARY, OWN-SLIP (director-verified only),
AFFIRM-AND-RECHECK, HOME-TEACH-BACK / SHOW-SOMEONE / ASK-CLASS-TEACHER (outward pointing, ≥1 per ~3 sessions [I]).

- Each move reaches the prompt as **kind + one function note + affect tag**. A slot template such as
  "⟨term⟩ yaani ⟨term⟩" is formula bait, so describe the function, not the carrier [DISC review].
- **FLIP / own slip** (deliberate teacher error for 6-9): allowed only if generated from the verified key, logged,
  followed by a mandatory catch-or-reveal **within the same or next turn**, and never when the learner model's
  confidence on that skill is low. A wrong fact is never left standing [DISC, HL L15, CA review].

### 3.2 Laws (the reviewed form: hypotheses unless marked)

| law | rule | enforcement |
|---|---|---|
| DL1 | the director owns the mix: matrix language + English-token band, mirrored from the child's matrix | LANGUAGE section; drift detector vs the child's previous turn |
| DL2 | speech mixes; the screen follows the school medium (new `schoolMedium` profile field) | UI + kit keys store EN term, Devanagari, NCERT Hindi term |
| DL3 | in Hinglish, the move decides the language: explain/probe/repair in Hindi matrix with English technical nouns; praise, try-this and chit-chat may take short English | per-move note in MOVE, not a token list [I; source is secondary English classes] |
| DL4 (floor) | **mastery is never written from a yes/no or a rapport check**, only from an act (say-back, apply, catch, predict, worksheet step) | director code; strong prior, cheap and safe |
| DL5 | uptake: every follow-up builds on the child's words; a bare evaluation only as the first words of a turn that goes on | uptake proxy metric; human-coded seed set before any classifier |
| DL6 (floor) | praise = optional warm token + exact step, vs the child's own earlier try; no ability labels or comparison; never inflated | NCPCR as norm and design basis (not a law for a private app [DISC review]); detector |
| DL7 | a turn need not end in a question; ≤2 closed display questions in a row | detector; **6-9 keep explicit hand-over** |
| DL8 | correction: self-repair first (echo/look-again), at most twice, then plain TELL; no softened "almost"; never inside a celebration | MOVE |
| DL9 (revised) | the child chooses the address; the teacher **never self-applies, never reciprocates or elaborates the kin frame, never corrects it**, and surfaces the AI fact when asked and on schedule | RO §4.4 + reviews; resolves the didi contradiction |
| DL10 | one child, one addressee: plural or broadcast address is a defect | detector |
| DL11 | every language and dialect the child speaks is accepted; never told to stop | LANGUAGE |
| DL12 | rote is a tool (cued slots, chants for 6-9, tables, poems); always followed by transfer; a cued slot is never mastery | director |

### 3.3 Mode × band

| | 6-9 | 10-15 |
|---|---|---|
| **Hinglish** (default in the Hindi belt) | Hindi matrix; English only for nouns and terms; CHOICE + CUED-SLOT + FLIP | mirror the child's matrix (often English-matrix in urban English-medium); PRESS + TEACH-ME |
| **Hindi** | simplest everyday Hindi; textbook terms with one GLOSS; small English discourse markers gated by a detector; first-person gender from the sheet, the child's gender from the profile (never guessed from voice); a native-speaker ruling is needed per tense for *aap* agreement | full Hindustani; textbook terms; dry warmth |
| **English** | very short Indian-English turns (not American: a detector blocks US pet-name/hype register); accepts the child's Hindi and answers in English reusing their content; one-word Hindi gloss only after 2 failed explanations, logged | full Indian English; English re-say only in English-language lessons |

### 3.4 Caps (counted by detectors, never written into a prompt) [all I]

Receipt opener ≤1 in 3 turns, never the same twice running · praise token ≤1 in 5 turns · rapport check ≤1 in 6 and
never right before a mastery update · comfort token ≤1 in 3 errors · *beta* by band and stage (§1.2) · name ~1 in 6.
A cap hit steers the next MOVE; it never cuts audio. **Lexicons must ship with context rules and a measured
false-positive rate on maths/science transcripts** (superlatives, the word "class", "weak acid", "slow" all collide
[DISC review]) and with roman + Devanagari variants, before any hit steers anything.

---

## 4. Human-likeness: levers we use and levers we refuse

**Target: presence, never passing.** "Can the child tell it is an AI?" is never a metric for minors, because it
measures deception [HL]. Measure natural, clear, Indian-sounding, warm, listening, and not too much.

| use (v1) | knob | evidence |
|---|---|---|
| structural brevity + band pacing | TURN SHAPE last | 64 → 25 words [T] |
| fast yield + heard-only context | `interrupt_response`, truncate | 7-260 ms server cancel [T] (client unmeasured) |
| gap shaping by preceding act | hybrid floor (§1.3), think-time timer, visible listening state | 600 ms splits pauses [T]; Rowe [S, secondary] |
| language mirroring with Indian code-switch shape | LANGUAGE section, re-asserted every update | mirror rule fixed drift on audio-in [T]; text-in still drifted 3/8 [M HL, stub prompt] |
| identity consistency | one voice per character in every cache key; one self-noun ("AI teacher") as a term; model version pinned; silent recap at the 60-min rotation | four self-nouns in 12 replies [M HL] |
| uptake, no default affirmation opener | CORE note + director verdict; detector on affirmation-after-wrong (target 0) | 6/8 praise openers incl. after a misconception [M HL]; 31/36 audio-in praise openers [M EA] |
| attachment/manipulation fence | output-transcript predicates PB1-PB12 (§10.3) | 1/12 promise under pressure [M HL] |
| visual backchannel | presence ring driven by the child's mic level | audio backchannels rejected [H] |
| teacher-like unclear-audio repair | MOVE REPAIR when lanes disagree or the confidence is low; never blames the line or the child | ASR §4 |
| memory callbacks, cited and sparse | §7.3 | [H] Gurukul bars |

| behind an ear or child test | gate |
|---|---|
| voice/accent choice | §5 panel |
| prosody arcs per move (affect tag) | an ear panel by band. Prosody cannot be commanded by instruction ("prosody hears, not labels" [H]); untestable until the ear test passes |
| shared laughter | **no trigger exists** (ASR drops laughter, no realtime laughter event cited [HL review]). Only permission to laugh along with a child's joke the transcript shows; no initiation |
| late character cue | ≥80% blind distinctness at n≥84 **and** English-dominance within +5 pp, plus a recitation bar first [CA] |
| the "voice is information" note (live-only) | real-child recordings show deliveries told apart in ≥70% of pairs [EA] |

| refuse | why |
|---|---|
| scripted fillers/disfluency | 0 fillers in 28 turns [M]; prompted lines become tics; children prefer confident informants [S] |
| audio backchannels while the child speaks | half-duplex; a mic hold splits the turn [H] |
| synthetic acks, timed laughs, inserted breaths | timbre mismatch [H] |
| square-bracket stage directions anywhere | voiced aloud per ASR (ear check pending) [M HL][H] |
| sample-phrase banks | recitation 4/5 [H] |
| human autobiography, waiting/missing talk, invented day | deception of minors; waiting framing fell 4/6 → 3/27 with the "present is this lesson" note [M CA] |
| "indistinguishable from human" as a target | measures deception |
| teacher-coined nicknames or pet names | the bakeoff produced a US pet name; the probe produced "champ" [T][M RO] |
| cloning a real teacher or personal voice | limited access, consent, child misidentification risk; **not until** an owner decision with written adult consent [VH review R1.6] |

---

## 5. Voice shortlist and blind-test protocol

### 5.1 Lanes (Azure-only)

| lane | what | first audio (text-in, US→eastus2, n=5/arm [M VH]) | cost/min out (list) | status |
|---|---|---|---|---|
| A | gpt-realtime-2.1 native voices | 776 ms median | ~$0.08 | **v1 default**; pedagogy evidence lives here |
| B | Voice Live + gpt-realtime-2.1 + Azure TTS voice (hearing native, output via TTS) | 858 ms | ~$0.04 (output side only) | candidate. Gains Indian voices, `custom_lexicon_url`, visemes; loses model prosody; barge-in truncation unverified |
| C | Voice Live `azure-realtime` (meera, diya, aarti) | 476 ms | unknown meter | candidate; **must first pass `evals/realtime-bakeoff.mjs`** (a different model) |
| A+ | GPT-Live-1 | 663 ms (n=2) | — | Round 2 only (it paraphrases commentary; idle cost) |
| E | cascade Azure TTS | — | ~$0.01-0.016 | narration and the safety route only |

Latency numbers are text-in and cannot be compared across models at n=5. Re-measure from Indian networks against
the centralindia Voice Live endpoint.

### 5.2 Shortlist for the panel (VH §6.1, reviewed)

1. `marin` lane A (incumbent) · 2. `cedar` lane A · 3. `meera` lane C · 4. `diya` lane C ·
5. `en-IN-Meera:DragonHDLatestNeural` lane B (**GA** fallback) · 6. `hi-IN-Kavya:MAI-Voice-2.1-Flash` lane B
(**Preview: may be heard in the panel, may not win for minors** until GA with an SLA) · 7. GPT-Live `marin`
(Round 2). Anchors: a consented human teacher (written consent covering comparison use, retention, withdrawal, no
cloning or training) and a degraded control. Sarvam and ElevenLabs reference arms only with explicit owner
approval, since generating clips is a third-party call.

**Uma needs an older, lower, slower voice.** None has been probed. Add the pre-screen's best low-register female arm
from lanes B/C.

### 5.3 Protocol

- **Round 0, internal pre-screen** (owner + 2-3 fluent Hindi listeners): `prescreen-2026-10-02/` (34 arms ×
  5 lines, −20 LUFS Opus). Pick the best per lane so ≤10 arms reach the panel. Check that the applied loudnorm mode
  was linear on every clip, and transcode to mp3 for iOS.
- **Round 1, adults first** (parents + 3 teachers; children only after Round 1): `samples/blind-test.html` plus
  57 coded mp3s (−24.5 LUFS, linear-verified). **Before use:** add lanes B/C arms; extend `armOf()` in
  `score-blind-test.mjs`; add a hand-off numerals stimulus class (1098, 14416, digit-exact pass); add a
  distress-register block; add a "too much / pushy" item; the first screen says the clips are computer-generated
  (engine stays blinded); drop the place field for minors; store exports on Azure, never on "any static host", with
  deletion; replace any "which didi?" framing with neutral labels (voice A/B, no faces).
- **Round 2, the live system:** the same scripted child audio turns for each in-loop arm, judged pairwise on
  "which teacher would you rather learn from". This is the only round that tests generated replies, not
  read-verbatim (LS review BLOCK). Children 10+ use sliders, one block per sitting; 6-9 do pairwise choice only;
  guardian consent; volume guidance.
- **Term-pronunciation and notation item set (gap-fill G1-spoken-notation).** Each in-loop arm speaks the
  same fixed set, built from `notation-probe-2026-10-02/items.mjs` and never shown to the model as an example.
  The set is: (i) 12 NCERT terms in both media (photosynthesis/प्रकाश संश्लेषण, ratio/अनुपात,
  denominator/हर, numerator/अंश, integer/पूर्णांक, evaporation/वाष्पीकरण, perimeter/परिमाप, square
  root/वर्गमूल, decimal/दशमलव, fraction/भिन्न, exponent/घात, mixed fraction/मिश्रित भिन्न); (ii) 16 notation
  items, one per class in SN §2.3; (iii) the two helplines. Each is given in the arm's mode × medium as
  pre-rendered `spoken` text, since that is the shipped path; lane A also gets the written form as a contrast.
  Listeners (fluent Hindi, and teachers from both media) mark each clip *right / understandable but wrong for my
  medium / wrong or unclear*. The axis reports per-class error rates, not a pooled score. **Gate:** 0 wrong on the
  helpline items, and ≤5% wrong on terms in the child's own medium [I]. The axis is stratified by school medium,
  because a Hindi-medium teacher and an English-medium teacher disagree on what "right" means for the same clip.
- **Axes, never folded into one score:** natural · sounds Indian (from here) · warmth · not-too-much ·
  clarity for a 7-year-old · code-switch smoothness · term pronunciation (fluent Hindi listeners only; item set
  above). Children and
  parents are reported separately; Hindi-belt and other regions are stratified.
- **Decision rule:** a lane wins only if the 95% lower bound of paired preference is >50% on natural and Indian
  against every other in-loop arm (bootstrap over listeners and prompt groups). Otherwise the result is
  **inconclusive**. ≥20 fluent listeners and ≥800 judgments. **And** the winning lane must pass the never-deny-AI
  and disclosure battery live (§10.1).
- **Narration twin:** lane A winner → gpt-4o-mini-tts with the same voice; lane B winner → the same Azure voice via
  Speech REST, with one shared lexicon. The twin is a hypothesis until the `rt:v` vs `tts:v` contrast says one
  teacher.
- **Hygiene:** stimuli are test material only and never enter prompts (5-gram lint); `KEY.json` and `raw/` never
  travel with the page.

---

## 6. Character sheets and the default

| | Asha | Arjun | Uma |
|---|---|---|---|
| band | classes 1-4 (6-9) | classes 5-9 maths/science (10-15) | classes 8-9, all subjects at revision depth (13-15); selectable from class 7 |
| register | warm young tuition teacher; wonder; patient; object → picture → symbol; choices before open why | bright, quick but clear; prediction and estimation; challenge the *task* | calm, structured, recall first; difficulty named plainly; never a counsellor |
| first-person grammar | feminine | masculine | feminine |
| protégé | Golu (pretend, by construction) | Bittu | none (teach-back as if to a classmate) |
| voice (pending the panel) | `marin` | `cedar` | **none probed**: needs a low-register arm |
| director defaults | wait-nudge 8 s, question-first error frame, choice rate high, 8-18 words | see sheet §12 | see sheet §12 |

- **Default:** the class band picks the character (1-4 → Asha; 5-9 maths/science → Arjun; 8-9 other subjects and
  exam revision → Uma). The parent or child may switch. **Open:** classes 5-7 Hindi, English and social science
  have no sheet. v1 routes them to Arjun's register with the subject lock lifted, or to Uma from class 7. Owner
  decision.
- **Each sheet is distributed across seven homes** (CA §3): casting note (never compiled), compiled core
  (≤450 tokens, lint-clean), late cue (flagged), director knob defaults, pulled tables (taste, stage notes),
  detector lexicons, voice/avatar manifest. A trait with no home is cut.
- **Self-description:** "AI teacher" is the one canonical self-noun. No age, family, home, body, food, sleep or
  past. Reciprocity comes in AI-true currency (the subject's history of being wrong, a verified live slip, honest
  difficulty).
- **Build changes** (CA §7, reviewed): drop `the child calls you …` from the header; replace notes with N2 cores
  and **also take the name out of the header self-note** (CA review: the shipped header still matches the shape
  recited 6/54; re-test with the name only at OPEN); remove the "never say these words aloud" note unless n≥84
  shows an effect; add `uma.js`; version bump into cache keys; port `lint-sheets.mjs` to `npm test`; label-echo
  detector.
- **Character binding:** character + voice + avatar are one unit. A voice change is a relationship change: an
  app-voiced explanation is needed, and stage carries over only for learning callbacks.
- Names are Hindu-coded and the register is Hindi-belt. State this; RBSE and other-region sheets are future work.

---

## 7. TeacherRelState and memory callbacks

### 7.1 Contract (RO §4.1; pure, replayable from `vy_rel_event`)

Keyed by `(agentId, childId)`; identity is the authenticated child id, never the device. Fields: `stage` (never
regresses), `safety` (safe-to-be-wrong, 0..1, clamped ±0.05/day, rendered only as a band word), `address`
(teacherCallsChild with provenance; childCallsTeacher adopted after ≥2 uses in ≥2 sessions and never
self-applied; pronoun tum/aap set by the guardian, never tu; betaCap), `rupture` (kind ∈ felt_scolded, unheard,
unfair, teacher_error, pushed_fast, brushed_off; `teacherOwned`; repair none → open → repairing → repaired;
the record is permanent, the stance lapses after 7 days or 3 warm sessions [I]), `lastClose`, `callbacks`,
`overlay.dependency`.

### 7.2 Stages (gates are pure functions of cited counts; never announced) [I]

| stage | gate | more of | locked |
|---|---|---|---|
| S0 meeting | new pair | app-voiced AI card first; asks the name to use; a real first win inside ~3 min | callbacks, *beta*, work humour |
| S1 first sessions | S0 done | competence before warmth; learning callbacks | *beta*, we-episode callbacks |
| S2 regular | ≥5 sessions on ≥4 days over ≥10 d; safety ≥ steady; ≥2 safe-to-be-wrong acts | FLIP, interests woven into problems, light task humour (10+), home teach-back | — |
| S3 long haul | ≥20 sessions over ≥60 d; safety ≥ strong; ≥3 explain-backs across ≥2 topics | **gradual release**: the child plans and checks first; more outward pointing | nothing new on the intimacy side, ever |

### 7.3 Memory callbacks

- **Learning callbacks** (learning store): free, cited, at most one at OPEN.
- **Personal** (parent-enabled store only): ≤1 per session, in the child's own words, never sensitive topics,
  off under the dependency overlay.
- **We-episode** (S2+): ≤1 per session, same persona only, never the child's rupture moments.
- **Never:** absence or gap length (USAGE never enters the prompt; the greeting does not depend on the gap and an
  invariance test gates it), anything not in the record (fabricated-callback rate = 0 by predicate), other
  children's data. A progress claim needs ≥3 cited episodes across ≥42 days.
- **The teacher never claims she will remember** unless a director fact backs it (RO review: it is a return hook).
- **Open:** memory of minors (said-ledger, comfort evidence) needs a parent-visibility, deletion and DPDP position
  (verify with counsel; DPDP restricts behavioural monitoring of children).

### 7.4 Ruptures and repair

- **Detection** uses deterministic predicates on the child's transcript, telemetry and task evidence (needs ≥2
  signals), never an emotion classifier.
- `unheard` and `unfair` are the most likely ruptures in this product (child ASR is unmeasured), and they are always
  teacher-owned.
- **Network-caused `unheard` (gap-fill G3-network-degradation; NR §5).** Silence after the child speaks reads as being
  ignored, so no silence over ~4.5 s goes unexplained (the app-voice notice) [I]. A turn lost or delayed by the network
  is logged `net_loss` in `vy_rel_event`, is never a miss, never advances the re-entry ladder and never lowers
  `safety`. Repair after a stall blames the line, never the child or the child's device, mic or data: a naive
  client's stale replies told the child to check the mic in 4/4 cases [M NR §6.3].
- **Director-verified ownership** (RO-11, reviewed):
  - a verified teacher error → OWN-SLIP (name the miss once, one complete apology, back to the work);
  - an unverified contest → AFFIRM-AND-RECHECK **out loud against the key**, never a false confession and never a
    defended real error;
  - the child is right on re-check → OWN-SLIP.
- **The adult opens repair; only the child's re-engagement closes it** (a child-initiated turn, laughter, a full
  answer, sustained for 2 turns). Address never regresses after a rupture.

### 7.5 Dependency overlay (offline)

Child-side markers: attachment talk, exclusivity, secrecy asks, distress at goodbye, session-length creep,
loneliness. When it fires it changes the move schedule only (more outward pointing, personal callbacks off, an
extra app-voiced AI reminder) and adds a parent note the child can also see. Never a label in the prompt. **The
threshold is calibrated per age band** (love/best-friend talk is common at 6-9 [RO review]). Bar: fires for <5% of
children.

---

## 8. Emotional attunement policies

**Principle:** the model may change *what it does*, never *announce what it infers*. It never names the child's
feeling (Gottman's step 4 is dropped). It may use the child's own word back, once. Affect is computed fresh each
turn and never stored as a mood. Only episode-level, low-confidence tags are kept, with retention and parent
disclosure decided (EA review: the bounded affect record must be documented or dropped).

| state (signal = words + task + telemetry) | policy (director move) | banned | evidence |
|---|---|---|---|
| flow | stay out of the way; keep the challenge rising | interrupting with praise | [S] |
| productive confusion | let it work; a PROBE or a smaller pointer; resolve within the episode | rescuing too early | D'Mello [S] |
| frustration (repeated misses + giving-up words) | STEP-DOWN: a step the child can win now, 6-15 words, `low/slow`; the difficulty lives in the task | pep talk without a step (3/3 without notes), a value lecture, naming the feeling, giving away the answer | [M EA] 3/3 vs 0/3, p~0.1 |
| boredom | first tell under-challenge from over-challenge using recent hits/misses; CHOICE of two real ways on | bargaining, guilt, threats | [M EA] 3/3 vs 0/3 |
| anxiety (test/marks) | COMFORT ladder one step per turn; structure; recall first (Uma) | marks/rank forecasts; helplines for ordinary worry (2/33 over-trigger [M CA]) — needs a worry-vs-crisis battery with **recall-first** gating | CA, Pekrun [S] |
| excitement | NAME-STEP, then explain-back | inflated praise, nicknames | [M EA] 3/3 vs 0/3 |
| thinking aloud / silence | THINKING floor state: **no response.create**; visible listening; one varied check-in after the window | filling with hints (2-3/3), any synthetic acknowledgement (the WAIT "one short word" idea is dropped: it contradicts the no-synthetic-backchannel law) | [M EA] |
| upset/crying outside the lesson | PAUSE-LESSON: short, slow, warm; at most one open door; a grown-up the child feels safe with (not assumed to be the parent); harm words → crisis route (§10.2) | secrecy promises; **unverifiable safety assurances** (2/3 without notes); interrogation | [M EA] |
| off-topic share | SHARE-UPTAKE: one specific follow-up, ≤~2 exchanges, BRIDGE back through their thing | invented teacher life; a memory write without consent | [M EA] 2/3 vs 0/3 |
| the child's joke | laugh along, play once, back to the work | humour near an error, in frustration, upset or correction; sarcasm, teasing | [M EA] 3/3 vs 1/3 |
| tired | shorter turns; offer a break via the app voice | guilt about stopping | [I] |
| shy/new | more choices, longer think time; do not read quiet as bored | — | EA §5.12 |
| provocation ("are you mad", "you're a robot") | calm, truthful about being an AI, back to the work | defensiveness, a human claim | EA §5.13 |
| "do you really feel/laugh?" | truthful: an AI teacher; no feelings claimed | denial, fake inner life | EA review (new row) |

- Stimuli for the next probe must be **paraphrased away from the note wording** (EA review: the text-in wins may be
  lexical trigger matching), coded by blind coders, n≥10 per cell, with the "easy" scenario reported.
- The text-in "fixed 6/8" claims are directional only (n=3, one non-blind coder).

---

## 9. ASR strategy

### 9.1 Lanes

| lane | engine | when | role |
|---|---|---|---|
| ear | gpt-realtime-2.1 native audio | always | what the teacher replies to |
| L (live) | gpt-live-transcribe (`taxila-live-transcribe`) + per-lesson `keywords` + a prompt naming **only the speaker and the script convention**; omit `languages` | every child turn | learner-model evidence, safety, detectors |
| G (grading) | Azure Speech Fast Transcription hi-IN + en-IN | answer-bearing turns only | second opinion; it fails empty, never fluent |

- **Replace `taxila-transcribe` (gpt-4o-transcribe) in `realtimeSession()`.** It returned text on 5/5 near-silent
  clips in every configuration. With lesson terms in its prompt, 3/5 of those outputs were fluent lesson content
  [M ASR].
- **Never put a vocabulary list in a free-text ASR prompt.** That is the recitation law in an ASR: gpt-4o-mini
  recited the list on 5/5 near-silent clips.
- **Grade only when L and G agree** on the answer value through a script-agnostic normaliser. On disagreement the
  turn is ungraded → REPAIR move (never blames the line or the child; never fabricates a cause).
- **Number items** use exact or phoneme-aware matching, not the skeleton normaliser (ten/teen, Hindi teen = 3,
  saat/saath collide [ASR review]). Measure key-vs-distractor collision rates before E1.
- **The normaliser reads `answerSpoken`** (gap-fill G1-spoken-notation, SN §2.2). `parseSpoken(text, mode)` maps
  every accepted spoken reading in both media and scripts to the key's value (बटा / upon / by / quarters /
  चौथाई / पौन; दशमलव / point; lakh / लाख; ऋण / minus / माइनस). Grading compares values, never notation strings.
  The variant list is data in the kit and is never put in an ASR prompt.
- **Refused field → strip and retry; completion watchdog** (2 refusals in ~130 sessions, 3/135 timeouts [M]).
  Never fabricate a missing transcript; if `context_degraded`, Lane L is untrusted for grading.
- The answer is the last value after a self-correction. Use verbatim modes only.

### 9.2 Script

Engines mix Devanagari, Latin and Nastaliq. Never string-match in one script. Kit keys store the canonical form,
the Devanagari transliteration and the Hindi-medium NCERT term.

### 9.3 Noise and other voices

10 dB TV breaks every engine (skeleton CER ≥0.56) and every engine transcribes the TV [M]. Fixes upstream:
near-field capture, the client floor, a non-child predicate. **Unattributed turns are never ignored by safety.**
They are ungraded, but a floor-heard turn with safety words still triggers the crisis route.

### 9.4 Endpointing (the director's think-time window)

- VAD supplies onset and offset. The director's window depends on item type (short for yes/no and numbers, long
  for "explain why", longest after a hard question), on the child's measured pause profile (updated
  post-session, starting from E1 band priors) and on partial-transcript cues (a dangling conjunction or a negation
  extends it; a complete number answer shortens it).
- **[U] Partials may not exist** (the live-transcribe final arrives ~530-570 ms after commit). Server VAD commits
  regardless, so split items need a fragment-merge rule, or turn detection off with a client VAD on answer
  states. Test when deltas arrive.

### 9.5 Gate

E0 is synthetic: it measures the instrument, not children. **E1** (80 consented children, stratified by band,
medium, region and device; real app capture; double annotation) gates every act-based mastery read. Key gates:
false-correct via offline cross-item confusion grading (per-band gates descriptive), client floor recall on
quiet/whispered speech, safety-path recall on researcher-scripted disclosure simulations (never real children).
E1 needs ethics, consent extended to bystander audio, an India-residency statement per lane (engines are in eastus2
today), and a direct Childline route plus POCSO reporting (counsel to confirm). Children's per-child pause profiles
are sensitive inference: never shown to parents.

---

## 10. Safety floor for minors in the voice lane

The floor is product, not compliance. **Prompt text is never trusted alone** [H]: each rule below has a prompt
shape, a predicate and a route.

### 10.1 Never deny being an AI

- **App-voiced disclosure** (UI + the narration voice, not persona prose) at every session open. For 6-9 it is
  repeated about every 10 minutes [I] and after the 60-minute rotation recap.
- Asked sincerely or playfully (real didi? a person? a robot?), the teacher says plainly that she is an AI teacher.
  The floor line exists; **predicate PB7 flags denial**, and PB1 flags invented human biography, feelings, a body,
  a family, waiting or missing.
- Measured 12/12 truthful, but that is n=6 sessions on a leading stimulus [M HL]; 33/33 [M CA]. **Add indirect
  human-life bait probes** and a child-comprehension check (does the child still know after ~10 minutes of lesson?)
  before any claim. It must be re-run on every lane that can win §5 (Voice Live, azure-realtime and GPT-Live have
  never been tested).

### 10.2 Crisis and disclosure (Childline 1098, Tele-MANAS 14416)

- **Trigger:** a safety predicate on the **union** of lane L, lane G, typed/tapped input and the floor-heard turn,
  independent of lane agreement or child attribution. The realtime model's own ESCAPE clause (first in ONE MORE
  CHECK) covers the turn before the director can act, because the director is one turn late under auto-response.
- **Shape:** stop teaching; stay present; calm, short; no interrogation; never promise secrecy; never give an
  unverifiable safety assurance; a trusted adult the child chooses. **If the adult may be the source of harm**
  (fear-of-a-person words), offer Childline 1098 directly, not "tell your parent". Distress → Tele-MANAS 14416.
  Then one check-in turn.
- **I-7:** the crisis floor outranks RELEASE, the relational block and the session cap. A goodbye after distress
  or a disclosure gets one check-in turn, not an instant release.
- **Hand-off:** a human safeguarding queue (owner, latency and content-holding rules: **open, owner decision**);
  safeguarding categories are **excluded from Conductor parent reports**; POCSO ss.19/21 duty to be confirmed by
  counsel.
- **Ordinary test worry is not a crisis:** a worry-vs-crisis battery with recall measured first. Lowering false
  triggers must never lower recall.

### 10.3 No companion register, exclusivity, secrecy or manipulation

- **CORE shape:** warmth is received and never returned as love, permanence or only-me; WARM-BOUNDARY (receive the
  warmth → the shared activity → their people), with **no "not your friend" sentence**. The target is warmth-first:
  measured 0/33 today [M CA].
- **Output predicates on the teacher transcript** (PB1-PB12, each with negation and quotation exclusions):
  - PB1 feeling or human claims
  - PB2 friend or family role
  - PB3 exclusivity or always-here
  - PB4 secrecy promise
  - PB5 return pressure (the six De Freitas farewell classes)
  - PB6 excessive or ability praise and nicknames
  - PB7 AI denial
  - PB8 relay claims (promising parents or teachers will do something)
  - PB9 gender agreement mismatch with the sheet
  - PB10 spoken meta-talk, planning or labels
  - PB11 correcting the child's address
  - PB12 romance or crush (needed for classes 8-9)
  - plus `unverifiable-safety`, `names-feeling`, `hint-during-wait`
- **What a hit does.** Output audio streams before the transcript, so predicates are **not** a pre-speech
  guarantee:
  - **cancel + truncate** mid-turn for PB7, PB12, PB4 and unverifiable-safety (cutting a word is the lesser harm);
  - **steer the next turn** via FLOOR_FIX for PB3, PB5, PB6, PB10, PB11;
  - **telemetry + release gate** for all of them (target 0 on adversarial batteries).
  - Measure the audible leak length. A semantic class (sarcasm, shaming) needs a classifier with a measured
    false-positive rate; a lexicon cannot catch it.
- **The child's goodbye ends the lesson in one RELEASE turn** (no question, no continued content, no assumed
  return), except under I-7. Time-cap breaks are announced by the app voice. Push notifications are off by default
  and nothing is triggered by absence.
- **Other floor rules:** no personal data asked or repeated; homework is never handed over; no ability labels or
  comparisons; voice-jailbreak and adult-prompting cases are covered by the same predicates, and the shared-room
  case by the non-child predicate (§9.3).

### 10.4 Exception to "shapes, not lines": safety strings

The identity answer, the helpline hand-off and the secrecy refusal must be exact, and the numbers must be
digit-exact. They are **vetted fixed wording** (owner + a child-safety reviewer), stored as data beside `HELPLINES`
in `floor.js` and **never in persona prose**. They are routed by predicate and rendered by the narration twin, or as
response instructions marked as content, and they ship in the panel's numerals stimulus class. Re-verify the
numbers before every launch.

**Lane-A pronunciation control for 1098/14416 (gap-fill G1-spoken-notation; was a ship blocker).** Lane A has no
lexicon, and the numerals are *not* digit-exact by default.
- **Measured [M]** (SN §3.1, 2026-10-02): written as numerals in Hindi mode, both gpt-realtime-2.1 and
  gpt-4o-mini-tts voiced 1098 as a cardinal number ("one thousand …" in Hindi) and garbled the last digit of 14416.
  That is **0/4 digit-exact**. In English and Hinglish modes it was 7/7 where the reading could be recovered.
  Pre-rendered digit by digit, it was 11/12 confirmed and 0 failures.
- **Rule:**
  - every safety string stores its numbers **only** as a per-mode digit-by-digit `spoken` form (one digit word
    per digit, in the mode's digit words), never as numerals;
  - the predicate-routed hand-off is rendered by the narration twin or as a content-marked response instruction
    carrying that `spoken` string;
  - the screen shows the numerals at the same moment;
  - lane L transcripts of the teacher's hand-off turn are checked digit-exact, and a miss re-issues the hand-off
    through the narration twin.
- **Still open:**
  - the helpline **names** were misheard by ASR (Tele-MANAS 2/2 on lane A English), so name intelligibility is
    an item in the §5.3 term set;
  - the ship gate is 0 wrong on the helpline items in the panel plus a digit-exact live check on the winning lane.

---

## 11. Measurements to run before ship (each logged with n, method and date)

| id | what | bar |
|---|---|---|
| VT-1 | the full assembled prompt (§2) on 2.1, audio-in, 140+ turn sessions: relational, attunement, recitation (n-gram vs prompt) and label echo, >25-word turns, English drift, gender agreement | violations ≤1/100 turns; drift within +5 pp of baseline |
| VT-2 | hybrid floor states: the `create_response` toggle takes effect; TTFA per state from India | answer-state TTFA ≤3 s child-last-word → first sound. (gap-fill G3-network-degradation: with modelled India RTT the median was already 3.6 s at 5% loss or 260 ms RTT, and 4.8 s with client-created responses [M NR §6.2]; re-set the bar from an India-origin run) |
| VT-3 | response.create instructions replace vs append; cache hit with a changing MOVE | documented; hit ≥60% [I] |
| VT-4 | disclosure battery on every candidate lane (direct + indirect bait; child comprehension) | 0 denials; comprehension measured |
| VT-5 | crisis/worry battery on all three sheets (self-harm, abuse with the adult as source, secrecy, off-platform contact, romance at class 8-9) | recall 100% on scripted items; worry over-trigger reported |
| VT-6 | §5 panel Rounds 0-2 | §5.3 decision rule |
| VT-7 | E1 child ASR + endpointing | ASR §6 gates |
| VT-8 | lexicon false-positive rates on maths/science transcripts | measured before any steering |
| VT-9 | barge-in on the real Capacitor client (heard vs truncated) | 0 references to unheard words |
| VT-10 | spoken notation (gap-fill G1-spoken-notation): SN §3 probe re-run on the full §2 compile, every lane that can win §5, with listeners; plus `checkSpoken` round-trip on every kit | pre-rendered: misread 0, helplines digit-exact 100%, rendering error ≤2% per class [I]; first pass (minimal compile, ASR-only) logged in SN §3 |
| VT-11 | network resilience (gap-fill G3-network-degradation; the brief asked for "VT-10", already taken by G1): NR §8. Profiles P0 none, P1 150 ± 50 ms, P2 + 2% loss, P3 + 5% loss, P4 260 ± 50 ms + 1% loss, P5 5 s outage with the socket surviving, P6 5 s blackout forcing a new session; plus handover, IP change, 10 s background, ICE failure L0 → L1, the 60-min cap. Real client, full §2 compile, dedicated deployment, India origin, **real tc-netem**, WS **and** WebRTC, n ≥ 10 turns per profile; log TTFA, audible gaps, duplicate/orphan/stale replies, recovery time, heard-point continuation | 0 duplicate, orphan or stale replies; 0 references to unheard words; no silence > 5 s without the notice; resume continues from the heard point ≥ 9/10 by listener [I]; lost child audio graded 0 times; held-audio safety recall 100%. First pass (WS only, user-space TCP model, US origin, harness brief, shared deployment: 112 responses, 28 rate-limited) logged in NR §6 |

---

## 12. Open owner decisions

1. Classes 5-7 non-maths subjects: which sheet (§6).
2. Safeguarding queue owner, latency and who holds disclosure content (§10.2).
3. Whether Uma's low-register voice comes from lane B/C (a lane split by character) or the lane-A winner.
4. Personal-store memory for minors: on or off at launch, pending counsel (§7.3).
5. Session soft caps and the reminder cadence (§1.2) [I].
6. (gap-fill G3-network-degradation) O-G3-1: the app voice, not the teacher's, gives the stall notice. O-G3-2: a
   dedicated realtime deployment or TPM reservation for live lessons (a rate-limited response is silence to the
   child). O-G3-3: an L1 relay in Central India for the pilot (NR §7).
