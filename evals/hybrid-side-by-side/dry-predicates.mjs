// dc-r7-script-walk-v6-11 G2 (main's director19 judgement): the dry matrix is a gate. These predicates run over every lesson of the
// dry matrix (evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --dry: the 16 pilot lessons, the rule-based child, the
// model stubbed, no network) and name each fault director19 found. tests/r7-dry-matrix.test.mjs runs the matrix inside test:all and
// fails on any flag. Every predicate was seen failing on the tree before its fix (counts in the v6.11 step-1 report). Pure.
//
// A lesson is { topicId, persona, rows } (the harness's director rows), with the topic's lesson script (`script`, for its joints).

import { readFileSync } from "node:fs";

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const low = (t) => norm(t).toLowerCase();
const sentencesOf = (t) => norm(t).split(/(?<=[.!?।])\s+(?=\S)/).map((x) => x.trim()).filter(Boolean);
const key = (t) => low(t).replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const words = (t) => norm(t).split(" ").filter(Boolean).length;
const cardIn = (r) => !!r?.card && low(r.text).includes(low(r.card).slice(0, 30));

const REPOSE = /^(?:Phir se dekho|Ek baar aur dekho|Ek baar phir dekho|Look again|One more look)\s*:/i;
const KEY_SAID = /(?:is sawaal ka|iska|yahan|pichhle sawaal ka|woh wala:?) (?:sahi )?jawab|sahi jawab:|the answer (?:here )?(?:is|was)|iska jawab hai/i;
const GIVE_UP = /\b(?:aap batao|aap hi batao|tum batao|batao na|nahi pata,? aap|pata nahi,? aap|give up|i give up|chhodo|nahi aata)\b/i;
/** Any give-up: "pata nahi" bare, "mujhe nahi pata", "aap batao", "nahi aata"… (a request for the answer, or not knowing it). */
const GIVE_UP_ANY = /(?<![\p{L}])(?:pata\s+nahi|nahi\s+pata|aap\s+(?:hi\s+)?batao|tum\s+batao|i\s+(?:don'?t|do\s+not)\s+know|give\s+up|chhodo|nahi\s+aata)(?![\p{L}])/iu;
const CLARIFY = /\b(?:samajh nahi aaya|samajh nahi aa raha|samjha nahi|samjhi nahi|didn'?t understand|don'?t understand|kya matlab)\b/i;
const CHECKIN = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya)|Does that make sense so far|Clear so far|All good so far|Is that (?:part|step) clear)\?\s*$/i;
const RET_STOP = new Set(["maine", "mujhe", "mera", "meri", "mere", "aapko", "tumhe", "hain", "kyunki", "jab", "woh", "sabse", "lagti", "lagta", "with", "that", "this", "have", "when"]);
const TASTE = /(?<![\p{L}])(?:mujhe\s+(?:bhi\s+)?\S+(?:\s+\S+)?\s+pasand|meri\s+favourite|mera\s+favourite|mujhe\s+(?:bhi\s+)?achha\s+lagta|i\s+(?:also\s+)?(?:love|like|enjoy)|my\s+favou?rite)/iu;
const JOINT_ONLY = /^(?:achha|theek hai|hmm,? achha|okay|alright|right|haan)[.!,]?$/i;
/** English words and their Hindi twins: Learning's one list (data/lesson-twins.json, also read by scripts/lesson-scripts/check.mjs and
 *  by server/brain/say.js). Each side's forms longest first, so "number line" is tried before "line". */
const twinRe = (forms) => new RegExp(`(?<![\\p{L}])(?<!question\\s)(?:${[...forms].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")).join("|")})(?![\\p{L}])`, "iu");
export const TWINS = JSON.parse(readFileSync(new URL("../../data/lesson-twins.json", import.meta.url), "utf8")).twins
  .map((t) => ({ en: t.en, hi: t.hi, enRe: twinRe(t.en), hiRe: twinRe(t.hi) }));

