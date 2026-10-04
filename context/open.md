

<!-- merged from inbox/comprehension-build.json -->
## ledger-game-full-weight
`server/learner/kt/bktr.js temper()` has no source weight, so game and Forge-module commits move pL at full LR. The spec (§1.1) says ×0.5 game and ×0.75 module, and `facets.js` already applies that to U and T. In the 20-seed sim, not_yet accuracy was 0.62 with game evidence and 0.75 without, because lucky game predictions carry guessers over pL 0.6. The one-line diff is in INTEGRATION.md §5.1. The learner workstream owns the file.


<!-- merged from inbox/comprehension-review.json -->
## comprehension-review-open-2026-10-02
- The CE-M1 bar fails under both families (0.627 / 0.475), and CE-M4 now fails at 14 pp after the truth-leak fix. Per SIM6, thresholds were NOT tuned to the simulator.
- Mutants VC2 and VC4 do not fail CE-M3 under bkt2, and VC4 does not fail under cfrag-lite either. By §8.3 the battery is therefore not yet valid for those mutants. The likely cause is too little game evidence: 2 C35 commits per fresh topic. A gamer or rank-exploit policy is needed.
- The oracle-prober control is not built, so 100% is undefined.
- cfrag-lite is not the evals/sim cfrag (no 4PL, no per-item γ).


<!-- merged from inbox/integration-learner-comp.json -->
## integration-learner-open-2026-10-03
- **learner-no-kt-backfill is now live.** Every existing child cold-starts in the kt ledger, and the first turn that touches a skill overwrites its skill_state row with the ledger projection (a legacy learned_today becomes practising/introduced). Its reversal condition (backfill through kt/adapter.js before the first real family) now applies to the next release.
- **grade_audit never keeps the span**: keepSpan is false everywhere; the transcripts_retention consent lookup (conductor latestConsent) is not wired into the turn.
- **TurnResponse.pace** (waitNudgeSec, endpointSilenceMs) is sent but no client consumes it; the realtime session's turn detection is minted once per token.
- **Weave hosting**: onTopicPlanned runs at lesson start and the queue is persisted, but a hosted woven sub-step has no host item (Forge/engine seam `forgeSeam.wovenSubStep`, no-op in routes/lesson.js); entries expire into C31 callbacks. The Conductor's planner does not call planChecks (lesson start does).
- **Re-teach outcomes and arm posteriors**: reteach_attempts rows are written, never resolved (reteachOutcomeStmt/armPosteriorStmt unused); prereq_descent has no cross-kit prerequisite item.
- **Voice branches** (branchesFor) simulate on the beliefs held in state before the reply, not after a synthetic fold, so a scheduler trigger the reply would add (verify_first_correct) is not in the branch.
- **shared/learner.ts**: EvidenceEvent CE fields added; CompState / FacetState / ComprehensionBelief / ProbePlan / WeaveEntry / VibeDirective types (INTEGRATION §6) not yet.
- **NM-3 question**: the vibe persona state (signal log, knobs) lives in lesson.state like the affect state does; lesson rows are M0 history. Whether session-only processing in the lesson row satisfies NM-3 is for the owner/counsel.
- **Held-verdict settle rate** at the next turn is unmeasured in production (debug.carried[].graded); the e2e saw the held why flushed at end.
- **008_tutor_choice.sql** is not applied to the Neon database (tests/migrations-applied fails); owner: the tutor-choice workstream.
- **not_yet accuracy** fell with the misconception cap (comp-sim-integration-2026-10-03); mut_vc4 still does not fail.


<!-- merged from inbox/lesson-truth.json -->
## open-lt-client-wiring
The server side is in; the child client must: (1) preselect the parent's interests at Hello and stop overwriting them (it PATCHed a fresh set); (2) send the child's aap/tum pick as `LessonStartRequest.address`; (3) read `ChildPlanResponse.state/topic/today/resume` (V2 §6.3.3) instead of only `homeState`, `ChildMapResponse.subjects/state/sealed/here`, `ui.ask/verdict/handover/tray`, and `did` for the summary; (4) take the teacher from `/api/child/teacher` (landing/onboarding: `?classLevel=`). Owner: the child UI workstreams.

## open-lt-voice-lane-truth
The realtime lane answers before the Director runs, so praise / register / screen breaks there are flagged on the turn row only (floor breaks become `state.correction`); `ui.ask` is absent on its no-item turns; G-ASK-2 parity and G-SAY-1's "this number" clause are not implemented; the parent note's pronouns are instructed, not checked by code.


