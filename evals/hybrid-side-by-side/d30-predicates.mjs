// dc-r8-director29 (docs/patches/to-brain/045): the predicates Brain 045 adds, each written from the order's law and pinned non-zero on
// its director29 rows (tests/r8-director29-045.test.mjs) before it is trusted to read 0 on the dry matrix.
//   pictureDrawn   P1: on a picture turn the held panel Studio drew is the board the plan named — its template the preselected board's,
//                  its unit the intent's unit (never the lesson's held unit by default)

/** P1 (steering row 14 in all four pilots): read by dry-predicates' pictureDrawn, with its director22 reads. */
export function pictureNamedFlag(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const pic = !!r.held?.picture || /·\s*visual/.test(String(ctx?.prevRead ?? ""));
    if (!pic || !r.held) return null;
    const pre = r.screen?.preselected ?? null;
    const panel = r.held.layout?.panels?.find((p) => p.role === "held") ?? null;
    const drawn = panel?.template ?? r.held.pages?.[0]?.template ?? null;
    if (pre?.template && drawn && pre.template !== drawn) return `the picture drew ${drawn}, the plan named ${pre.template}`;
    const want = r.held.intent?.unit ?? null;
    if (panel?.unit && want && panel.unit !== want) return `the held panel is ${panel.unit}, the plan named ${want}`;
    return null;
}

/** P2: where a part's own words start — its recorded start, past any lead sentence the record folded into it (a seam's joint form: the
 *  easier-words line, a back-to line) — the one start every page is read against (c5-t01 stuck 8). */
export function partStartOf(r, p) {
  const t = String(r.text ?? "");
  const forms = (r.seams ?? []).filter((x) => x.joint && x.form).map((x) => String(x.form).replace(/\s+/g, " ").trim().toLowerCase());
  let at = p.from ?? 0;
  for (;;) {
    const rest = t.slice(at);
    const lead = rest.match(/^\s*/)[0].length;
    const f = forms.find((x) => rest.slice(lead).toLowerCase().startsWith(x));
    if (!f) return at + lead;
    at += lead + f.length;
  }
}

import { otherFigureOf, sharesThing } from "../../server/brain/seams.js";
const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en : x) ?? "";

/** P3: a turn that tells an asked step after the step's simpler was said — the second request's answer, as the order rules. */
export function stepToldAfterSimpler(L, r, i, script) {
  if (!r?.stepAnswer?.told) return false;
  const m = /^(.+)-s(\d+):worked:step(\d+)$/.exec(String(r.stepAnswer.beat ?? ""));
  if (!m) return false;
  const sk = (script?.skills ?? []).find((k) => k.skillId === `${m[1]}-s${m[2]}`);
  const simpler = low(said(sk?.workedExample?.steps?.[Number(m[3]) - 1]?.simpler));
  if (!simpler) return false;
  return (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher").some((x) => low(x.text).includes(simpler.slice(0, 40)));
}

const TAUGHT = new Set(["point", "card", "returnCard", "workedProblem", "stepAsk", "remediation", "help", "quickAsk", "quick", "verdict", "missVerdict", "key"]);

/** P6: a turn's help is about another figure — it names a number the card does not (server/brain/seams.js otherFigureOf; c5-t01 stuck 64, 70,
 *  offtopic 30). The help is the row's text from its first help part to its card part (or its end); the card is the row's card. */
export function helpOtherFigure(r, script = null) {
  const pp = r?.pageParts ?? [];
  const h = pp.find((p) => ["simpler", "help"].includes(p.part));
  if (!h || !r?.card) return false;
  const c = pp.find((p) => p.part === "card" && (p.from ?? 0) > (h.from ?? 0));
  const t = String(r.text ?? "");
  const help = t.slice(h.from ?? 0, c ? c.from : t.length);
  // (Brain 046 Q5, c5-t02 steering 10: help said from another wording — a remediation's sayAlt, a point's pointAlt, a problem's problemAlt — is
  // about another figure whatever numbers it names: "Pizza party socho" names none)
  const alts = (() => { const out = []; const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (["sayAlt", "pointAlt", "problemAlt"].includes(k)) out.push(low(said(v)).slice(0, 40)); else walk(v); } }; walk(script ?? {}); return out.filter((x) => x.length >= 20); })();
  if (alts.some((a) => low(help).includes(a)) && !sharesThing(help, String(r.card))) return true;
  // (the card's own ask.simpler counts the card's thing in numbers of its own: about the card — dry offtopic c4 56)
  const own = (script?.skills ?? []).flatMap((k) => (k.explain ?? []).map((b) => low(said(b.ask?.simpler)).slice(0, 40))).filter((x) => x.length >= 20);
  if (own.some((a) => low(help).includes(a))) return false;
  return otherFigureOf(help, String(r.card));
}

