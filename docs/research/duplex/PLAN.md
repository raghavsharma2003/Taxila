# Duplex Wave 2.5: shipping the Continuous Conversational Engine in place of click-to-speak

2026-10-04 · critic workstream · status: **plan**. No Wave 2 file was edited.

**How it builds on the other docs:**
- It supersedes INTEGRATION.md §0 where the two differ. INTEGRATION.md stays the reference for each seam's code shape.
- The evidence is in [CRITIQUE.md](CRITIQUE.md) and [TAXILAFDB.md](TAXILAFDB.md).

**Labels:** [M] measured, [E] estimate, [T] from another repo file.

**Owners named below:**

| owner | what they own |
|---|---|
| **main loop** | decisions, `context/` merges, config freeze |
| **duplex** | `src/duplex/**`, `server/duplex/**`, `evals/duplex/**`, `scripts/duplex/**`, `models/duplex/**` |
| **safety** | `server/director/safety.js` and the safety batteries |
| **W2-E** | brain: `server/brain/**`, `shared/contracts.ts` turn fields |
| **W2-B** | child UI: `src/child/lesson/**` |
| **W2-C** | persona / Director: `server/persona/**` |
| **voice** | `src/lesson/{cascadeLink,ttsStream,floor,realtime,runtime}.ts`, HUMAN-VOICE |
| **avatar** | `src/avatar/**` |
| **data** | telemetry, consent, storage, training |

---

## 0. What ships, in one paragraph

The child talks hands-free for the whole lesson; there is no talk button.

**What the teacher does while the child talks:**
- She listens and re-decides every 100 ms.
- She nods and leans in.
- She answers a finished closed answer about 0.35 s after the child stops: the uptake first, the verdict ≥ 2 s later.
- She waits through thinking pauses, "ruko" and word searches.
- She ducks at once when talked over and yields when the child means it.

**Where it runs first:**
- **India app on MAI-Transcribe-2-Streaming with the micro-commit probe**, closed answers first.
- **The eastus2 / D4 lane gets it too, with honest expectations.** Turn ends are about 1.2 s p50 there, still 0.5 s
  faster than today and with about 1/10 the cut-offs.

**What it will not do until a blocker below is closed:**
- no audio backchannel;
- no barge-in yield faster than the sustained-voice rule;
- nothing at all with children before the safety predicate survives real transcripts.

---

## 1. Blockers (close before any child hears it)

| # | blocker | owner | files | acceptance |
|---|---|---|---|---|
| X-1 | **Safety predicate vs real transcripts.** 16/84 distress lines missed once one word is garbled or a segment is hallucinated in another script; the danda case too (CRITIQUE §5) | safety (+ W2-E for the model note) | `server/director/safety.js` (fuzzy / phonetic matching over its own phrase list, the danda case); `server/brain/turn.js` routes the existing model distress read into `TurnRequest.duplex.safetyPending` / `PartialSafety.modelNote` on every committed turn; unreadable segments → "ask again" (duplex `markers.unreadable` already flags them) | on `critic/stress.mjs --conds sttReal`: **≥ 82/84** detected by predicate + model note on both lanes; non-safety speech after distress **0/84**; false safety on the benign set **0/12**; plus a 40-line real-transcript battery (adult actors, §3 ET-1) **≥ 39/40** |
| X-2 | **Freeze one config.** Three workstreams moved thresholds on 2026-10-04 | main loop | `src/duplex/config.ts`: record the hash in `context/decisions.md` | the runtime hash in every result file equals the frozen one |
| X-3 | **Voice-actuator contract.** "yield" = stop at a word boundary ≤ 50 ms AND drop every reply not yet audible; the verdict segment is held until `verdictNotBefore` | voice | `src/lesson/ttsStream.ts`, `cascadeLink.ts` | unit battery: a yield 0-500 ms before first audio never plays the reply (0/200); verdict never before vnb (0/200); `stopAtWordBoundary` p95 ≤ 50 ms on device |
| X-4 | **Lane.** On D4 the engine waits for words (0% of decisions < 300 ms) | voice + main loop | `server/routes/voice.js` lane pick; `realtime.ts` server VAD 1,500 ms under the flag | India app on MAI streaming + micro-commit probe; L2 on MAI (48 TaxilaFDB test streams in real time): gap p50 ≤ 450 ms on closed answers |

