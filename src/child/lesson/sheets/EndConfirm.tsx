// End confirm (PRODUCT-DESIGN-V2 §6.4.2; r7 D5): Young full screen with tick and cross pictos, Older a dialog. Exit
// buttons are ink, never red; ending ALWAYS goes to the Summary (the audit saw two different destinations).
// r7 (D5, OWNER-RESET #7): Pause → End is the stop check-in, not an instant end: Keep going, a Short break (when the
// lesson offers one: onBreak), or End lesson.
import { useEffect, useRef, useState } from "react";
import { t } from "../../../ui/copy.ts";
import { Glyph } from "../../../ui/icons/state.tsx";
import { useModalFocus } from "./modal.ts";

export function EndConfirm({ young, onKeep, onEnd, onBreak }: { young: boolean; onKeep: () => void; onEnd: () => void; onBreak?: () => void }) {
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useModalFocus(veil, title);
  return (
    <div ref={veil} className={`dk-veil ${young ? "dk-veil--full" : "dk-veil--center"}`} role="alertdialog" aria-modal="true" aria-labelledby="dk-end-title" data-testid="end-confirm">
      <div className="dk-sheet dk-sheet--dialog">
        <h2 id="dk-end-title" ref={title} tabIndex={-1} className="dk-sheet-title">{t("end.title")}</h2>
        {onBreak && <p className="dk-sheet-sub">{t("end.sub")}</p>}
        <div className={onBreak ? "dk-stack" : "dk-pair"}>
          <button type="button" className="dk-btn dk-btn--primary dk-btn--tall" onClick={onKeep} data-testid="end-keep">
            {young && <Glyph name="back" size={28} />}{t("end.keep")}
          </button>
          {onBreak && (
            <button type="button" className="dk-btn dk-btn--secondary dk-btn--tall" onClick={onBreak} data-testid="end-break">
              <Glyph name="paused" size={24} />{t("end.break")}
            </button>
          )}
          <button type="button" className="dk-btn dk-btn--secondary dk-btn--ink dk-btn--tall" onClick={onEnd} data-testid="end-end">
            {young && <Glyph name="check_circle" size={28} />}{t("end.end")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** r7 (D5): the break. Her speech is held and the mic is off (useDesk holds both for sheet "break"); "I'm back" resumes
 *  exactly where the lesson was. A plain clock counts the break up (never a countdown the child must beat). */
export function BreakSheet({ since, teacher, onBack, onEnd }: { since: number | null; teacher: string; onBack: () => void; onEnd: () => void }) {
  const veil = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useModalFocus(veil, title);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.floor((now - (since ?? now)) / 1000));
  return (
    <div ref={veil} className="dk-veil dk-veil--center" role="dialog" aria-modal="true" aria-labelledby="dk-break-title" data-testid="break-sheet">
      <div className="dk-sheet dk-sheet--dialog">
        <h2 id="dk-break-title" ref={title} tabIndex={-1} className="dk-sheet-title"><Glyph name="paused" size={28} />{t("break.title")}</h2>
        <p className="dk-sheet-sub">{t("break.sub", { T: teacher })}</p>
        <p className="dk-sheet-sub dk-break-clock" aria-live="off">{t("break.for", { m: Math.floor(secs / 60), s: secs % 60 })}</p>
        <div className="dk-stack">
          <button type="button" className="dk-btn dk-btn--primary dk-btn--tall" onClick={onBack} data-testid="break-back">{t("break.back")}</button>
          <button type="button" className="dk-btn dk-btn--secondary dk-btn--ink" onClick={onEnd} data-testid="break-end">{t("break.end")}</button>
        </div>
      </div>
    </div>
  );
}
