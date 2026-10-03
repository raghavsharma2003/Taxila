// PRODUCT-DESIGN-V2 §14 B2: the pure parts of the child home, progress and the image pipeline. (The screens
// themselves are proven in the browser by tests/e2e-design-b2.mjs, which is standalone.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUDGETS, heightFor, lampHueShare, lintVerdict, QUALITIES, shipPlan } from "../scripts/gen-assets.mjs";
import { lint } from "../scripts/lint-ui.mjs";
import { fallbackPlan, fromServer, isPlanResponse, practiceOffered, RESUME_BY_ID } from "../src/child/plan.ts";
import { bestCard, normaliseMap, offerOf } from "../src/child/api.ts";
import { chapterLines, gardenBeds, layoutSky } from "../src/child/progress/layout.ts";
import { visibleEdges } from "../src/child/progress/prereqs.ts";
import { CHILD_STRINGS, clock, t } from "../src/child/copy.ts";
import { interestIds } from "../src/child/interests.ts";
import { chromeViolation } from "../src/ui/copy.ts";

const asset = (o) => ({ ships: true, generator: "codex", alpha: false, lint: "lamp-hue", ...o });

test("gen-assets: §12 budget class and 1x size per category", () => {
  assert.deepEqual(shipPlan(asset({ id: "bg/home-young-wide", category: "bg", width: 2560, height: 1440 })), { kind: "image", budget: "bg", width: 1280, crop: null, lossy: "bg" });
  assert.equal(shipPlan(asset({ id: "bg/home-young-phone", category: "bg", width: 1440, height: 2560 })).budget, "bgPhone");
  assert.equal(shipPlan(asset({ id: "bg/sky-panel", category: "bg", width: 2400, height: 1600 })).crop.budget, "bgPhone", "a wide scene with no painted phone version gets a 360-dp crop");
  assert.equal(shipPlan(asset({ id: "avatars/red-panda", category: "avatars", width: 512, height: 512, alpha: true })).budget, "small");
  assert.equal(shipPlan(asset({ id: "picto/home", category: "picto", width: 256, height: 256, alpha: true })).width, 64);
  assert.equal(shipPlan(asset({ id: "states/garden-empty", category: "states", width: 1024, height: 768, alpha: true })).budget, "spot");
  assert.equal(shipPlan(asset({ id: "brand/app-icon", category: "brand", width: 1024, height: 1024 })).kind, "passthrough");
  assert.equal(shipPlan(asset({ id: "teacher-ref/x", category: "teacher-ref", ships: false })), null, "teacher references never ship");
  assert.deepEqual(BUDGETS, { bg: 120 * 1024, bgPhone: 60 * 1024, spot: 40 * 1024, small: 16 * 1024 });
  assert.equal(QUALITIES.bg[0], 80, "q 80 for backgrounds first (§12 step 1)");
  assert.equal(heightFor({ width: 2560, height: 1440 }, 1280), 720);
});

test("gen-assets: the lamp-hue pixel lint (§12 step 4) and its verdicts", () => {
  const px = (r, g, b, n) => Array.from({ length: n }, () => [r, g, b, 255]).flat();
  const marigold = Uint8Array.from(px(0xff, 0xb2, 0x1e, 100));
  const paper = Uint8Array.from(px(0xf6, 0xf3, 0xec, 100));
  assert.equal(lampHueShare(marigold), 1);
  assert.equal(lampHueShare(paper), 0, "cream light is not the lamp");
  const twoPct = Uint8Array.from([...px(0xff, 0xb2, 0x1e, 2), ...px(0x24, 0x34, 0x6e, 98)]);
  assert.equal(lampHueShare(twoPct), 0.02);
  const transparent = Uint8Array.from(Array.from({ length: 50 }, () => [0xff, 0xb2, 0x1e, 0]).flat());
  assert.equal(lampHueShare(transparent), 0, "transparent pixels are not counted");
  assert.equal(lintVerdict(0.015, "lamp-hue"), "pass");
  assert.equal(lintVerdict(0.02, "lamp-hue"), "fail");
  assert.equal(lintVerdict(0.02, "skin-review"), "report", "skin is reported, not failed");
});

