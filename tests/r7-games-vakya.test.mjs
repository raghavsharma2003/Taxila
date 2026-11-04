// Round 7 · Vakya-rail (English and Hindi grammar as a sentence train of word wagons). The bank is built only from VERIFIED
// kit items (build-vakya --check; every key traced back to its kit answer / acceptable form / the prompt's own template;
// every wagon word and form traced back to the item or a closed grammar set); every bank item's verified key solves its
// level; goal met ⇔ an independent string oracle over random couple / uncouple / turn / run / undo acts; each mal-rule's
// wrong train lands on its OWN misconception moment and folds its kit id into the evidence; tampered params are refused; a
// verdict field in an act never decides; every coverage entry (and every bank topic, through a synthetic entry) serves a
// level through server/play/levels.js currentLevel; Devanagari wagons round-trip in NFC and reach the canvas whole, in the
// direction's Devanagari face; the view fits 300×440 and up with ≥ 44 px targets and ≥ 14 px text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { register } from "node:module";
import { vakyaLogic, tokens, matchTrain, sparkOf, sealOf, vakyaHidden, VAKYA_MAL } from "../src/play/families/vakya/vakya.logic.ts";
import { build, MIN_ITEMS, EN_SETS, fillBlanks, quotes } from "../server/play/tools/build-vakya.mjs";
import { coverage, currentLevel, entryKey, seedOf, vakyaItems } from "../server/play/levels.js";
import { gradeActs, lessonEvidence } from "../server/play/grade.js";
import { hiddenOf } from "../server/play/react.js";
import { proveLevel } from "../src/play/core/pick.ts";
import { GAME_WEIGHT, sanitizeActs, reactionProblems, FAMILIES, MODES, FAMILY_ARTS } from "../shared/play.ts";
import { PLAY_ACTS } from "../server/director/play-verbs.js";
import { ART, Painter, newAudit } from "../src/play/core/styles.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const { files, index } = build();
const BANK = Object.values(files).flatMap((f) => f.items);
const KITS = new Map();
const kitItem = (id) => {
  const f = `${id.split("-ch")[0]}.json`;
  if (!KITS.has(f)) KITS.set(f, JSON.parse(readFileSync(`${ROOT}data/kits/${f}`, "utf8")));
  for (const t of KITS.get(f).topics) for (const it of t.items) if (it.id === id) return it;
  return null;
};
const env = (acts) => acts.map((act, i) => ({ seq: i + 1, t: i * 400, via: "touch", act }));
const req = (item, o = {}) => ({ family: "vakya", mode: "rail", goal: "build", topicId: item.topicId, skillId: item.skillId, classLevel: 6, fade: 1, mis: {}, misMap: {}, grammar: { items: BANK.filter((x) => x.topicId === item.topicId) }, recent: [], seed: 7, ...o });
const levelOf = (item) => vakyaLogic.validate(vakyaLogic.generate(req(item)).find((c) => c.level.params.itemId === item.id).level);
const run = (level, acts) => { let s = vakyaLogic.init(level); const ms = [], refused = []; acts.forEach((a, i) => { const r = vakyaLogic.apply(level, s, a, i + 1); s = r.state; ms.push(...r.moments); if (r.refused) refused.push(r.refused); }); return { s, ms, refused }; };

test("vakya: the family is registered (FAMILIES, MODES, arts, a build verb that never chooses)", () => {
  assert.ok(FAMILIES.includes("vakya"));
  assert.deepEqual([...MODES.vakya], ["rail"]);
  assert.deepEqual([...FAMILY_ARTS.vakya].sort(), ["blueprint", "chalk", "kagaz", "raat"]);
  assert.equal(PLAY_ACTS.vakya.rail.act, "build");
  assert.doesNotMatch(`${PLAY_ACTS.vakya.rail.hi} ${PLAY_ACTS.vakya.rail.en}`, /chun|choose|pick/i);
  assert.deepEqual([...vakyaLogic.malRules], [...VAKYA_MAL]);
});

