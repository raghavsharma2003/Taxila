// v6 checker (main, director8 hand judgement: the per-segment checker saw 1, 0 and 0 of 10, 4 and 45 firm contradictions; "the
// code count must agree with a hand count before it can gate the 30-topic batch"). Four kinds the screen checker did not model,
// each a pure predicate on one segment or one turn. Used by evals/hybrid-side-by-side.mjs; pinned by tests/r7-brain-v6-checks.
import { splitSentences } from "../../server/voice/sentences.js";

const sentencesOf = (t) => splitSentences(String(t ?? "").replace(/\s+/g, " ").trim());
const POINT = /\b(?:screen|board|whiteboard)\b|dekho|dekhiye|\blook\b/i;
const fracVal = (s) => { const m = /^(\d+)\/(\d+)$/.exec(String(s)); return m && Number(m[2]) ? Number(m[1]) / Number(m[2]) : Number.isFinite(Number(s)) ? Number(s) : null; };
const near = (a, b) => a != null && b != null && Math.abs(a - b) < 1e-9;
const paramsOf = (b) => (b?.params && typeof b.params === "object" ? b.params : b ?? {});

/**
 * (a) "?" draws against stated numbers: the board shows "?" where a value is withheld (a mark's label, a column item: Studio
 * hides a value an accept form carries) while her segment states that value. Hidden values: a "?" mark's own value ("mark k"
 * on a line of `den` gaps per whole from `from` → from + k/den; a mark at "a/b"), and every number written in the board's
 * labels, titles or items (its params' strings) that the screen does not show. Returns the stated hidden values.
 * @param {{ counts?: any, onScreen?: any, boardRef?: any, numbers?: string[] }} screen  the screen record (harness row.screen)
 */
