// Controls for the scene@1 validator (genui-reliability.md §5.7). Run: node docs/research/content/genui-scene-dsl.test.mjs
// Positive controls: every template expansion must pass lint in every band it supports.
// Negative controls: each seeded defect must be caught by the named check. A gate without a negative control
// is not a gate (kids-ux-ages §10.1).
import { validate, expandTemplate, Scene, jsonSchemas } from "./genui-scene-dsl.mjs";

const L = (en, hi, hi_latn) => (hi_latn ? { en, hi, hi_latn } : { en, hi });
const meta = (band, lang = "hi-Latn+en") => ({ band, lang, title: L("t", "t"), objective_ids: [], topic_ids: [] });
export const SAMPLE_SLOTS = {
  "sort-bins@1": { title: L("Where does it live?", "यह कहाँ रहता है?", "Yeh kahan rehta hai?"),
    bins: [{ id: "land", label: L("Land", "ज़मीन", "Zameen"), fill: "soil" }, { id: "water", label: L("Water", "पानी", "Paani"), fill: "water" }],
    items: [{ id: "fish", sprite: "animal.fish", say: L("fish", "मछली"), bin: "water" }, { id: "cow", sprite: "animal.cow", say: L("cow", "गाय"), bin: "land" },
      { id: "frog", sprite: "animal.frog", say: L("frog", "मेंढक"), bin: "water", misc: "MC.EVS.FROG_LAND_ONLY" }, { id: "camel", sprite: "animal.camel", say: L("camel", "ऊँट"), bin: "land" }] },
  "count-group@1": { title: L("Make 2 equal groups", "2 बराबर समूह बनाओ", "2 barabar group banao"), groups: 2, per: 3, sprite: "obj.mango", say: L("mango", "आम"), container: "obj.plate", misc_unequal: "MC.DIV.UNEQUAL_SHARES" },
  "slider-explore@1": { title: L("Sun and shadow", "सूरज और परछाई", "Sooraj aur parchhai"),
    input: { id: "sun", tl: "sun height", min: 10, max: 80, step: 5, init: 45, unit: "deg", label: L("Sun height", "सूरज की ऊँचाई", "Sooraj ki oonchai") },
    readouts: [{ id: "shadow", expr: "round(2 / tand(sun), 1)", tl: "shadow length", unit: "m", dp: 1, label: L("Shadow", "परछाई", "Parchhai") }],
    visual: { kind: "bar", of: "shadow", max: 12 }, goal: { tl: "shadow longer than 5 m", when: "shadow > 5" } },
  "sequence-steps@1": { title: L("Order the steps", "क्रम में लगाओ", "Kram mein lagao"),
    steps: [{ id: "soak", label: L("Soak seeds", "बीज भिगोओ", "Beej bhigo") }, { id: "wrap", label: L("Wrap in cloth", "कपड़े में लपेटो", "Kapde mein lapeto") }, { id: "wait", label: L("Wait 2 days", "2 दिन रुको", "2 din ruko") }],
    start: ["wait", "soak", "wrap"], traps: [{ order: ["wrap", "soak", "wait"], misc: "MC.SCI.GERM_ORDER" }] },
  "compare-choice@1": { title: L("Which plate has more?", "किस प्लेट में ज़्यादा?", "Kis plate mein zyada?"), question: L("Which has more rotis?", "किसमें ज़्यादा रोटी?"),
    left: { label: L("This one", "यह वाली", "Yeh wali"), sprite: "obj.roti", count: 7 }, right: { label: L("That one", "वह वाली", "Woh wali"), sprite: "obj.roti", count: 9 }, ask: "more", misc_wrong: "MC.NUM.COMPARE_BY_SPREAD" },
  "predict-reveal@1": { title: L("Ice in the sun", "धूप में बर्फ़", "Dhoop mein barf"), question: L("What will happen to the ice?", "बर्फ़ का क्या होगा?"),
    subject: { sprite: "obj.ice_cube", say: L("ice cube", "बर्फ़ का टुकड़ा") }, options: [{ id: "melt", label: L("It melts", "पिघलेगी", "Pighlegi") }, { id: "grow", label: L("It grows", "बढ़ेगी", "Badhegi"), misc: "MC.SCI.ICE_GROWS" }],
    correct: "melt", effect: "shrink", after: { sprite: "sci.puddle", say: L("water", "पानी") } },
};
let pass = 0, fail = 0; const out = [];
const check = (name, cond, detail = "") => { (cond ? pass++ : fail++); out.push(`${cond ? "PASS" : "FAIL"} ${name}${cond ? "" : "  " + detail}`); };

