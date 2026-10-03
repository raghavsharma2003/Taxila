# tgk-lite@2 — mechanic API

File: `src/mechanic.js`. Plain JavaScript (no TypeScript, no imports, no exports). Exactly one top-level call:

```
defineMechanic({ id, archetype, init, reduce, feedback?, targets, render, facts })
```

## Free names available
`defineMechanic Math Array Object Number String Boolean JSON Map Set undefined NaN Infinity isFinite parseInt parseFloat`
`Math` has no `random` (use `ctx.rng()`). Nothing else exists: no window, document, fetch, Date, timers, this, class, async, regex literals, `new` (except Map/Set/Array).

## World
360 × 400 units, origin top-left. The kit shows the question above the world and the progress dots. Do not draw the question.

## ctx (read-only, every call)
| field | meaning |
|---|---|
| `item` | active item id |
| `itemIndex`, `itemCount`, `levelIndex`, `levelCount` | cursor |
| `mode` | `"choice"` or `"build"` (same as the archetype) |
| `refs.options()` | choice: refs to every option (key + distractors), kit-shuffled. Use this order. |
| `refs.units()` | build: refs to unit kinds (e.g. tens, ones), index k |
| `refs.count()` | number of options |
| `refs.same(a, b)` | true when two refs are the same ref (the ONLY way to compare refs) |
| `refs.indexOf(ref)` | index of a ref in `options()` (choice) or `units()` (build), else -1 |
| `rng()` | seeded number in [0, 1) |
| `W`, `H` | 360, 400 |
| `minTarget` | smallest allowed target side in world units (56 for ages 6-9, else 44) |
| `band`, `lang` | age band, language |

A ref is opaque: `{item, slot}` made by the kit, where `slot` is a random token that means nothing (it is different on every mount). Copy refs from `ctx.refs.*` into your model and targets; never build one and never read `.slot` (a lint error): compare with `ctx.refs.same(a, b)` or find with `ctx.refs.indexOf(ref)`. `options()` order is random per mount; build units are in a fixed order (index k).

## Members
- `init(ctx) → model` — called at the start of EVERY item. Model = plain JSON (refs are JSON). Pure.
- `reduce(model, action, ctx) → { model, commit?, fx? } | { reject: "locked"|"invalid"|"no_effect" }` — pure; the only state change.
  `action = { type, target, ref?, control? }` (type = the target's `action`, ref = that target's valueRef, control = "confirm"|"clear").
  - choice: return `commit: true` when the child's pick is final (on the tap itself, or on a confirm control).
  - build: return `commit: true` on the confirm control; on clear return a model with every count 0.
  - `fx`: up to 4 of `{ kind: "pulse"|"shake"|"pop"|"glow", target: <target id> }`.
- `feedback(model, { correct }, ctx) → model` — optional, after the kit grades a commit. On correct the kit moves to the next item by itself.
- `targets(model, ctx) → TargetSpec[]` — what the child can tap now.
- `render(model, draw, ctx, fx)` — draw the world for this model. Called after every change. Never changes the model.
- `facts(model) → { key: number|string|boolean }` — ≤ 12 keys. Build: MUST include `n_0`, `n_1`, … = units of kind k currently placed.

## TargetSpec
```
{ id: "a-z0-9_:-", kind: "pad"|"tile"|"card"|"bin"|"block"|"cell"|"step", rect: {x, y, w, h}, action: "<verb>", valueRef: <ref>, op: "choose"|"add"|"remove" }
{ id, kind: "control", control: "confirm"|"clear", rect, action: "<verb>", labelKey?: "<strings key>" }
```
- choice: one `op: "choose"` target per option ref (the key must be reachable). build: `add`/`remove` targets with unit refs + one confirm control (+ a clear control).
- The KIT draws each target as a button and writes its label (the option's value, or `+10`/`−10`). Do not draw values under targets yourself.
- Rules (the kit refuses the whole frame if broken): ids unique; rect inside 360 × 400; w, h ≥ `ctx.minTarget`; no two rects overlap; refs only for the active item.

## draw (render only)
- `rect(x, y, w, h, style)`, `circle(cx, cy, r, style)`, `line(x1, y1, x2, y2, style)`, `poly([[x, y], …], style)`
- `text(key, x, y, {size?, anchor?: "start"|"middle"|"end", fill?, bold?})` — words ONLY by a key of the design's strings table.
- `numeral(ref, x, y, {size?, fill?, bold?})` — the kit writes the value of a ref; build may also pass `{ readout: "shadow" }` for the running total.
- `model(ref, x, y, w, h, {kind?: "bar"|"pie"})` — the kit draws a picture of the ref's value (fraction → bar or pie, whole number ≤ 20 → dots). The ONLY way to show a quantity as a picture: never draw shaded parts, cut shapes, dots or pieces yourself.
- Choice items: if you draw the key ref (numeral or model), draw every option ref the same way, or the kit refuses the frame.
- Targets are opaque buttons: anything drawn under a target rect is hidden. Put pictures and words outside target rects.
- Text: `anchor: "middle"` centres on x; keep every word inside 0-360 and away from other words.
- style: `{ fill?: token|"none", stroke?: token, width?: 0.5-12, opacity?: 0.1-1, r?: corner radius }`
- colour tokens: `ink paper chalk sky water leaf sun berry stone earth night sand`
- ≤ 600 draw calls per render.

## Never
`Math.random`, digits inside strings, words not in the strings table, points/coins/score/streak, reading or forging refs (`.slot`, `{slot: …}`), changing built-ins (they are frozen: an assignment throws), timers, loops without a bound.
