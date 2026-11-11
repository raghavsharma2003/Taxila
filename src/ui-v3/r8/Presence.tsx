// The teacher as a presence, round 8 (DESIGN-REVIEW.md: "a small presence, never the hero image"). It is a circle with
// her initial and a voice ring, plus her name and "AI teacher".
// The owner chooses her look separately, so this neutral mark stands in for the face: no picture and no cartoon.
// The AI disclosure is always printed, at every size.
// The ring shows the floor: solid while she speaks, faint while she listens. It is a CSS animation, still under reduced
// motion. No meters are read and no rAF runs: nothing on the turn path.
import type { ReactNode } from "react";
import type { Floor } from "../../lesson/floor.ts";
import { STATE, presenceState, type PresenceSize } from "./presence.ts";
import "./presence.css";

export function Presence({ name, floor, size, children }: { name: string; floor?: Floor; size: PresenceSize; children?: ReactNode }) {
  const state = presenceState(floor);
  const word = floor ? STATE[floor] : undefined;
  return (
    <div className={`tx-presence tx-presence--${size}`} data-state={state} data-testid="tx-presence">
      <span className="tx-presence-face" aria-hidden="true">
        <span className="tx-presence-ring" />
        {(name.trim()[0] ?? "A").toUpperCase()}
      </span>
      <span className="tx-presence-meta">
        <b>{name}</b>
        <small>AI teacher{word ? <span className="tx-presence-state"> · {word}</span> : null}</small>
      </span>
      {children}
    </div>
  );
}
