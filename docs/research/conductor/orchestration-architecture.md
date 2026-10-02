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

---

## Architect review

**Date:** 2026-10-02 · **Reviewer stance:** adversarial systems architect. Read against `context/decisions.md`,
`context/measurements.md`, `context/rejected.md`, the repo `CLAUDE.md` binding constraints and the sibling
conductor docs (`day-cycle.*`, `student-workspace.*`, `parent-loop.*`, `observability-evals.md`).
Tags as above: **[V]** checked this session against the primary source, **[S]** secondary, **[U]** estimate or
design default to measure, **[repo]** a fact in this repository.

**Verdict.** The core shape is right and should survive: a pure reducer, a state row per child, one event log,
an outbox written in the same transaction, idempotency keys derived from facts, and a code planner that always
exists. Four things are wrong enough to block M0:
1. **The host premise is stale.** The design is laid out for Vercel sin1 next to a Singapore Neon. The
   repo has since moved to Azure Container Apps in eastus2 and Neon US East.
2. **The event log can silently skip events**, because `seq` order is not commit order.
3. **Three of the "atomic" hand-offs are not atomic**: ticker → event, job → `job.done`, and step → next step.
4. **The live codegen race contradicts the human-review law**, so it can only spend money, never put a game
   in front of a child.

Beyond those, the v1 scope is roughly twice what a first cohort needs, and several child-facing moments
(admission waits, plan churn, safety holds, hitting the cap mid-homework) are left undesigned.

### R0. Findings on one screen

Severity: **P0** = fix before M0 ships. **P1** = fix before more than ~1k children or before the named
milestone. **P2** = simplification or clean-up.

| id | sev | finding | fix (section) |
|---|---|---|---|
| A1 | P0 | §7.3, §1 and C5 assume Vercel functions (sin1) and the Neon HTTP driver. Binding decisions `azure-only-compute` and `hosting-azure-container-apps` moved web+API to ACA `taxila-web` (eastus2, min 1 / max 5, HTTP-scaled), and Neon to `aws-us-east-1` reached over a `pg` Pool at 9-12 ms/query [repo] | Rebase lanes on ACA: a separate `taxila-worker` app for ticker and claims (R1) |
| A2 | P0 | `student_event.seq` is an identity column. A sequence value is taken before commit, so a slower transaction can commit a *lower* seq after the step has already advanced `cursorSeq` past it. That event is never folded [V event-driven.io] | Per-child sequence under a row lock (R2.1) |
| A3 | P0 | Ticker marks `fired_at` and *then* ingests `clock.wakeup` in a separate step. A crash between the two loses the wakeup forever (the dual write that C4 exists to forbid) | One statement / one function (R2.2) |
| A4 | P0 | Job completion and the `job.done`/`job.failed` event are not specified as one transaction. If the event is lost, `pending.jobs` never clears and a plan is never adopted | `complete_job()` (R2.3) |
| A5 | P0 | Events that arrive while a step holds the lease are noticed only by the next ticker or event, so a child can wait up to a minute after `lesson.ended` | `conductor_commit` returns `has_more` from inside the transaction (R2.4) |
| A6 | P0 | §5.2 live race: a `forge.build` (T2/T3 generated code) result is pushed to the device as `module.ready`. But §5.3, ARCHITECTURE §1.4 and day-cycle N5 all require human review before any generated code reaches a child. The race can never deliver, so every library miss is pure spend | Live path limited to T1 params + scene DSL. Codegen only offline into a review queue (R3.1) |
| A7 | P0 | Banned models in the design: Claude Sonnet 5.5 (§5.3 degrade, §9.1, §16 q5) and `gpt-5.6-terra` (§4.5 weekly review, §5.3, §9.4). The allowed list has sol/luna/codex only [repo `azure-only-compute`, `claude-on-foundry-credits`] | Replace terra→`taxila-brain` (sol) or `taxila-fast` (luna). Delete the Sonnet bake-off (R3.6) |
| A8 | P1 | Batch lane: Azure Batch needs a separate `GlobalBatch`/`DataZoneBatch` *deployment*. The supported-model table does not list the gpt-5.6 family. Jobs past 24 h are not expired, so the T-2 h standard re-run pays twice unless the batch is cancelled [V] | Drop Batch from v1 (saves ≈ $0.04/child-month). If revived, cancel on fallback (R3.4) |
| A9 | P1 | `report.weekly` idem key includes `ledgerHash`, so every lesson in the 30 h window mints a new report job: N reports paid per week, and the last writer wins | Fixed data cutoff; key without the hash (R3.4) |
| A10 | P1 | Thundering herd: every IST child shares `day_start 05:30`, `night`, and Sunday `weekly_report`. Ticker drains 500/min. At 100k children that is a 200-minute backlog plus a TPM spike on luna | Per-child jitter, loop-until-empty drain, plan only recently active children (R3.2) |
| A11 | P1 | Cost governor reserves on every model call. That includes per-turn Director calls, which hit hot `global`/`deployment` budget rows and the `rate_bucket` row. This adds 2 round trips per child turn and a single-row lock at peak | Reserve per lesson block; exact PG admission only for realtime session starts (R3.3) |
| A12 | P1 | Realtime leaks: TV/sibling noise triggers server VAD (teacher talks to the TV and bills tokens). Sessions hard-stop at 60 min [V]. Every reconnect after a network drop is a new session start against the 10 RPM cap | Idle hang-up, session renewal, reconnect priority (R3.3) |
| A13 | P1 | Single points of failure not named: one Neon compute for ingest + Director + queue + governor; one realtime deployment in one region; **one human** to clear `safety_hold` and to review Forge output | R4 |
| A14 | P1 | Five overlapping specs for the same facts across sibling docs: two `DayPhase` enums, two `DayPlan` types, `day_plan` vs `conductor_state.plan`, `day_event` vs `student_event`, `notification_log` vs `notification`, `wrapAt` vs `hardStopAt`, cap = lesson minutes vs all slots | One owner per fact, applied to the specs (R5) |
| A15 | P1 | Replay is not deterministic as written. `lazyBrief` reads live KT, and `now` is per batch, but neither is recorded. The nightly drift alarm (§11) will page on every child whose mastery changed | Record `now` + brief digest *and value* in `decision_log` (R2.8) |
| A16 | P1 | Poison-event quarantine advances the cursor. If the poisoned event is `parent.consent_changed{granted:false}`, `parent.pause` or `safety.incident`, skipping it continues the day *against* a higher authority (§5.9) | Authority events never skip; they fail into a hold (R2.9) |
| A17 | P2 | `conductor_commit` parses commands out of jsonb in plpgsql. That made sense for the HTTP driver's non-interactive transactions. With a `pg` Pool it is the hardest code in the system to test and evolve (every new `Command` kind is a migration) | Plain interactive transaction in JS (R6) |
| A18 | P2 | Rainbow reducer versions, Batch lane, KEDA scaler, generic concurrency keys, OTel GenAI spans, 400-day fold, nightly replay at M0 | Defer (R6) |
| A19 | P1 | Child experience gaps: admission waits, plan churn under the child, broken teacher promises, punitive-feeling safety hold, the cap landing mid-homework on a test eve, restart after a network drop, a voice change on degrade | R7 |

