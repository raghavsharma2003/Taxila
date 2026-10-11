// The owner's flag (release 12, tier 2 only): "Flag this moment" in the lesson's ⋯ menu stamps flag.owner at once (the
// moment, the route, what the Desk showed); an optional note follows as flag.note pointing at the same flag. The owner
// can then say "my flag at 7:37" and main finds it (scripts/trace.mjs --flags). Notes are masked like every other value.
import { emit, flush, stats } from "./bus.ts";

let flags = 0;
/** Stamp the moment now; returns the flag's number in this page (for the note). */
export function flagMoment(context: Record<string, unknown> = {}): number {
  const n = ++flags;
  try {
    const d = new Date();
    emit("flag.owner", { n, at: d.toISOString(), clock: d.toTimeString().slice(0, 8), path: location.pathname, ...context }, { tier: 2 });
    void flush();
  } catch { /* the lesson goes on */ }
  return n;
}
export function flagNote(n: number, note: string): void {
  try {
    const text = note.trim();
    if (text) { emit("flag.note", { n, note: text.slice(0, 1000) }, { tier: 2 }); void flush(); }
  } catch { /* the lesson goes on */ }
}
export const flagStats = () => ({ flags, ...stats() });
