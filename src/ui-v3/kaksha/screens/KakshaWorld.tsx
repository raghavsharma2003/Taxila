// Kaksha World at /c/:cid/map and the Hangar at /c/:cid/hangar when `ui.kaksha` is on (BUILD-SPEC §4). Both are pure
// functions of GET /api/child/map through world.ts and data/kaksha/catalog.json. With learning_profile consent off the
// map is hidden: the World shows the planet and the Hangar only (identity without the academic record).
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChild } from "../../../child/ChildShell.tsx";
import { useChildMap } from "../../../child/useChildMap.ts";
import catalogJson from "../../../../data/kaksha/catalog.json";
import { KakshaRoot } from "../Shell.tsx";
import { HangarView, WorldView } from "../views.tsx";
import { secureSet, world, type Catalog, type WorldSkill } from "../world.ts";
import { readEquipped, rollSnapshot, writeEquipped } from "../memory.ts";

const CATALOG = catalogJson as unknown as Catalog;

function useWorld() {
  const { cid } = useChild();
  const { map, loading } = useChildMap(cid, "sky", true);
  return useMemo(() => {
    const skills: WorldSkill[] = map && !map.hidden ? map.skills : [];
    const now = secureSet(skills);
    const before = map && !map.hidden ? rollSnapshot(cid, now) : null;
    const today = world(skills, CATALOG, before ?? undefined);
    const yesterday = before ? world(skills.map((k) => (k.state === "secure" && !before.has(k.skillId) ? { ...k, state: "got_it" as const } : k)), CATALOG) : null;
    return { today, yesterday, hidden: !!map?.hidden, loading };
  }, [cid, map, loading]);
}

export function KakshaWorld() {
  const { cid, child, family, reducedMotion } = useChild();
  const nav = useNavigate();
  const w = useWorld();
  return (
    <KakshaRoot family={family} reducedMotion={reducedMotion} screen="world">
      <WorldView childName={child.first_name} world={w.today} yesterday={w.yesterday} hidden={w.hidden} reducedMotion={reducedMotion}
        backTo={`/c/${cid}`} hangarTo={`/c/${cid}/hangar`} go={(to) => nav(to)} />
    </KakshaRoot>
  );
}

export function KakshaHangar() {
  const { cid, family, reducedMotion } = useChild();
  const nav = useNavigate();
  const w = useWorld();
  const [equipped, setEquipped] = useState(() => readEquipped(cid));
  return (
    <KakshaRoot family={family} reducedMotion={reducedMotion} screen="hangar">
      <HangarView items={w.today.items} equipped={equipped} onEquip={(slot, id) => setEquipped(writeEquipped(cid, slot, id))}
        reducedMotion={reducedMotion} backTo={`/c/${cid}/map`} go={(to) => nav(to)} />
    </KakshaRoot>
  );
}