---

### R1. Rebase the substrate on what is actually deployed

**What changed** [repo]:
- `hosting-azure-container-apps` supersedes `deploy-vercel-single-function`; the Vercel project is paused.
- `db-driver-latency-2026-10-02`: Neon moved to `aws-us-east-1` beside eastus2. Over a persistent `pg` Pool
  a query costs 9-12 ms; over the HTTP driver it cost ~230 ms.
- §7.1's justification ("one HTTP round trip from Vercel to Neon in Singapore") and §7.3's "fast lane stays
  in Vercel sin1 next to the DB" are therefore both obsolete.

**What the new host changes, mechanically:**

| concern | Vercel (as designed) | ACA (as deployed) | consequence |
|---|---|---|---|
| post-response work | `waitUntil` promises "have the same timeout as the function itself. If the function times out, the promises will be cancelled" [V Vercel] | no request timeout, but a scale-in sends SIGTERM and SIGKILLs after **30 s** [V ACA] | `taxila-web` scales on HTTP concurrency, so its replicas disappear whenever traffic drops. Background work must not live there beyond a ≤ 10 s post-response step |
| ticker | needs Pro cron or an external host | any always-on process | an in-process loop in a **dedicated `taxila-worker`** app (min 1), leader-elected with `pg_try_advisory_lock` |
| advisory locks, LISTEN/NOTIFY | n/a over HTTP | **not supported through Neon's pooler** (transaction mode: "LISTEN / NOTIFY … Session-level advisory locks" unsupported) [V Neon] | the worker uses the **direct (unpooled)** Neon endpoint; `taxila-web` keeps the pooled one |
| interactive transactions | not on the HTTP driver | yes, on the `pg` Pool | the plpgsql jsonb commit is no longer forced (A17) |
| DBOS / pg-boss | rejected because "serverless" (§7.5) | long-lived Node processes exist now | the rejection's premise is gone; see R6 for whether to adopt |

**Revised lanes (replaces §7.3):**

| lane | host | claimer | max run | jobs |
|---|---|---|---|---|
| `inline` | `taxila-web` request path | none; synchronous in the request | ≤ 10 s, then hand off | ingest + one `step()` attempt; `brief.refresh` for a lesson start |
| `fast` | **`taxila-worker`** (ACA app, min 1, max 2 at v1, direct DB connection) | in-process poll loop, 1 s idle backoff, woken by `NOTIFY job_ready` | 120 s by policy | `conductor.step`, `plan.*`, `forge.spec`, `homework.prepare`, `memory.consolidate`, `notify.send`, ticker |
| `slow` | same `taxila-worker` at v1; split into an ACA *job* only when CPU-heavy work (image post-processing, headless renders) starves the fast loop | worker | 30 min | `forge.image`, `memory.nightly`, `kt.refold`, reports |
| `sandbox` | ACA worker driving ACA Sandboxes / dynamic sessions (M3) | worker | per build | `forge.build` (offline only, R3.1) |

Worker shutdown contract: on SIGTERM, stop claiming, let in-flight jobs heartbeat for ≤ 25 s, then exit. Any
job still running is recovered by lease expiry, and its checkpointed steps (§7.5) skip paid calls on resume.

**Cross-region note.** Users are in India; app, DB and Azure OpenAI are in the US. Ingest → decision adds
one India↔eastus2 RTT (~200-250 ms [U, not yet measured from India]). That is fine for the Conductor. It
matters only for the Director's per-turn route, which `hosting-azure-container-apps` already flags for
measurement. Nothing in the Conductor sits on the voice critical path.

---

### R2. Correctness fixes to the substrate

#### R2.1 Event order must be commit order (A2)

Ordering by a global sequence is unsafe because "sequences are evaluated before the transaction commit", so
a faster transaction can take a higher number and commit first. A reader that advances past it then never
sees the slower one [V event-driven.io]. Per-child volume is tiny (tens of events a day), so serialize
per-child ingest on one row and take the sequence there:

```sql
create table child_seq (child_id uuid primary key references child(id) on delete cascade,
                        last bigint not null default 0,
                        pending_since timestamptz);          -- set on ingest, cleared by commit (R2.4)
alter table student_event alter column seq drop identity;   -- seq is now per child, assigned below

create or replace function ingest_event(p_child uuid, p_id text, p_type text, p_source text, p_idem text,
  p_occurred timestamptz, p_corr text, p_cause text, p_body jsonb) returns bigint language plpgsql as $$
declare s bigint;
begin
  if exists (select 1 from student_event where child_id=p_child and idem_key=p_idem) then return null; end if;
  update child_seq set last=last+1, pending_since=coalesce(pending_since, now())
   where child_id=p_child returning last into s;            -- row lock held to commit → per-child commit order
  insert into student_event (child_id, seq, id, type, source, idem_key, occurred_at, correlation_id, causation_id, body)
  values (p_child, s, p_id, p_type, p_source, p_idem, p_occurred, p_corr, p_cause, p_body)
  on conflict (child_id, idem_key) do nothing;              -- a concurrent duplicate leaves a harmless gap
  return s;
end $$;
```

The row lock on `child_seq` is held until the ingesting transaction commits, so seq N+1 cannot be assigned
before N is committed. Readers may see gaps but never an out-of-order commit. That includes the parent API's
"settings row + event in one transaction" (§6), which simply holds the lock a few ms longer.

#### R2.2 Firing a wakeup is one statement (A3)

```sql
-- ticker (leader only), loop until it returns 0 rows
with d as (select child_id, dedupe, reason from wakeup
            where fired_at is null and due_at <= now()
            order by due_at for update skip locked limit 500),
     f as (update wakeup w set fired_at = now() from d
            where w.child_id = d.child_id and w.dedupe = d.dedupe returning w.child_id, w.dedupe, w.reason)
select f.child_id,
       ingest_event(f.child_id, gen_ulid(), 'clock.wakeup', 'clock', 'wake:'||f.dedupe, now(),
                    'wake:'||f.dedupe, null, jsonb_build_object('reason', f.reason, 'wakeupId', f.dedupe))
  from f;
```

The update and the inserts commit together or not at all. (`gen_ulid()` is a small SQL function or
`pgcrypto`-based; any unique text works because the idem key, not the id, dedupes.) The caller then
enqueues `conductor.step` for the returned child ids. Losing *that* enqueue is harmless, because
`child_seq.pending_since` (R2.4) is swept.

#### R2.3 Finishing a job and telling the Conductor is one transaction (A4)

