// The claims board (round 4 content, brief items 3 and 6): when no other board passes the gate against her line, draw
// EXACTLY what her line says is on the screen, from code. Measured before (owner-5 and round3-forge on the untouched base,
// local production build, 2026-10-10): board slots that never became a board while she said "screen par 5 barabar parts
// dekhiye; 3 shaded hain" — the line plan and the code board both failed W10 (her screen claims not drawn), so the slot
// failed and her line pointed at nothing.
//
// Her line's own claims (server/studio/qa/semantics.js screenClaims: "N equal parts", "N groups, M in each") plus a shaded
// count ("3 shaded", "5 mein se 3", "unmein 6 marked") become a template call (server/forge/explainer/templates.js:
// fraction-parts@1, equal-groups@1, shade-grid@1 for "5 columns aur 3 rows" or more than 12 parts); the result is hidden when her line asks for it. The caller re-gates the board against her line with the
// full gate (W0-W13), so a claims board that would reveal an answer or contradict her is never drawn. Pure, no model.
import { screenClaims, POINTS_AT_SCREEN } from "../studio/qa/semantics.js";
import { expand } from "../forge/explainer/templates.js";

const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10 };
const num = (w) => (/^\d+$/.test(w) ? Number(w) : NUM[String(w).toLowerCase()]);
const W = `(\\d+|${Object.keys(NUM).join("|")})`;

/** The shaded count her line states ("3 shaded", "3 rangeen", "5 mein se 3", "3 out of 5"), or null. */
export function shadedIn(line, parts) {
  const t = String(line ?? "").toLowerCase();
  const m = t.match(new RegExp(`\\b${W}\\s+(?:parts?\\s+|hisse\\s+|tukde\\s+|boxes\\s+|cells?\\s+|squares?\\s+)?(?:shaded|coloured|colored|rangeen|rang\\s+bhare|bhare|marked)\\b`))
    ?? t.match(new RegExp(`\\b${parts}\\s+(?:mein\\s+se|me\\s+se|out\\s+of)\\s+${W}\\b`))
    ?? t.match(new RegExp(`\\b(?:unmein|unme|inmein|of\\s+them|of\\s+these)\\s+${W}\\s+(?:shaded|coloured|colored|rangeen|marked)\\b`));
  if (!m) return null;
  const n = num(m[1]);
  return Number.isInteger(n) && n >= 0 && n <= parts ? n : null;
}

/**
 * The steps her line lists over the screen ("flow dekhiye: Observe, Ask, Predict, Test, phir Conclude"), 3-6 short names
 * in her order, the one she asks for written "?" (the first step, or the step after X): or null.
 */
