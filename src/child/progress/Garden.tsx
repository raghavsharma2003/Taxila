// The Garden (ages 6-9; PRODUCT-DESIGN-V2 §3.8, §4.8, §6.3.7): a horizontal panorama of beds. Each bed is a chapter,
// marked with a picture of what it is about (MANIFEST.topicMap) on a signboard in that bed's own colour; each plant is
// a skill whose stage carries the ledger state (plot → sprout → bloom → fruit with a ring). A chapter seal (a woven
// gate with a bell) stands on a bed whose every skill is Got it or Secure. A small flag marks the class's current
// chapter (server `here`; its spoken name is "Your class is here"). A sunbird perches only on a server-scheduled
// re-check.
// No words, no numbers on the Garden (§10 "Garden: plants, no words, no numbers"; Young is R0/R1): a bed is told
// apart by its picture, its signboard colour and its plant kind; its chapter name is its accessible name. Banned
// (§4.8): wilting, fading, empty-plot counts, dates, "new" dots, streaks, totals: only beds the child has started (plus
// the class's current chapter) are drawn, so there is no field of empty plots.
// Layout: every bed is a raised bed that fills the panel from the signboard to the bottom (no empty paper band above
// it, the B2 "empty box" finding), one bed wide on a phone (seal and flag inside the visible bed, never clipped by the
// panel edge), several from 720 px. The ground is the painted panorama (bg/garden-panorama) when it has landed, else
// a code-drawn courtyard (sky with clouds, a hedge, the soil): token colours only. 64 dp arrows are the tap twins of
// the sideways scroll (§5.2).
import { useId, useRef } from "react";
import type { ChildMapSkill } from "../../../shared/contracts.ts";
import type { MapChapter } from "../api.ts";
import { Scene, Spot, useTopicArt } from "../art.tsx";
import { t } from "../copy.ts";
import { Picto } from "../pictos.tsx";
import { GardenSeal, Plant, PLANT_KINDS } from "./StateShape.tsx";
import { gardenBeds } from "./layout.ts";

/** Signboard colours, by bed position: token colours only (PD-G13). Never the lamp's marigold (G-LAMP-1). */
const BED_TINTS = ["var(--art-rose)", "var(--art-teal)", "var(--art-sky)", "var(--art-leaf)", "var(--art-terracotta)"];

/** The code-drawn picture for a chapter whose topic art has not landed: a subject emblem, never a letter or a number. */
function SubjectEmblem({ subject }: { subject: string }) {
  const s = subject.toLowerCase();
  const stroke = { fill: "none", stroke: "var(--ink)", strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true" focusable="false">
      {s === "maths" ? (
        <g>
          <circle cx="15" cy="16" r="8" fill="var(--art-sky)" {...{ stroke: "var(--ink)", strokeWidth: 2.2 }} />
          <path d="M33 8 L42 24 H24 Z" fill="var(--art-rose)" stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="17" y="28" width="15" height="13" rx="2" fill="var(--art-leaf)" stroke="var(--ink)" strokeWidth="2.2" />
        </g>
      ) : s === "evs" || s === "science" ? (
        <g>
          <path d="M10 38 C10 18 24 8 40 8 C40 26 30 38 10 38 Z" fill="var(--art-leaf)" stroke="var(--ink)" strokeWidth="2.2" />
          <path d="M12 36 C20 28 26 22 34 14" {...stroke} />
        </g>
      ) : (
        <g>
          <path d="M6 12 q9 -4 18 2 v26 q-9 -6 -18 -2 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M42 12 q-9 -4 -18 2 v26 q9 -6 18 -2 Z" fill="var(--art-teal)" stroke="var(--ink)" strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

/** The "Your class is here" flag (picture only on the Garden; the words are its accessible name). */
function HereFlag() {
  return (
    <span className="bed-here" role="img" aria-label={t("classHere")} data-testid="garden-here">
      <svg viewBox="0 0 40 56" width="100%" height="100%" aria-hidden="true" focusable="false">
        <path d="M8 54 V6" stroke="var(--ink)" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M9 7 H34 L27 17 L34 27 H9 Z" fill="var(--nib)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="8" cy="5" r="3" fill="var(--art-stone)" stroke="var(--ink)" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

function BedSign({ chapter, tint }: { chapter: MapChapter; tint: string }) {
  const id = useTopicArt(chapter.id);
  const subject = chapter.topics[0]?.skills[0]?.subject ?? chapter.id.split("-")[1] ?? "";
  return (
    <span className="bed-sign" style={{ ["--bed-tint" as string]: tint }} aria-hidden="true">
      <span className="bed-sign-board">
        <Spot id={id} size={60} className="bed-pic" fallback={<SubjectEmblem subject={subject} />} />
      </span>
      <span className="bed-sign-post" />
    </span>
  );
}

/** The code-drawn panorama ground: sky + clouds, a hedge, the soil. Patterns repeat across any width. */
function GardenGround() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg className="garden-ground" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`gg-cloud-${uid}`} width="420" height="96" patternUnits="userSpaceOnUse">
          <g fill="var(--surface)" opacity="0.75">
            <ellipse cx="90" cy="34" rx="34" ry="11" /><ellipse cx="112" cy="27" rx="20" ry="10" />
            <ellipse cx="300" cy="58" rx="28" ry="9" /><ellipse cx="318" cy="52" rx="16" ry="8" />
          </g>
        </pattern>
        <pattern id={`gg-hedge-${uid}`} width="64" height="34" patternUnits="userSpaceOnUse">
          <path d="M0 34 V18 q8 -16 16 -6 q8 -14 16 -2 q8 -14 16 -2 q8 -14 16 0 V34 Z" fill="var(--art-leaf)" opacity="0.55" />
        </pattern>
      </defs>
      <rect width="100%" height="96" fill="var(--art-sky)" opacity="0.32" />
      <rect width="100%" height="96" fill={`url(#gg-cloud-${uid})`} />
      <rect y="66" width="100%" height="34" fill={`url(#gg-hedge-${uid})`} />
      <rect y="98" width="100%" height="100%" fill="var(--tray)" />
      <rect y="98" width="100%" height="6" fill="var(--art-stone)" opacity="0.6" />
    </svg>
  );
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
        <div className="garden-pano">
          <Scene id="garden-panorama" className="garden-paint" fallback={<GardenGround />} position="left bottom" />
          {beds.map((ch, bi) => {
            const skills = ch.topics.flatMap((tp) => tp.skills);
            const kind = PLANT_KINDS[bi % PLANT_KINDS.length];
            return (
              <section key={ch.id} className="bed" aria-label={ch.here ? `${ch.title}. ${t("classHere")}` : ch.title} data-chapter={ch.id}
                data-sealed={ch.sealed || undefined} data-here={ch.here || undefined}>
                <div className="bed-head">
                  <BedSign chapter={ch} tint={BED_TINTS[bi % BED_TINTS.length]} />
                  <span className="bed-marks">
                    {ch.here && <HereFlag />}
                    {ch.sealed && <span className="bed-seal" role="img" aria-label={t("chapterDone")}><GardenSeal size={72} /></span>}
                  </span>
                </div>
                <div className="bed-box">
                  <div className="bed-plants">
                    {skills.map((s) => (
                      <button key={s.skillId} type="button" className="plant-btn" onClick={() => onSelect(s, bi)}
                        aria-label={s.label ?? s.title} data-state={s.state}>
                        <Plant state={s.state} kind={kind} size={88} recheck={s.recheckScheduled} />
                      </button>
                    ))}
                  </div>
                </div>
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
