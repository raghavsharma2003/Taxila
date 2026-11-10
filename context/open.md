

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

<!-- reset-plan (2026-10-04) -->
### `open-reset-owner-decisions`
RESET-PLAN §9 needs these owner decisions:

| id | decision needed |
|---|---|
| O-R1 | Teacher look for ages 9-15: the style-C puppet (`stylised-c-owner-directive`) or DESIGN-V3's painterly stand-in portraits. |
| O-R3 | Confirm that off-topic diversions are hidden from parents. Safety events are always shown. |
| O-R4 | Buy or name the reference phone (about INR 10k, Android) for QB-G9 and X6. |
| O-R5 | Provide a fast ear in India for duplex L3: MAI-Transcribe in-region, or Nemotron hosted in India. |
| O-R6 | Approve a consented child panel (n ≥ 24) for X1, X4, X6 and the Fun Toolkit. |
| O-R7 | A human reviews the synthetic safeguarding incidents that block deletion of 3 leftover production test accounts. |
| O-R9 | Approve the Wave 2.5 Azure envelope, about USD 60-90 [E]. |


<!-- merged from inbox/r143-kit-deep-kinds.json -->
## open-r143-kit-kind-pose-mismatch (2026-10-15)

`deep: false` fixes the evidence weight only.

- **Pose:** shallow error_spot items keep the planted-mistake pose. Predict items keep the predict engine mode. Why-kind items skip the follow-up why. A re-tag needs blind-solver re-verification.
- **Split items:** 2608 (33.9%) stay deep unread.
- **Error_spot boundary:** whether refuting a stated false claim from a fact counts as error_spot (12 of 25) needs an owner call.


<!-- merged from inbox/r5-38aad918-s2.json -->
## open-r5-ask-subject-first — the ask's own subject before a guessed one (parked, 2026-10-21)

The idea is to keep the subject visualAskOf reads before freeSubjectOf's guess (on 38aad918 t6 that is 'triangle', not nothing). Main parked it until three things exist: how many readings flip offTopic or visualUnavailable (code replay: 5 offTopic, 0 moves; the real effect is on model-read requests), the odd readings fixed or explained (cake: past-clause photo mention; दी: stop word; laddoo: fair), and a sim-lab A/B on the affected cards.


<!-- merged from inbox/r1442-s2.json -->
## open-r1442-board-truth-unmeasured — not measured on sim-lab (2026-10-22)

The two board-truth fixes rest on QA's three lessons and tests that fail on base. Sim-lab cannot measure them as it stands. The shape fix needs a re-run to count 'picture nahi hai' under a board, and the sim-lab records do not carry the board-to-board sequences at slot level. A QA re-run of 7545d1fd, 13ec94a7 and 897a7453's shapes is the measurement.


<!-- merged from inbox/r7-m3-1.json -->
## open-r7-m3-verification-deadline (2026-11-05)

The Learn page (2026-11-03) says not qualifying for Milestone 3 within 180 days of business verification cancels the sponsorship. The sponsorship started 2026-07-08. If that was the verification day, the deadline is 2027-01-04, and the 60-day clock must start by 2026-11-06. The keeper cannot make day 1 earlier than the first full day after `apply`. Unknown: the real verification date, and whether the clause applies to sponsorships granted before it was published. The owner reads it in the Founders Hub portal (docs/design/round7/M3.md §1).


<!-- merged from inbox/r7-main-15.json -->
## `fd-r7-m3-verification-date-2026-07-15` (2026-11-06)

Resolves `open-r7-m3-verification-deadline`.

**Business verification completed on 2026-07-15.** Microsoft's Startup and Partner Programs Ops Desk mailed that day (ticket 2607100030006859) that it "has been completed successfully". The ticket was opened 2026-07-10, after the first attempt failed.

| Counting from | Deadline (180 days) | Day 1 of the 60 must fall on or before |
|---|---|---|
| 2026-07-15, verification completed | 2027-01-11 | 2026-11-13 |
| 2026-07-10, ticket opened (worst case) | 2027-01-06 | 2026-11-08 |

The earlier date, 2026-07-08, was the sponsorship's start. It was used on 2026-11-05 and was a week too early. The portal's own recorded date has not been read.


