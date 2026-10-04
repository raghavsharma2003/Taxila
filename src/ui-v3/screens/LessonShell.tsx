// The lesson shell (DESIGN-V3 §5, §6, §12; screens 03-05) for hands-free duplex. Zones:
//   phone  top bar · stage (teacher PiP in the reserved corner, HUD rail) · 2 transcript lines · steer chips · dock
//   wide   top bar · stage left │ side column: teacher tile, live transcript (4-6 lines), steer chips, dock
// There is no click-to-speak and no close button: the mic is a state readout plus a mute switch, leaving is a
// conversation (the stop check-in) or the pause sheet. The stage holds ONE artifact (board / animation / game / explorable /
// image) passed as children; RS-4 owns what draws inside the slot. Diversions (R6) and "end the lesson" (R7) render as
// moment cards: park (flies into the Later pill), brief detour, warm decline, and the stop check-in (break or wrap up in 2).
// Nothing here ever shows build, generation or loading state (R9).
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icon, type IconName } from "../Icon.tsx";
import { Button, Chip, IconButton, SubjectMarker, SUBJECT_LABEL } from "../primitives.tsx";
import { Readout, StageFrame, TeacherPip, TeacherTile, YourMove, useWide } from "../Stage.tsx";
import { TurnIndicator } from "../TurnIndicator.tsx";
import { floorView } from "../floor.ts";
import { useV3 } from "../V3Root.tsx";
import type { LaterItem, LessonData, Line, Moment } from "./types.ts";

const PHASES: Array<[LessonData["phase"], string]> = [["warmup", "Warm-up"], ["learn", "Learn"], ["try", "Try"], ["wrap", "Wrap"]];

export interface LessonShellProps {
  data: LessonData;
  /** The artifact for the stage slot (RS-4 Studio output, or the board floor). */
  children: ReactNode;
  onSteer?: (intent: string) => void;
  onTyped?: (text: string) => void;
  onToggleMute?: () => void;
  onPause?: (paused: boolean) => void;
  /** The pause sheet's "End lesson": goes into the stop check-in (RS-5), never ends directly. */
  onEndRequest?: () => void;
  onMoment?: (kind: Moment["kind"], action: "break" | "wrap" | "dismiss") => void;
  onMenu?: () => void;
  /** Child mic level 0..1 for the waveform. */
  level?: number;
}

