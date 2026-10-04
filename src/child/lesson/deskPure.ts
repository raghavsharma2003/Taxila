// PURE lesson-screen helpers (no React, no .tsx): the inferred question card, the Ask title, the practice count.

const QUESTION = /[^.!?\u0964…]*[?？][\s"”']*$/;

/** Legacy ask: the last question sentence of her hand-over turn (the Director does not send ui.ask yet). */
export function inferAsk(text: string): string | null {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  const sentences = flat.split(/(?<=[.!?\u0964…?])\s+/).filter(Boolean);
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (!QUESTION.test(sentences[i])) continue;
    const q = sentences[i].trim();
    // The question card keeps its context sentence (flows G15: "Kitne players honge?" lost "4 rows, 4 in each"): a
    // question with no number of its own, after a sentence that carries the numbers, keeps that sentence above it.
    const prev = i > 0 ? sentences[i - 1].trim() : "";
    if (prev && /\d/.test(prev) && !/\d/.test(q) && !QUESTION.test(prev) && prev.length + q.length + 1 <= 160) return `${prev} ${q}`;
    return q.slice(0, 160);
  }
  return null;
}

/** PURE. The lesson title for an Ask: the child's question, ≤ 24 chars on a word boundary (flows G11). */
export function questionShortTitle(text: string | undefined): string {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (s.length <= 24) return s;
  const cut = s.slice(0, 23).replace(/\s+\S*$/, "");
  return `${cut || s.slice(0, 23)}…`;
}

/** Quick practice is a short set (V2 §3.6): the count never exceeds this. */
export const PRACTICE_OF = 5;
/**
 * PURE. The practice counter: the server's ui.practice when sent (W2-C), else counted from the items the child has
 * been asked (n = items posed, capped at 5) and the items that got a verdict (done at 5).
 */
export function practiceCount(server: { n: number; of: number; done?: boolean } | undefined, posed: number, graded: number): { n: number; of: number; done: boolean } {
  if (server && server.n > 0) return { n: Math.min(server.n, server.of), of: Math.min(server.of, PRACTICE_OF), done: !!server.done };
  return { n: Math.max(1, Math.min(posed, PRACTICE_OF)), of: PRACTICE_OF, done: graded >= PRACTICE_OF };
}

