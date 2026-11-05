// round 7 S2 (main's director2 decision: "no real worked example anywhere"): a worked example is RENDERED IN CODE from the kit's
// verified worked example: what is given, then each calculation, then the answer, with fixed connectors in the lesson language.
// The model words one framing sentence only (brain/say.js). The kit's examples are English; what code takes from them is the
// language-free part (numbers, units, the calculation chains), never the English sentences. PURE.

const UNIT = String.raw`(?:km|cm|mm|m|kg|g|ml|l|rupees|rs|₹|°|units?|sq\s*m|m²|cm²)`;
const NUM = String.raw`\d+(?:\.\d+)?(?:\/\d+)?`;

/** The numbers the problem gives, with their units where it names one ("50 m", "30 m", "3"). In order, no repeats. */
export function givensOf(problem) {
  const out = [];
  for (const m of String(problem ?? "").matchAll(new RegExp(String.raw`(?<![\d.\/])(${NUM})\s*(${UNIT})?(?![\w\/])`, "giu"))) {
    const g = m[2] ? `${m[1]} ${m[2].replace(/\s+/g, " ")}` : m[1];
    if (!out.includes(g)) out.push(g);
  }
  return out;
}

/** The calculation in a step: its longest run of numbers, operators and "=" that holds an "=" ("2 × (50 + 30) = 2 × 80 = 160 m"). */
export function chainOf(step) {
  const runs = String(step ?? "").match(new RegExp(String.raw`[\d(][\d\s×x*÷/+\-−().=]*=\s*${NUM}(?:\s*${UNIT})?`, "giu")) ?? [];
  const best = runs.map((r) => r.replace(/\s+/g, " ").trim()).sort((a, b) => b.length - a.length)[0];
  return best && /\d\s*[×x*÷/+\-−]\s*[\d(]/.test(best) ? best : null;
}

// the verbal step shapes of the kits ("1/3 of 15 is 5", "into 5 equal gaps", "each group gets 5", "3 groups of 5 make 15",
// "count 2 gaps from 0 … that mark is 2/5", "2/5 is less than 1/2"), as language-free facts code renders in the lesson language
const FACTS = [
  { re: new RegExp(String.raw`(${NUM})\s+groups?\s+of\s+(${NUM})\s+(?:make|makes|is|are)\s+(${NUM})`, "i"), say: (m) => ({ any: `${m[1]} × ${m[2]} = ${m[3]}` }) },
  { re: new RegExp(String.raw`(${NUM})\s+of\s+(${NUM})\s+(?:is|=)\s+(${NUM})`, "i"), say: (m) => ({ hi: `${m[2]} ka ${m[1]} = ${m[3]}`, en: `${m[1]} of ${m[2]} = ${m[3]}` }) },
  { re: new RegExp(String.raw`into\s+(${NUM})\s+equal\s+\p{L}+`, "iu"), say: (m) => ({ hi: `${m[1]} barabar hisse`, en: `${m[1]} equal parts` }) },
  { re: new RegExp(String.raw`each\s+\p{L}+\s+(?:is|gets|has)\s+(${NUM})`, "iu"), say: (m) => ({ hi: `har hissa = ${m[1]}`, en: `each part = ${m[1]}` }) },
  { re: new RegExp(String.raw`count\s+(${NUM})\s+\p{L}+\s+from\s+(${NUM})[^]*?(?:mark|point)\s+is\s+(${NUM})`, "iu"), say: (m) => ({ hi: `${m[2]} se ${m[1]} hisse aage = ${m[3]}`, en: `${m[1]} parts on from ${m[2]} = ${m[3]}` }) },
  { re: new RegExp(String.raw`(${NUM})\s+is\s+(less|more|greater|bigger|smaller)\s+than\s+(${NUM})`, "i"), say: (m) => ({ any: `${m[1]} ${/less|smaller/i.test(m[2]) ? "<" : ">"} ${m[3]}` }) },
];
/** A verbal step as a fact in the lesson language, or null. */
export function factOf(step, lang = "hinglish") {
  for (const f of FACTS) {
    const m = String(step ?? "").match(f.re);
    if (m) { const s = f.say(m); return s.any ?? (lang === "english" ? s.en : s.hi); }
  }
  return null;
}
/** A step as one code line's content: its calculation chain, else its fact. */
export const stepLine = (step, lang) => chainOf(step) ?? factOf(step, lang);

/** The answer: the last chain's result ("480 m"). */
export function answerOf(we) {
  const chains = (we?.steps ?? []).map((x) => stepLine(x, "english")).filter((x) => x && /=/.test(x));
  const last = chains.at(-1);
  if (!last) return null;
  const m = last.match(new RegExp(String.raw`=\s*(${NUM}(?:\s*${UNIT})?)\s*$`, "iu"));
  return m ? m[1] : null;
}

const WORDS = {
  hinglish: { given: "Diya hai", first: "Pehle", then: "Phir", answer: "Toh jawab", and: "aur" },
  hindi: { given: "Diya hai", first: "Pehle", then: "Phir", answer: "Toh jawab", and: "aur" },
  english: { given: "Given", first: "First", then: "Then", answer: "So the answer is", and: "and" },
};
const list = (xs, and) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${and} ${xs.at(-1)}`);

/**
 * The code lines for one part of the worked example: part 1 opens with what is given; each step with a calculation is one
 * line; the last part closes with the answer. `upTo` (a faded step's index) stops before that step, so the gap's key is never
 * said before it is posed. null when the kit's example has no calculation code can read (the model's own wording stands).
 * @param {{ problem: string, steps: string[] }} we
 * @returns {string[] | null}
 */
export function renderWorked(we, { part = 1, parts = 1, upTo = null, lang = "hinglish" } = {}) {
  const W = WORDS[lang] ?? WORDS.hinglish;
  const steps = we?.steps ?? [];
  if (!steps.length) return null;
  const per = Math.ceil(steps.length / Math.max(1, parts));
  const from = (part - 1) * per;
  const to = Math.min(upTo ?? Infinity, part * per, steps.length);
  const chains = [];
  for (let i = from; i < to; i++) { const c = stepLine(steps[i], lang); if (c) chains.push(c); }
  const lines = [];
  if (part === 1) { const g = givensOf(we.problem); if (g.length) lines.push(`${W.given}: ${list(g, W.and)}.`); }
  chains.forEach((c, i) => lines.push(`${i === 0 && part === 1 ? W.first : W.then}: ${c}.`));
  const last = upTo == null && to >= steps.length ? answerOf(we) : null;
  if (last) lines.push(`${W.answer}: ${last}.`);
  return chains.length ? lines : null;
}
