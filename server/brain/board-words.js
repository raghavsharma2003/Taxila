// v6 R3 (main, director8: "her words describe only what's drawn"; c4 stuck T19 described a pizza over a word table, c5-t02's
// four picture asks were answered with words about other drawings): on a picture the child asked for, code says what the board
// it sends shows, from the board's own params (the same params Studio draws). Pure. Never a value the board withholds, never
// the live card's key.
const SHAPE_HI = { rect: "rectangle", rectangle: "rectangle", square: "square", triangle: "triangle", polygon: "band shape", circle: "circle" };
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : null);
const list = (xs, lang) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} ${lang === "english" ? "and" : "aur"} ${xs.at(-1)}` : xs[0] ?? "");

/** The board's params, nested ({ template, params }) or flat ({ template, ...params }). */
const paramsOf = (b) => (b?.params && typeof b.params === "object" ? b.params : b ?? {});

/**
 * One sentence saying what the board shows, in the lesson language, or null when the board is not one code can describe
 * (an auto pick, an unknown template). `key`: the live card's key; a description that would say it is cut to the shape alone.
 * @param {import("../../shared/contracts").BoardRef | null} board
 */
export function boardWords(board, lang = "hinglish", key = null) {
  if (!board || typeof board !== "object" || board.auto || typeof board.template !== "string") return null;
  const en = lang === "english";
  const p = paramsOf(board);
  const t = board.template.split("@")[0];
  let s = null, bare = null;
  if (t === "fraction-parts") {
    const parts = num(p.parts), shade = num(p.shade);
    const whole = typeof p.whole === "string" && p.whole.trim() ? p.whole.trim() : en ? "shape" : "shape";
    bare = en ? `On the screen is a ${whole}.` : `Screen par ek ${whole} hai.`;
    if (parts) s = en ? `On the screen is a ${whole} cut into ${parts} equal parts${shade ? `, ${shade} of them coloured` : ""}.`
      : `Screen par ek ${whole} hai, ${parts} barabar hisson mein bata hua${shade ? `, ${shade} hissa rangin` : ""}.`;
  } else if (t === "fraction-line") {
    const from = num(p.from) ?? 0, to = num(p.to) ?? 1, den = num(p.den);
    const gaps = den ? Math.round((to - from) * den) : null;
    const labels = (Array.isArray(p.marks) ? p.marks : []).map((m) => (m && typeof m.label === "string" ? m.label : null)).filter(Boolean);
    bare = en ? `On the screen is a number line from ${from} to ${to}.` : `Screen par ${from} se ${to} tak ki line hai.`;
    s = en ? `On the screen is a number line from ${from} to ${to}${gaps ? `, cut into ${gaps} equal gaps` : ""}${labels.length ? `, with ${list(labels, lang)} marked` : ""}.`
      : `Screen par ${from} se ${to} tak ki line hai${gaps ? `, ${gaps} barabar hisson mein bati hui` : ""}${labels.length ? `; ${list(labels, lang)} par nishaan hai` : ""}.`;
  } else if (t === "compare") {
    const l = p.left?.title, r = p.right?.title;
    if (l && r) s = en ? `On the screen are two columns: ${l} and ${r}.` : `Screen par do khaane hain: ${l} aur ${r}.`;
  } else if (t === "equal-groups") {
    const g = num(p.groups), e = num(p.each);
    bare = en ? "On the screen are equal groups." : "Screen par barabar group hain.";
    if (g) s = en ? `On the screen are ${g} equal groups${e && board.withhold !== "item" ? `, ${e} in each` : ""}.` : `Screen par ${g} barabar group hain${e && board.withhold !== "item" ? `, har group mein ${e}` : ""}.`;
  } else if (t === "measured") {
    const shape = SHAPE_HI[String(p.shape ?? "").toLowerCase()] ?? (en ? "shape" : "shape");
    const unit = typeof p.unit === "string" ? p.unit : "";
    const u = (x) => `${x}${unit ? ` ${unit}` : ""}`;
    bare = en ? `On the screen is a ${shape}.` : `Screen par ek ${shape} hai.`;
    if (num(p.w) && num(p.h)) s = en ? `On the screen is a ${shape}, ${u(p.w)} long and ${u(p.h)} wide.` : `Screen par ek ${shape} hai, ${u(p.w)} lamba aur ${u(p.h)} chauda.`;
    else if (Array.isArray(p.sides) && p.sides.length) { const xs = p.sides.map((x) => (num(x) != null ? u(x) : null)).filter(Boolean); if (xs.length) s = en ? `On the screen is a ${shape} with sides ${list(xs, lang)}.` : `Screen par ek ${shape} hai, bhujayein ${list(xs, lang)}.`; }
  } else if (t === "fraction-bars") {
    // (Studio fraction-bars@1, Learning's c5-t02 worked board: two bars of the same size, each in its own equal parts)
    const bars = (Array.isArray(p.bars) ? p.bars : []).filter((b) => b && num(b.parts));
    bare = en ? "On the screen are bars of the same size." : "Screen par ek jaisi pattiyan hain.";
    if (bars.length) {
      const one = (b) => (en ? `one in ${b.parts} equal parts${num(b.shade) ? `, ${b.shade} coloured` : ""}` : `ek ${b.parts} barabar hisson mein${num(b.shade) ? `, ${b.shade} rangin` : ""}`);
      s = en ? `On the screen are ${bars.length} bars of the same size: ${list(bars.map(one), lang)}.` : `Screen par ${bars.length} ek jaisi pattiyan hain: ${list(bars.map(one), lang)}.`;
    }
  } else if (t === "wholes") {
    // (Studio wholes@1, Learning's c4 e2: two wholes cut into pieces, equal or not)
    const ws = (Array.isArray(p.wholes) ? p.wholes : []).filter((w) => w && num(w.parts));
    if (ws.length) {
      const one = (w, i) => { const n = typeof w.title === "string" && w.title.trim() ? w.title.trim() : en ? `whole ${i + 1}` : `${i + 1} wala`; const eq = w.equal !== false;
        return en ? `${n} in ${w.parts} ${eq ? "equal" : "unequal"} pieces` : `${n} ke ${w.parts} ${eq ? "barabar" : "alag-alag"} tukde`; };
      s = en ? `On the screen: ${ws.map(one).join("; ")}.` : `Screen par: ${ws.map(one).join("; ")}.`;
    }
  } else if (t === "shape") {
    const name = typeof p.name === "string" && p.name.trim() ? p.name.trim() : SHAPE_HI[String(p.shape ?? "").toLowerCase()] ?? p.shape;
    if (name) s = en ? `On the screen is a ${name}.` : `Screen par ek ${name} hai.`;
  }
  const k = String(key ?? "").match(/\d+(?:\/\d+)?/)?.[0];
  if (s && k && new RegExp(`(?<![\\d/])${k.replace("/", "\\/")}(?![\\d/])`).test(s)) return bare;
  return s ?? bare;
}
