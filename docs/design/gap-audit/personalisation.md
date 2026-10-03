# Gap audit: how each child learns best, and hyper-personalisation on the go

Audit date: 2026-10-03. Auditor: a gap-audit subagent. This is an audit only: no code was changed, no commit was made, and this is the only file written.
Production: `https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`, probed from the US sandbox over the agent proxy. No timing below includes the round trip from India.

**Owner intent under test:** "understanding how each student learns best, and on that basis building hyper-personalised learning on the go with AI resources."

**Tags:** [M] measured on production in this audit · [T] read in the code in this audit (file:line) · [U] inference or unverified.

---

## Verdict in one paragraph

Today a production lesson personalises four things: the child's first name, the aap/tum register, **one decorative interest analogy in the greeting and the hook**, and a binary novice/experienced switch. Everything else a child meets is identical across children: the same practice items, numbers, diagrams, module, pace and length. The research and the specs for "how this child learns best" are deep and correct. They reject learning styles and name the real levers: guidance level, the representation that repairs this child's errors, forgetting rate, interest contexts and pace. **None of those levers is closed in production.**

- The re-teach bandit samples flat Beta(1,1) priors, so its choice is effectively random.
- Format allocation always picks the kit's primary format.
- The worked-example fading data in every kit is never read.
- The per-child learning layers (format trials, interest memory, slow vibe, learning speed η) have **no write path in the only legal mode a child can be in (M1)**.
- The Conductor wrote no day plan for any of the 12 probe children.
- Forge's per-child game fills are not wired into the lesson.
- Nothing measures whether any personalisation helped.

The parts are well engineered and tested in isolation. What is missing is the **loop**: decide, observe the outcome, update, and decide differently next time for this child.

---

## 1. What was measured on production [M]

### M1: interest and behaviour arms, 24 lessons, 2 topics

- **Method.** One guardian account. For each of 2 topics (`c5-maths-ch02-t01` fractions on a number line; `c6-science-ch02-t01` grouping plants) there were 6 children, identical except for one input.
- **Setup per child.** The child got consent (`core_tutoring`, `learning_profile`, plus `memory` as set by the arm) and controls of 00:00-23:59 / 120 min. It then ran lesson 1: `text` lane, the topic pinned, 8 scripted child turns, end. Then `GET /api/child/plan`, then lesson 2 (`purpose: practice`, 4 turns, end), then `GET /api/child/plan` again. `DELETE /api/account` cleaned up (confirmed "deleted").
- **Sample.** n = 1 lesson per arm per topic, so 12 lesson-1 runs and 12 lesson-2 runs. The model is stochastic, so read the patterns, not the single lines.
- **Script and raw JSON** (ephemeral sandbox): `/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/pz-probe.mjs`, `pz-c5.json`, `pz-c6s.json`. The excerpts below are the evidence of record.

| arm | the one difference | what changed in the lesson |
|---|---|---|
| A-cricket | parent interest `cricket`, memory consent on | the interest appeared in **2/2** opening and hook lines in both topics, and in **0/7** later turns in both. Lesson 2: in the greeting again |
| B-space | parent interest `space` | the same pattern: 2/2 early, 0/7 later |
| C-cricket-nomem | `cricket` with memory consent **off** | 0 interest mentions in either lesson. **The consent is honoured** |
| D-drawing | `drawing` (an onboarding tile that has no Forge skin) | 2/2 early, 1/7 later (c5) and 0/7 later (c6) |
| E-none-struggle | no interest; "don't know" ×8 | the same first 5 moves as every other arm (hook, explain, worked ×2, practice), then hint and a break. The lesson-1 note says "No skills were recorded". **Lesson 2 skipped explain and the worked example in both topics** (hook → practice) |
| F-none-chatcricket | no interest; the child *says* "mujhe cricket bahut pasand hai" and "cricket wala example do na" | cricket in 2/7 later turns (c5) and 1/7 (c6): it was used in the session. `memoriesSaved: 0`. **Lesson 2: 0/5 cricket**, so it was forgotten |