/** Each predicate: (lesson, row, i, ctx) → reason or null. ctx = { prevT, prevChild, script, saidCards, jointUse }. */
export const PREDICATES = {
  /** A sentence said twice in one turn. */
  doubledSentence(L, r) {
    const seen = new Set();
    for (const s of sentencesOf(r.text)) { const k = key(s); if (words(s) < 3) continue; if (seen.has(k)) return `said twice: "${s}"`; seen.add(k); }
    return null;
  },
  /** A joint form used twice before another form of its kind was used once (the rotation does not reach the joints). */
  jointRotation(L, r, i, ctx) {
    for (const [kind, forms] of Object.entries(ctx.jointHeads)) {
      const hit = forms.findIndex((h) => h && low(r.text).includes(h));
      if (hit < 0) continue;
      const use = (ctx.jointUse[kind] ??= forms.map(() => 0));
      if (use[hit] >= 1 && use.some((n, j) => j !== hit && n === 0)) { use[hit]++; return `${kind} form ${hit + 1} again before the others`; }
      use[hit]++;
    }
    return null;
  },
  /** A slot left unfilled; the child's own first-person words in her mouth; a return whose {said} sentence was dropped. */
  slotsAndVoice(L, r, i, ctx) {
    if (/\{\w+\}/.test(r.text)) return "a slot left unfilled";
    const child = low(ctx.prevChild);
    const own = child.match(/(?:^|\s)((?:kal |aaj )?(?:maine|mujhe|main|mera|meri) [\p{L} ]{6,})/u)?.[1]?.trim();
    if (own && words(own) >= 3 && low(r.text).includes(own)) return `the child's words in her mouth: "${own}"`;
    if (/(?:^|[.!?]\s+)(?:Uske|Usmein|Uske baare mein)\b/.test(norm(r.text)) && !/(?:tumne|you said)/i.test(r.text) && /(?:Ab tumhari baat|tumhari .* wali baat)/i.test(r.text) === false && ctx.returnDue) return "a return pointing at nothing";
    return null;
  },
  /** A re-pose frame on a card's first posing, or glued onto anything but a card. */
  reposeFirst(L, r, i, ctx) {
    const s = sentencesOf(r.text).find((x) => REPOSE.test(x));
    if (!s) return null;
    const rest = norm(s.replace(REPOSE, ""));
    if (!r.card || !low(r.card).startsWith(low(rest).slice(0, 20))) return `a re-pose frame on no card: "${s.slice(0, 60)}"`;
    return ctx.saidCards.has(low(r.card).slice(0, 40)) ? null : "a re-pose frame on the card's first posing";
  },
  /** A turn that asks the child a question and poses a card. */
  askAndCard(L, r) {
    if (!cardIn(r)) return null;
    // (a return asks the child about their aside — "… thoda aur batao" — whether or not it ends in "?")
    if (r.returnSaid) return "an aside return and a card in one turn";
    const card = low(r.card);
    const unframed = (x) => low(x).replace(/^[^:—]{0,40}(?::|—)\s*/, "");
    const qs = sentencesOf(r.text).filter((x) => /[?？]\s*$/.test(x) && !card.includes(low(x).slice(0, 25)) && !card.includes(unframed(x).slice(0, 25)) && !CHECKIN.test(x));
    return qs.length ? `asks "${qs[0].slice(0, 60)}" and poses a card` : null;
  },
  /** A turn holding a key, a new point and a new card. */
  keyPointCard(L, r, i, ctx) {
    if (!KEY_SAID.test(r.text) || !cardIn(r) || !(r.pageParts ?? []).some((p) => p.part === "body")) return null;
    const newCard = !ctx.prevT?.card || low(ctx.prevT.card) !== low(r.card);
    return newCard && !/bridge/.test(JSON.stringify(r.pageParts)) ? "a key, a new point and a new card in one turn" : null;
  },
  /** A give-up with the card's help spent, answered without the key (fault 5). dc-r8-director20 G3: it survived director20 on c4 stuck 12,
   *  c5-t01 stuck 12 and c5-t02 steering 30 — a bare "pata nahi" / "mujhe nahi pata" is a give-up too, and the help is spent once the
   *  card had a miss or was already said twice; the turn must say the key, whatever card it poses or drops. */
  giveUpNoKey(L, r, i, ctx) {
    if (!GIVE_UP_ANY.test(ctx.prevChild)) return null;
    const card = ctx.prevT?.check?.itemId;
    if (!card || ctx.prevT?.check?.gave) return null;
    const spent = (ctx.prevT.check.misses ?? 0) >= 1 || (ctx.cardTurns[card] ?? 0) >= 2;
    if (!spent || r.check?.gave || KEY_SAID.test(r.text)) return null;
    return `a give-up with the help spent (${(ctx.prevT.check.misses ?? 0)} miss, said ${ctx.cardTurns[card] ?? 0}×), answered without the key`;
  },
  /** A clarify at a check-in (after a point, a key or a remediation) answered with the card alone. */
  clarifyCard(L, r, i, ctx) {
    if (!CLARIFY.test(ctx.prevChild) || !ctx.prevT) return null;
    const atCheckin = CHECKIN.test(norm(ctx.prevT.text)) || (KEY_SAID.test(ctx.prevT.text) && !cardIn(ctx.prevT)) || (!cardIn(ctx.prevT) && /rem:|then:/.test(String(ctx.prevT.beat ?? "")));
    // (main on director19: re-saying and then posing the card in the same turn is still answering the clarify with the card — the turn
    // re-says, ends on its check-in, and the card waits)
    return atCheckin && cardIn(r) ? "clarify at a check-in answered with a card" : null;
  },
  /** A planned in-turn board change the record does not draw; a board change under a joint word. */
  boardChange(L, r) {
    const H = r.held;
    if (!H) return null;
    if (H.intent?.switchTo && (H.pages ?? []).length < 2) return "a planned board change not drawn";
    const first = sentencesOf(r.text)[0] ?? "";
    if (H.changed && !H.intent?.switchTo && JOINT_ONLY.test(first) && sentencesOf(r.text).length > 1) return `a board change under the joint "${first}"`;
    return null;
  },
  /** A worked example's card answered right, closed without its final answer. */
  workedFinal(L, r, i, ctx) {
    const id = String(ctx.prevT?.check?.itemId ?? "");
    if (!/:ask:worked$/.test(id) || ctx.prevCls !== "correct") return null;
    const sk = id.replace(/^script:/, "").replace(/:ask:worked$/, "");
    const we = (ctx.script?.skills ?? []).find((s) => s.skillId === sk)?.workedExample;
    const a = String(we?.answer?.hi ?? we?.answer ?? "");
    const num = a.match(/\d+(?:\.\d+)?/)?.[0];
    return num && !new RegExp(`(?<![\\d.])${num}(?![\\d])`).test(r.text) ? `a worked example closed without its final answer (${num})` : null;
  },
  /** A worked step said before its problem in the lesson (an aside resumed at step 1). */
  workedOrder(L, r, i, ctx) {
    const b = String(r.beat ?? "");
    const m = /^(s\d+):worked:worked:(problem|step\d+)/.exec(b);
    if (!m) return null;
    if (m[2] === "problem") { ctx.problemSaid.add(m[1]); return null; }
    return ctx.problemSaid.has(m[1]) ? null : `a worked ${m[2]} before its problem`;
  },
  /** J2: the turn after the child answered her return question. It opens on ONE sentence about what they said (≤ 14 words, no
   *  question, no taste of her own, a content word of theirs) or a neutral joint, and then goes on with the lesson. */
  returnReply(L, r, i, ctx) {
    if (!ctx.prevT?.returnSaid || !ctx.prevChild || /^(?:wrap|safeguard|break)$/.test(String(r.move?.kind ?? r.move ?? ""))) return null;
    const ss = sentencesOf(r.text);
    const s0 = ss[0] ?? "";
    if (ss.length < 2) return `no lesson after the reply: "${s0.slice(0, 60)}"`;
    if (JOINT_ONLY.test(s0) || /^hmm[.!]?$/i.test(s0)) return null;
    const theirs = (low(ctx.prevChild).match(/\p{L}{4,}/gu) ?? []).filter((w) => !RET_STOP.has(w));
    // (their answer to her return is the aside's own reply, never a new aside parked for later)
    const park = ss.find((x) => /(?<![\p{L}])(?:karenge|karungi|baad\s+mein|thodi\s+der|yaad\s+rahega|likh\s+li|later|come\s+back)(?![\p{L}])/iu.test(x));
    if (park) return `their answer to the return parked again: "${park.slice(0, 70)}"`;
    const why = /[?？]/.test(s0) ? "a question" : words(s0) > 14 ? `${words(s0)} words` : TASTE.test(s0) ? "a taste of hers"
      : !theirs.some((w) => new RegExp(`(?<![\\p{L}])${w}`, "iu").test(s0)) ? "none of their words" : null;
    return why ? `the reply to their answer is ${why}: "${s0.slice(0, 70)}"` : null;
  },
  /** A second clarify on one part (dc-r8-second-clarify-shows-not-rewords): the same authored line with the board shown, then the
   *  check-in — never the card, never the key. PENDING: reported, not gated, until the clarify column switch (C1 step 3). */
  secondClarify(L, r) {
    if (r.clarifyN !== 2) return null;
    if (cardIn(r)) return "a second clarify answered with the card";
    if (KEY_SAID.test(r.text)) return "a second clarify answered with the key";
    return CHECKIN.test(norm(r.text)) ? null : "a second clarify that does not end on its check-in";
  },
  /** An English word and its Hindi twin in one turn. */
  // (dc-r8-director20 W1: code never swaps a word inside an authored sentence, so a pair BOTH of whose words the script itself uses is
  // the script's to fix — twinsData, reported to Learning — and twins flags only a word code brought in. A gloss that introduces a term,
  // "line yaani rekha", is no twin fault, as Learning's rule allows)
  twins(L, r, i, ctx) {
    const t = twinHit(r.text);
    return t && !(scriptUses(ctx, t.e) && scriptUses(ctx, t.h)) ? `"${t.e}" beside "${t.h}"` : null;
  },
  /** An English word and its Hindi twin in one turn, both from the script's own sentences. PENDING: Learning's at-source fix
   *  (one term per idea per script, d1acefe95). */
  twinsData(L, r, i, ctx) {
    const t = twinHit(r.text);
    return t && scriptUses(ctx, t.e) && scriptUses(ctx, t.h) ? `"${t.e}" beside "${t.h}" (both in the script)` : null;
  },
};

