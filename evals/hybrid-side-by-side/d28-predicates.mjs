// dc-r8-director27, Brain 042 (docs/patches/to-brain/042-child-does-something.md): where she asked "samajh aaya?", the child now does
// something. The predicates are written from the work order's sentences, not from director27's shapes (fd-predicate-must-fail-on-judges-rows,
// fd-predicate-proved-on-last-runs-fault); tests/r8-director27-042-predicates.test.mjs pins each on the director27 rows it is written for, or
// on rows built to break it where director27 had no such turn. Merged into dry-predicates.mjs's PREDICATES, gated at 0. Pure.
//
//   quickBeforeCard  a turn that ends on a comprehension check-in while the same beat's card is the next thing she says (the check-in after
//                    help, a told step's simpler, stays: such a turn holds a help part)
//   workedCheckin    a worked example's turn — one that says the worked problem or a worked step — ending on a check-in with no told step's
//                    simpler in it
//   quickGraded      every answer to a quick question is followed by the short yes (right) or the quick question's `say` (anything else),
//                    and then the card — no hint, no verdict naming the answer, no second try
//   quickGiveaway    a quick question's `say`, or an asked step's `right`, never says the card's key or the child's own step's key (the
//                    checker holds the same on the script: scripts/lesson-scripts/check.mjs d27Errors)
//   quickPoint       d28 guards: a point's quick question is never asked before its point was said whole (live director28a: two turns)
//   pictureCaption   E3: a picture asked for after a key or a verdict is said in the script's own words for the view drawn — a card's
//                    `viewCaption` or `answerViewCaption` — never a code-written caption
import { sentencesOf, normSentence } from "../../server/director/help.js";
import { FRAMES } from "../../server/brain/say.js";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const low = (t) => norm(t).toLowerCase();
/** A turn's last sentence is a comprehension check-in (brain/say.js BEAT_ASK and WORKED_ASK, both languages). */
const CHECKIN_END = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear|Did that step make sense)\?$/i;
const endsOnCheckin = (r) => CHECKIN_END.test(norm(r.text));
const parts = (r) => r.pageParts ?? [];
const nextTeacher = (L, i) => (L.rows ?? []).slice(i + 1).find((x) => x.who === "teacher") ?? null;
/** The phrase forms of a value in a text, as whole words. */
const says = (text, value) => { const v = low(value).replace(/[^\p{L}\p{N}/.]+/gu, " ").trim(); if (!v) return false; return ` ${low(text).replace(/[^\p{L}\p{N}/.]+/gu, " ")} `.includes(` ${v} `); };
/** The skill a row's beat or card belongs to. */
function skillOf(r, script) {
  const m = /^script:(.+?):/.exec(String(r.check?.itemId ?? "")) ?? /^(.+?):(?:e\d+|worked)/.exec(String(r.quickAnswer?.beat ?? r.stepAnswer?.beat ?? r.cell?.part ?? ""));
  if (m) return m[1];
  const n = /^s(\d+):/.exec(String(r.beat ?? ""))?.[1];
  return n ? script?.skills?.[+n - 1]?.skillId ?? null : null;
}
/** Every authored caption of a script (a view's or an answer view's), as normalised sentences. */
function captionsOf(script) {
  const out = new Set();
  const walk = (o) => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk);
    for (const k of ["viewCaption", "answerViewCaption"]) for (const t of [o[k]?.hi, o[k]?.en]) if (t) for (const x of sentencesOf(t)) out.add(normSentence(x));
    for (const v of Object.values(o)) walk(v); };
  walk(script);
  return out;
}

