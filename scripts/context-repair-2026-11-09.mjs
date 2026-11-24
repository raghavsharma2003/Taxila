#!/usr/bin/env node
// One-off, idempotent repair of the project memory found by the 2026-11-09 audit (docs/design/round7/audit/docs-memory.md).
//   node scripts/context-repair-2026-11-09.mjs            repair this checkout
//   node scripts/context-repair-2026-11-09.mjs --root DIR  repair a copy (the tests do this)
// Nothing here depends on a line number: every step finds its target by id, heading or marker, and a second run changes
// nothing. Steps:
//   1. DOCS-18, 21, 22, 23, 26, 28 (edges), 29, 43: merge the audit's own proposal (context/inbox/r7-audit-docs-memory.json)
//      through merge-inbox.mjs, if it is still in the inbox.
//   2. DOCS-17: every edge in a merged inbox file that never reached the graph is merged (96 valid as written), mapped
//      onto the seven relations (scripts/lib/context-edges.mjs), or dropped and listed in inbox/merged/DROPPED.json
//      with its reason. A listed edge is read again on every run, so widening the mapping places it and takes it off
//      the list; the pass repeats until nothing more is placed, which is what makes a second run a no-op.
//   3. DOCS-20: a live / provisioned / proposed node that something supersedes becomes "superseded" (context.mjs also
//      prints "superseded by X" from the edges).
//   4. DOCS-28: the first of two "deploy-classify-grok" headings ("proposed, needs adoption") is removed; the second says
//      it is set in scripts/deploy-azure.mjs.
//   5. DOCS-24: context/architecture.md gets a header saying it is a dated log and a "Current map, 2026-11-10".
//   6. open.md headings with no node get one.
//   3b. DOCS-27: 26 decisions still marked "proposed" whose code exists become "shipped" (the table SHIPPED below).
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { CURRENT_STATUS, edgeKey, indexOf, normalizeEdge, placeEdge } from "./lib/context-edges.mjs";

const args = process.argv.slice(2);
const ROOT = resolve(args.includes("--root") ? args[args.indexOf("--root") + 1] : new URL("..", import.meta.url).pathname);
const CTX = join(ROOT, "context");
const INBOX = join(CTX, "inbox");
const MERGED = join(INBOX, "merged");
const PROPOSAL = "r7-audit-docs-memory.json";
const loadGraph = () => JSON.parse(readFileSync(join(CTX, "graph.json"), "utf8"));
const saveGraph = (g) => writeFileSync(join(CTX, "graph.json"), JSON.stringify(g, null, 1));
const report = [];

// 1 ── the audit's own proposal
if (existsSync(join(INBOX, PROPOSAL))) {
  const r = spawnSync(process.execPath, [join(ROOT, "scripts", "merge-inbox.mjs"), PROPOSAL], { encoding: "utf8" });
  report.push(`proposal: ${(r.stdout || "").trim().split("\n").pop()}`);
  if (r.status !== 0) { console.error(r.stderr || r.stdout); console.error("the proposal could not be merged; fix it and run again"); process.exit(1); }
}

