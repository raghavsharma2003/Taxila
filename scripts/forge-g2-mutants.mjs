// Measure the ruler first (FACTORY.md §5.5): the G2 gate against seeded-bug mechanics derived from the two goldens,
// plus the clean goldens as false-alarm controls. Every mutant runs BOTH halves (static + browser) so a lint catch does
// not hide whether the runtime boundary would have caught it too (the `e` variants evade the lint on purpose).
// Writes server/forge/g2/measurements/mutants-<stamp>.json. No model calls; costs nothing but CPU.
// tgk-lite@2 makes refs opaque, so a mutant that keys behaviour on `slot === "key"` is INERT on the real kit (the hint
// never renders). Each such "leak" mutant also runs against a LEAKY kit variant (tokens = the internal slots, i.e. the
// tgk-lite@1 behaviour) to prove the browser detectors (key_position / key_styled) would catch the hint if the opacity
// ever regressed. Outcomes: caught (a gate failed on the real kit) | inert (passed, and the leaky run shows the attack
// needs the leak: it is caught there) | MISSED.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { buildBundle, KIT_JS } from "../server/forge/g2/bundle.js";
const TOKEN_LINE = 'return "o:" + a[0].toString(36) + a[1].toString(36); }';
if (!KIT_JS.includes(TOKEN_LINE)) throw new Error("kit token anchor moved: update scripts/forge-g2-mutants.mjs");
const LEAKY_KIT = KIT_JS.replace(TOKEN_LINE, "return internal; }");
import { staticGate, browserGate, launchBrowser } from "../server/forge/g2/qa.js";
import { briefFor } from "../server/forge/g2/brief.js";
const ROOT = new URL("..", import.meta.url).pathname;
const G = (f) => readFileSync(`${ROOT}server/forge/g2/goldens/${f}.js`, "utf8");
const D = JSON.parse(readFileSync(`${ROOT}server/forge/g2/goldens/designs.json`, "utf8"));
const S = G("stepping-stones"), T = G("tower-build");
const sub = (src, a, b) => { if (!src.includes(a)) throw new Error(`mutant anchor missing: ${a.slice(0, 50)}`); return src.replace(a, b); };

