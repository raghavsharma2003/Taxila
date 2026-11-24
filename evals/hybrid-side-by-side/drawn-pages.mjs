// v6.6 H3 (main, director14 hand judgement: the counter read 9 where hand read 22; it missed c5-t01 0/10, c5-t02 0/5 and flagged
// 5 that were not): contradictions read from the pages actually DRAWN (the row's screen pages), never closeBeat.board.
//  (a) a graded close (or a give-up's key) said on a page whose board is not the answered card's board
//  (b) a picture turn whose card page is drawn as the alt view (the card's words over the picture)
// Pure functions of recorded rows: the harness counts them per turn and the offline proxies re-count any recorded run.

const keyOf = (b) => (b ? JSON.stringify({ t: b.template ?? null, p: b.params ?? null }) : null);
// the same figure: the template and the params that shape it (a reveal's shade, labels and marks, a trace or names, are the
// same figure answered: "Haan, sahi hai" over the 4-part bar with 3 now shaded is the answered card's board)
const VOLATILE = new Set(["shade", "label", "labels", "marks", "mark", "hop", "trace", "names", "highlight", "reveal", "show", "answer", "mode"]);
const shapeOf = (v) => Array.isArray(v) ? v.map(shapeOf) : v && typeof v === "object"
  ? Object.fromEntries(Object.keys(v).filter((k) => !VOLATILE.has(k)).sort().map((k) => [k, shapeOf(v[k])])) : v;
const figureOf = (b) => (b ? JSON.stringify({ t: b.template ?? null, p: shapeOf(b.params ?? {}) }) : null);
const sameFigure = (a, b) => !!a && !!b && (keyOf(a) === keyOf(b) || figureOf(a) === figureOf(b));
const beatOfItem = (id) => (id ? String(id).split(":").slice(2).join(":") || null : null);

/** the pages a teacher row drew: [{from, board, template}] (one page when the turn was not paged) */
export function drawnPagesOf(row) {
  const sc = row?.screen;
  if (!sc || sc.kind !== "whiteboard") return [];
  const segs = row.segments ?? null;
  if (Array.isArray(sc.pages) && sc.pages.length) {
    return sc.pages.map((p, i) => ({ from: p.from ?? 0, board: p.board ?? null, beat: p.beat ?? null, template: segs?.[i]?.template ?? p.board?.template ?? null }));
  }
  return [{ from: 0, board: sc.boardRef ?? row.boardRef ?? null, beat: null, template: sc.template ?? sc.boardRef?.template ?? null }];
}

/** the board the card a row posed was drawn on (the page whose beat is the card's; else the last page) */
export function cardBoardOf(row) {
  const pages = drawnPagesOf(row);
  if (!pages.length) return null;
  const beat = beatOfItem(row?.check?.itemId);
  const hit = beat ? [...pages].reverse().find((p) => p.beat && (p.beat === beat || beat.endsWith(`:${p.beat}`) || beat === `ask:${p.beat}`)) : null;
  return (hit ?? pages.at(-1)).board ?? null;
}

const firstSentence = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*/) ?? [""])[0].trim();
const CLOSE_KEY = /\b(?:jawab|answer)\b[^.!?।]*\btha\b/i;
// a close that carries content (a why, a value): a bare "Haan, sahi hai." over the next card's board says nothing about either board
const contentful = (s) => /\d|\bkyunki\b|\bbecause\b|\bkyonki\b/i.test(s) || s.split(/\s+/).filter(Boolean).length > 6;
const VISUAL_READ = /\bvisual\b/;
const SAME_FIGURE_VIEWS = new Set(["unrolled@1"]);
const numsOf = (b) => String(JSON.stringify(shapeOf(b?.params ?? {}))).match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
// the page still draws the answered figure: every number that shapes it is on the page (a 3-gap line inside a 3-and-10 line)
const contains = (page, answered) => {
  const have = numsOf(page); const need = numsOf(answered);
  if (!need.length) return false;
  for (const n of need) { const k = have.indexOf(n); if (k < 0) return false; have.splice(k, 1); }
  return true;
};
// (c) model words: the verdict sentence states a fraction whose parts no page of the answered board draws ("milkar 1/3 hota hai"
// over the 2-part roti)
const strayFraction = (s, board) => {
  const have = new Set(numsOf(board));
  return [...String(s).matchAll(/(?<![\d/])(\d+)\s*\/\s*(\d+)(?![\d/])/g)].some((m) => !have.has(Number(m[2])) && Number(m[2]) !== 1);
};

