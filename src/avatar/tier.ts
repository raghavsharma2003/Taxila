// Face tiers (AVATAR.md §6): B 3D-lite · B-lite (runtime knobs on the same head) · D 2D plate · E voice-only.
// Three stages: static facts (here), a 2 s probe on the chosen tutor during warm-up (probeVerdict), and ONE
// runtime governor (Governor). Pure where possible; detectStaticFacts() is the only DOM-touching function.
//
// Rules carried from the reviews:
//  - the regex only sends KNOWN-BAD GPUs down; everything else starts at B (P-0: the old regex mis-sorted Mali);
//  - navigator.hardwareConcurrency / deviceMemory are never used;
//  - battery saver applies ONCE to the start tier (never a repeating bad signal that ratchets to voice-only);
//  - inside a tier: pixels first, then fps; a tier change is the last resort, made only in her silence ≥ 300 ms,
//    at most one non-thermal demotion per lesson, never back above the probe tier within a session.
export type FaceTier = "B" | "Blite" | "D" | "E";

export interface TierDecision {
  tier: FaceTier;
  pixelRatio: number;
  /** fps caps by state: speaking / listening / idle. */
  fps: { speaking: number; listening: number; idle: number };
  why: string[];
}

export interface StaticFacts {
  webgl2: boolean;
  /** A context made with failIfMajorPerformanceCaveat failed (software rasteriser or blocklisted driver). */
  majorCaveat: boolean;
  renderer: string;
  saveData: boolean;
  /** The user/parent chose the voice-only or quiet-screen presentation. */
  voiceOnly?: boolean;
  /** WebGL contexts lost this session. */
  contextLosses?: number;
  /** Battery 0..1 and charging, if the platform says. */
  battery?: { level: number; charging: boolean } | null;
  dpr?: number;
}

/** GPUs that cannot hold tier B: software rasterisers, pre-2017 mobile GPUs. Everything else starts at B. */
export const KNOWN_BAD_GPU = /SwiftShader|llvmpipe|softpipe|Microsoft Basic Render|Mali-4\d\d|Mali-T[678]\d\d|Adreno \(TM\) [345]\d\d\b|PowerVR SGX|PowerVR Rogue G[56]\d{3}\b|GE8100|GE8300/i;
/** GPUs that start at B-lite (the probe may still keep them there or send them to D). */
export const LITE_GPU = /GE8320|Mali-G52 MC1|Mali-G31|Mali-G51|Adreno \(TM\) 6(?:0\d|1[0-3])\b/i;

const FPS_B = { speaking: 30, listening: 30, idle: 20 };
const FPS_LITE = { speaking: 20, listening: 20, idle: 15 };

export function staticTier(f: StaticFacts): TierDecision {
  const why: string[] = [];
  const dpr = Math.min(f.dpr ?? 1, 1.5);
  if (f.voiceOnly) return { tier: "E", pixelRatio: 1, fps: FPS_LITE, why: ["voice-only presentation"] };
  if (f.battery && !f.battery.charging && f.battery.level < 0.1) return { tier: "E", pixelRatio: 1, fps: FPS_LITE, why: ["battery < 10%"] };
  if (!f.webgl2) return { tier: "D", pixelRatio: 1, fps: FPS_LITE, why: ["no WebGL2"] };
  if (f.majorCaveat) why.push("failIfMajorPerformanceCaveat");
  if (KNOWN_BAD_GPU.test(f.renderer)) why.push(`known-bad GPU: ${f.renderer}`);
  if ((f.contextLosses ?? 0) >= 2) why.push("context lost twice");
  if (f.battery && !f.battery.charging && f.battery.level < 0.15) why.push("battery < 15%");
  if (why.length) return { tier: "D", pixelRatio: 1, fps: FPS_LITE, why };
  if (LITE_GPU.test(f.renderer)) return { tier: "Blite", pixelRatio: 1, fps: FPS_LITE, why: [`lite GPU: ${f.renderer}`] };
  // Battery saver / data saver: applied once, to the start tier's knobs.
  if (f.saveData) return { tier: "Blite", pixelRatio: 1, fps: FPS_LITE, why: ["data/battery saver"] };
  return { tier: "B", pixelRatio: Math.min(dpr, 1.25), fps: FPS_B, why: ["default B"] };
}

/** Stage 2: 60 probe frames. Work p90 (main-thread JS + GPU submit) and frame-interval p90, ms. */
export function probeVerdict(start: TierDecision, p: { workP90: number; intervalP90: number }): TierDecision {
  if (start.tier === "D" || start.tier === "E") return start;
  if (p.workP90 > 16 || p.intervalP90 > 80) return { ...start, tier: "D", pixelRatio: 1, fps: FPS_LITE, why: [...start.why, `probe failed (work p90 ${p.workP90.toFixed(1)} ms)`] };
  if (start.tier === "B" && (p.workP90 > 8 || p.intervalP90 > 45)) return { ...start, tier: "Blite", pixelRatio: 1, fps: FPS_LITE, why: [...start.why, "probe: B-lite"] };
  return start;
}

