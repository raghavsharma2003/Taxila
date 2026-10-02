// The onboarding frame: a centred 480 px column (desktop too, §2.2), a back control, a plain step line
// for the parent ("2 of 7"), and the trust page one tap away from every step (P3 rule).
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../ui/index.ts";
import { Brand } from "../app/Shell.tsx";
import { useSurface } from "../app/band.ts";

export const STEPS = ["lang", "meet", "phone", "trust", "consent", "child", "controls", "handover"] as const;

export function StepFrame({ step, title, why, children, back = true, footer }:
  { step: (typeof STEPS)[number] | null; title: ReactNode; why?: ReactNode; children: ReactNode; back?: boolean; footer?: ReactNode }) {
  useSurface({ surface: "parent" });
  const nav = useNavigate();
  const i = step ? STEPS.indexOf(step) : -1;
  return (
    <div className="onb">
      <header className="topbar col onb-top">
        {back ? (
          <button type="button" className="iconbtn" onClick={() => nav(-1)} aria-label="Back"><Icon name="back" /></button>
        ) : <Brand />}
        <span className="spacer" />
        {i >= 0 && <span className="t-meta" aria-label={`Step ${i + 1} of ${STEPS.length}`}>{i + 1} / {STEPS.length}</span>}
        <Link to="/trust" className="iconbtn" aria-label="Our promises"><Icon name="shield" /></Link>
      </header>
      <main id="main" className="col stack onb-main enter">
        <h1 className="t-title onb-title">{title}</h1>
        {why && <p className="t-lead muted">{why}</p>}
        {children}
      </main>
      {footer && <div className="col onb-footer">{footer}</div>}
    </div>
  );
}
