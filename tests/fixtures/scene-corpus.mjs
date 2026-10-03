// scene@1 documents for the frame renderer's tests: every T2a template the validator ships, expanded with
// real slots, plus a Forge G1 choice-card. Each is run through the normative validator
// (docs/research/content/genui-scene-dsl.mjs) so the tests only ever render scenes the server would pass.
import { expandTemplate, validate } from "../../docs/research/content/genui-scene-dsl.mjs";
import { buildScene } from "../../server/forge/templates.js";

const L = (en, hi, hi_latn) => ({ en, hi, ...(hi_latn ? { hi_latn } : {}) });
const meta = (band = "B3") => ({ band, lang: "hi-Latn+en", title: L("Activity", "गतिविधि", "Activity"), objective_ids: ["obj"], topic_ids: ["c5-evs-x"] });

const SLOTS = {
  "sort-bins@1": {
    title: L("Living or non-living?", "सजीव या निर्जीव?", "Sajeev ya nirjeev?"),
    bins: [{ id: "living", label: L("Living", "सजीव", "Sajeev"), fill: "c2" }, { id: "nonliving", label: L("Non-living", "निर्जीव", "Nirjeev"), fill: "c3" }],
    items: [
      { id: "cow", sprite: "animal.cow", say: L("cow", "गाय", "gaay"), bin: "living" },
      { id: "tree", sprite: "plant.tree", say: L("tree", "पेड़", "ped"), bin: "living" },
      { id: "ball", sprite: "obj.ball", say: L("ball", "गेंद", "gend"), bin: "nonliving", misc: "MC.LIVING.MOVES" },
      { id: "book", sprite: "obj.book", say: L("book", "किताब", "kitaab"), bin: "nonliving" },
    ],
  },
  "sequence-steps@1": {
    title: L("Put the steps in order", "क्रम में लगाओ", "Kram mein lagao"),
    steps: [
      { id: "s_a", label: L("Seed", "बीज", "Beej") },
      { id: "s_b", label: L("Sprout", "अंकुर", "Ankur") },
      { id: "s_c", label: L("Plant", "पौधा", "Paudha") },
      { id: "s_d", label: L("Flower", "फूल", "Phool") },
    ],
    start: ["s_c", "s_a", "s_d", "s_b"],
    traps: [{ order: ["s_d", "s_c", "s_b", "s_a"], misc: "MC.SEQ.REVERSED" }],
  },
  "compare-choice@1": {
    title: L("More or fewer", "ज़्यादा या कम", "Zyada ya kam"),
    question: L("Which side has more?", "किस तरफ़ ज़्यादा हैं?", "Kis taraf zyada hain?"),
    left: { label: L("Left", "बाएँ", "Baayein"), sprite: "obj.apple", count: 3 },
    right: { label: L("Right", "दाएँ", "Daayein"), sprite: "obj.apple", count: 5 },
    ask: "more",
    misc_wrong: "MC.COUNT.SPREAD",
  },
  "predict-reveal@1": {
    title: L("Ice in the sun", "धूप में बर्फ़", "Dhoop mein barf"),
    question: L("What happens to the ice?", "बर्फ़ का क्या होगा?", "Barf ka kya hoga?"),
    subject: { sprite: "obj.ice_cube", say: L("ice cube", "बर्फ़ का टुकड़ा", "barf ka tukda") },
    options: [{ id: "melts", label: L("It melts", "पिघलेगी", "Pighlegi") }, { id: "grows", label: L("It grows", "बढ़ेगी", "Badhegi"), misc: "MC.STATE.ICE_GROWS" }],
    correct: "melts",
    effect: "shrink",
    after: { sprite: "sci.puddle", say: L("water", "पानी", "paani") },
  },
  "slider-explore@1": {
    title: L("Shadow and the sun", "छाया और सूरज", "Chhaya aur suraj"),
    input: { id: "angle", tl: "sun height", min: 10, max: 80, step: 10, init: 20, unit: "deg", label: L("Sun height", "सूरज की ऊँचाई", "Suraj ki oonchai") },
    readouts: [{ id: "shadow", expr: "2 / tand(angle)", tl: "shadow length", unit: "m", dp: 1, label: L("Shadow", "छाया", "Chhaya") }],
    visual: { kind: "bar", of: "shadow", max: 12 },
    goal: { tl: "shadow under 1 m", when: "shadow < 1" },
  },
  "count-group@1": {
    title: L("Make 2 equal groups", "2 बराबर समूह", "2 barabar samooh"),
    groups: 2, per: 3, sprite: "obj.mango", say: L("mango", "आम", "aam"), container: "obj.plate", misc_unequal: "MC.SHARE.UNEQUAL",
  },
};

export function corpus() {
  const out = {};
  for (const [id, slots] of Object.entries(SLOTS)) {
    const ex = expandTemplate(id, slots, meta());
    if (!ex.ok) throw new Error(`${id}: ${JSON.stringify(ex.errors)}`);
    const v = validate(ex.scene);
    if (!v.ok) throw new Error(`${id} fails the validator: ${JSON.stringify(v.errors.slice(0, 3))}`);
    out[id] = v.scene;
  }
  const cc = buildScene(
    { template: "choice-card@1", options: [{ text: "3/4", misc: null }, { text: "4/3", misc: "c5-m-flip" }, { text: "1/4", misc: "c5-m-part" }], correct: 0 },
    { id: "i1", skillId: "c5-maths-s1", prompt_en: "Which shows three quarters?", prompt_hi: "Teen chauthai kaunsa hai?" },
    { band: "B3", lang: "hi-Latn+en", hook: { en: "Quick check", hi: "जल्दी जाँच", hi_latn: "Jaldi jaanch" }, decor: null, seed: 7, topicId: "c5-maths-ch02-t01" },
  );
  if (!cc.ok) throw new Error(`choice-card: ${cc.why}`);
  const v = validate(cc.scene);
  if (!v.ok) throw new Error(`choice-card fails the validator: ${JSON.stringify(v.errors.slice(0, 3))}`);
  out["choice-card@1"] = { scene: v.scene, correctId: cc.correctId };
  return out;
}