// ── positive controls
for (const [tid, slots] of Object.entries(SAMPLE_SLOTS)) for (const band of ["B1", "B2", "B3", "B4"]) {
  const ex = expandTemplate(tid, slots, meta(band)); if (!ex.ok) { check(`${tid} ${band} expands`, false, JSON.stringify(ex.errors)); continue; }
  const r = validate(ex.scene); check(`${tid} ${band} passes`, r.ok, JSON.stringify(r.errors?.slice(0, 3)));
}
// ── negative controls (seed one defect into a passing scene, expect a specific code)
const base = () => expandTemplate("sort-bins@1", SAMPLE_SLOTS["sort-bins@1"], meta("B2")).scene;
const slider = () => expandTemplate("slider-explore@1", SAMPLE_SLOTS["slider-explore@1"], meta("B3")).scene;
const choice = () => expandTemplate("compare-choice@1", SAMPLE_SLOTS["compare-choice@1"], meta("B2")).scene;
const NEG = [
  ["unknown sprite", "S6.sprite", (s) => { s.nodes.find((n) => n.id === "cow").lib = "animal.unicorn"; }],
  ["sprite too small for B2", "S3.hit_small", (s) => { const n = s.nodes.find((q) => q.id === "cow"); n.kind = "circle"; delete n.lib; delete n.w; delete n.h; n.r = { $: "20" }; }],
  ["draggable off stage", "S3.off_stage", (s) => { s.nodes.find((n) => n.id === "items").y = 1300; }],
  ["two zones overlap", "S3.overlap", (s) => { s.nodes.find((n) => n.id === "bins").layout = { type: "free" }; }],
  ["goal unreachable (zone accepts nothing draggable)", "S4.goal_unreachable", (s) => { s.nodes.filter((n) => n.kind === "zone").forEach((z) => (z.accepts = ["nothing"])); }],
  ["goal already true at mount", "S4.goal_trivial", (s) => { s.goals[0].when = "count(land) == 0"; }],
  ["unknown name in expression", "S2.name", (s) => { s.probe.correct = "has(land, cow) && score > 3"; }],
  ["unparseable expression", "S2.parse", (s) => { s.probe.correct = "has(land, cow) &&& 1"; }],
  ["trap can co-occur with correct", "S4.trap_overlaps_correct", (s) => { s.probe.traps = [{ when: "has(water, fish)", misc: "MC.X.Y" }]; }],
  ["text contrast fails (ink2 on a dark shape)", "S5.contrast", (s) => { s.nodes.push({ kind: "rect", id: "patch", x: 500, y: 590, w: 300, h: 100, fill: "leaf" }, { kind: "text", id: "note", x: 500, y: 590, text: L("Hi", "हाय"), size: "label", fill: "ink2" }); }],
  ["tint used as text colour is autofixed, not failed (v1.3)", null, (s) => { s.nodes.find((n) => n.id === "land_t").fill = "c4"; }],
  ["too many words for B2", "S5.words", (s) => { s.nodes.find((n) => n.id === "land_t").text = L("a b c d e f g h i j k l m n o p q r s t u", "बहुत"); s.nodes.find((n) => n.id === "land_t").w = 900; s.meta.lang = "en"; }],
  ["no goal and no probe", "S5.unguided", (s) => { s.goals = []; delete s.probe; }],
  ["duplicate id", "S1.dup_id", (s) => { s.nodes.find((n) => n.id === "camel").id = "cow"; }],
  ["markup in a string", "S0.schema", (s) => { s.nodes.find((n) => n.id === "land_t").text = L("<b>Land</b>", "ज़मीन"); }],
  ["slider var undeclared", "S1.var_ref", (s) => { s.nodes.find((n) => n.kind === "slider").var = "height"; }, slider],
  ["derive divides by zero at mount", "S2.eval", (s) => { s.derive[0].expr = "2 / (sun - 45)"; }, slider],
  ["slider goal unreachable in range", "S4.goal_unreachable", (s) => { s.goals[0].when = "shadow > 50"; }, slider],
  ["choice with two correct options", "S4.choice_key", (s) => { s.probe.correct = "pick != 'none'"; }, choice],
  ["decoration animates (R6)", "S5.decor_motion", (s) => { s.timelines = [{ id: "wiggle", on: "mount", steps: [{ t: 0, ms: 800, do: "tween", target: "left_bg", prop: "rot", to: 10 }] }]; }, choice],
];
for (const [name, code, mutate, mk = base] of NEG) {
  const s = mk(); mutate(s); const r = validate(s); const codes = (r.errors ?? []).map((e) => e.code);
  if (code === null) { check(`fix: ${name}`, r.ok && r.fixes.some((f) => f.includes("→ ink")), `got ${JSON.stringify(codes)} fixes ${JSON.stringify(r.fixes)}`); continue; }
  check(`neg: ${name} → ${code}`, codes.includes(code), `got ${JSON.stringify(codes)}`);
}
// ── schema sanity
const { canonical, strict } = jsonSchemas();
check("canonical JSON Schema has $defs-free nodes union", JSON.stringify(canonical).includes('"rect"'));
check("strict schema: every object closed", !JSON.stringify(strict).includes('"additionalProperties":{}'));
check("Scene rejects unknown top-level key", !Scene.safeParse({ ...base(), extra: 1 }).success);
console.log(out.join("\n")); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
