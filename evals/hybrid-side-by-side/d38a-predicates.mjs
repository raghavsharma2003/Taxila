// d38 builder A (to-brain 055, the cap: C1 to C3). Registered in dry-predicates.mjs after d37h; GATED (tests/r8-d38-055a.test.mjs pins
// both on made rows, both sides, and on the frozen director37 rows).
//   keyWithWordingUnsaid   C1: a told answer (a `key` seam), or a told step at the cap (the step's question heard four times or more before
//                          it), while a help wording of that part — the script's own, in the list below — was never said in the lesson
//                          (no sentence of it said, word for word, in any of her turns up to and including that one). director37:
//                          steering c6-ch06-t01 22, steering c5-ch02-t01 22, steering c5-ch02-t02 22, steering c6-ch07-t03 22, stuck
//                          c6-ch07-t03 42 (five rows in four lessons). Main's ruling (d38, RULING-A2): A(i) C1 is one turn a question — a
//                          told answer after a C1 turn at that question passes; B a wording any sentence of which she has said in near-same
//                          words (this file's own test, heardNear: eight in ten of its words, in order, in one sentence of hers) is not
//                          unsaid; C the wait is outside C1 — a told answer whose child lines since the question are bare (a yes, nothing
//                          read) and whose turn before answered a bare line passes.
//   questionFifthOnHerOwn  C3: a fifth (or later) counted hearing of one question — her turn ends on any form the script writes for it
//                          (prompt, reask, hindi; Hinglish or English), whole, re-asked, in Hindi, or after help or a remediation — that is
//                          not the answer to the child's own request for it ("phir se bolo", a request for Hindi where the question has a
//                          Hindi form). The short ask and the invitation are no hearing (they say no form of it). director37: offtopic
//                          c4-ch01-t02 34 (the fifth, after her reply to a side-topic) and 42 (the seventh, after the go-ahead). Main's
//                          ruling A4 (d38): C1's one turn at a return passes at the fifth hearing (c1ReturnAt), and nothing else new.
// The checks' OWN lists and readings, written out here and not imported from the walk (help.js ladderSpec, question-run.js atQuestionOf and
// HEAR_Q), so that a gap in one does not pass both.

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
/** A sentence's key: lower case, no punctuation, a {slot} kept as one marker word. */
const SLOT = "zzslot";
const keyOf = (t) => low(String(t ?? "").replace(/\{\w+\}/g, ` ${SLOT} `)).replace(/[^\p{L}\p{N}/\s]+/gu, " ").replace(/\s+/g, " ").trim();
const sentences = (t) => String(t ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
const formsOf = (v) => (typeof v === "string" ? [v] : v && typeof v === "object" ? [v.hi, v.en] : []).filter((x) => typeof x === "string" && x.trim());
const at = (script, path) => String(path).split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], script);

/** C1's help wordings of a part, in the order help gives them (the part named by the row's cell, as the record writes it). The list is
 *  this check's own: a script card's own simpler, then its point's other wording and simpler; a remediation's follow-up card's simpler,
 *  then the remediation's other wording and simpler; a check's simpler; the child's own step's simpler, then the worked problem's; an asked
 *  worked step's simpler, then the worked problem's other wording and simpler. → [path] | null (a part with no list: the teach-back). */
export function wordingsOf(script, part) {
  const m = /^(.+)-s(\d+):(.+)$/.exec(String(part ?? ""));
  const S = m ? script?.skills?.[Number(m[2]) - 1] : null;
  if (!S) return null;
  const base = `skills[${Number(m[2]) - 1}]`, rest = m[3];
  let r;
  if ((r = /^([^:]+):card$/.exec(rest))) {
    const k = (S.explain ?? []).findIndex((e) => e?.id === r[1]);
    return k < 0 ? null : [`${base}.explain[${k}].ask.simpler`, `${base}.explain[${k}].pointAlt`, `${base}.explain[${k}].simpler`];
  }
  if ((r = /^rem:(\d+):then$/.exec(rest))) return [`${base}.remediation[${r[1]}].then.simpler`, `${base}.remediation[${r[1]}].sayAlt`, `${base}.remediation[${r[1]}].simpler`];
  if ((r = /^check:(.+)$/.exec(rest))) {
    const k = (S.checks ?? []).findIndex((c, i) => String(c?.id ?? i) === r[1]);
    return k < 0 ? null : [`${base}.checks[${k}].simpler`];
  }
  if (rest === "worked:yourStep") return [`${base}.workedExample.yourStep.simpler`, `${base}.workedExample.simpler`];
  if ((r = /^worked:step(\d+)(?::ask)?$/.exec(rest))) return [`${base}.workedExample.steps[${Number(r[1]) - 1}].simpler`, `${base}.workedExample.problemAlt`, `${base}.workedExample.simpler`];
  return null;
}
/** The Hinglish text of a script value (a string, or { hi, en }). */
const hiOf = (v) => (typeof v === "string" ? v : typeof v?.hi === "string" ? v.hi : null);
/** The sentence keys of her turns, rows 0..i. */
const saidUpTo = (L, i) => { const s = new Set(); for (const x of L.rows.slice(0, i + 1)) if (x.who === "teacher") for (const t of sentences(x.text)) s.add(keyOf(t)); return s; };
/** Main's ruling B (d38, RULING-A2): this check's OWN near-same test — a sentence is heard if at least eight in ten of its words, in order,
 *  are in one sentence she has said in the lesson (the longest common run of words, in order, against the sentence's own length). */
