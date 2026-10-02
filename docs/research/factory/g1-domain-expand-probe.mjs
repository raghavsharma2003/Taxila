// g1-domain-expand-probe.mjs — GAP-F2-g1-domain-and-expansion (2026-10-02)
// Prototype of the FACTORY.md §4.8a contract: TestedDomain over kit generator knobs, inDomain(), server-side
// expand(fill, seed) -> {specs incl. variants, GradeTable, hash}, the out-of-domain failure path, and the MP5 exit test.
// Real kit items from data/kits; MiscRules simplified to the fraction rules MP2 names; the mechanic's paramsSchema is a
// hand-written stand-in for an agent-written zod schema (it is NOT called by the gate, only "in frame" at the end).
// Run: node docs/research/factory/g1-domain-expand-probe.mjs  -> writes g1-domain-expand-probe-2026-10-02.json
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)); const ROOT = path.resolve(HERE, "../../..");

// ---------- KitMath (exact rationals, the subset needed) ----------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const lcm = (a, b) => a / gcd(a, b) * b;
const R = (n, d) => { const g = gcd(n, d); return { n: n / g, d: d / g }; };
const add = (x, y) => R(x.n * y.d + y.n * x.d, x.d * y.d), sub = (x, y) => R(x.n * y.d - y.n * x.d, x.d * y.d);
const cmp = (x, y) => x.n * y.d - y.n * x.d, eq = (x, y) => cmp(x, y) === 0, str = x => x.d === 1 ? `${x.n}` : `${x.n}/${x.d}`;
const val = x => x.n / x.d;

// ---------- kit: six fraction topics (MP2) ----------
const TOPICS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch07-t03", "c6-maths-ch07-t05"];
const kitTopics = {}; const kitItems = {};
for (const f of fs.readdirSync(path.join(ROOT, "data/kits")).filter(f => /^c[4-7]-maths\.json$/.test(f))) {
  for (const t of JSON.parse(fs.readFileSync(path.join(ROOT, "data/kits", f), "utf8")).topics) {
    kitTopics[t.topicId] = t; for (const i of t.items) kitItems[i.id] = { ...i, topicId: t.topicId };
  }
}
const FR = /(\d+)\s*\/\s*(\d+)/g;
// item -> line task {op, operands, key} (KitMath-recomputable) or null (not renderable on a number line)
function lineTask(item) {
  const p = item.prompt_en.replace(/−/g, "-");
  let m;
  if ((m = p.match(/(\d+)\/(\d+)\s*([+-])\s*(\d+)\/(\d+)/))) {
    const a = R(+m[1], +m[2]), b = R(+m[4], +m[5]); const key = m[3] === "+" ? add(a, b) : sub(a, b);
    return key.n < 0 ? null : { op: m[3] === "+" ? "add" : "sub", operands: [a, b], key, raw: [[+m[1], +m[2]], [+m[4], +m[5]]] };
  }
  if ((m = p.match(/(\d+)\/(\d+)\s*=\s*\?\s*\/\s*(\d+)/))) { const a = R(+m[1], +m[2]); return { op: "equiv", operands: [a], key: a, target: +m[3], raw: [[+m[1], +m[2]]] }; }
  if ((m = p.match(/(\d+)\/(\d+)\s*=\s*(\d+)\/\?/))) { const a = R(+m[1], +m[2]); return { op: "equiv", operands: [a], key: a, target: +m[3] / a.n * a.d, raw: [[+m[1], +m[2]]] }; }
  if ((m = p.match(/[Rr]educe (\d+)\/(\d+)/))) { const a = { n: +m[1], d: +m[2] }; return { op: "equiv", operands: [a], key: R(a.n, a.d), target: R(a.n, a.d).d, raw: [[a.n, a.d]] }; }
  const fr = [...p.matchAll(FR)].map(x => ({ n: +x[1], d: +x[2] }));
  if (fr.length === 2 && /bigger|more|smaller|less/i.test(p)) {
    const [a, b] = fr.map(x => R(x.n, x.d)); const big = /smaller|less/i.test(p) ? (cmp(a, b) < 0 ? a : b) : (cmp(a, b) > 0 ? a : b);
    return { op: "compare", operands: [a, b], key: big, raw: fr.map(x => [x.n, x.d]) };
  }
  const ans = [...String(item.answer).matchAll(FR)].map(x => R(+x[1], +x[2]));
  if (ans.length >= 1 && /line|mark|jump|gap|split|cut into/i.test(p)) return { op: "place", operands: [], key: ans[0], raw: [] };
  return null;
}

