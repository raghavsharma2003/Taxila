// Round 8 Play H: the child's "why this game" line (server/play/why.js). Display text only, built by code from the level's
// because records; never changes a level or a grade; no model. The hard rules, each a test: (a) grammar around {look};
// (b) a time word only for an earlier session; (c) a banned-word predicate over every filled line; (d) ≤ 64 chars filled.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { whyLine, lookFor, malRuleOf, reasonOf, nextSaid, WHY_SHAPES, WHY_MAX, WHY_REASON } from "../server/play/why.js";
import { coverage, currentLevel, entryFor, entryKey, nextBody, afterLevelBody, seedOf, beliefOf } from "../server/play/levels.js";
import { gradeActs } from "../server/play/grade.js";
import { LOGIC } from "../src/play/families/index.ts";
import { env } from "../src/play/core/pick.ts";

const LANGS = ["hinglish", "en", "hi"];
const WORDS = JSON.parse(readFileSync("data/play/engine-words.json", "utf8")).words;
const ALL_FORMS = Object.values(WHY_SHAPES).flat();
const LOOK_FORMS = [...WHY_SHAPES.mixupEarlier, ...WHY_SHAPES.mixupNow];
const looks = Object.entries(WORDS).filter(([k]) => k.startsWith("look."));
const fill = (t, look) => t.replace("{look}", look);

test("H data: every mapped mal-rule in coverage has a look phrase or its family's, in all three languages; vakya keys stay last", () => {
  const missing = [];
  for (const e of coverage().entries) for (const rule of Object.keys(e.misMap ?? {})) for (const L of LANGS) if (!lookFor(e.family, rule, L)) missing.push(`${e.family}.${rule}:${L}`);
  assert.deepEqual(missing, []);
  for (const [k, v] of looks) for (const L of LANGS) assert.ok(typeof v[L] === "string" && v[L].trim(), `${k} ${L}`);
  const keys = Object.keys(WORDS), first = keys.findIndex((k) => k.startsWith("vakya."));
  assert.ok(keys.slice(first).every((k) => k.startsWith("vakya.")));
});

test("H (a) grammar: hi / hinglish {look} is followed at once by a postposition; en {look} follows a preposition and needs no article", () => {
  for (const [id, f] of LOOK_FORMS) {
    assert.match(f.hinglish, /\{look\} (par|ko|ke|mein|se)\b/, `${id} hinglish`);
    assert.match(f.hi, /\{look\} (पर|को|के|में|से)(\s|।)/u, `${id} hi`);
    // en: always the object of a preposition (never the subject: nothing agrees with it), never sentence-initial
    assert.match(f.en, /\b(at|about) \{look\}/, `${id} en`);
  }
  // en look phrases carry their own article or are plural / mass nouns that take none
  for (const [k, v] of looks) assert.match(v.en, /^the |s$|^the$|^[a-z]+ (and )?[a-z]+s$/, `${k}: "${v.en}"`);
  // every other form has no slot at all
  for (const [id, f] of ALL_FORMS) if (!LOOK_FORMS.some(([x]) => x === id)) for (const L of LANGS) assert.ok(!f[L].includes("{look}"), id);
});

test("H (b) the time word is true: 'last time' only for a mix-up from an EARLIER session; this session's never has one", () => {
  const TIME = /pichhli baar|last time|पिछली बार/i;
  for (const [id, f] of ALL_FORMS) for (const L of LANGS) assert.equal(TIME.test(f[L]), id === "1a", `${id} ${L}`);
  const level = { family: "kila", mal: { product: "m-p" } };
  const shapes = new Set();
  for (let seed = 0; seed < 60; seed++) for (const L of LANGS) {
    const now = whyLine([{ kind: "play.mixup_focus", when: "now", mis: "m-p" }], { lang: L, seed, level });
    assert.ok(!TIME.test(now.text), now.text);
    const lesson = whyLine([{ kind: "play.pick_mixup", when: "now", mis: "m-p" }], { lang: L, seed, level });
    assert.ok(!TIME.test(lesson.text), lesson.text);
    shapes.add(whyLine([{ kind: "play.pick_mixup", when: "earlier", mis: "m-p" }], { lang: L, seed, level }).shape);
  }
  assert.ok(shapes.has("1a") && (shapes.has("1b") || shapes.has("1c")), [...shapes].join());
  // a pick from an open mix-up (kt_misconception) is "earlier"; one seen in this lesson or the level just played is "now"
});

