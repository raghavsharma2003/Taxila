const { classifyFast, targetFor } = await import("/home/user/Taxila/server/director/classify.js");
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const [topic, itemId, ...texts] = process.argv.slice(2);
const kit = kitFromFile(getTopic(topic));
const item = kit.items.find((i) => i.id === itemId);
console.log(itemId, "| A:", item.answer, "| acc:", JSON.stringify(item.acceptable), "| kind", item.kind);
const target = targetFor({ phase: "practice", hintLevel: 0 }, kit, item);
for (const t of texts) {
  const r = classifyFast({ target, childText: t, typed: false, asrConfidence: 0.95, heard: item.prompt_hi ?? item.prompt_en, lang: "hinglish" });
  console.log(JSON.stringify(t).padEnd(44), r.result ? `${r.result.outcome}/${r.result.source}` : `model (fast null)${r.bareWrongNumber ? " bareWrong" : ""}`);
}
