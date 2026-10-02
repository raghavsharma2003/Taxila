# The student workspace: what each child's "little VM" holds, where it lives, and how it lives and dies

**Date:** 2026-10-02 · **Question:** what persistent state and compute does each child need (event log,
learner model, memory, artefact library, notebook and whiteboard history, schedule, preferences), and
should it live as a logical workspace in Postgres + Blob, a real per-student container, or browser-local
storage with sync? Offline support, costs at 10k / 100k / 1M students, a recommendation with data model
and lifecycle.
**Builds on, does not repeat:** `conductor/orchestration-architecture.md` (C2 virtual actor, C3 event log,
C8 shared library, C9 "no VM per student", §3 `student_event`, §7 substrate), `conductor/day-cycle.md`
(§11 tables, §5.5 offline tasks, DC10 overnight prep), `learner/kt-algorithms.md` §5.1 (event-sourced
`kt_evidence`, order-dependent fold), `learner/vibe-temperament.md` §4.10 (modes, `vibe_*` tables),
`safety/dpdp-deep.md` §6 (legal modes M0-M3, NM-1…NM-13) and §7.5 (product erase vs legal hold),
`design/parent-experience.md` §10/§12 (controls, delete flow, visibility), `design/kids-ux-ages.md` §8.3/§8.4
(shared phone, low-end devices), `design/onboarding-flow.md` §10 (pack sizes), `learning-science.md` §6
rules 2, 11, 18, 25, 30, 32, 35, `context/decisions.md` (`hosting-azure-container-apps`, `forge-infra-azure`,
`azure-only-compute`, `infra-segment`).
**Tags:** **[V]** checked this session against the primary source (prices read from the Azure Retail
Prices API `prices.azure.com` and `neon.com/pricing` on 2026-10-02). **[S]** secondary or search summary.
**[U]** a Taxila assumption or estimate that must be measured. Cost model:
`python3 docs/research/conductor/student-workspace-cost.py` (deterministic; every usage input is [U]).
DDL: `docs/research/conductor/student-workspace.sql` (applied cleanly on Postgres 16 after `001_core.sql`, §14 I1).

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| W1 | **The workspace is logical, not a machine.** Per child it is: one directory row, the Conductor actor (`conductor_state` + `student_event` mailbox, already designed), a set of owned Postgres tables keyed by `child_id`, one private Blob prefix, and a device replica. It costs ≈ $0.02-0.04 per student-month at 10k-1M (§4) | Every piece of per-child compute is short and event-driven (§2); a real per-child sandbox, even suspended between sessions, costs ≈ $0.57/student-month more and needs ≈ 10,400 concurrent cores at 1M students against a 500-core default quota (§4) [V prices, U usage] | A feature that needs a per-child process alive *between* events (§3.2, "creations studio"); then that feature, not the workspace, gets a sandbox |
| W2 | **One map, enforced in code.** Every per-child table and blob kind is registered in `WORKSPACE_MAP` (owner, tier, retention, legal modes, consent purpose, exportable, device-synced). A schema test fails if a table with a `child_id` column is missing from the map or lacks `on delete cascade` | Erasure, export, legal-mode downgrade, cell moves and device sync all need the same answer to "what does this child own?". Without one registry each is a hand-maintained list that drifts (the inherited "writers must be called" law, applied to deleters) | Never; the map changes with the schema |
| W3 | **Three temperatures.** Hot = Postgres rows the product reads (state, recent logs). Warm/cold = compressed, per-child-encrypted NDJSON segments in private Blob (Central India) for old turns, evidence and events. Device = a disposable cache + outbox | Hot data is ≈ 5.3 MB/student [U]; archives grow ≈ 0.9 MB/month and cost Cool LRS $0.011/GB-month versus Neon $0.35/GB-month [V], a 32× difference | Neon storage price falls within ~3× of Blob, or KT refits need random access to raw evidence older than 180 days |
| W4 | **Per-child data-encryption key (DEK), wrapped by one Key Vault key.** Free text (transcripts, memory text, notebook ink, creations) is encrypted at the application layer with the child's DEK. Erasure destroys the DEK first | Neon instant-restore history (7 days Launch, 30 days Scale [V]) and Blob soft-delete keep copies after a delete. Crypto-shredding makes the parent-experience target ("purge within 24 h") true for those copies too. Per-child Azure encryption scopes do not scale: they cannot be deleted, are billed for at least 30 days each, and auto-rotation is capped at 10,000 per account [V] | Counsel reads DPDP Rule 8(3) as requiring a one-year legal-hold copy of content (dpdp-deep §7.5 reading (a)). Then add a hold copy under a separate hold key, as that section designs |
| W5 | **The device holds a replica, never the truth.** Android: SQLite via Capacitor; web: SQLite-wasm on OPFS (IndexedDB fallback). One store file per child profile. It holds the day's pack, prefs, the shelf, recent notebook pages and an append-only outbox. No transcripts on the device | Capacitor's guidance: "the OS will reclaim local storage from Web Views if a device is running low on space" [V]. Chromium evicts best-effort origins LRU under pressure [V]. Parents and KT need the server copy anyway. The phone is shared (ASER: 27-38% own one [S]), so a sibling must not be able to read another child's transcripts | A school/offline deployment where devices are single-child and the network is absent for days. Then the device becomes a primary for practice evidence, synced in batches |
| W6 | **Sync is an outbox up and versioned documents down, not a general sync engine.** Up: idempotent ops with ULIDs. Down: 5 small read-model docs by ETag, plus content-addressed packs from the CDN | The client never needs arbitrary rows. It needs a handful of derived docs and a way to post facts. Every structured fact has one writer (orchestration §6), so there is nothing to merge except notebook ink, which is split into single-writer layers (§9) | Offline features grow multi-writer structured data. Then adopt PowerSync Open Edition (self-hosted on ACA, Neon supported, Capacitor SDK over community SQLite [S]) instead of extending the home-grown protocol |
| W7 | **The server re-grades everything the device reports.** Offline practice posts the raw response; the KT writer recomputes the outcome against the kit key and re-folds from the earliest late event | "A model never grades" generalises to "the client never grades authoritatively". BKT is order-dependent (kt-algorithms §5.1), so late evidence must re-fold, not append | Never |
| W8 | **Agents see projections, not the workspace.** Each agent kind has a typed, whitelisted projection (`projectFor(child, 'forge')` etc.). Forge never receives a child's name or transcripts; personalisation is applied at runtime as module init params | Least data per purpose (DPDP purpose limitation, NM-3/NM-7). It also keeps library artefacts free of personal data, so they can be public, cached and reused (C8) | Never for Forge. Other projections widen only with a logged purpose |
| W9 | **Cells, not a database per child.** Children are sharded by `child_id` into Neon projects ("cells") of ~150k students [U], routed by a tiny directory. The same export bundle format moves a child between cells or regions | A database or branch per child fails: Neon Scale allows 1,000 projects and charges $1.50 per extra branch-month [V], which is $1.5M/month at 1M children. Cells keep the per-child unit logical and give a migration path to an India region (dpdp-deep §0 item 11) | One cell sustains 1M students within the Neon 16 CU autoscale ceiling (measure WS-M2), so a single cell is simpler |
| W10 | **Workspace lifecycle is a state machine with erasure as a first-class path.** `provisional → active ⇄ dormant → notice → erasing → erased`, plus `paused`, legal-mode ratchets and an academic-year rollover (§11) | DPDP s.8(7) and s.12(3) [V via dpdp-deep], the self-imposed 12-month inactivity policy (dpdp-deep §7.5), and the parent delete flow (parent-experience §10) all need a defined, testable path | Counsel changes the retention policy; the states stay and the timers change |

