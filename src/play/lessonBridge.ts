// The lesson bridge for a play piece (docs/design/round3/play/patches/04, APPLY.md). Pure; imported by the Desk's WorkTray
// (one call beside studioToLesson). A play piece's server-SIGNED tokens reach the lesson as module events, engine "play":
//   - a level's evidence → "interaction" (rides with the next Director call);
//   - a seam → a milestone where the teacher should take a full turn (level end → goal_met; impasse or misconception →
//     stuck) or rides along (a prediction).
// The lesson turn verifies every token for this child and lesson (server/brain/turn.js playEventsOf, patch 03); nothing else
// a play event says is read. Each act (play_act) stays on the device: the play server already has it.
import type { ModuleEvent } from "../../shared/contracts.ts";

export interface PlayStageEventLike { type: string; name?: string; data?: Record<string, unknown> }
export function playToLesson(e: PlayStageEventLike, intentId: string | undefined, send: (ev: ModuleEvent) => void): boolean {
  if (e.type !== "interaction" || !intentId || (e.name !== "play_evidence" && e.name !== "play_seam")) return false;
  const token = typeof e.data?.token === "string" ? e.data.token : null;
  if (!token || token.length > 8192) return false;
  const base = { moduleId: intentId, engine: "play", at: Date.now() };
  if (e.name === "play_evidence") { send({ ...base, type: "interaction", name: "play_evidence", data: { ev: token } }); return true; }
  const kind = String(e.data?.seam ?? "");
  const type: ModuleEvent["type"] = kind === "level_end" ? "goal_met" : kind === "impasse" || kind === "misconception" ? "stuck" : "interaction";
  send({ ...base, type, name: kind === "level_end" ? "level_end" : kind || "seam", data: { seam: token } });
  return true;
}
