// /c/:cid/notebook (PRODUCT-DESIGN-V2 §3.9, §6.3.7; audit: "Notes: a raw list of board strings, objective text
// included"). One page per lesson, newest first, as a stack of cards on the notebook shelf. Each page: the topic, the
// lesson's best question card (a verified one first) and the child's own answer, from the lesson's DidCards
// (GET /api/lesson/summary, ledger and turn-log facts only, PX1). Pages appear only from real lessons: no blank pages
// waiting, no page counts. Hidden when the parent chose "Only this session" (§3.13).
// Not yet (open items): her one-line explanation per page and a still of the tray's final state (no endpoint carries
// them); Young read-aloud on tap (needs the page's line rendered in her voice); Older "Notes for a friend" (teach-back
// notes are not stored yet).
// ROUND 4 CONTENT (stream 2 owns this screen this round): every board the child was shown is saved per LESSON on the
// server (board_page; GET /api/studio/notebook lists the child's lessons with boards on ANY device, newest first; GET
// /api/studio/notebook/pages replays one lesson's boards in the order they were drawn). Each page opens a replay (her
// boards redrawn one after another, in the real Studio stage) and "Continue this lesson" (a new lesson on the same topic).
// The device's own record below is kept for the best question card and as the fallback when the server list fails.
// WHERE THE PAGES CAME FROM before round 4 (open item for the server owner): no endpoint lists a child's lessons, so the page list is
// the lesson ids THIS DEVICE recorded at each summary's Finish (prefs.ts artefacts). A second device, a reinstall or
// cleared storage therefore shows fewer pages than the child has had. The empty line never claims "no lessons yet"
// unless the server's plan says so (state "first"); otherwise it says only what is true on any device. Summaries are
// immutable once a lesson ended, so each is fetched once and kept on the device (no N+1 on every open), at most
// SUMMARY_CONCURRENCY at a time. Replace the source with a server list (GET /api/child/notebook) when it exists.
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
import { Link } from "react-router-dom";
import { StudioStage } from "../../studio/StudioStage.tsx";
import type { StudioSlot, WhiteboardScript } from "../../../shared/studio.ts";
import { tnb } from "../../copy/en.ts";
import "./notebook.css";

interface Page { lessonId: string; topic: string; at: number; summary: LessonSummary | null; chips: string[]; topicId?: string | null; boards?: number; first?: WhiteboardScript | null }
interface ServerPage { lessonId: string; topicId: string | null; title: string | null; startedAt: string; ended: boolean; boards: number; first: WhiteboardScript | null }
interface Replay { lessonId: string; topicId: string | null; title: string | null; boards: { seq: number; script: WhiteboardScript }[] }