<!-- merged from inbox/lesson-truth.json -->
## open-lt-client-wiring-2
(supersedes open-lt-client-wiring) The child client must: read `ChildPlanResponse.state` (and expose `data-plan-state`) and render first / done / capped / resting per V2 §6.3.3, the done row with today's DidCard from `plan.today.summary`; render the Sky/Garden chapters, seals and "Your class is here" from `ChildMapResponse`; send `LessonStartRequest.purpose` from Practice ("practice") and Ask ("doubt") — after a done lesson the interim Practice route is now refused 409 without it — and handle 409 `LessonStartRefused`; English-only chrome; Sky star targets ≥ 48 px; Hello preselects the parent's interests; landing / onboarding use /api/child/teacher. `LessonStartRequest.address` no longer exists. tests/e2e-design-lesson-truth.mjs's CLIENT tier is the acceptance check.

## open-lt-evals-plan-gate
Scripts that start lessons for one child repeatedly meet the plan gate: tests/lesson-api-e2e.mjs (its s2 after s1 ended), evals/cascade-latency.mjs, evals/director-sim.mjs and scripts/prod-smoke.mjs get 409 outside 07:00-20:30 IST or after a done lesson. They need the child's controls set to 00:00-23:59 (PATCH controls) or `purpose: "practice"`. Not in the lesson-truth paths.


<!-- merged from inbox/gpu-harness.json -->
## gpu-dense-target-unmeasured (2026-10-03)
Build merged teal with TAXILA_IDENTITY_TARGET=scripts/gpu/jobs/face3d/runs/face3d-20261003-184935-92c5 (dense term, CPU landmarks). Measure front NME, yaw-24 NME, G1-G6 and G9 against the current merged teal. Until that is done, nothing says the GPU surface helps. If it does not, try Hunyuan3D-2mv (multi-view input from our front and side references) next.


<!-- merged from inbox/world-best-understanding-detection.json -->
## wb-coc-epistemic-vs-emotional
The Microsoft Enterprise AI Services Code of Conduct v4.0 (2026-05-01), restriction 12, bans attempts to 'infer people's emotional states from ... speech patterns', including 'other terms commonly used to describe a person's emotional state'. Confusion is commonly called an emotion, so prosodic confusion detection stays banned. Open: is P(answer reflects knowledge) from onset latency, self-repair and IDK-vs-cannot-recall a knowledge inference outside restriction 12? This blocks the Epistemic Speech Evidence research protocol, features 2(a) and 2(b) (understanding-detection.md section 4). The text-only features (the IDK_R lexicon and hedges) do not depend on the answer. Source: https://learn.microsoft.com/en-us/legal/ai-code-of-conduct


<!-- merged from inbox/world-best-voice-ux.json -->
## open-predictive-turn-model
Replace the fixed 900 ms silence endpoint with commit-early-decide-late: candidate endpoint ~450 ms, Smart Turn v3.2 int8 ONNX (BSD-2, 8 MB, Hindi 93.44% n=1,295) on device scoring the last <=8 s, threshold set by the Director per item type and child priors, fragment merge on low P. Evidence: child-adult silence AUC 0.62 vs VAP bAcc 94.1 on child-initiated events (Brahimi et al., IWSDS 2026, OCSC 4-9 y, English); prosody beats text for EOT (arXiv 2609.11066). Decide on E1: SHIFT/HOLD AUC per band and item type; gate = cut-offs not worse than 900 ms and p50 gap >=300 ms better. Fine-tune on consented E1 audio with time-to-next-onset targets (Next-Turn) if Hindi children do not transfer. Source: docs/research/world-best/voice-ux-smoothness.md S1-S2.

## open-dragonhd-prosody-unsupported
Microsoft's HD voices page (updated 2026-09-24) marks `<prosody>` unsupported for DragonHD and Dragon HD Omni; `<break>`, `<lang>`, `<phoneme>`, `<say-as>`, `<sub>`, alias lexicon supported. VOICE-CHOICE §3 relies on `<prosody rate>`; measured 15.2-15.9 chars/s at rate 0.95 fits 'ignored'. Probe chars/s at 0.75 vs 1.0 (n>=5) before building; pace by voice, `<break>`, Voice Live `voice.rate`, or gpt-4o-mini-tts `speed`. Also test `enhancePronunciation=true` on the NCERT term set.

## open-voicelive-word-timestamps
Word boundary events exist only on Dragon HD Omni (not production). Voice Live returns `response.audio_timestamp.delta` word timestamps for Azure voices; probe with an en-IN DragonHD voice on lane B.

## open-live-reference-aec
Voice Live Live-Reference AEC (`reference_source: client`, `channels: 2`, API >= 2026-07-15). Default server AEC assumes immediate playback and degrades past 2 s delay, which pause-then-decide barge-in produces. Measure bargeStats.resumedEcho per 100 teacher turns on 3 low-end Android phones, speaker vs headset.


