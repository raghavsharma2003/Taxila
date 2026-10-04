// TaxilaFDB splits, frozen 2026-10-04 BEFORE any engine was run on the benchmark. Two axes, both held out:
//   1. template family (`tfam`): every test template family is absent from train and dev (a learned model cannot memorise
//      a template's wording or its pause pattern);
//   2. child voice: test streams use voices never rendered for train or dev.
// F10 (safety) is test-only: safety is code (the predicate + governor G1/G2), never learned.
// Dev is small; learned arms tune thresholds on dev + out-of-fold train predictions (grouped by tfam), then freeze.

export const SPLIT_VERSION = "taxilafdb-split/2026-10-04";

export const TEST_TFAMS = new Set([
  "F1.fluent_dec_unit", "F1.fluent_choice_yn", "F1.tail", "F1.hes_preface", "F1.rep_marker",
  "F2.nocue_sci", "F2.cue_maths",
  "F3.initial_address", "F3.mid_b",
  "F4.one_en", "F4.two_hi",
  "F5.hold_think", "F5.hold_long", "F5.ws_long",
  "F6.filler_idk", "F6.idk_en",
  "F7.stop", "F7.fold_in",
  "F8.boundary_b", "F8.mid_b",
  "F9.her_sibling", "F9.her_cooker", "F9.child_noise",
  "F10.after_value", "F10.after_pause", "F10.during_her", "F10.benign",
  "F11.drift_1", "F11.drift_3",
  "F12.echo_10", "F12.echo_30",
]);
export const DEV_TFAMS = new Set(["F1.fluent_word", "F1.rep_bare", "F2.cue_maths_filler", "F2.nocue_sci_filler"]);

/** Child voices (Azure Speech standard neural, hi-IN; no Hindi child voice exists in the catalogue, read 2026-10-04: child-likeness by SSML pitch/rate). */
export const VOICES = {
  train: [
    { name: "hi-IN-AnanyaNeural", sex: "f", pitch: "+16%", rate: "-6%" },
    { name: "hi-IN-AaravNeural", sex: "m", pitch: "+38%", rate: "-8%" },
    { name: "hi-IN-SwaraNeural", sex: "f", pitch: "+14%", rate: "-6%" },
    { name: "hi-IN-KunalNeural", sex: "m", pitch: "+36%", rate: "-8%" },
  ],
  test: [
    { name: "hi-IN-KavyaNeural", sex: "f", pitch: "+15%", rate: "-6%" },
    { name: "hi-IN-RehaanNeural", sex: "m", pitch: "+36%", rate: "-8%" },
  ],
};
/** Her voice (the product candidate, MODEL-STACK §2: en-IN-Diya DragonHD; no prosody tags on DragonHD). */
export const HER_VOICE = "en-IN-Diya:DragonHDLatestNeural";
export const TV_VOICES = { hi: "hi-IN-MadhurNeural", en: "en-IN-PrabhatNeural" };
export const SIBLING_VOICE = { name: "hi-IN-AartiNeural", pitch: "+24%", rate: "-4%" };

export function splitOf(sc) {
  if (TEST_TFAMS.has(sc.tfam)) return "test";
  if (DEV_TFAMS.has(sc.tfam)) return "dev";
  return "train";
}

function h32(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; }

/** The two child voices a scenario is rendered in (test: both test voices; train/dev: 2 of the 4 train voices). */
export function voicesFor(sc) {
  const sp = splitOf(sc);
  if (sp === "test") return VOICES.test;
  const k = h32(sc.id) % 4;
  return [VOICES.train[k], VOICES.train[(k + 1 + (h32(sc.id + "b") % 3)) % 4]];
}

/** Acoustic conditions each render is mixed under (mix.mjs). */
export const CONDITIONS = ["clean", "noisy"];
