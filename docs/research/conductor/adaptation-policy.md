# Adaptation policy: how the Conductor changes a child's day from what it has learned about the child

**Date:** 2026-10-02 · **Status:** design doc for the gap-fill fragment `adaptation.contracts.ts` (G2) and
`adaptation-hysteresis-sim.py`, written in gap-fill **G1-adaptation-policy**, and ruled into `CONDUCTOR.md` as
revision 3 (§0, X41-X48). **Precedence:** `CONDUCTOR.md` overrides this file wherever they disagree; this file
overrides the contract fragment's comments (the fragment was amended in this pass to match, see §11).
**Files that go with it** (all in `docs/research/conductor/`):
- `adaptation.contracts.ts`: the types, `resolveKnob`, `registerConstraint`, `RULES`, `T`. Type-checks alone with
  `npx tsc --ignoreConfig --noEmit --strict --target es2022 adaptation.contracts.ts`. That passed, 2026-10-02.
- `adaptation-hysteresis-sim.py`: picks the latch constants. It keeps the original seed-11 tables and adds the G1
  multi-seed rerun (§8). `python3 adaptation-hysteresis-sim.py` takes < 2 s.
- `adaptation-state-size.py`: the byte size of `ConductorState.adapt` at maximum fill (§7.1).
- `adaptation-worked-example.mjs`: runs the §5.4 worked example and the I-A1/I-A2 negative controls through the
  **real** `resolveKnob` and `registerConstraint`, using Node 22's native type stripping.
  `node adaptation-worked-example.mjs` printed 17/17 expectations met, 2026-10-02.

**Tags:** **[V]** checked against the primary source in this session. **[S]** secondary, or cited from a sibling doc
without being re-fetched. **[U]** an unmeasured design default. **[I]** inference. **[sim]** computed by a script in
this folder, with its n and seeds given. Short refs follow CONDUCTOR: `kt §2.5` = `learner/kt-algorithms.md` §2.5,
`srl` = `learner/metacognition-srl.md`, `MI` = `learner/motivation-interest.md`, `need` = `learner/need-goals.md`,
`vibe` = `learner/vibe-temperament.md`, `LS-n` = `learning-science.md` §6 rule n.

---

## 0. Decisions on one screen

| # | decision | why | reversed by |
|---|---|---|---|
| AD1 | **Adaptation is code that the Conductor runs at three moments only**: the plan (`planDay`), the night fold (`foldNight`), and two learner events (`learner.params_refit`, `skill.milestone{wheel_spin}`). It is never a model call, and it never runs inside a lesson | determinism (I-C6), replay (§3.11), and the Director already owns within-lesson adaptation (vibe §4.6, MI §2.5) | CM3 clears an LLM planner, which may then *propose* knob values that this policy still arbitrates |
| AD2 | `planDay(inputs: PlannerInputs): DayPlan` is **pure over its argument**. The view is read *before* the call, through the recording `ViewReader`, into `inputs.view`. `inputsHash` = `'pi1:' + sha256(JCS(inputs))`, with RFC 8785 canonical JSON and values quantised first (§3) | makes CONDUCTOR §3.7 "deterministic in `inputsHash`" a property test instead of a hope | none expected; a change of hash layout bumps `pi1` → `pi2` |
| AD3 | **Fifteen rules, R0-R14** (§4). R0 is the band template plus the §4.4 priority stack, and it is always present. R1-R14 each name a trigger, the `Fresh<T>` keys they read, one knob (plus listed side knobs), one layer, latch thresholds, a stale fallback, and a source | the owner's "adapts to the student, the vibe, the course and learning ability" was specified only as one-liners (CONDUCTOR §3.3, §4.4) | each threshold has a CM-A measurement (§9) |
| AD4 | **Precedence is safety > limits > budget > KT > SRL > vibe > interest**, applied by `resolveKnob` per knob. The three constraint layers are computed by the *same pure predicates* the `GUARDS` run, so the guards are a no-op on planner output (I-A10) | vibe R6 item 54 asked for exactly this arbitration rule; one predicate per limit means the planner and the guards cannot disagree | a guard narrowing a `plan.adopt` in production (CM-A9 > 0) |
| AD5 | **Budget may constrain only the voice rung (`laneMix`), and every lane constraint must keep `tap`** (`registerConstraint`, I-A2) | `resolveKnob` drops a lower-layer constraint that would empty the domain. An empty budget domain would therefore let realtime through. That was shown in `adaptation-worked-example.mjs` | — (a safety property) |
| AD6 | **A single bad close no longer shortens tomorrow.** It only makes the next opener success-first. Segments shorten only while the R1 latch is on (3 of the last 4 closes strained or tired; off after 3 fine closes) | CONDUCTOR §3.3's one-close rule is the `1/1, r=1` row of the sim: it latches 99.9% of steady children and flips 9.9 times in 8 weeks [sim] | CM-A1 shows that the one-close response helps the next close and the latch does not |
| AD7 | **R2 (late sittings) uses a per-child late-vs-early contrast** over the last 16 closes (≥ 4 each, gap on ≥ .40, off < .20), and does not assume that evenings are bad | no study measures 20:00+ sittings in Indian children. TRAILS (n = 2,167, ages 10-12) found time-of-day effects only on demanding tasks, and only between 08:30 and 13:00 [V] | CM-A2 |
| AD8 | **R6 (pace) is asymmetric**: up after 2 agreeing nightly refits at η ≥ +0.5, down after 3 at η ≤ −0.5, and back to 1 after 2 refits inside ±0.25. B1 is capped at 1 | ±0.5 is one prior sd of η (kt §2.5). Withholding new skills from a child who is not slow costs more than an extra one offered to a child who is not fast | CM-A3 |
| AD9 | **The night fold closes the learning day** exactly once per `learningDay` (`adapt.foldedDay`), with a catch-up on the first event of a later day (§7.2). It evaluates the R1, R2, R3, R7 and R14 latches, expires TTLs, trims the ring and re-arms wakeups. It never builds tomorrow's plan (X10) | latches evaluated in one place, once a day, are replayable and cannot fire inside a shown day | — |
| AD10 | `CloseLite.vibeClose` is the only cross-session vibe fact the Conductor keeps: 3 values, ≤ 16 closes, ≤ 14 days, never on a parent surface or the routine card (V27), and erased with the child | CONDUCTOR §2.2 already made `vibeClose` a re-plan input. This bounds it. Vibe's default `session_adaptive` mode otherwise keeps nothing behavioural across sessions (vibe §4.10) | a DPDP opinion that a 3-valued session outcome may not persist, in which case R1/R2 read only the child's explicit "thak gaya" statements |

---

## 1. What "adapts" means here: the owner's four axes, mapped to layers

The owner asked that everything adapt to "the student, the vibe, the course, and learning ability". In the
Conductor each axis is a different evidence class, with a different writer, and therefore a different layer.

