// The engine capability registry (HUMAN-VOICE §5.4, B0). MEASURED data, not documentation: two Microsoft Learn claims
// were false for our voices (paralinguistic tags are SPOKEN on en-IN DragonHD; <prosody rate> IS honoured). Every entry
// cites its measurement. The nightly gate (evals/voice-expressive-nightly.mjs) re-probes the style markers; a marker it
// hears spoken is dropped with TAXILA_DHD_MARKERS_OFF=<comma list> until the registry is edited.
//
// Owner 2026-10-04 (voice-clips-off-and-numbers-normalised): no spliced non-verbal clips for any voice; a laugh only
// where the ENGINE renders it natively and in context. So `nonverbal` is "native" (the compiler may write the tag) or
// "none" (nothing is emitted; the plan's licence is kept for telemetry and the face only).

/** Emotion → DragonHD style marker (HUMAN-VOICE §5.9). joking / proud are unverified on en-IN: fall back. */
export const DHD_MARKER = Object.freeze({
  neutral: "neutral", warm: "appreciative", amused: "amused", delighted: "excited", surprised: "surprised", calm: "calm",
  reassuring: "reassuring", curious: "curious", wonder: "intrigued", thinking: "reflective", playful: "amused", proud: "appreciative",
});

/**
 * Markers heard SILENT on en-IN DragonHD (Diya, Arjun): cap-probe 2026-10-04 ([amused] 0/12 leak), pace-probe ([calm],
 * [slow], [fast]), the A/B arms (0/5 leak with every marker the plans used), v4 caps probe (curious, excited, calm,
 * amused) and this stream's ASR leak battery (w2g-leak-battery-2026-10-04). Anything not listed is never emitted.
 */
export const DHD_SILENT_MARKERS = Object.freeze(["neutral", "appreciative", "amused", "excited", "surprised", "calm", "reassuring", "curious", "intrigued", "reflective"]);

/** Paralinguistic tags: SPOKEN on en-IN DragonHD and MAI (12/12 renders), so they are forbidden there (lint.js). */
export const PARALINGUISTIC = Object.freeze(["laughter", "laughing", "laugh", "breathing", "breath", "sighing", "sigh", "coughing", "cough",
  "throat_clearing", "yawning", "chuckle", "chuckling", "humming", "hum", "giggle", "giggling", "inhale", "exhale", "gasp"]);

export const CAPS = Object.freeze({
  // en-IN DragonHD (cascade default): markers per sentence, <break>, <prosody rate> (pitch DOWN only), no native non-verbals.
  dhd: Object.freeze({ markers: true, markerScope: "sentence", tags: "spoken", break: true, rate: true, pitchDown: true, pitchUp: false,
    nonverbal: "none", firstByteP50: 228, source: "hv-cap-probe-2026-10-04, hv-dhd-prosody-2026-10-04, hv-latency-2026-10-04" }),
  // DragonHD Omni: native silent tags, markers, NO <break> / <prosody>; not production (unlisted personas).
  omni: Object.freeze({ markers: true, markerScope: "sentence", tags: "native", break: false, rate: false, pitchDown: false, pitchUp: false,
    nonverbal: "native", firstByteP50: 291, source: "hv-cap-probe-2026-10-04 (0/8 leak, laugh 2/2, breath 2/2)" }),
  // MAI-Voice-2.1 (Preview: benchmark only): express-as from the voice's StyleList, <break>; tags spoken, markers fail.
  mai: Object.freeze({ markers: false, markerScope: "none", tags: "spoken", break: true, rate: true, pitchDown: false, pitchUp: false,
    nonverbal: "none", firstByteP50: 289, source: "hv-cap-probe-2026-10-04 (bracket markers: no audio)" }),
  // gpt-4o-mini-tts: prose instructions only; requested laughs/breaths 0/10 audible; input text never altered.
  oai: Object.freeze({ markers: false, markerScope: "none", tags: "none", break: false, rate: false, pitchDown: false, pitchUp: false,
    nonverbal: "none", firstByteP50: 688, source: "hv-instructed-nonverbals (0/18), hv-latency-2026-10-04" }),
});

/** Markers switched off at runtime (the nightly re-probe heard them spoken). */
export function markersOff(env = process.env) {
  return new Set(String(env.TAXILA_DHD_MARKERS_OFF || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
}

/** The marker DragonHD gets for an emotion, or null (unknown, not proven silent, or switched off). */
export function dhdMarker(emotion, env = process.env) {
  const m = DHD_MARKER[emotion];
  if (!m || !DHD_SILENT_MARKERS.includes(m) || markersOff(env).has(m)) return null;
  return m;
}
