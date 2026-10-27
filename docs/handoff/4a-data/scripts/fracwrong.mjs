import fs from "fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor, classify } from "/home/user/Taxila/server/director/classify.js";
console.info = () => {};
const HI = ["", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस"];
const items = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((f) => /^c\d-[a-z]+\.json$/.test(f))) { const d = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f));
  for (const t of d.topics ?? []) for (const it of t.items ?? []) { const m = String(it.answer ?? "").trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/); if (m && +m[2] > 0 && HI[+m[1]] && HI[+m[2]]) items.push({ topic: t.topicId, id: it.id, n: +m[1], d: +m[2] }); } }
const forms = (n, d) => [`${HI[n]} बटा ${HI[d + 1]}`, `${HI[n + 1]} बता ${HI[d]}`, `मुझे बता दो`, `${HI[d]} बटा ${HI[n]}`];
const out = {}; let i = 0; const jobs = items.flatMap((it) => forms(it.n, it.d).map((text, k) => ({ it, text, k })));
await Promise.all(Array.from({ length: 8 }, async () => { while (i < jobs.length) { const j = jobs[i++];
  const kit = kitFromFile(getTopic(j.it.topic)); const item = kit?.items.find((x) => x.id === j.it.id); if (!item) continue;
  const r = await classify({ target: targetFor({ phase: "practice", hintLevel: 0, activeItemId: item.id }, kit, item), childText: j.text, asrConfidence: 0.9, typed: false, lang: "hindi", kit }).catch((e) => ({ outcome: "err" }));
  out[`${j.it.id}#${j.k}`] = { form: j.k, outcome: r.outcome, source: r.source, corr: r.corroboration ?? null, text: j.text }; } }));
fs.writeFileSync(process.argv[2], JSON.stringify(out));
const c = {}; for (const v of Object.values(out)) { const k = `form${v.form} ${v.outcome}`; c[k] = (c[k] ?? 0) + 1; }
console.log(items.length, "items,", Object.keys(out).length, "lines"); console.log(c);
