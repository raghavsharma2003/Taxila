// Round 3 · forge · offline render matrix (2026-10-09). Every live-built Studio artifact kind rendered in the REAL Desk tray
// + StudioStage (server/forge3/qa harness, built from this tree) at the tray boxes taxila.dev gave on 360 x 800, 412 x 915 and
// 1366 x 768, measured and judged by server/forge3/qa/checks.js (the same verdict the forge3 gate uses).
//
// Sources (--sources, comma list):
//   prod      the boards taxila.dev actually drew in the audit walk (docs/design/round3/forge/audit/before/*/record.json)
//   boards    every catalogue whiteboard beat (data/studio-catalogue/topics/*.json whiteboard.beats[].script)
//   games     every catalogue game spec (Studio v2 engine, library rung)
//   explainers every catalogue explainer spec
// Output: <out>/matrix.json (one row per artifact: per-view verdicts and stats) and screenshots for a sample
// (--shots N per archetype, default 2, plus every prod board).
//
//   FORGE3_QA_LOCAL=1 node docs/design/round3/forge/audit/harness/matrix.mjs --out <dir> [--sources prod,boards,games,explainers]
//     [--limit N] [--conc 4] [--shots 2] [--harness <built dir>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serveHarness, openJudge, launchLocal, buildHarness, REPO } from "../../../../../../server/forge3/qa/render.js";
import { DESK_VIEWPORTS } from "../../../../../../server/forge3/qa/viewports.js";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const OUT = arg("out", path.join(process.cwd(), "matrix-out"));
const SOURCES = arg("sources", "prod,boards,games,explainers").split(",");
const LIMIT = Number(arg("limit", "0")) || Infinity;
const CONC = Math.max(1, Number(arg("conc", "4")) || 4);
const SHOTS = Number(arg("shots", "2"));
const HARNESS = arg("harness", "");
const here = path.dirname(fileURLToPath(import.meta.url));
// classes 4-5 are judged at the young floor (shared/play.ts FLOORS.textYoung) and rendered with the stage's young flag, as the
// Desk does for them; a library game carries the board twin the live conductor gives it (server/stagecraft/builders.js), so
// the stage's device check can show the twin where the world would be illegible.
const classOf = (topicId) => Number(/^c(\d+)-/.exec(String(topicId ?? ""))?.[1] ?? 0) || null;
const youngOf = (topicId) => { const c = classOf(topicId); return c != null && c <= 5; };
let boardTwinFor = null;
try { ({ boardTwinFor } = await import("../../../../../../server/stagecraft/builders.js")); } catch (e) { console.warn(`no board twins: ${e?.message ?? e}`); }
const twinOf = (archetype, topicId) => { try { return boardTwinFor ? boardTwinFor({ archetype, family: archetype, need: "explain" }, topicId) : null; } catch { return null; } };
fs.mkdirSync(OUT, { recursive: true });

const jobs = [];
if (SOURCES.includes("prod")) {
  const dir = path.join(here, "..", "before");
  for (const c of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const f = path.join(dir, c, "record.json");
    if (!fs.existsSync(f)) continue;
    const rec = JSON.parse(fs.readFileSync(f, "utf8"));
    const seen = new Set();
    for (const n of rec.net ?? []) {
      const s = n.slot ?? n.ui?.studioSlot;
      const a = s?.artifact;
      if (!a) continue;
      const key = JSON.stringify(a).length + ":" + (a.script?.scriptId ?? a.stagecraft?.archetype ?? "");
      if (seen.has(key)) continue;
      seen.add(key);
      jobs.push({ id: `prod:${c}:${seen.size}`, source: "prod", group: `prod-${a.kind}`, topic: rec.topic, artifact: a, shot: true, line: n.reply ?? null });
    }
  }
}
const topicsDir = path.join(REPO, "data", "studio-catalogue", "topics");
const topics = fs.readdirSync(topicsDir).filter((f) => f.endsWith(".json")).sort().slice(0, LIMIT);
const perGroup = new Map();
const wantShot = (g) => { const n = perGroup.get(g) ?? 0; perGroup.set(g, n + 1); return n < SHOTS; };
for (const f of topics) {
  const t = JSON.parse(fs.readFileSync(path.join(topicsDir, f), "utf8"));
  if (SOURCES.includes("boards")) {
    const b = (t.whiteboard?.beats ?? []).find((x) => x.ok && x.script) ?? (t.whiteboard?.beats ?? [])[0];
    if (b?.script) jobs.push({ id: `board:${t.topicId}`, source: "boards", group: "catalogue-board", topic: t.topicId, artifact: { kind: "whiteboard", stage: { w: b.script.board.w, h: b.script.board.h }, script: b.script }, shot: wantShot("catalogue-board") });
  }
  for (const [src, k] of [["games", "game"], ["explainers", "explainer"]]) {
    if (!SOURCES.includes(src) || !t[k]?.spec) continue;
    const g = `${k}:${t[k].archetype}`;
    jobs.push({ id: `${k}:${t.topicId}`, source: src, group: g, topic: t.topicId, artifact: { kind: "stagecraft", stage: { w: 1000, h: 625 }, stagecraft: { rung: "library", archetype: t[k].archetype, spec: t[k].spec, boardTwin: twinOf(t[k].archetype, t.topicId) } }, shot: wantShot(g) });
  }
}
console.log(`matrix: ${jobs.length} artifacts x ${DESK_VIEWPORTS.length} views (${SOURCES.join(",")})`);

