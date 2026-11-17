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
import { helpPartFrom, ladderSpec, helpJointHoles } from "./help.js";

/** The part kinds of a unit (COMPILE.md "Parts"). */
// (Loop's review, ask D: the hook is a part — its interest slot is the plan's hookSlot, so hook lines have a cell and a because)
// (dc-r8-director20 L3: the greeting is a part — a clarify or a give-up there gets the script's greetSimpler, then the hook)
export const PART_KINDS = Object.freeze(["point", "checkin", "card", "worked_step", "your_step", "remediation", "then_card", "check", "bridge", "hook", "greet"]);
/** What the child can do on a part: 9 requests, then 3 answer columns (cards only). */
export const REQUESTS = Object.freeze(["clarify", "hindi", "repeat", "picture", "try_first", "give_up", "move_on", "aside", "silence"]);
export const ANSWERS = Object.freeze(["right", "wrong", "misconception"]);
export const COLUMNS = Object.freeze([...REQUESTS, ...ANSWERS]);
/** The help axis of a cell's address: fresh, heard, spent. (dc-r8-director25 H4: no rule reads it any more — help is server/director/
 *  help.js pickHelp, from the part's ladder and what she has said, never a count. It stays as the address the shadow harness reads.) */
export const HELP = Object.freeze(["fresh", "heard", "spent"]);
/** The columns help answers (dc-r8-director25 H4): a clarify, a give-up, a request for Hindi, and a wrong answer's hint. */
export const HELP_COLUMNS = Object.freeze(["clarify", "hindi", "give_up", "wrong"]);
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
  // (L3: the greeting's plainer line, then the hook — never the greeting again)
  if (kind === "greet") return ["clarify", "give_up", "repeat", "hindi"].includes(column) ? { say: ["@greetSimpler"], then: "next", help: "keep" } : { say: [], then: "next", help: "keep" };
  // (the hook: its slot's line is said again on clarify, repeat, Hindi or silence; any other request moves on into the skill)
  if (kind === "hook") return ["clarify", "repeat", "silence", "hindi"].includes(column)
    ? { say: ["@slot.use"], ...(column === "hindi" ? { lang: "hi", joint: "hindiSwitch" } : {}), then: "next", help: "keep" }
    : column === "aside" ? { say: [], joint: "asidePark", then: "next", help: "keep" } : { say: [], then: "next", help: "keep" };
  // dc-r8-director25 H4: help is one function. A clarify, a give-up, a request for Hindi and a wrong answer's hint all compile to the same
  // cell — pickHelp over the part's ladder (help.js ladderSpec: a point's pointAlt and simpler; an explain card's ask.simpler, then its
  // point's; a check's simpler; a worked problem's problemAlt and simpler, a step's simpler; a remediation's sayAlt and simpler; after a
  // key, the why's whyAlt) and the said set — whatever the help state. The second-clarify, third-clarify and heard/spent rows are gone.
  if (HELP_COLUMNS.includes(column)) return { say: [], via: "pickHelp", then: "help", help: "keep" };
  switch (column) {
    case "repeat": return { say: [kind === "checkin" ? "@point.point" : textOf(kind)], then: card ? "end" : "checkin", help: "keep" };
    // a picture: Studio's view of the part's own board (fit is a run-time check: switchFits / pictureTurn)
    // (a bridge's picture is the next unit's board — state.js unitBoardOf(firstUnitOf) — not a field of its own)
    // (dc-r8-director26 B1: a remediation with no board of its own keeps the board up — its named fallback, board_up — never a card's)
    case "picture": return kind === "bridge" ? { say: [], view: "next", then: "next", help: "keep" } : { say: [], view: "board", needs: ["board"], then: card ? "end" : "checkin", help: "keep", ...(kind === "remediation" ? { fallback: "board_up" } : {}) };
    case "try_first": return card ? { say: ["prompt"], joint: "tryFirst", then: "end", help: "keep" } : { say: [], joint: "tryFirst", then: "card", help: "keep" };
    case "move_on": return { say: [], joint: "neutral", then: "next", help: "keep" };
    case "aside": return { say: [], joint: "asidePark", then: card ? "end" : "card", help: "keep" };
    case "silence": return { say: [card ? "prompt" : kind === "checkin" ? "@checkin" : textOf(kind)], then: card ? "end" : "checkin", help: "keep" };
    case "right": return { say: ["why"], then: "next", help: "keep", needs: kind === "your_step" ? ["@worked.answer"] : [], ...(kind === "your_step" ? { fallback: "worked_answer" } : {}) };
    // Loop's correction 3: keyed per mix-up — the remediation for the mix-up the classifier named, the card's own target by default
    case "misconception": return { say: [], remedy: "targets", then: "remediation", help: "spent", fallback: "as_wrong" };
  }
  return null;
}
/**
 * Named fallback cells (main's ruling 2 on the hole report): until Learning authors a missing field, its cells compile to one of these —
 * today's behaviour, written down — and the report lists every one. No hole is silent, and none throws in a lesson.
 * - worked_answer: the worked example's own card has no why — its right answer closes on the worked example's answer.
 * - as_wrong: no remediation for the mix-up — the wrong-answer cell: help's (pickHelp, a hint).
 * - board_up: a remediation with no board of its own — its picture is the board that is up (dc-r8-director26 B1).
 */
