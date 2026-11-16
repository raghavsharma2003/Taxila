// dc-r8-director25 H4: help is one function. Every request for help — a clarify, a give-up, a request for Hindi, a hint after a
// wrong answer — goes through pickHelp, and nothing else picks help. It is given the part she is on (a compile.js part id), the
// request and the said set (every sentence she has said in this lesson, kept as lesson state by state.js), and it returns three
// things together: the wording (the first rung of the part's ladder none of whose sentences is in the said set), the board that
// wording is said over (the board of the part the wording belongs to), and what happens to the card. The count of requests decides
// nothing. Pure: no state is read or written here.
//
// The ladder (docs/patches/to-brain/039 Part A item 2), from the script, in this order:
//   a point or its check-in: pointAlt, simpler
//   an explain card (ask):   ask.simpler, then its point's pointAlt, then its point's simpler
//   a check card (a check, a remediation's then-card, the worked example's own step): simpler
//   a worked problem:        problemAlt, simpler;   a worked step: its simpler
//   a remediation:           sayAlt, simpler
//   after a key:             whyAlt
// A rung whose field the script lacks is a missing rung (compile-report.mjs lists it as a hole); code never fills it with a sentence.
import { compiledFor } from "./compile.js";
import { saidIn, joinable } from "./script.js";

/** The requests help answers. A "hint" is a wrong answer's (or an unremedied mix-up's) help on a live card. */
export const HELP_REQUESTS = Object.freeze(["clarify", "give_up", "hindi", "hint"]);
/** The joints help may say (Learning 014). Each script carries them as `joints.<kind>: [{hi, en}, …]`. */
export const HELP_JOINTS = Object.freeze(["helpSpent", "afterKeyGoOn"]);
/** Code's forms for a joint a script has not authored yet: shapes a teacher says, few and plain. The script's own forms win. */
export const FALLBACK_JOINTS = Object.freeze({
  // (a Hindi request with nothing unsaid on the part: a true line — there are no easier words — then the question alone)
  helpSpent: Object.freeze([{ hi: "Isse aasaan shabd mere paas abhi nahi hain.", en: "I don't have easier words for this one." },
    { hi: "Isko main aur aasaan nahi keh paa rahi.", en: "I can't put this one more simply." }]),
  // (a give-up or a clarify after a key's check-in with the why's other wording said: they will meet it again; the lesson goes on)
  afterKeyGoOn: Object.freeze([{ hi: "Koi baat nahi, yeh hum aage phir dekhenge.", en: "That's okay, we'll see this again soon." },
    { hi: "Theek hai, is par hum baad mein phir aayenge.", en: "That's fine, we'll come back to this later." }]),
});

const CARD_KINDS = new Set(["card", "check", "then_card", "your_step"]);
export const normSentence = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
export const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+(?=\S)/).map((x) => x.trim()).filter(Boolean);

/** Two normalised sentences are one: equal, or sharing 8 words in 10 (counted against the longer of the two). */
export function sameSentence(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const wa = a.split(" "), wb = b.split(" ");
  const bag = new Map();
  for (const w of wb) bag.set(w, (bag.get(w) ?? 0) + 1);
  let common = 0;
  for (const w of wa) { const n = bag.get(w) ?? 0; if (n) { common++; bag.set(w, n - 1); } }
  return common / Math.max(wa.length, wb.length) >= 0.8;
}
/** The keys of the said set (it holds { k, row } entries, or bare keys). */
const keysOf = (said) => (said ?? []).map((x) => (typeof x === "string" ? x : x?.k)).filter(Boolean);
/** Whether a sentence is in the said set. */
export function inSaid(sentence, said) {
  const k = normSentence(sentence);
  if (!k) return false;
  return keysOf(said).some((x) => sameSentence(k, x));
}
/** The row a sentence was said at, or null. */
export function saidAt(sentence, said) {
  const k = normSentence(sentence);
  const e = (said ?? []).find((x) => sameSentence(k, typeof x === "string" ? x : x?.k));
  return e && typeof e === "object" ? e.row ?? null : e ? -1 : null;
}
/** The said set with one turn of hers added: each sentence of it, with the row it was said at (an entry already there keeps its row). */
export function addSaid(said, text, row) {
  const out = [...(said ?? [])];
  const have = new Set(keysOf(out));
  for (const s of sentencesOf(text)) { const k = normSentence(s); if (k && !have.has(k)) { out.push({ k, row }); have.add(k); } }
  return out;
}

