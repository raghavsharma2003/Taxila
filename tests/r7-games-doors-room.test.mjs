// r7 Games: the doors (Warm / Spicy) never cover the world. Seen in a real browser at 360 px: a solved level's controls
// row emptied and collapsed, the world grew to the root's foot, and the doors (absolute, over that foot) hid aankde's
// bottom row of levelled towers. While the doors show, PlayStage marks the root and the empty controls row keeps the
// doors' full height, so the world ends where the doors begin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/play/play.css", import.meta.url), "utf8");
const stage = readFileSync(new URL("../src/play/PlayStage.tsx", import.meta.url), "utf8");
const px = (rule, prop) => Number(rule.match(new RegExp(`${prop}: (\\d+)px`))?.[1] ?? NaN);

test("PlayStage marks the root while the doors show (the same condition that renders them)", () => {
  const shown = stage.match(/\{(solved && !doorsInWorld && props\.doors && props\.doors\.length > 0) && \(\s*<div className="pl-doors"/)?.[1];
  assert.ok(shown, "the doors' render condition is found");
  assert.ok(stage.includes(`data-doors={${shown} ? "1" : undefined}`), "data-doors uses the doors' own condition");
});

test("while the doors show, the empty controls row is at least as tall as the doors", () => {
  const room = css.match(/\.pl-root\[data-doors\] \.pl-controls:empty \{([^}]*)\}/)?.[1];
  assert.ok(room && /display: flex/.test(room), "the empty controls row stays in the layout");
  const door = css.match(/\.pl-door \{([^}]*)\}/)?.[1] ?? "";
  const doors = css.match(/\.pl-doors \{([^}]*)\}/)?.[1] ?? "";
  const need = px(door, "min-height") + 2 * px(doors, "padding");
  assert.ok(Number.isFinite(need) && need > 0, `the doors' height is read (${need})`);
  assert.ok(px(room, "min-height") >= need, `kept ${px(room, "min-height")} px, the doors need ${need} px`);
});
