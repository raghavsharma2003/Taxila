// The never-an-answer floor for the board (W2-B fixer, blocker 1): a board drawn while an item is still OPEN (a reteach
// of the question the child is answering, a hint-path explain) must never show that item's key. A template computes
// results (57 + 9 → 66; minute hand 12 to 6 → "half turn"), so a code pick from the open item's own text, a library
// diagram or a model fill can each print the answer the child has not given yet. This predicate is the last check
// before a script reaches the frame: a script that shows the key (in its facts, a drawn text, a number-work cell, or a
// row of digits written one cell at a time) is refused and the ladder steps to the next rung.
//
// A number the item's own prompt already says is never a leak (57 + 9: "57" and "9" are on the board on purpose).

/** Normalised comparison form: lower case, letters/marks/digits only, single spaces; digit groups lose their commas. */
export const norm = (v) => String(v ?? "").toLowerCase().replace(/(\d),(?=\d)/g, "$1").replace(/−/g, "-")
  .replace(/(?<!\d)[./]|[./](?!\d)/g, " ").replace(/[^\p{L}\p{M}\p{N}/.-]+/gu, " ").replace(/(?<![\p{L}\p{N}])-(?!\d)|(?<=[\p{L}\p{N}])-/gu, " ").replace(/\s+/g, " ").trim();

/** The open item's keys: its answer and every acceptable answer, normalised; numbers the prompt says are excluded. */
export function openKeys(item) {
  if (!item) return [];
  // the prompt's own tokens, a fraction's parts included ("1/4" says 1 and 4)
  const p = `${norm(item.prompt_en)} ${norm(item.prompt_hi)}`;
  const prompt = ` ${p} ${p.replace(/\//g, " ")} `;
  const keys = [item.answer, ...(Array.isArray(item.acceptable) ? item.acceptable : [])]
    .map(norm).filter((k) => k && k.length <= 40);
  // a key the prompt itself states ("which is bigger, 3/4 or 2/3?" → "3/4") is verified question content, not a leak
  return [...new Set(keys)].filter((k) => !prompt.includes(` ${k} `));
}

/** Every string the board shows: facts values, texts, labels, number-work cells and rows, and rows of single cells. */
export function boardStrings(script) {
  const out = [];
  // a fact is read as its value AND as "name value" ("halves match" is what the teacher's facts row says)
  for (const [k, v] of Object.entries(script?.facts?.onScreen ?? {})) { out.push(String(v)); out.push(`${k.replace(/([a-z])([A-Z])/g, "$1 $2")} ${v}`); }
  const cells = [];   // single-glyph texts written one per column (column-op's result row): joined by row
  for (const o of script?.ops ?? []) {
    if (o.op === "text" || o.op === "label") {
      out.push(o.text);
      if (o.op === "text" && [...o.text].length <= 2) cells.push(o);
    } else if (o.op === "numwork") {
      for (const r of o.rows ?? []) { out.push(...r); out.push(r.join(" ")); out.push(r.join("")); }
    }
  }
  const rows = new Map();
  for (const o of cells) { const y = Math.round(o.at[1] / 4); (rows.get(y) ?? rows.set(y, []).get(y)).push(o); }
  for (const r of rows.values()) if (r.length > 1) out.push(r.sort((a, b) => a.at[0] - b.at[0]).map((o) => o.text).join(""));
  return out;
}

/**
 * Does this script show the open item's answer? Returns the leaked key, or null.
 * @param {any} script  a WhiteboardScript (with facts)
 * @param {any} item    the open item (kit item: answer, acceptable, prompt_en)
 */
export function leaksOpenItem(script, item) {
  const keys = openKeys(item);
  if (!keys.length || !script) return null;
  for (const s of boardStrings(script)) {
    const n = norm(s);
    if (!n) continue;
    for (const k of keys) {
      if (n === k) return k;
      // a key inside a longer board string ("result 66", "half turn" in "a half turn", "1" in "1 and itself") as whole
      // words / a whole number
      if ((k.length >= 2 || /^\d$/.test(k)) && ` ${n} `.includes(` ${k} `)) return k;
    }
  }
  return null;
}
