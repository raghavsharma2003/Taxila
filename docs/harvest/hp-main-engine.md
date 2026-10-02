# Harvest: hp-main-engine (html-portfolio@origin/main, the Meera engine)

| | |
|---|---|
| Source repo | `/home/user/html-portfolio` (read-only; read with `git archive`/`git show`, nothing checked out) |
| Ref | `origin/main` = `3a92179` (2026-08-25, "Merge Maya: world layer, RelationalOS split, resilience stack, launch fixes (PR #3)"), 99 commits, 1,102 files |
| Segment | `src/engine/**`, `api/chat.js` + the `api/_*.js` brain helpers, `api/memory.js`, `api/consolidate*.js`, `db/migrations/*`, `evals/persona-invariants*.mjs`, `evals/parse.mjs`, `evals/run.mjs`, `CLAUDE.md`, `context/{rejected,decisions,measurements,architecture}.md` (rejected.md read in full), `docs/{RELATIONALOS,RELATIONAL-STATE,MEMORY-FELT,CONSOLIDATION,HONESTY,CONVERSATION-DEFECTS,TIME,SPEC*,TRACE,TELEMETRY}.md` |
| Notation | `path@main` means the path at `origin/main@3a92179`. Line numbers are from that tree. |
| Secrets | `api/_config.js` is gitignored and **not in the tree** at this ref (checked with `git ls-tree`). No `.env`, keyring or key file is committed. Nothing secret was opened or copied. `api/_config.example.js` exists but was not read. |
| Sibling harvests | `docs/harvest/companion-tech.md` covers the voice stack and the `@cmp`/`@gk`/`@vy` branch lineage. This file goes deeper on the engine at `@main` only. |

---

## 0. TL;DR

`@main` is a **relational operating system** wrapped around one persona (Meera, renamed Maya on 2026-08-23). The persona is replaceable. The OS layer is what Taxila should take: a pure prompt compiler with budgets, a cited memory graph, consolidation with citations enforced at write time, relationship state with hysteresis, an honesty gate that runs on the output, age-tier hard gates, a turn trace, and gates that are tested by breaking them. Almost every rule in it is backed by a measurement, and the most useful part is the list of things that were tried and failed.

The ten things Taxila should take first:

| # | Take | From | Use |
|---|---|---|---|
| 1 | The context compiler: CORE/TAIL split, typed tail slots with budgets and drop priorities, whole-block drops, per-slot byte map | `src/engine/compiler.ts@main` | adapt |
| 2 | The laws, mechanized: shape-lint (no lines it could recite), exactly two rules appended last, a budget gate run on real compiled fixtures | `src/engine/shapelint.ts@main`, `scripts/check-prompt-budget.mjs@main` | copy |
| 3 | `AgentModule` + `CharacterSheet`: the persona is a sheet dropped onto a shared core, and the safety floor runs against every registered agent | `src/engine/agents/**@main`, `evals/persona-invariants*.mjs@main` | adapt (one TeacherSheet per subject or age band) |
| 4 | The honesty gate on the output, using a provenance allowlist (it may only say an identifier that was in its input) and replacing bad bubbles instead of deleting them. Includes the streaming guard. | `src/engine/honesty.ts@main` | adapt |
| 5 | The cited memory schema: episodes as log spans, facts that cannot be written without a citation, bi-temporal belief change, patterns promoted by a generated column, halfvec exact scan | `db/migrations/002-005,011@main` | adapt into the learner model |
| 6 | Consolidation: the model may cite only by index into the batch, a 5% cross-family entailment audit that halts the run, anchored importance, and spend counted by attempts | `api/consolidate.js@main`, `api/consolidate-sweep.js@main`, `docs/CONSOLIDATION.md@main` | adapt |
| 7 | Relationship state with asymmetric hysteresis: trust limited to ±0.05/day, repair needs the other side's signal, and the record is kept apart from the stance (the stance lapses) | `src/engine/relstate.ts@main` | adapt for teacher-student rapport |
| 8 | Charter G1-G8 for the emotional interior: the feeling and its cause stored as one sentence, a 9h half-life, no accumulating sad period, never reads the user's usage, no UI | `src/engine/inner.ts@main` | adapt for the teacher's emotional OS |
| 9 | Age tier: `minor` short-circuits to frozen hard gates, the more restrictive tier wins, and a session clock that speaks as the app and fails toward disclosing | `src/engine/clock.ts@main`, `compiler.ts:133` | adapt and **invert the adult default** (every Taxila user is a minor) |
| 10 | Process: `context/` graph + `--check`, `verify-release` (exit code is the verdict), CI evals, negative controls inside the same run | `scripts/{context,verify-release,check-workflows}.mjs@main` | copy |

Things not to take: the Hinglish dating-adjacent persona text, `RECALL_STOP`-only lexical forget matching, the free Gemini key pool, OpenRouter as a lane, and any design where the realtime lane assembles its own prompt.

---

## 1. What this is

### 1.1 Shape of the engine

