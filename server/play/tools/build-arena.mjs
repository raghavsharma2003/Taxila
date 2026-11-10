// The ITEM-ARENA bank (round 4 G1): challenges built from VERIFIED kit items (verified.agrees === true), each graded in
// code against its verified key; a model never grades and never writes a challenge here. Tier A only (main 2026-10-10):
//   numeric  the key is one number (₹ / unit / % / ° kept as on the key); 3 decoys made in code from common slips (±1, ±10,
//            ×10, ÷10, digits swapped, sign flipped, fraction flipped) and checked BY VALUE against the key and every
//            acceptable form, so an equivalent answer (2/4 for 1/2, 24360 for 24,360) is never offered as wrong
//   yesno    the key is yes / no (true / false, haan / nahi …): two targets
//   choice   the prompt itself offers the choices ("X or Y?", (a) … (d)) and exactly one of them is the key
// Left out: open prompts ("any", "for example", "name a", "tell me", "between"), prompts that point at a picture, keys with
// two numbers, items whose acceptable forms disagree on the value. Kit diagnostic MCQs enter only after a blind-verify pass
// (tools/arena-diag-verify.mjs) and carry the solver's model and date.
//
//   node server/play/tools/build-arena.mjs [--check]   → data/arena/<class-subject>.json + data/arena/index.json
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const KITS = join(ROOT, "data/kits"), OUT = join(ROOT, "data/arena");
/** a topic is admitted to the arena with at least this many challenges (main 2026-10-10: ≥ 6) */
export const MIN_CHALLENGES = 6;

