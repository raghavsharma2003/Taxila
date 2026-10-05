// Verify B slot sweep (2026-10-05): for every fuzzy shape, its plainest spelling with ONE required slot replaced by a real
// vocabulary word (ES-1 lesson turns, real child transcripts, the teaching kits, the Verify B corpus) that is NOT a spelling of
// that slot. A firing means a single real word fills the slot: the list is for a human to turn into lesson sentences and
// judge. Not a score. node evals/safety-robust/verify-b-sweep.mjs [--min 2]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { __internals, fuzzyScan } from "../../server/safety/fuzzy.js";
import { foldText, tokensOf } from "../../server/safety/normalize.js";
import * as C from "./corpora.mjs";
import { VERIFY_B } from "./verify-b.data.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mi = process.argv.indexOf("--min"); const min = mi < 0 ? 2 : Number(process.argv[mi + 1]);
const count = new Map();
const add = (s) => { for (const t of tokensOf(foldText(String(s), { runs: false }))) if (t.script === "latin" || t.script === "deva") count.set(t.raw, (count.get(t.raw) ?? 0) + 1); };
for (const it of C.es1Turns()) add(it.text);
for (const it of C.transcriptChildTurns()) add(it.text);
for (const it of VERIFY_B) add(it.text);
function* strings(x) { if (typeof x === "string") yield x; else if (Array.isArray(x)) for (const v of x) yield* strings(v); else if (x && typeof x === "object") for (const v of Object.values(x)) yield* strings(v); }
for (const f of fs.readdirSync(path.join(ROOT, "data/kits")).filter((x) => x.endsWith(".json"))) for (const s of strings(JSON.parse(fs.readFileSync(path.join(ROOT, "data/kits", f), "utf8")))) add(s);
const vocab = [...count].filter(([, n]) => n >= min).map(([w]) => w);
const { SHAPES } = __internals;
const plain = (g, deva) => { const ws = [...g.folded]; return (deva ? ws.find((w) => /[ऀ-ॿ]/u.test(w)) : ws.find((w) => !/[ऀ-ॿ]/u.test(w))) ?? ws[0]; };
const out = [];
for (const sh of SHAPES) {
  for (const deva of [false, true]) {
    const base = sh.steps.filter((s) => s.g && !s.opt).map((s) => plain(s.g, deva));
    if (base.some((w) => !w)) continue;
    const req = sh.steps.filter((s) => s.g && !s.opt);
    for (let k = 0; k < req.length; k++) {
      for (const w of vocab) {
        if (req[k].g.folded.has(w)) continue;
        const words = base.slice(); words[k] = w;
        const r = fuzzyScan(words.join(" "));
        if (r.distress && r.shape === sh.id) out.push({ shape: sh.id, slot: req[k].g.name, word: w, n: count.get(w), text: words.join(" ") });
      }
    }
  }
}
const seen = new Set();
for (const o of out.sort((a, b) => b.n - a.n)) { const k = `${o.shape}|${o.word}`; if (seen.has(k)) continue; seen.add(k); console.log(`${o.shape}\t${o.slot}\t${o.word}\t${o.n}\t${o.text}`); }
