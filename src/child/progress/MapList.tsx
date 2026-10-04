// The List view: the source of truth behind the Garden and the Sky (PRODUCT-DESIGN-V2 §3.8). Chapters → skills with
// the same state shapes. Older see the state words and "n of m Secure" (counts, never a percentage); Young see shapes
// and names only (no numbers, §10).
import type { ChildMapSkill } from "../../../shared/contracts.ts";
import type { MapChapter } from "../api.ts";
import { t } from "../copy.ts";
import { STATE_WORD, StateShape } from "./StateShape.tsx";

export function MapList({ chapters, mode, words, onSelect }:
  { chapters: MapChapter[]; mode: "garden" | "sky"; words: boolean; onSelect?: (s: ChildMapSkill) => void }) {
  return (
    <div className="maplist" data-testid="map-list">
      {chapters.map((ch) => {
        const skills = ch.topics.flatMap((tp) => tp.skills);
        return (
          <section key={ch.id} className="cs-card maplist-ch" aria-label={ch.title}>
            <header className="maplist-head">
              <h2>{ch.title.replace(/\s*[—–]\s*/g, " ")}</h2>
              {words && <span className="maplist-count">{t("nOfMSecure", { n: ch.secure, m: ch.total })}</span>}
              {ch.here && words && <span className="maplist-here">{t("classHere")}</span>}
              {ch.sealed && <span className="maplist-seal">{t("chapterDone")}</span>}
            </header>
            <ul>
              {skills.map((s) => (
                <li key={s.skillId}>
                  <button type="button" className="maplist-row" onClick={() => onSelect?.(s)} data-state={s.state}>
                    <StateShape state={s.state} mode={mode} />
                    <span className="maplist-title">{words ? s.title : s.label ?? s.title}</span>
                    {words && <span className="maplist-word">{STATE_WORD[s.state]}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
