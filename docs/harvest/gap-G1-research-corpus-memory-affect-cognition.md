# Gap G1: the research corpus behind memory, affect and cognition

**Scope.** This report covers 15 html-portfolio research files that no harvest report and no row of
`INHERITANCE-MAP.md` cited. Before this pass they appeared only in the "unread" lists of `hp-main-engine.md` and
`meera-repo.md`. The files explain the design reasoning behind the memory, relational-state and affect code that the
map already lists. The **rejections** that matter most are recorded in these files, more than in `context/rejected.md`.
Supplements target map §2.5 relational-os, §2.6 emotional-lens, §2.7 memory-graph and §5.3 learner modelling.
The appended addendum in `INHERITANCE-MAP.md` holds the corrected and added rows.

**Ref.** Every path below is under `docs/research/` at `@vy` (= `origin/claude/vyakti-cloning-platform-aq05n4@ebe16cc0`).
`git diff` shows each file is byte-identical at `@gp` and at `@main`. The shallow clone shows all of them arriving in
`c56f4a2f` (2026-08-22). That commit is the clone's graft point, not the authoring date, so the dates quoted below are
the dates each file gives itself.

**Read in full (git show, line by line).** `RESEARCH.md` (40.7 KB, Phase A synthesis, 2026-08-13),
`cognitive-arch.md` (35 KB), `memory-arch.md` (35 KB), `multimodal-state.md` (30 KB), `swap-test.md` (30 KB),
`repo-audit.md` (28 KB), `MEMORY-FIELD-SURVEY.md` (64.6 KB, 2026-08-19) and `MEMORY-FIELD-SURVEY-RAW.md` (31 KB),
`AFFECT-CONTINUITY-RAW.md` (30 KB, 2026-08-19), `design/PROPOSAL-A-graph.md` (67 KB), `design/PROPOSAL-B-events.md`
(69 KB), `design/PROPOSAL-C-minimal.md` (64 KB), `design/PROPOSAL-D-multimodal.md` (77 KB), `humansand.md` (19 KB,
2026-08-15).

**Read in part.** `oss-landscape-2026.md` (114 KB, 2026-08-21). I read the memory, companion-framework, competitor-UX,
confabulation, verification and honesty sections in full. I read the voice, chess-UX, chat-UX and games sections only
as far as their verdicts.

**Cross-checked against.** The Phase B outcome in `context/decisions.md#spec-c-minimal@main` and
`docs/SPEC.md §0.2-0.3@main`, which hold the judges' scores and rulings. Also
`context/measurements.md#affect-recitation@main`, and Taxila's own `context/decisions.md`, `context/rejected.md`,
`db/migrations/001_core.sql` and `server/learner/affect.js`. I ran `git grep` at `@main` and `@vy` to check whether
three of the survey's "adopts" were ever built.

**No secrets.** None of these files contains a key. None was opened from `api/_config.js`.

**Most important caveat.** Every file in this corpus was written for an *adult companion* (Meera/Vyakti). None of
them measures a child, a learner or a teacher. Each transfer to Taxila below is labelled as one of three kinds:
- **[direct]** the mechanism carries over unchanged;
- **[analogue]** the same shape, but the construct is different;
- **[inference]** this report's own reasoning; nothing in the corpus tests it.

---

## 0. Bottom line

1. **C-minimal won Phase B narrowly, and the losers still shaped the build.** The scores were C 150.5, A-graph 144.5,
   D-multimodal 138 and B-events 137, from 3 adversarial judges × 4 proposals
   (`decisions.md#spec-c-minimal@main`, `SPEC.md` header@main). C won on buildability (9/8/8) and latency/cost
   (8/9/8). C had four fatal flaws, and each was fixed with a graft from a losing proposal. The shipped `vy_*` schema
   is therefore a hybrid: A's citation array plus CHECK and its two-mechanism truth rule; B's write-window validation,
   entailment audit, legacy quarantine and its three-way meaning of "rebuildable"; D's forget by log-range
   intersection and its replay-rebuild of relationship state.
2. **Eight design ideas were rejected in adjudication** (`SPEC.md §0.3@main`). Each has a measured or structural
   reason, and none appears in the map's §3 list. They are: deferred constraint triggers on Neon HTTP; a lexical
   confabulation tripwire; HNSW indexing; a model reciting the statutory disclosure; dropping the raw transcript as
   ground truth; synthetic legacy citations; on-device speech-emotion recognition (SER) in the call path; and a raw-text
   fingerprint target of ≤65%. Details are in §3.
3. **The memory field survey rejects twelve popular ideas**, each tested against seven house laws
   (`MEMORY-FIELD-SURVEY.md §10`). They include self-editing memory blocks, git-backed memory files, an LLM DELETE on
   contradiction, retroactive rewriting of old memories, decay used as forgetting, anticipatory "sleep-time" compute,
   community summaries, LLM-scored relevance and importance, and LoCoMo as a target. Taxila's memory design
   inherits all twelve.
4. **Three highest-value adopts, two of them not built at `@main` or `@vy` (grep).** A1: a forget-matching hook at
   mutation time. Deterministic matching scores **0% on cross-lingual** deletion in arXiv:2606.15903 (one author,
   385 cases). Hinglish children need this hook. A2: the fourth bi-temporal timestamp. A3: RRF fusion plus a
   co-citation hop. **A3 shipped** (`api/memory.js@main` L1028-1124). A1 and A2 were not found by grep.
5. **The map's "≥2 citations / ≥3 support / ≥2 days = learns best with stories" row is wrong for Taxila.** Those
   bars were built for Baldwin-style dyadic if-then patterns in a companion. Nothing in the corpus validates them.
   Taxila's own `psych-claim-tiers` decision puts any per-child format effect on the never-per-child list (78/217/487
   delayed comparisons per arm). The bar can at most unlock a teaching knob, never a claim about the child. See §7, C1.
6. **The research reaches the same conclusion as Taxila's no-stored-affect decision from the other side.** Gratch &
   Marsella's EMA holds that emotion is "a continuously updated affective summary" of a cited situation, recomputed
   rather than stored (`AFFECT-CONTINUITY-RAW.md` E15). The best naturalistic SER system reaches macro-F1 **0.4316**
   over 8 classes (E1). Every Indian-language SER figure comes from acted speech (E4). This makes the map's §2.6 "owner
   decision on what affect is ever stored" stale: Taxila's NM-3 list already decides it. See §7, C3.