const CHOICE = [
  ["S01 forged literal ref (all pads = key)", "binding", (s) => sub(s, "valueRef: ref,", "valueRef: { item: ctx.item, slot: \"key\" },")],
  ["S01e forged ref via Object.fromEntries", "binding", (s) => sub(s, "valueRef: ref,", "valueRef: Object.fromEntries([[\"item\", ctx.item], [\"sl\" + \"ot\", \"k\" + \"ey\"]]),")],
  ["S02e out-of-range distractor ref", "binding", (s) => sub(s, "valueRef: ref,", "valueRef: i === 0 ? Object.fromEntries([[\"item\", ctx.item], [\"sl\" + \"ot\", \"d:\" + 9]]) : ref,")],
  ["S03 never commits", "play", (s) => sub(s, "commit: true,", "commit: false,")],
  ["S04 Math.random in init", "determinism", (s) => sub(s, "return { at: -1, hops: 0, opts: ctx.refs.options() };", "return { at: -1, hops: Math.random(), opts: ctx.refs.options() };")],
  ["S05 28-unit targets", "geometry", (s) => sub(s, "w, h: 72 }", "w: 28, h: 28 }")],
  ["S06 overlapping targets", "geometry", (s) => sub(s, "rect: { x: gap + i * (w + gap), y: 190, w, h: 72 }", "rect: { x: gap + i * 10, y: 190, w, h: 72 }")],
  ["S07 key always first", "leak", (s) => sub(s, "return { at: -1, hops: 0, opts: ctx.refs.options() };", "const o = ctx.refs.options(); const k = o.filter((r) => r.slot === \"key\"); return { at: -1, hops: 0, opts: k.concat(o.filter((r) => r.slot !== \"key\")) };")],
  ["S08 key numeral drawn alone", "leak", (s) => sub(s, "draw.text(\"pond\"", "draw.numeral(m.opts.find((o) => o.slot === \"key\"), 300, 60, { size: 20 }); draw.text(\"pond\"")],
  ["S09 clipped word", "geometry", (s) => sub(s, "draw.text(\"pond\", ctx.W / 2, 130,", "draw.text(\"pond\", 4, 130,")],
  ["S10e Function-constructor beacon", "network", (s) => sub(s, "return { at: -1, hops: 0, opts: ctx.refs.options() };", "const F = [].map[\"constr\" + \"uctor\"]; F(\"fetch('https://example.org/x')\")(); return { at: -1, hops: 0, opts: ctx.refs.options() };")],
  ["S11 throws on item 2", "crash", (s) => sub(s, "draw.rect(0, 0, ctx.W, ctx.H, { fill: \"paper\" });", "if (ctx.itemIndex === 1) { const z = null; z.x = 1; } draw.rect(0, 0, ctx.W, ctx.H, { fill: \"paper\" });")],
  ["S12 unknown string key", "safety", (s) => sub(s, "draw.text(\"pond\"", "draw.text(\"win_now\"")],
  ["S12e unknown string key, computed", "safety", (s) => sub(s, "draw.text(\"pond\"", "draw.text([\"win\", \"now\"].join(\"_\")")],
  ["S13 off-screen target", "geometry", (s) => sub(s, "y: 190, w, h: 72 }", "y: 360, w, h: 72 }")],
  ["S14 key target dropped", "play", (s) => sub(s, "return m.opts.map((ref, i) => ({", "return m.opts.filter((r) => r.slot !== \"key\").map((ref, i) => ({")],
  ["S15 points machine", "fun-ban", (s) => sub(s, "return { at: m.at, hops: m.hops };", "const score = m.hops * 10; return { at: m.at, hops: score };")],
  ["S17 key glows (reads .slot)", "leak", (s) => sub(s, "draw.circle(fx, fy, 18", "m.opts.forEach((o, i) => { if (o.slot === \"key\") draw.circle(gap + i * (w + gap) + w / 2, 176, 9, { fill: \"sun\" }); }); draw.circle(fx, fy, 18")],
  ["S17e key glows (computed slot read)", "leak", (s) => sub(s, "draw.circle(fx, fy, 18", "const sk = \"sl\"; m.opts.forEach((o, i) => { if (o[sk + \"ot\"] === \"key\") draw.circle(gap + i * (w + gap) + w / 2, 176, 9, { fill: \"sun\" }); }); draw.circle(fx, fy, 18")],
  ["S18e key styled via fx glow after any tap", "leak", (s) => sub(s, "fx: [{ kind: \"pop\", target: \"stone\" + i }]", "fx: m.opts.map((o, j) => (o[\"s\" + \"lot\"] === \"key\" ? { kind: \"glow\", target: \"stone\" + j } : null)).filter(Boolean)")],
  ["S19e Array.prototype.some patched via computed __proto__", "realm", (s) => sub(s, "return { at: -1, hops: 0, opts: ctx.refs.options() };", "const pr = \"__pro\"; const P = [][pr + \"to__\"]; P.some = function () { return true; }; return { at: -1, hops: 0, opts: ctx.refs.options() };")],
  ["S20e Object alias defineProperty on String.prototype", "realm", (s) => sub(s, "return { at: -1, hops: 0, opts: ctx.refs.options() };", "const O = Object, dp = \"define\"; O[dp + \"Property\"](\"\"[\"__pro\" + pr2()], \"trim\", { value: function () { return \"key\"; } }); function pr2() { return \"to__\"; } return { at: -1, hops: 0, opts: ctx.refs.options() };")],
  ["S16 80 ms busy loop in render", "perf", (s) => sub(s, "draw.rect(0, 0, ctx.W, ctx.H, { fill: \"paper\" });", "let z = 0; for (let i = 0; i < 6e7; i++) z += i % 7; draw.rect(0, 0, ctx.W, ctx.H, { fill: z > 0 ? \"paper\" : \"ink\" });")],
];
const BUILD = [
  ["T01 facts lie (+1)", "binding", (s) => sub(s, "m.n.forEach((c, k) => { f[\"n_\" + k] = c; });", "m.n.forEach((c, k) => { f[\"n_\" + k] = c + (k === 0 && c > 0 ? 1 : 0); });")],
  ["T02 remove hits the wrong kind", "binding", (s) => sub(s, "if (n[k] === 0) return { reject: \"no_effect\" }; n[k] -= 1;", "if (n[0] === 0) return { reject: \"no_effect\" }; n[0] -= 1;")],
  ["T03 remove at 0 accepted", "binding", (s) => sub(s, "if (n[k] === 0) return { reject: \"no_effect\" }; n[k] -= 1;", "n[k] = n[k] - 1;")],
  ["T04 clear keeps counts", "binding", (s) => sub(s, "return { model: { n: m.n.map(() => 0), units: m.units } };", "return { model: m };")],
  ["T05 no confirm control", "play", (s) => sub(s, "out.push({ id: \"check\", kind: \"control\", control: \"confirm\", action: \"check\", rect: { x: 194, y: 324, w: 150, h: 60 } });", "")],
  ["T06 confirm does not commit", "play", (s) => sub(s, "if (action.control === \"confirm\") return { model: m, commit: true };", "if (action.control === \"confirm\") return { model: m };")],
  ["T07 add counts double", "binding", (s) => sub(s, "n[k] += 1; }", "n[k] += 2; }")],
];

