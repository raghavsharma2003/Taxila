# STAGECRAFT: the speculative content conductor

2026-10-05 · architecture · status: **built in new paths and measured in simulation + a small real arm (§12); patches to existing files written, not applied**. Types: `shared/stagecraft.ts`. Inputs:
`STUDY-PRODUCTS.md` (Study A) and `STUDY-RESEARCH.md` (Study B). The work is built on the duplex v2 engine
(`docs/research/duplex/ARCHITECTURE.md`), STUDIO-V2, DESIGN-V3 §6, LIVE-STUDIO and Wave 2 Studio
(`server/studio/**`). No existing file was edited, nothing was committed, and nothing was spent on Azure. Every change
to an existing file is listed in §9 as a patch to be written under `docs/design/stagecraft/patches/`.

**Owner ask (OWNER-RESET item 17, 2026-10-05, binding):** *"on the go content build and showcased without fail; in
the content creation we need similar to the duplex architecture where in parallel we are building various content
while the convo is going on and how it changes, and then accordingly showing the student the right one."* Also binding:
item 3 (real-time games), item 4 (cinematic animation), item 9 (zero visible failure), item 12 (proper diagrams) and
item 14 (frequent adaptive generation).

**Tags.** [M] measured in this repo, cited. [T] another Taxila file. [P] a paper, via Study B. [V] a vendor, via
Study A. [E] an estimate made here, to be measured by §7.

---

## 0. The answer on one page

Duplex split the voice into separate speech and work tracks. Stagecraft does the same for the screen.

**1. Five sources nominate in parallel, every tick.**
- **Lesson-plan lookahead:** the next 2-3 beats.
- **The duplex partial-intent stream:** a misconception value, an on-topic question, an aid tap.
- **The child's explicit requests.**
- **Child signals:** stuck, fragile, disengaged, curious.
- **The board state:** what is on stage and how the child is doing on it.

A nomination is SILENT. It can create, re-score or kill a candidate. It can never put anything on screen.

**2. The portfolio is bounded.** It holds the in-flight and ready candidates. Each candidate has:
- a predicted-need probability;
- a deadline (when it would be shown);
- a cost;
- a build rung;
- a **validity key** over the conversation state it was built for.

The rung ladder runs, fastest first: steer (a knob on the running piece) → library hit → engine with kit-seeded params
(instant) → generated spec (about 3 s) → image (about 15 s) → live codegen race (34-54 s, planned only). The board
twin is always there underneath.

**3. A scheduler spends in tiers.**
- Specs start on weak signals.
- Images start only on stable ones.
- Live builds start only from a lookahead of 90 s or more.

Each tier has its own concurrency cap and its own per-minute and per-lesson-hour budgets. Priority is expected value ×
urgency, with hysteresis on pre-emption. Stagecraft never uses the reply deployment, and it goes quiet during the
reply's time-to-first-token (TTFT) window. A 429 fails over down the tier's chain, and the last link is always "do
not build".

**4. The reveal policy acts only at a turn-relevant point.** That is her turn starting, a beat boundary, or a request
being answered. At that point:
- The **code policy** chooses *what idea* to show, without knowing what is ready. This is the lossless rule (SC-1).
- Stagecraft serves that idea from the best **fresh, checked** ready candidate.
- If there is none, it serves the next-best ready rung of the same idea.
- If nothing is ready, the teacher draws it on the board.

There is never a loading state, a stale piece or a wrong piece. The teacher's line is fused to the reveal, and her
words come only from the facts of what is actually on stage. Every candidate carries a **board twin** with the same
values, so a failed mount keeps her words true.

**5. It plugs in on the same tick and under the same floor rules as duplex.**
- `BuildIntents` becomes one source.
- `RevealQueue` becomes the reveal policy.
- The Wave 2 seam (`statusFacts` / `slotFor` / `onReveal`) stays the only door into the lesson.
- `router.decide` and `buildRace` are the live rung.
- RS-4's `validateSpec` and `gradeAnswer` are the spec rung.
- `azure.js IMAGE` is the image rung.

**6. Targets.** All are [E]; §7 measures them.

| metric | target |
|---|---|
| right artifact ready when needed | ≥ 0.85 overall; ≥ 0.95 on plan-led beats |
| "show me" → first frame | p95 ≤ 4 s |
| wrong, stale or safety-turn reveals | 0 |
| visible failures | 0 |
| speculative spend | ≤ $0.15 per lesson-hour, of which ≤ $0.08 wasted |
| generation frequency | ≥ 6 child-specific generated pieces revealed per 25-minute lesson, ≥ 12 stage moments in all, and 60-150 specs built speculatively |

**7. Proven in simulation before a child sees it.** `evals/stagecraft/` replays scripted lessons on a virtual clock
with measured build-time distributions. It includes:
- a **lossless shadow arm** (speculation off vs on must pick the same piece 100% of the time);
- the safety battery;
- one small real-build arm, about $1-2 inside the $25 cap.

**What is new here.** Study A found no product that builds several candidates in parallel during a conversation and
then shows the right one. There is no reference implementation, so every claim above has a §7 measurement attached.

---

## 1. What binds this design

| # | constraint | source | consequence here |
|---|---|---|---|
| B1 | Nothing reaches the stage during a safety turn; safety comes before every act | duplex law 7, G1; v1 law 5; child-safety floor | a pool-wide quarantine (§4.6); a reveal point with `safetyOpen` returns `hold` |
| B2 | Every artifact passes the stage contract and its validators | DESIGN-V3 §6; STUDIO-V2 §8 | a candidate is `ready` only after `CandidateChecks` all pass (§2.4) |
| B3 | Grading only from verified keys; the frame's claim is never an input | `rj-ot-frame-claim-as-grade`, `gradeAnswer` | candidates carry kit truth; a model never grades or judges a candidate |
| B4 | No live codegen from a partial; live builds only from lookahead | `forge-live-codegen-race`, `live-free-generation`, duplex §4.3, `rj-sc-live-build-from-partial` (proposed) | the live tier's `minStrength = "planned"`, `minLeadMs = 90 s` |
| B5 | Generated pixels never carry a curriculum fact | `generated-media-carries-facts`, `diagram-router-no-baked-labels` | images are text-free art plus code overlays of kit terms; never the answer-bearing piece |
| B6 | The reveal is code; models estimate, code disposes | duplex law 8; `llm-beat-proposer-live`; Study B §2.4 | `pReveal`/`pOffer` thresholds in code; no model call on the reveal path |
| B7 | One piece on stage; nothing new enters while the child holds the floor | STUDIO-V2 §7; DESIGN-V3 §6.8 | reveal only at `BoundaryPhase`; a 420 ms crossfade |
| B8 | The teacher may refer only to what is revealed | LIVE-STUDIO D9; `rj-w2hfix-facts-row-before-arbitration` | her facts row = `onStage` or `revealing` after the kernel accepts; the board twin keeps values identical on a failure |
| B9 | Never print or ship the child's id, name or words to a model | LIVE-STUDIO §5.4 | nominations carry kit ids and closed vocabulary only (`Nomination.target`) |
| B10 | Azure-only; spend caps | CLAUDE.md; `router.js CAPS` | every rung is a Foundry Direct deployment; caps in §3.2 sit under the existing `usdPerChildDay` |
| B11 | Readiness is never a reason to reveal | Study A §0.6; Study B SC-6/SC-7; `rj-studio-reveal-on-clock-only` | ready candidates wait invisibly for a want plus a line that names them |
| B12 | Frequent (owner item 14) | OWNER-RESET; STUDIO-V2 §7 | specs have no count cap, only pedagogy; the per-lesson count target is in §6 |

