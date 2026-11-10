// Audit docs-memory (DOCS-17, 20, 24, 25, 28): the merger refuses what it cannot place, the repair script is idempotent, and
// `context.mjs --check` catches dropped edges, stale "live" statuses and open.md headings with no node. Every test runs on a
// throwaway copy of the scripts over a tiny fixture graph.
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = new URL("..", import.meta.url).pathname;
const RELATIONS = Object.fromEntries(["supersedes", "measured_by", "constrains", "part_of", "caused_by", "blocks", "inherits"].map((r) => [r, `the ${r} relation`]));
const KINDS = Object.fromEntries(["decision", "measurement", "rejection", "component", "constraint", "open", "finding"].map((k) => [k, `a ${k}`]));
const node = (id, kind = "decision", extra = {}) => ({ id, kind, at: "2026-10-01", title: `title of ${id}`, ...extra });

function fixture({ nodes, edges = [], merged = {}, inbox = {}, open = "", decisions = "" }) {
  const root = mkdtempSync(join(tmpdir(), "ctx-"));
  mkdirSync(join(root, "scripts"), { recursive: true });
  for (const f of ["merge-inbox.mjs", "context.mjs", "context-repair-2026-11-09.mjs"]) cpSync(join(REPO, "scripts", f), join(root, "scripts", f));
  cpSync(join(REPO, "scripts", "lib"), join(root, "scripts", "lib"), { recursive: true });
  mkdirSync(join(root, "context", "inbox", "merged"), { recursive: true });
  writeFileSync(join(root, "context", "graph.json"), JSON.stringify({ note: "", kinds: KINDS, relations: RELATIONS, nodes, edges }, null, 1));
  for (const [f, body] of Object.entries(merged)) writeFileSync(join(root, "context", "inbox", "merged", f), JSON.stringify(body));
  for (const [f, body] of Object.entries(inbox)) writeFileSync(join(root, "context", "inbox", f), JSON.stringify(body));
  writeFileSync(join(root, "context", "open.md"), open);
  // the check wants every decision, measurement and rejection written up somewhere
  writeFileSync(join(root, "context", "decisions.md"), `${decisions}\n\n<!-- ${nodes.map((n) => n.id).join(" ")} -->\n`);
  return root;
}
const run = (root, script, ...a) => spawnSync(process.execPath, [join(root, "scripts", script), ...a], { encoding: "utf8" });
const graphOf = (root) => JSON.parse(readFileSync(join(root, "context", "graph.json"), "utf8"));
const has = (g, src, rel, dst) => g.edges.some((e) => e.src === src && e.rel === rel && e.dst === dst);

test("merge-inbox: a file with an unknown relation or a missing end fails whole, stays in the inbox, merges nothing; a good file still merges", () => {
  const root = fixture({
    nodes: [node("a"), node("b")],
    inbox: {
      "bad.json": { nodes: [node("new-1")], edges: [{ src: "new-1", rel: "informs", dst: "a" }, { src: "a", rel: "part_of", dst: "b" }] },
      "bad2.json": { nodes: [node("new-2")], edges: [{ src: "new-2", rel: "part_of", dst: "no-such-node" }] },
      "good.json": { nodes: [node("new-3")], edges: [{ from: "new-3", kind: "part_of", to: "a" }] },
    },
  });
  const r = run(root, "merge-inbox.mjs");
  assert.notEqual(r.status, 0, "exit non-zero");
  assert.match(r.stderr, /bad\.json: NOT merged[\s\S]*unknown relation/);
  assert.match(r.stderr, /bad2\.json: NOT merged[\s\S]*no-such-node is not a node/);
  assert.ok(existsSync(join(root, "context/inbox/bad.json")) && existsSync(join(root, "context/inbox/bad2.json")), "failed files stay");
  assert.ok(!existsSync(join(root, "context/inbox/good.json")) && existsSync(join(root, "context/inbox/merged/good.json")));
  const g = graphOf(root);
  assert.ok(!g.nodes.some((n) => n.id === "new-1" || n.id === "new-2"), "nothing from a failed file");
  assert.ok(g.nodes.some((n) => n.id === "new-3") && has(g, "new-3", "part_of", "a"));
  assert.ok(!has(g, "a", "part_of", "b"), "not even its valid edge");
});

