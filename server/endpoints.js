// THE one place the server decides which Azure account a model lane talks to (docs/ops/INDIA-MOVE.md §2.2, gap G1).
// Every Foundry/OpenAI/Speech call resolves its base URL and key here, so the India move is env-only:
//
//   AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY            the primary account (every lane, as before)
//   AZURE_OPENAI_ENDPOINT_<LANE> / AZURE_OPENAI_API_KEY_<LANE>  a per-lane override
//
// Lanes: CHAT (chat completions: reply, classify, grade, reports, content), REALTIME (realtime client secret +
// the base the browser posts its SDP offer to), TRANSCRIBE (the transcription session the browser opens and the
// push-to-talk batch transcription), TTS (gpt-4o-mini-tts, batch and streamed), IMAGE (gpt-image-2 / sora; no server
// caller yet), RESPONSES (the Forge builder's Responses API), SAFETY (Azure AI Content Safety, host only).
//
// With no override set, every lane resolves to exactly AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY: no behaviour
// change. The India stack sets the primary to the southindia account and pins TTS / IMAGE (models southindia does
// not sell) and, until the quota raise lands, REALTIME to eastus2 (scripts/deploy-azure.mjs --profile india).
//
// Keys are per account. An override endpoint on a DIFFERENT host than the primary needs its own key: falling back to
// the primary key would send account A's key to account B (a 401 at best, a key in the wrong place at worst), so
// that is a configuration error, thrown at the first call. Never logs a key; hosts are not secret.
//
// Everything is read lazily per call (env loaded after import — dev server, tests — still applies).

export const LANES = /** @type {const} */ (["CHAT", "REALTIME", "TRANSCRIBE", "TTS", "IMAGE", "RESPONSES", "SAFETY"]);

export class EndpointConfigError extends Error {
  constructor(message) { super(message); this.status = 0; this.code = "config"; }
}

const laneName = (lane) => {
  const L = String(lane || "CHAT").toUpperCase();
  if (!LANES.includes(/** @type {any} */ (L))) throw new EndpointConfigError(`unknown model lane ${lane}`);
  return L;
};
/** Strip trailing slashes; an override given as a bare resource URL gets the v1 path the primary already carries. */
function normalise(url) {
  const u = String(url || "").trim().replace(/\/+$/, "");
  if (!u) return "";
  return /\/openai(\/|$)/.test(u) ? u : `${u}/openai/v1`;
}
const hostOf = (url) => { try { return new URL(url).host.toLowerCase(); } catch { return ""; } };

/**
 * { endpoint, key, lane, override } for a lane. `endpoint` is the v1 base (…/openai/v1, no trailing slash).
 * @param {string} [lane] one of LANES (case-insensitive); default CHAT
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveLane(lane = "CHAT", env = process.env) {
  const L = laneName(lane);
  const primary = (env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");
  const primaryKey = env.AZURE_OPENAI_API_KEY || "";
  const over = normalise(env[`AZURE_OPENAI_ENDPOINT_${L}`]);
  if (!over) return { lane: L, endpoint: primary, key: primaryKey, override: false };
  const laneKey = env[`AZURE_OPENAI_API_KEY_${L}`];
  if (laneKey) return { lane: L, endpoint: over, key: laneKey, override: true };
  if (primary && hostOf(over) === hostOf(primary)) return { lane: L, endpoint: over, key: primaryKey, override: true };
  throw new EndpointConfigError(`AZURE_OPENAI_ENDPOINT_${L} points at another account but AZURE_OPENAI_API_KEY_${L} is not set`);
}

/** The v1 base URL for a lane. Not a secret (the browser posts its SDP offer under the REALTIME/TRANSCRIBE one). */
export function laneEndpoint(lane = "CHAT", env = process.env) {
  const { endpoint, override } = resolveLane(lane, env);
  if (!endpoint) throw new EndpointConfigError(override ? `AZURE_OPENAI_ENDPOINT_${laneName(lane)} not set` : "AZURE_OPENAI_ENDPOINT not set");
  return endpoint;
}
/** The key for a lane. Goes only in a request header; never logged. */
export function laneKey(lane = "CHAT", env = process.env) {
  const { key } = resolveLane(lane, env);
  if (!key) throw new EndpointConfigError("AZURE_OPENAI_API_KEY not set");
  return key;
}
/** https://<host> of a lane (Content Safety lives on the account host, not under /openai/v1). */
export function laneHost(lane = "CHAT", env = process.env) {
  return laneEndpoint(lane, env).replace(/(https?:\/\/[^/]+).*/, "$1");
}

/**
 * The lane a realtime client secret is minted on: a transcription session (cascade ears) on TRANSCRIBE, a voice
 * session on REALTIME. The base returned to the browser MUST be the same lane's, because the ephemeral key only
 * opens calls on the account that minted it.
 */
export const realtimeLane = (session) => (session?.type === "transcription" ? "TRANSCRIBE" : "REALTIME");

/** Which host each lane resolves to (hosts only, no keys) — for ops checks and the rehearsal smoke. */
export function laneHosts(env = process.env) {
  return Object.fromEntries(LANES.map((L) => {
    try { return [L, hostOf(resolveLane(L, env).endpoint) || null]; } catch (e) { return [L, `error: ${e.message}`]; }
  }));
}

/**
 * Azure Speech (DragonHD voices). Env-only: AZURE_SPEECH_REGION + AZURE_SPEECH_KEY, optional AZURE_SPEECH_ENDPOINT.
 * southindia serves no Speech (INDIA-MOVE §2.3), so the India stack uses centralindia. null when not configured
 * (no server lane calls Speech yet; the router's DragonHD lane will read it from here).
 * @returns {{ region: string, key: string, ttsBase: string } | null}
 */
export function speechConfig(env = process.env) {
  const region = env.AZURE_SPEECH_REGION, key = env.AZURE_SPEECH_KEY;
  if (!region || !key) return null;
  const ttsBase = (env.AZURE_SPEECH_ENDPOINT || `https://${region}.tts.speech.microsoft.com`).replace(/\/+$/, "");
  return { region, key, ttsBase };
}