<!-- merged from inbox/superhuman-specs.json -->
## open-studio-review-capacity (2026-10-04)
LIVE-STUDIO §8 requires human review of 100% of the first 50 promotions per archetype, then 10%: ~600 reviews for the 12 W2 archetypes, ~1,400 more for 13-40. At 1-2 min each that is 10-20 h in W2 and ~25-45 h in W3. Owner input O22a (default: one hired teacher). Until reviewed, builds stay transfer_passed (<= 20 mounts each), which caps reuse and raises live spend.

## open-turn-model-before-e1 (2026-10-04)
Smart Turn v3.2 reports Hindi 93.4% (n = 1,295) on adult data; the child result (IWSDS 2026) is English ages 4-9. Before E1 consent there is no Hindi/Hinglish child audio, so W2's only gate for `turn.predictive` is the probe-fleet cut-off rate with child-like (synthesised) clips. The real SHIFT/HOLD AUC >= 0.85 gate is at the pilot (W4-A data engine).


<!-- merged from inbox/w1-c.json -->
## w1c-delayed-check-cannot-lift-shallow (2026-10-04)
BUILD-PLAN W1-C acceptance reads "+1 d: the C31 check fires in the opener, and a correct answer moves the state above shallow". The check fires and is answered right (w1c-three-day-local), but the ladder leaves shallow only with U >= U_FRAGILE; a delayed check is K/D evidence. The test now reports this as a warn and shows the rise from reasons separately instead of borrowing it. Decision needed (owner / W3-A): should a delayed first-attempt success carry U weight? Until then the acceptance item as written cannot pass.

## w1c-late-double-count-reports (2026-10-04)
`server/reports/*` count the fallback event and its `<id>:late` correction as two events. W2-A (one parent truth) should treat kt_evidence via='late' as a correction of its parent id (strip `:late[:via]`), not a new event.

<!-- W2-E -->
## w2e-open-2026-10-04
- **W2-H:** add `requestIntent(ask: StudioAsk) → StudioAskAck | null` to `server/studio/seam.js` (synchronous, starts the
  drawing-script build, never throws); until then the whiteboard ask is accepted by the kernel but nothing appears.
- **W2-I + W2-C:** the compile must render `state.rel` (the accepted overlay's shape id, a callback or notice id) in the
  RELATIONSHIP block / the move; the adapter already places it for exactly one turn.
- **W2-C:** `server/director/state.js` should pass `signals: input.cls?.signals` to `turnSignals` and read `affect.idk`
  (recall cue vs teach) once the signals block is on.
- **Safety (W2-I, scanSafety):** "mujhe ghar pe bahut maar padti hai aur main dar jaata hoon" (I get beaten a lot at home)
  is NOT caught by the predicate (`scanSafety` → distress false); "papa mujhe maarte hain" is. Found while scripting the
  replay; the model's distress flag is the only net for that phrasing.
- **G-SIG:** a two-rater act set with κ (O22c); a re-run of the label arm with the block in a separate object or on
  grok-4-20-non-reasoning.
- **L1:** Smart Turn v3.2 assets + an ONNX runtime in the bundle, S1(a) on Hindi/Hinglish child audio, then the cut-off
  comparison against the 900 ms arm. L2 (speculation at the candidate) needs client partials sent before the commit.
- **Timing:** speech end → first audio, receipt and first-audible numbers from the Central India probe fleet (n ≥ 30 per
  band); G-LAT on the ACA image.
- **azure.js (W2-F):** route `quotaLane: "background"` calls to `twinFor(deployment)` when O13a/b exist; tag Studio, the
  annotator and consolidation calls `background` (W2-B's explainer fills already are).

## Signals build (2026-10-04) — pending merge from `inbox/signals.json`
- **open-sig-ms-tier-e-letter (owner, O-5):** written question to Microsoft listing the exact Tier E outputs (verifyDue from
  timing, paceDown, waitLonger/nudgeAtSec, a knowledge LR within [0.9, 1.1]). E-tier states stay shadow until answered.
- **open-sig-safety-predicate-gaps (W2-I, `server/director/safety.js`):** ES-3 pipeline misses — "paanch hai, mujhe marna
  hai" (the self-harm regex needs "marna chahta/chahti"), "main rahun ya na rahun kya farak" (`naRahunIdeation` skips "ya
  na rahun"), "kisi ko farak nahi padta main hoon ya nahi", "I hate my life". The signal layer abstains correctly whenever
  the flag is set; these turns reach it with the flag unset unless the classifier catches them. Child-safety floor: fix
  first.
- **open-sig-a7-human-fillers:** calibrate A7/A2 (≥ 300 ms, < 1 st) on recorded human filled pauses.