const BANNED = [/galti|ghalat|wrong|mistake|kamzor|weak|bhool|tumne|tumhari galti|you did|you got it wrong|failed|fail\b|bad\b|गलत|ग़लत|कमज़ोर|कमजोर|भूल|तुमने/iu,
  /\d|%|percent|probab|chance|sambhaav/iu, /!|！/u, /others|other kids|baaki bachch|dusre bachch|दूसरे बच्च|than you|se behtar|better than/iu,
  /shabash|great|well done|awesome|excellent|good job|wah\b|bahut accha|शाबाश|बहुत अच्छा|बढ़िया/iu];
const beliefs = (() => { const out = new Set(); for (const e of coverage().entries) for (const id of Object.values(e.misMap ?? {})) { const b = beliefOf(id); if (b && b !== id) out.add(String(b).toLowerCase()); } return [...out]; })();

test("H (c) and (d): every look phrase × form × language, filled — no banned word, no number, no belief text, no name; ≤ 64 chars", () => {
  let n = 0;
  const phrases = looks.map(([k, v]) => [k, v]);
  for (const [id, f] of ALL_FORMS) for (const L of LANGS) for (const [k, v] of (f[L].includes("{look}") ? phrases : [["-", { hinglish: "", en: "", hi: "" }]])) {
    const t = fill(f[L], v[L]);
    n++;
    assert.ok(t.length <= WHY_MAX, `${id} ${L} ${k}: ${t.length} "${t}"`);
    for (const re of BANNED) assert.ok(!re.test(t), `${id} ${L} ${k}: "${t}" ~ ${re}`);
    for (const b of beliefs) assert.ok(!t.toLowerCase().includes(b), `${k}: belief text`);
    assert.ok(!/Riya|Aarav|\{name\}/.test(t));
  }
  assert.ok(n > 300 && beliefs.length > 100, `${n} lines, ${beliefs.length} beliefs`);
});

test("H when: only a mix-up focus, a step up, a step down or a family switch gets a line; never a fade or a novelty / fit pick", () => {
  const level = { family: "kila", mal: { product: "m-p" } };
  for (const kind of ["play.fade_history", "play.fade_director", "play.pick_novelty", "play.pick_fit", "play.studio_gate", undefined]) assert.equal(whyLine([{ kind, choice: "x", fact: "y" }], { level }), null, String(kind));
  assert.deepEqual(Object.values(WHY_REASON).sort(), ["down", "mixup", "mixup", "switch", "up"]);
  for (const [kind, reason] of Object.entries(WHY_REASON)) {
    const w = whyLine([{ kind, when: "now", mis: "m-p" }], { level, lang: "hinglish", seed: 1 });
    assert.equal(w.reason, reason); assert.equal(reasonOf({ kind }), reason);
  }
  // a switch outranks the mix-up it was made for; the mal-rule's own phrase is used when the level maps it
  assert.equal(whyLine([{ kind: "play.mixup_focus", when: "now", mis: "m-p" }, { kind: "play.switch", when: "now", mis: "m-p" }], { level }).reason, "switch");
  assert.equal(malRuleOf(level, "m-p"), "product");
  const t = whyLine([{ kind: "play.mixup_focus", when: "now", mis: "m-p" }], { level, lang: "en", seed: 3 }).text;
  assert.ok(t.includes(lookFor("kila", "product", "en")), t);
  // spoken once per session per reason
  const w1 = whyLine([{ kind: "play.step_up" }], { level, said: [] });
  assert.equal(w1.speak, true);
  assert.equal(whyLine([{ kind: "play.step_up" }], { level, said: nextSaid([], w1) }).speak, false);
  assert.deepEqual(nextSaid(["up"], { speak: false, reason: "up" }), ["up"]);
});

test("H in the session: a clean first-try win → the next level carries the step-up line, spoken once; the body regenerates it", () => {
  const SKILL = "c5-maths-ch02-t01-s2";
  const e = entryFor({ skillId: SKILL });
  const logic = LOGIC[`${e.family}/${e.mode}`];
  let s = { childId: "c1", key: entryKey(e), skillId: SKILL, lessonId: null, classLevel: 5, fade: 1, lang: "hi", mis: {}, pL: 0.6, secure: false, n: 0, seed: seedOf("c1", entryKey(e), 0), door: "garam", recent: [], hist: null };
  const lines = [];
  for (let i = 0; i < 2; i++) {
    const level = currentLevel(s, e);
    const g = gradeActs(level, env(logic.solve(level)), { final: true });
    s = nextBody(afterLevelBody(s, { grade: g.grade, level }), e, "garam");
    lines.push(s.why);
  }
  assert.equal(lines[0].reason, "up"); assert.equal(lines[0].speak, true); assert.match(lines[0].text, /[ऀ-ॿ]/, "in the level's language");
  assert.equal(lines[1].reason, "up"); assert.equal(lines[1].speak, false, "said once per session");
  assert.deepEqual(s.whySaid, ["up"]);
});
