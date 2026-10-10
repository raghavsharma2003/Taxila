// Debrief: the Kaksha lesson end (BUILD-SPEC §3.5; K1), in place of the Summary when `ui.kaksha` is on.
//   - "What you did": the Summary's own cards (this lesson's turn log: the question, the child's answer, the verified
//     tick from the verified-key classifier). Never a score, minutes or a count against a target.
//   - "Now secure": skills that crossed to secure in the ledger during this session (debrief.ts: the map at lesson start
//     diffed against the map now). Shown only when there is one; a read that failed or a private map shows nothing.
//   - "Opened": what each of those skills opens in the settlement and the Hangar (the World's own function).
//   - Her closing line: the runtime's last caption, as spoken (her language). Kaksha writes none of her words.
// Her face is the close comms frame, one face on screen; her name always carries "AI teacher".
// The data-testids are the Summary's (summary, didcards, finish, summary-show-yes) so the e2e harnesses keep working.
import { useEffect, useState } from "react";
import type { TapSource } from "../../../avatar/tap.ts";
import type { DeskModel, DidCard } from "../../../child/lesson/model.ts";
import catalogJson from "../../../../data/kaksha/catalog.json";
import { Comms } from "../Shell.tsx";
import { kt } from "../copy.ts";
import { baseLabelOf } from "../Base.tsx";
import { futurist } from "../look.ts";
import type { Catalog } from "../world.ts";
import { closingLine, nowSecure, type DebriefSecure, type MapLike } from "./debrief.ts";

const CATALOG = catalogJson as unknown as Catalog;

export interface DebriefProps {
  m: DeskModel;
  meters: TapSource[];
  onFinish: () => void;
  /** The map read when the lesson opened (null: unknown). */
  before: Promise<MapLike | null>;
  /** Reads the map now. */
  loadAfter: () => Promise<MapLike | null>;
}

export function Debrief({ m, onFinish, before, loadAfter }: DebriefProps) {
  const [secure, setSecure] = useState<DebriefSecure[] | null>(null);
  // once, when the lesson has ended (the summary is up); not while it is still being saved
  const ending = !!m.summary?.ending;
  useEffect(() => {
    if (ending) return;
    let live = true;
    void Promise.all([before, loadAfter()]).then(([b, a]) => { if (live) setSecure(nowSecure(b, a, CATALOG)); }, () => {});
    return () => { live = false; };
  }, [ending, before, loadAfter]);
  return <DebriefView m={m} onFinish={onFinish} secure={secure} />;
}

export interface DebriefViewProps { m: DeskModel; onFinish: () => void; secure: DebriefSecure[] | null }

