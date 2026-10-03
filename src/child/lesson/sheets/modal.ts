// Modal focus for the lesson sheets (PRODUCT-DESIGN-V2 §11.3): every sheet opens with focus on its TITLE; Tab is
// trapped inside; every sibling of the veil except the screen's live regions is made inert (a keyboard or
// screen-reader child cannot wander into the lesson behind the safeguarding hand-off); on close, focus returns
// to whatever held it before.
import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocus(veil: RefObject<HTMLElement | null>, title: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = veil.current;
    if (!root) return;
    const before = document.activeElement as HTMLElement | null;
    const parent = root.parentElement;
    const madeInert: Element[] = [];
    if (parent) {
      for (const sib of Array.from(parent.children)) {
        if (sib === root || sib.hasAttribute("data-live") || sib.hasAttribute("inert")) continue;
        sib.setAttribute("inert", "");
        madeInert.push(sib);
      }
    }
    (title.current ?? root.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      const cur = document.activeElement;
      if (!root.contains(cur) || cur === title.current) {
        e.preventDefault();
        (e.shiftKey ? z : a).focus();
      } else if (e.shiftKey && cur === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && cur === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      for (const el of madeInert) el.removeAttribute("inert");
      if (before && before.isConnected && before !== document.body) before.focus?.({ preventScroll: true });
    };
  }, [veil, title]);
}
