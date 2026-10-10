// <PuppetFace>: the style-C 2D puppet in a face slot. A thin React host: the rest-pose poster (the SAME face, painted at
// t = 0, no WebGL), the live stage loaded lazily over it (stage.ts and the judged runtime are a separate chunk, off the
// cold path), and the fallbacks.
//   - before the live puppet is revealed, any failure (no WebGL2, load error / timeout, slow device) → <TutorFace>, the
//     current face, with the same props: the lesson never waits on the puppet and never shows an error;
//   - after reveal, a failure keeps the poster (the same face, still) rather than swapping to a different face mid-lesson
//     (TutorFace's rule: no fallback ever changes the face). A page that saw a failure starts later mounts on the
//     fallback directly (failedThisPage), so a remount does not re-download against her TTS audio.
//   - the lamp1 look (round 4, the grown-up Asha): EVERY fallback is her lamp1 still, before or after reveal, never
//     TutorFace's Plate2D vector, so no path ever shows the old face (BUILD-PLAN §3.5 Part B).
// The look (./look.ts) is fixed per mount: the device's ?look=, else the server's TAXILA_FACE_LOOK. Until it is known
// (a first visit) the host paints only the backdrop; it never paints one look and then swaps to another.
// The AI disclosure ("<name>, AI teacher") is on the host on every path, never on the GPU.
import { useEffect, useMemo, useRef, useState } from "react";
import { TutorFace, faceTutor } from "../avatar/TutorFace.tsx";
import { p as copy } from "../avatar/picker/copy.ts";
import type { Emotion, FloorStatus } from "../avatar/behaviour.ts";
import type { TapSource } from "../avatar/tap.ts";
import { DEFAULT_LOOK, lookBackground, puppetPoster, type PuppetLook } from "./assets.ts";
import { puppetForcedOn, puppetServerAllows } from "./flag.ts";
import { faceLook, faceLookNow } from "./look.ts";
import { puppetBus } from "./bus.ts";
import "./latch.ts"; // the page's safety latch listens from the first face mount, before the stage chunk loads
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
  /** A Director affect window (TutorFace's `affect` prop: ReactionGate-gated upstream), armed for her next onset. */
  affect?: Emotion | null;
  gentle?: boolean;
  className?: string;
  onEvent?: (e: PuppetStageEvent) => void;
}

let failedThisPage: string | null = null;
export const puppetFailedThisPage = () => failedThisPage;
/** Tests / the owner's retry: forget a failure. */
export function resetPuppetFailure(): void {
  failedThisPage = null;
}

// Tap sources keyed by identity (TutorFace's sourcesKey rule): callers pass a fresh array literal per render
// (Hello: `meters={[clip.meter]}`, Teacher.tsx: `p.meters ?? []`), and a stage keyed on the ARRAY would be disposed and
// rebuilt (new WebGL context, pack reload, poster flash) on every parent re-render. Review v4, 2026-10-05.
const meterIds = new WeakMap<object, number>();
let nextMeterId = 1;
export function sourcesKey(list: readonly TapSource[]): string {
  return list.map((m) => {
    let id = meterIds.get(m as object);
    if (!id) meterIds.set(m as object, (id = nextMeterId++));
    return id;
  }).join(",");
}

// Review v4 (2026-10-05): a revealed stage is PARKED on unmount for PARK_MS and adopted by the next mount of the same
// teacher (same tutor, band and meters), instead of being disposed and rebuilt. The lesson's Face <-> Work layout switch
// unmounts TeacherWindow's face and mounts SpeechRow's in one commit (React runs the old cleanup before the new effect),
// and a rebuilt stage shows the still poster over her voice until it reveals: 2.5 s while she talked under the old reveal
// rule, 0.8-1.4 s with the closed-mouth reveal (evals/face-puppet/out/remount-*.json). Adopted: 0 ms, the same context.
const PARK_MS = 1500;
let parked: { stage: PuppetStage; key: string; timer: number } | null = null;
function park(stage: PuppetStage, key: string): void {
  if (parked) { window.clearTimeout(parked.timer); parked.stage.dispose(); }
  stage.stop();
  stage.canvas.remove();
  const timer = window.setTimeout(() => { if (parked?.stage === stage) parked = null; stage.dispose(); }, PARK_MS);
  parked = { stage, key, timer };
}
function adopt(key: string): PuppetStage | null {
  if (!parked || parked.key !== key || !parked.stage.isRevealed) return null;
  const s = parked.stage;
  window.clearTimeout(parked.timer);
  parked = null;
  return s;
}

/** The tutors the puppet IS: Asha (Diya's voice), the one teacher for every class since round 4
 *  (dc-r4-single-teacher-asha). Arjun is parked and has no puppet art: a lesson pinned to him before round 4 keeps
 *  TutorFace (his 3D head / plate) until it ends, so no lesson ever swaps faces. */
export const PUPPET_TUTORS: ReadonlySet<string> = new Set(["asha"]);

/** A look whose every fallback is its own still (never TutorFace): the grown-up Asha (lamp1, lamp2). */
export const holdsOwnStill = (look: PuppetLook | null): boolean => look === "lamp1" || look === "lamp2";

