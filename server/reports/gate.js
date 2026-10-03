// The banned-word and overclaim gate (PARENT-REPORT.md §8.2 P-LEX, P-STRUCT; COMPREHENSION-ENGINE.md §7.3; the
// inherited law "truncation is silent → budget gates throw"). Pure code, every language, every rendered string.
// gateReport() THROWS on any violation: it never trims a line, drops a section or shortens a script to make a report
// pass. Candidate screening (claims.js) uses lineViolations() BEFORE assembly and logs every screened candidate;
// the assembled report must then pass with zero violations, or it is not stored and not shown.
import { bannedHits, lockedHits, severeHits } from "./lexicon.js";
import { CAPS, VOICE_CHARS, VOICE_WORDS } from "./config.js";
import { CONNECTIVES, FIXED, HOME_OBJECT, SHAPES, fmtDate, renderFixed, renderShape } from "./templates.js";

export class ReportGateError extends Error {
  constructor(violations) {
    super(`parent report gate: ${violations.length} violation(s): ${violations.slice(0, 6).map((v) => `${v.rule}${v.detail ? `(${v.detail})` : ""}`).join("; ")}`);
    this.violations = violations;
    this.code = "report_gate";
  }
}

const DEV = "०१२३४५६७८९";
const digitsOf = (s) => (String(s).match(/[0-9०-९]+/g) || []).map((d) => String(Number([...d].map((ch) => (DEV.includes(ch) ? DEV.indexOf(ch) : ch)).join(""))));
export const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

/** Slot values as they appear in a rendered line of `lang`, by slot type. */
function slotText(shapeSlots, slots, lang) {
  const out = { name: [], curriculum: [], child: [], object: [], numbers: new Set() };
  for (const [k, type] of Object.entries(shapeSlots || {})) {
    const v = slots?.[k];
    if (v == null) continue;
    if (type === "number") out.numbers.add(String(v));
    else if (type === "date") { out.numbers.add(String(v.d)); out.curriculum.push(fmtDate(lang, v)); }
    else if (type === "object") out.object.push(HOME_OBJECT[v]?.[lang] ?? "");
    else out[type].push(String(v));
  }
  return out;
}
function mask(text, values) {
  let t = text;
  for (const v of [...values].filter(Boolean).sort((a, b) => b.length - a.length)) t = t.split(v).join(" ⁣ ");
  return t;
}

/**
 * Every predicate violation of one rendered line.
 * @param {string} text the rendered line
 * @param {{ shapeId?: string, fixedId?: string, slots?: any, lang: string, k7?: boolean, firstName?: string }} o
 * @returns {{ rule: string, detail?: string }[]}
 */
