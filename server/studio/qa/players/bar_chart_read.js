// bar_chart_read: the probe's chart checks (heights ∝ values within 1.5 px on one baseline, ticks at their value's
// height ≤ 6 px, identical bars before the answer) with the column (not the bar) as the tap target.
import { seamPresent, noHint, doneCalled, wrongThenRight } from "./util.js";

export default {
  seam: ["data-bar", "data-value", "data-column", "data-tick"],
  targets: "[data-column]",
  async play(c) {
    const data = c.params.data;
    await c.sleep(1500);   // grow-in animations finish
    await seamPresent(c, [["[data-bar]", data.length], ["[data-column]", data.length], ["[data-tick]", 3]]);
    const bars = await c.visible("[data-bar]");
    const byKey = Object.fromEntries(bars.map((b) => [b.attrs["data-bar"], b]));
    const missing = data.filter((d) => !byKey[d.key]).map((d) => d.key);
    const valuesOk = data.every((d) => byKey[d.key] && Number(byKey[d.key].attrs["data-value"]) === d.value);
    c.add("G6.bars_match_data", missing.length === 0 && bars.length === data.length && valuesOk, { missing, n: bars.length, valuesOk });
    if (!missing.length) {
      const ratios = data.map((d) => byKey[d.key].h / d.value); const r0 = ratios.reduce((a, b) => a + b) / ratios.length;
      const maxErr = Math.max(...data.map((d) => Math.abs(byKey[d.key].h - r0 * d.value)));
      c.add("G6.heights_proportional", maxErr <= 1.5, `max err ${maxErr.toFixed(2)}`);
      const bottoms = data.map((d) => byKey[d.key].y + byKey[d.key].h);
      c.add("G6.common_baseline", Math.max(...bottoms) - Math.min(...bottoms) <= 1.5, bottoms.map((b) => b.toFixed(1)));
      const ticks = await c.visible("[data-tick]");
      const base = Math.max(...bottoms);
      const err = ticks.map((t) => Math.abs(t.y + t.h / 2 - (base - r0 * Number(t.attrs["data-tick"]))));
      const worst = err.length ? Math.max(...err) : Infinity;
      c.add("G6.ticks_tell_truth", ticks.length >= 3 && worst <= 6, `${ticks.length} ticks, worst ${worst.toFixed(1)}`);
      // the column contains its bar (a column is the whole target, bar + name)
      const cols = Object.fromEntries((await c.visible("[data-column]")).map((b) => [b.attrs["data-column"], b]));
      const loose = data.filter((d) => { const col = cols[d.key], bar = byKey[d.key]; return !col || bar.x < col.x - 2 || bar.x + bar.w > col.x + col.w + 2; }).map((d) => d.key);
      c.add("G6.column_holds_bar", loose.length === 0, loose);
    }
    await noHint(c, "[data-bar]", "G8.bars_identical");
    const vs = data.map((d) => d.value), ext = c.params.question === "most" ? Math.max(...vs) : Math.min(...vs);
    const right = data.find((d) => d.value === ext).key;
    const wrong = data.find((d) => d.key !== right).key;
    await wrongThenRight(c, { sel: "[data-column]", attr: "data-column", wrong, right });
    doneCalled(c);
  },
};
