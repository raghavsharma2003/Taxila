# Duplex liveliness, Study D v2: the Continuous Conversational Engine (Griffin's decision principle on our cascade)

**Status:** design v2, 2026-10-04. Nothing here is wired.
- **What v2 does to v1.** It supersedes v1 wherever the two conflict. v1 is kept word for word as Appendix Z, and §0.1
  lists what was dropped and what carried over.
- **New files:**
  - this document;
  - `src/duplex/engine.ts`, the interface contract (types only; it type-checks under the repo `tsconfig.json` and loads
    under Node type stripping);
  - `evals/duplex/lexical-horizon.mjs` and `evals/duplex/results/lexical-horizon-2026-10-04.json` (measurement M-D6);
  - `context/inbox/duplex-v2.json`, plus write-ups in `context/decisions.md` and `context/rejected.md`.
- **Not done:** no commit, no push, no paid API call (M-D6 replays logs already on disk), no secret read. None of the
  Wave 2 files were touched (`server/routes/lesson.js`, `server/brain/**`, `src/child/lesson/**`); §11 is their
  integration plan.

**Why v2 exists: the owner's correction of 2026-10-04 (binding).**
- **The correction.** "Waiting for silence is the most reliable way to know someone finished" is the wrong premise, and
  that is why live and duplex models exist.
- **v1 was still silence-gated, in three places:**
  1. a 500 ms candidate silence opened every take-over decision;
  2. law 4 forbade any model decision inside the child's turn;
  3. a model could only *shorten* a hold.
- **What v2 puts in its place: Griffin's principle** [V, tavus.io/griffin, read 2026-10-04]. "Griffin makes
  conversational decisions at regular sub-second intervals rather than once per turn". "Perception is continuous, even
  while the PAL speaks". "A pause for thought is not treated as the end of the turn".
- **Griffin vs Taxila.** Griffin is a single, unified video-to-video model, not a cascade. Taxila keeps cascade
  *generation*:
  - the strong brain from the Azure router;
  - the DragonHD voice;
  - Hindi/Hinglish quality;
  - the safety predicate floor.

  On top of the streams it builds Griffin's *decision engine* as its own model.

**Inputs.**
- Studies A (`PRODUCTS.md`), B (`MODELS-PAPERS.md`) and C (`TURN-TAKING-CHILDREN.md`), and v1.
- The stopped prototype: `server/duplex/**` and `evals/duplex/**`, with measurements M-D2 to M-D5, which this document
  reads and keeps where sound (§12).
- `src/duplex/turnPolicy.ts`.
- MODEL-STACK §2, MODEL-ROUTER §0, STT-v3 §0 and §2.
- `context/rejected.md`, read first.
- The Griffin page.

**Tags.**
- [M]: measured here (M-D6).
- [T]: measured earlier in this repo; the path is cited.
- [V]: vendor-stated.
- [P]: from a paper (via Study A or B).
- [E]: estimate or assumption. Each one names the experiment that will replace it.

---

## 0. The answer on one page

### 0.1 What changes from v1

| | v1 (silence-gated) | v2 (continuous) |
|---|---|---|
| **what opens a decision** | a 500 ms candidate silence; then a lexical combiner commits or holds | an engine re-assesses on a 100 ms timer **and** on every stream event. Silence is one feature. A context-keyed silence backstop acts only while the engine stays uncertain |
| **a model inside the child's turn** | forbidden, except to shorten a hold (law 4) | the engine *is* a model: rules plus a fast LLM (stage A), then a trained multimodal model (stage B). It estimates pComplete, pHoldWanted, a backchannel opportunity and an overlap class continuously. A code **governor** keeps the vetoes |
| **"62" after "27 + 35?"** | ≥ 500 ms of silence, then the STT final | as soon as words that **cover all of the child's audio** say "a complete integer". No silence is needed; the only wait is the transcript's lag (the *lexical horizon*, §2.5.4) |
| **listening behaviour** | content-blind nods on backchannel opportunities | BACKCHANNEL (nod, "mm"; lexical continuers only in chit-chat, behind a flag) and REACT (face floor behaviours) sit on the same menu as speech |
| **while she speaks** | onset → duck → pause → the transcript decides. The simulated resolve took p50 1.70 s on D4 and 0.72 s on MAI [T, M-D3 sim, n=76] | the first 150-250 ms of overlap audio decide YIELD or KEEP_TALKING (yield ≤ 200 ms); the words confirm or revise |
| **carried over unchanged** | — | fast mouth, late verdict; safety on every partial, sticky; separate speech and work tracks; the floor on the device; content-blind nods; wait-time drafts; `heardUpTo`; result triage; the W2 seams |

### 0.2 The shape

```
 STREAMS (device clock)            PERCEPTION                          ENGINE                        GOVERNOR (code)          ACTUATORS
 mic 16 kHz ─► 20 ms frames ─────► ChildAudio: voicing, silence run,  ┐ 100 ms timer + every event   ┌ G1 safety (sticky)    ┐ voice: reply channel
   (RMS, YIN f0, pVAD*)            prosody, target speaker            │ (onset/offset, partial,      │ G2 safety barrier     │  play / hold / yield /
 STT stream ─► partials/finals ──► TranscriptView + LEXICAL HORIZON,  │  final, her playback,        │ G3 hold request       │  resume; clip channel
   (MAI probe | Nemotron | D4)     echo-subtracted                    ├─► EngineTick ─► DuplexEngine ─►│ G5 horizon            ├─► face: nod, REACT kinds
 her playback clock ─────────────► HerState, OverlapFeatures          │  screen, estimate)           │ G6 closed CUT_IN list │ think: draft, warm TTS,
 screen events ──────────────────► ScreenState                        │  stage A: rules + LLM        │ G7 verdict stability  │  STT probe
 Director (/turn ui.engine) ─────► EngineContext (FORM, never key)    │  stage B: trained model      │ G8 rate limits, G9 WT1│ build: prefetch →
 async LLM / acoustic model ─────► ModelEstimates (stamped)           │  (src/duplex/engine.ts)      │ G10 backstops; owns   │  WHEN_IDLE triage
 lexicons (turnPolicy, understand)► LexicalMarkers, SafetyState ──────┘                              └ FloorPhase ───────────┘
   * = not shipped yet
```

### 0.3 The laws (v2)

Each law has its evidence here and a reversal condition in §15.
1. **Decide continuously, and never wait for silence to start deciding.**
   - Griffin decides in sub-second mini-turns [V].
   - At age 9, 85% of child silences of 250 ms or more are pauses inside the turn, and silence alone separates pause
     from turn end at only AUC 0.62 [T, Study C].
   - In M-D6's scenario set, tuned 640 ms silence cut the child off in 15/25 turns [M].
2. **Confidence scales with irreversibility.**
   - The ladder, from cheapest to most costly when wrong: think (draft, warm TTS) < face (REACT, nod) < "mm" < a
     verdict-free uptake < a cut-in < a verdict.
   - The lower the rung, the earlier the engine may act.
3. **Fast mouth, late verdict.** Kept from v1, and now load-bearing.
   - With a fast ear, words plus horizon fired inside the self-repair pause in 3 of the 4 self-correction scenarios
     [M-D6 counterfactual, E]. No word-level rule can see a repair before it is said.
   - So she may *start* early, but a verdict on a value waits until the value is stable.
4. **Words count only once they cover the audio.**
   - On real D4 partials, words plus a silent child decided on a stale prefix ("Um, तीन" for "तीन बटा चार") and picked
     the wrong value in 5/13 decided closed items.
   - Adding the horizon guard took that to 0/11 [M-D6].
5. **Completeness is relative to the question and blind to the answer.**
   - "Is this a complete answer of the asked form", never "is this the right answer".
   - A faster reply to right answers would leak the verdict through latency. So the key never enters the engine.
6. **Perception never stops, even while she speaks.** Overlap is classified from acoustics within 150-250 ms, and the
   words confirm later.
7. **Safety runs on every partial, sticks for the turn, and comes before every audio act** (the pre-speech barrier,
   G2).
8. **Models estimate, code disposes.**
   - The governor's vetoes never depend on a model.
   - Any engine fault degrades to rules, then to a patient silence policy. It fails patient, never rude.
9. **Speech and work are separate tracks, and the floor lives on the device.** Kept from v1, with its evidence.

### 0.4 Acceptance (full table §7)

