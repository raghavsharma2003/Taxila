// <TutorFace>: the tutor on the lesson stage (AVATAR.md §2.4, M0). A thin React wrapper that picks the face tier
// and mounts the framework-free 3D stage imperatively; three.js is imported only by ./three/stage3d.ts, loaded
// with a dynamic import on first mount, so neither the cold path nor the lesson route chunk grows.
//
// Tier B / B-lite → the procedural 3D head; D → the 2D plate of the same person; E → voice-only ring.
// Falls to D on: no WebGL2 / known-bad GPU (static facts), a failed probe, a governor demotion, a lost context,
// or a failed chunk load. Reduced motion keeps lips and blinks and scales head and expressions × 0.3.
//
// Callers (rules from §2.4): never mute or re-route the teacher audio; never pass sentence-shaped text; the face
// never reads anything about the child beyond the band.
//
// face.rig ON (./flags.ts, default off; BUILD-PLAN W1-F): the tutor's look (shared/tutors.js lookId) replaces both
// pre-rig faces on every tier — B / B-lite → the look's GLB (B+ / B-lite) over the look's own plate; D → that plate
// alone (PlatePerson); E unchanged. The plate paints at t = 0; the GLB loads after mount when the page is idle
// (off the cold path), times out at 8 s, and cross-fades in only in her silence. A rig that failed (timeout, load
// error, chunk error, demotion to D) is remembered for the rest of the PAGE by look id (rigFailedThisPage), so a
// remount (the desk changing layout) stays on the plate instead of re-downloading the GLB against her TTS audio;
// a new page load (the next lesson) tries again. Any rig failure falls to D, which is the SAME look: no fallback ever changes the face.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { defaultTutorFor, tutorById, type TutorCharacter } from "../../shared/tutors.js";
import { p as copy } from "./picker/copy.ts";
import type { BandKey, Emotion, FloorStatus } from "./behaviour.ts";
import { Plate2D } from "./Plate2D.tsx";
import { PlatePerson } from "./PlatePerson.tsx";
import { faceRigEnabled } from "./flags.ts";
import { lookFor } from "./looks.ts";
import type { TapSource } from "./tap.ts";
import { detectStaticFacts, staticTier, tierOverride, type FaceTier, type TierDecision } from "./tier.ts";
import type { Stage3D, StageEvent } from "./three/stage3d.ts";
import "./avatar.css";

export interface TutorFaceProps {
  tutorId: string | null | undefined;
  band: BandKey | string;
  /** The four-state lesson status (statusOf), or null outside a live lesson (idle). */
  status: FloorStatus | null;
  /** Her output meters: the link's teacher LevelMeter (and the replay meter). */
  teacher: TapSource[];
  /** The child's mic level. */
  mic?: { readonly value: number };
  reducedMotion?: boolean;
  /** "Gentle face": head and lower-face expression × 0.5. */
  gentle?: boolean;
  framing?: "medium" | "close";
  /** Force a tier (dev/test; `?face=` in the URL does the same). */
  tier?: FaceTier;
  /** A delight / affect window from the Director's ReactionGate (one fixed intensity). */
  affect?: Emotion | null;
  onEvent?: (e: StageEvent | { type: "fallback"; to: FaceTier; reason: string }) => void;
  className?: string;
  style?: CSSProperties;
  /** Skip the 2 s probe (tests). */
  noProbe?: boolean;
  /** UI language for the accessible "<name>, AI teacher" on every tier. */
  lang?: string;
  /** The child's "voice and board only" presentation (prefs.face === "voice") → tier E. */
  voiceOnly?: boolean;
}

let cachedFacts: ReturnType<typeof detectStaticFacts> | null = null;
let contextLosses = 0;
/** WebGL contexts lost by LIVE stages this page (a disposed stage never reports one). */
export const faceContextLosses = () => contextLosses;
/** Look ids whose rig failed or was demoted to D on this page: later mounts start on the plate (tier D). */
const rigFailedThisPage = new Set<string>();
export const faceRigFailed = (lookId: string) => rigFailedThisPage.has(lookId);
if (import.meta.env?.DEV && typeof window !== "undefined") (window as unknown as { __faceContextLosses?: () => number }).__faceContextLosses = faceContextLosses;

/** `?face=` is a dev/test override: honoured only in dev builds or with VITE_DEV_ROUTES=1, never in production. */
const OVERRIDE_OK = !!import.meta.env?.DEV || import.meta.env?.VITE_DEV_ROUTES === "1";

