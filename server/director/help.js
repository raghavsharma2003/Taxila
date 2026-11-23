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
import { wrongList } from "../grading/script-answer.js";

/** The requests help answers. A "hint" is a wrong answer's (or an unremedied mix-up's) help on a live card. */
export const HELP_REQUESTS = Object.freeze(["clarify", "give_up", "hindi", "hint", "picture"]);
/** Brain 049 B2: the line a picture request with nothing left to draw hears first — the script's `joints.noPicture` (Learning 021 writes three
 *  per script). Code has no form of its own: until a script has them, the line is not said and the rest of the turn stands.
 *  → { kind: "noPicture", text, by: "authored" } | null */
// (d33 049, the dry steering c5-t01 16 on Learning 021's scripts: the form "Board par jo hai, wahi iski poori drawing hai." was said as
// "jo hai, wahi …" — a joint is outside the turn's authored plan, and brain/say.js's screen pass unpoints a sentence that names the board.
// The rotation passes over a form that points at the board or screen while another form is left; the brain pass is main's to look at)
const POINTS_AT_BOARD = /(?<![\p{L}])(?:board|screen|whiteboard)\s+(?:par|pe|mein|me|ke|ki|ka)(?![\p{L}])|\bon the (?:board|screen)\b/iu;
export function noPictureLine(script, { lang = "hinglish", lessonKey = null, n = 0 } = {}) {
  const own = script?.joints?.noPicture;
  if (!(Array.isArray(own) && own.length)) return null;
  for (let k = 0; k < own.length; k++) {
    const j = helpJoint(script, "noPicture", { lang, lessonKey, n: n + k });
    if (j && !POINTS_AT_BOARD.test(j.text)) return j;
  }
  return helpJoint(script, "noPicture", { lang, lessonKey, n });
}
/** The joints help may say (Learning 014). Each script carries them as `joints.<kind>: [{hi, en}, …]`. */
export const HELP_JOINTS = Object.freeze(["helpSpent", "afterKeyGoOn", "helpToCard", "afterKeyReturn"]);
/** Code's forms for a joint a script has not authored yet: shapes a teacher says, few and plain. The script's own forms win. */
export const FALLBACK_JOINTS = Object.freeze({
  // (a Hindi request with nothing unsaid on the part: a true line — there are no easier words — then the question alone)
  helpSpent: Object.freeze([{ hi: "Isse aasaan shabd mere paas abhi nahi hain.", en: "I don't have easier words for this one." },
    { hi: "Isko main aur aasaan nahi keh paa rahi.", en: "I can't put this one more simply." }]),
  // (a give-up or a clarify after a key's check-in with the why's other wording said: they will meet it again; the lesson goes on)
  afterKeyGoOn: Object.freeze([{ hi: "Koi baat nahi, yeh hum aage phir dekhenge.", en: "That's okay, we'll see this again soon." },
    { hi: "Theek hai, is par hum baad mein phir aayenge.", en: "That's fine, we'll come back to this later." }]),
  // (dc-r8-director27 P3, Learning 016 writes the script's own: after a key said as help, with nothing left to say on it, the lesson goes back
  // to the earlier card — one sentence that says both things, this will come again and now back to the earlier question; the go-on line and
  // the back-to line are never stacked)
  afterKeyReturn: Object.freeze([{ hi: "Koi baat nahi, yeh phir aayega; ab pehle wale sawaal par wapas chalte hain.", en: "That's okay, this will come up again; now back to the earlier question." },
    { hi: "Theek hai, is par hum phir aayenge; abhi pichhle sawaal ko dekhte hain.", en: "All right, we'll come back to this; for now let's look at the earlier question." }]),
  // (dc-r8-director27 P6.5, Learning 016 writes the script's own: a child who says she is tired and says bye gets one sentence about that
  // before the goodbye — no menu)
  tiredBye: Object.freeze([{ hi: "Thakaan ho toh aaram karna bilkul theek hai.", en: "When you're tired, resting is the right thing to do." },
    { hi: "Aaj bahut mehnat hui, ab thoda aaram karo.", en: "You worked hard today; rest a little now." }]),
  // (dc-r8-director26 N1: a give-up or a clarify on a point whose wordings are all said gets its card — with one word to the child first,
  // never the bare card: c5-t02 stuck 28, "mujhe nahi pata" answered with the card alone)
  helpToCard: Object.freeze([{ hi: "Koi baat nahi, ise ek sawaal se dekhte hain.", en: "That's okay, let's look at it through a question." },
    { hi: "Theek hai, chalo ek sawaal karke dekhte hain.", en: "All right, let's try it with a question." }]),
  // (dc-r8-director28 Brain 044 T7, Learning 017 writes the script's own: a wrong answer to an asked step hears that it was not it — four words
  // or fewer, no answer named — before the step is told)
  stepMiss: Object.freeze([{ hi: "Nahi, woh nahi.", en: "No, not that." }, { hi: "Yeh nahi hai.", en: "That's not it." }, { hi: "Nahi, aisa nahi.", en: "Not quite that." }]),
  // (dc-r8-director29 Brain 045 P4: a second request at the greeting starts the lesson — Learning 018 writes joints.startAnyway, three forms of
  // six words or fewer; these are code's until it does)
  startAnyway: Object.freeze([{ hi: "Chalo, main batati hoon.", en: "Come on, I'll show you." }, { hi: "Koi baat nahi, shuru karte hain.", en: "That's fine, let's begin." }, { hi: "Chalo, saath mein dekhte hain.", en: "Come on, let's see together." }]),
});

