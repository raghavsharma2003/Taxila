// Round 4 G1, the server half of the Game Director:
//   - the dress: ONE taxila-fast call, enums only, validated field by field, 1.9 s deadline, base dress otherwise; the model
//     sees closed tags and never the child's name or words; rules the model cannot override;
//   - focusMal: the misconception the lesson just saw (kt_evidence / reteach_attempts) becomes the level's target, and a
//     level's own confirmed misconception becomes the next level's;
//   - doors: the level a door shows is the level /next serves; novelty works; a harder door exists (fade up) when the fade
//     has no harder candidate.
import test from "node:test";
import assert from "node:assert/strict";
import { dressSpecFor, baseSpec, interestTags, verbFor, DRESS_DEADLINE_MS } from "../server/play/dress.js";
import { entryFor, entryKey, currentLevel, nextBody, seedOf, genRequest } from "../server/play/levels.js";
import { learnerInputs, startSession } from "../server/play/start.js";
import { LOGIC } from "../src/play/families/index.ts";

const entry = entryFor({ skillId: "c5-maths-ch02-t01-s2" });
const sess = (over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: "c5-maths-ch02-t01-s2", classLevel: 6, fade: 1, lang: "hinglish", mis: {}, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], ...over });
const child = { id: "c1", first_name: "Meher", interests: ["Meher loves cricket and rockets"], class_level: 6 };
const fakeChat = (json, ms = 5, capture = null) => async (dep, messages, opts) => { if (capture) capture.push({ dep, messages, opts }); await new Promise((r) => setTimeout(r, ms)); return { json }; };
const ENV = { DEPLOY_FAST: "taxila-fast" };

test("dress: a valid model delta is worn (enums only); the base dress is a full dress", async () => {
  const s = sess(), level = currentLevel(s, entry);
  const b = baseSpec(s, level, child);
  assert.ok(b && b.engine === "antariksh");
  for (const k of ["theme", "wrapper", "music", "pace", "teacherMove", "lang"]) assert.ok(b.spec.dress[k], k);
  const r = await dressSpecFor({ s, level, child }, { chat: fakeChat({ theme: "hara-toofan", wrapper: "comet-catch", music: "drive", pace: "steady", teacherMove: "notice", lang: "hinglish" }), env: ENV });
  assert.equal(r.source, "model");
  assert.equal(r.spec.dress.theme, "hara-toofan"); assert.equal(r.spec.dress.wrapper, "comet-catch"); assert.equal(r.spec.from.theme, "model");
});

test("dress: a non-enum value is DROPPED (never repaired); the rest of the delta stands", async () => {
  const s = sess(), level = currentLevel(s, entry);
  const r = await dressSpecFor({ s, level, child }, { chat: fakeChat({ theme: "Neela-Nebula ", wrapper: "dragon-hunt", music: "calm", pace: "steady", teacherMove: "notice", lang: "hinglish", say: "Shabash!" }), env: ENV });
  assert.equal(r.source, "model");
  const base = baseSpec(s, level, child).spec;
  assert.equal(r.spec.dress.theme, base.dress.theme); assert.equal(r.spec.from.theme, "base");
  assert.equal(r.spec.dress.wrapper, base.dress.wrapper); assert.equal(r.spec.from.wrapper, "base");
  assert.ok(!JSON.stringify(r.spec).includes("Shabash"));
});

test("dress: later than 1.9 s, an error, a 429 or the off switch = the base dress", async () => {
  const s = sess(), level = currentLevel(s, entry), base = baseSpec(s, level, child).spec;
  const t0 = Date.now();
  const late = await dressSpecFor({ s, level, child }, { chat: fakeChat({ theme: "laal-grah", wrapper: "comet-catch", music: "off", pace: "steady", teacherMove: "notice", lang: "hinglish" }, 2600), env: ENV });
  const took = Date.now() - t0;
  assert.equal(late.source, "base"); assert.deepEqual(late.spec, base);
  assert.ok(took >= DRESS_DEADLINE_MS - 50 && took < DRESS_DEADLINE_MS + 400, `returned at ${took} ms`);
  const e429 = await dressSpecFor({ s, level, child }, { chat: async () => { const e = new Error("quota"); e.status = 429; throw e; }, env: ENV });
  assert.equal(e429.source, "base");
  const off = await dressSpecFor({ s, level, child }, { chat: async () => { throw new Error("must not be called"); }, env: { ...ENV, TAXILA_PLAY_DRESS: "off" } });
  assert.equal(off.source, "base"); assert.equal(off.why, "off");
});