// 2 ── the edges merged files never delivered
let g = loadGraph();
const ix = indexOf(g); // shapes are read once, before anything is added: a mapped edge must match a shape the graph had
const droppedPath = join(MERGED, "DROPPED.json");
const prior = existsSync(droppedPath) ? JSON.parse(readFileSync(droppedPath, "utf8")).dropped || [] : [];
const dropped = new Map(prior.map((d) => [edgeKey(normalizeEdge(d.edge)), d]));
let added = 0, mapped = 0;
for (let placed = 1; placed > 0;) {
  placed = 0;
  ix.shapes = indexOf(g).shapes; // an edge placed in the last pass may be the first of its shape
  for (const f of readdirSync(MERGED).filter((x) => x.endsWith(".json") && x !== "DROPPED.json").sort()) {
    let j;
    try { j = JSON.parse(readFileSync(join(MERGED, f), "utf8")); } catch { continue; }
    for (const raw of j.edges || []) {
      const key = edgeKey(normalizeEdge(raw));
      const r = placeEdge(raw, g, ix);
      if (r.drop) { if (!dropped.has(key)) dropped.set(key, { edge: normalizeEdge(raw), from: f, reason: r.drop }); else dropped.get(key).reason = r.drop; continue; }
      dropped.delete(key);
      if (r.add && !ix.have.has(edgeKey(r.add))) { g.edges.push(r.add); ix.have.add(edgeKey(r.add)); added++; placed++; if (r.mapped) mapped++; }
    }
  }
}
const list = [...dropped.values()].sort((a, b) => edgeKey(normalizeEdge(a.edge)).localeCompare(edgeKey(normalizeEdge(b.edge))));
writeFileSync(droppedPath, JSON.stringify({
  note: "Edges written in inbox files that could not be placed in the graph, with the reason (audit DOCS-17, repair 2026-11-09). `node scripts/context.mjs --check` accepts an edge that is in the graph or listed here.",
  dropped: list,
}, null, 1) + "\n");
report.push(`edges: +${added} (of which ${mapped} mapped from informs/implements/refines/supports and their synonyms), ${list.length} dropped and listed`);

// 3 ── superseded statuses
const by = new Map();
for (const e of g.edges) if (e.rel === "supersedes") by.set(e.dst, e.src);
let flipped = 0;
for (const n of g.nodes) if (by.has(n.id) && CURRENT_STATUS.test(String(n.status ?? ""))) { n.status = "superseded"; flipped++; }
report.push(`status: ${flipped} node(s) set to superseded`);

// 3b ── DOCS-27: a decision still marked "proposed" whose named constant or module is in the code (checked 2026-11-10 at
// integration 21b; the comment on each line is the proof). Only a status that still starts with "proposed" is changed.
// The other proposed decisions are left alone on purpose: docs/design/round7/audit/docs-memory.md lists them and why.
const SHIPPED = {
  "duplex-arch-six-loops-device-floor": "shipped", // src/duplex/governor.ts (the floor state machine)
  "duplex-fast-mouth-late-verdict": "shipped", // src/duplex/config.ts VERDICT; src/duplex/host.ts (the verdict-free uptake)
  "duplex-content-blind-nods": "shipped", // src/duplex/config.ts (backchannel opportunity)
  "duplex-result-triage": "shipped", // server/duplex/triage.js
  "duplex-echo-by-audio-span": "shipped", // server/duplex/echo.js EchoSubtractor, used by src/duplex/host.ts
  "duplex-unreadable-script": "shipped", // src/duplex/governor.ts (unreadable newest words)
  "duplex-turn-pace": "shipped", // src/duplex/config.ts TURN_PACE k 1.3
  "duplex-stage-a-ships-2026-10-04": "shipped", // src/duplex/engineRules.ts; hands-free is the default (server/duplex/config.js)
  "duplex-stageb-features-only-no-vouch": "shipped", // src/duplex/host.ts latestAcoustic
  "duplex-runtime-2026-10-04": "shipped", // src/duplex/host.ts EngineHost
  "duplex-verdict-delay-2s": "shipped", // src/duplex/config.ts VERDICT.delayMs 2000
  "duplex-overlap-stay-ducked": "shipped", // src/duplex/host.ts (undecided burst, duck release)
  "duplex-explain-sentence-cap": "shipped", // src/duplex/engineRules.ts EXPLAIN_SENTENCE_CAP
  "duplex-lexical-horizon-guard": "shipped", // src/duplex/host.ts coverageEndMs
  "duplex-verdict-blind-timing": "shipped", // src/duplex/form.ts (the expected-answer grammar)
  "rs4-v2-rung1-engine-spec": "shipped", // shared/studio-spec.ts (one schema per archetype)
  "rs4-shared-pure-grader": "shipped", // shared/studio-spec.ts gradeAnswer
  "rs4-host-recorded-input": "shipped", // src/studio-v2/engines/shadow.ts ($hostLog)
  "rs4-safe-zone-measured": "shipped", // src/studio-v2/core/draw.ts ZONES
  "rs4-junk-labels-rejected": "shipped", // shared/studio-spec.ts (failure-shaped tokens)
  "vs-z-on-server": "shipped", // server/voicesig/adapter.js
  "vs-voice-lr-over-text": "shipped", // server/voicesig/adapter.js replaceTimingTerm
  "vs-filler-detector-ami": "shipped", // src/voicesig/ort.ts
  "r4c-dc-screen-claims-by-predicate": "shipped", // server/brain/say.js screenContradictions
  "dc-r144-ways-chips-lang": "shipped", // server/director/state.js chipLabels
  "r5a-dc-understood-is-earned": "shipped", // server/agent/agent.js earnedRead
};
let shipped = 0;
for (const n of g.nodes) if (SHIPPED[n.id] && /^proposed/.test(String(n.status ?? ""))) { n.status = "shipped"; shipped++; }
report.push(`status: ${shipped} proposed decision(s) set to shipped`);

