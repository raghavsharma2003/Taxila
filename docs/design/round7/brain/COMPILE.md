# C1: responses compiled, not chosen (design, one page)

**Decision:** `dc-r7-script-walk-v6-11` C1. Brain, with Learning and Loop. **Status:** design for main's ruling. Nothing is built yet.

## The map's shape

`compileScript(script, plan) → { order, cells, holes, doubles }` is pure and runs once per lesson at start, then is cached on the state by `kitHash` and plan hash.

- **`order`** is the unit sequence the walk follows. A unit is `point → check-in → card`, `worked problem → steps → yourStep card`, `remediation → then-card`, a `check`, or a `bridge` into the next skill's first unit. It is built from the script, with `plan` applied: compressed skills dropped, the check order, the remedy chosen, the first card.
- **`cells[partId][request][help]`** gives exactly one `Response`:
  - `{ say: [AuthoredRef…], board: UnitRef, then: "end" | "checkin" | "card" | "next", card: ItemId|null, help: "keep" | "heard" | "spend", key?: true }`.
  - `AuthoredRef` points at a script field, for example `skills[1].explain[2].simpler` or `remediation[m].then.simpler`. It never holds code text. The only text that is not authored is the joints and the neutral frames F1 keeps.
- **Parts** come in 9 kinds: point, check-in, card, worked step (problem and steps), yourStep card, remediation, then-card, check, bridge.
- **Requests** are 9: clarify, Hindi, repeat, picture, try-first, give-up, "aage chalo", aside, silence. Answers add 3 columns (right, wrong, misconception) for cards. That is 12 columns in all.
- **Help** has 3 states: fresh, heard (a request re-said the help, T2.5), and spent (a miss used it).
- **The type table** is today's `requestTable.js`, grown up: part kind × column × help → a rule that says which authored fields it takes. That is 9 × 12 × 3 = 324 rule cells, written once and shared by every script.
- **Instances:**

  | Pilot | Parts | Cells, 9 requests × 3 help | Cells, all 12 columns × 3 help |
  |---|---|---|---|
  | c4-t01 | 62 | 1,674 | 2,232 |
  | c5-t01 | 69 | 1,863 | 2,484 |
  | c5-t02 | 71 | 1,917 | 2,556 |
  | c6-t01 | 65 | 1,755 | 2,340 |

  Most instance cells are the same rule resolving to different fields.
- **The validator** (`scripts/lesson-scripts/check.mjs`, run by CI on every script) fails on two things:
  - **A hole:** a rule names a field the script does not have. For example, clarify on a point needs a different authored wording (`simpler`, `alts[]`) and there is none.
  - **A double:** two rules match one cell.

  Holes are listed per script for Learning to author. Code never fills a hole with its own sentence.

## What it replaces in `server/director/state.js` (4,079 lines)

The walk keeps reading the child, grading against keys, the phase machine, safety and stop, and the learner model. It stops choosing what to say for a request. The compiled map replaces:

- **`requestMove`'s request cases:** language, clarify, repeat, visual, selftry, skip, know, move_on, ask_again. Of the 44 `case`s, about 15 become one `cells[part][req][help]` lookup.
- **The pre-step rewrite blocks for these cases:**
  - card-first, clarify at a check-in, ask-again, and try-first-as-selftry;
  - the GO_ON / STOP_WORD guards;
  - A4/A5 in `brain/turn.js` planTurn.
- **The help-choosing logic:**
  - `freshLivePart`, `liveBeatSimpler`, `helpLeft` and `helpSpentOn`;
  - the K2/K3 rung choice in the miss path and `leaveItem`'s key decision;
  - `cardHelp.said` and `heard` become the help column.
- **`heldTurn`'s branches** (aside, clarify after a key, clarify after a remediation) and **`splitLong`'s close / give-up / unfit / bridge-wait decisions.** Pace becomes the cell's `then`. Board fit stays a runtime check, below.
- **The aside choices:** `parkGate` and the return's place. The return is its own cell (`then: "end"`); J2 follows it.

Estimate: 1,200 to 1,500 lines of state.js go, and with them the 12 v6.x patch layers in this list.

## What it cannot express (stays at run time)

- **What the child said.** Reading it (classifier or fast reader) picks the column. A wrong reading picks the wrong column, so director20's judges will report the reading on every clarify row.
- **The child's own words in an aside.** J2's one model sentence, behind its predicate.
- **Whether Studio can draw a switch, or build a picture view.** The compile asks for `board`; at run time `switchFits` / `pictureTurn` can turn a `then: "next"` into `then: "checkin"`. That is one recorded fallback, not a choice.
- **Safety, distress, stop and break.** They take precedence over the map and stay where they are, frozen.
- **Counts across the lesson:** joint rotation, `posedAt`, cards answered right that are not posed again. These are state, not cells.
- **Anything a model grades.** Nothing does: keys are verified, as now.

## The Loop session's plan as a compile input

`planFor()` (server/director/knows.js) runs before the compile. Its output changes `order` and the help rules, never the cells' wording.

| `planFor` field | Effect on the compile |
|---|---|
| `compress` / `compressAt` | Those skills' units leave `order`. Their `allKnown` say-first becomes the first cell of the lesson. |
| `checkOrder` | Orders the `check` units inside each skill. |
| `ladderOrder` / `firstCard` | Pick the first card unit. |
| `remedy` (knowsRemedy, per misconception) | Picks which remediation part the `misconception` column of a card points at. Recorded in the compiled cell, so the walk only looks it up. |
| `hookSlot` | Picks the hook's interest slot. |
| `prereqCheck` | Adds a check unit at the start. |

`because[]` is copied onto each affected cell, so a trace shows why that cell is what it is. Loop's six call sites in state.js become the compile's inputs and leave the walk.

## Proof (G2 form)

1. Add a dry-matrix predicate, `compiledEqualsSaid`: every turn's response equals `cells[part][req][help]` for the part, request and help state that turn read. Show it fails on today's tree, then build until it passes.
2. Keep the twelve current predicates at 0.
3. Report the validator's hole list per pilot to Learning before director20.
