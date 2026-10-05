// story-rail@1 — Story Rail (VALUES-100 V3.1, English / Hindi prose, SST cause chains, EVS processes).
// A train runs at speed along a line that forks ahead into 2-3 spurs; each spur holds a wagon (an event, an effect, a
// line of dialogue, a process stage). The child throws the switch before the train reaches the fork, so the train
// couples the RIGHT wagon. A wrong wagon couples, glows amber and is shunted off while the right one rolls in (the
// truth, shown). Modes:
//   sequence — what happens next (story events, process stages, historical steps); key = the given order
//   cause    — which effect follows this cause (cause wagon at the head, effect wagons at the fork)
//   who      — which character said / did this (speech wagon at the head, character stations at the fork)
// The pick is graded by the host from the spec: r{round}:{step} → the chosen wagon id.
import { z } from "zod";
import { EnvelopeExt, SrcField, TargetsField, UNGRADED, arr, envelope, idOk, isObj, num, oneOf, reqStr, src, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";
import { GLYPHS, type Glyph } from "./scene.ts";

const RL_STRINGS = { round: "Round", picked: "coupled", streak: "streak", next: "What happens next?", effect: "What does this lead to?", who: "Who said this?", runDone: "Line complete", order: "your train", right: "Coupled", wrong: "Not this one", coach: "Tap a wagon before the train reaches the fork" };
const Card = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,16}$/), text: z.string().min(1).max(30), glyph: z.enum(GLYPHS).optional(), ...SrcField });
const RailRound = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("sequence"), title: z.string().min(1).max(22), sub: z.string().max(40), cards: z.array(Card).min(3).max(7), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
  z.object({ mode: z.literal("cause"), title: z.string().min(1).max(22), sub: z.string().max(40), pairs: z.array(z.object({ cause: Card, effect: Card })).min(2).max(5), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
  z.object({ mode: z.literal("who"), title: z.string().min(1).max(22), sub: z.string().max(40), speakers: z.array(z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,16}$/), name: z.string().min(1).max(14), glyph: z.enum(GLYPHS).optional() })).min(2).max(3),
    lines: z.array(z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,16}$/), text: z.string().min(1).max(30), speaker: z.string(), ...SrcField })).min(2).max(6), speed: z.number().min(0.6).max(1.5), ...TargetsField }),
]);
export type RailRoundT = z.infer<typeof RailRound>;
export const RailSchema = z.object({ archetype: z.literal("story-rail@1"), ...EnvelopeExt, strings: stringsSchema(RL_STRINGS, 56), title: z.string().min(1).max(36), rounds: z.array(RailRound).min(1).max(4) });
export type RailSpec = z.infer<typeof RailSchema>;