/**
 * Per teacher row: {closeOffBoard, cardAsAlt, modelWords} (0/1 each). `cardRow` is the teacher row that posed the card being
 * answered (the last row with a card id), `prevChild` the child's words between.
 */
export function drawnContradictions(row, cardRow, prevChild, { answerBoard = null, beatBoard = null } = {}) {
  const out = { closeOffBoard: 0, cardAsAlt: 0, modelWords: 0, partOffBeat: 0 };
  if (!row || row.who !== "teacher") return out;
  const pages = drawnPagesOf(row);
  if (!pages.length) return out;
  const text = String(row.text ?? "").replace(/\s+/g, " ").trim();
  const firstText = text.slice(0, pages[1]?.from ?? text.length);
  // (a) the close is the first page's words: a graded verdict, or a give-up / reveal stating the card's key
  const graded = row.gate?.answered ?? null;
  const gave = !graded && CLOSE_KEY.test(firstText) && cardRow?.check?.itemId && row.check?.itemId !== cardRow.check.itemId;
  if ((graded || gave) && cardRow) {
    const answered = cardBoardOf(cardRow);
    const s1 = firstSentence(firstText);
    const closeWords = graded ? firstText : firstText.slice(Math.max(0, firstText.search(CLOSE_KEY)));
    const beat = beatOfItem(cardRow.check?.itemId);
    const onAnswered = (beat && pages[0].beat && (pages[0].beat === beat || beat.endsWith(`:${pages[0].beat}`)))
      || sameFigure(pages[0].board, answered) || sameFigure(pages[0].board, answerBoard) || contains(pages[0].board, answered);
    // (a wrong verdict that leaves the card — the last card of a skill, the bridge drawn — is said over the wrong figure too)
    // (a remediation's own page — "rem:" or its then-card — is where a wrong answer is meant to go)
    const leaves = graded && graded !== "correct" && row.check?.itemId !== cardRow.check?.itemId
      && !/^(?:rem|then):/.test(String(pages[0].beat ?? "")) && !/:then:/.test(String(row.check?.itemId ?? "")) && !/^(?:reteach|remediate)$/.test(String(row.move ?? ""));
    // (v6.6, director15: a not-right verdict that only names their answer — "16 m sahi nahi hai." — says nothing about either board;
    // brain/propose.js says it on the page it opens, a remediation's. Only a why or a key said off the answered card counts)
    // (v6.7 H4, main's director15 ruling: a miss verdict naming their answer or any value — "2/1 sahi nahi hai." — said as the
    // remediation's page opens COUNTS from director16; a bare one with no value — "Nahi, yeh jawab nahi hai." — says nothing)
    const bareNo = graded && graded !== "correct" && !/\d|(?<![\p{L}])(?:kyunki|because|jawab\s+.{1,30}?\s+(?:tha|hai))(?![\p{L}])/iu.test(s1);
    // (a graded turn with no verdict at all — her line is the next card — has no close to misplace: the missing verdict is counted
    // apart, as the gate's verdictGiven)
    const hasVerdict = gave || /(?<![\p{L}])(?:sahi|theek|bilkul|haan|nahi|galat|jawab|right|correct|not|yes)(?![\p{L}])/iu.test(s1);
    if (answered && hasVerdict && !onAnswered && (bareNo ? leaves : contentful(s1) || contentful(closeWords.split(/(?<=[.!?।])\s/)[0] ?? "") || leaves)) out.closeOffBoard = 1;
    // (v6.7 H4: the stated-fraction flag is dropped — main: it raised false flags, and V1 makes the verdict code's)
    void strayFraction;
  }
  // (c) v6.7 H4: each part of her line on the page of its own beat (the harness records her line's parts with the beat each belongs
  // on: row.pageParts [{ from, beat }]); a recorded run without them: a language or "didn't understand" turn whose first page is a
  // remediation's while the live card is that remediation's follow-up — the follow-up's words over the remediation's figure
  if (Array.isArray(row.pageParts) && row.pageParts.length) {
    const pageAt = (from) => [...pages].reverse().find((p) => (p.from ?? 0) <= from) ?? pages[0];
    const txt = String(row.text ?? "").replace(/\s+/g, " ").trim();
    for (const [k, pp] of row.pageParts.entries()) {
      const seg = txt.slice(pp.from ?? 0, row.pageParts[k + 1]?.from ?? txt.length);
      // (a bare not-right verdict, no value, no why, no key, opens the page after it, by design; a part under 5 words is said
      // over the page before it — brain/propose.js's short-page rule)
      if (pp.part === "close" && !/\d|(?<![\p{L}])(?:kyunki|because|jawab\s+(?!nahi\b|sahi\s+nahi\b|theek\s+nahi\b).{1,30}?\s+(?:tha|hai)\b)/iu.test(seg) && /(?<![\p{L}])(?:nahi|not)(?![\p{L}])/iu.test(seg)) continue;
      if (seg.split(/\s+/).filter(Boolean).length < 5) continue;
      const pg = pageAt(pp.from ?? 0);
      if (pp.beat && pg.beat && String(pp.beat).replace(/^explain:/, "") !== String(pg.beat).replace(/^explain:/, "")) { out.partOffBeat = 1; break; }
    }
  } else if (prevChild && /\blanguage\b/.test(String(prevChild.read ?? "")) && /^rem:/.test(String(pages[0].beat ?? ""))
    && /:then:/.test(String(row.check?.itemId ?? "")) && String(row.check.itemId).endsWith(String(pages[0].beat).slice(4))) out.partOffBeat = 1;
  // (a language turn whose move teaches an explain beat, drawn on a board that is not that beat's figure: c6 offtopic 32, a worked
  // step's words over e3)
  else if (prevChild && /\blanguage\b/.test(String(prevChild.read ?? "")) && pages.length === 1 && beatBoard) {
    const m = /:explain:(e\d+)$/.exec(String(row.beat ?? ""));
    const bb = m ? beatBoard(m[1]) : null;
    // (the live card's own page is its words' page: an ask with its own figure is drawn there)
    if (bb && !sameFigure(pages[0].board, bb) && !(row.check?.itemId && sameFigure(pages[0].board, cardBoardOf(row)))) out.partOffBeat = 1;
  }
  // (b) a picture asked for: the page carrying the card's words must draw the card's own board, not the alt view
  if (prevChild && VISUAL_READ.test(String(prevChild.read ?? "")) && row.card) {
    const last = pages.at(-1);
    const cardTemplate = last.board?.template ?? null;
    // (the card page's own take: the row's whole-turn screen is the first page's take, so it cannot say what the card page drew)
    // (the unrolled view is the card's own sides laid flat: the card's words are true of it)
    if (cardTemplate && last.template && last.template !== cardTemplate && !SAME_FIGURE_VIEWS.has(last.template)) out.cardAsAlt = 1;
  }
  return out;
}

/** every row of a recorded lesson: [{i, closeOffBoard, cardAsAlt, modelWords}] for the flagged ones */
export function drawnContradictionsOf(rows, { answerBoardOf = () => null, beatBoardOf = null } = {}) {
  const flags = [];
  let cardRow = null, prevC = null;
  rows.forEach((r, i) => {
    if (r.who === "child") { prevC = r; return; }
    if (r.who !== "teacher") return;
    const sk = /^(s\d+):/.exec(String(r.beat ?? ""))?.[1] ?? null;
    const d = drawnContradictions(r, cardRow, prevC, { answerBoard: answerBoardOf(cardRow?.check?.itemId ?? null), beatBoard: beatBoardOf && sk ? (id) => beatBoardOf(sk, id) : null });
    if (d.closeOffBoard || d.cardAsAlt || d.modelWords || d.partOffBeat) flags.push({ i, ...d });
    if (r.check?.itemId) cardRow = r;
    prevC = null;
  });
  return flags;
}
