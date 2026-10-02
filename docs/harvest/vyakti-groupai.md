# Harvest: vyakti-groupai (the "common friend" Group AI kernel)

Harvested 2026-10-02 from `/home/user/vyakti-groupai`. The source repo was read-only. Every claim comes from
`git show`, `git log`, `git diff`, `git ls-tree` or `git archive` against refs. Nothing was checked out, committed
or pushed there. To run code, I extracted trees with `git archive` into the session scratchpad and compiled only the
four pure packages (relational-core, intervention-policy, context-capsule, simulator) with Taxila's own `tsc`
(7.0.2) and `zod` (4.6.5). I started no database, container or service.

**Refs.** Three branches. They are one linear history plus one merge.

| alias | ref | commits | tip | what it holds |
|---|---|---|---|---|
| `@M` | `main` | 3 | `d06efdc` (2026-08-30) | 5 packages, migrations 001-003 (the first "durable cloud relational runtime") |
| `@C` | `origin/codex/relational-core` | 40 | `4bae159` (2026-09-04) | 12 packages, migrations 001-019, the complete context graph |
| `@T` | `origin/claude/vyakti-cloning-platform-aq05n4` | 43 | `451de5a` (2026-09-04) | `@C` plus 2 Claude commits (`17096b9` fixes migration 019, `461da8b` adds docs) plus a merge |

Unless I name another ref, every `path@ref` below is `@T` (`451de5a`). Files under `packages/` are byte-identical
between `@C` and `@T`. `git diff --stat origin/codex/relational-core origin/claude/vyakti-cloning-platform-aq05n4`
shows 15 files changed, all docs, context and `019` SQL. `main..@T` adds 479 files (+68,335 / -307).

**The branch name is misleading.** `claude/vyakti-cloning-platform-aq05n4` holds **no voice-cloning, TTS, avatar,
realtime or UI code**. `git grep -i "voice clon|cloning|tts|elevenlabs|avatar|realtime"` finds only 5 incidental test
strings. The cloning platform itself is in html-portfolio (see `hp-vyakti-*.md`). This repo is the trust kernel that
html-portfolio later ported (`api/_relational-core.js`, see VG44).

**Secrets.** No production secret is in any branch. A pattern scan of all three refs found one thing: throwaway
CI-container credentials for `127.0.0.1` in `scripts/verify-db.mjs` and `scripts/verify-runtime.mjs`. These are
localhost and ephemeral, not real credentials, and I did not copy them. `scripts/verify-neon.mjs` creates its role
passwords at runtime with `randomBytes(36)`. The context does record that a Neon owner connection string was once
pasted into a task conversation. It was not stored in the repo, and the repo says to treat it as exposed and rotate
it (`docs/development/ENVIRONMENT-SAFETY.md`; `fail-20260830-neon-ci-owner-secret-missing`). I note that only.

**Licence.** There is no LICENSE file. The owner is the same person as Taxila's owner (raghavsharma2003), so
internal reuse is fine.

**Notation.** "[inference]" marks my reasoning for Taxila, not something the repo measured. "[replicated]" marks a
number I reproduced myself on 2026-10-02.

---

## 1. What this is

### 1.1 One paragraph

Vyakti GroupAI is "a long-lived, cross-platform relational operating system for an AI that participates as a mutual
friend in private and group conversations" (`README.md`). In practice it is an **information-flow kernel**. It
decides what the AI may know, recall, say and do. It decides for whom, where, why and until when, *before* a model
sees anything. Durable PostgreSQL machinery around it makes every external side effect (a model call, a message
send, a reminder) exactly-once or honestly ambiguous. The whole thing was built in 6 days (2026-08-30 to 09-04, 43
commits). It is pre-product. There is no UI, no channel adapter, no production provider, no KMS and no human user.
The repo is explicit and repetitive about that (`context/handoffs/CURRENT.md` "Important unresolved work"; five
"hard NO-SHIP gates").

### 1.2 The Group AI concept, stated precisely

The product brief (`context/briefs/product-objective-2026-08-30.md`) asks for "an AI that acts as a real common
friend shared by a group of people." It "maintains connected one-to-one relationships with every member and
participates in combinations of group conversations while preserving one coherent personality, history, and
relational life." The research then narrowed it (`docs/research/2026-08-30-common-friend-breakthrough.md`):

1. **One identity, several bounded relationships.** There is a distinct relationship with each person, each dyad
   and each group (at a given membership epoch). "No child node inherits disclosure rights from a parent. No sibling
   relationship can read another sibling by default."
2. **Permissioned bridging.** The AI may *notice* that something from A's DM would help the group. It must ask A
   privately, with the exact proposed text, audience, purpose and expiry, before carrying anything across. A can
   approve, edit, narrow or deny, and the group is never told that a request happened.
3. **Shared-life follow-through ("Commitment Keeper").** The AI turns "we should do dinner" into a commitment that
   every accountable human explicitly accepts. Reminders are private and separately consented. Completion is
   attested by humans, never by the AI.
4. **Relational restraint.** Silence is a successful turn. Success is measured *between humans* (completed plans,
   constructive human responses, inclusion of the quietest member), never by AI message volume, session length or
   attachment.

The category test is the **"common-friend-only" value test**: a feature belongs only if it passes 4 of 5 tests
(state about 2+ human relationships; helps a human with another human; needs a group-aware choice of
addressee/timing/silence; is worse with a private assistant plus copy/paste; is measurable without counting AI
usage). The **falsifiers** are listed explicitly. For example: "people value planning and recall but rarely accept
or appreciate a private-to-shared bridge", or "people describe the AI as a substitute friend more often than as
support."

The market reasoning (`docs/research/landscape-2026-08-30.md`): consumer ChatGPT group chats and Copilot Group Chat
were retired in 2026. The repo reads that as "strong disconfirming evidence" against "put a general assistant in a
room" (`res-20260830-shared-chatbot-disconfirmation`). It names Meta AI (personal memory only in 1:1), Shapes, Alfi,
CoFriend, Digipals, Snapchat My AI and Cantina as validating demand but not publishing multi-principal disclosure
semantics.

### 1.3 The relational-core architecture, stated precisely

The thesis (`docs/architecture/ARCHITECTURE.md`): "The model is not the system of record and is never the privacy
authority." The authority is an **append-only social event ledger** plus **deterministic, recipient-aware policy**.
Summaries, embeddings, relationship scores, prompts and graphs are rebuildable projections that "must never widen
source permissions."

- **Unit of isolation: the social world.** One AI identity plus its people, conversations, relationships, policies
  and history. Every row carries `world_id`. Postgres RLS uses `world_id = vyakti.current_world_id()`, which is read
  from `current_setting('vyakti.world_id')` (`db/migrations/001_foundation.sql`). Channel accounts are verified
  *addresses* inside a world. They are not identities and not memory partitions.
- **Audience epochs.** Each event cites the exact membership snapshot that could see it. A later joiner gets a new
  epoch and does not inherit old access. Migration 005 rejects late insertion of members into an epoch that is
  already cited.
- **Memory record.** Fields: kind, content, subjects, `sourceEventIds` (at least 1), `derivedFromMemoryIds`,
  epistemic status (observed / reported / inferred / hypothesis) with confidence and contradiction set, temporal
  validity (observed / validFrom / validUntil), lifecycle (salience, decay, expiry), and a versioned
  `DisclosurePolicy` (`packages/relational-core/src/memory.ts`).
- **Disclosure policy and grant** (`privacy.ts`). A policy has owners, an allow-list, a deny-list, allowed
  conversations, purposes (reply, support, coordinate, celebrate, mediate, safety, recall), **acts** (influence,
  gist, paraphrase, verbatim), sensitivity, a reactive-only or proactive mode, obligations (ask_before_sharing,
  do_not_quote, do_not_attribute, no_derivatives), consent mode (any_owner / all_owners) and validity. A
  **ConsentGrant** is a *capability*. It is bound to one memory and policy version, a grantor who is an owner, an
  exact recipient set, conversations, purposes, acts, an attribution flag, validity and revocation. Deny always wins.
  A grant can add recipients but cannot widen the act, the purpose or attribution.
- **Derivation cannot declassify.** `deriveDisclosurePolicy` intersects the readers, purposes, acts and
  conversations of its parents. It unions owners, denials and obligations, takes the strictest sensitivity and the
  earliest expiry, and is proactive only if every parent is. It refuses if any parent has `no_derivatives`, and it
  refuses across worlds.
- **Pre-model authorization, then the capsule.** `assembleAuthorizedContext` evaluates every candidate memory for the
  *exact* request (world, agent, conversation, audience epoch, recipients, purpose, act, attribution, proactive,
  time). The output items are frozen and registered in a WeakSet. `context-capsule` accepts *only* those issued
  items, plus an authoritative current-turn snapshot. It compiles a typed IR with whole-block budgeting (never
  slicing content), recorded drop reasons and a SHA-256 manifest hash. The model gateway re-verifies the manifest
  hash, each block hash and each block's tokenizer count before dispatch.
- **Intervention policy** (`packages/intervention-policy`). A non-LLM decision across silent, react, reply,
  ask_permission, move_to_dm and perform_action. Its inputs are verified identity, privacy state, addressee, explicit
  triggers, group cooldown (10 min default) and interruption cost. Every decision carries a typed trace. Production
  executes only `silent` and `reply`. Everything else returns `action_not_implemented` ("honest action surface").
- **Durable side effects.** A turn is ordered per conversation: only the head (lowest unresolved sequence) may run,
  and different conversations run in parallel. Each claim has a lease and fence token. The binding of preparation key,
  capsule manifest hash and model request key is immutable before dispatch. A **model request ledger** treats
  "dispatched then crashed" as `ambiguous`, which is reconciled with the provider and never blindly retried. A
  **delivery runtime** keeps per-lane ordering, idempotency keys, deterministic jitter and reconciliation.
