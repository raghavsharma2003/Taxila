const R = process.argv[2];
const { kitFromFile } = await import(R + "/server/content/kits.js");
const { getTopic } = await import(R + "/server/content/curriculum.js");
const { targetFor } = await import(R + "/server/director/classify.js");
const C = await import(R + "/server/grading/corroborate.js");
const cases = [["c3-evs-ch07-t02-i07", "nahi, barf pighalti hai, cheeni ghulti hai nahi hota"], ["c6-science-ch06-t01-i03", "nahi, namak aur cheeni nahi hota"],
  ["c8-science-ch06-t02-i12", "nahi, hawa se ped hilte hain nahi hota"], ["c7-science-ch02-t02-i02", "namak aur paani achha hai, aane do"],
  ["c9-sst-ch11-t01-i02", "one correct feature of each"]];
for (const [id, text] of cases) {
  const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0]; const K = kitFromFile(getTopic(tp)); const item = K.items.find((i) => i.id === id);
  const target = targetFor({ phase: "practice" }, K, item);
  const r = C.corroborate({ target, text, result: { outcome: "correct", confidence: 0.9, source: "model", flags: {} } });
  console.log(id, "→", r.outcome, r.corroboration, "\n  Q:", item.prompt_en.slice(0, 100), "\n  forms:", JSON.stringify(C.completeForms(target)).slice(0, 300));
}
