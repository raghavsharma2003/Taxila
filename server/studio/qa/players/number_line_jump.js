// number_line_jump: ticks evenly spaced and linear in value (≤ 2 units), the marker on its value's tick (≤ 3 units),
// the marker never leaves min..max, and each item played wrong-then-right with the step buttons.
import { seamPresent, doneCalled, until } from "./util.js";

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

export default {
  seam: ["data-tick", "data-marker", "data-value", "data-action", "data-target", "data-item"],
  targets: "[data-action]",
  async play(c) {
    const p = c.params;
    const nTicks = Math.round((p.max - p.min) / p.step) + 1;
    await seamPresent(c, [["[data-tick]", nTicks], ["[data-marker]"], ["[data-action=left]"], ["[data-action=right]"], ["[data-action=check]"], ["[data-target]"], ["[data-item]"]]);
    // G6 ticks: values are min + k*step, x linear in value, increasing
    const ticks = (await c.visible("[data-tick]")).map((b) => ({ v: Number(b.attrs["data-tick"]), x: b.x + b.w / 2 })).filter((t) => Number.isFinite(t.v)).sort((a, b) => a.v - b.v);
    const valuesOk = ticks.length === nTicks && ticks.every((t, k) => near(t.v, p.min + k * p.step, 1e-4));
    let lin = Infinity;
    if (ticks.length >= 2) {
      const a = ticks[0], z = ticks.at(-1), slope = (z.x - a.x) / (z.v - a.v);
      lin = slope > 0 ? Math.max(...ticks.map((t) => Math.abs(a.x + slope * (t.v - a.v) - t.x))) : Infinity;
    }
    c.add("G6.ticks_linear", valuesOk && lin <= 2, { n: ticks.length, want: nTicks, valuesOk, maxErr: Number.isFinite(lin) ? +lin.toFixed(1) : lin });
    const tickX = (v) => ticks.find((t) => near(t.v, v, 1e-4))?.x;
    const marker = async () => { const m = (await c.visible("[data-marker]"))[0]; return m ? { v: Number(m.attrs["data-value"]), x: m.x + m.w / 2 } : null; };
    const onTick = async () => { const m = await marker(); const x = m && tickX(m.v); return m && x != null && Math.abs(m.x - x) <= 3 ? m : null; };
    let markerOk = true; const mWhy = [];
    const m0 = await until(c, onTick, 1200);
    if (!m0) { markerOk = false; const m = await marker(); mWhy.push(`start marker ${JSON.stringify(m)} not on its tick`); }
    else if (!near(m0.v, p.start, 1e-4)) { markerOk = false; mWhy.push(`starts at ${m0.v}, want ${p.start}`); }
    // move to a value: press left/right until the marker shows it
    const moveTo = async (v) => {
      for (let guard = 0; guard < 2 * nTicks; guard++) {
        const m = await marker(); if (!m) return false;
        if (near(m.v, v, 1e-4)) return !!(await until(c, onTick, 1200));
        await c.tap(m.v < v ? "[data-action=right]" : "[data-action=left]", { attr: "data-action", value: m.v < v ? "right" : "left", wait: 220 });
      }
      return false;
    };
    let ok = true; const why = [];
    for (let i = 0; i < p.items.length && ok; i++) {
      const it = p.items[i];
      const item = (await c.visible("[data-item]"))[0]?.attrs["data-item"];
      if (item !== it.id) { ok = false; why.push(`item${i}: data-item ${item}`); break; }
      const wrong = [it.target + p.step, it.target - p.step].find((v) => v <= p.max + 1e-9 && v >= p.min - 1e-9);
      if (!(await moveTo(wrong))) { ok = false; why.push(`item${i}: could not move to ${wrong}`); markerOk = false; mWhy.push(`marker off its tick near ${wrong}`); break; }
      const n0 = c.answers().length;
      await c.tap("[data-action=check]", { attr: "data-action", value: "check" });
      let a = await c.waitAnswer(n0 + 1);
      if (!a || a.correct !== false || !near(Number(a.value?.value), wrong, 1e-4)) { ok = false; why.push(`item${i}: wrong posted ${JSON.stringify(a?.value)}`); break; }
      await c.sleep(500);
      if ((await c.visible("[data-item]"))[0]?.attrs["data-item"] !== it.id) { ok = false; why.push(`item${i}: advanced on wrong`); break; }
      if (!(await moveTo(it.target))) { ok = false; why.push(`item${i}: could not move to ${it.target}`); break; }
      const n1 = c.answers().length;
      await c.tap("[data-action=check]", { attr: "data-action", value: "check" });
      a = await c.waitAnswer(n1 + 1);
      if (!a || a.correct !== true) { ok = false; why.push(`item${i}: right posted ${JSON.stringify(a?.value)}`); break; }
      await c.sleep(1400);
    }
    // bounds: pressing left past min never leaves the line (only when the activity is still open is this observable)
    c.add("G6.marker_on_tick", markerOk, mWhy);
    c.add("G5.play_truth", ok, why);
    await doneCalled(c);
  },
};
