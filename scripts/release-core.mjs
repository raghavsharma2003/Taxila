// Round 7, stream G (platform-release-pipeline): the logic of scripts/release.mjs, free of ARM, git and process state, so
// the plan, the resume and the rollback can be tested with a fake executor (tests/release.test.mjs).
//
// A release of ONE commit, in this order (each step recorded in a state file as it completes, so a re-run after a
// transient failure resumes at the first step not done, never repeats a finished one):
//   evidence  CI (every shard) or a clean local gate stamp for the commit           infra/gate.mjs gateEvidence
//   freeze    not inside the X37 window (18:00-21:30 IST) unless --force
//   capture   what is live now: web current revision + its env names, the worker's image (the rollback target)
//   images    ACR builds taxila-web:<sha7> and taxila-worker:<sha7> from GitHub AT THE COMMIT (not a branch tip)
//   migrate   scripts/migrate.mjs --prod --sha <sha> with a backup (or --job for a VNet database)
//   web       scripts/deploy-azure.mjs --image-tag <sha7>: canary revision, smoke on it, then 100%
//   cohort    every env name the previous web revision carried is on the new one (cohort switches survive a deploy)
//   worker    scripts/deploy-worker.mjs --image-tag <sha7> --jobs: worker + both Conductor jobs on the same commit
//   record    a context/inbox entry for the release
// Rollback (--rollback): web traffic back to the revision `capture` recorded (deploy-azure --rollback --to <it>), then
// the worker and jobs back to the captured image tag, together.
// The freeze step is the release's one freeze check: the web and worker steps carry --force, so a release that crosses
// 18:00 IST between them finishes instead of stopping with the web new and the worker old (PLAT-22).
import { LATEST_EVIDENCE } from "./deploy-core.mjs";

export const STEPS = ["evidence", "freeze", "capture", "images", "migrate", "web", "cohort", "worker", "record"];

/**
 * The steps of a release, as data. `cmd` steps run a repo script (argv after `node`); `fn` steps run in-process.
 * @param {{ sha: string, migrate?: "neon"|"job"|"skip", backup?: string, force?: boolean }} o
 * @returns {{ id: string, title: string, kind: "cmd"|"fn", argv?: string[] }[]}
 */
export function planRelease({ sha, migrate = "neon", backup, force = false, set = [] }) {
  if (!/^[0-9a-f]{40}$/.test(String(sha))) throw new Error(`release: a full 40-hex commit sha, got ${sha}`);
  for (const kv of set) if (!/^[A-Z][A-Z0-9_]*=/.test(kv)) throw new Error(`release --set ${kv}: expected NAME=VALUE`);
  const sets = set.flatMap((kv) => ["--set", kv]);
  const s7 = sha.slice(0, 7);
  // --migrate job (a private in-VNet database): the job's own report is the migrations evidence both deploys need (PLAT-21);
  // its backup is the database's point-in-time restore, said on the record with --no-backup (PLAT-18)
  const evidence = migrate === "job" ? ["--migrations-evidence", LATEST_EVIDENCE("apply")] : [];
  const mig = migrate === "skip" ? null
    : migrate === "job" ? ["scripts/migrate.mjs", "--prod", "--job", "--no-backup", "--sha", sha]
    : ["scripts/migrate.mjs", "--prod", "--sha", sha, "--backup", backup || `pre-release-${s7}`];
  return [
    { id: "evidence", title: `gate evidence for ${s7} (CI: build + every shard, or a clean local stamp)`, kind: "fn" },
    { id: "freeze", title: force ? "X37 freeze window: --force, not checked" : "outside the X37 freeze (18:00-21:30 IST)", kind: "fn" },
    { id: "capture", title: `record what is live (web current revision + env names, worker image): the rollback target${needsFor(set).length ? `; refuse unless the live web carries ${needsFor(set).map((g) => g.join(" or ")).join(" and ")}` : ""}`, kind: "fn" },
    { id: "images", title: `ACR: taxila-web:${s7} and taxila-worker:${s7} from GitHub at ${s7}`, kind: "fn" },
    mig ? { id: "migrate", title: `production migrations of ${s7}${migrate === "job" ? " (in-VNet job)" : `, Neon backup branch first`}`, kind: "cmd", argv: mig }
      : { id: "migrate", title: "migrations: --migrate skip (the target already has every file; deploy-azure's migrations gate still checks)", kind: "fn" },
    { id: "web", title: `web: canary revision of taxila-web:${s7}, smoke, then 100%${set.length ? `; settings ${set.join(" ")}` : ""}`, kind: "cmd", argv: ["scripts/deploy-azure.mjs", "--image-tag", s7, "--force", ...evidence, ...sets] },
    { id: "cohort", title: `the new web revision carries every env name the previous one did${set.length ? `, and ${set.map((kv) => kv.split("=")[0]).join(", ")} took the new value` : ""}`, kind: "fn" },
    { id: "worker", title: `worker + canary/nightly jobs on taxila-worker:${s7}`, kind: "cmd", argv: ["scripts/deploy-worker.mjs", "--image-tag", s7, "--jobs", "--force", ...evidence] },
    { id: "record", title: `context/inbox entry for the release of ${s7}`, kind: "fn" },
  ];
}