const PLAN = {
  state: "done", homeState: "done", plan: { openLesson: null, window: { from: "07:00", to: "20:30" } }, topic: null, resume: null,
  today: { lessonId: "L1", summary: { title: "t", shortTitle: null, cards: [{ kind: "item", ask: "q", answer: "a", tick: true, withHelp: false, turnSeq: 1 }], nextTitle: null, face: "warm", revoiceSeq: null } },
  capRemaining: 10, capMin: 30, usedMin: 20, opensAt: null, packReady: null, day: "2026-10-03", tz: "Asia/Kolkata",
  teacher: { id: "arjun" }, surfaces: { map: false, notebook: true, resume: true }, source: { dayPlan: null },
};

test("home plan: the server state is shown as-is; the done DidCard and the surfaces carry over", () => {
  assert.ok(isPlanResponse(PLAN));
  assert.equal(isPlanResponse({ state: "maybe" }), false);
  const p = fromServer(PLAN);
  assert.equal(p.state, "done");
  assert.equal(p.did.length, 1);
  assert.equal(p.surfaces.map, false, "Only this session hides the map");
  assert.equal(fromServer({ ...PLAN, state: "start", resume: { lessonId: "x", ask: null, topicTitle: "t" } }).resume, null, "resume only in the resume state");
});

test("home plan: no signal that lies (resume until it can resume; offline practice only with a pack; nothing before the answer)", () => {
  const r = fromServer({ ...PLAN, state: "resume", today: null, resume: { lessonId: "L9", ask: "q", topicTitle: "t" } });
  if (!RESUME_BY_ID) {
    assert.equal(r.state, "start", "a Continue card whose tap starts a new lesson would lie: shown as start");
    assert.equal(r.resume, null);
  }
  assert.equal(r.serverState, "resume", "the server's own state is kept");
  assert.equal(fromServer(PLAN).packReady, false, "packReady null = no offline pack");
  assert.equal(practiceOffered({ source: "loading", state: "start", packReady: false }), false, "never before the plan answered");
  assert.equal(practiceOffered({ source: "server", state: "offline", packReady: false }), false, "offline without a pack: no Practice");
  assert.equal(practiceOffered({ source: "server", state: "offline", packReady: true }), true);
  assert.equal(practiceOffered({ source: "server", state: "capped", packReady: false }), false);
  assert.equal(practiceOffered({ source: "server", state: "done", packReady: false }), true);
});

test("home plan fallback (audit #9): never an empty card", () => {
  assert.equal(fallbackPlan({ online: false, cached: null, doneToday: false }).state, "offline");
  assert.equal(fallbackPlan({ online: true, cached: null, doneToday: true }).state, "done", "a plan outage after a lesson never offers a second one");
  const start = fallbackPlan({ online: true, cached: { topic: { id: "c5-maths-ch01-t01", title: "T", shortTitle: null, chapter: "C", subject: "maths", minutes: 25 }, surfaces: { map: true, notebook: false, resume: true }, day: "x" }, doneToday: false });
  assert.equal(start.state, "start");
  assert.equal(start.topic.id, "c5-maths-ch01-t01", "the last topic the plan returned on this device");
  assert.equal(start.surfaces.notebook, false, "the parent's choice survives the outage");
  assert.equal(fallbackPlan({ online: true, cached: null, doneToday: false }).topic, null, "no cache: \"Start a lesson\"");
});

test("map read: a wrong shape is an empty map, hidden stays hidden, empty = nothing touched", () => {
  assert.deepEqual(normaliseMap(null, "sky"), { mode: "sky", hidden: false, subjects: [], skills: [], empty: true });
  assert.equal(normaliseMap({ hidden: true }, "garden").hidden, true);
  const m = normaliseMap({ mode: "sky", subjects: [{ subject: "maths", book: "b", chapters: [{ id: "c6-maths-ch01", number: 1, title: "x", sealed: true, here: false, secure: 1, total: 1,
    topics: [{ id: "t1", title: "t", skills: [{ skillId: "s1", title: "s", topicId: "t1", chapter: "x", subject: "maths", status: "mastered", state: "secure", recheckScheduled: false },
      { skillId: "bad", state: "weird" }] }] }] }] }, "sky");
  assert.equal(m.skills.length, 1, "unknown states are dropped");
  assert.equal(m.empty, false);
  assert.equal(normaliseMap({ subjects: [{ subject: "m", chapters: [{ id: "c", topics: [{ id: "t", skills: [{ skillId: "s", state: "not_started" }] }] }] }] }, "sky").empty, true);
});

