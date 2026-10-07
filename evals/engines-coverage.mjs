// engines-v1 coverage and key agreement over the kits (no network, no model). Topic coverage is reported for
// classes 4-7 (the original baseline) and for every kit (c1-c9); item binding, agreement and unbound-mount
// quality run over every kit.
//   1. Topic coverage: share of kit topics whose engineHints resolve to a built engine (shared/engine-catalog.js
//      resolveHint), and with the research topic map as fallback; baseline = what the Director resolved before
//      (engineId(firstHint) is a registered engine: only fraction-bars@1).
//   2. Item binding: for every item of a covered topic, planEngine() → is the item bound (the engine's right
//      answer, derived from params alone, equals the verified kit key)?
//   3. Agreement: every bound plan is replayed through the FRAME's own pure logic (src/modules/frame/engines/
//      *.logic.ts) as the CHILD-SIDE action the view grades (the typed product, the typed numeral, the tapped
//      tick …): the verdict on the kit key must be "correct", and on a perturbed key "incorrect". Engine
//      constructs that do not need the answer (an array of the prompt's a×b, dealing one each) replay false.
//   4. Unbound mounts: for every unbound plan of a maths engine, does the item change what the engine shows?
//      normalize(params) vs normalize(params without the item's numbers/fractions); identical = demo defaults.
// Usage: node evals/engines-coverage.mjs [--out evals/results/engines-v1-coverage-<date>.json]
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { ENGINES, planEngine, resolveHint } from "../shared/engine-catalog.js";
import { engineId, planModule } from "../server/director/modules.js";
import * as FB from "../src/modules/frame/engines/fractionBars.logic.ts";
import * as FR from "../src/modules/frame/engines/fractions.logic.ts";
import * as NL from "../src/modules/frame/engines/numberLine.logic.ts";
import * as PV from "../src/modules/frame/engines/placeValue.logic.ts";
import * as MD from "../src/modules/frame/engines/multiplyDivide.logic.ts";
import * as PT from "../src/modules/frame/engines/patterns.logic.ts";
import * as GEO from "../src/modules/frame/engines/geoboard.logic.ts";
import * as MS from "../src/modules/frame/engines/measure.logic.ts";
import * as DG from "../src/modules/frame/engines/dataGraphs.logic.ts";
import { parseQ, qEq } from "../src/modules/frame/kit/math.ts";

const root = new URL("..", import.meta.url).pathname;
const topicMap = JSON.parse(readFileSync(root + "shared/engine-topic-map.json", "utf8"));
const BEFORE = new Set(["fraction-bars@1"]); // the frame registry before this workstream

