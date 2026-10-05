// beat-line@1 — Poem Beat (VALUES-100 V3.1: every English and Hindi poem topic, classes 4-7).
// A rhythm game for the poem's sound: lines ride a lane into a gate at the poem's tempo and the child taps the stressed
// beats (rhythm); a line's last word is missing and word-orbs fall: catch the word that RHYMES (sound, not spelling:
// kit misconception "rhyme = same letters"); for Hindi, syllables stream and the child marks each as लघु (1) or गुरु (2)
// while the मात्रा meter fills to the doha's 13 | 11 yati. Every key is computed from the spec by code:
//   beat  — tap times vs (lead + j·60/bpm), measured from the HOST's tap log (never the frame's claim)
//   rhyme — the catch vs the answer word
//   matra — each mark vs matraWeights(line) (shared/studio-spec-ext/common.ts), so the server re-derives the key
// `own: true` marks a practice line written in the poem's style (not a quote): the engine labels it on screen.
import { z } from "zod";
import { EnvelopeExt, MARKUP, SrcField, TargetsField, UNGRADED, arr, envelope, isObj, matraWeights, normText, num, oneOf, reqStr, src, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";

const BL_STRINGS = { round: "Round", onBeat: "on beat", combo: "combo", tap: "Tap on the beat", catch: "Catch the rhyme", mark: "Short or long?", short: "। short", long: "ऽ long", practice: "PRACTICE LINE", runDone: "Poem played", perfect: "ON BEAT", early: "early", late: "late", meter: "मात्रा" };
const Line = z.object({ text: z.string().min(1).max(52).refine((s) => !MARKUP.test(s)), beats: z.array(z.number().int().min(0).max(14)).min(2).max(6), own: z.boolean().optional() });
const BeatRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("beat"), title: z.string().min(1).max(22), sub: z.string().max(40), lines: z.array(z.number().int().min(0).max(7)).min(1).max(4) }),
  z.object({ mode: z.literal("rhyme"), title: z.string().min(1).max(22), sub: z.string().max(40), items: z.array(z.object({ cue: z.string().min(1).max(52), options: z.array(z.string().min(1).max(16)).min(2).max(3), answer: z.string().min(1).max(16), ...SrcField })).min(2).max(6), ...TargetsField }),
  z.object({ mode: z.literal("matra"), title: z.string().min(1).max(22), sub: z.string().max(40), lines: z.array(z.number().int().min(0).max(7)).min(1).max(2) }),
]);
export type BeatRoundT = z.infer<typeof BeatRound>;
export const BeatSchema = z.object({ archetype: z.literal("beat-line@1"), ...EnvelopeExt, strings: stringsSchema(BL_STRINGS, 40), title: z.string().min(1).max(36), bpm: z.number().min(56).max(104), lines: z.array(Line).min(1).max(8), rounds: z.array(BeatRound).min(1).max(3) });
export type BeatSpec = z.infer<typeof BeatSchema>;