export function flowIn(line) {
  const t = String(line ?? "");
  if (!POINTS_AT_SCREEN.test(t)) return null;
  const m = t.match(/\b(?:flow|flow\s*chart|steps?|chain|cycle|kram|sequence|order)\b[^:.?!]{0,30}:\s*([^.?!]+)/i);
  if (!m) return null;
  const steps = m[1].split(/\s*(?:,|;|→|->|\bphir\b|\baur\s+phir\b|\band\s+then\b|\bthen\b|\band\b|\baur\b)\s*/i).map((x) => x.trim()).filter(Boolean);
  if (steps.length < 3 || steps.length > 6 || !steps.every((x) => x.split(/\s+/).length <= 3 && x.length <= 20)) return null;
  const after = t.match(/["“']?([\p{L}][\p{L}\s-]{1,40}?)["”']?\s+(?:ke\s+baad|ke\s+bad)\b[^?]{0,60}\?/iu)?.[1]
    ?? t.match(/\b(?:what|which)\s+(?:step\s+)?(?:comes|is|happens)\s+(?:next\s+)?after\s+["“']?([\p{L}][\p{L}\s-]{1,40}?)["”']?\s*\?/iu)?.[1];
  const first = /\b(?:sabse\s+pehle|pehla\s+step|pahla\s+step|first\s+step)\b[^?]{0,60}\?/iu.test(t);
  const out = [...steps];
  if (first) out[0] = "?";
  if (after) { const i = steps.findIndex((x) => x.toLowerCase() === after.trim().toLowerCase()); if (i >= 0 && i + 1 < steps.length) out[i + 1] = "?"; }
  return out;
}

/** Template calls that draw her line's screen claims (most specific first), or []. */
export function claimsCalls(line) {
  const c = screenClaims(line);
  const asks = /\?\s*$/.test(String(line ?? "").trim()) || /\b(kitne|kitna|kitni|how many|how much|bataiye|batao|what is)\b/i.test(String(line ?? ""));
  const out = [];
  // "3 equal groups, with 5 dots in each" / "5 each" / "har group mein 5": the each-count after the group word
  const eachM = String(line ?? "").toLowerCase().match(new RegExp(`\\b${W}\\s+(?:[a-z]+\\s+)?(?:in\\s+each|each|har\\s+(?:group|ek)\\s+mein)\\b`));
  const eachN = eachM ? num(eachM[1]) : null;
  for (const g of c.groups) if (g.each == null && eachN) g.each = eachN;
  for (const g of c.groups) if (g.each != null && g.n >= 2 && g.n <= 6 && g.each >= 1 && g.each <= 8) out.push({ template: "equal-groups@1", groups: g.n, each: g.each, hideResult: asks });
  // a grid ("5 columns aur 3 rows"; or more than 12 equal parts, laid out as the squarest grid): its cells, the shaded
  // count her line gives. Her line naming shaded / marked cells WITHOUT a count draws nothing (the board would show none).
  const namesShade = /\b(shaded|coloured|colored|rangeen|marked|mark)\b/i.test(String(line ?? ""));
  // the area model of a fraction of a fraction ("5 columns aur 3 rows; 3/5 wale hisson mein 2 rows mark"): c/d of the
  // columns, a of the b rows inside them (fraction-of@1), the count hidden when she asks for it
  for (const g of c.grids) {
    const fr = String(line ?? "").match(new RegExp(`\\b(\\d+)\\s*/\\s*${g.cols}\\b`));
    const rowsM = String(line ?? "").toLowerCase().match(new RegExp(`\\b${W}\\s+rows?\\s+(?:mark|marked|shaded|rangeen|coloured|colored)`));
    const cn = fr ? Number(fr[1]) : null, an = rowsM ? num(rowsM[1]) : null;
    if (cn >= 1 && cn <= g.cols && an >= 1 && an <= g.rows && g.rows <= 6 && g.cols <= 6) out.push({ template: "fraction-of@1", a: an, b: g.rows, c: cn, d: g.cols, hideResult: asks });
  }
  const grids = c.grids.map((g) => ({ ...g, labels: true }));
  for (const n of c.parts) if (n > 12 && n <= 60) { let r = Math.floor(Math.sqrt(n)); while (r > 1 && n % r) r--; if (r > 1) grids.push({ rows: r, cols: n / r, labels: false }); }
  for (const g of grids) {
    const shade = shadedIn(line, g.rows * g.cols);
    if (namesShade && shade == null) continue;
    out.push({ template: "shade-grid@1", rows: g.rows, cols: g.cols, shade: shade ?? 0, labels: g.labels, hideResult: asks });
  }
  const flowSteps = flowIn(line);
  if (flowSteps) out.push({ template: "flow@1", steps: flowSteps });
  for (const n of c.parts) if (n >= 2 && n <= 12) {
    const shade = shadedIn(line, n);
    const food = /roti|chapati|pizza|cake|pie/i.test(String(line ?? ""));
    const bar = /\b(bar|strip|patti|rectangle|line)\b/i.test(String(line ?? ""));
    out.push({ template: "fraction-parts@1", parts: n, shade: shade ?? 0, whole: bar || n > 8 ? "bar" : food ? "roti" : "circle" });
  }
  return out;
}

/** The first claims board that expands cleanly, re-timed and re-gated by the caller's functions, or null. */
export function claimsBoard(ask, ctx, { band = "B3", lessonId = "", retime, regate, withSectors, board }) {
  try {
    for (const call of claimsCalls(ask?.line?.text)) {
      const x = expand(call, { band, lessonId });
      if (!x.ok) continue;
      const s = withSectors(retime(x.script, Math.max(800, Number(x.script.durationMs) || 0), ctx.speechMs), ctx.reply);
      const r = regate({ ...s, board: { ...board, ...(s.board ?? {}) } }, ask, ctx);
      if (r.ok) return { ...r, template: call.template, by: "claims" };
    }
  } catch { /* a floor, never a failure */ }
  return null;
}
