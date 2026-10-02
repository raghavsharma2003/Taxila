# Harvest: html-portfolio, the multimodal + Group AI layer (segment hp-multimodal-group)

**Repo:** `/home/user/html-portfolio`. It was read-only. Every read used `git show`, `git log` or `git diff` against refs. Nothing was checked out.
**Branch read:** `origin/codex/multimodal-layer-20260927`.
- Tip: `b514595f` (2026-10-01 22:37 +0530, "docs: record verified group layer checkpoint and open launch gates").
- Last tested code hash: `808ad32f`. The tip is a context-only commit on top of it.

**Delta read:** `origin/codex/handoff-history-20260909...origin/codex/multimodal-layer-20260927`.
- Merge base: `31833cdf`.
- 23 commits, 2026-09-09 to 2026-10-01.
- 111 files, +21,211 / -6,977 lines.
- `context/graph.json` alone accounts for about 14k of those lines.

**Shorthand:** `@MM` = `origin/codex/multimodal-layer-20260927@b514595f`. Line numbers refer to `@MM`. A citation like `context/rejected.md#id` points at the tip file.

**Secrets:**
- No secret file is tracked at `@MM`.
- Only `api/_config.example.js` (comments changed in the delta) and `api/_channel-secrets.js` (a seam with no values) exist.
- The CI SQL job uses a literal throwaway password, `synthetic-ci-only`, for an ephemeral GitHub service container. It is not a credential to anything.
- I did not open any gitignored `api/_config.js`.

**Scope note on "Gurukul":** this branch's research docs live under `docs/gurukul/research/`. That is only a folder name in this repo. The product here is **Vyakti**, the creator-AI platform, plus its **common-friend Group AI**. Gurukul workstream branches are covered by other segments.

---

## 1. What this is

### 1.1 The branch in one paragraph

`codex/multimodal-layer-20260927` is Codex's continuation of the Vyakti platform after the 2026-09-09 handoff. It has two halves:

1. **Multimodal evidence layer (Sep 27-29).** Stored owner evidence now reaches the claim extractor and the owner's review screen with honest modality metadata:
   - kinds: text, document (pdf/docx), and audio/video transcript;
   - locators: UTF-16 character ranges or transcript millisecond windows;
   - explicit limitations, such as "transcription may be incorrect" and "visual content not observed".

   It fixed one real bug: `Number(null)` turned absent document times into a zero timestamp. Image regions are explicitly refused as semantic evidence. **There is no image understanding and no vision model in this branch.**
2. **Group AI hardening (Sep 29 - Oct 1).** This is the "verified group layer checkpoint". The user asked Codex to "continue until the Group AI layer is ready" and to make it "reusable for other projects". Codex produced:
   - a portable checkpoint kernel (`api/_group-runtime`);
   - a portable attributed source selector (`api/_group-recall`);
   - truthful delivery outcomes;
   - a known-consent source-time admission fence;
   - hosted synthetic-PostgreSQL SQL proof (50 groups);
   - five research/audit reports;
   - and a very large amount of CI-receipt bookkeeping.

The tested hash `808ad32f` passes the release gate 24/24 on Node 22 and Node 24. It also passes SQL50 and the APK build.

**Its own conclusion is explicit:**

> "This software slice is accepted; the whole Group AI product is not ready." (`context/STATE.md@MM` line 9)

### 1.2 What "Group AI" means here, precisely

There are **two different products that both say "Room"**. The branch's first Group AI decision is to never confuse them (`context/decisions.md#groupai20260929-distinct-surface-authority`).