// (dc-r8-director25 H4: key_only, resay_show and next were the help rows' — gone with them; a missing rung is a hole help skips)
export const FALLBACKS = Object.freeze({
  worked_answer: () => ({ say: ["@worked.answer"], then: "next", help: "keep" }),
  as_wrong: (kind, help) => rule(kind, "wrong", help),
  // (dc-r8-director26 B1: a remediation with no board of its own: its picture is the board up)
  board_up: () => ({ say: [], view: "up", then: "checkin", help: "keep" }),
});
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
  if (sk.hook?.interestSlots?.length) P.push({ id: `${sk.skillId}:hook`, kind: "hook", path: `${base}.hook` });
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
  const skills = script.skills ?? [];
  // (Loop's ask F: compressAt holds a bare check id; a card id such as "script:S:c1" is not taken as a part id)
  const atOf = (sk, checkIds) => {
    const v = plan?.compressAt?.[sk.skillId];
    if (v != null) return String(v).includes(":") ? null : `${sk.skillId}:check:${v}`;
    return plan?.compress?.includes?.(sk.skillId) ? checkIds[0] ?? null : null;
  };
  const compressedIds = skills.filter((sk) => { const c = parts.filter((p) => p.id.startsWith(`${sk.skillId}:`) && p.kind === "check").map((p) => p.id); return !!atOf(sk, c); }).map((sk) => sk.skillId);
  skills.forEach((sk) => {
    const mine = parts.filter((p) => p.id.startsWith(`${sk.skillId}:`) && !p.offOrder);
    const checks = mine.filter((p) => p.kind === "check");
    const byPlan = plan?.checkOrder?.[sk.skillId];
    const planned = Array.isArray(byPlan) ? byPlan.map((c) => `${sk.skillId}:check:${c}`).filter((id) => checks.some((p) => p.id === id)) : [];
    const checkIds = [...planned, ...checks.map((p) => p.id).filter((id) => !planned.includes(id))];
    // (Loop's ask E: a because is planFor's record key, { choice, on }, and nothing else)
    const checkUnits = checkIds.map((id, i) => ({ unit: id, ...(i === 0 && planned.length ? { because: [{ choice: "checkOrder", on: sk.skillId }] } : {}) }));
    const ladderIds = plan?.ladderOrder?.[sk.skillId] ?? sk.ladder?.map((l) => l.itemId) ?? [];
    const ladder = ladderIds.map((itemId, i) => ({ ladder: itemId, ...(i === 0 && plan?.ladderOrder?.[sk.skillId] ? { because: [{ choice: "ladderOrder", on: sk.skillId }] } : {}) }));
    const hook = mine.filter((p) => p.kind === "hook").map((p) => ({ unit: p.id, ...(plan?.hookSlot ? { because: [{ choice: "hookSlot", on: sk.skillId }] } : {}) }));
    const body = mine.filter((p) => !["check", "bridge", "hook"].includes(p.kind)).map((p) => ({ unit: p.id }));
    const bridge = mine.filter((p) => p.kind === "bridge").map((p) => ({ unit: p.id }));
    const open = atOf(sk, checkIds.map((x) => x));
    if (open) {
      // a compressed skill: no hook; ONE check that branches — right skips the rest, a miss puts back the full unit (its body, the
      // other checks, its ladder); the bridge is said after the branch either way (Loop's ask C)
      const onMiss = [...body, ...checkUnits.filter((u) => u.unit !== open), ...ladder];
      const first = !order.some((u) => u.sayFirst);
      order.push({ unit: open, recheck: true, onRight: "skip", onMiss, because: [{ choice: "compress", on: sk.skillId }, { choice: "compress_fallback", on: sk.skillId }],
        ...(plan?.allKnown && first ? { sayFirst: "allKnown", joint: "allKnown", becauseSayFirst: [{ choice: "allKnown", on: script.topicId ?? null }] } : {}) });
      // (Loop's ask B: the hardest-first ladder only after the LAST compressed skill; its rung order is resolved at run time)
      if (plan?.allKnown && sk.skillId === compressedIds.at(-1)) order.push({ ladder: "hardestFirst", skillId: sk.skillId, because: [{ choice: "allKnown", on: script.topicId ?? null }] });
      order.push(...bridge);
    } else order.push(...hook, ...body, ...checkUnits, ...ladder, ...bridge);
  });
  return order;
}

