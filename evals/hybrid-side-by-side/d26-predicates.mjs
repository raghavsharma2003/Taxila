// dc-r8-director26 (docs/patches/to-brain/040): the predicates written for director26's faults. Each was run over the director26 rows
// the judges named for it and reads non-zero there (tests/r8-director26-predicates.test.mjs) before it is gated at 0 on the dry matrix.
// Merged into dry-predicates.mjs's PREDICATES. Pure.
import { bareBridgeGoOn } from "./help-predicates.mjs";
import { FALLBACK } from "../../server/brain/say.js";
import { stepToldAfterSimpler } from "./d30-predicates.mjs";
import { toAap } from "../../server/director/register.js";
import { sentencesOf, normSentence } from "../../server/director/help.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const formsOf = (fs) => (fs ?? []).flatMap((f) => [f?.hi, f?.en, typeof f === "string" ? f : null]).filter(Boolean);

/** B2: the lesson's stop menu is the authored line and nothing else: the script's `joints.checkinStop`, else code's checkinStop. */
function stopLines(script) {
  const own = formsOf(script?.joints?.checkinStop);
  const code = [FALLBACK.hinglish.checkinStop, FALLBACK.english.checkinStop, toAap(FALLBACK.hinglish.checkinStop)];
  return new Set([...own, ...code, ...own.map((x) => toAap(x))].map((x) => normSentence(norm(x))));
}
export const D26_PREDICATES = {
  /** B2 (c4 stuck 68; c5-t01 stuck 74; c6 stuck 72, steering 50): a child who says she wants to stop gets the authored stop line —
   *  never a menu the model wrote (buttons named, the teacher's gender wrong). */
  stopAuthored(L, r, i, ctx) {
    if (!ctx.script || String(r.cell?.column ?? "") !== "stop" || String(r.move?.kind ?? r.move ?? "") !== "break") return null;
    return stopLines(ctx.script).has(normSentence(norm(r.text))) ? null : `the stop turn is not the authored line: "${norm(r.text).slice(0, 70)}"`;
  },
};

