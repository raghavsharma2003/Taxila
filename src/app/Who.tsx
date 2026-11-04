// Child picker (`/who`, §2.3): the right child on the right profile, every session. One profile is still
// shown (a sibling cannot inherit a session). The last child is pre-selected but the confirm step stays.
// No badges, counts or progress on tiles. The parent door is small and dull, top right.
import { useEffect, useState, type ReactElement } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "../ui/index.ts";
import { ErrorNote } from "../ui/index.ts";
import { errText, getJson, loadMe, lockBeacon, type ChildRow } from "./api.ts";
import { bandForClass, useSurface } from "./band.ts";
import { YOUNG_MAX_CLASS } from "../child/band.ts";
import { Loading } from "./Shell.tsx";
import { Avatar as ChildAvatar } from "../child/pictos.tsx";
import { readStore, writeStore } from "./storage.ts";
// Release 11 (dc-r4-volt-everywhere): the picker wears the child app's Volt look (the same tx-child[data-v2] scope as
// ChildShell, so childshell.css re-points the v2 tokens); nothing on a ?ui=classic device
import { kakshaShellAttrs } from "../ui-v3/kaksha/shell-theme.ts";
import { Cta, Ghost, Glyph, KxPage } from "../ui-v3/kaksha/kit.tsx";

export const LAST_CHILD_KEY = "tx.lastChild";

/** The picture the child picked at Hello (flows G14: the same picture home shows), else their initial. */
function Avatar({ c }: { c: ChildRow }) {
  if (c.avatar) return <span className="avatar avatar--pic" style={{ overflow: "hidden", background: "transparent" }} aria-hidden="true"><ChildAvatar id={c.avatar} size={64} /></span>;
  return <span className="avatar" aria-hidden="true">{(c.first_name.trim()[0] || "?").toUpperCase()}</span>;
}