test("vakya bank: build-vakya --check passes (the bank on disk is what the builder makes)", () => {
  const r = spawnSync(process.execPath, [`${ROOT}server/play/tools/build-vakya.mjs`, "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /vakya ok/);
});

test("vakya bank: every item is a verified kit item; its key is the kit's own; every wagon word comes from the item or a closed set", () => {
  assert.ok(BANK.length >= 60, `${BANK.length} items`);
  const closed = new Set(Object.values(EN_SETS).flat());
  for (const it of BANK) {
    const k = kitItem(it.id);
    assert.ok(k, it.id);
    assert.equal(k.verified?.agrees, true, `${it.id} not verified`);
    assert.equal(k.skillId, it.skillId);
    // the key: the kit answer, an acceptable form, or the prompt's own template with the answer's words in its blanks
    const key = it.keys[0].join(" ");
    const from = [k.answer, ...(k.acceptable ?? [])].map((x) => tokens(x).join(" "));
    if (it.keyFrom === "blanks") assert.ok(quotes(k.prompt_en).some((q) => { const f = fillBlanks(q, k.answer); return f && tokens(f).join(" ") === key; }), `${it.id}: blanks`);
    else assert.ok(from.includes(key), `${it.id}: key "${key}" is not the kit's`);
    for (const alt of it.keys.slice(1)) assert.ok(from.includes(alt.join(" ")), `${it.id}: accepted "${alt.join(" ")}" is not the kit's`);
    assert.ok(key.split(" ").length >= 3 && key.split(" ").length <= 12);
    // every word of the key is a wagon (or the engine); at most 2 distractors; every form is the item's own or a closed set's
    const words = new Set([...tokens(k.prompt_en.replace(/\//g, " ")), ...tokens(k.answer), ...(k.acceptable ?? []).flatMap((a) => tokens(a))]);
    assert.ok(it.wagons.filter((w) => w.id.startsWith("x")).length <= 2, it.id);
    for (const w of it.wagons) for (const f of w.forms) { const t = tokens(f)[0]; assert.ok(words.has(t) || closed.has(t), `${it.id}: "${f}" comes from nowhere`); }
    assert.ok(matchTrain(it, it.keys[0]), it.id);
    assert.equal(it.seal, sealOf(it));
    assert.notEqual(it.decides, "copy");
  }
  // a topic is admitted with ≥ MIN_ITEMS items, and only then
  assert.equal(MIN_ITEMS, 6);
  for (const [id, t] of Object.entries(index.topics)) {
    assert.equal(t.eligible, t.items >= MIN_ITEMS, id);
    assert.equal(t.items, BANK.filter((x) => x.topicId === id).length, id);
  }
  // English and Hindi both, each from its own kit
  assert.ok(BANK.some((x) => x.lang === "hi") && BANK.some((x) => x.lang === "en"));
  for (const it of BANK) assert.equal(it.lang === "hi", it.topicId.includes("-hindi-"), it.id);
});

test("vakya: every bank item's verified key solves its level (and grades solved, clean, as a production)", () => {
  for (const it of BANK) {
    const level = levelOf(it);
    assert.ok(level, `${it.id} does not validate`);
    assert.equal(vakyaLogic.shortcut(level), null);
    const sol = vakyaLogic.solve(level);
    const r = run(level, sol);
    assert.ok(r.s.done && r.ms.some((m) => m.kind === "solved"), `${it.id} not solved`);
    assert.deepEqual(r.refused, [], `${it.id}: the solver was refused`);
    const g = vakyaLogic.grade(level, env(sol));
    assert.equal(g.verdict, "solved"); assert.equal(g.evidence[0].outcome, "correct"); assert.ok(g.clean);
    assert.ok(proveLevel(vakyaLogic, level), it.id);
    // every accepted sentence solves it too, and the yard alone (nothing coupled) never does
    for (const k of it.keys) { const m = matchTrain(level.params, k); assert.ok(m); }
    assert.equal(run(level, [{ kind: "run" }]).refused[0], "build_first");
  }
});

/** the oracle: the coupled words (engine first), lower-cased and stripped of punctuation by its own rule, equal one of the
 *  bank's accepted sentences as a string */
const flat = (s) => s.normalize("NFC").toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}\p{M}'\s-]/gu, " ").replace(/\s+/g, " ").trim();
const oracle = (level, s) => {
  const p = level.params;
  const words = [...(p.engine ? [p.engine] : []), ...s.train.map((id) => { const w = p.wagons.find((x) => x.id === id); return w.forms[s.face[id] ?? w.init]; })];
  return p.keys.some((k) => flat(k.join(" ")) === flat(words.join(" ")));
};
test("vakya: ≥ 3000 random acts — goal met ⇔ the independent string oracle; the law never throws; claims never decide", () => {
  let seed = 11, acts = 0, solved = 0, runs = 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
  for (const it of BANK) {
    const level = levelOf(it), sol = vakyaLogic.solve(level), ids = [...level.params.wagons.map((w) => w.id), "w99", "zz"];
    for (let round = 0; round < 2; round++) {
      let s = vakyaLogic.init(level), k = 0;
      const pursue = round === 0 && rnd() < 0.6;
      for (let i = 0; i < 60 && !s.done; i++) {
        const r = rnd(), id = ids[Math.floor(rnd() * ids.length)];
        const a = pursue && r < 0.75 && k < sol.length ? sol[k++]
          : r < 0.4 ? { kind: "couple", wagon: id, at: Math.floor(rnd() * (s.train.length + 2)) - (rnd() < 0.05 ? 3 : 0) }
          : r < 0.55 ? { kind: "uncouple", wagon: id }
          : r < 0.72 ? { kind: "turn", wagon: id, form: Math.floor(rnd() * 4) }
          : r < 0.9 ? { kind: "run", ...(rnd() < 0.3 ? { solved: true, correct: true } : {}) } : { kind: "undo" };
        const before = s;
        const out = vakyaLogic.apply(level, s, a, i + 1);
        acts++;
        if (a.kind === "run" && out.refused !== "build_first") { runs++; assert.equal(out.state.done, oracle(level, before), `${it.id}: law and oracle disagree`); }
        s = out.state;
      }
      if (vakyaLogic.goalMet(level, s)) solved++;
    }
  }
  assert.ok(acts >= 3000, `${acts} acts`); assert.ok(runs >= 300, `${runs} runs`); assert.ok(solved >= 20, `${solved} solved`);
});

test("vakya: a missed run stops at the first wrong wagon (it stays, the rest uncouples); the fix is never shown", () => {
  const it = BANK.find((x) => x.lang === "en" && x.keys[0].length >= 6 && !x.engine) ?? BANK.find((x) => x.keys[0].length >= 6);
  const level = levelOf(it), sol = vakyaLogic.solve(level).filter((a) => a.kind !== "run");
  // build the key, then swap the first two coupled wagons
  let s = run(level, sol).s;
  const t = [...s.train]; [t[0], t[1]] = [t[1], t[0]];
  s = { ...s, train: t };
  const r = vakyaLogic.apply(level, s, { kind: "run" }, 99);
  assert.equal(r.refused, "missed");
  const off = level.params.engine ? 1 : 0;
  assert.equal(r.state.spark, off, "the spark is the first wagon behind the engine");
  assert.deepEqual(r.state.train, [t[0]], "the sparking wagon stays; the ones behind it uncouple");
  const m = r.moments.find((x) => x.kind === "law_refused" || x.kind === "misconception_consequence");
  assert.equal(m.facts.at, off);
  for (const v of Object.values(m.facts)) for (const w of it.keys[0]) if (w.length > 2) assert.notEqual(String(v).toLowerCase(), w, "a moment never carries a key word");
  // undo is free: the train before the run comes back
  assert.deepEqual(vakyaLogic.apply(level, r.state, { kind: "undo" }, 100).state.train, t);
});

test("vakya: each mal-rule's wrong train lands on its OWN misconception moment and folds its kit id", () => {
  const seen = new Set();
  for (const it of BANK.filter((x) => x.mals.length)) {
    assert.ok(it.malKit && kitItem(it.id).targetsMisconception === it.malKit, `${it.id}: a mal train only for the item's own misconception`);
    const level = levelOf(it);
    assert.deepEqual(Object.values(level.mal), it.mals.map(() => it.malKit));
    for (const mal of VAKYA_MAL) {
      const acts = vakyaLogic.malActs(level, mal);
      if (!acts) { assert.ok(!it.mals.some((m) => m.id === mal)); continue; }
      seen.add(mal);
      const r = run(level, acts);
      assert.deepEqual(r.refused, ["missed"], `${it.id} ${mal}: built legally, then missed`);
      const mc = r.ms.filter((m) => m.kind === "misconception_consequence");
      assert.equal(mc.length, 1, `${it.id} ${mal}`);
      assert.equal(mc[0].misconceptionId, mal, `${it.id}: ${mal} named as ${mc[0].misconceptionId}`);
      assert.equal(mc[0].facts.at, sparkOf(level.params.keys, level.params.mals.find((m) => m.id === mal).train).at);
      const g = vakyaLogic.grade(level, env(acts));
      assert.equal(g.evidence[0].outcome, "incorrect"); assert.equal(g.evidence[0].misconceptionId, it.malKit);
      assert.ok(proveLevel(vakyaLogic, level).discriminates.includes(it.malKit), `${it.id} discriminates ${it.malKit}`);
    }
  }
  for (const m of VAKYA_MAL) assert.ok(seen.has(m), `mal-rule ${m} never exercised by a bank item`);
  // a mal-rule the topic does not map never fires
  const it = BANK.find((x) => x.mals.length), level = { ...levelOf(it), mal: {} };
  assert.equal(vakyaLogic.malActs(level, it.mals[0].id), null);
  const r = run(level, vakyaLogic.malActs(levelOf(it), it.mals[0].id));
  assert.equal(r.ms.filter((m) => m.kind === "misconception_consequence").length, 0);
  assert.ok(r.ms.some((m) => m.kind === "law_refused"));
});

test("vakya: tampered params are refused (a key that differs from the bank, a forged wagon, a broken seal)", () => {
  const it = BANK.find((x) => x.mals.length && x.wagons.some((w) => w.forms.length > 1));
  const base = vakyaLogic.generate(req(it)).find((c) => c.level.params.itemId === it.id).level;
  assert.ok(vakyaLogic.validate(base));
  const bad = (patch) => ({ ...base, params: { ...base.params, ...patch } });
  const p = base.params, k0 = p.keys[0];
  const swapped = [...k0]; [swapped[1], swapped[2]] = [swapped[2], swapped[1]];
  const turned = p.wagons.map((w) => (w.forms.length > 1 ? { ...w, forms: [...w.forms].reverse(), init: 0 } : w));
  for (const patch of [
    { keys: [swapped, ...p.keys.slice(1)] },                                 // a different key, same wagons: the seal breaks
    { keys: [...p.keys, swapped] },                                          // an extra accepted sentence
    { keys: [k0.slice(0, -1)] },                                             // a key that leaves a word wagon unused
    { wagons: turned },                                                      // forms reordered
    { wagons: [...p.wagons, { id: "x7", forms: ["xyz"], init: 0 }, { id: "x8", forms: ["abc"], init: 0 }, { id: "x9", forms: ["pqr"], init: 0 }] },
    { wagons: p.wagons.map((w, i) => (i === 0 ? { ...w, forms: [...w.forms, w.forms[0]] } : w)) },
    { wagons: p.wagons.map((w, i) => (i === 0 ? { ...w, init: 9 } : w)) },
    { mals: [{ id: "wrong-form", train: k0 }] },                             // a mal train that IS the key
    { mals: [{ id: "made-up", train: p.mals[0].train }] },
    { seal: "00000000" }, { engine: "Zebra" }, { lang: "fr" }, { itemId: "" },
  ]) assert.equal(vakyaLogic.validate(bad(patch)), null, JSON.stringify(patch).slice(0, 90));
  assert.equal(vakyaLogic.validate({ ...base, mode: "pick" }), null);
  assert.equal(vakyaLogic.validate({ ...base, params: null }), null);
  // a level re-sealed with a forged key still does not match the bank's seal for that item
  const forged = bad({ keys: [swapped] });
  assert.notEqual(sealOf(forged.params), it.seal);
});

test("vakya: a verdict field in an act never decides; the first run decides the evidence; grade replays the same", () => {
  const it = BANK.find((x) => x.keys[0].length >= 5), level = levelOf(it);
  const forged = vakyaLogic.grade(level, env([{ kind: "couple", wagon: level.params.wagons[0].id, at: 0, correct: true }, { kind: "run", solved: true, verdict: "solved", correct: true }]));
  assert.notEqual(forged.verdict, "solved"); assert.notEqual(forged.evidence[0]?.outcome, "correct");
  // through the server: claim keys are stripped and the replay decides
  const g = gradeActs(level, sanitizeActs(env([{ kind: "run", solved: true, correct: true, grade: "A" }])), { final: true });
  assert.notEqual(g.grade.verdict, "solved");
  const sol = vakyaLogic.solve(level);
  const wrong = [{ kind: "couple", wagon: level.params.wagons[1].id, at: 0 }, { kind: "run" }, { kind: "undo" }, { kind: "undo" }, ...sol];
  const g2 = vakyaLogic.grade(level, env(wrong));
  assert.equal(g2.verdict, "solved"); assert.notEqual(g2.evidence[0].outcome, "correct");
  assert.deepEqual(vakyaLogic.grade(level, env(wrong)), g2);
  // the teacher never says the key before the child builds it
  const hidden = hiddenOf(level);
  assert.deepEqual(hidden, vakyaHidden(level));
  assert.ok(hidden.includes(level.params.keys[0].join(" ")));
  const long = level.params.keys[0].find((w) => w.length >= 4);
  assert.ok(reactionProblems(`Dekho ${long} yahan`, { hidden }).includes("reveals_hidden"));
});

// the play server: every coverage entry serves a level; every bank topic does too, through a synthetic entry
const bodyOf = (entry, child = "c1") => ({ childId: child, key: entryKey(entry), skillId: entry.skillId, classLevel: entry.classLevel, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf(child, entryKey(entry), 0), door: "garam", recent: [] });
test("vakya coverage: one entry per admitted bank topic, in front of the arena net; each serves a solvable level of its own skill", () => {
  const cov = coverage(), mine = cov.entries.filter((e) => e.family === "vakya");
  const eligible = Object.entries(index.topics).filter(([, t]) => t.eligible).map(([id]) => id).sort();
  assert.deepEqual(mine.map((e) => e.topicId), eligible);
  assert.equal(cov.counts.byFamily.vakya, eligible.length);
  assert.ok(cov.counts.languages4to7.english.topics > 0 && cov.counts.languages4to7.hindi.topics > 0);
  const firstArena = cov.entries.findIndex((e) => e.family === "arena");
  for (const e of mine) {
    assert.ok(cov.entries.indexOf(e) < firstArena);
    const lv = currentLevel(bodyOf(e), e);
    assert.ok(lv, e.topicId); assert.ok(e.skillIds.includes(lv.skillId));
    const g = gradeActs(lv, env(vakyaLogic.solve(lv)), { final: true });
    assert.equal(g.grade.verdict, "solved");
    assert.equal(lessonEvidence(g.grade, lv)[0].weight, GAME_WEIGHT);
  }
  // every bank topic (admitted or not yet) serves through the same server path when an entry points at it
  let served = 0;
  for (const [topicId, t] of Object.entries(index.topics)) {
    const skillIds = Object.keys(t.skills).sort();
    const entry = { topicId, family: "vakya", mode: "rail", goal: "build", classLevel: Number(topicId[1]), subject: t.file.split("-")[1], skillId: skillIds[0], skillIds, grammar: { bank: t.file }, misMap: {} };
    assert.equal(vakyaItems(t.file, topicId).length, t.items);
    for (const sk of skillIds) {
      const lv = currentLevel({ ...bodyOf(entry), skillId: sk }, entry);
      assert.ok(lv, `${topicId} ${sk}`);
      assert.equal(lv.family, "vakya"); assert.equal(lv.skillId, sk);
      assert.ok(lv.proof.solvable && lv.proof.shortcutFree);
      const g = gradeActs(lv, env(vakyaLogic.solve(lv)), { final: true });
      assert.equal(g.grade.verdict, "solved");
      assert.equal(lv.params.items, undefined, "the bank never rides the level");
      served++;
    }
  }
  assert.ok(served >= 40, `${served}`);
  assert.deepEqual(vakyaItems("../secrets", "x"), []);
});

test("vakya Devanagari: Hindi wagons are NFC, survive the wire, and NFD input reads the same; a decomposed form is refused", () => {
  const hi = BANK.filter((x) => x.lang === "hi");
  assert.ok(hi.length >= 8, `${hi.length} Hindi items`);
  for (const it of hi) {
    for (const w of it.wagons) for (const f of w.forms) { assert.equal(f, f.normalize("NFC")); assert.match(f, /[ऀ-ॿ]/); }
    const level = levelOf(it);
    const nfc = it.keys[0].join(" ");
    assert.deepEqual(tokens(nfc.normalize("NFD")), tokens(nfc));
    // the acts travel as JSON through sanitizeActs and replay to the same solve
    const wire = sanitizeActs(JSON.parse(JSON.stringify(env(vakyaLogic.solve(level)))));
    assert.equal(vakyaLogic.grade(level, wire).verdict, "solved");
  }
  const it = hi.find((x) => x.wagons.some((w) => /[ा-्]/.test(w.forms[0]) && w.forms[0].normalize("NFD") !== w.forms[0])) ?? hi[0];
  const lv = vakyaLogic.generate(req(it)).find((c) => c.level.params.itemId === it.id).level;
  const nfd = { ...lv, params: { ...lv.params, wagons: lv.params.wagons.map((w) => ({ ...w, forms: w.forms.map((f) => f.normalize("NFD")) })) } };
  if (nfd.params.wagons.some((w, i) => w.forms.join() !== lv.params.wagons[i].forms.join())) assert.equal(vakyaLogic.validate(nfd), null);
  // the painter draws a Devanagari wagon whole, in the direction's Devanagari face, never below the floor
  const ctx = fakeCtx();
  const P = new Painter(ART.kagaz, newAudit("kagaz", true), true);
  const word = it.wagons.find((w) => w.id.startsWith("w")).forms[0];
  P.text(ctx, word, 50, 50, { size: 14, on: "q1" });
  assert.deepEqual(ctx.drawn.map((d) => d.s), [word]);
  assert.ok(ctx.drawn[0].font.includes(ART.kagaz.font.deva), ctx.drawn[0].font);
  assert.ok(Number(/(\d+)px/.exec(ctx.drawn[0].font)[1]) >= 16, "a class 4-5 label is ≥ 16 px");
});

// ── the view, drawn into a recording context (the browser shapes the text; here we check what reaches the canvas)
function fakeCtx() {
  const t = { font: "10px x", drawn: [], fillStyle: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1, textAlign: "center", textBaseline: "middle", lineCap: "", lineJoin: "" };
  return new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === "measureText") return (s) => ({ width: [...String(s)].length * Number(/(\d+)px/.exec(o.font)?.[1] ?? 16) * 0.56 });
      if (k === "fillText") return (s) => { o.drawn.push({ s, font: o.font }); };
      return () => ({ addColorStop() {} });
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}
test("vakya view: fits 300×440 and up in every art direction; targets ≥ 44 px inside the box; text ≥ 14 px; Devanagari reaches the canvas whole", async () => {
  register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) { if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { ...ctx.importAttributes, type: "json" } }); return next(url, ctx); }`));
  const { makeVakyaView } = await import("../src/play/families/vakya/vakya.view.ts");
  let checked = 0;
  const longest = [...BANK].sort((a, b) => b.wagons.length - a.wagons.length).slice(0, 6);
  const picks = [...longest, ...BANK.filter((x) => x.lang === "hi").slice(0, 4), BANK[0]];
  for (const it of picks) for (const [W, H] of [[300, 440], [390, 560], [900, 520]]) for (const art of ["kagaz", "chalk", "blueprint", "raat"]) {
    const level = levelOf(it);
    const audit = newAudit(art, true);
    audit.box = { w: W, h: H };
    let state = vakyaLogic.init(level);
    const ctl = { get state() { return state; }, acts: [], dispatch(a) { const r = vakyaLogic.apply(level, state, a, this.acts.length + 1); state = r.state; this.acts.push({ act: a }); return r; }, finger() {} };
    const api = { w: W, h: H, dpr: 1, t: 50, P: new Painter(ART[art], audit, true), art: ART[art], tw: {}, fx: { burst() {}, shake() {}, flash() {} }, reduced: true, young: true,
      sfx() {}, target(id, x, y, w, h) { audit.targets.push({ id, x, y, w, h }); }, hit: () => null, invalidate() {}, layer() { return null; } };
    const view = makeVakyaView(api, { level, ctl, lang: it.lang === "hi" ? "hi" : "en", changed() {} });
    view.layout(W, H);
    const sol = vakyaLogic.solve(level).filter((a) => a.kind !== "run");
    for (const phase of ["yard", "built"]) {
      if (phase === "built") for (const a of sol) { ctl.dispatch(a); view.react([], undefined); }
      audit.targets.length = 0; audit.texts.length = 0;
      const ctx = fakeCtx();
      view.draw(ctx);
      const wagons = audit.targets.filter((x) => x.id.startsWith("wg:"));
      assert.equal(wagons.length, level.params.wagons.length, `${it.id} ${W}×${H} ${phase}: every wagon is touchable`);
      for (const tg of wagons) {
        assert.ok(tg.w >= 44 && tg.h >= 44, `${it.id} ${tg.id} ${tg.w}×${tg.h}`);
        assert.ok(tg.x >= 0 && tg.y >= 0 && tg.x + tg.w <= W + 0.5 && tg.y + tg.h <= H + 0.5, `${it.id} ${W}×${H} ${art} ${phase}: ${tg.id} outside the box (${tg.x.toFixed(0)},${tg.y.toFixed(0)})`);
      }
      for (const tx of audit.texts) assert.ok(tx.px >= 14, `${it.id}: "${tx.s}" at ${tx.px}px`);
      assert.equal(audit.clipped, 0, `${it.id} ${W}×${H} ${art} ${phase}: a label was clipped (${audit.texts.filter((x) => x.s.endsWith("…")).map((x) => x.s)})`);
      // the faces on the canvas are the wagons' own words, whole (a Devanagari word is one fillText, never split)
      for (const wg of level.params.wagons) assert.ok(ctx.drawn.some((d) => d.s === wg.forms[state.face[wg.id] ?? 0]), `${it.id}: ${wg.forms[0]} not drawn`);
      if (it.lang === "hi") assert.ok(ctx.drawn.filter((d) => /[ऀ-ॿ]/.test(d.s)).every((d) => d.font.includes(ART[art].font.deva)));
      // two track rows at most on a phone for these sentences, and nothing overlaps on the track
      const onTrack = wagons.filter((x) => state.train.includes(x.id.slice(3))).sort((a, b) => a.y - b.y || a.x - b.x);
      for (let i = 1; i < onTrack.length; i++) if (onTrack[i].y === onTrack[i - 1].y) assert.ok(onTrack[i].x >= onTrack[i - 1].x + onTrack[i - 1].w, `${it.id}: wagons overlap`);
      checked++;
    }
    const ids = view.controls().map((c) => c.id);
    assert.deepEqual(ids, ["undo", "run"]);
    assert.equal(view.controls().find((c) => c.id === "run").kind, "primary");
    assert.deepEqual(view.readouts(), []);
  }
  assert.ok(checked >= 100);
});

test("vakya: engine words appended at the end under vakya.*; the logic draws no clock and no randomness", () => {
  const words = Object.keys(JSON.parse(readFileSync(`${ROOT}data/play/engine-words.json`, "utf8")).words);
  const first = words.findIndex((k) => k.startsWith("vakya."));
  assert.ok(first > 0 && words.slice(first).every((k) => k.startsWith("vakya.")), "vakya words sit at the end");
  for (const k of ["vakya.goal", "vakya.run", "vakya.yard", "vakya.hint", "vakya.stopped"]) assert.ok(words.includes(k), k);
  const src = readFileSync(`${ROOT}src/play/families/vakya/vakya.logic.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Math\.random|Date\.now|performance\.now|setTimeout/);
  const view = readFileSync(`${ROOT}src/play/families/vakya/vakya.view.ts`, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(view, /Math\.random|Date\.now|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
