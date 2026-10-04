// The primitives sheet: every v3 primitive in its states, for review and the shot battery.
import { useMemo, useState } from "react";
import { Icon } from "../Icon.tsx";
import { Button, Chip, IconButton, MasteryNode, Segmented, SectionHead, Skeleton, Stepper, SubjectMarker, Switch, Tag, VerdictMark } from "../primitives.tsx";
import { DateStrip, DayToggles, TimeGrid, TimeRail } from "../Scheduler.tsx";
import { TurnIndicator } from "../TurnIndicator.tsx";
import { ALL_FLOORS } from "../floor.ts";
import { dateStrip, timeGrid } from "../schedule.ts";
import { pushToast } from "../toast.ts";
import { useV3 } from "../V3Root.tsx";
import { PARENT } from "../screens/fixtures.ts";

export function Kit() {
  const { theme, setTheme } = useV3();
  const [seg, setSeg] = useState("Hinglish");
  const [step, setStep] = useState(45);
  const [sw, setSw] = useState(true);
  const [days, setDays] = useState([0, 2, 4]);
  const [t, setT] = useState(17 * 60 + 30);
  const [d, setD] = useState<string | null>("2026-10-06");
  const [tm, setTm] = useState<number | null>(17 * 60 + 30);
  const strip = useMemo(() => dateStrip({ today: PARENT.today, lessons: PARENT.lessons, moving: PARENT.lessons[0] }), []);
  const grid = useMemo(() => (d ? timeGrid({ date: d, today: PARENT.today, nowMin: PARENT.nowMin, hours: { start: 7 * 60, end: 21 * 60 }, length: 20, lessons: PARENT.lessons, moving: PARENT.lessons[0], options: [7, 9, 11, 16, 16.5, 17, 17.5, 18, 19, 20, 20.5, 21].map((h) => h * 60) }) : []), [d]);
  return (
    <div className="v3-app" style={{ paddingBottom: 80 }}>
      <header className="v3-topbar"><h1 className="v3-h2">Primitives</h1>
        <Segmented label="Theme" value={theme} onChange={setTheme} options={[{ value: "night", label: <Icon name="moon" size={18} />, aria: "Night" }, { value: "day", label: <Icon name="sun" size={18} />, aria: "Day" }]} />
      </header>
      <div className="v3-col">
        <SectionHead title="Buttons" />
        <div className="v3-row-8 v3-wrap"><Button variant="primary" iconAfter="arrow">Start lesson</Button><Button>Secondary</Button><Button variant="quiet">Quiet</Button><Button variant="ink">Move lesson</Button><Button disabled>Disabled</Button><IconButton icon="pause" label="Pause" /></div>
        <SectionHead title="Chips and tags" />
        <div className="v3-row-8 v3-wrap"><Chip icon="replay">Show again</Chip><Chip icon="slow">Slower</Chip><Chip pressed>Evening · 6:00</Chip><Tag icon="pencil">Board</Tag><Tag icon="gamepad">Game</Tag><SubjectMarker subject="science" /></div>
        <SectionHead title="Verdicts and mastery" />
        <div className="v3-row-8 v3-wrap"><VerdictMark verdict="got" /><VerdictMark verdict="look" /><MasteryNode state="secure" label="Perimeter" /><MasteryNode state="working" label="Area" /><MasteryNode state="met" label="Angles" /><MasteryNode state="ahead" label="Integers" /><MasteryNode state="secure" due label="Equal shares" /></div>
        <SectionHead title="Controls" />
        <Segmented label="Language" value={seg} onChange={setSeg} options={["English", "Hinglish", "Hindi"].map((v) => ({ value: v, label: v }))} />
        <div className="v3-row-8 v3-wrap"><Stepper label="Daily limit" value={step} min={15} max={120} step={15} format={(v) => `${v} min`} onChange={setStep} /><Switch label="Open mic" checked={sw} onChange={setSw} /><Skeleton w={120} h={14} /></div>
        <SectionHead title="Scheduler" />
        <DayToggles days={days} onChange={setDays} />
        <TimeRail value={t} onChange={setT} length={20} />
        <DateStrip days={strip} value={d} onChange={setD} />
        <TimeGrid options={grid} value={tm} onChange={setTm} />
        <SectionHead title="Turn indicator · every floor state" />
        {ALL_FLOORS.map((f) => <div key={f} className="v3-col" style={{ gap: 4 }}><span className="v3-eyebrow">{f}</span><TurnIndicator floor={f} /></div>)}
        <div className="v3-col" style={{ gap: 4 }}><span className="v3-eyebrow">idle + watching</span><TurnIndicator floor="idle" watching /></div>
        <div className="v3-col" style={{ gap: 4 }}><span className="v3-eyebrow">muted</span><TurnIndicator floor="her_turn" muted /></div>
        <SectionHead title="Toasts (build-state text is dropped by policy)" />
        <div className="v3-row-8 v3-wrap">
          <Button onClick={() => pushToast("saved", "Moved to Tue 6 Oct · 5:30 PM")}>Saved</Button>
          <Button onClick={() => pushToast("network", "You're offline. She'll pick up where you left off.")}>Offline</Button>
          {/* lint-allow:L-MACHINE (deliberate: shows the toast policy dropping build-state copy) */}
          <Button onClick={() => pushToast("info", "Generating your game…")}>Blocked text</Button>
        </div>
      </div>
    </div>
  );
}