/** The first twin pair in a turn, not a gloss ("line yaani rekha", "rekha, yaani line"): { e, h } or null. */
function twinHit(text) {
  const t0 = String(text ?? "");
  for (const t of TWINS) {
    const e = t0.match(t.enRe), h = t0.match(t.hiRe);
    if (!e || !h) continue;
    const gloss = new RegExp(`(?:${e[0]}|${h[0]})[,\\s]+(?:yaani|matlab|ya(?:ni)?|or|i\\.e\\.)\\s+(?:${e[0]}|${h[0]})`, "iu");
    if (gloss.test(t0)) continue;
    return { e: e[0], h: h[0] };
  }
  return null;
}
/** Whether the lesson's script uses a word anywhere in its own text (its spoken Hindi or English). */
function scriptUses(ctx, w) {
  if (!ctx) return false;
  ctx.scriptText ??= JSON.stringify(ctx.script ?? {}).toLowerCase();
  return new RegExp(`(?<![\\p{L}])${String(w).toLowerCase().replace(/\s+/g, "\\s+")}(?![\\p{L}])`, "u").test(ctx.scriptText);
}

/** Predicates that report and do not gate yet (the gate test leaves them out): each names the step that makes it pass. */
export const PENDING = new Set(["secondClarify", "twinsData"]);

