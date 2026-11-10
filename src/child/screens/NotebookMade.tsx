// The Notebook's "Made for you" page (r7 app-notebook-log; STUDENT-FLOW §9.3): every piece she built for the child,
// newest first (GET /api/studio/made-for: revealed, not hidden, not a plain board), no counts and no completion meter.
// A tap plays it again in the real Studio stage (the card's replay artifact; no lesson id in the intent, so the stage
// opens no stream and posts nothing). ?made=<id> (the Home's and the Debrief's links) opens that piece at once.
import { dayOf } from "../growth.ts";
import { useEffect, useState } from "react";
import { StudioStage } from "../../studio/StudioStage.tsx";
import type { StudioSlot } from "../../../shared/studio.ts";
import { Ghost, Glyph, Panel, StatePanel } from "../../ui-v3/kaksha/kit.tsx";
import { kt } from "../../ui-v3/kaksha/copy.ts";
import { tr7 } from "../../copy/en.ts";
import { findPlaying } from "../madeMatch.ts";

export interface MadeCard { id: string; intentId?: string | null; title: string; kind: string; topicId: string | null; at: string; replay: unknown | null }

export async function readMadeCards(cid: string, signal?: AbortSignal): Promise<MadeCard[] | null> {
  try {
    const r = await fetch(`/api/studio/made-for?childId=${encodeURIComponent(cid)}`, { credentials: "same-origin", signal });
    if (!r.ok) return null;
    const j = (await r.json()) as { cards?: MadeCard[] };
    return Array.isArray(j.cards) ? j.cards : [];
  } catch {
    return null;
  }
}

/** A made piece as a Studio slot (replay only: no lesson in the intent). */
export const replaySlot = (c: MadeCard): StudioSlot =>
  ({ slotId: `made:${c.id}:slot`, intentId: `made:${c.id}`, state: "revealed", artifact: c.replay } as unknown as StudioSlot);

export function MadeShelf({ cid, young, openId, name }: { cid: string; young: boolean; openId: string | null; name: string }) {
  const [cards, setCards] = useState<MadeCard[] | null | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(openId);
  // APP-07: a "This helped" link changes ?made= while this page is already open
  useEffect(() => { if (openId) setOpen(openId); }, [openId]);
  useEffect(() => {
    const ac = new AbortController();
    void readMadeCards(cid, ac.signal).then((c) => { if (!ac.signal.aborted) setCards(c); });
    return () => ac.abort();
  }, [cid]);
  if (cards === undefined) return <div className="kx-wait" aria-busy="true" />;
  if (!cards || cards.length === 0) return <StatePanel glyph="play" line={tr7("nb.madeEmpty", { T: name })} testid="made-empty" />;
  const playing = findPlaying(cards, open);
  return (
    <>
      {playing && (
        <Panel className="kx-made-play" testid="made-playing" eyebrow={kt("playAgain")}>
          <h2 className="kx-panel-title">{playing.title}</h2>
          <div className="kx-log-board kx-made-stage"><StudioStage key={playing.id} slot={replaySlot(playing)} young={young} lang="en" /></div>
          <Ghost onClick={() => setOpen(null)} testid="made-close"><Glyph name="cross" size={20} /> {tr7("nb.close")}</Ghost>
        </Panel>
      )}
      <ul className="kx-made-grid" aria-label={kt("madeForYou")} data-testid="made-shelf">
        {cards.map((c) => (
          <li key={c.id}>
            <button type="button" className="kx-made-tile kx-cut" disabled={!c.replay} aria-pressed={c.id === playing?.id}
              onClick={() => setOpen(c.id)} aria-label={`${kt("playAgain")}: ${c.title}`} data-testid="made-tile">
              <span className="kx-made-ico" aria-hidden="true"><Glyph name="play" size={26} /></span>
              <b>{c.title}</b>
              <span className="kx-tagline">{dayOf(c.at)}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
