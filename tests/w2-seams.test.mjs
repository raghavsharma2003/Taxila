// W2 seam commit (BUILD-PLAN §4): every seam is a no-op until its owner fills it, every call site is guarded, and the
// contracts the nine W2 streams build against exist with the agreed shapes. These tests pin the SEAM, not the owners'
// behaviour: when an owner fills a seam it updates the "until filled" assertions for its own module in the same change.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("seamSafe: a throw, a rejection or undefined becomes the fallback; a value passes through", async () => {
  const { seamSafe } = await import("../server/seam-safe.js");
  const warn = console.warn; console.warn = () => {};
  try {
    assert.equal(seamSafe("t", () => { throw new Error("boom"); }, "fb"), "fb");
    assert.equal(seamSafe("t", () => undefined, "fb"), "fb");
    assert.equal(seamSafe("t", () => 7, "fb"), 7);
    assert.equal(await seamSafe("t", () => Promise.reject(new Error("x")), "fb"), "fb");
    assert.equal(await seamSafe("t", () => Promise.resolve(undefined), "fb"), "fb");
    assert.equal(await seamSafe("t", () => Promise.resolve(3), "fb"), 3);
  } finally { console.warn = warn; }
});

test("server seams are no-ops until filled (studio, relational, expressive, purpose, lanes, realtime)", async () => {
  const { studioSeam } = await import("../server/studio/seam.js");
  assert.equal(studioSeam.prefetch({}), undefined);
  assert.equal(studioSeam.statusFacts("L1"), null);
  assert.equal(studioSeam.onReveal({}), undefined);

  const { relationalSeam } = await import("../server/relational/seam.js");
  assert.equal(await relationalSeam.snapshot("c1", { classLevel: 5 }), null);
  assert.equal(relationalSeam.decide({ lessonId: "L", childId: "c", turn: 1, childText: "", cls: null, move: "probe", lane: "text", safety: false }), null);
  assert.deepEqual(relationalSeam.onLessonEnd({ id: "c" }, { lessonId: "L", childId: "c", endedBy: "client", turns: 3 }), []);

  const { expressiveSeam } = await import("../server/voice/expressive/seam.js");
  assert.equal(expressiveSeam.planDelivery(null, "Dekho, 3 aur 4."), null);

  const { purposeSeam } = await import("../server/lesson/purpose.js");
  assert.equal(await purposeSeam.routeAsk({ child: { id: "c", class_level: 5 }, purpose: "doubt", firstText: "1/2 bada ya 1/4?" }), null);
  assert.equal(purposeSeam.practiceSet({ child: { id: "c", class_level: 5 }, purpose: "practice", kit: {}, ledger: {}, now: 0 }), null);

  const lanes = await import("../server/lanes.js");
  assert.deepEqual([...lanes.QUOTA_LANES], ["hot", "background"]);
  assert.equal(lanes.admit({ quotaLane: "background", deployment: "taxila-fast", kind: "chat" }), undefined);
  assert.equal(lanes.settle({ quotaLane: "hot", deployment: "taxila-fast", kind: "chat", status: 200 }), undefined);

  const { realtimeSeam } = await import("../server/voice/realtimeSession.js");
  const session = { type: "realtime", model: "m", include: ["item.input_audio_transcription.logprobs"] };
  assert.equal(realtimeSeam.shapeSession(session, { kind: "lesson" }), session, "the session is minted unchanged");
  assert.equal(realtimeSeam.onMintError(new Error("429"), { kind: "lesson" }), null);
});

test("server/learner/writer.js re-exports the relational writers (one import point)", async () => {
  const writer = await import("../server/learner/writer.js");
  const rel = await import("../server/relational/writers.js");
  assert.equal(writer.RELATIONAL_TABLES, rel.RELATIONAL_TABLES);
  assert.deepEqual([...rel.RELATIONAL_TABLES], []);
});

test("lesson.js keeps every W2 call site, each guarded by seamSafe", () => {
  const src = read("server/routes/lesson.js");
  for (const call of ["purpose.routeAsk", "purpose.practiceSet", "relational.snapshot", "studio.prefetch", "realtime.shapeSession",
    "realtime.onMintError", "studio.statusFacts", "relational.decide", "expressive.planDelivery", "studio.onReveal", "relational.onLessonEnd"]) {
    assert.ok(src.includes(`seamSafe("${call}"`), `missing guarded call site ${call}`);
  }
  // relational rows land before the Conductor's (its ingest locks child_seq last: the global lock order)
  assert.ok(/tx\(\[\.\.\.writes, \.\.\.relStmts, \.\.\.hookStmts\]\)/.test(src));
  const voice = read("server/routes/voice.js");
  assert.ok(voice.includes('seamSafe("realtime.shapeSession"'), "voice.js STT session goes through the realtime seam");
  // azure.js: the quota lane is its own option (lane already selects the endpoint), and both lane hooks are guarded
  const azure = read("server/azure.js");
  assert.ok(/import \{ admit, settle \} from "\.\/lanes\.js"/.test(azure));
  assert.ok(/lane = "CHAT", quotaLane \}/.test(azure));
});