/**
 * The tutor for an id, else the class default for the BAND (b1-b2 = classes 1-4 → Asha, b3-b4 = 5-9 → Arjun), the
 * same rule as the server's teacherFor, so an unknown/null id can never put Asha's face over Arjun's voice.
 */
export function faceTutor(id: string | null | undefined, band: string): TutorCharacter {
  return tutorById(id) ?? tutorById(defaultTutorFor({ class_level: band === "b3" || band === "b4" ? 5 : 1 }))!;
}

/** Battery, read once per page as soon as this module loads (async API; the first decision after it resolves uses
 *  it). Applied to the START tier only, never as a repeating signal (tier.ts rules). */
let battery: { level: number; charging: boolean } | null = null;
try {
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> }) : null;
  nav?.getBattery?.().then((b) => (battery = { level: b.level, charging: b.charging }), () => {});
} catch {
  /* no Battery API */
}

/** The stage-1 decision for this browser, computed once per page. */
export function decideTier(override?: FaceTier | null, opts: { voiceOnly?: boolean } = {}): TierDecision {
  const forced = override ?? (OVERRIDE_OK && typeof location !== "undefined" ? tierOverride(location.search) : null);
  if (forced) {
    const fps = forced === "B" ? { speaking: 30, listening: 30, idle: 20 } : { speaking: 20, listening: 20, idle: 15 };
    return { tier: forced, pixelRatio: forced === "B" ? Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 1.25) : 1, fps, why: ["override"] };
  }
  cachedFacts ??= detectStaticFacts();
  return staticTier({ ...cachedFacts, contextLosses, battery, voiceOnly: !!opts.voiceOnly });
}

/** The rig look for a tutor when face.rig is on and the look ships everything the lesson path needs, else null. */
export function rigLookFor(tutor: TutorCharacter, enabled = faceRigEnabled()) {
  if (!enabled) return null;
  const look = lookFor(tutor);
  return look && look.plate?.files && look.tiers.Bplus && look.tiers.Blite ? look : null;
}

/** Stable identity for a list of meters, so a caller passing a fresh array literal each render does not rebuild the stage. */
const meterIds = new WeakMap<object, number>();
let nextMeterId = 1;
function sourcesKey(list: TapSource[]): string {
  return list.map((m) => {
    let id = meterIds.get(m);
    if (!id) meterIds.set(m, (id = nextMeterId++));
    return id;
  }).join(",");
}

const bandKey = (b: string): BandKey => (b === "b1" || b === "b2" || b === "b3" || b === "b4" ? b : "b2");

