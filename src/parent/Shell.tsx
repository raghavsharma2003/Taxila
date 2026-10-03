// Parent-corner chrome (PRODUCT-DESIGN-V2 §5.2, §6.5). One child at a time with a switcher ("Riya ▾") at top-left,
// the child's teacher beside it (the one character record), and a Lock control.
//   phone (< 900): a 56 top bar and a 64 bottom bar: Home · Progress · Lessons · More (icon + label always).
//   laptop (≥ 900): a 240 left rail with every entry and the switcher at its top; the bottom bar is gone.
// Navigation entries appear only for pages that render real content (P6): no Monthly talk, Family or Plan entries.
// Data hooks re-lock the gate on a 403 and keep the last good copy for the offline state ("Last updated 6:42 pm").
// No sticky footer over content: the bottom bar reserves its own height, and screens with a PinPad hide it (`noTabs`).
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Art, Button, Icon, type IconName } from "../ui/index.ts";
import { teacherRecord } from "../ui/teacher/useTeacher.ts";
import { loadMe, refreshMe, type ChildRow } from "../app/api.ts";
import { Brand, Loading } from "../app/Shell.tsx";
import { bandForClass } from "../app/band.ts";
import { readStore, writeStore } from "../app/storage.ts";
import { isRelock } from "./api.ts";
import { BOARD_NAME, fmtTime, parentError } from "./copy.ts";
import { useGate } from "./Gate.tsx";

const PARENT_CHILD_KEY = "tx.parentChild";

/** The guardian's children and the one in view: route :cid, else ?c=, else the last one viewed, else the first. */
export function useChildren() {
  const { cid } = useParams();
  const [sp] = useSearchParams();
  const [kids, setKids] = useState<ChildRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    setErr(null);
    (n ? refreshMe() : loadMe()).then((m) => setKids(m?.children ?? []), (e) => setErr(parentError(e)));
  }, [n]);
  const want = cid ?? sp.get("c") ?? readStore<string | null>(PARENT_CHILD_KEY, null);
  const current = kids ? kids.find((k) => k.id === want) ?? kids[0] ?? null : null;
  useEffect(() => { if (current) writeStore(PARENT_CHILD_KEY, current.id); }, [current]);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { kids, current, err, reload };
}

/** Last good copy per request key, for this unlocked visit only (memory, never device storage). */
const lastGood = new Map<string, { data: unknown; at: string }>();

/**
 * Load parent data; a gate 403 re-locks the corner instead of showing an error. Errors are sentences (parentError),
 * never the server's string. With `cacheKey`, a failed reload keeps showing the last good copy and says when it was.
 */
export function useParentData<T>(fn: (() => Promise<T>) | null, deps: unknown[], cacheKey?: string) {
  const { relock } = useGate();
  const [data, setData] = useState<T | null>(() => (cacheKey ? (lastGood.get(cacheKey)?.data as T) ?? null : null));
  const [err, setErr] = useState<string | null>(null);
  const [stale, setStale] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    if (!fn) return;
    let live = true;
    setErr(null);
    fn().then((d) => {
      if (!live) return;
      setData(d);
      setStale(null);
      if (cacheKey) lastGood.set(cacheKey, { data: d, at: new Date().toISOString() });
    }, (e) => {
      if (!live) return;
      if (isRelock(e)) { relock(); return; }
      const prev = cacheKey ? lastGood.get(cacheKey) : undefined;
      if (prev) { setData(prev.data as T); setStale(prev.at); } else setErr(parentError(e));
    });
    return () => { live = false; };
  }, [...deps, n]);
  return { data, err, stale, reload, setData };
}

