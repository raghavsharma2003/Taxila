// The claims board (round 4 content, brief items 3 and 6): when no other board passes the gate against her line, draw
// EXACTLY what her line says is on the screen, from code. Measured before (owner-5 and round3-forge on the untouched base,
// local production build, 2026-10-10): board slots that never became a board while she said "screen par 5 barabar parts
// dekhiye; 3 shaded hain" — the line plan and the code board both failed W10 (her screen claims not drawn), so the slot
// failed and her line pointed at nothing.
//
// Her line's own claims (server/studio/qa/semantics.js screenClaims: "N equal parts", "N groups, M in each") plus a shaded
// count ("3 shaded", "5 mein se 3") become a template call (server/forge/explainer/templates.js: fraction-parts@1,
// equal-groups@1); the result is hidden when her line asks for it. The caller re-gates the board against her line with the
// full gate (W0-W13), so a claims board that would reveal an answer or contradict her is never drawn. Pure, no model.
import { screenClaims } from "../studio/qa/semantics.js";
import { expand } from "../forge/explainer/templates.js";

const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, das: 10 };
const num = (w) => (/^\d+$/.test(w) ? Number(w) : NUM[String(w).toLowerCase()]);
const W = `(\\d+|${Object.keys(NUM).join("|")})`;

/** The shaded count her line states ("3 shaded", "3 rangeen", "5 mein se 3", "3 out of 5"), or null. */
export function shadedIn(line, parts) {
  const t = String(line ?? "").toLowerCase();
  const m = t.match(new RegExp(`\\b${W}\\s+(?:parts?\\s+|hisse\\s+|tukde\\s+)?(?:shaded|coloured|colored|rangeen|rang\\s+bhare|bhare)\\b`))
    ?? t.match(new RegExp(`\\b${parts}\\s+(?:mein\\s+se|me\\s+se|out\\s+of)\\s+${W}\\b`));
  if (!m) return null;
  const n = num(m[1]);
  return Number.isInteger(n) && n >= 0 && n <= parts ? n : null;
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
