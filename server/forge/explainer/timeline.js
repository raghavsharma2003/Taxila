// round 7 (C1 studio-board-richness): a timeline from the kit's OWN dated facts, code only. Kit authors write chains like
// "Rajaraja builds Brihadeeswara (1010) → Mahmud raids Somnath (1025–26) → First Battle of Tarain (1191)" or "the Constituent
// Assembly first meets (9 December 1946); the Constitution is adopted (26 November 1949)": each "label (date)" is an event,
// its label the kit's words, its year the kit's number. The kit string with the most events (≥ 3) becomes timeline@1
// (templates.js: a true-scale axis, leader-lined labels). BCE dates are left out (the axis is CE only). Pure; never throws.

const YEAR = /\b(\d{3,4})\b/;
// "label (… year …)": the label runs back from "(" to the previous separator
const EVENT = /([^→;:()[\]"\n.]{3,60}?)\s*\(([^()]{0,40}?\b\d{3,4}\b[^()]{0,20}?)\)/g;
const LEAD = /^(?:\s*(?:and|then|so|make a (?:word )?timeline|put these in order|order)\b[:,]?\s*)+/i;

/** Every English string in a kit (prompts, answers, steps, expectations); never the Hindi fields. */
function kitStrings(kit) {
  const out = [];
  const walk = (v, key = "") => {
    if (/_hi$|^hi$/i.test(key)) return;
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk([kit?.expectations, kit?.workedExample, kit?.items]);
  return out;
}

/** The events of one string: [{ year, label }] in text order (labels the kit's words, trimmed). */
export function eventsIn(s) {
  const out = [];
  for (const m of String(s ?? "").matchAll(EVENT)) {
    const date = m[2];
    if (/BCE|BC\b/i.test(date)) continue;
    const year = Number((date.match(YEAR) ?? [])[1]);
    if (!Number.isInteger(year) || year < 100 || year > 2100) continue;
    let label = m[1].replace(LEAD, "").replace(/^[\s,–-]+|[\s,–-]+$/g, "").replace(/\s+/g, " ");
    label = label.replace(/^(?:the|a|an)\s+/i, (w) => w.charAt(0).toUpperCase() + w.slice(1));
    label = label.charAt(0).toUpperCase() + label.slice(1);
    if (label.length < 3 || label.length > 32 || label.split(" ").length > 5 || /\d/.test(label)) continue;
    out.push({ year, label });
  }
  return out;
}

/**
 * The timeline call for this kit (or for `text`, the line being explained, first), or null: the kit string with the
 * most events, ≥ 3 distinct years, at most 6, in time order.
 */
export function timelineCall(kit, { text = "" } = {}) {
  try {
    let best = null;
    for (const s of [text, ...kitStrings(kit)]) {
      const seen = new Set();
      const ev = eventsIn(s).filter((e) => !seen.has(e.year) && seen.add(e.year));
      if (ev.length >= 3 && (!best || ev.length > best.length)) best = ev;
    }
    if (!best) return null;
    const events = [...best].sort((a, b) => a.year - b.year).slice(0, 6);
    return { template: "timeline@1", events };
  } catch { return null; }
}
