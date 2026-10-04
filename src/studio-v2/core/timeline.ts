// Deterministic narration-locked timeline for explainer archetypes (QB-A2, QB-A8): every property is a pure function
// of time, so "show again", "slower" and seek are exact. Cues are clause-anchored ("sN" = start of sentence N,
// "end", or seconds) with a 400 ms pre-roll, against MEASURED narration timing when the host has it, else an
// estimate at 141 wpm. Verbs are a closed list per engine; an unknown verb or prop is dropped, never drawn.
import { estimateLine, type BeatT, type NarrationLine } from "../../../shared/studio-spec.ts";
import { clamp, easeOf, lerp, type Ease } from "./math.ts";

export const PRE_ROLL = 0.4;
export interface Seg { t0: number; t1: number; to: number; ease: Ease }
export interface Chunk { text: string; t0: number; t1: number }
export interface TLLine { id: string; start: number; dur: number; chunks: Chunk[] }
export interface Timeline { tracks: Record<string, Seg[]>; lines: TLLine[]; total: number; interactiveAt: number; repairs: string[] }
export interface VerbMap { [verb: string]: { prop: string; key: string; min?: number; max?: number; ease?: string } }
export interface TimelineConfig { init: Record<string, number>; showable: string[]; labels: string[]; verbs: VerbMap }

