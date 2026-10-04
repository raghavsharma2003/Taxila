// server/endpoints.js (India move, INDIA-MOVE §2.2 G1): per-lane Azure endpoints, env-only, and no behaviour change
// when no override is set. Also server/db.js pgPoolConfig (DB_DRIVER=pg against Azure Database for PostgreSQL).
import test from "node:test";
import assert from "node:assert/strict";
import { LANES, laneEndpoint, laneHost, laneHosts, laneKey, realtimeLane, resolveLane, speechConfig } from "../server/endpoints.js";
import { pgPoolConfig } from "../server/db.js";

const EUS = "https://raghav-eus2.openai.azure.com/openai/v1";
const SIN = "https://taxila-ai-southindia.openai.azure.com/openai/v1";
const base = { AZURE_OPENAI_ENDPOINT: EUS + "/", AZURE_OPENAI_API_KEY: "k-eus" };

test("no override: every lane is exactly the primary endpoint and key (today's behaviour)", () => {
  for (const L of LANES) {
    assert.equal(laneEndpoint(L, base), EUS);
    assert.equal(laneKey(L, base), "k-eus");
  }
  assert.equal(laneEndpoint(undefined, base), EUS);
  assert.equal(laneHost("SAFETY", base), "https://raghav-eus2.openai.azure.com");
});

test("india shape: primary southindia, TTS/IMAGE/REALTIME pinned to eastus2 with their own key", () => {
  const env = { AZURE_OPENAI_ENDPOINT: SIN, AZURE_OPENAI_API_KEY: "k-sin",
    AZURE_OPENAI_ENDPOINT_TTS: EUS, AZURE_OPENAI_API_KEY_TTS: "k-eus",
    AZURE_OPENAI_ENDPOINT_IMAGE: EUS, AZURE_OPENAI_API_KEY_IMAGE: "k-eus",
    AZURE_OPENAI_ENDPOINT_REALTIME: EUS, AZURE_OPENAI_API_KEY_REALTIME: "k-eus" };
  assert.deepEqual([laneEndpoint("chat", env), laneKey("chat", env)], [SIN, "k-sin"]);
  assert.deepEqual([laneEndpoint("TRANSCRIBE", env), laneKey("TRANSCRIBE", env)], [SIN, "k-sin"]);
  for (const L of ["TTS", "IMAGE", "REALTIME"]) assert.deepEqual([laneEndpoint(L, env), laneKey(L, env)], [EUS, "k-eus"]);
  assert.equal(laneHosts(env).TTS, "raghav-eus2.openai.azure.com");
  assert.equal(laneHosts(env).CHAT, "taxila-ai-southindia.openai.azure.com");
});

test("an override on another account without its own key is a config error, never the primary key", () => {
  const env = { ...base, AZURE_OPENAI_ENDPOINT_CHAT: SIN };
  assert.throws(() => resolveLane("CHAT", env), /AZURE_OPENAI_API_KEY_CHAT/);
  // same host as the primary: the primary key is the right key
  assert.equal(laneKey("CHAT", { ...base, AZURE_OPENAI_ENDPOINT_CHAT: EUS }), "k-eus");
});

test("a bare resource URL override gets the /openai/v1 path; unknown lanes are refused", () => {
  const env = { ...base, AZURE_OPENAI_ENDPOINT_TTS: "https://x.openai.azure.com/", AZURE_OPENAI_API_KEY_TTS: "k" };
  assert.equal(laneEndpoint("TTS", env), "https://x.openai.azure.com/openai/v1");
  assert.throws(() => laneEndpoint("VIDEO", env), /unknown model lane/);
  assert.throws(() => laneEndpoint("CHAT", {}), /AZURE_OPENAI_ENDPOINT not set/);
});

test("realtime secrets: a transcription session mints on TRANSCRIBE, a voice session on REALTIME", () => {
  assert.equal(realtimeLane({ type: "transcription" }), "TRANSCRIBE");
  assert.equal(realtimeLane({ type: "realtime" }), "REALTIME");
  assert.equal(realtimeLane(undefined), "REALTIME");
});

test("azure.js endpoint() keeps its old default and error type", async () => {
  const { endpoint, AzureError } = await import("../server/azure.js");
  const saved = { ...process.env };
  try {
    process.env.AZURE_OPENAI_ENDPOINT = EUS; process.env.AZURE_OPENAI_API_KEY = "k";
    delete process.env.AZURE_OPENAI_ENDPOINT_REALTIME; delete process.env.AZURE_OPENAI_ENDPOINT_CHAT;
    assert.equal(endpoint(), EUS);
    assert.equal(endpoint("REALTIME"), EUS);
    delete process.env.AZURE_OPENAI_ENDPOINT;
    assert.throws(() => endpoint(), (e) => e instanceof AzureError && /AZURE_OPENAI_ENDPOINT not set/.test(e.message));
  } finally { for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved); }
});

test("speechConfig: env only, null until configured", () => {
  assert.equal(speechConfig({}), null);
  assert.deepEqual(speechConfig({ AZURE_SPEECH_REGION: "centralindia", AZURE_SPEECH_KEY: "s" }),
    { region: "centralindia", key: "s", ttsBase: "https://centralindia.tts.speech.microsoft.com" });
});

test("pgPoolConfig: Azure PG url with sslmode=require keeps TLS verification; Neon channel_binding stripped; no-TLS refused", () => {
  const az = pgPoolConfig("postgresql://u:p@taxila-sin-pg.postgres.database.azure.com:5432/taxila?sslmode=require");
  assert.equal(az.connectionString, "postgresql://u:p@taxila-sin-pg.postgres.database.azure.com:5432/taxila?sslmode=require");
  assert.deepEqual(az.ssl, { rejectUnauthorized: true });
  assert.equal(pgPoolConfig("postgresql://u:p@ep-x.neon.tech/db?sslmode=require&channel_binding=require").connectionString, "postgresql://u:p@ep-x.neon.tech/db?sslmode=require");
  assert.equal(pgPoolConfig("postgresql://u:p@h/db?channel_binding=require&sslmode=require").connectionString, "postgresql://u:p@h/db?sslmode=require");
  for (const m of ["disable", "allow", "prefer"]) assert.throws(() => pgPoolConfig(`postgresql://u:p@h/db?sslmode=${m}`), /TLS is required/);
});
