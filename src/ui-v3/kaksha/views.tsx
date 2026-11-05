// Kaksha presentational views (BUILD-SPEC §3.1, §4): pure props in, no data fetching, no router. The containers in
// screens/ feed them from ChildShell and the server; the dev page feeds them fixtures for shots and the lint harness.
// Rules every view keeps: ONE plasma "your move" element per screen state (data-volt); the teacher's name always with
// "AI teacher"; no lock glyphs, no "n of m", no points (tests/r4-kaksha-lint.test.mjs); English chrome (G-EN-1).
import { useState, type MouseEvent, type ReactNode } from "react";
import { Comms, Sky } from "./Shell.tsx";
import { Orbit } from "./Orbit.tsx";
import { Settlement } from "./Settlement.tsx";
import { kt, KX_NAMES, RING_LABEL } from "./copy.ts";
import { BASE } from "./Base.tsx";
import { futurist } from "./look.ts";
import { KxDock, KxTopBar, type NavItem } from "./nav.tsx";
import { tr7 } from "../../copy/en.ts";
import type { HangarItem, World } from "./world.ts";
import type { TeacherFloor } from "../../ui/teacher/Teacher.tsx";
import type { TapSource } from "../../avatar/tap.ts";

export type Go = (to: string) => void;

/** r7 app-nav-unified: the one dock and the Me door, shared by every Kaksha screen (nav.tsx). Absent: no dock (dev). */
export interface NavProps { dock?: NavItem[]; meTo?: string }

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
  swap: "M7 7h11l-3-3M17 17H6l3 3",
  hangar: "M3 20V10l9-6 9 6v10M8 20v-6h8v6",
  practice: "M13 3L5 13h6l-1 8 8-10h-6z",
};

// ---------------------------------------------------------------- Home (Open)

export interface HomeViewProps extends NavProps {
  childName: string;
  teacher: { id: string | null | undefined; name: string; band: string; form?: "live" | "plate"; tier?: "D" | "E" };
  family: "young" | "older";
  reducedMotion: boolean;
  /** "start": Start; "done": One more + what they did; "capped" / "resting": no CTA (calm line); "loading": no CTA.
   *  r7 app-home-plan-states: "homework": Homework help (the lesson one tap below); "test": Revise for the school test. */
  state: "start" | "done" | "capped" | "resting" | "loading" | "homework" | "test";
  /** homework: today's lesson as the quiet second link (STUDENT-FLOW §4.2), never a second primary. */
  lessonTo?: string | null;
  /** test: the test's subject in words. */
  testSubject?: string | null;
  /** done: today's first did card (her question and the child's answer; never a score). */
  did?: { ask: string | null; answer: string; withHelp: boolean } | null;
  /** done: today's made-for pieces (newest first; the strip is absent while empty). */
  madeFor?: Array<{ id: string; title: string; still: string | null; to: string }>;
  /** Questions parked in earlier lessons still waiting (a calm line, never a count). */
  jarWaiting?: boolean;
  startTo: string;
  worldTo: string;
  parentTo: string;
  /** The child picker, when this account has more than one child (audit B06: Finish now lands here, so a sibling needs a way on). */
  whoTo?: string | null;
  opensAt?: string | null;
  greeting: "morning" | "day" | "evening";
  /** r5 QA D24: the Start link continues an open lesson (its own line and label; still the same CTA). */
  resuming?: boolean;
  go?: Go;
  floor?: TeacherFloor;
  /** Her output meters while she speaks her daily greeting (Face stream useDailyGreeting). */
  meters?: TapSource[];
}

