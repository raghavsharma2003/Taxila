// Forge G2 review queue CLI (S7). A HUMAN decides; this script refuses automation reviewer names for approval
// (server/forge/g2/review.js). Commands:
//   list [pending|approved|rejected|test_published]      the queue with gates, cost, critic flags
//   show <buildId> [--out dir]                            the manifest; downloads bundle, mechanic, frames to --out
//   approve <buildId> --reviewer "<your name>"            publish to forge/g2/b/<sha>/ and deliver to waiting children
//   reject <buildId> --reviewer "<name>" --reason "<why>" 24 h cool-down for that identity
//   test-publish <buildId> --reviewer <name>              publish under forge/g2/test/ only (no catalogue, no child)
import { readFileSync, writeFileSync, mkdirSync } from "fs";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { listQueue, decide, paths } = await import("../server/forge/g2/review.js");
const { getPrivate } = await import("../server/forge/g2/store.js");
const [cmd, id] = process.argv.slice(2);
const flag = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
if (cmd === "list") {
  for (const m of await listQueue(id || "pending")) console.log(`${m.buildId}  ${m.status}  ${m.topicId}  ${m.designId}  gates ${m.gatesPassed}/${m.gatesTotal}  $${m.cost?.total}  critic:${(m.criticFlags || []).map((c) => c.criterion).join(",") || "-"}`);
} else if (cmd === "show") {
  const m = await getPrivate(paths.build(id));
  console.log(JSON.stringify(m, null, 1));
  const out = flag("--out");
  if (out) { mkdirSync(out, { recursive: true }); for (const f of m.files) { const b = await getPrivate(paths.file(id, f), { json: false }); if (b) { mkdirSync(`${out}/${f}`.replace(/\/[^/]+$/, ""), { recursive: true }); writeFileSync(`${out}/${f}`, b); } } console.log(`files in ${out}`); }
} else if (["approve", "reject", "test-publish"].includes(cmd)) {
  const r = await decide(id, { decision: cmd === "reject" ? "reject" : "approve", reviewer: flag("--reviewer"), reason: flag("--reason"), testPublish: cmd === "test-publish" });
  console.log(JSON.stringify({ buildId: r.buildId, status: r.status, published: r.published }, null, 1));
} else { console.error("usage: list|show|approve|reject|test-publish"); process.exit(2); }