| owner's axis | what it is in data | sole writer (`ViewWriter`) | layer | knobs it may move (`MAY_PROPOSE`) |
|---|---|---|---|---|
| learning ability | pL per skill, wheel-spin, FSRS due, η (learning speed), θ (level) | `kt.ledger`, `kt.refit` | `kt` | segment floor, review share, representation, prereq check, pace, foundation share, topic, opener (re-anchor), success-first after a gap |
| the course | syllabus position, school pointers, test windows, parent goals, gap-to-grade | `need.api`, `conductor.fold` (school) | `kt` (need weights enter as KT-tier inputs, need §4.7) | topic, foundation share, review share |
| the student (independence, goals, choices) | solo rounds, dependency flag (CRI/TOH), child goals, child choices | `srl.close`, `srl.weekly`, `mi.close`, device | `srl`, `interest` | solo rounds, goal card, home loop; topic only inside the KT domain |
| the vibe | the close label `fine/strained/tired`, sitting hour | Director close step → `conductor.fold` | `vibe` | segment minutes (inside KT's slack), success-first, lane mix (inside budget) |
| (not adaptive) | cap, allowed hours, bedtime, consent, safety, money | parent, protocol, governor | `safety`, `limits`, `budget` | bound any knob; propose none |

Three things never adapt, by construction: the daily cap and `plannedMin` ceiling (CONDUCTOR §4.4, V26), the praise
dose and category (vibe §4.2 "not knobs"), and any label about the child (η is never shown: kt R18).

---

## 2. The input surface: `ConductorChildView` through a recording `ViewReader`

The contract is `adaptation.contracts.ts` §1, which replaces CONDUCTOR's untyped `BriefReader`. In summary:

- Every field is `Fresh<T> = { value, asOf, src, stale }`. `asOf` is the writer's commit time. `src` is the writer's
  version (`kt_params` version, `srl` window end, and so on).
- Each key has **one writer** (`ViewWriter`) and a staleness bound `MAX_AGE_H[writer]`. A read older than its bound
  returns the declared `FALLBACK` with `stale = true`. **Fallbacks never fire a rule** (V25, I-A5). Writers bounded at
  0 h are read live under the step's snapshot, so they are never stale.
- `ViewReader.get(key, sub?)` is the only learner access `decide()` has. The recording reader stores
  `{ key[.sub]: {value, asOf, src, stale} }` for every read into the step's map, which becomes the content-addressed
  `brief_snapshot` row (X34). A replay is handed the recorded map and reads nothing else (I-R3).
- `ChildBrief` (≤ 600 tokens, inside `LessonBrief`) is a different thing: the Director's prompt-side packet. The
  Conductor never reads it. The Conductor reads `ConductorChildView`, and the Director reads `ChildBrief`.

What changed against the fragment: nothing in §1. `mi.interest` is still `null` unless the MI mode is
`persisted_adaptive` (MI §2.2). The rules that read it (R12) treat `null` as "no interest signal", which is a
fallback, so it fires nothing.

---

## 3. `planDay`: one pure function, and exactly what `inputsHash` covers

### 3.1 The call sequence inside `decide`

```ts
// server/conductor/plan/index.js: called from the app.opened / day_start / replan / parent-change handlers
const base: PlannerBase = buildBase(state, event, ctx);          // pure: state, cfg, cal, recorded now, arms
const keys = planKeys(base);                                     // pure: candidate skills ≤ 40, due items, subjects
const view = Object.fromEntries(keys.map((k) => [k, strip(ctx.view.get(...split(k)))]));  // recorded reads; asOf dropped
const inputs: PlannerInputs = { ...base, view };
const inputsHash = 'pi1:' + sha256hex(jcs(inputs));              // RFC 8785 bytes
if (state.plan?.day === inputs.day.learningDay && state.plan.inputsHash === inputsHash) return noChange;  // day_start refresh
const { plan, firings } = planDay(inputs);                       // PURE: reads `inputs` only
const v = validate(plan, inputs);                                // V1-V27; a code plan that fails is a bug → audit + fallback
return { command: { kind: 'plan.adopt', day, version, source: 'code', inputsHash, reason, plan }, firings };
```

`planDay` gets no reader, no `ctx`, no clock and no database handle. Whatever it does not find in `inputs`, it cannot
know. That is the whole determinism argument, and G3 tests it (I-A4): two processes given equal `inputs` must emit
byte-identical `DayPlan` JSON, and a planted `Date.now()` inside `planDay` must make the test fail.

`state.plan` gains `inputsHash` (it already exists on `day_plan.inputs_hash`, but the state needs it to skip a
no-change `day_start` without a read).

### 3.2 `PlannerInputs` (the full type: `adaptation.contracts.ts` §8)

```ts
export interface PlannerInputs {
  v: 1;
  build: { plannerSha: string; cfgDigest: string; thresholdsV: string };
  child: { band: Band; vibeBand: AgeBandVibe; ageYears: number; tier: string };
  day: { learningDay: string; dayKind: DayKind; reason: 'first_open' | 'day_start' | 'replan' | 'resume' | 'parent_change';
         anchor: { kind: 'window_start' | 'opened' | 'replan'; localHHMM: string } };
  window: { from: string; to: string; bedtimeMinus60: string; bedtimeMinus30: string };
  limits: { capMin: number; hwSubCapMin: number; restDay: boolean; careEffect?: 'gentle_mode' };
  mode: 'free' | 'paused' | 'safety_hold';
  school: { testWindows: TestWindowLite[]; pointers: Record<string, string> };
  homework: Array<{ taskId: string; dueDay: string; estMin: number }>;
  promises: Array<{ id: string; kind: string; ref: string }>;
  frozen: { planVersion?: number; slots: FrozenSlotRef[] };
  usage: { usedMin: number; hwUsedMin: number };
  voice: { leftSec: Partial<Record<Lane, number>>; activeDaysLeftEst: number };
  adapt: AdaptMemory;
  view: Record<string, { value: unknown; src: string; stale: boolean }>;
  arms: Record<string, string>;
}
```

### 3.3 Composition of `inputsHash`

`inputsHash = 'pi1:' + lowercase-hex( SHA-256( JCS( quantised PlannerInputs ) ) )`. JCS is RFC 8785: I-JSON
values, object keys sorted by UTF-16 code units, no whitespace, and ECMAScript number serialisation, which is
exactly what makes the bytes hashable [V RFC 8785]. Arrays keep their order, so every array is sorted by a stated
key before hashing.

| field | in the hash | quantised / canonicalised | why it is in (or out) |
|---|---|---|---|
| `build.plannerSha` | yes | git sha of `server/conductor/plan/**` | a new planner must be allowed to re-plan |
| `build.cfgDigest`, `thresholdsV` | yes | sha256 of the `ConductorConfig` JCS bytes; `T` version string | a threshold change is a plan change |
| `child.*` | yes | `ageYears` integer | band and age gate rules (B1 pace cap, MCII ≥ 12) |
| `day.learningDay`, `dayKind`, `reason` | yes | — | `reason` decides frozen-slot handling |
| `day.anchor.localHHMM` | yes | **floored to 15 min** | the late-start collapse depends on time left; a raw `now` would mint a new plan version every minute |
| recorded `now` | **no** | — | it is in `decision_log.now_used`; staleness was already decided into `view[*].stale` |
| `window.*`, `limits.*`, `mode` | yes | local `HH:MM` strings | V1, V2 inputs |
| `school.testWindows` | yes | sorted by `(on, subject)`; `daysLeft` integer | V9, R9, topic domain |
| `school.pointers` | yes | object (JCS sorts keys) | the school track |
| `homework`, `promises` | yes | sorted by `taskId` / `id` | §4.4 items 2 and 6, V11 |
| `frozen.slots` | yes | `{slotId, digest}` sorted by `slotId`; digest = sha256(JCS(slot)) | V10: a re-plan carries shown slots verbatim |
| `usage` | yes | floored to whole minutes | V1 |
| `voice.leftSec` | yes | **floored to 30 s** per lane | R10 and V3; block-level settlement noise would otherwise churn |
| `voice.activeDaysLeftEst` | yes | integer, from `counters` | R10 |
| `adapt` | yes | the **packed** codec (§7.1) | latches are planner inputs |
| `view[k].value` | yes | pL to 0.01, η to 0.05, `overdueRatio` to 0.1, θ to 0.05; enums as is | a nightly refit's third decimal must not re-plan an unshown day |
| `view[k].src`, `.stale` | yes | — | a new params version may legitimately change the plan; stale decides fallback |
| `view[k].asOf` | **no** | — | it varies on every write with an identical value |
| `arms` | yes | object | an experiment arm is a plan input (obs O10) |
| `routine.homeAdultName`, parent text, `ChildBrief` | **no** (not in the type) | — | not planner inputs (V14, PLI) |

**Check (G3, I-A4):** for 1,000 conductor-sim plan calls, (a) `planDay(inputs)` run twice in two processes gives equal
bytes; (b) mutating any *excluded* field (`asOf`, raw `now` inside the same 15-min bucket) leaves `inputsHash` and
the plan unchanged; (c) mutating any *included* field changes `inputsHash`. Negative controls: a planner that reads
`Date.now()` fails (a); a hasher that forgets to sort `homework` fails (b) on a shuffled fixture.

**Plan churn** is a measured cost (CM-A9): plan versions per child-day caused by an `inputsHash` change with no
visible slot change. The quantisation steps above are [U] until it is measured.

---

## 4. The rule table, R0-R14

Columns: **trigger**, i.e. the moment it is evaluated · **reads**, i.e. `Fresh<T>` view keys or `state.*` paths, each
recorded · **knob** (side knobs in brackets) · **layer** · **latch on / off**: hysteresis; "-" means stateless ·
**stale fallback**: what happens when a read key is stale · **threshold source**.
All constants are `T.*` in `adaptation.contracts.ts`. `RULES` there is this table as data, in tie-break order.

| id | trigger | reads | knob | layer | latch on / off | stale fallback | threshold source |
|---|---|---|---|---|---|---|---|
| **R0** template | every plan | `kt.due`, `kt.skill.<id>`, `need.gapGrades`, `state.school`, `state.promises` | base value of every knob (segments, wanted lanes, topic, `pace` = 1, `reviewShare` = .15, `soloRounds` = band base) | kt | - | `kt.ledger` is never stale; no placement → the level-path share is the R9 base | CONDUCTOR §4.3 template, §4.4 priority stack |
| **R1** strain | night fold over the ring. Also at plan time: was the last close bad? | `state.adapt.closes[*].vibeClose` | `segmentMinutes` × 0.7, never below the band minimum set (`successFirst`) | vibe | **pre-latch:** last close `strained`/`tired` → `successFirst` only. **On:** ≥ 3 of the last 4 closes bad. **Off:** 3 consecutive `fine` closes, or no close in 14 days | `conductor.fold` is never stale; < 4 closes in the ring → cannot latch | k-of-m run rule (Western Electric 1956 family [V]) + two-threshold hysteresis (Schmitt [V]); `3/4, r = 3` chosen in §8 |
| **R2** late sitting | night fold over the ring (16 closes) | `state.adapt.closes[*].{localHour, vibeClose}` | `segmentMinutes` → the band **minimum set** for slots that start ≥ 20:00 | vibe | **On:** ≥ 4 late (≥ 20:00) **and** ≥ 4 earlier closes, and bad-rate(late) − bad-rate(early) ≥ .40. **Off:** gap < .20, or either arm < 4 | as R1 | per-child contrast, because TRAILS found no evening data [V]; .40/.20 chosen in §8 |
| **R3** review backlog | night fold | `kt.due` (`overdueRatio` per item) | `reviewShare` .15 → .25 of lesson minutes (plus one burst offer) | kt | **On:** ≥ 6 items with `overdueRatio` ≥ 1.0. **Off:** ≤ 2 | never stale | FSRS target R 0.9 (kt §2.3) [S]; the 25% ceiling is CONDUCTOR §4.4; counts [U] → CM-A4 |
| **R4** representation switch | `skill.milestone{to:'wheel_spin'}` → re-plan of unshown slots | `kt.skill.<id>.{wheelSpin, oppsSinceRun3}`, `fmt.best.<topicType>:<vibeBand>`, `state.adapt.repSwitch.<id>` | `representation{skillId, preferFamily, avoidEngines}` | kt | per skill: **not again within 3 days**; entry kept 30 days (≤ 8, LRU) | `fmt.best` stale → the kit's default family order. The trigger itself is a ledger fact | wheel-spin = ≥ 10 opportunities with no 3 correct in a row (Beck & Gong 2013 [V abstract], kt §2.6) |
| **R5** prerequisite check | same trigger as R4, evaluated first | `kt.skill.<id>.prereqs[*].pL` (the planner walks depth ≤ 3), `state.adapt.prereqChecked` | `prereqCheck{skillId, forTopicId}`, a `prereq_first` slot (V6) | kt | per skill: **not re-checked within 3 days**; result kept 14 days. Pass → R4 runs instead. Fail → the foundation track | never stale | need §4.7 `firstWeakPrereq(pKnownBelow .4, maxDepth 3)` [S], LS-10, TaRL |
| **R6** pace | `learner.params_refit{kind:'eta_theta'}` (nightly) | `kt.eta.{value, nOpps, nSkills}` | `pace.newSkillBudget` 0 / 1 / 2 | kt | **eligible:** nOpps ≥ 30, nSkills ≥ 3. **Up (→ 2):** η ≥ +0.5 on 2 consecutive refits. **Down (→ 0):** η ≤ −0.5 on 3. **Back (→ 1):** inside ±0.25 on 2. B1 bounded to ≤ 1 by `limits` | `kt.refit` stale (> 36 h) → hold, with no transition. Stale > 7 days → reset to 1 | eligibility and prior N(0, .5²) from kt §2.5 [S]; learning-rate individualisation helps most (Yudelson 2013 [V abstract]); asymmetry chosen in §8 |
| **R7** solo rounds | night fold | `srl.solo28`, `srl.dep.lesson` | `soloRounds` base → base + 1 (B1 2→3, else 3→4) | srl | **On:** (attempted ≥ 8 and ok/attempted ≥ .8) **or** dependency flag on. **Off:** declined/(attempted + declined) ≥ .4, or flag off with ok/attempted < .7 | `srl.weekly` stale (> 9 d) → treated as flag off; `srl.close` never stale | srl §3.5 (counts), §5.5 (+1 solo round at p ≈ .8 when the CRI flag is on) [S]; .8/.4 [U] → CM-A6 |
| **R8** opener | every plan | `state.adapt.closes` (gap), `state.adapt.goal`, `mi.thread`, `tm.opener` | `opener` kind (`successFirst`) | kt > srl > interest | stateless. Order: gap ≥ 7 days since the last close → `reanchor_light` + success-first (kt); an active goal due this week → `goal_review` (srl); open thread → `thread_return` (interest); `tm.opener.available` → `callback` (interest); else `standard_retrieval`. **Every kind carries ≥ 2 due retrieval items (V5)** | `mi.thread`/`tm.opener` stale → those kinds are not offered | success-first as warm-up: MI §2.6 targetP .85-.95 [S]; the high-probability-request sequence (Mace 1988, 5 experiments [V abstract]) is the closest behavioural analogue; 7 days [U] |
| **R9** foundation share | weekly intent (Sunday), and when a test window opens or closes | `need.gapGrades`, `need.parentGoals`, `state.school.testWindows` | `foundationShare` | kt | recomputed weekly (a week is the hysteresis): `min(.6, .2 + .15·max(0, −gap))`, × .5 inside a test window; a rank-1 `catch_up_basics` goal → at least .5 outside a window | no placement → .2 (= R0's base; nothing fires) | need §4.7 formula [S] ∩ the CONDUCTOR §4.4 60/40 and 30/70 caps |
| **R10** voice rung | every plan (advisory); the governor grants at lesson start (binding, I-R7) | `gov.voiceLeftSec`, `gov.capMin`, `state.counters` | `laneMix`: the lesson's voice rung | **budget** (a constraint, not a preference) | stateless. Allowance today = `floor(leftSec.realtime / max(1, activeDaysLeftEst))`. If it is below the lesson's realtime-wanted seconds, the domain becomes `{cascade, tap}`. The domain always keeps `tap` (I-A2) | a governor read failure at plan time → `{cascade, tap}` (fail closed; a plan is advisory) | CONDUCTOR §9.5 degrade ladder, §4.2 grant rule |
| **R11** child choice | `child.choice_made` for a slot of a later plan (`forDay`) | `state.adapt.choice`, `mi.choices28` | `topic`, or the slot's context skin / format offer | interest | stateless; a choice is consumed by one plan, and expires at `forDay` + 1 | — | choice raises motivation, more so in children, best with 2-4 choices (Patall 2008, 41 studies [S, verified by `design/lesson-arc.md`]); never core vs fluff (LS-26) |
| **R12** home loop | weekly intent | `srl.dep.homework`, `mi.interest`, `state.adapt.lastHomePick` | `homeLoop` activity kind | srl (interest below it) | weekly; never the same kind 2 weeks running; ≤ 1 activity a week (PLI) | `mi.interest` null → no interest theming | pl §7.4 home loop; srl §5.5 item 3 |
| **R13** goal card | weekly intent; after `child.goal_closed` | `id.ageYears`, `state.adapt.goal`, `state.adapt.optIns`, `mi.choices28` | `goalCard` offer (child-set; one skill or task) | srl | ≤ 1 active goal (V23); MCII fields only at age ≥ 12 **and** with the `mcii` opt-in | — | MCII raised practice by > 60% in adolescents (Duckworth et al. 2011, n = 66 [V abstract]); age-12 floor [U]; need §4.6 |
| **R14** routine card | night fold | `state.adapt.closes[*].{endedBy, minutes, localHour}` and **never** `vibeClose` | `routineCard`: one in-app parent card, "an earlier slot?" | kt (facts tier) | **On:** ≥ 3 of the last 5 closes cut short (`endedBy` ∈ {bedtime, cap, time_limit} with minutes < .6 × planned) or started within 30 minutes of the window end. **Cooldown:** 14 days (`routineCardDay`). No push | — | dc §7.4 re-anchoring (Wood 2005 [S]); V27; pl PA-6 |

**Side effects that are not knobs.** R4 and R5 write `state.adapt.repSwitch` / `prereqChecked` in the commit that
adopts the plan. R11 marks the choice consumed. R13 opens nothing by itself: the child sets the goal
(`child.goal_set`). No rule writes KT, SRL or MI state; those have their own writers (§2).

**Bounds that hold whatever the rules say** (V15, V26): `segmentMinutes` ≥ the band minimum set (B1 10, B2 12, B3 18,
B4 22 [U]: retrieve + teach + teach-back + wrap at their minimums) and ≤ the template; `plannedMin` ≤ the normal-day
plan; `soloRounds` ∈ [base, base + 1]; `newSkillBudget` ∈ {0, 1, 2}, and ≤ 1 for B1; `foundationShare` ≤ .6;
`reviewShare` ≤ .25 of lesson minutes.

---

## 5. Precedence: `resolveKnob` and the `GUARDS`

### 5.1 Two mechanisms, one order

| | `resolveKnob` (inside `planDay`) | `GUARDS` (inside `decide`, after the handlers) |
|---|---|---|
| acts on | one knob's value | a command (`plan.adopt`, `notify`, `enqueue`, …) |
| may | intersect constraint domains; pick the highest-precedence preference; let lower layers move it inside the owner's slack | drop or narrow a command; never add or widen one |
| runs | once per knob per slot per plan | on every command of every step |
| logs to | `day_plan.plan.adapt.rules[]` (`RuleFiring`, with `blockedBy`) and `decision_log.decisions[].rules` | `decision_log.decisions[].blocked` |

The guard order is `[safetyGuard, consentGuard, parentControlGuard, policyCapGuard, governorGuard]` (CONDUCTOR §3.4).
It maps onto the three constraint layers:

| guard | layer | the shared pure predicate (`shared/conductor/policy.ts`) | constraints it contributes to `planDay` |
|---|---|---|---|
| `safetyGuard` | safety | `holdAllows(mode, hold)` | `safety_hold` → no slots, only the hold screen. `careEffect: gentle_mode` → `successFirst` = `{on}`, `pace` ≤ 1 |
| `consentGuard` | limits | `purposeAllowed(consent, purpose)` | a revoked purpose removes its knobs from the domain (e.g. no `child` scope in `fmt.best`) |
| `parentControlGuard` | limits | `windowAllows(limits, routine, cal, t)`, `capLeft(limits, usage)` | `segmentMinutes.hi` ≤ min(template, cap × .7 − homework); no slot outside the window |
| `policyCapGuard` | limits | `bandPolicy(band)` | B1 `pace` ≤ 1; `laneMix` excludes `realtime_mini` as the primary teacher; the homework sub-cap; homework never on realtime (V4) |
| `governorGuard` | budget | `laneAllowance(voiceLeft, daysLeft, wantedSec)` | `laneMix` = `{cascade, tap}` when the allowance is short (R10) |

`planDay` calls these predicates to build its `Constraint[]`. Each goes through `registerConstraint` (I-A2), and then
`decide` runs the guards on the resulting `plan.adopt`. Because both sides call the same functions on the same
recorded inputs, **the guards find nothing to narrow** (I-A10). If one ever does, the narrowed command is adopted
(the guards win), `audit{code:'guard_narrowed_plan'}` is emitted, and G4 fails at a count of 1. A guard is the
backstop, not the mechanism.

### 5.2 The arbitration rule (`resolveKnob`, contract §5)

1. Constraints for the knob are intersected in layer order (safety, then limits, then budget). A constraint that
   would empty the domain is dropped and logged `empties_domain`. **I-A2 makes this unreachable for constraint
   layers**: budget constrains only `laneMix`, every `laneMix` domain keeps `tap`, and no constraint domain may be
   empty. So the drop branch exists only as a logged backstop.
2. The highest-layer preference that `MAY_PROPOSE` permits sets the value, projected into the domain (a projection
   is logged `projected_into_domain`). A preference from a layer that is not permitted is logged
   `layer_not_permitted` (I-A1: this is how a vibe signal is kept off `reviewShare`).
3. A lower preference may move the value only inside the slack the owner declared, and only inside the domain.
   Otherwise it is logged `outside_owner_slack`.
4. Ties inside a layer go to the earlier rule in `RULES` order. **The planner must push preferences in `RULES`
   order**, because the stable sort keeps insertion order. A fixture with shuffled insertion must give the same plan
   (I-A4).
5. Set domains are listed in preference order (lanes: `realtime, realtime_mini, cascade, tap`), because projection
   takes the first surviving value.

### 5.3 What a blocked preference does for the child

A child's choice that loses (R11 `outside_owner_slack`) is not silent. The brief carries
`choiceAck{offerId, honoured:false}`, and the Director answers it with an acknowledgement *shape* (for example
"after the test" plus an offer to revisit). If the teacher then promises the revisit, `teacher.promise` makes the
validator keep it (V11). A blocked vibe or SRL preference has no child-facing trace. It shows up only in
`adaptTrace` (ops) and in `blockedBy`.

### 5.4 Worked example: a strained B1 child, in a test window, with a low realtime budget

**Facts on 2026-10-02 (Friday).** Aarav, 6 (Class 1, B1, vibe band A). Bedtime 21:00, so `bedtime − 60` = 20:00 = the
B1 allowed-hours end. He opens at 19:10 (anchor bucket 19:00). Unit test on Monday, Maths chapters 4-5: the
window opened Wednesday, so this is day 3 of 5 and not one of the last 2 (V9 is silent). The ring's last four closes
are strained, strained, fine, tired, so last night's fold set `shortSeg.on` (3 of 4). Realtime left this month: 600 s,
with 8 expected active days, so the allowance is `floor(600 / 8)` = **75 s**. `kt.eta.nOpps` = 12, below the 30-opp
eligibility, so R6 does not fire. Gap-to-grade in maths is −1. Yesterday he picked "shapes" (ch. 6) as the next topic.
No homework sheet. No goal, no open thread.

**Knob by knob.** This is the output of `adaptation-worked-example.mjs`, which runs the real `resolveKnob`.

| knob | base domain | constraints (layer) | preferences (layer, rule) | result | blocked |
|---|---|---|---|---|---|
| `segmentMinutes` (session) | [10, 20] | ≤ 21 (limits: cap 30 × .7, no homework) | 20 with slack [12, 20] (kt, R0: test retrieval + teach + teach-back obligations); 14 (vibe, R1: 20 × .7) | **14** | — |
| `laneMix` (voice rung) | realtime, mini, cascade, tap | {realtime, cascade, tap} (limits: mini is never the primary teacher); {cascade, tap} (budget, R10: 75 s < 300 s teach) | realtime (kt, R0: the template's wanted lane) | **cascade** | R0 `projected_into_domain` |
| `topic` | ch4, ch5, ch6 | — | ch4 (kt, R0: test window, no slack); ch6 (interest, R11) | **m1.ch4** | R11 `outside_owner_slack` → `choiceAck{honoured:false}` |
| `pace` | [0, 2] | [0, 1] (limits: B1) | 1 (kt, R0) | **1** | — (R6 ineligible: no proposal) |
| `successFirst` | off, on | — | on (vibe, R1 latch) | **on** | — |
| `foundationShare` | [0, .6] | — | .175 (kt, R9: (.2 + .15 × 1) × .5) | **.175** | — |
| `reviewShare` | [.15, .25] | — | .25 (kt, R0 in a test window) | **.25** | — |
| `soloRounds` | [2, 3] | — | 2 (srl, R0 band base; R7 off) | **2** | — |
| `opener` | — | — | `standard_retrieval` (R8: gap 1 day; no goal/thread/callback) | **standard_retrieval**, success-first | — |

**Segments (14 min):** retrieve 3 tap (test-chapter items, at least 2 due: V5), teach 4 cascade, play 3 tap, teach-back
3 cascade, wrap 1 cascade. The offline task, which is not in the minimum set, is dropped by R1. There is one voice
rung for the whole lesson, `cascade`. The 75 s could have covered a realtime wrap, but a lesson never mixes rungs: one
voice per lesson (I-R7) and the same character by blind ear (CONDUCTOR §4.2). `plannedMin` 14 ≤ cap 30.

**Guards on `plan.adopt`:** safety (mode `free`, no hold) → pass. Consent (no revoked purpose touched) → pass.
Parent control (19:10-19:24 inside 16:00-20:00; 14 min ≤ cap left 30) → pass. Policy cap (B1 pace 1, no mini teacher,
no homework) → pass. Governor (`voiceSecWanted.realtime` 0 ≤ 75) → pass. Nothing is narrowed, so I-A10 holds.

**What each party sees.** The child gets a shorter, easier-starting lesson in his test chapter, in the teacher's
cascade voice, and the teacher acknowledges his shapes pick ("test ke baad"). The parent sees the test-chapter
progress (pakka / aa gaya: DC11) and no line about strain (pl PA-6). The ops timeline shows
`R1 segmentMinutes 20→14`, `R1 successFirst off→on`, `R10 laneMix realtime→cascade (budget)`,
`R11 topic blocked by kt (outside_owner_slack)` and `R9 foundationShare .175`.

**Negative controls in the same script** (they must be blocked): a vibe proposal to lower `reviewShare` →
`layer_not_permitted`, value stays .25 (I-A1). An empty budget domain is shown to leak `realtime` through the
`empties_domain` drop, and `registerConstraint` is shown to refuse it, along with a budget bound on minutes and any
constraint from a preference layer (I-A2).

---

## 6. Events

### 6.1 New events (additions to the `StudentEvent` union, CONDUCTOR §2.2)

The types are in `adaptation.contracts.ts` §3 (`AdaptEvent`), with idempotency keys in `IDEM`. All are typed with no
free text (CONDUCTOR §2.3): options and picks are ids.

| event | source | folds into | reducer response |
|---|---|---|---|
| `child.choice_made{offerId, context, options, picked, via, lessonId?, forDay?}` | device or Director | `adapt.choice` (latest unconsumed, if `forDay` is set); `mi.close` counts it in `mi.choices28` | R11 at the next plan for `forDay`. An in-lesson choice with no `forDay` is the Director's, so the Conductor only counts it |
| `child.plan_stated{lessonId, cue, action}` | Director (wrap if-then, B3-B4) | nothing persistent except the device's local anchor reminder | the next plan places the stated action first when it is valid (R11 path, interest layer) |
| `child.goal_set{goalId, isoWeek, skillIds, offered, byWeekday?, mcii?}` | device | `adapt.goal` (≤ 1 active: V23) | R8 `goal_review` becomes eligible; R13 goes quiet |
| `child.goal_closed{goalId, status, by, evidenceSeq?}` | device or system | `adapt.goal.status` | R13 eligible at the next weekly intent |
| `child.thread_opened` / `child.thread_closed` | Director | read through `mi.thread` (writer `mi.close`); the Conductor keeps no copy | R8 `thread_return` |
| `child.optin_changed{feature, on, version}` | device (child, with the parent's setting) | `adapt.optIns` | R13 MCII gating |
| `learner.dependency_flag{lane, on, cause, …}` | `srl.weekly` job | `adapt.depFlag` (mirror; transitions only) | R7, R12 at the next night fold / weekly intent |
| `learner.params_refit{kind, paramsVersion, jobId}` | `kt.refit` / `fmt.refit` jobs | `eta_theta` → evaluate R6 against `kt.eta` (recorded read); `format` → nothing (read at plan time) | R6 transition, if any, written to `adapt.paceBudget` |

Additions to existing payloads: `LessonOutcomeDigest` gains `OutcomeDigestAdd` (`soloPlanned/Done/Ok/Declined`,
`prereqChecks`, `representationUsed`, `openerDelivered`). `lesson.ended` is what appends a `CloseLite` (§7.2).

### 6.2 What the Conductor emits

No new command kinds. Adaptation reaches the world through:
- `plan.adopt`, whose `plan.adapt = { rules: RuleFiring[], viewSrc }` records every firing, its evidence keys and any
  `blockedBy`;
- `brief.refresh` / `LessonBrief` additions (`LessonBriefAdd`: `opener`, `successFirst`, `soloRounds`,
  `newSkillBudget`, `representation?`, `prereqCheck?`, `goalReview?`, `choiceAck?`, and `adaptTrace`, which is ops only
  and never compiled into a prompt);
- `notify` for R14's in-app parent card (an in-app card class, never a push; inside the §4.10 cap);
- `decision_log.decisions[].rules`: `adapt:R1:on`, `adapt:R6:2→1`, … for every latch transition in a night fold or
  refit.

---

## 7. State: `ConductorState.adapt`, and the night fold

### 7.1 `AdaptMemory` and its size

The type is in `adaptation.contracts.ts` §2. It holds the CloseLite ring (16 closes, ≤ 14 days), five latches (R1,
R2, R3, R7 as `RuleLatch`, R6 as `paceBudget` with enter/exit run counters), the R4/R5 per-skill records (≤ 8 each,
LRU, TTL 30 / 14 days), the latest unconsumed choice, ≤ 1 goal, opt-ins, the dependency-flag mirror, the last home
pick, `foldedDay` and `routineCardDay`.

**Size, measured** (`adaptation-state-size.py`, maximum fill, JSON text bytes, 2026-10-02):

| encoding | ring 8 | ring 16 |
|---|---|---|
| plain objects (field names repeated) | 3,087 B | 4,343 B |
| packed codec (tuples, enum indices, day offsets from `foldedDay`) | 816 B | **1,016 B** |

So the fragment's "< 1.5 KB" target is met **only with the packed codec**: plain objects miss it even at ring 8.
`shared/conductor/adaptCodec.ts` packs it on commit and unpacks it in `upgradeState`. The packed form is also what
enters `inputsHash`. The I-A9 negative control is an unpacked or ring-32 state, which must fail. jsonb adds a little
per-value overhead on top of the JSON text [U].

### 7.2 What `night` actually folds ("close the learning day")

```ts
// server/conductor/handlers/night.js: pure; runs for clock.wakeup{reason:'night'} AND as a catch-up
export function foldNight(s: ConductorState, day: string, view: ViewReader, cfg): { state; commands; rules } {
  if (s.adapt.foldedDay && s.adapt.foldedDay >= day) return { state: s, commands: [], rules: [] };   // idempotent (I-A6)
  const a = structuredClone(s.adapt), rules = [];
  // 1. ring: drop closes older than 14 days, keep the last 16 (closes were APPENDED on lesson.ended, not here)
  a.closes = a.closes.filter((c) => daysBetween(c.day, day) < T.RING_MAX_DAYS).slice(-T.RING);
  // 2. latches, in RULES order. A day with no close changes no counter: latches count CLOSES, not days.
  //    An empty ring resets R1/R2/R14 to off (stale evidence), logged.
  latchR1(a, rules); latchR2(a, rules); latchR3(a, view.get('kt.due'), rules);
  latchR7(a, view.get('srl.solo28'), view.get('srl.dep'), rules); routineR14(a, day, rules);
  // 3. TTLs: repSwitch 30 d and prereqChecked 14 d (then LRU to 8); a choice whose forDay < next day is dropped;
  //    a goal whose isoWeek has ended → status 'expired' (the Conductor's own state; logged, not an event)
  expire(a, day, rules);
  // 4. counters: lastActiveDay = the max close or app.opened day; activeDays7 from the ring and the open log
  const counters = recount(s, day);
  // 5. clock: re-arm tomorrow's day_start/night only if lastActiveDay is within 14 days (X36)
  const commands = rearm(s, counters, day, cfg);
  a.foldedDay = day;
  return { state: { ...s, adapt: a, counters }, commands, rules };
}
```

- **Appends happen elsewhere.** `lesson.ended` appends one `CloseLite` from `outcomeDigest`: day, local start hour,
  `vibeClose`, `endedBy`, minutes, planned minutes, and the solo counts. The R1 *pre-latch* (the last close bad →
  success-first) is read by the next plan directly from the ring.
- **Not in the night fold:** R6 (it moves on `learner.params_refit`, which arrives after the 02:00 refit, later than
  the bedtime-anchored `night` wakeup); R4/R5 (on `wheel_spin`); R8-R13 (at plan time or weekly intent). Tomorrow's plan
  is not computed (X10).
- **Catch-up.** A `night` wakeup can be missed: the dormant clock (X36), a ticker outage, or `paused`/`safety_hold`.
  The first event of any later learning day therefore runs `foldNight(state, previousLearningDay)` first if
  `foldedDay` is older. It folds only the last missed day, because latches count closes and there were none on the
  skipped days. `foldNight` reads the view through the same recording reader, so a replay sees what it saw.
- **In `paused` and `safety_hold`** the fold still runs. It is pure state with no child-facing command, and
  "consolidation and erase only" (CONDUCTOR §3.2) concerns jobs. `rearm` follows the mode's own wakeup rules.
- **Erasure** removes `conductor_state`, so the ring goes with it (W-map).

### 7.3 Where `adapt` sits in `ConductorState`

`ConductorState.adapt: AdaptMemory` (packed in storage, < 1.5 KB at maximum fill as measured above; whole-state target
still < 8 KB). `adapt` is written only by `decide` (writer `conductor.fold`). Its fields are inputs to `planDay`
through `PlannerInputs.adapt`, and are read with `state.adapt.*` evidence keys in `RuleFiring.evidence`.

---

## 8. Simulations

### 8.1 The original tables (seed 11, unchanged, reproduced 2026-10-02)

`python3 adaptation-hysteresis-sim.py`: 2,000 children × 40 sittings (8 weeks × 5), one generator seeded 11.
**R1** (share of sittings with the latch on, flips per 8 weeks as median / p90, latency in sittings):

| k/m, r | steady on | steady flips | tired on | tired latency | recovery off-latency |
|---|---|---|---|---|---|
| 1/1, r=1 | 0.150 | 10 / 14 | 0.651 | 1.0 | 1.0 |
| 2/3, r=2 | 0.073 | 2 / 4 | 0.731 | 3.0 | 2.0 |
| 2/3, r=3 | 0.112 | 2 / 4 | 0.858 | 3.0 | 3.0 |
| **3/4, r=3** | **0.026** | **0 / 2** | 0.777 | 4.0 | 3.0 |
| 3/5, r=3 | 0.040 | 0 / 2 | 0.782 | 5.0 | 3.0 |
| 3/5, r=4 | 0.057 | 0 / 2 | 0.846 | 5.0 | 4.0 |

**R2 one-shot** (fires once over all 40 sittings): n ≥ 4 each, gap ≥ .30 → false fire 0.021 (steady), hit 0.939
(tired-evening). Plan-level MRT sizing: base .70 +8 pp needs 1,836 decisions = **92 child-months** at ρ = .05 (941 /
47 at ρ = 0; 2,730 / 137 at ρ = .10).

### 8.2 G1 rerun: oscillation and false-latch rates (n = 8 seeds, 2026-10-02)

Seeds 11-18, each with its own `default_rng(seed)`, 2,000 children × 40 sittings per seed (16,000 simulated children
per row). Values are the mean across seeds, with [min-max]. **Oscillation** = latch flips per child per 8 weeks.
**False latch** = the share of children whose latch is *ever* on in 8 weeks under a persona with no real change
(steady: P(bad close) = .15 at every hour). **Hit** = ever on under the persona the rule exists for.

| rule, variant | oscillation (mean) | p90 | false latch | sittings on | hit |
|---|---|---|---|---|---|
| R1 **3/4, r=3 (chosen)** | **0.486** [0.468-0.515] | 2.0 | **0.236** [0.223-0.246] | 0.025 | 1.000 (tired every evening) |
| R1 1/1, r=1 (CONDUCTOR §3.3 as written) | 9.945 [9.786-10.114] | 14.1 | 0.999 | 0.150 | 1.000 |
| R1 3/5, r=3 | 0.777 | 2.0 | 0.361 | 0.041 | 1.000 |
| R2 ring 16, n ≥ 4, on .30 / off .30 | 0.637 | — | 0.235 [0.219-0.248] | — | 0.932 (tired evening) |
| R2 ring 16, n ≥ 4, on .30 / off .15 | 0.498 | — | 0.235 | — | 0.932 |
| R2 **ring 16, n ≥ 4, on .40 / off .20 (chosen)** | **0.324** [0.288-0.342] | — | **0.159** [0.148-0.167] | — | **0.913** [0.906-0.923] |
| R2 ring 16, n ≥ 5, on .40 / off .20 | 0.195 | — | 0.094 | — | 0.765 |

**R6 pace** (40 nightly refits, 8 opportunities a day, MAP η under the N(0, .5²) prior, per-opportunity Fisher
information I [U]: 0.05 and 0.10 shown). The columns are oscillation, ever moved off 1 (= false latch for η = 0),
correct state at day 40, and median first move (day):

| persona | I | naive ±.5 | hysteresis, 2 refits | hysteresis, 3 refits |
|---|---|---|---|---|
| steady η = 0 | .05 | 0.555 flips · 17.1% moved · day 8.8 | 0.186 · **12.2%** · day 10.5 | 0.136 · 9.4% · day 12.4 |
| steady η = 0 | .10 | 0.399 · 13.9% | 0.150 · **8.5%** | 0.101 · 6.1% |
| near η = +0.3 | .05 | 1.183 · 32.8% · correct 89.9% | 0.322 · 26.3% · correct 79.4% | 0.256 · 22.3% · 81.0% |
| fast η = +0.8 | .05 | 2.596 flips · correct 75.9% | 0.868 · correct **84.0%** · day 12.9 | 0.835 · 82.1% · day 14.4 |
| fast η = +0.8 | .10 | 2.485 · 90.8% | 0.963 · **95.4%** · day 9.0 | 0.942 · 93.9% · day 10.5 |
| slow η = −0.8 | .05 / .10 | 2.613 · 75.7% / 2.482 · 91.2% | 0.871 · 84.2% / 0.964 · 95.3% | 0.832 · 81.7% / 0.946 · 94.2% |

### 8.3 What the rerun changed

1. **The fragment's "R1 steady false-on 2.6%" was the share of sittings, not of children.** Per child, 23.6% of
   steady children latch at least once in 8 weeks. That is the honest false-latch rate, and the doc keeps 3/4, r=3
   anyway, for three reasons. (a) The cost of a false latch is about 3 sittings at 70% length with a success-first
   opener, which is safe if wrong. A miss costs a tired 6-year-old full-length sittings. (b) 3 bad closes in 4 at a
   15% base rate has a per-window probability of 1.2% (binomial), below the 1.9% per point of the four Western
   Electric rules combined [V], and some of those "false" latches are real bad patches that a flat-rate model cannot
   represent. (c) It cuts oscillation 20× against the rule CONDUCTOR §3.3 states (0.49 vs 9.9 flips). CM-A1 replaces
   the 15% base rate with real closes.
2. **R2 was evaluated wrongly in the fragment.** It fired once over 40 sittings. The Conductor runs it every night
   over a ring, and that triples the false-latch rate at the old thresholds (2.1% one-shot → 23.5% rolling). The
   ring also had to grow from 8 to 16 closes: with 8, "≥ 4 late and ≥ 4 early" is satisfiable only by an exact 4/4
   split. The thresholds move to on ≥ .40 / off < .20, giving 15.9% false latch and 91.3% hit. The alternative
   n ≥ 5 (9.4% / 76.5%) gave up too many true children.
3. **R6 hysteresis cuts oscillation about 3×** (0.19 vs 0.56 flips at I = .05) and raises correctness for real fast
   and slow learners (84% vs 76%). It costs correctness near the threshold (η = +0.3: 79% vs 90%), because a latch
   that should not have entered takes 2 refits to leave. The doc takes the asymmetric version: up after 2 refits,
   down after 3. The down direction withholds new skills, so it gets the stricter run (9.4% vs 12.2% steady moved,
   in the 3-refit column). Both are bounded by KT's own mastery gates: a faster pace never skips evidence.
4. **R6 detection is slow:** about day 9-13 of nightly refits, so 2-3 weeks of school days. That is acceptable for a
   pace knob and is reported as is.

Limits of the sim, all [U]: independent closes (real strain is autocorrelated, which would *raise* both hit and
false-latch rates); a flat 15% base rate; the sitting-hour distribution; I per opportunity. CM-A1-A3 replace each.

### 8.4 conductor-sim personas that must trip each rule (G4)

The `DayPersona` contract is `adaptation.contracts.ts` §7. G4 runs 8 seeds of each. Each persona has a rule it must
fire inside a window, and the planted negative control that must trip the named gate.

**`latch_walker`** (new; B2, age 8, 8 weeks; the one persona that must trip **every latch on and then off**, in a
scripted order):

| weeks | script (truth) | must turn ON (window) | must turn OFF (window) |
|---|---|---|---|
| 1 | steady: P(bad) .10, all sittings 17:00-19:00 | nothing (any latch on = fail) | — |
| 2-3 | P(bad) .75 in week 2, then .05 | R1 by the 5th week-2 sitting | R1 within 4 fine sittings of week 3 |
| 2 | a 9-day gap (no opens), then return | R8 `reanchor_light` + success-first on return; R3 within 2 nights of return (backlog ≥ 6) | R3 once overdue ≤ 2 (by the end of week 3) |
| 3-5 | true η = +0.9 | R6 → 2 by day 21 (B2 is not capped; nOpps ≥ 30 after about 4 sittings) | — (stays on until week 8) |
| 4-6 | half the sittings at 20:30 with P(bad) .80, half at 17:30 with .10 | R2 by the end of week 5 | R2 by the end of week 8, once the late arm is fine again (P(bad) .10 from week 7) |
| 5-6 | dependency δ high (metacognition-srl-depsim generator) → `learner.dependency_flag{lesson,on}` | R7 at the next night fold after the flag | R7 in week 7-8: the flag clears and the solo ok rate is set to .6 (< .7) |
| 7 | 3 of 5 sittings end `bedtime` at < 60% of planned | R14 card once | not again inside 14 days |
| 8 | true η drops to 0 (refit drifts back) | — | R6 back to 1 within 4 refits of crossing inside ±.25 |

**Per-rule coverage** (every R must fire in at least one persona; the fragment's ids are kept):

| persona | band | must fire | planted negative control → must trip |
|---|---|---|---|
| `fast_learner` | B3 | R6 up | a planner that adds 5 `plannedMin` when η > .5 → V26, I-A7 |
| `wheel_spinner` (prereq gap) | B2 | R5 then R4 | R4 re-switching inside 3 days → V17 |
| `over_reliant` | B3 | R7, R12 (`show_work`) | a rule removing hints on the flag (the punishment srl §5.5 item 4 bans) → I-A1 (not a permitted knob) |
| `tired_every_evening` | B1 | R1 (R2 must **not** fire: there is no early arm) | the CONDUCTOR §3.3 one-close rule (1/1, r=1) → I-A3 (flip budget) |
| `interest_switcher` | B2 | R11 honoured; R8 `thread_return` | interest overriding a due-review floor → V21 / I-A1 |
| `goal_setter_teen` | B4 | R13 with MCII (age 13, opt-in); R8 `goal_review` | MCII offered at age 10 → V23 |
| `exam_vs_thread` | B3 | R9 × .5; R11 blocked + `choiceAck` | the child's choice adopted outside the test chapters → V22, I-A2 |
| `low_budget_b1_test` (= the §5.4 child) | B1 | R10 `{cascade, tap}`; R1; R0 test topic | a planner that ignores R10 → `governorGuard` narrows → I-A10 |
| `stale_refit` (new) | B3 | none: the refit job is down 3 days while η reads +0.9 | R6 moving on a stale `kt.eta` → V25, I-A5 |
| `latch_walker` (new) | B2 | every latch (table above) | each latch with hysteresis removed → I-A3; a fold that counts nights instead of closes → I-A6 |
| `routine_vs_vibe` (new) | B2 | R14 from `endedBy` only | R14 reading `vibeClose` → V27, I-A8 |

---

## 9. Measurements this policy depends on (CM-A)

Each is logged with n, method and date before the rule it governs leaves its [U] default.

| id | measure | method and n | decides |
|---|---|---|---|
| CM-A0 | **`vibeClose` label reliability**: the Director's close label vs two human raters on recorded closes | ≥ 100 closes stratified by band, Cohen's κ; the bar is κ ≥ .6 | whether R1/R2 may run on it at all. Below the bar they run on explicit child statements only |
| CM-A1 | base rate and autocorrelation of bad closes per band; R1 false-latch and hit on real data; does the latch help the next close? | the first 30-child cohort's closes for the base rate; then a plan-level MRT (latch arm vs no-shortening arm when the latch would fire). 92 child-months for +8 pp at ρ .05 (§8.1) | R1 k/m/r and the × 0.7 factor |
| CM-A2 | sitting-hour distribution and per-child late-vs-early contrast | M0-M1 closes; R2 false-latch recomputed by the sim fed real hours | R2 thresholds and the 20:00 cut |
| CM-A3 | η refit stability and real per-opportunity information | split-half η on children with ≥ 60 opps; day-to-day refit drift; refit the sim with the measured I | R6 thresholds and runs |
| CM-A4 | R3/R4/R5 effect on unsticking and delayed retrieval | MRT at wheel-spin: switch representation vs prerequisite check first; outcome = 3 in a row within 10 more opps, and the DRS at +1 day | R3 counts, R4 cooldown, R5 .4 / depth 3 |
| CM-A5 | R9 share vs the next school test and level gain per strand | observational, then within-child weekly randomisation of the share (±.1) | R9 slope and caps |
| CM-A6 | the extra solo round's effect on solo OK rate and decline rate | MRT at the R7 decision | R7 on/off thresholds |
| CM-A7 | choice offers: take rate, teacher's-pick rate, `choiceAck` follow-through; opener kinds vs warm-up success | logs; opener kind randomised among eligible kinds | R8 order, R11, R13 cadence |
| CM-A8 | `adapt` size p99 in production | `pg_column_size(state->'adapt')`, daily | I-A9 bound, ring size |
| CM-A9 | guard narrowings of `plan.adopt` (must be 0), and plan churn: versions per child-day with no visible slot change | `decision_log` audit counts | AD4 reversal; the `inputsHash` quantisation steps |

---

## 10. Validator rules and invariants (to merge into CONDUCTOR §4.5 and §9.9)

### 10.1 Plan validator additions V15-V27

Each has a negative-control fixture in `tests/conductor/validate.adapt.test.js`.

| id | rejects a plan that … | source |
|---|---|---|
| V15 | puts an adaptive knob outside its bounds (§4 "bounds that hold") | §4 |
| V16 | has a knob that differs from R0's value without a `RuleFiring` naming it, or a firing that changed nothing | trace completeness |
| V17 | switches a skill's representation within 3 days of the last switch, to the family it came from, or to an engine in `avoidEngines` | R4 |
| V18 | prereq-checks a skill checked within 3 days, deeper than 3, or more than once per lesson | R5 |
| V19 | uses an opener kind whose source is absent (`goal_review` without an active goal, `thread_return` without an open thread, `callback` without `tm.opener.available`) | R8, V5 |
| V20 | has `newSkillBudget` > 0 in the last 2 days of a test window, new skills above `newSkillBudget`, or > 1 for B1 | R6, DC11 |
| V21 | carries a firing whose (layer, knob) is not in `MAY_PROPOSE`, or a constraint that `registerConstraint` would refuse | I-A1, I-A2 |
| V22 | adopts a child choice outside the domain the higher layers left, drops a blocked choice without `choiceAck{honoured:false}`, or offers a choice between the core and fluff | R11, LS-26 |
| V23 | has > 1 active goal, a goal with > 1 skill or task, MCII fields under age 12 or without the opt-in, or a goal card while a goal is active | R13, need §4.6 |
| V24 | has a firing whose evidence key is missing from the step's recorded view (`brief_snapshot`) | §2, X34 |
| V25 | has a firing whose evidence includes a key read stale | §2, I-A5 |
| V26 | raises `plannedMin` or the cap above the normal-day plan through any rule, changes the praise dose, or puts η, θ or a gap number in any child- or parent-facing field | CONDUCTOR §4.4, kt R18 |
| V27 | has a routine card whose evidence includes any vibe key, more than one in 14 days, or one sent as a push | R14, pl PA-6 |

### 10.2 Invariants I-A1…I-A11 (each with its negative control)

| id | predicate | negative control (must trip) |
|---|---|---|
| I-A1 | no knob takes a value proposed by a layer outside `MAY_PROPOSE` | a vibe rule proposing `reviewShare` .15 (in `adaptation-worked-example.mjs`) |
| I-A2 | every constraint passes `registerConstraint`; 0 `empties_domain` drops among constraint layers across G4 | an empty budget domain; a budget bound on `segmentMinutes` |
| I-A3 | per latch, under steady personas: oscillation mean ≤ 0.6 and p90 ≤ 2 flips per 8 weeks (R1 measured 0.49 / 2.0; R2 0.32; R6 0.19) | the 1/1, r=1 latch (9.9 flips) |
| I-A4 | `planDay` is byte-deterministic in `inputs`; equal `inputsHash` ⇒ equal plan bytes; preference insertion order does not matter | `Date.now()` inside `planDay`; an unsorted `homework` array |
| I-A5 | no firing reads a stale key (V25) | `stale_refit`: a 40 h old `kt.eta` = +0.9 must not move pace |
| I-A6 | `foldNight` is idempotent per day and runs exactly once per learning day, with catch-up | a fold that increments `fineRun` per night instead of per close |
| I-A7 | no adaptation raises `plannedMin`, the cap or the praise dose (V26) | a planner adding 5 minutes when η > .5 |
| I-A8 | `vibeClose` never reaches a parent surface or the routine card (V27) | R14 reading `vibeClose` |
| I-A9 | packed `adapt` ≤ 1,536 B at maximum fill (measured 1,016 B) | the unpacked codec (4,343 B), or ring 32 |
| I-A10 | `GUARDS` narrow no `plan.adopt` in G4 (count = 0) | a planner that skips R10's constraint |
| I-A11 | `latch_walker` turns every latch on and off inside its windows (§8.4), on 8/8 seeds | any latch whose window is missed |

---

## 11. Rulings for CONDUCTOR revision 3, contract deltas, and open questions

**Rulings** (entered in CONDUCTOR §0.2 as X41-X48): AD1-AD10 above, condensed. In particular, CONDUCTOR §3.3's
"a strained/tired close makes tomorrow's opener success-first with shorter segments" becomes "success-first after
one bad close; shorter segments only under the R1 latch".

**Contract deltas applied to `adaptation.contracts.ts` in this pass** (it still type-checks alone):
- `RuleId` gains `R0`. `RuleSpec` gains `alsoKnobs`. `RULES` is the §4 table as data.
- `AdaptMemory` gains `foldedDay`, `reviewBacklog` (R3), `soloUp` (R7), `paceBudget.backRun` and `routineCardDay`.
  The ring is 16 closes. `repSwitch`/`prereqChecked` are capped at 8 entries.
- `T`: R2 `GAP_ON .40 / GAP_OFF .20`; `RING 16`; R3, R6 exit/asymmetry, R7, R13 and R14 constants; `HASH_Q` steps.
  The R1 comment now states the child-level false-latch rate.
- New §8 `PlannerInputs`, `PlanKeys`, `PlanDay`, `quantise`; §9 `registerConstraint`.

**Open questions.**
1. CM-A0 can fail. If Director close labels are unreliable, the vibe axis of the owner's demand reduces to explicit
   statements and R14's facts. The doc prefers that to adapting on noise.
2. Autocorrelated strain (illness weeks, exam weeks) is not in the sim. A two-state HMM persona would test whether
   3/4 still detects within 4 sittings.
3. Siblings on one phone share sitting hours, so R2's late arm is partly the household's. Should R14's card then go
   to the household and not per child? [U]
4. MCII at 12+ rests on adolescent evidence (n = 66). The 10-11 range is untested, so it stays out.

---

## Sources

Checked this session ([V] where the abstract or the specification was read):
- RFC 8785, *JSON Canonicalization Scheme (JCS)*: sorted keys, ECMAScript number serialisation, I-JSON, "hashable"
  output [V] — https://www.rfc-editor.org/info/rfc8785/
- Western Electric rules (1956 *Statistical Quality Control Handbook*): 2-of-3 / 4-of-5 run rules; per-point false
  alarm ≈ .0027/.0031/.0055/.0078, ≈ 1/53 combined [V summary] — https://en.wikipedia.org/wiki/Western_Electric_rules ;
  in-control ARL 94.75 vs 370.4 with supplementary runs rules — https://arxiv.org/pdf/1007.3225
- Schmitt trigger: two thresholds, so noise inside the window cannot toggle the output [V] —
  https://www.wevolver.com/article/schmitt-trigger-robust-comparator-design-with-hysteresis
- Change detection: the trade-off between detection delay and false-alarm rate (ARL); CUSUM, Page 1954 [S] —
  https://arxiv.org/pdf/2104.04186
- Beck & Gong 2013, *Wheel-Spinning: Students Who Fail to Master a Skill*, AIED: ≥ 10 opportunities without 3 correct
  in a row [V abstract/summary] — https://www.semanticscholar.org/paper/Wheel-Spinning:-Students-Who-Fail-to-Master-a-Skill-Beck-Gong/0890bd77b4615cbe9aa6be27b4c9aa6772f3d74f
- Yudelson, Koedinger & Gordon 2013, *Individualized Bayesian Knowledge Tracing Models*, AIED: per-student learning
  speed helps more than a per-student prior [V abstract] — https://www.semanticscholar.org/paper/Individualized-Bayesian-Knowledge-Tracing-Models-Yudelson-Koedinger/55a51b86f6739f1d04556ffe0b69ae2d77a347b3
- van der Heijden, de Sonneville & Althaus 2010, *Time-of-day effects on cognition in preadolescents: a TRAILS study*:
  ages 10-12, sessions at 08:30 (n = 802), 10:00 (713) and 13:00 (652); effects only under demanding conditions
  [V abstract, Europe PMC] — https://pubmed.ncbi.nlm.nih.gov/20969529/
- Mace et al. 1988, *Behavioral momentum in the treatment of noncompliance*, JABA: a high-probability request
  sequence raised compliance in 5 experiments [V abstract] — https://onlinelibrary.wiley.com/doi/10.1901/jaba.1988.21-123
- Duckworth, Grant, Loew, Oettingen & Gollwitzer 2011, *Self-regulation strategies improve self-discipline in
  adolescents*, Educ. Psych. 31(1): n = 66, MCII → > 60% more practice questions [V abstract] — https://eric.ed.gov/?id=EJ911106
- Liao, Klasnja, Tewari & Murphy 2016, *Sample size calculations for micro-randomized trials in mHealth*, Stat Med
  35(12) [V] — https://onlinelibrary.wiley.com/doi/abs/10.1002/sim.6847

Via sibling docs, not re-fetched [S]: Patall, Cooper & Robinson 2008 (`design/lesson-arc.md`,
`design/motivation-without-rewards.md`); FSRS target R 0.9, the η prior and pyBKT parity (kt §2.3-2.6); Wilson et al.
2019's 85% rule as a sanity anchor only (MI §2.6); Renkl fading and Bastani 2025 (srl §2); Wood 2005 re-anchoring
(dc §7.4); Gollwitzer & Sheeran 2006 (CONDUCTOR Sources).

Internal [repo]: `CONDUCTOR.md` §2-§4, §9; `adaptation.contracts.ts`; `adaptation-hysteresis-sim.py`;
`learner/kt-algorithms.md` §2.3-§2.6, R18; `learner/vibe-temperament.md` §4.1-§4.2, §4.10, R6 item 54;
`learner/metacognition-srl.md` §3.5, §5.5; `learner/motivation-interest.md` §2.2, §2.6; `learner/need-goals.md` §4.6-§4.7.
