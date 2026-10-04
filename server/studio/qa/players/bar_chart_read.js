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
      // each bar's name is written under / on ITS column (not stacked at one spot) and names never overlap
      const names = await c.page.evaluate((want) => {
        const out = {};
        for (const e of document.body.querySelectorAll("*")) {
          if (e.children.length) continue;
          const t = (e.textContent || "").trim();
          for (const [k, v] of Object.entries(want)) if (t === v) { const r = e.getBoundingClientRect(); if (r.width) out[k] = { x: r.x, y: r.y, w: r.width, h: r.height, attrs: { "data-name": k } }; }
        }
        return out;
      }, Object.fromEntries(data.map((d) => [d.key, c.strings[d.key]])));
      const misplaced = data.filter((d) => { const n = names[d.key], col = cols[d.key]; if (!n || !col) return true; const cx = n.x + n.w / 2; return cx < col.x - 2 || cx > col.x + col.w + 2; }).map((d) => d.key);
      const nb = Object.values(names);
      const ov = [];
      for (let i = 0; i < nb.length; i++) for (let j = i + 1; j < nb.length; j++) { const a = nb[i], b = nb[j];
        if (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 2 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 2) ov.push(`${a.attrs["data-name"]}~${b.attrs["data-name"]}`); }
      c.add("G4.names_under_their_bars", misplaced.length === 0 && ov.length === 0, { misplaced, overlap: ov.slice(0, 3) });
    }
    await noHint(c, "[data-bar]", "G8.bars_identical");
    const vs = data.map((d) => d.value), ext = c.params.question === "most" ? Math.max(...vs) : Math.min(...vs);
    const right = data.find((d) => d.value === ext).key;
    const wrong = data.find((d) => d.key !== right).key;
    await wrongThenRight(c, { sel: "[data-column]", attr: "data-column", wrong, right });
    await doneCalled(c);
  },
};