/** Presentational (the dev page renders it with fixtures). */
export function DebriefView({ m, onFinish, secure }: DebriefViewProps) {
  const s = m.summary!;
  const young = m.family === "young";
  const [show, setShow] = useState<"ask" | "showing" | "no">("ask");
  const cards = s.cards.slice(0, 3);
  const anyVerified = cards.some((c) => c.verified);
  const triedLine = s.tried === 1 ? kt("triedOne") : kt("tried", { n: String(s.tried) });
  // her last line closes the session only when it is a closing: a lesson the child ended early stops on her open
  // question or fill-in prompt, which on the end screen reads as a demand (live shots and audit B05, 2026-10-10)
  const closing = closingLine(m.caption.text, m.ask?.text);
  const face = (
    <Comms teacherId={m.teacher.id} teacherName={m.teacher.name} band={m.band} floor="idle" framing="close" form={m.faceForm}
      reducedMotion={m.reducedMotion} showName={false} className="kx-db-face" />
  );

  if (show === "showing") {
    return (
      <main className="kx-debrief kx-debrief--show" data-testid="summary-show">
        <h1 className="kx-h2">{kt("showTitle", { child: m.childName })}</h1>
        <ul className="kx-db-did kx-db-did--big">{cards.map((c, i) => <Did key={i} c={c} />)}</ul>
        <button type="button" className="kx-cta kx-cut kx-db-finish" onClick={() => setShow("no")}>{kt("done")}</button>
      </main>
    );
  }
  return (
    <main className="kx-debrief" data-band={m.band} data-testid="summary">
      <header className="kx-db-head">
        {face}
        <div className="kx-db-headtext">
          <p className="kx-label">{kt("debrief")}</p>
          <h1 className="kx-h2">{m.variant === "practice" ? kt("setDone") : kt("sessionDone")}</h1>
          <p className="kx-db-who"><b>{m.teacher.name}</b><span className="kx-ai">{kt("aiTeacher")}</span></p>
        </div>
      </header>

      {closing && !s.ending && <p className="kx-db-her" data-speech="" lang={m.caption.lang}>{closing}</p>}

      {s.ending ? (
        <p className="kx-sub" role="status">{kt("ending")}</p>
      ) : (
        <section className="kx-db-sec" aria-labelledby="kx-db-did">
          <h2 id="kx-db-did" className="kx-label">{kt("didTitle")}</h2>
          {cards.length === 0 ? (
            <p className="kx-sub">{s.tried > 0 ? triedLine : kt("nothing", { T: m.teacher.name })}</p>
          ) : (
            <>
              {!anyVerified && <p className="kx-sub">{triedLine}</p>}
              <ul className="kx-db-did" data-testid="didcards">{cards.map((c, i) => <Did key={i} c={c} />)}</ul>
            </>
          )}
        </section>
      )}

      {!s.ending && secure && secure.length > 0 && (
        <section className="kx-db-sec kx-db-secure" aria-labelledby="kx-db-secure" data-testid="now-secure">
          {/* futurist looks: the first crossing is the earned moment (it carries the heading and the note); any others list below */}
          {futurist() ? <Earned skill={secure[0]} /> : (
            <>
              <h2 id="kx-db-secure" className="kx-label kx-secure-ink">{kt("nowSecure")}</h2>
              <p className="kx-db-note">{kt("secureNote")}</p>
            </>
          )}
          <ul className="kx-db-list">
            {(futurist() ? secure.slice(1) : secure).map((k) => (
              <li key={k.skillId} className="kx-db-skill kx-cut" data-new="">
                <span className="kx-db-dot" aria-hidden="true" />
                <div className="kx-db-skilltext">
                  <b>{k.title}</b>
                  {k.structure && <span className="kx-db-opened">{kt("raises", { what: futurist() ? baseLabelOf(k.structure) : k.structure })}</span>}
                  {k.items.length > 0 && (
                    <span className="kx-db-opened"><span className="kx-db-key">{kt("openedTitle")}</span> {k.items.join(", ")}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!young && !s.ending && s.nextTopic && <p className="kx-db-next">{kt("next", { topic: s.nextTopic })}</p>}

      {young && !s.ending && cards.length > 0 && show === "ask" && (
        <div className="kx-db-show">
          <span>{kt("showParents")}</span>
          <div className="kx-row">
            <button type="button" className="kx-ghost kx-cut" onClick={() => setShow("showing")} data-testid="summary-show-yes">{kt("showYes")}</button>
            <button type="button" className="kx-ghost kx-cut" onClick={() => setShow("no")}>{kt("showNo")}</button>
          </div>
        </div>
      )}

      <button type="button" className="kx-cta kx-cut kx-db-finish" onClick={onFinish} disabled={s.ending} data-testid="finish">{kt("finish")}</button>
    </main>
  );
}

/** The earned moment (futurist looks): one earned thing, celebrated once. It appears only when the ledger says a skill
 *  crossed to secure in this session (debrief.ts), names the idea and what it builds, and counts nothing. */
function Earned({ skill }: { skill: DebriefSecure }) {
  const HUES = ["--k-secure", "--k-move", "--k-her", "--k-look", "--k-ion"];
  return (
    <div className="kx-earn kx-cut">
      <span className="kx-earn-burst" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ["--a" as string]: `${(i * 360) / 14}deg`, ["--c" as string]: `var(${HUES[i % HUES.length]})` }} />)}
      </span>
      <span className="kx-earn-badge" aria-hidden="true">
        <svg viewBox="0 0 64 64"><path d="M32 4l24 10v16c0 15-10 26-24 30C18 56 8 45 8 30V14z" fill="var(--k-secure)" /><path d="M21 32l8 8 15-17" fill="none" stroke="var(--k-void)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <h2 id="kx-db-secure" className="kx-earn-tag">{kt("nowSecure")}</h2>
      <p className="kx-earn-title">{skill.title}</p>
      {skill.structure && <p className="kx-earn-sub">{kt("raises", { what: baseLabelOf(skill.structure) })}</p>}
      {skill.items.length > 0 && <p className="kx-earn-sub">{`${kt("openedTitle")}: ${skill.items.join(", ")}`}</p>}
      <p className="kx-earn-note">{kt("secureNote")}</p>
    </div>
  );
}

function Did({ c }: { c: DidCard }) {
  return (
    <li className="kx-db-card kx-cut" data-verified={c.verified ? "1" : undefined}>
      {c.ask && <p className="kx-db-ask" data-speech="">{c.ask}</p>}
      <p className="kx-db-ans">
        <span className="kx-db-key">{kt("answered")}</span>
        <span className="kx-db-val" data-speech="">{c.answer}</span>
        {c.verified && (
          <span className="kx-db-tick" role="img" aria-label={c.withHelp ? kt("withHint") : kt("onOwn")}>
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth={c.withHelp ? 1.6 : 2.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        )}
        {c.verified && <span className="kx-db-how">{c.withHelp ? kt("withHint") : kt("onOwn")}</span>}
      </p>
    </li>
  );
}
