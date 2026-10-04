#!/usr/bin/env node
// The Studio library review CLI (LIVE-STUDIO §3.11, §8 "Human review"; BUILD-PLAN W2-H #2; from G2 review.js). A build
// is promoted for unlimited cross-child reuse ONLY after a person reviews it: 100% of the first 50 promotions per
// archetype, then 10% (the reviewer rubric below). This file never promotes anything by itself.
//
//   node scripts/studio-review.mjs list [--n 20]                 unreviewed reusable builds (most passes first)
//   node scripts/studio-review.mjs show <sha> [--out dir]        the record, the check list and the fragment on disk
//                                                                (open <out>/<sha>.preview.html in a browser: the build in
//                                                                the frame runtime with its golden params, no network)
//   node scripts/studio-review.mjs promote <sha> --reviewer <name>    needs ≥ 3 distinct param passes, no incident, ≤ 3 variants
//   node scripts/studio-review.mjs retire <sha> [--reason review_reject|kit_change|manual]
//   node scripts/studio-review.mjs seed --topic <topicId> --archetype <id> --from <fragment.html> [--lang hinglish]
//                                                                the offline pre-warm lane: this kit's params, a strings
//                                                                table from the planner (Q8), the FULL gate on a local
//                                                                Chromium (STUDIO_QA_LOCAL=1); stored only if it passes
//
// Promotion is NAME-ASSERTED (as G2's review.js): an interactive terminal and the sha prefix typed back are required;
// names that look like automation are refused (decision forge-g2-review-name-asserted).
// Env: DATABASE_URL (or set -a; . ./.env.local). Prints no key, no child data (the library is child-free).
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

const argv = process.argv.slice(2);
const cmd = argv[0];
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i > 0 ? argv[i + 1] : d; };
const AUTOMATION = /\b(claude|agent|bot|automat(ion|ed)|auto|ci|workflow|script|codex|gpt|model|llm|ai)\b/i;

export const REVIEW_RUBRIC = [
  "the skill is the action: without the skill the child cannot finish",
  "nothing marks the right answer before the child acts (colour, glow, size, position, order)",
  "every word is right for a 9-15 year old in the child's language; nothing babyish, nothing unsafe",
  "the picture is TRUE: equal parts are equal, flows go the right way, labels sit on what they name, numbers match",
  "it reads clearly at 360 px; nothing important is tiny or cut off",
  "would a good teacher use this? is anything wrong, even subtly?",
];

async function main() {
  const lib = await import("../server/studio/library.js");
  if (cmd === "list") {
    const rows = await lib.reviewQueue(Number(arg("n", 20)));
    for (const r of rows) console.log(`${r.build_sha.slice(0, 12)}  ${r.archetype.padEnd(18)} ${r.status.padEnd(16)} passes=${r.distinct_passes} mounts=${r.mounts} incidents=${r.incidents}`);
    if (!rows.length) console.log("(nothing waiting for review)");
    return;
  }
  if (cmd === "show") {
    const sha = await fullSha(argv[1]);
    const { q } = await import("../server/db.js");
    const [b] = await q("select build_sha, identity, archetype, kind, fragment, plan, record, status, distinct_passes, mounts, incidents, created_at from studio_build where build_sha = $1", [sha]);
    if (!b) throw new Error("no such build");
    const out = arg("out", path.join(process.cwd(), "evals/live-studio/review"));
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, `${sha}.fragment.html`), b.fragment);
    const { frameRuntimeSource } = await import("../src/studio/kit/runtime.ts");
    const G = JSON.parse(fs.readFileSync(new URL("../evals/live-studio/goldens/goldens.json", import.meta.url), "utf8"))[b.archetype] ?? { params: {}, strings: {} };
    const { buildParams, archetype } = await import("../server/studio/archetypes/index.js");
    const a = archetype(b.archetype);
    const rt = frameRuntimeSource({ params: buildParams(a, G.params), strings: G.strings ?? {} }).replace("window.addEventListener(\"message\", onInit);",
      "port = { postMessage: function (m) { console.log('[studio]', JSON.stringify(m)); if (m.type === 'answer') setTimeout(function () { deliver(confirm('Grade this answer as correct? ' + JSON.stringify(m.value))); }, 0); } };");
    fs.writeFileSync(path.join(out, `${sha}.preview.html`), `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:"><style>body{margin:0;width:${a.stage.w}px;height:${a.stage.h}px;overflow:hidden;outline:1px dashed #999}</style><script>${rt}</script>${b.fragment}`);
    console.log(JSON.stringify({ sha, archetype: b.archetype, kind: b.kind, status: b.status, passes: b.distinct_passes, mounts: b.mounts, incidents: b.incidents,
      builder: b.record?.builder ?? null, failing: (b.record?.gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id), created: b.created_at }, null, 2));
    console.log(`\nfragment: ${path.join(out, `${sha}.fragment.html`)}\npreview:  ${path.join(out, `${sha}.preview.html`)}\n\nReview against:\n${REVIEW_RUBRIC.map((r) => `  - ${r}`).join("\n")}`);
    return;
  }
  if (cmd === "promote") {
    const sha = await fullSha(argv[1]);
    const reviewer = String(arg("reviewer", "")).trim();
    if (!reviewer || AUTOMATION.test(reviewer)) throw new Error("a person's name is required (--reviewer); automation names are refused");
    if (!process.stdin.isTTY) throw new Error("promotion needs an interactive terminal");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(REVIEW_RUBRIC.map((r) => `  - ${r}`).join("\n"));
    const typed = (await rl.question(`Type the first 8 characters of ${sha.slice(0, 4)}… to confirm you reviewed it: `)).trim();
    rl.close();
    if (typed !== sha.slice(0, 8)) throw new Error("sha prefix did not match; nothing promoted");
    console.log(JSON.stringify(await lib.promote(sha, reviewer)));
    return;
  }
  if (cmd === "retire") {
    const sha = await fullSha(argv[1]);
    console.log(JSON.stringify({ retired: await lib.retire(sha, arg("reason", "manual")) }));
    return;
  }
  if (cmd === "seed") return seed(lib);
  console.log("usage: studio-review.mjs list | show <sha> | promote <sha> --reviewer <name> | retire <sha> | seed --topic <id> --archetype <id> --from <file>");
}