/** Brain 046 Q2: the card a row asks (its walk item, else its card's words) → that card's `hindi` form in the script, or null. */
export function hindiFormAt(script, r) {
  const id = String(r?.check?.itemId ?? "");
  const m = /^script:(.+?):(?:ask:(.+)|then:(.+)|([^:]+))$/.exec(id);
  const sk = m ? (script?.skills ?? []).find((k) => k.skillId === m[1]) : null;
  const o = !sk ? null : m[2] === "worked" ? sk.workedExample?.yourStep : m[2] ? (sk.explain ?? []).find((b) => b.id === m[2])?.ask
    : m[3] ? (sk.remediation ?? []).find((x) => x.targets === m[3])?.then : (sk.checks ?? []).find((c) => c.id === m[4]);
  const st = /^stepask:(.+):(\d+)$/.exec(id);
  const o2 = st ? (script?.skills ?? []).find((k) => k.skillId === st[1])?.workedExample?.steps?.[Number(st[2])]?.ask : null;
  const h = (o ?? o2)?.hindi;
  return h ? said(h) : null;
}
/** Brain 046 Q2: whether a row asks its card's `hindi` form — a Hindi request's answer, as the order rules (the form is new words, and the
 *  card's question). */
export function hindiFormSaid(script, r) {
  const f = hindiFormAt(script, r);
  return !!f && low(r?.text).includes(low(f).replace(/[.!?।]+$/, "").slice(0, 60));
}
/** Brain 046 Q4: a turn that holds a right verdict, a new point and its card (a close, a point, a card — the turn's seams). */
const vpcOf = (r) => { const sm = (r?.seams ?? []).map((x) => x.right); const v = sm.indexOf("verdict"), p = sm.indexOf("point"), c = sm.lastIndexOf("card"); return v >= 0 && p > v && c > p; };
const wordsOf = (t) => String(t ?? "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
/** The card a row's close closes, with its full why said in the row: { card, why } or null. */
function fullWhyIn(script, r) {
  const cl = (r?.pageParts ?? []).find((p) => p.part === "close");
  const id = String(cl?.beat ?? "");
  if (!id) return null;
  const t = low(r.text);
  for (const sk of script?.skills ?? []) {
    const c = id.startsWith("then:") ? (sk.remediation ?? []).find((x) => `then:${x.targets}` === id)?.then : (sk.checks ?? []).find((x) => x.id === id) ?? (sk.explain ?? []).find((x) => x.id === id)?.ask;
    const why = low(said(c?.why)).replace(/^(?:kyunki|because)\s+/, "");
    if (c?.whyShort && why && t.includes(why.slice(0, 40))) return { card: c, why };
  }
  return null;
}
/** Brain 046 Q5: the question a turn ends on — its last sentence, where it asks. */
const lastAsk = (r) => { const ss = String(r?.text ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?\u0964])\s+/); const q = ss.at(-1) ?? ""; return /[?？]\s*$/.test(q) ? low(q) : null; };
/** Brain 046 Q6: the script object a compile part id names ("S:e2:card", "S:e2:point", "S:rem:0:then", "S:rem:0", "S:check:c1",
 *  "S:worked:yourStep", "S:worked:problem"), or null. */
