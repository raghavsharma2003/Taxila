// The device side of Stagecraft (src/stagecraft/stage.ts, reveal.ts): the stage is never empty, never shows a loading
// state, swaps only after the incoming piece painted, and a failed mount plays the board twin with the same values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initStage, command, painted, failed, tick, retire, view, itemFromSlot, CROSSFADE_MS, CALM_BOARD } from "../src/stagecraft/stage.ts";
import { fireAt, CueScheduler } from "../src/stagecraft/reveal.ts";

const item = (id, kind = "engine") => ({ id, kind, archetype: kind === "board" ? "whiteboard" : "slice-at@1", spec: {}, board: { title: `t-${id}`, lines: ["1/2"] } });

test("stage: starts on the calm board; an incoming piece is invisible until it painted; then a 420 ms crossfade", () => {
  let s = initStage();
  assert.equal(view(s, 0)[0].item.id, CALM_BOARD.id);
  s = command(s, item("a"), 0);
  let v = view(s, 10);
  assert.equal(v.find((l) => l.item.id === "a").opacity, 0, "mounting = invisible (no loading state)");
  assert.equal(v.find((l) => l.item.id === "calm").opacity, 1, "the outgoing keeps showing");
  s = painted(s, "a", 100);
  v = view(s, 100 + CROSSFADE_MS / 2);
  assert.ok(Math.abs(v.reduce((a, l) => a + l.opacity, 0) - 1) < 1e-9);
  s = tick(s, 100 + CROSSFADE_MS);
  assert.equal(s.showing.id, "a"); assert.equal(s.incoming, null);
});

test("stage: a failed mount plays the board twin with the same values (incoming and showing)", () => {
  let s = command(initStage(), item("a"), 0);
  s = failed(s, "a", 50);
  assert.equal(s.incoming.kind, "board"); assert.deepEqual(s.incoming.board, item("a").board);
  s = tick(painted(s, s.incoming.id, 60), 60 + CROSSFADE_MS);
  assert.equal(s.showing.id, "a#board");
  let t = tick(painted(command(initStage(), item("b"), 0), "b", 1), 1 + CROSSFADE_MS);
  t = failed(t, "b", 900);
  assert.equal(t.incoming.id, "b#board", "an engine that dies on stage crossfades to its board");
});

test("stage: latest command wins; retire returns to the calm board", () => {
  let s = command(initStage(), item("a"), 0);
  s = command(s, item("b"), 10);
  assert.equal(s.incoming.id, "b");
  assert.ok(s.log.some((e) => e.e === "dropped" && e.id === "a"));
  s = tick(painted(s, "b", 20), 20 + CROSSFADE_MS);
  s = tick(painted(retire(s, 1000), "calm", 1001), 1001 + CROSSFADE_MS);
  assert.equal(s.showing.id, "calm");
});

test("stage property: over 5,000 random event streams the stage is never empty and never shows an unpainted piece", () => {
  let seed = 1;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let n = 0; n < 5000; n++) {
    let s = initStage(), t = 0;
    const ids = [];
    for (let i = 0; i < 40; i++) {
      t += Math.floor(r() * 300);
      const x = r();
      if (x < 0.3) { const it = item(`i${n}-${i}`, r() < 0.2 ? "board" : "engine"); ids.push(it.id); s = command(s, it, t); }
      else if (x < 0.55 && s.incoming) s = painted(s, s.incoming.id, t);
      else if (x < 0.65 && ids.length) s = failed(s, ids[Math.floor(r() * ids.length)], t);
      else if (x < 0.7) s = retire(s, t);
      else s = tick(s, t);
      const v = view(s, t);
      assert.ok(v.length >= 1 && v.length <= 2, "one piece, two layers only during a crossfade");
      assert.ok(Math.abs(v.reduce((a, l) => a + l.opacity, 0) - 1) < 1e-9, "something always fully paints");
      if (s.phase === "mounting") assert.equal(v.find((l) => l.item.id === s.incoming.id)?.opacity ?? 0, 0, "never show an unpainted piece");
      for (const l of v) assert.ok(["engine", "frame", "image", "board"].includes(l.item.kind));
    }
  }
});

test("slot → item: every rung maps to a drawable item with a board twin", () => {
  const e = itemFromSlot({ slotId: "c1", stagecraft: { rung: "generated_spec", archetype: "slice-at@1", spec: { a: 1 }, boardTwin: { values: { title: "Slice" }, board: { title: "Slice", lines: [] } } } });
  assert.equal(e.kind, "engine"); assert.equal(e.board.title, "Slice");
  assert.equal(itemFromSlot({ slotId: "b", stagecraft: { rung: "board", board: { values: { title: "x" } } } }).kind, "board");
  assert.equal(itemFromSlot({ slotId: "x" }).kind, "board");
});

test("cue: the reveal fires 400 ms before the naming clause, and never while the child holds the floor", () => {
  assert.equal(fireAt({ clauseIdx: 1, preRollMs: 400, crossFadeMs: 420 }, 10_000, [0, 1500]), 11_100);
  const fired = [];
  const c = new CueScheduler((p) => fired.push(p));
  c.arm({ clauseIdx: 1, preRollMs: 400, crossFadeMs: 420 }, "piece");
  c.lineStarted(1000);
  assert.equal(c.tick(1500), false, "clause 1 onset unknown yet");
  c.clauseOnset(1, 1200);
  c.childFloor(true);
  assert.equal(c.tick(2000), false, "the child holds the floor");
  c.childFloor(false);
  assert.equal(c.tick(1799), false);
  assert.equal(c.tick(1800), true);
  assert.deepEqual(fired, ["piece"]);
});