export function chunksOf(ln: NarrationLine): { dur: number; chunks: Chunk[] } {
  const parts = ln.text.split(/(?<=[.?!:])\s+/).filter(Boolean);
  const s0 = ln.lead, s1 = ln.dur - ln.tail, total = parts.reduce((a, p) => a + p.length, 0) || 1;
  const out: Chunk[] = [];
  let acc = 0;
  for (let i = 0; i < parts.length; i++) {
    let t0 = s0 + (acc / total) * (s1 - s0);
    if (i > 0 && ln.pauses.length) {             // snap the boundary to the nearest real pause end (within 0.7 s)
      let best: { d: number; t: number } | null = null;
      for (const p of ln.pauses) { const d = Math.abs(p[1] - t0); if (d < 0.7 && (!best || d < best.d)) best = { d, t: p[1] }; }
      if (best) t0 = best.t;
    }
    out.push({ text: parts[i], t0, t1: 0 }); acc += parts[i].length;
  }
  for (let i = 0; i < out.length; i++) out[i].t1 = i + 1 < out.length ? out[i + 1].t0 : s1;
  return { dur: ln.dur, chunks: out };
}
export function lineTiming(id: string, text: Record<string, string>, narration: Record<string, NarrationLine>, pace = 1): NarrationLine {
  const n = narration[id];
  const base = n ?? estimateLine(text[id] ?? "");
  if (pace === 1) return base;
  return { ...base, dur: base.dur / pace, lead: base.lead / pace, tail: base.tail / pace, pauses: base.pauses.map(([a, b]) => [a / pace, b / pace] as [number, number]) };
}
export function compileTimeline(beats: BeatT[], text: Record<string, string>, narration: Record<string, NarrationLine>, cfg: TimelineConfig, pace = 1): Timeline {
  const repairs: string[] = [];
  const tracks: Record<string, Seg[]> = {};
  for (const k in cfg.init) tracks[k] = [];
  const lines: TLLine[] = [];
  let t = 0.8, interactiveAt: number | null = null;
  for (const b of beats) {
    const timing = lineTiming(b.line, text, narration, pace);
    if (!timing.text) { repairs.push("line:" + b.line); continue; }
    const c = chunksOf(timing), start = t;
    lines.push({ id: b.line, start, dur: c.dur, chunks: c.chunks });
    for (const cue of b.cues) {
      let off = 0;
      if (typeof cue.at === "number") off = clamp(cue.at / pace, 0, c.dur);
      else if (/^s\d+$/.test(cue.at)) { const k = +cue.at.slice(1) - 1; off = c.chunks[k] ? c.chunks[k].t0 : 0; }
      else if (cue.at === "end") off = c.dur;
      const at = Math.max(0, start + off - PRE_ROLL);
      const dur = clamp((typeof cue.dur === "number" ? cue.dur : 0.8) / pace, 0, 12);
      if (cue.do === "interactive") { interactiveAt = Math.max(interactiveAt ?? 0, at + PRE_ROLL); continue; }
      addCue(tracks, cfg, cue as Record<string, unknown>, at, dur, repairs);
    }
    t = start + c.dur + clamp(b.gap / pace, 0, 3);
  }
  for (const k in tracks) tracks[k].sort((a, b) => a.t0 - b.t0);
  return { tracks, lines, total: t, interactiveAt: interactiveAt ?? t, repairs };
}
function addCue(tracks: Record<string, Seg[]>, cfg: TimelineConfig, cue: Record<string, unknown>, at: number, dur: number, repairs: string[]): void {
  const seg = (prop: string, to: number, e?: unknown, fallback = "inOutCubic") => {
    if (!(prop in tracks) || !Number.isFinite(to)) { repairs.push("prop:" + prop); return; }
    tracks[prop].push({ t0: at, t1: at + dur, to, ease: easeOf(e ?? cue.ease, fallback as "inOutCubic") });
  };
  const verb = String(cue.do);
  if (verb === "show" || verb === "hide") {
    const v = verb === "show" ? 1 : 0;
    for (const tg of ([] as unknown[]).concat(cue.target ?? [])) {
      const name = String(tg);
      if (cfg.showable.includes(name)) seg(name + ".a", v, cue.ease, "outCubic");
      else if (name.startsWith("lbl.") && cfg.labels.includes(name.slice(4))) seg(name, v, cue.ease, "outCubic");
      else repairs.push("target:" + name);
    }
    return;
  }
  if (verb === "set") { seg(String(cue.prop), Number(cue.to)); return; }
  if (verb === "camera") { for (const k of ["zoom", "x", "y"]) if (cue[k] != null) seg("cam." + k, Number(cue[k])); return; }
  const m = cfg.verbs[verb];
  if (!m) { repairs.push("verb:" + verb); return; }
  let v = Number(cue[m.key]);
  if (!Number.isFinite(v)) { repairs.push("value:" + verb); return; }
  if (m.min != null || m.max != null) v = clamp(v, m.min ?? -Infinity, m.max ?? Infinity);
  seg(m.prop, v, cue.ease ?? m.ease);
}
export function valueAt(tl: Timeline, init: Record<string, number>, prop: string, t: number): number {
  let v = init[prop] ?? 0;
  const segs = tl.tracks[prop];
  if (!segs) return v;
  for (const s of segs) {
    if (t < s.t0) break;
    const from = v;
    if (t >= s.t1 || s.t1 <= s.t0) v = s.to;
    else { v = lerp(from, s.to, s.ease((t - s.t0) / (s.t1 - s.t0))); break; }
  }
  return v;
}
export function captionAt(tl: Timeline, t: number): string {
  let cap = "";
  for (const ln of tl.lines) {
    if (t < ln.start || t > ln.start + ln.dur + 0.25) continue;
    const lt = t - ln.start;
    for (const c of ln.chunks) if (lt >= c.t0 - 0.05 && lt < c.t1 + 0.25) cap = c.text;
  }
  return cap;
}
/** A playback clock with seek, pause and the narration hand-off (one `say` per line start). */
export class Playhead {
  t = 0; playing = false; mode: "timeline" | "interactive" | "final" = "timeline"; private next = 0;
  constructor(public tl: Timeline, private onSay: (id: string) => void, start = 0) { this.seek(start); }
  play(): void { this.playing = true; }
  pause(): void { this.playing = false; }
  seek(t: number): void { this.t = clamp(t, 0, this.tl.interactiveAt); this.next = this.tl.lines.findIndex((l) => l.start >= this.t - 1e-6); if (this.next < 0) this.next = this.tl.lines.length; }
  step(dt: number): boolean {
    if (!this.playing || this.mode !== "timeline") return false;
    this.t += dt;
    while (this.next < this.tl.lines.length && this.t >= this.tl.lines[this.next].start) { this.onSay(this.tl.lines[this.next].id); this.next++; }
    if (this.t >= this.tl.interactiveAt) { this.t = this.tl.interactiveAt; this.mode = "interactive"; return true; }
    return false;
  }
  get frac(): number { return clamp(this.t / Math.max(0.1, this.tl.interactiveAt), 0, 1); }
  get marks(): number[] { return this.tl.lines.map((l) => l.start / Math.max(0.1, this.tl.interactiveAt)); }
}