```sql
create or replace function complete_job(p_job bigint, p_attempt int, p_ok boolean, p_result text,
                                        p_error text, p_final boolean) returns boolean language plpgsql as $$
declare j job%rowtype;
begin
  update job set status = case when p_ok then 'done' when p_final then 'dead' else 'retry' end,
         result_ref = p_result, last_error = p_error, lease_until = null,
         finished_at = case when p_ok or p_final then now() end,
         run_after = case when not p_ok and not p_final
                          then now() + make_interval(secs => least(power(2, attempts), 300) * (0.8 + random()*0.4)) end
   where id = p_job and attempts = p_attempt and status = 'running'
   returning * into j;
  if not found then return false; end if;                    -- fenced: a zombie attempt changes nothing
  if j.child_id is not null and (p_ok or p_final) then
    perform ingest_event(j.child_id, gen_ulid(), case when p_ok then 'job.done' else 'job.failed' end, 'agent',
                         'job:'||j.id||':'||case when p_ok then 'done' else 'failed' end, now(),
                         j.correlation_id, 'job:'||j.id,
                         jsonb_build_object('jobId', j.id::text, 'kind', j.kind, 'resultRef', p_result,
                                            'error', p_error, 'final', p_final));
  end if;
  return true;
end $$;
```

Library-level jobs (no `child_id`, e.g. Forge) fan out to the children that asked by a separate `module.ready`
read model, not by events into every mailbox.

#### R2.4 No lost wake-ups between steps (A5)

Two fixes:
- `conductor_commit` ends with
  `update child_seq set pending_since = case when last > p_cursor then pending_since else null end where child_id = p_child returning (last > p_cursor) as has_more`.
  `step()` loops while `has_more`. The new event is visible because READ COMMITTED reads use a statement
  snapshot, and the competing ingest's own `step()` attempt blocks on the `conductor_state` row lock until
  this commit releases the lease.
- Backstop sweep by the ticker:
  `select child_id from child_seq where pending_since < now() - interval '30 seconds'`
  (partial index `where pending_since is not null`). This is O(dirty children), not O(children).

#### R2.5 A lease belongs to one invocation, not one worker (A5 sibling)

`acquireLease(childId, WORKER_ID, 30)` accepts `lease_owner = $2` as already mine. Two concurrent requests in
one Node process (always the case on ACA, and on Vercel fluid compute) share `WORKER_ID`, so both "hold"
the lease. Use a random token per `step()` call (`lease_owner = randomUUID()`) and drop the
`or lease_owner=$2` clause. The CAS still guarantees correctness, but the lease exists to stop duplicate
model spend, and as written it does not.

#### R2.6 Cancellation (A4 sibling)

- §7.1's cancel matches `idem_key` only. Keys are unique per *kind*, so the cancel must also match `kind`
  and `child_id`: `where child_id=p_child and (kind, idem_key) in (…)`.
- A `running` job cannot be cancelled. Add `cancel_requested boolean` that the commit sets for running
  jobs. Workers check it at every `durableStep` boundary and in `complete_job` before emitting any child-facing
  effect. This matters for consent revocation (§10 row "consent revoked mid-flight"): checking at claim is
  not enough for a 3-minute consolidation.

#### R2.7 Dead keys must be revivable

`on conflict (kind, idem_key) do nothing` means a `dead` or `cancelled` `memory.consolidate:{lessonId}` can
never run again, and the reducer's re-emit silently no-ops. Use:

```sql
on conflict (kind, idem_key) do update set status='queued', attempts=0, run_after=now(), last_error=null
  where job.status in ('dead','cancelled') and excluded.input->>'revive' = 'true'
```

The reducer sets `revive` only on an explicit cause (operator redrive, consent re-granted, a new day for a
plan). Otherwise duplicates stay no-ops.

#### R2.8 Make replay actually replayable (A15)

`decide` is pure only relative to its inputs. Two inputs are not stored: `now` (one per batch) and the brief
read by `lazyBrief` (live KT, which changes as evidence lands). Store both in `decision_log`:
`{ now, briefDigest, briefValue }`. The value can be the ≤ 600-token ChildBrief, or only the fields the fired
rules touched. Replay must feed back the recorded values. Without that, the §11 drift alarm compares
today's KT to last week's decision and fires a P1 on every learning child. Add an invariant: a replay that
reads anything not in `(event, state, recorded now, recorded brief, cfg@reducerVersion)` fails the test.

#### R2.9 Authority events never get quarantined past (A16)

Quarantine is allowed only for events whose types rank below the cost governor in §5.9. If
`safety.*`, `parent.consent_changed`, `parent.pause` or `parent.setting_changed` throws three times:
- a hard-coded **fail-safe handler** runs. It is a separate, minimal function with no dependencies: safety →
  `safety_hold`; consent revoked → cancel jobs of that purpose; pause → `paused`; limit lowered → apply it.
- the child's actor stays in that conservative state until an operator replays. Continuing the day while
  ignoring a revocation is worse than stopping it.

---

### R3. Cost blowups

#### R3.1 The live codegen race cannot deliver; remove it from the live path (A6)

§5.2 sends `module.requested` at every lesson start. Any library miss becomes a `forge.*` job "with that
deadline", and if a `forge.build` finishes in time the device gets `module.ready`. Three binding rules forbid
that last step:
- ARCHITECTURE §1.4: "free-form generated HTML (T3) is offline-only, validated headlessly and human-reviewed".
- §5.3 itself: "human review before library promotion".
- day-cycle N5: "never served to a child the next morning unreviewed".

So on the live path the race only buys a build that no child can see until a human approves it. At launch
the library is empty, so *every* lesson start misses. Codegen with up to 10 fix rounds costs minutes and
dollars per artefact (§5.3, tech-and-market §3), against ≈ $3 of monthly revenue per child.

Corrected live path:

| need during a lesson | allowed live | latency | gate |
|---|---|---|---|
| configure an existing engine (T1) | `forge.spec` on luna | 1-3 s [U] | engine zod schema + param ranges |
| compose a scene from the DSL (T2) | luna, validated by the renderer schema | seconds | renderer schema; no free code |
| illustration | **library or night-prefetched only**; gpt-image-2 took 23 s for one low-quality image [repo measurement] | n/a live | label overlay, classifier |
| new game (T3 codegen) | **never live.** A miss writes `forge_request(objective, engine_gap, demand_count)`; the night/offline Forge builds the most-demanded gaps into the review queue | days | human review → library |

"A game is built while she teaches" becomes true for T1/T2 within a lesson and for T3 across children.
Measure CM4 on that definition, and do not market the stronger claim.

Also, `specHash` must exclude personalisation (names, interest skins), which C8 already says. Add a
validator rule: a `forge.*` input containing any `ChildBrief` field outside the Forge projection
(student-workspace W8) is rejected at enqueue. Otherwise the cache key cardinality explodes and the hit rate
goes to zero.

