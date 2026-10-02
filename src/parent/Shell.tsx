// Parent-corner chrome (§6.1): one child at a time with a switcher, a lock control, bottom tabs on phones
// (Home · Syllabus · Lessons · More) and a left rail on desktop. Data hooks re-lock the gate on a 403.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ErrorNote, Icon, type IconName } from "../ui/index.ts";
import { errText, loadMe, type ChildRow } from "../app/api.ts";
import { Brand, Loading } from "../app/Shell.tsx";
import { readStore, writeStore } from "../app/storage.ts";
import { isGateError } from "./api.ts";
import { useGate } from "./Gate.tsx";

const PARENT_CHILD_KEY = "tx.parentChild";

/** The guardian's children and the one in view: route :cid, else ?c=, else the last one viewed, else the first. */
export function useChildren() {
  const { cid } = useParams();
  const [sp] = useSearchParams();
  const [kids, setKids] = useState<ChildRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { loadMe().then((m) => setKids(m?.children ?? []), (e) => setErr(errText(e))); }, []);
  const want = cid ?? sp.get("c") ?? readStore<string | null>(PARENT_CHILD_KEY, null);
  const current = kids ? kids.find((k) => k.id === want) ?? kids[0] ?? null : null;
  useEffect(() => { if (current) writeStore(PARENT_CHILD_KEY, current.id); }, [current]);
  return { kids, current, err };
}

/** Load parent data; a gate 403 re-locks the corner instead of showing an error. */
export function useParentData<T>(fn: (() => Promise<T>) | null, deps: unknown[]) {
  const { relock } = useGate();
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    if (!fn) return;
    let live = true;
    setErr(null);
    fn().then((d) => { if (live) setData(d); }, (e) => { if (!live) return; if (isGateError(e)) relock(); else setErr(errText(e)); });
    return () => { live = false; };
  }, [...deps, n]);
  return { data, err, reload, setData };
}

const TABS: { to: (cid: string) => string; label: string; icon: IconName; end?: boolean }[] = [
  { to: (cid) => `/parent?c=${cid}`, label: "Home", icon: "home", end: true },
  { to: (cid) => `/parent/${cid}/syllabus`, label: "Syllabus", icon: "book" },
  { to: (cid) => `/parent/${cid}/lessons`, label: "Lessons", icon: "list" },
  { to: () => `/parent/more`, label: "More", icon: "more" },
];

export function ParentShell({ title, children, child, kids, onSwitch }:
  { title: string; children: ReactNode; child?: ChildRow | null; kids?: ChildRow[] | null; onSwitch?: (id: string) => void }) {
  const { lockNow } = useGate();
  const nav = useNavigate();
  useEffect(() => { document.title = `${title} · Parent corner · Taxila`; }, [title]);
  const cid = child?.id ?? readStore<string | null>(PARENT_CHILD_KEY, null) ?? "";
  return (
    <div className="pc">
      <a className="skip" href="#main">Skip to content</a>
      <aside className="pc-rail" aria-label="Parent corner">
        <div className="pc-rail-brand"><Brand to="/parent" /></div>
        <nav className="pc-tabs" aria-label="Sections">
          {TABS.map((t) => (
            <NavLink key={t.label} to={t.to(cid)} end={t.end} className={({ isActive }) => `pc-tab${isActive ? " is-active" : ""}`}>
              <Icon name={t.icon} /><span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="pc-main">
        <header className="pc-top">
          {kids && kids.length > 0 && child ? (
            <label className="pc-switch">
              <span className="sr-only">Child</span>
              <select value={child.id} onChange={(e) => (onSwitch ? onSwitch(e.target.value) : nav(`/parent?c=${e.target.value}`))}>
                {kids.map((k) => <option key={k.id} value={k.id}>{k.first_name} · Class {k.class_level}</option>)}
              </select>
            </label>
          ) : <h1 className="pc-h">{title}</h1>}
          <span className="spacer" />
          <button type="button" className="btn btn-secondary btn-sm" onClick={lockNow}><Icon name="lock" size={20} /> Lock</button>
        </header>
        <main id="main" className="pc-content">{children}</main>
      </div>
    </div>
  );
}

export function PageState({ err, loading }: { err: string | null; loading: boolean }) {
  if (err) return <ErrorNote>{err}</ErrorNote>;
  if (loading) return <Loading />;
  return null;
}