type Entry = { key: string; to: (cid: string) => string; label: string; icon: IconName; tab?: boolean; match: RegExp };
const q = (cid: string) => (cid ? `?c=${cid}` : "");
export const ENTRIES: Entry[] = [
  { key: "home", to: (c) => `/parent${q(c)}`, label: "Home", icon: "home", tab: true, match: /^\/parent\/?$|^\/parent\/evidence/ },
  { key: "progress", to: (c) => `/parent/progress${q(c)}`, label: "Progress", icon: "book", tab: true, match: /^\/parent\/progress/ },
  { key: "lessons", to: (c) => `/parent/lessons${q(c)}`, label: "Lessons", icon: "list", tab: true, match: /^\/parent\/lessons/ },
  { key: "notes", to: (c) => `/parent/notes${q(c)}`, label: "Notes", icon: "clock", match: /^\/parent\/notes/ },
  { key: "controls", to: (c) => `/parent/controls${q(c)}`, label: "Controls", icon: "shield", match: /^\/parent\/controls/ },
  { key: "children", to: (c) => `/parent/children${q(c)}`, label: "Children", icon: "plus", match: /^\/parent\/children/ },
  { key: "data", to: (c) => `/parent/data${q(c)}`, label: "Data and privacy", icon: "lock", match: /^\/parent\/data|^\/parent\/pin/ },
  { key: "help", to: (c) => `/parent/help${q(c)}`, label: "Help and safety", icon: "help", match: /^\/parent\/help/ },
];
const MORE_MATCH = /^\/parent\/(more|notes|controls|children|data|help|pin)/;

function TeacherBadge({ child }: { child: ChildRow }) {
  const rec = teacherRecord(child.teacher_id, bandForClass(child.class_level));
  const name = (child as ChildRow & { teacher_name?: string | null }).teacher_name || rec.name;
  return (
    <span className="pa-teacher" data-teacher-id={rec.id} title={`${name} · AI teacher`}>
      <Art id={rec.stills.portrait} className="pa-teacher-face" alt="" cover fallback={<span className="pa-teacher-disc" aria-hidden="true">{name.slice(0, 1)}</span>} />
      <span className="pa-teacher-name"><span>{name}</span><span className="pa-meta">AI teacher</span></span>
    </span>
  );
}

function Switcher({ kids, child, onSwitch }: { kids: ChildRow[]; child: ChildRow; onSwitch: (id: string) => void }) {
  return (
    <div className="pa-switch">
      {kids.length > 1 ? (
        <label className="pa-switch-select">
          <span className="sr-only">Child in view</span>
          <select value={child.id} onChange={(e) => onSwitch(e.target.value)}>
            {kids.map((k) => <option key={k.id} value={k.id}>{k.first_name}</option>)}
          </select>
          <Icon name="chevron" size={16} className="pa-switch-chev" />
        </label>
      ) : <span className="pa-switch-name">{child.first_name}</span>}
      <span className="pa-meta">Class {child.class_level} · {BOARD_NAME[child.board] ?? (child.board ? String(child.board).toUpperCase() : "CBSE")}</span>
    </div>
  );
}