#### R3.2 The night is a thundering herd (A10)

- **Jitter.** `day_start`, `night`, `weekly_report` and night planning get a per-child offset
  `hash(childId) mod window` (e.g. night planning spread over 22:30-04:30, reports over the parent's chosen
  hour). Wakeup dedupe keys stay semantic, and only `due_at` moves.
- **Drain until empty.** The ticker loops the R2.2 statement while it returns 500 rows. It does not wait a
  minute per 500.
- **Plan only the living.** `plan.day` at night runs only for children active in the last 7 days. Everyone
  else gets the code planner synchronously at `app.opened`. That cuts LLM plans and Forge prefetch for the
  long tail of dormant accounts, which in consumer edtech is most accounts [U].
- **Global Forge budget.** Prefetch (day-cycle N3: ≤ 2 topics/child/night) must resolve to *library keys*
  first and be deduped across children before any spend: `select key, count(*) from tomorrow_needs group by key
  order by count desc`, then build down the list until `budget(scope='global', scope_id='forge', period='day:…')`
  is exhausted. Per-child prefetch of images at medium quality (≈ $0.053 each [S]) is 2 × 30 × $0.053 ≈
  **$3.2/child-month**, which exceeds the revenue line on its own. Library-first is the only version that fits.
- **TPM.** Night planning for 100k children at ~7k tokens each is ~700M tokens. Spread over 6 h that is
  ~2M tokens/min on `taxila-fast`. Check the deployment's TPM before M2; the Batch alternative is not
  available for gpt-5.6 (R3.4).

#### R3.3 Live voice: where the real money leaks (A11, A12)

| leak | mechanism | fix |
|---|---|---|
| noise-driven turns | server VAD fires on TV, siblings or a pressure cooker, and the teacher answers the room. Each response bills audio-out, the dominant cost line (§9.1 floor $1.38/45 min is audio-out alone) | Director idle rule: after 2 consecutive turns with no kit-relevant child utterance, or 90 s with no child speech, the teacher wraps ("main yahin hoon, jab ready ho tap karna"), and the client closes the WebRTC session. Reopening is one tap and goes through admission. Counts toward CM6 |
| session cap | "Realtime sessions have a maximum duration of 60 minutes" and a 32k input-token context [V Azure] | lessons are ≤ 45 min (day-cycle B4), so renewal is needed only for overruns, but the Director must own a `session.renew` move at a natural stop, carrying the brief + lesson summary (already the pruning design) |
| reconnect storms | every reconnect after a network drop is a new session start against the 10 RPM cap. At 19:00-21:00 on patchy mobile data, reconnects can eat the admission budget meant for new lessons | admission priority: `reconnect of an in-progress lesson` (0) > `lesson start` (1) > everything else. A reconnect keeps the lesson's reservation and does not reserve again |
| per-turn reservations | §9.2 reserves before *every* model call. The Director's per-turn classifier call then does reserve + settle round trips and updates `global`/`deployment` budget rows that every concurrent lesson shares (single-row lock) | reserve per **5-minute lesson block covering voice and all Director text calls**. Settle per block from realtime `usage` + the Director's call ledger. Global/deployment ceilings are enforced from per-replica in-memory counters synced every 10 s (bounded overshoot = replicas × 10 s of spend). The exact Postgres token bucket is kept only for realtime session starts (≤ 10/min, no contention) |
| fail-closed mid-lesson | if the governor's DB call errors, "fails closed" ends the lesson | in-flight lessons fail **open for at most one extra block**, logged. New lessons and background jobs fail closed. A child is never cut off by an infrastructure error |

#### R3.4 Reports: one job per week, and no Batch in v1 (A8, A9)

- **Key without the ledger hash.** `report.weekly:{child}:{isoWeek}`, with a **data cutoff** fixed at enqueue
  (`cutoffAt = send − 30 h`, stated in the letter: "is hafte ka hisaab shanivaar dopahar tak"). Evidence after
  the cutoff goes into next week's letter. As written, every lesson in the 30-hour window mints a new
  report job and pays again.
- **Batch is not available as assumed.** It needs a `GlobalBatch` or `DataZoneBatch` deployment of the model,
  and the supported-model table on the current page lists gpt-5.4/5.5-family and older, not gpt-5.6 [V Azure
  Batch]. "It doesn't expire jobs that take longer", so a T-2 h standard re-run must also **cancel** the batch
  job or both are billed [V]. The saving is 50% of ≈ $0.08/child-month ≈ $0.04. That does not pay for a
  second lane, a second deployment and a collect poller. **Drop Batch from M1**; run reports on `taxila-fast`
  standard, spread by jitter. Revisit when there are > 50k children and gpt-5.6 appears in the Batch table.
- parent-loop's `weekly_letter` (`unique(child_id, iso_week)`, `ledger_hash` column) is the report store. The
  job writes it, and the hash is kept for audit, not for idempotency.

#### R3.5 Retries multiply worst-case reservations

`maxAttempts: 5` × "reserve the worst case of the call" means a flapping job can hold 5× its budget
reservation over time, and spend up to 5× on partial outputs. Make `budget.maxMicroUsd` a **per-job total
across attempts**, tracked in `agent_run.spent_micro_usd`. The claimer refuses an attempt whose remaining job
budget is below the next call's worst case and takes the fallback.

#### R3.6 Only allowed models (A7)

| where | as written | replace with |
|---|---|---|
| §4.5 weekly review | terra (Batch) → luna → template | `taxila-brain` (sol) standard → `taxila-fast` → template |
| §5.3 `forge.spec` | luna → terra → kit defaults | `taxila-fast` → kit defaults |
| §5.3 `forge.build` | gpt-5.3-codex or Sonnet 5.5 | `taxila-codex` only (decision `forge-models`) |
| §9.1 price lines | Sonnet/Opus 5.5 rows | remove (not buildable: `claude-on-foundry-credits`) |
| §9.4 report rung 0 | terra Batch | `taxila-fast` standard |
| §16 q5 | codex vs Sonnet bake-off | remove; reopen only on the `forge-models` reversal condition |

#### R3.7 The Notifier's channel is a vendor decision

WhatsApp and push are not AI/compute, but the Azure-only directive says to prefer Azure-native options.
Azure Communication Services Advanced Messaging sends WhatsApp template messages with delivery reports
through Event Grid [V ACS]. Meta's per-message fees still apply [U: current India utility-template rate].
day-cycle's `daily_note` (DC9), sent every day, is ~30 messages/child-month versus ~9 under the
2-per-week cap. Price both before choosing the default. Also note the ACS breaking change: `from`/`to` may be
empty for users with WhatsApp usernames, so key recipients by BSUID [V ACS].

---

### R4. Single points of failure

