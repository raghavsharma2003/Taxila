// round 7 (C1 studio-board-richness): a table whose every cell is COMPUTED, never copied from a model. Two sources a kit
// names in its own words: "the table of 4" (n | 4 × n for n = 1..10) and a linear rule "y = 4x + 5" (x | y for x = 0..4).
// → a table@1 call (templates.js), or null. Pure; never throws.

const TIMES = /\b(?:table of|times table of|multiplication table of)\s+(\d{1,2})\b|\b(\d{1,2})\s+times table\b|\b(\d{1,2})\s*ka\s+pahada\b/i;   // never "N ki table" ("x = 0, 1, 2 ki table banao" is a table FOR x)
// y = 4x + 5, y = 20x + 50, y = -2x + 3, y = 3x: y and x only, an integer slope, an optional integer intercept; and only in a
// kit about a linear pattern / relationship / graph ("h = 20 m" is a unit, "p = 2k" a proof step: never tabulated)
const RULE = /\b(y)\s*=\s*([−-]?\d{1,3})\s*(x)\s*(?:([+−-])\s*(\d{1,4}))?(?![\w(.])/g;
const LINEAR_TOPIC = /\blinear\b|\bpattern|\brelationship|\bgraph\b|table of values/i;

function kitText(kit) {
  try { return JSON.stringify([kit?.expectations, kit?.workedExample, kit?.items]); } catch { return ""; }
}

/** The table call for this kit (or `text` first), or null. */
export function tableCall(kit, { text = "" } = {}) {
  try {
    for (const src of [String(text ?? ""), kitText(kit)]) {
      const t = src.match(TIMES);
      if (t) {
        const n = Number(t[1] ?? t[2] ?? t[3]);
        if (n >= 2 && n <= 20) return { template: "table@1", head: ["n", `${n} × n`], rows: Array.from({ length: 10 }, (_, i) => [String(i + 1), String(n * (i + 1))]), rule: `table of ${n}` };
      }
      // the rule with an intercept when the kit gives one ("y = 4x + 5" over a bare "y = 4x")
      const rs = LINEAR_TOPIC.test(src) ? [...src.matchAll(RULE)] : [];
      const r = rs.find((m) => m[4]) ?? rs[0];
      if (r) {
        const a = Number(r[2].replace("−", "-")), b = r[4] ? Number(r[5]) * (r[4] === "+" ? 1 : -1) : 0;
        if (a !== 0 && Math.abs(a) <= 100 && Math.abs(b) <= 1000) {
          const [yv, xv] = [r[1], r[3]];
          const rule = `${yv} = ${a === 1 ? "" : a === -1 ? "-" : a}${xv}${b ? ` ${b > 0 ? "+" : "-"} ${Math.abs(b)}` : ""}`;
          return { template: "table@1", head: [xv, yv], rows: [0, 1, 2, 3, 4].map((x) => [String(x), String(a * x + b)]), rule };
        }
      }
    }
    return null;
  } catch { return null; }
}