---

## 1. What a child's workspace contains (the workspace map)

The owner's "little VM per student" is the right *shape*: a private, persistent, stateful place with its own
clock and memory. The table maps each VM part to what Taxila actually needs. Owners come from
orchestration §6; this document adds tiers, sizes, device policy and the lifecycle hooks.

| VM concept | Taxila workspace part | owner (only writer) | table / blob kind | hot size/child [U] | tier → archive | device copy | legal modes | consent | retention |
|---|---|---|---|---|---|---|---|---|---|
| boot record | directory + workspace row (cell, region, state, legal mode, DEK) | workspace service | `child_directory`, `workspace`, `child_key` | < 1 KB | — | id only | all | P1 | until erased |
| process table / scheduler | Conductor state, wakeups, jobs | Conductor | `conductor_state`, `wakeup`, `job` | < 20 KB | jobs pruned at 30 d | no | all | P1 | live |
| syslog | student event log (boundary facts) | ingest API | `student_event` | ≈ 2.5 MB | 400 d → segments | outbox only | all | P1 | 400 d hot, then folded (orch. §3.2) |
| audit log | decision log (rules fired, commands) | Conductor | `decision_log` | ≈ 0.5 MB | 90 d → segments | no | all | P1 | 1 y (Rule 6(1)(e) logs) |
| shell history | lesson turns (transcripts) | Director | `turn` (text encrypted, W4), `lesson` | ≈ 0.9 MB (30 d) | 30 d → encrypted segments | **never** | all (session use); kept per P2 | P1; parent can delete | until deleted; parent controls |
| registers (RAM) | in-lesson Director state, vibe session state | Director | `lesson.state` (TTL), memory | — | **hard-deleted at close** (NM-4) | in memory only | all | P1 | session |
| learner model | KT ledger and state, misconceptions, ability | KT module | `kt_evidence`, `kt_skill_state`, `kt_misconception`, `kt_ability` | ≈ 1.3 MB | evidence 180 d → segments (refits read segments) | brief-lite only | **M1+** (NM-2 fields); M0: no write path | P2 | until P2 withdrawn |
| long-term memory | cited episodic memories, interests, relationship state | Memory consolidator | `memory` (text encrypted), `child.interests`, `rel_state` | < 100 KB | — | interests only | memory: M1+ with P3; rel_state: M3 only (NM-3) | P3 | until withdrawn |
| user prefs | routine, limits, language, teacher, explicit vibe prefs | parent API / child-said (vibe V1) | `child_routine`, `parent_setting`, `vibe_explicit`, `child` cols | < 10 KB | — | yes (prefs doc) | all | P1 | live |
| crontab | day plans, calendar, school mirror | Conductor / parent | `day_plan`, `calendar_event` | ≈ 0.4 MB (90 d) | 90 d → segments | today + tomorrow | all | P1 | 1 y |
| home directory: notebook | notebook pages and lesson whiteboards (§9) | child layer: device; teacher layer: Director | `notebook_page`, `notebook_op`, blob `nb/` | ≈ 0.1 MB index | ops compacted to blob snapshot at close | last 14 days | all | P1 | until deleted |
| home directory: my games | per-child shelf of library artefacts + skin params (§10) | Director (use) / child (pin) | `artifact_shelf`, `artifact_use` | < 50 KB | — | yes (thumbnails) | all | P1 | until erased |
| home directory: creations | things the child made (drawings, a built game, a teach-back recording only if opted in) | child via API | `child_creation`, blob `cr/` | 0 at launch | — | recent | all | P1 (+ voice-moments opt-in for audio, 30 d auto-delete) | per item |
| downloads | daily packs (§8.3) | Pack builder (night job) | `pack` + CDN objects | manifest only | expire after 3 d | yes | all | P1 | 3 d |
| outbound | homework requests (image deleted after extraction), notifications | Conductor / Notifier | `homework_request`, `notification` | < 50 KB | 90 d | no | all | P1 | 90 d |
| security log | incidents | safety monitor | `incident` | rare | legal-hold eligible | no | all | safety | per protocol |
| backups | export bundle (§12) | export job | blob `ex/` | 0 | expires 7 d | — | all | parent right s.11 | 7 d |

**Never in the workspace, in any tier:** raw audio (ARCHITECTURE §1.7, rule 35, NM-12), voiceprints,
inferred emotions or personality, format-preference posteriors in M1, engagement predictions, free-text
"about the child" notes (NM-3, learning-science §8.6). The schema test from NM-3 is extended to the blob
kinds: `WORKSPACE_MAP` has no kind that could hold them.

### 1.1 The registry, in code

```ts
// shared/workspace/map.ts — the single answer to "what does a child own?"
export type LegalMode = 'M0' | 'M1' | 'M2' | 'M3';
export type Purpose = 'P1_tutoring' | 'P2_academic_record' | 'P3_memory' | 'P4_research' | 'P5_format' | 'safety';
export type Tier = 'hot' | 'segment' | 'blob' | 'ephemeral';
export interface WorkspaceEntry {
  key: string;                             // 'turn', 'kt_evidence', 'blob:nb', …
  store: { kind: 'table'; table: string } | { kind: 'blob'; prefix: 'nb' | 'cr' | 'seg' | 'ex' | 'pk' };
  owner: 'conductor' | 'director' | 'kt' | 'memory' | 'parent_api' | 'device' | 'forge' | 'safety' | 'workspace';
  purpose: Purpose; modes: LegalMode[];    // NM-1: no write path outside these modes
  tier: Tier; hotDays?: number;            // rows older than hotDays move to segments
  encrypted: boolean;                      // app-level, child DEK (W4)
  device: 'none' | 'doc' | 'outbox' | 'cache';
  export: 'raw' | 'readable' | 'both' | 'none';
  erase: 'cascade' | 'prefix' | 'legal_hold_eligible';
  parentVisible: boolean;                  // parent-experience §12 decides the age split at read time
}
export const WORKSPACE_MAP: readonly WorkspaceEntry[] = [ /* one entry per row of the §1 table */ ];
```

