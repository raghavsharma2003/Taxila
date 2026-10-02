// Item bookkeeping for the director: probe mapping, the practice queue, isomorphic items, the spoken
// diagnostic (P7) built from a kit misconception, and the code-level answer-leak predicate.

/** Item kind → probe id from the catalogue (learning-science §7). Plain practice is P15, hint-ladder consumption. */
export const PROBE_FOR_KIND = {
  practice: "P15", near_transfer: "P3", far_transfer: "P4", predict: "P5", contrast: "P8", why: "P2",
  teachback: "P1", retrieval: "P10", error_spot: "P6", translate_rep: "P14",
};
/** Likelihood weights per probe (catalogue reliability bands; design starting points, not fitted). */
export const PROBE_WEIGHT = { P1: 1.2, P2: 1.0, P3: 1.2, P4: 1.2, P5: 0.8, P6: 1.0, P7: 0.7, P8: 1.0, P10: 1.5, P14: 1.0, P15: 1.0 };

const KIND_ORDER = { practice: 0, predict: 1, contrast: 2, translate_rep: 3, near_transfer: 4, why: 5, error_spot: 6, far_transfer: 7, retrieval: 8 };
export const QUEUE_MAX = 12;
/** Error-spotting only after basic mastery (rule 6: never for novices). */
const ERROR_SPOT_P = 0.7;

const DIAG_PREFIX = "diag:";
export const probeFor = (item) => (item.diagnostic ? "P7" : PROBE_FOR_KIND[item.kind] ?? "P15");

/** The prompt to pose, in the child's language (Hinglish/Hindi kits carry prompt_hi). */
export const promptFor = (item, lang) => (lang === "english" ? item.prompt_en : item.prompt_hi) || item.prompt_en;

/**
 * A misconception's diagnostic as a pseudo-item, so it runs through the same ladder and evidence path.
 * @returns {import("../../shared/contracts").KitItem & { diagnostic: true, options: any[] } | null}
 */
export function diagnosticItem(kit, m) {
  const d = m?.diagnostic;
  const correct = d?.options.find((o) => o.correct);
  if (!correct) return null;
  const withOptions = (p) => (d.options.every((o) => p.toLowerCase().includes(o.text.toLowerCase())) ? p : `${p} (${d.options.map((o) => o.text).join(" / ")})`);
  const anchor = kit.items.find((i) => i.targetsMisconception === m.id) ?? kit.items[0];
  return {
    id: DIAG_PREFIX + m.id, skillId: anchor.skillId, kind: "contrast", difficulty: 2,
    prompt_en: withOptions(d.prompt_en), prompt_hi: withOptions(d.prompt_hi),
    answer: correct.text, acceptable: [],
    hints: [
      "pump: ask them to picture both choices as real things",
      `hint: use ${m.remediation.representation}`,
      "prompt: a fill-in-the-blank that compares the two choices",
      "assertion: say which option is right, with a one-line reason",
    ],
    targetsMisconception: m.id, diagnostic: true, options: d.options,
  };
}

/** Resolve an item id against the kit, its diagnostics, and the warm-up snapshot in the lesson state. */
export function findItem(s, kit, id) {
  if (!id) return null;
  if (id.startsWith(DIAG_PREFIX)) return diagnosticItem(kit, kit.misconceptions.find((m) => m.id === id.slice(DIAG_PREFIX.length)));
  return kit.items.find((i) => i.id === id) ?? s.warmup.find((w) => w.id === id) ?? null;
}

/**
 * Practice order: skills in kit order (prerequisites first), items by difficulty then kind, teach-back
 * held for the teach-back phase, and one spoken diagnostic second in line — the child's known
 * misconception if this kit has it, else the kit's first.
 */
export function buildPracticeQueue(kit, { activeMisconceptionIds = [] } = {}) {
  const ids = [];
  for (const sk of kit.skills) {
    ids.push(...kit.items.filter((i) => i.skillId === sk.id && i.kind !== "teachback")
      .sort((a, b) => a.difficulty - b.difficulty || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]).map((i) => i.id));
  }
  const m = kit.misconceptions.find((x) => x.diagnostic && activeMisconceptionIds.includes(x.id)) ?? kit.misconceptions.find((x) => x.diagnostic);
  if (m) ids.splice(Math.min(1, ids.length), 0, DIAG_PREFIX + m.id);
  return ids.slice(0, QUEUE_MAX);
}

/** Next item to pose, or null when the queue is spent. `easier` picks the gentlest remaining one. */
export function selectNext(s, kit, { easier = false } = {}) {
  const done = new Set([...s.itemsDone, ...s.skipped]);
  const ok = s.queue.map((id) => findItem(s, kit, id)).filter((it) => {
    if (!it || done.has(it.id) || it.id === s.activeItemId) return false;
    if (it.kind !== "error_spot") return true;
    const sk = s.skills[it.skillId];
    return !!sk && sk.pKnown >= ERROR_SPOT_P && sk.correctUnaided >= 1;
  });
  if (!easier) return ok[0] ?? null;
  return [...ok].sort((a, b) => a.difficulty - b.difficulty)[0] ?? null;
}