<!-- merged from inbox/r7-main-16.json -->
## `fd-r7-m3-subscription-inventory-2026-11-06` (2026-11-06)

**Projects in the subscription:** Taxila, Vyakti, and the companion and sales-enabler projects. The milestones count services across all of them.

**Cost Management, closed days 10-22 to 11-04:**
- ≥ $1 every day: PostgreSQL 6.27, Container Apps 4.4 (including Vyakti's), Virtual Machines 1.33 (Vyakti's vl-vm-cin only).
- Fluctuating: Foundry Models and Foundry Tools.
- Under $1: Container Registry 0.77, Load Balancer 0.60, Virtual Network 0.24, Storage 0.15, Azure Monitor 0.15.

**Limits:**
- The service principal is Contributor only: no role assignments, no locks.
- Container Instances has 0 core quota.
- Public IPs: 100 per region.

**taxila-cin-pg over 30 days:** ~11 connections, CPU ~8% on average (62% at peak), ~2.4 of 8 GB memory. taxila-sin-staging has a DATABASE_URL.


<!-- merged from inbox/r7-m4-1.json -->
## open-r7-m4-billing-assumptions (2026-11-06)

What only live billing can settle, on the first closed day after the M4 apply (2026-11-08 or later, visible about 2 days after):
1. Do the 10 unattached Standard public IPs bill $0.005/h? Expect Virtual Network ≈ $1.56. If it is ≈ $0.36, attach them as secondary ipconfigs on the VM's NIC.
2. Does taxila-m3-lb bill 24 Included + 72 Overage hours ($1.32), with the VM's NIC in its pool?
3. Did managed Run Command pass the protectedParameter as an env var? The apply prints M3-RUNNER-OK, or M3-RUNNER-FAIL no env parameter.
4. Does the ledger show runs by both aca and vm?
5. Did 2026-11-06 count as day 1 (the report's `day1`; `status` prints the day-1 candidate line)?


<!-- merged from inbox/r7-audit-docs-memory.json -->
## op-audit-build-gpu-aws-owner
Does the AWS GPU build harness (`scripts/gpu`) stay? It runs the 3D face jobs and the voice training scripts; nothing in the product runs it, and it calls a service outside the Azure-only rule. The question is the owner's. Until it is answered nothing under `scripts/gpu` is deleted or extended.


<!-- merged from inbox/r7-audit-seams.json -->
## seams-signals-layer-unwired
The decision `sig-layer-evidence-not-authority` (2026-10-04) built the layer in new modules and left integration to SIGNALS-SPEC §8.2. On 2026-11-10 nothing live imports `server/signals/index.js` or `src/signals/index.ts`; `TAXILA_SIGNALS` can flip nothing. The voice-signal adapter (`server/voicesig/**`) does the job instead. Owner's call: wire or retire (keep `server/signals/text.js` and `linguistic.js`, which are live). Report: SEAM-04.


<!-- merged from inbox/r7-audit-voice.json -->
## open-r7-audit-voice-holdcue-live (2026-11-10)
Audit V-22. `r3vs-holdcue-shadow` keeps the thinking-pause cue shadow until a children's pilot; `rejected.md` records 0 of 12 cut-offs prevented and one 2.0 s false delay. The cue is wired into the live engine (`src/duplex/liveTap.ts:50-54`) and went live when hands-free became every child's default. Decide: unsubscribe it, or record the decision to run it live.

## open-r7-audit-voice-expressive-default (2026-11-10)
Audit V-27. Expressive SSML is default on for DragonHD (`w2g-expressive-layer-built`); `rj-ssml-delivery-plan-2026-10-04` records listeners scoring the same shape below plain. The blind test named as the reversal condition has not run.


<!-- merged from inbox/r7-audit-voice-fix.json -->
## `fd-r7-audit-voice-switch-translit-not-wired`

Record correction (audit V-29). `rs7-voice-switch` and `rs7-translit-roman-to-devanagari` read as shipped steps; neither is called by any live path (`voice-switch.js` styleFor / synthesize, `translit/index.js` toDevanagari are reached only from tests and evals). Main decided not to wire them now. One data fix landed: `bara` is no longer a hand entry for twelve (`sabse bara` would have become `सबसे बारह`); NUMBER_AMBIG still reads it as twelve in a run of numbers.
