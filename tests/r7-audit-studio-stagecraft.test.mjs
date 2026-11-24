// Audit STUDIO-11, -08 and -10 (2026-11-10).
// STUDIO-11: with no judge lane (FORGE3_QA_URL unset) the tray gate refuses every generated spec, so Stagecraft must not
// launch (pay for) the spec rung; with one, every rung is allowed as before.
// STUDIO-08: one default for Stagecraft's mode — the host built without a mode follows stagecraftMode() ("on"), not "off".
// STUDIO-10: the picture lane forgets a lesson's count, untold failure and finished jobs when the seam forgets the lesson.
import { test } from "node:test";
import assert from "node:assert/strict";
import { judgeRungsCfg, RUNGS_WITHOUT_JUDGE, stagecraftMode, startStagecraft, stopStagecraft } from "../server/stagecraft/lesson.js";
import { StagecraftHost } from "../server/stagecraft/host.js";
import { createBuilders } from "../server/stagecraft/builders.js";
import { config, preferredRung, initPortfolio } from "../server/stagecraft/conductor.js";
import { _setPictureDeps, _resetPictures, startPicture, jobOf, forgetPictureLesson, PICTURES_PER_LESSON } from "../server/studio/picture.js";

const instantOnly = () => ({ instant: createBuilders().instant, generatedSpec: async () => ({ ok: false }), image: async () => ({ ok: false }), liveCodegen: async () => ({ ok: false }), library: async () => ({ ok: false }) });

test("STUDIO-11: no judge lane → no generated_spec rung (the host's config and the preferred rung); a judge lane → every rung", async () => {
  assert.deepEqual(judgeRungsCfg({}), { rungs: RUNGS_WITHOUT_JUDGE });
  assert.ok(!RUNGS_WITHOUT_JUDGE.includes("generated_spec"));
  assert.deepEqual(judgeRungsCfg({ FORGE3_QA_URL: "https://qa.invalid" }), {});
  const cat = { rs4: { "fraction-bars": { kind: "game" } } };
  const S = initPortfolio("L", 0);
  assert.equal(preferredRung(S, { archetype: "fraction-bars", kinds: ["game"] }, config({ catalog: cat })), "generated_spec");
  assert.equal(preferredRung(S, { archetype: "fraction-bars", kinds: ["game"] }, config({ catalog: cat, ...judgeRungsCfg({}) })), "engine_default");
  const had = process.env.FORGE3_QA_URL;
  if (had === undefined) {
    const h = await startStagecraft({ lessonId: "audit-s11" }, { mode: "on", builders: instantOnly(), timerMs: 60_000 });
    try { assert.ok(h && !h.cfg.rungs.includes("generated_spec"), "the lesson's host never launches a spec"); } finally { stopStagecraft("audit-s11"); }
  }
});

test("STUDIO-08: a host built without a mode follows stagecraftMode() (default on)", () => {
  assert.equal(stagecraftMode({}), "on");
  const h = new StagecraftHost({ lessonId: "audit-s08", catalog: {}, builders: instantOnly() });
  assert.equal(h.mode, stagecraftMode());
});

test("STUDIO-10: forgetting a lesson drops its picture count, failure and finished jobs", async () => {
  _resetPictures();
  try {
    _setPictureDeps({ generate: async () => { throw Object.assign(new Error("x"), { code: "rate" }); }, moderate: async () => 0 });
    let ids = [];
    for (let i = 0; i < PICTURES_PER_LESSON; i++) {
      const r = startPicture("audit-s10", ["apple", "mango", "kite", "boat", "tree", "cup"][i], { reveal() {} });
      assert.equal(r.ok, true, JSON.stringify(r)); ids.push(r.job.id);
      await new Promise((ok) => setTimeout(ok, 5));
    }
    assert.equal(startPicture("audit-s10", "drum", { reveal() {} }).check, "budget");
    assert.ok(ids.some((id) => jobOf(id)));
    forgetPictureLesson("audit-s10");
    assert.ok(ids.every((id) => !jobOf(id)), "its finished jobs are gone");
    assert.notEqual(startPicture("audit-s10", "drum", { reveal() {} }).check, "budget", "its count is gone");
  } finally { _resetPictures(); _setPictureDeps({ generate: null, moderate: null }); }
});
