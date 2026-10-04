// shade_fraction: the probe's fraction game, plus the production G6 (each whole has exactly d EQUAL parts, area by
// point sampling through every layer, ≤ 6% from the mean) and G8 (nothing pre-shaded, identical parts).
import { seamPresent, noHint, doneCalled } from "./util.js";

async function partAreas(page) {
  return page.evaluate(() => {
    const parts = [...document.querySelectorAll("[data-part]")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    if (!parts.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of parts) { const r = p.getBoundingClientRect(); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    const count = new Map(parts.map((p) => [p, 0]));
    for (let y = y0 + 1; y < y1; y += 2) for (let x = x0 + 1; x < x1; x += 2) {
      for (const e of document.elementsFromPoint(x, y)) { const p = e.closest("[data-part]"); if (p && count.has(p)) { count.set(p, count.get(p) + 1); break; } }
    }
    return [...count.values()];
  });
}

export default {
  seam: ["data-part", "data-shaded", "data-action", "data-item", "data-target"],
  targets: "[data-part],[data-action]",
  async play(c) {
    const { page } = c;
    const items = c.params.items;
    await seamPresent(c, [["[data-part]", 2], ["[data-action=check]"], ["[data-target]"], ["[data-item]"]]);
    const parts0 = await c.visible("[data-part]");
    c.add("G8.starts_unshaded", parts0.length > 0 && parts0.every((b) => b.attrs["data-shaded"] !== "true"), parts0.filter((b) => b.attrs["data-shaded"] === "true").length);
    await noHint(c, "[data-part]", "G8.parts_identical");
    let ok = true, equal = true; const detail = [], eq = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const parts = await c.visible("[data-part]");
      if (parts.length !== it.d) { ok = false; detail.push(`item${i}: ${parts.length} parts, want ${it.d}`); break; }
      const item = (await c.visible("[data-item]"))[0]?.attrs["data-item"];
      if (item !== it.id) { ok = false; detail.push(`item${i}: data-item ${item}, want ${it.id}`); break; }
      const areas = await partAreas(page);
      if (areas?.length === it.d) {
        const mean = areas.reduce((s, x) => s + x, 0) / areas.length;
        const dev = Math.max(...areas.map((x) => Math.abs(x - mean) / mean));
        if (!(mean > 20 && dev <= 0.06)) { equal = false; eq.push(`item${i}: max dev ${(dev * 100).toFixed(1)}%`); }
      }
      // the wrong path: shade n+1 (n-1 when n = d), check → graded wrong, no advance
      const wrongN = it.n < it.d ? it.n + 1 : it.n - 1;
      for (let p = 0; p < wrongN; p++) await c.tap("[data-part]", { idx: p });
      const shadedW = (await c.visible("[data-part]")).filter((b) => b.attrs["data-shaded"] === "true").length;
      if (shadedW !== wrongN) { ok = false; detail.push(`item${i}: tapped ${wrongN}, shaded ${shadedW}`); break; }
      const n0 = c.answers().length;
      await c.tap("[data-action=check]");
      let last = await c.waitAnswer(n0 + 1);
      if (!last || last.correct !== false || last.value?.n !== wrongN || last.value?.d !== it.d) { ok = false; detail.push(`item${i}: wrong answer posted as ${JSON.stringify(last?.value)}`); break; }
      await c.sleep(500);
      if ((await c.visible("[data-part]")).length !== it.d || (await c.visible("[data-item]"))[0]?.attrs["data-item"] !== it.id) { ok = false; detail.push(`item${i}: advanced on wrong`); break; }
      // fix it: toggle one part
      const cur = await c.visible("[data-part]");
      if (wrongN > it.n) { const k = cur.findIndex((b) => b.attrs["data-shaded"] === "true"); await c.tap("[data-part]", { idx: k }); }
      else { const k = cur.findIndex((b) => b.attrs["data-shaded"] !== "true"); await c.tap("[data-part]", { idx: k }); }
      const shadedR = (await c.visible("[data-part]")).filter((b) => b.attrs["data-shaded"] === "true").length;
      if (shadedR !== it.n) { ok = false; detail.push(`item${i}: toggle broken (${shadedR} shaded, want ${it.n})`); break; }
      const n1 = c.answers().length;
      await c.tap("[data-action=check]");
      last = await c.waitAnswer(n1 + 1);
      if (!last || last.correct !== true) { ok = false; detail.push(`item${i}: right answer posted as ${JSON.stringify(last?.value)}`); break; }
      await c.sleep(1600);
    }
    c.add("G6.equal_parts", equal, eq);
    c.add("G5.play_truth", ok, detail);
    doneCalled(c);
  },
};
