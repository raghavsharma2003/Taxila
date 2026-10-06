// StudioFrame: a gate-passed build in the child's lesson (LIVE-STUDIO §5.1, §4.4; BUILD-PLAN W2-H #1). The StudioStage
// renderer for `frame` artifacts.
//
//   - The bytes: fetched by sha from /api/studio/build and RE-HASHED here; a mismatch is never mounted.
//   - The document: assembled by kit/bundle.ts (studio-kit@1 runtime + the fragment, hash-only meta CSP, no network).
//   - The frame: `sandbox="allow-scripts"` and srcdoc: an opaque origin with no cookies, storage, forms, popups, top
//     navigation or same-origin access. The host transfers ONE MessagePort in the `studio:init` message after load and
//     listens only on that port; page-level messages from the frame are ignored, and a second load (the frame navigated)
//     drops the build.
//   - Grading: Studio.answer posts the child's value; the HOST grades it (/api/studio/answer) and sends the verdict back.
//   - Sizing: the frame is laid out at the build's design size and scaled to the stage box with a transform, so a build
//     designed at 360 x 320 looks the same on every screen and can never overflow the box.
//   - Failure: a frame that does not say ready within 5 s, errors, or violates its CSP reports `error` (with its reason) to
//     the stage, which swaps in the skeleton-as-activity (the child sees a correct activity, never an error). Only a csp,
//     runtime or navigation failure counts against the build on the server; a slow device (`not_ready`) never does.
import { useEffect, useRef, useState } from "react";
import type { ArtifactRendererProps } from "./renderers.ts";
import { frameDocument } from "./kit/bundle.ts";
import { fillStrings } from "./kit/runtime.ts";
import { studioApi } from "./useStudio.ts";
import { useStageMoment } from "./stageContext.ts";

const READY_MS = 5000;

export function StudioFrame({ artifact, px, design, lang, onEvent }: ArtifactRendererProps<"frame">) {
  const m = useStageMoment();
  const [doc, setDoc] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const emit = useRef(onEvent);
  emit.current = onEvent;
  const answerRef = useRef(m.answer);
  answerRef.current = m.answer;

  // the bytes → the document (re-keyed on "Show me again": a fresh runtime and a fresh frame)
  useEffect(() => {
    let live = true;
    setDoc(null);
    void (async () => {
      const b = await studioApi.build(artifact.src);
      if (!live) return;
      if (!b) { emit.current({ type: "error", message: "build unavailable", reason: "unavailable" }); return; }
      const d = await frameDocument({ fragment: b.fragment, sha256: artifact.sha256, stage: design, params: (artifact.params ?? {}) as Record<string, unknown>,
        strings: fillStrings(artifact.strings ?? {}), lang, seed: 1 + m.epoch });
      if (!live) return;
      if (!d) { emit.current({ type: "error", message: "build bytes did not match", reason: "bytes" }); return; }
      setDoc(d.html);
    })();
    return () => { live = false; };
  }, [artifact.src, artifact.sha256, design.w, design.h, lang, m.epoch]); // eslint-disable-line react-hooks/exhaustive-deps

  // the handshake, the port, the ready watchdog
  useEffect(() => {
    const f = frameRef.current;
    if (!doc || !f) return;
    let loads = 0, ready = false, dead = false;
    type Why = "csp" | "runtime" | "navigated" | "not_ready";
    const fail = (message: string, reason: Why) => { if (dead) return; dead = true; portRef.current?.close(); portRef.current = null; emit.current({ type: "error", message, reason }); };
    // a slow device is not a broken build: `not_ready` swaps in the skeleton for this child only (the server never counts it)
    const timer = setTimeout(() => { if (!ready) fail("frame not ready", "not_ready"); }, READY_MS);
    const onLoad = () => {
      loads++;
      if (loads > 1) { fail("frame navigated", "navigated"); return; }
      const ch = new MessageChannel();
      portRef.current = ch.port1;
      ch.port1.onmessage = async (e) => {
        const msg = e.data;
        if (dead || !msg || typeof msg !== "object") return;
        switch (msg.type) {
          case "ready": ready = true; clearTimeout(timer); emit.current({ type: "ready" }); break;
          case "done": emit.current({ type: "done" }); break;
          case "event": emit.current({ type: "interaction", name: String(msg.name ?? "").slice(0, 32) }); break;
          case "answer": {
            emit.current({ type: "answer", value: msg.value });
            const r = await answerRef.current(msg.value, typeof msg.itemId === "string" && msg.itemId ? { itemId: msg.itemId.slice(0, 24) } : undefined);
            // no verdict (network): the build simply waits, as a child's teacher would
            if (r && !dead) ch.port1.postMessage({ type: "verdict", correct: !!r.correct });
            break;
          }
          case "error": fail("frame error", "runtime"); break;
          case "csp": fail("frame csp", "csp"); break;
          default: break;
        }
      };
      f.contentWindow?.postMessage({ type: "studio:init" }, "*", [ch.port2]);
    };
    f.addEventListener("load", onLoad);
    return () => { clearTimeout(timer); f.removeEventListener("load", onLoad); portRef.current?.close(); portRef.current = null; };
  }, [doc]);

  const scale = px.w / design.w;
  return (
    <div className="st-frame" style={{ width: px.w, height: px.h }} data-testid="studio-frame">
      {doc && (
        <iframe ref={frameRef} title={artifact.strings?.title ?? "activity"} sandbox="allow-scripts" srcDoc={doc} referrerPolicy="no-referrer"
          style={{ width: design.w, height: design.h, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0, display: "block", pointerEvents: m.interactive ? "auto" : "none" }} />
      )}
    </div>
  );
}
