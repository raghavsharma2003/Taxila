// dc-r8-director26 (docs/patches/to-brain/040): the predicates written for director26's faults. Each was run over the director26 rows
// the judges named for it and reads non-zero there (tests/r8-director26-predicates.test.mjs) before it is gated at 0 on the dry matrix.
// Merged into dry-predicates.mjs's PREDICATES. Pure.
import { FALLBACK } from "../../server/brain/say.js";
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
  /** N1 (c5-t01 steady 128: "pata nahi, aap batao" after the check-in on c3's why went straight to the closing question; c5-t02 stuck 28: a
   *  bare card after "mujhe nahi pata"; c5-t02 steering 4 and c6 row 4: the first point with no word to her): a give-up or a clarify is
   *  answered first — her turn opens on a wording of help, a joint (a word to the child), or the key — never straight on the next
   *  teaching, the next card or the closing question. */
  if (!ctx.script || r.who !== "teacher" || ENDS_N1.test(String(r.move?.kind ?? r.move ?? "")) && String(r.move?.kind ?? r.move ?? "") !== "teachback") return null;
  const col = String(r.cell?.column ?? "");
  if (col !== "give_up" && col !== "clarify") return null;
  // (a worked step's request with its wordings spent goes on to the next step, on that step's own frame — J1: no promise there)
  if (/:worked:(?:problem|step\d+)$/.test(String(r.cell?.part ?? ""))) return null;
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
D26_PREDICATES.goOnAfterKey = function goOnAfterKey(L, r) {
  const sm = r.seams ?? [];
  if (!sm.some((x) => x.joint === "afterKeyGoOn")) return null;
  return r.cell?.keyed ? null : `the go-on line with no key given (${r.cell?.part ?? "no part"}, ${r.cell?.column ?? "no column"})`;
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
