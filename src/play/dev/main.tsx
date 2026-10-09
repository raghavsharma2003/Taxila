// The play dev harness (never shipped in the app bundle; built only by the stream's shot/fps harness). It builds a level
// in the browser with the same generator and picker the server runs, mounts PlayStage at the full viewport, picks the
// teacher's micro-lines from the same authored bank with the same guards, and exposes window.__play for the harness.
//   ?family=todo-jodo&mode=atoms&goal=atoms&art=kagaz&lang=hinglish&class=6&fade=1&seed=3&topic=…&skill=…
import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/fonts.css";
import type { ArtId, FamilyId, Fade, GenRequest, Lang, Moment, PlayLevel, PlayMode, PlayWorldFamily } from "../../../shared/play.ts";
import { pickArt } from "../../../shared/play.ts";
import { logicFor } from "../families/index.ts";
import { pickLevels } from "../core/pick.ts";
import { newHistory, pickReaction, type ReactionBank } from "../core/react.ts";
import { PlayStage, type PlayDoor } from "../PlayStage.tsx";
import bankJson from "../../../data/play/reactions.json";

const q = new URLSearchParams(location.search);
const family = (q.get("family") ?? "todo-jodo") as FamilyId;
const mode = (q.get("mode") ?? "atoms") as PlayMode;
const lang = (q.get("lang") ?? "hinglish") as Lang;
const classLevel = Number(q.get("class") ?? 6);
const fade = Number(q.get("fade") ?? 1) as Fade;
const seed0 = Number(q.get("seed") ?? 3);
const artParam = q.get("art") as ArtId | null;
const goal = q.get("goal") ?? undefined;
const grammar = JSON.parse(q.get("grammar") ?? "{}") as Record<string, unknown>;
const topicId = q.get("topic") ?? `dev-${family}-${mode}`;
const skillId = q.get("skill") ?? `${topicId}-s1`;
const bank = bankJson as unknown as ReactionBank;
const demo = q.get("demo") === "1";
const reduced = q.get("reduced") === "1";
const harder = q.get("harder") === "1";

function makeLevel(seed: number, door?: "garam" | "teekha"): { garam: PlayLevel; teekha: PlayLevel | null } | null {
  const logic = logicFor(family, mode); if (!logic) return null;
  const misMap: Record<string, string> = Object.fromEntries(logic.malRules.map((m) => [m, `dev:${m}`]));
  const req: GenRequest = { family, mode, topicId, skillId, classLevel, fade, goal, mis: {}, misMap, grammar, recent: [], seed, harder: harder || door === "teekha" };
  const r = pickLevels(logic, req);
  return r ? { garam: r.garam, teekha: r.teekha } : null;
}

const WORLD: PlayWorldFamily = {
  family, stations: [
    { topicId: "c6-maths-ch05-t01", title: "Factors", skillIds: [], state: "ink", recheck: false, here: false, mode },
    { topicId: "c6-maths-ch05-t02", title: "Primes", skillIds: [], state: "pencil", recheck: true, here: false, mode },
    { topicId: "c6-maths-ch05-t04", title: "Prime factors", skillIds: [], state: "hatched", recheck: false, here: true, mode },
    { topicId: "c7-maths-ch11-t01", title: "HCF", skillIds: [], state: "ahead", recheck: false, here: false, mode },
  ],
  routes: [{ from: "c6-maths-ch05-t01", to: "c6-maths-ch05-t04", cite: "kit", edge: "c6-maths-ch05-t04-s1←c6-maths-ch05-t01-s1" }, { from: "c6-maths-ch05-t02", to: "c6-maths-ch05-t04", cite: "kit", edge: "c6-maths-ch05-t04-s2←c6-maths-ch05-t02-s1" }, { from: "c6-maths-ch05-t04", to: "c7-maths-ch11-t01", cite: "curriculum", edge: "c7-maths-ch11-t01←c6-maths-ch05-t04" }],
};

function App() {
  const [seed, setSeed] = useState(seed0);
  const [door, setDoor] = useState<"garam" | "teekha" | undefined>(undefined);
  const levels = useMemo(() => makeLevel(seed, door), [seed, door]);
  const [caption, setCaption] = useState<string | null>(null);
  const hist = useRef(newHistory());
  const t0 = useRef(performance.now());
  const [solved, setSolved] = useState(false);
  const art = useMemo(() => artParam ?? pickArt({ family, subject: family === "kyun-lab" ? "science" : "maths", topicId, classLevel }).art, []);
  useEffect(() => { setSolved(false); }, [levels]);
  if (!levels) return <p style={{ color: "#fff" }}>no level</p>;
  const level = levels.garam;
  const next = makeLevel(seed + 101);
  const doors: PlayDoor[] = next ? [{ door: "garam", level: next.garam, hint: "" }, ...(next.teekha ? [{ door: "teekha" as const, level: next.teekha, hint: "" }] : [])] : [];
  const onMoments = (ms: Moment[]) => {
    const r = pickReaction(bank, ms, { lang, family, seed: level.levelId, hist: hist.current, nowS: (performance.now() - t0.current) / 1000 });
    if (r) setCaption(r.text);
  };
  (window as unknown as { __playLevel: PlayLevel; __playNext: unknown }).__playLevel = level;
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <PlayStage level={level} art={art} lang={lang} classLevel={classLevel} caption={caption} teacherName="Ira" debug demo={demo} reducedMotion={reduced} sound={false}
        doors={solved ? doors.map((d) => ({ ...d, hint: d.door === "garam" ? (lang === "en" ? "one more like this" : "isi tarah ka ek aur") : (lang === "en" ? "a bit harder" : "thoda mushkil") })) : null}
        onDoor={(d) => { setDoor(d.door); setSeed((s) => s + 101); setCaption(null); }}
        world={WORLD}
        onEvent={(e) => { if (e.type === "moments" && e.moments) onMoments(e.moments); if (e.type === "solved") setSolved(true); if (e.type === "impasse") onMoments([{ kind: "impasse", seq: 0, facts: {} }]); }} />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
