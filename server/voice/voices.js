// Which voice each teacher speaks with on the cascade (HUMAN-VOICE B1, BUILD-PLAN W2-G #2; decisions voice-choice-v2,
// voice-r2-diya-stays-2026-10-04). CONFIG, not code: the persona may change after the next blind round, so every value
// here is overridable from the environment and nothing else in the server names a voice.
//
//   engine   "dhd"  Azure Speech DragonHD (en-IN, GA: allowed for minors) through server/voice/azureTts.js
//            "oai"  gpt-4o-mini-tts (the character's realtime voice name: marin / cedar), today's path
//   dhd      the Azure Speech voice name
//   baseRate the <prosody rate> percent that brings the voice to ~11-13 spoken chars/s (HV-15; evals/tts-pace.mjs)
//
// Env:
//   TAXILA_CASCADE_ENGINE=dhd|oai   default dhd when Azure Speech is configured (AZURE_SPEECH_REGION/_KEY), else oai
//   TAXILA_DHD_VOICE_<ID>=<name>    e.g. TAXILA_DHD_VOICE_ASHA=en-IN-Meera:DragonHDLatestNeural
//   TAXILA_DHD_RATE_<ID>=<int>      e.g. TAXILA_DHD_RATE_ASHA=-22
//   TAXILA_VOICES=<json>            whole-table override: {"asha":{"dhd":"…","baseRate":-25}}
// The fallback voice (DragonHD down or unconfigured) is always the character's own gpt-4o-mini-tts voice: an identity
// change, logged by speech.js every time it happens.
import { speechConfig } from "../endpoints.js";

/**
 * Base rates: MEASURED by evals/tts-pace.mjs (centralindia, n=10 Roman-script Hinglish teacher lines per voice × rate,
 * 2026-10-04; context w2g-tts-pace-2026-10-04). Roman Hinglish reads FASTER than the Devanagari line HUMAN-VOICE §4.2
 * measured (plain 19.1 / 18.9 chars/s vs 15.9 / 17.5), so the spec's -25 / -28 % gave 15.0 chars/s; -35 % gives
 * 12.3 (Diya) and 12.2 (Arjun), inside the 11-13 band. The owner's ear check is still owed (HV-15).
 * Uma's voice is unmeasured: it starts at Diya's rate until its probe runs.
 */
export const VOICE_TABLE = Object.freeze({
  asha: Object.freeze({ dhd: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35, measured: true }),
  arjun: Object.freeze({ dhd: "en-IN-Arjun:DragonHDLatestNeural", baseRate: -35, measured: true }),
  uma: Object.freeze({ dhd: "en-IN-Meera:DragonHDLatestNeural", baseRate: -35, measured: false }),
});
const DEFAULT_ID = "asha";

const parseJson = (v) => { try { return v ? JSON.parse(v) : null; } catch { return null; } };
const clampRate = (n) => Math.max(-50, Math.min(30, Math.round(n)));

/** The cascade engine for this process: "dhd" or "oai". */
export function cascadeEngine(env = process.env) {
  const e = String(env.TAXILA_CASCADE_ENGINE || "").toLowerCase();
  if (e === "oai") return "oai";
  if (!speechConfig(env)) return "oai";
  return "dhd";
}

/**
 * The DragonHD voice for a teacher character id: { id, dhd, baseRate, measured }. Unknown ids get the default row's
 * voice (a named teacher keeps her character's voice: the id is the character, never the child's chosen name).
 * @param {string} [teacherId]
 */
export function dhdVoiceFor(teacherId, env = process.env) {
  const id = String(teacherId || DEFAULT_ID).toLowerCase();
  const table = { ...VOICE_TABLE, ...(parseJson(env.TAXILA_VOICES) ?? {}) };
  const row = table[id] ?? table[DEFAULT_ID];
  const U = id.toUpperCase();
  const voice = env[`TAXILA_DHD_VOICE_${U}`] || row.dhd;
  const rateEnv = Number(env[`TAXILA_DHD_RATE_${U}`]);
  const baseRate = clampRate(Number.isFinite(rateEnv) && env[`TAXILA_DHD_RATE_${U}`] !== "" && env[`TAXILA_DHD_RATE_${U}`] != null ? rateEnv : row.baseRate ?? 0);
  const chosen = !!env[`TAXILA_DHD_VOICE_${U}`] || !!parseJson(env.TAXILA_VOICES)?.[id];
  // usable: the row was probed (measured), or the owner chose this voice in config. An unprobed row speaks the
  // character's own gpt-4o-mini-tts voice instead, consistently, rather than 400-ing into a fallback on every part or
  // speaking at an unmeasured pace (fixer 2026-10-05, w2g-unmeasured-voice-stays-oai).
  return { id, dhd: String(voice), baseRate, measured: !!row.measured && !env[`TAXILA_DHD_VOICE_${U}`], usable: !!row.measured || chosen };
}

let warnedUnmeasured = false;
/** Log the unprobed rows once per process (at the first style resolution). */
export function warnUnmeasuredOnce() {
  if (warnedUnmeasured) return;
  warnedUnmeasured = true;
  const rows = Object.entries(VOICE_TABLE).filter(([, r]) => !r.measured).map(([id, r]) => `${id}=${r.dhd}`);
  if (rows.length) console.info(`[voice] unprobed DragonHD rows speak gpt-4o-mini-tts until probed: ${rows.join(", ")}`);
}

/** Is the expressive layer on for this engine? dhd: on unless TAXILA_VOICE_EXPRESSIVE=0; oai: only with =all. */
export function expressiveOn(engine, env = process.env) {
  const v = String(env.TAXILA_VOICE_EXPRESSIVE ?? "").toLowerCase();
  if (v === "0" || v === "off") return false;
  if (engine === "dhd") return true;
  return v === "all";
}
