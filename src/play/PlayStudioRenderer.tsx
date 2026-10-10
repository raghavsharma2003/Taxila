// The Studio renderer for a PlayArtifact (docs/design/round3/forge/FOR-PLAY.md §2.1; registered by forge's build-time
// glob in src/studio/renderers.ts). It fetches the level the artifact's session points at, renders a PlaySession in play
// mode (embedded: the Desk shows the teacher) at the box it is given, and reports through onEvent. A box too small to meet
// the floors (text ≥ 14 px, targets ≥ 44 px with the rail and the controls) is refused with
// { type: "error", reason: "runtime", message: "layout" } so the stage steps down to the board twin: the 181 × 113 px
// defect is never repeated (live-tech §1.1).
//
// The lesson seam (docs/design/round3/play/patches, APPLY.md): every server-signed token (a level's evidence, a seam's
// PLAY facts row) goes up as an `interaction` named play_evidence / play_seam with the token in `data`; WorkTray turns them
// into module events (goal_met at a level end, stuck at an impasse or a misconception) and the lesson turn verifies them.
// Committed child utterances arrive as a window event (PLAY_HEARD) the lesson runtime dispatches: the closed voice grammar
// maps commands to presses.
import { useEffect, useState } from "react";
import type { ArtId, PlayArtifact, PlayLevel } from "../../shared/play.ts";
import type { ArtifactRendererProps } from "../studio/renderers.ts";
import { PlaySession } from "./PlaySession.tsx";
import { playApi } from "./client.ts";

import { MIN_BOX, PLAY_HEARD } from "./core/box.ts";
import { playLangOf } from "./lessonLang.ts";
import type { DressedSpec } from "./engines/core3d/api.ts";
import { prefetchEngine } from "./engines/registry.ts";

/** The certification harness (server/forge3/play-cert.js) sets this on its own page to judge a chosen renderer and theme;
 *  nothing in the app sets it. Absent = the device decides (the tier), as for every child. */
interface CertForce { render: "2d" | "3d"; theme?: string; wrapper?: string }
const certForce = (): CertForce | null => {
  if (typeof window === "undefined") return null;
  const f = (window as unknown as { __taxilaPlayRender?: CertForce }).__taxilaPlayRender;
  return f && (f.render === "2d" || f.render === "3d") ? f : null;
};

export default function PlayStudioRenderer(props: ArtifactRendererProps) {
  const art = (props.artifact as unknown as PlayArtifact).play;
  const [state, setState] = useState<{ sid: string; level: PlayLevel; art: ArtId; dress: DressedSpec | null; render2d: boolean } | null>(null);
  const [heard, setHeard] = useState<{ id: number; text: string } | null>(null);
  const small = props.px.w < MIN_BOX.w || props.px.h < MIN_BOX.h;
  useEffect(() => {
    if (small) { props.onEvent({ type: "error", reason: "runtime", message: "layout" }); return; }
    const ac = new AbortController();
    // the engine chunk loads while the level is fetched (a 3D-capable device then mounts without a second wait)
    prefetchEngine(art.family, art.mode);
    playApi.level({ sessionId: art.sessionId }, ac.signal).then((r) => {
      if (!r) { props.onEvent({ type: "error", reason: "unavailable", message: "play level" }); return; }
      // the server's 3D kill switch (TAXILA_PLAY_3D=off) sends render: "2d": the round-3 view plays, no engine is loaded
      setState({ sid: r.sessionId, level: r.level, art: r.art.art, dress: r.dress ?? null, render2d: r.render === "2d" });
      props.onEvent({ type: "ready" });
    });
    return () => ac.abort();
    // a new session is a new piece
  }, [art.sessionId, small]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let n = 0;
    const on = (e: Event) => { const t = (e as CustomEvent<{ text?: string }>).detail?.text; if (typeof t === "string" && t.trim()) setHeard({ id: ++n, text: t.slice(0, 120) }); };
    window.addEventListener(PLAY_HEARD, on);
    return () => window.removeEventListener(PLAY_HEARD, on);
  }, []);
  if (small || !state) return null;
  // round 3 integration: the Desk passes the lesson language as the product names it ("english" / "hindi" / "hinglish")
  const lang = playLangOf(props.lang);
  const force = certForce();
  const forcedDress = force?.render === "3d" && force.theme && state.dress ? { ...state.dress, dress: { ...state.dress.dress, theme: force.theme, ...(force.wrapper ? { wrapper: force.wrapper as DressedSpec["dress"]["wrapper"] } : {}) } } : null;
  return (
    <div style={{ width: props.px.w, height: props.px.h, position: "relative" }} data-testid="play-studio">
      <PlaySession sessionId={state.sid} level={state.level} art={state.art} dress={forcedDress ?? state.dress} engine={force?.render ?? (state.render2d ? "2d" : undefined)} preserveDrawing={!!force} lang={lang} classLevel={props.young ? 4 : 6} reducedMotion={props.reducedMotion} embedded heard={heard}
        onActivity={(name, data) => props.onEvent({ type: "interaction", name, data })}
        onToken={(kind, token, seamKind) => props.onEvent({ type: "interaction", name: kind === "evidence" ? "play_evidence" : "play_seam", data: { token, ...(seamKind ? { seam: seamKind } : {}) } })}
        onLevelEnd={(r) => { props.onEvent({ type: "interaction", name: "play_level_end", data: { verdict: r.grade?.verdict ?? null, levelId: r.levelId } }); props.onEvent({ type: "done" }); }}
        onFail={(why) => props.onEvent({ type: "error", reason: "runtime", message: why })} />
    </div>
  );
}