/** The frame's verdict for `value` (the child's committed answer) on plan.params; null = no replay rule. */
export function frameVerdict(engine, params, value) {
  const v = String(value);
  switch (engine) {
    case "fraction-bars@1": {
      const c = FB.normalizeConfig(params);
      if (c.mode === "compare") {
        const fr = c.denominators.map((d, i) => ({ n: c.numerators[i], d }));
        const k = parseQ(v);
        const idx = fr.findIndex((f) => k && qEq({ n: f.n, d: f.d }, k));
        return idx >= 0 && FB.compareCorrect(fr, c.question, idx);
      }
      const k = parseQ(v);
      if (!k || !c.target) return false;
      const parts = c.denominators[c.targetBar];
      const n = (k.n * parts) / k.d;
      if (!Number.isInteger(n) || n > parts) return false;
      const sh = c.denominators.map((d, i) => Array.from({ length: d }, (_, j) => (i === c.targetBar ? j < n : false)));
      return FB.goalReached(c, sh);
    }
    case "fractions@1": {
      const c = FR.normalize(params);
      // round 2 content: name: the child builds the key as top / bottom
      if (c.mode === "name") { const kq = parseQ(v); return !!kq && FR.nameCorrect(c, kq.n, kq.d); }
      const k = parseQ(v);
      if (!k) return false;
      if (c.mode === "compare") {
        const idx = c.fractions.findIndex((f) => qEq(f, k));
        return idx >= 0 && FR.compareCorrect(c.fractions, c.question, String(idx));
      }
      // round 2 content: name: the child builds the key as top / bottom; of: the child gives the key as a whole number
      if (c.mode === "of") return /^\d+$/.test(String(v).trim()) && FR.ofCorrect(c, Number(v));
      // equivalent with a fixed second shape ("1/3 = ?/6"): the key is how many of its parts are shaded
      if (c.mode === "equivalent" && c.parts > 0) return Number.isInteger(Number(v)) && FR.equivalentCorrect(c.target, Number(v), c.parts);
      const parts = c.parts;
      const n = (k.n * parts) / k.d;
      if (!Number.isInteger(n)) return false;
      return c.mode === "add" ? FR.addCorrect(c, n, parts) : FR.makeCorrect(c, n, parts);
    }
    case "number-line@1": {
      const c = NL.normalize(params);
      const k = parseQ(v);
      const at = k ? NL.indexOf(c, k) : null;
      return at !== null && NL.placeCorrect(c, at);
    }
    case "place-value@1": {
      const c = PV.normalize(params);
      if (c.mode === "compare") return PV.compareCorrect(c, Number(v) === c.a ? "a" : Number(v) === c.b ? "b" : "none");
      // build: only from a number NAME (the child translates words to pieces); read: the child types the numeral
      if (c.mode === "build") return !!c.name && PV.buildCorrect(c, PV.digitsOf(Number(v), c.places));
      return PV.readCorrect(c, v);
    }
    case "multiply-divide@1": {
      const c = MD.normalize(params);
      if (c.mode === "array") {
        // The child-side action the view grades: with ask "product" the child TYPES the total and only that number
        // is judged. A dimensions-only array check grades copying the prompt's two numbers, so it never replays right.
        if (c.ask !== "product") return false;
        return MD.productCorrect(c, v);
      }
      // share: dealing "one each" until the pile runs out always reaches the fair share; no child action
      // distinguishes knowing from tapping, so a bound share plan never replays right.
      if (c.mode === "share") return false;
      const found = new Set(MD.factorPairs(Number(c.n)).map(([r, q]) => MD.pairKey(r, q)));
      const given = v.split(/[^0-9]+/).filter(Boolean).map(Number);
      const pairs = new Set(given.filter((d) => c.n % d === 0).map((d) => MD.pairKey(d, c.n / d)));
      return MD.factorsCorrect(c.n, pairs) && found.size === pairs.size;
    }
    case "patterns@1": {
      // the kit keys the last asked term; the blanks before it are the rule's own (the child fills them too)
      const c = PT.normalize(params);
      const entries = Array.from({ length: c.blanks }, (_, i) => (i === c.blanks - 1 ? v : String(PT.growAt(c, i))));
      return PT.growCorrect(c, entries);
    }
    case "data-graphs@1": {
      const c = DG.normalize(params);
      // most / least: the child taps a bar (its index); the kit key is that bar's label ("July (250 mm)")
      if (c.question === "most" || c.question === "least") {
        const lead = String(v).trim().match(/^[A-Za-z]+/)?.[0]?.toLowerCase();
        const idx = c.cats.findIndex((x) => x.label.toLowerCase() === lead);
        return idx >= 0 && DG.readCorrect(c, String(idx));
      }
      return DG.readCorrect(c, v);
    }
    case "geoboard@1": {
      const young = Number(String(params.topicId ?? "").match(/^c(\d+)/)?.[1] ?? 6) <= 4;
      const c = GEO.normalize(params, young ? 64 : 48);
      return GEO.measureCorrect(c, v);
    }
    case "measure@1": {
      const c = MS.normalize(params);
      return MS.readCorrect(c, Number(v));
    }
    default:
      return null;
  }
}
/** A wrong value near the key, for the negative replay. */
function perturb(key) {
  const k = String(key);
  if (/^[A-Za-z]/.test(k)) return `not ${k}`;   // a label key (a bar graph's most / least): another word leads
  const f = k.match(/^(\d+)\/(\d+)$/);
  if (f) return `${Number(f[1]) + 1}/${f[2]}`;
  const n = Number(k.split(",")[0]);
  return Number.isFinite(n) ? String(n + 1) : `${k}x`;
}
const parseKey = (a) => String(a ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "").replace(/\s*(cm|m|km|mm|kg|g|ml|l|sq\.? ?(cm|m|units?)|square (cm|m|units?)|units?|°c)\.?$/i, "").replace(/,(?=\d{2,3}\b)/g, "");

const LOGIC = { "fractions@1": (p) => FR.normalize(p), "number-line@1": (p) => NL.normalize(p), "place-value@1": (p) => PV.normalize(p), "multiply-divide@1": (p) => MD.normalize(p),
  "patterns@1": (p) => PT.normalize(p), "geoboard@1": (p) => GEO.normalize(p, 48), "measure@1": (p) => MS.normalize(p), "data-graphs@1": (p) => DG.normalize(p), "fraction-bars@1": (p) => FB.normalizeConfig(p) };