export function HomeView(p: HomeViewProps) {
  const greet = kt(p.greeting === "morning" ? "greetMorning" : p.greeting === "evening" ? "greetEvening" : "greetDay", { name: p.childName });
  const sub = p.resuming && p.state === "start" ? kt("resumeSub") : p.state === "done" ? kt("doneSub") : p.state === "capped" ? kt("cappedSub")
    : p.state === "resting" ? kt("restSub", { time: p.opensAt ?? "" }) : p.state === "homework" ? kt("homeworkSub")
      : p.state === "test" ? kt("testSub", { subject: p.testSubject || "school" }) : kt("openSub");
  const cta = p.state === "start" || p.state === "done" || p.state === "homework" || p.state === "test";
  const ctaWord = p.state === "homework" ? kt("homeworkCta") : p.state === "test" ? kt("reviseCta") : p.state === "done" ? kt("anotherCta") : kt("start");
  return (
    <div className={`kx-screen kx-home${p.dock ? " kx-hasdock" : ""}`} data-home-state={p.state} data-summary={p.state === "done" && (p.did || p.madeFor?.length) ? "1" : undefined}>
      <Sky screen="home" reducedMotion={p.reducedMotion} />
      {p.meTo ? (
        <KxTopBar go={p.go} meTo={p.meTo} parentTo={p.parentTo}
          brand={<span className="kx-mark" aria-label="Taxila"><i aria-hidden="true" /><span className="kx-wordmark">TAXILA</span></span>} />
      ) : (
        <header className="kx-top">
          <span className="kx-mark" aria-label="Taxila"><i aria-hidden="true" /><span className="kx-wordmark">TAXILA</span></span>
          {futurist() && <span className="kx-shell">{KX_NAMES.shell}</span>}
        </header>
      )}
      <main className="kx-home-main">
        <Comms className="kx-home-face" teacherId={p.teacher.id} teacherName={p.teacher.name} band={p.teacher.band} form={p.teacher.form} tier={p.teacher.tier}
          floor={p.floor ?? "idle"} framing="medium" reducedMotion={p.reducedMotion} meters={p.meters} />
        <section className="kx-home-copy" data-testid="primary-card" data-state={p.state}>
          <h1 className="kx-h1">{greet}</h1>
          <p className="kx-sub">{sub}</p>
          {cta && p.resuming ? (
            // r5 QA D24: the same CTA continuing an open lesson; its accessible name still names her as an AI teacher
            <A to={p.startTo} go={p.go} className="kx-cta kx-cut" testid="start-lesson" label={`${kt("continueCta")}, with ${p.teacher.name}, ${kt("aiTeacher")}`}>
              <span className="kx-cta-sweep" aria-hidden="true" />
              <Icon d={I.play} size={22} />
              <span data-volt="">{kt("continueCta")}</span>
            </A>
          ) : cta ? (
            <A to={p.startTo} go={p.go} className="kx-cta kx-cut" testid="start-lesson" label={`${ctaWord}, with ${p.teacher.name}, ${kt("aiTeacher")}`}>
              <span className="kx-cta-sweep" aria-hidden="true" />
              <Icon d={I.play} size={22} />
              <span data-volt="">{ctaWord}</span>
            </A>
          ) : null}
          {p.state === "homework" && p.lessonTo && (
            <A to={p.lessonTo} go={p.go} className="kx-textlink" testid="homework-lesson">{kt("todaysLesson")}</A>
          )}
          {p.state === "done" && p.did && (
            <div className="kx-did kx-cut" data-testid="did-card">
              <span className="kx-label">{kt("didToday")}</span>
              {p.did.ask && <p className="kx-did-ask" data-speech="">{p.did.ask}</p>}
              <p className="kx-did-ans"><span className="kx-sr">{kt("answered")}: </span>{p.did.answer}<span className="kx-did-how">{p.did.withHelp ? kt("withHint") : kt("onOwn")}</span></p>
            </div>
          )}
          {p.madeFor && p.madeFor.length > 0 && (p.state === "done" || p.state === "capped") && (
            <section className="kx-madefor" aria-label={kt("madeForYou")} data-testid="madefor-shelf">
              <span className="kx-label">{kt("madeForYou")}</span>
              <ul>{p.madeFor.slice(0, 3).map((it) => (
                <li key={it.id}><A to={it.to} go={p.go} className="kx-madefor-item kx-cut">
                  {it.still ? <img src={it.still} alt="" width={96} height={72} loading="lazy" /> : <i aria-hidden="true" />}
                  <span>{it.title}</span>
                </A></li>
              ))}</ul>
            </section>
          )}
          {p.jarWaiting && (p.state === "start" || p.state === "test") && <p className="kx-sub kx-jar" data-testid="jar-waiting">{kt("jarWaiting")}</p>}
          {p.dock ? (
            // r7: World, Notebook, Practice and Ask live in the one dock; the parent door is in the top bar. Only the
            // sibling switch stays here (audit B06).
            p.whoTo ? <nav className="kx-dock" aria-label="More">
              <A to={p.whoTo} go={p.go} className="kx-dockbtn kx-cut" testid="kx-who"><Icon d={I.swap} />{kt("notMe", { name: p.childName })}</A>
            </nav> : null
          ) : (
            <nav className="kx-dock" aria-label="More">
              <A to={p.worldTo} go={p.go} className="kx-dockbtn kx-cut" testid="kx-world"><Icon d={I.orbit} />{kt("myOrbit")}</A>
              <A to={p.parentTo} go={p.go} className="kx-dockbtn kx-cut" testid="grownups"><Icon d={I.parent} />{kt("forParents")}</A>
              {p.whoTo && <A to={p.whoTo} go={p.go} className="kx-dockbtn kx-cut" testid="kx-who"><Icon d={I.swap} />{kt("notMe", { name: p.childName })}</A>}
            </nav>
          )}
        </section>
      </main>
      {p.dock && <KxDock items={p.dock} active="home" go={p.go} />}
    </div>
  );
}

