// The one word tokenizer the eval, the labeler and the module agree on: Latin word runs (apostrophes inside a word kept).
// Hyphenated compounds are separate words ("dheere-dheere" -> dheere, dheere). Shared so gold indices line up.
export const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
export function words(text) {
  const out = [];
  for (const m of String(text).matchAll(WORD_RE)) out.push({ w: m[0], i: m.index });
  return out;
}
