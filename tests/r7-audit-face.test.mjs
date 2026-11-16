// Whole-project audit 2026-11-09, face area (docs/design/round7/audit/face.md). One test per fixed finding; each fails on
// the code before its fix.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/** The few page globals PuppetStage touches outside a rig, stubbed for one test and restored after it. */
function stubPage(t) {
  const names = ["document", "window", "devicePixelRatio", "requestAnimationFrame", "cancelAnimationFrame", "addEventListener", "removeEventListener"];
  const saved = Object.fromEntries(names.map((n) => [n, Object.getOwnPropertyDescriptor(globalThis, n)]));
  const rafs = new Map();
  let id = 0;
  const canvas = () => ({ style: {}, className: "", setAttribute() {}, addEventListener() {}, removeEventListener() {}, remove() { this.removed = true; }, clientWidth: 100, clientHeight: 100 });
  const put = (n, value) => Object.defineProperty(globalThis, n, { configurable: true, writable: true, value });
  put("document", { createElement: canvas, addEventListener() {}, removeEventListener() {}, visibilityState: "visible" });
  put("window", globalThis);
  put("devicePixelRatio", 1);
  put("requestAnimationFrame", (fn) => { rafs.set(++id, fn); return id; });
  put("cancelAnimationFrame", (h) => rafs.delete(h));
  put("addEventListener", () => {});
  put("removeEventListener", () => {});
  t.after(() => {
    for (const n of names) {
      if (saved[n]) Object.defineProperty(globalThis, n, saved[n]);
      else delete globalThis[n];
    }
  });
  return { rafs };
}

// FACE-01: the Help sheet mounts a second live face over the lesson's (Desk.tsx renders <HelpSheet> beside the body). The
// newest stage takes the page's one running slot and the lesson's stage is suspended. When the sheet closed, its stage was
// PARKED (stopped, kept for the next mount) but kept the slot until the park timer disposed it: 1.5 s, or 10 s for a
// worker-backed stage (the default). The lesson's face stood frozen on its last frame all that time, over her voice.
test("FACE-01: a parked stage hands the running slot back at once, so the face it suspended draws again", async (t) => {
  const { rafs } = stubPage(t);
  const { PuppetStage } = await import("../src/face-puppet/stage.ts");
  const host = { appendChild() {}, clientWidth: 100, clientHeight: 100 };
  const lesson = new PuppetStage(host, { band: "b2", sources: [] });
  const sheet = new PuppetStage(host, { band: "b2", sources: [] });
  lesson.start();
  sheet.start();
  assert.equal(lesson.running, false, "one running stage per page: the sheet's face suspends the lesson's");
  assert.equal(lesson.suspended, true);
  sheet.park();
  assert.equal(sheet.running, false, "a parked stage draws nothing");
  assert.equal(sheet.canvas.removed, true, "and leaves the page");
  assert.equal(lesson.running, true, "the lesson's face resumes when the sheet's is parked, not when its park timer fires");
  assert.equal(rafs.size, 1, "exactly one frame loop is scheduled");
  // adopted again (the next mount of the same teacher): it takes the slot back
  sheet.start();
  assert.equal(sheet.running, true);
  assert.equal(lesson.running, false);
  sheet.dispose();
  assert.equal(lesson.running, true, "disposing the foreground stage still resumes the one under it");
  lesson.dispose();
  assert.match(src("src/face-puppet/PuppetFace.tsx"), /function park\([^)]*\): void \{[\s\S]*?stage\.park\(\);/, "PuppetFace parks through stage.park()");
});