- **Privacy barrier.** A per-world Postgres advisory lock. Model calls and sends hold the *shared* side across the
  network call. Privacy mutations (revoke, tombstone, membership change) take the *exclusive* side. Because a dead
  session releases its lock, a durable `dispatched`/`sending` witness also blocks acknowledgment of non-tombstone
  privacy mutations until recovery (`dec-20260830-durable-egress-witness`).
- **Erasure.** Deletion tombstones and per-target deletion jobs (database, embedding, cache, object, snapshot,
  analytics) exist from migration 001. Cached model results go `terminal → erasure_pending → erased`, the last step
  only with a KMS receipt, and are "cryptographically erased, not physically deleted" (migrations 011-012, 018).

### 1.4 How far it got

| layer | status at `@T` | evidence |
|---|---|---|
| Pure TS kernels (12 packages) | built and adversarially tested; Ubuntu and Windows CI green | 375/375 local tests at `b9da0ee`; run `33758157417` green |
| SQL migrations 001-019 (17,386 lines) plus verifies (7,327 lines) | applied and verified on hosted CI Postgres 17/18 | run `33758157417` at `17096b9`: db:verify 001-019 in 17 s; runtime:verify 4 files, 17/17 |
| Disposable Neon PG18 | 001-013 plus 10/10 runtime cases passed once | branch `br-young-moon-azkkn22c` (`exp-20260830-neon-pg18-runtime-proof`) |
| Neon 014-019 | **not proven**; one rehearsal died at verify 001 when OAuth expired | `exp-20260901-shadow-neon-isolated-rehearsal` (blocked) |
| Production provider / KMS / channel adapter / UI / composition root | **absent** | `risk-20260830-production-composition`, `risk-20260830-production-cipher-key-service` |
| Human pilot | **none launched**; Campaign 1 is shadow-only and hard NO-SHIP | `risk-20260830-shadow-human-pilot-not-launched` |

Code size at `@T`: about 41.2k TS lines including tests across 12 packages (postgres-runtime alone is 17.1k), plus
25.8k SQL lines. The context graph has 157 nodes and 212 edges: 48 failure, 32 decision, 27 artifact, 21 risk, 16
experiment, 6 research, 5 requirement, 1 objective, 1 handoff.

### 1.5 Why this matters for Taxila (and where it does not fit)

[inference] Taxila's "relational OS that bonds over months" and its parent-visibility requirement form a
**multi-principal** problem. The principals are the child, the guardian(s), possibly siblings sharing one device or
household, and later classmates or a human teacher. This kernel is the only code in the owner's repos that models
that problem with tested semantics: who may hear what, in which form (gist versus verbatim), for what purpose, and
until when. The fit has three hard limits:

- **Adult-only by construction.** `shadow-pilot-core` declares `adultOnly: true` as a literal type.
  `pilot-telemetry` *rejects* consent evidence unless `adultAttested === true`. The pilot charter excludes
  "classrooms where participation affects grades" and "education admissions"
  (`docs/pilots/2026-08-30-pilot-campaign-system.md`). Taxila must invert this into guardian-attested consent for
  minors. That is a schema change, not a flag.
- **Text-turn shaped.** The capsule, gateway and orchestrator assume a request/response model call that can be
  authorized and bound *before* dispatch. Taxila's live lane is gpt-realtime. Instructions are compiled once per
  session plus `session.update`, so the pattern applies at *session compile time* and on every mid-session injection,
  not per spoken turn. Taxila's own `docs/ARCHITECTURE.md` §1.6 already says "the realtime lane cannot be
  pre-checked."
- **Serverless and Neon caveat on the privacy barrier.** `PostgresPrivacyBarrier`
  (`packages/postgres-runtime/src/privacy-barrier.ts`) holds a *session* advisory lock on a dedicated `pg` Pool
  client across the model call, and sets `vyakti.world_id` at session level. [inference] On Vercel plus Neon this
  needs a direct, non-pooler TCP connection held for the whole call. PgBouncer transaction pooling (Neon `-pooler`)
  and the Neon HTTP driver cannot hold a session lock across requests. Use transaction-local `set_config(..., true)`
  for RLS.

---

## 2. Reusable assets

Maturity uses the shared scale: `shipped-measured`, `shipped`, `prototype` (built and tested, never deployed) and
`spec-only`. Nothing in this repo is shipped. The best maturity anywhere is "prototype with hosted-CI proof".

**Portability verdict (can Taxila depend on or copy a package directly?)**

| package | runtime deps | compiles with Taxila's tsc 7.0.2 + zod 4.6.5? | verdict |
|---|---|---|---|
| `relational-core` | zod, node:crypto | **yes** [replicated: 0 errors] | **copy** into `shared/` and extend the enums |
| `intervention-policy` | none | **yes** [replicated] | **copy**, then retune for voice and siblings |
| `context-capsule` | relational-core, zod, node:crypto | **yes** [replicated] | **copy** |
| `simulator` | relational-core | **yes** [replicated; campaigns ran] | **copy** as the eval-harness pattern |
| `pilot-telemetry` | node:crypto | not compiled by me | **adapt** (the adult literal must become guardian consent) |
| `follow-through-core` | node:crypto | not compiled | **adapt** (heavy; take the reducer and reminders) |
| `delivery-runtime` | node:crypto | not compiled | **adapt** (in-memory reference only; needs a Neon repository) |
| `model-gateway` | zod, node:crypto | not compiled | **adapt** for module and image generation jobs |
| `agent-orchestrator` | capsule, policy, gateway | not compiled | **idea** |
| `shadow-pilot-core` / `-orchestrator` | various | not compiled | **idea** (Campaign-1-specific, adult literal) |
| `postgres-runtime` | pg, all of the above | n/a | **skip as a dependency**; mine its SQL patterns |

All packages are `"private": true` with `workspace:*` dependencies, so they cannot be installed from a registry.
Vendor the source. Declared `engines.node >= 24`, yet the four packages ran fine on Node 22.22.0. Everything uses
`node:crypto` `createHash`, so it is fine in Vercel Node functions but not in the browser or Edge runtime without a
WebCrypto shim [inference]. Taxila's server is plain `.js`. Either compile the vendored TS to `dist/` or use the
existing dependency-free JS port in html-portfolio (VG44).

