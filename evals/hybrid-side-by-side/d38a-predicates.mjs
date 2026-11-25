// d38 builder A (to-brain 055, the cap: C1 to C3). Registered in dry-predicates.mjs after d37h; GATED (tests/r8-d38-055a.test.mjs pins
// both on made rows, both sides, and on the frozen director37 rows).
//   keyWithWordingUnsaid   C1: a told answer (a `key` seam), or a told step at the cap (the step's question heard four times or more before
//                          it), while a help wording of that part — the script's own, in the list below — was never said in the lesson
//                          (no sentence of it said, word for word, in any of her turns up to and including that one). director37:
//                          steering c6-ch06-t01 22, steering c5-ch02-t01 22, steering c5-ch02-t02 22, steering c6-ch07-t03 22, stuck
//                          c6-ch07-t03 42 (five rows in four lessons).
//   questionFifthOnHerOwn  C3: a fifth (or later) counted hearing of one question — her turn ends on any form the script writes for it
//                          (prompt, reask, hindi; Hinglish or English), whole, re-asked, in Hindi, or after help or a remediation — that is
//                          not the answer to the child's own request for it ("phir se bolo", a request for Hindi where the question has a
//                          Hindi form). The short ask and the invitation are no hearing (they say no form of it). director37: offtopic
//                          c4-ch01-t02 34 (the fifth, after her reply to a side-topic) and 42 (the seventh, after the go-ahead).
// The checks' OWN lists and readings, written out here and not imported from the walk (help.js ladderSpec, question-run.js atQuestionOf and
// HEAR_Q), so that a gap in one does not pass both.

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
/** A sentence's key: lower case, no punctuation, a {slot} kept as one marker word. */
const SLOT = "zzslot";
const keyOf = (t) => low(String(t ?? "").replace(/\{\w+\}/g, ` ${SLOT} `)).replace(/[^\p{L}\p{N}/\s]+/gu, " ").replace(/\s+/g, " ").trim();
const sentences = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
const formsOf = (v) => (typeof v === "string" ? [v] : v && typeof v === "object" ? [v.hi, v.en] : []).filter((x) => typeof x === "string" && x.trim());
const at = (script, path) => String(path).split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], script);

/** C1's help wordings of a part, in the order help gives them (the part named by the row's cell, as the record writes it). The list is
 *  this check's own: a script card's own simpler, then its point's other wording and simpler; a remediation's follow-up card's simpler,
 *  then the remediation's other wording and simpler; a check's simpler; the child's own step's simpler, then the worked problem's; an asked
 *  worked step's simpler, then the worked problem's other wording and simpler. → [path] | null (a part with no list: the teach-back). */
export function wordingsOf(script, part) {
  const m = /^(.+)-s(\d+):(.+)$/.exec(String(part ?? ""));
  const S = m ? script?.skills?.[Number(m[2]) - 1] : null;
  if (!S) return null;
  const base = `skills[${Number(m[2]) - 1}]`, rest = m[3];
  let r;
  if ((r = /^([^:]+):card$/.exec(rest))) {
    const k = (S.explain ?? []).findIndex((e) => e?.id === r[1]);
    return k < 0 ? null : [`${base}.explain[${k}].ask.simpler`, `${base}.explain[${k}].pointAlt`, `${base}.explain[${k}].simpler`];
  }
  if ((r = /^rem:(\d+):then$/.exec(rest))) return [`${base}.remediation[${r[1]}].then.simpler`, `${base}.remediation[${r[1]}].sayAlt`, `${base}.remediation[${r[1]}].simpler`];
  if ((r = /^check:(.+)$/.exec(rest))) {
    const k = (S.checks ?? []).findIndex((c, i) => String(c?.id ?? i) === r[1]);
    return k < 0 ? null : [`${base}.checks[${k}].simpler`];
  }
  if (rest === "worked:yourStep") return [`${base}.workedExample.yourStep.simpler`, `${base}.workedExample.simpler`];
  if ((r = /^worked:step(\d+)(?::ask)?$/.exec(rest))) return [`${base}.workedExample.steps[${Number(r[1]) - 1}].simpler`, `${base}.workedExample.problemAlt`, `${base}.workedExample.simpler`];
  return null;
}
/** The Hinglish text of a script value (a string, or { hi, en }). */
const hiOf = (v) => (typeof v === "string" ? v : typeof v?.hi === "string" ? v.hi : null);
/** The sentence keys of her turns, rows 0..i. */
const saidUpTo = (L, i) => { const s = new Set(); for (const x of L.rows.slice(0, i + 1)) if (x.who === "teacher") for (const t of sentences(x.text)) s.add(keyOf(t)); return s; };
/** The wordings of a part never said up to row i (no sentence of one said word for word): [path]. */
export function unsaidWordings(L, i, script, part) {
  const list = wordingsOf(script, part);
  if (!list) return [];
  const said = saidUpTo(L, i);
  return list.filter((p) => { const t = hiOf(at(script, p)); return t && t.trim() && !sentences(t).some((s) => said.has(keyOf(s))); });
}

