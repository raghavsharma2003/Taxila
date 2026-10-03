# Gap audit: knowing whether the child understood

**Date:** 2026-10-03. **Auditor:** a gap-audit subagent. This is an audit only: no code, kit or context file was changed.
**Production:** `https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`, reached from the US sandbox over the
agent proxy. **Owner intent under test:** "the research level breakthrough we needed to understand that the child
understood the thing or not."

**Tags.** **[M]** measured this session (method and n given). **[T]** read in Taxila's code or docs this session.
**[V]/[S]** carried from the repo's research files with their tags. **[U]** my inference or design proposal, not
measured.

---

## 0. Verdict in one paragraph

The engine described in `COMPREHENSION-ENGINE.md` exists as code, and it is wired into the live lesson. Production does
ask covert why-probes (C03, C06, C10), writes `probe_log`, folds facets and calls the blind closed-label grader. **The
number everyone quotes, macro accuracy 0.659 (bkt2) / 0.480 (cfrag), does not measure the product that is deployed.**
That simulator uses all 36 probe shapes and seven kit fields that no kit has. Production allows 6 shapes, and only 5 of
them can ever fire. When the simulator is restricted to the live shape set, it scores **0.472 / 0.419**. It never
certifies `understood`, and the verbal gap is **58 / 40 pp** against a ≤ 10 pp bar [M].

On production I found four further problems:
1. The why-probe's understanding evidence is silently dropped when the child answers within about 2 s.
2. Kit error-spot answers never count toward understanding, and neither do transfer answers that were not matched
   exactly.
3. What the parent sees comes from a lenient classifier that recorded an irrelevant parroted line as a correct "why".
4. The parent's "how we know" card throws on its own banned-word list ("behind") for every English-language child in
   the most common post-lesson state, so it never appears [M].

So there is no breakthrough yet. What exists is a good architecture whose live path has not been measured. The route
to a result beyond the state of the art is concrete:
- make understanding evidence **code-graded and verbal-fair**, using counterfactual minimal-pair probes and
  planted-error catches;
- learn the evidence model from each child's own **delayed transfer outcomes**;
- give every parent-facing claim a **distribution-free bound on false mastery** (conformal risk control);
- validate against blinded expert clinical interviews and 30-day far transfer, in a Registered Report (§6-§7).

---

## 1. Where it is today (numbers, with method)

### 1.1 What the repo has measured [T, from `context/measurements.md`]