// ---------- MiscRules (kit-owned; predicts(itemParams) -> MathValue[]) ----------
function miscPredictions(task, topicId) {
  const out = []; const [a, b] = task.raw.map(([n, d]) => ({ n, d }));
  const push = (misc, v) => { if (v && v.d > 0 && v.n >= 0) out.push({ value: R(v.n, v.d), misc }); };
  if (task.op === "add" || task.op === "sub") {
    const s = task.op === "add" ? 1 : -1;
    if (a.d !== b.d) push(`${topicId}-m-add-across`, { n: a.n + s * b.n, d: a.d + s * b.d });
    if (a.d !== b.d) push(`${topicId}-m-change-only-den`, { n: a.n + s * b.n, d: lcm(a.d, b.d) });
    if (a.d === b.d) push(`${topicId}-m-add-across`, { n: a.n + s * b.n, d: a.d + s * b.d });
  } else if (task.op === "compare") {
    const other = eq(task.key, R(a.n, a.d)) ? R(b.n, b.d) : R(a.n, a.d); push(`${topicId}-m-bigger-denominator`, other);
  } else if (task.op === "equiv") {
    const t = task.target || a.d * 2; push(`${topicId}-m-add-same`, { n: a.n + (t - a.d), d: t }); push(`${topicId}-m-one-side`, { n: a.n, d: t });
  } else if (task.op === "place") {
    push(`${topicId}-m-count-marks`, { n: task.key.n, d: task.key.d + 1 }); push(`${topicId}-m-whole-number-bias`, { n: 1, d: task.key.n + task.key.d });
  }
  return out.filter((x, i, arr) => !eq(x.value, task.key) && arr.findIndex(y => eq(y.value, x.value)) === i);
}

// ---------- generator knobs (kit-owned): the ONLY coordinates of TestedDomain ----------
// level scope: op, stage, padCount, itemsPerLevel. item scope: den (largest operand/key den), tickDen (lcm of every
// denominator drawn on that line: operands, key, pads), lineMax (ceil of the largest drawn value), tickCount (derived:
// lineMax*tickDen — the coupling knob; see the A/B below).
function itemKnobs(task, pads) {
  const dens = [...task.operands.map(x => x.d), task.key.d, ...pads.map(p => p.d)];
  const tickDen = dens.reduce(lcm, 1);
  const lineMax = Math.max(1, ...[task.key, ...task.operands, ...pads].map(x => Math.ceil(val(x) - 1e-9)));
  return { den: Math.max(...task.operands.map(x => x.d), task.key.d), tickDen, lineMax, tickCount: lineMax * tickDen, padCount: pads.length + 1 };
}
// mechanic-declared support (MechanicDesign.levelPlan knob bounds; JSON, kit-visible). S8 samples inside this.
const DECLARED = { den: [2, 12], tickDen: [2, 24], lineMax: [1, 3], tickCount: [2, 30], padCount: [3, 5], itemsPerLevel: [2, 5] };
const within = (k, v) => v >= DECLARED[k][0] && v <= DECLARED[k][1];

// generated item at difficulty d (KT target): numbers chosen by the generator inside a domain
function genTask(op, d, rng, dom) {
  const denMax = Math.min(dom.den.max, [4, 6, 8, 10, 12, 16, 20][Math.min(6, Math.max(0, d - 1))]);
  for (let tries = 0; tries < 200; tries++) {
    const d1 = 2 + Math.floor(rng() * (denMax - 1)), d2 = op === "add" || op === "sub" ? (d <= 1 ? d1 : 2 + Math.floor(rng() * (denMax - 1))) : d1;
    const n1 = 1 + Math.floor(rng() * (d1 - 1 || 1)), n2 = 1 + Math.floor(rng() * (d2 - 1 || 1));
    let task;
    const a = R(n1, d1), b = R(n2, d2);
    if (op === "add") task = { op, operands: [a, b], key: add(a, b), raw: [[n1, d1], [n2, d2]] };
    else if (op === "sub") { if (cmp(a, b) <= 0) continue; task = { op, operands: [a, b], key: sub(a, b), raw: [[n1, d1], [n2, d2]] }; }
    else if (op === "compare") { const c = R(n2, d1 + 1 + Math.floor(rng() * 3)); if (eq(a, c)) continue; task = { op, operands: [a, c], key: cmp(a, c) > 0 ? a : c, raw: [[a.n, a.d], [c.n, c.d]] }; }
    else if (op === "equiv") task = { op, operands: [a], key: a, target: a.d * 2, raw: [[a.n, a.d]] };
    else task = { op: "place", operands: [], key: a, raw: [] };
    return { task, clamped: d > 5 };   // caller builds the item and re-draws unless inDomain
  }
  return null;
}