// FACE-02: the production image copies dist/ and not public/ (Dockerfile), and the greeting looked for its clip only under
// public/audio: in production `clip` was always null, so her once-a-day greeting could never sound.
test("FACE-02: a greeting clip is found where the production image keeps it (dist/audio), and in a checkout (public/audio)", async () => {
  const G = await import("../server/face-puppet/greetings.js");
  const dirs = G.clipDirs({});
  assert.match(dirs[0], /\/dist\/$/, "the built client first");
  assert.match(dirs[1], /\/public\/$/);
  assert.equal(G.clipDirs({ TAXILA_DIST: "/srv/build" })[0], "/srv/build/", "the build the server really serves (serve.mjs TAXILA_DIST)");
  const only = (dir) => (f) => f === `${dir}audio/hello-day-en-m1.mp3`;
  assert.equal(G.clipExists("en-m1", only(dirs[0])), true, "the image: the clip is in dist/audio only");
  assert.equal(G.clipExists("en-m1", only(dirs[1])), true, "a checkout: public/audio");
  assert.equal(G.clipExists("en-m2", only(dirs[0])), false);
  const docker = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.match(docker, /COPY --from=build \/app\/dist \.\/dist/);
  assert.doesNotMatch(docker, /COPY public /, "if the image ever copies public/, this finding's premise changes");
});

// FACE-04: the day's greeting was marked as given before the clip played, and the trigger was pointerdown, which does not
// unlock sound for a touch. A refused play, a load error or a Start tap that left the home spent the greeting silently.
test("FACE-04: the greeting starts on a gesture that unlocks sound, and the day is spent only once she is heard", async () => {
  const G = await import("../src/face-puppet/useDailyGreeting.ts");
  assert.deepEqual([...G.GREETING_GESTURES], ["pointerup", "keydown"], "touch activation is granted on pointerup, never pointerdown");
  const h = src("src/face-puppet/useDailyGreeting.ts");
  assert.doesNotMatch(h, /"pointerdown"/);
  assert.match(h, /for \(const t of GREETING_GESTURES\)/);
  assert.match(h, /addEventListener\("playing", \(\) => \{ if \(!alive\) return; mark\(g\.day\); setSpeaking\(true\); \}\)/, "marked at her first sound");
  assert.match(h, /if \(!g\.clip\) \{ mark\(g\.day\); glance\(\); return; \}/, "no clip: the glance is the greeting");
  const go = h.slice(h.indexOf("const go = () =>"), h.indexOf("audio.play()"));
  assert.equal((go.match(/mark\(g\.day\)/g) ?? []).length, 2, "no unconditional mark before play()");
});

// FACE-05: <Protege> asked for a glance every 3.6 s while she LISTENED too, and Behaviour.lookAt drops a look in
// listening (she keeps her eyes on the child), so those cues were emitted and never seen.
test("FACE-05: the protege glance is asked for only in states where her eyes can go there", async () => {
  const { Behaviour } = await import("../src/avatar/behaviour.ts");
  const looked = (state) => {
    const b = new Behaviour({ band: "b1", seed: 3 });
    b.setState(state);
    b.update(1, { herRms: 0, herVoiced: false, childLevel: 0 });
    b.lookAt(18, -10, 1.3, "protege");
    return b.log.some((e) => e.detail === "look:protege");
  };
  assert.equal(looked("listening"), false, "a look while the child talks is dropped by design");
  assert.equal(looked("speaking"), true);
  assert.equal(looked("your_turn"), true);
  const t = src("src/ui/teacher/Teacher.tsx");
  assert.match(t, /glance=\{p\.floor === "speaking" \|\| p\.floor === "your_turn"\}/);
  assert.doesNotMatch(t, /glance=\{[^}]*listening/);
});

// FACE-06: the caption said the name the child gave her; the face's accessible name and the voice ring said "Asha".
test("FACE-06: the face is named as the caption names her", () => {
  assert.match(src("src/ui/teacher/Teacher.tsx"), /name=\{rec\.name\}/);
  assert.match(src("src/face-puppet/LessonFace.tsx"), /name=\{p\.name\}/);
  assert.match(src("src/face-puppet/PuppetFace.tsx"), /const label = `\$\{p\.name\?\.trim\(\) \|\| tutor\.displayName\.roman\}, /);
  const tf = src("src/avatar/TutorFace.tsx");
  assert.match(tf, /const shownName = p\.name\?\.trim\(\) \|\| tutor\.displayName\.roman;/);
  assert.match(tf, /tx-tutorface-name" aria-hidden="true">\{shownName\}</, "the voice ring prints the same name");
  assert.doesNotMatch(tf, /const label = `\$\{tutor\.displayName\.roman\}/);
});