Three tests use it (§14): the schema test (every `child_id` table is mapped and cascades), the legal-mode
test (the writer for each entry refuses modes outside `modes`), and the erase test (after `erase(child)`,
every mapped table returns 0 rows and every mapped prefix lists empty).

---

## 2. What compute each child needs

| work | trigger | where | duration | per-child state while running | long-lived per child? |
|---|---|---|---|---|---|
| Director turn step | each child turn | ACA web app (`taxila-web`) | < 1 s off the critical path (ARCHITECTURE §1.2) | lesson row + brief in memory | no |
| live voice | lesson | browser ↔ Azure realtime directly (WebRTC) | the lesson | none server-side | no |
| Conductor step | any event, wakeup | ACA web or worker | < 2 s p95 (orch. §11) | lease on `conductor_state` | no (virtual actor) |
| KT update / refold | evidence; late offline evidence (W7) | API route / `kt.refold` job | ms to tens of ms (kt §5.1 [U]) | row lock | no |
| memory consolidation | `lesson.ended` | fast lane job | seconds | — | no |
| nightly prep: plan, brief, **pack build**, segment archiving | `night` wakeup | ACA job | ≈ 3 vCPU-s [U] | — | no |
| Forge build / image / video | library miss | ACA Sandboxes / jobs, **per job** | minutes | none (library-level, C8) | no |
| export / erase / cell move | parent action, lifecycle | slow lane job | minutes | workspace lock | no |
| on-device: engines, offline practice, notebook, local key check | always | the phone | — | the replica | the device is the only "always there" compute, and it is free |

Nothing on this list needs a process that outlives its event. That is the empirical core of W1: the child is
idle more than 95% of the day (orchestration §13), and when active, the expensive compute (the realtime
model) is not ours to host.

---

## 3. The options

### 3.1 A: logical workspace (Postgres rows + private Blob prefix + device replica) — **recommended**
Described in §5 onwards. Strengths: cheapest; one source of truth; cross-child reads (parent dashboard,
KT refits, Forge library, safety review, analytics) are plain SQL; erasure and export are enumerable
through the map; the actor model already exists. Weakness: "isolation" is logical (row ownership plus app
checks), so the API edge must enforce `child_id` scoping on every call (§7, invariant I6).

### 3.2 B: a real per-student container
Two Azure products are candidates, and the task framing needs one correction.
- **ACA dynamic sessions have no persistent storage.** Sessions are "ephemeral and isolated, designed for
  short-lived tasks", destroyed after a cooldown, Hyper-V isolated, and the comparison table lists
  persistent storage as "Not available" [V]. Code-interpreter sessions cost $0.03 per session-hour [V]
  billed in one-hour increments [V]; custom-container pools are billed as Dedicated E16 nodes [V]. A
  "dynamic session with a persistent volume" does not exist; a session per child would rehydrate from
  Postgres/Blob on every start, which is option A with an extra hop.
- **ACA Sandboxes** are the stateful product: sub-second start from prewarmed pools, suspend/resume with
  memory + disk snapshots, Blob or Data Disk volumes, egress policies, auto-suspend on idle and auto-delete
  N days after stop [V]. Tiers start at XS (0.25 vCPU, 0.5 GB, 20 GB disk) [V]. Billing is per core-second
  and GiB-second while running, plus storage "per GB stored" for images, snapshots and volumes at Premium
  Blob ZRS rates, a meter marked "coming soon" [V]. Premium ZRS is $0.279/GB-month in Central India and
  $0.200 in eastus2 [V]. Typical quota is **500 concurrent active cores per organization** and 3,000 API
  requests/minute [V]. Access requires Entra ID and a data-plane role [V], so children never touch a
  sandbox directly; a backend broker would front every call.

Per-child sandbox, suspended between sessions (XS, 25-min sessions plus a 5-minute idle tail, 1 GB
snapshot): ≈ $0.27 compute + ≈ $0.28 snapshot storage per child-month **on top of** option A, because
Postgres is still needed for every cross-child read. Peak concurrency at 1M students is ≈ 42k sandboxes
(10,400 cores) [U], 21× the default quota. Always-on is ≈ $20/child-month, matching orchestration §13's
$15-20. It adds a cold path (resume, sub-second [V]) to every lesson start and a second copy of the truth
that can drift from Postgres. **Rejected as the workspace.** Kept for one future feature: a "creations
studio" for Classes 6-9, where the child builds a game or program over several sessions. Even there, the
project files' truth lives in Blob `cr/`, the sandbox is disk-mode suspended, auto-deleted 14 days after
stop, egress-denied, and rebuildable from Blob, so it is never a store.

### 3.3 C: browser-local (IndexedDB/OPFS) + sync, device as primary
Near-zero server storage. It fails five requirements: (1) the parent reads on a different device (parent
corner, WhatsApp report); (2) KT refits and the Forge library need population data; (3) DPDP access,
correction and erasure must be served by the fiduciary, including data on a lost phone; (4) web storage is
evictable: Chromium evicts best-effort origins LRU under storage pressure, `persist()` is granted silently
from engagement heuristics [V], Safari deletes script-written data after 7 days without interaction [V],
and Capacitor warns the OS reclaims WebView storage when space is low [V]; (5) shared phones make the
device a privacy boundary between siblings that it cannot enforce. Kept as the **replica** half of A (W5).

### 3.4 D: a database (Neon project or branch) per child
Neon's "database per tenant" fits B2B tenants, not children: Scale allows 1,000 projects (raisable on
request) and charges $1.50 per extra branch-month [V]. At 1M children that is ≈ $1.5M/month for branches
alone, and cross-child queries become fan-outs. Rejected; cells (W9) take the useful part, which is
sharding by `child_id`.

### 3.5 Scorecard

| criterion | A logical | B sandbox/child | C local-primary | D DB/child |
|---|---|---|---|---|
| cost per student-month at 1M (workspace only) | **≈ $0.016** | ≈ $0.57 (+A) | ≈ $0.009 | ≈ $1.5 + A |
| parent / cross-child reads | SQL | via A | impossible | fan-out |
| erasure provable | map + DEK | snapshots + A | only if the device returns | per DB |
| offline practice | replica (W5) | no (needs network) | yes | no |
| lesson-start latency added | 1 round trip (§13.2) | + resume | 0 | 1 round trip |
| quota risk | Neon CU ceiling per cell | 500 cores default | none | 1,000 projects |
| Azure-only directive | yes (Neon allowed) | yes | yes | yes |

---

## 4. Costs at 10k / 100k / 1M students

Output of `student-workspace-cost.py` (workspace only: state, storage, sync, CDN delivery of packs and
library artefacts, nightly builds, key operations; excludes live voice, LLM calls, Forge generation).