// ───────────── N1: no request gets nothing ─────────────
import { helpSentenceOf, KEY_SAID_RE } from "./help-predicates.mjs";
const ENDS_N1 = /^(?:wrap|safeguard|break|teachback|done|greet)$/;
/** Every joint form the script has (and code's help joints), by key. */
function jointKeys(ctx) {
  if (ctx.o.d26Joints) return ctx.o.d26Joints;
  const out = new Set();
  for (const fs of Object.values(ctx.script?.joints ?? {})) for (const t of formsOf(fs)) for (const x of sentencesOf(t.replace(/\{\w+\}/g, ""))) out.add(normSentence(x));
  for (const t of formsOf([ctx.script?.greetSimpler])) for (const x of sentencesOf(t)) out.add(normSentence(x));
  return (ctx.o.d26Joints = out);
}
D26_PREDICATES.requestAnswered = function requestAnswered(L, r, i, ctx) {
  // (dc-r8-director29 Brain 045 P3: at an asked step the second request is answered by the step told, its simpler said before)
  if (stepToldAfterSimpler(L, r, i, ctx.script)) return null;
  /** N1 (c5-t01 steady 128: "pata nahi, aap batao" after the check-in on c3's why went straight to the closing question; c5-t02 stuck 28: a
   *  bare card after "mujhe nahi pata"; c5-t02 steering 4 and c6 row 4: the first point with no word to her): a give-up or a clarify is
   *  answered first — her turn opens on a wording of help, a joint (a word to the child), or the key — never straight on the next
   *  teaching, the next card or the closing question. */
  if (!ctx.script || r.who !== "teacher" || ENDS_N1.test(String(r.move?.kind ?? r.move ?? "")) && String(r.move?.kind ?? r.move ?? "") !== "teachback") return null;
  const col = String(r.cell?.column ?? "");
  if (col !== "give_up" && col !== "clarify") return null;
  // (main's ruling of 2026-11-23, to-brain 049 B6.4: a bridge's give-up with no go-on form that promises nothing goes on with no joint)
  if (bareBridgeGoOn(r, ctx)) return null;
  // (a worked step's request with its wordings spent goes on to the next step, on that step's own frame — J1: no promise there)
  if (/:worked:(?:problem|step\d+)$/.test(String(r.cell?.part ?? ""))) return null;
  // (dc-r8-director27 Brain 042: after her reply said alone before a worked segment there is no part to help — the segment comes)
  if (ctx.prevT?.leadAlone) return null;
  // (dc-r8-director27 Brain 042: a give-up on a quick question is answered by its authored `say`, then the card; on an asked step, by the
  // step told — the work order's answer to it, no hint ladder there)
  if (col === "give_up" && /:quick$/.test(String(r.cell?.part ?? "")) && (r.pageParts ?? [])[0]?.part === "quickReply") return null;
  if (col === "give_up" && /:worked:step\d+:ask$/.test(String(r.cell?.part ?? "")) && /^worked:step\d+$/.test(String((r.pageParts ?? [])[0]?.beat ?? ""))) return null;
  const first = sentencesOf(norm(r.text))[0] ?? "";
  if (!first) return "a request answered with nothing";
  if (helpSentenceOf(ctx, first) || jointKeys(ctx).has(normSentence(first)) || KEY_SAID_RE.test(first) || r.check?.gave || r.keyFact) return null;
  // (the seam record names a joint said at the turn's start: a word to the child)
  if ((r.seams ?? []).some((x) => x.left === "start" && x.joint && x.form && normSentence(first).startsWith(normSentence(x.form).slice(0, 16)))) return null;
  // (a joint form with a slot, or a help rung said in part: the first sentence's first words are a joint's)
  const f = normSentence(first);
  for (const k of jointKeys(ctx)) if (k.length >= 16 && f.startsWith(k.slice(0, 24))) return null;
  return `a ${col === "give_up" ? "give-up" : "clarify"} answered with no word to the child: "${first.slice(0, 60)}"`;
};
/** N1 item 3: a teaching turn of a scripted lesson is said in parts (her line's parts, each on its unit's board) — a turn the model drafted
 *  whole (the seam record: one "whole" seam) is the fault (c5-t02 steering 4: cut by the length guard, ending on no question). */
