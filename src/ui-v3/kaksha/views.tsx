// Kaksha presentational views (BUILD-SPEC §3.1, §4): pure props in, no data fetching, no router. The containers in
// screens/ feed them from ChildShell and the server; the dev page feeds them fixtures for shots and the lint harness.
// Rules every view keeps: ONE plasma "your move" element per screen state (data-volt); the teacher's name always with
// "AI teacher"; no lock glyphs, no "n of m", no points (tests/r4-kaksha-lint.test.mjs); English chrome (G-EN-1).
import { useState, type MouseEvent, type ReactNode } from "react";
import { Comms, Sky } from "./Shell.tsx";
import { Orbit } from "./Orbit.tsx";
import { Settlement } from "./Settlement.tsx";
import { kt, RING_LABEL } from "./copy.ts";
import type { HangarItem, World } from "./world.ts";
import type { TeacherFloor } from "../../ui/teacher/Teacher.tsx";

export type Go = (to: string) => void;

/** A link that routes through `go` when given (the app) and is a plain href otherwise (the dev page). */
function A({ to, go, className, children, testid, label }: { to: string; go?: Go; className?: string; children: ReactNode; testid?: string; label?: string }) {
  const onClick = (e: MouseEvent) => {
    if (!go) return;
    e.preventDefault();
    go(to);
  };
  return <a href={to} className={className} onClick={onClick} data-testid={testid} aria-label={label}>{children}</a>;
}

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}
const I = {
  play: "M7 4.5v15l13-7.5z",
  orbit: "M12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4M2.4 14.6c-.9-2.7 3-6 8.7-7.4s10.9-.6 11.8 2.1-3 6-8.7 7.4-10.9.6-11.8-2.1",
  parent: "M9 8a3 3 0 1 0 0-.01M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M17 9.5a2.4 2.4 0 1 0 0-.01M15.5 20c0-2.4 1-4.4 3-4.8",
  back: "M15 5l-7 7 7 7",
  hangar: "M3 20V10l9-6 9 6v10M8 20v-6h8v6",
};

// ---------------------------------------------------------------- Home (Open)

export interface HomeViewProps {
  childName: string;
  teacher: { id: string | null | undefined; name: string; band: string; form?: "live" | "plate"; tier?: "D" | "E" };
  family: "young" | "older";
  reducedMotion: boolean;
  /** "start": Start; "done": Start + the done line; "capped" / "resting": no CTA (calm line); "loading": no CTA. */
  state: "start" | "done" | "capped" | "resting" | "loading";
  startTo: string;
  worldTo: string;
  parentTo: string;
  opensAt?: string | null;
  greeting: "morning" | "day" | "evening";
  go?: Go;
  floor?: TeacherFloor;
}

