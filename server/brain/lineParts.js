// v6.6 P4 (main, director14 hand judgement: 16 of 17 paging contradictions were one mechanism — a late pass rewrote her line, the
// planner searched the line for a part's text, the search failed and the close was paged onto the next card's board; the third
// time a page found by searching the text broke): her line is an ORDERED LIST OF PARTS, and the line is their join.
//
// say.js builds the list where it assembles the line (close, closed, bridge, simpler, alt, aside, body, card). Every later pass
// that edits the line keeps the list: the edit is carried word by word onto the parts (alignParts: a word kept stays in its
// part, a word replaced takes the part of the word it replaced, a word added joins the part before it). propose.js pages the
// line from the list — part offsets are the join's own offsets — and never searches the text for a part.

const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const toks = (t) => norm(t).split(" ").filter(Boolean);

/** The parts with text, normalised (empty parts dropped). */
export function cleanParts(list) {
  return (list ?? []).map((p) => ({ ...p, text: norm(p.text) })).filter((p) => p.text);
}

/** The line the parts say: their join. */
export const joinParts = (list) => cleanParts(list).map((p) => p.text).join(" ");

/**
 * The parts carried onto a new text of the line, word by word (a longest common subsequence of the words). A word kept stays in
 * its part; a run of new words that replaces a run of old words takes the part of the first word it replaced; a run that only
 * adds words joins the part before it (at the very start, the part after it). The result's join is exactly norm(newText).
 */
export function alignParts(list, newText) {
  const parts = cleanParts(list);
  const nt = toks(newText);
  if (!parts.length) return nt.length ? [{ part: "line", text: nt.join(" ") }] : [];
  const old = parts.flatMap((p, i) => toks(p.text).map((w) => ({ w, i })));
  if (old.map((o) => o.w).join(" ") === nt.join(" ")) return parts;
  const n = old.length, m = nt.length;
  // LCS table (lines are ≤ ~150 words)
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let a = n - 1; a >= 0; a--) for (let b = m - 1; b >= 0; b--) L[a][b] = old[a].w === nt[b] ? L[a + 1][b + 1] + 1 : Math.max(L[a + 1][b], L[a][b + 1]);
  const owner = new Array(m).fill(-1);
  let a = 0, b = 0;
  const gapOld = [], gapNew = [];
  const flush = (prevPart, nextPart) => {
    // the new words of a gap: replacing old words → the first replaced word's part; only added → the part before (else after)
    const to = gapOld.length ? old[gapOld[0]].i : prevPart >= 0 ? prevPart : nextPart;
    for (const k of gapNew) owner[k] = to;
    gapOld.length = 0; gapNew.length = 0;
  };
  let lastPart = -1;
  while (a < n || b < m) {
    if (a < n && b < m && old[a].w === nt[b] && L[a][b] === L[a + 1][b + 1] + 1) {
      flush(lastPart, old[a].i); owner[b] = old[a].i; lastPart = old[a].i; a++; b++;
    } else if (b < m && (a >= n || L[a][b + 1] >= L[a + 1][b])) { gapNew.push(b); b++; }
    else { gapOld.push(a); a++; }
  }
  flush(lastPart, lastPart >= 0 ? lastPart : 0);
  const out = parts.map((p) => ({ ...p, text: "" }));
  nt.forEach((w, k) => { const i = owner[k] < 0 ? 0 : owner[k]; out[i].text = out[i].text ? `${out[i].text} ${w}` : w; });
  return out.filter((p) => p.text);
}

/** Each part's [start, end) in the join (end before the space that follows). */
export function offsetsOf(list) {
  let at = 0;
  return cleanParts(list).map((p) => { const o = { ...p, start: at, end: at + p.text.length }; at = o.end + 1; return o; });
}