export function lineViolations(text, { shapeId, fixedId, slots = {}, lang, k7 = false, firstName }) {
  const v = [];
  const isFixed = !!fixedId;
  const def = isFixed ? FIXED[fixedId] : SHAPES[shapeId];
  if (!def) return [{ rule: "unknown_shape", detail: shapeId || fixedId }];
  // P-STRUCT: the line is exactly the reviewed template on typed slots (no free text can ride in)
  let expected;
  try { expected = isFixed ? renderFixed(fixedId, lang, slots) : renderShape(shapeId, lang, slots); } catch (e) { return [{ rule: "render_failed", detail: e.message }]; }
  if (text !== expected) v.push({ rule: "text_mismatch" });
  // a template bug renders a JS value instead of words: never shown
  if (/\[object |\bundefined\b|\bNaN\b|\bnull\b|\{\w+\}/.test(text)) v.push({ rule: "template_bug" });
  if (slots.name !== undefined && firstName !== undefined && slots.name !== firstName) v.push({ rule: "name_slot", detail: "not the child's name" });
  const st = slotText(isFixed ? { name: "name" } : def.slots, slots, lang);
  for (const c of st.curriculum) for (const h of severeHits(c)) v.push({ rule: "severe", detail: h.entry });
  for (const c of st.child) for (const h of severeHits(c)) v.push({ rule: "severe", detail: h.entry });
  if (/!/.test(text)) v.push({ rule: "banned", detail: "!" });
  // reviewed fixed copy is exempt from the full lexicon (S16 copy names what the report is NOT), never from the severe list
  if (isFixed) return v;
  const masked = mask(text, [...st.name, ...st.curriculum, ...st.object]);
  for (const h of bannedHits(masked)) v.push({ rule: "banned", detail: `${h.category}:${h.entry}` });
  for (const h of lockedHits(masked)) if (!(k7 && def.locked)) v.push({ rule: "overclaim", detail: h.entry });
  if (def.locked && !k7) v.push({ rule: "overclaim", detail: `${shapeId} needs the calibration gate` });
  // P-STRUCT: every number in the text is a slot value (titles and the name are masked first)
  for (const d of digitsOf(masked)) if (!st.numbers.has(d)) v.push({ rule: "number_not_in_slots", detail: d });
  return v;
}

/** Growth-edge shapes: each carries the task feature, [hedged reasoning past the gate], and Taxila's action (S11). */
const TRICKY = new Set(["tricky.work", "tricky.mixup", "tricky.work_next", "tricky.mixup_next"]);
/** Sections whose lines count against the body cap (the header is the S1 line, not body). */
const BODY = new Set(["strength", "row", "tricky", "interest", "home"]);

/**
 * Gate an assembled report in every language. Throws ReportGateError; returns true when clean.
 * @param {{ cadence: 'daily'|'weekly', claims: any[], renders: Record<string, { title: any, lines: any[], voice: any }> }} r
 * @param {{ k7?: boolean, firstName: string }} ctx
 */
export function gateReport(r, { k7 = false, firstName }) {
  const v = [];
  const caps = CAPS[r.cadence];
  if (!caps) throw new ReportGateError([{ rule: "cadence", detail: r.cadence }]);
  const claimById = new Map(r.claims.map((c) => [c.id, c]));
  for (const [lang, R] of Object.entries(r.renders)) {
    const tag = (x) => ({ ...x, lang });
    if (R.title?.fixedId !== `title.${r.cadence}`) v.push(tag({ rule: "title" }));
    else v.push(...lineViolations(R.title.text, { fixedId: R.title.fixedId, lang, firstName }).map(tag));
    const seen = new Map();
    const perSection = {};
    for (const line of R.lines) {
      if (line.kind === "claim") {
        const c = claimById.get(line.claimId);
        if (!c) { v.push(tag({ rule: "line_without_claim", detail: line.claimId })); continue; }
        seen.set(c.id, (seen.get(c.id) || 0) + 1);
        v.push(...lineViolations(line.text, { shapeId: c.shapeId, slots: c.slots, lang, k7, firstName }).map(tag));
        perSection[c.section] = (perSection[c.section] || 0) + 1;
        if (c.section === "tricky" && !TRICKY.has(c.shapeId)) v.push(tag({ rule: "tricky_three_parts" }));
        if (!Array.isArray(c.factIds) || (!c.factIds.length && c.shapeId !== "header.zero")) v.push(tag({ rule: "claim_without_facts", detail: c.id }));
      } else if (line.kind === "fixed") {
        v.push(...lineViolations(line.text, { fixedId: line.fixedId, slots: line.slots, lang, firstName }).map(tag));
        if (line.section) perSection[line.section] = (perSection[line.section] || 0) + 1;
      } else v.push(tag({ rule: "line_kind", detail: String(line.kind) }));
    }
    for (const c of r.claims) if (seen.get(c.id) !== 1) v.push(tag({ rule: "claim_rendered", detail: `${c.id} x${seen.get(c.id) || 0}` }));
    if (perSection.header !== 1) v.push(tag({ rule: "header", detail: String(perSection.header || 0) }));
    for (const [s, n] of Object.entries(perSection)) if (BODY.has(s) && n > (caps[s] ?? 0)) v.push(tag({ rule: "cap", detail: `${s} ${n} > ${caps[s] ?? 0}` }));
    const body = Object.entries(perSection).filter(([s]) => BODY.has(s)).reduce((a, [, n]) => a + n, 0);
    if (body > caps.body) v.push(tag({ rule: "cap", detail: `body ${body} > ${caps.body}` }));
    if (r.cadence === "weekly" && perSection.home !== 1) v.push(tag({ rule: "home_activity", detail: String(perSection.home || 0) }));
    if (R.voice) v.push(...voiceViolations(R, r.cadence, lang).map(tag));
  }
  if (v.length) throw new ReportGateError(v);
  return true;
}

/** The spoken script is rebuilt from its order (line ids + approved connectives) and must fit the budget. */
function voiceViolations(R, cadence, lang) {
  const v = [];
  const byKey = new Map(R.lines.map((l) => [l.key, l]));
  const parts = [];
  let prevConn = true;
  for (const o of R.voice.order) {
    if (o.kind === "connective") {
      if (prevConn) v.push({ rule: "voice_connective_position" });
      const c = CONNECTIVES[o.id]?.[lang];
      if (!c) { v.push({ rule: "voice_unknown_connective", detail: o.id }); continue; }
      parts.push(c); prevConn = true;
    } else {
      const l = byKey.get(o.id);
      if (!l) { v.push({ rule: "voice_unknown_segment", detail: o.id }); continue; }
      parts.push(l.text); prevConn = false;
    }
  }
  if (prevConn && R.voice.order.length) v.push({ rule: "voice_connective_position" });
  if (parts.join(" ") !== R.voice.text) v.push({ rule: "voice_text_mismatch" });
  const ids = R.voice.order.filter((o) => o.kind === "segment").map((o) => o.id);
  if (ids[0] !== "disclosure" || ids.at(-1) !== "close") v.push({ rule: "voice_frame" });
  if (new Set(ids).size !== ids.length) v.push({ rule: "voice_duplicate" });
  for (const l of R.lines) if (l.mustKeep && !ids.includes(l.key)) v.push({ rule: "voice_must_keep", detail: l.key });
  const n = wordCount(R.voice.text);
  if (n > VOICE_WORDS[cadence]) v.push({ rule: "voice_budget", detail: `${n} > ${VOICE_WORDS[cadence]} words` });
  if (R.voice.text.length > VOICE_CHARS) v.push({ rule: "voice_budget", detail: `${R.voice.text.length} > ${VOICE_CHARS} chars` });
  return v;
}
