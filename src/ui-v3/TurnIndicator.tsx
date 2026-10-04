// The hands-free dock (DESIGN-V3 §5.2-§5.3; owner reset R10/R16). The mic is a STATE READOUT plus a mute switch, never a
// talk button: "Speak anytime · she pauses for you". The waveform is ion while she talks and volt while the child talks
// (the child's voice is the screen's one volt in that state). The keyboard is always one tap away (L-3, L-12, L-13).
import { Icon } from "./Icon.tsx";
import { floorView, type FloorOpts, type V3Floor } from "./floor.ts";
import { cx } from "./primitives.tsx";

export interface TurnIndicatorProps extends FloorOpts {
  floor: V3Floor;
  onToggleMute?: () => void;
  onType?: () => void;
  /** Live input level 0..1 drives bar heights when present (else CSS animation). */
  level?: number;
}

export function Wave({ mode, level }: { mode: string; level?: number }) {
  const bars = [0.55, 0.85, 1, 0.75, 0.5];
  const live = level != null && (mode === "volt" || mode === "ion");
  return (
    <span className={cx("v3-wave", `v3-wave--${mode}`, live && "v3-wave--live")} aria-hidden="true">
      {bars.map((k, i) => <i key={i} style={live ? { height: `${Math.max(18, Math.min(100, (level ?? 0) * 100 * k + 18))}%` } : undefined} />)}
    </span>
  );
}

export function TurnIndicator({ floor, watching, muted, onToggleMute, onType, level }: TurnIndicatorProps) {
  const v = floorView(floor, { watching, muted });
  return (
    <div className="v3-dock-row">
      <button type="button" className={cx("v3-btn", "v3-btn--secondary", "v3-btn--icon", muted && "is-muted")} role="switch" aria-checked={!muted} aria-label="Microphone" onClick={onToggleMute}>
        <Icon name={muted ? "mic-off" : "mic"} />
      </button>
      <div className="v3-mic" data-floor={floor} data-volt={v.wave === "volt" || v.wave === "volt-low" ? "" : undefined}>
        <Wave mode={v.wave} level={level} />
        <div className="v3-mic-state" aria-live="polite" aria-atomic="true">
          <span>{v.title}</span>
          <small>{v.sub}</small>
        </div>
      </div>
      <button type="button" className="v3-btn v3-btn--secondary v3-btn--icon" aria-label="Type instead" onClick={onType}>
        <Icon name="keyboard" />
      </button>
    </div>
  );
}