7. **Several corpus designs would breach Taxila's binding constraints if copied.**
   - Affect tags with `source:'voice'` from SER, and an importance score weighted by emotional intensity
     (`multimodal-state.md §5`; `RESEARCH.md §3.8`; PROPOSAL-D). These conflict with `ct-no-voice-emotion-inference`.
   - The `vy_episode.affect_tags` column (`db/migrations/002_episodes_facts.sql@main` L24), which the map's "cited
     memory schema" row would import unless it is dropped.
   - Persisted `trust` scalars (every proposal, and Taxila's own `rel_state.trust`). These conflict with the NM-3
     never-persist list in `learner-legal-mode-ratchet`.
8. **One measured licence for affect state in the prompt.** Short structured tags (`affect: warm-teasing` shape) leaked
   **0/42 vs 0/42** in a blind, counterbalanced test, n=84, deterministic scoring, rule-of-three upper bound ≤7.1% per
   turn (`measurements.md#affect-recitation@main`, 2026-08-13). This permits a telegraphic VIBE row. It does not
   permit sentences, and the n≥300 leak check is still owed.
9. **Cognitive science gives Taxila four mechanisms for the learner model that no harvest row carries.** All of them
   are [inference] for children:
   - Event-boundary encoding (Zacks 2007): put recaps at segment boundaries.
   - Arousal narrows memory to gist (LaBar & Cabeza 2006): do not grade peripheral details taught while a child was
     upset or excited.
   - Retrieval makes a memory labile (Nader 2000): correct a misconception right after the child states it.
   - Need-probability forgetting (Anderson & Schooler 1991 / ACT-R): rank which past explanation to recall.
10. **The corpus has nothing on learner spacing, the testing effect or interleaved practice.** Its "decay" always
    means the *agent's* retrieval priority. Taxila's FSRS-6/BKT-R choices come from Taxila's own learner research,
    not from this inheritance. Read decay-as-salience, delete-as-promise as compatible with FSRS retrievability, not
    opposed to it. See §5.4.

---

## 1. What each file is, and how much to trust it

| file | date / method | trust | what it is for Taxila |
|---|---|---|---|
| `RESEARCH.md` | 2026-08-13; synthesis of 10 track files with load-bearing claims independently verified; corrections listed in §7 | high on what it flags as VERIFIED; it withdraws its own claims honestly (§7) | The best one-file index of what the field knows about memory and identity, and the source of the "commoditizing vs durable" table (§2) |
| `cognitive-arch.md` | WebSearch/WebFetch; two PDFs failed and are flagged | medium; §8 (SOAR/ACT-R/CLARION) is secondary-sourced and says so | The cognitive-science mechanisms (§5 below) |
| `memory-arch.md` | Phase A sweep; superseded on mechanism detail by the field survey, except its benchmark-reliability section | medium; one ANCHOR misstatement is corrected in `RESEARCH.md §7` | Benchmark distrust (LoCoMo) and the WE/I question |
| `MEMORY-FIELD-SURVEY.md` + `-RAW` | 2026-08-19; source code read for Graphiti; paper full texts for Mem0, A-MEM, HippoRAG 2; each system judged ADOPT/ADAPT/REJECT against 7 laws | high; it states conflicts of interest for every audit it uses | Memory adopts and rejects (§3, §6.3) |
| `AFFECT-CONTINUITY-RAW.md` | 2026-08-19; [REPO] facts cited to file and line, [EXT] facts to a URL with the corpus named | high on [REPO] rows; [EXT] marks the corpus type every time | SER limits, the affect architecture, the manipulation literature (§6.2) |
| `multimodal-state.md` | Phase A; flags the numbers it could not cross-check (Livia, Memory Bear, voice cloning) | medium | Streaming state is not durable; the shape of the episodic record |
| `swap-test.md` | 2026-08-13; protocol with power arithmetic | high on method; external effect-size prior: none exists | Equivalence testing for tutor/model/lane changes (§8) |
| `repo-audit.md` | 2026-08-13; code read in full | high | Why authored and structural state beats generated state |
| `PROPOSAL-A/B/C/D` | 2026-08-13; four assigned priors | they are proposals; their numbers are targets or estimates unless they cite `measurements.md` | Options the authors considered and rejected (§2) |
| `oss-landscape-2026.md` | 2026-08-21; 8 sweep agents + 8 adversarial verifiers; tags `verified-in-source` / `reported` / `inferred` | mixed; the verify pass itself withdraws three attributions | Field mechanisms, plus several recommendations that break house laws (§3.3) |
| `humansand.md` | 2026-08-15; company teardown | high on facts, low relevance | Nothing transferable (§8) |

---

## 2. Phase B: four architectures, the judging, and why C won

### 2.1 The four priors

| proposal | thesis | own claimed strength | own pre-registered reversal |
|---|---|---|---|
| **A, graph-first** (`design/PROPOSAL-A-graph.md`) | Extend `meera_nodes/edges` into a bi-temporal relationship graph (Zep four-timestamp edges) with typed WE-episodes and a compiler in front | Temporal truth; contradiction without lying; DB-enforced citation spine (`cite_or_authored` CHECK) | D2 stays >90% across M3-M5 while D1 bands pass → the program claim is falsified (§12.1) |
| **B, event-sourcing** (`design/PROPOSAL-B-events.md`) | A new append-only `vk_events` replaces `meera_log`; all state is a rebuildable projection with citations | Forget, swap control, anti-confabulation and audit reduce to one property: state = f(log, authored data, code version) | D2 moves <2pp across three successive milestones → the claim narrows to "gate-and-adapter" (§10 Q1) |
| **C, minimal-diff** (`design/PROPOSAL-C-minimal.md`) | The repo's proven shape (authored state + deterministic retrieval + structural guarantees) *is* the architecture; add the fewest moving parts | Only shape with a measured portability win (`taste-consistency` 27%→63%, n=480); ANCHOR shows scaffold novelty does not buy identity; team is tiny | Zero candidates pass the adapter gate within the cost envelope, or D2 moves <10pp after compiler+adapter+WE-store (§10 Q1) |
| **D, multimodal-first** (`design/PROPOSAL-D-multimodal.md`) | The episode, carrying how something was said and what was watched, is the atom; a text turn is the degenerate case | Identity dies first in the live lanes; streaming context is not durable; symbolic affect tags are the one swap-portable representation | D2 within 10 points of the M1 baseline at M5 with D3 passing → keep the record, kill the centrality claim (§12) |

### 2.2 The verdict

The verdict is in `decisions.md#spec-c-minimal@main` and `SPEC.md` header and §0@main. **C won with 150.5, A had
144.5, D 138 and B 137**: 3 judges × 4 proposals, adversarial, 12 judgments. C led on buildability (9/8/8) and
latency/cost (8/9/8), "the two axes that decide whether a two-person unfunded team ships". So **graph-first was not
chosen** because its added machinery (the four-timestamp quadruple everywhere, a lexical integrity sweep, synthetic
legacy citations) buys extractor-error forensics a two-person team can live without. **Event-sourced was not chosen**
because replacing `meera_log` adds risk across every system keyed to it for zero product gain, and its HNSW index
starves small tenants. **Multimodal-first was not chosen** because it cuts the live-lane persona by more than 50% and
puts on-device SER into the call path. Both of those are quality-for-latency trades the owner's standing instruction
forbids. C's own four fatal flaws were then fixed by name with grafts (`SPEC.md §0.2@main`):

| C's fatal flaw | what broke | fix (graft) |
|---|---|---|
| Same-day memory gap | Nightly-only durable writes: a fact told at lunch is not recallable that evening | In-turn *provisional* episodes and facts, finalised nightly (B/D session pass) |
| Budget arithmetic | C's caps summed to 72,000 chars against SYSTEM_MAX 64,000, so the outer guard would eat the end, which is the silent-truncation failure | CORE 40k + TAIL 24k = 64k exactly; CI asserts the cap sum and that the undroppable set sits under the caps |
| Deferred constraint triggers on Neon SQL-over-HTTP | No multi-statement transactions over HTTP, so C's central guarantee could not execute on the chosen database | Array `citations bigint[]` + CHECK + GIN index (A), writer window validation (B), sampled entailment audit (B); FK join tables **rejected** |
| Item-scope forget could leave derived rows orphaned | Summary-term matching misses "kaam stress" vs "office pressure" | Forget deletes episodes by **log-range intersection** (D), then cascades by citation join; term matching is only an extra net |

### 2.3 What each losing proposal contributed

These are the ideas that survived into `SPEC.md`.
- **From A:** the two-mechanism rule ("belief changed → invalidate, row kept; user said forget → hard-delete the whole
  lineage; bi-temporal history LOSES to honest forget"). Also the array-plus-CHECK citation, the zero-orphan nightly
  sweep, bounded backfill (top-K=200 episodes per device, ≈$0.25 per device) and staged D2 targets.
- **From B:** "rebuildable" defined as three separable guarantees: *deletable* (pure SQL citation join), *auditable*
  (a stored derivation record: model, prompt hash, input span) and *re-derivable* (different but equally cited, passes
  the invariants). Also the write-window rule (a citation outside `[input_from, input_to]` is confabulation by
  construction), the 5% entailment audit (100% for relationship-state transitions and patterns; refutation above 2%
  halts the job), **legacy quarantine** instead of synthetic citations, and owner review before a candidate taste row
  enters the authored table.
- **From D:** forget by log-range intersection; relationship state rebuilt by replaying surviving events after a
  forget ("register/trust can legitimately regress after a forget, that is honesty"); the sham arm as a relabel only;
  the engine refusing engagement mechanics for `minor` even if flags are misconfigured.

**What this means for Taxila [direct].** Taxila's `rel_state` + `rel_event` + `memory(superseded_by)` already sits in
the C-plus-grafts family. The grafts that matter most for a child product are three: log-range forget (a parent's
deletion must reach derived lesson notes), legacy quarantine (never cite a row whose evidence trail is synthetic), and
the minor-tier refusal that holds even when flags are wrong.

---

## 3. Rejections harvested (what was tried or proposed, and what broke)

IDs are local to this report: R-G1-nn. "Phase" names the stage where the rejection was made.

### 3.1 Phase B adjudication (`SPEC.md §0.2-0.3@main`, proposals at `@vy`)

| id | rejected | what broke / why | Taxila consequence |
|---|---|---|---|
| R-G1-01 | Model recites the statutory AI disclosure (A §9.4, D §9) | Instruction ≠ emission: `charm-luna` 0/144 media tags against an explicit instruction; `prompt-position` 0/8 mid-brief. A CA SB 243 disclosure carrying $1,000 per violation cannot be probabilistic. **All three judges ruled against A and D** | Any legally required notice (parent consent, "this is an AI", session break) is rendered by the **app**, never generated by the tutor. The tutor gets a machine-readable flag so it never contradicts the notice [direct] |
| R-G1-02 | Lexical-anchor confabulation sweep (A §4.3.5: ≥1 content-word overlap) | Retracts correct Hinglish paraphrase ("kaam stress" vs "office pressure"), or pushes the extractor to copy words, which fights the shape-lint | Map §3.3 #76 already covers this. Add that the **replacement is a second-family entailment audit** |
| R-G1-03 | FK join tables + deferred constraint triggers (C) | Do not execute over Neon SQL-HTTP | Map #80 covers it; the fix is array + CHECK + GIN |
| R-G1-04 | `vk_events` replacing and then dropping `meera_log` (B) | Too much at risk: forget scopes, telemetry purge and client prune are keyed to the log; zero product gain | Keep Taxila's `turn` table as untouched ground truth; derived tables cite turn-id ranges |
| R-G1-05 | Global HNSW (B, D) | Post-filtered ANN over a multi-tenant index returns few or zero rows for small corpora (10³-10⁴ rows per dyad); "index the filter, scan the vectors" | Per-child memory is tiny: use an exact scan under a `child_id` filter. Map #75 covers it |
| R-G1-06 | Live-lane persona cut from ~48k chars to ~5.5k tokens (D) | A >50% persona cut on the lane where `realtime-azure` measured register collapse, with no charm-equivalence gate | Any cut to the realtime teacher brief needs a paired n≥300 equivalence run first |
| R-G1-07 | On-device SER in the call path (D M4) | CPU contention on a mid-range Android during a call can undo the millisecond-measured audio floor; EchoMind predicts a small model lands in fallback territory | Doubly barred for Taxila (`ct-no-voice-emotion-inference`). The v0 the judges kept, "transcript + timing features only", is exactly Taxila's `voice-features-longitudinal` shape |
| R-G1-08 | Synthetic "legacy episode" citations (A, C) | Decorative citations on the rows most likely to be confidently wrong; the CHECK and the sweep pass while proving nothing | Any import of pre-Taxila data (a school roster, a pilot export) enters **quarantined**: never citable, over-deleted on any plausible forget, retired when a cited re-derivation lands |
| R-G1-09 | A raw-text D2 fingerprint target ≤65% (A, B, D) | Machine fingerprinting of raw text is 97.1%-solved offense (arXiv:2502.12150, ICML 2025); the target is a pre-registered failure | When Taxila compares tutors, lanes or models, measure *relational/pedagogic features*, never raw-text indistinguishability |
| R-G1-10 | `unverified` age → most-restricted *adult* tier (A) | Under DPDP the safe direction is minor-safe defaults (B, D) | Matches Taxila fact 1 in the map; the corpus is a second independent source |
| R-G1-11 | Full four-timestamp bi-temporality everywhere (A, B) vs none (D) | Earns its keep on one table only (beliefs); A's own degrade path was taken up front; `retracted_at` covers the one real need | See A2 in §6.3: the field survey later found one missing timestamp was a real gap |
| R-G1-12 | Trust decaying on absence toward a 0.35 floor (D §6) | Not adopted (C skeleton); D's own reason for the floor: "she forgot she trusts you reads as identity loss" | For a child, absence must never lower any relational or mastery display (map §5.3 "no decay by absence") [analogue] |

### 3.2 The memory field survey (`MEMORY-FIELD-SURVEY.md §3-§10`, 2026-08-19)

The seven laws every verdict was checked against (`§2.2`): L1 citations DB-enforced; L2 forget is a hard delete
reaching every derived row; L3 retrieval is pull-only; L4 nothing sentence-shaped in a prompt; L5 position is
mechanism, with the appended-last set **capped at exactly two**; L6 Neon SQL-HTTP runs one statement per request;
L7 Hinglish-first, and register is the product.

| id | rejected | law broken / evidence |
|---|---|---|
| R-G1-13 | Self-editing memory blocks (Letta core memory, LangMem procedural-as-editable-prompt) | L4: block prose loads every turn, the same shape measured at 4/5 verbatim recitation and 13/96 register defection. L1: an agent rewriting its identity text leaves no citation trail. "The most attractive idea in the field; the most expensive one for this product" |
| R-G1-14 | Letta MemFS (git-backed memory files) | L2: "Deleted files remain recoverable through git history" (Letta docs, verbatim). A soft delete with extra steps |
| R-G1-15 | Mem0 four-operation LLM update, specifically DELETE | A model physically removing a belief because it looks contradicted is unrecoverable and uncited. Mem0g itself marks rows invalid instead, which is evidence Mem0 found the same problem |
| R-G1-16 | A-MEM "memory evolution" (new memories rewrite old notes) | L1: after a rewrite the citations no longer support the text. The correct form is a new cited row + `superseded_by` |
| R-G1-17 | Decay-as-forgetting (MemoryBank, FadeMem, Weibull family) | "A downweighted record is still present and still retrievable under the right query, precisely the failure mode a user invoking a right-to-be-forgotten would care about" (Always-On survey §4.3.2, verbatim). Decay is salience; deletion is a promise |
| R-G1-18 | Sleep-time compute, the *anticipation* half | Push-shaped memory puts L3 in the model's hands. The paper itself says efficacy correlates with query predictability; companion chat is the least predictable workload. The *consolidation* half is adopted |
| R-G1-19 | Community/cluster summaries (Graphiti, GraphRAG) | L4 (LLM prose) and L1 (uncitable) |
| R-G1-20 | HippoRAG 2's LLM recognition-memory filter in the retrieval path | Decides relevance before the turn's pull signal is honoured; does not fit the 250 ms budget. The one-hop-over-citations idea is kept |
| R-G1-21 | Self-rated 1-10 importance (Generative Agents) | Documented inflation; replaced by **anchored comparison against fixed exemplar episodes** |
| R-G1-22 | LoCoMo as a target | 99/1,540 answer-key errors (6.4%); ceiling ~93.6%; the judge accepts 62.81% of vague-but-adjacent answers while catching specific errors ~89% of the time. The bias points away from what the product needs. The auditor sells a competing benchmark |
| R-G1-23 | Any vendor benchmark number as a decision input | Two audits found **10-point** (Zep's re-run of Mem0's harness, 65.99%→75.14%) and **19.6-point** (open-harness Mem0 LongMemEval 93.4% published → 73.8% reproduced) swings from the evaluation stack. Both auditors sell competitors |
| R-G1-24 | Auto-generated schemas (Cognee) | Every constraint in the schema is a designed refusal; a generated schema has none |

**What this means for Taxila [direct].** Each of these is a reason to *not* let the tutor rewrite its notes about a
child. The tutor model must not edit the learner model directly. It proposes, code checks citations, and a human
(parent or teacher) disposes where a claim reaches a report. That is already map §5.3 "extraction proposes; a human
disposes", and R-G1-13 and R-G1-16 are its evidence.

### 3.3 Recommendations in `oss-landscape-2026.md` that break house laws (do not adopt)

The 2026-08-21 sweep proposed several mechanisms that look good on their own. Against the laws above they are wrong:

| id | proposal in `oss-landscape-2026.md` | why not |
|---|---|---|
| R-G1-25 | A new `PROACTIVE_DECISION` rule appended last (Kindroid section, "Top actions") | L5 caps the appended-last set at two. Taxila's `learner-brief-and-tail-order` already puts TURN SHAPE last; a third last-rule dilutes the mechanism. The verifier itself labels the placement "this team's inference" |
| R-G1-26 | An appended-last "cite a memory-node id before any shared-history claim" directive (confabulation section) | Same L5 problem. The verify pass marks it "unmeasured". The safe form already exists: code-side citation of what was retrieved, plus an entailment gate |
| R-G1-27 | Mem0-style ADD/UPDATE/DELETE classification by one LLM call (LangMem top-action) | R-G1-15 |
| R-G1-28 | Attributing the kind/stated-by-user schema to "MemGuard type-isolation" | The verify pass found the citation **mischaracterised**: A-MemGuard is consensus-based multi-path anomaly detection. The schema idea stands on its own merits, unattributed |
| R-G1-29 | Open-LLM-VTuber "inner thoughts → parsed affect/intent drives timing and memory writes" | Verify pass: **not substantiated**; the feature only displays a reasoning model's chain of thought. If built, it is a novel design to evaluate, not an import |
| R-G1-30 | Chai "stated strategy" of paywalls timed after attachment forms | Verify pass: no source; the real pattern was an abrupt blanket geo-paywall. Keep only the Talkie (re-gating) and Character.AI lessons |

### 3.4 Withdrawn science (`RESEARCH.md §7`)

| id | withdrawn claim | why |
|---|---|---|
| R-G1-31 | "Reconsolidation makes honest correction-on-retrieval cognitively correct; silent substitution is the trust violation" (`cognitive-arch.md §3`) | The neuroscience premise is accurate: retrieval makes memory labile (Nader 2000; Lee/Nader/Schiller 2017). The design conclusion was the sweep's own inference, and the cited source says nothing about AI or trust. The no-silent-substitution rule stands on product grounds only |
| R-G1-32 | ZifaMem as precedent for WE/I memory typing | Its "companion self-state" is a transient per-turn value in one submodule, not a persistent memory type; all its stored types are about the user. **No surveyed system implements the WE/I distinction** |
| R-G1-33 | ANCHOR trajectory recall "barely above chance" | 44.4% is well above the 25% floor. At-chance language belongs to *user-state* recall (0.214-0.250) |
| R-G1-34 | Mem0 stores "agent facts as first-class" | Marketing language never verified against the schema. The 2026 docs show episodic/semantic types declared but "never read anywhere" (`oss-landscape-2026.md` memory section) |

---

## 4. Measured claims, with n, method and date

Internal = measured in html-portfolio. External = literature, with its verification status as the corpus records it.

### 4.1 Internal measurements cited by the corpus

| claim | n / method | date | source |
|---|---|---|---|
| Authored taste table: self-agreement 13/48→30/48 (27%→63%); register defects 13/96→0/32; 100/100 offline reproducible; 0 false fires in 60 | 480 live turns | 2026-08 | `repo-audit.md §0, §1b`; `RESEARCH.md §1.2` |
| Short structured affect tags in the tail: hard leak 0/42 tagged vs 0/42 control (≤7.1% per turn upper bound) | 84 turns, blind, counterbalanced, deterministic scoring, `gemini-3.6-flash` | 2026-08-13 | `measurements.md#affect-recitation@main` (the M0 probe PROPOSAL-D §12.1 required) |
| Example quotes recited 4/5→0 after removal; taste sentences read out verbatim twice, 8 turns apart; telegraphic rewrite 1/32 and 0/32 | n=84 | 2026-08 | `MEMORY-FIELD-SURVEY-RAW.md §10` |
| Judge noise: 13.6pp spread on byte-identical input; any judged claim at n<300 is noise; 61% slot-A position bias | repeated runs on identical input | 2026-08-11 | `swap-test.md` header |
| Behavioural disclosure control leaks 57-98%; a SQL predicate leaks zero | gate0-structural | 2026-08 | `MEMORY-FIELD-SURVEY.md Q4.1` |
| Person-filtered halfvec exact scan p50 40 ms; embed call p50 ~305 ms | n=15 | 2026-08-13 | `MEMORY-FIELD-SURVEY-RAW.md §10` (also map §4.3) |
| Production 2026-08-18: `vy_rel_state` 0 rows, `vy_rel_event` 0, `vy_episode` 2, against 2,358 log rows over 41 devices; trust stays at the 0.3 default forever | full SQL census | 2026-08-18 | `AFFECT-CONTINUITY-RAW.md` B (`never-scheduled`, `prodgap-audit`) |
| `charm-grok` 38-2 on a byte-identical prompt (personhood 34-4, warmth 35-3, humour 31-2; 36.1 vs 20.5 words per turn) | 48 conversations, 96 blind counterbalanced judgments | 2026-08 | `RESEARCH.md §1.1`; `repo-audit.md §0` |
| Live floor: 1.4-1.5 s; text turn with no VAD wait 720 ms (prefill of a 48k instruction) | measured | 2026-08 | `AFFECT-CONTINUITY-RAW.md` B |
| Live-lane `enableAffectiveDialog` → 1007 close; dropping `languageCode` gave no consistent prosodic gain | n=5 per arm | 2026-08 | `AFFECT-CONTINUITY-RAW.md` A12 |
| Azure TTS won every measured axis (Hindi 15/15 vs 11/15, 255 ms, $0.0029) and lost by ear ("not human and not Indian") | owner ear test | 2026-08 | `multimodal-state.md §2` (`voice-ears`) |
| Phase B scores C 150.5 / A 144.5 / D 138 / B 137 | 3 judges × 4 proposals | 2026-08-13 | `decisions.md#spec-c-minimal@main` |
| Co-citation hop + RRF shipped (A3) | code at `api/memory.js@main` L1028-1124 | (after 2026-08-19) | `git grep cocite` this pass |

### 4.2 External, verified in the corpus or read from a primary source

| claim | n / method | source in corpus |
|---|---|---|
| Interspeech 2025 naturalistic SER: best macro-F1 **0.4316** (8 classes; baseline 0.3293); dimensional CCC best 0.6076 | MSP-Podcast, 324+ h spontaneous speech, ≥5 annotators per utterance, ~120 teams | `AFFECT-CONTINUITY-RAW.md` E1 |
| Valence is the weak axis; teacher model valence CCC 0.676 is state of the art | MSP-Podcast | E2 |
| On-device is not the blocker: Wav2Small 72K params / 120 KB ONNX for A/D/V | audEERING | E3 |
| Indian SER 58.83% Hindi / 61.75% Urdu / 69.75% Telugu / 45.51% Kannada, **all acted studio corpora**; BhavVani ~13 h / 8,734 utterances; **no published SER on Indian conversational Hinglish over a phone** | cross-corpus | E4 |
| EchoMind: only 3/12 speech-LMs exceed 60% perceiving 39 vocal attributes from raw audio; giving the correct cue *as text* lifts GPT-4o-Audio empathy 3.34→4.42/5 | 12 models | `multimodal-state.md §1.1` |
| VR agent with bracketed SER tag: rapport t(29)=3.98, 28/30 (93.3%) preferred the tagged agent | n=30 within-subjects | `multimodal-state.md §1.1` (voice SER: barred for Taxila) |
| KEEM fact-emotion-cause tuples: 10-30% lower perplexity; contradiction rate ~5% vs ~30% | KMSC (Korean multi-session chat); via search summary, PDF not re-verified | `multimodal-state.md §1.2` |
| De Freitas et al., *Emotional Manipulation by AI Companions*: 37% of 1,200 real farewells use one of six tactics; manipulative farewells raise post-goodbye engagement up to **14×**, driven by reactance-anger and curiosity, not enjoyment; they also raise churn intent and negative word of mouth | audit 1,200 farewells; preregistered n=3,300 | `AFFECT-CONTINUITY-RAW.md` E20 |
| De Freitas et al., Replika identity discontinuity: negative posts per day 22.9→140.9 (d=1.16, 12,793 posts); coldness → identity discontinuity η²=0.34; offering revert after a real change cut mourning (d=0.44) but *raised* it when nothing changed (d=0.40) | Studies 1-4, n=101/120/3,784 users/320, IRB, partly preregistered | `swap-test.md §1.1` |
| Surge blind audit GPT-4o vs GPT-5: 48% vs 43%, 9% tie | 850 conversations, 490 evaluators | `swap-test.md §1.2` |
| Machine fingerprinting: 97.1% 5-way attribution, robust to paraphrase; LLMmap 8 queries >95% over 42 versions | ICML 2025; USENIX Sec 2025 | `swap-test.md §1.4` |
| Persona prompt moves human "judged human" 21-23% → 73% | Jones & Bergen, preregistered | `swap-test.md §1.5` |
| ANCHOR: memory architecture does not move a model's persona-collapse pattern (Claude <1pt across 3 memory settings); trajectory recall 44.4% (chance 25%); user-state recall 0.214-0.250 | 2,008 conversations, 27 personas, 3 memory settings, 4 models; full text | `RESEARCH.md §1.1` (corrected) |
| Zep LongMemEval 71.2% vs 60.2% baseline (gpt-4o), latency −90%, ~1.6k vs 115k context tokens | vendor paper, full text | `memory-arch.md §2` |
| HippoRAG 2: QA F1 59.8 vs NV-Embed-v2 57.0; recall@5 78.2 vs 73.4 (fair, strong baseline, modest gain) | ICML 2025, full text | `MEMORY-FIELD-SURVEY.md §6.3` |
| LongMemEval: ~30% accuracy loss on scattered multi-session information; 500 questions, 5 abilities incl. abstention | ICLR 2025 | `MEMORY-FIELD-SURVEY.md §7.2` |
| BEAM/LIGHT: 1M-token windows degrade as dialogues lengthen; +3.50% to +12.69% over strong baselines | 100 conversations, 2,000 questions, up to 10M tokens | `MEMORY-FIELD-SURVEY.md §7.2` |
| Forget matching (arXiv:2606.15903): deterministic primitives 5% identifier-obfuscation, **0% cross-lingual**; inscribe-time LLM 0% intent-aware; **mutation-time hook 78-85% intent-aware, 91.7-93.2% overall, $0.17 per 385-case run, 2.3 s per case**, recall path unchanged | 13 configurations, 385 adversarial cases; one author; not Hinglish | `MEMORY-FIELD-SURVEY.md §7.4, Q5` |
| Always-On survey: of 435 works, Forget 66, Rollback 27; 96% of 2,050 real persistent-memory entries were system-created, not user-authorised | coded corpus; inner attributions not fetched | `MEMORY-FIELD-SURVEY-RAW.md §6` |
| ZifaMem: +11.4% pooled EI (95% CI 6.3-17.1), Gemini regressed under structured memory | n=208 paired, 4 backbones, 1 judge | `memory-arch.md §10` |
| Kindroid vs Nomi automatic recall 14/25 vs 23/25 dropped facts; Kindroid ~100% only with manually pinned "key memories" | reviewer head-to-head | `oss-landscape-2026.md` competitor fact-check |
| MiniCheck ≈ GPT-4 accuracy at ~400× lower cost; beats AlignScore on 6/10 datasets | verified-in-source | `oss-landscape-2026.md` honesty |

### 4.3 Flagged by the corpus itself as secondary or unverified (do not quote as measured)

- Livia: 70% storage cut, 92% vs 65% recall on important events vs general details (50 people, 4 weeks).
- Memory Bear's numbers.
- The cloned-voice familiarity study (n=47+47).
- RPEval's 5.81%.
- The 58.9% memory-hallucination share.
- Sleep-time compute's 5×/18%.
- Mem0's 92.5/94.4.
- The claim that "moderately relationship-seeking AI produces maximal attachment" (arXiv:2510.10079, never fetched).

Sources: `RESEARCH.md §7` tail; `multimodal-state.md` summary; `cognitive-arch.md` gaps.

---

## 5. Cognitive-science mechanisms, mapped onto Taxila's learner model

Citations are as the corpus gives them. "Verified" means `RESEARCH.md §7` confirmed the corpus's reading of the
source. The **Taxila use** column is this report's, and its label marks how far the transfer has been tested.

### 5.1 Memory structure and consolidation

| mechanism | citation (verification) | corpus design rule | Taxila use |
|---|---|---|---|
| Episodic / semantic / procedural split; procedural survives total declarative loss (H.M.) | Tulving 1972/1985; Squire; Scoville & Milner 1957 (taxonomy, secondary) | Three stores with different write, decay and retrieval rules | [analogue] Tutor's memory of a child: **episodic** = lesson episodes citing turn ranges; **semantic** = cited facts (interest, goal, misconception); **procedural** = how *this tutor teaches this child* (pace, hint style), which must be authored or gated, never self-written (CoALA: procedural writes are "significantly riskier") |
| CoALA four-store port to LLM agents | Sumers et al. arXiv:2309.02427 (full text; the Tulving lineage is resemblance, not citation) | Decide explicitly who triggers writes; agents run a fixed learning schedule | [direct] Taxila's consolidation schedule (per lesson, as an ACA job) is a declared schedule, not the model deciding when to learn |
| Event Segmentation Theory: boundaries at prediction-error spikes are **preferentially encoded and better remembered** | Zacks et al. 2007, Psych Bull (**VERIFIED**) | Segment episodes on topic, affect, goal or channel shift, not the clock; weight boundary-ness separately from intensity (design inference, flagged) | Two uses. (a) [analogue] Cut lesson episodes at activity changes (explain → game → check), not every N minutes. (b) [inference, learner-side] Boundaries are where **the child** encodes best, so place the one-line recap and the "what we just found out" at segment boundaries, and open the next segment with a retrieval cue. Untested in children in this corpus |
| Complementary Learning Systems: fast hippocampal episodes, slow **interleaved** neocortical consolidation; replay in original order causes interference | McClelland 1995; Kumaran, Hassabis & McClelland 2016 (**VERIFIED**; the "batched offline pass" is the corpus's own operationalisation) | Consolidation is an offline, batched, interleaved pass, never per-turn flat writes | [direct] Per-lesson consolidation job. [inference] CLS is about memory systems, not about interleaved *practice*; do not cite it as evidence for interleaving exercises |
| Consolidation without citation confabulates (Generative Agents reflection hallucination; importance inflation; stream bloat) | Park et al. 2023 (secondary failure reports) | Every derived fact cites source episodes; importance by anchored comparison | [direct] Every learner-model claim (misconception, format response) cites the attempts and turns it rests on. This is the "single most actionable, most evidenced constraint" in `cognitive-arch.md §9.3` |
| "Repetition is not evidence": five agents repeating a claim may be one stale note echoed | arXiv:2607.02579 (via survey) | `distinct_days ≥ 2` | [direct] Several "learns best with stories" signals inside one lesson count as one |
| Relational schemas: if-then interaction patterns, separate from facts about either party; self-in-relation paired with model-of-other | Baldwin 1992, 1997; Bowlby IWM (via Craik) | A third memory class, retrieved by relational context (moment shape), not keyword | [analogue] "When she misses twice she goes quiet → offer a choice" is a tutor-child if-then pattern. **But it is free text about the child**, which is NM-3 under `learner-legal-mode-ratchet`, so it cannot be persisted in M1. It can live only as session-scoped state or as an M3-only table. See §7, C5 |
| Need-probability forgetting: forgetting curves mirror how often the environment needs an item (power law); ACT-R activation = recency × frequency, plus spreading activation | Anderson & Schooler 1991; Schooler & Anderson (ACT-R) | Decay moves retrieval priority only (`need_p := recency_decay × ln(1+use_count)`); never deletes; identity kinds and safety rows exempt | [direct] Rank which past *explanation, story or analogy* to bring back for this child. [analogue] The same power-law family underlies FSRS retrievability, which Taxila already uses for the *child's* knowledge (`learner-bktr-ledger`). The two are separate ledgers |
| Transience is adaptive; total recall overfits and reads as surveillance | Richards & Frankland 2017, Neuron | Total recall is the wrong fidelity target; sign a forgetting profile | [analogue] A tutor that recalls every wrong answer a 7-year-old ever gave reads as a record-keeper. Old struggles fade from what the tutor *raises*; they stay in the BKT ledger, and the parent sees bands only |
| Emotional salience strengthens consolidation of **gist**, but arousal narrows attention so **peripheral detail is remembered worse** | LaBar & Cabeza 2006; McGaugh 2004 | Lower extraction confidence on high-arousal turns (untested hypothesis) | [inference, learner-side] Content taught while a child is upset, excited or anxious (a test-tomorrow panic, a win celebration) is likely to be retained as gist only. Re-check details later, and do not grade them in that session. This is consistent with `learner-safety-gate-first` freezing memory candidates when the gate fires |
| Reconsolidation: a retrieved memory becomes labile and editable | Nader, Schafe & LeDoux 2000; Lee/Nader/Schiller 2017 (premise accurate; the AI-trust conclusion **withdrawn**) | No silent substitution, stated on product grounds | [inference, learner-side] The moment a child states a misconception aloud is when the trace is editable. Correct it in the same turn or the next, with the contrast made explicit, rather than at lesson end. Pedagogy literature for this is not in the corpus; check Taxila's own `docs/research/learner/` before relying on it |
| Interactive parasociality; **attachment anxiety predicts more AI-companion use over time**, avoidance less | Hu et al. 2025 (IJIM 83); three-wave panel (T&F 2026) | Engagement optimisation deepens bonds with the most vulnerable users; log against, never optimise toward | [analogue, stronger for children] Taxila's engagement machine must not reward a child for more minutes. Children who seek the tutor anxiously are the exposed group. Fits `mk-warmth-not-intimacy` |
| SOAR chunking / repeated pattern → procedural | Laird; ACT-R (**secondary, weak**) | Patterns recurring across N episodes migrate to the authored or persona layer by owner review | [analogue] A teaching adaptation that keeps working for a child (say, number-line first) can be promoted to a per-child teaching knob (K tier). It is never written into the persona |

### 5.2 Affect continuity (`AFFECT-CONTINUITY-RAW.md` F)

| mechanism | citation | corpus reading | Taxila use |
|---|---|---|---|
| Appraisal theory: emotion = appraisal of an event against goals; core relational themes; sequential checks | Lazarus/Smith; Scherer CPM | — | [analogue] A child's "frustrated" read is about a task event (third miss, a hint refused), so record the event, never the feeling |
| EMA: appraisals are "a continuously updated affective summary" of the causal interpretation | Gratch & Marsella | "The emotion is a derived summary of a cited situation, recomputed, not a stored scalar with its own half-life." Reached independently from `inner.ts`'s production bug ("a feeling stored apart from its cause ends up on a different retention curve") | [direct] This is the theoretical basis for Taxila's no-stored-affect stance: `server/learner/affect.js` keeps counters in lesson state, deleted with it. Two independent derivations of one architecture |
| Emotion regulation: suppression costs more, impairs memory for the event and worsens relationships; reappraisal is healthier on every axis | Gross 2003 (PMC4168764) | "Feeling it, hiding it, keeping it" makes a companion that secretly keeps score | [analogue] The tutor must not "stay cool" over a child's rudeness while carrying it. Make the cheap path reappraisal (the moment matters less than the child) plus continuing, with no stored grievance. Unlike the companion, the tutor needs **no grievance record at all** |
| Accommodation; voice/loyalty vs exit/neglect | Rusbult (EVLN) | Telling accommodation from neglect needs the *record* to survive when the *stance* stands down | [analogue] For a tutor the asymmetry flips: the incident record a parent may need (a safeguarding incident row) survives, while the teaching stance resets every session |
| Repair attempts predict relationship survival; emotional repair beats cognitive | Gottman (observational, replication debated) | — | [analogue] After a bad moment, the **tutor** makes the repair attempt (a lighter task, a small win, warmth). It must never wait for the child to repair; `rupture-never-closes` is that failure |
| Manipulative farewells | De Freitas et al. HBS WP 26-005 (n=3,300) | NEVER MANIPULATE plus "nothing interior touches a goodbye" (G3) are exactly the two mechanisms 37% of the market fails | [direct, stronger for children] A session end must carry no guilt, FOMO, "leaving already?" or "I'll miss you". Gate it as a predicate on goodbye turns |
| Emotional mimicry and sycophancy studied against wellbeing | T&F 2026 (403, pointer only) | `persona.ts:380-384` tells her voice to "mirror THEIR emotional state turn by turn"; flagged as an open question | [inference] The tutor should **not** mirror a child's distress or panic turn by turn. It should co-regulate: steady, slower, warm. Do not inherit the mirror instruction |

### 5.3 What this means for covert comprehension detection [inference]

- **EST.** A comprehension check placed right after a segment boundary measures what the child encoded at the
  boundary. Placed mid-segment, it measures working memory.
- **LaBar & Cabeza.** A wrong answer on a detail taught during high arousal is weak evidence of non-comprehension.
  Weight it lower in BKT-R emissions, or defer the check.
- **Reconsolidation.** Elicit the child's own explanation ("explain it in your own words", already in map §5.3)
  *before* correcting. That brings out the misconception while it is editable.
- **EchoMind.** Perception is the bottleneck, not generation. If Taxila hands the tutor *text* cues
  (`answer_changed_without_new_info`, `asked_for_answer`, `three_minimal_replies`), the reply quality should rise.
  The cue must be computed in code from dialogue and timing, never from the voice's emotion.

### 5.4 What the corpus does NOT contain (spacing, retrieval practice)

Grep across all 15 files finds no treatment of learner-side spacing, the testing effect, retrieval practice,
desirable difficulty, interleaved practice, Leitner, SM-2 or FSRS. The single bridge is `cognitive-arch.md §5`: need
decay "the same way spaced-repetition intervals predict recall" (Anderson & Schooler). So:

- Taxila's FSRS-6 retrievability gate, BKT-R ledger and delayed-success mastery rule (`learner-bktr-ledger`) are
  **not** inherited from this corpus. They stand on Taxila's own learner research.
- The corpus's decay rules govern **the agent's memory of the user**. Its rejection of "decay-as-forgetting"
  (R-G1-17) is about deletion promises. It is **not** a rejection of retention modelling for the learner. Three
  separate things must stay separate in Taxila:
  1. Tutor-side retrieval priority (`need_p`-style; decays; never deletes).
  2. Child-side knowledge retention (FSRS R; decays with time; drives review).
  3. Displayed mastery (a pure fold; never lowered by absence).

---

## 6. Supplements to the target sections

### 6.1 §2.5 relational-os

**What the corpus adds.**
- **The relationship-state dimension table**, designed three times with consistent answers (A §6.2, B §6, C §6.2,
  D §6). Message count appears nowhere ("90 messages in one evening ≠ 90 across a month"). Every dimension moves only
  on cited evidence and can regress. "Stage" is at most a render-time projection.
- **What Taxila can keep [analogue].** Pace and preferred register as *state*. Session counts and lesson cadence as
  *derived* values. Stage as a render-only band. Code-switch baseline as a *measurement of the child's own turns*.
  Its direction under stress stays `unknown` until ≥3 stress episodes agree; the literature shows both retreat to L2
  and intensify in L1, and assuming "more Hindi = closer" is a named misread (A, B, C, D all agree).
- **Leakage of numeric state** (C §12.5). If a trust number leaks into speech, render coarse bands only, or move state
  out of the prompt entirely so it chooses *which* blocks compile and is never shown to the model. That fallback fits
  Taxila's NM-3 rule better than persisted scalars. See §7, C2.
- **WE-episodes** (`participation we|user|meera`) are the corpus's main new construct. For a tutor the "we" is
  *what we built or discovered together*: the module the child played, the song they made up, the experiment. It is
  retrievable only on a pull signal (deixis: "yaad hai", "us din", "woh wala"). PROPOSAL-D's rank bonus applies only
  when that deixis is present, with a target of **0 unprompted raises in 60 messages**.
- **Shared-language ledger** (`vy_shared_language` / phrase nodes): a child's coined word or chant for a concept is
  identity-durable and never decays. It is the child's own words, so it is not an inference about the child.
- **Told ledger.** No prior art exists anywhere (`MEMORY-FIELD-SURVEY.md Q4.4`). Letta's Conversations API goes the
  opposite way. This confirms the map's "render only the untold" row.
- **Session clock.** One server timer with three consumers (disclosure, break, dependency circuit-breaker). It is
  app-voiced (R-G1-01) and mirrored on the client so it fails toward disclosing. For Taxila this is the break reminder
  and the bedtime predicate, never voiced by the tutor as its own wish.

### 6.2 §2.6 emotional-lens / affect

- **SER is closed by evidence as well as by policy.** Macro-F1 0.43 is the world's best on natural English speech.
  The Indian figures are acted. Child speech is not measured anywhere. Taxila's ban
  (`ct-no-voice-emotion-inference`) is also the technically right call: the corpus says "the question is whether a
  label that is wrong most of the time is worth having" (E3 note).
- **Text cue tags are the field's convergent representation** (EchoMind, the VR study) and the only swap-portable
  one. For Taxila, compute them from dialogue and timing (counters in `server/learner/affect.js`) and render them as
  `label: value` rows. That shape measured 0/84 leakage (`affect-recitation`). The n≥300 check on Taxila's own
  vocabulary is owed before a VIBE row ships by default.
- **Bracketed direction is a dead channel** (`ack-bracket-direction`; Google's Gemini TTS docs say to use English tags
  when the transcript is not English; ElevenLabs v3 admits tags get spoken). On Azure, `mstts:express-as` keeps
  direction out of the text, but the hi-IN/en-IN styles are only Default, Cheerful, Newscast and Empathetic (E8).
  For a teacher voice that palette is adequate. For Meera it was not.
- **Never store a negative feeling about the child** [analogue of A2]. `inner.ts` already rejects
  `sign < 0 && REFS_USER` ("he hurt me" has no home by construction; `inner.ts:553, 610-619@main`). A tutor's carried
  state should be unable by construction to hold a negative feeling that refers to the child.
- **No goodbye manipulation** (E20) and **no mirroring of distress** (E21). See §5.2.

### 6.3 §2.7 memory-graph / consolidation

| adopt | built? | Taxila action |
|---|---|---|
| **A1. Forget-matching hook at mutation time.** An LLM expands a forget request into variant rows in a never-read suppression table. It never sits on recall (L2 forbids filtering at recall). Fail the *receipt*, never under-delete | Not found at `@main` or `@vy` (`git grep`); the decision exists at `decisions.md#memory-field-survey@main` (adopt 1) | **Build.** A child or parent saying "woh wali baat bhool jao", "us dost ka naam hata do" or the Devanagari form must reach the rows. Deterministic matching scores 0% cross-lingual. Use an Azure first-party model at mutation time and measure on a Hinglish/Devanagari/Roman battery first (A4) |
| **A2. Fourth bi-temporal timestamp** (`expired_at` / `t_invalid_recorded_at`: when the *system* stopped believing) | Not found (`retracted_at` exists for integrity retractions only, `db/migrations/002_episodes_facts.sql@main` L94) | **Add** to Taxila `memory` (one nullable column). A parent report asking "as of the October report, did the tutor know she had mastered fractions?" needs transaction time, not valid time |
| **A3. RRF across concurrent recall paths + one co-citation hop**, with the disclosure/agent predicate on *both* sides of the join | **Shipped** (`api/memory.js@main` L1028-1124: `cocite`, `keepFused`) | Map already says copy `rrfFuse`. Add: copy the co-citation hop with `child_id` and tutor predicates on both sides |
| A4. Our own adversarial forget battery (lexical, temporal, obfuscation, **cross-lingual**, prefix-collision, compound-fact, intent-aware) | eval-only | Build before A1, so A1's gain is a measured delta |
| A5. Staleness probe: two live rows with the same subject and overlapping validity and no supersede link = a missed invalidation | report-only | Cheap nightly SQL; catches "the tutor still thinks she hates maths" after a cited reversal |
| A6. Record NOOP in the derivation log ("considered and declined") | — | Makes consolidation lag honest (`dead-writers`) |
| A7. Consistency check on superseding arc rows | — | For any "then → now" growth line (cf. `psych-change-rule-term`) |

**Also from the survey.**
- **Provenance placed in the relational store** (Cognee is the only other system that does this): provenance must be
  joinable, because the join is what makes deletion propagate.
- **The citation CHECK is unique in the field** (Q4.5): 96% of 2,050 real memory entries elsewhere were silently
  system-created.
- **"Subtract or Replay?" counterfactual deletion audit** as an eval definition: "does the edited memory match the
  memory we would have built had this record never been included?"

**Benchmarks.** LongMemEval's five abilities, *abstention* above all, are the external spine. LoCoMo is never a target.
But the gates that decide quality are ones no benchmark scores: scope non-expansion, unprompted raising, register, and
deletion propagation (`§7.3`). For Taxila add the learner equivalents: a parent-only fact never surfacing to the child;
the tutor never volunteering a past struggle.

### 6.4 §5.3 learner modelling

- **Facts vs hypotheses gets a field-level confirmation.** MemGuard-style typing (the citation is wrong; see R-G1-28)
  and LangMem: episodic records shape *how* the agent behaves and are never asserted as facts. "Inferred preference
  retrieved as stated fact" is the named contamination. The schema needs `kind` plus provenance (`child_said` /
  `parent_said` / `observed_attempt` / `inferred`), with retrieval filtered by kind per intent.
- **Write-time admission gate** (ConsistencyGate, arXiv:2607.22962, verified-in-source: K=5 samples, τ=0.7, a logprob
  variant 12-14× faster). Before any candidate claim about a child is persisted, re-verify it against the transcript.
  Taxila's version uses an Azure first-party model. It loses cross-family independence, and that loss must be
  recorded, as the map notes for consolidation.
- **Post-generation entailment gate** (MiniCheck class, ~400× cheaper than GPT-4). Every claim the tutor makes about
  the child's history ("last time you got this right") must be entailed by a retrieved node. A claim that is not
  entailed is rewritten or replaced with an in-voice "yaad dilao". "One confident false memory does more damage than
  five honest recall failures" (industry pattern, [inferred] in the corpus).
- **Memory-regression is a trust event** (Replika 2.0; Character.AI personality update). Any change to the learner
  model or memory schema needs a plant-a-fact-on-day-N, recall-on-day-N+3 regression eval. Measure automatic recall
  and pinned-fact precedence separately (Kindroid 14/25 vs Nomi 23/25).
- **Cognitive mechanisms for covert comprehension:** §5.3.
- **The pattern/arc evidence bar is not a learning-style bar:** §7, C1.

---

## 7. Where the research contradicts an asset row the map currently lists

| # | map row (section) | what the map says | what the research says | correction |
|---|---|---|---|---|
| **C1** | §2.7 "Observation → pattern → arc evidence bars"; §5.3 "Observation → pattern → arc ... A learning-style claim is a pattern" | "One citation recalls; ≥2 citations and ≥3 support over ≥2 days generalises; ≥3 citations over ≥42 days claims growth. **Exactly the bar for 'learns best with stories'.**" | The bars come from C's `vy_dyadic` (`PROPOSAL-C §2, §4.2`: "Promotion to prompt-eligibility is a THRESHOLD, not an LLM score ... ≥3 citing episodes across ≥2 days"), built for Baldwin if-then companion patterns. No false-pattern rate was ever measured. "Repetition is not evidence" (arXiv:2607.02579). Taxila's `psych-claim-tiers` puts "a format or teaching-move effect for your child" on the never-per-child list and computes 78/217/487 delayed comparisons per arm at τ .5/.3/.2 | Downgrade. The bar may only admit a **teaching-knob nudge** (K tier, re-randomised, logged with propensity under `decision-records-with-propensities`). It is never a stored claim about the child and never a parent line. A "learns best with X" sentence is P-tier and needs `psych-parent-claim-gate` |
| **C2** | §2.5 "Relationship state (asymmetric hysteresis, trust ±0.05/day ...)"; §5.2 "Asymmetric hysteresis and rate limits" | Redesign dimensions as "trust, confidence, frustration tolerance, pace"; Taxila has `rel_state`/`rel_event` | Every proposal persists trust (A `rel_state`, B `warmth`/`trust` 0.30, C `trust` 0.3, D 0.5). C's own failure mode 5: numeric state leaks into speech, so bands only, or compile-side selection with nothing shown to the model. Taxila's `learner-legal-mode-ratchet` lists **trust, affect, latency, engagement, vibe estimates and free text about the child** as NM-3, never persisted in any mode | Do not persist trust, confidence or frustration tolerance as child columns. Keep the *record* as cited events (`rel_event`) and derive the *stance* per session. Pace and register may persist only as child- or parent-stated preferences. **Taxila's own `rel_state.trust real` (`db/migrations/001_core.sql` L149) contradicts its NM-3 decision:** flag it for the Phase D owner |
| **C3** | §2.6 "Build new ... an owner decision on what affect is ever stored (ai2bharat stores none, D-057; Meera stores a 9 h half-life feeling fused with its cause)" | Open owner decision | EMA (Gratch & Marsella): affect is a recomputed summary of a cited situation. Taxila already decided NM-3 never-persist and session-only processing (`learner-legal-mode-ratchet`, `rejected.md#affect-not-stored-as-legal-shield`). Meera's 9 h thread is the *agent's* feeling, a different construct from the child's affect | Close the open item: Taxila stores no child affect. The only affect-shaped persistence is the safeguarding `incident` row. The agent-side "carried feeling" is not built for the tutor |
| **C4** | §2.7 "Cited memory schema (`vy_episode` log spans ...)" | Adapt; choose tables, not the whole schema | `vy_episode` carries `affect_tags jsonb` and `importance` (`db/migrations/002_episodes_facts.sql@main` L24, L29). The design (`RESEARCH.md §3.8`, `multimodal-state.md §5`, PROPOSAL-D) fills affect_tags with `source:'voice'` from SER and weights importance by **affect intensity** (DIMF: `0.45·affect_intensity + …`) | Drop `affect_tags` when adapting `vy_episode`. Importance uses only non-affect features (boundary salience, child return signal, anchored comparison). No voice-sourced tag of any kind |
| **C5** | §2.5 build-new "months-long continuity"; corpus centrepiece the dyadic WE-store | (implied by "Build new ... tutor-child bond model") | Dyadic if-then patterns ("when he goes quiet ...") are *free text about the child's behaviour* | Under NM-3 they cannot persist in M1. Options: session-only patterns, rebuilt each lesson from the turn log; or an M3-only table behind full consumer consent. This needs an owner decision, recorded with a reversal condition |
| **C6** | §2.7 "Closed memory kinds, never-store list, hard delete ... **Hard delete plus a forget term**" (ai2b) | Adapt | Lexical forget-term matching scores **0% cross-lingual, 5% identifier-obfuscation** (arXiv:2606.15903). The survey calls this "the one place where a law of this repo rests on a mechanism the field has measured at 0-5%" | Keep the hard delete, but add A1 (mutation-time variant expansion, fail the receipt on hook failure) and measure on Hinglish/Devanagari first |
| **C7** | §2.7 "Cited memory schema ... bi-temporal belief change" | Presented as complete | The survey's Q1: the schema lacks transaction-end time, so an as-of query wrongly excludes beliefs invalidated retroactively. That is "not recoverable at all" when there is no successor | Add the nullable `expired_at` column (A2) |
| **C8** | §5.3 "No decay by absence. Mastery is a pure fold of graded attempts" | Stated as one rule | The corpus separates decay-as-salience (endorsed, never deletes) from deletion. Taxila's `learner-bktr-ledger` uses FSRS retrievability (retention = pL·R falls with time) while "absence never lowers display" | Restate as three ledgers (§5.4): tutor retrieval priority decays; child retention decays (FSRS); displayed mastery never drops with absence |
| **C9** | §4.3 "External: ... best naturalistic SER macro-F1 0.4316 over 8 classes" | Quoted alone | Add the context the corpus insists on: offline, English, unlimited compute; every Indian figure is acted (58.83% Hindi); no conversational-Hinglish SER exists | Amend the row |
| **C10** | §2.6 "Distress shapes with negative controls" and Build new "child frustration and confusion shapes" | Lexical shapes in three scripts | Consistent. But the corpus adds that the field's working cue form is a **text tag handed to the model** (EchoMind 3.34→4.42) | Render detected shapes as `label: value` tags (0/84 leak), never as sentences. Owe the n≥300 leak row |
| **C11** | §5.2 "Reason-contingent proactivity ... never because the child went quiet" | — | `oss-landscape-2026.md` recommends calendar-keyed proactive outreach via a new appended-last rule (R-G1-25) | Keep the map's rule. Proactivity is code-scheduled (the parent-set time) and app-rendered, never a third appended-last rule |

---

## 8. Other subsystems this corpus touches (briefly)

- **§2.16 evals / swap testing [direct].** `swap-test.md` is a ready protocol for any Taxila change that could alter
  "is this still my teacher": a tutor model upgrade (gpt-5.6 → next), cascade vs realtime lane, or a voice change.
  - **D0:** the battery must flag known-bad archives first.
  - **D1:** deterministic register bands at ≥2,000 turns per arm, which would have caught all three historical
    failures.
  - **Judged parity** at n≥300 per cell, both orders, agreement-only wins, interleaved same-model control pairs, two
    judge families.
  - **TOST equivalence**, never "p>.05". Power: δ=10pp needs ~155 (80%) / 214 (90%) for one proportion, ~198 per arm
    for swap vs sham.
  - **Sham arm** is load-bearing, because mere mention of change raised mourning by d=0.40.
  - **Strohminger line** (via De Freitas): people track identity through morality and personality more than memory.
    For a child's teacher, weight register and character invariance (D1/D3/D5) over memory carry-over, until a
    vignette study says otherwise.
- **§2.2 voice identity [direct].** Familiarity beats fidelity: the familiar listener rejected the voice that won every
  metric. For children the familiar listener is the child, and the parent second. Use a speaker-embedding cosine only
  as a pre-filter (D proposed ≥0.75), never as the verdict. Voice identity across an LLM swap with TTS held constant is
  unmeasured anywhere.
- **§2.10 multimodal.** No streaming API persists state (OpenAI Realtime is stateless past the transcript). Extract
  during or straight after the session, or it never exists. A shared-attention record stores
  `{claim, extracting_model, confidence, declared_illegible}` with the tutor's reaction kept separate from the claim.
  This is the vision-fab law; it applies to Forge module screenshots the tutor comments on.
- **§2.23 payments / growth (from `oss-landscape-2026.md` competitor research).** Never re-gate a feature a paying
  cohort already has (Talkie, verified). Never hide the limit meter. Abrupt blanket paywalls on an emotionally invested
  base generate backlash (Chai, corrected).
- **`humansand.md`.** humans& (humansand.ai): a $480M seed at a $4.48B valuation (2026-01-20). Its one public artifact
  is an NVFP4 RL-quantisation post, and it has no relational or memory mechanism in public. **Nothing transferable.**
  Watch it only if it publishes memory or multi-agent work.

---

## 9. Not covered, and what this pass did not read

- The corpus never measures **children, learners or teachers**. Every Taxila transfer in §5 and §6 is
  [analogue] or [inference].
- No learner-side spacing, testing-effect or interleaving literature (§5.4).
- Not re-read here: `AFFECT-CONTINUITY.md` (the non-RAW design doc, 46 KB). It is cited by `companion-tech.md`,
  `hp-main-engine.md` and `meera-repo.md`; this report uses only its RAW evidence log.
- `oss-landscape-2026.md`: the voice turn-taking, chess-UX, chat-UX and games sections were read only to their
  verdicts.
- I did not open the external papers. Every external number is as the corpus records it, with its verification flag.
- The A1/A2 "not built" finding comes from `git grep` (patterns: `t_invalid_recorded_at`, forget
  variant/expand/synonym, `expired_at` in `db/`). It is not a read of `opForget` line by line. Check
  `api/memory.js@main` around L782 before relying on it.
