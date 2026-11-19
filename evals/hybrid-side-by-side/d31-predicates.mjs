// dc-r8-director31 (docs/patches/to-brain/047): the predicates Brain 047 adds, each written from the order's law and pinned non-zero on its
// director31 rows (tests/r8-director31-047.test.mjs, replayed with the run's own script snapshot) before it is trusted to read 0 on the dry
// matrix.
//   falseReturn   R1: a back-to joint before a card whose walk item was never said before
//   shortAskKind  R2: the short ask said other than straight after the card's own hint or easier wording, after a turn that ended on the
//                 card's question, on a card that does not ask for an imagined change
//   stepAskRunning R3: the same asked step's or closing question's sentence ending three of her turns running
import { cardObjAt } from "./d30-predicates.mjs";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en : x) ?? "";
const qKey = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const sentencesOf = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?\u0964])\s+/).filter(Boolean);
const lastAsk = (r) => { const q = sentencesOf(r?.text).at(-1) ?? ""; return /[?？]\s*$/.test(q) ? qKey(q) : null; };
/** The asked worked step a row asks (its cell's part "<skill>:worked:step<n>[:ask]"), or null. */
export function stepAskObjAt(script, r) {
  const cp = /^(.+?-s\d+):worked:step(\d+)(?::ask)?$/.exec(String(r?.cell?.part ?? ""));
  return cp ? (script?.skills ?? []).find((k) => k.skillId === cp[1])?.workedExample?.steps?.[Number(cp[2]) - 1] ?? null : null;
}
/** R2: the card (or asked step) a row asks, as { o, prompt, reask } — o carries `simpler` and `askWhole` — or null. */
function askedOf(script, r) {
  const step = (r?.pageParts ?? []).some((p) => p.part === "stepAsk") ? stepAskObjAt(script, r) : null;
  if (step?.ask) return { o: { simpler: step.simpler, askWhole: step.ask.askWhole }, prompt: step.ask.prompt, reask: step.ask.reask };
  const o = cardObjAt(script, r);
  return o ? { o, prompt: o.prompt, reask: o.reask } : null;
}
/** R2: whether the help a row says last, straight before its question, is the card's own hint or easier wording. */
export function ownHelpLast(r, script) {
  const a = askedOf(script, r);
  const own = a ? qKey(said(a.o.simpler)) : "";
  if (!own) return false;
  const pp = r?.pageParts ?? [];
  const isH = (p) => ["simpler", "help"].includes(p.part);
  const h0 = pp.findIndex(isH), hz = pp.map(isH).lastIndexOf(true);
  if (h0 < 0) return false;
  const t = String(r.text ?? "");
  return qKey(t.slice(pp[h0].from ?? 0, pp[hz + 1]?.from ?? t.length)).endsWith(own);
}

/** R1: whether an earlier teacher row said this row's card — the same walk item, its card's words in that row's text. */
function cardSaidEarlier(L, r, i) {
  const id = String(r?.check?.itemId ?? "");
  if (!id) return null;
  const head = low(r.card).slice(0, 30);
  return (L.rows ?? []).slice(0, i).some((x) => x.who === "teacher" && String(x.check?.itemId ?? "") === id && (!head || low(x.text).includes(head) || low(x.text).includes(low(x.card).slice(0, 30))));
}

/** R3: the last sentences (keyed) of every asked step's question and reask, and of the closing question and its reask, each with whether
 *  its question has an authored reask: Map<key, hasReask>. */
function stepQuestionsOf(script) {
  const out = new Map();
  const add = (x, has) => { for (const t of [x?.hi ?? (typeof x === "string" ? x : null), x?.en]) { const q = sentencesOf(t ?? "").at(-1); if (q && /[?？]\s*$/.test(q)) out.set(qKey(q), has || !!out.get(qKey(q))); } };
  const both = (a) => { const has = !!(a?.reask?.hi ?? a?.reask?.en ?? (typeof a?.reask === "string" ? a.reask : null)); add(a?.prompt, has); add(a?.reask, has); };
  for (const k of script?.skills ?? []) for (const st of k.workedExample?.steps ?? []) if (st?.ask?.prompt) both(st.ask);
  if (script?.teachback?.prompt) both(script.teachback);
  return out;
}
/** R3: the step or closing question a row ends on three of her turns running, as { q, has } (has: it has an authored reask), or null. */
function stepAskRun(r, ctx) {
  if (r.who !== "teacher" || !ctx?.prevT || !ctx?.prevPrevT) return null;
  const q = lastAsk(r);
  if (!q || q !== lastAsk(ctx.prevT) || q !== lastAsk(ctx.prevPrevT)) return null;
  const qs = (ctx.o.stepQs ??= stepQuestionsOf(ctx.script));
  return qs.has(q) ? { q, has: qs.get(q) } : null;
}
export const D31_PREDICATES = {
  /** Brain 047 R3: no asked step's question and no closing question ends three of her turns running — it alternates with its authored reask
   *  (director31 c5-t01 stuck 16 to 22; c5-t02 stuck 16 to 22, offtopic 14 to 18, steering 28 to 32; c6 stuck 18 to 22, offtopic 14 to 18;
   *  c5-t03 stuck 16 to 22; c6-ch07-t01 stuck 16 to 22; c4-ch01-t02 offtopic 10 to 16). Gated. */
  stepAskRunning(L, r, i, ctx) {
    const x = stepAskRun(r, ctx);
    return x ? `the same step or closing question three turns running${x.has ? "" : " (it has no reask)"}: "${x.q.slice(0, 60)}"` : null;
  },
  /** Brain 047 R2: the short ask ("Ab phir se socho, jawab kya hoga?") only straight after the card's own hint or easier wording, in a turn
   *  after one that ended on that card's question or re-ask, on a card that is not `askWhole` — never after another wording of the part, a
   *  picture's caption, "Haan, pehle tum try karo." or a bridge (director31 c4 stuck 18, steering 30; c4-ch01-t02 steady 86, stuck 44, 60,
   *  offtopic 56, steering 52; c5-t02 steering 16; c6 stuck 74, steering 20; c5-t03 steering 14, offtopic 14). Gated. */
  shortAskKind(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const sm = r.seams ?? [];
    const at = sm.findIndex((x) => x.right === "reaskShort");
    if (at < 0) return null;
    if (sm[at].left !== "help") return `the short ask after ${sm[at].left}`;
    const a = askedOf(ctx?.script, r);
    if (!a) return null;
    if (a.o.askWhole) return "the short ask on a card whose question asks for an imagined change";
    if (!ownHelpLast(r, ctx?.script)) return "the short ask after another wording than the card's own";
    const prevQ = lastAsk(ctx?.prevT);
    const forms = [sentencesOf(said(a.prompt)).at(-1), sentencesOf(said(a.reask)).at(-1), sentencesOf(r.card ?? "").at(-1)].filter(Boolean).map(qKey);
    return prevQ && forms.includes(prevQ) ? null : "the short ask where her turn before did not end on the card's question";
  },
  /** Brain 047 R1: "back to the earlier question" is said by the card's identity — never before a card whose walk item no turn before said
   *  (director31 c4-ch01-t02 steady 34, 72, 102; stuck 48; offtopic 30; steering 32). Gated. */
  falseReturn(L, r, i) {
    if (r.who !== "teacher" || !(r.seams ?? []).some((x) => ["backTo", "afterKeyReturn"].includes(x.joint))) return null;
    const said = cardSaidEarlier(L, r, i);
    return said === false ? `a back-to joint before a card never asked (${String(r.check?.itemId ?? "").split(":").slice(-2).join(":")})` : null;
  },
};