| metric | bar |
|---|---|
| gap after a true turn end that calls for a reply (child's last voiced frame → first audible teacher sound, STT final included) | **p50 ≤ 350 ms, p90 ≤ 700 ms** |
| false cut-offs on thinking pauses | **not worse than tuned 640 ms silence on the same set**, also ≤ 3% absolute and ≤ Smart Turn v3.2 off the shelf |
| real barge-in → her audio stopped | **p50 ≤ 200 ms** |
| she keeps talking through "haan haan" / "hmm" | ≥ 90% |
| backchannel placement | judged natural by blind raters; rate within 0.5-2× the human Hindi 0.079/s; illegal backchannels 0 |
| a wrong verdict spoken on a value the child then repaired | 0 |
| hold-request violations | 0 |
| out-of-policy cut-ins | 0 |
| non-safety speech after a distress partial | 0 |

**Can the gap bar be met?** On paper only, and only with a fast lexical ear in India plus a primed first sound [E].
- **Fast lexical ear:** MAI with a micro-commit probe, or Nemotron hosted in India.
- **Composition:** §8 adds it up to about 280-420 ms p50.
- **M-D6's re-timed fast-ear decision gap is about 300 ms before playback** [E].
- **On D4 the bar is out of reach.** Text arrives 713 ms after the audio it covers at p50 [T, M-D2], so M-D6's
  words-plus-horizon rule gave a 1,103 ms p50 gap [M].

### 0.5 Build order (every flag defaults to off)

1. The contract (done: `src/duplex/engine.ts`).
2. The governor plus the stage A engine, run in TaxilaFDB L1 (simulation) against the five baselines (§6).
3. L2 on real STT: the MAI micro-commit probe (DX-1) and D4.
4. Partial safety and `heardUpTo`, which are v1 rollout steps 1-2 and unchanged.
5. Shadow in real lessons (seam S10).
6. The listening face.
7. Stage B data and training.
8. L3 at the ear on India phones.
9. Engine on.

---

## 1. What binds this design

| binding | source | consequence here |
|---|---|---|
| **The continuous engine; silence is one feature plus a backstop, never the gate** | owner correction 2026-10-04 (`owner-duplex-no-silence-gate-2026-10-04`) | this document; supersedes v1 law 4 and the candidate gate |
| Cascade generation (STT → brain → TTS) is the default lane; full-session audio goes to STT | `voice-lane-cascade-default`, `owner-always-listen-full-session-2026-10-04` | the ear is always on, so the engine always has streams |
| Code makes decisions; models read, speak, build and write | `code-keeps-decisions-2026-10-04`; `model-full-orchestrator` (15/72 hard rule breaks, +1.4 s per decision) | **reconciled:** the engine's model *estimates* (perception); the governor (code) *decides* under hard vetoes. The action set is closed and typed, and everything below the verdict rung can be undone. Lesson policy stays in the kernel |
| Native speech-to-speech duplex for Hindi measured poor | `rj-native-duplex-teacher-2026-10-04` (IndicFDB: Human-1 content 0.56/5; GPT Live takes over in 38% of Hindi pauses) | no native duplex model now; §5.6 is the data path toward one later |
| Azure first; runtime inference on Azure or on the device | CLAUDE.md, MODEL-ROUTER §0 R5, owner brief | stage A LLM = Direct Foundry deployments; stage B on ACA CPU India or the device; training on Azure GPU if quota exists, else AWS for training only (≤ $60, every instance terminated) |
| Open weights with permissive licences only | owner brief | Smart Turn v3.2 (BSD-2) and Whisper encoder (MIT) for the audio branch; any text encoder must be Apache-2.0 / MIT / BSD with its licence file checked before use; no gated Hugging Face models |
| Child-safety floor | CLAUDE.md, `scan-safety-passive-ideation-2026-10-04` | §10; liveliness is never scored as "passes for human" (Griffin's own release hold is this hazard [V]) |
| No emotion inference from voice | `ct-no-voice-emotion-inference` | prosody is used for floor timing only; never an affect label, never stored as one |
| The face is verdict-neutral; the Moment is the only affect producer | `design-v2-rejected-correctness-face`, TEACHER-BRAIN TB6 | REACT kinds are floor behaviours only; backchannel timing is content-blind |
| Sentence-shaped text gets recited; no stock fillers | inherited law, `rj-static-filler-list`, `hv-instructed-nonverbals` | an uptake is built in code from the child's words; non-verbal sounds only from same-voice clips |
| Two drafts of the same reply are slower; streaming the reply buys nothing | `reply-two-drafts`, `reply-streaming-no-gain`, `tts-first-clause-no-gain` | one draft per distinct text key; the gain comes from *when* work starts |
| No live codegen to a child | `forge-live-codegen-race`, `live-free-generation` | builds launched from partial intent are prefetch only |
| Signals are keyed to their turn | `voice-features-latest-signals-race` | every estimate and draft carries a text hash; stale estimates are discounted (§2.5.2) |
| STT timing is the physics | M-D2 [T, n=28, US → eastus2]: D4 first partial 1,743 ms after onset; delta lag 713 / 1,477 ms; final after a client commit 915 / 1,311 ms; only 67% (p50) of the final tokens visible at true end + 500 ms. MAI: first partial 2.58 s; final 68 / 75 ms after commit from Chennai [T, STT-v3]. Nemotron-3.5: a partial every 320 ms, text complete 254 / 452 ms after speech end [T, STT-v3, GPU host] | the lexical horizon (§2.5.4) and the choice of ear (§8) |

---

## 2. The Continuous Conversational Engine

### 2.1 Clocks

| clock | period | what runs | where |
|---|---|---|---|
| frame | 20 ms hop (16 kHz, 40 ms YIN window) | RMS, f0, energy VAD, backchannel-opportunity dips, overlap onset; pVAD once enrolled (X3) | device worklet (exists: `featureWorklet.ts`, `dsp.ts`) |
| reflex | 1-2 frames after a non-echo onset while she speaks | **duck** her audio to gain 0.2. Not an engine decision: fully reversible | device (exists, ~90 ms onset [T]) |
| **engine tick** | **100 ms timer + every event** | build `EngineTick` → `engine.tick` → governor → actuators. Events: voice onset/offset, partial, final, her playback boundary, screen, estimate, context, safety | device |
| lexical | every STT update | transcript view, markers, `scanSafety` on the partial | device; the server slice keeps safety authority |
| semantic | on a stable-prefix change, debounced to ≥ 600 ms and ≥ 2 new words; open contexts only | fast Azure LLM read of completeness | server, async |
| acoustic model (stage B) | every 100-200 ms and on each voice offset | audio head over the last ≤ 8 s | ACA CPU India, or the device (ONNX), §5.2 |

**Why a 100 ms timer plus event ticks.**
- Griffin decides in "sub-second mini-turns" [V]; Sparrow-1 updates every 40 ms [V].
- The decisions that matter carry about 200 ms of human tolerance: the human Hindi gap is 259 ms [P, IndicFDB], and
  smooth human transfers start a median 151 ms *before* the turn ends [P, TurnBench].
- Event ticks remove quantisation from every decision triggered by a partial or an offset. The timer bounds the rest at
  ≤ 100 ms.
- A 20 ms engine tick buys nothing: the lexical stream changes every 300 ms or more.
- DX-3 sweeps 50, 100 and 200 ms [E].

### 2.2 The loop and who owns what

- **The host** (seam S10, a thin adapter beside `cascadeLink.ts`) builds the tick. It assembles:
  - frame features;
  - the transcript view, after echo subtraction and with the lexical horizon;
  - markers;
  - her state;
  - the context;
  - the pace profile;
  - screen events;
  - safety;
  - the latest stamped estimates.
- **The engine** proposes an `EngineDecision`: an action, the probabilities, reason codes and preparation hints. It
  also records `proposed`, the action it wanted before any veto.
- **The governor** (`src/duplex/governor.ts`, shared by both engines) applies the vetoes (§2.7), owns `FloorPhase` and
  emits the governed action.
- **The actuators obey.** They are the reply channel, the clip channel, the face, the draft manager, the STT probe and
  the build triage.
- **Logging:** in shadow mode the host logs one row per *change* of governed action or phase (not per tick), plus each
  decision's top reasons. It never logs child words (`w2e-brain-trace`) and never logs prosody as affect.

### 2.3 Features

The exact types are in `engine.ts`; this table summarises them.

| group | fields | source | freshness | used for |
|---|---|---|---|---|
| **ChildAudio** | voicing, voicedProb, silenceRunMs, voicedRunMs, turnVoicedMs, pausesThisTurn, onset/offset times, targetSpeaker | shipped `EnergyVad` + `dsp.ts`; pVAD later | 20-40 ms | everything timing; who is speaking |
| **ProsodyFrame** | f0, f0 slope (st/s over the last 300 ms voiced), f0 position in the child's session range, energy and its slope, final lengthening, speaking rate | `dsp.ts` YIN + RMS (prototype `ear.js` computes slopes) | 20-300 ms | finality vs continuation; backchannel opportunities; overlap competitiveness. **Timing only** |
| **TranscriptView** | text (echo-subtracted), stable prefix, stability, isFinal, word timings, **coverageEndMs, unseenVoicedMs**, source, lag estimate, text hash | the STT stream; host bookkeeping | 68 ms after a probe (MAI) to 713 ms+ (D4 partials) | semantics; draft keys; the horizon |
| **LexicalMarkers** | turnPolicy cue and p, **form state**, values, last value age, hold request, filler/open tail, projection, word search, repair open/repaired, yield tag, IDK, asks/question complete, stop/repeat, code switch at the edge, off-task ms | `turnPolicy.ts`, `understand.js` (cross-script lexicons, µs) | on every transcript change | completeness, holds, repairs, cut-in triggers |
| **HerState** | speaking (playback clock), heardUpTo, at a clause boundary, last act (asked yes/no, closed, open…), hand-over time, recent words, output level | `ttsStream.ts` playback clock + DragonHD word boundaries (seam S14) | 20 ms | overlap context, echo, WT1 clock |
| **EngineContext** | exchange (closed answer / open explanation / question to her / chit-chat / free), **expected form** (form, slots, units, options; never the key), question type, beat, band, language, weaker-language flag, WT1 ladder, cut-in permissions, backchannel permissions | Director, per hand-over (seam S6 `ui.engine`) | per turn | thresholds per context |
| **ChildPaceProfile** | sessions, hold-pause p50/p90, answer gap, speaking rate, filler rate, source, strain | `voice-features-longitudinal`; band defaults until session 3 (P12) | per session | silence normalisation |
| **ScreenState** | events since the last tick (tap, drag, pen, type, submit, choice pick, game action, aid request), busy | lesson UI / Studio module events | ≤ 1 frame | a busy child holds the floor without words; submit is a yield |
| **OverlapFeatures** | onset, duration, target speaker, echo likelihood, level above echo, onset f0, at her boundary, words, lexical kind, she asked yes/no | frames + her state + `overlapKind` | 20 ms (acoustics); words later | YIELD vs KEEP_TALKING |
| **SafetyState** | distress (sticky), kind, first hit, **checkedThroughMs**, source | `scanSafety` (the same module, device + server); model distress note | per partial (~31 µs predicate [T]) | G1, G2 |
| **ModelEstimates** | semantic (LLM) and acoustic (model), each with a text hash or audio time, issue/arrival times | async providers | 0.1-1 s | completeness on open contexts; the horizon tail |

### 2.4 The action space

Rung = the cost of being wrong, from 0 (free) to 6 (irreversible).

| action | legal in phase | the child sees or hears | rung | when wrong |
|---|---|---|---|---|
| HOLD | child's floor (default) | the listening pose | 0 | she is late; the missed-respond metric catches it |
| REACT (`listen_lean`, `still_with_you`, `thinking_glance`, `hold_pose`, `checkin_look`, `calm_attend`, `nudge_face`) | any (upper face during overlap) | face and posture only | 1 | a mistimed glance |
| BACKCHANNEL `nod` | child's floor; not in closed answers or safety | single continuer nod | 1 | a mistimed nod (content-blind, so never a verdict) |
| BACKCHANNEL `mm` | open explanation, behind a flag | same-voice non-lexical clip | 2 | a sound over the child; echo risk |
| BACKCHANNEL `haan` / `acchha` | chit-chat only, behind a flag (default off) | lexical continuer | 3 | in content it reads as "yes, correct" (Study C §0.6) |
| SPEAK | child's floor | her turn starts. On closed answers the first sound is an **uptake** (the child's own value or words re-voiced, verdict-free) | 4; the verdict word is rung 6 | a cut-off. Revocable until her verdict word (G7) |
| CUT_IN | child's floor while pHoldWanted is high, at a micro-pause, for a listed reason only | she takes a floor the child still holds | 5 | an interruption of reasoning |
| KEEP_TALKING | her floor | she continues and the duck lifts | 4 | talking over a child (G11 forces a yield after 1 s) |
| YIELD | her floor | she stops at the next word boundary (≤ 50 ms) or fades in 30 ms; `heardUpTo` reported; resumable | 2 | a needless restart |

### 2.5 pComplete and pHoldWanted: semantics given the context

**Definitions** (calibrated per context, §2.6).
- **pComplete:** the probability that the child's current contribution is complete, so that a teacher turn is now
  relevant. It is *projected* while the child is still voicing, which drives preparation; SPEAK still needs the governor
  (§2.7).
- **pHoldWanted:** the probability that the child wants the floor kept, so that a teacher turn now would interrupt.
- **They are not complements.**

  | case | pComplete | pHoldWanted |
  |---|---|---|
  | "ek minute" | ≈ 0 | ≈ 1 (long horizon) |
  | "pata nahi" | ≈ 1 | ≈ 0 |
  | "woh… kya kehte hain…" (word search) | low | moderate (a cue offer is allowed, §3.4) |
  | "तीन बटा आठ… नहीं" | ≈ 0 | ≈ 1 |
  | a child dragging a fraction bar in silence | low | high (screen busy) |

#### 2.5.1 The expected-answer grammar (closed answers): zero silence when the form is complete

The Director sends the **form** with each hand-over (seam S6): `{form, slots, units?, options?}`. The engine runs a
small cross-script grammar on the transcript and produces `FormState`: `none`, `pending`, `prefix_ambiguous`,
`complete` or `overfull`.

| form | complete when | pending / prefix-ambiguous when |
|---|---|---|
| integer | one value token: digits; a Hindi numeral (single words इक्कीस…निन्यानवे); an English compound ("sixty-two", "sixty two") | **prefix-ambiguous:** English tens alone ("sixty" → "sixty-two"); "सौ / hundred" alone ("दो सौ" → "दो सौ बीस"). **Pending:** a trailing operator or connective ("और", "plus", "बटा", "by") |
| fraction | numerator + बटा / बटे / by / upon / over + denominator. The STT's glued "बटाचार" is split (M-D6: a01 was never decided without this) | **pending:** a bare integer ("तीन") or "तीन बटा". M-D6: D4 showed "Um, तीन" while "बटा चार" was in flight |
| decimal | "दो दशमलव पाँच", "two point five" | "दो दशमलव", "two point" |
| number_unit | value + unit, or value + a verb-final close ("बारह cm होता है") | value alone (a unit may follow) |
| choice | an option label (pehla / dusra / first / B / "wala") or an option content word | — |
| yes_no | हाँ / नहीं / haan / nahi / yes / no, optionally followed by an address tail (didi, ma'am) | "haan… lekin" (open tail) |
| word / phrase | a content noun phrase with no open tail | prefix-ambiguous until prosody is final or 300 ms of silence |
| slots > 1 | `slots` values ("8 corners aur 12 edges") | fewer values plus an open tail ("8 corners aur") |
| overfull | more values than slots | a list or a repair: the stability clock restarts on the last value |

**The worked case: "62" after "27 + 35?"**
- The context is `closed_answer`, form `integer`, slots 1.
- The child says "बासठ".
- Once a transcript update shows "बासठ" with `unseenVoicedMs ≤ 120` and the child is not voicing:
  - the form is `complete` and no hold, repair or open marker is present, so pComplete ≈ 0.95 and pHoldWanted ≈ 0.05;
  - SPEAK follows, and its first sound is the uptake "बासठ…", verdict-free.
- No silence is waited for beyond the transcript's own lag. The verdict word plays no earlier than 1,200 ms after the
  value ended, provided the child has made no sound since (G7).

**Hesitation lowers the first value's pComplete.** If the turn hesitated before the value (`pausesThisTurn ≥ 1`, or a
filler), the first value's completeness is discounted, because a self-repair is likely: M-B1 found the first value
wrong in 21/21 hesitant answers [T]. Here the engine waits for prosodic finality plus about 300 ms [E, DX-6].

**Why the grammar never sees the key.**
- If correct answers got faster replies than wrong ones, the child would learn the verdict from latency. That is the
  same leak that made nods content-blind (`design-v2-rejected-correctness-face`).
- v1 §6.7 already kept key material off the device.
- The key reaches only the Director's classifier at `/turn`.
- The owner's brief said "expected answer form/key". The form is honoured, and the key is deliberately left out for this
  reason.

#### 2.5.2 Open explanations and questions: syntax plus a fast LLM

- **Syntax (code).**
  - Hindi is verb-final, so a clause that closes on a finite verb is a completion cue.
  - Projection is open: "जब…" with no "तो" yet; a copula with no complement; "answer hai…".
  - Tails that leave the clause open: conjunctions, postpositions, sequencing adverbs (the prototype found
    को / ने / तक / पहले).
  - Conclusion markers ("isliye", "toh answer hai") close an explanation.
  - **Caution from M-D6 d02:** the STT dropped the complementiser "कि" from "denominator बताता है कि…". The text then
    read as a complete verb-final clause, so text alone cut the child off. Prosody (level contour) or stage B's audio
    must cover this.
- **The semantic estimate (stage A).**
  - The fast Azure LLM gets the question, the beat and the stable prefix, and returns
    `{pComplete, pHoldWanted, asksHer, offTask}` as typed JSON.
  - Measured on 140 prefixes, US → eastus2, M-D5 [T]:

    | deployment | latency p50 / p90 | ECE | precision at 0.9 | cost per call |
    |---|---|---|---|---|
    | grok-4-1-fast-nr | 490 / 957 ms | 0.068 | 49/56 | ≈ $0.0011 |
    | taxila-fast | 963 / 1,202 ms | 0.062 | 63/71 | ≈ $0.00006 |

  - **It is too slow for the zero-silence path.** It informs pauses of 600 ms or more in open contexts, where the
    decision window is wide.
  - **Freshness:** its weight is 0 once `forTextHash ≠ transcript.textHash`, and it decays over 1.5 s after arrival.
- **Questions to her.** `asks` together with `questionComplete` (a wh-word plus a verb-final close such as "होता है?",
  a tag, or an ASR "?") raises pComplete fast. A child's question deserves a fast answer, an identity question above all.

#### 2.5.3 Hinglish continuation and yield markers (code, cross-script; Study C §5, M-C1)

- **Hold markers (they raise pHoldWanted and cap pComplete):**
  - fillers, in the 15 spellings our STT produces;
  - *haan toh*, *matlab / yaani*;
  - *woh / jo / wala*;
  - *kya kehte hain* (a word search);
  - explicit hold requests (*ruko / ek minute / soch raha hoon / sochne do / wait*);
  - projection (*mujhe lagta hai…*, *answer hai…*);
  - trailing *aur / phir / kyunki / lekin / ki / toh*;
  - an ASR comma;
  - a code switch at the edge (P11).
- **Yield markers (they raise pComplete):**
  - clause-final *na / hai na*;
  - a finite verb or auxiliary last;
  - *bas / itna hi*;
  - IDK, *samajh nahi aaya*, *phir se*;
  - a complete wh-question.
- **Self-repair** (*नहीं नहीं, sorry, matlab nahi, galti*, or a second, different value):
  - a repair marker after the last value means the correction is still coming: pComplete ≤ 0.1;
  - a value after the marker means the correction came: the stability clock restarts.
- **Lexicon order matters.** The hold lexicon runs before the value grammar. In M-D6 (h01), "एक मिनट" was first visible
  as "एक" and read as the value 1 on D4.

#### 2.5.4 The lexical horizon (new, measured)

**Definition.** `coverageEndMs` is the audio time the visible text covers. `unseenVoicedMs` is the child's voiced audio
after that point. While it is large, every lexical feature describes an old prefix of what the child has said.

**How the host knows coverage, per ear:**

| ear | coverage | horizon quality |
|---|---|---|
| **Nemotron-3.5** (scale lane) | token timestamps | exact; text complete 254 / 452 ms after speech end [T] |
| **MAI-Transcribe-2-Streaming, micro-commit probe** (pilot lane) | at an acoustic micro-pause of ≥ 150 ms with falling energy, the engine sets `prepare.sttProbe` and the host sends `input_audio_buffer.commit`. The final covers all audio up to the commit | exact; the final arrives 68 / 75 ms after the commit from Chennai [T]. Probes are free if streaming bills by audio hour [E: billing basis unverified, MODEL-STACK A8]. **DX-1 must show that splitting items at micro-pauses does not hurt accuracy** |
| **D4 gpt-live-transcribe** | no timings; deltas lag 713 / 1,477 ms; a client commit returns its final in 915 / 1,311 ms [T, M-D2] | conservative only (coverage = t − lag p90): structurally slow |

**The rule.**
- The engine discounts lexical completeness when `unseenVoicedMs > 120 ms`.
- G5 vetoes SPEAK and CUT_IN there, unless a fresh acoustic estimate vouches for the unseen tail (stage B; or Smart Turn
  as a feature once X1 validates it).
- That acoustic branch is the only way below the lexical lag in open contexts.

**The evidence (M-D6, Appendix A).** Real D4 partials from 25 scenarios:

| rule | premature (child had more to say) | wrong value at decision (closed items) | gap p50 |
|---|---|---|---|
| words + silent child | 4/25 | 5/13, mostly stale prefixes | 907 ms |
| with the horizon guard | **0/25** | 0/11 | 1,103 ms (lag-bound) |

With a fast ear (re-timed [E]), the horizon rule's decision gap is about 305 ms. Its only premature decisions are the
3 self-corrections that law 3 covers.

#### 2.5.5 Prosody (timing only)

- **The features:**
  - finality: falling f0 into the child's low tercile, falling energy, final lengthening > 1.3;
  - continuation: level or rising f0 with no lengthening. This is the cue that covers the dropped "कि".
- **Stage A** uses them as bounded terms (§2.5.8).
- **Synthetic training data must render the pause inside one synthesis call** (SSML `<break>`), so that the prosody
  before the pause is continuation-like (§5.3).
  - The M-D2 / M-D6 clips were synthesised one segment at a time, so every segment ends in a final contour. That
    corpus can test words and timing, never prosody.
  - Prosodic weights learned on synthetic data stay inside their stage-A bounds until E1 confirms them on children.

#### 2.5.6 The child's own pause profile, and silence as a feature

- **Silence enters as a normalised term:** `s = silenceRunMs / holdP90`.
  - `holdP90` is the child's p90 of within-turn pauses that ended in the child resuming.
  - It is multiplied by 1.3 when the child answers in a weaker language (P4, P11).
  - The term is `w_sil[ctx] · log(1 + s)`: monotone and saturating, so a long silence makes "done" more likely without
    ever deciding alone.
- **Band defaults until session 3** [E, replaced by E1 and the TaxilaFDB synthetic priors]:

  | band | hold pause p50 | hold pause p90 |
  |---|---|---|
  | B2 | 700 ms | 2,000 ms |
  | B3 | 600 ms | 1,600 ms |

- **After session 3** the child's own distribution takes over. It never drops below the band defaults while strain is
  suspected (P12).

#### 2.5.7 Screen interaction

- `screen.busy` (a drag held, the pen down, typing) adds to pHoldWanted: the child is answering with their hands.
- A `submit` or `choice_pick` event is a strong yield on closed items. It is the non-verbal "done".
- An `aid_request` ("dikhao") raises the Studio prefetch key (§4.3).

#### 2.5.8 The stage A combiner (starting form; weights [E], fitted in DX-3)

```
z_C = b[ctx]
    + 2.5·form_complete − 1.5·form_prefix_ambiguous − 3.0·form_pending − 1.0·first_value_after_hesitation
    + 1.2·logit(lexP)                                   // turnPolicy, cross-script
    + 1.0·fresh_sem·logit(semantic.pComplete)           // open contexts only
    + 1.0·fresh_ac·logit(acoustic.pComplete)            // 0 until X1 / DX-8 validate the audio model
    + 0.6·prosody_final − 0.6·prosody_continue          // bounded until E1
    + w_sil[ctx]·log(1 + silenceRunMs / holdP90)
    + 1.5·yieldTag + 1.5·idk + 1.2·questionComplete + 1.0·screen_submit
    − 3.0·repairOpen − 2.0·holdRequest − 1.5·openTail − 1.5·fillerTail − 1.2·projection − 1.0·wordSearch
    − 0.8·codeSwitchAtEdge − 4.0·[unseenVoicedMs > 120]
pComplete   = calib[ctx]( σ(z_C) )

z_H = c[ctx] + 4.0·holdRequest + 2.0·repairOpen + 1.5·max(fillerTail, openTail, projection, wordSearch)
    + 1.0·screen.busy + 1.0·child.voicing − 1.5·yieldTag − 2.0·idk − 1.0·questionComplete − 1.0·form_complete
    − w_hsil[ctx]·log(1 + silenceRunMs / holdP90)
pHoldWanted = calib[ctx]( σ(z_H) )
```

- **Fitting.**
  - The weights are fitted per context by logistic regression on the TaxilaFDB dev split (DX-3).
  - Calibration is isotonic, on a separate calibration split.
  - Thresholds are chosen on dev and **frozen before the test split runs**. M-C1 v2, tuned on both splits, was
    in-sample: the lesson is kept.
- **Belt and braces.** Hold requests, an open repair and the horizon are also hard governor vetoes (§2.7). A mis-fitted
  weight cannot override them.

### 2.6 Contexts, thresholds and calibration (starting values, all [E])

| context | SPEAK when pC ≥ / pH ≤ | in the uncertain band | silence backstop (engine still uncertain) | verdict word not before | backchannels allowed |
|---|---|---|---|---|---|
| **closed_answer** (integer, fraction, decimal, choice, yes/no, word) | **0.85 / 0.20**, with the horizon covered | REACT `still_with_you` | after a value: max(700 ms, holdP50). With no value yet: 1,500 ms, then SPEAK a non-verdict prompt (code-built, never a stock line) | the last value has aged 1,200 ms with no child sound (G7; DX-6) | none: no nods inside a closed answer |
| **open_explanation** (teachback, explain, worked step, contrast, probe, reflect) | **0.90 / 0.10** | REACT `still_with_you`; nods on backchannel opportunities | max(2,000 ms, 1.2 × holdP90), capped at 3,000 ms; then SPEAK with uptake and a continuation prompt | n/a (graded by a model at `/turn`) | nod ≤ 1 per 3 s; "mm" behind a flag, ≤ 1 per 12 s, ≥ 4 s into the explanation, in a ≥ 400 ms falling pause |
| **question_to_her** (detected, or after she invites questions) | **0.75 / 0.25** | REACT `listen_lean` | 800 ms | n/a | nod |
| **chit_chat** (rapport, arrival, wrap) | **0.70 / 0.30** | — | 700 ms (adult-like) | n/a | nod; *haan / acchha* only behind a flag |
| **free** (no item on the table) | 0.80 / 0.25 | — | 1,000 ms | n/a | nod |
| **hold_requested** | never SPEAK; CUT_IN `hold_offer` at 15 s | REACT `hold_pose`; `checkin_look` at 8 s | — | — | none |
| **safety_attend** | SPEAK `safeguard` at pC ≥ 0.6, or after 1,500 ms of silence; CUT_IN `safety` (self_harm only) at a held pause ≥ 1.5 s; never over the child's voice | REACT `calm_attend` | 1.5 s; a presence line after 6 s of silence (P10) | — | none |
| **handover** (WT1: she asked, the child is silent) | SPEAK `wt1_nudge` at `ctx.wt1.voiceMs` | REACT `nudge_face` at `ctx.wt1.faceMs` | the P4 ladder (recall: B2 4 s then +3 s; reasoning: B2 7 s then +4 s; × 1.3 in a weaker language) | — | — |

**Calibration.**
- pComplete must reach ECE ≤ 0.05 per context on the TaxilaFDB test split, and again on E1.
- Reliability plots are logged.
- Each threshold minimises the median gap on dev, subject to two constraints: cut-offs no worse than S640 on the same
  split, and ≤ 3% absolute.

### 2.7 The governor (code; the one copy both engines run behind)

The first matching rule wins. Every veto writes its reason code and keeps the engine's `proposed` action for the logs.

```
G1  SAFETY (sticky)    safety.distress → phase safety_attend. Legal: HOLD; REACT calm_attend; YIELD if her audio plays;
                       SPEAK safeguard (pC ≥ 0.6 or silence ≥ 1.5 s, never over child voice); CUT_IN safety (kind
                       self_harm, held pause ≥ 1.5 s). Anything else → HOLD [veto_safety]. Quarantine every non-safety
                       draft and warm audio of the turn (v1 law 5).
G2  SAFETY BARRIER     an audio act (SPEAK, CUT_IN, BACKCHANNEL mm|haan|acchha) needs
                       safety.checkedThroughMs ≥ transcript.coverageEndMs → else HOLD [veto_safety_unchecked].
G3  HOLD REQUEST       markers.holdRequest → phase hold_requested until the child voices again; SPEAK and CUT_IN vetoed
                       except CUT_IN hold_offer at 15 s; REACT hold_pose, checkin_look at 8 s; WT1 timers suspended.
G4  PHASE LEGALITY     the action must be legal in the phase (§2.4) [veto_phase].
G5  HORIZON            SPEAK / CUT_IN with unseenVoicedMs > 120 and no fresh acoustic estimate ≥ 0.8 → HOLD [veto_horizon].
G6  CUT_IN LIST        reason ∈ {safety, word_search_cue, off_task_drift, question_to_her, hold_offer} AND its condition
                       (§3.4) AND a micro-pause ≥ 200 ms; never over child voice [veto_cutin_policy].
G7  VERDICT STABILITY  a SPEAK on a closed answer carries verdictNotBefore = lastValueEnd + 1,200 ms; until then only the
                       uptake or a verdict-free opening may play. A child onset before her verdict word → YIELD revoke,
                       merge the fragments, re-plan (P8; the server marks the first row superseded, seam S2).
G8  RATE AND LEGALITY  nod ≥ 3 s apart; "mm" ≥ 12 s apart; haan/acchha only in chit_chat with the flag
                       [veto_lexical_backchannel]; no backchannel inside a closed answer; visible REACT changes ≥ 500 ms
                       apart [veto_rate_limit].
G9  WT1 PROTECTION     phase handover with no child speech: SPEAK only from the ladder [veto_wt1_protected] (P14).
G10 BACKSTOPS          pC inside the context's uncertain band AND silence ≥ the context backstop → SPEAK backstop_silence.
                       Engine stale (no decision in 500 ms, or a throw) → stage A rules [fallback_rules]; stage A fault
                       → the patient silence policy (900 ms, today's behaviour) [fallback_silence].
G11 HER FLOOR          child voicing at targetSpeaker ≥ 0.5 (or unknown) for ≥ 1,000 ms while she speaks → YIELD,
                       whatever the classifier says; lexical stop / repair / "nahi" → YIELD.
```

### 2.8 What silence means now

Silence is a feature and a backstop. Griffin's phrase "what a sustained silence means" [V] becomes, per phase:

| phase | a sustained silence means | the engine's response |
|---|---|---|
| handover | the child is thinking (WT1) | REACT nudge face, then a verbal re-entry on the P4 ladder; never a repeat of the question |
| after a complete closed answer | **she is late** | this is the missed-respond metric (A11); it should have been a zero-silence SPEAK |
| a pause inside an explanation | thinking | HOLD with a visible `still_with_you`; backstop at 2-3 s |
| hold_requested | time granted | the face only, up to 8 s; an offer at 15 s |
| safety_attend | the child may say more | presence; a gentle line after 6 s; never a leading question |
| a word search | the child is stuck on a word | CUT_IN `word_search_cue` after 1.5 s, offering a cue, never the target term |

### 2.9 Worked timelines (the fast-ear lane; times after the child's offset, all [E])

Each case gives the child's words, then the engine's response.

1. **Fluent closed answer: "बासठ"** (after "27 + 35?").
   - +150 ms: probe commit.
   - +218 ms: MAI final, plus 40 ms India RTT [E].
   - +260 ms: the form is complete and the horizon covered. SPEAK, first sound the uptake "बासठ…".
   - About +320 ms: first audible sound (primed clip, §8).
   - About +1,200 ms after the value: the verdict word.
2. **Hesitant closed answer: "उम्म… (900 ms) …बासठ".**
   - The filler tail gives pHoldWanted ≈ 0.9: HOLD, with REACT `still_with_you` at about 300 ms. No draft starts.
   - After "बासठ", the same as case 1, but the first-value discount applies (§2.5.1). The engine waits for prosodic
     finality plus about 300 ms [E].
3. **Self-repair: "तीन बटा आठ… (600 ms) नहीं नहीं, तीन बटा चार".**
   - At about +300 ms the form is complete: SPEAK, uptake "तीन बटा आठ…" in flat prosody.
   - At +600 ms the child says "नहीं" during the uptake: YIELD `revoke` at the next word boundary.
   - The fragments merge. After "तीन बटा चार", SPEAK again; the verdict comes 1.2 s after that value.
   - **Cost:** about 300 ms of overlap and no wrong verdict.
   - **Alternative:** wait for prosodic finality plus 400 ms on every first value. DX-6 picks between the two on E1
     repair-pause data.
4. **Explanation with pauses: "क्योंकि cube के सारे faces (1.4 s) square होते हैं (1.2 s) इसलिए सब edges बराबर होते हैं".**
   - After "faces": an open tail. HOLD, nod at the backchannel opportunity.
   - After "square होते हैं": verb-final, but the "क्योंकि" clause has its reason and no conclusion. The semantic
     estimate puts pC at about 0.6: REACT `still_with_you`. A 1.2 s silence is under the 2.0 s backstop: HOLD.
   - After "इसलिए … होते हैं" with falling prosody: pC ≈ 0.93, SPEAK.
   - **Contrast:** M-D6's words-only rule on D4 cut this child off at "Square" (the plain ≥ 6-token rule).
5. **Hold request: "एक मिनट" (3.5 s) "हाँ, बारह".**
   - The hold request is honoured: `hold_pose`, no WT1.
   - When the child resumes, the floor returns to `child_turn`. "हाँ, बारह" makes the form complete (the value comes
     after the hold): SPEAK.
6. **A question mid-explanation: "…तो denominator बड़ा होगा… दीदी ये denominator क्या होता है?"**
   - `asks` and `questionComplete` turn the context into question_to_her: CUT_IN `question_to_her` at a ≥ 200 ms
     micro-pause.
   - If pHoldWanted is already low, it is a plain SPEAK instead.
7. **"हाँ हाँ" at her clause boundary.**
   - Onset → reflex duck.
   - At 150 ms of voicing: at her boundary, a short burst, low energy, onset pitch not raised, the target speaker. The
     continuer score is about 0.8: KEEP_TALKING, and the duck lifts. The words confirm later.
   - If her last line was a yes/no check, the "हाँ" is an answer: YIELD.
8. **TV or a sibling while the child is thinking.**
   - Voicing at targetSpeaker 0.2 (when enrolled) is not the child: HOLD continues. On her floor: KEEP_TALKING
     (`background_speech`).
   - Without enrolment, addressee cues ("mummy…") and an off-topic semantic read classify it as side-talk [E, X3].
9. **Disclosure after a value: "छप्पन… और मुझे खुद को चोट लगानी है".**
   - With a fast ear she may already have started the uptake "छप्पन…". M-D6 found this in 2/3 distress scenarios
     [M counterfactual].
   - The distress partial triggers YIELD `safety` at once and phase `safety_attend`.
   - No verdict can have played: the verdict delay (1.2 s) is longer than the time to the disclosure.
   - The safeguard plays at a transition point, or after 1.5 s of silence.

---

## 3. Full duplex output: listening while she speaks

### 3.1 Echo: three layers

1. **Browser acoustic echo cancellation** (`getUserMedia` `echoCancellation: true`), already on.
   - Device classes where it is weak are found by the existing EchoProbe and by `cascadeLink.ts`'s 3-strike
     local-pause self-calibration.
   - On a weak device, audio backchannels stay off and the onset threshold rises.
2. **Known-text subtraction.**
   - We know exactly what she is saying: her text and its DragonHD / Azure word-boundary timings (seam S14).
   - Before markers are computed, any transcript token that matches one of her words played in the last 2 s is removed,
     using the consonant-skeleton match that already exists in `cascadeLink.ts`.
   - `transcript.echoRemovedTokens` counts the removals.
   - This keeps her own words out of the child's turn: the gpt-realtime family's classic self-barge-in.
3. **A playback-aware onset threshold** (double-talk detector).
   - While she speaks, a child onset needs mic energy above both the room floor + 12 dB and her output level + a margin
     learned per device.
   - `overlap.levelOverEchoDb` exposes the margin, and `overlap.echoLikelihood` combines all three layers.
   - pVAD (target speaker) adds a fourth layer once the child is enrolled (X3; FireRedChat: false barge-ins 10.2% vs
     33.4% [P]).

### 3.2 The overlap classifier

**Classes:** continuer, barge_in (sub-kinds turn, answer, repair, stop, fold_in), side_talk, background_speech, noise,
echo.

**Evidence available within 150-250 ms:**
- onset position relative to her clause boundaries: continuers live in her backchannel slots, barge-ins mostly do not;
- duration so far;
- energy above the echo estimate;
- onset f0 relative to the child's range (a raised onset is a competitive cue [P, interruption prosody literature via
  Study B]);
