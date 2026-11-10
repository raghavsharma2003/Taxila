// The young band's teach-back protégé (round 7 face-teachback-protege-staging; PRODUCT-DESIGN-V2 §8 "Explain back (Young):
// live + protégé sprite ... looks from the child to the protégé"). A small fictional creature beside her that the child
// teaches; its mood follows the teach-back: listening (neutral) while the child explains, happy when it lands, puzzled
// when it needs another go (never sad). While it is on screen her eyes go from the child to it and back (a faceCues
// "protege" gaze every few seconds while she listens or speaks), so the staging reads as three people, not a sticker.
// Classes 4-9 get no sprite: there the pretend student is "Bittu" in her words (Brain), never a picture.
import { useEffect } from "react";
import { GAZE_HOLD_MS, faceCues } from "../../avatar/faceCues.ts";

export type ProtegeKind = "cloud-pup" | "pebble-friend" | "sprout-sprite";
export type ProtegeMood = "neutral" | "happy" | "puzzled";
export const PROTEGE_KINDS: readonly ProtegeKind[] = ["cloud-pup", "pebble-friend", "sprout-sprite"];
export const PROTEGE_BASE = "/assets/teacher/protege/1/";
/** How often her eyes go to the protégé (ms): while she speaks or waits for the child, never while the child is talking
 *  (she listens with her eyes on the child: src/avatar/behaviour.ts lookAt). */
export const PROTEGE_GLANCE_EVERY_MS = 3600;

export const protegeSrc = (kind: ProtegeKind, mood: ProtegeMood) => `${PROTEGE_BASE}${kind}${mood === "neutral" ? "" : `-${mood}`}.webp`;

/** One creature per child, stable across lessons (a hash of the child id). */
export function protegeFor(childId: string | null | undefined): ProtegeKind {
  let h = 0;
  for (const c of childId ?? "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PROTEGE_KINDS[h % PROTEGE_KINDS.length];
}

export function Protege({ kind, mood, glance, reducedMotion }: { kind: ProtegeKind; mood: ProtegeMood; glance: boolean; reducedMotion?: boolean }) {
  useEffect(() => {
    if (!glance) return;
    let seq = 0;
    const id = window.setInterval(() => faceCues.emit({ kind: "gaze", target: "protege", holdMs: GAZE_HOLD_MS.protege, reason: "protege", seq: ++seq }), PROTEGE_GLANCE_EVERY_MS);
    return () => window.clearInterval(id);
  }, [glance]);
  return (
    <span className={`teacher-protege${reducedMotion ? " teacher-protege--still" : ""}`} data-protege={kind} data-mood={mood} aria-hidden="true">
      {/* all three moods are mounted (no fetch when the mood changes); one is shown */}
      {(["neutral", "happy", "puzzled"] as const).map((m) => (
        <img key={m} src={protegeSrc(kind, m)} alt="" draggable={false} decoding="async" style={{ opacity: m === mood ? 1 : 0 }} />
      ))}
    </span>
  );
}

/** The protégé's mood from the child's last teach-back answer: it understood (happy), it needs another go (puzzled,
 *  never sad), or it is still listening (neutral). */
export function protegeMood(answer: { verdict?: "correct" | "not_yet" | "partial"; delivery?: string } | null | undefined): ProtegeMood {
  if (!answer?.verdict) return "neutral";
  return answer.verdict === "correct" ? "happy" : "puzzled";
}

/** The staging rule the lesson window applies: a protégé only in the teach-back phase, only for the young family. */
export function protegeStaging(m: { phase: string | null; family: string; childName: string; answer?: Parameters<typeof protegeMood>[0] }): { kind: ProtegeKind; mood: ProtegeMood } | null {
  return m.phase === "teachback" && m.family === "young" ? { kind: protegeFor(m.childName), mood: protegeMood(m.answer) } : null;
}
