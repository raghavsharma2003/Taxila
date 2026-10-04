// Offline perception pass on the PRODUCTION commit's code (default 9242020): every battery utterance goes through the
// prod safety predicate (scanSafety), the lexical stop test (wantsToStop) and the prod classify() on the prod classify
// deployment (grok-4-1-fast-non-reasoning, MODEL-ROUTER §0 "in prod today"), against a real kit question of the case's
// topic. Two uses:
//   1. SAFETY GATE for run.mjs: an utterance the prod path reads as distress is never sent to production, because a
//      distress turn opens a real safeguarding incident and an open incident blocks the test account's deletion
//      (routes/account.js SAFETY_OPEN_SQL). The distress cases are measured HERE instead (their Director move is
//      deterministic once flags.distress is set: state.js decide() step 1 → safeguard).
//   2. A per-intent table of what the prod perception layer actually emits (wants_to_stop / off_topic / outcome), which
//      is the input the Director's policy sees.
//
// Run: NODE_USE_ENV_PROXY=1 node evals/conversation-v2/prescreen.mjs [--sha 9242020] [--out evals/conversation-v2/results/<stamp>]
// Costs: one classify call per utterance (~357 calls on grok-4-1-fast-nr, well under USD 0.50).
import fs from "fs";
import os from "os";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const SHA = arg("sha", "9242020");
const OUT = arg("out", join(HERE, "results", "latest"));
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(join(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
process.env.DEPLOY_CLASSIFY = arg("classify", "grok-4-1-fast-non-reasoning"); // prod's setting (scripts/deploy-azure.mjs)

// The prod tree, extracted once (never imported from the working tree, which carries Wave 2 edits).
const TREE = arg("tree", join(os.tmpdir(), `taxila-prod-${SHA}`));
if (!fs.existsSync(join(TREE, "server", "director", "classify.js"))) {
  fs.mkdirSync(TREE, { recursive: true });
  execSync(`git -C "${ROOT}" archive ${SHA} server shared data package.json | tar -x -C "${TREE}"`);
}
if (!fs.existsSync(join(TREE, "node_modules"))) fs.symlinkSync(join(ROOT, "node_modules"), join(TREE, "node_modules"));

await import(join(TREE, "server", "net.js"));
const { scanSafety, wantsToStop } = await import(join(TREE, "server", "director", "safety.js"));
const { classify, targetFor } = await import(join(TREE, "server", "director", "classify.js"));
const { getKit } = await import(join(TREE, "server", "content", "index.js"));
const { CASES } = await import("./cases.mjs");
const { TOPICS } = await import("./topics.mjs");

/** A plausible fill for templates so the words reach the classifier as a child would say them. */
const fill = (t, item) => String(t).replace(/\{key\}/g, String(item?.answer ?? "3/4").slice(0, 40)).replace(/\{wrong\}/g, "7")
  .replace(/\{partial\}/g, String(item?.answer ?? "").split(/,|;| and /)[0] || "half");

const kits = new Map();
async function itemFor(topicKey) {
  const id = TOPICS[topicKey ?? "T5NL"].id;
  if (!kits.has(id)) kits.set(id, await getKit(id));
  const kit = kits.get(id);
  const item = kit.items.find((i) => i.kind === "practice") ?? kit.items[0];
  return { kit, item };
}

const IDS = arg("ids", null)?.split(",") ?? null;      // re-run only these cases, merged into an existing prescreen.json
const prior = IDS && fs.existsSync(join(OUT, "prescreen.json")) ? JSON.parse(fs.readFileSync(join(OUT, "prescreen.json"), "utf8")).rows : [];
const rows = prior.filter((r) => !IDS?.includes(r.id));
let i = 0;
const CONC = 6;
async function one(c) {
  const { kit, item } = await itemFor(c.topic);
  const texts = [...(c.setup ?? []), c.text].map((t) => fill(t, item));
  const out = { id: c.id, intent: c.intent, offline: !!c.offline, texts, perTurn: [] };
  for (const text of texts) {
    const s = { phase: "practice", hintLevel: 0, pendingWhy: undefined, offered: undefined, teachbackAsked: false };
    const target = targetFor(s, kit, item);
    const pred = scanSafety(text);
    const t0 = Date.now();
    let cls = null, err = null;
    // a classifier timeout from this sandbox (proxy) is not the prod reading: retry up to twice before recording it
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        cls = await classify({ target, childText: text, typed: true, heard: item.prompt_hi || item.prompt_en, classLevel: Number(TOPICS[c.topic ?? "T5NL"].cls), lang: "hinglish" });
        err = null;
      } catch (e) { err = String(e.message).slice(0, 200); }
      if (cls && cls.source !== "error") break;
    }
    out.perTurn.push({ text, predicate: pred.distress ? pred.kind ?? true : false, stopLexical: wantsToStop(text), ms: Date.now() - t0,
      outcome: cls?.outcome ?? null, source: cls?.source ?? null, flags: cls?.flags ?? null, err });
  }
  out.distress = out.perTurn.some((t) => t.predicate || t.flags?.distress);
  out.wantsToStop = out.perTurn.at(-1)?.flags?.wantsToStop ?? false;
  out.offTopic = out.perTurn.at(-1)?.flags?.offTopic ?? false;
  rows.push(out);
}
const queue = CASES.filter((c) => !IDS || IDS.includes(c.id));
await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length) { const c = queue.shift(); await one(c); if (++i % 25 === 0) console.log(`${i}/${CASES.length}`); } }));
rows.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(join(OUT, "prescreen.json"), JSON.stringify({ sha: SHA, classify: process.env.DEPLOY_CLASSIFY, at: new Date().toISOString(), rows }, null, 1));
const unsafe = rows.filter((r) => r.distress && !r.offline);
console.log(`prescreen: ${rows.length} cases; distress on ${rows.filter((r) => r.distress).length} (offline-tagged ${rows.filter((r) => r.offline).length}); NON-offline cases read as distress: ${unsafe.length}`);
for (const r of unsafe) console.log(`  withheld from prod: ${r.id} "${r.texts.at(-1)}"`);
console.log(`wrote ${join(OUT, "prescreen.json")}`);
