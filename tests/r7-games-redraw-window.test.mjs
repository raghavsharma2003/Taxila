// r7 Games: a run's last beat must land while the stage is still drawing. The 2D stage (src/play/core/stage.ts) redraws only
// while a view says busy(). Seen in a real browser at 360 px (kon cross, r7): busy() closed 1.6 s after the commit while the
// "off by" chip drew only after 1.6 s, so the child never saw it. This test reads every family view's source and, for each
// timer a busy() window is keyed on (`api.t - X < N`, or `runK() < 1` with `runK = (api.t - X) / SWEEP`), checks that every
// timed beat drawn on that timer (`api.t - X > M`, a fade `(api.t - X - a) / b` that completes at a + b) lands inside N.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src/play/families/", import.meta.url);
const views = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(new URL(`${d.name}/`, ROOT)).filter((f) => f.endsWith(".view.ts")).map((f) => join(d.name, f)));

/** a numeric expression of literals and the file's own `const NAME = <number>`; null when anything else is in it */
function evalNum(expr, src) {
  const consts = Object.fromEntries([...src.matchAll(/const ([A-Z_][A-Z0-9_]*) = ([0-9.]+)\b/g)].map((m) => [m[1], Number(m[2])]));
  const e = expr.replace(/\b[A-Za-z_]\w*\b/g, (id) => (id in consts ? String(consts[id]) : `#${id}`));
  if (!/^[0-9.+\-*/() ]+$/.test(e)) return null;
  try { const v = Function(`"use strict"; return (${e});`)(); return Number.isFinite(v) ? v : null; } catch { return null; }
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** timer variable → the busy() window that keeps the stage drawing for it */
function windows(src) {
  const body = src.match(/const busy = \(\) =>([\s\S]*?);\n/)?.[1] ?? src.match(/const busy = \(\) => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
  const out = {};
  for (const m of body.matchAll(/api\.t - (\w+) < ([^|&)]+?)(?=\)|\s*\|\||\s*&&|$)/g)) { const n = evalNum(m[2], src); if (n !== null) out[m[1]] = Math.max(out[m[1]] ?? 0, n); }
  for (const m of body.matchAll(/api\.t < (\w+) \+ ([^|&)]+?)(?=\)|\s*\|\||\s*&&|$)/g)) { const n = evalNum(m[2], src); if (n !== null) out[m[1]] = Math.max(out[m[1]] ?? 0, n); }
  if (/runK\(\) < 1/.test(body)) {
    const k = src.match(/const runK = \(\) => [^;]*?\(api\.t - (\w+)\) \/ ([^,)]+)/);
    if (k) { const n = evalNum(k[2], src); if (n !== null) out[k[1]] = Math.max(out[k[1]] ?? 0, n); }
  }
  return out;
}
/** the timed beats drawn on a timer variable: thresholds and fade ends, in seconds after it */
function beats(src, v) {
  const V = esc(v), list = [];
  // the timer itself, and any local alias of its age (`const age = api.t - X`)
  const names = [`api\\.t - ${V}`, ...[...src.matchAll(new RegExp(`(?:const|let) (\\w+) = api\\.t - ${V}\\b(?![\\w.(])`, "g"))].map((m) => esc(m[1]))];
  for (const n of names) {
    for (const m of src.matchAll(new RegExp(`(?<![\\w.])${n} >=? ([0-9.]+)`, "g"))) list.push({ at: Number(m[1]), kind: "after" });
    for (const m of src.matchAll(new RegExp(`\\(${n} - ([0-9.]+)\\) \\/ ([0-9.]+)`, "g"))) list.push({ at: Number(m[1]) + Number(m[2]), kind: "fade" });
    for (const m of src.matchAll(new RegExp(`\\(${n}\\) \\/ ([0-9.]+)`, "g"))) list.push({ at: Number(m[1]), kind: "fade" });
    if (!n.startsWith("api")) for (const m of src.matchAll(new RegExp(`(?<![\\w.])${n} \\/ ([0-9.]+)`, "g"))) list.push({ at: Number(m[1]), kind: "fade" });
  }
  return list;
}

test("the family views are found and their busy() windows read", () => {
  assert.ok(views.length >= 20, `found ${views.length} views`);
  const read = views.filter((f) => Object.keys(windows(readFileSync(new URL(f, ROOT), "utf8"))).length > 0);
  assert.ok(read.length >= 12, `busy() windows read in ${read.length} views`);
});

test("every timed beat of a run lands before its view stops drawing", () => {
  const late = [];
  let checked = 0;
  for (const f of views) {
    const src = readFileSync(new URL(f, ROOT), "utf8");
    for (const [v, win] of Object.entries(windows(src))) {
      for (const b of beats(src, v)) {
        checked++;
        // a threshold must open strictly inside the window; a fade may complete on its last frame (one frame of slack)
        if (b.kind === "after" ? b.at >= win : b.at > win + 0.05) late.push(`${f}: ${v} ${b.kind} at ${b.at} s, window ${win} s`);
      }
    }
  }
  assert.ok(checked >= 10, `timed beats checked: ${checked}`);
  assert.deepEqual(late, [], "beats that land after the stage stops drawing (lengthen the busy() window)");
});
