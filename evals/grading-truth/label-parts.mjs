// Two-rater parts labels for multi-part kit keys (VALUES-100 V1.1 "multi-part keys are graded partial"). The truth of a
// one-part answer to a several-part question cannot be decided by code, so it is decided by two raters from DIFFERENT
// model families, and only where they agree. The battery (run.mjs) reads the agreed labels as truth; disagreements are
// listed for a human pass and never used.
//
// For a sampled kit item whose key is list-shaped, each rater returns, for THIS question:
//   parts       the separate things a complete answer must contain (a reason the question does not ask for is NOT a part)
//   acceptable  each kit `acceptable` entry → complete | partial | wrong
// Agreement: both raters call the question multi-part (>= 2 required parts) or both single-part (exact part counts differ
// often and are not needed: a one-part answer is partial under both whenever both say >= 2), and per acceptable entry the
// same label. Cohen's kappa is reported for both decisions.
//   NODE_USE_ENV_PROXY=1 node evals/grading-truth/label-parts.mjs [--n 400] [--seed 7] [--raters gpt-5.6-terra,DeepSeek-V4-Pro]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { rng } from "./lib/oracle.mjs";

const HERE = new URL(".", import.meta.url).pathname, MAIN = join(HERE, "../..");
for (const line of readFileSync(join(MAIN, ".env.local"), "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1"); }
await import("../../server/net.js");
const { chat, usdOf, normUsage } = await import("../../server/azure.js");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 400)), SEED = Number(arg("--seed", 7));
const RATERS = arg("--raters", "gpt-5.6-terra,DeepSeek-V4-Pro").split(",");
const BATCH = 8, CAP_USD = Number(arg("--cap", 9));

const R = rng(SEED);
const cand = [];
for (const f of readdirSync(join(MAIN, "data/kits")).filter((x) => /^c[4-7]-.*\.json$/.test(x)).sort()) {
  const j = JSON.parse(readFileSync(join(MAIN, "data/kits", f), "utf8"));
  for (const t of j.topics) for (const it of t.items) {
    if (["why", "teachback"].includes(it.kind)) continue;
    const a = String(it.answer);
    if (/^[\s₹rs.]*-?[\d,./ ]+\s*[a-z°]*\.?$/i.test(a)) continue;               // a plain value: not a parts question
    if (!/,|;| and | aur |और|\bboth\b/i.test(a)) continue;                     // list-shaped keys only
    cand.push({ id: it.id, kind: it.kind, cls: j.class, subject: j.subject, prompt: it.prompt_en, answer: a, acceptable: (it.acceptable ?? []).slice(0, 6) });
  }
}
const sample = R.shuffle(cand).slice(0, N);
const SYS = [
  "You check answer keys for a school tutor (Indian classes 4-7). For each item you get the QUESTION as the child hears it, the teacher's KEY, and ACCEPTABLE short answers the kit also credits.",
  "1. parts: the separate things a child's answer must contain to be FULLY correct for THIS question, each as a short phrase taken from the key. A reason, example or working that the question does not ask for is NOT a required part. A question that asks for one thing has exactly one part.",
  "2. acceptable: for each ACCEPTABLE entry, 'complete' if a child saying only that has fully answered the question, 'partial' if it gives some but not all required parts, 'wrong' if it does not answer it.",
  "Judge the question as asked, not the key's length. Output JSON only.",
].join("\n");
const SCHEMA = { type: "object", additionalProperties: false, required: ["items"], properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "parts", "acceptable"],
  properties: { id: { type: "string" }, parts: { type: "array", items: { type: "string" } }, acceptable: { type: "array", items: { type: "object", additionalProperties: false, required: ["entry", "label"],
    properties: { entry: { type: "string" }, label: { type: "string", enum: ["complete", "partial", "wrong"] } } } } } } } } };
