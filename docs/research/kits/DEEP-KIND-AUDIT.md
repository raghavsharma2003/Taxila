# Deep-kind audit of the teaching kits (2026-10-15)

Context node `open-r142-kit-deep-kinds`. Some kit items carry a "deep" kind but are really recall or trivial. Examples:

- "6 chidiya, saari udd jaayein, kitni bachengi?" is tagged predict, but it is a one-step sum.
- The sim lab's "पायल कैसी आवाज़ करती थी?" was called an error_spot. In this tree it is `c2-hindi-ch03-t01-i02` and is tagged **practice**. Its siblings are the real problem: `i07` (predict, "अब माला क्या करेगी?") and `i11` (why). Both models read both of those as shallow.

The learner model reads a right answer on a deep kind as stronger evidence of understanding. So these items inflate "understood".

This document does four things. It measures how many such items there are, says exactly what a kind changes in the code, and proposes the least invasive fix. That fix is a patch. It has not been applied, and nothing under `server/` or `data/` was edited.

| | |
|---|---|
| Per-item record | `docs/research/kits/deep-kind-audit-2026-10-15.json` (`{ meta, items: [{ topicId, itemId, kind, a, b, agreed, verdict, apply, human? }] }`) |
| Proposed patch | `docs/research/kits/deep-kind-fix-2026-10-15.patch`. It applies cleanly to `f444f064` with `git apply --check`. |
| Harness | `evals/kit-deep-kinds/`: items, classify, summarize, spot, apply, and the human read file `human-2026-10-15.json` |

## Headline

- **Deep-tagged items audited:** 7,697 of 12,398. Kinds: error_spot, predict, why, contrast, near_transfer, far_transfer and translate_rep. Teachback is excluded.
- **Calls:** 15,394 calls to two models from different families, with 0 unresolved failures. 11 calls were retried once and then succeeded.
- **Both models say shallow:** 1,941 items (25.2%).
  - The three named kinds: error_spot 25 of 1,043 (2.4%), predict 288 of 1,246 (23.1%), why 250 of 1,292 (19.3%).
  - The others: contrast 36.0%, near_transfer 38.5%, far_transfer 25.2%, translate_rep 29.5%.
- **Model disagreement:** 33.9% of items are split. Raw agreement is 0.661 and Cohen's κ is 0.315. Split items stay deep under the both-must-agree rule.
- **Human read:** 112 items in total.
  - Stratified sample: I disagree with 4 of 60 agreed-shallow items (6.7%, Wilson 95% CI 2.6–15.9%) and 2 of 30 agreed-deep items (6.7%, 1.8–21.3%).
  - Census of all 25 agreed-shallow error_spot items: I disagree with **12 of 25**. Those items show a stated false claim that the child refutes from a fact. The rubric counts that as the error_spot move. Details are below.
- **Proposed mark set:** `apply: true` on **1,927** items, which is the 1,941 minus the 14 I overruled. The kind, key, grading and pose of each item stay as they are. Only the evidence weight of its answer changes.
- **Skill impact:** a skill keeps at least one real deep item in 2,482 of 2,987 skills, down from 2,787. 505 skills, up from 200, would fall to the agent lane's "no deep item" rule (two different items right). Class 1 loses the most: 68 skills.

## Step 1: what a kind changes (the mechanism)

The pipeline runs in both lanes, Director and agent.

1. `server/director/state.js evidenceFrom` turns the classifier verdict into an evidence row. Its `probe` comes from `items.js probeFor(item)` = `PROBE_FOR_KIND[kind]`:
   - near_transfer → P3, far_transfer → P4, predict → P5, error_spot → P6, why → P2;
   - contrast → P8, translate_rep → P14, practice → P15.
