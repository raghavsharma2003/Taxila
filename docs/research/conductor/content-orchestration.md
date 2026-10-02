# Content orchestration: how the Conductor asks Forge for content, and how what Forge builds reaches a lesson

**Date:** 2026-10-02 · **Status:** build spec (gap-fill **G2-content-orchestration-media**). This is the rationale doc
that `content-orchestration.sql` names; it replaces the missing G1 doc. **Precedence:** `CONDUCTOR.md` §0.2 rulings
X49-X58 adopt this file (revision 4); `context/decisions.md` overrides both. **Scope:** the `forge.demand` horizons; the waiter
fan-out; how a ready module reaches `LessonBrief.preparedModules` and a live lesson; the review queue; and the three
media gaps the product brief demands and CONDUCTOR did not cover: **songs**, **video after sora-2**, and **lesson
images**.

**Read first (not repeated):** `CONDUCTOR.md` §1-§4, §8-§9 (the substrate, X29 lock order, jobs, governor);
`factory/multimodal-orchestration.md` (MO, with its principal review R1-R14); `factory/video-animation-gen.md` (VAG,
with review R0-R8); `content/animation-video.md` (AV); `content/songs-rhymes-audio.md` (SR);
`content/genui-reliability.md` (GR); `factory/asset-pipeline.md` (AP); `learning-science.md` §6 (LS rule 24).

**Artefacts in this folder (all re-runnable):**

| file | what it is | result |
|---|---|---|
| `content-orchestration.sql` | the migration (revised by this gap-fill) | — |
| `content-orchestration-pg16-probe.py` → `content-orchestration-pg16-probe-2026-10-02.txt` | functional checks F1-F21 + race cells D1-D4 on a scratch PG 16.14 (§4.4) | **30/30 as expected**; found 4 defects in revision G1 |
| `content-orchestration.g1-frozen.sql` | revision G1, frozen, used only as the probe's lock-order controls | not a migration |
| `image-prefetch-sim.py` → `image-prefetch-sim-2026-10-02.txt` | CM4-img under three prefetch rankings × nightly quota (§9) | calendar-only caps at **86%**; demand ranking **99%** at 300 images/night |
| `media-recitation-lint.mjs` → `media-recitation-lint-2026-10-02.txt` | the L1-L5 song/chant recitation-safety lint with golden cases (§8.4) | **11/11**; the first L4 version missed a recited lane (fixed) |

**Tags:** **[V]** checked at the primary source today (URL in Sources) · **[M]** measured here (n, method) ·
**[Me]** measured by a sibling doc · **[sim]** simulator output on [U] inputs · **[S]** secondary · **[U]** unmeasured
design default · **[I]** inference.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| CO1 | **Four horizons, two of them child-attributed.** `in_lesson` and `next_lesson` carry a child and create a `forge_waiter`; `two_weeks` and `term` are aggregate demand with **no child and no waiter**, even when the Conductor emits them | A waiter exists to tell one child "your thing is ready". Two-week and term demand is cohort-level (X10). G1 let a child-carrying `two_weeks` demand reach the waiter insert, whose horizon check then aborted the whole Conductor commit [M F7/F7c] | A product need for per-child notification of a term artefact (none known) |
| CO2 | **The live 3 s path is not a Forge request.** T1 params and T2a template fills in a lesson are the Director's own `generate_now` (ARCHITECTURE §1.2 step 4), charged to `child_content`. Forge learns of them afterwards through `forge.demand{in_lesson, promote}` and publishes a re-validated copy to the library | Routing a 3 s budget through ingest → `step()` → commit → job → publish → poll adds a Conductor step (CM1 p95 bar is 2 s) to a 1.9-3.4 s model call [Me GR]. The rule "a Forge result reaches the Director only through the read model" is kept, because a live fill is not a Forge result | Measured ingest → `module_ready` visible p95 ≤ 400 ms on `taxila-web` (then the live path could go through Forge) |
| CO3 | **Mid-lesson delivery is the Director's turn-boundary read of `module_ready`, never a mid-lesson `brief.refresh`.** `brief.refresh` assembles `preparedModules` at lesson start and on resume only | One publish fans out to many children. A `brief.refresh` per child per publish is a Conductor step per child: the thundering herd §3.8 forbids. The Director's turn already runs off the critical path, so one indexed read (≈ 10 ms) per turn costs nothing child-facing | Turn-boundary polling shows up in CM2 as a material share of Neon CU-hours |
| CO4 | **Never-live list (I-F10):** no T3/G2, image, video, audio or chant build starts with horizon `in_lesson`. The Conductor downgrades it to `next_lesson` | G2 P50 ≈ 12-15 min, P90 > 20 min, about 1 build per codex deployment at a time (MO R1); images 13-53 s at 4 RPM company-wide (AP1); TPM, not dollars, is scarce (MO R2) | G2 P90 + gate ≤ 6 min at ≥ 2 concurrent builds (MO `forge-live-personalisation-is-g1`) |
| CO5 | **X29 extended to Forge:** `forge_request` rows are locked before any child-owned forge row, several of them in **ascending `library_key`**, and never `child_seq`. The commit sorts its `forge.demand` batch; `forge_publish` locks the new and the superseded request in one ordered statement; `review_decide` locks `forge_request` first | Controls deadlocked **5/5** in each of three cells (unsorted commits; G1 publish; G1 review_decide); the G2 shapes deadlocked **0/5** in each, and **0/10** for commit vs publish in both orders [M §4.4] | A new Forge writer that cannot follow the order (then it gets its own probe cell first) |
| CO6 | **Review seconds are admitted, not discovered.** `forge.admit` only moves a human-tier request to `spec` while the queued review seconds fit the named reviewers' capacity before the horizon's SLA | At 300 children the S2 sim builds ≈ 30 G2 cores a day (MO §7.4); at 600-900 s of review each that is 5-7.5 h/day against one reviewer (CONDUCTOR §8.5 SPOF). Unadmitted, the queue grows without bound and SLAs become fiction [I] | A second reviewer rota with measured throughput ≥ intake |
| CO7 | **Video after 2026-10-15 is code.** sora-2 `2025-12-08` is Preview and retires **2026-10-15 with no replacement**; it is the only video model in the Foundry schedule [V, re-checked today]. M3 "video" = `explainer@1` rendered to MP4 by the seek renderer, a Manim lane for Class 8-9 maths in ACA dynamic sessions, and stills-with-motion for phenomena | Retired deployments return `410 Gone`; preview retirements are not extendable [V]. Code-rendered media is exact on text and numbers, sora was not [Me AV, VAG] | Azure lists a GA first-party video model with ≥ 12 months to retirement (VAG reversal) |
| CO8 | **Songs v1 = chant + code-composed jingle, both Azure first-party.** Verbatim lines rendered by Azure AI Speech (hi-IN Swara), beat-scheduled on the client, optionally over a tune from a reviewed, code-composed template library. **A sung render is rejected** for v1 (§8.5) | No first-party Azure model sings: gpt-4o-mini-tts "sing" showed no singing acoustically (n = 18) and Azure Speech has no singing voices [Me SR]. Melody helps verbatim recall only when simple and repeated (Wallace 1994) [S], which a template library gives | An allowed model passes M-SONG-6 (≥ 95% phonetic + ear gate), or M-SONG-5 shows chant at a ceiling melody beats |
| CO9 | **Every song/chant kit passes the recitation lint L1-L5** before review: words are kit tokens in order (luna may arrange, never author), no blocked 6-gram, no blocked melodic contour, no lyric text in any `compile()` lane, no nursery register for B3-B4 | Inherited law: sentence-shaped prompt text gets recited; LS rule 24 (lyric *is* the content); a sung "चौदा" is a wrong answer delivered beautifully (SR §3) | Lint false-block rate > 10% on the first 100 reviewed kits |
| CO10 | **Image prefetch is ranked by cohort demand, not by the class calendar.** Score = Σ children P(on topic on day d)·γ^d over 14 days, within the nightly image quota; keys ≤ 2 days from first use go first | Calendar-only prefetch caps CM4-img at **86%** because children sit ±3 topics off the calendar; demand ranking gives **99%** at 300 images/night and **94%** at 100/night [sim, §9] | Measured CM4-img (from `module_run`) under calendar ranking ≥ 95% |
| CO11 | **CM4 is computed from `module_run.source`, written only by the Director.** CM4 = library-class mounts ÷ library-class wants per lesson; CM4b ("built while she teaches") = `module_ready` mounts with horizon `in_lesson` ÷ all mounts | CONDUCTOR §9.12 named CM4 without a definition or a writer. A metric with no writer is a gate that lives nowhere | — |
| CO12 | **`gpt-4o-transcribe 2025-03-20` also retires 2026-10-15** [V]. Re-pin `taxila-transcribe` before then (D-ASR) and re-run the phonkey probe set | It gates TTS round-trip WER and every chant kit (SR §8 gate A). The G1 `allowed_model` row said "no known retirement" | — (a fact) |

