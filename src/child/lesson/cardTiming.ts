// When the question card changes, against the board (r7, main's calls on LESSON-REPLAY-d10, 2026-11-08). PURE: no clock,
// no React, so tests run it with the director10 turn shapes.
//
// (3a) A paged turn (the board's script has `switches`): the NEW card pins when the LAST page turns, the page that
//      draws the card's board. Not at her first frame (that put T81's "Toh is aayat ki chaudai kitni hai?" over the
//      previous square), and not at the hand-over (that left page 1's new board under the old, answered card). With an
//      answer chip, the old question, its chip and the verdict stay up through the verdict page. The hand-over still
//      promotes a queued card if the last page never turned (a dropped page, a missed anchor).
//      Assumption, pending Brain's confirmation: the new card belongs to the last page.
// (3b) While the board on screen is NOT the open card's board, the card collapses to a quiet "your question is waiting";
//      it comes back when the card's board is up again, or when she hands over. The signal is Brain's, not ours: a board
//      (or a page of a paged board) marked `ofCard: false`. Absent → today's behaviour: the card never collapses.

/** A page turn of a paged whiteboard script, as the server writes it (board-first.js pagesBoard `switches`). */
export interface PageSwitch { clause: number; atMs: number; ofCard?: boolean }

/** The board the card is judged against: the whiteboard script's `ofCard` for its first page, and each switch's for the page it starts. */
export interface CardBoard { ofCard?: boolean; switches?: readonly PageSwitch[] }

export type CardWhen = "now" | "lastPage" | "handover";

/**
 * When a new server ask takes the card.
 * - a paged board: at its last page (3a), with or without an answer chip;
 * - otherwise a verdict on the child's answer: at the hand-over (their answer keeps its mark while she speaks);
 * - otherwise at once.
 */
export function newAskWhen({ paged, verdict, hasAnswer }: { paged: boolean; verdict: boolean; hasAnswer: boolean }): CardWhen {
  if (paged) return "lastPage";
  if (verdict && hasAnswer) return "handover";
  return "now";
}

/** Is this board paged (two or more pages)? */
export const isPaged = (b: CardBoard | null | undefined): boolean => !!b?.switches?.length;

/**
 * The moment page `k` (1-based: switches[k-1]) turns, on her line's clock (ms after the line's anchor): the real onset of
 * its clause when the player has heard it, else the server's estimate. The same rule the board player uses
 * (src/modules/whiteboard/lineClock.ts), so the card turns with the board.
 */
export function pageTurnMs(sw: PageSwitch, clauseOnsets?: readonly (number | undefined)[]): number {
  const on = clauseOnsets?.[sw.clause];
  return typeof on === "number" && Number.isFinite(on) && on > 0 ? on : sw.atMs;
}

/** The page showing `ms` after the anchor: 0 before the first switch, k after the k-th. */
export function pageAt(b: CardBoard | null | undefined, ms: number, clauseOnsets?: readonly (number | undefined)[]): number {
  const sw = b?.switches ?? [];
  let p = 0;
  for (let k = 0; k < sw.length; k++) if (ms >= pageTurnMs(sw[k], clauseOnsets)) p = k + 1;
  return p;
}

/** The last page's index (0 for a one-page board). */
export const lastPage = (b: CardBoard | null | undefined): number => b?.switches?.length ?? 0;

/** Is page `p` the open card's board? true / false from Brain's flag; undefined when the wire does not say. */
export function pageOfCard(b: CardBoard | null | undefined, p: number): boolean | undefined {
  if (!b) return undefined;
  if (p <= 0) return b.ofCard;
  return b.switches?.[p - 1]?.ofCard;
}

/**
 * (3b) Should the card show "your question is waiting"? Only while an open question is pinned, the board on screen is
 * marked as not the card's, and she has not handed over. A card with the child's answer on it is resolved, not waiting.
 */
export function cardWaiting({ hasAsk, hasAnswer, ofCard, handedOver }: { hasAsk: boolean; hasAnswer: boolean; ofCard: boolean | undefined; handedOver: boolean }): boolean {
  return hasAsk && !hasAnswer && ofCard === false && !handedOver;
}

/** The card's state across a turn (useDesk's item, without the answer-chip details the card does not need here). */
export interface CardState<A, C> { ask: A | null; answer: C | null; nextAsk?: A | null; nextWhen?: "lastPage" | "handover" }

/** A new server ask arrives (a turn's ui.ask that differs from the pinned one). */
export function cardOnAsk<A, C, S extends CardState<A, C>>(it: S, ask: A, { paged, verdict }: { paged: boolean; verdict: boolean }): S {
  const when = newAskWhen({ paged, verdict, hasAnswer: !!it.answer });
  return when === "now" ? ({ ...it, ask, answer: null, nextAsk: null, nextWhen: undefined } as S) : ({ ...it, nextAsk: ask, nextWhen: when } as S);
}

/** The board turned to page `page` of a board whose last page is `last`: a card queued for the last page takes it. */
export function cardOnPage<A, C, S extends CardState<A, C>>(it: S, page: number, last: number): S {
  if (!it.nextAsk || it.nextWhen !== "lastPage" || last <= 0 || page < last) return it;
  return { ...it, ask: it.nextAsk, answer: null, nextAsk: null, nextWhen: undefined } as S;
}

/** The hand-over: any queued card takes it (a last page that never turned included). */
export function cardOnHandover<A, C, S extends CardState<A, C>>(it: S): S {
  return it.nextAsk ? ({ ...it, ask: it.nextAsk, answer: null, nextAsk: null, nextWhen: undefined } as S) : it;
}
