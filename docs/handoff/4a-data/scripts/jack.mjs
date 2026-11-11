import fs from "node:fs"; import path from "node:path";
import { bareAck } from "/home/user/Taxila/server/conversation/lexicon.js";
const by = {};
for (const arm of process.argv.slice(2)) for (const d of fs.readdirSync(arm).filter((x) => x.startsWith("seed-"))) {
  const f = path.join(arm, d, "owner-2.json"); if (!fs.existsSync(f)) continue;
  const j = JSON.parse(fs.readFileSync(f, "utf8")); const seen = new Set();
  for (const x of j.defects.filter((x) => /^J\.(confused|ignores_child)/.test(x.code) && bareAck(x.child))) {
    const k = `${d}|${x.session}#${x.turn}`; if (seen.has(k)) continue; seen.add(k);
    const topic = x.session.match(/c\d-[a-z]+-ch\d+-t\d+/)?.[0]; by[topic] = (by[topic] ?? 0) + 1; }
}
console.log(Object.entries(by).sort((a, b) => b[1] - a[1]));
