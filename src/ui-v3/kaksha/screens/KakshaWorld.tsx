// Kaksha World at /c/:cid/map and the Hangar at /c/:cid/hangar when `ui.kaksha` is on (BUILD-SPEC §4). Both are pure
// functions of GET /api/child/map through world.ts and data/kaksha/catalog.json. With learning_profile consent off the
// map is hidden: the World shows the planet and the Hangar only (identity without the academic record).
import { useEffect, useMemo, useState } from "react";

import { useChild } from "../../../child/ChildShell.tsx";
import { useChildMap } from "../../../child/useChildMap.ts";
import { schoolChaptersOf, sealedChaptersOf } from "../../../child/api.ts";
import catalogJson from "../../../../data/kaksha/catalog.json";
import { KakshaRoot } from "../Shell.tsx";
import { HangarView, WorldView } from "../views.tsx";
import { secureSet, topicOfSkill, world, type Catalog, type WorldSkill } from "../world.ts";
import { cachedHold } from "../../../child/plan.ts";
import { readEquipped, rollSnapshot, secureBeforeToday, writeEquipped } from "../memory.ts";
import { pushEquipped, syncEquipped } from "../equipSync.ts";
import { useChildNav } from "./useNav.ts";
import { useKxGo } from "./go.ts";

const CATALOG = catalogJson as unknown as Catalog;

function useWorld() {
  const { cid } = useChild();
  const { map, loading } = useChildMap(cid, "sky", true);
  return useMemo(() => {
    const skills: WorldSkill[] = map && !map.hidden ? map.skills : [];
    const now = secureSet(skills);
    // the ledger's stamps when the map carries them (secureSince); the device snapshot only until then
    const before = map && !map.hidden ? (secureBeforeToday(skills) ?? rollSnapshot(cid, now)) : null;
    const today = world(skills, CATALOG, before ?? undefined);
    const yesterday = before ? world(skills.map((k) => (k.state === "secure" && !before.has(k.skillId) ? { ...k, state: "got_it" as const } : k)), CATALOG) : null;
    return { today, yesterday, hidden: !!map?.hidden, loading, school: map && !map.hidden ? schoolChaptersOf(map) : [],
      seals: map && !map.hidden ? sealedChaptersOf(map) : [] };
  }, [cid, map, loading]);
}

export function KakshaWorld() {
  const { cid, child, family, reducedMotion } = useChild();
  const go = useKxGo(reducedMotion);
  const w = useWorld();
  const kn = useChildNav();
  return (
    <KakshaRoot family={family} reducedMotion={reducedMotion} screen="world">
      <WorldView childName={child.first_name} world={w.today} yesterday={w.yesterday} hidden={w.hidden} reducedMotion={reducedMotion}
        backTo={`/c/${cid}`} hangarTo={`/c/${cid}/hangar`} go={go} dock={kn.dock} meTo={kn.meTo} school={w.school} seals={w.seals}
        // r7 app-practice-entry: a station's topic (its skill id without the -sN suffix) as a practice set; none on a hold
        practiceTo={cachedHold(cid) ? null : (skillId) => { const t = topicOfSkill(skillId); return t ? `/c/${cid}/practice/${encodeURIComponent(t)}` : null; }}
        revisitTo={cachedHold(cid) ? null : (skillId) => { const t = topicOfSkill(skillId); return t ? `/c/${cid}/lesson/new?topic=${encodeURIComponent(t)}` : null; }} />
    </KakshaRoot>
  );
}

export function KakshaHangar() {
  const { cid, family, reducedMotion } = useChild();
  const go = useKxGo(reducedMotion);
  const w = useWorld();
  const [equipped, setEquipped] = useState(() => readEquipped(cid));
  // the server's set (another device's choice) replaces this device's when it has one
  useEffect(() => { let live = true; void syncEquipped(cid).then((eq) => { if (live && eq) setEquipped(eq); }); return () => { live = false; }; }, [cid]);
  const kn = useChildNav();
  return (
    <KakshaRoot family={family} reducedMotion={reducedMotion} screen="hangar">
      <HangarView items={w.today.items} equipped={equipped} onEquip={(slot, id) => { const next = writeEquipped(cid, slot, id); setEquipped(next); void pushEquipped(cid, next); }}
        reducedMotion={reducedMotion} backTo={`/c/${cid}/map`} go={go} dock={kn.dock} meTo={kn.meTo} />
    </KakshaRoot>
  );
}
