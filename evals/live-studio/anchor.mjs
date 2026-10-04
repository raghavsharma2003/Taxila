// Live Studio probe: post-hoc LABEL ANCHORING check on gate-passed photosynthesis builds (a check the v0 gate did
// not have; added after a passed build was seen with "Oxygen" written beside the sun). A label must sit near what it
// names: leaf/roots within 70 px of the referent's box; water/co2/o2 within 90 px of the nearest particle of that
// flow at some moment over 1.6 s of play. Reports how many passed builds this check would have failed.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { wrap } from "./kinds.mjs";

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), process.argv[2] || "out-2026-10-04");
const results = JSON.parse(fs.readFileSync(path.join(OUT, "results.json"), "utf8")).filter((r) => r.kind === "photosynthesis_anim" && r.passFinal);
const browser = await chromium.launch();
const rows = [];
for (const r of results) {
  const frag = fs.readFileSync(path.join(OUT, `${r.id}__r${r.rounds.length - 1}.html`), "utf8");
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await page.route("**/*", (x) => x.abort());
  await page.setContent(wrap("photosynthesis_anim", frag), { waitUntil: "load" });
  await page.waitForTimeout(400);
  const best = {};
  for (let f = 0; f < 8; f++) {
    const d = await page.evaluate(() => {
      const box = (e) => e.getBoundingClientRect();
      const ctr = (b) => [b.x + b.width / 2, b.y + b.height / 2];
      const distBox = (p, b) => Math.hypot(Math.max(b.x - p[0], 0, p[0] - (b.x + b.width)), Math.max(b.y - p[1], 0, p[1] - (b.y + b.height)));
      const out = {};
      for (const k of ["leaf", "roots", "water", "co2", "o2"]) {
        const lab = document.querySelector(`[data-label=${k}]`); if (!lab) { out[k] = 999; continue; }
        const lb = box(lab); const lc = ctr(lb);
        if (k === "leaf" || k === "roots") { const e = document.querySelector(`[data-entity=${k}]`); out[k] = e ? distBox(lc, box(e)) - Math.min(lb.width, 160) / 2 : 999; }
        else { const ps = [...document.querySelectorAll(`[data-flow=${k}]`)]; out[k] = ps.length ? Math.min(...ps.map((p) => distBox(lc, box(p)))) - lb.width / 2 : 999; }
      }
      return out;
    });
    for (const [k, v] of Object.entries(d)) best[k] = Math.min(best[k] ?? 1e9, v);
    await page.waitForTimeout(200);
  }
  const fails = Object.entries(best).filter(([k, v]) => v > (k === "leaf" || k === "roots" ? 70 : 90)).map(([k, v]) => `${k}:${Math.round(v)}`);
  rows.push({ id: r.id, pass: fails.length === 0, fails, best });
  console.log(r.id, fails.length ? "ANCHOR FAIL " + fails.join(" ") : "ok");
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "anchor.json"), JSON.stringify(rows, null, 1));