// FACE-08: two class -> band tables; class 4 was b2 in one and b3 in the other.
test("FACE-08: shared/tutors.js bandOfClass agrees with the app's bandForClass for every class", async () => {
  const { bandOfClass } = await import("../shared/tutors.js");
  const { bandForClass } = await import("../src/child/band.ts");
  for (let c = 1; c <= 9; c++) assert.equal(bandOfClass(c), bandForClass(c), `class ${c}`);
  assert.equal(bandOfClass(4), "b3");
});

// FACE-09: GET /api/tutors answered the raw saved id (a parked tutor for an old row) beside tutors: ["asha"].
test("FACE-09: GET /api/tutors names the teacher the child really has", async () => {
  const T = await import("../server/routes/tutor.js");
  const sent = {};
  const res = { writeHead(code, h) { sent.code = code; sent.h = h; }, setHeader() {}, end(b) { sent.body = JSON.parse(b); } };
  const child = { id: "00000000-0000-4000-8000-000000000001", class_level: 7, teacher_id: "arjun", teacher_name: null, tutor_chosen_at: null, first_name: "A", language_pref: "english" };
  const saved = { requireChild: T.deps.requireChild, one: T.deps.one };
  T.deps.requireChild = async () => ({ child });
  T.deps.one = async () => null; // no live lesson
  try {
    await T.routes["GET /api/tutors"]({ url: `/api/tutors?childId=${child.id}`, headers: {} }, res);
  } finally {
    Object.assign(T.deps, saved);
  }
  assert.equal(sent.body.current, "asha");
  assert.ok(sent.body.tutors.includes(sent.body.current), "current is always one of the offered tutors");
});

// FACE-07: the greeting never repeats yesterday's line, claims no history, and turns its day at 04:00 like Kaksha Home.
test("FACE-07: a child never gets the same greeting line two days running", async () => {
  const { lineIndex } = await import("../server/face-puppet/greetings.js");
  for (let c = 0; c < 200; c++) {
    let prev = -1;
    for (let d = 1; d <= 40; d++) {
      const i = lineIndex(`child-${c}`, `2026-11-${String(d).padStart(2, "0")}`.replace(/^2026-11-(3[1-9]|[4-9]\d)$/, (_, n) => `2026-12-${String(n - 30).padStart(2, "0")}`), 3);
      assert.notEqual(i, prev, `child-${c} day ${d}`);
      prev = i;
    }
  }
  assert.equal(lineIndex("c-1", "2026-11-04", 3), lineIndex("c-1", "2026-11-04", 3), "stable within a day");
});

test("FACE-07: no greeting line claims a history; each slot keeps three lines", async () => {
  const { GREETINGS } = await import("../server/face-puppet/greetings.js");
  for (const parts of Object.values(GREETINGS)) for (const lines of Object.values(parts)) {
    assert.equal(lines.length, 3);
    for (const [id, t] of lines) assert.doesNotMatch(t, /again|left off|jahan ruke|फिर से|रुके थे|phir se/i, id);
  }
});

test("FACE-07: the server's day and Kaksha Home's greeting word share one 04:00 helper", async () => {
  const { partOfDay, learningDay, DAY_START_HOUR } = await import("../shared/day.js");
  assert.equal(DAY_START_HOUR, 4);
  assert.equal(partOfDay(3), "evening"); assert.equal(partOfDay(4), "morning");
  assert.equal(learningDay(new Date("2026-11-04T19:00:00Z"), "Asia/Kolkata").day, "2026-11-04");
  const home = readFileSync(new URL("../src/ui-v3/kaksha/screens/KakshaHome.tsx", import.meta.url), "utf8");
  assert.match(home, /shared\/day\.js/);
  const srv = readFileSync(new URL("../server/face-puppet/greetings.js", import.meta.url), "utf8");
  assert.match(srv, /shared\/day\.js/);
});