| students | A: logical workspace /mo | A per student | B: sandbox per child (suspended) /mo | B per student | B peak cores (default quota 500) | B always-on per student | C: local only /mo |
|---|---|---|---|---|---|---|---|
| 10,000 | $373 | $0.04 | $5,863 | $0.59 | 104 | $20 | $144 |
| 100,000 | $1,955 | $0.02 | $56,855 | $0.57 | 1,042 | $20 | $1,125 |
| 1,000,000 | $16,435 | $0.02 | $565,435 | $0.57 | 10,417 | $20 | $8,625 |

Option A breakdown: at 10k, Neon $195 (one cell, 792 CU-h), CDN $149, API+night $23, Blob $5; at 1M,
CDN $9,105 (≈ 100 TB/month of packs and artefacts), Neon $4,439 (7 cells, 11,360 CU-h, 5.3 TB hot),
API+night $2,280, Blob $491, Key Vault $120.

Reading the table:
- **The workspace is cheap; delivery is the line to watch.** At 1M, CDN egress is 55% of A, and it scales
  with pack size. That is the second reason packs are content-addressed and shared across children (§8.3):
  the CDN caches one copy of the shared parts.
- **Against revenue:** ₹299 ≈ $3.1/month (orchestration §9.1 [S]). A is ≈ 0.5-1.3% of that; B is ≈ 18%
  before any AI spend, for no learning gain.
- **Sensitivities [U]:** doubling hot bytes adds ≈ $1.9k/month at 1M; a CU sustaining 200 rather than 800
  statements/s adds ≈ $4.2k/month; packs at 6 MB rather than 3 MB add ≈ $4.4k/month. None changes the ranking.
- Prices [V] are list prices; grant credits change who pays, not the ranking.

---

## 5. The recommended architecture

```
   device (shared Android phone / web)                          Azure (eastus2 today; Central India later)
 ┌──────────────────────────────────────┐   ops (outbox)    ┌─────────────────────────────────────────────┐
 │ LocalStore per child profile          │ ───────────────► │ /api/ws/sync  (ACA taxila-web)               │
 │  ws_<childId>.db  (SQLite / OPFS)     │                  │  ├ ingest → student_event (idempotent)        │
 │   outbox · prefs · plan · brief-lite  │ ◄─────────────── │  ├ KT writer (re-grade, refold)  → kt_*       │
 │   shelf · notebook (14 d) · pack refs │   docs by ETag   │  ├ notebook ops → notebook_op                 │
 │ Engines (in APK) · offline practice   │                  │  └ docs: brief-lite, plan, prefs, shelf, nb   │
 └──────────────┬───────────────────────┘                  │ Conductor actor (orch. §4) · night pack build │
                │ packs (content-addressed)                 │ Projections (§7) → Director, Planner, Forge… │
                ▼                                           └───────┬──────────────────────┬──────────────┘
      Front Door ── library + shared pack objects                  │                      │
      (public, no personal data, immutable)                         ▼                      ▼
                                                    Neon cell k (Singapore today)   Blob `taxilaws` (private,
                                                    child_directory → cell          Central India): seg/ nb/
                                                    hot tables (map §1)             cr/ ex/ per-child prefix,
                                                                                    DEK-encrypted
```

---

## 6. Data model (new tables; owned tables elsewhere are referenced, not redefined)

The full DDL is in the sibling file `docs/research/conductor/student-workspace.sql` (draft, not applied),
so it can be lifted straight into `db/migrations/`. The tables, in one line each:

| table | holds | key design point |
|---|---|---|
| `child_directory` | child → cell, region, routing state | global and tiny; no personal data; survives erasure as a tombstone |
| `workspace` | lifecycle state, `legal_mode` (NM-1), academic year, byte counters, quotas | one row per child; the lifecycle machine (§11) writes it |
| `child_key` | the child's DEK wrapped by the Key Vault KEK | deleting the row is the crypto-shred (W4) |
| `workspace_object` | index of every private blob (segments, notebook snapshots, creations, exports, voice moments) | answers "what exists?" without listing Blob; `expires_at` for exports (7 d) and voice moments (30 d) |
| `archive_segment` | which hot rows moved to which encrypted NDJSON segment | KT refits and exports read segments; hot tables stay small (W3) |
| `notebook_page`, `notebook_op` | pages and per-layer ops, primary key `(child, page, writer, writer_seq)` | single writer per layer (§9); replays are idempotent |
| `artifact_shelf`, `artifact_use` | the child's "my games": library artefact + runtime skin, pin, use count, module outcome | operational facts only, no engagement model (§10) |
| `child_creation` | things the child made, pointing at encrypted blobs | quota-limited; private SAS only |
| `device`, `device_child` | paired replicas, clock offset, last acked op, served ETags, wipe flag | a device is a revocable replica bound to a guardian, never identity |
| `pack` | per-child pack manifests by date and version | shared parts are content-addressed CDN objects (§8.3) |
| `workspace_lifecycle` | every state transition, content-free | no FK, so it survives as the erasure receipt |
| `data_request` | export, erase-child, erase-lesson, erase-transcripts, reset-profile, correct | receipt holds counts per map entry, never content |

Changes to existing tables: `turn.text` and `memory.text` become `bytea` encrypted with the child DEK (W4),
with a plaintext `lang` column kept for analytics-free filtering; `lesson.state` is truncated to NM-2 fields
at close (NM-4). `day_event` (day-cycle.sql) folds into `student_event` types so a child has one event log
(§16).

---

## 7. The workspace API and agent projections

```ts
// shared/workspace/api.ts
export type AgentKind = 'director' | 'planner' | 'forge' | 'report' | 'memory' | 'homework' | 'safety' | 'parent' | 'device';
export interface WorkspaceHandle { childId: string; cell: number; legalMode: LegalMode; state: WorkspaceState; consent: Record<Purpose, boolean> }
export type WorkspaceState = 'provisional' | 'active' | 'dormant' | 'notice' | 'paused' | 'erasing' | 'erased';

/** One round trip to the cell: a SQL function returns the whole open bundle (§13.2). */
export function openWorkspace(childId: string, as: AgentKind): Promise<WorkspaceHandle>;
/** Typed, whitelisted read model per agent. Unknown keys are a compile error; extra keys at runtime throw. */
export function projectFor<K extends AgentKind>(h: WorkspaceHandle, k: K): Promise<Projection[K]>;

export interface Projection {
  director: { brief: ChildBrief; slot: PlannedSlotRef; shelf: ShelfItem[]; recentPages: PageRef[]; prefs: PrefsDoc };
  planner:  { brief: ChildBrief; due: DueReview[]; school: SchoolMirror; limits: Limits; digests: LessonOutcomeDigest[] };
  forge:    { objectiveId: string; engine: string; band: 'B1'|'B2'|'B3'|'B4'; language: 'hi'|'en'|'hinglish';
              interestContext?: InterestTag; skinSchema: 'name_token' };   // never a name, never a transcript
  report:   { ledgerFacts: LedgerFact[]; week: LessonOutcomeDigest[]; minutes: number };  // engine/talk split
  memory:   { lessonId: string; turns: DecryptedTurn[] } | { refused: 'no_P3' };       // P3-gated at read
  homework: { photoRef: EphemeralRef; kitIndex: KitIndexRef };
  safety:   { turns: DecryptedTurn[] };
  parent:   ParentView;                                    // parent-experience §12 age split applied here
  device:   DeviceDocs;                                    // §8.2
}
export interface ShelfItem { artifactId: string; url: string; skin: Record<string, string | number>; pinned: boolean }
```

