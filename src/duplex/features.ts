/**
 * The engine's numeric feature vector (spec "cce-features/1"): one fixed layout for three consumers, so they can never
 * drift apart —
 *   1. stage B inference (adapter.ts TrainedEngine packs a tick and runs the ONNX model on it);
 *   2. the shadow logger's consent-gated training rows (ARCHITECTURE.md v2 §5.6: the engine's logs become the training
 *      data for a stage B refit and, later, a native duplex model; seam S15);
 *   3. scripts/duplex/** training (reads the same names in the same order).
 * Numbers only: no words, no audio, no identity. Prosody enters as floor-timing numbers, never as an affect label.
 * A breaking change bumps FEATURE_SPEC; a model trained on another spec is refused. Erasable TypeScript, pure.
 */
import type { EngineTick, FloorPhase, ExchangeContext, FormState, HerAct } from "./engine.ts";
import type { Band4 } from "../../shared/bands.ts";

export const FEATURE_SPEC = "cce-features/1";

const PHASES: FloorPhase[] = ["her_turn", "handover", "child_turn", "overlap", "committed", "hold_requested", "safety_attend", "idle"];
const EXCHANGES: ExchangeContext[] = ["closed_answer", "open_explanation", "question_to_her", "chit_chat", "free"];
const FORMS: FormState[] = ["none", "pending", "prefix_ambiguous", "complete", "overfull", "not_applicable"];
const ACTS: HerAct[] = ["asked_closed", "asked_yes_no", "asked_choice", "asked_open", "invited_questions", "explaining", "chit_chat", "safeguard", "none"];
const BANDS: Band4[] = ["B1", "B2", "B3", "B4"];
const BOOL_MARKERS = ["holdRequest", "fillerTail", "openTail", "projection", "wordSearch", "repairOpen", "repaired", "yieldTag", "idk", "asks",
  "questionComplete", "stopRequest", "repeatRequest", "codeSwitchAtEdge"] as const;

const onehot = <T>(all: readonly T[], v: T | null | undefined): number[] => all.map((x) => (x === v ? 1 : 0));
const lg = (ms: number | null | undefined): number => (ms === null || ms === undefined ? -1 : Math.log1p(Math.max(0, ms) / 1000));
const n = (v: number | null | undefined, scale = 1, dflt = 0): number => (v === null || v === undefined || !Number.isFinite(v) ? dflt : v / scale);

/** Names, in order (training scripts and logs read these). */
export const FEATURE_NAMES: string[] = [
  ...PHASES.map((p) => `phase.${p}`), ...EXCHANGES.map((e) => `exchange.${e}`), ...FORMS.map((f) => `form.${f}`),
  "child.voicing", "child.voicedProb", "child.silence.log", "child.voicedRun.log", "child.turnVoiced.log", "child.pauses",
  "pros.f0Slope", "pros.f0Rel", "pros.energySlope", "pros.finalLengthening", "pros.rate", "pros.f0Known",
  "tr.unseen.log", "tr.stability", "tr.isFinal", "tr.hasText", "tr.lag.log", "mk.lexP", ...BOOL_MARKERS.map((k) => `mk.${k}`),
  "mk.values", "mk.lastValueAge.log", "mk.offTask.log",
  "her.speaking", "her.atBoundary", "her.played.log", ...ACTS.map((a) => `her.act.${a}`),
  "ov.present", "ov.dur.log", "ov.echo", "ov.atBoundary", "ov.yesno", "ov.onsetF0Rel",
  "screen.busy", "screen.events", ...BANDS.map((b) => `band.${b}`), "ctx.weakerLanguage",
  "pace.p50.log", "pace.p90.log", "safety.distress",
];

/** One tick → one Float32Array in FEATURE_NAMES order. */
export function packFeatures(tick: EngineTick, holdP50 = 600, holdP90 = 1600): Float32Array {
  const c = tick.child, p = c.prosody, tr = tick.transcript, m = tick.markers, h = tick.her, o = tick.overlap;
  const v: number[] = [
    ...onehot(PHASES, tick.phase), ...onehot(EXCHANGES, tick.context.exchange), ...onehot(FORMS, m.form),
    c.voicing ? 1 : 0, c.voicedProb, lg(c.silenceRunMs), lg(c.voicedRunMs), lg(c.turnVoicedMs), Math.min(10, c.pausesThisTurn),
    n(p.f0SlopeStPerS, 10), n(p.f0RelRange, 1, 0.5), n(p.energySlopeDbPerS, 50), n(p.finalLengthening, 1, 1), n(p.speechRateSylPerS, 10), p.f0Hz === null ? 0 : 1,
    lg(tr.unseenVoicedMs), tr.stability, tr.isFinal ? 1 : 0, tr.text ? 1 : 0, lg(tr.lagMsEstimate), m.lexP, ...BOOL_MARKERS.map((k) => (m[k] ? 1 : 0)),
    Math.min(5, m.values.length), lg(m.lastValueAgeMs), lg(m.offTaskMs),
    h.speaking ? 1 : 0, h.atClauseBoundary ? 1 : 0, lg(h.playedMs), ...onehot(ACTS, h.lastAct),
    o ? 1 : 0, lg(o?.durMs ?? null), o ? o.echoLikelihood : 0, o?.atHerBoundary ? 1 : 0, o?.herAskedYesNo ? 1 : 0, n(o?.onsetF0Rel ?? null, 1, 0.5),
    tick.screen.busy ? 1 : 0, Math.min(5, tick.screen.events.length), ...onehot(BANDS, tick.context.band), tick.context.weakerLanguage ? 1 : 0,
    lg(holdP50), lg(holdP90), tick.safety.distress ? 1 : 0,
  ];
  return Float32Array.from(v);
}
