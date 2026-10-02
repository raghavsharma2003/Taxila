# Comprehension engine: integration for the main loop

**Date:** 2026-10-02 · **Built by:** the comprehension workflow (owns `server/comprehension/**`, `server/persona/**`,
`evals/comprehension-sim/**`, `tests/comprehension-*.test.mjs`, `db/migrations/007_comprehension.sql`). · **Spec:**
`COMPREHENSION-ENGINE.md`. This workflow could not edit `server/director/**`, `server/routes/lesson.js`,
`server/compiler/**`, `server/learner/**`, `server/conductor/**` or `shared/**`. This file lists every call site and
the small diffs the main loop should apply there. Each diff is additive. None of them changes a KT byte for an event
log that carries no new fields.

## 0. What exists now

| module | pure? | stable signature |
|---|---|---|
| `server/comprehension/fuse.js` | yes | `fuseEvidence({ ledger, comp }, events, ctx) → { ledger, comp }`, `newLearnerState({ childId, classLevel })`, `stateDigest(s)` |
| `server/comprehension/state.js` | yes | `beliefFor(skillId, { ledger, comp, now, misconceptionsOf? }) → ComprehensionBelief`, `beliefView(state, { now })` |
| `server/comprehension/schedule.js` | yes | `nextProbe(skills, probeSession, { currentSkill, voice, skin }) → ProbePlan \| null`, `noteOutcome(sess, ev, belief)`, `markAsked(sess, plan, belief)`, `openSession(sess, dueSkillIds)` |
| `server/comprehension/budget.js` | yes | `newProbeSession({ sessionId, band, lessonSeed, surface, yesterday, targets })`, `recordTurn(sess, turn)`, `fits(sess, w)`, `lexiconHit(text)` |
| `server/comprehension/weave.js` | yes | `enqueue`, `onTopicPlanned(q, topicSkillIds, now) → { q, hosted }`, `expire`, `planChecks({ q, due, beliefs, now, openers })`, `wovenEvent(base, { skillId, host, hostNovel, correct })` |
| `server/comprehension/reteach.js` | yes | `reteachTrigger(belief, history)`, `selectReteach(ctx) → { move, armId, representation, repClass, offerPick, … }`, `armsFromKit(misconception)` |
| `server/comprehension/grade/*` | ops/numbers/span pure; `closed.js` calls Azure | `rKey`, `rOpt`, `rCatch`, `gradeClosed(req, { send?, models? })` (blind, span-checked, NA on failure) |
| `server/comprehension/probes/shapes.json` | data | 36 shapes C01-C36; `lintShapes()` must return `[]` |
| `server/comprehension/report/howweknow.js` | yes | `conceptCard(belief, { concept, lang, k7 })` → evidence rows + chips; throws on banned lexicon |
| `server/comprehension/store.js` | statement builders | `facetStmts`, `probeLogStmt`, `gradeAuditStmt`, `reteachStmt`, `weaveStmts`, `armPosteriorStmt`, `ratchetStmts` |
| `server/persona/*` | yes | `turnSignals(turn)`, `newPersonaState`, `personaStep(st, signals, { minute })`, `personaKnobs(st, ctx) → VibeDirective`, `vibeRow(directive)` |

`server/comprehension/index.js` re-exports all of it. Migration 007 is applied to the Neon database
(`schema_migrations` has `007_comprehension.sql`).

## 1. Prerequisite: the live lane must fold on the kt ledger

`server/routes/lesson.js` `planTurn()` still folds through the legacy `server/learner/bkt.js` `applyEvidence`. The engine
sits on the kt ledger (`server/learner/kt/ledger.js`) and has to read the same fold. Until the learner workstream moves
the route to the ledger, translate each legacy row with `fromLegacyEvidence` (`server/learner/kt/adapter.js`) and fold
the result through `fuseEvidence`. Do not fold through `ktFold` directly: `fuseEvidence` calls it per event and adds
the facets.

```js
// server/routes/lesson.js, planTurn(), after `const evidence = …evidenceFrom(…)`
import { fuseEvidence, beliefFor, noteOutcome } from "../comprehension/index.js";
import { fromLegacyEvidence } from "../learner/kt/adapter.js";
const ktEvents = evidence.map((ev, i) => ({ ...fromLegacyEvidence(ev, { id: `${lesson.id}:${childSeq}:${i}`, sessionId: lesson.id,
  sessionStartAt: lesson.started_at, at: c.now, episodeId: `${lesson.id}:${state.activeItemId}`, topicType }),
  // CE contract additions (all held inputs; never timing / vibe / affect):
  shapeId: state.pendingProbe?.shapeId, via: c.moduleOnly ? "module" : "dialogue", coincident: !!activeItem?.coincidentFor?.length,
  spanOk: cls?.spanOk }));
state.comp = fuseEvidence(state.comp ?? loadedComp, ktEvents, ctx);         // loadedComp: replay of kt_evidence at lesson start
for (const ev of ktEvents) state.probeSess = noteOutcome(state.probeSess, ev, beliefFor(ev.skillIds[0], { ...state.comp, now: c.now }));
```