2. `server/learner/live.js answerEvents` and `server/learner/kt/adapter.js fromLegacyEvidence` map that row to a KT event class. `LEGACY_PROBE_CLASS` maps P2 → `probe.why`, P3/P4 → `probe.transfer.*`, P5 → `probe.predict` and P6 → `probe.errorspot`. Everything else becomes `item.open` by the hint ladder.
3. `server/comprehension/fuse.js` folds that event into the ledger (K) and the U / T facets.

What the class, and so the kind, changes:

| Where | What the kind decides | Effect of a shallow item tagged deep |
|---|---|---|
| `kt/outcomes.js EMISSIONS` | Likelihood of a right answer (LR k/u): item.open C0 8.0, why full 7.5, transfer.far 8.1, transfer.near 5.7, errorspot caught_fixed 5.0, predict right 1.7 | The K weight is of similar size. The class is its own 1/j budget (`bktr.js spend`), so a probe event is never discounted by the plain items already answered in that session. |
| `comprehension/params.js U_CLASSES / T_CLASSES`, `facets.js` | Only probe.why / teachback / errorspot / predict inform **U** ("explains"). Only transfer.near / far inform **T** ("travels"). | From the prior 0.2, one right answer moves U or T a long way (at R = 1): why → U 0.65, past `U_FRAGILE` 0.6, so the ladder leaves "shallow". errorspot → U 0.56. far_transfer → T 0.67, past `T_UNDERSTOOD` 0.6. Short-key shallow items are usually **code-graded** (exact / number), so the E6 span check (which only gates LLM positives) never applies to them. |
| `kt/outcomes.js isGenerativePass`, `kt/ledger.js advanceDisplay` | why full, teachback high, a transfer pass or errorspot caught_fixed is criterion (b) of `learned_today`. It also raises a same-episode FSRS grade to 4. | One shallow "why" or "transfer" right answer plus one unaided practice item can make the skill "learned today". |
| `kt/ledger.js CHECK_CLASSES` | transfer.near and errorspot can be the delayed check | A recall item can pass the next-day check |
| `reports/truth.js`, `routes/parent.js` (probe → kind) | The parent's "how we know" | The parent reads "spotted the mistake" or "predicted" for a recall answer |
| `agent/read.js depthOf` (the agent lane's live read, every graded turn, bar 0.8) | Likelihood table by depth: deep (why, predict, error_spot, far_transfer), mid (contrast, near_transfer, translate_rep), plain. Right-answer LR for understood vs partly: deep 3.2, mid 2.1, plain 1.8. | Measured in the new test: one practice item right plus one error_spot right gives a posterior of 0.816, so the read is **understood**. The same two answers with the error_spot marked plain give 0.715, so the read is partly. |
| `agent/agent.js earnedRead / deepAvailable / untested` | "understood" needs a right answer on a deep kind, and a miss is only recovered by 3 right answers including a deep one | A shallow item satisfies the deep requirement |
| `agent/prompt.js offeredItems` (needsDeep, deepLeft) | A skill with plain answers right is offered **only** its deep items | The shallow "deep" item becomes the deciding question |

What the kind also decides, outside the evidence. The proposed fix leaves all of these alone:

- **Grading path.** `classify.js OPEN_KINDS = {why, teachback}` makes the target open, so "partial" is allowed and the answer is judged on its key ideas. A P2 answer is deferred to the held blind grader in `comprehension/later.js` (DeepSeek-V4-Pro → taxila-brain, R-EXP plus a code span check) and lands at the next turn.
- **Pose.** `shapes.js KIND_NOTE` gives each kind its teacher move. error_spot is "present it as your own working with one planted mistake".
- **Engine mode.** `modules.js PREDICT_KINDS` opens predict / contrast / translate_rep in predict mode.
- **Selection.**
  - `items.js` gates error_spot behind pKnown ≥ 0.7 and keeps it out of the openers, with `KIND_ORDER` setting the queue order.
  - `state.js shouldAskWhy / probePlanFor` never ask a follow-up why on a why item.
  - `state.js hardestFor` and `session/confirm.js CONFIRM_KINDS` also select by kind.

**Why I am not proposing a retag.** Retagging a why item to practice would change several things at once:

- its grading (closed key, no partial, no held blind grader);
- its pose;
- the Director's choices around it.

The keys were verified by the blind solver against items as posed.

A discount carried as a new KT event flag would be no better. It needs a `kt_evidence` column and an `eventFromRow` change, or replay stops matching the online fold. Routing the answer's `probe` to the plain class needs neither, because `cls` is already stored (`learner/model.js eventFromRow`).

## Step 2: method

- **Scope.** Every item in `data/kits/c*.json` whose kind is in `agent.js DEEP_KINDS` minus teachback: 7,697 items over 830 topics, read raw from the kit files. None of them has a disputed key.
- **Models.** Both run on Azure Direct through the repo client `server/azure.js chat()`:
  - A = `taxila-brain` (gpt-5.6-sol, `reasoning_effort` medium, 4000 max tokens);
  - B = `DeepSeek-V4-Pro` (800 max tokens).
  - Both use `json_object` mode, and the JSON is validated in code.
  - Neither model was unusable, so grok was not needed.
- **Isolation.** `evals/kit-deep-kinds/env.mjs` runs before any server import. It does three things:
  - empties `DATABASE_URL` / `DATABASE_URL_DIRECT` and every test DB URL;
  - sets `TAXILA_TRACE=off`, blanks storage, and leaves no overflow twins;
  - points `AZURE_OPENAI_ENDPOINT_CHAT` / `_KEY_CHAT` at the `_SIN` account.

  Commands ran with `NODE_USE_ENV_PROXY=1` and stdin from `/dev/null`. No child data was used or needed.
- **Load.** At most 8 calls were in flight. Each call was retried once on 429, 5xx or a timeout, after 8 s for a 429 and 1.5 s otherwise. A failure is recorded and never treated as a verdict; there were none left over.
  - Wall time: 67 min.
  - Tokens: A 4.48 M in / 0.86 M out, p50 2.6 s per call. B 4.62 M in / 0.12 M out, p50 1.2 s.
- **Input per item.** KIND, SKILL (the skill title), PROMPT_EN, PROMPT_HI and KEY (the verified answer). The class level is not given.
- **Rubric.** Written as shapes and codes, with no sentence a model could hand back (`rubric.mjs`, `deep-kind-rubric-v1-2026-10-15`).
  - **Shallow codes:** recall, story_detail, one_step, read_off, no_move (the tagged move is absent), label_pick.
  - **Deep codes:** error_in_work, reasoned_outcome, cause_mechanism, multi_step, new_case_mapping, form_change, discriminate.
  - Each kind's deep move is stated in one line.
  - **Tie-break:** "would a child who only memorised the lesson's facts, or did one step, reach KEY? yes → shallow".
- **Rule.** An item is `shallow` only when **both** models say shallow. `apply` = shallow and not overruled by my read.

## Results

| kind | n | A shallow | B shallow | both shallow | both deep | split | disagree rate | failed |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| error_spot | 1043 | 50 (4.8%) | 263 (25.2%) | **25** (2.4%) | 755 | 263 | 25.2% | 0 |
| predict | 1246 | 483 (38.8%) | 514 (41.3%) | **288** (23.1%) | 537 | 421 | 33.8% | 0 |
| why | 1292 | 394 (30.5%) | 503 (38.9%) | **250** (19.3%) | 645 | 397 | 30.7% | 0 |
| contrast | 1204 | 574 (47.7%) | 708 (58.8%) | **433** (36.0%) | 355 | 416 | 34.6% | 0 |
| near_transfer | 1331 | 658 (49.4%) | 875 (65.7%) | **513** (38.5%) | 311 | 507 | 38.1% | 0 |
| far_transfer | 794 | 348 (43.8%) | 318 (40.1%) | **200** (25.2%) | 328 | 266 | 33.5% | 0 |
| translate_rep | 787 | 289 (36.7%) | 513 (65.2%) | **232** (29.5%) | 217 | 338 | 42.9% | 0 |
| **all** | 7697 | 2796 (36.3%) | 3694 (48.0%) | **1941** (25.2%) | 3148 | 2608 | 33.9% | 0 |

| class | n | both shallow | split (disagree rate) |
|---|---:|---:|---:|
| 1 | 435 | **237** (54.5%) | 125 (28.7%) |
| 2 | 453 | **205** (45.3%) | 153 (33.8%) |
| 3 | 636 | **194** (30.5%) | 215 (33.8%) |
| 4 | 827 | **256** (31.0%) | 312 (37.7%) |
| 5 | 788 | **200** (25.4%) | 279 (35.4%) |
| 6 | 1221 | **300** (24.6%) | 427 (35.0%) |
| 7 | 1365 | **251** (18.4%) | 473 (34.7%) |
| 8 | 926 | **147** (15.9%) | 298 (32.2%) |
| 9 | 1046 | **151** (14.4%) | 326 (31.2%) |

| subject | n | both shallow | split (disagree rate) |
|---|---:|---:|---:|
| maths | 2725 | **595** (21.8%) | 871 (32.0%) |
| science | 1532 | **253** (16.5%) | 489 (31.9%) |
| evs | 693 | **155** (22.4%) | 238 (34.3%) |
| sst | 622 | **149** (24.0%) | 193 (31.0%) |
| english | 1076 | **359** (33.4%) | 437 (40.6%) |
| hindi | 1049 | **430** (41.0%) | 380 (36.2%) |

- **Shallow codes among the agreed-shallow items.** A: recall 673, no_move 367, one_step 397, label_pick 272, read_off 141, story_detail 91. B: recall 1,096, one_step 535, read_off 174, story_detail 87, label_pick 33.
- **Who calls more items shallow.** B is the more lenient model: of the splits, 1,753 are B-only shallow and 855 are A-only. The gap is widest on error_spot (238 against 25), where A almost never calls an item shallow.
- **Where shallow items concentrate.** Shallow-tagged-deep items fall steeply with class, from 54.5% in class 1 to 14.4% in class 9. They are highest in the language kits (Hindi 41.0%, English 33.4%), where "predict / why" items are mostly story-detail recall.

## Spot check (my reading, one rater)

**Sample.** `spot.mjs` drew a stratified round-robin over the kinds. It was drawn from the items already finished at 10:52 UTC, which is a hash-random subset of the run. I checked that the final verdicts of all 90 sampled items are unchanged.

- **Agreed-shallow, 60 items.** I disagree with 4 (6.7%):
  - `c7-science-ch10-t01-i09`: the croton leaf. The chlorophyll is masked by red pigment, so the child must carry the idea over to a new case. Deep near_transfer.
  - `c7-science-ch04-t01-i10`: "all metals are hard and solid, none can be cut with a knife". A shown claim refuted with mercury and sodium is the error_spot move.
  - `c7-sst-ch16-t01-i11`: "nothing was built in the 11th and 12th centuries". A sweeping claim refuted with examples.
  - `c9-science-ch05-t01-i09`: ORS with too much salt. Osmosis is a mechanism, not a fact.

  A further 7 were borderline and are counted as agree. The pattern: a one-operation word problem that *is* the skill's own procedure (for example 2/3 ÷ 1/9), or an answer of everyday common sense.
- **Agreed-deep, 30 items.** I disagree with 2 (6.7%). Both stay deep, because the rule only lets the models mark items shallow:
  - `c4-evs-ch01-t02-i04`: asking for water by gesture. Any child can say this without the lesson.
  - `c6-maths-ch05-t02-rl-o2`: the sieve over 30–40 on the same chart is the procedure itself, with no new case.

  4 more were borderline.
- **Error_spot census.** The sample held only 3 error_spot items, and I disagreed with 2 of them, so I then read **all 25** agreed-shallow error_spot items.
  - 13 are truly shallow: the error is spelled out in the prompt, or the check is one sum or a label. Examples: "64 − 29 = 45, check me", "twenty-ten after 29?" and "'tal' or 'taal'?".
  - 12 present a false claim the child must refute from a fact. Examples: xylem and phloem swapped, the Shore Temple "by the Rashtrakutas in Bengal", "a bank only locks money away", and angles in the same segment.

  For those 12 the rubric's error_spot move ("shown claim with a planted mistake → find, fix") is present, and the models resolved the overlap toward "recall". **This is a rubric boundary, not noise.** The 12 are kept deep. The ids are in `human-2026-10-15.json`.
- **All reads.** 112 items read, 16 disagreements. 14 of them are agreed-shallow items, so 1,941 − 14 = **1,927** items are `apply`.

## Step 3: the proposed least-invasive fix

**One optional kit-item field, `deep: false`.** It means "this deep-tagged item is recall, one step or read-off". Its kind, key, acceptable forms, hints, `verified`, classifier target, pose and the Director's choices all stay as they are. Only its **answer** counts as plain evidence:

| Reader | Change |
|---|---|
| KT ledger and U / T facets | `evidenceFrom` uses `evidenceProbeFor(item)`, which gives P15 for a `deep: false` item. Its answer becomes `item.open` by the hint ladder: no U / T facet, no generative pass, no errorspot / transfer delayed check, and "practice" in the parent report. **No migration and no new event field.** `cls` is already stored in `kt_evidence`, so replay equals the online fold. The volunteered-reason P2 row keys on what was *asked* (`probeFor`), so a why-kind item's answer cannot come back as a second probe.why. |
| Agent evidence read (`read.js`) | A graded entry with `plain: true` uses the `plain` likelihood table |
| `earnedRead` / `deepAvailable` / `untested` (`agent.js`) | `deepEntry = DEEP_KINDS.has(kind) && !plain`. A skill whose deep items are all `deep: false` takes the existing "no deep item" rule. |
| `offeredItems` (`prompt.js`) | needsDeep and deepLeft count only real deep items, so a skill is never narrowed to a `deep: false` item |
| Loader (`content/kits.js normalizeKit`) | Passes `deep: false` through (it whitelists item fields) and drops any other value |
| Contract / schema | `KitItem.deep?: false` in `shared/contracts.ts`; one comment line in `data/kits/SCHEMA.md` |

One behaviour shift beyond the weights affects **why-kind** items with `deep: false` (the apply set has 250). Their evidence verdict becomes the turn's classifier label against the key, as for every practice item. The held blind grader in `later.js` no longer grades them. The classifier target is unchanged: it is still open, with partial allowed and key ideas. If the main loop wants the held grader to stay on why items, it can leave those 250 out of the mark set. They would then still feed U through the old path.

**The exact code diff** (the patch also adds `tests/r143-kit-deep-false.test.mjs` and the SCHEMA.md line):

```diff
--- a/server/director/items.js
+++ b/server/director/items.js
@@ -18,6 +18,15 @@
 export const probeFor = (item) => (item.diagnostic ? "P7" : PROBE_FOR_KIND[item.kind] ?? "P15");
+/** Deep-kind audit (2026-10-15): ... `deep: false` ... its ANSWER is plain evidence ... */
+export const plainEvidence = (item) => item?.deep === false;
+/** The probe an answer to this item is EVIDENCE as (probeFor is what is asked; they differ only for a deep: false item). */
+export const evidenceProbeFor = (item) => (plainEvidence(item) && !item.diagnostic ? "P15" : probeFor(item));
--- a/server/director/state.js
+++ b/server/director/state.js
-import { buildPracticeQueue, findItem, isomorphicFor, probeFor, promptFor, ...
+import { buildPracticeQueue, findItem, isomorphicFor, probeFor, evidenceProbeFor, promptFor, ...
@@ evidenceFrom
   const why = s.pendingWhy === item.id;
-  const probe = why ? "P2" : probeFor(item);
+  const asked = why ? "P2" : probeFor(item);
+  const probe = why ? "P2" : evidenceProbeFor(item);
@@
-  if (probe !== "P2" && cls.outcome === "correct" && hintsUsed === 0 && cls.reason) {
+  // (a why-kind item's answer IS its reason: a deep: false one must not come back as a volunteered why)
+  if (asked !== "P2" && cls.outcome === "correct" && hintsUsed === 0 && cls.reason) {
--- a/server/agent/read.js
+++ b/server/agent/read.js
@@ posteriorOf
-    const table = P[depthOf(x.kind)];
+    // a deep-tagged item the deep-kind audit marked plain (graded entry `plain`, kit item deep: false) weighs as plain
+    const table = P[x.plain ? "plain" : depthOf(x.kind)];
--- a/server/agent/agent.js
+++ b/server/agent/agent.js
-import { promptFor } from "../director/items.js";
+import { promptFor, plainEvidence } from "../director/items.js";
 export const DEEP_KINDS = new Set([...]);
+/** A graded answer that is deep evidence: a deep kind, and not an item the deep-kind audit marked plain (deep: false). */
+const deepEntry = (x) => DEEP_KINDS.has(x.kind) && !x.plain;
@@ earnedRead
-    if (after.length < 3 || (deepAvailable && !after.some((x) => DEEP_KINDS.has(x.kind)))) return "partly";
+    if (after.length < 3 || (deepAvailable && !after.some(deepEntry))) return "partly";
-  const deep = right.filter((x) => DEEP_KINDS.has(x.kind));
+  const deep = right.filter(deepEntry);
@@ withEvidenceRead
-  const untested = ... && !g.some((x) => DEEP_KINDS.has(x.kind));
+  const untested = ... && !g.some(deepEntry);
@@ applyAgentTurn
-      graded: [...(learner[k]?.graded ?? []), { item: card.id, kind: card.kind, g }].slice(-10),
+      graded: [...(learner[k]?.graded ?? []), { item: card.id, kind: card.kind, g, ...(plainEvidence(card) ? { plain: true } : {}) }].slice(-10),
-    const deepAvailable = (kit.items ?? []).some((i) => i.skillId === k && DEEP_KINDS.has(i.kind) && i.kind !== "teachback");
+    const deepAvailable = (kit.items ?? []).some((i) => i.skillId === k && DEEP_KINDS.has(i.kind) && i.kind !== "teachback" && !plainEvidence(i));
-    const untested = ... && !g.some((x) => DEEP_KINDS.has(x.kind));
+    const untested = ... && !g.some(deepEntry);
--- a/server/agent/prompt.js
+++ b/server/agent/prompt.js
-import { promptFor } from "../director/items.js";
+import { promptFor, plainEvidence } from "../director/items.js";
   const DEEP = new Set([...]);
+  const deepItem = (i) => DEEP.has(i.kind) && !plainEvidence(i);
-    && !(v.graded ?? []).some((x) => x.g === "correct" && DEEP.has(x.kind))).map(([k]) => k));
+    && !(v.graded ?? []).some((x) => x.g === "correct" && DEEP.has(x.kind) && !x.plain)).map(([k]) => k));
-  ... (needsDeep.has(i.skillId) && DEEP.has(i.kind) ? -50 : 0)
+  ... (needsDeep.has(i.skillId) && deepItem(i) ? -50 : 0)
-  const deepLeft = new Set(open.filter((i) => needsDeep.has(i.skillId) && DEEP.has(i.kind)).map((i) => i.skillId));
-  return open.filter((i) => !(deepLeft.has(i.skillId) && !DEEP.has(i.kind) && ...))
+  const deepLeft = new Set(open.filter((i) => needsDeep.has(i.skillId) && deepItem(i)).map((i) => i.skillId));
+  return open.filter((i) => !(deepLeft.has(i.skillId) && !deepItem(i) && ...))
--- a/server/content/kits.js
+++ b/server/content/kits.js
         ...(["recall", "apply", "reason", "transfer"].includes(it.demand) ? { demand: it.demand } : {}),
+        // deep-kind audit (director/items.js plainEvidence): a deep-tagged item whose answer is plain evidence
+        ...(it.deep === false ? { deep: false } : {}),
--- a/shared/contracts.ts
+++ b/shared/contracts.ts
   verified?: { solverAnswer: string; agrees: boolean; note?: string };
+  /** Deep-kind audit: false = a deep-tagged item that is recall / one step / read-off; its answer is plain evidence (...) */
+  deep?: false;
```

The full, applicable text is in the `.patch` file.

**Marking the kits** is a separate, data-only step, and I did not run it on `data/kits`. `node evals/kit-deep-kinds/apply.mjs --write` inserts `"deep": false` right after `"kind"` on the 1,927 apply items, across 38 files. It keeps each file's own serialisation (indent 1 or 2, trailing newline or not) and refuses any file that would not round-trip byte-identical. The default is a dry run.

**Checked in a scratch copy of `f444f064`, never in the repo.** "Unmarked" means the patch applied with the kit files unchanged; "marked" means the 1,927 `deep: false` fields written in.

- **New test file.** `tests/r143-kit-deep-false.test.mjs`, 5 tests, all passing. It covers:
  - the loader keeps the field;
  - the classifier target and the asked probe are unchanged;
  - P15 evidence and an `item.open` event, with no deferred probe.why;
  - the evidence read: 0.816 → understood unmarked, and the same answers → partly when marked;
  - earnedRead, applyAgentTurn and offeredItems.

  It fails to import on the unpatched tree.
- **Existing tests.** The 80 test files that import the touched modules, minus 2 that spawn processes:

  | Tree | Tests | Pass |
  |---|---:|---:|
  | Unpatched | 808 | 796 |
  | Patched, kits marked | 813 | 801 |

  The patched run is the 808 plus the 5 new tests. The **same 12 failures** appear in both runs, all environment: the scratch copy has no `db/`, `docs/` or `evals/`.
- **Smaller set on the unmarked patch.** `r5-agent`, `r5-agent-evidence-read`, `r5-read`, `state`, `director-truth`, `learner-live`, `content` and `kit-budget` pass 87/87.
- **Loader check on the marked copy.** 1,911 of the 1,927 marks survive `normalizeKit`. The other 16 items are dropped at load as before. The total number of loaded items is identical (12,289) with and without the marks.
- I did not run the gate (`tsc` / `vite` / `npm test`), as instructed.

## What I could not measure

- **The size of the inflation in real lessons.** I did not measure how often a shallow deep-tagged item was the deciding answer for an "understood" read. That needs TEST traces or a DECIDED sim lab run; no child data, database or server was touched. The evidence-read example above is arithmetic, not an observed rate.
- **Whether `deep: false` items are actually easier for "partly" children.** This is the empirical claim behind the fix. It needs response data, for example per-item difficulty by state. The sim lab's DECIDED child cannot answer it, because its pCorrect table (`dc-r142-simlab-decided-child`) is keyed on kind. That table should read the same predicate once this lands.
- **Validity beyond one rater.** One human (me) read 112 items. Model agreement is modest (κ 0.315). I made no test-retest run, used no rubric variant and no third model.
- **The 2,608 split items, which I did not read.** They stay deep by rule. Some are surely shallow, and B-only splits outnumber A-only splits 2:1.
- **Items outside the scope.** Teachback items, the misconception diagnostics (pseudo-items of kind contrast, built from kit misconceptions), the Forge / mini-kit items and the warm-up items were not audited.
- **The pose mismatch is not fixed.** The 13 error_spot items in the apply set are still posed as "your own working with one planted mistake", and why-kind items still skip the follow-up why. Fixing that needs a re-tag plus blind-solver re-verification: a content pass, not this patch.
