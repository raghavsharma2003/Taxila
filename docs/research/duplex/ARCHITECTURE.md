# Duplex liveliness, Study D: our architecture (the listening, thinking, building teacher on a cascade)

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

## 0. The answer on one page

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

## 1. What binds this design (read before arguing with it)

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

## 2. The loops

Every loop has one owner file (proposed), one clock, one output contract and one cancellation rule. All loops run all
the time. What changes is what the floor manager lets reach the child.

### 2.1 LISTEN: the ear (device, 20-32 ms frames)

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

### 2.2 UNDERSTAND: notes as the child speaks (server per slice, code first; never speech)

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

### 2.3 THINK: drafts kept warm, keyed and cancellable (server)

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

### 2.4 SPEAK: one mouth, two channels, five states (device + TTS service)

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

### 2.5 BUILD: work in parallel, revealed only at turn boundaries (server)

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

### 2.6 The FLOOR MANAGER: the arbiter (device, pure reducer)

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

## 3. Decision policies (features, thresholds, maker, latency budget)

All numbers are starting values [E]. Each one belongs to an experiment that will replace it (§8). "Budget" means the
time from the triggering sensor event to the action.

### 3.1 End of turn: done, or still thinking?

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

### 3.2 Backchannels: body first, sound rarely, never a verdict

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

### 3.3 When the teacher answers early: the complete list

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

### 3.4 When she never interrupts

- **Reasoning aloud.** On explanation, teach-back and worked-step beats, the turn ends only at a TRP (Study C P1).
- **Self-correction in progress.** While `repairing` is true, the hold extends to the beat's cap.
- **A wrong step mid-explanation.** Nothing happens until the TRP. The Director then opens with uptake and one chance
  to self-repair (Study C P9; SHANKS 24.9% false interruptions on correct solutions [T]).
- **A disclosure.** The safeguard is never spoken over a child who is talking (§6).
- **A code switch.** A switch at the edge of the utterance is planning, not a TRP (P11).
- **Silence after her question.** Only the WT1 ladder ends it (P14). There is no model-initiated speech out of silence.

### 3.5 Barge-in and overlap repair

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

### 3.6 Silence ladder (WT1) and the revocable commit

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

## 4. Target experience numbers, and what each part contributes

### 4.1 Targets (first wave; each has a gate experiment)

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

### 4.2 Measurement M-D1: what each change buys (composition of measured stages)

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

## 5. Models per loop (Azure first, from MODEL-ROUTER §0) and what to test

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

## 6. Safety: the predicate floor runs on partials first

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

## 7. Integration plan (W2 owns `server/routes/lesson.js`, `server/brain/**`, `src/child/lesson/**`)

### 7.1 New code (this workstream; flags default off)

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

### 7.2 Seam requests to the W2 owners (each additive, each behind a flag)

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

### 7.3 How it meets the kernel and the Moment

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

### 7.4 Flags and rollout (each step has a pass bar before the next)

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

## 8. Experiments (new D-series; X- are Study B's and E-C- are Study C's, unchanged)

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

## 9. Failure modes (and what the design does about each)

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

## 10. Reversal conditions and proposed context entries

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

## 11. Sources

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
