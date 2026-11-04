// r7 app-lesson-moments-later: the stage's overlays (DESIGN-V3 §12; OWNER-RESET #6, #7).
//   <LaterPill>    "Later n": the parked questions; opens the list. It never covers the PiP (top-right) or the piece's
//                  label zone: it sits at the slot's bottom-left, above the rail.
//   <MomentCard>   park (rises, then tucks into the Later pill) · detour (brief, in bounds) · decline (warm) · stop (the
//                  check-in, with the turn's own stop:* / break:* chips as its actions, so they act through the Director).
// Nothing here shows build, generation or loading state (R9).
import { useEffect, useRef, useState } from "react";
import type { LaterItem, StageMoment, TrayModel } from "../../../child/lesson/model.ts";
import { kt } from "../copy.ts";

/** PURE: the stop check-in's choices if this turn's tiles are the check-in (the server's stop:* and break:* chips). */
export function stopChoicesOf(tray: TrayModel | null): Array<{ id: string; label: string }> | null {
  const tiles = tray?.kind === "tiles" ? tray.tiles ?? [] : [];
  if (!tiles.some((c) => c.id === "stop:end")) return null;
  if (!tiles.every((c) => /^(stop|break):/.test(c.id))) return null;
  // keep going first, end last; anything else (break, wrap up in 2) in the order the server sent it
  const order = (id: string) => (id === "stop:continue" ? 0 : id === "stop:end" ? 2 : 1);
  return [...tiles].sort((a, b) => order(a.id) - order(b.id));
}

const ICON: Record<StageMoment["kind"], string> = {
  park: "M9 4h6l-1 6 3 3H7l3-3zM12 13v7",
  detour: "M13 3L5 13h6l-1 8 8-10h-6z",
  decline: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
  stop: "M9 6v12M15 6v12",
};
const TITLE: Record<StageMoment["kind"], Parameters<typeof kt>[0]> = { park: "momentPark", detour: "momentDetour", decline: "momentDecline", stop: "momentStop" };

function I({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

export function MomentCard({ moment, choices, onPick, reducedMotion }: {
  moment: StageMoment; choices?: Array<{ id: string; label: string }> | null; onPick?: (c: { id: string; label: string }) => void; reducedMotion?: boolean;
}) {
  // a parked question rises, holds ~4 s, then tucks into the Later pill (reduced motion: it simply goes)
  const [phase, setPhase] = useState<"in" | "tucking" | "gone">("in");
  useEffect(() => {
    setPhase("in");
    if (moment.kind !== "park") return;
    const a = setTimeout(() => setPhase("tucking"), 4200);
    const b = setTimeout(() => setPhase("gone"), reducedMotion ? 4201 : 4800);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [moment.key, moment.kind, reducedMotion]);
  if (phase === "gone") return null;
  const stop = moment.kind === "stop";
  return (
    <div className={`ks-moment ks-moment--${moment.kind}${phase === "tucking" ? " is-tucking" : ""}`} role={stop ? "group" : "status"}
      aria-label={kt(TITLE[moment.kind])} data-testid={`moment-${moment.kind}`}>
      <span className="ks-moment-ic"><I d={ICON[moment.kind]} /></span>
      <div className="ks-moment-body">
        <div className="ks-moment-k">{kt(TITLE[moment.kind])}</div>
        {moment.quote && <div className="ks-moment-q">{`“${moment.quote}”`}</div>}
        {moment.note && <div className="ks-moment-w">{moment.note}</div>}
        {stop && choices && choices.length > 0 && (
          <div className="ks-moment-acts">
            {choices.map((c, i) => (
              <button key={c.id} type="button" className={`ks-moment-btn${i === 0 ? " is-primary" : ""}`} onClick={() => onPick?.(c)} data-testid={`stop-${c.id.replace(":", "-")}`}>{c.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LaterPill({ items }: { items: LaterItem[] }) {
  const [open, setOpen] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) sheet.current?.focus(); }, [open]);
  if (!items.length) return null;
  return (
    <>
      <button type="button" className="ks-later" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="later-pill"
        aria-label={`${kt("later")}: ${items.length}`}>
        <I d={ICON.park} />{kt("later")} <b>{items.length}</b>
      </button>
      {open && (
        <div className="ks-later-sheet" role="dialog" aria-label={kt("laterTitle")} tabIndex={-1} ref={sheet}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }} data-testid="later-list">
          <div className="ks-later-head"><span>{kt("laterTitle")}</span>
            <button type="button" className="ks-later-x" onClick={() => setOpen(false)} aria-label={kt("close")}>×</button></div>
          <ul>{items.map((i) => <li key={i.id}><I d={ICON.park} /><span>{i.text}</span></li>)}</ul>
        </div>
      )}
    </>
  );
}
