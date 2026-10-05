// THE one microphone tap of a lesson tab (G-VS-ONE), shared by every on-device consumer: src/voice's utterance tracker,
// the voicesig head, and the duplex engine's frame feed when it is wired into the lesson. Reference-counted: the first
// acquire attaches the shared front-end (one "taxila-tap2" worklet, one YIN per hop, one encoder session), later acquires
// for the same AudioContext + stream get the same FrontEndCore, and the last release detaches it.
//
// Duplex glue (p1-duplex): instead of a second worklet,
//   const { fe, release } = await acquireFrontEnd({ ctx: tap.ctx, stream: tap.stream });
//   const off = fe.onFrame((f) => host.frame(f.t, Math.pow(10, f.rmsDb / 20), f.f0));
//   // teardown: off(); release();
// fe.requestPass(turnSeq, t) is idempotent per turn, so duplex's candidate end and voicesig's commit share one pass.
import { attachFrontEnd, type AttachedFrontEnd, type FrontEndCore } from "./frontend/bus.ts";
import type { MicClass } from "./types.ts";

export interface AcquireOptions {
  ctx: AudioContext;
  stream: MediaStream;
  /** Her audio is audible at the device at clock t (R frames are dropped then). */
  herAudible?: (t: number) => boolean;
  /** Open the raw analysis track R (flag voicesig.raw). */
  raw?: boolean;
  /** Override the worklet URL (tests). */
  workletUrl?: string;
  /** Injected attach (tests). */
  attach?: typeof attachFrontEnd;
}

export interface Lease { fe: FrontEndCore; release(): void }

interface Slot { ctx: AudioContext; stream: MediaStream; attached: Promise<AttachedFrontEnd>; refs: number }
let slot: Slot | null = null;

/** Mic route from the track label (no permission beyond the mic the link already holds). */
export function micClassOf(track: MediaStreamTrack | null | undefined): MicClass {
  const l = String(track?.label ?? "").toLowerCase();
  if (!l) return "unknown";
  if (/bluetooth|airpods|buds|hands-?free|\bbt\b|headset \(|sco\b/.test(l)) return "bt";
  if (/speakerphone/.test(l)) return "speaker_route";
  if (/headset|headphone|earphone|wired|usb|jack/.test(l)) return "wired";
  return "builtin";
}

/** Epoch-ms clock for a chunk stamped in AudioContext time: the same formula as src/voice/features.ts onChunk. */
export function epochClock(ctx: AudioContext, track: MediaStreamTrack | null, now: () => number = () => Date.now()): (ct: number) => number {
  const inLat = (): number => {
    const s = (track?.getSettings?.() as { latency?: number } | undefined)?.latency;
    return typeof s === "number" && Number.isFinite(s) && s > 0 && s < 1 ? s * 1000 : 0;
  };
  return (ct: number) => now() - Math.max(0, ctx.currentTime - ct) * 1000 - inLat();
}

export async function acquireFrontEnd(o: AcquireOptions): Promise<Lease> {
  // The worklet URL module is imported lazily so this file loads in Node tests (they inject workletUrl / attach).
  const workletUrl = o.workletUrl ?? (await import("./tapUrl.ts")).default;
  if (slot && (slot.ctx !== o.ctx || slot.stream !== o.stream)) {
    // A new link (lane switch, reconnect) brought a new context or stream: the old front-end belongs to a dead tap.
    const old = slot;
    slot = null;
    await old.attached.then((a) => a.detach(), () => {});
  }
  // No await between this check and the assignment: two concurrent acquires share one attach.
  if (!slot) {
    const track = o.stream.getAudioTracks()[0] ?? null;
    const attach = o.attach ?? attachFrontEnd;
    const attached = attach({
      ctx: o.ctx, stream: o.stream, workletUrl, raw: !!o.raw, herAudible: o.herAudible,
      toClock: epochClock(o.ctx, track), micClass: micClassOf(track),
    });
    const fresh: Slot = { ctx: o.ctx, stream: o.stream, attached, refs: 0 };
    slot = fresh;
    attached.catch(() => { if (slot === fresh) slot = null; });
  }
  const s = slot;
  s.refs++;
  let a: AttachedFrontEnd;
  try {
    a = await s.attached;
  } catch (err) {
    s.refs--;
    throw err;
  }
  let released = false;
  return {
    fe: a.fe,
    release() {
      if (released) return;
      released = true;
      s.refs--;
      if (s.refs <= 0 && slot === s) {
        slot = null;
        a.detach();
      }
    },
  };
}

/** Live leases (tests and the G-VS-ONE probe). */
export const tapStats = (): { attached: boolean; refs: number } => ({ attached: !!slot, refs: slot?.refs ?? 0 });
