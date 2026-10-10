// explainer@1: an animated explanation or a diagram, drawn on the board while she explains (W2-B #2/#3; rungs 4-5 of
// the Studio fallback ladder, LIVE-STUDIO §3.12). The params carry a WhiteboardScript that the server built from a
// template (server/forge/explainer/**: the model fills data, code computes every number, position and label box); this
// engine only draws it (src/modules/whiteboard/Player.tsx), so a wrong fill can cost taste, never truth.
//
// It grades nothing and has no goal: an explanation, not an activity. It fills the frame (the frame fills the tray), so
// the board is always inside the tray, aspect-fitted, never scrolled. Highlight: an op id gets an attention ring (the
// teacher pointing). A "play again" button appears when the drawing is done.
import { useEffect, useMemo, useRef, useState } from "react";
import type { EngineModule, EngineProps } from "../engine.ts";
import { defineEngine } from "../kit/def.ts";
import { normalizeScript } from "../../../../shared/whiteboard.js";
import { WhiteboardPlayer } from "../../whiteboard/Player.tsx";
import { boardSkinFromDocument, paletteFor } from "../../whiteboard/palette.ts";

const def = defineEngine({
  id: "explainer@1",
  title: "Board explanation",
  subjects: ["maths", "science", "evs", "english", "hindi", "sst"],
  params: {
    script: { type: "object", doc: "a WhiteboardScript (shared/studio.ts) built by a server template; never model-written free drawing" },
    template: { type: "string", doc: "the template that built the script (facts only)" },
    mode: { type: "string", enum: ["play"], default: "play", doc: "the only mode" },
    delayMs: { type: "number", min: 0, max: 3000, default: 250, doc: "ms after mount before the first stroke when no line anchor is expected" },
    cue: { type: "object", doc: "her line's first audio sample, forwarded by the host: { ageMs, n } (ms since it fired; set_param only)" },
  },
  emits: ["explainer.played", "explainer.replay", "explainer.tap"],
});

const reducedMotionNow = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** How long a new board waits for her line's anchor before drawing on its own clock (StudioWhiteboard's grace). */
export const ANCHOR_GRACE_MS = 1200;
type Cue = { ageMs: number; n: number; rxAt: number };
const cueOf = (v: unknown): Cue | null => {
  const c = v as Partial<Cue> | null;
  return c && typeof c.ageMs === "number" && Number.isFinite(c.ageMs) && c.ageMs >= 0 && typeof c.n === "number"
    ? { ageMs: c.ageMs, n: c.n, rxAt: typeof c.rxAt === "number" ? c.rxAt : performance.now() } : null;
};
/** The anchor on this frame's clock (performance.now() time of her line's first audio sample). */
const anchorAt = (c: Cue) => c.rxAt - c.ageMs;

function Explainer({ params, highlight, api }: EngineProps) {
  const norm = useMemo(() => normalizeScript(params.script), [params.script]);
  const script = norm.script;
  const delay = typeof params.delayMs === "number" ? params.delayMs : 250;
  // In sync with her voice (W2-B fixer, major 1): the drawing's clock starts at her line's first audio sample, which the
  // host forwards as `cue` (its age in ms; this frame's clock has its own origin). No anchor within the grace (the text
  // lane, or a lane that does not mark it yet) → it starts on its own, as StudioWhiteboard does.
  const [startAt, setStartAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const reported = useRef(false);
  const waiting = useRef<{ since: number; usedCue: number } | null>(null);
  const cue = cueOf(params.cue);
  // a new script (mount, or set_param from the next teaching move) waits for its line's anchor afresh
  useEffect(() => {
    if (!script) { api.error(`explainer script rejected: ${norm.errors.slice(0, 3).join(",")}`); return; }
    setDone(false);
    reported.current = false;
    setStartAt(null);
    const since = performance.now();
    waiting.current = { since, usedCue: cue?.n ?? -1 };
    // an anchor that fired just before this board mounted is this line's (the audio began while the frame booted)
    if (cue && since - anchorAt(cue) <= 2500) { waiting.current = null; setStartAt(anchorAt(cue)); return; }
    const t = setTimeout(() => { if (waiting.current?.since === since) { waiting.current = null; setStartAt(since + Math.max(delay, ANCHOR_GRACE_MS)); } }, Math.max(delay, ANCHOR_GRACE_MS));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script?.scriptId]);
  // the anchor arrives while the board waits: the clock is measured from it
  useEffect(() => {
    const w = waiting.current;
    if (!cue || !w || cue.n === w.usedCue) return;
    waiting.current = null;
    setStartAt(anchorAt(cue));
  }, [cue?.n]);
  if (!script) return null;
  // r4: under the Kaksha skin (the frame root marked by init) the board wears Kaksha's tokens; else as before
  const skin = boardSkinFromDocument(script.board.ground);
  const pal = skin?.palette ?? paletteFor(script.board.ground);
  return (
    <div className="wb-root" style={{ background: pal.ground }} data-testid="explainer">
      <WhiteboardPlayer script={script} startAt={startAt} reducedMotion={reducedMotionNow()} pulse={highlight} className="wb-svg" skin={skin}
        onTapText={(op) => api.interaction("explainer.tap", { opId: op.id, label: op.text })}
        onDone={() => {
          setDone(true);
          if (!reported.current) { reported.current = true; api.interaction("explainer.played", { ms: script.durationMs }); }
        }} />
      {done && (
        <button type="button" className="wb-replay" aria-label="Play again" data-testid="explainer-replay"
          onClick={() => { setDone(false); setStartAt(performance.now() + 150); api.interaction("explainer.replay"); }}
          style={{ color: pal.ink.chalk, borderColor: pal.ink.soft }}>
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /><path d="M4 3v5h5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
    </div>
  );
}

export const engine: EngineModule = { def, Component: Explainer };