test("merge-inbox: an edge to a node the same file adds is fine", () => {
  const root = fixture({ nodes: [node("a")], inbox: { "ok.json": { nodes: [node("x")], edges: [{ src: "x", rel: "caused_by", dst: "a" }] } } });
  const r = run(root, "merge-inbox.mjs");
  assert.equal(r.status, 0, r.stderr);
  assert.ok(has(graphOf(root), "x", "caused_by", "a"));
});

const messy = () => fixture({
  nodes: [node("d1", "decision", { status: "live" }), node("d2"), node("m1", "measurement"), node("r1", "rejection"), node("d3", "decision", { status: "proposed" }), node("d4", "decision", { status: "proposed (patch 01)" }), node("o1", "open")],
  edges: [{ src: "d1", rel: "part_of", dst: "d2" }, { src: "d2", rel: "measured_by", dst: "m1" }, { src: "d4", rel: "caused_by", dst: "m1" }, { src: "r1", rel: "caused_by", dst: "d2" }, { src: "d1", rel: "caused_by", dst: "r1" }],
  merged: {
    "s1.json": { edges: [
      { src: "d2", rel: "supersedes", dst: "d1" },                 // valid, absent: merged; d1 is live so it becomes superseded
      { from: "d3", kind: "part_of", to: "d2" },                    // from/to keys
      { src: "m1", rel: "informs", dst: "d2" },                     // d2 caused_by m1
      { src: "d3", rel: "implements", dst: "d2" },                  // d3 part_of d2 (already there from the line above: present)
      { src: "d3", rel: "refines", dst: "d1" },                     // d3 part_of d1
      { src: "m1", rel: "supports", dst: "d3" },                    // a measurement: d3 measured_by m1
      { src: "r1", rel: "supports", dst: "d4" },                    // not a measurement: d4 caused_by r1
      { src: "d4", rel: "extends", dst: "d2" },                     // widened 2026-11-10: d4 part_of d2
      { src: "d4", rel: "related", dst: "d2" },                     // no direction, no honest mapping: dropped
      { src: "d4", rel: "part_of", dst: "ghost" },                  // endpoint missing: dropped
      { src: "d4", rel: "supersedes", dst: "d3" },                  // d3 is proposed and superseded: flips
    ] },
  },
  open: "# Open\n\n## o1\nsomething\n\n## o-no-node-2026-10-02\n- first line of the item\n",
  decisions: "## deploy-classify-grok (proposed)\nold text needs adoption\n\n## model-x (2026-10-03)\nx\n\n<!-- merged -->\n## deploy-classify-grok (2026-10-03)\nSet in scripts/deploy-azure.mjs\n",
});

