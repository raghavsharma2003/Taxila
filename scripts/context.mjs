// Query and validate this project's memory.
//
//   node scripts/context.mjs              — everything, grouped by kind
//   node scripts/context.mjs --node <id>  — one node and everything touching it
//   node scripts/context.mjs --kind <k>   — one kind
//   node scripts/context.mjs --check      — validate (used by CI)
//
// A node something supersedes prints "superseded by X": that is derived from the supersedes edges, never from a
// status someone has to remember to set.
//
// A context graph nobody can validate becomes fiction within a month: entries
// point at nodes that were renamed, decisions lose the measurements they rested
// on, and the file quietly turns into a story about the project rather than a
// record of it. --check is what stops that.
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { CURRENT_STATUS, edgeKey, indexOf, normalizeEdge, placeEdge } from "./lib/context-edges.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const CTX = join(ROOT, "context");
const g = JSON.parse(readFileSync(join(CTX, "graph.json"), "utf8"));
const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const byId = new Map(g.nodes.map((n) => [n.id, n]));
const docs = ["decisions.md", "measurements.md", "rejected.md", "architecture.md", "open.md"]
  .filter((f) => existsSync(join(CTX, f)))
  .map((f) => ({ f, text: readFileSync(join(CTX, f), "utf8") }));

