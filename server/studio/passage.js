// The passage pager (docs/design/round7/learning/PASSAGE.md, "What Studio needs"): a kit passage's text, EXACTLY as the kit
// wrote it, cut into pages a 360 px phone shows at 16 px type with no sideways scroll. Pure; never throws.
//
// Rules (Learning's page): a poem or letter (lines joined by "\n") is cut BETWEEN lines, never inside one; prose is cut at
// sentence ends; a page holds about 280 characters or 8 lines at the phone's width, whichever is less. A single line or
// sentence longer than a page is cut at a clause (", " / "; " / " — "), else between words. Pages are offsets into the text:
// their slices, joined with the separator that sat between them, ARE the text (a board that rewrites or shortens the
// passage breaks its question).

/** At 16 px in the ~328 px a 360 px phone leaves after its 16 px gutters (PASSAGE.md): characters per rendered line. */
export const PER_LINE = Object.freeze({ latin: 36, devanagari: 30 });
export const PAGE_MAX = Object.freeze({ chars: 280, lines: 8 });

const DEVA = /[ऀ-ॿ]/;
const perLine = (s) => (DEVA.test(s) ? PER_LINE.devanagari : PER_LINE.latin);
/** The lines a piece of text takes at the phone's width (each "\n" line wraps on its own). */
export function renderedLines(s) {
  return String(s).split("\n").reduce((n, l) => n + Math.max(1, Math.ceil([...l.trim()].length / perLine(l))), 0);
}
const fits = (s) => [...s.trim()].length <= PAGE_MAX.chars && renderedLines(s.trim()) <= PAGE_MAX.lines;

/** The text's units as [start, end) offsets: its lines (a poem / letter), else its sentences; each unit cut until it fits. */
function unitsOf(text) {
  const spans = [];
  if (text.includes("\n")) {
    let at = 0;
    for (const line of text.split("\n")) { spans.push([at, at + line.length]); at += line.length + 1; }
  } else {
    const re = /[^.!?।]+(?:[.!?।]+["'”’)\]]*|$)/gu;
    let m;
    while ((m = re.exec(text))) { if (!m[0]) { re.lastIndex++; continue; } spans.push([m.index, m.index + m[0].length]); }
  }
  // (an over-long unit: at a clause, else between words — never inside a word)
  const out = [];
  const cut = (a, b) => {
    const s = text.slice(a, b);
    if (fits(s) || b - a < 2) { out.push([a, b]); return; }
    let best = -1;
    for (const re of [/[,;:—–]\s+/g, /\s+/g]) {
      let m;
      while ((m = re.exec(s))) { const k = m.index + m[0].length; if (k > 0 && k < s.length && fits(s.slice(0, k))) best = k; }
      if (best > 0) break;
    }
    if (best <= 0) { out.push([a, b]); return; }   // (one word longer than a page: kept whole, reported by the caller's check)
    out.push([a, a + best]);
    cut(a + best, b);
  };
  for (const [a, b] of spans) if (text.slice(a, b).trim()) cut(a, b);
  return out;
}

/**
 * A passage → its pages. → { pages: [{ n, start, end, text, chars, lines }], kind, poem } — `text` is the page's slice of
 * the kit text, trimmed; consecutive pages share no character and leave out only the whitespace between them.
 * @param {{ id?: string, text: string, title?: string, kind?: string }} passage
 */
export function pagePassage(passage) {
  const text = String(passage?.text ?? "");
  const poem = text.includes("\n");
  const units = unitsOf(text);
  const pages = [];
  let cur = null;
  for (const [a, b] of units) {
    if (cur && fits(text.slice(cur[0], b))) { cur[1] = b; continue; }
    if (cur) pages.push(cur);
    cur = [a, b];
  }
  if (cur) pages.push(cur);
  return {
    kind: passage?.kind ?? (poem ? "poem" : "prose"), poem,
    pages: pages.map(([a, b], i) => {
      // (the page's own text, without the whitespace or newline that separates it from the next)
      const raw = text.slice(a, b), lead = raw.length - raw.trimStart().length, t = raw.trim();
      return { n: i + 1, start: a + lead, end: a + lead + t.length, text: t, chars: [...t].length, lines: renderedLines(t) };
    }),
  };
}

/** The page that holds a char offset (the part of the text a question is about), 1-based; 1 when it is not on any page. */
export function pageAt(paged, offset) {
  const p = (paged?.pages ?? []).find((x) => offset >= x.start && offset < x.end);
  return p ? p.n : 1;
}

/**
 * The tray artifact for a passage (shared/studio.ts kind "passage"): the kit's text paged, the page she is reading from.
 * @param {{ id: string, text: string, title?: string|null, kind?: string|null }} passage @param {{ page?: number, lang?: string|null }} [o]
 */
export function passageArtifact(passage, { page = 1, lang = null } = {}) {
  const paged = pagePassage(passage);
  const n = Math.min(paged.pages.length, Math.max(1, Math.floor(Number(page) || 1)));
  return { kind: "passage", passage: { id: String(passage?.id ?? ""), title: passage?.title ?? null, kind: passage?.kind ?? null, lang: lang ?? (DEVA.test(String(passage?.text ?? "")) ? "hi" : "en"),
    pages: paged.pages.map((p) => ({ n: p.n, text: p.text })), page: n } };
}

/** The renderer's layout at a box, by predicate (src/studio/PassageRenderer.tsx: 12 px padding, 16 px type (18 Young), line
 *  height 1.6, a 44 px button row when paged): → { ok, why, lines, scrolls } for the TALLEST page. */
export function passageFits(artifact, box, { young = false } = {}) {
  const ps = artifact?.passage;
  if (!ps || !Array.isArray(ps.pages) || !ps.pages.length || !box?.w || !box?.h) return { ok: false, why: "no passage or no box" };
  const fs = young ? 18 : 16, lh = fs * 1.6, w = box.w - 24;
  const per = (t) => Math.max(1, Math.floor(w / (fs * (DEVA.test(t) ? 0.62 : 0.55))));
  if (per("x") < 12) return { ok: false, why: `a line of ${per("x")} characters at ${box.w} px` };
  const linesOf = (t) => String(t).split("\n").reduce((n, l) => n + Math.max(1, Math.ceil([...l.trim()].length / per(l))), 0);
  const chrome = 24 + (ps.title ? lh + 4 : 0) + (ps.pages.length > 1 ? 44 + 8 : 0);
  const room = Math.floor((box.h - chrome) / lh);
  if (room < 2) return { ok: false, why: `room for ${room} line(s) at ${box.w}×${box.h}` };
  const lines = Math.max(...ps.pages.map((p) => linesOf(p.text)));
  return { ok: true, why: lines > room ? `the longest page scrolls (${lines} lines, ${room} in view)` : "every page fits", lines, scrolls: lines > room };
}