/**
 * Compile one script: every part's cells, resolved against its fields; the holes and the doubles. plan: planFor()'s output (or null).
 * Card parts that a plan marks keep their marks (probeFor, recheck: Loop's correction 7).
 */
export function compileScript(script, plan = null) {
  const parts = [...(script?.greetSimpler ? [{ id: `${script.topicId ?? "lesson"}:greet`, kind: "greet", path: "greetSimpler", offOrder: true }] : []), ...(script?.skills ?? []).flatMap((sk, n) => partsOf(sk, n))];
  const hookSlotOf = (p) => { const h = plan?.hookSlot; if (h == null) return 0; if (Number.isInteger(h)) return h; const v = h[p.id.split(":")[0]] ?? h; return Number.isInteger(v?.index) ? v.index : Number.isInteger(v) ? v : 0; };
  const cells = {}, holes = [], doubles = [], fallbacks = [], noBoard = [], notApplicable = [];
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
    if (f === "@greetSimpler") return { path: "greetSimpler", v: at(script, "greetSimpler") };
    // (the hook's line: the plan's slot, else the first — Loop's ask D)
    if (f === "@slot.use") { const i = Number.isInteger(hookSlotOf(p)) ? hookSlotOf(p) : 0; return { path: `${p.path}.interestSlots[${i}].use`, v: at(script, `${p.path}.interestSlots[${i}].use`) }; }
    if (p.text && (f === "do" || f === "simpler" || f === "alts[0]" || f === "problemAlt")) return { path: `${p.path}.${f === "do" ? p.text : f}`, v: at(script, `${p.path}.${f === "do" ? p.text : f}`) };
    const own = { path: `${p.path}.${f}`, v: at(script, `${p.path}.${f}`) };
    if (own.v != null) return own;
    // (as the walk does today: an explain card's help and board are its point's (liveBeatSimpler); a worked step's board is the worked
    // example's)
    if (p.point && ["simpler", "alts[0]", "board"].includes(f)) return { path: `${p.point}.${f}`, v: at(script, `${p.point}.${f}`) };
    if ((p.kind === "worked_step" || p.kind === "your_step") && f === "board") { const w = p.worked ?? p.path.replace(/\.steps\[\d+\]$/, ""); return { path: `${w}.board`, v: at(script, `${w}.board`) }; }
    // (dc-r8-director26 B1: a remediation's board is its own or none — with none it is said over the board that is up; it never borrows
    // the board of the card it remedies)
    return own;
  };
  for (const p of parts) {
    cells[p.id] = {};
    for (const c of COLUMNS) {
      cells[p.id][c] = {};
      for (const h of HELP) {
        const r = rule(p.kind, c, h);
        if (!r) continue;
        const address = `${p.id}/${c}/${h}`, ruleId = `${p.kind}/${c}/${h}`;
        // (main's ruling with Learning's first pass: the misconception column applies only to a card with `targets` — a card that tests
        // no kit mix-up answers a wrong answer with its `wrong` column; not a hole and not a fallback, counted on its own)
        if (c === "misconception" && !(at(script, `${p.path}.targets`) ?? p.targets)) {
          cells[p.id][c][h] = { notApplicable: true, use: "wrong", address };
          notApplicable.push({ part: p.id, kind: p.kind, rule: ruleId });
          continue;
        }
        // (dc-r8-director25 H4: a help cell is pickHelp over the part's ladder — the rungs the script has; each rung it lacks is a hole
        // for Learning, which help skips, never a sentence of code's)
        if (r.via === "pickHelp") {
          const spec = ladderSpec(script, helpPartFrom(script, p));
          for (const x of spec.filter((y) => !y.present)) holes.push({ part: p.id, kind: p.kind, rule: ruleId, field: x.field, path: x.path });
          cells[p.id][c][h] = { say: [], via: "pickHelp", ladder: spec.filter((y) => y.present).map((y) => y.path), then: "help", help: "keep", address };
          continue;
        }
        const resolve = (r) => {
          const miss = [], say = [];
          // (alts[0] is optional: a script that has one says it in place of the same line again)
          // (an alt may name several fields, the first written one said: Learning's pointAlt/problemAlt, else alts[0])
          const altF = (Array.isArray(r.alt) ? r.alt : r.alt ? [r.alt] : []).find((f) => { const a = field(p, f); return a && hasText(a.v, r.lang); }) ?? null;
          const sayFields = altF ? [altF] : r.say ?? [];
          for (const f of sayFields) {
            const x = field(p, f);
            const ok = x.v === "joint" || (f === "key" ? x.v != null && String(x.v).trim() !== "" : hasText(x.v, r.lang));
            if (!ok) miss.push({ field: f.replace(/^@\w+\./, ""), path: x.path, ...(r.lang ? { lang: r.lang } : {}) });
            say.push(x.path);
          }
          for (const f of r.needs ?? []) {
            const x = field(p, f);
            if (!hasText(x.v) && !(x.v && typeof x.v === "object")) miss.push({ field: f.replace(/^@\w+\./, ""), path: x.path });
          }
          let remedy;
          if (r.remedy) {
            const sk = script.skills.find((s) => p.id.startsWith(`${s.skillId}:`));
            const target = at(script, `${p.path}.targets`) ?? p.targets;
            const i = (sk?.remediation ?? []).findIndex((x) => x.targets === target);
            // (Loop's review 3: the per-turn pick is a lookup — every mix-up this skill has a remediation for, to its part)
          const byMixup = Object.fromEntries((sk?.remediation ?? []).map((x, j) => [x.targets, `${p.id.split(":")[0]}:rem:${j}`]).filter(([t]) => t));
          remedy = { default: i >= 0 ? `${p.id.split(":")[0]}:rem:${i}` : null, byMixup };
            if (i < 0) miss.push({ field: "remediation", path: `remediation[targets=${target}]` });
          }
          // (a second clarify shows the part's board: one with no board to show is repetition alone — counted, not a hole)
          let show;
          if (r.show) { const x = field(p, r.show); show = x.v && typeof x.v === "object" ? x.path : null; if (!show) noBoard.push({ part: p.id, rule: ruleId }); }
          return { miss, cell: { say, then: r.then, help: r.help, ...(r.key ? { key: true } : {}), ...(r.joint ? { joint: r.joint } : {}), ...(r.lang ? { lang: r.lang } : {}),
            ...(r.view ? { view: r.view } : {}), ...(r.show ? { show } : {}), ...(remedy ? { remedy } : {}), ...(r.secondClarify ? { secondClarify: true } : {}),
            ...(r.thirdClarify ? { thirdClarify: true } : {}), ...(r.jointIf ? { jointIf: r.jointIf } : {}), ...(r.reask ? { reask: r.reask } : {}), address } };
        };
        let { miss, cell } = resolve(r);
        for (const m of miss) holes.push({ part: p.id, kind: p.kind, rule: ruleId, ...m });
        // (main's ruling 2: a missing field's cell compiles to its NAMED fallback — today's behaviour — and the report lists it)
        if (miss.length && r.fallback) {
          const fb = resolve(FALLBACKS[r.fallback](p.kind, h));
          cell = { ...fb.cell, fallback: r.fallback, address };
          fallbacks.push({ part: p.id, kind: p.kind, rule: ruleId, fallback: r.fallback, field: miss[0].field });
        } else if (miss.length) cell = { ...cell, hole: true };
        cells[p.id][c][h] = cell;
      }
    }
  }
  // (dc-r8-director25 H4: after a key's check-in the ladder is the why's other wording — a card with no whyAlt is a hole too)
  for (const p of parts.filter((x) => CARDS.has(x.kind))) for (const x of ladderSpec(script, helpPartFrom(script, p), { keyed: true }).filter((y) => !y.present))
    holes.push({ part: p.id, kind: p.kind, rule: `${p.kind}/after_key`, field: x.field, path: x.path });
  // (dc-r8-director27 Brain 043 R1: a card with a why and no whyShort — a right verdict whose why and what comes next do not fit in one turn
  // stands alone on its check-in, as before)
  for (const p of parts.filter((x) => ["card", "then_card", "check"].includes(x.kind))) {
    const c = at(script, p.path);
    if (c?.why && !c.whyShort) holes.push({ part: p.id, kind: p.kind, rule: `${p.kind}/right`, field: "whyShort", path: `${p.path}.whyShort` });
  }
  // (main's R7 on the merged tree: the wrap's closing question — a script without `wrap.ask` is said with code's fallback form)
  if (script && !(Array.isArray(script.wrap?.ask) && script.wrap.ask.length)) holes.push({ part: "wrap", kind: "wrap", rule: "wrap/ask", field: "ask", path: "wrap.ask" });
  const order = orderOf(script ?? {}, parts, plan);
  // (Loop's ask A: under a plan, the compressed check's wrong, misconception and give-up cells say nothing and take the unit's onMiss —
  // no help, no second try, no remediation, as the walk does; right stays its why, and the unit's onRight skips the rest)
  for (const u of order.filter((x) => x.recheck)) for (const c of ["wrong", "misconception", "give_up"]) for (const h of HELP) {
    if (!cells[u.unit]?.[c]) continue;
    const skillId = u.unit.split(":")[0];
    cells[u.unit][c][h] = { say: [], then: "onMiss", help: "keep", because: [{ choice: "compress_fallback", on: skillId }], address: `${u.unit}/${c}/${h}` };
  }
  // (the authoring cost: each missing field once per part, with the rules that name it)
  const byField = new Map();
  for (const h of holes) { const k = h.path.startsWith("remediation[") ? `${h.part}|${h.path}` : h.path; const e = byField.get(k) ?? { part: h.part, kind: h.kind, field: h.field, path: h.path, rules: [] }; e.rules.push(h.rule); byField.set(k, e); }
  return { missing: [...byField.values()], helpJoints: helpJointHoles(script), fallbacks, secondClarifyNoBoard: noBoard, notApplicable, topicId: script?.topicId ?? null, order, parts, cells, holes, doubles, cellCount: Object.values(cells).reduce((n, cs) => n + Object.values(cs).reduce((m, hs) => m + Object.keys(hs).length, 0), 0) };
}

// (main's condition: cached by kit hash and plan hash; the trace row carries the cell's address and its because)
const cache = new Map();
/** compileScript, cached by the kit's hash (else the script's own) and the plan's. */
export function compiledFor(script, { kitHash = null, plan = null } = {}) {
  // (Loop's ask G: a plan with no because is no plan — one child, one map)
  const p = plan && Array.isArray(plan.because) && plan.because.length ? plan : null;
  const k = `${kitHash ?? hashOf(script)}#${hashOf(p)}`;
  if (!cache.has(k)) cache.set(k, compileScript(script, p));
  return cache.get(k);
}
/** Tests: forget every compiled map. */
export function clearCompiled() { cache.clear(); }