**Aggregates (lesson 1):**
- The parent-picked interest reached **16/16** opening and hook lines in the 8 interest-arm lessons, and **1/56** of the later turns.
- **The practice items were byte-identical across all interest arms.** The c5 first item, "Ghar (0) se chai ki dukaan (1) tak ki sadak 2 barabar hisson mein…", appeared in 5/5 arms that reached it. The c6 item, "Pudine ke paudhe ka tana halke se dabaiye…", appeared in 6/6. The interest never touched an item, a number, a diagram or a module.
- **The pace directive was identical in every turn of every arm**, the struggling child included: `TurnResponse.pace` = `{ waitNudgeSec: 4, endpointSilenceMs: 700 }` in 48/48 turns.
- **The module was identical per topic:** `number-line@1` for every c5 arm and `plant-card-sort@1` (an unregistered engine, see `live-content.md`) for every c6 arm.
- **No day plan:** `plan.source.dayPlan` was `null` for 12/12 children after a completed lesson, and again after lesson 2.
- `memoriesSaved` was 0 in 24/24 lessons.
- Turn latency p50 was 1.24-2.08 s per arm, and teacher turns averaged 20-25 words.

**Quality of the one personalisation that does happen.** The analogies are attached rather than built in, and some are forced. Examples:
- "plants ko … group karenge—space garden jaisa!"
- "drawing jaisa easy"
- "school garden mein cricket ball lene jaate waqt aap pehle kis plant ko choose karenge"
- "fractions ko number line par cricket pitch ki tarah"

These lines were good: "rocket 0 km se 1 km tak jaata hai; agar raasta 4 barabar hisson mein ho" (B, c5) and "wicket se crease tak distance ko 1 maaniye; 5 equal gaps mein pehla mark 1/5" (F, c5). The good ones are exactly the shape a validated re-skin pipeline would produce on purpose (§4.3).

**Also observed.** In arm F (c5), a `probe` turn said "Aaj ke liye bas itna." in the middle of the lesson, and then asked a question.

### M2: what could not be measured from here

- Voice and WebRTC cannot run from this sandbox. So the voice-only vibe signals were not exercised: onset latency z (`slowOnset`), barge-in (`len-`), `slowerPace`, and the realtime lane's use of the VIBE row.
- Whether the realtime session's turn detection ever changes per child is unverified on a live call. The code says it is minted once at 900 ms (`server/routes/lesson.js:600`), and the open item `integration-learner-open-2026-10-03` says no client consumes `pace`.
- M2 and M3 behaviour cannot be observed, because no route can put a child in those modes (§2.1).
- Whether the `taxila-worker` Conductor app is deployed was not checked: no Azure credentials were used. The measured fact is only that no day plan exists.

---

## 2. Code audit, component by component [T]

### 2.1 The legal mode makes every per-child "how they learn" layer unwritable

- `server/learner/mode.js:189-195`:
  - M1 writes `kt, mis, ability, need_fact, fade, vibe_explicit, mem_A, lang_tile`.
  - `eta` (learning speed), `mem_B` (interests and preferences), `vibe_slow`, `interest`, `value_arms` and `pz_child` (per-child format trials) are M2 or M3 only.
- `db/migrations/005_learner.sql:10` defaults every child to `M1`.
- `server/learner/writer.js:288` (`ratchetStmts`) refuses any move up: "legal_mode only ratchets down". No route sets M2 or M3.

**Consequences:**
- `formatTrialStmt` (`writer.js:108`, called at `routes/lesson.js:1425`) never runs in production.
- Interest memories the child states are dropped (`routes/lesson.js:1421`).
- The CHILD-BRIEF v2 INTEREST row is gated on `mem_B` (`brief.js interestsAllowed`).