// reviewed default: c6-english-ch02-t01 (kit: rhyming couplets AABB; pairs beak/seek, pride/eyed, joke/croak; i01, i02).
// The beat lines are PRACTICE lines in the poem's metre (own: true), not quotations.
const beatDefault: BeatSpec = {
  archetype: "beat-line@1", skills: ["c6-english-ch02-t01"], lang: "en", strings: { ...BL_STRINGS }, title: "The Raven and the Fox", bpm: 84,
  lines: [
    { text: "A raven sat high with a treat in his beak", beats: [1, 3, 6, 9], own: true },
    { text: "A fox came along with a favour to seek", beats: [1, 3, 6, 8], own: true },
  ],
  rounds: [
    { mode: "beat", title: "Feel the beat", sub: "four strong beats in every line", lines: [0, 1] },
    { mode: "rhyme", title: "Rhyme catch", sub: "rhymes are sounds, not spellings", targets: "c6-english-ch02-t01-m-rhyme-spelling", items: [
      { cue: "He held a fine morsel tight in his ____", options: ["beak", "break", "back"], answer: "beak", src: "c6-english-ch02-t01-i01" },
      { cue: "The raven was puffed up and full of his ____", options: ["pride", "prize", "pipe"], answer: "pride", src: "c6-english-ch02-t01-i02" },
      { cue: "He opened to sing, but out came a ____", options: ["croak", "crook", "cloak"], answer: "croak" },
    ] },
  ],
};
function line(l: unknown, r: string[]): BeatSpec["lines"][number] | null {
  if (!isObj(l)) { r.push("line"); return null; }
  const text = reqStr(l.text, 52, "line.text", r); if (!text) return null;
  const nW = text.split(/\s+/).length;
  const beats = [...new Set(arr(l.beats, "beats", r).filter((b): b is number => Number.isInteger(b) && (b as number) >= 0 && (b as number) < nW && (b as number) <= 14))].sort((a, b) => a - b).slice(0, 6);
  if (beats.length < 2) { r.push("line:beats"); return null; }
  return { text, beats, ...(l.own === true ? { own: true } : {}) };
}
function repairBeat(raw: Record<string, unknown>, r: string[]): BeatSpec | null {
  const env = envelope(raw, beatDefault, r);
  const lines = arr(raw.lines, "lines", r).slice(0, 8).map((l) => line(l, r));
  const keep = lines.map((l, i) => (l ? i : -1)).filter((i) => i >= 0), remap = new Map(keep.map((old, ni) => [old, ni]));
  const L = lines.filter((l): l is NonNullable<typeof l> => !!l);
  const rounds: BeatRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 3)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Round", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "" };
    const mode = oneOf(x.mode, ["beat", "rhyme", "matra"] as const, "beat", "mode", r);
    if (mode === "beat" || mode === "matra") {
      const ls = [...new Set(arr(x.lines, "round.lines", r).filter((i): i is number => Number.isInteger(i) && remap.has(i as number)).map((i) => remap.get(i)!))]
        .filter((i) => mode === "beat" || (/[ऀ-ॿ]/.test(L[i].text) && matraWeights(L[i].text).length >= 4 && matraWeights(L[i].text).length <= 26)).slice(0, mode === "beat" ? 4 : 2);
      if (ls.length) rounds.push({ mode, ...head, lines: ls } as BeatRoundT); else r.push("round:lines");
    } else {
      const items = arr(x.items, "items", r).slice(0, 6).map((it) => {
        if (!isObj(it)) return null;
        const cue = reqStr(it.cue, 52, "cue", r), answer = reqStr(it.answer, 16, "answer", r);
        const options = [...new Set(arr(it.options, "options", r).filter((o): o is string => typeof o === "string" && o.trim().length > 0 && o.length <= 16 && !MARKUP.test(o)).map((o) => o.trim()))].slice(0, 3);
        if (!cue || !answer || options.length < 2 || !options.some((o) => normText(o) === normText(answer))) { r.push("item:answer"); return null; }
        if (normText(cue).split(" ").includes(normText(answer))) { r.push("item:cue-shows-answer"); return null; }
        return { cue, options, answer, ...src(it.src, r) };
      }).filter((i): i is NonNullable<typeof i> => !!i);
      if (items.length >= 2) rounds.push({ mode: "rhyme", ...head, items, ...targets(x.targets, r) }); else r.push("round:items");
    }
  }
  if (!rounds.length || (!L.length && rounds.some((rd) => rd.mode !== "rhyme"))) return null;
  return { archetype: "beat-line@1", ...env, strings: strings(raw.strings, BL_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Poem Beat", bpm: num(raw.bpm, 56, 104, 80, "bpm", r), lines: L.length ? L : beatDefault.lines, rounds };
}
/** Seconds per stressed beat and the count-in lead, shared by engine and grader. */
export const beatTiming = (spec: BeatSpec) => ({ spb: 60 / spec.bpm * 2, lead: 2 * (60 / spec.bpm) * 2 });
function gradeBeat(spec: BeatSpec, itemId: string, value: unknown): Graded {
  let m = /^b(\d+):(\d+)$/.exec(itemId);
  if (m) {
    const ln = spec.lines[+m[1]], j = +m[2]; if (!ln || j >= ln.beats.length) return UNGRADED;
    const { spb, lead } = beatTiming(spec), want = (lead + j * spb) * 1000;
    const taps = (Array.isArray(isObj(value) ? value.taps : value) ? ((isObj(value) ? value.taps : value) as unknown[]) : []).filter((t): t is { line: number; ms: number } => isObj(t) && t.line === +m![1] && typeof t.ms === "number" && Number.isFinite(t.ms));
    if (taps.length > ln.beats.length * 3 + 2) return { verdict: "wrong", truth: Math.round(want), detail: "spam" };
    let best = Infinity, off = 0; for (const t of taps) { const d = Math.abs(t.ms - want); if (d < best) { best = d; off = t.ms - want; } }
    if (!Number.isFinite(best) || best > 420) return { verdict: "wrong", truth: Math.round(want), detail: "no-tap" };
    return { verdict: best <= 150 ? "right" : best <= 280 ? "partial" : "wrong", truth: Math.round(want), error: Math.round(off), detail: off < 0 ? "early" : "late" };
  }
  m = /^r(\d+):(\d+)$/.exec(itemId);
  if (m) {
    const rd = spec.rounds[+m[1] - 1]; if (!rd || rd.mode !== "rhyme") return UNGRADED;
    const it = rd.items[+m[2]]; if (!it) return UNGRADED;
    if (typeof value !== "string") return { verdict: "wrong", truth: it.answer, detail: "no-catch" };
    return { verdict: normText(value) === normText(it.answer) ? "right" : "wrong", truth: it.answer };
  }
  m = /^m(\d+):(\d+)$/.exec(itemId);
  if (m) {
    const ln = spec.lines[+m[1]]; if (!ln) return UNGRADED;
    const w = matraWeights(ln.text)[+m[2]]; if (!w) return UNGRADED;
    const v = value === 1 || value === "1" ? 1 : value === 2 || value === "2" ? 2 : null;
    if (v === null) return { verdict: "wrong", truth: w.w, detail: "no-mark" };
    return { verdict: v === w.w ? "right" : "wrong", truth: w.w, detail: w.syl };
  }
  return UNGRADED;
}
function keysBeat(spec: BeatSpec) {
  const out: { itemId: string; key: string; src?: string; prompt?: string }[] = [];
  spec.rounds.forEach((rd, k) => {
    if (rd.mode === "rhyme") rd.items.forEach((it, i) => out.push({ itemId: `r${k + 1}:${i}`, key: it.answer, prompt: `${it.cue} [${it.options.join(" / ")}]`, ...(it.src ? { src: it.src } : {}) }));
    if (rd.mode === "beat") for (const li of rd.lines) out.push({ itemId: `b${li}:*`, key: spec.lines[li].beats.map((b) => spec.lines[li].text.split(/\s+/)[b]).join(" · "), prompt: `stressed words in: ${spec.lines[li].text}` });
    if (rd.mode === "matra") for (const li of rd.lines) out.push({ itemId: `m${li}:*`, key: matraWeights(spec.lines[li].text).map((x) => x.w).join(""), prompt: `मात्रा: ${spec.lines[li].text}` });
  });
  return out;
}
export const beatDef: ExtSpecDef<BeatSpec> = {
  archetype: "beat-line@1", title: "Poem Beat", kind: "game", subjects: ["english", "hindi"],
  act: "tap the poem's stressed beats in time, catch the word that truly rhymes, and mark each Hindi syllable short or long as the metre fills",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["english", "hindi"], topics: ["c6-english-ch02-t01"], misconceptions: ["c6-english-ch02-t01-m-rhyme-spelling"] },
  schema: BeatSchema as unknown as z.ZodType<BeatSpec>, defaultSpec: beatDefault, repair: repairBeat, grade: gradeBeat, keys: keysBeat,
};
