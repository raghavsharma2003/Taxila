// Round 7, stream G (platform-staging-env): the plan for the persistent staging app, as data. PURE (no ARM, no env
// reads): scripts/staging.mjs resolves `{env:NAME}` placeholders from .env.local only when it applies, so a plan never
// carries a secret or a URL.
//
// Staging = a copy of taxila-web that can never touch production data:
//   - TAXILA_DB=test, and DATABASE_URL itself re-pointed at the TEST branch (CONDUCTOR_TEST_DATABASE_URL), and
//     DATABASE_URL_DIRECT removed: code that reads DATABASE_URL directly (it exists) still lands on TEST. With
//     deploy-azure's --create, only secrets the new env references are copied, so production's database URL is not
//     even stored on the staging app;
//   - chat on the southindia account (TEST chat already routes there: dc-r143), keys from *_SIN;
//   - the owner cohort flags carried from taxila-web, TAXILA_DUPLEX=on (hands-free default), TAXILA_STAGING=1;
//   - its own worker (taxila-staging-worker) on the TEST database with NO scheduled jobs (a staging canary must never
//     page the owner), copying taxila-staging's env (deploy-worker --web), never taxila-web's.

export const STAGING_APP = "taxila-staging";
export const STAGING_WORKER = "taxila-staging-worker";

/** .env.local names the apply step needs (values never printed). */
export const STAGING_NEEDS = ["CONDUCTOR_TEST_DATABASE_URL", "AZURE_OPENAI_ENDPOINT_SIN", "AZURE_OPENAI_API_KEY_SIN", "AZURE_SP_CLIENT_ID", "AZURE_SP_SECRET", "AZURE_TENANT_ID"];

/**
 * @param {{ sha: string, create?: boolean, envName?: string }} o  sha: the 40-hex commit (images taxila-web:<sha7> and
 *   taxila-worker:<sha7> are built if missing); create: the app does not exist yet; envName: its managed environment
 *   (default: taxila-web's, resolved at apply)
 * @returns {{ id: string, title: string, kind: "cmd"|"fn", argv?: string[] }[]}
 */
export function stagingPlan({ sha, create = false, envName = "{web-env}" }) {
  if (!/^[0-9a-f]{40}$/.test(String(sha))) throw new Error(`staging: a full 40-hex commit sha, got ${sha}`);
  const s7 = sha.slice(0, 7);
  const web = ["scripts/deploy-azure.mjs", "--app", STAGING_APP, ...(create ? ["--create", "--env", envName] : []), "--image-tag", s7,
    "--set", "TAXILA_DB=test",
    "--secret", "DATABASE_URL=CONDUCTOR_TEST_DATABASE_URL",
    "--secret", "CONDUCTOR_TEST_DATABASE_URL=CONDUCTOR_TEST_DATABASE_URL",
    "--set", "DATABASE_URL_DIRECT=",
    "--set", "AZURE_OPENAI_ENDPOINT_CHAT={env:AZURE_OPENAI_ENDPOINT_SIN}",
    "--secret", "AZURE_OPENAI_API_KEY_CHAT=AZURE_OPENAI_API_KEY_SIN",
    "--set", "TAXILA_DUPLEX=on",
    "--set", "TAXILA_STAGING=1"];
  return [
    { id: "preflight", title: "CONDUCTOR_TEST_DATABASE_URL is set and is NOT the production host; the *_SIN chat vars are set", kind: "fn" },
    { id: "evidence", title: `gate evidence for ${s7} (CI build + every shard, or a clean local stamp)`, kind: "fn" },
    { id: "images", title: `ACR: taxila-web:${s7} and taxila-worker:${s7} at the commit (skipped when release.mjs already built them)`, kind: "fn" },
    { id: "web", title: `${create ? "create" : "update"} ${STAGING_APP}: canary revision on the TEST database, smoke, then 100%`, kind: "cmd", argv: web },
    { id: "verify", title: `${STAGING_APP}'s live revision reads TAXILA_DB=test and DATABASE_URL from its own TEST secret`, kind: "fn" },
    { id: "worker", title: `${STAGING_WORKER} on the TEST database (env copied from ${STAGING_APP}, no scheduled jobs)`, kind: "cmd",
      argv: ["scripts/deploy-worker.mjs", "--app", STAGING_WORKER, "--web", STAGING_APP, "--db", "test", "--image-tag", s7] },
  ];
}

/** Replace `{env:NAME}` placeholders in an argv from `env` (apply time only). Throws on a missing name. PURE. */
export function resolveArgv(argv, env) {
  return argv.map((a) => a.replace(/\{env:([A-Z0-9_]+)\}/g, (_, k) => { if (!env[k]) throw new Error(`${k} is not set in .env.local`); return env[k]; }));
}
