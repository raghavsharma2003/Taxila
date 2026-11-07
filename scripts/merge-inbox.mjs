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
  for (const raw of box.edges || []) {
    // Streams have written {from, to, kind} as well as {src, dst, rel}; accept both rather than drop the edge.
    const edge = { src: raw.src ?? raw.from, rel: raw.rel ?? raw.kind, dst: raw.dst ?? raw.to };
    if (!ids.has(edge.src) || !ids.has(edge.dst) || !g.relations[edge.rel]) { console.log(`  skip edge ${edge.src} -${edge.rel}-> ${edge.dst}`); continue; }
    if (g.edges.some((x) => x.src === edge.src && x.rel === edge.rel && x.dst === edge.dst)) continue;
    g.edges.push(edge); e++;
  }
  // `md` is { decisions|measurements|rejected|architecture|open: text }. A plain string used to be fed to
  // Object.entries, which iterates a string's characters: one file per character, context/0.md … context/1308.md
  // (rj-r7-inbox-md-string-per-char). A string now goes to the document of the file's most common node kind, and
  // an unknown key goes to architecture.md with a warning: never a new file.
  const DOC = { decisions: "decisions", decision: "decisions", measurements: "measurements", measurement: "measurements",
    rejected: "rejected", rejections: "rejected", rejection: "rejected", architecture: "architecture", open: "open" };
  const KIND_DOC = { decision: "decisions", measurement: "measurements", rejection: "rejected" };
  let md = box.md || {};
  if (typeof md === "string") {
    const tally = {};
    for (const node of box.nodes || []) { const d = KIND_DOC[node.kind] || "architecture"; tally[d] = (tally[d] || 0) + 1; }
    md = { [Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || "architecture"]: md };
  }
  for (const [key, text] of Object.entries(md)) {
    if (typeof text !== "string" || !text.trim()) continue;
    const doc = DOC[key] || (console.log(`  md key "${key}" is not a context document; appended to architecture.md`), "architecture");
    appendFileSync(join(CTX, `${doc}.md`), `\n\n<!-- merged from inbox/${f} -->\n${text.trim()}\n`);
  }
  renameSync(join(INBOX, f), join(INBOX, "merged", f));
  console.log(`${f}: +${n} nodes, +${e} edges`);
}
writeFileSync(join(CTX, "graph.json"), JSON.stringify(g, null, 1));