| SPOF | blast radius | v1 mitigation | later |
|---|---|---|---|
| **one Neon compute** (ingest, Director turn route, Conductor, queue, governor, rate bucket) | every lesson | the device keeps the last brief and an event outbox (§10 already). The Director's per-turn route must degrade to "no evidence this turn" rather than failing the turn. Neon read replica for the parent dashboard and ops timeline so analytics never load the writer | cells (student-workspace W9) give blast-radius isolation |
| **one realtime deployment, one region, 10 RPM** | all live voice | lite-mode rung and tap practice (§9.4). Request quota (§16 q4) | a second `taxila-realtime` deployment in another region behind the admission bucket, with region chosen per session |
| **one human clears `safety_hold`** (§5.8: "never a timer") | a child is locked out indefinitely when the owner is asleep or away | protocol SLA: page on entry; if not acknowledged in 2 h, escalate to a second named adult; the hold *state* is never auto-cleared, but the child-facing screen is designed (R7.3). Only `critical` holds lock the app; `high` continues with monitoring | a staffed rota |
| **one human reviews Forge output** | the T3 library grows only as fast as the owner reviews | T1/T2 carry v1 (R3.1); the review queue is ordered by `demand_count` | reviewer rota; auto-promotion only for engine-param artefacts |
| `taxila-worker` single replica | ticker, jobs | min 1 + leader election lets a second replica take over in seconds; piggyback drains on device requests keep active children moving (§10) | max 2-3 |
| Key Vault on the read path (student-workspace W4 DEK unwrap) | transcripts, memory text unreadable → brief builder fails | cache unwrapped DEKs in-process for the session, TTL ≤ 15 min; brief builder degrades to KT-only fields | — |

---

### R5. One writer per fact, applied to the specs themselves (A14)

The sibling docs each define the same nouns. If they ship as written, there will be two writers for the plan,
two event logs and two notification logs. That is exactly the drift §6 forbids. Resolution:

| noun | defined in | resolution (single owner) |
|---|---|---|
| day phase | here §4.2 (`night/planned/active/in_lesson/idle/wound_down/paused/safety_hold`) and day-cycle §3.1 (`morning/at_school/recovery/learning_window/wind_down/closing/night`) | they are **two orthogonal fields**. `clockPhase` is day-cycle's enum, computed from `child_routine` + calendar by the Scheduler. `mode` is `free/in_lesson/paused/safety_hold`. The §4.2 allowed-actions table is re-keyed on (clockPhase, mode). `planned/active/idle` collapse into `clockPhase=learning_window, mode=free` |
| `DayPlan` | here §4.5 and `day-cycle.contracts.ts` | one type in `shared/conductor/plan.ts`: day-cycle's fields (`mode`, `band`, `phases`, `capMin`, `plannedMin`, `splitLevelVsSchool`, `builtBy`, `version`) + this doc's `slots[].why[]` and `prefetch[]` + `budgetMicroUsd` |
| plan storage | `conductor_state.plan` vs `day_plan(child_id, day, version)` | `day_plan` is the versioned store (the parent must be able to see the morning version, day-cycle §11). `conductor_state` holds `{planDay, planVersion}` only. The Conductor is its only writer |
| event log | `student_event` vs `day_event` | `student_event` only. day-cycle's `DayEvent` members become `StudentEvent` types (`slot.offered/started/completed/skipped`, `phase.entered`, …). Drop `day_event` |
| notification log | `notification` vs `notification_log` (records blocked decisions too) vs parent-loop `parent_alert` | `notification` is the outbox. Blocked decisions go to `decision_log` (they are decisions). `parent_alert` is the parent-loop's candidate table and points at `notification.id` (it already has the column) |
| notify intents | here `weekly_report/milestone/safety/account/payment/ptm_summary`; day-cycle adds `anchor_reminder/daily_note/test_window`; parent-loop adds `wellbeing_note/struggle/commitment_result` | one union in `shared/conductor/notify.ts`; `mayNotify()` (day-cycle) is the Notifier's gate; `notAfter` expiry (day-cycle) is adopted |
| lesson brief | here `wrapAt`, `holdNewTopics`; day-cycle `hardStopAt`, `segments`, `reviewItemIds` | one `LessonBrief` in `shared/contracts.ts`. `wrapAt` (governor/limits) and `hardStopAt` (bedtime − 60) both exist, and the Director wraps at the earlier one |
| the daily cap | here `usage.lessonMinToday ≥ dailyMin` → `wound_down`; day-cycle: "all slots summed" | day-cycle wins: `usage.minutesToday` counts every slot kind. Homework help has its own sub-cap (day-cycle §3.2) |

Add one schema test to the W2 workspace-map test: no two migrations create tables whose names match
`*_event`, `*_plan` or `notification*` without an entry in `WORKSPACE_MAP` naming the owner.

---

### R6. What v1 does not need (A17, A18)

The first cohort is tens to hundreds of children on one Neon compute and one worker. Rule used below: keep
anything that is hard to retrofit (data shapes, idempotency, atomicity, the invariants). Defer anything that
only pays at scale or only adds observability you can get from SQL.

| item | v1 (M0-M1) | why |
|---|---|---|
| pure reducer, `conductor_state`, `student_event`, outbox, fact-derived idem keys, invariants, simulator | **keep** | these are the retrofit-proof core |
| `conductor_commit` as plpgsql parsing jsonb commands | **replace** with a JS interactive transaction over the `pg` Pool: `BEGIN; CAS update; insert jobs (multi-row VALUES); insert wakeups; insert notifications; insert decision_log; COMMIT`. ≈ 6 queries × 10 ms [repo measurement] | testable in the simulator without a database function, and a new `Command` kind is a code change, not a migration |
| hand-written queue (§7.2 claim, retry, dead letter, singleton, cron) | **consider pg-boss** (open-source, runs on our ACA compute, so allowed): SKIP LOCKED, "automatic retries with exponential backoff", "dead letter queues with redrive", "Cron and RRULE scheduling", singleton/throttle/debounce policies, and "send or complete jobs inside your existing transaction" [V pg-boss]. Measure claim latency and Neon compute-hours against the home-grown version in staging before choosing (new CM9). Either way the job contract in §5.1 stays | the claim/retry/heartbeat code is the part most likely to have the bugs R2 found |
| rainbow `reducer_version` held until `night` | **drop.** Use `upgradeState(state, fromVersion)` migrations and a deploy freeze 18:30-21:30 IST | a child in `paused`/`safety_hold` never reaches `night`, so two reducers live forever; and the deploy script would have to ship both |
| Batch lane | **drop** (R3.4) | ≈ $0.04/child-month |
| KEDA Postgres scaler, ACA jobs per slow job | **defer**; the worker's poll loop is enough until CPU contention | one less moving part |
| generic `concurrencyKey/limit` per job | **two hard-coded limits**: per-child singleton for `conductor.step`, and `azure:image ≤ 3` | the generic subquery over-admits anyway (§7.2 caveat) |
| OTel GenAI spans | **defer**; correlation id columns on every row + the L1 timeline SQL | the conventions are experimental [S]; the rows already join |
| nightly 1% replay drift alarm | **defer to M2**, after R2.8 makes replay meaningful | it would only produce false P1s today |
| 400-day fold-and-delete retention | **defer**; volume is KB per child | no data to fold yet |
| LLM planner | already deferred to M2 (shadow) | — |
| `agent_run` checkpoints | **Forge and report only** | other jobs are single model calls; idempotent re-run is cheaper than checkpoint code |