Rules: (1) every route resolves `child_id` from the authenticated guardian session plus the picked
profile, never from a request body field alone; (2) the writer for each map entry checks `legal_mode` and
consent at write time (NM-1), and jobs re-check at claim time (orchestration §5.5); (3) `DecryptedTurn`
exists only inside projections that need text; the DEK is unwrapped once per open and cached in process
for 10 minutes (≈ $0.03 per 10k unwraps [V]).

---

## 8. Device replica, offline support and sync

### 8.1 What works offline

| works offline | needs network | never on device |
|---|---|---|
| practice and revision items from the pack (tap or spoken-with-local-tap fallback), with feedback against the pack's kit keys; engines (compiled into the APK) with pack params; cached narration clips; the notebook; offline tasks ("ho gaya" taps and photos queued); the shelf (cached library games); the day plan view | live voice lesson; homework photo help (queued until online); new generation; parent corner; reports | transcripts; memory text; other children's data; DEKs |

This matches kids-ux §8.4 (Read Along's 1 GB-RAM offline bar [V there]) and lesson-arc §11 (stall > 8 s →
cached offline card). Offline is a degraded mode of practice, not of teaching.

### 8.2 Down: five documents, ETag-versioned

`brief-lite` (skills to practise, due items, display states; no mastery numbers the child could game),
`plan` (today and tomorrow), `prefs` (language, script, teacher, limits, allowed hours), `shelf`,
`notebook-index` (pages of the last 14 days). Each is ≤ 30 KB, gzip, served by the API with the child's
auth, `If-None-Match` → 304. The device never receives rows, only these documents.

### 8.3 Packs: content-addressed, mostly shared

```ts
export interface PackManifest {
  packId: string; childId: string; forDate: string; version: number; expiresAt: string;
  shared: Array<{ hash: string; url: string; bytes: number; kind: 'items' | 'engine_params' | 'narration' | 'image' | 'module' }>;
  personal: { url: string; bytes: number };     // API-served, auth'd: name token, interest contexts, plan slot ids
  budgetBytes: number;                          // ≤ 3 MB/day default [U]; ≤ 1 MB on "data saver"
}
```

Shared objects (item sets per skill and level, narration per item and voice, images, library modules) are
immutable, keyed by content hash, public on Front Door with long cache lifetimes, and identical across all
children practising that skill. Only the `personal` part, typically < 50 KB [U], is per child. Built in the
nightly job (day-cycle §9, DC10), downloaded on Wi-Fi or at first open, expired after 3 days.

### 8.4 Up: the outbox

```ts
export type WorkspaceOp =
  | { k: 'event'; ev: EventEnvelope }                                         // orchestration §3.1, idemKey set
  | { k: 'attempt'; itemKey: string; response: string | number | string[]; hints: number;
      localOutcome?: 'C0'|'C1'|'W'|'M'; packId: string }                      // W7: server re-grades
  | { k: 'nb'; pageId: string; layer: 'child'; writerSeq: number; op: NotebookOp }
  | { k: 'pref'; key: 'language'|'script'|'jokes_less'|'speak_slower'; value: string; said: string }   // vibe V1
  | { k: 'shelf'; artifactId: string; pin: boolean }
  | { k: 'creation'; id: string; kind: 'drawing'|'photo'; uploadUrlRequested: true };
export interface OutboxEntry { opId: string /* ULID */; childId: string; deviceId: string; deviceSeq: number;
  occurredAt: string; bootId: string; monoMs: number; op: WorkspaceOp; tries: number }
export interface SyncRequest { deviceId: string; childId: string; clientTime: string; ops: OutboxEntry[]; docs: Record<string, string> }
export interface SyncResponse { serverTime: string; acked: string[]; rejected: Array<{ opId: string; why: string }>;
  docs: Record<string, { etag: string; body: unknown } | 'not_modified'>; packs: PackManifest[];
  nb: Array<{ pageId: string; ops: NotebookOpEnvelope[] }>; wipe?: true }
```

`POST /api/ws/sync` takes ≤ 200 ops per call; the server applies each op idempotently
(`student_event.unique(child_id, idem_key)`, `notebook_op` primary key, `attempt` idemKey = opId) in one
transaction per batch, then returns acks. The device deletes an op only after its ack. A rejected op (schema,
revoked consent, wrong legal mode) is dropped with a parent-visible count, never retried forever.

### 8.5 Late evidence, clocks and order

- **Order.** Offline attempts arrive hours late. KT folds by `(occurred_at, seq)` (kt §5.1), so the KT
  writer finds the earliest late `occurred_at` and enqueues `kt.refold{child, fromTs}`; display states are
  recomputed from there. Refold is milliseconds per child [U, WS-M6].
- **Clocks.** Each handshake measures `clock_offset_ms = serverTime − clientTime` (half the round trip is
  ignored at this precision). `occurred_at` is corrected by the offset, then clamped to
  `[device.last_sync_at − 72 h, received_at]`. Within a boot, `monoMs` orders ops even if the user changes
  the wall clock. This is the "skew device clocks ±2 h" fault in orchestration §12.4.
- **Mastery from offline practice.** Offline attempts count as independent attempts (rule 2a) once
  re-graded. They cannot by themselves create "mastered", which needs a delayed success in a later session
  (rule 2c, kt invariant 8), and they carry no generative probe. That keeps offline drilling from inflating
  mastery.

### 8.6 Device sync state machine

```
 unpaired ──pair (guardian login + OTP)──► paired ──profile picked──► open(child)
   ▲                                          ▲                         │  online & outbox empty → synced
   │ wipe done                                │ profile switch:         │  op appended          → dirty
 wiping ◄── revoked / child erased ◄──────────┤ flush or seal outbox,   │  offline              → dirty_offline
   (on next contact: delete ws_<child>.db,    │ close store, open next  │  ack all              → synced
    keep nothing; server sees wipe ack)       └─────────────────────────┘
```

- **Shared phone.** One store file per child (`ws_<childId>.db`), opened only after the profile picker
  (kids-ux S1). Store files are encrypted (SQLCipher in the community SQLite plugin [S]; key in Android
  Keystore [U: verify the plugin]); on web, OPFS files with a key held in memory for the open profile. A
  sibling opening their own profile cannot read another child's file through the app.
- **Eviction.** On web, call `navigator.storage.persist()` after the first lesson (Chromium grants it
  silently by engagement [V]). Treat a missing store as a fresh replica: re-download docs and today's pack.
  Only un-acked outbox ops can be lost; the parent area shows "N answers saved on this phone, not yet
  sent" when the outbox is older than 24 h [U].