---

## 1. Where this sits

```
 Director (per turn, server)        Conductor (per child, code)                 Forge (library-level, no child column)
 ─────────────────────────          ─────────────────────────────               ───────────────────────────────────────
 live fill T1/T2a (≤ 3 s) ──mount──► module_run(source='live_fill')
        │ module.requested{need}    decide(): forge.demand{horizon, …} ─commit─► forge_file_demand() → forge_request (+ forge_waiter
        └──────── ingest ─────────► + enqueue forge.* (library idem key)          if in_lesson/next_lesson and a child)
                                                                               forge.admit → spec → built → auto_validated
 turn poll: forge_ready_for() ◄──── module_ready (read model) ◄── forge_publish() fan-out ◄── (review_enqueue → review_decide)
 lesson start: brief.refresh ◄───── preparedModules = forge_ready_for() ∪ inventory hits ∪ kit floors
```

Rules (each is an invariant in §11.3):
1. **One writer per fact** (header of the `.sql`). The Conductor commit is the only inserter of `forge_waiter`;
   Forge consumes waiters (publish, close, sweep); `module_ready` is Forge's; `module_run` is the Director's.
2. **Agents never call agents** (CONDUCTOR §1.1 rule 2). Forge never writes a child's mailbox; the Director never
   calls Forge; the Conductor never waits for Forge.
3. **No child field in a library row** (I-F2). G2 removed `forge_request.first_lesson_id`: a lesson uuid joins to
   `lesson.child_id`, so it was a child link inside a library table.
4. **Exact keys, two of them** (MO review R7). `library_key` = the *build* key (identity + provenance) and is what a
   request is. `identity_key` = the *serving* family (modality, objective, misconception, mechanic, band,
   deviceClass). The planner's inventory snapshot looks up by identity and ranks by provenance, so a gate or
   generator bump does not turn the whole library into misses.

---

## 2. The demand: `forge.demand` horizons

### 2.1 Who emits what, when