---

### R7. Missing child-experience considerations (A19)

The product is whether the teacher feels like a real person and the day feels kind. The design specifies
what the *system* does in these moments, but not what the *child* sees.

1. **Admission waits become the warm-up, not a spinner.** At 10 RPM, peak lesson starts queue (§9.3, CM5).
   For a 6-8 year old, a wait of more than a few seconds on a "getting ready" screen is a drop-off point. The
   plan's first slot is already `retrieval_warmup` (rule 18, ≥ 2 items). Run it **off-voice** (tap items
   from the kit with cached narration) while admission resolves, then the teacher joins and picks up from
   the warm-up results ("tumne 3 mein se 2 sahi kiye, chalo teesra saath mein dekhte hain"). The wait turns
   into pedagogy, and the realtime minutes saved are real. Never show a queue position to the child; the
   parent sees "busy hour" honestly in the dashboard.
2. **Plan stability under the child.** A debounced re-plan after `lesson.ended` can reorder the home screen
   while the child is looking at it. Rule: a re-plan may change only slots **not yet shown**. Anything shown on
   screen, or said aloud, is frozen for the day. Add `slot.shown` to the event log and a validator rule
   ("rewrites a shown slot").
3. **The teacher's promises are commitments.** A real teacher who says "kal hum volcano wala game khelenge"
   and then doesn't is the fastest way to stop feeling real. The Director's close step emits
   `teacher.promise{what, by, ref}` (shapes, never quoted lines). The planner validator rejects a plan that
   lets an unexpired promise lapse without a slot, unless a higher authority (§5.9) blocks it, and then the
   teacher acknowledges it next time. This mirrors parent-loop's `parent_commitment` for parents.
4. **Safety hold must not feel like punishment.** A child who has just disclosed something serious and then
   finds the app locked learns that telling gets you shut out. The hold screen is designed with the
   safeguarding protocol, not by the Conductor. It is warm and calm, carries Childline 1098 and
   Tele-MANAS 14416, has no "account suspended" language, and on a shared phone it reveals nothing to whoever
   is holding it. Only `critical` incidents lock the app. `high` keeps lessons running with the protocol
   monitoring. Add an SLA (R4).
5. **The cap landing at the wrong moment.** On a test eve, mid-homework, `minutesToday ≥ cap` must not cut the
   child off mid-problem. The Director wraps at the next natural stop (this doc's rule), the teacher closes
   the current item with the child, and a parent-gated "+10 min" (day-cycle §3.2) is offered *to the parent*,
   never to the child as a bargaining chip. Invariant: no wrap mid-item; at most one wrap per item.
6. **A dropped connection resumes the same lesson.** `lesson.ended{reason:'network'}` followed by
   `app.opened` within 15 min must **resume** (same lessonId, same brief, teacher acknowledges the break). It
   must not start a new lesson that repeats the opening and counts the warm-up minutes twice. The reducer
   holds a `resumable` window, and the Director's opening move for a resume is a shape, not a fresh greeting.
7. **A voice change on degrade is a different person.** Dropping from gpt-realtime-2.1 to cascaded lite mode
   (§9.4) swaps the voice pipeline. If the TTS voice differs from the realtime voice, the child hears a new
   teacher. Rule: a lesson never changes rung mid-lesson except for an outage. Rungs are chosen at lesson
   start for the whole lesson. Lite mode must use the closest voice by blind ear test (inherited law:
   "voice chosen by blind ear, not metrics") [U: whether gpt-4o-mini-tts offers the same named voice].
8. **Shared phones.** `app.opened` before a profile is picked is a *device/guardian* event. It must not go into any
   child's log (inherited law: identity is an authenticated child id, never a device). A sibling switch
   mid-day writes `app.closed` for one actor and `app.opened` for the other. The admission queue is per
   device, so siblings do not double-book the 10 RPM bucket by tapping twice.
9. **First open must be instant.** "If no adopted plan: adopt the code plan now" is right. Make it a budget:
   the home screen renders from the device's cached plan in < 300 ms, and the server's code plan replaces
   it only if it differs on unshown slots (point 2). Do not block the first paint on a server round trip
   from India to eastus2.
10. **Late or out-of-window opens.** A child opening at 21:30 on a holiday, or in `night`, sees a calm
    "rest" screen with one tap-only "tiny day" burst if the parent's allowed hours permit it (day-cycle
    DC3). It should never feel like being turned away.

---

### R8. Amendments to §12 (invariants) and §15 (measurements)

**New invariants** (added to the gate, each with a negative control):
- I-R1: for every child, the set of folded events equals the set of committed events (simulator injects
  concurrent ingests with randomized commit delays; with the identity-seq version this fails, as R2.1 predicts).
- I-R2: no `wakeup` row has `fired_at` set without a matching `clock.wakeup` event; no `job` is `done`/`dead`
  with a `child_id` and no matching `job.*` event.
- I-R3: a replay reads only recorded inputs (R2.8).
- I-R4: no authority-class event (§5.9 above the governor) is ever quarantined past.
- I-R5: no `forge.build` result is delivered to a device without `forge_artifact.reviewed_by`.
- I-R6: no re-plan changes a slot with a `slot.shown` event; no unexpired `teacher.promise` lapses silently.
- I-R7: no lesson changes degrade rung mid-lesson except with `reason='outage'`.
- I-R8: no job input or model call references a model outside the `azure-only-compute` allowed list
  (static check over the model registry).

**New measurements** (log with n, method, date):

| id | measure | why | method |
|---|---|---|---|
| CM9 | claim latency p95 and Neon compute-hours/day: home-grown queue vs pg-boss, same workload | R6 choice | staging, simulator load at 1k and 10k children |
| CM10 | share of realtime audio-out tokens in turns with no kit-relevant child utterance | R3.3 noise leak | `turn_trace` + `model_call`, first 50 real households |
| CM11 | admission wait p95 at 19:00-21:00 and drop-off rate during the off-voice warm-up vs a spinner | R7.1 | micro-RCT, pre-registered (rule 37) |
| CM12 | resume rate after `network` endings, and duplicate warm-up minutes | R7.6 | event log |
| CM13 | India → eastus2 ingest → decision p95 | R1 cross-region | real devices, 3 cities |

---

### R9. Revised M0 (replaces §14 item 1)