const stable = (c) => JSON.stringify(c, (k, x) => (k === "issues" ? undefined : x instanceof Set ? [...x].sort() : x));

export function run({ classes = /^c[1-9]-/ } = {}) {
  const files = readdirSync(root + "data/kits").filter((f) => classes.test(f) && f.endsWith(".json")).sort();
  const topics = [];
  const items = { total: 0, inCovered: 0, bound: 0, agree: 0, disagree: [], negOk: 0, noReplay: 0, byEngine: {} };
  const unbound = { mounted: 0, notMounted: 0, adapted: 0, maths: 0, itemDerived: 0, demoDefault: 0, demoByEngine: {}, examples: [] };
  const gapHints = {};
  for (const f of files) {
    const kitFile = JSON.parse(readFileSync(root + "data/kits/" + f, "utf8"));
    for (const kit of kitFile.topics) {
      const hints = kit.formats?.engineHints ?? [];
      const resolved = hints.map(resolveHint).filter(Boolean);
      const viaTopic = topicMap[kit.topicId] ?? null;
      const before = hints.length > 0 && BEFORE.has(engineId(hints[0]));
      for (const h of hints) if (!resolveHint(h)) gapHints[h] = (gapHints[h] ?? 0) + 1;
      // What the LIVE Director mounts (server/director/modules.js planModule, W1-B #1): an explain move with no item, and
      // an item-bound mount on any practice item. Every mount is a registered engine (tests/director-mounts.test.mjs).
      const st = { module: null, turn: 1, ctx: { sessionId: null, lang: "english", classLevel: kitFile.class } };
      const shows = planModule(st, { kit, item: null, move: { kind: "explain" }, lang: "english", band: "B3" }).some((c) => c.op === "mount" && ENGINES[c.engine]);
      const boundMount = (kit.items ?? []).some((it) => { st.module = null; st.turn++; return planModule(st, { kit, item: it, move: { kind: "practice" }, lang: "english", band: "B3" }).some((c) => c.op === "mount" && c.params?.itemId === it.id); });
      const anyMount = shows || boundMount || (kit.items ?? []).some((it) => ["explain", "practice"].some((kind) => { st.module = null; st.turn++; return planModule(st, { kit, item: it, move: { kind }, lang: "english", band: "B3" }).some((c) => c.op === "mount" && ENGINES[c.engine]); }));
      const row = { topicId: kit.topicId, class: kitFile.class, subject: kitFile.subject, hint: resolved.length > 0, topic: !!viaTopic, before, engine: resolved[0]?.engine ?? viaTopic, director: anyMount, directorExplain: shows, directorBound: boundMount };
      topics.push(row);
      for (const item of kit.items ?? []) {
        items.total++;
        if (!row.engine) continue;
        items.inCovered++;
        const plan = planEngine({ kit, item, lang: "english", mode: "show", topicMap });
        if (!plan) { unbound.notMounted++; continue; }
        if (!plan.bindItem) {
          unbound.mounted++;
          const norm = LOGIC[plan.engine];
          const fallback = /^no item/.test(plan.why); // an adapter's unbound plan is built from the item by construction
          if (!fallback) unbound.adapted++;
          if (norm && fallback) {
            unbound.maths++;
            const { numbers, fractions, denominators, ...bare } = plan.params;
            const derived = stable(norm(plan.params)) !== stable(norm(bare));
            if (derived) unbound.itemDerived++;
            else {
              unbound.demoDefault++;
              unbound.demoByEngine[plan.engine] = (unbound.demoByEngine[plan.engine] ?? 0) + 1;
              if (unbound.examples.length < 8) unbound.examples.push({ itemId: item.id, engine: plan.engine, prompt: String(item.prompt_en).slice(0, 80) });
            }
          }
        }
        const e = (items.byEngine[plan.engine] ??= { items: 0, bound: 0 });
        e.items++;
        if (!plan.bindItem) continue;
        items.bound++;
        e.bound++;
        // round 2 content: a fraction-naming key may be written in words around its fraction ("One quarter, 1/4"): the
        // child's action is that fraction (the adapter binds only when the key states exactly one)
        const key0 = parseKey(item.answer);
        const key = plan.engine === "fractions@1" && plan.params?.mode === "name" ? (String(key0).match(/\d+\s*\/\s*\d+/)?.[0].replace(/\s+/g, "") ?? key0) : key0;
        const yes = frameVerdict(plan.engine, plan.params, key);
        if (yes === null) { items.noReplay++; continue; }
        if (yes) items.agree++;
        else items.disagree.push({ itemId: item.id, engine: plan.engine, params: plan.params, answer: item.answer });
        if (frameVerdict(plan.engine, plan.params, perturb(key)) === false) items.negOk++;
      }
    }
  }
  const agg = (rows, pred) => ({ n: rows.length, covered: rows.filter(pred).length, share: rows.length ? Math.round((1000 * rows.filter(pred).length) / rows.length) / 10 : 0 });
  const bySub = (pred) => Object.fromEntries([...new Set(topics.map((t) => t.subject))].sort().map((s) => [s, agg(topics.filter((t) => t.subject === s), pred)]));
  const byClass = (pred) => Object.fromEntries([...new Set(topics.map((t) => t.class))].sort((a, b) => a - b).map((c) => [`c${c}`, agg(topics.filter((t) => t.class === c), pred)]));
  const ms = (t) => ["maths", "science", "evs"].includes(t.subject);
  const result = {
    at: new Date().toISOString(),
    method: "static: shared/engine-catalog.js resolveHint/planEngine over data/kits; bound plans replayed as the child-side action through the frame's *.logic.ts",
    scope: String(classes),
    engines: Object.keys(ENGINES),
    topics: {
      all: { before: agg(topics, (t) => t.before), hint: agg(topics, (t) => t.hint), hintOrTopicMap: agg(topics, (t) => t.hint || t.topic), director: agg(topics, (t) => t.director), directorExplain: agg(topics, (t) => t.directorExplain), directorBound: agg(topics, (t) => t.directorBound) },
      mathsScienceEvs: { before: agg(topics.filter(ms), (t) => t.before), hint: agg(topics.filter(ms), (t) => t.hint), hintOrTopicMap: agg(topics.filter(ms), (t) => t.hint || t.topic) },
      bySubject: { hint: bySub((t) => t.hint), hintOrTopicMap: bySub((t) => t.hint || t.topic), director: bySub((t) => t.director), directorBound: bySub((t) => t.directorBound) },
      byClass: { hint: byClass((t) => t.hint), hintOrTopicMap: byClass((t) => t.hint || t.topic) },
      byEngine: Object.fromEntries(Object.entries(topics.reduce((a, t) => (t.engine ? ((a[t.engine] = (a[t.engine] ?? 0) + 1), a) : a), {})).sort((a, b) => b[1] - a[1])),
    },
    items: { ...items, disagree: items.disagree.slice(0, 20), disagreeCount: items.disagree.length },
    unbound,
    topUnresolvedHints: Object.entries(gapHints).sort((a, b) => b[1] - a[1]).slice(0, 25),
  };
  return result;
}