---

## 2. Candidate sources (one tick)

### 2.1 The tick

Stagecraft runs **server-side**, because misconception values are key material and never reach the device
(`duplex-verdict-blind-timing`). It is a pure reducer, `Stagecraft.step(state, input, cfg)`, in the same style as
`speculator.js`:
- clock-agnostic;
- launchers are injected;
- the evals simulator and production run the same code.

It steps on each of these inputs:

| input | when | from |
|---|---|---|
| `nominate` | every server partial slice (the same call site as `BuildIntents.fromPartial`); every `PrepareHint.buildIntent`; every screen `aid_request` | `server/duplex/{buildIntent,slice,routes}.js` |
| `phase` | each governed `FloorPhase` change, mirrored from the device host (seam P2) | `src/duplex/host.ts` → slice |
| `state` | turn commit, beat change, ledger write (misconception active or resolved), hint-rung change | `/turn` (W2-E), kernel, learner model |
| `signal` | each signal frame | `server/signals/index.js step()`, `server/voicesig/**` |
| `board` | each `StudioTurnView` / host grade | `server/studio/seam.js` |
| `landed`, `quota` | a build finished or failed; a deployment returned 429 or 200 | rung builders |
| `reveal_point` | a boundary (§4.1) | the turn path, at `statusFacts` time |
| `timer` | every 500 ms | deadline and expiry housekeeping only |

The device's 100 ms engine tick is not repeated on the server. The server sees every event that can change content
intent, and the 500 ms timer only ages candidates. Content does not need a finer clock, because a reveal can only
happen at a boundary.

### 2.2 The five sources

Each source writes `Nomination`s. A nomination carries:
- a family key (one idea);
- a need and target kit ids;
- the preferred kinds;
- `pNeed`, a deadline;
- a **strength**, which caps the tier it may start (SC-3).

