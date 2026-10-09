// Round 3: the held-out battery's prescreen for evals/conversation-r3/run.mjs (round 2's evals/conversation-r2/prep-heldout.mjs
// without the copy step: the r3 runner takes --cases). A held-out line the safety predicate reads as distress is never sent
// (none is meant to be). Then:
//   node evals/conversation-r3/prep-heldout.mjs --out <dir>
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/conversation-r3/run.mjs --cases ../conversation-r2/heldout-cases.mjs --out <dir> --base <url>
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/conversation-r3/judge.mjs --dir <dir>
import fs from "fs";
import { join } from "path";

const argv = process.argv.slice(2);
const OUT = argv[argv.indexOf("--out") + 1];
if (!OUT || argv.indexOf("--out") < 0) { console.error("--out <dir> required"); process.exit(2); }
const { CASES } = await import("../conversation-r2/heldout-cases.mjs");
const { scanSafety } = await import("../../server/director/safety.js");
const rows = CASES.map((c) => ({ id: c.id, intent: c.intent, texts: [...(c.setup ?? []), c.text], distress: [...(c.setup ?? []), c.text].some((t) => scanSafety(t).distress), perTurn: [] }));
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(join(OUT, "prescreen.json"), JSON.stringify({ source: "scanSafety (round 2 held-out, r3 runner)", rows }, null, 1));
console.log(`${CASES.length} held-out cases; ${rows.filter((r) => r.distress).length} withheld by the predicate → ${join(OUT, "prescreen.json")}`);
