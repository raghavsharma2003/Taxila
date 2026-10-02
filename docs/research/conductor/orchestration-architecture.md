# The Conductor: orchestration architecture for an always-on, per-student AI

**Date:** 2026-10-02 · **Question:** what architecture lets one AI run a child's whole learning day
(daily plan, school sync, homework help, live lessons, generated content, practice, revision, parent
reports, notifications) above the per-lesson Director, and keep it reliable, observable, cheap and testable?
**Builds on, does not repeat:** `docs/ARCHITECTURE.md` (Director, §1.2), `docs/research/learning-science.md`
§6 (rules 13, 14, 18, 27, 32, 36, 37), `docs/research/learner/kt-algorithms.md` (event-sourced `kt_evidence`,
§5.1), `docs/research/learner/vibe-temperament.md` §4.1 (session state never persisted; slow knobs at close),
`docs/research/design/parent-experience.md` (§0 cadence caps, §8 weekly report, §10 controls, §11 alerts),
`docs/research/tech-and-market.md` §1.9 (voice costs), `context/decisions.md` (sin1, Azure quotas).
**Tags:** **[V]** checked this session against the primary source. **[S]** secondary (search summary,
vendor blog, or a source cited inside a [V] source). **[U]** unverified: a Taxila design default or an
estimate that must be measured. Every number in §9 that is not [V] is a parameter, not a fact.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| C1 | **The Conductor is code, not an LLM agent.** It is a pure reducer `decide(state, event, now, cfg) → {state', commands[]}`. Language models are called only at named *deliberation points* (daily plan, re-plan, weekly review), and their output is a typed proposal that code validates and may reject | Learning-science rule 14 (structure in code; Kestin: the prompt "could not reliably provide enough structure") [V]. Anthropic: start simple and add agency only when it pays [V]. 12-factor agents: "own your control flow", "make your agent a stateless reducer" [V]. MAST: 41.8% of multi-agent failures are specification issues and 21.3% verification failures [S]. "Controlled by an AI" is met because every *judgment* (what to teach today, what to generate, what to tell the parent) is model-proposed, while *control* (ordering, limits, retries, budgets, safety) is code | A shadow-mode LLM controller beats the code reducer + LLM planner on delayed retrieval and session completion in a pre-registered micro-RCT (rule 37), with zero invariant violations over 10k simulated student-weeks |
| C2 | **One virtual actor per child, implemented in Postgres** (mailbox = `student_event` rows; single writer = lease + version compare-and-set on `conductor_state`). No new orchestration server at launch | The actor/entity shape is the industry answer for "a long-lived thing with its own state and serialized inputs": Temporal entity workflows [S], Azure Durable Entities [V], Restate Virtual Objects ("at most one handler with write access … per object key") [V]. Taxila already has Neon; one more system is one more failure domain and bill | Ops cost of the home-grown queue (incidents, lost jobs, or > 1 engineer-day/month on it) exceeds the cost of moving the substrate to Vercel Workflows, Restate or Temporal Cloud. The reducer and contracts are written so that move changes the substrate only (§14) |
| C3 | **The student event log is append-only and is the source of truth for "what happened"**. Conductor state is a fold over it (snapshot + tail). Domain ledgers keep their own logs (`kt_evidence` stays owned by KT) and the student log carries *references* and *derived milestones*, never copies | Event sourcing gives replay, audit and deterministic tests. KT already decided this for evidence (kt-algorithms §5.1) [V]. One owner per fact (§6) stops two writers drifting | Storage or fold time per child exceeds budget (fold > 200 ms p95 at session start) and snapshots do not fix it |
| C4 | **Work leaves the Conductor only as rows in a transactional outbox (`job`, `wakeup`, `notification`)**, written in the same database transaction as the state change. Workers claim jobs with `FOR UPDATE SKIP LOCKED`, under a lease, with a fencing token | Dual writes (state in DB, job in a separate queue) lose or duplicate work on crash. SKIP LOCKED is the standard Postgres queue claim (graphile-worker, pg-boss) [S]. Neon's HTTP driver runs single statements and non-interactive transactions [S], which is exactly what claim and commit need | Queue throughput > ~500 claims/s sustained, or Neon compute hours from polling exceed a managed queue's bill |
| C5 | **The clock is data.** Every future action is a `wakeup` row; a ticker drains due rows every minute; any request from the child's device also drains that child's due rows (piggyback). Vercel Hobby cron cannot be the ticker | Vercel Hobby cron is once per day with ±59 min precision; Pro is per minute [V]. The ticker must be replaceable: ACA scheduled job (`*/1 * * * *`) [V], Vercel Pro cron, or Neon Function Triggers (cron that fires at scale-to-zero, GA 2026-09-21) [V] | Never for the data model. The ticker host changes with the plan |
| C6 | **Agents are workers with typed contracts, budgets, deadlines and fallbacks.** Director (synchronous, in-lesson), Forge (async, long, on Azure Container Apps), Report writer, Memory consolidator, Planner (LLM), Scheduler (pure code), Notifier (code + templates). Agents never call each other; they emit events that the Conductor folds | Cognition: parallel agents with partial context make conflicting implicit decisions [V]; MAST "inter-agent misalignment" is 36.9% of failures [S]. A hub-and-spoke where only the Conductor decides removes agent-to-agent negotiation entirely | A product need that truly requires two agents to iterate together (e.g. Forge and Director co-designing a live game). Then that pair gets a bounded evaluator-optimizer loop *inside one job*, not a mesh |
| C7 | **Every model call goes through a cost governor that reserves before it spends**, with per-child day/month budgets, global per-deployment rate limits, and a degrade ladder that always ends in a zero-cost fallback | ₹299/month ≈ $3.1 [S, market docs] is less than one 45-min live lesson on gpt-realtime-2.1 even after pruning ($3.9) [V, tech-and-market §1.9]. Azure quotas are 10 RPM realtime and 4 RPM image today [V, decisions.md]. Cost and capacity are product constraints, not ops details | Never removed; budgets change with pricing |
| C8 | **Generated content is a shared library asset, personalised by parameters, never generated per child.** Forge output is keyed by (objective, engine, spec hash, model version), cached, validated, and reused across children; personalisation (names, interest contexts, language) is a parameter skin | Codegen with a fix loop is minutes and dollars per artefact (tech-and-market §3: T2 ≈ 70% pass after ≤ 10 rounds) [S]; sora-2 is $0.10/s [S]. Per-child generation cannot fit C7. Caching by identity follows the inherited `asset_cache` rule (key includes model + style version) | A per-child generated artefact shows a delayed-retrieval gain over the library version in a micro-RCT, and its marginal cost fits the tier budget |
| C9 | **No "VM per student".** The per-student unit is a *logical* actor (a state row plus a mailbox) that costs nothing when idle. Isolated compute (ACA Sandboxes/dynamic sessions) is per *Forge job*, not per child | An always-on 0.25 vCPU container per child is roughly $15-20/month [U, ACA consumption rates] against a ~$3 revenue line. ACA Sandboxes give sub-second start, snapshots and egress policy for untrusted generated code [V], which is the real need behind the idea | A feature needs persistent per-child compute between sessions (e.g. a child's own long-running project), and suspended sandboxes priced per stored snapshot fit the tier |

---

## 1. What the 2025-2026 orchestration literature says, compressed to what Taxila takes

| pattern | source | what it is | Taxila takes | Taxila rejects |
|---|---|---|---|---|
| Workflows vs agents | Anthropic, *Building effective agents* [V] | Five workflow shapes (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer) and autonomous agents "for open-ended problems where it's difficult … to predict the required number of steps". Principles: simplicity, transparency ("explicitly showing the agent's planning steps"), and a well-documented agent-computer interface | The day is *predictable in shape* (plan → lessons → practice → wind-down → reports), so it is a **workflow** with LLM steps, not an agent loop. Routing (event → handler), orchestrator-workers (Conductor → agents), evaluator-optimizer (Forge fix loop; report lint) | An autonomous agent that decides its own next step for a child's whole day |
| Orchestrator-worker at scale | Anthropic, *multi-agent research system* [V] | Agents use ~4× and multi-agent systems ~15× the tokens of chat; errors compound so systems must "resume from where the agent was"; "rainbow deployments" keep old and new versions running for stateful agents | Token multiplier is the reason C7 exists. Resume-from-checkpoint is C3/C4. Version pinning: each `conductor_state` row carries `reducer_version`; a deploy never re-interprets an in-flight day under new rules (§10) | Parallel subagents for anything child-facing |
| Single-threaded context | Cognition, *Don't build multi-agents* [V] | "Share context, and share full agent traces"; "Actions carry implicit decisions, and conflicting decisions carry bad results"; prefer one linear agent plus a compression model | One decider (the Conductor). Agents receive a *full brief* from it, not a fragment, and return events, not decisions. The Memory consolidator is the "compression model" | Agents that negotiate with each other |
| 12-factor agents | HumanLayer [V] | Own prompts, own context window, tools are structured outputs, unify execution state and business state, launch/pause/resume with simple APIs, own your control flow, small focused agents, stateless reducer | Nearly all of it: C1 is factors 8 and 12; the state row is factor 5; jobs are factor 6; each agent is factor 10 | — |
| Failure taxonomy | MAST, Cemri et al. 2025 (1,600+ traces, 7 frameworks, κ = 0.88) [S] | 14 failure modes: specification 41.8%, inter-agent misalignment 36.9%, verification 21.3% | Specs are TS types + zod schemas (§5); misalignment is designed out (C6); verification is code gates on every agent output (§5.9) | — |
| Blackboard | Han & Zhang 2025 (arXiv 2507.01701); Salemi et al. 2025 (arXiv 2510.01285, 13-57% over master-slave baselines on data discovery) [S] | Agents read/write a shared board and volunteer for work | The *read* side: every agent reads the same derived child brief (learner model + plan), so context is shared. | The *write* side: volunteering and free writes to shared state. In a child's day, an unowned write is a bug (§6) |
| Entity / actor | Temporal entity workflow + continue-as-new [S]; Azure Durable Entities (signal = one-way, delivery guaranteed) [V]; Restate Virtual Objects [V] | One long-lived execution per entity id, inputs serialized, state durable, history compacted periodically | Exactly C2. "Continue-as-new" = our snapshot + cursor (§4.6). "Signal" = inserting a `student_event` | Running a real Temporal/Restate cluster at launch (C2 reversal covers it) |
| Durable execution | Vercel Workflows ("use workflow"/"use step", deterministic replay, no run-duration limit, $0.02/1K events, Hobby retention 1 day, Pro 7 days, runs pinned to a region) [V]; Workflow SDK Postgres World (graphile-worker; "reference implementation … not optimized for scale, speed, or security") [S]; DBOS (one Postgres write per step, deterministic workflows, idempotent steps, durable queues with concurrency limits) [V]; LangGraph checkpointers keyed by thread id, `interrupt` for human-in-the-loop [S]; OpenAI Agents SDK (handoffs, guardrails, tracing, serializable run state for approvals) [S] | Steps are checkpointed so a crash resumes at the last completed step | Use durable steps **inside** long agents (Forge build loop, report pipeline): each external call is a checkpointed step keyed by an idempotency key. Our `agent_run.steps` jsonb is a minimal DBOS-style checkpoint (§7.5) | LangGraph / Agents SDK as the Conductor's control flow: their unit is a conversation thread, ours is a child's life; their handoff model ("the new agent owns the conversation") is the opposite of C6 |
| Flow control | Inngest: concurrency keys, throttling, rate limiting (drop), debounce, priority, batching, singleton, multi-tenancy limits [V]; Trigger.dev: `concurrencyKey` = a queue per user, idempotency keys, waitpoints release concurrency [S] | Per-tenant fairness and burst control are first-class primitives | Each job kind declares `{concurrencyKey, limit, debounceMs, priority, singleton}` (§7.2). Debounce matters: 40 evidence events in a lesson must cause one re-plan, not 40 | — |
| Serverless limits | Vercel functions 300 s on Hobby, 800 s on Pro (1800 s beta) [V]; Vercel Queues public beta 2026-02-27, $0.60/M ops, at-least-once with visibility timeouts [S]; ACA jobs: manual, schedule (UTC cron) and event (KEDA) triggers, "design your workload for at-least-once processing" [V] | Short work on Vercel, long work on ACA | Lanes (§7.3): `fast` on Vercel (≤ 60 s), `slow` on ACA jobs/apps (minutes), `sandbox` on ACA Sandboxes | Running Forge builds inside Vercel functions |
| Cost levers | Azure Batch: separate quota, 24 h target, 50% off [S]; prompt caching ~50% off cached input on Standard [S]; OTel GenAI conventions (`invoke_agent`, `gen_ai.usage.input_tokens`, still experimental in v1.42, 2026-06-12) [S] | Defer, cache, measure | Report writer and nightly consolidation go to Batch with a standard-API fallback deadline (§5.4); every prompt has a stable prefix (character core, kit) so it caches; spans follow OTel names (§11) | — |

**The synthesis.** Taxila's Conductor is an *entity workflow with an event-sourced mailbox, a code reducer,
and LLM deliberation steps*, hosted on Postgres. That is less exotic than "an AI running everything", and it
is what the reliable systems above converge on once the novelty is removed.

---

## 2. Topology

```
  triggers                                   CONDUCTOR (per child, virtual actor)                agents (workers)
  ────────                                   ─────────────────────────────────                 ────────────────
  device: app.opened, homework photo ─┐      ┌────────────────────────────────────┐   job      ┌ Planner (LLM, fast lane)
  Director: lesson.*, milestone.*  ───┤      │ 1 lease + load snapshot + tail     │ ────────►  ├ Forge (ACA: codegen, image, video)
  parent: settings, test week, PTM ───┼─────►│ 2 for each event: decide() (pure)  │            ├ Report writer (Batch → fallback)
  school: calendar, chapter, test  ───┤ event│ 3 one atomic commit:               │            ├ Memory consolidator
  clock: wakeup rows (ticker)      ───┤ log  │   state', cursor, jobs, wakeups,   │            ├ Scheduler (code: FSRS, calendar)
  safety: incident (pre-empts)     ───┘      │   notifications, decision_log      │            └ Notifier (WhatsApp/push, code)
                                             └──────────────┬─────────────────────┘                 │
                                                            │ brief (read model)                     │ results come back
                                                            ▼                                        ▼ as events, never as calls
                                   Director (per lesson, synchronous, owns the minute)      student_event (append-only)
                                   reads LessonBrief, writes lesson.* events
                                   cost governor ◄──── every model call reserves here ────► cost_ledger
```

Three rules make the picture safe:
1. **Only the Conductor writes `conductor_state`.** Agents write their own tables plus events.
2. **Agents never call agents.** A Forge result that the Director needs reaches it through the
   Conductor's `LessonBrief` refresh or a `module.ready` push (§5.2), not a direct call.
3. **The Director owns the minute; the Conductor owns the day.** The Conductor may change a lesson only at
   boundaries (start, a natural stop, time-limit wrap, safety). It never edits instructions mid-turn; the
   single-assembler rule (`compile()`, ARCHITECTURE §1.1) stays intact.

---

## 3. The student event log

### 3.1 Event envelope and types

```ts
// shared/conductor/events.ts
export type ChildId = string;
export interface EventEnvelope<T extends StudentEvent['type'] = StudentEvent['type']> {
  id: string;              // ULID, generated by the producer (client or server)
  childId: ChildId;
  seq?: number;            // assigned by Postgres on insert; total order per child
  type: T;
  occurredAt: string;      // producer clock (ISO); ordering uses seq, not this
  receivedAt?: string;     // server clock
  source: 'device' | 'director' | 'parent' | 'school' | 'clock' | 'agent' | 'safety' | 'system';
  idemKey: string;         // unique per child; replays of the same fact collapse (§8)
  causationId?: string;    // the event or job that caused this one
  correlationId: string;   // trace id across event → decision → job → model call → cost
  schemaV: 1;
}
export type StudentEvent =
  // device / session
  | { type: 'app.opened'; device: 'web' | 'android'; profilePicked: boolean }
  | { type: 'app.idle'; idleMin: number }
  | { type: 'homework.submitted'; subject: string; photoAssetId?: string; text?: string }
  | { type: 'practice.completed'; setId: string; items: number; correct: number }
  // Director → Conductor (lesson boundary facts only; turn-level data stays in turn/kt_evidence)
  | { type: 'lesson.started'; lessonId: string; topicId: string; kind: 'live' | 'practice' | 'diagnostic' | 'homework' }
  | { type: 'lesson.ended'; lessonId: string; reason: 'completed' | 'time_limit' | 'child_left' | 'network' | 'safety';
      minutes: number; skillsTouched: string[]; outcomeDigest: LessonOutcomeDigest }
  | { type: 'skill.milestone'; skillId: string; to: 'learned_today' | 'mastered' | 'due' | 'wheel_spin' }
  | { type: 'module.requested'; lessonId: string; specHash: string; deadlineAt: string }
  // parent
  | { type: 'parent.setting_changed'; key: ParentSettingKey; value: unknown; by: 'owner' | 'co_parent' }
  | { type: 'parent.test_week_set'; subject: string; from: string; to: string; chapters: string[] }
  | { type: 'parent.home_task_done'; weekOf: string }
  | { type: 'parent.ptm_requested'; at?: string }
  | { type: 'parent.consent_changed'; purpose: string; granted: boolean }
  | { type: 'parent.pause'; until: string }
  // school sync
  | { type: 'school.calendar_synced'; termId: string; holidays: string[]; timetable?: Record<string, string[]> }
  | { type: 'school.chapter_taught'; subject: string; chapterId: string; on: string; via: 'parent' | 'child' | 'homework' }
  | { type: 'school.test_announced'; subject: string; on: string; chapters: string[] }
  // clock
  | { type: 'clock.wakeup'; reason: WakeReason; wakeupId: string }
  // agents report back
  | { type: 'plan.proposed'; date: string; plan: DayPlan; planner: 'llm' | 'code'; jobId: string }
  | { type: 'job.done'; jobId: string; kind: JobKind; resultRef?: string }
  | { type: 'job.failed'; jobId: string; kind: JobKind; error: string; final: boolean }
  | { type: 'notify.delivered' | 'notify.failed' | 'notify.opted_out'; notificationId: string; detail?: string }
  // safety and system
  | { type: 'safety.incident'; incidentId: string; severity: 'high' | 'critical' }
  | { type: 'safety.cleared'; incidentId: string; by: string }
  | { type: 'budget.threshold'; scope: 'child_day' | 'child_month' | 'global'; pct: 80 | 100 };
export type WakeReason = 'day_start' | 'school_return' | 'session_nudge_window' | 'wind_down' | 'night'
  | 'weekly_report' | 'review_due' | 'replan' | 'debounce_flush' | 'job_deadline';
```

`LessonOutcomeDigest` is small and derived: `{ itemsAttempted, independentCorrect, probesPassed[],
misconceptionsOpened[], misconceptionsResolved[], vibeClose: 'fine'|'strained'|'tired', teachBackDone }`.
It is computed by the Director's close step from the ledger, so the Conductor never re-reads turns.
Vibe arrives only as the coarse close label; vibe-temperament §4.1 forbids persisting session state.

### 3.2 Storage

```sql
-- db/migrations/0xx_conductor.sql
create table student_event (
  child_id     uuid not null references child(id) on delete cascade,
  seq          bigint generated always as identity,
  id           text not null,                       -- ULID from producer
  type         text not null,
  source       text not null,
  idem_key     text not null,
  occurred_at  timestamptz not null,
  received_at  timestamptz not null default now(),
  causation_id text,
  correlation_id text not null,
  body         jsonb not null,                       -- validated by zod at the API edge
  primary key (child_id, seq),
  unique (child_id, idem_key)                        -- C4 idempotent ingest
);
create index student_event_type on student_event (child_id, type, seq desc);

-- ingest (one statement, Neon HTTP-safe); returns nothing on a duplicate
-- insert into student_event (child_id,id,type,source,idem_key,occurred_at,correlation_id,causation_id,body)
-- values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (child_id, idem_key) do nothing returning seq;
```

`seq` is a global identity column; per-child order is `seq` order filtered by child, which is monotonic
because the composite key and inserts are append-only. Retention: events older than 400 days fold into the
snapshot and are deleted, except types the parent export needs [U: align with DPDP retention in
`safety/dpdp-deep.md`]. Child erasure cascades.

---

## 4. The Conductor's decision loop

### 4.1 State

```ts
// shared/conductor/state.ts
export type DayPhase = 'night' | 'planned' | 'active' | 'in_lesson' | 'idle' | 'wound_down' | 'paused' | 'safety_hold';
export interface ConductorState {
  childId: ChildId; reducerVersion: string; version: number; cursorSeq: number;
  tz: 'Asia/Kolkata' | string; today: string;               // local date the phase refers to
  phase: DayPhase;
  plan?: { date: string; plan: DayPlan; source: 'llm' | 'code'; adoptedAtSeq: number; rev: number };
  usage: { lessonMinToday: number; lessonsToday: number; voiceMinMonth: number };
  limits: { dailyMin: number; allowedFrom: string; allowedTo: string; breakEveryMin: number };   // from parent controls
  school: { testWindows: { subject: string; from: string; to: string; chapters: string[] }[];
            currentChapters: Record<string, string>; holidays: string[] };
  pending: { replanDebounceUntil?: string; jobs: Record<string, { kind: JobKind; idem: string; deadlineAt?: string }> };
  notify: { learningMsgsThisWeek: number; weekOf: string; lastReportWeek?: string };
  consent: Record<string, boolean>;                         // mirror of latest consent rows, folded from events
  safety: { holdIncidentId?: string };
  counters: { missedDays: number; lastActiveDate?: string };
}
```

The state is deliberately small (target < 8 KB). Learner-model facts are **not** in it: they are read
through the derived `ChildBrief` at decision points, so KT stays the single owner of mastery (§6).

### 4.2 The day state machine

```
          day_start wakeup (05:30 local, or 30 min before allowedFrom)
   night ───────────────────────────────────────────► planned        (Planner job enqueued at night;
     ▲                                                   │             plan already waiting by morning)
     │ night wakeup (allowedTo)                          │ app.opened
     │                                                   ▼
 wound_down ◄── usage.lessonMinToday ≥ dailyMin ──── active ◄──────── idle
     ▲                                                │   ▲   app.idle ≥ 10 min ─┘ ▲
     │                                lesson.started  │   │ lesson.ended            │ app.opened
     └──────── time-limit wrap at next natural stop ─ in_lesson ───────────────────┘
  any ──parent.pause──► paused ──(until passes | parent resumes)──► previous phase
  any ──safety.incident──► safety_hold ──safety.cleared──► active (never auto-exits; §5.8)
```

Allowed actions by phase (enforced by the reducer, tested as invariants in §12):

| phase | may start lessons | may notify child device | may notify parent | background jobs |
|---|---|---|---|---|
| night | no | no | safety only | consolidation, Forge prefetch, report prep, KT refit |
| planned / active / idle | yes (within limits) | in-app only, no push nudges to the child | per caps (parent-experience §0.6) | yes |
| in_lesson | (one lesson open) | Director owns the screen | no learning messages | low priority only |
| wound_down | no; calm "resting" screen | no | no | yes |
| paused | no | no | safety and account only | consolidation only |
| safety_hold | no | protocol only | protocol decides (incl. suppression branch, parent-experience §11) | none except safety |

There are **no absence nudges, no streaks, and no "come back" messages in any phase** (parent-experience
§11 table: "never"; learning-science rule 27). That is a reducer invariant, not a copy guideline.

### 4.3 Triggers and what each one may do

| trigger class | examples | reducer response (typical) |
|---|---|---|
| **time** | `day_start`, `school_return` (from timetable or parent setting), `wind_down`, `night`, `weekly_report` (parent-chosen day/time), `review_due` | change phase; enqueue Planner for tomorrow at `night`; enqueue Report writer T-30 h before send; set next wakeups |
| **child/device** | `app.opened`, `homework.submitted`, `practice.completed` | if no adopted plan: adopt the code plan now (never block the child on an LLM); homework → enqueue `homework.prepare` job (OCR + kit match) and put a homework slot first |
| **Director** | `lesson.ended`, `skill.milestone`, `module.requested` | update usage; enqueue Memory consolidator; debounce a re-plan; milestone `mastered` on a parent-asked skill → milestone notification candidate (≤ 1/week) |
| **parent** | `setting_changed`, `test_week_set`, `pause`, `ptm_requested`, `consent_changed` | limits/consent take effect at once (consent revocation cancels pending jobs for that purpose); test week → re-plan with revision weight; PTM → schedule |
| **school** | `calendar_synced`, `chapter_taught`, `test_announced` | update school mirror; re-plan; prefetch Forge assets for the chapter being taught next |
| **agents** | `plan.proposed`, `job.done`, `job.failed` | validate and adopt or reject plan (§4.5); clear pending; on `final` failure take the fallback path for that kind |
| **safety** | `safety.incident` | pre-empts everything: phase → `safety_hold`, cancel queued child-facing jobs, hand off to the safeguarding protocol. The Conductor never decides safety content |

### 4.4 The step function (one per batch of new events)

```ts
// server/conductor/step.js (shape; plain JS ESM like the rest of server/)
export async function step(childId, { maxEvents = 50, now = new Date() } = {}) {
  const lease = await acquireLease(childId, WORKER_ID, 30);         // §7.1; null → someone else is on it
  if (!lease) return { skipped: true };
  let { state, version } = lease;                                    // snapshot row
  const events = await q(`select * from student_event where child_id=$1 and seq>$2 order by seq limit $3`,
                         [childId, state.cursorSeq, maxEvents]);
  const commands = [], decisions = [];
  for (const ev of events) {
    const out = decide(state, ev, { now, cfg: CONFIG, brief: lazyBrief(childId) });  // pure, deterministic
    state = { ...out.state, cursorSeq: ev.seq };
    commands.push(...out.commands); decisions.push({ seq: ev.seq, rules: out.rulesFired, cmds: out.commands.length });
  }
  await conductorCommit(childId, version, state, commands, decisions); // ONE round trip, atomic, CAS on version
  if (events.length === maxEvents) await enqueueStep(childId);        // more to drain
}
```

`decide` is pure: it takes `now` and the brief as inputs, so a replay with the same inputs yields the same
commands byte for byte. `lazyBrief` reads the learner model only when a rule needs it, and its value is
hashed into the decision log so replays can be checked.

```ts
export type Command =
  | { kind: 'enqueue'; job: JobSpec }                       // §7.2
  | { kind: 'cancel'; jobIdem: string; reason: string }
  | { kind: 'wakeup'; at: string; reason: WakeReason; dedupe: string }
  | { kind: 'notify'; intent: NotifyIntent; dedupe: string }  // Notifier decides channel and wording
  | { kind: 'brief.refresh'; lessonId?: string }              // re-derive LessonBrief for the device
  | { kind: 'audit'; note: string };
```

### 4.5 Deliberation points: where the language model plans, and how code keeps it honest

| point | when | model (default → degrade) | input | output | validator rejects if |
|---|---|---|---|---|---|
| **Daily plan** | `night` wakeup for tomorrow; or on `app.opened` if none | gpt-5.6-luna → code planner | ChildBrief, due reviews (FSRS), school mirror, parent limits, yesterday's digests, interests | `DayPlan` (zod) | total minutes > limit; a slot outside allowed hours; fewer than 2 retrieval items opening the first session (rule 18); a topic whose prerequisites are below `practising` (rule 28); a format choice that labels a style (rule 22); a reward economy (rule 27); unknown topic id |
| **Re-plan** | debounced (≥ 5 min quiet) after `lesson.ended`, `test_announced`, `chapter_taught`, `setting_changed`, wheel-spin milestone | same | current plan + reason + delta | `DayPlan` rev+1 | as above, plus: rewrites a slot already started |
| **Weekly review** | Sunday night | gpt-5.6-terra (Batch) → luna → code template | week of digests, ledger deltas | `WeekIntent` (focus skills, revision mix, one home task candidate) | home task not tied to a ledger fact; more than one home task (parent-experience §0.5) |

```ts
export interface DayPlan {
  date: string; budgetMicroUsd: number;
  slots: Array<{
    id: string; kind: 'retrieval_warmup' | 'lesson' | 'homework' | 'practice' | 'revision' | 'teachback' | 'break';
    topicId?: string; skillIds?: string[]; minutes: number; window?: { from: string; to: string };
    format?: { primary: string; engineHints: string[] };   // content-format fit, never a learner label
    why: Array<{ code: 'due_review' | 'school_chapter' | 'test_window' | 'prereq_gap' | 'parent_request' | 'homework' | 'interest_context'; ref: string }>;
  }>;
  prefetch: Array<{ objectiveId: string; engine: string; specHash?: string; by: string }>;  // Forge, by = deadline
  notes?: string;   // shapes for the Director's brief, never sentences she could say (house rule)
}
```

**The code planner always exists and is always computed.** The LLM plan is adopted only if valid; both are
logged. The `why[]` codes are what the parent's "Kaise pata?" link (parent-experience §0.3) resolves
against. While n is small, run the LLM planner in shadow (computed, logged, not adopted) and compare it
with the code plan on delayed outcomes. Keep it only if it wins, per rule 37 and C1's reversal clause.

### 4.6 Snapshots and compaction

`conductor_state` *is* the snapshot: after every step it holds the fold up to `cursorSeq`. A full replay
from seq 0 (for tests, audits or a reducer upgrade) reads the event log, and the state can be checked for
equality with the stored snapshot. That is the drift alarm (§11). This is Temporal's continue-as-new
without the ceremony [S].

---

## 5. The agents

### 5.1 One contract for all of them

```ts
// shared/conductor/agents.ts
export type JobKind = 'plan.day' | 'plan.week' | 'forge.build' | 'forge.image' | 'forge.video' | 'forge.spec'
  | 'homework.prepare' | 'report.weekly' | 'report.ptm_summary' | 'memory.consolidate' | 'memory.nightly'
  | 'notify.send' | 'kt.refold' | 'conductor.step';
export interface JobSpec<I = unknown> {
  kind: JobKind; childId?: ChildId;              // undefined = library-level (Forge, refits)
  idemKey: string;                               // §8; unique per kind
  input: I;                                      // schema per kind, validated on enqueue AND on claim
  lane: 'fast' | 'slow' | 'sandbox';
  priority: 0 | 1 | 2 | 3;                       // 0 = child is waiting
  runAfter?: string; deadlineAt?: string;        // after deadline: run the fallback, keep the result for the library
  concurrencyKey?: string; concurrencyLimit?: number;   // e.g. `child:${id}` → 1, `azure:image` → 3
  budget: { maxMicroUsd: number; models: ModelTier[] };  // reserved before the first model call (§9)
  maxAttempts: number; leaseSec: number;
  correlationId: string; causationId: string;
}
export interface AgentResult<O = unknown> {
  ok: boolean; output?: O; resultRef?: string;   // large outputs live in their own table or blob
  spentMicroUsd: number; modelCalls: number;
  verification: { passed: boolean; checks: Array<{ id: string; ok: boolean; detail?: string }> };
  fallbackUsed?: string;
}
```

Every agent output passes a **code verification** before it becomes an event. "A model never grades" is
inherited law (ARCHITECTURE §0). That covers grading a child and grading another model's work alike, so
checks are schema, invariants, lints, headless renders and answer-key comparisons. A model judge may add a
signal, but it never gates on its own.

### 5.2 Director (per lesson; synchronous; not on the job queue)

- **In:** `LessonBrief` = the current plan slot + ChildBrief (≤ 600 tok, ARCHITECTURE §1.2) + prefetched
  module refs + `wrapAt` (from limits) + language and vibe directive. Built by `brief.refresh`, served to
  `/api/lesson/start`, cached per (lesson, plan rev).
- **Out:** `lesson.started`, `skill.milestone`, `module.requested`, `lesson.ended` with `outcomeDigest`.
- **Boundary contract:** the Conductor can set `wrapAt` and `holdNewTopics` on the brief. The Director
  checks them at natural stops. Only safety can end a lesson immediately (through the Director's own safety
  monitor, ARCHITECTURE §1.6).
- **Live content race ("the game is built while she teaches theory"):** at lesson start the Director emits
  `module.requested{specHash, deadlineAt = start + expected theory minutes}`. The Conductor turns it into
  a `forge.*` job with that deadline, but only if the library misses. If the artefact is ready and verified
  before the deadline, `job.done` → `brief.refresh` → the device receives a `module.ready` push on its
  existing poll. If not, the Director uses its T1 engine. The late artefact still lands in the library for
  the next child, so the spend is not wasted. Measure the hit rate before promising live codegen (§15).

### 5.3 Forge (content factory; ACA)

| sub-kind | lane / host | typical latency | default model → degrade | verification gate |
|---|---|---|---|---|
| `forge.spec` (T1 engine params) | fast / Vercel | 1-3 s [U] | luna → terra → kit default params | zod schema of the engine; param ranges |
| `forge.build` (T2 generated module) | sandbox / ACA Sandboxes, egress denied | minutes [S] | gpt-5.3-codex or Sonnet 5.5 → existing engine | static checks, headless render, postMessage protocol conformance (`ready/interaction/answer/goal_met`), answer-key replay, visual critique; ≤ 10 fix rounds; human review before library promotion (ARCHITECTURE §1.4) |
| `forge.image` | slow / ACA job | 17 s-2 min [S] | gpt-image-2 medium → low → library image → none | label overlay as SVG, never baked text; safety classifier |
| `forge.video` | slow / ACA job | minutes | sora-2 → none | **library-level only**, never per child, never on the live path; human review |

Forge is the only agent allowed an evaluator-optimizer loop. The loop sits inside one job, and every model
call and tool run is a checkpointed step (§7.5), so a crashed build resumes at the failed round instead of
starting over. Global concurrency keys (`azure:image` ≤ 3 against the 4 RPM quota [V]) keep Forge from
starving lessons.

### 5.4 Report writer

- Weekly report and PTM summary are generated from ledger facts only (parent-experience §8: engine/talk
  split). They pass the PX lints before `notify`.
- **Batch with a deadline.** The job is enqueued at send time minus 30 h on the Batch lane (50% off, 24 h
  target [S]). A `job_deadline` wakeup at send time minus 2 h re-runs it on the standard API if no result
  has arrived. The idempotency key is `report.weekly:{child}:{isoWeek}:{ledgerHash}`, so a re-run after new
  evidence is a new job and an unchanged ledger is a no-op.
- A zero-lesson week still sends on its day, with no guilt framing (PX7). The reducer emits the job anyway.

### 5.5 Memory consolidator

- `memory.consolidate` after each `lesson.ended`: luna extracts candidate episodic facts with turn
  citations and writes `memory` rows (cited, parent-visible). Consent `memory` is checked at claim time
  as well as at enqueue time, because consent can be revoked in between. Slow vibe knobs update here
  (vibe-temperament §4.1).
- `memory.nightly`: dedupe and decay, and refresh the derived ChildBrief cache. It is the "compression
  model" in Cognition's sense [V]. It never writes mastery (kt-algorithms D7).

### 5.6 Scheduler (pure code, no model)

Produces inputs for the planner and wakeups. FSRS due dates per skill/item (kt-algorithms §2.3), school
mirror (timetable → `school_return`, test windows → revision weight), festival and holiday calendar, parent
allowed hours. It runs inside `decide` as a library, not as a job, because it is fast and deterministic.

### 5.7 Notifier

- Takes a `NotifyIntent` (`weekly_report | milestone | safety | account | payment | ptm_summary`), never
  free text from a model. Chooses the channel (WhatsApp utility template, push, in-app), the send window
  (08:00-20:00; quiet hours 20:30-08:00 except safety) and enforces the caps (≤ 2 learning messages per
  week; milestone ≤ 1 per week), all from parent-experience §0, §8 and §11.
- Uses the `notification` outbox (§7.4). Delivery receipts come back as `notify.*` events. An opt-out
  ("STOP"/"Band karo") becomes `parent.setting_changed` and takes effect before the next send.
- Every string is written as if the child will read it (shared phone). Safety text never quotes the child.

### 5.8 Safety (outside the Conductor's authority)

The safety monitor runs synchronously in the lesson lane (ARCHITECTURE §1.6). The Conductor only *receives*
`safety.incident` and enters `safety_hold`. Exit requires `safety.cleared` from the protocol or a human,
never a timer. The parent-suppression branch (disclosure concerns a family member → route to Childline
1098, do not alert the parent) belongs to the safeguarding protocol, so the Notifier asks it before any
safety-class send.

### 5.9 Authority order (conflict resolution, highest first)

**safety protocol → consent → parent controls and limits → law-derived caps (quiet hours, message caps)
→ cost governor → Conductor plan → Director in-lesson choice → vibe knobs.** Encoded as an ordered list of
guard functions that run before any command leaves `decide`. A lower layer can never re-enable what a higher
one blocked; this mirrors vibe-temperament §4.1's precedence.

---

## 6. State ownership (one writer per fact)

| fact | owner (only writer) | readers | table |
|---|---|---|---|
| what happened to the child (boundary facts) | event producers via ingest API | Conductor, analytics, parent export | `student_event` |
| day phase, adopted plan, usage counters, caps counters | **Conductor** | Director (via brief), parent dashboard | `conductor_state` |
| per-turn transcript and moves | Director | consolidator, parent transcripts | `turn`, `lesson` |
| evidence and mastery | KT module (`api/learner/evidence`) | Director, planner, reports | `kt_evidence`, `kt_skill_state` |
| episodic memory, slow vibe knobs | Memory consolidator | brief builder | `memory`, `rel_state` |
| generated artefacts | Forge | Director, ModuleHost | `asset_cache`, `forge_artifact` |
| consent | consent API (parent action) | everyone, checked at enqueue and at claim | `consent` |
| parent limits and settings | parent API | Conductor (folded from events) | `parent_setting` + events |
| jobs and their attempts | Conductor creates; worker owns status while leased | ops | `job`, `agent_run` |
| money | cost governor | everyone | `cost_ledger`, `budget` |
| outbound messages | Notifier | ops, parent history | `notification` |

The parent API writes the settings row **and** emits `parent.setting_changed` in one transaction, so the
Conductor's folded copy can never disagree with the source for longer than one step.

---

## 7. Execution substrate on Neon

### 7.1 Lease and atomic commit

```sql
create table conductor_state (
  child_id uuid primary key references child(id) on delete cascade,
  reducer_version text not null, version bigint not null default 0, cursor_seq bigint not null default 0,
  state jsonb not null, lease_owner text, lease_until timestamptz, updated_at timestamptz not null default now());

-- acquire (one statement): free, expired, or already mine
update conductor_state set lease_owner=$2, lease_until=now()+make_interval(secs=>$3)
 where child_id=$1 and (lease_until is null or lease_until<now() or lease_owner=$2)
 returning version, cursor_seq, state;

-- commit: one call, atomic, compare-and-set; raises if another writer won (then the step re-runs)
create or replace function conductor_commit(p_child uuid, p_expected bigint, p_state jsonb, p_cursor bigint,
                                            p_reducer text, p_commands jsonb, p_decisions jsonb)
returns bigint language plpgsql as $$
declare v bigint;
begin
  update conductor_state set state=p_state, cursor_seq=p_cursor, reducer_version=p_reducer,
         version=version+1, lease_owner=null, lease_until=null, updated_at=now()
   where child_id=p_child and version=p_expected returning version into v;
  if v is null then raise exception 'conductor_cas_failed' using errcode='40001'; end if;
  insert into job (kind, child_id, idem_key, input, lane, priority, run_after, deadline_at, concurrency_key,
                   concurrency_limit, budget, max_attempts, lease_sec, correlation_id, causation_id)
    select c->>'kind', p_child, c->>'idemKey', c->'input', c->>'lane', (c->>'priority')::int,
           coalesce((c->>'runAfter')::timestamptz, now()), (c->>'deadlineAt')::timestamptz, c->>'concurrencyKey',
           (c->>'concurrencyLimit')::int, c->'budget', (c->>'maxAttempts')::int, (c->>'leaseSec')::int,
           c->>'correlationId', c->>'causationId'
      from jsonb_array_elements(p_commands) e(x), lateral (select x->'job' as c) j
     where x->>'kind'='enqueue'
    on conflict (kind, idem_key) do nothing;
  update job set status='cancelled' where status in ('queued','retry')
     and idem_key in (select x->>'jobIdem' from jsonb_array_elements(p_commands) e(x) where x->>'kind'='cancel');
  insert into wakeup (child_id, due_at, reason, dedupe)
    select p_child, (x->>'at')::timestamptz, x->>'reason', x->>'dedupe'
      from jsonb_array_elements(p_commands) e(x) where x->>'kind'='wakeup'
    on conflict (child_id, dedupe) do update set due_at=excluded.due_at where wakeup.fired_at is null;
  insert into notification (child_id, intent, dedupe, status)
    select p_child, x->'intent', x->>'dedupe', 'pending'
      from jsonb_array_elements(p_commands) e(x) where x->>'kind'='notify'
    on conflict (child_id, dedupe) do nothing;
  insert into decision_log (child_id, version, decisions, commands) values (p_child, v, p_decisions, p_commands);
  return v;
end $$;
```

The lease is for **efficiency**: it stops two workers from spending model calls on the same child. The
version check is for **correctness**: even if a lease expires mid-step (a slow brief read, a GC pause), the
loser's commit raises and nothing it computed is written. One function call means one HTTP round trip from
Vercel to Neon in Singapore.

### 7.2 Jobs

```sql
create table job (
  id bigint generated always as identity primary key,
  kind text not null, child_id uuid references child(id) on delete cascade, idem_key text not null,
  input jsonb not null, lane text not null, priority smallint not null default 2,
  status text not null default 'queued',            -- queued|running|retry|done|failed|cancelled|dead
  run_after timestamptz not null default now(), deadline_at timestamptz,
  concurrency_key text, concurrency_limit int, budget jsonb not null,
  attempts int not null default 0, max_attempts int not null default 5,
  lease_sec int not null default 60, lease_until timestamptz, worker text,
  result_ref text, last_error text, correlation_id text not null, causation_id text,
  created_at timestamptz not null default now(), finished_at timestamptz,
  unique (kind, idem_key));
create index job_ready on job (lane, priority, run_after) where status in ('queued','retry');
create index job_expired on job (lane, lease_until) where status = 'running';

-- claim (one statement): ready jobs, or running jobs whose lease expired (crashed worker)
with c as (
  select id from job
   where lane=$1 and ((status in ('queued','retry') and run_after<=now())
                      or (status='running' and lease_until<now()))
     and (concurrency_key is null or (select count(*) from job r where r.concurrency_key=job.concurrency_key
                                       and r.status='running' and r.lease_until>now()) < concurrency_limit)
   order by priority, run_after
   for update skip locked limit $2)
update job j set status='running', attempts=j.attempts+1, worker=$3,
       lease_until=now()+make_interval(secs=>j.lease_sec)
  from c where j.id=c.id
returning j.*;          -- j.attempts is the fencing token

-- complete: only the holder of the current attempt may finish (zombie workers are fenced out)
update job set status='done', result_ref=$3, finished_at=now(), lease_until=null
 where id=$1 and attempts=$2 and status='running';
```

- **Caveat, stated honestly:** the concurrency subquery can over-admit by one or two under heavy contention,
  because SKIP LOCKED does not serialize the count [S]. For the two limits that must be exact (one
  `conductor.step` per child, and Azure realtime admission), use the lease row and the token bucket (§9.3)
  respectively, not this subquery.
- **Retry:** on a transient error, `status='retry', run_after = now() + least(2^attempts, 300) s ± 20%
  jitter`. After `max_attempts` the job goes to `dead` and a `job.failed{final:true}` event is emitted. The
  reducer takes that kind's fallback, and the ops dashboard shows the dead-letter count.
- **Heartbeat:** long jobs extend `lease_until` every `lease_sec/3` with the same fencing condition.

### 7.3 Lanes and hosts

| lane | host | claimer | max run | jobs |
|---|---|---|---|---|
| `fast` | Vercel function `api/[...route].js` (sin1) | inline after ingest (`waitUntil`) + ticker drain | 60 s by policy (300/800 s platform cap [V]) | `conductor.step`, `plan.*`, `forge.spec`, `homework.prepare`, `memory.consolidate`, `notify.send` |
| `slow` | ACA job, event-triggered by a KEDA Postgres scaler, or a min-0 ACA app polling | ACA worker | 30 min (`replicaTimeout`) [V] | `forge.image`, `forge.video`, `report.*` batch submit/collect, `memory.nightly`, `kt.refold`, KT refit |
| `sandbox` | ACA worker that drives ACA Sandboxes (sub-second start, snapshots, egress policy) [V] | ACA worker | per build | `forge.build` |

ACA lives in Azure, while the Neon DB is in aws-ap-southeast-1. Cross-cloud latency is irrelevant for the
slow lanes, which run minutes, and the fast lane stays in Vercel sin1 next to the DB (`context/decisions.md`
infra-segment) [V].

### 7.4 Wakeups and notifications

```sql
create table wakeup (child_id uuid not null references child(id) on delete cascade, dedupe text not null,
  due_at timestamptz not null, reason text not null, fired_at timestamptz, primary key (child_id, dedupe));
create index wakeup_due on wakeup (due_at) where fired_at is null;

-- ticker (every minute; also run for one child on any request from that child's device):
with d as (select child_id, dedupe from wakeup where fired_at is null and due_at<=now()
            order by due_at for update skip locked limit 500)
update wakeup w set fired_at=now() from d where w.child_id=d.child_id and w.dedupe=d.dedupe
returning w.child_id, w.dedupe, w.reason;
-- then for each row: ingest clock.wakeup with idemKey = 'wake:'||dedupe, and enqueue conductor.step

create table notification (id bigint generated always as identity primary key,
  child_id uuid references child(id) on delete cascade, intent jsonb not null, dedupe text not null,
  status text not null, channel text, provider_id text, send_after timestamptz, sent_at timestamptz,
  unique (child_id, dedupe));
```

Wakeup `dedupe` keys are semantic (`day_start:2026-10-03`, `weekly_report:2026-W40`), so re-scheduling
moves the row instead of adding another. Missing a minute is harmless because the next tick catches
everything `<= now()`.

### 7.5 Checkpointed steps inside long agents

```sql
create table agent_run (job_id bigint not null references job(id) on delete cascade, attempt int not null,
  step_key text not null, output jsonb, spent_micro_usd bigint not null default 0, at timestamptz default now(),
  primary key (job_id, step_key));
```

`await durableStep(jobId, 'round-3:render', () => headlessRender(code))` returns the stored output if the
key exists and otherwise runs and stores it. This gives DBOS semantics (one write per step; idempotent
steps; deterministic driver) [V] without adopting the library, because DBOS assumes long-lived server
processes, which a serverless function is not [V: the architecture page describes "multiple server
processes"]. On the ACA lanes, DBOS or the Workflow SDK Postgres World are drop-in options if the
home-grown helper grows (§14).

---

## 8. Idempotency, layer by layer

| layer | key | guarantees |
|---|---|---|
| device → ingest | client ULID + `idemKey` (e.g. `app.opened:{deviceSession}`, `homework:{photoHash}`) | retries on patchy data (learning-science rule 30) insert once |
| Director → ingest | `lesson.ended:{lessonId}`, `milestone:{skill}:{to}:{evidenceSeq}` | a re-sent close is one event |
| parent → ingest | `setting:{key}:{settingsRowVersion}` | double-tap is one change |
| clock → ingest | `wake:{dedupe}` | ticker overlap is harmless |
| Conductor → jobs | `{kind}:{child}:{semanticScope}`: `plan.day:{child}:{date}:{planInputsHash}`, `memory.consolidate:{lessonId}`, `forge.build:{objective}:{engine}:{specHash}:{modelV}` (no child: library-level), `report.weekly:{child}:{isoWeek}:{ledgerHash}` | `unique(kind, idem_key)`; replaying the reducer re-emits the same keys → no duplicates |
| worker → side effects | provider idempotency where offered (WhatsApp send keyed by `notification.id`); otherwise check-then-act on our own row under the fencing token | at-least-once execution, effectively-once effects |
| model calls | `agent_run.step_key` | a crash between call and commit replays the stored output, not the paid call |

The rule that ties it together: **every key is derived from the facts that caused the work, never from a
clock or a random number**. A fresh ULID is minted only at the edge, once per real-world fact.

---

## 9. Cost governor

### 9.1 Unit economics (why this is existential)

| line | number | tag |
|---|---|---|
| proven Hindi-belt AI voice price | ₹299/month ≈ $3.1 (₹96/$) | [S] market docs |
| tuition comparator | human 1:1 ₹800-1,030/h; PW-style batch ≈ ₹2,155-6,240/month | [S] market docs |
| 45-min live lesson, gpt-realtime-2.1, 1-turn audio window | $3.9 (floor: $1.38 audio-out alone) | [V] tech-and-market §1.9 |
| same on 2.1-mini | $0.96 | [V] |
| cascaded lite mode (STT → luna → TTS) | ≈ $0.35 | [V] model; [U] quality |
| text models | luna $0.20/$1.20, terra $2/$12, sol $4/$20 per M tokens | [V] tech-and-market §5 |
| Claude Sonnet 5.5 / Opus 5.5 on Foundry | $2/$10 and $4/$20 per M, cache read $0.20 | [S] |
| gpt-image-2 | ≈ $0.006 low / $0.053 medium / $0.211 high per 1024² image | [S] |
| sora-2 | $0.10 per second | [S] |

So the price tier, not the architecture, decides how many live voice minutes a child gets. The governor
makes whatever tier the owner picks *hold*. A sketch of the orchestration overhead the Conductor itself
adds per child per month [U, to be measured]: 30 day-plans on luna (~6k in / 1k out ≈ $0.0024 each) ≈
$0.07; 20 consolidations on luna ≈ $0.05; 4 weekly reports on terra via Batch ≈ $0.08; re-plans ≈ $0.03.
That totals **≈ $0.25/child/month**, plus Forge, which is amortized across children (C8). The background
"AI that runs the day" is cheap. The live voice is the cost.

### 9.2 Budgets and reservations

```sql
create table budget (scope text not null, scope_id text not null, period text not null,  -- 'day:2026-10-02' | 'month:2026-10'
  limit_micro_usd bigint not null, reserved_micro_usd bigint not null default 0, spent_micro_usd bigint not null default 0,
  primary key (scope, scope_id, period));              -- scope: child | tier | global | deployment
create table cost_ledger (id bigint generated always as identity primary key, child_id uuid, job_id bigint,
  lesson_id uuid, kind text not null, model text not null, units jsonb not null,  -- tokens by class, seconds, images
  micro_usd bigint not null, reservation_id text, correlation_id text not null, at timestamptz default now());

-- reserve (atomic; fails closed when the limit would be exceeded)
update budget set reserved_micro_usd = reserved_micro_usd + $4
 where scope=$1 and scope_id=$2 and period=$3 and spent_micro_usd + reserved_micro_usd + $4 <= limit_micro_usd
returning *;
-- settle: reserved -= estimate, spent += actual (from usage fields of the response); ledger row inserted
```

- A reservation is taken for the **worst case** of the call (max output tokens × price), then settled with
  the actual usage. If the reservation fails, the governor returns the next rung of the degrade ladder
  instead of an error.
- Live lessons reserve per **5-minute block** of voice, so an over-budget child is wrapped at a natural
  stop, never cut off mid-sentence. The cut-off rule is the Director's `wrapAt`, which the governor sets.
- Thresholds at 80% and 100% emit `budget.threshold` events. The reducer reacts (e.g. tomorrow's plan
  uses lite mode for practice) and never messages the child about money.

### 9.3 Global admission and rate limits

Azure deployments have hard RPM caps (realtime 10 RPM and image 4 RPM at creation, `context/decisions.md`
[V]). A Postgres token bucket per deployment (`rate_bucket(deployment, tokens, refilled_at)`, refilled
lazily with one atomic `update … returning`) gates every call. Lesson starts take priority 0: when the
realtime bucket is empty, a child gets "teacher is getting ready" for a few seconds, and Forge and reports
wait. This is the Conductor's capacity duty: at 10 RPM, peak-hour lesson starts are capped at about 10 per
minute across all children until quota is raised. That is a launch blocker to log, not a tuning detail.

### 9.4 The degrade ladder (every rung keeps teaching correct)

| work | rung 0 | rung 1 | rung 2 | floor (zero marginal model cost) |
|---|---|---|---|---|
| live voice | gpt-realtime-2.1 | 2.1-mini (rejected as primary teacher, `context/rejected.md`; allowed for practice drills [U]) | cascaded lite mode | tap-to-answer practice from the kit, cached narration |
| day plan | luna planner | — | — | code planner |
| interactive module | library hit | T1 engine params (luna) | kit default engine | static worked example from the kit |
| illustration | library | gpt-image-2 medium (prefetch only) | low | SVG diagram / none |
| video | library | — | — | none (video is never generated per child) |
| report | terra Batch | luna standard | — | template from ledger facts |

Rule: **degradation may change richness, never correctness or safety.** Everything below rung 0 still
uses verified kit answers, the hint ladder and the safety floor.

---

## 10. Reliability: failure modes and designed behaviour

| failure | detection | behaviour |
|---|---|---|
| worker crash mid-job | lease expiry | re-claimed; checkpointed steps skip paid calls; fencing token blocks the zombie's completion write |
| duplicate delivery (client retry, ticker overlap) | unique idem keys | no-op insert; reducer never sees it twice |
| two Conductor steps race | lease; CAS raises `40001` | loser retries from the fresh snapshot; nothing it computed is written |
| LLM returns an invalid plan | zod + validator | code plan adopted; `plan.rejected` logged with the failing rule (feeds the planner eval) |
| Azure 429 / outage | error class | retry with jitter; after the deadline take the fallback; the realtime outage path is "lite mode" or tap practice |
| Neon unavailable | ingest fails | device queues events locally (ULIDs keep them idempotent) and the lesson continues on its last brief; the Director's per-turn route already depends on Neon, so this equals a lesson outage and needs a UI state [U] |
| ticker host down | `max(now() - due_at)` of unfired wakeups > 5 min alert | piggyback drains keep active children moving; the night jobs catch up |
| reducer bug in a new deploy | replay-equality check on deploy (§11); `reducer_version` per row | rainbow rule (Anthropic [V]): a row keeps its `reducer_version` until `night`; new versions take over at the day boundary, so a day is never interpreted under two rule sets |
| poison event (handler throws) | step fails 3× on the same seq | event marked `quarantined` in `decision_log`, cursor advances, ops alerted. The child's day continues; the parent export still contains the event |
| consent revoked mid-flight | consent checked at claim | job cancelled; already-written derived data is erased by the deletion flow |
| runaway cost | budget reservation fails closed | degrade ladder; `budget.threshold`; global kill switch per deployment in `budget(scope='deployment')` |

---

## 11. Observability

- **One correlation id from cause to cost.** `student_event.correlation_id` → `decision_log` → `job` →
  `agent_run` → `cost_ledger`, all carrying the same id. Spans use the OTel GenAI names (`invoke_agent
  {kind}`, `chat {model}`, `execute_tool {name}`) and `gen_ai.usage.*` attributes, but those conventions
  are still experimental, so keep the raw usage fields as well [S].
- **The flight recorder.** `GET /api/ops/child/:id/timeline` merges events, decisions (rules fired, commands),
  jobs and costs into one ordered list. It answers "why did she do that?" for the owner, and its `why[]`
  codes back the parent's "Kaise pata?" (with parent-visibility filtering per parent-experience §12).
- **Drift alarm.** Nightly: for a 1% sample of children, replay from the last checkpoint (and from seq 0
  weekly) and compare with `conductor_state`. A mismatch means the reducer is not pure or the event log was
  edited, and that is a P1.
- **SLOs [U, starting targets]:** ingest → decision p95 < 2 s; `plan.day` ready before `day_start` for
  99% of active children; jobs `dead` < 0.1%/day; unfired wakeup lag p99 < 2 min; notification sends
  outside the allowed window = 0 (hard); learning messages per parent per week ≤ 2 (hard); cost per
  child-day within tier (hard, budget-enforced).
- **Privacy in telemetry:** traces carry ids and rule codes, never transcripts or child text. Transcripts
  stay in `turn` under parent visibility rules (Anthropic kept "high-level observability … while preserving
  user privacy" for the same reason [V]).

---

## 12. Testing

1. **Reducer unit tests** (`node --test tests/conductor/*.test.mjs`): table-driven `(state, event, now) →
   (state', commands)` cases for every row of §4.3.
2. **Invariants** (the gate; "if your change trips them, your change is wrong"), checked after every
   simulated event:
   - No `notify` with intent ∈ {absence, streak, come_back} can be constructed (type-level and runtime).
   - No learning notification outside 08:00-20:00 local or beyond 2 per ISO week; safety bypasses both.
   - No lesson start when `phase ∈ {night, wound_down, paused, safety_hold}` or when usage would exceed
     `dailyMin`.
   - In `safety_hold` the only commands emitted are safety-protocol ones.
   - Replaying any event twice yields identical state and no new commands (idempotency).
   - `decide` is deterministic: same inputs → byte-identical outputs (hash compared).
   - Every adopted plan passes the §4.5 validator; every plan's first session opens with ≥ 2 retrieval
     items when any are due.
   - Budget: `spent + reserved ≤ limit` for every scope at every step.
   - Consent: no job of a revoked purpose is claimed after revocation.
3. **Day simulator** (`evals/conductor-sim/`, the analogue of html-portfolio's echosim): a virtual clock
   and N synthetic children (personas: steady learner; drop-off after day 3; test week announced
   mid-week; shared phone with two siblings; parent who changes limits at 23:00; patchy network that
   replays events; Azure 429 storms; LLM planner returning invalid plans 20% of the time). It runs 8
   seeds × 6 personas × 4 simulated weeks and prints tables: plan adherence, minutes, invariant
   violations, jobs dead, cost per child-week, report on-time rate. Run it before and after any reducer
   change and diff the tables. It goes in `verify-release` with the reducer bundled from the real source.
4. **Fault injection** in the simulator's substrate shim: kill a worker between side effect and
   completion; expire a lease mid-step; deliver wakeups twice; skew device clocks ±2 h.
5. **Contract tests per agent:** each `JobKind` has a fixture input, a schema-valid output, and a
   verification-failure output. The worker must route all three correctly (done / fallback / retry).
6. **Live shadow:** the LLM planner (and any reducer change) runs in shadow on real traffic with outcomes
   logged and nothing adopted, until a pre-registered comparison on delayed outcomes clears it (rule 37).

---

## 13. "A little VM per student"

The owner's intuition is right about the **shape**: each child has a long-lived, private, stateful thing
that remembers and acts on its own schedule. The cheapest faithful implementation is a **virtual actor**
(Orleans/Restate/Durable Entities style [V]). It is a row and a mailbox that exists only while it is
processing, wakes on a timer or an event, and costs nothing when idle. A literal always-on container per
child is about $15-20/month at ACA consumption rates [U]. That is five times the likely revenue, with no
gain, because the child is idle more than 95% of the day.

Where real isolated compute *is* needed:
- **Forge builds** run untrusted generated code, so each build gets an ACA Sandbox with egress denied,
  sub-second start from a warm pool, and a snapshot of the toolchain [V]. That is per job, not per child.
- **A child's own creations** (a later feature: the child builds a game with the teacher) could get a
  *suspended* per-child sandbox snapshot that resumes in under a second when opened [V]. Price it by stored
  snapshot before promising it [U].

---

## 14. Build order and the migration path

1. **M0 (with the first live lessons):** `student_event` ingest + `conductor_state` + code planner +
   `lesson.ended → memory.consolidate` + wakeups + ticker on an ACA scheduled job (or Vercel Pro cron).
   No LLM planner yet. The simulator and the invariants land in the same PR.
2. **M1:** Notifier + weekly report (Batch with deadline fallback) + parent settings as events + cost
   governor (reserve/settle, realtime token bucket).
3. **M2:** LLM day planner in shadow, then adopted behind the validator; school sync events; homework
   prepare.
4. **M3:** Forge lanes on ACA (spec → image → build in Sandboxes); `module.requested` live race with
   deadline; library promotion with human review.
5. **Substrate swap, only on C2's reversal condition:** the reducer, event schema, job contracts and
   idempotency keys are host-agnostic. Moving to Vercel Workflows means one workflow per job kind using
   the same keys, while the Conductor's mailbox stays in Postgres; note Hobby keeps run data 1 day and Pro
   7 days [V], so our own tables remain the audit record. Moving to Restate or Temporal maps the child
   actor to a Virtual Object or entity workflow. Neither changes `decide`.

---

## 15. Measurements this design depends on (log each with n, method, date in `context/measurements.md`)

| id | measure | why it matters | method |
|---|---|---|---|
| CM1 | fold + decide latency per step, p50/p95 | §11 SLO; C3 reversal | simulator with 1 year of synthetic events per child |
| CM2 | Neon round trips and compute-hours per 1k active children/day (incl. ticker polling) | C4 reversal; scale-to-zero interaction | staging load test |
| CM3 | LLM planner vs code planner: plan validity rate, adoption rate, delayed retrieval, session completion | C1 reversal; whether the "AI plans the day" claim earns its cost | shadow, then pre-registered micro-RCT |
| CM4 | Forge library hit rate per lesson, and live-race on-time rate (artefact ready before `deadlineAt`) | whether "a game is built while she teaches" is real or a fallback every time | production logs by objective |
| CM5 | realtime admission wait at peak (19:00-21:00 IST) under the 10 RPM cap | capacity blocker (§9.3) | load test against the deployment |
| CM6 | actual cost per child-day by tier vs the §9.1 sketch | C7 | `cost_ledger` |
| CM7 | Batch report on-time rate before the T-2 h fallback | §5.4 | ledger of report jobs |
| CM8 | wakeup lag with the ticker down (piggyback only) | C5 degradation | fault drill |

## 16. Open questions

1. **Vercel plan.** Hobby (daily cron, 300 s functions, 1-day Workflow retention) vs Pro (per-minute cron,
   800 s) [V]. The design works on Hobby only with an external ticker. Decide before M0.
2. **Price tier vs live minutes.** At ₹299, one 2.1 lesson per month exceeds revenue (§9.1). The governor
   enforces whatever the owner decides; the decision itself (tier price, live minutes per tier, lite mode
   share) is a product call that must be logged with a reversal condition.
3. **School sync source.** Parent entry, child mention, homework OCR, or a school-partnership feed (the
   DPDP educational-institution route, learning-science rule 34). Each one changes how much `school.*`
   events can be trusted. Tag events with `via` and weight them.
4. **Quota.** Request higher realtime RPM before any public launch. CM5 decides how much.
5. **gpt-5.3-codex vs Sonnet 5.5 for Forge builds.** Run a bake-off on the T2 pass rate after the fix
   loop and the cost per promoted artefact. Do not assume either.

---

## 17. Sources

- Anthropic, *Building effective agents* — https://www.anthropic.com/engineering/building-effective-agents [V]
- Anthropic, *How we built our multi-agent research system* — https://www.anthropic.com/engineering/multi-agent-research-system [V]
- Cognition, *Don't build multi-agents* — https://cognition.com/blog/dont-build-multi-agents [V]
- HumanLayer, *12-factor agents* — https://github.com/humanlayer/12-factor-agents [V]
- Cemri et al. 2025, *Why do multi-agent LLM systems fail?* (MAST) — https://arxiv.org/abs/2503.13657 [S]
- Han & Zhang 2025, blackboard LLM-MAS — https://arxiv.org/abs/2507.01701 ; Salemi et al. 2025 — https://arxiv.org/abs/2510.01285 [S]
- OpenAI Agents SDK (JS) — https://openai.github.io/openai-agents-js/ [S]
- LangGraph checkpointers / interrupts — https://docs.langchain.com/oss/python/langgraph/checkpointers , https://docs.langchain.com/oss/python/langgraph/interrupts [S]
- Temporal entity workflow pattern — https://docs.temporal.io/design-patterns/entity-workflow [S]
- Restate services and Virtual Objects — https://docs.restate.dev/concepts/services [V]
- Azure Durable Entities — https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-entities [V]
- Azure Container Apps jobs — https://learn.microsoft.com/en-us/azure/container-apps/jobs [V]
- Azure Container Apps Sandboxes — https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-overview [V]; dynamic sessions — https://learn.microsoft.com/en-us/azure/container-apps/sessions [S]
- Azure Container Apps pricing (free grants; per-second consumption) — https://azure.microsoft.com/en-us/pricing/details/container-apps/ [V]
- Vercel cron limits — https://vercel.com/docs/cron-jobs/usage-and-pricing [V]
- Vercel function duration — https://vercel.com/docs/functions/configuring-functions/duration [V]
- Vercel Workflows and pricing/limits — https://vercel.com/docs/workflows , https://vercel.com/docs/workflows/pricing [V]
- Vercel Queues public beta and pricing — https://vercel.com/changelog/vercel-queues-now-in-public-beta , https://vercel.com/docs/queues/pricing [S]
- Workflow SDK Postgres World — https://workflow-sdk.dev/worlds/postgres [S]
- DBOS architecture — https://docs.dbos.dev/architecture [V]
- Inngest flow control — https://www.inngest.com/docs/guides/flow-control [V]
- Trigger.dev concurrency and idempotency — https://trigger.dev/docs/queue-concurrency , https://trigger.dev/docs/idempotency [S]
- Neon serverless driver (HTTP, non-interactive transactions) — https://neon.com/docs/serverless/serverless-driver [S]
- Neon pg_cron (does not run at scale-to-zero) — https://neon.com/docs/extensions/pg_cron [S]; Neon Function Triggers — https://neon.com/blog/your-neon-functions-can-now-run-on-a-schedule [V]
- SKIP LOCKED concurrency-limit caveat — https://terrislinenbach.medium.com/why-for-update-skip-locked-isnt-enough-using-pg-advisory-xact-lock-to-build-a-correct-postgresql-d3eb9db46473 [S]
- Azure OpenAI Batch — https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/batch [S]
- OpenTelemetry GenAI agent spans — https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md [S]
- Sora 2 on Azure Foundry pricing — https://azure.microsoft.com/en-us/blog/sora-2-now-available-in-azure-ai-foundry/ [S]
- Claude Opus/Sonnet 5.5 on Foundry pricing — https://technspire.com/en/blog/claude-opus-5-5-foundry-opus-5-migration-cost-math [S]
- Internal: `docs/ARCHITECTURE.md`; `docs/research/learning-science.md` §6; `docs/research/learner/kt-algorithms.md`; `docs/research/learner/vibe-temperament.md`; `docs/research/design/parent-experience.md`; `docs/research/tech-and-market.md` §1.9; `context/decisions.md`; `context/rejected.md`.
