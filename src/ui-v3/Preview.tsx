// The v3 preview: renders any v3 screen in any state from the URL, with fixtures. Used by the dev gallery
// (src/ui-v3/gallery) and, after PATCH 01, by the in-app route /v3 (only when the ui.v3 flag is on), so the owner can see
// every v3 screen on staging before the data wiring lands.
//   ?screen=onboarding&step=0..6 | home | lesson&state=board|speaking|game|park|brief|decline|stop | end | progress
//   | parent[&edit=0] | kit      &theme=night|day  &settled=1 (freeze motion for stable shots)
import { useMemo, useState } from "react";
import { V3Root } from "./V3Root.tsx";
import {
  EndOfLesson, Home, LeafLight, LessonShell, Onboarding, ParentCorner, PilotGame, Progress, TriangleBoard,
} from "./screens/index.ts";
import { ARJUN, ASHA, DIVERSION, END, HOME, LESSON_BOARD, LESSON_GAME, LESSON_SPEAKING, PARENT, PROGRESS } from "./screens/fixtures.ts";
import type { LessonData } from "./screens/types.ts";
import { Kit } from "./gallery/Kit.tsx";


const LESSONS: Record<string, LessonData> = {
  board: LESSON_BOARD, speaking: LESSON_SPEAKING, game: LESSON_GAME,
  park: DIVERSION.park, brief: DIVERSION.brief, decline: DIVERSION.decline, stop: DIVERSION.stop, paused: LESSON_BOARD,
};

function LessonDemo({ state, settled }: { state: string; settled: boolean }) {
  const base = LESSONS[state] ?? LESSON_BOARD;
  const [hud, setHud] = useState({ hits: 0, target: "3/4" });
  const data = useMemo<LessonData>(() => (state === "game" ? { ...base, readout: { label: "CLEAN", value: String(hud.hits) } } : base), [base, state, hud.hits]);
  const art = data.artifact.kind === "game" ? <PilotGame settled={settled} onHud={setHud} />
    : data.artifact.kind === "animation" ? <LeafLight settled={settled} />
      : <TriangleBoard settled={settled} />;
  return <LessonShell data={data}>{art}</LessonShell>;
}

function Screen({ q, screen, settled }: { q: URLSearchParams; screen: string; settled: boolean }) {
  switch (screen) {
    case "onboarding":
      return <Onboarding initialStep={Number(q.get("step") ?? 0)} teachers={[{ ...ARJUN, style: "Loves puzzles: guess first, then check" }, { ...ASHA, style: "Step by step, with pictures" }]} onDone={() => {}} />;
    case "home": return <Home data={HOME} />;
    case "lesson": return <LessonDemo state={q.get("state") ?? "board"} settled={settled} />;
    case "end": return <EndOfLesson data={END} />;
    case "progress": return <Progress data={PROGRESS} />;
    case "parent": return <ParentCorner data={PARENT} initialEdit={q.get("edit") != null ? Number(q.get("edit")) : undefined} />;
    case "kit": return <Kit />;
    default: return <Index base={q.get("base") ?? ""} />;
  }
}

function Index({ base }: { base: string }) {
  const links: Array<[string, string]> = [
    ...[0, 1, 2, 3, 4, 5, 6].map((s) => [`?screen=onboarding&step=${s}`, `Onboarding · step ${s}`] as [string, string]),
    ["?screen=home", "Home"],
    ...Object.keys(LESSONS).map((s) => [`?screen=lesson&state=${s}`, `Lesson · ${s}`] as [string, string]),
    ["?screen=end", "End of lesson"], ["?screen=progress", "Progress"], ["?screen=parent", "Parent corner"], ["?screen=parent&edit=0", "Parent · reschedule"],
    ["?screen=kit", "Primitives kit"],
  ];
  return (
    <div className="v3-app">
      <header className="v3-topbar"><h1 className="v3-h2">Taxila v3 · gallery</h1></header>
      <p className="v3-muted v3-small">Dev only. Every screen with fixtures; add &amp;theme=day for the Day theme.</p>
      <ul style={{ display: "grid", gap: 8, padding: 0, listStyle: "none" }}>
        {links.map(([href, label]) => <li key={href}><a className="v3-link" href={base + href}>{label}</a></li>)}
      </ul>
    </div>
  );
}


export function V3Preview() {
  const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
  const screen = q.get("screen") ?? "index";
  const theme = (q.get("theme") as "night" | "day" | null) ?? (screen === "parent" ? "day" : "night");
  return <V3Root theme={theme}><Screen q={q} screen={screen} settled={q.get("settled") === "1"} /></V3Root>;
}

export default V3Preview;
