// dc-r7-script-walk-v6-11 C1 step 1 (main's ruling on docs/design/round7/brain/COMPILE.md): responses compiled, not chosen.
// compileScript(script, plan) → { order, parts, cells, holes, doubles }. Pure; nothing in the walk reads it yet (step 2 is shadow mode).
//
// A response is `cells[partId][column][help]`: { say: [AuthoredRef…], then, help, key?, joint? } where an AuthoredRef is a path into
// the script ("skills[0].explain[1].simpler"), never code text. The only words that are not authored are the script's joints and the
// neutral frames F1 keeps (CODE-SENTENCES.md), named by `joint`. The type table (TYPE_TABLE) is ONE function of (part kind, column,
// help) shared by every script: 9 × 12 × 3 = 324 cells, of which the answer columns apply to the card kinds only.
//
// A hole is a rule naming a field this script's part does not have (or has without the language form the column needs). Holes are
// listed for Learning to author; code never fills one with its own sentence. A double is two parts that one cell cannot tell apart
// (two remediations for one mix-up, two parts with one id).

import { createHash } from "node:crypto";

/** The part kinds of a unit (COMPILE.md "Parts"). */
export const PART_KINDS = Object.freeze(["point", "checkin", "card", "worked_step", "your_step", "remediation", "then_card", "check", "bridge"]);
/** What the child can do on a part: 9 requests, then 3 answer columns (cards only). */
export const REQUESTS = Object.freeze(["clarify", "hindi", "repeat", "picture", "try_first", "give_up", "move_on", "aside", "silence"]);
export const ANSWERS = Object.freeze(["right", "wrong", "misconception"]);
export const COLUMNS = Object.freeze([...REQUESTS, ...ANSWERS]);
/** Help is three values and nothing else (main's condition): fresh, heard (a request re-said the help, T2.5), spent (a miss used it). */
export const HELP = Object.freeze(["fresh", "heard", "spent"]);
const CARDS = new Set(["card", "your_step", "then_card", "check"]);

/**
 * The type table: (kind, column, help) → rule. A rule is { say: [field…], then, help, key?, joint?, remedy?, view? } with fields
 * relative to the part ("simpler", "prompt", "why", "key", "steps[n].simpler" for a worked step's own step), or null where the
 * column does not apply. `lang: "hi"` asks for the Hindi form of each field it says. Written once; the comments say which v6.x
 * table row each line keeps.
 */
export function rule(kind, column, help) {
  const card = CARDS.has(kind);
  if (ANSWERS.includes(column) && !card) return null;
  switch (column) {
    // T1.1–T1.5, T2.1: the live part re-said in other authored words; with nothing left, the key and its why. Never spends help.
    case "clarify":
      if (kind === "point") return help === "fresh" ? { say: ["simpler"], then: "checkin", help: "heard" } : { say: ["alts[0]"], then: "checkin", help: "heard" };
      if (kind === "checkin") return help === "fresh" ? { say: ["@point.simpler"], then: "checkin", help: "heard" } : { say: ["@point.alts[0]"], then: "card", help: "heard" };
      if (kind === "worked_step") return { say: [help === "fresh" ? "simpler" : "alts[0]"], then: "checkin", help: "heard" };
      if (kind === "remediation") return { say: [help === "fresh" ? "simpler" : "alts[0]"], then: "card", help: "heard" };
      if (kind === "bridge") return { say: ["simpler"], then: "next", help: "keep" };
      // a card: its simpler once; heard or spent, the key and its why (T1.5)
      return help === "fresh" ? { say: ["simpler", "prompt"], then: "end", help: "heard" } : { say: ["key", "why"], then: "next", help: "keep", key: true };
    // the joint, then the live part in Hindi (never an "ab se" promise: the joint is the script's)
    case "hindi": return { say: [...(kind === "checkin" ? ["@point.point"] : [textOf(kind)])], lang: "hi", joint: "hindiSwitch", then: card ? "end" : "checkin", help: "keep" };
    case "repeat": return { say: [kind === "checkin" ? "@point.point" : textOf(kind)], then: card ? "end" : "checkin", help: "keep" };
    // a picture: Studio's view of the part's own board (fit is a run-time check: switchFits / pictureTurn)
    // (a bridge's picture is the next unit's board — state.js unitBoardOf(firstUnitOf) — not a field of its own)
    case "picture": return kind === "bridge" ? { say: [], view: "next", then: "next", help: "keep" } : { say: [], view: "board", needs: ["board"], then: card ? "end" : "checkin", help: "keep" };
    case "try_first": return card ? { say: ["prompt"], joint: "tryFirst", then: "end", help: "keep" } : { say: [], joint: "tryFirst", then: "card", help: "keep" };
    // a give-up: help first while fresh (a request never spends it), the key and its why once spent
    case "give_up":
      if (!card) return { say: [], then: "card", help: "keep" };
      return help === "spent" ? { say: ["key", "why"], then: "next", help: "keep", key: true } : { say: ["simpler", "prompt"], then: "end", help: "spent" };
    case "move_on": return { say: [], joint: "neutral", then: "next", help: "keep" };
    case "aside": return { say: [], joint: "asidePark", then: card ? "end" : "card", help: "keep" };
    case "silence": return { say: [card ? "prompt" : kind === "checkin" ? "@checkin" : textOf(kind)], then: card ? "end" : "checkin", help: "keep" };
    case "right": return { say: ["why"], then: "next", help: "keep", needs: kind === "your_step" ? ["@worked.answer"] : [] };
    case "wrong": return help === "spent" ? { say: ["key", "why"], then: "next", help: "keep", key: true } : { say: ["simpler", "prompt"], then: "end", help: "spent" };
    // Loop's correction 3: keyed per mix-up — the remediation for the mix-up the classifier named, the card's own target by default
    case "misconception": return { say: [], remedy: "targets", then: "remediation", help: "spent" };
  }
  return null;
}
/** The field a part kind says as itself. */
function textOf(kind) { return { point: "point", worked_step: "do", remediation: "say", bridge: "self", checkin: "@checkin" }[kind] ?? "prompt"; }

