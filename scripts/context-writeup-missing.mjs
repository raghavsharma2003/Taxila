// Appends a short write-up for every graph node that has none yet, into the context document for its kind,
// using the node's own title (the inbox entry text). Use after merging inbox files whose authors wrote their
// detail outside context/ (e.g. a BUILD-LOG.md), so `context.mjs --check` stays green.
import fs from "fs";
const g = JSON.parse(fs.readFileSync("context/graph.json", "utf8"));
const FILE = { decision: "context/decisions.md", measurement: "context/measurements.md", rejection: "context/rejected.md" };
const docs = Object.fromEntries(Object.values(FILE).concat("context/architecture.md").map(f => [f, fs.readFileSync(f, "utf8")]));
const all = Object.values(docs).join("\n");
const add = {};
for (const n of g.nodes) {
  if (all.includes(n.id)) continue;
  const f = FILE[n.kind] || "context/architecture.md";
  (add[f] ||= []).push(`- \`${n.id}\` (${n.at || "undated"}): ${n.title}`);
}
for (const [f, lines] of Object.entries(add)) fs.appendFileSync(f, `\n\n## Merged inbox entries (write-up from the entry text)\n${lines.join("\n")}\n`);
console.log(Object.entries(add).map(([f, l]) => `${f}: +${l.length}`).join(", ") || "nothing missing");
