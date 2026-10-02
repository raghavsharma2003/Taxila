// Merge workflow-proposed context entries (context/inbox/*.json) into the graph and the .md files.
// Inbox format: {nodes:[{id,kind,title,at}], edges:[{src,rel,dst}], md:{decisions,measurements,rejected}}.
// Duplicate node ids are skipped; edges whose endpoints don't exist are reported and skipped.
// Merged files move to context/inbox/merged/. Run `node scripts/context.mjs --check` afterwards.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, renameSync, appendFileSync } from "fs";
import { join } from "path";
const CTX = new URL("../context/", import.meta.url).pathname;
const INBOX = join(CTX, "inbox");
const g = JSON.parse(readFileSync(join(CTX, "graph.json"), "utf8"));
const ids = new Set(g.nodes.map((n) => n.id));
mkdirSync(join(INBOX, "merged"), { recursive: true });
const files = readdirSync(INBOX).filter((f) => f.endsWith(".json") && (process.argv.length < 3 || process.argv.slice(2).includes(f)));
for (const f of files) {
  const box = JSON.parse(readFileSync(join(INBOX, f), "utf8"));
  let n = 0, e = 0;
  for (const node of box.nodes || []) {
    if (ids.has(node.id) || !g.kinds[node.kind] || !node.title) continue;
    g.nodes.push({ ...node, source: `inbox/${f}` }); ids.add(node.id); n++;
  }
  for (const edge of box.edges || []) {
    if (!ids.has(edge.src) || !ids.has(edge.dst) || !g.relations[edge.rel]) { console.log(`  skip edge ${edge.src} -${edge.rel}-> ${edge.dst}`); continue; }
    if (g.edges.some((x) => x.src === edge.src && x.rel === edge.rel && x.dst === edge.dst)) continue;
    g.edges.push(edge); e++;
  }
  for (const [doc, text] of Object.entries(box.md || {})) {
    if (text && text.trim()) appendFileSync(join(CTX, `${doc === "rejections" ? "rejected" : doc}.md`), `\n\n<!-- merged from inbox/${f} -->\n${text.trim()}\n`);
  }
  renameSync(join(INBOX, f), join(INBOX, "merged", f));
  console.log(`${f}: +${n} nodes, +${e} edges`);
}
writeFileSync(join(CTX, "graph.json"), JSON.stringify(g, null, 1));
