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
import { paletteFor } from "../../whiteboard/palette.ts";

const def = defineEngine({
  id: "explainer@1",
  title: "Board explanation",
  subjects: ["maths", "science", "evs", "english", "hindi", "sst"],
  params: {
    script: { type: "object", doc: "a WhiteboardScript (shared/studio.ts) built by a server template; never model-written free drawing" },
    template: { type: "string", doc: "the template that built the script (facts only)" },
    mode: { type: "string", enum: ["play"], default: "play", doc: "the only mode" },
    delayMs: { type: "number", min: 0, max: 3000, default: 250, doc: "ms after mount before the first stroke (her preamble)" },
  },
  emits: ["explainer.played", "explainer.replay"],
});

const reducedMotionNow = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Explainer({ params, highlight, api }: EngineProps) {
  const norm = useMemo(() => normalizeScript(params.script), [params.script]);
  const script = norm.script;
  const delay = typeof params.delayMs === "number" ? params.delayMs : 250;
  const [startAt, setStartAt] = useState<number | null>(() => performance.now() + delay);
  const [done, setDone] = useState(false);
  const reported = useRef(false);
  useEffect(() => {
    if (!script) api.error(`explainer script rejected: ${norm.errors.slice(0, 3).join(",")}`);
  }, [script, norm.errors, api]);
  if (!script) return null;
  const pal = paletteFor(script.board.ground);
  return (
    <div className="wb-root" style={{ background: pal.ground }} data-testid="explainer">
      <WhiteboardPlayer script={script} startAt={startAt} reducedMotion={reducedMotionNow()} pulse={highlight} className="wb-svg"
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