async function fullSha(prefix) {
  if (!/^[0-9a-f]{6,64}$/.test(String(prefix ?? ""))) throw new Error("give a build sha (or a ≥ 6-char prefix)");
  const { q } = await import("../server/db.js");
  const rows = await q("select build_sha from studio_build where build_sha like $1 limit 2", [`${prefix}%`]);
  if (rows.length !== 1) throw new Error(rows.length ? "ambiguous sha prefix" : "no such build");
  return rows[0].build_sha;
}

/** The offline pre-warm lane for one (topic, archetype): full gate locally, stored only if every hard check passes. */
async function seed(lib) {
  process.env.STUDIO_QA_LOCAL = process.env.STUDIO_QA_LOCAL ?? "1";
  const topicId = arg("topic"), archetypeId = arg("archetype"), from = arg("from"), lang = arg("lang", "hinglish");
  if (!topicId || !archetypeId || !from) throw new Error("seed needs --topic, --archetype and --from");
  const fragment = fs.readFileSync(from, "utf8");
  const { getKit } = await import("../server/content/index.js");
  const kit = await getKit(topicId, { generate: false });
  if (!kit) throw new Error(`no kit for ${topicId}`);
  const { archetype } = await import("../server/studio/archetypes/index.js");
  const { chooseArchetype, planBuild, q8Strings } = await import("../server/studio/plan.js");
  const a = archetype(archetypeId);
  const classLevel = Number(String(topicId).match(/^c(\d)/)?.[1] ?? 5);
  const band = { 1: "B1", 2: "B1", 3: "B2", 4: "B2", 5: "B3", 6: "B3", 7: "B3", 8: "B4", 9: "B4" }[classLevel] ?? "B3";
  const intent = { intentId: `seed:${topicId}:${archetypeId}`, lessonId: "seed", kind: a.kind, skillId: kit.skills?.[0]?.id ?? topicId, need: "explain", beat: "explain",
    neededAtMs: 0, priority: "opportunistic", style: { band, lang, motion: "lively" } };
  const pick = chooseArchetype(intent, { kit });
  if (pick.archetype !== archetypeId) throw new Error(`the kit does not prove params for ${archetypeId} (${pick.why ?? pick.archetype})`);
  const planned = await planBuild({ ...intent, truth: { [archetypeId]: pick.params } }, { kit, topicTitle: kit.title });
  if (!planned.ok) throw new Error(`planner: ${planned.why}`);
  const q8 = await q8Strings(planned.plan, { lang });
  if (!q8.ok) throw new Error(`strings failed Q8: ${JSON.stringify(q8.findings).slice(0, 200)}`);
  const { localGate } = await import("../server/studio/qa/pool.js");
  const gate = localGate({ concurrency: 1 });
  const g = await gate.gate({ archetypeId, fragment, params: pick.params, strings: planned.plan.strings, band, lang, fixed: true });
  await gate.close();
  const failing = (g.checks ?? []).filter((c) => !c.pass).map((c) => c.id);
  if (!g.pass) { console.log(JSON.stringify({ stored: false, failing })); process.exitCode = 1; return; }
  const { putBuild } = await import("../server/studio/store.js");
  const identity = lib.identityOf({ kind: a.kind, archetype: archetypeId, skillId: intent.skillId, band, lang, kitHash: lib.kitHashOf(kit) });
  const put = await putBuild({ identity, archetype: archetypeId, kind: a.kind, fragment, plan: planned.plan, record: { builder: { dep: "seed" }, gate: { pass: true, checks: g.checks.map((c) => ({ id: c.id, pass: c.pass })) } } });
  await lib.ensureIdentity(identity, { kind: a.kind, archetype: archetypeId, skillId: intent.skillId, band, lang, kitHash: lib.kitHashOf(kit) });
  const passes = await lib.recordGatePass(put.buildSha, pick.params, planned.plan.strings, "transfer");
  await lib.rememberStrings(identity, pick.params, planned.plan.strings);
  console.log(JSON.stringify({ stored: true, buildSha: put.buildSha, identity, distinctPasses: passes.distinctPasses, gateMs: g.ms }));
}

main().then(() => process.exit(process.exitCode ?? 0), (e) => { console.error(`studio-review: ${e.message}`); process.exit(1); });