export default function Who() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [kids, setKids] = useState<ChildRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [pendingReset, setPendingReset] = useState<string | null>(null);

  // r7 D3: the young look is classes 1-3 only (class 4 has the older one)
  const young = !!kids?.some((c) => c.class_level <= YOUNG_MAX_CLASS);
  useSurface({ band: kids ? (young ? "b1" : "b3") : null });

  // The picker is child mode: whatever brought the phone here (Lock, Back, the P8 handover), the corner is shut.
  useEffect(() => { lockBeacon(); }, []);
  // A forgotten-PIN reset is waiting: shown here too, not only on the locked gate, because the WhatsApp notice
  // of §6.2 is not wired yet and the grown-up may never open the Parent corner within the 24 h.
  useEffect(() => {
    getJson<{ pendingResetAt?: string | null }>("/api/parent/pin").then((g) => setPendingReset(g.pendingResetAt ?? null), () => {});
  }, []);

  useEffect(() => {
    document.title = "Who is learning? · Taxila";
    loadMe().then((me) => {
      // r5 QA D18: signed out on a phone that has had a learner here (a remembered last child) → Sign in, not a new account
      if (!me) return nav(readStore<string | null>(LAST_CHILD_KEY, null) ? "/start/phone?login=1" : "/start/lang", { replace: true });
      if (!me.children.length) return nav("/start/child", { replace: true });
      setKids(me.children);
      // After a lesson finish the next tap must be a deliberate pick (§2.5.1): ?fresh=1 skips the pre-select.
      const last = sp.get("fresh") ? null : readStore<string | null>(LAST_CHILD_KEY, null);
      if (last && me.children.some((c) => c.id === last)) setPicked(last);
    }, (e) => setErr(errText(e)));
  }, [nav, sp]);

  const go = (c: ChildRow) => {
    writeStore(LAST_CHILD_KEY, c.id);
    nav(`/c/${c.id}`);
  };

  const look = kakshaShellAttrs(null, young ? "young" : "older");
  const scope = (el: ReactElement) => (Object.keys(look).length ? <div className="tx-child kx-who-scope" data-v2="" {...look}>{el}</div> : el);
  if (err) return scope(<main className="col center-fill"><ErrorNote>{err}</ErrorNote></main>);
  if (!kids) return scope(<Loading />);
  const chosen = kids.find((c) => c.id === picked) ?? null;

  const resetNote = pendingReset && (
    <>
      For grown-ups: someone asked to reset the parent PIN. It changes on{" "}
      {new Date(pendingReset).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" })}.
      If that was not you, open the Parent corner and enter the current PIN: that cancels it.
    </>
  );
  if (Object.keys(look).length) {
    // Kaksha (r7 app-secondary-screens-kaksha): a profile select. Each learner a chamfered tile; the confirm a HUD strip
    // with No and the one plasma Yes. Same steps and wording as before; the parent door is the plain top-right link.
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    return scope(
      <KxPage family={young ? "young" : "older"} reducedMotion={reduced} screen="who" bare meTo="/who" className="kx-whosel">
        <header className="kx-top">
          <span className="kx-mark" aria-label="Taxila"><i aria-hidden="true" /><span className="kx-wordmark">TAXILA</span></span>
          <span className="kx-sp" />
          <Link to="/parent" className="kx-ib kx-cut parent-door" aria-label="Parent corner, for grown-ups"><Glyph name="door" size={22} /></Link>
        </header>
        <h1 className="kx-h2 kx-whosel-title">Who is learning?</h1>
        <ul className="kx-profiles" aria-label="Children">
          {kids.map((c) => (
            <li key={c.id}>
              <button type="button" className="kx-profile kx-cut profile-tile" aria-pressed={c.id === picked} onClick={() => setPicked(c.id)} data-tile-band={bandForClass(c.class_level)}>
                <span className="kx-profile-pic"><Avatar c={c} /></span>
                <span className="kx-profile-name profile-name">{c.first_name}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="kx-whosel-confirm" aria-live="polite">
          {chosen && (
            <div className="kx-panel kx-cut kx-whosel-ask">
              <p className="kx-whosel-q">Continue as <strong>{chosen.first_name}</strong>?</p>
              <div className="kx-hello-pair">
                <Ghost onClick={() => setPicked(null)} label={`No, I am not ${chosen.first_name}`} className="pair-no"><Glyph name="cross" size={22} /> No</Ghost>
                <Cta onClick={() => go(chosen)} label={`Yes, I am ${chosen.first_name}`}><Glyph name="tick" size={22} /> Yes</Cta>
              </div>
            </div>
          )}
        </div>
        {resetNote && <p className="kx-sub kx-whosel-note" role="status">{resetNote}</p>}
        <Link to="/start/child?add=1" className="kx-textlink kx-whosel-add"><Glyph name="plus" size={18} /> Add a child (parent)</Link>
      </KxPage>
    );
  }
  return scope(
    <main className={`who ${young ? "who-young" : "who-older"}`}>
      <header className="topbar">
        <span className="spacer" />
        <Link to="/parent" className="iconbtn parent-door" aria-label="Parent corner, for grown-ups"><Icon name="door" /></Link>
      </header>
      <div className="who-body">
        <h1 className="who-title">Who is learning?</h1>
        <ul className="who-grid" aria-label="Children">
          {kids.map((c) => (
            <li key={c.id}>
              <button type="button" className="profile-tile" aria-pressed={c.id === picked} onClick={() => setPicked(c.id)}
                data-tile-band={bandForClass(c.class_level)}>
                <Avatar c={c} />
                <span className="profile-name">{c.first_name}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="who-confirm" aria-live="polite">
          {chosen && (
            <>
              <p className="who-ask">Continue as <strong>{chosen.first_name}</strong>?</p>
              <div className="who-pair">
                <button type="button" className="pair-btn pair-no" onClick={() => setPicked(null)} aria-label={`No, I am not ${chosen.first_name}`}>
                  <Icon name="cross" size={36} /><span>No</span>
                </button>
                <button type="button" className="pair-btn pair-yes" onClick={() => go(chosen)} aria-label={`Yes, I am ${chosen.first_name}`}>
                  <Icon name="tick" size={36} /><span>Yes</span>
                </button>
              </div>
            </>
          )}
        </div>
        {resetNote && <p className="note who-reset t-note" role="status">{resetNote}</p>}
        {/* Behind the gate: /start/child?add=1 sits under GateIfPin, so a child tapping it meets the PIN pad. */}
        <Link to="/start/child?add=1" className="who-add t-note"><Icon name="lock" size={16} /> Add a child (parent)</Link>
      </div>
    </main>
  );
}
