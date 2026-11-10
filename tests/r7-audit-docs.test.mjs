// The pages a new session or the owner reads first must not contradict the repo (audit 2026-11-09, docs-memory:
// docs/design/round7/audit/docs-memory.md). Every check here compares a doc with a file on disk or with another doc,
// never with a number that the next integration will change. Pure file reads: no network, no database.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const has = (p) => existsSync(join(ROOT, p));
const R7 = "docs/design/round7";
const ENTRY = ["HANDOFF.md", "CLAUDE.md", "docs/ARCHITECTURE.md", ...["PIPELINE", "OWNER", "M3", "SESSIONS"].map((n) => `${R7}/${n}.md`)];

// A line may name a path that is not there if it says so itself.
const SAYS_ABSENT = /\(not built\b|\(gone\b|\(removed\b|never (written|built)|does not exist/i;
const REPO_PATH = /^(server|src|shared|scripts|data|evals|db|infra|tests|public|docs|context|api|art)\/[\w./@[\]-]+$/;

/** Backticked repo paths in a doc that do not exist, as "file:line path". Globs and placeholders are skipped. */
function deadPaths(file) {
  const out = [];
  read(file).split("\n").forEach((line, i) => {
    if (SAYS_ABSENT.test(line)) return;
    for (const span of line.matchAll(/`([^`]+)`/g)) for (const raw of span[1].split(/[\s,()=]+/)) {
      const p = raw.replace(/[.,;:]+$/, "").replace(/:\d+(-\d+)?$/, "");
      if (!REPO_PATH.test(p) || /[<>{}*…]/.test(raw)) continue;
      if (!has(p)) out.push(`${file}:${i + 1} ${p}`);
    }
  });
  return out;
}

test("entry docs: every backticked repo path exists, or the line says it does not", () => {
  const dead = ENTRY.flatMap(deadPaths);
  assert.deepEqual(dead, []);
});

test("PIPELINE and SESSIONS name the same branches: no claude/r7-brain, -voice, -studio, no int/r7", () => {
  const pipeline = read(`${R7}/PIPELINE.md`);
  const sessions = read(`${R7}/SESSIONS.md`);
  for (const b of ["claude/r7-brain", "claude/r7-voice", "claude/r7-studio"]) {
    assert.ok(!sessions.includes(b), `SESSIONS.md now lists ${b}: update this test`);
    assert.ok(!pipeline.includes(b), `PIPELINE.md names ${b}, which SESSIONS.md does not have`);
  }
  assert.match(sessions, /integration branch `int\/r6`/);
  // The raw critic dump is a dated record; everything before it is the plan people follow.
  const plan = pipeline.split("## Critic findings (raw)")[0] + pipeline.split("## D. Decisions")[1];
  assert.ok(!/int\/r7\b/.test(plan.replace(/\(planned as int\/r7[^)]*\)/g, "")), "PIPELINE.md still sends work to int/r7");
});

test("PIPELINE does not promise an ownership check that was never written", () => {
  const pipeline = read(`${R7}/PIPELINE.md`).split("## Critic findings (raw)")[0];
  for (const p of [`${R7}/OWNERSHIP.json`, "scripts/ownership-check.mjs"]) {
    if (has(p)) continue;
    const lines = pipeline.split("\n").filter((l) => l.includes(p.split("/").pop()) && !SAYS_ABSENT.test(l));
    assert.deepEqual(lines.map((l) => l.slice(0, 80)), [], `${p} is named as if it exists`);
  }
});

test("OWNERSHIP: a path marked (new) is not there yet; every other path is there or marked (not built)", () => {
  const rows = read(`${R7}/OWNERSHIP.md`).split("\n").filter((l) => /^\| [A-GM]\d?\. /.test(l));
  assert.equal(rows.length, 9);
  const wrong = [];
  for (const row of rows) for (const cell of row.split("|")[2].split("<br>")) {
    const entry = cell.trim();
    const m = entry.match(/^((?:server|src|shared|scripts|data|evals|infra|public|art|tests|docs|index\.html|\.github)[\w./@*-]*)/);
    if (!m || /^NOT the frozen/.test(entry)) continue;
    // "dir/**" must be a directory that exists; "dir/name-*" must match a file by prefix; a plain path must exist.
    const star = m[1].indexOf("*");
    const base = (star < 0 ? m[1] : m[1].slice(0, star)).replace(/\/$/, "");
    const prefix = star > 0 && m[1][star - 1] !== "/";
    const dir = join(ROOT, base.slice(0, base.lastIndexOf("/")));
    const there = prefix ? existsSync(dir) && readdirSync(dir).some((f) => f.startsWith(base.split("/").pop())) : has(base);
    const notBuilt = /\(not built\b/.test(entry);
    if (/\(new\)/.test(entry) && there) wrong.push(`${m[1]}: marked (new) but exists`);
    if (!/\(new\)/.test(entry) && !notBuilt && !there) wrong.push(`${m[1]}: listed but missing`);
    if (notBuilt && there) wrong.push(`${m[1]}: marked (not built) but exists`);
  }
  assert.deepEqual(wrong, []);
});

test("OWNERSHIP and the code agree on who owns the BANDS table in shared/learner.ts", () => {
  if (!/Brain owns this table/.test(read("shared/learner.ts"))) return;
  const rows = read(`${R7}/OWNERSHIP.md`).split("\n");
  const brain = rows.find((l) => l.startsWith("| A. "));
  const learning = rows.find((l) => l.startsWith("| F. "));
  assert.match(brain, /shared\/learner\.ts[^<]*BANDS/);
  assert.match(learning, /shared\/learner\.ts \(except[^)]*BANDS/);
});

test("the owner page and M3.md agree on whether the Founders Hub automation is running", () => {
  const m3 = read(`${R7}/M3.md`), owner = read(`${R7}/OWNER.md`), handoff = read("HANDOFF.md");
  if (!/\*\*M3 is live\*\*/.test(m3)) return;
  assert.ok(!/It is \*\*not running\*\*/.test(owner), "OWNER.md says the M3 automation is not running");
  assert.ok(!/Built and ready, not applied: `claude\/r7-m3`/.test(owner), "OWNER.md says M3 is not applied");
  assert.ok(!/Apply by 2026-11-07/.test(owner), "OWNER.md still asks the owner to apply M3");
  assert.ok(!/A plan was proposed, owner decision pending/.test(handoff), "HANDOFF.md says the M3 plan is pending");
  assert.match(handoff, /M3\.md/);
});

test("the owner page cites the decision the newest lesson judgement took", () => {
  const dir = `${R7}/judgements`;
  const newest = readdirSync(join(ROOT, dir)).filter((f) => /^director\d+-/.test(f)).sort((a, b) => parseInt(a.slice(8)) - parseInt(b.slice(8))).pop();
  const decision = read(`${dir}/${newest}`).match(/^## Decision: (dc-[\w-]+)/m)?.[1];
  if (!decision) return;
  assert.ok(read(`${R7}/OWNER.md`).includes(decision), `OWNER.md does not mention ${decision} (${newest})`);
});

test("HANDOFF says up front that it is a dated snapshot and where the current state is", () => {
  const top = read("HANDOFF.md").split("\n").slice(0, 30).join("\n");
  assert.match(top, /int\/r6/);
  assert.match(top, /docs\/design\/round7\/OWNER\.md/);
  assert.match(top, /docs\/design\/round7\/SESSIONS\.md/);
});

test("HANDOFF gives the commit gate CLAUDE.md gives, and names the deploy gate's file", () => {
  const handoff = read("HANDOFF.md");
  assert.match(read("CLAUDE.md"), /npm run test:all/);
  assert.match(handoff, /npm run test:all/);
  assert.match(handoff, /infra\/gate\.mjs/);
  assert.ok(!/Gates before any code commit: `npx tsc -b && npx vite build && npm test`/.test(handoff));
});

test("ARCHITECTURE.md: the host, the default lane and every named route match the server", () => {
  const arch = read("docs/ARCHITECTURE.md");
  assert.ok(!/Vercel functions/.test(arch), "names Vercel functions as the server");
  assert.ok(!/Audio is never stored\./.test(arch), "says audio is never stored (tier-2 trace clips are)");
  assert.match(arch, /server\/serve\.mjs/);
  assert.match(arch, /cascade/i);
  const server = [];
  const walk = (d) => { for (const f of readdirSync(join(ROOT, d), { withFileTypes: true })) f.isDirectory() ? walk(`${d}/${f.name}`) : /\.m?js$/.test(f.name) && server.push(read(`${d}/${f.name}`)); };
  walk("server");
  const all = server.join("\n");
  const missing = [];
  for (const m of arch.matchAll(/`((?:GET|POST|PUT|PATCH|DELETE)(?:\/(?:GET|POST|PUT|PATCH|DELETE))*) (\/api\/[\w/:.-]+)`/g)) {
    for (const method of m[1].split("/")) if (!all.includes(`${method} ${m[2]}`)) missing.push(`${method} ${m[2]}`);
  }
  assert.deepEqual(missing, []);
});

test("stream handoffs and ops docs do not instruct with names the code dropped", () => {
  const gone = [
    ["docs/handoff/stream3.md", "BESIDE_NAME_WAIT_MS", "server/director/classify.js"],
    ["docs/ops/MODEL-STACK.md", "DEPLOY_WRITE", "server/azure.js"],
  ];
  for (const [doc, name, code] of gone) {
    if (read(code).includes(name)) continue;
    const lines = read(doc).split("\n").filter((l) => l.includes(name) && !/\(gone|never built|not built|now `/.test(l));
    assert.deepEqual(lines.map((l) => l.slice(0, 90)), [], `${doc} names ${name}, which ${code} does not have`);
  }
  assert.ok(!read("docs/patches/to-app/007-coldstart-answers.md").includes("src/onboarding/steps/ChildProfile.tsx"));
  assert.match(read("docs/handoff/STARTUP-PROMPT.md").split("\n").slice(0, 8).join("\n"), /used once|do not reuse/i);
});

test("OWNERSHIP: everything directly under server/, src/, shared/ and data/ has an owner (or is a frozen safety file)", () => {
  const entries = ["server/safety/**", "server/director/safety.js", "server/compiler/floor.js"];
  for (const row of read(`${R7}/OWNERSHIP.md`).split("\n").filter((l) => /^\| [A-GM]\d?\. /.test(l))) for (const cell of row.split("|")[2].split("<br>")) {
    const m = cell.trim().match(/^((?:server|src|shared|data)[\w./@*-]*)/);
    if (m) entries.push(m[1]);
  }
  const owned = (p) => entries.some((e) => {
    const star = e.indexOf("*");
    const base = (star < 0 ? e : e.slice(0, star)).replace(/\/$/, "");
    // the entry is the path, a folder above it, a name prefix of it, or something inside it
    return p === base || p.startsWith(base + "/") || (star > 0 && e[star - 1] !== "/" && p.startsWith(base)) || base.startsWith(p + "/");
  });
  const unowned = ["server", "src", "shared", "data"].flatMap((d) => readdirSync(join(ROOT, d)).map((f) => `${d}/${f}`)).filter((p) => !owned(p));
  assert.deepEqual(unowned, []);
});

test("CLAUDE.md: the gate and deploy commands it names exist, and it starts a new session in round 7", () => {
  const claude = read("CLAUDE.md");
  for (const p of ["scripts/release.mjs", "scripts/deploy-azure.mjs", "scripts/check-prompt-budget.mjs", "infra/gate.mjs"]) {
    assert.ok(claude.includes(p), `CLAUDE.md does not name ${p}`);
    assert.ok(has(p), `${p} is missing`);
  }
  assert.match(claude, /Start here: `docs\/design\/round7\/OWNER\.md`/);
  // the commit gate in CLAUDE.md carries every non-test step the deploy gate runs
  const gate = read("infra/gate.mjs").match(/GATE_CMDS = \[([^\]]+)\]/)[1];
  for (const cmd of gate.match(/"[^"]+"/g).map((s) => s.slice(1, -1)).filter((c) => c !== "npm test")) assert.ok(claude.includes(cmd), `CLAUDE.md Gates lacks: ${cmd}`);
});

test("the audit brief lists no area path that does not exist", () => {
  const dead = [];
  for (const line of read(`${R7}/audit/BRIEF.md`).split("\n").filter((l) => l.startsWith("**Paths:**"))) {
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      const p = m[1].replace(/\/?\*.*$/, "").replace(/\/$/, "");
      if (!/^(server|src|shared|scripts|data|evals|infra|public|art|tests|docs|db|context)\//.test(p) || /[<>]/.test(p)) continue;
      const dir = p.slice(0, p.lastIndexOf("/"));
      if (!has(p) && !(m[1].includes("*") && existsSync(join(ROOT, dir)) && readdirSync(join(ROOT, dir)).some((f) => f.startsWith(p.split("/").pop())))) dead.push(p);
    }
  }
  assert.deepEqual(dead, []);
});

test("the archive proposal lists only media, and nothing from round 7, the handoff or the kept teacher material", () => {
  const list = read("docs/ARCHIVE-remove.txt").split("\n").filter(Boolean);
  assert.ok(list.length > 0);
  const media = /\.(png|jpe?g|webp|gif|wav|pcm|mp3|ogg|opus|m4a|mp4|webm|mov|glb|gz|xz|tar|zip)$/i;
  assert.deepEqual(list.filter((f) => !media.test(f)), [], "a non-media file is on the removal list");
  assert.deepEqual(list.filter((f) => !f.startsWith("docs/") || /^docs\/(design\/round7|handoff)\//.test(f)), []);
  assert.deepEqual(list.filter((f) => f.startsWith("docs/design/teacher/") && !/\/puppet2d\/judge-r[3-7]\//.test(f)), []);
  assert.match(read("docs/ARCHIVE.md"), /This is a proposal\. Nothing has been moved or deleted\./);
});
