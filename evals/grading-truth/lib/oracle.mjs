// The grading-truth ORACLE (VALUES-100 V1.1). Everything a case's truth label depends on lives here, written
// independently of every grader under test: none of server/**, shared/** or src/** is imported. A case's truth is
// decided by construction (the value the simulated child means), never by running a grader.
//
//   - exact rationals: { n, d } with gcd-reduced compare (no floats on the truth side);
//   - a seeded RNG (mulberry32) so every battery run is reproducible from --seed;
//   - surface forms: the many ways a class 4-7 child in India writes or says ONE value (digits, Indian and
//     international grouping, English / Roman-Hindi / Devanagari number words, fraction forms, decimals, units,
//     currency, speech-to-text wrappers, self-corrections). Each form carries `kind`, which is what the root-cause
//     tables group by;
//   - wrong values: near misses a child really produces (±1, ±10, a place-value slip, num/den swap, sign drop).
//
// The Hindi number words are written out here from the standard Hindi numeral list (not copied from any grader's
// table), so a grader and this oracle sharing a misspelling cannot make a wrong grade invisible.

// ───────────── RNG ─────────────
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { next, int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), pick: (xs) => xs[Math.floor(next() * xs.length)], chance: (p) => next() < p,
    shuffle: (xs) => { const a2 = [...xs]; for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; } };
}

// ───────────── exact rationals ─────────────
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const Q = (n, d = 1) => { if (!d) throw new Error("zero denominator"); const s = d < 0 ? -1 : 1, g = gcd(n, d); return { n: (s * n) / g, d: (s * d) / g }; };
export const qEq = (a, b) => a.n === b.n && a.d === b.d;
export const qNum = (q) => q.n / q.d;
export const qStr = (q) => (q.d === 1 ? String(q.n) : `${q.n}/${q.d}`);
/** Exact value of a plain key string the ORACLE controls ("72", "3/4", "1 1/2", "0.75", "-3", "4,527", "1,00,000"). null if not plain. */
export function keyValue(s) {
  const t = String(s ?? "").trim().replace(/^(?:₹|rs\.?)\s*/i, "");
  let m = t.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) { const w = +m[2], n = +m[3], d = +m[4]; return d ? Q((m[1] ? -1 : 1) * (w * d + n), d) : null; }
  m = t.match(/^(-?\d+)\/(\d+)$/);
  if (m) return +m[2] ? Q(+m[1], +m[2]) : null;
  m = t.match(/^(-?)(\d{1,3}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/);
  if (m) {
    const whole = Number(m[2].replace(/,/g, "")), frac = m[3] ?? "";
    const d = 10 ** frac.length, n = whole * d + (frac ? Number(frac) : 0);
    return Q((m[1] ? -1 : 1) * n, d);
  }
  return null;
}
export const isTerminating = (q) => { let d = q.d; for (const p of [2, 5]) while (d % p === 0) d /= p; return d === 1; };
export function decimalStr(q) {
  if (!isTerminating(q)) return null;
  const neg = q.n < 0, n = Math.abs(q.n);
  let places = 0, s;
  for (places = 0; places < 8; places++) if (Number.isInteger((n * 10 ** places) / q.d)) break;
  s = ((n * 10 ** places) / q.d).toString().padStart(places + 1, "0");
  s = places ? `${s.slice(0, -places)}.${s.slice(-places)}` : s;
  return (neg ? "-" : "") + s;
}

// ───────────── number words (oracle's own tables) ─────────────
const EN1 = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
  "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN10 = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const en99 = (n, hy = true) => (n < 20 ? EN1[n] : EN10[Math.floor(n / 10)] + (n % 10 ? (hy ? "-" : " ") + EN1[n % 10] : ""));
