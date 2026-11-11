// The words and state of her presence (Presence.tsx), pure so the tests import it.
import type { Floor } from "../../lesson/floor.ts";

export type PresenceSize = "row" | "tile" | "hero";

export const STATE: Partial<Record<Floor, string>> = {
  speaking: "Talking",
  showing: "Talking",
  yielding: "Talking",
  your_turn: "Listening",
  listening: "Listening",
  heard: "Listening",
  thinking: "Thinking",
};

export function presenceState(floor: Floor | undefined): "talking" | "listening" | "thinking" | "idle" {
  const w = floor ? STATE[floor] : undefined;
  return w === "Talking" ? "talking" : w === "Listening" ? "listening" : w === "Thinking" ? "thinking" : "idle";
}