// ── the key
const NUM_RE = /^\s*(₹\s*)?([-−]?)\s*(\d[\d,]*(?:\.\d+)?)(?:\s*\/\s*(\d+))?\s*(%|°|[a-zA-Zµ²³]{1,9}(?:\s*[a-zA-Z²³]{1,3})?)?\s*$/;
const MIXED_RE = /^\s*(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/;
const TF_YES = /^\s*(true|yes|haan|han|sahi|correct|right|हाँ|हां|सही)\s*$/i;
const TF_NO = /^\s*(false|no|nahi|nahin|galat|wrong|नहीं|गलत)\s*$/i;
const OPEN = /\b(any|for example|e\.g\.|name (a|one|two|three|some)|tell me|give (an|one|two)|between \d|think of|make up|your own|write a|draw|show me|which ones)\b/i;
const ESTIMATE = /\b(about|estimate|estimated|roughly|approximately|approx|nearest|round(ed)? (it |off |to )|close to|guess)\b/i;
const PICTURE = /\b(picture|figure|diagram|image|shown|below|above|this shape|the grid|the graph|the table|look at)\b/i;
// a numbered list ("1. Stop and stay … 2. …") is never a number: its head is the list as written, so it parses as no key
// (audit CD-08: the head was cut at the first ". " and "1" became the key of "Say the lost-child plan in three steps")
const LIST_RE = /^\s*\(?1[.)]\s+\D[\s\S]*?\s\(?2[.)]\s+\D/;
export const head = (a) => { const s = String(a ?? ""); return LIST_RE.test(s) ? s.trim() : s.split(/[;:(—–]|\. | because | kyunki /i)[0].trim().replace(/[.!]$/, ""); };
// the question asks for a number (audit CD-15): only then may a numeric key come from an acceptable form when the answer's
// own head is not a number ("Why is 4.8 ÷ 0.6 the same as 48 ÷ 6?" accepted "8" and showed four number tiles)
// the question is yes/no, why or which-one: a sentence opening on an auxiliary ("Is he right?", "Does she need to?"), a why /
// what-went-wrong / teach / explain prompt, or an "X or Y" comparison; a sentence that also asks for a number wins (ASKS_NUM)
const NOT_NUM_Q = /(^|[.?!:'"‘“]\s*)(is|are|am|was|were|do|does|did|can|could|will|would|should|has|have)\b|\b(why|what went wrong|what is wrong|what('s| is) the mistake|what do you notice|teach|explain|list all|say the|predict:|who is right|which (is|one|of|holds|can|has)|closer to|more or less|more or fewer|bigger or|smaller or|longer or|right\?|correct\?|true\?)/i;
// prompts that never want a number tile, whatever the key's head ("Teach Golu what each digit in 572 means." → "5 hundreds")
const TALK_Q = /^\s*(why|teach|explain)\b|\bwhich of these\b|\bsay the type\b/i;
const ASKS_NUM = /\b(how (many|much|long|far|old|tall|high|heavy|wide|deep|big)|what time|at what|what (is|was|will be) (it|its|their|his|her|the)\b(?! (same|mistake|rule|reason|difference between))|which (floor|quadrant|term|year|article|number)|where (should|does|do|will) [^?]{0,30}\b(sit|land|reach|go|end)|what fraction|what do you get|what will you get|(give|write|find|state|say) the (correct|right|true|next|new) |give the number|the new sum|(find|calculate|compute|work (it )?out|evaluate|simplify|solve|convert)\b|what is [a-z]\?|kitne|kitna|kitni|=\s*\?)/i;
const norm = (s) => String(s).replace(/^[‘'“"]+|[’'”"]+$/g, "").toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\p{M}.,/ ]/gu, "").replace(/\s+/g, " ").trim();

/** → { prefix, sign, int?, frac?, value, decimals, commas, indian, unit } | null */
export function parseNum(s) {
  const t = String(s).trim();
  const mx = t.match(MIXED_RE);
  if (mx) { const [w, n, d] = [Number(mx[1]), Number(mx[2]), Number(mx[3])]; return d ? { kind: "mixed", w, n, d, value: w + n / d, prefix: "", unit: "" } : null; }
  const m = t.match(NUM_RE);
  if (!m) return null;
  const [, rupee, sign, body, den, unit] = m;
  const neg = sign === "-" || sign === "−";
  const raw = body.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;
  if (den) { const n = Number(raw), d = Number(den); if (!d || raw.includes(".")) return null; return { kind: "frac", n: neg ? -n : n, d, value: (neg ? -n : n) / d, prefix: rupee ? "₹" : "", unit: unit ?? "", minus: sign }; }
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { kind: "num", value: (neg ? -1 : 1) * Number(raw), decimals, commas: body.includes(","), indian: /^\d{1,2}(,\d{2})+,\d{3}$/.test(body), prefix: rupee ? "₹" : "", unit: unit ?? "", minus: sign || "-" };
}
function fmtNum(v, like) {
  const neg = v < 0, a = Math.abs(v);
  let s = like.decimals ? a.toFixed(like.decimals) : String(Math.round(a));
  if (like.commas) { const [i, f] = s.split("."); s = Number(i).toLocaleString(like.indian ? "en-IN" : "en-US") + (f ? "." + f : ""); }
  return `${like.prefix}${neg ? (like.minus === "−" ? "−" : "-") : ""}${s}${like.unit ? (/^[%°]$/.test(like.unit) ? like.unit : " " + like.unit) : ""}`;
}
const fmtFrac = (n, d, like) => `${like.prefix}${n < 0 ? "−" : ""}${Math.abs(n)}/${d}${like.unit ? " " + like.unit : ""}`;
function rng(seedStr) { let h = 2166136261; for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 2 ** 32; }

/** three decoys in the key's own shape, each WRONG by value (never equal to the key or any acceptable value) */
export function numericDecoys(key, okValues, seed) {
  const out = [], seen = new Set(), r = rng(seed);
  const bad = (v) => !Number.isFinite(v) || okValues.some((o) => Math.abs(o - v) < 1e-9);
  const push = (text, v) => { if (bad(v) || seen.has(text)) return; seen.add(text); out.push(text); };
  if (key.kind === "frac") {
    const { n, d } = key;
    const c = [[d, n], [n + 1, d], [n, d + 1], [n - 1, d], [n + d, d], [n, d * 2 === n ? d + 2 : d * 2]];
    for (const [a, b] of c) if (b > 0 && a !== 0) push(fmtFrac(a, b, key), a / b);
  } else if (key.kind === "mixed") {
    const { w, n, d } = key;
    for (const [a, b, c] of [[w + 1, n, d], [w, d - n > 0 ? d - n : n + 1, d], [w > 0 ? w - 1 : w + 2, n, d], [n, w || 1, d]]) push(`${a} ${b}/${c}`, a + b / c);
  } else {
    const v = key.value, step = key.decimals ? 10 ** -key.decimals : 1, a = Math.abs(v);
    const digits = String(Math.round(a / step));
    const rev = digits.length > 1 && digits !== [...digits].reverse().join("") ? Number([...digits].reverse().join("")) * step * Math.sign(v || 1) : NaN;
    const slips = [v + step, v - step, v * 10, v / 10, rev, v + 10 * step, v - 10 * step, -v, v + 2 * step, v * 2, v / 2, v + 5 * step];
    const keep = (x) => (v >= 0 ? x >= 0 : true) && (key.decimals ? true : Number.isInteger(+x.toFixed(9)));
    const cand = slips.filter((x) => Number.isFinite(x) && keep(x)).map((x) => +x.toFixed(key.decimals ?? 0));
    // the first two most-likely slips first (±1 at the last place, ×10 / reversed), then a seeded mix
    const ordered = [cand[0], ...(Number.isFinite(rev) ? [rev] : []), ...cand.slice(1).sort(() => r() - 0.5)];
    for (const x of ordered) { if (out.length >= 3) break; push(fmtNum(x, key), x); }
    for (let k = 3; out.length < 3 && k < 40; k++) { const x = +(v + (r() < 0.5 ? -1 : 1) * k * step).toFixed(key.decimals ?? 0); if (keep(x)) push(fmtNum(x, key), x); }
  }
  return out.slice(0, 3);
}
const valueOf = (s) => { const p = parseNum(s); return p ? p.value : null; };

/** the choices a prompt itself offers: "(a) … (b) …" or "… X or Y?" */
export function offered(prompt) {
  const p = String(prompt ?? "");
  const letters = [...p.matchAll(/\(([a-e])\)\s*([^()]{1,60}?)(?=\s*\([a-e]\)|[?.]?\s*$)/gi)].map((m) => ({ letter: m[1].toLowerCase(), text: m[2].trim().replace(/[,;]$/, "") }));
  if (letters.length >= 2 && letters.length <= 4) return letters;
  // "…: A, B or C?" / "Which word …: A or B?" / "Does वर्षा start with ब or व?"
  const q = p.lastIndexOf("?");
  if (q < 0) return null;
  let tail = p.slice(0, q);
  const colon = Math.max(tail.lastIndexOf(":"), tail.lastIndexOf("—"));
  if (colon >= 0) tail = tail.slice(colon + 1);
  const orAt = tail.lastIndexOf(" or ");
  if (orAt < 0) return null;
  const right = tail.slice(orAt + 4).trim();
  let parts = tail.slice(0, orAt).split(/,\s*/).map((x) => x.trim()).filter(Boolean);
  const R = right.split(/\s+/).length;
  // the first part may carry the question's lead ("Does वर्षा start with ब"): trim it only to a single token, else give up
  // leading parts that are the sentence, not options ("In ionic bonding, are electrons shared …"), go; then the first
  // option may still carry the question's lead ("Does वर्षा start with ब"): trim it to a single token, else give up
  while (parts.length > 1 && parts[0].split(/\s+/).length > R + 1) parts = parts.slice(1);
  const simple = colon < 0 && parts.length === 1;      // a bare "… X or Y?": the only shape where a lead may be trimmed
  const first = parts[0]?.split(/\s+/) ?? [];
  const lead = /^(is|are|was|were|does|do|did|can|could|will|would|should|has|have|which|what|who|whose)\b/i.test(parts[0] ?? "");
  if (first.length > R + 1 || (colon < 0 && first.length > R) || (lead && first.length > 1)) {
    if (simple && R === 1 && first.length >= 2) parts[0] = first[first.length - 1];
    else return null;
  }
  // options are of a kind: none much longer than the last one (sentence fragments are not options)
  if (parts.some((x) => x.split(/\s+/).length > R + 2)) return null;
  // a list "A, B or C" only after a colon (without one, the commas are the sentence's own)
  if ((colon < 0 && parts.length > 1) || parts.length > 3 || /\b(any|another)\b/i.test(right)) return null;
  const strip = (x) => x.replace(/^[‘'“"]+|[’'”"]+$/g, "").trim();
  const opts = [...parts, right].map((x) => ({ text: strip(x) }));
  const balanced = (x) => ((x.match(/[‘’'“”"]/g) ?? []).length % 2 === 0);
  if (opts.some((o) => !o.text || o.text.split(/\s+/).length > 8 || !balanced(o.text))) return null;
  return opts;
  return null;
}

/** one kit item → a challenge, or null with the reason */
export function challengeOf(it, t) {
  if (it?.verified?.agrees !== true) return { why: "not verified" };
  const pe = String(it.prompt_en ?? ""), ph = String(it.prompt_hi ?? "");
  if (OPEN.test(pe)) return { why: "open prompt" };
  if (PICTURE.test(pe)) return { why: "points at a picture" };
  const keys = [head(it.answer), ...(it.acceptable ?? []).map(String)].map((k) => k.trim()).filter(Boolean);
  const base = { id: it.id, topicId: t.topicId, skillId: it.skillId, difficulty: it.difficulty ?? 2, itemKind: it.kind,
    prompt: { en: pe, hi: ph || pe }, hint: hintOf(it, keys), ...(it.targetsMisconception ? { mis: it.targetsMisconception } : {}),
    verified: { by: "kit blind solver", agrees: true } };
  // numeric: one value, every acceptable numeric form agrees on it
  const nums = keys.map(parseNum).filter(Boolean);
  // a number only in an accepted form, for a yes/no, why or which-one question: not a numeric challenge (it may still be a
  // yes/no or an offered choice below)
  const numericOk = nums.length > 0 && !TALK_Q.test(pe) && (parseNum(head(it.answer)) || !NOT_NUM_Q.test(pe) || ASKS_NUM.test(pe));
  if (numericOk) {
    if (ESTIMATE.test(pe)) return { why: "estimate (a near decoy could be right)" };
    const vals = [...new Set(nums.map((n) => +n.value.toFixed(9)))];
    if (vals.length > 1) return { why: "acceptable values disagree" };
    if ((head(it.answer).match(/\d+(?:[.,/]\d+)*/g) ?? []).length > 1 && !parseNum(head(it.answer))) return { why: "two numbers in the key" };
    const key = parseNum(head(it.answer)) ?? nums[0];
    const keyText = key.kind === "frac" ? fmtFrac(key.n, key.d, key) : key.kind === "mixed" ? `${key.w} ${key.n}/${key.d}` : fmtNum(key.value, key);
    const decoys = numericDecoys(key, vals, it.id);
    if (decoys.length < 3) return { why: "too few decoys" };
    return { ok: { ...base, form: "numeric", options: shuffle([keyText, ...decoys], it.id).map((text, i) => ({ id: `o${i + 1}`, text })), keyText } };
  }
  // yes / no
  const yes = keys.some((k) => TF_YES.test(k)), no = keys.some((k) => TF_NO.test(k));
  if (yes !== no) {
    const options = [{ id: "o1", text: "yes", word: "yes" }, { id: "o2", text: "no", word: "no" }];
    return { ok: { ...base, form: "yesno", options, keyText: yes ? "yes" : "no" } };
  }
  // the prompt offers the choices
  const o = (pe.match(/\?/g) ?? []).length > 1 ? null : offered(pe);
  if (o) {
    const ok = keys.map(norm);
    const hits = o.filter((x) => ok.includes(norm(x.text)) || (x.letter && ok.some((k) => k === x.letter || k === `(${x.letter})`)));
    if (hits.length !== 1) return { why: "offered choices: not exactly one key" };
    if (/in order|arrange/i.test(pe)) return { why: "ordering (v2)" };
    const options = o.map((x, i) => ({ id: `o${i + 1}`, text: x.letter ? `(${x.letter}) ${x.text}` : x.text }));
    return { ok: { ...base, form: "choice", options, keyText: options[o.indexOf(hits[0])].text } };
  }
  if (nums.length) return { why: "number only in an accepted form, question is yes/no, why or which-one" };
  return { why: "open or short answer (tier B)" };
}
function hintOf(it, keys) {
  // the kit's hint rung (hints[1]), or the pump (hints[0]); never a rung that states the key
  const ks = keys.map(norm).filter((k) => k.length >= 1);
  const vals = keys.map(parseNum).filter(Boolean).map((n) => n.value);
  for (const h of [it.hints?.[1], it.hints?.[0]]) {
    if (typeof h !== "string" || !h.trim()) continue;
    const nh = norm(h), toks = nh.split(/[^\p{L}\p{N}\p{M}/.,]+/u).map((x) => x.replace(/[.,]+$/, "")).filter(Boolean);
    if (ks.some((k) => toks.includes(k) || (k.length > 2 && nh.includes(k)))) continue;
    if (/^\s*(yes|no|true|false|haan|nahi|nahin|sahi|galat|correct|wrong|हाँ|नहीं)\b/i.test(h)) continue;   // a yes/no rung opening with the verdict
    if (vals.length && toks.some((x) => { const v = parseNum(x)?.value; return v != null && vals.some((o) => Math.abs(o - v) < 1e-9); })) continue;
    return h.trim();
  }
  return null;
}
function shuffle(a, seed) { const r = rng(`opt:${seed}`), b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export function build() {
  const files = {}, index = { v: 1, note: "built by server/play/tools/build-arena.mjs from verified kit items (tier A); do not edit by hand", minChallenges: MIN_CHALLENGES, topics: {} };
  const why = {};
  for (const f of readdirSync(KITS).filter((x) => /^c\d-[a-z]+\.json$/.test(x)).sort()) {
    const cs = f.slice(0, -5), list = [];
    for (const t of JSON.parse(readFileSync(join(KITS, f), "utf8")).topics ?? []) {
      const got = [];
      for (const it of t.items ?? []) { const r = challengeOf(it, t); if (r.ok) got.push(r.ok); else why[r.why] = (why[r.why] ?? 0) + 1; }
      list.push(...got);
      const skills = {};
      for (const c of got) skills[c.skillId] = (skills[c.skillId] ?? 0) + 1;
      index.topics[t.topicId] = { file: cs, challenges: got.length, eligible: got.length >= MIN_CHALLENGES, skills };
    }
    files[cs] = { v: 1, tier: "A", source: `data/kits/${f}`, challenges: list };
  }
  const T = Object.values(index.topics);
  index.counts = { topics: T.length, eligible: T.filter((t) => t.eligible).length, challenges: T.reduce((a, t) => a + t.challenges, 0), leftOut: why };
  return { files, index };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { files, index } = build();
  const out = { ...Object.fromEntries(Object.entries(files).map(([k, v]) => [`${k}.json`, JSON.stringify(v, null, 1) + "\n"])), "index.json": JSON.stringify(index, null, 1) + "\n" };
  if (process.argv.includes("--check")) {
    const stale = Object.entries(out).filter(([f, text]) => { try { return readFileSync(join(OUT, f), "utf8") !== text; } catch { return true; } }).map(([f]) => f);
    if (stale.length) { console.error(`data/arena is stale (${stale.slice(0, 5).join(", ")}): run node server/play/tools/build-arena.mjs`); process.exit(1); }
    console.log("arena ok", JSON.stringify(index.counts));
  } else {
    if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
    for (const [f, text] of Object.entries(out)) writeFileSync(join(OUT, f), text);
    console.log("wrote data/arena", JSON.stringify(index.counts));
  }
}
