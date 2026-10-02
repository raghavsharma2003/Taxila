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

---

## Architect review

**Date:** 2026-10-02 · **Reviewer stance:** adversarial systems architect. Read against the repo `CLAUDE.md`
binding constraints, `context/decisions.md` (`hosting-azure-container-apps`, `infra-segment`),
`context/measurements.md` (`db-driver-latency-2026-10-02`), the sibling reviews in
`orchestration-architecture.md` (§ Architect review, R1 lanes) and `day-cycle.md`, `design/kids-ux-ages.md`
S1/§8, and `learning-science.md` §6. Tags as above: **[V]** checked this session against the primary source,
**[S]** secondary, **[U]** estimate to measure, **[repo]** a fact in this repository. Sensitivity numbers come from
`python3 docs/research/conductor/student-workspace-review-cost.py` (new, deterministic; reuses the base model's prices).

**Verdict.** W1 is right and should be kept: the "little VM" is a logical workspace (rows + a Blob prefix + a
device replica + the Conductor actor), and a per-child container is correctly rejected on cost and quota. The
map (W2), single-writer layers (W6/§9), server re-grade (W7) and agent projections (W8) are the strongest
parts. Five things are wrong enough to block M0:

1. **The crypto-shred does not shred.** The wrapped DEK sits in `child_key` inside the same Neon project whose
   instant-restore history the shred is meant to defeat. Restoring to one minute before the erase brings back
   the wrapped DEK. The KEK is still live, so every "unreadable" copy is readable again (R3.1).
2. **A store eviction silently drops new data.** `notebook_op`'s idempotency key is `(child, page, writer,
   writer_seq)` with `writer = device_id`. If the replica is evicted (W5 expects this) and the device id
   survives, `writer_seq` restarts at 1. Every new stroke then collides with an old row and is acked as a
   "replay". The child's new notebook work disappears without an error (R3.2).
3. **One bad op wedges the outbox for good.** Sync applies "one transaction per batch". Any failing op aborts
   the whole batch: an FK error because no op creates `notebook_page`, a revoked consent that the writer
   *throws* on (I10), or a schema error. The device retries the same 200 ops forever, and every later offline
   answer waits behind them (R3.3).
4. **Late-evidence refold races the live lesson.** `kt.refold` re-folds from the earliest late event. It runs
   as a job while the same child may be in a live lesson on a second device, and the Director writes
   evidence each turn. Nothing serializes the two KT writers, so one overwrites the other (R3.4).
5. **The premises are stale.** The doc assumes Neon in Singapore at about 200 ms. Neon moved to
   `aws-us-east-1` beside eastus2, and a query now takes 9-12 ms over a `pg` Pool [repo
   `db-driver-latency-2026-10-02`]. The Blob account is placed in Central India, so every archive,
   notebook-snapshot and export read crosses the Pacific from the app, with no residency gain because the hot
   copy is in the US. The computed brief for this review still says "Vercel functions (sin1)". `CLAUDE.md`
   and `hosting-azure-container-apps` say ACA `taxila-web` + `taxila-worker` (R1).

Beyond these, cell sizing uses average load where it should use peak load. Ink is stored as one row per
stroke. About half of the machinery is not needed for the first cohort (R6). Several child-facing moments are
hostile: dormancy wipes the offline pack, an unused profile is erased after 30 days, the class increments
automatically, and a sibling's answers on the wrong profile cannot be undone (R7).

### R0. Findings on one screen

Severity: **P0** = fix before M0 ships. **P1** = fix before ~1k children or the named milestone. **P2** =
simplification or clean-up.

| id | sev | finding | fix |
|---|---|---|---|
| SW1 | P0 | W4/§12.2 crypto-shred: `child_key` lives in the PITR'd Neon project, and the KEK is never rotated out, so a restore inside the history window (default 1 d, up to 30 d on Scale [V Neon]) resurrects the wrapped DEK | Key store outside the PITR'd DB with a bounded backup window, or defer W4 for v1 (R3.1, R6) |
| SW2 | P0 | `notebook_op` PK `(child,page,writer,writer_seq)` with `writer = device_id`. After a store loss, `writer_seq` restarts and new ops are deduplicated away as replays. `device_child.last_op_seq` and `OutboxEntry.deviceSeq` have the same flaw | `writer = replica_id` (a ULID minted when the store file is created), dedupe on `op_id` (R3.2) |
| SW3 | P0 | §8.4 "one transaction per batch". A single failing op aborts all 200, and the device retries forever. `WorkspaceOp` has no page-create op, but `notebook_op` has an FK to `notebook_page`, so the first offline page always fails | Validate per op in code, then apply with set-based upserts. Auto-create pages. Per-op rejections in `SyncResponse` (R3.3) |
| SW4 | P0 | `kt.refold` (job) and the Director's per-turn KT writes are unserialized, so the KT state is lost-update prone. A refold mid-lesson can also visibly retract a child's star | Every KT write takes `workspace` row lock `FOR UPDATE`. Refold is deferred to lesson end while a lesson is live. Display states are monotone within a day (R3.4, R7) |
| SW5 | P0 | Stale region: §5, §13.2, SQL `region default 'sea'` assume Neon Singapore at 200 ms. Blob is in Central India, away from the app and DB | Neon US East (as deployed). Blob `taxilaws` in eastus2 for v1. Move all three together when an India region is decided (R1) |
| SW6 | P1 | Erasure vs in-flight work: running jobs and a 10-min in-process DEK cache keep writing after step 1. Blob writes after the step-4 prefix delete leave orphans that nothing indexes (the `workspace_object` insert fails its FK) | Fencing check on `workspace.state` inside each job's write transaction. DEK cache keyed by `(child, key_epoch)` and checked at every open. Tombstone sweeper re-lists erased prefixes at +24 h and +7 d (R3.5) |
| SW7 | P1 | Cell size (150k) comes from *average* CU-hours. At peak a 150k cell needs ≈ 8.4 CU with sync included (the model omits sync), and ≈ 34 CU if a CU sustains 200 statements/s, the doc's own sensitivity case. That is over the 16 CU autoscale ceiling | Size cells by peak statements/s (WS-M2 at peak mix incl. sync). Expect 50-75k children per cell unless WS-M2 says otherwise. No cells before ~50k children (R4.2) |
| SW8 | P1 | Notebook ink as one `notebook_op` row per stroke means ≈ 12 B rows/month inserted and then deleted at 1M children [U]. The 500-op compaction trigger is per page, so a busy page churns constantly | One row per `(page, replica, sync batch)` holding an op array. Compress before encrypting (R4.3) |
| SW9 | P1 | WAL history is undercounted. The model bills history only on appended rows (1.4 MB/child-month). `conductor_state` and `lesson.state` jsonb rewrites add ≈ 10 MB/child-month [U], which is $455/mo (7 d) to $1,950/mo (30 d) at 1M against the model's $66-283 | Keep hot state rows small: split fast-changing scalars from slow jsonb, append deltas, and set the history window to 7 d (R4.1) |
| SW10 | P1 | §4 says sharing packs across children cuts CDN cost. It does not: Front Door bills edge→client bytes on cache hits too [V Front Door billing]. Only device-side dedup cuts egress (≈ −34% at 1M [U]) | Manifest lists hashes. The device fetches only hashes it lacks. The model counts *new* bytes per day (R4.4) |
| SW11 | P1 | Contradiction: §1 says "never in the workspace: raw audio", yet `child_creation.kind` includes `teachback_audio` and `workspace_object.kind` includes `voice_moment`. ARCHITECTURE §1.7 says "Audio is never stored" and rule 35 requires separate opt-in | Remove both kinds from the v1 DDL. If audio is ever added, it needs its own map entry, purpose and opt-in (R8) |
| SW12 | P1 | §1.4/§10 rely on the ModuleHost iframe having "no network". The `sandbox` attribute has no network flag [V WHATWG sandboxing flag set], so a generated module can still beacon out the runtime `skin.name` with `fetch` or `<img>` | CSP on every `lib/` response (`default-src 'none'; script-src 'self'; img-src 'self' data:; connect-src 'none'`) plus the iframe `csp` attribute. An e2e test asserts that a module's `fetch` fails (R3.6) |
| SW13 | P1 | SPOFs left unnamed: the global `child_directory` (on every request at 1M), Key Vault (every lesson start that needs memory text), a single Neon compute per cell with nothing degraded behind it for the Director, and a single-region LRS Blob holding the only copy of children's creations | R2 |
| SW14 | P1 | Work that cannot live in a request (on Vercel or on scale-in-prone `taxila-web`) is placed "API route / ACA web": refold, compaction + SVG render, erase purge, export PDF, rollover, notice timers, KEK rotation | Lane table (R5) |
| SW15 | P1 | Child-experience gaps: dormancy wipes device packs, so a child returning from a village summer has nothing offline. `provisional` erases after 30 d of no lesson. The 48-h notice falls in a single window. Rollover increments the class automatically. A wrong-profile session cannot be undone. Eviction forces a guardian OTP re-pair | R7 |
| SW16 | P2 | v1 scope ≈ 2× what the first cohort needs: cells + directory, segments, per-child DEK, per-child SQLCipher files, SQLite-wasm on OPFS, PDF/SVG export, byte-identical round-trip (I9), the M0-M3 write gates in every writer | R6 |
| SW17 | P2 | Schema nits: `artifact_use` has no PK, so I8 (replay = no-op) cannot hold. `workspace.state='erased'` cannot be stored, because the row cascades away. `pack.manifest` jsonb is ≈ 10 KB × 1M rows/night, inserted and deleted | R8 |
| SW18 | P2 | Free text that W4 misses: `student_event` payloads, `decision_log`, the `attempt.response` (typed or ASR text), and `homework_request` can all carry child words in plaintext | Typed payloads with no free-text fields. A lint in the map test. Encrypt `attempt.response` when it is free text (R8) |

---

### R1. Rebase on what is deployed

| premise in the doc | what is true [repo] | consequence |
|---|---|---|
| Neon Singapore, ~200 ms per round trip (§5, §13.2, W9) | `royal-fire-14595065` in `aws-us-east-1`, 9-12 ms/query over a persistent `pg` Pool from eastus2 | §13.2's "one SQL function returns the whole bundle" is now an optimisation, not a necessity. Orchestration review A17 already prefers plain interactive transactions in JS over plpgsql jsonb parsing. Keep `openWorkspace` as one query because it is simpler, not because it is forced |
| Blob `taxilaws` in Central India | app and DB in eastus2 | Each archive, snapshot or export read crosses India↔US twice (app→Blob→app→device). Data-residency gain is zero while the hot copy is in the US. **Put Blob in eastus2 now**, and move DB + Blob + app together if an India region is ever chosen (§17 q1). The bundle format already makes that a copy |
| "Vercel functions (sin1)" (this review's computed brief) and orchestration §7.3 | Vercel project paused; `taxila-web` (min 1 / max 5, HTTP-scaled) and `taxila-worker` (min 1) on ACA; scale-in sends SIGTERM and SIGKILLs after 30 s (orchestration R1 [V]) | Nothing may run after a response in `taxila-web` beyond a ≤ 10 s step. Every job in §2 marked "API route / ACA web" moves to the worker (R5) |
| `child_directory.region default 'sea'` | no Singapore cell exists in production | default `'us-east'`; region is a property of the cell, not of the child |

### R2. Single points of failure

| SPOF | blast radius | v1 mitigation | later |
|---|---|---|---|
| **Neon compute (one cell)** | all Director turns, sync, Conductor. Voice keeps talking (WebRTC goes straight to Azure), but the teacher is steered by stale instructions | **Director degraded mode:** if `/api/lesson/turn` fails twice, the client keeps the last instructions, which already carry the lesson step. The client queues turn payloads in the same outbox (`k:'event'`) and shows nothing to the child. The Director resumes from the queued turns. Lesson start fails *before* the call connects, with a friendly retry card (never a teacher who goes silent mid-call) | read replica for the parent dashboard and reports, so they never compete with turns |
| **Key Vault** (W4) | any open that needs DEK text (memory callbacks in the brief, safety review, parent transcript view) | Brief degrades to "no memory callbacks" on unwrap failure. Never block a lesson on Key Vault. Back off on 429. The limit is 4,000 RSA-2048 software-key ops per 10 s per vault [V], ≈ 14× the 1M peak lesson-start rate [U], so throttling only bites on bulk jobs (nightly brief build, KEK rotation): pace those at ≤ 200/s | Key Vault in the app's region (eastus2) |
| **`child_directory`** (global, on every request at 1M) | every request at 1M students | none needed at v1: no directory, one database | put `cell` in the signed session claim. A cell returns `409 moved{cell}` after a move, and the client refreshes the claim. The directory is read only at login and on move |
| **Blob LRS, single region** | the *only* copy of child creations and notebook snapshots (the device copy is a 14-day cache) | Use ZRS for `cr/` and `nb/`: it is the emotionally irreplaceable part, and it is small. Keep `seg/` on LRS: it is not re-derivable, but it is cold history nobody shows to the child | GRS if creations studio ships |
| **The nightly pack build** | every child's offline day | Pack build is lazy as well as nightly: if no pack for today exists at first open, build the `personal` part inline (< 50 KB, ≤ 1 s, no LLM). Shared objects already exist | — |
| **The single `taxila-worker`** | erase, export, refold, compaction | as orchestration R1: min 1, leader election, lease recovery | split slow lane to an ACA job on CPU contention |

### R3. Race conditions and correctness, with fixes

#### R3.1 A crypto-shred that survives restore (SW1)

The goal of W4 is that after erase, copies in Neon history and Blob soft-delete are unreadable. That holds only
if **no** copy of the wrapped DEK survives longer than the purge target. Two designs work:

- **(a) Separate key store with a short, matched backup window.** Put `child_key` in its own small Neon project
  `taxila-keys` with `history_retention_seconds` set to 0. Neon allows a zero window, which "disables instant
  restore and Time Travel" [V Neon history window]. Then add a bounded backup of its own: a nightly encrypted
  dump of the key table under the KEK, kept for 48 h. Erase sets `shred_at = now()` and deletes the row. After
  48 h no backup holds the key, so the parent notice can say "unreadable everywhere within 2 days". Losing
  `taxila-keys` loses every child's encrypted data, so it gets the 48-h dump, ZRS, and a monthly restore drill
  (WS-M7).
- **(b) Defer W4 for v1** (recommended, R6). `CLAUDE.md` deprioritises compliance. Use hard delete, a 7-day
  history window on the main project, and Blob soft-delete set to 7 days. Change the parent promise from "purged
  within 24 h" to "removed now; backup copies expire within 7 days" (parent-experience §10 must change too). Build
  (a) when compliance is re-prioritised, never the in-database version.

Either way, `child_key` in the main project is rejected. Log it in `context/rejected.md` as
`dek-in-pitr-database`.

#### R3.2 Replica identity (SW2)

```sql
-- replaces the writer column semantics; a replica is one store file's lifetime, not a device
alter table notebook_op rename column writer to replica;          -- 'director' | replica ULID
-- device_child gains the current replica; a new replica id is a fresh sequence space
alter table device_child add column replica_id text, add column replica_started_at timestamptz;
-- outbox dedupe is by op id, globally unique (ULID), not by (device, seq)
create table sync_op_seen (child_id uuid not null references child(id) on delete cascade,
  op_id text not null, at timestamptz not null default now(), primary key (child_id, op_id));
