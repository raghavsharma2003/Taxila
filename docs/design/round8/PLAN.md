# Round 8: she teaches the child in front of her

**Status:** plan, set by the main loop on 2026-11-10 under `dc-owner-direction-is-main-loops-2026-11-10`. Decisions: `dc-r8-selection-before-generation`, `dc-r8-one-reader-with-because`.

## Where round 7 leaves us

- The scripted lesson is sound on four topics: director18 has 0 misgrades, 0 wrong keys, 0 boards shown before she spoke, and 9 screen/speech mismatches that are one bug (`judgements/director18-2026-11-10.md`).
- The learner model is built and fed. Every script card and every game level writes a `kt_evidence` row, and the ledger folds them into `kt_skill_state`.
- **Nothing the model knows changes a scripted lesson.** The walk reads no learner state: it walks every beat of every scripted skill in kit order (`server/director/state.js:1282-1290`). Two children with opposite histories get the same lesson, except for the hook's interest line and the language.
- **No generated visual has ever reached a child.** The tray gate refuses every generated spec because nothing sets a judge verdict (`server/forge3/tray-gate.js:205-208`; `judgeArtifact` has no caller).

So the product today is a careful scripted teacher that does not yet know who she is teaching. Round 8 closes that.

## The aim, as a test

**A child's second lesson differs from her first because of what she did in the first, and every difference names the fact that caused it.**

The round is done when, for the four pilot topics:
1. Two simulated children with different histories, on the same topic, get lessons that differ in at least four named ways (below), with no model call needed to show it.
2. Every learner-driven choice in a lesson carries a `because` record naming the learner fact, and the parent's lesson page shows those in plain words.
3. One generated visual, aimed at a child's actual mix-up, is shown inside a scripted lesson after passing the approval lane.
4. A hand-judged run (director style, about $1) scores a new axis, "taught this child", at 3.5 or above in every topic, with the existing gate still passing.

## Decision 1: selection before generation (`dc-r8-selection-before-generation`)

She first knows the child by **choosing among verified things**, not by generating new ones during the lesson.

| Layer | What changes per child | Made by | Checked by |
|---|---|---|---|
| 1. Selection | topic, opener, which units are compressed, first card, which remediation, hook, joints | code reading the learner model | predicates and unit tests; no model |
| 2. Dress | the nouns and labels of an example (12 laddoo or 12 cricket balls), same numbers, same key | authored closed sets per interest, filled by code | validator: every line and board true for every dress |
| 3. Library | visuals aimed at one mix-up, built ahead of the lesson | a model, offline | Claude judges in batches in-session, then approved into the ready-made library |
| 4. Live | a visual built during the lesson | a model, in the lesson | predicates only, at three screen sizes; shown only for templates where predicates are enough |

**Why:**
- The owner's complaint about earlier rounds was display failing. Every display failure came from layer 4 done without a gate. The four pilots' boards are all layer-1 templates and pass.
- "A model never grades" is an inherited law. A model-judged live lane would break it; a predicate-gated one does not.
- Judges are Claude in-session by directive, and builds are Azure-only. A runtime judge cannot be Claude, so judged generation has to happen ahead of the lesson (layer 3).
- Layers 1 and 2 cost nothing per lesson and are where the learner model already has the facts.

**Reverse if:**
- Children see a repeated example or visual within five lessons on a topic because the verified sets are too small → widen layer 4 for that template family.
- Layer 4 shows 0 display faults over a judged batch of 100 generated visuals across three sizes → it becomes the default for that family.
- Layer 2 dress costs Learning more than half a day per topic to author and validate → generate dress sets offline and judge them (move to layer 3).

## Decision 2: one reader, and it says why (`dc-r8-one-reader-with-because`)

One pure module, `server/director/knows.js`, turns what is known about a child into the lesson's choices. The walk calls it once at the start and once per unit. It returns the choices and, for each, a `because` record.

```
planFor({ script, skills, mixups, brief, interests, memory }) →
  { opener, hookSlot, compress: [skillId…], firstCard, remedyFor: {cardId → remediationId},
    ladderOrder, because: [{ choice, fact, source }] }
```

- No choice is made anywhere else. `state.js` keeps one call site per choice.
- A choice with no fact behind it is the script's default and has no `because`.
- A predicate throws in tests when the walk departs from the script's order with no `because` record.
- The parent's lesson page reads the `because` list. "Aaj bhinn ki pehchaan dobara nahi padhai, kyunki Riya ne pichhli baar teeno sawaal bina madad ke sahi kiye."

