// Onboarding (DESIGN-V3 §8, screen 01) for classes 4-7: a welcome, then 5 steps in ≤ 7 taps with defaults kept
// (Get started · Continue · Continue · Choose · Save schedule · Do this later/Continue · Start warm-up = 7).
//   1 level   class 4 / 5 / 6 / 7 + board            "She starts at your class level, then adjusts…" (R2)
//   2 you     name + how she talks, with a live sample line that updates with name and language
//   3 teacher pick by hearing; both are AI teachers (shown, never removed); in-house faces, never portraits
//   4 when    the real scheduler (R11): day toggles, quick picks, 15-minute rail with ‹ ›, length, summary
//   5 parent  here now / send a link / later
//   ready     summary + Start warm-up ("No marks. No pass or fail.")
// Each step opens scrolled to the top with focus on its heading. The language chosen here is returned to the caller,
// which persists it end to end (RS-2, O-14). The sample line is a UI illustration, never prompt text.
import { useEffect, useRef, useState } from "react";
import { Brand, Icon } from "../Icon.tsx";
import { Button, Segmented } from "../primitives.tsx";
import { DayToggles, TimeRail } from "../Scheduler.tsx";
import { FaceSlot } from "../TeacherFace.tsx";
import { useV3 } from "../V3Root.tsx";
import { DEFAULT_RAIL, weeklySummary, type RailRange } from "../schedule.ts";
import type { TeacherRef } from "./types.ts";

export type Lang = "english" | "hinglish" | "hindi";
export type Board = "CBSE" | "RBSE" | "ICSE" | "Other";

export interface OnboardingResult {
  classLevel: 4 | 5 | 6 | 7;
  board: Board;
  name: string;
  lang: Lang;
  teacherId: string;
  schedule: { days: number[]; start: number; length: number };
  parent: "here" | "link" | "later";
}

export interface OnboardingProps {
  teachers: Array<TeacherRef & { style: string }>;
  /** Plays a short voice sample (RS-7 TTS). The card shows no state while it plays beyond the speaking ring. */
  onHear?: (teacherId: string) => void;
  onDone: (r: OnboardingResult) => void;
  onParent?: () => void;
  /** Lesson hours set by a parent already (narrows the rail). */
  range?: RailRange;
  initialStep?: number;
  initial?: Partial<OnboardingResult>;
}

const SAMPLE: Record<Lang, (n: string) => string> = {
  english: (n) => `Okay ${n}, let's start by seeing where you are. Quick, no marks.`,
  hinglish: (n) => `Okay ${n}, ek kaam karte hain: pehle quickly dekhte hain tum kahan ho.`,
  hindi: () => "ठीक है, पहले जल्दी से देखते हैं तुम कहाँ हो।",
};
const LANG_LABEL: Record<Lang, string> = { english: "English", hinglish: "Hinglish", hindi: "Hindi" };

