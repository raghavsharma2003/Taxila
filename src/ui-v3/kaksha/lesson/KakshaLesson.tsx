// The Kaksha lesson frame (BUILD-SPEC §3.3, §3.5; K1). LessonScreen (stream 2) mounts it lazily behind `ui.kaksha`
// (patch K-P2) and hands it a function that renders the Desk; the frame calls it back with the skin:
//   - `skin="kaksha"`: the Desk writes data-skin on its root and the skin CSS (desk.kaksha.css) restyles the zones by
//     their data-zone attributes. Layout, behaviour, the floor, the lamp rule and every sheet (Pause with 1098 / 14416,
//     Help, the safeguarding hand-off) are the Desk's own and do not change.
//   - `renderSummary`: the Debrief in place of the Summary when the lesson ends.
// It also reads the child's map once when the lesson opens: the "before" half of the Debrief's "Now secure" diff, and
// the open Hangar items the child's equipped hull and trail may tint the play engine with (K2, seam K-P3 / K-P4).
//   - PlayBriefingContext (src/play/briefing.ts): the Briefing card in front of a real-game engine, plus the cosmetics.
// Nothing here touches the turn path: no fetch per turn, no timer, no rAF (the latency driver measures this, RESULTS.md).
import { lookAttr } from "../look.ts";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TapSource } from "../../../avatar/tap.ts";
import type { DeskModel } from "../../../child/lesson/model.ts";
import type { DeskSkin } from "../../../child/lesson/Desk.tsx";
import { getChildMap } from "../../../child/api.ts";
import { madeSince, readMadeFor, sendEmote, sendReflect } from "./made.ts";
import type { MadeForItem } from "../../../../shared/contracts.ts";
import "../../tokens.css";
import "../tokens.css";
import "../kaksha.css";
import "./desk.kaksha.css";
import "../../r8/bridge.css";
import "../../r8/lesson.css";
import { txTheme } from "../../r8/tx.ts";
import { kakshaThemeFor } from "../tokens.ts";
import catalogJson from "../../../../data/kaksha/catalog.json";
import { PlayBriefingContext, type PlayBriefing, type PlayCosmetics } from "../../../play/briefing.ts";
import { Briefing } from "../play/Briefing.tsx";
import { cosmeticsFor, paletteFor, emoteLook, lessonLook, type EmoteLook, type LessonLook } from "../play/cosmetics.ts";
import { readEquipped } from "../memory.ts";
import { syncEquipped } from "../equipSync.ts";
import { world, type Catalog } from "../world.ts";
import "../play/play.kaksha.css";
import { Debrief } from "./Debrief.tsx";
import { IntakeCard } from "./IntakeCard.tsx";
import { StageBody } from "./StageBody.tsx";
import type { DeskBodyParts } from "../../../child/lesson/Desk.tsx";
import type { MapLike } from "./debrief.ts";

export type LoadMap = (cid: string) => Promise<MapLike | null>;

// getChildMap answers a failed read with an EMPTY map, never an error. An empty "before" would make every secure skill
// look new (a false "Now secure"), so an empty read is unknown here (null): the Debrief then shows no secure section.
// r5 QA: the "before" read runs in a useState initializer, which React re-runs when a render is discarded (a lazy child
// suspending), so every lesson start fetched the 189 KB map twice in parallel (2.7-3.2 s each, on the lesson's hot path).
// A read in flight is shared per child (no clock: it is dropped when it settles); the Debrief's "after" read comes
// minutes later and is fresh.
const inflight = new Map<string, Promise<MapLike | null>>();
const loadChildMap: LoadMap = (cid) => {
  const hit = inflight.get(cid);
  if (hit) return hit;
  const p = getChildMap(cid, "sky").then((m) => (m.empty && !m.hidden ? null : (m as MapLike)), () => null);
  inflight.set(cid, p);
  void p.finally(() => { if (inflight.get(cid) === p) inflight.delete(cid); });
  return p;
};

export interface KakshaLessonProps {
  cid: string;
  family: "young" | "older";
  reducedMotion: boolean;
  children: (skin: DeskSkin) => ReactNode;
  /** The map read (tests and the dev page pass fixtures). */
  loadMap?: LoadMap;
  /** The made-for feed read (the dev page passes fixtures). */
  readMade?: (cid: string) => Promise<MadeForItem[] | null>;
}

