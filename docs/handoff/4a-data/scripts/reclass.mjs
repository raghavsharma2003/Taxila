import fs from "fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classify } from "/home/user/Taxila/server/director/classify.js";
console.info = () => {};
const D = process.argv[2] + "/records/";
const cases = [];
for (const f of fs.readdirSync(D).filter((f) => f.includes("agent_gpt6"))) { const r = JSON.parse(fs.readFileSync(D + f));
  for (const [i, t] of r.turns.entries()) if (t.decided && ["unverified"].includes(t.reasons?.verdict ?? t.ui?.verdict)) cases.push({ f, n: t.n, item: t.reasons?.item?.id ?? t.decided.itemId, dItem: t.decided.itemId, outcome: t.decided.outcome, text: String(t.child?.say ?? ""), lang: r.persona?.lang }); }
const pick = cases.filter((c) => c.outcome === "right").slice(0, Number(process.argv[3] ?? 60));
const tally = {}; const ex = {};
await Promise.all(pick.map(async (c) => {
  const topic = (c.item.match(/^(c\d-[a-z]+-ch\d+-t\d+)/) ?? [])[1]; const tp = topic && getTopic(topic); const kit = tp ? kitFromFile(tp) : null; const it = kit?.items.find((x) => x.id === c.item);
  if (!it) { tally.noItem = (tally.noItem ?? 0) + 1; return; }
  const r = await classify({ target: targetFor({ phase: "practice", hintLevel: 0, activeItemId: it.id }, kit, it), childText: c.text, asrConfidence: 1, typed: true, lang: "hinglish", kit }).catch((e) => ({ outcome: "err", corroboration: e.message.slice(0, 40) }));
  const k = `${r.outcome} ${r.corroboration ?? ""}`.trim(); tally[k] = (tally[k] ?? 0) + 1;
  (ex[k] ??= []).length < 2 && ex[k].push({ key: it.answer, kind: it.kind, text: c.text.slice(0, 110), sameItem: c.item === c.dItem });
}));
console.log(Object.entries(tally).sort((a, b) => b[1] - a[1])); console.log(JSON.stringify(ex, null, 1));
