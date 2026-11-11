import fs from "node:fs";
const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const load = async (R) => ({ K: await import(R + "/server/content/kits.js"), CU: await import(R + "/server/content/curriculum.js"), CL: await import(R + "/server/director/classify.js"), C: await import(R + "/server/grading/corroborate.js") });
const A = await load(SP + "/pb"), B = await load(SP + "/pa");
console.info = () => {};
const kits = {};
const credit = (M, id, text) => {
  const tp = id.replace(/^diag:/, "").match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; if (!tp) return null;
  const K = (kits[tp + (M === A ? "a" : "b")] ??= M.K.kitFromFile(M.CU.getTopic(tp))); const item = K?.items.find((i) => i.id === id); if (!item) return null;
  const target = M.CL.targetFor({ phase: "practice", hintLevel: 0, activeItemId: id }, K, item);
  const fast = M.CL.classifyFast({ target, childText: text, typed: true });
  if (fast.result) return fast.result.outcome === "correct";
  return M.C.corroborate({ target, text, result: { outcome: "correct", confidence: 0.9, source: "model", flags: {} } }).outcome === "correct";
};
const sets = {
  test: JSON.parse(fs.readFileSync(SP + "/testlines.json")).map((r) => ({ id: r.item_id, text: r.text, right: r.outcome === "correct" })),
  headeval: Object.values(JSON.parse(fs.readFileSync(SP + "/headeval.json"))).filter((r) => r.outcome === "right" || r.outcome === "wrong").map((r) => ({ id: r.item, text: r.text, right: r.outcome === "right" })),
  lost148: [...JSON.parse(fs.readFileSync(SP + "/after-agent_gpt6.json")), ...JSON.parse(fs.readFileSync(SP + "/after-director.json"))].map((r) => ({ id: r.id, text: r.text, right: true })),
};
for (const [name, rows] of Object.entries(sets)) {
  const c = { n: 0, right: 0, wrong: 0, rescued: 0, lostCredit: 0, newFalse: 0, droppedFalse: 0 }; const ex = [];
  for (const r of rows) { const a = credit(A, r.id, r.text), b = credit(B, r.id, r.text); if (a == null || b == null) continue; c.n++; r.right ? c.right++ : c.wrong++;
    if (r.right && b && !a) { c.rescued++; ex.push("RESCUE " + r.text.slice(0, 90)); } if (r.right && a && !b) { c.lostCredit++; ex.push("LOST   " + r.text.slice(0, 90)); }
    if (!r.right && b && !a) { c.newFalse++; ex.push("FALSE  " + r.text.slice(0, 90)); } if (!r.right && a && !b) c.droppedFalse++; }
  console.log(name, JSON.stringify(c)); for (const e of ex.slice(0, 12)) console.log("   ", e);
}