D26_PREDICATES.teachingParts = function teachingParts(L, r, i, ctx) {
  if (!ctx.script || r.who !== "teacher" || /^(?:wrap|safeguard|break|teachback|done|greet)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
  const sm = r.seams ?? [];
  return sm.length === 1 && sm[0].right === "whole" ? `a ${r.move?.kind ?? r.move} turn with no parts (drafted whole): "${norm(r.text).slice(0, 60)}"` : null;
};

// ───────────── J1: one joint at a seam; the go-on line in its place ─────────────
const GO_ON_KINDS = new Set(["afterKeyGoOn"]);
/** J1 item 2 (c5-t01 stuck 30, steering 18; c5-t02 stuck 46; c6 stuck 30, steering 18): the go-on line and the back-to joint in one turn —
 *  "we'll meet this again; now we go on", then "now back to the earlier question" — two joints that contradict each other. */
D26_PREDICATES.goOnStacked = function goOnStacked(L, r) {
  const sm = r.seams ?? [];
  return sm.some((x) => GO_ON_KINDS.has(x.joint)) && sm.some((x) => x.joint === "backTo") ? "the go-on line and the back-to joint in one turn" : null;
};
/** J1 item 1 (c5-t02 stuck 58, 64; c5-t01 stuck 44; c6 stuck 44): the go-on line ("such a question will come again; now we go on") is
 *  said only after a key — at a worked step whose ladder is empty she goes to the next step, with no promise. */
// (dc-r8-director27 P5: "no key given" is read from the record — a key said as help on the part she is on — never from the walk's own
// cell.keyed, which a right answer's verdict set: c5-t01 steady 82, the go-on line at a bridge's check-in)
D26_PREDICATES.goOnAfterKey = function goOnAfterKey(L, r, i, ctx) {
  const sm = r.seams ?? [];
  // (main's second ruling on cause C, item 2 — goOnAfterKey's key reader re-pinned by name: a turn whose record carries the key seam of a
  // why-alone key (to-brain 054 C2: the key said as its why, no "Iska jawab"; the harness's keyWhy) IS a key given on the part she was on;
  // keyFact is not read for it, so ynNahi stays as it was)
  if (ctx?.o && r.who === "teacher" && r.keyWhy && sm.some((x) => x.right === "key")) { const k = addressAt(L, r, i, ctx); if (k?.beat) (ctx.o.keyWhyBeats ??= new Set()).add(k.beat); }
  if (!sm.some((x) => x.joint === "afterKeyGoOn")) return null;
  const a = ctx ? addressAt(L, r, i, ctx) : null;
  const keyed = (a ? a.keyed : r.cell?.keyed) || !!(a?.beat && ctx?.o?.keyWhyBeats?.has(a.beat));
  // (to-brain 049 B6: a give-up or a clarify at a bridge's check-in goes on led by the go-on joint — the greeting's start line was said there)
  if (a && /(?:^|:)bridge$/.test(String(a.beat ?? ""))) return null;
  return keyed ? null : `the go-on line with no key given (${a ? a.beat : r.cell?.part ?? "no part"}, ${r.cell?.column ?? "no column"})`;
};
/** J1 item 3 (c6 steady 16, 58, 86, stuck 34, offtopic 42, steering 40; c5-t02 steady 20, 72, 132, steering 42): a verdict runs into a
 *  worked problem with nothing between — the seam takes beforeWorked (the script's forms, else code's). */
D26_PREDICATES.beforeWorked = function beforeWorked(L, r) {
  const pp = r.pageParts ?? [];
  const at = pp.findIndex((p) => String(p.beat ?? "") === "worked:problem" && ["body", "held"].includes(p.part));
  if (at <= 0) return null;
  if (!pp.slice(0, at).some((p) => p.part === "close" || p.part === "closed")) return null;
  return (r.seams ?? []).some((x) => x.joint === "beforeWorked") ? null : "a verdict into the worked problem with no lead-in (beforeWorked)";
};

import { addressAt } from "./d27-predicates.mjs";
// ───────────── R1: a skill's remediation is its own ─────────────
import { helpPart, at } from "../../server/director/help.js";
/** R1 (c5-t02 steady 118, 120, 126, 146): a mix-up shown on a card of a skill whose own remediation for it has not been said in this lesson
 *  gets that remediation — "said once" is counted for each remediation (its skill and its mix-up), never for the mix-up alone. */
D26_PREDICATES.skillRemediation = function skillRemediation(L, r, i, ctx) {
  if (!ctx.script || r.who !== "teacher") return null;
  const said = (ctx.o.remBySkill ??= new Set());
  const part = String(r.cell?.part ?? "");
  const S = part.split(":")[0];
  const rems = (r.pageParts ?? []).map((p) => /^rem:(.+)$/.exec(String(p.beat ?? ""))?.[1]).filter(Boolean);
  const before = new Set(said);
  for (const t of rems) said.add(`${S}|${t}`);
  if (String(r.cell?.column ?? "") !== "misconception" || rems.length || !S) return null;
  const hp = helpPart(ctx.script, part);
  const c = hp ? at(ctx.script, hp.path) : null;
  const t = c?.targets ?? c?.ask?.targets ?? null;
  const sk = (ctx.script.skills ?? []).find((x) => x.skillId === S);
  if (!t || !(sk?.remediation ?? []).some((x) => x.targets === t) || before.has(`${S}|${t}`)) return null;
  return `the mix-up ${t} on ${part} without ${S}'s own remediation for it (never said in this lesson)`;
};

// ───────────── A4: replies ─────────────
import { asideReplyForms, phraseOf } from "../../server/brain/asideReplies.js";
const BARE_ACK = /^(?:achha|theek hai|hmm,? achha|okay|alright|right)\.?$/i;
/** A4 (c4 offtopic 20, 32: "Achha." to an aside said again; c6 stuck 54, c5-t02 steady 42, offtopic 40, c4 offtopic 12: "Oh, chauka.
 *  Achha." to the child's answer to her return): her reply to an aside said again, or to the child's answer about their aside, says back
 *  what they said in a phrase form when a phrase of theirs fits — never a bare acknowledgement nor the word form "Oh, {word}. Achha.". */
D26_PREDICATES.asideReplied = function asideReplied(L, r, i, ctx) {
  if (!ctx.script || r.who !== "teacher") return null;
  const col = String(r.cell?.column ?? "");
  const said = String(ctx.prevChild ?? "");
  const again = col === "aside" && (ctx.o.asideSaid ??= new Set()).has(said.trim().toLowerCase());
  if (col === "aside") ctx.o.asideSaid.add(said.trim().toLowerCase());
  if (col !== "aside_reply" && !again) return null;
  const clause = said.split(/[,;]/).map((x) => x.trim()).filter(Boolean).at(-1) ?? "";
  // (dc-r8-director27: a phrase that names something — "…, woh" gives the phrase "woh", which says nothing of theirs; the word form with their
  // word, "Oh, chauka.", is the reply then)
  const named = (x) => !!x && /\p{L}{4,}/u.test(x);
  if (!named(phraseOf(said)) && !named(phraseOf(clause))) return null;
  const ss = sentencesOf(norm(r.text));
  const F = (ctx.o.d26ReplyForms ??= asideReplyForms());
  const first = ss[0] ?? "";
  if (BARE_ACK.test(first)) return `a bare "${first}" to "${said.slice(0, 40)}"`;
  const two = ss.slice(0, 2).join(" ");
  // (a phrase form, or Learning 016's said-again form — "Achha, phir se sixer maara. Theek hai." — is their words said back, whatever word form
  // its shape also fits)
  if (F.phrase.some((re) => re.test(first) || re.test(two))) return null;
  if (F.word.some((re) => re.test(first) || re.test(two))) return `the word form "${two.slice(0, 40)}" to "${said.slice(0, 40)}"`;
  return null;
};

// ───────────── W1: the wrap ─────────────
/** W1 (c4 steady 128; c5-t01 steady 130): the closing question answered right — the wrap opens on the verdict and its why ("kyunki …"),
 *  never the bare "Haan, sahi hai." */
D26_PREDICATES.closingWhy = function closingWhy(L, r, i, ctx) {
  if (String(r.move?.kind ?? r.move ?? "") !== "wrap" || !ctx.script?.teachback?.why || String(ctx.prevT?.move?.kind ?? ctx.prevT?.move ?? "") !== "teachback") return null;
  if (!/^correct/.test(String(ctx.prevRead ?? ""))) return null;
  const first = sentencesOf(norm(r.text))[0] ?? "";
  // (to-brain 051 C6: with the script's shorter wrap.covered the verdict leads the wrap — its why after the rotating lead-in, "Haan, sahi hai:
  // <why>" or "Haan, bilkul theek. <why>" (Brain 046 Q6), is its why said)
  const k = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
  const whyHead = [ctx.script.teachback.why?.hi, ctx.script.teachback.why?.en, typeof ctx.script.teachback.why === "string" ? ctx.script.teachback.why : null].filter(Boolean).map((x) => k(x).split(" ").slice(0, 5).join(" "));
  const lead2 = k(sentencesOf(norm(r.text)).slice(0, 2).join(" "));
  if (whyHead.some((h) => h && lead2.includes(h))) return null;
  return /^(?:haan|bilkul|sahi|yes|exactly|that's right|right)\b/i.test(first) && !/(?<![\p{L}])(?:kyunki|because)(?![\p{L}])/iu.test(first) ? `the closing verdict without its why: "${first}"` : null;
};
/** W1 (c5-t02 steady 158 after "mujhe laga aisa hi hoga"; c6 steady 114 after "shayad gin ke"): what the child said after the closing key's
 *  check-in is answered — the wrap's first turn opens on an acknowledgement (wrap.ack), never straight on what was covered. */
D26_PREDICATES.wrapAckFirst = function wrapAckFirst(L, r, i, ctx) {
  if (String(r.move?.kind ?? r.move ?? "") !== "wrap" || String(ctx.prevT?.move?.kind ?? ctx.prevT?.move ?? "") !== "teachback") return null;
  if (!/(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua)\?\s*$/.test(norm(ctx.prevT.text)) || !String(ctx.prevChild ?? "").trim()) return null;
  const acks = new Set(formsOf(ctx.script?.wrap?.ack).map((x) => normSentence(x)));
  const first = sentencesOf(norm(r.text))[0] ?? "";
  if (!acks.size) return null;
  return [...acks].some((a) => normSentence(first).startsWith(a.slice(0, 20))) ? null : `"${String(ctx.prevChild).slice(0, 40)}" after the closing key, and the wrap opens on "${first.slice(0, 40)}"`;
};

// ───────────── The record ─────────────
const VERDICT_SAID = /^(?:haan|bilkul|sahi|nahi|nahin|yeh jawab|abhi yeh|not quite|not yet|yes|exactly|that's right|\S+\s+(?:sahi\s+)?nahi)\b/i;
/** The record (c5-t01 stuck 30, 44, steering 18; c5-t02 stuck 46, 58, 64; c6 stuck 30, 44, offtopic 56, steering 18, 32): no verdict is
 *  recorded on a turn where none was said — a go-on line, help's joint, is no verdict. */
D26_PREDICATES.verdictRecorded = function verdictRecorded(L, r) {
  if (!["give_up", "clarify", "hindi"].includes(String(r.cell?.column ?? ""))) return null;
  if (!(r.seams ?? []).some((x) => x.right === "verdict" || x.right === "missVerdict")) return null;
  return sentencesOf(norm(r.text)).some((x) => VERDICT_SAID.test(x)) ? null : "a verdict recorded where none was said";
};
/** The record: a help wording is recorded as help, not as a point (the seam record's kind of a help part). */
D26_PREDICATES.helpRecorded = function helpRecorded(L, r) {
  const pp = r.pageParts ?? [];
  if (!pp.some((p) => p.part === "simpler")) return null;
  const sm = r.seams ?? [];
  return sm.some((x) => ["help", "helpSpent", "afterKeyGoOn", "helpToCard"].includes(x.right)) ? null : sm.length ? "a help wording recorded as another kind" : null;
};
/** The record (c5-t01 steering 14): a picture asked for right after a key draws the answered board — the board the key was said over — never
 *  the question's posing board. */
const KEY_LINE = /(?:is sawaal ka|iska) (?:sahi )?jawab|the answer (?:here )?(?:is|was)/i;
D26_PREDICATES.pictureAfterKey = function pictureAfterKey(L, r, i, ctx) {
  if (!/·\s*visual/.test(String(ctx.prevRead ?? "")) || !ctx.prevT || ctx.prevT.card || !KEY_LINE.test(String(ctx.prevT.text ?? ""))) return null;
  const segs = (ctx.prevT.segments ?? []).filter((g) => g?.board);
  const answered = segs.at(-1)?.board ?? ctx.prevT.boardRef ?? null;
  const drawn = r.boardRef ?? (r.segments ?? []).find((g) => g?.board)?.board ?? null;
  if (!answered || !drawn) return null;
  // (dc-r8-director27 Brain 042 E3: the answered card's own posing board — drawn as its second view, under its authored caption — is the
  // picture after a key too: the card whose answerBoard was up)
  const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  let posing = false;
  const walk = (o, up = null) => { if (posing || !o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach((x) => walk(x, up));
    if (o.answerBoard && same(o.answerBoard, answered) && same(o.board ?? up, drawn)) { posing = true; return; }
    // (to-brain 054 A, main's ruling on dry steering c4-ch01-t02 14: a picture at a key's check-in is on the keyed card's own ladder — its
    // authored pictureBoard first: the card the answered board answers, its pictureBoard drawn)
    if (o.answerBoard && same(o.answerBoard, answered) && o.pictureBoard && same(o.pictureBoard, drawn)) { posing = true; return; }
    for (const v of Object.values(o)) walk(v, o.board ?? up); };
  walk(ctx.script);
  return same(answered, drawn) || posing ? null : `a picture after the key drawn on ${drawn.template} ${JSON.stringify(drawn.params ?? {}).slice(0, 50)}, not the answered board`;
};