---

## 2. Build steps (each ships alone behind `src/lesson/voiceFlags.ts`; all flags off = today's lesson byte for byte)

| step | flag | owner | files | acceptance |
|---|---|---|---|---|
| W2.5-1 | `duplex.slice` | voice | `server/index.js` (register `createDuplexRoutes`), `server/routes/voice.js` (export `lessonForVoice`) | `/api/duplex/*` 401 without auth, 200 with; `npm test` green |
| W2.5-2 | `duplex.partialSafety` | W2-E | `shared/contracts.ts` (`TurnRequest.duplex`), `server/brain/turn.js` (rank-0 safeguard on `safetyPending` even if the final reads clean) | D2 battery: a distress partial whose final is revised clean still yields the safeguard, 20/20; X-1 met |
| W2.5-3 | `duplex.heardUpTo` | voice | `ttsStream.ts` (word boundaries on the session clock, `her_verdict`, `stopAtWordBoundary`, `resumeFrom`) | heardUpTo within one word of the audible position on ≥ 90% of yields; X-3 met; on a real-audio disclosure set: audible non-safety speech after the distress word ≤ 300 ms, 0 after the safeguard |
| W2.5-4 | `duplex.engine = shadow` | voice + duplex | `cascadeLink.ts` (tee 20 ms frames and STT events into `EngineHost`; `DuplexBridge` in `src/duplex/bridge.ts`), `runtime.ts` | engine runs beside today's cascade on every lesson for ≥ 2 weeks of internal use; shadow log: disagreements reviewed, **0 safety disagreements**; X-2 frozen |
| W2.5-5 | `duplex.engine = on` (closed answers, India lane) | voice + W2-B | `cascadeLink.ts` (a final is not a turn; commit on `{to:"voice", op:"speak"}`), `floor.ts` (`duplex_phase`), `src/child/lesson/TalkButton.tsx` (only on the recording / typed fallbacks), `LessonScreen.tsx` (status word from the governed floor) | **TaxilaFDB test, post-fix tree [M today]:** cut-offs ≤ 1% (0.0%), verdict on a repaired value 0/40 (0/40), hold violations 0/48 (0/48), missed ≤ 2 s ≤ 10% (8.7%). **ET-1 actors:** cut-offs ≤ 3%, missed ≤ 8%, gap p50 ≤ 450 ms. **ET-2 children:** below |
| W2.5-6 | `duplex.engine = on` (open contexts) + semantic | duplex + W2-C | `server/duplex/semantic.js` (built; wire the call), `server/persona/adapter.js` (S6 `UiDirectives.engine`) | F2 / F3 thinking-pause cut-offs ≤ silence-640 on the same audio (today 0.0 vs 82.8% [M]); backstop-decided reply-worthy ends 26% → ≤ 12%; F3.question_mid answered ≤ 1.2 s p50 (today 2.5 s [M]) |
| W2.5-7 | `duplex.paceAcrossSessions` | duplex + data | `host.ts` `pace` from the learner store (sessions ≥ 1, not ≥ 3), `config.ts TURN_PACE` | slow-child world: cut-offs 8.2% → ≤ 4%; verdicts on a repaired value 13/40 → ≤ 3/40, missed ≤ 12% (needs a session-level sim: one voice across ≥ 5 streams in one host) |
| W2.5-8 | `duplex.overlap` | voice + duplex | `cascadeLink.ts` obeys duck / yield / resume | duck p50 ≤ 80 ms (38-70 ms [M]); barge-in yield p50 ≤ 500 ms (760 [M]); keep-talking through continuers ≥ 85% (67% [M]); echo self-yield ≤ 2% on speaker phones (ET-1) |
| W2.5-9 | `duplex.listeningFace` | avatar | `src/avatar/behaviour.ts` (S7, one nod producer) | nod rate 0.5-2× human (2.5× [M] → lower `RATE.nodMs` or the BOP gate); 0 nods in closed answers; ET-3 listeners rate "she is listening" ≥ today + 1 point on a 5-point scale |
| W2.5-10 | `duplex.cutIn` | W2-C | Director moves for `word_search_cue`, `off_task_drift`, `question_to_her`, `hold_offer` (S12) | in-policy 100%, out-of-policy 0; drift cut-in exercised on ≥ 20 renders of ≥ 25 s (never measured so far) |
| W2.5-11 | `duplex.uptakePrelude` | W2-E + voice | `server/brain/moment.js` (S5), `ttsStream.ts` | **audible gap** (child's last sound → her first sound) p50 ≤ 900 ms on closed answers (today 2.07 s [M]; the warm uptake primes 164 of 483 replies [T]); HV-16 blind check ≤ 55% |
| W2.5-12 | `duplex.engineTrained` | duplex + data | `models/duplex/*.onnx` + flag only | ENGINE-MODEL §5.5 gates on **real-child** held-out sessions (§4), never on TTS |

Cost envelope [M sim × E prices, CRITIQUE §3]: duplex adds **+$0.07-0.11 per lesson-hour** on top of the cascade's $1.61.
Acceptance: ≤ +$0.15/h measured from Azure Cost Management after W2.5-5. Lever: speculative-draft debounce
(`PREPARE_CAPS.minNewWords`; 5.3k wasted input tokens per reply turn on the fast lane [M]).

---

## 3. Experience tests with child-like sessions

Every test logs the engine's tick trail (numbers and reason codes, no words: `w2e-brain-trace`) plus the timing metrics
TaxilaFDB computes. Timing labels come from audio annotation by two people. Experience ratings come from blind raters.

| test | who | protocol | pass |
|---|---|---|---|
| **ET-1 actor sessions** (before W2.5-5) | 10 adult actors, voice-acting class 4-7 children, 4 Hindi-medium + 4 Hinglish + 2 English-medium; own budget Android phones, real homes (TV, siblings, fans), speaker and earphone | 2 × 15-min lessons each, scripted beats with free speech in between: hesitations, self-repairs, "ruko", word searches, barge-ins, continuers, mumbling, **and the 40-line safety battery (adults only)**; shadow first, then on | cut-offs ≤ 3%; missed ≤ 8%; gap p50 ≤ 450 ms (MAI); verdict on a repaired value 0; holds 0; safety ≥ 39/40 and 0 non-safety speech after one; echo self-yield ≤ 2%; this produces the real-transcript TaxilaFDB v2 slice |
| **ET-2 child pilot** (W2.5-5 on) | 12 consenting children, classes 4-7, parent present: 6 Hindi-medium, 6 English-medium; 3 shy / slow by teacher report | 3 lessons each, **within-child A/B** (duplex vs today's click-to-speak, order counterbalanced); no disclosure scripts, ever; any real distress → the shipped safeguard and the human hand-off | child preference ≥ 9/12 for duplex; annotated cut-offs ≤ 3% (≤ 5% for the shy three); missed ≤ 8%; zero safety incidents mishandled; parents' "she lets my child think" ≥ 4/5 |
| **ET-3 listener panel** | 20 adult raters (teachers + parents), blind | rate 60 clip pairs (engine vs silence-640 vs cascade) from ET-1 / ET-2 for "listens", "interrupts", "too slow", and guess right / wrong from the uptake alone | engine preferred ≥ 70% vs each baseline; uptake verdict leak ≤ 55% (HV-16); "talks over self-correction" (repair collisions, 57.5% in sim [M]) rated acceptable ≥ 70% or the uptake waits for HESITANT_VALUE_SILENCE |
| **ET-4 noise and distance** | ET-1 actors | the same scripts at 1 m and 2 m from the phone; pressure cooker, TV at −6 dB | missed ≤ 15% (sim: quiet 18.9%, phone 15.2% [M]); cut-offs ≤ 3% |

---

## 4. The real-child data flywheel

**1. What is collected.**
- **By default (consent `core_tutoring`):** tick-trail telemetry only. Phase, action, reason codes, pComplete /
  pHoldWanted, timings. No words, no audio.
- **Under a separate, revocable parental opt-in (`improve_voice`, data owner):** 16 kHz mic audio, STT partials, her
  playback clock, per session.
  - Stored in Azure Storage (centralindia).
  - 180-day retention.
  - Never used for anything but the floor model and TaxilaFDB v2.

**2. Labels without annotators** (behavioural, from the trail):

| label | how it is read |
|---|---|
| cut-off | the child voices within 1.5 s of her first sound and she revokes or yields |
| missed reply | child silence ≥ 2.5 s after a reply-worthy end, then "didi?" / a repeat |
| false yield | she resumes within 2 s on a continuer |
| hold respected | no audio act in a granted hold |

- **Weekly audit:** 5% of sessions annotated by two people to measure the label error.

**3. TaxilaFDB v2.**
- **Content:**
  - real transcripts of ET-1 / ET-2 (and opted-in audio);
  - a second scenario author;
  - Hindi-medium children at ≥ 30% of streams (v1 had 12 pure-Hindi pauses);
  - drift turns ≥ 25 s.
- **Splits:** test held out by CHILD, not by template.
- **Status:** it replaces v1 as the gate. v1's test split is partly contaminated by the critique's diagnoses.

**4. Stage B on real children.**
- **Training:** the `cce-features/1` head (and the Smart Turn backbone, fine-tuned once ≥ 100 children have opted in)
  trains on Azure ML or ACA CPU. Use an Azure GPU if quota exists; otherwise AWS GPU for training only, terminated after
  each run, within the caps.
- **Promotion:** gated per ENGINE-MODEL §5.5 on held-out children: ≤ stage A cut-offs AND ≤ stage A − 3 pt missed
  replies.
- **Fallback:** the governor stays, and stage A is the fallback.

**5. Per-child pace.**
- The learner store keeps hold-pause p50 / p90, answer gap and filler rate per child, starting from session 1 (W2.5-7).
- The band prior is used only before the first session.

---

## 5. The native-model path (do not build now)

**Why not now:**
- Native speech-to-speech duplex for Hindi measured poor (IndicFDB [T]).
- It would lose the strong brain, the DragonHD voice and the safety predicate floor.

**How the flywheel prepares it:**
1. **Stage C, decision model on streams.** A small streaming model (≤ 100M parameters) reads the mic audio + partials +
   her playback and emits the same action set every 100 ms.
   - **Training data:** the trail and opted-in audio, with stage A / B decisions as weak labels, corrected by the
     behavioural outcomes (§4.2).
   - **Where it runs:** on the device or ACA CPU.
   - **What stays outside it:** the governor and the predicate stay code.
2. **Stage D, native duplex generation.** Reconsider only when all four hold:
   - ≥ 5,000 h of consented child-teacher dialogue;
   - an Azure-hostable open-weights duplex backbone with a permissive licence;
   - IndicFDB-style Hindi scores within 10% of the cascade's measured quality;
   - the governor's vetoes (safety, hold, verdict gate) can still be enforced on its output stream.
   Until then, cascade generation stays.

---

## 6. Risks and open items

- **Every number above is simulated or [E] until ET-1.** The L2 real-STT check covered 48 streams of TTS audio.
- **Missed replies are stage A's cost.** 8.7-23% across worlds, against silence-640's 0.8-12%. If ET-2 shows children
  repeating themselves, the backstop policy changes before cut-offs do. One option: on the backstop, a nod / "hmm?"
  invitation first, then speech.
- **Barge-in still hangs on a timer.** It needs a target-speaker model (TV / sibling false yields 50-67%) before the
  sustained-voice rule can come down.
- **The audible gap (≈ 2 s) is the experience gap, not the decision gap (0.36 s).** W2.5-11 is the lever.
