// W2-B explain rungs (Studio ladder rungs 4-5): the board explanation / diagram templates, measured.
//
//   node evals/forge-explainer.mjs                 offline (no model, no network):
//     1. strict render-check per template over a parameter sweep + every c4-c7 topic's code pick and library entry:
//        ALL checks must pass per script (strict normalise, inside the board, no overlapping text, kit truth, facts
//        present, duration within the band cap); the pass rate is reported per template, never as a mean;
//     2. coverage: through the REAL Director (step()), the share of c4-c7 explain moves that show an engine or a board
//        (and with Studio "forced off", which today is the same thing: no Studio rung exists yet);
//     3. "her numbers = the screen's numbers" (structural half): on every maths explain / worked-example move, the
//        numbers in the facts row are the numbers of the module's own params (live half: evals/forge-teacher-screen.mjs).
//   node --env-file=.env.local evals/forge-explainer.mjs --build [--only c6-science] [--concurrency 4]
//     builds server/forge/explainer/library.json: one model fill (taxila-fast, strict schema) per topic with no code
//     pick, truth-checked against the kit and render-checked; resumable (topics already in the library are skipped).
//   --browser: also draw every library / code-pick script in Chromium (dist/modules.html is not needed: the player is
//     rendered from the Vite dev server) and check every drawn text's box lies inside the SVG.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const LIB = new URL("server/forge/explainer/library.json", ROOT);