test("Garden: only started beds (+ the class's chapter): no field of empty plots (§4.8)", () => {
  const ch = (id, states, here = false) => ({ id, number: 1, title: id, sealed: false, here, secure: 0, total: states.length, topics: [{ id: `${id}-t`, title: "t", skills: states.map((s, i) => ({ skillId: `${id}${i}`, state: s })) }] });
  assert.deepEqual(gardenBeds([ch("a", ["not_started"]), ch("b", ["practising"]), ch("c", ["not_started"], true)]).map((c) => c.id), ["b", "c"]);
});

test("Sky: layout is deterministic, stars keep ≥ 48 px apart at 360, labels break on whole words", () => {
  const ch = (id, n, here = false) => ({ id, number: 1, title: "We the Travellers — I", sealed: false, here, secure: 0, total: n,
    topics: [{ id: `${id}-t`, title: "t", skills: Array.from({ length: n }, (_, i) => ({ skillId: `${id}${i}`, topicId: `${id}-t`, state: "practising" })) }] });
  const a = layoutSky([ch("a", 4), ch("b", 2, true), ch("c", 7)], 2);
  const b = layoutSky([ch("a", 4), ch("b", 2, true), ch("c", 7)], 2);
  assert.deepEqual(a, b);
  assert.equal(a.width, 360);
  for (const p of a.stars) for (const q of a.stars) {
    if (p === q) continue;
    assert.ok(Math.hypot(p.x - q.x, p.y - q.y) >= 48 * (a.width / 360) - 0.5, "star targets must not overlap");
  }
  assert.deepEqual(chapterLines("We the Travellers — I"), ["We the Travellers I"], "no dashes in chrome");
  assert.ok(chapterLines("Data Handling and Presentation").every((l) => l.length <= 20));
  assert.equal(chapterLines("Data Handling and Presentation").join(" "), "Data Handling and Presentation", "never a cut word");
});

test("Sky edges are real prerequisites between visible topics only", () => {
  const pre = new Map([["t2", ["t1", "c4-old"]], ["t3", ["t2"]], ["t9", ["t1"]]]);
  assert.deepEqual(visibleEdges(pre, new Set(["t1", "t2", "t3"])), [["t1", "t2"], ["t2", "t3"]]);
});

test("Notebook page: a verified card first; Your teacher: real characters only, server order", () => {
  const cards = [{ answer: "x", tick: false, withHelp: false }, { answer: "y", tick: true, withHelp: true }, { answer: "z", tick: true, withHelp: false }];
  assert.equal(bestCard(cards).answer, "z");
  assert.equal(bestCard([]), null);
  assert.deepEqual(offerOf({ tutors: ["arjun", "nobody", "asha"] }), ["arjun", "asha"]);
});

test("child chrome copy is English (G-EN-1) and never makes her a person with a life (§6.3.3, §8)", () => {
  for (const s of CHILD_STRINGS) {
    assert.equal(chromeViolation(s), null, `"${s}"`);
    // "Nobody sees a score." is §3.3's own honest placement line (it promises there is none)
    if (s !== t("olderStart")) assert.doesNotMatch(s, /\b(is resting|is sleeping|is waiting|misses you|come back|streak|coins|score|level up|unlock)\b/i, `"${s}"`);
    assert.doesNotMatch(s, /!/, `no exclamation marks: "${s}"`);
    assert.doesNotMatch(s, /\s[—–-]\s/, `no dashes: "${s}"`);
  }
  assert.equal(t("teacherLabel", { T: "Arjun" }), "Arjun · AI teacher");
  assert.equal(t("resting", { time: clock("07:00") }), "Lessons open again at 7:00 am.");
  assert.equal(clock("20:30"), "8:30 pm");
});

test("interests: the parent's onboarding picks map onto the Hello pictures", () => {
  assert.deepEqual(interestIds(["Cricket", "Space", "Machines", "animals"]), ["cricket", "space", "animals"]);
  assert.deepEqual(interestIds(undefined), []);
});

test("lint-ui: 0 findings in the B2 paths (child screens, progress, art, onboarding)", () => {
  const f = lint({ paths: ["src/child/screens", "src/child/progress", "src/child/art.tsx", "src/child/chrome.tsx", "src/child/pictos.tsx", "src/child/copy.ts",
    "src/child/child.css", "src/child/ChildShell.tsx", "src/onboarding"] });
  assert.deepEqual(f.map((x) => `${x.rule} ${x.file}:${x.line} ${x.text}`), []);
});