| Path | Entry | What it is |
|---|---|---|
| **Common-friend group (the "Group AI")** | `/api/tg`, `/api/discord`, `/api/whatsapp`, then `api/_surface.js::dispatch`, then `onGroupMessage`, then `api/_room.js` | One AI persona (Meera/Maya, or a creator's AI) is a *member of a real multi-human group chat*. It runs on Telegram first, for up to 6 linked humans plus the bot. It is a mutual friend who was "in the room with you" and so has a right to remember the room. The research corpus calls it "the shared-memory companion". |
| Creator-private follower Room | `/api/room` through `api/_room-surface.js` (`vy_room`, `vy_room_follower`) | One follower's private 1:1 relationship with a creator's AI. Its tests **do not** authorize the shared-group path. |

How the common-friend Group AI works in code:

- **Consent is a platform act.**
  - The bot runs with Telegram privacy mode on.
  - A group admin promoting the bot to admin *is* the room's read consent (`onBotMembership`, `_surface.js:1018`).
  - At that moment an **app-voiced room card** is posted. It is deterministic Hinglish, never model text. It states five facts (`ROOM_CARD`, `_surface.js:215`):
    - she also talks 1:1 with members;
    - DM content never comes here;
    - room memory is SHARED and only fully disappears when everyone asks;
    - `/chup`, `/chup me` and `/bolo` control quiet;
    - `/bhool` withdraws your share.
- **No person row means no persistence.**
  - A member must "link" by tapping a deep link. That opens a DM, binds identity and sets `vy_group_member.linked_at`.
  - Unlinked members' words are never written anywhere.
  - Storage needs **quorum >= 2 linked members** (`QUORUM`, `_room.js:53`).
  - Rooms are capped at 6 (`ROOM_MEMBER_CAP`, `room.ts:90`; `HUMAN_CAP`, `_group-audience.js:25`).
  - **Known minors are refused a binding outright** (`linkSurfacePerson`, `_room.js:144-176`, "adult-default").
- **Every turn gets an immutable-audience episode.** Each human turn creates a fresh `vy_episode` whose participant set is the exact current linked membership. It is written in one SQL statement (`openOrExtendGroupEpisode`, `_room.js:698`).
  - The disclosure ACL of any derived row is *the participant set of the episodes it cites*.
  - So a late joiner can never read last month's room.
- **Privacy is a SQL WHERE clause, not a prompt.**
  - `api/_disclosure.js::disclosurePredicate` runs before ranking.
  - DM-to-DM carry and room-A-to-room-B carry are *structurally inexpressible*, because the room id is a scalar.
  - Negative-affect rows never bridge.
  - Measured: prompt-instruction privacy leaked 57.1%/98.1%; the predicate leaked 0/31,122 (§5).
- **Speaking is decided in code, before the model is called.** `decideParticipation` (`room.ts:323`) returns `lurk`, `react` (one emoji) or `speak`.
  - It speaks only on **explicit address**: her name, `@bot`, or a reply to her.
  - Implicit-addressee inference is deliberately *not built* (GPT-4o 80.9% vs 80.1% chance).
  - Unaddressed turns at best earn a 👀 reaction, after a 10-minute cooldown.
  - Every evaluation, including lurks, writes a `vy_group_turn` row, so silence is measurable.
- **Per-addressee register.** The `mp.roster` "address strip" tells the model, per member, `say:aap|tum|tu`, `rank:elder|peer|younger|unknown` and `quiet` (`renderMpRoster`, `room.ts:108`). It also says `unlinked:nothing-they-say-is-kept`. Publicly mis-addressing an elder is treated as the cardinal sin.
- **Forgetting is negotiated.**
  - `/bhool` withdraws *your* share. The receipt is distinct and says that others' share stays.
  - "Ruling B": shared memory is fully gone only when everyone asks.
  - "Ruling A": after someone leaves, co-participants can still ask about shared past, but the AI will not proactively raise it (`bridgeEligibilityClause`).
- **Group episodes are state-inert.** They never move the dyadic 1:1 relationship state: trust, honorific, patterns (`stateWriteCount`, `_room.js:832-878`).

This branch added the hardening layer over that base:

- current platform audience witness;
- checkpointed authority around generation and delivery;
- consent-time fences;
- attributed recall;
- truthful delivery.

### 1.3 How far it got (honest status)

| Evidence level | State at `@MM` (from `docs/gurukul/research/GROUPAI-READINESS-20260929.md@MM` "Acceptance ledger") |
|---|---|
| Source review | Accepted for the checkpoint, recall, truthful delivery and known-consent boundaries |
| Offline real-caller controls | Accepted: kernel 39, caller 170, selector 46, delivery 44, ingress 26, agentroom 48 |
| Actual PostgreSQL (synthetic, hosted) | Accepted: SQL50 on PostgreSQL 16.15 |
| Hosted browser + full release | Accepted: 24/24 on both Node versions, APK, UI 20 source/22 mounted |
| **Real transport/provider** | **Not run** |
| **Consented human group task** | **Not run**. The design pilot "Ten Days, Three Rooms" never ran. Live `vy_group` had **0 rows** at the last live count (`context/measurements.md#never-scheduled`, 2026-08-18). |

Still open:

- native web group identity and UI;
- private-to-group disclosure-grant writer;
- group media;
- dependency-safe forgetting;
- durable replay/deduplication.

Two owner questions are unanswered:

- the replay retention/relink policy;
- a consenting non-production group with an Azure budget.

The **Group AI has never touched a real group of humans.**

---

## 2. Reusable assets

Columns: `path@ref | what | maturity | Taxila use | target subsystem`.

Maturity key:
- `shipped-measured`: deployed and measured.
- `shipped`: deployed or in a live code path.
- `prototype`: integrated and CI-verified but never used live.
- `spec-only`: design document, no code.

| # | path@ref | what | maturity | use | Taxila target |
|---|---|---|---|---|---|
| HMG01 | `api/_group-runtime/checkpoints.js`, `.d.ts`, `README.md`, `package.json` @MM | Dependency-free, import-free "turn checkpoint" kernel. It binds one operation to a frozen scope, a policy version and an authority snapshot, then binds the source snapshot once. `assertCurrent()` re-reads authority, sources, authority, sources (A/S/A/S). Any mismatch or reader failure permanently invalidates the turn. Canonical receipts are key-order-insensitive and array-order-sensitive. It rejects accessors, sparse arrays and proxies-as-DTO, has hard resource limits, and returns frozen content-free errors. It is a private `@vyakti/turn-checkpoints` 0.1.0 package (UNLICENSED). Its guarantee is "checkpointed", not atomic. | prototype (hosted-gated; kernel 39 + caller 170) | **copy** | relational-os / safety-floor (re-verify session audience and consent before the teacher speaks a private memory or emits TTS; also generative-ui module publishing) |
| HMG02 | `api/_surface.js:1351` `createGroupTurnGuard` @MM | An adapter over HMG01. Authority is the current SQL group state (consent, entitled, quorum, cap, linked members) **plus** a complete platform audience witness whose recipient list must equal the SQL recipients exactly. It exposes `recipients`, `bindSources`, `assertAuthority`. | prototype | **adapt** | group-ai/multi-agent (session seat roster as the "witness") |
| HMG03 | `api/_group-recall/selection.js`, `.d.ts`, `README.md` @MM | Pure, synchronous source selector. Input is already-authorized attributed turns: sourceId, order, episodeId, speakerId, speakerLabel, recordedAt, text. It always keeps the latest 20 turns including the current one, and in `lexical_recency` mode adds up to 12 older matches. It emits a `source_turns/v1` packet that carries its own limits: `historical_observations`, `currentStateEstablished:false`, `temporalOrder:"recorded_source_order_not_event_time"`, and null subject/reply/revision. The 32,768-byte budget is measured on the **whole serialized turns**. Mandatory context that overflows **refuses**; it never truncates. It returns `rawTexts` separately so metadata never becomes human vocabulary. | prototype (selector 46; lexical NOT promoted) | **adapt** | memory-graph (long-term per-child recall packets with speaker attribution, for sibling/group sessions) |
| HMG04 | `api/_group-source-event.js` + the `_room.js` writers (`openOrExtendGroupEpisode:698`, `logRoomTurn:774`) @MM | "Known-consent source admission". A message is persisted only if its authenticated *original send time* is strictly later than group read consent **and** every current recipient's link time. It never uses arrival or edit time. Equality is refused, because the source has second precision. The check runs in JS first and is repeated inside each `INSERT ... SELECT`. It includes a microsecond-exact PostgreSQL timestamp parser that accepts `Z`, `+00`, `+0000` and `+00:00`. | prototype (ingress 26, SQL50) | **adapt** | auth/accounts/consent (DPDP: never persist child audio/video captured before verifiable parental consent, or before a sibling/peer joined) |
| HMG05 | `api/_group-audience.js:143` `createTelegramGroupAuthority` @MM | Telegram current-audience witness. It calls getMe, then getChatMemberCount before and after, getChatMember per linked member, and getChat before and after. It admits only private, unlinked chats with hidden history. It requires count equal to linked members plus one bot, which means every reader must be linked. It produces a SHA-256 revision digest and admits at most 6 humans. Its comments are explicit that it is not atomic. | prototype (audience 58) | **idea** | group-ai (Taxila will not run kids on Telegram; reuse the "complete audience must equal the authorized set" rule for in-app sessions) |
| HMG06 | `api/_surface.js:650-717` `deliver`, `sendAccepted`, `deliveryUnconfirmed` @MM | Truthful delivery. It preflights the whole render before any send and accepts only an own data property `ok:true` per fragment or reaction. It stops at the first unconfirmed fragment. It throws a frozen `surface_delivery_unconfirmed` with phase/outcome (`unknown` or `not_executed`), accepted/attempted counts and `retrySafe:false`, and no raw cause. The assistant log is written only after confirmed delivery. | prototype (delivery 44) | **copy** (pattern) | realtime-voice + telemetry ("teacher said X" only after the audio actually played; parent notification "sent" only on a provider receipt) |
| HMG07 | `api/_surface.js:444-474` `assertGroupContextBudget`, `groupHumanSourceTurns` @MM | Provider-relevant prompt envelope check: `JSON.stringify({compiled:{core,tail},turns})` must be at most 98,304 UTF-8 bytes, core at most 64,000 and tail at most 24,000 string units. It **refuses before provider dispatch** rather than letting adapters slice safety text. | prototype | **copy** | prompt-compiler/persona-engineering (Taxila child-safety floor at the end of the prompt must never be sliced) |
| HMG08 | `api/_surface.js:1400` `onGroupMessage` @MM | The ordered group pipeline: freeze event/ctx/adapter, resolve room, commands first (app-voiced), guard, consent-time fence, participation decision, STORE (episode + human log, only if consent/quorum/linked/entitled), log the decision, RETRIEVE through the predicate (facts, bridge, roster, candidates), bind the full candidate pool to the guard, select, compile with `roomBundle`, gated reply with re-check before and after the model, deliver with re-check per fragment, then the assistant log. | prototype | **adapt** | group-ai/multi-agent (Taxila group-session turn loop) |
| HMG09 | `api/_room.js:698-813` episode + log writers @MM | Single-statement CTE that creates the episode **and** all participants and verifies the participant count. The log insert re-verifies that the episode participants equal current linked members, that there is no deny, that consent predates the source, and that no relink is at or after the source. A refused write returns null and the caller then throws. | prototype (SQL50 cases 227-263, 495-595) | **adapt** | db-schema (`session_episode` + `session_participant` per turn/segment) |
| HMG10 | `api/_disclosure.js` `disclosurePredicate`, `bridgeEligibilityClause`, `RECIPIENT_SET_SQL`, `NEGATIVE_AFFECT_TAGS` @MM | The privacy boundary as one SQL fragment for facts, phrases and episodes. Deny wins, and is read on both the row and its cited episodes. Sensitive or negative-affect rows never cross. Otherwise a row needs either a cited grant covering every recipient, or a structural branch where every recipient participated in every cited episode. Uncited rows go to the owner's own 1:1 only. Room isolation uses a scalar room id. There is a DM-to-DM kill switch. | shipped-measured (0/31,122; migration 008 live 2026-08-18) | **adapt** | safety-floor + relational-os (parent visibility: what may the teacher tell the parent or a sibling about what the child said) |
| HMG11 | `src/engine/room.ts:236-371` `decideParticipation`, `isExplicitlyAddressed`, `UNADDRESSED_COOLDOWN_MS` @MM | Deterministic speak/react/lurk decision **before** the model is called. Structural gates come first: consent, entitlement, quorum, linked speaker. Then quiet levels. Explicit address always means speak, even under `quiet`. A 10-minute cooldown can only raise the bar, never lower it. A room-word hit buys only a reaction. The default is lurk. It matches names in Devanagari and Latin script without `\b`. | shipped (tgbot deployed 2026-08-18; no live rooms) | **adapt** (invert defaults for a teacher-led session) | group-ai (turn-taking / who-is-being-addressed in multi-child voice sessions) |
| HMG12 | `src/engine/room.ts:108` `renderMpRoster`; `api/_room.js:376` `roster` @MM | Address strip as k:v data, with rank derived from the honorific band (`aap` = elder, `tu` = younger, `tum` = peer, no row = `unknown`). Rows drop whole at 900 chars, never half-rendered. | shipped | **adapt** | persona-engineering (teacher addresses a parent as "aap" and a child as "tum/tu" in one turn; a sibling's name and class) |
| HMG13 | `src/engine/room.ts:200` `ROOM_MODE_NOTE`, `:225` `ROOM_INTRO_DIRECTIVE` @MM | The group rule block: shapes, never lines. It is appended at the **end of CORE** and never in the appended-last pair. Its rules: no hints of DM content ("a hint is a disclosure with deniability"), rooms do not touch, no sides, nobody nudged, unlinked people not kept, same AI-honesty. | shipped | **adapt** | prompt-compiler (group-session note for the teacher persona) |
| HMG14 | `api/_surface.js:215-232` `ROOM_CARD`, `withdrawReceipt`; `:1693-1757` `commandOf`/`onCommand` @MM | App-voiced, deterministic disclosure card and receipts, with the command grammar `/chup` (room), `/chup me`, `/bolo`, `/bhool` (withdraw), `/kya`/`/kaise` (re-post card). | shipped (no live rooms) | **adapt** | design-system/ux + safety (session card read aloud at start; "teacher, thoda chup" / mute controls; parent-visible privacy card) |
| HMG15 | `api/_disclosure.js:305` `bridgeEligibilityClause` + PROPOSAL §3.2 rulings A/B @MM | Departed-member rule: peers keep reactive recall but there is no proactive raise. Shared memory is fully erased only when all participants ask. A member's withdrawal removes their own turns, audience rows and grants. | shipped (withdraw 22/22, 2026-08-18) | **idea** | memory-graph (sibling leaves study group; one sibling asks to forget) |
| HMG16 | `api/_room.js:832-878` `stateWriteCount` (state-inert group episodes) @MM | Group turns write episodes, facts and phrases but **no** dyadic relationship-state movement (rel_event, pattern, taste, currency). The inertness is asserted from outside by counting rows. It notes it is fragile ("inert by three-valued logic"). | shipped | **idea** | relational-os (a group session must not silently move one child's 1:1 bond/emotional state; learning evidence must be per-speaker-attributed) |
| HMG17 | `api/_experience-compiler/claim-evidence.js` `normalizeClaimEvidence` + `api/_claim-extraction/contracts.js` (prompt v3) @MM | Evidence projection with modality descriptors. Text/markdown carries a UTF-16 locator and SHA-256, with `page_mapping:"unavailable"`. PDF/docx is treated as `document`. Audio/video becomes `transcript_span` with a ms window and limitations, including `transcription_may_be_incorrect`, `word_alignment_unavailable`, `speaker_identity_not_asserted` and, for video, `visual_content_not_observed`. `image_region` is refused. Text times must be null. The input-set hash includes the prompt version and the outbound projection. Private source fingerprints are stripped before the provider. | prototype (19 checks; hosted 24/24 at 4cc5e662) | **adapt** | multimodal-vision + learning/pedagogy (a child's spoken answer, notebook photo or worksheet becomes typed evidence with honest limits feeding the learning-profile claims) |
| HMG18 | `src/studio/sourceAwareReview.ts`, `src/studio/types.ts` (`SourceAwareClaimCitation`), `api/_person-model.js` (`clientCitation`, `CLAIMS_SQL`) @MM | Source-aware claim review. The server re-verifies each citation: its evidence normalizes, its source belongs to the claim, the UTF-16 slice equals the excerpt, and `sha256(excerpt)` equals `quote_hash`. Only then is a typed projection emitted (modality, format, interpretation, locator, limitations). The client re-validates exact keys and limitations and drops anything malformed. It filters claims by the selected Context Locker item. Labels: "Audio transcript", "PDF document", and so on. Previews are blanked when training consent is absent. | prototype (UI 20 source/22 mounted) | **adapt** | learning-profile discovery + parent dashboard ("why does Taxila think Riya learns best with stories?" with exact cited moments and accept/reject) |
| HMG19 | `src/studio/source-aware-review.css`; `evals/source-aware-review-ui/run.mjs` lines 85-300 @MM | 44x44 px minimum targets and an 8 px gap token, plus a hosted Playwright check at 390 and 1440. It measures real DOM rects, gap and no-overlap, actual Tab focus with a visible outline, and five-point `elementFromPoint` occlusion hit tests with zero mutations. A negative control injects minimum-zero CSS, must be detected at 27 px, and is restored in `finally`. | prototype (measured 44 px, 2026-10-01) | **copy** (test pattern) | design-system/ux + evals (children need at least 48-56 px; gate it the same way) |
| HMG20 | `.github/workflows/group-authority.yml` + `evals/group-sql-authority/harness.mjs` + `run.mjs` @MM | Keyless "actual production SQL on synthetic PostgreSQL" in GitHub Actions. It uses a `postgres:16.15-bookworm` service container. `hostedGuard` refuses any NEON/DATABASE/PG*/AZURE/OPENAI env var and anything other than GitHub-hosted Linux. Production SQL is inserted byte-for-byte via `PREPARE`/`EXECUTE`, so PostgreSQL does the parameter typing. Arrays go through PostgreSQL array-input text. There are 50 groups with rejecting SQL mutations. | prototype (SQL50) | **copy** | evals/gates/verification (prove Taxila's Neon queries type-check and enforce consent without touching Neon) |
| HMG21 | `evals/group-turn-authority/fixture.mjs` @MM | Actual-module harness. It transpiles the *real* `_room.js`, `_surface.js`, `checkpoints.js` and `selection.js` with TypeScript into `vm.runInNewContext`. It has an approved-import map, a poisoned `fetch` (`offline_unexpected_io`), and a query double that asserts the full shipping disclosure predicate text and binds before returning declared rows. | prototype | **adapt** | evals (drive the real Taxila turn loop offline with only I/O replaced) |
| HMG22 | `evals/teacher-sheet-publication/held-request.mjs` @MM | Held-request barrier for UI race tests. `expect(kind)` resolves only when the fixture server has *parsed and held* the exact request kind and generation. It supports explicit `release`, and `reset()` bumps the generation and rejects stale expectations. There are no fixed sleeps. | prototype (publication 40+8) | **copy** | evals (stale-scope tests: child switches profile or parent switches child mid-request) |
| HMG23 | `evals/first-use-private-flow/readiness-probe.mjs` @MM | Byte-reversible AST instrumentation. It inserts uniquely located observer statements into the real `StudioApp.tsx` effect and asserts that removing them restores every original byte. It is an init-script probe recording begin/poll/registered/disposed, and fires exactly one real focus when idle. | prototype | **idea** | evals |
| HMG24 | `scripts/research-cycle.mjs`, `docs/gurukul/research/registry.json` (24 sources / 11 experiments), `evals/research-cycle/run.mjs` @MM | Offline research ledger. Source cards record kind, retrieval date, version, evidence class (`author_reported`, `documentation`) and decision (adopt/experiment/watch). Experiments have `state` (planned/implemented/completed) and `outcome` (pass/fail/inconclusive, set only when completed), plus success criteria, evidence scope and result. Review intervals are 14 days for docs/repos and 90 for papers. Citations are validated as public HTTPS with no query or credentials. Commands are display-only and never executed. | prototype (15 groups) | **copy** | evals/gates (Taxila research and experiment ledger, e.g. the covert-comprehension detector) |
| HMG25 | `evals/group-source-recall/cases.mjs`, `run.mjs`, `README.md` + `docs/gurukul/research/GROUP-SOURCE-RECALL-EVAL-20261001.md` @MM | Preregistered, SHA-frozen comparison. The corpus hash and semantic hashes were sent to root *before* the selector was inspected. There are 8 families, 3 language forms (EN/HI/code-switch), 2 variants each, with an adversarial variant 2. The runner verifies hashes on every run. Failures are reported per family and per variant, never pooled. | prototype | **adapt** | evals (held-out, frozen evaluation of Taxila's comprehension detector and learning-profile classifier) |
| HMG26 | `docs/gurukul/research/GROUPAI-READINESS-20260929.md` + `context/decisions.md#groupai20260929-layer-acceptance-ledger` @MM | A six-level acceptance ledger: source review, then offline real-caller, then actual SQL, then hosted browser/release, then real transport/provider, then consented human task. Each needs its own receipt, and failed predecessors are preserved. | spec-only (process) | **adapt** | evals/gates (Taxila launch gates per subsystem) |
| HMG27 | `docs/gurukul/research/GROUP-DELIVERY-DURABILITY-20261001.md` @MM | Durable effect design (not implemented). It specifies an immutable intake key `(surface, installation, event_kind, event_id)` plus a payload hash; a conflict on same key with a different hash; effect states `prepared`, `executing`, `confirmed`, `not_executed`, `unknown`, `cancelled`; no automatic resend on `unknown`; model generation treated as an effect too; and retirement/tombstone tradeoffs. | spec-only | **adapt** | infra/azure/vercel (gpt-image-2 / module-generation jobs, parent notifications, payment webhooks) |
| HMG28 | `docs/gurukul/research/GROUP-NATIVE-IDENTITY-20261001.md` @MM | Audit plus design for linking a verified web account to a platform identity. It uses a short-lived single-use challenge bound to account, purpose, platform subject and expiry. Conflicts fail closed, with no opportunistic `person_id` merge. A member-only status door returns minimal state and no roster. Owner of the AI is not the same as member of the group. | spec-only | **adapt** | auth/accounts/consent (parent account to child profile to device seat; sibling seats on a shared tablet) |
| HMG29 | `docs/gurukul/research/HONCHO-ADOPTION-20260929.md` @MM | Honcho v3 (plastic-labs) pattern review. It transfers five ideas: observer-to-subject perspectives, explicit vs inferred facts, a bounded read-set receipt distinct from citations, cheap context assembly separate from costly reasoning, and dependency-aware retraction. It rejects the dependency: the core is AGPL-3.0, the hosted privacy policy allows de-identified fine-tuning, and there is a competing-systems clause. | spec-only | **idea** | memory-graph (teacher-view vs parent-view of the child; inferred learning style stays provisional until evidence or approval) |
| HMG30 | `docs/gurukul/research/PORTABLE-GROUP-LAYER-20261001.md` @MM | Primary-source research table. It covers Temporal activities (MIT), Restate (BSL 1.1, rejected), Zanzibar/SpiceDB (Apache-2.0), OpenFGA immutable models, transactional outbox, Helland 2007, Graphiti v0.30.2 (Apache-2.0), Hindsight v0.10.2 (MIT), GroupMemBench v2, SocialMemBench v1, LongMemEval-V2 and GroupGPT/MUIR. Each has the transferable technique, its limits and pinned commits. | spec-only | **idea** | group-ai + memory-graph evals |
| HMG31 | `api/tg.js` `parse`/`handleUpdate`/`clientFor`/`bindTelegramClone` delta @MM | Webhook ingress hardening. Group updates with more than one kind, or with guest/ephemeral/business/anonymous/edit/offline fields, become `ignore` before dispatch. Only `message.date` becomes `sourceSentAtSeconds`. The event is frozen *before* any await. One immutable per-clone client both sends and reads authority, and a missing per-clone capability is never filled from the default bot. | prototype | **idea** | infra (WhatsApp parent-notification webhooks; any inbound event normalization) |
| HMG32 | `.github/workflows/release-gate.yml` @MM | Release gate on a Node 22+24 matrix. It writes a keyless stub config (`write-config.mjs --stub`), asserts no `secrets.` reference in the workflow, fetches a pinned history archive at depth 2 for regression controls, uploads sanitized failure logs for 7 days, and runs a weekly scheduled Hindi rehearsal job. | shipped | **adapt** | infra/CI |
| HMG33 | `docs/research/multiparty/MULTIPARTY.md`, `docs/design/PROPOSAL-MULTIPARTY-V1.md`, `docs/research/multiparty/{triadic-social,group-conversation,disclosure-control,competitive-multiparty,whatsapp-platform,multiparty-schema}.md` @MM | The six-track multiparty research synthesis and v1 design. Contents: behavior rules R1-R8 (CPM-negotiated disclosure, accurate/selective/non-negative relay, mediator not tertius, transparency card, never publicly correct an elder, per-addressee register, graduated quiet, the human-confidant ~30% leak bar); ten "felt moments" M1-M10; the anti-moments; the crisis-in-room ruling; and the Gate 0 and pilot design. | spec-only (with Gate 0 measured) | **idea** | group-ai + parent visibility + safety-floor design |
| HMG34 | `api/_surface.js:1196` `onLinkTap`; `api/_room.js:144` `linkSurfacePerson` (adult gate) @MM | The linking tap opens the DM, binds identity, verifies membership and sets `linked_at`, with a one-time intro written as a shape. A known `minor` is refused a binding, so nothing can persist. | shipped | **skip** as-is (inverts for children) / **idea** for the gate shape | auth/accounts/consent (replace with a verifiable-parental-consent gate: no consent row means no persistence) |
| HMG35 | `api/_room.js:48-53, 283-354` (`TRIAL_DAYS`, `QUORUM`, `roomHasSpaceFor`, `roomEntitled`) + PROPOSAL §6.6 @MM | The group as the paying unit. There is a 14-day per-room trial. A lapsed entitlement silences the room but never anyone's 1:1 ("downgrade that reads as hostage-taking is NEVER MANIPULATE"). The cap is enforced on every arrival path. | shipped | **idea** | payments (family plan / sibling seats / study-group seats; lapse must not hold a child's 1:1 teacher hostage) |
| HMG36 | `api/_surface.js:422` `honestyContextFor({humanSourceTexts})` @MM | When the model input is an attributed JSON packet, the honesty gate's "human vocabulary" and commitments are derived only from raw source texts. JSON keys, IDs and labels are never laundered into a person's speech. | prototype | **adapt** | safety-floor/honesty (Taxila's "did the child actually say this?" support set) |
| HMG37 | `docs/handoff/2026-09-09/NEXT-AGENT.md`, `START-HERE.md` @MM | Handoff discipline, including an explicit post-mortem: "Too much coordination, repeated source freezing, defensive test infrastructure and handoff bookkeeping accumulated before a single real signed-in journey and owner listening result." It fixes the order: real journey first, then listening, then memory correctness. | spec-only (process) | **idea** | governance (applies directly to Taxila's build plan) |
| HMG38 | `api/_room.js:473` `roomSourceCandidates`, `:451` `roomHistoryEvidence` @MM | Authority-first bounded candidate read. It is the full episode disclosure predicate before ORDER/LIMIT, human-only, non-null speaker, unsuperseded episode and `l.id <= throughLogId`. The cutoff is the current turn's own stored id, so later arrivals cannot displace it. Errors propagate and never become an empty fallback. | prototype (SQL cases 328-476) | **adapt** | memory-graph / db-schema |

---

## 3. Key code excerpts worth porting

All excerpts are verbatim from `@MM`. None contains a secret.

### 3.1 Checkpointed authority: the A/S/A/S core (`api/_group-runtime/checkpoints.js`)

```js
    assertCurrent() {
      try {
        assertActive();
        // Check at invocation too: binding later must not rescue an unbound
        // effect check that was already requested.
        if (sourceReader === null) fail("sources_unbound");
        if (pending >= CHECKPOINT_LIMITS.pendingChecks) fail("too_many_pending_checks");
      } catch (error) { return Promise.reject(error); }
      pending++;
      // Serialize whole checks, not individual readers: no concurrent caller
      // can interleave the A/S/A/S sequence or revive a failed turn.
      const check = queue.then(async () => {
        assertActive();
        if (sourceReader === null) fail("sources_unbound");
        await checkAuthority();
        await checkSources();
        await checkAuthority();
        await checkSources();
        assertActive();
      });
      queue = check.then(() => { pending--; }, () => { pending--; });
      return check;
    },
```

`fail()` is sticky (`invalidReason ??= reason`). Once a turn is invalid it can never be revived, even if the state returns to its earlier value.

**Taxila port.** Use one instance per teacher utterance in a group or parent-visible session:
- authority = session seats, consent rows, policy version;
- sources = the memory rows the utterance may use;
- `assertCurrent()` runs before LLM dispatch and before each TTS chunk is released.

### 3.2 Binding the real adapter (`api/_surface.js:1351-1393`, abridged)

```js
    checkpoints = await createTurnCheckpoints({
      scope: { groupId: String(room.id), agentId: ctx.agentId, surface: event.surface, chatKey: event.chatKey },
      policyVersion: "vyakti.group-authority/v1",
      readAuthority: async ({ scope }) => {
        const current = await groupTurnAuthority(scope.groupId, scope.agentId, table);
        const audience = normalizeGroupRecipients(current?.recipients);
        if (!current || !current.read_consent_at || current.entitled !== true || !audience ||
            audience.length < QUORUM || audience.length > Number(current.member_cap) || ...) throw groupAuthorityError();
        const witness = await readAudience(event, { roomId: scope.groupId, agentId: scope.agentId,
          room: current, linkedMembers: current.linked_members });
        const verified = normalizeGroupRecipients(witness?.recipients);
        if (witness?.complete !== true || !verified || JSON.stringify(verified) !== JSON.stringify(audience) || ...) throw groupAuthorityError();
        return { authority: current, recipients: audience, revision: witness.revision };
      },
    });
```

The lesson fixed in `context/rejected.md#groupai20261001-mutable-destination-and-benchmark-transfer`: freeze `ev`, `ctx` and `ctx.adapter` *before the first await*. `onGroupMessage` does exactly that at lines 1405-1406. Otherwise an immutable authority receipt can authorize chat A while the later send reads a mutated chat B.

### 3.3 Truthful delivery (`api/_surface.js:693-717`)

```js
function deliveryUnconfirmed(outcome, reason, acceptedFragments, attemptedFragments, failedFragment) {
  // These describe DELIVERY ONLY. Commands, source writes or generation may
  // already have completed. Even not_executed is not permission to replay the
  // entire operation; unknown never means the remote side rejected the send.
  return Object.freeze(Object.assign(new Error("surface_delivery_unconfirmed"), {
    code: "surface_delivery_unconfirmed", status: 502, phase: "delivery",
    outcome, reason, acceptedFragments, attemptedFragments, failedFragment,
    retrySafe: false,
  }));
}

async function sendAccepted(ctx, chatKey, msg, acceptedFragments) {
  try {
    const receipt = await ctx.send(chatKey, msg);
    const ok = receipt && typeof receipt === "object" && !Array.isArray(receipt)
      ? Object.getOwnPropertyDescriptor(receipt, "ok") : null;
    if (!ok || !("value" in ok) || ok.value !== true) throw new Error();
    // Adapter acknowledgement only, not proof of human/device delivery.
    return receipt;
  } catch {
    throw deliveryUnconfirmed("unknown", "send_unconfirmed", acceptedFragments,
      acceptedFragments + 1, acceptedFragments);
  }
}
```

### 3.4 Known-consent admission (`api/_group-source-event.js:65-110`, abridged)

```js
export function assertGroupSourceEvent(ev, authority, recipients) {
  try {
    need(own(ev, "kind") === "message" && own(ev, "isGroup") === true
      && own(ev, "sourceEventKind") === "ordinary_message");
    const seconds = normalizeGroupSourceSentAtSeconds(own(ev, "sourceSentAtSeconds"));
    need(seconds !== null);
    const eventMicros = BigInt(seconds) * 1_000_000n;
    ...
    need(eventMicros > timestampMicros(own(authority, "read_consent_at")));
    ...
    for (const member of members) {
      ...
      need(eventMicros > timestampMicros(own(member, "linked_at")));
    }
    need(transportUsers.has(speakerUser));
    return new Date(seconds * 1000).toISOString();
  } catch {
    // Do not leak payloads, member details, thrown proxy bodies or raw causes.
    throw unavailable();
  }
}
```

The same fence is repeated inside SQL (`api/_room.js:711-715`):

```sql
        and g.read_consent_at < $5::timestamptz
        and not exists (select 1 from vy_group_member cm
          where cm.group_id = g.id and cm.agent_id = g.agent_id
            and cm.left_at is null and cm.linked_at is not null and cm.linked_at >= $5::timestamptz)
        and $4::uuid[] = (select array_agg(m.person_id order by m.person_id)
          from vy_group_member m where m.group_id = g.id and m.agent_id = g.agent_id
           and m.left_at is null and m.linked_at is not null)
```

### 3.5 The participation decision (`src/engine/room.ts:323-371`, abridged)

```ts
export function decideParticipation(input: ParticipationInput): ParticipationDecision {
  const addressed = isExplicitlyAddressed(input);
  const g = input.gates;
  if (!g.readConsent) return { action: "lurk", addressed, reason: "no read consent" };
  if (!g.entitled) return { action: "lurk", addressed, reason: "room not entitled" };
  if (!g.quorum) return { action: "lurk", addressed, reason: "below 2-member quorum" };
  if (!g.speakerLinked) return { action: "lurk", addressed, reason: "speaker unlinked" };
  if (input.roomQuiet === "silent" || input.memberQuiet === "silent")
    return { action: "lurk", addressed, reason: "silent level" };
  if (addressed) return { action: "speak", addressed: true, reason: "explicit address" };
  if (input.roomQuiet === "quiet" || input.memberQuiet === "quiet")
    return { action: "lurk", addressed, reason: "quiet level, unaddressed" };
  if (input.sinceHerLastMs < UNADDRESSED_COOLDOWN_MS)
    return { action: "lurk", addressed, reason: "cooldown, unaddressed" };
  const t = String(input.text || "").toLowerCase();
  const hit = (input.roomWords || []).find((w) => w && t.includes(String(w).toLowerCase()));
  if (hit) return { action: "react", addressed, reason: `room word: ${clip(hit, 24)}` };
  return { action: "lurk", addressed, reason: "no address, no relevance" };
}
```

### 3.6 The disclosure predicate, structural branch (`api/_disclosure.js:232-272`, abridged)

```sql
and (
      (select coalesce(array_agg(g.granted_to), '{}'::uuid[])
         from vy_disclosure_grant g
        where g.subject_kind = ${KIND} and g.subject_id = ${s.id}
          and g.t_invalid is null${AGENT("g")}) @> ${R}
   or
      (
        cardinality(${CIT}) >= 1
        and not exists (
          select 1 from unnest(${CIT}) as c(ep)
           where exists (select 1 from vy_episode se
                          where se.id = c.ep${AGENT("se")}
                            and (se.disclosure_scope = 'private'
                                 or (se.disclosure_scope = 'participants_1to1'
                                     and ${G})))
              or exists (select 1 from unnest(${R}) as r(pid)
                          where not exists (
                            select 1 from vy_episode_participant p
                             where p.episode_id = c.ep
                               and p.person_id = r.pid))
        )
      )
   or
      (cardinality(${CIT}) = 0 and not ${G} and ${PERSON} is not null
       and ${R} <@ array[${PERSON}]::uuid[])
)
and (not ${G} or ${GRP} is null or ${GRP} = ${M})
```

### 3.7 The self-describing source packet (`api/_group-recall/selection.js:146-169`)

```js
  const packet = Object.freeze({
    schema: "source_turns/v1",
    interpretation: "historical_observations",
    currentStateEstablished: false,
    coverage: "host_supplied_candidate_pool",
    temporalOrder: "recorded_source_order_not_event_time",
    replyAncestryAvailable: false,
    selection: Object.freeze({ mode, candidateCount, mandatoryCount,
      optionalCount: ordered.length - mandatoryCount, queryTermCount }),
    limits: Object.freeze({ sourceTextUtf16: SOURCE_SELECTION_LIMITS.textUtf16,
      selectedSources: SOURCE_SELECTION_LIMITS.selected, payloadUtf8Bytes: SOURCE_SELECTION_LIMITS.payloadUtf8Bytes }),
    current: record(current),
    history: Object.freeze(ordered.filter((source) => source.sourceId !== current.sourceId).map(record)),
  });
  const turns = Object.freeze([Object.freeze({ role: "user", content: JSON.stringify(packet) })]);
```

### 3.8 Provider-envelope budget, refuse rather than slice (`api/_surface.js:463-474`)

```js
function assertGroupContextBudget(compiled, turns) {
  if (typeof compiled?.core !== "string" || typeof compiled?.tail !== "string")
    throw groupContextError("invalid_context");
  if (compiled.core.length > 64_000 || compiled.tail.length > 24_000)
    throw groupContextError("context_over_budget");
  let serialized;
  try { serialized = JSON.stringify({ compiled: { core: compiled.core, tail: compiled.tail }, turns }); }
  catch { throw groupContextError("invalid_context"); }
  if (Buffer.byteLength(serialized, "utf8") > 98304) throw groupContextError("context_over_budget");
}
```

### 3.9 Honest modality descriptor (`api/_experience-compiler/claim-evidence.js:126-136`)

```js
  } else if (metadata.evidence_type === "transcript_span") {
    if (!new Set(["audio", "video"]).has(metadata.source_kind)) fail("claim_evidence_modality_invalid");
    if (time.start_ms === null || metadata.source_locator !== null || metadata.source_format !== null) fail("claim_evidence_transcript_locator_invalid");
    descriptor = {
      modality: metadata.source_kind, evidence_type: "transcript_span", format: null,
      interpretation: "machine_transcription",
      source_locator: { unit: "transcript_window_ms", relative_to: "transcription_input", ...time },
      limitations: ["transcription_may_be_incorrect", "word_alignment_unavailable", "original_source_time_mapping_unavailable", "speaker_identity_not_asserted",
        ...(metadata.source_kind === "video" ? ["visual_content_not_observed"] : [])],
    };
```

Earlier in the same function, image regions are refused:

```js
if (row.evidence_type === "image_region") fail("claim_evidence_image_semantics_unavailable");
```

### 3.10 Keyless hosted SQL guard (`evals/group-sql-authority/harness.mjs:19-29`)

```js
export function hostedGuard(env = process.env, platform = process.platform) {
  assert.equal(platform, 'linux', 'SQL proof is GitHub-hosted Linux only');
  assert.equal(env.GITHUB_ACTIONS, 'true', 'SQL proof requires GitHub Actions');
  assert.equal(env.RUNNER_ENVIRONMENT, 'github-hosted', 'self-hosted SQL is prohibited');
  assert.equal(env.GROUP_SQL_SYNTHETIC, 'hosted-ephemeral-only');
  for (const name of ['NEON_URL', 'DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER',
    'PGPASSWORD', 'PGSERVICE', 'PGSERVICEFILE', 'AZURE_KEY', 'AZURE_ENDPOINT',
    'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    assert.ok(!env[name], `SQL proof refuses externally supplied ${name}`);
  }
}
```

Its companion builds `PREPARE qN AS <production sql>; EXECUTE qN(<literals>)`. Production SQL is never rewritten or cast, so PostgreSQL itself infers `uuid[]`/`bigint` from the placeholders. That is how the `text[]` vs `uuid[]` mismatch was caught.

### 3.11 Touch-target assertion with a rejecting negative control (`evals/source-aware-review-ui/run.mjs:91, 253-264`)

```js
    assert(button.width >= 44 && button.height >= 44, `44px touch target: ${JSON.stringify(button)}`);
    ...
        receipt.negativeControl = { kind: 'removed_minimum_target_size', layout, detected: false };
        assert.throws(() => assertTouchTargets(layout), /44px touch target/);
        receipt.negativeControl.detected = true;
```

---

## 4. How Taxila can use the Group AI concept

### 4.1 Sibling, study-group, classroom and parent+child+teacher sessions

**Hard inversions first.** Do not copy these blindly.

1. **The adult gate inverts.**
   - Vyakti refuses known minors outright (`linkSurfacePerson`). Group AI was designed for adults only: "Every member verified adult and personally known" (PROPOSAL §8.3).
   - Taxila must keep the *shape* "no consent row means no persistence". The row becomes a verifiable-parental-consent record (DPDP §9) per child, and HMG04's fence applies against it.
2. **The transport is native, not Telegram.**
   - The "complete audience witness" becomes the server-owned session seat roster:
     - each child seat on its own device;
     - or a declared shared-device seat set;
     - plus a parent/observer seat;
     - with a monotonic revision.
   - HMG05's principle carries over: the authorized set must *equal* the full set of current listeners, and an unlinked or unknown listener blocks private-memory use.
3. **Lurk-by-default inverts to teacher-led.**
   - A teacher facilitates, so "nobody gets nudged into talking" (ROOM_MODE_NOTE) cannot be absolute.
   - It should become "invite by name gently, never pressure or shame, never compare children publicly".
   - Keep these from HMG11:
     - the deterministic pre-model decision step;
     - quiet controls;
     - no implicit-addressee inference (measured useless);
     - the cooldown that only raises the bar for *unprompted* interjections, for example when the children are talking among themselves.
4. **Voice needs attribution by seat.**
   - Covert comprehension needs to know *which* child said the answer (speaker vs subject, HMG03/HMG17).
   - Prefer per-device push-to-talk or seat-bound audio streams over diarization.
   - The evidence row must carry `speaker_person_id` and `speaker_identity_not_asserted` when it is not certain.
5. **Group episodes must not move one child's 1:1 bond.**
   - This follows HMG16, "state-inert".
   - Learning-profile updates from a group session must be per-child and attributed. Otherwise one sibling's answer improves the other's mastery estimate.

**Scenario map.**

| Taxila scenario | Mechanisms to reuse | Notes |
|---|---|---|
| **Sibling session** (two kids, one tablet or two devices) | HMG09 per-turn episode with participant set; HMG10 predicate (sibling A's private 1:1 confession never surfaces; negative affect never bridges); HMG12 roster (names, classes, per-child register); HMG15 withdraw rules | The M6 "wall, felt" moment applies directly: "Did my brother tell you anything?" gets a plain, honest "that's his to tell". |
| **Study group** (2-6 classmates) | HMG11 explicit-address detection (name in Devanagari and Latin); HMG14 app-voiced session card; HMG03 attributed recall ("last week Riya said...", only if Riya was in that episode and current listeners all were too); HMG35 seats as the paying unit | Cap 6 matches the 900-char roster budget derivation (`room.ts:85-90`). |
| **Parent + child + teacher** (report or meeting) | HMG10 grant branch: the "consent moment" M4 becomes the teacher asking the child in their 1:1, "kya main mummy ko bataun?" with [haan] / [abhi nahi], which writes a cited `disclosure_grant`; HMG12 `aap` for the parent and `tum` for the child; crisis protocol is room-blind (PROPOSAL §2.7) | Parent default view = structured progress plus affect *trends as shapes*, never verbatim child confidences without a grant. A safety concern is the only override. DPDP gives the guardian export/erase rights, which is a separate lane from the disclosure policy. |
| **Classroom** (teacher AI to many, school pilot) | HMG01/HMG02 checkpoint before using any per-child memory aloud; HMG06 truthful delivery logs; HMG26 acceptance ledger | Public-correction rule R5 analogue: never publicly correct or shame a child. Feedback on errors goes privately or as a group-neutral restatement. |

### 4.2 Smallest viable Group slice for Taxila

This is my recommendation, not something the repo built:

1. A `session` with `session_seat` (child/parent/observer) and a per-turn `session_episode` + `session_participant`. Use the HMG09 single-statement pattern.
2. All memory reads go through a port of HMG10 with `isGroup = seats > 1`. Use the explicit grant table and the child-tap consent UX.
3. Run the HMG01 checkpoint around LLM dispatch and TTS release, with authority = seats revision + consent rows.
4. Use a deterministic turn-taking module. Port HMG11 with teacher-led defaults.
5. Ship the app-voiced session card (HMG14) and parent-visible privacy copy.
6. Gate it with an offline actual-module harness (HMG21), keyless SQL proof (HMG20) and a frozen leak battery like Gate 0. The pass bar is 0 violations in compiled context at n>=300.

---

## 5. Measurements

Every number below carries its n, method and date, with a citation.

| Claim | n / method | Date | Source |
|---|---|---|---|
| Prompt-instruction privacy leaked **57.1%** of naturalistic and **98.1%** of adversarial scenarios. The SQL disclosure predicate leaked **0**. A negative control (clauses 4+6 removed) caught 162 violations. Participant-join p50 53 ms. | 494 scenarios, 31,122 row x scenario checks, coordinator rerun of Gate 0, offline fixtures | 2026-08-18 | `context/measurements.md#gate0-structural@MM` |
| Literature: ConfAIde Tier-3 ChatGPT leaks **93%**, GPT-4 22%. PiSAs partitioning drops violations from 100% to **33.5%**, but adding memory pushes them back to **63-90%**. Behavioral control leaves a **9-90%** residual. | Literature, adversarially verified; two headline figures were corrected | 2026-08-13 | `context/measurements.md#disclosure-leak-rates@MM` |
| tgbot surface: **101/101** offline checks. mp slots use **371/2,000** chars on the live path. Webhook returned 401 without the secret (live probe). | Offline suite plus one production probe | 2026-08-18 | `context/measurements.md#tgbot-landed@MM` |
| Live production counts: `vy_group` / `vy_group_member` / `vy_tg_person` = **0** rows. | Direct live DB counts | 2026-08-18 | `context/measurements.md#never-scheduled@MM` |
| Frozen recall comparison: older targets **recency 0/54 vs lexical 27/54**. Lexical recovers **0 of 27 older targets in all 24 adversarial cases** and selects **288** irrelevant distractors. Both keep 960/960 mandatory recent turns and 3/3 recent corrections, with 0 refusals. Max serialized turns 9,430 B (recency) vs 17,664 B (lexical). | 48 frozen invented cases (8 families x EN/HI/code-switch x 2), offline, Node 24.13.0, selector SHA `87afbb37...` | 2026-10-01 | `docs/gurukul/research/GROUP-SOURCE-RECALL-EVAL-20261001.md@MM`; `context/measurements.md#grouprecall20261001-final-software-inconclusive-quality` |
| Per language form: recency 0/18 vs lexical 9/18 older targets. Equality across forms is by construction, because the scenarios are shared. | Same corpus | 2026-10-01 | same |
| Attribution and text/span preserved for **2,235/2,235** selected records across both arms. | Same runner | 2026-10-01 | same |
| Compiler envelope: counting the duplicate `system` gave **111,236 B** and refused an ordinary reply. The consumed empty-turn envelope is **55,541 B**. A normal short question is **56,452 B** envelope / **913 B** source wrapper. | Real compiler probe through actual caller, offline | 2026-10-01 | `context/decisions.md#grouprecall20261001-provider-projection-correction`; readiness ledger |
| Delivery baseline defects: a duplicate event gives 2 model calls / 2 sends / 2 episodes / 2 human logs / 2 assistant logs. `{ok:false}` send still gives `said:true` and 1 assistant log. Fragment 1 fail + fragment 2 ok returns `{ok:true}`. | n=3 read-only actual-module probes (author-reported) | 2026-10-01 | `docs/gurukul/research/GROUP-DELIVERY-DURABILITY-20261001.md@MM`; `context/measurements.md#groupdelivery20261001-starting-probes` |
| Review action targets: all four measure **44 px** high at 390 and 1440 px. Widths 72.55 / 94.47 / 75.03 / 78.88 px, gap >= 8. The minimum-zero negative control drops them to **27 px** and is detected. Focus and 5-point hit tests pass, with 0 mutations. | Hosted Playwright, Node 22.23.2, artifact SHA `c0c1ee3d...` | 2026-10-01 | `context/measurements.md#groupreview20261001-measured-touch-targets-fe652992` |
| Final accepted software `808ad32f`: release **24/24** on Node 22 and on Node 24 (relational gates explicitly *skipped*, no NEON_URL). SQL **50/50** on PostgreSQL 16.15 (27 tables, 249 DDL). APK success, 19,310,090 bytes. | GitHub Actions runs 36894264452 / 36894264361 / 36894264406 | 2026-10-01 | `context/measurements.md#groupconsent20261001-final-combined-808ad32f` |
| Test-group counts at `808ad32f`: actual group caller 170, checkpoint kernel 39, selector 46, delivery 44, source ingress 26, agentroom 48, review UI 20 source/22 mounted, publication 40 mounted + 8, refresh 12 mounted / 24 outcomes + 10 observer / 24 source. | Hosted APK eval logs | 2026-10-01 | same |
| Earlier `3e036e7d` (portable kernel): release 24/24 on both Node versions, SQL 30 groups, APK 19,310,119 B. | Hosted runs | 2026-10-01 | `context/measurements.md#groupai20261001-hosted-3e036e7d` |
| Multimodal evidence suite: 19 checks. Incumbent extraction 55, grounding 7, Mirror learning 25, canonical evidence 39, citation coordinates 7, compiler 82 named + 1,000 property trials. | Offline, network-blocked, mocked Azure serializer | 2026-09-27 | `context/measurements.md#multimodal20260927-focused-evidence` |
| APK eval failures: **55 suites** at `ba3169cb`, then **3** at `0fdbf7d1`, then **0** at `4cc5e662`. Release 24/24 on both Node versions on 2026-09-27; Gradle took 1m51s. | Hosted runs 36301230958, 36304766280, 36305821217 | 2026-09-27 (logs checked 09-29) | `docs/gurukul/research/MULTIMODAL-LAYER-HANDOFF-20260927.md@MM` |
| Group-turn authority suite failed at `run.mjs:337` after 46 passing groups (source-receipt mutation "Missing expected rejection"). Review backend 21/21, audience 58/58. | n=5 root commands, network-blocked | 2026-09-30 | `context/measurements.md#groupai20260929-audit-and-initial-evidence` |
| Honcho vendor benchmarks (not reproduced): LongMem S 452/500 (90.4%). LoCoMo headline 89.9% is a per-conversation mean; raw totals are 1,378/1,540 (89.48%), excluding the adversarial category. BEAM 10M displays 0.409 but the raw artifact says 0.405675. | Vendor-run Dec 2025 artifacts, pinned commits | 2026-09-29 (review) | `docs/gurukul/research/HONCHO-ADOPTION-20260929.md@MM` |
| GroupGPT/MUIR headline 4.72/5 is an LLM rating, not the human-study score. | Paper review | 2026-10-01 | `docs/gurukul/research/PORTABLE-GROUP-LAYER-20261001.md@MM` |
| Addressing literature (as cited in code): implicit-addressee GPT-4o **80.9%** vs majority-class **80.1%** (arXiv:2501.16643); only **80/322** real turns carry an explicit addressee. MUCA fixed cadence rated excessive by **56.25%**. MultiLIGHT bundled speaker+utterance scores **49.5%**. | Literature | 2026-08 | `src/engine/room.ts:286-321@MM` |
| More literature: Inner Thoughts' most-restrained condition was least preferred, **2/12**. "Bots can Snoop" measured **3.6%** cross-group re-identification. Human confidants pass on **~30%** of secrets (Slepian, secondary). "Secret Soulmates" (n>2,000, not peer-reviewed) links regular companion use to a **46%** drop in relationship stability. | Literature | 2026-08 | `docs/design/PROPOSAL-MULTIPARTY-V1.md@MM` §1; `docs/research/multiparty/MULTIPARTY.md@MM` §5 |
| Azure synthetic connectivity probe: HTTP 200, 2,794 ms, 83 in / 26 out tokens. Durable dev ledger: 4 settled receipts = 152 micro-USD. | n=1 probe; ledger readback | 2026-09-06 | `docs/gurukul/research/GROUPAI-RELATIONAL-INTEGRATION-2026-09-06.md@MM` |

---

## 6. Rejections (tried, then what broke)

These are the highest-value findings. Each line is: what was tried or assumed, what broke, and the source.

### 6.1 Group authority and privacy

1. **Raw room history read without the audience ACL.** `roomHistory` returned group turns by `group_id` alone. A group id is not an ACL. *Fix:* audience-bound `roomHistoryEvidence` with the episode predicate applied before LIMIT. (`GROUPAI-READINESS` finding table; `context/rejected.md#groupai20260929-no-private-group-equivalence`)
2. **A mutable 45-minute episode was extended with late joiners.** Adding today's members retroactively authorized yesterday's conversation. *Fix:* a new immutable-audience episode per human turn (`_room.js:688-697` comment). (same)
3. **`logRoomTurn` without `episode_id`.** Logs had no lineage, so their original audience was unknowable. (same)
4. **Recipient sets omitted unlinked readers.** The DB's linked subset is not the real audience. *Fix:* compare against the platform's complete member count. (same)
5. **A guessed `/start r<id>` admitted membership.** A room id is not membership proof. *Fix:* verify platform membership. (same)
6. **Ordinary messages revived a withdrawn member.** A message after withdrawal is not renewed consent. (same)
7. **Only clone-public authority guarded egress.** It did not bind the shared-group sources reaching the provider or send. (same)
8. **A mutable destination after an await.** Authority was captured for one chat while the later send could read a mutated event/context/adapter/room. *Fix:* freeze all four before the first await, and capture the default send with a frozen receiver. (`context/rejected.md#groupai20261001-mutable-destination-and-benchmark-transfer`)
9. **`/chup` dispatches before the group guard.** An unlinked speaker can mute the whole room, so `onCommand` is not a membership boundary. `/bhool` withdraws across *all* the agent's groups, not just this one, so a "Forget this group" button would lie. This is an audit observation, not fixed. (`GROUP-NATIVE-IDENTITY-20261001.md`)
10. **Creator ownership treated as group membership.** Rejected: owning the AI does not entitle the owner to its group rosters or quotes. (same)
11. **Prompt-only privacy.** It leaked 57.1% naturalistic / 98.1% adversarial (Gate 0). This is why disclosure is SQL. (`context/measurements.md#gate0-structural`)
12. **The original clause 2 failed OPEN for uncited rows.** A universal quantifier over an empty citation set is vacuously true. *Fix:* the owner-channel-only branch (2b). (same)
13. **A member's whole-wipe hard-deleted room-derived rows.** That deleted shared memory for everyone. *Fix:* `wipeWhere`, honoring "withdraw, not delete". (same)
14. **"Downgrade the whole episode to 1:1 once anyone leaves."** Declined: it silently amputates the room's memory for those who stayed. (`_disclosure.js:291-301` comment)
15. **Implicit-addressee inference.** Not built: GPT-4o 80.9% vs 80.1% chance. (`room.ts:287-292`)
16. **Fixed speaking cadence / idle nudges.** MUCA found it excessive (56.25%). The idle nudge was already killed at 1:1 and is not revived at group scale. (`room.ts:272-277, 352-358`)
17. **Citing MultiLIGHT as support for "always decide silence separately".** Overstated. The separate silence step is an *engineering bet*, logged for measurement. (`context/measurements.md#disclosure-leak-rates`, amended 2026-08-15)

### 6.2 Recall and memory

18. **Lexical recall as an improvement.** It gained 27/54 vs 0/54, but every one of the 24 adversarial cases missed all 27 older targets and selected 288 distractors. *Not promoted.* Recency stays the default, and lexical is a server-only opt-in. (`context/rejected.md#grouprecall20261001-no-lexical-promotion-or-segment-truncation`)
19. **Tuning weights after seeing the answers.** Forbidden. Preregister, freeze the SHA, and require new held-out cases for any successor. (`#grouprecall20261001-no-posthoc-or-partial-budget-proof`)
20. **Text-only or inner-object byte counting.** It ignores metadata, escaping, wrappers and the current question. *Fix:* measure the whole serialized packet. (same)
21. **A 96 KiB whole-input limit as sufficient.** A 65,000-char ASCII core fits the bytes but is sliced at 64,000 by the adapters. *Fix:* separate core/tail segment refusal. (same)
22. **The opposite failure.** Counting the compiler's unused duplicate `system` gave 111,236 B and refused a normal reply. *Fix:* count only the consumed `{core, tail, turns}`. (same)
23. **An unconditional 32-term query limit in recency mode.** It rejected ordinary long paragraphs for a ranking limit recency never uses. (`GROUP-SOURCE-RECALL-EVAL` final rerun)
24. **Binding only the selected rows to the guard.** Rejected: changing an omitted candidate could change what should have been selected. The whole candidate pool is bound. (`GROUP-SOURCE-RECALL-PLAN`)
25. **Admitting assistant paraphrases as evidence.** Rejected until full dependency lineage exists. (same)
26. **Storage time `at` treated as event time.** Rejected. Labels say `recorded_source_order_not_event_time`. (same)
27. **A stale 160-row agentroom default fixture** kept because an earlier run passed 37. Rejected: current recency is 20. (`#grouprecall...`)
28. **Honcho: retrieval scopes as ACLs; session deletion or queue counters as forgetting; vendor benchmarks as Vyakti quality.** All rejected. Also: the AGPL core, the hosted privacy policy that permits de-identified fine-tuning, and the competing-systems ToS clause. (`#honcho20260929-no-authority-or-quality-shortcuts`)
29. **Restate as a durable-execution dependency.** Its server license is BSL 1.1, not open source. (`PORTABLE-GROUP-LAYER`)
30. **A departed-member recall objective from SocialMemBench.** Rejected as overriding withdrawal or erasure policy. (`#groupai20261001-mutable-destination-and-benchmark-transfer`)

### 6.3 Delivery, consent time and ingress

31. **Returning `said:true` / writing an assistant log after a refused send.** Rejected. Also rejected: continuing later fragments after an unconfirmed one, auto-retrying ambiguous dispatch, and labeling a thrown or timed-out send `not_executed`. (`#groupdelivery20261001-no-ambiguous-retry-or-success`)
32. **Requiring a provider message ID for success.** Rejected: web collectors legitimately return `{ok:true}` with no ID. (same)
33. **Render-shape checks outside the sanitizing catch.** A revoked Proxy or throwing `length` leaked raw error text. (same)
34. **Intended-success fixture doubles returning `undefined`.** These correctly hit the new refusal. The fix was the doubles, not production. (`#groupdelivery20261001-no-undefined-success-or-native-acl-shortcut`)
35. **Using arrival time or `edit_date` as source time.** Rejected: a delayed message would appear to postdate consent. A JS check alone is not enough; the snapshot must repeat in `INSERT ... SELECT`. (`#groupconsent20261001-no-receipt-time-or-policy-laundering`)
36. **A colon-only timezone offset parser.** It would reject real PostgreSQL `+00`. "Normalizing" it in the fixture would hide the production mismatch. (same)
37. **Code comment "Telegram retries forever".** Wrong per the primary docs: bounded, unspecified attempts. `update_id` can restart non-sequentially. (`GROUP-DELIVERY-DURABILITY`)
38. **Repurposing `vy_room_checkin_delivery` as the transport journal.** Rejected: it belongs to a different authority with different states. (same)
39. **"Content-free" metadata ledger as anonymous.** Rejected: hashes and associations are still personal metadata, and need export/erasure. (same)

### 6.4 Multimodal

40. **A blind port of the archived GroupAI runtime and context graph.** It would duplicate authority while leaving the real metadata-loss bug unfixed. (`#multimodal20260927-parallel-runtime-replay`)
41. **A claim schema bump just to describe modality.** Version-keyed batch identity could requeue completed work. *Fix:* additive projection plus prompt v3. (same)
42. **`Number(null)` invented zero timestamps** for documents. This was a concrete bug. (same)
43. **A sparse two-slot array** (only index 1 present) passed validation. *Fix:* an own-index guard on every slot. (same)
44. **Image dimensions/regions as artwork understanding.** Rejected: geometry is not meaning. (same; `#multimodal20260927-no-single-correction-learning-claim`)
45. **One accepted correction as "learning".** Rejected: the dataset gate requires 12 sessions, 30 prep pairs, 20 dev and 30 test examples. (same)
46. **Actual213 corrected-Hindi.** The correction stored Hindi/Devanagari/detailed correctly, but the delivered reply was *entirely English*. It is retained as completed/fail. (`registry.json#actual213-corrected-hindi`; `docs/handoff/2026-09-09/START-HERE.md`)

### 6.5 CI, fixtures and process

47. **Treating focused passes as release acceptance** while the APK failed 55 suites. Rejected. (`#multimodal20260927-no-green-ci-inference`)
48. **A click completing as proof that its POST arrived.** It got 0 pending POSTs after 21 passing checks. *Fix:* wait for the held request plus the committed DOM. (`#grouprelease20261001-no-click-completion-as-request-proof`)
49. **A focus event during active readiness polling** was ignored. A fresh HTTP response does not prove the auth effect committed; both witnesses are needed. (`#grouprelease20261001-no-shared-cause-or-auth-shortcut`)
50. **A mutable global `activityScope` in the fixture** produced auth mismatches across page unload. A token allowlist or error filter was rejected. (`#grouprelease20261001-no-auth-allowlist-or-error-filter`)
51. **Node v24.21.0 changed `IncomingMessage.signal`** so a completed request stays live. The fixture's historical-regression assertion threw and surfaced as HTTP 500. This was not a provider outage. (`#release20260927-three-suite-no-completion`)
52. **A hardcoded "October 5" next-month fixture date** stopped being next month. (`#groupai20261001-mutable-destination-and-benchmark-transfer`)
53. **Synthetic SQL arrays serialized as `ARRAY['...']`.** That is a `text[]` and PostgreSQL will not coerce it to `uuid[]`. *Fix:* array-input text. (`harness.mjs:33-40`; readiness ledger Oct 1 table)
54. **High-severity `brace-expansion`** failed the security gate. Waiving it was rejected; the fix moved to 5.0.12. (`#groupai20261001-no-portability-or-green-shortcuts`)
55. **About 27 px review buttons** (7 px padding, no minimum), with the header's 44 px rule mistaken for coverage. *Fix:* scoped 44x44, measured. (`#groupai20261001-green-software-not-whole-layer`)
56. **Host clock leaking into the compiler.** T2 ignored `input.nowMs`, so a replay could silently age a rupture. (`#release20260927-host-clock-and-silent-export`)
57. **Generic query-error fallback in export.** It could report a plausible incomplete export. *Fix:* 503. (same)
58. **Process overhead itself.** "Too much coordination, repeated source freezing, defensive test infrastructure and handoff bookkeeping accumulated before a single real signed-in journey and owner listening result" (`docs/handoff/2026-09-09/NEXT-AGENT.md`). This branch then spent October 1 on eight successive CI-receipt checkpoints for fixture races, while the Group AI still has **zero real-group runs**. Treat this as the most important process rejection for Taxila.

---

## 7. Concepts

- **Common-friend Group AI.** One AI persona is a member of a multi-human chat (2-6 linked humans). It is "the friend who was in the room with you". Its value is remembering the room (M1-M3) and carrying room context into each member's DM (M2), never carrying DM secrets into rooms.
- **Structural disclosure.** Privacy as a WHERE clause before ranking. "A row that was never retrieved cannot leak."
- **Episode-participant ACL.** A derived row's audience is the intersection of its cited episodes' participant sets. Membership governs the live channel; participation governs history.
- **Immutable audience per turn.** Each human turn creates a new episode whose participants equal the exact current linked set, written in one statement.
- **Consent as a platform act.** An admin promotes the bot, which is read consent. An app-voiced card is posted before the first episode.
- **No person row, no persistence.** Unlinked or unconsented speakers exist only in the live window.
- **Participation decision.** Deterministic lurk/react/speak before the model is called. Explicit address only. Silence is logged as an event.
- **App-voiced rail.** Disclosures, receipts and controls are deterministic app strings, never model output. "A disclosure she generates is a disclosure she can be talked out of."
- **Ruling A / Ruling B.** A: departed members' shared past can be answered but never raised proactively. B: shared memory is fully erased only when everyone asks.
- **State-inert group channel.** Group episodes do not move dyadic relationship state.
- **Checkpointed guarantee.** A/S/A/S re-reads with sticky invalidation. It detects observed change; it is not atomic and not exactly-once.
- **Complete audience witness.** The current platform audience must equal the authorized set. The witness is bounded and is not a transaction.
- **Known-consent admission fence.** Source time must be strictly later than every known consent and link boundary, checked in JS and in SQL.
- **Adapter-reported acceptance.** Delivery success means `ok:true` from the adapter, not human receipt. Unknown is never retried blindly.
- **Durable effect states.** prepared / executing / confirmed / not_executed / unknown / cancelled. Model generation is also an effect.
- **Attributed source packet.** Exact text and spans, recorded speaker separate from current label, null for unknown subject/reply/revision/event time. Self-declared limitations.
- **Speaker vs subject.** "A speaks about B" does not make B the speaker. Quoting is not authorship.
- **Raw-text honesty vocabulary.** Metadata never becomes a person's words.
- **Whole-payload budgets.** Measure the full serialized representation. Refuse rather than truncate required or safety text.
- **Six-level evidence ledger.** Source, offline real caller, actual SQL, hosted release, real transport/provider, consented human task.
- **Preregistered frozen comparison.** Hash the corpus before inspecting the method. Report adversarial failures unpooled.
- **Negative controls.** Every gate proves it can fail, for example the minimum-zero CSS, predicate-removal mutants and clause-removal Gate 0.
- **CPM co-ownership (Petronio).** A confidant becomes a co-owner bound by the discloser's rules. Inferred onward disclosure is "boundary turbulence".
- **Mediator, not tertius (Simmel).** The AI must never benefit from friction between members.
- **Observer-to-subject perspectives (Honcho).** What the teacher knows about the child is distinct from what the parent may know.
- **Dependency-safe forgetting.** Derived summaries must be rebuilt from current authorized support. Until then, exclude what lacks lineage.

---

## 8. Gaps and unread

- **`vyakti-groupai` repo** (`/home/user/vyakti-groupai`, branches main / codex/relational-core / claude/vyakti-cloning-platform-aq05n4) holds the original "GroupAI" kernel: relational-core privacy, context capsule, delivery runtime, shadow pilot. It is out of this segment and should be another segment. The commits `b476a3c` and `56b3537` cited by `MULTIMODAL-RESEARCH-CYCLE` are not in html-portfolio.
- Full `context/STATE.md@MM` is 1,751 lines. I read the START HERE blocks from 2026-09-27 to 10-01, not the older history.
- `docs/research/multiparty/*` was read selectively: MULTIPARTY.md §5, PROPOSAL §1, §2.7, §6.4 and §8. The tracks triadic-social, group-conversation, disclosure-control, competitive-multiparty and whatsapp-platform were read only at heading level.
- Not read: Discord and WhatsApp adapters (`api/discord.js`, `api/whatsapp.js`), `api/memory.js::withdrawSharedRows`, and the honesty gate internals (`engine.guardReply`).
- Evals were read only for structure and case names, not every assertion: `group-turn-authority/run.mjs` (859 lines), `group-sql-authority/run.mjs` (694), `turn-checkpoints/run.mjs` (500), `source-turn-selection/run.mjs`, `group-audience/run.mjs`, `group-source-event/run.mjs`, `surface-delivery/run.mjs`.
- Production code behind the "readiness/publication" fixtures was only touched through their test fixtures: `PersonModelStudio.tsx` (158-line diff skimmed via the server half), `StudioApp.tsx` readiness effect, teacher-sheet publication UI, ActivityPanel.
- Android delta (`.github/workflows/build-apk.yml` +19) was not inspected in detail.
- `docs/handoff/2026-09-09/{evidence,listening,context-root}` was not read. The twelve voice clips there are covered by voice segments.
- **No real-group, live-provider or vision evidence exists to harvest.** This branch has no image or video understanding and no in-call vision. Screen-watch lives in older Meera code, covered by other segments.

## Verification

Adversarial pass against `origin/codex/multimodal-layer-20260927@b514595f` (html-portfolio, read-only via `git show`). All cited paths exist; every claim is implemented code, not a stub or spec, except the docs-only items HMG26/27/28. No secrets found. `group-authority.yml` holds a literal synthetic CI Postgres password ("synthetic-ci-only"), which is not a secret, but do not copy it verbatim.

Cross-cutting findings the reader did not state:
- The whole branch is built for **Telegram/Discord/WhatsApp group chats** with a Meera persona. Tables are `vy_*` and `meera_log`, ids are `agent_id`, and Hinglish strings are in Meera's companion voice. Taxila is voice-first and teacher-led, so anything touching SQL, `_room.js` or `_surface.js` is a design transplant and not a file copy.
- Only four modules have zero imports and are portable as files: `checkpoints.js`, `selection.js`, `_group-source-event.js`, `_disclosure.js` (SQL-string builder, but it hardcodes `vy_*` table names).
- `_surface.js` imports `_db`, `_config` (the secrets file), `_azure-surface-reply`, `_model-serving-policy` and `_never-rules`. `_room.js` imports `_db` and `_agentscope`. Do not copy either whole.

| id | exists | implemented | portable to Taxila | quality | verdict | note |
|---|---|---|---|---|---|---|
| HMG01 | yes | yes | yes, as is | 5 | copy | `checkpoints.js` is 221 lines with no imports, only `Object`/`Promise` intrinsics. A/S/A/S sequence, frozen DTO snapshots, and limits all verified in code. It is honestly labelled "checkpointed", not atomic. Node-only; fine on Vercel and Azure. Copy it with its .d.ts and its `turn-checkpoints/run.mjs` eval. |
| HMG02 | yes | yes | no, adapt | 3 | adapt | 43 lines. Depends on `groupTurnAuthority` (SQL over `vy_group`), `normalizeGroupRecipients`, `QUORUM`, and a platform `groupAudienceWitness`. The pattern is good. In Taxila a "platform witness" has no analogue unless you build a seat-roster revision hash. Rewrite against Taxila's consent and seat tables. |
| HMG03 | yes | yes | yes with caveat | 4 | adapt | `selection.js` is pure with zero imports. Recall is weak: lexical-recency recovers 27/54 older targets vs 0/54 for recency, and 0/24 on the adversarial variant (README, 2026-10-01, 48 invented cases). English-centric NFKC tokens, so Hindi/Hinglish recall is unproven. Use for packet shape and byte budget, not as a retriever. |
| HMG04 | yes | yes | mostly | 4 | adapt | `_group-source-event.js` is pure (100 lines). The microsecond timestamp parser is good. Its premise is Telegram's authenticated `sourceSentAtSeconds`. Taxila has no per-message platform timestamp, so the fence must use server receipt time of the audio frame. The SQL repeat is in `_room.js` and is vyakti-coupled. Taxila's consent is mostly parent-level, so the multi-recipient link logic is mostly irrelevant. |
| HMG06 | yes | yes | adapt | 3 | adapt | Preflight-then-send and a frozen `retrySafe:false` error are real. But `ok:true` is "adapter acknowledgement only, not proof of human/device delivery" (code comment). Claimed target "log only after audio playback is confirmed" is NOT what this does. Taxila needs a client playback-ack event. Copy the unknown/not_executed taxonomy, not the code. |
| HMG07 | yes | yes | idea only | 3 | idea | ~20 lines. The 64,000/24,000/98,304 constants are tied to the Meera adapters' slice points. Taxila's own `compile()` and budget gate (inherited law) already cover this. Keep the "refuse before provider slice" principle and the UTF-8 byte check. Do not copy the numbers. |
| HMG08 | yes | yes | no | 3 | idea | Order of steps is sound but the 220-line function is welded to Telegram event shape, Meera commands and `vy_*` writes. Use as a checklist for Taxila's turn loop. Not adaptable as code. |
| HMG09 | yes | yes | adapt | 4 | adapt | Real SQL, and it is proven by the 50-group harness (HMG20). Needs rewrite to Taxila's `session_episode` / `session_participant` schema. Taxila's sibling-seat case is narrow, so value is medium. |
| HMG10 | yes | yes | adapt | 4 | adapt | 317 lines, pure string builder over `vy_fact`, `vy_phrase`, `vy_episode`, `vy_disclosure_grant`, `vy_group_member`. Well documented, with measured leak-rate rationale. Taxila's equivalent is parent-visibility of child content. Port the clauses (deny wins, sensitive never crosses, uncited goes only to owner) to Taxila tables, not the file. |
| HMG11 | yes | yes | adapt/invert | 3 | adapt | Pure TS, no imports, shape-linted. Defaults are the opposite of what a teacher needs (it lurks by default). Hardcoded `NAME_DEFAULT` is Maya/Meera. The code's own note says implicit-addressee inference was measured at chance (80.9% vs 80.1% baseline), so explicit address only. Keep that finding. |
| HMG12 | yes | yes | adapt | 3 | adapt | 30-line renderer. Taxila's honorific model is simpler (child/parent) so most of this is overkill. Keep the drop-whole-rows-at-budget idea. |
| HMG13 | yes | yes | idea | 2 | idea | The note is written as full English sentences, which contradicts the repo's own rule ("sentence-shaped text gets recited"). Its content is companion/DM-privacy specific. Take the principles only: no hints of private content, same AI honesty. Do not paste. |
| HMG14 | yes | yes | adapt | 2 | idea | `ROOM_CARD` is Meera's voice ("main Meera hoon") and its commands are Telegram slash commands. Idea only: deterministic app-voiced disclosure and a distinct post-commit withdraw receipt. |
| HMG17 | yes | yes | adapt | 4 | adapt | `claim-evidence.js` is 121 lines, but imports `context-evidence.js`, which is part of the vyakti Context Locker chain (`_experience-compiler/*`, `_claim-extraction/contracts.js`, `_replica-claims.js`). Not standalone. No image path exists (`image_region` is refused by design), so the claimed "notebook photo or worksheet" has no support here. Port the limitation vocabulary and UTF-16 locator idea. |
| HMG18 | yes | yes | adapt | 3 | adapt | `sourceAwareReview.ts` is a clean 76-line validator, but depends on `types.ts` and server `_person-model.js`. Parent-dashboard "why does Taxila think..." is a good fit as a pattern. Large UI files are vyakti Studio specific. Take the re-verify-before-emit pattern (slice equals excerpt, hash equals quote_hash). |
| HMG19 | yes | yes | adapt | 3 | adapt | CSS is 34 lines and scoped to `.person-model`. `run.mjs` (386 lines) needs `vite`, `playwright`, and six local fixtures. The negative-control approach is the valuable part. Kids' target values must be re-set to 48-56 px. |
| HMG20 | yes | yes | adapt | 4 | adapt | `harness.mjs` is largely generic (hostedGuard, PREPARE/EXECUTE, arrayText). It imports `splitSql` from `db/migrations/apply.mjs` and `esbuild`. `run.mjs` (694 lines) is vyakti-specific. Taxila uses Neon, which is plain Postgres, so the approach ports directly. Not a file copy: rewrite `run.mjs` for Taxila's queries. |
| HMG21 | yes | yes | adapt | 3 | adapt | Pattern verified: `ts.transpileModule` into `vm.runInNewContext` with an approved-import map and a poisoned `fetch`. The fixture is 254 lines hardwired to `_room.js`/`_surface.js`. Reuse `loadModule` (about 15 lines). |
| HMG22 | yes | yes | yes, small | 4 | copy | `held-request.mjs` is 63 lines, zero imports. Only the `KINDS` set is hardcoded for the teacher-sheet publication fixture. Copy and change the kinds. |
| HMG24 | yes | yes | adapt | 3 | adapt | Registry has exactly 24 sources and 11 experiments (verified by parse). Contents are vyakti research, so take the schema, `scripts/research-cycle.mjs` (198 lines) and `evals/research-cycle/run.mjs` and reseed. Not "copy as is". |
| HMG25 | yes | yes | adapt | 4 | adapt | Hashes frozen in `run.mjs`; 48 cases (README), 23 contract checks. Honest about limits ("not an external benchmark", "do not tune the corpus and call it held out"). Pattern is portable. Cases are vyakti-specific and cannot be reused for comprehension detection. |
| HMG26 | yes | n/a (doc) | yes | 3 | adapt | Doc is a 276-line dated ledger. The six levels are real in practice, but the file is mostly run-by-run narrative. Extract the level definitions only. |
| HMG27 | yes | no (design only) | yes | 3 | idea | `GROUP-DELIVERY-DURABILITY` is a design. The ledger above says durable effects "remain planned", so nothing is built. Good conceptual input for generation jobs and payment webhooks. Do not treat it as tested. |
| HMG28 | yes | no (design only) | adapt | 3 | idea | Design doc for Telegram-to-web account linking. Taxila's parent-child-device model differs. Take the challenge-binding idea only. |
| HMG32 | yes | yes | adapt | 3 | adapt | `release-gate.yml` is 285 lines and coupled to `verify-release.mjs`, `write-config.mjs --stub` and a pinned history archive. `build-apk.yml` is Capacitor and out of scope until Android. Reuse the no-`secrets.` assertion, the Node matrix, and the 7-day sanitized logs. |
| HMG36 | yes | yes | adapt | 3 | adapt | ~35 lines. It depends on the vyakti `engine` (`openCommitments`, `hisVocabulary`). The principle (derive vocabulary only from raw human text, never JSON keys or labels) is sound and cheap to adopt. |
| HMG38 | yes | yes | adapt | 4 | adapt | `roomSourceCandidates` and `roomHistoryEvidence` apply the predicate before `ORDER`/`LIMIT` (verified in SQL). Tied to `meera_log` and `vy_episode`. Port the pattern, not the SQL. |

Net: the two true copies are HMG01 and HMG22. HMG03 and HMG04 are near-copies and are worth adapting. Anything that depends on `_room.js`/`_surface.js` is a rewrite with these files as the design reference. Downgrades from the reader: HMG06 (overclaimed target), HMG07/08/13/14 (idea only), HMG27/28 (unbuilt design), HMG19/20/24 (copy to adapt). Entangled with Meera persona or companion register, and so barred as text under Taxila's child-safety floor: HMG13 and HMG14.
