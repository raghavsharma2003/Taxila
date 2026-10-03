// Bottom sheet on phones, centred dialog from 720 px. Native <dialog>.showModal(): focus moves in, Tab is
// trapped, Esc closes, the page behind is inert, and focus returns to the opener on close (A8: never hidden).
// V2 §11.3: every sheet opens with focus on its title (programmatically focusable, no visible ring on it).
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon.tsx";

export function Sheet({ open, onClose, title, children, closeLabel = "Close" }:
  { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; closeLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // The native 'close' event also fires when WE close the dialog after `open` went false; calling onClose
  // then would navigate twice (a duplicate history entry). Only a close the user made (Esc) reports back.
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      try { d.showModal(); } catch { d.setAttribute("open", ""); }
      d.querySelector<HTMLElement>(".sheet-head h2")?.focus({ preventScroll: true });
    } else if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" aria-labelledby={titleId} onClose={() => { if (openRef.current) onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="sheet-head">
        <h2 id={titleId} tabIndex={-1}>{title}</h2>
        <button type="button" className="iconbtn" onClick={onClose} aria-label={closeLabel}><Icon name="close" /></button>
      </div>
      <div className="sheet-body">{open && children}</div>
    </dialog>
  );
}
