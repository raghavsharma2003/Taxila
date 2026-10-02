# CONDUCTOR: build spec for the AI that runs a child's whole learning day

**Date:** 2026-10-02 · **Status:** build spec, synthesised from the six conductor research docs and their
architect reviews. **Precedence:** this file overrides the sibling conductor docs wherever they disagree
(§0.2 lists every ruling). `context/decisions.md` overrides this file. **Inputs:**
`orchestration-architecture.md` (C1-C9, R0-R9), `day-cycle.md` (DC1-DC12, AR-1…AR-12) and its `.contracts.ts`/
`.sql`, `student-workspace.md` (W1-W10, SW1-SW18), `school-sync-homework.md` (SS1-SS14, AR-1…AR-10),
`parent-loop.md` (PL1-PL12, PA1-PA23) and its `.contracts.ts`/`.sql`, `observability-evals.md` (O1-O12,
B1-B30 incl. the V9 addendum), `orchestration-architecture.md` R10 (second pass, B1-B11, plus the lock-order probe),
`docs/ARCHITECTURE.md`, `learning-science.md` §6 (rules cited as **LS-n**), `learner/kt-algorithms.md`,
`learner/vibe-temperament.md`, `design/parent-experience.md` (PX), `design/low-end-offline.md`, the repo
`CLAUDE.md`, and `context/`.
**Revision 2 (resume pass, 2026-10-02 17:40 UTC).** Applies orch R10 (B1-B11) and obs V9 (B27-B30) as rulings
X29-X40 (§0.2). The largest fix is the lock order in §3.4: revision 1 locked `child_seq` first, and that deadlocks
5/5 against `complete_job` and `fire_wakeups`. Revision 2 locks it last, and was re-probed in eight race cells with
0/40 deadlocks (`conductor-lock-order-rev2-probe.sh`). Short refs for the second passes: `orch B4` = orch R10 B4,
and `obs B27` = obs V9 B27. They do not collide with the first-pass obs B1-B26, which keep their numbers.
**Revision 3 (gap-fill G1-adaptation-policy, 2026-10-02).** Rules on cross-day adaptation, the owner's "everything
adapts to the student, the vibe, the course and learning ability", which revisions 1-2 specified only as one-liners
(§3.3, §4.4). `adaptation-policy.md` is now written and ruled in as X41-X48 (§0.2). It specifies a pure
`planDay(inputs: PlannerInputs)` with an exact `inputsHash` composition (§3.7); rules R0-R14 with triggers, the
`Fresh<T>` keys each reads, knob, layer, hysteresis, stale fallback and source (§4.4); how `resolveKnob` composes with
`GUARDS`, with a worked example that runs the real function (§3.4); what the `night` fold closes (§3.3); and a
multi-seed rerun of the hysteresis sim (§9.12). `BriefReader` is replaced by `ViewReader`/`ConductorChildView`
throughout. The new pieces are the `AdaptEvent` types (§2.2), `ConductorState.adapt` (§3.1), validator rules V15-V27
(§4.5), invariants I-A1…I-A11 (§9.9), and the `latch_walker` sim persona (§9.10). Every revision-3 edit is marked
"(gap-fill G1-adaptation-policy)".
**Revision 4 (gap-fill G2-content-orchestration-media, 2026-10-02).** `content-orchestration.md` is now written and ruled in as X49-X58 (§0.2):
the `forge.demand` horizons and who emits each (§3.5), the waiter fan-out state machine, delivery of ready modules to
`LessonBrief.preparedModules` and to a live lesson against the 3 s inline budget (§4.6), the review queue's SLA and
ordering, and the media the brief demands: songs (chant + code-composed jingle, Azure first-party), video after
sora-2 (re-verified: retires 2026-10-15, no replacement), and lesson images (CM4, `prefetch` ranking). The
`content-orchestration.sql` header now states the X29 order (`forge_request` → `forge_waiter`/`module_ready`, never
`child_seq`), and its scratch-PG16 probe (30/30) found and fixed four revision-G1 defects: retirement was unreachable,
two lock cycles (publish/supersede, two reviewers), and a child-carrying `two_weeks` demand that aborted the commit.
New pieces: `forge.*` job kinds (§8.2), degrade rows (§9.5), invariants I-F1…I-F16 (§9.9), CM4 defined (§9.12),
owner decisions D-VIDEO, D-ASR, D-SPEECH, D-SONG, D-REVIEW (§10.5). Every revision-4 edit is marked "(gap-fill G2-content-orchestration-media)".
The note on the "(X31)" tag in `content-orchestration.sql` is resolved: the `lib/` prefix check now cites §5.8.
**Tags:** **[V]** checked against the primary source (this session or by the cited sibling doc). **[S]** secondary.
**[U]** unmeasured design default or estimate. **[I]** inference. **[repo]** a fact in this repository.
Short refs: `orch R2.1` = orchestration-architecture.md Architect review R2.1; `dc AR-4`, `ws SW3`, `ss AR-2`,
`pl PA-7`, `obs V2.1` likewise.

**Binding constraints that shaped every ruling** [repo `CLAUDE.md`, `context/decisions.md`]:
- Azure-only compute and AI. Models are restricted to the `azure-only-compute` list: `taxila-realtime`
  (gpt-realtime-2.1), gpt-realtime-2.1-mini, `taxila-brain` (gpt-5.6-sol), `taxila-fast` (gpt-5.6-luna),
  `taxila-codex`, `taxila-image`, `taxila-sora`, gpt-4o-mini-tts, `taxila-transcribe`, text-embedding-3-small.
  (gap-fill G2-content-orchestration-media) Retirement dates, re-checked today against the Foundry schedule [V], live in `allowed_model`: `taxila-sora`
  (sora-2 2025-12-08, Preview) **and `taxila-transcribe` (gpt-4o-transcribe 2025-03-20) both retire 2026-10-15**
  with no listed replacement (X58). Azure AI Speech neural TTS (chant clips, explainer narration) is an Azure
  service, not a Foundry model, and is not yet named on the list (D-SPEECH).
  The task brief lists Claude Opus/Sonnet 5.5 on Foundry. Those are **excluded**: `claude-on-foundry-credits`
  rejected them, and `gpt-5.6-terra` is not on the list either.
- Hosting: ACA `taxila-web` (eastus2, min 1 / max 5, HTTP-scaled). The task brief says Vercel functions in sin1.
  That is **stale**: `hosting-azure-container-apps` superseded it and the Vercel project is paused.
- Neon is in `aws-us-east-1`, reached over a `pg` Pool at 9-12 ms/query (`db-driver-latency-2026-10-02`).
  The "~200 ms to Singapore" premise in several sibling reviews is stale.
- Compliance is deprioritised. The child-safety floor stays: never deny being an AI, Childline 1098 /
  Tele-MANAS 14416, no companion register, and the safeguarding hand-off.

---

## 0. What this spec decides

### 0.1 The design in twelve lines