This follows decision `learner-legal-mode-ratchet` (DPDP s.9(3), reversed only by counsel's opinion). The owner has deprioritised compliance but has not reversed this decision. **This is an owner decision, not a bug.** Note also that the same decision lists "format posteriors" among the NM-3 items never persisted in any mode, while `mode.js` puts `pz_child` (format_trial) in M3. The two specs disagree.

What M1 already allows and is unused: `reteach_attempts`, `rep_fluency`, `comp_facet_state`, `kt_*` stability and `vibe_explicit` (all academic record or explicit preference). **A per-child "what repairs this child's errors" model can be built at M1 today** (§4).

### 2.2 The re-teach "Thompson" bandit is blind

`selectReteach` (`server/comprehension/reteach.js:73-140`) is a careful implementation of decision `reteach-randomise-from-second`. Its only caller passes almost nothing (`server/director/state.js:385-387`):

- no `posteriors`: `post(a)` falls back to `{a:1,b:1}` (`reteach.js:121`), so the "thompson" pick is a Beta(1,1) draw per arm, which makes it uniform random.
- no `attempts`, so RT9 "recap via the arm that resolved it before" can never fire (`reteach.js:79-82`).
- `failedArmsThisSession: []` is hard-coded, so prerequisite descent (≥ 2 failed arms) and park (≥ 3) can never fire.
- no `repFluency`, so the representation-fluency exclusion is inert.
- `reteachOutcomeStmt` and `armPosteriorStmt` (`server/comprehension/store.js:55, 88`) have no caller (also listed in `open.md` integration-learner-open). Attempts are written and never resolved, so nothing is ever learned.

### 2.3 Format allocation is not built

- Every explain uses `kit.formats.primary` (`server/director/state.js:228, 264`).
- `kit.formats.secondary` is parsed (`server/content/kits.js:123`) and never read.
- The population Thompson allocation over F1-F8 (LEARNER-MODEL §6.5(b), LS §8.4) has no code. The format trials that would feed it record only `primary` with `allocatedBy: "prior"`, which gives no variation and so nothing to learn from, even in M3.

### 2.4 The guidance level is one boolean, and lesson 2 can invert it

- `isNovice` (`server/director/state.js:76-78`) returns a single boolean, true unless some skill has `pKnown ≥ 0.5` or is learned.
- Every kit's `workedExample.fadedVersion` is loaded (`kits.js:119`) and **read nowhere** in `server/`. This matches hyper-personalisation.md S1.
- Measured (M1 arm E): a child with 0 correct answers and "No skills were recorded" was routed attempt-first in lesson 2, in both topics.
- [U] The likely cause is the class-level prior that `snapshotFromKt` (`server/learner/live.js:217`) projects to `pKnown ≥ 0.5` once a skill row exists. This needs one replay on the ledger to confirm.

### 2.5 Vibe and pace adapt inside the session but change nothing the child can feel

- `personaStep` and `personaKnobs` (`server/persona/adapter.js`) run every turn (`state.js:554, 586`) and compile a VIBE row (`compile.js:270`).
- Its pace outputs (`waitNudgeSec`, `endpointSilenceMs`) go to `TurnResponse.pace`, which no client reads. M1 showed them constant at 4 s / 700 ms in 48/48 turns.
- The realtime turn detection is fixed at mint (`lesson.js:600`, 900 ms).
- The persisted vibe in the legacy brief is a constant: `VIBE_DEFAULT` (`server/learner/model.js:85`).
- Session interest detection works (arm F) but never persists in M1.

### 2.6 Interests: three taxonomies, one decoration point

| where | the list |
|---|---|
| onboarding tiles (`src/child/interests.ts:3`) | cricket, football, space, animals, drawing, music, dance, cooking, trains, stories, building, nature |
| persona (`server/persona/signals.js:5`) | cricket, football, space, animals, dinosaurs, cooking, cartoons, music, drawing, games, vehicles, nature |
| Forge skins (`server/forge/strings.js:8`) | cricket, food, animals, vehicles, films_music, festivals, space, trains, generic |

- Run through `interestIdOf`, **5 of the 12 onboarding tiles map to Forge `generic`**: football, drawing, stories, building, nature. Measured this audit with node over the real modules.
- The parent's labels reach only `SH.greet`, `SH.hook` and `SH.explain` as "if it fits" notes (`server/director/shapes.js`). They never reach items.
- No item re-skin pipeline exists. Hyper-personalisation S6 and personalisation-2026 §3.6 are spec only.

### 2.7 The Conductor day plan

- `server/conductor/planner.js:4-6`: "R2-R7, R9, R11-R14 … are not built yet". Built: R0 band template, R1 success-first, R3 tap burst, R8 re-anchor, R10 lane.
- `lesson/start` reads the plan only for the refusal gate (`routes/lesson.js:491-505`). No code in `routes/lesson.js` or `server/director/` reads a slot's `segments`, `opener`, `successFirst` or `pace.newSkillBudget`.
- In production no plan exists (M1: 12/12 null).
- `scripts/deploy-azure.mjs` deploys only `taxila-web`. A `scripts/deploy-worker.mjs` exists, but whether it has run is unverified.

### 2.8 Forge: the per-child game fill never reaches a lesson

- G1 already personalises in code: the child's recent wrong answers become trap levels, the numbers sit at the KT target, and the interest becomes a skin (decision `forge-live-is-g1-fill`).
- But `routes/lesson.js:430` `forgeSeam.wovenSubStep` is a no-op, and no Director or route code calls `requestFill` or `prefetchLessonFills`.
- `scene@1` mounts only with `FORGE_SCENE_RENDERER=1` (`server/forge/planner.js:16`).
- The sibling audit `docs/design/gap-audit/live-content.md` measured 40/40 `gap` answers. It covers this in full.

### 2.9 The brief v2 is built and unused

- `renderChildBrief` and `childBriefRows` (`server/learner/brief.js`, LEARNER-MODEL §9.1: the SKILLS, PREREQ, WATCH, REVIEW, SUPPORT/fade and NOTEBOOK rows) have **no caller**.
- The lesson compiles the legacy `buildChildBrief` (`routes/lesson.js:528`), whose vibe is a constant.

### 2.10 Nothing measures personalisation

- There is no micro-randomised trial (MRT) code: no reference in `server/` or `shared/`.
- No decision is joined to an outcome (`y_next`, `y_delay`, `y_transfer`).
- `context/measurements.md` has **no entry** for the effect of any personalisation knob. The only near entry is `persona-invariants-2026-10-03`, a safety gate.
- personalisation-2026 §3.7-§3.9 (the outcome ledger, the MRT factors F-START…F-PRO, the HTE gate) is spec only.

### 2.11 Parents cannot see what works for their child

- Reports carry no "what helps {child}" section. Decision `reports-no-interest-line` removed the interest line, which was correct after `reports-interest-from-memory-text`.
- The struggling child's lesson-1 note (M1, arm E) is generic: "use a strip of paper divided into equal parts".

---

## 3. Ranked gaps

The severity scale is **blocks testing** (the owner cannot test the pillar at all) · **degrades** (it works, but not as intended) · **polish**. Estimates are focused agent-days including tests and the sim gate, not calendar time.

| # | gap | severity | evidence | work to close it | est. |
|---|---|---|---|---|---|
| 1 | **No per-child loop over how the child learns.** Arm outcomes are never resolved, the posteriors are never written, and the bandit gets no history | blocks testing | `state.js:385-387`; `reteach.js:121`; `store.js:55,88` unused; M1 shows the same moves for E as for everyone | Resolve each `reteach_attempts` row at the next unaided item (`repaired_now`), the next session (`resolved_next`) and the delayed covert check (`resolved_delayed`) with `armReward`. Write `arm_posteriors` (population, no child id). Load the child's attempts, posteriors and `rep_fluency` at lesson start and pass them in. Track `failedArmsThisSession`. Sim gate: RT-M2 in `evals/` with 20 seeds | 3-4 |
| 2 | **The per-child learning layers have no write path** (`pz_child`, `mem_B`, `eta`, `vibe_slow`) | blocks testing (owner decision) | `mode.js:189-195`, `writer.js:288`; `memoriesSaved` 0/24; arm F forgot cricket in lesson 2 | **Owner decision D1:** keep M1, and personalise only from the academic record (gap 1 and §4, which is enough to test the pillar), **or** add a consented M1→M3 move: a new consent "Remember how {child} learns best", an audited ratchet-up statement, and a Data and privacy row. Resolve the format-posterior contradiction between NM-3 and `pz_child` either way | 0.5 (M1 path) / 3 (M3 path) + counsel |
| 3 | **The guidance level is binary and can invert.** `fadedVersion` is unread | degrades | `state.js:76`; `kits.js:119`; arm E lesson 2 went hook → practice in 2/2 topics | Replace `isNovice` with `guidanceLevel ∈ {example, faded, attempt}` per skill, set from pL plus a first-step probe (S2). Add `server/director/fading.js` for backward fading on the kit `fadedVersion` (S1), with the whiteboard holding the steps. Confirm the E cause by replaying the ledger | 4-5 |
| 4 | **Interests are a greeting decoration, never content** | degrades | 16/16 early vs 1/56 later; the items were byte-identical across arms; forced analogies (§1) | One shared interest registry (`shared/interests.js`) used by onboarding, persona and Forge. The S6 interest-context pipeline: kit item → re-skin in the child's own phrase → realism, solvability, readability and locale validators (taxila-brain) → `kitmath` isomorphism check (code) → fall back to the kit. Plus the S7 nightly corpus audit. Interest stays an F knob until F-INT shows learning | 5-7 |
| 5 | **Five of twelve onboarding tiles have no Forge skin** | degrades | `interestIdOf` over `src/child/interests.ts` gives football, drawing, stories, building and nature → `generic` | Part of gap 4's registry. Add skins and HOOKS rows for the 5 (a reviewed strings-table change plus the Content Safety pass in `evals/forge-g1.mjs`) | 1 |
| 6 | **Forge per-child fills are not in the lesson** | blocks testing ("games built for this child") | `lesson.js:430` no-op; no `requestFill` caller; `live-content.md` 40/40 gap | Owned by the live-content gap list. From the personalisation side, `prefetchLessonFills` must take the child's wrong answers and KT targets from the same per-lesson snapshot gap 1 loads | (see live-content) |
| 7 | **Format allocation is not built** | degrades | `state.js:228,264` always use `primary`; `secondary` unread | Population Thompson sampling over the eligible F1-F8 for (topicType, band), with a hard expertise-reversal gate and a 20% floor. Log every allocation with p. When the top two are within 0.1, offer the child a two-way pick. Reward = the `y_next`/`y_delay` join (gap 9) | 4 |
| 8 | **The Conductor day plan is absent, and the lesson ignores it** | degrades | 12/12 `dayPlan: null`; `planner.js:4-6`; no slot reader in `lesson.js` | Make sure a plan is written (deploy `taxila-worker`, or call inline `step()` after lesson end). Have `lesson/start` read today's slot: opener, successFirst, `newSkillBudget`, segments. Build R2 (what worked yesterday → today's entry guidance) and R4 (forgetting-driven review selection) from gaps 1 and 3 | 3-5 |
| 9 | **No closed loop measures any personalisation** | blocks testing ("does it work?") | no MRT code; no measurement entry | `decision_log` rows for every personalisation decision (knob, arm, p, availability, context hash), an outcome join job (`y_next`, `y_delay` from the existing delayed checks, `y_transfer`), a weekly excursion-effect report (GEE) with a baseline-tercile split, the HTE gate, and the same battery in the student simulator before production | 5-7 |
| 10 | **Pace adaptation never reaches the child** | degrades | `pace` constant 48/48; no client reader; realtime fixed at 900 ms | The client reads `TurnResponse.pace` (nudge timer). On a voice call, `session.update` sets `turn_detection.silence_duration_ms` when the knob moves (bounded 600-1200 ms). Persist the explicit pace preference (`vibe_explicit`, allowed at M1) | 2 |
| 11 | **The brief v2 is unused** | degrades | `renderChildBrief` has no caller; `model.js:85` `VIBE_DEFAULT` | Switch `lesson/start` to `renderChildBrief(BriefView)`, adding SUPPORT/fade and REVIEW from the ledger, under `check-prompt-budget` and G1 position tests | 1-2 |
| 12 | **Parents never see what helps** | polish (degrades the parent value) | reports have no learning-profile section | Code-built, evidence-cited "What helps {child}" claims from resolved re-teach outcomes. Example claim shape (a fixed string from `reports/templates.js`, not model text): `{representation} resolved {n} of {m} mix-ups`. Hedged wording ("still learning what works best for …") until the posterior is ≥ 0.9 on ≥ 8 delayed comparisons (LEARNER-MODEL §6.5b) | 2-3 |
| 13 | **Mid-lesson "Aaj ke liye bas itna."** in a probe turn | polish | arm F, c5, turn 5 | Add a floor or lint rule: wrap language is allowed only on `wrap` moves (the `say.js` reply guard) | 0.5 |

