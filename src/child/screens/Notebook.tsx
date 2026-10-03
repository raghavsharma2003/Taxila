// /c/:cid/notebook (PRODUCT-DESIGN-V2 §3.9, §6.3.7; audit: "Notes: a raw list of board strings, objective text
// included"). One page per lesson, newest first, as a stack of cards on the notebook shelf. Each page: the topic, the
// lesson's best question card (a verified one first) and the child's own answer, from the lesson's DidCards
// (GET /api/lesson/summary, ledger and turn-log facts only, PX1). Pages appear only from real lessons: no blank pages
// waiting, no page counts. Hidden when the parent chose "Only this session" (§3.13).
// Not yet (open items): her one-line explanation per page and a still of the tray's final state (no endpoint carries
// them); Young read-aloud on tap (needs the page's line rendered in her voice); Older "Notes for a friend" (teach-back
// notes are not stored yet).
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { LessonSummary } from "../../../shared/contracts.ts";
import { bestCard, getLessonSummary } from "../api.ts";
import { Spot } from "../art.tsx";
import { ChildScreen } from "../chrome.tsx";
import { useChild } from "../ChildShell.tsx";
import { t } from "../copy.ts";
import { Icon } from "../pictos.tsx";
import { usePlan } from "../plan.ts";
import { readArtefacts } from "../prefs.ts";

interface Page { lessonId: string; topic: string; at: number; summary: LessonSummary | null; chips: string[] }

export function Notebook() {
  const { cid, family } = useChild();
  const { plan } = usePlan(cid);
  const young = family === "young";
  const [pages, setPages] = useState<Page[] | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    const list = readArtefacts(cid).slice().reverse().slice(0, 12);
    setPages(list.map((a) => ({ lessonId: a.lessonId, topic: a.topic, at: a.at, chips: a.chips, summary: null })));
    void Promise.all(list.map((a) => getLessonSummary(a.lessonId, ac.signal))).then((sums) => {
      if (ac.signal.aborted) return;
      setPages(list.map((a, i) => ({ lessonId: a.lessonId, topic: sums[i]?.shortTitle ?? sums[i]?.title ?? a.topic, at: a.at, chips: a.chips, summary: sums[i] })));
    });
    return () => ac.abort();
  }, [cid]);
  if (!plan.surfaces.notebook) return <Navigate to={`/c/${cid}`} replace />;
  const shown = (pages ?? []).filter((p) => p.summary?.cards.length || p.chips.length);

  return (
    <ChildScreen testid="notebook" ground="shelf" title={t("notebook")} surfaces={plan.surfaces} className="notebook">
      {pages && !shown.length ? (
        <section className="cs-card empty" data-testid="notebook-empty">
          <Spot id="states/notebook-empty" size={200} fallback={<span className="spot-tile spot-tile--lg"><Icon name="notebook" size={72} /></span>} />
          <p className="empty-line">{t("emptyNotebook")}</p>
        </section>
      ) : (
        <ol className="nb-stack" aria-label={t("notebook")}>
          {shown.map((p) => {
            const card = p.summary ? bestCard(p.summary.cards) : null;
            return (
              <li key={p.lessonId} className="cs-card nb-page" data-testid="notebook-page">
                <h2 className="nb-topic">{p.topic}</h2>
                {card ? (
                  <div className="nb-card">
                    {card.ask && <p className="nb-ask" data-speech="">{card.ask}</p>}
                    <p className="nb-answer">
                      <span className="nb-label">{t("yourAnswer")}</span> <strong data-speech="">{card.answer}</strong>
                      {card.tick && (
                        <span className={`didmini-tick ${card.withHelp ? "didmini-tick--help" : ""}`} role="img" aria-label={card.withHelp ? t("withAHint") : t("onYourOwn")}>
                          <Icon name="tick" size={20} />
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  p.chips.length > 0 && <p className="nb-chips" data-speech="">{p.chips.slice(-3).join(" · ")}</p>
                )}
                {!young && <p className="nb-date">{new Date(p.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </ChildScreen>
  );
}