- **Two devices, one child.** One open live lesson per child is enforced server-side (kt §5.1). Offline
  practice on two devices is safe because ops are append-only facts; notebook layers merge (§9).

---

## 9. Notebook and whiteboard history

A page is a stack of layers, and **each layer has exactly one writer**, so no CRDT is needed:
- `teacher` layer: written by the Director from its `moduleCommands`/`ui.whiteboard` anchors (ARCHITECTURE
  §1.2, §1.5). It is reconstructible from the lesson's commands, so storing it is a convenience for replay.
- `child` layer: ink strokes, taps, typed working, written by the device. Strokes are whole objects with ULIDs;
  ops are `add`/`erase`/`move` of stroke ids. Merging two devices' child ops is a set union ordered by
  `(writer, writer_seq)`, with erase winning over add for the same stroke id.

```ts
export type NotebookOp =
  | { t: 'stroke.add'; id: string; pts: Int16Array /* quantised x,y,pressure deltas */; color: number; w: number }
  | { t: 'stroke.erase'; id: string }
  | { t: 'text.add'; id: string; text: string; at: [number, number] }        // child typed working
  | { t: 'anchor'; id: string; kind: 'number'|'word'|'diagram'|'module_snapshot'; ref: string }   // teacher layer
  | { t: 'page.title'; title: string };
```

At lesson close (or after 500 ops), a compaction job folds a page's ops into a snapshot object (encrypted
NDJSON of the surviving strokes plus an SVG render for the parent view), stores it in `nb/`, and deletes the
compacted ops. Size ≈ 30 KB per lesson page after compression [U]. History is per page, not per stroke,
beyond 14 days: "show me what I did in fractions last month" replays the snapshot. Yjs (updates are
commutative, associative and idempotent; `mergeUpdates` compacts without loading but does not garbage-
collect deletes [V]) is the reversal if real multi-writer editing appears (e.g. a parent and child drawing
together live). tldraw is out for licence reasons: production needs a paid licence key [V]. A small in-house
ink layer on canvas is enough for the stroke model above.

Use in teaching: the Director may pull a past page as an anchor ("yaad hai, yeh tumne banaya tha"), which
is a memory callback grounded in an artefact rather than a stored opinion about the child. Worked steps the
child wrote are **not** evidence until a probe classifies them against a key (rule 11).

---

## 10. The artefact library and the per-child shelf

- **Library-level artefacts carry no personal data.** Forge builds, images and videos are keyed by
  (objective, engine, spec hash, model version) (C8) and published under `lib/<artifactId>/<contentHash>/`
  on the public Forge account behind Front Door. **Correction to `forge-infra-azure`:** its path
  `forge/<childId?>/<artifactId>/index.html` puts a child id in a public URL, and a "personalised" build
  could bake a name into a public file. Instead, personal content enters only at runtime: ModuleHost sends
  `init{ skin: { name: 'Aarav', context: 'cricket', lang: 'hinglish' } }` over postMessage, and the
  artefact's text uses tokens. The Forge projection (§7) never contains the name, so a public file cannot.
- **The shelf** (`artifact_shelf`) is the child's "my games" view: every artefact used in their lessons,
  with its skin, pin state and use count. Re-use is the point: a game built for fractions on Tuesday is the
  revision game on Friday (rule 18) at zero generation cost.
- **Use counts are operational facts, not engagement models.** In M1, NM-3 bans engagement predictions,
  so `uses` and `artifact_use.outcome` may drive "don't repeat the same game twice in a row" and the parent's
  "what she played" list, and nothing else. A pin is an explicit choice, the allowed "revealed preference
  when offered" (learning-science §8.5).
- **Child creations** (`child_creation`) are private, DEK-encrypted in `cr/`, served by short-lived user
  delegation SAS minted by the API, and counted against a quota (50 MB default [U]).

---

## 11. Lifecycle

### 11.1 Workspace state machine

```
 (guardian signs up, declares child age; NM-13: nothing about the child is processed before VPC)
        │ VPC verified + P1 consent
        ▼
  provisional ──first lesson.started──► active ◄──────────── app.opened / lesson ───────────┐
        │ (no lesson in 30 d: drop)           │ no session for 30 d                           │
        ▼                                     ▼                                               │
     erasing ◄── parent "delete child" ── dormant ── 12 months inactive ──► notice ──48 h, no reply──► erasing ──► erased
        ▲                         (packs stop; devices told to drop      (email + WhatsApp to the parent,      (tombstone in
        │                          caches; weekly report continues,       dpdp-deep §7.5 self-imposed policy)    directory +
        │                          zero-lesson week still sends PX7)      reply or any open → active            lifecycle receipt)
        └──────────────────────── parent delete from any state ──────────────────────────────┘
  orthogonal: paused (parent.pause, orchestration §4.2) · safety_hold (Conductor phase, never auto-exits)
```

| transition | side effects (one job, idempotent, each step logged in `workspace_lifecycle`) |
|---|---|
| → provisional | create `workspace`, `child_key` (new DEK), `conductor_state`, directory row; legal mode from consent scope |
| → active | first night job schedules packs; device docs served |
| → dormant | stop nightly pack builds and Forge prefetch; `wipe` docs and packs on devices (not the outbox); archive all hot logs older than 7 days to segments early |
| → notice | send a notice that names what will be erased and how to keep it (one tap or a reply); this is not a "come back" nudge and carries no learning content (orchestration §4.2 invariant) |
| → erasing / erased | §12.2 |
| legal mode M1 → M0 (P2 withdrawn) | erase every map entry whose `modes` excludes M0 (KT ledger, misconceptions, format trials); keep P1 data; `audit` row; ratchet down only (NM-1) |
| P3 (memory) withdrawn | erase `memory`, cancel `memory.*` jobs, re-derive the brief without memories |
| parent deletes a lesson / transcripts | delete `turn` rows and matching segments for that scope; recompute nothing in KT (evidence rows reference turns with `on delete set null`) |
| reset learning profile | erase `kt_*` and `format_trial`; re-run the placement diagnostic on next open (rule 28) |

### 11.2 Device lifecycle
Paired by a guardian login, bound to the guardian, revocable from the parent corner ("this phone is
lost"). A revoked device gets `wipe` on next contact. If it never returns, its store is encrypted and holds
no transcripts, so the exposure is the pack, prefs and the last 14 days of notebook pages for the children
it had opened [U: accept or shorten].

### 11.3 Academic-year rollover (CBSE year starts in April; other boards vary [U per board])
A `rollover` wakeup per child at the board's year start (or when the parent confirms promotion):
`class_level += 1`; `academic_year` updates; the school mirror is reset (new timetable, empty test windows);
last year's notebook pages and plans are archived to segments; the KT ledger is **kept** (the skill graph
spans grades, learning-science §8.3), and a short re-placement probe runs in the first week (rule 28). The
parent's weekly report says "Class 5 → Class 6" once. Board or school change follows the same path without
the class increment.

