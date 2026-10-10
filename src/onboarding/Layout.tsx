// The onboarding frame (PRODUCT-DESIGN-V2 §6.2; audit #11, #19, #24): Back, "Step n of N" and a segment line; every
// step opens at scroll 0 with focus on its title (scrollTo(0,0) + focus() on route change: the parent never lands on
// the previous step's scroll position); the page <title> follows the step; the primary action sits IN THE FLOW at the
// end of the content, never sticky (the PinPad of the PIN step is the one footer, and it is part of that step).
// 1280: a centred card on the painted onboarding edge (bg/onboarding-edge, flat paper until it lands).
import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../ui/index.ts";
import { Brand } from "../app/Shell.tsx";
import { useSurface } from "../app/band.ts";
import { Scene } from "../child/art.tsx";

/** Every set-up screen (some are off the first run since round 4's cut, but stay reachable by URL). */
export type Step = "class" | "meet" | "promises" | "phone" | "consent" | "child" | "controls" | "check" | "handover";
/**
 * The parent's first run, in order (§3.2; round 4 journey audit #12, the main session's cut, 2026-10-10): FIVE steps
 * before the child hears her. Class + board + the language she speaks (was class, then "Meet"); the promises and their
 * 2-s hold; the account; consent; the child's name + the parent PIN, whose button hands the phone over. Deferred to
 * defaults the parent changes in the Parent corner: how she speaks (Casual to class 5, Respectful 6-9), the school's
 * language (the chosen one), daily time and hours (by class; 06:30-21:30). Moved into the child's Hello: the interests
 * (the child picks them) and the sound / mic check ("say hi", with Skip). The AI disclosure is unchanged: the first
 * promise row here and Hello's AI card.
 */
export const STEPS: readonly Step[] = ["class", "promises", "phone", "consent", "child"];
/** Adding a second child (behind the parent PIN): class → name, then the hand-over. */
export const ADD_STEPS: readonly Step[] = ["class", "child"];

export function StepFrame({ step, title, why, children, back = true, footer, docTitle }:
  { step: Step | null; title: ReactNode; why?: ReactNode; children: ReactNode; back?: boolean; footer?: ReactNode; docTitle?: string }) {
  useSurface({ surface: "parent" });
  const nav = useNavigate();
  const loc = useLocation();
  const adding = new URLSearchParams(loc.search).has("add");
  const list: readonly string[] = adding ? ADD_STEPS : STEPS;
  const i = step ? list.indexOf(step) : -1;
  const h1 = useRef<HTMLHeadingElement>(null);
  // §6.2: scroll 0 and focus on the title on EVERY step change (not only a fresh mount)
  useEffect(() => {
    window.scrollTo(0, 0);
    h1.current?.focus({ preventScroll: true });
  }, [loc.pathname]);
  useEffect(() => {
    const text = typeof title === "string" ? title : docTitle;
    if (text) document.title = `${text} · Taxila`;
  }, [title, docTitle]);
  return (
    <div className="onb onb-v2" data-step={step ?? ""}>
      <div className="onb-edge" aria-hidden="true"><Scene id="onboarding-edge" fallback={<span />} /></div>
      <div className="onb-sheet">
        <header className="topbar col onb-top">
          {back ? (
            <button type="button" className="iconbtn" onClick={() => nav(-1)} aria-label="Back"><Icon name="back" /></button>
          ) : <Brand />}
          <span className="spacer" />
          {i >= 0 && <span className="t-meta onb-count">Step {i + 1} of {list.length}</span>}
          <Link to="/trust" className="iconbtn" aria-label="Our promises"><Icon name="shield" /></Link>
        </header>
        {i >= 0 && (
          <div className="col onb-steps" aria-hidden="true">
            {list.map((s, k) => <span key={s} className={`onb-seg ${k <= i ? "onb-seg--on" : ""}`} />)}
          </div>
        )}
        <main id="main" className="col stack onb-main">
          <h1 ref={h1} tabIndex={-1} className="t-title onb-title">{title}</h1>
          {why && <p className="t-lead muted">{why}</p>}
          {children}
          {footer && <div className="onb-actions">{footer}</div>}
        </main>
      </div>
    </div>
  );
}

/** The step after `step` in the flow the parent is on (add a child, or the first run). */
export function nextStep(step: Step, adding: boolean): string {
  const list: readonly string[] = adding ? ADD_STEPS : STEPS;
  const n = list[list.indexOf(step) + 1] ?? "handover";
  return `/start/${n}${adding ? "?add=1" : ""}`;
}
