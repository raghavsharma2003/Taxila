// round3 truth: the human pass list for the kit answer-part data (data/kits-parts.json, shipped 2026-10-09 from the
// agreed two-rater labels only). Deterministic, no network. It never writes data/.
//
// What a human must decide, by priority (each row names what the product does TODAY, so the cost of every open row is
// visible):
//   P1  acceptable entry, raters disagree but BOTH say not complete (partial vs wrong): the product credits it COMPLETE
//   P2  acceptable entry, one rater partial / one complete: the product credits it complete
//   P3  acceptable entry, one rater wrong / one complete: the product credits it complete
//   P4  the item's parts are disputed (multi- vs single-part) and it has no row: the product grades it single-part
//   P5  an AGREED label that looks wrong by a code check (the brief's example: c8-maths-ch01-t01-i07 "49, 1 left out" is
//       labelled partial though it carries both parts):
//         partial-covers-every-part   the entry carries a number of EVERY part
//         parts-are-one-value         every part is the same number (one answer said twice: "40" and "₹40")
//         complete-misses-a-number    some part states a number the entry does not carry (and none of its words)
//   P6  agreed WRONG: the kit lists the entry as acceptable, both raters call it wrong; the product no longer credits it
//
// usage: node evals/grading-truth/round3/human-pass.mjs [--out docs/design/round3/truth/data]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
const HERE = new URL(".", import.meta.url).pathname, MAIN = resolve(HERE, "../../..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const OUT = resolve(MAIN, arg("--out", "docs/design/round3/truth/data"));
const LABELS = JSON.parse(readFileSync(join(MAIN, "evals/grading-truth/data/parts-labels-c1-9.json"), "utf8"));
const SHIPPED = JSON.parse(readFileSync(join(MAIN, "data/kits-parts.json"), "utf8")).items ?? {};
const [RA, RB] = LABELS.meta?.raters ?? ["gpt-5.6-terra", "DeepSeek-V4-Pro"];
const ITEMS = {};
for (const f of readdirSync(join(MAIN, "data/kits")).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
  const j = JSON.parse(readFileSync(join(MAIN, "data/kits", f), "utf8"));
  for (const t of j.topics ?? []) for (const it of t.items ?? []) ITEMS[it.id] = { ...it, cls: j.class, subject: j.subject };
}
const STOP = new Set("the and for with that this from into each then than they them their there what which when where your have has are was were will can not but one two all any more less some only also because so is it of to in on at by a an as or be do does did yes no its you we our nahi hai hain ka ki ke ko se mein par aur ya bhi toh hi kya kyun kyunki ek yeh ye woh wo".split(" "));
const tokens = (s) => {
  const t = String(s ?? "").toLowerCase().normalize("NFC");
  const nums = (t.replace(/(?<=\d),(?=\d)/g, "").match(/\d+(?:[./]\d+)?/g) ?? []);
  const words = (t.match(/[\p{L}\p{M}]{4,}/gu) ?? []).filter((w) => !STOP.has(w)).map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));
  return new Set([...nums, ...words]);
};
const covers = (entry, part) => { const e = tokens(entry), p = tokens(part); return p.size > 0 && [...p].some((x) => e.has(x)); };
const numVals = (s) => (String(s).replace(/(?<=\d),(?=\d)/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const prompt = (id) => String(ITEMS[id]?.prompt_en ?? "");
const questionShape = (id) => {
  const p = prompt(id);
  const q = (p.match(/\?/g) ?? []).length;
  const asks = /\b(and|aur|then|also)\b[^.?]*\?|\b(?:why|explain|kyun|how do you know|give a reason|and say)\b/i.test(p);
  return `${q} question mark(s)${asks ? "; asks a second thing (and/why/explain)" : ""}`;
};
const rows = [];
const base = (id) => ({ itemId: id, cls: ITEMS[id]?.cls ?? Number(id.match(/^c(\d)/)?.[1]), subject: ITEMS[id]?.subject ?? id.split("-")[1], kind: ITEMS[id]?.kind ?? "", prompt: prompt(id).slice(0, 220), key: String(ITEMS[id]?.answer ?? "").slice(0, 160) });

for (const d of LABELS.disagree ?? []) {
  if (d.entry != null) {
    const a = d[RA], b = d[RB], pair = [a, b].sort().join("/");
    const P = pair === "partial/wrong" ? "P1" : pair === "complete/partial" ? "P2" : pair === "complete/wrong" ? "P3" : "P2";
    const shipped = SHIPPED[d.id]?.acceptable?.[d.entry];
    rows.push({ priority: P, reason: `acceptable entry disputed (${pair})`, ...base(d.id), entry: d.entry, raterA: a, raterB: b,
      productToday: shipped ? `${shipped} (row)` : "complete (credited: no label, the kit's claim)", detail: SHIPPED[d.id]?.parts ? `item parts: ${SHIPPED[d.id].parts.join(" | ")}` : "" });
  } else if (!SHIPPED[d.id]) {
    rows.push({ priority: "P4", reason: `parts disputed (${d.why ?? "multi vs single"}), no row`, ...base(d.id), entry: "", raterA: JSON.stringify(d.raters?.[RA] ?? []), raterB: JSON.stringify(d.raters?.[RB] ?? []),
      productToday: "single-part: every acceptable entry complete", detail: questionShape(d.id) });
  }
}
for (const [id, r] of Object.entries(SHIPPED)) {
  const parts = Array.isArray(r.parts) ? r.parts : [];
  for (const [entry, lab] of Object.entries(r.acceptable ?? {})) {
    if (lab === "wrong") rows.push({ priority: "P6", reason: "agreed wrong: the kit lists it as acceptable", ...base(id), entry, raterA: "wrong", raterB: "wrong", productToday: "not credited (row: wrong)", detail: parts.length ? `parts: ${parts.join(" | ")}` : "" });
    if (parts.length < 2) continue;
    if (lab === "partial") {
      // number tokens only: a word shared with every part ("metals", "resources") was measured to flag mostly correct
      // partials (a 20-row read of the word version: 2 of 20 looked mislabelled); a number the entry carries for EVERY part is
      // the brief's case ("49, 1 left out" for "biggest square, and how many left out?")
      const en = new Set(numVals(entry));
      const all = parts.every((p) => numVals(p).length > 0 && numVals(p).some((v) => en.has(v)));
      const vals = parts.map(numVals), oneValue = vals.every((v) => v.length === 1) && new Set(vals.map((v) => v[0])).size === 1;
      if (all) rows.push({ priority: "P5", reason: "agreed partial, but the entry carries a number of every part", ...base(id), entry, raterA: "partial", raterB: "partial", productToday: "partial (row)", detail: `parts: ${parts.join(" | ")}` });
      else if (oneValue && numVals(entry).includes(vals[0][0])) rows.push({ priority: "P5", reason: "agreed partial, but every part is the same value", ...base(id), entry, raterA: "partial", raterB: "partial", productToday: "partial (row)", detail: `parts: ${parts.join(" | ")}` });
    } else if (lab === "complete") {
      // numbers are script-independent (a Hindi or Hinglish entry shares no WORD with an English part, but its digits match),
      // so the check is: some part states a number the entry does not carry, and the entry carries none of that part's words
      const e = new Set(numVals(entry));
      const missing = parts.filter((p) => numVals(p).length > 0 && numVals(p).every((v) => !e.has(v)) && !covers(entry, p));
      if (missing.length) rows.push({ priority: "P5", reason: "agreed complete, but the entry carries none of a part's numbers", ...base(id), entry, raterA: "complete", raterB: "complete", productToday: "complete (row)", detail: `missing: ${missing.join(" | ")}` });
    }
  }
}
const ORDER = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6 };
rows.sort((x, y) => ORDER[x.priority] - ORDER[y.priority] || x.cls - y.cls || x.subject.localeCompare(y.subject) || x.itemId.localeCompare(y.itemId) || String(x.entry).localeCompare(String(y.entry)));
const COLS = ["priority", "reason", "itemId", "cls", "subject", "kind", "prompt", "key", "entry", "raterA", "raterB", "productToday", "detail"];
const csvCell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "human-pass.csv"), [COLS.join(","), ...rows.map((r) => COLS.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n");
const count = (f) => rows.filter(f).length;
const summary = {
  built: new Date().toISOString(), from: ["evals/grading-truth/data/parts-labels-c1-9.json", "data/kits-parts.json", "data/kits/*.json"], raters: [RA, RB],
  disagreements: { total: (LABELS.disagree ?? []).length, entryLabels: (LABELS.disagree ?? []).filter((d) => d.entry != null).length, partsCounts: (LABELS.disagree ?? []).filter((d) => d.entry == null).length,
    items: new Set((LABELS.disagree ?? []).map((d) => d.id)).size, itemsWithNoRow: new Set((LABELS.disagree ?? []).map((d) => d.id).filter((id) => !SHIPPED[id])).size },
  rows: rows.length,
  byPriority: Object.fromEntries(Object.keys(ORDER).map((p) => [p, count((r) => r.priority === p)])),
  byReasonP5: Object.fromEntries([...new Set(rows.filter((r) => r.priority === "P5").map((r) => r.reason))].map((x) => [x, count((r) => r.reason === x)])),
  creditedCompleteTodayWhileDisputed: count((r) => ["P1", "P2", "P3"].includes(r.priority) && /credited/.test(r.productToday)),
  example: rows.filter((r) => r.itemId === "c8-maths-ch01-t01-i07").map((r) => `${r.priority} "${r.entry}": ${r.reason}`),
};
writeFileSync(join(OUT, "human-pass.summary.json"), JSON.stringify(summary, null, 1) + "\n");
console.log(JSON.stringify(summary, null, 1));
