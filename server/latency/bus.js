// Round 3, stream relational-human: the PERCEPTION BUS. One place where the turn's perceive stage (server/brain/turn.js,
// patch 01) and the turn prefetch (server/latency/routes.js) say "classify is running on these words", so that the
// acknowledgement route (POST /api/lesson/turn-ack) can hear the child's answer back the moment the model distress read is
// in — WITHOUT a model call of its own. The ack never starts a classify: it only waits on one the turn or the prefetch
// already started (zero extra quota on the maxed deployments, docs/ops/MODEL-STACK.md).
//
// Per process, like the prefetch store and the TTS prewarm (production runs one web replica: w1d-web-single-replica). On
// another replica the ack route finds nothing and answers 204: the child hears the reply as before, never an error.
//
// An entry: { lessonId, text, clsP, at, source: "prefetch" | "turn", turn, pendingSafety }. `text` is the child's words byte
// for byte (trimmed): the ack echoes only words whose distress read is the one being waited on.

const TTL_MS = 20_000;
const MAX_LESSONS = 5000;
/** lessonId → entries (newest last, at most 4: a child who pauses mid-thought re-sends as the words grow). */
const byLesson = new Map();
/** lessonId → Set of waiters ({ text, resolve }) */
const waiters = new Map();

const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

function sweep(now) {
  for (const [id, list] of byLesson) {
    const keep = list.filter((e) => now - e.at < TTL_MS);
    if (keep.length) byLesson.set(id, keep); else byLesson.delete(id);
  }
  while (byLesson.size > MAX_LESSONS) byLesson.delete(byLesson.keys().next().value);
}

/**
 * Say that classify is running on `text` for this lesson. Never throws; the promise is never awaited here.
 * @param {string} lessonId
 * @param {{ text: string, clsP: Promise<any>, source: "prefetch" | "turn", turn?: number, pendingSafety?: boolean, specs?: Promise<any>[] }} p
 */
export function publishPerception(lessonId, p, nowMs = Date.now()) {
  try {
    const text = norm(p?.text);
    if (!lessonId || !text || !p?.clsP) return;
    p.clsP.catch?.(() => {});
    sweep(nowMs);
    const k = String(lessonId);
    const e = { lessonId: k, text, clsP: p.clsP, at: nowMs, source: p.source === "turn" ? "turn" : "prefetch", turn: Number(p.turn) || null, pendingSafety: !!p.pendingSafety, filtered: false };
    // a speculative reply on these words blocked by the content filter: the turn will fail CLOSED (a safeguard), so no echo
    // may precede it (measured 2026-10-09, load-after-1 L1 turn 7: the echo played, then the reply was filter-blocked)
    for (const sp of Array.isArray(p.specs) ? p.specs : []) {
      Promise.resolve(sp).then((x) => Promise.resolve(x?.result)).then((r) => { if (r?.filtered) e.filtered = true; }, () => {});
    }
    const list = (byLesson.get(k) ?? []).filter((x) => !(x.text === text && x.source === e.source));
    list.push(e);
    byLesson.set(k, list.slice(-4));
    for (const w of [...(waiters.get(k) ?? [])]) if (w.text === text && sameTurn(e, w.turn)) { waiters.get(k)?.delete(w); w.resolve(e); }
  } catch { /* the bus never breaks a turn */ }
}

/**
 * The perceptions for exactly these words (newest first): the turn's own wins over a prefetch's (it is what the turn
 * commits), and a turn entry's sticky duplex safety bit is OR-ed in by the caller.
 */
export function perceptionsFor(lessonId, text, nowMs = Date.now(), turn = null) {
  const t = norm(text);
  return (byLesson.get(String(lessonId)) ?? []).filter((e) => e.text === t && nowMs - e.at < TTL_MS && sameTurn(e, turn)).reverse();
}
/** The same words said again on a LATER turn ("do fingers." twice) are a new answer with a new classify: an entry of
 *  another turn never stands in (measured: ack-leak run A answer 25 was decided in 0 ms on the previous turn's classify). */
const sameTurn = (e, turn) => turn == null || e.turn == null || e.turn === Number(turn);

/**
 * Wait up to `ms` for a perception of these words (resolves at once if one exists). Resolves null on timeout.
 * @returns {Promise<null | { lessonId: string, text: string, clsP: Promise<any>, at: number, source: string, turn: number|null, pendingSafety: boolean }>}
 */
export function awaitPerception(lessonId, text, ms, turn = null) {
  const have = perceptionsFor(lessonId, text, Date.now(), turn);
  if (have.length) return Promise.resolve(have[0]);
  const k = String(lessonId);
  return new Promise((resolve) => {
    const w = { text: norm(text), turn, resolve: (e) => { clearTimeout(timer); resolve(e); } };
    const timer = setTimeout(() => { waiters.get(k)?.delete(w); if (!waiters.get(k)?.size) waiters.delete(k); resolve(null); }, Math.max(0, ms));
    if (!waiters.has(k)) waiters.set(k, new Set());
    waiters.get(k).add(w);
  });
}

/** Tests only. */
export const __bus = { clear() { byLesson.clear(); waiters.clear(); }, size: () => byLesson.size, TTL_MS };
