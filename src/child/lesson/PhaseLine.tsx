// The Older phase line (PRODUCT-DESIGN-V2 §4.8, [G] V2-M13, R ds-progress-no-meters): Warm-up · Learn · Try · Wrap,
// the current one in bold ink, the rest ink-2. No fill, no count, never a meter. On a phone only the current
// phase word shows. Behind its flag (`enabled`); Young never gets one (she says where we are).
import { t, type CopyKey } from "../../ui/copy.ts";
import type { DeskPhase } from "./model.ts";

const ORDER: DeskPhase[] = ["warmup", "teach", "practice", "wrap"];
const KEY: Record<DeskPhase, CopyKey> = { warmup: "bar.phase.warmup", teach: "bar.phase.teach", practice: "bar.phase.practice", teachback: "bar.phase.teachback", wrap: "bar.phase.wrap" };

export function PhaseLine({ phase, full, enabled = true }: { phase: DeskPhase | null; full: boolean; enabled?: boolean }) {
  if (!enabled || !phase) return null;
  if (!full) return <span className="dk-phase" data-testid="phase-word">{t(KEY[phase])}</span>;
  const list = phase === "teachback" ? (["warmup", "teach", "practice", "teachback", "wrap"] as DeskPhase[]) : ORDER;
  return (
    <ol className="dk-phaseline" aria-label="Lesson parts" data-testid="phase-line">
      {list.map((p) => (
        <li key={p} aria-current={p === phase ? "step" : undefined}>{t(KEY[p])}</li>
      ))}
    </ol>
  );
}
