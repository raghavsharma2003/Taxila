// <PuppetFace>: the style-C 2D puppet in a face slot. A thin React host: the rest-pose poster (the SAME face, painted at
// t = 0, no WebGL), the live stage loaded lazily over it (stage.ts and the judged runtime are a separate chunk, off the
// cold path), and the fallbacks.
//   - before the live puppet is revealed, any failure (no WebGL2, load error / timeout, slow device) → <TutorFace>, the
//     current face, with the same props: the lesson never waits on the puppet and never shows an error;
//   - after reveal, a failure keeps the poster (the same face, still) rather than swapping to a different face mid-lesson
//     (TutorFace's rule: no fallback ever changes the face). A page that saw a failure starts later mounts on the
//     fallback directly (failedThisPage), so a remount does not re-download against her TTS audio.
// The AI disclosure ("<name>, AI teacher") is on the host on every path, never on the GPU.
import { useEffect, useRef, useState } from "react";
import { TutorFace, faceTutor } from "../avatar/TutorFace.tsx";
import { p as copy } from "../avatar/picker/copy.ts";
import type { FloorStatus } from "../avatar/behaviour.ts";
import type { TapSource } from "../avatar/tap.ts";
import { PUPPET_POSTER } from "./assets.ts";
import type { PuppetStage, PuppetStageEvent } from "./stage.ts";

export interface PuppetFaceProps {
  tutorId: string;
  band: string;
  status: FloorStatus | null;
  teacher: TapSource[];
  mic?: { readonly value: number };
  reducedMotion?: boolean;
  framing?: "medium" | "close";
  /** Poster only (cards, several faces on one screen): no WebGL context. */
  still?: boolean;
  lang?: string;
  className?: string;
  onEvent?: (e: PuppetStageEvent) => void;
}

let failedThisPage: string | null = null;
export const puppetFailedThisPage = () => failedThisPage;
/** Tests / the owner's retry: forget a failure. */
export function resetPuppetFailure(): void {
  failedThisPage = null;
}

/** The tutors the puppet IS: concept C is Asha (look "teal", Diya's voice). Any other tutor keeps their own face. */
export const PUPPET_TUTORS: ReadonlySet<string> = new Set(["asha"]);

export function PuppetFace(p: PuppetFaceProps) {
  const tutor = faceTutor(p.tutorId, p.band);
  const label = `${tutor.displayName.roman}, ${copy("aiTeacher", p.lang ?? "english")}`;
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<PuppetStage | null>(null);
  const [phase, setPhase] = useState<"poster" | "live" | "fallback" | "held">(failedThisPage ? "fallback" : "poster");
  const live = useRef({ status: p.status, mic: p.mic, reducedMotion: !!p.reducedMotion });
  live.current = { status: p.status, mic: p.mic, reducedMotion: !!p.reducedMotion };
  const onEvent = useRef(p.onEvent);
  onEvent.current = p.onEvent;
  const revealed = useRef(false);

  useEffect(() => {
    if (p.still || phase === "fallback" || !host.current) return;
    let cancelled = false;
    let micTimer = 0;
    const el = host.current;
    const fail = (reason: string) => {
      if (cancelled) return;
      failedThisPage = reason;
      onEvent.current?.({ type: "fallback", reason });
      stage.current?.dispose();
      stage.current = null;
      setPhase(revealed.current ? "held" : "fallback");
    };
    import("./stage.ts")
      .then(async ({ PuppetStage }) => {
        if (cancelled) return;
        const s = new PuppetStage(el, {
          band: p.band, sources: p.teacher, framing: p.framing ?? "medium", reducedMotion: live.current.reducedMotion,
          seed: [...tutor.id].reduce((a, c) => a + c.charCodeAt(0), 0),
          onEvent: (e) => {
            onEvent.current?.(e);
            if (cancelled) return;
            if (e.type === "reveal") { revealed.current = true; setPhase("live"); }
            else if (e.type === "fallback") fail(e.reason);
          },
        });
        stage.current = s;
        await s.init();
        if (cancelled) return;
        s.set({ status: live.current.status, reducedMotion: live.current.reducedMotion });
        s.start();
        micTimer = window.setInterval(() => s.set({ childLevel: live.current.mic?.value ?? 0 }), 50);
        if (import.meta.env?.DEV || (typeof location !== "undefined" && /[?&]facerig=1/.test(location.search))) (window as unknown as { __puppet?: PuppetStage }).__puppet = s;
      })
      .catch((err: unknown) => fail(`puppet failed: ${String(err).slice(0, 160)}`));
    return () => {
      cancelled = true;
      window.clearInterval(micTimer);
      stage.current?.dispose();
      stage.current = null;
    };
    // rebuilt only when the person, the framing or the meters change; status and motion flow through set()
  }, [p.still, tutor.id, p.framing, p.teacher, phase === "fallback"]);

  useEffect(() => {
    stage.current?.set({ status: p.status, reducedMotion: !!p.reducedMotion });
  }, [p.status, p.reducedMotion]);

  if (phase === "fallback" && !p.still) {
    return (
      <TutorFace tutorId={p.tutorId} band={p.band} status={p.status} teacher={p.teacher} mic={p.mic} reducedMotion={p.reducedMotion}
        framing={p.framing} lang={p.lang} className={p.className} />
    );
  }
  return (
    <div ref={host} className={`fp-host ${p.className ?? ""}`} data-face="puppet2d" data-phase={p.still ? "still" : phase} data-tutor={tutor.id}
      role="img" aria-label={label} style={{ position: "relative", overflow: "hidden", width: "100%", height: "100%" }}>
      <img src={PUPPET_POSTER} alt="" aria-hidden="true" draggable={false} decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}