export function LessonShell({ data, children, onSteer, onTyped, onToggleMute, onPause, onEndRequest, onMoment, onMenu, level }: LessonShellProps) {
  const { reducedMotion } = useV3();
  const wide = useWide();
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [laterOpen, setLaterOpen] = useState(false);
  const [tucked, setTucked] = useState<string | null>(null);
  const [tucking, setTucking] = useState(false);
  const fopts = { watching: data.watching, muted: data.muted };
  const v = floorView(data.floor, fopts);
  const moment = data.moment ?? null;
  const momentKey = moment ? `${moment.kind}:${moment.quote}` : null;

  // A parked card rises, then flies into the Later pill (DESIGN-V3 §12.1). Reduced motion: it simply goes.
  useEffect(() => {
    setTucked(null);
    setTucking(false);
    if (!moment || moment.kind !== "park") return;
    const t1 = setTimeout(() => setTucking(true), 4200);
    const t2 = setTimeout(() => setTucked(momentKey), reducedMotion ? 4201 : 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [momentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const showMoment = moment && tucked !== momentKey;
  // One volt per screen state: the stop check-in's primary action outranks the rail cue.
  const cueLit = v.cue && !paused && !(showMoment && moment?.kind === "stop") && !!data.yourMove;
  const presence = { name: data.teacher.name, floor: data.floor, floorOpts: fopts, tutorId: data.teacher.id, band: data.teacher.band, reducedMotion };
  const lines = wide ? data.lines.slice(-6) : data.lines.filter((l) => !l.old).slice(-2);

  const pause = (on: boolean) => { setPaused(on); onPause?.(on); };

  return (
    <div className="v3-lesson v3-grain" data-floor={data.floor}>
      <header className="v3-l-top">
        <IconButton icon="pause" label="Pause lesson" onClick={() => pause(true)} />
        <div className="v3-l-title">
          <SubjectMarker subject={data.subject}><span>{`Class ${data.classLevel} · ${SUBJECT_LABEL[data.subject]} · ${data.topic}`}</span></SubjectMarker>
          <div className="v3-phases" aria-label="Lesson phase">
            {PHASES.map(([k, label]) => (k === data.phase ? <b key={k} aria-current="step">{label}</b> : <span key={k}>{label}</span>))}
          </div>
        </div>
        <IconButton icon="more" label="Captions, language and settings" quiet onClick={onMenu} />
      </header>

      <div className="v3-stage-wrap">
        <StageFrame
          kind={data.artifact.kind}
          artifactKey={data.artifact.key}
          label={data.artifact.label}
          frozen={v.frozen}
          reducedMotion={reducedMotion}
          rail={data.yourMove || data.readout ? (
            <>
              {data.yourMove ? <YourMove lit={cueLit} hint={data.yourMove.hint}>{data.yourMove.text}</YourMove> : <span />}
              {data.readout && <Readout label={data.readout.label} value={data.readout.value} />}
            </>
          ) : undefined}
          pip={wide ? undefined : <TeacherPip {...presence} />}
          overlay={
            <>
              {data.later.length > 0 && (!moment || moment.kind !== "park" || tucked === momentKey) && (
                <button type="button" className="v3-later" aria-expanded={laterOpen} aria-label={`Later list: ${data.later.length} parked`} onClick={() => setLaterOpen((o) => !o)}>
                  <Icon name="pin" size={15} />Later <b>{data.later.length}</b>
                </button>
              )}
              {laterOpen && <LaterSheet items={data.later} onClose={() => setLaterOpen(false)} />}
              {showMoment && moment && <MomentCard moment={moment} tucking={tucking} onAct={(a) => onMoment?.(moment.kind, a)} />}
            </>
          }
        >
          {children}
        </StageFrame>
      </div>

      <div className="v3-side">
        {wide && <TeacherTile {...presence} />}
        <section className="v3-convo" aria-label="Conversation" aria-live="polite">
          {lines.map((l, i) => <TranscriptLine key={`${i}-${l.text.slice(0, 12)}`} line={l} teacherInitial={data.teacher.name.slice(0, 1)} />)}
        </section>
        <footer className="v3-dock">
          {typing ? (
            <TypeBar onSend={(t) => { onTyped?.(t); setTyping(false); }} onClose={() => setTyping(false)} />
          ) : (
            <div className="v3-steer" role="group" aria-label="Steer the lesson">
              {data.steer.map((s) => <Chip key={s.intent} icon={s.icon as IconName} intent={s.intent} onClick={() => (s.intent === "later_list" ? setLaterOpen(true) : onSteer?.(s.intent))}>{s.label}</Chip>)}
            </div>
          )}
          <TurnIndicator floor={data.floor} watching={data.watching} muted={data.muted} level={level} onToggleMute={onToggleMute} onType={() => setTyping(true)} />
        </footer>
      </div>

      {paused && <PauseSheet teacherName={data.teacher.name} onResume={() => pause(false)} onEnd={() => { pause(false); onEndRequest?.(); }} />}
    </div>
  );
}

function TranscriptLine({ line, teacherInitial }: { line: Line; teacherInitial: string }) {
  return (
    <div className={`v3-line v3-line--${line.who}${line.old ? " v3-line--old" : ""}`}>
      <span className="v3-line-who" aria-hidden="true">{line.who === "me" ? "YOU" : teacherInitial}</span>
      <p>
        {line.who === "me" && <span className="v3-heard">heard</span>}
        <span className="v3-sr">{line.who === "me" ? "You said: " : "She says: "}</span>
        {line.who === "me" ? `“${line.text}”` : line.text}
        {line.laterTail && <span className="later"> {line.laterTail}</span>}
      </p>
    </div>
  );
}

const MOMENT_META: Record<Moment["kind"], { icon: IconName; title: string }> = {
  park: { icon: "pin", title: "Parked for the end" },
  brief: { icon: "bolt", title: "Quick detour · in bounds" },
  decline: { icon: "shield", title: "Not for lessons" },
  stop: { icon: "pause", title: "Your call · nothing lost" },
};

function MomentCard({ moment, tucking, onAct }: { moment: Moment; tucking: boolean; onAct: (a: "break" | "wrap" | "dismiss") => void }) {
  const m = MOMENT_META[moment.kind];
  const stop = moment.kind === "stop";
  return (
    <div className={`v3-moment v3-moment--${moment.kind}${stop ? " v3-moment--wide" : ""}${tucking ? " is-tucking" : ""}`} role={stop ? "group" : "status"} aria-label={m.title}>
      <span className="v3-moment-ic" aria-hidden="true"><Icon name={m.icon} size={18} /></span>
      <div>
        <div className="v3-moment-k">{m.title}</div>
        <div className="v3-moment-q">{moment.quote}</div>
        <div className="v3-moment-w">{moment.note}</div>
        {stop && (
          <div className="v3-moment-acts">
            <Button onClick={() => onAct("break")}>3-min break</Button>
            <Button variant="primary" onClick={() => onAct("wrap")}>Wrap up in 2</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LaterSheet({ items, onClose }: { items: LaterItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="v3-later-sheet" role="dialog" aria-label="Later list" tabIndex={-1} ref={ref} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="v3-row-between"><span className="v3-eyebrow">Later · she brings these back</span><IconButton icon="x" label="Close later list" quiet onClick={onClose} /></div>
      <ul>{items.map((i) => <li key={i.id}><Icon name="pin" size={16} /><span>{i.text}<small>{i.when}</small></span></li>)}</ul>
    </div>
  );
}

function TypeBar({ onSend, onClose }: { onSend: (t: string) => void; onClose: () => void }) {
  const [t, setT] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  const submit = (e: FormEvent) => { e.preventDefault(); if (t.trim()) onSend(t.trim()); };
  return (
    <form className="v3-typebar" onSubmit={submit}>
      <label className="v3-sr" htmlFor="v3-type">Type to her</label>
      <input id="v3-type" ref={input} className="v3-input" value={t} onChange={(e) => setT(e.target.value)} placeholder="Type instead…" autoComplete="off" enterKeyHint="send" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }} />
      <Button type="submit" variant="secondary" icon="arrow" aria-label="Send">Send</Button>
    </form>
  );
}

function PauseSheet({ teacherName, onResume, onEnd }: { teacherName: string; onResume: () => void; onEnd: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector<HTMLButtonElement>("button")?.focus(); }, []);
  return (
    <div className="v3-scrim" onClick={onResume}>
      <div className="v3-sheet" role="dialog" aria-modal="true" aria-labelledby="v3-pause-h" ref={ref} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") onResume(); }}>
        <h2 id="v3-pause-h" className="v3-h2">Paused</h2>
        <p className="v3-muted">{teacherName} stops and the board holds. Pick up exactly here.</p>
        <div className="v3-sheet-acts">
          <Button variant="primary" size="lg" block icon="play" onClick={onResume}>Resume</Button>
          <Button size="lg" block onClick={onEnd}>End the lesson</Button>
        </div>
        <p className="v3-help"><Icon name="shield" size={18} /><span>Need to talk to someone? Childline <b className="v3-mono">1098</b> · Tele-MANAS <b className="v3-mono">14416</b>. Free, any time.</span></p>
      </div>
    </div>
  );
}