// ---------- TestedDomain + inDomain (pure, kit-owned) ----------
// TestedDomain = {v, generator, knobs: {id: {scope, kind:"int", min, max} | {scope, kind:"enum", values}}}
function inDomain(domain, levelSpec) {
  const chk = (scope, knobs, itemId) => {
    for (const [k, v] of Object.entries(knobs)) {
      const d = domain.knobs[k]; if (!d || d.scope !== scope) continue;
      if (d.kind === "int" ? !(Number.isInteger(v) && v >= d.min && v <= d.max) : !d.values.includes(v)) return { ok: false, knob: k, value: v, ...(itemId ? { itemId } : {}) };
    }
    return null;
  };
  const lv = chk("level", levelSpec.knobs); if (lv) return lv;
  for (const it of levelSpec.items) { const r = chk("item", it.knobs, it.id); if (r) return r; }
  return { ok: true };
}

// ---------- seeded rng ----------
const mulberry = s => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------- expand(fill, seed) — trusted kit code, server side, once ----------
const ROLE_D = { intro: -1, practice: 0, trigger: 0, repair: 0, transfer: 1, challenge: 1 };
const OPS_BY_TOPIC = { "c4-maths-ch05-t01": ["compare", "place"], "c5-maths-ch02-t01": ["place"], "c5-maths-ch02-t02": ["compare"], "c5-maths-ch02-t03": ["equiv"], "c6-maths-ch07-t03": ["equiv"], "c6-maths-ch07-t05": ["add", "sub"] };
function buildItem(id, task, topicId, rng, kitBound) {
  let preds = miscPredictions(task, topicId);
  // near distractors to reach padCount 3..5 (kit, never agent)
  const near = [R(task.key.n + 1, task.key.d), R(Math.max(0, task.key.n - 1), task.key.d)].filter(v => !eq(v, task.key) && !preds.some(p => eq(p.value, v)));
  const distractors = [...preds, ...near.map(v => ({ value: v, misc: "other" }))].slice(0, 4);
  const pads = distractors.map(x => x.value);
  const knobs = itemKnobs(task, pads);
  const padOrder = [task.key, ...pads].map((v, i) => ({ v, i })).sort(() => rng() - 0.5);
  const keyPad = padOrder.findIndex(p => p.i === 0);
  return {
    item: { id, key: str(task.key), distractors: distractors.map(x => ({ value: str(x.value), misc: x.misc })), knobs, kitBound },
    params: { itemId: id, op: task.op, line: { max: knobs.lineMax, tickDen: knobs.tickDen }, operands: task.operands.map(str),
              pads: padOrder.map((p, j) => ({ id: `p${j}`, v: str(p.v) })) },
    solution: [{ type: "tap", target: `${id}:p${keyPad}` }, { type: "commit", target: id }],
    miscPaths: distractors.filter(x => x.misc !== "other").map(x => ({ misc: x.misc, actions: [{ type: "tap", target: `${id}:p${padOrder.findIndex(p => p.i > 0 && eq(p.v, x.value))}` }] })),
    acceptable: task.op === "equiv" && task.target ? [str(task.key), `${task.key.n * (task.target / task.key.d)}/${task.target}`] : [str(task.key)],
  };
}
function expand(fill, domain, { checkDomain = true } = {}) {
  const rng = mulberry(fill.seed); const topic = kitTopics[fill.objectiveId]; const drops = []; const specs = []; const grade = {};
  const ops = OPS_BY_TOPIC[fill.objectiveId];
  const mkLevel = (L, li, d, role, idBase, itemSrc) => {
    const op = ops[li % ops.length]; const built = [];
    const lvChk = inDomain(domain, { knobs: { op }, items: [] });
    if (!lvChk.ok) { drops.push({ level: idBase, reason: "out_of_tested_domain", knob: lvChk.knob, value: lvChk.value }); return built; }
    for (const src of itemSrc) {
      const it = buildItem(`${idBase}.${src.id}`, src.task, fill.objectiveId, rng, src.kit);
      if (checkDomain) {
        const r = inDomain(domain, { knobs: {}, items: [it.item] });
        if (!r.ok) { drops.push({ itemId: src.id, reason: "out_of_tested_domain", knob: r.knob, value: r.value, replay: !!src.replay }); continue; }
      }
      built.push(it);
    }
    let gen = 0, clamped = false;
    while (built.length < L.itemsPerLevel && gen < 64) {
      const g = genTask(op, d, rng, domain.knobs); gen++;
      if (!g) break; clamped ||= g.clamped;
      const it = buildItem(`${idBase}.g${built.length}`, g.task, fill.objectiveId, rng, false);
      if (inDomain(domain, { knobs: {}, items: [it.item] }).ok) built.push(it);   // generator samples INSIDE the domain
    }
    if (clamped) drops.push({ itemId: null, reason: "kt_target_clamped", knob: "difficulty", value: d });
    return built;
  };
  for (const [li, L] of fill.levels.entries()) {
    const d = Math.max(1, fill.ktTarget + ROLE_D[L.role] + L.knob);
    const src = [...L.errorReplays.map(id => ({ id, replay: true })), ...L.itemIds.map(id => ({ id }))]
      .map(s => { const k = kitItems[s.id]; const task = k && lineTask(k); return task ? { ...s, task, kit: true } : (drops.push({ itemId: s.id, reason: k ? "not_line_renderable" : "unknown_item", replay: !!s.replay }), null); })
      .filter(Boolean);
    const id = `L${li + 1}`;
    const built = mkLevel(L, li, d, L.role, id, src);
    if (built.length < 2) { drops.push({ level: id, reason: "level_underfilled" }); continue; }
    const variants = [];
    for (const rank of [1, 2]) {  // pre-expanded easier variants for the ramp controller (<= 2 inserts)
      const vb = mkLevel({ ...L, itemsPerLevel: Math.min(3, built.length) }, li, Math.max(1, d - rank), L.role, `${id}.v${rank}`, []);
      if (vb.length >= 2) variants.push({ id: `${id}.v${rank}`, rank, difficulty: Math.max(1, d - rank), knobs: { op: ops[li % ops.length], itemsPerLevel: vb.length },
        params: { items: vb.map(x => x.params) }, items: vb.map(x => { const { knobs, kitBound, ...rest } = x.item; return { ...rest, knobs }; }),
        solution: vb.flatMap(x => x.solution), miscPaths: vb.flatMap(x => x.miscPaths), successRule: { itemsCorrect: vb.length - 1, ofItems: vb.length, maxHintsForMastery: 1 } });
      for (const x of vb) grade[x.item.id] = { key: x.item.key, acceptable: x.acceptable, distractors: x.item.distractors };
    }
    for (const x of built) grade[x.item.id] = { key: x.item.key, acceptable: x.acceptable, distractors: x.item.distractors };
    specs.push({ id, role: L.role, objectiveId: fill.objectiveId, stage: ["intro", "practice"].includes(L.role) ? "pictorial" : "abstract", difficulty: d,
      knobs: { op: ops[li % ops.length], itemsPerLevel: built.length },
      params: { items: built.map(x => x.params) }, items: built.map(x => ({ id: x.item.id, key: x.item.key, distractors: x.item.distractors, knobs: x.item.knobs })),
      targetMisc: L.targetMisc ?? undefined, hints: [{ rung: 1, kind: "glow" }, { rung: 2, kind: "cue" }, { rung: 3, kind: "demo", demo: built[0].solution }],
      variants, timing: { mode: "untimed" }, solution: built.flatMap(x => x.solution), miscPaths: built.flatMap(x => x.miscPaths),
      successRule: { itemsCorrect: Math.max(1, built.length - 1), ofItems: built.length, maxHintsForMastery: 1 } });
  }
  // Q0 level rules after drops
  const roles = specs.map(s => s.role); const ok3 = specs.length >= 3;
  const shape = ok3 && ["intro", "practice"].includes(roles[0]) && ["transfer", "challenge"].includes(roles.at(-1)) && specs.some(s => s.stage === "abstract")
    && roles.every((r, i) => r !== "trigger" || roles[i + 1] === "repair");
  const canon = o => JSON.stringify(o, (k, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : 1)) : v);
  const gradeTable = { v: 1, entries: grade }; const gradeHash = crypto.createHash("sha256").update(canon(gradeTable)).digest("hex");
  return { ok: shape, specs, gradeTable, gradeHash, drops, canon };
}