| source | what it reads | families it nominates | strength → highest tier | pNeed (starting, [E]) | deadline |
|---|---|---|---|---|---|
| **plan_lookahead** | the beat plan's next 2-3 beats (W2-H `candidateIntents`, NEEDED_AT until beats ship), this child's active misconceptions and re-teach rows, the skill's process/spatial flag | explain (animation archetype), contrast for each own misconception, practice game after untimed accuracy, worked example | `planned` → live (if lead ≥ 90 s), else spec | 0.8 next beat; 0.5 beat+2; 0.3 beat+3 | the beat's projected open time |
| **partial_intent** | `understand()` on each slice: misconception value match, curiosity with a topic term, distress (→ safety, not a nomination) | contrast_misconception (that id), explore_question (that term) | `weak` on the first slice; `stable` when the same family key holds for ≥ 2 slices or ≥ 1.5 s → image | 0.45 weak, 0.65 stable; capped at 0.7 until commit (values are wrong 38-45% from prefixes [T: M-B1]) | next TRP |
| **child_request** | RS-5 notes (`visual_request`, `game_request`, `animation_request`, `explain_differently`), the stage lexicons, an aid tap, `StageRequest{source:"child_request"}` | the asked kind on the current skill; `re_represent` for "another way" | `explicit` → spec now; image if the kind is a picture; never live | **1.0**, urgent | **next TRP**, even mid-beat |
| **child_signal** | `stepState`, `verifyDue`, `choiceDue`, L9 `curious` depth, `breakDue` | `stuck_unproductive` → re_represent (next representation; the kit's contrast if a misconception matched). `verifyDue` → verify (a transfer item on another representation). `choiceDue` → switch_modality (game ↔ sim ↔ animation). `curious why_how/what_if` → explore_question. **`stuck_productive` → nothing, and it vetoes swaps** (hold the rung). `breakDue` → no nominations | `weak` (spec) | 0.4-0.6 per licence | next TRP |
| **board_state** | the host's grades on the piece on stage; the steering words | `wrongCount ≥ 2` → re_represent of the same item. `complete` → the next beat's family gains +0.15. `harder`/`slower`/`again` → a **steer** candidate (no generation) | `explicit` for steer; `weak` otherwise | steer 1.0; others 0.5 | next TRP; steer is instant at the next boundary |

**Kinds per need** come from a code table: STUDIO-V2 §7, extended with Study B's SC-8 priors.
- A process or spatial explain gets an animation.
- Below mastery gets a worked example or explainer.
- A game comes only after accuracy is shown untimed.
- Explore-first candidates are offered only in classes 6-9; classes 1-5 get instruction first.
- **Diversity rule (SC-2):** a family's up to 3 speculative candidates span at least 2 archetypes or kinds. They are
  never 3 variants of one archetype (`rj-sc-same-archetype-k`, proposed).

**Admissibility runs before anything is scored.** For RS-4 engines this is `ENGINE_SPECS[a].outcomes`: the topic is
in `topics` and the misconception, if any, is in `misconceptions`. For Wave 2 archetypes it is `chooseArchetype` plus
`aboutTopic`. A family with no admissible archetype gets only the board rung, and that rung is a real artifact.

**Calibration.** The starting pNeed values are [E]. E-ST2 (§7) fits them per source, as the empirical
P(want at deadline | nomination) on replay. The fitted values then replace the table, with the n recorded.

---

## 3. The portfolio and the scheduler

### 3.1 The portfolio

`Portfolio` = the bounded set of `Candidate`s for one lesson, plus `onStage`, a spend ledger and the quarantine flag.

**Per-candidate fields:**

| field | meaning |
|---|---|
| `pNeed` | the maximum over the family's live nominations, decayed with a 20 s half-life since the last re-nomination [E]. A child request pins it at 1 until answered or superseded |
| `value` | signed learning value from the code table. Contrast for an *active* misconception 1.0; explain on a process idea 0.8; practice game 0.6; switch-modality 0.5; generic explain 0.4. **Off-topic or seductive pieces score ≤ 0 and are never built** (SC-7) |
| `deadlineAt` | when it would be shown |
| `estReadyAt` | now + the rung's p90 build time (§3.2), refreshed from live measurements |
| `estCostUsd` | the rung's mean cost |
| `premise` | the `ValidityKey`, stamped at launch |
| `payload` | intent-shaped; the child's values are `LateBindSlot`s filled at commit (SC-4) |
| `boardTwin` | the code-built board script of the same idea with the same kit values |

**Bounds (per lesson, [E]):**
- ≤ 4 open families;
- ≤ 3 speculative candidates per family;
- ≤ 24 candidates in any state (oldest discarded first);
- at most 1 image and 1 live build in flight.

Study A's sizing (§6.4) was 6-9 spec calls per beat. These bounds allow it.

**Invalidation runs on every `state`, `signal` and `reveal_point` input.** A candidate is **fresh** only if its premise
equals the current key on every field the rule table marks.

| reason | trigger (ValidityKey fields) | effect |
|---|---|---|
| `topic_change` | `topicId`, `skillId` | kill every candidate of the old skill; in-flight builds aborted |
| `item_change` | `itemId` (item-bound candidates only) | kill |
| `beat_exit` | `beat`, when the piece's kind is not admissible in the new beat (`PLAY_BEATS`/`WATCH_BEATS`, seam.js) | kill; a gated piece goes to `library` |
| `misconception_revealed` | a new `misconceptionId` in the family's skill | siblings demoted ×0.5; a new contrast family nominated |
| `misconception_resolved` | `misconceptionState` active → resolved (repair `wrong_to_right`, ledger clears) | kill that contrast family; a gated piece goes to `library` |
| `request_superseded` | a newer child request in the same turn with a different want | kill the old request family (its rung-0 board is not shown either) |
| `representation_change` | `hintRung`, `representation` moved past what the piece shows | demote ×0.3 |
| `pending_changed_choice` | a `pending` id resolves and the policy's want for that family changes | kill |
| `kit_change`, `lang_change` | `kitHash`, `lang` | kill |
| `safety` | — | **pool-wide quarantine (§4.6)** |
| `parent_off` | Studio off or ready-made only (`router.decide` reasons) | kill all speculative rungs; library only, or voice |
| `stale_age` | ready and unrevealed > 4 min (`STUDIO_LIMITS.readyUnrevealedMs`) | library return |
| `churn` | the family key flipped ≥ 3 times inside one tier's p50 build time | this family may use only the instant tier until it holds for 2 slices (Cho & Garcia-Molina via Study B §2.9) |

`learnerRev` and `floorRev` are recorded for telemetry and replay. On their own they do not kill a candidate, because
a ledger write that leaves the target unchanged should not throw away good work. Only the fields above do.

### 3.2 Tiers, caps and budgets

All numbers are [E] starting values. E-ST3 sweeps them; build times are [T/M] as cited.

| tier | rungs | build p50 / p90 | cost | starts on | concurrent | per family | per minute | per lesson-hour | $ per lesson-hour |
|---|---|---|---|---|---|---|---|---|---|
| instant | steer, library, engine_default, board twin | < 0.1 s; library mount ≤ 1 s [T: LIVE-STUDIO §7] | 0 | any | unbounded (code) | — | — | — | 0 |
| spec | generated_spec | 3.25 s p50 [M: STUDIO-V2 §0.5, 8/8 valid]; p90 6 s [E] | < $0.001 | `weak` | 4 | 3 | 12 | 300 | ≤ $0.06 |
| image | image | 15.1 s [M: MODEL-ROUTER §0]; p90 30 s [E] | $0.0066 | `stable`, or plan lead ≥ 20 s | 1 | 1 | 1 | 12 | ≤ $0.08 |
| live | live_codegen | 37-54 s p50; passers' max 46-74 s [M: LIVE-STUDIO §7] | $0.13-0.23 | `planned` with lead ≥ 90 s | 1 | 1 | — | ≤ 3 per lesson (`CAPS.liveBuildsPerLesson`) | under `CAPS.usdPerChildDay` $0.60 |

**How the per-lesson total works out.** The speculative total (spec + image) is ≤ $0.15 per lesson-hour. Live builds
are not speculative: they keep LIVE-STUDIO's caps and breaker. A lesson's Stagecraft spend is also checked against the
child's day and month caps in `router.js`; whichever cap binds first wins.

**Launch rule (SC-3).** A tier may start a candidate only if all of these hold:
1. The nomination's strength is ≥ the tier's `minStrength`.
2. `deadlineAt − now ≥ the tier's p90`. A build that could not be ready in time is not started; the cheaper tier
   serves.
3. The tier's caps and the deployment's quota bucket have room.
4. The reply quiet window is not open (§3.4).

### 3.3 Priority, pre-emption, cancellation

```
score = pNeed × (value − valueOfBestFreshReadyInFamily) × pReady(deadline) × freshness − λ·cost
        × urgency,  urgency = 1 + 2·[childRequested] + 1/max(1, slackSec),  slack = deadline − now − p90(rung)
```

- **valueGain.** It subtracts what is already ready for the family. A family whose engine_default is ready (always, for
  an admissible archetype) gains from a generated spec only by the personalisation margin. That keeps specs cheap and
  targeted.
- **pReady.** It comes from the rung's measured build-time CDF at the remaining slack.
- **freshness.** It is P(the premise survives to the deadline), from the family's churn history: 1 − flips per
  build-time.
- **λ.** It converts dollars to value units. Start at 50 per USD [E], so a $0.0066 image needs a valueGain × pNeed of
  about 0.33 or more.
- **Ratio-greedy fill.** Each tick fills free slots per tier with the highest-score nominated candidates (SC-9
  knapsack).
- **Pre-emption.** When a tier is full, a newcomer cancels the lowest-score running build in that tier only if its own
  score is ≥ `preemptRatio` (1.5) × that build's score. A child request always pre-empts.
- **Cancellation.** A build is aborted (`AbortSignal`) the moment its candidate is invalidated or pre-empted. Its cost
  so far goes to `usdWasted`.
- **What is never cancelled.** A build is never cancelled because "she stopped talking". Duplex triage law: silence
  never cancels work.

### 3.4 Never starve the reply path; quota awareness

The reply path is the teacher's next sentence. It is worth more than any piece. Four rules protect it:
1. **Separate deployment.** Stagecraft specs call `DEPLOY_STAGECRAFT_SPEC` (owner action O-1: a separate
   `taxila-stagecraft` deployment of gpt-5.6-luna with its own TPM). Until it exists, Stagecraft uses
   `taxila-gpt6-luna`, never `DEPLOY.reply`/`taxila-fast`. Both bill Direct from Azure. `QuotaState.isReplyLane` marks
   the reply deployment, and Stagecraft never calls it.
2. **Quiet window.** No spec or image launches while the governed phase is `committed`, nor for the first
   `replyQuietMs` (1,500 ms [E]) of `her_turn`. Launches that were due queue up and go immediately after. This covers
   the reply's TTFT (938/1,151 ms p50/p90 on gpt-6-luna [M: MODEL-ROUTER §0]) and the TTS first chunk.
3. **Reply 429 pause.** Any 429 on the reply lane in the last 60 s pauses all Stagecraft spec launches for 60 s, even
   on separate deployments, because Foundry capacity can be shared at the region level.
4. **Per-deployment token buckets with failover.**

| tier | chain (in order) | on 429 |
|---|---|---|
| spec | `taxila-stagecraft` → `taxila-gpt6-luna` → `taxila-mistral-m35` → **no build** (engine_default serves) | honour `Retry-After`, else back off exponentially from 2 s up to 60 s; move to the next link; the family stays served by the instant tier |
| image | `taxila-image25-flare` low (4 RPM **subscription-wide**; Stagecraft's process-wide bucket gets 3) → `taxila-image` low → **no image** | the same; images are optional by construction |
| live | `router.decide` arms (two-arm race) | `breaker` (G2 code) opens on a failure streak; live → library/engine fallback |

A 429 never shows up on screen. The family is still served by the instant rung, and the `quota_429` and `failover`
telemetry rows let E-ST4 count it.

---

## 4. The reveal policy

### 4.1 Reveal points

Content changes only at a `RevealPoint`:

| kind | duplex phase | what it is |
|---|---|---|
| `trp` | `committed` → `her_turn` (her reply's first sound) | the default: the piece appears **with** her line |
| `beat_boundary` | `her_turn` or `handover` when the kernel opens a new beat | plan-led pieces |
| `request_answered` | `her_turn` of the reply to a child request | the request family is pinned |

These are exactly `PHASE_BOUNDARY` in `buildIntent.js`. `child_turn`, `overlap`, `hold_requested`, `safety_attend` and
`idle` are never reveal points, and neither is a moment when the child holds the floor (`childHoldsFloor`).

### 4.2 The decision (code, in order; first match wins)

1. **Safety open** → `hold:safety`. The pool is already quarantined (§4.6).
2. **Child holds the floor**, or the phase is not a boundary → `hold:child_floor`.
3. **The code policy's want.** The kernel and Director decide `StageWant` (family, need, kinds, archetype) from the
   same inputs they use today: beat, moves, signals, the request. They decide it **without reading the portfolio**.
   This is the lossless rule: speculation changes readiness, never choice (SC-1; `rj-sc-model-decides-reveal`,
   proposed).
   - No want → `hold:no_want`. Ready candidates wait.
   - `stuck_productive` → `hold:stuck_productive` (do not swap while a child is productively struggling).
4. **Steer first.** If the want is a steer on the running piece → `steer`. No new piece: under 100 ms.
5. **Threshold (SC-5).**
   - If the want is not a child request: `pNeed ≥ pReveal` (0.7) continues.
   - `pOffer` (0.4) ≤ pNeed < 0.7 → `offer`. Her line asks ("dikhaun?") and the reveal waits for a yes at the next
     point.
   - Below 0.4 → `hold:below_threshold`.
6. **Serve.** Over the want's family, take the candidates in state `ready`, rank them by rung preference (below), and
   take the first that passes **all** of these:
   - **Fresh:** premise equals `current` on the rule-table fields; every `pending` id resolved without changing the
     want.
   - **Checked:** `CandidateChecks` all true (validateSpec, truth recomputation, stage contract, on-topic, content
     safety, and the gate for live builds via `revealable()`).
   - **Late-bound:** the `LateBindSlot`s are filled with the child's committed values, then `validateSpec` runs again.
     A spec that the binding makes invalid is rejected (`after_binding_invalid`) and the next one is tried.
   - **Wanted:** the archetype or kind is one the want admits.
7. **Rung preference** (the best playable first):
   1. a passed live build;
   2. a generated spec (personalised);
   3. a library variant;
   4. an engine_default;
   5. an image-backed explainer, where the want is a picture.

   The first passing candidate → `reveal`.
8. **Nothing ready and fresh** → `board`. The teacher draws the same idea on the board, from the family's board twin
   or from `planWhiteboard`. Drawing live *is* the content; it is not a wait. A better rung that becomes ready later can
   swap in at a **later** reveal point, but only if it is still fresh and still wanted (STUDIO-V2 §8 hot-swap).
9. **Never:**
   - a loading state, a spinner, "being made" or an error card (DESIGN-V3 §6.9);
   - a piece because it is ready;
   - a piece whose premise has moved.

### 4.3 Words bound to the stage

- **Facts row.** When a candidate is chosen in step 6, its `facts` become `StudioTurnView.revealing`. They reach the
  reply prompt as the telegraphic facts row **only after** the kernel accepts the reveal and `slotFor` gives a slot.
  This is the order `rj-w2hfix-facts-row-before-arbitration` and `rj-w2efix-reveal-without-slot` require.
- **Fused reveal (SC-6).** The reveal command carries a `RevealCue` with:
  - the clause index of her line that names the piece;
  - the cue scheduler's 400 ms pre-roll (`teacher-stage-cue-scheduler`);
  - a 420 ms crossfade.

  If her generated line names nothing on stage, the reveal is withheld (`hold:no_reference_in_line`) and the
  candidate stays ready. A piece that appears before or without its sentence breaks temporal contiguity (d = 1.22
  [P-sec, Study B]).
- **Mount failure after reveal.** The device holds the last good frame, then crossfades to the candidate's
  `boardTwin`: the same idea with **the same values** (STUDIO-V2 §8 rung 4). Her sentence, already grounded in those
  values, stays true. `mount_failed` is logged and counts as a visible failure only if a non-ladder frame painted.

### 4.4 Rate and frequency rules at the reveal

STUDIO-V2 §7's targets mean the stage is rarely idle. These rules hold the pace:
- **Swap spacing.** Keep ≥ 2 turns between policy-led swaps (seam P5 changes `turnsBetweenReveals` from 4 to 2).
  Child requests and steers are exempt.
- **`firstRevealTurn`.** It stays at 3 for prefetched pieces. A child request in turn 1-2 is honoured.
- **Retire.** A piece retires after 8 turns, or 2 turns after it completes (seam.js, unchanged). The next reveal point
  then fills the stage from the portfolio.

### 4.5 Which want wins when several are live

At one reveal point the code policy picks one want. Precedence:
1. safety;
2. child request (the newest one);
3. board-state reteach (`wrongCount ≥ 2`);
4. misconception contrast;
5. beat plan;
6. signal-led switch or verify;
7. curiosity (parked to wrap-up if it is off the beat, R6).

The losing families stay in the portfolio and keep their candidates while fresh.

### 4.6 Safety: the pool-wide quarantine (SC-13)

**What opens it.** Any of these:
- a distress partial (`understand().safety.distress`, the same predicate `BuildIntents` uses);
- the governor entering `safety_attend`;
- a classifier distress flag;
- a content-filter block on a child's turn.

**What it does:**
1. Every candidate in every state is set `discarded(safety)`, in-flight builds are aborted, and `onStage` is retired
   at the next boundary to the calm board state (no piece during a safeguard).
2. No nomination is accepted from that turn's words, ever. Specs and images are never built from the words of a
   distress turn.
3. It stays sticky until the kernel closes the safeguard and the governor leaves `safety_attend`.

**What does not change.** Non-Stagecraft safety behaviour (helplines, hand-off) is untouched. Stagecraft only goes
silent.

---

## 5. How it plugs in

### 5.1 The duplex host (same tick, same floor rules)

| duplex piece | today | with Stagecraft |
|---|---|---|
| `BuildIntents.fromPartial` / `fromScreen` / `fromHint` | launches a prefetch and pushes the result into `RevealQueue` | becomes a **source adapter**: each returned intent → `nominate`. The prefetch-only rule is kept, as `minStrength` per tier |
| `triage()` | INTERRUPT / WHEN_IDLE / SILENT | unchanged. Every candidate result is SILENT into the portfolio (Study A §6.1). Only the reveal policy turns a candidate into a WHEN_IDLE reveal. INTERRUPT (safety) opens the quarantine |
| `RevealQueue.drain(floorState)` / `drainAtPhase(phase)` | drains at a boundary, sorted by urgent | replaced by the `reveal_point` input at the same boundaries (`PHASE_BOUNDARY`). Its "never mid-utterance" test becomes Stagecraft test T-4 |
| `BuildIntents.onSafety` / `Speculator.onSafety` | quarantine the turn's drafts and queue | also sends `{t:"safety", open:true}` (seam P1) |
| `PrepareHint.buildIntent` | a prefetch key | a `partial_intent` nomination, `weak` |
| governor `FloorPhase` | device-side | mirrored to the server slice on change (seam P2), for the reply quiet window and reveal points |

Stagecraft keeps the duplex laws:
- speech and work are separate tracks;
- silence never cancels work;
- nothing changes mid-utterance;
- safety is sticky.

### 5.2 Wave 2 Studio (seam, router, race, library) and W2-H

- **The seam is the only door.** `server/studio/seam.js` keeps its contract: never throw, ≤ 1 ms synchronous on the
  turn path, and pieces invisible until revealed.
  - `statusFacts` asks Stagecraft for the outcome at the current reveal point (synchronous, in-memory).
  - `slotFor` maps a `reveal` outcome to `UiDirectives.studioSlot`.
  - `onReveal` sends `revealed`.
  - `requestIntent` (RS-4 item 09, `source:"child_request"`) becomes a `child_request` nomination.
  - All of this is patch P3.
- **Prefetch at lesson start → plan_lookahead.** `candidateIntents(ctx)` is the first plan source. It is code-only,
  personal first, and topic-guarded. Its `STUDIO_LIMITS.piecesPerLesson = 3` cap applies to *live* pieces only. Spec
  and engine candidates are bounded by §3.1 (patch P5).
- **Router.** `router.decide` stays the gate for the live rung: parent control, safety mode, first-session promoted
  only, caps, breaker, lead. Stagecraft calls it before any `live_codegen` launch and obeys `fallback`.
- **Race and library.**
  - `buildRace` builds the live rung (two arms; the first to pass wins).
  - A losing arm that passed, or any gated candidate that was never shown, goes to the library through
    `recordGatePass` (LIVE-STUDIO D5/D11). The library is keyed by structure, never by child.
  - `lookup(identity)` is the library rung.

### 5.3 RS-4 engines (the spec rung)

- **engine_default.** `validateSpec(archetype, kitSeed)` runs over kit-seeded params. It never throws and returns the
  reviewed default when nothing personal fits. Cost about 0 ms. This makes "something correct and on-topic" instantly
  available for every admissible family.
- **generated_spec.** A small structured call targets `specJsonSchema(archetype)`. Its prompt is built in code from
  closed vocabulary (kit ids, the misconception id, band, lang, archetype notes placed last); no child words, no child
  id. The result then goes through `validateSpec`, the engine's own truth recomputation and a Q8 strings check.
- **Grading.** `gradeAnswer(archetype, spec, itemId, value)` is the only grader of anything the child does on a
  revealed piece. `ENGINE_SPECS[a].outcomes` is the admissibility table.
- **Steer.** Knobs (speed, tolerance, marks, timeline seek) are engine API calls on the running piece. They are never a
  candidate build.

### 5.4 The image lane

- **Deployment.** `azure.js DEPLOY.image` / `IMAGE` uses quality **low** only (`rj-image-medium-quality`). Fallback is
  `taxila-image` low; diagrams may fall back to sunburst low.
- **Allowed uses.** Images are **art only**:
  - a hook scene;
  - a backdrop for an explainer;
  - an illustration beside the board.

  Every label is a code overlay of a kit term, and Hindi labels are never baked in.
- **Checks.** The image candidate's checks are an OCR no-text presence check (OCR is valid only as a presence check,
  `generated-media-carries-facts`) plus Content Safety. An image never carries the answer-bearing content of a
  family. The family's answerable piece is always an engine or the board.
- **Capacity.** The image lane is the scarcest resource: 4 RPM subscription-wide. Hence concurrency 1, the `stable`
  strength rule and a process-wide bucket of 3 per minute. Owner action O-2 is to raise capacity before images scale
  past the first child cohort.

### 5.5 The live codegen race (LIVE-STUDIO, MODEL-ROUTER §0)

Nothing about the race changes:
- ≤ 3 per lesson;
- a lead of 90 s or more;
- strict gate, ≤ 2 repairs;
- the two routed arms;
- `revealable()` before any mount.

Stagecraft only adds two things:
1. **Where races start.** A race is started only for a `plan_lookahead` family whose deadline is ≥ 90 s away and
   whose instant and spec rungs have a lower value (for example, a new misconception pairing the engines cannot
   express).
2. **What happens when a race wins.** The winner is just one more candidate. It is shown only if still fresh and
   wanted at a reveal point. Otherwise it goes to the library.

---

## 6. Target numbers

All are [E] until §7 measures them. Each row names the eval that measures it.

| metric | definition | target | measured by |
|---|---|---|---|
| **right-artifact-ready-when-needed** | at reveal points with a want: a fresh, checked candidate at the want's preferred rung or better was ready by the deadline | **≥ 0.85** overall; plan-led **≥ 0.95**; child request **≥ 0.80** at spec rung or better within the next TRP (100% answered with *something* correct, the board included); misconception contrast ≥ 0.75 | E-ST1 |
| time-to-ready | launch → ready, per tier | spec p50 ≤ 3.5 s, p90 ≤ 6 s; image p50 ≤ 16 s, p90 ≤ 30 s; live p50 ≤ 45 s, p90 ≤ 75 s | E-ST1 (sim from measured CDFs), E-ST4 (real) |
| "show me" → first frame | the child's last voiced frame → the piece painted | p50 ≤ 2.5 s; **p95 ≤ 4 s** (STUDIO-V2 §7) | E-ST5 |
| wasted builds | launched and never revealed, per lesson-hour | spec ≤ 200 (≤ 70% of launched); image ≤ 8; live ≤ 1 | E-ST1/E-ST3 |
| cost | Stagecraft $ per lesson-hour | speculative (spec + image) **≤ $0.15**, of which wasted **≤ $0.08**; live under the existing caps | E-ST3, E-ST4 |
| **wrong reveals** | a revealed piece whose truth disagrees with the kit, or that is off-topic | **0** | E-ST1, fuzz |
| **stale reveals** | a revealed piece whose premise ≠ the state at the reveal point | **0** | E-ST1 |
| **safety-turn reveals** | any reveal or stage change while the quarantine is open | **0 / N** | E-ST6 |
| reveals while the child speaks | — | **0** | E-ST1 |
| **visible failures** | any non-ladder frame: blank, error, spinner, overflow, "being made" | **0** | E-ST1 + `v3check` |
| lossless agreement | the chosen (archetype, premise) is identical with speculation off vs on | **100%** | E-ST1 shadow |
| reference gap | reveal → her referring word | p90 ≤ 500 ms | E-ST5 |
| **generation frequency** | per 25-minute lesson (B3 planned minutes) | **≥ 6** child-specific generated pieces revealed (generated spec or live; library and engine_default not counted); **≥ 12** stage moments in all, board and steer included; **60-150** specs built speculatively; stage active 35-55% of lesson time; median gap between pieces ≤ 4 min; ≥ 25% child-initiated | E-ST1 (sim), E-ST7 (children) |

The frequency row is the owner's "frequent" made countable. If E-ST7 shows learning is no worse at a higher rate,
the target rises. If it shows harm (seductive-detail effects on host-graded post-items), the target falls. The
reversal is in §10.

---

## 7. Telemetry and the eval design

### 7.1 Telemetry

- **Rows.** There is one `StagecraftEvent` row per candidate lifecycle change and per reveal-point decision. It holds
  ids, rungs, reasons, times and costs. It **never** holds child words (`w2e-brain-trace`), and it never holds the
  prompt text (`PromptRef` is a template id plus a hash).
- **Where rows go.** They go to the lesson trace, and behind consent to the evals bucket (duplex S15).
- **Per lesson.** A `StagecraftScorecard` is folded from the rows.
- **Where the scorecard surfaces.** It surfaces in `evals/stagecraft/report.mjs` and, later, in the ops dashboard. It
  is never shown to the child or the parent.
- **Key derived series:**
  - ready-when-needed by trigger;
  - pNeed calibration per source (reliability curve);
  - discard reasons;
  - 429s and failovers per deployment;
  - quiet-window deferrals;
  - reference gap.

### 7.2 Evals (`evals/stagecraft/**`)

| id | question | method | n | ship bar | cost |
|---|---|---|---|---|---|
| **E-ST0** unit and property | do the laws hold for every input order? | `tests/stagecraft*.test.mjs`. Property tests over random input streams: no reveal off-boundary; none while quarantined; none stale; ≤ caps; every effect has a matching cancel or land; replay determinism | 10k random streams | all pass | $0 |
| **E-ST1** replay simulator, lossless shadow | ready-when-needed, stale and wrong reveals, frequency; is speculation lossless? | a virtual-clock replay of scripted lessons (TaxilaFDB-style, plus duplex E1 transcripts) through the real `step()`, with build times drawn from measured CDFs per rung (spec 3.25 s p50; flare 15.1 s; race 37-54 s). Scripts include mid-turn self-corrections, topic changes, superseded requests, safety turns, `stuck_productive` turns and 429 storms. Arms: **off** (build on demand at the reveal point), **on**, **on-k1** (one candidate per family) | ≥ 40 lessons, ≥ 1,000 reveal points, ≥ 100 misconception turns, ≥ 50 requests | §6 targets; lossless 100%; stale, wrong, safety and visible failures all 0 | $0 |
| **E-ST2** source calibration and hit@k | how early does content intent stabilise; is pNeed calibrated; what are hit@1/3/5? | the E-ST1 timelines, word by word (Study B E-SC1) | same | stabilisation before turn end on ≥ 50%; hit@3 ≥ 0.7; calibration error ≤ 0.1 | $0 |
| **E-ST3** waste curve | ready-when-needed vs $ wasted per tier and threshold | sweep `minStrength`, the stable rule, λ, the caps; pick the knee | same | spec waste ≤ $0.06 per lesson-hour at the knee | $0 |
| **E-ST4** small real-build arm | do 3-wide concurrent specs plus 1 flare image meet their p90 under real Foundry load **without hurting the reply lane**? | 20 replayed turns × 3 specs on `taxila-gpt6-luna` (or `taxila-stagecraft`) + 20 flare-low images, run concurrently with a synthetic reply load on `taxila-fast`. Measure the reply TTFT with Stagecraft on vs off | 60 specs, 20 images, 200 reply calls | spec p90 ≤ 6 s, 100% valid after `validateSpec`; reply TTFT p90 regression ≤ 50 ms; 0 reply 429s | ≈ $0.06 + $0.13 + $0.5-1.0 ≈ **$1-2** of the $25 cap; only this arm spends |
| **E-ST5** fused reveal timing | reveal → referring word; "show me" → first frame | the lesson harness with the TTS clock (S14 word boundaries) | ≥ 50 reveals | reference gap p90 ≤ 500 ms; request p95 ≤ 4 s | local |
| **E-ST6** safety battery | zero stage change during a safeguard | SIGNALS ES-3 (a) distress lines and the duplex safety scenarios injected at every phase, with candidates at every state | ≥ 300 turns | **0 / N** stage changes; 0 builds from distress-turn words | $0 |
| **E-ST7** children (later) | does speculative, frequent content help or harm learning? | a within-child A/B, Stagecraft on vs Wave 2 prefetch only, kit-keyed probes; picked-vs-planned (Study A SP-6) | 12+ children | no harm on host-graded post-items; ≥ 25% child-initiated; owner review | — |

**Order.** E-ST0 → E-ST1/2/3 (all $0) → E-ST4 (the only spend) → shadow in real lessons (`stagecraft=shadow`: decide
and log, never reveal) → E-ST5/E-ST6 → `stagecraft=on` → E-ST7.

---

## 8. Code layout (new paths only)

| path | what |
|---|---|
| `shared/stagecraft.ts` | the types and interfaces (written) |
| `server/stagecraft/conductor.js` | `step()`: the pure reducer (portfolio, invalidation, scheduler, reveal policy) |
| `server/stagecraft/sources.js` | the five source adapters → `Nomination`; the kinds-per-need table; admissibility |
| `server/stagecraft/score.js` | value table, pNeed decay, pReady CDFs, score, knapsack |
| `server/stagecraft/quota.js` | per-deployment token buckets, 429 cool-down, failover chains, reply-lane pause |
| `server/stagecraft/builders.js` | `RungBuilders` wired to `server/studio/**`, `shared/studio-spec.ts`, `azure.js`; `boardTwin` from params |
| `server/stagecraft/host.js` | the server-side runner: owns the clock, the AbortControllers and the effects; one per lesson; flag `stagecraft = off \| shadow \| on` |
| `server/stagecraft/telemetry.js` | rows → trace / evals bucket; scorecard fold |
| `src/stagecraft/reveal.ts` | the device side of a `RevealCue`: clause-timed reveal on the TTS clock, crossfade, mount-failure → board twin |
| `evals/stagecraft/{sim.mjs,scripts/,cdf.json,real-arm.mjs,report.mjs}` | E-ST1-E-ST4 |
| `tests/stagecraft*.test.mjs` | E-ST0 |

---

## 9. Patches to existing files (to be written under `docs/design/stagecraft/patches/`, each behind `stagecraft`)

| # | file (owner) | change | apply note |
|---|---|---|---|
| P1 | `server/duplex/buildIntent.js` (duplex) | `fire()` also emits `nominate`; `onSafety()` also emits `safety`; `drainAtPhase` is a no-op when `stagecraft != off` | additive; flag off = byte-identical |
| P2 | `src/duplex/host.ts` + `server/duplex/routes.js` | mirror each governed `FloorPhase` change to the slice endpoint (`{phase, turnSeq, t}`) | a few bytes per change, not per tick |
| P3 | `server/studio/seam.js` (W2-H) | `statusFacts` consults `stagecraft.outcomeAt(point)`; `slotFor` maps `reveal`/`board`; `onReveal` → `revealed`; `requestIntent` → nominate | the seam contract (≤ 1 ms, never throw) is kept |
| P4 | `server/brain/turn.js` / kernel (W2-E) | builds the `RevealPoint` (current `ValidityKey` + `StageWant`) before `statusFacts`; `StageWant` comes from the existing policy inputs | the kernel never reads the portfolio (L1) |
| P5 | `server/studio/seam.js` `STUDIO_LIMITS` | `turnsBetweenReveals` 4 → 2 for policy-led swaps; `piecesPerLesson` applies to live pieces only | frequency (item 14) |
| P6 | `server/azure.js` | `DEPLOY.stagecraftSpec` getter (`DEPLOY_STAGECRAFT_SPEC`, default `taxila-gpt6-luna`) | needs owner action O-1 for the dedicated deployment |
| P7 | `src/lesson/ttsStream.ts` (S14) | clause-boundary events to `src/stagecraft/reveal.ts` | already requested as duplex S14 |

**Owner actions.** Each has a default.
- **O-1:** create `taxila-stagecraft`, a gpt-5.6-luna deployment with its own TPM. Default: use `taxila-gpt6-luna`.
- **O-2:** raise the flare image capacity above 4 RPM before the first cohort. Default: images stay rare and optional.

---

## 10. Proposed context entries (for the main loop to merge; not written to `context/`)

**Decisions (each with a reversal condition):**
- **`stagecraft-lossless-reveal`:** the code policy picks the idea without reading the portfolio; Stagecraft only
  serves it. *Reverse if* E-ST7 shows a readiness-aware policy improves host-graded outcomes with 0 stale, off-topic
  or safety regressions.
- **`stagecraft-validity-key-at-reveal`:** freshness is the premise re-checked at the reveal point, not at build time
  and not by a timer. *Reverse if* stale reveals are 0 over ≥ 1,000 replayed points without the check.
- **`stagecraft-tiered-eagerness`:**
  - specs start on weak signals;
  - images start on stable intent;
  - live builds start only from lookahead ≥ 90 s.

  *Reverse per tier* when its measured p90 falls below the median child-turn length.
- **`stagecraft-board-twin`:** every candidate carries a code-built board twin with identical values; it is the
  mount-failure rung and the nothing-ready answer. *Reverse if* the engines' mount failure rate is 0 over ≥ 2,000 real
  mounts (the twin would then be dead weight beyond the nothing-ready case).
- **`stagecraft-reply-lane-isolation`:**
  - Stagecraft never calls the reply deployment;
  - it is quiet for 1.5 s from `committed`;
  - it pauses on reply 429s.

  *Reverse if* E-ST4 shows a reply TTFT regression ≤ 10 ms with no quiet window.
- **`stagecraft-frequency-target`:** ≥ 6 generated pieces per 25-minute lesson. *Reverse* (lower it) if E-ST7 shows
  harm on host-graded post-items; *raise* it if it shows none at 1.5× the rate.

**Rejections (by design, not by trial):**
- **`rj-sc-reveal-when-ready`**, **`rj-sc-model-decides-reveal`**, **`rj-sc-live-build-from-partial`** and
  **`rj-sc-same-archetype-k`:** as proposed in Study B §4, adopted here.
- **`rj-sc-framework-owned-result-scheduling`:** LiveKit #7302, Study A.
- **`rj-sc-speculation-without-inflight-guard`:** LiveKit #1365, Study A.

**Measurements:** none yet. This document is design. E-ST0-E-ST4 produce the first ones, with n, method and date.

---

## 11. Failure modes and what catches them

| failure | what catches it |
|---|---|
| a correct but stale piece (the child already repaired the misconception) | the `misconception_resolved` rule + the premise re-check at the reveal point (E-ST1 counts stale reveals) |
| a 429 storm on the image lane | the bucket + failover → no image; the family is served by an engine or the board |
| the reply slows because Stagecraft saturates the region | separate deployment, quiet window, reply-429 pause (E-ST4 measures it) |
| the policy reveals too often (seductive effect) | thresholds, swap spacing, the `stuck_productive` veto, E-ST7 |
| a spec is valid before binding, invalid after | re-validation after the binding → the next candidate or the board (`after_binding_invalid`) |
| she names a piece that failed to mount | the board twin with the same values |
| speculation influences the choice (non-lossless drift) | the E-ST1 shadow arm; the kernel API has no portfolio input |
| a safety turn while a race is mid-flight | the quarantine aborts it; a late result lands as `discarded(safety)` |
| the pool grows without bound in a long lesson | the hard bounds in §3.1 + `stale_age` → library |

---

## 12. Built and measured (2026-10-05)

### 12.1 What exists

The code exists in new paths. Patches to existing files exist but are not applied, and nothing is committed.

| path | what |
|---|---|
| `server/stagecraft/conductor.js` | `step()`: the pure reducer (portfolio, invalidation, scheduler, quota, reveal policy) |
| `server/stagecraft/policy.js` | `wantAt()`: the code policy's want (portfolio-free) |
| `server/stagecraft/sources.js` | the five source adapters and the stage request lexicon |
| `server/stagecraft/score.js`, `quota.js`, `catalog.js`, `config.js` | scoring, buckets and failover, admissibility, constants |
| `server/stagecraft/builders.js` | production rung builders: engine default via `validateSpec`; generated spec; image (needs injected OCR and Content Safety checkers, otherwise never ready); live via `router.decide` + `buildRace` + `revealable` |
| `server/stagecraft/host.js` | per-lesson runner, `STAGECRAFT=off\|shadow\|on` |
| `server/stagecraft/adapters.js` | duplex `BuildIntents` launcher, safety wrap, signals, W2 rows, the kernel's `revealPoint` |
| `server/stagecraft/seam-bridge.js` | what patch P3 adds to the seam |
| `server/stagecraft/kernel-point.js` | P4's turn-state → `RevealPoint` |
| `server/stagecraft/telemetry.js` | the scorecard fold |
| `src/stagecraft/stage.ts`, `reveal.ts`, `controller.ts`, `StagecraftRenderer.tsx` | device stage: never empty, never loading, crossfade after first paint, board twin on failure, clause-timed cue |
| `evals/stagecraft/scripts.mjs`, `sim.mjs`, `run.mjs`, `real-arm.mjs` | E-ST1 to E-ST4 and E-ST6 |
| `tests/stagecraft*.test.mjs` | E-ST0: 31 tests, including 10,000 random input streams and 5,000 stage event streams |
| `docs/design/stagecraft/patches/` | P1, P3, P3b, P4, P5, P6/P8, P9, P10 as `git apply --check`-clean diffs; P2 and P7 as snippets; `CONTEXT-WRITEUP.md` |

### 12.2 Measured table (E-ST1, 240 scripted lessons per arm, `evals/stagecraft/results/sim-2026-10-05*.json`)

"Calibrated" means the E-ST4 build-time distributions replace the bench ones.

| metric | target | W2 today | on demand | **Stagecraft** | calibrated |
|---|---|---|---|---|---|
| right artifact ready when needed | ≥ 0.85 | 0.28 | 0.61 | **0.89** | 0.88 |
| ready, plan-led | ≥ 0.95 | 0.28 | 0.37 | **0.85 ✗** | 0.84 |
| ready, child request (spec or better) | ≥ 0.80 | — | 0.77 | **0.85** | 0.85 |
| ready, misconception contrast | ≥ 0.75 | — | 0.32 | **0.90** | 0.90 |
| "show me" → first frame p95 (modelled clock) | ≤ 4 s | — | 3.30 s | **3.40 s** | 3.40 s |
| wrong / stale / safety-turn / child-speaking / off-topic reveals | 0 | 0 | 0 | **0** | 0 |
| visible failures | 0 | 0 | 0 | **0** | 0 |
| lossless (want stream, off vs on) | 100% | — | — | **9208/9208** | 9208/9208 |
| speculative $ per lesson-hour (wasted) | ≤ 0.15 (≤ 0.08) | 0 | 0.062 (0.036) | **0.081 (0.043)** | 0.081 (0.043) |
| generated pieces per 25 min | ≥ 6 | 1.7 | 7.7 | **20.3** | 20.1 |
| stage moments per 25 min | ≥ 12 | 12.9 | 35.0 | **35.0** | 35.0 |
| specs built per 25 min | 60-150 | 0 | 20.8 | **26.9 ✗** | 26.9 |
| stage active share | 35-55% | 0.57 | 0.85 | **0.85 ✗** | 0.85 |
| median gap between pieces | ≤ 4 min | 58 s | 31 s | **31 s** | 31 s |
| child-initiated share | ≥ 25% | 0 | 0.18 | **0.18 ✗** | 0.18 |

The safety battery (80 lessons with a distress turn) had 0 stage changes and 0 builds during the quarantine. The 429
storm battery (60 lessons) had 0 visible failures and readiness 0.90. E-ST2: hit@3 0.84, but the pNeed priors are
miscalibrated (ECE up to 0.19); the fitted values are in the context write-up. E-ST3 sweeps: λ, the
minimum-readiness threshold, concurrency and half-life are flat around the defaults. Too short a maximum lead (45 s)
and 4 families both cost readiness.

### 12.3 Real arm (E-ST4, $0.95 of the $25 cap)

| what | result |
|---|---|
| 60 specs, 3-wide, production builder | 58/60 usable; p50 5.6 s; **p90 7.9 s (target 6 s ✗)**. `taxila-fast-bg` $0.0013 per spec; `taxila-gpt6-luna` $0.0006 per spec |
| 10 flare-low images | p50 15.5 s, p90 18.5 s; one 429 failed over to gpt-image-2 |
| 12 `buildRace` builds + local gate | 12/12 passed; p50 35.7 s, p90 51.8 s; $0.062 per race |
| reply TTFT, alone → under load | p50 958 → 876 ms; p90 1173 → 1294 ms (n 30 + 30 cannot resolve 50 ms); 0 reply 429s |

### 12.4 Deviations from §0-§11, each measured or argued

1. **Probe, then contrast.** Contrast comes at the point after a misconception is revealed, not at the same point.
2. **Requests share the idea's family.** A request joins its idea's family instead of getting its own.
3. **Just-in-time specs.** Specs launch at a lead of 90 s or less.
4. **Spec launch rule.** Specs use P(ready by deadline + 2.5 s) ≥ 0.15 instead of the strict "lead ≥ p90". A late spec
   still serves a later point at under $0.002.
5. **Live is λ-free.** The LIVE-STUDIO caps govern it.
6. **Family bound.** At most 6 families; the bound of 24 counts speculative candidates only.
7. **Value gain per archetype.** Gain is computed per (family, archetype).
8. **Default spec deployment.** `taxila-fast-bg`, not luna (luna carries the whiteboard).
9. **Hook beat.** Its kinds are animation first; the image rung is wired and calibrated but dormant under λ = 50.
10. **No re-show.** A family already shown in a beat is not shown again after a retire.
11. **Request answered by the idea.** A request is answered when its idea is on stage, whatever the rung.

Each deviation has a context entry (`context/inbox/stagecraft.json`).

### 12.5 Not done or open

- **Patches not applied.** P4's field mapping needs W2-E's review.
- **No real child yet.** Shadow mode in real lessons, E-ST5 (real TTS clause timing) and E-ST7 (learning outcome)
  have not run.
- **Stage too busy.** Stage active share is 0.85: a rest rule is needed.
- **Spec p90.** Needs O-1 or a leaner prompt.
- **Image rung dormant.** Production image checks need an OCR no-text checker and Content Safety.
- **Simulation limits.** The simulator's child is scripted, and pNeed calibration and request rates come from the
  scripts, not from children.
