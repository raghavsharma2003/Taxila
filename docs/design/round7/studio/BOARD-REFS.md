# Board refs for lesson scripts (dc-r7-teaching-scripts)

Proposal from Studio (C1) to Brain (schema owner) and Learning (script author). Code: `server/forge/explainer/board-ref.js`.

## The ref an explain beat carries

```jsonc
// one of:
{ "template": "fraction-line@1", "den": 5, "target": [2, 5], "show": true }   // an explicit board: template id + params
{ "template": "equal-groups@1", "groups": 3, "each": 4, "withhold": "item" }  // the result is "?" (the item asks it)
{ "auto": true }                                                               // the code's own pick on the beat's text
```

- The params are shapes only: numbers, closed ids and short labels (≤ 18 chars). No sentence and no answer is written
  as a param. A value the beat asks the child for takes `"withhold": "item"` (it becomes `hideResult`).
- Labels are in the lesson language as the author writes them (Devanagari or Hinglish). The template's `fitsLabel`
  checks that they fit.
- The vocabulary is `BOARD_REFS` in board-ref.js: 24 templates, each with its param ranges and one example that
  renders. Maths: fraction-line, fraction-parts, fraction-of, combine-count, number-line-hop, number-line-zoom,
  column-op, place-value, equal-groups, shade-grid, area-grid, measured, angle, shape, symmetry, bar-chart. Any subject:
  table, timeline, flow, compare, parts. Science and EVS: cycle, label (8 sketches). SST and EVS: places.

## The checks

- `resolveBoardRef(ref, { kit, item })` returns `{ ok, call }` or `{ ok: false, why }`. It is pure and makes no model
  call. It runs at author time and on the turn path, and it refuses an unknown template or a param out of range.
- `certifyBoardRef(ref, { kit, item, line })` runs the full whiteboard gate (W0-W19) against a line that says what the
  beat says, with the item's answers withheld. Learning runs it in CI over every script. A ref that would reveal the
  asked value (for example, a solved point on the line for "where is 3/5?") fails with `W9.no_reveal`.

## Proposed schema field (Brain, shared/contracts.ts)

`ScriptBeat.board?: BoardRef`, where `BoardRef = { template: string; withhold?: "item"; [param: string]: unknown } | { auto: true }`.
On the turn, the beat's ref replaces the code pick: Studio resolves it, then re-gates it against her real line as it
does every board. If the ref is absent or fails, the turn falls back to today's pick.

## Scenes in script beats (draft; lands after the director4 judgement, main 2026-11-05)

- **Schema (Brain, `docs/patches/to-brain/011-script-scene-ref.patch`):** `ExplainBeat.scene?: { topic }`, separate from
  `board`. The validator checks the topic id, the Director copies it to `lastMove.scriptBeat.scene`, and
  `whiteboardIntentOf` puts it on the ask as `intent.sceneRef`. Explain beats only: never a check.
- **Studio half (to land with it):** when `intent.sceneRef` names a topic with a built scene and
  `sceneMayPlay(scene, { held, cardLive })` passes, board-first preselect makes no board for the beat. The seam then
  stages the scene piece the way `composeAsk` does, and this turn's `slotFor` shows it. Withholding is the same at all
  three points: pending, reveal and on screen. An absent, unbuilt or withheld scene falls back to the beat's board ref,
  then Studio's own pick.