const CARD_KINDS = new Set(["card", "check", "then_card", "your_step", "teachback"]);
/** dc-r8-director27 P4: the closing question's part id (it has no compile.js part: the teach-back is the script's ending, not a skill's). */
export const TEACHBACK_PART = "end:teachback";
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
  if (partId === TEACHBACK_PART) {
    const tb = script.teachback;
    if (!tb?.prompt) return null;
    const board = tb.board && typeof tb.board === "object" ? tb.board : null;
    return { id: partId, kind: "teachback", path: "teachback", board, key: tb.key ?? null, why: tb.why ?? null, answerBoard: (tb.answerBoard && typeof tb.answerBoard === "object" ? tb.answerBoard : null) ?? board };
  }
  return helpPartFrom(script, partsById(script).get(partId));
}
/** helpPart from a compile.js part object itself (compile.js reads ladders while it compiles, before any part map exists). */
export function helpPartFrom(script, p) {
  if (!script || !p) return null;
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
    // (dc-r8-director26 B1: a remediation's board is its own `board` and nothing else. With none, its wording is said over the board that
    // is up (board null: "keep"); it never borrows a card's. director26's six rows — c4 steering 12; c6 steady 48, stuck 58, steering 8;
    // c5-t02 steady 82, steering 12 — said a remediation's other wording over the skill's first check card for the same mix-up, which
    // this function lent it)
    out.board = boardAt(script, `${p.path}.board`);
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
  return ladderSpec(script, part, { keyed }).filter((r) => r.present);
}
/** Every rung a part's ladder names, whether the script has it or not: [{ field, path, value, board, present }]. A rung the script lacks is
 *  a missing rung — compile.js lists it as a hole for Learning; help skips it. */
