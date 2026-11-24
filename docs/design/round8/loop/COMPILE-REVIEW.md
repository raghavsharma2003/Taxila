# C1 compile, reviewed against knows.js (Loop, 2026-11-11)

Reviewed: `server/director/compile.js` at cabfb6c5 (claude/r4-conversation), `docs/design/round7/brain/COMPILE.md`, against
`server/director/knows.js`, `knows-walk.js` and the state.js call sites on int/r6 b857ae30.
Method: I read the code, then ran `compileScript` on the 4 pilot scripts with `planFor` output for the knows-her children (new,
meera, the allKnown child). The run was a scratch script, nothing committed. Every claim marked **(run)** below was seen on all
4 pilots.

## 1. Does planFor's output fit `compileScript(script, plan)`?

Every place the plan changes the walk:

| Plan choice (record) | What it does to the walk | Expressible in `order`/`cells` today? |
|---|---|---|
| K1 `compress` / `compressAt` | A known skill opens on one check (`compressAt` = bare check id, the first not yet answered in `checkOrder`). A right answer ends the skill. | Yes: the branch unit `{ unit, recheck, onRight: "skip", onMiss }`. |
| K1 `compress_fallback` | A **wrong or stuck** answer on that check: no help, no second try and no remediation. The check is skipped and the full unit is appended (state.js 1474: `s.skipped.push; poseNext`). | **No: a second path.** The cells ignore the plan. `cells[S:check:c1].wrong.fresh` is `simpler + prompt, then: end, help: spent` **(run)**, `misconception` goes to a remediation, and `give_up` fresh re-says the help. The walk does none of these. |
| allKnown | Said once on the first compressed check. After the **last** skill's check, that skill's ladder is walked hardest first. | Partly. `orderOf` pushes `{ ladder: "hardestFirst" }` after **every** skill: 3 markers on 3-skill pilots where 1 is right **(run)**. |
| (any compress) bridge | The previous skill's `bridgeToNext` is said when the next skill starts, compressed or not (state.js 575). | **No.** The bridge is inside `full`, so it is said on a miss and dropped on a right answer. The allKnown order has 0 bridges where 2 are right **(run)**. |
| K3 `checkOrder` (+ `probeFor` mark) | The probe check goes first; the mark rides on the card item. | Yes. |
| K2/K7 `ladderOrder` | The walked ladder, in this order. Not set for compressed skills. | Yes. |
| `remedy` (remedyNow, per turn) | On a wrong scripted card, the classifier's mix-up is remedied if this skill has a remediation for it; otherwise the authored target. A remediation is said once per lesson. | Yes, with one change (see 3): `byMixup` should be the resolved map, not the placeholder `"misconception:<id>"`. "Said once" stays run-time state. |
| K6 `hookSlot` (and the greet's promise of it) | Picks the hook's interest slot; a compressed first skill has no hook and no promise. | **No part to put it on.** `partsOf` has no hook part, yet all 4 pilot scripts have `hook` **(run)**. Hook lines have no cell, so they cannot trace. |
| K2/K7 `firstCard`, K4 `prereqCheck`, `opener` | The warm-up, before the script walk. | Outside the compile, as agreed (correction 4). |
| K5/K8 `topic`, practice (`practiceOrder`/`Diag`/`Fast`/`Easier`) | Before the script / after it is spent (selectNext). | Outside the compile, as agreed. They stay run-time, with their own records. |

So the plan fits **except** in four places: the compressed check's miss cells, the allKnown ladder marker, the bridge after a
compressed skill, and the hook. Each is a small change in compile.js (asks A to D below). None needs a second path once it
is fixed.

## 2. K1's fallback as a cell, and the child knows.js knows nothing about

- **No history:** `planFor` returns empty fields and `because: []`, and `compileScript(script, null).order` equals the order
  under that plan **(run)**. That is the default walk with no record, which is what knows-walk.test.mjs asserts on the real walk.
  One gap: `compiledFor` hashes `{…empty plan}` and `null` differently, so one child gets two cache entries and two map ids
  for the same map. Fix: treat a plan with no `because` as `null` before hashing.
- **Plan off** (`TAXILA_R8_KNOWS=off`, recorded-run replay): `knowsPlanAtStart` returns `null`, which is the same path.
- **The fallback itself:** a branch in `order` is not enough. The compressed check's answer cells must say what the walk does,
  or `compiledEqualsSaid` fails on every fallback turn (ask A).

## 3. Can every said line reach its because?

A line traces to a because only if the cell (or the order unit) that produced it carries the record's key. Today:

- Order units carry `because: [{ kind: "compress", … }]`. My records are keyed `(choice, on)`, and `kind` is already the
  **fact's** field (`learned_delayed_check`, `missed_compress_check`). Carry `{ choice, on }` exactly as planFor writes them
  (ask E).
- `checkOrder`, `ladderOrder` and allKnown move parts, but the units they move carry no because. They need
  `{ choice: "checkOrder", on: skillId }` on the reordered check, `{ choice: "ladderOrder", on: skillId }` on the first ladder
  unit, and `{ choice: "allKnown", on: topicId }` on the sayFirst unit and the hardest-first marker.
- The remedy column's `byMixup: "misconception:<id>"` is a placeholder. If it is resolved to
  `{ [mixupId]: "<skill>:rem:<i>" }` over the skill's remediations, the per-turn pick is a lookup. The `remedy` record
  (`on: cardId`) then names the cell it chose.
- The hook has no part (ask D), so `hookSlot` cannot be reached.
- allKnown's line is code text (`knowsSayFirst`). It must be a named F1 frame (`joint: "allKnown"`), or it is a line with no cell.

## 4. What I need from Brain before I call the interface settled

- **A.** Under a plan, the compressed check's `wrong`, `misconception` and `give_up` cells say nothing, take `then: "onMiss"`,
  leave help alone, and carry `because: [{ choice: "compress_fallback", on: skillId }]`. `right` stays `why, then: next`
  (the unit's `onRight` skips the rest).
- **B.** Push `{ ladder: "hardestFirst", skillId }` for the **last** compressed skill only, when `plan.allKnown`. I resolve the
  rung order at run time with `hardestFirst(sk, kit)`, because the compile does not read the kit.
- **C.** Put each bridge after the skill's branch unit, not inside `onMiss`, so it is said whether the check was right or wrong.
- **D.** Add a `hook` part per skill with `hook.interestSlots`. Its slot cell takes `slot: plan.hookSlot.index ?? 0` and is
  absent for a compressed skill. The greet's promise reads the same slot.
- **E.** A because on a unit or cell is `{ choice, on }`, the key of planFor's record, with nothing else. knowsApplied matches on
  it.
- **F.** Accept only the bare check id in `compressAt`. A card id `script:S:c1` contains ":" and would be taken as a part id.
- **G.** In `compiledFor`, hash a plan with no `because` as `null`.

Once A to G are in, I'll add the check to `tests/knows-walk.test.mjs` (4 pilots × new, meera, meeraForgot, kabir, player and the
allKnown child): every applied record has a served cell or unit with the same `(choice, on)`, and every because on a served
cell has an applied record. It will run beside `compiledEqualsSaid` in shadow mode.