/** A value at a script path ("skills[0].explain[1].ask.simpler"). */
export function at(obj, path) {
  let v = obj;
  for (const seg of String(path).split(".")) {
    const m = /^(\w+)(?:\[(\d+)\])?$/.exec(seg);
    if (!m || v == null) return undefined;
    v = v[m[1]];
    if (m[2] != null) v = Array.isArray(v) ? v[Number(m[2])] : undefined;
  }
  return v;
}
const boardAt = (script, path) => { const b = path ? at(script, path) : null; return b && typeof b === "object" ? b : null; };
/** The parts of a script, by id (compile.js's part ids and paths). */
const partsById = (script) => new Map((compiledFor(script).parts ?? []).map((p) => [p.id, p]));

/** The part a compile.js part id names, with what help needs of it: { id, kind, path, point?, worked?, board, card?, answerBoard?, key?, why? }. */
export function helpPart(script, partId) {
  if (!script || !partId) return null;
  const p = partsById(script).get(partId);
  if (!p) return null;
  const skillPath = p.path.replace(/^(skills\[\d+\]).*$/, "$1");
  const out = { id: p.id, kind: p.kind, path: p.path };
  if (p.kind === "point" || p.kind === "checkin") {
    const P = p.point ?? p.path;
    out.point = P;
    out.board = boardAt(script, `${P}.board`);
    // (its card, asked when the part's ladder has nothing unsaid or after a give-up's wording)
    if (at(script, `${P}.ask`)) out.card = `${p.id.replace(/:(?:point|checkin)$/, "")}:card`;
  } else if (p.kind === "card") {
    out.point = p.point;
    out.board = boardAt(script, `${p.path}.board`) ?? boardAt(script, `${p.point}.board`);
  } else if (p.kind === "check" || p.kind === "then_card") {
    out.board = boardAt(script, `${p.path}.board`);
  } else if (p.kind === "your_step") {
    out.worked = p.worked;
    out.board = boardAt(script, `${p.path}.board`) ?? boardAt(script, `${p.worked}.board`);
  } else if (p.kind === "worked_step") {
    const w = p.text ? p.path : p.path.replace(/\.steps\[\d+\]$/, "");
    out.worked = w;
    out.step = !p.text;
    out.board = boardAt(script, `${w}.board`);
  } else if (p.kind === "remediation") {
    const r = at(script, p.path);
    // (a remediation with no board of its own is said over the board of the card it remedies — compile.js's rule)
    let b = boardAt(script, `${p.path}.board`);
    if (!b) {
      const sk = at(script, skillPath);
      const c = (sk?.checks ?? []).find((x) => x.targets === r?.targets) ?? (sk?.explain ?? []).find((x) => x.ask?.targets === r?.targets);
      b = c?.board && typeof c.board === "object" ? c.board : null;
    }
    out.board = b;
    if (r?.then) out.card = `${p.id}:then`;
  } else if (p.kind === "bridge") {
    out.board = null;
  } else return null;
  if (CARD_KINDS.has(p.kind)) {
    const c = at(script, p.path);
    out.key = c?.key ?? null;
    out.why = c?.why ?? null;
    out.answerBoard = (c?.answerBoard && typeof c.answerBoard === "object" ? c.answerBoard : null) ?? out.board ?? null;
  }
  return out;
}