// ---------------------------------------------------------------- World

export interface WorldViewProps extends NavProps {
  /** r7 (F Learning): the chapters the parent said school is on ("Your class is here"); empty: no line. */
  school?: Array<{ subject: string; title: string }>;
  childName: string;
  world: World;
  /** The "Yesterday" world (null: no snapshot yet, the toggle is hidden). */
  yesterday: World | null;
  hidden: boolean;
  reducedMotion: boolean;
  backTo: string;
  hangarTo: string;
  /** r7 app-world-hangar-depth: the chapters the ledger has sealed (empty: no row). */
  seals?: Array<{ id: string; subject: string; title: string }>;
  /** r7 app-practice-entry: where "Practise this" on a station goes (its topic's practice set); null: not offered (hold). */
  practiceTo?: ((skillId: string) => string | null) | null;
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
  const whenSeg = p.yesterday ? (
    <div className="kx-seg" role="radiogroup" aria-label="When">
      {(["yesterday", "today"] as const).map((k) => (
        <button key={k} type="button" role="radio" aria-checked={when === k} onClick={() => setWhen(k)}>{kt(k)}</button>
      ))}
    </div>
  ) : null;
  return (
    <div className={`kx-screen kx-world${p.dock ? " kx-hasdock" : ""}`}>
      <Sky screen="world" reducedMotion={p.reducedMotion} />
      {p.meTo ? (
        <KxTopBar go={p.go} backTo={p.backTo} meTo={p.meTo} actions={whenSeg} />
      ) : (
        <header className="kx-top">
          <A to={p.backTo} go={p.go} className="kx-ib kx-cut" label={kt("back")}><Icon d={I.back} /></A>
          <span className="kx-sp" />
          {whenSeg}
        </header>
      )}
      <div className="kx-world-grid">
        <div className="kx-world-head">
          <span className="kx-label">{kt("yourWorld")}</span>
          <h1 className="kx-h2">{kt("orbitTitle", { name: p.childName })}</h1>
          {p.school?.map((s) => (
            <p key={`${s.subject}:${s.title}`} className="kx-sub kx-school" data-testid="school-here">
              <i aria-hidden="true" style={{ ["--c" as string]: `var(--k-r-${s.subject === "sst" ? "social" : s.subject})` }} />
              {tr7("map.schoolHereAt", { subject: kt(RING_LABEL[s.subject] ?? "ringMaths"), chapter: s.title })}
            </p>
          ))}
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
          {!p.hidden && (p.seals?.length ?? 0) > 0 && (
            <section className="kx-seals" aria-label={kt("sealedChapters")} data-testid="world-seals">
              <p className="kx-label kx-secure-ink">{kt("sealedChapters")}</p>
              <ul>
                {p.seals!.map((c) => (
                  <li key={c.id} className="kx-seal kx-cut" style={{ ["--c" as string]: `var(--k-r-${c.subject === "sst" ? "social" : c.subject})` }}>
                    <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l14 6v10c0 9-6 15-14 18C12 34 6 28 6 19V9z" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M13 20l5 5 9-10" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>{c.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <A to={p.hangarTo} go={p.go} className="kx-dockbtn kx-cut kx-hangar-link" testid="kx-hangar"><Icon d={I.hangar} />{kt("hangar")}</A>
        </section>
      </div>
      <div className={`kx-sheet kx-cut${pick ? " is-on" : ""}`} role="dialog" aria-modal="false" aria-hidden={!pick} aria-labelledby="kx-sheet-h">
        {pick && (
          <>
            <span className="kx-label kx-secure-ink">{kt("secureSince")}</span>
            <h2 id="kx-sheet-h" className="kx-h3">{station?.title ?? built?.title}</h2>
            {built && <p className="kx-sub">{futurist() && BASE[built.kind] ? `${BASE[built.kind].label}: ${BASE[built.kind].why}` : `${built.label}: ${built.why}`}</p>}
            {opened.map((i) => <p key={i.id} className="kx-sub">{`${kt("opened")}: ${i.label}`}</p>)}
            <div className="kx-row">
              {/* r7 app-practice-entry: a quick retrieval set on this idea (in-run feedback only, nothing carried) */}
              {station && p.practiceTo?.(station.skillId) && (
                <A to={p.practiceTo(station.skillId)!} go={p.go} className="kx-ghost kx-cut kx-ghost--go" testid="station-practise"><Icon d={I.practice} />{kt("practiseThis")}</A>
              )}
              <button type="button" className="kx-ghost kx-cut" onClick={() => setPick(null)}>{kt("close")}</button>
            </div>
          </>
        )}
      </div>
      {p.dock && <KxDock items={p.dock} active="world" go={p.go} />}
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
  if (item.kind === "emote") {
    // an emote: a reaction the child can send her at the end of a lesson (direction proposal; earned like every item)
    const g = item.id.endsWith("rocket") ? "M80 8c12 8 16 22 12 36H68C64 30 68 16 80 8zM68 44l-8 10h12M92 44l8 10H88M76 46h8l-4 12z"
      : item.id.endsWith("wave") ? "M60 40c0-12 8-18 14-18M74 22v-8M82 22V10M90 24V12M98 28V18M60 40c2 10 10 16 22 16 12 0 18-8 18-20V26"
      : "M80 8l6 18h18l-14 11 5 18-15-11-15 11 5-18-14-11h18z";
    return (
      <svg className="kx-item-art" viewBox="0 0 160 64" aria-hidden="true">
        <circle cx="80" cy="32" r="30" fill={`color-mix(in srgb, ${c} 18%, transparent)`} />
        <path d={g} fill={item.id.endsWith("wave") ? "none" : c} stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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

/** The ship as equipped, and its slots (futurist looks): what the child has put together, never what is missing. */
function Loadout({ items, equipped }: { items: HangarItem[]; equipped: Record<string, string> }) {
  const on = (kind: string) => items.find((i) => i.id === equipped[kind] && i.open) ?? null;
  const hue = (kind: string, fallback: string) => { const i = on(kind); return i ? `var(--k-hue-${i.hue})` : fallback; };
  const SLOTS: Array<[string, string]> = [["hull", "Hull"], ["trail", "Trail"], ["board", "Board"], ["emote", "Emote"]];
  return (
    <section className="kx-loadout kx-cut" aria-label="Your ship">
      <svg viewBox="0 0 132 110" aria-hidden="true">
        <path d="M66 70 L58 104 L66 96 L74 104 Z" fill={hue("trail", "var(--k-move)")} opacity=".85" />
        <path d="M66 6 C82 26 86 50 82 74 L50 74 C46 50 50 26 66 6 Z" fill="var(--k-ship-hull)" stroke={hue("hull", "var(--k-line-2)")} strokeWidth="4" />
        <path d="M50 54 L34 80 L50 74 Z M82 54 L98 80 L82 74 Z" fill={hue("hull", "var(--k-move)")} />
        <circle cx="66" cy="38" r="9" fill="var(--k-move)" />
      </svg>
      <ul className="kx-slots">
        {SLOTS.map(([kind, name]) => {
          const i = on(kind);
          return <li key={kind} className={`kx-slot${i ? " is-on" : ""}`}><span>{name}</span><b>{i ? i.label : "Standard"}</b></li>;
        })}
      </ul>
    </section>
  );
}

export interface HangarViewProps extends NavProps {
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
    <div className={`kx-screen kx-hangar${p.dock ? " kx-hasdock" : ""}`}>
      <Sky screen="hangar" reducedMotion={p.reducedMotion} />
      {p.meTo ? (
        <KxTopBar go={p.go} backTo={p.backTo} meTo={p.meTo} />
      ) : (
        <header className="kx-top">
          <A to={p.backTo} go={p.go} className="kx-ib kx-cut" label={kt("back")}><Icon d={I.back} /></A>
        </header>
      )}
      <main className="kx-hangar-main">
        <h1 className="kx-h2">{kt("hangar")}</h1>
        <p className="kx-sub">{kt("hangarSub")}</p>
        {futurist() && <Loadout items={p.items} equipped={p.equipped} />}
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
      {p.dock && <KxDock items={p.dock} active="world" go={p.go} />}
    </div>
  );
}