export function ladderSpec(script, part, { keyed = false } = {}) {
  if (!part) return [];
  const rung = (field, path, board) => { const v = at(script, path); const present = v != null && (typeof v !== "object" || !!(v.hi || v.en));
    return { field, path, value: v, present, board: (v && typeof v === "object" && v.board && typeof v.board === "object" ? v.board : null) ?? board ?? null }; };
  let rungs;
  // (dc-r8-director27 P3, c5-t02 stuck 42: after a key the why's other wording comes first, then the card's own wordings still unsaid — the
  // picker decides before any joint does; the go-on line was said with the worked example's simpler unsaid)
  if (keyed) return CARD_KINDS.has(part.kind) ? [rung("whyAlt", `${part.path}.whyAlt`, part.answerBoard), ...ladderSpec(script, part)] : [];
  switch (part.kind) {
    case "point": case "checkin": rungs = [rung("pointAlt", `${part.point}.pointAlt`, part.board), rung("simpler", `${part.point}.simpler`, part.board)]; break;
    case "card": {
      const pb = boardAt(script, `${part.point}.board`);
      rungs = [rung("ask.simpler", `${part.path}.simpler`, part.board), rung("pointAlt", `${part.point}.pointAlt`, pb), rung("simpler", `${part.point}.simpler`, pb)];
      break;
    }
    case "check": rungs = [rung("simpler", `${part.path}.simpler`, part.board)]; break;
    // (dc-r8-director29 Brain 045 P3: a remediation's unsaid wordings are help for its follow-up card — the card's own hint, then the
    // remediation's sayAlt, then its simpler, each over its own board: c5-t01 steady 88, stuck 42; c6 steady 8, 90, stuck 42, 76)
    case "then_card": { const rp = String(part.path).replace(/\.then$/, ""); const rb = boardAt(script, `${rp}.board`) ?? part.board;
      rungs = [rung("simpler", `${part.path}.simpler`, part.board), ...(rp !== part.path ? [rung("sayAlt", `${rp}.sayAlt`, rb), rung("simpler", `${rp}.simpler`, rb)] : [])]; break; }
    // (dc-r8-director27 P3: the worked example's own step is the worked example's — its wordings follow the step's own)
    case "your_step": { const wb = boardAt(script, `${part.worked}.board`) ?? part.board;
      // (Brain 049 B3: a problem restated is not help at the child's own step — problemAlt is said at an asked step only; c4 stuck 46, c5-t02
      // stuck 36, offtopic 24, c4-ch01 stuck 36, 38 restated the problem to a child giving the same wrong answer)
      rungs = [rung("simpler", `${part.path}.simpler`, part.board), rung("simpler", `${part.worked}.simpler`, wb)]; break; }
    // (a worked step: its own simpler, then the worked problem's ladder — problemAlt, simpler (Brain 039 A2: "a worked problem or step:
    // problemAlt, simpler"). Main's R3 on the merged tree, c5-t01 stuck 44: a step's ladder of one rung left a second "samajh nahi aaya"
    // on the step with nothing — the walk went on to the your-step card unhelped while the problem's two other wordings were unsaid)
    case "worked_step": rungs = [...(part.step ? [rung("simpler", `${part.path}.simpler`, part.board)] : []), rung("problemAlt", `${part.worked}.problemAlt`, part.board), rung("simpler", `${part.worked}.simpler`, part.board)]; break;
    case "remediation": rungs = [rung("sayAlt", `${part.path}.sayAlt`, part.board), rung("simpler", `${part.path}.simpler`, part.board)]; break;
    case "bridge": rungs = [rung("simpler", `${part.path}.simpler`, null)]; break;
    // (dc-r8-director27 P4: the closing question — its hint first, the key when none is left)
    case "teachback": rungs = [rung("simpler", "teachback.simpler", part.board)]; break;
    default: rungs = [];
  }
  return rungs;
}
/** The rung fields a part kind's ladder names (for the compile report: a field the script lacks is a hole). */
export const LADDER_FIELDS = Object.freeze({ point: ["pointAlt", "simpler"], checkin: ["pointAlt", "simpler"], card: ["ask.simpler", "pointAlt", "simpler"], check: ["simpler"],
  then_card: ["simpler", "sayAlt", "simpler"], your_step: ["simpler", "simpler"], worked_problem: ["problemAlt", "simpler"], worked_step: ["simpler", "problemAlt", "simpler"], remediation: ["sayAlt", "simpler"], teachback: ["simpler"], keyed: ["whyAlt"] });

/** The script-level joints help needs that a script lacks (Learning 014): helpSpent, afterKeyGoOn; and a hindiSwitch whose forms still
 *  promise Hindi, where the rewritten line promises easier words. → [{ joint, why }] */
export function helpJointHoles(script) {
  const out = [];
  // (dc-r8-director26 J1: beforeWorked, the seam pass's lead into a worked problem — brain/seams.js CODE_SEAM_FORMS when the script has none)
  // (dc-r8-director27: afterKeyReturn is a help joint; tiredBye, the sentence to a tired child before the goodbye — Learning 016 writes both)
  // (dc-r8-director27 Brain 043 R2: workedInvite, the invitation to do the next problem together where a right verdict stands alone before
  // a worked example — brain/seams.js CODE_SEAM_FORMS when the script has none)
  // (Brain 044 T7: stepMiss, the "not that" before a told step after a wrong answer to an asked step)
  // (Brain 044 T3: workedInvite is not read — no hole for it)
  // (Brain 045 P4: startAnyway, the line that starts the lesson after a second request at the greeting)
  // (Brain 046 Q5: afterWorked, the seam from a worked example's close into the next card — brain/seams.js CODE_SEAM_FORMS when the script has none)
  for (const k of [...HELP_JOINTS, "beforeWorked", "tiredBye", "stepMiss", "startAnyway", "afterWorked"]) if (!(Array.isArray(script?.joints?.[k]) && script.joints[k].length)) out.push({ joint: k, why: "missing (code's fallback forms are said)" });
  // (Brain 047 R8, dc-r8-director31 item 1: the switch line promises only Hindi now — a form that names Hindi is no hole)
  return out;
}
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
/** to-brain 049, main's ruling of 2026-11-23 (items 1 and 4): the go-on joint where nothing was keyed — a right verdict split from its point,
 *  a bridge's give-up — takes only a form that is a plain statement: it names no question ("sawaal", "jawab"), promises nothing ("dobara",
 *  "phir aayenge", "phir milegi", "baad mein", "yahin rakhte hain": those are for after a key), and, after a right answer, holds no
 *  consolation ("koi baat nahi", "mushkil"); at a give-up a consolation is fine. No such form: null (the walk does not split / says no joint). */