| horizon | emitted by | trigger | child / waiter | tiers | `wantedBy` | pays | admission |
|---|---|---|---|---|---|---|---|
| `in_lesson` | Conductor (inline `step()` after the Director's `module.requested`) | (a) `need:'near_line'`: the Director wants a T2b scene or free-form explainer ≥ 45 s ahead (the next segment, or during practice); (b) `need:'promote'`: a live fill was served and should enter the library | (a) yes; (b) **no** (the child already has it) | T2 only (CO4) | the child's next planned lesson day ≥ today (so a late module carries over) | library fund | worker `fast`, priority 0 |
| `next_lesson` | Conductor | (a) `lesson.ended` with `misconceptionsOpened − misconceptionsResolved` that are **kit-listed** (MO R3) and have no identity hit; (b) `plan.adopt` for a slot whose planned module key misses the inventory; (c) `teacher.promise{kind:'game'}`; (d) any never-live tier downgraded from `in_lesson` | yes (≤ 3 a day; ≤ 2 on non-T1/T2 tiers) | all | the next planned lesson day for that topic | library fund | `forge.admit` knapsack |
| `two_weeks` | Conductor (child-less) **and** the `forge.horizon` job | Conductor: on `plan.adopt` and on the Sunday week intent, for keys of the child's slots in the next 14 days that miss the inventory snapshot. Horizon job: nightly, the cohort's predicted topics (§9.2) | **no** | all except video | — | `budget(forge, two_weeks, day)` | knapsack, night lane |
| `term` | the `forge.horizon` job only | term start and every Sunday: the H0 catalogue (every kit-listed misconception × 1-2 mechanics; one explainer per eligible objective; chant kits for the term's verbatim families; skin packs) | **no** | all | — | `budget(forge, term, seed:<academicYear>)` | knapsack, night lane |

### 2.2 Conductor reducer rules

```ts
// server/conductor/handlers/forge.ts — pure (inside decide()); reads only the inventory snapshot version in ctx.
// The commit adapter sorts every batch's 'forge.demand' commands by libraryKey before calling forge_file_demand (CO5).
const NEVER_LIVE: ReadonlySet<ForgeTier> = new Set(['T3', 'image', 'video', 'audio']);
export function onModuleRequested(s: ConductorState, ev: ModuleRequested, ctx: DecideCtx): Command[] {
  const k = libraryKeyOf(ev.key, ctx.cfg.versions);                  // build key; identity key travels in meta
  if (ctx.inventory.hasIdentity(k.identityKey)) return [];            // a published family member exists: no demand
  if (ev.need === 'promote')
    return [demand(k, 'in_lesson', { child: null }), enqueue('forge.spec', k)];          // promote a served live fill
  if (NEVER_LIVE.has(k.tier) || ev.need === 'next_lesson')
    return [demand(k, 'next_lesson', { child: s.childId, wantedBy: nextLessonDay(s, ctx, ev.topicId) })];
  return [demand(k, 'in_lesson', { child: s.childId, lessonId: ev.lessonId, slotId: ev.slotId,
                                   wantedBy: nextLessonDay(s, ctx, ev.topicId, { includeToday: true }) }),
          enqueue('forge.scene', k, { priority: 0, lane: 'fast', deadlineSec: 60 })];
}
export function onLessonEnded(s: ConductorState, ev: LessonEnded, ctx: DecideCtx): Command[] {
  const open = ev.outcomeDigest.misconceptionsOpened.filter((m) => !ev.outcomeDigest.misconceptionsResolved.includes(m));
  return open.filter((m) => ctx.kits.isListedMisconception(m))       // MO R3: never pre-build LLM candidates
             .map((m) => remediationKey(ev.topicId, m, s.band, ctx))
             .filter((k) => !ctx.inventory.hasIdentity(k.identityKey))
             .slice(0, 2)                                            // the daily race cap is also enforced in SQL
             .map((k) => demand(k, 'next_lesson', { child: s.childId, wantedBy: nextLessonDay(s, ctx, ev.topicId) }));
}
```

### 2.3 Where each demand ends up

`forge_file_demand` returns `hit | filed | waiting | already | cap | closed` (`.sql`). The commit records the
result in `decision_log.commands[].result`; only `hit` changes what the child sees (a `module_ready` row in the
same transaction). `cap` and `closed` are fine outcomes: the plan already carries a fallback, and the key keeps its
aggregate demand for the knapsack.

---

## 3. Contracts

```ts
// shared/forge/keys.ts
export interface IdentityKeyFields {                  // hashed → identity_key (the serving family; MO review R7)
  modality: Modality; objectiveId: string; misconceptionId: string | null;
  mechanic: string;                                   // 'fractions@1' | 'scene@1/sort-bins@1' | 'explainer@1/process-steps' | 'manim@0.21' | 'chant-track@1/pahada' | 'jingle@1/<tuneId>'
  band: Band; deviceClass: 'full' | 'lite';
}
export interface LibraryKeyFields extends IdentityKeyFields {   // hashed → library_key (the build)
  engine: string; specHash: string; kitVersion: string; gateVersion: string; generatorVersion: string;
}
// No field of either may be a child field (I-F2; the table check refuses childId, name, lessonId, transcript, …).

// shared/conductor/commands.ts — replaces the "proposed" comment in CONDUCTOR §3.5
export type ForgeHorizon = 'in_lesson' | 'next_lesson' | 'two_weeks' | 'term';
export interface ForgeDemandCmd {
  kind: 'forge.demand'; libraryKey: string; identityKey: string; key: LibraryKeyFields;
  meta: { tier: ForgeTier; buildClass: string; modality: Modality };
  horizon: ForgeHorizon;
  childScoped: boolean;                               // false for two_weeks/term and for 'promote' (CO1)
  lessonId?: string; slotId?: string; wantedBy: string /* IST date */; predicted?: number;
}
export type ForgeDemandResult = 'hit' | 'filed' | 'waiting' | 'already' | 'cap' | 'closed';

// the Director's event (amends CONDUCTOR §2.2 `module.requested`)
export interface ModuleRequested {
  type: 'module.requested'; lessonId: string; slotId?: string; topicId: string;
  key: IdentityKeyFields & { engine: string; specHash: string };
  need: 'promote' | 'near_line' | 'next_lesson';
  needBySec?: number;                                 // near_line: seconds until the planned mount
}

// shared/contracts.ts — LessonBrief.preparedModules becomes PreparedModule[] (superset of the old element type)
export interface PreparedModule {
  artifactId?: string;                                // absent for a kit-default floor
  engine: string; params: Record<string, unknown>;
  libraryKey?: string; contentHash?: string; blobPrefix?: string;   // the device checks contentHash against lib-blocklist (I-F7)
  source: 'module_ready' | 'library' | 'on_device' | 'kit_default';
  tier: ForgeTier | 'kit'; reviewGrade?: 'auto' | 'one_key' | 'two_key';
  forSegment?: number;                                // index into LessonBrief.segments
  fallbacks: Array<{ engine: string; params: Record<string, unknown>; source: 'library' | 'on_device' | 'kit_default' }>;
                                                      // last entry is always marginal-zero and device-cached (MO review C2)
}

// the Director's mount record (module_run, Director-only writer)
export interface ModuleMount {
  lessonId: string; engine: string; params: Record<string, unknown>;
  source: 'on_device' | 'library' | 'module_ready' | 'live_fill' | 'kit_default' | 'static_floor';
  artifactId?: string; libraryKey?: string; needByMs: number; readyMs: number | null; missedPrimary: boolean;
}
```

---

## 4. Data, the waiter state machine, and the lock order

### 4.1 Tables (summary; the DDL is `content-orchestration.sql`)

Library-level: `forge_request` (one per build key; state machine `forge_edge`), `forge_transition` (the Forge log),
`forge_artifact` (immutable outputs), `artifact_alias`, `allowed_model`, `forge_policy`, `forge_review_policy`,
`review_sla`, `reviewer`, `review_item`, view `forge_blocklist`. Child-owned (WORKSPACE_MAP, cascade on erase):
`forge_waiter`, `module_ready`, and the Director's `module_run` (extended with `source`, `artifact_id`,
`library_key`, `need_by_ms`, `ready_ms`, `missed_primary`).

### 4.2 Waiter fan-out state machine

```
                        forge.demand{in_lesson|next_lesson, child}            (Conductor commit; forge_request locked first)
   (none) ──────────────────────────────────────────────────────────────► WAITING  forge_waiter row
      │  state = published at file time ─────────────► READY directly (module_ready inserted in the same commit: 'hit')
      │  daily slots full / races ≥ 2 ───────────────► CAPPED  (no row; aggregate demand only; the plan's fallback runs)
      │  state ∈ {rejected, retired} ────────────────► CLOSED  (no row)
   WAITING ── forge_publish(request) & wanted_by ≥ ist_today() & age < waiter_days ──► READY  module_ready row; waiter deleted
   WAITING ── forge_publish & outside the window ───────────────────────────────────► DROPPED (waiter deleted, no row)
   WAITING ── request → rejected | retired (forge_transition_to) ───────────────────► CLOSED  (waiter deleted; the child never knew)
   WAITING ── forge_sweep: wanted_by < ist_today() or age ≥ waiter_days ────────────► EXPIRED (deleted, SKIP LOCKED)
   READY ── Director mounts it (module_run row with artifact_id) ───────────────────► SERVED  (forge_ready_for() stops offering it)
   READY ── superseding publish ───► READY on the new version (row re-pointed, then the old request retires) [M F21]
   READY ── quarantine / demote (forge_transition_to → retired) ──────────────────► REVOKED (row deleted; hash on lib-blocklist) [M F18]
   READY ── forge_sweep: expires_at = ist_end_of(wanted_by) < now() ─────────────────► EXPIRED
```

The two facts a publish needs are consistent under any interleaving with a commit: if the commit wins the
`forge_request` lock, publish fans its new waiter out; if publish wins, the commit sees `published` and inserts the
`module_ready` row itself. **No lost waiter in 10/10 races, both orders** [M D4].

Dates are IST learning days. G1 compared `wanted_by` with `current_date` (UTC on Neon) and cast dates to
timestamptz in the session zone, so a module expired at 05:30 IST and a 23:00 IST publish dropped next-day waiters.
G2 uses `ist_today()` and `ist_end_of()` [M F9].

### 4.3 Lock order (X29 extended)

| writer | locks, in order |
|---|---|
| Conductor commit | `conductor_state` → **`forge_request` × n in ascending `library_key`** → `forge_waiter` / `module_ready` inserts → `job` → `wakeup` → `notification`/`notify_slot` → `child_seq` LAST |
| `forge_publish` | `forge_request` {this, superseded} in one ordered `FOR UPDATE` → `forge_artifact` → `module_ready` / `forge_waiter` / `review_item` (sample insert) |
| `forge_transition_to`, `forge_quarantine`, `review_enqueue` | one `forge_request` → its waiters / `module_ready` / `review_item` |
| `review_decide` | `forge_request` → every `review_item` of the artefact in id order → `forge_artifact` → (publish, same request already held) |
| `review_next`, `review_escalate`, `forge_sweep` | single statements with `SKIP LOCKED` on child-owned or queue rows: they never wait, so they cannot join a cycle |

### 4.4 Verification on scratch Postgres 16 (`content-orchestration-pg16-probe.py`)

**Method.** `initdb` a scratch PG 16.14; per suite, a fresh database with the real `db/migrations/001_core.sql`
(the stub for `child`, `lesson`, `module_run`) plus `content-orchestration.sql`; fixtures: 1 guardian, 2 children, 1
lesson, 2 reviewers (r1 → backup r2). Functional checks run once (deterministic). Each race cell runs 5 times with
two concurrent `psql` sessions and a 0.5-0.6 s `pg_sleep` injected at the lock point; a cell's **control** is the
G1 function body (from `content-orchestration.g1-frozen.sql`) or the unsorted call order. 2026-10-02, n as stated.

| id | check | result |
|---|---|---|
| F1-F3 | file / already / second child joins one request (single-flight, `demand_count` 2) | pass |
| F4-F5 | 3 waiter slots a day; on non-T1/T2 tiers at most 2 | pass |
| F6, F7 | `term` without a child; **`two_weeks` with a child: no waiter, no error** | pass |
| F7c | control: the waiter row G1 inserted for that demand violates the horizon check | **G1 defect**: the commit aborted |
| F8 | a key carrying `childId` is refused (I-F2) | pass |
| F9-F11 | auto-tier publish fans out to both waiters, consumes them, IST expiry; `lesson_id` on the row; a later demand is a `hit` | pass |
| F12, F13 | a model off the list, and a deployment **on its retirement day**, cannot publish (I-F13) | pass |
| F14-F16 | `review_enqueue` makes subject + lang(hi) + lang(en); next-lesson SLA ≤ 15:00 IST of `wanted_by`; no publish before keys; the last approval publishes | pass |
| F17 | a T3 build without egress/CSP attestation cannot publish even when approved (I-F8) | pass |
| F18 | quarantine removes `module_ready`, blocklists the hash, `forge_ready_for` returns 0; served rows drop out | pass, **after a G1 fix**: G1's check `(state='published') = (published_artifact_id is not null)` made every published → retired move fail, so quarantine, supersede and demote were unreachable [M: the first run raised the check violation] |
| F19 | `request_changes` reworks once | pass |
| F20 | sweep drops past-`wanted_by` waiters; escalation moves overdue items to the backup | pass |
| F21 | a superseding publish re-points both children's prepared module, then retires the old version | pass |
| D1 | two commits file keys `k_x`/`k_y`: **opposite orders 5/5 deadlocks; sorted 0/5** | CO5 |
| D2 | publish of `k_new` (supersedes `k_old`) vs a sorted commit filing both: **G1 publish 5/5; G2 0/5** | G1 defect fixed |
| D3 | two reviewers decide two keys of one artefact (reject ‖ approve): **G1 5/5 (both left in `human_review`); G2 0/5 (request `rejected`)** | G1 defect fixed |
| D4 | commit vs publish on one key, each order first: **0/10 deadlocks; the child holds exactly 1 `module_ready` row in 10/10** | I-F5 |

**Total: 30/30 checks as expected.** Not covered: Neon's pooler, more than two concurrent sessions, the real
`002_conductor.sql` commit around these calls (the CONDUCTOR §3.8 probe covers the non-Forge segment), and the
`forge.admit` knapsack (TS, not SQL).

---

## 5. Delivery: from `module_ready` to a mounted module

### 5.1 At lesson start and resume (`brief.refresh`)

`/api/lesson/start` step (4) builds `LessonBrief.preparedModules` from three sources, in this order:
1. `forge_ready_for(childId)` rows whose `objective_id` belongs to the slot's topic (published, not blocklisted, not
   yet served);
