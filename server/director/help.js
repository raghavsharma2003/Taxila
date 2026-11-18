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
      rungs = [rung("simpler", `${part.path}.simpler`, part.board), rung("problemAlt", `${part.worked}.problemAlt`, wb), rung("simpler", `${part.worked}.simpler`, wb)]; break; }
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
  then_card: ["simpler", "sayAlt", "simpler"], your_step: ["simpler", "problemAlt", "simpler"], worked_problem: ["problemAlt", "simpler"], worked_step: ["simpler", "problemAlt", "simpler"], remediation: ["sayAlt", "simpler"], teachback: ["simpler"], keyed: ["whyAlt"] });

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
  for (const k of [...HELP_JOINTS, "beforeWorked", "tiredBye", "stepMiss"]) if (!(Array.isArray(script?.joints?.[k]) && script.joints[k].length)) out.push({ joint: k, why: "missing (code's fallback forms are said)" });
  const hs = script?.joints?.hindiSwitch;
  if (Array.isArray(hs) && hs.some((f) => /(?<![\p{L}])hindi(?![\p{L}])/iu.test(String(f?.hi ?? f ?? "")))) out.push({ joint: "hindiSwitch", why: "its forms promise Hindi, not easier words" });
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
export const KEY_AFTER_MISSES = 5;
export function pickHelp({ script, part: partId, keyed = false, closed = false, request, said = [], lang = "hinglish", lessonKey = null, jointN = {}, misses = 0 }) {
  if (!HELP_REQUESTS.includes(request)) return null;
  const part = helpPart(script, partId);
  if (!part) return null;
  // (a request for Hindi reads the Hinglish forms; the lesson's language otherwise)
  const L = request === "hindi" ? "hinglish" : lang;
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
  if (part.kind === "worked_step" && part.step && rawAt(part.path)?.ask?.prompt && !keyed && !closed && request !== "hindi") {
    const r0 = ladderOf(script, part)[0];
    const t = r0 && r0.field === "simpler" ? saidIn(r0.value, L) : null;
    if (!t || !String(t).trim() || sentencesOf(t).some((x) => inSaid(x, said))) return null;
    const t0 = String(t).trim();
    const rung = { field: r0.field, path: r0.path, text: t0.charAt(0).toUpperCase() + t0.slice(1), board: r0.board ?? part.board ?? null };
    return { part: part.id, kind: part.kind, keyed: false, request, rung, board: rung.board, card: "keep", key: null, joint: null, stepAsked: true };
  }
  const ladder = ladderOf(script, part, { keyed: keyed || (closed && isCard) });
  const unsaid = ladder.map((r) => ({ ...r, text: saidIn(r.value, L) })).find((r) => r.text && String(r.text).trim() && !sentencesOf(r.text).some((s) => inSaid(s, said)));
  const base = { part: part.id, kind: part.kind, keyed: !!keyed, request, ...(closed && !keyed ? { closed: true } : {}) };
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
    // (a Hindi request never gets a key: one true line that there are no easier words, and the question alone)
    const joint = helpJoint(script, "helpSpent", { lang: L, lessonKey, n: jointN.helpSpent ?? 0 });
    const card = keyed || part.kind === "bridge" ? "goOn" : isCard ? "keep" : part.card ? "ask" : "wait";
    return { ...base, rung: null, board: part.board ?? null, card, key: null, joint };
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