const pct = (a: number[], q: number) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))];
};
export const percentile = pct;

export const longFrameMs = (capFps: number) => Math.max(50, 1000 / capFps + 17);

export type GovernorAction = { kind: "none" } | { kind: "pixels"; pixelRatio: number } | { kind: "tier"; to: FaceTier; reason: string };

/**
 * The runtime governor (§6.4), fed one frame interval at a time and asked once a second. Bad = fps p50 < 24 or
 * > 4 frames over 50 ms in the last 10 s. After 5 s of bad: pixels first (DPR → 1.0 → 0.85), then ONE tier step
 * (B → B-lite → D), applied only when the caller reports her silence ≥ 300 ms.
 */
export class Governor {
  private intervals: { t: number; ms: number }[] = [];
  private badSince = -1;
  private demotions = 0;
  private lastChange = -Infinity;
  tier: FaceTier;
  pixelRatio: number;
  constructor(d: TierDecision) {
    this.tier = d.tier;
    this.pixelRatio = d.pixelRatio;
  }
  frame(t: number, intervalMs: number): void {
    this.intervals.push({ t, ms: intervalMs });
    while (this.intervals.length && this.intervals[0].t < t - 10) this.intervals.shift();
  }
  /** `capFps`: a frame is "long" past max(50 ms, one cap interval + one 60 Hz vsync), so a 20 fps cap is not "bad". */
  stats(capFps = 30): { fpsP50: number; long50: number; intervalP95: number } {
    const ms = this.intervals.map((i) => i.ms);
    const p50 = pct(ms, 0.5);
    return { fpsP50: p50 > 0 ? 1000 / p50 : 0, long50: ms.filter((m) => m > longFrameMs(capFps)).length, intervalP95: pct(ms, 0.95) };
  }
  /** `capFps` = the active cap (a 20 fps cap is not "bad"); `silentMs` = her local silence. */
  tick(t: number, capFps: number, silentMs: number): GovernorAction {
    if (this.tier === "D" || this.tier === "E" || this.intervals.length < 20) return { kind: "none" };
    const s = this.stats(capFps);
    const bad = s.fpsP50 < Math.min(24, capFps * 0.8) || s.long50 > 4;
    if (!bad) {
      this.badSince = -1;
      return { kind: "none" };
    }
    if (this.badSince < 0) this.badSince = t;
    if (t - this.badSince < 5 || t - this.lastChange < 5) return { kind: "none" };
    if (this.pixelRatio > 1.0) {
      this.pixelRatio = 1.0;
      this.lastChange = t;
      return { kind: "pixels", pixelRatio: 1.0 };
    }
    if (this.pixelRatio > 0.85) {
      this.pixelRatio = 0.85;
      this.lastChange = t;
      return { kind: "pixels", pixelRatio: 0.85 };
    }
    if (this.demotions >= 1 || silentMs < 300) return { kind: "none" };
    this.demotions++;
    this.lastChange = t;
    this.badSince = -1;
    this.intervals = [];
    const to: FaceTier = this.tier === "B" ? "Blite" : "D";
    const reason = `fps p50 ${s.fpsP50.toFixed(1)}, ${s.long50} frames > 50 ms / 10 s`;
    this.tier = to;
    return { kind: "tier", to, reason };
  }
}

/** Stage 1 facts from this browser. Creates (and immediately loses) one throwaway WebGL2 context. */
export function detectStaticFacts(): StaticFacts {
  const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { connection?: { saveData?: boolean } }) : null;
  const facts: StaticFacts = { webgl2: false, majorCaveat: false, renderer: "", saveData: !!nav?.connection?.saveData, dpr: typeof devicePixelRatio === "number" ? devicePixelRatio : 1 };
  if (typeof document === "undefined") return facts;
  try {
    const c = document.createElement("canvas");
    const strict = c.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) as WebGL2RenderingContext | null;
    const gl = strict ?? (document.createElement("canvas").getContext("webgl2") as WebGL2RenderingContext | null);
    facts.webgl2 = !!gl;
    facts.majorCaveat = !!gl && !strict;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      facts.renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    facts.webgl2 = false;
  }
  return facts;
}

/** `?face=B|Blite|D|E` (dev/test override) → tier, else null. */
export function tierOverride(search: string): FaceTier | null {
  const v = new URLSearchParams(search).get("face");
  return v === "B" || v === "Blite" || v === "D" || v === "E" ? v : null;
}
