#!/usr/bin/env node
// Round 5 (stream 4A): the covert comprehension read against blind labels. Each case of set.json (build-set.mjs) is put to
// the REAL classifier (classify.js: the code paths, then the Azure model as on the live turn) on its own item, and the
// read (server/director/read.js) is compared with the label. The label is never shown to anything under test.
//
//   node --env-file=.env.local evals/comprehension-r5/run.mjs [--set evals/comprehension-r5/set.json] [--out <dir>] [--conc 4]
import fs from "node:fs";
import path from "node:path";
import { classify, targetFor } from "../../server/director/classify.js";
import { comprehensionRead } from "../../server/director/read.js";
import { diagnosticItem } from "../../server/director/items.js";
import { kitFromFile } from "../../server/content/kits.js";
import { getTopic } from "../../server/content/curriculum.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const SET = JSON.parse(fs.readFileSync(arg("set", path.join(ROOT, "evals/comprehension-r5/set.json")), "utf8"));
const OUT = arg("out", path.join(ROOT, "evals/comprehension-r5/results", new Date().toISOString().replace(/[:.]/g, "-")));
const CONC = Number(arg("conc", 4));

const kits = new Map();
const kitOf = (id) => { if (!kits.has(id)) kits.set(id, kitFromFile(getTopic(id))); return kits.get(id); };

async function one(c) {
  const kit = kitOf(c.topicId);
  const item = c.diagnostic ? diagnosticItem(kit, kit.misconceptions.find((m) => m.id === c.diagnostic.misconceptionId), 7) : kit.items.find((i) => i.id === c.itemId);
  if (!item) return { ...c, error: "item not found" };
  const target = targetFor({ phase: "practice", hintLevel: 0 }, kit, { ...item, misconceptions: item.misconceptions ?? kit.misconceptions });
  const t0 = Date.now();
  let cls;
  try {
    cls = await classify({ target, childText: c.childText, heard: item.prompt_hi ?? item.prompt_en, lang: "hinglish", asrConfidence: 0.92, typed: false, classLevel: c.class, trace: [] });
  } catch (e) { return { ...c, error: String(e?.message ?? e).slice(0, 200) }; }
  const r = comprehensionRead(cls, { childText: c.childText, target });
  const ok = r.read === c.label;
  // before round 5: no read existed; the nearest thing was the classifier's outcome alone (a bluff or silence was simply
  // "no evidence", a correct answer for a wrong reason was "understood")
  const naive = cls?.outcome === "correct" ? "understood" : cls?.outcome === "partial" ? "partly" : "not";
  const misOk = c.misconceptionId ? r.misconceptionId === c.misconceptionId : null;
  return { ...c, read: r.read, basis: r.basis, misconceptionGot: r.misconceptionId ?? null, outcome: cls?.outcome, source: cls?.source ?? null, ok, naiveOk: naive === c.label, misOk, ms: Date.now() - t0 };
}

const rows = [];
const queue = [...SET.cases];
await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length) { const c = queue.shift(); rows.push(await one(c)); } }));
rows.sort((a, b) => a.class - b.class || a.type.localeCompare(b.type));

const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : "-");
const agg = (key) => {
  const m = new Map();
  for (const r of rows.filter((x) => !x.error)) { const k = r[key]; const v = m.get(k) ?? { n: 0, ok: 0 }; v.n++; v.ok += r.ok ? 1 : 0; m.set(k, v); }
  return [...m.entries()].map(([k, v]) => ({ [key]: k, n: v.n, agree: v.ok, pct: pct(v.ok, v.n) }));
};
const done = rows.filter((x) => !x.error);
const mis = done.filter((x) => x.misOk !== null);
const confusion = {};
for (const r of done) { const k = `${r.label}→${r.read}`; confusion[k] = (confusion[k] ?? 0) + 1; }
const summary = {
  n: rows.length, errors: rows.filter((x) => x.error).length, agree: done.filter((x) => x.ok).length, pct: pct(done.filter((x) => x.ok).length, done.length),
  outcomeOnlyBefore: pct(done.filter((x) => x.naiveOk).length, done.length),
  modelDecided: `${done.filter((x) => x.source === "model" && x.ok).length}/${done.filter((x) => x.source === "model").length}`,
  misconceptionNamed: `${mis.filter((x) => x.misOk).length}/${mis.length}`, byClass: agg("class"), byType: agg("type"), confusion,
  ms: { p50: done.map((x) => x.ms).sort((a, b) => a - b)[Math.floor(done.length / 2)] },
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "rows.json"), JSON.stringify(rows, null, 1));
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
console.log("misses:");
for (const r of done.filter((x) => !x.ok)) console.log(`  c${r.class} ${r.type.padEnd(13)} label=${r.label} read=${r.read} (${r.basis}; ${r.outcome}/${r.source}) ${JSON.stringify(r.childText).slice(0, 60)}`);