/** The 324 type-table cells, each with its rule (null: not applicable). */
export const TYPE_TABLE = Object.freeze(PART_KINDS.flatMap((k) => COLUMNS.flatMap((c) => HELP.map((h) => ({ id: `${k}/${c}/${h}`, kind: k, column: c, help: h, rule: rule(k, c, h) })))));

const hashOf = (x) => createHash("sha256").update(JSON.stringify(x ?? null)).digest("hex").slice(0, 16);
const hasText = (v, lang) => (typeof v === "string" ? v.trim().length > 0 && lang !== "hi" : !!v && typeof v === "object"
  && (lang === "hi" ? !!String(v.hi ?? "").trim() : !!String(v.hi ?? v.en ?? "").trim() || Object.keys(v).length > 0));
/** A value at a path ("alts[0]", "steps[2].simpler") inside an object. */
function at(obj, path) {
  let v = obj;
  for (const seg of String(path).split(".")) {
    const m = /^(\w+)(?:\[(\d+)\])?$/.exec(seg);
    if (!m || v == null) return undefined;
    v = v[m[1]];
    if (m[2] != null) v = Array.isArray(v) ? v[Number(m[2])] : undefined;
  }
  return v;
}

/** The parts of one skill, in walk order, with their script paths. Off-order parts (remediations, their then-cards) follow. */
function partsOf(sk, n) {
  const P = [], base = `skills[${n}]`;
  (sk.explain ?? []).forEach((b, i) => {
    const p = `${base}.explain[${i}]`;
    P.push({ id: `${sk.skillId}:${b.id}:point`, kind: "point", path: p });
    P.push({ id: `${sk.skillId}:${b.id}:checkin`, kind: "checkin", path: p, point: p });
    if (b.ask) P.push({ id: `${sk.skillId}:${b.id}:card`, kind: "card", path: `${p}.ask`, point: p });
  });
  const we = sk.workedExample;
  if (we) {
    P.push({ id: `${sk.skillId}:worked:problem`, kind: "worked_step", path: `${base}.workedExample`, text: "problem" });
    (we.steps ?? []).forEach((_, i) => P.push({ id: `${sk.skillId}:worked:step${i + 1}`, kind: "worked_step", path: `${base}.workedExample.steps[${i}]` }));
    if (we.yourStep) P.push({ id: `${sk.skillId}:worked:yourStep`, kind: "your_step", path: `${base}.workedExample.yourStep`, worked: `${base}.workedExample` });
  }
  (sk.checks ?? []).forEach((c, i) => P.push({ id: `${sk.skillId}:check:${c.id ?? i}`, kind: "check", path: `${base}.checks[${i}]`, targets: c.targets ?? null }));
  if (sk.bridgeToNext) P.push({ id: `${sk.skillId}:bridge`, kind: "bridge", path: `${base}.bridgeToNext` });
  (sk.remediation ?? []).forEach((r, i) => {
    P.push({ id: `${sk.skillId}:rem:${i}`, kind: "remediation", path: `${base}.remediation[${i}]`, targets: r.targets ?? null, offOrder: true });
    if (r.then) P.push({ id: `${sk.skillId}:rem:${i}:then`, kind: "then_card", path: `${base}.remediation[${i}].then`, targets: r.then.targets ?? r.targets ?? null, offOrder: true });
  });
  return P;
}