1. **The Conductor is code.** Each child has one virtual actor: a state row, a mailbox, and a pure reducer
   `decide(state, event, ctx) → {state', commands}`. Language models only *propose* typed objects (a day plan, a
   letter's wording, engine params), and code validates them. "An AI orchestrates everything" is met because every
   judgment is model-proposed or model-worded, while ordering, limits, budgets and safety are code (orch C1).
2. **One event log per child** (`student_event`). Per-child sequence numbers are assigned under a row lock, so
   read order equals commit order (orch R2.1). Agents report back with events and never call each other (C6).
3. **All outbound work leaves through an outbox** (job, wakeup, notification, day_plan, decision_log) written
   in the same transaction as the state change. Small SQL functions make the hand-offs atomic: ingest, firing a
   wakeup, finishing a job, creating a commitment. **Every multi-table writer locks `child_seq` last** (X29,
   measured). Replay never commits (X31).
4. **Hosts.** `taxila-web` serves requests and inline work of ≤ 10 s. A new **`taxila-worker`** ACA app (min 1,
   not HTTP-scaled, direct Neon connection) runs the leader-elected ticker, the dirty-set step loop and the job
   lanes. From M1, a separate **`taxila-observer`** app holds the realtime observer sockets (X37). ACA scheduled
   jobs run the detectors that must outlive the worker. Nothing runs on Vercel.
5. **Every slot has a voice lane** (`realtime | realtime_mini | cascade | tap`). The tier's monthly budget per
   lane is enforced by the plan validator and the cost governor. At ₹299, with AI + infra held to 60% of revenue,
   the realtime teacher fits about **16 minutes a month** [I/U, §9.5], so the price-to-minutes call is an owner
   decision that blocks public launch.
6. **One sitting is one call.** Homework help runs first on **cascade** (luna text → leak pre-check → TTS). The
   lesson's teach, teach-back and transfer segments go on the granted voice lane. Retrieval and practice are tap.
   The day-end recall folds into the wrap.
7. **Day and clock.** `clockPhase` is computed from the routine and the calendar and never stored. `mode` is
   stored (`free | in_lesson | paused | safety_hold`). `learningDay = localDate(now − 4 h)` is used everywhere.
8. **No nagging by construction.** No class exists for absence, streak, come-back or offer messages. A capped
   class is capped by an insert into a slot table (the insert is the cap). Anchor reminders are on-device local
   notifications.
9. **The "little VM per student" is logical:** Postgres rows keyed by `child_id`, a private Blob prefix, a
   device replica, and the actor. Isolated compute exists per Forge job, never per child (orch C9, ws W1).
10. **Homework is pick-first.** DI Read on the page, the child picks one item, keys come only from the kit or a
    code solver, and everything else is `process_only`. The help never contains the answer: the cascade lane
    makes the leak guard a pre-check.
11. **The parent agent coaches the parent's role.** It is a worker under the Conductor that proposes and never
    writes the plan. Every claim it makes carries a fact id. Safety parent notices settle first, and any case
    where a family member may be implicated goes to a human.
12. **Two observability planes.** The Neon ledger is never sampled and is the record for replay, cost and evals.
    OTel → App Insights is for ops. Gates are code predicates with negative controls. The north-star metric is
    delayed retrieval success, reported with its coverage.

### 0.2 Conflicts between the sibling docs, and the ruling

| # | topic | positions | ruling | why |
|---|---|---|---|---|
| X1 | ticker host | dc AR-7: loop inside `taxila-web` with an advisory lock. orch R1: dedicated `taxila-worker` | **`taxila-worker`**, leader-elected with a session `pg_try_advisory_lock` on the **direct** (unpooled) endpoint | `taxila-web` is HTTP-scaled and gets SIGKILL 30 s after SIGTERM on scale-in [V ACA]. Neon's pooler drops session advisory locks and LISTEN/NOTIFY [V Neon] |
| X2 | plan storage | dc AR-3: drop `day_plan`, history = events. orch R5: `day_plan` versioned store | **`day_plan` versioned**, written only inside the Conductor commit. `conductor_state` holds `{planDay, planVersion}`. Shadow LLM plans live in job results | the parent must be able to see the morning version, and the dashboard reads rows, not a fold |
| X3 | day phase | two `DayPhase` enums (orch §4.2, dc §3.1) | **`clockPhase` (computed) × `mode` (stored)** (§3.2) | one writer per fact; clock phases are a function of time, not state |
| X4 | event log | `student_event` vs `day_event` | **`student_event` only**. `day_event`, `notification_log` and `night_job` are dropped | `day_event` had no idempotency key; `night_job` had no unique key |
| X5 | conductor commit | plpgsql jsonb parser (orch §7.1) vs a JS transaction (orch R6) | **JS interactive transaction** over the `pg` Pool. Small SQL functions stay where several writers must be atomic with ingest (`ingest_event`, `fire_wakeups`, `complete_job`, `create_commitment`) | ≈ 6 queries × 10 ms; a new command kind is a code change, not a migration |
| X6 | queue | home-grown vs pg-boss (orch R6) | **home-grown at M0** with the R2 fixes. pg-boss (MIT, Node ≥ 22.12, PG ≥ 13, transactional send [V this session]) is the reversal, decided by CM9 | `complete_job` must ingest `job.done` atomically and be fenced by attempt; that is our transaction, not pg-boss's |
| X7 | Azure OpenAI Batch | orch §5.4, pl §2 use it | **no Batch in v1** | gpt-5.6 is not in the Batch model table; late jobs are not expired, so a fallback double-bills [V]; it saves ≈ $0.04/child-month (orch R3.4) |
| X8 | report idempotency | `report.weekly:{child}:{isoWeek}:{ledgerHash}` | **`parent.letter:{child}:{isoWeek}`**, with the data cutoff fixed at send − 30 h | the hash minted a new paid job for every lesson in the window (orch A9, pl PA-11) |
| X9 | live codegen ("a game is built while she teaches") | orch §5.2 race | **never live**. Live work is T1 engine params and T2 scene DSL. A library miss writes `forge_request`, and T3 is built offline into human review | human review before any generated code reaches a child (ARCHITECTURE §1.4) makes the race pure spend (orch R3.1) |
| X10 | night prep | dc §9 per-child pipeline | **cut.** The plan is computed on open (pure code, < 50 ms [U]). A topic-level library prefetch covers the next two weeks of syllabus | per-child speculation is wasted on children who don't open, and night planning creates a thundering herd (dc AR-9, orch R3.2) |
| X11 | daily parent note | dc DC9: WhatsApp daily replaces the milestone | **pull-only (in-app) in v1**. A daily push is v2, as a parent-requested class outside the cap that self-pauses after 5 unread | 5-7 a week cannot fit a ≤ 2/week cap, and the Meta category risk is real (dc AR-6.6) |
| X12 | anchor reminder | server push via Notification Hubs | **on-device local notification**, re-synced when the routine changes | FCM deprioritises silent high-priority messages [V], so "ignored" is unobservable; works offline (dc AR-6.8) |
| X13 | Blob region | ws: Central India. ss AR-3: captures in Central India | **eastus2 for all v1 storage**. Measure capture upload p90 from India (M-SS7). If it misses the 6 s box budget, move only the ephemeral `captures` container | the hot copy is in the US, so there is no residency gain, and every read would cross twice (ws SW5) |
| X14 | realtime observer | obs V8: M0. pl PA-3: later | **M1, read-only**, for metering and the staleness SLI, on its own app (X37). The Director keeps client-applied `session.update` until OM16 is measured | M0 cohort ≤ 30; device usage bounded by wall time is enough. Moving `session.update` server-side is a decision for later |
| X15 | DEK crypto-shred | ws W4 | **deferred.** Hard delete, a 7-day Neon history window, 7-day Blob soft-delete, and the parent promise "removed now; backups expire within 7 days" | a DEK inside the PITR'd database is resurrected by restore (ws SW1); `dek-in-pitr-database` is rejected |
| X16 | rainbow reducer versions | orch §10 | **dropped.** Use `upgradeState()` plus a deploy freeze from 18:00 to 21:30 IST (X37) | a child in `paused`/`safety_hold` never reaches `night`, so two reducers would live forever |
| X17 | daily cap scope | orch: lesson minutes. dc: all slots | **all slots**. Homework has its own sub-cap inside the cap | dc wins (orch R5) |
| X18 | `wrapAt` vs `hardStopAt` | both | **both kept**; the Director wraps at the earlier one, at a natural stop, never mid-item | they have different owners (governor/limits vs bedtime) |
| X19 | lesson session length | DC4 20/25/35/45 | **session length, not realtime length.** Realtime minutes come from the tier budget | dc AR-1 |
| X20 | evening reflection, morning preview | dc §5.4, §5.7 | **folded into the wrap; preview cut** in v1 | reflection on rt-2.1 alone cost ≈ $7/month; no evidence that preview moves outcomes at this age |
| X21 | voice PTM | pl §7.1: 2 × 10 min a month | **1 included per month, 8 min**. Text PTM is capped at 300 turns per child per month | rt-2.1 parent lane ≈ $0.10-0.15/min (pl PA-8) |
| X22 | voice note | realtime "render a script" vs TTS | **TTS (gpt-4o-mini-tts), rendered lazily on tap** | the audio must be the linted text; WhatsApp template headers can't carry audio [V Meta] |
| X23 | S-class parent alert | pl §8.3: immediate | **settle, then send; human queue whenever a family member may be implicated**. At M0 *every* S notice goes to the human | late naming of the perpetrator is common (pl PA-1) |
| X24 | Content Safety on 100% of turns | obs §7.6 | **5% stratified sample** plus every turn a code predicate flags | Hindi is not a trained language, so its signal is advisory; ≈ $0.34/child-month (obs B14) |
| X25 | HMAC child ref in telemetry | obs §3.2 | **dropped**; telemetry is content-free and unlinkable after erasure | lesson ids and traceparents join anyway (obs V2.9) |
| X26 | `school_mirror` table | ss §8.3 mutable table | **a fold inside `conductor_state.state.school`**, fed by `school.pointer_vote` events | second writer beside the Conductor (ss AR-4 R4) |
| X27 | struggle push (`struggleSooner`) | pl §8.1 | **deferred to M2**; L is a letter line in v1 | pressure risk without a measured benefit (pl PA-20) |
| X28 | face blur, test-paper analysis, alias pipeline, transcription-as-evidence | ss §3-§6 | **v2**; v1 photos give help only, never evidence | none of their parameters can be fitted before real use (ss AR-6) |
| X29 | lock order | revision 1 §3.4: `child_seq` first. orch R2.4 / B1: `child_seq` last | **`child_seq` is the last row any multi-table writer locks** (full writer table in §3.4). Treat SQLSTATE `40P01` like `40001`: retry the batch from a fresh lease read | measured: `child_seq` first deadlocks **5/5** against `complete_job` and **5/5** against `fire_wakeups`. `child_seq` last gives 0/5 against both (orch R10.1), and the revision-2 shape gives 0/40 across 8 cells (§3.8) |
| X30 | `conductor.step` | revision 1 §8.2: a queued job keyed `step:{child}:{toSeq}` | **not a job kind.** `child_seq.pending_since` is the dirty set: a plain read, then `step()` with the lease as the mutex | about 20 jobs per lesson, most of them skipped on the lease, and a constant key would run only once ever (orch B4) |
| X31 | replay | orch §4.6: full replay from seq 0 for tests, audits and upgrades | **replay never commits.** It gets a reader with no `tx`/`commit` handle (I-R9). Upgrades go through `upgradeState` | after retention prunes outbox rows, a committing replay re-runs consolidations and re-sends letters (orch B5) |
| X32 | idle hang-up trigger | orch R3.3 / revision 1 §4.6: "2 turns with no kit-relevant child utterance" | **non-child audio only**: VAD commits whose transcript is empty or low-confidence, or 90 s with no child speech after a hand-over. Off-topic child speech gets the Director's redirect shape | off-topic chat and thinking aloud are the rapport moments, and a 6-8 year old does them constantly (orch B6) |
| X33 | what `safety_hold` locks | orch R4/R7.4 / revision 1 §3.2, §8.5: only `critical` locks the app; `high` keeps lessons running | **every incident → `safety_hold`** until the safeguarding protocol owner rules on a severity split (D-SAFE). The split is a [U] proposal, not a rule | the Conductor never decides safety content, and the safeguarding hand-off is product floor (orch B7) |
| X34 | brief record in `decision_log` | orch R2.8: the brief value on every row | **`brief_snapshot(child_id, digest)`**, content-addressed; `decision_log` keeps the digest. Retention follows the replay window (90 d [U]) | ≈ 15 KB per child-day, ≈ 550 GB/year at 100k children [U] (orch B8) |
| X35 | job wake-up | orch R1: `NOTIFY job_ready` | **poll**: 1 s while busy, backing off to 5 s when idle. `pg_notify` is only a hint, sent from the direct connection inside the committing transaction | the pooler has no LISTEN/NOTIFY [V Neon]. A 1 s poll also keeps Neon from scaling to zero (it suspends after 5 min idle [V]), so price that in CM2 (orch B9) |
| X36 | dormant children's clock | every child gets `day_start` and night wakeups | **after 14 days with no `app.opened`, recurring wakeups are not re-armed.** Parent-chosen ones (the weekly letter) stay; the next open re-arms the rest | ≥ 200k wake events a day at 100k accounts with no child on the other end (orch B10) |
| X37 | observer host (amends X14) | X14: M1 on `taxila-worker` | **M1, on a separate `taxila-observer` ACA app** scaled on live-lesson count, with no leader. Deploys freeze 18:00-21:30 IST (this also amends X16 and §3.12) | a worker revision roll would drop every observer at once, and job-loop contention skews staleness timestamps (obs B29) |
| X38 | `modelCall` cleanup order | obs V2.1 `finally` | **settle the reservation first, in its own `try`**. The ledger insert is best-effort with an `obs.ledger_write_failed` counter, and the original error is re-thrown | a throwing insert leaked the reservation and hid the real error (obs B27) |
| X39 | Director turn commit | obs V2.8: `lesson_state … for update` | **optimistic**: read `lesson_state.version`, hold no lock across model calls, commit `where version = $v`, and re-fold the newer turn on conflict | otherwise every live lesson pins a pooled Neon connection through its classify/compile calls at the 19:00-21:00 peak (obs B28) |
| X40 | M0 instruction-lag signal | none until the observer (M1) | **a provisional client-clock OM16 at M0**: `session.update` apply time vs the next `response.created`. Aggregate only, untrusted, replaced at M1 | M0 would otherwise have no child-facing staleness signal (obs B30) |
| X41 | the Conductor's learner surface (gap-fill G1-adaptation-policy) | revisions 1-2: an untyped `BriefReader`/`ChildBrief` | **`ConductorChildView` read through a recording `ViewReader`**: every field `Fresh<T>`, one writer per key, `MAX_AGE_H` per writer, declared fallbacks that never fire a rule. `ChildBrief` stays the Director's prompt packet; the Conductor never reads it | untyped reads cannot be staleness-checked or replay-recorded per key (adaptation-policy §2) |
| X42 | where adaptation runs (G1) | §3.3/§4.4 one-liners | **three moments only**: `planDay` (pure over `PlannerInputs`), `foldNight` (once per learning day, with catch-up), and the `learner.params_refit` / `wheel_spin` events. Never a model call, never inside a lesson | determinism (I-C6); the Director owns in-lesson adaptation (policy AD1) |
| X43 | `inputsHash` (G1) | §3.7 "deterministic in `inputsHash`", composition unspecified | **`'pi1:' + sha256(RFC 8785 JCS(quantised PlannerInputs))`**. Raw `now` and `asOf` are excluded; the anchor is floored to 15 min, voice to 30 s, pL to .01, η to .05 (policy §3.3) | otherwise "deterministic" cannot be tested, and a raw clock mints a plan version per minute |
| X44 | arbitration (G1) | vibe R6 item 54: no rule between vibe, KT, interest and the plan | **`resolveKnob`, with precedence safety > limits > budget > KT > SRL > vibe > interest**. The constraint layers come from the **same pure predicates the `GUARDS` run**, so the guards are a no-op on planner output (I-A10). Budget may constrain only `laneMix`, and every lane domain keeps `tap` (`registerConstraint`, I-A2) | `resolveKnob` drops a constraint that empties the domain. Unregistered, an empty budget domain lets realtime through (shown in `adaptation-worked-example.mjs`) |
| X45 | one bad close (G1) | §3.3 revision 2: a strained/tired close → success-first **and shorter segments** tomorrow | **one bad close → success-first only**. Segments shorten only while the R1 latch is on (≥ 3 of the last 4 closes bad; off after 3 fine) | the one-close rule latches 99.9% of steady children and flips 9.9×/8 weeks; 3/4, r=3 flips 0.49× (n = 8 seeds × 2,000) |
| X46 | late sittings (G1) | fragment: one-shot test over all sittings, gap ≥ .30 | **nightly over a 16-close ring, ≥ 4 late and ≥ 4 early, on at gap ≥ .40, off < .20** | evaluated nightly, the old thresholds give 23.5% false latch; the new ones 15.9%, with a 91.3% hit |
| X47 | pace (G1) | §4.4 "KT η, θ may change pace" | **R6**: eligible at ≥ 30 opps over ≥ 3 skills; → 2 after 2 refits at η ≥ +.5; → 0 after 3 at η ≤ −.5; back to 1 after 2 inside ±.25; B1 ≤ 1; held when the refit is stale | hysteresis cuts oscillation about 3× against a bare ±.5 threshold; down is costlier if wrong, so it needs more evidence |
| X48 | `vibeClose` retention (G1) | §2.2: a re-plan input, retention unspecified | **≤ 16 closes and ≤ 14 days in `adapt.closes`; never a parent surface or the routine card (V27); erased with the child**. R1/R2 are gated on CM-A0 (label κ ≥ .6) | vibe's default `session_adaptive` mode keeps nothing behavioural across sessions; this is the one bounded exception, already implied by §2.2 |
| X49 | `forge.demand` horizons (gap-fill G2-content-orchestration-media) | §3.5 "proposed"; G1 SQL let any horizon carry a child | **`in_lesson`/`next_lesson` carry a child and a `forge_waiter`; `two_weeks`/`term` are child-less aggregate demand, even when the Conductor emits them** (content-orchestration §2) | a child-carrying `two_weeks` demand hit the waiter's horizon check and aborted the whole commit [M F7c] |
| X50 | the live 3 s path (gap-fill G2-content-orchestration-media) | §8.2: `forge.spec`/`forge.scene` inline on web, ≤ 3 s | **T1 params and T2a template fills in a lesson are the Director's own `generate_now`** (ARCHITECTURE §1.2), charged to `child_content`; Forge gets them afterwards through `forge.demand{in_lesson}` with `need:'promote'` | a Conductor step plus a job and a publish cannot fit inside a 1.9-3.4 s model call [Me genui]; a live fill is not a Forge result, so rule 2 holds |
| X51 | mid-lesson delivery (gap-fill G2-content-orchestration-media) | §4.6: "through `brief.refresh`/`module.ready` on its existing poll" | **the Director's turn-boundary read `forge_ready_for(child, lastPoll)`; no mid-lesson `brief.refresh` for modules.** `brief.refresh` builds `preparedModules` at start and on resume. A mounted module is never replaced (I-F9) | one publish × N children of `brief.refresh` is the thundering herd §3.8 forbids; the Director's turn is already off the critical path |
| X52 | never live (gap-fill G2-content-orchestration-media) | MO §6.1 `build_race` live | **no T3/G2, image, video, audio or chant build starts with horizon `in_lesson`**: downgraded to `next_lesson` (I-F10) | G2 P50 12-15 min, about 1 build per codex deployment; images at 4 RPM company-wide (MO R1, R2) |
| X53 | Forge lock order (gap-fill G2-content-orchestration-media) | G1 SQL header: `child_seq → conductor_state → forge_request` | **`forge_request` rows in ascending `library_key`, then child-owned forge rows; never `child_seq`.** The commit sorts its `forge.demand` batch; `forge_publish` locks {new, superseded} in one ordered statement; `review_decide` locks `forge_request` first | controls 5/5 deadlocks in each of three cells, G2 0/5 in each, commit ‖ publish 0/10 with no lost waiter (content-orchestration §4.4) |
| X54 | review capacity (gap-fill G2-content-orchestration-media) | §8.5: "review queue ordered by `demand_count`" | **review seconds are admitted by `forge.admit` against named reviewers' capacity before the SLA; queue order = due-within-2 h, then ln(1 + demand) × horizon weight, then due date** (`review_sla`, `review_next`) | ≈ 30 G2 misses/day at 300 children × 600-900 s = 5-7.5 h/day against one reviewer (MO §7.4) [I] |
| X55 | video (gap-fill G2-content-orchestration-media) | §8.2 `forge.video`: sora-2 "[not re-checked]" | **re-checked [V]: sora-2 2025-12-08 retires 2026-10-15, replacement "—", the only Foundry video model; retired = `410 Gone`, not extendable. M3 video is code:** `explainer@1` (performed, clip, seek-rendered MP4), Manim in ACA dynamic sessions for Class 8-9 maths, stills-with-motion for phenomena | code-rendered media is exact on text and numbers; sora drew 3+3 under "3+4=7" [Me AV] |
| X56 | songs (gap-fill G2-content-orchestration-media) | CONDUCTOR: none | **v1 = `chant-track@1` (Azure Speech Swara clips on a client beat) + v1.5 `jingle@1` (a reviewed, codex-composed tune template under the chant). Sung render rejected. Eligibility is the predicate `verbatim_sequence` (LS rule 24); every kit passes the recitation lint L1-L5 and a native-ear lang key** | no first-party model sings (n = 18, SR §4) [Me]; lint 11/11 golden cases [M] |
| X57 | lesson images and CM4 (gap-fill G2-content-orchestration-media) | X10 "topic-level prefetch of the next two weeks of syllabus"; CM4 undefined | **`prefetch` ranked by cohort demand Σ P(child on topic, day d)·γ^d within the nightly image quota; CM4/CM4b/CM4-img computed from `module_run.source` (Director-only writer)** | calendar-only prefetch plateaus at 86%; demand ranking 99% at 300 images/night [sim, `image-prefetch-sim.py`] |
| X58 | model retirement dates (gap-fill G2-content-orchestration-media) | `allowed_model.allowed_until` null for most rows | **every row carries the Foundry date; `verify` fails at < 30 days (I-F13); `taxila-transcribe` must be re-pinned before 2026-10-15 (D-ASR)** | gpt-4o-transcribe 2025-03-20 retires 2026-10-15 [V] and gates the TTS WER and chant ASR checks |

---

## 1. System

### 1.1 Diagram

```
 TRIGGERS                         CONDUCTOR (one virtual actor per child; code)                 AGENTS (workers; results return as events)
 ────────                         ─────────────────────────────────────────────                 ──────────────────────────────────────────
 device: app.opened, slot.*,  ─┐   ┌──────────────────────────────────────────────┐   job rows   ┌ Planner: code (M0) · luna shadow (M2)
   capture.committed, sync ops │   │ step(): lease token → events seq>cursor       │ ───────────► ├ Forge: spec(T1)/scene(T2) inline · image/
 Director: lesson.*, skill.*,  ├──►│   → decide() per event (pure; Scheduler lib:  │              │   video/T3 build offline → review → library
   teacher.promise, homework.* │   │     clockPhase, FSRS due, calendar, jitter)   │              ├ Letter writer (parent.letter: WeekStory→luna
 parent: settings, pause,      │   │   → guards in authority order                 │              │   wording→lints→render; TTS on tap)
   consent, proposals, PTM     │   │   → ONE transaction: CAS state, day_plan,     │              ├ Memory consolidator (luna, cited)
 school: pointer votes, tests ─┤   │     jobs, wakeups, notifications, decision_log│              ├ Parent agent (intake, PTM text/voice; proposes)
 clock: fired wakeups          │   │   → has_more? loop                            │              ├ Homework pipeline (DI Read → pick → ladder)
 safety: incident (pre-empts) ─┘   └───────┬─────────────────┬─────────────────────┘              └ Notifier (intents → mayNotify → ACS/WhatsApp)
                                           │ LessonBrief      │ read models (ParentBrief, device docs)       │
                                           ▼                  ▼                                              ▼
              DIRECTOR (per lesson; owns the minute)   WORKSPACE / SYNC (outbox up, ETag docs down)   student_event (append-only)
              /api/lesson/turn on taxila-web           Memory · KT ledger (own writers)
              ⇄ device ⇄ Azure realtime (WebRTC)  ◄── observer WS on taxila-observer (M1: metering, staleness; X37)
                     │
   SAFETY MONITOR + SAFEGUARDING PROTOCOL (outside Conductor authority) ──► safety.incident → mode=safety_hold; gates every parent notice
   COST GOVERNOR + ADMISSION (budget, conductor_usage, rate_bucket) ◄── every model call and every voice block reserves here ──► cost_ledger
```

Five rules make it safe (orch §2, R5, R10):
1. **One writer per fact.** Only the Conductor writes `conductor_state` and `day_plan`. Agents write their own
   tables plus events.
2. **Agents never call agents.** A Forge result reaches the Director only through a `brief.refresh` or the
   `module.ready` read model.
3. **The Director owns the minute; the Conductor owns the day.** The Conductor touches a lesson only at
   boundaries (start, natural stop, wrap, safety). `compile()` stays the single assembler.
4. **Authority order** (orch §5.9), as ordered guard functions: safety protocol > consent > parent controls >
   law/policy caps (quiet hours, message caps, sleep margins) > cost governor > Conductor plan > Director choice
   > vibe knobs. A lower layer never re-enables what a higher one blocked.
5. **One lock order.** `child_seq` is the last row any multi-table writer locks (X29, measured; the writer table is
   in §3.4). A new writer that cannot follow the order does not ship.

### 1.2 Components

| component | owns (only writer) | runs on | model | key contract |
|---|---|---|---|---|
| Conductor (`server/conductor/`) | `conductor_state`, `day_plan`, `decision_log`, `brief_snapshot`, outbox rows | inline attempt on `taxila-web`; the dirty-set step loop on `taxila-worker` (X30) | none | `decide()` §3.4 |
| Scheduler (library inside `decide`) | nothing (pure) | in-process | none | `clockPhase`, `learningDay`, FSRS due list, jitter §3.2 |
| Planner | proposals only | code: inline. LLM: worker (M2, shadow) | luna (shadow) | `DayPlan` + validator §4.5 |
| Director (`server/director/`, existing) | `lesson`, `turn`, `turn_trace`, homework session state | `taxila-web` per turn | luna classify; realtime voice | `LessonBrief` in, `lesson.*` events out §4.6 |
| KT (`server/learner/`, existing) | `kt_*` / today `evidence`, `skill_state` | `taxila-web` turn path; `kt.refold` on worker | none (labels from the classifier) | KT writes take the workspace row lock §5.6 |
| Memory consolidator | `memory`, `rel_state` | worker | luna | `memory.consolidate:{lessonId}` |
| Forge | `forge_request`, `forge_transition`, `forge_artifact`, review queue, library Blob (+ consumes `forge_waiter`, writes `module_ready`) | worker (`forge.*` §8.2) + ACA jobs (seek render) + ACA dynamic sessions (T3, Manim; M3). Live T1/T2a fills are the Director's, not Forge's (X50) | luna, sol, codex, image, Azure Speech; sora only until 2026-10-15 (X55) | `library_key` (build) + `identity_key` (serving family) (gap-fill G2-content-orchestration-media) |
| Letter writer / parent agent | `weekly_letter`, `parent_conversation/turn`, worries, commitments | worker (letter, inbound); web (PTM turns) | luna; TTS; realtime (1 PTM/month) | WeekStory, ParentBrief, claim-checker §7 |
| Homework pipeline | `capture*`, `homework_*` | web (child waiting, job-row backed), worker (cleanup) | DI Read, luna | pick-first §6 |
| Notifier | `notification`, `notify_slot` | worker | none (templates) | `mayNotify()` §4.10 |
| Cost governor + admission | `budget`, `conductor_usage`, `rate_bucket`, `cost_ledger` | in-process library | none | reserve/settle §9.5 |
| Workspace/sync | `workspace`, `device*`, `sync_op_seen`, notebook, shelf | web | none | `/api/ws/sync` §5.5 |
| Safety monitor + protocol | `incident`, safeguarding queue | web (per turn) + human | classifier | `safety.incident*` events; `safetyParentNotice()` §7.6 |
| Observability | `model_call`, `turn_trace`, `eval_*`, `metric_daily` | everywhere; nightly as ACA jobs | none | `modelCall()` §9.2 |

---

## 2. The student event log

### 2.1 Envelope

```ts
// shared/conductor/events.ts
export type ChildId = string; export type Ulid = string;
export interface EventEnvelope<E extends StudentEvent = StudentEvent> {
  id: Ulid;                 // minted ONCE at the edge per real-world fact
  childId: ChildId;         // from the authenticated session + picked profile, never trusted from the body
  seq?: number;             // per-child, assigned by ingest_event() under the child_seq row lock (§2.4)
  occurredAt: string;       // producer clock, offset-corrected and clamped (§5.5); ordering uses seq
  receivedAt?: string;
  source: 'device' | 'director' | 'parent' | 'school' | 'clock' | 'agent' | 'safety' | 'system';
  idemKey: string;          // derived from the fact (§3.10); unique per child
  causationId?: string; correlationId: string; traceparent?: string;
  schemaV: 1;
  body: E;
}
```

### 2.2 Event catalogue (the union; zod-validated at ingest)

```ts
export type Lane = 'realtime' | 'realtime_mini' | 'cascade' | 'tap';
export type EndedBy = 'completed' | 'time_limit' | 'cap' | 'bedtime' | 'child_left' | 'idle' | 'network' | 'safety' | 'outage';
export type StudentEvent =
  // device / session (pre-profile device events NEVER enter a child's log: orch R7.8)
  | { type: 'app.opened'; device: 'web' | 'android'; replicaId: string; cachedPlanVersion?: number }
  | { type: 'app.closed'; reason: 'profile_switch' | 'background' | 'idle' }
  | { type: 'slot.shown'; planDay: string; planVersion: number; slotId: string }          // freezes the slot (V10)
  | { type: 'slot.started' | 'slot.completed' | 'slot.skipped'; slotId: string; kind: SlotKind; minutes?: number; endedBy?: EndedBy }
  | { type: 'practice.completed'; setId: string; packId: string; items: number }          // outcomes re-graded server-side (§5.5)
  | { type: 'session.reassign'; scope: { lessonId?: string; packId?: string }; toChild: ChildId; byGuardian: string }
  // Director (boundary facts only; turn-level data stays in turn / turn_trace / KT ledger)
  | { type: 'lesson.started'; lessonId: string; slotId?: string; topicId: string;
      kind: 'live' | 'practice' | 'diagnostic' | 'homework'; lanes: Lane[]; resumeOf?: string }
  | { type: 'lesson.ended'; lessonId: string; reason: EndedBy; minutes: number; voiceSec: Partial<Record<Lane, number>>;
      skillsTouched: string[]; outcomeDigest: LessonOutcomeDigest }
  | { type: 'skill.milestone'; skillId: string; to: 'learned_today' | 'mastered' | 'due' | 'wheel_spin'; evidenceSeq: number }
  | { type: 'teacher.promise'; promiseId: string; what: { kind: 'game' | 'topic' | 'revisit'; ref: string }; by: string }
  | { type: 'module.requested'; lessonId: string; slotId?: string; topicId: string; key: IdentityKeyFields & { engine: string; specHash: string };
      need: 'promote' | 'near_line' | 'next_lesson'; needBySec?: number }   // (gap-fill G2-content-orchestration-media): content-orchestration §3
  | { type: 'homework.item_picked'; hwSessionId: string; itemId: string; via: 'tap' | 'voice' | 'typed' }
  | { type: 'homework.utterance_blocked'; hwSessionId: string; itemId: string; attempt: 1 | 2; fellBackToShape: boolean }
  | { type: 'homework.session_ended'; hwSessionId: string; itemsAttempted: number; stuckItems: number; minutes: number }
  // parent (settings row + event in ONE transaction, orch §6)
  | { type: 'parent.setting_changed'; key: ParentSettingKey; value: unknown; by: 'owner'; settingsVersion: number }  // v1 roles: owner + viewer; viewers cannot change settings
  | { type: 'parent.pause'; until: string } | { type: 'parent.resume' }
  | { type: 'parent.consent_changed'; purpose: Purpose; granted: boolean; consentVersion: number }
  | { type: 'parent.focus_requested' | 'parent.schedule_proposed'; proposalId: string; detail: ProposalDetail }
  | { type: 'parent.worry_recorded'; worryId: string; kind: string; topicIds: string[] }
  | { type: 'parent.commitment_created' | 'parent.commitment_closed'; commitmentId: string; status?: 'fulfilled' | 'missed' }
  | { type: 'parent.care_note_set' | 'parent.care_note_expired'; noteId: string; effect: 'gentle_mode' }
  | { type: 'parent.home_activity_feedback'; isoWeek: string; feedback: HomeFeedback }
  | { type: 'parent.rollover_confirmed'; academicYear: string; classLevel: number }
  // school sync (§6.2-§6.7)
  | { type: 'capture.committed'; captureId: string; pages: number; by: 'child' | 'parent'; via: 'photo' | 'share' }
  | { type: 'capture.raw_deleted'; captureId: string }
  | { type: 'school.pointer_vote'; subject: string; chapterId: string; cls: 'child' | 'parent' | 'artefact' | 'calendar'; ref: string }
  | { type: 'school.test_announced'; subject: string; on: string; chapters: string[]; via: 'parent' | 'child' }
  | { type: 'school.day_override'; date: string; kind: 'off' | 'holiday' | 'school_day' }
  // clock
  | { type: 'clock.wakeup'; reason: WakeReason; wakeupId: string }
  // agents
  | { type: 'plan.proposed'; planDay: string; planner: 'llm'; jobId: string; resultRef: string }   // shadow only until CM3 clears it
  | { type: 'job.done'; jobId: string; kind: JobKind; resultRef?: string }
  | { type: 'job.failed'; jobId: string; kind: JobKind; error: string; final: boolean }
  | { type: 'notify.delivered' | 'notify.failed' | 'notify.opened' | 'notify.opted_out'; notificationId: string }
  // safety (emitted by the safety monitor / protocol only)
  | { type: 'safety.incident'; incidentId: string; severity: 'high' | 'critical'; category: SafetyCategory }
  | { type: 'safety.incident_updated'; incidentId: string; familyImplicated: 'yes' | 'no' | 'unknown'; category: SafetyCategory }
  | { type: 'safety.cleared'; incidentId: string; by: string }
  | { type: 'child.wellbeing_statement'; statementId: string; cls: WellbeingClass; askedToShare: 'yes' | 'no' | 'not_asked' }
  // system
  | { type: 'budget.threshold'; scope: 'child_day' | 'child_month' | 'global'; pct: 80 | 100 }
  | { type: 'workspace.state_changed'; from: WorkspaceState; to: WorkspaceState }
  // child agency + learner-model writers (gap-fill G1-adaptation-policy; full types + IDEM keys in
  // adaptation.contracts.ts §3; fold targets and reducer responses in adaptation-policy.md §6.1)
  | AdaptEvent;
export type AdaptEvent =
  | { type: 'child.choice_made'; offerId: string; context: ChoiceContext; options: string[]; picked: string;
      via: 'tap' | 'voice'; lessonId?: string; forDay?: string }                       // idem choice:{offerId}
  | { type: 'child.plan_stated'; lessonId: string; cue: CueId; action: { kind: 'topic' | 'game' | 'review'; ref: string } }
  | { type: 'child.goal_set'; goalId: string; isoWeek: string; skillIds: string[]; offered: string[];
      byWeekday?: number; mcii?: { obstacle: ObstacleId; cue: CueId; action: ActionId } }   // ≤ 1 active (V23)
  | { type: 'child.goal_closed'; goalId: string; status: 'met' | 'not_met' | 'dropped' | 'expired'; by: 'child' | 'system'; evidenceSeq?: number }
  | { type: 'child.thread_opened' | 'child.thread_closed'; threadId: string; skillId?: string; how?: 'answered' | 'skipped' | 'expired' }
  | { type: 'child.optin_changed'; feature: 'mcii' | 'standard' | 'own_reminders'; on: boolean; version: number }
  | { type: 'learner.dependency_flag'; lane: 'lesson' | 'homework'; on: boolean; cause: 'cri' | 'toh';
      windowEnd: string; refVersion: string; nEligible: number; nHelp: number; jobId: string }   // transitions only
  | { type: 'learner.params_refit'; kind: 'eta_theta' | 'format'; paramsVersion: string; jobId: string };  // R6 trigger

export type WakeReason = 'day_start' | 'night' | 'replan' | 'debounce_flush' | 'job_deadline' | 'weekly_letter'
  | 'commitment_due' | 'care_note_expiry' | 'safety_settle' | 'safety_escalate' | 'resume_window_end'
  | 'pause_end' | 'dormancy_check';
export interface LessonOutcomeDigest {              // computed by the Director's close step from the ledger
  itemsAttempted: number; independentCorrect: number; probesPassed: string[];
  misconceptionsOpened: string[]; misconceptionsResolved: string[];
  vibeClose: 'fine' | 'strained' | 'tired';         // Conductor re-plan input ONLY; never reaches a parent line (pl PA-6)
  teachBackDone: boolean;
  // (gap-fill G1-adaptation-policy) OutcomeDigestAdd: solo counts feed R7; the rest audit brief delivery
  soloPlanned: number; soloDone: number; soloOk: number; soloDeclined: number;
  prereqChecks: Array<{ skillId: string; result: 'pass' | 'fail' }>;
  representationUsed?: { skillId: string; family: FormatFamily };
  openerDelivered: OpenerKind | 'none';
}
```

### 2.3 Payload rules

- **Typed payloads with no free-text fields.** Child words live only in the content tables (`turn`,
  `homework_item`) under parent-visibility rules. A lint in the W2 map test fails any event schema with an
  unconstrained `string` field outside an id/enum allow-list (ws SW18).
- **References, not copies.** KT evidence stays KT's. Events carry ids and derived milestones (orch C3).
- **Identity.** `childId` is resolved from the guardian session plus the picked profile. Device events before a
  profile is picked go nowhere near a child's log (inherited law: identity is a child id, never a device).

### 2.4 SQL

```sql
-- db/migrations/002_conductor.sql (part 1: the log)
create table child_seq (
  child_id uuid primary key references child(id) on delete cascade,
  last bigint not null default 0,
  pending_since timestamptz);                         -- set on ingest, cleared by the commit that folds it
create index child_seq_dirty on child_seq (pending_since) where pending_since is not null;

create table student_event (
  child_id uuid not null references child(id) on delete cascade,
  seq bigint not null,                                -- per child, commit-ordered (orch R2.1)
  id text not null, type text not null, source text not null, idem_key text not null,
  occurred_at timestamptz not null, received_at timestamptz not null default now(),
  causation_id text, correlation_id text not null, traceparent text,
  body jsonb not null,
  primary key (child_id, seq), unique (child_id, idem_key));
create index student_event_type on student_event (child_id, type, seq desc);

-- the ONLY way to append. Row lock on child_seq is held to commit, so seq N+1 cannot commit before N.
create or replace function ingest_event(p_child uuid, p_id text, p_type text, p_source text, p_idem text,
  p_occurred timestamptz, p_corr text, p_cause text, p_body jsonb, p_trace text default null)
returns bigint language plpgsql as $$
declare s bigint;
begin
  if exists (select 1 from student_event where child_id = p_child and idem_key = p_idem) then return null; end if;
  insert into child_seq (child_id) values (p_child) on conflict do nothing;
  update child_seq set last = last + 1, pending_since = coalesce(pending_since, now())
   where child_id = p_child returning last into s;
  insert into student_event (child_id, seq, id, type, source, idem_key, occurred_at, correlation_id, causation_id, body, traceparent)
  values (p_child, s, p_id, p_type, p_source, p_idem, p_occurred, p_corr, p_cause, p_body, p_trace)
  on conflict (child_id, idem_key) do nothing;        -- a concurrent duplicate leaves a harmless gap
  return s;
end $$;
```

Ingest paths: (a) server code calls `ingest_event` inside the same transaction as its own domain write (parent
settings, lesson close, capture commit). The domain write comes first and `ingest_event` is the last locking
statement, so `child_seq` is the last lock (X29). (b) The device posts `{k:'event'}` ops through `/api/ws/sync` (§5.5).
(c) The ticker fires wakeups (§3.9). After any ingest, the request makes **one inline `step()` attempt** (≤ 10 s
budget) and otherwise relies on the worker. Retention: no fold-and-delete in v1 (volume is KB per child);
monthly partitioning of the ledger tables at > 5k DAC (obs V3).

---

## 3. The Conductor decision loop

### 3.1 State

```ts
// shared/conductor/state.ts
export type Mode = 'free' | 'in_lesson' | 'paused' | 'safety_hold';
export interface ConductorState {
  childId: ChildId; stateV: number;              // upgradeState(state, fromV) migrates; no rainbow versions (X16)
  tz: string; learningDay: string;               // localDate(now − 4 h) of the last processed event
  band: Band; tier: TierId;
  mode: Mode; modeSince: string; hold?: { incidentId: string; level: 'high' | 'critical' };
  pauseUntil?: string;
  plan?: { day: string; version: number; source: 'code' | 'llm'; inputsHash: string;   // inputsHash: skip a no-change day_start (G1)
           shownSlotIds: string[]; startedSlotIds: string[] };
  resumable?: { lessonId: string; until: string };   // network endings: 15 min (orch R7.6)
  limits: ParentLimits;                          // folded from parent.setting_changed (parent_setting is the source)
  routine: RoutineFacts;                         // anchor, backup window, bedtime, school hours, home-adult name
  school: SchoolFold;                            // pointers per subject, testWindows, offDays (§6.7)
  promises: Array<{ id: string; kind: string; ref: string; by: string }>;
  pending: { replanAfter?: string; jobs: Record<string, { kind: JobKind; idem: string }> };
  consent: Record<Purpose, boolean>;
  counters: { lastActiveDay?: string; activeDays7: number };
  adapt: AdaptMemory;                            // (gap-fill G1-adaptation-policy) cross-day adaptation memory, below
}
// (gap-fill G1-adaptation-policy) adaptation.contracts.ts §2; written only by decide (writer 'conductor.fold')
export interface AdaptMemory {
  foldedDay?: string;                            // last learningDay foldNight closed: idempotence + catch-up (I-A6)
  closes: CloseLite[];                           // appended on lesson.ended; last 16, ≤ 14 days
  shortSeg: RuleLatch; lateSitting: RuleLatch;   // R1, R2 (vibe)
  reviewBacklog: RuleLatch; soloUp: RuleLatch;   // R3 (kt), R7 (srl)
  paceBudget: { value: 0 | 1 | 2; since?: string; agreeDays: number; backRun: number };   // R6, moved on params_refit
  repSwitch: Record<string, { day: string; from: FormatFamily; to: FormatFamily }>;      // R4, 30 d, ≤ 8 LRU
  prereqChecked: Record<string, { day: string; result: 'pass' | 'fail' }>;               // R5, 14 d, ≤ 8 LRU
  choice?: ChoiceLite; goal?: ChildGoal;         // R11 (latest unconsumed), R13 (≤ 1 active)
  optIns: Partial<Record<'mcii' | 'standard' | 'own_reminders', { on: boolean; version: number }>>;
  depFlag: { lesson: boolean; homework: boolean; tohHigh: boolean; since?: string };      // mirror of learner.dependency_flag
  lastHomePick?: { isoWeek: string; activityId: string; kind: HomeActivityKind };         // R12
  routineCardDay?: string;                       // R14 cooldown
}
export interface CloseLite { day: string; localHour: number; vibeClose: 'fine' | 'strained' | 'tired'; endedBy: EndedBy;
  minutes: number; plannedMin: number; soloPlanned: number; soloDone: number; soloDeclined: number }
export interface RuleLatch { on: boolean; since?: string; fineRun: number }
```

Not in state, by design: mastery (read through the `ConductorChildView` at decision points; KT owns it; gap-fill
G1-adaptation-policy replaced `ChildBrief` here), minutes used
(`conductor_usage`, written by admission), notification counts (the outbox slots are the cap), vibe session
state (never persisted, vibe §4.1; only the 3-valued `CloseLite.vibeClose` crosses sessions, bounded by X48).
Target size < 8 KB. **`adapt` < 1.5 KB at maximum fill, packed** (gap-fill G1-adaptation-policy): measured at
1,016 B with the tuple codec vs 4,343 B as plain objects (`adaptation-state-size.py`, ring 16). So `adaptCodec.ts`
packs it on commit and unpacks it in `upgradeState`, and I-A9 gates the size. Fast-changing scalars are columns, so
jsonb rewrites don't inflate WAL (ws SW9).

```sql
-- db/migrations/002_conductor.sql (part 2: actor, decisions, plans, usage)
create table conductor_state (
  child_id uuid primary key references child(id) on delete cascade,
  state_v int not null, version bigint not null default 0, cursor_seq bigint not null default 0,
  mode text not null default 'free' check (mode in ('free','in_lesson','paused','safety_hold')),
  learning_day date, plan_day date, plan_version int,
  state jsonb not null,
  lease_token uuid, lease_until timestamptz, updated_at timestamptz not null default now());

create table decision_log (                          -- the Conductor's turn_trace; replay input record (orch R2.8)
  child_id uuid not null references child(id) on delete cascade, version bigint not null,
  at timestamptz not null default now(), now_used timestamptz not null,
  state_v int not null, build_sha text not null, from_seq bigint not null, to_seq bigint not null,
  brief_digest text,                                 -- → brief_snapshot (X34): the recorded ViewReader map; no value copy per row
  arms text[] not null default '{}',
  decisions jsonb not null,                          -- [{seq, rules[], blocked:[{cmd, guard, reason}]}]
  commands jsonb not null, correlation_id text not null,
  primary key (child_id, version));

create table brief_snapshot (                        -- content-addressed (X34): only the ConductorChildView keys the step read,
                                                     -- as { "key[.sub]": {value, asOf, src, stale} } (G1: X41; was ChildBrief)
  child_id uuid not null references child(id) on delete cascade,   -- per child, so erasure and the W-map test cover it
  digest text not null, value jsonb not null, created_at timestamptz not null default now(),
  primary key (child_id, digest));                   -- insert … on conflict do nothing (a new row, never a lock wait)
-- retention: delete snapshots no decision_log row inside the replay window (90 d [U]) references; decision_log ages
-- out on the same window

create table day_plan (                              -- versioned; written ONLY inside the Conductor commit (X2)
  child_id uuid not null references child(id) on delete cascade, day date not null, version int not null,
  source text not null check (source in ('code','llm')), inputs_hash text not null,
  reason text not null,                              -- 'first_open' | 'replan:<cause>' | 'resume' | 'parent_change'
  plan jsonb not null, adopted_at timestamptz not null default now(),
  primary key (child_id, day, version));

create table conductor_usage (                       -- written by admission (§9.5), read by the Conductor
  child_id uuid not null references child(id) on delete cascade, learning_day date not null,
  cap_min int not null, used_min real not null default 0, reserved_min real not null default 0,
  hw_used_min real not null default 0, voice_sec jsonb not null default '{}',   -- per lane, actually used
  primary key (child_id, learning_day));
-- reserve one 5-min block at lesson start and at each block boundary (dc AR-5 R4): the update IS the cap
-- update conductor_usage set reserved_min = reserved_min + 5
--  where child_id=$1 and learning_day=$2 and used_min + reserved_min + 5 <= cap_min returning *;
```

### 3.2 Clock phase × mode

```ts
// server/conductor/clock.js (pure; never reads Date.now: obs §4.3)
export type ClockPhase = 'morning' | 'at_school' | 'recovery' | 'learning_window' | 'wind_down' | 'night' | 'free_day';
export const learningDay = (nowUtc: Date, tz: string) => localDate(new Date(nowUtc.getTime() - 4 * 3600_000), tz);
export function clockPhase(r: RoutineFacts, l: ParentLimits, nowUtc: Date, cal: DayKindLookup): ClockPhase {
  const t = localTime(nowUtc, r.tz);                 // NEVER the server clock (eastus2 runs UTC; dc AR-6.3)
  const day = learningDay(nowUtc, r.tz);
  const off = cal.kind(day) !== 'school_day';        // weekend, national holiday, parent "off", school.day_override
  const winFrom = off ? l.allowedFrom : maxTime(l.allowedFrom, addMin(r.schoolEnd, r.recoveryMin));
  const winTo = minTime(l.allowedTo, addMin(r.bedtime, -60));     // no new teaching in the last 60 min (DC7)
  if (t >= addMin(r.bedtime, -30) || t < r.wakeTime) return 'night';
  if (t >= winTo) return 'wind_down';
  if (off) return t >= winFrom ? 'free_day' : 'morning';
  if (t < r.schoolStart) return 'morning';
  if (t < r.schoolEnd) return 'at_school';
  return t < winFrom ? 'recovery' : 'learning_window';
}
```

Allowed-hours defaults per band (dc AR-11): B1 → 20:00, B2 → 20:30, B3 → 21:00, B4 → 21:30. Each is still
bounded by bedtime − 30, and the stricter of parent and band wins.

**Mode machine** (stored; transitions only in `decide`):

```
 free ──lesson.started──► in_lesson ──lesson.ended──► free  (reason 'network' → resumable 15 min)
 any  ──parent.pause────► paused ──(pause_end wakeup | parent.resume)──► free   (effective at next day boundary
                                                                                 if pressed mid-lesson; pl PA-21 C5)
 any  ──safety.incident──► safety_hold ──safety.cleared (protocol/human only; never a timer)──► free
```

**Allowed actions** (reducer guards; tested as invariants):

| clockPhase \ mode | free | in_lesson | paused | safety_hold |
|---|---|---|---|---|
| morning, at_school, recovery | no prompts. A child-initiated open gets the rest or "school time" screen, plus a tap burst only inside allowed hours | Director owns the screen | rest card ("aaj chhutti") | hold screen for **every** incident until D-SAFE rules (X33): warm, 1098/14416, no "suspended" language, reveals nothing on a shared phone. Letting `high` incidents keep lessons running under protocol monitoring is a [U] proposal to the safeguarding owner, not a rule |
| learning_window, free_day | lesson start (cap + admission + voice budget), homework, bursts | one lesson; no new learning notifications | same | same |
| wind_down | no new topic or lesson start; a tap review burst and finishing an open wrap are allowed | the Director wraps at `hardStopAt` | same | same |
| night | calm rest screen only | hard stop already passed | same | same |
| background jobs | all kinds | low-priority only for this child | consolidation and erase only | safety-protocol commands only |
| parent notifications | per §4.10 | none of the learning classes | safety + account only | protocol decides |

### 3.3 Triggers and reducer responses

| trigger | reducer response (typical) |
|---|---|
| `app.opened` | if no plan for `learningDay`: build the **code plan now** and commit it as `day_plan` v1 (`first_open`). The device has already painted from its cached plan in < 300 ms (orch R7.9). If `resumable` is live: emit `brief.refresh{resumeOf}`. Drain due wakeups (piggyback). If the child was dormant (no open for ≥ 14 days), re-arm the recurring wakeups (X36) |
| `slot.shown` / `slot.started` | add the slot to `shownSlotIds` / `startedSlotIds`: it is frozen for the day (V10) |
| `lesson.started` | mode → `in_lesson` |
| `lesson.ended` | mode → `free`. `network` → `resumable` until +15 min. Enqueue `memory.consolidate:{lessonId}`. Debounce a re-plan by 5 min over **unshown** slots. Run detectors (§7.6). Append one `CloseLite` to `adapt.closes` (gap-fill G1-adaptation-policy). A `strained`/`tired` close makes the next opener success-first **only**; segments shorten only while the R1 latch is on (X45). Never a parent line |
| `skill.milestone` | `wheel_spin` → re-plan unshown slots: R5 (a prerequisite with pL < .4 at depth ≤ 3, not checked in 3 days) first, else R4 (a different representation family, not switched in 3 days) (LS-10; gap-fill G1-adaptation-policy); `mastered` on a parent-asked skill → a milestone candidate (§4.10) |
| `learner.params_refit` (G1) | `eta_theta` → evaluate R6 against `kt.eta` (recorded read) and move `adapt.paceBudget` by its hysteresis; `format` → nothing (read at plan time) |
| `learner.dependency_flag` (G1) | mirror into `adapt.depFlag`; R7/R12 act at the next night fold / weekly intent |
| `child.choice_made` / `goal_set` / `goal_closed` / `optin_changed` (G1) | fold into `adapt.choice` (only with a `forDay`) / `adapt.goal` / `adapt.optIns`; an in-lesson choice with no `forDay` is the Director's and is only counted |
| `teacher.promise` | append to `promises`; the validator must honour it (V11) |
| `parent.setting_changed` | apply limits at once. A lowered cap or an earlier bedtime emits `brief.refresh`, which the Director applies at the next segment boundary (dc AR-5 R8) |
| `parent.consent_changed{granted:false}` | cancel queued jobs of that purpose and set `cancel_requested` on running ones (orch R2.6) |
| `parent.pause` | mode → `paused` (at the next day boundary if a lesson is open); schedule a `pause_end` wakeup |
| `parent.focus_requested` / `schedule_proposed` | validate. Adopt into **unshown** slots or the next day, and answer the proposal inline (§7.7) |
| `school.pointer_vote` / `test_announced` / `day_override` | fold into `school`; re-plan unshown slots; open a test window (§4.8) |
| `capture.committed` | if a sitting is open, the Director's homework mode picks it up; otherwise add a `homework_help` slot at the head of the next sitting |
| `clock.wakeup` | `day_start`: refresh the code plan only if `inputsHash` changed (X43). `night`: close the learning day with `foldNight` (gap-fill G1-adaptation-policy, adaptation-policy §7.2). It runs once per `learningDay` (`adapt.foldedDay`) and does five things: (1) trims the CloseLite ring to 16 closes and 14 days; (2) evaluates the R1, R2, R3, R7 and R14 latches in `RULES` order, counting **closes, not days**, and resetting R1/R2/R14 on an empty ring; (3) expires TTLs: `repSwitch` 30 d, `prereqChecked` 14 d, a choice past its `forDay`, a goal past its ISO week; (4) recounts `lastActiveDay`/`activeDays7`; (5) re-arms tomorrow's `day_start`/`night` only if `counters.lastActiveDay` is within 14 days (X36). It never builds tomorrow's plan (X10). A missed `night` is caught up by the first event of a later learning day, once. `weekly_letter`: enqueue `parent.letter`. `commitment_due`, `safety_settle`, `safety_escalate`, `resume_window_end`, `pause_end`, `care_note_expiry`: as named |
| `job.done` / `job.failed{final}` | clear `pending.jobs`; on a final failure take that kind's fallback (§8.2) |
| `safety.incident` | **pre-empts everything**: mode → `safety_hold` (every severity until D-SAFE rules: X33); cancel child-facing queued jobs; hand to the protocol. The Conductor never decides safety content |
| `safety.incident_updated` | re-evaluate `safetyParentNotice()` (§7.6) |
| `budget.threshold` | tomorrow's plan uses lower lanes; the child is never told about money |

### 3.4 `decide` and `step`

```ts
// server/conductor/decide.js — pure. Inputs only: (state, event, ctx). No Date.now, Math.random, env, I/O.
// (gap-fill G1-adaptation-policy, X41) `view` replaces the untyped `brief: BriefReader`. ViewReader, ConductorChildView,
// Fresh<T>, MAX_AGE_H and FALLBACK are in adaptation.contracts.ts §1; stale keys return the fallback, which fires no rule.
export interface DecideCtx { now: Date; cfg: ConductorConfig; view: ViewReader; arms: Assignments; cal: DayKindLookup }
export interface DecideOut { state: ConductorState; commands: Command[]; rulesFired: string[];
  blocked: Array<{ cmd: Command; guard: string; reason: string }>;
  viewRead: Record<string, { value: unknown; asOf: string; src: string; stale: boolean }> }   // → brief_snapshot
export function decide(state, event, ctx): DecideOut { /* handlers → candidate commands → GUARDS (authority order) */ }

export const GUARDS = [safetyGuard, consentGuard, parentControlGuard, policyCapGuard, governorGuard];  // ordered
// A guard may drop or narrow a command, never add or widen one. Every drop is logged in decision_log.blocked.
// (G1, X44) Guard ↔ layer: safetyGuard = safety; consent/parentControl/policyCap = limits; governorGuard = budget. Each
// guard's predicate lives in shared/conductor/policy.ts, and planDay builds its resolveKnob constraints from the SAME
// predicates (through registerConstraint, I-A2). So GUARDS are a no-op on planner output (I-A10); a narrowing is
// adopted (guards win) and audited as 'guard_narrowed_plan'.
```

**Knob arbitration inside the planner** (gap-fill G1-adaptation-policy, X44; `resolveKnob` in
`adaptation.contracts.ts` §5, rules in §4.4 below). For each knob of each slot:
1. Constraints from safety, then limits, then budget are intersected. They come from the guards' own predicates and
   pass `registerConstraint`: only those three layers may constrain; budget only `laneMix`; every lane domain keeps
   `tap`; no domain is empty.
2. The highest-layer *permitted* preference (`MAY_PROPOSE`) sets the value, projected into the domain. Layer order:
   KT > SRL > vibe > interest.
3. A lower layer moves it only inside the owner's declared slack.

Every drop is logged as a `RuleFiring.blockedBy` reason: `layer_not_permitted`, `projected_into_domain` or
`outside_owner_slack`. Preferences are pushed in `RULES` order, which breaks ties.

*Worked example* (adaptation-policy §5.4; `adaptation-worked-example.mjs` runs it through the real `resolveKnob`, 17/17
expectations, 2026-10-02). Aarav, B1, age 6. Day 3 of a 5-day Maths test window. R1 is latched (strained, strained,
fine, tired). Realtime left: 600 s over 8 expected active days = 75 s today. He picked "shapes" yesterday. Results:
- `segmentMinutes`: KT 20 with slack [12, 20], vibe R1 14 → **14**.
- voice rung: limits {realtime, cascade, tap} ∩ budget {cascade, tap} → realtime is *projected* to **cascade** for
  the whole lesson (I-R7).
- `topic`: KT test chapter 4 beats interest ch. 6 (`outside_owner_slack`) → `choiceAck{honoured:false}`.
- `pace`: **1** (B1 cap; R6 ineligible at 12 opps).
- `successFirst`: **on** (vibe).
- `foundationShare`: **.175** ((.2 + .15) × .5).
- `soloRounds`: **2**.
- opener: `standard_retrieval`.

Segments: retrieve 3 tap · teach 4 cascade · play 3 tap · teach-back 3 cascade · wrap 1 cascade. All five guards then
pass the `plan.adopt` unchanged (I-A10).

```js
// server/conductor/step.js
export async function step(childId, { maxEvents = 50 } = {}) {
  const token = randomUUID();                                   // per invocation, never per worker (orch R2.5)
  const lease = await one(`update conductor_state set lease_token=$2, lease_until=now()+interval '30 seconds'
      where child_id=$1 and (lease_until is null or lease_until < now())
      returning version, cursor_seq, state_v, state`, [childId, token]);
  if (!lease) return { skipped: true };
  let hasMore = true;
  let version = lease.version, cursor = lease.cursor_seq;
  let state = upgradeState(lease.state, lease.state_v);         // X16
  while (hasMore) {
    const now = clock.now();                                    // one recorded `now` per batch (decision_log.now_used)
    const events = await q(`select * from student_event where child_id=$1 and seq>$2 order by seq limit $3`,
                           [childId, cursor, maxEvents]);
    const view = recordingViewReader(childId, now);             // records every key read → brief_snapshot (X34, X41)
    const commands = [], decisions = [];
    for (const ev of events) {
      const out = authorityClass(ev.type) ? decideOrFailSafe(state, ev, ctx(now, view))    // §3.6
                                          : decide(state, ev, ctx(now, view));
      state = out.state; cursor = ev.seq;
      commands.push(...out.commands);
      decisions.push({ seq: ev.seq, rules: out.rulesFired, blocked: out.blocked });
    }
    // CasFailed, 40001 and 40P01 (the deadlock backstop: X29) abort the whole batch with nothing written. The caller
    // re-runs step() from a fresh lease read, at most 3 times; after that pending_since stays set for the dirty-set loop.
    ({ version, hasMore } = await commit(childId, token, version, state, cursor, commands, decisions, view, now));
  }
}
// Replay (§3.11) is a different function with a different handle: replay(childId, fromSeq, reader) folds and returns
// {state, commands} for comparison. It is never given tx/commit, so it cannot write (X31, I-R9).
```

```js
// server/conductor/commit.js — one interactive transaction over the pg Pool (X5). db.tx() is new in server/db.js.
// LOCK ORDER (X29, measured): conductor_state → [forge_request → forge_waiter] → job → wakeup → notification /
// notify_slot → child_seq LAST. Inserts of brand-new rows (day_plan, decision_log, brief_snapshot) wait on nothing.
// Revision 1 took child_seq FIRST and deadlocked 5/5 against complete_job (job → child_seq) and fire_wakeups
// (wakeup → child_seq) (orch R10.1).
// Correctness rests on the child_seq row lock plus has_more, not on conductor_state (orch B2). A competing step()
// holds no other lock: its single-statement lease UPDATE either finds the lease held and returns `skipped`, or waits
// briefly on this transaction's conductor_state row and then finds it held. So it can never join a cycle.
export const commit = (childId, token, expected, state, cursor, commands, decisions, view, now) => tx(async (t) => {
  // 1. CAS on version AND this invocation's lease token. The conductor_state row stays locked until COMMIT.
  const r = await t.one(`update conductor_state set state=$4, state_v=$5, cursor_seq=$6, mode=$7, learning_day=$8,
        plan_day=$9, plan_version=$10, version=version+1, updated_at=now()
      where child_id=$1 and version=$2 and lease_token=$3 returning version`,
    [childId, expected, token, state, STATE_V, cursor, state.mode, state.learningDay, state.plan?.day, state.plan?.version]);
  if (!r) throw new CasFailed();                                // loser re-runs from the fresh snapshot; nothing written
  await forgeDemand(t, childId, commands);                      // 'forge.demand' → forge_file_demand(), batch SORTED by
                                                                //  libraryKey; child id passed only for in_lesson/next_lesson (X49, X53) (gap-fill G2-content-orchestration-media)
  await insertJobs(t, childId, commands);                       // multi-row VALUES, on conflict per §3.8
  await cancelJobs(t, childId, commands);                       // match (child_id, kind, idem_key)
  await upsertWakeups(t, childId, commands);
  await insertNotifications(t, childId, commands);              // slot insert = cap (§4.10.3)
  await insertPlans(t, childId, commands);                      // 'plan.adopt' → day_plan row (new row)
  const digest = await insertBriefSnapshot(t, childId, view.recorded());  // the ViewReader map (X41); on conflict do nothing (X34)
  await t.q(`insert into decision_log (child_id, version, now_used, state_v, build_sha, from_seq, to_seq,
               brief_digest, arms, decisions, commands, correlation_id) values (...)`, [/* … digest … */]);
  // 2. LAST lock: child_seq. An ingest in flight holds it, so this UPDATE waits and re-reads `last`. An ingest that
  //    starts after this point waits for COMMIT, then finds the lease released and runs its own inline step().
  const m = await t.one(`update child_seq set pending_since = case when last > $2 then pending_since else null end
      where child_id=$1 returning (last > $2) as has_more`, [childId, cursor]);
  // 3. The lease decision touches the conductor_state row this transaction already holds, so it adds no new lock.
  await t.q(`update conductor_state set lease_token = case when $3 then lease_token end,
        lease_until = case when $3 then now() + interval '30 seconds' end
      where child_id=$1 and lease_token=$2`, [childId, token, m.has_more]);
  return { version: r.version, hasMore: m.has_more };           // no lost wake-ups between steps
});
```

**Every writer's lock sequence** (X29). A new writer goes through code review against this table, and G3 runs the
lock-order probe as a fixture:

| writer | locks, in order |
|---|---|
| domain write + `ingest_event` (parent settings, lesson close, capture commit, notifier status) | its own domain row → `child_seq` |
| Conductor commit | `conductor_state` → (`forge_request` → `forge_waiter`) → `job` → `wakeup` → `notification`/`notify_slot` → `child_seq` → (`conductor_state` again, already held) |
| `complete_job` | `job` → `workspace` (read; `FOR SHARE` in a job's own final write transaction: ws SW6) → `child_seq` |
| `fire_wakeups` | `wakeup` (SKIP LOCKED, a batch of ≤ 500, possibly many children) → each child's `child_seq` |
| `create_commitment` | `child_seq` as the mutex, first, then **only inserts of new rows**. It locks no other existing row, which is the one allowed exception |
| sync `applyBatch`, Director turn, `kt.refold` | `workspace` (`FOR UPDATE`, the KT lock: §5.6) → ledger inserts → `child_seq` (through `ingest_event`) |
| Forge functions (`content-orchestration.sql`) | `forge_request` (several: ascending `library_key`; publish locks {new, superseded} in one statement) → `forge_waiter`/`module_ready`/`review_item`. `review_decide`: `forge_request` → the artefact's items in id order. `review_next`, `review_escalate`, `forge_sweep`: single statements with `SKIP LOCKED`. Never `child_seq` (gap-fill G2-content-orchestration-media): X53, probe D1-D4 |
| erasure | (1) `→ erasing` as a single-statement transaction; (2) take the lease; (3) the cascade delete, which is unordered by nature. It runs only after the fence, and retries on `40P01` |

### 3.5 Commands

```ts
export type Command =
  | { kind: 'plan.adopt'; day: string; version: number; source: 'code' | 'llm'; inputsHash: string; reason: string; plan: DayPlan }
  | { kind: 'enqueue'; job: JobSpec }
  | { kind: 'cancel'; jobKind: JobKind; idemKey: string; reason: string }      // running jobs → cancel_requested
  | { kind: 'wakeup'; at: string; reason: WakeReason; dedupe: string }          // `at` already jittered (§3.9)
  | { kind: 'notify'; intent: NotifyIntent; dedupe: string; capScope?: CapScope }
  | { kind: 'brief.refresh'; lessonId?: string; resumeOf?: string }
  | { kind: 'forge.demand'; libraryKey: string; identityKey: string; key: LibraryKeyFields;
      meta: { tier: ForgeTier; buildClass: string; modality: Modality };
      horizon: 'in_lesson' | 'next_lesson' | 'two_weeks' | 'term'; childScoped: boolean;   // false for two_weeks/term/promote (X49)
      lessonId?: string; slotId?: string; wantedBy: string; predicted?: number }  // (gap-fill G2-content-orchestration-media): content-orchestration §2-§3
  | { kind: 'audit'; code: string };
```

### 3.6 Authority events and poison handling

- **Authority classes** (above the governor in §1.1 rule 4): `safety.*`, `parent.consent_changed`,
  `parent.pause`, and `parent.setting_changed` when it lowers a limit.
- If `decide` throws three times on an authority event, `decideOrFailSafe` runs a minimal, dependency-free
  handler. Safety → `safety_hold`. Consent revoked → cancel that purpose's jobs. Pause → `paused`. Limit
  lowered → apply it. The actor then stays in that conservative state until an operator replays (orch R2.9).
- Non-authority poison events (three throws) are recorded as `quarantined` in `decision_log`, the cursor
  advances, and ops is paged. They stay in the parent export.

### 3.7 Deliberation points

| point | when | proposer | adopted if |
|---|---|---|---|
| day plan | `app.opened` with no plan; `day_start` if `inputsHash` changed | **code planner** `planDay(inputs: PlannerInputs)`: pure, deterministic in `inputsHash` (X43, I-A4) | always valid by construction; checked by the validator anyway |
| re-plan | 5 min debounce after `lesson.ended`, `test_announced`, `pointer_vote`, a limit change or wheel-spin | code planner over **unshown** slots | validator |
| LLM day plan (M2) | night, only for children active in the last 7 days, jittered over 22:30-04:30 IST | luna, `plan.day.llm` job, **shadow** | never adopted until CM3 (pre-registered micro-RCT on delayed outcomes, LS-37) clears it; then only if it passes the validator |
| weekly intent | Sunday cutoff | code (the home-activity pick, focus weights) | validator |

The plan validator rules are listed in §4.5. A rejected proposal logs `plan.rejected{rule}`, which feeds the planner eval.

**The planner seam** (gap-fill G1-adaptation-policy; adaptation-policy §3, types in `adaptation.contracts.ts` §8):

```ts
const base  = buildBase(state, event, ctx);                 // pure: state, cfg, cal, recorded now, arms
const keys  = planKeys(base);                               // pure: which view keys this plan may read (≤ 40 skills)
const view  = readAll(ctx.view, keys);                      // recorded ViewReader reads; `asOf` dropped, `stale` kept
const inputs: PlannerInputs = { ...base, view };
const inputsHash = 'pi1:' + sha256hex(jcs(quantise(inputs)));            // RFC 8785 bytes (X43)
if (state.plan?.day === base.day.learningDay && state.plan.inputsHash === inputsHash) return;   // nothing changed
const { plan, firings } = planDay(inputs);                  // PURE over `inputs`: no reader, clock, I/O or randomness
```

`PlannerInputs` = `{ v, build{plannerSha, cfgDigest, thresholdsV}, child{band, vibeBand, ageYears, tier},
day{learningDay, dayKind, reason, anchor{kind, localHHMM floored to 15 min}}, window, limits{capMin, hwSubCapMin,
restDay, careEffect}, mode, school{testWindows (sorted), pointers}, homework (sorted), promises (sorted),
frozen{planVersion, slots[{slotId, digest}]}, usage (whole minutes), voice{leftSec (30 s), activeDaysLeftEst},
adapt (packed), view{key: {value (quantised: pL .01, η .05, ratios .1), src, stale}}, arms }`. Excluded from the hash:
the raw `now`, every `asOf`, `homeAdultName`, all parent text and `ChildBrief`. G3 checks that two processes give
byte-equal plans for equal inputs, that excluded-field mutations leave the hash unchanged, and that included-field
mutations change it. A planted `Date.now()` and an unsorted array are the negative controls.

### 3.8 Jobs

```sql
-- db/migrations/002_conductor.sql (part 3: jobs)
create table job (
  id bigint generated always as identity primary key,
  kind text not null, child_id uuid references child(id) on delete cascade, idem_key text not null,
  input jsonb not null, lane text not null check (lane in ('fast','slow','sandbox')),
  priority smallint not null default 2,              -- 0 = child waiting
  status text not null default 'queued' check (status in ('queued','running','retry','done','failed','cancelled','dead')),
  run_after timestamptz not null default now(), not_before_lesson_end boolean not null default false,
  deadline_at timestamptz, cancel_requested boolean not null default false,
  budget_micro_usd bigint not null, spent_micro_usd bigint not null default 0,   -- TOTAL across attempts (orch R3.5)
  attempts int not null default 0, max_attempts int not null default 5,
  lease_sec int not null default 60, lease_until timestamptz, worker text,
  result_ref text, last_error text, correlation_id text not null, causation_id text, traceparent text,
  created_at timestamptz not null default now(), finished_at timestamptz,
  unique (kind, idem_key));
create index job_ready on job (lane, priority, run_after) where status in ('queued','retry');
create index job_expired on job (lane, lease_until) where status = 'running';
create index job_child on job (child_id);

-- enqueue (inside the Conductor commit); duplicates are no-ops unless explicitly revived (orch R2.7)
-- insert … on conflict (kind, idem_key) do update set status='queued', attempts=0, run_after=now(), last_error=null
--   where job.status in ('dead','cancelled') and excluded.input->>'revive' = 'true';

-- claim (worker): ready jobs, or running jobs whose lease expired; attempts is the fencing token
with c as (
  select id from job
   where lane = $1
     and ((status in ('queued','retry') and run_after <= now()) or (status = 'running' and lease_until < now()))
   order by priority, run_after
   for update skip locked limit $2)
update job j set status = 'running', attempts = j.attempts + 1, worker = $3,
       lease_until = now() + make_interval(secs => j.lease_sec)
  from c where j.id = c.id
returning j.*;

-- finish + tell the Conductor in ONE transaction (orch R2.3), fenced by attempt, and by erasure (ws SW6)
create or replace function complete_job(p_job bigint, p_attempt int, p_ok boolean, p_result text,
                                        p_error text, p_final boolean) returns boolean language plpgsql as $$
declare j job%rowtype; v_status text;
begin
  select * into j from job where id = p_job and attempts = p_attempt and status = 'running' for update;
  if not found then return false; end if;                        -- zombie attempt: changes nothing
  if j.child_id is not null and exists (select 1 from workspace w where w.child_id = j.child_id and w.state = 'erasing')
    then update job set status = 'cancelled', finished_at = now() where id = p_job; return false; end if;
  v_status := case when j.cancel_requested then 'cancelled' when p_ok then 'done'
                   when p_final or j.attempts >= j.max_attempts then 'dead' else 'retry' end;
  update job set status = v_status, result_ref = p_result, last_error = p_error, lease_until = null,
         finished_at = case when v_status in ('done','dead','cancelled') then now() end,
         run_after = case when v_status = 'retry'                 -- `else run_after`: orch R2.3's version wrote NULL
                          then now() + make_interval(secs => least(power(2, attempts), 300) * (0.8 + random() * 0.4))
                          else run_after end                       -- into a NOT NULL column (caught on scratch PG16)
   where id = p_job;
  if j.child_id is not null and v_status in ('done','dead') then
    perform ingest_event(j.child_id, gen_ulid(), case when v_status = 'done' then 'job.done' else 'job.failed' end, 'agent',
      'job:' || j.id || ':' || v_status, now(), j.correlation_id, 'job:' || j.id,
      jsonb_build_object('jobId', j.id::text, 'kind', j.kind, 'resultRef', p_result, 'error', p_error, 'final', v_status = 'dead'));
  end if;
  return true;
end $$;
```

**Verified** (`conductor-substrate-pg16-2026-10-02`, n = 1 run): `ingest_event`, `fire_wakeups`, `complete_job`, the
claim, the usage reserve, the rate-bucket headroom, the notify slots and the commit's has_more/CAS pattern were applied
to a scratch Postgres 16.14 after `001_core.sql` and exercised. Results: a duplicate ingest returns null and adds no row.
Firing twice fires once, with 0 orphan wakeups (I-R2). A zombie attempt returns false. A successful completion → `job.done`; cancel_requested → `cancelled` with no event;
exhausted retries → `dead` + `job.failed`. An `erasing` workspace fences completion. A third 5-min reserve against a
12-min cap is refused. A p1 admission leaves the last token for a p0 reconnect. A third learning slot is refused.
A stale CAS updates nothing. Erasing the child cascades every table to 0. Under concurrency, a second ingest blocked
until the first committed and got seq + 1 (I-R1). A commit's `has_more` waited for an in-flight ingest and returned
true. The run caught one defect, which is fixed above: orch R2.3's `run_after = case … end` wrote NULL into a NOT NULL
column on every non-retry outcome.

**Lock order, verified** (same measurement id, revision-2 pass, scratch PG 16.14, n = 5 per cell;
`conductor-lock-order-rev2-probe.sh` plus its `.extra.sql`/`.reset.sql`, on top of orch's probe schema). Both
revision-1 controls, `child_seq` first against `complete_job` and against `fire_wakeups`, deadlocked **5/5**.
The revision-2 commit above deadlocked **0/5** in each of eight cells: against `complete_job` and against
`fire_wakeups`, with each side going first; against a `create_commitment` holding `child_seq`; against an in-flight
ingest; and with one ticker batch over two children racing two concurrent commits. In every cell where an ingest
committed, or was in flight, before the commit's `child_seq` update, `has_more` came back `true` (20/20). In every
run, fired wakeups equalled `clock.wakeup` events (I-R2). Not covered: the parent API under load, and the real
cascade delete.

- Heartbeat: long jobs extend `lease_until` every `lease_sec/3` with the same `attempts` fence. Workers check
  `cancel_requested` at every `durableStep` boundary and before any child-facing effect.
- Hard-coded concurrency: the per-child singleton is the **lease over the `pending_since` dirty set** (X30; there is
  no `conductor.step` job), and `azure:image ≤ 3` is the rate bucket. There is no generic concurrency subquery, because
  it over-admits (orch §7.2 caveat, R6).
- `agent_run(job_id, attempt, step_key, output, spent_micro_usd)` checkpoints exist for Forge and the letter job
  only (orch R6).
- Library-level jobs (`child_id` null, Forge) fan out to waiting children through the `module.ready` read model,
  not through events into every mailbox.

### 3.9 Wakeups (the clock is data)

```sql
create table wakeup (
  child_id uuid not null references child(id) on delete cascade, dedupe text not null,
  due_at timestamptz not null, reason text not null, fired_at timestamptz,
  primary key (child_id, dedupe));
create index wakeup_due on wakeup (due_at) where fired_at is null;
-- upsert from the commit moves a semantic row instead of adding one:
-- on conflict (child_id, dedupe) do update set due_at = excluded.due_at where wakeup.fired_at is null;

-- fire (ticker leader only): update + ingest commit together or not at all (orch R2.2). Loop while 500 rows return.
create or replace function fire_wakeups(p_limit int) returns table (child_id uuid, seq bigint) language sql as $$
  with d as (select w.child_id, w.dedupe, w.reason from wakeup w where w.fired_at is null and w.due_at <= now()
              order by w.due_at for update skip locked limit p_limit),
       f as (update wakeup w set fired_at = now() from d
              where w.child_id = d.child_id and w.dedupe = d.dedupe returning w.child_id, w.dedupe, w.reason)
  -- ingest_event in the TARGET LIST runs once per row (never put it in a WHERE that the planner could short-circuit)
  select f.child_id, ingest_event(f.child_id, gen_ulid(), 'clock.wakeup', 'clock', 'wake:' || f.dedupe, now(),
                                  'wake:' || f.dedupe, null, jsonb_build_object('reason', f.reason, 'wakeupId', f.dedupe))
    from f;
$$;
```

- **Ticker** (on the `taxila-worker` leader, every 15 s): `fire_wakeups(500)` until it returns fewer than 500
  rows. Each call is its own short transaction, so a deadlock abort (X29's backstop) rolls back at most one batch.
- **Dirty-set step loop** (every `taxila-worker` replica; X30). This replaces both the `conductor.step` job kind and
  revision 1's 30 s sweep:
  `select child_id from child_seq where pending_since is not null and pending_since < now() - interval '2 seconds' order by pending_since limit 50`.
  It is a plain read with no `FOR UPDATE`, so X29's order holds. Each returned child gets `step()` with bounded
  concurrency (8 per replica [U]), and the lease is the mutex. The 2 s grace leaves the first attempt to the inline
  `step()` on `taxila-web`. The loop polls every 1 s while it finds work, backing off to 5 s when idle (X35).
- **Dormant clock** (X36): after 14 days with no `app.opened`, the `night` handler stops re-arming `day_start` and
  `night`. Parent-chosen wakeups (`weekly_letter`, `commitment_due`, `care_note_expiry`) and safety timers are never
  dropped. `app.opened` re-arms everything.
- **Jitter** (orch R3.2): mass reasons get `due_at = base + (hashtext(child_id::text) mod windowSec)`. The windows
  are: `day_start` 05:00-06:00 local; `weekly_letter` across the parent's chosen hour; the M2 night plan across
  22:30-04:30. Dedupe keys stay semantic (`day_start:2026-10-03`, `weekly_letter:2026-W40`).
- **Piggyback:** any request from a child's device runs that child's due wakeups before answering. Ticker
  outage degrades to a delay for active children (CM8).

### 3.10 Idempotency keys (derived from facts, never from a clock or a random value)

| layer | key | guarantee |
|---|---|---|
| device → ingest | op ULID (`sync_op_seen`) + event `idemKey` (`app.opened:{replicaId}:{bootId}`, `slot.shown:{planDay}:{v}:{slotId}`) | patchy-network retries insert once |
| Director → ingest | `lesson.ended:{lessonId}`, `milestone:{skill}:{to}:{evidenceSeq}`, `promise:{promiseId}` | a re-sent close is one event |
| parent → ingest | `setting:{key}:{settingsVersion}`, `consent:{purpose}:{consentVersion}`, `commit:{commitmentId}` | a double tap is one change |
| clock / jobs → ingest | `wake:{dedupe}`, `job:{id}:{done|dead}` | ticker overlap and zombie workers are harmless |
| Conductor → jobs | `memory.consolidate:{lessonId}`, `parent.letter:{child}:{isoWeek}`, `kt.refold:{child}:{fromTs}`, `plan.day.llm:{child}:{day}:{inputsHash}`, `forge.spec:{objective}:{engine}:{specHash}:{modelV}`, `forge.build:{objective}:{engine}:{specHash}:{modelV}` | `unique(kind, idem_key)` |
| Notifier | `notification.dedupe` (`letter:{child}:{isoWeek}`, `S:{incidentId}`, `wb:{child}:{isoWeek}`), provider idempotency keyed by `notification.id` | at-least-once delivery, effectively-once effect |
| model calls | `agent_run.step_key`; realtime `(lesson_id, response_id)` | a crash replays the stored output, not the paid call |
| inbound WhatsApp | `wa_inbound.message_id` | Event Grid at-least-once (pl PA-10) |

### 3.11 Replay contract

`decide` is pure relative to `(event, state, recorded now, recorded view keys, cfg@build_sha, arms)`. All of
these are in `decision_log` and `brief_snapshot`. Invariant I-R3: a replay that reads anything else fails.
(gap-fill G1-adaptation-policy) The replay reader is a `ViewReader` that serves only the recorded
`{key: {value, asOf, src, stale}}` map. Staleness is replayed as recorded and is never recomputed against the replay
clock. A key missing from the map throws `ReplayMiss`, the view analogue of `CassetteMiss`. `planDay` gets no reader
at all: it is pure over `PlannerInputs`, whose `view` was filled from this same map (§3.7).
Assignment is a pure hash passed into `decide` (obs O10). L2 replay on release starts at M1; the nightly production
sample starts at M2 (§9.8).

**Replay never commits** (X31; orch B5). `replay(childId, fromSeq, reader)` gets a read-only reader with no `tx` or
`commit` handle, and returns `(state, commands[])` to compare against `decision_log`. Idempotency keys protect a
committing replay only while the original `job`/`wakeup`/`notification` rows exist. After retention prunes them, a
replay that wrote would re-run consolidations and re-send letters. **I-R9**: the simulator wraps the DB in a
write-counting shim and asserts zero writes in replay mode. Reducer upgrades go through `upgradeState` (§3.12), never
through replay-and-commit.

### 3.12 Upgrades and deploys

`upgradeState(state, fromV)` is a chain of pure migrations, unit-tested with fixtures from every previous
`stateV`. Deploys that touch `server/conductor/`, `server/director/` or the observer are frozen from 18:00 to
21:30 IST (peak; X37). `git push` comes first, then `node scripts/deploy-azure.mjs` for the apps: `taxila-web`, then
`taxila-worker`, then (from M1) `taxila-observer`.

---

## 4. The student day, week and term, and the notification policy

### 4.1 The constraint map (dc §2)

Realistic after-school windows: **16:00-19:30** for B1-B2 on a shared phone, and **17:00-21:00** for B3-B4,
with a tuition gap. The parent is the real scheduler for B1-B3: the phone, the snack and the permission are
theirs. So the parent authors the anchor, and the child authors the choices inside it (DC1). Bands: B1 6-7 y
(Class 1-2), B2 8-9 (3-4), B3 10-12 (5-7), B4 13-15 (8-9).

### 4.2 Lanes and the voice budget

```ts
// shared/conductor/lanes.ts
export type Lane = 'realtime' | 'realtime_mini' | 'cascade' | 'tap';
export const LANE_USD_PER_MIN = { realtime: 3.93 / 45, realtime_mini: 0.96 / 45, cascade: 0.35 / 45, tap: 0 } as const;  // [V prices; U shapes] realtime-cost-model.py
export interface TierConfig {                         // OWNER DECISION D-PRICE (§10.5); values below are placeholders
  id: TierId; priceInrMonth: number; usdCeilingMonth: number;           // all AI + infra for one child
  voiceSecMonth: Record<Exclude<Lane, 'tap'>, number>;
  ptmVoicePerMonth: 0 | 1; ptmTextTurnsMonth: number; capturesPerDay: number;
}
```

| segment or slot | lane wanted | lane granted (at lesson start, fixed for the lesson: I-R7) | why |
|---|---|---|---|
| lesson `teach`, `teachback`, `transfer`, `wrap` | `realtime` | `realtime` if the month's budget covers the planned seconds, else `realtime_mini` (practice drills only), else `cascade`. The voice must be the same character by blind ear (inherited law) [U] | the human-like teacher is the product here |
| lesson `retrieve`, `practice`, `play` | `tap` (+ short cascade turns) | `tap` | kit-keyed items need no open conversation; a tap is cleaner evidence than ASR |
| `homework_help` | `cascade` | `cascade` (validator rejects realtime: I8) | the leak guard must be a pre-check (§6.5) |
| `burst`, "tiny day" | `tap` | `tap` | items only |
| admission wait (warm-up) | `tap` + cached narration clip | `tap` | the wait becomes pedagogy (orch R7.1) |

**Unit economics** [I/U]: at ₹299 ≈ $3.11/month, a 45-min rt-2.1 lesson costs $3.93, a B2 day's realtime-eligible
segments (~12 min) cost ≈ $1.05, and a day of all-realtime B2 planning would cost $48.9/month (dc AR-1). §9.5 has the
illustrative envelope.

### 4.3 One sitting per day, per band (v1 template)

The DC4 session lengths are kept. The cap counts all slots, and the plan aims at ≤ 70% of the cap.

| band | daily cap | homework sub-cap (cascade) | lesson session | lesson segments (min) with lane wanted | realtime-eligible min |
|---|---|---|---|---|---|
| B1 | 30 | ≤ 10, parent-led (School Bag Policy: none set to Class II [V via ss §1]; help only if a sheet exists) | 20 | retrieve 3 tap · teach 5 rt · play 5 tap · offline 3 · teach-back 3 rt · wrap 1 rt | 9 |
| B2 | 40 | ≤ 15 | 25 | retrieve 4 tap · teach 7 rt · practice 7 tap · break 2 · teach-back 4 rt · wrap 1 rt | 12 |
| B3 | 60 | ≤ 25 | 35 | retrieve 4 · teach 10 rt · practice 10 · break 3 · transfer/teach-back 6 rt · wrap 2 rt | 18 |
| B4 | 75 | ≤ 30 | 45 | retrieve 5 · teach 12 rt · practice 12 · break 3 · transfer/error-spot 10 rt · wrap 3 rt | 25 |

- **One call per sitting**: homework (cascade) → lesson → wrap. The wrap carries one free recall, one
  connection, and an if-then for tomorrow (B3-B4) or a picture choice (B1-B2), then an immediate goodbye (dc
  §5.7, no hooks, no "I'll miss you"). This cuts session starts about 3× against the 10 RPM cap (dc AR-2).
- **Bursts** (3-10 min, tap) are entered from home ("ek chhota round?") or as the tiny day (DC3). Never offer
  "one more round" more than once.
- **First 8-10 weeks:** a lighter default plan; a 3-minute tiny day counts as showing up (DC3).
- **No catch-up debt:** a skipped day never raises the next day's `plannedMin` (DC2, V12).

### 4.4 Building the day plan (code planner)

Priority stack, packed into the cap (dc §3.4):
1. safety or wellbeing holds, a `stopped` exit yesterday, a parent rest day → nothing, or a wrap-only recall;
2. homework due tomorrow (time-boxed);
3. test window (§4.8) → the lesson topic comes from the test chapters;
4. due reviews (FSRS R < 0.9), inside the warm-up (2-4 items) and the bursts, ordered by `(now − due) / S`,
   ≤ 25% of lesson minutes plus all burst minutes;
5. level path vs school chapter, 60/40 (30/70 in a test window) for children placed below class level (LS-28);
6. unexpired teacher promises (V11) and at most one parent-originated probe, after the success opener (pl PA-21 C4);
7. enrichment, only with time left.

Adaptation rules (dc §3.4, AR-10):
- **Late start** collapses only on *time left before bedtime − 60*, never on lateness against the anchor. A child
  whose phone comes home at 19:30 with a 22:00 bedtime gets a full sitting.
- **Heavy homework** shrinks the lesson to the minimum segment set. It never raises the cap.
- **Siblings on one phone:** the anchor belongs to the household. Sittings are ordered younger-first, and the
  second child's plan shifts by the first child's planned length.
- **Learning ability** (KT η, θ) may change pace and difficulty. It never changes the cap or the praise dose.

**Cross-day adaptation rules R0-R14** (gap-fill G1-adaptation-policy). The full table is adaptation-policy §4: the
`Fresh<T>` keys each rule reads, its stale fallback and its threshold source. `RULES` and `T` in
`adaptation.contracts.ts` hold the same table as data. Latches are evaluated by `foldNight` (§3.3) unless the row
says otherwise. A latch counts closes, not days, and **a stale key never fires a rule** (V25).

| id | knob (layer) | on → off (hysteresis) | evidence for the threshold |
|---|---|---|---|
| R0 | every knob's base value: band template + this priority stack (kt) | always | §4.3, §4.4 |
| R1 | session minutes × .7, never below the band minimum set; success-first (vibe) | last close bad → success-first only. **On:** ≥ 3 of the last 4 closes `strained`/`tired`. **Off:** 3 fine closes, or none in 14 d | k-of-m run rules (Western Electric) + Schmitt hysteresis; sim: 0.49 flips/8 wk, 23.6% child false latch, 100% hit |
| R2 | minimum segment set for sittings ≥ 20:00 (vibe) | **On:** ≥ 4 late + ≥ 4 early closes in the 16-ring, gap ≥ .40. **Off:** gap < .20 or an arm < 4 | per-child contrast (no 20:00+ evidence; TRAILS covers 08:30-13:00); sim: 15.9% false latch, 91.3% hit |
| R3 | review share .15 → .25 of lesson minutes + 1 burst offer (kt) | **On:** ≥ 6 items with overdue ratio ≥ 1. **Off:** ≤ 2 | FSRS R .9 target; the §4.4 25% cap; counts [U] |
| R4 | representation family for a wheel-spinning skill (kt) | on `wheel_spin`; not again for that skill within 3 d | Beck & Gong 2013: ≥ 10 opps without 3 in a row |
| R5 | prerequisite check, a `prereq_first` slot (kt) | on `wheel_spin`, before R4: a prerequisite with pL < .4 at depth ≤ 3; not re-checked within 3 d | need §4.7, LS-10 |
| R6 | new-skill budget 0/1/2, B1 ≤ 1 (kt) | on `learner.params_refit`, when ≥ 30 opps over ≥ 3 skills. **Up:** η ≥ +.5 on 2 refits. **Down:** η ≤ −.5 on 3. **Back:** inside ±.25 on 2. Stale refit → hold | kt §2.5 prior N(0, .5²); Yudelson 2013; sim: oscillation 0.19 vs 0.56 naive |
| R7 | solo rounds base → base + 1 (srl) | **On:** ok ≥ .8 of ≥ 8 attempts, or the dependency flag. **Off:** declines ≥ .4, or flag off with ok < .7 | srl §3.5, §5.5 |
| R8 | opener kind + success-first (kt > srl > interest) | gap ≥ 7 d → `reanchor_light`; then `goal_review`; then `thread_return`; then `callback`; else `standard_retrieval`. Always ≥ 2 due items (V5) | MI §2.6; high-p sequence (Mace 1988) as the analogue |
| R9 | foundation share `min(.6, .2 + .15·gap)`, × .5 in a test window; ≥ .5 for a rank-1 catch-up goal (kt) | weekly | need §4.7 ∩ the 60/40 and 30/70 of item 5 |
| R10 | voice rung (budget constraint) | allowance = `floor(realtimeLeft / activeDaysLeft)`; if short → `{cascade, tap}` | §9.5 ladder |
| R11 | topic or skin from a child's choice (interest) | consumed once, inside the KT domain only; else `choiceAck` | Patall 2008 |
| R12 | the weekly home-activity kind (srl > interest) | weekly; never the same kind 2 weeks running | pl §7.4 |
| R13 | the goal card, child-set (srl) | ≤ 1 active goal; MCII only at ≥ 12 with the opt-in | Duckworth 2011 (n = 66) |
| R14 | one in-app parent routine card (kt, facts tier) | ≥ 3 of the last 5 closes cut short or late; 14 d cooldown; reads `endedBy` and hours, **never** `vibeClose` | dc §7.4; V27 |

### 4.5 Contracts: DayPlan, PlannedSlot, LessonBrief

```ts
// shared/conductor/plan.ts — the ONE DayPlan type (orch R5 merge)
export type SlotKind = 'homework_help' | 'live_lesson' | 'burst' | 'offline_task';
export type SegmentKind = 'retrieve' | 'teach' | 'play' | 'practice' | 'break' | 'offline' | 'teachback' | 'transfer' | 'wrap';
export type WhyCode = 'due_review' | 'school_chapter' | 'test_window' | 'prereq_gap' | 'parent_request'
  | 'homework' | 'interest_context' | 'teacher_promise' | 'level_path' | 'child_choice';
export interface PlannedSlot {
  id: string; kind: SlotKind; targetMin: number; window: [string, string];      // local times
  topicId?: string; skillIds?: string[]; reviewItemIds?: string[]; homeworkTaskId?: string;
  segments?: Array<{ kind: SegmentKind; minutes: number; laneWanted: Lane }>;
  voiceSecWanted: Partial<Record<Lane, number>>;
  format?: { engineHints: string[] };                 // content-format fit, never a learner label (LS-22)
  why: Array<{ code: WhyCode | WhyCodeAdd; ref: string }>;   // backs "Kaise pata?" (PX3) and the ops timeline
  // (gap-fill G1-adaptation-policy) PlannedSlotAdd: the adaptive knobs, each backed by a RuleFiring (V16)
  pace?: { newSkillBudget: 0 | 1 | 2 }; soloRounds?: number; opener?: OpenerKind; successFirst?: boolean;
  representation?: { skillId: string; preferFamily: FormatFamily; avoidEngines: string[] };
  prereqCheck?: { skillId: string; forTopicId: string }; foundationShare?: number;
}
export interface DayPlan {
  childId: string; day: string; version: number; band: Band;
  mode: 'school_day' | 'free_day' | 'test_window' | 'light_mode' | 'rest_day';
  capMin: number; plannedMin: number; splitLevelVsSchool: [number, number];
  slots: PlannedSlot[];
  voiceBudgetSec: Partial<Record<Lane, number>>;      // remaining this month from the tier (§9.5)
  prefetch: Array<{ libraryKey: string }>;            // library keys only; no child fields (V15)
  inputsHash: string; builtBy: 'code' | 'llm';        // inputsHash composition: §3.7, X43
  adapt: { rules: RuleFiring[]; viewSrc: Record<string, string> };   // (G1) every firing, its evidence and blockedBy
}
// shared/contracts.ts — Conductor → Director (merged orch §5.2 + dc contracts)
export interface LessonBrief {
  lessonId: string; slotId: string; planVersion: number; topicId: string; band: Band;
  segments: Array<{ kind: SegmentKind; minutes: number; lane: Lane }>;   // lanes GRANTED at start
  reviewItemIds: string[]; targetMin: number;
  wrapAt: string; hardStopAt: string;                 // Director wraps at the earlier, at a natural stop, never mid-item
  holdNewTopics: boolean; resumeOf?: { lessonId: string; segmentIdx: number };
  promisesDue: Array<{ id: string; kind: string; ref: string }>;
  parentToldAbout?: { topicId: string };              // pl PA-21 C2: the teacher tells the child, as a shape
  homeLoopMention?: { activityId: string };
  careEffect?: 'gentle_mode';
  homeAdultName?: string;                             // "show <name>", never assumed "Mumma" (dc AR-10.6)
  preparedModules: PreparedModule[];                  // (gap-fill G2-content-orchestration-media) superset of the old element: + source, libraryKey,
                                                      // contentHash (blocklist check), tier, reviewGrade, forSegment, fallbacks[] ending
                                                      // in a device-cached marginal-zero floor (content-orchestration §3, §5.1)
  childBrief: ChildBrief;                             // ≤ 600 tok (existing); the Director's packet, never read by decide()
  // (gap-fill G1-adaptation-policy) LessonBriefAdd
  opener: OpenerKind; successFirst: boolean; soloRounds: number; newSkillBudget: 0 | 1 | 2;
  representation?: PlannedSlot['representation']; prereqCheck?: PlannedSlot['prereqCheck'];
  goalReview?: { goalId: string; skillIds: string[] };
  choiceAck?: { offerId: string; honoured: boolean }; // a blocked child choice still gets an acknowledgement shape
  adaptTrace: RuleId[];                               // ops only; never compiled into a prompt
}
// OpenerKind = 'standard_retrieval' | 'reanchor_light' | 'goal_review' | 'thread_return' | 'callback'
// WhyCodeAdd = 'child_goal' | 'thread_return' | 'representation_switch' | 'prereq_check' | 'independence'
```

**Plan validator** (`server/conductor/validate.js`). Each rule has a negative-control fixture:

| id | rejects a plan that … | source |
|---|---|---|
| V1 | has `plannedMin > capMin` (all slot kinds), or a homework total above the band sub-cap | dc §3.2, X17 |
| V2 | puts a slot outside allowed hours ∩ the learning window, any teaching after bedtime − 60, or anything after bedtime − 30 | DC7 |
| V3 | plans `voiceSecWanted.realtime` above `voiceBudgetSec.realtime` | dc AR-1 |
| V4 | puts `homework_help` on `realtime` | ss AR-2, I8 |
| V5 | opens the first sitting with fewer than 2 retrieval items when any are due | LS-18 |
| V6 | has a topic whose prerequisites are below `practising`, unless the slot is marked `prereq_first` | LS-28 |
| V7 | re-checks a skill on the same `learningDay` it was acquired | DC6 |
| V8 | has unknown topic, skill, item or engine ids. (No schema field can express a style label or a reward) | LS-22, LS-27 |
| V9 | uses the last 2 days of a test window for new content | DC11 |
| V10 | changes a slot with `slot.shown` or `slot.started` | orch R7.2, dc AR-5 R2 |
| V11 | lets an unexpired `teacher.promise` lapse without a slot, unless a higher authority blocked it (then the brief carries an acknowledgement shape) | orch R7.3 |
| V12 | sets `plannedMin` above the normal-day plan after a skipped day | DC2 |
| V13 | has more than one parent-originated probe in a lesson, or one before the opener | pl PA-21 C4 |
| V14 | has a `prefetch` key that carries any ChildBrief field outside the Forge projection | orch R3.1, ws W8 |
| V15 | puts an adaptive knob outside its bounds: session ≥ the band minimum set and ≤ the template; `soloRounds` ∈ [base, base + 1]; `newSkillBudget` ∈ {0, 1, 2}, ≤ 1 for B1; `foundationShare` ≤ .6; `reviewShare` ≤ .25 (gap-fill G1-adaptation-policy) | adaptation-policy §4 |
| V16 | has a knob that differs from R0 without a `RuleFiring`, or a firing that changed nothing | §4 trace |
| V17 | switches a skill's representation within 3 d of the last switch, back to its `from` family, or to an engine in `avoidEngines` | R4 |
| V18 | prereq-checks a skill checked within 3 d, deeper than 3, or more than once per lesson | R5 |
| V19 | uses an opener kind whose source is absent (`goal_review`/`thread_return`/`callback` without a goal/thread/`tm.opener`) | R8, V5 |
| V20 | has `newSkillBudget` > 0 in the last 2 days of a test window, more new skills than the budget, or > 1 for B1 | R6, DC11 |
| V21 | carries a firing whose (layer, knob) is not in `MAY_PROPOSE`, or a constraint `registerConstraint` refuses | I-A1, I-A2 |
| V22 | adopts a child choice outside the higher layers' domain, drops a blocked choice without `choiceAck{honoured:false}`, or offers core vs fluff | R11, LS-26 |
| V23 | has > 1 active goal, a goal of > 1 skill or task, MCII under 12 or without the opt-in, or a goal card while a goal is active | R13, need §4.6 |
| V24 | has a firing whose evidence key is not in the step's recorded view (`brief_snapshot`) | X34, X41 |
| V25 | has a firing whose evidence includes a stale key | X41 |
| V26 | raises `plannedMin` or the cap through any rule, changes the praise dose, or puts η, θ or a gap number on any child- or parent-facing field | §4.4, kt R18 |
| V27 | has a routine card whose evidence includes a vibe key, more than one in 14 d, or one sent as a push | R14, pl PA-6 |

### 4.6 In-lesson boundary contract (Director ↔ Conductor ↔ governor)

| situation | rule |
|---|---|
| lesson start | `/api/lesson/start` runs: (1) usage reserve of a 5-min block (§3.1); (2) voice-budget reserve for the first block on the granted lane; (3) a realtime admission token (§9.5); (4) `brief.refresh`. While admission waits, the device runs the **off-voice warm-up** (tap retrieval with cached narration). The teacher then joins and builds on its results. A queue position is never shown to the child; the parent dashboard shows "busy hour" honestly |
| block renewal | every 5 min at a natural stop: renew usage + voice. On a failure the governor sets `wrapAt` = the next natural stop. An in-flight lesson whose governor DB call errors fails **open for one block**, logged (orch R3.3) |
| cap or bedtime | wrap at the next natural stop. Finish the current item, at most one wrap per item. A "+10 min" is offered **to the parent behind the PIN**, never to the child (orch R7.5) |
| idle (X32) | triggers **only on audio that is not the child**: VAD commits whose transcript is empty or low-confidence (TV, a sibling, a pressure cooker), or 90 s with no child speech after the teacher handed over the turn. At the next natural stop: one "main yahin hoon…" shape, then a wrap, and the client closes WebRTC. Reopening is one tap through admission. **Off-topic child speech is never idle** ("mera kutta aaj…", thinking aloud): the Director answers it with its redirect shape, because those are the rapport moments. CM10 counts the two separately |
| 60-min / 32k-token session cap [V Azure] | the Director's `session.renew` at a natural stop, carrying the brief + lesson summary |
| network drop | `lesson.ended{reason:'network'}` → `resumable` for 15 min. A resume keeps the lessonId, the brief and the reservation, gets reconnect priority 0, has no re-greeting, and counts only voice actually used |
| degrade | the rung is chosen at start for the whole lesson; it changes only on `outage` (I-R7) |
| safety | only safety ends a lesson immediately. The corrective instruction plus a graceful wrap in the same voice (cached narration) end it kindly; the teacher never goes silent mid-sentence (obs V6.2) |
| holds and kill switches | model-version holds, experiment reverts and cohort holds take effect at lesson boundaries only; voice-lane holds need a human |
| Director down (Neon down) | the client keeps the last instructions and queues turns in the outbox. Lesson start fails *before* the call connects, with a friendly retry card (ws R2) |
| a ready Forge module (gap-fill G2-content-orchestration-media) | **lesson start / resume:** `brief.refresh` fills `preparedModules` from `forge_ready_for(child)` (published, not blocklisted, not yet served) ∪ inventory hits ∪ kit floors; the device caches every floor. **Mid-lesson:** the Director reads `forge_ready_for(child, lastPoll)` at each turn boundary (X51) and offers a new module at the next natural stop, only if nothing is mounted for that segment (I-F9). **Live fills** (T1 params, T2a template) are the Director's own, with a **3 s hard timeout** from the move decision: T1 fits (2.05 s p90); T2a (3.35 s p90) only with one turn of lookahead; T2b only via `forge.demand{in_lesson}` with need-by ≥ 45 s (next segment, or the minute-3 diagnostic for practice). **On a miss** at need-by: mount `fallbacks[0]` silently (no "loading"), log `module_run.missed_primary`, promote the late live fill, carry a late T2b to next lesson unless ≥ 90 s of the segment remain; after 3 misses in a lesson, stop requesting T2 (content-orchestration §5) |

### 4.7 Week and term (v1)

- **Week:** the same daily template every day in v1 (dc AR-9 cut the Friday/Saturday week shapes). Weekly
  targets are *days with any session ≥ 3* and *delayed checks done*, never minutes. The child never sees a weekly
  count. The weekly letter goes on the parent's day, which defaults to `hash(guardianId) mod 7` (pl PA-9).
- **Term (CBSE pattern [S]):** April placement (LS-28, kt §3.4) and anchor setup. PT1 in Jul-Aug. Half-yearly in
  Sep-Oct. Dussehra and Diwali in Oct-Nov (light mode). PT2 in Dec-Jan. Annual in Feb-Mar. Summer in May-Jun (light
  mode plus an opt-in "summer bridge" for TaRL gaps).
- **Rollover:** asks and never assumes (ws R7.4). The parent confirms the class with one tap around results week
  (`parent.rollover_confirmed`), spread per child over the first week of the session. With no answer the child
  stays in the old class and keeps learning from the skill graph.

### 4.8 Exam windows (v1)

The parent (or a B3-B4 child) enters the test date and chapters (chips). Windows: unit test 5 days, periodic 7,
half-yearly/annual 14-21 [I]. Inside a window, lesson topics are restricted to the test chapters (30/70 split), and
the last 2 days are retrieval only. The cap, the sleep margins and the no-streak floor don't change. The parent sees
which test skills are pakka vs aa gaya, never a predicted mark (DC11). The night before: a short sitting (≤ 15 min)
that ends with the if-then for the morning. There is no child-facing countdown, banner or "N days left" (dc AR-10.7).
Cepeda back-scheduling with R 0.95 is v2.

### 4.9 Holidays and re-anchoring

v1 calendar: national holidays (one shared `calendar` table) plus `school.day_override` events per child (parent
"off", a family day). Festival default plan = nothing; an open gets a themed burst. Long breaks get light mode
(3 days/week suggested, 15-20 min). On the first school day after any break, the parent sees **one** in-app re-anchor
card ("Taxila time still after snack?"); there is no push (Wood 2005 [S]; dc §7.4). Dormancy never wipes the
device's offline pack (ws R7.1).

### 4.10 Notification policy

#### 4.10.1 Principles (dc §10, pl PL8, PX)
Recipients are parents. A child on a shared device gets **0** notifications (a B4 on their own phone may get only
reminders they set). Content is logistics, never pressure. Quiet hours are 20:30-08:00 in the **guardian's** tz plus
`at_school`; only the safety class is exempt. The lock screen never shows performance, a topic weakness or a child
quote. Every string is written as if the child will read it, and as if it plays aloud on speaker (pl PA-21 C3).

#### 4.10.2 Classes, channels and caps

| class | channel (v1) | cap | counts in the ≤ 2 learning/week cap |
|---|---|---|---|
| `weekly_letter` | WhatsApp utility template (image header + text + buttons) via ACS Advanced Messaging; app view | 1 / child / week | yes (slot 1) |
| `milestone` (a parent-asked skill became pakka) | WhatsApp utility | ≤ 1 / week | yes (slot 2) |
| `test_window` ("plan for the half-yearly is ready") | WhatsApp utility | 1 per window | yes |
| `wellbeing_note` | in-app note + a WhatsApp pointer with no content | ≤ 1 / week, coalesced | no |
| `safety_notice` | WhatsApp pointer + push, content behind the PIN, delivery ladder (§7.6) | none | no |
| `ptm_summary` | WhatsApp utility (parent-requested) | 1 per PTM | no |
| `account`, `payment` | WhatsApp | per event | no |
| `anchor_reminder` | **on-device local notification** (Capacitor Local Notifications, inexact) | ≤ 1/day, ≤ 5/week; self-pauses after 3 ignored (ignored = no `app.opened` in the window); silent on backup windows | no (parent-requested) |
| `daily_note`, `school_ask`, `commitment_result`, `struggle` | **in-app only** in v1 (the letter carries commitment results and struggle lines) | — | — |
| absence, streak, come-back, offer, countdown | **no class exists** | — | — |

#### 4.10.3 The gate and the cap

```ts
// shared/conductor/notify.ts — one union, one gate (orch R5); fixes dc AR-6.1-6.5 and pl PA-7
export type NotifyClass = 'weekly_letter' | 'milestone' | 'test_window' | 'wellbeing_note' | 'safety_notice'
  | 'ptm_summary' | 'account' | 'payment';
export interface NotifyIntent {
  cls: NotifyClass; guardianId: string; childId?: string; incidentId?: string;   // incidentId REQUIRED for safety_notice
  notBefore: string; notAfter: string;              // expired intents never queue into a morning burst
  template: TemplateId; vars: Record<string, string>; deepLink: string;          // templates are lint-checked at registration
}
export type BlockReason = 'expired' | 'protocol_hold' | 'safety_hold' | 'consent' | 'pref_off' | 'quiet' | 'copy_lint' | 'cap';
export function mayNotify(i: NotifyIntent, c: NotifyCtx): { ok: true } | { ok: false; why: BlockReason; retryAt?: string } {
  if (c.now < Date.parse(i.notBefore) || c.now > Date.parse(i.notAfter)) return { ok: false, why: 'expired' };
  if (i.cls === 'safety_notice')                    // never capped, never quiet-houred, but ALWAYS protocol-gated
    return c.safety.parentNotice(i.incidentId!, c.now) === 'send' ? { ok: true } : { ok: false, why: 'protocol_hold' };
  if (c.childMode === 'safety_hold' && i.cls !== 'account' && i.cls !== 'payment') return { ok: false, why: 'safety_hold' };
  if (LEARNING.has(i.cls) && !c.consent.reports) return { ok: false, why: 'consent' };
  if (c.optedOut(i.cls)) return { ok: false, why: 'pref_off' };
  const q = quietEnd(c.now, c.guardianTz, c.quiet, c.childClockPhase);           // tz-aware; null if not quiet
  if (q) return Date.parse(q) <= Date.parse(i.notAfter) ? { ok: false, why: 'quiet', retryAt: q } : { ok: false, why: 'expired' };
  if (!TEMPLATES[i.template]?.lintOk) return { ok: false, why: 'copy_lint' };
  return { ok: true };                               // caps are NOT read here: the slot insert below is the cap
}
```

```sql
-- db/migrations/002_conductor.sql (part 4: outbox)
create table notification (
  id bigint generated always as identity primary key,
  guardian_id uuid not null references guardian(id) on delete cascade,
  child_id uuid references child(id) on delete cascade,
  cls text not null, intent jsonb not null, dedupe text not null,        -- semantic idempotency key
  not_before timestamptz not null, not_after timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','delivered','failed','expired','cancelled','blocked')),
  block_reason text, channel text, provider_id text, attempts int not null default 0,
  sent_at timestamptz, delivered_at timestamptz, opened_at timestamptz, correlation_id text not null,
  unique (guardian_id, dedupe));
create table notify_slot (                            -- capped classes: the INSERT is the cap (dc AR-5 R5)
  guardian_id uuid not null references guardian(id) on delete cascade,
  child_id uuid not null references child(id) on delete cascade,
  scope text not null,                                -- 'learn:2026-W40' | 'wb:2026-W40' | 'test:{eventId}'
  slot smallint not null, notification_id bigint not null references notification(id) on delete cascade,
  primary key (guardian_id, child_id, scope, slot));
-- learning: try slot 1, then slot 2; both taken → status 'blocked', block_reason 'cap' (the letter carries it instead)
```

#### 4.10.4 Copy and channel rules

- **Lint** (bilingual, at template registration and in `verify-release` G2, with a negative control): name +
  neutral fact + optional action. No scarcity words (abhi, jaldi, last, only today), no guilt or loss words (miss,
  lose, break, streak, behind, peeche), no anthropomorphic need ("Asha is waiting"), no exclamation stacks, no
  emoji pressure, no em/en dashes in UI strings (dc §10.3, PP11).
- **WhatsApp** (pl PA-9): variable-only template shells, so wording changes don't need re-approval. A tier-aware
  scheduler reads `max_daily_conversations_per_business` [V Meta] and plans ≤ 90% of it, S first. New portfolios start
  at **250 unique users / 24 h** [V Meta], hence the spread weekday. A block/quality alarm (PLM13) is wired because a
  quality drop throttles the safety channel too. Recipients are keyed by BSUID once ACS supports it [V ACS].
- **Inbound** (pl PA-10): `POST /api/wa/inbound` on `taxila-web` verifies, inserts `wa_inbound(message_id pk)` on
  conflict do nothing, applies STOP / "Band karo" (reports off + cancel queued outbox rows in the same transaction),
  enqueues `parent.inbound`, and answers 200 in < 1 s. Button payloads are versioned
  (`ha:{letterId}:{assignmentKey}:done`) so a stale button lands on its own week.

---

## 5. The per-student workspace (the "little VM", logically)

### 5.1 What a child owns (ws §1, W1)

| VM concept | Taxila part | owner | store (v1) | device copy |
|---|---|---|---|---|
| boot record | `workspace` row (state, legal_mode, academic year) | workspace service | Neon | id only |
| process table / crontab | `conductor_state`, `wakeup`, `job`, `day_plan` | Conductor | Neon | today + tomorrow plan doc |
| syslog / audit | `student_event`, `decision_log` | ingest / Conductor | Neon | outbox only |
| shell history | `lesson`, `turn` (transcripts) | Director | Neon (plaintext in v1; X15) | **never** |
| RAM | Director in-lesson state, vibe session state | Director | memory; `lesson.state` truncated at close | never |
| learner model | KT ledger and state | KT | Neon | brief-lite doc |
| long-term memory | cited `memory`, `rel_state`, interests | consolidator | Neon | interests only |
| prefs | `child_routine`, `parent_setting`, explicit vibe prefs | parent API / child-said | Neon | prefs doc |
| home: notebook | `notebook_page`, `notebook_op` (batched), snapshots in `nb/` | device (child layer), Director (teacher layer) | Neon + Blob ZRS | last 14 days |
| home: my games | `artifact_shelf`, `artifact_use` | Director (use) / child (pin) | Neon | thumbnails |
| home: creations | `child_creation` → Blob `cr/` (drawings, photos; **no audio**: ws SW11) | child via API | Blob ZRS | recent |
| downloads | packs (shared content-addressed objects + a < 50 KB personal part) | pack builder (lazy + nightly for active-in-7-days) | CDN + API | yes |
| outbound | `homework_*`, `capture*`, `notification` | pipelines | Neon | no |

**Never stored, in any tier:** raw child or parent audio (generated teacher audio is a TTL asset; pl PA-4),
voiceprints, inferred emotions or personality, engagement predictions, free-text "about the child" notes. The
`WORKSPACE_MAP` has no kind that could hold them.

### 5.2 The map, enforced (ws W2)

```ts
// shared/workspace/map.ts
export interface WorkspaceEntry {
  key: string; store: { kind: 'table'; table: string } | { kind: 'blob'; prefix: 'nb' | 'cr' | 'ex' | 'pk' | 'cap' | 'cassette' };
  owner: 'conductor' | 'director' | 'kt' | 'memory' | 'parent_api' | 'parent_agent' | 'device' | 'forge'
       | 'safety' | 'workspace' | 'homework' | 'notifier' | 'governor' | 'obs';
  purpose: Purpose; tier: 'hot' | 'blob' | 'ephemeral'; hotDays?: number;
  device: 'none' | 'doc' | 'outbox' | 'cache'; export: 'raw' | 'readable' | 'both' | 'none';
  erase: 'cascade' | 'prefix' | 'legal_hold_eligible'; parentVisible: boolean; freeText: boolean;
}
export const WORKSPACE_MAP: readonly WorkspaceEntry[] = [ /* one entry per table/prefix in §5.1, §2-§7 */ ];
```

Gated tests: (1) every table with a `child_id` column is mapped, cascades and has a `child_id` index (obs V2.8);
(2) no two migrations create `*_event`, `*_plan` or `notification*` tables without a map entry naming the owner
(orch R5); (3) after `erase(child)` every mapped table has 0 rows and every mapped prefix lists empty; (4) event
schemas carry no free text (§2.3).

### 5.3 v1 tables and the deltas to `student-workspace.sql`

Keep: `workspace`, `device`, `device_child`, `notebook_page`, `notebook_op`, `artifact_shelf`, `artifact_use`,
`child_creation`, `workspace_lifecycle`, `data_request`, `pack`. Defer: `child_directory` and cells (until WS-M10
says one compute can't hold the next 6 months), `child_key` (X15), `archive_segment` (plain retention deletes),
`workspace_object` beyond creations and notebook snapshots.

```sql
-- db/migrations/004_workspace.sql (deltas to the sibling draft; ws R3.2, R8)
alter table notebook_op rename column writer to replica;              -- 'director' | replica ULID (store-file lifetime)
alter table notebook_op drop constraint notebook_op_pkey, drop column writer_seq,
  add column op_id text not null, add primary key (child_id, op_id);  -- one row per (page, replica, sync batch); op = op ARRAY
alter table device_child add column replica_id text, add column replica_started_at timestamptz,
  drop column last_op_seq;
create table sync_op_seen (child_id uuid not null references child(id) on delete cascade,
  op_id text not null, at timestamptz not null default now(), primary key (child_id, op_id));   -- prune > 72 h + 7 d
alter table artifact_use add column op_id text primary key;           -- replay = no-op
alter table child_creation drop constraint if exists child_creation_kind_check,
  add constraint child_creation_kind_check check (kind in ('drawing','game_project','photo'));   -- no audio (SW11)
alter table pack drop column manifest, add column manifest_url text not null, add column sha256 text not null;
alter table workspace drop constraint if exists workspace_state_check,
  add constraint workspace_state_check check (state in ('provisional','active','dormant','paused','erasing'));  -- 'erased' = receipt only
alter table consent add constraint consent_child_fk foreign key (child_id) references child(id) on delete cascade;  -- gap found by ws I1
```

### 5.4 Agent projections (ws W8)

`projectFor(handle, kind)` returns a typed, whitelisted read model. Unknown keys are a compile error, and extra keys
throw at runtime. **Forge** gets `{objectiveId, engine, band, language, interestContext?, skinSchema:'name_token'}`:
never a name, never a transcript. Personalisation enters only at runtime through ModuleHost
`init{skin:{name, context, lang}}`. **Parent lane** for B3-B4 gets no child utterances unless `transcriptAccess` is on
(pl PA-14, static test PLI7). **Homework key** rows are reachable only from `leakGuard` and the check locator (I10).

### 5.5 Device replica and sync

- **Stores (v1):** Android, one Capacitor SQLite DB in app-private storage, rows keyed by `child_id`. Web, an
  IndexedDB outbox plus Cache API for packs (no OPFS: plain `opfs` needs COOP/COEP [V sqlite.org]). The device
  credential lives in native Preferences, so an evicted WebView store is rebuilt silently with no guardian OTP
  (ws R7.9). The device holds no transcripts, memory text, keys or another child's data (W5).
- **Down:** five ETag documents (`brief-lite`, `plan`, `prefs`, `shelf`, `notebook-index`), each ≤ 30 KB, computed
  **after** the batch applies, so a preference never bounces back (ws R7.10).
- **Packs:** the manifest lists content hashes, and the device fetches only hashes it lacks (that is the egress
  lever, because Front Door bills cache hits to the client [V]: ws SW10). ≤ 3 MB/day (≤ 1 MB on data saver) and
  ≤ 4 MB of modules per lesson [U]. Prefetch runs in the background on charging + unmetered when available. The
  first screen never waits on a pack.
- **Up:** `POST /api/ws/sync` with ≤ 200 ops. No batch-wide abort (ws R3.3):

```ts
// server/workspace/sync.js (shape)
export async function applyBatch(h, req, db) {
  const seen = await db.seenOps(h.childId, req.ops.map(o => o.opId));            // sync_op_seen
  const fresh = req.ops.filter(o => !seen.has(o.opId));
  const verdicts = fresh.map(o => validateOp(h, o));                              // schema, consent, quota, clock clamp
  const ok = fresh.filter((_, i) => verdicts[i].ok);
  await db.tx(async t => {
    await t.q('select 1 from workspace where child_id=$1 for update', [h.childId]);   // serialises with Director/KT (§5.6)
    await t.ensurePages(h.childId, ok);                                           // auto-create notebook pages
    await t.insertByKind(h.childId, ok);                                          // events via ingest_event; attempts; nb ops
    await t.markSeen(h.childId, fresh.map(o => o.opId));                          // rejected ops are 'seen' too
  });
  return { acked: ok.map(o => o.opId), rejected: fresh.flatMap((o, i) => verdicts[i].ok ? [] : [{ opId: o.opId, why: verdicts[i].why }]),
           ...(await docsFor(h, req.docs)) };
}
// device: a batch that fails 3× is split in half, isolating a poison op in ≤ 8 tries
```

- **Clocks:** `occurredAt` is corrected by the handshake offset and clamped to `[last_sync_at − 5 min, received_at]`.
  Ops older than 72 h are kept but carry no evidence weight (ws R8.6).
- **Shared phone:** one realtime session per child, torn down on every profile switch (low-end rule 14). Share
  intents always ask "kiska hai?" (ss AR-4 R8). A wrong-profile session is moved with `session.reassign`
  (same guardian only), which re-folds both children (ws R7.5).

### 5.6 KT writes, late evidence, and never retracting what the child saw

- Every transaction that writes the KT ledger first takes `select … from workspace where child_id=$1 for update`.
  That covers the Director's per-turn evidence, the sync `attempt` apply and `kt.refold`. It is a transaction-level
  lock, so it works through the pooler (ws R3.4).
- Offline attempts are **re-graded by the server** against the kit version pinned in the pack (W7). Late
  evidence is appended with its true `occurred_at`. While a lesson is open, `kt.refold` waits
  (`not_before_lesson_end`).
- Offline evidence alone can never create `mastered` (kt invariant 8).
- **I18:** anything already shown to the child today ("sahi!", a star, "learned today") is never visibly taken
  back. The model changes silently, and the next plan absorbs it.

### 5.7 Lifecycle (v1)

```
 provisional ──first lesson.started──► active ⇄ dormant (30 d no session: STOP building packs; device keeps its pack,
      │                                  │         shelf and notebook; welcome-back on return)
      │ 14 d no lesson → parent reminder │ 12 months inactive → notice (30 d, reminders at 30/7/1 d; any open wins)
      └─────────── parent "delete child" (any state) ──► erasing ──► (row gone; workspace_lifecycle receipt)
 orthogonal: paused (parent) · safety_hold (Conductor mode; never auto-exits)
```

The `notice → erasing` transition is one guarded UPDATE, so an app open between the notice and the timer wins
(ws R3.5). Erasure order: revoke the device docs (wipe flag) → set the workspace to `erasing` (fences every job
through `complete_job`, §3.8) → cascade delete → delete Blob prefixes → sweeper at +24 h and +7 d → receipt. The
parent promise: "removed now; backup copies expire within 7 days" (X15).

### 5.8 Library artefacts, shelf, and the module sandbox

Library artefacts live under `lib/<artifactId>/<contentHash>/` with no personal data and no child id in the path
(this corrects `forge-infra-azure`'s `forge/<childId?>/…`). Every `lib/` response carries
`Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'`,
and the host iframe sets the `csp` attribute as a second layer, because `sandbox` restricts no fetch [V WHATWG]
(ws R3.6, I17). Shelf use counts drive no-repeat logic and the parent's "what she played" list, nothing else
(no engagement model, NM-3).

---

## 6. School sync and homework help

### 6.1 v1 inputs (ss AR-6)

Three inputs ship. (1) Homework by **photo / "padh ke sunao" (read aloud) / typing**, offered as three equal
chips; read-aloud gives Hindi-medium children parity while Hindi handwriting OCR is gated (SS4). (2) "School is on
chapter X", from a parent pick or a child chip. (3) A test date plus chapters. Timetable entry is a tap grid. Test-
paper analysis, PTM remark parsing, the book-alias pipeline, colour masks and transcription-as-evidence are v2.

### 6.2 Capture and commit

```
 device: pick page → on-device quality check (blur/dark/glare/page/orientation) → createImageBitmap resize to 1,600 px
   → POST /api/capture (childId from session; ≤ 6 captures/child/learning day; governor reserve; parent gate for B1-B2)
   ← one create-only SAS per page blob (10 min)                           [Blob eastus2, private `captures` container]
   → PUT pages → POST /api/capture/:id/commit {pages:[{n, sha256, bytes}]}
 server: HEAD every blob (≤ 4 MB, hash, length) → capture_page unique(child_id, sha256) → ingest capture.committed
   → homework.extract job (priority 0) claimed INLINE by taxila-web under a job lease; a killed replica is re-claimed by the worker
 no commit within 15 min → blobs deleted. Raw delete after max(extract committed, session ended), 24 h hard TTL, soft-delete OFF
```

### 6.3 Pick-first extraction

1. **DI Read** (prebuilt-read, $1.50 per 1k pages [V Retail Prices]) on the whole page → lines with polygons.
   Layout ($10 per 1k) is used only for timetables and date sheets.
2. Code segments question boxes from the lines. The child taps one box, or says which one. While the page is read,
   the teacher asks which question felt hardest (ss AR-7.2), and that answer can pick the item.
3. Only the picked item is structured, by luna (`taxila-fast`, JSON schema). Every item must cite a region box.
4. **Mapping is a constrained choice** (SS5): code builds candidates from class + book + the pointer window (−3..+1).
   `auto` applies only when top-1 is in the pointer chapter; otherwise the child sees 2 chips. Free-text topic naming
   is never allowed.
5. **Key ladder (v1):** a kit item match (K1) or a code solver from a kit template (K2) gives a key with
   `may_talk_correctness = true`. Anything else is `process_only`: HL0-HL3 shapes plus "explain the idea" on a kit
   example, with no correctness talk. A single luna solve may produce a `leak_candidate` blocklist only (ss AR-1.2).
6. Budget targets [U]: boxes in ≤ 6 s p90 from India (M-SS7). ≤ ₹2 per sitting excluding voice (M-SS8). ≈ ₹0.72
   modelled.

### 6.4 Homework session state machine (v1; ss AR-9)

```ts
// shared/school/homework-v1.ts
export type HwEntry = 'photo' | 'read_aloud' | 'typed' | 'share';
export type HwStateV1 =
  | 'entry' | 'uploading' | 'reading_page' | 'picking' | 'mapping_ask'
  | { ladder: 'HL0' | 'HL1' | 'HL2' | 'HL3' | 'HL4' | 'HL5' }      // only with a kit/code key
  | 'process_only' | 'child_writing' | 'checking' | 'stuck_exit' | 'timeboxed' | 'done' | 'abandoned';
// picking → key(kit|code) ? {ladder:'HL0'} : 'process_only'                    (synchronous, < 50 ms)
// HL_n → HL_{n+1} only after a child turn WITH content; taps never advance
// 'pata nahi' ×2 → sideways to a smaller sub-step; 'just tell me' → HL4 (the isomorph IS the bottom-out)
// 2 wrong attempts → teacher offers help unasked; HL4 + one failed HL5 → stuck_exit
// any → timeboxed (homework sub-cap) ; any → abandoned (vibe 'stopped': let them go at once)
// state writes: update homework_session set state=$3, state_v=state_v+1 where id=$1 and state_v=$2  (CAS)
```

Item-type policy (ss §5.3): MCQ → elimination with reasons, never which option. Recall → point to the textbook
section. Long answers → a Socratic outline the child writes. Essays → structure feedback plus one sentence the child
rewrites. Projects → planning only (Forge never makes anything submittable). "Check my working" (computable kinds
only, v1): code re-evaluates the transcribed lines and says **where** ("line 3 dekho"), never the value.

### 6.5 The cascade turn loop and the leak guard

```ts
// server/homework/leakGuard.js (corrected; ss AR-2.2)
export function containsAnswer(text, key) {                      // key: { forms, intermediates, allowContexts }
  let t = normalise(text);        // lowercase; Devanagari digits → 0-9; Hindi/Hinglish/English number words; "saadhe";
                                  // "3 by 4" / "teen bata chaar" / 3/4 / 0.75 → canonical rationals
  for (const c of key.allowContexts.map(normalise)) t = t.split(c).join(' ⟂ ');   // REMOVE quoted spans, never exempt
  const nums = extractRationals(t);
  const hit = (f) => f.kind === 'number' ? nums.some(n => eqRational(n, f.value, f.unit)) : tokenMatch(t, f.text);
  return key.forms.some(hit) || key.intermediates.some(hit);   // H2: step values are blocked too
}
// turn: draft = luna(turn shape)  → containsAnswer? regenerate once naming the violation
//       → second hit: a fixed ladder shape from the kit (no model text) + homework.utterance_blocked event
//       → TTS (gpt-4o-mini-tts, same character voice by blind ear [U]) → speak
// isomorph validator (I11): answer(iso) ∉ key.forms; every operand differs from the school operand by > 1;
//       no isomorph number equals the school answer. Isomorphs come ONLY from code-parameterised kit templates.
```

Measured cascade latency: ≈ 0.58 s STT + 1.04 s first luna sentence + 0.27-0.32 s TTS TTFB from a US host (n = 5
[V `low-end-cascade-probe-2026-10-02.json`]), plus India↔eastus2 RTT [U]. That is acceptable for "let me look at your
sum". Report a false-block rate by band next to the leak rate (M-SS3: 0 spoken or screen leaks; false blocks ≤ 5% of
teacher turns in B1-B2).

### 6.6 Evidence and the school teacher

In v1, photos give **help only**. Evidence comes from the ladder's spoken and tapped attempts, tagged
`context='homework'`, down-weighted (start at 0.5 of the folded LR [U]), and never counted as the delayed success
that makes a skill pakka (DC5, H4). Taxila never contradicts the school teacher to the child (SS11). The stuck exit
gives the child a question shape to ask the school teacher, plus a parent-facing logistics card ("2 items left for
tonight; here is what was tried": dc AR-10.5, ss AR-7.6). A leak-recovery isomorph is *offered*, stays inside the
time box, and produces no evidence (ss AR-7.5). A copied-answer page gets the curiosity shape ("which one did you
like solving?") and the teacher never says answers were detected.

### 6.7 The school mirror is a fold (X26)

`state.school` holds, per subject, the last parent pick, else the last mapped homework chapter, plus a weekly
"school still on Ch 5?" chip. The chip is a Taxila-initiated ask with dedupe `school_ask:{guardian}:{isoWeek}`;
confirming something the parent just submitted is free (ss AR-8). Pointer votes are `school.pointer_vote` events.
SS1 "independent sources" means two different classes (child, parent, artefact, calendar).

### 6.8 Data (v1)

Tables: `capture`, `capture_page`, `homework_task`, `homework_item` (no key column), `homework_key`,
`homework_session`, `hint_event`, `ptm_note` (parent-private; never reachable from the ChildBrief builder, I4). The
DDL is `school-sync-homework.md` §8.3 with the AR-9 deltas applied verbatim (capture pages 1-12, `capture_page`,
`homework_session` with `lane in ('cascade','tap')` and `state_v`, `homework_key` with `may_talk_correctness`
generated from `source in ('kit','code')`, the `hint_event` FK). `child_id` is added to every child-scoped table for
the map test. Invariants I1-I11 (ss §8.3 + AR-9), including I7 `containsAnswer("34 + 10 = 44", {44, allow:["34 + 10"]})
=== true` and I10 (the `compile()` import graph cannot reach `homework_key`).

---

## 7. The parent loop and the parent agent

### 7.1 Position (PL1-PL3)

The parent talks to **the child's own AI teacher in a parent register** ("aap", PTM tone; one character, one
`compile()` with a parent floor; the AI disclosure opens every conversation and voice note). The agent coaches the
parent's role: talk about learning and its value, routines, process praise, a calm reaction to failure. It never
asks for homework help, re-teaching or answer checking (Hill & Tyson 2009 [V]; Barger 2019 r = −.15 [V]; Maloney 2015
[V]). It is a **worker under the Conductor**: it writes `parent.*` events and proposals, and never the plan, the
learner model or a lesson.

| lane | v1 | model | host |
|---|---|---|---|
| intake (P0-P10 slots, ≤ 8 min, offered at O9 **after** the child's first lesson: pl PA-21 C7) | text or voice | luna extraction; voice on realtime counts as the month's PTM | web (text); device-WebRTC + relayed routes (voice) |
| weekly letter | yes | code WeekStory + luna slot fill + lints; TTS voice note on tap | worker |
| PTM text | yes, ≤ 300 turns per child per month across guardians | luna + tools (structured cited output) | web inline ≤ 10 s |
| PTM voice | **1 included per month, 8 min** (X21) | rt-2.1 parent register; rt-2.1-mini is a PLM9 arm | device WebRTC; `/api/parent/ptm/tool` and `/turn` relayed |
| WhatsApp free-text "ask" lane | **deferred** (Meta's 2026 general-purpose-AI policy needs a BSP check [M]) | — | — |

### 7.2 ParentBrief and a claim-checker that can be built

`ParentBrief` (pl §3, ≤ 900 tok [U]) is a read model in which every element carries a `factId` resolving to a
ledger row: week facts, canDo (aa_gaya/pakka), working (+ what Taxila does), effort actions (counts, never minutes
first), school chapters and test windows, worries, commitments, care-note effects, transcript-access state,
`safetyHold`.

Claim-checking (pl PA-13):
- **Text lanes** return `{segments: [{text, cites: factId[]}]}` (JSON schema). Code then (1) verifies every cite is in
  this conversation's brief or tool results, (2) extracts claim tokens with a per-language lexicon (state words,
  numbers, dates, skill aliases from the curriculum graph) and requires them to agree with a cited fact, and (3)
  rejects uncited segments that carry claim tokens. A failure regenerates once; a second failure, or a checker
  error, falls back to the shape ⟨I'd rather check than guess; it will be in your next letter⟩ + `create_commitment`.
  It fails closed.
- **Voice** has no structured output. The instructions carry only brief facts. The lexicon post-check runs on the
  output transcript, and a miss produces a self-correction shape on the next turn plus an `incident`.

### 7.3 Weekly letter pipeline (job `parent.letter:{child}:{isoWeek}`)

```
 weekly_letter wakeup (parent's day/hour, jittered) ─► parent.letter job on taxila-worker
   1. cutoffAt = sendAt − 30 h (stated in the letter as a shape); evidence after it goes next week (X8)
   2. commitment.fulfil for every open commitment with due_at ≤ cutoffAt (in this job; no wakeup ordering: pl PA-11)
   3. WeekStory (code): facts · one concrete action · ≤ 2 canDo · ≤ 1 working · commitment results · home activity ·
      praise cue · routine fact (gap_days | ended_early with the REAL count; never from vibe: pl PA-6) · ≤ 1 need question
   4. luna fills wording slots only → PX lints + claim-checker → renders: card image, ≤ 5-line template text, app view,
      60-90 s voice script
   5. weekly_letter row (unique child_id, iso_week; ledger_hash is audit only; render_version for operator re-renders)
   6. notify(weekly_letter) → SEND-TIME gate (pl PA-7, PLI17): re-read safety hold, consent version, reports on/off,
      STOP, and that every factId still resolves (a deleted lesson → re-render)
 voice note: rendered lazily when "Suno (1 min)" is tapped (that opens the 24 h service window; audio cannot be a
   template header [V Meta]); gpt-4o-mini-tts speaks the lint-passed script verbatim; cached 30 d
 zero-lesson week: still sent on its day, no guilt framing; a ≥ 14-day gap after regular use becomes a fact line +
   one "time badlein / pause?" button (PL8; Rogers & Feller 2018 [V])
```

### 7.4 Home loop

At most one home activity and one praise cue per week (PL6, PX5). They are picked by code in the weekly intent from
a reviewed catalogue of ~20 rank 1-3 activities (`parentNeedsMaths: false` at the type level). Rank 1-2 activities
draw **only from canDo skills**, never from working ones (PLI18: the child's "explain it to Papa" moment must be one
she can win). Capacity is one writer: the parent declares a ceiling, and
`effectiveDial = max(0, declared − (last two feedbacks ∈ {no_time, skipped} ? 1 : 0))` is computed at pick time (pl
PA-15). The child hears the home-loop mention in the next lesson's wrap (PL11).

### 7.5 PTM

State machine as in pl §7.2: opening (disclosure) → agenda → questions ⇄ answering → commitments (≤ 2 new, read
back with "in your next letter") → closing. Any state → `safety_route` on a child-risk disclosure by the parent.
The agenda is **built in code** from the ParentBrief and the school fold in < 50 ms (no sol prep: pl PA-18). Tools
(pl §7.3) carry `factId`s, and none writes learner state. `create_*` and `propose_*` calls from one response run
**sequentially** (PA-5).

Voice transport (pl PA-3): the client relays `response.function_call_arguments.done` → `POST /api/parent/ptm/tool`
(the server binds convId → guardian → child from the cookie, never from args) and each output transcript →
`POST /api/parent/ptm/turn` (claim-check + lint → `{instructions?}` applied with `session.update`). The server refuses
tools after `startedAt + 8 min`. Function-call items are pruned from the realtime context after use. Admission
priority is below child reconnects and lesson starts; when the bucket is busy, the PTM offers ⟨text now⟩ or ⟨book a
time⟩ outside 18:00-21:30 IST (pl PA-17). A persistent "child present: can-do only" toggle is on screen (C8).

### 7.6 Alerts

| class | trigger (code) | v1 route | cap | parent can turn off |
|---|---|---|---|---|
| **S** safety | `safety.incident` | `safetyParentNotice()` below → pointer push behind the PIN + delivery ladder; human queue | none | no |
| **W** wellbeing | `child.wellbeing_statement` (explicit statements only; ages 10-15 are asked first: PL9) | in-app note + WhatsApp pointer, `notBefore` = quiet end | ≤ 1/week coalesced (`wb:` slot) | detail level only |
| **L** struggle | wheel-spin on a worry/focus/test-window skill persisting ≥ 2 sessions after an approach change; readiness < 50% pakka ≤ 7 days before a confirmed test | **letter line only** (push deferred: X27). Never within 24 h before a test. The child is told (`parentToldAbout`). Each L line carries the calm-reaction cue | 1 per 14 days, counted **by class** (pl PA-7a) | yes |
| **R** routine | ≥ 14-day gap after ≥ 3 regular weeks; ≥ 3 of the last 5 lessons ended `child_left` before half (the real count) | letter line + one button; the Conductor first re-plans (shorter segments, choice-first) | in the letter | hide lines |
| **C** commitment | due date reached | letter (or the PTM summary) | in the letter | no |
| **A** account/payment | billing | WhatsApp | per event | no |

```ts
// shared/parent/safety-gate.ts (pl PA-1). Runs on safety.incident AND safety.incident_updated; idempotent per incident.
export function safetyParentNotice(i: SafetyIncidentView, now: Date, phase: 'M0' | 'M1'): 'wait' | 'send' | 'human' | 'none' {
  if (i.category === 'moderation_flag') return 'none';
  if (i.humanDecision) return i.humanDecision === 'notify_parent' ? 'send' : 'none';
  if (phase === 'M0') return 'human';                                         // M0: EVERY S notice goes to the human (X23)
  if (i.familyImplicated !== 'no' || ['abuse', 'neglect', 'violence_at_home'].includes(i.category)) return 'human';
  const settled = !!i.protocolScriptClosedAt || now.getTime() - Date.parse(i.openedAt) >= 10 * 60_000;   // [U: advisor sets]
  return settled ? 'send' : 'wait';                                          // 'wait' schedules safety_settle at openedAt + 10 min
}
// notification dedupe `S:${incidentId}`; push text names nothing ("please open the app and enter your PIN")
// 'human' → safeguarding queue: page on entry; unacknowledged 2 h → escalate to a second named adult (orch R4)
// residual risk, stated: familyImplicated flips to 'yes' AFTER a send → P0 incident + page
```

The child-side floor never waits: the teacher gives care and the helplines (Childline 1098, Tele-MANAS 14416) on the
turn the statement arrives, and never promises secrecy. **Delivery ladder** (pl PA-2): WhatsApp pointer + app push →
no delivered receipt in 5 min → SMS (TRAI DLT registration has a lead time [M]) or an ACS PSTN call [M: India
availability] → nothing acknowledged in 30 min → "parent unreachable" in the human queue. The parent is told "if
WhatsApp is blocked we try SMS or a call", never "safety messages always come".

### 7.7 Proposals answer with what happened

```ts
type ProposalResult = { status: 'adopted'; effectiveFrom: string }
  | { status: 'rejected'; reason: 'band_cap' | 'school_hours' | 'bedtime' | 'focus_cap' | 'prereq_first' }
  | { status: 'pending'; reviewBy: string };          // only if the inline step lost the lease
// propose_* = ingest event + ONE inline step() (≤ 10 s) → result → answer shape. effectiveFrom is never "now" for
// anything already shown to the child (pl PA-12, PA-21 C9).
```

### 7.8 Commitments, care notes, declines, teen trust

- `create_commitment()` (pl PA-5 SQL) locks `child_seq` for the child, checks ≤ 4 open per child and ≤ 2 per
  conversation, inserts, and ingests `parent.commitment_created` in one transaction (PLI13: 8 concurrent creators
  never exceed 4). `dueAt` snaps to the cutoff of the letter that will report it. Every commitment is reported as
  fulfilled or missed, with the reason (PP10).
- Care note (P9): parent-authored, ≤ 160 chars, ≤ 30 days, renewable once (`renewed_from uuid unique`), readers
  filter `expires_at > now()`. Effect `gentle_mode` only; `avoid_topic` is dropped (pl PA-16, PA-20).
- The agent declines harmful requests, each with an alternative (pl §9.1): threats, pressure scripts, comparison,
  bribes, hours past the cap, homework answers, teen surveillance.
- **Teen trust** (pl PA-21 C6, PLI15): nothing a parent *said* reaches the ChildBrief except plan weights, the
  care-note effect and the home-loop mention. The teacher never says ⟨Mummy told me…⟩. A 10-15 child can open "What
  Mummy-Papa see". Turning transcript access on notifies the child that week.
- Guardian roles in v1: owner + viewer (pl PA-20).
- Support: `open_support_ticket` reads `support_rota`; with no covering row it returns `slaHours: null` and the honest
  shape ⟨logged; you'll get a reply by email⟩ (PLI19).

### 7.9 Data

`parent-loop.sql` with these deltas: `create_commitment()`; `care_note.renewed_from` (drop `renewed`);
`weekly_letter.render_version`; `parent_alert` remains the candidate table and points at `notification.id`;
`wa_inbound(message_id pk, guardian_id, received_at, handled_at)`; `support_rota(kind, covered_until, sla_hours)`. The
SQL header comment is reworded to "child and parent audio is never stored; generated teacher audio is a TTL asset".

---

## 8. Worker and job infrastructure on Azure

### 8.1 Hosts

| host | what runs there | must not run there |
|---|---|---|
| **`taxila-web`** (ACA, existing; min 1 / max 5, HTTP scale at 50 concurrent; pooled Neon URL) | all routes; the Director turn; ingest + **one inline `step()`**; `/api/lesson/start` admission; sync apply; code planner; `forge.spec`/scene inline; homework extraction while the child waits (job-row backed); PTM text turns and relayed voice routes; WhatsApp inbound ack | anything > 10 s after the response; timers; sockets that must outlive a request (SIGTERM → 30 s → SIGKILL on scale-in [V]) |
| **`taxila-worker`** (new ACA app, same image, entrypoint `node server/worker/main.mjs`; min 1 / max 2; no ingress; **direct** Neon URL) | leader-elected ticker (`pg_try_advisory_lock(hashtext('taxila:ticker'))` held on a dedicated session); the **dirty-set step loop** (§3.9, X30); fast + slow claim loops, polling 1 s while busy and 5 s when idle (X35). `pg_notify('job_ready')` may be sent from this direct connection inside a committing transaction as a hint only, and correctness never depends on it [V Neon: no LISTEN/NOTIFY through the pooler]. Also: letter fan-out; voice-note TTS; WhatsApp inbound processing; `memory.*`, `kt.refold`, compaction, erase/export; safety settle and escalation timers | realtime observer sockets (X37) |
| **`taxila-observer`** (new ACA app at **M1**, same image, entrypoint `node server/observer/main.mjs`; no ingress; scaled on live-lesson count; no leader) | one observer WebSocket per live lesson (§9.4): metering and the staleness SLI, read-only | anything else, so a worker revision roll never drops every observer at once (obs B29) |
| **ACA scheduled jobs** (cron in **UTC** [V]) | `canary` `*/30 * * * *` (text modality 47/48 runs, audio once a day); `nightly` `30 21 * * *` (03:00 IST: rollups, DRS, writer census, cost reconcile; `replicaRetryLimit ≥ 1`, idempotent per day) | they exist so the detectors don't die with the worker they watch (obs V1, V4) |
| **ACA jobs** (Forge render, (gap-fill G2-content-orchestration-media)) | `forge.explainer`/`forge.animation{renderer:'seek'}`: headless Chromium + ffmpeg on our own player and JSON (trusted code), ≈ $0.005 per video-minute | LLM-written code (that is the sandbox's) |
| **ACA manual jobs** | G4-G6 batteries started by CI with an image tag (≤ 3 h); `--content` operator reads (Entra-authenticated start) | — |
| **ACA Sandboxes / dynamic sessions** (M3) | Forge T3 builds and codex-written Manim renders: egress denied, Hyper-V isolation, headless validation, human review before library. Custom-container pool kept at **0 ready sessions outside 23:00-05:00 IST** (≈ $5.2/day per warm 2 vCPU session [I]) (gap-fill G2-content-orchestration-media) | anything per child |
| **Vercel** | **nothing.** `api/[...route].js` stays a shim and hosts none of this | ticker, sideband, fan-out (300/800 s caps; `waitUntil` shares the function timeout [V]) |

Worker shutdown contract: on SIGTERM, stop claiming, release the ticker lock, let in-flight jobs heartbeat for
≤ 25 s, then exit. Anything still running is recovered by lease expiry, and checkpointed steps skip paid calls on
resume (orch R1). Tracing is suppressed around the idle claim query (obs V2.3).

### 8.2 Job kinds

| kind | lane / host | prio | idem key | model → fallback | deadline / notes |
|---|---|---|---|---|---|
| `memory.consolidate` | fast / worker | 1 | `memory.consolidate:{lessonId}` | luna → skip (no memory written) | consent `P3` re-checked at claim + steps |
| `memory.nightly` | slow / worker | 3 | `memory.nightly:{child}:{day}` | pure SQL decay | active children only |
| `kt.refold` | fast / worker | 1 | `kt.refold:{child}:{fromTs}` | code | `not_before_lesson_end` |
| `homework.extract` | inline on web, job-row backed | 0 | `hw.extract:{captureId}:{extractV}` | DI Read → "padh ke sunao" | 6 s to boxes |
| `capture.raw_delete` | slow / worker | 2 | `rawdel:{captureId}` | — | ≤ 24 h TTL |
| `forge.admit` (gap-fill G2-content-orchestration-media) | slow / worker | 2 | `forge.admit:{window}` | code (knapsack: content-orchestration §6) | every 15 min, night every 5; review-seconds admitted (X54) |
| `forge.horizon` (gap-fill G2-content-orchestration-media) | slow / worker | 3 | `forge.horizon:{day}` / `:{isoWeek}` | code | nightly 22:30 IST (`two_weeks`, demand-ranked prefetch X57); Sunday (`term`, H0 catalogue) |
| `forge.spec` (promote) (gap-fill G2-content-orchestration-media) | fast / worker | 2 | `forge.spec:{libraryKey}` | luna re-fill + validate → reject | publishes a served live fill (X50) |
| `forge.scene` (near-line T2b / free-form explainer) (gap-fill G2-content-orchestration-media) | fast / worker | 0 | `forge.scene:{libraryKey}` | brain → luna → T2a | only with need-by ≥ 45 s; single-flight per key |
| `forge.prefetch` (library, topic-level) | slow / worker | 3 | `forge.prefetch:{libraryKey}:{modelV}` | luna/image within `budget(global, forge, day)` | **ranked by cohort demand, not the calendar** (X57) (gap-fill G2-content-orchestration-media) |
| `forge.image` | slow / worker | 3 | `forge.image:{libraryKey}:{style}:{modelV}` | gpt-image-2 medium → low → SVG / none | `azure:image ≤ 3` bucket (4 RPM quota); night only (X52) |
| `forge.build` (T3) | sandbox (M3) | 3 | `forge.build:{libraryKey}` | codex → existing engine | **offline only**, from `forge_request` demand, review-admitted, → human review; 24 h cool-down after 2 gate fails (gap-fill G2-content-orchestration-media) |
| `forge.explainer` (gap-fill G2-content-orchestration-media) | ACA job / worker | 3 | `forge.explainer:{libraryKey}:{lang}` | sol plan + Azure Speech narration → template-only core | library; narration is a per-lang layer beside the core |
| `forge.animation` (gap-fill G2-content-orchestration-media) | ACA job (seek) / sessions (Manim, M3) | 3 | `forge.animation:{libraryKey}:{renderer}:{lang}` | Manim → explainer seek MP4 → none | **M3 video** (X55): ≈ $0.10 per Manim segment, ≈ $0.005 per MP4 minute; two-key for chapter video |
| `forge.chant` (gap-fill G2-content-orchestration-media) | slow / worker | 3 | `forge.chant:{kitId}:{v}:{voice}:{tempo}` | Azure Speech → human-clip queue (ङ ञ ण, conjuncts) | ASR phonMatch 1.0 + native-ear lang key (X56) |
| `forge.jingle` (gap-fill G2-content-orchestration-media) | slow / worker | 3 | `forge.jingle:{kitId}:{tuneId}` | code fit → chant only | L1-L5 recitation lint; lang + kid_ux keys |
| `forge.video` | — | — | — | **sora-2 retires 2026-10-15 [V re-checked (gap-fill G2-content-orchestration-media)]**; `allowed_model` refuses publish from that day | replaced by `forge.animation` + stills-with-motion; optional pre-retirement batch D-VIDEO |
| `forge.sweep` (gap-fill G2-content-orchestration-media) | slow / worker | 3 | `forge.sweep:{day}` | SQL (`SKIP LOCKED`) | nightly; expires waiters and `module_ready` rows |
| `parent.letter` | fast / worker | 2 | `parent.letter:{child}:{isoWeek}` | luna slot fill → template from facts | cutoff send − 30 h |
| `parent.voice_note` | fast / worker | 1 | `voice:{letterId}:{renderV}` | gpt-4o-mini-tts → text only | on tap |
| `parent.inbound` | fast / worker | 1 | `wa:{messageId}` | — | ack < 1 s on web |
| `report.ptm_summary` | fast / worker | 2 | `ptm.summary:{convId}` | luna (from tool results only) → template | — |
| `notify.send` | fast / worker | 0 (S) / 2 | `notification.id` | — | `notBefore`/`notAfter` |
| `plan.day.llm` (M2, shadow) | fast / worker | 3 | `plan.llm:{child}:{day}:{inputsHash}` | luna → none (shadow) | active in 7 d only; jittered |
| `ws.compact`, `ws.erase`, `ws.export` | slow / worker | 2-3 | page id / `data_request.id` | — | erase purge < 24 h |

`conductor.step` is **not** a job kind (X30). Conductor latency (ingest → decision p95 < 2 s, CM1) comes from the
inline `step()` on `taxila-web` plus the dirty-set loop (§3.9). `JobKind` in `shared/conductor/jobs.ts` must not
contain it, and the I-R2 census does not expect one.

### 8.3 Admission and rate buckets

```sql
create table rate_bucket (deployment text primary key, capacity int not null, tokens real not null,
  refill_per_sec real not null, refilled_at timestamptz not null default now());
-- take one token with priority headroom: p0 reconnect may take the last token; p1 lesson start leaves 1; p2 PTM voice leaves 2
update rate_bucket
   set tokens = least(capacity, tokens + extract(epoch from now() - refilled_at) * refill_per_sec) - 1, refilled_at = now()
 where deployment = $1
   and least(capacity, tokens + extract(epoch from now() - refilled_at) * refill_per_sec) >= 1 + $2   -- $2 = headroom(priority)
returning tokens;
```

Buckets: `taxila-realtime` (session starts; 10 RPM today: refill 10/60 s, capacity 10); `taxila-image` (≤ 3 concurrent
against 4 RPM); `taxila-brain` (homework check-my-working crops at priority 1, above Forge, below lesson starts: ss
AR-1). One pending admission per **device**, so siblings tapping twice don't double-book (orch R7.8). Waiting clients
poll every 2 s during the off-voice warm-up.

### 8.4 Storage and identities

| account / container | contents | access |
|---|---|---|
| `taxilaforge` (existing, public read, CORS GET *) | `lib/` library artefacts only, behind Front Door | CSP header on every object (§5.8). Never any child data |
| `taxilaws` (new, eastus2, private) | `nb/` notebook snapshots (ZRS), `cr/` creations (ZRS), `ex/` exports (7 d), `pk/` personal pack parts, `captures` (LRS, soft-delete off, 24 h TTL) | user-delegation SAS minted by the API, short-lived |
| `taxilaobs` (new, private, no CORS, `allowBlobPublicAccess=false`) | model-output cassettes `cassette/{child_ref|synthetic}/{lesson|job}/{step}#{attempt}.json`, 35-day lifecycle | workers only (obs V2.4) |
| Foundry | the production resource `raghavsharma1729-compan-resource` (eastus2); **a separate eval/red-team resource** | eval batteries never share production quota or abuse-monitoring identity (obs B17) |
| Document Intelligence | **not yet provisioned**: record it in `context/decisions.md` with its region before M1 (ss AR-5) | — |
| ACS Advanced Messaging (WhatsApp) | weekly letters, S pointers, inbound via Event Grid | Meta business verification + templates (M1 lead time) |

### 8.5 Single points of failure (merged orch R4, dc AR-8, ws R2, obs V4)

| SPOF | v1 mitigation | later |
|---|---|---|
| one Neon compute (ingest, Director, queue, governor) | device keeps the last brief + an outbox; the Director degrades to "no evidence this turn"; lesson start fails before the call connects; a read replica for dashboards and ops at > 5k DAC | cells (ws W9) |
| one realtime deployment (eastus2, 10 RPM) | lower lanes and tap; the quota request filed before any cohort > 30 (§10.5) | a second deployment in **Sweden Central** (the other supported region [V this session]) behind the admission bucket; quota is pooled per subscription, so this buys availability, not quota |
| one human clears `safety_hold` and reviews S notices | page on entry; 2 h escalation to a **second named adult**. Every incident holds the app until D-SAFE rules on a severity split (X33), so this human's latency is the child's wait: the hold screen must stay warm and useful (1098/14416, a calm activity), and D-SAFE must name the acknowledgement target | staffed rota |
| one human reviews Forge T3 | T1/T2 carry v1; review seconds are admitted against capacity and the queue is ordered by SLA, then demand × horizon weight (X54) (gap-fill G2-content-orchestration-media) | reviewer rota incl. a native Hindi ear (D-REVIEW) |
| `taxila-worker` | min 1, leader election, lease recovery, piggyback drains, inline `step()` on web; detectors live in scheduled jobs; observers live elsewhere (X37) | max 2-3; split the slow lane into ACA jobs on CPU contention |
| `taxila-observer` (M1) | a lost socket falls back to device usage bounded by wall time (§9.4), counted as `observer_gap_s`; deploy freeze 18:00-21:30 IST | — |
| App Insights as the only alert path | the canary also writes `eval_run`; the nightly job runs a second absence check and emails | — |
| one ACA environment (eastus2) | accepted for v1; logged with a reversal condition (paying users > N) | second region |
| WhatsApp number quality | tier-aware scheduler, quality alarm, SMS/call ladder for S | a safety-only sender [M] |

---

## 9. Observability, evals and the cost governor

### 9.1 Two planes (obs O1, O2)

The **ledger** (Neon: `student_event`, `decision_log`, `job`, `agent_run`, `model_call`, `turn_trace`, `cost_ledger`,
`eval_*`, `exposure`) is never sampled. It is the record for replay, cost and evals, and it is written in the same
transaction as the decision it records. **Telemetry** (`@azure/monitor-opentelemetry` on both apps → App Insights) is
for latency, errors and alerting. Both carry `correlation_id` and the W3C `traceparent`. Telemetry is content-free:
the OTel GenAI content attributes stay off, spans carry ids, codes, counts and hashes, and a lint plus a runtime
scrubber enforce an attribute allow-list. There is no HMAC pepper (X25).

### 9.2 `modelCall` (obs V2.1)

Every model call goes through one wrapper with three modes: `live`, `replay` (cassette only; a miss throws
`CassetteMiss`; a shadow ledger; never the governor or production rows) and `eval` (`budget.scope='eval'`, eval
deployments). It has a `try/finally` that settles or releases the reservation, writes the `model_call` row, ends the
span, and increments the unsampled counter. **Order inside the `finally` (X38; obs B27):**

```js
// server/obs/modelCall.js (the finally block only)
} finally {
  try { await governor.settle(res, usage ?? { released: true }); }     // 1. money first, in its own try
  catch (e) { counter('obs.settle_failed').add(1); }                    //    a failed settle stays reserved (errs toward degrading, never
                                                                        //    toward overspend); the nightly cost reconcile releases it
  try { await ledger.insertModelCall(row); }                            // 2. best-effort on the agent path
  catch (e) { counter('obs.ledger_write_failed').add(1); }              //    the writer census (§9.11) catches a silent gap
  span.end(); counter('taxila.model_call').add(1, attrs);               // 3. never throws
}                                                                        // the ORIGINAL error (if any) propagates unchanged
```

Director calls draw on the **lesson-block reservation** and stage their rows into the Director's single turn commit,
so the lesson never waits on observability. That commit is **optimistic** (X39; obs B28): the turn reads
`lesson_state.version`, holds no lock across the classify/compile model calls, and commits with
`update … where version = $v`. On a conflict (a late turn, or a resume on another replica) it re-folds the newer turn,
which is pure and cheap, instead of waiting. So no live lesson pins a pooled connection at the 19:00-21:00 peak.
The KT ledger write inside that commit still takes the short workspace lock of §5.6, and only at commit time.
`CompileManifest`
(`compilerV, coreHash, kit@v, itemId, moveId, briefHash, expArms, budgetTok, assembledTok, sha256`; `vibeHash` dropped:
obs V2.8) is logged on 100% of calls. Classifier JSON goes inline in `model_call.output`.

### 9.3 Traces, sampling and anomalies

- A lesson has no 25-minute span. `/api/lesson/start` opens a short root span and stores its `traceparent` on the
  `lesson` row; every turn on any replica is parented to it as a remote context (obs V2.2).
- Sampling is `samplingRatio: 1.0` at v1 (≈ 0.6 MB per child-day including auto-instrumented `pg`/`http` spans; inside
  the 5 GB free tier up to ~250 DAC [U]). Move to 0.25 at ~500 DAC. Use one sampler, not two.
- Anomalies are **counters** (`taxila.anomaly{class, sev, build}`), because metrics are never sampled and logs of
  unsampled traces are dropped [V Azure Monitor] (obs V2.3).

### 9.4 Realtime metering (obs V2.5; M1)

`/api/realtime/token` proxies the SDP negotiation, reads `call_id` from the `Location` header, and **`taxila-observer`**
(X37) connects `wss://<resource>.openai.azure.com/openai/v1/realtime?call_id=<id>`, which "can record the WebRTC call
and even control it by issuing session.update events" [V this session]. `response.done` usage becomes
server-observed. `cost_ledger` gets `source_event_id` with `unique (lesson_id, source_event_id)`: observer rows win,
and device rows for the same `response_id` are dropped. While the observer is down, device usage is booked, bounded
by wall time × max tokens/s, and `observer_gap_s` is counted (OM5′). Staleness is stamped with the server event's
own time where the event carries one [U: field presence to check], not with the observer's local receive time,
which a busy event loop delays (obs B29). Whether the Director's `session.update` moves server-side is decided
after OM16, not before.

**M0, before the observer exists** (X40; obs B30): the device logs, per turn, when it applied the Director's
`session.update` and when the next `response.created` arrived. This is a client clock, so it is untrusted and
reported only in aggregate, as a **provisional OM16**. The observer's timestamps replace it at M1.

### 9.5 Cost governor

```sql
create table budget (scope text not null, scope_id text not null, period text not null, unit text not null,  -- 'micro_usd' | 'voice_sec:<lane>'
  limit_amount bigint not null, reserved bigint not null default 0, spent bigint not null default 0,
  primary key (scope, scope_id, period, unit));            -- scope: child | tier | global | deployment | forge | eval
-- reserve (fails closed → the next degrade rung, never an error)
update budget set reserved = reserved + $5
 where scope=$1 and scope_id=$2 and period=$3 and unit=$4 and spent + reserved + $5 <= limit_amount returning *;
create table cost_ledger (id bigint generated always as identity primary key, child_id uuid references child(id) on delete cascade,
  job_id bigint, lesson_id uuid, kind text not null, model text not null, units jsonb not null, micro_usd bigint not null,
  reservation_id text, source_event_id text, correlation_id text not null, at timestamptz not null default now());
create unique index cost_ledger_once on cost_ledger (lesson_id, source_event_id) where source_event_id is not null;
create table price_book (deployment text, unit text, micro_usd_per_unit numeric not null, valid_from timestamptz not null,
  valid_to timestamptz, source text not null, primary key (deployment, unit, valid_from));
```

- **Lessons reserve per 5-min block** (voice seconds on the granted lane + Director text), settled per block from
  observed usage. Global and deployment ceilings are enforced from per-replica in-memory counters synced every 10 s
  (bounded overshoot). The exact Postgres bucket is kept only for realtime session starts (orch R3.3).
- **Jobs reserve per call** against a **per-job total across attempts** (orch R3.5).
- Thresholds at 80% and 100% emit `budget.threshold`. The child is never told about money.
- **Degrade ladder** (allowed models only; I-R8). Every rung keeps verified kit answers, the hint ladder and the safety
  floor:

| work | rung 0 | rung 1 | rung 2 | floor (zero marginal model cost) |
|---|---|---|---|---|
| teacher voice (chosen at lesson start) | `taxila-realtime` | realtime-mini (drills only; rejected as the primary teacher) | cascade (luna + gpt-4o-mini-tts) | tap + cached narration |
| homework conversation | cascade | — | — | read-aloud/typed + fixed kit shapes |
| day plan | code planner | — | — | code planner |
| module | library hit | T1 params (luna) | kit default engine | static worked example |
| illustration | library | gpt-image-2 medium (prefetch only) | low | SVG / none |
| letter | luna slot fill | — | — | template from facts |
| video (gap-fill G2-content-orchestration-media) | library MP4 / chapter video | explainer clip (DSL + narration) | stills with motion | voice description |
| animation (gap-fill G2-content-orchestration-media) | library explainer core (performed) | T2a explainer template (live, with lookahead) | static diagram sequence | voice + anchor |
| near-line scene (T2b) (gap-fill G2-content-orchestration-media) | `module_ready` | T2a template | T1 engine | kit worked example |
| song / chant (gap-fill G2-content-orchestration-media) | `jingle@1` | `chant-track@1` | teacher-led call-and-response | text list |
| T3 game (gap-fill G2-content-orchestration-media) | library core + G1 fill | G1 kit default levels | T1 engine practice | tap items from the kit |

- **Unit economics** [I/U; to be replaced by CM6 from `cost_ledger`]:

| line (per child-month, ~12-20 active days) | estimate | source |
|---|---|---|
| Conductor background (code planner, consolidation, letters on luna) | ≈ $0.29 | orch §9.1 + R3.4 |
| workspace (Neon, Blob, CDN, sync) | ≈ $0.02-0.04 | ws §4 |
| parent loop without voice PTM (letters, text PTM, lazy TTS note) | ≈ $0.1 | pl PA-8 |
| homework v1 (DI Read + luna, ₹0.72 per sitting × 12) | ≈ $0.09 | ss AR-1 |
| **subtotal before teacher voice** | **≈ $0.5** | |
| ₹299 tier, if AI + infra are held to 60% of revenue ($1.87) | leaves ≈ $1.37 for voice = **16 realtime min**, or 64 mini min, or 176 cascade min | `LANE_USD_PER_MIN` |
| one B2 day of realtime-eligible segments (12 min) | ≈ $1.05 | §4.3 |

So the owner's decision **D-PRICE** (§10.5) sets `TierConfig.voiceSecMonth`. The governor makes whatever is chosen
hold. Nothing in this spec assumes a price.

### 9.6 SLOs and SLIs [U: starting bars]

| SLI | SLO | note |
|---|---|---|
| **instruction staleness** (teacher response to turn n+1 created before the Director's instructions for turn n were applied) | ≤ 2% of turns over 28 d | the child-facing failure (obs V6.1). Observer-measured from M1; provisional client-clock aggregate at M0 (X40). A stale answer-sensitive turn makes the next compile carry a corrective move |
| ingest → decision | p95 < 2 s | CM1 |
| unfired wakeup lag | p99 < 2 min | CM8 |
| first screen paint from the cached plan | < 300 ms | orch R7.9 |
| tap "start" → the teacher's first word | measured; the first sound is a local clip within 1 s (low-end rule 4) | V6.3 counter |
| admission wait at 19:00-21:00 IST | p95 measured (CM5/CM11) | warm-up covers it |
| jobs `dead` | < 0.1%/day | dead-letter dashboard |
| notifications outside the window, learning messages > 2/week, safety notice sent while `familyImplicated ≠ no` without a human decision | **0 (hard)** | invariants |
| cost per child-day within tier | hard (budget-enforced) | D-COST |

Child-moment counters (content-free, aggregate, never optimised): admission waits shown, reconnects per lesson,
mid-utterance cut-offs, "phir se bolo" repeat requests per 10 teacher turns, lessons left before the planned end by
minute (obs V6.3). Alerting at launch traffic: an SLO alert needs ≥ 20 events in the long window *and* the burn
condition. Below ~1k DAC, availability alerts are tickets, and only canary failure and safety counters page (obs V6.4).

### 9.7 Learning metrics (obs O5, V2.7)

The north star is **DRS-7 / DRS-28**: per child-skill, the first scheduled check ≥ 20 h after `learned_today`, in
1-7 d / 21-35 d. Success = C0 (independent, correct, no hint). It is always reported with **coverage**, and a
low-ASR first check makes the child-skill *uncovered* (never substituted by a later, already-taught attempt). Also
tracked: transfer pass rate, mastery precision (≥ 0.9 target), level gain per strand per 30 d, and a quarterly
external anchor probe. The answer-leak rate and mastery without delayed evidence must stay at ~0. Minutes,
sessions and streaks are **anti-metrics**. Cost is also shown per DRS success, next to cost per minute.

### 9.8 Gates: `scripts/verify-release.mjs`

`package.json` already declares `"verify": "node scripts/verify-release.mjs"`, but **the file does not exist** [repo].
That is the inherited `gates-that-live-nowhere` failure. M0 creates it. It runs from the real source, prints every
failure together, records an `eval_run` row per gate keyed by `build_sha`, and every gate carries an in-run negative
control:

| gate | runs | negative control |
|---|---|---|
| G0 | `npx tsc -b && npx vite build && npm test` | — |
| G1 prompt budget | every `compile()` lane at max inputs; turn-shape rule LAST | a 2× brief must fail |
| G2 predicates | AI-honesty, 1098/14416 present, notification lexicon, unconstructible banned classes, telemetry allow-list, safeguarding exclusion | a planted violation per predicate |
| G3 determinism + invariants | §9.9 registry; double-compile byte identity with a frozen clock; L2 replay of fixture days; the lock-order probe (`conductor-lock-order-rev2-probe.sh`) against a scratch PG 16 with the real migration's functions | `Date.now()` injected into `compile` must fail; a deleted cassette entry → `CassetteMiss` with 0 Azure calls; the revision-1 `child_seq`-first commit must deadlock; a replay given a write handle must trip I-R9 |
| G4 day simulator | `evals/conductor-sim/`: 8 seeds × 6 personas × 4 simulated weeks, tables diffed vs `main`; plus (gap-fill G1-adaptation-policy) the adaptation personas of adaptation-policy §8.4 over 8 weeks, including `latch_walker`, and the `planDay` determinism property (I-A4) | a persona with a planted absence-nudge rule must trip; each adaptation persona's planted rule must trip its named V/I-A gate; the 1/1, r=1 strain latch must trip I-A3 |
| G5 lesson battery | SimChild × Director (per-PR subset of 96 lessons ≈ $2-4; full nightly on the eval deployment on path-map trigger) | a "leaky" Director must fail the leak bar |
| G6 Tutor Bench | deterministic axes per change; human panel on a cadence | the rejected brevity-by-instruction build must score below the bar |
| G7 voice floor | `evals/realtime-audio-in.mjs` + WebRTC harness | a 300 ms silence config must produce cut-offs |
| G8 live probes | canary lesson + writer census on the canary's rows | — |

Path map: Conductor changes → G3, G4. Prompt/compile → G1, G2, G3, G6. Director policy → G3, G5, G6. Realtime config
→ G7. Model deployment or version → G5, G6, G7. Telemetry → G2.

### 9.9 Invariant registry (each with a negative control; "if your change trips them, your change is wrong")

| id | predicate | from |
|---|---|---|
| I-C1 | no notify intent of class absence/streak/come_back/offer/countdown can be constructed (type-level + runtime) | orch §12 |
| I-C2 | no learning notification outside the guardian's window or beyond 2 per child-week; safety bypasses both but never the protocol gate | orch §12, dc AR-6 |
| I-C3 | no lesson start outside `learning_window`/`free_day`, in `paused`/`safety_hold`, or past `conductor_usage.cap_min` (two concurrent starts never reserve past the cap) | orch, dc AR-5 R4 |
| I-C4 | in `safety_hold` only safety-protocol commands are emitted | orch |
| I-C5 | replaying any event twice yields identical state and no new commands | orch |
| I-C6 | `decide` is byte-deterministic; a replay reads only recorded inputs (I-R3) | orch R2.8 |
| I-C7 | `spent + reserved ≤ limit` for every budget scope at every step | orch |
| I-C8 | no job of a revoked consent purpose is claimed, or commits a child-facing effect, after revocation | orch, R2.6 |
| I-R1 | the folded events equal the committed events under concurrent ingests with random commit delays (fails on an identity seq) | orch R8 |
| I-R2 | no fired wakeup without its `clock.wakeup`; no done/dead child job without its `job.*` event | orch R8 |
| I-R4 | no authority-class event is quarantined past | orch R2.9 |
| I-R5 | no `forge.build` result reaches a device without `forge_artifact.reviewed_by` | orch R3.1 |
| I-R6 | no re-plan changes a shown or started slot; no unexpired promise lapses silently | orch R7 |
| I-R7 | no lesson changes lane/rung mid-lesson except `reason='outage'` | orch R7.7 |
| I-R8 | no job input or model call names a model outside the `azure-only-compute` list | orch R3.6 |
| I-R9 | replay mode performs **zero writes** (a write-counting DB shim reads 0) | orch B5, X31 |
| I-R10 | no SQLSTATE `40P01` across 8 seeds of the simulator's concurrent-ingest + job-completion + ticker persona, with the substrate shim enforcing the X29 order | orch B1, X29 |
| I-R11 | the idle hang-up never fires on a turn with a confident child transcript (a planted off-topic child utterance must not hang up) | orch B6, X32 |
| I-R12 | after 14 days without `app.opened`, no `day_start`/`night` wakeup is re-armed; a parent-chosen wakeup is never dropped | orch B10, X36 |
| I-V1..V27 | the plan validator rules (§4.5; V15-V27 from gap-fill G1-adaptation-policy) | dc, orch, adaptation-policy |
| I-A1 | (gap-fill G1-adaptation-policy) no knob takes a value from a layer outside `MAY_PROPOSE`. **Control:** a vibe rule proposing `reviewShare` .15 is blocked `layer_not_permitted` (`adaptation-worked-example.mjs`) | X44 |
| I-A2 | every constraint passes `registerConstraint`, and there are 0 `empties_domain` drops among constraint layers in G4. **Control:** an empty budget domain, and a budget bound on minutes, are refused | X44 |
| I-A3 | per latch, under steady personas: oscillation mean ≤ 0.6 and p90 ≤ 2 flips per 8 weeks (measured R1 0.49 / 2.0; R2 0.32; R6 0.19). **Control:** the 1/1, r=1 latch (9.9 flips) | X45-X47 |
| I-A4 | `planDay` is byte-deterministic in `inputs`; equal `inputsHash` ⇒ equal plan bytes; preference insertion order is irrelevant. **Control:** `Date.now()` in `planDay`; an unsorted array before hashing | X43 |
| I-A5 | no firing reads a stale key (V25). **Control:** `stale_refit` (a 40 h old `kt.eta` = +.9) must not move pace | X41 |
| I-A6 | `foldNight` is idempotent and runs once per learning day, with catch-up. **Control:** a fold counting nights instead of closes | §3.3 |
| I-A7 | no adaptation raises `plannedMin`, the cap or the praise dose (V26). **Control:** +5 min when η > .5 | §4.4 |
| I-A8 | `vibeClose` never reaches a parent surface or the routine card (V27). **Control:** R14 reading `vibeClose` | X48 |
| I-A9 | packed `adapt` ≤ 1,536 B at maximum fill (measured 1,016 B). **Control:** the unpacked codec (4,343 B) or ring 32 | §3.1 |
| I-A10 | `GUARDS` narrow no `plan.adopt` in G4 (count 0). **Control:** a planner skipping R10's constraint | X44 |
| I-A11 | `latch_walker` turns each latch on and off inside its windows on 8/8 seeds (adaptation-policy §8.4). **Control:** any latch with its window missed | §9.10 |
| I7-I11 | leak guard, no realtime homework, no correctness talk without a kit/code key, `homework_key` unreachable from `compile()`, isomorph collisions | ss AR-9 |
| I13-I18 | replica loss loses nothing; a poison batch acks the rest; one KT writer; erase fencing; module egress blocked; no retraction | ws R9 |
| PLI1-PLI19 | claim-checker coverage, no pressure wording, home activity needs no maths, ≤ 1 activity/week, commitment cap under concurrency, no S notice while implicated, parent text unreachable from ChildBrief, voice note = script, letters re-gated at send, canDo-only activities, no SLA without a rota row | pl §12, PA-22 |
| W-map | every `child_id` table mapped, cascading, indexed; no free text in event schemas | ws W2, §5.2 |
| I-F1 | (gap-fill G2-content-orchestration-media) no publish without `reviewed_by`; a human tier needs every key-required item approved and no `auto:` reviewer. **Control:** probe F15 | content-orchestration §11.3 |
| I-F2 | no child field in `forge_request.key`, `forge_transition.evidence`, `forge_artifact.manifest`; no lesson or child id in a library row. **Control:** F8 (a `childId` key is refused) | MO R8, X49 |
| I-F3 | `forge_waiter` is inserted only by the Conductor commit and only for `in_lesson`/`next_lesson`. **Control:** F7/F7c + writer census | X49 |
| I-F4 | ≤ `per_child_daily_demand` (3) waiters per child-day, ≤ `per_child_daily_races` (2) on non-T1/T2 tiers. **Control:** F4, F5 | MO §9.1 |
| I-F5 | after a publish no waiter remains for the request and every in-window waiter has a `module_ready` row, under any commit ‖ publish interleaving. **Control:** D4 (10/10), F9 | X53 |
| I-F6 | Forge lock order (X53); no `40P01` in the G3 probe cells. **Control:** the G1 bodies deadlock 5/5 (D1-D3) | X53 |
| I-F7 | no mount of an artefact that is not the published one or whose hash is on `lib-blocklist`. **Control:** F18 | §5.8 |
| I-F8 | T3 and Manim artefacts attest egress deny, runner identity none, AST ban list; T3 the current CSP. **Control:** F17 | ws I17 |
| I-F9 | a late artefact never replaces a mounted module. **Control:** a planted late `module_ready` mid-play must be deferred (conductor-sim) | X51, MO C1 |
| I-F10 | no T3, image, video, audio or chant build starts with horizon `in_lesson`. **Control:** a planted in-lesson T3 demand must come out `next_lesson` | X52 |
| I-F11 | quarantine is one transaction: `module_ready` rows gone and the hash on the blocklist. **Control:** F18 | — |
| I-F12 | no lyric, narration or artefact string enters a `compile()` lane (ids and shapes only). **Control:** lint L4 golden case | inherited law |
| I-F13 | no publish with a model off `allowed_model` or on or after `allowed_until`; `verify` fails when a deployment in use is within 30 days of it. **Control:** F12, F13; today's run must flag `taxila-sora` and `taxila-transcribe` | X55, X58 |
| I-F14 | song/chant only for `verbatim_sequence` objectives; every chant line phonMatch = 1.0; lang key present; `rights ≠ ncert-pending`; L1-L5 clean. **Control:** lint golden cases (11/11) | X56, LS rule 24 |
| I-F15 | no library build is charged to a child (`cost_ledger.child_id` null for `forge.*`); live fills are charged to `child_content`. **Control:** ledger fixture | MO8 |
| I-F16 | no name, transcript or memory crosses into a module iframe; `init` carries ids and numbers only. **Control:** a planted free-text `init` field is rejected | MO R9 |

### 9.10 Simulators and experiments

- **conductor-sim** (`evals/conductor-sim/`, the analogue of echosim): a virtual clock and personas (steady learner;
  drop-off after day 3; a test announced mid-week; siblings on one phone; a parent who changes limits at 23:00; patchy
  network replaying events; Azure 429 storms; an invalid LLM plan 20% of the time; concurrent ingests racing job
  completions and the ticker (I-R10); a killed worker between side effect and completion; ±2 h device clock skew; a
  chatty 6-year-old who goes off-topic every third turn (I-R11); an account dormant for 3 weeks, then back (I-R12); and (gap-fill G1-adaptation-policy) the adaptation personas of adaptation-policy §8.4. These are `fast_learner`, `wheel_spinner`, `over_reliant`, `tired_every_evening`, `interest_switcher`, `goal_setter_teen`, `exam_vs_thread`, `low_budget_b1_test`, `stale_refit` and `routine_vs_vibe`, plus **`latch_walker`**: a scripted 8-week B2 child that must turn every latch (R1, R2, R3, R6, R7, R14) on and then off inside stated windows. Week 1 is steady (no latch may fire); week 2 strained (R1); a 9-day gap (R8 re-anchor, R3 backlog); η = +.9 from week 3 (R6 → 2); late tired sittings in weeks 4-6 (R2); a dependency flag in weeks 5-6 (R7); 3 of 5 sittings cut by bedtime in week 7 (R14); η back to 0 in week 8 (R6 → 1)).
  It prints tables: plan adherence, minutes by lane, invariant violations, dead jobs, deadlock retries, wakeups per
  dormant child, cost per child-week, letter on-time rate.
- **SimChild** (obs O7): a seeded code state machine whose misconceptions weaken only under the moves that resolve
  them. A model may only reword an answer the code chose. It gates invariants and policy, never efficacy.
- **Experiments** (obs O9, O10): assignment is a pure hash `${expId}:${salt}:${unitRef}:${decisionRef}` with a frozen
  salt and an immutability trigger on running experiments. `exposure` PK includes `child_id`. Household A/B needs
  ≈ 1,100-1,470 households per arm, so v1 runs **within-child micro-randomised move trials** first (M3). The safety
  floor, answer withholding, consent and parent visibility are never randomised.

### 9.11 Incidents

Order: hard counters (any safety-invariant violation pages at count 1), burn-rate SLO alerts (14.4× 1 h/5 min and
6× 6 h/30 min page; 1× 3 d/6 h ticket [V SRE workbook], with minimum-event guards), the canary child every 30 min, a
served-model-version guard (holds at lesson boundaries; voice-lane holds need a human), and the nightly **writer
census** (every writer that should have written did: `memory.consolidate` per `lesson.ended`, `turn_trace` per turn,
`weekly_letter` per active child-week, `decision_log` per step). Safeguarding-coded turns, plus 3 turns either side,
are excluded from every eval, annotation, cassette (> 7 d) and judge path, and go only to the safeguarding human
(obs V6.5). Real-child text never enters git; the Tutor Bench keeps an item-set hash in git (obs V6.6). The action
group has two named humans.

### 9.12 Measurements this spec depends on (log each with n, method and date before relying on it)

| id | measure | decides |
|---|---|---|
| CM1 | fold + decide latency p50/p95 (simulator, 1 year of events per child) | C3 reversal; SLO |
| CM2 | Neon CU-hours per 1k children, **including the always-on compute** that the 1-5 s worker polls cause (no scale-to-zero: X35) | X35 poll cadence; cells |
| CM3 | code vs LLM planner on delayed outcomes (shadow, then pre-registered micro-RCT) | whether the LLM planner is ever adopted |
| CM4 (gap-fill G2-content-orchestration-media) | from `module_run.source` (Director-only writer): **CM4** = library-class mounts ÷ library-class wants per lesson; **CM4b** = `module_ready` mounts from an `in_lesson` waiter ÷ all mounts (the owner's "built while she teaches", measured); **CM4-img** = planned image slots served from the library ÷ planned, per topic over 30 d. Prior [sim]: CM4-img 99% with demand-ranked prefetch at 300 images/night, 86% calendar-only | the "built while she teaches" claim; X57 |
| `content-orchestration-pg16-2026-10-02` (gap-fill G2-content-orchestration-media) | done: F1-F21 (n = 1) + race cells D1-D4 (n = 5 each), 30/30 as expected; 4 G1 defects found and fixed (`content-orchestration-pg16-probe.py`) | X49, X53 |
| `image-prefetch-sim-2026-10-02` (gap-fill G2-content-orchestration-media) | done [sim]: 4 seeds × 18 cells (`image-prefetch-sim.py`) | X57 |
| M-CO1…M-CO5, M-SONG-5/6/7, M-VID1 (gap-fill G2-content-orchestration-media) | near-line ready vs need-by; CM4 family; review throughput and SLA hit; `forge_ready_for` DB share; the probe on Neon; chant/melody A/B; lite-device MP4 (content-orchestration §12) | X50-X57 |
| CM5 / CM11 | realtime admission wait p95 at 19:00-21:00 IST; drop-off during the warm-up vs a spinner | quota request size; R7.1 |
| CM6 | actual cost per child-day by tier and lane from `cost_ledger` | D-PRICE, §9.5 |
| CM8 | wakeup lag with the ticker down (piggyback only) | C5 degradation |
| CM9 | home-grown queue vs pg-boss: claim latency, Neon CU-hours, at 1k and 10k simulated children | X6 reversal |
| CM10 | split (X32): `non_child_audio_turns` (empty or low-confidence VAD commits: the only cost leak) vs `child_off_topic_turns` (rapport, never a hang-up), as shares of realtime audio-out | idle hang-up thresholds |
| CM12 | resume rate after `network` endings, and duplicated warm-up minutes | R7.6 |
| CM13 | India → eastus2 ingest → decision p95 on real devices, 3 cities | region decision |
| OM16 | instruction staleness rate and p95 lag (provisional client-clock aggregate at M0, observer timestamps from M1: X40) | the Director's `session.update` path |
| `conductor-substrate-pg16-2026-10-02` | done: functional cases (n = 1) and the lock-order probe (n = 5 per cell, §3.8) | X29, the substrate |
| OM17/OM18 | deployment-metric tokens vs ledger tokens hourly; the subscription offer id (Cost Management exports may not work on Sponsorship offers [V]) | cost reconciliation method |
| M-SS3 / M-SS7 / M-SS8 | leaks + false blocks on cascade; pick-first box latency and recall from India; cost per homework sitting | homework gates; X13 |
| PLM12 / PLM13 / PLM14 | PTM $/min; WhatsApp block rate and tier; incident → delivered parent notice p95 and the unreachable rate | PTM cap; channel; S ladder |
| WS-M10 | peak statements/s per Neon compute including sync | when cells are needed |
| DC-M1 / DC-M3 / DC-M4 | anchor vs no anchor on session days in weeks 5-8; where attention drops by minute and band; real after-school windows | DC1, DC4, §4.1 |
| `adaptation-hysteresis-sim-2026-10-02` | (gap-fill G1-adaptation-policy) done [sim]: seeds 11-18 (n = 8), 2,000 children × 40 sittings per seed. **R1 3/4, r=3:** oscillation 0.486 flips/child/8 wk [0.468-0.515], p90 2; false latch (steady child ever on) **23.6%** [22.3-24.6]; 2.5% of sittings on; hit 100%. The one-close rule (1/1, r=1): 9.9 flips, 99.9% false latch. **R2** (nightly, 16-ring, ≥ 4 each, .40/.20): 0.32 flips, **15.9%** false latch, 91.3% hit; at .30/.30 it was 23.5% false. **R6** (I = .05): hysteresis 0.19 flips, 12.2% steady moved, 84% correct for η ±.8, vs naive 0.56 / 17.1% / 76%. The original seed-11 tables reproduce unchanged. Also `adaptation-state-size.py` (packed `adapt` 1,016 B) and `adaptation-worked-example.mjs` (17/17) | X45-X47, I-A3, I-A9 |
| CM-A0…CM-A9 | (G1) `vibeClose` label κ vs human raters (≥ 100 closes, bar κ ≥ .6: it gates R1/R2); R1 base rate/autocorrelation + MRT (92 child-months for +8 pp at ρ .05); R2 real sitting hours; η refit stability and per-opp information; R3-R5 unsticking MRT; R9 share vs school tests; R7 solo-round MRT; choice/opener logs; `adapt` size p99; guard narrowings (must be 0) and plan churn | every [U] threshold in adaptation-policy §4 |

---

## 10. v1 build order

Rule (orch R6): build first what is hard to retrofit (data shapes, idempotency, atomicity, the invariants); defer
what only pays at scale.

### 10.1 M0: the first live lessons (≤ 30 children, owner-supervised)

| # | deliverable | files |
|---|---|---|
| 1 | `tx(fn)` on the pg Pool (`pool.connect()`, BEGIN/COMMIT/ROLLBACK). `DB_DRIVER=pg` required on ACA; a second **direct** URL secret for the worker | `server/db.js` |
| 2 | migration `002_conductor.sql`: `child_seq`, `student_event`, `ingest_event()`, `conductor_state`, `decision_log`, `brief_snapshot` (X34), `day_plan`, `conductor_usage`, `job`, `complete_job()`, `wakeup`, `fire_wakeups()`, `notification`, `notify_slot`, `budget`, `cost_ledger`, `price_book`, `rate_bucket`, `model_call`, `turn_trace` (+ `child_id` index), `child_routine` (routine facts only), `parent_setting`, `calendar`, a minimal `workspace` (state, legal_mode, academic_year, last_active_at: `complete_job` fences on it), `gen_ulid()`. `child_seq`, `conductor_state` and `workspace` rows are created in the same transaction as `child` | `db/migrations/002_conductor.sql` |
| 3 | contracts: events, state, plan, lanes, notify, jobs (the unions in §2-§4), and (gap-fill G1-adaptation-policy) `adapt.ts` from `adaptation.contracts.ts` (`ConductorChildView`, `ViewReader`, `AdaptMemory` + packed codec, `PlannerInputs`, `resolveKnob`, `registerConstraint`, `RULES`, `T`) | `shared/conductor/*.ts`, `shared/contracts.ts` (`LessonBrief`) |
| 4 | the Conductor: `decide` (pure), guards in authority order + fail-safe, `clock` (`clockPhase`, `learningDay`, jitter, the dormant-clock rule X36), code planner (`planKeys` + pure `planDay` + JCS `inputsHash`, rules R0-R14, `foldNight`: gap-fill G1-adaptation-policy) + validator V1-V27, the recording `ViewReader`, `step` (with the 40001/40P01/CAS retry), `commit` in the **X29 lock order**, a write-free `replay` (X31), `upgradeState` | `server/conductor/` |
| 5 | `taxila-worker` ACA app: leader ticker, the **dirty-set step loop** (no `conductor.step` job: X30), fast/slow claim loops with 1 s → 5 s poll backoff (X35), shutdown contract; `deploy-azure.mjs` deploys both apps, with the 18:00-21:30 IST freeze | `server/worker/main.mjs`, `scripts/deploy-azure.mjs` |
| 6 | lesson integration: `/api/lesson/start` = usage reserve + rate-bucket admission (reconnect priority) + `brief.refresh`; the Director emits `lesson.started/ended` (with `voiceSec`, `outcomeDigest`), `teacher.promise`, and honours `wrapAt`/`hardStopAt`, the **non-child-audio** idle hang-up (X32), `session.renew`, resume within 15 min; its turn commit is optimistic (X39); `lesson.ended → memory.consolidate` via `complete_job` | `server/routes/lesson.js`, `server/director/` |
| 7 | off-voice warm-up during admission (tap retrieval + cached narration clip). **Prerequisite** (orch B11): narration pre-rendered and cached for every warm-up-eligible kit item, in a voice a blind ear test matches to the teacher, or the warm-up is heard as a different teacher (R7.7) | `src/lesson/`, kit pipeline |
| 8 | `modelCall` with live/replay/eval modes and the X38 `finally` order; `turn_trace` + `model_call` rows staged in the Director's turn commit; lesson `traceparent`; the provisional client-clock OM16 (X40) | `server/obs/`, `src/lesson/` |
| 9 | the device's cached plan for first paint, `slot.shown`, the rest and hold screens (the hold screen designed with the safeguarding protocol, shown for every incident: X33) | `src/` |
| 10 | safety: every incident → `safety_hold` (X33); S → human queue only (X23, M0 phase), page on entry, 2 h escalation, safeguarding exclusion predicate | `server/director/safety.js`, protocol |
| 11 | `scripts/verify-release.mjs` with G0-G4 + G8 (G3 includes the lock-order probe and the `planDay` determinism property), `evals/conductor-sim/` (with the adaptation personas and `latch_walker`), the invariant registry I-C*, I-R1…I-R12, I-V*, I-A1…I-A11 | `scripts/`, `evals/`, `tests/conductor/` |
| 12 | App Insights distro (sampling 1.0, ban-list scrubber, anomaly counters); `canary` and `nightly` ACA scheduled jobs with Azure Monitor absence alerts | infra |

**Exit criteria:** every gate green with its negative control; the I-R1 concurrent-ingest drill shows zero lost
events and I-R10 zero deadlocks; conductor-sim tables recorded as the baseline; CM1, CM2, CM5 and CM8 measured and
logged; one week of real lessons with `cost_ledger` reconciled against Azure deployment metrics (OM17).

### 10.2 M1: before more than 30 families, or any public beta

1. **Notifier** + ACS WhatsApp (template registration, tier-aware scheduler, inbound with STOP, delivery receipts);
   local anchor reminders on Android.
2. **Parent loop v1:** intake (text; voice counts as the PTM), the `parent.letter` job with cutoff, commitments
   (`create_commitment`), ~20 home activities (canDo only), text PTM with structured cited output, S/W/R/C routing,
   `safetyParentNotice` switched to the M1 settle rule once the safeguarding advisor signs it, and the delivery
   ladder.
3. **Homework v1:** capture + commit, DI Read pick-first, constrained mapping, kit/code keys, cascade lane + the
   corrected leak guard, invariants I7-I11. Document Intelligence provisioned and logged.
4. **Workspace v1:** `WORKSPACE_MAP` + tests, device replica (Android SQLite, web IndexedDB), `/api/ws/sync` with the
   R3.2/R3.3 fixes, the KT workspace lock, server re-grade, `session.reassign`, hard-delete erasure with fencing, CSP on
   `lib/`.
5. **Cost:** per-tier budgets from D-PRICE, 5-min lesson blocks, the realtime **observer** on its own
   `taxila-observer` app (metering + staleness, X37), `cost_ledger` unique key, D-COST and D-LIVE views.
6. Quota request filed (realtime RPM/TPM, `taxila-brain`), sized by CM5.

### 10.3 M2

LLM day planner in **shadow** (night, active-in-7-days, jittered) plus the CM3 comparison; 1 voice PTM/month via
relayed routes; test windows v1 and the pointer chip; topic-level Forge T1/T2 library prefetch within the global
Forge budget, demand-ranked (X57), with `forge.admit`, `forge.horizon`, near-line `forge.scene` and the review queue's SLA ordering (gap-fill G2-content-orchestration-media); `chant-track@1` library (X56); L2 replay on release and then the nightly production sample; the `struggleSooner` push (if PLM data
supports it); Content Safety 5% sample once OM11 runs.

### 10.4 M3

Forge T3 offline (ACA Sandboxes, egress denied, headless validation, review-admitted queue); library video **as code** (gap-fill G2-content-orchestration-media): `explainer@1` clips and seek-rendered MP4, Manim (Class 8-9 maths) in dynamic sessions, stills-with-motion for phenomena (X55); `jingle@1` after M-SONG-5;
within-child micro-randomised move trials; a second realtime region (Sweden Central); v2 school sync (test papers,
transcription-as-evidence after M-SS1, alias pipeline); WhatsApp daily note as a parent-requested class; the evening
reflection on cascade (opt-in, B3-B4); cells when WS-M10 demands them; DEK crypto-shred in a separate key project if
compliance is re-prioritised.

### 10.5 Owner decisions that block (log each in `context/` with a reversal condition)

| id | decision | blocks |
|---|---|---|
| D-PRICE | tier prices and `voiceSecMonth` per lane (§9.5: at ₹299 about 16 realtime minutes a month fit) | M1 public beta |
| D-QUOTA | file the realtime and `taxila-brain` quota requests (10 RPM ≈ 10 lesson starts/min; Tier-1 ≈ 15 concurrent lessons [V quotas, I tokens]) | any cohort > 30 |
| D-SAFE | name the safeguarding human and the **second named adult**; engage an advisor for the settle window and the protocol table; **rule on the severity split** (whether a `high` incident may keep lessons running under monitoring, X33) and the human acknowledgement target. Until then, every incident → `safety_hold` | M0 with real children |
| D-WA | ACS WhatsApp onboarding (Meta business verification, sender number, templates) | M1 letters |
| D-DI | provision Document Intelligence (region, S0) | M1 homework photos (read-aloud and typed work without it) |
| D-SUPPORT | a support rota and SLA (or the honest no-SLA shape) | M1 |
| D-ASR (gap-fill G2-content-orchestration-media) | re-pin `taxila-transcribe` before **2026-10-15** (gpt-4o-mini-transcribe 2025-12-15 → 2027-06-15, or gpt-4o-transcribe-diarize 2025-10-15 → 2027-04-15) and re-run the phonkey probe set | TTS round-trip WER, chant gate A |
| D-VIDEO (gap-fill G2-content-orchestration-media) | optional ≤ 20 sora-2 phenomenon hooks under a hard $50 cap, reviewed and **published before 2026-10-15** (I-F13 checks at publish); default: none | nothing (M3 video is code) |
| D-SPEECH (gap-fill G2-content-orchestration-media) | name Azure AI Speech neural TTS in `azure-only-compute` (already used for chant and narration) | chant library, explainer narration |
| D-SONG (gap-fill G2-content-orchestration-media) | accept chant + jingle for v1; whether an open-weight singer (ACE-Step, MIT) on an Azure GPU may be probed for v2 (allowed as open-source on Azure compute, not first-party) | songs v2 |
| D-REVIEW (gap-fill G2-content-orchestration-media) | a reviewer rota with hours per day, including a native Hindi ear for lang keys | T3 library growth; every chant kit |

### 10.6 Not to build (and why)

A VM or container per child (orch C9, ws W1). Live codegen (X9). A per-child night pipeline (X10). Azure Batch (X7).
Per-child DEK in the main database (X15). Rainbow reducer versions (X16). A stored 8-phase day machine (X3). Per-child
image or video generation (orch R3.2: medium images alone are ≈ $3.2/child-month). Langfuse/Phoenix as a system of
record, or Helicone-style proxies (obs O12). Any model outside the allowed list, including Claude on Foundry and
`gpt-5.6-terra` (I-R8). A `conductor.step` job kind (X30). A replay path that can commit (X31). Any writer that locks
`child_seq` before another existing row (X29). `NOTIFY` as a correctness path (X35).
(gap-fill G2-content-orchestration-media) Anything new on sora-2 after 2026-10-13, or any pixel video that carries a fact (X55). A sung render from TTS
instructions (X56). LLM-authored lyrics for verbatim content: luna arranges kit tokens, never writes them (L1). A
mid-lesson `brief.refresh` per published module (X51). Calendar-only image prefetch (X57).

---

## Sources

Primary sources checked this session or by the cited sibling doc ([V]):
- (gap-fill G2-content-orchestration-media) Microsoft Learn, *Model retirement schedule — Microsoft Foundry* (updated 2026-09-23) — https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule
- (gap-fill G2-content-orchestration-media) Microsoft Learn, *Foundry Models lifecycle and support policy* (retired = `410 Gone`; preview 30-day notice; not extendable) — https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirements
- (gap-fill G2-content-orchestration-media) Microsoft Learn, *Sora 2 video generation overview (preview)* (jobs kept 24 h) — https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
- (gap-fill G2-content-orchestration-media) Microsoft Learn, *Dynamic sessions in Azure Container Apps* (custom-container pools billed on pool resources) — https://learn.microsoft.com/en-us/azure/container-apps/sessions
- Oskar Dudycz, *Postgres sequences and messaging guarantees* — https://event-driven.io/en/ordering_in_postgres_outbox/
- Azure Container Apps lifecycle (SIGTERM → 30 s → SIGKILL) — https://learn.microsoft.com/en-us/azure/container-apps/application-lifecycle-management
- Azure Container Apps jobs (cron in UTC; at-least-once; retry limit) — https://learn.microsoft.com/en-us/azure/container-apps/jobs
- Azure Container Apps Sandboxes — https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-overview
- Neon connection pooling (no LISTEN/NOTIFY or session advisory locks through the pooler) — https://neon.com/docs/connect/connection-pooling
- Neon scale to zero (suspends after 5 minutes of inactivity), via orch R10 — https://neon.com/docs/introduction/scale-to-zero
- PostgreSQL `NOTIFY` (delivered at commit; `pg_notify`), via orch R10 — https://www.postgresql.org/docs/current/sql-notify.html
- PostgreSQL 16 explicit locking, §Deadlocks ("acquire locks on multiple objects in a consistent order"; one side is aborted, and which one "should not be relied upon"; retry aborted transactions), checked 2026-10-02 — https://www.postgresql.org/docs/16/explicit-locking.html
- Neon history window (can be 0; Launch/Scale defaults) — https://neon.com/docs/introduction/history-window
- Azure OpenAI Realtime via WebRTC (observer/controller WebSocket via `call_id` from the `Location` header; East US 2 and Sweden Central), re-checked 2026-10-02 — https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/realtime-audio-webrtc
- Azure OpenAI Realtime audio (60-min sessions, 32k input tokens) — https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio
- Azure OpenAI quotas and limits (gpt-realtime Tier 1: 200 RPM / 100k TPM; subscription pooling) — https://learn.microsoft.com/en-us/azure/ai-foundry/openai/quotas-limits
- Azure OpenAI global batch (deployment types, supported models, no expiry of late jobs) — https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/batch
- pg-boss (MIT; SKIP LOCKED; retries, dead letter, cron, debounce/throttle; jobs created inside an existing transaction; Node ≥ 22.12, PG ≥ 13), checked 2026-10-02 — https://github.com/timgit/pg-boss
- Azure Monitor OpenTelemetry sampling and configuration (metrics never sampled; logs of unsampled traces dropped) — https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-sampling , https://learn.microsoft.com/en-us/azure/azure-monitor/app/opentelemetry-configuration
- Azure Front Door billing (cache hits billed edge→client) — https://learn.microsoft.com/en-us/azure/frontdoor/billing
- WHATWG sandboxing flag set (no network restriction) — https://html.spec.whatwg.org/multipage/browsers.html#sandboxing-flag-set
- Azure Retail Prices API (DI Read $1.50/1k, Layout $10/1k; Content Safety $0.375/1k; Log Analytics $2.76/GB, eastus2) — https://prices.azure.com/api/retail/prices
- Cost Management data (lag, credits excluded, Sponsorship unsupported) — https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-cost-mgt-data
- Meta WhatsApp messaging limits, template components, pricing — https://developers.facebook.com/docs/whatsapp/messaging-limits , https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components , https://developers.facebook.com/docs/whatsapp/pricing
- ACS Advanced Messaging for WhatsApp — https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-overview
- Firebase Android message priority — https://firebase.google.com/docs/cloud-messaging/android/message-priority
- Google SRE workbook, *Alerting on SLOs* — https://sre.google/workbook/alerting-on-slos/
- Kim et al. 2025, *Correlated Errors in Large Language Models* — https://arxiv.org/abs/2506.07962
- (gap-fill G1-adaptation-policy; checked 2026-10-02) RFC 8785, JSON Canonicalization Scheme — https://www.rfc-editor.org/info/rfc8785/ ;
  Western Electric run rules (per-point false alarms, ≈ 1/53 combined) — https://en.wikipedia.org/wiki/Western_Electric_rules ,
  supplementary runs rules lower the in-control ARL from 370.4 to 94.75 — https://arxiv.org/pdf/1007.3225 ; Schmitt-trigger
  hysteresis — https://www.wevolver.com/article/schmitt-trigger-robust-comparator-design-with-hysteresis ; quickest change
  detection (delay vs false-alarm ARL; CUSUM) — https://arxiv.org/pdf/2104.04186 ; Beck & Gong 2013 wheel-spinning —
  https://www.semanticscholar.org/paper/Wheel-Spinning:-Students-Who-Fail-to-Master-a-Skill-Beck-Gong/0890bd77b4615cbe9aa6be27b4c9aa6772f3d74f ;
  Yudelson, Koedinger & Gordon 2013 — https://www.semanticscholar.org/paper/Individualized-Bayesian-Knowledge-Tracing-Models-Yudelson-Koedinger/55a51b86f6739f1d04556ffe0b69ae2d77a347b3 ;
  van der Heijden et al. 2010 (TRAILS, time of day, ages 10-12) — https://pubmed.ncbi.nlm.nih.gov/20969529/ ; Mace et al. 1988
  (high-probability sequence) — https://onlinelibrary.wiley.com/doi/10.1901/jaba.1988.21-123 ; Duckworth et al. 2011 (MCII,
  adolescents) — https://eric.ed.gov/?id=EJ911106 ; Liao et al. 2016 (MRT sample size) — https://onlinelibrary.wiley.com/doi/abs/10.1002/sim.6847
- Learning and family evidence as cited in the sibling docs: Lally 2010, Keller 2021, Wood & Rünger 2016, Gollwitzer &
  Sheeran 2006, Wilhelm 2008/2013, Mazza 2016, Hale & Guan 2015, Bastani 2025, Aleven 2016, Hill & Tyson 2009, Barger
  2019, Maloney 2015, Rogers & Feller 2018, Stattin & Kerr 2000 (see `day-cycle.md` §14, `school-sync-homework.md` §13,
  `parent-loop.md` §17).

Internal [repo]: `docs/ARCHITECTURE.md`; `docs/research/learning-science.md` §6; `learner/kt-algorithms.md` §0, §5;
`learner/vibe-temperament.md` §4; `design/parent-experience.md` §0; `design/low-end-offline.md` §0 and
`low-end-cascade-probe-2026-10-02.json`; `realtime-cost-model.py`; the six conductor docs and their cost scripts
(`day-cycle-review-cost.py`, `student-workspace-cost.py`, `student-workspace-review-cost.py`,
`school-sync-review-cost.py`, `parent-loop-review-cost.py`); the lock-order probes
(`orchestration-lock-order-probe.{sh,schema.sql,reset.sql}`, `conductor-lock-order-rev2-probe.{sh,extra.sql,reset.sql}`);
the gap-fill fragments `content-orchestration.sql`, `adaptation.contracts.ts`, `adaptation-hysteresis-sim.py`; (gap-fill G2-content-orchestration-media) `content-orchestration.md`, `content-orchestration-pg16-probe.py` (+ `.g1-frozen.sql`, output `-2026-10-02.txt`), `image-prefetch-sim.py`, `media-recitation-lint.mjs`, and the content docs it rests on (`factory/multimodal-orchestration.md`, `factory/video-animation-gen.md`, `factory/asset-pipeline.md`, `content/animation-video.md`, `content/songs-rhymes-audio.md`, `content/genui-reliability.md`); and (revision 3) `adaptation-policy.md`, `adaptation-state-size.py`, `adaptation-worked-example.mjs`;
`context/decisions.md`, `measurements.md`, `rejected.md`;
`server/db.js`, `server/routes/lesson.js`, `package.json` (the missing `scripts/verify-release.mjs`).
