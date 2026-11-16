import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classify, classifyFast } from "/home/user/Taxila/server/director/classify.js";
console.info = () => {};
const cases = [
  ["c7-maths-ch01-t02", "c7-maths-ch01-t02-i04", "7 lakh rahega... kyunki 49,999 aadhe lakh se kam hai na, isliye upar nahi gaya"],
  ["c7-maths-ch01-t02", "c7-maths-ch01-t02-i07", "nahi... wo seedha ek step mein karna chahiye na. das-hazaar wala 4 hai, 5 se kam, toh 3 lakh"],
  ["c7-maths-ch01-t02", "c7-maths-ch01-t02-i01", "6 lakh, kyunki 62 hazaar aadhe lakh se zyada hai"],
];
for (const [tp, id, text] of cases) {
  const kit = kitFromFile(getTopic(tp)); const item = kit.items.find((x) => x.id === id);
  const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: id }, kit, item);
  const fast = classifyFast({ target, childText: text, typed: true });
  const r = await classify({ target, childText: text, asrConfidence: 1, typed: true, lang: "hinglish", kit });
  console.log(id, "| key:", item.answer.slice(0, 60), "| fast:", fast.result?.outcome ?? "(to model)", "| full:", r.outcome, r.source, r.corroboration ?? "");
}