const harnessDir = HARNESS || await buildHarness(path.join(OUT, "_harness"));
const { server, base } = await serveHarness(harnessDir);
const browser = await launchLocal();
const rows = [];
let i = 0;
const t0 = Date.now();
async function worker(w) {
  const j = await openJudge({ browser, base });
  while (i < jobs.length) {
    const job = jobs[i++];
    try {
      const r = await j.judge(job.artifact, { young: youngOf(job.topic), shotDir: job.shot ? path.join(OUT, "shots", job.group.replace(/[^a-z0-9@.-]+/gi, "_")) : undefined, shotTag: job.id.replace(/[^a-z0-9@.-]+/gi, "_"), settleMs: job.artifact.kind === "stagecraft" ? 2500 : undefined });
      rows.push({ id: job.id, source: job.source, group: job.group, topic: job.topic, young: youngOf(job.topic), line: job.line ?? null, pass: r.piece.pass, byViewport: r.piece.byViewport, fails: r.piece.fails,
        views: r.views.map((v) => ({ vp: v.vp, shown: v.metrics?.legible === "twin" ? "twin" : v.metrics?.kind ?? null, framed: !!v.metrics?.framed, pass: v.verdict.pass, fails: v.verdict.fails, softFails: v.verdict.softFails, stats: v.verdict.stats, file: v.file ? path.relative(OUT, v.file) : null,
          detail: Object.fromEntries(v.verdict.hard.filter((c) => !c.pass).map((c) => [c.id, c.detail ?? ""])), ms: v.ms })) });
    } catch (e) {
      rows.push({ id: job.id, source: job.source, group: job.group, topic: job.topic, error: String(e?.message ?? e).slice(0, 200) });
    }
    if (rows.length % 50 === 0) console.log(`  ${rows.length}/${jobs.length} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  await j.close();
}
await Promise.all(Array.from({ length: CONC }, (_, w) => worker(w)));
await browser.close();
server.close();
fs.writeFileSync(path.join(OUT, "matrix.json"), JSON.stringify({ at: new Date().toISOString(), viewports: DESK_VIEWPORTS, rows }, null, 1));

// summary: per group, per viewport: views judged, broken (any hard fail), the fail codes
const sum = {};
for (const r of rows) {
  const g = (sum[r.group] ??= { n: 0, piecesBroken: 0, views: 0, viewsBroken: 0, byVp: {}, codes: {}, soft: {} });
  g.n++;
  if (r.error) { g.errors = (g.errors ?? 0) + 1; continue; }
  if (!r.pass) g.piecesBroken++;
  for (const v of r.views) {
    g.views++; if (!v.pass) g.viewsBroken++;
    const b = (g.byVp[v.vp] ??= { n: 0, broken: 0 }); b.n++; if (!v.pass) b.broken++; if (v.shown === "twin") b.twin = (b.twin ?? 0) + 1; if (v.framed) b.framed = (b.framed ?? 0) + 1;
    for (const c of v.fails) g.codes[c] = (g.codes[c] ?? 0) + 1;
    for (const c of v.softFails ?? []) g.soft[c] = (g.soft[c] ?? 0) + 1;
  }
}
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(sum, null, 1));
for (const [g, s] of Object.entries(sum).sort()) console.log(`${g}: pieces ${s.n}, broken ${s.piecesBroken}; views ${s.views}, broken ${s.viewsBroken} ${JSON.stringify(s.byVp)} ${JSON.stringify(s.codes)}`);
console.log(`done in ${Math.round((Date.now() - t0) / 1000)} s`);