const en999 = (n, and = false, hy = true) => { const h = Math.floor(n / 100), r = n % 100; return [h ? `${EN1[h]} hundred` : "", r ? `${h && and ? "and " : ""}${en99(r, hy)}` : ""].filter(Boolean).join(" "); };
/** English words, Indian system (lakh, crore) or international (thousand, million). */
export function enWords(n, { system = "intl", and = false, hy = true } = {}) {
  if (!Number.isInteger(n) || n < 0) return null;
  if (n === 0) return "zero";
  const parts = [];
  if (system === "indian") {
    const cr = Math.floor(n / 1e7), lk = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1000), r = n % 1000;
    if (cr) parts.push(`${en999(cr, and, hy)} crore`); if (lk) parts.push(`${en99(lk, hy)} lakh`); if (th) parts.push(`${en99(th, hy)} thousand`); if (r) parts.push(en999(r, and, hy));
  } else {
    const mi = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1000), r = n % 1000;
    if (mi) parts.push(`${en999(mi, and, hy)} million`); if (th) parts.push(`${en999(th, and, hy)} thousand`); if (r) parts.push(en999(r, and, hy));
  }
  return parts.join(" ");
}
// Hindi 1-99 in common Roman spelling (one canonical spelling per number; variants are in HI_VARIANTS).
const HI = ("ek do teen chaar paanch chhah saat aath nau das gyaarah baarah terah chaudah pandrah solah satrah athaarah unnees bees " +
  "ikkees baais teis chaubees pachchees chhabbees sattaees atthaees untees tees iktees battees taintees chauntees paintees chhattees saintees adtees untaalees chaalees " +
  "iktaalees bayaalees taintaalees chavaalees paintaalees chhiyaalees saintaalees adtaalees unchaas pachaas ikyaavan baavan tirpan chauvan pachpan chhappan sattaavan atthaavan unsath saath " +
  "iksath baasath tirsath chausath painsath chhiyaasath sadsath adsath unhattar sattar ikhattar bahattar tihattar chauhattar pachhattar chhihattar satattar athattar unaasi assi " +
  "ikyaasi bayaasi tiraasi chauraasi pachaasi chhiyaasi sattaasi athaasi navaasi nabbe ikyaanve baanve tiraanve chauraanve pachaanve chhiyaanve sattaanve atthaanve ninyaanve").split(" ");
if (HI.length !== 99) throw new Error(`oracle Hindi table has ${HI.length} entries, want 99`);
/** Common alternate spellings children / STT produce (a subset; used as a form kind of its own). */
const HI_VARIANTS = { 4: "char", 5: "panch", 6: "chhe", 11: "gyarah", 12: "barah", 19: "unnis", 21: "ikkis", 25: "pachchis", 40: "chalis", 50: "pachas" };
export function hiWords(n, { variant = false } = {}) {
  if (!Number.isInteger(n) || n < 1 || n >= 1e9) return null;
  const w99 = (x) => (variant && HI_VARIANTS[x]) || HI[x - 1];
  const parts = [];
  const cr = Math.floor(n / 1e7), lk = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1000), h = Math.floor((n % 1000) / 100), r = n % 100;
  if (cr) parts.push(`${w99(cr)} crore`); if (lk) parts.push(`${w99(lk)} lakh`); if (th) parts.push(`${w99(th)} hazaar`); if (h) parts.push(`${w99(h)} sau`); if (r) parts.push(w99(r));
  return parts.join(" ");
}
const DEV_DIG = "०१२३४५६७८९";
export const devDigits = (s) => String(s).replace(/\d/g, (d) => DEV_DIG[+d]);
const DEV_W = { 1: "एक", 2: "दो", 3: "तीन", 4: "चार", 5: "पाँच", 6: "छह", 7: "सात", 8: "आठ", 9: "नौ", 10: "दस", 12: "बारह", 15: "पंद्रह", 20: "बीस", 25: "पच्चीस",
  30: "तीस", 40: "चालीस", 50: "पचास", 60: "साठ", 100: "सौ" };