async function serverNotebook(cid: string, signal: AbortSignal): Promise<{ hidden: boolean; pages: ServerPage[] } | null> {
  try {
    const r = await fetch(`/api/studio/notebook?childId=${encodeURIComponent(cid)}`, { credentials: "same-origin", signal });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
async function serverPages(lessonId: string): Promise<Replay | null> {
  try {
    const r = await fetch(`/api/studio/notebook/pages?lessonId=${encodeURIComponent(lessonId)}`, { credentials: "same-origin" });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
/** A board as a Studio slot (no lesson id in the intent: the stage opens no stream and posts nothing). */
const boardSlot = (key: string, script: WhiteboardScript): StudioSlot =>
  ({ slotId: `nb:${key}:slot`, intentId: `nb:${key}`, state: "revealed", artifact: { kind: "whiteboard", stage: { w: script.board.w, h: script.board.h }, script } } as StudioSlot);

export const SUMMARY_CONCURRENCY = 3;
const sumKey = (cid: string) => `taxila.child.${cid}.nbsum`;

function readSummaries(cid: string): Record<string, LessonSummary> {
  try {
    return JSON.parse(localStorage.getItem(sumKey(cid)) ?? "{}") as Record<string, LessonSummary>;
  } catch {
    return {};
  }
}
function keepSummaries(cid: string, all: Record<string, LessonSummary>, ids: string[]): void {
  try {
    localStorage.setItem(sumKey(cid), JSON.stringify(Object.fromEntries(ids.filter((id) => all[id]).map((id) => [id, all[id]]))));
  } catch {
    /* storage full or blocked: the next open fetches again */
  }
}

/** Run `fn` over `items`, at most `n` at a time, in order of `items`. */
async function pooled<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

export function Notebook() {
  const { cid, family } = useChild();
  const { plan } = usePlan(cid);
  const young = family === "young";
  const [pages, setPages] = useState<Page[] | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    const list = readArtefacts(cid).slice().reverse().slice(0, 12);
    const cache = readSummaries(cid);
    const page = (a: (typeof list)[number], sum: LessonSummary | null): Page =>
      ({ lessonId: a.lessonId, topic: sum?.shortTitle ?? sum?.title ?? a.topic, at: a.at, chips: a.chips, summary: sum });
    setPages(list.map((a) => page(a, cache[a.lessonId] ?? null)));
    // the server's list (every device): its pages lead; a page this device also recorded keeps its best question card
    void serverNotebook(cid, ac.signal).then((nb) => {
      if (ac.signal.aborted || !nb || nb.hidden || !nb.pages.length) return;
      const local = new Map(list.map((a) => [a.lessonId, a]));
      const fromServer: Page[] = nb.pages.map((sp) => {
        const a = local.get(sp.lessonId);
        return { lessonId: sp.lessonId, topic: sp.title ?? a?.topic ?? "", at: Date.parse(sp.startedAt) || a?.at || 0, chips: a?.chips ?? [], summary: cache[sp.lessonId] ?? null,
          topicId: sp.topicId, boards: sp.boards, first: sp.first };
      });
      const extra = list.filter((a) => !nb.pages.some((sp) => sp.lessonId === a.lessonId)).map((a) => page(a, cache[a.lessonId] ?? null));
      setPages([...fromServer, ...extra].sort((x, y) => y.at - x.at));
    });
    const missing = list.filter((a) => !cache[a.lessonId]);
    if (missing.length) {
      void pooled(missing, SUMMARY_CONCURRENCY, (a) => getLessonSummary(a.lessonId, ac.signal)).then((sums) => {
        if (ac.signal.aborted) return;
        missing.forEach((a, i) => { if (sums[i]) cache[a.lessonId] = sums[i]!; });
        keepSummaries(cid, cache, list.map((a) => a.lessonId));
        setPages(list.map((a) => page(a, cache[a.lessonId] ?? null)));
      });
    }
    return () => ac.abort();
  }, [cid]);
  if (!plan.surfaces.notebook) return <Navigate to={`/c/${cid}`} replace />;
  const shown = (pages ?? []).filter((p) => p.summary?.cards.length || p.chips.length || (p.boards ?? 0) > 0);
  // "after your first lesson" only when the server says there has been none; otherwise a line true on any device
  const emptyLine = plan.serverState === "first" ? t("emptyNotebook") : t("emptyNotebookLater");

  return (
    <ChildScreen testid="notebook" ground="shelf" title={t("notebook")} surfaces={plan.surfaces} className="notebook">
      {pages && !shown.length ? (
        plan.source === "loading" ? <div className="map-wait" aria-busy="true" /> :
        <section className="cs-card empty" data-testid="notebook-empty">
          <Spot id="states/notebook-empty" size={200} fallback={<span className="spot-tile spot-tile--lg"><Icon name="notebook" size={72} /></span>} />
          <p className="empty-line">{emptyLine}</p>
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
                {(p.boards ?? 0) > 0 && <BoardPage cid={cid} page={p} young={young} />}
                {!young && <p className="nb-date">{new Date(p.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </ChildScreen>
  );
}

/** A lesson's boards: the first as a still, "Replay" redraws them all in order, "Continue this lesson" starts its topic. */
function BoardPage({ cid, page, young }: { cid: string; page: Page; young: boolean }) {
  const [replay, setReplay] = useState<Replay | null>(null);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(false);
  const open = async () => {
    setLoading(true);
    const r = await serverPages(page.lessonId);
    setLoading(false);
    if (r?.boards.length) { setReplay(r); setI(0); }
  };
  // a board's own drawing time, then a beat of rest, then the next one (the child can step back and forth)
  useEffect(() => {
    if (!replay || i >= replay.boards.length - 1) return;
    const ms = Math.min(20_000, Number(replay.boards[i]?.script.durationMs) || 4000) + 1500;
    const t = setTimeout(() => setI((x) => x + 1), ms);
    return () => clearTimeout(t);
  }, [replay, i]);
  const n = page.boards ?? 0;
  const shown = replay ? replay.boards[i]?.script : page.first;
  return (
    <div className="nb-boards" data-testid="notebook-boards">
      {shown && (
        <div className="nb-board" data-testid="notebook-board">
          <StudioStage key={replay ? `r${i}` : "first"} slot={boardSlot(`${page.lessonId}:${replay ? i : "first"}`, shown)} young={young} lang="en" />
        </div>
      )}
      <div className="nb-actions">
        {replay ? (
          <>
            <button type="button" className="nb-btn" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label={tnb("prev")}>‹</button>
            <span className="nb-count" data-testid="notebook-count">{tnb("of", { i: i + 1, n: replay.boards.length })}</span>
            <button type="button" className="nb-btn" onClick={() => setI((x) => Math.min(replay.boards.length - 1, x + 1))} disabled={i >= replay.boards.length - 1} aria-label={tnb("next")}>›</button>
            <button type="button" className="nb-btn nb-btn--text" onClick={() => setReplay(null)}>{tnb("close")}</button>
          </>
        ) : (
          <>
            <span className="nb-count">{n === 1 ? tnb("board1") : tnb("boards", { n })}</span>
            <button type="button" className="nb-btn nb-btn--text" onClick={open} disabled={loading} data-testid="notebook-replay">{tnb("replay")}</button>
          </>
        )}
        {page.topicId && <Link className="nb-btn nb-btn--go" to={`/c/${cid}/lesson/new?topic=${encodeURIComponent(page.topicId)}`} data-testid="notebook-continue">{tnb("continue")}</Link>}
      </div>
    </div>
  );
}
