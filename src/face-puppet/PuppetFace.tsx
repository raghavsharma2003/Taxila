// <PuppetFace>: Asha's 2D puppet in a face slot. A thin React host: the rest-pose poster (the SAME face, painted at t = 0,
// no WebGL), the live stage loaded lazily over it (stage.ts and the judged runtime are a separate chunk, off the cold
// path), and the one fallback: her own still.
//   - ANY failure, before or after reveal (no WebGL2, load error / timeout, slow device, the server's kill switch), holds
//     the look's own rest still. No path ever swaps her to another face (round 7 face-r8-fallback-swaps-person: r8 used to
//     drop to TutorFace's Plate2D vector before reveal, a different-looking person). A page that saw a failure starts
//     later mounts on the still directly (failedThisPage), so a remount does not re-download against her TTS audio.
// Weak devices and the start (round 7 face-puppet-raster-cost-main-thread, ./lite.ts): the live stage is built only once
// it is ARMED (her first audio, an idle page outside a lesson, or a fallback timer), so its chunk, pack decode and warm-up
// never compete with Start → her first sound; and never on a device the static gate sends to the lite path (no WebGL2,
// software raster, known-bad GPU). Until the stage reveals, and on the lite path for good, a live slot shows her rest still
// with the LIGHT MOUTH (<LiteLayer>: pre-rendered mouths of the same face, swapped at 15 Hz from her output meter).
// The look (./look.ts) is fixed per mount: the device's ?look=, else the server's TAXILA_FACE_LOOK. Until it is known
// (a first visit) the host paints only the backdrop; it never paints one look and then swaps to another.
// The AI disclosure ("<name>, AI teacher") is on the host on every path, never on the GPU.
import { useEffect, useMemo, useRef, useState } from "react";
import { faceTutor } from "../avatar/TutorFace.tsx";
import { p as copy } from "../avatar/picker/copy.ts";
import type { Emotion, FloorStatus } from "../avatar/behaviour.ts";
import type { TapSource } from "../avatar/tap.ts";
import { DEFAULT_LOOK, lookBackground, puppetPoster, type PuppetLook } from "./assets.ts";
import { faceJawEnabled, faceReactEnabled, puppetForcedOn, puppetServerAllows, rigWorkerEnabled } from "./flag.ts";
import { faceLook, faceLookNow } from "./look.ts";
import { LIVE_ARM_FALLBACK_MS, armLive, liteGate } from "./lite.ts";
import { LiteLayer } from "./LiteLayer.tsx";
import { puppetBus } from "./bus.ts";
import { HANDOFF_PARK_MS, canHandOff, handoffKey, prewarmStills } from "./prewarm.ts";
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
  /** The name the child gave her; default the character's own (the accessible "<name>, AI teacher"; audit FACE-06). */
  name?: string;
  /** A Director affect window (TutorFace's `affect` prop: ReactionGate-gated upstream), armed for her next onset. */
  affect?: Emotion | null;
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
// round 7 face-prewarm-for-first-sound (./prewarm.ts): a worker-backed stage waits HANDOFF_PARK_MS instead, and a face of
// the same person, look and band adopts it with its own meters (the home's face becomes the lesson's).
let parked: { stage: PuppetStage; key: string; hand: string; timer: number } | null = null;
function park(stage: PuppetStage, key: string, hand: string): void {
  if (parked) { window.clearTimeout(parked.timer); parked.stage.dispose(); }
  stage.park(); // stops, leaves the DOM and hands the running slot back to a face it suspended (stage.ts yieldSlot)
  const timer = window.setTimeout(() => { if (parked?.stage === stage) parked = null; stage.dispose(); }, canHandOff(stage) ? HANDOFF_PARK_MS : PARK_MS);
  parked = { stage, key, hand, timer };
}
function adopt(key: string, hand: string, sources: TapSource[]): PuppetStage | null {
  if (!parked || !parked.stage.isRevealed) return null;
  if (parked.key !== key) {
    if (parked.hand !== hand || !canHandOff(parked.stage)) return null;
    parked.stage.retarget(sources);
  }
  const s = parked.stage;
  window.clearTimeout(parked.timer);
  parked = null;
  return s;
}
/** Whether a stage is parked now, and whether it can be handed off (the ?facerig read-out and the evals). */
export const parkedStage = () => (parked ? { key: parked.key, hand: parked.hand, handOff: canHandOff(parked.stage) } : null);

/** The tutors the puppet IS: Asha (Diya's voice), the one teacher for every class since round 4
 *  (dc-r4-single-teacher-asha). Arjun is parked and has no puppet art: a lesson pinned to him before round 4 keeps
 *  TutorFace (his 3D head / plate) until it ends, so no lesson ever swaps faces. */
export const PUPPET_TUTORS: ReadonlySet<string> = new Set(["asha"]);

