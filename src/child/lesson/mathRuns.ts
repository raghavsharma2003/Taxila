// The plain board's maths lines, split for typesetting (Board.tsx).
/** PURE: a maths line split into text and fractions ("1/2 = 2/4" → 1/2, " = ", 2/4). Round 8 (src/ui-v3/r8/lesson.css)
 *  stacks each fraction; without the round 8 theme the spans read as before, slash and all. The text content is unchanged
 *  (the slash stays in the DOM, hidden by the theme), so readers, tests and copy-paste see the same string. */
export function mathRuns(text: string): Array<{ frac: [string, string] } | { text: string }> {
  const out: Array<{ frac: [string, string] } | { text: string }> = [];
  let last = 0;
  for (const m of text.matchAll(/(\d+)\/(\d+)/g)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ frac: [m[1], m[2]] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