const wordsOf = (k) => String(k ?? "").split(" ").filter(Boolean);
function inOrder(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let x = 1; x <= m; x++) for (let y = 1; y <= n; y++) d[x][y] = a[x - 1] === b[y - 1] ? d[x - 1][y - 1] + 1 : Math.max(d[x - 1][y], d[x][y - 1]);
  return d[m][n];
}
export function heardNear(sentence, said) {
  const k = keyOf(sentence);
  if (!k) return false;
  if (said.has(k)) return true;
  const w = wordsOf(k);
  for (const x of said) if (inOrder(w, wordsOf(x)) >= 0.8 * w.length) return true;
  return false;
}
/** The wordings of a part never said up to row i (no sentence of one heard, word for word or in near-same words — ruling B: a wording that
 *  cannot be said whole without repeating her is not unsaid): [path]. */
export function unsaidWordings(L, i, script, part) {
  const list = wordingsOf(script, part);
  if (!list) return [];
  const said = saidUpTo(L, i);
  return list.filter((p) => { const t = hiOf(at(script, p)); return t && t.trim() && !sentences(t).some((s) => heardNear(s, said)); });
}

/** Every question the script writes (an object with a `prompt`; the teach-back's is not read) → its path, keyed by each form's last
 *  sentence: { exact: Map, slotted: [{ re, path }] }. */
const QCACHE = new WeakMap();
function questionKeys(script) {
  if (!script || typeof script !== "object") return { exact: new Map(), slotted: [] };
  if (QCACHE.has(script)) return QCACHE.get(script);
  const exact = new Map(), slotted = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) return o.forEach((x, n) => walk(x, `${path}[${n}]`));
    if (!o || typeof o !== "object") return;
    if (o.prompt && !/^\.?teachback/.test(path)) for (const f of ["prompt", "reask", "hindi"]) for (const t of formsOf(o[f])) {
      const k = keyOf(sentences(t).at(-1) ?? "");
      if (!k || k.split(" ").length < 3) continue;
      if (k.includes(SLOT)) slotted.push({ re: new RegExp(`^${k.split(SLOT).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\p{L}\\p{N}/ ]+?")}$`, "u"), path });
      else if (!exact.has(k)) exact.set(k, path);
    }
    for (const [k, v] of Object.entries(o)) if (v && typeof v === "object") walk(v, `${path}.${k}`);
  };
  walk(script, "");
  const out = { exact, slotted };
  QCACHE.set(script, out);
  return out;
}
/** The question a turn of hers ends on (its last sentence is a form's last sentence) → its path, or null. */
export function questionOfTurn(script, text) {
  const k = keyOf(sentences(text).at(-1) ?? "");
  if (!k) return null;
  const Q = questionKeys(script);
  return Q.exact.get(k) ?? Q.slotted.find((x) => x.re.test(k))?.path ?? null;
}
/** The child asking to hear the question again, as said (Roman Hindi, Hinglish or English). */
const HEAR_AGAIN_SAID = /(?<![\p{L}])(?:phir\s+se\s+(?:bolo|bataiye|batao|boliye|puchho|poochho|suna(?:o|iye))|fir\s+se\s+(?:bolo|batao)|dobara\s+(?:bolo|batao|boliye|suna(?:o|iye))|ek\s+baar\s+(?:aur|phir)\s+(?:bolo|batao)|sawaal\s+(?:kya\s+(?:tha|hai)|phir\s+se)|(?:aapne|aap\s+ne|tumne|tum\s+ne)\s+kya\s+(?:bola|kaha|poocha)|kaunsa\s+sawaal|repeat|say\s+(?:it\s+)?again|what\s+was\s+the\s+question)(?![\p{L}])/iu;
/** The child asking for Hindi, as said. */
const HINDI_SAID = /(?<![\p{L}])(?:hindi\s+(?:mein|me|main)|in\s+hindi)(?![\p{L}])/iu;
const hasHindiForm = (script, path) => { const o = at(script, path); return !!(o && formsOf(o.hindi).length); };
/** The child's line before row i asks for the question at `path` (to hear it again, or in Hindi where it has a Hindi form). */
/** d38 RULING-A7 P4: "what did you say?" said alone — the whole line, no one else named in it (a side-topic question, "virat ne kya kaha
 *  tha?", is no request for the question). */