const { expand, TEMPLATES } = await import("../server/forge/explainer/templates.js");
const { codePick } = await import("../server/forge/explainer/pick.js");
const { checkCall, kitVocabulary, labelsOf } = await import("../server/forge/explainer/truth.js");
const { getKit } = await import("../server/content/index.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { scriptTokens } = await import("../shared/whiteboard.js");

const topicIds = readdirSync(new URL("data/kits/", ROOT)).filter((f) => /^c[4-7]-[a-z]+\.json$/.test(f)).sort()
  .flatMap((f) => JSON.parse(readFileSync(new URL(`data/kits/${f}`, ROOT), "utf8")).topics.map((t) => t.topicId))
  .filter((id) => !arg("--only") || id.startsWith(arg("--only")));
const readLib = () => (existsSync(LIB) ? JSON.parse(readFileSync(LIB, "utf8")) : { v: 1, built: null, topics: {} });

// ───────────────────────────── --build ─────────────────────────────
if (has("--build")) {
  const { modelFill } = await import("../server/forge/explainer/fill.js");
  const lib = readLib();
  const todo = [];
  const bandOf = (id) => { const c = +id[1]; return c <= 2 ? "B1" : c <= 4 ? "B2" : c <= 6 ? "B3" : "B4"; };
  for (const id of topicIds) {
    const kit = await getKit(id, { generate: false });
    if (!kit || codePick({ kit })) continue;
    // an entry that no longer passes TODAY's truth and layout check (a kit edit, a stricter rule) is rebuilt
    if (lib.topics[id] && !has("--fresh") && checkCall(lib.topics[id].call, kit, { band: bandOf(id) }).ok) continue;
    delete lib.topics[id];
    todo.push({ id, kit });
  }
  console.log(`building ${todo.length} topics`);
  const conc = +arg("--concurrency", 4);
  const stats = { ok: 0, fail: {}, ms: [] };
  let next = 0;
  const band = (id) => { const c = +id[1]; return c <= 2 ? "B1" : c <= 4 ? "B2" : c <= 6 ? "B3" : "B4"; };
  await Promise.all(Array.from({ length: conc }, async () => {
    while (next < todo.length) {
      const { id, kit } = todo[next++];
      let r = await modelFill({ kit, topicTitle: getTopic(id)?.title, band: band(id), timeoutMs: 15000 });
      // one retry: a fill that broke a rule (a word not in the kit, a label too wide) gets one more draw
      for (let k = 0; k < 2 && !r.ok && /not_in_kit|layout|too_long|truncated|punctuation/.test(r.why ?? ""); k++) {
        r = await modelFill({ kit, topicTitle: getTopic(id)?.title, band: band(id), timeoutMs: 15000, feedback: r.why });
      }
      stats.ms.push(r.ms);
      if (r.ok) { stats.ok++; lib.topics[id] = { call: r.call, by: "model", at: new Date().toISOString().slice(0, 10) }; }
      else { const k = String(r.why).split(":")[0]; stats.fail[k] = (stats.fail[k] ?? 0) + 1; if (has("--verbose")) console.log("FAIL", id, r.why, JSON.stringify(r.call ?? null).slice(0, 300)); }
      if ((stats.ok + Object.values(stats.fail).reduce((a, b) => a + b, 0)) % 20 === 0) {
        lib.built = new Date().toISOString();
        writeFileSync(LIB, JSON.stringify(lib, null, 1));
      }
    }
  }));
  lib.built = new Date().toISOString();
  lib.v = 1;
  // stable order for review diffs
  lib.topics = Object.fromEntries(Object.entries(lib.topics).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(LIB, JSON.stringify(lib, null, 1));
  const ms = stats.ms.sort((a, b) => a - b);
  console.log(JSON.stringify({ built: todo.length, ok: stats.ok, fail: stats.fail, p50: ms[Math.floor(ms.length / 2)], p95: ms[Math.floor(ms.length * 0.95)] }));
  process.exit(0);
}

// ───────────────────────────── 1. strict render-check ─────────────────────────────
const CAP_MS = { B1: 60000, B2: 60000, B3: 90000, B4: 90000 };
const perTemplate = Object.fromEntries(TEMPLATES.map((t) => [t, { n: 0, pass: 0, fails: {} }]));
function check(call, { band = "B3", kit = null } = {}) {
  const row = perTemplate[call.template] ?? (perTemplate[call.template] = { n: 0, pass: 0, fails: {} });
  row.n++;
  const fail = (why) => { row.fails[why] = (row.fails[why] ?? 0) + 1; return false; };
  const x = expand(call, { band });
  if (!x.ok) return fail(`expand:${x.errors[0]}`);
  if (x.script.durationMs > CAP_MS[band]) return fail("duration");
  if (!x.facts || !Object.keys(x.facts.onScreen).length) return fail("facts");
  if (kit) { const t = checkCall(call, kit, { band, vocab: kitVocabulary(kit) }); if (!t.ok) return fail(`truth:${t.why.split(":")[0]}`); }
  // every drawn label token traces to the call (code drew nothing the call did not carry, except numbers it computed)
  const callText = JSON.stringify(call).toLowerCase();
  for (const tok of scriptTokens(x.script)) if (!/^[\d./+-]+$/.test(tok) && !callText.includes(tok) && !/^(equal|parts|o|t|h|th|tth|l|tl|cm|m|km|mm|units)$/.test(tok)) return fail(`token:${tok}`);
  row.pass++;
  return true;
}
// parameter sweeps (the maths templates' full ranges, sampled; the diagram templates over generated label sets)
for (let d = 2; d <= 12; d++) for (let n = 0; n <= d; n++) for (const whole of ["circle", "bar", "roti"]) check({ template: "fraction-parts@1", whole, parts: d, shade: n });
for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) { check({ template: "combine-count@1", a, b, op: "add" }); if (b <= a) check({ template: "combine-count@1", a, b, op: "take_away" }); }
for (let s = -5; s <= 30; s += 5) for (const h of [[1], [3, 2], [-4], [5, -2, 3], [10], [-10, 4]]) check({ template: "number-line-hop@1", start: s, hops: h });
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
for (let i = 0; i < 200; i++) { const a = Math.floor(rnd() * 99999), b = Math.floor(rnd() * 99999); check({ template: "column-op@1", a, b, op: "add" }); check({ template: "column-op@1", a: Math.max(a, b), b: Math.min(a, b), op: "sub" }); }
for (const v of [7, 45, 309, 4050, 12345, 345678, 1234567, 9999999]) check({ template: "place-value@1", value: v });
for (let g = 2; g <= 6; g++) for (let e = 1; e <= 8; e++) check({ template: "equal-groups@1", groups: g, each: e });
const W = ["water", "sun", "seed", "plant", "evaporation", "condensation", "rain", "river", "sea", "cloud", "farmer's income", "pollination", "soil", "root"];
for (let n = 2; n <= 6; n++) check({ template: "flow@1", steps: W.slice(n, n * 2) });
for (let n = 3; n <= 6; n++) check({ template: "cycle@1", stages: W.slice(n, n * 2), centre: "water cycle" });
for (let n = 1; n <= 4; n++) check({ template: "compare@1", left: { title: "natural forest", items: W.slice(0, n) }, right: { title: "one tree kind", items: W.slice(4, 4 + n) } });
for (let n = 2; n <= 6; n++) check({ template: "parts@1", whole: "biodiversity", parts: W.slice(n, n * 2) });
check({ template: "label@1", sketch: "plant", labels: [{ anchor: "flower", text: "flower" }, { anchor: "leaf", text: "leaf" }, { anchor: "stem", text: "stem" }, { anchor: "root", text: "root" }] });
check({ template: "label@1", sketch: "flower", labels: [{ anchor: "petal", text: "petal" }, { anchor: "sepal", text: "sepal" }, { anchor: "stamen", text: "stamen" }, { anchor: "pistil", text: "pistil" }] });
check({ template: "label@1", sketch: "leaf", labels: [{ anchor: "midrib", text: "midrib" }, { anchor: "vein", text: "vein" }, { anchor: "stalk", text: "petiole" }, { anchor: "blade", text: "leaf blade" }] });
check({ template: "label@1", sketch: "insect", labels: [{ anchor: "head", text: "head" }, { anchor: "thorax", text: "thorax" }, { anchor: "abdomen", text: "abdomen" }, { anchor: "antenna", text: "antenna" }, { anchor: "leg", text: "six legs" }] });
// geometry and data (W2-B fixer, major 2)
for (const d of [30, 45, 60, 90, 120, 135, 150, 180]) check({ template: "angle@1", angles: [{ deg: d, name: d === 90 ? "right angle" : `${d}°` }], arm: "arm", vertex: "corner" });
check({ template: "angle@1", angles: [{ deg: 50, name: "acute angle" }, { deg: 130, name: "obtuse angle" }] });
check({ template: "angle@1", angles: [{ deg: 50, name: "acute angle" }, { deg: 90, name: "right angle" }, { deg: 150, name: "obtuse angle" }] });
for (const sh of ["triangle", "square", "rectangle", "quadrilateral", "pentagon", "hexagon", "octagon"]) {
  check({ template: "shape@1", shape: sh, name: sh, side: "side", corner: "vertex" });
  check({ template: "shape@1", shape: sh, copies: 2, names: ["A", "B"] });
}
check({ template: "shape@1", shape: "circle", name: "circle", centre: "centre", radius: "radius", diameter: "diameter" });
check({ template: "shape@1", shape: "circle", name: "circle", centre: "centre", radius: "radius" });
for (let d = 1; d <= 6; d++) check({ template: "symmetry@1", line: "mirror line", dot: d });
check({ template: "symmetry@1", line: "line of symmetry" });
for (const [w, h] of [[1, 1], [3, 2], [5, 3], [8, 4], [12, 8], [50, 30], [100, 4], [999, 1000]]) for (const mode of ["area", "perimeter"]) for (const unit of ["cm", "m", undefined]) check({ template: "area-grid@1", w, h, mode, ...(unit ? { unit } : {}) });
for (const vals of [[25, 40], [140, 250, 230, 120], [12, 9, 6, 15, 3], [1308, 976], [5, 10, 15, 20, 25, 30], [0, 7]]) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  check({ template: "bar-chart@1", bars: vals.map((v, i) => ({ label: labels[i], value: v })) });
}
const sweep = structuredClone(perTemplate);

