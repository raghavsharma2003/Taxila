// HUMAN-VOICE B7: the LLM annotator never writes words, is validated in code against the row's bands, is cached, runs on
// the background quota lane, and only a MEMORY cache hit ever reaches a live plan.
import test from "node:test";
import assert from "node:assert/strict";
import { annotate, validateAnnotation, withAnnotation, cachedAnnotation, setAnnotationStore } from "../server/voice/expressive/annotate.js";
import { align, preserved } from "../server/voice/expressive/align.js";
import { momentPlan } from "../server/voice/expressive/moment.js";
import { expressiveSeam } from "../server/voice/expressive/seam.js";

const m = (o = {}) => ({ move: "explain", verdict: "ungraded", engagement: "engaged", teacherAffect: { display: "neutral_warm", intensity: 1, cause: "none", turn: 1 },
  bondStage: "first_sessions", safety: false, childLaughed: false, thinkAloud: false, band: "B3", lang: "hinglish", ...o });
const LINE = "Paudhe apni jadon se paani peete hain, aur patton se dhoop lete hain. Isse unka khana banta hai.";

test("validator: wrong count, unknown enum or duplicate index → null; values clamped to the row; clause 0 pause is 0; safety calm/slow", () => {
  const mp = momentPlan(m());
  const n = align(LINE, m()).clauses.length;
  const good = { clauses: Array.from({ length: n }, (_, i) => ({ i, emotion: "warm", pace: "normal", pause_before: "600" })) };
  const v = validateAnnotation(good, n, mp);
  assert.equal(v.length, n);
  assert.equal(v[0].pauseBeforeMs, 0);
  assert.ok(v.slice(1).every((c) => c.pauseBeforeMs <= Math.max(mp.sentencePause[1], mp.lastPause?.[1] ?? 0) * 1.25));
  assert.equal(validateAnnotation({ clauses: good.clauses.slice(1) }, n, mp), null);
  assert.equal(validateAnnotation({ clauses: [...good.clauses.slice(0, -1), { ...good.clauses[0] }] }, n, mp), null);
  assert.equal(validateAnnotation({ clauses: good.clauses.map((c) => ({ ...c, emotion: "whispering" })) }, n, mp), null);
  // an emotion off the row's arc is replaced by the row's own
  const off = validateAnnotation({ clauses: good.clauses.map((c) => ({ ...c, emotion: "playful" })) }, n, momentPlan(m({ move: "hint" })));
  assert.ok(off.every((c) => c.emotion !== "playful"));
});

test("annotate: strict schema on the background lane, cached; the overlay keeps the words, fillers and licences (HV-2)", async () => {
  const puts = new Map();
  setAnnotationStore({ get: async (k) => puts.get(k) ?? null, put: async (k, v) => { puts.set(k, v); } });
  process.env.AZURE_OPENAI_ENDPOINT ||= "https://example.invalid/openai/v1";
  process.env.AZURE_OPENAI_API_KEY ||= "k";
  const orig = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, init) => {
    const b = JSON.parse(init.body);
    seen.push(b);
    const n = b.messages[1].content.split("\n").filter((l) => /^\d+\. /.test(l)).length;
    const content = JSON.stringify({ clauses: Array.from({ length: n }, (_, i) => ({ i, emotion: i === n - 1 ? "warm" : "calm", pace: "slow", pause_before: "350" })) });
    return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: "stop" }], usage: { prompt_tokens: 200, completion_tokens: 40 } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const ann = await annotate(LINE, m());
    assert.ok(ann);
    assert.equal(seen[0].response_format.type, "json_schema");
    assert.equal(seen[0].response_format.json_schema.strict, true);
    assert.ok(!/paudhe/i.test(seen[0].messages[0].content), "the system prompt holds no reply words");
    const again = await annotate(LINE, m());
    assert.deepEqual(again, ann);
    assert.equal(seen.length, 1, "the second call is a cache hit");
    assert.deepEqual(cachedAnnotation(LINE, m()), ann);
    const plan = withAnnotation(align(LINE, m()), ann);
    assert.equal(plan.source, "annotator");
    assert.ok(preserved(plan, LINE));
    // the live seam uses the memory hit (0 ms) and still asserts the content law
    const live = expressiveSeam.planDelivery(m(), LINE);
    assert.equal(live.source, "annotator");
    assert.ok(preserved(live, LINE));
    // safety lines are never sent to the model
    assert.equal(await annotate("Childline 1098 pe call karo, abhi.", m({ safety: true })), null);
    assert.equal(seen.length, 1);
  } finally { globalThis.fetch = orig; }
});