const WHAT_SAID_ALONE = /^(?:(?:aapne|tumne|ma'?am|didi|achha)\s+)?kya\s+(?:bola|kaha|poocha)(?:\s+(?:aapne|tumne))?(?:\s+(?:tha|hai))?[\s?.!]*$/iu;
export const ownRequest = (L, i, script, path) => {
  const c = L.rows[i - 1];
  if (c?.who !== "child") return false;
  const t = String(c.text ?? "").replace(/\s+/g, " ").trim();
  return HEAR_AGAIN_SAID.test(t) || WHAT_SAID_ALONE.test(t) || (HINDI_SAID.test(t) && hasHindiForm(script, path));
};
/** Her hearings of each question, rows 0..i: { [path]: n }. */
function hearingsUpTo(L, i, script) {
  const h = {};
  for (const x of L.rows.slice(0, i + 1)) if (x.who === "teacher") { const p = questionOfTurn(script, x.text); if (p) h[p] = (h[p] ?? 0) + 1; }
  return h;
}
const keySeam = (r) => (r.seams ?? []).some((x) => x.right === "key");
/** The last turn of hers before row i that ends on a question → { P, j } | null. */
const lastQuestion = (L, i, script) => { for (let k = i - 1; k >= 0; k--) { const x = L.rows[k]; if (x.who !== "teacher") continue; const p = questionOfTurn(script, x.text); if (p) return { P: p, j: k }; } return null; };
/** Main's ruling A(i): a C1 turn at question P before row i — a turn of hers after P's fourth hearing that says a wording of the part (a
 *  sentence of it heard in that turn, near-same reading above) and does not end on P. */
// (d38 RULING-A7 P4: only a turn that said a wording of the part not said before it in the lesson AND ended on an invitation, or the one
// return turn — a turn that repeats a wording already said, or ends otherwise, is no C1 turn)
export const c1TurnBefore = (L, i, script, part, P) => {
  const list = (wordingsOf(script, part) ?? []).map((p) => hiOf(at(script, p))).filter((t) => t && t.trim());
  if (!P || !list.length) return false;
  for (let j = i - 1; j >= 0; j--) {
    const x = L.rows[j];
    // (main's ruling A4: C1's one turn at a return — ending on the question because it answers a side-topic — is that question's C1 turn)
    if (x.who === "teacher" && (hearingsUpTo(L, j - 1, script)[P] ?? 0) === 4 && c1ReturnAt(L, j, script, P)) return true;
    if (x.who !== "teacher" || questionOfTurn(script, x.text) === P || (hearingsUpTo(L, j - 1, script)[P] ?? 0) < 4) continue;
    if (invitesOwn(script, x) && newWordingIn(L, j, script, part)) return true;
  }
  return false;
};
/** d38 RULING-A8 Q4 (main's ruling on 054b): a help turn said at question P before row i — a turn of hers with a help, caption or
 *  remediation seam (the row's own record), or one that says a sentence of a wording of the part (this file's near-same test), read back
 *  from row i to P's first hearing while her turns end on P or on no question of the script (a turn that ends on another question leaves
 *  P). This check's own reading. */
const HELP_SEAMS = new Set(["help", "caption", "remediation"]);
export function helpSaidAt(L, i, script, P, part = null) {
  const words = part ? (wordingsOf(script, part) ?? []).map((p) => hiOf(at(script, p))).filter((t) => t && t.trim()).flatMap(sentences) : [];
  if (!script || !P) return false;
  for (let j = i - 1; j >= 0; j--) {
    const x = L.rows[j];
    if (x.who !== "teacher") continue;
    const q = questionOfTurn(script, x.text);
    if (q && q !== P) return false;
    if ((x.seams ?? []).some((y) => HELP_SEAMS.has(String(y.right ?? "")))) return true;
    if (words.length) { const own = new Set(sentences(x.text).map(keyOf)); if (words.some((t) => heardNear(t, own))) return true; }
    if (q === P && !(hearingsUpTo(L, j - 1, script)[P] ?? 0)) return false;
  }
  return false;
}
/** Main's ruling C: what a wait is made of, as said — a bare yes, or nothing the walk reads (no words, a filler). This check's own list. */
const BARE_SAID = /^(?:haan|haa|ha|han|haan ji|ji|ji haan|hmm+|hm+|umm*|achha|accha|acha|achcha|theek hai|thik hai|theek|ok|okay|okk|yes|yeah|yep|sure|hmm achha|hmm haan|haan achha|haan theek hai)?$/;
const bare = (r) => r?.who === "child" && BARE_SAID.test(keyOf(r.text));
/** Main's ruling C: the told answer that is the wait's last turn — the child's lines since the question was last said are all bare, and her
 *  turn before answered a bare line too (a turn of the wait: its help, or its return to the question). */
const waitTold = (L, i, q) => {
  if (!q) return false;
  const kids = L.rows.slice(q.j + 1, i).filter((x) => x.who === "child");
  if (!kids.length || !kids.every(bare)) return false;
  let k = i - 1;
  while (k >= 0 && L.rows[k].who !== "teacher") k--;
  return k > 0 && bare(L.rows[k - 1]);
};
const ENDS = (r) => ["safeguard", "goodbye"].includes(String(r?.move ?? ""));
/** Main's ruling A4 (d38): the seams her turn opens on when it replies to a side-topic — her reply to the child's reply (an aside's, her
 *  return question's), the AI line's reply, a park, a said-again line. This check's own list. */
const SIDE_OPEN = new Set(["asideReply", "aiReply", "park", "aside"]);
/** Whether row i is a C1 turn at a return in a wording said for the first time: none of the wording's sentences heard before row i (this
 *  file's near-same test), a sentence of it said in the row. */
const newWordingIn = (L, i, script, part) => {
  const before = saidUpTo(L, i - 1), own = new Set(sentences(L.rows[i].text).map(keyOf));
  return (wordingsOf(script, part) ?? []).map((p) => hiOf(at(script, p))).filter((t) => t && t.trim())
    .some((t) => !sentences(t).some((x) => heardNear(x, before)) && sentences(t).some((x) => heardNear(x, own)));
};
const c1ReturnShape = (L, i, script, P) => {
  const r = L.rows[i];
  if (r?.who !== "teacher" || questionOfTurn(script, r.text) !== P) return false;
  const first = (r.seams ?? []).find((x) => x.left === "start")?.right ?? (r.seams ?? [])[0]?.right;
  return SIDE_OPEN.has(String(first ?? "")) && newWordingIn(L, i, script, String(r.cell?.part ?? ""));
};
/** Main's ruling A3 item 3 (d38): C1's turn after a miss — help in a wording of the part not said before in the lesson, ending on an
 *  invitation (the script's joints.yourTurn form as its last sentence, or the row's last seam yourTurn), and the first such turn at that part.
 *  This check's own reading. */
const invitesOwn = (script, r) => {
  const last = keyOf(sentences(r?.text).at(-1) ?? "");
  const forms = (script?.joints?.yourTurn ?? []).flatMap(formsOf).map((t) => keyOf(sentences(t).at(-1) ?? t));
  return (!!last && forms.includes(last)) || (r?.seams ?? []).at(-1)?.right === "yourTurn";
};
const c1InviteShape = (L, i, script) => {
  const r = L.rows[i];
  return r?.who === "teacher" && invitesOwn(script, r) && (r.seams ?? []).some((x) => x.right === "help") && newWordingIn(L, i, script, String(r.cell?.part ?? ""));
};
// (d38 RULING-A7 P4: an earlier turn of that shape is C1's only where it came at the cap — `atCap(j)`, the caller's reading (keyAfterFive:
// the question heard four times, or the fifth miss); an order-049 B4 invitation-help before the cap is no C1 turn)
export function c1InviteAt(L, i, script, atCap = () => true) {
  if (!script || !c1InviteShape(L, i, script)) return false;
  const part = String(L.rows[i].cell?.part ?? "");
  for (let j = 0; j < i; j++) if (String(L.rows[j].cell?.part ?? "") === part && c1InviteShape(L, j, script) && atCap(j)) return false;
  return true;
}
/** d38 RULING-A7 P3 as restated by main: the part's cap is reached — its C1 turn was given before row i (P4's narrow c1TurnBefore), or no
 *  wording of the part is unsaid (this file's near-same test). The hearing count is the caller's own. */
export const capReachedAt = (L, i, script, part, P) => !!script && !!part && !!P && (c1TurnBefore(L, i, script, part, P) || !unsaidWordings(L, i, script, part).length);
/** d38 RULING-A7 P4: the hearings of the question her last turn ending on a question asked, rows before i (this file's count). */
export const heardOfLast = (L, i, script) => { const q = lastQuestion(L, i, script); return q ? hearingsUpTo(L, i - 1, script)[q.P] ?? 0 : 0; };
/** Main's ruling A4 (d38): the one fifth hearing on her own allowed — C1's one turn at a return: a turn that (a) opens on her reply to a
 *  side-topic (SIDE_OPEN, its first seam), (b) then says help in a wording of the part not said before in the lesson, (c) ends on the
 *  question P, (d) is the first such turn at P. Its count is the caller's: the fifth hearing only (a sixth is never allowed). */
export function c1ReturnAt(L, i, script, P) {
  if (!script || !P || !c1ReturnShape(L, i, script, P)) return false;
  for (let j = 0; j < i; j++) if (c1ReturnShape(L, j, script, P)) return false;
  // (d38 RULING-A7 P4: and only where no C1 turn was given at that question before it — help in a new wording ending on an invitation at
  // that part, after the question's fourth hearing)
  const part = String(L.rows[i].cell?.part ?? "");
  for (let j = 0; j < i; j++) if (String(L.rows[j].cell?.part ?? "") === part && c1InviteShape(L, j, script) && (hearingsUpTo(L, j - 1, script)[P] ?? 0) >= 4) return false;
  return true;
}

export const D38A_PREDICATES = {
  keyWithWordingUnsaid(L, r, i, ctx) {
    if (r.who !== "teacher" || ENDS(r)) return null;
    const key = keySeam(r), step = !!r.stepAnswer?.told;
    if (!key && !step) return null;
    const part = String(r.cell?.part ?? "");
    const q = lastQuestion(L, i, ctx?.script);
    if (!key) {
      // (a told step is C1's only at the cap: the step's question heard four times or more before this turn)
      const P = q?.P;
      if (!P || !/workedExample\.steps\[\d+\]/.test(P) || (hearingsUpTo(L, i - 1, ctx?.script)[P] ?? 0) < 4) return null;
    }
    const left = unsaidWordings(L, i, ctx?.script, part);
    if (!left.length) return null;
    // (ruling A(i): C1 is one turn a question — the told answer after a C1 turn at that question passes, whatever is still unsaid; ruling C:
    // the wait is outside C1 — the told answer that is the wait's last turn passes)
    // (d38 RULING-A8 Q4, main's ruling on 054b: the wait's told answer passes only where a help turn was said at that question before it —
    // a child told with no help ever said at the question is told with a wording unsaid)
    if (c1TurnBefore(L, i, ctx?.script, part, q?.P) || (waitTold(L, i, q) && helpSaidAt(L, i, ctx?.script, q?.P, part))) return null;
    return `a told ${key ? "answer" : "step"} while ${left.join(", ")} was never said`;
  },
  questionFifthOnHerOwn(L, r, i, ctx) {
    if (r.who !== "teacher" || ENDS(r)) return null;
    const P = questionOfTurn(ctx?.script, r.text);
    if (!P) return null;
    const n = hearingsUpTo(L, i, ctx?.script)[P] ?? 0;
    if (n < 5 || ownRequest(L, i, ctx?.script, P)) return null;
    // (main's ruling A4: C1's one turn at a return — her reply, help in a wording not said before, the question — at its fifth hearing)
    if (n === 5 && c1ReturnAt(L, i, ctx?.script, P)) return null;
    return `the question ${P} heard a ${n}th time, on her own`;
  },
};