## 2. Director (`server/director/state.js`): replace the why sampling with the scheduler

| where now | change |
|---|---|
| `initLessonState()` | add `probeSess: newProbeSession({ sessionId, band: bandOf(ctx.classLevel), lessonSeed: seed, targets: kit.skills.map(s => s.id), surface: { visual: lane !== "voice-only" } })` and `probeSess = openSession(probeSess, ctx.openers ?? [])` (openers come from the Conductor, §4) |
| every child turn (`step()` entry) | `probeSess = recordTurn(probeSess, { kind: item ? "item" : "teach", weight: fits(probeSess, 1) ? 1 : 0.25, skillId })`. The 0.25 branch is the covert role-play C21 form the spec moves practice into once the cap is near |
| `shouldAskWhy()` | becomes `const plan = nextProbe(skillsMap, s.probeSess, { currentSkill: item.skillId, voice: s.voiceSignals, skin: s.vibe?.probeSkin })`. Keep `LIMITS.whyConsolidating` only as a fallback for kits with no expectations |
| the move planner | if `plan` exists, the next move is `{ kind: "probe", shapeId: plan.shapeId, facet: plan.facet, kitRefs: plan.kitRefs }`, and the move shape comes from the shape record (`shapes.json` `name` + family). It must never be a written line |
| after the probe is asked | `probeSess = markAsked(probeSess, plan, belief)` and `recordTurn(…, { kind: "probe", weight: plan.testWeight, … })` |
| re-teach | on each graded turn: `const trig = reteachTrigger(belief, { uProbes, wheelSpin: kt.wheelSpin(k), nearTransferFailed })`; if `trig`, call `selectReteach({...})` and map `move` to `reteach` / `recap` / `prereq_descent` / `park`. Apply a cooldown of 2 graded items on that skill before the next trigger (the re-check, §5.4). Without it the simulator fired up to 25 re-teaches per child |

`skillsMap` = `{ [skillId]: { belief: beliefFor(skillId, …), topicType, kitInputs: kitInputsOf(kit, skillId), delayDays } }`
over the skills taught or practised this session, plus the openers. `kitInputsOf` lists the kit fields a shape needs (§4.3
of the spec): `expectations`, `misconceptions`, `diagnostic`, `items`, `characterView`, `myth`, `counterfactual`, `instances`,
`representations`, `weaveHosts`, `solver`. A kit that lacks a field disables the shapes that need it.

## 3. Compiler (`server/compiler/compile.js`): the VIBE section

```js
// SECTION_CAPS: add vibe: 60
// compileWithReport(): between "lesson" and "move"
{ id: "vibe", parts: input.vibe ? [{ text: vibeRow(input.vibe), drop: 4 }] : [] },
```
`input.vibe = personaKnobs(lessonState.persona, { reteach: move.kind === "reteach", strained: affect.strained, transferProbe: plan?.facet === "T", turnsSinceError })`.
Advance `lessonState.persona = personaStep(persona, turnSignals({ text, bargeIn, afterHumour, offeredHarder, acceptedHarder, afterError, retried, onsetZ, slowerPace, thinkQuestion }), { minute })`
once per child turn. `waitNudgeSec` and `endpointSilenceMs` go to the voice session config, not the prompt. The
TURN SHAPE line stays last. `checkVibeRow(row, INTERESTS)` must return `[]`, and `tests/kit-budget.test.mjs` should
run with a vibe row present. Note: that test failed at this workflow's baseline run on 2026-10-02
(`c7-english-ch03-t01-i07` voice · rung 3 needed 361 tokens against the 360 cap) and passed on the final run, after a
concurrent kit edit. The `last` section has 0-1 tokens of headroom on some items, so check the vibe row against the
total budget and not just its own cap.

## 4. Conductor (`server/conductor/planner.js`)

- **Session openers.** Before each live lesson, call `planChecks({ q: weaveQueue, due, beliefs, now, openers })` and pass
  `openers` into `initLessonState` ctx. `due` must include `ktView.due()` **and** every skill with `display ≥
  learned_today ∧ ¬flags.delayed ∧ now − anchorAt ≥ 20 h`. Without the second set, the next-day delayed check never
  runs: FSRS's first interval is usually > 1 day. The simulator found this, so it is not a guess.