/**
 * The walk order with the plan applied (Loop's corrections 1, 2, 5, 7). A compressed skill opens on ONE check unit that branches:
 * right ends the skill; a miss puts back its full unit (explain, worked, the other checks, then its ladder) — a cell's `then`, with its
 * because (compress_fallback). The warm-up (firstCard, prereqCheck) stays outside: the compile starts after it (correction 4).
 */
function orderOf(script, parts, plan) {
  const order = [];
  (script.skills ?? []).forEach((sk) => {
    const mine = parts.filter((p) => p.id.startsWith(`${sk.skillId}:`) && !p.offOrder);
    const checks = mine.filter((p) => p.kind === "check");
    const byPlan = plan?.checkOrder?.[sk.skillId];
    const checkIds = Array.isArray(byPlan) ? [...byPlan.map((c) => `${sk.skillId}:check:${c}`).filter((id) => checks.some((p) => p.id === id)), ...checks.map((p) => p.id).filter((id) => !byPlan.map((c) => `${sk.skillId}:check:${c}`).includes(id))] : checks.map((p) => p.id);
    const ladder = (plan?.ladderOrder?.[sk.skillId] ?? sk.ladder?.map((l) => l.itemId) ?? []).map((itemId) => ({ ladder: itemId }));
    const full = [...mine.filter((p) => p.kind !== "check" && p.kind !== "bridge").map((p) => p.id), ...checkIds, ...ladder, ...mine.filter((p) => p.kind === "bridge").map((p) => p.id)];
    const at0 = plan?.compressAt?.[sk.skillId] ?? (plan?.compress?.includes?.(sk.skillId) ? checkIds[0] ?? null : null);
    if (at0) {
      const open = String(at0).includes(":") ? String(at0) : `${sk.skillId}:check:${at0}`;
      const because = { kind: "compress", skillId: sk.skillId, ...(plan?.because ? { from: "planFor" } : {}) };
      order.push({ unit: open, recheck: true, onRight: "skip", onMiss: full.filter((x) => x !== open), because: [because, { kind: "compress_fallback", skillId: sk.skillId, on: "miss" }],
        ...(plan?.allKnown && !order.some((u) => u.sayFirst) ? { sayFirst: "allKnown" } : {}) });
      if (plan?.allKnown) order.push({ ladder: "hardestFirst", skillId: sk.skillId });
    } else order.push(...full.map((x) => (typeof x === "string" ? { unit: x } : x)));
  });
  return order;
}

/**
 * Compile one script: every part's cells, resolved against its fields; the holes and the doubles. plan: planFor()'s output (or null).
 * Card parts that a plan marks keep their marks (probeFor, recheck: Loop's correction 7).
 */