-- prune rows older than the 72 h clamp window + 7 d
```

The device mints `replica_id` when it creates `ws_<child>.db`, and sends it in every `SyncRequest`. Keep the
device credential in Capacitor Preferences (native SharedPreferences), not in the evictable WebView store.
Otherwise every eviction forces a guardian login + OTP before the child can practise (R7). Add invariant
**I13**: delete the replica file, write 10 ops, and assert that all 10 are stored.

#### R3.3 Sync apply that cannot wedge (SW3)

```ts
// server/workspace/sync.ts — per-op validation in code, set-based apply, no batch-wide abort
export async function applyBatch(h: WorkspaceHandle, req: SyncRequest, db: Tx): Promise<SyncResponse> {
  const seen = await db.seenOps(h.childId, req.ops.map(o => o.opId));          // 1 query
  const fresh = req.ops.filter(o => !seen.has(o.opId));
  const verdicts = fresh.map(o => validateOp(h, o));                           // schema, consent, legal mode, quota, clamp
  const ok = fresh.filter((_, i) => verdicts[i].ok);
  await db.tx(async t => {                                                     // one short transaction
    await t.lockWorkspace(h.childId);                                          // R3.4: serialises with Director/KT
    await t.ensurePages(h.childId, ok);                                        // insert … on conflict do nothing
    await t.insertByKind(h.childId, ok);                                       // unnest()-based multi-row inserts, on conflict do nothing
    await t.markSeen(h.childId, fresh.map(o => o.opId));                       // rejected ops are 'seen' too
  });
  return { acked: ok.map(o => o.opId),
           rejected: fresh.flatMap((o, i) => verdicts[i].ok ? [] : [{ opId: o.opId, why: verdicts[i].why }]),
           /* docs computed AFTER the apply: read-your-writes for prefs (R7) */ ...await docsFor(h, req.docs) };
}
```

If the transaction itself fails (DB down), nothing is acked and the batch is retried with backoff. A batch
that fails three times is split in half on the device, so a poison op is isolated in log₂(200) ≈ 8 tries.
Writers *refuse* (return a verdict) instead of throwing; I10 stays as a throw only for server-internal writes.

#### R3.4 One KT writer at a time per child (SW4)

- Every transaction that writes `kt_*` first runs `select 1 from workspace where child_id=$1 for update`. That
  includes the Director's per-turn evidence, the sync `attempt` apply and `kt.refold`. It is a per-child row,
  so it has no global contention, and it is a transaction-level lock, so it works through Neon's
  transaction-mode pooler (session-level advisory locks do not [V via orchestration R1]).
- While `lesson` has an open row for the child, late offline evidence is *appended* with its true
  `occurred_at`, and the refold job gets `not_before = lesson.ended_at`. The Director never sees KT state
  shift underneath its cached brief mid-lesson.
- Re-grade uses the **kit version pinned in the pack** (`packId → kit_version`), not today's kit. If a kit
  erratum landed overnight, re-grade marks the attempt `kit_superseded` and gives it no evidence weight. It
  never flips the outcome the child already saw.

#### R3.5 Erasure fencing (SW6)

1. Each job's final write transaction re-reads `workspace.state` `for share` and aborts if
   `state in ('erasing','erased')`. This is the fencing token: a job claimed before step 1 cannot commit after it.
2. The DEK cache key is `(child_id, key_epoch)`. `openWorkspace` returns the epoch, and erase bumps it to
   `-1`, so a cached DEK is unusable at the next open, not 10 minutes later.
3. Blob writers write the `workspace_object` row **before** the blob, so no blob exists without an index
   row. If the row insert fails (FK, child gone), the blob is never written.
4. A sweeper lists `c/<cell>/<child>/` for every tombstone at +24 h and +7 d, and I7 asserts the listing is
   empty after the second sweep.
5. Notice-timer race: `notice → erasing` is one statement,
   `update workspace set state='erasing' where child_id=$1 and state='notice' and coalesce(last_active_at,'epoch') < notice_sent_at`.
   An app open between the notice and the timer wins.

#### R3.6 The ModuleHost leak path (SW12)

`sandbox="allow-scripts"` gives an opaque origin, but no sandboxing flag restricts fetches [V WHATWG]. Front
Door must send a CSP header on every `lib/` object. The host also sets the iframe `csp` attribute (embedded
enforcement; Chromium, which covers Android WebView) as a second layer. Without both, the runtime skin token
design (§10, I4) protects the public file but not the running module. A codegen module that reaches the
library after human review must still be unable to phone home.

### R4. Cost: where the model undercounts (none changes the ranking)

Output of `student-workspace-review-cost.py` (all usage [U]):

| item | base model | with the missing term | note |
|---|---|---|---|
| R4.1 Neon history at 1M (7 d / 30 d window) | $66 / $283 | **$455 / $1,950** | jsonb rewrites of `conductor_state` (25/day) and `lesson.state` (50/lesson) ≈ 9.8 MB WAL/child-month. Fix by splitting hot scalars out of the jsonb and keeping the window at 7 d |
| R4.2 peak statements per 150k cell | 1,250/s → 4.7 CU | **2,250/s → 8.4 CU** (sync included); **34 CU** at 200 st/s/CU | cell count is a *peak* question. The model's average CU-hours set the bill, not the ceiling |
| R4.3 notebook rows at 1M | — | **12 B rows/month** one-per-stroke; 0.24 B batched ×50 | encrypted ops do not compress, so compress before encrypting |
| R4.4 CDN egress at 1M (excl. request fees) | 100 TB, $8.6k | +1 short video per lesson: **220 TB, $14.7k**; device dedup instead: **64 TB, $5.7k** | Front Door bills cache hits to the client [V]. The family's data bill moves the same way: 100 → 220 MB/child-month with video |

The workspace stays cents per child in every case. Real blowups sit just outside it, and this doc's
interfaces are where they get stopped:
- **Per-child generation disguised as personalisation.** If the pack builder or Forge projection ever calls
  an LLM or image model per child per night, that costs orders of magnitude more than this whole document.
  Assert in the pack builder: no model calls; personal part is template + tokens.
- **Video in the module path.** Cap module bytes per lesson in `PackManifest.budgetBytes` and the live module
  path alike (default 4 MB/lesson [U]). Video is library-level, played at most once per child, and cached on
  the device by hash.
- **Nightly builds for children who will not open the app.** Build packs only for children active in the last
  7 days, and build lazily otherwise (R2). This saves the 30/20 overbuild and the 3-day-expiry churn.

### R5. Where each piece of work runs (ACA as deployed; the Vercel column shows why the brief's premise fails)

| work | duration | `taxila-web` request | `taxila-worker` | would it fit Vercel? |
|---|---|---|---|---|
| sync apply, `openWorkspace`, doc ETags, lazy personal pack | ms-1 s | **yes** | — | yes |
| KT update on a turn or sync | ms | **yes**, under the R3.4 lock | — | yes |
| `kt.refold` | ms-s, but deferred to lesson end | — | **yes** (fast lane) | it fits, but `waitUntil` dies with the function [V via orch.]; needs a queue |
| notebook compaction + SVG render | seconds per page | — | **yes** | marginal; it would need a queue anyway |
| nightly pack + brief build fan-out (≈ 700k children at 1M) | hours of wall time, jittered | — | **yes**, chunked by child, each chunk a job | no: 300 s Hobby / 800 s Pro cap [V via orch.]; it needs cron + queue |
| erase purge (cascade, Blob prefix delete with retry, sweeper at +24 h/+7 d) | minutes, then retries over days | step 1 only (revoke) | **yes** | the revoke fits; the purge does not |
| export bundle (NDJSON + readable HTML; PDF later) | minutes | — | **yes** | headless PDF rendering does not fit |
| cell move, KEK rotation, rollover | hours | — | **yes**, paced (Key Vault ≤ 200/s) | no |
| dormancy / notice / rollover timers | ticker | — | **yes** (the orchestration ticker, per-child jitter) | needs Pro cron |

Rollover is a thundering herd if scheduled on 1 April for every CBSE child. Fire it per child on the parent's
confirmation (R7), spread over the first week of the session.

### R6. The v1 cut (first cohort: tens to low thousands of children, one Neon compute)

| keep for v1 | defer, with its trigger |
|---|---|
| `WORKSPACE_MAP` + I1/I2/I7 tests (cheap, and they prevent erasure drift forever) | **cells + `child_directory`**: until peak WS-M2 says one compute cannot hold the next 6 months' growth. Keep `child_id`-leading keys so a move stays possible |
| `projectFor` typed projections (W8), Forge never sees a name (I4, I6) | **archive segments + `archive_segment`**: at 100k children hot storage is ≈ 530 GB ≈ $185/month [U]. Use plain retention deletes until hot storage costs more than a week of engineering per year |
| server re-grade (W7, I5) with pinned kit version | **per-child DEK / Key Vault** (R3.1 b) |
| outbox up + ETag docs down (W6), with R3.2/R3.3 fixes | **SQLite-wasm on OPFS for web.** Web v1 uses an IndexedDB outbox + Cache API for packs. If OPFS comes later, use `opfs-sahpool`: the plain `opfs` VFS needs COOP/COEP cross-origin isolation [V sqlite.org], which would also gate every cross-origin `lib/` iframe |
| Android: one Capacitor SQLite DB in app-private storage, rows keyed by `child_id` | **one SQLCipher file per child.** The profile picker has no PIN, so a sibling reaches any profile through the app anyway (§8.6 admits this). Per-file encryption only protects against file extraction from a rooted phone, and the device holds no transcripts. One DB, one migration path |
| notebook: per-page layers, batched op rows (R4.3), snapshot at close | **SVG renders for the parent and Yjs**; render on demand in the parent view |
| hard delete + 7-d history + receipt | **I9 byte-identical round trip, PDF export.** v1 export = NDJSON + one HTML page. I9 matters only once cells move |
| lifecycle: `active ⇄ dormant`, `paused`, erase | **`notice` automation and the M0-M3 per-writer gates.** Compliance is deprioritised [repo `CLAUDE.md`]. Keep the single `legal_mode` column so the gates can be added in one place |

This roughly halves the build. It removes three of the five P0 surfaces (the key store, cross-region Blob and
cell routing) instead of hardening them.

### R7. The child's side of the workspace

1. **Dormancy must not empty the phone.** §11.1 wipes packs and caches at 30 days without a session. That
   catches the North Indian summer vacation (May-June, day-cycle §7.4) and Diwali, exactly when a child is in
   a village with no data. Change it: dormant means *stop building*, and the device keeps the last pack, the
   shelf and the notebook. On return the child gets a "welcome back" from the last pack while a fresh one
   downloads. The "wipe" side effect is reserved for revocation and erasure.
2. **No silent erase of a child who never started.** `provisional → erasing` after 30 days with no lesson
   erases a profile a parent made during exams. Replace it with a parent reminder at 14 days and erase only
   after explicit choice or the 12-month rule.
3. **A notice period you can actually catch.** Forty-eight hours is the legal floor, not a product choice.
   Use 30 days with reminders at 30, 7 and 1 day(s) on WhatsApp + email, and "any open keeps it".
4. **Rollover asks; it never assumes.** Promotion is not certain (results, repeats, board change). Use the
   parent's one-tap confirmation in the report around results week. With no answer, stay in the old class and
   keep teaching from the skill graph (rule 28 places by level anyway). The child must never hear "Class 6"
   content the week before a Class 5 exam.
5. **Undo the wrong profile.** kids-ux S1 already detects "I didn't do that". The workspace needs the data
   operation behind it: `session.reassign{lessonId|packId, toChild}` by a guardian, which moves the session's
   evidence, turns and notebook pages to the sibling (same guardian only) and re-folds both. Without it a
   six-year-old's taps permanently corrupt an older sibling's mastery and plan.
6. **Never retract what the child saw.** Server re-grade can disagree with the on-device feedback, and a
   refold can move display states. The rule: anything shown to the child today (a "sahi!", a star, "learned
   today") is never visibly taken back. The learner model changes silently, and the next session's plan
   absorbs it.
7. **Show the child that her work is safe.** Notebook pages and creations are what a child cares about. Upload
   them ahead of evidence. Show a small "saved" tick per page once acked, and "saved on this phone" when not.
   Never show a sync error to the child; the parent area carries the count (§8.6).
8. **Do not spend the family's data.** Most households have no Wi-Fi (kids-ux §8). "Download at first open"
   on mobile data puts a 3 MB wait in front of the child. The first screen must never wait on the pack.
   Prefetch in the background (Capacitor background task, charging + unmetered when available), and show the
   monthly total in the parent corner (R4.4: 64-220 MB/child-month).
9. **Re-pairing after eviction must not need the parent.** With the device credential in native Preferences
   (R3.2), a lost store is rebuilt silently and the child goes straight to the profile picker.
10. **Prefs must not bounce.** A child says "Hindi mein bolo" and the next sync returns the old `prefs` doc.
    Docs are computed after the batch applies (R3.3), and the device keeps a local override until it sees a
    doc version ≥ the op's ack.

### R8. Corrections to the body

1. §0 W4, §12.2 steps 2/6, §12.3: the shred requires keys outside the PITR'd database (R3.1). As written,
   step 2 does not make Neon-history copies unreadable.
2. §4 "Reading the table", first bullet: sharing shared parts across children reduces *origin* fetches, not
   billed egress. Device dedup is the lever (R4.4).
3. §3.5 / §13.1: the 150k cell size is an average-load figure; size by peak (R4.2).
4. §5 diagram, §13.2, SQL `region default 'sea'`, §16 item 3: Neon is US East; Blob moves to eastus2 (R1).
5. §8.4: "one transaction per batch" → per-op validation + set-based apply (R3.3). Add `nb` page auto-create.
   Dedupe by `opId`.
6. §8.5: the clamp lower bound `last_sync_at − 72 h` should be `last_sync_at − 5 min` (ops are created after
   the last sync). Use the 72 h only as a cap on how old an op may be after a long offline stretch, with older
   ops kept but given no evidence weight.
7. §8.6 / §11.1 "→ dormant ... wipe docs and packs on devices": remove (R7.1).
8. §9 prose lists `move` ops, but `NotebookOp` has none. Add `{ t: 'stroke.move'; id; dx; dy }` or drop it from
   the prose.
9. §1 table and the SQL: delete `teachback_audio` and `voice_moment` from v1 (SW11).
10. SQL: `artifact_use` gets `op_id text primary key`. `pack` stores a pointer (`manifest_url`, `sha256`), not
    the manifest jsonb. `workspace.state` drops `'erased'` (the directory/lifecycle receipt carries it).
    `notebook_op.op` holds an op *array* per batch.
11. §2: `kt.refold` and compaction are worker jobs, not API-route work (R5).
12. §6 says the DDL is "draft, not applied"; the header and I1 say it was applied to a scratch Postgres 16.
    Say "applied to a scratch DB, not migrated".

### R9. New invariants and measurements

- **I13** replica loss: deleting the store file and writing new ops loses nothing (R3.2).
- **I14** poison batch: a batch containing one invalid op acks all the others (R3.3).
- **I15** one KT writer: a concurrent refold + Director-turn fixture ends in the same KT state as the serial
  order (R3.4).
- **I16** erase fencing: a job claimed before erase step 1 cannot commit rows or blobs after it (R3.5).
- **I17** module egress: a fixture module's `fetch('https://example.com')` and `new Image().src=` both fail
  inside ModuleHost on Android WebView and Chrome (R3.6).
- **I18** no retraction: after a re-grade disagreement or refold, every display state the child saw today is
  unchanged in the child UI (R7.6).
- **WS-M10** peak statements/s per cell, including sync, at the evening peak (replaces the average in WS-M2).
- **WS-M11** WAL bytes per child-month from `pg_stat_wal` deltas ÷ active children (R4.1).
- **WS-M12** pack bytes actually downloaded per child-day after device dedup (R4.4).
- **WS-M13** profile mix-up rate and `session.reassign` use (pairs with kids-ux M-UX-10).

### Sources added by this review

- Neon history window (Free 6 h; Launch default 1 d, max 7 d; Scale default 1 d, max 30 d; can be set to zero via `history_retention_seconds`, which disables instant restore; $0.20/GB-month) — https://neon.com/docs/introduction/history-window [V]
- Azure Key Vault service limits (RSA-2048 software key: 4,000 "all other" transactions per 10 s per vault per region; subscription-wide 5×) — https://learn.microsoft.com/en-us/azure/key-vault/general/service-limits [V]
- Azure Front Door billing (edge→client bytes billed even when served from cache; origin→edge not billed) — https://learn.microsoft.com/en-us/azure/frontdoor/billing [V]
- WHATWG HTML, sandboxing flag set (no flag restricts network fetches) — https://html.spec.whatwg.org/multipage/browsers.html#sandboxing-flag-set [V]; MDN `<iframe>` (`csp` attribute) — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe [V]
- SQLite WASM persistence (`opfs` needs COOP/COEP; `opfs-sahpool` does not, one connection per thread) — https://sqlite.org/wasm/doc/trunk/persistence.md [V]
- Internal: `context/measurements.md#db-driver-latency-2026-10-02`, `context/decisions.md#hosting-azure-container-apps`, `orchestration-architecture.md` § Architect review R1 (ACA SIGTERM 30 s, Neon pooler limits, Vercel 300/800 s caps), `design/kids-ux-ages.md` S1 and §8, `day-cycle.md` §7.4 [repo]