2. inventory-snapshot hits for the slot's planned moves (the planner's identity lookup, no I/O inside `plan()`:
   MO review R6);
3. the kit-default floor of every planned move.

Every `PreparedModule` carries its fallbacks, ending in a marginal-zero, **device-cached** floor. The device
prefetches all floors into the Capacitor cache at lesson start; an unfetched floor counts as not ready (MO review C2).

### 5.2 Mid-lesson: the turn poll

At every turn boundary the Director runs `forge_ready_for(childId, lastPollAt)`: one indexed read (≈ 9-12 ms on the
pooled Neon URL, CONDUCTOR binding constraints), off the critical path because the Director's turn already is
(ARCHITECTURE §1.2). A new row for the current lesson is offered only at the next natural stop and only if nothing
is mounted for that segment (**mounted lock**, I-F9: never hot-swap a medium the child is using; MO review C1).

### 5.3 The inline budget against segment timing

| request | path | budget | measured latency | fits when | B1 / B2 / B3 / B4 segment (teach, practice/play min) |
|---|---|---|---|---|---|
| T1 params (live fill) | Director `generate_now`, luna effort none | **3 s hard timeout** from the move decision | 1.88 / 2.05 s p50/p90 [Me GR] + ≈ 0.1 s validate | always (covered by the teacher's bridge preamble, 2-3 s) | any |
| T2a template fill (live) | Director `generate_now` | **3 s hard timeout** | 3.08 / 3.35 s p50/p90 [Me GR] | **only with one turn of lookahead**: requested at turn n for a mount at n+1 (an explain turn covers 5-13 s [Me GR]); a reactive T2a request has p90 > 3 s, so it falls back | any |
| T2b scene / free-form explainer | `forge.demand{in_lesson}` → `forge.scene` on worker `fast` p0 → publish → poll | need-by ≥ 45 s | 11.9 s p50; 24-41 s p90 with a repair [Me GR] | requested at segment start for the **next** segment, or at the minute-3 diagnostic for practice | teach 5 / 7 / 10 / 12 min ahead of practice: always fits |
| G2 / T3 game, image, chant, animation, video | `next_lesson` | next planned lesson | G2 12-15 min P50 (MO R1); image 13-53 s at 4 RPM | never live (CO4) | — |

India RTT is not on the T1/T2a rows, because the model call runs server-side in eastus2. It is on the device's
mount of the result (one WebRTC data-channel message), which CM13 measures.

### 5.4 What the Director does on a miss

1. At need-by, mount `fallbacks[0]` silently. The teacher's bridge shape never promises the missing medium and she
   never says "loading" (MO §10). Write `module_run{missedPrimary: true, source}`.
2. A late live fill is discarded for this mount. It is still promoted (`need:'promote'`) so the next child hits.
3. A late `module_ready` row (T2b) is offered as "next round" only if the segment has ≥ 90 s left and nothing is
   mounted; otherwise it stays `READY` for the next lesson (its `wanted_by` is the next lesson day: §2.1).
4. Three misses in one lesson → the Director stops requesting T2a/T2b for that lesson and teaches from T1 and the
   kit (one fewer thing to fail in front of a child) [U].

---

## 6. Admission: `forge.admit` (knapsack)

Every 15 min (night: every 5 min), the worker's `forge.admit` job ranks `requested` rows and moves the best to
`spec`:

```
value_k  = Σ_{live waiters w} weight(w.horizon) + predicted_demand_k        # weights from review_sla: 8 / 4 / 2 / 1
           × Δ_tier × (1 − P(cohort warms it by need))                       # Δ = .05 for every key today [U]: so ranking ≈ demand / cost (MO review D)
cost_k   = model_cost_est_k / pass_rate_tier  +  review_sec_est_k × λ_review # 1/pass-rate: 25-40% of G2 builds fail the gate (MO review C4)
admit while: budget(forge, horizon-line).reserve(cost_k) succeeds
         AND deployment bucket (codex TPM, image RPM) has lane headroom      # ≥ 30% of codex TPM held for in-lesson work 17:00-21:30 IST (MO R2)
         AND Σ review_sec of admitted-but-unreviewed human-tier work ≤ reviewer capacity before the SLA (CO6)
order by: (deadline within the SLA window) desc, value_k / cost_k desc, first_requested_at
```

`λ_review` is a shadow price that rises as the reviewer-hours remaining today fall [U]. A failed reservation is not
an error: the key stays `requested` with its rank. A key that fails its gate twice goes to a 24 h **cool-down**
(MO review C4) before it can be admitted again.

---

## 7. Video after sora-2

### 7.1 Re-verification [V, 2026-10-02]

- Microsoft Learn, *Model retirement schedule — Microsoft Foundry* (`updated_at 2026-09-23`), Azure OpenAI table:
  `sora-2 | 2025-10-06 | Preview | 2026-07-15 | sora-2 (2025-12-08)` and **`sora-2 | 2025-12-08 | Preview |
  2026-10-15 | —`**. No other video-generation model appears among the Foundry Models sold by Azure. The image
  rows that remain are `gpt-image-2` (GA → 2027-10-21) and `gpt-image-2.5-flare`/`-sunburst` (GA → 2027-09-09);
  the MAI-Image-2.5 variants retired 2026-10-01.
- Microsoft Learn, *Foundry Models lifecycle and support policy* (`updated_at 2026-07-24`): a retired model
  "Removed from service. All inference requests return `410 Gone`". For a preview with no replacement, "customers get
  **30 days notice** before the model retires". FAQ: "Can I get an exception to extend a model's retirement date?
  No. Retirement dates aren't extendable."
- Microsoft Learn, *Sora 2 video generation overview (preview)* (`updated_at 2026-06-05`) states no retirement date,
  which is why AV §4.1 read "no retirement date stated". That page predates the schedule row; the schedule wins.
  The same page: "Jobs are available for up to 24 hours after they're created."
- A web search the same day found developer threads tracking the same 2026-10-15 cut-off and no Foundry successor
  (Microsoft Q&A; GitHub issues) [S].

**Same-day findings from the same schedule that change other rows:** `gpt-4o-transcribe 2025-03-20` (GA) **retires
2026-10-15** with no listed replacement (CO12); `gpt-4o-mini-tts 2025-12-15` GA → 2027-06-15 (the pin is right);
`gpt-realtime-2.1` and `-mini` GA → 2027-06-25; `gpt-5.6-sol`/`-luna` → 2028-01-11; `gpt-5.3-codex` → 2027-08-24;
`text-embedding-3-small` → 2028-02-09. All are now in `allowed_model.allowed_until`.

### 7.2 The M3 fallback: video is code

| need (MO9 / VAG §5) | M3 primary | how it is built | where it runs | review | key |
|---|---|---|---|---|---|
| in-lesson concept animation | `explainer@1` **performed** by the live teacher (DSL; no file) | T2a template (live) or library core | client GSAP player | template once; library core per T2 explainer policy | identity `{animation, objective, misc, explainer@1/<template>, band, device}` |
| replay, B1 rest-from-voice, offline, lite devices | `explainer@1` **clip**: the same core + Azure Speech narration per lang (`<bookmark>` per beat) | `forge.explainer` | ACA job (trusted code: our player + JSON data) | lang key per narration | core + `{lang, voice, textHash}` narration layer |
| parent share (WhatsApp), lite tier | **MP4** from the seek renderer (`master.seek(i/fps, false)`: VAG review R1) | `forge.animation{renderer:'seek'}` | ACA job, headless Chromium + ffmpeg | `video/render_explainer`: subject key | core + `{lang, voice, 480p}` rendition |
| Class 8-9 derivations, precise geometry | **Manim** segment (codex writes a `TaxilaScene`; RITL repair ≤ 3) | `forge.animation{renderer:'manim'}` | **ACA dynamic sessions** custom-container pool, egress disabled, Hyper-V isolation [V] (LLM-written Python is untrusted code) | `video/render_manim`: subject + kid_ux; G-layout and G-geometry gates (VAG §7.3) | identity `{animation, objective, misc, manim@0.21, band, device}` |
| real-world phenomena (monsoon, flood, mela) that sora was for | **stills with motion**: 2-4 gpt-image-2 stills, Ken Burns/parallax, SVG labels as overlays (VAG §3.8) | `forge.image` (night) + `forge.explainer` | worker + ACA job | image auto + 10% sample; overlay strings kit-sourced | image keys (§9) + explainer core |
| chapter video (5 min) | storyboard → segments in `explainer` / `manim` / `still` lanes → MP4 (VAG §7.2) | `forge.chapter` | ACA job + sessions | **two-key** (subject + kid_ux) | `{chapter, objectives, style_v, voice, lang}` |

**Cost per artefact** (model + compute; human review is listed separately because it dominates):

| artefact | model + compute | review | basis |
|---|---|---|---|
| explainer@1 core (library) | $0.05-0.20 (sol planning with critique) | T2 explainer: auto + 10% sample; 300 s when sampled | AV §8 [U] |
| narration per lang (≈ 340 chars/min) | ≈ $0.005/min (Azure Speech $15/M chars) | lang key ≈ 150 s | AV §8 [V price] |
| MP4 rendition | ≈ $0.005/min (≈ 160 vCPU-s at 1.49× realtime on 4 vCPU) | covered by the core's subject key | AV §7 [Me] + ACA price [V] |
| Manim segment | ≈ $0.07 per attempt (codex $0.06 + TTS $0.008 + compute $0.0003) ≈ **$0.10** at 1.4 attempts | 300 s, two queues | VAG §4 [Me] + [U attempts] |
| chapter video, 10 segments | $0.6 (luna coders) to $1.3 (codex coders) + TTS $0.08 + render $0.02 | two-key, ≈ 10 min | VAG §7.2 [I] |
| phenomenon still-with-motion | 2-4 × $0.053 (gpt-image-2 medium) + $0.005 render ≈ **$0.11-0.22** | image auto + overlay lint | AP [Me], VAG §3.8 |
| (reference) sora-2 8 s hook | $0.80 raw; ≈ $18 per accepted minute at 1-in-3 | ≈ 2 min per clip | AV §4.3 [Me] |

**Sandbox idle cost.** Custom-container session pools "are billed based on the resources consumed by the session
pool" [V]. One ready 2 vCPU / 4 GiB session kept warm all day is about 86,400 s × (2 × $0.000024 + 4 × $0.000003)
≈ **$5.2/day** at consumption rates [I]. So the Manim pool keeps **0 ready sessions** outside the nightly render
window (23:00-05:00 IST, ≈ $1.3/night when warm) and Manim is library-only.

**Library-key reuse.** One reviewed explainer core serves three renderings (performed, clip, MP4); language and
voice are layers keyed beside the core, never inside it (MO5). Azure Speech is deterministic (SR §4), so one
narration render per `(core, lang, voice, textHash)` is the render and its lang key holds. At the AV sizing (≈ 310
explainers for 60% of maths/science/EVS topics, voiced in hi and en), the whole library is ≈ $60 of compute
worst-case and **≈ 26 reviewer-hours**, which is the binding cost [AV §8].

### 7.3 The pre-retirement batch (owner option D-VIDEO, deadline 2026-10-13)

MO review R12 proposed archiving ≤ 20 reviewed phenomenon hooks before retirement under a hard $50 cap. Ruling:
**optional, and nothing in M3 depends on it.** If the owner takes it:
- clips assert nothing countable, directional or causal (AV §4.4), with no text and no faces;
- each is downloaded within 24 h (jobs expire [V]);
- each must **publish before 2026-10-15**, because I-F13 checks the model at publish time [M F13]. An archived MP4
  that is already published stays servable: it is bytes, not a call.

Default: no new sora work.

---

## 8. Songs

### 8.1 What was tried (measured by SR, 2026-10-02)

| path | result | verdict |
|---|---|---|
| gpt-4o-mini-tts with an instruction to sing | no acoustic sign of singing: held-note share 0.83 vs 0.80 plain; f0 spread 8.9 vs 9.8 st (n = 18 per arm); durations vary up to 0.60 s per rep | **rejected** (§8.5) |
| Azure AI Speech neural voices | no singing voices in the roster [V SR]; hi-IN Swara deterministic, 160 / 297 ms first byte / total, 12/12 table lines phonetically right [Me] | **v1 chant voice** |
| SSML `mstts:audioduration` to fit a beat | it budgets the file including ≈ 1 s of trailing silence, so speech is compressed ≈ 2× and words merge ("दोत्या छे") [Me] | rejected; fit on the client |
| gpt-realtime-2.1 (the teacher) chanting on a beat | not beat-lockable (server VAD, network jitter); the beat leaks into the mic | rejected; she frames and reacts (SR §5) |
| any third-party singer (Suno, ElevenLabs Music, Lyria) | excluded by `azure-only-compute` | reference only |
| open-weight ACE-Step 1.5 (MIT) / YuE (Apache-2.0) on an Azure GPU | allowed as open-source on Azure compute, **not** first-party; Hindi lyric accuracy [U] | v2 probe (M-SONG-6), owner call (D-SONG) |

### 8.2 The Azure-first-party path

| rung | what the child hears | built how | first-party pieces | status |
|---|---|---|---|---|
| S0 `chant-track@1` | reviewed Swara clips on a synthesised client groove; echo / together / fade / speed ladder | `forge.chant`: Azure Speech per line × {−15%, 0, +15%}, ASR round-trip, phonKey, lang key | Azure AI Speech; `taxila-transcribe` (re-pin by 2026-10-15) | **v1** (SR §6-§8) |
| S1 `jingle@1` | the same chant over a simple, repeated tune (one tune per kit family: Wallace 1994) | **tune library:** ≈ 24 templates written once by `taxila-codex` under a constrained grammar (major or pentatonic, 4/4 or 6/8, 8-16 bars, range ≤ 1 octave, ≥ 70% step-wise), as note arrays, auditioned in the Forge sandbox with Tone.js (MIT), heard by a reviewer, and L3-linted. **Per kit:** code maps line slots to bars; luna only *arranges* kit tokens plus closed fillers into the metre | codex, luna, Azure Speech | **v1.5**, after M-SONG-5 shows the chant works |
| S2 sung vocal | — | no first-party model sings | — | rejected for v1 (§8.5) |
| floor | the teacher speaks the sequence (free-time call-and-response) | none | realtime | always |

Client playback stays the SR runtime: a Web Audio scheduler of ≈ 6 kB with synthesised instruments. Tone.js is used
only in the sandbox to compose and audition, so the low-end device carries no extra 300 KB library [I]. The melody
ducks −12 dB under voice slots and carries the cue in child slots [U; M-SONG-7].

Costs: tune library ≈ $1 of codex plus 24 × 2 min of review; a kit's render ≈ $0.003 (SR §2: the whole verbatim
corpus is ≈ $0.90 per variant); the lang key is the binding cost (SR §8: ≈ 4 h for the corpus).