---

## 4. What real hyper-personalisation looks like here (the design)

### 4.1 The principle: a Personal Teaching Model, not a style label

Learning styles stay rejected (`rj-style-attribute-to-generator`, LS §2: meshing d = 0.04). "How Riya learns best" is a small set of **measured, per-child, per-skill-type quantities**. Each one has a lever that the literature shows moves learning:

| PTM field | meaning | source of evidence | lever it drives | mode |
|---|---|---|---|---|
| `knows[skill]` | pL, retention | KT ledger (exists) | topic choice, review, item difficulty | M1 |
| `guidance[topicType]` | example / faded / attempt | first-step probe; fade evidence; unaided after faded | entry rung, worked-example ladder | M1 (`fade`) |
| `repairs[conceptFamily]` | per arm: attempts, resolved_now/next/delayed | `reteach_attempts` outcomes (gap 1) | re-teach arm; RT9 recap; parent "what helps" | M1 (academic record) |
| `forgets` | the child's FSRS stability against the band | ledger stability per skill (exists); η at M2+ | review spacing, weave hosting | M1 per skill, M2 child-level |
| `pace` | wait, endpoint, turn length | explicit requests; session signals | nudge timer, VAD silence, turn words | explicit M1, slow M3 |
| `cares` | ≤ 3 interests in the child's own words (≤ 6 words each) | parent tiles; the child said it twice | context skins, hooks, G1 skin | parent tiles M1 under the memory consent; child-said M2+/P3 (D1) |
| `language` | matrix, insertion of English, terms | `lang_tile` / observed mix | register, terms | M1 |

