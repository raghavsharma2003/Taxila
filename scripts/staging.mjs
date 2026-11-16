// The persistent staging app (round 7, stream G: platform-staging-env). What it is and why: scripts/staging-core.mjs.
//
//   node scripts/staging.mjs <rev>                   the plan (default): every command, nothing created, no Azure call
//   node scripts/staging.mjs <rev> --apply [--create] [--env NAME] [--skip-images]
//                                                    run it. --create the first time (the app does not exist yet);
//                                                    --env the managed environment (default: taxila-web's). A re-run
//                                                    resumes at the first step not done (state per commit).
// Creating it is a cost decision (~$40/mo at one 1-vCPU replica, plus the worker): the owner's yes comes first, through
// main. Never prints a secret or a connection string (placeholders resolve from .env.local in memory only).
import { createHash } from "crypto";
import { execFileSync, spawnSync } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { ROOT, acrBuild, arm, loadEnv } from "../infra/azure.mjs";
import { REPO, gateEvidence } from "../infra/gate.mjs";
import { runSteps } from "./release-core.mjs";
import { STAGING_APP, STAGING_NEEDS, resolveArgv, stagingPlan } from "./staging-core.mjs";

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const rev = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--env");
if (!rev) { console.error("usage: node scripts/staging.mjs <commit> [--apply [--create] [--env NAME] [--skip-images]]"); process.exit(2); }
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
let sha;
try { sha = git("rev-parse", "--verify", `${rev}^{commit}`); } catch { console.error(`staging: ${rev} is not a commit here`); process.exit(2); }
const s7 = sha.slice(0, 7), API = "api-version=2024-03-01";
const hostHash = (u) => { try { return createHash("sha256").update(new URL(u).hostname).digest("hex").slice(0, 16); } catch { return null; } };

let envName = opt("--env");
const steps = stagingPlan({ sha, create: flag("--create"), envName: envName ?? "{web-env}" });

if (!flag("--apply")) {
  console.log(`staging plan for ${s7} (${git("log", "-1", "--format=%s", sha).slice(0, 80)})${flag("--create") ? ", creating the app" : ""}`);
  steps.forEach((st, k) => console.log(`${String(k + 1).padStart(2)}. ${st.id.padEnd(9)} ${st.title}${st.argv ? `\n              node ${st.argv.join(" ")}` : ""}`));
  console.log(`needs in .env.local: ${STAGING_NEEDS.join(", ")} (present here: ${STAGING_NEEDS.filter((k) => process.env[k]).length}/${STAGING_NEEDS.length})`);
  console.log("cost: one 1-vCPU/2Gi replica always on + a 0.5-vCPU worker (owner decision, via main). Nothing ran.");
  process.exit(0);
}

const DIR = ROOT + "node_modules/.cache/staging/";
const STATE = `${DIR}${sha}.json`;
const state = (() => { try { return JSON.parse(readFileSync(STATE, "utf8")); } catch { return { sha, steps: {} }; } })();
const save = (s) => { mkdirSync(DIR, { recursive: true }); writeFileSync(STATE, JSON.stringify(s, null, 1)); };

const fn = {
  preflight() {
    const missing = STAGING_NEEDS.filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`missing in .env.local: ${missing.join(", ")}`);
    const test = hostHash(process.env.CONDUCTOR_TEST_DATABASE_URL), prod = [process.env.DATABASE_URL, process.env.DATABASE_URL_DIRECT].filter(Boolean).map(hostHash);
    if (!test) throw new Error("CONDUCTOR_TEST_DATABASE_URL is not a URL");
    if (prod.includes(test)) throw new Error("CONDUCTOR_TEST_DATABASE_URL is the PRODUCTION host: staging never runs on it");
    console.log(`  TEST database host sha256[0:16] ${test} (must be the shared TEST branch)`);
    return { testHost: test };
  },
  async evidence() {
    const ev = await gateEvidence(sha);
    if (!ev) throw new Error(`no passing gate for ${s7}`);
    return { evidence: ev };
  },
  async images() {
    if (flag("--skip-images")) return { skipped: true };
    for (const [image, dockerfile] of [[`taxila-web:${s7}`, "Dockerfile"], [`taxila-worker:${s7}`, "Dockerfile.worker"]]) {
      console.log(`  building ${image} from ${REPO}@${s7}…`);
      await acrBuild({ images: [image], dockerfile, git: { repo: REPO, branch: sha } });
    }
    return { images: [`taxila-web:${s7}`, `taxila-worker:${s7}`] };
  },
  async verify() {
    const a = await arm("GET", `/providers/Microsoft.App/containerApps/${STAGING_APP}?${API}`);
    const tr = [...(a.properties.configuration.ingress?.traffic || [])].sort((x, y) => y.weight - x.weight);
    const r = await arm("GET", `/providers/Microsoft.App/containerApps/${STAGING_APP}/revisions/${tr[0]?.revisionName || a.properties.latestReadyRevisionName}?${API}`);
    const env = Object.fromEntries((r.properties.template.containers[0].env || []).map((e) => [e.name, e]));
    if (env.TAXILA_DB?.value !== "test") throw new Error(`${STAGING_APP} live revision has TAXILA_DB=${env.TAXILA_DB?.value ?? "unset"}`);
    // the strongest check: the secret DATABASE_URL actually reads, on the staging app itself, is the TEST host
    const secrets = (await arm("POST", `/providers/Microsoft.App/containerApps/${STAGING_APP}/listSecrets?${API}`)).value || [];
    const dbHost = hostHash(secrets.find((x) => x.name === env.DATABASE_URL?.secretRef)?.value);
    const prod = [process.env.DATABASE_URL, process.env.DATABASE_URL_DIRECT].filter(Boolean).map(hostHash);
    if (!dbHost || dbHost !== state.steps.preflight?.data?.testHost || prod.includes(dbHost)) throw new Error(`${STAGING_APP} DATABASE_URL is not the TEST host (sha256[0:16] ${dbHost ?? "none"}): roll it back now`);
    if (env.DATABASE_URL_DIRECT) throw new Error(`${STAGING_APP} still carries DATABASE_URL_DIRECT`);
    console.log(`  ${STAGING_APP}: https://${a.properties.configuration.ingress.fqdn} (TAXILA_DB=test)`);
    return { fqdn: a.properties.configuration.ingress.fqdn };
  },
};

if (flag("--create") && !envName) {
  const web = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
  envName = String(web.properties.managedEnvironmentId ?? web.properties.environmentId).split("/").pop();
}
const live = stagingPlan({ sha, create: flag("--create"), envName: envName ?? "{web-env}" });
const cmd = (args) => {
  const real = resolveArgv(args, process.env);
  console.log(`  $ node ${args.join(" ")}`);   // the placeholder form: never the resolved values
  return spawnSync(process.execPath, real, { cwd: ROOT, stdio: "inherit", env: process.env }).status ?? 1;
};
const r = await runSteps({ steps: live, state, exec: { cmd, fn }, save, log: console.log });
console.log(r.ok ? `staging is on ${s7}${state.steps.verify?.data?.fqdn ? `: https://${state.steps.verify.data.fqdn}` : ""}` : `STAGING STOPPED at ${r.failed}: ${r.error} (re-run to resume)`);
process.exit(r.ok ? 0 : 1);