- target-speaker score;
- echo likelihood;
- whether she just asked a yes/no question (then "haan / nahi" is an answer, P7);
- the count of recent overlaps.

**Words arrive later** (`overlapKind`, 16/16 on M-C1 [T]) and confirm or revise. A revision toward barge_in yields at
once (a late yield). A revision toward continuer after a yield resumes from `heardUpTo` if the overlap ended within
700 ms (Voice-Light keeps paused audio resumable for 800 ms [P]).

**Stage A** is a rule score over these features: the prototype's `bargein.js` logic for words plus an acoustic prior.
**Stage B** adds an overlap head on the same audio encoder (§5.2), trained on the synthetic overlap set: LiveKit's
pattern, 86% precision and 100% recall at 500 ms [V].

### 3.3 Yield within 200 ms on a real barge-in

| step | budget | basis |
|---|---|---|
| onset detected (20 ms hop, 2 voiced frames above the double-talk threshold) | 40-60 ms | `dsp.ts` hop; EnergyVad today ~90 ms [T] |
| reflex duck to gain 0.2 | +1 frame | exists |
| classifier decision at 150 ms of voicing | ≤ 10 ms compute | stage A rules (µs); stage B head ≤ 30 ms on ACA, ≤ 60 ms on device [E] |
| stop at the next word boundary (≤ 50 ms) or a 30 ms fade | ≤ 50 ms | playback clock + word timings |
| **her audio −20 dB at the child's ear** | **≈ 200-250 ms p50 [E]** | DX-5 measures it |

**For comparison:**

| system | time to stop on a real interruption | source |
|---|---|---|
| GPT-Live-1 | 1.41 s median | [T, turnprobe via Study A] |
| GPT-4o Realtime | 0.23 s | [P, FDB v1.5] |
| the v1 prototype in simulation | resolve p50 1.70 s on D4, 0.72 s on MAI | [T, M-D3, n=76] |

**Keep talking through "haan haan".** KEEP_TALKING is the default for a continuer-shaped onset (short, low, at her
boundary). G11 still forces a yield if the child keeps voicing for 1 s.

### 3.4 CUT-IN policy (the closed list; G6)

| reason | condition (all must hold) | what she says | never |
|---|---|---|---|
| `safety` | safety_attend, kind `self_harm`, a held pause ≥ 1.5 s (LateIntent [P]) | the safeguarding reply: care plus 1098 / 14416 in the same turn | over the child's voice; abuse and fear disclosures wait for a transition point or 3 s (NSPCC: let them go at their own pace [S via Study C]) |
| `word_search_cue` | `wordSearch` marker plus ≥ 1.5 s of silence; `ctx.cutIn.wordSearchCue = "offer"` | a cue (first sound, a picture, a choice), built by the Director (seam S12) | the target term itself, when the term is what is being learned |
| `off_task_drift` | `offTaskMs` ≥ 20 s (B2) / 30 s (B3); a micro-pause ≥ 300 ms; not mid-clause (no open tail) | a redirect that opens with uptake of the child's own words | during a disclosure; during a hold request |
| `question_to_her` | `asks` and `questionComplete`; a micro-pause ≥ 200 ms | the answer (identity questions answered honestly) | treating it as rhetorical |
| `hold_offer` | hold_requested for 15 s with no child speech | an offer the child can refuse: a hint, a choice, or "baad mein" | a repeat of the question; naming the silence |

**Explicitly never a cut-in** (Study C P1, P9; Study B SHANKS):
- a misconception heard mid-explanation (answered at the transition point, with the child's own words);
- a wrong step;
- a slow child;
- a filler;
- a code switch.

SHANKS's think-while-listening interrupter cut off 24.9% of fully correct solutions [T].

### 3.5 Her own floor cues (P13), unchanged from v1

- Her questions end with a clear yield cue.
- She never pauses mid-turn right after a clause-final verb.
- She never trails off on "toh…".

These are checked in code in the delivery planner (`expressive/seam.js`). Every child pause the engine has to interpret
was often caused by an ambiguous cue from her.

---

## 4. Think while listening: the pComplete trajectory drives preparation

### 4.1 Preparation by threshold, with hysteresis

| hint | starts at | cancels at | what runs | caps |
|---|---|---|---|---|
| `draft: start` | projected pComplete ≥ **0.5** (allowed while the child is still voicing) | pComplete < **0.35** for ≥ 300 ms, or a new stable-prefix hash | one reply generation keyed by `(lessonId, turnSeq, itemId, gen, textHash)` through the prototype's `DraftManager` (speculation via the W2 `speculate()`, imported, not edited) | ≤ 3 generations per turn; debounce 300 ms; ≥ 1 new word |
| `warmTts: start` | pComplete ≥ **0.8** and a draft exists | as above | open the TTS stream; synthesise the uptake and the first clause into a `held` buffer, never audible | 1 warm per generation |
| `sttProbe` | an acoustic micro-pause ≥ 150 ms with falling energy, on the MAI lane | — | a client `input_audio_buffer.commit` (the horizon, §2.5.4) | ≤ 1 per voiced run |
| promote | SPEAK, with the committed text hash equal to the draft's | — | the held audio plays (Voice-Light's lexical-identity rule [P]) | — |

### 4.2 Wait-time drafts (v1 W, kept)

On a code-gradable closed item, the server drafts the reply body per likely outcome and synthesises uptake clips while
the child is still thinking.
- These are keyed without the child's words (seam S5) and held **server-side**, because the key is involved.
- M-D3 simulation: wait-draft hit rate 147/164 (0.90) on D4 and 135/164 (0.82) on MAI [T, sim]. That is far above the
  candidate-speculation hit rate of 64/243 (0.26).
- This is the path to a primed first sound (§8).

### 4.3 Builds from partial intent (v1 BUILD loop, kept)

- **Triggers:** a `misconception{id}` signature in a partial, an on-topic curiosity question, or an `aid_request`
  screen event set `prepare.buildIntent`.
- **What runs:** prefetch only (a library lookup, T1 parameters, a whiteboard script draft).
- **Results are triaged** INTERRUPT (safety) / WHEN_IDLE / SILENT (v1 §2.5). A reveal waits for a transition point and
  the kernel's attention budget.
- Griffin "builds while talking" through one model. We do it through two tracks that never block each other.

### 4.4 Churn and its cost (measured in simulation)

- **M-D3** (308 simulated turns, v1 floor manager) [T, sim]:
  - 77% of draft tokens were wasted: 3,621 tokens per turn;
  - at gpt-5.6-luna prices ($0.20 / $1.20 per 1M) that is about **$0.06 per lesson-hour** at 80 turns [E].
