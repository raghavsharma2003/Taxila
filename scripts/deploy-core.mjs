// The deploy scripts' decisions, free of ARM, git and process state, so they can be tested (whole-project audit
// 2026-11-09, platform: tests/r7-audit-platform-deploy.test.mjs). scripts/deploy-azure.mjs, deploy-worker.mjs,
// migrate.mjs and infra/eyes.mjs run side effects at import, so what needs a test lives here. PURE: no I/O.
import { inFreeze } from "./release-core.mjs";

/**
 * The revision serving now, and the one a web rollback moves traffic to (PLAT-03).
 * `to` (deploy-azure --rollback --to REV; scripts/release.mjs passes the revision it captured) wins. Otherwise only the
 * revision labelled `previous`. There is no guess: the old fallback (the newest revision that is not current) picked the
 * revision a failed deploy had just deactivated, because that deploy's own traffic PATCH dropped the `previous` label.
 * @param {{ traffic?: { revisionName?: string, weight?: number, label?: string }[], revisions?: { name: string }[],
 *   latestReady?: string|null, to?: string|null }} o
 * @returns {{ current: string|null, previous: string|null, why?: string }}
 */
export function rollbackTarget({ traffic = [], revisions = [], latestReady = null, to = null } = {}) {
  const byWeight = traffic.filter((t) => t.revisionName).sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  const current = byWeight[0]?.revisionName || latestReady || null;
  if (to) {
    if (to === current) return { current, previous: null, why: `${to} is already serving` };
    if (revisions.length && !revisions.some((r) => r.name === to)) return { current, previous: null, why: `no revision ${to}` };
    return { current, previous: to };
  }
  const labelled = traffic.find((t) => t.label === "previous" && t.revisionName && t.revisionName !== current)?.revisionName;
  if (labelled) return { current, previous: labelled };
  return { current, previous: null, why: "no revision is labelled previous: name one with --to <revision> (scripts/release.mjs passes the one it captured)" };
}

/**
 * The directories the worker image copies (Dockerfile.worker COPY lines; deploy-worker.mjs --from-tree / --local upload
 * exactly these). PLAT-04: `src` was missing, so the nightly job's sweep (server/conductor/sweep.js → routes/account.js
 * → director/engine-check.js → src/modules/frame/engines/*.logic.ts) failed to load and trace retention never ran.
 */
export const WORKER_DIRS = Object.freeze(["server", "shared", "data", "db/migrations", "src"]);
export const WORKER_FILES = Object.freeze(["package.json", "package-lock.json", "Dockerfile.worker"]);
/** Is a repo path part of the worker image's build context? */
export const workerContextFile = (f) => WORKER_DIRS.some((d) => f.startsWith(d + "/")) || WORKER_FILES.includes(f);

/** deploy-worker --from-tree: the branch the commit must be on. Named, never a default (PLAT-60: an old session branch). */
export function fromTreeBranch(branch) {
  if (!branch || String(branch).startsWith("--")) throw new Error("--from-tree needs --branch <the origin branch that holds the commit>");
  return String(branch);
}

/**
 * Does a production worker deploy need gate evidence for its image? Not for a rollback to an image that already served
 * (PLAT-28: release --rollback moved the web back, then the worker step was refused for want of a gate stamp the old
 * image's commit had on another machine). `served` needs `imageTag`: it names an existing image, never a new build.
 */
export function workerGateNeeded({ prod, served = false, imageTag = null }) {
  if (served && !imageTag) throw new Error("--served names an image that already ran: it needs --image-tag");
  return !!prod && !served;
}

/** A private database (Azure PG inside a VNet; the sandbox cannot reach it): its migrations are checked from evidence. */
export const privateDbHost = (host) => /\.postgres\.database\.azure\.com$/i.test(String(host ?? ""));

/**
 * Check a migrations evidence report (scripts/region/db-copy.mjs --check-migrations or --apply-migrations) against the
 * target host and the sha's migration files. Throws the reason; returns [] when it holds. Shared by deploy-azure and
 * deploy-worker (PLAT-21: the worker had no evidence path, so a release with --migrate job could not finish).
 * @param {any} ev @param {{ host: string, files: string[], now?: number, sha7?: string }} o
 */
export function checkMigrationsEvidence(ev, { host, files, now = Date.now(), sha7 = "" }) {
  if (!ev || typeof ev !== "object") throw new Error("migrations gate: the evidence is not a report");
  if (ev.targetHost !== host) throw new Error(`migrations gate: evidence is for ${ev.targetHost}, the target is ${host}`);
  if (!(now - Date.parse(ev.at) < 6 * 3600_000)) throw new Error(`migrations gate: evidence from ${ev.at} is older than 6 h`);
  if (ev.ok === false) throw new Error(`migrations gate: the evidence run failed (${ev.error ?? "see its report"})`);
  const have = new Set(ev.targetMigrations || []);
  const missing = files.filter((f) => !have.has(f));
  if (missing.length) throw new Error(`migrations gate: ${host} lacks ${missing.join(", ")} (evidence ${ev.at}). Refusing to deploy ${sha7}.`);
  return [];
}
/** Where scripts/region/db-copy.mjs keeps the newest report of a mode (the evidence a release passes on). */
export const LATEST_EVIDENCE = (mode) => `node_modules/.cache/india-move/db-copy-${mode}-latest.json`;

/**
 * The X37 evening freeze for deploy-azure (PLAT-23: it had none; deploy-worker and release did). A rollback, a dry run,
 * --force and a non-production app are never refused. Returns the refusal, or null.
 */
export function webFreezeRefusal({ now = new Date(), app = "taxila-web", rollback = false, dry = false, force = false }) {
  if (rollback || dry || force || app !== "taxila-web") return null;
  return inFreeze(now) ? "deploy freeze 18:00-21:30 IST (X37): peak lessons; re-run after 21:30 or pass --force" : null;
}

/**
 * migrate.mjs --job writes the production database too (PLAT-18: it skipped the --prod / --backup check). Returns the
 * refusal, or null. A dry run only prints the job's plan.
 */
export function migrateJobRefusal({ prod = false, dry = false, backup = null, noBackup = false }) {
  if (dry) return null;
  if (!prod) return "--job applies migrations to the in-VNet production database: say so with --prod";
  if (!backup && !noBackup) return "--prod writes production: pass --backup NAME or --no-backup (Azure PG: its point-in-time restore is the backup)";
  return null;
}

/**
 * Should infra/eyes.mjs turn the worker-liveness alert on? Yes once taxila-worker exists (PLAT-26: re-running eyes
 * switched it off unless TAXILA_WORKER_LIVE=1, a name in no key list).
 */
export const workerAlertOn = ({ workerExists = false, env = {} } = {}) => !!workerExists || env.TAXILA_WORKER_LIVE === "1";