export function partObjectOfId(script, part) {
  const m = /^(.+?-s\d+):(.+)$/.exec(String(part ?? ""));
  const sk = m ? (script?.skills ?? []).find((k) => k.skillId === m[1]) : null;
  if (!sk) return null;
  const b = m[2].split(":");
  if (b[0] === "rem") { const r = sk.remediation?.[Number(b[1])]; return b[2] === "then" ? r?.then ?? null : r ?? null; }
  if (b[0] === "check") return (sk.checks ?? []).find((c) => c.id === b[1]) ?? null;
  if (b[0] === "worked") return b[1] === "yourStep" ? sk.workedExample?.yourStep?.board ? sk.workedExample.yourStep : sk.workedExample ?? null : sk.workedExample ?? null;
  const e = (sk.explain ?? []).find((x) => x.id === b[0]);
  return e ? (b[1] === "card" && e.ask?.board ? e.ask : e) : null;
}
/** The card a close's beat names ("e2", "c1", "then:<mix-up>") in any skill, or null. */
function cardOfBeat(script, beat, part = null) {
  const id = String(beat ?? "");
  const S = /^(.+?-s\d+):/.exec(String(part ?? ""))?.[1] ?? null;
  for (const sk of (script?.skills ?? []).filter((k) => !S || k.skillId === S)) {
    const c = id.startsWith("then:") ? (sk.remediation ?? []).find((x) => `then:${x.targets}` === id)?.then : (sk.checks ?? []).find((x) => x.id === id) ?? (sk.explain ?? []).find((x) => x.id === id)?.ask;
    if (c) return c;
  }
  return null;
}
/** Every authored viewCaption in a script, with the object it is written beside. */
function captionsOf(script) {
  const out = [];
  const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== "object") return; if (o.viewCaption) out.push({ o, t: low(said(o.viewCaption)) }); for (const v of Object.values(o)) walk(v); };
  walk(script);
  return out.filter((c) => c.t.length >= 20);
}
/** Brain 046 Q6: the lead-in of a right verdict to its why — ", kyunki", ". Dekho,", a colon — or null. */
export function whyLeadOf(r) {
  if (!(r?.seams ?? []).some((x) => x.right === "verdict")) return null;
  const t = String(r.text ?? "");
  return /^[^.?!:]{3,40}, kyunki /.test(t) ? "kyunki" : /^[^.?!:]{3,40}\. Dekho, /.test(t) ? "dekho" : /^[^.?!:]{3,25}: /.test(t) ? "colon" : null;
}
export const D30_PREDICATES = {
  /** dc-r8-director30 Brain 046 Q6: a picture's caption is the one written for the part the picture is of — never another part's caption
   *  found by an identical board (c5-t01 offtopic 26: e2's caption on a follow-up card; c4 steady 18: the point's on the card's). Gated. */
  captionPart(L, r, i, ctx) {
    if (r.who !== "teacher" || String(r.cell?.column ?? "") !== "picture" || !ctx?.script) return null;
    const own = partObjectOfId(ctx.script, r.cell?.part);
    if (!own) return null;
    const t = low(r.text);
    const hit = captionsOf(ctx.script).find((c) => t.includes(c.t.slice(0, 50)));
    return hit && hit.o !== own && low(said(own.viewCaption)).slice(0, 50) !== hit.t.slice(0, 50) ? `another part's caption said on ${r.cell.part}: "${hit.t.slice(0, 50)}"` : null;
  },
  /** Q6: `whyShort` is on a row only where the card's short reason was said in the full why's place (c5-t02 steady 50, 66, 92, 94, stuck 74,
   *  offtopic 52, 76: set because the short text sits inside the full why). Gated. */
  whyShortSet(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.whyShort) return null;
    const t = low(r.text).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ");
    const k = (x) => low(x).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim().replace(/^(?:kyunki|because)\s+/, "");
    const cl = (r.pageParts ?? []).find((p) => p.part === "close");
    if (!cl) return null;
    const card = cardOfBeat(ctx?.script, cl.beat, r.cell?.part);
    return card?.why && t.includes(k(said(card.why)).slice(0, 40)) ? "whyShort on a row that said the full why" : null;
  },
  /** Q6: every teacher row that answers a child's line has its cell (c5-t01 and c5-t02 stuck 22, a "haan"). Gated. */
  cellMissing(L, r, i) {
    if (r.who !== "teacher" || r.cell || (L.rows ?? [])[i - 1]?.who !== "child") return null;
    return "a teacher row with no cell";
  },
  /** Q6: a miss is recorded as a miss, never `verdict` (c5-t02 steady 98: the closing question's miss). Gated. */
  missAsVerdict(L, r, i, ctx) {
    if (r.who !== "teacher" || !/^(?:incorrect|partial|misconception)\b/.test(String(ctx?.prevRead ?? ""))) return null;
    if (!(r.seams ?? []).some((x) => x.right === "verdict")) return null;
    const s0 = String(r.text ?? "").split(/(?<=[.!?\u0964])\s+/)[0] ?? "";
    return /(?<![\p{L}])(?:sahi\s+nahi|nahi\s+hai|galat|theek\s+nahi)(?![\p{L}])/iu.test(s0) && !/^(?:haan|bilkul|sahi)\b/i.test(s0) ? `a miss recorded as verdict: "${s0.slice(0, 50)}"` : null;
  },
  /** Q6: the verdict's lead-in to its why ("Dekho,", "kyunki", a colon) is not the one of the verdict before it. Gated. */
  whyLeadRunning(L, r, i, ctx) {
    const f = whyLeadOf(r);
    // (a right verdict with no lead-in — a worked close said short — stands between two: they are not running)
    if (!f) { if ((r.seams ?? []).some((x) => x.right === "verdict") && /^(?:haan|bilkul|sahi)\b/i.test(String(r.text ?? ""))) ctx.prevWhyLead = null; return null; }
    const p = ctx.prevWhyLead ?? null;
    ctx.prevWhyLead = f;
    return p === f ? `the why's lead-in "${f}" in two verdicts running` : null;
  },
  /** dc-r8-director30 Brain 046 Q5: a worked example's close going into the next card (or its point) says joints.afterWorked between them
   *  (c5-t01 steady 26, 56, stuck 34, offtopic 48, steering 36; c5-t02 steady 26, 64, 82, stuck 34, offtopic 72, steering 36). Gated. */
  workedSeam(L, r) {
    if (r.who !== "teacher") return null;
    const pp = r.pageParts ?? [], c = pp.findIndex((p) => p.part === "close" && p.beat === "worked");
    if (c < 0 || !["card", "body"].includes(pp[c + 1]?.part ?? "") || /^(?:worked|rem:)/.test(String(pp[c + 1]?.beat ?? ""))) return null;
    // (a wrong answer's close into its remediation takes beforeRemediation, never this seam)
    if ((r.seams ?? []).some((x) => x.right === "missVerdict" || x.right === "remediation")) return null;
    return (r.seams ?? []).some((x) => x.joint === "afterWorked") ? null : "a worked example's close into the next card with no afterWorked seam";
  },
  /** dc-r8-director30 Brain 046 Q5: no re-ask sentence is said in two turns running — the question a turn ends on, the same as the turn of
   *  hers before it ended on, on the same card (c5-t01 steady 8, stuck 62, 70, 72, offtopic 22, 62, steering 10; c5-t02 steady 88, 90; c6
   *  steady 88; c4 steering 14, 16). Gated. A question of two words or fewer, and her return or AI question, is no re-ask. */
  reaskRunning(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx?.prevT || !r.card) return null;
    // (a request for Hindi at a card with no hindi form is answered as before — Q2's fallback, counted by hindiSpentHole)
    if (String(ctx?.prevIntent ?? "") === "hindi" && !hindiFormAt(ctx?.script, r)) return null;
    // (and the card's `hindi` form said to a request for Hindi is no re-ask: the order keeps it out of the rotation — the form is said as
    // written, whatever question it ends on; dry steady c5-t01 36, c3's form ends on the card's own question)
    if (String(ctx?.prevIntent ?? "") === "hindi" && hindiFormSaid(ctx?.script, r)) return null;
    const q = lastAsk(r), p = lastAsk(ctx.prevT);
    if (!q || q !== p || q.split(" ").length < 4) return null;
    if (low(r.card) !== low(ctx.prevT.card ?? "") && String(r.check?.itemId ?? "") !== String(ctx.prevT.check?.itemId ?? "-")) return null;
    return `the same re-ask two turns running: "${q.slice(0, 60)}"`;
  },
  /** dc-r8-director30 Brain 046 Q4: a verdict, a point and a card in one turn over 65 words says the card's short reason where it has one
   *  (c4 steady 42, stuck 64, steering 56; c5-t02 stuck 74, offtopic 52). Gated. */
  vpcLong(L, r, i, ctx) {
    if (r.who !== "teacher" || !vpcOf(r) || wordsOf(r.text) <= 65) return null;
    return fullWhyIn(ctx?.script, r) ? `a verdict, a point and a card in ${wordsOf(r.text)} words with the full why, where the card has a short one` : null;
  },
  /** Q4: a skill's bridge never rides in a turn that holds a verdict, a point and a card — it goes with the verdict (c4 steady 42, stuck 64,
   *  steering 56). Gated. */
  vpcBridge(L, r) {
    if (r.who !== "teacher" || !vpcOf(r) || !(r.seams ?? []).some((x) => x.right === "bridge")) return null;
    return `a bridge in a verdict-point-card turn (${(r.seams ?? []).map((x) => x.right).join(" > ")})`;
  },
  /** dc-r8-director30 Brain 046 Q2: the "nothing easier" line (helpSpent) is never the answer to a request for Hindi — the card's `hindi` form
   *  is (c4, c5-t02, c6 offtopic 32). Gated. */
  hindiSpentCold(L, r, i, ctx) {
    if (r.who !== "teacher" || String(ctx?.prevIntent ?? r.cell?.column ?? "") !== "hindi" && String(r.cell?.column ?? "") !== "hindi") return null;
    if (!(r.seams ?? []).some((x) => x.joint === "helpSpent")) return null;
    return hindiFormAt(ctx?.script, r) ? "a request for Hindi answered with the \"nothing easier\" line" : null;
  },
  /** Q2's code fallback, counted: a request for Hindi answered with the "nothing easier" line at a card whose script has no `hindi` form yet
   *  (a compile hole until Learning 019). Pending. */
  hindiSpentHole(L, r, i, ctx) {
    if (r.who !== "teacher" || String(ctx?.prevIntent ?? r.cell?.column ?? "") !== "hindi" && String(r.cell?.column ?? "") !== "hindi") return null;
    if (!(r.seams ?? []).some((x) => x.joint === "helpSpent")) return null;
    return hindiFormAt(ctx?.script, r) ? null : "a request for Hindi answered with the \"nothing easier\" line (the card has no hindi form)";
  },
  /** P6: the short ask ("Ab phir se socho, jawab kya hoga?") only after help about the card's own figure — help about another figure is
   *  followed by the card's own re-ask (c5-t01 stuck 64, 70, offtopic 30). Gated. */
  reaskFigure(L, r, i, ctx) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.right === "reaskShort")) return null;
    return helpOtherFigure(r, ctx?.script) ? "the short ask after help about another figure" : null;
  },
  /** P6: a turn that holds her reply to an aside never ends on a check-in, whatever follows the reply (c4 offtopic 46: reply, bridge, point,
   *  check-in; c5-t02 offtopic 38: reply, point, check-in). Gated (Brain 046 Q3): where the card is held for a due return the turn ends on the return's question. */
  replyCheckin(L, r) {
    if (r.who !== "teacher") return null;
    const sm = r.seams ?? [];
    // (a worked example that asks no step ends each told step on its own step check-in — that walk's, read by workedCheckin: the
    // point-card fixture's steering c4 38)
    if (sm.at(-2)?.right === "workedStep") return null;
    return sm.some((x) => ["asideReply", "aiReply"].includes(x.right)) && sm.at(-1)?.right === "checkin" ? `her reply's turn (${sm.map((x) => x.right).join(" > ")}) ends on a check-in` : null;
  },
  /** P4: the "nothing easier" line is never said before something has been taught (row 4 in stuck c4, c5-t02, c6; offtopic c4; steering c4,
   *  c5-t02, c6: a second request at the greeting). */
  helpSpentCold(L, r, i) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => x.joint === "helpSpent")) return null;
    const UNIT = /^(?:e\d+|rem:|then:|worked|check|c\d)/;
    const taught = (L.rows ?? []).slice(0, i).some((x) => x.who === "teacher" && (x.pageParts ?? []).some((p) => ["body", "card", "simpler", "stepAsk", "quick"].includes(p.part) && UNIT.test(String(p.beat ?? ""))));
    return taught ? null : "the \"nothing easier\" line with nothing taught before it";
  },
  /** P3: at an asked worked step a give-up or a clarify gets the step's simpler first; the step is told only at the second request or after
   *  a wrong answer (c4 stuck 36; c5-t01 stuck 20; c5-t02 stuck 20, offtopic 16, steering 28; c6 stuck 20, offtopic 16, steering 28). */
  // (dc-r8-director30 Brain 046 Q1: and read on its cue as keyEarly reads a key's — a step is told only at a second request (a give-up or a
  // clarify, its simpler said) or after a wrong answer to it; never after a yes, an aside, a remark or anything else: c5-t01 stuck 22,
  // c5-t02 stuck 22, offtopic 18, c6 stuck 22, offtopic 18)
  stepToldEarly(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.stepAnswer?.told) return null;
    const req = String(ctx?.prevIntent ?? r.cell?.column ?? "");
    const wrong = /^(?:incorrect|partial|misconception)\b/.test(String(ctx?.prevRead ?? "")) || !!r.stepAnswer.miss || ["wrong", "misconception"].includes(String(r.cell?.column ?? ""));
    if (wrong) return null;
    if (!["give_up", "clarify"].includes(req) && !["give_up", "clarify"].includes(String(r.cell?.column ?? ""))) return `the step told on a cue that is no request and no wrong answer (${req || r.cell?.column || "none"}: "${String(ctx?.prevChild ?? "").slice(0, 30)}")`;
    const m = /^(.+)-s(\d+):worked:step(\d+)$/.exec(String(r.stepAnswer.beat ?? ""));
    if (!m) return null;
    const sk = (ctx.script?.skills ?? []).find((k) => k.skillId === `${m[1]}-s${m[2]}`);
    const simpler = low(said(sk?.workedExample?.steps?.[Number(m[3]) - 1]?.simpler));
    if (!simpler) return null;
    const before = (L.rows ?? []).slice(0, i).filter((x) => x.who === "teacher").map((x) => low(x.text)).join(" ");
    return before.includes(simpler.slice(0, 40)) ? null : `the step ${m[3]} told at a ${req} with its simpler unsaid`;
  },
};