/** The flags of one dry lesson: [{ row, predicate, why, text }]. */
export function lessonFlags({ rows, script }) {
  const heads = {};
  // (each form is recognised by its longest stretch with no slot in it)
  for (const [kind, forms] of Object.entries(script?.joints ?? {})) heads[kind] = (forms ?? []).map((f) => String(f?.hi ?? f ?? "").split(/\{\w+\}/).map((x) => low(x).replace(/^[\s,.:;!?]+|[\s,.:;!?]+$/g, "")).sort((a, b) => b.length - a.length)[0]?.slice(0, 32) ?? "").map((h) => (h.length >= 8 ? h : null));
  const workedBy = new Map((script?.skills ?? []).map((sk, n) => [`s${n + 1}`, sk.workedExample ?? null]));
  const ctx = { script, prevT: null, prevChild: "", prevCls: null, saidCards: new Set(), jointUse: {}, jointHeads: heads, problemSaid: new Set(), returnDue: false, cardTurns: {},
    workedOf: (r) => workedBy.get(String(r.beat ?? "").split(":")[0]) ?? null };
  const out = [];
  rows.forEach((r, i) => {
    if (r.who !== "teacher") { ctx.prevChild = r.text ?? ""; ctx.prevCls = String(r.read ?? "").split(" ")[0]; return; }
    ctx.returnDue = !!r.returnSaid;
    for (const [name, f] of Object.entries(PREDICATES)) { const why = f({ rows }, r, i, ctx); if (why) out.push({ row: i, predicate: name, why, text: norm(r.text).slice(0, 140) }); }
    if (cardIn(r)) ctx.saidCards.add(low(r.card).slice(0, 40));
    if (r.check?.itemId) ctx.cardTurns[r.check.itemId] = (ctx.cardTurns[r.check.itemId] ?? 0) + 1;
    ctx.prevT = r;
  });
  return out;
}

/** Counts per predicate over a whole matrix: { predicate: n }. */
export function matrixCounts(lessons) {
  const c = Object.fromEntries(Object.keys(PREDICATES).map((k) => [k, 0]));
  for (const L of lessons) for (const f of lessonFlags(L)) c[f.predicate]++;
  return c;
}