---

## 12. Export, erasure and keys

### 12.1 Export bundle (DPDP s.11 access; also the cell-move and region-move format)

```ts
export interface WorkspaceBundle {
  format: 'taxila-workspace/1'; childId: string; exportedAt: string; legalMode: LegalMode; mapVersion: string;
  entries: Array<{ key: string; rows?: number; file: string; sha256: string }>;   // one per WORKSPACE_MAP entry
  readable: { reportPdf: string; transcriptsHtml?: string; notebookSvgs: string[] };   // parent-experience §10 "PDF + JSON"
}
```

Raw parts are NDJSON per table plus decrypted blobs; readable parts are a PDF summary, transcripts as
HTML (Hindi and English as spoken) and notebook pages as SVG. The bundle is written to `ex/`, encrypted
with a per-link key, and offered by a 24-hour SAS link inside the parent corner (not emailed as an
attachment). The same writer with `raw` only, plus an importer that verifies every `sha256`, moves a child
between cells (W9). An import → export round trip must produce identical hashes (invariant I9).

### 12.2 Erasure (product erase), in order

1. `workspace.state = 'erasing'`; directory state flips so routing refuses new sessions; queued jobs for the
   child are cancelled; devices get `wipe`.
2. **Delete `child_key`.** From this moment every encrypted column, segment, snapshot and creation,
   including copies in Neon history and Blob soft-delete, is unreadable.
3. `delete from child where id = $1` cascades every mapped table (I1).
4. Blob prefix delete for `c/<cell>/<childId>/` (batched, retried until the listing is empty).
5. Directory row becomes a tombstone (`state = 'erased'`, guardian id nulled); `workspace_lifecycle` keeps a
   content-free receipt (counts per map entry), shown to the parent (parent-experience §10).
6. Plaintext remnants: non-encrypted structured rows (skill ids, timestamps) survive in Neon's
   instant-restore history until it rolls over (≤ 7 days Launch, ≤ 30 days Scale [V]). The notice says so.

Revocation is synchronous (steps 1-2, seconds); physical purge is asynchronous and retried (steps 3-5,
target < 24 h, parent-experience §10). The legal-hold remainder (dpdp-deep §7.5, if counsel requires it) is
a separate store under a separate hold key with no product read path; the default is that only processing
logs (ids, actions, timestamps; no content) are retained for one year.

### 12.3 Keys
One Key Vault key (`taxila-ws-kek`) wraps all DEKs. Rotation re-wraps the DEKs (cheap: one op per child)
and never re-encrypts data. Unwraps are cached per process for 10 minutes; at 1M children this is about
$120/month (§4). Ops never see plaintext: telemetry carries ids and rule codes only (orchestration §11).

---

## 13. Scale, cells and latency

### 13.1 Cells
- 10k and 100k: one Neon cell. 1M: about 7 cells at 150k each [U], set by WS-M2 (statements/s per CU for
  this workload) and the 16 CU autoscale ceiling per compute [V].
- Every per-child table leads with `child_id`, so a cell holds complete workspaces. Cross-cell work
  (KT refits, Forge library stats, ops dashboards) reads de-identified extracts (dpdp-deep §7.10, research
  store separate, never joined back), not live cells.
- The library (`forge_artifact`, `asset_cache`, kits) is global and read-mostly; replicate it to each cell
  or keep it in cell 0 and cache it in the app (it changes by promotion, not per request).

### 13.2 Latency
The app runs in eastus2 and Neon in Singapore, about 200 ms per round trip (`hosting-azure-container-apps`).
So `openWorkspace` is one SQL function call returning the whole open bundle as jsonb (state, prefs, brief
inputs, shelf, pack manifest), and the per-turn path writes in one batched statement. The workspace design
adds no round trips to the live voice path (WebRTC goes straight to Azure). The region decision itself (Neon
US East vs an India app region) stays with `hosting-azure-container-apps`; the bundle format makes either
move a data copy, not a redesign.

---

## 14. Invariants (gated in `npm test`; "if your change trips them, your change is wrong")

1. **I1** Every table with a `child_id` column has an FK to `child(id) on delete cascade` or is listed
   in `WORKSPACE_MAP` with `erase: 'legal_hold_eligible'` (introspects `information_schema`). Checked
   2026-10-02 by applying `001_core.sql` + `student-workspace.sql` to a scratch Postgres 16 (n=1 run): the
   DDL applies, a child delete leaves 0 rows in the workspace tables, a replayed `notebook_op` is a no-op, and
   the probe query flags exactly four tables: `child_directory`, `workspace_lifecycle`, `data_request`
   (intended receipts, no FK by design) and **`consent`** (001_core: `child_id` has no FK). Consent rows are
   proof of consent, so they belong in the map as `legal_hold_eligible` with an explicit erase rule, not as
   an accident of the schema.
2. **I2** Every such table and every blob prefix appears in `WORKSPACE_MAP`, and every map entry exists.
3. **I3** No column or blob kind can hold NM-3 data (name and type lint, extending the NM-3 test).
4. **I4** No public URL or library artefact contains a child id or a child's name: the Forge publish step
   asserts its projection had no name, and a lint scans `lib/` for UUIDs that resolve in the directory.
5. **I5** No device op writes mastery: `attempt.localOutcome` never reaches `kt_*`; the server outcome is
   recomputed from the kit key (a fixture with a forged `localOutcome: 'C0'` must not move pL).
6. **I6** `projectFor(h, k)` returns exactly the whitelisted keys; the Forge projection has no string field
   that equals the child's first name for 1,000 random fixtures.
7. **I7** After `erase(child)`: 0 rows in every mapped table, empty blob prefix, no `child_key`, a tombstone
   directory row, and a receipt whose counts match the pre-erase counts.
8. **I8** Replaying any sync batch twice changes nothing (rows, ETags, KT state).
9. **I9** `import(export(ws))` gives byte-identical bundle hashes.
10. **I10** `legal_mode` only ratchets down without an `audit` row and a consent change; a write to an entry
    whose `modes` excludes the current mode throws.
11. **I11** `lesson.state` after close contains only NM-2 fields.
12. **I12** No device store file contains `turn` text (scan the replica in the e2e test).

---

## 15. Measurements (log each with n, method and date in `context/measurements.md`)