export default function KakshaLesson({ cid, family, reducedMotion, children, loadMap = loadChildMap, readMade = readMadeFor }: KakshaLessonProps) {
  // once, at lesson start: never re-read during the lesson
  const [before] = useState(() => loadMap(cid));
  // r7 app-debrief-made-later: the made-for feed as the lesson opens (the Debrief shows the pieces new since)
  const [madeBefore] = useState(() => readMade(cid));
  const [cosmetics, setCosmetics] = useState<PlayCosmetics | null>(null);
  // r7 app-world-hangar-depth: an equipped (and open) board theme tints the stage's board; a rim colours her frame
  const [look, setLook] = useState<LessonLook>({ board: null, rim: null });
  const [emote, setEmote] = useState<EmoteLook | null>(null);
  useEffect(() => {
    let live = true;
    // the server's equip set first (another device's choice), else this device's
    void Promise.all([before, syncEquipped(cid)]).then(([m, server]) => {
      if (!live || !m || m.hidden) return;
      const items = world(m.skills, catalogJson as unknown as Catalog).items;
      const eq = server ?? readEquipped(cid);
      setCosmetics(cosmeticsFor(eq, items, paletteFor(family)));
      setLook(lessonLook(eq, items));
      setEmote(emoteLook(eq, items));
    }, () => {});
    return () => { live = false; };
  }, [before, cid, family]);
  const briefing = useMemo<PlayBriefing>(() => ({ render: (p) => <Briefing {...p} />, cosmetics }), [cosmetics]);
  // APP-25: stable loaders (they are Debrief's effect dependencies: new functions each render re-ran the plan and map reads)
  const loadAfter = useCallback(() => loadMap(cid), [loadMap, cid]);
  const loadMade = useCallback(() => Promise.all([madeBefore, readMade(cid)]).then(([b, a]) => madeSince(b, a)), [madeBefore, readMade, cid]);
  const renderSummary = useCallback(
    (p: { m: DeskModel; meters: TapSource[]; onFinish: () => void; onFinishTo?: (to: string) => void }) => <Debrief {...p} before={before} loadAfter={loadAfter}
      loadMade={loadMade}
      onReflect={(lessonId, choice) => void sendReflect(cid, lessonId, choice)} onEmote={(lessonId, e) => void sendEmote(cid, lessonId, e)} madeTo={(id) => `/c/${cid}/notebook?made=${encodeURIComponent(id)}`} emote={emote} />,
    [before, loadAfter, loadMade, cid, emote],
  );
  const renderIntake = useCallback((m: DeskModel) => (m.intake ? <IntakeCard intake={m.intake} /> : null), []);
  // r7 app-lesson-stage-first (D7): the stage-first body; ?desk=v2 on the URL keeps the V2 Desk grid for comparison
  // round 8 (the ?tx= switch, src/ui-v3/r8/tx.ts): the new theme on this lesson, and the teacher as a presence
  const [tx] = useState(() => txTheme());
  const renderBody = useMemo(() => (stageFirst() ? (p: DeskBodyParts) => <StageBody {...p} presence={!!tx} /> : undefined), [tx]);
  return (
    <div className="v3 kx kx-lesson" data-ktheme={kakshaThemeFor(family)} data-klook={lookAttr(family)} data-motion={reducedMotion ? "reduced" : undefined} data-kscreen="lesson" data-tx={tx ?? undefined} data-board-theme={tx === "a" ? "paper" : tx === "b" ? "night" : undefined}
      data-kboard={look.board ?? undefined} data-krim={look.rim ?? undefined}
      style={{ ...(look.board ? { ["--kboard" as string]: `var(--k-hue-${look.board})` } : {}), ...(look.rim ? { ["--krim" as string]: `var(--k-hue-${look.rim})` } : {}) }}>
      <PlayBriefingContext.Provider value={briefing}>{children({ skin: "kaksha", renderSummary, renderIntake, renderBody })}</PlayBriefingContext.Provider>
    </div>
  );
}

/** The stage-first body is the Kaksha lesson; `?desk=v2` (per page) shows the V2 Desk grid for side-by-side review. */
export function stageFirst(): boolean {
  try {
    return new URLSearchParams(location.search).get("desk") !== "v2";
  } catch {
    return true;
  }
}