export function Onboarding({ teachers, onHear, onDone, onParent, range = DEFAULT_RAIL, initialStep = 0, initial }: OnboardingProps) {
  const { reducedMotion } = useV3();
  const [step, setStep] = useState(initialStep);
  const [cls, setCls] = useState<4 | 5 | 6 | 7>(initial?.classLevel ?? 6);
  const [board, setBoard] = useState<Board>(initial?.board ?? "CBSE");
  const [name, setName] = useState(initial?.name ?? "Aarav");
  const [lang, setLang] = useState<Lang>(initial?.lang ?? "hinglish");
  const [teacherId, setTeacherId] = useState(initial?.teacherId ?? teachers[0]?.id ?? "");
  const [hearing, setHearing] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>(initial?.schedule?.days ?? [0, 2, 4]);
  const [start, setStart] = useState(initial?.schedule?.start ?? 17 * 60 + 30);
  const [length, setLength] = useState(initial?.schedule?.length ?? 20);
  const [parent, setParent] = useState<OnboardingResult["parent"]>("later");
  const h1 = useRef<HTMLHeadingElement>(null);
  const LAST = 6;
  // An empty roster is a caller bug, never a crash on the child's screen: the face slot falls back to the band's default tutor.
  const teacher = teachers.find((t) => t.id === teacherId) ?? teachers[0] ?? { id: "", name: "", band: "b3", style: "" };
  const sum = weeklySummary({ days, start, length });

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
    if (step > 0) h1.current?.focus({ preventScroll: true });
  }, [step]);

  const next = () => {
    if (step === 4 && !sum.ok) return;
    if (step >= LAST) {
      onDone({ classLevel: cls, board, name: name.trim() || "there", lang, teacherId, schedule: { days, start, length }, parent });
      return;
    }
    setStep((s) => s + 1);
  };
  const cta = ["Get started", "Continue", "Continue", `Choose ${teacher?.name ?? ""}`.trim(), "Save schedule", "Continue", "Start warm-up"][step];
  const shownName = name.trim() || "there";

  return (
    <div className="v3-ob v3-grain">
      <div className="v3-ob-top">
        <button type="button" className="v3-btn v3-btn--quiet v3-btn--icon" aria-label="Back" style={{ visibility: step === 0 ? "hidden" : "visible" }} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <Icon name="left" />
        </button>
        <div className="v3-ob-bars" aria-hidden="true" style={{ visibility: step === 0 ? "hidden" : "visible" }}>
          {Array.from({ length: LAST - 1 }, (_, i) => <i key={i} className={i < step ? "on" : ""} />)}
        </div>
        <span className="v3-ob-count v3-mono" aria-live="polite">{step === 0 ? "" : `Step ${Math.min(step, LAST - 1)} of ${LAST - 1}`}</span>
      </div>

      <main className="v3-ob-main" key={step}>
        {step === 0 && (
          <section className="v3-ob-step">
            <WelcomeArt />
            <div style={{ margin: "4px 0 14px" }}><Brand /></div>
            <h1 className="v3-hero">A teacher who actually listens.</h1>
            <p className="v3-ob-lede" style={{ marginTop: 12 }}>Talk to her like a person. She shapes the lesson around you: games, animations, the works. Classes 4 to 7.</p>
          </section>
        )}

        {step === 1 && (
          <section className="v3-ob-step" aria-labelledby="ob-h">
            <div className="v3-eyebrow">Step 1 · Level</div>
            <h1 id="ob-h" ref={h1} tabIndex={-1} className="v3-h1">Which class are you in?</h1>
            <p className="v3-ob-lede">She starts at your class level, then adjusts to how you actually do.</p>
            <Segmented
              label="Class" size="lg" className="v3-ob-cls" value={cls} onChange={setCls}
              options={([4, 5, 6, 7] as const).map((c) => ({ value: c, aria: `Class ${c}`, label: <span className="v3-ob-clsopt">{c}<small>class</small></span> }))}
            />
            <div className="v3-label-row"><span className="v3-label">Board</span></div>
            <Segmented label="Board" value={board} onChange={setBoard} options={(["CBSE", "RBSE", "ICSE", "Other"] as const).map((b) => ({ value: b, label: b }))} />
          </section>
        )}

        {step === 2 && (
          <section className="v3-ob-step" aria-labelledby="ob-h">
            <div className="v3-eyebrow">Step 2 · You</div>
            <h1 id="ob-h" ref={h1} tabIndex={-1} className="v3-h1">What should she call you?</h1>
            <p className="v3-ob-lede">First name or nickname. You can change it any time.</p>
            <label className="v3-sr" htmlFor="ob-name">Your name</label>
            <input id="ob-name" className="v3-input v3-input--lg" value={name} maxLength={24} autoComplete="given-name" onChange={(e) => setName(e.target.value)} />
            <div className="v3-label-row"><span className="v3-label">How she talks</span></div>
            <Segmented label="How she talks" value={lang} onChange={setLang} options={(["english", "hinglish", "hindi"] as const).map((l) => ({ value: l, label: LANG_LABEL[l] }))} />
            <div className="v3-ob-sample">
              <span className="v3-tchip" style={{ width: 32, height: 32 }} aria-hidden="true"><FaceSlot tutorId={teacher.id} band={teacher.band} status={null} size="chip" still /></span>
              <p lang={lang === "hindi" ? "hi" : "en"} className={lang === "hindi" ? "deva" : undefined}>{SAMPLE[lang](shownName)}</p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="v3-ob-step" aria-labelledby="ob-h">
            <div className="v3-eyebrow">Step 3 · Teacher</div>
            <h1 id="ob-h" ref={h1} tabIndex={-1} className="v3-h1">Pick your teacher.</h1>
            <p className="v3-ob-lede">Same brain, different person. Tap to hear each one.</p>
            <div className="v3-ob-teachers" role="radiogroup" aria-label="Teacher">
              {teachers.map((t) => {
                const on = t.id === teacherId;
                return (
                  <div key={t.id} className={`v3-tcard${on ? " is-on" : ""}${hearing === t.id ? " is-speaking" : ""}`}>
                    <button type="button" role="radio" aria-checked={on} className="v3-tcard-pick" aria-label={`${t.name}, AI teacher. ${t.style}`} onClick={() => setTeacherId(t.id)}>
                      <span className="v3-tcard-face"><FaceSlot tutorId={t.id} band={t.band} status={hearing === t.id ? "speaking" : null} size="card" still /></span>
                      <span className="v3-tcard-meta"><b>{t.name}</b><span>{t.style}</span></span>
                      <span className="v3-tcard-sel" aria-hidden="true"><Icon name="check" size={16} /></span>
                    </button>
                    <button type="button" className="v3-tcard-hear" aria-label={`Hear ${t.name}`} onClick={() => { setHearing(t.id); onHear?.(t.id); setTimeout(() => setHearing((h) => (h === t.id ? null : h)), 2600); }}>
                      <Icon name="volume" size={15} />Hear
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="v3-ob-ai"><Icon name="shield" /><span>Both are AI teachers, not real people. They'll always tell you that if you ask.</span></p>
          </section>
        )}

        {step === 4 && (
          <section className="v3-ob-step" aria-labelledby="ob-h">
            <div className="v3-eyebrow">Step 4 · Schedule</div>
            <h1 id="ob-h" ref={h1} tabIndex={-1} className="v3-h1">When do you want to learn?</h1>
            <p className="v3-ob-lede">She'll be ready at this time. A parent can change limits later.</p>
            <DayToggles days={days} onChange={setDays} />
            <TimeRail value={start} onChange={setStart} length={length} range={range} reducedMotion={reducedMotion} />
            <div className="v3-label-row"><span className="v3-label">Length</span></div>
            <Segmented label="Lesson length" value={length} onChange={setLength} options={[15, 20, 30, 45].map((m) => ({ value: m, label: `${m} min` }))} />
            <div className={`v3-ob-summary${sum.ok ? "" : " is-warn"}`} aria-live="polite">
              <span className="v3-ob-summary-ic"><Icon name="cal" /></span>
              <div><b>{sum.line1}</b><span>{sum.line2}</span></div>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="v3-ob-step" aria-labelledby="ob-h">
            <div className="v3-eyebrow">Step 5 · Parent</div>
            <h1 id="ob-h" ref={h1} tabIndex={-1} className="v3-h1">One minute from a parent.</h1>
            <p className="v3-ob-lede">Your parent approves the account and sets limits. They see what you learned, not a recording of every word.</p>
            <div className="v3-ob-handoff" role="radiogroup" aria-label="Parent">
              <button type="button" role="radio" aria-checked={parent === "here"} className="v3-rowcard" onClick={() => { setParent("here"); onParent?.(); }}>
                <span className="v3-rowcard-ic"><Icon name="user" /></span><span><b>Parent is here</b><span>Hand over the phone · 60 seconds</span></span><Icon name="right" />
              </button>
              <button type="button" role="radio" aria-checked={parent === "link"} className="v3-rowcard" onClick={() => setParent("link")}>
                <span className="v3-rowcard-ic"><Icon name="arrow" /></span><span><b>Send them a link</b><span>WhatsApp or SMS · start the warm-up meanwhile</span></span><Icon name="right" />
              </button>
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="v3-ob-step" aria-labelledby="ob-h">
            <div className="v3-eyebrow">Ready</div>
            <h1 id="ob-h" ref={h1} tabIndex={-1} className="v3-h1">You're set, {shownName}.</h1>
            <p className="v3-ob-lede">First up: a 6-minute warm-up so she knows where you are. No marks. No pass or fail.</p>
            <div className="v3-ob-done">
              <div className="v3-ob-done-who">
                <span className="v3-tchip" style={{ width: 56, height: 56 }} aria-hidden="true"><FaceSlot tutorId={teacher.id} band={teacher.band} status={null} size="chip" still /></span>
                <div><b className="v3-h3">{teacher.name}</b><div className="v3-small v3-muted">AI teacher · {LANG_LABEL[lang]}</div></div>
              </div>
              <dl className="v3-kv"><dt>Class</dt><dd>{cls} · {board}</dd><dt>When</dt><dd>{sum.line1}</dd><dt>Length</dt><dd>{length} min</dd></dl>
            </div>
          </section>
        )}
      </main>

      <div className="v3-ob-foot">
        <Button variant="primary" size="lg" block disabled={step === 4 && !sum.ok} onClick={next}>{cta}</Button>
        {step === 0 && <Button variant="quiet" block onClick={onParent}>I'm a parent</Button>}
        {step === 5 && <Button variant="quiet" block onClick={() => { setParent("later"); setStep(6); }}>Do this later</Button>}
      </div>
    </div>
  );
}

/** The welcome hero: a cinematic vector scene (an orbit and a proof figure) instead of stock art or a mascot. */
function WelcomeArt() {
  return (
    <div className="v3-ob-hero" aria-hidden="true">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="v3-ob-glow" cx="70%" cy="20%" r="80%"><stop offset="0" stopColor="#4F5BD5" stopOpacity=".55" /><stop offset=".6" stopColor="#4F5BD5" stopOpacity="0" /></radialGradient>
          <linearGradient id="v3-ob-tri" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#8B98FF" stopOpacity=".30" /><stop offset="1" stopColor="#8B98FF" stopOpacity=".05" /></linearGradient>
        </defs>
        <rect width="400" height="300" fill="#0D1017" />
        <rect width="400" height="300" fill="url(#v3-ob-glow)" />
        <g opacity=".5">{Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 97) % 400} cy={(i * 53) % 300} r={i % 7 === 0 ? 1.4 : 0.8} fill="#F2F4F8" opacity={0.25 + (i % 5) * 0.1} />)}</g>
        <ellipse cx="250" cy="150" rx="150" ry="56" fill="none" stroke="#8B98FF" strokeOpacity=".35" strokeWidth="1.2" transform="rotate(-14 250 150)" />
        <ellipse cx="250" cy="150" rx="104" ry="36" fill="none" stroke="#F2F4F8" strokeOpacity=".16" strokeWidth="1" transform="rotate(-14 250 150)" />
        <path d="M150 230 L232 92 L330 230 Z" fill="url(#v3-ob-tri)" stroke="#B9C2FF" strokeWidth="2" strokeLinejoin="round" />
        <path d="M150 230 H330 V92 H150 Z" fill="none" stroke="#F2F4F8" strokeOpacity=".28" strokeWidth="1.4" />
        <path d="M232 92 V230" stroke="#8B98FF" strokeDasharray="5 6" strokeWidth="2" />
        <circle cx="232" cy="92" r="6" fill="#F2F4F8" />
        <circle cx="392" cy="112" r="9" fill="#2FD3C7" opacity=".85" />
        <circle cx="104" cy="196" r="5" fill="#FFB547" opacity=".8" />
      </svg>
    </div>
  );
}
