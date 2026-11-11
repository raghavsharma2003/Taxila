import fs from "node:fs";
const NEW = await import("/home/user/Taxila/server/director/say.js");
const OLD = await import(process.argv[2] + "/server/director/say.js");
const prompts = [];
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8"));
  for (const t of j.topics ?? []) for (const i of t.items ?? []) for (const p of [i.prompt_hi, i.prompt_en]) if (p) prompts.push(p);
}
const stat = (fn) => { let ell = 0, lostQ = 0, over = 0; for (const p of prompts) { const a = fn(p); if (a.endsWith("…")) ell++; if (/[?？]/.test(p) && !/[?？]/.test(a)) lostQ++; if (a.length > 120) over++; } return { ell, lostQ, over }; };
console.log("prompts", prompts.length, "long", prompts.filter((p) => p.replace(/\s+/g, " ").trim().length > 120).length);
console.log("old", stat(OLD.askText)); console.log("new", stat(NEW.askText));
