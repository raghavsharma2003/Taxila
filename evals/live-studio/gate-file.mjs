// Gate one built fragment against an archetype's golden truth (diagnosis): node evals/live-studio/gate-file.mjs <archetype> <file.html> [params|alt] [--shot path]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { runGate } from "../../server/studio/qa/gate.js";
const [id, file, which = "params"] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && all[i - 1] !== "--shot");
const shotAt = process.argv.indexOf("--shot");
const G = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "goldens/goldens.json"), "utf8"))[id];
const b = await chromium.launch();
const r = await runGate(b, { archetypeId: id, fragment: fs.readFileSync(file, "utf8"), params: G[which], strings: G[`${which}Strings`] ?? G.strings, band: G.band, shot: shotAt > 0 ? process.argv[shotAt + 1] : undefined });
console.log(r.pass ? "PASS" : "FAIL", r.ms, "ms", "fixes", r.fixes.join(","));
for (const c of r.checks) if (!c.pass || process.argv.includes("--all")) console.log(c.pass ? "  ok" : "  XX", c.id, JSON.stringify(c.detail).slice(0, 300));
console.log("log", JSON.stringify(r.log).slice(0, 600));
await b.close();