export const D28_PREDICATES = {
  /** Q1: a check-in before a waiting card — the turn says the point (or a held part ending on its point) and ends on a check-in, and the
   *  next thing she says is that point's card. A help part (her other wording, a told step's simpler) in the turn makes it help's check-in. */
  quickBeforeCard(L, r, i, ctx) {
    if (r.who !== "teacher" || !endsOnCheckin(r)) return null;
    // (Brain 044 T1: a point and its card that do not fit, with no quick question that fits, end on the point's check-in — the row says so and
    // d29's pointNoFit counts it)
    if (r.noFit) return null;
    const pp = parts(r);
    if (pp.some((p) => p.part === "simpler")) return null;
    const last = [...pp].reverse().find((p) => ["body", "held"].includes(p.part) && /^e\d+$/.test(String(p.beat ?? "")));
    if (!last) return null;
    // (the device is the script's: a point with no quick question — a script before Learning 016, the 30 staged — keeps its check-in)
    const sk = (ctx?.script?.skills ?? []).find((k) => k.skillId === skillOf(r, ctx.script));
    if (ctx?.script && !sk?.explain?.find((b) => b.id === last.beat)?.quick) return null;
    // (the card is the next part of the lesson she says: help on this point between them — a request at the check-in — moves nothing on)
    for (const nx of (L.rows ?? []).slice(i + 1).filter((x) => x.who === "teacher")) {
      const np = parts(nx).filter((p) => !["aside", "quickReply"].includes(p.part));
      const card = np.find((p) => p.part === "card");
      if (card) return card.beat === last.beat && np.every((p) => p.beat === last.beat) ? `a check-in before the ${last.beat} card, said next` : null;
      if (np.some((p) => p.beat !== last.beat)) return null;
    }
    return null;
  },
  /** Q2: no turn of a worked example ends on a check-in — only a told step's simpler (help on a step) may end on one. */
  workedCheckin(L, r, i, ctx) {
    if (r.who !== "teacher" || !endsOnCheckin(r)) return null;
    // (Brain 047 R4: no check-in between a worked example's problem and its close, on any path — her turn before asked a step, and this one
    // ends on a check-in: director31 c6 steering 32, a reason read as a request for easier words)
    if ((ctx?.prevT?.pageParts ?? []).some((p) => p.part === "stepAsk") && !/^(?:wrap|safeguard|break|done)$/.test(String(r.move?.kind ?? r.move ?? ""))) return "a check-in while a worked example's step is asked";
    const pp = parts(r);
    if (pp.some((p) => p.part === "simpler")) return null;
    // (a worked example that asks no step — a script before Learning 016, the 30 staged — is told as before)
    const sk = (ctx?.script?.skills ?? []).find((k) => k.skillId === skillOf(r, ctx.script));
    if (ctx?.script && !(sk?.workedExample?.steps ?? []).some((x) => x?.ask)) return null;
    const w = pp.find((p) => ["body", "held"].includes(p.part) && /^worked(?::(?:problem|step\d+))?$/.test(String(p.beat ?? "")));
    return w ? `a worked example's turn (${w.beat}) ending on a check-in` : null;
  },
  /** Q1: an answer to a quick question (or a give-up) gets the short yes, or the quick question's `say`, then the card of that point. */
  quickGraded(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx.prevT || !parts(ctx.prevT).some((p) => p.part === "quick")) return null;
    const intent = String(ctx.prevIntent ?? "");
    const answered = /^(?:correct|incorrect|partial|misconception)/.test(String(ctx.prevRead ?? "")) || ["right", "miss", "give_up"].includes(intent);
    if (!answered || /·/.test(String(ctx.prevRead ?? ""))) return null;
    const qBeat = parts(ctx.prevT).find((p) => p.part === "quick")?.beat;
    const pp = parts(r);
    if (pp[0]?.part !== "quickReply") return `the answer to the ${qBeat} quick question got ${pp[0]?.part ?? "no part"} first, not the short yes or its say`;
    if (pp[1]?.part !== "card" || pp[1]?.beat !== qBeat) return `the ${qBeat} quick question's reply is not followed by its card`;
    const reply = norm(String(r.text ?? "").slice(pp[0].from ?? 0, pp[1].from ?? undefined));
    const right = /^correct/.test(String(ctx.prevRead ?? ""));
    const yes = [...(FRAMES.right.hinglish ?? []), ...(FRAMES.right.english ?? [])].some((f) => low(reply).replace(/[.!]+$/, "") === low(f));
    if (right && !yes) return `a right quick answer got "${reply.slice(0, 40)}", not the short yes`;
    if (!right && yes) return `a quick answer that is not right got the short yes`;
    if (!right) {
      const S = skillOf(r, ctx.script);
      const q = (ctx.script?.skills ?? []).find((k) => k.skillId === S)?.explain?.find((b) => b.id === qBeat)?.quick;
      if (q && ![q.say?.hi, q.say?.en].filter(Boolean).some((t) => normSentence(t) === normSentence(reply))) return `the ${qBeat} quick answer got "${reply.slice(0, 40)}", not its authored say`;
    }
    return null;
  },
  /** Q1/Q2: the line said after a quick question or an asked step never gives the card's key, or the child's own step's key. */
  quickGiveaway(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx.script) return null;
    const pp = parts(r);
    const t = String(r.text ?? "");
    const S = skillOf(r, ctx.script);
    const sk = (ctx.script.skills ?? []).find((k) => k.skillId === S);
    if (!sk) return null;
    const qr = pp.findIndex((p) => p.part === "quickReply");
    if (qr >= 0) {
      const line = t.slice(pp[qr].from ?? 0, pp[qr + 1]?.from ?? undefined);
      const card = sk.explain?.find((b) => b.id === pp[qr].beat)?.ask;
      if (card?.key && says(line, card.key)) return `the ${pp[qr].beat} quick question's line says the card's key ${card.key}`;
    }
    if (r.stepAnswer?.right && sk.workedExample?.yourStep?.key) {
      const st = pp.find((p) => p.part === "body" && /^worked:step\d+$/.test(String(p.beat ?? "")));
      const line = st ? t.slice(st.from ?? 0, pp[pp.indexOf(st) + 1]?.from ?? undefined) : "";
      if (line && says(line, sk.workedExample.yourStep.key)) return `an asked step's right line says the child's own step's key ${sk.workedExample.yourStep.key}`;
    }
    return null;
  },
  /** E3: a picture asked for after a key or a verdict is captioned in the script's own words. */
  pictureCaption(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx.script || !/·\s*visual/.test(String(ctx.prevRead ?? "")) || !ctx.prevT || ctx.prevT.card) return null;
    const closed = parts(ctx.prevT).some((p) => ["close", "closed"].includes(p.part)) || /(?:sahi jawab|jawab hai|jawab:|kyunki)/i.test(String(ctx.prevT.text ?? ""));
    if (!closed) return null;
    const caps = (ctx.o.d28Caps ??= captionsOf(ctx.script));
    // (d31: an answer board with no second view — the staged c4-ch01-t02's shape@1 — needs no answerViewCaption (Learning 019's standard);
    // the board is redrawn alone and she says the keyed card's authored why on it (state.js pictureAlone, pictureWords): authored words)
    const whys = (ctx.o.d31Whys ??= (() => { const out = new Set(); const walk = (o) => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk);
      if (o.answerBoard && o.why) for (const t of [o.why.hi, o.why.en]) if (t) for (const x of sentencesOf(t)) out.add(normSentence(x).replace(/^(?:kyunki|because) /, ""));
      for (const v of Object.values(o)) walk(v); }; walk(ctx.script); return out; })());
    const ss = sentencesOf(norm(r.text)).map(normSentence).filter((x) => !CHECKIN_END.test(x + "?"));
    const own = ss.filter((x) => x && !/^(?:yahan tak|ab tak|yeh hissa|yeh kadam|does that|clear so|all good|is that)/.test(x));
    if (!own.length) return "a picture after a key with no caption";
    return own.some((x) => caps.has(x) || whys.has(x)) ? null : `a picture after a key captioned in code's words: "${norm(r.text).slice(0, 50)}"`;
  },
  /** d28 guards (the law: on a scripted turn what is said is the walk's authored parts, whole and in order): a point's quick question asks
   *  what its point has just said, so it is never asked before that point was said whole — in this turn or an earlier one of hers. Live,
   *  director28a steady c5-t02 row 2 and steady c4 row 106 asked the quick question of a point a guard path had dropped (the hook, or the
   *  verdict and its why, then the quick question). authoredWhole reads a unit started and changed; partOnce, a card posed with its point
   *  never said: neither reads a quick question, and a point dropped whole is no unit started. Read from the text and the script alone. */
  quickPoint(L, r, i, ctx) {
    if (r.who !== "teacher" || !ctx.script) return null;
    const qs = (ctx.o.d28Quick ??= (ctx.script.skills ?? []).flatMap((sk) => (sk.explain ?? []).filter((b) => b.quick?.prompt).map((b) => ({
      id: `${sk.skillId}:${b.id}`, prompts: [b.quick.prompt.hi, b.quick.prompt.en].filter(Boolean).map(normSentence),
      // (the point, else its other wording, else the simpler said in its place: any one of them said whole)
      ways: [b.point, b.pointAlt, b.simpler, b.ask?.simpler].flatMap((v) => [v?.hi, v?.en]).filter(Boolean).map((t) => sentencesOf(t).map(normSentence).filter(Boolean)).filter((x) => x.length) }))));
    const T = sentencesOf(norm(r.text)).map(normSentence);
    const said = new Set([...(ctx.o.teacherTexts ?? []).flatMap((t) => sentencesOf(norm(t)).map(normSentence)), ...T]);
    // (two beats may share a quick question's words — c5-t02 s1 e2 and s3 e1: the question is answered for when either one's point was said)
    const asked = qs.filter((q) => q.prompts.some((p) => T.includes(p)));
    const byPrompt = new Map();
    for (const q of asked) for (const p of q.prompts.filter((x) => T.includes(x))) byPrompt.set(p, [...(byPrompt.get(p) ?? []), q]);
    for (const [, cands] of byPrompt) {
      if (cands.some((q) => !q.ways.length || q.ways.some((w) => w.every((x) => said.has(x))))) continue;
      return `the ${cands.map((q) => q.id.split(":").pop()).join("/")} quick question asked with its point never said whole`;
    }
    return null;
  },
};
