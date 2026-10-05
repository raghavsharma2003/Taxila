// sort-storm@1 — Test Bench Sort (VALUES-100 V3.1: properties of materials, living things, resources, waste, food,
// tiers of government ... any topic whose act is "test it, then classify it").
// Items roll off a conveyor onto a test pad one at a time; the clock is the belt. The child may run TOOLS on the item
// (magnet, torch, water tank, circuit tester, flame, iodine drop) and the engine shows the property physically; then
// flicks the item into a bin. A wrong bin shows why (the test runs itself). Honesty rule: when a round is sorted BY a
// property (`byProp`), the key is DERIVED from the item's props, so the bin the child is graded against always agrees
// with what the tools show. Item props are cross-checked against the kit by the catalogue pipeline.
import { z } from "zod";
import { EnvelopeExt, MARKUP, SrcField, TargetsField, UNGRADED, arr, envelope, idOk, isObj, num, oneOf, reqStr, src, strings, stringsSchema, targets, type ExtSpecDef, type Graded } from "./common.ts";
import { GLYPHS, type Glyph } from "./scene.ts";

export const TOOLS = ["magnet", "torch", "tank", "tester", "flame", "iodine", "paper", "biuret", "turmeric", "litmus", "rose"] as const;
export type Tool = typeof TOOLS[number];
export const PROP_OF: Record<Tool, string> = { magnet: "magnetic", torch: "light", tank: "floats", tester: "conducts", flame: "burns", iodine: "starch", paper: "fat", biuret: "protein", turmeric: "acidity", litmus: "acidity", rose: "acidity" };
export const PROP_VALUES: Record<string, readonly string[]> = { magnetic: ["yes", "no"], light: ["transparent", "translucent", "opaque"], floats: ["yes", "no"], conducts: ["yes", "no"], burns: ["yes", "no"], starch: ["yes", "no"], fat: ["yes", "no"], protein: ["yes", "no"], acidity: ["acid", "base", "neutral"] };
export const BY_PROPS = ["magnetic", "light", "floats", "conducts", "burns", "starch", "fat", "protein", "acidity"] as const;
const SS_STRINGS = { round: "Round", sorted: "sorted", tests: "tests", coach: "Test it, then drag it into a bin", runDone: "Belt cleared", missed: "missed", why: "because", yes: "yes", no: "no", magnetic: "magnetic", light: "light", floats: "floats", conducts: "conducts", burns: "burns", starch: "starch", tMagnet: "Magnet", tTorch: "Torch", tTank: "Water", tTester: "Circuit", tFlame: "Flame", tIodine: "Iodine", tPaper: "Paper", tBiuret: "Copper test", tTurmeric: "Turmeric", tLitmus: "Litmus", tRose: "China rose", fat: "fat", protein: "protein", acidity: "acidity", acid: "acid", base: "base", neutral: "neutral" };
const Item = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,16}$/), text: z.string().min(1).max(16), glyph: z.enum(GLYPHS).optional(), bin: z.string(), props: z.record(z.string(), z.string()).optional(), ...SrcField });
const SortRound = z.object({
  title: z.string().min(1).max(22), sub: z.string().max(40), byProp: z.enum(BY_PROPS).optional(),
  bins: z.array(z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,16}$/), label: z.string().min(1).max(14), glyph: z.enum(GLYPHS).optional() })).min(2).max(4),
  tools: z.array(z.enum(TOOLS)).max(3), items: z.array(Item).min(3).max(12), speed: z.number().min(0.6).max(1.5), ...TargetsField,
});
export type SortRoundT = z.infer<typeof SortRound>;
export const SortSchema = z.object({ archetype: z.literal("sort-storm@1"), ...EnvelopeExt, strings: stringsSchema(SS_STRINGS, 40), title: z.string().min(1).max(36), rounds: z.array(SortRound).min(1).max(3) });
export type SortSpec = z.infer<typeof SortSchema>;

