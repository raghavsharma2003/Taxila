// The India D5 relay (round 7, stream G: platform-d5-relay-in-india). What and why: scripts/region/d5-relay-core.mjs.
//
//   node scripts/region/d5-relay.mjs <rev>            the plan (default): nothing created, no Azure call
//   node scripts/region/d5-relay.mjs <rev> --apply    create/update taxila-d5-sin, wait for it, print main's production step
// Creating it is a cost decision (a 0.5-vCPU replica always on in South India) and needs the owner's yes, through main.
// The relay serves nothing until taxila-web carries TAXILA_D5_RELAY_URL (a production deploy: main's). Rollback = unset
// that one variable. Never prints a secret or a key.
import { execFileSync } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { ROOT, SUB_PATH, acrBuild, arm, loadEnv, until } from "../../infra/azure.mjs";
import { REPO, gateEvidence } from "../../infra/gate.mjs";
import { runSteps } from "../release-core.mjs";
import { RELAY_APP, RELAY_ENV, RELAY_RG, relayAppBody, relayHandoff, relayMissing, relayPlan } from "./d5-relay-core.mjs";

loadEnv();
const argv = process.argv.slice(2);
const rev = argv.find((a) => !a.startsWith("--"));
if (!rev) { console.error("usage: node scripts/region/d5-relay.mjs <commit> [--apply]"); process.exit(2); }
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
let sha;
try { sha = git("rev-parse", "--verify", `${rev}^{commit}`); } catch { console.error(`d5-relay: ${rev} is not a commit here`); process.exit(2); }
const s7 = sha.slice(0, 7), API = "api-version=2024-03-01";
const steps = relayPlan({ sha });
const E = process.env;

if (!argv.includes("--apply")) {
  console.log(`India D5 relay plan for ${s7}`);
  steps.forEach((st, k) => console.log(`${String(k + 1).padStart(2)}. ${st.id.padEnd(9)} ${st.title}`));
  const h = relayHandoff({ sha7: s7, fqdn: "<relay fqdn>" });
  console.log(`then main (production):\n   on:  ${h.on}\n   off: ${h.off}`);
  console.log("measure before/after from the Central India probe: end-of-turn and first sound (Voice's harness).");
  const miss = relayMissing(E);
  console.log(`needs in .env.local: ${miss.length ? `MISSING ${miss.join("; ")}` : "all present"}. Nothing ran.`);
  process.exit(0);
}

const DIR = ROOT + "node_modules/.cache/d5-relay/";
const STATE = `${DIR}${sha}.json`;
const state = (() => { try { return JSON.parse(readFileSync(STATE, "utf8")); } catch { return { sha, steps: {} }; } })();
const save = (s) => { mkdirSync(DIR, { recursive: true }); writeFileSync(STATE, JSON.stringify(s, null, 1)); };
const RGP = `${SUB_PATH()}/resourceGroups/${RELAY_RG}`;
const APP_PATH = `${RGP}/providers/Microsoft.App/containerApps/${RELAY_APP}`;

const fn = {
  preflight() {
    const miss = relayMissing(E);
    if (miss.length) throw new Error(`missing in .env.local: ${miss.join("; ")}`);
    if (String(E.TAXILA_D5_TICKET_KEY).length < 32) throw new Error("TAXILA_D5_TICKET_KEY is shorter than 32 characters");
    return {};
  },
  code() {
    const has = (path, re) => { try { return re.test(git("show", `${sha}:${path}`)); } catch { return false; } };
    if (!has("server/serve.mjs", /TAXILA_ROLE === "d5relay"/)) throw new Error(`${s7} has no relay role in server/serve.mjs`);
    const duplex = git("ls-tree", "-r", "--name-only", sha, "server/duplex/").split("\n").filter(Boolean);
    if (!duplex.some((p) => has(p, /verifyRelayTicket/))) throw new Error(`${s7} has no ticket check in server/duplex (Voice's patch, docs/patches/from-platform/002): the relay would refuse every socket`);
    return {};
  },
  async evidence() { const ev = await gateEvidence(sha); if (!ev) throw new Error(`no passing gate for ${s7}`); return { evidence: ev }; },
  async image() {
    if (argv.includes("--skip-image")) return { skipped: true };
    await acrBuild({ images: [`taxila-web:${s7}`], dockerfile: "Dockerfile", git: { repo: REPO, branch: sha } });
    return { image: `taxila-web:${s7}` };
  },
  async relay() {
    const env = await arm("GET", `${RGP}/providers/Microsoft.App/managedEnvironments/${RELAY_ENV}?${API}`);
    const web = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
    const webSecrets = (await arm("POST", `/providers/Microsoft.App/containerApps/taxila-web/listSecrets?${API}`)).value || [];
    const registries = web.properties.configuration.registries || [];
    const registrySecrets = registries.filter((r) => r.passwordSecretRef).map((r) => ({ name: r.passwordSecretRef, value: webSecrets.find((s) => s.name === r.passwordSecretRef)?.value }));
    if (registrySecrets.some((s) => !s.value)) throw new Error("the registry password is not readable from taxila-web");
    const image = web.properties.template.containers[0].image.replace(/:[^:]+$/, `:${s7}`);
    const body = relayAppBody({ envId: env.id, location: env.location, image, sha7: s7, targetPort: web.properties.configuration.ingress.targetPort,
      registries, registrySecrets, voiceLiveEndpoint: E.TAXILA_VOICELIVE_ENDPOINT || E.AZURE_AI_CENTRALINDIA_ENDPOINT,
      voiceLiveKey: E.TAXILA_VOICELIVE_KEY || E.AZURE_AI_CENTRALINDIA_KEY, ticketKey: E.TAXILA_D5_TICKET_KEY, voiceLiveModel: E.TAXILA_VOICELIVE_MODEL });
    console.log(`  PUT ${RELAY_APP} in ${env.location} (${image.split("/").pop()})`);
    await arm("PUT", `${APP_PATH}?${API}`, body);
    return { location: env.location };
  },
  async healthy() {
    const a = await until(async () => { const x = await arm("GET", `${APP_PATH}?${API}`); if (x.properties.provisioningState === "Failed") throw new Error("provisioning failed"); return x.properties.provisioningState === "Succeeded" && x; }, { everyMs: 6000, maxMs: 600_000, what: `${RELAY_APP} provisioned` });
    const fqdn = a.properties.configuration.ingress.fqdn;
    await until(async () => { try { const r = await fetch(`https://${fqdn}/api/health?ready=1`); return r.ok && (await r.json()).role === "d5relay"; } catch { return false; } }, { everyMs: 5000, maxMs: 300_000, what: `${RELAY_APP} healthy` });
    console.log(`  ${RELAY_APP} healthy at https://${fqdn}`);
    return { fqdn };
  },
  handoff(st) {
    const h = relayHandoff({ sha7: s7, fqdn: st.steps.healthy.data.fqdn });
    console.log(`production step (main runs it; the relay serves nothing until then):\n   on:  ${h.on}\n   off: ${h.off}`);
    return h;
  },
};

const r = await runSteps({ steps, state, exec: { cmd: () => 1, fn }, save, log: console.log });
console.log(r.ok ? `relay ready on ${s7}` : `RELAY STOPPED at ${r.failed}: ${r.error} (re-run to resume)`);
process.exit(r.ok ? 0 : 1);
