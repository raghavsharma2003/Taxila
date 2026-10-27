const { classifyFast, targetFor, plainNumberKey } = await import("/home/user/Taxila/server/director/classify.js");
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const kit = kitFromFile(getTopic("c5-maths-ch08-t01")); const item = kit.items.find((i) => i.id === "c5-maths-ch08-t01-i03");
const target = targetFor({ phase: "practice", hintLevel: 0 }, kit, item);
for (const t of ["2000 g", "2000 gram", "do hazaar gram"]) { const r = classifyFast({ target, childText: t, asrConfidence: 0.95, heard: item.prompt_hi, lang: "hinglish" }); console.log(t, r.numericMismatch, r.bareWrongNumber); }
console.log(plainNumberKey?.(target.key));