### 8.3 Band and age fit

Bands are CONDUCTOR §4.1's (B1 6-7 y, Class 1-2 · B2 8-9, Class 3-4 · B3 10-12, Class 5-7 · B4 13-15, Class 8-9).
Eligibility is a **predicate**: song/chant only when the objective's `contentShapes` includes `verbatim_sequence`
(LS rule 24; I-F14).

| band | content | tempo | modes | jingle (S1) | fillers (L1 lexicon) | how it is offered |
|---|---|---|---|---|---|---|
| B1 | counting 1-20, स्वर, पहाड़े 2-5, action rhymes | 80-88 BPM | echo → together; claps | yes (nursery tunes from the PD template set) | nursery set (चलो, आओ, ताली…) | default for verbatim objectives |
| B2 | पहाड़े 6-12, व्यंजन by varga, months/days, planets | 92-100 | together → fade → speed ladder | optional | reduced set | default, with a choice tile (MO10) |
| B3 | पहाड़े 13-20, states in order, SI prefixes, dohas | 100-104 | child leads, fade | groove only, no nursery tune | `yo`, `हाँ`, `चलो` | **opt-in** tile, never imposed |
| B4 | formula wording, periodic-table rows, poem recitation | 104+ | child leads; rap-style groove | no melody templates | `yo`, `हाँ` | **opt-in** only; a "babyish" register is a defect (kids-ux-ages) |