test("dress: rules no model can override (language, brisk only when secure, music off for classes 4-5, the parent's verb)", async () => {
  const delta = { theme: "laal-grah", wrapper: "mine-sweep", music: "drive", pace: "brisk", teacherMove: "notice", lang: "en" };
  const s5 = sess({ classLevel: 5 }), level = currentLevel(s5, entry);
  const r = await dressSpecFor({ s: s5, level, child }, { chat: fakeChat(delta), env: ENV });
  assert.equal(r.spec.dress.lang, "hinglish"); assert.equal(r.spec.dress.pace, "steady"); assert.equal(r.spec.dress.music, "off"); assert.equal(r.spec.musicMood, "drive");
  const sec = await dressSpecFor({ s: sess({ secure: true }), level, child }, { chat: fakeChat(delta), env: ENV });
  assert.equal(sec.spec.dress.pace, "brisk");
  assert.equal(verbFor({}, { TAXILA_PLAY_VERB: "scan" }), "scan"); assert.equal(verbFor({ play_verb: "fire" }, { TAXILA_PLAY_VERB: "scan" }), "fire"); assert.equal(verbFor({}, {}), "fire");
});

test("dress: the model sees closed tags and telegraphic state, never the child's name or words", async () => {
  const cap = [];
  const s = sess(), level = currentLevel(s, entry);
  await dressSpecFor({ s, level, child }, { chat: fakeChat({ theme: "laal-grah", wrapper: "mine-sweep", music: "calm", pace: "steady", teacherMove: "notice", lang: "hinglish" }, 5, cap), env: ENV });
  assert.equal(cap.length, 1);
  const all = JSON.stringify(cap[0].messages);
  assert.ok(!/Meher|loves|rockets/.test(all), all);
  assert.deepEqual(JSON.parse(cap[0].messages[1].content).interest_tags, ["cricket", "space"]);
  assert.equal(cap[0].dep, "taxila-fast"); assert.equal(cap[0].opts.retries, 0); assert.ok(cap[0].opts.timeoutMs <= DRESS_DEADLINE_MS);
  assert.equal(cap[0].opts.schema.additionalProperties, false);
  for (const p of Object.values(cap[0].opts.schema.properties)) assert.ok(Array.isArray(p.enum) && p.enum.length);
  // the rule that must fire is the last line of the system shape (position is mechanism)
  assert.match(cap[0].messages[0].content.split("\n").at(-1), /^NEVER/);
  assert.deepEqual(interestTags(["Lego robots", "IPL"]), ["cricket", "science"]);
});

test("focusMal: the misconception the lesson just saw (kt_evidence, else reteach_attempts) is the next level's target", async () => {
  const q = async (sql, params) => {
    if (/from kt_evidence/.test(sql)) return params[1] === "L1" ? [{ misconception_id: "c5-maths-ch02-t01-m-whole-number-bias" }] : [];
    if (/from reteach_attempts/.test(sql)) return params[1] === "L2" ? [{ misconception_id: "c5-maths-ch02-t01-m-all-less-than-one" }] : [];
    if (/from kt_skill_state/.test(sql)) return [{ p_l: 0.8, display: "mastered" }];
    return [];
  };
  const a = await learnerInputs("c1", entry, q, "L1");
  assert.equal(a.focus, "c5-maths-ch02-t01-m-whole-number-bias"); assert.equal(a.secure, true);
  assert.equal((await learnerInputs("c1", entry, q, "L2")).focus, "c5-maths-ch02-t01-m-all-less-than-one");
  assert.equal((await learnerInputs("c1", entry, q, null)).focus, null);
  // the served level is built to show that belief whenever a level can
  for (const focus of Object.values(entry.misMap)) {
    const r = await startSession({ id: "c1", class_level: 5 }, { skillId: "c5-maths-ch02-t01-s2", lessonId: "Lx" }, async (sql) => (/from kt_evidence/.test(sql) ? [{ misconception_id: focus }] : []));
    assert.ok(r.level.proof.discriminates.includes(focus), `${focus}: level ${r.level.levelId} discriminates ${r.level.proof.discriminates}`);
    assert.equal(genRequest(r.session, entry).focus, focus);
  }
});

test("doors: the door preview IS the level /next serves; novelty moves off the level just played; teekha exists", () => {
  const logic = LOGIC["nishana/place"];
  let s = sess();
  const seen = [];
  for (let i = 0; i < 5; i++) {
    const cur = currentLevel(s, entry); seen.push(cur.sig);
    const g = nextBody(s, entry, "garam"), t = nextBody(s, entry, "teekha");
    const gl = currentLevel(g, entry), tl = currentLevel(t, entry);
    assert.notEqual(gl.sig, cur.sig, `level ${i}: the garam door repeats the level just played (${cur.sig})`);
    assert.ok(tl && (tl.levelId !== gl.levelId || tl.fade !== gl.fade), `level ${i}: no distinct teekha`);
    assert.ok(tl.fade > gl.fade || tl.proof.pFirstTry <= gl.proof.pFirstTry, "teekha is not harder");
    // regenerating the door's body gives the same level (the token rebuilds it)
    assert.equal(currentLevel(JSON.parse(JSON.stringify(g)), entry).levelId, gl.levelId);
    s = g;
    assert.ok(logic.validate(gl));
  }
  assert.ok(new Set(seen).size >= 3, `novelty: ${seen.join(" ")}`);
});

