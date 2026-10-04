// The explainer's CODE pick (W2-B #2): a template call read from the text the teacher's own content comes from (the
// posed item's prompt, else the kit's worked example: the SAME source the module values use, live-content audit 6), with
// every number taken from that text and nothing invented. Pure, synchronous, no model: the Director can call it on the
// turn path, and it is the floor under the model fill and the library.
import { extractValues } from "../../../shared/engine-catalog.js";

const subjectOf = (topicId) => String(topicId ?? "").split("-")[1] ?? "";
const ints = (v) => v.numbers.filter((n) => Number.isInteger(n) && n >= 0);

/**
 * @param {{ kit: any, item?: any, text?: string }} a  `text` overrides the source (tests)
 * @returns {{ template: string, [k: string]: unknown } | null}
 */
export function codePick({ kit, item = null, text }) {
  const subject = subjectOf(kit?.topicId);
  if (subject !== "maths") return null;
  const src = String(text ?? item?.prompt_en ?? kit?.workedExample?.problem ?? "");
  if (!src) return null;
  const v = extractValues(src);
  const lower = src.toLowerCase();
  const n = ints(v);
  // a fraction of a whole: the first proper fraction with a small denominator
  const fr = v.fractions.find(([a, d]) => d >= 2 && d <= 12 && a >= 0 && a <= d);
  if (fr) return { template: "fraction-parts@1", whole: /roti|chapati|pizza|cake|pie/.test(lower) ? "roti" : fr[1] <= 8 ? "circle" : "bar", parts: fr[1], shade: fr[0] };
  const two = n.length >= 2 ? [n[0], n[1]] : null;
  if (two && /\b(add|sum|total|plus|altogether|in all|more)\b|\+/.test(lower)) {
    const [a, b] = two;
    if (a <= 10 && b <= 10) return { template: "combine-count@1", a, b, op: "add" };
    if (a <= 99999 && b <= 99999) return { template: "column-op@1", a, b, op: "add" };
  }
  if (two && /\b(subtract|minus|difference|left|take away|fewer|less)\b|[−-]\s*\d/.test(lower)) {
    const a = Math.max(...two), b = Math.min(...two);
    if (a <= 10) return { template: "combine-count@1", a, b, op: "take_away" };
    if (a <= 99999) return { template: "column-op@1", a, b, op: "sub" };
  }
  if (two && /\b(times|multiply|multiplied|groups? of|each|rows? of|product)\b|×/.test(lower)) {
    const g = Math.min(...two), e = Math.max(...two);
    if (g >= 2 && g <= 6 && e >= 1 && e <= 8) return { template: "equal-groups@1", groups: g, each: e };
  }
  if (/number line|jump|hop|skip/.test(lower) && n.length >= 2 && n[0] <= 100 && n[1] >= 1 && n[1] <= 20) {
    return { template: "number-line-hop@1", start: n[0], hops: [/back|left|minus|subtract/.test(lower) ? -n[1] : n[1]] };
  }
  const big = n.find((x) => x >= 1000 && x <= 9_999_999);
  if (big && /place|value|lakh|thousand|digit|expanded|read|write|number name|indian/.test(lower)) return { template: "place-value@1", value: big };
  return null;
}
