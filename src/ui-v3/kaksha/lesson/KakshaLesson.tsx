// The Kaksha lesson frame (BUILD-SPEC §3.3, §3.5; K1). LessonScreen (stream 2) mounts it lazily behind `ui.kaksha`
// (patch K-P2) and hands it a function that renders the Desk; the frame calls it back with the skin:
//   - `skin="kaksha"`: the Desk writes data-skin on its root and the skin CSS (desk.kaksha.css) restyles the zones by
//     their data-zone attributes. Layout, behaviour, the floor, the lamp rule and every sheet (Pause with 1098 / 14416,
//     Help, the safeguarding hand-off) are the Desk's own and do not change.
//   - `renderSummary`: the Debrief in place of the Summary when the lesson ends.
// It also reads the child's map once when the lesson opens: the "before" half of the Debrief's "Now secure" diff.
// Nothing here touches the turn path: no fetch per turn, no timer, no rAF (the latency driver measures this, RESULTS.md).
import { useCallback, useState, type ReactNode } from "react";
import type { TapSource } from "../../../avatar/tap.ts";
import type { DeskModel } from "../../../child/lesson/model.ts";
import type { DeskSkin } from "../../../child/lesson/Desk.tsx";
import { getChildMap } from "../../../child/api.ts";
import "../../tokens.css";
import "../tokens.css";
import "../kaksha.css";
import "./desk.kaksha.css";
import { kakshaThemeFor } from "../tokens.ts";
import { Debrief } from "./Debrief.tsx";
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
  const renderSummary = useCallback(
    (p: { m: DeskModel; meters: TapSource[]; onFinish: () => void }) => <Debrief {...p} before={before} loadAfter={() => loadMap(cid)} />,
    [before, loadMap, cid],
  );
  return (
    <div className="v3 kx kx-lesson" data-ktheme={kakshaThemeFor(family)} data-motion={reducedMotion ? "reduced" : undefined} data-kscreen="lesson">
      {children({ skin: "kaksha", renderSummary })}
    </div>
  );
}