// ---------- stand-in for the agent-written mechanic.paramsSchema (runs only "in frame") ----------
function paramsSchemaParse(p) {   // returns null if ok, else reason
  for (const it of p.items) {
    if (!(it.line.max >= 1 && it.line.max <= 3)) return "line.max";
    if (!(it.line.tickDen >= 2 && it.line.tickDen <= 24)) return "tickDen";
    if (it.line.max * it.line.tickDen > 30) return "ticks>30 (view: 360dp line, ≥ 12dp per tick)";   // author's own limit
    if (!(it.pads.length >= 3 && it.pads.length <= 5)) return "pads.length";
    for (const pd of it.pads) { const [n, d] = pd.v.split("/").map(Number); const v = { n, d: d || 1 };
      if (val(v) > it.line.max || ((v.n * it.line.tickDen) % v.d) !== 0) return "pad off-tick/off-line"; }
  }
  return null;
}

// ---------- fill() (G1, code) ----------
const SIX = ["intro", "practice", "trigger", "repair", "transfer", "challenge"];
function lineable(topicId) { return kitTopics[topicId].items.filter(i => lineTask(i)).map(i => i.id); }
function kitItemInDomain(domain, id, topicId) { const t = lineTask(kitItems[id]); if (!t) return false; const it = buildItem(id, t, topicId, mulberry(1), true); return inDomain(domain, { knobs: {}, items: [it.item] }).ok; }
function fill(topicId, seed, { adversarial = false, domain = null } = {}) {
  // fill() CHOOSES itemIds, so it picks only in-domain kit items; errorReplays are the child's history and are not filtered here
  const rng = mulberry(seed * 7919 + 13); const pool = lineable(topicId).filter(id => !domain || kitItemInDomain(domain, id, topicId)); const allIds = Object.keys(kitItems);
  const nLevels = 3 + Math.floor(rng() * 4); const roles = nLevels === 6 ? SIX : nLevels === 5 ? ["intro", "practice", "trigger", "repair", "transfer"] : nLevels === 4 ? ["practice", "trigger", "repair", "challenge"] : ["practice", "trigger", "repair"].map((r, i) => i === 2 ? "transfer" : r);
  const fixRoles = roles.length === 3 ? ["practice", "practice", "transfer"] : roles;
  const misc = kitTopics[topicId].misconceptions[0].id;
  let replays = Array.from({ length: Math.floor(rng() * 4) }, () => pool[Math.floor(rng() * pool.length)]);
  if (adversarial) {   // real kit ids a child could have got wrong that sit outside the core's domain or op set
    const hostile = ["c6-maths-ch07-t03-i13" /* 24/36 */, "c6-maths-ch07-t03-i02" /* 12/18 */, "c6-maths-ch07-t05-i13" /* 2/5+1/3 */, "c6-maths-ch07-t05-i07" /* 2/3-1/4 */,
      "c5-maths-ch02-t01-i10" /* 3/2 km */, "c7-maths-ch03-t01-i03" /* 36/100 */, "c6-maths-ch07-t02-i11" /* 0..3 thirds */, "c6-maths-ch07-t05-i10" /* mixed */, "c9-nope-i99"];
    replays = [...replays, ...Array.from({ length: 1 + Math.floor(rng() * 4) }, () => hostile[Math.floor(rng() * hostile.length)])];
  }
  const ktTarget = adversarial && rng() < 0.3 ? 6 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 5);
  const levels = fixRoles.map((role, i) => ({ role, knob: 0, targetMisc: role === "trigger" ? misc : null,
    itemIds: Array.from({ length: 1 + Math.floor(rng() * 2) }, () => pool[Math.floor(rng() * pool.length)]),
    errorReplays: ["practice", "trigger", "repair"].includes(role) ? replays.splice(0, 2) : [], itemsPerLevel: role === "intro" ? 3 : 4 }));
  // leftover replays go to the last practice-like level
  if (replays.length) levels.find(l => l.role === "practice" || l.role === "repair").errorReplays.push(...replays);
  return { core: { archetype: "numberline-jump", mechanic: "frac-predict-jump@1" }, objectiveId: topicId, levels, skin: "cricket", pacing: "normal", lang: "hi-Latn+en", numerals: "latn", seed, ktTarget };
}