const topics = [["c1-maths-ch04-t01", "choice"], ["c1-maths-ch04-t01", "build"], ["c6-maths-ch07-t05", "choice"]];
const browser = await launchBrowser();
const rows = [];
async function gate(src, design, topicId, arch, seed, kitJs) {
  const b = briefFor(topicId, { archetype: arch });
  const bundle = buildBundle(src, design, kitJs ? { kitJs } : {});
  const st = staticGate({ mechanicSrc: src, design, bundle });
  const br = await browserGate({ html: bundle.html, levels: b.levels.all, topicId, ageBand: b.brief.ageBand, browser, seed });
  const failed = [...st.gates, ...br.gates].filter((g) => g.status !== "pass");
  return { staticCaught: st.gates.some((g) => g.status !== "pass"), browserCaught: br.gates.some((g) => g.status !== "pass"), failed: failed.map((g) => g.id) };
}
for (const [topicId, arch] of topics) {
  const golden = arch === "build" ? T : S, design = D[arch === "build" ? "tower-build@1" : "stepping-stones@1"];
  for (const seed of [7, 101]) {
    const r = await gate(golden, design, topicId, arch, seed);
    rows.push({ kind: "clean", name: `golden ${design.id}`, topicId, seed, ...r });
    console.log(`clean ${design.id} ${topicId} s${seed}: ${r.failed.length ? "FALSE ALARM " + r.failed.join(",") : "pass"}`);
  }
  for (const [name, cls, fn] of arch === "build" ? BUILD : CHOICE) {
    const r = await gate(fn(golden), design, topicId, arch, 7);
    let outcome = r.failed.length ? "caught" : "MISSED", leaky = null;
    if (cls === "leak") {
      leaky = await gate(fn(golden), design, topicId, arch, 7, LEAKY_KIT);
      if (!r.failed.length && leaky.browserCaught) outcome = "inert";
    }
    rows.push({ kind: "mutant", name, cls, topicId, outcome, ...r, leakyKit: leaky && { browserCaught: leaky.browserCaught, failed: leaky.failed } });
    console.log(`${name.padEnd(52)} ${topicId}: ${outcome}${r.failed.length ? " " + r.failed.join(",") : ""}${leaky ? `  [leaky kit: ${leaky.browserCaught ? "browser caught " + leaky.failed.filter((f) => !f.startsWith("Q1")).join(",") : "browser MISSED"}]` : ""}`);
  }
}
await browser.close();
const mut = rows.filter((r) => r.kind === "mutant"), clean = rows.filter((r) => r.kind === "clean");
const caught = mut.filter((r) => r.outcome === "caught"), inert = mut.filter((r) => r.outcome === "inert");
const leakRows = mut.filter((r) => r.leakyKit);
const summary = { date: new Date().toISOString(), kit: "tgk-lite@2", mutants: mut.length, caught: caught.length, inert: inert.length,
  recall: +((caught.length + inert.length) / mut.length).toFixed(3), runtimeCaught: mut.filter((r) => r.browserCaught).length,
  staticOnly: mut.filter((r) => r.staticCaught && !r.browserCaught).length,
  leakyKitBrowserCaught: `${leakRows.filter((r) => r.leakyKit.browserCaught).length}/${leakRows.length}`,
  clean: clean.length, falseAlarms: clean.filter((r) => r.failed.length).length, missed: mut.filter((r) => r.outcome === "MISSED").map((r) => `${r.name} @${r.topicId}`), rows };
mkdirSync(`${ROOT}server/forge/g2/measurements`, { recursive: true });
const file = `server/forge/g2/measurements/mutants-${summary.date.slice(0, 10)}.json`;
writeFileSync(ROOT + file, JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, rows: undefined }, null, 1));
