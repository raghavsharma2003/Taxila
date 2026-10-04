// Seed-aligned race stats at several deadlines, pooled over the 3 kinds and per kind, for chosen arm sets (2 or 3 arms).
import fs from "node:fs"; import { wilson } from "./analyze-lib.mjs";
const R = JSON.parse(fs.readFileSync(new URL("./out/results.json", import.meta.url)));
const KINDS = ["fraction_game", "photosynthesis_anim", "bar_chart_viz"];
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : null; };
const SETS = (process.argv[2] || "").split(";").filter(Boolean).map((x) => x.split("+"));
const D = [45, 60, 75, 90];
const rows = [];
for (const set of SETS) for (const kind of [...KINDS, "pooled"]) {
  const ks = kind === "pooled" ? KINDS : [kind]; let n = 0; const t = []; let cost = 0; const by = Object.fromEntries(D.map((d) => [d, 0])); let pass = 0;
  for (const k of ks) for (let s = 0; s < 5; s++) {
    const rs = set.map((a) => R.find((r) => r.kind === k && r.arm === a && r.s === s)); if (rs.some((x) => !x)) continue;
    n++; cost += rs.reduce((a, r) => a + r.usd, 0);
    const ts = rs.filter((r) => r.passFinal).map((r) => r.timeToPlayableMs); if (!ts.length) continue; pass++;
    const m = Math.min(...ts); t.push(m); for (const d of D) if (m <= d * 1000) by[d]++;
  }
  const w = (k) => { const [a, b] = wilson(k, n); return `${k}/${n} [${a.toFixed(2)}-${b.toFixed(2)}]`; };
  rows.push({ set: set.join(" + "), kind, n, pass, by, t50: q(t, 0.5), t90: q(t, 0.9), usdPerRace: cost / n });
  console.log(`| ${set.join(" + ")} | ${kind} | ${w(pass)} | ${D.map((d) => w(by[d])).join(" | ")} | ${(q(t, 0.5) / 1000).toFixed(1)} / ${(q(t, 0.9) / 1000).toFixed(1)} | ${(cost / n).toFixed(3)} |`);
}
fs.writeFileSync(new URL("./out/deadlines.json", import.meta.url), JSON.stringify(rows, null, 1));