/** Every question the script writes (an object with a `prompt`; the teach-back's is not read) → its path, keyed by each form's last
 *  sentence: { exact: Map, slotted: [{ re, path }] }. */
const QCACHE = new WeakMap();
function questionKeys(script) {
  if (!script || typeof script !== "object") return { exact: new Map(), slotted: [] };
  if (QCACHE.has(script)) return QCACHE.get(script);
  const exact = new Map(), slotted = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) return o.forEach((x, n) => walk(x, `${path}[${n}]`));
    if (!o || typeof o !== "object") return;
    if (o.prompt && !/^\.?teachback/.test(path)) for (const f of ["prompt", "reask", "hindi"]) for (const t of formsOf(o[f])) {
      const k = keyOf(sentences(t).at(-1) ?? "");
      if (!k || k.split(" ").length < 3) continue;
      if (k.includes(SLOT)) slotted.push({ re: new RegExp(`^${k.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")}$`, "u"), path });
      else if (!exact.has(k)) exact.set(k, path);
    }
    for (const [k, v] of Object.entries(o)) if (v && typeof v === "object") walk(v, `${path}.${k}`);
  };
  walk(script, "");
  const out = { exact, slotted };
  QCACHE.set(script, out);
  return out;
}
/** The question a turn of hers ends on (its last sentence is a form's last sentence) → its path, or null. */
export function questionOfTurn(script, text) {
  const k = keyOf(sentences(text).at(-1) ?? "");
  if (!k) return null;
  const Q = questionKeys(script);
  return Q.exact.get(k) ?? Q.slotted.find((x) => x.re.test(k))?.path ?? null;
}
/** The child asking to hear the question again, as said (Roman Hindi, Hinglish or English). */
const HEAR_AGAIN_SAID = /(?<![\p{L}])(?:phir\s+se\s+(?:bolo|bataiye|batao|boliye|puchho|poochho|suna(?:o|iye))|fir\s+se\s+(?:bolo|batao)|dobara\s+(?:bolo|batao|boliye|suna(?:o|iye))|ek\s+baar\s+(?:aur|phir)\s+(?:bolo|batao)|sawaal\s+(?:kya\s+(?:tha|hai)|phir\s+se)|kya\s+(?:bola|kaha|poocha)|kaunsa\s+sawaal|repeat|say\s+(?:it\s+)?again|what\s+was\s+the\s+question)(?![\p{L}])/iu;
/** The child asking for Hindi, as said. */
const HINDI_SAID = /(?<![\p{L}])(?:hindi\s+(?:mein|me|main)|in\s+hindi)(?![\p{L}])/iu;
const hasHindiForm = (script, path) => { const o = at(script, path); return !!(o && formsOf(o.hindi).length); };
/** The child's line before row i asks for the question at `path` (to hear it again, or in Hindi where it has a Hindi form). */
const ownRequest = (L, i, script, path) => {
  const c = L.rows[i - 1];
  if (c?.who !== "child") return false;
  return HEAR_AGAIN_SAID.test(String(c.text ?? "")) || (HINDI_SAID.test(String(c.text ?? "")) && hasHindiForm(script, path));
};
/** Her hearings of each question, rows 0..i: { [path]: n }. */
function hearingsUpTo(L, i, script) {
  const h = {};
  for (const x of L.rows.slice(0, i + 1)) if (x.who === "teacher") { const p = questionOfTurn(script, x.text); if (p) h[p] = (h[p] ?? 0) + 1; }
  return h;
}
const keySeam = (r) => (r.seams ?? []).some((x) => x.right === "key");
const ENDS = (r) => ["safeguard", "goodbye"].includes(String(r?.move ?? ""));

export const D38A_PREDICATES = {
  keyWithWordingUnsaid(L, r, i, ctx) {
    if (r.who !== "teacher" || ENDS(r)) return null;
    const key = keySeam(r), step = !!r.stepAnswer?.told;
    if (!key && !step) return null;
    const part = String(r.cell?.part ?? "");
    if (!key) {
      // (a told step is C1's only at the cap: the step's question heard four times or more before this turn)
      const P = (() => { for (let k = i - 1; k >= 0; k--) { const x = L.rows[k]; if (x.who !== "teacher") continue; const p = questionOfTurn(ctx?.script, x.text); if (p) return p; } return null; })();
      if (!P || !/workedExample\.steps\[\d+\]/.test(P) || (hearingsUpTo(L, i - 1, ctx?.script)[P] ?? 0) < 4) return null;
    }
    const left = unsaidWordings(L, i, ctx?.script, part);
    return left.length ? `a told ${key ? "answer" : "step"} while ${left.join(", ")} was never said` : null;
  },
  questionFifthOnHerOwn(L, r, i, ctx) {
    if (r.who !== "teacher" || ENDS(r)) return null;
    const P = questionOfTurn(ctx?.script, r.text);
    if (!P) return null;
    const n = hearingsUpTo(L, i, ctx?.script)[P] ?? 0;
    if (n < 5 || ownRequest(L, i, ctx?.script, P)) return null;
    return `the question ${P} heard a ${n}th time, on her own`;
  },
};