const GO_ON_NAMES = /\b(?:sawaal|jawab|dobara|phir\s+(?:aaye?n?ge?|aayegi|mile(?:ga|gi|nge)|dekhenge|milte)|aage\s+phir|baad\s+mein|yahin\s+rakh\w*|question|answer|again|come\s+back|later|see\s+this)\b/i;
const GO_ON_CONSOLES = /\b(?:koi\s+baat\s+nahi?n?|mushkil|that'?s\s+(?:okay|fine)|no\s+problem|don'?t\s+worry)\b/i;
export function goOnPlain(script, { lang = "hinglish", lessonKey = null, n = 0, consolation = false } = {}) {
  const { forms, by } = helpJointForms(script, "afterKeyGoOn");
  const texts = forms.map((f) => saidIn(f, lang)).filter((x) => x && String(x).trim())
    .filter((t) => !GO_ON_NAMES.test(t) && (consolation || !GO_ON_CONSOLES.test(t)));
  if (!texts.length) return null;
  const t = String(texts[(startOf(lessonKey, "afterKeyGoOn") + n) % texts.length]).trim();
  return { kind: "afterKeyGoOn", text: t.charAt(0).toUpperCase() + t.slice(1), by, plain: true };
}

/** A card's key said as the worked answer:the key and its why as one statement (a yes-or-no key: its why alone, never a verdict word). */
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
 *   board: the board the turn's first words are said over (the rung's, the answer board for a key); null: the board that is up stays
 *          (a remediation with no board of its own) — the page builder takes it from here and nowhere else (dc-r8-director26 B1)
 *   card:  "keep" (the posed card stays live, its question asked again), "wait" (no card yet: she ends on a check-in), "ask" (the
 *          part's card is asked now), "close" (the key and its why; the card is closed), "goOn" (the lesson goes on to its next part)
 *   key:   { key, why, text, board } when the card closes
 *   joint: { kind, text, by } — helpSpent or afterKeyGoOn, said first
 */
/** Brain 044 Small (director28 c5-t02 offtopic 18, 20: five wrong answers to one question — its quick question and its card — and the
 *  ladder went on into the point's own wordings, the key never said): a card answered wrong this many times gets its key, whatever its
 *  ladder still has. The rule that let it run was dc-r8-director25 H4 ("the count of misses never lets it go while a rung is unsaid"). */
/** dc-r8-director30 Brain 046 Q2: where a part's question keeps its `hindi` form (Learning 019) — beside `reask`: a card's ask, a check card,
 *  a follow-up card, the worked example's your-step, an asked worked step's ask. → the script path, or null. */
export function hindiPathOf(script, part) {
  const at = (path) => { try { return String(path ?? "").split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], script); } catch { return null; } };
  const o = at(part?.path);
  if (!o || typeof o !== "object") return null;
  if (o.hindi) return `${part.path}.hindi`;
  if (o.ask && typeof o.ask === "object" && o.ask.hindi) return `${part.path}.ask.hindi`;
  return null;
}
/** The `hindi` form of a part's question as it is said (its Hindi-English text), or null where the script writes none. */
export function hindiFormOf(script, part) {
  const p = hindiPathOf(script, part);
  if (!p) return null;
  const v = String(p).split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], script);
  const t = v && typeof v === "object" ? v.hi ?? v.en : v;
  return t && String(t).trim() ? String(t).replace(/\s+/g, " ").trim() : null;
}
/** Brain 047 R8: a part's question as written (its `prompt`: a card's ask, a check, a follow-up card, the your-step, an asked step's ask), said
 *  whole — the answer to a Hindi request at a card with no `hindi` form once its help is spent. → its Hindi-English text, or null. */