if (process.argv[1]?.endsWith("engines-coverage.mjs")) {
  const r = { c4to7: run({ classes: /^c[4-7]-/ }), all: run() };
  const i = process.argv.indexOf("--out");
  if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(r, null, 1) + "\n");
  for (const [k, x] of Object.entries(r)) console.log(k, JSON.stringify({ topics: x.topics.all, mse: x.topics.mathsScienceEvs, bySubject: x.topics.bySubject.hint, director: x.topics.bySubject.director, directorBound: x.topics.bySubject.directorBound, items: { ...x.items, disagree: x.items.disagree.slice(0, 5) }, unbound: x.unbound }, null, 1));
  // The W1-B acceptance gate (BUILD-PLAN §3 W1-B), c4-c7. The gated metric is hint coverage (a topic whose kit hints
  // resolve to a catalog engine), as the plan wrote it; what the live Director mounts is printed beside it and is NOT
  // gated (decision w1b-coverage-gate-metric, with its reversal condition). Exits 1 below any threshold.
  const GATE = { maths: 105, science: 21, evs: 6 };
  const hint = r.c4to7.topics.bySubject.hint, dir = r.c4to7.topics.bySubject.director;
  let failed = false;
  for (const [s, min] of Object.entries(GATE)) {
    const got = hint[s]?.covered ?? 0;
    const pass = got >= min;
    failed ||= !pass;
    console.log(`${pass ? "PASS" : "FAIL"} c4-c7 ${s}: hint coverage ${got}/${hint[s]?.n ?? 0} (gate >= ${min}); Director mounts ${dir[s]?.covered ?? 0}/${dir[s]?.n ?? 0} (reported, not gated)`);
  }
  if (r.c4to7.items.disagreeCount > 0) { failed = true; console.log(`FAIL bound items disagreeing with the frame's own logic: ${r.c4to7.items.disagreeCount}`); }
  if (failed) process.exitCode = 1;
}