let usd = 0;
async function rate(model, batch) {
  if (usd > CAP_USD) throw new Error(`spend cap $${CAP_USD} reached`);
  const user = JSON.stringify(batch.map((b) => ({ id: b.id, QUESTION: b.prompt, KEY: b.answer, ACCEPTABLE: b.acceptable })));
  const out = await chat(model, [{ role: "system", content: SYS }, { role: "user", content: user }], { schema: SCHEMA, schemaName: "parts", maxTokens: 6000, effort: "low", timeoutMs: 120_000, retries: 1, quotaLane: "background" });
  usd += usdOf(model, normUsage(out.usage));
  return out.json.items;
}
const ratings = Object.fromEntries(RATERS.map((m) => [m, {}]));
const batches = []; for (let i = 0; i < sample.length; i += BATCH) batches.push(sample.slice(i, i + BATCH));
let bi = 0;
const worker = async () => { while (bi < batches.length) { const b = batches[bi++]; for (const m of RATERS) { try { for (const r of await rate(m, b)) ratings[m][r.id] = r; } catch (e) { console.warn(m, String(e.message).slice(0, 100)); } } } };
await Promise.all(Array.from({ length: 4 }, worker));

const items = {}, disagree = [], pairsMS = [], pairsAcc = [];
/** Cohen's kappa over label pairs. */
function kappa(pairs) {
  if (!pairs.length) return null;
  const labs = [...new Set(pairs.flat())], n = pairs.length;
  const po = pairs.filter(([x, y]) => x === y).length / n;
  const pe = labs.reduce((s, l) => s + (pairs.filter(([x]) => x === l).length / n) * (pairs.filter(([, y]) => y === l).length / n), 0);
  return pe === 1 ? 1 : +((po - pe) / (1 - pe)).toFixed(3);
}
let multi = 0, single = 0, both = 0, accAgree = 0, accTotal = 0, accPartial = 0;
for (const s of sample) {
  const [a, b] = RATERS.map((m) => ratings[m][s.id]);
  if (!a || !b) continue;
  both++;
  const na = a.parts.length, nb = b.parts.length;
  const rec = { kind: s.kind, cls: s.cls, subject: s.subject, prompt: s.prompt, answer: s.answer, raters: { [RATERS[0]]: a.parts, [RATERS[1]]: b.parts } };
  pairsMS.push([na >= 2 ? "multi" : "single", nb >= 2 ? "multi" : "single"]);
  if ((na >= 2) !== (nb >= 2)) { disagree.push({ id: s.id, ...rec, why: `parts ${na} vs ${nb}` }); }
  else if (na >= 2) { multi++; rec.parts = na <= nb ? a.parts : b.parts; }
  else single++;
  const acc = {};
  for (const e of s.acceptable) {
    const la = a.acceptable.find((x) => x.entry === e)?.label, lb = b.acceptable.find((x) => x.entry === e)?.label;
    if (!la || !lb) continue;
    accTotal++;
    pairsAcc.push([la, lb]);
    if (la === lb) { accAgree++; acc[e] = la; if (la === "partial") accPartial++; } else disagree.push({ id: s.id, entry: e, [RATERS[0]]: la, [RATERS[1]]: lb });
  }
  if (rec.parts || Object.keys(acc).length) items[s.id] = { ...rec, ...(Object.keys(acc).length ? { acceptable: acc } : {}) };
}
const meta = { date: new Date().toISOString(), raters: RATERS, candidates: cand.length, sampled: sample.length, bothRated: both, multiPartAgreed: multi, singleAgreed: single,
  partsDisagree: disagree.filter((d) => d.why).length, kappaMultiSingle: kappa(pairsMS), kappaAcceptable: kappa(pairsAcc),
  raterMultiShare: RATERS.map((m, i) => +(pairsMS.filter((p) => p[i] === "multi").length / Math.max(1, pairsMS.length)).toFixed(3)), acceptableRated: accTotal, acceptableAgreed: accAgree, acceptableAgreedPartial: accPartial, usd: +usd.toFixed(3), seed: SEED };
mkdirSync(join(HERE, "data"), { recursive: true });
writeFileSync(join(HERE, "data/parts-labels.json"), JSON.stringify({ meta, items, disagree }, null, 1));
console.log(JSON.stringify(meta, null, 1));