export function cardPromptOf(script, part) {
  const o = String(part?.path ?? "").split(/\.|\[|\]/).filter(Boolean).reduce((x, k) => x?.[/^\d+$/.test(k) ? Number(k) : k], script);
  const p = o && typeof o === "object" ? o.prompt ?? (o.ask && typeof o.ask === "object" ? o.ask.prompt : null) : null;
  const t = p && typeof p === "object" ? p.hi ?? p.en : p;
  return t && String(t).trim() ? String(t).replace(/\s+/g, " ").trim() : null;
}
export const KEY_AFTER_MISSES = 5;
/** Main's ruling of 2026-11-23 on to-brain 049 B3: a card's marked `whyAlt` (`whyAltAsHelp: true`) is written to the child who gave the
 *  card's named wrong answer (`wrongIfMis`) — many name it ("3 kehne mein …", "28 mein do metre …"). It is said as help only when the
 *  child's most recent answer at that card was that answer: the grader's listed wrong answer (`wrongListed`), or `misconception` for the
 *  card's own `targets`; where the card names no wrong answer, any miss. `last` is the walk's record of that answer (state.js answerAt):
 *  { outcome, misconceptionId, wrongListed } | null. */
export function ownReasonFits(node, last) {
  if (!node || node.whyAltAsHelp !== true || !last) return false;
  if (!["incorrect", "partial", "misconception"].includes(String(last.outcome ?? ""))) return false;
  if (!wrongList(node.wrongIfMis).length) return true;
  return !!last.wrongListed || (!!node.targets && last.outcome === "misconception" && last.misconceptionId === node.targets);
}
export function pickHelp({ script, part: partId, keyed = false, closed = false, request: asked, said = [], lang = "hinglish", lessonKey = null, jointN = {}, misses = 0, last = null }) {
  if (!HELP_REQUESTS.includes(asked)) return null;
  const part = helpPart(script, partId);
  if (!part) return null;
  // (Brain 049 B1: a request for Hindi is a request for Hindi only where the part's question has a `hindi` form — a live card or an asked
  // step that keeps one. Anywhere else it is a help request, answered as a give-up is: the part's unsaid help, no switch line, no sentence
  // that names Hindi; with every help spent the "nothing easier" line and the question again — never a key. director32: the switch line,
  // then the card's help in the same Hinglish, at a card with no form in all seven topics. Learning 021 adds forms; nothing here assumes one)
  const formHere = asked === "hindi" && !keyed && !closed && (CARD_KINDS.has(part.kind) || (part.kind === "worked_step" && part.step)) && !!hindiFormOf(script, part);
  const hindiHelp = asked === "hindi" && !formHere;
  const request = hindiHelp ? "give_up" : asked;
  // (a request for Hindi reads the Hinglish forms; the lesson's language otherwise)
  const L = asked === "hindi" ? "hinglish" : lang;
  const isCard = CARD_KINDS.has(part.kind);
  // (a hint is a wrong answer's help: on a live card only)
  if (request === "hint" && !isCard) return null;
  // (dc-r8-director27 P3: a card closed by a right answer — its why's other wording first, as after a key; it is not keyed)
  if (request === "hint" && isCard && misses >= KEY_AFTER_MISSES) {
    const key = keyLine(part, L);
    if (key) return { part: part.id, kind: part.kind, keyed: false, request, rung: null, board: key.board, card: "close", key, joint: null, missCap: misses };
  }
  // (dc-r8-director29 Brain 045 P3: at an asked worked step a give-up or a clarify gets the step's own simpler, then the step's question again —
  // the step stays asked; at the second request (its simpler said) there is no help here: the walk tells the step, as after a wrong answer)
  const rawAt = (path) => { try { return String(path ?? "").split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], script); } catch { return null; } };
  // (Brain 047 R8: a Hindi request at an asked step with no `hindi` form gets the same — its simpler, then the step's question; with the simpler
  // said, the step's question whole after the switch line. A Hindi request is no cue to tell the step)
  if (part.kind === "worked_step" && part.step && rawAt(part.path)?.ask?.prompt && !keyed && !closed && (request !== "hindi" || !hindiFormOf(script, part))) {
    const r0 = ladderOf(script, part)[0];
    const t = r0 && r0.field === "simpler" ? saidIn(r0.value, L) : null;
    const spent = !t || !String(t).trim() || sentencesOf(t).some((x) => inSaid(x, said));
    if (spent && hindiHelp) return { part: part.id, kind: part.kind, keyed: false, request, hindiAsked: true, rung: null, board: part.board ?? null, card: "keep", key: null, stepAsked: true, joint: helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 }) };
    // (Brain 049 B2: a picture request with nothing left keeps the step asked — the noPicture line and the step's question; never told)
    if (spent && request === "picture") return { part: part.id, kind: part.kind, keyed: false, request, rung: null, board: part.board ?? null, card: "keep", key: null, joint: null, stepAsked: true, pictureLine: noPictureLine(script, { lang: L, lessonKey, n: jointN.noPicture ?? 0 }) };
    if (spent) return null;
    const t0 = String(t).trim();
    const rung = { field: r0.field, path: r0.path, text: t0.charAt(0).toUpperCase() + t0.slice(1), board: r0.board ?? part.board ?? null };
    return { part: part.id, kind: part.kind, keyed: false, request, rung, board: rung.board, card: "keep", key: null, joint: null, stepAsked: true, ...(hindiHelp ? { hindiAsked: true } : {}),
      ...(request === "picture" ? { pictureLine: noPictureLine(script, { lang: L, lessonKey, n: jointN.noPicture ?? 0 }) } : {}) };
  }
  const ladder = ladderOf(script, part, { keyed: keyed || (closed && isCard) });
  // (Brain 047 R5: help answers the mistake. After a miss — the card's own hint said — on a card whose script marks its second reason safe to say without the key
  // — `whyAltAsHelp: true`, checked by the checker's rule 9 — that reason is the next rung after the card's own hint, before the point's other
  // wording: c5-t03 steering 34 to 36; c6-ch07-t01 stuck 62, offtopic 50 to 52, steering 16 to 18; c4-ch01-t02 steady 8 to 10)
  // (Brain 049 B3: the order is the same after a miss or a request — a clarify, a give-up, a Hindi request answered as help, a picture with
  // nothing left to draw: the card's simpler, its marked whyAlt, the point's other wording, the key. director32 c5-t03 steering 16, c4-ch01
  // stuck 62: a request at a marked card got the point's other wording with the card's own reason unsaid)
  // (main's ruling of 2026-11-23 on to-brain 049 B3: only after the card's named wrong answer — its most recent answer there. A request
  // with no answer yet, a give-up, another wrong answer, a request after a right answer or a key: the order before B3 — the card's simpler,
  // the point's other wording, the key — and the marked whyAlt is not said, keyed or closed included. Dry c4-ch05-t01 steady 96 to 98: a
  // clarify after a right answer was told "3 kehne mein …", an answer the child never gave)
  const marked = isCard && rawAt(part.path)?.whyAltAsHelp === true;
  const ownFits = marked && ownReasonFits(rawAt(part.path), last);
  if (marked && !ownFits) for (let n = ladder.length - 1; n >= 0; n--) if (ladder[n].path === `${part.path}.whyAlt`) ladder.splice(n, 1);
  if (["hint", "clarify", "give_up", "picture"].includes(request) && ownFits && !keyed && !closed) {
    const wa = ladderSpec(script, part, { keyed: true })[0];
    if (wa?.field === "whyAlt" && wa.present) ladder.splice(ladder[0]?.path === `${part.path}.simpler` ? 1 : 0, 0, { ...wa, board: part.board ?? null, field: "whyAltHelp" });
  }
  // (Brain 049 B3: a card's own hint is spent only when she has said it — every sentence of it; one sentence near another part's — a
  // remediation's follow-up card written the same way — leaves it unsaid. director32 c6-ch07 steady 48, offtopic 62: a mix-up met again
  // got the key at its first miss, the card's own hint read as said from the then-card's)
  const ownHint = (r) => isCard && (r.path === `${part.path}.simpler`);
  const unsaid = ladder.map((r) => ({ ...r, text: saidIn(r.value, L) })).find((r) => r.text && String(r.text).trim() && !(ownHint(r) ? sentencesOf(r.text).every((s) => inSaid(s, said)) : sentencesOf(r.text).some((s) => inSaid(s, said))));
  const base = { part: part.id, kind: part.kind, keyed: !!keyed, request, ...(hindiHelp ? { hindiAsked: true } : {}), ...(closed && !keyed ? { closed: true } : {}) };
  // (dc-r8-director30 Brain 046 Q2: a request for Hindi at a live card or an asked step gets the question's own `hindi` form — the easier-words
  // line leads it (the language pass), the form is asked over the card's board; a second request on the same card gets the card's unsaid help
  // first, then the form again. Never the "nothing easier" line, never the point's other wording in its place: c4, c5-t02, c6 offtopic 32;
  // c5-t01 stuck 8. A card with no `hindi` form gets its unsaid help, then itself whole (Brain 047 R8, below)
  const hf = request === "hindi" && !keyed && !closed && (isCard || (part.kind === "worked_step" && part.step)) ? hindiFormOf(script, part) : null;
  if (hf) {
    // (a second request: the form said before, every sentence of it — a form whose givens sentence reads as the card's own is not said
    // by the card: dry offtopic c5-t01 32, e3's "Line ke neeche wahi 0 se 1 hai, …" read as said and the first request got help first)
    // (and read word for word: a form is the card in other words, so the near-same reading of inSaid takes it for the card said — the staged
    // c5-t03's dry steady 36)
    const saidKeys = new Set(keysOf(said));
    const saidOf = (x) => { if (!/\{\w+\}/.test(x)) return saidKeys.has(normSentence(x)); const piece = x.split(/\{\w+\}/).map(normSentence).sort((a, b) => b.length - a.length)[0]; return !!piece && [...saidKeys].some((k) => k.includes(piece)); };
    const again = sentencesOf(hf).every(saidOf);
    const help = again && unsaid ? { field: unsaid.field, path: unsaid.path, text: String(unsaid.text).trim(), board: unsaid.board ?? part.board ?? null } : null;
    const rung = help ? { ...help, text: help.text.charAt(0).toUpperCase() + help.text.slice(1) } : { field: "hindi", path: hindiPathOf(script, part), text: "", board: part.board ?? null };
    return { ...base, rung, board: rung.board, card: "hindiForm", key: null, joint: null, hindiForm: hf, ...(part.kind === "worked_step" ? { stepAsked: true } : {}), ...(again ? { hindiAgain: true } : {}) };
  }
  // (Brain 047 R5: a give-up or a clarify at a bridge's check-in goes on to the next point and its card — the bridge is not said again in
  // other words: c5-t01 stuck 54 to 56, offtopic 48 to 50; c6-ch07-t01 steady 24 to 26, stuck 54 to 56; c6 stuck 52 to 54). One word to the
  // child first (N1): the script's go-on joint, afterKeyGoOn — to-brain 049 B6: the greeting's start line, joints.startAnyway ("Theek hai, main
  // shuru karti hoon."), is said only at the greeting; at a bridge it was heard mid-lesson: director32 c4 stuck 62, c5-t01 stuck 64, c6-ch07
  // stuck 64)
  // (main's ruling of 2026-11-23, item 4: that go-on joint names no question and promises nothing — "is sawaal ko yahin rakhte hain", "is par
  // hum dobara aayenge" are for after a key; a consolation is fine at a give-up. No such form: the turn goes on with no joint)
  if (part.kind === "bridge" && (request === "give_up" || request === "clarify")) return { ...base, rung: null, board: null, card: "goOn", key: null, joint: goOnPlain(script, { lang: L, lessonKey, n: jointN.afterKeyGoOn ?? 0, consolation: true }), bridgeOn: true };
  // (Brain 049 B2: a picture request with nothing left to draw — the card's pictureBoard and second view spent, or neither — is never a key
  // and never closes the card: the noPicture line, the card's unsaid help if one is left, then the card's question. It does not advance the
  // miss ladder. director32 steering 16 in c5-t01, c5-t02, c6 gave the key)
  if (request === "picture") {
    const pictureLine = noPictureLine(script, { lang: L, lessonKey, n: jointN.noPicture ?? 0 });
    const t0 = unsaid ? String(unsaid.text).trim() : "";
    const rung = unsaid ? { field: unsaid.field, path: unsaid.path, text: t0.charAt(0).toUpperCase() + t0.slice(1), board: unsaid.board ?? part.board ?? null } : null;
    return { ...base, rung, board: rung?.board ?? part.board ?? null, card: isCard ? "keep" : "wait", key: null, joint: null, pictureLine };
  }
  if (unsaid) {
    const t0 = String(unsaid.text).trim();
    const rung = { field: unsaid.field, path: unsaid.path, text: t0.charAt(0).toUpperCase() + t0.slice(1), board: unsaid.board ?? part.board ?? null };
    // (what happens to the card with a wording said: a posed card stays; a point's or a remediation's card is asked after a give-up or
    // a Hindi request, and waits after a clarify; a worked step and a key's check-in end on the check-in; a bridge goes on)
    // (dc-r8-director27 P3: a bridge's second wording is said and she waits on its check-in, as a point's — the lesson goes on from there)
    const card = keyed || closed ? "wait" : isCard ? "keep" : part.kind === "bridge" ? "wait" : part.kind === "worked_step" ? "wait"
      : part.card && request !== "clarify" ? "ask" : "wait";
    return { ...base, rung, board: rung.board, card, key: null, joint: null };
  }
  // nothing unsaid left
  if (request === "hindi") {
    // (Brain 047 R8, dc-r8-director31 item 1: most cards have no `hindi` form now, on purpose. A Hindi request never gets a key and never the
    // "nothing easier" line (c4 offtopic 32): with the part's help spent, the switch line (the language pass says it) and the whole card again
    // — said as the card's question, as a form is. A point's card is asked; after a key or at a bridge the lesson goes on with the go-on line)
    if (keyed) return { ...base, rung: null, board: null, card: "goOn", key: null, joint: helpJoint(script, "afterKeyGoOn", { lang: L, lessonKey, n: jointN.afterKeyGoOn ?? 0 }), hindiWhole: true };
    // (a card closed by its key or a right answer, or a bridge: the lesson goes on, after the switch line)
    if (part.kind === "bridge" || closed) return { ...base, rung: null, board: null, card: "goOn", key: null, joint: null, hindiWhole: true };
    const whole = isCard ? cardPromptOf(script, part) : null;
    if (whole) return { ...base, rung: { field: "whole", path: part.path, text: "", board: part.board ?? null }, board: part.board ?? null, card: "hindiForm", key: null, joint: null, hindiForm: whole, hindiWhole: true };
    const card = isCard ? "keep" : part.card ? "ask" : "goOn";
    return { ...base, rung: null, board: part.board ?? null, card, key: null, joint: null, hindiWhole: true };
  }
  // (a closed card with nothing left: the helpSpent line, and the lesson goes on — the go-on line is a key's)
  if (closed && !keyed) return { ...base, rung: null, board: null, card: "goOn", key: null, joint: helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 }) };
  if (keyed) {
    // (dc-r8-director28 Brain 044 T5: after a key with nothing unsaid, the "nothing easier" line is the help — then the go-on line or the after-key
    // return, and the lesson goes on. The go-on line alone is no help: c5-t01 stuck 30, steering 18, offtopic 62; c5-t02 stuck 30, steering 58)
    const spentJ = helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 });
    const goOn = helpJoint(script, "afterKeyGoOn", { lang: L, lessonKey, n: jointN.afterKeyGoOn ?? 0 });
    return { ...base, rung: null, board: null, card: "goOn", key: null, joint: spentJ ?? goOn, ...(spentJ && goOn ? { then: goOn } : {}) };
  }
  // (Brain 049 B1: a Hindi request at a card with no form and its help spent: the honest "nothing easier" line, then the card's question in
  // the wording not said the turn before — never its key)
  if (isCard && hindiHelp) return { ...base, rung: null, board: part.board ?? null, card: "keep", key: null, joint: helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 }) };
  if (isCard) {
    const key = keyLine(part, L);
    // (a card with no key written is let go as the walk lets it go: the lesson goes on)
    return key ? { ...base, rung: null, board: key.board, card: "close", key, joint: null } : { ...base, rung: null, board: null, card: "goOn", key: null, joint: null };
  }
  // (a point or a remediation with nothing unsaid: its card is asked; a worked step or a bridge: the lesson goes on — never with nothing:
  // main's R3 on the merged tree, c5-t02 stuck 64, a second "samajh nahi aaya" on a step whose wordings were all said got the your-step
  // card bare. The lesson goes on to the next step — dc-r8-director26 J1: never with the go-on line's promise, which is a key's)
  // (Brain 044 T5: the "nothing easier" line is the help — then the card, led by helpToCard)
  if (part.card) { const sj = helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 }); const tc = helpJoint(script, "helpToCard", { lang: L, lessonKey, n: jointN.helpToCard ?? 0 });
    return { ...base, rung: null, board: part.board ?? null, card: "ask", key: null, joint: sj ?? tc, ...(sj && tc ? { then: tc } : {}) }; }
  // (dc-r8-director26 J1 item 1: the go-on line, "aisa sawaal aage phir aayega", is said only after a key — c5-t02 stuck 58, 64; c5-t01
  // stuck 44; c6 stuck 44 said it at a worked step and then worked the same problem. A step goes on to the next step, which opens on its
  // own step frame ("Pehle …", "Ab doosra kadam."); no promise)
  // (dc-r8-director27 P3, c5-t01 stuck 44: a fourth clarify at a worked step got the next step and nothing to her — with nothing left for the
  // part, the turn says the helpSpent line, then goes on; helpSpent was said 0 times in director27's 16 lessons)
  return { ...base, rung: null, board: part.board ?? null, card: "goOn", key: null, joint: helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 }) };
}