Rules:
- Population priors always come first. A per-child deviation is used only after the HTE gate (personalisation-2026 §3.9).
- No field is ever a trait or an ability label (brief fences).
- NM-3 items stay session-only: affect, engagement, latency.

### 4.2 Where the PTM changes a live lesson (the on-the-go part)

At `lesson/start`, one snapshot (the same per-lesson memo Forge already uses) feeds a **Personal Item Compiler**. It runs over the next 3 to 6 items in the background (the prefetch) and once per turn for the next item, and it is deterministic where it can be:

1. **Which item:** the KT target P ∈ [.6, .9]. The child's own past wrong answers become trap options or levels (G1 already does this).
2. **How much guidance:** `guidance[topicType]` → full worked example, faded (the kit `fadedVersion`, one blank per step, backward for B1-B2), or attempt-first.
3. **Which representation:** after a miss, `repairs[conceptFamily]` sets the order: the arm that worked for this child before (RT9), then the population TS with a 0.2 floor. A tie becomes a two-way pick for the child.
4. **Which context:** `cares` → the S6 re-skin (taxila-fast generates, taxila-brain validates, then the `kitmath` code check proves the numbers solve to the kit's key). It falls back to the kit's own context. It is faded out before a transfer probe (the persona already does this).
5. **Which artefact:**
   - a G1 engine fill (fraction-bars or number-line params at the KT-target numbers),
   - a scene@1 card with the child's traps,
   - an SVG-DSL diagram (the sibling content engine) labelled in the child's terms.

   Every artefact passes the code gate (≤ 300 ms) and is cached by (core, fill) so the next child is a memory hit.
6. **How it is said:** `pace` and the VIBE row. The pace knobs drive the client's nudge timer and the realtime `turn_detection`.

**Smoothness budget.** Everything in steps 1-3 and 6 is code over an in-memory snapshot, so it adds 0 ms. Steps 4 and 5 run in the lesson-start prefetch and the per-turn look-ahead, never on the critical path. A step not ready by `needByMs` ships the kit's own version. The measured G1 numbers already fit: memory hit 0 ms, cold p95 1.56 s in prefetch.

### 4.3 The closed loop that measures it

```
decision (knob, arm, p, available, ctxHash) ──► decision_log (M1: academic record, no free text)
        │
        ▼
outcome join: y_next (next unaided on the skill) · y_delay (the delayed covert check weave/later.js already schedules)
              · y_transfer (far-transfer probe) · abandoned/strain (session-only, never persisted)
        │
        ├─► arm reward 0.3·now + 0.3·next + 0.4·delayed → population posterior (arm_posteriors, no child id)
        ├─► the child's repairs[] history (M1) → RT9 recap and ordering next time
        ├─► weekly MRT excursion effect per factor (GEE, child clusters) with a baseline-tercile split
        │        → a factor becomes per-child only after the HTE gate; the equity gate blocks a release
        │          that helps the top tercile at the bottom's cost (rj-advice-menu-for-weak-learners)
        └─► parent claims: "What helps Riya", each citing the outcome rows (reports/claims.js pattern)
```

**MRT factors to ship first** (equipoise only; the floors are never randomised):
- F-ENTRY (attempt-first vs worked step for the mid band)
- F-FADE (adaptive fading vs one-shot example for novices)
- F-INT (validated interest context vs neutral)
- F-CONC (concrete required vs not, on re-teach)

personalisation-2026 §3.8 power: 8 pp on `y_next` needs 35-150 child-months, so a 100-300 child pilot over 8-12 weeks.

**Pre-production gate.** The same battery runs in the student simulator (STUDENT-SIM, which charges for assistance). The `over-helper` and `random-arm` controls must fail, and the loop must beat random arms on DRS at 20 seeds. Otherwise it does not ship.

### 4.4 What the owner will be able to test (the acceptance test)

`evals/personalisation-diff.mjs` (new) runs on production. It extends this audit's probe to 2 days per child:

- **(a) Interest:** the cricket and space children get different item contexts on ≥ 50% of eligible items, with byte-equal keys (the kitmath check).
- **(b) History:** a child whose day-1 mix-up was repaired by the number line gets the number line first on day 2 (RT9). A child for whom the number line failed twice does not.
- **(c) Guidance:** an all-"don't know" child gets a worked example or a faded step on day 2. A child who is right first time gets attempt-first.
- **(d) Pace:** a child who says "dheere" gets `waitNudgeSec` above the band default within 2 turns, and a later VAD endpoint on voice.
- **(e)** The day plan exists and the lesson opener matches it.
- **(f)** The parent sees a "What helps" line that cites the rows.

**Pass = all six, with n ≥ 3 per arm.**

---

## 5. Build plan

| phase | contents | est. | gate to exit |
|---|---|---|---|
| **P0: wire what exists** | gap 1 (re-teach history, outcomes, posteriors), gap 11 (brief v2), gap 10 (client `pace`, realtime `session.update`), gaps 4+5 (one interest registry, 5 skins), gap 13; owner decision D1 | 7-9 | unit tests + `verify` gates; RT-M2 sim beats random arms; acceptance (b) and (d) pass on production |
| **P1: guidance and representation** | gap 3 (guidanceLevel, first-step probe, fading.js), gap 7 (population format TS, logged), gap 9 part 1 (`decision_log` + outcome join) | 9-11 | director-sim: teach turns per skill +≤ 1 at the median; acceptance (c) passes; every decision row joins an outcome within 48 h at ≥ 95% |
| **P2: generated for this child** | gap 4's S6 re-skin pipeline + S7 corpus audit; G1 prefetch fed the PTM snapshot (with the live-content wiring); explanations and worked examples re-skinned through the same validators | 7-9 | validator pass ≥ 90% at round 1; kitmath isomorphism 100%; corpus audit seeded-defect recall ≥ 0.9; 0 request-path model calls; acceptance (a) passes |
| **P3: the day and the parent** | gap 8 (plan written and consumed, R2/R4 from the PTM), gap 12 ("What helps" claims) | 5-7 | acceptance (e) and (f) pass; claims gate (each claim cites rows) passes |
| **P4: prove it** | gap 9 part 2 (weekly MRT report, tercile equity gate, HTE gate); log each result to `context/measurements.md` | 3-4 + pilot time | first MRT readout with n stated; no factor ships per-child without the HTE gate |

**Total about 31-40 agent-days of build before the pilot.** P0 alone (7-9 days) makes the pillar testable, in that two children visibly get different, evidence-driven teaching. P1 and P2 make it hyper-personalised. P4 is what earns the claim "we know what works for this child".

**Constraints the plan respects:**
- Azure-only models: taxila-fast and taxila-brain, Direct.
- No model grades: kitmath and the closed classifier do.
- Sentence-shaped text never goes in prompts: the PTM renders as telegraphic brief rows.
- Position is mechanism: new rows are tested by G1 position tests.
- The child-safety floor stays above everything: strain and safety pre-empt every knob.
- English chrome.

---

## 6. Explicitly unverified

- Every voice-lane behaviour: onset, barge-in and `slowerPace` signals, the VIBE row in realtime instructions, and per-child turn detection.
- India round-trip latency.
- The cause of arm E's attempt-first routing in lesson 2 (§2.4, [U]).
- Whether `taxila-worker` is deployed; only the absence of day plans was measured.
- Any learning effect of any personalisation, which is unmeasured by anyone (§2.10).
- n = 1 per arm per topic: the teacher text is stochastic. The structural facts (identical items, constant pace, null plans, 0 memories) do not depend on sampling. The interest-mention ratios do.
