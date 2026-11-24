// Round 7, stream G: the staging and India D5 relay plans, as data. No Azure, no git, no env reads.
import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGING_APP, STAGING_WORKER, resolveArgv, stagingPlan } from "../scripts/staging-core.mjs";
import { RELAY_APP, relayAppBody, relayHandoff, relayMissing, relayPlan } from "../scripts/region/d5-relay-core.mjs";

const SHA = "a23925a3e5d6c7b8a9f0e1d2c3b4a5968778695a";

test("staging: TEST database everywhere (TAXILA_DB, DATABASE_URL re-pointed, the direct URL removed), chat on southindia", () => {
  const p = stagingPlan({ sha: SHA, create: true, envName: "taxila-env" });
  const web = p.find((s) => s.id === "web").argv;
  const pairs = web.reduce((a, x, i) => (["--set", "--secret"].includes(web[i - 1]) ? [...a, `${web[i - 1]} ${x}`] : a), []);
  for (const want of ["--set TAXILA_DB=test", "--secret DATABASE_URL=CONDUCTOR_TEST_DATABASE_URL", "--set DATABASE_URL_DIRECT=",
    "--secret AZURE_OPENAI_API_KEY_CHAT=AZURE_OPENAI_API_KEY_SIN", "--set TAXILA_DUPLEX=on"]) assert.ok(pairs.includes(want), want);
  assert.deepEqual(web.slice(0, 6), ["scripts/deploy-azure.mjs", "--app", STAGING_APP, "--create", "--env", "taxila-env"]);
  assert.ok(!web.includes("taxila-web"), "never targets production's app");
  const worker = p.find((s) => s.id === "worker").argv;
  assert.deepEqual(worker, ["scripts/deploy-worker.mjs", "--app", STAGING_WORKER, "--web", STAGING_APP, "--db", "test", "--image-tag", "a23925a"]);
  assert.ok(!worker.includes("--jobs"), "no scheduled jobs on staging");
  assert.ok(p.findIndex((s) => s.id === "verify") < p.findIndex((s) => s.id === "worker"), "the DB check runs before anything else lands");
  assert.ok(!stagingPlan({ sha: SHA }).find((s) => s.id === "web").argv.includes("--create"));
});

test("staging: placeholders resolve only at apply, and a missing value refuses", () => {
  const argv = ["--set", "AZURE_OPENAI_ENDPOINT_CHAT={env:AZURE_OPENAI_ENDPOINT_SIN}"];
  assert.deepEqual(resolveArgv(argv, { AZURE_OPENAI_ENDPOINT_SIN: "https://si.example" }), ["--set", "AZURE_OPENAI_ENDPOINT_CHAT=https://si.example"]);
  assert.throws(() => resolveArgv(argv, {}), /AZURE_OPENAI_ENDPOINT_SIN is not set/);
});

test("relay app: no database or model secrets, Voice Live + ticket key only, the relay role, readiness on /api/health", () => {
  const b = relayAppBody({ envId: "/env", location: "southindia", image: "taxilacr.azurecr.io/taxila-web:a23925a", sha7: "a23925a", targetPort: 3000,
    registries: [{ server: "taxilacr.azurecr.io", username: "u", passwordSecretRef: "reg-pw" }], registrySecrets: [{ name: "reg-pw", value: "p" }],
    voiceLiveEndpoint: "https://ci.example", voiceLiveKey: "vk", ticketKey: "t".repeat(40) });
  const c = b.properties.template.containers[0];
  const names = c.env.map((e) => e.name);
  assert.ok(names.includes("TAXILA_ROLE") && c.env.find((e) => e.name === "TAXILA_ROLE").value === "d5relay");
  for (const banned of ["DATABASE_URL", "DATABASE_URL_DIRECT", "AZURE_OPENAI_API_KEY", "TEST_DATABASE_URL"]) assert.ok(!names.includes(banned), banned);
  assert.deepEqual(b.properties.configuration.secrets.map((s) => s.name).sort(), ["d5-ticket-key", "reg-pw", "voicelive-key"]);
  assert.ok(!JSON.stringify(c.env).includes("vk"), "the key value is never in env");
  assert.equal(c.probes.find((p) => p.type === "Readiness").httpGet.path, "/api/health?ready=1");
  assert.deepEqual([b.properties.template.scale.minReplicas, b.properties.template.scale.maxReplicas], [1, 2]);
  assert.equal(b.properties.template.terminationGracePeriodSeconds, 30);
});

test("relay plan: checks the code is in the sha before building; the production switch is main's, with a one-variable rollback", () => {
  const ids = relayPlan({ sha: SHA }).map((s) => s.id);
  assert.ok(ids.indexOf("code") < ids.indexOf("image") && ids.indexOf("image") < ids.indexOf("relay"));
  const h = relayHandoff({ sha7: "a23925a", fqdn: "relay.example" });
  assert.match(h.on, /--set TAXILA_D5_RELAY_URL=wss:\/\/relay\.example\/api\/duplex\/voicelive --secret TAXILA_D5_TICKET_KEY=TAXILA_D5_TICKET_KEY$/);
  assert.match(h.off, /--set TAXILA_D5_RELAY_URL=$/);
  assert.deepEqual(relayMissing({ TAXILA_D5_TICKET_KEY: "x", AZURE_AI_CENTRALINDIA_ENDPOINT: "e", TAXILA_VOICELIVE_KEY: "k", AZURE_SP_CLIENT_ID: 1, AZURE_SP_SECRET: 1, AZURE_TENANT_ID: 1 }), []);
  assert.equal(RELAY_APP, "taxila-d5-sin");
  assert.throws(() => relayPlan({ sha: "a23925a" }), /40-hex/);
});
