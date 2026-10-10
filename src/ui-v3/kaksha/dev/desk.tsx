// Kaksha Desk dev page (never shipped): the REAL Desk (stream 2) under the Kaksha frame and skin, fed the Desk's own
// fixture models (src/child/lesson/dev/DeskDev.tsx fixtureModel), plus the Debrief with fixture maps. For shots and the
// rendered lint (tests/prod/r4-kaksha-desk-shots.mjs). No server, no child.
//   ?class=4|6|7  &fixture=<DeskDev fixture>|summary|summary-secure|summary-tried|summary-ending|intake-ask|intake-which|intake-mapped|intake-plan
//   &face=plate|live  &motion=reduced
//   ?live=1&skin=kaksha|none  the REAL lesson runtime (LessonRuntime, outbox, floor) on the Desk dev page's scripted Director
//                             and clock link, instrumented for the K1 client-latency check (tests/prod/r4-kaksha-latency-client.mjs)
import { useCallback, useState } from "react";
import { useLesson } from "../../../lesson/useLesson.ts";
import { useDesk } from "../../../child/lesson/useDesk.ts";
import { lessonScript, scriptedApi, scriptedLinkFactory } from "../../../child/lesson/dev/script.ts";
import type { TurnRequest } from "../../../../shared/contracts.ts";
import { createRoot } from "react-dom/client";
import { Desk, sameSize, type DeskSize } from "../../../child/lesson/Desk.tsx";
import { fixtureModel } from "../../../child/lesson/dev/DeskDev.tsx";
import type { DeskActions } from "../../../child/lesson/model.ts";
import { ageBandOf, bandForClass, familyOf } from "../../../child/band.ts";
import KakshaLesson, { type LoadMap } from "../lesson/KakshaLesson.tsx";
import type { MapLike } from "../lesson/debrief.ts";
import type { WorldSkill } from "../world.ts";
import c4maths from "../../../../data/curriculum/c4-maths.json";
import c6maths from "../../../../data/curriculum/c6-maths.json";

const q = new URLSearchParams(location.search);
const cls = Number(q.get("class") ?? 6);
const band = bandForClass(cls);
const family = familyOf(band);
const fixture = q.get("fixture") ?? "your_turn";
const reduced = q.get("motion") === "reduced";
const face = q.get("face") === "live" ? "live" : "plate";
const silent = { value: 0, subscribe: () => () => {} };
const ACTIONS = new Proxy({}, { get: () => () => {} }) as DeskActions;

const SKILLS: WorldSkill[] = [
  { skillId: `c${cls}-maths-ch07-t01-s1`, title: "Fractional units and equal shares", subject: "maths", state: "secure" },
  { skillId: `c${cls}-maths-ch07-t03-s1`, title: "Equivalent fractions", subject: "maths", state: "got_it" },
  { skillId: `c${cls}-maths-ch02-t01-s1`, title: "Angles and how to measure them", subject: "maths", state: "secure" },
  { skillId: `c${cls}-science-ch04-t01-s1`, title: "Magnets and their poles", subject: "science", state: "practising" },
];
const AFTER: WorldSkill[] = SKILLS.map((k) => (k.skillId.endsWith("ch07-t03-s1") ? { ...k, state: "secure" as const } : k));
// ui.intake as K-P11 builds it: the title and the trail are the syllabus file's own words (data/curriculum)
function intakeFixture(name: string): Partial<typeof fixtureModelOut> {
  const book = (cls <= 4 ? c4maths : c6maths) as { class: number; chapters: Array<{ id: string; title: string; topics: Array<{ id: string; title: string }> }> };
  const ch = book.chapters.find((c) => c.topics.length > 0)!;
  const t = cls <= 4 ? ch.topics[0] : book.chapters.find((c) => c.id.endsWith("ch07"))!.topics[0];
  const chapter = book.chapters.find((c) => c.topics.some((x) => x.id === t.id))!;
  const mapped = { topicId: t.id, title: t.title, trail: [`Class ${book.class}`, "Maths", chapter.title] };
  const ask = (text: string) => ({ text, source: "server" as const, lines: [] });
  if (name === "intake-ask") return { intake: { phase: "ask" }, ask: ask(family === "young" ? "What happened at school today?" : "Aaj school mein kya hua?") };
  if (name === "intake-which") return { intake: { phase: "which" }, ask: ask("Which one was it?") };
  if (name === "intake-mapped") return { intake: { phase: "mapped", mapped }, ask: ask(family === "young" ? "Which one is half?" : "Are two quarters the same as one half?") };
  // at the agenda the lesson's short title is the decided topic's (ui.shortTitle follows the new segment)
  return { intake: { phase: "plan", mapped, plan: { segments: [{ purpose: "school_reteach" }, { purpose: "practice" }] } }, ask: null, shortTitle: t.title.slice(0, 24) };
}
const fixtureModelOut = fixtureModel("your_turn", band, { w: 360, h: 800, fontScale: 1 }, "plate", false);
let reads = 0;
const loadMap: LoadMap = async (): Promise<MapLike | null> => {
  reads++;
  if (fixture !== "summary-secure") return { skills: SKILLS };
  return { skills: reads === 1 ? SKILLS : AFTER };
};