export function ParentShell({ title, children, child, kids, noTabs, wide, side }:
  { title: string; children: ReactNode; child?: ChildRow | null; kids?: ChildRow[] | null;
    /** Hide the phone's bottom bar (a screen with a PinPad: nothing may sit over the keypad). */
    noTabs?: boolean;
    /** Home at 1280: the right column. */
    side?: ReactNode; wide?: boolean }) {
  const { lockNow } = useGate();
  const nav = useNavigate();
  const loc = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { document.title = `${title} · Parent corner · Taxila`; }, [title]);
  // Every screen opens at the top with focus on its title (as onboarding does; the audit saw scroll carried over).
  // The h1 may render only once the screen's data arrives, so look for it for a moment; never steal focus from a
  // control the parent has already moved to.
  useEffect(() => {
    window.scrollTo(0, 0);
    let tries = 0, raf = 0;
    const tick = () => {
      const h = mainRef.current?.querySelector<HTMLElement>("h1");
      const idle = !document.activeElement || document.activeElement === document.body;
      if (h && idle) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); return; }
      if (!h && tries++ < 90) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [loc.pathname]);
  const cid = child?.id ?? readStore<string | null>(PARENT_CHILD_KEY, null) ?? "";
  const onSwitch = (id: string) => nav(`${loc.pathname}?c=${id}`);
  const active = (e: Entry) => e.match.test(loc.pathname);
  return (
    <div className="pa" data-parent-shell="" data-tabs={noTabs ? "off" : "on"}>
      <a className="skip" href="#pa-main">Skip to content</a>
      <aside className="pa-rail" aria-label="Parent corner">
        <div className="pa-rail-brand"><Brand to={`/parent${q(cid)}`} /></div>
        {kids && child && <Switcher kids={kids} child={child} onSwitch={onSwitch} />}
        <nav className="pa-rail-nav" aria-label="Sections">
          {ENTRIES.map((e) => (
            <NavLink key={e.key} to={e.to(cid)} className={() => `pa-rail-item${active(e) ? " is-active" : ""}`} aria-current={active(e) ? "page" : undefined}>
              <Icon name={e.icon} size={22} /><span>{e.label}</span>
            </NavLink>
          ))}
        </nav>
        <Button variant="secondary" small onClick={lockNow} className="pa-rail-lock"><Icon name="lock" size={20} /> Lock</Button>
      </aside>
      <div className="pa-main">
        <header className="pa-top">
          {kids && child ? <Switcher kids={kids} child={child} onSwitch={onSwitch} /> : <span className="pa-switch-name">Parent corner</span>}
          <span className="pa-spacer" />
          {child && <TeacherBadge child={child} />}
          <button type="button" className="pa-lock" onClick={lockNow}><Icon name="lock" size={20} /><span>Lock</span></button>
        </header>
        <div className="pa-band" aria-hidden="true"><Art id="bg/parent-header" cover className="pa-band-art" fallback={<span />} /></div>
        <div className={`pa-body${side ? " pa-body--side" : ""}${wide ? " pa-body--wide" : ""}`}>
          <main id="pa-main" ref={mainRef} className="pa-content">{children}</main>
          {side && <aside className="pa-side" aria-label="More about this week">{side}</aside>}
        </div>
      </div>
      {!noTabs && (
        <nav className="pa-tabs" aria-label="Sections">
          {ENTRIES.filter((e) => e.tab).map((e) => (
            <NavLink key={e.key} to={e.to(cid)} className={() => `pa-tab${active(e) ? " is-active" : ""}`} aria-current={active(e) ? "page" : undefined}>
              <Icon name={e.icon} size={22} /><span>{e.label}</span>
            </NavLink>
          ))}
          <NavLink to={`/parent/more${q(cid)}`} className={() => `pa-tab${MORE_MATCH.test(loc.pathname) ? " is-active" : ""}`}
            aria-current={MORE_MATCH.test(loc.pathname) ? "page" : undefined}>
            <Icon name="more" size={22} /><span>More</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

/** Loading, a sentence-shaped error with Try again, or the offline note over the last good copy. */
export function PageState({ err, loading, stale, onRetry }: { err: string | null; loading: boolean; stale?: string | null; onRetry?: () => void }) {
  if (err) {
    return (
      <div className="pa-problem" role="alert">
        <Art id="states/something-wrong" className="pa-problem-art" fallback={<span />} />
        <p>{err}</p>
        {onRetry && <Button variant="secondary" small onClick={onRetry}>Try again</Button>}
      </div>
    );
  }
  if (stale) {
    return (
      <p className="pa-stale" role="status">
        <Icon name="clock" size={18} /> Can't reach Taxila right now. Last updated {fmtTime(stale)}.
        {onRetry && <button type="button" className="pa-textbtn" onClick={onRetry}>Try again</button>}
      </p>
    );
  }
  if (loading) return <Loading />;
  return null;
}

/** A row link with a chevron (More, lists). */
export function RowLink({ to, children, sub, onClick }: { to: string; children: ReactNode; sub?: ReactNode; onClick?: () => void }) {
  return (
    <NavLink to={to} className="pa-rowlink" onClick={onClick}>
      <span className="pa-rowlink-text"><span>{children}</span>{sub && <span className="pa-meta">{sub}</span>}</span>
      <Icon name="chevron" size={18} />
    </NavLink>
  );
}