// C6 for Antariksh's words: every engine line passes the play guard and the lesson's never-rules floor, names only real
// conditions, never says the fire / scan verb (the parent's switch changes the button and the sound only), and is said
// only when the child sees the engine
import { readFileSync } from "node:fs";
import { reactionProblems } from "../shared/play.ts";
import { bank, floorOk, reactionFor } from "../server/play/react.js";
import { newHistory, pickReaction } from "../src/play/core/react.ts";

test("C6 · Antariksh lines: guarded, floor-clean, real conditions, no verb, ≤ 80 chars, every language", () => {
  const eng = JSON.parse(readFileSync(new URL("../data/play/reactions/antariksh.json", import.meta.url), "utf8")).engine.antariksh;
  const known = { goal: new Set(["place", "compare", "round"]), why: new Set(["landed_off", "look_again"]), landed: new Set(["yes", "both"]) };
  let n = 0;
  for (const [moment, langs] of Object.entries(eng)) {
    assert.deepEqual(Object.keys(langs).sort(), ["en", "hi", "hinglish"], moment);
    for (const shapes of Object.values(langs)) for (const sh of shapes) {
      const c = /^\{\?(\w+)=([^}]*)\}/.exec(sh);
      assert.ok(c, `${moment}: every engine shape is conditioned (${sh})`);
      for (const w of c[2].split("|")) assert.ok(known[c[1]]?.has(w), `${moment}: ${c[1]}=${w}`);
      const filled = sh.replace(/^\{\?[^}]*\}/, "").replace(/\{value\}/g, "2/3").replace(/\{gap\}/g, "1/6").replace(/\{gap_about\}/g, "1/6");
      assert.deepEqual(reactionProblems(filled), [], `${moment}: ${filled}`);
      assert.ok(floorOk(filled), `floor: ${filled}`);
      assert.doesNotMatch(filled, /\b(daago|fire|scan|shoot|maar|blast|destroy|kill)\b|दागो|स्कैन/i, filled);
      n++;
    }
  }
  assert.ok(n >= 30, `${n} shapes`);
});

test("C6 · engine lines replace the family's 2D words only when the device reports an engine that renders the level", () => {
  const level = { family: "nishana", mode: "place", goal: "place", levelId: "line-x-1", params: {} };
  const ms = [{ kind: "misconception_consequence", seq: 1, facts: { value: "2/3", at: "0.5", truth: "0.67", gap_about: "1/6" }, misconceptionId: "count-marks" }];
  const pick = (engine) => { const out = new Set(); for (let i = 0; i < 12; i++) { const r = pickReaction(bank(), ms, { lang: "hinglish", family: "nishana", mode: "place", goal: "place", engine, seed: `s${i}`, hist: newHistory(), nowS: 100 }); if (r) out.add(r.text); } return [...out]; };
  const with3d = pick("antariksh"), with2d = pick(null);
  assert.ok(with3d.length && with3d.every((t) => !/jhanda/i.test(t)), JSON.stringify(with3d));
  assert.ok(with2d.some((t) => /jhanda|rehta/i.test(t)), JSON.stringify(with2d));
  assert.ok(reactionFor(ms, { lang: "hinglish", level, engine: "antariksh", nowS: 100 }).reaction);
});

test("kill switches: TAXILA_PLAY=off admits nothing; TAXILA_PLAY_3D=off sends no engine dress (the 2D view plays)", async () => {
  const { entryFor: ef, hasPlay } = await import("../server/play/levels.js");
  const before = { p: process.env.TAXILA_PLAY, d: process.env.TAXILA_PLAY_3D };
  try {
    process.env.TAXILA_PLAY = "off";
    assert.equal(ef({ skillId: "c5-maths-ch02-t01-s2" }), null);
    assert.equal(hasPlay("c5-maths-ch02-t01-s2"), false);
    assert.equal(await startSession({ id: "c1", class_level: 5 }, { skillId: "c5-maths-ch02-t01-s2" }), null);
    delete process.env.TAXILA_PLAY;
    assert.ok(ef({ skillId: "c5-maths-ch02-t01-s2" }));
    process.env.TAXILA_PLAY_3D = "off";
    const s = sess(), level = currentLevel(s, entry);
    assert.equal(baseSpec(s, level, child), null);
    delete process.env.TAXILA_PLAY_3D;
    assert.ok(baseSpec(s, level, child));
  } finally {
    if (before.p === undefined) delete process.env.TAXILA_PLAY; else process.env.TAXILA_PLAY = before.p;
    if (before.d === undefined) delete process.env.TAXILA_PLAY_3D; else process.env.TAXILA_PLAY_3D = before.d;
  }
});