// ---------- S8: 200 fills, record the knob ranges actually sampled ----------
function s8(withDerived) {
  const decl = Object.fromEntries(Object.entries(DECLARED).map(([k, [min, max]]) => [k, { scope: ["itemsPerLevel"].includes(k) ? "level" : "item", kind: "int", min, max }]));
  
  const seen = {}; const reasons = {}; let failures = 0, specs = 0; decl.op = { scope: "level", kind: "enum", values: ["add", "compare", "equiv", "place", "sub"] };
  for (let s = 0; s < 200; s++) {
    const f = fill(TOPICS[s % 6], 100000 + s);
    // S8 has no TestedDomain yet: it samples inside the mechanic-declared support (generator respects `decl`; kit items
    // outside it are not sampled, exactly as the generator's layout predicates would refuse them)
    const e = expand(f, { knobs: decl });
    for (const sp of e.specs) for (const lv of [sp, ...sp.variants]) {
      specs++; const why = paramsSchemaParse(lv.params); if (why) { failures++; reasons[why] = (reasons[why] || 0) + 1; }
      for (const it of lv.items) for (const [k, v] of Object.entries(it.knobs)) if (decl[k]) (seen[k] ??= new Set()).add(v);
      for (const [k, v] of Object.entries(lv.knobs)) if (decl[k]) (seen[k] ??= new Set()).add(v);
    }
  }
  const knobs = Object.fromEntries(Object.entries(seen).map(([k, s]) => [k, decl[k].kind === "enum" ? { scope: decl[k].scope, kind: "enum", values: [...s].sort() }
    : { scope: decl[k].scope, kind: "int", min: Math.min(...s), max: Math.max(...s) }]));
  if (!withDerived) delete knobs.tickCount;
  return { domain: { v: 1, generator: "nlj-frac-gen@1", mechanic: "frac-predict-jump@1", knobs, sampled: { fills: 200, specs } }, failures, reasons, specs };
}

