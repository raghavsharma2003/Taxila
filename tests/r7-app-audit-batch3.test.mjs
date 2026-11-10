// Round 7 whole-project audit, app area, batch 3 (APP-23 to 35, 49 to 53): pure logic is run; React screens are read.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { dockForPlan } from "../src/ui-v3/kaksha/nav-model.ts";
import { dayOf } from "../src/child/growth.ts";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const dock = ["home", "world", "practice", "ask", "notebook"].map((key) => ({ key, to: `/${key}`, label: key }));
const keys = (plan) => dockForPlan(dock, { source: "server", packReady: false, ...plan }).map((i) => i.key);

test("APP-31: the dock follows the plan's own rules for Practice and Ask", () => {
  assert.deepEqual(keys({ state: "start" }), ["home", "world", "practice", "ask", "notebook"]);
  assert.deepEqual(keys({ state: "capped" }), ["home", "world", "ask", "notebook"]);
  assert.deepEqual(keys({ state: "resting" }), ["home", "world", "ask", "notebook"]);
  assert.deepEqual(keys({ state: "offline" }), ["home", "world", "notebook"]);
  assert.deepEqual(keys({ state: "offline", packReady: true }), ["home", "world", "practice", "notebook"]);
  assert.deepEqual(keys({ state: "safety_hold" }), ["home", "world", "notebook"]);
  assert.deepEqual(keys({ state: "start", source: "loading" }), ["home", "world", "ask", "notebook"]);
});