function App() {
  const [size, setSize] = useState<DeskSize>({ w: innerWidth, h: innerHeight, fontScale: 1 });
  const onSize = useCallback((s: DeskSize) => setSize((p) => (sameSize(p, s) ? p : s)), []);
  const base = fixture.startsWith("summary") ? (fixture === "summary-tried" ? "summary-tried" : "summary") : fixture.startsWith("intake") ? "your_turn" : fixture;
  const m = fixtureModel(base, band, size, face, reduced);
  if (fixture.startsWith("intake")) Object.assign(m, intakeFixture(fixture));
  m.childName = family === "young" ? "Riya" : "Kabir";
  if (m.summary) {
    m.caption = { text: family === "young" ? "Shabaash, Riya. Aaj tumne aadha pehchaana. Kal phir milte hain." : "Achha kaam, Kabir. Kal do minute mein dekhenge ki quarters wala idea yaad hai.", speaking: false, mode: "phrase", lang: "hi-Latn" };
    if (fixture === "summary-ending") m.summary = { ...m.summary, ending: true };
  }
  const assertive = m.floor === "your_turn" && !m.strip && !m.sheet ? `Your turn. ${m.ask?.text ?? ""}` : "";
  return (
    <KakshaLesson cid="dev-child" family={family} reducedMotion={reduced} loadMap={loadMap}>
      {(skin) => (
        <Desk m={m} a={ACTIONS} media={{ meters: [silent], mic: silent, lang: "hinglish", ageBand: ageBandOf(band) }} live={{ assertive, polite: "" }}
          onSize={onSize} theme={null} phaseLine {...skin} />
      )}
    </KakshaLesson>
  );
}

type K1Probe = { turnAt: number[]; replyAt: number[]; paintAt: number[]; send?: (t: string) => void; floor?: string };
const probe: K1Probe = ((window as unknown as { __k1: K1Probe }).__k1 = { turnAt: [], replyAt: [], paintAt: [] });

function LiveApp() {
  const young = family === "young";
  const [size, setSize] = useState<DeskSize>({ w: innerWidth, h: innerHeight, fontScale: 1 });
  const onSize = useCallback((s: DeskSize) => setSize((p) => (sameSize(p, s) ? p : s)), []);
  const [deps] = useState(() => {
    const api = scriptedApi({ young });
    const turn = api.turn.bind(api);
    // timestamps on the page clock: the turn call leaves the client, its answer lands, the next frame after it is painted
    api.turn = async (req: TurnRequest) => {
      probe.turnAt.push(performance.now());
      const r = await turn(req);
      probe.replyAt.push(performance.now());
      requestAnimationFrame(() => requestAnimationFrame(() => probe.paintAt.push(performance.now())));
      return r;
    };
    return { api, createLink: scriptedLinkFactory(lessonScript(young).spoken, false, false) };
  });
  const { runtime } = useLesson(deps);
  const { m, a, dockRef, live } = useDesk(runtime, null, {
    cid: "dev-child", band, family, teacherId: "asha", teacherName: "Asha", childName: young ? "Riya" : "Kabir",
    lessonLang: "hinglish", captionsAlways: false, sounds: false, haptics: false, reducedMotion: reduced, timing: 1, variant: "lesson",
    textOnly: true, openMic: false, faceForm: face, firstLesson: false,
  }, { home: () => {}, who: () => {}, signIn: () => {}, parent: () => {}, finished: () => {} }, size);
  probe.send = a.send;
  probe.floor = m.floor;
  const desk = (skin?: Parameters<typeof Desk>[0] extends infer P ? Partial<P> : never) => (
    <Desk m={m} a={a} media={{ meters: [runtime.levels.teacher], mic: runtime.levels.mic, modules: runtime.modules, lang: "hinglish", ageBand: ageBandOf(band) }}
      dockRef={dockRef} live={live} onSize={onSize} theme={null} notMeWindow={false} {...skin} />
  );
  return q.get("skin") === "none" ? desk() : <KakshaLesson cid="dev-child" family={family} reducedMotion={reduced} loadMap={loadMap}>{desk}</KakshaLesson>;
}

createRoot(document.getElementById("root")!).render(q.get("live") ? <LiveApp /> : <App />);
