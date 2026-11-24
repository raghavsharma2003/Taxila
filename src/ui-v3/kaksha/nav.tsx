// One Kaksha navigation model (r7 app-nav-unified). Every child screen outside the lesson uses the same two pieces:
//   <KxTopBar>  back (to the screen's parent; Home has none), the screen's title, and Me (settings) at the right.
//               Home also carries the plain parent door there ("For parents"), never in the dock.
//   <KxDock>    the HUD dock: Home · World · Practice · Ask · Notebook. A bottom bar on phones, a left rail from 1024 px.
//               Surfaces the parent turned off (plan.surfaces: map → World, notebook → Notebook) are absent, never shown
//               dimmed or locked. Ask is for the older family only (Young: no free-text doubts yet; see app-class4-older-look).
// The lesson never shows either (it has no navigation: leaving is Pause → End or the stop check-in).
// Pure props in; `go` routes in the app and is absent on the dev page (plain hrefs).
import type { MouseEvent, ReactNode } from "react";
import { kt } from "./copy.ts";
import type { NavItem, NavKey } from "./nav-model.ts";
import "./nav.css";

export { backOf, dockItems, navKeyOf, type NavInput, type NavItem, type NavKey } from "./nav-model.ts";
export type Go = (to: string) => void;

const P = {
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  world: "M12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4M2.4 14.6c-.9-2.7 3-6 8.7-7.4s10.9-.6 11.8 2.1-3 6-8.7 7.4-10.9.6-11.8-2.1",
  practice: "M13 3L5 13h6l-1 8 8-10h-6z",
  ask: "M5 5h14v10H10l-5 4zM12 8.2c1.2 0 2 .7 2 1.6 0 1.3-2 1.3-2 2.6M12 13.6v.1",
  notebook: "M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM6 3v18M9.5 8h5M9.5 11.5h5",
  me: "M12 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7M4.5 20c.8-3.7 3.8-6 7.5-6s6.7 2.3 7.5 6",
  back: "M15 5l-7 7 7 7",
} as const;

export function NavIcon({ name, size = 22 }: { name: keyof typeof P; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

function A({ to, go, className, children, testid, label, current }: { to: string; go?: Go; className?: string; children: ReactNode; testid?: string; label?: string; current?: boolean }) {
  const onClick = (e: MouseEvent) => {
    if (!go || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    go(to);
  };
  return <a href={to} className={className} onClick={onClick} data-testid={testid} aria-label={label} aria-current={current ? "page" : undefined}>{children}</a>;
}

export function KxDock({ items, active, go }: { items: NavItem[]; active: NavKey | null; go?: Go }) {
  return (
    <nav className="kx-nav" aria-label="Main" data-testid="kx-dock">
      {items.map((i) => (
        <A key={i.key} to={i.to} go={go} className="kx-nav-item" current={active === i.key} testid={`nav-${i.key}`}>
          <NavIcon name={i.key} />
          <span>{i.label}</span>
        </A>
      ))}
    </nav>
  );
}

export interface KxTopBarProps {
  /** Back target (absent on Home). */
  backTo?: string | null;
  title?: ReactNode;
  meTo: string;
  meActive?: boolean;
  /** Home: the plain parent door. */
  parentTo?: string | null;
  /** Extra controls before Me (a segmented toggle, a count-free filter). */
  actions?: ReactNode;
  /** Home's brand mark instead of a title. */
  brand?: ReactNode;
  go?: Go;
}

export function KxTopBar({ backTo, title, meTo, meActive, parentTo, actions, brand, go }: KxTopBarProps) {
  return (
    <header className="kx-bar" data-testid="kx-topbar">
      {backTo ? (
        <A to={backTo} go={go} className="kx-ib kx-cut" label={kt("back")} testid="kx-back"><NavIcon name="back" size={20} /></A>
      ) : null}
      {brand}
      {title ? <h1 className="kx-bar-title" tabIndex={-1}>{title}</h1> : <span className="kx-sp" />}
      <span className="kx-bar-actions">
        {actions}
        {parentTo && <A to={parentTo} go={go} className="kx-parentdoor" testid="grownups" label="For parents: parent corner">{kt("forParents")}</A>}
        <A to={meTo} go={go} className="kx-ib kx-cut kx-me" current={meActive} label={kt("navMe")} testid="me-button"><NavIcon name="me" size={22} /></A>
      </span>
    </header>
  );
}
