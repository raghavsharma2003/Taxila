// The release gate shared by the deploy scripts (BUILD-PLAN §1.1, §1.9; W1-D item 1): a deploy of sha S is refused
// unless the gates passed on S. Evidence is a local stamp written by runGates() on a CLEAN tree, or a successful
// `gates` check run on GitHub for S (.github/workflows/gates.yml). Whichever evidence is used, the deploy scripts ALSO
// call migrationsGate() against the TARGET database right before they create a revision: the CI run has no production
// DATABASE_URL, so its `migrations-applied` test skips there; this check is what makes "gate migrations-applied"
// hold on every path (W1-D fixer review).
import { execSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { ROOT } from "./azure.mjs";

export const REPO = "raghavsharma2003/Taxila";
export const STAMPS = ROOT + "node_modules/.cache/taxila-gate/";
/** The gate commands, in order; each must exit 0 (CLAUDE.md "Gates"; BUILD-PLAN §1.1). */
export const GATE_CMDS = ["npx tsc -b", "npx vite build", "npm test", "node scripts/check-prompt-budget.mjs"];

const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
export const headSha = () => sh("git rev-parse HEAD");
export const branchName = () => sh("git rev-parse --abbrev-ref HEAD");

/** A dirty-tree run is stamped `<sha>-dirty`: it proves nothing about the sha and must never shadow its real evidence. */
export function writeStamp(sha, body) {
  mkdirSync(STAMPS, { recursive: true });
  const key = body.dirty ? `${sha}-dirty` : sha;
  writeFileSync(`${STAMPS}${key}.json`, JSON.stringify({ sha, at: new Date().toISOString(), ...body }, null, 1));
}

/**
 * Tracked changes AND untracked, non-ignored files: the build would import an untracked file locally that ACR's
 * GitHub build never sees, so a "clean" pass must not count it (W1-D fixer review: the tree held untracked
 * src/avatar/*.ts the build imported).
 */
export const treeDirt = () => sh("git status --porcelain --untracked-files=all");

/**
 * Run every gate on the working tree; it must be the committed tree (tracked files clean) so the stamp attests to
 * exactly `sha`. Throws on the first failure (and stamps the failure, so a later deploy of that sha is refused).
 * @param {string} sha @param {{ cmds?: string[], allowDirty?: boolean }} [o]
 */
export function runGates(sha, { cmds = GATE_CMDS, allowDirty = false } = {}) {
  const dirty = treeDirt();
  if (dirty && !allowDirty) throw new Error(`refusing to gate a dirty tree (uncommitted or untracked files):\n${dirty.split("\n").slice(0, 10).join("\n")}`);
  const results = [];
  for (const cmd of cmds) {
    const s = Date.now();
    console.log(`gate: ${cmd}`);
    // 60 min per command (was 25): release 9's one-process npm test finished all 3,026 tests green at 1,520 s and was
    // SIGTERMed by the old 1,500 s cap twice (context ms-r4-gate-timeout). Still a cap, so a hung test cannot hold a release.
    const r = spawnSync("bash", ["-lc", cmd], { cwd: ROOT, stdio: "inherit", timeout: 3_600_000, env: { ...process.env, CI: "1" } });
    results.push({ cmd, code: r.status, signal: r.signal, s: Math.round((Date.now() - s) / 1000) });
    if (r.status !== 0) {
      writeStamp(sha, { pass: false, dirty: !!dirty, results });
      throw new Error(`gate FAILED: \`${cmd}\` exited ${r.status ?? r.signal}. Refusing to deploy ${sha.slice(0, 7)}.`);
    }
  }
  // a dirty-tree run proves nothing about the sha: recorded, never accepted as deploy evidence
  writeStamp(sha, { pass: !dirty, dirty: !!dirty, results });
  console.log(`gate: PASS for ${sha.slice(0, 7)}${dirty ? " (DIRTY tree: not accepted as deploy evidence)" : ""}`);
  return results;
}

/** → a description of the passing evidence for `sha`, or null (a failed CLEAN-tree stamp wins over everything). */
export async function gateEvidence(sha) {
  const f = `${STAMPS}${sha}.json`;
  if (existsSync(f)) {
    const s = JSON.parse(readFileSync(f, "utf8"));
    if (s.sha === sha && s.pass === true && !s.dirty) return `local gate stamp ${s.at}`;
    if (s.pass === false && !s.dirty) return null;
  }
  try {
    const out = spawnSync("gh", ["api", `repos/${REPO}/commits/${sha}/check-runs`, "--jq", '.check_runs[] | select(.name=="gates") | .conclusion'], { encoding: "utf8", timeout: 30_000 });
    if (out.status === 0 && out.stdout.split("\n").includes("success")) return "GitHub Actions gates: success";
  } catch { /* no gh: local stamp only */ }
  return null;
}

/**
 * Refuse a deploy whose code expects migrations the target database lacks. `sha`'s own db/migrations listing (git
 * ls-tree), not the working tree's, so an --image-tag deploy of an older sha is checked against what that sha ships.
 * @param {string} url the TARGET database (taxila-web's DATABASE_URL secret; the worker's direct URL)
 * @param {string} sha @returns {Promise<string[]>} applied-check result: [] or throws
 */
export async function migrationsGate(url, sha) {
  if (!url) throw new Error("migrations gate: no target database url; refusing to deploy");
  const files = sh(`git ls-tree --name-only ${sha} db/migrations/`).split("\n").map((f) => f.split("/").pop()).filter((f) => f.endsWith(".sql")).sort();
  if (!files.length) throw new Error(`migrations gate: no db/migrations in ${sha.slice(0, 7)}`);
  const { neon } = await import("@neondatabase/serverless");
  const have = new Set((await neon(url).query("select name from schema_migrations")).map((r) => r.name));
  const missing = files.filter((f) => !have.has(f));
  if (missing.length) throw new Error(`migrations gate: the target database lacks ${missing.join(", ")} (node scripts/migrate.mjs against it first). Refusing to deploy ${sha.slice(0, 7)}.`);
  return missing;
}

/**
 * The commit an image tag names: a 7-40 char hex prefix that resolves to exactly one commit (`git rev-parse`).
 * null for anything else (local-*, <sha>-local-*, latest, a hand-made tag): such an image has no gate to check, so it is refused.
 */
export function shaOfTag(tag) {
  // exact sha prefix only: `<sha>-local-…` images are built from a working tree, not from the commit
  const m = /^([0-9a-f]{7,40})$/.exec(String(tag || ""));
  if (!m) return null;
  try { return sh(`git rev-parse --verify --quiet ${m[1]}^{commit}`) || null; } catch { return null; }
}