export function withheldStated(text, screen) {
  const counts = screen?.counts ?? null, board = screen?.boardRef ?? null;
  const shown = `${Object.values(screen?.onScreen ?? {}).join(" ")} ${(screen?.numbers ?? []).join(" ")}`;
  const qMarks = (counts?.marks ?? []).filter((m) => m && String(m.label ?? "").trim() === "?");
  const qShown = qMarks.length > 0 || /(?:^|[\s|])\?(?:$|[\s|])/.test(shown);
  if (!qShown) return [];
  const p = paramsOf(board);
  const from = Number(p.from ?? 0) || 0;
  const den = Number(p.den) || (counts?.lines?.[0]?.gapsPerWhole ?? null) || (counts?.lines?.[0]?.gaps && Number(p.to ?? 1) - from ? counts.lines[0].gaps / (Number(p.to ?? 1) - from) : null);
  const vals = qMarks.map((m) => { const k = /^mark\s+(\d+)$/i.exec(String(m.at ?? "")); return k && den ? from + Number(k[1]) / den : fracVal(m.at); }).filter((v) => v != null);
  const strings = [];
  const walk = (o) => { if (typeof o === "string") strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") Object.entries(o).forEach(([k, v]) => { if (k !== "template") walk(v); }); };
  walk(p);
  const shownNums = new Set(shown.match(/\d+\/\d+|\d+(?:\.\d+)?/g) ?? []);
  const hidden = new Set(strings.flatMap((x) => x.match(/\d+\/\d+|\d+(?:\.\d+)?/g) ?? []).filter((n) => !shownNums.has(n)));
  const stated = (String(text ?? "").match(/\d+\/\d+|\d+(?:\.\d+)?/g) ?? []).filter((n) => hidden.has(n) || vals.some((v) => near(fracVal(n), v)));
  return [...new Set(stated)];
}

/** The things a board draws, in words (its whole, titles and items, its shape, its kind). */
export function boardNouns(board) {
  const p = paramsOf(board);
  const t = String(board?.template ?? "").split("@")[0];
  const words = [p.whole, p.shape, p.name, p.left?.title, p.right?.title, ...(p.left?.items ?? []), ...(p.right?.items ?? []), ...(p.names ?? []),
    ...(Array.isArray(p.wholes) ? p.wholes.map((w) => w?.title) : [])].filter((x) => typeof x === "string").join(" ").toLowerCase();
  const kind = { "fraction-line": "line rekha number", "fraction-parts": "parts hisse tukde", "equal-groups": "group samooh plate", measured: "shape bhuja side", shape: "shape", compare: "",
    "fraction-bars": "bar patti strip parts hisse tukde", wholes: "parts hisse tukde" }[t] ?? "";
  return `${words} ${kind}`;
}
const OBJECTS = ["pizza", "roti", "cake", "laddoo", "chocolate", "patti", "strip", "bottle", "circle", "line", "rekha", "rectangle", "triangle", "square", "hexagon", "pentagon",
  "plate", "pencil", "tarbooz", "khet", "park", "kyari", "ribbon", "card", "bar"];
/**
 * (b) a picture-request line against what is drawn: a sentence of hers that points at the screen and names a thing the board
 * does not draw ("Screen par dekho: poora pizza…" over a word table). Returns the things named.
 */
export function pictureMismatch(text, board, altView = null) {
  if (!board || board.auto) return [];
  // (v6.4 harness, main on director12: a picture asked with the card's board up draws Studio's SECOND view — bars for a line,
  // a line for bars — and her words describe that view: what it draws counts as drawn too)
  const ALT = { parts: "bar patti strip parts hisse tukde", bars: "bar patti strip parts hisse tukde", line: "line rekha number", wholes: "parts hisse tukde", groups: "group samooh plate", round: "circle gol parts hisse tukde", example: "bar patti strip parts hisse tukde",
    // (v6.5, main on director13: Studio's unrolled view lays a shape's sides end to end on a line)
    unrolled: "line rekha sides side bhuja bhujayein seedhi straight" };
  const av = typeof altView === "string" ? altView : altView?.view ?? null;
  const has = `${boardNouns(board)} ${av ? ALT[av] ?? "" : ""}`;
  const out = [];
  for (const s of sentencesOf(text)) {
    if (!POINT.test(s)) continue;
    for (const o of OBJECTS) if (new RegExp(`(?<![\\p{L}])${o}(?![\\p{L}])`, "iu").test(s) && !has.includes(o)) out.push(o);
  }
  return [...new Set(out)];
}

/** Every authored sentence a why could be borrowed from (points, remediation says, beat conveys), and the authored whys. */
export function authoredWhys(script, lang = "hinglish") {
  const said = (x) => (x && typeof x === "object" ? (lang === "english" ? x.en : x.hi) : x) ?? "";
  const borrowed = [], own = [];
  for (const sk of script?.skills ?? []) {
    for (const b of sk.explain ?? []) { borrowed.push(...sentencesOf(said(b.point))); if (b.ask?.why) own.push(said(b.ask.why)); }
    for (const r of sk.remediation ?? []) { borrowed.push(...sentencesOf(said(r.say))); if (r.then?.why) own.push(said(r.then.why)); }
    for (const c of sk.checks ?? []) if (c.why) own.push(said(c.why));
    if (sk.workedExample?.why) own.push(said(sk.workedExample.why));
    for (const st of sk.workedExample?.steps ?? []) own.push(said(st.why));
  }
  const n = (x) => String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
  return { borrowed: borrowed.map(n).filter((x) => x.split(" ").length >= 4), own: own.map(n).filter(Boolean) };
}
/**
 * (c) a why taken from another board: a close ("… jawab X tha, kyunki W", "Toh poora jawab: X, kyunki W") whose W is a
 * sentence of a point or a remediation and not an authored why. Returns the borrowed whys.
 */
export function borrowedWhy(text, whys) {
  if (!whys) return [];
  const n = (x) => String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
  const out = [];
  for (const m of String(text ?? "").matchAll(/(?:jawab|answer)[^.!?।]*?(?:,\s*)?(?:kyunki|because)\s+([^.!?।]+)/giu)) {
    const w = n(m[1]);
    if (!w || whys.own.some((o) => o && (o.includes(w) || w.includes(o)))) continue;
    if (whys.borrowed.some((b) => b.includes(w) || w.includes(b))) out.push(m[1].trim());
  }
  return out;
}

/**
 * (d) a verdict in the wrong segment: on a graded turn the verdict (her first sentence) is said over the board of the card they
 * answered. `firstBoard`: the board of the part the line opens on; `answeredBoard`: the answered card's board (the board the
 * last turn ended on). True when both exist and differ and the verdict says more than a bare yes or no.
 */
export function verdictMisplaced({ graded, firstBoard, answeredBoard, verdict = null, answerBoard = null }) {
  if (!graded || !firstBoard || !answeredBoard) return false;
  // (a bare "Haan, sahi hai." says nothing a board can contradict; a verdict with a number or a reason does)
  // (director11, main: the same rule as Brain's first-page join, propose.js FIRST_PAGE_MIN_WORDS: under 6 words and no digit)
  if (verdict != null && !/\d/.test(verdict) && String(verdict).split(/\s+/).filter(Boolean).length < 6) return false;
  const same = (b) => !!b && b.template === firstBoard.template && JSON.stringify(paramsOf(firstBoard)) === JSON.stringify(paramsOf(b));
  // (v2.3: a card's authored answerBoard, its answer state, is the answered card's board for its close)
  return !same(answeredBoard) && !same(answerBoard);
}

/**
 * Widened false keys (main, director8 item 2): every number she STATES AS AN ANSWER ("jawab X", "answer is X", "… isliye … X
 * hai", "= X", "toh X hoga") is checked against the topic's authored keys and accept forms and the numbers the question gives;
 * a stated answer number none of them carries is a false key. Returns the false numbers.
 */
export function falseAnswerNumbers(text, { keys = new Set(), given = "" } = {}) {
  const ok = new Set();
  const add = (t) => { for (const x of String(t ?? "").match(/\d+\/\d+|\d+(?:\.\d+)?/g) ?? []) { ok.add(x); for (const k of x.split("/")) ok.add(k); } };
  for (const k of keys) add(k);
  add(given);
  const out = [];
  for (const s of sentencesOf(text)) {
    if (!/(?:\bjawab\b|\banswer\b|\bisliye\b|\btoh\b[^.!?]*\b(?:hoga|hogi|hai|hain)\b|=|\byaani\b|\bso\b[^.!?]*\bis\b)/i.test(s)) continue;
    // (a working shown from its own numbers, "8 + 3 = 11", is arithmetic, not a stated key)
    const shown = new Set([...s.matchAll(/(\d+)\s*([+\-×x*])\s*(\d+)\s*=\s*(\d+)/g)].filter((m) => { const [a, op, b, c] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])]; return (op === "+" && a + b === c) || (op === "-" && a - b === c) || ("×x*".includes(op) && a * b === c); }).map((m) => m[4]));
    for (const x of s.match(/\d+\/\d+|\d+(?:\.\d+)?/g) ?? []) if (!ok.has(x) && !shown.has(x)) out.push(x);
  }
  return [...new Set(out)];
}
