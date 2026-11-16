// Round 7, stream G (platform-d5-relay-in-india): the India D5 relay as data. PURE (no ARM, no env reads), so the plan and
// the app body are tested (tests/d5-relay-plan.test.mjs) and the CLI (scripts/region/d5-relay.mjs) only resolves values.
//
// Why: the browser's hands-free socket goes to taxila-web in eastus2, which relays every audio frame to Voice Live in
// Central India and back (India → US → India per frame). The relay app runs the SAME image in taxila-sin-env (South
// India) with TAXILA_ROLE=d5relay: only /api/health and the /api/duplex/voicelive upgrade (server/serve.mjs). It has no
// database and no session cookie: taxila-web authorizes the child as today and hands the browser a 60-s ticket for the
// lesson (server/relay-ticket.js); the relay verifies it. The relay carries only what it needs: Voice Live's endpoint and
// key and the ticket key. Never production's database URL or model keys.

export const RELAY_APP = "taxila-d5-sin";
export const RELAY_RG = "taxila-sin";
export const RELAY_ENV = "taxila-sin-env";

/** .env.local names the apply needs (values never printed). One of each pair for Voice Live. */
export const RELAY_NEEDS = [["TAXILA_D5_TICKET_KEY"], ["TAXILA_VOICELIVE_ENDPOINT", "AZURE_AI_CENTRALINDIA_ENDPOINT"], ["TAXILA_VOICELIVE_KEY", "AZURE_AI_CENTRALINDIA_KEY"],
  ["AZURE_SP_CLIENT_ID"], ["AZURE_SP_SECRET"], ["AZURE_TENANT_ID"]];
/** The groups of RELAY_NEEDS `env` does not satisfy. PURE. */
export const relayMissing = (env) => RELAY_NEEDS.filter((g) => !g.some((k) => env[k])).map((g) => g.join(" or "));

/**
 * The container app body. Secret values are passed in (resolved by the CLI) and land only in configuration.secrets.
 * @param {{ envId: string, location: string, image: string, sha7: string, targetPort: number, registries: any[],
 *   registrySecrets: { name: string, value: string }[], voiceLiveEndpoint: string, voiceLiveKey: string, ticketKey: string,
 *   voiceLiveModel?: string }} o
 */
export function relayAppBody(o) {
  const env = [
    { name: "NODE_ENV", value: "production" },
    { name: "TAXILA_ROLE", value: "d5relay" },
    { name: "TAXILA_HOST", value: "azure" },
    { name: "TAXILA_REGION", value: "southindia" },
    { name: "GIT_SHA", value: o.sha7 },
    { name: "TAXILA_VOICELIVE_ENDPOINT", value: o.voiceLiveEndpoint },
    ...(o.voiceLiveModel ? [{ name: "TAXILA_VOICELIVE_MODEL", value: o.voiceLiveModel }] : []),
    { name: "TAXILA_VOICELIVE_KEY", secretRef: "voicelive-key" },
    { name: "TAXILA_D5_TICKET_KEY", secretRef: "d5-ticket-key" },
  ];
  return { location: o.location, properties: { environmentId: o.envId,
    configuration: { activeRevisionsMode: "Single",
      ingress: { external: true, targetPort: o.targetPort, transport: "auto", allowInsecure: false },
      registries: o.registries,
      secrets: [...o.registrySecrets, { name: "voicelive-key", value: o.voiceLiveKey }, { name: "d5-ticket-key", value: o.ticketKey }] },
    template: { revisionSuffix: `r${o.sha7}-${Date.now().toString(36).slice(-4)}`, terminationGracePeriodSeconds: 30,
      containers: [{ name: "d5relay", image: o.image, env, resources: { cpu: 0.5, memory: "1Gi" },
        probes: [{ type: "Readiness", httpGet: { path: "/api/health?ready=1", port: o.targetPort }, periodSeconds: 10 },
          { type: "Liveness", httpGet: { path: "/api/health", port: o.targetPort }, initialDelaySeconds: 10, periodSeconds: 30 }] }],
      scale: { minReplicas: 1, maxReplicas: 2 } } } };
}

/** The steps, as data. The relay goes live only when taxila-web is given its URL, which is a production deploy: main's. */
export function relayPlan({ sha }) {
  if (!/^[0-9a-f]{40}$/.test(String(sha))) throw new Error(`d5 relay: a full 40-hex commit sha, got ${sha}`);
  const s7 = sha.slice(0, 7);
  return [
    { id: "preflight", title: "the ticket key (≥ 32 chars) and Voice Live's endpoint + key are in .env.local", kind: "fn" },
    { id: "code", title: `${s7} carries the relay: TAXILA_ROLE=d5relay in server/serve.mjs AND Voice's ticket check in server/duplex (verifyRelayTicket)`, kind: "fn" },
    { id: "evidence", title: `gate evidence for ${s7}`, kind: "fn" },
    { id: "image", title: `ACR: taxila-web:${s7} at the commit (skipped if it exists from release.mjs)`, kind: "fn" },
    { id: "relay", title: `${RELAY_APP} in ${RELAY_RG}/${RELAY_ENV} (South India): 0.5 vCPU / 1 Gi, 1-2 replicas, no database, Voice Live + ticket key only`, kind: "fn" },
    { id: "healthy", title: `${RELAY_APP} Running + Healthy, and https://<fqdn>/api/health answers role d5relay`, kind: "fn" },
    { id: "handoff", title: "print the production step for main: taxila-web gets TAXILA_D5_RELAY_URL + the ticket key (rollback: unset the URL)", kind: "fn" },
  ];
}

/** The production command main runs to point browsers at the relay (and its rollback). PURE. */
export function relayHandoff({ sha7, fqdn }) {
  return {
    on: `node scripts/deploy-azure.mjs --image-tag ${sha7} --set TAXILA_D5_RELAY_URL=wss://${fqdn}/api/duplex/voicelive --secret TAXILA_D5_TICKET_KEY=TAXILA_D5_TICKET_KEY`,
    off: `node scripts/deploy-azure.mjs --image-tag ${sha7} --set TAXILA_D5_RELAY_URL=`,
  };
}
