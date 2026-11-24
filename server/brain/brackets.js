// round 7 (main's hybrid-pilot judgement #5): a bracketed operation spoken so it cannot be misheard. The pilot's worked example
// said "Ek round ka perimeter 2 times 50 plus 30, yani 160 m": heard as 2 × 50 + 30 = 130, while the kit's step is
// 2 × (50 + 30) = 160. A spoken "N times A plus B" (or "N guna A jama B") where the lesson's content has N × (A + B) is
// rewritten in code to the sum first, then the multiple ("50 plus 30, yani 80, ka 2 guna"). PURE.

const OPS = [
  { re: /(\d+(?:\.\d+)?)\s*[×x*]\s*\(\s*(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*\)/g, op: "+" },
  { re: /(\d+(?:\.\d+)?)\s*[×x*]\s*\(\s*(\d+(?:\.\d+)?)\s*[−-]\s*(\d+(?:\.\d+)?)\s*\)/g, op: "-" },
];

/** The bracketed multiples in the lesson's content lines: [{ n, a, b, op }]. */
export function bracketsIn(content = []) {
  const out = [];
  for (const line of content ?? []) for (const { re, op } of OPS) for (const m of String(line).matchAll(re)) out.push({ n: m[1], a: m[2], b: m[3], op });
  return out;
}

const esc = (x) => String(x).replace(/\./g, "\\.");
const spokenSlip = ({ n, a, b, op }) => new RegExp(`\\b${esc(n)}\\s*(?:times|guna|into|x|×)\\s*${esc(a)}\\s*${op === "+" ? "(?:plus|jama|aur|\\+)" : "(?:minus|ghata|ghatao|−|-)"}\\s*${esc(b)}\\b`, "i");

/** The first bracket her line speaks ambiguously ("2 times 50 plus 30" for 2 × (50 + 30)), or null. */
export function bracketSlip(text, content = []) {
  for (const br of bracketsIn(content)) if (spokenSlip(br).test(String(text ?? ""))) return br;
  return null;
}

/** Her line with each ambiguous bracket said sum (or difference) first, then the multiple. */
export function sayBrackets(text, content = [], lang = "hinglish") {
  let out = String(text ?? "");
  for (const br of bracketsIn(content)) {
    const inner = br.op === "+" ? Number(br.a) + Number(br.b) : Number(br.a) - Number(br.b);
    const sign = br.op === "+" ? (lang === "english" ? "plus" : "plus") : "minus";
    const said = lang === "english" ? `${br.n} times (${br.a} ${sign} ${br.b}), that is ${br.n} times ${inner}`
      : `${br.a} ${sign} ${br.b}, yani ${inner}, ka ${br.n} guna`;
    out = out.replace(spokenSlip(br), said);
  }
  return out;
}