// ---------- run ----------
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; };
const out = { date: "2026-10-02", note: "prototype; MiscRules simplified; paramsSchema is a stand-in for agent code", arms: {} };
const SA = s8(false), SB = s8(true);
const narrow = { ...SB.domain, knobs: { ...SB.domain.knobs, op: { scope: "level", kind: "enum", values: SB.domain.knobs.op.values.filter(v => v !== "sub") } } };
const ARMS = {
  box_primary_knobs_only: { S: SA, domain: SA.domain, check: true },
  box_with_derived_tickCount: { S: SB, domain: SB.domain, check: true },
  no_inDomain_at_G1: { S: SB, domain: SB.domain, check: false },
  narrow_core_without_sub: { S: SB, domain: narrow, check: true, topics: ["c6-maths-ch07-t05"] },
};
for (const [arm, cfg] of Object.entries(ARMS)) {
  const S = cfg.S;
  const res = { s8: { failures: S.failures, reasons: S.reasons, specs: S.specs, domain: cfg.domain }, mp5: {} };
  let fills = 0, kept = 0, t1 = 0, frameRejects = 0, specsChecked = 0, initBytes = [], gradeBytes = [], ms = [], dropReasons = {}, replayDrops = 0, replaysSeen = 0, six = [], rejectReasons = {}, fillsWithReplayDrop = 0, keptWithReplayDrop = 0;
  for (const topic of cfg.topics || TOPICS) for (let s = 0; s < 200; s++) {
    for (const adversarial of [false, true]) {
      const f = fill(topic, s * 2 + (adversarial ? 1 : 0), { adversarial, domain: cfg.check ? cfg.domain : null }); fills++;
      replaysSeen += f.levels.reduce((a, l) => a + l.errorReplays.length, 0);
      const t0 = process.hrtime.bigint(); const e = expand(f, cfg.domain, { checkDomain: cfg.check }); ms.push(Number(process.hrtime.bigint() - t0) / 1e6);
      let rd = false;
      for (const d of e.drops) { const key = d.reason === "out_of_tested_domain" ? `${d.reason}:${d.level ? "level" : d.replay ? "errorReplay" : "itemId"}:${adversarial ? "adv" : "plain"}` : d.reason; dropReasons[key] = (dropReasons[key] || 0) + 1; if (d.replay && d.reason === "out_of_tested_domain") { replayDrops++; rd = true; } }
      if (rd) fillsWithReplayDrop++;
      if (!e.ok) { t1++; continue; }
      kept++; if (rd) keptWithReplayDrop++;
      const init = { specs: e.specs, skin: f.skin, pacing: f.pacing, lang: f.lang, numerals: f.numerals, seed: f.seed, locale: "hi-Latn", gradeTableHash: e.gradeHash };
      const b = Buffer.byteLength(JSON.stringify(init)); initBytes.push(b); gradeBytes.push(Buffer.byteLength(JSON.stringify(e.gradeTable)));
      if (e.specs.length === 6) six.push(b);
      for (const sp of e.specs) for (const lv of [sp, ...sp.variants]) { specsChecked++; const r = paramsSchemaParse(lv.params); if (r) { frameRejects++; rejectReasons[r] = (rejectReasons[r] || 0) + 1; } }
    }
  }
  res.mp5 = { fills, kept_g1: kept, fell_back_t1: t1, specs_checked_in_frame: specsChecked, in_frame_paramsSchema_rejections: frameRejects, rejectReasons,
    errorReplays_seen: replaysSeen, errorReplays_dropped_out_of_domain: replayDrops, fills_with_replay_drop: fillsWithReplayDrop, kept_with_replay_drop: keptWithReplayDrop, dropReasons,
    init_bytes: initBytes.length ? { p50: pct(initBytes, 50), p95: pct(initBytes, 95), max: Math.max(...initBytes), six_level_p50: pct(six, 50), six_level_max: Math.max(...six), cap: 65536, n6: six.length } : null,
    gradeTable_bytes: gradeBytes.length ? { p50: pct(gradeBytes, 50), max: Math.max(...gradeBytes) } : null,
    expand_ms: { p50: +pct(ms, 50).toFixed(3), p95: +pct(ms, 95).toFixed(3), max: +Math.max(...ms).toFixed(3) } };
  out.arms[arm] = res;
}
// worst case: a 6-level fill, 5 items per level, 2 variants x 3 items, pretty-printed ids (upper bound)
{
  const S = s8(true); const f = fill("c6-maths-ch07-t05", 4242); f.levels = SIX.map(role => ({ role, knob: 0, targetMisc: role === "trigger" ? "c6-maths-ch07-t05-m-add-across" : null, itemIds: ["c6-maths-ch07-t05-i03", "c6-maths-ch07-t05-i01"], errorReplays: ["c6-maths-ch07-t05-i14"], itemsPerLevel: 5 }));
  f.ktTarget = 3; const e = expand(f, S.domain);
  const init = { specs: e.specs, skin: f.skin, pacing: f.pacing, lang: f.lang, numerals: f.numerals, seed: f.seed, locale: "hi-Latn", gradeTableHash: e.gradeHash };
  out.worst_case_6x5_with_2_variants = { levels: e.specs.length, items: e.specs.reduce((a, s) => a + s.items.length + s.variants.reduce((b, v) => b + v.items.length, 0), 0),
    init_bytes: Buffer.byteLength(JSON.stringify(init)), init_bytes_gzip: (await import("node:zlib")).gzipSync(JSON.stringify(init)).length, gradeTable_bytes: Buffer.byteLength(JSON.stringify(e.gradeTable)), cap: 65536 };
  fs.writeFileSync(path.join(HERE, "g1-domain-expand-probe-sample-spec.json"), JSON.stringify(e.specs[2], null, 1));
}
fs.writeFileSync(path.join(HERE, "g1-domain-expand-probe-2026-10-02.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, (k, v) => k === "domain" ? undefined : v, 1));