Every pass hands over to shuffled retrieval in the same session (SR §0.7: chants are retrieved serially). The
Director emits `pahada.handoff`, and the fact-fluency engine owns the keys.

### 8.4 Recitation-safety lint (`media-recitation-lint.mjs`)

| id | rule | why |
|---|---|---|
| L1 | every content token of every lyric line equals the kit's verbatim token (or a listed regional variant), in order; the only other words are from the band's closed filler lexicon; the line count matches | the words are the curriculum. Luna arranges and never authors; a changed token is a wrong fact |
| L2 | no 6-token n-gram of the lyric appears in the blocked corpus (`ncert-pending` poems; a curated list of film and children's-song first lines) | model recitation of copyrighted lyrics; NCERT poems are blocked until the owner rules (SR §9). Coverage of the corpus is [U]: it is a floor, not a guarantee |
| L3 | the tune's exact semitone-interval sequence shares no 8-interval window with a blocked incipit | a codex "original" tune can be a film tune from memory |
| L4 | no 3-token run of the joined lyric appears in any `compile()` lane payload; the brief carries `kitId` and mode only | inherited law: sentence-shaped prompt text gets recited by the teacher |
| L5 | B3/B4 kits use no nursery-register filler | register fit (§8.3) |

**Golden cases: 11/11** [M, `media-recitation-lint-2026-10-02.txt`]. One finding: the first L4 version checked
4-grams per line, and table lines are 3 tokens ("दो दूनी चार"). It passed a lane that recited two lines; the shipped
version scans the joined stream with n = 3, and a kitId-only lane still passes (negative control). Lint runs in QA
before review (`qa_gates.L1…L5`); a fail is `reject_reason = 'recitation'`.

### 8.5 Rejection to log: `azure-first-party-sung-render`

- **Tried:** gpt-4o-mini-tts with "sing" instructions (n = 18); the Azure Speech voice roster; SSML duration fitting;
  the realtime teacher on a beat.
- **What broke:**
  - no measurable singing (held-note share and f0 spread do not separate sing from plain);
  - non-deterministic durations (each render needs its own review);
  - no singing voices in Azure Speech;
  - `audioduration` compresses speech about 2×;
  - realtime cannot hold a beat, and the beat triggers its VAD.
- **What remains:** chant (S0) and a code-composed instrumental tune under the chant (S1).
- **Reverse if:** an Azure first-party model with singing appears in the Foundry catalogue and passes M-SONG-6.

---

## 9. Lesson images: CM4 and the `prefetch` ranking

### 9.1 Definitions (computed nightly from `module_run`, which only the Director writes)

- **CM4** (per lesson): mounts with `source ∈ {on_device, library, module_ready}` ÷ mounts whose planned primary was a
  library-class artefact. Live fills and kit floors that were *planned* as such are excluded.
- **CM4b** ("built while she teaches"): mounts with `source = 'module_ready'` from an `in_lesson` waiter ÷ all mounts.
  This is the owner's claim, measured. CO2 and CO4 predict it will be small, and that is the honest number to show.
- **CM4-img** (per topic): planned image slots served from the library ÷ planned image slots, aggregated per topic
  over 30 days. A miss is the SVG / none rung (AP1: no live images).

### 9.2 Ranking `DayPlan.prefetch` and the `forge.prefetch` night queue

A `prefetch` entry is a library key only (V14). The Conductor contributes child-less `two_weeks` demand (§2.1). The
`forge.horizon` job scores every candidate key:

```
score_k = Σ_children Σ_{d=0..13} P(child on topic(k) on day d) · uses(k) · 0.7 · γ^d      # γ = .9; .7 = P(open) [U]
          P(child on topic t on day d) from the child's own recent topic and pace, aggregated to counts per key (no child field leaves this job)
rank:     (first expected use ≤ 2 days) desc, score_k / cost_k desc                        # cost_k: low $0.006 vs medium $0.053 [S AP]
capacity: nightly image budget Q = lesson-image share of 4 RPM × 22:30-05:30 IST (≤ 1,680/night if nothing else used it), ≤ 3 concurrent
```

### 9.3 What the simulation says (`image-prefetch-sim.py`, 4 seeds, 30 days from an empty library) [sim]

Model: 9 classes × 82 topics × 3 images per topic; two boards with block-rotated chapter orders (70/30); each child
at N(0, 3) topics off its board calendar with daily drift; 70% open rate.

| children | images/night | calendar (literal X10) | demand | demand + EDF | days 1-3 (demand + EDF) |
|---|---|---|---|---|---|
| 300 | 100 | 84.7% | 94.5% | 94.9% | 56.3% |
| 300 | 300 | 86.1% | 99.2% | 99.4% | 94.4% |
| 300 | 1,680 | 86.1% | 100% | 100% | 99.8% |
| 3,000 | 100 | 84.8% | 94.1% | 94.2% | 54.0% |
| 3,000 | 300 | 86.1% | 99.0% | 99.0% | 90.1% |

**Reading.**
- Calendar-only prefetch **plateaus at 86%** whatever the quota, because a ±3-topic spread puts about 1 child in 7
  off the calendar's topic. Demand ranking covers the spread and saturates by about 300 images a night.
- The EDF tie-break adds little, at most 2.5 points in the first three days.
- Thirty days of demand reach ≈ 1.2-1.4k distinct images (≈ $65-75 at medium; the whole 9 × 82 × 3 space is
  ≈ 2.2k), so the quota matters only while seeding and when games' assets compete for it.
- **Target: CM4-img ≥ 95% after a 2-week seed [U]**. The calendar-only plateau is a known wrong turn
  (rejection `calendar-only-prefetch`).

---

## 10. Review queue

### 10.1 Keys by build class (`forge_review_policy`)

| tier / class | queues that must approve | lang key | auto sample |
|---|---|---|---|
| T1 params | — | — | — |
| T2 scene, T2 explainer | — (auto after QA) | — | 10% |
| T3 kit_extended | subject | per served lang | — |
| T3 free_form | subject, kid_ux | per lang | — |
| T3 new_mechanic | subject, kid_ux (1800 s) | per lang | — |
| image raster / svg | — | — | 10% |
| video render_explainer (G2) | subject | per lang | — |
| video render_manim (G2) | subject, kid_ux | per lang | — |
| audio chant (G2: was auto) | **lang**: a native ear on every kit (SR §8 gate B) | yes | — |
| audio jingle (G2) | lang, kid_ux | yes | — |

**Runtime queues** are added by `review_enqueue(…, p_extra_queues)`:
- `art`: an image showing people or the cast, or one the VLM flagged;
- `community`: festivals, places of worship, regional dress;
- `safety`: anything a classifier scored above zero in `hi`/`hi-Latn`, where Content Safety is not trained (MO R10).

### 10.2 SLA and ordering (`review_sla`, `review_next`)

| nearest horizon | SLA | escalate at | weight |
|---|---|---|---|
| `in_lesson` (only runtime-flagged T2) | 2 h | 50% | 8 |
| `next_lesson` | min(20 h, 15:00 IST on the earliest waiter's `wanted_by`) | 75% | 4 |
| `two_weeks` | 72 h | 75% | 2 |
| `term` | 7 d | 75% | 1 |

- **Priority** = ln(1 + `demand_count` + `predicted_demand`) × weight.
- **`review_next(reviewer)`** orders by: items due within 2 h first, then priority, then earliest due, then id. It is
  `SKIP LOCKED`, so two reviewers never take the same item.
- **Expiry.** A `next_lesson` item whose waiters all expired keeps its item, re-weighted to its aggregate demand at
  the next `review_enqueue` cycle. A request older than 14 days with no demand is closed with `review_expired`.

### 10.3 Review minutes budget

| load | volume | review | hours |
|---|---|---|---|
| H0 catalogue T3 cores (≈ 600 keyed misconceptions × 1-2 mechanics: MO R3) | ≈ 600 | 600-900 s | **≈ 100-150 h, one-off** |
| explainer library | ≈ 310 | 300 s | ≈ 26 h one-off (AV §8) |
| chant corpus (base variant + 10% spot) | ≈ 3,500 lines | ≈ 4 h total | ≈ 4 h (SR §8) |
| images | ≈ 1.4k | 10% × 25 s | ≈ 1 h |
| steady state at 300 children: next-lesson G2 misses | ≈ 30/day before warming (MO §7.4) | 600-900 s | **5-7.5 h/day**, falling as the cohort warms the library |

The steady-state line is why CO6 admits review seconds against capacity. `reviewer.daily_review_sec` feeds the
`review` budget scope.

### 10.4 Escalation and paging

- `review_escalate(500)` runs on the ticker every 15 s. It moves items past `escalate_at` to the assigned reviewer's
  `backup_id`, and releases claims held for more than 45 min.
- Ops is paged once per run when more than 0 items escalate.
- An item that reaches its SLA unreviewed degrades the waiting children silently to the fallback. The parent is
  never told. The ops dashboard shows "review backlog" honestly.

---

## 11. Rows for CONDUCTOR (copied into §8.2, §9.5 and §9.9)

### 11.1 `forge.*` job kinds

| kind | lane / host | prio | idem key | model → fallback | deadline / notes |
|---|---|---|---|---|---|
| `forge.admit` | slow / worker | 2 | `forge.admit:{window}` | code (knapsack §6) | every 15 min; night every 5 min |
| `forge.horizon` | slow / worker | 3 | `forge.horizon:{day}` / `{isoWeek}` | code | nightly 22:30 IST (two_weeks), Sunday (term) |
| `forge.spec` (promote) | fast / worker | 2 | `forge.spec:{libraryKey}` | luna re-fill + validate → reject | promotes a served live fill to the library |
| `forge.scene` (near-line T2b / explainer) | fast / worker | 0 | `forge.scene:{libraryKey}` | brain → luna → T2a | need-by ≥ 45 s; else not started |
| `forge.explainer` | slow / worker or ACA job | 3 | `forge.explainer:{libraryKey}:{lang}` | sol + Azure Speech → template-only core | library; narration per lang |
| `forge.image` | slow / worker | 3 | `forge.image:{libraryKey}:{style}:{modelV}` | gpt-image-2 medium → low → SVG / none | night only; `azure:image ≤ 3` |
| `forge.build` (T3) | sandbox (M3) | 3 | `forge.build:{libraryKey}` | codex → existing engine | offline; review-admitted (CO6) |
| `forge.chant` | slow / worker | 3 | `forge.chant:{kitId}:{v}:{voice}:{tempo}` | Azure Speech → human clip queue | gate A ASR + lang key |
| `forge.jingle` | slow / worker | 3 | `forge.jingle:{kitId}:{tuneId}` | code fit → chant only | L1-L5 lint; lang + kid_ux |
| `forge.animation` | ACA job (seek) / ACA sessions (Manim, M3) | 3 | `forge.animation:{libraryKey}:{renderer}:{lang}` | Manim → explainer seek MP4 → none | sessions pool 0 ready outside 23:00-05:00 IST |
| `forge.video` (sora) | — | — | — | **retired 2026-10-15**; `allowed_model` refuses after that | replaced by `forge.animation` + stills-with-motion |
| `forge.sweep` | slow / worker | 3 | `forge.sweep:{day}` | SQL | nightly, plus opportunistic from the ticker |

### 11.2 Degrade-ladder rows (every rung keeps verified kit answers)

| work | rung 0 | rung 1 | rung 2 | floor |
|---|---|---|---|---|
| near-line scene (T2b) | `module_ready` | T2a template (with lookahead) | T1 engine | kit worked example |
| animation | library explainer core (performed) | T2a explainer template (live) | static diagram sequence | voice + anchor |
| video (M3) | library MP4 / chapter video | explainer clip (DSL + narration) | stills with motion | voice description |
| song / chant | `jingle@1` (S1) | `chant-track@1` (S0) | teacher-led call-and-response | text list |
| T3 game | library core + G1 fill | G1 kit default levels | T1 engine practice | tap items from the kit |

### 11.3 I-F invariants (each with a negative control)

| id | predicate | negative control |
|---|---|---|
| I-F1 | no publish without `reviewed_by`; a human tier needs every key-required item approved and no `auto:` reviewer | F15 |
| I-F2 | no child field in `forge_request.key`, `forge_transition.evidence` or `forge_artifact.manifest`; no lesson or child id in a library row | F8 |
| I-F3 | `forge_waiter` rows are inserted only by the Conductor commit and only for `in_lesson`/`next_lesson` | F7, F7c; writer census |
| I-F4 | ≤ `per_child_daily_demand` waiters per child-day, ≤ `per_child_daily_races` on non-T1/T2 tiers | F4, F5 |
| I-F5 | after a publish no waiter remains for the request, and every in-window waiter has a `module_ready` row (no lost waiter under any commit/publish interleaving) | D4, F9 |
| I-F6 | Forge lock order: `forge_request` rows (ascending `library_key`) before child-owned forge rows; never `child_seq` | D1-D3 controls deadlock |
| I-F7 | no mount of an artefact that is not the published one or whose hash is on `lib-blocklist` | F18 |
| I-F8 | code tiers (T3, Manim) attest egress deny, runner identity none, AST ban list, current CSP (T3) | F17 |
| I-F9 | a late artefact never replaces a mounted module (the Director's mounted lock) | sim: a planted late `module_ready` mid-play must be deferred |
| I-F10 | no T3, image, video, audio or chant build starts with horizon `in_lesson` | a planted in-lesson T3 demand must come out as `next_lesson` |
| I-F11 | quarantine is effective in one transaction: `module_ready` rows gone, hash on the blocklist | F18 |
| I-F12 | no lyric, narration or artefact string enters a `compile()` lane (ids and shapes only) | lint L4 golden case |
| I-F13 | no publish with a model off `allowed_model` or on or after its `allowed_until`; `verify` fails when a deployment in use is within 30 days of `allowed_until` | F12, F13; G2's verify run must flag `taxila-sora` and `taxila-transcribe` today |
| I-F14 | song/chant only for `verbatim_sequence` objectives; every chant line `phonMatch = 1.0`, lang key present, `rights ≠ ncert-pending`; L1-L5 clean | lint golden cases |
| I-F15 | a library build is never charged to a child (`cost_ledger.child_id` is null for `forge.*` jobs); live fills are charged to `child_content` | ledger fixture |
| I-F16 | no name, transcript or memory crosses into a module iframe; `init` carries ids and numbers only (MO R9) | bridge test with a planted free-text field |

---

## 12. Measurements owed (each to `context/measurements.md` with n, method and date)

| id | what | method | bar | decides |
|---|---|---|---|---|
| M-CO1 | ingest → `module_ready` visible, p95, for a near-line T2b | pilot lessons, `module_run.ready_ms` | ≤ need-by in 90% of near-line requests | CO2 reversal; §5.3 |
| M-CO2 | CM4, CM4b, CM4-img by band and week | nightly from `module_run` | CM4-img ≥ 95% after a 2-week seed | CO10, CO11 |
| M-CO3 | review throughput (s/item by class) and SLA hit rate | `review_item.review_sec`, `decided_at − created_at` | ≥ 90% within SLA | CO6, rota size |
| M-CO4 | `forge_ready_for` cost per turn under load | Neon `pg_stat_statements` at 100 concurrent lessons | ≤ 5% of Director DB time | CO3 |
| M-CO5 | the pg16 probe on Neon itself (pooled URL), 3 concurrent sessions | rerun `content-orchestration-pg16-probe.py` against a Neon branch | 0 deadlocks | CO5 |
| M-SONG-5/6/7 | chant vs spoken (SR); ACE-Step v2 (SR); melody over groove: within-child A/B, day-7 shuffled retrieval, n ≥ 30 | SR §11 | melody ≥ groove | S1 adoption |
| M-VID1 | explainer clip vs MP4 completion on lite devices; MP4 bytes per minute with real sprites | 20 lite-tier phones | ≤ 400 kbps | §7.2 rows |

---

## 13. Proposed `context/` entries (via `context/inbox/`)

- **decision `forge-horizons-two-child-scoped`** (CO1) · **`live-fill-is-not-forge`** (CO2) ·
  **`module-ready-turn-poll`** (CO3) · **`forge-lock-order-x29`** (CO5, with the D1-D4 numbers) ·
  **`review-seconds-admitted`** (CO6) · **`video-is-code-after-sora`** (CO7) · **`chant-plus-jingle-v1`** (CO8) ·
  **`demand-ranked-image-prefetch`** (CO10).
- **rejection `azure-first-party-sung-render`** (§8.5) · **`calendar-only-prefetch`** (86% plateau [sim]) ·
  **`sora-for-curriculum`** (supersedes the `taxila-sora` lane; already proposed by VAG).
- **measurement `content-orchestration-pg16-2026-10-02`** (30/30, four G1 defects) · **`image-prefetch-sim-2026-10-02`**
  · **`media-recitation-lint-2026-10-02`** (11/11).
- **flags:**
  - `gpt-4o-transcribe 2025-03-20` retires 2026-10-15: re-pin (D-ASR);
  - name Azure AI Speech in `azure-only-compute` (D-SPEECH). It is an Azure service, already used by AV, VAG and SR,
    but absent from the list I-R8 checks.

## 14. Risks and open questions

- **The owner's "built while she teaches" claim mostly becomes "built for next lesson"** (CO2, CO4). CM4b makes this
  visible rather than implied (MO R13). The live personalisation that *is* reachable is the G1 refill: the child's own
  wrong answers as traps, at their KT target.
- **Review is the binding cost of every medium here** (§10.3). Without a second reviewer, the T3 library grows at
  the rota's pace, not the demand's.
- **The recitation lint's L2/L3 corpora are curated by hand**, so their coverage is unknown [U]. They catch what is on
  the list.
- **ACA dynamic sessions' pricing for custom containers is not itemised on the page read** [V: "billed based on the
  resources consumed by the session pool"]. The $5.2/day idle figure assumes consumption rates [I].

---

## Sources

Primary, fetched 2026-10-02 [V]:
- Microsoft Learn, *Model retirement schedule — Microsoft Foundry* (`updated_at 2026-09-23`):
  https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule
- Microsoft Learn, *Foundry Models lifecycle and support policy* (`updated_at 2026-07-24`):
  https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirements
- Microsoft Learn, *Sora 2 video generation overview (preview)* (`updated_at 2026-06-05`):
  https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
- Microsoft Learn, *Dynamic sessions in Azure Container Apps* (`updated_at 2026-04-14`):
  https://learn.microsoft.com/en-us/azure/container-apps/sessions

Secondary, same day [S]:
- Microsoft Q&A, *Azure AI Foundry Sora 2 retirement date feels too early*:
  https://learn.microsoft.com/en-us/answers/questions/5881436/azure-ai-foundry-sora-2-retirement-date-feels-too
- GitHub, farach/foundryR issue #15 (sora-2 retires 2026-10-15): https://github.com/farach/foundryR/issues/15
- GitHub, ian-t-adams/AI4IA PR #506 (retire Sora 2 cleanly before 2026-10-15): https://github.com/ian-t-adams/AI4IA/pull/506
- Wallace 1994, *JEP:LMC* 20:1471-1485 (melody aids recall only when simple and repeated), cited via SR §1.1.

Internal [repo]:
- `CONDUCTOR.md`; `content-orchestration.sql` (G1 and G2); `factory/multimodal-orchestration.md` and its principal
  review; `factory/video-animation-gen.md` and its review; `factory/asset-pipeline.md`;
- `content/animation-video.md`, `content/songs-rhymes-audio.md` (and its probe JSONs), `content/genui-reliability.md`;
- `learning-science.md` §6 rule 24; `docs/ARCHITECTURE.md` §1.2; `db/migrations/001_core.sql`;
- `context/decisions.md#azure-only-compute`.
