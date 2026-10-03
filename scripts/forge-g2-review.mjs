// Forge G2 review queue CLI (S7). A PERSON decides. Approval is name-asserted and unauthenticated (decision
// forge-g2-review-name-asserted): this CLI requires an interactive terminal and the reviewer typing the first 8+ chars of
// the bundle sha it shows, and server/forge/g2/review.js refuses automation-looking names and builds gated on an older
// kit. Commands:
//   ingest                                                move finished builds from their run containers into the queue
//   list [pending|approved|rejected]                      (ingests first) the queue with gates, cost, critic flags
//   show <buildId> [--out dir]                            the manifest; downloads bundle, mechanic, frames to --out
//   approve <buildId> --reviewer "<your name>"            TTY only: publish forge/g2/b/<sha>/ and deliver to waiting children
//   reject <buildId> --reviewer "<name>" --reason "<why>" cool-down 1 d / 3 d / 7 d, then triage
//   test-publish <buildId> --reviewer <name>              publish into container forge-g2-test only (never frameable by the app)
//   scan                                                  re-lint every pending mechanic with the CURRENT lint + kit version
//   drop-test-path <path under the public container>      delete a legacy forge/g2/test/… blob from the public container
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createInterface } from "readline/promises";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { listQueue, decide, paths, ingestAll } = await import("../server/forge/g2/review.js");
const { getPrivate, deletePublic } = await import("../server/forge/g2/store.js");
const { executionStatus } = await import("../server/forge/g2/azure-job.js");
const { lintMechanic } = await import("../server/forge/g2/lint.js");
const { KIT_HASH, KIT_VERSION } = await import("../server/forge/g2/bundle.js");
const [cmd, id] = process.argv.slice(2);
const flag = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const ingestNow = async () => { const r = await ingestAll(undefined, { execInfo: executionStatus }); for (const x of r) if (!["running", "not_open"].includes(x.outcome)) console.log(`ingested ${x.buildId}: ${x.outcome}${x.summary?.problems?.length ? " (" + x.summary.problems.join("; ") + ")" : ""}`); };
if (cmd === "ingest") await ingestNow();
else if (cmd === "list") {
  await ingestNow();
  for (const m of await listQueue(id || "pending")) console.log(`${m.buildId}  ${m.status}  ${m.topicId}  ${m.designId}  kit ${m.kit?.version || "tgk-lite@1"}${m.kit?.hash === KIT_HASH ? "" : " (STALE)"}  gates ${m.gatesPassed}/${m.gatesTotal}  $${m.cost?.total}  critic:${(m.criticFlags || []).map((c) => c.criterion).join(",") || "-"}`);
} else if (cmd === "show") {
  const m = await getPrivate(paths.build(id));
  console.log(JSON.stringify(m, null, 1));
  const out = flag("--out");
  if (out) { mkdirSync(out, { recursive: true }); for (const f of m.files) { const b = await getPrivate(paths.file(id, f), { json: false }); if (b) { mkdirSync(`${out}/${f}`.replace(/\/[^/]+$/, ""), { recursive: true }); writeFileSync(`${out}/${f}`, b); } } console.log(`files in ${out}`); }
} else if (cmd === "scan") {
  for (const m of await listQueue("pending")) {
    const src = (await getPrivate(paths.file(m.buildId, "mechanic.js"), { json: false }))?.toString() || "";
    const design = await getPrivate(paths.file(m.buildId, "design.json"));
    const r = lintMechanic(src, { stringKeys: (design?.strings || []).map((s) => s.key) });
    console.log(`${m.buildId}  kit ${m.kit?.version || "tgk-lite@1"}${m.kit?.hash === KIT_HASH ? "" : " STALE(serving " + KIT_VERSION + ")"}  lint ${r.ok ? "ok" : r.errors.slice(0, 4).map((e) => `${e.code}:${e.detail}`).join(", ")}`);
  }
} else if (cmd === "drop-test-path") {
  if (!/^g2\/test\/b\/[0-9a-f]{64}\/index\.html$/.test(id || "")) { console.error("only g2/test/b/<sha>/index.html paths"); process.exit(2); }
  await deletePublic(id); console.log(`deleted ${id}`);
} else if (["approve", "reject", "test-publish"].includes(cmd)) {
  let attestation;
  if (cmd === "approve") {
    if (!process.stdin.isTTY || !process.stdout.isTTY) { console.error("approve needs an interactive terminal (a person at the keyboard)"); process.exit(2); }
    const m = await getPrivate(paths.build(id));
    if (!m) { console.error(`no build ${id}`); process.exit(2); }
    console.log(`${m.buildId}  ${m.topicId}  ${m.title?.en || m.designId}\nbundle sha ${m.sha}\ncritic flags: ${(m.criticFlags || []).map((c) => c.criterion).join(", ") || "none"}\nchecklist:\n- ${m.checklist.join("\n- ")}`);
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const typed = (await rl.question("Type the first 8 characters of the bundle sha to approve: ")).trim();
    rl.close();
    attestation = { method: "tty-sha-confirm", shaPrefix: typed, at: new Date().toISOString() };
  }
  const r = await decide(id, { decision: cmd === "reject" ? "reject" : "approve", reviewer: flag("--reviewer"), reason: flag("--reason"), testPublish: cmd === "test-publish", attestation });
  console.log(JSON.stringify({ buildId: r.buildId, status: r.status, published: r.published }, null, 1));
} else { console.error("usage: ingest|list|show|scan|approve|reject|test-publish|drop-test-path"); process.exit(2); }