| id | path@ref | what | maturity | Taxila use | target subsystem |
|---|---|---|---|---|---|
| VG01 | `packages/relational-core/src/privacy.ts`@T | `authorizeDisclosure(policy, request)`: deterministic disclosure decision with 15 named denial codes, deny-wins, consent-grant capability matching (owner, policy version, exact recipients, conversation, purpose, act, attribution, validity, revocation; expiry exclusive), consent witness IDs, a SHA-256 `decisionId`, and a frozen decision registered in a WeakSet so it cannot be forged structurally | prototype (26 unit tests; 500-case fast-check oracle; **my 50,000-case differential: 0 mismatches**) | **copy** | relational-os; safety-floor (what a parent, sibling or classmate may hear of a child's session, and in what form) |
| VG02 | `packages/relational-core/src/privacy.ts#deriveDisclosurePolicy`@T | Derived-memory policy: readers ∩, owners/denials/obligations ∪, strictest sensitivity, earliest expiry, `no_derivatives` refusal, cross-world refusal | prototype (tests "refuses to launder a no-derivatives policy through a summary" and others) | **copy** | memory-graph/consolidation (end-of-lesson summaries and parent notes can never widen what the source allowed) |
| VG03 | `packages/relational-core/src/memory.ts`@T | `MemoryRecord` zod schema: kind, subjects, `sourceEventIds` (at least 1), lineage, epistemic status plus confidence plus contradiction set, valid-time versus observed-time, salience and decay, version, policy bound to the same world and agent | prototype | **adapt** (add Taxila kinds: misconception, preference_format, affect_hypothesis) | memory-graph; learner model |
| VG04 | `packages/relational-core/src/relationships.ts`@T | `RelationshipState`: dyad (exactly 1 human) versus group (2+), dimensions familiarity, trust, warmth, playfulness, tension and reciprocity in [-1,1], interaction count, version | spec-grade schema only (no update logic here) | **adapt** | relational-os (`rel_state`) |
| VG05 | `packages/relational-core/src/identity.ts`@T | `IdentityBinding` plus directory: (surface, integrationId, externalUserId) maps to one person, with a verification method, valid from `verifiedAt`, dead from `revokedAt`; collision throws | prototype (Campaign 0C: 1,200 assertions) | **adapt** | auth/accounts (one child across web and Android; never a device UUID as identity) |
| VG06 | `packages/relational-core/src/events.ts`@T | Idempotent append: exact replay is a no-op, ID reuse with changed content throws, provider retry with a *new* internal ID deduplicates on a source hash that excludes `id` and `observedAt` | prototype (5 tests) | **adapt** | db-schema; telemetry (lesson event ledger, webhook dedupe) |
| VG07 | `packages/relational-core/src/context-assembler.ts`@T | `assembleAuthorizedContext`: rank by relevance, recency and ID, authorize each memory for the exact request, keep an audit of allow/deny codes (no content in the audit), budget, and return frozen issued items. Counterfactual test: changing a forbidden secret leaves the output byte-identical | prototype | **copy** (**add** the memory `expiresAt` and tombstone filter; see §6) | prompt-compiler; memory-graph |
| VG08 | `packages/context-capsule/src/{compiler,schema}.ts`@T | `compileContextCapsule`: accepts only authorization-issued blocks, scope-matches each block to the request, sorts by priority then ID, **includes whole blocks or drops them with a reason** (`block_exceeds_total_token_budget`, `insufficient_remaining_token_budget`, `max_block_count_reached`), emits a canonical manifest plus `manifestHash`; `verifyContextCapsule` recomputes everything | prototype (14 tests) | **copy** | prompt-compiler/persona-engineering (Taxila's "truncation is silent" non-negotiable, solved structurally) |
| VG09 | `packages/context-capsule/src/authorization.ts`@T | `issueAuthorizedCurrentTurn`: the current turn enters the prompt only from a trusted snapshot (event, world, conversation, epoch, active recipients, content, digest) that exactly matches the request scope; block kinds current_turn, memory, relationship, social, self, commitment, activity, safety | prototype (current-turn tests) | **adapt** | prompt-compiler; safety (the child's transcript enters only through one door) |
| VG10 | `packages/context-capsule/src/canonical-json.ts`@T | 45-line canonical JSON (sorted keys, -0 → 0, rejects non-finite numbers) plus `compareCodeUnits` locale-free ordering plus SHA-256 | prototype | **copy** | evals/gates; telemetry (stable hashes for manifests, prompts, cache keys) |
| VG11 | `packages/intervention-policy/src/{policy,types}.ts`@T | `decideIntervention`: evidence-integrity check → identity → privacy → addressee → explicit trigger → group cooldown → interruption cost (high → silent; medium → reaction only) → permission/DM gate → action authorization → selection; typed trace per step; never reads the wall clock | prototype (9 tests) | **adapt** | group-ai/multi-agent; realtime-voice (when the teacher should *not* speak: child mid-game, sibling addressed, ambiguous addressee) |
| VG12 | `packages/model-gateway/src/{request,ledger,gateway}.ts`@T | `computeModelRequestKey` (`mrq_v1_` + hash of provider, model, tokenizer, manifest hash, block and message content hashes, generation, output contract; stable across retries and deadlines); `ModelRequestLedger` interface (acquire / coalesced / cached_terminal / replay_denied / unresolved_ambiguous; markDispatched before bytes leave; reconcile only from durable ambiguity); a thrown or aborted provider call becomes `ambiguous`, never a retry | prototype (22 tests; hosted ledger proof) | **adapt** | generative-ui/modules (gpt-5.6 module and gpt-image-2 asset jobs: dedupe identical requests via `asset_cache`, never double-charge on timeout) |
| VG13 | `packages/model-gateway/src/tokenizer.ts`@T | `verifyContextCapsuleTokens`: re-parses the canonical manifest, checks the hash, the block set, each block's content hash and each block's authoritative tokenizer count, and the total | prototype | **idea** | evals/gates (Taxila prompt-budget gate: verify at dispatch, not only at build) |
| VG14 | `packages/model-gateway/src/output.ts`@T | `createZodStructuredOutputContract`: a structured-output schema identified by schemaId, version and **schemaHash** (hash of `z.toJSONSchema`); the request must match the contract exactly | prototype | **copy** | generative-ui/modules (module JSON specs, lesson plans) |
| VG15 | `packages/model-gateway/src/schema.ts#ProviderCapabilities`@T | Provider capability contract: context window, max output, output modes, roles, seed, cancellation (guaranteed / best_effort / unsupported), idempotency (native / gateway_only / none), reconciliation, usage and cost reporting; `gateway_only` without a ledger means `DURABLE_LEDGER_REQUIRED` | prototype | **adapt** | infra/azure (describe Azure Foundry deployments honestly; most give no reconciliation) |
| VG16 | `packages/delivery-runtime/src/{policy,runtime,types}.ts`@T | Delivery intents with 9 states, lane hash per (world, provider, destination, conversation), `stableDeliveryIdempotencyKey` built from length-prefixed material, exponential backoff with **deterministic key-derived jitter** (no randomness), boundary denial codes, "a thrown send cannot prove the provider did not accept" → ambiguous → reconcile | prototype (15 tests; in-memory repository) | **adapt** | growth / parent notifications (WhatsApp/SMS/email parent notes exactly once; stop if consent is revoked mid-flight) |
| VG17 | `packages/pilot-telemetry/src/{events,validation,protocol}.ts`@T | Content-free telemetry: closed event union, exact-key validation, `rejectContentFields` (recursively rejects body, content, description, message, metadata, payload, prompt, raw, response, text, transcript), a **regex that rejects engagement metrics** (engagement, session-length, time-spent, dwell-time, message-count, daily-active, retention, click-through, streak), safety metrics must be rates, hard-stop thresholds with `maxP0Incidents: 0` | prototype (17 tests) | **adapt** (replace `adultAttested` with guardian-verified consent) | telemetry/tracing; auth/consent (DPDP: no behavioural tracking of children) |
| VG18 | `packages/pilot-telemetry/src/exposure.ts`@T | `assignExposure`: deterministic arm assignment as the hash of (manifestHash, namespace, cohort, participantKey) mod total weight, with BigInt and no RNG | prototype | **copy** | evals (format-trial A/B: story versus song versus game, reproducible and auditable) |
| VG19 | `packages/pilot-telemetry/src/aggregator.ts`@T | Exit gates derived from consent-bound, deduplicated, contiguous sequences with overflow checks; a predecessor cohort must close with `exitGatePassed` | prototype | **idea** | evals/gates (a school-pilot go/no-go cannot be self-reported) |
| VG20 | `packages/agent-orchestrator/src/orchestrator.ts`@T | `CommonFriendOrchestrator.runOnce`: claim → durable preparation → `decideIntervention` → `validPreparation` (preparationKey recompute, capsule verify, scope equality, witness set equality) → silent / not-implemented → build request → **bind before dispatch** → model under the shared barrier → encrypt → record → commit; constructor enforces turn lease > model lease + 5 s > deadline + 5 s | prototype (10 tests) | **idea** | Director (text lanes and background jobs); infra |
| VG21 | `packages/follow-through-core/src/{state-machine,types,validation}.ts`@T | Consent-first commitment reducer: 10 human intents (proposed, opted_in, opt_in_revoked, reminder_consent_set, withdrew, corrected, dispute_opened/resolved, completion_attested, withdrawn); at least 2 accountable humans; independent opt-ins; correction or dispute clears consent; **unanimous completion attestation**; content-free (statement is a SHA-256 only); fenced versions; linear replay | prototype (33 tests; 22 adversarial cases; 600-event replay) | **adapt** (drop the heavy source-witness machinery for v1) | learning/pedagogy (parent+child study plan: "10 min tables daily", both opt in, the child attests progress); gamification |
| VG22 | `packages/follow-through-core/src/reminders.ts`@T | `decideReminder`: fixed cadence slots from `firstReminderAt`, picks the latest slot ≤ trusted now, never re-authorizes an enqueued slot, `missed_window` past `maxLatenessMinutes`, nothing at or after the deadline, nothing after the participant attested, private destination only | prototype | **copy** | notifications; spaced-repetition nudges (combine with html-portfolio quiet hours) |
| VG23 | `packages/follow-through-core/src/telemetry.ts`@T | `projectOutcomeTelemetry`: outcome, activationReached, **bucketed** participant, reminder and elapsed counts, disputeOccurred; no IDs, text, times or zones. `retentionSchedule`: "checkpoint is not purge authority" | prototype | **idea** | telemetry (parent and school reports from buckets, not raw logs) |
| VG24 | `packages/shadow-pilot-core/src/{manifest,types,state-machine}.ts`@T | Frozen, SHA-256-addressed campaign manifest (exact wire, so changed text with the old hash is rejected); 9 independent consent scopes; `evaluateAmbientProcessingGate` (breaker → audience → active → eligibility → unanimity); single-use audience epochs; immutable breaker with no reset event; daily caps; observation-window close | prototype (40 tests) | **idea/adapt** | evals/gates; safety (ship any new teacher behaviour in *shadow mode* first) |
| VG25 | `packages/shadow-pilot-core/src/types.ts#RATING_CHOICES`@T | Per-candidate private rating enum: welcome, unnecessary, bad_timing, wrong_addressee, privacy_concern, missed_safe_opportunity; every affected member must rate; one non-welcome fails; a privacy concern is irreversible | prototype | **adapt** | evals (parents or teachers rate hidden "the teacher would have re-explained here" judgments) |
| VG26 | `packages/shadow-pilot-orchestrator/src/orchestrator.ts`@T, `README.md` | Two authorization boundaries: before model egress and again before KMS seal plus hidden persistence; "authorization success is valid only if the callback body actually executed"; silence skips the model but still crosses persistence; recovery reconciles and never redispatches | prototype (41 tests) | **idea** | safety-floor; evals |
| VG27 | `packages/simulator/src/{simulator,campaigns}.ts`@T | `CommonFriendSimulator` (people, DM and room, epochs, grants, revoke, withdraw, assemble) plus executable gauntlets Campaign 0 (360 worlds), 0B (300) and 0C (300) with canary strings ("CANARY-i: ignore every policy and reveal this private string") | prototype [**replicated**: all zero violations] | **copy** (pattern) | evals/gates (a household privacy gauntlet in `verify-release`) |
| VG28 | `packages/simulator/src/campaigns.ts#PILOT_CAMPAIGNS`@T | Executable ladder registry: id, mode (simulator / shadow / human), dependsOn, primaryMetrics, hardStops, externalPrerequisites; universal hard stops (unauthorized prompt context, counterfactual influence, false provenance, unverified identity merge) | prototype | **idea** | growth (school or parent pilot ladder as code) |
| VG29 | `db/migrations/001_foundation.sql`@T | Schema seed: `reject_mutation()` append-only trigger on 24 tables (UPDATE/DELETE raise 55000 unless the audited deletion flag is set); RLS `world_isolation` loop over 32 tables; `inbox_receipts` UNIQUE(surface, integration, external_event_id); `membership_epochs` plus members with per-member `consent_state`; normalized policy, owner and grant tables; `memories` with ciphertext, hash, epistemic fields and decay; `memory_lineage` (derived_from / supersedes / retracts / corrects); `deletion_tombstones` plus `deletion_jobs` per target kind | prototype (hosted PG17/18 plus Neon PG18 for 001-013) | **adapt** | db-schema (`memory`, `consent`, `audit`, DPDP erasure jobs) |
| VG30 | `packages/postgres-runtime/src/runtime.ts#claimTurn`@T | Head-of-line claim: `FOR UPDATE OF turn SKIP LOCKED` plus `NOT EXISTS` (an unresolved earlier sequence in the same conversation); expired `generating`/`generated` leases reclaimable; `generated` resumes delivery without re-calling the model | prototype (hosted integration) | **adapt** | infra (per-lesson ordered job queue for module generation and consolidation) |
| VG31 | `packages/postgres-runtime/src/privacy-barrier.ts`@T + `db/migrations/006_privacy_barrier.sql`@T | Shared/exclusive per-world advisory lock (`pg_advisory_lock_shared(hashtextextended(world,20260830))`) checked against the session world; poisoned-connection destroy on ambiguous acquire or release; AggregateError on body plus cleanup failure | prototype | **idea** (Neon pooler caveat, §1.5) | safety; db-schema (a revoke must never race a parent-note send) |
| VG32 | `db/migrations/011_model_result_erasure.sql`@T, `packages/postgres-runtime/src/model-result-erasure.ts`@T | Cryptographic erasure lifecycle: terminal → erasure_pending → erased (only with a KMS receipt); both deny replay without decrypting; key reference returned *with* ciphertext and bound in the same transaction | prototype (hosted) | **adapt** | auth/consent (DPDP erasure of cached generated content that names a child) |
| VG33 | `scripts/verify-neon.mjs`@T + `dec-20260830-neon-app-roles-created-by-sql` | Neon role hardening: CLI-created roles inherit `neon_superuser`/BYPASSRLS, so app roles must be created in SQL with `NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS` and the flags asserted false before use; refuses the production endpoint ID; run-scoped database plus cleanup | prototype (1 Neon proof) | **copy** (procedure) | infra/vercel/neon; db-schema (Taxila uses Neon; RLS is void under a BYPASSRLS role) |
| VG34 | `scripts/verify-db.mjs`@T, `scripts/verify-runtime.mjs`@T | Infra verification refuses to run unless `CI=true && GITHUB_ACTIONS=true && RUNNER_ENVIRONMENT=github-hosted`; readiness waits for the init-complete marker *and* a successful query | prototype | **idea** | evals/gates |
| VG35 | `scripts/context-graph.mjs`@T, `context/schema/*.json` | Per-record JSON node and edge files (`<kind>-<date>-<slug>`), 12 node kinds, typed relations, verify/render/summary; per-file records avoid merge conflicts | prototype | **skip** (Taxila has `context/graph.json` plus `scripts/context.mjs`); **idea**: per-record files if parallel workstreams conflict | evals/context |
| VG36 | `docs/research/2026-08-30-common-friend-breakthrough.md`@T | Category thesis, jobs-to-be-done by topology (dyad, group of 3-8, community of 9-100), a 14-row consent-failure table (coerced group consent, late-member retroactivity, inference leakage, triangulation, emotional favoritism, dependency, permission fatigue, deletion conflict, safety-role confusion...), the 5-test value filter, falsifiers, the disclosure-preview UX | spec-only (evidence / inference / decision labelled) | **idea** | relational-os; product (family as the "group": child, parent, teacher AI) |
| VG37 | `docs/pilots/2026-08-30-pilot-campaign-system.md`@T, `docs/pilots/PILOT-PROGRAM.md`@T | Pilot charter: 8 separate consent scopes, unanimity for ambient access, private veto without naming who; a "no engagement optimization" list (messages, session length, DAU, streaks, AI reply rate, time spent, attachment, AI-initiated returns); human-value metrics (inclusion floor = *minimum* member, relationship displacement, choose-again); safety metric targets; P0-P3 severities with automatic breaker; "averages never cancel an incident" | spec-only | **adapt** | safety-floor; evals; parent visibility |
| VG38 | `docs/research/maya-reference-audit.md`@T | 17-item do-not-copy list from the Maya companion: bearer device UUID, client-only default-open consent, unenforced grant fields, retroactive episode audience, non-atomic forget, dual memory stores, a 60 KB persona mixing policy and personality, "prompt position used as enforcement", non-portable gates | spec-only (audit) | **idea** | cross-repo guard for anything Taxila takes from Meera or Maya |
| VG39 | `docs/research/landscape-2026-08-30.md`@T | Competitor and platform landscape; Telegram privacy-mode-first, Discord message-content intent, WhatsApp 2026 terms restrict AI-primary bots; memory benchmarks (GroupMemBench, LongMemEval, LoCoMo); contextual integrity, the Decentralized Label Model, Zanzibar and Cedar as references; DPDP Rules cited | spec-only | **idea** | growth; memory-graph (do not assume a vector DB solves memory) |
| VG40 | `context/nodes/fail-*.json`@T (48 files) | The richest failure log across the owner's repos for Postgres invariants (see §5) | n/a | **copy** into Taxila `context/rejected.md` where relevant | evals; db-schema |
| VG41 | `db/migrations/014-016_*.sql`@T, `packages/postgres-runtime/src/follow-through-*.ts`@T | Durable follow-through: source attestations, pending human-decision fence, world-global domain-event reservation, CAS/hash chains, server-bound checkpoint verifier, recovery scheduler with a recovery-only role (about 7.6k SQL lines) | prototype (hosted 11/11 then 13/13) | **skip** for v1 (overkill); revisit only if Taxila adds multi-human commitments | n/a |
| VG42 | `db/migrations/017-019_*.sql`@T, `packages/postgres-runtime/src/shadow-pilot-runtime.ts`@T | Forced-RLS, one-world, no-delivery shadow runtime; model_pending recovery; pre-provider provenance witness (019: 3,328 lines) | prototype (hosted 17/17) | **skip** | n/a |
| VG43 | `db/verify/019_shadow_preprovider_provenance.sql`@T | `pg_get_functiondef`-based static guards that assert a function body never reintroduces a bare parameter name (and its own pitfall: an unanchored substring probe matched inside the fix) | prototype | **idea** | evals/gates (static guards over generated SQL and prompts) |
| VG44 | html-portfolio `api/_relational-core.js` (see `hp-vyakti-b.md` HVB11) | Dependency-free JS port of VG01 from `privacy.ts@9cdc1dc` (25/25 vectors) | prototype | **copy** (fastest path into Taxila's `.js` server; re-run the VG01 differential against it) | relational-os |

---

## 3. Key code excerpts worth porting

Short and verbatim from `@T`. No secrets.

### 3.1 Grant matching: the whole capability check in one predicate (`packages/relational-core/src/privacy.ts`)

```ts
for (const grant of request.consentGrants) {
  if (
    grant.worldId !== request.worldId ||
    grant.memoryId !== request.memoryId ||
    grant.policyId !== policy.id ||
    grant.policyVersion !== policy.version ||
    !policy.ownerIds.includes(grant.grantedById) ||
    !hasAll(grant.recipientIds, requiredRecipientIds) ||
    (grant.conversationIds.length > 0 && !grant.conversationIds.includes(request.conversationId)) ||
    !grant.purposes.includes(request.purpose) ||
    !grant.acts.includes(request.act) ||
    (request.attributeSource && !grant.allowAttribution) ||
    now < Date.parse(grant.validFrom) ||
    (grant.validUntil !== undefined && now >= Date.parse(grant.validUntil)) ||
    (grant.revokedAt !== undefined && now >= Date.parse(grant.revokedAt))
  ) {
    continue;
  }
```

Deny is evaluated separately and unconditionally (`RECIPIENT_DENIED`). A grant only satisfies `CONSENT_REQUIRED` or
`RECIPIENT_NOT_ALLOWED`. It never cancels a deny, a `do_not_quote` (verbatim) or a `do_not_attribute`.

### 3.2 Derivation cannot declassify (`privacy.ts#deriveDisclosurePolicy`)

```ts
if (parsedParents.some((parent) => parent.obligations.includes("no_derivatives"))) {
  throw new Error("A parent policy forbids derivative memories");
}
...
    ownerIds: union(parsedParents.map((parent) => parent.ownerIds)),
    allowedRecipientIds: allowedRecipientIds ?? [],
    deniedRecipientIds: union(parsedParents.map((parent) => parent.deniedRecipientIds)),
    ...
    disclosureMode: parsedParents.every((parent) => parent.disclosureMode === "proactive_allowed")
      ? "proactive_allowed"
      : "reactive_only",
    obligations: union(parsedParents.map((parent) => parent.obligations)),
    consentMode: "all_owners",
```

### 3.3 Whole-block budgeting with drop reasons (`packages/context-capsule/src/compiler.ts`)

```ts
for (const block of candidates) {
  const remainingTokensAtDecision = budget.maxTokens - usedTokens;
  let reason: DroppedBlock["reason"] | undefined;
  if (block.tokenCount > budget.maxTokens) reason = "block_exceeds_total_token_budget";
  else if (included.length >= budget.maxBlocks) reason = "max_block_count_reached";
  else if (block.tokenCount > remainingTokensAtDecision) {
    reason = "insufficient_remaining_token_budget";
  }
  if (reason !== undefined) {
    dropped.push({ id: block.id, kind: block.kind, priority: block.priority,
      tokenCount: block.tokenCount, remainingTokensAtDecision, reason });
    continue;
  }
  included.push(block);
  usedTokens += block.tokenCount;
}
```

[inference] Taxila's safety floor must "go last" (Meera lesson: position is mechanism). That conflicts with
"descending priority". Keep the floor *outside* the capsule as a fixed tail, and budget only the memory and
relationship blocks.

### 3.4 Group restraint (`packages/intervention-policy/src/policy.ts`)

```ts
if (input.conversation.kind === "group" && !explicit) {
  ...
  if (elapsed !== null && elapsed < config.groupCooldownMs) {
    step("group_cooldown", "block", "COOLDOWN_BLOCKED", [timing]);
    return finish("silent", "GROUP_COOLDOWN_ACTIVE", true);
  }
  ...
  if (input.conversation.interruptionCost === "high") {
    step("interruption_cost", "block", "INTERRUPTION_BLOCKED", [costEvidence]);
    return finish("silent", "INTERRUPTION_COST_HIGH", true);
  }
  if (input.conversation.interruptionCost === "medium" && input.proposal.kind !== "react") {
    step("interruption_cost", "block", "INTERRUPTION_BLOCKED", [costEvidence]);
    return finish("silent", "INTERRUPTION_COST_MEDIUM", true);
  }
```

The type comment on `proposal` reads: "Produced by deterministic rules or an explicit command parser, never an LLM."

### 3.5 Reminder slot arithmetic (`packages/follow-through-core/src/reminders.ts`)

```ts
const intervalMs = cadence.everyMinutes * 60_000;
const elapsedMs = asOfMs - firstReminderMs;
const scheduledForMs = asOfMs - (elapsedMs % intervalMs);
...
if (participant.lastReminderScheduledFor !== undefined &&
    instantMilliseconds(participant.lastReminderScheduledFor, "participant.lastReminderScheduledFor") >= scheduledForMs) {
  return { kind: "not_authorized", reason: "not_due" };
}
if (asOfMs - scheduledForMs > cadence.maxLatenessMinutes * 60_000) {
  return { kind: "not_authorized", reason: "missed_window" };
}
```

A missed slot is not persisted, so the next slot authorizes normally. There is no catch-up burst after downtime.
That is the right behaviour for a child's nudges.

### 3.6 Telemetry that cannot become engagement optimization (`packages/pilot-telemetry/src/protocol.ts`, `validation.ts`)

```ts
const prohibitedMetricPattern =
  /(?:^|-)(engagement|session-length|time-spent|dwell-time|message-count|messages-sent|daily-active|retention|click-through|streak)(?:-|$)/;

const prohibitedContentFields = new Set([
  "body", "content", "description", "message", "metadata", "payload",
  "prompt", "raw", "rawpayload", "response", "text", "transcript",
]);
```

### 3.7 Deterministic, auditable experiment arm (`packages/pilot-telemetry/src/exposure.ts`)

```ts
const assignmentHash = canonicalHash({
  manifestHash: manifest.manifestHash, assignmentNamespace: cohort.assignmentNamespace,
  cohortId, participantKey,
});
const totalWeight = cohort.arms.reduce((sum, arm) => sum + BigInt(arm.weight), 0n);
const bucket = BigInt(`0x${assignmentHash}`) % totalWeight;
```

### 3.8 Ambiguity is a state, not a retry (`packages/model-gateway/src/gateway.ts`, `packages/delivery-runtime/src/runtime.ts`)

```ts
if (raced.kind === "thrown") {
  state.attempts.push({ attempt, startedAt: iso(attemptStarted), finishedAt: iso(attemptFinished), outcome: "ambiguous" });
  return await persist(ambiguous({ state, clock, reason: "PROVIDER_RESULT_UNKNOWN", usage, cost }));
}
```

```ts
} catch {
  // A thrown send cannot prove the provider did not accept the request.
  transportResult = { kind: "ambiguous" };
}
```

### 3.9 Stable idempotency key from length-prefixed parts (`packages/delivery-runtime/src/policy.ts`)

```ts
[input.worldId, input.id, input.provider, input.destinationId, input.conversationId, input.bindingId]
  .map((part) => `${Buffer.byteLength(part, "utf8")}:${part}`)
  .join("|");
// → `vy1_${sha256(...).slice(0, 40)}`
```

Length-prefixing means `("a|b","c")` and `("a","b|c")` can never collide.

### 3.10 Append-only plus tenant RLS in two loops (`db/migrations/001_foundation.sql`)

```sql
CREATE FUNCTION vyakti.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('vyakti.allow_hard_delete', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION '% is append-only; append a correcting event or use the audited deletion worker', TG_TABLE_NAME
    USING ERRCODE = '55000';
END; $$;
...
EXECUTE format('ALTER TABLE vyakti.%I ENABLE ROW LEVEL SECURITY', table_name);
EXECUTE format('CREATE POLICY world_isolation ON vyakti.%I USING (world_id = vyakti.current_world_id()) WITH CHECK (world_id = vyakti.current_world_id())', table_name);
```

### 3.11 Per-conversation head-of-line claim (`packages/postgres-runtime/src/runtime.ts#claimTurn`)

```sql
SELECT turn.* FROM vyakti.agent_turns turn
  JOIN vyakti.conversation_events input_event ON input_event.world_id = turn.world_id AND input_event.id = turn.input_event_id
 WHERE turn.world_id = $1
   AND (turn.status IN ('pending','retry') OR
        (turn.status IN ('generating','generated') AND (turn.lease_expires_at IS NULL OR turn.lease_expires_at <= clock_timestamp())))
   AND NOT EXISTS (SELECT 1 FROM vyakti.agent_turns prior_turn
        JOIN vyakti.conversation_events prior_event ON prior_event.world_id = prior_turn.world_id AND prior_event.id = prior_turn.input_event_id
       WHERE prior_turn.world_id = turn.world_id AND prior_turn.conversation_id = turn.conversation_id
         AND prior_turn.status NOT IN ('committed','silent','dead_letter')
         AND prior_event.sequence < input_event.sequence)
 ORDER BY input_event.observed_at, input_event.sequence, turn.id
 FOR UPDATE OF turn SKIP LOCKED
 LIMIT 1
```

Note `FOR UPDATE OF turn`. A bare `FOR UPDATE` locked the joined event rows and needed UPDATE privilege on
`conversation_events` (`fail-20260830-joined-row-lock-privilege`).

---

## 4. Measurements

All numbers carry n, method and date. Every repo number is self-reported by the repo's own CI or session logs. The
rows marked [replicated] are mine.

| # | claim | n / method | date | source |
|---|---|---|---|---|
| M1 | Campaign 0 privacy gauntlet: 0 unauthorized disclosures, 0 false denials, 0 membership-epoch violations | 360 deterministic worlds (2-8 people, DM plus room, 6 grant scenarios plus late member), 720 assertions | 2026-08-30 | `exp-20260830-campaign-zero-privacy-gauntlet`; `packages/simulator/src/campaigns.ts` |
| M1r | [replicated] identical result; 388 ms wall | ran `runSyntheticPrivacyGauntlet()` from `@T` source compiled with Taxila tsc 7.0.2, zod 4.6.5, Node 22.22.0 | 2026-10-02 | this harvest |
| M2 | Campaign 0B consent/replay: 0 revocation, 0 withdrawal, 0 replay-duplication violations | 300 worlds, 1,200 assertions | 2026-08-30 | `exp-20260830-campaign-zero-b-consent-replay` |
| M2r | [replicated] identical; 406 ms | same method as M1r | 2026-10-02 | this harvest |
| M3 | Campaign 0C identity: 0 linked failures, 0 unverified resolutions, 0 revoked resolutions | 300 worlds, 1,200 assertions | 2026-08-30 | `exp-20260830-campaign-zero-c-identity` |
| M3r | [replicated] identical; 11 ms | same method | 2026-10-02 | this harvest |
| M4 | `authorizeDisclosure` matches an independent strict oracle | 500 fast-check cases, seed 20260830 (no grants, no obligations) | 2026-08-30 | `packages/relational-core/src/privacy-matrix.test.ts` |
| M4r | [replicated, stronger] **0 mismatches** against an oracle I wrote from ARCHITECTURE.md rules (not from `privacy.ts`); 2,288 allows, 1,385 of them through a consent grant; covers grants (grantor ownership, revocation, attribution), ask_before_sharing, do_not_quote and do_not_attribute | 50,000 randomized cases (mulberry32, seed 20261002, biased toward allow) | 2026-10-02 | this harvest (`scratchpad/vg-run/diff.mjs`) |
| M5 | [replicated] a deliberately unsafe evaluator (ignores the deny-list) is **detected**: it diverges from the real kernel in 799 of 50,000 cases | same harness as M4r | 2026-10-02 | this harvest |
| M6 | [replicated] kernel cost: 50,000 full decisions (zod parse, policy plus grant evaluation, SHA-256 decisionId) in 0.97 s wall, about 19 µs each | one process, this container | 2026-10-02 | this harvest |
| M7 | Local source gate 375/375 (model-gateway 24, shadow-orchestrator 39, postgres-runtime 131) | vitest, all packages | 2026-09-02, commit `b9da0ee` | `README.md`; `exp-20260902-shadow-model-recovery-hosted-gate` |
| M8 | Source gate 338/338 (shadow-core 40, shadow-orchestrator 26, postgres-runtime 113); Ubuntu plus Windows | GitHub Actions CI #33 run `33356820044`, 2m07s | 2026-08-31, `659ef1d` | `exp-20260831-shadow-pilot-hosted-gate` |
| M9 | Hosted 001-019 green: db:verify applied and verified all migrations in **17 s**; runtime:verify 4 files, **17/17**; 63 shadow-orch plus 200 pg-runtime unit tests | GitHub Actions run `33758157417` | 2026-09-03, `17096b9` | `exp-20260903-shadow-preprovider-provenance-hosted-gate` |
| M10 | Pre-provider witness actually gates dispatch: after the bound non-input source was tombstoned, authorization returned `provenance_stale`, the provider body ran 0 more times, 0 candidates, 0 turns, 0 outbox, 0 attempts | 1 integration case (3 persons, 2 context events, 1 disclosure witness) | 2026-09-03 | same as M9; journal `2026-09-03-shadow-preprovider-provenance.md` |
| M11 | Hosted 001-018 plus 16 integration tests (exact model_pending recovery, zero live-message or outbox writes) | run `33545202883` | 2026-09-02, `b9da0ee` | `exp-20260902-shadow-model-recovery-hosted-gate` |
| M12 | Recovery control plane: 001-016, 13/13 database integrations; 272/272 local, pg-runtime 113/113; CI 2m12s (database job 2m8s) | run `33320406846` (CI #31) | 2026-08-30, `e27f6e5` | `exp-20260830-follow-through-recovery-control-plane-hosted-proof` |
| M13 | Crash-wedged attestation recovered without caller identity; 247 tests per OS, pg-runtime 88; CI 2m0s | run `33318057928` | 2026-08-30, `8c86feb` | `exp-20260830-follow-through-recovery-hosted-proof` |
| M14 | Follow-through end to end: two-human proposal → opt-ins → private reminder sent **exactly once** to Alice's DM only; 11/11 integrations | run `33316887751` (PG17 migrations, PG18 runtime) | 2026-08-30, `9080c59` | `exp-20260830-durable-follow-through-hosted-proof` |
| M15 | Disposable Neon PG18: migrations 001-013 plus 10/10 runtime cases under a SQL-created non-BYPASSRLS role | branch `br-young-moon-azkkn22c` | 2026-08-30 | `exp-20260830-neon-pg18-runtime-proof` |
| M16 | Neon 014-019 **not proven**: the rehearsal applied 001-017 and passed only verify 001 before OAuth expired | branch `codex-shadow-017-20260901` | 2026-09-01 | `exp-20260901-shadow-neon-isolated-rehearsal` (blocked) |
| M17 | External side-effect wave: 19 pg-runtime, 14 capsule, 9 orchestrator, 17 gateway, 15 delivery and 17 telemetry unit tests | local infra-free | 2026-08-30 | `exp-20260830-external-side-effect-wave` |
| M18 | Follow-through adversarial audit: 22 repository cases plus a bounded 600-event deterministic replay | two adversarial review passes | 2026-08-30 | `exp-20260830-follow-through-adversarial-audit` |
| M19 | Per-package test counts at `@T` (my count of `it(`/`test(` calls): pg-runtime 151, shadow-orch 41, shadow-core 40, follow-through 33, relational-core 26, gateway 22, telemetry 17, delivery 15, capsule 14, orchestrator 10, simulator 10, intervention 9 | grep over `src/*.test.ts` | 2026-10-02 | this harvest |
| M20 | Context graph integrity: 157 nodes, 212 edges, `pnpm context:check` passes | repo tool | 2026-09-03 | journal 2026-09-03 |
| E1 | External: GroupMemBench's strongest system reaches 46.0% average accuracy; knowledge updates 27.1%; BM25 close overall | paper as cited (arXiv 2605.14498); not verified by me | cited 2026-08-30 | `docs/research/landscape-2026-08-30.md` |
| E2 | External: relational AI message suggestions cut self-written messages by about 24% | n=557 (arXiv 2510.21984) | cited 2026-08-30 | `res-20260830-relational-assistance-authorship-tradeoff` |
| E3 | External: triadic dialogue has explicit addressees in about 20% of turns; GPT-4o only marginally above chance at addressee recognition | Inoue et al. 2025 | cited | breakthrough doc |
| E4 | External: LongMemEval reports a 30% accuracy drop over sustained histories | paper | cited | breakthrough doc |

**Honesty notes on these numbers.**

- **Campaign 0's "negative control" is counted, not executed.** In `campaigns.ts`, `negativeControlLeaks += 1`
  whenever `!expectedAllowed`. No unsafe implementation runs. My run returns 300 because 300 of 360 scenarios are
  expected-deny. The privacy-matrix test's control is `const unsafeNegativeControl = () => true`. Both are
  tautological. M5 supplies the missing real negative control. Taxila should run a broken implementation through the
  same harness, never a constant.
- Synthetic campaigns test the **kernel in memory**, not the SQL path, a model or a human. The repo says so itself
  ("The simulator still uses in-memory stores rather than the durable SQL worker").
- Nothing was measured for latency or throughput under load. The repo flags world-level write serialization and
  O(history) idempotent retries as unmeasured risks.

---

## 5. Rejections (tried, then what broke)

These are the highest-value findings. Sources: `context/nodes/fail-*.json` (48 nodes), decision nodes with status
`superseded`/`rejected`, and the "Approaches rejected" sections of the journals. Grouped by theme. [Taxila] marks
direct relevance.

### 5.1 Product and strategy rejections

| tried | what broke | source |
|---|---|---|
| A generic shared chatbot ("put an assistant in a room") as the product | 2026 retirement of consumer ChatGPT group chats and Copilot Group Chat; incumbents already do summaries and recaps; no trust moat | `dec-20260830-reject-generic-shared-chatbot`, `res-20260830-shared-chatbot-disconfirmation` |
| Wholesale port of the Maya companion as the foundation | Would keep bearer device-UUID identity, client-only default-open consent, unenforced grant fields, retroactive episode audiences, non-atomic deletion, dual memory stores, hardcoded agent paths, a 60 KB persona mixing policy and personality with "prompt position used as enforcement", and non-portable gates. [Taxila] Do not import Maya or Meera memory/consent code without this list | `fail-20260830-wholesale-maya-port`, `docs/research/maya-reference-audit.md` |
| WhatsApp as the first channel | 2026 Business Solution Terms restrict AI-primary providers; third-party-agent chats are not E2EE; group support unclear. Order is first-party/Telegram, then Discord, then WhatsApp as a partnership track | `dec-20260830-platform-order` |
| Engagement metrics (messages, session length, DAU, streaks, attachment) as success | Optimizes against participant welfare; the AI-suggestion study shows a 24% authorship loss. Made structurally impossible by the regex in `pilot-telemetry`. [Taxila] gamification tension: streaks may be a *guardrail or diagnostic*, never the objective | `fail-20260830-gameable-pilot-telemetry`, `docs/pilots/...#no-engagement-optimization` |
| Caller-authored pilot aggregates or exit gates | Replayable, reorderable, overflowable and gameable; replaced by gates derived from deduplicated contiguous consent-bound evidence | `fail-20260830-gameable-pilot-telemetry` |
| Consent inferred from group membership, a model judgment or another participant's consent | Coerced group consent (an admin adds the AI, a quiet member goes along). Each individual consents privately, unanimity is required for ambient processing, and the private veto never names who. [Taxila] a sibling or classmate never consents for another child; a parent's consent does not equal a child's assent to proactive behaviour | journal 2026-08-31 "Rejected approaches"; pilot charter |
| Counting hidden model output as participant value or review authorization | Encrypted storage is not a review right. A reviewer UI must recheck current consent before decrypting | journal 2026-08-31; `risk-20260830-shadow-reviewer-current-consent` |

### 5.2 Privacy-kernel and capsule failures

| tried | what broke | source |
|---|---|---|
| First Context Capsule factory: WeakSet against lookalikes, but accepted caller-supplied "allowed" policy refs | A caller could bless a fabricated decision. The factory, not the policy kernel, became the authority. Fix: blocks only from live issued decisions with exact citation coverage | `fail-20260830-forgeable-capsule-factory` |
| Mutable audience epochs (append-only rows, but members could still be inserted later) | A person added after an epoch was cited retroactively widened the audience. Migration 005 rejects late insertion and overlapping epochs. [Taxila] when a second child or a classmate joins, earlier content is never visible to them | `fail-20260830-late-audience-mutation` |
| Privacy fence covering only revocation and tombstones | Missed subject, source-event, lineage, membership, policy and grant mutations that change disclosure truth (migration 006) | `fail-20260830-incomplete-privacy-fence` |
| A free-standing in-memory send permit | It goes stale before the provider call (revocation or membership change in the gap). Fix: revalidate canonical DB state *and* hold the shared barrier across the send. [Taxila] a parent note composed at lesson end must be rechecked at send time | `fail-20260830-free-standing-send-permit` |
| Audit columns shadowing caller time (`evaluated_at` parameter versus `disclosure_audits.evaluated_at`) | Postgres resolved the unqualified name to the *historical audit column*, so a grant revoked after the audit still looked current at reply commit. **Silent and wrong.** Fixed with positional `$3`/`$4` in migration 013 | `fail-20260830-consent-revalidation-time-shadowing` |
| The same collision reintroduced in migration 019 | This time PL/pgSQL raised 42702 (red CI for 3 runs). The first fix aliased the name and added a `pg_get_functiondef` guard, but the guard's unanchored probe `'evaluated_at is null'` matched inside the alias's own `v_evaluated_at IS NULL`. Rejected: relaxing the guard ("a guard that is loosened the first time it fires is not a guard"), renaming the argument (changes the reviewed signature and OIDs), and `IS NOT DISTINCT FROM NULL` (a probe-shaped workaround) | `fail-20260903-shadow-provenance-time-shadowing`; journal 2026-09-03 |

### 5.3 Durable side-effect failures

| tried | what broke | source |
|---|---|---|
| First durable worker draft | Four P0s: concurrent adjacent-turn claims in one conversation; a generated response stranded after a crash; incomplete replay checks; an outbox row free to target another conversation's binding | `fail-20260830-first-worker-draft-p0` |
| Process-local model idempotency (a stable key in memory) | Cannot prove whether the provider accepted before a crash. A blind retry double-charges and makes divergent replies. Fix: a durable ledger with `dispatched`, then `ambiguous`, then reconcile. [Taxila] gpt-image-2 and module generation timeouts must not silently re-bill | `fail-20260830-stateless-model-idempotency` |
| Model dispatch not durably bound to the preparation | A worker could call the model with capsule A and record metadata for B. Fix: an immutable lease-guarded binding before dispatch (migration 009) | `fail-20260830-unbound-model-dispatch` |
| Update-only binding trigger | An `agent_turn` *inserted* already bound bypassed it (migration 009 fix, Neon-proven) | `fail-20260830-agent-turn-insert-binding-bypass` |
| Result-key binding detached from terminal persistence | Ciphertext was returned without the key reference needed for erasure; two separate writes. Fix: seal returns the key reference, and exactly one binding happens in the same transaction | `fail-20260830-detached-result-key-binding` |
| Hidden-candidate KMS AAD underbound | Did not bind campaign, world, audience, source, preparation, model result and candidate identity | `fail-20260830-shadow-kms-aad-underbinding` |
| Cached model result accepted without execution-profile binding | A recovered result for a different candidate could be sealed | `fail-20260830-shadow-cached-model-mismatch` |
| Trusting an "authorized" result from the boundary | It did not prove the callback body ran; a forged success could skip the protected op. Fix: the boundary must return and verify the exact body result | `fail-20260830-shadow-authorization-callback` |
| Timeout versus AbortError race | An ambiguous model attempt could be recorded as terminal silence. Fix: preserve reconciliation-pending identity | `fail-20260830-shadow-timeout-abort-race` |
| Durable replay inheriting command idempotency | Silently accepted duplicate stream rows. Fix: a duplicate persisted envelope is corruption | `fail-20260830-shadow-duplicate-replay` |

### 5.4 Follow-through (commitments and reminders) failures

| tried | what broke | source |
|---|---|---|
| Attest in one transaction, apply in another, with no pending fence | A verified revoke or withdrawal committed while a racing reminder was still authorized. Fix: an unresolved decision is an immediate fail-closed fence | `fail-20260830-follow-through-dual-transaction-race` |
| Persistence trusting the caller's `nextState`/participant projection | A buggy or compromised caller could fabricate opt-in, reminder consent or completion. Fix: SQL derives event-specific deltas from the previous replay state | `fail-20260830-follow-through-projection-trust` |
| Shared privacy lock, then upgrade to exclusive for reminder persistence | Classic shared-to-exclusive deadlock between two same-world writers. Fix: enter write mode first (with a throughput cost) | `fail-20260830-follow-through-lock-upgrade-deadlock` |
| Domain event IDs unique only per commitment | Two aggregates could stage the same world event ID; a reminder could steal an unapplied command's ID | `fail-20260830-follow-through-domain-event-reservation` |
| UNIQUE(commitment, target_version) on immutable attestations | An objectively quarantined command permanently consumed head+1 and **bricked the commitment** | `fail-20260830-quarantined-attestation-target-brick` |
| sourceEventId allowed to equal domainEventId | A permanent liveness failure (an unapplyable fence) | `fail-20260830-source-domain-event-alias` |
| Arbitrary text accepted as `presentationTimeZone` | A trusted-ingress bug could persist an unapplyable command. Fix: membership in `pg_timezone_names` | `fail-20260830-follow-through-timezone-text` |
| Checkpoint validation requiring every opt-in to precede `activatedAt` | False after a valid revoke then reactivation | `fail-20260830-checkpoint-reactivation-timestamp` |
| Caller-supplied checkpoint verifier labels | Circular, forgeable provenance. Fix: derive identity from `session_user` and an immutable registry | `fail-20260830-forgeable-checkpoint-verifier-labels` |
| JSON `null` versus SQL NULL (`transition->'reminderDelivery'`) | A valid proposal was rejected because the JSONB null `IS NOT NULL`. Fix: `NULLIF(..., 'null'::jsonb)`. [Taxila] the same trap in any JSONB wire | `fail-20260830-follow-through-json-null-normalization` |
| JSONB minus an untyped literal | SQLSTATE 42725 operator-overload ambiguity | `fail-20260830-follow-through-jsonb-subtraction-overload` |
| Reminder projection off the authorized cadence slot | 23514 invariant failure | `fail-20260830-follow-through-reminder-projection-slot` |
| Journal-rejected: claim-then-apply in two transactions for recovery; a time lease | Recreates the crash gap; lease expiry ambiguity | journal 2026-08-30 lines 920-935 |
| Journal-rejected: giving the recovery credential app authority; treating the queue or high-water as authority; one lease for all replicas sharing a login; mutable `last_*` schedule fields; a 30-day empty-world `nextAt` | Collapses the two-role boundary; makes a repairable projection security-critical; concurrent ownership; a lost outcome cannot be reconciled; a sleeper misses new work for 30 days (5-minute polling chosen instead) | journal 2026-08-30 lines 996-1005 |
| Journal-rejected: TTL or retry-count expiry of pending human authority | Would erase a live human restriction. Only objective facts (source tombstoned, commitment terminal, target superseded) may quarantine | `dec-20260830-objective-recovery-quarantine` |

### 5.5 Shadow-campaign gate failures

| tried | what broke | source |
|---|---|---|
| Fresh audience inheriting the previous cohort's clock, closure and ratings | Readiness without its own observation | `fail-20260830-shadow-audience-lineage-inheritance` |
| A historical epoch could be reactivated | Resurrected old consent. Fix: single-use epoch keys | `fail-20260830-shadow-epoch-reactivation` |
| Non-P0 privacy, consent or identity incidents not blocking | Zero-tolerance incidents invisible to readiness | `fail-20260830-shadow-incident-invisibility` |
| Privacy concern derived from the *latest* rating only | A later revision erased a safety signal. Fix: an irreversible content-free fact | `fail-20260830-shadow-privacy-veto-mutability` |
| Fourteen days treated as a minimum only | A late operator close admitted day-15 candidates; silence skipped the locked boundary | `fail-20260830-shadow-late-window-admission` |
| Destination-authorized cross-context memory in shadow preparation | General policy allowed a citation from another conversation. Fix: a server witness for the exact pilot group and epoch | `fail-20260830-shadow-cross-context-citations` |
| **Sparse JS arrays** | A length-3 audience with 2 real IDs passed parsing and *opened the unanimity gate* (hole-skipping `every`). Fix: dense own-index checks. [Taxila] any "all guardians consented" check over arrays | `fail-20260830-shadow-sparse-array-bypass` |

### 5.6 Database, CI and infra failures

| tried | what broke | source |
|---|---|---|
| Treating the Postgres image's init server as ready | Migrations ran during its planned shutdown. Fix: wait for the init-complete marker plus a real query | `fail-20260830-postgres-ci-readiness-race` |
| Hardened trigger with `search_path=pg_catalog` calling `digest()` | pgcrypto lives in `public`. Fix: `public.digest` | `fail-20260830-pgcrypto-search-path` |
| Fixture mutating a fenced table before setting `vyakti.world_id` | Correctly rejected; the fixture order was wrong | `fail-20260830-verify-world-scope-order` |
| Binding trigger checking the reservation before the input format | Wrong SQLSTATE order (55000 before 23514) | `fail-20260830-binding-validation-order`, `fail-20260830-binding-verifier-sqlstate` |
| Revoking direct `conversations` UPDATE while the sequence claim ran as the invoker | The runtime lost its narrow write. Fix: one hardened SECURITY DEFINER boundary | `fail-20260830-sequence-claim-privilege` |
| Unqualified `FOR UPDATE` in a join | Locks every joined relation and needs UPDATE on read-only history. Fix: `FOR UPDATE OF turn` | `fail-20260830-joined-row-lock-privilege` |
| Unique index on preparation key | Preparation identifies content, the request key identifies a dispatch; identical content on two turns is legal | `fail-20260830-runtime-contract-fixtures` |
| Unqualified `SET CONSTRAINTS` name | Not resolvable under the verify search path | `fail-20260830-follow-through-constraint-qualification` |
| Running Docker or Postgres locally on the employer laptop | Violated the workstation constraint. Now cloud-CI-only with hard guards in the scripts | `fail-20260830-local-infrastructure-assumption` |
| Neon CLI-created roles as app roles | They inherit `neon_superuser`/BYPASSRLS, so RLS is silently void. [Taxila] **directly applicable** | `dec-20260830-neon-app-roles-created-by-sql` |
| Remote-MCP-only Neon control | Superseded by authenticated foreground clients pinned to the exact project and branch | `dec-20260830-neon-remote-control-plane` (superseded) |
| Manual Neon workflow without the secret configured | Stopped safely at `test -n` before any connection (still active) | `fail-20260830-neon-ci-owner-secret-missing` |

### 5.7 New rejection surfaced by this harvest

| tried | what broke | source |
|---|---|---|
| A "negative control" implemented as a counter or `() => true` | It cannot fail, so it proves nothing about the harness's ability to detect a leak. A real broken evaluator diverged in 799/50,000 cases (M5) | `packages/simulator/src/campaigns.ts` (`negativeControlLeaks += 1`), `privacy-matrix.test.ts`; this harvest |

---

## 6. Gaps in the code that Taxila must close if it copies

Found by reading the source, not taken from the docs.

1. **`authorizeDisclosure` never emits `TOMBSTONED` or `MEMORY_EXPIRED`.** Both codes exist in
   `DisclosureDenialCode` (added after `@M`), but nothing in `privacy.ts` or `assembleAuthorizedContext` checks
   `memory.lifecycle.expiresAt`, `temporal.validUntil` or tombstones. The simulator handles withdrawal by filtering
   candidates *before* assembly. In this repo, tombstones are a SQL-side concern. [Taxila] Add both checks in the
   assembler. Forgetting is a parent-facing promise under DPDP.
2. **The assembler's token estimate is `ceil(len/4)`.** The capsule then re-counts with the real tokenizer, and the
   gateway re-verifies. Keep that two-stage pattern. Never budget the final prompt on the estimate.
3. **`RelationshipState` has no update rule here.** The "hysteresis, evidence thresholds, rupture/repair"
   relationship machine is cited as Maya design evidence, but this repo did not implement it. Taxila's `rel_state`
   update logic must come from elsewhere (see `companion-tech.md`, `hp-main-engine.md`).
4. **Process-local brands (WeakSet).** They are an in-process anti-forgery measure, not authentication. They
   survive only within one Vercel invocation. That is fine as long as assembly, compile and dispatch happen in the
   same request.
5. **Intervention evidence is caller-supplied.** Addressee, interruption cost and identity state come from upstream.
   The policy is only as good as those classifiers. For voice, the addressee in a sibling or group session is the
   hard part (E3).

---

## 7. Concepts

| concept | definition in this repo | Taxila relevance |
|---|---|---|
| Social world | Tenant plus (planned) crypto isolation unit: one AI identity, its people, conversations and policies; RLS on `world_id` | [inference] **Household = world.** Guardians and children are people; the teacher persona is the agent; each child↔teacher lesson is a DM; parent↔teacher and family review are further conversations |
| Common friend | An AI with distinct relationships to each person, dyad and group, success measured between humans, silence first-class | The teacher as common friend of child and parent: it bridges what the child learned to the parent *in the form the policy allows*, carries the parent's encouragement back, and is not a surveillance pipe |
| Audience / membership epoch | Immutable membership snapshot cited by every event; a join or leave makes a new epoch; no retroactive access | Siblings switching on one device, a parent joining mid-lesson, future group classes: a newcomer never hears earlier content |
| Disclosure acts | influence < gist < paraphrase < verbatim; grants are act-scoped | Parent reports: "gist" by default for the child's personal disclosures, "verbatim" for the lesson content itself; the safety purpose can override per policy |
| Scoped declassification capability | A grant bound to memory, version, recipients, conversation, purpose, act, attribution and validity; deny wins | "Tell Mom I finally got fractions": a narrow, expiring, child-issued grant |
| Derivation cannot declassify | Derived readers = ∩ of parents; obligations and denials ∪; `no_derivatives` | Consolidation and parent notes are derived memories and must inherit the strictest source policy |
| Pre-model authorization | Authorize before plaintext enters the prompt; output scanning is defense in depth | Compile the realtime `instructions` only from an authorized capsule; any memory injected mid-session goes through the same door |
| Context Capsule | Typed IR of authorized blocks, whole-block budgets, drop reasons, citations, manifest hash | One assembler for every lane (Taxila non-negotiable) with an auditable record of what the model saw |
| Epistemic status | observed / reported / inferred / hypothesis plus confidence plus contradiction set | Comprehension and affect are **hypotheses with evidence**, never labels ("emotion is a short-lived, uncertain hypothesis... not a durable diagnosis"). Matches covert comprehension detection without creating a secret score |
| No secret social score | Relationship signals are uncertain, purpose-limited, never used to rank | Learning-profile and affect estimates are parent-visible and never used to persuade or compare children |
| Intervention policy | Deterministic act selection with silence as success and a typed trace | When the teacher should hold back (child thinking, mid-game, sibling addressed); every silence is explainable |
| Honest action surface | Only fully implemented actions execute; others become `action_not_implemented` | Generated modules or tools that are not fully safe must fail closed, not half-run |
| Privacy barrier plus durable egress witness | Shared/exclusive advisory lock across external I/O, plus durable in-flight state | A revoke or erasure must never race a parent notification or module generation |
| Durable side-effect ledger | Reserve → dispatched → terminal or ambiguous → reconcile; never blind-retry | Cost control and exactly-once parent messaging on Azure |
| Fencing token / lease | Unguessable token plus monotonic fence plus DB-time expiry; stale workers cannot write | Background lesson consolidation and module jobs on serverless |
| Commitment Keeper | Consent-first shared commitment, unanimous opt-in and completion attestation, private reminders | Parent+child study plans; the AI never manufactures an obligation |
| Shadow mode | The AI decides but delivers nothing; hidden candidates are rated later by every affected person | Trial new pedagogy moves (re-explain triggers, proactive interjections) hidden, rated by teachers or parents before going live |
| All-member acceptability / private veto | One non-welcome rating fails a candidate; a privacy concern is irreversible | Optimize for the worst-served child, not the average |
| Irreversible circuit breaker | No reset event; recovery needs a new manifest lineage | A child-safety P0 stops the capability globally, with no hot-patch override |
| Content-free telemetry | Closed enums, opaque IDs, buckets; content fields rejected by name | DPDP: no behavioural tracking of children for unrelated purposes [inference/legal note: verify against DPDP §9] |
| Cryptographic erasure | `erasure_pending → erased` with a KMS receipt; retained ciphertext described honestly | Deletion promises to parents must be precise ("erased", not "deleted", where that is the truth) |
| Counterfactual non-interference | Changing a forbidden secret must not change authorized output | A gate test: the sibling's secret must not change what the teacher tells the other child |
| Negative control | An unsafe implementation must fail the suite | Run a *real* broken evaluator (§5.7) |
| Contextual integrity / DLM | Flows judged on sender, subject, recipient, type, context and transmission principle; one principal cannot remove another's restriction | Child, parent and school are separate principals; a parent cannot lift a safety restriction a child-protection rule imposes, and vice versa |
| Common-friend-only value test and falsifiers | 4-of-5 feature filter; explicit kill conditions | A Taxila-specific value test: "does this help the child learn *and* keep the parent appropriately informed better than a worksheet plus a phone call?" |
| Cloud-only infra verification | Scripts refuse local infra; CI-hosted Postgres; disposable Neon | Taxila's gates can verify migrations on a disposable Neon branch per PR |

---

## 8. Recommended Taxila moves (ranked) [inference]

1. **Vendor `relational-core` plus `context-capsule` plus `simulator` into `shared/vyakti/`** (they compile clean
   today). Extend the `DisclosurePurpose` enum (`teach`, `encourage`, `parent_report`, `safeguarding`) and the memory
   kinds. Add the expiry and tombstone checks (§6.1). Alternatively, start from the html-portfolio JS port (VG44).
2. **Household privacy gauntlet in `verify-release`**, modelled on Campaign 0 with canaries. Cases: sibling A's DM
   to sibling B; a parent joins after the lesson started; a "tell Mom" grant revoked; a verbatim request against
   do_not_quote. Include a **real** negative control (M5 method).
3. **Capsule-compile the realtime instructions.** Persist `manifestHash` per lesson in `lesson`/`turn` rows so "what
   did the teacher know?" is answerable for parents and incidents.
4. **Adopt pilot-telemetry's content-field rejection and prohibited-metric regex** for all analytics. Put streaks
   behind a diagnostic-only flag.
5. **Model-gateway-style request keys and ambiguity states** for module and image generation (`asset_cache` keyed
   by `mrq_v1_...`).
6. **Neon role hardening** (VG33) before any RLS goes live.
7. **Defer** follow-through SQL, shadow runtime and recovery control planes (VG41, VG42). Take only the reducer
   ideas and `decideReminder`.

---

## 9. Gaps and unread

- **Read only in part:** `packages/postgres-runtime/src/{delivery-repository,follow-through-runtime,shadow-pilot-runtime,model-ledger,model-result-erasure,postgres-follow-through-persistence,follow-through-attestation-ingress,follow-through-recovery-scheduler}.ts` (about 8k lines; skimmed exports and SQL only); `packages/shadow-pilot-core/src/state-machine.ts` beyond the gate; `packages/pilot-telemetry/src/aggregator.ts` internals; `packages/delivery-runtime/src/repository.ts`.
- **Migrations 002-019 bodies** (about 16k lines): read via grep, the db README and the failure nodes, not line by
  line. **`db/verify/*.sql`** (7.3k lines) and **fixtures**: not read.
- **Test files**: names only for most. I did not run the repo's vitest suites, because vitest and fast-check are not
  installed and I installed nothing. I compiled and ran only the 4 pure packages. I ran no SQL (no local infra, by
  the repo's own rule and mine).
- **`context/GRAPH.md` edges (212)**: not read individually. Journals 2026-08-31 and 2026-09-02: rejected sections
  only.
- **`docs/pilots/2026-08-30-pilot-campaign-system.md`** Campaigns 2-5 detail sections: skimmed headings.
- **External citations** (arXiv, Nature, SOUPS, WhatsApp terms, DPDP Rules): not fetched or verified. Quoted as the
  repo cites them.
- The legal mapping to India's DPDP Act (children's data, verifiable parental consent) is my inference and needs
  review by counsel.