**Why:** the learner audit found seven plan decisions computed and then dropped, each at a different seam (LEARN-20). Scattering seven readers through a 4,000-line file is how they got dropped. One module is testable without a lesson, cannot be half-wired, and gives the parent report its content for free.

**Reverse if:** a choice needs mid-turn state that `planFor` cannot see without being called on every turn (then it becomes a per-turn reader, still one module).

## The choices, in build order

| # | Choice | Learner fact it reads | Today |
|---|---|---|---|
| K1 | **Compress a known skill.** A skill the ledger holds as learned, with a passed delayed check, opens at its first check card. A right answer moves on; a miss returns to the full unit | `kt_skill_state` status, delayed-check result | walks every beat |
| K2 | **Success first.** After a lesson that closed badly, or in the first week, the first card is the easiest unseen one | `adapt.closes`, `learner.firstWeek` | not passed to the lesson |
| K3 | **Remediation by her real mix-up.** The remediation is chosen by the mix-up the classifier just named, then by her open mix-ups in the ledger, then by the card's authored target | `cls.misconceptionId`, `kt_misconception` | authored target only |
| K4 | **Prerequisite check.** A skill she is spinning on gets one check of its weakest prerequisite in the warm-up | `kt.wheelSpin` | computed, dropped |
| K5 | **No new skill before a test or in week one.** The topic is a revision topic | `newSkillBudget` | computed, dropped |
| K6 | **Hook and joints by interest.** Every onboarding tile maps to a slot through the interest registry (today `trains`, `building`, `stories`, `dance` fall to slot 0, and two slots name tiles that do not exist) | `child.interests` | exact label match |
| K7 | **Opener after a gap.** One easier warm-up item, no new skill in the first three turns | `counters.lastActiveDay` | computed, dropped |
| K8 | **Prefer a scripted topic** among equally due candidates, while scripts are few | script existence | not considered |

The brief is cut at lesson start from learner state whether or not a day plan exists, so none of this waits on `TAXILA_CONDUCTOR_PLAN`.

## Streams

| Stream | Owner | Work | Waits on |
|---|---|---|---|
| **Loop** | new session, `claude/r8-loop` | `knows.js`, K1 to K8, the `because` trace, the two-children eval (`evals/knows-her/`), the parent page's "why" lines | integration 24 |
| **Evidence** | learner audit session | verify and fix: the writer's `params_version` default (`kt-r2`) against the ledger's (`kt-r3`); whether "simpler used" counts as assisted; whether a give-up on a script card weighs as a kit leave; game events reaching the Conductor; the brief without a day plan | none |
| **Pilot loop** | Brain, Studio, Learning | v6.10, P6, D13 → director19 | each other |
| **Play** | Games | P1: one picker over every game that admits the skill, ranked by what it would reveal about her open mix-ups, with a `because` for each choice. P2: the next level follows what she just did. P3: a compact trail of how she played, and play from the home screen signed for the learner model | the Evidence stream's rule for how much home play counts |
| **Made for her** | Studio | the offline approval lane (layer 3): a generated visual per pilot topic aimed at one named mix-up, checked by predicates at three sizes, judged by a separate Claude judge, stored approved, and accepted by the tray gate by hash. Main runs the paid spec calls; streams hold no key. Then a 20-topic sample re-check of the older catalogue | none (`docs/design/round7/studio/APPROVAL-LANE.md` approved 2026-11-10) |
| **Dress** | Learning | format 2.4 `dress` sets for the four pilots, validator | director19 passing |
| **Scale** | Learning | the 30 staged topics regenerated and judged in one batch; then batches of 30 by `SCALE.md` | director19 passing; owner's yes for bulk Azure spend |
| **Release** | Platform | round 7 to production (release 16) | owner: Neon key for the pending migrations |

## What stays the owner's in this round

- Raising the memory write mode from M1 to M2, which is what lets her remember a child's interests and preferences across lessons. It concerns real children's data. Round 8 builds and tests it on simulated children only.
- Bulk generation spend (layer 3 library, script batches beyond the approved 30).
- Release 16's database key.

## Measured, not assumed

- The two-children eval is deterministic and runs in the gate.
- "Taught this child" is a judged axis on a paid run and is not claimed until a run is judged.
- Nothing here measures real children. No claim about learning gain is made in round 8.