M0 ships with the first live lessons:
- `child_seq` + `ingest_event` (R2.1)
- `conductor_state` + pure reducer + JS-transaction commit with `has_more` (R2.4, R6)
- the unified `DayPlan`/`day_plan` store and `clockPhase × mode` (R5)
- the code planner
- `lesson.ended → memory.consolidate` via `complete_job` (R2.3)
- wakeups with the one-statement fire and per-child jitter (R2.2, R3.2)
- `taxila-worker` on ACA with leader-elected ticker and a direct DB connection (R1)
- per-child daily cap + realtime session admission bucket with reconnect priority (R3.3)
- the off-voice warm-up during admission (R7.1)
- the idle hang-up (R3.3)
- the simulator with I-R1…I-R8

Not in M0: Batch, KEDA, Forge lanes, LLM planner, drift alarm, OTel, rainbow versions.

### Sources for this review

- Oskar Dudycz, *How Postgres sequences issues can impact your messaging guarantees* — https://event-driven.io/en/ordering_in_postgres_outbox/ [V]
- Vercel `@vercel/functions` reference (`waitUntil` shares the function timeout; `getDeadline`) — https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package [V]
- Azure Container Apps application lifecycle (SIGTERM, 30 s to SIGKILL on scale-in) — https://learn.microsoft.com/en-us/azure/container-apps/application-lifecycle-management [V]
- Neon connection pooling (transaction mode: no LISTEN/NOTIFY, no session-level advisory locks) — https://neon.com/docs/connect/connection-pooling [V]
- Azure OpenAI global batch (GlobalBatch/DataZoneBatch deployment types, supported models, jobs not expired after 24 h, 50% off) — https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/batch [V]
- Azure OpenAI Realtime audio (60-minute session cap, 32k input tokens, rate limits on concurrent sessions) — https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio [V]
- Azure Communication Services Advanced Messaging for WhatsApp (templates, delivery reports, BSUID breaking change) — https://learn.microsoft.com/en-us/azure/communication-services/concepts/advanced-messaging/whatsapp/whatsapp-overview [V]
- pg-boss feature list — https://pgboss.io/ [V]
- Internal [repo]: `context/decisions.md` (`azure-only-compute`, `hosting-azure-container-apps`, `forge-models`, `infra-segment`), `context/measurements.md` (`db-driver-latency-2026-10-02`, `infra-smoke-2026-10-02`), `context/rejected.md` (`claude-on-foundry-credits`), `docs/ARCHITECTURE.md` §1.4, `docs/research/conductor/day-cycle.md` §3, §9, §11 and `day-cycle.contracts.ts`, `student-workspace.md` W2/W4/W8/W9, `parent-loop.sql`.

---

### R10. Second pass (resumed session, 2026-10-02): what R1-R9 and the `CONDUCTOR.md` synthesis still get wrong

The first pass above was carried into `CONDUCTOR.md` (§3.3-§3.11, X1-X16) and its inbox entries. This pass
re-read both against each other and probed the lock order on a scratch Postgres 16.14. Severity as in R0.

