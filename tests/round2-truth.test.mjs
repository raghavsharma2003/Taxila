// round2 truth (docs/design/round2/truth): the behaviour the patches 01-05 change, each pinned to the production failure
// it removes. Pure (no network, no database).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { getKit } from "../server/content/index.js";
import { endEvents } from "../server/learner/live.js";
import { fold, newLedger } from "../server/learner/kt/ledger.js";
import { classify } from "../server/director/classify.js";
import { cls } from "./fixtures/kit.mjs";

describe("round2 truth", () => {
  // prod w1c-reteach 10/13 (2026-10-06): V1.4's pace park took the skill out of the lesson while W1-C's re-check was
  // pending, so the ladder never decided again and the arm in flight never resolved. HEAD: 80/120 skill-runs stuck.
  test("a pace-parked skill never keeps a re-teach arm in flight: the ladder decides (descent or engine park), within 9 tries", async () => {
    const K = await getKit("c5-maths-ch02-t01", { generate: false });
    const prereqs = Object.fromEntries(K.skills.map((s) => [s.id, [{ skillId: "c4-maths-ch05-t01-s1", pL: 0.3, seen: false }]]));
    const CTX = { firstName: "Kabir", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a toy" }, ageBand: "10-15", lang: "english",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: "t", nextTitle: "n", reteach: { attempts: [], prereqs } };
    const comp = Object.fromEntries(K.skills.map((s) => [s.id, { belief: { skillId: s.id, pL: 0.2, U: 0.2, T: 0.2, misconception: { mStar: 0, mId: null, verified: false } } }]));
    let stuck = 0, decided = 0, maxTries = 0, optionRecheck = 0;
    for (let seed = 1; seed <= 12; seed++) {
      let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed, now: 0, comp }), { event: "start", kit: K, now: 0, comp });
      for (let i = 0; i < 40 && !r.end; i++) {
        const prev = r.state;
        const active = prev.activeItemId ? K.items.find((x) => x.id === prev.activeItemId) ?? null : null;
        r = step(prev, { event: "turn", kit: K, cls: cls(prev.activeItemId ? "incorrect" : "no_evidence"), now: (prev.turn + 1) * 20_000, comp });
        // an engine re-teach on an options item never re-asks the same options (elimination; the fold grades try 1 only)
        if (r.move?.kind === "reteach" && prev.activeItemId?.startsWith("diag:") && r.state.lastReteach?.turn === r.state.turn && r.state.lastReteach?.armId) {
          assert.notEqual(r.state.activeItemId, prev.activeItemId, `seed ${seed}: the diagnostic stayed on the card after its re-teach`);
          optionRecheck++;
        }
        void active;
      }
      const s = r.state;
      for (const k of Object.keys(s.lastArmBySkill ?? {})) {
        const last = s.lastArmBySkill[k];
        const inFlight = last && !String(last).startsWith("descent:") && !(s.parked ?? []).includes(k);
        if (s.pace?.parkedSkills?.includes(k) && inFlight) stuck++;
        else decided++;
        maxTries = Math.max(maxTries, s.pace?.tries?.[k] ?? 0);
      }
    }
    assert.equal(stuck, 0, "a skill was left with an arm in flight and no decision");
    assert.ok(decided > 0);
    assert.ok(maxTries <= 9, `at most 9 tries on a skill (V1.4 wheel-spin line is 10): ${maxTries}`);
    void optionRecheck;
  });

  // contributing cause of the unresolved attempt: a re-teach on a diagnostic re-asked the same 2 options (elimination, and
  // the fold grades the first try only), so its re-check could never be evidence
  test("a re-teach on an options item retires it and re-checks with a fresh produce item on the same skill", async () => {
    const K = await getKit("c5-maths-ch02-t01", { generate: false });
    const M = K.misconceptions[0];
    const CTX = { firstName: "Kabir", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a toy" }, ageBand: "10-15", lang: "english",
      interests: [], firstMeeting: true, hasCallback: false, topicTitle: "t", nextTitle: "n", reteach: { attempts: [], prereqs: {} } };
    const comp = Object.fromEntries(K.skills.map((s) => [s.id, { belief: { skillId: s.id, pL: 0.2, U: 0.2, T: 0.2, misconception: { mStar: 0.99, mId: M.id, verified: true } } }]));
    let seen = 0, diagState = null;
    const retired = (prev, r) => {
      assert.notEqual(r.state.activeItemId, prev.activeItemId, "the diagnostic is not re-asked");
      assert.ok(r.state.itemsDone.includes(prev.activeItemId));
      if (r.state.nextItemId) assert.ok(!K.items.find((x) => x.id === r.state.nextItemId)?.options, "the re-check is a produce item");
    };
    for (let seed = 1; seed <= 6; seed++) {
      let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed, now: 0, comp }), { event: "start", kit: K, now: 0, comp });
      for (let i = 0; i < 40 && !r.end; i++) {
        const prev = r.state;
        const diag = prev.activeItemId?.startsWith("diag:");
        if (diag) diagState ??= prev;
        r = step(prev, { event: "turn", kit: K, cls: diag ? cls("misconception", { misconceptionId: prev.activeItemId.slice(5) }) : cls(prev.activeItemId ? "incorrect" : "no_evidence"), now: (prev.turn + 1) * 20_000, comp });
        if (diag && r.move?.kind === "reteach") { seen++; retired(prev, r); }
      }
    }
    // round3 truth (patch 02): with M confirmed, the engine's first re-teach IS the kit's primary arm, and the re-teach this
    // loop used to see on the diagnostic was the kit path repeating that same arm (6/6 seeds on HEAD), which is no longer
    // allowed. The options-item rule is checked on the same diagnostic with nothing used yet: its re-teach retires it.
    assert.ok(diagState, "the fixture posed a diagnostic");
    const fresh = { ...diagState, armsUsed: [], retaught: [], reteachCool: {}, lastArmBySkill: {}, failedArms: {} };
    const r = step(fresh, { event: "turn", kit: K, cls: cls("misconception", { misconceptionId: fresh.activeItemId.slice(5) }), now: (fresh.turn + 1) * 20_000, comp });
    assert.equal(r.move?.kind, "reteach", "a re-teach on a diagnostic happened");
    retired(fresh, r);
    void seen;
  });

  // prod w1b-mounts (2026-10-06): a wrong answer on an OPEN item, then the lesson end, wrote no row at all
  test("the lesson end closes an open episode with wrong tries as a leave (P15, C4), with its via; nothing else", () => {
    const st = (ep) => ({ kt: { ep } });
    const kit = { topicType: "T3", verified: true };
    const c = (ep) => endEvents({ lessonId: "L1", startedAt: 0, now: 60_000, state: st(ep), kit });
    const [e] = c({ itemId: "it-1", skillId: "sk-1", wrong: 2, mis: "m-1", closed: false, mcq: false, via: "module" });
    assert.ok(e, "an event");
    assert.equal(e.target, "sk-1");
    assert.equal(e.via, "module");
    assert.equal(e.misconceptionId, "m-1");
    assert.equal(e.episodeId, "L1:it-1");
    assert.deepEqual(c({ itemId: "it-1", skillId: "sk-1", wrong: 2, closed: true }), []);
    assert.deepEqual(c({ itemId: "it-1", skillId: "sk-1", wrong: 1, closed: false, mcq: true }), []);
    assert.deepEqual(c({ itemId: "it-1", skillId: "sk-1", wrong: 0, closed: false }), []);
    assert.deepEqual(c(null), []);
  });

  // prod w1c-three-day 16/23 (2026-10-06): the conjunctive teach-back credited (b) to skillIds[0] only, so the skill the
  // child had done unaided never reached learned_today and no check was ever due
  test("a passed teach-back credits the generative pass to every skill it covers", () => {
    const S1 = "c5-maths-ch01-t01-s1", S2 = "c5-maths-ch01-t01-s2";
    const t = new Date(Date.UTC(2026, 9, 1, 4, 30)).toISOString();
    let n = 0;
    const ev = (o) => ({ id: `e${++n}`, seq: n, sessionId: "d0", sessionStartAt: t, at: t, episodeId: `d0-${n}`, skillIds: [S2], target: S2, itemKey: `k${n}`,
      cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o });
    const tb = ev({ cls: "probe.teachback", skillIds: [S1, S2], target: S1, grader: "llm", itemKey: `${S1}:P1` });
    const L = fold(newLedger({ childId: "c", classLevel: 5 }), [ev({}), ev({}), ev({}), ev({}), tb]);
    assert.equal(L.skills[S2].flags.generative, true);
    assert.equal(L.skills[S2].display, "learned_today");
    assert.ok(L.skills[S2].anchorAt, "anchored: its delayed check is now scheduled");
  });

  // prod owner-1 (2026-10-06): the model leg credited "tens first" for "25, 38, 52"
  test("classify: a model credit the words cannot carry is no evidence (corroborate is wired in)", async () => {
    const item = { id: "c2-maths-ch03-t02-i03", kind: "practice", prompt_en: "Put these in order from smallest to biggest: 52, 25, 38.", prompt_hi: "", answer: "25, 38, 52", acceptable: ["25 38 52"] };
    const target = { mode: "item", item, key: item.answer, also: item.acceptable, ideas: [], misconceptions: [], open: false };
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ match: "key", confidence: 0.95, off_topic: false, distress: false, asks_for_answer: false, wants_to_stop: false }) } }] }), { status: 200, headers: { "content-type": "application/json" } });
    const env = { ...process.env };
    process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid"; process.env.AZURE_OPENAI_API_KEY ||= "x"; process.env.TAXILA_CLASSIFY_FALLBACK = "0";
    try {
      const r = await classify({ target, childText: "tens first", typed: true, classLevel: 2, heard: item.prompt_en, trace: [] });
      assert.equal(r.outcome, "no_evidence");
      assert.match(String(r.corroboration), /unsupported_credit/);
      const ok = await classify({ target, childText: "pehle 25, phir 38, phir 52", typed: true, classLevel: 2, heard: item.prompt_en, trace: [] });
      assert.equal(ok.outcome, "correct");
    } finally { globalThis.fetch = realFetch; for (const k of Object.keys(process.env)) if (!(k in env)) delete process.env[k]; Object.assign(process.env, env); }
  });
});