export const devWord = (n) => DEV_W[n] ?? null;

export function groupIndian(n) { const s = String(Math.abs(n)); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3); }
export function groupIntl(n) { return String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

const ORD_EN = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"] };

// ───────────── surface forms ─────────────
/**
 * Every form of an integer the oracle can render. Truth for each = the integer itself.
 * @returns {{ text: string, kind: string }[]}
 */
export function intForms(n) {
  const out = [{ text: String(n), kind: "digits" }];
  if (n < 0) { out.push({ text: `minus ${Math.abs(n)}`, kind: "neg-minus-word" }, { text: `−${Math.abs(n)}`, kind: "neg-unicode-minus" }); return out; }
  if (n >= 1000) out.push({ text: groupIntl(n), kind: "intl-grouping" });
  if (n >= 100000) out.push({ text: groupIndian(n), kind: "indian-grouping" });
  else if (n >= 1000) out.push({ text: groupIndian(n), kind: "indian-grouping" });
  const e = enWords(n); if (e) out.push({ text: e, kind: "en-words" });
  if (n >= 100000) { const ei = enWords(n, { system: "indian" }); if (ei) out.push({ text: ei, kind: "en-words-indian" }); }
  if (n > 100 && n % 100) out.push({ text: enWords(n, { and: true }), kind: "en-words-and" });
  if (n > 20 && n % 10 && n < 100) out.push({ text: enWords(n, { hy: false }), kind: "en-words-nohyphen" });
  const h = hiWords(n); if (h) out.push({ text: h, kind: "hi-roman-words" });
  const hv = hiWords(n, { variant: true }); if (hv && hv !== h) out.push({ text: hv, kind: "hi-roman-variant" });
  out.push({ text: devDigits(n), kind: "dev-digits" });
  const dw = devWord(n); if (dw) out.push({ text: dw, kind: "dev-words" });
  return out;
}
/** Every form of a fraction p/q (q > 1) the oracle can render, truth = p/q. */
export function fracForms(q) {
  const { n, d } = q, out = [{ text: `${n}/${d}`, kind: "frac-slash" }, { text: `${n} / ${d}`, kind: "frac-slash-spaced" }, { text: `${n} by ${d}`, kind: "frac-by" },
    { text: `${n} upon ${d}`, kind: "frac-upon" }, { text: `${2 * n}/${2 * d}`, kind: "frac-unreduced" }, { text: devDigits(`${n}/${d}`), kind: "frac-dev-digits" }];
  if (n > 0 && n < d && ORD_EN[d]) out.push({ text: `${EN1[n]} ${n === 1 ? ORD_EN[d][0] : ORD_EN[d][1]}`, kind: "frac-en-words" });
  if (n > 0 && n <= 20 && d <= 20) out.push({ text: `${HI[n - 1]} bata ${HI[d - 1]}`, kind: "frac-hi-bata" });
  if (n === 1 && d === 2) out.push({ text: "half", kind: "frac-half-word" }, { text: "aadha", kind: "frac-aadha" });
  if (n === 1 && d === 4) out.push({ text: "one quarter", kind: "frac-quarter-word" });
  if (n === 3 && d === 4) out.push({ text: "three quarters", kind: "frac-quarter-word" });
  if (n > d) { const w = Math.floor(n / d), r = n % d; if (r) out.push({ text: `${w} ${r}/${d}`, kind: "frac-mixed" }); }
  if (n === 3 && d === 2) out.push({ text: "dedh", kind: "frac-dedh" }, { text: "one and a half", kind: "frac-en-and-half" });
  if (n === 5 && d === 2) out.push({ text: "dhai", kind: "frac-dhai" });
  if (d === 2 && n > 5 && n < 40) out.push({ text: `saade ${HI[(n - 1) / 2 - 1]}`, kind: "frac-saade" });
  const dec = decimalStr(q); if (dec && dec.length <= 6) out.push({ text: dec, kind: "decimal" });
  if (dec && dec.startsWith("0.")) out.push({ text: dec.slice(1), kind: "decimal-bare-point" }, { text: `point ${[...dec.slice(2)].map((c) => EN1[+c]).join(" ")}`, kind: "decimal-spoken" });
  return out;
}
/** Every form of a decimal with places (truth = q). */
export function decForms(q) {
  const dec = decimalStr(q); if (!dec) return [];
  const [w, f] = dec.replace("-", "").split(".");
  const out = [{ text: dec, kind: "decimal" }];
  if (f) out.push({ text: `${dec.startsWith("-") ? "minus " : ""}${enWords(+w)} point ${[...f].map((c) => EN1[+c]).join(" ")}`, kind: "decimal-spoken" });
  if (f && q.d <= 100) out.push({ text: qStr(q), kind: "decimal-as-frac" });
  return out;
}
/** Wrap a form the way a child says or types it. Truth is unchanged. */
export const WRAPS = [
  { kind: "bare", f: (x) => x }, { kind: "answer-is", f: (x) => `answer is ${x}` }, { kind: "hai", f: (x) => `${x} hai` }, { kind: "umm", f: (x) => `umm ${x}` },
  { kind: "didi", f: (x) => `${x} hoga didi` }, { kind: "i-think", f: (x) => `I think it's ${x}` }, { kind: "period", f: (x) => `${x}.` }, { kind: "mera", f: (x) => `mera answer ${x} hai` },
];
/** A self-correction ends on the meant value: "{wrong}... nahi nahi, {right}". Truth = right. */
export const selfCorrect = (wrongText, rightText) => `${wrongText}... nahi nahi, ${rightText}`;
/** A hedge between two values: no single answer, so it is NOT credit-worthy (truth = "hedge"). */
export const hedge = (a, b) => `${a} ya ${b}`;
export const UNIT_WRAPS = [
  { kind: "unit-cm", f: (x) => `${x} cm` }, { kind: "currency-symbol", f: (x) => `₹${x}` }, { kind: "currency-rs", f: (x) => `Rs. ${x}` }, { kind: "currency-word", f: (x) => `${x} rupees` },
  { kind: "unit-kg", f: (x) => `${x} kg` }, { kind: "unit-degrees", f: (x) => `${x}°` },
];

/** A wrong integer near n, with the slip that produced it. Never equal to n. */
export function nearMiss(r, n) {
  const opts = [
    { v: n + 1, why: "plus-one" }, { v: n - 1, why: "minus-one" }, { v: n + 10, why: "plus-ten" }, { v: n * 10, why: "place-x10" },
    ...(n >= 10 ? [{ v: Math.floor(n / 10), why: "place-div10" }] : []),
    ...(String(Math.abs(n)).length >= 2 ? [{ v: Number(String(Math.abs(n)).split("").reverse().join("")) * Math.sign(n || 1), why: "digit-swap" }] : []),
    ...(n < 0 ? [{ v: -n, why: "sign-drop" }] : n > 0 ? [{ v: -n, why: "sign-add" }] : []),
  ].filter((o) => o.v !== n && Number.isFinite(o.v));
  return r.pick(opts);
}
/** A wrong fraction near p/q, with the slip. Never equal in value to p/q. */
export function nearMissFrac(r, q) {
  const opts = [
    { v: Q(q.n + 1, q.d), why: "num-plus-one" }, { v: Q(q.d, q.n || 1), why: "swap" }, ...(q.d > 2 ? [{ v: Q(q.n, q.d - 1), why: "den-minus-one" }] : []),
    { v: Q(q.n, q.d + 1), why: "den-plus-one" }, { v: Q(q.n + q.d, q.d), why: "plus-one-whole" },
  ].filter((o) => !qEq(o.v, q) && o.v.n !== 0);
  return r.pick(opts);
}
