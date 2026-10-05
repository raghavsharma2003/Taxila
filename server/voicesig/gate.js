// The precision gate (VALUES-100 V2 item 3; owner directive owner-ship-five-2026-10-05). A knowledge state ACTS on a child's
// lesson only when ALL of these hold:
//   1. TAXILA_VOICESIG = on (the operator's mode; default shadow, kill = off);
//   2. its precision was MEASURED ON CHILDREN (population "children", the consented pilot or the in-product loop) and is
//      >= 0.80 with at least MIN_FIRED firings behind it;
//   3. its ladder row (ladder.js) is >= L1, i.e. a person reviewed that measurement and raised the row.
// Anything else runs in SHADOW: the state is computed, logged as brain_trace reason codes, and changes nothing a child sees.
// Simulated and adult-speech numbers are listed here so the status page can show them, labelled; they can NEVER open the
// gate (gate test: a simulated 0.855 stays shadow). Pure: no clock, env, I/O.
import { VS_STATES, levelOf, LADDER } from "./ladder.js";

export const GATE_VER = "vs-gate/1";
/** VALUES-100 V2 item 3. */
export const MIN_PRECISION = 0.8;
/** A precision from fewer firings than this is not a measurement a lesson may act on. */
export const MIN_FIRED = 100;
/** The only population whose numbers may open the gate. */
export const LIVE_POPULATION = "children";

/**
 * The measured evidence per state, as shipped. Each row names its population, n, method and date (CLAUDE.md: a number
 * without those cannot be compared). Source: evals/voicesig/results/2026-10-05/state-precision-sim-e1.json
 * (`node evals/voicesig/state-precision.mjs --children 200 --seeds 5 --effect 1 --added`), 126,000 simulated turns,
 * 1,000 simulated children; truth = the simulator's latent state. SIMULATED: the effect sizes are assumptions [E].
 * Replace a row only with a pilot / in-product measurement (`--rows <file> --population children`), in a reviewed diff.
 * @type {Record<string, { population: "simulated"|"adult"|"children"|"none", precision: number|null, precisionCi95?: number[]|null,
 *   recall: number|null, fired: number, truth: number, method: string, at: string|null, note?: string }>}
 */
export const EVIDENCE = Object.freeze({
  fluentRecall: { population: "simulated", precision: null, recall: 0, fired: 0, truth: 36672, method: "simulate-pilot latent state", at: "2026-10-05",
    note: "never fires under the placeholder calibration (h1 cannot reach 0.85 without the raw-track F7 term); needs a fitted table" },
  workingAloud: { population: "none", precision: null, recall: null, fired: 0, truth: 0, method: "no truth source", at: null,
    note: "the simulator has no think-aloud turns and no outcome defines the state yet" },
  fragileCorrect: { population: "simulated", precision: 0.855, precisionCi95: [0.845, 0.864], recall: 0.291, fired: 5542, truth: 16292, method: "simulate-pilot latent state", at: "2026-10-05" },
  heldBelief: { population: "simulated", precision: 0.591, precisionCi95: [0.577, 0.605], recall: 0.139, fired: 4760, truth: 20246, method: "simulate-pilot latent state", at: "2026-10-05" },
  effortfulGuess: { population: "simulated", precision: 0.486, precisionCi95: [0.475, 0.498], recall: 0.336, fired: 7026, truth: 10179, method: "simulate-pilot latent state", at: "2026-10-05" },
  rapidGuess: { population: "simulated", precision: 0.737, precisionCi95: [0.722, 0.751], recall: 0.43, fired: 3583, truth: 6148, method: "simulate-pilot latent state", at: "2026-10-05" },
  searching: { population: "simulated", precision: 1, precisionCi95: [1, 1], recall: 0.847, fired: 14830, truth: 17503, method: "simulate-pilot latent state", at: "2026-10-05",
    note: "artefact: in the simulator only the retrievable state says 'yaad nahi aa raha', so the transcript alone decides; says nothing about voice" },
  absent: { population: "simulated", precision: null, recall: 0, fired: 0, truth: 14111, method: "simulate-pilot latent state", at: "2026-10-05",
    note: "never fires under the placeholder calibration (h2 cannot fall to 0.35); needs a fitted table" },
});

/**
 * The one component measured on real speech: the filled-pause detector the device head runs (models/voicesig/filler-gru.json).
 * ADULT speech (AMI headsets, 32 held-out speakers), not children; it feeds the F3 term, it is not a knowledge state.
 */
export const COMPONENTS = Object.freeze({
  fillerDetector: { population: "adult", precision: 0.753, recall: 0.601, n: 1241, method: "AMI held-out speakers, event level at thr 0.44", at: "2026-10-04",
    narrowband: { precision: 0.31, recall: 0.15, note: "bt / speakerphone routes: the detector's lead is ignored (adapter NARROWBAND_MIC)" } },
});

/** Why a state is not live, as a closed code (status page + trace). null = the gate is open. */
export function gateReason(state, { mode, evidence = EVIDENCE, ladder = LADDER } = {}) {
  if (!VS_STATES.includes(state)) return "unknown_state";
  if (mode === "off") return "killed";
  // The evidence reasons come before the operator's mode, so the status page names the fundamental one.
  const e = evidence[state];
  if (!e || e.population !== LIVE_POPULATION) return "not_measured_on_children";
  if (!(typeof e.precision === "number" && e.precision >= MIN_PRECISION)) return "precision_below_bar";
  if (!(e.fired >= MIN_FIRED)) return "too_few_firings";
  if (levelOf(state, ladder) < 1) return "ladder_l0";
  if (mode !== "on") return "mode_shadow";
  return null;
}

/** Is this state allowed to act on a lesson now? */
export const liveAllowed = (state, o = {}) => gateReason(state, o) === null;

/** The status page's table (VALUES-100: "below that it stays shadow and says so on the status page"). */
export function statusTable({ mode, evidence = EVIDENCE, ladder = LADDER } = {}) {
  return VS_STATES.map((state) => {
    const e = evidence[state] ?? { population: "none", precision: null, recall: null, fired: 0, truth: 0, method: "none", at: null };
    const why = gateReason(state, { mode, evidence, ladder });
    return {
      state, live: why === null, why, population: e.population, precision: e.precision, precisionCi95: e.precisionCi95 ?? null, recall: e.recall,
      fired: e.fired, truth: e.truth, method: e.method, at: e.at, level: levelOf(state, ladder), ...(e.note ? { note: e.note } : {}),
      says: why === null ? "live" : `shadow: ${SAYS[why] ?? why}`,
    };
  });
}

const SAYS = {
  killed: "voice signals switched off (TAXILA_VOICESIG=off)",
  mode_shadow: "voice signals run in shadow by operator setting",
  not_measured_on_children: "precision not yet measured on children (pilot pending); numbers shown are simulated or adult speech",
  precision_below_bar: "precision on children below 0.80",
  too_few_firings: "too few firings on children to trust the precision",
  ladder_l0: "measured, awaiting the reviewed ladder raise",
  unknown_state: "unknown state",
  adapter_shadow: "the adapter has no fitted calibration for this state yet",
};