/** A part's ladder: [{ field, path, value, board }], rungs whose field the script has, in order. `keyed`: the card just keyed. */
export function ladderOf(script, part, { keyed = false } = {}) {
  if (!part) return [];
  const rung = (field, path, board) => { const v = at(script, path); return v != null && (typeof v !== "object" || v.hi || v.en) ? { field, path, value: v, board: (v && typeof v === "object" && v.board && typeof v.board === "object" ? v.board : null) ?? board ?? null } : null; };
  let rungs;
  if (keyed) rungs = CARD_KINDS.has(part.kind) ? [rung("whyAlt", `${part.path}.whyAlt`, part.answerBoard)] : [];
  else switch (part.kind) {
    case "point": case "checkin": rungs = [rung("pointAlt", `${part.point}.pointAlt`, part.board), rung("simpler", `${part.point}.simpler`, part.board)]; break;
    case "card": {
      const pb = boardAt(script, `${part.point}.board`);
      rungs = [rung("ask.simpler", `${part.path}.simpler`, part.board), rung("pointAlt", `${part.point}.pointAlt`, pb), rung("simpler", `${part.point}.simpler`, pb)];
      break;
    }
    case "check": case "then_card": case "your_step": rungs = [rung("simpler", `${part.path}.simpler`, part.board)]; break;
    case "worked_step": rungs = part.step ? [rung("simpler", `${part.path}.simpler`, part.board)] : [rung("problemAlt", `${part.worked}.problemAlt`, part.board), rung("simpler", `${part.worked}.simpler`, part.board)]; break;
    case "remediation": rungs = [rung("sayAlt", `${part.path}.sayAlt`, part.board), rung("simpler", `${part.path}.simpler`, part.board)]; break;
    case "bridge": rungs = [rung("simpler", `${part.path}.simpler`, null)]; break;
    default: rungs = [];
  }
  return rungs.filter(Boolean);
}
/** The rung fields a part kind's ladder names (for the compile report: a field the script lacks is a hole). */
export const LADDER_FIELDS = Object.freeze({ point: ["pointAlt", "simpler"], checkin: ["pointAlt", "simpler"], card: ["ask.simpler", "pointAlt", "simpler"], check: ["simpler"],
  then_card: ["simpler"], your_step: ["simpler"], worked_problem: ["problemAlt", "simpler"], worked_step: ["simpler"], remediation: ["sayAlt", "simpler"], keyed: ["whyAlt"] });

/** The forms of a help joint for a script (its own, else code's), as { forms, by }. */
export function helpJointForms(script, kind) {
  const own = script?.joints?.[kind];
  return Array.isArray(own) && own.length ? { forms: own, by: "authored" } : { forms: FALLBACK_JOINTS[kind] ?? [], by: "code" };
}
/** A lesson's own start for a kind (two lessons do not open on the same form), as the seam pass keys its joints. */
const startOf = (lessonKey, kind) => {
  if (lessonKey == null) return 0;
  const h = [...`${lessonKey}|${kind}`].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return Math.imul(h, 2654435761) >>> 0;
};
/** One form of a help joint: rotated from the lesson's start by how many of that joint she has said. → { kind, text, by } | null. */
export function helpJoint(script, kind, { lang = "hinglish", lessonKey = null, n = 0 } = {}) {
  const { forms, by } = helpJointForms(script, kind);
  const texts = forms.map((f) => saidIn(f, lang)).filter((x) => x && String(x).trim());
  if (!texts.length) return null;
  const t = String(texts[(startOf(lessonKey, kind) + n) % texts.length]).trim();
  return { kind, text: t.charAt(0).toUpperCase() + t.slice(1), by };
}

/** A card's key said as the worked answer: the key and its why as one statement (a yes-or-no key: its why alone, never a verdict word). */
export function keyLine(part, lang = "hinglish") {
  if (!part || part.key == null || String(part.key).trim() === "") return null;
  const en = lang === "english";
  const why = part.why ? String(saidIn(part.why, lang) ?? "").trim().replace(/[.!?।]+$/, "") : "";
  const yn = /^(?:haan|ha|nahi|nahin|yes|no)$/i.test(String(part.key).trim());
  const text = yn ? (why ? `${why.charAt(0).toUpperCase()}${why.slice(1)}.` : null)
    : `${en ? "The answer is" : "Iska jawab hai"} ${part.key}${why ? `, ${en ? "because" : "kyunki"} ${joinable(why, { lower: true })}` : ""}.`;
  return text ? { key: part.key, why, text, board: part.answerBoard ?? null } : null;
}

