// main 2026-11-11 21:08 (director20 c5-t01 offtopic 28, c6 stuck 18 / steering 14): two rules a picture line takes from the topic's
// own script, not from the open card alone.
//  (1) laterKeys: a picture line states no value that a card still to come in the skill asks for ("…aur ek 12 barabar hisson
//      mein" gave a later card's 1/12 away). A later unit fraction 1/b is also given away by its count of parts ("12 barabar").
//  (2) inScriptTerms: a picture line says each of the script's `terms` the way the script's own spoken lines say it ("triangle"
//      and "line" where the c6 script says them, "tribhuj"/"rekha" where it says those). The form the script's Hinglish lines
//      (`hi`) use more often is its own; a term the script never says, or says both ways equally, is left as it is.
import { scriptOf } from "../studio/approved.js";
import { keyTokens } from "../forge/explainer/states-key.js";

const cache = new Map();
const scriptFor = (topicId) => {
  if (!topicId) return null;
  if (!cache.has(topicId)) cache.set(topicId, scriptOf(topicId));
  return cache.get(topicId);
};
/** test seam: forget the scripts read so far */
export function forgetScripts() { cache.clear(); termCache.clear(); }

/** A skill's keyed cards in walk order (director/script.js walkBeats): explain asks, the worked example's step, the checks. */
export function skillCards(sk) {
  const out = [];
  for (const e of sk?.explain ?? []) if (e?.ask && "key" in e.ask) out.push({ id: String(e.id), key: e.ask.key, accept: e.ask.accept ?? [] });
  const y = sk?.workedExample?.yourStep;
  if (y && "key" in y) out.push({ id: "worked", key: y.key, accept: y.accept ?? [] });
  for (const c of sk?.checks ?? []) if (c && "key" in c) out.push({ id: String(c.id), key: c.key, accept: c.accept ?? [] });
  return out;
}
/** A card's value keys (as pictureKeys reads the open card): its key when it has a value; else its accepted answers that do. */
const cardKeys = (c) => {
  const key = String(c.key ?? "");
  return keyTokens(key).length ? [key] : (c.accept ?? []).map(String).filter((a) => keyTokens(a).length);
};
/**
 * The keys of the cards still to come in the ask's skill, after the open beat (an unknown beat — a remediation, a reteach, no
 * beat — counts every card in the skill: which are done is not known here). → string[]; [] with no script or skill.
 */
export function laterKeys(ask) {
  const topicId = ask?.kit?.topicId ?? ask?.intent?.topicId ?? null;
  const skillId = ask?.intent?.skillId ?? ask?.intent?.scriptBeat?.skillId ?? null;
  const sk = (scriptFor(topicId)?.skills ?? []).find((s) => s?.skillId === skillId);
  if (!sk) return [];
  const cards = skillCards(sk);
  const beatId = String(ask?.intent?.scriptBeat?.beatId ?? "").replace(/^(?:explain|check):/, "");
  const at = cards.findIndex((c) => c.id === beatId);
  return [...new Set((at >= 0 ? cards.slice(at + 1) : cards).flatMap(cardKeys))];
}
/** Does `line` give a later unit fraction 1/b away by its count of parts ("12 barabar hisson", "12 equal parts", "12 gaps")? */
export function lineStatesCount(line, keys) {
  const L = String(line ?? "").toLowerCase();
  for (const k of keys ?? []) for (const t of keyTokens(k)) {
    const m = /^1\/(\d+)$/.exec(t);
    if (m && new RegExp(`(^|[^\\d/])${m[1]}\\s+(?:barabar|equal|alag|hiss|hisse|hisson|parts?|gaps?|tukd|pieces?|bhaag)`).test(L)) return true;
  }
  return false;
}

// ── terms ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = (w, flags = "giu") => new RegExp(`(?<![\\p{L}])${esc(w).replace(/(?:\\\s|\s|-)+/g, "[\\s-]+")}(?![\\p{L}])`, flags);
const formsOf = (s) => String(s ?? "").split("/").map((x) => x.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim().toLowerCase()).filter(Boolean);
const spokenOf = (script) => {
  const out = [];
  const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (k === "hi" && typeof v === "string") out.push(v); else walk(v); } };
  walk(script?.skills ?? []);
  return out.join(" \n ").toLowerCase();
};
const count = (text, w) => (text.match(wordRe(w)) ?? []).length;
/** The script's own form of each term: [{ own, others }] — `own` the form its spoken lines use most, `others` the other
 *  language's forms (only when the script says its own side more often than the other). PURE on a script object. */
export function ownTerms(script) {
  const text = spokenOf(script), out = [];
  for (const t of script?.terms ?? []) {
    const hi = formsOf(t?.hi).map((f) => [f, count(text, f)]), en = formsOf(t?.en).map((f) => [f, count(text, f)]);
    const sum = (a) => a.reduce((n, [, c]) => n + c, 0);
    const [mine, theirs] = sum(hi) > sum(en) ? [hi, en] : sum(en) > sum(hi) ? [en, hi] : [null, null];
    if (!mine) continue;
    const own = [...mine].sort((a, b) => b[1] - a[1])[0][0];
    const others = theirs.map(([f]) => f).filter((f) => f && f !== own);
    if (others.length) out.push({ own, others });
  }
  return out;
}
// (a compound that holds a single-word term is never half-swapped: "sankhya rekha" is not "sankhya line")
const COMPOUNDS = ["sankhya rekha", "number line", "line segment", "antya bindu"];
const keepCase = (from, to) => (/^\p{Lu}/u.test(from) ? to.charAt(0).toUpperCase() + to.slice(1) : to);
/** `line` with each term said the script's own way. PURE given `terms` (ownTerms). */
export function inScriptTerms(line, terms) {
  let out = String(line ?? "");
  if (!terms?.length || !out) return out;
  const pairs = terms.flatMap(({ own, others }) => others.map((o) => ({ own, other: o })));
  const multi = pairs.filter((p) => /\s/.test(p.other)).sort((a, b) => b.other.length - a.other.length);
  const single = pairs.filter((p) => !/\s/.test(p.other));
  for (const { own, other } of multi) out = out.replace(wordRe(other), (m) => keepCase(m, own));
  const held = [];
  const protect = [...new Set([...COMPOUNDS, ...terms.flatMap((t) => [t.own, ...t.others]).filter((f) => /\s/.test(f))])].sort((a, b) => b.length - a.length);
  for (const c of protect) out = out.replace(wordRe(c), (m) => { held.push(m); return `\u0000${held.length - 1}\u0000`; });
  for (const { own, other } of single) out = out.replace(wordRe(other), (m) => keepCase(m, own));
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}
/** The ask's topic's own terms (cached per topic) → ownTerms; [] with no script. */
const termCache = new Map();
export function termsOf(ask) {
  const id = ask?.kit?.topicId ?? ask?.intent?.topicId ?? null;
  if (!id) return [];
  if (!termCache.has(id)) { const s = scriptFor(id); termCache.set(id, s ? ownTerms(s) : []); }
  return termCache.get(id);
}