export function TutorFace(p: TutorFaceProps) {
  const tutor: TutorCharacter = faceTutor(p.tutorId, String(p.band));
  const label = `${tutor.displayName.roman}, ${copy("aiTeacher", p.lang ?? "english")}`;
  const look = useMemo(() => rigLookFor(tutor), [tutor.id]);
  const initial = useMemo(() => {
    const d = decideTier(p.tier, { voiceOnly: p.voiceOnly });
    return !p.tier && look && rigFailedThisPage.has(look.id) && (d.tier === "B" || d.tier === "Blite")
      ? { ...d, tier: "D" as FaceTier, why: [...d.why, "rig failed earlier this page"] }
      : d;
  }, [p.tier, p.voiceOnly, look]);
  const [tier, setTier] = useState<FaceTier>(initial.tier);
  useEffect(() => setTier(initial.tier), [initial]); // presentation pref / forced tier changed
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage3D | null>(null);
  const live = useRef({ status: p.status, reducedMotion: !!p.reducedMotion, gentle: !!p.gentle, mic: p.mic });
  live.current = { status: p.status, reducedMotion: !!p.reducedMotion, gentle: !!p.gentle, mic: p.mic };
  const onEvent = useRef(p.onEvent);
  onEvent.current = p.onEvent;
  const [face, setFace] = useState<"plate" | "rig">("plate");

  const srcKey = sourcesKey(p.teacher);
  const sources = useMemo(() => p.teacher, [srcKey]); // the key IS the dependency
  const threeD = tier === "B" || tier === "Blite";
  useEffect(() => {
    if (!threeD || !host.current) return;
    let cancelled = false;
    let mic = 0;
    const el = host.current;
    let idle = 0;
    setFace("plate");
    const fail = (reason: string) => {
      if (cancelled) return;
      if (look) rigFailedThisPage.add(look.id);
      onEvent.current?.({ type: "fallback", to: "D", reason: reason.slice(0, 160) });
      setTier("D");
    };
    const boot = () => import("./three/stage3d.ts")
      .then(({ Stage3D }) => {
        if (cancelled) return;
        const s = new Stage3D(el, {
          tutor, band: bandKey(p.band), decision: { ...initial, tier }, sources, framing: p.framing ?? "medium", noProbe: p.noProbe,
          seed: [...tutor.id].reduce((a, c) => a + c.charCodeAt(0), 0),
          look: look ? { entry: look } : undefined,
          onEvent: (e) => {
            onEvent.current?.(e);
            if (cancelled) return; // a stage already torn down by this effect never counts or re-tiers
            if (e.type === "contextlost") {
              contextLosses++;
              setTier("D");
            } else if (e.type === "tier" && (e.to === "D" || e.to === "E")) {
              if (look) rigFailedThisPage.add(look.id);
              setTier(e.to);
            }
            else if (e.type === "reveal") setFace("rig");
          },
        });
        s.set({ status: live.current.status, reducedMotion: live.current.reducedMotion, gentle: live.current.gentle });
        stage.current = s;
        s.start();
        // child mic level → stage, a few times a second (no React render per frame)
        mic = window.setInterval(() => s.set({ childLevel: live.current.mic?.value ?? 0 }), 100);
        if (look) s.init().catch((err: unknown) => fail(`rig load failed: ${String(err)}`));
      })
      .catch((err: unknown) => fail(`3D chunk failed: ${String(err)}`));
    if (look) {
      // The plate is already the face: the GLB waits for an idle main thread (off the lesson's cold path).
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      idle = ric ? ric(() => void boot(), { timeout: 1500 }) : window.setTimeout(() => void boot(), 300);
    } else void boot();
    return () => {
      cancelled = true;
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idle) (cic ?? window.clearTimeout)(idle);
      window.clearInterval(mic);
      stage.current?.dispose();
      stage.current = null;
    };
    // The stage is rebuilt only when the person or the tier changes; inputs flow through set().
  }, [threeD, tutor.id, p.framing, sources]);

  useEffect(() => {
    stage.current?.set({ status: p.status, reducedMotion: !!p.reducedMotion, gentle: !!p.gentle });
  }, [p.status, p.reducedMotion, p.gentle]);

  useEffect(() => {
    if (p.affect) stage.current?.arm(p.affect, 1);
  }, [p.affect]);

  const cls = `tx-tutorface ${p.className ?? ""}`;
  if (tier === "E") {
    return (
      <div className={`${cls} tx-tutorface--voice`} style={p.style} data-tier="E" data-tutor={tutor.id} role="img" aria-label={label}>
        <VoiceRing sources={sources} color={tutor.look.signatureColor} />
        <span className="tx-tutorface-name" aria-hidden="true">{tutor.displayName.roman}</span>
        <span className="tx-tutorface-ai" aria-hidden="true">{copy("aiTeacher", p.lang ?? "english")}</span>
      </div>
    );
  }
  if (look) {
    // One host for every rig tier: the look's plate underneath (the face at t = 0 and the D tier), the GLB canvas
    // appended over it by Stage3D and shown only once revealed. The AI disclosure is on the host, never the GPU.
    const shown = threeD && face === "rig" ? "rig" : "plate";
    return (
      <div ref={host} className={cls} style={p.style} data-tier={tier} data-tutor={tutor.id} data-look={look.id} data-look-rev={look.rev} data-face={shown}
        role="img" aria-label={label}>
        <PlatePerson tutor={tutor} look={look} sources={sources} reducedMotion={p.reducedMotion} decorative lang={p.lang} paused={shown === "rig"} />
      </div>
    );
  }
  if (tier === "D") {
    return (
      <div className={cls} style={p.style} data-tier="D" data-tutor={tutor.id}>
        <Plate2D tutor={tutor} sources={sources} reducedMotion={p.reducedMotion} className="tx-tutorface-plate" lang={p.lang} />
      </div>
    );
  }
  // The AI disclosure must not depend on the GPU tier: the 3D host carries the same accessible name as D and E.
  return <div ref={host} className={cls} style={p.style} data-tier={tier} data-tutor={tutor.id} role="img" aria-label={label} />;
}

/** Tier E: an RMS ring, name and "AI teacher" (no face at all). */
function VoiceRing({ sources, color }: { sources: TapSource[]; color: string }) {
  const ring = useRef<SVGCircleElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const v = Math.max(0, ...sources.map((s) => s.value));
      ring.current?.setAttribute("r", (30 + v * 10).toFixed(1));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sources]);
  return (
    <svg viewBox="0 0 100 100" className="tx-tutorface-ring" aria-hidden="true">
      <circle ref={ring} cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="5" />
    </svg>
  );
}