/**
 * Run the steps in order, skipping those the state records as done, saving the state after each. Stops at the first
 * failure (a cmd's non-zero exit, a fn's throw) and returns where it stopped; never runs a later step after a failure.
 * @param {{ steps: ReturnType<typeof planRelease>, state: { steps?: Record<string, any> }, exec: { cmd: (argv: string[]) => Promise<number>|number, fn: Record<string, (state: any) => any> },
 *   save?: (state: any) => void, log?: (s: string) => void, now?: () => string }} o
 * @returns {Promise<{ ok: boolean, ran: string[], skipped: string[], failed?: string, error?: string }>}
 */
export async function runSteps({ steps, state, exec, save = () => {}, log = () => {}, now = () => new Date().toISOString() }) {
  state.steps ??= {};
  const ran = [], skipped = [];
  for (const st of steps) {
    if (state.steps[st.id]?.done) { skipped.push(st.id); log(`= ${st.id}: done ${state.steps[st.id].at} (resume skips it)`); continue; }
    log(`> ${st.id}: ${st.title}`);
    try {
      let data;
      if (st.kind === "cmd") {
        const code = await exec.cmd(st.argv);
        if (code !== 0) throw new Error(`node ${st.argv.join(" ")} exited ${code}`);
      } else {
        const f = exec.fn[st.id];
        if (!f) throw new Error(`no in-process step ${st.id}`);
        data = await f(state);
      }
      state.steps[st.id] = { done: true, at: now(), ...(data && typeof data === "object" ? { data } : {}) };
      save(state);
      ran.push(st.id);
    } catch (e) {
      state.steps[st.id] = { done: false, at: now(), error: String(e?.message ?? e).slice(0, 400) };
      save(state);
      log(`! ${st.id} FAILED: ${e?.message ?? e}`);
      return { ok: false, ran, skipped, failed: st.id, error: String(e?.message ?? e) };
    }
  }
  return { ok: true, ran, skipped };
}

/**
 * Env a deploy setting depends on (PURE): groups of names, one of each group must be on the web template BEFORE the
 * release turns the setting on. TAXILA_DUPLEX on (not off / 0 / false / shadow) needs Voice Live's endpoint and key
 * (server/duplex/voicelive.js voiceLiveConfig): without them every lesson would start in a lane that cannot open.
 * @param {string[]} set NAME=VALUE pairs @returns {string[][]}
 */
export function needsFor(set = []) {
  const v = Object.fromEntries(set.map((kv) => { const i = kv.indexOf("="); return [kv.slice(0, i), kv.slice(i + 1)]; }));
  const out = [];
  if ("TAXILA_DUPLEX" in v && !["0", "off", "false", "shadow"].includes(String(v.TAXILA_DUPLEX).trim().toLowerCase())) {
    out.push(["TAXILA_VOICELIVE_ENDPOINT", "AZURE_AI_CENTRALINDIA_ENDPOINT"], ["TAXILA_VOICELIVE_KEY", "AZURE_AI_CENTRALINDIA_KEY"]);
  }
  return out;
}
/** The groups of `needs` that `names` does not satisfy (PURE). */
export const unmet = (needs, names) => needs.filter((g) => !g.some((n) => names.includes(n)));

/**
 * Env names the previous web revision had and the new one lacks (PURE). Cohort switches (TAXILA_UI_KAKSHA,
 * DUPLEX_LIVE_FOR, TRACE_FULL_FOR, TAXILA_ACK_CONTINUER_FOR, …) live only on the live template; a deploy that drops one
 * silently turns a feature off for its cohort. `dropped` names a release meant to remove.
 * @param {string[]} before @param {string[]} after @param {string[]} [dropped]
 */
export function envDropped(before, after, dropped = []) {
  const have = new Set(after), ok = new Set(dropped);
  return [...new Set(before)].filter((n) => !have.has(n) && !ok.has(n)).sort();
}

/** The X37 freeze: 18:00-21:30 IST (peak lessons). PURE. @param {Date} d */
export function inFreeze(d) {
  const ist = new Date(d.getTime() + 330 * 60_000);
  const m = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return m >= 18 * 60 && m < 21 * 60 + 30;
}

/**
 * The rollback, as data: web traffic to `previous`, then the worker and jobs to the image captured before the release.
 * @param {{ capture?: { workerTag?: string } }} data the `capture` step's data from the release state
 */
export function planRollback(data) {
  const tag = data?.capture?.workerTag, rev = data?.capture?.webRevision;
  if (!tag) throw new Error("rollback: the release state has no captured worker image (the release never got past capture)");
  if (!/^[0-9a-f]{7,40}$/.test(tag)) throw new Error(`rollback: the captured worker image tag ${tag} is not a commit sha: roll the worker by hand`);
  return [
    // the captured revision, never the label alone: a failed deploy can leave no `previous` label (PLAT-03)
    { id: "web", title: rev ? `web: 100% back to ${rev}, the revision live before the release` : "web: 100% back to the `previous` revision",
      kind: "cmd", argv: ["scripts/deploy-azure.mjs", "--rollback", ...(rev ? ["--to", rev] : [])] },
    // --served: the image already ran in production, so no fresh gate stamp is asked for (PLAT-28)
    { id: "worker", title: `worker + jobs back to taxila-worker:${tag}`, kind: "cmd", argv: ["scripts/deploy-worker.mjs", "--image-tag", tag, "--jobs", "--force", "--served"] },
  ];
}
