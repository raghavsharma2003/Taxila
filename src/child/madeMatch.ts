// Pure helpers for the Notebook's "Made for you" shelf (APP-01, APP-02): kept out of the .tsx so Node tests can run them.

export interface MadeLike { id: string; intentId?: string | null; replay: unknown | null }

/** The card a ?made=<id> link opens. The Home's and the end screen's links carry the plan's id, which the server builds
 *  from the piece's intent id (server/reports/madeFor.js); a card's own `id` is the studio_mount row. Match both. */
export function findPlaying<T extends MadeLike>(cards: T[], open: string | null): T | null {
  if (!open) return null;
  return cards.find((c) => (c.id === open || c.intentId === open) && c.replay) ?? null;
}

export interface PageLike<S> { lessonId: string; topic: string; summary: S | null; topicId?: string | null }
export interface SummaryLike { title?: string | null; shortTitle?: string | null }

/** The late summaries read: patch each summary onto the page already shown, by lesson id, and touch nothing else
 *  (the server's boards, first board and Replay stay). A page the server named keeps the server's title. */
export function patchSummaries<S extends SummaryLike, P extends PageLike<S>>(pages: P[] | null, cache: Record<string, S | undefined>): P[] {
  return (pages ?? []).map((p) => {
    const sum = cache[p.lessonId];
    if (!sum || p.summary) return p;
    return { ...p, summary: sum, topic: p.topicId ? p.topic : sum.shortTitle ?? sum.title ?? p.topic };
  });
}