| measure | value | source | bar | status |
|---|---|---|---|---|
| CE-M1 macro accuracy, final, engine | bkt2 **0.659**, cfrag 0.480 | comp-sim-integration-2026-10-03 (n = 4,320 child-concepts per family) | ≥ 0.70 both | FAIL |
| macro accuracy after 3 sessions | bkt2 0.589, cfrag 0.452 | same | | |
| CE-M3 false mastery (overall / shallow) | bkt2 0.023 / 0.001; cfrag 0.039 / 0.029 | same, comp-review-2026-10-02 | ≤ 0.05 / ≤ 0.02 | pass / **FAIL cfrag shallow** |
| CE-M4 verbal gap | 14.1-16 pp | comp-review-2026-10-02; my rerun 16.0 | ≤ 10 pp | FAIL |
| CE-M2 understood detected / never detected | bkt2 0.538-0.553 / 0.447; cfrag 0.252-0.265 / 0.735 | same | median ≤ 3 sessions | median 2 (bkt2), 3 (cfrag), with ~45-74% never detected inside 5 sessions |
| weakest truth type | fragile_bound 0.466 (bkt2) | integration-after | | |
| weakest archetypes | deferential understander 0.28, confident misconception 0.33, correct-for-wrong-reasons 0.36, shy understander 0.48 | comp-sim-2026-10-02 | | |
| LLM-played leg | 0.702-0.731 (n = 288) | comp-sim-llm-2026-10-02 | | flattered: an LLM child "cannot play not knowing" (the leg's own caveat) |
| matched-model MC upper bound, 5 sessions | 0.698 | comprehension-mc-2026-10-02 | | inverse crime, an upper bound |
| M-GRADE (grader κ vs humans), M-PT, E-COVERT, CE-M10, VF-M1 | **never run** | spec §8.5, §11 | κ ≥ 0.7 etc. | no real-child number exists |
| oracle-prober control (defines 100%) | **not built** | comprehension-review-open-2026-10-02 | | the battery has no ceiling |
| mutant VC4 (game at full weight) | not caught (0.673 ≥ 0.659) | integration-after | must fail | the battery is blind to it |

I reran `--policies engine --seeds 30` from a scratch copy of the simulator. It reproduced 0.659 exactly
(deterministic), so the baseline below is comparable.

### 1.2 The simulator measures a product that is not deployed [M + T]

| difference | simulator | production | evidence |
|---|---|---|---|
| probe shapes the scheduler may choose | all 36 (C01-C36) | `LIVE_PROBE_SHAPES = {C03, C06, C09, C10, C12, C14}` | `server/director/state.js:40`, `:145`; sim calls `nextProbe` without `allow` (`evals/comprehension-sim/sim.mjs:176`) |
| kit fields a shape needs | `KIT_INPUTS` includes characterView, myth, counterfactual, instances, representations, weaveHosts, solver | **0 of 830 topics** carry any of those seven fields (they carry expectations, misconceptions{id, belief, signs, diagnostic, remediation}, items) | `evals/comprehension-sim/world.mjs:28-29`; kit scan of `data/kits/*.json` this session |
| consequence for C09 | eligible | **never eligible** (needs characterView), so production has 5 usable shapes, all explanation-type (R-EXP or R-OPT+R-EXP) | `shapes.json` C09 kitInputs |
| T (transfer) evidence | from T-probes C13/C17-C29 | no T shape is live; T can only come from kit `near_transfer` / `far_transfer` items, and only when the answer is code-matched (§1.4) | |
| U evidence from error-spotting | code-graded R-CATCH shapes (C04/C05/C07/C15) | not live; kit `error_spot` items are classified by the LLM classifier with no span, so they carry **0 U** (§1.4) | |

**Live-configuration rerun** (scratch copy of `evals/comprehension-sim`, the same engine code, 30 seeds × 24 personas
× 6 topics × 5 sessions, n = 4,320 child-concepts per row; delayed C31/C32 allowed in every row):

| policy | bkt2 macro (after 3) | understood found | false mastery | verbal gap | cfrag macro | cfrag understood found | cfrag verbal gap |
|---|---|---|---|---|---|---|---|
| engine (all 36 shapes): the published number | **0.659** (0.589) | 0.538 | 0.023 | 16.0 pp | 0.480 | 0.252 | 15.3 pp |
| **live shapes only** (C03/C06/C09/C10/C12/C14) | **0.472** (0.414) | **0** | 0 | **58.1 pp** | **0.419** | 0 | 40.4 pp |
| live shapes, no game evidence | 0.470 | 0 | 0 | 55.3 pp | 0.412 | 0 | 45.3 pp |
| live + kit item kinds approximated as code-graded (adds C07, C13, C16, C19: optimistic, see §1.4) | 0.595 (0.508) | 0.343 | 0.013 | 37.0 pp | 0.439 | 0.134 | 20.9 pp |

**Reading.** The first live row is a lower bound for production, because the simulator does not play kit transfer,
error-spot or predict items. The last row is an upper bound, because it grades those items in code, and production
grades them with an LLM and no span check. **The deployed engine sits somewhere between 0.47 and 0.60 (bkt2) on
the project's own simulator, with no live path to `understood` except an exact-matched transfer item.** The verbal
gap of 37-58 pp is the important number. With only explanation shapes live, children who understand but explain
poorly (shy, low-verbal, Hindi-medium) cannot be credited, which is the fairness failure the spec warns about (CE-M4).
Raw results: scratchpad `csim/live6.json`, `csim/livekit.json` (ephemeral; numbers copied here).

### 1.3 What is actually live in a production lesson [M]

**Method.** I used a scratch script modelled on `scripts/prod-smoke.mjs`:
- signup → child (class 5, English, cricket) → consent → controls 00:00-23:59 → `POST /api/lesson/start` (text lane);
- 18-22 scripted child turns, answered from the kit by `ui.ask.itemId`;
- end → set PIN → unlock → `GET /api/parent/overview` and `/api/parent/evidence` for each skill → `DELETE /api/account`.

Before deleting, I read that child's rows from the Neon database in `.env.local`. It is the production database: the
child row created through the production API was present. Topic `c5-maths-ch01-t01` in every run. There were 5
lessons:
- understander × 3, with 0 s, 2 s and 6 s pause before each reply;
- understander, an early run with no DB read;
- parrot ×1 (answers why-probes with the teacher's own last sentence).

| what | observed |
|---|---|
| covert probes asked | `probe_log`: C03 "protege naive but-why" (reason `verify_first_correct`, mandatory), C10 (`voi`), C01 lesson teach-back. The words were natural ("How did you know the last three digits are 360?"), with no "samjha?" and no repeated question |
| closed-label grader | runs (`grade_audit` rows, DeepSeek-V4-Pro, R-EXP, one row per kit target) |
| **held-verdict settle** | the why event folds at the NEXT turn only if the background grade has finished. Child reply delay 0 s: **0/5** why events graded (`span_ok=false`, no audit rows). 2 s: **1/3**. 6 s: **3/3** (`span_ok=true`, U rose 0.20 → 0.44 / 0.58). n is tiny, but the dependence is clear |
| state after a full correct lesson | `shallow` on both taught skills (U 0.44 / 0.58, T 0.20 untouched). That is by design (`understood` needs a ≥ 20 h delayed success and T ≥ 0.6), but it means **a tester cannot see `understood` in one sitting** |
| `reteach_attempts`, `weave_queue` | 0 rows across all 8 remaining production children (aggregate count only) |
| parent "how we know" card | `comprehension: null` for every skill in every run (§2, G1) |
| parent evidence rows | come from the legacy `evidence` table (the Director classifier), not from the closed-label verdict (§2, G4) |

### 1.4 How each kind of evidence is actually graded live [T]

- `graderOf(cls)` marks anything that is not an exact/chip/module/lexical decision as `"llm"`
  (`server/learner/live.js:69-70`).
- E6 then gives a positive LLM event **zero** U/T weight unless `spanOk === true` (`server/comprehension/facets.js:38`).
- Only `probe.why` and `probe.teachback` are sent to the span-checked grader (`server/comprehension/later.js`;
  `routes/lesson.js:1154-1170`).

So in production:
- why / teach-back: U evidence only if the async verdict settles before the next turn.
- kit `error_spot` (free speech such as "No, it's thirty thousand fifty"): `probe.errorspot`, grader `llm`, span
  null → **never U**. Observed in kt_evidence seq 693, 712 and 727.
- kit transfer items: T only when the classifier source is an exact match. Otherwise the event is `llm` with no span,
  so **no T**.
- **The code-graded U path, which the computed check found matters most** (COMPREHENSION-ENGINE §0.1 point 3: U only
  from LLM-graded explanations cut detection 0.407 → 0.238), **is not live.**

---

## 2. Gaps, ranked

Severity: **B** = blocks testing (the owner cannot test or trust the pillar) · **D** = degrades the experience or the
validity of claims · **P** = polish. Estimates are engineering days for one strong agent workstream, excluding human
labelling time.

| # | gap | sev | evidence | work to close it | est. |
|---|---|---|---|---|---|
| G1 | **Parent "how we know" card never shows for English-language children in `shallow`.** The English `shallow` row reads "the idea *behind* them", and "behind" is in `PARENT_BANNED`. `conceptCard` throws, and parent.js swallows the throw and returns `null`. `shallow` is the state a child is in after a typical first lesson. The test only exercises `fragile` | B | `server/comprehension/report/howweknow.js:10` and `:33`; `server/routes/parent.js:757-760`; `tests/comprehension-grade.test.mjs:180` (fragile only). Reproduced: `conceptCard({state:"shallow"},{lang:"en"})` → `banned word "behind"`. Prod: `comprehension: null` in 4/4 runs. Also "Still had it 1 days later" (grammar) | Reword the row; make the test iterate every state × every language × refresh/no-refresh; add a release probe asserting a non-null card after a scripted lesson | 0.5 |
| G2 | **Why-probe U evidence is lost when the child replies fast or hits another replica.** The verdict lives in an in-process `PENDING` map and is read without waiting at the next turn | B (for the pillar: the main live U signal is starved at random) | `server/comprehension/later.js:13-40`; `routes/lesson.js:1162-1170`. Prod settle: 0/5 at 0 s, 1/3 at 2 s, 3/3 at 6 s. INTEGRATION open item "held-verdict settle rate unmeasured" | (a) At the next turn, `awaitGrade(id, ≤ 600 ms)` before folding, inside the turn's latency budget, since classify already runs in parallel. (b) Write verdicts to `grade_audit` (or a `pending_grade` row) the moment they land, and read them by event id at the next turn, so this works across replicas. (c) Late fold: a verdict that lands after the event folded is applied as a correction event on the following turn, replay-safe. (d) Log a settle-rate metric per turn and alert below 95%. Re-measure with 30 lessons at 0/1/2/4 s delays | 2 |
| G3 | **The headline accuracy is measured on a configuration that is not deployed** (§1.2). Live shapes plus kit fields give 0.42-0.60, `understood` unreachable via probes, verbal gap 37-58 pp | B (no honest number for the owner) | `server/director/state.js:40`; `evals/comprehension-sim/sim.mjs:176`; `world.mjs:28-29`; 0/830 kits carry the seven fields; live-config table above | (a) Add a `live` policy that imports `LIVE_PROBE_SHAPES` and real `kitInputsOf()`, plays kit item kinds (error_spot / transfer / predict) through the production grader routing, and models the settle-latency distribution; make it the headline row in every report. (b) Fail the sim run if `engine` and `live` diverge by more than 0.03 without a logged reason. (c) Build the oracle-prober control and a gamer / rank-exploit policy so VC4 fails | 2 |
| G4 | **What the parent sees comes from the lenient classifier, not the engine.** A teacher-parroted irrelevant line ("yes, 1,00,000 has one lakh.") to "How did you know 30,050 has thirty thousand?" was stored as `why P2 correct`, twice, plus `contrast P8 correct`. The teacher said "your place-value rule is right". The lesson summary claimed "Recorded 8/8 unaided correct … attempts" when two of those turns were non-answers needing repair. An earlier summary said "two unaided" where one item had been answered | D (false claims to parents; the opposite of the CE11 honesty design) | Prod parrot run (parent evidence rows); `server/director/state.js:806-822` (the classifier's `cls.reason` becomes P2 evidence); `server/routes/parent.js:715-745` (rows from the `evidence` table) | Drive parent rows, DidCards and the summary from the folded kt events, with the closed-label outcome and `grader` shown ("exact answer" / "AI-checked against the book's key idea"). Keep the classifier's label only for the move. Build the summary from facts with a claim checker (the `server/reports/check.js` pattern) so counts are re-derived from rows | 3 |
| G5 | **The blind grader rewards recitation and authority, and under-credits Hinglish.** Verbatim kit key idea → `present` 4/4. "my teacher told me zero holds a place" → `present` 2/2. Own-words Hinglish reason → `partial` 2/2, and partial never scores U (E5). "because it is thirty thousand fifty" (answer only) → `contradicted` 2/2, which counts as negative evidence. Irrelevant key ideas and teacher parrots → `absent`, which is correct (8/8) | D (shallow children credited, Hindi-medium understanders not: CE-M3 and CE-M4 in the real world) | My Azure probe of `gradeClosed` (production chain, echo = title + question): 10 cases × 2 reps, n = 20. Echo list = kit title + topic title + last teacher line only (`routes/lesson.js:1157-1158`); the grader never sees the question (by design, `closed.js:15-24`) | (a) Echo guard over **every teacher turn of the episode** plus the target's own wording: ≥ 0.8 content-word overlap with the target → `partial` ("recited"), never `present`. (b) Authority lexicon ("teacher/didi/book said") → `partial`. (c) `absent` vs `contradicted` rule: "restates the answer" → absent, never contradicted. (d) A/B translate-then-grade for Hindi/Hinglish (S9). (e) A 300-case adversarial battery (recite / parrot / authority / own-words EN/HL/HI / answer-only / misconception) run on every grader-model change (S11) | 3 + battery |
| G6 | **No code-graded understanding path is live.** R-CATCH shapes (C04/C05/C07/C15), C16 predict, C08 puppet, C13/C19 near transfer exist in `shapes.json` but are not in `LIVE_PROBE_SHAPES`. Kit `error_spot` answers carry 0 U (§1.4) | D (detection, verbal gap) | `server/director/state.js:40`; `server/learner/live.js:69-70`; `facets.js:38`; kt_evidence seq 693/712/727 `probe.errorspot` llm, span null | (a) Add tap-chip forms for planted-error shapes. The protégé states the planted misconception from `kit.misconceptions[].belief`, the child taps "right / not right" and then fixes it; R-CATCH is graded in code. (b) Map kit `error_spot` to R-CATCH: a code check on the yes/no plus R-KEY on the correction. (c) Route free-form error-spot and transfer answers through the closed-label grader so they carry a span. (d) Widen `LIVE_PROBE_SHAPES` to {C04, C05, C07, C08, C13, C15, C16, C19, C31} as their move shapes and graders land, re-running the live-policy sim after each | 6 |
| G7 | **Kits lack the fields half the shape library needs** (characterView, myth, counterfactual, instances, representations, weaveHosts, solver: 0/830) | D | Kit scan this session; spec §4.3 and build list #12 "M (+ authoring)" | Kit workflow: generate per topic with the blind-solve verification pattern already used for keys, maths and science first (c4-c8, about 350 topics). `solver` should be code (parametrised item templates), because it powers the counterfactual probes of §5 | 10-15 (agent time) + review |
| G8 | **Nobody can test "understood" in one sitting.** It needs a delayed success ≥ 20 h later plus T ≥ 0.6, so a tester sees `shallow` at best. The next-day delayed check (C31 via warm-up retrieval) and the woven check (C32; hosting is a no-op, INTEGRATION open item) are unverified in production | B (for thorough testing) | Prod state after a full correct lesson: `shallow`; `weave_queue` 0 rows; `integration-learner-open-2026-10-03` (hosting no-op) | A test-only clock for `@taxila.test` accounts (server-side offset, refused for real accounts, logged), plus a scripted 3-day prod probe: day 0 lesson → +1 d opener check → +3 d woven check. Assert the C31 fires, the state rises, and the card wording changes | 1.5 |
| G9 | **Re-teach outcomes are never resolved, and arm posteriors are never written.** The personalised re-teach loop cannot learn | D | `reteach_attempts` 0 rows in prod; `reteachOutcomeStmt/armPosteriorStmt unused` (integration-learner-open) | Resolve the attempt at the re-check (§5.4); write arm posteriors; add a sim assertion | 1.5 |
| G10 | **No human-calibrated grader, and no span retained.** M-GRADE κ has never been run. `keepSpan: false` is hard-coded even where consent exists, so the calibration refit can never inspect what the grader quoted | D (every LLM likelihood in the fold is an unvalidated 0.7 diagonal) | `routes/lesson.js:1133`, `:1467`; consent lookup not wired (integration-learner-open) | Wire `transcripts_retention` consent; run M-GRADE on 300 turns per family × EN/Hinglish/Hindi with 2 trained raters (CBSE teachers), per graderVersion | 1 + labelling (~2 rater-weeks) |
| G11 | **Diagnostic repair loop does not exit.** Twelve consecutive repair/hint turns on one diagnostic item when the child gave non-answers. Outside this pillar's code, but it starves the engine and would read as a test | D | Prod run 1, turns #8-#19 | Cap unclear tries per item (for example 3), then a chip or move on; count it as `no_evidence` | 0.5 |
| G12 | **No comprehension paper exists in the research programme.** PAPER-OUTLINE.md is Paper 1, on per-child reliability. The ESE voice protocol is blocked on a written Microsoft Code of Conduct answer | P (now) / B (for the "breakthrough" claim) | `docs/research/psychology/PAPER-OUTLINE.md`; `context/open.md` `wb-coc-epistemic-vs-emotional` | §7: Paper 2 outline + preregistration; send the CoC question to Microsoft | 2 (writing) |

**Unverified from this sandbox (say so plainly):**
- the voice lane: realtime/cascade why-probes, the timing of the held-verdict settle under TTS playback, and the
  voice-feature tie-breakers (CE8);
- the next-day C31 check, the woven C32 check and re-teach selection in production. They need a ≥ 20 h clock (G8);
- Hindi and Hinglish lessons in production. Only the grader was probed in Hinglish.

---

## 3. Why the current design cannot reach the bar by tuning

1. **The ladder is only as good as the U and T evidence feeding it, and the live U evidence is 100% LLM-explanation.**
   The project's own MC already showed this path caps detection (0.238 vs 0.407 with code-graded U). The live-config
   sim shows the consequence (0.47, verbal gap 58 pp).
2. **Explanation-type evidence is confounded with verbal ability and language.** The live grader gives own-words
   Hinglish `partial` and verbatim recitation `present` [M, n = 20]. Asking for more explanations makes the bias
   worse, not better.
3. **Truth for "understood" arrives late** (delayed and transfer). Every design that waits for it is slow: the median
   time to detect is 2-3 sessions, and 45-74% of understanders are never detected inside 5 sessions. The remedy is
   evidence that is *diagnostic now* (counterfactual contrasts) plus an evidence model *learned from* the late truth,
   not looser thresholds (SIM6 is right to forbid tuning to the sim).

---

## 4. What current research offers (late 2025 to 2026), and what each could move

Source tags are those of `docs/research/world-best/understanding-detection.md` and `comprehension/papers-2025-2026.md`
unless marked [U].

| idea | best current evidence | what it would move here | verdict |
|---|---|---|---|
| **Text-LLM knowledge tracing** (NTKT: history plus item text into a 1-3B LLM) | Eedi AUC 89-90 vs DKT 73, stable question cold start [V] | Offline challenger on *delayed* outcomes; cold-start priors for Forge items; a disagreement list that sets probe priority | Yes, offline only (S3); never writes mastery |
| **Dialogue KT** (LLMKT; difficulty-aware dialogue KT, BEA 2026) | real-student AUC only 65.8 on CoMTA vs 76.7 on simulated MathDial [V] | A warning more than a tool: per-turn LLM labels carry 15-25% noise | Use as a baseline to beat, not a component |
| **Selective prediction / abstention** | Eedi: deferring the most uncertain 20% gives +2.3-3.0 pp accuracy; deferred cases err 1.45-1.6x [V abs] | A computed "still checking" state; fewer false `understood` claims to parents | Yes (S2), and extend to **conformal risk control** (§5.3) |
| **Per-item closed misconception sets** (Kaggle MAP: MAP@3 > 0.948 by restricting labels per question) [V] | Taxila's kit-keyed closed sets are the deployable version | Harvest new per-item misconceptions from real `absent`/`other` turns (S4) | Yes |
| **Encoders beat few-shot LLMs on mid-range answers** (Gurin Schleifer 2026) [V] | The `partial` stratum is where G5 bites | A small per-subject encoder as a second operator behind the LLM grader | Yes, after M-GRADE data exists |
| **Teach-back to a protégé held in code** (LLM Protégés BEA 2025: the gain is in children who *succeeded*; unlearned tutees stay novice) [V] | `protege.js` already freezes the misconception | Make the *catch* code-graded (R-CATCH by tap and correction), not the explanation | Yes (G6) |
| **Idea-unit retell scoring; translate-then-grade** (Louw 2025: translating to English improved LLM scoring) [V] | Teach-back grading in Hindi/Hinglish | R-IDEA code operator first, LLM only for paraphrase; A/B the translation | Yes (S9) |
| **Response-time IRT / speed-accuracy models** (van der Linden hierarchical; Math Garden's signed residual time) [S/U] | Tap and typed latency on code-graded items is a knowledge-and-fluency signal, not "speech patterns" | D/K fluency and rapid-guess detection on item events; never U | Yes for typed and tap items; voice latency waits for the CoC answer |
| **Think-aloud / process data** (hint use, self-repair before commit, manipulation traces in sims; stealth assessment: multi-agent event labelling r = 0.333 with post-test vs 0.095 single LLM) [V] | Forge simulations and engines can emit machine-truth process events | Prediction-before-reveal and manipulation sequences as code-graded U and T | Yes, but blocked: modules produce 0 evidence today (`gap-audit/live-content.md`) |
| **Voice epistemic signals** (FOK: "I don't know" vs "I can't remember", Smith & Clark 1993; children's disfluency tracks accuracy, West 2025) [V/S] | Text-only IDK vs IDK_R split is safe now | S1 split now; timing features only after Microsoft confirms restriction 12 does not apply | S1 yes; ESE blocked |
| **Causal / counterfactual probes** (minimal pairs: change a surface feature, the answer must not change; change a deep feature, it must) [U: established in cognitive-science "contrasting cases" work, not as a detector] | Not in any product found (understanding-detection §1.4 gap) | The verbal-fair, code-graded U and T evidence this engine lacks | **The core of the proposal (§5)** |

---

## 5. The proposed advance: Counterfactual-Invariance Evidence, learned from the child's future, with a guaranteed false-mastery rate

**Claim to test [U].** Understanding can be detected covertly, without explanation-dependence, by whether a child's
answers stay invariant under surface perturbation and change correctly under deep perturbation. If the weights of
that evidence are learned from the same child's later delayed transfer outcomes, and the parent-facing claim is
gated by conformal risk control, the result is:
- a detector that beats the K-only BKT baseline, an LLM transcript judge and the child's own class teacher at
  predicting 30-day far transfer;
- a verbal gap ≤ 5 pp;
- a finite-sample guarantee on the false-`understood` rate.

No published system combines these (understanding-detection §1.4 confirms the gap for voice tutors; I found nothing
for the combination [U]).

### 5.1 Counterfactual minimal-pair probes (CMP), code-graded

For each concept, the kit `solver` (code, a parametrised template) generates pairs from one seed item:
- **S-pair (surface change):** same structure, new context, numbers or representation. Understanding predicts the
  same method; the shallow trap predicts failure when the surface cue goes.
- **D-pair (deep change):** one structural feature flipped (move the zero, swap the comma grouping, reverse the
  operation's direction). Understanding predicts the answer changes in the right way; a memorised pattern predicts
  it does not.
- **Grading** is R-KEY against the solver: no LLM, no speech required. The child can tap, type a number or say a
  number.
- **The 2 × 2 signature maps onto the truth types:**
  - S pass, D pass → U and T;
  - S pass, D fail → shallow (rule-following);
  - S fail, D pass → fragile_bound;
  - both fail → not_yet.
- This directly targets the two weakest cells: fragile_bound 0.466, and the verbal gap.
- **Covert framing** is the existing family B/C/D skins ("would-you-rather", "which one would trick a friend",
  "predict first"). The test weight is low because each pair is one item.

### 5.2 Emissions learned from the child's own future (generalised ESE)

- Every probe event at time t is later followed by a delayed (C31) or woven (C32) check. The pair (evidence at t,
  delayed success at t + Δ) is a free training label.
- Fit, offline and monthly, a hierarchical model: P(delayed far-transfer success | event class, shape, outcome, pL,
  child random intercept).
- Write back only the **emission tables** per shape and outcome (replacing author priors and the unvalidated 0.7 LLM
  diagonal), versioned with `params_version`.
- This is exactly the "EM refit against delayed items" lever the spec names (§0.1 point 2), but with the gain
  measured on held-out children.
- Voice timing features enter this model only after the Code of Conduct answer, capped at LR ≤ 1.1 (CE8).

### 5.3 Conformal risk control on parent claims

- Treat "state = understood" as a set-valued claim.
- Using a calibration split of child-concepts with known 30-day outcomes, choose the ladder thresholds so that the
  expected false-`understood` rate is ≤ α (for example 0.05), with a finite-sample guarantee (conformal risk control,
  Angelopoulos et al., ICLR 2024 [U: verify the citation before any context entry]).
- Report the coverage, meaning the share of true understanders certified, as the cost.
- Below the threshold, the parent sees "still checking". This turns S2's abstention idea into a claim with a
  guarantee, which no consumer tutor makes.

### 5.4 What would kill it (reversal conditions)

- CMP S/D signatures add < 0.03 AUC over pL + U + T on 30-day far transfer (CE-M10 style) in Study A. Then drop CMP
  as a U source and keep it as practice.
- Learned emissions do not beat author priors on held-out children after 2 monthly fits. Then keep the priors and log
  the null.
- Conformal coverage at α = 0.05 falls below 0.25 (too few children ever certified). Then report it and widen α only
  with the owner's sign-off.
- A DIF check shows any component's effect differs by medium or language by > 0.02 AUC. Then remove that component
  for everyone.

---

## 6. Experiments that would prove it

### 6.1 Offline simulator (before any child; gates mechanics, never efficacy, per SIM6)

| id | experiment | arms | primary metric | pass |
|---|---|---|---|---|
| X0 | **Live-fidelity baseline** (G3) | `engine` vs `live` (production shapes, kit inputs, grader routing, settle-latency distribution) | macro acc, CE-M2/M3/M4 | `live` is the published number; the divergence is explained |
| X1 | **Ceiling** | oracle-prober (reads truth, picks the most informative eligible probe) | defines 100% | all reported numbers are expressed as a fraction of the oracle |
| X2 | **CMP** | live vs live + CMP (S/D pairs, R-KEY) | macro acc both families; fragile_bound acc; verbal gap; probes per concept-session; load/10 | macro ≥ 0.70 in both families; verbal gap ≤ 10 pp; load ≤ 2.5; false mastery ≤ 0.05 / 0.02 |
| X3 | **Code-graded catches** | + R-CATCH tap forms (C04/C05/C07/C15) | same | additive over X2, or drop |
| X4 | **Grader stress** | LLM-played leg with recite / parrot / authority / Hinglish-own-words / answer-only personas (the G5 cases) | P(present \| U=0 recite), P(present \| U=1 Hinglish) | ≤ 0.10 and ≥ 0.80 respectively after the G5 fixes |
| X5 | **Emission recovery** | sim with known emissions; EM on delayed outcomes from author priors | parameter recovery error; accuracy gain on held-out seeds | recovers within ±0.1 and does not overfit (third truth family) |
| X6 | **Conformal** | split seeds into calibration and test | realised false-understood rate vs α; coverage | realised ≤ α across 30 seed splits |
| X7 | **Battery validity** | mutants VC1-VC7, plus a gamer / rank-exploit policy | each mutant fails at least one bar | all caught (VC4 is not today) |

**Third truth family [U].** The simulator should add a misconception-rich generative child that is not
BKT-shaped, such as an SFT'd small model with a Selective Flip Score check (papers-2025-2026 #8). Then no
conclusion rests only on families the engine was designed around.

### 6.2 Real-child protocol (Phase 0 → Study A → Study B)

**Phase 0 (pilot, n ≈ 300, already in RESEARCH-PROGRAM §8).** Add these to its existing list:
- M-GRADE: 300 turns per family × EN/Hinglish/Hindi, 2 trained CBSE-teacher raters, κ ≥ 0.7;
- the settle-rate check (≥ 95%);
- M-PT: < 15% of children tap "test" per family;
- the CMP item verification: every solver pair is blind-solved.

**Study A: criterion validity (the paper's core).**
- *Design:* a prospective, blinded measurement study. Classes 4-7, maths and science, CBSE/RBSE, stratified by school
  medium (Hindi / English) and band.
- *Engine arm:* 4 weeks of normal use. The engine's state and P(understood) are frozen per child-concept at each
  week's end.
- *Criterion 1:* a 10-minute **structured clinical interview** (Piagetian/Ginsburg style, scripted and
  video-recorded) on 2 concepts per child, by a trained teacher blinded to the engine. Two raters code the 5-state
  truth type. Report inter-rater κ.
- *Criterion 2:* a **30-day far-transfer battery**: novel-context items, solver-generated, not seen in the product,
  administered overtly by a neutral narrator.
- *Baselines:*
  1. a K-only BKT rule;
  2. an overt 4-item quiz;
  3. **an LLM transcript judge**: a frontier Azure model given the whole lesson transcript and asked for the state;
  4. **the child's class teacher's rating**.
- *Primary outcomes (pre-registered):*
  1. AUC of P(understood) for 30-day far transfer, engine vs each baseline (DeLong, Holm-corrected);
  2. false-`understood` rate vs criterion 1 (target ≤ 0.05, the conformal α);
  3. macro accuracy vs criterion 1;
  4. verbal or medium gap ≤ 5 pp;
  5. median sessions to a correct `understood`.
- *Sample size [U, rough]:*
  - Estimating a false-mastery rate near 0.05 with a 95% CI half-width of 0.025 needs about 290 certified
    child-concepts.
  - Detecting an AUC difference of 0.05 (0.75 vs 0.70) with correlated ROC curves at r ≈ 0.5 needs on the order of
    400-600 child-concepts with ~40% positives.
  - So plan **about 150 children × 4-5 concepts ≈ 600-750 child-concepts**, balanced 50/50 by medium.
  - Confirm with a simulation-based power analysis on the Phase 0 event-time distributions (the PAPER-OUTLINE
    Study 1 method).

**Study B: causal (micro-randomised, within child).**
- At each `learned_today`, randomise: CMP pair vs why-probe vs time-matched re-exposure (⅓ each; this extends
  M-PROBE in RESEARCH-PROGRAM §7.2).
- Outcome: success at the ≥ 7-day check. Analysis: the MRT estimator with the 0.1 randomisation floor already in the
  programme's design rules.
- This answers whether detecting understanding this way also *helps* learning, or only measures it.

**Ethics and consent.** IEC approval; oral assent with a neutral narrator (RESEARCH-PROGRAM §9); interviews
video-recorded only with research consent; no audio or transcript leaves Azure; the open dataset is features and
outcomes only. The child-safety floor is unchanged: the probes are covert framing, not deception about being an AI.

---

## 7. What would make it publishable

- **Gap in the outline.** `PAPER-OUTLINE.md` is Paper 1, "How much can an AI tutor know about one child?". It is a
  reliability Registered Report and is the right first paper. The comprehension detector is not in it.
- **Proposed Paper 2.** *"Did the child understand? Covert, verbal-fair detection of conceptual understanding with a
  guaranteed false-mastery rate in a Hindi-English AI tutor."* A Registered Report:
  - Stage 1 = §6.1 simulations (complete before children) plus the Study A preregistration;
  - Stage 2 = Study A results; Study B can be a companion paper.
- **Venues** [U: check policies]: *Journal of Educational Data Mining*, *IJAIED*, *Computers & Education*, LAK / EDM /
  AIED full papers; *Developmental Science* if the clinical-interview validity is the lead.
- **What makes it credible.**
  1. Preregistration on OSF with the conformal α and the baselines fixed.
  2. An independent statistician holds the sealed 30-day outcomes (the PAPER-OUTLINE COI mitigation).
  3. The strong baselines (an LLM transcript judge and the human teacher) are included, not only BKT.
  4. Every number carries the student-type label (real / simulated), per S12.
  5. Sim results are reported as mechanics, never efficacy.
- **Contributions a reviewer would accept as new [U].**
  1. Counterfactual-invariance evidence as a covert understanding detector.
  2. Emissions learned from the learner's own delayed transfer.
  3. A finite-sample false-mastery guarantee on parent-facing claims.
  4. The first Hindi/Hinglish child dataset of this kind, CC-BY, features and outcomes only.
  5. A short companion paper on the "pata nahi / yaad nahi" feeling-of-knowing split (S1).
- **Add to RESEARCH-PROGRAM.md:** a Study A row in §7.2, CMP in the constructs catalogue (§3.1), the conformal gate in
  §6.2, and Paper 2 in §8.11.

---

## 8. Order of work (the critical path to "the owner can test this pillar")

1. **G1 + G11** (1 day): the parent card shows, and the lesson does not loop.
2. **G2** (2 days): understanding evidence actually lands. Re-measure the settle rate on 30 production lessons.
3. **G4** (3 days): the parent sees the engine's verdicts, not the classifier's; the summary is fact-checked.
4. **G8** (1.5 days): test clock plus a 3-day scripted probe, so `understood` and the next-day check can be seen and
   tested.
5. **G3** (2 days): `live` sim policy, oracle and mutants. Publish the honest live number.
6. **G5** (3 days + battery): grader hardening, then X4.
7. **G6 + G7 + CMP** (6 + 10-15 days): code-graded and counterfactual evidence; X2/X3 must clear macro ≥ 0.70 and
   verbal gap ≤ 10 pp on the live policy.
8. **G9, G10** (2.5 days + labelling), then Phase 0 → Study A.

Steps 1-5 (about 9.5 days) make the pillar honestly testable. Steps 6-7 (about 4 weeks) are what could move the
live number past the bar. Study A (about 3-4 months including the 30-day follow-up) is what could make it a
breakthrough rather than a claim.

---

## Appendix A: raw production observations (copied, because the scratchpad is ephemeral)

Production kt_evidence for the 6 s-delay understander lesson (child deleted afterwards). Probe rows only:

| seq | cls | shape | outcome | span_ok |
|---|---|---|---|---|
| 705 | probe.why | C03 | 0 | true |
| 707 | probe.why | C03 | 0 | true |
| 712 | probe.errorspot | - | 0 | null (llm, so no U) |
| 714 | probe.why | C10 | 0 | true |

grade_audit for that lesson: 12 rows (3 why events × 4 targets): present/present/absent/absent;
present/partial/partial/contradicted; present/absent/present/partial. comp_facet_state: s1 U 0.437, s2 U 0.578, T 0.20,
both `shallow`.

The same lesson shape with a 0 s reply delay: seq 686/688/694/696/698 probe.why with span_ok false and **no**
grade_audit rows. Only the end-of-lesson teach-back (seq 699, C01) was graded (4 rows).

Parrot lesson, parent evidence rows for skill s2: `contrast P8 correct "yes, 1,00,000 has one lakh."`,
`why P2 correct "yes, 1,00,000 has one lakh."`, `practice P15 correct "1,25,000"`, `mixup_check P7 correct "1,25,000"`.

Grader probe (production chain, n = 2 reps per case):

| case | expected | got |
|---|---|---|
| verbatim key idea | recite | present ×2 |
| another key idea, irrelevant to the question | absent | absent ×2 |
| teacher parrot | absent | absent ×2 |
| own words EN | present | present ×2 |
| own words Hinglish | present | partial ×2 |
| answer only | absent | contradicted ×2 |
| "teacher told me …" | recite | present ×2 |
| comma: verbatim key | recite | present ×2 |
| comma: irrelevant key | absent | absent ×2 |
| comma: own words | present | present ×2 |

Grader latency was 641-1529 ms per call.

The simulator rerun took 166 s for 3 policies × 2 families and 63 s for 1 policy × 2 families (scratch copy;
`allow` threaded into the two `nextProbe` calls; policies `engine_live6`, `engine_live6_nogame`,
`engine_live_kititems`).