export function PuppetFace(p: PuppetFaceProps) {
  const tutor = faceTutor(p.tutorId, p.band);
  const label = `${p.name?.trim() || tutor.displayName.roman}, ${copy("aiTeacher", p.lang ?? "english")}`;
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<PuppetStage | null>(null);
  const [look, setLook] = useState<PuppetLook | null>(() => faceLookNow());
  const [phase, setPhase] = useState<"poster" | "live" | "held">(() => (failedThisPage ? "held" : "poster"));
  useEffect(() => {
    if (look) return;
    let alive = true;
    faceLook().then((l) => {
      if (!alive) return;
      setLook(l);
    });
    return () => {
      alive = false;
    };
  }, [look]);
  const stageOff = phase === "held";
  // arming the live stage (./lite.ts armLive): her first audio, an idle page with no lesson status, or the fallback timer
  const [armed, setArmed] = useState(false);
  const spoke = useRef(false);
  if (p.status === "speaking") spoke.current = true;
  const mountedAt = useRef(performance.now());
  const idle = useRef(false);
  useEffect(() => {
    if (armed || p.still) return;
    const check = () => {
      if (armLive({ status: p.status, spokeYet: spoke.current, sinceMountMs: performance.now() - mountedAt.current, idle: idle.current })) setArmed(true);
    };
    check();
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const ric = w.requestIdleCallback ? w.requestIdleCallback(() => { idle.current = true; check(); }, { timeout: 2500 }) : window.setTimeout(() => { idle.current = true; check(); }, 1200);
    const t = window.setTimeout(check, Math.max(0, LIVE_ARM_FALLBACK_MS - (performance.now() - mountedAt.current)) + 20);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(ric); else window.clearTimeout(ric);
      window.clearTimeout(t);
    };
  }, [armed, p.still, p.status]);
  // the other framing's poster and the light-mouth sprites, decoded at idle (./prewarm.ts)
  useEffect(() => {
    if (!look || p.still) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) { const h = w.requestIdleCallback(() => prewarmStills(look), { timeout: 4000 }); return () => w.cancelIdleCallback?.(h); }
    const h = window.setTimeout(() => prewarmStills(look), 1500);
    return () => window.clearTimeout(h);
  }, [look, p.still]);
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
    const hand = handoffKey(tutor.id, look, p.band);
    const parkKey = `${hand}|${srcKey}`;
    const fail = (reason: string) => {
      if (cancelled) return;
      failed = true;
      failedThisPage = reason;
      onEvent.current?.({ type: "fallback", reason });
      stage.current?.dispose();
      stage.current = null;
      setPhase("held");
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
      if (s && !failed && s.isRevealed) park(s, parkKey, hand);
      else s?.dispose();
    };
    const kept = adopt(parkKey, hand, sources);
    if (!kept && !armed) return cleanup;
    if (!kept) {
      const g = liteGate(look);
      if (g.lite) {
        onEvent.current?.({ type: "fallback", reason: `lite: ${g.why}` });
        setPhase("held");
        return cleanup;
      }
    }
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
    // the stage chunk and the server's kill switch (TAXILA_FACE_PUPPET2D) in parallel: a kill holds her still, the same
    // automatic fallback as any other failure
    Promise.all([import("./stage.ts"), puppetServerAllows()])
      .then(async ([{ PuppetStage }, allowed]) => {
        if (cancelled) return;
        if (!allowed && !puppetForcedOn()) { fail("off: server kill switch (TAXILA_FACE_PUPPET2D=0)"); return; }
        const s = new PuppetStage(el, {
          look, band: p.band, sources, framing: p.framing ?? "medium", reducedMotion: live.current.reducedMotion, jaw: faceJawEnabled(), worker: rigWorkerEnabled(), react: faceReactEnabled(),
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
  }, [p.still, tutor.id, p.framing, sources, stageOff, look, armed]);

  useEffect(() => {
    stage.current?.set({ status: p.status, reducedMotion: !!p.reducedMotion });
  }, [p.status, p.reducedMotion]);

  useEffect(() => {
    if (p.affect) stage.current?.driver.affect(p.affect, 1, performance.now());
  }, [p.affect]);

  return (
    <div ref={host} className={`fp-host ${p.className ?? ""}`} data-face="puppet2d" data-phase={p.still ? "still" : phase} data-tutor={tutor.id}
      data-look={look ?? "pending"} role="img" aria-label={label}
      style={{ position: "relative", overflow: "hidden", width: "100%", height: "100%", background: lookBackground(look ?? DEFAULT_LOOK) }}>
      {look && <img src={puppetPoster(p.framing ?? "medium", look)} alt="" aria-hidden="true" draggable={false} decoding="async"
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "auto", display: "block" }} />}
      {look && !p.still && phase !== "live" && <LiteLayer look={look} framing={p.framing ?? "medium"} sources={sources} status={p.status} />}
    </div>
  );
}