export function compileScript(script, plan = null) {
  const parts = (script?.skills ?? []).flatMap((sk, n) => partsOf(sk, n));
  const cells = {}, holes = [], doubles = [];
  const seen = new Map();
  for (const p of parts) { if (seen.has(p.id)) doubles.push({ part: p.id, why: "two parts with one id" }); seen.set(p.id, p); }
  // a mix-up two remediations of one skill target: the misconception column cannot tell them apart
  for (const sk of script?.skills ?? []) {
    const t = new Map();
    for (const r of sk.remediation ?? []) { if (!r.targets) continue; if (t.has(r.targets)) doubles.push({ part: `${sk.skillId}:rem`, why: `two remediations for ${r.targets}` }); t.set(r.targets, 1); }
  }
  const field = (p, f) => {
    if (f.startsWith("@point.")) return { path: `${p.point}.${f.slice(7)}`, v: at(script, `${p.point}.${f.slice(7)}`) };
    if (f.startsWith("@worked.")) return { path: `${p.worked}.${f.slice(8)}`, v: at(script, `${p.worked}.${f.slice(8)}`) };
    if (f === "@checkin") return { path: `${p.path}.checkin`, v: at(script, `${p.path}.checkin`) ?? "joint" };
    if (f === "self") return { path: p.path, v: at(script, p.path) };
    if (p.text && (f === "do" || f === "simpler" || f === "alts[0]")) return { path: `${p.path}.${f === "do" ? p.text : f}`, v: at(script, `${p.path}.${f === "do" ? p.text : f}`) };
    const own = { path: `${p.path}.${f}`, v: at(script, `${p.path}.${f}`) };
    if (own.v != null) return own;
    // (as the walk does today: an explain card's help and board are its point's (liveBeatSimpler); a worked step's board is the worked
    // example's; a remediation is said over the board of the card it remedies)
    if (p.point && ["simpler", "alts[0]", "board"].includes(f)) return { path: `${p.point}.${f}`, v: at(script, `${p.point}.${f}`) };
    if ((p.kind === "worked_step" || p.kind === "your_step") && f === "board") { const w = p.worked ?? p.path.replace(/\.steps\[\d+\]$/, ""); return { path: `${w}.board`, v: at(script, `${w}.board`) }; }
    if (p.kind === "remediation" && f === "board") {
      const sk = script.skills.find((x) => p.id.startsWith(`${x.skillId}:`));
      const n = script.skills.indexOf(sk);
      const i = (sk?.checks ?? []).findIndex((c) => c.targets === p.targets);
      if (i >= 0) return { path: `skills[${n}].checks[${i}].board`, v: sk.checks[i].board };
      const j = (sk?.explain ?? []).findIndex((b) => b.ask?.targets === p.targets);
      if (j >= 0) return { path: `skills[${n}].explain[${j}].board`, v: sk.explain[j].board };
    }
    return own;
  };
  for (const p of parts) {
    cells[p.id] = {};
    for (const c of COLUMNS) {
      cells[p.id][c] = {};
      for (const h of HELP) {
        const r = rule(p.kind, c, h);
        if (!r) continue;
        const say = [];
        for (const f of r.say ?? []) {
          const x = field(p, f);
          const ok = x.v === "joint" || (f === "key" ? x.v != null && String(x.v).trim() !== "" : hasText(x.v, r.lang));
          if (!ok) holes.push({ part: p.id, kind: p.kind, rule: `${p.kind}/${c}/${h}`, field: f.replace(/^@\w+\./, ""), path: x.path, ...(r.lang ? { lang: r.lang } : {}) });
          say.push(x.path);
        }
        for (const f of r.needs ?? []) {
          const x = field(p, f);
          if (!hasText(x.v) && !(x.v && typeof x.v === "object")) holes.push({ part: p.id, kind: p.kind, rule: `${p.kind}/${c}/${h}`, field: f.replace(/^@\w+\./, ""), path: x.path });
        }
        let remedy;
        if (r.remedy) {
          const sk = script.skills.find((s) => p.id.startsWith(`${s.skillId}:`));
          const target = at(script, `${p.path}.targets`) ?? p.targets;
          const i = (sk?.remediation ?? []).findIndex((x) => x.targets === target);
          remedy = { default: i >= 0 ? `${p.id.split(":")[0]}:rem:${i}` : null, byMixup: "misconception:<id>" };
          if (i < 0) holes.push({ part: p.id, kind: p.kind, rule: `${p.kind}/${c}/${h}`, field: "remediation", path: `remediation[targets=${target}]` });
        }
        cells[p.id][c][h] = { say, then: r.then, help: r.help, ...(r.key ? { key: true } : {}), ...(r.joint ? { joint: r.joint } : {}), ...(r.lang ? { lang: r.lang } : {}),
          ...(r.view ? { view: r.view } : {}), ...(remedy ? { remedy } : {}), address: `${p.id}/${c}/${h}` };
      }
    }
  }
  const order = orderOf(script ?? {}, parts, plan);
  // (the authoring cost: each missing field once per part, with the rules that name it)
  const byField = new Map();
  for (const h of holes) { const k = h.path.startsWith("remediation[") ? `${h.part}|${h.path}` : h.path; const e = byField.get(k) ?? { part: h.part, kind: h.kind, field: h.field, path: h.path, rules: [] }; e.rules.push(h.rule); byField.set(k, e); }
  return { missing: [...byField.values()], topicId: script?.topicId ?? null, order, parts, cells, holes, doubles, cellCount: Object.values(cells).reduce((n, cs) => n + Object.values(cs).reduce((m, hs) => m + Object.keys(hs).length, 0), 0) };
}

// (main's condition: cached by kit hash and plan hash; the trace row carries the cell's address and its because)
const cache = new Map();
/** compileScript, cached by the kit's hash (else the script's own) and the plan's. */
export function compiledFor(script, { kitHash = null, plan = null } = {}) {
  const k = `${kitHash ?? hashOf(script)}#${hashOf(plan)}`;
  if (!cache.has(k)) cache.set(k, compileScript(script, plan));
  return cache.get(k);
}
/** Tests: forget every compiled map. */
export function clearCompiled() { cache.clear(); }