/**
 * The one help function.
 * @param {object} a
 * @param {object} a.script     the lesson script
 * @param {string} a.part       the compile.js part id she is on (for a card just keyed: that card's id, with keyed: true)
 * @param {boolean} [a.keyed]   the child spoke after a key's check-in: the part is the card just keyed
 * @param {string} a.request    "clarify" | "give_up" | "hindi" | "hint"
 * @param {Array} a.said        the said set: [{ k, row }] (normalised sentences she has said this lesson)
 * @param {string} [a.lang]     the lesson language ("hinglish" | "english"); a Hindi request reads the Hinglish forms
 * @param {string} [a.lessonKey] the lesson's key (joint forms rotate by lesson)
 * @param {object} [a.jointN]   how many of each help joint she has said
 * @returns {null | { part, kind, keyed, request, rung, board, card, key, joint }}
 *   rung:  { field, path, text, board } — the wording, or null when the ladder has nothing unsaid
 *   board: the board the turn's first words are said over (the rung's, the answer board for a key)
 *   card:  "keep" (the posed card stays live, its question asked again), "wait" (no card yet: she ends on a check-in), "ask" (the
 *          part's card is asked now), "close" (the key and its why; the card is closed), "goOn" (the lesson goes on to its next part)
 *   key:   { key, why, text, board } when the card closes
 *   joint: { kind, text, by } — helpSpent or afterKeyGoOn, said first
 */
export function pickHelp({ script, part: partId, keyed = false, request, said = [], lang = "hinglish", lessonKey = null, jointN = {} }) {
  if (!HELP_REQUESTS.includes(request)) return null;
  const part = helpPart(script, partId);
  if (!part) return null;
  // (a request for Hindi reads the Hinglish forms; the lesson's language otherwise)
  const L = request === "hindi" ? "hinglish" : lang;
  const isCard = CARD_KINDS.has(part.kind);
  // (a hint is a wrong answer's help: on a live card only)
  if (request === "hint" && !isCard) return null;
  const ladder = ladderOf(script, part, { keyed });
  const unsaid = ladder.map((r) => ({ ...r, text: saidIn(r.value, L) })).find((r) => r.text && String(r.text).trim() && !sentencesOf(r.text).some((s) => inSaid(s, said)));
  const base = { part: part.id, kind: part.kind, keyed: !!keyed, request };
  if (unsaid) {
    const t0 = String(unsaid.text).trim();
    const rung = { field: unsaid.field, path: unsaid.path, text: t0.charAt(0).toUpperCase() + t0.slice(1), board: unsaid.board ?? part.board ?? null };
    // (what happens to the card with a wording said: a posed card stays; a point's or a remediation's card is asked after a give-up or
    // a Hindi request, and waits after a clarify; a worked step and a key's check-in end on the check-in; a bridge goes on)
    const card = keyed ? "wait" : isCard ? "keep" : part.kind === "bridge" ? "goOn" : part.kind === "worked_step" ? "wait"
      : part.card && request !== "clarify" ? "ask" : "wait";
    return { ...base, rung, board: rung.board, card, key: null, joint: null };
  }
  // nothing unsaid left
  if (request === "hindi") {
    // (a Hindi request never gets a key: one true line that there are no easier words, and the question alone)
    const joint = helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 });
    const card = keyed || part.kind === "bridge" ? "goOn" : isCard ? "keep" : part.card ? "ask" : "wait";
    return { ...base, rung: null, board: part.board ?? null, card, key: null, joint };
  }
  if (keyed) {
    const joint = helpJoint(script, "afterKeyGoOn", { lang: L, lessonKey, n: jointN.afterKeyGoOn ?? 0 });
    return { ...base, rung: null, board: null, card: "goOn", key: null, joint };
  }
  if (isCard) {
    const key = keyLine(part, L);
    // (a card with no key written is let go as the walk lets it go: the lesson goes on)
    return key ? { ...base, rung: null, board: key.board, card: "close", key, joint: null } : { ...base, rung: null, board: null, card: "goOn", key: null, joint: null };
  }
  // (a point or a remediation with nothing unsaid: its card is asked; a worked step or a bridge: the lesson goes on)
  return { ...base, rung: null, board: part.board ?? null, card: part.card ? "ask" : "goOn", key: null, joint: null };
}
