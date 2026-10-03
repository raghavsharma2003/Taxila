// The Garden (ages 6-9; PRODUCT-DESIGN-V2 §3.8, §4.8, §6.3.7): a horizontal panorama of beds. Each bed is a chapter,
// marked with a picture of what it is about (MANIFEST.topicMap); each plant is a skill whose stage carries the ledger
// state (plot → sprout → bloom → fruit with a ring). A chapter seal (a woven gate with a bell) stands on a bed whose
// every skill is Got it or Secure. A sunbird perches only on a server-scheduled re-check.
// No words, no numbers (§10). Banned (§4.8): wilting, fading, empty-plot counts, dates, "new" dots, streaks, totals:
// only beds the child has started (plus the class's current chapter) are drawn, so there is no field of empty plots.
// The panorama scrolls sideways, with 64 dp arrow buttons as tap twins (§5.2).
import { useRef } from "react";
import type { ChildMapSkill } from "../../../shared/contracts.ts";
import type { MapChapter } from "../api.ts";
import { Scene, Spot, useTopicArt } from "../art.tsx";
import { t } from "../copy.ts";
import { Icon, Picto } from "../pictos.tsx";
import { GardenSeal, Plant, PLANT_KINDS } from "./StateShape.tsx";
import { gardenBeds } from "./layout.ts";

function BedPicture({ chapterId }: { chapterId: string }) {
  const id = useTopicArt(chapterId);
  return <Spot id={id} size={64} className="bed-pic" fallback={<span className="spot-tile"><Icon name="notebook" size={34} /></span>} />;
}

export function Garden({ chapters, onSelect }: { chapters: MapChapter[]; onSelect: (s: ChildMapSkill, kindIndex: number) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const beds = gardenBeds(chapters);
  const by = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const bed = el.querySelector<HTMLElement>(".bed");
    el.scrollBy({ left: dir * ((bed?.offsetWidth ?? 300) + 16), behavior: "smooth" });
  };
  return (
    <div className="garden" data-testid="garden">
      <button type="button" className="garden-arrow garden-arrow--left" onClick={() => by(-1)} aria-label={t("prevBed")}>
        <Picto id="picto/arrow-left" size={40} />
      </button>
      <div className="garden-scroll" ref={scroller}>
        <div className="garden-pano" style={{ ["--beds" as string]: beds.length }}>
          <Scene id="garden-panorama" className="garden-paint" fallback={<div className="garden-flat" />} position="left bottom" />
          {beds.map((ch, bi) => {
            const skills = ch.topics.flatMap((tp) => tp.skills);
            const kind = PLANT_KINDS[bi % PLANT_KINDS.length];
            return (
              <section key={ch.id} className="bed" aria-label={ch.title} data-chapter={ch.id} data-sealed={ch.sealed || undefined}>
                <div className="bed-head">
                  <BedPicture chapterId={ch.id} />
                  {ch.sealed && <span className="bed-seal" role="img" aria-label={t("chapterDone")}><GardenSeal size={72} /></span>}
                </div>
                <div className="bed-plants">
                  {skills.map((s) => (
                    <button key={s.skillId} type="button" className="plant-btn" onClick={() => onSelect(s, bi)}
                      aria-label={s.title} data-state={s.state}>
                      <Plant state={s.state} kind={kind} size={88} recheck={s.recheckScheduled} />
                    </button>
                  ))}
                </div>
                <div className="bed-soil" aria-hidden="true" />
              </section>
            );
          })}
        </div>
      </div>
      <button type="button" className="garden-arrow garden-arrow--right" onClick={() => by(1)} aria-label={t("nextBed")}>
        <Picto id="picto/arrow-right" size={40} />
      </button>
    </div>
  );
}