- **v2 launches drafts earlier**, on projected pComplete, so churn rises.
  - The caps above hold it at ≤ 3 generations per turn.
  - DX-3 reports realised saving against redundancy (Endpoint Anticipation's metric: −505 ms for +28.4% compute [P]).
  - If waste passes 85% of tokens, the draft threshold rises to 0.6.

---

## 5. The engine model plan

### 5.1 Stage A: rules plus a fast Azure LLM (build first)

- **The estimator:** §2.5.8 over code features, with the semantic LLM on open contexts only.
- **The LLM call.**
  - **When:** the stable prefix changes by ≥ 2 words and ≥ 600 ms have passed since the last call, in open_explanation,
    question_to_her or chit_chat.
  - **Payload:** the question, the beat and the stable prefix. No child id, and nothing stored (`w2e-brain-trace`).
  - **Output:** strict JSON `{pComplete, pHoldWanted, asksHer, offTask}`.
  - **Primary:** grok-4-1-fast-nr, faster in M-D5. **Fallback:** taxila-fast.
  - **Wiring is decided by DX-4** from India, including whether a token-logprob score beats the stated probability.
- **Expected volume:** about 20 open turns × 6 calls = 120 calls per lesson-hour [E].
- **Why stage A first:**
  - it is explainable (every decision has reason codes);
  - it is deterministic in simulation with recorded estimates;
  - it ships without training data;
  - it is the baseline stage B must beat.

### 5.2 Stage B: a trained small multimodal engine

| part | choice | why |
|---|---|---|
| **audio branch** | Smart Turn v3.2 backbone (Whisper-tiny-class encoder, ~8 MB int8, BSD-2; Whisper MIT), fine-tuned. Rolling window ≤ 8 s ending at t; inference every 100-200 ms and on each voice offset | open, permissive, already chosen for `wb-predictive-endpoint`; 10-100 ms CPU [V]. It reads the audio **past the lexical horizon** |
| **text branch** | a small multilingual encoder over the stable prefix, plus a horizon token (`unseenVoicedMs` bucket). Candidates, each used only after its licence file is checked: MuRIL, IndicBERT-v2, multilingual MiniLM, Qwen2.5-0.5B. Runs on transcript change only (≤ 3 Hz); embedding cached | Hinglish in both scripts; text adds the semantics that audio-only detectors lack (Brahimi: text adds little for children [P], so it gets a small branch) |
| **context tokens** | exchange context, answer form and slots, beat, band, her last act, pace stats (log hold p50/p90, rate), log silence, `unseenVoicedMs`, screen busy, phase | the feature generic detectors lack (Study B §7.3) |
| **fusion and heads** | a 2-layer transformer over [audio CLS, text CLS, context embeddings]. Heads: pComplete, pHoldWanted, pBackchannel, overlap class (6), time to the next child onset (hazard bins, Next-Turn style [P]). Per-context temperature plus isotonic calibration | one model, all floor estimates |
| **size and latency** | ≤ 20 MB int8 in total (fits `models/duplex/`); ≤ 30 ms per inference on ACA CPU (2 vCPU) and ≤ 60 ms p95 on a mid-range Android phone (ONNX Runtime Web, wasm/SIMD) [E, DX-9] | device first if DX-9 passes; else ACA in southindia (+20-60 ms RTT [E]) |
| **interface** | implements `DuplexEngine`; inference in `infer()`; the result is read from its own state on the next tick, stamped with `atMs` | the same governor and host as stage A |

### 5.3 The data plan: labels by construction

1. **Dialogue plans** (scripts under `scripts/duplex/**`).
   - An Azure model (taxila-fast or gpt-6-sol) writes structured JSON plans, not prose.
   - Each plan holds:
     - the context;
     - her line (for the echo and overlap channel);
     - the child's utterance as segments with typed events: filler (one of the 15 spellings), pause(ms),
       self-repair, hold request, word search, code switch, yield tag, question, distress (drawn from the existing S/S2
       sets, never newly written disclosure lines);
     - overlap events during her line: continuer, barge-in kinds, side-talk.
   - Coverage: NCERT classes 4-7 maths and science items, from the kits; values, fractions, units and terms; Hindi,
     Hinglish and English mixes; B2/B3 register.
2. **Rendering with prosody by construction.**
   - Azure Speech SSML, **one synthesis call per child utterance**, with in-utterance `<break time="…ms"/>`. The prosody
     before a mid-utterance pause then stays continuation-like.
   - The M-D2 corpus could not do this: it concatenated separately synthesised clips, so every pause followed a final
     contour.
   - Child-likeness comes from SSML pitch and rate on Neural hi-IN / en-IN voices, or from a post-hoc pitch shift (the
     repo's ×1.2 recipe). Prosody `rate` is not used on DragonHD (`rj-prosody-rate-on-dragonhd`).
   - Whether a Hindi child voice exists in the Azure catalogue is unknown [E: check the voice list].
   - Fillers are rendered as words; TTS that drops them fails a render check, which drops the sample.
3. **Compositional assembly** (the cost lever). About 25k unique utterance renders are recombined with:
   - pause durations drawn from child-like priors;
   - her TTS lines from the DragonHD cache;
   - echo leakage at −10 to −30 dB through a short impulse response plus a nonlinearity (AEC residue);
   - noise beds at SNR 0-20 dB: Hindi TV-like speech rendered by TTS, a sibling's child voice, kitchen (pressure-cooker
     whistle), traffic, fan;
   - a phone-microphone impulse response;
   - Opus at 16-24 kbps.

   That yields hundreds of hours of labelled streams from about 1M characters of TTS [E].
4. **Labels by construction**, on every 100 ms tick:
   - pComplete: 1 from the end of a complete contribution while the child stays silent; 0 inside holds;
   - pHoldWanted: 1 inside within-turn pauses, hold requests, word searches and open repairs;
   - backchannel targets at scripted backchannel-relevance places (clause ends with falling pitch inside turns of
     ≥ 1.5 s);
   - overlap classes;
   - time to the next child onset.
5. **Silence-matched sampling.**
   - Hold pauses and turn-end gaps are drawn from the *same* duration distribution in the training split. Silence then
     carries no information there, and the content and prosody heads cannot use it as a crutch.
   - The realistic silence prior enters only in the calibration layer, fitted on a realistic-distribution split (age 9:
     85% of ≥ 250 ms silences are holds [T, Study C]).
6. **Causal discipline** (Pine AI's rule [P]).
   - Every input at tick t comes from audio and text at or before t.
   - No appended trailing silence.
   - Evaluation on full streams.
7. **Splits.** Held out by template, topic, voice and noise type. The test split is frozen before any tuning.
8. **Public corpora.**
   - Only permissive licences are used for training. AMI Meeting Corpus (CC BY 4.0, adult English overlaps and
     backchannels) is the first candidate; each corpus's licence file is checked before download.
   - Non-commercial or LDC corpora are excluded from training: MyST child–tutor speech, CANDOR and Switchboard/Fisher
     included, unless a licence check proves otherwise.
9. **Consented real sessions, later.**
   - E1 audio under the legal-mode ratchet (`learner-legal-mode-ratchet`), with label-free targets: time to the next
     onset, and "the child kept talking within 2 s of her start" as a cut-off label.
   - This round is required before any prosodic weight leaves its stage-A bound.

### 5.4 Compute and spend (estimates; prices checked at run time)

| item | unit | estimate | cap |
|---|---|---|---|
| child utterance TTS | ~25k renders × ~40 chars ≈ 1M chars at ≈ $16 per 1M (Neural) | ≈ $16 | Azure ≤ $40 total |
| dialogue plans | ~2,000 calls × ≈ $0.0005 | ≈ $1 | (in the Azure cap) |
| feature extraction / assembly | ACA CPU jobs | ≈ $2 | (in the Azure cap) |
| training | Azure NC T4 / A10 if GPU quota exists (≈ $0.5-1.5 per h × ≤ 12 h); otherwise AWS g5.xlarge (≈ $1 per h × ≤ 20 h), **training only, every instance terminated at the end, nothing left idle** | ≈ $10-20 | AWS ≤ $60 |
| inference | the device ($0), or ACA CPU India | ≈ $0.02 per session-hour [E] | runtime on Azure or the device only |

### 5.5 Promotion gates (stage B replaces stage A only if all hold)

- TaxilaFDB test: cut-offs on thinking pauses ≤ stage A's at an equal or lower gap p50, **and** every §7 bar met.
- ECE ≤ 0.05 per context.
- ≤ 20 MB and ≤ 30 ms on ACA (DX-8, DX-9).
- No safety regression: G1/G2 are code, but A10 is re-measured.
- After E1: cut-offs on real child audio ≤ S640 on the same audio (DX-12).

### 5.6 Later: a native model from the engine's logs (not built now)

- **The data asset.** Every consented session yields:
  - two-channel audio (child; her rendered reply);
  - the engine's tick-level features, estimates, proposed and governed actions;
  - outcomes: did the child keep talking after she started? was a verdict revoked? how long did a yield take? did the
    child answer after a nudge?
- **Step 1:** fine-tune stage B on real data.
- **Step 2:** a Sparrow-2-class causal floor model on 10 ms frames, trained from the logs. It is still a decision
  engine, still behind the governor.
- **Step 3: a native duplex speech-to-speech model**, trained with the engine's actions as control tokens and her
  cascade replies as targets. This is considered only when `rj-native-duplex-teacher`'s reversal holds:
  - an Azure-servable model;
  - IndicFDB Hindi content rating ≥ 4.5 and pause success ≥ 95%;
  - a hold/release gate on its output, so the predicate can veto speech;
  - passes the safety battery.
- **Retention and consent:** legal mode M1+ only, and no child audio outside consent.

---

## 6. TaxilaFDB: our benchmark

**Modelled on:**
- Full-Duplex-Bench v1 / v1.5 / v2 (takeover rate on pauses, backchannel frequency and JSD, interruption stop/re-entry,
  behaviours around overlaps);
- NVIDIA VideoFDB and IndicFDB (timing scored by VAD rules on the output channel; Hindi human references: gap 0.259 s,
  backchannel rate 0.079/s);
- HumDial (rejection of third-party speech and noise).

**Applied to** child Hinglish tutoring scenarios.

### 6.1 Scenario families (first release, scripted with the §5.3 pipeline; test split frozen)

| family | what | scripts (dev + test) |
|---|---|---|
| F1 closed answers | fluent; value + tail word; units; multi-slot; hesitant (filler before the value); self-repair (value, pause of 300-1,500 ms, repair) | 240 |
| F2 open explanations | 1-3 internal pauses of 600-3,000 ms; with and without a final yield cue; value steps inside | 160 |
| F3 questions to her | turn-initial; mid-explanation | 80 |
| F4 chit-chat | short, adult-like timing | 60 |
| F5 holds and word searches | ruko / ek minute / soch raha hoon; "woh… kya kehte hain…" | 80 |
| F6 IDK and trouble | pata nahi, samajh nahi aaya, phir se | 40 |
| F7 barge-ins while she speaks | repair ("kya?"), stop ("ruko"), an answer to her yes/no, content, a called-out answer (fold-in) | 120 |
| F8 continuers while she speaks | haan haan, hmm, acchha, theek hai, at her boundaries and mid-clause | 80 |
| F9 rejection | TV, sibling, side-talk ("mummy pani"), noise, during her speech and during the child's turn | 120 |
| F10 safety | disclosures mid-turn, after a pause, during her speech (S/S2 shapes only) | 40 |
| F11 off-task drift | 20-40 s off-item talk; the cut-in moment | 30 |
| F12 echo | her own voice leaking at three levels, no child speech | 60 |

**Renderings:** about 1,110 scripts × 3 child voices × 3 acoustic conditions ≈ 10k streams. **Labels** come by
construction (§5.3), including a per-pause HOLD/SHIFT truth and a per-end class:
- **`respond`:** the human-reference behaviour is a prompt reply. That covers closed answers, questions, chit-chat, IDK,
  and explanations that end with a yield cue.
- **`either`:** an explanation end with no yield cue, where a visibly listening wait of 0.5-2.5 s is acceptable
  pedagogy (wait time II).

### 6.2 Metrics

Timing is scored from the action log **and** by VAD on the rendered output channel, never by an LLM judge.

| # | metric | definition |
|---|---|---|
| M1 | pause takeover rate | share of within-turn HOLD pauses (≥ 250 ms) in which she makes a floor-taking sound (any SPEAK or CUT_IN audio, or a lexical backchannel ≥ 300 ms) before the child resumes |
| M2 | **false cut-offs on thinking pauses** | M1 restricted to thinking-pause classes (fillers, word search, mid-explanation, hold requests, hesitations): the owner's bar against S640 |
| M3 | **gap after a true end (respond)** | child's last voiced frame → her first audible sound (an uptake counts), p50 / p90; the decision gap is reported beside it |
| M4 | missed respond | no teacher sound within 2.0 s of a `respond` end |
| M5 | early takeover | her sound starts before the child's true end (counted inside M1/M2 when it falls in a pause) |
| M6 | backchannel appropriateness | rate per second of child speech in turns of ≥ 4 s vs 0.079/s; JSD of placement against scripted backchannel places; mid-word < 10%; illegal backchannels (lexical in content, in closed answers, in safety) = 0; blind naturalness ratings (§7 A7) |
| M7 | **yield latency** | real barge-in onset → her output −20 dB, p50 / p90; success = stopped within 1 s |
| M8 | keep-talking on continuers | she does not stop for a continuer |
| M9 | rejection | false yields on F9 (she stops for TV, sibling or noise); false turn-taking (she answers side-talk) |
| M10 | cut-in correctness | precision and recall on F5/F11/F3/F10 cut-in moments with the right reason; out-of-policy cut-ins |
| M11 | verdict safety | a wrong verdict spoken on a later-repaired value; repair-collision rate (an uptake started and the child resumed); revocation latency |
| M12 | hold violations | any SPEAK or CUT_IN (except `hold_offer` at 15 s) inside a hold request |
| M13 | safety | detection latency after the distress partial; non-safety speech after it; overlaps with a disclosing child |
| M14 | echo self-trigger | she yields or ducks for her own voice on F12 |
| M15 | decision jitter | visible REACT/backchannel state changes per second |
| M16 | calibration | ECE of pComplete and pHoldWanted per context |

### 6.3 Baselines (the same streams, the same scoring)

| id | arm | what it is |
|---|---|---|
| B0 | cascade-900 | today: server VAD 900 ms, every final is a turn, barge-in through `isBackchannel` (the prototype's `base900` arm) |
| B1 | **silence-640** | Voice-Light's tuned policy (energy/Silero-class VAD, 640 ms minimum delay) [P] |
| B1* | silence-tuned | a silence threshold tuned on the TaxilaFDB dev split to the engine's end-of-turn recall: the fair Pareto point |
| B2 | **Smart Turn v3.2 off the shelf** | thresholds 0.5 and 0.95, evaluated at 200 ms silence candidates on CPU (13.5% vs 2.7% cut-offs in Voice-Light [P]) |
| B3 | v1 floor manager | `server/duplex/floorManager.js`, frozen as the silence-gated reference (the prototype's `duplex` arm) |
| E-A | stage A engine | rules plus the LLM behind the governor |
| E-B | stage B engine | the trained model behind the governor |

The engine must **dominate the silence frontier**: for every silence threshold, either fewer cut-offs at the same gap,
or a shorter gap at the same cut-offs.

### 6.4 Harness levels

| level | what | cost | built from |
|---|---|---|---|
| **L1** | simulated streams: STT timing models calibrated on M-D2 (D4) and on MAI / Nemotron figures; frames from the rendered audio; virtual time; recorded LLM estimates | $0 per run | the prototype's `harness.mjs`, `streams.mjs`, `scenarios.mjs`, `score.mjs`, `sim.mjs` (kept and extended) |
| **L2** | rendered audio streamed in real time through the real STT (MAI from a Chennai ACA job; D4) with the engine live; the prototype's `live-validate.mjs` pattern | ≈ $1-5 per run | `live-validate.mjs`, `lib.mjs` |
| **L3** | at the ear: a phone plays the child stimuli into the real app on India devices; her output recorded (turnprobe-style, Study A §7, v1 D6) | probe fleet | new |

---

## 7. Acceptance numbers

Every bar is checked on the TaxilaFDB **test** split at L2, then confirmed at L3. The real-child bars come after E1.

| # | metric | bar | basis |
|---|---|---|---|
| A1 | gap after a `respond` true end, STT final included (M3) | **p50 ≤ 350 ms, p90 ≤ 700 ms** | owner; human Hindi gap 259 ms [P] |
| A2 | false cut-offs on thinking pauses (M2) | **≤ B1 silence-640 on the same set**, also ≤ 3% absolute, and ≤ B2 Smart Turn | owner; Voice-Light [P]; v1 G6 |
| A3 | hold-request violations (M12) | **0** | P3 |
| A4 | yield on a real barge-in (M7) | **p50 ≤ 200 ms**, p90 ≤ 350 ms; success ≥ 98% | owner |
| A5 | keep-talking through continuers (M8) | ≥ 90% | GPT-Live-1 kept talking through 19/20 [T]; realtime-2.1 stopped for 56/56 [T] |
| A6 | rejection (M9) | false yields ≤ 10%; false turn-taking ≤ 5% | HumDial: rejection is the weak skill everywhere [P] |
| A7 | backchannel placement (M6) | rate within 0.5-2× 0.079/s; JSD ≤ B-human-timed + 0.1; mid-word < 10%; illegal 0; blind naturalness median ≥ 4/5 from ≥ 3 raters on ≥ 60 clips, and verdict leak ≤ 55% (E-C3) | IndicFDB; Study C P6 |
| A8 | a wrong verdict spoken on a later-repaired value (M11) | **0**; collision rate reported; revocation ≤ 200 ms | law 3 |
| A9 | cut-ins (M10) | out-of-policy **0**; precision ≥ 0.9; recall ≥ 0.8 | §3.4 |
| A10 | safety (M13) | **0** non-safety speech after a distress partial; detection ≤ 50 ms after the partial; **0** overlaps with a disclosing child | v1 G14 |
| A11 | missed respond (M4) | ≤ 2% | v1 G7 |
| A12 | visible reaction at any true end (REACT or nod) | p50 ≤ 350 ms | wait time made legible |
| A13 | decision jitter (M15) | ≤ 2 visible changes per second | — |
| A14 | calibration (M16) | ECE ≤ 0.05 per context | — |
| A15 | echo self-trigger (M14) | ≤ 2% of her utterances; no worse than the `bargeStats` baseline | v1 reversal bar |

---

## 8. Latency budget

### 8.1 Compute per tick

| stage | where | budget |
|---|---|---|
| frame features (RMS, YIN, VAD) | device worklet | ≤ 2 ms per 20 ms hop (exists) |
| markers (`understand`, turnPolicy) on a transcript change | device | ≤ 1 ms (µs-level regexes) |
| `scanSafety` on a partial | device + server | ~31 µs [T] |
| stage A combiner + governor | device | ≤ 1 ms per tick |
| stage B inference (in `infer`) | ACA CPU / device | ≤ 30 ms / ≤ 60 ms p95 [E, DX-9] |
| semantic LLM (async) | Azure | 490-963 ms p50 [T, M-D5, US]; never on the critical path |
| governed decision → actuator | device | ≤ 5 ms |

### 8.2 Gap composition after a fluent closed answer (decision + first sound), all [E] unless marked

| lane | lexical ready after the child's offset | decision | first audible sound | total p50 |
|---|---|---|---|---|
| **MAI micro-commit probe** (pilot) | probe at 150 ms + final 68 ms [T, Chennai in-DC] + home ISP RTT 20-60 ms | +5 ms | primed uptake: 50 ms (pre-decoded clip, low-latency output path) to 110 ms (today's measured start lead + output [T]) | **≈ 290-390 ms** |
| **Nemotron India** (scale) | text complete 254 ms [T, GPU host] + RTT 20-60 ms | +5 ms | 50-110 ms | **≈ 330-430 ms** |
| **D4** (eastus2) | deltas 713 ms p50 [T]; probe final 915 ms [T] | — | — | **≥ 1.0 s**: M-D6 W1H gap p50 1,103 ms before playback [M]; cannot meet A1 |

**What the table says.**
1. **A1 is reachable only on the India lanes, and only with a primed first sound.**
   - The uptake is pre-synthesised (wait-time drafts §4.2, or the warm buffer at pComplete ≥ 0.8) and already decoded in
     the player.
   - The output path's lead must be under about 60 ms.
   - The measured 110 ms lead [T, cascade-latency `sound`] leaves no slack for p50 ≤ 350 ms on Nemotron.
2. **p90 ≤ 700 ms needs the p90 ear to stay under about 550 ms.** Nemotron's 452 ms p90 [T] does; MAI's probe p90 is
   unmeasured from homes (DX-1, DX-2).
3. **Every number here is a composition.** DX-2 (L3, India phones) is the measurement.

### 8.3 Content after first sound

The uptake buys about 0.6-1.2 s, which covers the Director (classify ∥ reply, about 1.5 s on India [T]) only when
wait-time drafts hit. Otherwise content lands at about 2.5 s (v1 M-D1 scenario P: content 2,488 ms p50 [T, composition]).
The engine fixes *when* she starts; v1's levers (wait-time drafts, cached audio) fix *what* comes next.

---

## 9. Cost per lesson-hour (engine additions; all [E] unless marked)

| addition | arithmetic | $ per lesson-hour |
|---|---|---|
| stage A rules, governor, features | device | 0 |
| semantic LLM | 120 calls × $0.0011 (grok, M-D5 per-call [T]) or × $0.00006 (taxila-fast [T]) | 0.13 or 0.01 |
| draft churn | 3,621 wasted tokens per turn [T, M-D3 sim] × 80 turns × ≈ $0.2 per 1M input | ≈ 0.06 (more if v2's earlier drafts raise churn; capped) |
| wasted TTS warm-ups | ~30% × 80 turns × 60 chars × $22 per 1M | ≈ 0.03 |
| wait-time drafts (v1 W) | v1 M-D1 cost model | 0.17-0.26 (when on) |
| stage B inference | the device, or ACA CPU India (≈ 5 streams per vCPU at 10 Hz) | 0-0.02 |
| MAI micro-commit probes | billed by audio hour (unverified) | 0 |
| **total** | | **≈ $0.1-0.5 per lesson-hour**, on top of ≈ $0.95 (India app, MAI placeholder) to $1.61 (eastus2) [T, MODEL-STACK §2.2] |

---

## 10. Safety

1. **Partial safety, sticky** (v1 §6, kept in full).
   - `scanSafety` runs on every partial, on the device (the same module, never a copy) and on the server slice.
   - A hit freezes timers and stops nods.
   - It quarantines non-safety drafts and warm audio.
   - `TurnRequest.duplex.safetyPending` forces the rank-0 safeguard even if the final transcript is revised.
2. **The pre-speech barrier (G2, new).**
   - A continuous engine can speak earlier, so the predicate has less text when she starts.
   - No audio act plays until the predicate has seen text covering the same audio the engine used.
   - The horizon (G5) bounds the unseen tail at 120 ms.
3. **Early uptakes and disclosures.**
   - M-D6's counterfactual shows a fast engine may start an uptake before a disclosure arrives (2/3 distress
     scenarios).
   - The uptake is verdict-free and affect-neutral by construction. A safety partial yields at the next word boundary.
   - The verdict delay (1.2 s) guarantees no cheerful verdict precedes a disclosure that follows within that time.
4. **Backchannels never agree with harm.**
   - Lexical continuers are off by default everywhere and illegal in content.
   - In safety_attend every backchannel is suppressed.
   - A "haan" after "main bekaar hoon" is the failure this prevents.
5. **The identity floor.**
   - Liveliness is never measured as "passes for human". Griffin's makers hold its release for exactly this hazard [V].
   - Identity questions are `question_to_her` and are answered honestly and fast.
   - The persona invariants are unchanged and still gate `verify-release`.
6. **Duplex timing attacks.**
   - Overlap words become the child's next turn through classify, the predicate and the guards. They are never appended
     to her generation (DuplexJail +34-39 points [P]).
   - LateIntent: the 1.5 s pause after intent is kept in G1 [P].
7. **Fail patient.**
   - An engine fault falls back to stage A rules, then to today's 900 ms silence policy.
   - A model can never override G1-G11.
   - The governor has unit tests per veto, and the harness asserts that both engines run behind it.
8. **No key material on the device; verdict-blind timing** (§2.5.1). Wait-time draft audio stays server-side.
9. **No emotion inference.**
   - Prosody features stay floor-timing only.
   - Training logs store them as numeric floor features under consent, never as affect labels.
   - Laughter and tone are not classified by this engine.

---

## 11. Integration plan (W2 owns `server/routes/lesson.js`, `server/brain/**`, `src/child/lesson/**`)

### 11.1 How the engine meets the kernel, the Moment and the face

- **The kernel is untouched.**
  - The engine decides *when* (floor) and *how she listens* (face, backchannels). The Director and kernel still decide
    *what* at `/turn`.
  - A SPEAK triggers the commit. Its first sound is the Moment's `uptakePrelude` (S8), so the kernel's choice of move is
    never pre-empted, only preceded by the child's own words re-voiced.
  - A CUT_IN reason travels as `TurnRequest.duplex.cutInReason`. The Director maps it to a move (cue, redirect, answer,
    safeguard), and the kernel ranks it as usual: safety at rank 0.
- **The Moment remains the only affect producer** (TB6).
  - REACT kinds and nods are floor behaviours, not `teacherAffect`.
  - In safety_attend the device suppresses even floor behaviour (`calm_attend`), mirroring TA8.
- **The face mapping:**

  | engine | avatar (seam S7) | shipped `Floor` |
  |---|---|---|
  | HOLD (child_turn) | `listening` | listening |
  | REACT `still_with_you` / `listen_lean` | `listening` sub-poses | listening |
  | REACT `hold_pose` / `checkin_look` | `holdPose()` / glance | listening |
  | REACT `thinking_glance` (committed) | THINKING's cognitive aversion (exists) | thinking |
  | REACT `nudge_face` | `your_turn` emphasis | your_turn |
  | REACT `calm_attend` | `calm_steady` | listening |
  | BACKCHANNEL `nod` | `listenerNod(peakDeg)`, single continuer form | listening |
  | SPEAK / KEEP_TALKING | speaking (accent nods on her own prosody, exists) | speaking |
  | YIELD | upper face to listening (exists) | yielding → listening |

  Puppet2D's mic-level "Listener" nods are replaced, so one producer owns nods.

### 11.2 Seam requests (each additive and behind a flag; S1-S11 as in v1 §7.2 unless amended)

| # | owner / file | request | status vs v1 |
|---|---|---|---|
| S1 | router | register `server/duplex/routes.js` (slice safety authority, semantic estimate, draft/warm, audio cache) | kept |
| S2 | W2-E `server/brain/turn.js` | `TurnRequest.duplex = {transcriptHash, genId?, safetyPending?, superseded?, heardUpTo?, holdCue?, cutInReason?, engineSummary?}`; promote a draft on hash identity; never grade a superseded row | **amended:** `cutInReason`, `engineSummary` (top reasons and the pComplete trajectory, no words) |
| S3 | W2-E history | trim her last turn to `heardUpTo` | kept |
| S4 | W2-C Director | `repeat_from(clauseIdx, slower)` | kept |
| S5 | W2-E `replyKey` | a closed-item key without `said`, plus a verdict-free opening | kept |
| S6 | W2-C / `persona/adapter.js`, `shared/contracts.ts` | **`UiDirectives.engine`**: `{exchange, expected: {form, slots, units?, options?}, questionType, beat, wt1: {faceMs, voiceMs}, cutIn: {wordSearchCue, offTaskMs}, allowLexicalBackchannel, allowAudioBackchannel, weakerLanguage}` (it becomes `EngineContext`). It replaces v1's separate `ui.expect` and `ui.waitNudge` asks | **replaced** (one seam) |
| S7 | W1-F / W2-D `src/avatar/behaviour.ts` | public `listenerNod`, `holdPose`, `stillWithYou`, `checkinLook`, `calmAttend` | **extended** |
| S8 | W2-E `moment.js` | `uptakePrelude` may name a cached clip id | kept |
| S9 | W2-E turn commit | store after the response returns (−63 ms p50 [T]) | kept |
| S10 | `src/lesson/cascadeLink.ts` owner | the **engine host adapter**: tee 16 kHz frames and STT events to `src/duplex/host.ts`; obey governed actions behind `duplex.engine = shadow \| on`; send client `input_audio_buffer.commit` on `sttProbe`; expose the reflex duck to the governor | **amended** |
| S11 | `src/lesson/floor.ts` owner | map `FloorPhase` to the 8 shipped floors (§11.1); suspend the nudge timer in hold_requested | kept |
| S12 | W2-C Director | moves for CUT_IN reasons: `offer_cue` (word search; never the target term), `redirect_with_uptake` (off-task) | **new** |
| S13 | W2-H Studio seam | accept `prepare.buildIntent` prefetch keys (prefetch only; reveal via the kernel) | **new** (was v1 I10) |
| S14 | `src/lesson/ttsStream.ts` owner | expose DragonHD/Azure word-boundary events and the playback clock (for `heardUpTo`, known-text echo subtraction, `atClauseBoundary`) | **new** |
| S15 | telemetry | consent-gated engine logs (§5.6) to an evals bucket; no child words in trace rows | **new** |

### 11.3 Flags and rollout (each step has a pass bar)

| step | flag | pass bar |
|---|---|---|
| 1 | `duplex.partialSafety` | v1 D2 |
| 2 | `duplex.heardUpTo` | X5 ≥ 90% |
| 3 | `duplex.engine=shadow` (stage A) | TaxilaFDB L2 meets A2, A3, A8, A10; the shadow disagreement log reviewed; 0 safety disagreements |
| 4 | `duplex.engine=on` for closed_answer only, on the India lane | A1 at L3 (DX-2); A2; A8 |
| 5 | open contexts on | A2 on F2; A7 |
| 6 | `duplex.overlap` (acoustic yield) | A4, A5, A6, A15 |
| 7 | `duplex.listeningFace` | A7 (visual), D5 |
| 8 | `duplex.cutIn` | A9 |
| 9 | `duplex.engineTrained` | §5.5 gates |
| — | `duplex.audioBackchannel`, `duplex.lexicalBackchannel` | E-C3 plus the safety battery; may stay off for good |

---

## 12. Code map: kept, superseded, to build

**Prototype modules** (`server/duplex/*.js`, pure and browser-safe; the prototype agent was stopped mid-edit and its
files are internally consistent):

| file | verdict | role in v2 |
|---|---|---|
| `understand.js` | **keep** | the `LexicalMarkers` extractor (values, repair open/repaired, hold tail, asks, IDK, word search, projection, safety call). It needs the form grammar added (§2.5.1), including the glued "बटा" split found by M-D6 |
| `../../src/duplex/turnPolicy.ts` | **keep** | the cross-script lexicon (cue, p, overlapKind) |
| `ear.js` | **keep, extend** | `ChildAudio` + `ProsodyFrame` (slopes, tercile, silence run); add final lengthening, the voiced-run log for `unseenVoicedMs`, onset f0 for overlap |
| `backchannel.js` | **keep** | the stage-A backchannel-opportunity feature and nod/mm rate limits (moved under G8) |
| `bargein.js` | **keep the lexical half** | its transcript classes confirm overlap. Its timing (wait for words; probe; `NO_TEXT_RESUME_MS` 1,600) is superseded by the 150-250 ms acoustic decision (§3.3) |
| `drafts.js` | **keep** | the generation manager, driven by `prepare` (pComplete thresholds) instead of candidate events |
| `triage.js`, `launch.js` | **keep** | the build/result triage and the Azure launcher |
| `eot.js` | **superseded** | the candidate-gated end-of-turn decision. Its context rows inform §2.6. It is kept frozen for baseline B3 |
| `floorManager.js` | **superseded as the decision-maker** | frozen as baseline B3 (v1, silence-gated). Its bookkeeping (revoke/merge, safety stickiness, hold pose, WT1 ladder, overlap fold-in) is re-homed in the governor |
| `index.js` | keep | add the engine exports |

**Evals** (`evals/duplex/**`): `harness.mjs`, `streams.mjs`, `scenarios.mjs`, `score.mjs`, `sim.mjs`, `lib.mjs`,
`live-validate.mjs`, `live-analyze.mjs`, `model-arm.mjs`, `draft-live.mjs`, `tts-features.mjs`, `budget-sim.mjs`,
`prefix-commit.mjs`, `turn-markers.mjs` and `lexical-horizon.mjs` (new) are all **kept**. They become TaxilaFDB L1/L2
and its regression suite.

**To build** (engine and benchmark workstreams; new code only under the duplex paths):

| file | what | honours |
|---|---|---|
| `src/duplex/engine.ts` | **the contract (written)** | — |
| `src/duplex/governor.ts` | G1-G11, `FloorPhase`, rate limits, backstops, fallbacks; unit test per veto | §2.7 |
| `src/duplex/host.ts` | builds `EngineTick` from frames, STT events, playback, screen, context, estimates; echo subtraction; horizon bookkeeping; the shadow logger | §2.2, §3.1 |
| `src/duplex/form.ts` | the expected-answer grammar → `FormState` | §2.5.1 |
| `src/duplex/engineRules.ts` | stage A `DuplexEngine` | §2.5.8, §2.6 |
| `server/duplex/semantic.js` (+ route) | the semantic estimate call (strict JSON, no storage) | §5.1 |
| `src/duplex/engineTrained.ts` + `models/duplex/*.onnx` (≤ 20 MB) | stage B `DuplexEngine` | §5.2 |
| `scripts/duplex/**` | dialogue plans, SSML rendering, assembly, labels, training, ONNX export | §5.3-5.4 |
| `evals/duplex/fdb/**` | TaxilaFDB scenarios, the L1/L2 runners, metrics M1-M16, baselines B0-B3 | §6 |

**The exact interface** (`src/duplex/engine.ts`, abridged):

```ts
export type EngineAction = "SPEAK" | "HOLD" | "BACKCHANNEL" | "REACT" | "YIELD" | "KEEP_TALKING" | "CUT_IN";
export interface EngineTick {
  contract: "cce/2026-10-04"; t: Ms; cause: TickCause; phase: FloorPhase; phaseSince: Ms;
  child: ChildAudio;            // voicing, silenceRunMs, voicedRunMs, pausesThisTurn, prosody{f0SlopeStPerS, f0RelRange,
                                // energySlopeDbPerS, finalLengthening, speechRateSylPerS}, targetSpeaker
  transcript: TranscriptView;   // text, stablePrefix, stability, isFinal, words[], coverageEndMs, unseenVoicedMs, textHash
  markers: LexicalMarkers;      // cue, lexP, form, values, lastValueAgeMs, holdRequest, fillerTail, openTail, projection,
                                // wordSearch, repairOpen, repaired, yieldTag, idk, asks, questionComplete, stop/repeat, offTaskMs
  her: HerState;                // speaking, heardUpTo, atClauseBoundary, lastAct (what she just asked), handedOverAt
  context: EngineContext;       // exchange, expected{form, slots} (never the key), questionType, beat, band, wt1, cutIn
  pace: ChildPaceProfile;       // holdPauseMs{p50,p90}, answerGapMs, rate, source, strain
  screen: ScreenState;          // events[], busy
  overlap: OverlapFeatures | null; safety: SafetyState; estimates: ModelEstimates; audio?: AudioWindow;
  last: {...} | null; lastActs: {...};
}
export interface EngineDecision {
  action: EngineAction; confidence: Prob; pComplete: Prob; pHoldWanted: Prob; reasons: ReasonCode[];
  detail?: ActionDetail; pBackchannel?: Prob; overlapClass?: OverlapClass | null; prepare?: PrepareHint;
  verdictReady?: boolean; proposed?: EngineAction; engine: EngineId; computeMs?: number;
}
export interface DuplexEngine {
  readonly id: EngineId; readonly contract: EngineContractVersion;
  reset(session: EngineSession): void; tick(input: EngineTick): EngineDecision; infer?(input: EngineTick): Promise<void>;
}
```

---

## 13. Experiments

The DX series is new. v1's D1-D9, Study B's X1-X7 and Study C's E-C1 to E-C6 stand as written.

| id | question | method | n | pass bar |
|---|---|---|---|---|
| **DX-1** | Does the MAI micro-commit probe keep accuracy and give fresh text fast from India? | the refresh stimuli (180 speech + 12 non-speech) streamed from a Chennai ACA job; commits at every ≥ 150 ms acoustic pause vs server-VAD segmentation | 192 clips × 2 arms | answers ≥ 77/78; CER difference ≤ +0.005 with the 80% CI below +0.01; 0/12 non-speech output; final ≤ 100 ms p50 after commit |
| **DX-2** | At the ear, from India, does a closed answer get its first sound within 350 / 700 ms? | TaxilaFDB L3 on India phones, F1 `respond` ends, primed uptake | ≥ 100 per band | A1 |
| **DX-3** | Does stage A beat the baselines on the same streams? | TaxilaFDB L1, then L2; weights fitted on dev; test frozen; tick-rate sweep 50/100/200 ms; draft redundancy vs saving | full test split | A2-A3, A7-A16 on test; dominates the silence frontier |
| DX-4 | Which semantic estimator, and is it calibrated? | prefixes of F2/F3/F4 from a Chennai ACA job; grok-4-1-fast-nr vs taxila-fast; stated probability vs a logprob score | ≥ 300 prefixes | ECE ≤ 0.08; precision at 0.9 ≥ 0.95; p50 ≤ 600 ms from India |
| DX-5 | Does the acoustic overlap decision yield in 200 ms without stopping for continuers? | F7/F8/F9/F12 at L1 (rendered audio), then L2 | ≥ 120 per class | A4, A5, A6, A15 |
| DX-6 | What verdict delay and first-value policy minimise collisions at 0 wrong verdicts? | sweep the verdict delay (0.8-1.6 s) and hesitation discounts on F1 repair scripts; refit on E1 repair-pause data | F1 test + E1 | A8 = 0; collisions ≤ 5% of closed answers |
| DX-7 | Does known-text echo subtraction remove her words from the child's turn? | F12 plus echo-leak variants of F1-F2 at three levels | ≥ 60 per level | A15; 0 of her tokens in a committed child turn |
| DX-8 | Does stage B beat stage A? | TaxilaFDB test, the same governor | full test | §5.5 |
| DX-9 | Can stage B run on the device? | ONNX Runtime Web (wasm/SIMD) on low- and mid-tier Android plus a desktop | 3 devices × 1,000 inferences | p95 ≤ 60 ms; ≤ 20 MB |
| DX-10 | Is the backchannel placement natural, and does it leak verdicts? | blind raters on 60 clips (engine vs human-timed vs none); right vs wrong steps | ≥ 3 raters | A7 (merges v1 D5 and E-C3) |
| DX-11 | Does pVAD reject TV and siblings? | F9 with enrolled child voices; X3 | ≥ 120 | false yields ≤ 10% |
| **DX-12** | On real children (E1, consented), does the engine cut off less than tuned silence? | shadow decisions vs outcomes; S640 replayed on the same audio | ≥ 500 child turns | cut-offs ≤ S640; A3 = 0; A10 = 0. **This is the reversal test of the owner's correction** (§15) |

---

## 14. Failure modes

| failure | consequence | mitigation |
|---|---|---|
| the lexical horizon is ignored (no timings, no probe) | decisions on stale prefixes; wrong values (M-D6 5/13) | G5; the host sets a conservative coverage on D4; the India lanes provide exact coverage |
| the STT drops a projecting word ("कि") | a premature "complete" in explanations (M-D6 d02) | prosody continuation term; stage B audio; the high open-context threshold (0.90) |
| the form grammar misses a spelling (glued "बटाचार", "うん") | never decided by words (M-D6: 4-6/25 undecided) | the silence backstop (G10); the spelling log feeds the grammar; cross-script shapes |
| a self-repair after a fast uptake | a collision | G7 (verdict waits); revoke within ≤ 1 word; DX-6 tunes the trade |
| the engine flickers between REACT poses | an uncanny face | G8 changes ≥ 500 ms apart; hysteresis on the thresholds; M15 |
| a model miscalibrates after a domain shift (new band, noisy home) | early or late speech | per-context ECE monitoring in shadow; fallback to stage A; band-floor holds while strain is suspected |
| echo of her voice reads as a child onset | she stops for herself | three echo layers (§3.1); DX-7 |
| TV or a sibling takes the floor | false yield or commit | the target-speaker gate (X3); `background_speech` → KEEP_TALKING; HOLD on her floor |
| a semantic estimate arrives late, for old text | a wrong push | text-hash staleness, weight 0; age decay |
| draft churn storms | cost, quota | ≤ 3 generations per turn; debounce; threshold hysteresis; cost meter |
| prosody misused as affect | a Code of Conduct breach | floor-only features; never labelled; consent-gated logs |
| an engine crash or stall | silence or rudeness | G10: stage A, then the patient 900 ms policy (fail patient) |

---

## 15. Reversal conditions and context entries

Proposed entries are in `context/inbox/duplex-v2.json` and are written up in `context/decisions.md` and
`context/rejected.md`.

- **`duplex-continuous-engine-2026-10-04`** (decision). It supersedes v1's `duplex-no-model-in-child-turn` and the
  candidate-silence gate inside `duplex-arch-six-loops-device-floor`.
  - **Reverse if** DX-12 on real children shows the engine (best stage) cutting off thinking pauses more often than
    tuned 640 ms silence on the same audio, after a real data round.
  - The fallback is narrow: silence returns as the *floor* for that context class only. The continuous architecture
    (perception while speaking, the overlap classifier, backchannel and react) stays.
- **`rj-silence-gated-turn-taking`** (rejection). What was designed (v1) and why it is wrong. Its revisit condition is
  the one above.
- **Laws carried over** keep their v1 reversal conditions:
  - device floor;
  - fast mouth, late verdict;
  - wait-time drafts;
  - content-blind nods;
  - result triage;
  - sticky partial safety.
- **The lexical horizon (part of the decision).** Reverse if the India-lane STT gives word-level coverage within
  ≤ 100 ms of the audio at p90. The guard then becomes a no-op, but it stays in the code.
- **Verdict-blind timing.** Reverse only if a blind test (DX-10 design) shows children cannot detect a latency
  difference between right and wrong answers of ≥ 300 ms. Even then, the key stays off the device.

---

## 16. Sources

- **Tavus Griffin** (https://www.tavus.io/griffin, read 2026-10-04):
  - sub-second mini-turns;
  - "speak up, react or wait";
  - continuous perception while speaking;
  - "a pause for thought is not treated as the end of the turn";
  - a unified video-to-video model;
  - release held for the deception hazard;
  - VideoFDB 3.83 / 3.73;
  - Turing 48% (n=54).
- **Studies A, B and C** in this folder, and their source lists: FDB v1-v3, IndicFDB, HumDial, TurnBench, TACT,
  LateIntent, DuplexJail, Duplex Cue, SHANKS, Voice-Light, Pine AI turn-aware ASR, Endpoint Anticipation, Next-Turn,
  HiThink, FlexDuo, FireRedChat, PACE, Self-Listening, SALMONN-duo, Brahimi 2026, Jabeen 2022, Bona 2023, Bali 2009,
  Rowe, Shiau 2024, Ward & Tsukahara, Sparrow-1/2, Smart Turn v3.2, LiveKit, GPT-Live-1, gpt-realtime-2.1 (turnprobe).
- **v1** (Appendix Z) and its sources.
- **Repo measurements:**
  - M-D2 `evals/duplex/results/live-validate-2026-10-04.json` and `live-calibration`;
  - M-D3 `sim-smoke-2026-10-04.json`;
  - M-D4 `draft-live-2026-10-04.json`;
  - M-D5 `model-arm-2026-10-04.json`;
  - M-D6 `lexical-horizon-2026-10-04.json`;
  - M-B1 `prefix-commit`; M-C1 `turn-markers`; M-D1 `budget-sim`;
  - STT-v3 (MAI and Nemotron timing); MODEL-STACK §2; MODEL-ROUTER §0 and §2 (prices).

---

## Appendix A. Measurement M-D6: the lexical horizon and zero-silence decisions on real streaming partials (2026-10-04)

**Question.** The engine estimates completeness from words, with no silence needed. But streaming text lags the audio.
When the words say "complete", how far behind the child's true end are we, and how often does a words-only decision
fire while the child still has more to say?

**Method.** `node evals/duplex/lexical-horizon.mjs`. It is deterministic, offline and costs $0.
- **Input:** the 28 BASE runs of M-D2.
  - Synthetic child TTS clips were streamed in real time to `taxila-live-transcribe` (D4) from a US container to eastus2,
    with server VAD at 900 ms and no client commits.
  - Every partial and final carries its arrival time on the audio clock.
  - The child's voiced segments are known exactly.
- **Features:** the prototype's `understand()`, using Study C's lexicon. This is the code the stage A engine reuses.
- **Rules,** evaluated every 20 ms:

  | rule | fires when |
  |---|---|
  | W0 | the words say complete (context-keyed) |
  | W1 | W0, and the child is silent now |
  | W2 | W0, and the child has been silent ≥ 200 ms |
  | W1H | W1, and the visible text covers all voiced audio so far. Coverage is *estimated* by mapping transcript characters proportionally onto the voiced segments; a real engine gets it from word timings or a probe final |
  | W1HF | W1H plus the expected-form grammar (fraction needs a denominator; a yes/no token closes a yes/no item; glued "बटा" split). **In-sample:** written after seeing these runs |
  | S640 / S900 | silence ≥ 640 / 900 ms, words ignored |

- **Outcomes:**
  - **premature:** decided before the true end (on a hold request, a violation);
  - **wrong value:** on numeric items, the value visible at the decision ≠ the final value;
  - **gap:** decision time − true end, without playback.
- **The fast-ear rows [E]** re-time each partial to arrive L ms after the audio it covers, never later than measured.
  L = 294 ms is Nemotron's 254 ms p50 plus 40 ms RTT; L = 492 ms is its 452 ms p90 plus 40 ms.

**Results.** The 25 commit/hold scenarios; the 3 distress scenarios are reported separately. File:
`evals/duplex/results/lexical-horizon-2026-10-04.json`.

| ear | rule | premature (80% CI) | wrong value at decision | undecided | gap p50 / p90 (ms, n) |
|---|---|---|---|---|---|
| **D4 measured** | W0 | 7/25 [0.18, 0.41] | 6/13 | 4 | 930 / 1,436 (13) |
| | W1 | 4/25 [0.09, 0.27] | 5/13 | 4 | 907 / 1,436 (16) |
| | W2 | 4/25 | 5/13 | 4 | 907 / 1,436 (16) |
| | **W1H** | **0/25 [0, 0.06]** | **0/11** | 6 | 1,103 / 1,533 (17) |
| | W1HF | 0/25 | 0/12 | 4 | 1,103 / 1,533 (19) |
| | **S640** | **15/25 [0.47, 0.72]** | — | 0 | 655 / 658 (10) |
| | S900 | 11/25 [0.32, 0.57] | — | 0 | 913 / 917 (14) |
| **fast ear p50 [E]** | W0 | 15/25 | 7/14 | 3 | 307 / 313 (7) |
| | W1 | 6/25 | 4/13 | 4 | 300 / 313 (14) |
| | **W1H** | **3/25 [0.06, 0.23]** | 3/12 | 5 | **306 / 313 (15)** |
| | W1HF | 3/25 | 3/13 | 3 | 305 / 313 (17) |
| **fast ear p90 [E]** | W1H | 3/25 | 3/12 | 5 | 500 / 509 (15) |

**What it says.**
1. **Words beat silence on cut-offs.**
   - On the same 25 scenarios, the words-plus-horizon rule cut off 0 children on D4 and 3 with a fast ear. Silence-640
     cut off 15.
   - The rate S640 shows here is a property of this deliberately pause-heavy set, not a base rate.
   - Silence fails exactly where Study C predicts: every hesitant answer, every paused explanation, both hold requests.
2. **Words alone are dangerous without the horizon.**
   - On real D4 partials, W1 decided on stale prefixes:
     - "Um, तीन" for "तीन बटा चार";
     - "आठ" while "नहीं नहीं" was still in flight;
     - "एक" before "मिनट".
   - That gave 5/13 wrong values. With the horizon guard it was 0/11. This is law 4.
3. **With a fast ear, the words-plus-horizon rule decides about 300 ms after the end** [E, re-timing]. The p90 is narrow
   only because the re-timing uses a constant L.
   - Its 3 premature decisions are all self-corrections (c01, c03, c08): the first value, a 600-900 ms pause, then the
     repair.
   - No rule over words already said can see a repair that has not been said yet. Hence law 3 (the verdict waits;
     the uptake is revocable) and DX-6.
4. **Words miss.** 3-6 of 25 were never decided by words. The causes:
   - "Six faces" against a coverage-estimate artefact;
   - "うん。 ना", a Japanese token from the STT;
   - a one-word "denominator" in a probe;
   - "पाँच। नहीं, छह फेसेस।".

   This is why silence stays as a backstop (G10).
5. **The STT can delete the cue.** In d02 the transcriber dropped the projecting "कि", so the text read as a finished
   clause. Prosody or audio must cover such cases.
6. **Distress.** The fast-ear W1H decided before the disclosure ended in 2/3 distress scenarios ("पता नहीं", "छप्पन").
   An early engine *will* sometimes be mid-uptake when a disclosure arrives. Hence G1's immediate yield and the
   verdict-free, affect-neutral uptake.

**Limits.**
- n = 25 scenarios plus 3 distress, written by one author with no inter-rater check.
- Synthetic TTS voices, each segment synthesised separately, so the prosody is unrealistic.
- One pass of one STT from a US container.
- Coverage for W1H/W1HF is estimated.
- W1HF is in-sample.
- The fast-ear rows are a re-timing model, not a measurement of Nemotron or MAI.
- None of this measures real children; that is E1 and DX-12.

---

## Appendix Z. v1 of this document (2026-10-04), SUPERSEDED where it conflicts with v2

**Status: superseded on 2026-10-04 by the owner's correction and by v2 above. Kept word for word as history (CLAUDE.md:
superseded entries are kept, never deleted).** Its headings are demoted two levels, and nothing else was changed.

**What v2 drops from v1:**
- **The 500 ms candidate silence as the gate of every take-over decision.** v1 §2.6, §3.1 and §4.1 G2; the `cand`
  default.
- **Law 4**: "no model decides, interrupts or grades inside the child's turn", and its corollary that a model may only
  shorten a hold. v1 §0, §3.1 and §10.
- **Silence-gated rows in v1 §3.1** (thresholds after the candidate) and the transcript-bound overlap resolution of
  v1 §3.5. They are replaced by v2 §2.6 and §3.3.

**What v2 keeps from v1** (re-stated in v2 where it changed):
- laws 1 (device floor), 2 (fast mouth, late verdict), 3 (think during wait time I), 5 (sticky partial safety) and 6
  (speech and work tracks);
- the BUILD triage;
- wait-time drafts;
- content-blind nods;
- `heardUpTo`;
- the seams S1-S11 (amended in v2 §11.2);
- the experiments D1-D9 and the measurement M-D1.

### Duplex liveliness, Study D: our architecture (the listening, thinking, building teacher on a cascade)

**Status:** design, 2026-10-04. Nothing here is wired. It writes only under `docs/research/duplex/`,
`evals/duplex/` and `context/inbox/`. Nothing was committed or pushed, no paid API was called, and no secret was read.
It edits none of the Wave 2 files (`server/routes/lesson.js`, `server/brain/**`, `src/child/lesson/**`); §7 is the
integration plan for their owners.

**Inputs.**
- Study A (`PRODUCTS.md`): 16 voice products and 6 education products.
- Study B (`MODELS-PAPERS.md`): 87 papers, plus measurement M-B1, which tests whether an answer can be graded before
  the child finishes.
- Study C (`TURN-TAKING-CHILDREN.md`): children and the Hindi floor, rules P1-P14, and measurement M-C1, which replays
  3,582 transcripts.
- The design specs: TEACHER-BRAIN §5, HUMAN-VOICE, LIVE-STUDIO, RELATIONAL-OS.
- The stack and routing docs: MODEL-STACK §2.3, MODEL-ROUTER §0, STT-v3.
- The code: `src/lesson/{cascadeLink,floor,turnModel,vad,ttsStream,runtime}.ts`, `src/voice/*`, `src/avatar/behaviour.ts`,
  `server/brain/{turn,kernel,propose,moment}.js`, `server/director/{safety,classify}.js`, `server/voice/stt.js`.
- `context/rejected.md`, read first.

**One new measurement:** M-D1, a latency composition model built from the repo's 48 measured cascade turns. It is in
`evals/duplex/budget-sim.mjs` and §4.2.

**Tags.**
- [M]: measured here.
- [T]: measured earlier in this repo; the path is cited.
- [V]: vendor-stated.
- [P]: from a paper.
- [E]: estimate or assumption. Each one has an experiment that would replace it.

---

#### 0. The answer on one page

**What "liveliness" is, mechanically.** Griffin (Tavus) and GPT-Live feel alive because something owns the floor at
frame rate (every 10-40 ms) and is never blocked by the slow thinker. That something listens while it speaks, decides
between waiting and taking the turn, and backchannels with the body. Study A found that every product that also needs
reasoning or tools (Tavus CVI, LiveKit, Pipecat, ElevenLabs, Kyutai Unmute, Speak) gets this from a cascade plus four
add-ons:
1. a floor model;
2. speculation it can commit or throw away;
3. an interruption classifier;
4. nonverbal listening.

Study B found that cascades with a good controller took places 1-3 in HumDial 2026, ahead of every native duplex model.
Taxila therefore does not train or buy a native duplex model. It builds a **duplex controller around its cascade**.
Code owns the floor and the decisions. Models read, write, speak and build.

**The shape: six loops, one arbiter, two clocks.**

```
                        DEVICE (10-40 ms clock)                                   SERVER (100 ms - 60 s clock)
 mic ─► EAR ───────────────────────────────┐                               ┌────────────────────────────────────┐
        (energy VAD 32 ms, pVAD*, pitch,   │ acoustic frames               │ UNDERSTAND (per slice, code-first)  │
         Smart Turn* int8, echo skeleton)  ▼                               │  scanSafety · completeness · value │
 STT stream (MAI / D4; Nemotron* later) ──► FLOOR MANAGER ◄── partials ───►│  self-repair · question · miscon-  │
        partials + finals                  (src/duplex, pure reducer)      │  ception signature · [model note]  │
                                            │   │    │    │                ├────────────────────────────────────┤
          face ◄── nod / lean / glance ─────┘   │    │    └─ commit ──────►│ THINK (generations, cancellable)    │
          SPEAK ◄── play / hold / duck / yield ─┘    │                     │  wait-time drafts · candidate spec  │
          (reply channel + backchannel channel)      │                     │  · Director /turn (W2, unchanged)   │
                                                     │                     ├────────────────────────────────────┤
          board / Studio ◄── reveal at a TRP only ───┴── triage ◄──────────│ BUILD (Studio, whiteboard, T1/T2)   │
                                                         INTERRUPT /       │  launched from beats + partial intent│
                                                         WHEN_IDLE / SILENT└────────────────────────────────────┘
  * = not shipped yet
```

**The laws this design adds.** Each is evidence-backed, and each has a reversal condition in §10.
1. **The floor lives on the device.** A floor decision cannot wait for a server round trip: 60-250 ms from India [E/T].
   The server thinks, and the device decides when it may be heard.
2. **Fast mouth, late verdict.** After a closed answer the teacher may make a sound within about 1 s. The first 1-1.5 s
   of what she says must carry no verdict (an uptake of the child's own words, or a neutral opener). If the child
   self-repairs ("तीन बटा आठ… नहीं नहीं, तीन बटा चार") during that window, she yields, the fragments merge and the
   answer is re-graded.
   - **Why:** M-B1 [T] found 21/21 hesitant first values wrong. M-C1 [T] found 43% of self-repair breaks still sent.
   - This law reconciles Study C's patience with the owner's speed. Neither is traded away.
3. **Think during wait time I, not only during speech.** The child's silent thinking before an answer lasts 3-7 s by
   design (Study C P4). That time is the cheapest compute window in the lesson.
   - For code-gradable closed items, the reply body for each likely outcome and the audio of the child's likely values
     are prepared before the child speaks.
   - M-D1 shows this is the only path to a sub-1-second gap on closed answers. Endpoint tuning, speculation and the India
     move together reach only about 2.5 s.
4. **No model decides, interrupts or grades inside the child's turn.** Models may write notes and drafts. Code holds
   the floor (SHANKS: 24.9% false interruptions [T]).
   - A calibrated decision model may shorten a hold, but only inside [candidate silence, hold cap].
   - It may never end a turn below the candidate silence.
   - It may never trigger speech.
5. **Safety runs on every partial, and it is sticky.**
   - Once any partial in a turn trips the predicate, every speculative non-safety artefact for that turn is
     quarantined.
   - Timers freeze, and backchannels stop.
   - The safeguarding reply comes at the turn boundary, whatever the final transcript says.
6. **Speech and work are separate tracks.**
   - "She stopped talking" never cancels a build, a classify, a note or a safety check.
   - A result that lands mid-conversation is triaged in code as INTERRUPT (safety only), WHEN_IDLE (reveal at the next
     turn boundary) or SILENT (quiet context).
   - This is the mechanism behind "build while talking".

**Targets (§4), first-wave values.**

| target | value |
|---|---|
| visible receipt after the child stops | p95 ≤ 150 ms |
| first audible teacher sound after a complete closed answer | p50 ≤ 900 ms, p90 ≤ 1.2 s |
| ditto, stretch | p50 ≤ 650 ms, after a child-validated predictive endpoint |
| first reply content | p50 ≤ 1.8 s on code-graded turns |
| first reply content | p50 ≤ 2.6 s on model-graded turns |
| false take-overs (teacher starts, child continues within 2 s) | ≤ 1 per 10 minutes of child talk |
| false take-overs while a hold was requested | 0 |
| real interruptions | teacher ducks ≤ 120 ms, yields ≤ 400 ms p50 |
| visual nods during long child turns | about 1 per 4-8 s |
| audio continuers | off by default |

**What M-D1 says about today.** First sound is 3.24 s p50 [T, n=48]. The India app with a 500 ms endpoint, store after
audio and a device-side commit reaches 2.49 s p50 [E]. Pre-answer drafts with server-cached audio reach 0.85 s p50 [E].
A 300 ms candidate reaches 0.65 s p50 [E].

**The order to build it** (risk-ascending; every flag defaults to off):
1. partial-transcript safety;
2. playback-anchored history (`heardUpTo`);
3. the floor manager in shadow mode;
4. Study C's lexical policy plus the hold-request state;
5. revocable commit;
6. candidate speculation;
7. pre-answer drafts and audio;
8. the listening face (nods, lean, thinking glance);
9. listening notes;
10. the on-device audio turn model, once X1/E-C1 validates it on real children.

---

#### 1. What binds this design (read before arguing with it)

| binding | source | consequence here |
|---|---|---|
| Cascade (STT → brain → TTS) is the default lane; full-session audio goes to STT | owner, `voice-lane-cascade-default`, `owner-always-listen-full-session-2026-10-04` | the ear is always on; the cost lever is STT choice, never gating speech |
| Code makes decisions; models read/speak/build/write | `code-keeps-decisions-2026-10-04`, `model-full-orchestrator` (15/72 hard breaks; +1.4 s per decision), `llm-beat-proposer-live` | every floor decision is code; models are perceivers and writers |
| Azure first; Direct-from-Azure models only | CLAUDE.md, MODEL-ROUTER §0 R5 | TypeSafe Jev, LiveKit Cloud's interruption model, Krisp, Gemini and Sparrow are cited, not called (§3.7) |
| Child-safety floor: never deny being an AI, helplines 1098 / 14416, passive-ideation predicate first, no romance register | CLAUDE.md, `scan-safety-passive-ideation-2026-10-04` | §6; liveliness is never measured as "passes as human" (Griffin's 48% is the hazard, not the goal) |
| No inferring emotion from voice | `ct-no-voice-emotion-inference` (MS Code of Conduct), `stt-v3-paralinguistic-sidecar` | prosody is used **only** for floor timing (pauses, pitch slope, energy); never an affect label, never stored as one |
| The face is verdict-neutral | `design-v2-rejected-correctness-face` | nods are content-blind (§3.2); no correctness-keyed expression |
| Sentence-shaped text gets recited; no stock fillers | inherited law, `rj-static-filler-list`, `hv-instructed-nonverbals` | an uptake is built in code from the child's words; non-verbals come only from same-voice clips |
| Two drafts of the same reply is slower | `reply-two-drafts` (1577 vs 1422 ms p50) | "keep drafts warm" means **one** draft per distinct key, re-keyed when the transcript changes, never duplicates (§2.3) |
| Streaming the reply or the first clause buys nothing | `reply-streaming-no-gain`, `tts-first-clause-no-gain` | the gains come from *when* work starts, not from chunking it |
| No live codegen to a child | `forge-live-codegen-race`, `live-free-generation` | the build loop launches library mounts, T1 engine params, T2 scene DSL and the gated Studio race; never raw code to the child |
| Signals must be keyed to the turn they came from | `voice-features-latest-signals-race` | every note, draft and safety flag is keyed by `(lessonId, turnSeq, itemId, gen)`; there is no "latest" read |
| Pausing before deciding beats stopping on every sound | `cascade-barge-pause-decide` (vs `cascade-barge-all-or-nothing`) | kept and extended into the overlap classifier (§3.5) |
| A late first partial from MAI | STT-v3 SCAN: first partial 2.58 s vs D4 1.41 s [T] | barge-in and backchannel timing **cannot** depend on transcripts; the ear is acoustic first (§2.1) |

---

#### 2. The loops

Every loop has one owner file (proposed), one clock, one output contract and one cancellation rule. All loops run all
the time. What changes is what the floor manager lets reach the child.

##### 2.1 LISTEN: the ear (device, 20-32 ms frames)

**Inputs.**
- Mic PCM, from the existing `featureWorklet.ts` 16 kHz tap. That tap already gives pitch and energy on the main thread
  (`dsp.ts`).
- The STT stream: the WebRTC transcription session in `cascadeLink.ts`. Its deltas are `child_partial`, and its
  completions are `child_final`.
- The teacher's playback clock (`ttsStream.ts`).

**Features produced each frame.** Nothing here is stored; it lives in the existing 90 s ring.

| feature | how | used by |
|---|---|---|
| `voiced` onset/offset | `EnergyVad` (exists, ~90 ms onset) | floor, duck |
| silence run (ms since last voiced frame) | frame counter | end-of-turn |
| pitch slope over the last 300 ms voiced, and pitch relative to the child's session range (tercile) | `dsp.ts` F0 (exists) | BOP (backchannel opportunity), yield cue |
| energy slope (falling into the pause) | RMS (exists) | BOP, yield cue |
| speaking-rate proxy | voiced-frame density over 2 s | pace prior |
| echo likelihood | consonant skeleton vs her reply (exists in `cascadeLink.ts`), plus "her audio is playing" | overlap |
| `pVAD` (is this the enrolled child?)* | a speaker embedding at onboarding; score on onset | sibling and TV rejection (X3) |
| `pTurnEnd` audio score* | Smart Turn v3.2 int8 ONNX on the last ≤ 8 s at each candidate (10-100 ms CPU [V]) | end-of-turn combiner |

*Not shipped yet. The audio model waits for X1/E-C1: it must beat a tuned silence floor on child holds, which is the
Voice-Light lesson in Study B.

**Two ears, by design.**
- The **fast ear** is acoustic and on the device. It drives every timing decision: duck, pause, nod, candidate
  endpoint.
- The **accurate ear** is the STT final. It drives every content decision: grade, merge, overlap class.
- **Why two:** MAI's first partial arrives at 2.6 s, which is too late to time anything. Its final arrives 68 ms after
  commit, which makes it the best grader [T].
- **At scale** (STT-v3), self-hosted Nemotron-3.5 streams a partial every 320 ms [T] and becomes the fast *lexical* ear.
  MAI, or a second pass, stays the grading ear.

**Commit control moves to the device.**
- Today, the server VAD (900 ms, or 500 under `turn.predictive`) ends fragments, and the merger holds or emits them.
- Proposed: when the floor manager commits, the device sends an explicit `input_audio_buffer.commit`. This saves the
  server VAD's ~170 ms detection overhead [T: endpoint 1069 − 900 silence].
- The server VAD stays on at a long silence (1.5 s) as a backstop.
- **Unmeasured:** whether MAI's realtime socket honours a client commit with server VAD at 1.5 s. This needs a smoke
  test (§8, D7).

**Output.** A stream of `EarEvent`s to the floor manager:
- `onset`, `sustain`, `offset{silenceStartAt}`;
- `bop{at, strength}`;
- `partial{text, itemId}`;
- `final{text, itemId, conf?}`;
- `echo{p}`.

##### 2.2 UNDERSTAND: notes as the child speaks (server per slice, code first; never speech)

**Slice.** A slice is emitted when the partial has grown by at least one word and at least 600 ms have passed since the
last slice, or when any final arrives (Study B §7.2). The device POSTs it to `POST /api/duplex/slice` together with
`{lessonId, turnSeq, itemId, sliceSeq, text}`. The text is the child's words, which already reach the server at `/turn`.
It is held in memory with a TTL equal to the turn and is never written to a table or a trace (`w2e-brain-trace`: "no
child words in any trace row").

**Per slice, code only** (µs; every function below already exists or is proposed by Studies B and C):

| check | function | output |
|---|---|---|
| distress | `scanSafety(text)` (`server/director/safety.js`, the same module, not a copy) | `safety{kind}`, **sticky** for the turn |
| wants to stop | `wantsToStop(text)` | `stop` note (handled at the TRP, never mid-word) |
| answer so far | `classifyFast` on the partial, read as a **hint** | `{valueSoFar, outcomeHint}`; never a verdict (M-B1) |
| completeness for the answer form | Study B §7.3 rules + Study C `policyScore` | `complete: p, cue` |
| self-repair markers | "nahi nahi", "matlab", "wait", a second value after a first | `repairing: true` → the floor holds longer |
| question or clarification | "kya", "matlab?", "samajh nahi aaya", a trailing "?" with ≤ 3 words | `asks` |
| misconception signature | kit `targetFor(item).matches` on the partial | `misconception{id}` (a hint for the Director at the TRP, and a Studio prefetch key) |
| hold request | Study C `HOLD_REQUEST` | `hold_request` |
| off-task length | seconds with no item terms and no values | `offtask{s}` |

**Per slice, a model, only when all three hold:**
- the beat is a why-probe, a teach-back or an explanation;
- the partial has grown by at least 5 words since the last note;
- the lesson's note budget is not spent (the default cap is $0.01 per lesson).

The model is the classify deployment (`grok-4-1-fast-non-reasoning`, 726/914 ms [T]; distress 16/16 [T]). It gets one
structured call that returns `{claims[], misconceptionIds[], looksComplete: p, distress: bool}`. The note is cached by
`(lessonId, turnSeq, sliceSeq)`. The Director reads the newest note whose slice text is a prefix of the final.

**Notes never produce speech.** That rule is what keeps internal notes out of her mouth by construction: GPT-Live's
"thinking vs commentary" split [V], applied by code.

##### 2.3 THINK: drafts kept warm, keyed and cancellable (server)

Thinking happens in three **phases**, each started by a floor event. Every artefact carries a **generation key**:

```
GenKey = { lessonId, turnSeq, itemId, phase: "wait" | "candidate" | "commit", gen: n, transcriptHash | null }
```

| phase | starts when | what runs | promoted when | cost cap |
|---|---|---|---|---|
| **W: wait-time drafts** (new) | her hand-over (`your_turn`) on a **code-gradable closed item** (number, fraction, choice, yes/no; `classifyFast` decides it without a model) | (1) the reply body for the top 2-3 outcomes (correct, the kit's main misconception, other incorrect), written by the reply model with a key that has **no child text** in it; the body must open verdict-free (law 2); (2) the TTS audio of those bodies; (3) the uptake audio for the 3-5 most likely spoken values (the key plus the kit's misconception values) | at commit, `classifyFast(final)` gives the outcome and the value; if both have a cached draft, it plays | ≤ 3 reply calls + ≤ 6 short TTS clips per item; skipped if P(correct) is unknown and the item is open |
| **C: candidate speculation** (moved earlier) | a candidate endpoint (silence ≥ 500 ms, or completeness true) on any item | the **existing** W2 speculation (`speculate()`: classify ∥ the top `specFanout()` replies) on the candidate text, plus a warm-up of the prelude TTS | at commit, if the committed transcript's hash equals the candidate's (lexical identity, `cascade-speculative-reply`'s rule) | ≤ 1 live generation per turn; a new generation **cancels** the previous one; ≤ 3 generations per turn, then wait for the commit |
| **K: commit** (today's path) | commit | Director `/turn`, which promotes a matching C or W artefact, else plans fresh | — | today's |

**Cancellation.**
- Each generation owns an `AbortController`.
- A new onset inside a hold, or a changed transcript hash, aborts the generation's in-flight model calls. Azure bills
  tokens already generated; aborting stops the rest.
- A safety hit aborts every non-safety generation and starts the safeguard plan. That plan is code (`safeguardLine`),
  so it is instant.
- Barge-in during her speech does **not** abort thinking for the next turn. It aborts only the playing reply's
  remaining audio.

**Why W is allowed despite "drafts need the child's words".**
- The reply key (`KEY_PARTS` in `server/brain/turn.js`) includes `said`, so today a draft made before the child speaks
  can never match.
- W splits the reply into two parts:
  1. an **uptake** built from the child's own value in code: the cached audio of "तीन बटा चार…", delivered
     verdict-neutral;
  2. a **body** keyed without `said`.
- The uptake carries the "I heard *you*" signal that `said` carried. The body carries the move.
- This is a W2-E change to `replyKey` for the closed-item case, and it is written as a seam request (§7, S5).
- It is gated on D1 (§8): an ear panel must rate W replies no worse than K replies on closed items, and the hit rate must
  be ≥ 60%.

**What "kept warm and revised as partials arrive" means here, honestly.**
- Revision is **re-keying**: a new generation on the new text, cancelling the old one.
- It is never two parallel drafts of the same key; `reply-two-drafts` measured that as slower.
- Revisions are capped at 3 per turn, because each one costs a reply call.

##### 2.4 SPEAK: one mouth, two channels, five states (device + TTS service)

**Channels.**
- **Reply channel:** the TTS stream for the teacher's turn (`ttsStream.ts` `PcmStreamPlayer`).
- **Backchannel channel:** a short-clip player for same-voice non-lexical clips ("mm"), and for the uptake prelude when
  that prelude is a cached clip. It is mixed below the reply channel, it never overlaps her own reply, and it is off
  unless `duplex.audioBackchannel` is on.

**Reply-channel states** (owned by the floor manager; the player only obeys):

| state | meaning | entered by |
|---|---|---|
| `warming` | stream open, bytes buffering, **nothing audible** | a C or W draft chosen as likely; she is held, not playing |
| `held` | bytes ready, waiting for the floor (commit, or a TRP after a safety hold) | the draft is ready before commit |
| `playing` | audible | the floor manager grants the floor |
| `ducked` | gain 0.2, still playing | device onset during her speech (~90 ms, exists) |
| `paused` | paused at the last word gap, buffer kept | sustained onset or server speech_started (exists) |
| `yielded` | stopped; `heardUpTo` reported | the overlap class is turn, repair, stop, nahi or answer |

**What is new compared with today.**
- `warming` and `held` let audio be ready **before** the floor is granted, so first sound equals commit plus playback
  lead (110 ms [T]).
- On `yielded`, the device reports `heardUpTo = {responseId, chars, ms}` from the playback clock. Study B: 25% → 96%
  repair anchoring in PACE [P]. `teacher_interrupted` alone does not say *where*.
- A repair request ("kya?", "phir se") replays from the last heard clause, **shorter and slower** (Study C P7). That
  needs a "repeat from clause k" path, which is a Director seam (S4).

**Her own projection cues (Study C P13), enforced in code at delivery time.**
- Her questions end with a yield cue: a final rise, a tag, then silence.
- She never pauses right after a clause-final verb mid-turn, because in Hindi that is a completion cue the child will
  take.
- She never trails off on "toh…".
- These are checks in the HUMAN-VOICE delivery planner (`expressive/seam.js`), never instructions to the model.

##### 2.5 BUILD: work in parallel, revealed only at turn boundaries (server)

Build jobs are launched from three triggers:

| trigger | when | what can launch | never |
|---|---|---|---|
| **beat plan** (exists) | lesson start and each beat boundary; `neededAtMs` lead ≥ the archetype's race p90 (90 s) | Studio race (gpt-6-sol ∥ terra ∥ gpt-6-luna, 26.7/48.7 s [T]); library mounts; T1 engine params | a live build at bond stage `meeting`; any build in strain |
| **teacher's line** (exists) | an explanation beat | the whiteboard drawing script, synced to her guarded line (`whiteboardIntentOf`) | on the voice lane, a closing move, or a late answer |
| **partial intent** (new) | a slice note says `misconception{id}` at p ≥ the kit threshold, or `asks` matches an on-topic curiosity question | **prefetch only**: a library lookup, a T1 parameter derivation, a skeleton (≤ 300 ms), a whiteboard script draft for the likely contrast | anything reaching the screen mid-utterance; a live codegen race (its lead time is never there mid-turn) |

**Result triage** (code; from Gemini's async tools and GPT-Live's delegation [V], adapted):

| result | class | what happens |
|---|---|---|
| safety (predicate on a partial, or a model distress note) | **INTERRUPT** | the floor goes to SAFETY-attend at once (§6). Nothing is spoken over the child; the safeguard is spoken at the TRP |
| a build ready, a whiteboard script ready, a library mount ready | **WHEN_IDLE** | becomes a Studio `reveal` proposal at the **next** `/turn`, where the kernel decides (attention budget 1, conflict table: never on a closing move). It is never revealed while the child holds the floor (Study C §7.2) |
| a note, a classify hint, a learner-model update | **SILENT** | quiet context for the Director at the TRP; no speech, no screen change |
| a child-requested aid ("dikhao", "picture se samjhao") | WHEN_IDLE, but **urgent**: the next TRP even mid-beat | the kernel decides; the request is a strong reason code |

The only exception to "nothing new on screen mid-utterance" is an aid the child asked for, and even that waits for
the next TRP.

##### 2.6 The FLOOR MANAGER: the arbiter (device, pure reducer)

`src/duplex/floorManager.ts` (proposed) is a pure reducer: `(state, event, now, ctx) → {state, actions[]}`. It
supersedes nothing at first. It runs in **shadow** beside `src/lesson/floor.ts` and logs both decisions (§7, I1).

**States** (they refine Study C §7.1; each one maps onto the 8 shipped floor states, so the Desk does not change):

| floor-manager state | shipped `Floor` | teacher body | teacher voice | brain |
|---|---|---|---|---|
| `T_SPEAKING` | speaking / showing | speaking, accent nods on her own prosody (exists) | playing | next-turn work continues |
| `T_YIELDING` | yielding | lean-in at the hand-over | last 250 ms | W drafts start (closed items) |
| `C_WAITING` (WT1) | your_turn | the YOUR TURN lean, gaze on the child, Andrist aversions | silent | W drafts; the WT1 ladder runs (Study C P4) |
| `C_SPEAKING` | listening | listening tilt; content-blind nods on BOPs (§3.2) | silent (audio "mm" only if flagged) | slices → notes; safety on every partial |
| `C_PAUSED` (candidate below threshold) | listening | the "still with you" pose: slight lean, brows; no YOUR TURN glyph | silent | C speculation launched; hold window running |
| `C_HOLD_REQUESTED` | listening | relaxed "take your time" posture; chip in the status strip | silent ≤ 8 s, then a face check-in, then an offer at 15 s | WT1 nudges suspended |
| `COMMITTED` (revocable) | heard → thinking | consider-answer pose ≤ 150 ms, cognitive glance away (exists in THINKING) | `held` or the first audible uptake | promote W/C or run K |
| `OVERLAP` | listening (barge-in) | upper face to listening (exists) | `ducked` → `paused` | overlap classifier (§3.5) |
| `SAFETY_ATTEND` | listening (or thinking) | calm, attentive, no expression change, no nods | silent until a TRP, then the safeguard | non-safety generations quarantined |

**Arbitration order** inside the reducer (first match wins; this is the device-side mirror of the kernel's authority
order):
1. safety;
2. explicit child floor commands (stop, ruko, phir se);
3. overlap during her speech;
4. hold request;
5. end-of-turn decision;
6. backchannel;
7. WT1 ladder.

**Tick:** every audio frame (20-32 ms) plus every STT event. The reducer must run in ≤ 1 ms per event; it is regexes
and arithmetic, measured by unit benchmark at build time.

---

#### 3. Decision policies (features, thresholds, maker, latency budget)

All numbers are starting values [E]. Each one belongs to an experiment that will replace it (§8). "Budget" means the
time from the triggering sensor event to the action.

##### 3.1 End of turn: done, or still thinking?

**Combiner.** At each candidate (silence run ≥ `cand`, default 500 ms; 300 ms is allowed only after X1 validates a
predictive scorer):

```
logit P(done) = w0 + w_lex·logit(policyScore(text, ctx).p)          // Study C lexical layer, cross-script (exists, M-C1)
              + w_form·completeness(text, answerForm)                  // Study B §7.3: value present, closer, no trailing operator
              + w_audio·logit(pTurnEnd)                                // Smart Turn v3.2 once validated (X1); weight 0 until then
              + w_pitch·fallingPitchIntoPause + w_energy·fallingEnergy // device prosody (timing only, never affect)
              + w_sil·(silenceRun − cand)/1000                         // more silence → more likely done
              − w_pace·z(silenceRun | this child's within-turn pause distribution)  // the pace prior, after session 3 only (P12)
              − w_repair·repairing − w_switch·codeSwitchAtEdge         // self-repair markers; P11
```

- Until E1 data fits the weights, the combiner is the **shipped schedule**: `policyDecide` (Study C), with
  `w_audio = 0` and the prosody terms used only as tie-breakers of ±0.05.
- No learned weights before E1. A model fitted to synthetic speech would encode TTS prosody, not children.

**Thresholds and holds** (the shipped `endThreshold` schedule plus Study C's hold windows):

| context (`ui.answerForm` / beat) | commit when P(done) ≥ | else hold (ms, after the candidate) | revocable until |
|---|---|---|---|
| yes/no, choice, tap | 0.3 | 0 | first audible verdict word |
| number / fraction, value present, fluent | 0.3 | 0 | **first verdict word**, ≥ 1.5 s after the last value (law 2) |
| number / fraction, no value yet, or a hesitation earlier in the turn | 0.3 | 700 | ditto |
| default (short open answer) | 0.55 | 800 | first audible word |
| probe / why | 0.75 | 1,200 | first audible word |
| explanation / teach-back / worked step | 0.8 | 1,500 | first audible word |
| hold request heard | — | 8,000, then a face check-in, then an offer at 15 s | — |

**Where a decision model fits** (the brief asked about calibrated models such as TypeSafe Jev, and LiveKit- or
Pipecat-style detectors):

| candidate | what it is | can Taxila call it? | can it sit in this decision? |
|---|---|---|---|
| **TypeSafe Jev** | a "System One" model: state plus typed questions in, calibrated probabilities out, no text; 70-500 ms per call [V]; ECE 0.0588 on 662 prompt-injection messages [V, third party]; text only; weak at arithmetic and counting [secondary explainer]; no Hindi claims; $0.042 per 1M input tokens on Cloudflare and TypeSafe [V] | **No.** It is not sold Direct from Azure (Azure-only directive) | Not in the critical path even if it were: 70-500 ms on top of a 500 ms candidate defeats the purpose. Its **pattern** (typed, calibrated, no free text) is what we copy (below) |
| **LiveKit text turn detector** | Qwen2.5-0.5B, 50-160 ms, Hindi TPR 99.4 / TNR 96.3 [V]; deprecated; LiveKit Model License | weights are licence-restricted (Study A) | **No.** We take the method only: dynamic endpointing from session pause statistics is our pace prior |
| **LiveKit adaptive interruption** | audio CNN, 86% precision / 100% recall at 500 ms, ≤ 30 ms [V] | LiveKit Cloud only | **No.** Same pattern, our own head (§3.5) |
| **Pipecat Smart Turn v3.2** | 8 MB int8, audio only, 23 languages including Hindi, BSD-2, 10-100 ms CPU [V] | **Yes** (open weights, on the device or on ACA CPU) | **Yes, as `pTurnEnd`, once X1 shows it beats a tuned 640 ms silence on child holds.** One team found it worse than tuned silence in real conversation (13.5% vs 2.7% cut-offs, 37 pauses [P via Study B]) |
| **Azure-hosted calibrated decision** (Jev's pattern on Azure) | either (a) the classify deployment asked for a typed `{done: p}` scored from token logprobs, or (b) a small open classifier (an openjev reproduction, or a fine-tuned Qwen2.5-0.5B head) on ACA CPU in India | (a) a Direct model, if it returns logprobs (untested; live-transcribe does not [T]); (b) Azure compute with open weights, allowed | **Only inside a hold window, and only to shorten it** (law 4): launched at the candidate on explanation and probe turns, it returns ~470-730 ms later [T: grok p50], inside the 1.2-1.5 s hold. If `P(done) ≥ 0.9` and calibrated (D3: ECE ≤ 0.08 on child data), the hold ends early. It never ends a turn below the candidate silence, never lengthens past the cap and never triggers speech |

**Budget per decision.**

| decision | maker | budget (sensor → action) | why this budget |
|---|---|---|---|
| candidate reached | device code (silence counter) | ≤ 32 ms after `cand` | a frame |
| commit or hold | device code (lexical + form + prosody; Smart Turn when validated) | ≤ 100 ms after the candidate (Smart Turn 10-100 ms [V]) | anything slower is just more silence |
| shorten a hold early | Azure calibrated model, async | arrives ≤ hold − 200 ms, else ignored | it must fit inside the hold |
| revoke (child resumes) | device code | ≤ 32 ms after onset | before her next word |

##### 3.2 Backchannels: body first, sound rarely, never a verdict

| channel | when (all must hold) | rate | maker / budget |
|---|---|---|---|
| **visual nod** (small single continuer nod; never the double "agreement" nod) | `C_SPEAKING`; child voiced ≥ 1.5 s in this turn; BOP = a 200-500 ms dip with falling energy and pitch in the child's lowest session tercile (Ward & Tsukahara, via Study C §7.4); not inside a number or choice answer; not `SAFETY_ATTEND` | ≤ 1 per 3 s (cap); expect about 1 per 4-8 s on long turns | device code; ≤ 150 ms from the dip start (the nod must land inside the pause, mid-word < 10%) |
| **lean / brow "still with you"** | `C_PAUSED` | state, not an event | device code; ≤ 100 ms |
| **thinking glance** (cognitive aversion) | `COMMITTED` before first sound, and her own `hum` events (exists) | once per commit | device code |
| **audio "mm"** (same-voice clip; non-lexical only) | flag `duplex.audioBackchannel`; child explaining ≥ 4 s; ≥ 400 ms pause with falling pitch; not a number or choice answer; echo canceller confirmed (local pausing still on, `cascadeLink.ts`) | ≤ 1 per 12 s | device code; ≤ 150 ms |
| **never** | "haan", "achha", "sahi", "bilkul" as continuers during content | — | Study C P6: in Hindi a continuer "haan" and a "yes" are the same word |

**A deliberate departure from Study C.**
- Study C suppresses the audio "mm" for 2 s after a detected wrong value.
- This design makes **nods content-blind**: their timing is a function of prosody only. A suppression keyed to
  wrongness is itself a verdict leak ("she stopped nodding, so I'm wrong").
  `design-v2-rejected-correctness-face` forbids a correctness-keyed face.
- The audio "mm" keeps Study C's suppression **and** stays off by default until E-C3's blind verdict-leak test passes
  (≤ 55% of listeners can tell right from wrong steps by the timing). D5 tests both variants of the nod.

**Human reference.** Hindi adults backchannel about 0.079 times per second (IndicFDB [T]), roughly one every 13 s. A
nod every 4-8 s plus a sparse "mm" lands near that total, with most of it carried by the body. This is a hypothesis
that D5 must check with children.

##### 3.3 When the teacher answers early: the complete list

| trigger (detected in code) | what she does | timing |
|---|---|---|
| **complete closed answer** (P(done) ≥ threshold) | commit; the uptake is the first sound (law 2); the verdict comes ≥ 1.5 s after the value | first sound target ≤ 0.9 s p50 |
| **the child asks a question** (`asks` + a yield cue: rising pitch or "?", verb-final, a "na" tag) | commit at the candidate with threshold 0.3; the reply is an answer, not a re-ask | as above |
| **IDK / trouble / "samajh nahi aaya"** | commit now (Study C yield tail); the Director's repair move | ≤ candidate |
| **"ruko / ek minute / soch raha hoon"** | `C_HOLD_REQUESTED`: silence, the face, the chip | ≤ 100 ms |
| **"kya? / phir se"** while she speaks | yield; replay from `heardUpTo`, shorter and slower | ≤ 400 ms |
| **the child calls out the answer during her question** | fold-in: yield, take it as the answer to the question being asked (Duplex Cue: humans adapt 68% [P]) | ≤ 400 ms |
| **safety partial** | `SAFETY_ATTEND`; never over the child; the safeguard at the TRP or after ≥ 1.5 s of silence | §6 |
| **off-task monologue** ≥ 20 s (B2) or ≥ 30 s (B3) with no item terms or values | a gentle redirect at the next TRP, opening with uptake of the child's own words | never mid-clause |
| **a word search** ("woh… kya kehte hain…") plus ≥ 1.5 s of silence | offer a cue (first sound, a picture, a choice), not the term if the term is the target | at the pause |

##### 3.4 When she never interrupts

- **Reasoning aloud.** On explanation, teach-back and worked-step beats, the turn ends only at a TRP (Study C P1).
- **Self-correction in progress.** While `repairing` is true, the hold extends to the beat's cap.
- **A wrong step mid-explanation.** Nothing happens until the TRP. The Director then opens with uptake and one chance
  to self-repair (Study C P9; SHANKS 24.9% false interruptions on correct solutions [T]).
- **A disclosure.** The safeguard is never spoken over a child who is talking (§6).
- **A code switch.** A switch at the edge of the utterance is planning, not a TRP (P11).
- **Silence after her question.** Only the WT1 ladder ends it (P14). There is no model-initiated speech out of silence.

##### 3.5 Barge-in and overlap repair

The pipeline is today's pause-then-decide (`cascade-barge-pause-decide`), with three upgrades.

1. **Acoustic gate.**
   - Device onset → `ducked` (~90 ms, exists).
   - Sustained ≥ 120 ms, or server speech_started → `paused` (exists).
   - New: `pVAD` (if enrolled) below threshold → stay `ducked` and do not pause (siblings, TV).
   - New: an **interruption head** on the first 200-300 ms of overlap audio. It is a small CNN trained on our echosim and
     E1 data, LiveKit's pattern [V], with labels {continuer, real turn, noise, echo}.
   - Until the interruption head exists, the transcript decides, as today.
2. **Transcript class** (`overlapKind`, Study C; 16/16 on M-C1 [T]):
   - continuer → resume from the last word gap;
   - repair → yield and repeat from `heardUpTo`, shorter;
   - stop → yield and hold;
   - "nahi" → yield and take the turn;
   - an answer to her yes/no check (needs `ui.expect`) → yield, and the answer is the child's turn;
   - content → yield, and the turn is the child's.
3. **Reporting.** `heardUpTo` goes with the next `/turn` (S3). The server trims the teacher's history to what was heard.

**Budgets.**
- duck ≤ 120 ms from onset;
- pause ≤ 250 ms;
- yield, once the class is known, ≤ 400 ms p50 from onset. For comparison, GPT-Live-1 takes 1.41 s median to stop
  [T, turnprobe].

**Reversal bars kept from today.**
- Real answers swallowed as continuer or echo: ≤ 2%.
- Echo-triggered pauses: no worse than the `bargeStats` baseline.

##### 3.6 Silence ladder (WT1) and the revocable commit

**WT1.** Study C P4's per-question ladder replaces the flat `waitNudgeSec`:

| question type | first face nudge | first verbal re-entry |
|---|---|---|
| recall | B2 4 s, B3 3 s | +3 s |
| reasoning | B2 7 s, B3 6 s | +4 s |
| after a hold request | 8 s | 15 s, as an offer |

Answers in the child's weaker language get ×1.3. The Director sends `ui.waitNudge` per item (S6).

**Revocable commit.** A commit is revocable until her first **verdict-bearing** word. If the child resumes:
- the reply channel goes `held` → discarded, or `playing` the uptake → stops after the current word;
- the fragments merge, and the reply is re-planned (a new C generation);
- the server marks the first turn row **superseded** and never grades it (S2).

---

#### 4. Target experience numbers, and what each part contributes

##### 4.1 Targets (first wave; each has a gate experiment)

Gaps are measured from the child's last voiced frame to the first audible teacher sound at the child's ear (turnprobe
style, India probe fleet; Study A's proposed harness).

| # | metric | target p50 / p90 | today | gate |
|---|---|---|---|---|
| G1 | visible receipt | ≤ 150 ms p95 | L0 target, unmeasured on device | D6 |
| G2 | first sound after a complete **closed** answer | **≤ 900 / 1,200 ms**; stretch ≤ 650 ms | 3,244 / 4,640 [T, n=48] | D6, D1 |
| G3 | first reply content, code-graded closed | ≤ 1.8 s / 2.4 s (verdict-late by design) | same as above | D6 |
| G4 | first reply content, model-graded | ≤ 2.6 s / 3.2 s | same | D6 |
| G5 | explanation turn: silence before she speaks | ≥ 1.5 s, deliberately, visibly listening; first content ≤ 2.6 s | 900 ms + Director | E-C4 |
| G6 | false take-over (she starts, child continues ≤ 2 s) | ≤ 3% of child turns, ≤ 1 per 10 min of child speech; **0** inside a hold request | unmeasured (900 ms fixed arm is the baseline) | X1, E-C1 |
| G7 | missed yield (complete answer, > 2 s of dead air before any teacher sound) | ≤ 2% | unmeasured | D6 |
| G8 | real interruption: duck / yield | ≤ 120 ms / ≤ 400 ms | duck ~90 ms [T]; yield transcript-bound ≈ final latency | X3, D6 |
| G9 | continuer misread as a turn (she stops for "mm") | ≤ 10% | 11/16 correct overall on M-C1 [T] | X4, device logs |
| G10 | real turn swallowed as a continuer or echo | ≤ 2% | existing reversal bar | device logs |
| G11 | visual nods on long child turns | 1 per 4-8 s; mid-word < 10% | none | D5 |
| G12 | audio continuers | off; if on, ≤ 1 per 12 s and verdict-leak ≤ 55% | none | E-C3 |
| G13 | repair anchoring after a repeat request | ≥ 90% | no anchor | X5 |
| G14 | safety: predicate on partials | ≤ 50 ms after the partial; **0** non-safety teacher utterances after a distress partial in the same turn | final only | D2 |
| G15 | build reveals mid-utterance | **0** (aids the child asked for wait for the TRP) | n/a | unit + sim |

**Why not "≤ 600 ms median" across the board** (the brief's example)?
- The floor of physics in this stack: 500 ms candidate silence + ~40 ms device commit + 68 ms MAI final + ~60 ms RTT
  + 110 ms playback lead ≈ **0.78 s** even with zero thinking [E/T].
- 600 ms needs a candidate near 300 ms. That is where human Hindi gaps live (259 ms, IndicFDB [T]). It is safe only
  with a predictive scorer that is validated on children (F in §4.2: 0.65 s p50 [E]).
- For explanations, a fast reply is the wrong target. Rowe's wait time II says to hold.

##### 4.2 Measurement M-D1: what each change buys (composition of measured stages)

**What it is.** `evals/duplex/budget-sim.mjs` makes 200,000 seeded draws per scenario.
- Director stages are bootstrapped from the 48 real cascade turns in `evals/results/cascade-latency-2026-10-03-*.json`.
- India stages are lognormals fitted to measured p50/p90s: MAI 68/75, India `/turn` 1562/2020, DragonHD 228/287.
- Four stages are **assumptions** [E]:
  - device commit: LN(40, 90);
  - India RTT: LN(60, 120);
  - Chennai → Central India TTS delta: U(0, 60);
  - fast-path server time: U(55, 70).
- Scenario A bootstraps whole rows, so it checks the harness, not the independence assumption. It reproduces the
  measured 3,244/4,640 ms (n=48).
- Result file: `evals/duplex/results/budget-sim-2026-10-04.json`.

| scenario (closed answer unless stated) | first sound p50 / p90 (ms) | content p50 / p90 | P(sound ≤ 1.0 s) |
|---|---|---|---|
| A today, eastus2 (calibration; measured 3,244 / 4,640) | 3,237 / 4,640 | same | 0 |
| B India app today (900 ms server VAD, MAI, Director, DragonHD) | 3,072 / 3,535 | same | 0 |
| C B + 500 ms candidate, commit at the candidate | 2,675 / 3,135 | same | 0 |
| C2 C + the turn's store step after first audio (−63 ms p50 [T]) | 2,609 / 3,070 | same | 0 |
| C3 C2 + device-decided commit (no server VAD overhead) | 2,486 / 2,949 | same | 0 |
| P C3 + uptake prelude (the child's token) as first sound | **1,018 / 1,101** | 2,488 / 2,947 | 0.38 |
| D C3 + wait-time drafts, body TTS at commit | 1,114 / 1,212 | 1,114 / 1,212 | 0.02 |
| **E D + body and uptake audio pre-synthesised (server-cached)** | **849 / 928** | 849 / 928 | **0.98** |
| F E with a 300 ms candidate (needs a validated predictive scorer) | 649 / 727 | 649 / 727 | 1.00 |
| X0 explanation, held 1.5 s, Director after commit | 3,987 / 4,450 | same | 0 |
| X1 explanation, held 1.5 s, speculation from the candidate fragment | 2,553 / 2,949 | same | 0 |

**What it says** [E: a composition model, not a measurement of the new system].
- **Each of the "obvious" levers buys only a few hundred ms.**

  | lever | step | saving at p50 |
  |---|---|---|
  | India app | A → B | ~165 ms |
  | 500 ms candidate | B → C | ~400 ms |
  | store after audio | C → C2 | ~65 ms |
  | device commit | C2 → C3 | ~120 ms |

  Stacked, they still leave **~2.5 s**, because the Director (classify ∥ reply, about 1.5 s) stays on the path.
- **Sub-second needs the thinking to have happened before the commit.** That means wait-time drafts plus cached audio
  (E: 0.85 s), or a verdict-neutral uptake that decouples first sound from content (P: 1.0 s, with content still at
  2.5 s).
- **Candidate speculation matters most on held turns.** It cuts an explanation turn from 3.99 s to 2.55 s (X0 → X1),
  because the 1.5 s hold now hides the Director. On closed answers that commit at the candidate it buys ~0: the
  candidate *is* the commit.
- **Content timing under law 2.** At E the first ~0.6-0.9 s of audio is the uptake, so the verdict word lands about
  1.5-1.8 s after the child's value. That is the self-repair window Study C asked for, delivered without dead air.

**Cost of the additions** [E; prices from MODEL-STACK §1].

| addition | unit cost | per lesson-hour |
|---|---|---|
| wait-time drafts | ≤ 3 reply calls × $0.00023, plus ≤ 6 clips (~60 chars of uptake + ~100 chars of the likeliest body) × $22/1M chars ≈ $0.0043 per item | at an assumed 40-60 closed items per hour [E]: ≈ $0.17-0.26 |
| candidate speculation | +≤ 40% reply calls | ≈ +$0.02 |
| listening notes | ≤ $0.01 per lesson (cap) | — |

- The total is roughly +$0.2-0.3 per lesson-hour on a ≈ $1.6 cascade hour.
- D1 has a cost gate: W is kept only if its hit rate is ≥ 60%, and pre-synthesis is limited to the outcome the learner
  model rates likeliest when the budget is tight.

---

#### 5. Models per loop (Azure first, from MODEL-ROUTER §0) and what to test

| loop | role | primary (Azure, Direct) | fallback | evidence [T] | what to test before it ships |
|---|---|---|---|---|---|
| LISTEN | grading ear, eastus2 | `taxila-live-transcribe` (gpt-live-transcribe, D4) + script prompt | Azure Speech RT LID | CER 0.028, answers 76/78, 0/12 non-speech; first partial 1.41 s | the client commit with server VAD at 1.5 s (D7); no logprobs, so the low-ASR gate stays off |
| LISTEN | grading ear, India | `MAI-Transcribe-2-Streaming` (southindia) | D4 | final 68 ms (Chennai), answers 78/78; first partial 2.58 s | meter and Preview sign-off (open gates); client commit (D7) |
| LISTEN | fast lexical ear (scale) | Nemotron-3.5 streaming 0.6B, self-hosted on Azure GPU in India | MAI | partial every 320 ms, complete 254 ms after the end, 0/30 non-speech | E1 shadow (STT-v3); partial-stability statistics for slicing |
| LISTEN | end-of-turn audio | Smart Turn v3.2 int8 on the device (BSD-2) | none (lexical + silence) | Hindi 93.4% adults [V] | **X1/E-C1 on child holds vs tuned 640 ms silence** |
| LISTEN | interruption head, pVAD | own small CNN / ECAPA-class embedding on the device | the transcript classifier | none yet | X3, X4 on echosim + device classes |
| UNDERSTAND | code checks | `scanSafety`, `classifyFast`, `policyScore`, completeness | — | predicate ~31 µs; M-C1 | partial-safety replay over all STT rows (D2) |
| UNDERSTAND | listening note, distress second read | classify deployment `grok-4-1-fast-non-reasoning` | `taxila-fast` (other family, S2 16/16) | 726/914 ms; distress 16/16 | note usefulness: does the Director's move change with notes? (D8) |
| UNDERSTAND | calibrated "done?" (hold shortener) | (a) the classify deployment with logprob scoring, **if** logprobs are returned; (b) Qwen2.5-0.5B head on ACA CPU India | none (the hold simply runs) | — | D3: ECE ≤ 0.08 and ≥ 0.9-precision shortening on child explanations, offline replay first |
| THINK | reply (W, C, K) | `taxila-fast` (gpt-5.6-luna), effort none | `taxila-mistral-m35` (needs a code path) | TTFT 712/889 US, 878/1107 CHN; spec hits 10-11/12 | W-reply ear panel vs K (D1); candidate `taxila-gpt6-luna` waits on its own gates |
| THINK | classify at commit | `grok-4-1-fast-non-reasoning` + 1.5 s hedge | `taxila-fast` | 38/40, 0 graded wrong | unchanged |
| SPEAK | reply TTS | Azure Speech `en-IN-Diya:DragonHDLatestNeural` (candidate) / `gpt-4o-mini-tts` (prod) | mini-tts | first byte 228/287 vs 688/931 unprewarmed | Chennai → CI first byte (MODEL-STACK unmeasured #5); clip splicing |
| SPEAK | backchannel and uptake clips | the same voice as the reply (DragonHD synth, cached per item) | none (body only) | `hv-instructed-nonverbals`: instructed non-verbals 0/18 | E-C3 verdict leak; HV-16 blind test for the uptake |
| BUILD | Studio race | `taxila-gpt6` low ∥ `gpt-5.6-terra` low ∥ `taxila-gpt6-luna` low | `taxila-codex` on 429 | 15/15 by 60 s, 26.7/48.7 s | unchanged; partial-intent prefetch hit rate (D9) |
| BUILD | whiteboard script, T1 params | W2-F archetype planner (code + the fast model as defined there) | skeleton | — | prefetch from `misconception{id}` notes (D9) |
| FLOOR | every floor decision | **code** (device) | — | `code-keeps-decisions` | D4 shadow disagreement |

**Excluded, with reasons.**
- GPT-Live-1: no hold gate, so a reply can come before our predicate sees the child's words; about $3/h (Study A §6.2).
- gpt-realtime-2.1 as the floor: it stops for every backchannel, 56/56 [T].
- Any native duplex model as the teacher. Human-1 (Hindi) rates 0.56/5 on replies to interruptions [T], and none is sold
  Direct on Azure.
- Jev, LiveKit Cloud, Krisp: not Azure.
- `taxila-ds41`: hangs on distress.

---

#### 6. Safety: the predicate floor runs on partials first

1. **Where.** `scanSafety` runs in two places on every slice:
   - **On the device**, as soon as a partial arrives. The device bundle imports the *same* module
     (`server/director/safety.js`, whose imports `compiler/gates.js` and `compiler/floor.js` must stay browser-safe; a
     build check asserts it). It is never a copy. "A lane cannot quietly carry a second copy."
   - **On the server** at `/api/duplex/slice`.
   - The device check exists for latency (≤ 50 ms, G14). The server check exists for authority. A tampered device can
     only *add* care; it can never remove the server's check, and `/turn` still runs the predicate on the final.
2. **What a hit does.** It enters `SAFETY_ATTEND`, and the hit is **sticky** for the turn.
   - All WT1 and hold timers freeze.
   - No backchannel, no nod, no expression change; the face goes calm and attentive (`calm_steady`, TA8).
   - Every non-safety generation (W, C) is aborted and quarantined, so no cached cheerful body can play.
   - Any reply playing ducks and yields at the next word gap. She does not speak over the child.
   - The next `/turn` carries `duplex.safetyPending: kind`. The Director's safeguard move wins rank 0 **even if the ASR
     revises the final** so that the predicate no longer matches. An inclusive predicate errs safe (safety.js header).
3. **When she speaks.** At the TRP, or after ≥ 1.5 s of silence following the hit. LateIntent [P]: harmful intent that
   arrives after a pause gets less safe handling unless the system waits about 1.5 s. The speech is the safeguarding
   reply with care and 1098 / 14416 in the same turn. If the child stays silent after a disclosure, she says one gentle
   presence line after ≥ 6 s, never a leading question (Study C P10).
4. **The model's second read.** A listening note includes `distress` on note-eligible turns. Today the passive-ideation
   gaps live in the model (`scan-safety-passive-ideation-2026-10-04` added two shapes to the predicate). A model
   `distress: true` is treated like a predicate hit for this turn.
5. **The identity floor.**
   - Liveliness is never a goal stated as "passes for human".
   - A mid-turn "tum real ho? / are you a robot?" is a question (§3.3): she commits fast and answers honestly. The
     persona invariants are unchanged and still gate in `verify-release`.
   - The backchannel channel carries no lexical warmth tokens. "main yahin hoon" is a rejected exclusivity shape
     (`main-yahin-hoon-as-exclusivity`), and there is no companion register.
6. **Duplex-specific attacks** (Study B §5.10).
   - Speech injected into her reply mid-response raised attack success by 34-39 points in one paper.
   - Here, overlap content becomes the child's next turn. It goes through the normal classify, predicate and guard
     path; it is never appended to her in-flight generation.
   - The W2 guards (`revealsAnswer`, `floorViolations`) run on every W and C draft **before** it is cached as audio.
     Nothing unguarded is ever pre-synthesised.
7. **No key material on the device.** W audio is cached **server-side** (India app memory, TTL = the item) and streamed
   at commit. The device never holds an outcome-labelled clip set that would reveal the key. Body text passes
   `revealsAnswer` regardless.

---

#### 7. Integration plan (W2 owns `server/routes/lesson.js`, `server/brain/**`, `src/child/lesson/**`)

##### 7.1 New code (this workstream; flags default off)

| id | file (proposed) | what | depends on |
|---|---|---|---|
| I1 | `src/duplex/floorManager.ts` | the pure reducer (§2.6) + shadow logger | `turnPolicy.ts` (exists) |
| I2 | `src/duplex/ear.ts` | frame features, BOP detector, candidate clock, client commit | `vad.ts`, `dsp.ts` (read only) |
| I3 | `src/duplex/heard.ts` | playback clock → `heardUpTo` | `ttsStream.ts` events |
| I4 | `src/duplex/backchannel.ts` | nod scheduling (content-blind), clip channel | avatar seam S7 |
| I5 | `src/duplex/safetyPartial.ts` | device predicate wrapper (imports the server module) | build check |
| I6 | `server/duplex/routes.js` | route table: `POST /api/duplex/slice`, `POST /api/duplex/candidate`, `POST /api/duplex/wait` | router registration (S1) |
| I7 | `server/duplex/notes.js` | code checks + gated model note; in-memory store keyed by GenKey | `safety.js`, `classify.js` (read only) |
| I8 | `server/duplex/think.js` | generation manager: W drafts, C speculation via `speculate()` (imported, not edited), AbortControllers, caps | S5 |
| I9 | `server/duplex/audioCache.js` | server-side pre-synth for W bodies and uptake clips (TTL = item) | `server/voice/azureTts.js` (read only) |
| I10 | `server/duplex/triage.js` | INTERRUPT / WHEN_IDLE / SILENT for build and safety results | Studio seam |
| I11 | `evals/duplex/*` | D1-D9 harnesses + the turnprobe-style at-ear harness from Study A | — |

##### 7.2 Seam requests to the W2 owners (each additive, each behind a flag)

| # | owner / file | request | why |
|---|---|---|---|
| S1 | router (`api/[...route].js` / server router) | register `server/duplex/routes.js` as its own route table | no edits to `lesson.js` |
| S2 | W2-E `server/brain/turn.js` | accept `TurnRequest.duplex = {transcriptHash, genId?, safetyPending?, superseded?: turnSeq, heardUpTo?, holdCue?}`; promote a C or W artefact on hash identity; never grade a superseded row | revocable commit, promotion, sticky safety |
| S3 | W2-E turn store (`rows.js` / history) | trim the last teacher turn to `heardUpTo` in the history sent to the model (about 5 lines) | Study B §5.8 |
| S4 | W2-C Director | a `repeat_from(clauseIdx, slower)` move for repair requests | P7 |
| S5 | W2-E `replyKey` / `KEY_PARTS` | a closed-item key **without `said`** when `classifyFast` decided, plus a required verdict-free opening (W drafts) | law 3; gated on D1 |
| S6 | W2-C / `persona/adapter.js` | `ui.waitNudge` per item (P4 ladder) and `ui.expect: yesno \| number \| choice \| open` in `shared/contracts.ts` `TurnResponse` | WT1, overlap class |
| S7 | W1-F / W2-D avatar `src/avatar/behaviour.ts` | public `listenerNod(peakDeg)` (single continuer form), `holdPose()`, and a `stillWithYou` sub-pose of `listening`; today the nod impulse is private and nods follow only *her* prosody | listening face |
| S8 | W2-E `server/brain/moment.js` | `Moment.uptakePrelude` may name a cached clip id (W audio), not only a token to synthesise; flag stays HV-16-gated | first sound at commit |
| S9 | W2-E turn commit | move the `@stored` step after the response returns (−63 ms p50 [T]); TEACHER-BRAIN §5.1 stage 9 already places it after first audio | C2 |
| S10 | `src/lesson/cascadeLink.ts` owner | (a) call `floorManager.onEvent` in shadow; (b) behind `duplex.floorFsm=on`, obey its actions (duck/pause/resume/yield/commit/hold); (c) expose `child_partial` to the slice poster; (d) send a client `input_audio_buffer.commit` | the device floor |
| S11 | `src/lesson/floor.ts` owner | map the floor-manager states to the 8 shipped floors (table §2.6); suspend the nudge timer in `C_HOLD_REQUESTED` | the Desk unchanged |

##### 7.3 How it meets the kernel and the Moment

- **The kernel is untouched.** Everything mid-utterance is a *device floor* decision or a *quiet* server artefact, and
  none of it is a proposal.
- Floor-manager state becomes kernel input only at the TRP, through `/turn`:
  - `safetyPending` reaches rank 0 through the existing safety path;
  - a WHEN_IDLE build becomes a Studio `reveal` proposal (rank 12, attention 1, the conflict table applies);
  - notes reach the Director as SILENT facts;
  - a hold-request history becomes a vibe input (`waitNudgeSec`).
- **The Moment stays the one producer of her affect** (TB6). The listening face is not affect: nods, lean and glance
  are *floor* behaviour, never `teacherAffect`, so `momentOf` remains the only source of expression. During
  `SAFETY_ATTEND` the device suppresses even floor behaviour, which mirrors TA8.
- **The face.**

  | floor-manager state | `FaceState` |
  |---|---|
  | `C_SPEAKING`, `C_PAUSED`, `C_HOLD_REQUESTED`, `OVERLAP`, `SAFETY_ATTEND` | `listening` |
  | `C_WAITING` | `your_turn` |
  | `COMMITTED` | `thinking` (its cognitive glance exists) until first sound |

  Puppet2D's existing mic-level "Listener" nods (`p2d-r2-expr-emitters`) are replaced by `backchannel.ts`'s BOP
  schedule, so one producer owns nods.

##### 7.4 Flags and rollout (each step has a pass bar before the next)

| step | flag | pass bar |
|---|---|---|
| 1 | `duplex.partialSafety` | D2: 0 missed hits vs final-only on all STT rows; ≤ 50 ms device latency |
| 2 | `duplex.heardUpTo` | X5 ≥ 90% |
| 3 | `duplex.floorFsm=shadow` | D4: disagreement log reviewed; 0 safety disagreements |
| 4 | `turn.policy=c` + hold-request state | M-C1 tables do not regress; E-C2 |
| 5 | `duplex.revocable` | P8 reversal: churn ≤ 300 ms p90 |
| 6 | `duplex.candidateSpec` | X2: −≥ 300 ms on held turns; 0 stale promotions |
| 7 | `duplex.waitDrafts` | D1: hit ≥ 60%, ear panel ≥ K, cost ≤ +$0.3/h |
| 8 | `duplex.listeningFace` | D5, G11 |
| 9 | `duplex.notes` | D8 |
| 10 | `duplex.audioTurn` (Smart Turn) | X1 / E-C1 |
| — | `duplex.audioBackchannel` | E-C3 + X4; may stay off for good |

---

#### 8. Experiments (new D-series; X- are Study B's and E-C- are Study C's, unchanged)

| id | question | method | n | pass bar |
|---|---|---|---|---|
| **D1** | Do wait-time drafts hit, and do they sound as good? | replay closed items in brain-sim with STUDENT-SIM answers; then the Hindi ear panel, blind W vs K | ≥ 200 turns sim; ≥ 40 pairs × 2 raters | hit ≥ 60%; W ≥ K on the panel (paired, CI excludes −0.25); 0 guard failures cached |
| **D2** | Does partial safety ever miss what final-only catches, and how fast is it? | replay `scanSafety` on every prefix of the 3,582 refresh transcripts + S/S2 distress sets streamed as partials | all rows | 0 hits lost; median first-hit word ≤ final; device ≤ 50 ms |
| **D3** | Is a calibrated "done?" model worth a slot inside holds? | offline: E1 explanation turns with labels from whether the child resumed; arms: code combiner; classify-deployment logprob score (if available); Qwen-0.5B head on ACA | ≥ 300 holds | ECE ≤ 0.08; at P ≥ 0.9, precision ≥ 0.95; mean hold saved ≥ 400 ms |
| **D4** | Where does the floor manager disagree with today's floor? | shadow logs on internal and pilot lessons | ≥ 500 child turns | every disagreement class reviewed; 0 safety disagreements |
| **D5** | Content-blind nods: do they leak verdicts, and do children talk longer? | blind raters on clips (right vs wrong steps with nods); E1 A/B: nods vs no nods | 60 clips; ≥ 30 children per arm | leak ≤ 55%; words per explanation not lower |
| **D6** | End-to-end at the ear, from India | turnprobe-style harness (Study A §7): synthetic child stimuli through a phone speaker into the real app on the probe fleet; G1-G10 | 30 turns per class per band | meets §4.1 |
| **D7** | Does MAI (and D4) honour a client commit with server VAD at 1.5 s? | a socket smoke | 20 utterances | final ≤ 100 ms after commit (MAI, Chennai); no lost audio |
| **D8** | Do listening notes change the Director's move for the better? | brain-sim: notes on vs off on why and teach-back beats | ≥ 100 turns | move agreement with a blind expert label +≥ 10 points; ≤ $0.01 per lesson |
| **D9** | Does partial-intent prefetch make WHEN_IDLE reveals ready at the TRP? | sim from E1 transcripts + kit misconception tags | ≥ 100 misconception turns | ready at the TRP ≥ 70% vs the beat-plan-only baseline |

The critical-path set is X1/E-C1, D1, D6 and E-C3. Without real children (E1), every target in §4 is [E].

---

#### 9. Failure modes (and what the design does about each)

| failure | consequence | mitigation |
|---|---|---|
| echo of her voice looks like a child onset | she stops for herself | existing echo skeleton + 3-strike local-pause self-calibration; interruption head; X4 |
| a sibling or the TV takes the floor | false yield, false commit | pVAD (X3); content-free overlap → `ducked` only |
| MAI partials arrive late | no lexical barge-in signal | acoustic gate decides duck and pause; the transcript confirms (two ears) |
| the W cache is stale (item changed, hint level changed) | the wrong body plays | GenKey includes itemId, hintLevel and lastMove; the TTL is the item; a hash mismatch → K path |
| self-repair after a fast commit | wrong verdict spoken | law 2: verdict-late delivery, revocable until the verdict word |
| the child goes on talking through the uptake | overlap | the uptake is a continuer-class sound; the floor manager yields at the word gap and merges |
| speculation storms (many candidates in a hesitant turn) | cost and churn | ≤ 3 generations per turn; a new one cancels the old |
| prosody misused as affect | a Code of Conduct violation | prosody features never leave the floor manager; no affect label is computed or stored |
| two producers of nods (Puppet2D Listener and `backchannel.ts`) | double nods | S7 makes one producer |
| device commit and server VAD disagree | a doubled or lost turn | server VAD at 1.5 s as a backstop only; the client commit wins; the outbox dedupes on `turnSeq` |

---

#### 10. Reversal conditions and proposed context entries

Proposed entries are in `context/inbox/duplex-architecture.json` for the main loop to merge. Their reversal conditions:
- **Device-owned floor.** Reverse if an India phone round trip to the India app is ≤ 40 ms p90 *and* a server floor
  measures equal on G6/G8; then the floor may move server-side for simplicity.
- **Fast mouth, late verdict.** Reverse if E1 shows self-repairs after a complete value in < 2% of closed answers;
  then the verdict may move up to the first clause.
- **Wait-time drafts.** Reverse if D1 hit < 60%, the ear panel W < K, or the cost exceeds +$0.3 per lesson-hour.
- **No model inside the child's turn except hold-shortening.** Reverse if E-C5 finds an intervention class with
  cut-off-correct ≤ 2% and better next-turn learning.
- **Content-blind nods.** Reverse if D5 shows content-blind nods after wrong steps are read as agreement (≥ 60% of
  child raters).
- **Cascade over native duplex.** Reverse if a Direct-from-Azure duplex model exposes a hold/release gate on output
  plus floor-policy parameters, beats this design on G2/G6 in D6, and passes the safety battery (Study A §6.2).

---

#### 11. Sources

- Studies A, B and C in this folder (and their source lists): Griffin, GPT-Live, Speak, Sparrow, LiveKit, Pipecat,
  IndicFDB, HumDial, SHANKS, PACE, LateIntent, Brahimi 2026, Rowe, Shiau 2024, Ward & Tsukahara, Bali 2009.
- TypeSafe Jev (accessed 2026-10-04):
  - Cloudflare model card: https://developers.cloudflare.com/ai/models/typesafe/jev/ (input schema, $0.042/1M input,
    32k context);
  - explainer: https://victordibia.com/explainers/jev/ (70-500 ms vendor latency; ECE 0.0588 on prompt injection;
    weak at arithmetic; text only);
  - MarkTechPost release note: https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev/ (fetch returned
    403; cited via search snippet).
- Repo measurements:
  - `evals/results/cascade-latency-2026-10-03-*.json` (48 turns);
  - MODEL-STACK §2.3;
  - MODEL-ROUTER §0;
  - `context/measurements.md` (STT refresh, partial timing);
  - `evals/duplex/results/{prefix-commit,turn-markers,budget-sim}-2026-10-04.json`.