test("repair: merges, maps, drops with reasons, flips statuses, fixes open.md and the double heading; a second run changes nothing", () => {
  const root = messy();
  assert.equal(run(root, "context.mjs", "--check").status, 1, "the check fails before the repair");
  const r = run(root, "context-repair-2026-11-09.mjs", "--root", root);
  assert.equal(r.status, 0, r.stderr);
  const g = graphOf(root);
  assert.ok(has(g, "d2", "supersedes", "d1") && has(g, "d3", "part_of", "d2"));
  assert.ok(has(g, "d2", "caused_by", "m1"), "informs: B caused_by A");
  assert.ok(has(g, "d3", "part_of", "d1"), "refines: A part_of B");
  assert.ok(has(g, "d3", "measured_by", "m1"), "supports from a measurement: B measured_by A");
  assert.ok(has(g, "d4", "caused_by", "r1"), "supports from anything else: B caused_by A");
  const st = Object.fromEntries(g.nodes.map((n) => [n.id, n.status]));
  assert.equal(st.d1, "superseded"); assert.equal(st.d3, "superseded"); assert.equal(st.d4, "proposed (patch 01)", "nothing supersedes d4");
  const dropped = JSON.parse(readFileSync(join(root, "context/inbox/merged/DROPPED.json"), "utf8")).dropped;
  assert.equal(dropped.length, 2);
  assert.ok(dropped.some((d) => d.edge.rel === "related" && /no honest mapping/.test(d.reason)));
  assert.ok(has(g, "d4", "part_of", "d2"), "extends: A part_of B");
  assert.ok(dropped.some((d) => d.edge.dst === "ghost" && /endpoint not in the graph: ghost/.test(d.reason)));
  assert.ok(g.nodes.some((n) => n.id === "o-no-node-2026-10-02" && n.kind === "open" && n.title === "first line of the item"));
  const dec = readFileSync(join(root, "context/decisions.md"), "utf8");
  assert.doesNotMatch(dec, /\(proposed\)|needs adoption/); assert.match(dec, /## deploy-classify-grok \(2026-10-03\)/); assert.match(dec, /## model-x/);
  const check = run(root, "context.mjs", "--check");
  assert.equal(check.status, 0, check.stderr);
  const snap = () => ["graph.json", "decisions.md", "open.md", "inbox/merged/DROPPED.json"].map((f) => readFileSync(join(root, "context", f), "utf8")).join("\n#####\n");
  const before = snap();
  assert.equal(run(root, "context-repair-2026-11-09.mjs", "--root", root).status, 0);
  assert.equal(snap(), before, "idempotent");
});

test("check: a merged-inbox edge that is neither in the graph nor in DROPPED.json fails; so does a live node that something supersedes", () => {
  const root = fixture({
    nodes: [node("a", "decision", { status: "live" }), node("b")],
    edges: [{ src: "b", rel: "supersedes", dst: "a" }],
    merged: { "m.json": { edges: [{ src: "a", rel: "part_of", dst: "b" }, { src: "b", rel: "supersedes", dst: "a" }] } },
  });
  const r = run(root, "context.mjs", "--check");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /m\.json: edge a\|part_of\|b is not in the graph and not in DROPPED\.json/);
  assert.match(r.stderr, /a is \[live\] but b supersedes it/);
  writeFileSync(join(root, "context/inbox/merged/DROPPED.json"), JSON.stringify({ dropped: [{ edge: { src: "a", rel: "part_of", dst: "b" }, reason: "test" }] }));
  const g = graphOf(root); g.nodes[0].status = "superseded"; writeFileSync(join(root, "context/graph.json"), JSON.stringify(g));
  const again = run(root, "context.mjs", "--check");
  assert.equal(again.status, 0, again.stderr);
});

test("check: open.md is read (a heading with no node fails); listings print 'superseded by X' from the edges", () => {
  const root = fixture({ nodes: [node("a"), node("b")], edges: [{ src: "b", rel: "supersedes", dst: "a" }], open: "## ghost-item\ntext\n" });
  const r = run(root, "context.mjs", "--check");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /open\.md writes up ghost-item but the graph has no such node/);
  const out = run(root, "context.mjs", "--kind", "decision").stdout;
  assert.match(out, /a\s+title of a\s+\[superseded by b\]/);
  assert.match(run(root, "context.mjs", "--node", "a").stdout, /status: superseded by b/);
});

test("the real memory: the check passes, the audit's own entries are in, and architecture.md says what it is", () => {
  const r = spawnSync(process.execPath, [join(REPO, "scripts/context.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const arch = readFileSync(join(REPO, "context/architecture.md"), "utf8");
  assert.match(arch, /What this file is\.\*\* A dated log/);
  assert.match(arch, /## Current map, 2026-11-10/);
  assert.doesNotMatch(arch.slice(0, 600), /filled in from the spec phase/);
  const g = JSON.parse(readFileSync(join(REPO, "context/graph.json"), "utf8"));
  const st = Object.fromEntries(g.nodes.map((n) => [n.id, n.status]));
  for (const id of ["deploy-vercel-single-function", "voice-realtime-model", "voice-turn-config", "forge-models", "forge-infra-azure"]) assert.equal(st[id], "superseded", id);
  assert.ok(existsSync(join(REPO, "context/inbox/merged/DROPPED.json")));
});
