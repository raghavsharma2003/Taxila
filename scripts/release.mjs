// One release command (round 7, stream G: platform-release-pipeline). The steps and why: scripts/release-core.mjs.
//
//   node scripts/release.mjs <rev> --plan            print the steps for that commit (and what a resume would skip);
//                                                    no Azure, no database, no build
//   node scripts/release.mjs <rev>                   run them; a re-run resumes at the first step not done
//   flags: --migrate neon|job|skip (default neon: Neon over HTTP with a backup branch; job: the in-VNet ACA job for
//          Azure PG; skip: the target already has every file) · --backup NAME (default pre-release-<sha7>) ·
//          --force (inside the X37 freeze) · --allow-drop A,B (env names this release removes from the web on purpose) ·
//          --restart (forget the recorded progress for this commit and start from the first step) ·
//          --set NAME=VALUE (repeatable; a plain env setting the new web revision gets, e.g. TAXILA_DUPLEX=on: checked
//          against what it needs BEFORE anything deploys, and read back from the new revision after)
//   node scripts/release.mjs <rev> --rollback [--plan]  web back to `previous` and the worker + jobs back to the image
//                                                    captured before this release, together
// State: node_modules/.cache/release/<sha>.json. Needs the Azure service principal (.env.local) except for --plan.
// Never prints a secret or a connection string (the child scripts don't either).
import { execFileSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { ROOT, acrBuild, arm, loadEnv } from "../infra/azure.mjs";
import { REPO, gateEvidence } from "../infra/gate.mjs";
import { envDropped, inFreeze, needsFor, planRelease, planRollback, runSteps, unmet } from "./release-core.mjs";

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const rev = argv.find((a, i) => !a.startsWith("--") && !["--migrate", "--backup", "--allow-drop", "--set"].includes(argv[i - 1]));
const SET = argv.flatMap((a, i) => (a === "--set" && argv[i + 1] ? [argv[i + 1]] : []));
if (!rev) { console.error("usage: node scripts/release.mjs <commit> [--plan] [--rollback] [--migrate neon|job|skip] [--backup NAME] [--force] [--allow-drop A,B] [--restart]"); process.exit(2); }
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
let sha;
try { sha = git("rev-parse", "--verify", `${rev}^{commit}`); } catch { console.error(`release: ${rev} is not a commit here (git fetch first?)`); process.exit(2); }
const s7 = sha.slice(0, 7);
const PLAN = flag("--plan"), ROLLBACK = flag("--rollback"), FORCE = flag("--force");
const MIGRATE = opt("--migrate", "neon");
if (!["neon", "job", "skip"].includes(MIGRATE)) { console.error("--migrate: neon, job or skip"); process.exit(2); }
const API = "api-version=2024-03-01", WEB = "taxila-web", WORKER = "taxila-worker";

const DIR = ROOT + "node_modules/.cache/release/";
const STATE = `${DIR}${sha}.json`;
const load = () => { try { return JSON.parse(readFileSync(STATE, "utf8")); } catch { return { sha, created: new Date().toISOString(), steps: {} }; } };
const save = (s) => { mkdirSync(DIR, { recursive: true }); writeFileSync(STATE, JSON.stringify(s, null, 1)); };
let state = flag("--restart") && !ROLLBACK ? { sha, created: new Date().toISOString(), steps: {} } : load();

let steps;
try { steps = ROLLBACK ? planRollback({ capture: state.steps?.capture?.data }) : planRelease({ sha, migrate: MIGRATE, backup: opt("--backup"), force: FORCE, set: SET }); }
catch (e) { console.error(`release: ${e.message}`); process.exit(2); }

if (PLAN) {
  console.log(`release ${ROLLBACK ? "ROLLBACK " : ""}${s7} (${git("log", "-1", "--format=%s", sha).slice(0, 90)})`);
  console.log(`state: ${existsSync(STATE) ? STATE.replace(ROOT, "") : "none yet (a fresh release)"}`);
  const book = ROLLBACK ? state.rollback ?? {} : state.steps ?? {};
  steps.forEach((st, k) => {
    const done = book[st.id]?.done ? `  [done ${book[st.id].at}: a resume skips it]` : book[st.id]?.error ? `  [FAILED last time: ${book[st.id].error.slice(0, 100)}]` : "";
    console.log(`${String(k + 1).padStart(2)}. ${st.id.padEnd(8)} ${st.title}${st.argv ? `\n             node ${st.argv.join(" ")}` : ""}${done}`);
  });
  if (!ROLLBACK) console.log(`rollback after this: node scripts/release.mjs ${s7} --rollback (web → previous, worker + jobs → the captured image)`);
  process.exit(0);
}

// ───────────── the in-process steps ─────────────
const app = (name) => arm("GET", `/providers/Microsoft.App/containerApps/${name}?${API}`, undefined, { allow404: true });
async function webCurrent() {
  const a = await app(WEB);
  if (!a) throw new Error(`${WEB} not found`);
  const tr = [...(a.properties.configuration.ingress?.traffic || [])].filter((t) => t.revisionName).sort((x, y) => y.weight - x.weight);
  const name = tr[0]?.revisionName || a.properties.latestReadyRevisionName;
  const r = await arm("GET", `/providers/Microsoft.App/containerApps/${WEB}/revisions/${name}?${API}`);
  const c = r.properties.template.containers[0];
  const plain = Object.fromEntries((c.env || []).filter((e) => !e.secretRef).map((e) => [e.name, e.value]));
  return { revision: name, image: c.image, env: (c.env || []).map((e) => e.name).sort(), plain };
}

const fn = {
  async evidence() {
    const ev = await gateEvidence(sha);
    if (!ev) throw new Error(`no passing gate for ${s7}: CI gates (build + every shard) or a clean local stamp (node scripts/deploy-azure.mjs --gate)`);
    execFileSync("git", ["fetch", "-q", "origin"], { cwd: ROOT });
    if (!git("branch", "-r", "--contains", sha)) throw new Error(`${s7} is on no origin branch: ACR builds from GitHub, push it first`);
    return { evidence: ev };
  },
  freeze() {
    if (!FORCE && inFreeze(new Date())) throw new Error("deploy freeze 18:00-21:30 IST (X37): re-run after 21:30 (it resumes here) or pass --force");
    return { checked: !FORCE };
  },
  async capture() {
    const web = await webCurrent();
    const w = await app(WORKER);
    const workerImage = w?.properties?.template?.containers?.[0]?.image ?? null;
    const missing = unmet(needsFor(SET), web.env);
    if (missing.length) throw new Error(`--set ${SET.join(" ")} needs ${missing.map((g) => g.join(" or ")).join(" and ")} on ${WEB}, which the live revision lacks: add it first (deploy-azure --secret), nothing was deployed`);
    for (const kv of SET) console.log(`  setting ${kv} (live today: ${web.plain[kv.split("=")[0]] ?? "unset"})`);
    console.log(`  live: ${WEB} ${web.revision} (${web.image.split(":").pop()}, ${web.env.length} env names); ${WORKER} ${workerImage?.split(":").pop() ?? "none"}`);
    return { webRevision: web.revision, webImage: web.image, webEnv: web.env, workerImage, workerTag: workerImage?.split(":").pop() ?? null };
  },
  async images() {
    for (const [image, dockerfile] of [[`taxila-web:${s7}`, "Dockerfile"], [`taxila-worker:${s7}`, "Dockerfile.worker"]]) {
      console.log(`  building ${image} from ${REPO}@${s7}…`);
      await acrBuild({ images: [image], dockerfile, git: { repo: REPO, branch: sha }, ...(dockerfile === "Dockerfile" ? { buildArgs: { VITE_BUILD_SHA: s7 } } : {}) });   // git context #<commit>: the commit, not a moving tip
    }
    return { images: [`taxila-web:${s7}`, `taxila-worker:${s7}`] };
  },
  migrate() { return { skipped: true }; },
  async cohort(st) {
    const before = st.steps.capture?.data?.webEnv ?? [];
    const now = await webCurrent();
    if (!now.image.endsWith(`:${s7}`)) throw new Error(`${WEB} current revision ${now.revision} runs ${now.image.split(":").pop()}, not ${s7}`);
    const lost = envDropped(before, now.env, (opt("--allow-drop", "") || "").split(",").filter(Boolean));
    if (lost.length) throw new Error(`the new web revision lacks env ${lost.join(", ")} that ${st.steps.capture.data.webRevision} carried (cohort switches off?). Fix the template, or roll back: node scripts/release.mjs ${s7} --rollback`);
    for (const kv of SET) {
      const [k, ...v] = kv.split("=");
      if ((now.plain[k] ?? "") !== v.join("=")) throw new Error(`${WEB} ${now.revision} has ${k}=${now.plain[k] ?? "unset"}, not ${v.join("=")}. Roll back: node scripts/release.mjs ${s7} --rollback`);
    }
    return { revision: now.revision, envNames: now.env.length, set: SET };
  },
  record(st) {
    const d = (id) => st.steps[id]?.data ?? {};
    const file = `${ROOT}context/inbox/release-${s7}.json`;
    const node = { id: `ms-release-${s7}`, kind: "measurement", at: new Date().toISOString().slice(0, 10),
      title: `Released ${s7} with scripts/release.mjs: web ${d("cohort").revision} (was ${d("capture").webRevision}), worker + canary/nightly jobs on taxila-worker:${s7} (was ${d("capture").workerTag}); evidence ${d("evidence").evidence}; migrations ${MIGRATE}. Rollback: node scripts/release.mjs ${s7} --rollback.` };
    writeFileSync(file, JSON.stringify({ nodes: [node], edges: [] }, null, 2) + "\n");
    console.log(`  ${file.replace(ROOT, "")} (commit it with the next change)`);
    return { file: file.replace(ROOT, "") };
  },
};

const cmd = (args) => {
  console.log(`  $ node ${args.join(" ")}`);
  return spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit", env: process.env }).status ?? 1;
};

const t0 = Date.now();
if (ROLLBACK) {
  const rb = { steps: state.rollback ?? {} };
  const r = await runSteps({ steps, state: rb, exec: { cmd, fn: {} }, save: (s) => { state.rollback = s.steps; save(state); }, log: console.log });
  console.log(r.ok ? `rolled back ${s7}: web on ${state.steps.capture?.data?.webRevision ?? "previous"}, worker + jobs on ${state.steps.capture.data.workerTag} (${Math.round((Date.now() - t0) / 1000)} s)` : `ROLLBACK STOPPED at ${r.failed}: ${r.error}`);
  process.exit(r.ok ? 0 : 1);
}
const r = await runSteps({ steps, state, exec: { cmd, fn }, save, log: console.log });
console.log(r.ok ? `released ${s7} in ${Math.round((Date.now() - t0) / 1000)} s (${r.ran.length} steps run, ${r.skipped.length} resumed past)`
  : `RELEASE STOPPED at ${r.failed}: ${r.error}\n  re-run \`node scripts/release.mjs ${s7}\` to resume there${["web", "cohort", "worker"].includes(r.failed) ? `, or \`node scripts/release.mjs ${s7} --rollback\` (the web goes to the revision captured before the release)` : ""}`);
process.exit(r.ok ? 0 : 1);