| id | sev | finding | fix |
|---|---|---|---|
| B1 | **P0** | **Lock-order deadlock, measured.** `CONDUCTOR.md` §3.4 moved `child_seq` to the *first* statement of the Conductor commit ("Lock order everywhere: child_seq BEFORE conductor_state"). But `complete_job` locks the `job` row and *then* `child_seq` (through `ingest_event`), and `fire_wakeups` locks `wakeup` rows and *then* `child_seq`. The commit takes `child_seq` → `job` (cancel / `cancel_requested` / revive) → `wakeup` (upsert). Those are two lock cycles | One global rule: **`child_seq` is always the last row a multi-table writer locks**, which is this doc's R2.4 order. Commit = `conductor_state` → `job` → `wakeup`/`notification`/`day_plan` → `child_seq` (computes `has_more`) → lease decision. `complete_job` and `fire_wakeups` already comply. Also treat SQLSTATE `40P01` like `40001` (retry from a fresh snapshot) everywhere, as a backstop |
| B2 | P1 | R2.4's rationale sentence is wrong: "the competing ingest's own `step()` attempt blocks on the `conductor_state` row lock". The lease is taken by an autocommit `UPDATE` *before* the step, so a competing `step()` finds the lease held and returns `skipped`. That is the lost-wake-up hole. What actually serialises the two is the **`child_seq` row lock**: an in-flight ingest makes the commit's `child_seq` update wait and then re-read `last` | Reword R2.4: correctness rests on the `child_seq` lock plus `has_more`, not on `conductor_state` locking. Measured below |
| B3 | P1 | R2.1's `ingest_event` updates `child_seq` without creating it. For a child with no row, `s` is NULL and the insert violates `seq NOT NULL` | Already fixed in `CONDUCTOR.md` §3.3 (`insert into child_seq … on conflict do nothing` first). Superseded here; the synthesis is canonical |
| B4 | P1 | **`conductor.step` as a queued job is the wrong primitive.** This doc never gives it a key. `CONDUCTOR.md` §8.2 keys it `step:{child}:{toSeq}`, so a 45-minute lesson that emits about 20 boundary events mints about 20 jobs. Each one is claimed and most return `skipped` on the lease. With `unique(kind, idem_key)`, a constant key would run once ever (R2.7 revives only `dead`/`cancelled`) | Drop `conductor.step` from `JobKind`. **`child_seq.pending_since` is already the dirty set**: the worker loop runs `select child_id from child_seq where pending_since is not null order by pending_since limit 50` (a plain read with no `FOR UPDATE`, so B1's order is kept) and calls `step()`, where the lease is the mutex. The inline attempt on `taxila-web` stays. One mechanism instead of a job kind plus a sweep |
| B5 | P1 | **Replay can re-enqueue work.** §4.6 says a full replay from seq 0 serves "tests, audits or a reducer upgrade". Idempotency keys make that safe only while the original `job`/`wakeup`/`notification` rows exist. Once retention prunes them, a replay that reaches `commit` re-runs consolidations and re-sends letters | Replay never commits. Type it: `replay(childId, fromSeq)` gets a reader with **no** `commit`/`tx` handle and returns `(state, commands[])` for comparison only. New invariant **I-R9**: replay mode performs zero writes (the simulator asserts a write-counting DB shim at 0). A reducer upgrade uses `upgradeState` (X16), never replay-and-commit |
| B6 | P1 | **R3.3's idle hang-up hurts the child.** "2 consecutive turns with no kit-relevant child utterance" (carried into `CONDUCTOR.md` §4.6, idle row) hangs up on a child who is chatting off-topic ("mera kutta aaj…") or thinking aloud. Those are the rapport moments the product rests on, and a 6-8 year old does them all the time. Off-topic is not noise | The hang-up triggers only on audio that is **not the child**: VAD commits with an empty or low-confidence transcript, or no child speech for 90 s after the teacher handed over the turn. Real off-topic child speech gets the Director's redirect move (a shape), never a hang-up. The hang-up happens only at a natural stop, after one "main yahin hoon" shape. Split CM10 into `non_child_audio_turns` and `child_off_topic_turns`. Only the first is a cost leak |
| B7 | P1 | **R4 and R7.4 rewrite the safeguarding floor from inside an orchestration review.** "Only `critical` holds lock the app; `high` keeps lessons running" (carried into `CONDUCTOR.md` §8.5, safety_hold row) changes what happens after a disclosure. §5.8 says the Conductor never decides safety, and the repo's binding constraints put the safeguarding hand-off in the product floor | Restate it as a **question to the safeguarding protocol owner**, not a rule. Until the owner decides and logs it, every incident → `safety_hold` (the conservative default). R7.4's screen requirements stand either way: warm, 1098 + 14416, no "suspended" language, nothing revealed on a shared phone. The severity split is a proposal tagged [U] |
| B8 | P2 | **`decision_log.brief_value` grows without bound.** R2.8 stores the brief (or the fields read) on every decision. At about 15 commits per child-day and about 1 KB each [U], that is ≈ 15 KB/child-day: ≈ 1.5 GB/day and ≈ 550 GB/year at 100k children [U]. The brief changes only when KT or memory changes, so most rows repeat the previous value | Content-address it: `brief_snapshot(digest text primary key, value jsonb, created_at)`, `insert … on conflict do nothing`. `decision_log` keeps the `brief_digest` only. Retention follows the replay window (90 d at v1 [U]) |
| B9 | P2 | **The NOTIFY wake-up is a hint, not a path.** R1's `fast` lane is "woken by `NOTIFY job_ready`". Neon lists "LISTEN / NOTIFY" as unsupported on pooled connections [V Neon pooling], and `taxila-web` uses the pooled endpoint. Separately, a 1 s poll keeps the Neon compute awake 24/7: it scales to zero only after 5 minutes of inactivity [V Neon] | Correctness never depends on NOTIFY. Send `pg_notify` only from a direct connection inside the committing transaction (PG delivers it at commit [V PG docs]), or drop it and poll at 1 s when busy, backing off to 5 s when idle. Price the always-on compute in CM2. It is probably small next to voice [U], but it is a line item |
| B10 | P2 | **Dormant children still tick.** Every child gets `day_start` and night wakeups daily. At 100k accounts, with most of them dormant [U], that is ≥ 200k `clock.wakeup` events, steps and commits a day (≈ 73M log rows/year) with no child on the other end | After 14 days with no `app.opened`, the reducer stops re-arming recurring wakeups and keeps only parent-chosen ones (weekly letter). The next `app.opened` re-arms them. Same idea as R3.2 "plan only the living", applied to the clock |
| B11 | P2 | R7.1's off-voice warm-up for 6-8 year olds who cannot read needs **narration audio per kit item** before M0. That is a content-pipeline dependency (TTS on Azure AI Speech or the realtime voice, pre-rendered and cached), not a Conductor detail | Add "narration cached for every warm-up-eligible kit item" to the M0 checklist (R9), with the voice matched to the teacher by blind ear. Otherwise the warm-up is a voice change (R7.7) |

#### R10.1 Measurement: lock order (scratch Postgres 16.14, 2026-10-02, n = 5 per cell)

Method: `docs/research/conductor/orchestration-lock-order-probe.sh` (with `.schema.sql` and `.reset.sql`). It runs
the minimal substrate (`child_seq`, `student_event`, `job`, `wakeup`, `conductor_state`, `ingest_event`,
`complete_job`, `fire_wakeups`) in the shapes of `CONDUCTOR.md` §3.3/§3.8/§3.9. A commit and one other writer race
on one child. `pg_sleep` widens the window so each cell is deterministic. In production the same cycle needs a
narrower coincidence, and PG aborts one side after `deadlock_timeout` (1 s default). For `fire_wakeups`, that
rolls back the whole batch of up to 500 wakeups.

| commit order | vs `complete_job` (job → child_seq) | vs `fire_wakeups` (wakeup → child_seq) | vs `complete_job` taking child_seq first |
|---|---|---|---|
| `child_seq` first (`CONDUCTOR.md` §3.4) | **5/5 deadlock** | **5/5 deadlock** | 0/5 |
| `child_seq` last (orch R2.4) | 0/5 | 0/5 | 0/5 |

Plus one correctness check of the `child_seq`-last order (n = 1): an ingest in flight during the commit
(ingest holds `child_seq` for 0.6 s; the commit's `child_seq` update starts at 0.2 s) made the commit wait and
return `has_more = true`, with `last = 6` and `pending_since` still set. So moving `child_seq` last keeps the
no-lost-wake-up property and removes both cycles. Not covered: a multi-child ticker batch racing several
commits at once, and the parent API (`parent_setting` → `child_seq`) under load. The B1 rule predicts no cycle
for either, but neither was run.

#### R10.2 Corrections to the text above

- R2.4: replace "the competing ingest's own `step()` attempt blocks on the `conductor_state` row lock until this
  commit releases the lease" with "an in-flight ingest holds the `child_seq` row lock, so the commit's
  `child_seq` update waits for it and re-reads `last`; an ingest that starts later waits for this commit, then
  finds the lease released". Add: `child_seq` must be the last row the commit locks (B1).
- R3.3, idle row: replace "2 consecutive turns with no kit-relevant child utterance" with the non-child-audio
  trigger in B6.
- R4, safety row, and R7.4: "Only `critical` incidents lock the app" becomes a [U] proposal to the
  safeguarding owner (B7). Default: every incident → `safety_hold`.
- R6, `generic concurrencyKey` row: the per-child singleton is the lease over the `pending_since` dirty set
  (B4), not a `conductor.step` job.
- R8: add I-R9 (replay performs zero writes) and I-R10 (no SQLSTATE `40P01` across 8 seeds of the simulator's
  concurrent-ingest + completion + ticker persona, with the substrate shim enforcing the B1 order).
- R9 (M0): add the cached warm-up narration (B11) and the dormant-clock rule (B10). Remove "`conductor.step`
  jobs" wherever it appears (B4).

#### Sources for R10

- Neon connection pooling ("LISTEN / NOTIFY", "Session-level advisory locks" not supported in transaction mode) — https://neon.com/docs/connect/connection-pooling [V]
- Neon scale to zero (suspends after 5 minutes of inactivity) — https://neon.com/docs/introduction/scale-to-zero [V]
- PostgreSQL `NOTIFY` (delivered only at commit; `pg_notify`) — https://www.postgresql.org/docs/current/sql-notify.html [V]
- Internal [repo]: `docs/research/conductor/CONDUCTOR.md` §3.3, §3.4, §3.8, §3.9, §3.11, §4.6 (idle row), §8.2 (`step:{child}:{toSeq}`), §8.5 (safety_hold row); probe `docs/research/conductor/orchestration-lock-order-probe.{sh,schema.sql,reset.sql}`.