// 6 ── open.md headings that name no node
const openPath = join(CTX, "open.md");
if (existsSync(openPath)) {
  const text = readFileSync(openPath, "utf8");
  const ids = new Set(g.nodes.map((n) => n.id));
  const parts = text.split(/^(?=## )/m);
  let made = 0;
  for (const m of text.matchAll(/^## ([a-z0-9][a-z0-9-]*)\s*$/gm)) {
    if (ids.has(m[1])) continue;
    const body = parts.find((p) => p.startsWith(`## ${m[1]}`)) ?? "";
    const first = body.split("\n").slice(1).find((l) => l.replace(/^[-*\s]+/, "").trim()) ?? m[1];
    const at = (m[1].match(/(\d{4}-\d{2}-\d{2})/) ?? [])[1] ?? "2026-10-02";
    g.nodes.push({ id: m[1], kind: "open", at, title: first.replace(/^[-*\s]+/, "").trim().slice(0, 400), source: "open.md" });
    ids.add(m[1]); made++;
  }
  report.push(`open.md: ${made} heading(s) given a node`);
}
saveGraph(g);

// 4 ── DOCS-28: the first of two deploy-classify-grok headings
const decPath = join(CTX, "decisions.md");
if (existsSync(decPath)) {
  let t = readFileSync(decPath, "utf8");
  const heads = [...t.matchAll(/^## deploy-classify-grok \(proposed\)\s*$/gm)];
  if (heads.length === 1 && /^## deploy-classify-grok \(2026/m.test(t)) {
    const start = heads[0].index;
    const next = t.indexOf("\n## ", start + 1);
    t = t.slice(0, start) + t.slice(next + 1);
    writeFileSync(decPath, t);
    report.push("decisions.md: the stale 'deploy-classify-grok (proposed)' heading removed");
  }
}

// 5 ── DOCS-24: architecture.md says what it is, and carries a current map
const archPath = join(CTX, "architecture.md");
const MARK = "<!-- context-repair-2026-11-09: header and current map -->";
const HEADER = `# Architecture

${MARK}
> **What this file is.** A dated log of what each build session wrote down about the system on the day it wrote it,
> in the order merged. Entries below the map are history: many say "open", "not built" or "not applied" about things the
> code has since done, and nothing in the log records the close (audit DOCS-23; the closing entries are in
> \`ms-audit-open-items-closed-2026-11-09\`). Read the map first, trust the code over any entry, and use
> \`node scripts/context.mjs --node <id>\` for what replaced what.

## Current map, 2026-11-10

Written from the code on \`int/r6\` at integration 21a (round 7). Where a path is named, it exists.

**Two processes, one image.** \`server/serve.mjs\` serves the built client (\`dist/\`) and the API on one port: Azure Container
Apps \`taxila-web\`. \`server/worker.mjs\` is \`taxila-worker\`, the Conductor's background host (a leader-only ticker, a dirty
set of children, and fast and slow job lanes). \`server/index.js\` registers every route table (\`server/routes/*.js\` and feature
folders); \`api/[...route].js\` is only a shim. Data is Postgres (Neon) through \`server/db.js\`; the schema is
\`db/migrations\` (001 to 047), applied by \`scripts/migrate.mjs\` (the test branch unless \`--prod\`). All model calls go through
\`server/azure.js\` (role-named deployments, \`server/lanes.js\` keeps background calls from starving the live ones).

**A lesson turn.** \`server/routes/lesson.js\` starts a lesson and takes each turn. The lane is chosen once at start and pinned:
the Director lane (default: \`server/director\` decides the beat, \`server/brain\` says it) or the Teacher agent lane
(\`server/agent\`, owner cohort or \`TAXILA_TEACHER=agent\`; \`server/agent/flags.js\`). Both run behind the same safety floor
(\`server/safety\`, \`server/director/safety.js\`: frozen). Answers are classified against verified keys in code
(\`server/director/classify.js\`, \`server/grading\`); a model never grades. Content: \`server/content\` (kits in \`data/kits\`,
syllabus in \`data/curriculum\`); \`server/compiler\` builds the teacher's instructions (one teacher, Asha, classes 1-9).

**What the system learns about the child.** \`server/learner\` (knowledge tracing, affect from dialogue, formats),
\`server/comprehension\` (did the child understand, checks, belief), \`server/signals\`, \`server/voicesig\` (answer pace, shadow),
\`server/relational\` (what the teacher remembers; the parent can read and delete it).

**What gets made while she teaches.** \`server/forge\` and \`server/forge3\` (personalised pieces), \`server/studio\` (the Studio
channel and the board), \`server/stagecraft\` (speculative content ahead of the turn), \`server/play\` (game families, graded by
replaying the child's own acts).

**Voice.** \`server/voice\` (speech out, realtime session, prewarm), \`server/duplex\` (hands-free listening: on for everyone since
round 7, kill switch \`TAXILA_DUPLEX=off\`), \`server/latency\` (acknowledgement, turn prefetch).

**The child's day, the parent, the account.** \`server/conductor\` (plans the day; runs in the worker), \`server/reports\` (parent
reports), \`server/placement\`, \`server/homework\`, \`server/pair\` (a child's own device), \`server/signin\` (emailed code),
\`server/routes/account.js\` and \`parent.js\`. Owner view: \`server/ops\`, \`server/cost\`, \`server/trace\` (flight recorder).

**The client** (React 19, \`src/main.tsx\`). \`src/app\` holds the routes (landing, who, sign-in, pairing); \`src/child\` the child's
shell and lesson screen; \`src/lesson\` the live-lesson runtime (turns, audio, hands-free); \`src/ui-v3/kaksha\` the Kaksha screens;
\`src/face-puppet\` Asha's face (the 2D puppet; \`src/avatar\` holds the parked 3D head and the voice ring); \`src/studio-v2\`,
\`src/play\`, \`src/modules\` the boards, games and sandboxed engines; \`src/parent\`, \`src/onboarding\`; \`src/duplex\`, \`src/voice\`,
\`src/voicesig\`, \`src/latency\`, \`src/trace\`, \`src/stagecraft\`, \`src/signals\`. \`shared/\` holds the seams between client, server
and content (\`contracts.ts\`).

**Around the code.** \`tests/\` (run by \`npm run test:all\`), \`evals/\` (measured harnesses), \`scripts/\` (deploys:
\`release.mjs\`, \`deploy-azure.mjs\`; one-offs; \`gpu/\` is the AWS build harness, an open owner question), \`context/\` (this memory),
\`docs/\` (research, design rounds, handoffs; \`docs/design/round7/\` is current).

---

`;
if (existsSync(archPath)) {
  const t = readFileSync(archPath, "utf8");
  if (!t.includes(MARK)) {
    const rest = t.replace(/^# Architecture\s*\n\s*\(filled in from the spec phase\)\s*\n/, "");
    writeFileSync(archPath, HEADER + rest.replace(/^\s+/, ""));
    report.push("architecture.md: header and current map added");
  }
}

console.log(report.join("\n"));