export function HomeView(p: HomeViewProps) {
  const greet = kt(p.greeting === "morning" ? "greetMorning" : p.greeting === "evening" ? "greetEvening" : "greetDay", { name: p.childName });
  const sub = p.state === "done" ? kt("doneSub") : p.state === "capped" ? kt("cappedSub") : p.state === "resting" ? kt("restSub", { time: p.opensAt ?? "" }) : kt("openSub");
  const cta = p.state === "start" || p.state === "done";
  return (
    <div className="kx-screen kx-home">
      <Sky screen="home" reducedMotion={p.reducedMotion} />
      <header className="kx-top">
        <span className="kx-mark" aria-label="Taxila"><i aria-hidden="true" /><span className="kx-wordmark">TAXILA</span></span>
      </header>
      <main className="kx-home-main">
        <Comms className="kx-home-face" teacherId={p.teacher.id} teacherName={p.teacher.name} band={p.teacher.band} form={p.teacher.form} tier={p.teacher.tier}
          floor={p.floor ?? "idle"} framing="medium" reducedMotion={p.reducedMotion} />
        <section className="kx-home-copy" data-testid="primary-card" data-state={p.state}>
          <h1 className="kx-h1">{greet}</h1>
          <p className="kx-sub">{sub}</p>
          {cta ? (
            <A to={p.startTo} go={p.go} className="kx-cta kx-cut" testid="start-lesson" label={`${kt("start")}, with ${p.teacher.name}, ${kt("aiTeacher")}`}>
              <span className="kx-cta-sweep" aria-hidden="true" />
              <Icon d={I.play} size={22} />
              <span data-volt="">{kt("start")}</span>
            </A>
          ) : null}
          <nav className="kx-dock" aria-label="More">
            <A to={p.worldTo} go={p.go} className="kx-dockbtn kx-cut" testid="kx-world"><Icon d={I.orbit} />{kt("myOrbit")}</A>
            <A to={p.parentTo} go={p.go} className="kx-dockbtn kx-cut" testid="grownups"><Icon d={I.parent} />{kt("forParents")}</A>
          </nav>
        </section>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- World

export interface WorldViewProps {
  childName: string;
  world: World;
  /** The "Yesterday" world (null: no snapshot yet, the toggle is hidden). */
  yesterday: World | null;
  hidden: boolean;
  reducedMotion: boolean;
  backTo: string;
  hangarTo: string;
  go?: Go;
}

export function WorldView(p: WorldViewProps) {
  const [when, setWhen] = useState<"today" | "yesterday">("today");
  const [view, setView] = useState<"orbit" | "settlement">("orbit");
  const [pick, setPick] = useState<string | null>(null);
  const w = when === "yesterday" && p.yesterday ? p.yesterday : p.world;
  const station = pick ? w.rings.flatMap((r) => r.stations.map((s) => ({ ...s, subject: r.subject }))).find((s) => s.skillId === pick) : null;
  const built = pick ? w.structures.find((s) => s.skillId === pick) : null;
  const opened = pick ? w.items.filter((i) => i.open && i.by === (station?.title ?? built?.title)) : [];
  return (
    <div className="kx-screen kx-world">
      <Sky screen="world" reducedMotion={p.reducedMotion} />
      <header className="kx-top">
        <A to={p.backTo} go={p.go} className="kx-ib kx-cut" label={kt("back")}><Icon d={I.back} /></A>
        <span className="kx-sp" />
        {p.yesterday && (
          <div className="kx-seg" role="radiogroup" aria-label="When">
            {(["yesterday", "today"] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={when === k} onClick={() => setWhen(k)}>{kt(k)}</button>
            ))}
          </div>
        )}
      </header>
      <div className="kx-world-grid">
        <div className="kx-world-head">
          <span className="kx-label">{kt("yourWorld")}</span>
          <h1 className="kx-h2">{kt("orbitTitle", { name: p.childName })}</h1>
        </div>
        <div className="kx-world-stage">
          <div className="kx-seg kx-seg--view" role="radiogroup" aria-label="View">
            {(["orbit", "settlement"] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={view === k} onClick={() => setView(k)}>{kt(k === "orbit" ? "viewOrbit" : "viewSettlement")}</button>
            ))}
          </div>
          {p.hidden ? (
            <p className="kx-sub kx-world-empty">{kt("hidden")}</p>
          ) : view === "orbit" ? (
            <Orbit world={w} reducedMotion={p.reducedMotion} onPick={setPick} label={`${kt("orbitTitle", { name: p.childName })}: ${w.rings.map((r) => kt(RING_LABEL[r.subject] ?? "ringMaths")).join(", ")}`} />
          ) : (
            <Settlement structures={w.structures} reducedMotion={p.reducedMotion} onPick={setPick} label={kt("settlementSub")} />
          )}
          {!p.hidden && !w.any && <p className="kx-sub kx-world-empty">{kt("emptyWorld")}</p>}
          {!p.hidden && view === "orbit" && w.rings.length > 0 && (
            <ul className="kx-legend" aria-label="Rings">
              {w.rings.map((r) => <li key={r.subject} style={{ ["--c" as string]: `var(--k-r-${r.subject === "sst" ? "social" : r.subject})` }}><i aria-hidden="true" />{kt(RING_LABEL[r.subject] ?? "ringMaths")}</li>)}
            </ul>
          )}
          {!p.hidden && view === "settlement" && <p className="kx-sub">{kt("settlementSub")}</p>}
        </div>
        <section className="kx-world-side">
          {!p.hidden && (
            <ul className="kx-stations" aria-label="Secure ideas">
              {w.rings.flatMap((r) => r.stations.map((s) => (
                <li key={s.skillId}>
                  <button type="button" className={`kx-station kx-cut${s.isNew ? " is-new" : ""}`} onClick={() => setPick(s.skillId)}>
                    <i aria-hidden="true" style={{ ["--c" as string]: `var(--k-r-${r.subject === "sst" ? "social" : r.subject})` }} />
                    <span>{s.title}</span>
                    {s.isNew && <b className="kx-new">{kt("newMark")}</b>}
                  </button>
                </li>
              )))}
            </ul>
          )}
          <A to={p.hangarTo} go={p.go} className="kx-dockbtn kx-cut kx-hangar-link" testid="kx-hangar"><Icon d={I.hangar} />{kt("hangar")}</A>
        </section>
      </div>
      <div className={`kx-sheet kx-cut${pick ? " is-on" : ""}`} role="dialog" aria-modal="false" aria-hidden={!pick} aria-labelledby="kx-sheet-h">
        {pick && (
          <>
            <span className="kx-label kx-secure-ink">{kt("secureSince")}</span>
            <h2 id="kx-sheet-h" className="kx-h3">{station?.title ?? built?.title}</h2>
            {built && <p className="kx-sub">{`${built.label}: ${built.why}`}</p>}
            {opened.map((i) => <p key={i.id} className="kx-sub">{`${kt("opened")}: ${i.label}`}</p>)}
            <button type="button" className="kx-ghost kx-cut" onClick={() => setPick(null)}>{kt("close")}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Hangar

export function ItemArt({ item }: { item: Pick<HangarItem, "kind" | "hue" | "id"> }) {
  const c = `var(--k-hue-${item.hue})`;
  const gid = `kxg-${item.id}`;
  if (item.kind === "board") {
    return (
      <svg className="kx-item-art" viewBox="0 0 160 64" aria-hidden="true">
        <rect x="30" y="8" width="100" height="48" rx="3" fill="var(--k-deep)" stroke={c} strokeWidth="2" />
        <path d="M44 40h72M60 34v12M80 34v12M100 34v12" stroke={c} strokeWidth="2" />
      </svg>
    );
  }
  if (item.kind === "rim") {
    return (
      <svg className="kx-item-art" viewBox="0 0 160 64" aria-hidden="true">
        <path d="M58 6h52l12 12v40H48V16z" fill="none" stroke={c} strokeWidth="3" />
        <path d="M112 8h8v8M50 50v8h8" stroke={c} strokeWidth="2" fill="none" />
      </svg>
    );
  }
  return (
    <svg className="kx-item-art" viewBox="0 0 160 64" aria-hidden="true">
      <defs><linearGradient id={gid} x1="0" x2="1"><stop offset="0" stopColor={c} stopOpacity="0" /><stop offset="1" stopColor={c} /></linearGradient></defs>
      <path d="M8 34h70" stroke={`url(#${gid})`} strokeWidth={item.kind === "trail" ? 7 : 4} strokeLinecap="round" />
      <path d="M70 22l64 10-64 10 10-10z" fill="var(--k-ink)" />
      <path d="M80 32l-10-10 34 8z" fill={c} />
      <path d="M84 18l22 14-22 14" fill="none" stroke={c} strokeWidth="2" />
    </svg>
  );
}

export interface HangarViewProps {
  items: HangarItem[];
  equipped: Record<string, string>;
  onEquip: (slot: string, id: string) => void;
  reducedMotion: boolean;
  backTo: string;
  go?: Go;
}

export function HangarView(p: HangarViewProps) {
  const [pick, setPick] = useState<HangarItem | null>(null);
  return (
    <div className="kx-screen kx-hangar">
      <Sky screen="hangar" reducedMotion={p.reducedMotion} />
      <header className="kx-top">
        <A to={p.backTo} go={p.go} className="kx-ib kx-cut" label={kt("back")}><Icon d={I.back} /></A>
      </header>
      <main className="kx-hangar-main">
        <h1 className="kx-h2">{kt("hangar")}</h1>
        <p className="kx-sub">{kt("hangarSub")}</p>
        <ul className="kx-tiles">
          {p.items.map((it) => {
            const inUse = p.equipped[it.kind] === it.id;
            return (
              <li key={it.id}>
                <button type="button" className={`kx-tile kx-cut${it.open ? "" : " is-dim"}${it.isNew ? " is-new" : ""}`} onClick={() => setPick(it)}
                  aria-label={`${it.label}. ${it.open ? kt("opened") : `${kt("opensWhen")}: ${it.opensWith}`}`}>
                  <ItemArt item={it} />
                  <b>{it.label}</b>
                  <span>{it.open ? (inUse ? kt("equipped") : it.by ?? "") : `${kt("opensWhen")}: ${it.opensWith}`}</span>
                  {it.isNew && <i className="kx-new">{kt("newMark")}</i>}
                </button>
              </li>
            );
          })}
        </ul>
      </main>
      <div className={`kx-sheet kx-cut${pick ? " is-on" : ""}`} role="dialog" aria-modal="false" aria-hidden={!pick} aria-labelledby="kx-hsheet-h">
        {pick && (
          <>
            <span className="kx-label">{pick.open ? kt("opened") : kt("opensWhen")}</span>
            <h2 id="kx-hsheet-h" className="kx-h3">{pick.label}</h2>
            <p className="kx-sub">{pick.open ? pick.by : pick.opensWith}</p>
            <div className="kx-row">
              {pick.open && p.equipped[pick.kind] !== pick.id && (
                <button type="button" className="kx-ghost kx-cut" onClick={() => { p.onEquip(pick.kind, pick.id); setPick(null); }}>{kt("equip")}</button>
              )}
              <button type="button" className="kx-ghost kx-cut" onClick={() => setPick(null)}>{kt("close")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