test("APP-32: one date format whatever the phone's locale", () => {
  const ms = Date.parse("2026-11-03T12:00:00Z");
  assert.equal(dayOf(ms), dayOf("2026-11-03T12:00:00Z"));
  assert.match(dayOf(ms), /^3 Nov$/);
  assert.match(dayOf(ms, true), /^3 November$/);
  for (const f of ["src/child/screens/Notebook.tsx", "src/child/screens/NotebookMade.tsx", "src/child/screens/NotebookJar.tsx", "src/child/screens/Remembers.tsx", "src/ui-v3/kaksha/views.tsx"]) {
    assert.doesNotMatch(read(f), /toLocaleDateString\(undefined/, f);
  }
});

test("APP-35: a paired device with no parent sign-in reads the child route first, never /api/me", async () => {
  const { meOrChildDevice } = await import("../src/app/device.ts");
  const cid = "11111111-2222-3333-4444-555555555555";
  const calls = [];
  const real = globalThis.fetch;
  globalThis.document = { cookie: `tx_paired=${cid}` };
  globalThis.fetch = async (u) => { calls.push(String(u)); return new Response(JSON.stringify({ me: { children: [{ id: cid }] } }), { status: 200, headers: { "content-type": "application/json" } }); };
  try {
    const me = await meOrChildDevice(async () => { calls.push("/api/me"); throw new Error("must not be asked"); });
    assert.equal(me.scope, "child");
    assert.ok(!calls.includes("/api/me"));
    assert.ok(calls.some((c) => c.includes("/api/child/boot")));
  } finally { globalThis.fetch = real; delete globalThis.document; }
});

test("APP-34: the brand script no longer overwrites the shipped manifest; APP-51: one theme colour", () => {
  assert.doesNotMatch(read("src/app/landing/brand.mjs"), /writeFileSync\([^)]*manifest/);
  const mf = JSON.parse(read("public/manifest.webmanifest"));
  assert.equal(mf.theme_color, "#08090B");
  assert.equal(mf.background_color, "#08090B");
  assert.match(read("index.html"), /theme-color" content="#08090B"/);
});

test("APP-23: the number pad is keyed on the question", () => {
  assert.match(read("src/child/lesson/AnswerTray.tsx"), /<Pad key=\{askKey \?\? ""\}/);
  assert.match(read("src/child/lesson/Desk.tsx"), /askKey=\{m\.ask\?\.itemId \?\? m\.ask\?\.text \?\? null\}/);
});

test("APP-24: Hello holds and clears the 'heard' timer, so Skip finishes once", () => {
  const h = read("src/child/screens/Hello.tsx");
  assert.match(h, /heardTimer\.current = window\.setTimeout/);
  assert.match(h, /const skipHi = \(\) => \{ stopHi\.current\(\); if \(heardTimer\.current !== null\) \{ clearTimeout\(heardTimer\.current\)/);
});

test("APP-25/26: stable end-screen loaders; a Made tile runs the finish step first", () => {
  const k = read("src/ui-v3/kaksha/lesson/KakshaLesson.tsx");
  assert.match(k, /const loadAfter = useCallback\(\(\) => loadMap\(cid\), \[loadMap, cid\]\)/);
  assert.match(k, /const loadMade = useCallback\(/);
  assert.match(read("src/ui-v3/kaksha/lesson/Debrief.tsx"), /onFinishTo\(madeTo\(it\.id\)\)/);
  assert.match(read("src/child/lesson/LessonScreen.tsx"), /if \(to\) \{ navigate\(to\); return; \}/);
  assert.match(read("src/child/lesson/useDesk.ts"), /finishTo: \(to\) => nav\.finished\(to\)/);
});

test("APP-27/28: Yesterday closes the sheet; a slow equip read never undoes the child's tap", () => {
  assert.match(read("src/ui-v3/kaksha/views.tsx"), /onClick=\{\(\) => \{ setWhen\(k\); setPick\(null\); \}\}/);
  const w = read("src/ui-v3/kaksha/screens/KakshaWorld.tsx");
  assert.match(w, /!touched\.current\) setEquipped\(eq\)/);
  assert.match(w, /touched\.current = true;/);
});

test("APP-29: a failed me refresh after the code is spent is not a failed pairing", () => {
  assert.match(read("src/app/Pair.tsx"), /try \{ await refreshMe\(\); \} catch/);
});

test("APP-30: Keep going resumes and replays like Continue", () => {
  const u = read("src/child/lesson/useDesk.ts");
  assert.match(u, /cancelEnd: \(\) => a\.resume\(\)/);
  assert.match(u, /sheet === "pause" \|\| sheet === "break" \|\| sheet === "end"\) && resumeTurn\.current/);
});

test("APP-33: a missing child has its own line; a paired device has no Switch learner row", () => {
  assert.match(read("src/child/ChildShell.tsx"), /state === "missing" \? tr7\("gate\.missing"\)/);
  assert.match(read("src/child/screens/Me.tsx"), /me\.scope !== "child" && <LinkRow to="\/who"/);
});

test("APP-50/52/53: one sign-in wording, /who goes to the class step, the pair clock is never stale", () => {
  const c = read("src/copy/en.ts");
  assert.doesNotMatch(c, /Wait a few minutes/);
  assert.match(c, /"auth\.err\.wait": "Too many tries\. Wait a minute, then try again\."/);
  assert.doesNotMatch(read("src/app/Who.tsx"), /"\/start\/lang"/);
  assert.match(read("src/app/PairCard.tsx"), /Math\.max\(now, Date\.now\(\)\)/);
});

test("APP-49: the comments no longer say the opposite of the code", () => {
  assert.doesNotMatch(read("src/child/routes.tsx"), /default off/);
  assert.doesNotMatch(read("src/child/screens/Notebook.tsx"), /no endpoint lists a child's lessons/);
  assert.doesNotMatch(read("src/child/lesson/LessonScreen.tsx"), /belongs to the child-routes owner/);
});

test("SEAM-11: the plan's schedule is carried to the home; SEAM-10: the opening time is formatted like the refused screen", async () => {
  const { scheduleFrom, fromServer } = await import("../src/child/plan.ts");
  assert.deepEqual(scheduleFrom({ schedule: { time: "17:00", minutes: 25, today: true } }), { time: "17:00", minutes: 25, today: true });
  assert.deepEqual(scheduleFrom({ schedule: { time: "17:00", today: false } }), { time: "17:00", minutes: null, today: false });
  assert.equal(scheduleFrom({ schedule: { time: "soon" } }), null);
  assert.equal(scheduleFrom({}), null);
  const p = fromServer({ state: "start", opensAt: null, plan: { openLesson: null, window: { from: "06:30", to: "21:30" } }, schedule: { time: "17:00", minutes: 20, today: true } });
  assert.equal(p.schedule?.time, "17:00");
  const v = read("src/ui-v3/kaksha/views.tsx");
  assert.match(v, /time: p\.opensAt \? clock\(p\.opensAt\) : ""/);
  assert.match(read("src/ui-v3/kaksha/screens/KakshaHome.tsx"), /lessonTime=\{plan\.schedule\?\.today \? clock\(plan\.schedule\.time\) : null\}/);
  assert.doesNotMatch(read("src/ui-v3/kaksha/copy.ts"), /\{time\} baje/);
  // the contract field itself is Brain's (patch to-brain/005-plan-schedule; status in docs/patches/INDEX.md): a gate test never
  // asserts on a patch file (tests/gate-reads-no-docs.test.mjs)
});