// reviewed default: c6-science-ch04-t01 magnetic materials (NCERT class 6: iron, nickel and cobalt are attracted;
// aluminium, copper, brass, plastic, wood, glass, rubber are not). Kit misconception: "all metals are magnetic".
const sortDefault: SortSpec = {
  archetype: "sort-storm@1", skills: ["c6-science-ch04-t01"], lang: "en", strings: { ...SS_STRINGS }, title: "Magnet or not?",
  rounds: [{ title: "Magnet test", sub: "not every metal sticks", byProp: "magnetic", tools: ["magnet"], speed: 0.9, targets: "c6-science-ch04-t01-m1",
    bins: [{ id: "yes", label: "Attracted", glyph: "magnet" }, { id: "no", label: "Not attracted" }],
    items: [
      { id: "nail", text: "Iron nail", glyph: "pen", bin: "yes", props: { magnetic: "yes" } },
      { id: "foil", text: "Aluminium foil", bin: "no", props: { magnetic: "no" } },
      { id: "coin", text: "Copper wire", glyph: "coin", bin: "no", props: { magnetic: "no" } },
      { id: "pin", text: "Iron safety pin", bin: "yes", props: { magnetic: "yes" } },
      { id: "rubber", text: "Rubber band", bin: "no", props: { magnetic: "no" } },
      { id: "nickel", text: "Nickel strip", bin: "yes", props: { magnetic: "yes" } },
      { id: "brass", text: "Brass key", bin: "no", props: { magnetic: "no" } },
      { id: "glass", text: "Glass marble", bin: "no", props: { magnetic: "no" } },
    ] }],
};
function repairSort(raw: Record<string, unknown>, r: string[]): SortSpec | null {
  const env = envelope(raw, sortDefault, r);
  const rounds: SortRoundT[] = [];
  for (const x of arr(raw.rounds, "rounds", r).slice(0, 3)) {
    if (!isObj(x)) { r.push("round"); continue; }
    const byProp = x.byProp === undefined ? undefined : oneOf(x.byProp, BY_PROPS, "magnetic", "byProp", r);
    const bins = arr(x.bins, "bins", r).slice(0, 4).map((b) => { if (!isObj(b) || !idOk(b.id)) return null; const label = reqStr(b.label, 14, "bin.label", r); if (!label) return null; const gl = typeof b.glyph === "string" && (GLYPHS as readonly string[]).includes(b.glyph) ? { glyph: b.glyph as Glyph } : {}; return { id: b.id, label, ...gl }; }).filter((b): b is NonNullable<typeof b> => !!b);
    const binIds = new Set(bins.map((b) => b.id));
    if (bins.length < 2 || binIds.size !== bins.length) { r.push("round:bins"); continue; }
    if (byProp && ![...binIds].every((b) => PROP_VALUES[byProp].includes(b))) { r.push("byProp:bins-must-be-values"); continue; }
    const tools = [...new Set(arr(x.tools, "tools", r).filter((t): t is Tool => (TOOLS as readonly string[]).includes(t as string)))].slice(0, 3);
    const ids = new Set<string>();
    const items = arr(x.items, "items", r).slice(0, 12).map((it) => {
      if (!isObj(it) || !idOk(it.id) || ids.has(it.id)) { r.push("item:id"); return null; }
      const text = reqStr(it.text, 16, "item.text", r); if (!text) return null;
      const props: Record<string, string> = {};
      if (isObj(it.props)) for (const [k, v] of Object.entries(it.props)) if (k in PROP_VALUES && typeof v === "string" && PROP_VALUES[k].includes(v)) props[k] = v; else r.push("prop:" + k);
      // every enabled tool must have a defined answer for every item (the bench never shows a made-up result)
      if (tools.some((t) => !(PROP_OF[t] in props))) { r.push("item:missing-prop-for-tool"); return null; }
      let bin = typeof it.bin === "string" ? it.bin : "";
      if (byProp) { const derived = props[byProp]; if (!derived) { r.push("item:no-byProp"); return null; } if (bin !== derived) { if (bin) r.push("bin:derived-from-props"); bin = derived; } }
      if (!binIds.has(bin)) { r.push("item:bin"); return null; }
      ids.add(it.id);
      const gl = typeof it.glyph === "string" && (GLYPHS as readonly string[]).includes(it.glyph) ? { glyph: it.glyph as Glyph } : {};
      return { id: it.id, text, ...gl, bin, ...(Object.keys(props).length ? { props } : {}), ...src(it.src, r) };
    }).filter((i): i is NonNullable<typeof i> => !!i);
    const used = new Set(items.map((i) => i.bin));
    if (items.length < 3 || used.size < 2) { r.push("round:items"); continue; }
    rounds.push({ title: reqStr(x.title, 22, "round.title", r) ?? "Sort", sub: typeof x.sub === "string" && x.sub.length <= 40 && !MARKUP.test(x.sub) ? x.sub : "", ...(byProp ? { byProp } : {}), bins, tools, items, speed: num(x.speed, 0.6, 1.5, 0.9, "speed", r), ...targets(x.targets, r) });
  }
  if (!rounds.length) return null;
  return { archetype: "sort-storm@1", ...env, strings: strings(raw.strings, SS_STRINGS, 40, r), title: reqStr(raw.title, 36, "title", r) ?? "Sort Storm", rounds };
}
function gradeSort(spec: SortSpec, itemId: string, value: unknown): Graded {
  const m = /^r(\d+):([A-Za-z0-9_-]{1,16})$/.exec(itemId); if (!m) return UNGRADED;
  const rd = spec.rounds[+m[1] - 1]; const it = rd?.items.find((i) => i.id === m[2]); if (!it) return UNGRADED;
  if (typeof value !== "string" || !rd.bins.some((b) => b.id === value)) return { verdict: "wrong", truth: it.bin, detail: "missed" };
  return { verdict: value === it.bin ? "right" : "wrong", truth: it.bin };
}
function keysSort(spec: SortSpec) {
  return spec.rounds.flatMap((rd, k) => rd.items.map((it) => ({ itemId: `r${k + 1}:${it.id}`, key: rd.bins.find((b) => b.id === it.bin)?.label ?? it.bin, prompt: `${it.text} → which of [${rd.bins.map((b) => b.label).join(" | ")}]${it.props ? " props " + JSON.stringify(it.props) : ""}`, ...(it.src ? { src: it.src } : {}) })));
}
export const sortDef: ExtSpecDef<SortSpec> = {
  archetype: "sort-storm@1", title: "Test Bench Sort", kind: "game", subjects: ["science", "evs", "sst", "maths"],
  act: "against the belt clock, run real tests on each item (magnet, light, water, circuit, flame, iodine) and flick it into the right bin; a wrong bin replays the test",
  outcomes: { classes: [4, 5, 6, 7], subjects: ["science", "evs", "sst"], topics: ["c6-science-ch04-t01"], misconceptions: ["c6-science-ch04-t01-m1"] },
  schema: SortSchema as unknown as z.ZodType<SortSpec>, defaultSpec: sortDefault, repair: repairSort, grade: gradeSort, keys: keysSort,
};