/** After an assertion the child must solve an isomorphic item: same skill, closest difficulty. */
export function isomorphicFor(s, kit, item) {
  const done = new Set(s.itemsDone);
  const KINDS = ["practice", "near_transfer", "contrast", "retrieval", "predict"];
  return kit.items
    .filter((i) => i.skillId === item.skillId && i.id !== item.id && !done.has(i.id) && KINDS.includes(i.kind))
    .sort((a, b) => Math.abs(a.difficulty - item.difficulty) - Math.abs(b.difficulty - item.difficulty)
      || (a.kind === item.kind ? -1 : 0) - (b.kind === item.kind ? -1 : 0))[0] ?? null;
}

/** The key idea a "why?" after a correct answer is classified against. */
export function whyKey(kit, skillId) {
  const why = kit.items.find((i) => i.kind === "why" && i.skillId === skillId) ?? kit.items.find((i) => i.kind === "why");
  return why?.answer || kit.expectations.slice(0, 2).join("; ") || null;
}

/** Fractions and plain numbers in a text, for module params and the whiteboard anchor. */
export function extractValues(text) {
  const t = String(text || "");
  const fractions = [...t.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map((m) => [+m[1], +m[2]]);
  const numbers = [...t.replace(/\d+\s*\/\s*\d+/g, " ").matchAll(/\d+(?:\.\d+)?/g)].map((m) => +m[0]);
  return { fractions, numbers };
}

/** Whiteboard anchor for an item: its fractions or numbers, else the shortened prompt. */
export function anchorOf(item, lang) {
  const p = promptFor(item, lang);
  const { fractions, numbers } = extractValues(p);
  if (fractions.length) return { kind: "math", value: fractions.map(([n, d]) => `${n}/${d}`).join("  ·  ") };
  if (numbers.length && numbers.length <= 4) return { kind: "math", value: numbers.join("  ·  ") };
  return { kind: "text", value: p.length > 60 ? p.slice(0, 57) + "…" : p };
}

// Spoken fraction forms → "n/d", so "one-half", "aadha" and "ek bata do" all compare equal to 1/2.
const NUM = { one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4, chaar: 4, five: 5, paanch: 5, panch: 5,
  six: 6, chhe: 6, chhah: 6, seven: 7, saat: 7, eight: 8, aath: 8, nine: 9, nau: 9, ten: 10, das: 10 };
const DEN = { half: 2, halves: 2, third: 3, thirds: 3, tihai: 3, fourth: 4, fourths: 4, quarter: 4, quarters: 4, chauthai: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, eighth: 8, eighths: 8, tenth: 10, tenths: 10 };
const NUM_RE = `(\\d+|${Object.keys(NUM).join("|")})`;
const toN = (w) => (/^\d+$/.test(w) ? w : String(NUM[w]));
/** Canonicalize spoken fractions in already-lowercased text. */
export function canonicalFractions(t) {
  return t
    .replace(new RegExp(`\\b${NUM_RE}\\s*(?:by|bata|upon|out of)\\s*${NUM_RE}\\b`, "g"), (_, a, b) => `${toN(a)}/${toN(b)}`)
    // "char mein se teen" = three out of four
    .replace(new RegExp(`\\b${NUM_RE}\\s*(?:mein|me|main)\\s*se\\s*${NUM_RE}\\b`, "g"), (_, a, b) => `${toN(b)}/${toN(a)}`)
    .replace(new RegExp(`\\b${NUM_RE}[\\s-]+(${Object.keys(DEN).join("|")})\\b`, "g"), (_, a, d) => `${toN(a)}/${DEN[d]}`)
    .replace(/\b(half|aadha|aadhi|adha|adhi)\b/g, "1/2")
    .replace(/\b(quarter|paav|pav)\b/g, "1/4")
    .replace(/\bpaune\b/g, "3/4");
}
export const norm = (s) => canonicalFractions(String(s || "").toLowerCase().replace(/[“”"'’`]/g, "").replace(/[^\p{L}\p{N}/.\s-]/gu, " ").replace(/\s+/g, " ").trim());
const VERDICT = new Set(["bada", "badi", "bade", "zyada", "jyada", "bigger", "larger", "greater", "more", "chhota", "chhoti", "smaller",
  "less", "kam", "sahi", "correct", "right", "answer", "jawab", "uttar", "hota", "hoti", "equals", "is"]);
function containsTerm(text, term) {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}/])${esc}($|[^\\p{L}\\p{N}/])`, "u").test(text);
}

/**
 * Code-level answer-leak check (rule 15: guard leakage on the bytes, not only by instruction).
 * A key form the question itself does not contain is a leak wherever it appears. A form the question
 * names (e.g. one of two fractions being compared) is a leak only in a statement — not a question —
 * that puts a verdict word next to it.
 */
export function revealsAnswer(text, item) {
  if (!item) return false;
  const t = norm(text);
  const promptText = norm(`${item.prompt_en} ${item.prompt_hi}`);
  for (const form of [item.answer, ...(item.acceptable || [])].map(norm).filter(Boolean)) {
    if (!containsTerm(t, form)) continue;
    if (!containsTerm(promptText, form)) return true;
    for (const sentence of String(text).split(/(?<=[.!?।])\s+/)) {
      if (/\?\s*$/.test(sentence)) continue;
      const words = norm(sentence).split(" ");
      const at = words.findIndex((w, i) => words.slice(i, i + form.split(" ").length).join(" ") === form);
      if (at < 0) continue;
      if (words.slice(Math.max(0, at - 3), at + form.split(" ").length + 4).some((w) => VERDICT.has(w))) return true;
    }
  }
  return false;
}
