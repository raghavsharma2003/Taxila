// The four-state glyph (§3.9, ds-status-carriers): each state has a glyph and an accessible name; colour is
// the last carrier. `word` shows the one-word label (Older bands); Young shows the glyph only.
import { Icon, type IconName } from "./Icon.tsx";

export type FloorState = "your_turn" | "listening" | "thinking" | "speaking";
const GLYPH: Record<FloorState, IconName> = { your_turn: "hand", listening: "ear", thinking: "dots", speaking: "sound" };
export const STATUS_NAME: Record<FloorState, string> = { your_turn: "Your turn", listening: "Listening", thinking: "Thinking", speaking: "Speaking" };

export function StatusGlyph({ state, word, label }: { state: FloorState; word?: boolean; label?: string }) {
  return (
    <span className="status" data-state={state} role="img" aria-label={label ?? STATUS_NAME[state]}>
      <Icon name={GLYPH[state]} />
      {word && <span aria-hidden="true">{label ?? STATUS_NAME[state]}</span>}
    </span>
  );
}
