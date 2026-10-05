// train-model.mjs — the "small fast model" arm: a character n-gram (1-4, word-boundary marked) naive Bayes, Hindi vs keep,
// trained on DEV word types only (gold.json). Written to server/voice/translit/model-nb.json as pruned log-odds.
// The module uses it only when TAXILA_TRANSLIT_FALLBACK=model, and only for words no lexicon knows.
//   node evals/translit/train-model.mjs
import fs from "node:fs";
import path from "node:path";
import { words } from "./tokens.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, "../..");
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, "data/corpus.json"), "utf8"));
const gold = JSON.parse(fs.readFileSync(path.join(HERE, "data/gold.json"), "utf8")).rows;
const types = new Map();
for (const r of corpus.rows) {
  const g = gold[r.id]; if (!g || g.split !== "dev") continue;
  words(r.text).forEach((x, k) => { const l = g.labels[k]; if (l == null) return; const w = x.w.toLowerCase(); if (/^[A-Z]/.test(x.w) && k > 0) return; const t = types.get(w) ?? [0, 0]; t[l === "=" ? 0 : 1]++; types.set(w, t); });
}
const grams = (w) => { const s = `^${w}$`; const g = []; for (let n = 1; n <= 4; n++) for (let i = 0; i + n <= s.length; i++) g.push(s.slice(i, i + n)); return g; };
const cnt = [new Map(), new Map()]; const tot = [0, 0]; const docs = [0, 0];
for (const [w, [en, hi]] of types) { const y = hi > en ? 1 : 0; docs[y]++; for (const g of grams(w)) { cnt[y].set(g, (cnt[y].get(g) ?? 0) + 1); tot[y]++; } }
const V = new Set([...cnt[0].keys(), ...cnt[1].keys()]).size;
const W = {};
for (const g of new Set([...cnt[0].keys(), ...cnt[1].keys()])) {
  const a = cnt[1].get(g) ?? 0, b = cnt[0].get(g) ?? 0; if (a + b < 2) continue;
  W[g] = +(Math.log((a + 1) / (tot[1] + V)) - Math.log((b + 1) / (tot[0] + V))).toFixed(3);
}
const unk = +(Math.log(1 / (tot[1] + V)) - Math.log(1 / (tot[0] + V))).toFixed(3);
const model = { v: "nb-char14/1", trained: new Date().toISOString().slice(0, 10), types: { keep: docs[0], hindi: docs[1] }, prior: +Math.log(docs[1] / docs[0]).toFixed(3), unk, w: W };
fs.writeFileSync(path.join(ROOT, "server/voice/translit/model-nb.json"), JSON.stringify(model));
console.log("types", docs, "grams kept", Object.keys(W).length, "bytes", JSON.stringify(model).length);