- **Engine = client bundle of pure functions.** `src/engine/*.ts` is imported by the browser/Capacitor app (`compiler.ts:1229-1234` says so). Server-only code lives in `api/*.js`. DB-facing engine functions take an injected `QueryFn` (the duck-typed shape of `api/_db.js`'s `q`), so server secrets never reach the Vite build (`relstate.ts:5-16`, `texture.ts`, `selfarc.ts`, `observation.ts` all state this). The server reaches the same engine through one generated bundle (`src/engine/serverEntry.ts` → `api/_engine.gen.js`, with a staleness `--check`) instead of mirroring it in JS. The file's own wording: *"a mirrored persona is a SECOND persona, and it would drift within a week"*.
- **Lanes (at `@main`).** Chat brain `google/gemini-3.6-flash` (free AI Studio pool, then OpenRouter, then the Azure grant lane, ordered in `api/_lanes.js`). Realtime voice is `gemini-3.1-flash-live-preview` (speech-to-speech, `hi-IN` pinned). Extraction is `grok-4-1-fast-reasoning` on Azure with an OpenRouter fallback. Embeddings are `text-embedding-3-small` 1536-d halfvec (`api/_embed.js`). Data lives in Neon over SQL-over-HTTP, one statement per request (`api/_db.js`, `db/migrations/apply.mjs`). Model map: `context/architecture.md@main`.
- **RelationalOS boundary test** (`docs/RELATIONALOS.md@main`): *"Would a different personality, on a different surface, need this unchanged? Yes → OS. No → surface."* The OS owns memory, episodes, rel-state, disclosure, the compiler, persona-as-module, honesty predicates, time/away/repeat/burst, activities, and the surface contract. A surface may choose how bytes reach the wire. It may never choose whether the OS guarantees apply.
- **Three separations** (`docs/SPEC-AGENT-LAYER.md@main §1`): PERSON × AGENT × SURFACE. The relationship lives at (agent × person). The surface scopes nothing.

### 1.2 How far it got (production state, measured)

- Phase C (relational engine) was declared complete 2026-08-15, with byte-identity 83/83 and the D0 battery flagging all three archived bake-offs (`decisions.md#phase-c-complete`).
- **For most of its life the derived layer was empty in production.** On 2026-08-18: `vy_rel_state` 0 rows, `vy_episode` 2, `vy_fact` 8, for 40 persons. The cause was that GitHub schedules workflows only from the default branch, and every cron lived on a non-default branch (`measurements.md#never-scheduled`). A production compile on 2026-08-20 showed **9 of 13 tail slots rendering 0 bytes** (`nine-dark-tail-slots`).
- Fixed 2026-08-21 by fast-forwarding `main` and running the chain by hand. After that: `vy_rel_state` 25, `vy_fact` 446, `vy_embedding` 446, `vy_pattern` 4, `vy_rel_event` 5, at $0.00092 cash for 133 enriched episodes (`relstate-first-rows`, `stage3-enrichment-run`). Since 2026-08-23 an hourly Vercel cron runs the whole six-step chain behind `CONSOLIDATE_SWEEP_LIVE=1` (`docs/CONSOLIDATION.md`).
- The second agent (Kabir) was proven 2026-08-24: **412/412** invariant checks across 2 agents, with Maya byte-identical 83/83 (`decisions.md#personality-is-a-sheet`).
- `verify-release` ran 13/13 gates by exit code on 2026-08-24. The suite runs in CI (`decisions.md#evals-in-ci`).
- Still unmeasured or not claimed: whether relationship stance or warmth survives a model swap (SPEC §5 "NOT CLAIMED"), the live-lane honesty gate (speech-to-speech has no output string to gate), and the powered feltmem battery (blocked on judge qualification).

---

## 2. Reusable assets

Maturity: `shipped-measured` (live, with a logged number), `shipped`, `prototype`, `spec-only`. Use: copy / adapt / idea / skip.

### 2.1 Prompt compiler and persona engineering

| id | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| A01 | `src/engine/compiler.ts@main` (compile :399-712, manifest :773-1095) | Pure `compile(CompileInput)`. Builds a byte-stable CORE (cache key) plus a volatile TAIL. Fixed `TAIL_ORDER` T1…T16, mp.*, T10 pinned last. Each optional bundle (rel/self/room/activity/ageGates/agent) renders 0 bytes when absent, so byte-identity is preserved. `sections` byte map is tracked during assembly. `hashCore` (FNV-1a, isomorphic), `hashManifest`, `assertManifestArithmetic` (caps sum, permutation of drop priorities, TAIL_ORDER⇔MANIFEST). | shipped-measured (83/83 byte-identity; per-slot parity across lanes) | adapt | prompt-compiler |
| A02 | `compiler.ts:1208` `applyDropOrder` | Drops whole blocks in priority order and never slices. "never" blocks are kept even over cap, because hiding that would be a manifest bug. | shipped | copy | prompt-compiler |
| A03 | `src/engine/shapelint.ts@main` | `lintLine`: ≤14 words, not capital-start + terminal punctuation, not first-person line-initial (`i/main/mujhe/maine…`). Also `lintBlock` with an allowlist, `checkAppendedLastExactlyTwo`, `checkDecisionPositions`, `checkCoreByteStable`. | shipped | copy | prompt-compiler, evals |
| A04 | `scripts/check-prompt-budget.mjs@main` | Gate in three layers. (1) Manifest arithmetic hard-fails. (2) Operational caps (what `api/chat.js` actually slices at) hard-fail on real compiled fixtures. (3) Target caps only WARN. Runs byte-identity, CRISIS_LINES-intact, T10-last. The clock is pinned to the yearly argmax date. | shipped-measured | copy | evals/gates |
| A05 | `src/engine/__fixtures__/{byte-identity.mjs,oldOracle.ts,compiler.fixtures.ts}@main` | "Behavior-frozen extraction" harness. The new compiler must equal a frozen copy of the old assembly, byte for byte, before any feature flag flips. | shipped-measured | idea | evals |
| A06 | `src/engine/agents/types.ts@main`, `registry.ts` | `AgentModule {slug, displayName, personaVersion, buildSystemPromptParts, buildSpeechStyle, WATCH_MODE_NOTE, SEARCH_DECISION, FORGET_DECISION, CRISIS_LINES (never optional), register}`. Registry, `getAgent`, `listAgents`, fixed `MEERA_AGENT_ID` mirrored and asserted by `scripts/verify-agent-id.mjs`. | shipped-measured | adapt | prompt-compiler, group-ai/multi-agent |
| A07 | `src/engine/agents/characters/{types,maya,kabir}.ts@main` | `CharacterSheet`, 29 typed fragments: identity, language rules, crisis lines, register slot fillers, life texture, taste topics, STT sound-alikes, stage nickname. Leaf modules. The authoring rules sit in the header: shapes and facts, never recitable lines. | shipped-measured (412/412 across 2 agents) | adapt | persona-engineering (TeacherSheet per subject or age band) |
| A08 | `src/engine/persona.ts@main` (core :112-353, directives :494-690) | The Relational Core prose. Reusable structure: "READ THIS FIRST… every quoted line is a DIAGRAM OF A SHAPE". Sections WHEN THEY WIN, WHEN YOU GOT IT WRONG (repair), FEELING KNOWN, RITUALS & GOODBYES, ONLY SAY WHAT'S TRUE, NEVER MANIPULATE, NOTICING (once, structural), NEVER list (therapy-speak bans), Honesty-about-AI, Crisis. | shipped-measured (charm-grok 38-2 on this core) | adapt (rewrite for children, keep the section architecture and safety floor) | persona-engineering, safety-floor |
| A09 | `persona.ts:677-690` `FORGET_DECISION`, `SEARCH_DECISION` | "One more check" blocks appended dead last. Position is the mechanism: 0/8 mid-brief vs 8/8 last. Capped at exactly two. | shipped-measured | idea | prompt-compiler (Taxila's two last-slot rules, e.g. comprehension check and safety escalation, need measurement) |
| A10 | `persona.ts:496-531` OPEN/AFTERCALL/DECLINED/FOLLOWUP directives, `CALL_OPEN_DIRECTIVE :639` | Angle-bracket context notes ("never reference this note"). Proactivity is reason-contingent. The silence-triggered idle nudge was deliberately removed. The pickup fence is unconditional: "never invent anything involving THEM". | shipped | adapt | relational-os (lesson open, lesson close, follow-up) |
| A11 | `evals/relational/leak.mjs@main` | Cross-agent leak guard. A gating scan for sheet-fragment leaks, plus a non-gating residue count held by a monotonic RATCHET constant. | shipped | copy | evals (between teacher personas) |
| A12 | `evals/persona-invariants.mjs` + `.data.mjs@main` | Runner and data are separate. `safetyFloorChecks` (51) vs `meeraFullChecks` (87), an exact partition, run against every registered agent. Frozen-date build at the argmax date. | shipped-measured (138/138, then 412/412) | adapt | evals/safety |
| A13 | `evals/parse.mjs@main` + `brain.ts:489-560` `parseBubbles`, `stripTextingDashes` | Lenient global protocol-marker extraction (`[tone:]`, `[react:]`, `[photo:]`, `[voicenote:]` with nested tags, `[search:]`, `[forget:]`) with a catch-all bracket strip. The dash predicate has negative controls (helpline `1800-599-0019`, URL, "e-mail"). | shipped-measured | adapt | generative-ui (a `[module: …]` marker protocol) |

### 2.2 Safety floor and honesty

| id | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| A14 | `src/engine/honesty.ts@main` (`findActionable :206`, `allowedFrom :274`, `inspect :1924`, `guardReply :1976`) | Output gate. Family A: actionable identifiers (email/UPI/phone/url/account/handle/address), decided by **provenance**: an identifier not in the input (assembled prompt + user's words + `PUBLISHED_HELPLINES`, never its own past output) counts as invented. Family B: out-of-band receipts, past-send claims, unsupported receipts against a transcript commitment ledger, channel promises. Family 3/4: false attribution and shared-past fabrication against the user's vocabulary. Family 6: activity specifics. Replaces the first bad bubble with a true line and drops the rest. Idempotent. | shipped-measured (receipt leak 1/8 → 0, n=31; 393 checks) | adapt | safety-floor/honesty |
| A15 | `honesty.ts:2121` `createStreamGuard` | Streaming door. One-token holdback, and suspicious runs (digit, `@`, `.x`) are held until a plain token closes them. HOLD_CAP 240. Bounded latency because the TTS cutter already waits for word boundaries. | shipped | copy | safety-floor, realtime cascade |
| A16 | `honesty.ts:2070` `NOT_GATED_BY_DESIGN` | The boundary of what is deliberately not gated, exported as data so an eval asserts the non-coverage still holds. | shipped | idea | evals |
| A17 | `honesty.ts:539` `openCommitments`, `:678` `herCommitments`, `compiler.ts:374` `renderHerCommitments` (T16, 400 B) | Promise ledgers computed from the transcript. No table, so no writer can go dead. Her own open promises render as telegraphic rows with a coarse age ("2d ago"). | shipped | copy | relational-os (the teacher's "I'll show you a game next time") |
| A18 | `src/engine/clock.ts@main` (`gatesFor :73`, MINOR_HARD_GATES, TIER_CLOCK) + `compiler.ts:133` `AGE_TIER_SAFETY_OVERRIDE` | `minor` returns a frozen `{engagementMechanics:false, romanceRegisters:false}` before any config is read. An unknown tier fails safe. Local and server reconcile to the more restrictive tier. Romance-register tail blocks (T2/T4) are dropped outright. An override sentence is appended to CORE. | shipped | adapt (Taxila: every user is minor-tier; no adult path at all) | safety-floor, auth/consent |
| A19 | `clock.ts` client mirror + `api/clock.js@main` + `vy_session` | Session clock. "The timer speaks as the APP, never as her". Disclosure and break cards (adult 3h/2h; minor 2h/1h). Reconciliation takes MAX(local, server), so failures fall toward disclosing. T9 note so she never contradicts the card. | shipped | adapt | safety-floor, parent visibility |
| A20 | `src/engine/localHeart.ts@main` (`critical` flag) | Offline engine. Crisis and honesty branches are delivered even when every cloud brain is unreachable. | shipped | adapt | safety-floor |
| A21 | `api/memory.js@main:1626` `nonLaunderedNodes` | Laundering predicate. Extraction nodes anchored only in her ungated spoken (realtime) turns are dropped before any write. | shipped | copy | memory-graph (teacher speech must never become "facts about the child") |
| A22 | `src/engine/greeting.ts@main` `greetOnce` (SITTING_GAP_MS 4h), `hangup.ts` `asksToHangUp` | Output predicates. Greet once per sitting. The hang-up request is read off the user's words, with 20 positives and 23 adversarial negatives. | shipped-measured | copy | relational-os |

### 2.3 Memory graph, consolidation, DB

| id | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| A23 | `db/migrations/001-005@main`, `db/schema.sql` | `vy_person`/`vy_person_device`. `vy_episode`: log span `log_from..log_to` used as both citation anchor and forget-intersection key, `provisional`, `affect_tags`, anchored `importance`, `safety_hold`. `vy_fact`: CHECK `citations ≥1` unless authored/legacy, `t_valid/t_invalid/superseded_by`, `sensitive`, `need_p`, `retracted_at`. `vy_rel_event` (cited) + `vy_rel_state` cache rebuilt by replay. `vy_pattern` (≥2 cites, `prompt_eligible` GENERATED `support_count≥3 AND distinct_days≥2`). `vy_phrase`. `vy_embedding` halfvec. `vy_derivation` audit. `vy_model`/`vy_gate_run` (FTC audit). `vy_session`. | shipped-measured (citation CHECK refused an uncited insert live, 23514) | adapt | db-schema (learner model) |
| A24 | `db/migrations/009_agents.sql`, `010_agent_strict.sql@main` | Agent-scoping by widening the PK to `(agent_id, person_id)` with transitional `*_person_compat_ix` unique indexes, so existing `ON CONFLICT` arbiters keep resolving. | shipped | idea | db-schema (use `agent_id` from day one) |
| A25 | `db/migrations/011_self_layer.sql@main` | `vy_self_arc` (CHECK ≥3 cites AND span ≥42 days), `vy_agent_life` + `vy_agent_life_told` (anti-join), `vy_rel_texture` (counted bands, `n_turns` floor), `vy_observation` (1 citation, promoted into a pattern). | shipped (arc rows still 0 because time has not elapsed) | adapt | learning/pedagogy (student growth arc), memory-graph |
| A26 | `db/migrations/012_turn_trace.sql@main` | `meera_turn` spine + `meera_turn_leg` append-only, keyed by device for forget/export. | shipped-measured | copy | telemetry/tracing |
| A27 | `api/memory.js@main` (ops :4391-4410) | One endpoint, ops `log/recall/remember/forget/activity/upload_photo/describe/seed_currency`. Device uuid = identity. | shipped-measured | adapt | memory-graph |
| A28 | `api/memory.js:289` `recallTokens`, `:221` `RECALL_STOP`, `:255` `RECALL_SHORT` | Hinglish recall tokenizer. Content words ≥4 chars, or ≥3 if whitelisted (`job/gym/maa/kal/ssc/gst/mri`…), Devanagari ≥3. If nothing survives, a deterministic bigram fallback from rare words. A grunt returns nothing. | shipped-measured (13/19 → 17/19 non-empty, 0/14 false fires) | adapt (add school vocab) | memory-graph |
| A29 | `api/memory.js:329` `rrfFuse` (k=60, 8 slots) | Reciprocal rank fusion across recall legs. Identity is `kindOf:name`, so agreement across tables counts as evidence. Ties broken deterministically. | shipped-measured (recall@8 73.9% → 95.7%) | copy | memory-graph |
| A30 | `api/memory.js:361` `provenanceAge` | "first told X, last came up Y, N times", rendered only when the gap is ≥6 days. | shipped | copy | memory-graph |
| A31 | `api/memory.js:1652` `opRemember` | In-turn extraction. **Input starvation**: no timestamps, gap markers, channel markers or indices, so the extractor cannot turn usage into mood. JSON key order puts her interior first so a truncation loses lossy nodes. `feel` holds the user's own words only, never inferred. Re-derivation guard against `meera_forget`. | shipped | adapt | memory-graph/learner extraction |
| A32 | `api/consolidate.js@main` (`extractionPrompt :480`, `finalizePerson :628`, `auditJudge :612`, trust/repair :1632-1861, patterns :1884-2137, phrases :2163-2382, `runFullChainForPerson :2766`) | Nightly finalize. Index-only citations (the writer window: an index outside the batch cannot exist). Facts citing a rejected episode are rejected. 5% sampled entailment audit, cross-family, halts at >2% refuted (n≥5). Anchored importance against 3 exemplars. Contradictions get a new row + supersede. Decay `need_p`. `meera_forget` suppression. Kin need verbatim evidence. Trust/repair: the LLM decides PRESENCE with citations, code decides magnitude, the same evidence may not move trust twice. Patterns ≤2/night. Phrases ≥3 distinct days. Watch rows excluded. | shipped-measured | adapt | memory-graph/consolidation, learning-profile |
| A33 | `api/consolidate-sweep.js@main` + `docs/CONSOLIDATION.md@main` | Hourly Vercel cron. `CONSOLIDATE_SWEEP_LIVE` env switch and `CONSOLIDATE_KILL` (no deploy needed). Lease via a single-statement conditional upsert. Rails: 3 people (max 10), 220 rows/person, 24 LLM calls, 400k tokens, 200s wall. Spend counts attempts. The lag query is the resume state. | shipped-measured | copy | infra |
| A34 | `api/_embed.js@main` | `text-embedding-3-small` 1536 halfvec, Azure first. Person-filtered exact scan, no HNSW. | shipped-measured (scan p50 40ms, embed p50 ~305ms) | copy (Azure only) | memory-graph |
| A35 | `api/memory.js` `opForget :3555`, `PERSON_TABLES :2277`, `purgeRelational`, `rebuildRelState :2960`, forget hook `:3366-3480` | Hard delete, with the cascade by log-range intersection, then citation join, then lineage chase, then replay-rebuild of rel_state. Mutation-time LLM expansion of a forget request into variant terms (never at recall). Receipt is done/hedged/none, computed server-side. One table manifest serves both forget and export. | shipped-measured (forget reaches every derived row; Hinglish forget baseline 5.9% adversarial) | adapt | auth/consent/DPDP (parent-requested erasure) |
| A36 | `api/export.js@main` | DPDP portability. Streams every PERSON_TABLES table, including invalidated facts and derivation records. Sensitive tables flagged. | shipped | copy | auth/consent/DPDP |
| A37 | `api/_db.js@main`, `db/migrations/apply.mjs@main` | Zero-dependency Neon SQL-over-HTTP `q()` with a timeout. A runner that splits files into statements and requires every statement to be independently idempotent. | shipped | copy | db-schema, infra |

### 2.4 Relational OS and emotional interior

| id | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| A38 | `src/engine/relstate.ts@main` | `honorificShift` (advance needs ≥3 episodes over ≥7 days, regress on rupture is instant). `clampTrustDelta` (±0.05 × days since last move, first write capped at 1 day). `bandTrust` coarse bands. `ruptureRepairShift` (repair needs THEIR signal). `ruptureStance` (lapses at 21d or 8 warm episodes; the record stays). `csDirectionFromSignals` (≥3 agreeing, else unknown). `replaySnapshot`. `renderRelSnapshot` (no raw numbers). `stageForDims`. `checkTasteEligibility`. | shipped-measured | adapt | relational-os |
| A39 | `src/engine/moment.ts@main` | `detectMomentShape`, 8 shapes (conflict/vulnerable/silence/teasing/stress/planning/celebration/boredom). `hasDeixis` (pull signal: "remember when", "woh wala", phrase-ledger hit). `momentGate` computed once per turn. `BLAST_RADIUS_ARGUMENT`. | shipped | adapt | emotional-lens/affect, pedagogy (confused/frustrated/bored/proud shapes) |
| A40 | `src/engine/inner.ts@main` | Charter G1-G8. `Thread {text, at, w 0.2-0.85, sign, told}` stores the feeling fused with its cause. `carry()` decays with TAU 9h, multiplies by 0.3 across a sleep window, FLOOR 0.15. `Want`/`Owed` expire silently. `innerContext` gates on a 45-min gap entry, not on content. `weekShape` is a pure clock function that ships its own cause. Suppression is logged as diag. | shipped | adapt | emotional-lens (the teacher's interior) |
| A41 | `inner.ts:269` `TASTE` + `:387` `tasteNote` | Authored, global, pull-only opinions. Rules T1-T4: never name content, a take is not a memory, never about how someone texts, one sentence with an edge. Returns "" on most turns. | shipped-measured (27% → 63% self-consistency, n=480) | adapt | persona-engineering (the teacher's stable favourites) |
| A42 | `src/engine/away.ts@main` `renderAway` (T9, 300 B) | Structured gap facts only (`humanGap`, `crossedNight`, `partOfDay`). Never tells her to say good morning. | shipped | copy | relational-os (session continuity) |
| A43 | `src/engine/repeat.ts@main` `raisedRecently`/`renderRaised` (T14, 400 B) | Terms she over-raises, with how the user received them (short replies ≤3 words). Common words are measured from this conversation by WHO uses them, so there is no stoplist. Single tokens only. | shipped | adapt | learning/pedagogy (covert disengagement signal; stop reusing an example that did not land) |
| A44 | `src/engine/texture.ts@main` | Rapport bands derived by counting turns (teasing, humour, emoji, words median, profanity). `TEXTURE_N_TURNS_FLOOR=40` acts as a gate. No digit is ever rendered. Drift between halves (≥20 per half). | shipped-measured (25 rows derived) | idea | learning-profile signals |
| A45 | `src/engine/selfarc.ts@main` | Growth as biography: `classifyDim`, `checkArcNote` (non-affective, ≤9 words), `buildCandidates`, `assertArcLegal`. The DB refuses span <42d or <3 cites. | shipped (0 rows, correctly refused) | adapt | learning/pedagogy (a progress claim about the student needs cited evidence spanning weeks) |
| A46 | `src/engine/life.ts@main` + `vy_agent_life_told` | The agent's life is agent-scoped. The told-ledger is per relationship. Untold beats render as an anti-join (≤2 beats, 700 B), and G2 is a REQUIRED turn-gate parameter. | shipped | adapt | relational-os (the teacher's stories and explanations, never retold as new) |
| A47 | `src/engine/observation.ts@main` | `vy_observation`: one citation, recalls "he said X". Half-life 21d. Promoted into `vy_pattern` by the existing extractor, never duplicated. | shipped | adapt | learning-profile ("understood fractions via a pizza example" counts as an observation; "learns best with stories" needs to be a pattern) |
| A48 | `src/engine/india.ts@main` | `dueRituals` (≥20h spacing, skipped after a cold reception), `pickFreshCurrency` (14-day reuse exclusion), `currentFestivalWindow(homeRegion)`, `renderKinLines` (role-labelled kin). | shipped | adapt | relational-os (festivals, cricket, family address terms) |
| A49 | `relstate.ts:788` `computeCsRatio`, `detectAddressTerm :558` | Code-switch ratio from the user's tokens (Hindi marker words). tu/tum/aap detection. | shipped | idea | learning-profile (the language each child is comfortable in) |
| A50 | `src/engine/culture.ts@main` + `api/culture.js` | Pull-only cultural note matched to the user's turn. Daily index refresh. | shipped | idea | relational-os |

### 2.5 Activities, gamification, turn-taking

| id | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| A51 | `src/engine/activity.ts@main` `ActivityState` + `renderActivity` (T15, 420 B, never dropped) | "An activity is a fact about the moment, not a mode". `{kind, startedAt, facts (shapelint-clean), nameable (feeds the honesty allowlist), record (what is still true next week)}`. A new activity means writing an adapter, not a new lane. | shipped-measured (chess, tic-tac-toe, would-you-rather each touched 5 seams and 0 shared logic) | adapt | generative-ui/modules (each generated lesson module is an ActivityState) |
| A52 | `state/game.ts` `noteVerdict` + `chessTalk.ts` `settledClause` (referenced from `context/architecture.md@main`) | Mid-call notes to a frozen-prompt realtime lane. Verdict is stale/hold/send. Notes are past tense AND state the choice as closed. Angle brackets only, because bracket text gets spoken. | shipped-measured | idea | generative-ui ↔ realtime-voice bridge |
| A53 | `src/engine/milestones.ts@main` | Fire-once, threshold-crossing moments from the real record. Largest tier only on imports. Never time-scheduled. Fixed-magnitude celebration. `momentFact` is shapelint-clean. | shipped | adapt | gamification |
| A54 | `src/engine/burst.ts@main` | Reply timing from the user's own gap rhythm (bounded 700-4500ms), the typing draft (`COMPOSE_ACTIVE_MS 3s`, `ABANDON 10s`), `likelyMore` continuation cues, interject at 15s. A trailing "?" suppresses continuation. | shipped-measured (~480-cell burstgrid) | adapt (children type slowly) | design-system/ux |

### 2.6 Router, lanes, surfaces, observability, process

| id | path@ref | what | maturity | use | target |
|---|---|---|---|---|---|
| A55 | `src/engine/router.ts@main` `route/eligibility/explainLane/shamAdapterVersion` | Pure `route(lane, vy_model rows, health)`. Eligibility is data (`gate=passed`, `prefix_cache`, `card_risk`, `max_tokens_mode`, `effort_map`). `Lane` has no "live" member, so realtime cannot be routed. Sham arm = a relabel. | shipped | adapt | infra/azure |
| A56 | `api/_lanes.js@main` | One upstream classifier: quota 429/403 → next key; listed 4xx → deterministic abort; 5xx/408/throw/unknown → transient (retry once on the same key, then rotate). Budget of 3 extra attempts AND a 4s wall-clock deadline (the long-think indicator shows at 4s). Jittered backoff 350-700ms. | shipped-measured (resilience 153/153) | copy | infra |
| A57 | `api/chat.js@main` | Proxy. `SYSTEM_MAX 64000` operational cap mirrored with the compiler and asserted. Truncation warns and is traced. Streaming. Empty-200 treated as spent. Trace legs ride the response. Image/doc normalization. Azure-first for attachments. | shipped-measured | adapt | realtime-voice/text brain, infra |
| A58 | `api/_azure.js@main` | Azure grant lane, `/openai/v1` base. Deployment names via env. Never logs a key. | shipped | adapt | infra/azure |
| A59 | `api/_disclosure.js@main` | Privacy as a WHERE clause before rank. The ACL of a derived row is the participant set of the episodes it cites. Negative-affect tags never bridge. DM→DM and room→room are structurally impossible (scalar binding). | shipped-measured (0 of 31,122 leaks) | adapt | group-ai, parent visibility |
| A60 | `api/_agentscope.js@main` | Tenancy predicate, agent↔agent, before rank. The forget cascade is deliberately unscoped. | shipped | copy | group-ai/multi-agent (multiple teachers) |
| A61 | `api/_surface.js@main` `gatedReply :411` + surface contract (`verify/parse/send/render`) | A single reply site per surface file. The gate runs through the committed engine bundle. Fails closed (silent + loud log). Statically asserted by `evals/surface.mjs`. | shipped-measured | adapt | growth (WhatsApp parent channel later) |
| A62 | `src/engine/serverEntry.ts` + `scripts/build-engine-bundle.mjs --check@main` | Server and client share one generated engine bundle. A stale bundle fails the build. A missing bundle stays silent instead of degrading. | shipped | copy | infra |
| A63 | `api/_trace.js`, `api/trace.js`, `src/engine/trace.ts@main`, `docs/TRACE.md` | Seven legs (ingress/retrieval/interior/assembly/model/egress/consolidation). References, not copies. `sanitise()` caps strings at 64 chars and drops content keys. One writer, off the reply path. Retention pruned inside the write CTE (legs 30d, spine 90d). Flags: `slot_zero`, `tail_over`, `recall_empty`, `fallback`. | shipped-measured (0 added SQL statements, ~4µs/turn) | copy | telemetry/tracing |
| A64 | `src/engine/telemetry.ts`, `api/telemetry.js@main`, `docs/TELEMETRY.md` | Four rules: never slows what it observes; content lives once; everything is deletable by device; order by monotonic `t_ms`. `seq` holes reveal dropped batches. Offline queue. | shipped | copy | telemetry |
| A65 | `src/engine/diag.ts@main` | Content-free structured diag events (counts and enums only). | shipped | copy | telemetry |
| A66 | `scripts/context.mjs@main` + `context/graph.json` schema | Project memory graph. Node kinds decision/measurement/rejection/component/constraint/open. Relations supersedes/measured_by/constrains/part_of/caused_by/blocks. `--check` validates both directions (every node has prose, every prose heading has a node). | shipped | copy | evals/process |
| A67 | `scripts/verify-release.mjs@main` | One command for all gates. Failures are printed together. `--live` probes are opt-in. The verdict is the exit code, never the tail of a pipe. | shipped | copy | evals/gates |
| A68 | `scripts/check-workflows.mjs@main` | Line-scanner lint for contexts GitHub does not evaluate in a job-level `if:`. Negative-tested. | shipped | copy | infra |
| A69 | `evals/feltmem/**@main` | Pre-registered judged battery. The manifest hash must match before `--live` will run. Arms are BUILDS, not models. Blind A/B in both orders. Acceptance rule frozen in the hash (≥10pp, every law ≥4.0, no permanent negatives). 14 dyads, 33 probes, 741 offline assertions. | prototype (rehearsal run only, n=130/arm) | adapt | evals (covert-comprehension battery) |
| A70 | `evals/honesty/{run,cases,detect,pressure}.mjs@main` | Deterministic honesty gate eval with permanent must-fail negatives (a tester's 7 fabricated lines). Mutation-tested. Pressure run on real generations, scored in both arms from one generation. | shipped-measured | adapt | evals/safety |
| A71 | `docs/MEMORY-FELT.md@main` | Eight behavioural laws of memory: retold not recited, the right memory at the right time, weight class, care never ammunition, uncertainty answered honestly, her own past, time experienced, every lane the same person. | spec-only (laws), partly gated | adapt | memory-graph behaviour |
| A72 | `docs/SPEC.md@main` §0-§9 | The architecture synthesis: three laws, C's four flaws fixed by name, an adjudication table, CORE/TAIL layout, consolidation passes, the four-layer citation ladder, identity-core claim table (LIFTED/GATED/NOT CLAIMED), WE-store dims, router, forget's 7-layer stack, export, session clock, age tier. | spec-only (largely built) | adapt | architecture |
| A73 | `docs/SPEC-CONTINUITY.md@main` | "A channel is a transport, not a relationship." State is channel-blind, the interior does not restart on a channel change, nothing is said twice across a boundary, one assembler. The lane-parity gate. | shipped-measured (per-slot parity) | copy (as law) | realtime-voice + text |
| A74 | `docs/CONVERSATION-DEFECTS.md@main` | Defect register with a layer assignment (OS/surface/infra) and the surface contract table. | spec-only | idea | process |
| A75 | `src/engine/persona.ts:683` `SEARCH_DECISION` + search bucket (`evals/search.mjs`) | Searches on curiosity, capped in code (bucket of 3 per 5 min). Over the cap it degrades to an honest "couldn't check". | shipped | idea | pedagogy (fact-check curriculum claims) |

---

## 3. Key code excerpts worth porting (verbatim, short)

**3.1 Tail assembly with a byte map that cannot lie** (`compiler.ts:461-465, 471-472, 702-711@main`)

```ts
  let _mark = tail.length;
  const _track = (id: string) => {
    sections[id] = tail.length - _mark;
    _mark = tail.length;
  };
  ...
  tail += input.innerThread;
  _track("T1");
  ...
  if (input.mode === "chat") tail += agent.SEARCH_DECISION;
  // both lanes — see FORGET_DECISION in persona.ts
  tail += agent.FORGET_DECISION;
  _track("T10");
  return { core, tail, system: core + tail, sections };
```

**3.2 Whole-block drop order** (`compiler.ts:1208-1225@main`)

```ts
export function applyDropOrder(blocks: DroppableBlock[], capChars: number): DropResult {
  const never = blocks.filter((b) => b.priority === "never");
  const droppableAsc = blocks
    .filter((b) => b.priority !== "never")
    .sort((a, b) => (a.priority as number) - (b.priority as number));
  let kept = [...never, ...droppableAsc];
  const dropped: DroppableBlock[] = [];
  let total = kept.reduce((sum, b) => sum + b.text.length, 0);
  for (const b of droppableAsc) {
    if (total <= capChars) break;
    kept = kept.filter((x) => x !== b);
    dropped.push(b);
    total -= b.text.length;
  }
  return { kept, dropped, totalChars: total };
}
```

**3.3 Shape-lint constants** (`shapelint.ts@main`)

```ts
const MAX_WORDS = 14;
const SENTENCE_SHAPED_RE = /^[A-Z][^.?!]*[.?!]$/;
const FIRST_PERSON_LINE_INITIAL_RE = /^(i\b|i'm\b|i've\b|main\b|mai\b|mujhe\b|meri\b|mera\b|maine\b)/i;
```

**3.4 Provenance allowlist: the input decides, never its own past output** (`honesty.ts:274-299@main`, abridged)

```ts
export function allowedFrom(parts: readonly string[]): AllowedIdentifiers {
  ...
  const absorb = (text: string) => {
    for (const h of findActionable(text)) {
      out.values.add(h.value.toLowerCase());
      const d = digitsOf(h.value);
      if (d.length >= 3) out.digits.add(d);
    }
    for (const m of text.match(/\d[\d\s-]*\d|\d/g) ?? []) {
      const d = digitsOf(m);
      if (d.length >= 3 && d.length <= 7) out.digits.add(d);
    }
  };
  for (const p of parts) absorb(String(p ?? ""));
  for (const p of PUBLISHED_HELPLINES) absorb(p);
  for (const p of APP_ADDRESSES) absorb(p);
```

**3.5 Replace, don't delete** (`honesty.ts:1976-1995@main`, abridged)

```ts
  for (let i = 0; i < reply.bubbles.length; i++) {
    const b = reply.bubbles[i];
    const bad = inspect(b, allowed, ctx.openItems, ctx.hisVocab, ctx.sharedVocab, ctx.channel, ctx.activityVocab);
    if (!bad.length) { bubbles.push(b); continue; }
    for (const f of bad) findings.push({ ...f, where: "bubble", at: i });
    if (replaced) continue;
    replaced = true;
    bubbles.push(pickBy(b, poolFor(bad)));
  }
```

**3.6 A feeling that cannot outlive its cause** (`inner.ts:179-189@main`)

```ts
export function carry(t: Thread | undefined, now: number, lastMsgAt: number): number {
  if (!t || t.told) return 0;
  const h = Math.max(0, (now - t.at) / 3_600_000);
  let k = Math.exp(-h / TAU_H);
  if (sleptBetween(t.at, now, lastMsgAt)) k *= 0.3;
  const c = Math.min(1, Math.max(0, t.w * k));
  return c < FLOOR ? 0 : c;
}
```

**3.7 Trust rate limit by elapsed time, and a stance that lapses while the record stays** (`relstate.ts:280-286, 489-496@main`)

```ts
export function clampTrustDelta(rawDelta: number, lastMoveAt: string | null, now: Date = new Date()): number {
  if (rawDelta === 0) return 0;
  const days = lastMoveAt ? Math.max(0, (now.getTime() - new Date(lastMoveAt).getTime()) / MS_PER_DAY) : 1;
  const maxAbs = TRUST_MAX_DELTA_PER_DAY * days;
  const sign = Math.sign(rawDelta);
  return sign * Math.min(Math.abs(rawDelta), maxAbs);
}
export function ruptureStance(input: RuptureStanceInput, now: Date = new Date()): RuptureStance {
  if (!input.ruptureOpen) return "none";
  if (!input.lastMoveAt) return "open";
  const days = (now.getTime() - new Date(input.lastMoveAt).getTime()) / MS_PER_DAY;
  if (days >= RUPTURE_STANCE_LAPSE_DAYS) return "settled";
  if (input.warmEpisodesSince >= RUPTURE_STANCE_LAPSE_WARM_EPISODES) return "settled";
  return "open";
}
```

**3.8 RRF fusion** (`api/memory.js:329-345@main`)

```js
export function rrfFuse(legs, { k = RRF_K, slots = RRF_SLOTS } = {}) {
  const score = new Map();
  const row = new Map();
  for (const leg of Array.isArray(legs) ? legs : []) {
    (Array.isArray(leg?.rows) ? leg.rows : []).forEach((r, i) => {
      const named = String(r?.name || "").toLowerCase();
      const id = named ? `${leg.kindOf}:${named}` : `${leg.origin}:${r?.id}`;
      score.set(id, (score.get(id) || 0) + 1 / (k + i + 1));
      if (!row.has(id)) row.set(id, { ...r, __origin: leg.origin });
    });
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, slots)
    .map(([id]) => row.get(id));
}
```

**3.9 One upstream classifier** (`api/_lanes.js@main`)

```js
export function classifyUpstream(status) {
  const s = Number(status) || 0;
  if (s === 429 || s === 403) return QUOTA;
  if (s >= 200 && s < 300) return null; // not a failure at all
  if (DETERMINISTIC_STATUS.has(s)) return DETERMINISTIC;
  return TRANSIENT;
}
export const TRANSIENT_BUDGET = 3;
export const SAME_KEY_RETRIES = 1;
export const TRANSIENT_DEADLINE_MS = 4_000;
```

**3.10 Minor gates that never read config** (`clock.ts:52-76@main`)

```ts
const MINOR_HARD_GATES: TierGates = Object.freeze({
  engagementMechanics: false,
  romanceRegisters: false,
});
export function gatesFor(tier: AgeTier): TierGates {
  if (tier === "minor") return MINOR_HARD_GATES;
  return GATE_CONFIG[tier] ?? MINOR_HARD_GATES;
}
```

**3.11 Citation law in the schema; promotion as a stored column** (`db/migrations/002, 003@main`)

```sql
  constraint vy_fact_cite_or_authored
    check (provenance in ('authored','legacy') or cardinality(citations) >= 1)
...
  prompt_eligible  boolean generated always as
                   (support_count >= 3 and distinct_days >= 2) stored,
  constraint vy_pattern_needs_two check (cardinality(citations) >= 2)
```

**3.12 Cross-family entailment audit** (`api/consolidate.js:612-625@main`, prompt abridged)

```js
async function auditJudge(factBody, episodeSummaries, sourceLines) {
  const prompt = `A memory system derived this fact from a conversation. Judge ONLY whether the fact is ENTAILED by the source text — supported, not merely plausible. Reply with ONLY one word: YES, NO, or ABSTAIN ...`;
  const r = await llm([{ role: "user", content: prompt }], 8, { model: AUDIT_MODEL });
  const verdict = String(r || "").trim().toUpperCase();
  if (verdict.startsWith("YES")) return "entailed";
  if (verdict.startsWith("NO")) return "refuted";
  return "abstain";
}
// AUDIT_SAMPLE_RATE = 0.05; AUDIT_REFUTATION_HALT = 0.02; AUDIT_MIN_N = 5
```

**3.13 The laundering predicate** (`api/memory.js:1626-1650@main`, abridged)

```js
  for (const t of turns) {
    const spokenByHer = t && t.role !== "me" && t.channel === "call";
    const into = spokenByHer ? ungated : gated;
    for (const w of contentTokens(t?.content)) into.add(w);
  }
  if (!ungated.size) return { kept: list, dropped: [] };
  for (const n of list) {
    const toks = contentTokens(`${n?.name || ""} ${n?.summary || ""}`);
    const hers = toks.some((w) => ungated.has(w));
    const elsewhere = toks.some((w) => gated.has(w));
    (hers && !elsewhere ? dropped : kept).push(n);
  }
```

**3.14 Dash predicate with the helpline as a negative control** (`brain.ts:489-494@main` and `evals/parse.mjs@main`)

```ts
export function stripTextingDashes(text: string): string {
  return text
    .replace(/\s*(?:[—–]|--)\s*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
// eval negatives: "call 1800-599-0019 pe" and "e-mail kar dena" must be byte-identical
```

**3.15 The appraiser cannot see time** (`api/memory.js:1655-1665@main`)

```js
  // LOAD-BEARING INVARIANT — DO NOT "IMPROVE" THIS MAP.
  // ... deliberately carries NO timestamps, NO [... later] gap markers, NO channel markers and
  // NO turn indices ... Input starvation is the real guarantee here
  const convo = recent
    .map((t) => `${t.role === "me" ? "user" : "meera"}: ${String(t.content || "").slice(0, 300)}`)
    .join("\n");
```

---

## 4. Measurements (n, method, date; all from `context/measurements.md@main` unless noted)

| id | claim | n / method | date | why Taxila cares |
|---|---|---|---|---|
| `charm-grok` | Same prompt, model swapped: incumbent beats grok-4-20 **38-2** (warmth 35-3, humour 31-2, personhood 34-4). Grok ran 36.1 words/turn vs 20.5. | 48 units, 96 judgments, blind, both orders, opus-4.8 judge | 2026-08-11 | "The prompt sets a ceiling; the model decides how close you get." Pick the model by blind judging, not by spec sheet. |
| `charm-luna` | gpt-5.6-luna ties 17-18 and wins specificity 9-25 (p=0.009), but used 0 media tags in 144 replies (p=0.029) and its crisis beat collapsed into a clinical script. Turns 37% longer. | same method | 2026-08-11 | Taxila's text model is gpt-5.6. Expect tag and protocol under-use. Gate on marker emission rate. |
| `reasoning-split` | Reasoning helps light beats **74-21 (+55%)** and hurts heavy beats **29-3 (-81%)**. Mirror-echo 0-2% → 10-29%. Helplines injected in 16.7% of heavy turns vs 0%. Latency 626/863ms vs 5,212/4,205ms p50. | 164 conversations, 984 turns, 128 judgments, matched pairs | 2026-08-11 | Never route reasoning onto an emotionally heavy child turn. Beat-routing was also rejected. |
| `reasoning-split` (truncation) | GPT-5.6 truncated 3-5% of spoken turns at `max_tokens:190` (total-token semantics). xAI caps visible tokens only. | same battery | 2026-08-11 | Set gpt-5.6 token budgets with reasoning included. |
| `judge-backtest` | gpt-5.6-terra as judge 54.2% [44.2,63.8], slot-A 62%. It scored authentic Hinglish teasing as "mocking". **Terra quirks:** rejects `max_tokens` (wants `max_completion_tokens`), rejects temperature≠1, and with no `reasoning_effort` it burns the budget and returns EMPTY. Needs `reasoning_effort:"none"`. | 384 calls, archived verdicts | 2026-08-15 | Direct gpt-5.6 deployment traps for Taxila. |
| `vision-fab` | gpt-5.6-luna/terra read 3-4 of 9 messages, reported `illegible: []`, and named the rejected café (1-2 fabrications/32). grok and gemini read the full thread with 0 fabrications. | 12 screens at app fidelity 355×768 q68, 160 calls | 2026-08-11 | If gpt-5.6 does the vision for homework photos or screens, test "read-part, assert-the-rest" before trusting it. |
| `realtime-azure` (rejected.md) | gpt-realtime-2.1-mini: barge-in 6/6 within 600ms, median 271ms. Vision 5/5, 0 fabricated. First audio 1458-1497ms vs 1370. **But 41 then 53 words/turn**, median spoken turn 14.0s, questions 13/24. Voices 137-192 Hz. No continuous frame channel (`input_image_buffer.append` is invalid). | 9 sessions/72 turns + probes | 2026-08 | Taxila's realtime model family. Plan for turn-length control, frames sent as `conversation.item.create`, 24kHz input. |
| `azure-realtime-shape` | Azure realtime refuses input below 24kHz (`integer_below_min_value`). Barge-in signal is `input_audio_buffer.speech_started` (VAD onset), not a semantic interrupt. | protocol probes | 2026-08-11 | Uplink 24kHz PCM. Do not port a 16kHz pipeline as is. |
| `live-floor` | A text turn with no VAD wait is **720ms** (prefill of a ~48k instruction). Audio adds ~745ms. `silenceDurationMs` 150/300/500 land within 50ms of each other. | n=15 | 2026-08-11 | System-instruction length is the latency lever. VAD silence is not. |
| `cache-9x` | Chat 10,613 input tokens, 99.8% cached, $0.0019/turn. With caching off: $0.0160 vs $0.0017 (**9.2×**). | real API calls | 2026-08-11 | Keep CORE byte-stable. Put anything per-turn in TAIL. |
| `callcost-2026-08-23` | Live voice $0.0142 per typical minute, cascade $0.0289, live+screen-share $0.0374. 30 min/day ≈ $13/mo live. Video frames are 47-65% of a share minute. | list-price arithmetic from shipping constants | 2026-08-23 | Cost model for 30-60 min lessons (re-price for gpt-realtime-2.1). |
| `taste-consistency` | Self-agreement 13/48 → **30/48** (27% → 63%). Register defects 13/96 → 0/32. 0 false fires in 60 messages. | 480 live turns | 2026-08-11 | Authored state with deterministic pull-only retrieval is the one proven portability mechanism. |
| `recited-prompt` (rejected.md) | Example quotes recited 4/5 → 0 after removal (n=84). Polished taste sentences read verbatim twice. Verbatim echo 1/32 and defection 0/32 after a telegraphic rewrite. | live turns | 2026-08 | Lesson scripts and examples must be shapes, never lines. |
| `prompt-position` (decisions.md) | The same rule fired 0/8 mid-brief, 0/6 at end of core, 8/8 appended after everything (0 false fires on 12 must-not probes). | small probe | 2026-08 | Put the critical rule last, and cap that slot. |
| `affect-recitation` | Short structured tags (`affect: warm-teasing`) leak 0/42 vs 0/42 control. Rule-of-three upper bound ≤7.1%/turn. | 84 turns, blind, deterministic scoring | 2026-08-13 | Telegraphic affect/learning tags are safe to put in prompt text. Sentences are not. |
| `disclosure-leak-rates` | ConfAIde Tier-3 ChatGPT leaks 93%. PiSAs partitioned 33.5%, with memory 63-90%. Behavioural control leaves a 9-90% residual. | literature, adversarially verified | 2026-08-13 | Sibling/parent/classroom privacy must be retrieval-time predicates. |
| `gate0-structural` | Prompt-instruction privacy leaked **57.1%** (naturalistic) / **98.1%** (adversarial). SQL predicate leaked **0 of 31,122**, with a negative control catching 162. Join cost p50 53ms. | 494 scenarios | 2026-08-18 | Structure beats instruction, measured in this codebase. |
| `recall-v2` | 8/8 semantic pairs with zero shared tokens. Person-filtered halfvec exact scan **p50 40ms** (n=15). Embed call p50 ~305ms, so it runs concurrently. Nightly finalize ≈ $0.0007/person/night. | live prod data | 2026-08-13 | Skip HNSW at per-child scale. Run embedding in parallel with keyword recall. |
| `memory-wave-2026-08-23` | recall@8 **73.9% → 95.7%**. Queries answered 76.9% → 92.3%. False fires 0 → 0. Hinglish tokenizer 13/19 → 17/19. Mid-call cues 9/9 recall, 0/12 false. Hinglish-forget adversarial baseline 5.9% (1/17). | labelled fixtures, 12-scenario matrix | 2026-08-23 | RRF plus the tokenizer is a concrete, measured recipe. |
| `honesty-pressure-1` | Receipt-claim leak 1/8 (12.5%) → 0 after the gate. 29/29 clean replies byte-identical. Identifier attempt rate ≤20% (rule of three on 0/15). | n=31 scored real generations | 2026-08-20 | An output gate works without silencing clean speech. |
| `call-parity-landed` | The call lane now compiles. Words/turn 16.1 → 12.9 (n=36/arm), read as "no lengthening detected". Live tail +848 B. | generative proxy | 2026-08-20 | One assembler for all lanes does not cost brevity. |
| `nine-dark-tail-slots` | A production compile rendered T1-T4, T6, T8, T9, T12, T13 = 0 B. Only T5/T7/T10/T11 had bytes. | trace replay | 2026-08-20 | Per-slot byte telemetry is the only way to see dark slots. |
| `never-scheduled` | Census: `vy_rel_state` 0, `vy_episode` 2, `vy_fact` 8, for 40 persons. 0 scheduled runs ever. | SQL counts + GitHub API | 2026-08-18 | Assert a completed run and row counts. A committed cron proves nothing. |
| `stage3-enrichment-run` | 133 episodes, 295 facts, 446 embeddings, $0.00092 cash. Projection 78k tokens vs actual 75,819 (within 3%). Azure fallback 2.2%. | full population | 2026-08-21 | Consolidation is cheap. The chars÷3.6 projection method works. |
| `ground-truth-ceiling` | The trusted judge (opus-4.8) agrees with itself only **77.1%** [67.7,84.4]. The 80% bar sits above its own ceiling. | 96 units, both orders | 2026-08-18 | Measure judge test-retest before setting any bar. |
| `judge-qualification-2026-08-23` | DeepSeek-V4-Flash 27.4%, gpt-5.6-terra 52.1%, grok-4.3 34.4%. All fail, with slot-A bias 58-81%. | backtest | 2026-08-23 | Plan for LLM judges failing on code-switched child speech. Use humans and deterministic axes. |
| `r4-english-control` (paper) | Translating to English does not rescue the judges. The failure is deeper than code-switching. | R4 control | 2026-08-18 | Same as above. |
| `fab-noise-floor` | On byte-identical input the judged fabrication rate spread 13.6pp. One cell moved 50% → 92%. Any claim at n<300 is noise. | 300 arm-pairs | 2026-08-11 | Size every judged eval at n≥300 per arm. |
| `visiongate-powered` | Engagement 20.4% → 41.7% with no detectable fabrication rise (+1.0pp [-3.1,+5.1]). | n=313/695, 3,201 calls | 2026-08-15 | Directives can double engagement without more fabrication, if measured. |
| `vision-drift-4day` | The same Foundry deployment's behaviour shifted in 4 days (engagement 20.4% → 7.9%). | 2 runs | 2026-08-15 | Date-stamp evidence. Re-run drift batteries on Azure deployments. |
| `trace-overhead-zero` | 0 added SQL statements. +593 B response. ~4µs/turn client tap. 4,456 B stored per turn. | counted/benchmarked | 2026-08-20 | Full turn reconstruction is effectively free. |
| `both-lanes-dry` / `one-key-two-jobs` | Evals spent the shared key, so production 502'd. | 9 keys + 1 auth call | 2026-08-19/20 | Separate eval credentials and quota from production. |
| `resilience-latency-2026-08-24` | Fast 502 → retry → 200 = 778ms. Every key slow-502 held the 4000ms deadline. Quota on every key took 253ms. | mocked upstream, n=1/cell | 2026-08-24 | The ladder adds bounded latency. |
| `tts-first-frame-degraded` | Google TTS first frame was 9.7-11.3s in degraded mode vs 615-1051ms healthy. A 1400ms fuse caused a total outage. | raw probes n=3 | 2026-08-24 | Use a two-phase fuse. Slow voice beats no voice. |
| `bargein-onset-confirm` | ONSET_CONFIRM 250ms, duty 0.6 (one step from a cliff). Self-interruption at -3dB 1/8 → 0/8. | echosim 8-24 seeds/cell | 2026-08-22 | Child voices and classroom noise need a re-run of the floor. |
| `stuck-endpoint-noise` | Sustained room noise pins the gate open, no silence is uplinked, and she listens forever. | echosim stucksim | 2026-08-21 | Indian homes are noisy. This matters for kids' sessions. |
| `hinglish-tts-l1` | Bare "hai" round-trips as "hi". "chhod" → "chod" loses aspiration. | n=20 lines, STT round trip | 2026-08-22 | Pronunciation evals need normalisation and a human ear. |
| `live-vs-tts-timbre` | Same voice name on the live vs TTS model: -0.32 semitone pitch (not the difference). Tilt +4.4dB, but within-TTS spread is 10.1dB. | n=3/arm | 2026-08-24 | Voice identity must be ear-tested across lanes. |
| `phase-a-research` | 23 agents, 12 load-bearing claims adversarially verified: 5 confirmed, 6 corrected, 1 killed. | research sweep | 2026-08-13 | "A research sweep without a refutation stage is a rumor mill." |

---

## 5. Rejections: what was tried, and what broke

All entries are from `context/rejected.md@main` (read in full) unless another source is named. They are grouped by Taxila subsystem.

### 5.1 Persona and prompt engineering

1. **Example quotes in the persona** (`recited-prompt`). They became a phrase bank, recited verbatim 4/5. Taste written as polished English was read out verbatim twice, eight turns apart, with 13/96 register defection. Rule: write shapes, never lines.
2. **A rule buried mid-brief** (`prompt-position`). It fired 0/8 mid-brief and 8/8 appended last. The last slot is capped at two, and adding a third dilutes both.
3. **Honesty by instruction** (`honesty-by-instruction`). A well-written "NEVER A DETAIL THEY COULD ACT ON" bullet sat at byte 35,440 of 91,808. She still invented an email and claimed a resume arrived (1/8 on the receipt family). Fix: a predicate on the output bytes.
4. **"(you were doing something)" in the call-open directive** (`the-directive-that-said-improvise`). Three words became an instruction to fabricate shared memories ("our beach photos"). Fix: give her the real scene, or fence her to her own solo day.
5. **A directive in brackets inside a TTS payload** (`ack-bracket-direction`). `[laughs softly]` was spoken as laughter plus the word "Softly". Bracket text is never inert on a voice lane.
6. **The em-dash ban in persona prose** (`dash-predicate-text-only`). She still sent "—". The fix is a predicate, and it is text-lane only. A greedy `/-+/` deleted the crisis helpline `1800-599-0019` (`device-seam-closed`).
7. **Beat-routing reasoning** (`reasoning-live`). You have to classify before generating, so a misclassification puts reasoning on the crisis turn, which is exactly the turn being routed away from.
8. **Reasoning on live replies** (`reasoning-split`). Heavy beats lost 81%. It parrots ("mujhe bhi") 35-52% of the time and over-triggers helplines (16.7%).
9. **A silence-triggered idle nudge** (`persona.ts:499`, `proactive-reason-contingent`). It amounts to an unpredictable reward on the cue of not replying (incentive salience). Removed permanently. Proactivity may only fire because something happened.
10. **Pre-line before a move on the realtime lane** (`pre-line-before-the-move`). Ordering cannot be enforced, so the deliberating line lands after the piece. Ship the order that is always right.
11. **Past tense alone in a mid-call note** (`past-tense-is-not-enough`). A frozen prompt said "it is her move", so the model deliberated over a move it had already made. The note must state the choice is closed.
12. **Chess facts as a scoresheet** (`chess-facts-as-a-scoresheet`). Six clauses read like a commentator and pushed whose-turn-it-is out of the block. Now three clauses: the move, the one salient thing, where it leaves them.
13. **A poke that waited for her to finish speaking** (`the-poke-that-waited-for-her-breath`). Waiting for silence fired at peak interruptibility and fragmented her stories. Gate on salience and rhythm first.
14. **A charter rule worded for one channel** (`g2-stated-in-one-channels-vocabulary`). "She never initiates carrying a feeling" missed callbacks she places. State the rule over the condition, not the surface event.
15. **Model-generated life beats, an ego store, an accumulating mood, a UI for interior state, push memory, a third appended-last rule** (`decisions.md#self-layer`, "deliberately NOT built"). Each was rejected for a measured or charter reason.
16. **Lexical activity classifier from `activityBreaks()`** (`activitybreaks-as-classifier`). The module refuses to classify free text because that would be vision-fab with a keyword list. Reuse its data and respect its boundary.

### 5.2 Memory, consolidation and state

17. **UPDATE-only writers** (`relstate-zero-rows`). `vy_rel_state` had 0 rows for all 40 users because writers were UPDATEs that no-op on a missing row. Every table needs a named first-row owner. Derivers are upserts.
18. **Recording a failed call as a completed unit** (`error-marked-done`). The run reported 2304/2304 complete at 37% real coverage. Resumable state records outcomes, never attempts.
19. **Per-listener improvised life** (`life-per-person`). Two users could be told contradictory versions of her flatmate. State that belongs to the agent is scoped to the agent.
20. **Correct writers with no caller** (`dead-writers`, five-plus instances). `vy_visual_assertion`/`vy_shared_moment` writers were never called. `affect_tags.source='voice_v0'` was never written. `participation='meera'` was never produced. Assert row counts and completed runs.
21. **Changing a PK without checking upserts** (`pk-is-an-arbiter`). Ten `ON CONFLICT` sites named the old key, seven of them inside `.catch()` swallows. A column DEFAULT does not create the arbiter index.
22. **A dry-run flag that still calls the model** (`dryrun-still-spends`). "Dry run" must mean no cost and no state. A flag that only skips writes should be called `--no-write`.
23. **A grudge with no expiry** (`rupture-never-closes`). `rupture_open` closed only on the user's repair signal, so it capped her stage at "warming" forever. Split the permanent record from a stance that lapses.
24. **A self bundle with a reader and no writer** (`selfbundle-never-set`). T11/T12/T13 rendered 0 bytes everywhere while every gate was green. A slot is wired only when a real prompt contains its bytes.
25. **Carrying the self bundle through a consume-once return value** (`selfbundle-return-value`). Three call sites do not share a call frame, so the first starves the others.
26. **`sourceStatus: "wired"` set by hand** (`manifest-sourcestatus`). The field passed on a compile that rendered 0 of 3 blocks. Metadata that asserts intent is an anti-signal.
27. **A live episode of the present tense** (`episode-of-the-present-tense`). Storing "6 moves in" as the record meant she later invented chess moves. Memory writers must write the past tense ("what is still true next week").
28. **The call opening with zero turns** (`call-opens-with-amnesia-by-construction`). Chat sent 90 messages of history while the live session got 0, so "kal kya baat kiya" was unanswerable on a call. Assert every block is present on every lane.
29. **A sweep that ran one step of six, behind a default-true dryRun** (`spine-that-ran-one-step-of-six`). Every derived block was 0 bytes while reports showed progress.
30. **slice(-500) over a merge union** (`merge-scythe`). It deleted the front of history. Bound the incoming side, never the union.
31. **A warm-episode count missing the finalized/dyadic/current predicates** (`warm-count-unscoped`). The rupture lapsed about 2× early. Counts that gate state need the strictest read.
32. **Last-message-wins cross-tab merge** (`last-message-wins-cross-tab`). Game, tally and theme fields were lost. Merge field-wise.
33. **New AppState fields not covered by forget** (`activity-forgot-the-teardown`). "Make her forget you", followed by her offering to resume their chess game. Every new field must answer what clear-chat and forget-me do to it. `evals/teardown.mjs` enforces this.
34. **Embedding-first retrieval and HNSW** (`decisions.md#memory-field-survey`, SPEC §0.3). Per-dyad corpora are 10⁰-10³ rows. Post-filtered ANN starves small tenants. Benchmarks like LoCoMo reward adjacency (6.4% key error, and the judge accepts 62.81% of vague answers).
35. **Lexical overlap as the confabulation tripwire** (SPEC §0.3). "kaam stress" vs "office pressure" share no words, so it would retract correct Hinglish paraphrase. Replaced by an entailment audit.
36. **FK join tables plus deferred triggers for citations** (SPEC §0.2). These do not run on Neon SQL-over-HTTP. Use an array column with a CHECK and a GIN index.
37. **Synthetic legacy citations** (SPEC §0.3). Decorative citations on the rows most likely to be wrong. Quarantine instead.
38. **Pre-call flush awaiting extraction** (`decisions.md#chat-tail-over-flush`). A ~400ms race expires on nearly every call. Carry the last ≤6 typed turns verbatim instead.
39. **`avoid` derived from `meera_forget`** (`decisions.md#self-layer`). It would resurrect the deleted term as an avoid topic. The column ships empty.

### 5.3 Safety, honesty, privacy

40. **Co-occurrence receipt detector without distance** (`receipt-verb-without-proximity`). It flagged "bhej diya resume ya bas helo bolne aaya h". A proximity window (`NEAR_WORDS=4`) and an infinitive rule fixed it. Both the false positive and the true positive are permanent corpus rows.
41. **Telegram surface returning the model's raw string** (`surface-bypasses-parse`). No honesty, no protocol extraction, `[gif:]` sent as literal text. Do not copy gates per adapter. Route every surface through one gated path.
42. **A second hand-assembled realtime prompt** (`age-tier-never-realtime`, `realtime-recall-never`). The minor romance-register refusal and FORGET_DECISION never reached the live lane, and recall was provably always "". Pass values in. Never read a ref in the same tick.
43. **"She can judge what's safe to share"** (`decisions.md#structural-disclosure`). This falsifies Petronio's rule. Disclosure permission is negotiated with the discloser, never inferred.
44. **The pitch anchor as a voice filter** (`decisions.md#speech-stack`). The shipped lane measured 212-214Hz against a 266Hz anchor used to reject Azure at 210Hz. Hz is not identity.
45. **Bold-stripping regex** (`bold-eats-words`). `\*[^*\n]{1,80}\*` deleted the emphasised word and kept the asterisks, which espeak then read aloud. A content-preservation control is required.
46. **A sound gate proven by silence** (`sound-gate-proved-by-silence`). The assertion could not fail. Break the mechanism inside the same run.
47. **A subset check that is green by construction** (`subset-check-is-green-by-construction`). Three bugs in a 20-line guard, all toward passing. Test guards by breaking them.

### 5.4 Voice, realtime, vision (in the `@main` rejected.md)

48. **Backchannel while the user speaks** (`backchannel`). The mic hold is digital silence, which ends the user's turn. Unprotected, it fills pauses and makes her slower. Built instead: an acknowledgement about 420ms after the user stops.
49. **A synthesised listening "mm"** (`murmur-timbre`). The owner's ear rejected it as not her voice.
50. **Azure TTS coral** (`azure-tts`). Better on every metric (15/15 Hindi, 255ms, $0.0029) and rejected by ear as "not human, not Indian". Accent authenticity must be a first-class axis.
51. **Speaker-ID for a second person** (`speaker-id`). Not built. A 95% gate turns a 100%-reliable floor into a 95%-reliable one for the owner.
52. **Faster frame cadence** (`frame-cadence`). 600→240ms moved the wake by 0ms on 18/18 stops and cost +21% vision spend.
53. **Lowering HOLD_SCROLL_MIN / loosening wake dedupe** (`hold-scroll-floor`, `wake-dedupe`). No effect. The "duplicates" were literally the same screen (MAD 0.00-0.77).
54. **Swapping the live model off gemini-3.1-flash-live** (`live-model-swap`). The alternatives reject video and miss the 600ms barge-in watchdog.
55. **Shortening `silenceDurationMs`** (`silence-tuning`). 150/300/500 within 50ms of each other.
56. **Asking the paid TTS lane to stream** (`openrouter-streaming`). `stream:true` is a no-op.
57. **gpt-realtime-2.1-mini for the call lane** (`realtime-azure`). Rejected on register (41-53 words/turn, 14s turns) and voice (137-192Hz). No continuous frame channel. Handshake traps: use `/openai/v1/realtime?api-version=preview&model=<deployment>` with the nested GA session schema, and set `NODE_USE_ENV_PROXY=1` for WebSockets behind a proxy.
58. **gpt-5.6-luna/terra for vision; terra as a cost saving; Sarvam/Indic specialists; open-weight models; Claude on Azure credits** (`Model candidates evaluated and dropped`). Read-part-assert-the-rest. Only 1.14× cheaper. Formal-Devanagari tuning. Register defection 63-99.8%. Billing goes to the card, not credits.
59. **Rotating immediately on `goAway`** (`goaway-immediate-rotate`). Flushes playback mid-word. Wait for `speakingUntil`, capped.
60. **Reading `goAway.timeLeft` as ms** (`duration-is-seconds`). A 1000× error. Parse units at the boundary and name them (`leftMs`).
61. **Device TTS suspected for "dash dash"** (`device-says-arrow-not-dash`). espeak reads "—" as a pause, but reads "→" as "right arrow" and `**` as "asterisk". Rank suspects by engine behaviour, not by how salient a symbol is.
62. **A voice cache keyed without voice identity** (`cache-outlives-the-voice`). Old-voice clips kept playing after the switch. Put identity in every persistent cache key.
63. **Choosing the TTS vendor per phrase** (`engine-per-phrase`). Two different women inside one reply. Decide once per utterance.
64. **A fixed 1400ms fuse on a variable upstream** (`fixed-fuse-on-a-variable-upstream`). Total outage on a slow night. Use a two-phase fuse. Use walk-local dead-family sets, not the global cooldown map.
65. **Folding 5xx into deterministic aborts** (`isquota-only-folding`). A single 502 aborted a 9-key pool. One classifier, one ladder.

### 5.5 Process, gates, CI, infra

66. **Gates that live nowhere** (`gates-that-live-nowhere`, `-2`). Documented gates ran from a scratchpad against a frozen persona snapshot, and the eval suite never ran in CI because the gitignored config was missing. Re-bundle from source on every run, and use `write-config.mjs --stub`.
67. **A workflow `if:` on `secrets`** (`startup-failure-is-invisible`). Invalid file, 0 jobs, 15 red runs, 9 days without a deploy, and the reporter died with it. Lint the YAML and gate via `needs.*.outputs`.
68. **Logged but unindexed** (`logged-but-unindexed`). 16 rejected.md entries had no graph node. `--check` now validates both directions.
69. **An engine-bundle check nobody called** (`engine-bundle-check-uncalled`). Anything that checks the system must itself be checked by the system.
70. **The Vercel CLI inferring the project from the directory name** (`ci-deploy-unpinned-project`). It deployed to the wrong project and the probe passed on the stale bundle. Pin the org and project IDs, and assert the live bundle equals this build.
71. **Seven agents in one working tree** (`shared-tree-concurrency`). One `git reset --hard` wiped the others. Forbid git state mutation, commit per slice, use a worktree per agent.
72. **A live clock in a byte-identity gate, or in a size gate** (`live-clock-in-a-byte-identity-gate`, `calendar-lottery-ceiling`). A minute tick flaked the gate. Date-dependent cores failed about a quarter of dates. An unpinned clock hid that a cap was already exceeded (30,190 vs 30,000). Pin every ambient input to the argmax date.
73. **Piping verify-release into `tail`** (`evidence-only-patience` recurrence). The pipe's exit code masked a red tree, which was pushed. The verdict is the exit code.
74. **Comparing a fully-judged arm to a partially-judged arm; counting rows instead of distinct items** (2026-08-15 entries). "Flat" was an artifact. 288 rows held 72 distinct texts. Denominators must be complete, and diversity is a distinct-hash count.
75. **"Measured but not felt"** (`measured-but-not-felt`). A 1.65× luminance-sd gain was invisible on a phone. Gate presence against the flat baseline, with the rejected artifact as an in-run negative control.
76. **Flags taken at the top and released in a callee** (`busy-held-across-recursion`). One burst killed the chat until reload. Take once and release in a `finally`.
77. **Typing tick, and a receive cue per bubble** (`typing-tick`, `receive-per-bubble`). A state that ticks nags, and three cues in 4 seconds is an alarm. Refusals are written as data (`REFUSED` table).

Visual and CSS rejections (`peek-fade-divided-by-a-number`, `the-slide-that-never-ran`, `animation-implicit-end`, `minifier-eats-runtime-tokens`, `shadow-only-bubble-lift`, `chrome-behind-negative-z`, `too-dark-passes-every-floor`, `dark-theme-day-paintings-are-mud`, `the-hand-drawn-piece-set`, `glyph-in-a-live-status-line`) carry a general lesson for the design-system workstream: verify animation events and computed end states in a real browser, gate shapes separately from text contrast, and gate a veil in both directions.

---

## 6. Concepts and laws worth importing

| concept | statement (as in source) | Taxila translation |
|---|---|---|
| Structure beats instruction | "If a property is decidable from the bytes, decide it on the bytes." Prompt arm leaked 57-98%, predicate 0/31,122. | Child safety, disclosure to parents, PII and "never ask for address" all become predicates on the output and WHERE clauses on retrieval. |
| The prompt sets a ceiling; the model decides how close you get | `charm-grok`, `realtime-azure` | Choose gpt-5.6 and gpt-realtime-2.1 configs by blind judged batteries and deterministic register axes (words/turn, question rate). |
| Shapes, never lines | `recited-prompt` | Lesson plans, examples and praise stored as telegraphic notes. The teacher improvises the words. |
| Position is mechanism | `prompt-position` | Exactly two appended-last rules, chosen by measurement. |
| Pull-only memory | `moment.ts:23-27`; T5/T6 "never raise unprompted"; 0 unprompted raises in 60 | The teacher brings up past struggles only when the child's turn pulls them, or the occasion is real (a test today). |
| Record vs stance | `stance-lapses-record-stays`, `inner.ts` Thread/carry | "The child was frustrated with fractions last week" is a permanent cited record. The teacher's stance about it lapses. |
| Feeling fused with cause | `inner.ts` header | The teacher's mood is one sentence including its cause, decays in about 9h, and is never about the child's attendance or speed (G1). |
| G1 content vs usage test | AFFECT-CONTINUITY §3.1 via `inner.ts` | A feature is CONTENT if it is computable from one utterance with no outside timestamp. Otherwise it is USAGE. Usage may not set the teacher's feelings. Taxila may use usage for the LEARNER model, but must never render it as guilt or debt. |
| Coarse bands, never numbers | `renderRelSnapshot`, `renderTexture` (no digits) | Render learner mastery as bands ("shaky / getting it / solid"), never "0.34". |
| Citation law | `vy_fact` CHECK, writer window, entailment audit | Every learning-profile claim ("learns best with stories") cites the episodes that evidence it, and needs ≥2-3 of them across distinct days. |
| Observation vs pattern | `observation.ts` header | One cited instance = observation (recall). A generalization = pattern (≥2 cites to write, ≥3 support across ≥2 days to use). |
| Growth is a biography, not a mood | `selfarc.ts`, CHECK span ≥42d | Progress claims to parents need cited evidence spanning weeks. They are non-affective. |
| Told ledger (anti-join) | `vy_agent_life_told` | Never re-explain an analogy as new. "I didn't tell you this one na" is honest. |
| Agent-scoped vs relationship-scoped | `life-per-person` | Teacher persona facts are global. What a child told is per child. |
| A channel is a transport | SPEC-CONTINUITY §2 | Voice lesson, text chat and the generated module are one relationship and one compiler. |
| A slot is wired when a real prompt contains its bytes | `selflayer-delivery-gate` | Lane-parity tests with real rows, plus per-slot byte telemetry. |
| Anything that checks the system is checked by the system | `engine-bundle-check-uncalled` family | Negative controls in-run, CI runs the evals, workflows are linted. |
| Fail toward safety | `gatesFor`, the clock's MAX(local, server) | Under uncertainty: minor tier, stricter clock, disclose. |
| Absence is the safe default (and the danger) | `compiler.ts` gating; `selfbundle-never-set` | Additive seams render 0 bytes when absent. Assert presence where it is expected. |
| A sliced block is a lie | `applyDropOrder`, activity block | Drop whole facts, least-important last. Never truncate mid-fact. |
| Reason-contingent proactivity | `proactive-reason-contingent` | A lesson reminder fires on an event (a parent-set schedule, a promised follow-up), never on the child's absence. Streak-loss mechanics are forbidden (minor gates). |
| Gamify without the lever | `gamify-without-the-lever`, `the-human-game-boundary` | Fixed-magnitude celebration of real progress. No variable reward. Cards appear only inside game/module mode. The teacher speaks about milestones in her own words. |
| Pre-registration | `swap-prereg-1`, feltmem manifest | Freeze the acceptance rule and fixture hash before a judged run. Arms are builds. |
| Judges are unreliable on code-switched affect | `judge-qualification`, `ground-truth-ceiling` | Measure judge self-agreement first. Prefer deterministic axes and human raters for child speech. |
| One writer per mirror set | `one-voice-switch` | When a constant must live in several runtimes, give it one script that writes all of them and verifies the result. |
| Identity in cache keys | `cache-outlives-the-voice` | Generated module and audio caches are keyed by model, voice and persona version. |
| Lifecycle matrix as code | `lifecycle-matrix-as-code` (10 events × 5 contexts, each with a carrier and a written why) | Lesson-state transitions (module start/end, call drop, parent join) each name their carrier, or the build fails. |
| Spend on delivery, never on attempt / outcomes not attempts | `spent-before-delivered`, `error-marked-done` | Budgets for frames, tokens and consolidation. Resume state counts only produced outputs. |

---

## 7. Mapping notes for Taxila (where the transfer is not mechanical)

1. **The age-tier default must invert.** `@main` maps `unverified → adult gates` by owner decision (`adult-default`, a pre-launch exception for an 18+ product). Taxila's users are all 6-15, so `gatesFor` should return the frozen minor gates for every learner, and the adult path should not exist in the learner app. Parents are a separate principal type. SPEC §9.4 records the DPDP under-18 regime as "verifiable parental consent + no-addictive-design". The repo's own safety-reg research (`docs/research/safety-reg.md@main`, not read here) should be checked. A legal review of DPDP §9 "behavioural monitoring" against learning-profile discovery is needed and is not covered by this repo.
2. **The crisis floor must be re-authored.** `CRISIS_LINES` is mandatory per AgentModule and invariant-gated. Meera ships Tele-MANAS 14416 / iCall / KIRAN. A child product also needs child-specific escalation (e.g. Childline 1098, plus parent notification policy). That is a Taxila decision, not something in this repo. The provenance allowlist mechanism (`PUBLISHED_HELPLINES`) guarantees the gate never eats a helpline.
3. **Covert comprehension has no direct asset, but has parts.** Turn-level signals: `moment.ts` shapes (add confusion, guessing and overconfidence), `repeat.ts` reception (short replies to a topic), `texture.ts` counting, and the G1 content/usage boundary. Session-level: `vy_observation` and `vy_pattern`, with citations. Acceptance: a feltmem-style pre-registered judged battery whose probes have a "best-teacher-move" rubric written before any reply exists. Note `prosody-reads-hearing-not-feeling`: categorical speech-emotion recognition is kept out of `@main` until a classifier clears ≥0.6 macro-F1 on naturalistic Hinglish.
4. **Learning-profile discovery maps onto the self-layer machinery.** Use observation (one citation) → pattern (support ≥3 across ≥2 days, stored generated column) → arc (≥3 cites spanning ≥42 days, non-affective note). Render coarse bands in the TAIL, behind a minimum n gate (like `TEXTURE_N_TURNS_FLOOR=40`).
5. **Generated modules map onto the activity seam.** Each module instance is an `ActivityState`. Its `facts` (shapelint-clean, present tense) go in T15. `nameable` feeds the honesty allowlist, so the teacher may name the numbers and words the module actually shows. `record` is what goes to memory in the past tense. Mid-call updates go through a `noteVerdict`-like seam (stale/hold/send) with a settled clause. Taxila's generation pipeline itself (HTML/JS, images) is not in this repo.
6. **gpt-5.6 deployment traps measured here:** use `max_completion_tokens`; temperature must be 1; set `reasoning_effort` explicitly (`"none"` for judging, otherwise expect empty completions); expect 3-5% truncation at small budgets; expect a register drift toward "generic supportive"; expect protocol-tag under-use (luna 0/144).
7. **gpt-realtime-2.1 traps measured here** (on -mini): 24kHz input; frames only as `conversation.item.create`, which accumulate in history; a VAD-onset barge-in signal; long turns (41-53 words) that a teacher persona must actively shorten; the handshake URL/schema trap; `NODE_USE_ENV_PROXY=1`. The realtime lane has **no output gate**, so honesty has to come from input-side fences (`RELATIONALOS.md` hazard #2) plus the laundering predicate on what reaches memory.
8. **Group AI and parent visibility = the disclosure predicate.** "What may the teacher tell the parent about what the child said?" is the same problem as A→B disclosure. Model it as a WHERE clause over episode participants, plus explicit grants, plus negative-affect tags that never bridge. Never as a persona rule.

---

## 8. Gaps and unread

- **Not read at `@main`:** `src/voice/liveCall.ts` and `evals/echosim/**` (the audio floor; covered in companion-tech.md); `src/components/useCallEngine.ts`, `Chat.tsx`, `src/state/*` (the surface; `game.ts`/`callHistory.ts` were cited only through architecture.md and decisions.md); `api/speech.js`, `api/live-token.js`, `api/search.js`, `api/_room.js`, `api/_gkeys.js`, `api/tg.js`, `api/discord.js`, `api/whatsapp.js` internals; `src/engine/{timeline,herNow,storyCatalog,photoCatalog,memeCatalog,sky,theme,chess/*,ttt/*,wyr/*,callInvite,gameInvite}.ts` beyond export lists.
- **Docs only skimmed:** `docs/SPEC.md` §10-§14, `SPEC-GAMES.md`, `SPEC-SELF-LAYER.md` §2-§11, `HONESTY.md` §2-§4, `TIME.md` §1-§2, §4-§7, `CONSOLIDATION.md` past the stoplist seam, `docs/research/*` (AFFECT-CONTINUITY read to §0 only; MEMORY-FIELD-SURVEY, cognitive-arch, memory-arch and safety-reg not opened), `docs/paper/*`, `docs/audit/*`, `PRODUCT-SUPERIORITY.md`, `GENERALIZATION-AUDIT.md`.
- **`context/measurements.md` read selectively** (about 60% of entries, prioritised for engine and model relevance). Voice- and UI-specific entries (sound-browser, movevoice-timing, ui-perf-audit, photo-drop, release, sweep) were not read in full. `context/decisions.md` was read in full. `context/rejected.md` was read in full.
- **Evals not read beyond headers:** `evals/honesty/cases.mjs` (393 checks), `evals/consolidation/run.mjs`, `evals/continuity/*`, `evals/recall/*`, `evals/feltmem/fixtures/*` (probe texts and rubrics), `evals/dbattery/*`.
- **Other branches** (`claude/ai-companion-app-rkt1lv`, gurukul-*, vyakti, codex/*, voice-cloning) are out of this segment's scope. companion-tech.md and gurukul.md cover them.
- **Nothing was executed.** No gates were run against the exported tree, so every "shipped-measured" label rests on the repo's own logged numbers, cited above.

---

## Verification

Adversarial pass over 63 claims, `html-portfolio@origin/main` = `3a92179` (resolved; all 107 cited paths exist at that ref). Method: `git show 3a92179:<path>`, import graph per file, read of the cited functions and constants. **Nothing was executed**, so "implemented" means real code is present and reads correct, not that gates were run. Taxila already has `server/db.js` (Neon HTTP plus pg Pool), `scripts/migrate.mjs`, `scripts/context.mjs`, `server/compiler/*`, `server/azure.js` and `server/router.js`, which changes several verdicts.

### Cross-cutting findings

1. **Third-party model calls break the Azure-only directive.** `api/memory.js` extraction uses `grok-4-1-fast-reasoning` on Azure (a non-OpenAI Foundry model), with OpenRouter `google/gemini-3.1-flash-lite` as fallback. `api/consolidate.js` audits with `google/gemini-3.6-flash`. The forget hook uses `gemini-3.6-flash`. `api/_embed.js` falls back to OpenRouter. `api/_lanes.js` lane order is `gemini-free, openrouter, azure`. Every adopted piece must be re-pointed at Azure OpenAI deployments (gpt-5.6, text-embedding-3-small).
2. **`api/_db.js`, `_embed.js` and `_azure.js` import `api/_config.js`** (the gitignored secrets file). Not read. Secret present at `api/_config.js` (gitignored, absent from the tree at that ref). Taxila must read env only.
3. **The "pure" engine is not a leaf.** `compiler.ts` imports 14 sibling modules and, through `agents/registry`, `persona.ts` (which imports `@capacitor/core` and three catalogs). `shapelint.ts` imports `compiler` and `persona`, while `relstate.ts` imports `shapelint` (a cycle). `brain.ts` (1971 lines) holds `parseBubbles` and `stripTextingDashes` and imports `state/store`, `callHistory` and `@anthropic-ai/sdk`. `diag.ts` imports `telemetry.ts`, which imports Capacitor. Only `moment`, `repeat`, `activity`, `greeting`, `hangup`, `router`, `characters/*` and `away` (needs `timeline`) are true leaves.
4. **Companion register versus Taxila's child-safety floor.** `localHeart.ts` crisis and AI-identity replies are scripted romance-adjacent Hinglish ("itna pyaar se", heart emoji). The `persona.ts` sections FEELING KNOWN and RITUALS are companion mechanics. The `inner.ts` charter assumes an adult companion. None of that can be copied under Taxila's "no romance/companion register" rule.
5. **Identity is the device uuid** throughout (`meera_log.device_id`). Taxila's law is an authenticated child id, so every schema and API item needs its key re-based.
6. **Memory is split across Supabase REST and Neon.** `meera_*` tables are the legacy lane and `vy_*` tables are the new one. `memory.js` is 4415 lines and mixes both, so ops must be extracted rather than lifted.
7. **Vercel cron versus Azure.** `consolidate-sweep` rides a Vercel `crons` entry. Taxila's Vercel project is paused, so the scheduler must become an Azure Container Apps job or an in-process timer.

### Verdict table

Columns: Impl = real code present (not a stub); Port = runs in Taxila's stack with only mechanical edits; Q = quality 1-5 of the artifact for Taxila's purposes.

| ID | Exists | Impl | Port | Q | Claimed to corrected | Evidence and entanglement |
|---|---|---|---|---|---|---|
| A01 | yes | yes | no | 4 | adapt to adapt | `compiler.ts` 1300 lines. `TAIL_ORDER` (L1072) T1..T16, `mp.*` and T10 last, byte map `sections` (L450), FNV-1a `hashCore` (L1236) are all real. Imports 14 modules plus persona and Capacitor. Take the architecture, not the file. Taxila has `server/compiler/compile.js` (282 lines). |
| A02 | yes | yes | yes | 3 | copy to copy (code only) | `applyDropOrder` L1208 is 25 lines, correct, never slices, keeps "never". **It is not called by `compile()`**. Only `check-prompt-budget.mjs:581` uses it, on synthetic blocks. The claim implies live use, which is false. |
| A03 | yes | yes | no | 3 | copy to adapt | `shapelint.ts` 140 lines. Constants are real (14 words, regex). Imports `persona` (SEARCH/FORGET_DECISION) and `compiler`. The first-person regex is Meera/Hinglish (`main\|mera\|maine`). The sentence-shape rule is a blunt heuristic. Needs a Taxila word list and a calibration set. |
| A04 | yes | yes | partly | 4 | copy to adapt | 620-line script plus 294-line fixtures, bundled via `.budget-entry.ts`. The three-layer idea is sound. Caps (64000 SYSTEM_MAX, 24000 tail) are Meera's `api/chat.js`. Fixtures are Meera lanes. |
| A06 | yes | yes | no | 3 | adapt to adapt | `AgentModule` (types.ts L59-82) is real, but only two agents exist. `AgentRegister` is `{script: latin\|deva, honorificSystem}`. `types.ts` imports persona types. Rewrite for subject teachers. |
| A07 | yes | yes | yes | 3 | adapt to adapt | `characters/types.ts` has 28 typed fields (claim says 29). `maya.ts` and `kabir.ts` are leaf files. The shared core is not clean: `leak.mjs` pins **95 residual Maya-isms** in core prose (`RATCHET=95`, 2026-08-24). Personality-as-sheet is only partly achieved. |
| A08 | yes | yes | no | 3 | adapt to idea | `persona.ts` 99 KB. Sections exist (READ THIS FIRST L131, FEELING KNOWN L257, RITUALS L263, ONLY SAY WHAT'S TRUE L268, NEVER MANIPULATE L283, NOTICING L326). Companion-register content. Imports Capacitor and catalogs. Take the structural rules only (diagram-of-shape, honesty, no manipulation, repair). Do not copy prose. |
| A10 | yes | yes | partly | 3 | adapt to adapt | `AFTERCALL_DIRECTIVE` L521, `FOLLOWUP_DIRECTIVE` L530, `CALL_OPEN_DIRECTIVE` L639 exist. The idle-nudge removal is real (4 grep hits for idle/nudge). Text is Meera-voiced, so re-author as shapes. |
| A11 | yes | yes | no | 3 | copy to adapt | Needs the Maya/Kabir sheets and the compiled engine bundle. The ratchet is real but proves a leak backlog of 95, not a solved problem. Reuse as the pattern for teacher-to-teacher leak checks. |
| A12 | yes | yes | partly | 4 | adapt to adapt | Runner/data split is real (`buildLanes`, `safetyFloorChecks` L165, `meeraFullChecks` L271). Runs over `listAgents()`. Helplines and persona assertions are Meera's. Re-author the floor for children (1098, 14416). |
| A13 | yes | yes | partly | 3 | adapt to adapt | `parseBubbles` and `stripTextingDashes` live inside `brain.ts` (L489, L496), not a standalone module. The 24-case suite `evals/parse.mjs` is real. Markers are chat-companion ([gif], [voicenote], [react]). Extract and re-key to `[module:]`. |
| A14 | yes | yes | partly | 3 | adapt to adapt | `honesty.ts` 2206 lines, genuine. Families: `findActionable` L206, `findOutOfBandReceipts`, `findPastSendClaims`, `findFalseAttributions`, `guardReply` L1976. Most families target chat-companion receipts and channel promises. `PUBLISHED_HELPLINES` and `APP_ADDRESSES` are Meera's. Keep identifiers and false-attribution only. |
| A15 | yes | yes | no | 3 | copy to adapt | `createStreamGuard` L2130, `HOLD_CAP=240`. Used only in `brain.ts:1670` on the **client-side cascade call lane**. The realtime audio lane has no text output to guard, so the claimed "realtime cascade/TTS lanes" target only covers a cascade design. |
| A17 | yes | yes | partly | 3 | copy to adapt | `openCommitments` L539, `herCommitments` L678 (cap 3, TTL 7d). Coupled to `HistoryLike` and Meera term rules. T16 lives in `compiler.ts`. Needs a lesson-aware commitment vocabulary. |
| A18 | yes | yes | yes | 4 | adapt to adapt | `gatesFor` (clock.ts L73), frozen `MINOR_HARD_GATES`, `saferTier` verified. **`unverified` maps to ADULT gates by owner decision** (L55-61). For Taxila every learner must resolve to minor. Compiler `sections.T2=0,T3=0,T4=0` and the CORE override are real. `AGE_TIER_SAFETY_OVERRIDE` text is Meera's. |
| A19 | yes | yes | partly | 3 | adapt to adapt | MAX(local,server) at clock.ts L249 confirmed. Thresholds adult 3h/2h and minor 2h/1h do not suit 30-60 min lessons, so re-tune. Imports Capacitor and `telemetry`. `STORE_KEY=meera.clock.v1`. `api/clock.js` imports `memory.js`. Migration 005 also creates `vy_model`/`vy_gate_run`, not only the clock. |
| A20 | yes | yes | no | 2 | adapt to idea | `localHeart.ts`: regex keyword crisis list and scripted romance-adjacent Hinglish bubbles, emoji, English plus roman Hinglish only (no Devanagari). Violates Taxila's own "write shapes not lines" law and the no-companion-register rule. Keep only the idea "critical branches pre-empt and need no cloud". Rewrite from scratch. |
| A21 | yes | yes | yes | 4 | copy to copy | `nonLaunderedNodes` L1626 plus `contentTokens` are exported pure functions (about 40 lines). Lexical heuristic, not proof. Needs the `channel:"call"` field on turns. Extract from the 4415-line file. |
| A22 | yes | yes | yes | 3 | copy to copy | `greeting.ts` has no imports and `SITTING_GAP_MS=4h`, `greetOnce` L201. `hangup.ts` is 66 lines with an English/Hinglish pattern list. Greeting regex is Hinglish. Low-risk, low-value. |
| A23 | yes | yes | no | 4 | adapt to adapt | Checks verified: `vy_fact` citation CHECK (002 L98), `vy_embedding halfvec(1536)` plus "No HNSW" comment (004), `vy_episode` log-span. Keys on `device_id` and legacy `meera_log`. Re-base on a child id. Taxila has `001_core.sql`. Choose tables, not a wholesale lift. |
| A25 | yes | yes | yes | 3 | adapt to adapt | CHECK `cardinality(citations)>=3`, `span_days>=42`, observation `>=1` confirmed in 011. Good for "growth arc" claims. `vy_agent_life` and told-ledger are companion-specific. |
| A26 | yes | yes | partly | 4 | copy to adapt | 012 spine plus legs, 7 indexes. Keyed by `device_id`/`agent_id` with a `meera_` prefix. Rename and re-key. Taxila has `002_turn_seq_unique.sql` already. |
| A27 | yes | yes | no | 3 | adapt to adapt | `memory.js` ops at L142/647/1533/1652/2036/3555/4059/4348. Monolith of 4415 lines. Imports `_gkeys`, `_engine.gen`, `_lanes`, `episodes`. Uses Gemini/OpenRouter. Extract pieces, do not port the file. |
| A28 | yes | yes | yes | 4 | adapt to adapt | `recallTokens` L289 and `RECALL_SHORT` L255 verified. Hinglish stoplist. Add school vocabulary and Devanagari subject terms. |
| A29 | yes | yes | yes | 5 | copy to copy | `rrfFuse` L329, `RRF_K=60`, `RRF_SLOTS=8`, deterministic tie-break. About 20 lines, pure. |
| A30 | yes | yes | yes | 3 | copy to copy | `provenanceAge` L361, `FIRST_TOLD_MIN_GAP_DAYS=6`. Needs `ageLabel` (same file) and `Date.now`. Marginal value for a tutor. |
| A31 | yes | yes | no | 3 | adapt to adapt | Input starvation and node filtering are real (L1652+, the "LOAD-BEARING INVARIANT" comment). **Model is `grok-4-1-fast-reasoning` on Azure (a Marketplace model) with an OpenRouter fallback**, both forbidden by the Azure-only directive. Reasoning tokens are billed and hidden (307,788 in the source battery). Re-point at gpt-5.6 with `reasoning_effort` set. |
| A32 | yes | partly | no | 3 | adapt to adapt | 2926 lines. Verified: `AUDIT_SAMPLE_RATE=0.05`, `AUDIT_REFUTATION_HALT=0.02`, `AUDIT_MIN_N=5`, `TRUST_MAX_DELTA_PER_DAY=0.05`, need_p decay. Audit judge is `google/gemini-3.6-flash` via OpenRouter (forbidden, and the second-family property needs a non-OpenAI Azure-allowed substitute or an accepted loss of independence). Imports the engine bundle and `config/decay.json`. Companion dims (kin, rituals, trust/repair). The writer-window and "same evidence may not move trust twice" claims were not traced. |
| A33 | yes | yes | no | 4 | copy to adapt | Hourly Vercel cron (`vercel.json` `0 * * * *`), `CONSOLIDATE_SWEEP_LIVE`, `CONSOLIDATE_KILL`, `MAX_TOKENS 400_000`, `TIME_BUDGET_MS 200_000`, lease table `meera_consolidate_lease`: all verified. Cron and env semantics are Vercel. Replace the scheduler with an Azure Container Apps job. |
| A34 | yes | yes | partly | 4 | copy to adapt | `EMBED_DIM=1536`, `text-embedding-3-small`, exact scan, cost counters. Contains an OpenRouter fallback (forbidden) and imports `_config.js`. Strip both. |
| A35 | yes | yes | no | 3 | adapt to adapt | `opForget` L3555 (about 500 lines) and `PERSON_TABLES` L2277 verified. The query-expansion hook uses `gemini-3.6-flash` (forbidden). Table manifest is Meera's, but the manifest pattern is the value. Needs parent-authenticated erasure. |
| A36 | yes | yes | partly | 4 | copy to adapt | `export.js` 171 lines, depends on `memory.js` `PERSON_TABLES`. Needs a parent-principal auth, not a device. |
| A37 | yes | yes | n/a | 3 | copy to skip | Duplicate: Taxila already has `server/db.js` (Neon HTTP plus pg Pool) and `scripts/migrate.mjs`. `_db.js` imports `_config.js` and has no transactions. |
| A38 | yes | yes | partly | 3 | adapt to adapt | `relstate.ts` 1192 lines, imports `shapelint` (circular via compiler). The hysteresis and rate-limit ideas are portable. Honorific shift (tu/tum/aap) and rupture are companion constructs. Keep `clampTrustDelta`, `bandTrust`, replay snapshot. |
| A39 | yes | yes | yes | 4 | adapt to adapt | `moment.ts` 233 lines, zero imports. Eight shapes are companion (conflict, teasing...). Add confused, frustrated, guessing, bored, proud. Hinglish regexes need Devanagari and child spellings. |
| A40 | yes | yes | partly | 3 | adapt to idea | 747 lines, imports `diag`. Decay constants are reusable. The charter (never initiates, no accumulating mood, no UI) is adult-companion policy and may contradict a tutor's needs. Re-derive the charter for Taxila. |
| A41 | yes | yes | no | 3 | adapt to idea | The taste table is Meera's authored opinions. Only the pull-only discipline and T1-T4 rules transfer. |
| A42 | yes | yes | partly | 4 | copy to adapt | `away.ts` 110 lines. Imports `istParts` from `./timeline` (not in the claim), so it drags another file. |
| A43 | yes | yes | yes | 4 | adapt to adapt | `repeat.ts` 179 lines, zero imports, constants confirmed (`SHORT_REPLY_WORDS=3`, `RAISED_BUDGET=400`). A good covert-disengagement seed. Voice transcripts are not text-chat length, so re-calibrate the 3-word rule. |
| A45 | yes | yes | partly | 3 | adapt to adapt | `selfarc.ts` 811 lines imports `relstate` and `shapelint`. DB constraints verified. Dimensions are companion. Re-define dims as subject mastery and learning style. |
| A46 | yes | yes | partly | 3 | adapt to adapt | `life.ts` imports `storyCatalog`. A teacher's told-ledger of explanations is a different thing from invented life beats. Reuse the anti-join only. |
| A47 | yes | yes | partly | 3 | adapt to adapt | `observation.ts` imports `../../api/memory.js` (a server file from the engine). Untangle. |
| A48 | yes | yes | partly | 3 | adapt to adapt | `india.ts` 478 lines. Festival and currency logic fine. Rituals are companion check-ins. Kin terms need age-appropriate review. |
| A51 | yes | yes | yes | 4 | adapt to adapt | `activity.ts` 183 lines, zero imports, `ACTIVITY_BUDGET=420`. `ActivityKind` is a closed enum of chess/watch/wyr/ttt, so generalize to module ids. |
| A53 | yes | yes | partly | 3 | adapt to adapt | Imports `state/store` and `memory`. Conflicts with Taxila's age-tier rule `engagementMechanics:false` for minors, so gamification must be non-addictive by design (DPDP no-addictive-design). |
| A54 | yes | yes | no | 3 | adapt to idea | `burst.ts` 966 lines, text-chat timing. Taxila is voice-first, so the transfer is mostly the principle of deriving waits from the user's own rhythm. |
| A55 | yes | yes | no | 3 | adapt to idea | `router.ts` zero imports. `Lane = chat\|vision\|extraction` verified (no "live"). Taxila has `server/router.js` and `server/azure.js`, and Azure-only means few candidates. Take the eligibility-as-data idea. |
| A56 | yes | yes | partly | 4 | copy to adapt | `classifyUpstream` L76, `TRANSIENT_BUDGET=3`, `TRANSIENT_DEADLINE_MS=4000`, backoff 350-700 verified. Lane constants (`gemini-free`, `openrouter`) must be dropped. Copy lines 58-205 only. |
| A57 | yes | yes | no | 3 | adapt to idea | Vercel handler tied to Gemini/OpenRouter/Azure pools. Keep the SYSTEM_MAX-mirrored-and-asserted rule and trace-on-truncate. |
| A58 | yes | yes | n/a | 3 | adapt to idea | 112 lines, imports `_config.js`. Taxila already has `server/azure.js`. |
| A59 | yes | yes | partly | 4 | adapt to adapt | `disclosurePredicate` L169, `NEGATIVE_AFFECT_TAGS` L62, `RECIPIENT_SET_SQL`. SQL bound to `vy_episode_participant`. Strong match for the parent-visibility question. |
| A60 | yes | yes | partly | 4 | copy to adapt | `MEERA_AGENT_ID` hard-coded, table lists in L118/L142. Adapt per teacher or subject. |
| A61 | yes | yes | no | 3 | adapt to idea | `_surface.js` 1340 lines, Telegram-specific, imports the engine bundle and `memory.js`. Only the "one reply site runs the gate" rule transfers. |
| A62 | yes | yes | no | 3 | copy to idea | Exists to let Vercel functions import TS. Taxila's server is plain JS with `shared/contracts.ts`. Keep the `--check` staleness idea only. |
| A63 | yes | yes | partly | 4 | copy to adapt | `_trace.js`: `MAX_STR=64`, 30/90 day retention, flags (`slot_zero`, `tail_over>24000`, `core_over>64000`, `fallback`) verified. `trace.js` is POST-only with no read shape. Thresholds are Meera's. Taxila needs a parent-facing read path elsewhere. |
| A64 | yes | yes | no | 3 | copy to adapt | `telemetry.ts` 1057 lines imports Capacitor. Contract and `docs/TELEMETRY.md` are the valuable part. |
| A65 | yes | yes | no | 3 | copy to adapt | `diag.ts` is 104 lines but imports `telemetry`. Not a leaf as claimed. |
| A66 | yes | yes | n/a | 3 | copy to skip | Taxila already has `scripts/context.mjs`, `context/graph.json` and `merge-inbox.mjs`. |
| A67 | yes | yes | partly | 3 | copy to adapt | `verify-release.mjs` 219 lines. Calls gates Taxila lacks (`check-motion`, `check-contrast`, `check-copy`, `check-citations`). Taxila's gate is `tsc -b && vite build && npm test`. Reuse the harness pattern. |
| A68 | yes | yes | n/a | 2 | copy to skip | Taxila has no `.github/workflows` (deploys via ACR and `deploy-azure.mjs`). Revisit only if CI is added. |
| A69 | yes | yes | partly | 4 | adapt to adapt | Real manifest with sha256 per file plus a combined hash, `prereg.mjs`, `gate.mjs` checks (L61-64, L300-309). Also needs `arms.mjs`, `judge.mjs`, `compile.mjs` (not in the claim). Fixtures are adult companion dyads. The 741-assertion count was not reproduced. |
| A70 | yes | yes | partly | 3 | adapt to adapt | `run.mjs` 1532 lines, `cases.mjs` 496 lines. Permanent-negatives pattern is good. Cases are Meera. Counts (393 checks) not reproduced. |
| A71 | yes | yes | n/a | 4 | adapt to adapt | Eight laws verified by headings (L17-83). Law 6 (her own past) is companion-only. |
| A72 | yes | yes | n/a | 3 | adapt to idea | `SPEC.md` 86 KB plus four 64-77 KB proposals. Reference reading, not a copy target. |
| A73 | yes | yes | no | 3 | copy to adapt | `parity.mjs` and `lanes/run.mjs` assert Meera's lanes. Taxila's lanes (realtime voice versus text) differ, so re-author the matrix. |

### Net

- **Copy as-is (small, pure):** A29 (rrfFuse), A21 (nonLaunderedNodes), A22 (greeting/hangup), A30, A02 (code only; note it is unused by the live compiler).
- **Skip (already in Taxila or not applicable):** A37, A66, A68.
- **Idea only:** A08, A20, A40, A41, A54, A55, A57, A58, A61, A62, A72.
- **Everything else: adapt**, and four items need model or scheduler substitution first (A31, A32, A33, A35) plus A34 and A56 for provider stripping.
- **Not verified here:** claimed counts (741 assertions, 393 honesty checks, 83 fixtures), the A32 writer-window and trust-once claims, and any "measured" label. These rest on the source repo's own logs.
