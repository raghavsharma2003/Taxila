// The whiteboard's anchor: the first audio sample of the teacher's spoken line (WhiteboardScript.anchor =
// "line_audio_start"). A script's times are ms from that moment, so the drawing follows HER VOICE whatever the lane's
// latency. Whoever starts playing her line calls markLineAudioStart (the cascade's TTS player and the realtime lane's
// first audio delta: W2-G / W2-D, open item w2b-line-audio-anchor); a renderer that hears no anchor within its grace
// starts on its own clock, so a missing call degrades to "draws as it appears", never to "never draws".
export interface LineAnchor { lessonId?: string; teacherReplySeq?: number; at: number }

const EVENT = "taxila:line-audio-start";
let last: LineAnchor | null = null;

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Her line's first audio sample is playing now (or at `at`, a performance.now() time). */
export function markLineAudioStart(line: { lessonId?: string; teacherReplySeq?: number } = {}, at: number = now()): void {
  last = { ...line, at };
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent<LineAnchor>(EVENT, { detail: last }));
  }
}

const matches = (a: LineAnchor, line: { lessonId?: string; teacherReplySeq?: number }) =>
  (!line.lessonId || !a.lessonId || a.lessonId === line.lessonId)
  && (line.teacherReplySeq === undefined || a.teacherReplySeq === undefined || a.teacherReplySeq === line.teacherReplySeq);

/**
 * Resolve the anchor for a script's line: an anchor that already fired for it within `recentMs` before `since`, else the
 * next one to fire, else `since + graceMs`. Calls `onAnchor(at)` exactly once; returns a cancel function.
 */
export function awaitLineAnchor(line: { lessonId?: string; teacherReplySeq?: number }, onAnchor: (at: number) => void,
  { since = now(), graceMs = 1200, recentMs = 2500 }: { since?: number; graceMs?: number; recentMs?: number } = {}): () => void {
  if (last && matches(last, line) && last.at >= since - recentMs && last.at <= now()) {
    onAnchor(last.at);
    return () => {};
  }
  let done = false;
  const fire = (at: number) => {
    if (done) return;
    done = true;
    cleanup();
    onAnchor(at);
  };
  const onEvent = (e: Event) => {
    const d = (e as CustomEvent<LineAnchor>).detail;
    if (d && matches(d, line)) fire(d.at);
  };
  const timer = setTimeout(() => fire(since + graceMs), Math.max(0, since + graceMs - now()));
  if (typeof window !== "undefined") window.addEventListener(EVENT, onEvent);
  function cleanup() {
    clearTimeout(timer);
    if (typeof window !== "undefined") window.removeEventListener(EVENT, onEvent);
  }
  return () => { done = true; cleanup(); };
}