if (args.includes("--check")) {
  const problems = [];
  const seen = new Set();
  for (const n of g.nodes) {
    if (seen.has(n.id)) problems.push(`duplicate node id: ${n.id}`);
    seen.add(n.id);
    if (!g.kinds[n.kind]) problems.push(`${n.id}: unknown kind "${n.kind}"`);
    if (!n.title) problems.push(`${n.id}: no title`);
  }
  for (const e of g.edges) {
    if (!byId.has(e.src)) problems.push(`edge from missing node: ${e.src}`);
    if (!byId.has(e.dst)) problems.push(`edge to missing node: ${e.dst}`);
    if (!g.relations[e.rel]) problems.push(`unknown relation "${e.rel}" (${e.src} -> ${e.dst})`);
  }
  // A merged inbox file whose nodes never reached the graph. merge-inbox moves a
  // file to inbox/merged/, which git records as a rename, so a stream that keeps
  // editing the old path merges its new entries INTO merged/ where nothing reads
  // them (rj-r7-inbox-file-reedited-after-merge: 28 nodes hidden this way).
  const mergedDir = join(CTX, "inbox", "merged");
  if (existsSync(mergedDir)) {
    for (const f of readdirSync(mergedDir).filter((x) => x.endsWith(".json"))) {
      let j;
      try { j = JSON.parse(readFileSync(join(mergedDir, f), "utf8")); } catch { problems.push(`inbox/merged/${f}: not valid JSON`); continue; }
      for (const n of j.nodes || []) {
        if (n && n.id && !byId.has(n.id)) problems.push(`inbox/merged/${f}: node ${n.id} never reached the graph (re-merge it)`);
      }
    }
    // Every edge of every merged file is in the graph (as written, or as mapped by scripts/lib/context-edges.mjs), or is
    // listed in merged/DROPPED.json with its reason. merge-inbox now refuses such a file, so this catches the old ones and
    // any file moved into merged/ by hand (audit DOCS-17/25: 229 edges were absent and the check passed).
    let dropped = new Set();
    const droppedFile = join(mergedDir, "DROPPED.json");
    if (existsSync(droppedFile)) {
      try { dropped = new Set((JSON.parse(readFileSync(droppedFile, "utf8")).dropped || []).map((d) => edgeKey(normalizeEdge(d.edge ?? d)))); }
      catch { problems.push("inbox/merged/DROPPED.json: not valid JSON"); }
    }
    const ix = indexOf(g);
    let missing = 0;
    for (const f of readdirSync(mergedDir).filter((x) => x.endsWith(".json") && x !== "DROPPED.json")) {
      let j;
      try { j = JSON.parse(readFileSync(join(mergedDir, f), "utf8")); } catch { continue; }
      for (const raw of j.edges || []) {
        const r = placeEdge(raw, g, ix);
        if (r.present || dropped.has(edgeKey(normalizeEdge(raw)))) continue;
        if (++missing <= 10) problems.push(`inbox/merged/${f}: edge ${edgeKey(normalizeEdge(raw))} is not in the graph and not in DROPPED.json (${r.drop ?? "not merged"})`);
      }
    }
    if (missing > 10) problems.push(`...and ${missing - 10} more merged-inbox edges missing from the graph`);
  }
  // A node something supersedes cannot still say it is live or proposed: a query would return the old answer as current.
  const supersededBy = new Map();
  for (const e of g.edges) if (e.rel === "supersedes") (supersededBy.get(e.dst) ?? supersededBy.set(e.dst, []).get(e.dst)).push(e.src);
  for (const n of g.nodes) {
    if (supersededBy.has(n.id) && CURRENT_STATUS.test(String(n.status ?? ""))) {
      problems.push(`${n.id} is [${n.status}] but ${supersededBy.get(n.id)[0]} supersedes it (set its status to "superseded")`);
    }
  }
  // Only the known documents live in context/. merge-inbox once wrote one file per character of a string `md`
  // (rj-r7-inbox-md-string-per-char): 1,309 files that nothing reads and the check never saw.
  const KNOWN = new Set(["architecture.md", "decisions.md", "measurements.md", "rejected.md", "open.md", "graph.json", "inbox"]);
  const stray = readdirSync(CTX).filter((x) => !KNOWN.has(x));
  if (stray.length) problems.push(`context/ holds ${stray.length} unexpected file(s), e.g. ${stray.slice(0, 3).join(", ")} (only the known documents belong here)`);
  // A decision or rejection that no prose file mentions is a title with nothing
  // behind it — exactly the kind of entry that reads as knowledge and is not.
  for (const n of g.nodes) {
    if (n.kind !== "decision" && n.kind !== "rejection" && n.kind !== "measurement") continue;
    if (!docs.some((d) => d.text.includes(n.id))) {
      problems.push(`${n.id} (${n.kind}) is in the graph but written up nowhere`);
    }
  }
  // ...and the other direction, which is the one that actually drifted. The
  // check above only ever asked "does this node have prose?". Nothing asked
  // "does this prose have a node?", so an entry appended to a .md without a
  // graph row passed --check forever while being invisible to `--node <id>`.
  //
  // It went unnoticed the whole time because appending prose is the part that
  // FEELS like logging: the knowledge is written down, the file is longer, the
  // session is logged. Only the index is missing, and an index is exactly the
  // thing you do not notice the absence of until you query it. Sixteen entries
  // had accumulated by 2026-08-20 — `dead-writers`, `never-scheduled` and
  // `selfbundle-never-set` among them, i.e. the highest-value rejections in the
  // file. `--node selfbundle-never-set` answered "no such node" while three
  // paragraphs about it sat in rejected.md.
  //
  // CLAUDE.md tells the next session to query the graph. That instruction is
  // only true if the graph is complete, so completeness is now a gate.
  const HEADING = /^## `([a-z0-9-]+)`/gm;
  // open.md writes each gap as "## <node-id>"; a heading that names no node is an item nothing can link to.
  const open = docs.find((d) => d.f === "open.md");
  if (open) {
    for (const m of open.text.matchAll(/^## ([a-z0-9][a-z0-9-]*)\s*$/gm)) {
      if (!byId.has(m[1])) problems.push(`open.md writes up ${m[1]} but the graph has no such node`);
    }
  }
  for (const d of docs) {
    if (d.f === "architecture.md" || d.f === "open.md") continue; // prose, not an entry list (open.md is read above)
    for (const m of d.text.matchAll(HEADING)) {
      if (!byId.has(m[1])) {
        problems.push(
          `${d.f} writes up \`${m[1]}\` but the graph has no such node — ` +
            `\`--node ${m[1]}\` cannot find it, so nothing linking to it can exist`,
        );
      }
    }
  }
  if (problems.length) {
    console.error(`context graph: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }
  console.log(
    `context graph ok — ${g.nodes.length} nodes, ${g.edges.length} edges, ${docs.length} documents`,
  );
  process.exit(0);
}

const supersededBy = new Map();
for (const e of g.edges) if (e.rel === "supersedes") (supersededBy.get(e.dst) ?? supersededBy.set(e.dst, []).get(e.dst)).push(e.src);
/** "superseded by X" from the edges (X, Y +n more), else the node's own status. */
const statusOf = (n) => {
  const by = supersededBy.get(n.id);
  return by ? `superseded by ${by[0]}${by.length > 1 ? ` +${by.length - 1} more` : ""}` : n.status || "";
};

const show = (n) => {
  const out = g.edges.filter((e) => e.src === n.id);
  const inc = g.edges.filter((e) => e.dst === n.id);
  console.log(`\n${n.id}  [${n.kind}]${n.at ? "  " + n.at : ""}`);
  console.log(`  ${n.title}`);
  if (statusOf(n)) console.log(`  status: ${statusOf(n)}`);
  for (const e of out) console.log(`  → ${e.rel} → ${e.dst}  (${byId.get(e.dst)?.title ?? "?"})`);
  for (const e of inc) console.log(`  ← ${e.rel} ← ${e.src}  (${byId.get(e.src)?.title ?? "?"})`);
  const where = docs.filter((d) => d.text.includes(n.id)).map((d) => d.f);
  if (where.length) console.log(`  written up in: ${where.join(", ")}`);
};

const one = arg("--node");
if (one) {
  const n = byId.get(one);
  if (!n) {
    console.error(`no such node: ${one}`);
    process.exit(1);
  }
  show(n);
  process.exit(0);
}

const kind = arg("--kind");
const kinds = kind ? [kind] : Object.keys(g.kinds);
for (const k of kinds) {
  const ns = g.nodes.filter((n) => n.kind === k);
  if (!ns.length) continue;
  console.log(`\n══ ${k.toUpperCase()} — ${g.kinds[k]}`);
  for (const n of ns) {
    console.log(`   ${n.id.padEnd(20)} ${n.title}${statusOf(n) ? `  [${statusOf(n)}]` : ""}`);
  }
}
console.log(`\n${g.nodes.length} nodes, ${g.edges.length} edges. --node <id> for detail.`);
