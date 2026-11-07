import fs from "node:fs";
const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const load = async (R) => ({ K: await import(R + "/server/content/kits.js"), CU: await import(R + "/server/content/curriculum.js"), CL: await import(R + "/server/director/classify.js"), C: await import(R + "/server/grading/corroborate.js") });
const M = { base: await load(SP + "/pb"), ac: await load(SP + "/pa") };
console.info = () => {};
const credit = (X, id, text) => {
  const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; const K = X.K.kitFromFile(X.CU.getTopic(tp)); const item = K?.items.find((i) => i.id === id); if (!item) return null;
  const target = X.CL.targetFor({ phase: "practice" }, K, item);
  const f = X.CL.classifyFast({ target, childText: text, typed: true }); if (f.result) return f.result.outcome === "correct" ? "fast" : null;
  const r = X.C.corroborate({ target, text, result: { outcome: "correct", confidence: 0.9, source: "model", flags: {} } }); return r.outcome === "correct" ? r.corroboration : r.corroboration;
};
const rows = [];
for (const f of fs.readdirSync(SP + "/sl144")) { const r = JSON.parse(fs.readFileSync(SP + "/sl144/" + f, "utf8")); const T = r.turns ?? [];
  for (let i = 1; i < T.length; i++) { const id = T[i - 1].ui?.ask?.itemId; const t = T[i]; if (!id || id.startsWith("fade:") || id.startsWith("diag:")) continue;
    if (t.reasons?.classification?.outcome !== "no_evidence") continue; const s = t.child?.sent; if (!s) continue; rows.push({ f: f.slice(26, 60), n: t.n, id, s }); } }
let movedTo = 0;
for (const r of rows) { const a = credit(M.base, r.id, r.s), b = credit(M.ac, r.id, r.s); const ca = a === "supported" || a === "fast" || String(a).startsWith("supported"), cb = b === "supported" || b === "fast" || String(b).startsWith("supported");
  if (cb && !ca) movedTo++; console.log(`${cb && !ca ? "RESCUE" : ca && !cb ? "LOST  " : "same  "} ${r.f.padEnd(34)} t${r.n} ${r.id.slice(-8)} base:${a} ac:${b} | ${r.s.slice(0, 70)}`); }
console.log(rows.length, "no_evidence item turns in the 4 records;", movedTo, "would be credited if the model said correct");