- **Hosting.** Each time a topic is planned: `({ q, hosted } = onTopicPlanned(q, [topicSkillId], now))`. Pass `hosted[0]`
  to the item generator (kit isomorph, or Forge `ModuleRequest.want.subSkill`). The graded sub-step is
  `wovenEvent(base, { skillId, host, hostNovel, correct })`: one event on the earlier skill (E7).
- **Enqueue.** When a skill first reaches `learned_today`, call `enqueue(q, { childId, skillId, anchorAt, dueAt: nextReviewAt, hostCandidates })`.
  The host candidates are kit `weaveHosts` plus prerequisite-graph descendants in the same subject.
- Persist with `weaveStmts(child, q)` in the same transaction as the plan.

## 5. Learner ledger (`server/learner/kt/`): two diffs the simulator shows are needed

1. **Source weight for K.** `bktr.js temper(ev)` ignores `ev.via`. Game and module commits therefore move pL at full
   weight, although the spec (§1.1) says ×0.5 game and ×0.75 module. Diff: `x *= ({ game: 0.5, module: 0.75 })[ev.via] ?? 1;`.
   In the simulator, removing game evidence altogether raised `not_yet` accuracy from 0.62 to 0.75. Lucky game
   predictions push guessers' pL over the 0.6 "does it" line. The facets already apply the weight (`facets.js W_SRC`).
2. **Misconception logit cap.** `misconception.js` adds `log 6.9` per hit with no bound. After five hits, recovery
   from a successful re-teach needs more than 10 discriminating correct answers. `fuse.js` now drops hits on a
   misconception already at p ≥ 0.95 (`MIS_SATURATE`, deterministic, replay-safe). The cleaner fix is in the ledger:
   clamp the per-session misconception log-evidence at ±log 50, as K does.
3. `mode.js LAYER_TABLES.kt` should list `comp_facet_state, probe_log, grade_audit, reteach_attempts, rep_fluency,
   weave_queue` (= `store.js COMP_TABLES`) so the M0 ratchet deletes them. `store.ratchetStmts(childId)` does the
   same and is tested.

## 6. Contracts (`shared/learner.ts`, additive)

Add to `EvidenceEvent`: `via?, ebo?, shapeId?, weaveHost?, coincident?, unfamiliarContext?, deferenceDiscount?, spanOk?`
(spec §1.4). Add `CompState`, `FacetState`, `ComprehensionBelief`, `BeliefReason`, `ProbePlan`, `WeaveEntry`,
`ClosedLabelRequest/Result` and `VibeDirective` as written in spec §2.5, §3.1, §4.2 and §6.4. The runtime shapes are
exactly what `state.js`, `schedule.js`, `weave.js`, `grade/closed.js` and `persona/adapter.js` return.
`tests/learner-shared.test.mjs` can assert `STATES` equality the same way it asserts `OUTCOMES`.

## 7. Parent report (`server/routes/parent.js`)

For each concept, call `conceptCard(beliefFor(…), { concept: kitTitle, belief: misconception.belief, lang: guardianLang, k7: false })`.
It returns `{ rows, chips }`. It throws if any string contains a banned word, so a template edit cannot ship
"weak" / "kamzor" / state names. `k7` stays false until the K7 calibration gate passes.

## 8. Grading in production

`gradeClosed()` routes to `DEPLOY_GRADE` (default `DeepSeek-V4-Pro`) and falls back to `DEPLOY_GRADE_FALLBACK`
(default `taxila-brain`). Both are Azure Foundry Direct deployments. Run it off the reply path: the why's move goes out
at once, and the verdict lands within the next turn. Write `gradeAuditStmt(child, auditRow(res, …))` for every
verdict. Until M-GRADE κ ≥ 0.7, the facet fold keeps the 0.7-diagonal LLM confusion (the `grader: "llm"` default).

## 9. Gates

`npx tsc -b && npm test`. The `tests/comprehension-*.test.mjs` suites hold the CE invariants: replay = online, E2
drops, CEI1-CEI7, the budget caps, BE2, blind grader requests, the span check, the re-teach exploration floor,
VI-1…VI-5 and the 007 NM-3 scan. Rerun the simulator (`node evals/comprehension-sim/run.mjs --seeds 30`) after any
change to `server/comprehension/**` and diff it against the last results file. Per SIM10, evals stay in their own
commit, separate from app code.