// reviewed default: c6-english-ch02-t01 "The Raven and the Fox" (kit-seeded: expectations + items i04, i05, i06)
const railDefault: RailSpec = {
  archetype: "story-rail@1", skills: ["c6-english-ch02-t01"], lang: "en", strings: { ...RL_STRINGS }, title: "The Raven and the Fox",
  rounds: [
    { mode: "sequence", title: "The story", sub: "couple the events in order", speed: 0.9, targets: "c6-english-ch02-t01-m-praise-equals-flattery", cards: [
      { id: "e1", text: "Raven perches with a morsel", glyph: "bird" },
      { id: "e2", text: "Fox praises his feathers", glyph: "eye" },
      { id: "e3", text: "Fox begs him to sing", glyph: "music" },
      { id: "e4", text: "Raven opens his beak", glyph: "bird" },
      { id: "e5", text: "The morsel falls", glyph: "drop" },
      { id: "e6", text: "Fox runs off with it", glyph: "wind" },
    ] },
    { mode: "cause", title: "Because", sub: "match each cause to what it led to", speed: 0.85, pairs: [
      { cause: { id: "c1", text: "Fox wants the food" }, effect: { id: "f1", text: "He flatters the raven", src: "c6-english-ch02-t01-i05" } },
      { cause: { id: "c2", text: "Raven believes the praise" }, effect: { id: "f2", text: "He tries to sing" } },
      { cause: { id: "c3", text: "Raven croaks aloud" }, effect: { id: "f3", text: "The morsel drops" } },
    ] },
    { mode: "who", title: "Who said it?", sub: "send each line to its speaker", speed: 0.85, speakers: [{ id: "fox", name: "Fox", glyph: "eye" }, { id: "raven", name: "Raven", glyph: "bird" }],
      lines: [
        { id: "w1", text: "What a fine bird you are!", speaker: "fox" },
        { id: "w2", text: "Caw!", speaker: "raven" },
        { id: "w3", text: "Sing for me, Sir King", speaker: "fox" },
      ] },
  ],
};
function card(c: unknown, r: string[], ids: Set<string>): z.infer<typeof Card> | null {
  if (!isObj(c) || !idOk(c.id) || ids.has(c.id)) { r.push("card:id"); return null; }
  const text = reqStr(c.text, 30, "card.text", r); if (!text) return null;
  ids.add(c.id);
  const g = c.glyph !== undefined && (GLYPHS as readonly string[]).includes(c.glyph as string) ? { glyph: c.glyph as Glyph } : (c.glyph !== undefined && r.push("glyph"), {});
  return { id: c.id, text, ...g, ...src(c.src, r) };
}
function repairRail(raw: Record<string, unknown>, r: string[]): RailSpec | null {
  const env = envelope(raw, railDefault, r);
  const rounds: RailRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 4)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const ids = new Set<string>();
    const head = { title: reqStr(x.title, 22, "round.title", r) ?? "Next stop", sub: typeof x.sub === "string" && x.sub.length <= 40 ? x.sub : "", speed: num(x.speed, 0.6, 1.5, 0.9, "speed", r), ...targets(x.targets, r) };
    const mode = oneOf(x.mode, ["sequence", "cause", "who"] as const, "sequence", "mode", r);
    if (mode === "sequence") {
      const cards = arr(x.cards, "cards", r).slice(0, 7).map((c) => card(c, r, ids)).filter((c): c is NonNullable<typeof c> => !!c);
      if (cards.length >= 3) rounds.push({ mode, ...head, cards }); else r.push("round:too-few-cards");
    } else if (mode === "cause") {
      const pairs = arr(x.pairs, "pairs", r).slice(0, 5).map((p) => { if (!isObj(p)) return null; const c = card(p.cause, r, ids), e = card(p.effect, r, ids); return c && e ? { cause: c, effect: e } : null; }).filter((p): p is NonNullable<typeof p> => !!p);
      if (pairs.length >= 2) rounds.push({ mode, ...head, pairs }); else r.push("round:too-few-pairs");
    } else {
      const speakers = arr(x.speakers, "speakers", r).slice(0, 3).map((s) => { if (!isObj(s) || !idOk(s.id) || ids.has(s.id)) return null; const name = reqStr(s.name, 14, "speaker.name", r); if (!name) return null; ids.add(s.id); const g = typeof s.glyph === "string" && (GLYPHS as readonly string[]).includes(s.glyph) ? { glyph: s.glyph as Glyph } : {}; return { id: s.id, name, ...g }; }).filter((s): s is NonNullable<typeof s> => !!s);
      const sp = new Set(speakers.map((s) => s.id));
      const lines = arr(x.lines, "lines", r).slice(0, 6).map((l) => { if (!isObj(l) || typeof l.speaker !== "string" || !sp.has(l.speaker)) { r.push("line:speaker"); return null; } const c = card(l, r, ids); return c ? { id: c.id, text: c.text, speaker: l.speaker, ...(c.src ? { src: c.src } : {}) } : null; }).filter((l): l is NonNullable<typeof l> => !!l);
      if (speakers.length >= 2 && lines.length >= 2) rounds.push({ mode, ...head, speakers, lines }); else r.push("round:who");
    }
  }
  if (!rounds.length) return null;
  return { archetype: "story-rail@1", ...env, strings: strings(raw.strings, RL_STRINGS, 56, r), title: reqStr(raw.title, 36, "title", r) ?? "Story Rail", rounds };
}
/** Steps of a round: what the head shows and which ids stand at the fork (the key first; the engine shuffles lanes). */
export function railSteps(rd: RailRoundT): { head: string | null; key: string; options: string[] }[] {
  if (rd.mode === "sequence") return rd.cards.slice(1).map((c, i) => {
    const later = rd.cards.slice(i + 2, i + 4).map((x) => x.id);
    const decoys = later.length ? later : [rd.cards[Math.max(0, i - 1)].id];
    return { head: rd.cards[i].id, key: c.id, options: [...new Set([c.id, ...decoys])] };
  });
  if (rd.mode === "cause") return rd.pairs.map((p, i) => ({ head: p.cause.id, key: p.effect.id, options: [p.effect.id, ...rd.pairs.filter((_, j) => j !== i).slice(0, 2).map((q) => q.effect.id)] }));
  return rd.lines.map((l) => ({ head: l.id, key: l.speaker, options: rd.speakers.map((s) => s.id) }));
}
function gradeRail(spec: RailSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):(\d+)$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; if (!rd) return UNGRADED;
  const st = railSteps(rd)[+m[2]]; if (!st) return UNGRADED;
  if (typeof value !== "string") return { verdict: "wrong", truth: st.key, detail: "no-pick" };
  return { verdict: value === st.key ? "right" : "wrong", truth: st.key, ...(value !== st.key && st.options.includes(value) ? {} : value !== st.key ? { detail: "not-offered" } : {}) };
}
function keysRail(spec: RailSpec) {
  const out: { itemId: string; key: string; src?: string; prompt?: string }[] = [];
  spec.rounds.forEach((rd, k) => {
    const txt = (id: string) => rd.mode === "sequence" ? rd.cards.find((c) => c.id === id)?.text ?? id : rd.mode === "cause" ? [...rd.pairs.map((p) => p.cause), ...rd.pairs.map((p) => p.effect)].find((c) => c.id === id)?.text ?? id : rd.lines.find((l) => l.id === id)?.text ?? rd.speakers.find((s) => s.id === id)?.name ?? id;
    railSteps(rd).forEach((s, i) => {
      const srcOf = rd.mode === "sequence" ? rd.cards.find((c) => c.id === s.key)?.src : rd.mode === "cause" ? rd.pairs.find((p) => p.effect.id === s.key)?.effect.src : rd.lines.find((l) => l.id === s.head)?.src;
      out.push({ itemId: `r${k + 1}:${i}`, key: txt(s.key), prompt: `${rd.mode}: after/for "${s.head ? txt(s.head) : ""}"`, ...(srcOf ? { src: srcOf } : {}) });
    });
  });
  return out;
}
export const railDef: ExtSpecDef<RailSpec> = {
  archetype: "story-rail@1", title: "Story Rail", kind: "game", subjects: ["english", "hindi", "sst", "evs", "science"],
  act: "throw the switch under time so the train couples the right next event, the right effect of a cause, or the line's real speaker",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["english", "hindi", "sst", "evs", "science"], topics: ["c6-english-ch02-t01"], misconceptions: ["c6-english-ch02-t01-m-praise-equals-flattery"] },
  schema: RailSchema as unknown as z.ZodType<RailSpec>, defaultSpec: railDefault, repair: repairRail, grade: gradeRail, keys: keysRail,
};
