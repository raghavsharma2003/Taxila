# Harvest: hp-vyakti-a (Vyakti Rooms v1, waves WS-R1 to WS-R50, older half of gurukul-platform..vyakti-completion)

Harvested 2026-10-02 from `/home/user/html-portfolio`. Read-only: every claim came from `git show`, `git log` or `git diff`
against refs. Nothing was checked out, committed or pushed.

**Range and refs.** `git log --reverse origin/claude/gurukul-platform..origin/codex/vyakti-completion` lists 560 commits. This
segment is the first 280 (2026-09-03 to 2026-09-04): `52527985` ("room: migration 071") through `9914905f` ("Log WS-R43 session
to context"). The base is `771feef9` (= tip of `claude/gurukul-platform`, 2026-08-28).

**Why the end ref is `b5348dc0` and not `9914905f`.** Commit #280 in topological `--reverse` order is `9914905f`, but it sits on the
WS-R43 side branch. It is missing 27 of the 280 commits (the WS-R40, R41, R42 and R44 work). `b5348dc0` ("Merge WS-R43", commit
#283) contains all 280 (`git merge-base --is-ancestor` was checked for each). So every `path@ref` below uses `@b5348dc0`, written
`@R` for short, unless a different ref is named. `git diff --shortstat 771feef9 b5348dc0`: 314 files, +93,969 / -3,468.
`context/graph.json` grew from 747 nodes and 896 edges to 1,171 nodes and 1,429 edges.

**Secrets.** None copied, and none found in the range. A pattern scan of every added line (`sk-`, `rzp_live_`/`rzp_test_`,
`AKIA`, JWT prefixes, `xox`, `ghp_`) returned 0 hits. `api/_config.js` and `.env*` are not in the diff because they are
gitignored. `docs/gurukul/ENV-MANIFEST.md` and `docs/gurukul/VOICE-EXACT-TEXT-MATCHED-PACK.md` name env variables and use `<key>`
placeholders only.

**Notation.** "[inference]" marks my reasoning for Taxila, not something the repo measured. "offline" means a fake `db`, no network
and no model call.

---

## 1. What this is

### 1.1 Vyakti, and what "Rooms" means

Vyakti is the second product built in this repo, beside Meera. `context/STATE.md@R` describes it as "a self-serve platform where
ANYONE builds an exact AI version of themselves — mind, voice, relation, long-term continuity — from their own context". The
first vertical was edtech: JEE teachers, then a student app (`horizontal-platform-reweight`, 2026-08-26). Meera was deprioritised
as a product, but its engine gates stay. Vyakti reuses the RelationalOS engine: `src/engine/compiler.ts` via `api/_engine.gen.js`,
plus `gatedReply` in `api/_surface.js`.

**Vyakti Rooms v1** was adopted 2026-09-02 (`AGENTS.md@R`, `CLAUDE.md@R`). It is the product definition this segment builds.
- A creator brings an archive. The platform turns it into an AI version of them, called "your AI" to the creator and "`<Name>`
  AI" to a follower. The word "clone" never appears in a user-visible string. An incomplete AI is an "apprentice".
- Every follower gets a **private, continuing relationship** at `/r/<slug>`. It remembers them, checks in on them, and never reveals
  them to anyone else.
- **Three scopes never blur.**
  1. Creator material flows down to every follower.
  2. A follower's words stay in that follower's private scope. They never write back into the creator's persona and never reach
     another follower.
  3. The creator sees only counts, over an opt-in shared subgraph, with n>=5 and never a verbatim quote.
- **Readiness** is one number made of five parts, with one suggested action. Publishing is locked below 70 overall or below 55 on
  any part.

So Vyakti is not a group-AI or multi-agent system. It is a 1-creator-to-N-followers **private-relationship platform** with:
- a creator studio (Feed / Meet / Share);
- a follower app (the Room);
- B2B "Suites", where an organisation owns seats;
- money (Razorpay subscriptions, payouts);
- delivery channels (web, Telegram, WhatsApp templates, web push);
- a wall of offline release gates.

`api/_org.js@R` names "the GroupAI kernel (../Vyakti-GroupAI, packages/relational-core)" as a Phase 3 cross-Room port. It is
explicitly **not built** in this segment.

**[inference] Mapping to Taxila.** creator → the AI teacher's authored curriculum/persona (or the school). follower → student.
Suite → school. "counts only" → the teacher/school dashboard. Parents need *more* visibility than a Vyakti creator gets, because
DPDP makes them the data principal's guardian. So Taxila needs a fourth, parent scope that Vyakti has no analogue for.

### 1.2 The waves (workstreams) in this segment

All 50 workstreams were built by parallel agents in git worktrees and merged by a "main loop". Every workstream logged to
`context/`, which is why this harvest has so many rejections.

| WS | what it built | key files @R |
|---|---|---|
| R1 | The Room (follower side): HMAC session, bound disclosure, free cap predicate, threads, export/forget | `api/_room-surface.js`, `api/room.js`, `db/migrations/071_room.sql`, `src/room/*`, `room.html` |
| R2 | Owner identity by **voice** (speak a server sentence + numeric nonce on camera; ECAPA cosine + Sarvam transcript) | `api/_replica-voice-identity.js`, `api/_voice-identity/verifier.js`, migration 072, `src/studio/VoiceIdentityChallenge.tsx` |
| R3 | Readiness: one number, five parts, publish lock as SQL predicate | `api/_readiness.js`, migration 073, `src/studio/ReadinessPanel.tsx` |
| R4 | Review queue: Sounds right / Close, fix it / Never say this | `api/_review-queue.js`, `api/_review-queue/questions.js`, `api/_never-rules.js`, migration 074 |
| R5 | Interview: gap model over the archive, Mirror Call `mode=interview` | `api/_interview-gaps.js`, `api/_interview-store.js`, migration 075 |
| R6 | Vendor bench arms: ElevenLabs (clone) and Sarvam Bulbul (Indian-accent base) | `api/_voice/providers/{elevenlabs-pvc,sarvam-bulbul,vendor-common}.js` |
| R7 | Room publish (creator side), publish lock reusing the readiness fragment | `api/_room-publish.js`, `src/studio/RoomStudio.tsx` |
| R8 | **Leak battery**: 16,080 cross-follower checks, 0 leaks, release gate | `evals/room-leak/run.mjs`, `evals/room/fixtures.mjs` |
| R9 | Drift watch (provider silent model swap, score drop) | `api/_drift-watch.js`, migration 076 |
| R10 | Rooms vocabulary copy gate (117 hits fixed) | `scripts/check-copy.mjs`, `scripts/roomsVocabAllowlist.mjs` |
| R11 | Money: price band, ledger, Razorpay seam, payouts | `api/_payments.js`, `api/_payments/providers/{razorpay,fake}.js`, migration 078 |
| R12 | Week-six retention cohorts | `api/_room-cohorts.js`, migration 077 |
| R13/R15 | Docs made true; `scripts/first-room.mjs`; Phase 0 runbook | `docs/gurukul/PHASE-0-RUNBOOK.md` |
| R16 | Check-ins (follower-scheduled, paid, never on silence) | `api/_checkins.js`, migration 079 |
| R17/R35 | Pulse v0/v1: k-anonymous topic counts, pairwise suppression | `api/_pulse.js`, migrations 080/097 |
| R18/R34 | The Room on Telegram; check-ins over Telegram | `api/_room-telegram.js`, migrations 082/096 |
| R19 | Paid tier: fair-use ceilings and a metered voice reply | `api/_room-voice.js`, migration 081 |
| R20 | Handoff v0: a follower asks for the human | `api/_handoff.js`, migration 083 |
| R21 | Sweep heartbeats + platform ops board | `api/_sweep-run.js`, `api/_ops.js`, migration 084 |
| R22 | Web push (hand-rolled RFC 8291/8292), installable Room | `api/_push/webpush.js`, `api/_room-push.js`, migration 085 |
| R23/R47 | Creator applications and invites; creators invite creators | `api/_invites.js`, `api/_apply.js`, migrations 086/106 |
| R24 | The Room in Hindi (Devanagari) | `src/room/copy.ts`, migration 087, `evals/room-locale` |
| R25 | Creator funnel | `api/_funnel.js`, migration 088 |
| R26/R32 | Abuse limits as a persistent predicate; OTP doors | `api/_rate-limit.js`, migrations 089/094 |
| R27 | Forget receipts + export completeness gate | `api/memory.js`, migration 090, `evals/room-export` |
| R28/R33/R48 | Suites (B2B), Suite billing, self-serve Suites | `api/_org.js`, migrations 091/095/107, `site/suites.html` |
| R29 | Check-ins over WhatsApp utility templates | `api/_room-whatsapp.js`, migration 092 |
| R30 | Conversion moment ("a session that worked") | `api/_phase-gate.js`, migration 093 |
| R31 | Studio collapsed to Feed / Meet / Share | `src/studio/StudioShell.tsx` |
| R36/R37 | Creator payouts; renewals and reminders | migrations 098/099, `api/_renewals.js` |
| R38/R44 | **Door battery** (every way into a Room attacked offline) | `evals/room-doors/*` |
| R39 | The follower's own settings page | `src/room/AccountPage.tsx`, migration 101 |
| R40 | Share + arrival counting; crawler-only unfurl | `api/_room-page.js`, migration 102 |
| R41 | Provider contracts verified against providers' own docs | `api/tg.js`, `api/whatsapp.js`, `api/_push/webpush.js`, razorpay |
| R42 | Money reconciles; **mirrored-constant gate** | migration 104, `scripts/check-mirrors.mjs` |
| R43 | Room browser battery (glyphs, 390 px, tap targets, pointerdown) | `scripts/check-layout.mjs`, `src/room/layoutFixture.tsx` |
| R45 | Creator directory + sitemap | `api/_creators.js`, `api/_sitemap.js`, migration 105 |
| R46 | Room embed script (no iframe) | `api/_room-embed.js` |
| R49 | **Performance budget gate** (bad Indian 4G day) | `scripts/check-performance.mjs` |
| R50 | **Accessibility gate** (axe WCAG 2.1 AA + keyboard walk) | `scripts/check-accessibility.mjs` |

### 1.3 How far it got (LIVE vs not)

**Live.**
- Migrations 071–099, 101, 102, 104–107 were applied to live Neon. Every new statement was `EXPLAIN`ed (never `EXPLAIN ANALYZE`)
  before merge. Each one has a `rooms-migration-0NN-live-verification` entry in `context/measurements.md@R`.
- The release gate went from 14 checks to **20 checks without `NEON_URL`** after R42. The checks added in this segment: room leak
  battery, room export completeness, room door battery, accessibility, performance budgets, mirrored constants.

**Not live.**
- `context/STATE.md@R`: "**No real row has been written to any of these six tables outside a fake `db` in an offline eval**". This
  holds for every Rooms table. No real `vy_room` row was ever inserted. No follower ever joined. No payment provider was ever
  called.
- **Model keys are absent on the studio Vercel project**, so "every LLM-backed reply on that project, Room included, cannot produce
  a completion" (`STATE.md@R`, `ENV-MANIFEST.md` §25).
- One preview smoke test exists (4 curl probes, §4).
- The voice-likeness problem from the previous segment is unchanged: "no human has listened" (`no-human-has-listened`).

**Maturity in one line.** Exceptionally well-gated *prototype* code, against a live schema, that has never served a real user. The
gates and the decision modules are the most reusable parts. The product surfaces are unproven.

---

## 2. Reusable assets

Maturity uses the harness enum. "shipped-measured" is used only for the gates, which run on every release with printed numbers.

| # | path@ref | what | maturity | Taxila use | target subsystem |
|---|---|---|---|---|---|
| 1 | `api/_room-surface.js@R` (2,700 lines) | The follower lane. Covers open/join/say/speak/locale/threads/history/export/forget/settings/citations/stats. Every decision is a pure-ish function over an injectable `db` | prototype | **adapt** as the student session lane | relational-os |
| 2 | `api/_room-surface.js@R` `mintRoomSession`/`readRoomSession`/`assertSessionFresh` | `r1.<b64 payload>.<HMAC>` token, constant-time compare, 12 h TTL. The secret must be 32+ chars and "UNSET MEANS THE ROOM IS OFF" (503) | prototype | **copy** | auth/accounts |
| 3 | `api/_room-surface.js@R` `roomDisclosureCard` + `dd` digest | App-voiced (never model-voiced) 3-sentence disclosure in EN/HI, hashed into the session. Every turn recomputes it and refuses `room_disclosure_stale` on mismatch | prototype | **adapt** as a child-appropriate "I am an AI teacher" card bound to the session | safety-floor/honesty |
| 4 | `roomSay` cap `UPDATE` @R | One conditional `UPDATE` rolls the month and increments in the same statement. Allowance is read from a column; paid/free is one `CASE`. Zero rows = refused (402) before any model call | prototype (eval-proven 20 ok / 21st refused) | **copy** for daily-minutes and free-lesson caps | payments / gamification |
| 5 | `recordRoomConsent`, `joinRoom` @R | Age attestation + memory consent written as ledger rows (`room_age`, `room_memory`, version 1). The memory answer is **replaced, not coalesced**. Locale is deliberately absent from the conflict `SET` | prototype | **adapt** for verifiable parental consent rows | auth / consent (DPDP) |
| 6 | `personForAccount` @R | Auth id → person bridge minted under `pg_advisory_xact_lock`, so two first requests make one person, not two | prototype | **copy** | db-schema |
| 7 | `roomThreadDevice` @R | Threads are a uuid-v5 device partition of one person's log. No new column on the log table, and whole-wipe still reaches them | prototype | idea | memory-graph |
| 8 | memory-free path in `roomSay` @R | No consent means no episode, no log and no retrieval. The transcript rides on the client, bound by `transcriptDigest`, and a client that edits history is refused | prototype | **adapt** for a student/parent who declines memory | relational-os / safety |
| 9 | `roomSpeak` + `lr` reply binding @R; `api/_room-voice.js@R` | Voice only *renders* a reply that already passed `gatedReply`. The session carries `sha(said)`. Order: spend the voice-seconds cap in one `UPDATE`, then synthesise, protect (watermark), and only then return | prototype | **adapt**: Taxila TTS must never be a second way to make the teacher speak | tts-voice-identity |
| 10 | `api/_never-rules.js@R` (97 lines, imports nothing) + `gateReply(..., neverRules)` in `api/_surface.js@R` | "Never say this" rules as an output predicate. NFKC-normalise, 6-token shingles, min 3 chars, max 200 rules. A match **suppresses** the reply and logs the rule id, never the text | prototype (117/117 offline) | **copy** for school/parent "never say" lists and child-safety phrase blocks | safety-floor |
| 11 | `api/_review-queue.js@R`, migration 074, `src/studio/ReviewQueue.tsx@R` | Card queue (cap 30) with three decisions. Each decision is gated on its own write landing in the SAME statement. `fixed` ⇔ a correction source exists, enforced by CHECK | prototype | **adapt** as teacher/SME review of AI explanations | evals / company-brain |
| 12 | `api/_review-queue/questions.js@R` | Generates "questions the audience will ask" from the replica's own sources. Strict JSON schema (`question`, `source_ids` ≤4, ≤30 items). The answer is NOT generated: the real AI answers it | prototype | **adapt** for NCERT-chapter question sets | learning/curriculum |
| 13 | `api/_readiness.js@R`, migration 073 | Five parts, each either measured (n, method, date) or "not measured yet" plus ONE action. `overall`/`min_part` are **null while any part is unmeasured**, enforced in JS and by two CHECKs | prototype (120/120 offline) | **adapt** as a mastery/learning-profile report with no fake numbers | learning/pedagogy |
| 14 | `api/_clonechannel.js@R` `readinessPasses` + `api/_room-publish.js@R` | The publish lock is a `CASE` inside the write, a shared SQL fragment imported across 3 writers. The blocker list is a "courtesy read" that is never the gate | prototype | idea (for gating a generated module/lesson before a child sees it) | safety / generative-ui |
| 15 | `api/_interview-gaps.js@R`, `api/_interview-store.js@R`, migration 075 | Pure gap model: four closed kinds (contradiction, sheet_field, thin_topic, readiness), 5 opening gaps per 20 min. **Shapes, not questions**; cited fragments capped at 9 words / 80 chars. Gap list frozen at session open | prototype | **adapt** as a learning-profile discovery engine | learning-profile |
| 16 | `spliceInterviewAsk` in `api/_mirrorcall-reply.js@R` | Splices the ask block immediately BEFORE `FORGET_DECISION`, or refuses `interview_ask_unplaceable`. The appended-last set stays exactly two | prototype | **adapt** for any per-turn teacher "ask" injection | prompt-compiler |
| 17 | `dialogueRegister` in `api/_person-model.js@R` | `speech.dialogue_register` = claim ids from interview sources. It is a retrieval pointer, never a confidence reweight; the block is present even when empty | prototype | idea | memory-graph |
| 18 | `api/_replica-voice-identity.js@R`, `api/_voice-identity/verifier.js@R`, migration 072, `VoiceIdentityChallenge.tsx@R` | Speaker verification as identity. Sentence bank + 6-digit spoken nonce. ECAPA cosine (accept ≥0.78, review 0.70–0.78, reject <0.70) AND transcript F1 ≥0.60 AND nonce. Content-free basis whitelist. Behind `VOICE_IDENTITY_CHALLENGE`; never exercised end to end | prototype | **adapt** for teacher/parent voice-clone consent proof; idea for "which sibling is speaking" | voice-cloning / auth |
| 19 | `normalizeChallengeSpeech`, `transcriptOverlap`, `nonceSpoken` @R | NFKC; keeps `\p{M}` (does not shred Devanagari); folds 9 Indic digit ranges to ASCII; bag-of-words F1 | prototype | **copy** for covert answer matching on Hindi/Hinglish ASR | learning (comprehension) |
| 20 | `src/studio/wavCapture.ts@R` | 24 kHz mono PCM16 WAV encoder + `OfflineAudioContext` resampler, mic-permission error copy, and a capture tap on an already-open MediaStream | prototype | **copy** | realtime-voice |
| 21 | `api/_voice/providers/sarvam-bulbul.js@R` | Sarvam `POST /text-to-speech` (bulbul:v3, max 2,500 chars, `hi-IN`/`en-IN`, ~44 preset speakers, default `priya`). 402 is surfaced as a named "waiting on you" | prototype (fixture-proven, never called) | **adapt** as an Indian-accent TTS candidate | tts-voice-identity |
| 22 | `api/_voice/providers/elevenlabs-pvc.js@R` | ElevenLabs IVC `/v1/voices/add`, PVC ceremony, TTS `pcm_24000`, delete. PVC verification is reported as pending, never faked | prototype | **adapt** if a teacher voice clone is offered | voice-cloning |
| 23 | `api/_voice/providers/vendor-common.js@R` + `scripts/voice-matched-pack.mjs@R` + `evals/voice-matched-pack/contract.mjs@R` | Exact-text matched listening pack. `verifyVendorResult` is separate from the self-hosted verifier: it refuses a vendor claiming a watermark and refuses self-hosted output that lost one. Arms are opaque, counterbalanced cells | prototype | **adapt** for a blinded TTS bake-off for kid-friendly Hindi voices | evals / tts |
| 24 | `api/_voice/registry.js@R` | `VOICE_PRIMARY_LANE` is the single env that moves the primary lane, read in one place. It throws rather than falling back | prototype | idea | infra |
| 25 | `api/_provider-budget.js@R` (pre-existing, extended) | reserve → begin → settle / release / uncertain spend ledger per provider operation, with Foundry, speech and vendor-voice rate cards from env | prototype | **adapt** for Azure Foundry realtime/text/image spend guards | infra/azure |
| 26 | `api/_drift-watch.js@R`, migration 076, `api/drift-watch-sweep.js@R` | Detects a provider silently swapping a model under the same name via the generation ledger's model commitment. Score drop of 0.02 only within the same reference set. States: steady / moved / not_measured. The sweep is the sole writer; GET never writes | prototype | **adapt** for Azure deployment drift (gpt-realtime/gpt-5.6 behaviour change) | evals/telemetry |
| 27 | `api/_pulse.js@R`, migrations 080/097 | Opt-in per conversation. Labels are creator-typed, never follower text. `check (follower_count >= 5)` is in DDL. v1 adds a pairwise rule (S publishes only if every S∪{L} is 0 or ≥5) and combos ≤2 labels; `suppressed` is a count, never a list | prototype | **adapt** for school/teacher class insights | parent/school dashboard |
| 28 | `api/_room-cohorts.js@R`, migration 077 | Week-six retention per ISO-week cohort. The verdict is the OLDEST measurable cohort. Day table is content-free (room, person, day, turns) | prototype | **adapt** | telemetry/growth |
| 29 | `api/_phase-gate.js@R`, migration 093 | "A session that worked" = ≥4 own messages in the current 30-min-gap session, continued from an earlier day. Offer cooldown 14 d; `not_enough_data` below 20 followers. The offer is a flag after the reply, never mid-turn | prototype | **adapt** for the parent-upgrade moment (NEVER MANIPULATE) | payments/growth |
| 30 | `api/_checkins.js@R`, migrations 079/085/096 | Follower-scheduled check-ins; "never on silence" because `next_due_at` is the only due column. The paid/free split is two SQL statements, not a JS `if`. Memory consent is required at opt-in. `checkinDirective` is a shape. Quiet hours shift, not skip | prototype | **adapt** for study reminders; **copy** `computeNextDue` | relational-os / gamification |
| 31 | `computeNextDue`/`zonedTimeToUtcMs`/`quietExit` @R | IANA tz via `Intl`, no dependency. Two-pass offset convergence, midnight-wrapping quiet windows, ISO weekdays. DST spring-forward gap is a known, measured flaw | prototype | **copy** (Asia/Kolkata has no DST) | relational-os |
| 32 | `api/_handoff.js@R`, migration 083, `src/room/HandoffPanel.tsx@R` | A follower asks the human. The verbatim payload is shown, hashed and consented (`sent_at` + `policy_version`). The creator's reply is never sent to the model and never written into the log the model reads. Per-follower monthly cap 5, default off. No model call anywhere in the file | prototype | **adapt** for "ask your real teacher/parent" escalation | safety-floor / parent |
| 33 | `api/_payments.js@R`, `api/_payments/providers/{razorpay,fake}.js@R`, `api/payments-webhook.js@R`, migration 078 | Provider seam that **refuses by default** (`PAYMENTS_PROVIDER=none`), with twin providers. Razorpay Plans + Subscriptions + UPI Autopay; webhook HMAC-SHA256 over the RAW body; ten event kinds as a CHECK. Take rate is copied onto each ledger row; tier flip is in the same multi-CTE write | prototype (never called live) | **adapt** for parent subscriptions | payments |
| 34 | `api/_renewals.js@R`, migration 099, `src/room/SubscriptionPanel.tsx@R` | Renewal reminder ledger; cancel is a flag separate from state; "renewed unasked" counted | prototype | **adapt** | payments |
| 35 | payouts (`api/_payments.js@R` payout ops, migration 098, `PayoutsCard.tsx@R`) | Creator payouts via RazorpayX, TDS default 0 with a disclosure sentence | prototype | skip (no creator payouts in Taxila v1) | payments |
| 36 | migration 104 + `evals/payments-reconcile/run.mjs@R` + `scripts/check-mirrors.mjs@R` | Ledger reconcile; the **mirrored-constant gate** checks `// mirror of api/<file>#NAME` markers so front-end literals cannot drift from server constants | shipped-measured (gate 20/20) | **copy** check-mirrors | evals/gates |
| 37 | `api/_org.js@R`, migrations 091/095/107, `src/studio/SuiteCard.tsx@R`, `site/suites.html@R` | Suites: an org owns seats, never a follower. Membership is only ever the member's own write. Attach is a 3-condition `UPDATE` predicate; the admin board is aggregate-only via `roomOverview`. Seat prices are named placeholders (INR 2,999 / 1,999 at ≥10 seats) | prototype | **adapt** as the school/coaching-institute tenant | auth / B2B |
| 38 | `api/_rate-limit.js@R`, migration 089 | Persistent rate limit. ONE upsert is the check (`... do update ... where count < $limit returning count`). Key = sha256(scope, key, salt, UTC day). Named per-scope limits; unknown scope fails closed; honest 429 + `Retry-After` | prototype (offline + live migration) | **copy** | infra |
| 39 | `api/_push/webpush.js@R`, `api/_room-push.js@R`, migration 085, `public/room-sw.js@R` | Hand-rolled RFC 8291 aes128gcm + RFC 8292 VAPID over `node:crypto`. Revoke on 404/410; one ledger row per occurrence; VAPID public key served at runtime. R41 reproduced RFC 8291 Appendix A byte for byte | prototype (no live browser interop) | **adapt** for parent web push; Android/Capacitor should use FCM natively | notifications / android |
| 40 | `api/_room-whatsapp.js@R`, migration 092, `api/room-wa.js@R` | Check-ins as a WhatsApp **utility template only** (never free text outside the 24 h window). Payload is 4 public facts. 429 is NOT a revoke; E.164 stored, digits on the wire. Inbound gets one deterministic app-voiced line, no model | prototype (template never submitted to Meta) | **adapt** for parent notifications (WhatsApp-first India) | notifications |
| 41 | `api/_room-telegram.js@R`, migrations 082/096, `api/room-tg.js@R` | One platform bot; chat→Room pointer table; `/start <slug>`, `/stop`, `/forget` | prototype | skip (children are not on Telegram); idea for a parent bot | notifications |
| 42 | `api/memory.js@R` `roomForgetReceiptHash`/`purgeRoomForgetReceipts`, migrations 090/094, `evals/room-export/run.mjs@R` | The forget receipt names no person (`person_hash`), is shown once and is recomputable at whole-wipe time. Deletes run child-before-parent so counts are honest. The export completeness battery is a release gate | shipped-measured (gate) | **adapt** for DPDP erasure receipts | DPDP / db-schema |
| 43 | `api/memory.js@R` `PERSON_TABLES` + `evals/recall/run.mjs` FATE + `evals/persontables.mjs@R` + `scripts/relcheck.mjs@R` | Manifest of person-keyed tables, each with a written forget fate. An offline DDL scan and a live FK-walk prove no table escapes wipe/export | shipped-measured | **adapt** | db-schema / DPDP |
| 44 | `isTableAppliedFor(deps)` @R (`tableApplied` in `api/memory.js`) | Writes to a table whose migration ships with the code are gated on a cached `to_regclass` probe, so a deploy cannot 500 before the migration lands | prototype | **copy** | infra / deploy |
| 45 | `evals/room-leak/run.mjs@R`, `evals/room/fixtures.mjs@R` | N∈{2,5,20} followers × 4 turns through the REAL lane and REAL compiler, scanning prompts, recalled facts and replies for every other follower's tokens. Static writer-symbol call graph; 2 negative controls that must fail | shipped-measured | **adapt** as a student-to-student isolation battery for one AI teacher | evals |
| 46 | `evals/room-doors/run.mjs@R`, `evals/room-doors/fixtures.mjs@R` | Attacks every public door through real decision modules: forged/stale session, cross-room, body-supplied ids, webhook replay, other owner's bearer, rate-key malformation, invite guessing, OTP brute force. Computed door list must equal `EXPECTED_DOORS` | shipped-measured (297 assertions) | **adapt** | evals / security |
| 47 | `evals/sqlcast.mjs` + `evals/sqlcast/surface.mjs@R` | Static scanner: every bound `$n` on a strict surface needs an explicit cast at every site | shipped-measured | **adapt** for Neon | evals |
| 48 | `scripts/check-accessibility.mjs@R` | axe-core WCAG 2.1 A/AA inside real Chromium plus a hand-written Tab/Enter/Space/Escape walk. 13 pages including reduced-motion and forced-colors. Fails on ≥1 serious/critical; self-test with a planted defect; owns port 8933 | shipped-measured | **copy** | design-system / evals |
| 49 | `scripts/check-performance.mjs@R` | CDP throttle (CPU 4×, 1.6 Mbps / 750 Kbps / 150 ms RTT) on built `dist/`, gzip like Vercel. Budgets LCP 2,500 ms, CLS 0.1, TBT 300 ms, JS 180 KB, fonts 120 KB; n=3 cold contexts, median; port 8932 | shipped-measured | **copy** | evals / infra |
| 50 | `scripts/check-layout.mjs@R` (TARGETS), `room-layout-fixture.html@R`, `src/room/layoutFixture.tsx@R` | Multi-target readability gate at 390/834/1355 px: tap targets ≥44 px, pointerdown feedback, Devanagari glyph-width vs tofu, tabular nums, full-page screenshots; `color(srgb ...)` parse fix | shipped-measured | **adapt** | design-system |
| 51 | `scripts/check-copy.mjs@R` rooms-vocabulary + `scripts/roomsVocabAllowlist.mjs@R` | Bans words in user-visible strings with a narrowly-scoped legal-text allowlist. Devanagari text nodes fixed (R24) | shipped-measured | **adapt** (Taxila list, e.g. "test", "exam", "wrong answer", "model") | design-system / safety |
| 52 | `api/_sweep-run.js@R`, migration 084, `api/_ops.js@R`, `src/studio/OpsBoard.tsx@R` | `withSweepRun` writes at start and again at finish, so a hard-killed cron reads "running". `sanitizeCounts` keeps numbers/booleans only. Ops endpoint answers **404 not 403** | prototype | **copy** | telemetry |
| 53 | `api/_funnel.js@R`, migration 088 | Creator funnel ("minutes to first Room"). Ownership predicate inside the INSERT; stall = unpublished after 7 days | prototype | **adapt** (parent onboarding funnel) | growth / telemetry |
| 54 | `src/room/copy.ts@R` `ROOM_COPY_TABLE`, migration 087, `evals/room-locale/run.mjs@R` | EN/HI copy table with key parity checked against the real export. Locale chain: follower's stored choice > browser hint (first visit only) > room default | prototype | **copy** pattern | design-system / i18n |
| 55 | `src/room/room.css@R` | Mobile-first 390 px. `:lang(hi)` system Devanagari stack (no web fonts), `.room-num` tabular-nums, `:active` scale on every control, reduced-motion branches | prototype | **copy** | design-system |
| 56 | `src/room/RoomApp.tsx@R` `activateOnKey` | `onPointerDown` for latency plus `onKeyDown` Enter/Space with `preventDefault`. Fixes 18 keyboard-dead buttons | prototype | **copy** | design-system |
| 57 | `src/room/RoomApp.tsx@R`, `AccountPage.tsx@R`, `CheckinsPanel.tsx@R`, `SubscriptionPanel.tsx@R` | Follower UI: join card (age + memory answer), threads, cap card, offer card, account page (memory, push, WhatsApp, export, forget) | prototype | **adapt** for student/parent screens | design-system / ux |
| 58 | `api/_room-embed.js@R`, `api/room-embed.js@R` | Embeddable button (script + JSON, 1,677 B minified), no iframe; unknown and unpublished are indistinguishable | prototype | idea (school-site embed) | growth/seo |
| 59 | `api/_creators.js@R`, `api/_sitemap.js@R`, `site/creators.html@R`, migration 105 | Public directory + sitemap with the same listed-and-published predicate; absence reveals nothing | prototype | **adapt** (teacher/course directory, SEO) | growth/seo |
| 60 | `api/_room-page.js@R`, `vercel.json@R` UA rewrite, migration 102 | Crawler-only unfurl: a `has: user-agent` rewrite routes bots to a function; people get a static file. Share URL carries no sender identity; arrival counted per open | prototype | **adapt** for WhatsApp share previews | growth/seo |
| 61 | `api/_invites.js@R`, migrations 086/106, `InviteCreatorCard.tsx@R` | Invite predicate inside the replica-create `INSERT`; canonicalised codes; creator quota 3 | prototype | idea (parent referral codes) | growth |
| 62 | `public/room.webmanifest@R` + blob-URL manifest swap in `RoomApp.tsx` | Per-tenant PWA `start_url` without a server route (unproven on real installs) | prototype | idea | android/pwa |
| 63 | `scripts/first-room.mjs@R`, `docs/gurukul/PHASE-0-RUNBOOK.md@R` | One-command end-to-end script with `ok/skip/blocked/fail`, where `blocked` means an honest lock, not a bug | prototype | idea | infra/devex |
| 64 | `src/studio/StudioShell.tsx@R`, `studioShellModel.ts@R` | Three-tab creator shell (Feed / Meet / Share) over the unchanged panel tree; nine panels lazy-loaded | prototype | idea (teacher/parent console IA) | design-system/ux |
| 65 | `vercel.json@R` crons | 5-min identity sweep, 6-h drift sweep, 15-min check-ins, daily renewals (`0 0 * * *`) | prototype | idea | infra/vercel |

---

## 3. Key code excerpts worth porting (verbatim, short, no secrets)

### 3.1 The disclosure card, app-voiced, two locales (`api/_room-surface.js@R`)

```js
export function roomDisclosureCard(creatorName, locale = "en") {
  const name = String(creatorName || "").trim() || "this creator";
  if (normalizeLocale(locale) === "hi") {
    return [
      `आप ${name} AI से बात कर रहे हैं। यह ${name} नहीं है।`,
      `${name} ने इसे अपनी सामग्री से बनाया और यहां प्रकाशित किया। ${name} यह बातचीत नहीं पढ़ते।`,
      `आप जो कहते हैं वह सिर्फ आपकी अपनी थ्रेड में रहता है। ${name} AI से बात करने वाला कोई और इसमें से कुछ भी नहीं देख सकता।`,
    ].join("\n");
  }
  return [
    `You are talking with ${name} AI. It is not ${name}.`,
    `${name} built it from their own material and published it here. ${name} does not read these conversations.`,
    `What you say stays in your own thread. Nobody else who talks to ${name} AI can see any of it.`,
  ].join("\n");
}
```

Every op recomputes it from what the **token** was minted in (`payload.loc`), never from the row:
`if (payload.dd !== sha(disclosure)) throw new RoomError("room_disclosure_stale", 409);`

### 3.2 One staleness check, shared by every door (`api/_room-surface.js@R`)

```js
export function assertSessionFresh(payload, now = Date.now()) {
  if (!Number.isFinite(payload?.iat) || now - payload.iat > ROOM_SESSION_TTL_MS) {
    throw new RoomError("room_session_expired", 401);
  }
}
```

### 3.3 The cap is a predicate, never a counter (`roomSay`, `api/_room-surface.js@R`)

```sql
update vy_room_follower f
   set month_key = $4,
       month_message_count =
         case when f.month_key = $4 then f.month_message_count + 1 else 1 end,
       last_seen_at = now(), updated_at = now()
  from vy_room r
 where r.room_id = f.room_id
   and f.room_id = ($1)::uuid and f.person_id = ($2)::uuid and f.agent_id = ($3)::uuid
   and f.age_attested_at is not null
   and (f.month_key <> $4
        or f.month_message_count <
           case when f.tier = 'paid' then r.paid_monthly_messages else r.free_monthly_messages end)
returning f.month_key, f.month_message_count, f.tier, r.free_monthly_messages, r.paid_monthly_messages
```

### 3.4 "Never say this" as an output predicate (`api/_never-rules.js@R`)

```js
export const NEVER_RULE_SHINGLE = 6;
export const NEVER_RULE_MIN_CHARS = 3;
export const NEVER_RULE_MAX = 200;
export function normaliseForMatch(value) {
  return String(value ?? "").toLowerCase().normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
}
// compileNeverRules: rule <= 6 tokens -> whole; longer -> every 6-token shingle.
// replyViolatesNeverRule(text, compiled) -> rule_id | ""   (caller SUPPRESSES on a match)
```

In `gateReply` (`api/_surface.js@R`) the rule runs last, on the assembled bytes, after the honesty gate:
`if (violated) { console.warn(\`[${label}] never_rule_block rule=${violated}\`); return { text: "", findings, gated: true, parsed: reply, neverRule: violated }; }`

### 3.5 Rate limit, where the write IS the check (`api/_rate-limit.js@R`, migration 089)

```sql
insert into vy_public_rate (scope, key_hash, window_start, count, updated_at)
values ($1, $2, $3::timestamptz, 1, now())
on conflict (scope, key_hash, window_start) do update
   set count = vy_public_rate.count + 1, updated_at = now()
 where vy_public_rate.count < $4
returning count
```

`key_hash = sha256(\`${scope} ${key} ${daySalt(env)} ${dayKeyOf(now)}\`)`. An unknown scope returns
`{ ok:false, code:"rate_limit_unknown_scope" }` (fail closed).

### 3.6 Indic-safe speech normalisation for answer matching (`api/_replica-voice-identity.js@R`)

```js
const DIGIT_FOLD = [[0x0966,0x096f],[0x0660,0x0669],[0x06f0,0x06f9],[0x0be6,0x0bef],[0x0c66,0x0c6f],
                    [0x0ce6,0x0cef],[0x09e6,0x09ef],[0x0a66,0x0a6f],[0x0ae6,0x0aef]];
export function normalizeChallengeSpeech(value) {
  const input = String(value ?? "").normalize("NFKC");
  return foldDigits(input).toLocaleLowerCase("en-IN")
    .replace(/(?<=\p{N})[\s,._-]+(?=\p{N})/gu, "")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")   // keeps \p{M}: stripping marks shreds Devanagari
    .trim().replace(/\s+/g, " ");
}
// transcriptOverlap = bag-of-words F1 (symmetric on purpose); nonceSpoken = digits-only includes()
```

### 3.7 Readiness never averages around a missing instrument (`api/_readiness.js@R`)

```js
const overall = unmeasured.length === 0
  ? Math.round(measured.reduce((sum, row) => sum + row.value, 0) / measured.length)
  : null;
const minPart = unmeasured.length === 0
  ? measured.reduce((low, row) => Math.min(low, row.value), 100)
  : null;
```

### 3.8 Time-zone math with no dependency (`api/_checkins.js@R`)

```js
function zonedTimeToUtcMs(y, m, d, hh, mm, tz) {
  let guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  for (let i = 0; i < 2; i++) {
    const offset = tzOffsetMinutes(guess, tz);
    guess = Date.UTC(y, m - 1, d, hh, mm, 0) - offset * 60000;
  }
  return guess;
}
```

`checkinDirective` wraps a creator's *shape*: "Say it your own way, one or two lines ... never recite this note itself, and
never mention that it is a scheduled or automated message." **[inference] Taxila must review the last clause against its child
honesty floor before reuse.**

### 3.9 Heartbeat that survives a hard kill (`api/_sweep-run.js@R`)

```js
export async function withSweepRun(db, sweep, fn) {
  const runId = randomUUID();
  await insertStart(db, runId, sweep, new Date()).catch(() => {});
  let result;
  try { result = await fn(); }
  catch (err) { await finish(db, runId, "failed", {}, errorCodeOf(err)).catch(() => {}); await pruneOldRuns(db, sweep); throw err; }
  const counts = sanitizeCounts(result);           // numbers/booleans only; arrays -> length; strings DROPPED
  await finish(db, runId, classifyOutcome(counts), counts, "").catch(() => {});
  await pruneOldRuns(db, sweep);
  return result;
}
```

### 3.10 Performance budget shape (`scripts/check-performance.mjs@R`)

```js
const THROTTLE = { latencyMs: 150, downloadBps: (1.6 * 1024 * 1024) / 8, uploadBps: (750 * 1024) / 8, cpuRate: 4 };
const BUDGETS = { lcpMs: 2500, cls: 0.1, tbtMs: 300, jsBytes: 180 * 1024, fontBytes: 120 * 1024 };
```

Bytes are read from CDP `Network.loadingFinished.encodedDataLength`, and the gate's server gzips like Vercel does.

### 3.11 k-anonymity in DDL (`db/migrations/080_room_pulse.sql@R`)

`follower_count integer not null check (follower_count >= 5),`

So even if every check in JS is wrong, the database cannot store a bucket below the floor.

---

## 4. Measurements (n, method, date as recorded; all from `context/measurements.md@R` unless noted)

| claim | n / method | date |
|---|---|---|
| Leak battery: **16,080** retrieval checks + **441** boundary checks, **0 leaks**; 62/62 assertions; both negative controls fire; 5.6–5.9 s | `node evals/room-leak/run.mjs`, offline, deterministic. N∈{2,5,20} × 4 turns × 5 tokens per follower; checks = N·T·(N−1)·(1+T)·2 (80 / 800 / 15,200) | 2026-09-03 |
| Static: 18 creator-material writer symbols across 7 files, 0 reachable from the follower lane (27 files walked) | same suite, layer 1 | 2026-09-03 |
| `gate0-structural` (pre-range, cited everywhere): prompt instruction leaked **57.1%** naturalistic / **98.1%** adversarial; SQL predicate leaked **0 / 31,122** | `evals/mp/gate0.mjs`, live Postgres, 494 scenarios | pre-range |
| Door battery: **109** assertions, 15 doors, 8 attack classes, **2 real findings fixed** (session TTL missing from 7 call sites; thread op with no live-follower check) | `node evals/room-doors/run.mjs`, offline, ~1.8 s; revert-and-rerun proof per finding | 2026-09-04 (R38) |
| Door battery after R44: **297** assertions (+188), same 15 doors, 0 failed, ~1.32 s | same, op list computed from source | 2026-09-04 |
| Release gate: 14/14 → 15 (leak) → 16 (export) → 17 (doors) → 18 (a11y) → 19 (perf) → **20/20** (mirrors) without `NEON_URL` | `node scripts/verify-release.mjs`, n=1 run per step | 2026-09-03..04 |
| Voice identity challenge: 69/69 offline checks, ~0.4 s. Thresholds accept 0.78 / review 0.70; owner ceiling **0.8869** (p10 0.8795) not re-measured. **Impostor distribution unmeasured** | `node evals/identity-challenge/run.mjs`, fixture vectors at dialled cosines (not humans) | 2026-09-03 |
| Vendor list prices: ElevenLabs Creator **USD 0.18 / 1,000 chars**; Sarvam bulbul:v3 **INR 30 / 10,000 chars**; one matched pack 269 chars ≈ USD 0.048 / INR 0.81; default daily cap 20,000 chars ≈ 74 packs | public pricing pages read once each, no account, no invoice | 2026-09-03 |
| Vendor offline suites: voicevendor 45/45, voicematched 74/74 (was 51), 0 network | `node evals/run.mjs voicevendor` / `voicematched` | 2026-09-03 |
| Review queue: 117/117 checks, 5 negative controls; sqlcast 553 statements, 261 on strict surface, 0 uncast | `node evals/review-queue/run.mjs`, `node evals/sqlcast.mjs` | 2026-09-03 |
| Readiness: 120/120 checks, offline; section 4 removes the undefined-overall guard and requires dependent assertions to fail | `node evals/readiness/run.mjs` | 2026-09-03 |
| Live merge: 5 migrations, 61 statements applied; every new API statement `EXPLAIN`ed; found WS-R5 ordering by a non-existent `created_at` inside a try/catch | Neon SQL-over-HTTP, one statement per request | 2026-09-03 |
| Preview smoke: `GET /r/` 200; unknown slug 404 `room_unavailable`; unknown op 400; owner endpoints 401 without bearer. **No real row inserted** | 4 curl probes against the SSO-protected preview | 2026-09-03 |
| Rooms vocabulary: **117** real hits fixed → **0** | `node scripts/check-copy.mjs` | 2026-09-03 |
| `recordOwnedFidelity` has **zero** live callers (only its own eval) | full-repo grep | 2026-09-03 |
| Accessibility BEFORE: 1 serious (`color-contrast`, 6 selectors at **3.47:1–4.11:1** vs 4.5:1) + **5 keyboard findings**. AFTER: 0/0/0/0 across 13 pages; ~30 s runtime (27.6 / 29.9 / 30.1 s) | `node scripts/check-accessibility.mjs`, Chromium 390×844, WCAG 2.1 A/AA | 2026-09-04 |
| 18 buttons were `onPointerDown`-only (7 in RoomApp, 11 in AccountPage), so keyboard-dead | code review + keyboard walk | 2026-09-04 |
| Perf (gate bug): uncompressed serving made `/r/<slug>` read JS 262.5 KB / LCP 2,716 ms (false FAIL). With gzip: **JS 79.7 KB, CSS 29.7 KB, LCP 1,192 ms**, no product code changed | `check-performance.mjs`, CPU 4×, 1.6/0.75 Mbps, 150 ms, n=3 cold, median | 2026-09-04 |
| `/studio`: gzip-correct untouched JS 195.2 KB (over 180) → lazy-loading 9 panels → **137.5 KB (−29.6%)**, LCP 1,860 → 1,460 ms | same, isolated by revert-and-rerun | 2026-09-04 |
| Hindi glyph test: **180** strings, 176 width-tested, **0 failures**; shortest passing diff 30–40% vs tofu; negative control (MIN_GLYPH_DIFF_PCT=200) → 176 findings | real Chromium canvas `measureText`, page's own computed font-family | 2026-09-04 |
| Tap targets: first run 118 findings / 18 controls (30–41 px) → 0 after `min-height`/`min-width` 44 px; negative control MIN_TAP_PX=100 → 158 | `check-layout.mjs --only room`, 390×844 | 2026-09-04 |
| Layout gate runtime 89.9 s → 114–116 s after R43 (4 runs) | `time node scripts/check-layout.mjs` | 2026-09-04 |
| Room embed script: **2,539 raw / 1,677 minified bytes** (cap 6,144) | `Buffer.byteLength` + esbuild minify | 2026-09-04 |
| Mirrored constants: 7 markers across 177 files, 0 disagree, 54 ms; payments-reconcile 30/30 with 4 negative controls | `scripts/check-mirrors.mjs`, `evals/payments-reconcile/run.mjs` | 2026-09-04 |
| Provider contract marks (R41): 7 in scope; **2 verified, 3 fixed** (Telegram `reply_parameters`, Web Push `rs` ceiling, Razorpay `reference_id` ≤40 chars), 2 partial, 4 open | one WebFetch per mark against the provider's own docs, cross-checked | 2026-09-04 |
| Check-in DST: a 02:30 schedule crossing a spring-forward resolves **1 h early** (01:30 EST); 09:00 is correct on both sides | `evals/checkins/run.mjs` §1, America/New_York 2027-03-14 | 2026-09-03 |
| Web push: 43 assertions (round trip vs an independently written decoder, fresh P-256 keys); R41 later reproduced RFC 8291 Appendix A byte for byte | `evals/room-push/run.mjs` | 2026-09-04 |
| Context file doubling: 7,297 + 7,260 → 14,557 lines, 214 duplicated `##` headings; fixed to 7,360 | merge inspection | 2026-09-03 |

**Plan targets (not measurements).** Phase 2 gate: paid conversion ≥12%, week-six retention ≥35%, three creators renewing
unasked (`api/_phase-gate.js@R`). Prices are placeholders: follower INR 299–599/month, take 25%, Suite seats INR 2,999 or 1,999 at
≥10 seats. Free tier 20 msgs/month; paid 500 msgs + 1,800 voice-seconds; session TTL 12 h.

---

## 5. Rejections (tried → what broke)

Highest value first. Every entry is in `context/rejected.md@R` under the slug shown.

### 5.1 Product and architecture rejections

| slug | tried | what broke / why rejected | Taxila lesson |
|---|---|---|---|
| `ws-r2-worker-dag-step-for-a-challenge-clip` | Add `identity_challenge` as a step in the deployed processing worker's DAG | The worker is an Azure Job pinned by image digest and is not rebuilt on push. A new step raises `unsupported_processing_stage`; challenges sit `queued` forever while API/DB look correct. Replaced by a Vercel cron that ships with the push | Never add work to a separately-deployed worker that a push does not rebuild |
| `ws-r2-revoking-identity-when-challenge-evidence-is-deleted` | Mirror the Azure path: revoke identity when evidence is deleted | Evidence is deleted on every outcome, so every accepted challenge would revoke itself microseconds later and the gate could never be satisfied | Know whether a deletion is the settlement's own cleanup or a withdrawal |
| `ws-r6-vendor-arm-reuses-signed-runtime-verifier` | Push vendor arms through the self-hosted verifier (HMAC + PerTh watermark required) | Vendors cannot produce either. Faking `true` would put invented crypto proof into the deciding bench; dropping the checks weakens the self-hosted arms. Built `verifyVendorResult` instead, refusing a mismatch in both directions | Record WHICH evidence each arm carries; never fake it or stop demanding it |
| `ws-r6-sarvam-cloning-from-the-marketing-page` | Build Sarvam as a cloning arm because Bulbul v3 marketing says "supports voice cloning" | The API reference has only ~40 preset speakers and no custom-speaker endpoint (2026-09-03). Rebuilt as an Indian-accent BASE arm; `createVoice` refuses | A capability is documented only when its endpoint is |
| `review-exemplar-needs-a-turn-that-never-happened` | "Sounds right" writes an exemplar row | The exemplar table is keyed to a real completed dialogue turn. Writing it would fabricate a turn plus feedback plus body | Never mint evidence rows to satisfy a schema |
| `review-dedupe-on-the-prompt-collapsed-the-queue` | One dedupe key (kind + prompt) for all card kinds | Claim cards share a fixed prompt, so 50 claims became 1 card. Fix: hash the half being judged | Dedupe on the content being judged |
| `ws-r7-room-for-generic-mode-with-no-disclosure-pathway` | Show the Room publish card in both studio modes | Generic mode can never write the approved disclosure, so the Room would be permanently unpublishable with a blocker pointing at a screen that mode never shows | A blocker whose fix is not on screen is a dishonest blocker |
| `ws-r16-checkins-skip-log-partition-not-a-js-branch` | One due-query plus a JS `if (tier !== 'paid')` | Rejected on inspection: a deletable JS branch is the only thing between a free user and a paid model call. Two SQL statements with complementary WHERE clauses instead | Entitlement belongs in the SQL text |
| `ws-r18-personforsurfaceuser-is-not-db-injectable` | Assumed sibling functions accept an injectable `db` | They call module-level `q()` wrapped in `.catch`, so offline they silently returned null. Null also means "minor, refused", so every join read as a plausible refusal | Read the signature; silent catches make wiring bugs look like product states |
| `ws-r20` handoff decisions (in decisions.md) | Write the creator's human reply into the shared log table | `dmHistory` maps every non-AI role to "user", so the reply would read back as the AI's or the follower's own words. Kept it in its own table | Never let human-authored text enter the model's history under a borrowed role |
| `ws-r24-disclosure-recomputed-from-the-follower-row-...` | Recompute the session disclosure from the row's current locale | A session minted before a language switch (second tab) was refused `room_disclosure_stale`. Fix: the token carries `loc` | Re-derive from what the token committed to |
| `ws-r27-child-before-parent-ordering-bug-...` | Forget/whole-wipe deleted parent tables first | `ON DELETE CASCADE` removed children first, so 4 tables' receipt counts were ALWAYS 0. Fixed by ordering the array child before parent | Receipts built from `returning` are only honest if order respects FKs |
| `ws-r33-widening-subscription-id-fk-instead-of-a-new-column` | One `subscription_id` pointing at two tables | Postgres FKs have one target; dropping the FK breaks 3 workstreams' integrity. Added a new column with its own FK plus a mutual-exclusion CHECK | Add a column; never weaken an FK |
| `ws-r42-third-lane-widening-rejected-on-paper` | Widen the ledger's two-lane CHECK to three | The split columns (`platform_take + creator_share = amount`) mean nothing for platform-only revenue. Built a dedicated table | Don't force a new meaning into old columns |
| `ws-r38-session-ttl-missing-from-most-followerscope-copies` | Each new op copied the previous op's scope shape | 4 sites had the 12 h TTL check and 7 did not (export, forget, history, citations, handoff, check-ins, push, WhatsApp). Stale or stolen sessions worked forever. Fix: one shared `assertSessionFresh` plus a static wiring proof | A missing check across N sites means a missing shared primitive |
| `ws-r38-thread-op-no-live-follower-check` | `thread` op: decode session, resolve room, insert | Never checked that a live, attested follower row exists, so a forgotten follower could mint orphan threads no wipe finds. Fix: `createFollowerThread` via `selfScope` | "Scope comes off the session" ≠ "the session still names something real" |
| `ws-r38-session-clock-skew-lower-bound` | Also refuse future-dated `iat` | Broke a repo-wide test convention; no request-reachable path exists. Reverted and documented as measured | A broad security fix with unaudited blast radius vs. an unexploitable hole: revert and document |
| `ws-r29-429-treated-as-a-generic-4xx...` | Revoke a WhatsApp opt-in on any 4xx | 429 (Meta rate limit) would revoke valid numbers. 429 now joins 5xx as transient | 429 is about the caller, not the input |
| `ws-r29-meta-wire-phone-format-vs-stored-e164-mismatch` | Compare stored `+E.164` to Meta's inbound `from` | Meta sends digits only, so it would never match in production while self-consistent fixtures passed | Build negative fixtures from the provider's documented format |
| `ws-r37-cron-step-of-24-hours-is-not-a-cron` | Schedule `0 */24 * * *` so the ops parser could read it | Vercel refused to deploy both projects: an hour step must be 1..23. Now `0 0 * * *`, parser extended, eval asserts steps | Extend the parser; never bend the schedule |
| `ws-r22-rfc-8291-known-answer-vector-from-memory` | Hard-code RFC 8291 Appendix A from memory | The transcribed key was not a valid P-256 point. Replaced by round-trip with fresh keys; R41 later fetched and reproduced the real vector | Never trust memorised test vectors |
| `ws-r41-webpush-decoder-required-rs-equal-record-length` | Decoder required `rs == record.length` | RFC 8291 §4: `rs` is a ceiling, and Appendix A uses rs=4096 with a 58-byte record. Real encoders would have been rejected | Self-consistent round trips don't prove standard conformance |
| `ws-r41-tg-reply-to-message-id-is-pre-bot-api-7-0` | `reply_to_message_id` on sends | Replaced by `reply_parameters` in Bot API 7.0 (2023-12-29). The offline eval asserted the stale field against itself | Read provider changelogs per touched seam |
| `ws-r41-provider-docs-sites-resist-a-single-page-fetch-tool-two-ways` | Verify Telegram/Razorpay operation pages by fetch | Telegram's single giant page truncates; Razorpay's SPA resolves every URL to the same "Plans Entity" page. Both look like answers. Marks left open | Fetch failures can be silent; cross-check |
| `ws-r49-performance-gate-served-uncompressed-bytes` | Serve `dist/` raw in the perf gate | Measured 3–4× too many bytes (262.5 vs 79.7 KB) and flagged false FAILs | Measure the transport production uses |
| `ws-r50-ink-faint-token-wide-recolour` | Darken a shared colour token used in 50+ places | Only 6 usages were measured failing. Added `--ink-faint-aa` for those 6 only | Fix what was measured; name what wasn't |
| `ws-r50-onpointerdown-only-breaks-keyboard-activation` | Put actions on `onPointerDown` for touch latency | A keyboard triggers click, not pointer events, so 18 controls were unreachable. Added `onKeyDown` via `activateOnKey` | Pointer timing needs a keyboard twin |
| `ws-r39-header-actions-row-overflowed-at-390px` | Add a fifth header control with no `flex-wrap` | 5 px horizontal overflow at 390 px on every talk screen; Hindi labels make it worse | An unbounded optional-control row needs wrap from day one |
| `ws-r43-room-dialogs-render-in-flow-not-scrolled-into-view` (found, not fixed) | Panels open as in-flow blocks after the composer | On a long conversation, tapping Check-ins/Handoff/Data shows no visible change | Dialogs must be overlays or scroll into view |

### 5.2 Gate and test-methodology rejections

These are numerous, but they matter because Taxila will reuse the gates.
- **SQL comment backticks inside JS template literals end the string** (5 recorded instances, same defect:
  `ws-r1-...`, `ws-r2-...`, `ws-r16-...`, `ws-r24-...-again`, `ws-r37-...-a-third-time`, `ws-r40-...-fifth-time`). `tsc` and vite
  never parse `api/*.js`, and the error points at innocent lines. Fix: never put backticks in SQL comments, and run
  `node --check api/*.js` as its own early step (proposed, never wired).
- `ws-r8-file-level-import-ban-flagged-a-pure-reader`: the reachability check must work at symbol level (intra-file call-graph
  fixed point), not file level.
- `ws-r8-negative-control-2-was-tautological-in-its-first-draft`: the control passed by construction. A negative control must
  run through the same detector and be shown to fail when the rig is removed.
- `ws-r12-retention-exists-in-select-...`, `ws-r17-count-distinct-person-id-...`, `ws-r35-pulse-combo-sql-factored-through-a-helper-...`,
  `ws-r40-double-quoted-table-name-fooled-...`: the leak battery's aggregate-only check is a regex over raw source text. Subquery
  `from` ordering, `count(distinct person_id)`, SQL factored into helpers, and nearby backticks all fool it. "A text checker is a
  third parser beside Postgres and JS."
- `ws-r28-...`, `ws-r37-explanatory-comments-named-the-guarded-tables...`, `ws-r48-...-a-fourth-time`: prose comments naming a
  guarded table join the file to the scanned set.
- `ws-r32-static-check-matched-its-own-explanatory-comment`, `ws-r47-doc-comment-self-matched-its-own-negative-control-regex`,
  `ws-r26-static-order-proof-indexof-matched-the-definition-not-the-call`: static text checks match comments and definitions.
- `ws-r31-a-bare-string-literal-is-invisible-to-check-copy`: copy-gate fixtures must use a shape the scanner treats as visible
  (`label:`).
- `ws-r10-check-copy-apostrophe-parity`: a JSX apostrophe pairs with a distant one, so hits are phantom or missed.
- `ws-r11-room-leak-blanket-allowlist`: rejected a blanket ALLOW; created a narrow `TIER_WRITE_ONLY` class instead.
- `ws-r11-persontables-wipeWhere-string-literal-false-positive`: strip string literals before identifier scans.
- Fixture fidelity: `ws-r18-fake-db-branch-would-have-swallowed-the-channel-table` (ordered `includes()` prefix tests);
  `ws-r18-fake-db-does-not-simulate-postgres-fk-cascade`; `ws-r19-paid-cap-case-broke-the-shared-room-fixture` (the fixture
  silently stopped enforcing the cap); `ws-r19-single-use-fake-stream-hid-the-negative-control` (re-iterable streams);
  `ws-r20-fixture-matcher-cannot-span-a-template-literal-linebreak`; `ws-r27-unaliased-generic-export-select-untested...`;
  `ws-r29-duplicate-fixture-row-for-a-primary-keyed-table...`; `ws-r30-third-synthetic-user-id-fails-strict-uuid-validation`;
  `ws-r44-threw-helper-swallows-a-success-value`; `ws-r44-new-...-cases-needed-fixture-sql...`.
- **Offline mocks cannot type-check SQL, and live EXPLAIN caught real bugs**: `ws-r35-min-uuid-does-not-exist-the-fake-db-passed-it`
  (Postgres has no `min(uuid)`); `ws-r37-room-locale-does-not-exist-the-fake-db-passed-it` (`r.locale` does not exist); WS-R5's
  `created_at` ordering; uncast params `ws-r34-...` (bool in CASE) and `ws-r39-...` (timestamptz).
- `frozen-session-iat-against-a-wall-clock-expiry`: an eval froze `iat` but not `deps.now`. It was green for 12 h, then red for
  the next merge.
- `ws-r23-owner-lane-column-name-is-a-second-blind-spot`: a helper reads a hard-coded column name instead of the shared list.
- `ws-r30-phase-gate-not-registered-in-leak-battery`: writing SQL to a class's rules and registering the file with that class are
  two separate steps.
- `ws-r36-...` / `ws-r47-new-card-mounted-inside-roomstudio-trips-orphan-check`, `ws-r49-studio-shell-orphan-check-dynamic-import-gap`:
  the orphan check is blind to nested mounts and to `lazy(import())`.
- `ws-r43-document-fonts-check-always-true-in-headless-chromium`: `document.fonts.check` is true even for a bogus family; the canvas
  width-diff is the real signal. `ws-r43-viewport-only-screenshot-missed-in-flow-dialogs`: use `fullPage`.
- `ws-r50-pulse-toggle-aria-pressed-false-positive`: an assertion two steps downstream of the mechanism (a network round trip the
  fixture can't complete) fails for unrelated reasons. Check `defaultPrevented` at document bubble phase instead.
- `ws-r15-refusal-absence-cannot-be-a-substring-check` and `ws-r15-eval-fixture-port-via-global`: derive per-request facts from the
  request (`req.headers.host`).

### 5.3 Multi-agent process rejections (directly relevant to Taxila's parallel build)

- `ws-r21-git-stash-is-shared-across-concurrent-worktree-sessions` and `ws-r30-git-stash-run-once-by-accident-mid-session`: the
  `refs/stash` ref is shared across worktrees. One agent's `stash pop` applied **another agent's WIP**. Rule: never `git stash`.
  Use a WIP commit plus `reset`.
- `two-release-gates-on-one-machine`: the layout gate binds 127.0.0.1:8931, and `EADDRINUSE` reads like a regression. Rule: one
  gate per machine, or a distinct port per gate (8931 layout / 8932 perf / 8933 a11y).
- `context-union-by-concatenation`: a merge concatenated two copies of measurements.md (214 duplicate headings). Rule: union = one
  side plus the other side's diff from the merge base, and count duplicate headings.
- `both-added-hunk-resolved-by-stripping-markers` and `ws-r48-merge-both-added-hunks-broke-two-files...`: a hunk that starts
  mid-statement or inside a comment needs a hand-supplied opener or closer. Read every check's exit code.
- `ws-r45-backtick-command-substitution-corrupts-commit-dash-m-messages`: backticks in a double-quoted `-m` are executed by bash.
  Use `git commit -F file`.
- `ws-r10-worktree-wrong-base-commit` (in decisions.md): a worktree was based on Meera's branch tip; it was reset before any work.
- `ws-r19-clonechannel-voiceengine-does-not-exist`: a brief's pointer named a symbol that doesn't exist. Grep for a caller, not a
  definition.

---

## 6. Concepts (and their Taxila relevance)

1. **Three scopes never blur.** Creator material flows down; a follower's words stay private; the creator sees counts only
   (n≥5, opt-in, never verbatim). **Taxila:** curriculum/teacher material flows down; a child's words stay in the child's scope;
   school and teacher see k-anonymous counts. Taxila must ADD an explicit parent scope with defined visibility, plus DPDP
   verifiable consent. That scope is not in Vyakti.
2. **One door** (`gatedReply`, `surface-bypasses-parse`). Every byte a user reads leaves through one gated function; voice
   only renders an already-gated reply (`lr` binding); check-ins and handoff route through it or deliberately bypass it for human
   text. **Taxila:** generated lesson text, TTS, and on-the-fly modules all need one exit gate.
3. **A predicate on the write, not a sentence in a prompt** (`gate0-structural`: 57–98% leak vs 0/31,122). This covers caps,
   entitlements, publish locks, k-anon floors, rate limits and never-rules.
4. **App-voiced disclosure, bound by digest.** The model never says the disclosure; the app does. The session carries its hash and
   a stale card refuses the turn.
5. **No fake numbers / unmeasured stays unmeasured.** The overall score is null until every part is measured. The screen names
   the ONE action that measures the missing part. **Taxila:** the child's mastery/learning profile must never average around
   unmeasured dimensions.
6. **Shapes, never lines** (`recited-prompt`). Gap prompts, check-in prompts and challenge sentences are telegraphic notes with
   word caps and shape-lint. **Taxila:** teacher-persona and module prompts.
7. **A correction is a source, not a prompt line.** A teacher's fix becomes cited material that invalidates derived artefacts.
   It is never pasted into the persona.
8. **Gap model drives questions** (interview). Closed gap kinds, frozen per session, 5 per 20 minutes (Cakmak & Thomaz HRI 2012:
   feature queries are preferred, and people dislike a constant stream). **Taxila:** covert learning-profile discovery.
9. **Session tokens name what they were minted against** (`dd`, `td`, `loc`, `lr`, `iat`). Re-derive from the token, never from a
   row that moved.
10. **Indistinguishable unavailability.** Unknown, unpublished, paused and withdrawn all return one 404. The ops board returns 404,
    not 403. Embed/sitemap absence reveals nothing.
11. **Fail closed + refusing defaults.** Payments provider `none`, rate limit on an unknown scope, an unset session secret, and a
    missing vendor key all refuse. Provider seams have a deterministic fake twin.
12. **Negative controls must fail through the same detector**, and must be verified to fail when the rig is removed
    (`sound-gate-proved-by-silence`).
13. **Offline mocks cannot type-check SQL.** Apply migrations live and EXPLAIN every new statement before merge; gate code on
    `tableApplied` for deploy ordering.
14. **Erasure honesty.** `PERSON_TABLES` plus a written FATE per table, child-before-parent delete order, a forget receipt that
    names no person, and an export completeness battery. **Taxila:** DPDP right-to-erasure for children's data.
15. **Proactive-reason-contingent.** Reach out because a time the user set arrived, never because they went quiet. Quiet hours
    shift rather than skip. **Taxila:** study reminders.
16. **NEVER MANIPULATE in money.** The cap refusal happens at the door before any model call. The upgrade offer is a flag at the end
    of "a session that worked", with a 14-day cooldown and no mid-turn selling. **Taxila:** parent upsell.
17. **k-anonymity with pairwise suppression.** Floor in DDL, combos ≤2 labels, `suppressed` is a count.
18. **Capability is documented only when its endpoint is.** Sarvam cloning claim vs. API.
19. **The instrument records which evidence each arm carries** (vendor vs. self-hosted watermark/HMAC).
20. **Honest states:** `waiting_on_you` / `waiting_on_us`; script statuses `ok/skip/blocked/fail`.
21. **Vocabulary as a gate.** Banned user-visible words are enforced by CI, with a legal-text allowlist. **Taxila:** child-facing
    vocabulary rules (no "test"/"exam" framing for covert checks, no "model"/"AI clone" jargon).
22. **India-first engineering as gates:** Fast-3G CDP budgets, gzip-true bytes, Devanagari glyph tests, 44 px tap targets, system
    Devanagari font stack, EN/HI key parity, Indic digit folding.
23. **Heartbeats written at start and finish;** content-free counts.
24. **Multi-agent hygiene:** no `git stash` in shared worktrees; distinct gate ports; context union by diff; `node --check`
    before trusting gates.

---

## 7. Gaps / unread

- **UI files not read in depth:** `src/room/RoomApp.tsx` (1.5k lines), `src/studio/RoomStudio.tsx` (1.2k), the `StudioApp.tsx`
  diff, `OpsBoard.tsx`, `SuiteCard.tsx`, `PayoutsCard.tsx`, `AccountPage.tsx`, `CheckinsPanel.tsx`, `HandoffPanel.tsx`,
  `ReviewQueue.tsx`, `ReadinessPanel.tsx`, `DriftWatchCard.tsx`, `VoiceIdentityChallenge.tsx`. Only headers and helpers were read.
- **Backend files read only by header:** most of `api/_payments.js` (1,452 lines: subscription, payout, org and creator lanes),
  `api/_room-telegram.js`, `api/_renewals.js`, `api/_room-publish.js`, `api/_interview-store.js`, the `api/mirror-call.js` diff,
  `_person-model.js`'s `dialogueRegister`, `api/_ops.js`, `api/_funnel.js`, `api/_creators.js`, `api/_apply.js`,
  `api/_invites.js`, `api/_room-page.js`.
- **Static marketing pages** `site/vyakti.html` (rewritten to the Rooms story), `site/suites.html` and `site/creators.html`: copy not
  read.
- **Evals:** I read only the headers of `evals/room-leak/run.mjs` and `scripts/check-accessibility.mjs`/`check-performance.mjs`.
  Counts come from `context/measurements.md`, not from re-running anything. No eval was run in this harvest (read-only rule).
- **`context/STATE.md` session log** (~230 KB, 836 lines) was only grepped. **`context/graph.json`** (424 new nodes) was not
  traversed node by node.
- **`db/schema.sql`** (1,345-line mirror) and migrations 072–107 were not all read line by line. 071, 080 and 089 were read.
- **Two decisions sections were skimmed, not read:** `decisions.md` WS-R31..R48 (lines ~2500–4660), and the full R40–R44 decisions
  added between `9914905f` and `b5348dc0`.
- **Never-rules gap at the end of this segment:** at `b5348dc0`, `roomSay` and the check-in sweep call `gatedReply` **without**
  `neverRules`; only the web widget (`api/_clonechat.js`) and the Mirror Call pass them. So a creator's "Never say this" rule did
  not yet bind in the Room. It was wired later: `origin/codex/vyakti-completion:api/_room-surface.js` has a shared reader. That
  belongs to the later segment.
- The newer half of the range (commits 281–560: WS-R55+ incident ledger, security headers, pictures, provider marks, Vyakti
  completion) is a different segment.
- **Nothing here is verified live.** No real Room row, follower, payment, push, WhatsApp template or voice challenge has ever run.
  Studio model keys are absent.


## Verification

Adversarial pass at html-portfolio@b5348dc0 (2026-10-02). All 53 claimed assets exist at the ref, with every cited path present. Method: git archive of the ref to scratch, read each cited file, run extracted pure functions (never-rules, normaliser, computeNextDue), grep for cited symbols. Not done: no live Postgres, no network calls, no full read of every 500+ line file (rows marked not deeply read). Cross-cutting findings: (1) the reader file already notes nothing was ever verified live; (2) most api/ modules import _db.js which imports gitignored _config.js (secret present at api/_config.js, not read); (3) Taxila bans Sarvam/ElevenLabs and Vercel hosting, so hpva-21/22 are skip and vercel.json crons/rewrites need re-homing; (4) services/voice-evidence (Azure ECAPA service) is an unclaimed asset.

| id | claimed | corrected | quality | notes |
|---|---|---|---|---|
| hpva-01 | adapt | **idea** | 3/5 | Exists (api/_room-surface.js 2768 lines, room.js 448, 071_room.sql). Real code, but welded to the creator-clone schema: imports _clonechat, _teachersheet, _room, episodes, _room-voice, _phase-gate; reads vy_room/vy_room_follower/meera_log and memory.js (5431 lines); _db transitively imports gitignored _config.js. Not liftable as a lane; take individual functions only. Reader file itself says nothing here ran live. |
| hpva-02 | copy | **copy** | 4/5 | Verified at b5348dc0:api/_room-surface.js L180-250: node:crypto only, secret<32 -> 503, constant-time via hashed timingSafeEqual, 12h assertSessionFresh. Caveats: stateless (no revocation/rotation), future iat unbounded (documented, rejected.md#ws-r38-session-clock-skew-lower-bound). Rename ROOM_ prefix; add child/parent audience claim. |
| hpva-03 | adapt | **adapt** | 3/5 | Exists (L283). The card text is creator-clone specific ('You are talking with X AI. It is not X.', 'X does not read these'); only the digest-bound-card mechanism transfers. Rewrite copy for a child tutor (EN/HI) and re-run its fact-predicate eval. |
| hpva-04 | copy | **adapt** | 4/5 | Verified L1344-1360: single conditional UPDATE rolling month_key, CASE free/paid ceiling, zero rows -> 402 before model call. But SQL is bound to vy_room_follower/vy_room columns, and spend happens BEFORE delivery (a failed model call still burns a unit). 20 lines of pattern, not a copyable module. |
| hpva-05 | adapt | **adapt** | 2/5 | recordRoomConsent/joinRoom exist (L925, L1143). Self-attestation of age + memory answer is not DPDP verifiable parental consent for a child; ledger shape (versioned kinds, replace not coalesce) is the reusable part. Compliance is deprioritised per Taxila CLAUDE.md. |
| hpva-06 | copy | **adapt** | 3/5 | Exists L429. Skeptical: in one statement the existing_person CTE uses the statement snapshot taken before pg_advisory_xact_lock is acquired, so the race loser can still insert an orphan vy_person row; only the unique key on vy_account_person.auth_user_id keeps the bridge single. Not verified against live Postgres (no server here). Taxila identity is parent->child ids, so schema differs. |
| hpva-08 | adapt | **adapt** | 3/5 | room_transcript_mismatch and transcriptDigest exist (_clonechat.js 346 lines, same drag as 01). Pattern (client carries history bound by digest) is fine for memory-declining users; code needs re-homing. |
| hpva-09 | adapt | **idea** | 3/5 | Exists, but roomSpeak rides beginOwnedVoicePreview's 15-precondition voice-clone genome/consent CTE and the clone generation ledger (_room-voice.js header; migration 045 CHECK). Unusable for Azure TTS without a rewrite. Keep the principle: TTS takes a reply ref, never free text. |
| hpva-10 | copy | **adapt** | 3/5 | Verified: imports nothing (97 lines). REFUTED for Hindi as-is: normaliseForMatch strips \p{M}, so 'मैं हिंदी में पढ़ाता हूँ' -> 'म ह द म पढ त ह' (ran it). Matching is raw substring, no word boundary: rule 'ass' matches 'good class today' (ran it). Fix both before using as a child-safety predicate. |
| hpva-11 | adapt | **adapt** | 3/5 | Files exist (_review-queue.js 758, 074 migration, ReviewQueue.tsx). Imports _replica, _replica-claims, _replica-source, questions.js: creator-source model. Three-decision/same-statement design is the reusable idea; corrections-become-sources needs Taxila kit/curriculum store. |
| hpva-12 | adapt | **adapt** | 3/5 | Exists (227 lines). Only skimmed, not line-verified. Strict-schema generator pattern is reusable; NCERT chapter sets in Taxila should come from data/kits with blind-solved keys, not a model asking its own questions. |
| hpva-13 | adapt | **adapt** | 3/5 | Exists (769 lines; min_part present). Imports _provenance/contracts, _replica, _fidelity; the five parts are clone-specific (sounds-like-you etc.). Transferable: measured-or-'not measured yet' + one action, null overall while any part unmeasured. |
| hpva-15 | adapt | **idea** | 2/5 | Exists. The four gap kinds are creator-sheet gaps (contradiction needs validityOverlaps from _provenance); not a learner-profile discovery engine. Reuse shapelint/shape-not-question discipline only. |
| hpva-16 | adapt | **idea** | 2/5 | spliceInterviewAsk and interview_ask_unplaceable exist in _mirrorcall-reply.js. Specific to Meera/Vyakti's two appended-last blocks; Taxila's compile() has its own placement rule. Idea only. |
| hpva-18 | adapt | **idea** | 2/5 | Pure decideVoiceChallenge/thresholds exist, but thresholds rest on ONE owner's clone (ceiling 0.8869, n=1) and transcriptOverlapMin 0.60 is labelled PROVISIONAL/unmeasured. verifier.js hard-requires SARVAM_API_KEY (Sarvam ASR, banned by Taxila Azure-only) and a separate Python ECAPA service (services/voice-evidence, Azure bicep; not in the claim). Voice-clone consent is out of Taxila scope; services/voice-evidence is the unclaimed asset worth a look. |
| hpva-19 | copy | **adapt** | 3/5 | Verified by running: Devanagari kept (\p{M}), Devanagari digits fold to ASCII (9 ranges). But the digit-run joiner turns 'answer 5 10' into 'answer 510', corrupting numeric answers; no transliteration (Latin Hinglish vs Devanagari ASR scores ~0); bag-of-words F1 is a read-aloud check, not comprehension. Copy normaliser minus the digit join. |
| hpva-20 | copy | **adapt** | 3/5 | wavCapture.ts exists (200 lines), no imports. PCM16 encoder/24k OfflineAudioContext resampler fine. But capture uses deprecated createScriptProcessor and sets echoCancellation/noiseSuppression/autoGainControl false (fidelity-scoring tuning), wrong for a tutor with speaker output; Taxila realtime path streams PCM itself. |
| hpva-21 | adapt | **skip** | 2/5 | Exists (318 lines), request-shape only. Taxila CLAUDE.md bans Sarvam (third-party AI API). Also html-portfolio rejected.md#sarvam-bulbul-existing-key-returned-payment-required: first live request returned HTTP 402, no audio ever produced; endpoints pinned from docs read 2026-09-03. |
| hpva-22 | adapt | **skip** | 2/5 | Exists (499 lines); header calls it a BENCH arm, never the shipped lane, endpoints from docs 2026-09-03, never live. ElevenLabs is banned by Taxila Azure-only directive. |
| hpva-23 | adapt | **adapt** | 3/5 | Exists (pack.mjs 724, contract.mjs 809, script 531, doc 238). Arms include banned vendors; keep exact-text/counterbalanced/opaque-cell design for Azure voices. Read rejected.md entries on Windows stdin decoding fabricating a Hindi failure and silent-text-rewrite in matched cells. |
| hpva-25 | adapt | **adapt** | 4/5 | Verified: imports only _provenance/contracts (canonicalJson, sha256Hex); Foundry/speech/personal-voice rate cards from env; budget-id regex. OPERATIONS set is clone-specific (voice_training, liveness, watermarking). Token estimate 1 token/byte is deliberately conservative. Good fit for Azure grant guard. |
| hpva-26 | adapt | **idea** | 2/5 | Exists. Actually a voice-clone fidelity drift (ECAPA cosine, 0.02 from clone measurements) plus model-commitment swap check; imports _replica, _fidelity, _readiness and reads fs. Not text-model behaviour drift. Keep only the commitment-compare idea. |
| hpva-27 | adapt | **adapt** | 3/5 | Exists (909 lines, 080/097 migrations, follower_count>=5 CHECK verified). Entangled with _room-cohorts and creator-typed topic labels; pairwise suppression rule is the reusable bit for class-level insights. |
| hpva-28 | adapt | **adapt** | 3/5 | Exists (248 lines, no imports). Cohort math is clean but keyed to vy_room_follower_day; reconsider 36-42 day window for school-year cadence. |
| hpva-29 | adapt | **adapt** | 3/5 | Exists (477 lines). Imports _room-cohorts and _renewals. Upgrade prompts aimed at parents of children need extra manipulation review; cooldown/ledger pattern ok. |
| hpva-30 | adapt | **adapt** | 3/5 | Exists (1027 lines). Imports _room-push, webpush, _rate-limit, _room-telegram; drags _db. Not verified live. checkinDirective is sentence-shaped note text (watch recited-prompt law). |
| hpva-31 | copy | **copy** | 4/5 | Verified by extracting and running: 19:00 Asia/Kolkata -> 13:30Z; 22:30 inside quiet 22:00-07:00 shifts to 07:00 IST next day; invalid tz throws (validated upstream by validateSchedule). Pure, Intl-only. Copy computeNextDue + helpers L379-479. |
| hpva-32 | adapt | **adapt** | 3/5 | Exists (423 lines). Imports _surface.js (1448 lines; gateReply). Escalate-to-human pattern with hashed consented payload fits teacher/parent escalation; recipient model differs. |
| hpva-33 | adapt | **adapt** | 3/5 | Exists. razorpay.js header: 'Nothing below has ever made a real HTTP request'; PATCH quantity and payouts shapes are convention, not confirmed. Marketplace take-rate/payout machinery irrelevant to parent subscription. Imports memory.js, _org.js, _channel-secrets. Raw-body webhook relies on Vercel bodyParser:false export; must be redone for Container Apps. RBI Rs 15,000 claim is a doc note, unverified. |
| hpva-34 | adapt | **adapt** | 3/5 | Exists (600 lines). Not deeply read; ledger/cron pattern plausible; Vercel cron + creator subscription schema to rework. |
| hpva-36 | copy | **idea** | 3/5 | check-mirrors.mjs (211 lines, fs only) works but only 2 markers exist in src (pulseApi.ts). Taxila has shared/contracts.ts, so constants can be imported instead of mirrored. Reconcile eval is creator ledger specific. |
| hpva-37 | adapt | **idea** | 2/5 | Exists. B2B creator-suite model plus Vyakti marketing page (suites.html 915 lines), seat prices are placeholders. Take only the 3-condition attach predicate for school tenants. |
| hpva-38 | copy | **copy** | 4/5 | Verified: 237 lines, node:crypto only, single upsert 'do update ... where count < limit returning count', unknown scope fails closed. Caveats: day in hash breaks windows across UTC midnight; hardcoded fallback salt if RATE_SALT unset; scopes are Vyakti names; needs a db(sql, params) shim over Neon. |
| hpva-39 | adapt | **adapt** | 3/5 | Exists (390 lines, node:crypto only). Hand-rolled RFC 8291/8292 has no live proof in repo; prefer the maintained web-push library, use this as reference. Capacitor Android needs FCM. |
| hpva-40 | adapt | **adapt** | 2/5 | Exists. Inherits api/whatsapp.js 'NOT WIRED' state and imports its verify/send (not in claim). Template approval is an external dependency. Never ran live. |
| hpva-42 | adapt | **adapt** | 3/5 | Receipt functions live inside memory.js (5431 lines) plus 090 migration and room-export evals. Receipt idea is sound; extract and rewrite for Taxila child tables. |
| hpva-43 | adapt | **adapt** | 4/5 | Exists (memory.js manifest, persontables.mjs 271, relcheck.mjs 450, recall 831). The manifest-with-fate + DDL scan + FK walk gate is high value for a children's data map; relcheck needs a live DB. |
| hpva-44 | copy | **skip** | 2/5 | Verified memory.js L3260: tableApplied caches false forever, including on a DB error, so a warm instance keeps treating a newly migrated table as absent until restart. Taxila runs scripts/migrate.mjs before deploy, so the gate is unnecessary. |
| hpva-45 | adapt | **idea** | 4/5 | Exists (1003 lines; AGGREGATE_ONLY present). Runs the real room lane and compiler, so it cannot run unchanged; design (N followers, token scan, writer call graph, negative controls) is excellent. |
| hpva-46 | adapt | **idea** | 4/5 | Exists (1310 + 624 lines; EXPECTED_DOORS present). Drives real decision modules of the room lane; port the 8 attack classes to Taxila's router. |
| hpva-47 | adapt | **adapt** | 3/5 | Exists, but sqlcast.mjs also needs schema.mjs/scan.mjs/stmt.mjs (not claimed) and STRICT_SURFACE hardcodes Vyakti files. File notes bare $1 on uuid works; the real value is the conflict rule (guaranteed 500s). |
| hpva-48 | copy | **adapt** | 4/5 | Exists (653 lines); imports node built-ins, needs playwright and axe-core devDeps and a chromium path (/opt/pw-browsers). TARGETS list and fixtures are Vyakti pages; self-test is good. |
| hpva-49 | copy | **adapt** | 4/5 | Exists (477 lines), CDP throttling, gzip-true bytes. Hardcoded chromium path and Vyakti budgets (JS 180 KB); a 3D tutor will exceed it, so rebudget. |
| hpva-50 | adapt | **adapt** | 3/5 | Exists (982 lines). Hardcodes a Windows path (C:\gate-worktree) and Vyakti TARGETS/fixtures; layoutFixture.tsx mounts Room components. |
| hpva-51 | adapt | **adapt** | 3/5 | Exists (598 lines + allowlist). Banned-vocabulary list (clone, model, ...) is Vyakti brand law; engine/self-test reusable for Taxila's own list. |
| hpva-52 | copy | **copy** | 4/5 | Verified api/_sweep-run.js: 151 lines, node:crypto only; withSweepRun/sanitizeCounts as claimed. Needs migration 084. Copy only this file; _ops/OpsBoard are Vyakti specific. Vercel cron config must become Container Apps jobs. |
| hpva-53 | adapt | **idea** | 2/5 | Exists (485 lines). Creator minutes-to-first-Room funnel; little carries to parent onboarding beyond the n>=5 floor. |
| hpva-54 | copy | **adapt** | 3/5 | Exists (copy.ts 715 lines). Strings are Room/creator copy, Hindi quality unverified and not child-voiced. Reuse key-parity and normalizeLocale parity mechanism. |
| hpva-55 | copy | **adapt** | 3/5 | Exists (room.css 973, tokens.css 225). Room-specific selectors; Devanagari system stack, tabular-nums, reduced-motion are the transferable parts. No web fonts may not suit a kid-facing Hindi look. |
| hpva-56 | copy | **skip** | 2/5 | Verified 5 lines. Activates on pointerdown, so scrolls/accidental touches fire actions (fails WCAG 2.5.2 pointer cancellation) and a screen-reader synthesized click won't trigger it. Use onClick; native buttons already handle Enter/Space. |
| hpva-57 | adapt | **adapt** | 3/5 | Exists (RoomApp 1575, AccountPage 509, room.html). Tightly coupled to the room API and creator copy; use as layout reference for join/cap/account screens. |
| hpva-59 | adapt | **skip** | 2/5 | Exists. Creator directory/sitemap on Vercel rewrites; Taxila is one AI teacher, no directory need. |
| hpva-60 | adapt | **idea** | 3/5 | Exists. Unfurl routing lives in vercel.json user-agent rewrites, which do not run on Azure Container Apps (Vercel paused); must reimplement in Taxila's router. Sharing child progress links needs a privacy review. |
