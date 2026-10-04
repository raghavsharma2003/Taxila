// The whiteboard planner bench (owner priority 6): real teacher lines from production (the live-content probe's
// explain / worked-example / repair / hint replies, classes 4-7, maths + science + EVS) → server/studio/plan.js
// planWhiteboard (the model writes the drawing script) → the whiteboard gate (qa/whiteboard.js). Reports, per arm:
// pass first try, pass after ≤ 1 repair, empty ("nothing to draw"), time p50 / p90, $ per line, the failing checks.
// Also writes the final board of every passed script as a static SVG (out-whiteboard/<arm>/<n>.svg) to look at.
// Usage: NODE_USE_ENV_PROXY=1 node evals/live-studio/whiteboard-bench.mjs [--arms fast-none,luna-none] [--n 30] [--conc 6]
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./models.mjs";
loadEnv();
const { planWhiteboard } = await import("../../server/studio/plan.js");
const { opGeometry } = await import("../../shared/whiteboard.js");
const { usdOf } = await import("../../server/azure.js");
const { kitFromFile } = await import("../../server/content/kits.js");
const { getTopic } = await import("../../server/content/curriculum.js");

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ARMS = {
  "fast-none": { dep: "taxila-fast", effort: "none" },
  "fast-low": { dep: "taxila-fast", effort: "low" },
  "luna-none": { dep: "taxila-gpt6-luna", effort: "none" },
  "luna-low": { dep: "taxila-gpt6-luna", effort: "low" },
  "gpt6-low": { dep: "taxila-gpt6", effort: "low" },
};
const arms = arg("arms", "fast-none,luna-none").split(",");
const N = +arg("n", 30), CONC = +arg("conc", 6);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, arg("out", "out-whiteboard"));

// the lines: production replies on teaching moves, launch classes, subjects with something to draw
const probe = JSON.parse(fs.readFileSync(path.join(HERE, "../../docs/design/gap-audit/shots/live-content/prod-probe-2026-10-03.json"), "utf8"));
const lines = [];
for (const s of probe) {
  if (!/maths|science|evs/.test(s.topicId ?? "")) continue;
  for (const t of s.turns ?? []) if (/explain|worked_example|repair|hint/.test(t.move ?? "") && t.reply && t.reply.length > 60) lines.push({ topicId: s.topicId, move: t.move, text: t.reply });
}
const pick = lines.slice(0, N);
const kitCache = new Map();
function kitOf(topicId) {
  if (!kitCache.has(topicId)) { try { kitCache.set(topicId, kitFromFile(getTopic(topicId))); } catch { kitCache.set(topicId, null); } }
  return kitCache.get(topicId);
}

function svgOf(script) {
  const byId = new Map(script.ops.map((o) => [o.id, o]));
  const inks = { chalk: "#f4f1e8", accent: "#ffd166", ink: "#cfe8ff", mark: "#ff8fa3", good: "#9be59b", soft: "#9aa5b1" };
  let body = "";
  const erased = new Set(script.ops.filter((o) => o.op === "erase").map((o) => o.target));
  for (const o of script.ops) {
    if (erased.has(o.id) || o.op === "erase") continue;
    const g = opGeometry(o, byId);
    const col = inks[o.ink ?? "chalk"];
    if (g.fill) body += `<path d="${g.fill}" fill="${inks[o.fill] ?? col}" fill-opacity="0.35"/>`;
    for (const d of g.paths) body += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${o.weight === 3 ? 5 : 3}" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const t of g.texts) body += `<text x="${t.x}" y="${t.y}" font-size="${t.size}" text-anchor="${t.align === "start" ? "start" : t.align === "end" ? "end" : "middle"}" fill="${col}" font-family="Comic Sans MS, cursive">${String(t.text).replace(/[<&]/g, "")}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${script.board.w} ${script.board.h}" width="${script.board.w * 1.5}" height="${script.board.h * 1.5}"><rect width="100%" height="100%" fill="#26413c"/>${body}</svg>`;
}

const rows = [];
// server/lanes.js parks background calls on an unref'd timer: a CLI run must keep its own loop alive meanwhile
const keepAlive = setInterval(() => {}, 1000);
for (const arm of arms) {
  const { dep, effort } = ARMS[arm];
  fs.mkdirSync(path.join(OUT, arm), { recursive: true });
  let next = 0;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (next < pick.length) {
      const i = next++; const L = pick[i];
      const kit = kitOf(L.topicId);
      const ask = { intent: { intentId: `bench:${i}`, lessonId: "bench", kind: "whiteboard", skillId: kit?.skills?.[0]?.id ?? "", need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue", style: { band: /^c4/.test(L.topicId) ? "B2" : "B3", lang: "hinglish", motion: "lively" } },
        line: { lessonId: "bench", text: L.text }, mode: "fresh", kit: { topicId: L.topicId, content: (kit?.expectations ?? []).slice(0, 4) } };
      const r = await planWhiteboard(ask, { kit, deployment: dep, effort, budgetMs: 20000, redact: ["Riya", "Bittu"] });
      const firstPass = r.ok && r.attempts === 1;
      const usd = (r.usage ?? []).reduce((s, u) => s + usdOf(dep, u ? { in: u.prompt_tokens, cached: u.prompt_tokens_details?.cached_tokens ?? 0, out: u.completion_tokens } : null), 0);
      const failed = r.gate ? r.gate.checks.filter((c) => !c.pass).map((c) => c.id) : [r.why];
      rows.push({ arm, i, topicId: L.topicId, move: L.move, ok: r.ok, firstPass, empty: !!r.empty, attempts: r.attempts, ms: r.ms, usd, failed: r.ok ? [] : failed,
        ops: r.script?.ops?.length ?? 0, why: r.ok ? undefined : String(r.why ?? "").slice(0, 300) });
      if (r.ok) fs.writeFileSync(path.join(OUT, arm, `${i}.svg`), svgOf(r.script));
      console.log(`${arm} #${i} ${L.topicId} ${r.ok ? (firstPass ? "PASS1" : "PASS2") : r.empty ? "EMPTY" : "FAIL " + failed.join(",")} ${r.ms}ms ops ${r.script?.ops?.length ?? 0} $${usd.toFixed(4)}`);
    }
  }));
}
clearInterval(keepAlive);
const q = (xs, p) => { const s = xs.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const summary = arms.map((arm) => {
  const r = rows.filter((x) => x.arm === arm), drawn = r.filter((x) => !x.empty);
  const fails = {}; for (const x of r) for (const f of x.failed) fails[f] = (fails[f] ?? 0) + 1;
  return { arm, n: r.length, empty: r.length - drawn.length, passFirst: drawn.filter((x) => x.firstPass).length, passFinal: drawn.filter((x) => x.ok).length, drawn: drawn.length,
    p50ms: q(r.filter((x) => x.ok).map((x) => x.ms), 0.5), p90ms: q(r.filter((x) => x.ok).map((x) => x.ms), 0.9), firstP50ms: q(r.filter((x) => x.firstPass).map((x) => x.ms), 0.5),
    usdPerLine: +(r.reduce((s, x) => s + x.usd, 0) / Math.max(1, r.length)).toFixed(5), fails };
});
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify({ date: new Date().toISOString(), summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
