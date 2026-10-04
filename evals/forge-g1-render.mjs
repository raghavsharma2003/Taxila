// Forge G1 render check over scene@1 fills (W1-B #5; the gate before `scene@1` turned on by default in planner.js).
// Offline: no model (FORGE_FLAVOUR=off: the code pick), no Neon, no Blob — the fills are built and gated exactly as
// the live path builds them, then render-check.mjs boots the PRODUCTION frame (dist/modules.html, run `npx vite
// build` first) and replays a wrong commit and the solution per fill: the engine's verdict must agree with the gate's
// key AND with the server's grader (grade.js gradeEvent), with no console error, no network, every control in view.
// Usage: node evals/forge-g1-render.mjs [--n 40] [--seed 5] [--out evals/results/forge-g1-render-<date>.json]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";

process.env.FORGE_FLAVOUR = "off";
process.env.FORGE_DB_CACHE = "off";
process.env.FORGE_BLOB = "off";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg("--n", 40), SEED = +arg("--seed", 5);
const ROOT = new URL("../", import.meta.url);
const OUT = arg("--out", null);

const { requestFill } = await import("../server/forge/index.js");
const { diagnosticItems, activitiesFor } = await import("../server/forge/derive.js");
const { getKit } = await import("../server/content/index.js");
const { renderCheck } = await import("../server/forge/render-check.mjs");
const { rng } = await import("../server/forge/kitmath.js");

const rand = rng(SEED);
const shuffle = (a) => a.map((x) => [rand(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const files = readdirSync(new URL("data/kits/", ROOT)).filter((f) => /^c[4-7]-(maths|science|evs|english)\.json$/.test(f)).sort();
const pool = { "choice-card@1": [], "sequence-steps@1": [] };
for (const f of files) {
  const classLevel = +f[1];
  for (const t of JSON.parse(readFileSync(new URL(`data/kits/${f}`, ROOT), "utf8")).topics) {
    const kit = await getKit(t.topicId, { generate: false });
    if (!kit) continue;
    for (const item of [...kit.items, ...diagnosticItems(kit)]) {
      const tmpl = activitiesFor(item, kit).activities.find((a) => a.renderer === "scene@1")?.template;
      if (tmpl && pool[tmpl]) pool[tmpl].push({ kit, item, classLevel, subject: f.replace(/^c\d-|\.json$/g, "") });
    }
  }
}
// half and half by template (when there are enough), shuffled across classes and subjects
const picks = [...shuffle(pool["choice-card@1"]).slice(0, Math.ceil(N / 2)), ...shuffle(pool["sequence-steps@1"]).slice(0, Math.floor(N / 2))];
const fills = [];
const built = { ready: 0, gap: 0, byTemplate: {} };
for (const p of picks) {
  const learner = { child: { firstName: "Asha", classLevel: p.classLevel, languagePref: "hinglish", interests: ["cricket"] }, recentWrong: [], activeMisconceptions: [], pKnown: {} };
  const r = await requestFill({ kit: p.kit, item: p.item, move: "practice", learner, renderers: new Set(["scene@1"]), needByMs: 10_000, noGapRow: true });
  if (r.status !== "ready") { built.gap++; continue; }
  built.ready++;
  built.byTemplate[r.template] = (built.byTemplate[r.template] ?? 0) + 1;
  fills.push({ fillKey: r.fillKey, renderer: r.renderer, payload: r.command.params, grade: r.grade, itemId: p.item.id, template: r.template, subject: p.subject, classLevel: p.classLevel });
}
const results = await renderCheck(fills, { dist: new URL("dist", ROOT).pathname });
const failed = results.filter((x) => !x.ok);
const boot = results.map((x) => x.bootMs).filter((x) => x > 0).sort((a, b) => a - b);
const summary = {
  date: new Date().toISOString().slice(0, 10),
  method: "offline: requestFill (code pick, gate) over c4-c7 maths/science/evs/english items with a scene@1 activity; render-check.mjs in dist/ (production frame), a wrong commit + the solution per fill, frame verdict vs gate key vs grade.js gradeEvent, controls in view at 360x640",
  pool: { choice: pool["choice-card@1"].length, sequence: pool["sequence-steps@1"].length }, picked: picks.length, built,
  checked: results.length, passed: results.length - failed.length,
  bootMs: { p50: boot[Math.floor(boot.length / 2)] ?? null, max: boot.at(-1) ?? null },
  failures: failed.map((x) => ({ fillKey: x.fillKey, itemId: fills.find((f) => f.fillKey === x.fillKey)?.itemId, failures: x.failures })),
};
console.log(JSON.stringify(summary, null, 1));
if (OUT) { mkdirSync(new URL("evals/results/", ROOT), { recursive: true }); writeFileSync(OUT, JSON.stringify(summary, null, 1)); }
process.exitCode = failed.length || !results.length ? 1 : 0;
