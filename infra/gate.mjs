// The release gate shared by the deploy scripts (BUILD-PLAN §1.1, §1.9; W1-D item 1): a deploy of sha S is refused
// unless the gates passed on S. Evidence is a local stamp written by runGates() on a CLEAN tree, or a successful
// `gates` check run on GitHub for S (.github/workflows/gates.yml).
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

export function writeStamp(sha, body) {
  mkdirSync(STAMPS, { recursive: true });
  writeFileSync(`${STAMPS}${sha}.json`, JSON.stringify({ sha, at: new Date().toISOString(), ...body }, null, 1));
}

/**
 * Run every gate on the working tree; it must be the committed tree (tracked files clean) so the stamp attests to
 * exactly `sha`. Throws on the first failure (and stamps the failure, so a later deploy of that sha is refused).
 * @param {string} sha @param {{ cmds?: string[], allowDirty?: boolean }} [o]
 */
export function runGates(sha, { cmds = GATE_CMDS, allowDirty = false } = {}) {
  const dirty = sh("git status --porcelain --untracked-files=no");
  if (dirty && !allowDirty) throw new Error(`refusing to gate a dirty tree (tracked changes not committed):\n${dirty.split("\n").slice(0, 10).join("\n")}`);
  const results = [];
  for (const cmd of cmds) {
    const s = Date.now();
    console.log(`gate: ${cmd}`);
    const r = spawnSync("bash", ["-lc", cmd], { cwd: ROOT, stdio: "inherit", timeout: 1_500_000, env: { ...process.env, CI: "1" } });
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

/** → a description of the passing evidence for `sha`, or null (a failed local stamp wins over everything). */
export async function gateEvidence(sha) {
  const f = `${STAMPS}${sha}.json`;
  if (existsSync(f)) {
    const s = JSON.parse(readFileSync(f, "utf8"));
    if (s.sha === sha && s.pass === true && !s.dirty) return `local gate stamp ${s.at}`;
    if (s.pass === false) return null;
  }
  try {
    const out = spawnSync("gh", ["api", `repos/${REPO}/commits/${sha}/check-runs`, "--jq", '.check_runs[] | select(.name=="gates") | .conclusion'], { encoding: "utf8", timeout: 30_000 });
    if (out.status === 0 && out.stdout.split("\n").includes("success")) return "GitHub Actions gates: success";
  } catch { /* no gh: local stamp only */ }
  return null;
}