| id | measure | why | method |
|---|---|---|---|
| WS-M1 | hot bytes and write MB per student-month, by band | W3, §4 (model assumes 5.3 MB hot, 1.4 MB/month writes) | `pg_total_relation_size` per table ÷ active children, staging + first cohort |
| WS-M2 | sustained statements/s per Neon CU for the Director turn mix | cells per 1M (W9), Neon cost | load test: synthetic lessons at 4 turns/min |
| WS-M3 | `openWorkspace` p50/p95 from ACA eastus2 to Neon Singapore | §13.2; region decision | prod traces |
| WS-M4 | replica loss rate (store missing at open) on Android Capacitor and web, by device RAM/storage | W5 | client telemetry: count only, no ids beyond child id |
| WS-M5 | pack bytes/day and download success on 2-3 GB phones on 4G and 3G-class links | §8.3, CDN cost | field test, n ≥ 20 devices |
| WS-M6 | share of evidence arriving > 1 h late, and refold time | W7 | KT writer logs |
| WS-M7 | erasure: revocation latency and purge completion time | §12.2 target < 24 h | monthly drill on synthetic children |
| WS-M8 | export bundle size and build time | §12.1 | per request |
| WS-M9 | (only if the creations studio ships) sandbox resume time, snapshot GB, cost per active child | §3.2 | pilot |

---

## 16. Conflicts with other docs, and corrections

1. **Two per-child event logs.** day-cycle.sql's `day_event` and orchestration's `student_event` overlap.
   Proposal: `student_event` is the only per-child log; day-cycle's event kinds become `StudentEvent`
   variants; `notification_log` stays as the Notifier's own table.
2. **Public child paths.** `forge-infra-azure`: `forge/<childId?>/<artifactId>` → `lib/<artifactId>/<hash>/`
   with runtime skins (§10). Per-child creations go to the private `taxilaws` account.
3. **Hosting moved.** Orchestration §7.3 places the fast lane on Vercel; `hosting-azure-container-apps`
   superseded that. Nothing in this design depends on Vercel; `/api/ws/*` runs in `taxila-web`.
4. **"Dynamic sessions with a persistent volume"** is not a product: dynamic sessions are ephemeral;
   Sandboxes have volumes and snapshots [V] (§3.2).
5. **Transcripts in plaintext.** `001_core.sql` stores `turn.text` as text; W4 makes it DEK-encrypted bytea,
   so the parent's 24-hour purge holds for backups too.
6. **`lesson.state`** keeps the Director snapshot with no TTL; NM-4 requires session-scoped state to be
   hard-deleted at close (I11).
7. **Interests have two homes** (`child.interests` and `memory` kind `interest`). Owner: `child.interests`
   (parent-visible tags); memory rows are citations that propose a tag, never a second list.

---

## 17. Open questions

1. **Neon region vs India.** Neon offers no Mumbai region to this org (`infra-segment`). If localisation
   becomes law (dpdp-deep §0 item 11), an India cell needs Azure Database for PostgreSQL in Central India
   (Azure-native, payable from the grant). The bundle format makes that a copy; the cost has not been modelled.
2. **Legal hold content.** Rule 8(3) reading (a) vs (b) decides whether erasure keeps an encrypted
   one-year copy of transcripts. Counsel question Q3 in dpdp-deep.
3. **Device exposure on loss.** Is 14 days of notebook pages on an encrypted store acceptable, or should
   the device keep only today's pages?
4. **Offline evidence weight.** Should re-graded offline attempts count fully as independent attempts, or
   with a lower weight because the context is unobserved? A KT question for the kt-algorithms owner.
5. **Creations studio.** Whether Classes 6-9 get a multi-session build space at all is a product call; if
   yes, price it by WS-M9 before promising it.
6. **Sandbox storage meter.** The Premium Blob ZRS storage charge for Sandboxes is marked "coming soon" [V];
   re-check before any per-child sandbox pilot.

---

## 18. Sources

- Azure Container Apps dynamic sessions (ephemeral; Hyper-V; pools; regions incl. Central India) — https://learn.microsoft.com/en-us/azure/container-apps/sessions [V]
- Azure Container Apps Sandboxes overview (snapshots, volumes, tiers XS-XL, lifecycle policies, Entra ID, sessions-vs-sandboxes table) — https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-overview [V]
- ACA Sandboxes cost (core-second, GiB-second, storage at Premium Blob ZRS, "coming soon") — https://sandboxes.azure.com/docs/sandboxes/cost [V]
- ACA Sandboxes quotas (500 concurrent active cores typical; 3,000 requests/min) — https://sandboxes.azure.com/docs/sandboxes/limits [V]
- ACA billing (free grants; idle rates; code-interpreter session-hour increments; custom pools on E16) — https://learn.microsoft.com/en-us/azure/container-apps/billing [V]
- Azure Retail Prices API (ACA eastus2: $0.000024/vCPU-s, $0.000003/GiB-s, $0.40/M requests, $0.03/session-hour; Blob Central India: Hot LRS $0.020, Cool LRS $0.011, Cold LRS $0.0045, Premium ZRS $0.279; eastus2 Premium ZRS $0.200; Hot LRS writes $0.055/10k; Front Door Standard base $35/month and zone egress tiers; Key Vault $0.03/10k ops), queried 2026-10-02 — https://prices.azure.com/api/retail/prices [V]
- Neon pricing (Scale $0.222/CU-hour; storage $0.35/GB-month; history $0.20/GB-month; 1,000 projects on Scale; $1.50/extra branch-month; PITR 7 d Launch / 30 d Scale; 16 CU autoscale) — https://neon.com/pricing [V]
- Azure Blob encryption scopes (cannot be deleted; 30-day minimum billing; 10,000 auto-rotated CMK scopes per account) — https://learn.microsoft.com/en-us/azure/storage/blobs/encryption-scope-overview [V]
- MDN, storage quotas and eviction criteria (Chromium 60% of disk; LRU eviction of best-effort origins; silent `persist()`; Safari 7-day rule; OPFS counts in quota) — https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria [V]
- Capacitor storage guide (OS reclaims WebView storage; use Preferences or SQLite) — https://capacitorjs.com/docs/guides/storage [V]
- Yjs document updates (commutative, associative, idempotent; `mergeUpdates`; compaction needs a Y.Doc) — https://docs.yjs.dev/api/document-updates [V]
- tldraw licence (production requires a licence key) — https://tldraw.dev/community/license [V]
- PowerSync (Postgres/Neon source, Capacitor SDK over Capacitor Community SQLite, Open Edition self-hosted) — https://powersync.com/blog/powersync-open-edition-release , https://www.npmjs.com/package/@powersync/capacitor , https://docs.powersync.com/configuration/source-db/connection [S]
- ElectricSQL (read-path shapes over HTTP; writes through your API; self-hostable) — https://electric-sql.com/docs/intro [S]
- Internal: `docs/ARCHITECTURE.md`; `docs/research/conductor/orchestration-architecture.md`; `docs/research/conductor/day-cycle.md` and `.sql`; `docs/research/learner/kt-algorithms.md`; `docs/research/learner/vibe-temperament.md`; `docs/research/safety/dpdp-deep.md`; `docs/research/design/parent-experience.md`; `docs/research/design/kids-ux-ages.md`; `docs/research/design/onboarding-flow.md`; `docs/research/learning-science.md`; `context/decisions.md`; `context/rejected.md`; `db/migrations/001_core.sql`.