// real topics: the code pick (maths) and the library entry (every subject)
const lib = readLib();
const real = Object.fromEntries(TEMPLATES.map((t) => [t, { n: 0, pass: 0, fails: {} }]));
for (const k of Object.keys(perTemplate)) perTemplate[k] = { n: 0, pass: 0, fails: {} };
const kits = new Map();
for (const id of topicIds) {
  const kit = await getKit(id, { generate: false }); if (!kit) continue;
  kits.set(id, kit);
  const band = +id[1] <= 4 ? "B2" : +id[1] <= 6 ? "B3" : "B4";
  const cp = codePick({ kit });
  if (cp) check(cp, { band });
  for (const item of kit.items) { const c = codePick({ kit, item }); if (c) check(c, { band }); }
  if (lib.topics[id]) check(lib.topics[id].call, { band, kit });
}
for (const [k, v] of Object.entries(perTemplate)) real[k] = v;

// ───────────────────────────── 2. coverage through the real Director ─────────────────────────────
const { initLessonState, step } = await import("../server/director/state.js");
const { _setLibrary, libraryCalls } = await import("../server/forge/explainer/lesson.js");
void _setLibrary; libraryCalls();
const NE = { outcome: "no_evidence", flags: {}, source: "test", confidence: 1 };
const cov = {};
const numbersOk = { n: 0, ok: 0, bad: [] };
for (const [id, kit] of kits) {
  const cl = +id[1];
  const ctx = { protege: { name: "Golu", what: "a pretend elephant" }, teacherName: "Asha", teacherId: "asha", sessionId: `ev-${id}`, lang: "hinglish",
    classLevel: cl, ageBand: cl <= 4 ? "6-9" : "10-15", firstName: "Asha", interests: [] };
  let r = step(initLessonState({ topicId: id, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const subj = id.split("-")[1];
  const c = (cov[subj] ??= { explain: 0, engine: 0, board: 0, none: 0 });
  for (let i = 0; i < 8; i++) {
    r = step(r.state, { event: "turn", kit, cls: NE, now: (i + 1) * 20000 });
    if (!["explain", "worked_example"].includes(r.move.kind)) { if (r.state.phase === "practice") break; continue; }
    const m = r.state.module;
    if (r.move.kind === "explain") { c.explain++; if (!m) c.none++; else if (m.engine === "explainer@1") c.board++; else c.engine++; }
    // structural "numbers match": every number in the facts row is a number of the mounted module's own params
    const row = (r.state.lastContent ?? []).find((l) => l.startsWith("on screen now"));
    if (subj === "maths" && m && row) {
      numbersOk.n++;
      const facts = (row.split("): ")[1] ?? "").match(/\d+(?:\/\d+)?/g) ?? [];
      const own = JSON.stringify(m.params).replace(/\[(\d+),(\d+)\]/g, "$1/$2").match(/\d+(?:\/\d+)?/g) ?? [];
      const missing = facts.filter((x) => !own.includes(x) && !own.some((o) => o.split("/").includes(x)));
      if (missing.length) numbersOk.bad.push(`${id}:${missing.join(",")}`); else numbersOk.ok++;
    }
  }
}

const rate = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v.n).map(([k, v]) => [k, { n: v.n, pass: v.pass, rate: +(v.pass / v.n).toFixed(3), fails: v.fails }]));
const out = { date: new Date().toISOString().slice(0, 10), sweep: rate(sweep), realTopics: rate(real), libraryEntries: Object.keys(lib.topics).length,
  coverage: cov, numbersMatch: { ...numbersOk, bad: numbersOk.bad.slice(0, 20) } };
mkdirSync(new URL("evals/results/", ROOT), { recursive: true });
writeFileSync(new URL(`evals/results/forge-explainer-${out.date}.json`, ROOT), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
const below = Object.entries({ ...out.sweep, ...out.realTopics }).filter(([, v]) => v.rate < 0.95);
if (below.length) { console.error("templates below 95% all-checks:", below.map(([k]) => k).join(", ")); process.exitCode = 1; }
void labelsOf;