export function PuppetFace(p: PuppetFaceProps) {
  const tutor = faceTutor(p.tutorId, p.band);
  const label = `${tutor.displayName.roman}, ${copy("aiTeacher", p.lang ?? "english")}`;
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<PuppetStage | null>(null);
  const [look, setLook] = useState<PuppetLook | null>(() => faceLookNow());
  const [phase, setPhase] = useState<"poster" | "live" | "fallback" | "held">(() => (failedThisPage ? (holdsOwnStill(faceLookNow()) ? "held" : "fallback") : "poster"));
  useEffect(() => {
    if (look) return;
    let alive = true;
    faceLook().then((l) => {
      if (!alive) return;
      setLook(l);
      if (failedThisPage && holdsOwnStill(l)) setPhase("held");
    });
    return () => {
      alive = false;
    };
  }, [look]);
  const stageOff = phase === "fallback" || phase === "held";
  const live = useRef({ status: p.status, mic: p.mic, reducedMotion: !!p.reducedMotion });
  live.current = { status: p.status, mic: p.mic, reducedMotion: !!p.reducedMotion };
  const onEvent = useRef(p.onEvent);
  onEvent.current = p.onEvent;
  const revealed = useRef(false);
  const srcKey = sourcesKey(p.teacher);
  const sources = useMemo(() => p.teacher, [srcKey]); // the key IS the dependency

  useEffect(() => {
    if (p.still || stageOff || !host.current || !look) return;
    let cancelled = false;
    let micTimer = 0;
    let failed = false;
    const el = host.current;
    const parkKey = `${tutor.id}|${look}|${p.band}|${srcKey}`;
    const fail = (reason: string) => {
      if (cancelled) return;
      failed = true;
      failedThisPage = reason;
      onEvent.current?.({ type: "fallback", reason });
      stage.current?.dispose();
      stage.current = null;
      setPhase(revealed.current || holdsOwnStill(look) ? "held" : "fallback");
    };
    const handler = (e: PuppetStageEvent) => {
      onEvent.current?.(e);
      if (cancelled) return;
      if (e.type === "reveal") { revealed.current = true; setPhase("live"); }
      else if (e.type === "fallback") fail(e.reason);
    };
    const cleanup = () => {
      cancelled = true;
      window.clearInterval(micTimer);
      const s = stage.current;
      stage.current = null;
      if (s && !failed && s.isRevealed) park(s, parkKey);
      else s?.dispose();
    };
    const kept = adopt(parkKey);
    if (kept) {
      kept.attach(el, p.framing ?? "medium", handler);
      stage.current = kept;
      kept.set({ status: live.current.status, reducedMotion: live.current.reducedMotion });
      kept.start();
      revealed.current = true;
      setPhase("live");
      micTimer = window.setInterval(() => kept.set({ childLevel: live.current.mic?.value ?? 0 }), 50);
      return cleanup;
    }
    // the stage chunk and the server's kill switch (TAXILA_FACE_PUPPET2D) in parallel: a kill lands on TutorFace, the
    // same automatic fallback as any pre-reveal failure (ship5 p2-face)
    Promise.all([import("./stage.ts"), puppetServerAllows()])
      .then(async ([{ PuppetStage }, allowed]) => {
        if (cancelled) return;
        if (!allowed && !puppetForcedOn()) { fail("off: server kill switch (TAXILA_FACE_PUPPET2D=0)"); return; }
        const s = new PuppetStage(el, {
          look, band: p.band, sources, framing: p.framing ?? "medium", reducedMotion: live.current.reducedMotion,
          seed: [...tutor.id].reduce((a, c) => a + c.charCodeAt(0), 0),
          onEvent: handler,
        });
        stage.current = s;
        await s.init();
        if (cancelled) return;
        s.set({ status: live.current.status, reducedMotion: live.current.reducedMotion });
        s.start();
        micTimer = window.setInterval(() => s.set({ childLevel: live.current.mic?.value ?? 0 }), 50);
        // the owner's ?facerig=1 read-out and the acceptance test: the live stage and the puppet bus on window
        if (import.meta.env?.DEV || (typeof location !== "undefined" && /[?&]facerig=1/.test(location.search))) Object.assign(window as object, { __puppet: s, __puppetBus: puppetBus });
      })
      .catch((err: unknown) => fail(`puppet failed: ${String(err).slice(0, 160)}`));
    return cleanup;
    // rebuilt only when the person, the framing or the meters change; status and motion flow through set()
  }, [p.still, tutor.id, p.framing, sources, stageOff, look]);

  useEffect(() => {
    stage.current?.set({ status: p.status, reducedMotion: !!p.reducedMotion, gentle: !!p.gentle });
  }, [p.status, p.reducedMotion, p.gentle]);

  useEffect(() => {
    if (p.affect) stage.current?.driver.affect(p.affect, 1, performance.now());
  }, [p.affect]);

  if (phase === "fallback" && !p.still && !holdsOwnStill(look)) {
    return (
      <TutorFace tutorId={p.tutorId} band={p.band} status={p.status} teacher={p.teacher} mic={p.mic} reducedMotion={p.reducedMotion}
        gentle={p.gentle} affect={p.affect ?? null} framing={p.framing} lang={p.lang} className={p.className} />
    );
  }
  return (
    <div ref={host} className={`fp-host ${p.className ?? ""}`} data-face="puppet2d" data-phase={p.still ? "still" : phase} data-tutor={tutor.id}
      data-look={look ?? "pending"} role="img" aria-label={label}
      style={{ position: "relative", overflow: "hidden", width: "100%", height: "100%", background: lookBackground(look ?? DEFAULT_LOOK) }}>
      {look && <img src={puppetPoster(p.framing ?? "medium", look)} alt="" aria-hidden="true" draggable={false} decoding="async"
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "auto", display: "block" }} />}
    </div>
  );
}
