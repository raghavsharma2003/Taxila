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
import "../../tokens.css";
import "../tokens.css";
import "../kaksha.css";
import "./desk.kaksha.css";
import { kakshaThemeFor } from "../tokens.ts";
import catalogJson from "../../../../data/kaksha/catalog.json";
import { PlayBriefingContext, type PlayBriefing, type PlayCosmetics } from "../../../play/briefing.ts";
import { Briefing } from "../play/Briefing.tsx";
import { cosmeticsFor } from "../play/cosmetics.ts";
import { readEquipped } from "../memory.ts";
import { world, type Catalog } from "../world.ts";
import "../play/play.kaksha.css";
import { Debrief } from "./Debrief.tsx";
import { IntakeCard } from "./IntakeCard.tsx";
import type { MapLike } from "./debrief.ts";

export type LoadMap = (cid: string) => Promise<MapLike | null>;

// getChildMap answers a failed read with an EMPTY map, never an error. An empty "before" would make every secure skill
// look new (a false "Now secure"), so an empty read is unknown here (null): the Debrief then shows no secure section.
const loadChildMap: LoadMap = (cid) => getChildMap(cid, "sky").then((m) => (m.empty && !m.hidden ? null : (m as MapLike)), () => null);

export interface KakshaLessonProps {
  cid: string;
  family: "young" | "older";
  reducedMotion: boolean;
  children: (skin: DeskSkin) => ReactNode;
  /** The map read (tests and the dev page pass fixtures). */
  loadMap?: LoadMap;
}

export default function KakshaLesson({ cid, family, reducedMotion, children, loadMap = loadChildMap }: KakshaLessonProps) {
  // once, at lesson start: never re-read during the lesson
  const [before] = useState(() => loadMap(cid));
  const [cosmetics, setCosmetics] = useState<PlayCosmetics | null>(null);
  useEffect(() => {
    let live = true;
    void before.then((m) => { if (live && m && !m.hidden) setCosmetics(cosmeticsFor(readEquipped(cid), world(m.skills, catalogJson as unknown as Catalog).items)); }, () => {});
    return () => { live = false; };
  }, [before, cid]);
  const briefing = useMemo<PlayBriefing>(() => ({ render: (p) => <Briefing {...p} />, cosmetics }), [cosmetics]);
  const renderSummary = useCallback(
    (p: { m: DeskModel; meters: TapSource[]; onFinish: () => void }) => <Debrief {...p} before={before} loadAfter={() => loadMap(cid)} />,
    [before, loadMap, cid],
  );
  const renderIntake = useCallback((m: DeskModel) => (m.intake ? <IntakeCard intake={m.intake} /> : null), []);
  return (
    <div className="v3 kx kx-lesson" data-ktheme={kakshaThemeFor(family)} data-klook={lookAttr(family)} data-motion={reducedMotion ? "reduced" : undefined} data-kscreen="lesson">
      <PlayBriefingContext.Provider value={briefing}>{children({ skin: "kaksha", renderSummary, renderIntake })}</PlayBriefingContext.Provider>
    </div>
  );
}