test("the W2 contracts exist with the agreed shapes", () => {
  const studio = read("shared/studio.ts");
  for (const s of ['"whiteboard"', "export interface WhiteboardScript", "export type WbOp", 'op: "stroke"', 'op: "arrow"', 'op: "label"', 'op: "numwork"',
    "startMs: number; endMs: number", 'anchor: "line_audio_start"', "export interface StudioSlot", "export type StudioArtifact", "export const STAGE_DEFAULT",
    "export interface StudioIntent", "export type StudioStatus", "export interface StudioFacts", "export type StudioWire", "export interface StudioTurnView"]) {
    assert.ok(studio.includes(s), `shared/studio.ts lacks ${s}`);
  }
  const contracts = read("shared/contracts.ts");
  for (const s of ["beat?: UiBeat", "studioSlot?: StudioSlot", "teacherAffect?: TeacherAffectUi", '"pad" | "studio"', "studio?: TurnStudio", "moment?: Moment",
    "export interface AvatarVoiceEvent", 'kind: "laugh" | "breath" | "hum"; atMs: number', "export interface DeliveryPlan"]) {
    assert.ok(contracts.includes(s), `shared/contracts.ts lacks ${s}`);
  }
  assert.ok(read("shared/learner.ts").includes('"weave" | "studio"'), "the evidence source enum gains studio");
  const brain = read("shared/brain.ts");
  for (const s of ["export type BeatType", "export interface Moment", "export interface Proposal", "export interface TurnPlan", "export type QuotaLane"]) assert.ok(brain.includes(s), s);
  const rel = read("shared/relational.ts");
  for (const s of ["export interface BondSnapshot", "export interface RelationalDirective", "export interface TeacherAffect", "export interface RelDecideInput"]) assert.ok(rel.includes(s), s);
});

test("shared/bands.ts is the one band table (re-exported from shared/learner.ts)", async () => {
  const bands = await import("../shared/bands.ts");
  const learner = await import("../shared/learner.ts");
  assert.equal(bands.BANDS, learner.BANDS);
  assert.deepEqual([4, 5, 6, 7].map(bands.band4Of), ["B2", "B3", "B3", "B3"]);
  assert.throws(() => bands.band4Of(10));
});

test("fitStage: the box keeps the aspect, fits inside the area and is centred (360 x 800 phone tray through desktop)", async () => {
  const { fitStage, validStage } = await import("../src/studio/fit.ts");
  const areas = [{ w: 344, h: 248 }, { w: 344, h: 360 }, { w: 396, h: 300 }, { w: 720, h: 420 }, { w: 1180, h: 520 }, { w: 1600, h: 700 }, { w: 300, h: 900 }];
  const designs = [{ w: 400, h: 300 }, { w: 300, h: 400 }, { w: 1600, h: 900 }, { w: 400, h: 400 }];
  for (const a of areas) for (const d of designs) for (const inset of [0, 8]) {
    const f = fitStage(a, d, { inset, maxScale: 3 });
    assert.ok(f.w > 0 && f.h > 0, `${JSON.stringify({ a, d })}`);
    assert.ok(f.x >= inset && f.y >= inset && f.x + f.w <= a.w - inset && f.y + f.h <= a.h - inset, `inside ${JSON.stringify({ a, d, f })}`);
    assert.ok(Math.abs(f.w / f.h - d.w / d.h) <= 2 / Math.min(f.w, f.h) + 1e-9, `aspect ${JSON.stringify({ d, f })}`);
    assert.ok(Math.abs((a.w - f.w - f.x) - f.x) <= 1 && Math.abs((a.h - f.h - f.y) - f.y) <= 1, `centred ${JSON.stringify({ a, f })}`);
    assert.ok(f.scale <= 3);
  }
  assert.deepEqual(fitStage({ w: 10, h: 10 }, { w: 400, h: 300 }, { inset: 8 }), { w: 0, h: 0, x: 0, y: 0, scale: 0 });
  assert.deepEqual(validStage({ w: 5, h: 300 }, { w: 400, h: 300 }), { w: 400, h: 300 });
  assert.deepEqual(validStage({ w: 600, h: 300 }, { w: 400, h: 300 }), { w: 600, h: 300 });
});
